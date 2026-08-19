"use strict";

// Kullanıcı bildirimi (2026-08-12): "bir tabtan diğerine geçtiğimde yine
// çevresel özellik kısımlarını seçmek zorunda kalıyorum ... tüm tablar
// için geçerli ortak kısımlar bunlar" — "Adres ve Konum" sekmesindeki TÜM
// "Çevresel Özellik" alanları (environmentRegionType, developmentDensity,
// earthquakeZone, regionSecurityIssue, propertyValueTrend, ticari/tarımsal
// alt alanlar vb. — bkz. TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS yorumu)
// artık PAYLAŞIMLI: taşınmaz tabı değiştirmek bu alanları SIFIRLAMAMALI/
// AYIRMAMALI. Yalnızca gerçekten taşınmaza özgü alanlar (blockNo, parcelNo,
// city, district, neighborhood, outerDoor vb.) hâlâ taşınmaza göre ayrılır.
//
// Bu test, GERÇEK `TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS` sabitini
// (hard-coded bir kopya DEĞİL, app.js metninden çıkarılmış) kullanır — bkz.
// docs/coklu-talep-fonksiyonel-test-bulgulari.md bulgu #2 (stale fixture
// riski): tools/test-title-unit-switch.js ve tools/test-title-unit-import.js
// bu sabitin KENDİ ESKİ/eksik kopyalarını tutuyor, bu test onlardan BAĞIMSIZ
// olarak gerçek sabiti doğrular.

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

// GERÇEK TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'i metinden çıkar (kopyalamak yerine).
const sharedKeysStart = appSource.indexOf("const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set([");
assert(sharedKeysStart >= 0, "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS bulunamadı.");
const sharedKeysEnd = appSource.indexOf("]);", sharedKeysStart);
assert(sharedKeysEnd > sharedKeysStart, "TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS kapanmadı.");
const sharedKeysSource = appSource.slice(sharedKeysStart, sharedKeysEnd + 3);

// Yeni eklenen "Çevresel Özellik" alanlarının GERÇEKTEN kümede olduğunu
// kaynak-düzeyinde doğrula — biri unutulup silinirse bu test yakalar.
const expectedEnvironmentalFieldKeys = [
  "mainArtery",
  "environmentRegionType",
  "mainArteryProximity",
  "agriculturalActivityDensity",
  "agriculturalActivityTypes",
  "agriculturalSuitability",
  "regionBuildOrder",
  "regionFloorRange",
  "regionIncomeLevel",
  "infrastructureLevel",
  "developmentSpeed",
  "regionBuildingAge",
  "developmentDensity",
  "socialNeeds",
  "regionUsePurpose",
  "earthquakeZone",
  "regionSecurityIssue",
  "propertyValueTrend",
  "commercialFunctionDensity",
  "commercialFirmType",
  "commercialFrontageRoadType",
  "commercialDevelopmentCompleted",
];
expectedEnvironmentalFieldKeys.forEach((key) => {
  assert.match(
    sharedKeysSource,
    new RegExp(`"${key}"`),
    `"${key}" TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'ten çıkarılmış — bu alan yeniden taşınmaza-özel hale gelir.`,
  );
});
console.log("Cevresel ozellik alanlari - kaynak-duzeyinde paylaşim listesi testi tamam.");

// Davranışsal doğrulama: switchActiveTitleUnit gerçekten bu alanları
// AYIRMIYOR mu? Küçük bir fixture `sections` ile (test-title-unit-switch.js
// ile aynı desen) gerçek fonksiyonları çalıştır.
const functionNames = [
  "createEmptyTitleUnit",
  "getTitleUnitScopedFieldKeys",
  "snapshotTitleUnitScopedData",
  "applyTitleUnitScopedData",
  "getTitleUnitCount",
  "switchActiveTitleUnit",
  "addTitleUnitTab",
  // İmar Durumu koşullu (ada/parsel'e göre ortak/scoped) scoping (2026-08-16)
  // - getTitleUnitScopedFieldKeys() artık bunlara bağımlı.
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeTitleUnitsShareSameAdaParsel",
  "isPlanningScopedByAdaParsel",
  "getImarSectionFieldKeys",
  // Arsa Özellikleri scoping-gap-fix (2026-08-17) - getTitleUnitScopedFieldKeys()
  // artık buna KOŞULSUZ bağımlı.
  "getLandSectionFieldKeys",
  // Belgeler ve Proje scoping-gap-fix (2026-08-19) - getTitleUnitScopedFieldKeys()
  // artık buna da KOŞULSUZ bağımlı.
  "getDocumentsPerUnitOnlyFieldKeys",
  // Degerleme scoping-gap-fix + Emsaller (comparables) Arsa/Tarla paylasimi
  // (2026-08-19, devam) - getTitleUnitScopedFieldKeys()/getTitleUnitScopedTableKeys()
  // artik bunlara bagimli.
  "getValuationPerUnitOnlyFieldKeys",
  "getTitleUnitScopedTableKeys",
  "isComparablesSharedForLandReport",
  "isLandOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  // Bağımsız Bölüm/Ana Gayrimenkul scoping-gap-fix (2026-08-20) -
  // getTitleUnitScopedFieldKeys() artik bunlara da KOSULSUZ bagimli.
  "getUnitSectionFieldKeys",
  "getBuildingSectionFieldKeys",
];

const sandboxSource = `
let sections = [
  { id: "address", fields: [
    { key: "city" },
    { key: "environmentRegionType" },
    { key: "developmentDensity" },
    { key: "earthquakeZone" },
  ] },
  { id: "title", fields: [{ key: "blockNo" }, { key: "parcelNo" }] },
];
let state = null;
const TITLE_UNIT_SCOPED_SECTION_IDS = ["address", "title"];
const TITLE_UNIT_SCOPED_TABLE_KEYS_BASE = ["title", "comparables"];
${sharedKeysSource}
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
    fields: {
      city: "Bursa",
      blockNo: "2928",
      parcelNo: "46",
      environmentRegionType: "Tarımsal Alan",
      developmentDensity: "düşük",
      earthquakeZone: "3. Derece - Orta",
    },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  const afterSwitch = sandbox.getState();

  assert.equal(afterSwitch.fields.blockNo, undefined, "Yeni taşınmazda Ada (taşınmaza özgü) BOŞ olmalı.");
  assert.equal(
    afterSwitch.fields.environmentRegionType,
    "Tarımsal Alan",
    "\"Çevresel Özellik Bölge Türü\" yeni taşınmaz tabında da AYNI kalmalı (paylaşımlı).",
  );
  assert.equal(
    afterSwitch.fields.developmentDensity,
    "düşük",
    "\"Yapılaşma Yoğunluğu\" yeni taşınmaz tabında da AYNI kalmalı (paylaşımlı).",
  );
  assert.equal(
    afterSwitch.fields.earthquakeZone,
    "3. Derece - Orta",
    "\"Deprem Derecesi\" yeni taşınmaz tabında da AYNI kalmalı (paylaşımlı).",
  );
  console.log("Yeni tasinmaz tabinda cevresel ozellik alanlarinin korunmasi testi tamam.");
}

{
  const state = freshState();
  sandbox.setState(state);
  const newIndex = sandbox.fns.addTitleUnitTab();
  sandbox.fns.switchActiveTitleUnit(newIndex);
  // Yeni taşınmazda (paylaşımlı olduğu için hâlâ dolu gelen) alanı değiştir...
  sandbox.getState().fields.environmentRegionType = "Ticaret Bölgesi";
  sandbox.fns.switchActiveTitleUnit(0);
  // ...birincile dönünce de YENİ değeri görmeli (gerçekten TEK ortak değer).
  assert.equal(
    sandbox.getState().fields.environmentRegionType,
    "Ticaret Bölgesi",
    "Paylaşımlı alan herhangi bir taşınmazdan değiştirilince TÜM taşınmazlar için değişmeli (tek ortak değer).",
  );
  console.log("Paylasimli alan degisikliginin tum tasinmazlara yansimasi testi tamam.");
}
