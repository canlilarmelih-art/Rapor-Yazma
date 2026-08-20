// Çoklu taşınmazlı raporlarda BAĞIMSIZ BÖLÜM ÖZELLİKLERİ bilgilerini
// özetleyen tablo (Çift Yönlü Düzenleme, 2026-08-21). Kullanıcı talebi:
// "çift taraflı tablo mantığını dekoratif özellikler hariç bağımsız bölüm
// özellikleri bölümüne uygulayalım" — Arsa/Değerleme özet tablolarıyla AYNI
// desen (dinamik sütun grubu YOK, Değerleme'nin görünürlük kuralı kadar
// basit: yalnızca 2+ taşınmaz). Dekoratif Özellikler paneli (20 alan) VE
// açıklama/eski-dormant alanları (17 alan) BİLEREK sütun DEĞİL.
//
// Kullanıcı takip talebi (2026-08-21, devam): "çift taraflı düzenleme
// yapabilmeliyim buna çözüm bulalım" — Alan/İç Hacim özetinin 7 alanı
// (unitFloor/legalArea/currentArea/unitAreaReductionRate/unitLegalTerrace/
// unitCurrentTerrace/unitTerraceReductionRate) İLK sürümde "readonly"
// bırakılmıştı (unitFloors[0]'dan tek yönlü türetildikleri için ezme
// riski). Şimdi "scalar" (düzenlenebilir) yapıldı; ezme riskini
// applyUnitFloorMirrorFieldEdit() KAPATIYOR — tablo hücresi
// düzenlendiğinde KAYNAK satırın (unitFloors[0]) KENDİSİ de güncelleniyor,
// böylece sonraki her senkron zaten güncel değeri okuyor.
//
// Kullanıcı takip talebi (2026-08-21, devam #2): "tabloda blok ve bağımsız
// bölüm numarası bulunmuyor iç hacimler özet kısmını kendi içinde
// tablolaştırmamız lazım" — `titleBlockName`("Blok")/`unitNo`("Bağımsız
// Bölüm No") EN BAŞA (readonly, kimlik/tanıma amaçlı) eklendi. Eski TEK
// SÜTUNLUK `interiorFeatures` (TÜM kat satırlarının birleşik metin özeti)
// KALDIRILDI, yerine Land'in Kadastro Yolu/Sınır Unsuru dinamik sütun
// grubuyla AYNI desen (`buildTitleUnitsDynamicColumnGroup`) kullanılarak
// "İç Hacimler - Kat N" dinamik sütun grubu eklendi — artık HER kat satırı
// kendi (readonly) sütununda.
//
// Bu test kapsamı:
//  1) 2+ taşınmazda tablo verisi döner, sütun sırası UNIT_UNITS_TABLE_FIELD_DEFS
//     ile eşleşir (Blok/Bağımsız Bölüm No dahil).
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) Dekoratif Özellikler'in 20 alanı hiçbir yerde (headers/columnMeta.fieldKey)
//     görünmez.
//  4) Açıklama + eski/dormant fallback alanları (17 alan) da görünmez.
//  5) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır.
//  6) columnMeta: Blok/Bağımsız Bölüm No (2 alan) "readonly" (tabloda
//     TIKLANAMAZ), diğer 17 alan (Genel panel 10 + aynalı 7) "scalar"
//     (düzenlenebilir).
//  7) applyUnitFloorMirrorFieldEdit(): aynalı 7 alandan biri düzenlendiğinde
//     KAYNAK satırın (unitFloors[0]) yalnızca İLGİLİ anahtarı değişir,
//     satırın DİĞER alanları (floor/note vb.) ETKİLENMEZ; eşleşmeyen bir
//     fieldKey (ör. unitUsageStatus) için no-op (false) döner; satır (row0)
//     yoksa oluşturulur; inactive taşınmazda resolveTitleUnitUnitFloorsRowsWriteTarget
//     üzerinden doğru hedefe (primaryTitleUnitShadow/titleUnits[index-1])
//     yazar.
//  8) REGRESYON (asıl kullanıcı isteği): mirror-edit SONRASI aynı satırda
//     ALAKASIZ bir alan (ör. "note") değişse bile, mirror-edit edilmiş
//     değer row0'da KALICI kalır (senkronun tekrar okuyacağı kaynak zaten
//     güncel) — SESSİZCE ESKİ HALİNE dönmez.
//  9) "İç Hacimler - Kat N" dinamik sütun grubu: en çok kat satırı olan
//     taşınmaz kaç sütun gerektiriyorsa o kadar sütun açılır, eksik satırlı
//     taşınmazlarda "-" görünür, her sütun readonly (TIKLANAMAZ) ve
//     formatUnitFloorRowInteriorLine() ile formatlanır.
//  10) renderSection() "unit" gate'i createUnitUnitsSummaryTablePreview()'u
//      mevcut sıraya (tab çubuğu + Seçili Taşınmazlara Kopyala'nın ARDINDAN)
//      ekliyor mu.
//  11) commitTitleUnitsSummaryCellEdit() yeni refresh çağrısını VE
//      applyUnitFloorMirrorFieldEdit() çağrısını içeriyor mu.
//  12) getSelectOptionsForFieldKey() "unitFloor" için unitFloorOptions
//      döndürüyor mu (tabloda select-dropdown olarak düzenlenebilsin diye).
//  13) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı mı.
//  14) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" sayfası
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

// UNIT_FLOOR_MIRROR_FIELD_TO_ROW_KEY bir NESNE literali ({...}) — "{" / "}"
// derinliğine göre AYNI teknik, dizi yerine nesne için.
function extractObjectConst(name) {
  const marker = `const ${name} = {`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
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
  "createEmptyTitleUnit",
  "createEmptyUnitFloorRow",
  "resolveTitleUnitUnitFloorsRowsWriteTarget",
  "applyUnitFloorMirrorFieldEdit",
  "buildTitleUnitsDynamicColumnGroup",
  "formatUnitFloorRowInteriorLine",
];
const constNames = ["UNIT_UNITS_TABLE_FIELD_DEFS"];
const objectConstNames = ["UNIT_FLOOR_MIRROR_FIELD_TO_ROW_KEY"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${objectConstNames.map(extractObjectConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    buildAllTitleUnitsForSummaryTable,
    buildUnitUnitsSummaryTableData, buildUnitUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    applyUnitFloorMirrorFieldEdit,
    getFieldDefs: () => UNIT_UNITS_TABLE_FIELD_DEFS,
    getMirrorMap: () => UNIT_FLOOR_MIRROR_FIELD_TO_ROW_KEY,
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
const MIRROR_KEYS = [
  "unitFloor", "legalArea", "currentArea", "unitAreaReductionRate",
  "unitLegalTerrace", "unitCurrentTerrace", "unitTerraceReductionRate",
];
const IDENTITY_KEYS = ["titleBlockName", "unitNo"];

function fullUnitFields(overrides = {}) {
  const fields = { requestType: "Çoklu Talep" };
  IDENTITY_KEYS.forEach((key, index) => { fields[key] = `I${index}`; });
  SCALAR_KEYS.forEach((key, index) => { fields[key] = `S${index}`; });
  MIRROR_KEYS.forEach((key, index) => { fields[key] = `M${index}`; });
  return { ...fields, ...overrides };
}

// --- 1) 2+ taşınmazda tablo verisi döner, sütun sırası doğru --------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields({ unitUsageStatus: "Boş (Hiç Kullanılmamış)", titleBlockName: "A", unitNo: "3" }),
    tables: {},
    titleUnits: [unit(fullUnitFields({ unitUsageStatus: "Kiracı", titleBlockName: "B", unitNo: "7" }))],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(data.headers[1], defs[0].label, "İkinci sütun UNIT_UNITS_TABLE_FIELD_DEFS'in ilk alanı olmalı.");
  assert.equal(defs[0].key, "titleBlockName", "İlk alan 'Blok' olmalı.");
  assert.equal(defs[1].key, "unitNo", "İkinci alan 'Bağımsız Bölüm No' olmalı.");
  const blockIndex = data.headers.indexOf("Blok");
  const unitNoIndex = data.headers.indexOf("Bağımsız Bölüm No");
  assert.ok(blockIndex >= 0 && unitNoIndex >= 0, "'Blok' ve 'Bağımsız Bölüm No' sütunları bulunmalı.");
  assert.equal(data.rows[0][blockIndex], "A", "1. taşınmazın Blok bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[1][unitNoIndex], "7", "2. taşınmazın Bağımsız Bölüm No bilgisi doğru sütunda olmalı.");
  const usageIndex = data.headers.indexOf("Kullanım Durumu");
  assert.equal(data.rows[0][usageIndex], "Boş (Hiç Kullanılmamış)", "1. taşınmazın Kullanım Durumu doğru sütunda olmalı.");
  assert.equal(data.rows[1][usageIndex], "Kiracı", "2. taşınmazın Kullanım Durumu doğru sütunda olmalı.");
  console.log("2+ tasinmazda tablo verisi + sutun sirasi + kimlik sutunlari testi tamam.");
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

// --- 6) columnMeta: Blok/Bağımsız Bölüm No "readonly", diğer 17 alan ------
// "scalar"
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {},
    titleUnits: [unit(fullUnitFields())],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  const defs = fns.getFieldDefs();
  IDENTITY_KEYS.forEach((key) => {
    const def = defs.find((item) => item.key === key);
    assert.equal(def.kind, "readonly", `"${key}" sütunu readonly olmalı (Tapu bölümünün alanı, burada yalnızca kimlik/tanıma amaçlı).`);
  });
  [...SCALAR_KEYS, ...MIRROR_KEYS].forEach((key) => {
    const def = defs.find((item) => item.key === key);
    assert.equal(def.kind, "scalar", `"${key}" sütunu scalar (düzenlenebilir) olmalı.`);
  });

  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca scalar sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  assert.equal(scalarCount, SCALAR_KEYS.length + MIRROR_KEYS.length, "Scalar sütun sayısı Genel panel + aynalı alan sayısıyla eşleşmeli.");
  console.log("columnMeta scalar/readonly ayrimi + tus-editable-cell testi tamam.");
}

// --- 7) applyUnitFloorMirrorFieldEdit(): tekil-anahtar yazma, no-op, ------
// lazy row-oluşturma, inactive taşınmaz hedefi
{
  const mirrorMap = fns.getMirrorMap();
  MIRROR_KEYS.forEach((key) => {
    assert.ok(mirrorMap[key], `"${key}" UNIT_FLOOR_MIRROR_FIELD_TO_ROW_KEY'de olmalı.`);
  });
  assert.ok(!mirrorMap.interiorFeatures, "interiorFeatures MIRROR eşlemesinde OLMAMALI (çok satırlı özet).");

  // 7a) Satır ZATEN varsa, yalnızca ilgili anahtar değişir, diğerleri kalır.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: { unitFloors: [{ floor: "Zemin", legalArea: "100", note: "orijinal not" }] },
    titleUnits: [],
  });
  const applied = fns.applyUnitFloorMirrorFieldEdit("legalArea", "150", 0);
  assert.equal(applied, true, "Eşleşen bir mirror alanı için true dönmeli.");
  const row0 = fns.getState().tables.unitFloors[0];
  assert.equal(row0.legalArea, "150", "legalArea güncellenmeli.");
  assert.equal(row0.floor, "Zemin", "İLGİSİZ 'floor' alanı ETKİLENMEMELİ.");
  assert.equal(row0.note, "orijinal not", "İLGİSİZ 'note' alanı ETKİLENMEMELİ.");
  console.log("Tekil-anahtar mirror yazma (digerleri etkilenmiyor) testi tamam.");

  // 7b) Eşleşmeyen fieldKey -> no-op, false.
  fns.setState({ activeTitleUnitIndex: 0, fields: fullUnitFields(), tables: { unitFloors: [{ floor: "Zemin" }] }, titleUnits: [] });
  const notApplied = fns.applyUnitFloorMirrorFieldEdit("unitUsageStatus", "Kiracı", 0);
  assert.equal(notApplied, false, "Eşleşmeyen fieldKey için false dönmeli.");
  assert.equal(fns.getState().tables.unitFloors[0].floor, "Zemin", "Eşleşmeyen fieldKey satırı ETKİLEMEMELİ.");
  console.log("Eslesmeyen fieldKey icin no-op testi tamam.");

  // 7c) Satır (row0) yoksa oluşturulur.
  fns.setState({ activeTitleUnitIndex: 0, fields: fullUnitFields(), tables: {}, titleUnits: [] });
  fns.applyUnitFloorMirrorFieldEdit("currentArea", "95", 0);
  assert.equal(fns.getState().tables.unitFloors[0].currentArea, "95", "Satır (row0) yoksa OLUŞTURULMALI ve değer yazılmalı.");
  console.log("Satir yoksa lazy-olusturma testi tamam.");

  // 7d) Inactive taşınmaz hedefi -> resolveTitleUnitUnitFloorsRowsWriteTarget
  // üzerinden doğru yere (titleUnits[index-1]) yazar.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {},
    titleUnits: [{ fields: {}, tables: { unitFloors: [{ floor: "1. Kat" }] } }],
  });
  fns.applyUnitFloorMirrorFieldEdit("unitFloor", "2. Kat", 1);
  const targetRow = fns.getState().titleUnits[0].tables.unitFloors[0];
  assert.equal(targetRow.floor, "2. Kat", "Inactive tasinmazin (index 1) KENDI unitFloors[0]'ina yazilmali.");
  assert.equal(fns.getState().tables.unitFloors, undefined, "Aktif tasinmazin (index 0) tablosu ETKILENMEMELI.");
  console.log("Inactive tasinmaz hedefine mirror yazma testi tamam.");
}

// --- 8) REGRESYON: mirror-edit sonrası alakasız satır değişikliği, ---------
// edit edilmiş değeri SESSİZCE ESKİ HALİNE döndürmez.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: { unitFloors: [{ floor: "Zemin", legalArea: "100" }] },
    titleUnits: [],
  });
  // Kullanıcı özet tablodan legalArea'yı 100 -> 180 yapıyor.
  fns.applyUnitFloorMirrorFieldEdit("legalArea", "180", 0);
  // Kullanıcı SONRA o taşınmazın Katlar panelinde ALAKASIZ bir alanı
  // (floor) değiştiriyor — bu, updateUnitFloorRow()'un YAPTIĞI gibi
  // AYNI satır (row0) NESNESİ üzerinde TEK bir anahtarı günceller.
  const rows = fns.getState().tables.unitFloors;
  rows[0].floor = "1. Kat";
  // legalArea (mirror-edit edilmiş değer) row0'da HÂLÂ 180 olmalı —
  // sonraki bir syncUnitFloorSummaryFields() çağrısı bunu ZATEN doğru
  // (180) okur, 100'e SESSİZCE dönmez.
  assert.equal(rows[0].legalArea, "180", "Mirror-edit edilmis deger, alakasiz bir satir degisikliginden SONRA bile row0'da KALICI kalmali (veri kaybi YOK).");
  console.log("Mirror-edit sonrasi alakasiz degisiklikte veri kaybi olmama regresyon testi tamam.");
}

// --- 9) "İç Hacimler - Kat N" dinamik sütun grubu --------------------------
{
  // Taşınmaz 1: 2 kat satırı (Zemin + 1. Kat). Taşınmaz 2: 1 kat satırı.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {
      unitFloors: [
        { floor: "Zemin", interiors: "Salon, Mutfak", note: "" },
        { floor: "1. Kat", interiors: "2 Oda, Banyo", note: "çatı katı" },
      ],
    },
    titleUnits: [unit(fullUnitFields())],
  });
  fns.getState().titleUnits[0].tables = { unitFloors: [{ floor: "Zemin", interiors: "Salon", note: "" }] };
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(data.headers.includes("İç Hacimler - Kat 1"), "En az 1 satırı olan HER taşınmaz için 'İç Hacimler - Kat 1' sütunu açılmalı.");
  assert.ok(data.headers.includes("İç Hacimler - Kat 2"), "En çok satırlı taşınmaz (2 kat) için 'İç Hacimler - Kat 2' sütunu da açılmalı.");
  const kat1Index = data.headers.indexOf("İç Hacimler - Kat 1");
  const kat2Index = data.headers.indexOf("İç Hacimler - Kat 2");
  assert.equal(data.rows[0][kat1Index], "Zemin: Salon, Mutfak", "1. taşınmazın 1. kat satırı doğru formatlanmalı.");
  assert.equal(data.rows[0][kat2Index], "1. Kat: 2 Oda, Banyo: çatı katı", "1. taşınmazın 2. kat satırı (not dahil) doğru formatlanmalı.");
  assert.equal(data.rows[1][kat1Index], "Zemin: Salon", "2. taşınmazın (tek satırlı) 1. kat satırı doğru formatlanmalı.");
  assert.equal(data.rows[1][kat2Index], "-", "2. taşınmazın 2. kat satırı YOK, '-' göstermeli.");

  const kat1Meta = data.columnMeta[kat1Index];
  assert.equal(kat1Meta.kind, "readonly", "'İç Hacimler - Kat N' sütunları readonly olmalı.");
  assert.equal(kat1Meta.fieldKey, undefined, "Dinamik sütunların fieldKey'i olmamalı (Land'deki dinamik sütunlarla AYNI desen).");

  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  assert.ok(!html.includes(`data-field-key="undefined"`), "Readonly dinamik sütunlar tus-editable-cell OLARAK işaretlenmemeli.");
  console.log("Ic Hacimler - Kat N dinamik sutun grubu testi tamam.");
}

// --- 10) renderSection() "unit" gate'i doğru sırayla genişletildi ---------
{
  assert.match(
    appSource,
    /if \(section\.id === "unit" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\)\);\s*\n\s*body\.append\(createUnitCopyToSelectedControl\(\)\);\s*\n\s*body\.append\(createUnitUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'unit' gate'i beklenen sırayla (tab bar -> kopyala -> özet tablo) genişletilmemiş."
  );
  console.log("renderSection unit gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 11) commitTitleUnitsSummaryCellEdit() refresh + mirror kablolaması ---
{
  assert.match(
    appSource,
    /refreshValuationUnitsSummaryTablePreview\(\);\s*\n\s*refreshUnitUnitsSummaryTablePreview\(\);/,
    "commitTitleUnitsSummaryCellEdit() 'refreshUnitUnitsSummaryTablePreview();' çağrısını içermiyor."
  );
  assert.match(
    appSource,
    /applyUnitFloorMirrorFieldEdit\(fieldKey, normalizeReportFieldValue\(fieldKey, rawValue\), unitIndex\);/,
    "commitTitleUnitsSummaryCellEdit() 'applyUnitFloorMirrorFieldEdit(...)' çağrısını içermiyor."
  );
  console.log("commitTitleUnitsSummaryCellEdit refresh + mirror kablolama testi tamam.");
}

// --- 12) getSelectOptionsForFieldKey(): "unitFloor" -> unitFloorOptions ---
{
  assert.match(
    appSource,
    /if \(fieldKey === "unitFloor"\) return unitFloorOptions;/,
    "getSelectOptionsForFieldKey() 'unitFloor' -> unitFloorOptions eşlemesini içermiyor."
  );
  console.log("getSelectOptionsForFieldKey unitFloor eslemesi testi tamam.");
}

// --- 13) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı -
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARBAGIMSIZBOLUMTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildUnitUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} -> buildUnitUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} template-engine.js kablolama testi tamam.");
}

// --- 14) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" ------
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
