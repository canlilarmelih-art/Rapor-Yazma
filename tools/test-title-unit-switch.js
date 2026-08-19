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
  // "İmar Durumu" koşullu (ada/parsel'e göre ortak/taşınmaza-özgü) scoping
  // (2026-08-16) — getTitleUnitScopedFieldKeys() artık bunlara bağımlı.
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeTitleUnitsShareSameAdaParsel",
  "isPlanningScopedByAdaParsel",
  // İmar Durumu "tümüne uygula" (2026-08-16).
  "getImarSectionFieldKeys",
  "applyImarDataToAllTitleUnits",
  // "Hesaplanan Emsal" istisnasi (2026-08-16, devam) - applyImarDataToAllTitleUnits()
  // artik composeImarCalculatedEmsal() ile YENIDEN hesapliyor, kopyalamiyor.
  "composeImarCalculatedEmsal",
  "normalizeYesNoChoice",
  "parseReportNumber",
  "formatImarSquareMeter",
  "foldTurkish",
  // Arsa Özellikleri (land) scoping-gap-fix + tümüne uygula (2026-08-17) -
  // getTitleUnitScopedFieldKeys() artik getLandSectionFieldKeys()'e KOSULSUZ
  // bagimli (İmar'in aksine land'in paylasim modeli degismiyor).
  "getLandSectionFieldKeys",
  "applyLandDataToAllTitleUnits",
  "calculateAgriculturalTotalCount",
  "roundAgriculturalTreeCount",
  // Belgeler ve Proje (documents) scoping-gap-fix (2026-08-19) -
  // getTitleUnitScopedFieldKeys() artik getDocumentsPerUnitOnlyFieldKeys()'e
  // KOSULSUZ bagimli (documents'in paylasim modeli de degismiyor, land ile
  // AYNI mantik).
  "getDocumentsPerUnitOnlyFieldKeys",
  // Degerleme (valuation) scoping-gap-fix (2026-08-19, devam) -
  // getTitleUnitScopedFieldKeys() artik getValuationPerUnitOnlyFieldKeys()'e
  // KOSULSUZ bagimli (valuation'in paylasim modeli de degismiyor).
  "getValuationPerUnitOnlyFieldKeys",
  // Emsaller (comparables) Arsa/Tarla'da paylasimli (2026-08-19, devam) -
  // TITLE_UNIT_SCOPED_TABLE_KEYS artik getTitleUnitScopedTableKeys()
  // fonksiyonuna cevrildi (isComparablesSharedForLandReport kosuluyla).
  "getTitleUnitScopedTableKeys",
  "isComparablesSharedForLandReport",
  "isLandOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  // Bağımsız Bölüm/Ana Gayrimenkul scoping-gap-fix (2026-08-20) -
  // getTitleUnitScopedFieldKeys() artik getUnitSectionFieldKeys()'e ve
  // getBuildingSectionFieldKeys()'e KOSULSUZ bagimli.
  "getUnitSectionFieldKeys",
  "getBuildingSectionFieldKeys",
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
const MULTI_TITLE_UNIT_OWNERSHIP_TYPES = new Set(["Dikey Kat İrtifakı", "Yatay Kat İrtifakı", "Müstakil Bina", "Arsa", "Tarla"]);
let sections = [
  { id: "title", fields: [{ key: "blockNo" }, { key: "parcelNo" }, { key: "titleBlockName" }, { key: "unitNo" }, { key: "titleQuality" }, { key: "titleRecordChange" }] },
  { id: "encumbrance", fields: [{ key: "takbisSummary" }, { key: "takbisDate" }] },
  { id: "address", fields: [{ key: "city" }] },
  { id: "unit", fields: [{ key: "legalArea" }] },
  // "İmar Durumu" koşullu scoping testi (2026-08-16) icin fixture'a eklendi
  // - gercek app.js'teki planning bolumunun kucultulmus bir kopyasi.
  { id: "planning", fields: [{ key: "planScale" }, { key: "hmax" }, { key: "kaks" }, { key: "floorCount" }, { key: "planCancellationStay" }] },
  // "Arsa Özellikleri" scoping-gap-fix testi (2026-08-17) icin fixture'a
  // eklendi - gercek app.js'teki land bolumunun kucultulmus bir kopyasi
  // (9 gercek alandan 3'u temsili; landNote/landClimateEarthquakeExplanation
  // PAYLASIMLI oldugu icin BILEREK disarida - gercek TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'teki
  // ayni ayrimi yansitir).
  { id: "land", fields: [{ key: "landShape" }, { key: "landRoadFrontage" }, { key: "landAgriculturalProduct" }] },
  // "Belgeler ve Proje" scoping-gap-fix testi (2026-08-19) icin fixture'a
  // eklendi - projectConformity/projectReviewDescription artik BILEREK
  // TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS fixture'inda DEGIL (gercek
  // app.js'teki 2026-08-19 cikarimini yansitir), reviewedDocumentsDescription
  // ise hala fixture'in kendi shared setinde (asagida) - degismedi.
  { id: "documents", fields: [{ key: "projectInstitution" }, { key: "projectConformity" }, { key: "projectReviewDescription" }, { key: "reviewedDocumentsDescription" }] },
  // Emsaller (comparables) Arsa/Tarla'da paylasimli testi (2026-08-19,
  // devam) icin fixture'a eklendi - gercek app.js'teki comparables
  // bolumunun kucultulmus bir kopyasi (comparableMarketAnalysisText zaten
  // shared setinde, asagida).
  { id: "comparables", fields: [{ key: "comparableMarketAnalysisText" }] },
  // Degerleme (valuation) scoping-gap-fix testi icin fixture'a eklendi -
  // gercek app.js'teki valuation bolumunun kucultulmus bir kopyasi
  // (legalValue/currentValue zaten declaratif/dogru scoped; saleabilityNote
  // shared setinde - gercek TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'teki
  // ayrimi yansitir).
  { id: "valuation", fields: [{ key: "legalValue" }, { key: "currentValue" }, { key: "saleabilityNote" }] },
  // Bağımsız Bölüm/Ana Gayrimenkul scoping-gap-fix testi (2026-08-20) icin
  // fixture'a eklendi - gercek app.js'teki "building" bolumu section.fields'i
  // LITERAL BOS DIZI (hicbir alan deklaratif degil, tum alanlar
  // getBuildingSectionFieldKeys() ile programatik eklenir) - fixture bunu
  // birebir yansitir.
  { id: "building", fields: [] },
];
let state = null;
// "unit"/"building" (2026-08-20) - gercek TITLE_UNIT_SCOPED_SECTION_IDS'in
// (app.js) guncel halini yansitir; onceden bu fixture kopyasi bayatlamisti
// (bkz. asagidaki senaryo 6 duzeltmesi).
const TITLE_UNIT_SCOPED_SECTION_IDS = ["address", "title", "encumbrance", "planning", "land", "documents", "comparables", "valuation", "unit", "building"];
const TITLE_UNIT_SCOPED_TABLE_KEYS_BASE = ["title", "encumbrance", "encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages", "comparables", "unitFloors", "buildingFloors"];
const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription", "takbisSummary", "reviewedDocumentsDescription", "comparableMarketAnalysisText", "saleabilityNote"]);
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

// --- 3) İlk taşınmazın mülkiyet türü tüm taşınmazlara uygulanır ---------
{
  const state = freshState({
    fields: {
      ...freshState().fields,
      ownershipType: "Tarla",
    },
    titleUnits: [{ fields: { ownershipType: "Arsa" }, tables: {} }],
  });
  sandbox.setState(state);
  assert.equal(sandbox.fns.syncMultiTitleUnitOwnershipType(), true, "İlk mülkiyet türü çoklu taşınmazlara uygulanmalı.");
  assert.equal(state.titleUnits[0].fields.ownershipType, "Tarla", "Ek taşınmaz ilk türü miras almalı.");

  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.ownershipType, "Tarla", "İkinci taba geçince ilk tür korunmalı.");
  sandbox.getState().fields.ownershipType = "Arsa";
  sandbox.fns.syncMultiTitleUnitOwnershipType();
  assert.equal(sandbox.getState().fields.ownershipType, "Tarla", "İkinci tab ilk türü değiştirememeli.");
  console.log("Çoklu mülkiyet türü (ilk taşınmaz kaynak) testi tamam.");
}

// --- 4) İleri-geri geçiş: veri kaybolmaz (kritik round-trip) ------------
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

// --- 6) Paylaşımlı alanlar hiçbir geçişte değişmez; "unit" ARTIK sızmıyor
{
  const state = freshState({ fields: { city: "Ankara", blockNo: "1", parcelNo: "1", legalArea: "120" } });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.fields.city, undefined, "\"address\" sekmesi alanı (city) yeni taşınmazda boş olmalı.");
  // 2026-08-20 DUZELTME: bu iddia ONCEDEN (yanlislikla) "legalArea KAPSAM
  // DISI, sizmamali" diyordu - oysa gercek app.js'te "unit" HER ZAMAN
  // TITLE_UNIT_SCOPED_SECTION_IDS'teydi ve legalArea section.fields'ta
  // deklaratifti (hidden:true), yani ZATEN dogru scoped'du. Bu fixture'in
  // KENDI TITLE_UNIT_SCOPED_SECTION_IDS kopyasi bayatlamis oldugundan test
  // yanlislikla "gecmiyor" olarak "gecen" bir iddiayi dogruluyordu. Simdi
  // fixture guncellendi (yukarida) - dogru davranis: legalArea DE taşınmaza
  // ozgu, yeni taşınmazda BOS olmali.
  assert.equal(afterAdd.fields.legalArea, undefined, "\"unit\" sekmesi alanı (legalArea) taşınmaza-özgüdür, yeni taşınmazda BOŞ olmalı (sızma YOK).");
  console.log("Paylasimli alanlarin etkilenmemesi + unit'in artik sizmamasi testi tamam.");
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
// --- 11) İlk taşınmazın mülkiyet türü tüm çoklu taşınmazlara yayılır -----
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
  assert.equal(after.fields.ownershipType, "Tarla");
  assert.equal(after.primaryTitleUnitShadow.fields.ownershipType, "Tarla");
  assert.deepEqual(after.titleUnits.map((unit) => unit.fields.ownershipType), ["Tarla", "Tarla"]);
  assert.equal(sandbox.fns.syncMultiTitleUnitOwnershipType("Arsa"), true, "İkinci taşınmazın seçimi ilk türü değiştirmemeli.");
  console.log("Coklu tasinmaz mulkiyet senkronizasyonu testi tamam.");
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

// --- 14) KML: ayni kayit N kez verilirse N FARKLI tasinmaza dagitilir ----
// Kullanici talebi (2026-08-15): "KML'i tek seferde yükleyip tüm
// taşınmazlara uygula" (AskUserQuestion onayi) — bkz. yeni
// applyKmlFileToAllTitleUnits() (app.js), TEK dosyayi ayristirip mevcut
// tasinmaz sayisi kadar KOPYALAYIP getKmlTargetIndexes()'e veriyor. Bu
// dagitimin GERCEKTEN her kopyayi FARKLI bir tasinmaza atadigini (ayni
// index'e IKI KEZ yazip digerlerini BOS BIRAKMADIGINI) dogrudan test eder.
{
  const state = freshState({
    fields: { blockNo: "", parcelNo: "" },
    titleUnits: [{ fields: { blockNo: "", parcelNo: "" }, tables: {} }],
  });
  sandbox.setState(state);
  const sameParcelRecord = { parsed: { fields: { blockNo: "4834", parcelNo: "1" } } };
  const indexes = sandbox.fns.getKmlTargetIndexes([sameParcelRecord, sameParcelRecord]);
  assert.deepEqual([...indexes].sort(), [0, 1], "Ayni KML kaydi tekrarlandiginda TUM tasinmazlara (farkli index'lere) dagitilmali, ayni index'e iki kez YAZILMAMALI.");
  console.log("KML: ayni kayit N kez verildiginde N farkli tasinmaza dagitilma testi tamam.");
}

// --- 15) KML: onceden eslesen tasinmaz oncelikli, kalan kopyalar BOSTAKI --
// diger tasinmazlara dagitilir (3. tasinmaz gerekirse addTitleUnitTab ile
// otomatik acilir — getKmlTargetIndexes'in kendi mevcut davranisi).
{
  const state = freshState({
    fields: { blockNo: "", parcelNo: "" },
    titleUnits: [
      { fields: { blockNo: "4834", parcelNo: "1" }, tables: {} }, // index 1: zaten eslesen
      { fields: { blockNo: "", parcelNo: "" }, tables: {} }, // index 2: bos
    ],
  });
  sandbox.setState(state);
  const sameParcelRecord = { parsed: { fields: { blockNo: "4834", parcelNo: "1" } } };
  const indexes = sandbox.fns.getKmlTargetIndexes([sameParcelRecord, sameParcelRecord, sameParcelRecord]);
  assert.deepEqual([...indexes].sort(), [0, 1, 2], "3 tasinmaz (biri onceden eslesen) icin 3 kopya UC FARKLI index'e dagitilmali.");
  assert.ok(indexes.includes(1), "Ada/parsel ONCEDEN eslesen tasinmaz (index 1) kopyalardan birine atanmali.");
  console.log("KML: onceden eslesen tasinmaz + kalanlarin bosa dagitilmasi testi tamam.");
}

// --- 16) applyKmlFileToAllTitleUnits() kaynak-duzeyi kablolama kontrolu --
// (applyKmlRecordsToTitleUnits ANDDOM/async agdrilar icerdiginden — bkz.
// applyLocalNeighborhoodForCurrentLocation/fetchNearbyPlacesForCurrentLocation —
// tam pipeline sandbox'ta calistirilamaz; DAGITIM mantigi 14/15'te
// dogrudan test edildi, burada yalnizca UI kablolamasinin app.js
// KAYNAGINDA var oldugu dogrulanir.)
{
  assert.match(
    appSource,
    /async function applyKmlFileToAllTitleUnits\(file\)\s*\{[\s\S]*?applyKmlRecordsToTitleUnits\(records\);/,
    "applyKmlFileToAllTitleUnits() bulunamadi veya applyKmlRecordsToTitleUnits'e kayit dizisi vermiyor."
  );
  assert.match(
    appSource,
    /applyAllCheckbox\?\.checked && files\.length === 1\)\s*\{\s*await applyKmlFileToAllTitleUnits\(files\[0\]\);/,
    "KML yukleme degisim-olayinda 'tum tasinmazlara uygula' kutucugu isaretliyken applyKmlFileToAllTitleUnits cagrilmiyor."
  );
  assert.match(
    appSource,
    /kmlApplyAllEligible = upload\.id === "kml" && isCurrentUserAdmin\(\) && getTitleUnitCount\(\) > 1/,
    "KML 'tum tasinmazlara uygula' kutucugu admin + Coklu Talep (2+ tasinmaz) gate'i kaybolmus olabilir."
  );
  console.log("applyKmlFileToAllTitleUnits kaynak-duzeyi kablolama testi tamam.");
}

// --- 17) computeTitleUnitsShareSameAdaParsel(): saf fonksiyon tablosu ----
// (Imar Durumu kosullu scoping, 2026-08-16) --------------------------------
{
  const u = (blockNo, parcelNo) => ({ fields: { blockNo, parcelNo } });
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([]), true, "Bos dizi icin true donmeli.");
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([u("100", "1")]), true, "Tek tasinmaz icin true donmeli.");
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([u("100", "1"), u("100", "1")]), true, "Ayni ada/parsel icin true donmeli.");
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([u("100", "1"), u("100", "2")]), false, "Farkli parsel icin false donmeli.");
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([u("100", "1"), u("200", "1")]), false, "Farkli ada icin false donmeli.");
  assert.equal(sandbox.fns.computeTitleUnitsShareSameAdaParsel([u(" 100 ", "1"), u("100", " 1 ")]), true, "Bosluk farkiyla ayni ada/parsel yine de true donmeli (trim).");
  console.log("computeTitleUnitsShareSameAdaParsel saf fonksiyon tablosu testi tamam.");
}

// --- 18) Imar Durumu kosullu scoping: ayni ada/parselde PAYLASIMLI, ------
// farkli ada/parselde tasinmaza-ozgu (Cift Yonlu Duzenleme'nin devami, ----
// 2026-08-16) ---------------------------------------------------------------
{
  // 18a) Ayni ada/parsel -> planScale/hmax scoped-set'te OLMAMALI, switch
  // sirasinda DEGISMEMELI (paylasimli).
  const sameState = freshState({ fields: { city: "İstanbul", blockNo: "709", parcelNo: "2", planScale: "1/1000", hmax: "12.50" } });
  sandbox.setState(sameState);
  const newIndex1 = sandbox.fns.addTitleUnitTab();
  // Yeni eklenen tasinmaz da AYNI ada/parseli tasisin (varsayilan senaryo:
  // coklu talepte butun birimler ayni parselde baslar) — bos birakilirsa
  // (createEmptyTitleUnit) bos "" degeri "709" ile ESLESMEZ ve ada/parsel
  // FARKLI sayilir, bu senaryonun test etmek istedigi "ayni ada/parsel"
  // durumunu YANLIS temsil eder.
  sandbox.getState().titleUnits[0].fields.blockNo = "709";
  sandbox.getState().titleUnits[0].fields.parcelNo = "2";
  const beforeKeys = sandbox.fns.getTitleUnitScopedFieldKeys();
  assert.ok(!beforeKeys.has("planScale") && !beforeKeys.has("hmax"), "Ayni ada/parselde planScale/hmax scoped-set'te OLMAMALI.");
  const switched1 = sandbox.fns.switchActiveTitleUnit(newIndex1);
  assert.equal(switched1, true, "Ayni ada/parselli 2. tasinmaza gecis basarili olmali.");
  const afterSwitch1 = sandbox.getState();
  assert.equal(afterSwitch1.fields.planScale, "1/1000", "Ayni ada/parselde planScale PAYLASIMLI kalmali (2. tasinmaza gecince degismemeli).");
  assert.equal(afterSwitch1.fields.hmax, "12.50", "Ayni ada/parselde hmax PAYLASIMLI kalmali.");
  assert.equal(afterSwitch1.primaryTitleUnitShadow.fields.planScale, undefined, "Paylasimliyken planScale golge yuvaya HIC yazilmamali (scoped-set disinda).");

  // 18b) Farkli ada/parsel -> planScale/hmax scoped-set'te OLMALI, switch
  // sirasinda BAGIMSIZLASMALI (round-trip).
  const diffState = freshState({ fields: { city: "İstanbul", blockNo: "709", parcelNo: "2", planScale: "1/1000", hmax: "12.50" } });
  sandbox.setState(diffState);
  const newIndex2 = sandbox.fns.addTitleUnitTab();
  sandbox.getState().titleUnits[0].fields.blockNo = "845"; // FARKLI parsel
  sandbox.getState().titleUnits[0].fields.parcelNo = "7";
  const afterKeys = sandbox.fns.getTitleUnitScopedFieldKeys();
  assert.ok(afterKeys.has("planScale") && afterKeys.has("hmax"), "Farkli ada/parselde planScale/hmax scoped-set'te OLMALI.");
  sandbox.fns.switchActiveTitleUnit(newIndex2);
  const afterSwitch2 = sandbox.getState();
  assert.equal(afterSwitch2.fields.planScale, undefined, "Farkli ada/parselde 2. (yeni, bos) tasinmaza gecince planScale BOS olmali (bagimsiz).");
  afterSwitch2.fields.planScale = "1/5000";
  afterSwitch2.fields.hmax = "9.50";
  sandbox.fns.switchActiveTitleUnit(0);
  const backToPrimary2 = sandbox.getState();
  assert.equal(backToPrimary2.fields.planScale, "1/1000", "Birincilin planScale'i (1/1000) farkli ada/parselde BAGIMSIZ kalip degismemeli.");
  sandbox.fns.switchActiveTitleUnit(1);
  const secondAgain2 = sandbox.getState();
  assert.equal(secondAgain2.fields.planScale, "1/5000", "2. tasinmaza tekrar gecince kendi girdigi deger (1/5000) KAYBOLMAMALI (round-trip).");
  console.log("Imar Durumu kosullu (ada/parsel'e gore ortak/scoped) davranis testi tamam.");
}

// --- 19) isPlanningScopedByAdaParsel(): tekil raporda HER ZAMAN false ----
{
  sandbox.setState(freshState({ titleUnits: [] }));
  assert.equal(sandbox.fns.isPlanningScopedByAdaParsel(), false, "Tekil (1 tasinmazli) raporda Imar Durumu HER ZAMAN paylasimli (false) olmali.");
  console.log("isPlanningScopedByAdaParsel tekil rapor testi tamam.");
}

// --- 20) applyImarDataToAllTitleUnits(): "tumune uygula" (2026-08-16) ----
// Kullanici talebi: "farkli ada parselde imar durumu kisminda bazen tum
// tasinmazlar ayni imar planina sahip olabiliyor (Ornek: 5 Adet Tarla
// hepsi Tarim Alani) ... tumune uygula secenegi olsun." applyTitleRecordChangeToAllTitleUnits
// (senaryo 9) ile AYNI "bir kez kopyala" deseni, tek farki TEK alan
// yerine getImarSectionFieldKeys()'in dondugu TUM alanlari kopyalamasi.
{
  const state = freshState({
    fields: { city: "İstanbul", blockNo: "100", parcelNo: "1", planScale: "1/1000", hmax: "12.50" },
  });
  sandbox.setState(state);
  sandbox.fns.addTitleUnitTab();
  sandbox.fns.addTitleUnitTab();
  const beforeApply = sandbox.getState();
  assert.equal(beforeApply.titleUnits.length, 2, "2 ek tasinmaz olusturulmali (fixture).");
  assert.notEqual(beforeApply.titleUnits[0].fields.planScale, "1/1000", "Uygulanmadan once diger tasinmazlar farkli/bos olmali (fixture kontrolu).");

  const unitCount = sandbox.fns.applyImarDataToAllTitleUnits();
  const afterApply = sandbox.getState();
  assert.equal(unitCount, 3, "Toplam tasinmaz sayisi (1 birincil + 2 ek) donmeli.");
  assert.equal(afterApply.titleUnits[0].fields.planScale, "1/1000", "1. ek tasinmaza Plan Olcegi kopyalanmali.");
  assert.equal(afterApply.titleUnits[0].fields.hmax, "12.50", "1. ek tasinmaza Hmax da (TUM alanlar) kopyalanmali.");
  assert.equal(afterApply.titleUnits[1].fields.planScale, "1/1000", "2. ek tasinmaza da kopyalanmali.");
  assert.equal(afterApply.fields.planScale, "1/1000", "Aktif (birincil) tasinmazin kendi degeri degismeden kalmali (zaten kaynaktı).");

  // Baska bir tasinmaza gecince de kopyalanan deger goruluyor mu (round-trip)?
  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.planScale, "1/1000", "2. tasinmaza gecilince kopyalanan deger dogru gorunmeli.");
  assert.equal(sandbox.getState().fields.hmax, "12.50", "2. tasinmaza gecilince Hmax da dogru gorunmeli.");

  // Aktif tasinmaz BIRINCIL DEGILKEN de calismali (primaryTitleUnitShadow
  // guncellenmeli, aksi halde birincile donulunce eski deger geri gelir).
  sandbox.getState().fields.planScale = "1/5000-FARKLI";
  sandbox.fns.applyImarDataToAllTitleUnits();
  sandbox.fns.switchActiveTitleUnit(0);
  assert.equal(sandbox.getState().fields.planScale, "1/5000-FARKLI", "Aktif tasinmaz birincil degilken uygulanan deger, birincile (primaryTitleUnitShadow uzerinden) de yansimali.");
  console.log("applyImarDataToAllTitleUnits (tumune uygula) testi tamam.");
}

// --- 21) applyImarDataToAllTitleUnits(): "Hesaplanan Emsal" ISTISNASI ----
// (2026-08-16, devam) — kullanici talebi: "tumune uygula dedigimde
// hesaplanan emsal mevcut sistemimizdeki formul ile hesaplanip yazilmali
// ayni sayi yazilmamali." calculatedEmsal AKTIF tasinmazdan KOPYALANMAMALI,
// her hedef tasinmazin KENDI landArea'siyla composeImarCalculatedEmsal()
// (kaks * netParselAlani) formuluyle YENIDEN hesaplanmali.
{
  const state = freshState({
    fields: { city: "İstanbul", blockNo: "100", parcelNo: "1", kaks: "2", landArea: "1000", calculatedEmsal: "YANLIS-KOPYALANMAMALI" },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  // Hedef (2.) tasinmazin KENDI landArea'si aktiften FARKLI (500 vs 1000) —
  // dogru davranista bu YENI hesaba katilmali, aktifin "1000"i DEGIL.
  sandbox.getState().titleUnits[0].fields.landArea = "500";

  sandbox.fns.applyImarDataToAllTitleUnits();
  const afterApply = sandbox.getState();
  // Beklenen: kaks(2) * landArea(500) = 1000 m^2 — aktifin calculatedEmsal
  // DEGERI ("YANLIS-KOPYALANMAMALI") DEGIL, kaks(2) * kendi landArea(500)
  // ile YENIDEN hesaplanmis "1.000 m²" olmali.
  assert.notEqual(afterApply.titleUnits[0].fields.calculatedEmsal, "YANLIS-KOPYALANMAMALI", "Hesaplanan Emsal aktif tasinmazdan OLDUGU GIBI kopyalanmamali.");
  assert.equal(afterApply.titleUnits[0].fields.calculatedEmsal, "1.000 m²", `Hedef tasinmazin KENDI landArea'siyla (500) YENIDEN hesaplanmis deger bekleniyordu, bulunan: ${afterApply.titleUnits[0].fields.calculatedEmsal}`);
  // kaks/planCancellationStay gibi DIGER alanlar hala normal sekilde
  // kopyalanmali (istisna SADECE calculatedEmsal'e ozel).
  assert.equal(afterApply.titleUnits[0].fields.kaks, "2", "kaks alani normal sekilde (istisna DISINDA) kopyalanmali.");
  console.log("applyImarDataToAllTitleUnits Hesaplanan Emsal istisnasi testi tamam.");
}

// --- 22) Arsa Özellikleri: popup alanlari artik tab degistirince SIZMIYOR --
// (2026-08-17, scoping-gap-fix) — kullanici bildirmeden ONCE kesfedilen
// sessiz kusur: landRoadFrontageItems/landBoundaryElementItems/
// landAgriculturalProductItems section.fields'ta olmadigindan (titleChangedRecords
// emsaliyle AYNI bosluk sinifi) getTitleUnitScopedFieldKeys() bunlari HIC
// toplamiyordu — bir tasinmaza Kadastro Yolu/Sinir Unsuru/Zirai Urun
// detayi girilip baska bir tasinmaza gecilince o veri YANLISLIKLA
// state.fields'ta kalip YENI tasinmaza "siziyordu".
{
  const state = freshState();
  state.fields.landRoadFrontage = "Evet";
  state.fields.landRoadFrontageItems = [{ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }];
  state.fields.landBoundaryElement = "Evet";
  state.fields.landBoundaryElementItems = ["Tel Örgü", "Duvar"];
  state.fields.landBoundaryElementOther = "Ek açıklama";
  state.fields.landAgriculturalProduct = "Evet";
  state.fields.landAgriculturalProductItems = [{ productType: "Zeytin", unitCount: "50", age: "10", yieldRate: "Yüksek", totalCount: "500" }];
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.landRoadFrontageItems, undefined, "REGRESYON: 2. (yeni/bos) tasinmaza Kadastro Yolu kayitlari SIZMAMALI.");
  assert.equal(secondUnit.fields.landBoundaryElementItems, undefined, "REGRESYON: 2. tasinmaza Sinir Unsuru kayitlari SIZMAMALI.");
  assert.equal(secondUnit.fields.landAgriculturalProductItems, undefined, "REGRESYON: 2. tasinmaza Zirai Urun kayitlari SIZMAMALI.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.deepEqual(
    primaryAgain.fields.landRoadFrontageItems,
    [{ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }],
    "Birincilin Kadastro Yolu kayitlari sizinti olmadan (round-trip) korunmali."
  );
  assert.deepEqual(primaryAgain.fields.landBoundaryElementItems, ["Tel Örgü", "Duvar"], "Birincilin Sinir Unsuru kayitlari korunmali.");
  assert.equal(primaryAgain.fields.landBoundaryElementOther, "Ek açıklama", "Birincilin Sinir Unsuru 'Diger' metni korunmali.");
  assert.deepEqual(
    primaryAgain.fields.landAgriculturalProductItems,
    [{ productType: "Zeytin", unitCount: "50", age: "10", yieldRate: "Yüksek", totalCount: "500" }],
    "Birincilin Zirai Urun kayitlari korunmali."
  );
  console.log("Arsa Ozellikleri popup alanlari (Kadastro Yolu/Sinir Unsuru/Zirai Urun) unit-scoped round-trip testi tamam.");
}

// --- 23) applyLandDataToAllTitleUnits(): "tumune uygula" (2026-08-17) ----
// Kullanici talebi: "bu bolumde tum tasinmazlara uygula butonu da yer
// alsin." applyImarDataToAllTitleUnits (senaryo 20) ile AYNI desen —
// skaler alanlar + landRoadFrontageItems/landBoundaryElementItems AYNEN
// kopyalanir (bu diziler taşınmaza-özgü hesaplanmis bir deger icermez).
{
  const state = freshState({
    fields: {
      city: "Bursa", blockNo: "10", parcelNo: "1",
      landShape: "Dikdörtgen", landRoadFrontage: "Evet",
      landRoadFrontageItems: [{ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }],
      landBoundaryElement: "Evet", landBoundaryElementItems: ["Tel Örgü"],
    },
  });
  sandbox.setState(state);
  sandbox.fns.addTitleUnitTab();
  sandbox.fns.addTitleUnitTab();
  const beforeApply = sandbox.getState();
  assert.equal(beforeApply.titleUnits.length, 2, "2 ek tasinmaz olusturulmali (fixture).");
  assert.notEqual(beforeApply.titleUnits[0].fields.landShape, "Dikdörtgen", "Uygulanmadan once diger tasinmazlar farkli/bos olmali (fixture kontrolu).");

  const unitCount = sandbox.fns.applyLandDataToAllTitleUnits();
  const afterApply = sandbox.getState();
  assert.equal(unitCount, 3, "Toplam tasinmaz sayisi (1 birincil + 2 ek) donmeli.");
  assert.equal(afterApply.titleUnits[0].fields.landShape, "Dikdörtgen", "1. ek tasinmaza skaler alan (landShape) kopyalanmali.");
  assert.deepEqual(
    afterApply.titleUnits[0].fields.landRoadFrontageItems,
    [{ roadType: "Kadastro yolu", roadName: "Atatürk Caddesi", direction: "Kuzey", length: "25" }],
    "1. ek tasinmaza Kadastro Yolu kayitlari AYNEN kopyalanmali (hesaplanmis deger icermiyor)."
  );
  assert.deepEqual(afterApply.titleUnits[0].fields.landBoundaryElementItems, ["Tel Örgü"], "1. ek tasinmaza Sinir Unsuru kayitlari da kopyalanmali.");
  assert.equal(afterApply.fields.landShape, "Dikdörtgen", "Aktif (birincil) tasinmazin kendi degeri degismeden kalmali (zaten kaynaktı).");

  sandbox.fns.switchActiveTitleUnit(1);
  assert.equal(sandbox.getState().fields.landShape, "Dikdörtgen", "2. tasinmaza gecilince kopyalanan deger dogru gorunmeli (round-trip).");
  console.log("applyLandDataToAllTitleUnits (tumune uygula) testi tamam.");
}

// --- 24) applyLandDataToAllTitleUnits(): landAgriculturalProductItems ----
// totalCount ISTISNASI (2026-08-17, devam) — İmar'in calculatedEmsal
// istisnasiyla BIREBIR AYNI desen/gerekce: her kaydin totalCount'u AKTIF
// tasinmazdan KOPYALANMAZ, HEDEF tasinmazin KENDI landArea'siyla
// calculateAgriculturalTotalCount() ile YENIDEN hesaplanir.
{
  const state = freshState({
    fields: {
      city: "Bursa", blockNo: "10", parcelNo: "1", landArea: "1000",
      landAgriculturalProduct: "Evet",
      landAgriculturalProductItems: [{ productType: "Zeytin", unitCount: "10", age: "5", yieldRate: "Orta", totalCount: "YANLIS-KOPYALANMAMALI" }],
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  // Hedef (2.) tasinmazin KENDI landArea'si aktiften FARKLI (500 vs 1000) —
  // dogru davranista bu YENI hesaba katilmali, aktifin "1000"i DEGIL.
  sandbox.getState().titleUnits[0].fields.landArea = "500";

  sandbox.fns.applyLandDataToAllTitleUnits();
  const afterApply = sandbox.getState();
  const copiedItem = afterApply.titleUnits[0].fields.landAgriculturalProductItems[0];
  assert.notEqual(copiedItem.totalCount, "YANLIS-KOPYALANMAMALI", "totalCount aktif tasinmazdan OLDUGU GIBI kopyalanmamali.");
  // Beklenen: (landArea/1000) * unitCount = (500/1000) * 10 = 5 -> 10'a
  // yuvarlanir (roundAgriculturalTreeCount, en yakin 10'a yuvarlar).
  assert.equal(copiedItem.totalCount, (10).toLocaleString("tr-TR"), `Hedef tasinmazin KENDI landArea'siyla (500) YENIDEN hesaplanmis deger bekleniyordu, bulunan: ${copiedItem.totalCount}`);
  // Digger alt-alanlar (productType/unitCount/age/yieldRate) hala normal
  // sekilde kopyalanmali (istisna SADECE totalCount'a ozel).
  assert.equal(copiedItem.productType, "Zeytin", "productType normal sekilde (istisna DISINDA) kopyalanmali.");
  assert.equal(copiedItem.unitCount, "10", "unitCount normal sekilde kopyalanmali.");
  console.log("applyLandDataToAllTitleUnits landAgriculturalProductItems totalCount istisnasi testi tamam.");
}

// --- 25) Belgeler ve Proje: projectSuitabilityStatus (ve varyantlari) ------
// artik tab degistirince SIZMIYOR (2026-08-19, scoping-gap-fix) - kullanici
// bildirmeden ONCE kesfedilen sessiz kusur: bu alanlar section.fields'ta
// deklaratif OLMADIGINDAN (titleChangedRecords emsaliyle AYNI bosluk
// sinifi) getTitleUnitScopedFieldKeys() bunlari HIC toplamiyordu - bir
// tasinmaza "Proje Uygunluk Durumu" girilip baska bir tasinmaza gecilince
// o deger YANLISLIKLA state.fields'ta kalip YENI tasinmaza "siziyordu".
{
  const state = freshState();
  state.fields.projectSuitabilityStatus = "projeye uygundur.";
  state.fields.projectSuitabilitySimpleRepair = "Evet";
  state.fields.titleProjectSuitabilityStatus = "projeye uygundur.";
  state.fields.titleProjectSuitabilityNote = "Tapu projesi notu";
  state.fields.municipalityProjectSuitabilityStatus = "projeye uygun degildir.";
  state.fields.municipalityProjectSuitabilityNote = "Belediye projesi notu";
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.projectSuitabilityStatus, undefined, "REGRESYON: 2. (yeni/bos) tasinmaza Proje Uygunluk Durumu SIZMAMALI.");
  assert.equal(secondUnit.fields.projectSuitabilitySimpleRepair, undefined, "REGRESYON: 2. tasinmaza basit onarim notu SIZMAMALI.");
  assert.equal(secondUnit.fields.titleProjectSuitabilityStatus, undefined, "REGRESYON: 2. tasinmaza Tapu Projesi Uygunluk Durumu SIZMAMALI.");
  assert.equal(secondUnit.fields.municipalityProjectSuitabilityStatus, undefined, "REGRESYON: 2. tasinmaza Belediye Projesi Uygunluk Durumu SIZMAMALI.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.projectSuitabilityStatus, "projeye uygundur.", "Birincilin Proje Uygunluk Durumu sizinti olmadan (round-trip) korunmali.");
  assert.equal(primaryAgain.fields.titleProjectSuitabilityNote, "Tapu projesi notu", "Birincilin Tapu Projesi notu korunmali.");
  assert.equal(primaryAgain.fields.municipalityProjectSuitabilityStatus, "projeye uygun degildir.", "Birincilin Belediye Projesi Uygunluk Durumu korunmali.");
  console.log("Belgeler ve Proje Uygunluk Durumu (projectSuitabilityStatus ve varyantlari) unit-scoped round-trip testi tamam.");
}

// --- 26) Belgeler ve Proje: projectConformity/projectReviewDescription -----
// artik RAPOR-GENELI PAYLASIMLI DEGIL, taşınmaza-özgü (2026-08-19) -
// kullanici: "Proje Uygunluk Durumu... bagimsiz bolum bazinda kalsin
// hepsi" - bu ikisi TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'ten
// CIKARILDIGINDAN artik genel dongu tarafindan otomatik toplaniyor.
{
  const state = freshState();
  state.fields.projectConformity = "Birincilin aciklamasi";
  state.fields.projectReviewDescription = "Birincilin proje inceleme aciklamasi";
  state.fields.reviewedDocumentsDescription = "Rapor geneli aciklama";
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.projectConformity, undefined, "projectConformity ARTIK tasinmaza-ozgu - 2. (yeni/bos) tasinmaza SIZMAMALI.");
  assert.equal(secondUnit.fields.projectReviewDescription, undefined, "projectReviewDescription ARTIK tasinmaza-ozgu - 2. tasinmaza SIZMAMALI.");
  // reviewedDocumentsDescription DEGISMEDI - hala rapor geneli paylasimli,
  // 2. (yeni) tasinmazda da AYNI deger gorunmeli (REGRESYON kontrolu).
  assert.equal(secondUnit.fields.reviewedDocumentsDescription, "Rapor geneli aciklama", "REGRESYON: reviewedDocumentsDescription hala rapor geneli paylasimli kalmali.");

  secondUnit.fields.projectConformity = "Ikincinin aciklamasi";
  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.projectConformity, "Birincilin aciklamasi", "Birincilin projectConformity'si 2. tasinmazdan ETKILENMEDEN (taşınmaza-özgü) korunmali.");
  console.log("projectConformity/projectReviewDescription artik tasinmaza-ozgu (rapor-geneli paylasim CIKARILDI) testi tamam.");
}

// --- 27) Emsaller (comparables): Arsa/Tarla Coklu Talep'te PAYLASIMLI -----
// Kullanici talebi (2026-08-19, devam): "COKLU ARSA TARLA raporlarinda
// emsaller ortak olmali. yani her tasinmaz icin ayri emsal girilmemeli."
{
  const state = freshState({
    fields: { ...freshState().fields, requestType: "Çoklu Talep", ownershipType: "Arsa", comparableMarketAnalysisText: "ORTAK METIN" },
    tables: { title: [{ c0: "MALİK BİR" }], comparables: [{ c0: "Emsal 1" }] },
  });
  sandbox.setState(state);
  assert.equal(sandbox.fns.isComparablesSharedForLandReport(), true, "Arsa + Coklu Talep icin paylasimli olmali (fixture kontrolu).");
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  // "comparables" section'in declaratif alani (comparableMarketAnalysisText)
  // ZATEN shared setinde (TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS) - bu
  // yeni ozellikten BAGIMSIZ olarak degismemeliydi (regresyon kontrolu).
  assert.equal(afterAdd.fields.comparableMarketAnalysisText, "ORTAK METIN", "comparableMarketAnalysisText zaten paylasimli - yeni tasinmazda da AYNI kalmali.");
  // "comparables" TABLOSU (Emsal kayitlari) - YENI ozellik: Arsa/Tarla
  // Coklu Talep'te bu da paylasimli olmali (yeni bos tasinmaza gecince
  // BOSALMAMALI, ayni satirlar gorunmeye devam etmeli).
  assert.deepEqual(afterAdd.tables.comparables, [{ c0: "Emsal 1" }], "KULLANICI TALEBI: Emsal kayitlari tablosu Arsa/Tarla Coklu Talep'te paylasimli olmali - yeni tasinmaza gecince BOSALMAMALI.");
  console.log("Emsaller (comparables) Arsa/Tarla Coklu Talep'te paylasimli olma testi tamam.");
}

// --- 28) Emsaller: Musteakil Bina/Tekli Talep'te davranis DEGISMEZ --------
{
  const state = freshState({
    fields: { ...freshState().fields, requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı" },
    tables: { title: [{ c0: "MALİK BİR" }], comparables: [{ c0: "Emsal 1" }] },
  });
  sandbox.setState(state);
  assert.equal(sandbox.fns.isComparablesSharedForLandReport(), false, "Kat Irtifaki'nda paylasimli OLMAMALI (fixture kontrolu).");
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterAdd = sandbox.getState();
  assert.equal(afterAdd.tables.comparables, undefined, "REGRESYON: Kat Irtifaki'nda (Arsa/Tarla DISI) Emsal kayitlari tablosu HALA tasinmaza-ozgu olmali (yeni tasinmazda BOS).");
  console.log("Emsaller Kat Irtifaki/Musteakil disinda davranis DEGISMEZ (regresyon) testi tamam.");
}

// --- 29) Degerleme: Piyasa Degeri alan/birim/manuel-bayrak alanlari -------
// artik tab degistirince SIZMIYOR (2026-08-19, devam, scoping-gap-fix) -
// kullanici bildirmeden ONCE kesfedilen sessiz kusur: bu alanlar
// section.fields'ta deklaratif OLMADIGINDAN getTitleUnitScopedFieldKeys()
// bunlari HIC toplamiyordu.
{
  const state = freshState({
    fields: {
      ...freshState().fields,
      legalValueArea: "100", legalValueUnit: "5000", legalValue: "500000",
      legalValueComparableAutoManual: "1", legalValueUserDefined: "1",
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.legalValueArea, undefined, "REGRESYON: 2. (yeni/bos) tasinmaza legalValueArea SIZMAMALI.");
  assert.equal(secondUnit.fields.legalValueUnit, undefined, "REGRESYON: 2. tasinmaza legalValueUnit SIZMAMALI.");
  assert.equal(secondUnit.fields.legalValueComparableAutoManual, undefined, "REGRESYON: 2. tasinmaza manuel-bayrak SIZMAMALI.");
  assert.equal(secondUnit.fields.legalValueUserDefined, undefined, "REGRESYON: 2. tasinmaza Arsa-ozel manuel-bayrak SIZMAMALI.");
  // legalValue (declaratif, zaten dogru scoped) da ayni sekilde bos olmali -
  // regresyon kontrolu (bu PR'dan ONCE de dogruydu).
  assert.equal(secondUnit.fields.legalValue, undefined, "legalValue (declaratif) zaten dogru tasinmaza-ozguydu - hala oyle olmali.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.legalValueArea, "100", "Birincilin legalValueArea'si sizinti olmadan (round-trip) korunmali.");
  assert.equal(primaryAgain.fields.legalValueUnit, "5000", "Birincilin legalValueUnit'i korunmali.");
  assert.equal(primaryAgain.fields.legalValueUserDefined, "1", "Birincilin Arsa-ozel manuel-bayragi korunmali.");
  console.log("Degerleme Piyasa Degeri alan/birim/manuel-bayrak alanlari unit-scoped round-trip testi tamam.");
}

// --- 30) Bağımsız Bölüm (unit): programatik alanlar artik SIZMIYOR --------
// (2026-08-20, scoping-gap-fix) - unitSalonFloor/unitInteriorDescription
// vb. ~50 alan section.fields'ta deklaratif OLMADIGINDAN daha once HIC
// toplanmiyordu (documents/valuation'la AYNI hata sinifi).
{
  const state = freshState({
    fields: {
      ...freshState().fields,
      unitUsageStatus: "Mesken", unitSalonFloor: "Seramik", unitInteriorDescription: "İç mekan metni",
      unitInteriorDescriptionManual: "1", facades: "Kuzey, Güney",
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.unitUsageStatus, undefined, "REGRESYON: 2. tasinmaza unitUsageStatus SIZMAMALI.");
  assert.equal(secondUnit.fields.unitSalonFloor, undefined, "REGRESYON: 2. tasinmaza unitSalonFloor (dekoratif panel) SIZMAMALI.");
  assert.equal(secondUnit.fields.unitInteriorDescription, undefined, "REGRESYON: 2. tasinmaza unitInteriorDescription SIZMAMALI.");
  assert.equal(secondUnit.fields.facades, undefined, "REGRESYON: 2. tasinmaza facades SIZMAMALI.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.unitSalonFloor, "Seramik", "Birincilin unitSalonFloor'u round-trip korunmali.");
  assert.equal(primaryAgain.fields.unitInteriorDescriptionManual, "1", "Birincilin unitInteriorDescriptionManual bayragi korunmali.");
  console.log("Bagimsiz Bolum (unit) programatik alanlari artik sizmiyor (round-trip) testi tamam.");
}

// --- 31) Ana Gayrimenkul (building): programatik alanlar artik SIZMIYOR ---
// (2026-08-20, scoping-gap-fix) - section.fields LITERAL BOS DIZI oldugundan
// bu bolumun HICBIR alani daha once toplanmiyordu (6 bolumun en ciddi
// bosluguydu - tab degistirmenin HICBIR etkisi yoktu).
{
  const state = freshState({
    fields: {
      ...freshState().fields,
      buildingStyle: "Betonarme", buildingAge: "10 yıl", buildingAgeManualOverride: "1",
      socialFacilities: "Yüzme Havuzu, Spor Salonu", mainPropertyDescription: "Ana gayrimenkul metni",
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.fields.buildingStyle, undefined, "REGRESYON: 2. tasinmaza buildingStyle SIZMAMALI.");
  assert.equal(secondUnit.fields.buildingAge, undefined, "REGRESYON: 2. tasinmaza buildingAge SIZMAMALI.");
  assert.equal(secondUnit.fields.socialFacilities, undefined, "REGRESYON: 2. tasinmaza socialFacilities SIZMAMALI.");
  assert.equal(secondUnit.fields.mainPropertyDescription, undefined, "REGRESYON: 2. tasinmaza mainPropertyDescription SIZMAMALI.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.equal(primaryAgain.fields.buildingStyle, "Betonarme", "Birincilin buildingStyle'i round-trip korunmali.");
  assert.equal(primaryAgain.fields.buildingAgeManualOverride, "1", "Birincilin buildingAgeManualOverride bayragi korunmali.");
  assert.equal(primaryAgain.fields.mainPropertyDescription, "Ana gayrimenkul metni", "Birincilin mainPropertyDescription'i round-trip korunmali.");
  console.log("Ana Gayrimenkul (building) programatik alanlari artik sizmiyor (round-trip) testi tamam.");
}

// --- 32) unitFloors/buildingFloors tablolari artik SIZMIYOR ---------------
// (2026-08-20) - getTitleUnitScopedTableKeys() TITLE_UNIT_SCOPED_TABLE_KEYS_BASE'e
// eklendi, snapshotTitleUnitScopedData/applyTitleUnitScopedData bu iki
// anahtari da tablolar icin ayni genel mekanizmayla kapsiyor.
{
  const state = freshState({
    tables: {
      title: [{ c0: "MALİK BİR" }],
      unitFloors: [{ floorName: "Zemin", residential: "1" }],
      buildingFloors: [{ floorName: "Zemin", residential: "1" }],
    },
  });
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const secondUnit = sandbox.getState();
  assert.equal(secondUnit.tables.unitFloors, undefined, "REGRESYON: 2. tasinmaza unitFloors tablosu SIZMAMALI.");
  assert.equal(secondUnit.tables.buildingFloors, undefined, "REGRESYON: 2. tasinmaza buildingFloors tablosu SIZMAMALI.");

  sandbox.fns.switchActiveTitleUnit(0);
  const primaryAgain = sandbox.getState();
  assert.deepEqual(primaryAgain.tables.unitFloors, [{ floorName: "Zemin", residential: "1" }], "Birincilin unitFloors tablosu round-trip korunmali.");
  assert.deepEqual(primaryAgain.tables.buildingFloors, [{ floorName: "Zemin", residential: "1" }], "Birincilin buildingFloors tablosu round-trip korunmali.");
  console.log("unitFloors/buildingFloors tablolari artik sizmiyor (round-trip) testi tamam.");
}

console.log("Coklu TAKBIS Faz 2 tab-anahtarlama motoru testleri basarili.");
