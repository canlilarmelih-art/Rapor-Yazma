// Çoklu taşınmazlı raporlarda ARSA ÖZELLİKLERİ bilgilerini özetleyen
// tablo (Çift Yönlü Düzenleme, 2026-08-17). Kullanıcı talebi: "Çoklu
// çalışmalarda ada parsel farklı taleplerde arsa özellikleri bölümünde
// aynı çift taraflı tablo mantığı kullanılacak. bu bölümde tüm
// taşınmazlara uygula butonu da yer alsın. arsa özelliklerinde bulunan
// tüm hücreler burada sütun olarak olacak. hücrelerde yer alan popo
// upları mevcut hücrenin sağına kat adetse o kadar açalım. Örnek Kadastro
// Yol kullanıcı 2 adet ekledi ise iki sütun açalım." — İmar Özeti
// tablosuyla (bkz. test-planning-units-summary-table.js) AYNI desen, İKİ
// YENİ unsur: (1) 9 SABİT skaler sütuna EK olarak, popup-tabanlı alanlar
// (Kadastro/İmar Yolu, Sınır Unsuru, Zirai Ürün) için TAŞINMAZ BAŞINA kaç
// kayıt varsa o kadar DİNAMİK "readonly" sütun açılır; (2) İmar'ın aksine
// bu tablo/tab çubuğu/tümüne-uygula GÖRÜNÜRLÜĞÜ İmar'ın AYNI kuralını
// (yalnızca farklı ada/parsel) ödünç alır, ama "land" alanlarının
// PAYLAŞIM MODELİ değişmiyor (her zaman taşınmaza-özgü kalır).
//
// Bu test kapsamı:
//  1) Farklı ada/parselde tablo verisi döner, sabit sütun sırası/etiketleri
//     LAND_UNITS_TABLE_FIELD_DEFS ile eşleşir.
//  2) AYNI ada/parselde (2+ taşınmaz olsa BİLE) null döner (İmar'daki AYNI
//     görünürlük kuralı, land'in kendi paylaşım modelinden BAĞIMSIZ).
//  3) Tekil raporda (1 taşınmaz) null döner.
//  4) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır.
//  5) columnMeta: 9 sabit alan HEPSİ "scalar"; dinamik popup sütunları
//     "readonly".
//  6) DİNAMİK SÜTUN SAYISI (asıl kullanıcı isteği): bir taşınmaz 2 Kadastro
//     Yolu kaydı eklemişse 2 sütun açılır, diğer taşınmazın eksik kaydı
//     "-" gösterir; Sınır Unsuru'nda "Diğer" metni de ayrı bir sütun
//     olarak sayılır; Zirai Ürün de aynı kuralla.
//  7) buildTitleUnitsSummaryTableHtmlEditable(): sabit sütunlar
//     düzenlenebilir, dinamik popup sütunları TIKLANAMAZ (readonly).
//  8) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + HER ZAMAN
//     büyük harf.
//  9) template-engine.js'te {{TASINMAZLARARSATABLOSU}} kayıtlı mı.

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

// app.js CRLF satır sonlarıyla saklanıyor — "[" / "]" derinliğine göre
// sabitin GERÇEK sonunu bulan yöntem (bkz. diğer test dosyalarındaki AYNI
// teknik).
function extractConst(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeTitleUnitsShareSameAdaParsel",
  "isPlanningScopedByAdaParsel",
  "getLandRoadFrontageItems",
  "getLandBoundaryElementItems",
  "getLandAgriculturalProductItems",
  "formatLandRoadFrontageItem",
  "formatLandAgriculturalProductItem",
  "calculateAgriculturalTotalCount",
  "roundAgriculturalTreeCount",
  "parseReportNumber",
  "buildLandDynamicColumnGroup",
  "buildLandUnitsSummaryTableData",
  "buildLandUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];
const constNames = ["LAND_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildAllTitleUnitsForSummaryTable, computeTitleUnitsShareSameAdaParsel, isPlanningScopedByAdaParsel,
    buildLandUnitsSummaryTableData, buildLandUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    formatLandRoadFrontageItem, formatLandAgriculturalProductItem,
    getFieldDefs: () => LAND_UNITS_TABLE_FIELD_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(blockNo, parcelNo, overrides = {}) {
  return { fields: { blockNo, parcelNo, ...overrides }, tables: {} };
}

// --- 1) Farklı ada/parselde tablo verisi döner, sabit sütun sırası doğru --
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", landShape: "Dikdörtgen", landTopography: "Eğimsiz" },
    tables: {},
    titleUnits: [
      unit("200", "9", { landShape: "Kare", landTopography: "Az eğimli" }),
    ],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  assert.ok(data, "Farklı ada/parselli 2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(data.headers[1], defs[0].label, "İkinci sütun LAND_UNITS_TABLE_FIELD_DEFS'in ilk alanı olmalı.");
  const shapeIndex = data.headers.indexOf("Arsanın Geometrik Şekli");
  assert.equal(data.rows[0][shapeIndex], "Dikdörtgen", "1. taşınmazın geometrik şekli doğru sütunda olmalı.");
  assert.equal(data.rows[1][shapeIndex], "Kare", "2. taşınmazın geometrik şekli doğru sütunda olmalı.");
  console.log("Farkli ada/parselde tablo verisi + sabit sutun sirasi testi tamam.");
}

// --- 2) AYNI ada/parselde (2+ taşınmaz olsa BİLE) null döner --------------
// (İmar Özeti tablosuyla AYNI görünürlük kuralı — land'in KENDİ paylaşım
// modeli değişmiyor, bu yalnızca tablo/tab çubuğu/tümüne-uygula'nın
// GÖRÜNÜRLÜĞÜ için ödünç alınan bir kural.)
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", landShape: "Dikdörtgen" },
    tables: {},
    titleUnits: [unit("100", "1", { landShape: "Kare" })],
  });
  assert.equal(fns.isPlanningScopedByAdaParsel(), false, "Fixture kontrolü: aynı ada/parselde false dönmeli.");
  assert.equal(fns.buildLandUnitsSummaryTableData(), null, "AYNI ada/parselde (2+ taşınmaz olsa bile) null dönmeli.");
  assert.equal(fns.buildLandUnitsSummaryWordTableHtml(), "", "AYNI ada/parselde HTML tablo da boş string olmalı.");
  console.log("Ayni ada/parselde (2+ tasinmaz olsa bile) null donme testi tamam.");
}

// --- 3) Tekil raporda (1 taşınmaz) null döner ------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { blockNo: "100", parcelNo: "1" }, tables: {}, titleUnits: [] });
  assert.equal(fns.buildLandUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildLandUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 4) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır ----------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", landShape: "Dikdörtgen", landClassification: "" },
    tables: {},
    titleUnits: [unit("200", "9", { landShape: "Kare", landClassification: "" })],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  assert.ok(data, "Farklı ada/parselli raporda tablo verisi dönmeli.");
  assert.ok(!data.headers.includes("Arazi Sınıflandırması"), "Tüm taşınmazlarda BOŞ olan \"Arazi Sınıflandırması\" sütunu KALDIRILMALIYDI.");
  assert.ok(data.headers.includes("Arsanın Geometrik Şekli"), "Dolu olan sütun KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sutunun (sabit) kaldirilma testi tamam.");
}

// --- 5) 9 sabit sütun, HEPSİ "scalar"; hiç dinamik veri yoksa columnMeta --
// yalnızca bunlardan oluşur.
{
  const defs = fns.getFieldDefs();
  assert.equal(defs.length, 9, `Tam olarak 9 sabit sütun bekleniyordu, bulunan: ${defs.length}`);
  assert.ok(defs.every((d) => d.kind === "scalar"), "LAND_UNITS_TABLE_FIELD_DEFS'teki TÜM sabit alanlar 'scalar' olmalı.");
  assert.deepEqual(defs.map((d) => d.key), [
    "landShape", "landTopography", "landRoadFrontage", "landAgricultureType",
    "landIrrigationWaterSource", "landIrrigationSystem", "landClassification",
    "landBoundaryElement", "landAgriculturalProduct",
  ], "Sabit sütun sırası beklenen sırayla eşlemeli.");
  console.log("9 sabit skaler sutun tanimi testi tamam.");
}

// --- 6) DİNAMİK SÜTUN SAYISI: Kadastro/İmar Yolu — kullanıcı 2 adet -------
// eklediyse 2 sütun açılır (ASIL kullanıcı isteği: "Örnek Kadastro Yol
// kullanıcı 2 adet ekledi ise iki sütun açalım").
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "1", landRoadFrontage: "Evet",
      landRoadFrontageItems: [
        { roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" },
        { roadType: "İmar yolu", roadName: "İnönü Sokak", direction: "Güney", length: "10" },
      ],
    },
    tables: {},
    titleUnits: [
      // 2. taşınmaz yalnızca 1 kayıt eklemiş (eksik olan sütunda "-" beklenir).
      unit("200", "9", { landRoadFrontage: "Evet", landRoadFrontageItems: [{ roadType: "Kadastro yolu", roadName: "", direction: "Doğu", length: "5" }] }),
    ],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  assert.ok(data.headers.includes("Kadastro/İmar Yolu 1"), `"Kadastro/İmar Yolu 1" sütunu olmalıydı: ${data.headers.join(", ")}`);
  assert.ok(data.headers.includes("Kadastro/İmar Yolu 2"), `2 kayıt eklendiği için "Kadastro/İmar Yolu 2" sütunu da AÇILMALIYDI: ${data.headers.join(", ")}`);
  assert.ok(!data.headers.includes("Kadastro/İmar Yolu 3"), "3. kayıt hiçbir taşınmazda yokken 3. sütun AÇILMAMALI.");
  const col1Index = data.headers.indexOf("Kadastro/İmar Yolu 1");
  const col2Index = data.headers.indexOf("Kadastro/İmar Yolu 2");
  assert.equal(data.rows[0][col1Index], fns.formatLandRoadFrontageItem({ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }), "1. taşınmazın 1. kaydı doğru formatlanmış olmalı.");
  assert.equal(data.rows[0][col2Index], fns.formatLandRoadFrontageItem({ roadType: "İmar yolu", roadName: "İnönü Sokak", direction: "Güney", length: "10" }), "1. taşınmazın 2. kaydı doğru formatlanmış olmalı.");
  assert.equal(data.rows[1][col2Index], "-", "2. taşınmazın (yalnızca 1 kaydı olan) 2. sütunu \"-\" göstermeli.");
  const colMetaIndex = data.columnMeta[col1Index];
  assert.equal(colMetaIndex.kind, "readonly", "Dinamik Kadastro Yolu sütunu 'readonly' olmalı (tablo hücresinden düzenlenemez).");
  console.log("Kadastro/Imar Yolu dinamik sutun sayisi (kullanici 2 adet ekledi -> 2 sutun) testi tamam.");
}

// --- 7) DİNAMİK SÜTUN: Sınır Unsuru — checkbox listesi + "Diğer" de ayrı --
// bir sütun olarak sayılır.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "1", landBoundaryElement: "Evet",
      landBoundaryElementItems: ["Tel Örgü", "Duvar"],
      landBoundaryElementOther: "Doğal dere yatağı",
    },
    tables: {},
    titleUnits: [unit("200", "9", { landBoundaryElement: "Evet", landBoundaryElementItems: ["Çit"] })],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  assert.ok(data.headers.includes("Sınır Unsuru 1"), `"Sınır Unsuru 1" sütunu olmalıydı: ${data.headers.join(", ")}`);
  assert.ok(data.headers.includes("Sınır Unsuru 2"), `"Sınır Unsuru 2" sütunu olmalıydı: ${data.headers.join(", ")}`);
  // 1. taşınmaz: 2 checkbox + 1 "Diğer" = 3 kayıt -> 3. sütun da açılmalı.
  assert.ok(data.headers.includes("Sınır Unsuru 3"), `"Diğer" metni de bir kayıt sayılıp 3. sütun açmalıydı: ${data.headers.join(", ")}`);
  const col1Index = data.headers.indexOf("Sınır Unsuru 1");
  const col3Index = data.headers.indexOf("Sınır Unsuru 3");
  assert.equal(data.rows[0][col1Index], "Tel Örgü", "1. taşınmazın 1. sınır unsuru doğru sütunda olmalı.");
  assert.equal(data.rows[0][col3Index], "Diğer: Doğal dere yatağı", "\"Diğer\" metni \"Diğer: ...\" biçiminde son sütunda görünmeli.");
  assert.equal(data.rows[1][col3Index], "-", "2. taşınmazın (Diğer metni olmayan) 3. sütunu \"-\" göstermeli.");
  console.log("Sinir Unsuru dinamik sutun + Diger metni testi tamam.");
}

// --- 8) DİNAMİK SÜTUN: Zirai Ürün — Kadastro Yolu ile AYNI kural ----------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "1", landAgriculturalProduct: "Evet",
      landAgriculturalProductItems: [{ productType: "Zeytin", unitCount: "50", age: "10", yieldRate: "Yüksek", totalCount: "500" }],
    },
    tables: {},
    titleUnits: [unit("200", "9", { landAgriculturalProduct: "Hayır" })],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  assert.ok(data.headers.includes("Zirai Ürün 1"), `"Zirai Ürün 1" sütunu olmalıydı: ${data.headers.join(", ")}`);
  assert.ok(!data.headers.includes("Zirai Ürün 2"), "Hiçbir taşınmazda 2. kayıt yokken \"Zirai Ürün 2\" sütunu AÇILMAMALI.");
  const col1Index = data.headers.indexOf("Zirai Ürün 1");
  assert.equal(data.rows[0][col1Index], fns.formatLandAgriculturalProductItem({ productType: "Zeytin", unitCount: "50", age: "10", yieldRate: "Yüksek", totalCount: "500" }), "1. taşınmazın Zirai Ürün kaydı doğru formatlanmış olmalı.");
  assert.equal(data.rows[1][col1Index], "-", "Zirai ürünü olmayan (Hayır) 2. taşınmazın hücresi \"-\" göstermeli.");
  console.log("Zirai Urun dinamik sutun sayisi testi tamam.");
}

// --- 9) buildTitleUnitsSummaryTableHtmlEditable(): sabit sütunlar --------
// düzenlenebilir, dinamik popup sütunları TIKLANAMAZ (readonly).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "1", landShape: "Dikdörtgen", landRoadFrontage: "Evet",
      landRoadFrontageItems: [{ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }],
    },
    tables: {},
    titleUnits: [unit("200", "9", { landShape: "Kare" })],
  });
  const data = fns.buildLandUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const readonlyCount = data.columnMeta.filter((m) => m.kind === "readonly").length;
  assert.ok(readonlyCount >= 1, "En az 1 dinamik (readonly) sütun bekleniyordu (Kadastro Yolu).");
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca sabit (scalar) sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable sabit-scalar/dinamik-readonly ayrimi testi tamam.");
}

// --- 10) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + BÜYÜK ------
// harf (Tapu/Adres/İmar tablolarıyla AYNI paylaşılan HTML üretici).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", landShape: "dikdörtgen" },
    tables: {},
    titleUnits: [unit("200", "9", { landShape: "kare" })],
  });
  const html = fns.buildLandUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  const expectedUppercase = "dikdörtgen".toLocaleUpperCase("tr-TR");
  assert.ok(html.includes(expectedUppercase), `Küçük harfli girdi Türkçe BÜYÜK harfe (${expectedUppercase}) çevrilmeli.`);
  assert.ok(!html.includes("dikdörtgen"), "Küçük harfli orijinal metin HTML çıktısında KALMAMALI.");
  console.log("buildLandUnitsSummaryWordTableHtml gercek HTML uretimi testi tamam.");
}

// --- 11) template-engine.js'te {{TASINMAZLARARSATABLOSU}} kayıtlı mı -------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARARSATABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildLandUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARARSATABLOSU}} -> buildLandUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARARSATABLOSU}} template-engine.js kablolama testi tamam.");
}

console.log("Tasinmazlar arsa ozeti tablosu testleri basarili.");
