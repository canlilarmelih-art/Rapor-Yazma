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
  // 2026-08-27 kullanici bulgusu: "ana gayrimenkul blok bazinda ancak
  // ayni bloktaki diger bagimsiz bolumlerde bos geliyor" - senkron artik
  // isBuildingBlockGroupingActive() DEGIL, bu YENI (daha gevsek: "2+
  // FARKLI blok" sarti YOK) gate'i kullaniyor.
  "isBuildingBlockSharingApplicable",
  "resolveTitleUnitWriteTarget",
  "resolveTitleUnitBuildingFloorsRowsWriteTarget",
  "getBuildingSectionFieldKeys",
  "getBuildingBlockSharedFieldKeys",
  "syncBuildingSharedDataToBlockSiblings",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  // "Tum Bloklara Uygula" -> "Secili Bloklara Uygula" (2026-08-27).
  "applyBuildingDataToSelectedBlocks",
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
    isBuildingBlockGroupingActive, isBuildingBlockSharingApplicable, isCondominiumOwnershipTypeValue,
    syncBuildingSharedDataToBlockSiblings,
    buildAllTitleUnitsForSummaryTable,
    getBuildingSectionFieldKeys, getBuildingBlockSharedFieldKeys,
    applyBuildingDataToSelectedBlocks,
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

// --- 3f) isBuildingBlockSharingApplicable(): isBuildingBlockGroupingActive()'ten
// TEK FARKI - "2+ FARKLI blok" sarti YOK (2026-08-27, kullanici bulgusu:
// "ana gayrimenkul blok bazinda ancak ayni bloktaki diger bagimsiz
// bolumlerde bos geliyor. hepsi bir olmali").
{
  // AYNI blok (2+ tasinmaz) -> isBuildingBlockGroupingActive() FALSE ama
  // isBuildingBlockSharingApplicable() TRUE olmali (senkron CALISMALI).
  fns.setState(freshState({
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "AYNI blokta isBuildingBlockGroupingActive() hala false olmali (blok TAB CUBUGU icin anlamli degil).");
  assert.equal(fns.isBuildingBlockSharingApplicable(), true, "AYNI blokta isBuildingBlockSharingApplicable() TRUE olmali - senkron CALISMALI.");

  // Musteakil Bina/Tekli Talep/tekil tasinmaz - HER IKI gate icin de false
  // (bu 3 sart ORTAK, degismedi).
  fns.setState(freshState({
    fields: { requestType: "Çoklu Talep", ownershipType: "Müstakil Bina", blockNo: "100", parcelNo: "1", titleBlockName: "" },
    titleUnits: [{ fields: { blockNo: "200", parcelNo: "9", titleBlockName: "" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockSharingApplicable(), false, "Musteakil Bina raporunda isBuildingBlockSharingApplicable() de false olmali.");

  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" }, tables: {} }],
  }));
  assert.equal(fns.isBuildingBlockSharingApplicable(), false, "Tekli Talep'te isBuildingBlockSharingApplicable() de false olmali.");

  fns.setState(freshState({ titleUnits: [] }));
  assert.equal(fns.isBuildingBlockSharingApplicable(), false, "Tekil tasinmazli raporda isBuildingBlockSharingApplicable() de false olmali.");

  console.log("isBuildingBlockSharingApplicable (2+ FARKLI blok sarti OLMADAN) gate kosullari testi tamam.");
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

// --- 4b) KULLANICI BULGUSU (2026-08-27, "YUNUSELİ 4 ADET MESKEN" ekran ----
// goruntusu): TEK blokta (rapordaki TUM bagimsiz bolumler AYNI tek
// blokta - en yaygin senaryo, sıradan bir apartman) senkron artik
// CALISMALI - eskiden (isBuildingBlockGroupingActive'in "2+ FARKLI blok"
// sarti yuzunden) TAMAMEN no-op'tu.
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "11652", parcelNo: "1", titleBlockName: "A",
      buildingClass: "3/B", buildingAge: "3 yıl", elevator: "1 Adet Asansör",
    },
    tables: {},
    titleUnits: [
      // AYNI (TEK) blok - 2., 3., 4. bagimsiz bolumler, HEPSI bos basliyor
      // (kullanicinin bildirdigi GERCEK senaryo: her tab kendi bos golge
      // kopyasini gosteriyordu).
      { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" }, tables: {} },
      { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" }, tables: {} },
      { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" }, tables: {} },
    ],
  }));
  // Baska HICBIR blok yok - computeDocumentsBlockGroups tek bir grup doner.
  assert.equal(fns.computeDocumentsBlockGroups(fns.buildAllTitleUnitsForSummaryTable()).length, 1, "Fixture: tum tasinmazlar TEK blokta olmali.");
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "TEK blokta isBuildingBlockGroupingActive() false (beklenen, DEGISMEDI).");

  fns.syncBuildingSharedDataToBlockSiblings();
  const state = fns.getState();
  [0, 1, 2].forEach((index) => {
    assert.equal(state.titleUnits[index].fields.buildingClass, "3/B", `TEK bloktaki ${index + 2}. bagimsiz boluma buildingClass artik kopyalanmali (eskiden bos kalirdi).`);
    assert.equal(state.titleUnits[index].fields.buildingAge, "3 yıl", `TEK bloktaki ${index + 2}. bagimsiz boluma buildingAge artik kopyalanmali.`);
    assert.equal(state.titleUnits[index].fields.elevator, "1 Adet Asansör", `TEK bloktaki ${index + 2}. bagimsiz boluma elevator artik kopyalanmali.`);
  });
  console.log("KULLANICI BULGUSU: TEK blokta (2+ bagimsiz bolum) syncBuildingSharedDataToBlockSiblings artik CALISIR testi tamam.");
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
  assert.match(
    appSource,
    /function createBuildingBlockTabBar\(\)[\s\S]*?outerTabs\.append\(applySelectedBlocksButton\);[\s\S]*?wrap\.append\(outerTabs\);/,
    "Secili bloklara uygula butonu blok sekmelerinin bulundugu satira eklenmelidir."
  );
  assert.doesNotMatch(
    appSource,
    /function createBuildingTechnicalOptionsPanel\(\)[\s\S]*?building-apply-selected-blocks-button/,
    "Secili bloklara uygula butonu teknik bilgiler basliginda yinelenmemelidir."
  );
  assert.match(
    appSource,
    /applySelectedBlocksButton\.addEventListener\("click", \(\) => \{\s*\n\s*openBuildingCopyToSelectedBlocksModal\(\);/,
    "Secili bloklara uygula butonu openBuildingCopyToSelectedBlocksModal()'u acmali (2026-08-27, KOSULSUZ 'tum bloklara uygula' yerine)."
  );
  console.log("renderSection building blok-tab gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 7) Kullanici talebi (2026-08-21): "yapi yasi yapim yili ve yapi ------
// yipranma payi blok bazinda olusturulmasi gerekiyor" - bu 5 alan
// (buildingConstructionYear/buildingCompletionDate/buildingCompletionExplanation/
// buildingDepreciationType/buildingDepreciationRate) artik
// getBuildingSectionFieldKeys()'te VE syncBuildingSharedDataToBlockSiblings()'in
// kopyaladigi alanlar arasinda.
{
  const keys = fns.getBuildingSectionFieldKeys();
  ["buildingConstructionYear", "buildingCompletionDate", "buildingCompletionExplanation",
    "buildingDepreciationType", "buildingDepreciationRate"].forEach((key) => {
    assert.ok(keys.includes(key), `"${key}" getBuildingSectionFieldKeys()'te OLMALI (blok bazli paylasim icin).`);
  });

  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      buildingConstructionYear: "2015", buildingCompletionDate: "01.01.2015",
      buildingCompletionExplanation: "A Blok icin yapi bitis tarihi aciklamasi.",
      buildingDepreciationType: "Betonarme", buildingDepreciationRate: "%10",
    },
    tables: {},
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", buildingConstructionYear: "ESKI-YIL", buildingDepreciationRate: "ESKI-ORAN" }, tables: {} },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", buildingConstructionYear: "B-BLOK-YILI", buildingDepreciationRate: "B-BLOK-ORANI" }, tables: {} },
    ],
  }));
  fns.syncBuildingSharedDataToBlockSiblings();
  const state = fns.getState();
  assert.equal(state.titleUnits[0].fields.buildingConstructionYear, "2015", "Ayni bloktaki uyeye buildingConstructionYear (Yapim Yili) kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.buildingCompletionDate, "01.01.2015", "Ayni bloktaki uyeye buildingCompletionDate kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.buildingCompletionExplanation, "A Blok icin yapi bitis tarihi aciklamasi.", "Ayni bloktaki uyeye buildingCompletionExplanation kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.buildingDepreciationType, "Betonarme", "Ayni bloktaki uyeye buildingDepreciationType kopyalanmali.");
  assert.equal(state.titleUnits[0].fields.buildingDepreciationRate, "%10", "Ayni bloktaki uyeye buildingDepreciationRate (Yipranma Payi) kopyalanmali.");
  assert.equal(state.titleUnits[1].fields.buildingConstructionYear, "B-BLOK-YILI", "FARKLI bloktaki uye senkrondan ETKILENMEMELI.");
  assert.equal(state.titleUnits[1].fields.buildingDepreciationRate, "B-BLOK-ORANI", "FARKLI bloktaki uyenin KENDI yipranma orani degismemeli.");
  console.log("Yapi Yasi/Yapim Yili/Yapi Yipranma Payi blok bazli paylasim testi tamam.");
}

// --- 8) refreshBuildingDepreciationFromCurrentFields()'a KOSULSUZ bir -----
// syncBuildingSharedDataToBlockSiblings() cagrisi EKLENMEDIGI kaynak-duzeyinde
// dogrulanir (bilinclii tasarim karari - render-tetiklemeli asiri-senkron
// riskini onlemek icin, bkz. fonksiyonun kendi ic yorumu). Bunun yerine
// sync, YALNIZCA gercek degisiklik noktalarinda (commitBuildingAgeOverride,
// genel form hub'inin buildingAge/buildingCompletionDate/buildingStyle
// dallari, refreshBuildingCompletionFromCurrentFields'in belge-bulundu
// dali) cagrilir.
{
  const fnStart = appSource.indexOf("\nfunction refreshBuildingDepreciationFromCurrentFields(");
  assert(fnStart >= 0, "refreshBuildingDepreciationFromCurrentFields bulunamadi.");
  const bodyEnd = appSource.indexOf("\nfunction createBuildingDepreciationRatePanel(", fnStart);
  assert(bodyEnd >= 0, "createBuildingDepreciationRatePanel bulunamadi (fonksiyon siniri).");
  const body = appSource.slice(fnStart, bodyEnd);
  assert.doesNotMatch(
    body,
    /\n\s*syncBuildingSharedDataToBlockSiblings\(\);\s*\n\}/,
    "refreshBuildingDepreciationFromCurrentFields() KOSULSUZ senkron cagirmamali (render-tetiklemeli asiri-senkron riski)."
  );
  console.log("refreshBuildingDepreciationFromCurrentFields kosulsuz-senkron-yok kaynak-duzeyi regresyon testi tamam.");

  assert.match(
    appSource,
    /if \(result\.isoDate\) syncBuildingSharedDataToBlockSiblings\(\);\s*\n\}/,
    "refreshBuildingCompletionFromCurrentFields() belge tarihi bulundugunda (result.isoDate) senkron cagirmiyor."
  );
  console.log("refreshBuildingCompletionFromCurrentFields guardli senkron kaynak-duzeyi kablolama testi tamam.");
}

// --- 9) applyBuildingDataToSelectedBlocks() (2026-08-27): "ana ---------
// gayrimenkuldeki tum bloklara uygula butonunu secili bloklara uygula
// seklinde yapalim" - eskiden KOSULSUZ tum diger bloklara uygulayan
// applyBuildingDataToAllBlocks() yerine, cagiranin verdigi grup
// anahtarlariyla (computeDocumentsBlockGroups().key) SINIRLI bir alt
// kumeye uygular.
{
  const threeBlockState = () => freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      buildingStyle: "Betonarme", mainPropertyDescription: "A Blok aciklamasi.",
    },
    tables: { buildingFloors: [{ floorName: "Zemin", residential: "2" }] },
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", buildingStyle: "ESKI-B" }, tables: {} },
      // C Blok 2 bagimsiz bolumden olusuyor - ikisi de guncellenmeli.
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok", buildingStyle: "ESKI-C-1" }, tables: {} },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok", buildingStyle: "ESKI-C-2" }, tables: {} },
    ],
  });

  // 9a) Yalnizca C Blok secilirse: B Blok ETKILENMEMELI, C Blok'un HER
  // İKİ uyesi de guncellenmeli.
  fns.setState(threeBlockState());
  const groupsForKey = fns.computeDocumentsBlockGroups(fns.buildAllTitleUnitsForSummaryTable());
  const cBlokKey = groupsForKey.find((group) => group.fields.titleBlockName === "C Blok").key;
  const appliedCount = fns.applyBuildingDataToSelectedBlocks([cBlokKey]);
  assert.equal(appliedCount, 1, "Yalnizca 1 blok (C Blok) secildiginden 1 donmeli.");
  let state = fns.getState();
  assert.equal(state.titleUnits[0].fields.buildingStyle, "ESKI-B", "Secilmeyen B Blok ETKILENMEMELI.");
  assert.equal(state.titleUnits[1].fields.buildingStyle, "Betonarme", "C Blok'un 1. uyesine kopyalanmali.");
  assert.equal(state.titleUnits[2].fields.buildingStyle, "Betonarme", "C Blok'un 2. uyesine de kopyalanmali (blok icindeki TUM uyeler).");
  assert.deepEqual(state.titleUnits[1].tables.buildingFloors, [{ floorName: "Zemin", residential: "2" }], "buildingFloors tablosu da kopyalanmali.");

  // 9b) Bos/undefined/gecersiz anahtar -> 0, hicbir sey degismez.
  fns.setState(threeBlockState());
  assert.equal(fns.applyBuildingDataToSelectedBlocks([]), 0, "Bos dizi -> 0.");
  assert.equal(fns.applyBuildingDataToSelectedBlocks(undefined), 0, "undefined -> 0.");
  assert.equal(fns.applyBuildingDataToSelectedBlocks(["olmayan-anahtar"]), 0, "Gecersiz anahtar -> 0.");
  state = fns.getState();
  assert.equal(state.titleUnits[0].fields.buildingStyle, "ESKI-B", "Gecersiz/bos secimde HICBIR blok etkilenmemeli.");

  // 9c) Aktif/kaynak blogun kendi anahtari YANLISLIKLA secilse bile
  // sayilmaz/etkilenmez (kaynaga kendine kopyalama yok).
  fns.setState(threeBlockState());
  const aBlokKey = groupsForKey.find((group) => group.fields.titleBlockName === "A Blok").key;
  const bBlokKey = groupsForKey.find((group) => group.fields.titleBlockName === "B Blok").key;
  const mixedCount = fns.applyBuildingDataToSelectedBlocks([aBlokKey, bBlokKey]);
  assert.equal(mixedCount, 1, "Aktif blogun (A) anahtari sayilmamali, yalnizca gercek hedef (B) sayilmali.");
  state = fns.getState();
  assert.equal(state.titleUnits[0].fields.buildingStyle, "Betonarme", "B Blok'a yine de dogru uygulanmali.");

  // 9d) Gate kapaliyken (Tekli Talep) -> 0.
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", buildingStyle: "Betonarme" },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", buildingStyle: "DEGISMEMELI" }, tables: {} }],
  }));
  assert.equal(fns.applyBuildingDataToSelectedBlocks(["100|1|B Blok"]), 0, "isBuildingBlockGroupingActive false iken 0 donmeli.");
  assert.equal(fns.getState().titleUnits[0].fields.buildingStyle, "DEGISMEMELI", "Gate kapaliyken hicbir sey degismemeli.");

  console.log("applyBuildingDataToSelectedBlocks() secili-blok-alt-kumesi testi tamam.");
}

console.log("Ana Gayrimenkul Ozellikleri blok bazli paylasim/tab yapisi testleri basarili.");
