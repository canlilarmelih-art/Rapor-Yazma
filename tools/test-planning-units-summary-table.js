// Çoklu taşınmazlı raporlarda İMAR DURUMU bilgilerini özetleyen tablo
// (Çift Yönlü Düzenleme, İmar Durumu Faz B, 2026-08-16). Kullanıcı talebi:
// "Aynı ada parselde yer alan çoklu rapor bilgileri için ortak imar durumu
// sekmeleri olacak. farklı ada parselde yer alan taşınmazların oluşturduğu
// çoklu raporlarda tapu bömlümündeki gibi her bölüme ait sütundan oluşan
// tablo olacak tapu ve adresteki gibi çift taraflı olmalı" — Tapu/Adres
// özet tablolarıyla (bkz. test-title-units-summary-table.js,
// test-address-units-summary-table.js) AYNI desen, tek YENİ kural: tablo
// yalnızca taşınmazlar FARKLI ada/parselde iken dolu döner (aynı ada/
// parselde İmar Durumu Faz A'da paylaşımlı hale geldi, karşılaştırılacak
// bir şey yok).
//
// Bu test kapsamı:
//  1) Farklı ada/parselde tablo verisi döner, sütun sırası/etiketleri
//     IMAR_UNITS_TABLE_FIELD_DEFS ile eşleşir.
//  2) AYNI ada/parselde (2+ taşınmaz olsa BİLE) null döner — YENİ kural,
//     Tapu/Adres tablolarından FARKLI.
//  3) Tekil raporda (1 taşınmaz) null döner.
//  4) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır.
//  5) columnMeta: curate edilmiş TAM 13 alan, HEPSİ "scalar" (kullanıcı
//     netleştirmesi, 2026-08-16: "İmar Sorunu Var mı?" + 5 conditionalYesNo
//     alanı + Yola Terk tablo DIŞI — "readonly" türü artık KULLANILMIYOR);
//     "owner"/"computed" türü de YOK.
//  6) buildTitleUnitsSummaryTableHtmlEditable(): TÜM sütunlar TÜM
//     satırlarda düzenlenebilir.
//  7) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + HER ZAMAN
//     büyük harf (Tapu/Adres tablolarıyla AYNI paylaşılan HTML üretici).
//  8) template-engine.js'te {{TASINMAZLARIMARTABLOSU}} kayıtlı mı.

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
// teknik, ör. test-title-units-summary-table.js).
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
  "finalizeTitleUnitsSummaryTableData",
  "buildImarUnitsSummaryTableData",
  "buildUnitsSummaryTableHeadingHtml",
  "buildImarUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
];
const constNames = ["IMAR_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildAllTitleUnitsForSummaryTable, computeTitleUnitsShareSameAdaParsel, isPlanningScopedByAdaParsel,
    buildImarUnitsSummaryTableData, buildImarUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    getFieldDefs: () => IMAR_UNITS_TABLE_FIELD_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(blockNo, parcelNo, overrides = {}) {
  return { fields: { blockNo, parcelNo, ...overrides }, tables: {} };
}

// --- 1) Farklı ada/parselde tablo verisi döner, sütun sırası doğru --------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", planScale: "1/1000", hmax: "12.50", hasPlanningIssue: "Hayır" },
    tables: {},
    titleUnits: [
      unit("200", "9", { planScale: "1/5000", hmax: "9.50", hasPlanningIssue: "Evet" }),
    ],
  });
  const data = fns.buildImarUnitsSummaryTableData();
  assert.ok(data, "Farklı ada/parselli 2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(data.headers[1], defs[0].label, "İkinci sütun IMAR_UNITS_TABLE_FIELD_DEFS'in ilk alanı olmalı.");
  const planScaleIndex = data.headers.indexOf("Plan Ölçeği");
  assert.equal(data.rows[0][planScaleIndex], "1/1000", "1. taşınmazın Plan Ölçeği doğru sütunda olmalı.");
  assert.equal(data.rows[1][planScaleIndex], "1/5000", "2. taşınmazın Plan Ölçeği doğru sütunda olmalı.");
  console.log("Farkli ada/parselde tablo verisi + sutun sirasi testi tamam.");
}

// --- 2) AYNI ada/parselde (2+ taşınmaz olsa BİLE) null döner — YENİ kural -
// (Tapu/Adres tablolarından FARKLI: onlar yalnızca "2+ taşınmaz" şartına
// bakar, bu tablo AYRICA "farklı ada/parsel" şartını da arar — çünkü aynı
// ada/parselde İmar Durumu artık PAYLAŞIMLI, bkz. Faz A.)
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", planScale: "1/1000" },
    tables: {},
    titleUnits: [unit("100", "1", { planScale: "1/1000" })],
  });
  assert.equal(fns.isPlanningScopedByAdaParsel(), false, "Fixture kontrolü: aynı ada/parselde İmar Durumu paylaşımlı (false) olmalı.");
  assert.equal(fns.buildImarUnitsSummaryTableData(), null, "AYNI ada/parselde (2+ taşınmaz olsa bile) null dönmeli — İmar Durumu paylaşımlı, karşılaştırılacak bir şey yok.");
  assert.equal(fns.buildImarUnitsSummaryWordTableHtml(), "", "AYNI ada/parselde HTML tablo da boş string olmalı.");
  console.log("Ayni ada/parselde (2+ tasinmaz olsa bile) null donme testi tamam.");
}

// --- 3) Tekil raporda (1 taşınmaz) null döner ------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { blockNo: "100", parcelNo: "1" }, tables: {}, titleUnits: [] });
  assert.equal(fns.buildImarUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildImarUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 4) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır ----------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", planScale: "1/1000", kaks: "" },
    tables: {},
    titleUnits: [unit("200", "9", { planScale: "1/5000", kaks: "" })],
  });
  const data = fns.buildImarUnitsSummaryTableData();
  assert.ok(data, "Farklı ada/parselli raporda tablo verisi dönmeli.");
  assert.ok(!data.headers.includes("KAKS / Emsal"), "Tüm taşınmazlarda BOŞ olan \"KAKS / Emsal\" sütunu KALDIRILMALIYDI.");
  assert.ok(data.headers.includes("Plan Ölçeği"), "Dolu olan \"Plan Ölçeği\" sütunu KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sutunun kaldirilma testi tamam.");
}

// --- 5) columnMeta: curate edilmiş 13 alan, HEPSI "scalar" (2026-08-16 ----
// kullanıcı netleştirmesi: "diğer bölümler yer almayacak ... İmar Sorunu
// Var mı ve diğer conditionalYesNo alanları/Yola Terk tablo DIŞI") -------
{
  const defs = fns.getFieldDefs();
  assert.equal(defs.length, 13, `Tam olarak 13 sutun bekleniyordu, bulunan: ${defs.length}`);
  assert.ok(defs.every((d) => d.kind === "scalar"), "IMAR_UNITS_TABLE_FIELD_DEFS'teki TUM alanlar 'scalar' olmali (readonly turu KALDIRILDI).");
  assert.deepEqual(defs.map((d) => d.key), [
    "planScale", "planName", "planDate", "legend", "order", "floorCount",
    "hmax", "taks", "kaks", "calculatedEmsal", "frontGarden", "sideGarden", "backGarden",
  ], "Sutun sirasi kullanicinin belirttigi TAM sirayla eslemeli.");
  assert.ok(!defs.some((d) => d.key === "imarInfoInstitution"), "imarInfoInstitution (multiCheckbox) tabloda OLMAMALI.");
  assert.ok(!defs.some((d) => d.key === "planRestrictionNote" || d.key === "planningNote"), "Paylaşımlı (sensitiveOnly) açıklama alanları tabloda OLMAMALI.");
  assert.ok(!defs.some((d) => d.key === "hasPlanningIssue"), "\"İmar Sorunu Var mı?\" artik tabloda OLMAMALI (kullanicinin kendi sekmesinde elle isaretlenmeye devam ediyor).");
  assert.ok(!defs.some((d) => d.key === "roadSetback"), "\"Yola Terk\" artik tabloda OLMAMALI (kullanici listesinde yok).");
  assert.ok(!defs.some((d) => /Condition$|Applied$|TransformationArea$|Obstacle$/.test(d.key)), "conditionalYesNo alanlari (Plan Iptali/Cephe/Tevhid/18. Madde/Kentsel Donusum/Ruhsat) tabloda OLMAMALI.");

  // NOT (2026-08-27): 2. taşınmazın değerleri BİLEREK FARKLI ("-2" son eki)
  // — aksi halde "TÜM taşınmazlarda aynı" hoisting kuralı (bkz.
  // finalizeTitleUnitsSummaryTableData) 13 sütunun TAMAMINI commonFields'e
  // taşır, bu senaryonun ASIL amacı olan "13 scalar sütun" yapısal
  // kontrolünü test edemez hale gelirdi.
  const fieldsObj = {};
  defs.forEach((d) => { fieldsObj[d.key] = `deger-${d.key}`; });
  const fieldsObj2 = {};
  defs.forEach((d) => { fieldsObj2[d.key] = `deger-${d.key}-2`; });
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", ...fieldsObj },
    tables: {},
    titleUnits: [unit("200", "9", fieldsObj2)],
  });
  const data = fns.buildImarUnitsSummaryTableData();
  assert.equal(data.columnMeta.length, data.headers.length, "columnMeta, headers ile AYNI uzunlukta olmali.");
  assert.equal(data.columnMeta[0].kind, "seq", "Ilk sutun (Sira No) 'seq' olmali.");
  assert.ok(!data.columnMeta.some((m) => m.kind === "owner" || m.kind === "computed" || m.kind === "readonly"), "Imar tablosunda 'owner'/'computed'/'readonly' turu OLMAMALI (hepsi scalar/seq).");
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  assert.equal(scalarCount, 13, `columnMeta'da 13 'scalar' sutun bekleniyordu, bulunan: ${scalarCount}`);
  console.log("columnMeta curate edilmis 13 scalar sutun eslemesi testi tamam.");
}

// --- 6) buildTitleUnitsSummaryTableHtmlEditable(): TUM sutunlar TUM ------
// satirlarda duzenlenebilir (hepsi scalar, readonly turu artik yok) -------
{
  // NOT (2026-08-27): bkz. yukarıdaki AYNI not — 2. taşınmazın değerleri
  // BİLEREK FARKLI, aksi halde TÜM sütunlar hoisting ile commonFields'e
  // taşınır ve bu senaryonun "her satırda düzenlenebilir" kontrolü
  // (scalarCount üzerinden hesaplanan expectedEditableCount) anlamsız
  // (0 === 0) hale gelirdi.
  const defs = fns.getFieldDefs();
  const fieldsObj = {};
  defs.forEach((d) => { fieldsObj[d.key] = `deger-${d.key}`; });
  const fieldsObj2 = {};
  defs.forEach((d) => { fieldsObj2[d.key] = `deger-${d.key}-2`; });
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", ...fieldsObj },
    tables: {},
    titleUnits: [unit("200", "9", fieldsObj2)],
  });
  const data = fns.buildImarUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `TUM satirlarin scalar sutunlari (${expectedEditableCount} adet) duzenlenebilir isaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  assert.ok(!html.includes("tus-owner-cell"), "Imar tablosunda 'owner' hucresi (Malik popover tetikleyicisi) OLMAMALI.");
  console.log("buildTitleUnitsSummaryTableHtmlEditable tum-sutun scalar isaretleme testi tamam.");
}

// --- 7) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + BÜYÜK ------
// harf (Tapu/Adres tablolarıyla AYNI paylaşılan HTML üretici).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", planScale: "1/1000", planName: "nazim imar plani" },
    tables: {},
    titleUnits: [unit("200", "9", { planScale: "1/5000", planName: "uygulama imar plani" })],
  });
  const html = fns.buildImarUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  // Turkce buyutmede "i" -> "İ" (noktali) olur, duz "I" DEGIL — beklenen
  // deger toLocaleUpperCase("tr-TR") ile HESAPLANIYOR (elle yazilmis bir
  // "IMAR" varsayimi Turkce locale kuralini yanlis temsil ederdi).
  const expectedUppercase = "nazim imar plani".toLocaleUpperCase("tr-TR");
  assert.ok(html.includes(expectedUppercase), `Küçük harfli girdi Türkçe BÜYÜK harfe (${expectedUppercase}) çevrilmeli.`);
  assert.ok(!html.includes("nazim imar plani"), "Küçük harfli orijinal metin HTML çıktısında KALMAMALI.");
  console.log("buildImarUnitsSummaryWordTableHtml gercek HTML uretimi testi tamam.");
}

// --- 8) template-engine.js'te {{TASINMAZLARIMARTABLOSU}} kayıtlı mı --------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARIMARTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildImarUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARIMARTABLOSU}} -> buildImarUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARIMARTABLOSU}} template-engine.js kablolama testi tamam.");
}

console.log("Tasinmazlar imar ozeti tablosu testleri basarili.");
