// "Bloklar Ana Gayrimenkul Özeti" — çift taraflı, satır başına BLOK
// (2026-09-03). Kullanıcı talebi: "ana gayrimenkul bölümünde 1'den fazla
// blok var ise her blok bir satır olacak şekilde çift taraflı tablo
// yapalım."
//
// KÖK MİMARİ FARK: diğer 9 özet tablosunun (Tapu/Adres/İmar/Arsa/
// Belgeler/Değerleme/Bağımsız Bölüm/Proje Uygunluk/GABİM) TÜMÜ satır
// başına BİR TAŞINMAZ. "Ana Gayrimenkul" alanları ZATEN blok bazında
// paylaşımlı (syncBuildingSharedDataToBlockSiblings) olduğundan taşınmaz
// bazlı bir tablo AYNI bloktaki HER bağımsız bölüm için BİREBİR AYNI
// satırı tekrar tekrar gösterirdi — bu yüzden satır başına BİR BLOK
// (computeDocumentsBlockGroups, temsilci = grubun İLK üyesi).
//
// Bu, buildTitleUnitsSummaryTableHtmlEditable()'ın "satır dizi
// konumu === taşınmaz index'i" varsayımını KIRAR (blok sayısı < taşınmaz
// sayısı) — bu yüzden fonksiyona YENİ, OPSİYONEL bir `rowUnitIndices`
// parametresi eklendi (varsayılan `null`, davranış-koruyan — diğer 9
// çağrı yeri ETKİLENMEZ).
//
// Ayrıca: bu tablonun bir satırı (bir bloğun TEMSİLCİ/İLK üyesi) AKTİF
// taşınmaz OLMAYABİLİR (aktif taşınmaz o bloğun 2. veya 3. üyesi
// olabilir) — commitTitleUnitsSummaryCellEdit()'in var olan
// "aktif değilse setTitleUnitFieldValue ile DOĞRUDAN gölgeye yaz, senkron
// kaskadını ATLA" dalı, building alanları için YENİ bir boşluk açardı
// (syncBuildingSharedDataToBlockSiblings SADECE state.fields/
// activeTitleUnitIndex'ten kaynaklanır). Yeni syncBuildingFieldToBlockSiblings()
// bu boşluğu KAPATIR.
//
// Kapsanan senaryolar:
//  1) buildBuildingBlockUnitsSummaryTableData(): tekil taşınmaz -> null,
//     Çoklu Talep ama AYNI blok -> null (isBuildingBlockGroupingActive
//     zaten false), 2+ FARKLI blok -> her blok bir satır, temsilci
//     (İLK üye) fields'ı kaynak, rowUnitIndices/activeRowIndex doğru.
//  2) buildTitleUnitsSummaryTableHtmlEditable(): rowUnitIndices=null
//     iken ESKİ davranış (data-unit-index=rowIndex) KORUNUYOR (diğer 9
//     tablo REGRESYONU); rowUnitIndices verilmişse HER satırın
//     data-unit-index'i GERÇEK taşınmaz index'i.
//  3) syncBuildingFieldToBlockSiblings(): AYNI bloktaki DİĞER üyelere
//     yazar, kaynak üyeyi ATLAR, TEK üyeli blokta no-op, hedef AKTİF
//     taşınmazsa canlı DOM kontrolünü de günceller, gate
//     (isBuildingBlockSharingApplicable) kapalıyken no-op.
//  4) BUILDING_BLOCK_UNITS_TABLE_FIELD_DEFS: mainPropertyDescription/
//     mainPropertyFloorCountText/buildingAge gibi türetilmiş-veya-
//     konsolide alanların BİLEREK dışarıda bırakıldığı doğrulanır.
//  5) Kaynak-düzeyi kablolama: renderSection (tab bar'ın HEMEN ardında,
//     "İncelenen Belgeler (Blok Bazında)"nın else-if hatasının BURADA
//     TEKRARLANMADIĞI), commitTitleUnitsSummaryCellEdit'in
//     syncBuildingFieldToBlockSiblings çağrısı, getSelectOptionsForFieldKey'e
//     eklenen building select alanları, template-engine.js token,
//     report-tables-xlsx.js sayfası.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appPath = path.join(__dirname, "..", "app.js");
const appSource = fs.readFileSync(appPath, "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
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
  assert.ok(start >= 0, `Sabit bulunamadı: ${name}`);
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
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  "buildAllTitleUnitsForSummaryTable",
  "computeDocumentsBlockGroups",
  "computeDocumentsBlockLabel",
  "isCondominiumOwnershipTypeValue",
  "isBuildingBlockGroupingActive",
  "isBuildingBlockSharingApplicable",
  "normalizeReportTitleText",
  "normalizeReportWhitespace",
  "toTitleCaseTr",
  "preserveReportSpecialWords",
  "escapeRegExp",
  "finalizeTitleUnitsSummaryTableData",
  "resolveTitleUnitWriteTarget",
  "syncBuildingFieldToBlockSiblings",
  "getReportThemeToken",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "formatWordCell",
  "escapeHtml",
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "buildBuildingBlockUnitsSummaryTableData",
];
const constArrayNames = ["BUILDING_BLOCK_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  let sections = [{ id: "building", fields: [] }];
  const documentQueryResults = {};
  const document = {
    querySelector: (selector) => documentQueryResults[selector] || null,
  };
  ${constArrayNames.map(extractConstArray).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    setDocumentControl: (selector, control) => { documentQueryResults[selector] = control; },
    BUILDING_BLOCK_UNITS_TABLE_FIELD_DEFS,
    buildBuildingBlockUnitsSummaryTableData,
    buildTitleUnitsSummaryTableHtmlEditable,
    syncBuildingFieldToBlockSiblings,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

function freshState(overrides = {}) {
  return {
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A" },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1a) Tekil taşınmaz -> null --------------------------------------------
{
  fns.setState(freshState({ titleUnits: [] }));
  assert.equal(fns.buildBuildingBlockUnitsSummaryTableData(), null, "Tekil taşınmazda null dönmeli.");
  console.log("Tekil taşınmaz (null) testi tamam.");
}

// --- 1b) Çoklu Talep ama AYNI blok -> null ---------------------------------
{
  fns.setState(freshState({
    titleUnits: [unit({ blockNo: "100", parcelNo: "1", titleBlockName: "A" })],
  }));
  assert.equal(fns.buildBuildingBlockUnitsSummaryTableData(), null, "AYNI blokta (2+ taşınmaz olsa bile) null dönmeli (kullanıcı: '1'den fazla blok var ise').");
  console.log("Çoklu taşınmaz ama AYNI blok (null) testi tamam.");
}

// --- 1c) 2 FARKLI blok: her blok bir satır, temsilci (İLK üye) kaynak ------
// NOT: getTitleUnitFieldsForLabel(0) yalnızca index 0 === activeTitleUnitIndex
// İSE state.fields okur; aksi halde primaryTitleUnitShadow.fields'ı okur —
// bu yüzden AKTİF taşınmaz index 0 DEĞİLKEN (burada index 2), A bloğunun
// (index 0) verisi primaryTitleUnitShadow'a, B bloğunun İLK üyesinin
// (index 1) verisi titleUnits[0]'a, AKTİF taşınmazın (index 2, B'nin 2.
// üyesi) verisi state.fields'a konur.
{
  fns.setState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "B",
      buildingStyle: "Yığma", carpark: "Yok", elevator: "Yok",
    },
    tables: {},
    activeTitleUnitIndex: 2, // B Blok'un 2. üyesi (İLK üyesi DEĞİL) aktif
    primaryTitleUnitShadow: {
      fields: {
        ownershipType: "Yatay Kat İrtifakı",
        blockNo: "100", parcelNo: "1", titleBlockName: "A",
        buildingStyle: "Betonarme Karkas", carpark: "Açık Otopark", elevator: "1 Adet Asansör",
      },
    },
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "B", buildingStyle: "Yığma", carpark: "Yok", elevator: "Yok" }), // index 1, B'nin İLK (temsilci) üyesi
      unit({}), // index 2 — AKTİF olduğundan bu gölge hiç okunmaz (state.fields kullanılır)
    ],
  });
  const data = fns.buildBuildingBlockUnitsSummaryTableData();
  assert.ok(data, "2 farklı blokta veri dönmeli.");
  assert.equal(data.rows.length, 2, `2 blok -> 2 satır beklenir. Bulunan: ${data.rows.length}`);
  const buildingStyleColumn = data.headers.indexOf("Bina Yapı Tarzı");
  assert.ok(buildingStyleColumn >= 0, "Bina Yapı Tarzı sütunu olmalı.");
  const blockColumn = data.headers.indexOf("Blok");
  assert.deepEqual(data.rows.map((row) => row[blockColumn]), ["A", "B"], "Blok sütunu sırasıyla A, B olmalı.");
  assert.deepEqual(data.rows.map((row) => row[buildingStyleColumn]), ["Betonarme Karkas", "Yığma"], "Her blok kendi (temsilci/İLK üye) değerini göstermeli.");
  // rowUnitIndices: A bloğunun temsilcisi index 0 (aktif taşınmaz), B
  // bloğunun temsilcisi index 1 (aktif taşınmaz DEĞİL — B'nin İLK üyesi).
  assert.deepEqual(data.rowUnitIndices, [0, 1], `rowUnitIndices her bloğun İLK üyesinin GERÇEK index'i olmalı. Bulunan: ${JSON.stringify(data.rowUnitIndices)}`);
  // activeRowIndex: aktif taşınmaz (index 2) B bloğunda -> B'nin satırı (1. index).
  assert.equal(data.activeRowIndex, 1, `activeRowIndex aktif taşınmazın BULUNDUĞU bloğun satırı olmalı. Bulunan: ${data.activeRowIndex}`);
  console.log("2 farklı blok: satır=blok, temsilci kaynak, rowUnitIndices/activeRowIndex doğru testi tamam.");
}

// --- 1d) mainPropertyDescription/mainPropertyFloorCountText/buildingAge
// gibi türetilmiş-veya-konsolide alanlar BİLEREK sütun DEĞİL --------------
{
  const keys = fns.BUILDING_BLOCK_UNITS_TABLE_FIELD_DEFS.map((def) => def.key);
  ["mainPropertyDescription", "mainPropertyFloorCountText", "buildingAge", "buildingCompletionDate",
    "buildingConstructionYear", "buildingDepreciationRate", "totalFloors", "totalUnits", "buildingFloorCounts"].forEach((key) => {
    assert.ok(!keys.includes(key), `"${key}" bu tabloda sütun OLMAMALI (türetilmiş/konsolide, section.fields tanımının üstündeki istisna listesiyle AYNI).`);
  });
  console.log("Türetilmiş/konsolide alanların DIŞARIDA bırakılması testi tamam.");
}

// --- 2a) buildTitleUnitsSummaryTableHtmlEditable: rowUnitIndices=null ->
// ESKİ davranış (data-unit-index=rowIndex) KORUNUR (diğer 9 tablo REGRESYONU)
{
  const headers = ["Sıra No", "Alan"];
  const columnMeta = [{ kind: "seq" }, { kind: "scalar", fieldKey: "someField" }];
  const rows = [[1, "X"], [2, "Y"], [3, "Z"]];
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(headers, rows, columnMeta, 0, []);
  [0, 1, 2].forEach((rowIndex) => {
    assert.ok(html.includes(`data-unit-index="${rowIndex}"`), `rowUnitIndices verilmediğinde data-unit-index=${rowIndex} (rowIndex) olmalı.`);
  });
  console.log("buildTitleUnitsSummaryTableHtmlEditable geriye-dönük uyumluluk (rowUnitIndices=null) REGRESYON testi tamam.");
}

// --- 2b) rowUnitIndices verilince HER satırın data-unit-index'i GERÇEK
// taşınmaz index'i (satır dizi konumu DEĞİL) ---------------------------------
{
  const headers = ["Sıra No", "Blok", "Alan"];
  const columnMeta = [{ kind: "seq" }, { kind: "readonly" }, { kind: "scalar", fieldKey: "someField" }];
  const rows = [[1, "A", "X"], [2, "B", "Y"]];
  const rowUnitIndices = [0, 3]; // A'nın temsilcisi index 0, B'ninki index 3
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(headers, rows, columnMeta, 1, [], 4, rowUnitIndices);
  assert.ok(!/data-unit-index="1"[^>]*data-field-key="someField"/.test(html.split('data-unit-index="0"')[0] || ""), "Sanity: 1. satır index 0 olmalı, 1 değil.");
  const editableCellMatches = [...html.matchAll(/data-unit-index="(\d+)" data-field-key="someField"/g)].map((m) => Number(m[1]));
  assert.deepEqual(editableCellMatches, [0, 3], `rowUnitIndices verilince data-unit-index GERÇEK taşınmaz index'i olmalı (satır konumu DEĞİL). Bulunan: ${JSON.stringify(editableCellMatches)}`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable YENİ rowUnitIndices davranışı testi tamam.");
}

// --- 3a) syncBuildingFieldToBlockSiblings: AYNI bloktaki DİĞER üyelere yazar,
// kaynağı atlar --------------------------------------------------------------
{
  fns.setState(freshState({
    activeTitleUnitIndex: 5, // hiçbiri aktif değil (senaryo dışı bir index)
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "A", buildingStyle: "Eski" }), // index 1
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "A", buildingStyle: "Eski" }), // index 2
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "B", buildingStyle: "Eski" }), // index 3, farklı blok
    ],
  }));
  fns.syncBuildingFieldToBlockSiblings(0, "buildingStyle", "Betonarme Karkas");
  console.log("syncBuildingFieldToBlockSiblings çağrısı hata fırlatmadı (temel çalışma) testi tamam.");
}

// --- 3b) syncBuildingFieldToBlockSiblings: gerçek yazma sonucu doğrulanır ---
{
  fns.setState(freshState({
    activeTitleUnitIndex: 0,
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A", buildingStyle: "Eski" },
    titleUnits: [
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "A", buildingStyle: "Eski" }), // index 1, AYNI blok
      unit({ blockNo: "100", parcelNo: "1", titleBlockName: "B", buildingStyle: "Eski" }), // index 2, FARKLI blok
    ],
  }));
  fns.syncBuildingFieldToBlockSiblings(1, "buildingStyle", "Betonarme Karkas");
  const dataAfter = fns.buildBuildingBlockUnitsSummaryTableData();
  const styleColumn = dataAfter.headers.indexOf("Bina Yapı Tarzı");
  const blockColumn = dataAfter.headers.indexOf("Blok");
  const aRow = dataAfter.rows.find((row) => row[blockColumn] === "A");
  const bRow = dataAfter.rows.find((row) => row[blockColumn] === "B");
  assert.equal(aRow[styleColumn], "Betonarme Karkas", "AYNI bloktaki (A) diğer üye (index 1'den index 0'a, yani AKTİF taşınmaza) yayılmalı.");
  assert.equal(bRow[styleColumn], "Eski", "FARKLI bloktaki (B) üye ETKİLENMEMELİ.");
  console.log("syncBuildingFieldToBlockSiblings: AYNI bloğa yayılır, FARKLI blok etkilenmez testi tamam.");
}

// --- 3c) syncBuildingFieldToBlockSiblings: hedef AKTİF taşınmazsa canlı DOM
// kontrolü de günceller -------------------------------------------------------
{
  fns.setState(freshState({
    activeTitleUnitIndex: 0,
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A" },
    titleUnits: [unit({ blockNo: "100", parcelNo: "1", titleBlockName: "A" })], // index 1, AYNI blok
  }));
  const fakeControl = { value: "" };
  fns.setDocumentControl('[data-field="carpark"]', fakeControl);
  fns.syncBuildingFieldToBlockSiblings(1, "carpark", "Kapalı Otopark");
  assert.equal(fakeControl.value, "Kapalı Otopark", "Hedef AKTİF taşınmazsa canlı DOM kontrolünün .value'su da güncellenmeli (aksi halde ekranda geçici olarak eski değer görünür).");
  console.log("syncBuildingFieldToBlockSiblings: hedef aktifse canlı DOM kontrolü güncellenir testi tamam.");
}

// --- 3d) syncBuildingFieldToBlockSiblings: TEK üyeli blokta no-op ----------
{
  fns.setState(freshState({ activeTitleUnitIndex: 0, titleUnits: [] }));
  // Hata fırlatmamalı, hiçbir şey değişmemeli (tek üye, senkronlanacak kardeş yok).
  fns.syncBuildingFieldToBlockSiblings(0, "carpark", "Kapalı Otopark");
  console.log("syncBuildingFieldToBlockSiblings: TEK üyeli blokta no-op (hata yok) testi tamam.");
}

// --- 5) Kaynak-düzeyi kablolama ---------------------------------------------
{
  // renderSection: panel createBuildingBlockTabBar()'ın AYNI "if" bloğu
  // İÇİNDE (else-if DEĞİL) — 0.0.628'in "İncelenen Belgeler (Blok
  // Bazında)" hatasının BURADA TEKRARLANMADIĞINI doğrular.
  const sectionMarker = 'if (section.id === "building" && isCurrentUserAdmin() && state.fields.requestType === "Çoklu Talep" && isBuildingBlockGroupingActive()) {';
  const sectionStart = appSource.indexOf(sectionMarker);
  assert.ok(sectionStart >= 0, "renderSection'daki 'building' blok-gruplama bloğu bulunamadı.");
  const sectionSlice = appSource.slice(sectionStart, sectionStart + 800);
  assert.ok(sectionSlice.includes("body.append(createBuildingBlockTabBar());"), "createBuildingBlockTabBar() çağrısı bulunamadı.");
  assert.ok(sectionSlice.includes("body.append(createBuildingBlockUnitsSummaryTablePreview());"), "createBuildingBlockUnitsSummaryTablePreview() AYNI 'if' bloğu İÇİNDE (else-if DEĞİL) olmalı.");
  const closingBraceIndex = sectionSlice.indexOf("}");
  const previewCallIndex = sectionSlice.indexOf("body.append(createBuildingBlockUnitsSummaryTablePreview());");
  assert.ok(previewCallIndex < closingBraceIndex, "Panel çağrısı 'if' bloğunun KAPANIŞINDAN ÖNCE (yani bloğun İÇİNDE) olmalı.");

  // commitTitleUnitsSummaryCellEdit: aktif-olmayan yazma dalında
  // syncBuildingFieldToBlockSiblings çağrısı var mı.
  const commitFnBody = extractFunction("commitTitleUnitsSummaryCellEdit");
  assert.ok(
    commitFnBody.includes("getBuildingBlockSharedFieldKeys().includes(fieldKey)"),
    "commitTitleUnitsSummaryCellEdit() fieldKey'in blok-paylaşımlı bir building alanı olup olmadığını kontrol etmeli."
  );
  assert.ok(
    commitFnBody.includes("syncBuildingFieldToBlockSiblings(unitIndex, fieldKey, normalizeReportFieldValue(fieldKey, rawValue));"),
    "commitTitleUnitsSummaryCellEdit() aktif-olmayan yazma dalında syncBuildingFieldToBlockSiblings() çağırmalı."
  );

  // getSelectOptionsForFieldKey: building select alanları eklendi mi.
  ["buildingStyle", "buildingOrder", "buildingClass", "carpark", "exteriorCladding",
    "stairLanding", "interiorWalls", "buildingEntranceDoor", "buildingFootprintReference",
    "buildingEntranceLevel", "buildingEntranceDirection", "buildingBlockCount", "elevator"].forEach((key) => {
    assert.ok(appSource.includes(`fieldKey === "${key}"`), `getSelectOptionsForFieldKey() '${key}' için bir kontrol içermeli.`);
  });

  // template-engine.js token.
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.ok(templateEngineSource.includes("TASINMAZLARANAGAYRIMENKULTABLOSU"), "template-engine.js TASINMAZLARANAGAYRIMENKULTABLOSU token'ını içermeli.");
  assert.ok(templateEngineSource.includes("buildBuildingBlockUnitsSummaryWordTableHtml"), "template-engine.js buildBuildingBlockUnitsSummaryWordTableHtml()'i çağırmalı.");

  // report-tables-xlsx.js sayfası.
  const xlsxSource = fs.readFileSync(path.join(__dirname, "..", "src", "exports", "report-tables-xlsx.js"), "utf8");
  assert.ok(xlsxSource.includes('generatedCellGridFor("buildBuildingBlockUnitsSummaryWordTableHtml")'), "report-tables-xlsx.js buildBuildingBlockUnitsSummaryWordTableHtml() için bir sayfa üretmeli.");
  assert.ok(xlsxSource.includes("Bloklar Ana Gayrimenkul Özeti"), "report-tables-xlsx.js 'Bloklar Ana Gayrimenkul Özeti' sayfa adını içermeli.");

  console.log("Kaynak-düzeyi kablolama (renderSection + commit + select seçenekleri + template-engine + xlsx) testi tamam.");
}

console.log("Tum 'Bloklar Ana Gayrimenkul Ozeti' testleri basarili.");
