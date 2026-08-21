// Çoklu taşınmazlı raporlarda DEĞERLEME bilgilerini özetleyen tablo
// (Çift Yönlü Düzenleme, 2026-08-19). Kullanıcı talebi: "değerleme
// kısmında tab mantığı ve çift taraflı tablo mantığı olmalı" — kullanıcının
// netleştirmesiyle (AskUserQuestion) kapsam Piyasa Değeri tablosunun
// TAMAMI (alan×birim değeri detayı DAHİL, yalnızca 6 sonuç değeri değil).
// Tapu/Adres/İmar/Arsa/Belgeler özet tablolarıyla AYNI desen, TEK fark:
// görünürlük kuralı EN BASİTİ — ada/parsel veya bloğa göre koşullu
// paylaşım YOK, yalnızca "2+ taşınmaz var mı" (Değerleme değerleri HER
// ZAMAN taşınmaza-özgüdür).
//
// Bu test kapsamı:
//  1) Farklı taşınmazlarda tablo verisi döner, sütun sırası VALUATION_UNITS_TABLE_ROW_DEFS
//     ile eşleşir (piyasa satırlarında Alan/M2 Birim Değeri/Değer, kira
//     satırlarında alan tekrar edilmeden M2 Birim Değeri/Değer + Yasal-Mevcut
//     Durum satırları için ayrıca Acil Satış Değeri).
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır (Arsa/Tarla'da
//     Kira satırlarının otomatik kalkması dahil — createValuationMarketTable'ın
//     KENDİ landOwnership filtresiyle TUTARLI).
//  4) columnMeta: Alan/Değer sütunları "scalar", M2 Birim Değeri/Acil Satış
//     Değeri sütunları "readonly" (gerçek formda da salt-okunur).
//  5) buildTitleUnitsSummaryTableHtmlEditable(): scalar sütunlar
//     düzenlenebilir, readonly sütunlar TIKLANAMAZ.
//  6) Gerçek HTML üretimi: dinamik genişlik + tam ortalama.
//  7) template-engine.js'te {{TASINMAZLARDEGERLEMETABLOSU}} kayıtlı mı.
//
// Kullanıcı takip talebi (2026-08-21): "değerleme tablosunu sıra no
// sütununun sağına blok ve bağımsız bölüm no sütunu koyalım" — Bağımsız
// Bölüm özet tablosundaki AYNI kimlik sütunları (readonly) eklendi:
//  8) Blok/Bağımsız Bölüm No sütunları Sıra No'nun HEMEN sağında, readonly,
//     doğru taşınmaza eşleşiyor.
//  9) İki katmanlı HTML renderer'da (buildValuationUnitsSummaryTableHtml)
//     bu iki sütun "Diğer" grubuna düşer AMA subheader'ları YANLIŞLIKLA
//     "Piyasa Değeri (TL)" DEĞİL, kendi etiketleri olmalı (regresyon —
//     getValuationUnitsSummarySubheader'ın varsayılan para-birimi dalına
//     düşmemeli).

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
function extractArrayConst(name) {
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

// VALUATION_UNITS_TABLE_ROW_DEFS bir dizi LITERALI DEĞİL - valuationMarketRows.map(...)
// HESAPLANMIŞ bir ifade (`const X = <ifade>;`) - "[" derinliği yerine
// GENEL parantez/küme parantezi derinliğine göre ilk üst-seviye ";" aranır.
function extractComputedConst(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "(" || char === "{" || char === "[") depth += 1;
    if (char === ")" || char === "}" || char === "]") depth -= 1;
    if (char === ";" && depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "buildValuationUnitsSummaryTableData",
  "getValuationUnitsSummaryHeaderGroup",
  "getValuationUnitsSummarySubheader",
  "buildValuationUnitsSummaryTableHtml",
  "buildValuationUnitsSummaryWordTableHtml",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];

const sandboxSource = `
  let state = {};
  ${extractArrayConst("valuationMarketRows")}
  ${extractArrayConst("valuationUrgentSaleRows")}
  ${extractComputedConst("VALUATION_UNITS_TABLE_ROW_DEFS")}
  ${extractArrayConst("VALUATION_UNITS_TABLE_IDENTITY_DEFS")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildValuationUnitsSummaryTableData, buildValuationUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable, buildValuationUnitsSummaryTableHtml,
    getValuationUnitsSummarySubheader, getValuationUnitsSummaryHeaderGroup,
    getRowDefs: () => VALUATION_UNITS_TABLE_ROW_DEFS,
    getIdentityDefs: () => VALUATION_UNITS_TABLE_IDENTITY_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

// --- 1) Farklı taşınmazlarda tablo verisi döner, sütun sırası doğru ------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      titleBlockName: "A", unitNo: "3",
      legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000",
      currentValueArea: "100", currentValueUnit: "5.500", currentValue: "550.000",
      legalUrgentSaleValue: "450.000", currentUrgentSaleValue: "500.000",
    },
    tables: {},
    titleUnits: [
      unit({ titleBlockName: "B", unitNo: "7", legalValueArea: "120", legalValueUnit: "6.000", legalValue: "720.000", legalUrgentSaleValue: "650.000" }),
    ],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  assert.equal(data.headers[1], "Blok", "İkinci sütun 'Blok' olmalı (Sıra No'nun HEMEN sağı).");
  assert.equal(data.headers[2], "Bağımsız Bölüm No", "Üçüncü sütun 'Bağımsız Bölüm No' olmalı.");
  const defs = fns.getRowDefs();
  assert.equal(data.headers[3], `${defs[0].label} - Alan`, "Dördüncü sütun ilk satırın 'Alan' sütunu olmalı.");
  const legalValueIndex = data.headers.indexOf("Yasal Durum Değeri");
  assert.equal(data.rows[0][legalValueIndex], "500.000", "1. taşınmazın Yasal Durum Değeri doğru sütunda olmalı.");
  assert.equal(data.rows[1][legalValueIndex], "720.000", "2. taşınmazın Yasal Durum Değeri doğru sütunda olmalı.");
  const urgentSaleIndex = data.headers.indexOf("Yasal Acil Satış Değeri");
  assert.ok(urgentSaleIndex >= 0, "Acil Satış Değeri sütunu bulunmalı.");
  assert.equal(data.rows[0][urgentSaleIndex], "450.000", "1. taşınmazın Acil Satış Değeri doğru sütunda olmalı.");
  console.log("Farkli tasinmazlarda tablo verisi + sutun sirasi testi tamam.");
}

// --- 1b) Kira alanı, piyasa alanı ile aynı olduğundan tekrar edilmez ------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      legalValueArea: "100", legalRentArea: "100", legalRentUnit: "150", legalRent: "15.000",
      currentValueArea: "110", currentRentArea: "110", currentRentUnit: "170", currentRent: "18.700",
    },
    tables: {},
    titleUnits: [unit({
      legalValueArea: "120", legalRentArea: "120", legalRentUnit: "160", legalRent: "19.200",
      currentValueArea: "130", currentRentArea: "130", currentRentUnit: "180", currentRent: "23.400",
    })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Yasal Kira Değeri - Alan"), "Yasal kira için alan sütunu tekrarlanmamalı.");
  assert.ok(!data.headers.includes("Mevcut Kira Değeri - Alan"), "Mevcut kira için alan sütunu tekrarlanmamalı.");
  const legalRentUnitIndex = data.headers.indexOf("Yasal Kira Değeri - M2 Birim Değeri");
  const legalRentIndex = data.headers.indexOf("Yasal Kira Değeri");
  assert.equal(data.columnMeta[legalRentUnitIndex].kind, "readonly", "Kira m2 birim değeri salt-okunur olmalı.");
  assert.equal(data.columnMeta[legalRentIndex].kind, "scalar", "Kira değeri düzenlenebilir olmalı.");
  assert.equal(data.rows[0][legalRentIndex], "15.000", "Yasal kira değeri korunmalı.");
  console.log("Kira alani piyasa alaniyla tekrarlanmadan kira birim/deger sutunlari testi tamam.");
}

// --- 2) Tekil raporda (1 taşınmaz) null döner ------------------------------
{
  fns.setState({ activeTitleUnitIndex: 0, fields: { legalValue: "500.000" }, tables: {}, titleUnits: [] });
  assert.equal(fns.buildValuationUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildValuationUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 3) Tüm taşınmazlarda BOŞ olan sütun kaldırılır (Arsa/Tarla'da Kira --
// satırlarının otomatik kalkması dahil).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValue: "500.000", legalRent: "", currentRent: "" },
    tables: {},
    titleUnits: [unit({ legalValue: "720.000", legalRent: "", currentRent: "" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(data, "Tablo verisi dönmeli.");
  assert.ok(!data.headers.includes("Yasal Kira Değeri"), "Tüm taşınmazlarda BOŞ olan \"Yasal Kira Değeri\" sütunu (Arsa/Tarla senaryosu) KALDIRILMALIYDI.");
  assert.ok(!data.headers.includes("Mevcut Kira Değeri"), "\"Mevcut Kira Değeri\" sütunu da KALDIRILMALIYDI.");
  assert.ok(data.headers.includes("Yasal Durum Değeri"), "Dolu olan sütun KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sutunun (Arsa/Tarla Kira senaryosu) kaldirilma testi tamam.");
}

// --- 4) columnMeta: Alan/Değer "scalar", M2 Birim Değeri/Acil Satış -------
// Değeri "readonly".
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000", legalUrgentSaleValue: "450.000" },
    tables: {},
    titleUnits: [unit({ legalValueArea: "120" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const areaIndex = data.headers.indexOf("Yasal Durum Değeri - Alan");
  const unitIndex = data.headers.indexOf("Yasal Durum Değeri - M2 Birim Değeri");
  const totalIndex = data.headers.indexOf("Yasal Durum Değeri");
  const urgentIndex = data.headers.indexOf("Yasal Acil Satış Değeri");
  assert.equal(data.columnMeta[areaIndex].kind, "scalar", "Alan sütunu düzenlenebilir (scalar) olmalı.");
  assert.equal(data.columnMeta[unitIndex].kind, "readonly", "M2 Birim Değeri sütunu salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[totalIndex].kind, "scalar", "Değer sütunu düzenlenebilir (scalar) olmalı.");
  assert.equal(data.columnMeta[urgentIndex].kind, "readonly", "Acil Satış Değeri sütunu salt-okunur olmalı (gerçek formda da öyle).");
  console.log("columnMeta scalar/readonly ayrimi testi tamam.");
}

// --- 5) buildTitleUnitsSummaryTableHtmlEditable(): scalar sütunlar -------
// düzenlenebilir, readonly sütunlar TIKLANAMAZ.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000", legalUrgentSaleValue: "450.000" },
    tables: {},
    titleUnits: [unit({ legalValueArea: "120" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const readonlyCount = data.columnMeta.filter((m) => m.kind === "readonly").length;
  assert.ok(readonlyCount >= 1, "En az 1 salt-okunur (M2 Birim Değeri/Acil Satış) sütun bekleniyordu.");
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca scalar sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable scalar/readonly ayrimi testi tamam.");
}

// --- 6) Gerçek HTML üretimi: dinamik genişlik + tam ortalama --------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000",
      currentValueArea: "100", currentValueUnit: "5.500", currentValue: "550.000",
    },
    tables: {},
    titleUnits: [unit({
      legalValueArea: "120", legalValueUnit: "6.000", legalValue: "720.000",
      currentValueArea: "120", currentValueUnit: "6.333", currentValue: "760.000",
    })],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  assert.ok(html.includes('rowspan="2"') && html.includes("YASAL DURUM DEĞERİ") && html.includes("MEVCUT DURUM DEĞERİ"), "Değerleme tablosu yasal/mevcut durum için iki katmanlı grup başlıkları kullanmalı.");
  assert.ok(html.includes("ALAN<br>(M²)") && html.includes("BİRİM DEĞERİ<br>(TL/M²)") && html.includes("PİYASA DEĞERİ<br>(TL)"), "Alt başlıklarda alan ve değer birimleri ikinci satırda gösterilmelidir.");
  assert.ok(html.includes("500.000") && html.includes("720.000"), "Her iki taşınmazın değerleri de HTML'de gözükmeli.");
  console.log("buildValuationUnitsSummaryWordTableHtml gercek HTML uretimi testi tamam.");
}

// --- 7) template-engine.js'te {{TASINMAZLARDEGERLEMETABLOSU}} kayıtlı mı --
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARDEGERLEMETABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildValuationUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARDEGERLEMETABLOSU}} -> buildValuationUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARDEGERLEMETABLOSU}} template-engine.js kablolama testi tamam.");
}

// --- 8) Blok/Bağımsız Bölüm No sütunları Sıra No'nun HEMEN sağında, ------
// readonly, doğru taşınmaza eşleşiyor.
{
  const identityDefs = fns.getIdentityDefs();
  assert.deepEqual(identityDefs.map((d) => d.key), ["titleBlockName", "unitNo"]);
  assert.deepEqual(identityDefs.map((d) => d.label), ["Blok", "Bağımsız Bölüm No"]);

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "3", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "7", legalValue: "720.000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const blockIndex = data.headers.indexOf("Blok");
  const unitNoIndex = data.headers.indexOf("Bağımsız Bölüm No");
  assert.equal(data.columnMeta[blockIndex].kind, "readonly", "'Blok' sütunu readonly olmalı.");
  assert.equal(data.columnMeta[unitNoIndex].kind, "readonly", "'Bağımsız Bölüm No' sütunu readonly olmalı.");
  assert.equal(data.rows[0][blockIndex], "A", "1. taşınmazın Blok bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[1][unitNoIndex], "7", "2. taşınmazın Bağımsız Bölüm No bilgisi doğru sütunda olmalı.");
  console.log("Blok-Bagimsiz Bolum No kimlik sutunlari testi tamam.");
}

// --- 9) İki katmanlı HTML renderer'da Blok/BB No subheader'ı YANLIŞLIKLA -
// "Piyasa Değeri (TL)" olmamalı (regresyon).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "3", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "7", legalValue: "720.000" })],
  });
  assert.equal(fns.getValuationUnitsSummarySubheader("Blok"), "Blok");
  assert.equal(fns.getValuationUnitsSummarySubheader("Bağımsız Bölüm No"), "Bağımsız Bölüm No");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Blok"), "Diğer", "'Blok' Yasal/Mevcut grubuna DEĞİL, 'Diğer'e düşmeli.");
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes(">BLOK<") || html.includes(">Blok<"), "HTML'de 'Blok' başlığı görünmeli.");
  assert.ok(!/>BLOK<\/th>[\s\S]{0,5}PİYASA DEĞERİ/i.test(html), "'Blok' sütunu YANLIŞLIKLA 'Piyasa Değeri' alt-başlığı almamalı.");
  console.log("Blok-BBNo subheader regresyon testi tamam.");
}

// --- 10) Yalnızca değerleme önizlemesi iki katmanlı renderer'ı kullanır --
{
  assert.match(
    appSource,
    /function createValuationUnitsSummaryTablePreview\(\)[\s\S]*?buildValuationUnitsSummaryTableHtml\(data, state\.activeTitleUnitIndex, \{ editable: true \}\)/,
    "Değerleme özeti ekranda iki katmanlı grup başlıklarıyla render edilmelidir."
  );
  assert.match(
    appSource,
    /function createTitleUnitsSummaryTablePreview\(\)[\s\S]*?buildTitleUnitsSummaryTableHtmlEditable\(data\.headers, data\.rows, data\.columnMeta, state\.activeTitleUnitIndex\)/,
    "Tapu özeti değerleme tablosuna özgü renderer'a yönlendirilmemelidir."
  );
  console.log("Değerleme iki katmanlı başlık renderer kablolama testi tamam.");
}

// --- 11) renderSection() "valuation" gate'i createValuationCopyToSelectedControl()'u
// createTitleUnitTabBar()'in extraActions'ina ekliyor mu.
{
  assert.match(
    appSource,
    /if \(section\.id === "valuation" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createValuationCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createValuationUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'valuation' gate'i createValuationCopyToSelectedControl()'u extraActions'a eklemiyor."
  );
  console.log("renderSection valuation gate kaynak-duzeyi kablolama testi tamam.");
}

console.log("Tasinmazlar degerleme ozeti tablosu testleri basarili.");
