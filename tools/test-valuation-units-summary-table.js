// Çoklu taşınmazlı raporlarda DEĞERLEME bilgilerini özetleyen tablo
// (Çift Yönlü Düzenleme, 2026-08-19). Kullanıcı talebi: "değerleme
// kısmında tab mantığı ve çift taraflı tablo mantığı olmalı" — kapsam
// Piyasa Değeri tablosunun TAMAMI.
//
// Kullanıcı, 2026-08-21/22'de İKİ ekran görüntüsüyle (ikincisi düzeltilmiş
// nihai hali) TAM sütun sırası/gruplaması verdi: "tablo yapısının bu
// şekilde olmasını istiyorum." Bu dosya artık O HEDEF YERLEŞİMİ test
// eder (bkz. plan: idempotent-launching-kernighan.md, ve
// buildValuationUnitsSummaryTableData()'nın üstündeki kaynak yorumu).
//
// Hedef sütun/grup sırası (soldan sağa):
//  Sıra No/Blok/BB No (leading) → YASAL[Alan]/MEVCUT[Alan] →
//  PARAMETRELER[Arsa Birim Değeri/Yapı Birim Değeri/Yıpranma Payı/İnş.
//  Sev. — TEK satır, Yasal/Mevcut ayrı değil] → ARSA DEĞERİ[Arsa Payı/
//  Payda/Hissesine Düşen Arsa Payı/Arsa Değeri] → YASAL YAPI DEĞERİ[Eksik
//  İmalat Tutarı/Yapı Değeri] → MEVCUT YAPI DEĞERİ[aynı] →
//  YASAL[Şerefiye]/MEVCUT[Şerefiye] → DİĞER[Sigortaya Esas Değer] →
//  YASAL DURUM DEĞERİ[M2 Birim Değeri/Piyasa Değeri] → MEVCUT DURUM
//  DEĞERİ[aynı] → NATAMAM YASAL DURUM DEĞERİ[M2 Birim Değeri/Durum
//  Değeri] → NATAMAM MEVCUT DURUM DEĞERİ[aynı] → YASAL KİRA DEĞERİ[Kira
//  M2 Birim Değeri/Kira Değeri] → MEVCUT KİRA DEĞERİ[aynı].

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
  "finalizeTitleUnitsSummaryTableData",
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  "buildValuationUnitsSummaryTableData",
  "getValuationUnitsSummaryHeaderGroup",
  "getValuationUnitsSummarySubheader",
  "getValuationUnitsSummaryGroupDisplayLabel",
  // Toplam satırı (2026-08-22) icin -  buildValuationUnitsSummaryTableHtml
  // artik hangi sutunlarin toplanabilir oldugunu bununla belirliyor.
  "isValuationUnitsSummaryColumnSummable",
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
  // Negatif deger kirmizi punto testi (2026-08-22) icin -
  // buildValuationUnitsSummaryTableHtml artik hucre metnini negatiflik
  // kontrolu icin bununla parse ediyor.
  "parseValuationNumber",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik buna (ve bagimliliklarina) bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
];

const sandboxSource = `
  let state = {};
  // computeValuationFieldsForAllTitleUnits() (bu dosyanin odagi DEGIL —
  // dongu/bayrak mekanigi tools/test-title-unit-switch.js senaryo 33/34'te
  // gercekten test ediliyor) burada no-op bir SAHTE ile degistirilir,
  // aksi halde buildValuationUnitsSummaryWordTableHtml()'in ONA yaptigi
  // cagri ReferenceError firlatirdi.
  function computeValuationFieldsForAllTitleUnits() {}
  ${extractArrayConst("valuationMarketRows")}
  ${extractArrayConst("valuationUrgentSaleRows")}
  ${extractComputedConst("VALUATION_UNITS_TABLE_ROW_DEFS")}
  ${extractComputedConst("incompleteConstructionMarketRows")}
  ${extractArrayConst("VALUATION_UNITS_TABLE_IDENTITY_DEFS")}
  ${extractArrayConst("valuationBuildingValueRows")}
  ${extractArrayConst("valuationPremiumRows")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    buildValuationUnitsSummaryTableData, buildValuationUnitsSummaryWordTableHtml,
    buildTitleUnitsSummaryTableHtmlEditable, buildValuationUnitsSummaryTableHtml,
    getValuationUnitsSummarySubheader, getValuationUnitsSummaryHeaderGroup,
    getValuationUnitsSummaryGroupDisplayLabel,
    isValuationUnitsSummaryColumnSummable,
    getIdentityDefs: () => VALUATION_UNITS_TABLE_IDENTITY_DEFS,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

// Hedef ekran görüntüsündeki 2 taşınmazlık örnek veriyi BİREBİR yansıtan
// tam bir fixture — çoğu senaryoda yeniden kullanılır.
function fullFixtureFields(overrides = {}) {
  return {
    blockNo: "100", parcelNo: "5", titleBlockName: "A", unitNo: "2",
    legalValueArea: "120", currentValueArea: "120",
    landUnitValue: "20000", legalBuildingUnitCost: "21050", legalBuildingDepreciationRate: "0", legalBuildingConstructionLevel: "90",
    share: "5044", denominator: "2162577", landArea: "2162577", landValue: "1261000",
    legalIncompleteDeductionValue: "250000", legalBuildingValue: "2273400",
    currentIncompleteDeductionValue: "250000", currentBuildingValue: "2273400",
    legalPremiumValue: "1265600", currentPremiumValue: "1265600", insuranceValue: "2526000",
    legalValueUnit: "40000", legalValue: "4800000",
    currentValueUnit: "40000", currentValue: "4800000",
    legalIncompleteValueUnit: "40000", legalIncompleteValue: "4550000",
    currentIncompleteValueUnit: "40000", currentIncompleteValue: "4550000",
    legalRentUnit: "200", legalRent: "24000",
    currentRentUnit: "200", currentRent: "24000",
    ...overrides,
  };
}

// 2026-08-27: "TÜM taşınmazlarda aynı" hoisting kuralı (bkz.
// finalizeTitleUnitsSummaryTableData) eklendiğinden, bu dosyanın birçok
// senaryosu titleUnits[0]'ı `fullFixtureFields()`'in (sıfır override ile,
// AKTİF taşınmazla BİREBİR aynı) kopyasıyla kuruyordu — asıl amaçları
// hoisting/aynı-değer davranışını test etmek DEĞİL (HTML şekli/grup
// başlığı/columnMeta gibi yapısal kontroller), ama artık TÜM scalar
// sütunlar commonFields'e taşınıp bu yapısal kontrolleri anlamsız hale
// getiriyordu. Bu sabit, o senaryolarda "2. taşınmaz gerçekçi ama farklı"
// fixture'ı için TEK ortak kaynak.
const DIFFERENTIATING_OVERRIDES = {
  legalValueArea: "100", currentValueArea: "100",
  landUnitValue: "21000", legalBuildingUnitCost: "22000", legalBuildingDepreciationRate: "8",
  share: "5212", denominator: "2162578", landValue: "1303000",
  legalValue: "4000000", legalRent: "20000",
};

// --- 1) TAM sütun sırası, kullanıcının hedef ekran görüntüsüyle BİREBİR --
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields({
      titleBlockName: "A", unitNo: "4",
      legalValueArea: "100", currentValueArea: "100",
      legalBuildingConstructionLevel: "100",
      share: "5212", landValue: "1303000",
      legalIncompleteDeductionValue: "", legalIncompleteValue: "", legalIncompleteValueUnit: "",
      currentIncompleteDeductionValue: "", currentIncompleteValue: "", currentIncompleteValueUnit: "",
      legalBuildingValue: "2105000", currentBuildingValue: "2315500",
      legalPremiumValue: "592000", currentPremiumValue: "781500", insuranceValue: "2105000",
      legalValue: "4000000", currentValue: "4000000",
      legalRent: "20000", currentRent: "22000",
    }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  // NOT (2026-08-27): fixture'da landUnitValue/legalBuildingUnitCost/
  // legalBuildingDepreciationRate/denominator (Arsa Birim Değeri/Yapı
  // Birim Değeri/Yıpranma Payı/Arsa Payda) İKİ taşınmazda da BİREBİR aynı
  // (gerçek ekran görüntüsündeki, ayrı binalarda GERÇEKTEN sık rastlanan
  // bir durum) — bu 4 scalar sütun (2026-08-27 DÖRDÜNCÜ/son tur: "sil ve
  // taşı" davranışı TAMAMEN KALDIRILDI) artık sütun olarak KALIYOR, AYRICA
  // commonFields'e de kopyalanıyor.
  assert.deepEqual(data.headers, [
    "No", "BL.", "BB No",
    "Yasal Alan", "Mevcut Alan",
    "Arsa Birim Değeri", "Yapı Birim Değeri", "Yıpranma Payı",
    "İnş. Sev.",
    "Arsa Payı", "Arsa Payda", "Hissesine Düşen Arsa Payı", "Arsa Değeri",
    "Yasal Eksik İmalat Tutarı", "Yasal Yapı Değeri",
    "Mevcut Eksik İmalat Tutarı", "Mevcut Yapı Değeri",
    "Yasal Şerefiye", "Mevcut Şerefiye", "Sigortaya Esas Değer",
    "Yasal Durum Değeri - M2 Birim Değeri", "Yasal Durum Değeri",
    "Mevcut Durum Değeri - M2 Birim Değeri", "Mevcut Durum Değeri",
    "Natamam Yasal Durum Değeri - M2 Birim Değeri", "Natamam Yasal Durum Değeri",
    "Natamam Mevcut Durum Değeri - M2 Birim Değeri", "Natamam Mevcut Durum Değeri",
    "Yasal Kira Değeri - M2 Birim Değeri", "Yasal Kira Değeri",
    "Mevcut Kira Değeri - M2 Birim Değeri", "Mevcut Kira Değeri",
  ], "Sütun sırası kullanıcının hedef ekran görüntüsüyle BİREBİR eşleşmeli (aynı-degerli 4 sutun DAHİL, artık hiçbiri kalkmıyor).");
  const commonLabels = data.commonFields.map((field) => field.label);
  ["Arsa Birim Değeri", "Yapı Birim Değeri", "Yıpranma Payı", "Arsa Payda"].forEach((label) => {
    assert.ok(data.headers.includes(label), `"${label}" (aynı olsa da) sütun olarak KALMALIYDI, bulunan: ${data.headers.join(", ")}`);
    assert.ok(commonLabels.includes(label), `"${label}" AYRICA commonFields'te OLMALI, bulunan: ${commonLabels.join(", ")}`);
  });
  assert.equal(data.commonFields.find((field) => field.label === "Arsa Birim Değeri")?.value, "20000", "\"Arsa Birim Değeri\" ortak degeri dogru olmali.");
  console.log("TAM sutun sirasi (hedef ekran goruntusu) + ayni-degerli 4 sutunun sutun olarak kalip AYRICA commonFields'e kopyalanmasi testi tamam.");
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

// --- 4) columnMeta: her grubun kind'ı gerçek panel alanının readOnly ------
// durumuyla BİREBİR eşleşir. NOT (2026-08-27): 2. taşınmazın landUnitValue/
// legalBuildingUnitCost/legalBuildingDepreciationRate/denominator BİLEREK
// FARKLI — aksi halde "TÜM taşınmazlarda aynı" hoisting kuralı bu 4 scalar
// sütunu commonFields'e taşır ve aşağıdaki kindOf() kontrolleri (sütun
// artık YOK) başarısız olurdu; bu senaryonun amacı kind eşlemesi, aynı/
// farklı deger davranışı DEĞİL.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields({
      legalValueArea: "100", currentValueArea: "100",
      landUnitValue: "21000", legalBuildingUnitCost: "22000", legalBuildingDepreciationRate: "5",
      share: "5212", denominator: "2162578", landValue: "1303000",
      legalValue: "4000000", legalRent: "20000",
    }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const kindOf = (label) => data.columnMeta[data.headers.indexOf(label)]?.kind;
  assert.equal(kindOf("Yasal Alan"), "scalar");
  assert.equal(kindOf("Mevcut Alan"), "scalar");
  assert.equal(kindOf("Arsa Birim Değeri"), "scalar");
  assert.equal(kindOf("Yapı Birim Değeri"), "scalar");
  assert.equal(kindOf("Yıpranma Payı"), "scalar");
  assert.equal(kindOf("İnş. Sev."), "readonly");
  assert.equal(kindOf("Arsa Payı"), "scalar");
  assert.equal(kindOf("Arsa Payda"), "scalar");
  assert.equal(kindOf("Hissesine Düşen Arsa Payı"), "readonly");
  assert.equal(kindOf("Arsa Değeri"), "readonly");
  assert.equal(kindOf("Yasal Eksik İmalat Tutarı"), "readonly");
  assert.equal(kindOf("Yasal Yapı Değeri"), "readonly");
  assert.equal(kindOf("Yasal Şerefiye"), "readonly");
  assert.equal(kindOf("Sigortaya Esas Değer"), "readonly");
  assert.equal(kindOf("Yasal Durum Değeri - M2 Birim Değeri"), "readonly");
  assert.equal(kindOf("Yasal Durum Değeri"), "scalar");
  assert.equal(kindOf("Natamam Yasal Durum Değeri - M2 Birim Değeri"), "readonly");
  assert.equal(kindOf("Natamam Yasal Durum Değeri"), "readonly");
  assert.equal(kindOf("Yasal Kira Değeri - M2 Birim Değeri"), "readonly");
  assert.equal(kindOf("Yasal Kira Değeri"), "scalar");
  console.log("columnMeta scalar/readonly ayrimi (tum gruplar) testi tamam.");
}

// --- 5) buildTitleUnitsSummaryTableHtmlEditable(): scalar sütunlar -------
// düzenlenebilir, readonly sütunlar TIKLANAMAZ.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const html = fns.buildTitleUnitsSummaryTableHtmlEditable(data.headers, data.rows, data.columnMeta, 0);
  const scalarCount = data.columnMeta.filter((m) => m.kind === "scalar").length;
  const readonlyCount = data.columnMeta.filter((m) => m.kind === "readonly").length;
  assert.ok(readonlyCount >= 1, "En az 1 salt-okunur sütun bekleniyordu.");
  const expectedEditableCount = scalarCount * data.rows.length;
  const actualEditableCount = (html.match(/tus-editable-cell/g) || []).length;
  assert.equal(actualEditableCount, expectedEditableCount, `Yalnızca scalar sütunlar (${expectedEditableCount} adet) düzenlenebilir işaretlenmeliydi, bulunan: ${actualEditableCount}.`);
  console.log("buildTitleUnitsSummaryTableHtmlEditable scalar/readonly ayrimi testi tamam.");
}

// --- 6) Gerçek HTML üretimi: dinamik genişlik + tam ortalama --------------
// NOT (2026-08-27): legalValueArea/currentValueArea BİLEREK FARKLI —
// aksi halde "Alan" (İKİ taşınmazda aynı) commonFields'e taşınır ve
// "YASAL ALAN"/"MEVCUT ALAN" grup başlıkları hiç ÜRETİLMEZ hale gelirdi.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields({ legalValueArea: "100", currentValueArea: "100" }))],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes("<table"), "Geçerli bir <table> HTML'i üretilmeli.");
  assert.ok(html.includes("table-layout:auto"), "Sütun genişlikleri DİNAMİK (table-layout:auto) olmalı.");
  assert.ok(html.includes("text-align:center") && html.includes("vertical-align:middle"), "Tüm hücreler yatay VE dikey ortalı olmalı.");
  assert.ok(html.includes('rowspan="2"') && html.includes("YASAL DURUM DEĞERİ") && html.includes("MEVCUT DURUM DEĞERİ"), "Değerleme tablosu yasal/mevcut durum için iki katmanlı grup başlıkları kullanmalı.");
  assert.ok(html.includes("ALAN<br>(M²)"), "Alan (artık kendi 'YASAL'/'MEVCUT' grubunda) alt başlığı ikinci satırda gösterilmelidir.");
  assert.ok(html.includes("4800000") && html.includes("2273400"), "Değerler HTML'de gözükmeli.");
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

// --- 8) Blok/Bağımsız Bölüm No/Bağımsız Bölüm Niteliği sütunları Sıra ----
// No'nun HEMEN sağında, readonly, doğru taşınmaza eşleşiyor. Niteliği
// (2026-08-23, kullanıcı talebi) BL./BB No'nun AKSİNE narrow:false
// taşımalı (uzun metin sığmaz, bkz. VALUATION_UNITS_TABLE_IDENTITY_DEFS
// yorumu). -----------------------------------------------------------------
{
  const identityDefs = fns.getIdentityDefs();
  assert.deepEqual(identityDefs.map((d) => d.key), ["titleBlockName", "unitNo", "titleQuality"]);
  assert.deepEqual(identityDefs.map((d) => d.label), ["BL.", "BB No", "Bağımsız Bölüm Niteliği"]);
  assert.equal(identityDefs.find((d) => d.key === "titleBlockName").narrow, undefined, "'BL.' icin narrow bayragi BELIRTILMEMIS olmali (varsayilan true).");
  assert.equal(identityDefs.find((d) => d.key === "titleQuality").narrow, false, "'Bağımsız Bölüm Niteliği' icin narrow:false OLMALI (uzun metin sigmaz).");

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "3", titleQuality: "Mesken", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "7", titleQuality: "Ofis ve İşyeri", legalValue: "720.000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const blockIndex = data.headers.indexOf("BL.");
  const unitNoIndex = data.headers.indexOf("BB No");
  const qualityIndex = data.headers.indexOf("Bağımsız Bölüm Niteliği");
  assert.ok(qualityIndex >= 0, "'Bağımsız Bölüm Niteliği' sütunu başlıklarda bulunamadı.");
  assert.equal(data.columnMeta[blockIndex].kind, "readonly", "'BL.' sütunu readonly olmalı.");
  assert.equal(data.columnMeta[unitNoIndex].kind, "readonly", "'BB No' sütunu readonly olmalı.");
  assert.equal(data.columnMeta[qualityIndex].kind, "readonly", "'Bağımsız Bölüm Niteliği' sütunu readonly olmalı (Değerleme tablosunda kimlik/tanıma amaçlı, Tapu'dan düzenlenir).");
  assert.equal(data.columnMeta[qualityIndex].narrow, false, "'Bağımsız Bölüm Niteliği' columnMeta'sı narrow:false taşımalı.");
  assert.equal(data.rows[0][blockIndex], "A", "1. taşınmazın Blok bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[1][unitNoIndex], "7", "2. taşınmazın BB No bilgisi doğru sütunda olmalı.");
  assert.equal(data.rows[0][qualityIndex], "Mesken", "1. taşınmazın Niteliği doğru sütunda olmalı.");
  assert.equal(data.rows[1][qualityIndex], "Ofis ve İşyeri", "2. taşınmazın Niteliği doğru sütunda olmalı.");
  console.log("Blok-BBNo-Nitelik kimlik sutunlari testi tamam.");
}

// --- 9) İki katmanlı HTML renderer'da Blok/BB No subheader'ı YANLIŞLIKLA -
// "Piyasa Değeri (TL)" olmamalı (regresyon); kimlik sütunları daraltılmış -
// AMA "Bağımsız Bölüm Niteliği" (2026-08-23) İSTİSNA — narrow:false. -----
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "3", titleQuality: "Mesken", legalValue: "500.000" },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "7", titleQuality: "Ofis ve İşyeri", legalValue: "720.000" })],
  });
  assert.equal(fns.getValuationUnitsSummarySubheader("BL."), "BL.");
  assert.equal(fns.getValuationUnitsSummarySubheader("BB No"), "BB No");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("BL."), "Diğer", "'BL.' herhangi bir gruba DEĞİL, 'Diğer'e düşmeli (leadingIndices zaten ayrı ele alır).");
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(html.includes(">BL.<"), "HTML'de 'BL.' başlığı görünmeli.");
  assert.ok(html.includes(">BAĞIMSIZ BÖLÜM NİTELİĞİ<"), "HTML'de 'Bağımsız Bölüm Niteliği' başlığı görünmeli.");
  assert.ok(!/>BL\.<\/th>[\s\S]{0,5}PİYASA DEĞERİ/i.test(html), "'BL.' sütunu YANLIŞLIKLA 'Piyasa Değeri' alt-başlığı almamalı.");
  const leadingThs = [...html.matchAll(/<th rowspan="2" style="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(leadingThs.length, 4, "4 rowspan=2 basligi (No/BL./BB No/Bagimsiz Bolum Niteligi) olmali.");
  leadingThs.slice(0, 3).forEach((style) => {
    assert.ok(style.includes("width:18pt;"), `No/BL./BB No basligi dar genislik almali, bulunan stil: ${style}`);
  });
  assert.ok(!leadingThs[3].includes("width:18pt;"), `'Bağımsız Bölüm Niteliği' basligi DAR OLMAMALI (narrow:false), bulunan stil: ${leadingThs[3]}`);
  console.log("Blok-BBNo-Nitelik subheader regresyon + daraltma-istisnasi testi tamam.");
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
    /function createTitleUnitsSummaryTablePreview\(\)[\s\S]*?buildTitleUnitsSummaryTableHtmlEditable\(data\.headers, data\.rows, data\.columnMeta, state\.activeTitleUnitIndex, data\.commonFields\)/,
    "Tapu özeti değerleme tablosuna özgü renderer'a yönlendirilmemelidir."
  );
  console.log("Değerleme iki katmanlı başlık renderer kablolama testi tamam.");
}

// --- 11) renderSection() "valuation" gate'i createValuationCopyToSelectedControl()'u
// createTitleUnitTabBar()'in extraActions'ina ekliyor mu.
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
// edilir VE gövde hücreleri başlıkla TAM olarak aynı sırada.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {
      titleBlockName: "BLOK-A", unitNo: "BBNO-5",
      legalValueArea: "111", legalValueUnit: "222", legalValue: "333",
      currentValueArea: "555", currentValueUnit: "666", currentValue: "777",
      legalRentUnit: "999", legalRent: "1010",
      currentRentUnit: "1111", currentRent: "1212",
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
  assert.equal(topThCells[0], "NO", "1. ust-satir hucresi No olmali.");
  assert.equal(topThCells[1], "BL.", "2. ust-satir hucresi BL. olmali (rowspan=2, TEK sutun, grup DEGIL).");
  assert.equal(topThCells[2], "BB NO", "3. ust-satir hucresi BB No olmali.");

  const bodyRows = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
  const firstRowCells = [...bodyRows[0][1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  assert.equal(firstRowCells[0], "1", "Govdenin 1. hucresi Sira No (1) olmali.");
  assert.equal(firstRowCells[1], "BLOK-A", "Govdenin 2. hucresi Blok degeri olmali.");
  assert.equal(firstRowCells[2], "BBNO-5", "Govdenin 3. hucresi Bagimsiz Bolum No degeri olmali.");

  // Alt-basliklarin (2. satir <th>) SAYISI, her govde satirindaki <td>
  // sayisindan (kimlik+Sira No haric) BIREBIR eslesmeli - hizalama
  // dogrulamasinin genel formu.
  const subThCells = [...headerRows[1][1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)];
  assert.equal(subThCells.length, firstRowCells.length - 3, "Alt-baslik sayisi, govde hucre sayisi (Sira No+Blok+BBNo haric) ile eslesmeli.");
  console.log("Header/govde hizalama regresyon testi (Blok/BBNo en basta) tamam.");
}

// --- 13) computeValuationFieldsForAllTitleUnits(): kaynak-duzeyi kablolama
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

// --- 14) Kullanıcı takip talebi (2026-08-21/22, ekran görüntüsüyle): -----
// "tablo yapısının bu şekilde olmasını istiyorum" — TAM entegrasyon
// testi: gerçek HTML çıktısında 15 grup başlığı (colspan'lı <th>) TAM
// hedef sırayla render edilir.
{
  // NOT (2026-08-27): legalValueArea/currentValueArea BİLEREK FARKLI —
  // bkz. senaryo 1/6'daki AYNI not (aksi halde "YASAL"/"MEVCUT" (Alan)
  // grubu commonFields'e taşınıp bu 15-grup-başlığı testinden TAMAMEN
  // KAYBOLURDU).
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields({ titleBlockName: "A", unitNo: "4", legalValueArea: "100", currentValueArea: "100" }))],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  const topThCells = [...html.matchAll(/<th[^>]*colspan[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1]);
  assert.deepEqual(topThCells, [
    "YASAL", "MEVCUT",
    "PARAMETRELER",
    "ARSA DEĞERİ",
    "YASAL YAPI DEĞERİ", "MEVCUT YAPI DEĞERİ",
    "YASAL", "MEVCUT",
    "DİĞER",
    "YASAL DURUM DEĞERİ", "MEVCUT DURUM DEĞERİ",
    "NATAMAM YASAL DURUM DEĞERİ", "NATAMAM MEVCUT DURUM DEĞERİ",
    "YASAL KİRA DEĞERİ", "MEVCUT KİRA DEĞERİ",
  ], "Grup başlıkları TAM kullanıcının hedef ekran görüntüsündeki sırayla render edilmeli.");
  console.log("TAM entegrasyon: HTML grup basliklari hedef sirayla testi tamam.");
}

// --- 15) Alan artık BAĞIMSIZ "Yasal"/"Mevcut" tek-sütunluk gruplarında ----
// (önceden Durum Değeri grubunun İÇİNDE bir "- Alan" soneki idi).
// NOT (2026-08-27): legalValueArea BİLEREK FARKLI — "Yasal Alan"ın
// KENDİSİ sütun olarak kalmalı (asıl test amacı), aksi halde her iki
// taşınmazda da aynı olduğundan commonFields'e taşınıp headers'tan kalkardı.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields({ legalValueArea: "100" }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Yasal Durum Değeri - Alan"), "'Yasal Durum Değeri - Alan' ARTIK bulunmamalı (Alan öne taşındı).");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Alan"), "Yasal Alan");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Alan"), "Mevcut Alan");
  assert.equal(fns.getValuationUnitsSummaryGroupDisplayLabel("Yasal Alan"), "Yasal", "Ekranda sade 'YASAL' gösterilmeli (grup adı DEĞİL).");
  assert.equal(fns.getValuationUnitsSummaryGroupDisplayLabel("Mevcut Alan"), "Mevcut");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Alan"), "Alan\n(m²)");
  assert.equal(data.rows[0][data.headers.indexOf("Yasal Alan")], "120");
  console.log("Alan bagimsiz Yasal/Mevcut grubu testi tamam.");
}

// --- 16) PARAMETRELER: Yasal/Mevcut arasında TEK satır (Arsa Birim -------
// Değeri/Yapı Birim Değeri/Yıpranma Payı/İnş. Sev.), "Yasal" kaynak
// alanlarından okunur (syncBuildingValueDefaults() bu 3 çifti HER ZAMAN
// aynı hesaplanan değere yazdığından pratikte Mevcut ile hep aynı).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields({ landUnitValue: "20000", legalBuildingUnitCost: "21050", legalBuildingDepreciationRate: "5,00", legalBuildingConstructionLevel: "90,00" }),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Birim Değeri"), "Parametreler");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yapı Birim Değeri"), "Parametreler");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yıpranma Payı"), "Parametreler");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("İnş. Sev."), "Parametreler");
  assert.equal(fns.getValuationUnitsSummarySubheader("Arsa Birim Değeri"), "Arsa Birim Değeri\n(TL/m²)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yapı Birim Değeri"), "Yapı Birim Değeri\n(TL/m²)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yıpranma Payı"), "Yıp. Pay.\n(%)");
  assert.equal(fns.getValuationUnitsSummarySubheader("İnş. Sev."), "İnş. Sev.\n(%)");
  assert.equal(data.rows[0][data.headers.indexOf("Arsa Birim Değeri")], "20000");
  assert.equal(data.rows[0][data.headers.indexOf("Yapı Birim Değeri")], "21050");
  // Kullanıcı takip talebi (2026-08-22): "tam sayı olarak virgülün
  // sağında rakam olmasın" — "5,00"/"90,00" hücrelerde "5"/"90" olarak
  // (ondalık kısım KIRPILARAK) gösterilmeli.
  assert.equal(data.rows[0][data.headers.indexOf("Yıpranma Payı")], "5", "Yıpranma Payı ondalıksız (tam sayı) gösterilmeli.");
  assert.equal(data.rows[0][data.headers.indexOf("İnş. Sev.")], "90", "İnşaat Seviyesi ondalıksız (tam sayı) gösterilmeli.");
  // Kullanıcı takip talebi (2026-08-22): "bu iki sütun olabildiğince dar
  // olsun" — columnMeta.narrow (buildValuationUnitsSummaryTableHtml'in
  // narrowWidth'iyle AYNI mekanizma).
  assert.equal(data.columnMeta[data.headers.indexOf("Yıpranma Payı")].narrow, true);
  assert.equal(data.columnMeta[data.headers.indexOf("İnş. Sev.")].narrow, true);
  assert.ok(!data.columnMeta[data.headers.indexOf("Yapı Birim Değeri")].narrow, "Yapı Birim Değeri daraltılmamalı (yalnızca Yıpranma Payı/İnş. Sev. istendi).");
  // Bir kez "Yasal Yapı Değeri - Yapı Birim Değeri" gibi eski (Yasal/Mevcut
  // AYRI) sütunlar KESİNLİKLE üretilmemeli.
  assert.ok(!data.headers.includes("Yasal Yapı Değeri - Yapı Birim Değeri"));
  assert.ok(!data.headers.includes("Mevcut Yapı Değeri - Yapı Birim Değeri"));
  console.log("Parametreler (tek satir, Yasal/Mevcut ayri degil, tam sayi + daraltma) testi tamam.");
}

// --- 17) ARSA DEĞERİ: bileşenler + sonuç TEK grupta, YALNIZCA aynı --------
// ada/parselde gösterilir (DEĞİŞMEDİ).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", legalValue: "500.000", share: "10", denominator: "100", landArea: "1000" },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", legalValue: "600.000", share: "20", denominator: "100", landArea: "1000" })],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const shareIndex = data.headers.indexOf("Arsa Payı");
  const shareOfAreaIndex = data.headers.indexOf("Hissesine Düşen Arsa Payı");
  assert.ok(shareIndex >= 0 && shareOfAreaIndex >= 0, "AYNI ada/parselde Arsa Payı/Hissesine Düşen Arsa Payı sütunları bulunmali.");
  // Kullanıcı takip talebi (2026-08-22): "HİSSESİNE DÜŞEN ARSA PAYI
  // bölümünde rakamların yanında m2 yazıyor ... hücrelerde yazmasın" —
  // birim (m²) SÜTUN BAŞLIĞINDA kalır (bkz. senaryo subheader kontrolü),
  // hücre değerinden " m²" soneki KIRPILIR.
  assert.equal(data.rows[0][shareOfAreaIndex], "100,00", "1. tasinmazin hissesine dusen arsa payi (1000/100)x10=100, hucrede 'm²' SONEKI OLMADAN.");
  assert.equal(data.rows[1][shareOfAreaIndex], "200,00");
  assert.equal(fns.getValuationUnitsSummarySubheader("Hissesine Düşen Arsa Payı"), "Hissesine Düşen\nArsa Payı (m²)", "Birim SÜTUN BAŞLIĞINDA kalmalı.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Payı"), "Arsa Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Arsa Değeri"), "Arsa Değeri");

  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", legalValue: "500.000", share: "10", denominator: "100", landArea: "1000" },
    tables: {},
    titleUnits: [unit({ blockNo: "200", parcelNo: "9", legalValue: "600.000", share: "20", denominator: "100", landArea: "800" })],
  });
  const differentParcelData = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!differentParcelData.headers.includes("Arsa Payı"), "FARKLI ada/parselde 'Arsa Payı' sutunu gorunmemeli.");
  console.log("Arsa Degeri grubu (ayni/farkli ada-parsel) testi tamam.");
}

// --- 18) YASAL/MEVCUT YAPI DEĞERİ: artık YALNIZCA Eksik İmalat Tutarı ----
// + Yapı Değeri (Birim Değeri/Yıpranma/Seviye Parametreler'e taşındı),
// Arsa Değeri'nin HEMEN SAĞINDA.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const arsaIndex = data.headers.indexOf("Arsa Değeri");
  const legalDeductionIndex = data.headers.indexOf("Yasal Eksik İmalat Tutarı");
  const legalBuildingIndex = data.headers.indexOf("Yasal Yapı Değeri");
  assert.equal(legalDeductionIndex, arsaIndex + 1, "Yasal Eksik İmalat Tutarı, Arsa Değeri'nin HEMEN sağında olmalı.");
  assert.equal(legalBuildingIndex, legalDeductionIndex + 1, "Yasal Yapı Değeri, Eksik İmalat Tutarı'nın HEMEN sağında olmalı.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Eksik İmalat Tutarı"), "Yasal Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Yapı Değeri"), "Yasal Yapı Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Eksik İmalat Tutarı"), "Mevcut Yapı Değeri");
  assert.equal(data.rows[0][legalDeductionIndex], "250000");
  assert.equal(data.rows[0][legalBuildingIndex], "2273400");
  // Kullanıcı takip talebi (2026-08-22): "YASAL EKSİK İMALAT TUTARI yerine
  // EKSİK İMALAT TUTARI aynı şekilde MEVCUT EKSİK İMALAT TUTARI yerine
  // EKSİK İMALAT TUTARI" — Yasal/Mevcut öneki ÜST grup başlığında zaten
  // var, ALT başlıkta TEKRARLANMAZ.
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Eksik İmalat Tutarı"), "Eksik İmalat Tutarı\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Mevcut Eksik İmalat Tutarı"), "Eksik İmalat Tutarı\n(TL)");
  console.log("Yasal/Mevcut Yapi Degeri (2 sutuna indirgendi, kisa subheader) testi tamam.");
}

// --- 19) YASAL/MEVCUT ŞEREFİYE: kendi tek-sütunluk grupları (Sigorta'dan -
// AYRILDI, "Diğer"e DÜŞMÜYOR).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Şerefiye"), "Yasal Şerefiye", "Yasal Şerefiye ARTIK 'Diğer'e DÜŞMEMELİ, kendi grubu olmalı.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Şerefiye"), "Mevcut Şerefiye");
  assert.equal(fns.getValuationUnitsSummaryGroupDisplayLabel("Yasal Şerefiye"), "Yasal");
  assert.equal(fns.getValuationUnitsSummaryGroupDisplayLabel("Mevcut Şerefiye"), "Mevcut");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Şerefiye"), "Yasal Şerefiye\n(TL)");
  console.log("Yasal/Mevcut Serefiye bagimsiz gruplari testi tamam.");
}

// --- 20) Sigortaya Esas Değer "Diğer"de kalmaya devam ediyor (DEĞİŞMEDİ). -
{
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Sigortaya Esas Değer"), "Diğer");
  assert.equal(fns.getValuationUnitsSummarySubheader("Sigortaya Esas Değer"), "Sigortaya Esas Değer\n(TL)");
  console.log("Sigortaya Esas Deger Diger'de kalma testi tamam.");
}

// --- 21) YASAL/MEVCUT DURUM DEĞERİ: artık YALNIZCA M2 Birim Değeri + ------
// Piyasa Değeri (Alan ÇIKARILDI, öne taşındı).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Yasal Durum Değeri - Alan"));
  const unitIndex = data.headers.indexOf("Yasal Durum Değeri - M2 Birim Değeri");
  const totalIndex = data.headers.indexOf("Yasal Durum Değeri");
  assert.equal(totalIndex, unitIndex + 1, "Piyasa Değeri, M2 Birim Değeri'nin HEMEN sağında olmalı.");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Durum Değeri"), "Piyasa Değeri\n(TL)");
  assert.equal(data.rows[0][unitIndex], "40000");
  assert.equal(data.rows[0][totalIndex], "4800000");
  console.log("Yasal/Mevcut Durum Degeri (Alan cikarildi) testi tamam.");
}

// --- 22) NATAMAM YASAL/MEVCUT DURUM DEĞERİ: KENDİ grubu (Durum Değeri'ne -
// gömülü DEĞİL) + M2 Birim Değeri GERİ eklendi (Durum Değeri'nin M2 Birim
// Değeri'nden FARKLI bir değer — legalIncompleteValueUnit).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    // 2. tasinmaz %100 seviyeli (natamam deger yok).
    titleUnits: [unit(fullFixtureFields({
      legalIncompleteDeductionValue: "", legalIncompleteValue: "", legalIncompleteValueUnit: "",
      currentIncompleteDeductionValue: "", currentIncompleteValue: "", currentIncompleteValueUnit: "",
    }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Natamam Yasal Durum Değeri"), "Natamam Yasal Durum Değeri", "Natamam ARTIK 'Yasal Durum Değeri' grubuna GÖMÜLMEMELİ, kendi grubu olmalı.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Natamam Yasal Durum Değeri - M2 Birim Değeri"), "Natamam Yasal Durum Değeri");
  const unitIndex = data.headers.indexOf("Natamam Yasal Durum Değeri - M2 Birim Değeri");
  const totalIndex = data.headers.indexOf("Natamam Yasal Durum Değeri");
  assert.ok(unitIndex >= 0, "Natamam'ın KENDİ M2 Birim Değeri sütunu GERİ eklenmeli (Durum Değeri'nden FARKLI bir değer).");
  assert.equal(totalIndex, unitIndex + 1);
  assert.equal(data.rows[0][unitIndex], "40000");
  assert.equal(data.rows[0][totalIndex], "4550000");
  assert.equal(data.rows[1][totalIndex], "-", "2. (tamamlanmış, %100 seviyeli) taşınmazda Natamam Durum Değeri '-' olmalı.");
  // Kullanıcı takip talebi (2026-08-22): "NATAMAM YASAL DURUM DEĞERİ
  // yerine YASAL DURUM DEĞERİ bunların üst başlıklarında zaten bunlar
  // belirtiliyor" — "Natamam" öneki ÜST grup başlığında zaten var, ALT
  // başlıkta (subheader) TEKRARLANMAZ; grup eşleştirmesi (yukarıda test
  // edildi) DEĞİŞMEDİ.
  assert.equal(fns.getValuationUnitsSummarySubheader("Natamam Yasal Durum Değeri"), "Yasal Durum Değeri\n(TL)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Natamam Mevcut Durum Değeri"), "Mevcut Durum Değeri\n(TL)");
  console.log("Natamam Yasal/Mevcut Durum Degeri (kendi grubu + M2 Birim Degeri geri + kisa subheader) testi tamam.");
}

// --- 23) YASAL/MEVCUT KİRA DEĞERİ: KENDİ ayrı grubu (önceden fark --------
// edilmeden "Yasal/Mevcut Durum Değeri" fallback'ine karışıyordu).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields(),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Kira Değeri"), "Yasal Kira Değeri", "Kira Değeri ARTIK 'Yasal Durum Değeri' grubuna KARIŞMAMALI.");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Yasal Kira Değeri - M2 Birim Değeri"), "Yasal Kira Değeri");
  assert.equal(fns.getValuationUnitsSummaryHeaderGroup("Mevcut Kira Değeri"), "Mevcut Kira Değeri");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Kira Değeri - M2 Birim Değeri"), "Kira M2 Birim Değeri\n(TL/m²)");
  assert.equal(fns.getValuationUnitsSummarySubheader("Yasal Kira Değeri"), "Kira Değeri\n(TL/ay)");
  console.log("Yasal/Mevcut Kira Degeri bagimsiz gruplari testi tamam.");
}

// --- 24) REGRESYON (kullanıcı takip talebi 2026-08-22): "bu iki sütun ----
// olabildiğince dar olsun" + tam sayı gösterimi + m² soneki kırpılması —
// GERÇEK iki katmanlı renderer (buildValuationUnitsSummaryTableHtml)
// çıktısında Yıpranma Payı HEM dar HEM DÜZENLENEBİLİR kalmalı (narrow +
// scalar kombinasyonu, buildTitleUnitsSummaryTableHtmlEditable'daki
// PAYLAŞILAN kod yolunda bulunup düzeltilen bir hatayı da dolaylı olarak
// kapsar — narrow işaretli scalar sütunlar YANLIŞLIKLA salt-okunur
// yapılmamalı).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields({ legalBuildingDepreciationRate: "5,00", legalBuildingConstructionLevel: "90,00" }),
    tables: {},
    titleUnits: [unit(fullFixtureFields(DIFFERENTIATING_OVERRIDES))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  // Word/export çıktısı ("buildValuationUnitsSummaryWordTableHtml", editable=false
  // VARSAYILAN) tus-editable-cell İÇERMEZ — düzenlenebilirlik yalnızca
  // CANLI önizlemenin kullandığı { editable: true } modunda test edilebilir
  // (bkz. createValuationUnitsSummaryTablePreview'ın GERÇEK çağrısı).
  const html = fns.buildValuationUnitsSummaryTableHtml(data, 0, { editable: true });
  assert.ok(html.includes(">YIP. PAY.<") || html.includes(">Yıp. Pay.<"), "HTML'de kısaltılmış 'Yıp. Pay.' alt-başlığı görünmeli.");
  assert.ok(html.includes(">İNŞ. SEV.<") || html.includes(">İnş. Sev.<"), "HTML'de kısaltılmış 'İnş. Sev.' alt-başlığı görünmeli.");
  assert.ok(!html.includes("YIPRANMA PAYI") && !html.includes("İNŞAAT SEVİYESİ"), "Uzun (kısaltılmamış) etiketler ARTIK görünmemeli.");
  // Yıpranma Payı hücresi HEM dar (width:18pt) HEM düzenlenebilir
  // (tus-editable-cell) olmalı.
  const editableCellMatch = html.match(/<td style="[^"]*width:18pt;[^"]*cursor:text;" class="tus-editable-cell"[^>]*>5<\/td>/);
  assert.ok(editableCellMatch, "Yıpranma Payı hücresi HEM dar HEM düzenlenebilir olmalı (narrow+scalar kombinasyonu).");
  assert.ok(html.includes(">5<") && !html.includes(">5,00<"), "Yıpranma Payı tam sayı (ondalıksız) gösterilmeli.");
  console.log("Yipranma Payi/Insaat Seviyesi daraltma + tam sayi + duzenlenebilirlik regresyon testi tamam.");
}

// --- 25) REGRESYON: HİSSESİNE DÜŞEN ARSA PAYI hücrelerinde " m²" ----------
// SONEKİ ARTIK yok (birim sütun başlığında kalır).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { blockNo: "100", parcelNo: "5", legalValue: "500.000", share: "10", denominator: "100", landArea: "1000" },
    tables: {},
    titleUnits: [unit({ blockNo: "100", parcelNo: "5", legalValue: "600.000", share: "20", denominator: "100", landArea: "1000" })],
  });
  const html = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(!html.includes("100,00 M²") && !html.includes("100,00 m²"), "Hücre değerinde ARTIK 'm²' soneki olmamalı.");
  assert.ok(html.includes(">100,00<") || html.includes(">100,00 <"), "Hücre değeri (soneksiz) HTML'de gözükmeli.");
  console.log("Hissesine Dusen Arsa Payi hucre m2-soneki kaldirma regresyon testi tamam.");
}

// --- 26) YENİ (2026-08-22, kullanıcı talebi): "sıfırın altında çıkan --------
// değerler kırmızı punto ile yazılsın" — negatif Şerefiye (legalPremiumValue/
// currentPremiumValue) hücresi kırmızı renkte (canlı Piyasa Değeri panelindeki
// .valuation-input-negative ile AYNI ton, #b91c1c) render edilmeli; pozitif/
// sıfır değerler ETKİLENMEMELİ.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields({ legalPremiumValue: "-125.000", currentPremiumValue: "125.000" }),
    tables: {},
    titleUnits: [unit(fullFixtureFields({ legalPremiumValue: "0", currentPremiumValue: "50.000" }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const html = fns.buildValuationUnitsSummaryTableHtml(data, 0, { editable: true });
  const negativeCellMatch = html.match(/<td style="[^"]*color:#b91c1c;font-weight:800;[^"]*">-125\.000<\/td>/);
  assert.ok(negativeCellMatch, "Negatif Şerefiye (-125.000) hücresi kırmızı (color:#b91c1c) render edilmeli.");
  const positiveCellHtml = html.match(/<td style="[^"]*">125\.000<\/td>/)?.[0] || "";
  assert.ok(!positiveCellHtml.includes("#b91c1c"), "Pozitif Şerefiye (125.000) hücresi kırmızı OLMAMALI.");
  const zeroCellHtml = html.match(/<td style="[^"]*">0<\/td>/)?.[0] || "";
  assert.ok(!zeroCellHtml.includes("#b91c1c"), "Sıfır Şerefiye (0) hücresi kırmızı OLMAMALI (yalnızca sıfırın ALTINDAKİ değerler).");
  // Sıra No/BL./BB No gibi kimlik hücreleri asla negatif OLAMAZ, dolayısıyla
  // etkilenmemeli (parseValuationNumber "-" için NaN döner, zararsız) —
  // ayrıca Word/export yolu (buildValuationUnitsSummaryWordTableHtml, AYNI
  // fonksiyonu editable:false ile çağırır) da aynı kırmızı işaretlemeyi
  // taşımalı.
  const wordHtml = fns.buildValuationUnitsSummaryWordTableHtml();
  assert.ok(wordHtml.includes("color:#b91c1c;font-weight:800;"), "Word/export çıktısında da negatif değer kırmızı işaretlenmeli.");
  console.log("Negatif deger (Serefiye) kirmizi punto testi tamam.");
}

// --- 27) YENİ (2026-08-22): commitTitleUnitsSummaryCellEdit() AKTİF OLMAYAN
// bir satırda "landUnitValue" düzenlenirse (Kat İrtifakı'nda paylaşımlı),
// setTitleUnitFieldValue (o satırın KENDİ, hiç okunmayan gölgesine yazardı)
// DEĞİL, doğrudan state.fields.landUnitValue'ya (gerçek paylaşımlı kaynak)
// yazmalı — aksi halde getTitleUnitFieldsForLabel'in YENİ paylaşımlı-değer
// bindirmesi (bkz. test-title-unit-switch.js 29d) bu düzenlemeyi HER ZAMAN
// görünmez kılardı. commitTitleUnitsSummaryCellEdit DOM/autosave/refresh*
// zincirine bağımlı olduğundan (proje konvansiyonu: bkz. #12'deki
// commitTitleUnitsSummaryCellEdit refresh/mirror testi) kaynak-metni
// üzerinden doğrulanır.
{
  assert.match(
    appSource,
    /fieldKey === "landUnitValue" && isCondominiumEasementOwnershipType\(\)\)\s*\{\s*[\s\S]*?state\.fields\.landUnitValue = normalizeReportFieldValue\(fieldKey, rawValue\);/,
    "commitTitleUnitsSummaryCellEdit() aktif olmayan bir satırda landUnitValue düzenlenince (Kat İrtifakı'nda) doğrudan state.fields.landUnitValue'ya yazmıyor."
  );
  console.log("commitTitleUnitsSummaryCellEdit landUnitValue paylasimli yazma yolu testi tamam.");
}

// --- 28) YENİ (2026-08-22, kullanıcı talebi): "tablonun en altına toplam ---
// satırı koy" — TL/m² TOPLAMI anlamlı sütunlar (Alan, Durum Değeri vb.)
// toplanır; birim fiyat/oran/payda sütunları (Arsa Birim Değeri gibi) boş
// bırakılır; negatif toplam (Şerefiye) kırmızı olur; hücreler
// düzenlenemez (editable:true olsa bile).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields({
      legalValueArea: "120", currentValueArea: "130",
      legalValue: "4800000", currentValue: "4900000",
      legalPremiumValue: "-125000", currentPremiumValue: "125000",
    }),
    tables: {},
    titleUnits: [unit(fullFixtureFields({
      legalValueArea: "80", currentValueArea: "70",
      legalValue: "3200000", currentValue: "3100000",
      legalPremiumValue: "-50000", currentPremiumValue: "50000",
    }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();
  const html = fns.buildValuationUnitsSummaryTableHtml(data, 0, { editable: true });
  const lastTrStart = html.lastIndexOf("<tr>");
  assert.ok(lastTrStart >= 0, "TOPLAM satırı bir <tr> olarak bulunmalı.");
  const totalsRow = html.slice(lastTrStart, html.indexOf("</tr>", lastTrStart) + "</tr>".length);
  assert.ok(totalsRow.includes(">TOPLAM<"), "TOPLAM satırının ilk hücresi 'TOPLAM' etiketini taşımalı.");
  assert.ok(html.indexOf(totalsRow) > html.indexOf("</thead>"), "TOPLAM satırı gövdenin (tbody) EN SONUNDA olmalı.");
  assert.ok(totalsRow.includes(">200<"), "Alan sütunlarının toplamı (120+80 / 130+70 = 200) TOPLAM satırında görünmeli.");
  assert.ok(totalsRow.includes(">8.000.000<"), "Durum Değeri toplamı (4.800.000+3.200.000=8.000.000) TOPLAM satırında görünmeli.");
  const negativeTotalMatch = totalsRow.match(/<td style="[^"]*color:#b91c1c;[^"]*">-175\.000<\/td>/);
  assert.ok(negativeTotalMatch, "Negatif Şerefiye toplamı (-125.000+-50.000=-175.000) TOPLAM satırında kırmızı görünmeli.");
  assert.ok(totalsRow.includes(">175.000<"), "Pozitif Şerefiye toplamı (125.000+50.000=175.000) TOPLAM satırında görünmeli.");
  assert.ok(!totalsRow.includes(">40.000<") && !totalsRow.includes(">40000<"), "Arsa Birim Değeri (birim fiyat) TOPLAM satırında TOPLANMAMALI (boş kalmalı).");
  assert.ok(!totalsRow.includes("tus-editable-cell"), "TOPLAM satırındaki hücreler düzenlenebilir (editable:true olsa bile) OLMAMALI.");
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Arsa Birim Değeri"), false);
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Arsa Payı"), false);
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Arsa Payda"), false);
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Yasal Durum Değeri - M2 Birim Değeri"), false);
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Yasal Durum Değeri"), true);
  assert.equal(fns.isValuationUnitsSummaryColumnSummable("Arsa Değeri"), true);
  console.log("Toplam (TOPLAM) satiri testi tamam.");
}

// --- 28) YENİ (2026-08-22, kullanıcı talebi): "sütun başlıklarının içine
// sağ alt bölümüne sütunun tümüne uygula butonu koyabilir miyiz" —
// Değerleme'nin BESPOKE iki katmanlı renderer'ında (topHeaderHtml grup
// satırı + subHeaderHtml gerçek sütun satırı) buton YALNIZCA alt-başlık
// (subHeaderHtml) satırında, YALNIZCA editable:true + kind:"scalar"
// sütunlarda görünmeli; export/banka-şablonu modunda (editable:false,
// varsayılan) HİÇ görünmemeli.
{
  // NOT (2026-08-27): 2. taşınmaz DIFFERENTIATING_OVERRIDES ile FARKLI —
  // aksi halde (ikisi de sıfır override'lı fullFixtureFields() TABANLI
  // olduğundan) TÜM scalar sütunlar (landUnitValue DAHİL) commonFields'e
  // taşınır, "en az 1 scalar sütun" kontrolü ANLAMSIZ hale gelirdi.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: fullFixtureFields({ landUnitValue: "40.000" }),
    tables: {},
    titleUnits: [unit(fullFixtureFields({ ...DIFFERENTIATING_OVERRIDES, landUnitValue: "45.000" }))],
  });
  const data = fns.buildValuationUnitsSummaryTableData();

  // 28a) editable:true -> yalnizca scalar sutunlarda buton var.
  const editableHtml = fns.buildValuationUnitsSummaryTableHtml(data, 0, { editable: true });
  const scalarCount = data.columnMeta.filter((meta) => meta?.kind === "scalar").length;
  const buttonCount = (editableHtml.match(/tus-apply-column-btn/g) || []).length;
  assert.ok(scalarCount > 0, "Fixture'da en az bir 'scalar' sutun olmali.");
  assert.equal(buttonCount, scalarCount, `"Tumune uygula" butonu YALNIZCA scalar sutunlarda (${scalarCount} adet) gorunmeliydi, bulunan: ${buttonCount}.`);
  assert.match(
    editableHtml,
    /<button type="button" class="tus-apply-column-btn" data-field-key="landUnitValue" data-column-label="[^"]*"[^>]*>/,
    "Arsa Birim Degeri (landUnitValue, scalar) sutununun alt-basliginda buton bulunamadi."
  );
  // Buton, GRUP basligi (topHeaderHtml, rowspan/colspan'li ilk <tr>)
  // satirinda DEGIL, alt-baslik (subHeaderHtml, ikinci <tr>) satirinda
  // olmali.
  const theadHtml = editableHtml.slice(editableHtml.indexOf("<thead>"), editableHtml.indexOf("</thead>"));
  const firstTrEnd = theadHtml.indexOf("</tr>") + "</tr>".length;
  const topHeaderRow = theadHtml.slice(0, firstTrEnd);
  assert.ok(!topHeaderRow.includes("tus-apply-column-btn"), "Grup basligi (topHeaderHtml) satirinda buton OLMAMALI.");

  // 28b) editable:false (export/banka sablonu varsayilani) -> HIC buton yok.
  const exportHtml = fns.buildValuationUnitsSummaryTableHtml(data, 0);
  assert.ok(!exportHtml.includes("tus-apply-column-btn"), "Export/banka-sablonu modunda (editable:false) 'tumune uygula' butonu HIC gorunmemeli.");

  console.log("buildValuationUnitsSummaryTableHtml 'sutunun tumune uygula' butonu (yalnizca editable+scalar) testi tamam.");
}

console.log("Tasinmazlar degerleme ozeti tablosu testleri basarili.");
