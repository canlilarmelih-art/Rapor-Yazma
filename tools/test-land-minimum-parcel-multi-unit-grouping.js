"use strict";

/*
  Kullanici talebi (2026-09-16): "5403 Sayılı Kanuna Göre Minimum Parsel
  Kontrolü bunu çoklamamız lazım dikili arazi kuru ve sulu tarıma göre
  raporda yer alan taşınmazları gruplayarak her grup için ayrı cümle kur
  tamamı aynı grup ise tek cümle kur."

  Kok durum: buildLandMinimumParcelAssessmentSentence() yalnizca AKTIF
  tasinmazin (state.fields) kendi Arazi Siniflandirmasi/Tarim Turu/alan
  bilgisine bakiyordu - Coklu Talep raporlarinda diger tasinmazlarin
  degerlendirmesi hic gosterilmiyordu.

  Duzeltme: getMinimumAgriculturalParcelLimitForFields(fields) - cekirdek
  hesaplama artik HERHANGI bir tasinmazin fields nesnesiyle calisabiliyor.
  buildLandMinimumParcelAssessmentMultiUnitSentence() - TUM tasinmazlari
  (getNarrativeTitleUnitFields()) degerlendirip arazi turune (Dikili Arazi/
  Kuru Arazi/Sulu Arazi) VE il/ilceye gore GRUPLAR; her grup icin PAYLASIMLI
  siniflandirma/tarim turu/il-ilce/minimum sinir + HER tasinmazin kendi
  alan/sonucunu listeleyen TEK bir blok uretir. TUM tasinmazlar AYNI grupta
  ise dogal olarak TEK blok (coklanmamis) cikar.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

const start = appSource.indexOf("function getMinimumAgriculturalParcelLimitForFields(");
const end = appSource.indexOf("function refreshLandMinimumParcelAssessment()", start);
assert(start >= 0 && end > start, "5403 minimum parsel fonksiyonlari bulunamadi.");
const source = appSource.slice(start, end);

function evaluate(activeFields, titleUnits) {
  const context = {
    state: { fields: activeFields, titleUnits, activeTitleUnitIndex: 0, primaryTitleUnitShadow: null },
    globalThis: {
      MinimumAgriculturalParcelSizes: [
        { city: "Bursa", district: "Karacabey", suluM2: 65000, kuruM2: 140000, dikiliM2: 10000 },
        { city: "Bursa", district: "Gürsu", suluM2: 40000, kuruM2: 100000, dikiliM2: 8000 },
      ],
    },
    shouldHideLandAgricultureControls: () => false,
    isMultiTitleUnitReportForNarrative: () => (titleUnits?.length || 0) > 0,
    // getNarrativeTitleUnitFields()'in GERÇEK davranışının SADELEŞTİRİLMİŞ
    // (ama yeterli — index 0 aktif, sonrası titleUnits) taklidi.
    getNarrativeTitleUnitFields: () => [activeFields, ...(titleUnits || []).map((u) => u.fields)],
    formatTitleUnitParcelLabel: (blockNo, parcelNo, fallbackIndex) => {
      const block = String(blockNo || "").trim();
      const parcel = String(parcelNo || "").trim();
      if (block && parcel) return `${block} Ada ${parcel} Parsel`;
      if (parcel) return `${parcel} Parsel`;
      if (block) return `${block} Ada`;
      return `${fallbackIndex + 1}. taşınmaz`;
    },
    formatTurkishList: (items = []) => {
      const list = items.map((item) => String(item || "").trim()).filter(Boolean);
      if (list.length <= 1) return list[0] || "";
      if (list.length === 2) return `${list[0]} ve ${list[1]}`;
      return `${list.slice(0, -1).join(", ")} ve ${list.at(-1)}`;
    },
    foldTurkish: (value) => String(value || "").toLocaleUpperCase("tr-TR")
      .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
      .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C"),
    parseReportNumber: (value) => Number(String(value).replaceAll(".", "").replace(",", ".")),
    normalizeReportTitleText: (value) => String(value || "").trim(),
  };
  vm.runInNewContext(source, context);
  return context.buildLandMinimumParcelAssessmentSentence();
}

// --- 1) KULLANICI TALEBİ: TÜM taşınmazlar AYNI grupta (Sulu Tarım, aynı ---
// il/ilçe) -> TEK (çoklanmamış) blok, HER taşınmazın kendi ada/parsel
// etiketiyle listelenir.
{
  const active = {
    titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "70000",
    landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
    blockNo: "0", parcelNo: "56",
  };
  const unit2 = {
    fields: {
      titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "50000",
      landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
      blockNo: "0", parcelNo: "215",
    },
  };
  const text = evaluate(active, [unit2]);
  assert.equal((text.match(/minimum parsel sınırı/g) || []).length, 1, `KULLANICI TALEBİ: tamamı aynı grupta ise TEK blok üretilmeli (çoklanmamalı), bulunan: ${text}`);
  assert.match(text, /0 Ada 56 Parsel'in 70\.000 m² yüzölçümü bu sınırı karşılamaktadır/, `1. taşınmaz kendi ada/parsel etiketiyle listelenmeli, bulunan: ${text}`);
  assert.match(text, /0 Ada 215 Parsel'in 50\.000 m² yüzölçümü bu sınırı karşılamamaktadır/, `2. taşınmaz kendi ada/parsel etiketiyle listelenmeli, bulunan: ${text}`);
  assert.match(text, /^Bursa\/Karacabey için Arazi Sınıflandırması Mutlak Tarım Arazisi ve Tarım Türü Sulu Tarım dikkate alındığında, Sulu Arazi bakımından 5403 sayılı Kanuna göre belirlenen minimum parsel sınırı 65\.000 m²'dir\./, `Paylaşımlı lead-in TEK kez gelmeli, bulunan: ${text}`);
  console.log("KULLANICI TALEBİ: tüm taşınmazlar aynı grupta -> TEK blok testi tamam.");
}

// --- 2) KULLANICI TALEBİ: farklı gruplar (Dikili / Kuru / Sulu) -> HER ----
// grup için AYRI bir blok üretilmeli.
{
  const active = {
    titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "12000",
    landClassification: "Dikili Tarım Arazisi", landAgricultureType: "Kuru Tarım",
    blockNo: "0", parcelNo: "56",
  };
  const unit2 = {
    fields: {
      titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "150000",
      landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Kuru Tarım",
      blockNo: "0", parcelNo: "215",
    },
  };
  const unit3 = {
    fields: {
      titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "70000",
      landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
      blockNo: "1", parcelNo: "10",
    },
  };
  const text = evaluate(active, [unit2, unit3]);
  assert.equal((text.match(/minimum parsel sınırı/g) || []).length, 3, `KULLANICI TALEBİ: 3 farklı grup -> 3 AYRI blok üretilmeli, bulunan: ${text}`);
  assert.match(text, /Dikili Arazi bakımından 5403 sayılı Kanuna göre belirlenen minimum parsel sınırı 10\.000 m²'dir\. 0 Ada 56 Parsel'in 12\.000 m² yüzölçümü bu sınırı karşılamaktadır\./, `Dikili Arazi grubu (tek üyeli) doğru üretilmeli, bulunan: ${text}`);
  assert.match(text, /Kuru Arazi bakımından 5403 sayılı Kanuna göre belirlenen minimum parsel sınırı 140\.000 m²'dir\. 0 Ada 215 Parsel'in 150\.000 m² yüzölçümü bu sınırı karşılamaktadır\./, `Kuru Arazi grubu doğru üretilmeli, bulunan: ${text}`);
  assert.match(text, /Sulu Arazi bakımından 5403 sayılı Kanuna göre belirlenen minimum parsel sınırı 65\.000 m²'dir\. 1 Ada 10 Parsel'in 70\.000 m² yüzölçümü bu sınırı karşılamaktadır\./, `Sulu Arazi grubu doğru üretilmeli, bulunan: ${text}`);
  console.log("KULLANICI TALEBİ: farklı gruplar (Dikili/Kuru/Sulu) -> AYRI bloklar testi tamam.");
}

// --- 3) Aynı arazi türü ama FARKLI il/ilçe (farklı minimum sınır) -> AYRI --
// grup sayılmalı (minimum sınır il/ilçeye göre değişir, karıştırılmamalı).
{
  const active = {
    titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "70000",
    landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
    blockNo: "0", parcelNo: "56",
  };
  const unit2 = {
    fields: {
      titleCity: "Bursa", titleDistrict: "Gürsu", landArea: "45000",
      landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
      blockNo: "5", parcelNo: "12",
    },
  };
  const text = evaluate(active, [unit2]);
  assert.equal((text.match(/minimum parsel sınırı/g) || []).length, 2, `Farklı il/ilçedeki aynı arazi türü AYRI grup sayılmalı, bulunan: ${text}`);
  assert.match(text, /Karacabey.*65\.000 m²/, `Karacabey'in kendi sınırı (65.000) kullanılmalı, bulunan: ${text}`);
  assert.match(text, /Gürsu.*40\.000 m²/, `Gürsu'nun kendi sınırı (40.000) kullanılmalı, bulunan: ${text}`);
  console.log("Aynı arazi türü, farklı il/ilçe -> AYRI grup (REGRESYON güvenliği) testi tamam.");
}

// --- 4) REGRESYON: TEKİL (çoklu taşınmaz DEĞİL) raporlarda eski davranış --
// (formatTitleUnitParcelLabel öneki OLMADAN, "Parselin ... yüzölçümü")
// AYNEN korunmalı.
{
  const text = evaluate({
    titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "70000",
    landClassification: "Mutlak Tarım Arazisi", landAgricultureType: "Sulu Tarım",
  }, []);
  assert.equal(
    text,
    "Parselin 70.000 m² yüzölçümü; Arazi Sınıflandırması Mutlak Tarım Arazisi ve Tarım Türü Sulu Tarım dikkate alındığında, Bursa/Karacabey için Sulu Arazi bakımından 5403 sayılı Kanuna göre belirlenen 65.000 m² minimum parsel sınırını karşılamaktadır.",
    `REGRESYON: tekil raporda eski TEKİL cümle biçimi AYNEN korunmalı, bulunan: ${text}`,
  );
  console.log("REGRESYON: tekil rapor eski cümle biçimi testi tamam.");
}

// --- 5) REGRESYON: çoklu taşınmaz ama HİÇBİRİNDE değerlendirilebilir veri --
// yoksa (ör. hiçbirinde sınıflandırma girilmemiş) eski TEKİL tanılama
// mesajına GÜVENLİ düşülmeli.
{
  const text = evaluate({
    titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "70000",
    landAgricultureType: "Sulu Tarım",
    // landClassification YOK.
  }, [{ fields: { titleCity: "Bursa", titleDistrict: "Karacabey", landArea: "50000", landAgricultureType: "Sulu Tarım" } }]);
  assert.match(text, /Arazi Sınıflandırması bilgisi girilmediğinden/, `REGRESYON: hiçbir taşınmaz değerlendirilemediğinde TEKİL tanılama mesajına düşülmeli, bulunan: ${text}`);
  console.log("REGRESYON: çoklu raporda hiçbir taşınmaz değerlendirilemezse tanılama mesajı testi tamam.");
}

console.log("5403 Sayılı Kanuna Göre Minimum Parsel Kontrolü çoklu taşınmaz gruplama testleri başarılı.");
