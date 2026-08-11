// Çoklu TAKBİS Faz 2 — tab-anahtarlama motoru testi (2026-08-09, bkz.
// docs/coklu-takbis-import-plan.md "Faz 2: state.titleUnits[] veri modeli").
// switchActiveTitleUnit/addTitleUnitTab/removeActiveTitleUnitTab BİLİNÇLİ
// OLARAK render()/saveState()/isCurrentUserAdmin() ÇAĞIRMAZLAR (yalnızca
// state mutasyonu) — bu sayede DOM/localStorage olmadan sandbox'ta test
// edilebilirler. createTitleUnitTabBar() (gerçek DOM üretimi) buradan
// KAPSAM DIŞI — admin girişi gerektirdiği için canlıda görsel test
// yapılamıyor (standart proje kısıtlaması), yalnızca node --check +
// npm run verify + kod incelemesiyle doğrulandı (bkz. handoff.md).
//
// Kapsanan senaryolar:
//  1) Tek taşınmaz (titleUnits boş): getTitleUnitCount()===1, switch no-op.
//  2) Yeni taşınmaz ekleme: state.fields'taki Tapu/Takyidat alanları
//     KORUNUR (yeni tab boş açılır, birincil DEĞİŞMEZ), adres alanları da
//     taşınmazla birlikte ayrılır.
//  3) İleri-geri geçiş (0 -> 1 -> 0): veri KAYBOLMAZ, her iki taşınmazın
//     kendi alanları doğru yerde kalır (kritik round-trip testi).
//  4) Malikler tablosu (state.tables.title) taşınmaza göre doğru ayrılır.
//  5) Ek taşınmaz silme: aktif taşınmaz birincile döner, dizi küçülür,
//     birincil SİLİNEMEZ.
//  6) Paylaşımlı/kapsam dışı alanlar ("unit"/"valuation" bölümü alanları)
//     HİÇBİR taşınmaz geçişinde DEĞİŞMEZ.

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
  "computeTitleUnitTabLabel",
  "getTitleUnitScopedFieldKeys",
  "snapshotTitleUnitScopedData",
  "applyTitleUnitScopedData",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTabModels",
  "normalizeKmlParcelMatchPart",
  "getKmlParcelMatchKey",
  "kmlParcelMatchesTitleUnit",
  "getKmlTargetIndexes",
  "switchActiveTitleUnit",
  "addTitleUnitTab",
  "syncMultiTitleUnitOwnershipType",
  "removeActiveTitleUnitTab",
  "applyTitleRecordChangeToAllTitleUnits",
];

// Çoklu Excel akışında ana form bölümlerinin tamamı taşınmaz kapsamındadır.
// Fixture `sections`, testin kendi kontrollü alan kümesini temsil eder.
{
  assert.match(
    appSource,
    /const TITLE_UNIT_SCOPED_SECTION_IDS = \[[\s\S]*?"address"[\s\S]*?"valuation"[\s\S]*?\];/,
    "TITLE_UNIT_SCOPED_SECTION_IDS ana form bölümlerini kapsamıyor — fixture güncellenmeli."
  );
}

const sandboxSource = `
const MULTI_TITLE_UNIT_OWNERSHIP_TYPES = new Set(["Dikey Kat İrtifakı", "Yatay Kat İrtifakı"]);
let sections = [
  { id: "title", fields: [{ key: "blockNo" }, { key: "parcelNo" }, { key: "titleBlockName" }, { key: "unitNo" }, { key: "titleQuality" }, { key: "titleRecordChange" }] },
  { id: "encumbrance", fields: [{ key: "takbisSummary" }, { key: "takbisDate" }] },
  { id: "address", fields: [{ key: "city" }] },
  { id: "unit", fields: [{ key: "legalArea" }] },
];
let state = null;
const TITLE_UNIT_SCOPED_SECTION_IDS = ["address", "title", "encumbrance"];
const TITLE_UNIT_SCOPED_TABLE_KEYS = ["title", "encumbrance", "encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"];
const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription", "takbisSummary"]);
${functionNames.map(extractFunction).join("\n")}
return {
  fns: { ${functionNames.join(", ")} },
  getState: () => state,
  setState: (s) => { state = s; },
};
`;
// eslint-disable-next-line no-new-func
const sandbox = new Function(sandboxSource)();

function freshState(overrides = {}) {
  return {
    fields: { city: "İstanbul", blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "3", titleQuality: "MESKEN", takbisSummary: "" },
    tables: { title: [{ c0: "MALİK BİR" }] },
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) Tek taşınmaz: count===1, switch no-op --------------------------
{
  sandbox.setState(freshState());
  assert.equal(sandbox.fns.getTitleUnitCount(), 1, "titleUnits boşken toplam 1 (yalnızca birincil) olmalı.");
  const changed = sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(changed, false, "Zaten aktif olan index'e geçiş no-op (false) dönmeli.");
  const changed2 = sandbox.fns.switchActiveTitleUnit(5);
  assert.equal(changed2, false, "Aralık dışı index'e geçiş no-op (false) dönmeli, hata fırlatmamalı.");
  console.log("Tek tasinmaz (count=1, no-op switch) testi tamam.");
}

// --- 2) Yeni taşınmaz ekleme: birincil değişmez, yeni tab boş -----------
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  assert.equal(newIndex, 1, "İlk ek taşınmaz index 1 olmalı (0 birincil).");
  assert.equal(sandbox.getState().titleUnits.length, 1, "titleUnits'e 1 eleman eklenmeli.");

  const switched = sandbox.fns.switchActiveTitleUnit(newIndex);
  assert.equal(switched, true, "Geçiş başarılı olmalı.");
  const afterSwitch = sandbox.getState();
  assert.equal(afterSwitch.activeTitleUnitIndex, 1, "activeTitleUnitIndex güncellenmeli.");
  assert.equal(afterSwitch.fields.blockNo, undefined, "Yeni (boş) taşınmaza geçince Ada alanı BOŞ olmalı.");
  assert.equal(afterSwitch.fields.city, undefined, "Adres alanı (city) yeni taşınmazda boş olmalı.");
  assert.ok(afterSwitch.primaryTitleUnitShadow, "Birincilin verisi primaryTitleUnitShadow'a park edilmeli.");
  assert.equal(afterSwitch.primaryTitleUnitShadow.fields.blockNo, "709", "Park edilen birincil verisi (Ada) doğru olmalı.");
  console.log("Yeni tasinmaz ekleme (birincil ve adres verisi korunur) testi tamam.");
}

// --- 3) İleri-geri geçiş: veri kaybolmaz (kritik round-trip) ------------
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);

  // İkinci taşınmaza kendi verisini gir.
  const afterAdd = sandbox.getState();
  afterAdd.fields.blockNo = "845";
  afterAdd.fields.parcelNo = "7";
  afterAdd.fields.titleBlockName = "B";
  afterAdd.fields.unitNo = "12";

  // Birincile geri dön.
  const backToPrimary = sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(backToPrimary, true, "Birincile geçiş başarılı olmalı.");
  const primaryState = sandbox.getState();
  assert.equal(primaryState.fields.blockNo, "709", "Birincilin Ada'sı (709) EKSİKSİZ geri gelmeli.");
  assert.equal(primaryState.fields.titleBlockName, "A", "Birincilin Blok'u (A) EKSİKSİZ geri gelmeli.");
  assert.equal(primaryState.primaryTitleUnitShadow, null, "Birincile dönünce shadow temizlenmeli.");
  assert.equal(primaryState.titleUnits[0].fields.blockNo, "845", "İkinci taşınmazın girilen verisi (845) kendi yuvasına doğru kaydedilmeli.");

  // Tekrar ikinci taşınmaza geç, verisi hâlâ orada mı?
  sandbox.fns.switchActiveTitleUnit(1);
  const secondAgain = sandbox.getState();
  assert.equal(secondAgain.fields.blockNo, "845", "İkinci taşınmaza tekrar geçince girilen veri (845) KAYBOLMAMALI.");
  assert.equal(secondAgain.fields.unitNo, "12", "İkinci taşınmazın BB No'su (12) korunmalı.");
  console.log("Ileri-geri gecis (veri kaybolmuyor, round-trip) testi tamam.");
}

// --- 4) Malikler tablosu (state.tables.title) taşınmaza göre ayrılır ----
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.tables.title, undefined, "Yeni taşınmazın malikler tablosu BOŞ (undefined, createTable kendi varsayılanını üretsin) olmalı.");
  afterAdd.tables.title = [{ c0: "MALİK İKİ" }];

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryState = sandbox.getState();
  assert.deepEqual(primaryState.tables.title, [{ c0: "MALİK BİR" }], "Birincilin malikler tablosu (MALİK BİR) korunmalı.");

  sandbox.fns.switchActiveTitleUnit(1);
  const secondAgain = sandbox.getState();
  assert.deepEqual(secondAgain.tables.title, [{ c0: "MALİK İKİ" }], "İkinci taşınmazın malikler tablosu (MALİK İKİ) korunmalı.");
  console.log("Malikler tablosu (state.tables.title) tasinmaza gore ayrilma testi tamam.");
}

// --- 5) Ek taşınmaz silme: birincile döner, dizi küçülür, birincil silinemez ---
{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);

  const removedFromPrimary = sandbox.fns.removeActiveTitleUnitTab.call(null);
  // removeActiveTitleUnitTab çağrılırken activeTitleUnitIndex hâlâ 1 (ikinci taşınmaz).
  assert.equal(removedFromPrimary, true, "Aktif (birincil olmayan) taşınmaz silinebilmeli.");
  const afterRemove = sandbox.getState();
  assert.equal(afterRemove.activeTitleUnitIndex, 0, "Silme sonrası aktif tab birincile dönmeli.");
  assert.equal(afterRemove.titleUnits.length, 0, "titleUnits dizisi küçülmeli.");
  assert.equal(afterRemove.fields.blockNo, "709", "Birincilin verisi silme sonrası bozulmamalı.");

  const removedPrimary = sandbox.fns.removeActiveTitleUnitTab();
  assert.equal(removedPrimary, false, "Birincil taşınmaz SİLİNEMEMELİ (false dönmeli, hata fırlatmamalı).");
  console.log("Ek tasinmaz silme (birincile doner, birincil silinemez) testi tamam.");
}

// --- 6) Paylaşımlı/kapsam-dışı alanlar hiçbir geçişte değişmez ----------
{
  const state = freshState({ fields: { city: "Ankara", blockNo: "1", parcelNo: "1", legalArea: "120" } });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.fields.city, undefined, "\"address\" sekmesi alanı (city) yeni taşınmazda boş olmalı.");
  assert.equal(afterAdd.fields.legalArea, "120", "\"unit\" sekmesi alanı (legalArea) KAPSAM DIŞI olduğu için taşınmaz geçişinden etkilenmemeli (Faz 2 bilinçli sınırlama).");
  console.log("Paylasimli/kapsam-disi alanlarin etkilenmemesi testi tamam.");
}

// --- 7) "Talep Türü" alanı ve gizleme güvenlik ağı (kaynak-düzeyi) ------
// switchActiveTitleUnit vb. saf fonksiyonlar bu gate'ten habersiz (gate
// renderSection/createForm'da yaşıyor, DOM bağımlı) — bu yüzden davranışı
// kaynak metninde doğruluyoruz, tıpkı loadState() için yapıldığı gibi
// (bkz. tools/test-title-unit-model.js).
{
  assert.match(
    appSource,
    /key: "requestType",\s*\n\s*label: "Talep Türü",\s*\n\s*type: "select",\s*\n\s*defaultValue: "Tekli Talep",[\s\S]{0,120}options: \["Tekli Talep", "Çoklu Talep"\],/,
    "\"case\" sekmesinde requestType alanı (Tekli/Çoklu Talep, varsayılan Tekli) tanımlı olmalı."
  );
  assert.match(
    appSource,
    /\["address", "title", "encumbrance"\]\.includes\(section\.id\) && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"/,
    "Tab çubuğu YALNIZCA admin + \"Çoklu Talep\" ikisi birden doğruyken render edilmeli (mevcut/yeni raporlarda varsayılan olarak GİZLİ kalmalı)."
  );
  const requestTypeGuardOccurrences = appSource.split(
    'field.key === "requestType" && event.target.value !== "Çoklu Talep" && state.activeTitleUnitIndex !== 0'
  ).length - 1;
  assert.equal(requestTypeGuardOccurrences, 1, "\"input\" olayında Çoklu Talep'ten çıkışta otomatik birincile dönüş güvenlik ağı bir kez tanımlı olmalı.");
  const requestTypeBlurGuardOccurrences = appSource.split(
    'field.key === "requestType" && formattedValue !== "Çoklu Talep" && state.activeTitleUnitIndex !== 0'
  ).length - 1;
  assert.equal(requestTypeBlurGuardOccurrences, 1, "\"blur\" olayında da aynı güvenlik ağı bir kez tanımlı olmalı (select alanları bazı tarayıcılarda blur tetikleyebilir).");
  console.log("Talep Turu alani + gizleme guvenlik agi (kaynak-duzeyi) testi tamam.");
}

// --- 8) titleChangedRecords artik unit-scoped (round-trip sizmiyor) -----
{
  const state = freshState();
  state.fields.titleRecordChange = "Hayır";
  state.fields.titleChangedRecords = [];
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  afterAdd.fields.titleRecordChange = "Evet";
  afterAdd.fields.titleChangedRecords = ["mulkiyet"];

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.titleRecordChange, "Hayır", "Birincilin titleRecordChange degeri sizinti olmadan korunmali.");
  assert.deepEqual(primaryAgain.fields.titleChangedRecords, [], "Birincilin titleChangedRecords degeri sizinti olmadan korunmali.");
  assert.deepEqual(primaryAgain.titleUnits[0].fields.titleChangedRecords, ["mulkiyet"], "2. tasinmazin titleChangedRecords secimi kendi yuvasinda dogru saklanmali.");
  console.log("titleChangedRecords unit-scoped round-trip testi tamam.");
}

// --- 8b) requestType tasinmaz tabina gecince rapor genelinde korunur -----
{
  const state = freshState();
  state.fields.requestType = "Çoklu Talep";
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  assert.equal(sandbox.getState().fields.requestType, "Çoklu Talep", "Tapu tabina geciste Talep Turu Çoklu Talep olarak korunmali.");
  sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(sandbox.getState().fields.requestType, "Çoklu Talep", "Birincile donuste Talep Turu korunmali.");
  console.log("requestType tasinmaz tab gecisinde korunma testi tamam.");
}

// --- 9) applyTitleRecordChangeToAllTitleUnits: tumune uygula ------------
{
  const state = freshState();
  state.fields.titleRecordChange = "Evet";
  state.fields.titleChangedRecords = ["mulkiyet", "sinirlama"];
  sandbox.setState(state);
  sandbox.fns.addTitleUnitTab();
  sandbox.fns.addTitleUnitTab();
  const beforeApply = sandbox.getState();
  assert.equal(beforeApply.titleUnits.length, 2, "2 ek tasinmaz olusturulmali (fixture).");
  assert.notEqual(beforeApply.titleUnits[0].fields.titleRecordChange, "Evet", "Uygulanmadan once diger tasinmazlar farkli/bos olmali (fixture kontrolu).");

  const unitCount = sandbox.fns.applyTitleRecordChangeToAllTitleUnits();
  const afterApply = sandbox.getState();
  assert.equal(unitCount, 3, "Toplam tasinmaz sayisi (1 birincil + 2 ek) donmeli.");
  assert.equal(afterApply.titleUnits[0].fields.titleRecordChange, "Evet", "1. ek tasinmaza deger kopyalanmali.");
  assert.deepEqual(afterApply.titleUnits[0].fields.titleChangedRecords, ["mulkiyet", "sinirlama"], "1. ek tasinmaza secili kayitlar da kopyalanmali.");
  assert.equal(afterApply.titleUnits[1].fields.titleRecordChange, "Evet", "2. ek tasinmaza deger kopyalanmali.");
  assert.equal(afterApply.fields.titleRecordChange, "Evet", "Aktif (birincil) tasinmazin kendi degeri degismeden kalmali (zaten kaynaktı).");

  // Baska bir tasinmaza gecince de kopyalanan deger goruluyor mu (round-trip)?
  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.titleRecordChange, "Evet", "2. tasinmaza gecilince kopyalanan deger dogru gorunmeli.");
  console.log("applyTitleRecordChangeToAllTitleUnits (tumune uygula) testi tamam.");
}

// --- 10) Bulk-uygula UI'nin kaynakta dogru sartlarla gate'lendigi -------
{
  assert.match(
    appSource,
    /if \(isCurrentUserAdmin\(\) && getTitleUnitCount\(\) > 1\) \{\s*\n\s*const applyAllLabel/,
    "\"Tumune uygula\" kutucugu YALNIZCA admin + birden fazla tasinmaz varken gosterilmeli."
  );
  console.log("Tumune uygula UI gate kosulu (kaynak-duzeyi) testi tamam.");
}

assert.match(appSource, /function createSectionExcelPanel\(section\)/, "Her ana bolum icin bolum Excel paneli bulunmali.");
assert.match(appSource, /getSectionExcelValidations\(definitions\)/, "Bölüm Excel dışa aktarımı seçim listesi doğrulamalarını iletmeli.");
assert.match(appSource, /tcmbRateStrip\?\.toggleAttribute\("hidden", section\.id !== "valuation"\)/, "TCMB kur bandı yalnızca Değerleme bölümünde görünmeli.");
assert.match(appSource, /body\.classList\.toggle\("show-tcmb-rate-strip", showTcmbRateStrip\)/, "TCMB bandı görünürlüğü gövde görünürlük sınıfıyla da korunmalı.");
console.log("Bolum bazli Excel + Excel dropdown + TCMB gorunurluk kontrolleri tamam.");
assert.match(appSource, /buildImarPlanningNote\([\s\S]*?pluralizeEnvironmentalSubjectText\(note, Boolean\(sharedParcelNarrative\)\)/);
assert.match(appSource, /section-excel-panel--mixed-parcels/);
assert.match(appSource, /panel\.dataset\.parcelScope = mixedParcels \? "mixed" : "shared-or-single"/);
// --- 11) Kat irtifakı türü tüm çoklu taşınmazlara yayılır ---------------------
{
  const state = freshState({
    fields: { ownershipType: "Dikey Kat İrtifakı" },
    titleUnits: [
      { fields: { ownershipType: "Müstakil Bina" }, tables: {} },
      { fields: { ownershipType: "Arsa" }, tables: {} },
    ],
    primaryTitleUnitShadow: { fields: { ownershipType: "Tarla" }, tables: {} },
    activeTitleUnitIndex: 1,
  });
  sandbox.setState(state);
  const changed = sandbox.fns.syncMultiTitleUnitOwnershipType("Yatay Kat İrtifakı");
  assert.equal(changed, true, "Yatay kat irtifakı çoklu taşınmazlarda senkronize edilmeli.");
  const after = sandbox.getState();
  assert.equal(after.fields.ownershipType, "Yatay Kat İrtifakı");
  assert.equal(after.primaryTitleUnitShadow.fields.ownershipType, "Yatay Kat İrtifakı");
  assert.deepEqual(after.titleUnits.map((unit) => unit.fields.ownershipType), ["Yatay Kat İrtifakı", "Yatay Kat İrtifakı"]);
  assert.equal(sandbox.fns.syncMultiTitleUnitOwnershipType("Arsa"), false, "Arsa kat irtifakı senkronizasyon kuralını tetiklememeli.");
  console.log("Coklu tasinmaz kat irtifaki mulkiyet senkronizasyonu testi tamam.");
}

// --- 12) Açıklama alanları rapor-genelidir, tab değişiminde korunur --------
{
  const state = freshState({
    fields: {
      city: "İstanbul",
      blockNo: "709",
      takbisSummary: "Ortak takyidat açıklaması",
      environmentDescription: "Ortak çevresel özellikler açıklaması",
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  assert.equal(sandbox.getState().fields.takbisSummary, "Ortak takyidat açıklaması", "Takyidat açıklaması tab değişiminde korunmalı.");
  assert.equal(sandbox.getState().fields.environmentDescription, "Ortak çevresel özellikler açıklaması", "Çevresel açıklama tab değişiminde korunmalı.");
  sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(sandbox.getState().fields.takbisSummary, "Ortak takyidat açıklaması", "Birincil taba dönüşte ortak takyidat açıklaması korunmalı.");
  console.log("Ortak açıklama alanları tab değişiminde korunuyor testi tamam.");
}

// --- 13) KML dosyalari ada + parsel ile dogru tapu tabina eslesir ---------
{
  const state = freshState({
    fields: { blockNo: "101", parcelNo: "2" },
    titleUnits: [{ fields: { blockNo: "202", parcelNo: "7" }, tables: {} }],
  });
  sandbox.setState(state);
  const indexes = sandbox.fns.getKmlTargetIndexes([
    { parsed: { fields: { blockNo: "202", parcelNo: "7" } } },
    { parsed: { fields: { parcelNo: "2" } } },
  ]);
  assert.deepEqual(indexes, [1, 0], "KML dosyalari yukleme sirasindan bagimsiz olarak ada/parsel tablarina eslesmeli.");
  console.log("KML coklu dosya ada/parsel eslestirme testi tamam.");
}

console.log("Coklu TAKBIS Faz 2 tab-anahtarlama motoru testleri basarili.");
