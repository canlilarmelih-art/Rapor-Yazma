// Çoklu taşınmazlı raporlarda BAĞIMSIZ BÖLÜM ÖZELLİKLERİ bilgilerini
// özetleyen tablo (Çift Yönlü Düzenleme, 2026-08-21). Kullanıcı talebi:
// "çift taraflı tablo mantığını dekoratif özellikler hariç bağımsız bölüm
// özellikleri bölümüne uygulayalım" — Arsa/Değerleme özet tablolarıyla AYNI
// desen (dinamik sütun grubu YOK, Değerleme'nin görünürlük kuralı kadar
// basit: yalnızca 2+ taşınmaz). Dekoratif Özellikler paneli (20 alan) VE
// açıklama/eski-dormant alanları (17 alan) BİLEREK sütun DEĞİL.
//
// Bu test kapsamı:
//  1) 2+ taşınmazda tablo verisi döner, sütun sırası UNIT_UNITS_TABLE_FIELD_DEFS
//     ile eşleşir.
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) Dekoratif Özellikler'in 20 alanı hiçbir yerde (headers/columnMeta.fieldKey)
//     görünmez.
//  4) Açıklama + eski/dormant fallback alanları (17 alan) da görünmez.
//  5) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır.
//  6) columnMeta: Alan/İç Hacim özeti (8 alan) "readonly", tabloda
//     TIKLANAMAZ.
//  7) Genel panel (10 alan) "scalar", tabloda düzenlenebilir.
//  8) renderSection() "unit" gate'i createUnitUnitsSummaryTablePreview()'u
//     mevcut sıraya (tab çubuğu + Seçili Taşınmazlara Kopyala'nın ARDINDAN)
//     ekliyor mu.
//  9) commitTitleUnitsSummaryCellEdit() yeni refresh çağrısını içeriyor mu.
//  10) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı mı.
//  11) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" sayfası
//      kayıtlı mı.

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
// sabitin GERÇEK sonunu bulan yöntem (diğer test dosyalarındaki AYNI teknik).
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
  "buildUnitUnitsSummaryTableData",
  "buildUnitUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];
const constNames = ["UNIT_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildAllTitleUnitsForSummaryTable,
    buildUnitUnitsSummaryTableData, buildUnitUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    getFieldDefs: () => UNIT_UNITS_TABLE_FIELD_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

const DECORATIVE_KEYS = [
  "unitSalonFloor", "unitSalonWall", "unitRoomFloor", "unitRoomWall", "unitHallFloor", "unitHallWall",
  "unitKitchenFloor", "unitKitchenWall", "unitWetFloor", "unitWetWall", "unitBalconyFloor", "unitBalconyWall",
  "unitWindows", "unitExteriorDoor", "unitInteriorDoors", "unitKitchenCabinet", "unitKitchenCounter",
  "unitMaterialQuality", "unitBathroomFixture1", "unitBathroomFixture2", "unitBathroomFixture3",
];
const EXCLUDED_DESCRIPTION_AND_LEGACY_KEYS = [
  "unitInteriorDescription", "unitInteriorDescriptionManual", "unitDecorativeDescription", "unitDecorativeDescriptionManual",
  "unitLegalReductionRate", "unitCurrentReductionRate", "unitLegalTerraceReductionRate", "unitCurrentTerraceReductionRate",
  "unitLivingRoom", "unitRoomCount", "unitKitchen", "unitBathroom", "unitBalcony", "unitWc", "unitHall",
  "unitDressingRoom", "unitLaundryRoom",
];

const SCALAR_KEYS = [
  "unitUsageStatus", "unitFirstSaleStatus", "unitEntrancePosition", "facades", "unitConstructionLevel",
  "unitViewStatus", "unitHeatingType", "unitHeatingMounted", "unitShopFrontage", "unitShopDepth",
];
const READONLY_KEYS = [
  "unitFloor", "legalArea", "currentArea", "unitAreaReductionRate",
  "unitLegalTerrace", "unitCurrentTerrace", "unitTerraceReductionRate", "interiorFeatures",
];

function fullUnitFields(overrides = {}) {
  const fields = { requestType: "Çoklu Talep" };
  SCALAR_KEYS.forEach((key, index) => { fields[key] = `S${index}`; });
  READONLY_KEYS.forEach((key, index) => { fields[key] = `R${index}`; });
  return { ...fields, ...overrides };
}

// --- 1) 2+ taşınmazda tablo verisi döner, sütun sırası doğru --------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields({ unitUsageStatus: "Boş (Hiç Kullanılmamış)" }),
    tables: {},
    titleUnits: [unit(fullUnitFields({ unitUsageStatus: "Kiracı" }))],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(data.headers[1], defs[0].label, "İkinci sütun UNIT_UNITS_TABLE_FIELD_DEFS'in ilk alanı olmalı.");
  const usageIndex = data.headers.indexOf("Kullanım Durumu");
  assert.equal(data.rows[0][usageIndex], "Boş (Hiç Kullanılmamış)", "1. taşınmazın Kullanım Durumu doğru sütunda olmalı.");
  assert.equal(data.rows[1][usageIndex], "Kiracı", "2. taşınmazın Kullanım Durumu doğru sütunda olmalı.");
  console.log("2+ tasinmazda tablo verisi + sutun sirasi testi tamam.");
}

// --- 2) Tekil raporda (1 taşınmaz) null döner ------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: fullUnitFields(), tables: {}, titleUnits: [] });
  assert.equal(fns.buildUnitUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildUnitUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 3) Dekoratif Özellikler'in 20 alanı hiçbir yerde görünmez ------------
{
  const fieldsWithDecorative = fullUnitFields();
  DECORATIVE_KEYS.forEach((key, index) => { fieldsWithDecorative[key] = `D${index}`; });
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fieldsWithDecorative,
    tables: {},
    titleUnits: [unit(fullUnitFields())],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  const defs = fns.getFieldDefs();
  DECORATIVE_KEYS.forEach((key) => {
    assert.ok(!defs.some((def) => def.key === key), `Dekoratif alan "${key}" UNIT_UNITS_TABLE_FIELD_DEFS'te OLMAMALI.`);
    assert.ok(!data.rows.some((row) => row.includes(`D${DECORATIVE_KEYS.indexOf(key)}`)), `Dekoratif alan "${key}" değeri hiçbir satırda görünmemeli.`);
  });
  console.log("Dekoratif Ozellikler'in tabloya sizmama testi tamam.");
}

// --- 4) Açıklama + eski/dormant fallback alanları (17 alan) da görünmez ---
{
  const defs = fns.getFieldDefs();
  EXCLUDED_DESCRIPTION_AND_LEGACY_KEYS.forEach((key) => {
    assert.ok(!defs.some((def) => def.key === key), `Açıklama/eski-dormant alanı "${key}" UNIT_UNITS_TABLE_FIELD_DEFS'te OLMAMALI.`);
  });
  console.log("Aciklama + eski-dormant fallback alanlarinin tabloya sizmama testi tamam.");
}

// --- 5) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır ----------------
{
  const fieldsSparse = fullUnitFields({ unitShopFrontage: "", unitShopDepth: "" });
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fieldsSparse,
    tables: {},
    titleUnits: [unit(fullUnitFields({ unitShopFrontage: "", unitShopDepth: "" }))],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Cephe (m)"), "Tüm taşınmazlarda BOŞ olan \"Cephe (m)\" sütunu KALDIRILMALIYDI.");
  assert.ok(!data.headers.includes("Derinlik (m)"), "\"Derinlik (m)\" sütunu da KALDIRILMALIYDI.");
  assert.ok(data.headers.includes("Kullanım Durumu"), "Dolu olan sütun KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sutunun kaldirilma testi tamam.");
}

// --- 6) columnMeta: Alan/İç Hacim özeti "readonly", TIKLANAMAZ -------------
// --- 7) Genel panel "scalar", DÜZENLENEBİLİR --------------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {},
    titleUnits: [unit(fullUnitFields())],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  const defs = fns.getFieldDefs();
  READONLY_KEYS.forEach((key) => {
    const def = defs.find((item) => item.key === key);
    assert.equal(def.kind, "readonly", `"${key}" sütunu readonly olmalı (unitFloors[0]'dan tek yönlü türetiliyor).`);
  });
  SCALAR_KEYS.forEach((key) => {
    const def = defs.find((item) => item.key === key);
    assert.equal(def.kind, "scalar", `"${key}" sütunu scalar (düzenlenebilir) olmalı.`);
  });

  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca scalar sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  assert.equal(scalarCount, SCALAR_KEYS.length, "Scalar sütun sayısı Genel panel alan sayısıyla eşleşmeli.");
  console.log("columnMeta scalar/readonly ayrimi + tus-editable-cell testi tamam.");
}

// --- 8) renderSection() "unit" gate'i doğru sırayla genişletildi ----------
{
  assert.match(
    appSource,
    /if \(section\.id === "unit" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\)\);\s*\n\s*body\.append\(createUnitCopyToSelectedControl\(\)\);\s*\n\s*body\.append\(createUnitUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'unit' gate'i beklenen sırayla (tab bar -> kopyala -> özet tablo) genişletilmemiş."
  );
  console.log("renderSection unit gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 9) commitTitleUnitsSummaryCellEdit() yeni refresh çağrısını içeriyor -
{
  assert.match(
    appSource,
    /refreshValuationUnitsSummaryTablePreview\(\);\s*\n\s*refreshUnitUnitsSummaryTablePreview\(\);/,
    "commitTitleUnitsSummaryCellEdit() 'refreshUnitUnitsSummaryTablePreview();' çağrısını içermiyor."
  );
  console.log("commitTitleUnitsSummaryCellEdit refresh kablolama testi tamam.");
}

// --- 10) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı -
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARBAGIMSIZBOLUMTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildUnitUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} -> buildUnitUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} template-engine.js kablolama testi tamam.");
}

// --- 11) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" ------
{
  const xlsxSource = fs.readFileSync(path.join(__dirname, "..", "src", "exports", "report-tables-xlsx.js"), "utf8");
  assert.match(
    xlsxSource,
    /generatedCellGridFor\("buildUnitUnitsSummaryWordTableHtml"\)/,
    "report-tables-xlsx.js'te buildUnitUnitsSummaryWordTableHtml için generatedCellGridFor çağrısı bulunamadı."
  );
  assert.match(
    xlsxSource,
    /sanitizeSheetName\("Taşınmazlar Bağımsız Bölüm Özeti", usedNames\)/,
    "report-tables-xlsx.js'te \"Taşınmazlar Bağımsız Bölüm Özeti\" sayfası bulunamadı."
  );
  console.log("report-tables-xlsx.js Bagimsiz Bolum sayfasi kablolama testi tamam.");
}

console.log("Tasinmazlar bagimsiz bolum ozeti tablosu testleri basarili.");
