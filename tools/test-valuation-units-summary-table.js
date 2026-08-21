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
//     satırlarında alan tekrar edilmeden M2 Birim Değeri/Değer).
//  2) Tekil raporda (1 taşınmaz) null döner.
//  3) Tüm taşınmazlarda BOŞ olan sütun tamamen kaldırılır (Arsa/Tarla'da
//     Kira satırlarının otomatik kalkması dahil — createValuationMarketTable'ın
//     KENDİ landOwnership filtresiyle TUTARLI).
//  4) columnMeta: Alan/Değer sütunları "scalar", M2 Birim Değeri "readonly"
//     (gerçek formda da salt-okunur).
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
//
// Kullanıcı takip talebi (2026-08-21, iki mesaj): "acil satış değerleri
// gözükmesin tabloda yasal ve mevcut. yapı birim değeri inşaat seviyesi
// yapı yıpranma payı yapı [değeri] sigortaya esas değer arsa değeri
// gözüksün" + "yasal ve mevcut yapı değeri yani kullanım alanı x yapı
// birim değeri x yıpranma payı x inşaat seviye formülü ile ulaşılan
// sonuçta yer almalı":
// 14) Acil Satış Değeri sütunları ARTIK YOK (regresyon). Yapı Değeri
//     formülünün TÜM bileşenleri (Alan/Yapı Birim Değeri/Yıpranma Payı/
//     İnşaat Seviyesi, panelin GERÇEK sırasıyla) + formülün SONUCU (Yapı
//     Değeri, Yasal VE Mevcut) + Sigortaya Esas Değer + Arsa Değeri
//     sütunları eklendi,
//     doğru kind ("scalar"/"readonly") ve değerlerle.
// 15) Yeni sütunların grup/subheader eşleşmesi doğru: "Yasal Yapı Değeri"/
//     "Mevcut Yapı Değeri" KENDİ grup başlıklarını alır (genel "Yasal/
//     Mevcut Durum Değeri" grubuna KARIŞMAZ), Sigortaya Esas Değer/Arsa
//     Değeri "Diğer" grubuna düşer ama kendi subheader etiketlerini taşır.

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
  "computeTitleUnitsShareSameAdaParsel",
  "computeTitleUnitShareOfLandArea",
  "parseReportNumber",
  "formatSquareMeterArea",
];

const sandboxSource = `
  let state = {};
  // computeValuationFieldsForAllTitleUnits() (bu dosyanin odagi DEGIL —
  // dongu/bayrak mekanigi tools/test-title-unit-switch.js senaryo 33/34'te
  // gercekten test ediliyor) burada no-op bir SAHTE ile degistirilir,
  // aksi halde buildValuationUnitsSummaryWordTableHtml()'in ONA yaptigi
  // YENI cagri ReferenceError firlatirdi.
  function computeValuationFieldsForAllTitleUnits() {}
  ${extractArrayConst("valuationMarketRows")}
  ${extractArrayConst("valuationUrgentSaleRows")}
  ${extractComputedConst("VALUATION_UNITS_TABLE_ROW_DEFS")}
  ${extractArrayConst("VALUATION_UNITS_TABLE_IDENTITY_DEFS")}
  ${extractArrayConst("valuationBuildingValueRows")}
  ${extractArrayConst("valuationPremiumRows")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildValuationUnitsSummaryTableData, buildValuationUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable, buildValuationUnitsSummaryTableHtml,
    getValuationUnitsSummarySubheader, getValuationUnitsSummaryHeaderGroup,
    getRowDefs: () => VALUATION_UNITS_TABLE_ROW_DEFS,
    getIdentityDefs: () => VALUATION_UNITS_TABLE_IDENTITY_DEFS,
    getBuildingValueRows: () => valuationBuildingValueRows,
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
    },
    tables: {},
    titleUnits: [
      unit({ titleBlockName: "B", unitNo: "7", legalValueArea: "120", legalValueUnit: "6.000", legalValue: "720.000" }),
    ],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.equal(data.rows.length, 2, "2 satır (2 taşınmaz) bekleniyordu.");
  assert.equal(data.headers[0], "Sıra No", "\"Sıra No\" EN SOL sütun olmalı.");
  assert.equal(data.headers[1], "Blok", "İkinci sütun 'Blok' olmalı (Sıra No'nun HEMEN sağı).");
  assert.equal(data.headers[2], "BB No", "Üçüncü sütun 'BB No' olmalı.");
  const defs = fns.getRowDefs();
  assert.equal(data.headers[3], `${defs[0].label} - Alan`, "Dördüncü sütun ilk satırın 'Alan' sütunu olmalı.");
  const legalValueIndex = data.headers.indexOf("Yasal Durum Değeri");
  assert.equal(data.rows[0][legalValueIndex], "500.000", "1. taşınmazın Yasal Durum Değeri doğru sütunda olmalı.");
  assert.equal(data.rows[1][legalValueIndex], "720.000", "2. taşınmazın Yasal Durum Değeri doğru sütunda olmalı.");
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

// --- 4) columnMeta: Alan/Değer "scalar", M2 Birim Değeri "readonly". ------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ legalValueArea: "120" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const areaIndex = data.headers.indexOf("Yasal Durum Değeri - Alan");
  const unitIndex = data.headers.indexOf("Yasal Durum Değeri - M2 Birim Değeri");
  const totalIndex = data.headers.indexOf("Yasal Durum Değeri");
  assert.equal(data.columnMeta[areaIndex].kind, "scalar", "Alan sütunu düzenlenebilir (scalar) olmalı.");
  assert.equal(data.columnMeta[unitIndex].kind, "readonly", "M2 Birim Değeri sütunu salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[totalIndex].kind, "scalar", "Değer sütunu düzenlenebilir (scalar) olmalı.");
  console.log("columnMeta scalar/readonly ayrimi testi tamam.");
}

// --- 5) buildTitleUnitsSummaryTableHtmlEditable(): scalar sütunlar -------
// düzenlenebilir, readonly sütunlar TIKLANAMAZ.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { legalValueArea: "100", legalValueUnit: "5.000", legalValue: "500.000" },
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
  assert.deepEqual(identityDefs.map((d) => d.label), ["Blok", "BB No"]);

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "3", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "7", legalValue: "720.000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const blockIndex = data.headers.indexOf("Blok");
  const unitNoIndex = data.headers.indexOf("BB No");
  assert.equal(data.columnMeta[blockIndex].kind, "readonly", "'Blok' sütunu readonly olmalı.");
  assert.equal(data.columnMeta[unitNoIndex].kind, "readonly", "'BB No' sütunu readonly olmalı.");
  assert.equal(data.rows[0][blockIndex], "A", "1. taşınmazın Blok bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[1][unitNoIndex], "7", "2. taşınmazın BB No bilgisi doğru sütunda olmalı.");
  console.log("Blok-BBNo kimlik sutunlari testi tamam.");
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
  assert.equal(fns.getValuationUnitsSummarySubheader("BB No"), "BB No");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Blok"), "Diğer", "'Blok' Yasal/Mevcut grubuna DEĞİL, 'Diğer'e düşmeli.");
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes(">BLOK<") || html.includes(">Blok<"), "HTML'de 'Blok' başlığı görünmeli.");
  assert.ok(!/>BLOK<\/th>[\s\S]{0,5}PİYASA DEĞERİ/i.test(html), "'Blok' sütunu YANLIŞLIKLA 'Piyasa Değeri' alt-başlığı almamalı.");
  // Kullanıcı takip talebi (2026-08-21): "sıra no blok ve bağımsız bölüm
  // no sütunları olabildiğince daralt" — Sıra No/Blok/BB No (rowspan="2"
  // olan 3 <th>) HER BİRİ dar sabit genişlik almalı.
  const leadingThs = [...html.matchAll(/<th rowspan="2" style="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(leadingThs.length, 3, "3 rowspan=2 basligi (Sira No/Blok/BB No) olmali.");
  leadingThs.forEach((style) => {
    assert.ok(style.includes("width:24pt;"), `Kimlik sutunu basligi dar genislik almali, bulunan stil: ${style}`);
  });
  console.log("Blok-BBNo subheader regresyon + daraltma testi tamam.");
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
// createTitleUnitTabBar()'in extraActions'ina ekliyor mu. (2026-08-21 devam:
// computeValuationFieldsForAllTitleUnits() bu gate'e EKLENDIGI icin
// body.append(createTitleUnitTabBar(...)) satirindan hemen ONCE artik
// baska satirlar da var — [\s\S]*? ile esnetildi, bkz. senaryo 13.)
{
  assert.match(
    appSource,
    /if \(section\.id === "valuation" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{[\s\S]*?body\.append\(createTitleUnitTabBar\(\{ extraActions: \[createValuationCopyToSelectedControl\(\)\] \}\)\);\s*\n\s*body\.append\(createValuationUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'valuation' gate'i createValuationCopyToSelectedControl()'u extraActions'a eklemiyor."
  );
  console.log("renderSection valuation gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 12) REGRESYON (kullanıcı ekran görüntüsü: "sütun başlıkları --------
// karışmış"): Blok/Bağımsız Bölüm No Sıra No'nun HEMEN sağında render
// edilir (Diğer grubuna düşüp tabloyu SONA kaymaz) VE gövde hücreleri
// başlıkla TAM olarak aynı sırada (Kira sütunlarının Durum sütunlarının
// İÇİNE gruplanması da dahil, kök neden buydu).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      titleBlockName: "BLOK-A", unitNo: "BBNO-5",
      legalValueArea: "111", legalValueUnit: "222", legalValue: "333", legalUrgentSaleValue: "444",
      currentValueArea: "555", currentValueUnit: "666", currentValue: "777", currentUrgentSaleValue: "888",
      legalRentArea: "111", legalRentUnit: "999", legalRent: "1010",
      currentRentArea: "555", currentRentUnit: "1111", currentRent: "1212",
    },
    tables: {},
    titleUnits: [unit({ titleBlockName: "BLOK-B", unitNo: "BBNO-9" })],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  const theadMatch = html.match(/<thead>([\s\S]*?)<\/thead>/);
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  assert.ok(theadMatch && tbodyMatch, "thead/tbody bulunmali.");
  const headerRows = [...theadMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  assert.equal(headerRows.length, 2, "Iki katmanli baslik (2 <tr>) olmali.");
  const topThCells = [...headerRows[0][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1]);
  assert.equal(topThCells[0], "SIRA NO", "1. ust-satir hucresi Sira No olmali.");
  assert.equal(topThCells[1], "BLOK", "2. ust-satir hucresi Blok olmali (rowspan=2, TEK sutun, grup DEGIL).");
  assert.equal(topThCells[2], "BB NO", "3. ust-satir hucresi BB No olmali.");
  assert.ok(!topThCells.includes("DİĞER"), "'Diğer' grup basligi ARTIK gorunmemeli (kimlik sutunlari one tasindi, grup bos kaldi).");

  const bodyRows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const firstRowCells = [...bodyRows[0][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  assert.equal(firstRowCells[0], "1", "Govdenin 1. hucresi Sira No (1) olmali.");
  assert.equal(firstRowCells[1], "BLOK-A", "Govdenin 2. hucresi Blok degeri olmali (Yasal Alan DEGIL - bu, kullanicinin bildirdigi karisma).");
  assert.equal(firstRowCells[2], "BBNO-5", "Govdenin 3. hucresi Bagimsiz Bolum No degeri olmali.");

  // Alt-basliklarin (2. satir <th>) SAYISI, her govde satirindaki <td>
  // sayisindan (kimlik+Sira No haric) BIREBIR eslesmeli - hizalama
  // dogrulamasinin genel formu.
  const subThCells = [...headerRows[1][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
  assert.equal(subThCells.length, firstRowCells.length - 3, "Alt-baslik sayisi, govde hucre sayisi (Sira No+Blok+BBNo haric) ile eslesmeli.");
  console.log("Header/govde hizalama regresyon testi (Blok/BBNo en basta, Kira/Durum karismiyor) tamam.");
}

// --- 13) computeValuationFieldsForAllTitleUnits(): kaynak-duzeyi kablolama
// (2026-08-21). Kullanici bildirimi: "bagimsiz bolum bilgisi doldurulan
// diger tasinmazlarin degerleri otomatik olusmaliydi ancak olusmadi" —
// davranissal test tools/test-title-unit-switch.js'te (senaryo 33/34);
// burada yalnizca KAYNAK-DUZEYI kablolama dogrulanir: (a) 7 DOM-dokunan
// alt-fonksiyonun HER BIRI suppressValuationSideEffects bayragiyla
// korunuyor mu, (b) computeValuationFieldsForAllTitleUnits() renderSection()'in
// "valuation" gate'inde VE export fonksiyonunda cagriliyor mu.
{
  const guardedFunctionNames = [
    "refreshValuationControls",
    "refreshBuildingDepreciationFromCurrentFields",
    "refreshWorkplaceFloorCalculationTable",
    "refreshValuationSaleabilityExplanation",
    "refreshValuationRentExplanation",
    "refreshValuationMethodExplanation",
    "refreshForeignCurrencyValuationExplanation",
  ];
  guardedFunctionNames.forEach((name) => {
    const fnStart = appSource.indexOf(`\nfunction ${name}(`);
    assert(fnStart >= 0, `${name}() bulunamadi.`);
    const bodyStart = appSource.indexOf("{", fnStart);
    const nextLines = appSource.slice(bodyStart, bodyStart + 250);
    assert.match(
      nextLines,
      /\{\s*\n\s*if \(suppressValuationSideEffects\) return;/,
      `${name}() suppressValuationSideEffects bayragiyla korunmuyor (ilk satir olmali).`
    );
  });
  console.log("7 DOM-dokunan alt-fonksiyonun suppressValuationSideEffects korumasi testi tamam.");

  assert.match(
    appSource,
    /if \(section\.id === "valuation" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{[\s\S]{0,400}?computeValuationFieldsForAllTitleUnits\(\);[\s\S]{0,300}?body\.append\(createTitleUnitTabBar\(/,
    "renderSection() 'valuation' gate'i computeValuationFieldsForAllTitleUnits()'i tab cubugundan ONCE cagirmiyor."
  );
  assert.match(
    appSource,
    /function buildValuationUnitsSummaryWordTableHtml\(\) \{[\s\S]{0,300}?computeValuationFieldsForAllTitleUnits\(\);[\s\S]{0,200}?buildValuationUnitsSummaryTableData\(\)/,
    "buildValuationUnitsSummaryWordTableHtml() computeValuationFieldsForAllTitleUnits()'i cagirmiyor (export'ta guncel olmayabilir)."
  );
  console.log("computeValuationFieldsForAllTitleUnits cagri-noktalari (renderSection + export) kablolama testi tamam.");
}

// --- 14) Acil Satış Değeri sütunları ARTIK YOK (regresyon); Yapı Değeri --
// (Yasal+Mevcut, Yapı Birim Değeri/İnşaat Seviyesi/Yıpranma Payı/Yapı
// Değeri) + Sigortaya Esas Değer + Arsa Değeri sütunları doğru kind ve
// değerlerle eklendi.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      legalValue: "500.000", legalUrgentSaleValue: "450.000", currentUrgentSaleValue: "500.000",
      legalBuildingValueArea: "100", legalBuildingUnitCost: "3.000", legalBuildingConstructionLevel: "100", legalBuildingDepreciationRate: "10", legalBuildingValue: "270.000",
      currentBuildingValueArea: "100", currentBuildingUnitCost: "3.200", currentBuildingConstructionLevel: "100", currentBuildingDepreciationRate: "8", currentBuildingValue: "294.400",
      insuranceValue: "310.000", landValue: "180.000",
    },
    tables: {},
    titleUnits: [unit({ legalValue: "600.000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Yasal Acil Satış Değeri"), "'Yasal Acil Satış Değeri' sütunu ARTIK bulunmamalı.");
  assert.ok(!data.headers.includes("Mevcut Acil Satış Değeri"), "'Mevcut Acil Satış Değeri' sütunu ARTIK bulunmamalı.");

  const buildingRows = fns.getBuildingValueRows();
  assert.deepEqual(buildingRows.map((r) => r.label), ["Yasal Yapı Değeri", "Mevcut Yapı Değeri"]);

  // Kullanıcı takip talebi (2026-08-21): "yani kullanım alanı x yapı birim
  // değeri x yıpranma payı x inşaat seviye formülü ile ulaşılan sonuçta
  // yer almalı" — formülün TÜM bileşenleri (Alan dahil) sütun olarak
  // bulunmalı, panelin GERÇEK sırasıyla (Alan, Birim Değeri, Yıpranma
  // Payı, İnşaat Seviyesi, Değer — bkz. createValuationBuildingValueTable).
  const legalAreaIndex = data.headers.indexOf("Yasal Yapı Değeri - Alan");
  const legalUnitCostIndex = data.headers.indexOf("Yasal Yapı Değeri - Yapı Birim Değeri");
  const legalDepreciationIndex = data.headers.indexOf("Yasal Yapı Değeri - Yıpranma Payı");
  const legalLevelIndex = data.headers.indexOf("Yasal Yapı Değeri - İnşaat Seviyesi");
  const legalBuildingTotalIndex = data.headers.indexOf("Yasal Yapı Değeri");
  assert.ok(legalAreaIndex >= 0 && legalUnitCostIndex >= 0 && legalDepreciationIndex >= 0 && legalLevelIndex >= 0 && legalBuildingTotalIndex >= 0, "Yasal Yapı Değeri formülünün TÜM sütunları (Alan dahil) bulunmalı.");
  assert.ok(legalAreaIndex < legalUnitCostIndex && legalUnitCostIndex < legalDepreciationIndex && legalDepreciationIndex < legalLevelIndex && legalLevelIndex < legalBuildingTotalIndex, "Sütun sırası panelin GERÇEK sırasıyla (Alan, Birim Değeri, Yıpranma Payı, İnşaat Seviyesi, Değer) aynı olmalı.");
  assert.equal(data.columnMeta[legalAreaIndex].kind, "readonly", "Alan sütunu salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[legalUnitCostIndex].kind, "scalar", "Yapı Birim Değeri düzenlenebilir olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[legalLevelIndex].kind, "readonly", "İnşaat Seviyesi salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[legalDepreciationIndex].kind, "scalar", "Yıpranma Payı düzenlenebilir olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[legalBuildingTotalIndex].kind, "readonly", "Yapı Değeri (toplam) salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.rows[0][legalAreaIndex], "100");
  assert.equal(data.rows[0][legalUnitCostIndex], "3.000");
  assert.equal(data.rows[0][legalBuildingTotalIndex], "270.000");

  const currentBuildingTotalIndex = data.headers.indexOf("Mevcut Yapı Değeri");
  assert.ok(currentBuildingTotalIndex >= 0, "Mevcut Yapı Değeri sütunu bulunmalı.");
  assert.equal(data.rows[0][currentBuildingTotalIndex], "294.400");

  const insuranceIndex = data.headers.indexOf("Sigortaya Esas Değer");
  const landIndex = data.headers.indexOf("Arsa Değeri");
  assert.ok(insuranceIndex >= 0 && landIndex >= 0, "Sigortaya Esas Değer/Arsa Değeri sütunları bulunmalı.");
  assert.equal(data.columnMeta[insuranceIndex].kind, "readonly", "Sigortaya Esas Değer salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.columnMeta[landIndex].kind, "readonly", "Arsa Değeri salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.rows[0][insuranceIndex], "310.000");
  assert.equal(data.rows[0][landIndex], "180.000");
  console.log("Acil Satis kaldirma + Yapi Degeri/Sigorta/Arsa sutunlari testi tamam.");
}

// --- 15) Yeni sütunların grup/subheader eşleşmesi doğru. ------------------
{
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Yapı Değeri - Alan"), "Yasal Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Yapı Değeri - Yapı Birim Değeri"), "Yasal Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Yapı Değeri"), "Yasal Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Yapı Değeri - İnşaat Seviyesi"), "Mevcut Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Durum Değeri"), "Yasal Durum Değeri", "Piyasa değeri grubu ETKİLENMEMELİ.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Sigortaya Esas Değer"), "Diğer");
  // "Arsa Değeri" ARTIK "Diğer"e düşmüyor — kendi grup başlığını alıyor
  // (kullanıcı takip talebi: "arsa değerini yapı değeri gibi ana başlık
  // altında topla"), bkz. senaryo 18.
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Değeri"), "Arsa Değeri");

  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Yapı Değeri - Alan"), "Alan\n(m²)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Yapı Değeri - Yapı Birim Değeri"), "Yapı Birim Değeri\n(TL/m²)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Yapı Değeri - İnşaat Seviyesi"), "İnşaat Seviyesi\n(%)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Mevcut Yapı Değeri - Yıpranma Payı"), "Yıpranma Payı\n(%)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Mevcut Yapı Değeri"), "Yapı Değeri\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Sigortaya Esas Değer"), "Sigortaya Esas Değer\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Arsa Değeri"), "Arsa Değeri\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Durum Değeri"), "Piyasa Değeri\n(TL)", "Piyasa değeri subheader'ı ETKİLENMEMELİ.");

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      legalValue: "500.000",
      legalBuildingValueArea: "100", legalBuildingUnitCost: "3.000", legalBuildingConstructionLevel: "100", legalBuildingDepreciationRate: "10", legalBuildingValue: "270.000",
      insuranceValue: "310.000", landValue: "180.000",
    },
    tables: {},
    titleUnits: [unit({ legalValue: "600.000" })],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes("YASAL YAPI DEĞERİ"), "'Yasal Yapı Değeri' grup başlığı HTML'de görünmeli.");
  assert.ok(html.includes("SİGORTAYA ESAS DEĞER") || html.includes("Sigortaya Esas Değer"), "Sigortaya Esas Değer başlığı HTML'de görünmeli.");
  assert.ok(html.includes("270.000") && html.includes("310.000") && html.includes("180.000"), "Yapı Değeri/Sigorta/Arsa değerleri HTML'de gözükmeli.");
  console.log("Yeni sutunlarin grup/subheader eslesmesi testi tamam.");
}

// --- 16) Kullanici talebi (2026-08-21): "her bir bagimsiz bolumun arsa --
// pay arsa payda ve hissesine dusen arsa payi bolumlerini tablomuza
// ekleyelim" - TUM tasinmazlar AYNI ada/parselde ise Arsa Payi/Arsa Payda/
// Hissesine Dusen Arsa Payi sutunlari eklenir, dogru kind/degerlerle.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5", legalValue: "500.000",
      share: "10", denominator: "100", landArea: "1000",
    },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", legalValue: "600.000", share: "20", denominator: "100", landArea: "1000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const shareIndex = data.headers.indexOf("Arsa Payı");
  const denominatorIndex = data.headers.indexOf("Arsa Payda");
  const shareOfAreaIndex = data.headers.indexOf("Hissesine Düşen Arsa Payı");
  assert.ok(shareIndex >= 0 && denominatorIndex >= 0 && shareOfAreaIndex >= 0, "AYNI ada/parselde 3 yeni sutun da bulunmali.");
  assert.equal(data.columnMeta[shareIndex].kind, "scalar", "Arsa Payi duzenlenebilir olmali (gercek formda da oyle).");
  assert.equal(data.columnMeta[denominatorIndex].kind, "scalar", "Arsa Payda duzenlenebilir olmali.");
  assert.equal(data.columnMeta[shareOfAreaIndex].kind, "readonly", "Hissesine Dusen Arsa Payi turetilmis/salt-okunur olmali.");
  assert.equal(data.rows[0][shareIndex], "10");
  assert.equal(data.rows[0][denominatorIndex], "100");
  assert.equal(data.rows[0][shareOfAreaIndex], "100,00 m²", "1. tasinmazin hissesine dusen arsa payi (1000/100)x10=100 m2 olmali.");
  assert.equal(data.rows[1][shareOfAreaIndex], "200,00 m²", "2. tasinmazin hissesine dusen arsa payi (1000/100)x20=200 m2 olmali.");
  console.log("Ayni ada/parselde Arsa Payi/Payda/Hissesine Dusen Arsa Payi sutunlari testi tamam.");
}

// --- 17) REGRESYON: FARKLI ada/parselde bu 3 sutun HIC gorunmemeli --------
// (Tapu ozet tablosundaki AYNI gerekce - payi/paydasi farkli parsellere
// ait tasinmazlari yan yana gostermek yaniltici olur).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", legalValue: "500.000", share: "10", denominator: "100", landArea: "1000" },
    tables: {},
    titleUnits: [unit({ blockNo: "200", parcelNo: "9", legalValue: "600.000", share: "20", denominator: "100", landArea: "800" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Arsa Payı"), "FARKLI ada/parselde 'Arsa Payı' sutunu gorunmemeli.");
  assert.ok(!data.headers.includes("Arsa Payda"), "FARKLI ada/parselde 'Arsa Payda' sutunu gorunmemeli.");
  assert.ok(!data.headers.includes("Hissesine Düşen Arsa Payı"), "FARKLI ada/parselde 'Hissesine Düşen Arsa Payı' sutunu gorunmemeli.");
  console.log("Farkli ada/parselde Arsa Payi/Payda/Hissesine Dusen Arsa Payi sutunlarinin GIZLENMESI testi tamam.");
}

// --- 18) Yeni sutunlarin subheader eslesmesi dogru (para birimi degil) ----
{
  assert.equal(fns.getValuationUnitsSummarySubheader("Arsa Payı"), "Arsa Payı");
  assert.equal(fns.getValuationUnitsSummarySubheader("Arsa Payda"), "Arsa Payda");
  assert.equal(fns.getValuationUnitsSummarySubheader("Hissesine Düşen Arsa Payı"), "Hissesine Düşen\nArsa Payı (m²)");
  // Kullanici takip talebi (2026-08-21): "arsa degerini yapi degeri gibi
  // ana baslik altinda topla" - Arsa Payi/Payda/Hissesine Dusen Arsa Payi
  // (bilesenler) + Arsa Degeri (sonuc) ARTIK "Diger"e DUSMUYOR, KENDI
  // "Arsa Degeri" grup basligini aliyor (Yapi Degeri'nin AYNI deseni).
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Payı"), "Arsa Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Payda"), "Arsa Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Hissesine Düşen Arsa Payı"), "Arsa Değeri");
  console.log("Arsa Payi/Payda/Hissesine Dusen Arsa Payi subheader eslesmesi testi tamam.");
}

// --- 19) Arsa Degeri grubu Yapi Degeri'nin SOLUNA yerlesir (kullanici ----
// talebi: "ARSA DEĞERİNİ YAPI değerin sütununun soluna al"), Sigortaya
// Esas Deger "Diger"de kalir (kullanici talebi: "sigortaya esas deger
// diger bolumunun altinda kalabilir").
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      blockNo: "100", parcelNo: "5", legalValue: "500.000",
      share: "10", denominator: "100", landArea: "1000", landValue: "8.887.500",
      legalBuildingValueArea: "100", legalBuildingUnitCost: "3.000", legalBuildingConstructionLevel: "100", legalBuildingDepreciationRate: "10", legalBuildingValue: "270.000",
      insuranceValue: "310.000",
    },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", legalValue: "600.000", share: "20", denominator: "100", landArea: "1000" })],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  const topThCells = [...html.matchAll(/<th[^>]*colspan[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1]);
  const arsaIndex = topThCells.indexOf("ARSA DEĞERİ");
  const yasalYapiIndex = topThCells.indexOf("YASAL YAPI DEĞERİ");
  assert.ok(arsaIndex >= 0, "'Arsa Değeri' KENDİ grup başlığını almalı (colspan'lı <th>).");
  assert.ok(yasalYapiIndex >= 0, "'Yasal Yapı Değeri' grubu bulunmalı.");
  assert.ok(arsaIndex < yasalYapiIndex, "'Arsa Değeri' grubu 'Yasal Yapı Değeri'nin SOLUNDA (önce) olmalı.");
  assert.ok(!topThCells.includes("DİĞER") || topThCells.indexOf("DİĞER") > arsaIndex, "'Arsa Değeri' 'Diğer' grubuna KARIŞMAMALI.");
  console.log("Arsa Degeri grubu Yapi Degeri'nin soluna yerlesme + Sigorta Diger'de kalma testi tamam.");
}

// --- 20) Kullanici talebi (2026-08-21): "sigortaya esas degerinden once --
// yasal ve mevcut serefiye sutunlarini koyalim" - Yasal/Mevcut Serefiye
// (Şerefiye Değeri sonucu, valuationPremiumRows.premiumKey) sutunlari
// eklendi, dogru kind/degerle, HEMEN Sigortaya Esas Deger'den once.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      legalValue: "500.000",
      legalPremiumValue: "150.000", currentPremiumValue: "160.000",
      insuranceValue: "310.000",
    },
    tables: {},
    titleUnits: [unit({ legalValue: "600.000", legalPremiumValue: "170.000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const legalPremiumIndex = data.headers.indexOf("Yasal Şerefiye");
  const currentPremiumIndex = data.headers.indexOf("Mevcut Şerefiye");
  const insuranceIndex = data.headers.indexOf("Sigortaya Esas Değer");
  assert.ok(legalPremiumIndex >= 0 && currentPremiumIndex >= 0, "'Yasal Şerefiye'/'Mevcut Şerefiye' sütunları bulunmalı.");
  assert.ok(insuranceIndex >= 0, "'Sigortaya Esas Değer' sütunu bulunmalı.");
  assert.ok(legalPremiumIndex < insuranceIndex && currentPremiumIndex < insuranceIndex, "Yasal/Mevcut Şerefiye, Sigortaya Esas Değer'den ÖNCE gelmeli.");
  assert.ok(currentPremiumIndex - legalPremiumIndex === 1, "Yasal Şerefiye ile Mevcut Şerefiye BİTİŞİK olmalı.");
  assert.equal(data.columnMeta[legalPremiumIndex].kind, "readonly", "Şerefiye Değeri hesaplanan/salt-okunur olmalı (gerçek formda da öyle).");
  assert.equal(data.rows[0][legalPremiumIndex], "150.000");
  assert.equal(data.rows[0][currentPremiumIndex], "160.000");
  assert.equal(data.rows[1][legalPremiumIndex], "170.000");

  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Şerefiye"), "Diğer", "Yasal Şerefiye kendi ana başlığını İSTEMEDİ, 'Diğer'de kalmalı.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Şerefiye"), "Diğer");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Şerefiye"), "Yasal Şerefiye\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Mevcut Şerefiye"), "Mevcut Şerefiye\n(TL)");
  console.log("Yasal/Mevcut Serefiye sutunlari Sigortaya Esas Deger'den once testi tamam.");
}

console.log("Tasinmazlar degerleme ozeti tablosu testleri basarili.");
