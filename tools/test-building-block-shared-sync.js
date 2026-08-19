// "Ana Gayrimenkul Özellikleri" (building): Blok bazlı paylaşım + Blok →
// Bağımsız Bölüm tab yapısı (2026-08-20). Kullanıcı talebi: "Ana
// gayrimenkul bölümünde blok bazında açıklama olsun kaç adet blok var ise
// belgeler bölümünde yer aldığı gibi blok bazında o kadar ana gayrimenkul
// açıklaması olsun." — Belgeler ve Proje'nin (0.0.479-483) 2 katmanlı Blok
// → Bağımsız Bölüm tab yapısının BİREBİR ikizi, AYNI kısıt (yalnızca
// Dikey/Yatay Kat İrtifakı + birden fazla blok varken).
//
// Bu test kapsamı:
//  1) getBuildingSectionFieldKeys(): section.fields boş dizi olsa bile
//     ~22 programatik alanı (buildingStyle/mainPropertyDescription vb.)
//     doğru döner.
//  2) getBuildingBlockSharedFieldKeys(): getBuildingSectionFieldKeys()'in
//     TAMAMI (mainPropertyDescription DAHİL).
//  3) isBuildingBlockGroupingActive(): isDocumentsBlockGroupingActive()'le
//     BİREBİR AYNI gate koşulları (Çoklu Talep + 2+ taşınmaz + Dikey/Yatay
//     Kat İrtifakı + 2+ farklı blok).
//  4) syncBuildingSharedDataToBlockSiblings(): AYNI bloktaki diğer üyelere
//     getBuildingBlockSharedFieldKeys()'in TAMAMI (mainPropertyDescription
//     dahil) + buildingFloors tablosu kopyalanır; FARKLI bloktaki üyeler
//     ASLA etkilenmez; gate kapalıyken (Müstakil Bina/tek blok/Tekli
//     Talep) no-op.
//  5) renderSection() gate'i kaynak-düzeyinde doğru koşulla kablolu.

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
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "buildAllTitleUnitsForSummaryTable",
  "computeDocumentsBlockGroups",
  "computeDocumentsBlockLabel",
  "foldTurkish",
  "getOwnershipTypeText",
  "isCondominiumOwnershipTypeValue",
  "isCondominiumOwnershipType",
  "isBuildingBlockGroupingActive",
  "resolveTitleUnitWriteTarget",
  "resolveTitleUnitBuildingFloorsRowsWriteTarget",
  "getBuildingSectionFieldKeys",
  "getBuildingBlockSharedFieldKeys",
  "syncBuildingSharedDataToBlockSiblings",
];

// bkz. test-documents-block-grouping.js'teki AYNI emsal: normalizeReportTitleText
// (getOwnershipTypeText/isCondominiumOwnershipTypeValue'nun gerçek
// bağımlılığı) bu testin kapsamı DEĞİL — kimlik fonksiyonuyla stub'lanır.
const sandboxSource = `
  let state = {};
  let sections = [
    { id: "building", fields: [] },
  ];
  const TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS = new Set(["transport", "nearby", "environmentDescription"]);
  function normalizeReportTitleText(value) { return String(value || ""); }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    computeDocumentsBlockGroups, computeDocumentsBlockLabel,
    isBuildingBlockGroupingActive, isCondominiumOwnershipTypeValue,
    syncBuildingSharedDataToBlockSiblings,
    buildAllTitleUnitsForSummaryTable,
    getBuildingSectionFieldKeys, getBuildingBlockSharedFieldKeys,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(blockNo, parcelNo, titleBlockName, overrides = {}, tables = {}) {
  return { fields: { blockNo, parcelNo, titleBlockName, ...overrides }, tables };
}

function freshState(overrides = {}) {
  return {
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) getBuildingSectionFieldKeys(): section.fields bos olsa bile ------
// ~22 programatik alani dogru dondurur.
{
  const keys = fns.getBuildingSectionFieldKeys();
  ["buildingStyle", "buildingAge", "buildingAgeManualOverride", "carpark", "elevator",
    "socialFacilities", "buildingBlockCount", "buildingSubjectBlockPosition",
    "buildingFloorCounts", "totalFloors", "totalUnits",
    "mainPropertyFloorSummary", "mainPropertyDescription", "mainPropertyFloorCountText"].forEach((key) => {
    assert.ok(keys.includes(key), `"${key}" getBuildingSectionFieldKeys()'te OLMALI.`);
  });
  console.log("getBuildingSectionFieldKeys programatik alan listesi testi tamam.");
}

// --- 2) getBuildingBlockSharedFieldKeys(): getBuildingSectionFieldKeys()'in
// TAMAMI, mainPropertyDescription DAHIL ------------------------------------
{
  const sectionKeys = fns.getBuildingSectionFieldKeys();
  const sharedKeys = fns.getBuildingBlockSharedFieldKeys();
  assert.deepEqual(sharedKeys, sectionKeys, "getBuildingBlockSharedFieldKeys() getBuildingSectionFieldKeys()'in TAMAMI olmali.");
  assert.ok(sharedKeys.includes("mainPropertyDescription"), "mainPropertyDescription blok-paylasimli listede OLMALI (kullanici talebi: bir BB'de uretilen aciklama digerlerine yansisin).");
  console.log("getBuildingBlockSharedFieldKeys icerik testi tamam.");
}

// --- 3) isBuildingBlockGroupingActive(): gate kosullari -------------------
{
  // 3a) Yatay Kat Irtifaki + Coklu Talep + 2 farkli blok -> true
  fns.setState(freshState({
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), true, "Yatay Kat Irtifaki + 2 farkli blok -> true bekleniyordu.");

  // 3b) Ayni blok (2+ tasinmaz olsa bile) -> false
  fns.setState(freshState({
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "AYNI blokta (2+ tasinmaz olsa bile) false bekleniyordu.");

  // 3c) Musteakil Bina -> false (Belgeler'le AYNI kisitlama)
  fns.setState(freshState({
    fields: { requestType: "Çoklu Talep", ownershipType: "Müstakil Bina", blockNo: "100", parcelNo: "1", titleBlockName: "" },
    titleUnits: [{ fields: { blockNo: "200", parcelNo: "9", titleBlockName: "" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "Musteakil Bina raporunda false bekleniyordu.");

  // 3d) Tekli Talep -> false
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "Tekli Talep'te false bekleniyordu.");

  // 3e) Tekil tasinmaz (titleUnits bos) -> false
  fns.setState(freshState({ titleUnits: [] }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "Tekil tasinmazli raporda false bekleniyordu.");

  console.log("isBuildingBlockGroupingActive gate kosullari testi tamam.");
}

// --- 4) syncBuildingSharedDataToBlockSiblings(): ortak alanlar (mainPropertyDescription
// DAHIL) + buildingFloors tablosu kopyalanir, farkli bloktaki uyeler ETKILENMEZ --
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      buildingStyle: "Betonarme", buildingAge: "10 yıl", socialFacilities: "Yüzme Havuzu",
      mainPropertyDescription: "A Blok'un ana gayrimenkul açıklaması metni.",
    },
    tables: { buildingFloors: [{ floorName: "Zemin", residential: "2" }] },
    titleUnits: [
      // Ayni blok (A Blok), 2. uye - once FARKLI degerlerle basliyor.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", buildingStyle: "ESKI-DEGER", mainPropertyDescription: "ESKI-ACIKLAMA" }, tables: {} },
      // FARKLI blok (B Blok) - senkrondan ETKILENMEMELI.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", buildingStyle: "B-BLOK-DEGERI", mainPropertyDescription: "B Blok'un KENDI aciklamasi." }, tables: {} },
    ],
  }));

  fns.syncBuildingSharedDataToBlockSiblings();
  const state = fns.getState();

  // Ayni bloktaki 2. uye (titleUnits[0], global index 1): ortak alanlar KOPYALANMALI.
  assert.equal(state.titleUnits[0].fields.buildingStyle, "Betonarme", "Ayni bloktaki 2. uyeye buildingStyle kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.buildingAge, "10 yıl", "Ayni bloktaki 2. uyeye buildingAge kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.socialFacilities, "Yüzme Havuzu", "Ayni bloktaki 2. uyeye socialFacilities kopyalanmali.");
  assert.equal(
    state.titleUnits[0].fields.mainPropertyDescription,
    "A Blok'un ana gayrimenkul açıklaması metni.",
    "KULLANICI TALEBI: aktif tasinmazda uretilen/duzenlenen Ana Gayrimenkul Aciklamasi AYNI bloktaki digerlerine otomatik yansimali."
  );
  assert.deepEqual(state.titleUnits[0].tables.buildingFloors, [{ floorName: "Zemin", residential: "2" }], "Ayni bloktaki 2. uyeye buildingFloors tablosu kopyalanmali.");

  // FARKLI bloktaki (B Blok) uye HIC etkilenmemeli - kendi aciklamasi kalir.
  assert.equal(state.titleUnits[1].fields.buildingStyle, "B-BLOK-DEGERI", "FARKLI bloktaki uye senkrondan ETKILENMEMELI.");
  assert.equal(state.titleUnits[1].fields.mainPropertyDescription, "B Blok'un KENDI aciklamasi.", "FARKLI bloktaki uyenin KENDI Ana Gayrimenkul Aciklamasi degismemeli (kac blok varsa o kadar bagimsiz aciklama).");

  console.log("syncBuildingSharedDataToBlockSiblings ortak alan + mainPropertyDescription kopyalama + farkli blok izolasyonu testi tamam.");
}

// --- 5) syncBuildingSharedDataToBlockSiblings(): gate kapaliyken no-op ----
{
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", buildingStyle: "Betonarme" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", buildingStyle: "DEGISMEMELI" }, tables: {} }],
  }));
  fns.syncBuildingSharedDataToBlockSiblings();
  const state = fns.getState();
  assert.equal(state.titleUnits[0].fields.buildingStyle, "DEGISMEMELI", "isBuildingBlockGroupingActive false iken (Tekli Talep) senkron no-op olmali.");
  console.log("syncBuildingSharedDataToBlockSiblings gate kapaliyken no-op testi tamam.");
}

// --- 6) renderSection() gate'i kaynak-duzeyinde dogru kosulla kablolu -----
{
  assert.match(
    appSource,
    /if \(section\.id === "building" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep" && isBuildingBlockGroupingActive\(\)\) \{\s*\n\s*body\.append\(createBuildingBlockTabBar\(\)\);/,
    "renderSection() 'building' icin isBuildingBlockGroupingActive() kosuluyla createBuildingBlockTabBar()'i eklemiyor."
  );
  console.log("renderSection building blok-tab gate kaynak-duzeyi kablolama testi tamam.");
}

console.log("Ana Gayrimenkul Ozellikleri blok bazli paylasim/tab yapisi testleri basarili.");
