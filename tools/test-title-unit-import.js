// Çoklu TAKBİS Faz 2 — "Rapora Aktar" orkestrasyon testi (2026-08-09, bkz.
// docs/coklu-takbis-import-plan.md "Sıradaki adımlar" madde 1).
// importTakbisRecordsIntoTitleUnits() dört mevcut/kanıtlanmış
// applyTakbis*() fonksiyonunu TEKRAR kullanır — bu testin amacı O
// fonksiyonların İÇİNİ yeniden test etmek DEĞİL (zaten processTakbisFile
// akışında kanıtlanmış), yalnızca YENİ orkestrasyon mantığını (hangi kayıt
// hangi tab'a gidiyor, requestType ne zaman zorlanıyor, boş/geçersiz
// girdide ne oluyor) doğrulamak. Bu yüzden applyTakbis*() fonksiyonları
// burada HAFİF STUB'larla değiştirildi (gerçek DOM/setFieldFromSource
// bağımlılığı yok) — stub'lar yine de state.fields/state.tables'a
// yazıyor ki switchActiveTitleUnit ile round-trip bütünlüğü de
// doğrulanabilsin.

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

const functionNames = [
  "createEmptyTitleUnit",
  "getTitleUnitScopedFieldKeys",
  "snapshotTitleUnitScopedData",
  "applyTitleUnitScopedData",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "switchActiveTitleUnit",
  "addTitleUnitTab",
  "normalizeTakbisDuplicatePart",
  "normalizeTakbisDuplicateDate",
  "getTakbisDuplicateKey",
  "getExistingTakbisDuplicateKeys",
  "normalizeKmlParcelMatchPart",
  "getKmlParcelMatchKey",
  "kmlParcelMatchesTitleUnit",
  "getTakbisTargetIndexes",
  "importTakbisRecordsIntoTitleUnits",
  // İmar Durumu koşullu (ada/parsel'e göre ortak/scoped) scoping (2026-08-16)
  // - getTitleUnitScopedFieldKeys() artık bunlara bağımlı.
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeTitleUnitsShareSameAdaParsel",
  "isPlanningScopedByAdaParsel",
  "getImarSectionFieldKeys",
];

const sandboxSource = `
let sections = [
  { id: "title", fields: [{ key: "blockNo" }, { key: "parcelNo" }, { key: "titlePropertyId" }] },
  { id: "encumbrance", fields: [{ key: "takbisSummary" }] },
];
let state = null;
const TITLE_UNIT_SCOPED_SECTION_IDS = ["title", "encumbrance"];
const TITLE_UNIT_SCOPED_TABLE_KEYS = ["title", "encumbrance", "encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"];
const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription", "takbisSummary"]);

let applyCalls = [];
function applyTakbisTitleFieldsToReport() {
  const src = state.sourceValues.takbis || {};
  Object.entries(src.fields || {}).forEach(([k, v]) => { if (v) state.fields[k] = v; });
  applyCalls.push({ type: "title", propertyId: src.fields && src.fields.titlePropertyId });
}
function applyTakbisOwnersToTable(owners) {
  state.tables.title = (owners || []).map((o) => ({ c0: o.name || "" }));
  applyCalls.push({ type: "owners", count: (owners || []).length });
}
function applyTakbisEncumbranceFieldsToReport() {
  applyCalls.push({ type: "encFields" });
}
function applyTakbisEncumbrancesToTable(encumbrances) {
  state.tables.encumbrance = (encumbrances || []).map((e) => ({ c0: e.type || "" }));
  applyCalls.push({ type: "encTable", count: (encumbrances || []).length });
}

${functionNames.map(extractFunction).join("\n")}
return {
  fns: { ${functionNames.join(", ")} },
  getState: () => state,
  setState: (s) => { state = s; },
  getApplyCalls: () => applyCalls,
  resetApplyCalls: () => { applyCalls = []; },
};
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

function freshState() {
  return {
    fields: { city: "Ankara" },
    tables: {},
    sourceValues: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  };
}

function record(id, blockNo, owners = [{ name: "MALİK" }]) {
  return { fields: { titlePropertyId: id, blockNo, takbisReportDate: "2026-08-10" }, owners, encumbrances: [], sourceFile: `${id}.pdf` };
}

// parcelNo DAHİL — ada/parsel eşleştirme senaryolarında kullanılır
// (record() parcelNo set etmez, bu yüzden matching key hep boş kalır ve
// mevcut senaryolar ESKİ "1. kayıt birincile" davranışını hâlâ görür).
function recordWithParcel(id, blockNo, parcelNo, owners = [{ name: "MALİK" }]) {
  return { fields: { titlePropertyId: id, blockNo, parcelNo, takbisReportDate: "2026-08-10" }, owners, encumbrances: [], sourceFile: `${id}.pdf` };
}

// --- 1) Boş/geçersiz girdi: hiçbir şey değişmez, 0 döner ------------------
{
  sandbox.setState(freshState());
  sandbox.resetApplyCalls();
  const count = sandbox.fns.importTakbisRecordsIntoTitleUnits([]);
  assert.equal(count, 0, "Boş dizi için 0 dönmeli.");
  assert.equal(sandbox.getApplyCalls().length, 0, "Boş dizide hiçbir apply* fonksiyonu çağrılmamalı.");
  const count2 = sandbox.fns.importTakbisRecordsIntoTitleUnits([{ owners: [] }]); // fields yok -> geçersiz
  assert.equal(count2, 0, "fields'ı olmayan kayıt geçersiz sayılıp atlanmalı.");
  const count3 = sandbox.fns.importTakbisRecordsIntoTitleUnits([{ fields: {}, owners: [] }]);
  assert.equal(count3, 0, "Tamamen bos fields nesnesi bos tab olarak eklenmemeli.");
  console.log("Bos/gecersiz girdi testi tamam.");
}

// --- 2) Tek kayıt: yalnızca birincile yazılır, requestType ZORLANMAZ -----
{
  const state = freshState();
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  const count = sandbox.fns.importTakbisRecordsIntoTitleUnits([record("111", "709")]);
  assert.equal(count, 1, "1 kayıt aktarılmalı.");
  const after = sandbox.getState();
  assert.equal(after.fields.blockNo, "709", "Birincilin Ada alanı doldurulmalı.");
  assert.equal(after.titleUnits.length, 0, "Tek kayıtta yeni tab AÇILMAMALI.");
  assert.equal(after.activeTitleUnitIndex, 0, "İşlem sonunda birincilde kalınmalı.");
  assert.notEqual(after.fields.requestType, "Çoklu Talep", "Tek kayıtta requestType ZORLANMAMALI.");
  console.log("Tek kayit ice aktarma (birincile yazar, requestType zorlanmaz) testi tamam.");
}

// --- 3) Üç kayıt: 1. birincile, 2-3. yeni tab'lara; requestType zorlanır --
{
  const state = freshState();
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  const count = sandbox.fns.importTakbisRecordsIntoTitleUnits([
    record("111", "709"),
    record("222", "845"),
    record("333", "900"),
  ]);
  assert.equal(count, 3, "3 kayıt aktarılmalı.");
  const after = sandbox.getState();
  assert.equal(after.titleUnits.length, 2, "2 EK taşınmaz (toplam 3) oluşmalı.");
  assert.equal(after.fields.requestType, "Çoklu Talep", "Birden fazla taşınmazda requestType OTOMATİK Çoklu Talep olmalı.");
  assert.equal(after.activeTitleUnitIndex, 0, "İşlem sonunda birincile dönülmeli (kullanıcı yetim tab'da kalmamalı).");
  assert.equal(after.fields.blockNo, "709", "Birincilin verisi (709) doğru kalmalı.");
  assert.equal(after.titleUnits[0].fields.blockNo, "845", "2. taşınmazın verisi (845) kendi yuvasında doğru olmalı.");
  assert.equal(after.titleUnits[1].fields.blockNo, "900", "3. taşınmazın verisi (900) kendi yuvasında doğru olmalı.");

  // Round-trip: 2. taşınmaza geçilince malikler tablosu da doğru mu?
  sandbox.fns.switchActiveTitleUnit(1);
  const secondActive = sandbox.getState();
  assert.equal(secondActive.tables.title.length, 1, "2. taşınmazın malikler tablosu (stub üzerinden) doğru taşınmalı.");
  console.log("Uc kayit ice aktarma (birincil+2 yeni tab, requestType zorlanir, round-trip dogru) testi tamam.");
}

// --- 4) Her kayıt için sourceValues.takbis DOĞRU kayda ait olmalı --------
{
  const state = freshState();
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  sandbox.fns.importTakbisRecordsIntoTitleUnits([record("AAA", "1"), record("BBB", "2")]);
  const calls = sandbox.getApplyCalls().filter((c) => c.type === "title");
  assert.deepEqual(calls.map((c) => c.propertyId), ["AAA", "BBB"], "Her kayıt kendi Taşınmaz Kimlik No'suyla applyTakbisTitleFieldsToReport'a gitmeli (state.sourceValues.takbis sırayla doğru kaydı yansıtmalı).");
  console.log("Kayit basina sourceValues.takbis dogrulugu testi tamam.");
}

// --- 5) AynÄ± kimlik + aynÄ± TAKBÄ°S tarihi tekrar eklenmemeli; farklÄ± tarih kabul edilmeli
{
  const state = freshState();
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  const first = record("123456789", "709");
  assert.equal(sandbox.fns.importTakbisRecordsIntoTitleUnits([first]), 1, "Ä°lk TAKBÄ°S kaydÄ± aktarÄ±lmalÄ±.");
  const duplicate = record("123456789", "709");
  assert.equal(sandbox.fns.importTakbisRecordsIntoTitleUnits([duplicate]), 0, "AynÄ± kimlik ve tarihteki TAKBÄ°S tekrarÄ± atlanmalÄ±.");
  assert.equal(sandbox.getState().titleUnits.length, 0, "Tekrar TAKBÄ°S kaydÄ± yeni tab oluÅŸturmamalÄ±.");

  const laterReport = record("123456789", "709");
  laterReport.fields.takbisReportDate = "2026-08-11";
  assert.equal(sandbox.fns.importTakbisRecordsIntoTitleUnits([laterReport]), 1, "AynÄ± taÅŸÄ±nmazÄ±n farklÄ± tarihteki raporu kabul edilmeli.");
  assert.equal(sandbox.getState().titleUnits.length, 0, "FarklÄ± TAKBÄ°S tarihi mevcut taÅŸÄ±nmazÄ± gÃ¼ncellemeli, yeni tab aÃ§mamalÄ±.");
  assert.equal(sandbox.getState().fields.takbisReportDate, "2026-08-11", "FarklÄ± TAKBÄ°S tarihi kabul edilip mevcut kayda yazÄ±lmalÄ±.");
  console.log("TAKBIS kimlik + tarih tekrar kontrolu testi tamam.");
}

// --- 6) Ada/parsel eşleşmesiyle MEVCUT taşınmazlara yönlendirme, SIRA -----
// BAĞIMSIZ. Kullanıcı talebi (2026-08-15, gerçek dosyalarla test):
// "önce takbis sonra kml sırasını da otomatik düzelt" — KML'ler ÖNCE
// yüklenip taşınmaz sekmelerini ada/parsel bilgisiyle DOLDURMUŞSA, SONRA
// yüklenen TAKBİS artık bu MEVCUT sekmelerle eşleşir — YENİ tab AÇMAZ,
// mükerrer taşınmaz OLUŞMAZ, kayıtların GELİŞ SIRASI önemli DEĞİLDİR.
{
  const state = freshState();
  // KML'nin önceden doldurduğu 2 taşınmaz tabını taklit ediyoruz.
  state.fields = { ...state.fields, blockNo: "2927", parcelNo: "12" };
  state.titleUnits = [{ fields: { blockNo: "2928", parcelNo: "46" }, tables: {} }];
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  // Kayıtlar TERS sırada geliyor: önce 2928/46, sonra 2927/12.
  const count = sandbox.fns.importTakbisRecordsIntoTitleUnits([
    recordWithParcel("AAA", "2928", "46"),
    recordWithParcel("BBB", "2927", "12"),
  ]);
  assert.equal(count, 2, "2 kayıt da aktarılmalı.");
  const after = sandbox.getState();
  assert.equal(after.titleUnits.length, 1, "Ada/parseli zaten MEVCUT olan 2 taşınmaz için YENİ tab AÇILMAMALI (toplam hâlâ 2).");
  // Birincilin (index 0) ada/parseli 2927/12 idi -> eşleşen BBB kaydını almalı (sıradaki 1. kayıt AAA DEĞİL).
  assert.equal(after.fields.titlePropertyId, "BBB", "Birincil (2927/12), kendi ada/parseline eşleşen BBB kaydını almalı (sıra farklı olsa bile).");
  // Round-trip: 2. taşınmaza (2928/46) geçince AAA kaydını görmeli.
  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.titlePropertyId, "AAA", "2. taşınmaz (2928/46), kendi ada/parseline eşleşen AAA kaydını almalı.");
  console.log("Ada/parsel eslesmesiyle mevcut tasinmazlara yonlendirme (sira bagimsiz) testi tamam.");
}

// --- 7) Ada/parsel eşleşmeyen kayıt: mevcut taşınmazlar zaten eşleşen -----
// kayıtlara ayrılmışsa YENİ tab açılır (eski davranış — hiç eşleşme yoksa
// sırayla boşa düşme/gerekirse yeni tab — burada da geçerli).
{
  const state = freshState();
  state.fields = { ...state.fields, blockNo: "2927", parcelNo: "12" };
  state.titleUnits = [{ fields: { blockNo: "2928", parcelNo: "46" }, tables: {} }];
  sandbox.setState(state);
  sandbox.resetApplyCalls();
  const count = sandbox.fns.importTakbisRecordsIntoTitleUnits([
    recordWithParcel("BBB", "2927", "12"), // mevcut birincile eşleşir
    recordWithParcel("AAA", "2928", "46"), // mevcut 2. taşınmaza eşleşir
    recordWithParcel("CCC", "5000", "1"), // hiçbirine eşleşmez -> YENİ tab
  ]);
  assert.equal(count, 3, "3 kayıt da aktarılmalı.");
  const after = sandbox.getState();
  assert.equal(after.titleUnits.length, 2, "Eşleşmeyen 1 kayıt için YENİ bir tab açılıp toplam 3 taşınmaza çıkmalı (2 EK).");
  assert.equal(after.fields.titlePropertyId, "BBB", "Birincil (2927/12) BBB kaydını almalı.");
  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.titlePropertyId, "AAA", "2. taşınmaz (2928/46) AAA kaydını almalı.");
  sandbox.fns.switchActiveTitleUnit(2);
  assert.equal(sandbox.getState().fields.titlePropertyId, "CCC", "Eşleşmeyen kayıt YENİ açılan 3. taşınmaza gitmeli.");
  console.log("Eslesmeyen kayit icin yeni tab acilma testi tamam.");
}

console.log("Coklu TAKBIS Faz 2 rapora aktar orkestrasyonu testleri basarili.");
