// Çoklu taşınmazlı raporlarda GABİM Veri Seti bilgilerini özetleyen tablo
// (Çift Yönlü Düzenleme, 2026-09-02). Kullanıcı talebi: "gabim veri
// bölümü için çift taraflı tablo yapalım" — diğer 8 "Taşınmazlar ...
// Özeti" tablosuyla (Tapu/Adres/İmar/Arsa/Belgeler/Değerleme/Bağımsız
// Bölüm/Proje Uygunluk) AYNI PAYLAŞIMLI altyapı (finalizeTitleUnitsSummaryTableData/
// buildTitleUnitsSummaryTableHtmlFromData).
//
// buildGabimDataGroups() (GERÇEK fonksiyon, ~40 gabim* yardımcı fonksiyona
// bağımlı — DOM'a da dokunmuyor ama bağımlılık ağacı ÇOK GENİŞ) burada
// BİLEREK extract EDİLMEZ; proje konvansiyonu ("gerçek zinciri çıkarmak
// pratik değilse basit sahte ile test et", bkz. test-title-unit-switch.js
// #33) gereği davranış-koruyan basit bir SAHTE ile değiştirilir — asıl
// doğrulanan şey buildGabimUnitsSummaryTableData()'nın GERÇEK orkestrasyonu
// (switchActiveTitleUnit döngüsü AKTİF birimi de kapsıyor mu, grup/satır
// düzleştirme doğru mu, hoisting/boş-sütun-kaldırma finalizeTitleUnitsSummaryTableData
// ile TUTARLI mı) — GABİM alanlarının KENDİ değer hesaplama mantığı
// (gabimField/gabimTitle/vb.) bu dosyanın kapsamı DEĞİL.
//
// switchActiveTitleUnit() de AYNI nedenle (getTitleUnitScopedFieldKeys()
// zincirinin TAMAMI test-title-unit-switch.js'de ZATEN kapsamlı test
// ediliyor) basitleştirilmiş bir SAHTE ile değiştirilir — burada yalnızca
// "aktif index değiştiğinde state.fields/tables o birimin KENDİ verisini
// yansıtır mı" davranışı simüle edilir (GERÇEK snapshot/restore mekaniği
// DEĞİL).
//
// Kapsanan senaryolar:
//  1) Tekil rapor (1 taşınmaz): null döner.
//  2) 2+ taşınmaz: "No" ilk sütun, GABİM gruplarının TÜM satırları
//     düzleştirilip sütun olarak eklenir, sıra korunur.
//  3) HER birim için switchActiveTitleUnit() + buildGabimDataGroups()
//     çağrılır — AKTİF birim (index 0) dahil, computeValuationFieldsForAllTitleUnits()'in
//     "aktif birim atlanır" desenine (0.0.613'te İnş. Sev. hatasına yol
//     açan) BİLEREK DÜŞÜLMEDİĞİ doğrulanır.
//  4) TÜM sütunlar "readonly" — TÜM taşınmazlarda AYNI değer olsa BİLE
//     "Ortak Bilgiler"e taşınmaz (bilinçli v1 kapsam kararı).
//  5) TÜM taşınmazlarda BOŞ olan sütun kaldırılır (finalizeTitleUnitsSummaryTableData
//     ile PAYLAŞIMLI davranış).
//  6) Başlık (buildUnitsSummaryTableHeadingHtml) + Excel-güvenliği
//     (<table> DIŞINDA).
//  7) renderSection() "gabimData" gate'i kaynak-düzeyi kablolama.
//  8) template-engine.js'te {{TASINMAZLARGABIMTABLOSU}} kayıtlı mı.

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

// GABIM_UNITS_TABLE_NEVER_HOIST_LABELS/GROUPS "const NAME = new Set([...]);"
// biçiminde — tek satırlık ifadenin sonundaki ";" ile biter (extractFunction'in
// süslü parantez sayma tekniğine benzer ama burada basitçe ilk ";" yeterli,
// içeride iç içe ";" yok).
function extractConstStatement(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit bulunamadı: ${name}`);
  const semicolonIndex = appSource.indexOf(";", start);
  assert(semicolonIndex >= 0, `Sabit sonu (;) bulunamadı: ${name}`);
  return appSource.slice(start, semicolonIndex + 1);
}

const constStatementNames = ["GABIM_UNITS_TABLE_NEVER_HOIST_LABELS", "GABIM_UNITS_TABLE_NEVER_HOIST_GROUPS"];

const functionNames = [
  "getTitleUnitCount",
  "buildGabimUnitsSummaryTableData",
  "buildGabimUnitsSummaryWordTableHtml",
  "finalizeTitleUnitsSummaryTableData",
  "buildUnitsSummaryTableHeadingHtml",
  "buildTitleUnitsSummaryTableHtmlFromData",
  "buildTitleUnitsSummaryTableCommonFieldsHtml",
  "buildTitleUnitsSummaryTableHtmlEditable",
  "splitTableHeaderLabelIntoTwoLines",
  "toTitleFieldUppercase",
  "getReportThemeToken",
  "formatWordCell",
  "escapeHtml",
];

const sandboxSource = `
  let state = {};
  let suppressValuationSideEffects = false;
  // Basitleştirilmiş SAHTE (bkz. dosya başı yorumu) — GERÇEK
  // switchActiveTitleUnit()'in snapshot/restore mekaniği DEĞİL, yalnızca
  // "aktif index değiştiğinde state.fields/tables o birimin KENDİ
  // verisini yansıtır" davranışı simüle edilir.
  function switchActiveTitleUnit(newIndex) {
    const count = 1 + (Array.isArray(state.titleUnits) ? state.titleUnits.length : 0);
    if (!Number.isInteger(newIndex) || newIndex < 0 || newIndex >= count || newIndex === state.activeTitleUnitIndex) return false;
    if (state.activeTitleUnitIndex === 0) {
      state.primaryTitleUnitShadow = { fields: state.fields, tables: state.tables };
    } else {
      state.titleUnits[state.activeTitleUnitIndex - 1] = { fields: state.fields, tables: state.tables };
    }
    if (newIndex === 0) {
      const shadow = state.primaryTitleUnitShadow || { fields: {}, tables: {} };
      state.fields = shadow.fields;
      state.tables = shadow.tables;
    } else {
      const unit = state.titleUnits[newIndex - 1] || { fields: {}, tables: {} };
      state.fields = unit.fields;
      state.tables = unit.tables;
    }
    state.activeTitleUnitIndex = newIndex;
    return true;
  }
  // GERÇEK buildGabimDataGroups() (bkz. dosya başı yorumu) BİLEREK
  // extract EDİLMEZ — davranış-koruyan basit bir SAHTE: her çağrıda
  // state.fields.__callLog dizisine hangi activeTitleUnitIndex ile
  // çağrıldığını kaydeder (senaryo 3'ün "aktif birim atlanmadı" testi
  // için) ve state.fields'ten okunan sabit bir 2-gruplu/3-satırlı yapı
  // döner (gerçek fonksiyonun {title, rows:[[label,value],...]} biçimini
  // BİREBİR taklit eder).
  function buildGabimDataGroups() {
    (globalThis.__gabimCallLog || (globalThis.__gabimCallLog = [])).push(state.activeTitleUnitIndex);
    const idx = state.activeTitleUnitIndex;
    return [
      {
        title: "Grup A",
        rows: [
          ["Alan1", state.fields.alan1 !== undefined ? state.fields.alan1 : ("DEGER-A1-" + idx)],
          ["Alan2 (Ortak)", state.fields.sharedValue || ""],
          // "Blok" GABIM_UNITS_TABLE_NEVER_HOIST_LABELS'te (etiketle
          // istisna) - TUM tasinmazlarda AYNI olsa BILE hoistlenmemeli.
          ["Blok", state.fields.blok || ""],
        ],
      },
      {
        title: "Grup B",
        rows: [
          ["Alan3", state.fields.alan3 !== undefined ? state.fields.alan3 : ("DEGER-B1-" + idx)],
        ],
      },
      {
        // GABIM_UNITS_TABLE_NEVER_HOIST_GROUPS'ta (grupla istisna) - bu
        // grubun TUM alanlari TUM tasinmazlarda AYNI olsa BILE hicbiri
        // hoistlenmemeli.
        title: "Bağımsız Bölüm / Taşınmaz Özellikleri",
        rows: [
          ["FiiliKullanim", state.fields.fiiliKullanim || ""],
        ],
      },
    ];
  }
  ${constStatementNames.map(extractConstStatement).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    buildGabimUnitsSummaryTableData,
    buildGabimUnitsSummaryWordTableHtml,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

function freshState(overrides = {}) {
  return {
    activeTitleUnitIndex: 0,
    fields: {},
    tables: {},
    titleUnits: [],
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) Tekil rapor (1 taşınmaz): null döner -------------------------------
{
  fns.setState(freshState());
  assert.equal(fns.buildGabimUnitsSummaryTableData(), null, "Tekil (1 taşınmazlı) raporda null dönmeli.");
  assert.equal(fns.buildGabimUnitsSummaryWordTableHtml(), "", "Tekil raporda HTML tablo boş string olmalı.");
  console.log("Tekil rapor (tablo uretilmemeli) testi tamam.");
}

// --- 2) 2+ taşınmaz: "No" ilk sütun, GABİM gruplarının TÜM satırları -------
// düzleştirilip sütun olarak eklenir, sıra korunur.
// NOT: sharedValue BİLEREK FARKLI ("Z"/"W") — aksi halde artık "scalar"
// olduğundan (kullanıcı takip talebi) hoistlenip bu sütun-sırası testinden
// KAYBOLURDU; hoisting davranışı AYRICA senaryo 4'te test ediliyor.
{
  globalThis.__gabimCallLog = [];
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { alan1: "100", alan3: "X", sharedValue: "Z" },
    tables: {},
    titleUnits: [unit({ alan1: "200", alan3: "Y", sharedValue: "W" })],
  });
  const data = fns.buildGabimUnitsSummaryTableData();
  assert.ok(data, "2 taşınmazlı raporda tablo verisi dönmeli.");
  assert.deepEqual(data.headers, ["No", "Alan1", "Alan2 (Ortak)", "Alan3"], "Sütun sırası GABİM grup/satır sırasıyla BİREBİR eşleşmeli.");
  assert.equal(data.rows[0][0], 1, "1. satırın 'No' değeri 1 olmalı.");
  assert.equal(data.rows[1][0], 2, "2. satırın 'No' değeri 2 olmalı.");
  assert.equal(data.rows[0][data.headers.indexOf("Alan1")], "100", "1. taşınmazın Alan1 değeri doğru sütunda olmalı.");
  assert.equal(data.rows[1][data.headers.indexOf("Alan1")], "200", "2. taşınmazın Alan1 değeri doğru sütunda olmalı.");
  assert.equal(data.rows[0][data.headers.indexOf("Alan3")], "X");
  assert.equal(data.rows[1][data.headers.indexOf("Alan3")], "Y");
  console.log("2+ tasinmazda tablo verisi + sutun sirasi testi tamam.");
}

// --- 3) switchActiveTitleUnit() + buildGabimDataGroups() HER birim için ----
// çağrılır — AKTİF birim (index 0) DAHİL (0.0.613'teki "aktif birim
// atlanır" desenine BİLEREK düşülmedi).
{
  globalThis.__gabimCallLog = [];
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: {},
    tables: {},
    titleUnits: [unit(), unit()],
  });
  fns.buildGabimUnitsSummaryTableData();
  assert.deepEqual(globalThis.__gabimCallLog, [0, 1, 2], "buildGabimDataGroups() TAM OLARAK [0,1,2] sırasıyla (aktif dahil, atlanmadan) çağrılmalı.");
  // Döngü sonunda activeTitleUnitIndex orijinal (0) değere GERİ DÖNMELİ.
  assert.equal(fns.getState().activeTitleUnitIndex, 0, "Döngü sonunda activeTitleUnitIndex orijinal (0) değere GERİ DÖNMELİ.");
  console.log("switchActiveTitleUnit+buildGabimDataGroups AKTIF birim dahil TUM birimler icin cagrilir testi tamam.");
}

// --- 4) KULLANICI TAKİP TALEBİ (2026-09-02): "ortak değerler yine üst -----
// kısımda belirtilmeli" — genel kural artık "scalar": TÜM taşınmazlarda
// AYNI (ve boş olmayan) değerdeki sütunlar "Ortak Bilgiler"e taşınır.
// AMA GABIM_UNITS_TABLE_NEVER_HOIST_LABELS/GROUPS'taki (taşınmaza-özgü
// olması GEREKEN) alanlar TÜM taşınmazlarda AYNI olsa BİLE ASLA
// hoistlenmez ("Blok" etiketle, "Bağımsız Bölüm / Taşınmaz Özellikleri"
// grubu grupla istisna — Değerleme/Bağımsız Bölüm'de 0.0.611/0.0.613'te
// öğrenilen dersin GABİM'e TEKRARLANMAMASI için PROAKTİF istisna).
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { alan1: "AYNI", alan3: "AYNI3", sharedValue: "ORTAK", blok: "AYNI-BLOK", fiiliKullanim: "AYNI-KULLANIM" },
    tables: {},
    titleUnits: [unit({ alan1: "AYNI", alan3: "AYNI3", sharedValue: "ORTAK", blok: "AYNI-BLOK", fiiliKullanim: "AYNI-KULLANIM" })],
  });
  const data = fns.buildGabimUnitsSummaryTableData();
  const commonLabels = data.commonFields.map((field) => field.label);
  ["Alan1", "Alan2 (Ortak)", "Alan3"].forEach((label) => {
    assert.ok(commonLabels.includes(label), `TÜM taşınmazlarda AYNI olan "${label}" artık 'Ortak Bilgiler'e taşınmalı, bulunan: ${commonLabels.join(", ")}`);
    assert.ok(!data.headers.includes(label), `"${label}" hoistlendiğinden HEADERS'ta kendi sütunu KALMAMALI.`);
  });
  ["Blok", "FiiliKullanim"].forEach((label) => {
    assert.ok(!commonLabels.includes(label), `"${label}" (proaktif istisna) TÜM taşınmazlarda AYNI olsa BİLE 'Ortak Bilgiler'e TAŞINMAMALI.`);
    assert.ok(data.headers.includes(label), `"${label}" hoistlenmediğinden HEADERS'ta kendi sütununda KALMALI.`);
  });
  console.log("KULLANICI TAKIP TALEBI: genel GABIM sutunlari artik hoistlenir, proaktif istisnalar (Blok/Bagimsiz Bolum grubu) HALA hoistlenmez testi tamam.");
}

// --- 5) TÜM taşınmazlarda BOŞ olan sütun kaldırılır ------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { alan1: "100", alan3: "", sharedValue: "" },
    tables: {},
    titleUnits: [unit({ alan1: "200", alan3: "", sharedValue: "" })],
  });
  const data = fns.buildGabimUnitsSummaryTableData();
  assert.ok(!data.headers.includes("Alan3"), "TÜM taşınmazlarda BOŞ olan 'Alan3' sütunu kaldırılmalıydı.");
  assert.ok(!data.headers.includes("Alan2 (Ortak)"), "TÜM taşınmazlarda BOŞ olan 'Alan2 (Ortak)' sütunu kaldırılmalıydı.");
  assert.ok(data.headers.includes("Alan1"), "Dolu olan sütun (Alan1) KORUNMALIYDI.");
  console.log("Tum tasinmazlarda bos olan sutunun kaldirilma testi tamam.");
}

// --- 6) Başlık + Excel-güvenliği (<table> DIŞINDA) -------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { alan1: "100" },
    tables: {},
    titleUnits: [unit({ alan1: "200" })],
  });
  const html = fns.buildGabimUnitsSummaryWordTableHtml();
  assert.ok(html.includes("Taşınmazlar GABİM Özeti"), "Başlık ('Taşınmazlar GABİM Özeti') üretilen HTML'de bulunmalı.");
  const headingIndex = html.indexOf("Taşınmazlar GABİM Özeti");
  const tableIndex = html.indexOf("<table");
  assert.ok(headingIndex >= 0 && tableIndex > headingIndex, "Başlık <table>'DAN ÖNCE, dışında bir <p> olmalı (Excel export'unun <table>...</table> regex'i tarafından yakalanmamalı).");
  assert.ok(!html.slice(0, tableIndex).includes("<table"), "Başlık kendi İÇİNDE bir <table> İÇERMEMELİ.");
  console.log("Baslik (buildUnitsSummaryTableHeadingHtml) + Excel-guvenligi testi tamam.");
}

// --- 7) renderSection() "gabimData" gate'i kaynak-düzeyi kablolama --------
{
  assert.match(
    appSource,
    /if \(section\.id === "gabimData" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createGabimUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'gabimData' gate'i createGabimUnitsSummaryTablePreview()'u eklemiyor."
  );
  console.log("renderSection gabimData gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 8) template-engine.js'te {{TASINMAZLARGABIMTABLOSU}} kayıtlı mı ------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.match(
    templateEngineSource,
    /TASINMAZLARGABIMTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildGabimUnitsSummaryWordTableHtml"\)\s*\}/,
    "template-engine.js'te {{TASINMAZLARGABIMTABLOSU}} -> buildGabimUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("{{TASINMAZLARGABIMTABLOSU}} template-engine.js kablolama testi tamam.");
}

// --- 9) report-tables-xlsx.js'te "Taşınmazlar GABİM Özeti" sayfası kayıtlı mı
{
  const xlsxSource = fs.readFileSync(path.join(__dirname, "..", "src", "exports", "report-tables-xlsx.js"), "utf8");
  assert.match(
    xlsxSource,
    /generatedCellGridFor\("buildGabimUnitsSummaryWordTableHtml"\)/,
    "report-tables-xlsx.js'te buildGabimUnitsSummaryWordTableHtml için generatedCellGridFor çağrısı bulunamadı."
  );
  assert.match(
    xlsxSource,
    /sanitizeSheetName\("Taşınmazlar GABİM Özeti", usedNames\)/,
    "report-tables-xlsx.js'te \"Taşınmazlar GABİM Özeti\" sayfası bulunamadı."
  );
  console.log("report-tables-xlsx.js GABIM sayfasi kablolama testi tamam.");
}

console.log("Tasinmazlar GABIM ozeti tablosu testleri basarili.");
