"use strict";

// Kullanıcı talebi (2026-08-12, düzeltildi): Çoklu Talep + Tarımsal Alan
// (arazi) raporlarında "Ulaşım Tarifi" (transport):
//  1) Tüm taşınmazlar AYNI parselde (tek KML) → AYRI bir cümle YOK — normal
//     tekli rapordaki AYNI ana-arter tabanlı otomatik metin
//     (buildTransportDirectionText) kullanılır, yalnızca "taşınmaz" →
//     "taşınmazlar" çoğullaştırılır (updateTransportFromMainArtery içinde).
//  2) Farklı ada/parseller, taşınmaz sayısı ≤ 5 → her taşınmaz için ayrı
//     "{tab etiketi} taşınmaz bağlı bulunduğu {mahalle} Mahalle Merkezinin
//     {mesafe}" cümleciği, virgülle birleştirilir (buildAgriculturalMultiTitleUnitTransportText).
//  3) Farklı ada/parseller, taşınmaz sayısı > 5 → genel özet cümlesi.
// Diğer bölge türlerini (Konut/Ticaret/Sanayi) ve tek-taşınmazlı raporları
// ETKİLEMEMELİ.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
  const end = appSource.indexOf("\n];", start);
  assert(end > start, `Sabit dizi kapanmadı: ${name}`);
  return appSource.slice(start, end + 3);
}

const functionNames = [
  "isMultiTitleUnitReportForNarrative",
  "getNarrativeTitleUnitFields",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitCount",
  "hasMixedTitleUnitParcels",
  "getTitleUnitTabModels",
  "computeTitleUnitTabLabel",
  "cleanBoundNeighborhoodCenterName",
  "cleanEnvironmentalDistancePhrase",
  "getAgriculturalNeighborhoodBaseName",
  "formatAgriculturalParcelLabel",
  "buildAgriculturalMultiUnitParcelDistanceSentence",
  "buildAgriculturalMultiTitleUnitTransportText",
  "buildAgriculturalKmlDistanceSentence",
  "formatTurkishList",
  "pluralizeEnvironmentalSubjectText",
  "selectVariant",
  "registerVariantGroup",
];

const sandboxSource = `
let state = {};
const VARIANT_REGISTRY = [];
${extractConstArray("agriculturalMultiUnitParcelListTransportFragmentVariants")}
${extractConstArray("agriculturalMultiUnitManyParcelsTransportVariants")}
const AGRICULTURAL_MULTI_UNIT_TRANSPORT_LIST_LIMIT = 5;
${functionNames.map(extractFunction).join("\n")}
return {
  buildAgriculturalMultiTitleUnitTransportText,
  buildAgriculturalKmlDistanceSentence,
  pluralizeEnvironmentalSubjectText,
  setState: (s) => { state = s; },
};
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

function boundFields(blockNo, parcelNo, distanceText) {
  return {
    blockNo,
    parcelNo,
    boundNeighborhood: "Ataevler",
    boundNeighborhoodDistance: `Taşınmaz mahalle merkezinin ${distanceText}`,
  };
}

// 1) Tek KML / aynı parsel — buildAgriculturalMultiTitleUnitTransportText
// KENDİ bir cümle ÜRETMEMELİ (no-op); bu durum artık
// updateTransportFromMainArtery'nin çoğullaştırmasına bırakılıyor.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", ...boundFields("1408", "3", "800 m güneyinde") },
    titleUnits: [{ fields: boundFields("1408", "3", "800 m güneyinde") }],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  assert.equal(
    sandbox.buildAgriculturalMultiTitleUnitTransportText(),
    "",
    "Aynı parselde (tek KML) bu fonksiyon no-op dönmeli — metin ana-arter mekanizmasından gelir.",
  );
  console.log("Ayni parsel (tek KML) - no-op (ana arter mekanizmasina birakilir) testi tamam.");
}

// 1b) updateTransportFromMainArtery'nin, aynı parselde çoğullaştırma
// yapması gerektiğini kaynak-düzeyinde doğrula + pluralizeEnvironmentalSubjectText'in
// gerçek ana-arter cümlesini doğru çoğullaştırdığını davranışsal olarak kontrol et.
{
  assert.match(
    appSource,
    /function updateTransportFromMainArtery\([\s\S]{0,900}?pluralizeEnvironmentalSubjectText\(text, true\)/,
    "updateTransportFromMainArtery, Çoklu Talep + Tarımsal Alan + aynı parselde " +
      "buildTransportDirectionText metnini pluralizeEnvironmentalSubjectText ile çoğullaştırmalı.",
  );
  assert.match(
    appSource,
    /function updateTransportFromMainArtery\([\s\S]{0,900}?!hasMixedTitleUnitParcels\(\)/,
    "Çoğullaştırma yalnızca FARKLI ada/parsel OLMADIĞINDA (hasMixedTitleUnitParcels false) uygulanmalı.",
  );
  const singular = "Ekspertize konu taşınmaza ulaşım için bölgenin ana arterlerinden D-100 üzerinden kuzey " +
    "istikametine ilerlenir. Yaklaşık 250 metre sonra taşınmazın bulunduğu Atatürk Caddesi güzergahına " +
    "ulaşılır. Ekspertize konu taşınmaz Atatürk Caddesi üzerinde yer almaktadır.";
  const plural = sandbox.pluralizeEnvironmentalSubjectText(singular, true);
  assert.match(plural, /^Ekspertize konu taşınmazlara ulaşım için/, "Çoğullaştırılan metin \"taşınmazlara\" ile başlamalı.");
  assert.match(plural, /taşınmazların bulunduğu/, "\"taşınmazın\" da çoğullaşmalı.");
  assert.match(plural, /Ekspertize konu taşınmazlar Atatürk Caddesi üzerinde/, "Kapanış cümlesi de çoğullaşmalı.");
  console.log("Ana arter metninin cogullastirilmasi testi tamam.");
}

// 2) Farklı ada/parsel, ≤5 taşınmaz — taşınmaz başına ayrı cümlecik.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", ...boundFields("1408", "3", "800 m güneyinde") },
    titleUnits: [{ fields: boundFields("1409", "7", "400 m kuzeyinde") }],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  const text = sandbox.buildAgriculturalMultiTitleUnitTransportText();
  assert.match(text, /1408 Ada 3 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 800 m güneyinde/, "Etiket \"Ada\"/\"Parsel\" kelimeleriyle kurulmalı.");
  assert.match(text, /1409 Ada 7 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 400 m kuzeyinde/);
  assert.ok(text.includes(", "), "Taşınmaz cümlecikleri virgülle ayrılmalı.");
  assert.match(text, /kuzeyinde yer almaktadır\.$/, "Cümle TEK bir yüklemle (\"yer almaktadır\") tamamlanmalı, yarım kalmamalı.");
  console.log("Farkli ada/parsel (<=5 tasinmaz) - tasinmaz bazli liste testi tamam.");
}

// 2b) Kullanıcının gerçek örneği (3 farklı parsel, ekran görüntüsü) —
// tam cümle metni birebir doğrulanır.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", ...boundFields("2928", "46", "1,83 km güneyinde") },
    titleUnits: [
      { fields: boundFields("2927", "12", "2,57 km güneydoğusunda") },
      { fields: boundFields("2930", "1", "1,67 km güneybatısında") },
    ],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  const text = sandbox.buildAgriculturalMultiTitleUnitTransportText();
  assert.equal(
    text,
    "2928 Ada 46 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 1,83 km güneyinde, "
      + "2927 Ada 12 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 2,57 km güneydoğusunda, "
      + "2930 Ada 1 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 1,67 km güneybatısında yer almaktadır.",
  );
  console.log("Kullanici ornegi (3 farkli parsel) - birebir cumle testi tamam.");
}

// 3) Farklı ada/parsel, >5 taşınmaz — genel özet cümlesi.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", blockNo: "1", parcelNo: "1", boundNeighborhood: "Ataevler", neighborhood: "Ataevler" },
    titleUnits: Array.from({ length: 5 }, (_, index) => ({ fields: { blockNo: String(index + 2), parcelNo: String(index + 2) } })),
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  const text = sandbox.buildAgriculturalMultiTitleUnitTransportText();
  assert.match(text, /^Ekspertize konu taşınmazlar/);
  assert.match(text, /Ataevler mahallesinin çevresinde/);
  assert.ok(!text.includes("taşınmaz bağlı bulunduğu"), "6+ farklı parselde taşınmaz-bazlı liste ÜRETİLMEMELİ, özet cümlesi olmalı.");
  console.log("Farkli ada/parsel (>5 tasinmaz) - genel ozet testi tamam.");
}

// 4) Konut Bölgesi (Tarımsal Alan DIŞI) — hiç dokunmamalı (no-op, boş döner).
{
  sandbox.setState({
    fields: { environmentRegionType: "Konut Bölgesi", ...boundFields("1408", "3", "800 m güneyinde") },
    titleUnits: [{ fields: boundFields("1409", "7", "400 m kuzeyinde") }],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  assert.equal(sandbox.buildAgriculturalMultiTitleUnitTransportText(), "", "Tarımsal Alan dışındaki bölge türlerinde no-op olmalı.");
  console.log("Konut Bolgesi (Tarimsal Alan disi) - no-op regresyon testi tamam.");
}

// 5) Tek taşınmazlı rapor — Çoklu Talep infrastrüktürü hiç devreye girmemeli.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", ...boundFields("1408", "3", "800 m güneyinde") },
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  assert.equal(sandbox.buildAgriculturalMultiTitleUnitTransportText(), "", "Tek taşınmazlı raporda no-op olmalı (mevcut tek-taşınmaz akışı korunur).");
  console.log("Tek tasinmazli rapor - no-op regresyon testi tamam.");
}

// 6) Kaynak-düzeyi doğrulama: farklı-parsel tetikleyicileri kablolanmış mı?
{
  assert.match(
    appSource,
    /switchActiveTitleUnit\(0\);[\s\S]{0,300}?refreshMultiTitleUnitAgriculturalTransport\(\);/,
    "applyKmlRecordsToTitleUnits, tüm KML kayıtları işlendikten sonra refreshMultiTitleUnitAgriculturalTransport() çağırmalı.",
  );
  assert.match(
    appSource,
    /field\.key === "environmentRegionType"[\s\S]{0,500}?refreshMultiTitleUnitAgriculturalTransport\(\);/,
    "environmentRegionType alanı değiştiğinde de refreshMultiTitleUnitAgriculturalTransport() çağrılmalı (KML'den SONRA Tarımsal Alan'a geçiş senaryosu).",
  );
  assert.match(
    appSource,
    /switchActiveTitleUnit\(0\);[\s\S]{0,600}?refreshEnvironmentDescriptionFromCurrentFields\("boundNeighborhoodDistance"\);/,
    "applyKmlRecordsToTitleUnits, TÜM KML kayıtları işlendikten sonra \"Çevresel Özellikler Açıklaması\"nı da (boundNeighborhoodDistance tetikleyicisiyle) yeniden hesaplatmalı.",
  );
  console.log("Tetikleyici kablolamasi - kaynak-duzeyi dogrulama testi tamam.");
}

// 7) Kullanıcı bildirimi (2026-08-12): "Çevresel Özellikler Açıklaması"
// (buildEnvironmentalDescription'ın tarımsal dalına gömülü KML mesafe
// cümlesi) tab değiştirildiğinde farklı taşınmazın mesafesini gösterip
// duruyordu — artık farklı ada/parsellerde "Ulaşım Tarifi" ile AYNI ortak
// taşınmaz-bazlı cümleyi kullanmalı ve hangi taşınmaz aktifken
// çağrıldığından BAĞIMSIZ, HER ZAMAN aynı sonucu üretmeli.
{
  // Sabit "yuva" sırası: slot0=2928/46 (birincil), slot1=2927/12, slot2=2930/1.
  // switchActiveTitleUnit GERÇEKTE diziyi karıştırmaz — yalnızca HANGİ
  // yuvanın verisi o an state.fields'ta "canlı", hangisinin kendi
  // (primaryTitleUnitShadow / titleUnits[i-1]) yuvasında "park edilmiş"
  // olduğunu değiştirir. Test bunu doğru simüle etmeli, aksi halde yanlış
  // bir "sıra karışıyor" hatası kendi test kurgusundan kaynaklanır.
  const slot0 = boundFields("2928", "46", "1,83 km güneyinde");
  const slot1 = boundFields("2927", "12", "2,57 km güneydoğusunda");
  const slot2 = boundFields("2930", "1", "1,67 km güneybatısında");
  const values = { boundNeighborhood: "Ataevler", boundNeighborhoodDistance: "Taşınmaz mahalle merkezinin 1,83 km güneyinde" };

  const resultsByActiveIndex = [0, 1, 2].map((activeIndex) => {
    const slots = [slot0, slot1, slot2];
    sandbox.setState({
      fields: { environmentRegionType: "Tarımsal Alan", ...slots[activeIndex] },
      primaryTitleUnitShadow: activeIndex === 0 ? null : { fields: slot0 },
      titleUnits: [
        activeIndex === 1 ? { fields: {} } : { fields: slot1 },
        activeIndex === 2 ? { fields: {} } : { fields: slot2 },
      ],
      activeTitleUnitIndex: activeIndex,
    });
    return sandbox.buildAgriculturalKmlDistanceSentence(values, {});
  });

  assert.ok(resultsByActiveIndex.every(Boolean), "Farklı ada/parsellerde KML mesafe cümlesi boş dönmemeli.");
  assert.equal(
    new Set(resultsByActiveIndex).size,
    1,
    `Cümle, HANGİ taşınmaz aktifken hesaplandığından bağımsız aynı olmalı (aksi halde tab değiştirince "değişen" bir cümle görünür). Üretilenler: ${JSON.stringify(resultsByActiveIndex)}`,
  );
  assert.match(resultsByActiveIndex[0], /2928 Ada 46 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 1,83 km güneyinde/);
  assert.match(resultsByActiveIndex[0], /2927 Ada 12 Parsel taşınmaz bağlı bulunduğu Ataevler Mahalle Merkezinin 2,57 km güneydoğusunda/);
  assert.match(resultsByActiveIndex[0], /yer almaktadır\.\s$/, "Cümle bir sonrakiyle temiz birleşsin diye sonunda tek boşluk olmalı.");
  console.log("Cevresel Ozellikler Aciklamasi mesafe cumlesi - tab-bagimsiz kararlilik testi tamam.");
}

// 7b) Aynı parselde (mixed=false) KML mesafe cümlesi eski (tekli) mantığı
// KULLANMAYA devam etmeli — regresyon yok.
{
  sandbox.setState({
    fields: { environmentRegionType: "Tarımsal Alan", ...boundFields("1408", "3", "800 m güneyinde") },
    titleUnits: [{ fields: boundFields("1408", "3", "800 m güneyinde") }],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  });
  const values = {
    boundNeighborhood: "Ataevler",
    boundNeighborhoodDistance: "Taşınmaz mahalle merkezinin 800 m güneyinde",
    district: "", city: "",
  };
  const text = sandbox.buildAgriculturalKmlDistanceSentence(values, {});
  assert.match(text, /^KML koordinat verisine göre taşınmaz, bağlı bulunduğu Ataevler Mahalle Merkezinin 800 m güneyinde yer almaktadır\.\s$/);
  console.log("Ayni parselde KML mesafe cumlesi - tekli mantik regresyon testi tamam.");
}
