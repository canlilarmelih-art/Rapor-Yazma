// Banka şablonlarının TEK taşınmaza özgü Tapu hücreleri (İl/İlçe/Mahalle/
// Mevkii/Pafta/Ada/Parsel/Eski Ada-Parsel/BB Niteliği/Tapu Tarihi/Yevmiye/
// Sayfa/Cilt/Blok/Kat/BB No/Eklenti/Arsa Payı) — çoklu rapor (2026-09-08).
//
// Kullanıcı, gerçek bir vakifkatilim.html ekran görüntüsü paylaşıp:
// "ortak veriler template dosyalarında tapu tablo bölümlerinde
// yazılabilir ayrı olan diğer veriler için EKTEDİR: ibaresi kullan bu
// bölümler altta tabloda yer alıyor çünkü" dedi. AskUserQuestion ile
// netleştirildi: kural TÜM 10 şablona (Taşınmazlar Tapu Özeti tablosu
// olan akbank/halkbank/isbankasi/kuveytturk/kuveytturk-arsa-arazi/
// vakifbank/vakifkatilim/yapikredi/ziraat/ziraat-arsa-arazi) ve ekran
// görüntüsündeki TÜM Tapu alanlarına (UAVT/Koordinat HARİÇ — onlar
// Adres Özeti'nin konusu) uygulanır; tekil raporda davranış DEĞİŞMEZ.
//
// Bu test kapsamı:
//  1) resolveMultiUnitTapuFieldOrEktedir() çekirdek mantığı: tekil
//     raporda HER ZAMAN gerçek değer; çoklu raporda TÜM taşınmazlarda
//     AYNI (Türkçe büyük/küçük harf farkına DUYARSIZ) ise gerçek değer,
//     FARKLI ise "EKTEDİR:"; bazı taşınmazlar BOŞ ise (veri girilmemiş)
//     onlar göz ardı edilir; HİÇBİRİ dolu değilse güvenli varsayılan
//     olarak yine gerçek (aktif) değer döner.
//  2) template-engine.js'te 26 yeni `_ORTAK` alias'ının HER BİRİNİN
//     resolveMultiUnitTapuFieldOrEktedir() üzerinden kablolandığı
//     (wiring) doğrulanır.

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

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  "resolveMultiUnitTapuFieldOrEktedir",
];

const sandboxSource = `
  let state = {};
  ${functionNames.map(extractFunction).join("\n")}
  return { setState: (s) => { state = s; }, resolveMultiUnitTapuFieldOrEktedir };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// buildAllTitleUnitsForSummaryTable() index 0'ı (AKTİF taşınmaz) her
// zaman state.fields/state.tables'tan okur; sonraki index'ler (1, 2, ...)
// titleUnits[0], titleUnits[1], ... "gölge" yuvalarından okunur (BİREBİR
// gerçek mimari, bkz. test-title-units-summary-table.js senaryo 1).
function multiState(activeFields, otherUnitsFields) {
  return {
    activeTitleUnitIndex: 0,
    fields: activeFields,
    tables: { title: [] },
    titleUnits: (otherUnitsFields || []).map((fields) => ({ fields, tables: { title: [] } })),
  };
}

// --- 1) Tekil rapor: HER ZAMAN aktif (gerçek) değer, callback hiç ---------
// önemli DEĞİL (çağrılsa bile sonucu YOK SAYILIR).
{
  fns.setState(multiState({}, []));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir(() => "HERHANGİBİRŞEY", "GERÇEK DEĞER");
  assert.equal(result, "GERÇEK DEĞER", "Tekil raporda her zaman aktif (gerçek) değer dönmeli.");
  console.log("Tekil rapor: her zaman gercek deger donuyor testi tamam.");
}

// --- 2) Çoklu rapor, TÜM taşınmazlarda AYNI değer -> gerçek değer --------
{
  fns.setState(multiState({ city: "Bursa" }, [{ city: "Bursa" }]));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir((u) => u.fields.city, "BURSA");
  assert.equal(result, "BURSA", "Tüm taşınmazlarda AYNI değer -> gerçek (formatlanmış) değer dönmeli.");
  console.log("Coklu rapor, tum ayni deger -> gercek deger testi tamam.");
}

// --- 3) Çoklu rapor, Türkçe büyük/küçük harf farkı SAYILMAZ (aynı kabul) -
{
  fns.setState(multiState({ city: "bursa" }, [{ city: "BURSA" }, { city: "Bursa" }]));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir((u) => u.fields.city, "BURSA");
  assert.equal(result, "BURSA", "Yalnızca büyük/küçük harf farkı olan değerler AYNI sayılmalı (EKTEDİR: DEĞİL).");
  console.log("Buyuk/kucuk harf farki AYNI sayilir testi tamam.");
}

// --- 4) Çoklu rapor, taşınmazlar arasında GERÇEKTEN FARKLI -> EKTEDİR: ---
{
  fns.setState(multiState({ blockNo: "11652" }, [{ blockNo: "9999" }]));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir((u) => u.fields.blockNo, "11652");
  assert.equal(result, "EKTEDİR:", "Taşınmazlar arasında FARKLI değer varsa \"EKTEDİR:\" dönmeli.");
  console.log("Coklu rapor, farkli deger -> EKTEDIR: testi tamam.");
}

// --- 5) Bazı taşınmazlar BOŞ (veri girilmemiş) -> göz ardı edilir --------
{
  fns.setState(multiState({ unitNo: "5" }, [{ unitNo: "" }, { unitNo: "5" }]));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir((u) => u.fields.unitNo, "5");
  assert.equal(result, "5", "Boş taşınmazlar göz ardı edilip kalanlar AYNI ise gerçek değer dönmeli.");
  console.log("Bos tasinmazlar goz ardi edilir testi tamam.");
}

// --- 6) HİÇBİR taşınmazda değer yoksa güvenli varsayılan (gerçek değer) --
{
  fns.setState(multiState({}, [{}]));
  const result = fns.resolveMultiUnitTapuFieldOrEktedir((u) => u.fields.registryVolume, "");
  assert.equal(result, "", "Hiçbir taşınmazda veri yoksa güvenli varsayılan (aktif/boş) değer dönmeli, EKTEDİR: OLMAMALI.");
  console.log("Hicbir tasinmazda veri yokken guvenli varsayilan testi tamam.");
}

// --- 7) template-engine.js: 26 yeni _ORTAK alias'ının HEPSİ ---------------
// resolveMultiUnitTapuFieldOrEktedir() üzerinden kablolanmış olmalı.
{
  const engineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  const expectedAliases = [
    "CITY_BUYUK_ORTAK", "DISTRICT_BUYUK_ORTAK", "TITLE_CITY_ORTAK", "TITLE_DISTRICT_ORTAK",
    "TITLE_NEIGHBORHOOD_ORTAK", "LOCATION_NAME_ORTAK",
    "TITLE_PROPERTY_ID_ORTAK", "SHEET_NO_ORTAK", "BLOCK_NO_ORTAK", "PARCEL_NO_ORTAK",
    "OLD_BLOCK_NO_ORTAK", "OLD_PARCEL_NO_ORTAK", "TITLE_QUALITY_ORTAK", "REGISTRY_PAGE_ORTAK",
    "REGISTRY_VOLUME_ORTAK", "TITLE_BLOCK_NAME_ORTAK", "TITLE_FLOOR_ORTAK", "UNIT_NO_ORTAK",
    "TITLE_ENTRANCE_ORTAK", "EKLENTI_ORTAK", "TITLE_ATTACHMENT_BUYUK_ORTAK",
    "SHARE_ORTAK", "DENOMINATOR_ORTAK", "TAPU_TARIHI_ORTAK", "TAPU_YEVMIYESI_ORTAK",
    "EDINME_SEBEBI_BUYUK_ORTAK",
  ];
  assert.equal(expectedAliases.length, 26, "Beklenen alias sayisi 26 olmali (test fixture'i kendini kontrol ediyor).");
  expectedAliases.forEach((name) => {
    const aliasBlockStart = engineSource.indexOf(`${name}: {`);
    assert.ok(aliasBlockStart !== -1, `Alias bulunamadı: ${name}`);
    const aliasBlockEnd = engineSource.indexOf("\n", aliasBlockStart);
    const aliasLine = engineSource.slice(aliasBlockStart, aliasBlockEnd);
    assert.ok(
      aliasLine.includes('safeCall("resolveMultiUnitTapuFieldOrEktedir"'),
      `${name} resolveMultiUnitTapuFieldOrEktedir() uzerinden kablolanmamis: ${aliasLine}`
    );
  });
  console.log("template-engine.js: 26 yeni _ORTAK alias'inin tamami dogru kablolanmis testi tamam.");
}

console.log("Tapu alani ortak-mi-farkli-mi (EKTEDIR:) testleri basarili.");
