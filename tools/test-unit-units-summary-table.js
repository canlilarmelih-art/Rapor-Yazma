// Çoklu taşınmazlı raporlarda BAĞIMSIZ BÖLÜM ÖZELLİKLERİ bilgilerini
// özetleyen tablo (Çift Yönlü Düzenleme, 2026-08-21). Kullanıcı talebi:
// "çift taraflı tablo mantığını dekoratif özellikler hariç bağımsız bölüm
// özellikleri bölümüne uygulayalım" — Arsa/Değerleme özet tablolarıyla AYNI
// desen (dinamik sütun grubu YOK, Değerleme'nin görünürlük kuralı kadar
// basit: yalnızca 2+ taşınmaz). Dekoratif Özellikler paneli (20 alan) VE
// açıklama/eski-dormant alanları (17 alan) BİLEREK sütun DEĞİL.
//
// Takip talebi #1: "çift taraflı düzenleme yapabilmeliyim buna çözüm
// bulalım" — Alan/İç Hacim özetinin 7 alanı (Kat dahil) artık "scalar";
// applyUnitFloorMirrorFieldEdit() ile ezme riski kapatıldı (kaynak satırın
// -unitFloors[0]- KENDİSİ de güncellenir).
//
// Takip talebi #2: "tabloda blok ve bağımsız bölüm numarası bulunmuyor iç
// hacimler özet kısmını kendi içinde tablolaştırmamız lazım" — Blok/
// Bağımsız Bölüm No (readonly, kimlik) eklendi; İç Hacimler önce "İç
// Hacimler - Kat N" (taşınmaz başına kat sayısı kadar dinamik metin
// sütunu) olarak tablolaştırıldı.
//
// Takip talebi #3 (bu dosyanın YANSITTIĞI GÜNCEL hal): "kat sütununu blok
// ve bağımsız bölüm sütunu arasına al. indirgenmiş yasal ve mevcut toplam
// alanlar sütunlarını göster İÇ HACİMLER BÖLÜMÜ salt okunur şekilde
// görseldeki gibi olsun." Kullanıcının paylaştığı görsel #2'nin "İç
// Hacimler - Kat N" granülerliğini YANLIŞ bulduğunu gösterdi — bunun
// yerine SABİT, oda-TÜRÜ bazlı sayısal sütunlar istendi:
//  - `unitFloor` ("Kat") artık Blok/Bağımsız Bölüm No ARASINDA (Blok-Kat-BB
//    No kimlik üçlüsü).
//  - YENİ "İndirgenmiş Toplam Yasal/Mevcut Alan" (2 readonly, computed
//    sütun — calculateReducedUnitFloorTotal, satır panelindeki AYNI hesap).
//  - "İç Hacimler - Kat N" KALDIRILDI; yerine SABİT 8 sütun (Salon/Oda/
//    Mutfak/Banyo/Wc/Antre/Balkon/Diğer, TÜM kat satırları toplanmış,
//    getUnitFloorInteriorTableGroupCounts — GABIM Veri Seti'nin KENDİ
//    6-gruplu sözleşmesinden İZOLE, ayrı bir sınıflandırma).
//
// Bu test kapsamı:
//  1) 2+ taşınmazda tablo verisi döner, sütun sırası UNIT_UNITS_TABLE_FIELD_DEFS
//     ile eşleşir (Blok - Kat - Bağımsız Bölüm No sırası dahil).
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) Dekoratif Özellikler'in 20 alanı hiçbir yerde görünmez.
//  4) Açıklama + eski/dormant fallback alanları (17 alan) da görünmez.
//  5) Tüm taşınmazlarda BOŞ olan (genel) sütun tamamen kaldırılır.
//  6) columnMeta: Blok/Bağımsız Bölüm No "readonly", diğer 17 alan (Genel
//     panel 10 + aynalı 7, Kat dahil) "scalar".
//  7) applyUnitFloorMirrorFieldEdit(): tekil-anahtar yazma, no-op, lazy
//     row-oluşturma, inactive taşınmaz hedefi.
//  8) REGRESYON: mirror-edit sonrası alakasız satır değişikliğinde veri
//     kaybı YOK.
//  9) İndirgenmiş Toplam Yasal/Mevcut Alan: calculateReducedUnitFloorTotal
//     ile TUTARLI hesaplanır, readonly, TÜM taşınmazlarda boşsa kaldırılır.
//  10) getUnitFloorInteriorTableGroupCounts()/classifyUnitFloorInteriorItemGroup():
//      Salon/Oda/Mutfak/Banyo(+Duş)/Wc(+Tuvalet)/Antre(+Hol)/Balkon(+Teras+
//      Veranda) doğru sınıflandırılır, tanımadığı kalemler "Diğer"e düşer,
//      TÜM kat satırları toplanır; "0" bile HER ZAMAN gösterilir (boş-sütun
//      filtresinden muaf, readonly).
//  11) renderSection() "unit" gate'i doğru sırayla genişletildi.
//  12) commitTitleUnitsSummaryCellEdit() refresh + mirror kablolaması.
//  13) getSelectOptionsForFieldKey() "unitFloor" -> unitFloorOptions.
//  14) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı mı.
//  15) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" sayfası
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
  "calculateReducedUnitFloorTotal",
  "calculateReducedUnitFloorArea",
  "parseUnitReductionRate",
  "formatUnitReducedAreaValue",
  "parseReportNumber",
  "classifyUnitFloorInteriorItemGroup",
  "getUnitFloorInteriorTableGroupCounts",
  "parseUnitInteriorItem",
  "normalizeUnitInteriorName",
  "foldTurkish",
  "normalizeReportTitleText",
  "toTitleCaseTr",
  "preserveReportSpecialWords",
  "escapeRegExp",
  "normalizeReportWhitespace",
];
const constNames = ["UNIT_UNITS_TABLE_FIELD_DEFS", "UNIT_UNITS_TABLE_REDUCED_AREA_DEFS", "UNIT_UNITS_TABLE_INTERIOR_GROUP_DEFS"];
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
    classifyUnitFloorInteriorItemGroup, getUnitFloorInteriorTableGroupCounts,
    getFieldDefs: () => UNIT_UNITS_TABLE_FIELD_DEFS,
    getReducedAreaDefs: () => UNIT_UNITS_TABLE_REDUCED_AREA_DEFS,
    getInteriorGroupDefs: () => UNIT_UNITS_TABLE_INTERIOR_GROUP_DEFS,
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

// --- 1) 2+ taşınmazda tablo verisi döner, sütun sırası (Blok-Kat-BB No) --
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields({ unitUsageStatus: "Boş (Hiç Kullanılmamış)", titleBlockName: "A", unitFloor: "1. Normal", unitNo: "3" }),
    tables: {},
    titleUnits: [unit(fullUnitFields({ unitUsageStatus: "Kiracı", titleBlockName: "B", unitFloor: "Zemin", unitNo: "7" }))],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(defs[0].key, "titleBlockName", "1. alan 'Blok' olmalı.");
  assert.equal(defs[1].key, "unitFloor", "2. alan 'Kat' olmalı (Blok ile Bağımsız Bölüm No ARASINDA).");
  assert.equal(defs[2].key, "unitNo", "3. alan 'Bağımsız Bölüm No' olmalı.");
  const blockIndex = data.headers.indexOf("Blok");
  const katIndex = data.headers.indexOf("Kat");
  const unitNoIndex = data.headers.indexOf("BB No");
  assert.ok(blockIndex >= 0 && katIndex >= 0 && unitNoIndex >= 0, "'Blok'/'Kat'/'BB No' sütunları bulunmalı.");
  assert.ok(blockIndex < katIndex && katIndex < unitNoIndex, "Sütun SIRASI Blok -> Kat -> BB No olmalı.");
  assert.equal(data.rows[0][katIndex], "1. Normal", "1. taşınmazın Kat bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[1][unitNoIndex], "7", "2. taşınmazın BB No bilgisi doğru sütunda olmalı.");
  console.log("2+ tasinmazda tablo verisi + Blok-Kat-BBNo sutun sirasi testi tamam.");
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

// --- 5) Tüm taşınmazlarda BOŞ olan (genel) sütun tamamen kaldırılır -------
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
// "scalar" (Kat dahil)
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
    assert.equal(def.narrow, true, `"${key}" sütunu narrow:true olmalı (kullanıcı talebi: mümkün olduğunca daralt).`);
  });
  [...SCALAR_KEYS, ...MIRROR_KEYS].forEach((key) => {
    const def = defs.find((item) => item.key === key);
    assert.equal(def.kind, "scalar", `"${key}" sütunu scalar (düzenlenebilir) olmalı.`);
  });
  const katDef = defs.find((item) => item.key === "unitFloor");
  assert.ok(!katDef.narrow, "'Kat' sütunu narrow OLMAMALI (yalnızca Sıra No/Blok/BB No daraltılır).");

  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca scalar sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  assert.equal(scalarCount, SCALAR_KEYS.length + MIRROR_KEYS.length, "Scalar sütun sayısı Genel panel + aynalı alan sayısıyla eşleşmeli.");

  // Kullanıcı takip talebi (2026-08-21): "sıra no blok ve bağımsız bölüm
  // no sütunları olabildiğince daralt" — Sıra No (seq) + Blok/BB No
  // (identity) = 3 sütun dar sabit genişlik almalı, "Kat" (identity
  // OLMAYAN, scalar) almamalı.
  const narrowCount = (html.match(/width:24pt;/g) || []).length;
  const expectedNarrowCount = 3 + 3 * data.rows.length; // 3 baslik + 3 dar sutun x satir sayisi
  assert.equal(narrowCount, expectedNarrowCount, `3 baslik + 3 dar sütun (Sıra No/Blok/BB No) x ${data.rows.length} satır = ${expectedNarrowCount} 'width:24pt;' beklenirdi, bulunan: ${narrowCount}.`);
  console.log("columnMeta scalar/readonly/narrow ayrimi + tus-editable-cell testi tamam.");
}

// --- 7) applyUnitFloorMirrorFieldEdit(): tekil-anahtar yazma, no-op, ------
// lazy row-oluşturma, inactive taşınmaz hedefi
{
  const mirrorMap = fns.getMirrorMap();
  MIRROR_KEYS.forEach((key) => {
    assert.ok(mirrorMap[key], `"${key}" UNIT_FLOOR_MIRROR_FIELD_TO_ROW_KEY'de olmalı.`);
  });

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
  fns.applyUnitFloorMirrorFieldEdit("legalArea", "180", 0);
  const rows = fns.getState().tables.unitFloors;
  rows[0].floor = "1. Kat";
  assert.equal(rows[0].legalArea, "180", "Mirror-edit edilmis deger, alakasiz bir satir degisikliginden SONRA bile row0'da KALICI kalmali (veri kaybi YOK).");
  console.log("Mirror-edit sonrasi alakasiz degisiklikte veri kaybi olmama regresyon testi tamam.");
}

// --- 9) İndirgenmiş Toplam Yasal/Mevcut Alan -------------------------------
{
  const reducedDefs = fns.getReducedAreaDefs();
  assert.equal(reducedDefs.length, 2, "2 indirgenmiş toplam alan sütunu olmalı (Yasal + Mevcut).");

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {
      unitFloors: [
        { floor: "Zemin", legalArea: "100", areaReductionRate: "100", legalTerrace: "20", terraceReductionRate: "50", currentArea: "95", currentTerrace: "20" },
        { floor: "1. Kat", legalArea: "80", areaReductionRate: "80", legalTerrace: "0", terraceReductionRate: "100", currentArea: "75", currentTerrace: "0" },
      ],
    },
    titleUnits: [unit(fullUnitFields())],
  });
  fns.getState().titleUnits[0].tables = { unitFloors: [] };
  const data = fns.buildUnitUnitsSummaryTableData();
  const legalIndex = data.headers.indexOf("İndirgenmiş Toplam Yasal Alan (m²)");
  assert.ok(legalIndex >= 0, "'İndirgenmiş Toplam Yasal Alan (m²)' sütunu bulunmalı.");
  assert.equal(data.columnMeta[legalIndex].kind, "readonly", "İndirgenmiş toplam alan sütunu readonly olmalı.");
  // calculateReducedUnitFloorTotal(rows, "legal") ile AYNI formül (satır
  // panelindeki hesapla TUTARLI, TEK kaynak): (100*1.00 + 20*0.50) satır 1
  // + (80*0.80 + 0*1.00) satır 2 = 110 + 64 = 174.
  assert.equal(data.rows[0][legalIndex], "174", "1. taşınmazın İndirgenmiş Toplam Yasal Alanı doğru hesaplanmalı (100*1 + 20*0.5 + 80*0.8 + 0*1 = 174).");
  assert.equal(data.rows[1][legalIndex], "-", "unitFloors'u boş olan 2. taşınmazda '-' görünmeli.");
  console.log("Indirgenmis Toplam Yasal-Mevcut Alan sutunlari testi tamam.");
}

// --- 10) getUnitFloorInteriorTableGroupCounts / classify -------------------
{
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("salon"), "salon");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("oda"), "oda");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("mutfak"), "mutfak");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("banyo"), "banyo");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("dus"), "banyo", "'Duş' de Banyo grubuna girmeli.");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("wc"), "wc");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("tuvalet"), "wc", "'Tuvalet' de Wc grubuna girmeli.");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("antre-hol"), "antre", "'Antre-Hol' GABIM'in aksine (orada 'Diğer') burada KENDİ grubuna girmeli.");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("balkon"), "balkon");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("teras"), "balkon", "'Teras' de Balkon grubuna girmeli.");
  assert.equal(fns.classifyUnitFloorInteriorItemGroup("çamaşırlık"), "diger", "Bilinmeyen bir kalem 'Diğer'e düşmeli.");
  console.log("classifyUnitFloorInteriorItemGroup siniflandirma testi tamam.");

  const counts = fns.getUnitFloorInteriorTableGroupCounts([
    { interiors: "Salon, 3 Oda, Mutfak, 2 Banyo, WC, Antre-Hol, Balkon" },
    { interiors: "Oda, Çamaşırlık" },
  ]);
  assert.equal(counts.salon, 1);
  assert.equal(counts.oda, 4, "3 Oda + 1 Oda (2. satırdan) = 4 olmalı (TÜM satırlar toplanır).");
  assert.equal(counts.mutfak, 1);
  assert.equal(counts.banyo, 2);
  assert.equal(counts.wc, 1);
  assert.equal(counts.antre, 1);
  assert.equal(counts.balkon, 1);
  assert.equal(counts.diger, 1, "Çamaşırlık 'Diğer'e düşmeli.");
  console.log("getUnitFloorInteriorTableGroupCounts toplam satirlar uzerinden testi tamam.");

  const interiorDefs = fns.getInteriorGroupDefs();
  assert.equal(interiorDefs.length, 8, "8 SABİT İç Hacimler sütunu olmalı (Antre AYRI, Diğer dahil).");
  assert.deepEqual(interiorDefs.map((d) => d.label), ["Salon", "Oda", "Mutfak", "Banyo", "Wc", "Antre", "Balkon", "Diğer"]);

  // Tüm taşınmazlarda "0" olsa bile İç Hacimler sütunları GÖSTERİLMEYE
  // devam eder (columnHasData'nın "-" / boş varsayımından muaf).
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullUnitFields(),
    tables: {},
    titleUnits: [unit(fullUnitFields())],
  });
  const data = fns.buildUnitUnitsSummaryTableData();
  assert.ok(data.headers.includes("Diğer"), "Hiçbir taşınmazda 'Diğer' kalemi olmasa bile sütun GÖRÜNMELİ (0 dahil).");
  const digerIndex = data.headers.indexOf("Diğer");
  assert.equal(data.rows[0][digerIndex], "0", "Boş İç Hacimler için '0' gösterilmeli, '-' DEĞİL.");
  assert.equal(data.columnMeta[digerIndex].kind, "readonly", "İç Hacimler grup sütunları readonly olmalı.");
  console.log("Ic Hacimler grup sutunlarinin '0' dahil her zaman gosterilmesi testi tamam.");
}

// --- 11) renderSection() "unit" gate'i doğru sırayla genişletildi ---------
// (2026-08-21 devam: "Seçili Taşınmazlara Kopyala" butonu artık AYRI bir
// body.append(...) DEĞİL, createTitleUnitTabBar()'a extraActions olarak
// veriliyor — tab çubuğunun "+ Taşınmaz Ekle"/"Bu taşınmazı sil"
// butonlarıyla AYNI actions satırının SONUNA ekleniyor.)
{
  assert.match(
    appSource,
    /if \(section\.id === "unit" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createUnitCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createUnitUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'unit' gate'i beklenen şekilde (tab bar+kopyala -> özet tablo) genişletilmemiş."
  );
  console.log("renderSection unit gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 12) commitTitleUnitsSummaryCellEdit() refresh + mirror kablolaması ---
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

// --- 13) getSelectOptionsForFieldKey(): "unitFloor" -> unitFloorOptions ---
{
  assert.match(
    appSource,
    /if \(fieldKey === "unitFloor"\) return unitFloorOptions;/,
    "getSelectOptionsForFieldKey() 'unitFloor' -> unitFloorOptions eşlemesini içermiyor."
  );
  console.log("getSelectOptionsForFieldKey unitFloor eslemesi testi tamam.");
}

// --- 14) template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} kayıtlı -
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARBAGIMSIZBOLUMTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildUnitUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} -> buildUnitUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARBAGIMSIZBOLUMTABLOSU}} template-engine.js kablolama testi tamam.");
}

// --- 15) report-tables-xlsx.js'te "Taşınmazlar Bağımsız Bölüm Özeti" ------
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
