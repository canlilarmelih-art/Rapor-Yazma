"use strict";

/*
  Kullanıcı bildirimi (2026-09-13, İşyerleri): "işyerleri için aynı
  konutlardaki gibi gruplandırma yapmak istedik ama istediğimiz sonuca
  ulaşamadık" + GERÇEK bir "OLUŞTURULAN PARAGRAF"/"İSTENİLEN PARAGRAF"
  karşılaştırması: "Ofis", "Açık ofis alanı" ve "Yönetici odası" ZEMİN/
  DUVARI AYNI olsa bile HER BİRİ AYRI bir cümlede kalıyordu ("Acık ofis
  alanı hacimlerinde ... Ofis hacimlerinde ... Yonetıcı odası
  hacimlerinde ..." — ÜÇ AYRI, tekrarlı cümle), OYSA istenen: "Acık ofis
  alanı, Yönetici Odası ve Ofis hacimlerinde ..." TEK birleşik cümle.
  Ayrıca "Yönetici odası" etiketi BOZUK ("Yonetıcı odası") görünüyordu.

  Kök neden #1 (getDynamicDecorativeAreaGroup): `foldTurkish()` ÖNCE
  `.toLocaleUpperCase("tr")` uygulayıp ASCII büyük harfe (İ->I) indirger
  (ör. "Ofis" -> "OFIS"). Bu fonksiyon SONRASINDA o ASCII büyük harfli
  sonucu TEKRAR `.toLocaleLowerCase("tr")` ile küçültüyordu — Türkçe
  yerel ayarında düz ASCII "I" harfinin küçüğü "i" DEĞİL NOKTASIZ "ı"dır
  (ünlü Türkçe I sorunu, TERSİNDEN): "Ofis" -> "ofıs", "Yönetici odası"
  -> "yonetıcı odası" — İKİSİ DE aşağıdaki ASCII "i" içeren regex'le
  ASLA eşleşmiyordu; grup HER ZAMAN "administrative" YERİNE bu BOZUK
  dizenin KENDİSİ oluyordu (VE bu bozuk dize doğrudan CÜMLEYE de
  SIZIYORDU — getDynamicDecorativeAreaGroupPrefix'in "administrative
  DEĞİLSE" dalı üzerinden). Düzeltme: foldTurkish() çıktısı zaten SAF
  ASCII büyük harf olduğundan `.toLocaleLowerCase("tr")` YERİNE DÜZ
  (yerel ayarsız) `.toLowerCase()` kullanmak yeterli ve güvenli.

  Kök neden #2 (getDynamicDecorativeAreaGroupPrefix, 3+ isim): kök neden
  #1 yüzünden bu dal HİÇ ÇALIŞMADIĞINDAN şimdiye kadar fark edilmemiş
  İKİNCİ bir kusur: `formatTurkishList(head)` ZATEN 2+ öğeli listelerde
  KENDİSİ " ve " ekliyordu — koddaki `${formatTurkishList(head)}, ve
  ${lastLocative}` bunun ÜZERİNE AYRICA " ve " eklediğinden ("açık ofis
  alanı ve ofis, ve yönetici odalarında" gibi) ÇİFT "ve"li, yanlış
  virgüllü bir metin çıkıyordu. Düzeltme: `head` düz virgülle birleştirilir
  (`head.join(", ")`), tek "ve" yalnızca SONDA kalır.

  Bu test dosyası bu bölgenin TAMAMEN test KAPSAMI DIŞINDA olduğunu
  fark ederek (tools/test-multi-unit-interior-description.js
  getUnitDecorativeDescriptionPartsForCombinedText()'i SAHTELİYOR,
  buildDynamicDecorativeAreaPartsForMultiUnitMerge() hiç çağrılmıyordu)
  GERÇEK fonksiyonlarla üç katmanı doğrular:
  1) getDynamicDecorativeAreaGroup(): Ofis/Açık ofis alanı/Yönetici
     odası/Toplantı odası/Eğitim odası/İdari HEPSİ "administrative"
     dönmeli; Dükkan/WC gibi idari OLMAYAN etiketler KENDİ folded
     halini (bozulmadan) döner.
  2) getDynamicDecorativeAreaGroupPrefix(): 1/2/3+ isim senaryolarında
     çift "ve" YOK, doğru Türkçe liste biçimi.
  3) buildDynamicDecorativeAreaPartsForMultiUnitMerge(): AYNI zemin/duvara
     sahip 3 idari alan (Ofis/Açık ofis alanı/Yönetici odası) artık
     AYNI "dynamicArea:" anahtarını paylaşıyor (birleşmenin veri
     katmanındaki ön koşulu) — Dükkan (farklı grup/zemin/duvar) kendi
     AYRI anahtarında kalıyor.

  GÜNCELLEME (2026-09-15, "Duvar ve Zemin" tablosu grup düzeltmesi):
  "WC" artık bu senaryoda PARTS listesinde HİÇ görünmüyor — kullanıcının
  ayrı bir bildirimiyle (bkz. getUnitDecorativeWallFloorRows() üzerindeki
  yorum) Banyo/WC/Duş artık DİNAMİK bir "unitDecorativeArea_*" anahtarı
  DEĞİL, SABİT "Islak Hacimler" satırının (unitWetFloor/unitWetWall)
  KENDİSİ olarak eşleşiyor; bu fonksiyon SADECE dinamik (eşlenmemiş)
  satırları döndürdüğünden WC artık bu listenin KAPSAMI DIŞINDA (doğru
  davranış — WC verisi artık gerçek rapor paragrafının okuduğu ALANA
  yazılıyor, önceki gibi kullanılmayan bir dinamik anahtara DEĞİL).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  return extractFunctionBodyFrom(start);
}
function extractFunctionBodyFrom(start) {
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") { parenDepth -= 1; if (parenDepth === 0) break; }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return appSource.slice(start + 1, index + 1); }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}
function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert.ok(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") { depth -= 1; if (depth === 0) return `${appSource.slice(start, index + 1)};`; }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "foldTurkish",
  "parseUnitInteriorItem",
  "normalizeUnitInteriorName",
  "getUnitFloorRows",
  "getUnitDecorativeFieldValue",
  "getUnitDecorativeWallFloorRows",
  "getDynamicDecorativeAreaGroup",
  "getDynamicDecorativeAreaPrefix",
  "getDynamicDecorativeAreaGroupPrefix",
  "formatTurkishList",
  "composeSingleAreaDecorativeSentence",
  "normalizeDecorativeMaterial",
  "toLowerText",
  "formatWallMaterialPhrase",
  "capitalizeSentence",
  "buildDynamicDecorativeAreaPartsForMultiUnitMerge",
];
const constArrayNames = [
  "unitWallFloorRows",
  "singleAreaDecorativeBothSameVariants",
  "singleAreaDecorativeBothDiffVariants",
  "singleAreaDecorativeFloorOnlyVariants",
  "singleAreaDecorativeWallOnlyVariants",
];

function buildSandbox() {
  const sandboxSource = `
    let state = {};
    function normalizeReportTitleText(value) { return String(value || "").trim(); }
    function selectVariant() { return 0; }
    function registerVariantGroup() {}
    ${constArrayNames.map(extractConstArray).join("\n")}
    ${functionNames.map(extractFunction).join("\n")}
    return {
      setState: (s) => { state = s; },
      getDynamicDecorativeAreaGroup,
      getDynamicDecorativeAreaGroupPrefix,
      buildDynamicDecorativeAreaPartsForMultiUnitMerge,
      getUnitDecorativeWallFloorRows,
    };
  `;
  return new Function(sandboxSource)();
}

// --- 1) getDynamicDecorativeAreaGroup(): idari etiketler artık gerçekten
// "administrative" dönüyor (regex ASCII "i" ile eşleşiyor, bozuk "ı" YOK).
{
  const fns = buildSandbox();
  ["Açık ofis alanı", "Ofis", "Yönetici odası", "Toplantı odası", "Eğitim odası", "İdari"].forEach((label) => {
    assert.equal(
      fns.getDynamicDecorativeAreaGroup(label),
      "administrative",
      `"${label}" idari grup ("administrative") dönmeli, folding kusuruyla kendi bozuk halini DÖNMEMELİ: ${fns.getDynamicDecorativeAreaGroup(label)}`
    );
  });
  // İdari OLMAYAN etiketler (harflerinde "i" GEÇMEYEN, bu yüzden eski
  // kusurdan zaten etkilenmeyen örnekler) davranışı DEĞİŞMEMELİ.
  assert.equal(fns.getDynamicDecorativeAreaGroup("Dükkan"), "dukkan", "Dükkan idari olmayan kendi folded halini dönmeli (regresyon yok).");
  assert.equal(fns.getDynamicDecorativeAreaGroup("WC"), "wc", "WC idari olmayan kendi folded halini dönmeli (regresyon yok).");
  console.log("getDynamicDecorativeAreaGroup(): idari etiketler artık gerçekten 'administrative' dönüyor testi tamam.");
}

// --- 2) getDynamicDecorativeAreaGroupPrefix(): çift "ve" YOK, doğru liste.
{
  const fns = buildSandbox();
  assert.equal(fns.getDynamicDecorativeAreaGroupPrefix("administrative", ["Ofis"]), "ofis bölümlerinde", "Tek 'Ofis' özel biçimini korumalı.");
  assert.equal(
    fns.getDynamicDecorativeAreaGroupPrefix("administrative", ["Yönetici odası"]),
    "yönetici odası hacimlerinde",
    "Tek (Ofis DIŞI) idari alan genel biçimi kullanmalı."
  );
  assert.equal(
    fns.getDynamicDecorativeAreaGroupPrefix("administrative", ["Toplantı odası", "Eğitim odası"]),
    "toplantı odası ve eğitim odalarında",
    "İKİ isimli liste TEK 've' ile birleşmeli (regresyon yok)."
  );
  const threeNamePrefix = fns.getDynamicDecorativeAreaGroupPrefix("administrative", ["Açık ofis alanı", "Ofis", "Yönetici odası"]);
  assert.equal(
    threeNamePrefix,
    "açık ofis alanı, ofis ve yönetici odalarında",
    `ÜÇ+ isimli liste TEK 've' ile (virgüllü baş + son öğe) birleşmeli, ÇİFT 've' OLMAMALI: "${threeNamePrefix}"`
  );
  assert.equal((threeNamePrefix.match(/\bve\b/g) || []).length, 1, `Cümlede TEK BİR 've' bağlacı olmalı: "${threeNamePrefix}"`);
  console.log("getDynamicDecorativeAreaGroupPrefix(): 1/2/3+ isim senaryolarında çift 've' kusuru testi tamam.");
}

// --- 3) buildDynamicDecorativeAreaPartsForMultiUnitMerge(): AYNI zemin/
// duvarlı 3 idari alan artık AYNI anahtarı paylaşıyor (birleşmenin veri
// katmanı ön koşulu) — kullanıcının GERÇEK senaryosu (Dükkan + Açık ofis
// alanı + Ofis + Yönetici odası + WC, idari üçlü AYNI malzeme). WC artık
// (2026-09-15 düzeltmesi) SABİT "Islak Hacimler" satırına eşlendiğinden
// bu dinamik listenin KAPSAMI DIŞINDA kalmalı (bkz. dosya başı GÜNCELLEME
// notu).
{
  const fns = buildSandbox();
  const state = {
    tables: {
      unitFloors: [{ interiors: "Dükkan, Açık ofis alanı, Ofis, Yönetici odası, WC" }],
    },
    fields: {
      unitDecorativeArea_other_dukkan_floor: "Seramik",
      unitDecorativeArea_other_dukkan_wall: "Alçı Sıva Üzeri Saten Boyalı",
      // NOT: aşağıdaki üç anahtar adı getUnitDecorativeWallFloorRows()'un
      // GERÇEK (bilerek DOKUNULMAYAN — alan kimliği/persist anahtarı, eski
      // raporlarla geri uyumluluk riski) folded-suffix üretimiyle BİREBİR
      // eşleşmeli, yoksa getUnitDecorativeFieldValue() boş döner.
      unitDecorativeArea_other_ac_k_of_s_alan__floor: "Laminant Parke",
      unitDecorativeArea_other_ac_k_of_s_alan__wall: "Alçı Sıva Üzeri Saten Boyalı",
      unitDecorativeArea_other_of_s_floor: "Laminant Parke",
      unitDecorativeArea_other_of_s_wall: "Alçı Sıva Üzeri Saten Boyalı",
      unitDecorativeArea_other_yonet_c_odas__floor: "Laminant Parke",
      unitDecorativeArea_other_yonet_c_odas__wall: "Alçı Sıva Üzeri Saten Boyalı",
      // WC artık BURADA (dinamik anahtar) DEĞİL, gerçek "Islak Hacimler"
      // alanında (unitWetFloor/unitWetWall) yaşar — bkz. senaryo 4.
      unitWetFloor: "Seramik",
      unitWetWall: "Fayans",
    },
  };
  fns.setState(state);
  const parts = fns.buildDynamicDecorativeAreaPartsForMultiUnitMerge();
  assert.equal(parts.length, 4, `4 idari/diğer satır (Dükkan, Açık ofis alanı, Ofis, Yönetici odası — WC ARTIK DAHİL DEĞİL) dönmeli: ${parts.length}`);
  const officeParts = parts.filter((p) => p.dynamicMeta.group === "administrative");
  assert.equal(officeParts.length, 3, `3 idari satır (Açık ofis alanı/Ofis/Yönetici odası) 'administrative' grubunda olmalı: ${officeParts.length}`);
  const officeKeys = new Set(officeParts.map((p) => p.key));
  assert.equal(officeKeys.size, 1, `AYNI zemin/duvarlı 3 idari alan AYNI 'dynamicArea:' anahtarını PAYLAŞMALI (birleşmenin ön koşulu): ${[...officeKeys]}`);
  const dukkanKey = parts.find((p) => p.dynamicMeta.label === "Dükkan").key;
  assert.notEqual(dukkanKey, [...officeKeys][0], "Dükkan (farklı zemin/duvar) idari grupla AYNI anahtarı PAYLAŞMAMALI.");
  assert.equal(parts.find((p) => p.dynamicMeta.label === "WC"), undefined, "WC artık FIXED 'Islak Hacimler' satırına eşleniyor, dinamik alan listesinde YER ALMAMALI.");
  console.log("buildDynamicDecorativeAreaPartsForMultiUnitMerge(): aynı zemin/duvarlı idari alanlar AYNI anahtarı paylaşıyor, WC artık dinamik listede değil testi tamam.");
}

// --- 4) getUnitDecorativeWallFloorRows(): Banyo/WC/Duş TEK "Islak Hacimler"
// satırında, Balkon/Teras TEK "Balkon / Teras" satırında GRUPLANMALI
// (kullanıcı bildirimi, 2026-09-15 ekran görüntüsü) — kullanıcının BİREBİR
// senaryosu: Salon, Oda, Antre-Hol, Mutfak, Banyo, WC, Balkon, Teras.
{
  const fns = buildSandbox();
  fns.setState({
    tables: { unitFloors: [{ interiors: "Salon, Oda, Antre-Hol, Mutfak, Banyo, WC, Balkon, Teras" }] },
    fields: {},
  });
  const rows = fns.getUnitDecorativeWallFloorRows();
  const labels = rows.map((row) => row.label);
  assert.equal(rows.length, 6, `8 farklı isim 6 GRUBA (Salon/Oda/Antre-Hol/Mutfak/Islak Hacimler/Balkon-Teras) düşmeli: ${labels.join(", ")}`);
  assert.deepEqual(labels, ["Salon", "Oda", "Antre-Hol", "Mutfak", "Islak Hacimler", "Balkon / Teras"], `Satır sırası/etiketleri: ${labels.join(", ")}`);
  const wetRow = rows.find((row) => row.label === "Islak Hacimler");
  assert.equal(wetRow.floorKey, "unitWetFloor", "Islak Hacimler satırı GERÇEK unitWetFloor alanını kullanmalı (Banyo/WC birbirinden AYRI dinamik alan ÜRETMEMELİ).");
  assert.equal(wetRow.wallKey, "unitWetWall", "Islak Hacimler satırı GERÇEK unitWetWall alanını kullanmalı.");
  const balconyRow = rows.find((row) => row.label === "Balkon / Teras");
  assert.equal(balconyRow.floorKey, "unitBalconyFloor", "Balkon / Teras satırı GERÇEK unitBalconyFloor alanını kullanmalı (Balkon/Teras birbirinden AYRI dinamik alan ÜRETMEMELİ).");
  assert.equal(balconyRow.wallKey, "unitBalconyWall", "Balkon / Teras satırı GERÇEK unitBalconyWall alanını kullanmalı.");
  console.log("getUnitDecorativeWallFloorRows(): Banyo/WC 'Islak Hacimler'de, Balkon/Teras 'Balkon / Teras'ta GRUPLANIYOR testi tamam.");
}

// --- 5) Duş dahil / karışık sıra + yalnızca Teras (Balkon YOK) senaryosu —
// gruplama SADECE Banyo+WC ikilisine özel bir hack DEĞİL, canonical
// tabanlı genel bir kural olmalı.
{
  const fns = buildSandbox();
  fns.setState({
    tables: { unitFloors: [{ interiors: "Oda, Duş, Teras, Banyo" }] },
    fields: {},
  });
  const rows = fns.getUnitDecorativeWallFloorRows();
  const labels = rows.map((row) => row.label);
  assert.deepEqual(labels, ["Oda", "Islak Hacimler", "Balkon / Teras"], `Duş+Banyo TEK 'Islak Hacimler', tek başına Teras da 'Balkon / Teras' satırına düşmeli: ${labels.join(", ")}`);
  console.log("Karışık sıra + Duş + yalnızca Teras senaryosu testi tamam.");
}

console.log("Dinamik dekoratif alan (İşyeri 'idari' grup birleştirme) testleri başarılı.");
