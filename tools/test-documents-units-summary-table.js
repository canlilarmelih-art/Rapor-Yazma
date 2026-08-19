// Çoklu taşınmazlı raporlarda BELGELER VE PROJE bilgilerini özetleyen
// tablo (Çift Yönlü Düzenleme, 2026-08-19). Kullanıcı talebi: "BELGELER
// ve proje bölümünü incele bu bölümü çoklu formata nasıl uydurabiliriz.
// burada aynı ada parselde yer alsa da blok bazında farklı ruhsat iskan
// veya projeler olabiliyor." — Tapu/Adres/İmar/Arsa özet tablolarıyla AYNI
// desen, TEK yeni unsur: görünürlük kuralı ADA/PARSEL değil BLOK
// (`blockNo`+`parcelNo`+`titleBlockName` üçlüsü) — çünkü ruhsat/iskan/
// proje aynı parseldeki FARKLI bloklarda farklı olabilir. "documents"
// alanlarının PAYLAŞIM MODELİ değişmiyor (zaten her zaman taşınmaza-özgü).
//
// Bu test kapsamı:
//  0) computeTitleUnitsShareSameBlock(): izole saf-fonksiyon — aynı
//     ada/parsel ama FARKLI blok adı -> false; birebir aynı üçlü -> true.
//  1) Farklı BLOKTA (aynı ada/parsel, farklı titleBlockName) tablo verisi
//     döner, sabit sütun sırası DOCUMENTS_UNITS_TABLE_FIELD_DEFS ile eşleşir.
//  2) AYNI BLOKTA (blockNo+parcelNo+titleBlockName birebir aynı, 2+
//     taşınmaz olsa BİLE) null döner.
//  3) Farklı ada/parselde (bloklar da farklı) tablo görünür.
//  4) Tekil raporda (1 taşınmaz) null döner.
//  5) Tüm taşınmazlarda BOŞ olan sabit sütun tamamen kaldırılır.
//  6) columnMeta: 21 alan "scalar", `projectInstitution` "readonly".
//  7) DİNAMİK "İncelenen Belge N" sütunları: taşınmaz başına kayıt sayısı
//     kadar sütun açılır, eksik kayıtlarda "-"; `tables.documents` HİÇ
//     tanımlı olmayan bir taşınmazda ÇÖKMEDEN "-" göstermeli (aktif
//     taşınmazın verisine SIZMAMALI — `|| []` koruması).
//  8) buildTitleUnitsSummaryTableHtmlEditable(): sabit sütunlar
//     düzenlenebilir, dinamik "Belge" sütunları TIKLANAMAZ (readonly).
//  9) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + BÜYÜK harf.
// 10) template-engine.js'te {{TASINMAZLARBELGETABLOSU}} kayıtlı mı.

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
  "computeTitleUnitsShareSameBlock",
  "isDocumentsScopedByBlock",
  "buildTitleUnitsDynamicColumnGroup",
  "formatDocumentsProjectInstitutionCell",
  "formatReviewedDocumentSummaryLine",
  "buildDocumentsUnitsSummaryTableData",
  "buildDocumentsUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];
const constNames = ["DOCUMENTS_UNITS_TABLE_FIELD_DEFS"];

const sandboxSource = `
  let state = {};
  ${constNames.map(extractConst).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    computeTitleUnitsShareSameBlock, isDocumentsScopedByBlock,
    buildDocumentsUnitsSummaryTableData, buildDocumentsUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable,
    formatDocumentsProjectInstitutionCell, formatReviewedDocumentSummaryLine,
    getFieldDefs: () => DOCUMENTS_UNITS_TABLE_FIELD_DEFS,
  };
`;

// `normalizeReviewedDocumentRow`/`getReviewedDocumentChronologicalEntries`in
// GERÇEK gövdeleri (foldTurkish/dateTrToIso/normalizeEkbDate vb. uzun bir
// bağımlılık zincirine giriyor) burada YENİDEN kurulmuyor — test-documents-
// missing-critical-field.js'te de aynı fonksiyonlar için kurulan AYNI emsal
// (basit, davranışı KORUYAN sahte/stub) izleniyor: bu iki fonksiyonun
// KENDİ mantığı burada test edilmiyor (o zaten mevcut/değişmeyen kod),
// yalnızca buildDocumentsUnitsSummaryTableData'nın onları DOĞRU argümanla
// (her taşınmazın KENDİ `tables.documents`'ı, `|| []` korumalı) çağırıp
// çağırmadığı test ediliyor.
const stubbedSandboxSource = sandboxSource.replace(
  "let state = {};",
  [
    "let state = {};",
    "function normalizeReviewedDocumentRow(row = {}) {",
    "  return { type: String(row.c0 || \"\").trim(), date: String(row.c2 || \"\").trim(), no: String(row.c3 || \"\").trim() };",
    "}",
    "function getReviewedDocumentChronologicalEntries(rows = []) {",
    "  return rows.map((row, index) => ({ row, index }));",
    "}",
  ].join("\n"),
);
// eslint-disable-next-line no-new-func
const fns = new Function(stubbedSandboxSource)();

function unit(blockNo, parcelNo, titleBlockName, overrides = {}, tables = {}) {
  return { fields: { blockNo, parcelNo, titleBlockName, ...overrides }, tables };
}

// --- 0) computeTitleUnitsShareSameBlock(): izole saf-fonksiyon testi -------
{
  const sameBlock = [unit("100", "1", "A Blok"), unit("100", "1", "A Blok")];
  assert.equal(fns.computeTitleUnitsShareSameBlock(sameBlock), true, "Ada/parsel/blok adı birebir aynıysa true dönmeli.");

  const differentBlockName = [unit("100", "1", "A Blok"), unit("100", "1", "B Blok")];
  assert.equal(fns.computeTitleUnitsShareSameBlock(differentBlockName), false, "AYNI ada/parselde FARKLI blok adı false dönmeli.");

  // Farklı parsellerde blok adı TESADÜFEN aynı olsa bile FARKLI blok
  // sayılmalı (plan: "titleBlockName tek başına KARŞILAŞTIRMAK YETMEZ").
  const coincidentallySameName = [unit("100", "1", "A Blok"), unit("200", "9", "A Blok")];
  assert.equal(fns.computeTitleUnitsShareSameBlock(coincidentallySameName), false, "Farklı ada/parselde AYNI blok adı bile FARKLI blok sayılmalı.");

  assert.equal(fns.computeTitleUnitsShareSameBlock([]), true, "Boş liste için (kenar durum) true dönmeli.");
  console.log("computeTitleUnitsShareSameBlock izole saf-fonksiyon testi tamam.");
}

// --- 1) Farklı BLOKTA (aynı ada/parsel) tablo verisi döner -----------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasArchitecturalProject: "Evet" },
    tables: {},
    titleUnits: [
      unit("100", "1", "B Blok", { hasArchitecturalProject: "Hayır" }),
    ],
  });
  const data = fns.buildDocumentsUnitsSummaryTableData();
  assert.ok(data, "Aynı ada/parselde FARKLI bloktaki 2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  const defs = fns.getFieldDefs();
  assert.equal(data.headers[1], defs[0].label, "İkinci sütun DOCUMENTS_UNITS_TABLE_FIELD_DEFS'in ilk alanı olmalı.");
  const projIndex = data.headers.indexOf(defs[0].label);
  assert.equal(data.rows[0][projIndex], "Evet", "1. taşınmazın \"Mimari Proje Var mı?\" değeri doğru sütunda olmalı.");
  assert.equal(data.rows[1][projIndex], "Hayır", "2. taşınmazın \"Mimari Proje Var mı?\" değeri doğru sütunda olmalı.");
  console.log("Farkli blokta (ayni ada/parsel) tablo verisi + sabit sutun sirasi testi tamam.");
}

// --- 2) AYNI BLOKTA (2+ taşınmaz olsa BİLE) null döner ----------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasArchitecturalProject: "Evet" },
    tables: {},
    titleUnits: [unit("100", "1", "A Blok", { hasArchitecturalProject: "Hayır" })],
  });
  assert.equal(fns.isDocumentsScopedByBlock(), false, "Fixture kontrolü: aynı blokta false dönmeli.");
  assert.equal(fns.buildDocumentsUnitsSummaryTableData(), null, "AYNI blokta (2+ taşınmaz olsa bile) null dönmeli.");
  assert.equal(fns.buildDocumentsUnitsSummaryWordTableHtml(), "", "AYNI blokta HTML tablo da boş string olmalı.");
  console.log("Ayni blokta (2+ tasinmaz olsa bile) null donme testi tamam.");
}

// --- 3) Farklı ada/parselde (bloklar da farklı) tablo görünür --------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "", hasArchitecturalProject: "Evet" },
    tables: {},
    titleUnits: [unit("200", "9", "", { hasArchitecturalProject: "Hayır" })],
  });
  const data = fns.buildDocumentsUnitsSummaryTableData();
  assert.ok(data, "Farklı ada/parselli (dolayısıyla farklı bloklu) raporda tablo verisi dönmeli.");
  console.log("Farkli ada/parselde (bloklar da farkli) tablo gorunurlugu testi tamam.");
}

// --- 4) Tekil raporda (1 taşınmaz) null döner ------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" }, tables: {}, titleUnits: [] });
  assert.equal(fns.buildDocumentsUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildDocumentsUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 5) Tüm taşınmazlarda BOŞ olan sabit sütun tamamen kaldırılır ----------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasArchitecturalProject: "Evet", hasEkb: "" },
    tables: {},
    titleUnits: [unit("100", "1", "B Blok", { hasArchitecturalProject: "Hayır", hasEkb: "" })],
  });
  const data = fns.buildDocumentsUnitsSummaryTableData();
  assert.ok(data, "Farklı blokta tablo verisi dönmeli.");
  assert.ok(!data.headers.includes("Enerji Kimlik Belgesi"), "Tüm taşınmazlarda BOŞ olan \"Enerji Kimlik Belgesi\" sütunu KALDIRILMALIYDI.");
  assert.ok(data.headers.includes("Mimari Proje Var mı?"), "Dolu olan sütun KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sabit sutunun kaldirilma testi tamam.");
}

// --- 6) columnMeta: 21 alan "scalar", projectInstitution "readonly" -------
{
  const defs = fns.getFieldDefs();
  const scalarDefs = defs.filter((d) => d.kind === "scalar");
  const readonlyDefs = defs.filter((d) => d.kind === "readonly");
  assert.equal(readonlyDefs.length, 1, "Yalnızca 1 sabit alan (projectInstitution) 'readonly' olmalı.");
  assert.equal(readonlyDefs[0].key, "projectInstitution", "Readonly sabit alan projectInstitution olmalı.");
  assert.equal(scalarDefs.length, defs.length - 1, "Geri kalan TÜM sabit alanlar 'scalar' olmalı.");
  console.log("DOCUMENTS_UNITS_TABLE_FIELD_DEFS scalar/readonly ayrimi testi tamam.");
}

// --- 7) DİNAMİK "İncelenen Belge N" sütunları -------------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    tables: {
      documents: [
        { c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" },
        { c0: "Yapı Kullanım İzin Belgesi", c1: "Belediye", c2: "01.01.2021", c3: "456" },
      ],
    },
    titleUnits: [
      // 2. taşınmaz yalnızca 1 kayıt eklemiş (eksik olan sütunda "-" beklenir).
      unit("100", "1", "B Blok", {}, { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "05.05.2019", c3: "999" }] }),
      // 3. taşınmazın "documents" tablosu HİÇ tanımlı değil (undefined) —
      // AKTİF taşınmazın (1. taşınmaz, 2 kayıtlı) verisine SIZMAMALI,
      // çökmeden "-" göstermeli (`|| []` koruması, bkz. plan).
      unit("100", "1", "C Blok", {}, {}),
    ],
  });
  const data = fns.buildDocumentsUnitsSummaryTableData();
  assert.ok(data.headers.includes("İncelenen Belge 1"), `"İncelenen Belge 1" sütunu olmalıydı: ${data.headers.join(", ")}`);
  assert.ok(data.headers.includes("İncelenen Belge 2"), `2 kayıt eklendiği için "İncelenen Belge 2" sütunu da AÇILMALIYDI: ${data.headers.join(", ")}`);
  assert.ok(!data.headers.includes("İncelenen Belge 3"), "3. kayıt hiçbir taşınmazda yokken 3. sütun AÇILMAMALI.");
  const col1Index = data.headers.indexOf("İncelenen Belge 1");
  const col2Index = data.headers.indexOf("İncelenen Belge 2");
  assert.equal(data.rows[0][col1Index], "Yeni Yapı Ruhsatı - 01.01.2020 - No: 123", "1. taşınmazın 1. belgesi doğru formatlanmış olmalı.");
  assert.equal(data.rows[0][col2Index], "Yapı Kullanım İzin Belgesi - 01.01.2021 - No: 456", "1. taşınmazın 2. belgesi doğru formatlanmış olmalı.");
  assert.equal(data.rows[1][col2Index], "-", "2. taşınmazın (yalnızca 1 kaydı olan) 2. sütunu \"-\" göstermeli.");
  assert.equal(data.rows[2][col1Index], "-", "3. taşınmazın (tables.documents TANIMLI OLMAYAN) 1. sütunu ÇÖKMEDEN \"-\" göstermeli (aktif taşınmazın verisine SIZMAMALI).");
  assert.equal(data.rows[2][col2Index], "-", "3. taşınmazın 2. sütunu da \"-\" göstermeli.");
  const colMetaIndex = data.columnMeta[col1Index];
  assert.equal(colMetaIndex.kind, "readonly", "Dinamik \"İncelenen Belge\" sütunu 'readonly' olmalı (tablo hücresinden düzenlenemez).");
  console.log("Incelenen Belge dinamik sutun sayisi + tables.documents tanimsiz taniman koruma testi tamam.");
}

// --- 8) buildTitleUnitsSummaryTableHtmlEditable(): sabit sütunlar --------
// düzenlenebilir, dinamik "Belge" sütunları TIKLANAMAZ (readonly).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasArchitecturalProject: "Evet" },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Belediye", c2: "01.01.2020", c3: "123" }] },
    titleUnits: [unit("100", "1", "B Blok", { hasArchitecturalProject: "Hayır" })],
  });
  const data = fns.buildDocumentsUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const readonlyCount = data.columnMeta.filter((m) => m.kind === "readonly").length;
  assert.ok(readonlyCount >= 1, "En az 1 dinamik (readonly) sütun bekleniyordu (İncelenen Belge).");
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca sabit (scalar) sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable sabit-scalar/dinamik-readonly ayrimi testi tamam.");
}

// --- 9) Gerçek HTML üretimi: dinamik genişlik + tam ortalama + BÜYÜK ------
// harf (Tapu/Adres/İmar/Arsa tablolarıyla AYNI paylaşılan HTML üretici).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasArchitecturalProject: "evet" },
    tables: {},
    titleUnits: [unit("100", "1", "B Blok", { hasArchitecturalProject: "hayır" })],
  });
  const html = fns.buildDocumentsUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  const expectedUppercase = "evet".toLocaleUpperCase("tr-TR");
  assert.ok(html.includes(expectedUppercase), `Küçük harfli girdi Türkçe BÜYÜK harfe (${expectedUppercase}) çevrilmeli.`);
  console.log("buildDocumentsUnitsSummaryWordTableHtml gercek HTML uretimi testi tamam.");
}

// --- 10) template-engine.js'te {{TASINMAZLARBELGETABLOSU}} kayıtlı mı -----
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARBELGETABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildDocumentsUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARBELGETABLOSU}} -> buildDocumentsUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARBELGETABLOSU}} template-engine.js kablolama testi tamam.");
}

console.log("Tasinmazlar belgeler ozeti tablosu testleri basarili.");
