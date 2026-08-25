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
    if (appSource[cursor] === "(") parenDepth += 1;
    if (appSource[cursor] === ")") {
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
  "encumbranceCleanText",
  "getEncumbranceRowJournalNo",
  "formatTitleUnitEncumbranceReference",
  "groupEncumbranceRowsAcrossTitleUnits",
  "formatEncumbranceTitleUnitScope",
];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

const rowsByUnit = [
  {
    index: 0,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "2" },
    rows: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
  },
  {
    index: 1,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "4" },
    rows: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
  },
  {
    index: 2,
    fields: { blockNo: "709", parcelNo: "2", titleBlockName: "B", unitNo: "7" },
    rows: [{ c0: "Şerh", c1: "Farklı kayıt", c2: "27.10.2021", c3: "40000" }],
  },
];

const grouped = fns.groupEncumbranceRowsAcrossTitleUnits(rowsByUnit, "encumbranceDeclarations");
assert.equal(grouped.length, 2, "Aynı yevmiye tek satıra, farklı yevmiye ayrı satıra inmeli.");
assert.deepEqual(grouped[0].__titleUnitReferences, ["A-2", "A-4"]);
assert.deepEqual(grouped[1].__titleUnitReferences, ["B-7"]);
assert.equal(fns.getEncumbranceRowJournalNo("encumbranceDeclarations", grouped[0]), "39154");
assert.equal(
  fns.formatEncumbranceTitleUnitScope(grouped[0], 2),
  " (Tüm Taşınmazlar üzerinde müştereken)",
);
assert.equal(
  fns.formatEncumbranceTitleUnitScope(grouped[0], 3),
  " (A-2, A-4 üzerinde)",
);
console.log("Coklu takyidat ayni yevmiye gruplama testi tamam.");

// --- Ortak/Ayrı Takyidat Özeti (Excel) — kullanıcı talebi (2026-08-12) ----
// "Excel'de de ortak/ayrı gösterelim mi" sorusuna kullanıcı "ayrı bir özet
// sayfası/tablo" cevabını verdi: getEncumbranceMultiUnitSummaryRows() bu
// özeti üretir. Bu test, 3 alt-tablonun (Beyanlar/Şerhler/İpotekler)
// GRUPLAMA + Excel satırı ORKESTRASYONUNU doğrular — asıl metin
// biçimlendirme (formatEncumbrance*Row) fonksiyonları KENDİ (derin
// bağımlılık zinciri olan) mantıklarıyla başka yerde zaten test ediliyor;
// burada onlar YERİNE hafif sahte (stub) sürümler kullanılır.
{
  function extractConstArray(name) {
    const marker = `const ${name} = [`;
    const start = appSource.indexOf(marker);
    assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
    const end = appSource.indexOf("\n];", start);
    assert(end > start, `Sabit dizi kapanmadı: ${name}`);
    return appSource.slice(start, end + 3);
  }

  const summaryFunctionNames = [
    "getMultiTitleUnitEncumbranceRows",
    "hasMeaningfulEncumbranceTableRow",
    "getEncumbranceMultiUnitSummaryRows",
  ];
  const summarySandboxSource = `
let state = null;
function getTitleUnitCount() { return state.titleUnits.length + 1; }
function getTitleUnitFieldsForLabel(index) {
  return index === 0 ? state.fields : state.titleUnits[index - 1].fields;
}
function getTitleUnitTablesForLabel(index) {
  return index === 0 ? state.tables : state.titleUnits[index - 1].tables;
}
// Gerçek biçimlendiriciler yerine hafif sahteler — yalnızca orkestrasyon test ediliyor.
function formatEncumbranceDeclarationRow(row) { return row.c1 ? \`BEYAN:\${row.c1}\` : ""; }
function formatEncumbranceAnnotationRow(row) { return row.c1 ? \`SERH:\${row.c1}\` : ""; }
function formatEncumbranceMortgageRow(row) { return row.c0 ? \`IPOTEK:\${row.c0}\` : ""; }
${extractConstArray("ENCUMBRANCE_MULTI_UNIT_SUMMARY_TABLES")}
${["encumbranceCleanText", "encumbranceTextOrBila", "getEncumbranceRowJournalNo", "formatTitleUnitEncumbranceReference", "groupEncumbranceRowsAcrossTitleUnits", "formatEncumbranceTitleUnitScope"].map(extractFunction).join("\n")}
${summaryFunctionNames.map(extractFunction).join("\n")}
return { getEncumbranceMultiUnitSummaryRows, setState: (s) => { state = s; } };
`;
  // eslint-disable-next-line no-new-func
  const summarySandbox = new Function(summarySandboxSource)();

  summarySandbox.setState({
    fields: {
      blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "2",
    },
    tables: {
      encumbranceDeclarations: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
      encumbranceAnnotations: [],
      encumbranceMortgages: [{ c0: "X Bankası", c1: "1", c2: "500000", c3: "01.02.2022", c4: "12345" }],
    },
    titleUnits: [
      {
        fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "4" },
        tables: {
          encumbranceDeclarations: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154" }],
          encumbranceAnnotations: [],
          encumbranceMortgages: [],
        },
      },
      {
        fields: { blockNo: "709", parcelNo: "2", titleBlockName: "B", unitNo: "7" },
        tables: {
          encumbranceDeclarations: [{ c0: "Şerh", c1: "Farklı kayıt", c2: "27.10.2021", c3: "40000" }],
          encumbranceAnnotations: [],
          encumbranceMortgages: [],
        },
      },
    ],
  });

  const rows = summarySandbox.getEncumbranceMultiUnitSummaryRows();
  assert.deepEqual(rows[0], ["Bölüm", "Yevmiye No", "Ortak mı?", "Kapsadığı Taşınmazlar", "Açıklama (rapor metni)"]);
  assert.equal(rows.length, 4, "Basliktan sonra 3 kayit (2 beyan gruplanip 1 satira, + 1 ipotek) olmali.");

  const shared = rows.find((row) => row[1] === "39154");
  assert.ok(shared, "Ortak yevmiyeli (39154) satir bulunamadi.");
  assert.equal(shared[0], "Beyanlar / Hak ve Mükellefiyetler");
  assert.equal(shared[2], "Evet", "Iki tasinmazda gecen kayit \"Ortak mi?\" = Evet olmali.");
  assert.equal(shared[3], "A-2, A-4", "Kapsadigi tasinmazlar A-2 ve A-4 olmali.");
  assert.equal(shared[4], "BEYAN:Otopark taahhüdü");

  const separate = rows.find((row) => row[1] === "40000");
  assert.ok(separate, "Ayri yevmiyeli (40000) satir bulunamadi.");
  assert.equal(separate[2], "Hayır", "Tek tasinmazda gecen kayit \"Ortak mi?\" = Hayir olmali.");
  assert.equal(separate[3], "B-7");

  const mortgage = rows.find((row) => row[0] === "İpotekler");
  assert.ok(mortgage, "Ipotek satiri bulunamadi.");
  assert.equal(mortgage[2], "Hayır", "Tek tasinmazdaki ipotek \"Ortak mi?\" = Hayir olmali.");
  assert.equal(mortgage[4], "IPOTEK:X Bankası");

  console.log("Ortak/Ayri Takyidat Ozeti (Excel) orkestrasyon testi tamam.");
}

// --- getEncumbranceFlattenedExcelRows() — "Bölüm Excel" JSON-dump ---------
// okunaksızlığı düzeltmesi (kullanıcı bildirimi, 2026-08-25: "bu tablo çok
// okunaksız ve anlaşılması zor" — canlıda indirilen dosyada 4 sütun her
// taşınmazın TÜM takyidat kayıtlarını TEK hücreye JSON.stringify ile
// basıyordu). Artık her kayıt KENDİ satırında. Paylaşımlı Takyidat tarihi/
// saati/kaynağı (0.0.543) state.fields'tan DOĞRUDAN okunmalı — bu test
// AYRICA bunu doğruluyor: 2. taşınmazın (A-4) KENDİ fields'ında bu 3 alan
// HİÇ YOK (gerçek post-0.0.543 şeklini yansıtır, paylaşımlı alanlar artık
// hiçbir taşınmazın gölgesine yazılmaz) — eski (getMultiRequentUnitFields
// tarzı) per-taşınmaz okuma burada BOŞ dönerdi, yeni kod state.fields'tan
// okuyarak doğru değeri getirmeli.
{
  const flatFunctionNames = [
    "foldTurkish",
    "normalizeOwnershipTypeForSectionVisibility",
    "isCondominiumEasementOwnershipType",
    "computeTitleUnitTabLabel",
    "getTitleUnitCount",
    "getTitleUnitFieldsForLabel",
    "getTitleUnitTablesForLabel",
    "buildAllTitleUnitsForSummaryTable",
    "dateIsoToTr",
    "getEncumbranceFlattenedExcelRows",
  ];
  const flatSandboxSource = `
let state = null;
const ENCUMBRANCE_FLATTENED_TABLE_GROUPS = [
  { key: "encumbranceDeclarations", label: "Beyanlar - Hak ve Mükellefiyetler", hasAmountColumn: false },
  { key: "encumbranceAnnotations", label: "Şerhler", hasAmountColumn: true },
  { key: "encumbranceMortgages", label: "İpotekler", hasAmountColumn: true },
];
${flatFunctionNames.map(extractFunction).join("\n")}
return { getEncumbranceFlattenedExcelRows, setState: (s) => { state = s; } };
`;
  // eslint-disable-next-line no-new-func
  const flatSandbox = new Function(flatSandboxSource)();

  flatSandbox.setState({
    fields: {
      blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "2",
      takbisDate: "2026-06-12", takbisTime: "08:05", takbisMethod: "Webtapu Sistemi",
    },
    tables: {
      encumbranceDeclarations: [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154", c4: "" }],
      encumbranceAnnotations: [],
      encumbranceMortgages: [{ c0: "Nurol Yatırım Bankası", c1: "1", c2: "500.000,00 TL", c3: "29.05.2025", c4: "28866", c5: "" }],
    },
    // 2. taşınmazın KENDİ fields'ında takbisDate/Time/Method BİLEREK YOK —
    // paylaşımlı alanlar (0.0.543 sonrası) hiçbir taşınmazın gölgesine
    // yazılmaz, gerçek üretim şeklini yansıtır.
    titleUnits: [
      {
        fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "4" },
        tables: {
          encumbranceDeclarations: [],
          encumbranceAnnotations: [{ c0: "Haciz", c1: "İcra takibi", c2: "150.000,00 TL", c3: "01.03.2023", c4: "5000", c5: "Malik X" }],
          encumbranceMortgages: [],
        },
      },
    ],
    activeTitleUnitIndex: 0,
  });

  const rows = flatSandbox.getEncumbranceFlattenedExcelRows();
  assert.deepEqual(rows[0], ["Taşınmaz", "Takyidat Tarihi", "Takyidat Saati", "Kayıt Kaynağı", "Kayıt Grubu", "Tür / Lehdar", "Açıklama / Derece", "Tutar", "Tarih", "Yevmiye No", "Kısıtlı Malik"]);
  assert.equal(rows.length, 4, "Baslik + 1 beyan (A-2) + 1 ipotek (A-2) + 1 serh (A-4) = 4 satir olmali.");

  const beyanRow = rows.find((r) => r[5] === "Beyan");
  assert.deepEqual(
    beyanRow,
    ["A-2", "12.06.2026", "08:05", "Webtapu Sistemi", "Beyanlar - Hak ve Mükellefiyetler", "Beyan", "Otopark taahhüdü", "", "26.10.2021", "39154", ""],
    "5 sutunlu (Tutar'siz) beyan kaydi dogru eslenmeli."
  );

  const ipotekRow = rows.find((r) => r[4] === "İpotekler");
  assert.deepEqual(
    ipotekRow,
    ["A-2", "12.06.2026", "08:05", "Webtapu Sistemi", "İpotekler", "Nurol Yatırım Bankası", "1", "500.000,00 TL", "29.05.2025", "28866", ""],
    "6 sutunlu (Tutar'li) ipotek kaydi dogru eslenmeli."
  );

  const serhRow = rows.find((r) => r[4] === "Şerhler");
  assert.equal(serhRow[0], "A-4", "2. tasinmazin (A-4) kaydi kendi etiketiyle satira cikmali.");
  assert.equal(
    serhRow[1],
    "12.06.2026",
    "Paylasimli Takyidat Tarihi, 2. tasinmazin KENDI (bos) golgesinden DEGIL state.fields'tan okunmali (0.0.543 paylasim duzeltmesi, JSON-dump okunabilirlik duzeltmesinin ayni vesilesiyle bulundu)."
  );
  assert.equal(serhRow[2], "08:05", "Paylasimli Takyidat Saati de ayni sekilde state.fields'tan okunmali.");
  assert.equal(serhRow[7], "150.000,00 TL", "6 sutunlu serh kaydinin Tutar'i dogru sutunda olmali.");

  console.log("getEncumbranceFlattenedExcelRows (Bolum Excel okunabilirlik duzeltmesi) testi tamam.");
}

// --- importEncumbranceFlattenedExcelRows() — getEncumbranceFlattenedExcelRows'un
// TERS yonu (kullanici talebi, 2026-08-25, devam: "excel yukle neden
// kaldirildi?") — satir-basina-kayit formatini "Tasinmaz" etiketine gore
// gruplayip taşınmaz + alt-tabloya geri dagitir, paylasimli Takyidat
// tarihi/saati/kaynagini TEK SEFER state.fields'a yazar.
{
  function normalizeHeaderLikeProd(value) {
    return String(value ?? "")
      .replace(/[﻿​]/g, "")
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g")
      .replace(/[ıİ]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[şŞ]/g, "s")
      .replace(/[üÜ]/g, "u")
      .replace(/[\s_\-\/]+/g, "");
  }

  const importFunctionNames = [
    "normalizeMultiRequestValue",
    "getTitleUnitCount",
    "switchActiveTitleUnit",
    "createEmptyTitleUnit",
    "normalizeEkbDate",
    "dateTrToIso",
    "importEncumbranceFlattenedExcelRows",
  ];
  const importSandboxSource = `
let state = null;
const window = { confirm: () => true, RaporMultiRequestXlsx: { normalizeHeader: ${normalizeHeaderLikeProd.toString()} } };
const ENCUMBRANCE_FLATTENED_TABLE_GROUPS = [
  { key: "encumbranceDeclarations", label: "Beyanlar - Hak ve Mükellefiyetler", hasAmountColumn: false },
  { key: "encumbranceAnnotations", label: "Şerhler", hasAmountColumn: true },
  { key: "encumbranceMortgages", label: "İpotekler", hasAmountColumn: true },
];
// refreshEncumbranceSummaryFromCurrentData() DOM + agir formatlayici
// zincirine bagimli (buildEncumbranceSummaryVariants vb.) — bu testin
// odagi ICE AKTARMA orkestrasyonu (grupla/dagit), hafif STUB yeterli
// (getEncumbranceMultiUnitSummaryRows testindeki AYNI desen).
let refreshCalled = false;
function refreshEncumbranceSummaryFromCurrentData() { refreshCalled = true; }
${importFunctionNames.map(extractFunction).join("\n")}
return {
  importEncumbranceFlattenedExcelRows,
  setState: (s) => { state = s; },
  getState: () => state,
  wasRefreshCalled: () => refreshCalled,
};
`;
  // eslint-disable-next-line no-new-func
  const importSandbox = new Function(importSandboxSource)();

  importSandbox.setState({ fields: {}, tables: {}, titleUnits: [], activeTitleUnitIndex: 0 });

  const header = ["Taşınmaz", "Takyidat Tarihi", "Takyidat Saati", "Kayıt Kaynağı", "Kayıt Grubu", "Tür / Lehdar", "Açıklama / Derece", "Tutar", "Tarih", "Yevmiye No", "Kısıtlı Malik"];
  const rows = [
    header,
    ["A-2", "12.06.2026", "08:05", "Webtapu Sistemi", "Beyanlar - Hak ve Mükellefiyetler", "Beyan", "Otopark taahhüdü", "", "26.10.2021", "39154", ""],
    ["A-2", "12.06.2026", "08:05", "Webtapu Sistemi", "İpotekler", "Nurol Yatırım Bankası", "1", "500.000,00 TL", "29.05.2025", "28866", ""],
    ["A-4", "12.06.2026", "08:05", "Webtapu Sistemi", "Şerhler", "Haciz", "İcra takibi", "150.000,00 TL", "01.03.2023", "5000", "Malik X"],
  ];

  const count = importSandbox.importEncumbranceFlattenedExcelRows(rows);
  assert.equal(count, 2, "2 benzersiz tasinmaz etiketi (A-2, A-4) ice aktarilmali.");
  const after = importSandbox.getState();
  assert.equal(after.titleUnits.length, 1, "1 EK tasinmaz (toplam 2) olusmali.");
  assert.equal(after.fields.requestType, "Çoklu Talep", "Birden fazla tasinmazda requestType OTOMATIK Coklu Talep olmali.");

  assert.equal(after.fields.takbisDate, "2026-06-12", "Paylasimli Takyidat Tarihi TR->ISO cevrilip TEK SEFER state.fields'a yazilmali.");
  assert.equal(after.fields.takbisTime, "08:05", "Paylasimli Takyidat Saati state.fields'a yazilmali.");
  assert.equal(after.fields.takbisMethod, "Webtapu Sistemi", "Paylasimli Kayit Kaynagi state.fields'a yazilmali.");

  assert.deepEqual(
    after.tables.encumbranceDeclarations,
    [{ c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154", c4: "" }],
    "1. tasinmazin (birincil) Beyanlar tablosu dogru yeniden kurulmali (5 sutun, Tutar'siz)."
  );
  assert.deepEqual(
    after.tables.encumbranceMortgages,
    [{ c0: "Nurol Yatırım Bankası", c1: "1", c2: "500.000,00 TL", c3: "29.05.2025", c4: "28866", c5: "" }],
    "1. tasinmazin Ipotekler tablosu dogru yeniden kurulmali (6 sutun, Tutar dahil)."
  );
  assert.equal(after.tables.encumbranceAnnotations.length, 0, "1. tasinmazin Serhler tablosu bos kalmali (o kayit A-4'e ait).");
  assert.deepEqual(
    after.tables.encumbrance,
    [
      { c0: "Beyan", c1: "Otopark taahhüdü", c2: "26.10.2021", c3: "39154", c4: "" },
      { c0: "Nurol Yatırım Bankası", c1: "1", c2: "29.05.2025", c3: "28866", c4: "" },
    ],
    "Birlesik 'encumbrance' (salt-goruntuleme) tablosu 3 alt-tablodan DOGRU yeniden kurulmali (ipotek icin Tutar dusup Tarih/YevmiyeNo/KisitliMalik doğru kaymali)."
  );

  assert.deepEqual(
    after.titleUnits[0].tables.encumbranceAnnotations,
    [{ c0: "Haciz", c1: "İcra takibi", c2: "150.000,00 TL", c3: "01.03.2023", c4: "5000", c5: "Malik X" }],
    "2. tasinmazin (A-4) Serhler tablosu dogru yeniden kurulmali."
  );
  assert.equal(after.titleUnits[0].tables.encumbranceDeclarations.length, 0, "2. tasinmazin Beyanlar tablosu bos kalmali.");

  assert.ok(importSandbox.wasRefreshCalled(), "Ice aktarma sonunda Takyidat aciklamasi (rapor metni) yeniden hesaplanmali.");

  console.log("importEncumbranceFlattenedExcelRows (Bolum Excel ice aktarma geri getirme) testi tamam.");
}
