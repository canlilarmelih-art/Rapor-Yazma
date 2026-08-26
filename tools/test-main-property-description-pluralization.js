"use strict";

// Ana Gayrimenkul Açıklaması (mainPropertyDescription) — aynı bloktaki
// çoklu bağımsız bölüm için çoğullama (2026-08-27). Kullanıcı talebi:
// "ana gayrimenkul açıklamasını çokluya göre düzenle" — netleştirme:
// "aynı blokta birden fazla bağımsız bölüm var, cümle tekil kalıyor."
//
// Bu bölüm EKB/Proje İnceleme'nin aksine ZATEN kendi blok-paylaşım
// sistemine sahip (isBuildingBlockGroupingActive/syncBuildingSharedDataToBlockSiblings,
// bkz. tools/test-building-block-shared-sync.js) — HER blok kendi
// BAĞIMSIZ paragrafını taşır. Eksik olan yalnızca KELİME DÜZEYİNDE
// çoğullamaydı: bir bloğun kendi paragrafı, o blokta 2+ bağımsız bölüm
// olduğunda hâlâ "taşınmazın yer aldığı"/"gayrimenkulün bulunduğu" gibi
// TEKİL yazılıyordu.
//
// Bu test kapsamı:
//  1) getMainPropertyDescriptionUnitCount(): blok gruplama kapalıyken
//     TÜM taşınmaz sayısı, açıkken AKTİF taşınmazın KENDİ blok grubunun
//     üye sayısı.
//  2) pluralizeMainPropertyDescriptionText(): hedefli "X yer aldığı/
//     bulunduğu/konumlandığı" çoğullaması + KAPSAM DIŞI bırakılan çıplak
//     "Ana taşınmaz"/"her bir bağımsız bölüm"/"{N} adet bağımsız bölüm"
//     ifadelerinin DEĞİŞMEDEN kalması.
//  3) buildMainPropertyDescription(): tekil rapor regresyonu (normal +
//     yatay kat irtifakı dalı), Çoklu Talep + TEK blok (kullanıcının TAM
//     senaryosu) çoğullaması, 2+ FARKLI blok + aktif bloğun KENDİ üye
//     sayısına göre (diğer bloktan bağımsız) doğru karar, usePlaceholderTokens
//     ile çoğullamanın devre dışı kalması.

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
  // Çoklu-taşınmaz/blok altyapısı - test-building-block-shared-sync.js
  // ile AYNI temel liste.
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
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "resolveTitleUnitWriteTarget",
  "isBuildingBlockGroupingActive",
  // Bu testin ASIL odağı - yeni fonksiyonlar.
  "getMainPropertyDescriptionUnitCount",
  "pluralizeMainPropertyDescriptionText",
  "buildMainPropertyValues",
  "buildMainPropertyDescription",
  // 2+ FARKLI blok konsolidasyonu (0.0.574) - yeni fonksiyonlar.
  "formatMainPropertyBlockLabel",
  "formatMainPropertyBlockListPhrase",
  "groupMainPropertyBlocksByText",
  "getMainPropertyBlockEntries",
  "buildConsolidatedMainPropertyOpeningParagraph",
  "buildConsolidatedMainPropertyProjectParagraph",
  "buildConsolidatedMainPropertyFloorParagraphs",
  "buildConsolidatedMainPropertyPhysicalSentence",
  "buildConsolidatedMainPropertyElevatorSentence",
  "buildConsolidatedMainPropertyAmenityParagraph",
  "buildConsolidatedMainPropertyDescription",
  "normalizeBlockLabelPrefixForAttribution",
  "getTurkishDistributiveNumberSuffix",
  // buildMainPropertyDescription()'ın gerçek yardımcıları.
  "buildHorizontalMainPropertyDescription",
  "buildMainPropertyOpeningSentence",
  "buildMainPropertyBlockPositionSentence",
  "buildMainPropertyProjectSentence",
  "buildMainPropertyFloorSentence",
  "buildMainPropertyEntranceSentence",
  "buildMainPropertyPhysicalSentence",
  "buildMainPropertyAmenitySentence",
  "buildBuildingCarparkElevatorSentences",
  "getMainPropertyStructureContext",
  "shouldMentionMainPropertyOwnership",
  "readMainPropertyField",
  "buildHorizontalMainPropertySiteSentence",
  "buildHorizontalMainPropertyFloorSentence",
  "buildHorizontalMainPropertyAmenitySentence",
  "detectHorizontalBlockUsePhrase",
  "formatBuildingEntranceLevelPhrase",
  "buildBuildingEntranceDoorSentence",
  // Genel metin yardımcıları (gerçek, basit/kendi kendine yeten).
  "toLowerText",
  "formatTurkishList",
  "capitalizeTurkishSentence",
  "joinNonEmptySentences",
  "cleanComparablePunctuation",
  "normalizeYesNoChoice",
  "parseBuildingFloorCount",
];

// mainPropertyOpeningVariants/vb. `const X = [...]` cümle-varyant
// dizileri (fonksiyon DEĞİL) - sliceFunction bunları bulamaz, ayrı bir
// dilim alınır. NOT: test-multi-environment-subject.js'teki sabit "\n];"
// arama tekniği BURADA GÜVENLİ DEĞİL — bazı diziler (ör.
// mainPropertyPhysicalTailVariants) TEK SATIRDA tanımlı olduğundan "\n];"
// ARANAN dizinin kendi kapanışını DEĞİL, dosyada ÇOK DAHA SONRAKİ bir
// dizinin kapanışını bulup DEV bir aşırı-yakalama üretiyordu (2 farklı
// dizi TEK sonuçta birleşip "already declared" hatası verdi) — bunun
// yerine köşeli parantez DERİNLİĞİ sayılarak GERÇEK eşleşen "]" bulunur
// (extractFunction'ın süslü parantez sayma tekniğiyle AYNI ilke).
function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Sabit dizi bulunamadı: ${name}`);
  const bracketStart = appSource.indexOf("[", start);
  let depth = 0;
  let index = bracketStart;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  assert(depth === 0, `Sabit dizi kapanmadı: ${name}`);
  const semicolonIndex = appSource.indexOf(";", index);
  return appSource.slice(start, semicolonIndex + 1);
}

const constArrayNames = [
  "mainPropertyOpeningVariants",
  "mainPropertyProjectOkVariants",
  "mainPropertyProjectMismatchVariants",
  "mainPropertyFloorVariants",
  "mainPropertyBlockPositionKnownVariants",
  "mainPropertyBlockPositionUnknownVariants",
  "mainPropertyPhysicalTailVariants",
  "elevatorHasVariants",
  "elevatorNoVariants",
  "elevatorPendingVariants",
  "carparkHasVariants",
  "carparkNoVariants",
  "heatingVariants",
  "horizontalSiteVariants",
  "horizontalFloorVariants",
  "horizontalCarparkHasVariants",
  "horizontalCarparkNoVariants",
  "horizontalSocialVariants",
];

// Kat/alan kompozisyonu bu testin kapsamı DEĞİL (ayrı testlerde kapsanan
// state.tables.buildingFloors mantığı) - hafif stub'larla değiştirilir,
// diğer test dosyalarındaki AYNI "kapsam dışı ağır bağımlılık" ilkesi
// (bkz. test-ekb-explanation-block-attribution.js).
const sandboxSource = `
  let state = {};
  let sections = [{ id: "building", fields: [] }];
  function normalizeReportTitleText(value) { return String(value || "").trim(); }
  function normalizeReportDescriptionText(value) { return String(value || "").replace(/\\s+/g, " ").trim(); }
  function updateBuildingFloorTotals() {}
  // Gercek buildMainPropertyFloorComposition/buildBuildingFloorMacroSummary
  // state.tables.buildingFloors uzerinden karmasik bir hesaplama yapiyor
  // (bu testin kapsami DEGIL) - bunun yerine dogrudan kontrol edilebilen
  // test-ozel alanlar (state.fields.testFloorComposition/testFloorSummary)
  // okunur, boylece FARKLI bloklar icin FARKLI kat metinleri kurulabilir.
  function buildMainPropertyFloorComposition() { return state.fields.testFloorComposition || ""; }
  function buildBuildingFloorMacroSummary() { return state.fields.testFloorSummary || ""; }
  function selectVariant() { return 0; }
  function registerVariantGroup() {}
  // app.js'te joinTurkishList AYNI ad altinda BIRDEN FAZLA kez tanimli
  // (script-seviyesi fonksiyon bildirimi, SONUNCUSU kazanir - o da
  // KML'e ozgu cleanupPlaceName'e bagimli) - diger test dosyalarindaki
  // AYNI emsal (bkz. test-documents-block-description.js) ile elle
  // yazilmis, basit/beklenen davranisi yansitan bir kopya kullanilir.
  function joinTurkishList(items = []) {
    const clean = (items || []).filter(Boolean);
    if (clean.length <= 1) return clean[0] || "";
    if (clean.length === 2) return \`\${clean[0]} ve \${clean[1]}\`;
    return \`\${clean.slice(0, -1).join(", ")} ve \${clean[clean.length - 1]}\`;
  }
  // getTurkishDistributiveNumberSuffix()'in kapatma bağımlılığı - app.js'teki
  // gerçek tanımla BİREBİR (bkz. buildProjectReviewConsolidatedSentences'ın
  // hemen üstü, test-project-review-block-pluralization.js'teki AYNI emsal).
  const TURKISH_ONES_DISTRIBUTIVE_SUFFIX = { 1: "er", 2: "şer", 3: "er", 4: "er", 5: "er", 6: "şar", 7: "şer", 8: "er", 9: "ar" };
  const TURKISH_TENS_DISTRIBUTIVE_SUFFIX = { 10: "ar", 20: "şer", 30: "ar", 40: "ar", 50: "şer", 60: "ar", 70: "er", 80: "er", 90: "ar" };
  ${constArrayNames.map(extractConstArray).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getMainPropertyDescriptionUnitCount,
    pluralizeMainPropertyDescriptionText,
    buildMainPropertyDescription,
    isBuildingBlockGroupingActive,
    formatMainPropertyBlockListPhrase,
    groupMainPropertyBlocksByText,
    buildConsolidatedMainPropertyElevatorSentence,
    getTurkishDistributiveNumberSuffix,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(blockNo, parcelNo, titleBlockName, overrides = {}) {
  return { fields: { blockNo, parcelNo, titleBlockName, ...overrides }, tables: {} };
}

function freshState(overrides = {}) {
  return {
    fields: {
      requestType: "Çoklu Talep",
      ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100",
      parcelNo: "1",
      titleBlockName: "A Blok",
      buildingStyle: "Betonarme",
    },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    ...overrides,
  };
}

// --- 1) getMainPropertyDescriptionUnitCount() ------------------------------
{
  // 1a) Tekil rapor -> 1.
  fns.setState(freshState({ requestType: "Tekli Talep", titleUnits: [] }));
  assert.equal(fns.getMainPropertyDescriptionUnitCount(), 1, "Tekil raporda 1 donmeli.");

  // 1b) Coklu Talep, TEK blok (isBuildingBlockGroupingActive FALSE) -> TUM taşınmaz sayisi.
  fns.setState(freshState({
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }),
      unit("100", "1", "A Blok", { unitNo: "3" }),
    ],
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), false, "sanity: TEK blokta blok gruplama AKTIF OLMAMALI.");
  assert.equal(fns.getMainPropertyDescriptionUnitCount(), 3, "Blok gruplama kapaliyken TUM tasinmaz sayisi (3) donmeli.");

  // 1c) Coklu Talep, 2+ FARKLI blok -> AKTIF tasinmazin KENDI blok grubunun
  // uye sayisi. NOT: state.fields HER ZAMAN aktif taşınmazın kendi
  // alanlarini tutar (getTitleUnitFieldsForLabel'in gercek davranisi -
  // bkz. app.js:2665) - bu yuzden "hangi blok aktif" senaryolari icin
  // activeTitleUnitIndex'i TEK bir state uzerinde mutasyona ugratmak
  // YERINE, iki AYRI/kendi icinde tutarli state kurulur (switchActiveTitleUnit()'in
  // yaptigi "eski aktifi golgeye tasi" adimini simule etmeye GEREK
  // KALMADAN).
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", unitNo: "1", buildingStyle: "Betonarme",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }), // index 1, AYNI blok (A) - aktifle birlikte 2 uyeli
      unit("100", "1", "B Blok", { unitNo: "5" }), // index 2, FARKLI blok (B), tek basina
    ],
    activeTitleUnitIndex: 0, // aktif = A Blok'un kendisi
  }));
  assert.equal(fns.isBuildingBlockGroupingActive(), true, "sanity: 2 FARKLI blok -> blok gruplama AKTIF olmali.");
  assert.equal(fns.getMainPropertyDescriptionUnitCount(), 2, "A Blok (aktif) 2 uyeli oldugundan 2 donmeli.");

  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", unitNo: "5", buildingStyle: "Betonarme",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "1" }),
      unit("100", "1", "A Blok", { unitNo: "2" }),
    ],
    activeTitleUnitIndex: 0, // aktif = B Blok'un kendisi
  }));
  assert.equal(fns.getMainPropertyDescriptionUnitCount(), 1, "B Blok (aktif) TEK uyeli oldugundan 1 donmeli - A Blok'un buyuklugu ETKİLEMEMELİ.");

  console.log("getMainPropertyDescriptionUnitCount() testi tamam.");
}

// --- 2) pluralizeMainPropertyDescriptionText(): hedefli cogullama + -------
// KAPSAM DISI ifadelerin DEGISMEDEN kalmasi.
{
  assert.equal(fns.pluralizeMainPropertyDescriptionText("", true), "", "Bos metin bos donmeli.");
  assert.equal(fns.pluralizeMainPropertyDescriptionText("Merhaba", false), "Merhaba", "enablePlural=false iken metin DEGISMEMELI.");

  const text = "Ekspertize konu taşınmazın yer aldığı bina inşa edilmiştir. Değerlemeye konu gayrimenkulün bulunduğu blok, parselin kuzey cephesinde yer almaktadır. Taşınmazın konumlandığı bina dahilinde asansör mevcuttur. Değerlemeye konu bağımsız bölümün yer aldığı ana taşınmaz, site niteliğindedir. Değerlemeye konu bağımsız bölümün bulunduğu ana taşınmaz, site niteliği taşımaktadır.";
  const plural = fns.pluralizeMainPropertyDescriptionText(text, true);
  assert.ok(plural.includes("taşınmazların yer aldığı"), `'taşınmazın yer aldığı' cogullanmali, bulunan: ${plural}`);
  assert.ok(plural.includes("gayrimenkullerin bulunduğu"), `'gayrimenkulün bulunduğu' cogullanmali, bulunan: ${plural}`);
  assert.ok(plural.includes("Taşınmazların konumlandığı"), `'Taşınmazın konumlandığı' (buyuk harf) cogullanmali, bulunan: ${plural}`);
  assert.ok(plural.includes("bağımsız bölümlerin yer aldığı"), `'bağımsız bölümün yer aldığı' cogullanmali, bulunan: ${plural}`);
  assert.ok(plural.includes("bağımsız bölümlerin bulunduğu"), `'bağımsız bölümün bulunduğu' cogullanmali, bulunan: ${plural}`);

  // KAPSAM DISI - degismemeli.
  const guardText = "Ana taşınmaz zemin ve 3 normal kat olmak üzere toplam 4 katlı olarak inşa edilmiştir. ana taşınmazın incelenen mimari projesi ile mahallinde yapılan incelemelere göre uyumlu olduğu değerlendirilmiştir. Parsel üzerinde blok bulunmakta olup, her bir bağımsız bölüm site bütünlüğü içerisinde müstakil kullanım alanına sahiptir. Site genelinde toplam 12 adet bağımsız bölüm bulunmaktadır.";
  const guardResult = fns.pluralizeMainPropertyDescriptionText(guardText, true);
  assert.equal(guardResult, guardText, `KAPSAM DISI ifadeler (Ana tasinmaz/proje/her bir bagimsiz bolum/adet bagimsiz bolum) DEGISMEMELI, bulunan: ${guardResult}`);

  console.log("pluralizeMainPropertyDescriptionText() hedefli cogullama + kapsam-disi korunma testi tamam.");
}

// --- 3) buildMainPropertyDescription(): tekil rapor REGRESYONU -----------
{
  fns.setState(freshState({ requestType: "Tekli Talep", titleUnits: [] }));
  const singular = fns.buildMainPropertyDescription();
  assert.ok(singular.includes("taşınmazın yer aldığı") || singular.includes("gayrimenkulün bulunduğu"), `Tekil raporda ESKI tekil ifade degismemeli, bulunan: ${singular}`);
  assert.ok(!singular.includes("taşınmazların yer aldığı") && !singular.includes("gayrimenkullerin bulunduğu"), `Tekil raporda coğullama OLMAMALI, bulunan: ${singular}`);
  console.log("buildMainPropertyDescription() tekil rapor regresyon testi tamam.");
}

// --- 4) Kullanicinin TAM senaryosu: Coklu Talep + TEK blok (2+ bagimsiz --
// bolum, blok gruplama KAPALI) -> normal (dikey) dal COGUL olmali.
{
  fns.setState(freshState({
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }),
      unit("100", "1", "A Blok", { unitNo: "3" }),
    ],
  }));
  const plural = fns.buildMainPropertyDescription();
  assert.ok(
    plural.includes("taşınmazların yer aldığı") || plural.includes("gayrimenkullerin bulunduğu"),
    `TEK blokta 2+ bagimsiz bolum varken cumle COGUL olmali, bulunan: ${plural}`
  );
  console.log("buildMainPropertyDescription() Coklu Talep + TEK blok -> cogullama (KULLANICI SENARYOSU) testi tamam.");
}

// --- 5) Ayni senaryo, YATAY kat irtifaki (site) dali -----------------------
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep",
      ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100",
      parcelNo: "1",
      titleBlockName: "A Blok",
      buildingBlockCount: "3",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }),
      unit("100", "1", "A Blok", { unitNo: "3" }),
    ],
  }));
  const pluralHorizontal = fns.buildMainPropertyDescription();
  assert.ok(pluralHorizontal.includes("bağımsız bölümlerin"), `Yatay kat irtifaki dalinda 'bağımsız bölümün' -> 'bağımsız bölümlerin' cogullanmali, bulunan: ${pluralHorizontal}`);
  // KAPSAM DISI korunmalari - kritik regresyon guard'i.
  assert.ok(pluralHorizontal.includes("her bir bağımsız bölüm") , `'her bir bağımsız bölüm' idiomu DEGISMEMELI, bulunan: ${pluralHorizontal}`);
  assert.ok(!/her bir bağımsız bölümler\b/.test(pluralHorizontal), `'her bir bağımsız bölüm' YANLISLIKLA cogullanmamali, bulunan: ${pluralHorizontal}`);
  console.log("buildMainPropertyDescription() Coklu Talep + TEK blok, YATAY kat irtifaki dali testi tamam.");
}

// --- 6) 2+ FARKLI blok: ARTIK TEK KONSOLİDE metin (0.0.574, kullanıcı ----
// talebi + AskUserQuestion netleştirmesi: "hangi blok sekmesinde olursam
// olayım AYNI metni görmek istiyorum") — HANGİ blok aktif olursa olsun
// AYNI (TÜM blokları kapsayan) metin dönmeli. Bu, ESKİ (0.0.573'e kadar
// geçerli, "her blok kendi üye sayısına göre bağımsız karar verir")
// davranışın YERİNE geçti — bkz. tools/test-main-property-description-pluralization.js
// senaryo 8-13'teki DETAYLI konsolidasyon testleri.
{
  const buildState = (activeBlockLabel, activeUnitNo) => freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: activeBlockLabel, unitNo: activeUnitNo, buildingStyle: "Betonarme",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "1" }),
      unit("100", "1", "B Blok", { unitNo: "5" }),
    ],
    activeTitleUnitIndex: 0,
  });

  fns.setState(buildState("A Blok", "1"));
  const aBlockText = fns.buildMainPropertyDescription();
  fns.setState(buildState("B Blok", "5"));
  const bBlockText = fns.buildMainPropertyDescription();

  assert.equal(aBlockText, bBlockText, "HANGİ blok aktif olursa olsun AYNI konsolide metin dönmeli.");
  assert.ok(aBlockText.includes("taşınmazların yer aldığı"), `Konsolide metin COĞUL olmali, bulunan: ${aBlockText}`);
  console.log("buildMainPropertyDescription() 2+ FARKLI blok - HANGİ blok aktif olursa olsun AYNI konsolide metin testi tamam.");
}

// --- 7) usePlaceholderTokens: true -> cogullama UYGULANMAZ ----------------
{
  fns.setState(freshState({
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }),
      unit("100", "1", "A Blok", { unitNo: "3" }),
    ],
  }));
  const tokenText = fns.buildMainPropertyDescription({ usePlaceholderTokens: true });
  assert.ok(!tokenText.includes("taşınmazların") && !tokenText.includes("gayrimenkullerin"), `usePlaceholderTokens=true iken cogullama UYGULANMAMALI, bulunan: ${tokenText}`);
  console.log("buildMainPropertyDescription() usePlaceholderTokens ile cogullama devre-disi testi tamam.");
}

// --- 8) BÜYÜK ENTEGRASYON: kullanıcının TAM 4-blok örneği (2026-08-27) ---
// A/B AYNI kat kompozisyonu + FARKLI giriş yönü; C/D kendi ayrı
// paragrafları; A/B/C proje uyumlu, D uyumsuz; fiziki özellikler TÜM
// bloklarda ORTAK; asansör TÜM bloklarda AYNI (1'er adet).
{
  const commonFields = {
    requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
    blockNo: "0", parcelNo: "709", landArea: "21.625,77",
    buildingOrder: "Ayrık", buildingStyle: "Betonarme Karkas", buildingClass: "3/B",
    exteriorCladding: "Mantolama Üzeri Plastik Boyalı", stairLanding: "Seramik Kaplı", interiorWalls: "Plastik Boyalı",
    elevator: "1 Adet Asansör", carpark: "Kapalı Ve Açık Otopark",
    socialFacilities: "Açık Yüzme Havuzu, Spor Salonu, Basketbol Sahası",
    mainRealEstateProjectSuitable: "Evet",
    buildingEntranceLevel: "Zemin",
  };
  // floorGroup: A ve B AYNI (1) kat kompozisyonunu paylaşır (TEK
  // paragrafta birleşmeli); C (2) ve D (3) KENDİ AYRI/farklı kat
  // kompozisyonlarına sahiptir (her biri kendi paragrafında kalmalı).
  const makeBlockOverrides = (blockName, blockPosition, floorGroup, projectSuitable, entranceDirection, extra = {}) => ({
    titleBlockName: blockName,
    buildingSubjectBlockPosition: blockPosition,
    testFloorComposition: `bodrum + zemin + 4 normal kat + çatı katı (grup ${floorGroup})`,
    testFloorSummary: `1. Bodrum katta Ortak Alanlar ve 4 adet dükkan (grup ${floorGroup}) olmak üzere binada toplam 14 adet bağımsız bölüm bulunmaktadır.`,
    totalFloors: "6",
    mainRealEstateProjectSuitable: projectSuitable,
    buildingEntranceDirection: entranceDirection,
    ...extra,
  });

  fns.setState(freshState({
    fields: { ...commonFields, ...makeBlockOverrides("A Blok", "kuzey", 1, "Evet", "Batı") },
    titleUnits: [
      unit("0", "709", "B Blok", { ...commonFields, ...makeBlockOverrides("B Blok", "güney", 1, "Evet", "Doğu") }),
      unit("0", "709", "C Blok", { ...commonFields, ...makeBlockOverrides("C Blok", "doğu", 2, "Evet", "Batı") }),
      unit("0", "709", "D Blok", { ...commonFields, ...makeBlockOverrides("D Blok", "batı", 3, "Hayır", "Batı", { mainRealEstateProjectSuitabilityNote: "Çatı katına ilave yapıldığı tespit edilmiştir." }) }),
    ],
  }));

  const text = fns.buildMainPropertyDescription();

  // 1) Acilis + blok sayisi + birlesik konum cumlesi.
  assert.ok(text.includes("taşınmazların yer aldığı site"), `Acilis coğul olmali, bulunan: ${text}`);
  assert.ok(text.includes("4 blok olarak inşa edilmiştir"), `Blok sayisi GERCEK grup sayisindan (4) gelmeli, bulunan: ${text}`);
  assert.ok(
    text.includes("A Blok parselin kuzey cephesinde") && text.includes("B Blok parselin güney cephesinde")
    && text.includes("C Blok parselin doğu cephesinde") && text.includes("D Blok parselin batı cephesinde"),
    `Tum bloklarin konumu TEK cumlede birlesmeli, bulunan: ${text}`
  );

  // 2) Proje uyumu: A+B+C ortak (coğul ozne + blok listesi), D ayri (uyumsuz + not).
  assert.ok(text.includes("Bloklar") && /A,?\s*B ve C Bloklar/.test(text), `A+B+C ortak proje cumlesinde blok listesi (coğul 'Bloklar') olmali, bulunan: ${text}`);
  assert.ok(text.includes("D Blok") && /farklılık bulunduğu değerlendirilmiştir/.test(text), `D Blok kendi (uyumsuz) proje cumlesinde ayri kalmali, bulunan: ${text}`);
  assert.ok(text.includes("Çatı katına ilave yapıldığı tespit edilmiştir"), `D Blok'un proje uygunsuzluk notu metne dahil olmali, bulunan: ${text}`);

  // 3) Kat kompozisyonu + giris: A+B TEK paragrafta ("blokların her
  // birinde"), FARKLI giris yonleri AYRI belirtilir; C ve D kendi AYRI
  // paragraflarinda ("binada", tekil).
  assert.ok(/A ve B Blok/.test(text) && text.includes("blokların her birinde"), `A+B TEK paragrafta 'blokların her birinde' ile birlesmeli, bulunan: ${text}`);
  assert.ok(text.includes("A Blok bina girişi") && text.includes("batı") && text.includes("B Blok bina girişi") && text.includes("doğu"), `A/B farkli giris yonleri AYRI belirtilmeli, bulunan: ${text}`);
  const paragraphs = text.split("\n\n");
  const cBlokParagraph = paragraphs.find((p) => p.startsWith("C Blok"));
  const dBlokParagraph = paragraphs.find((p) => p.startsWith("D Blok"));
  assert.ok(cBlokParagraph && cBlokParagraph.includes("binada toplam"), `C Blok kendi AYRI ('binada', tekil) paragrafinda kalmali, bulunan: ${text}`);
  assert.ok(dBlokParagraph && dBlokParagraph.includes("binada toplam"), `D Blok kendi AYRI ('binada', tekil) paragrafinda kalmali, bulunan: ${text}`);

  // 4) Fiziki ozellikler: TUM bloklar ayni oldugundan TEK (atifsiz) cumle.
  assert.ok(text.includes("mantolama üzeri plastik boyalı") && !text.includes("Blok'ta"), `Fiziki ozellikler TUM bloklarda ayni oldugundan atifsiz TEK cumle olmali, bulunan: ${text}`);

  // 5) Asansor: TUM bloklarda ayni (1 adet) -> dagitimli "1'er adet".
  assert.ok(text.includes("1'er adet asansör"), `Asansor dagitim ekiyle (1'er adet) belirtilmeli, bulunan: ${text}`);

  // 6) Sosyal imkanlar: coğul "Taşınmazlar".
  assert.ok(text.includes("Taşınmazlar") && text.includes("yüzme havuzu"), `Sosyal imkanlar cumlesi coğul 'Taşınmazlar' ile baslamali, bulunan: ${text}`);

  console.log("buildMainPropertyDescription() TAM 4-blok entegrasyon (kullanici ornegi) testi tamam.");
}

// --- 9) KRITIK REGRESYON (2026-08-27, kullanici canli raporunda yakaladi): -
// A ve B Blok'un serbest-metin kat/kullanim verisi ICERIK olarak birebir
// ayni ama kozmetik olarak (fazladan bosluk) farkli girilmisse, gruplama
// KARARI hala TEK (birlesik "A ve B Blok ...") paragraf uretmeli. Onceki
// (0.0.574) davranis ham metni birebir karsilastirdigindan bu durumda
// YANLISLIKLA IKI AYRI paragraf uretiyordu - gorunen NIHAI metin
// (normalizeReportDescriptionText/cleanComparablePunctuation SADECE en
// sonda, PARAGRAF bazinda uygulandigindan) ozdes GORUNSE bile birlesme
// gerceklesmiyordu. NOT: bu test dosyasinin normalizeReportDescriptionText
// stub'u yalnizca bosluk sikistirma yapiyor (buyuk/kucuk harf katlamasi
// YAPMIYOR, bkz. satir ~189) - kullanicinin gercek raporundaki "Ve"/"ve"
// buyuk harf farkini GERCEK app.js'teki tam fonksiyon (bu testin kapsami
// disinda tutulan agir bagimlilik) ele aliyor; burada AYNI duzeltme
// mekanizmasi (anahtar normalizasyonu) bosluk farkiyla dogrulanir.
{
  const commonFields = {
    requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
    blockNo: "0", parcelNo: "709",
    buildingOrder: "Ayrık", buildingStyle: "Betonarme Karkas",
    elevator: "1 Adet Asansör", carpark: "Kapalı Otopark",
    socialFacilities: "Açık Yüzme Havuzu",
    mainRealEstateProjectSuitable: "Evet",
    buildingEntranceLevel: "Zemin", buildingEntranceDirection: "Güney",
    totalFloors: "6",
  };

  fns.setState(freshState({
    fields: {
      ...commonFields,
      titleBlockName: "A Blok",
      // Fazladan bosluk/kirli bicimlendirme - ICERIK B Blok ile AYNI.
      testFloorComposition: "bodrum + zemin + 4 normal kat + çatı katı",
      testFloorSummary: "1. Bodrum katta  Ortak Alanlar Ve Otopark ve 8 adet dükkan olmak üzere binada toplam 32 adet bağımsız bölüm bulunmaktadır.",
    },
    titleUnits: [
      unit("0", "709", "B Blok", {
        ...commonFields,
        titleBlockName: "B Blok",
        testFloorComposition: "bodrum + zemin + 4 normal kat + çatı katı",
        testFloorSummary: "1. Bodrum katta Ortak Alanlar Ve Otopark ve 8 adet dükkan olmak üzere binada toplam 32 adet bağımsız bölüm bulunmaktadır.",
      }),
    ],
  }));

  const text = fns.buildMainPropertyDescription();
  assert.ok(/A ve B Blok/.test(text), `Kozmetik (bosluk) farki OLAN ama ICERIK ayni A/B TEK 'A ve B Blok' paragrafinda birlesmeli, bulunan: ${text}`);
  assert.ok(text.includes("blokların her birinde"), `Birlesik paragraf 'blokların her birinde' kullanmali, bulunan: ${text}`);
  assert.ok(!/A Blok[^.]*\n\n[^.]*B Blok bodrum/.test(text), `A ve B AYRI paragraflara DUSMEMELI, bulunan: ${text}`);

  console.log("groupMainPropertyBlocksByText() kozmetik-fark (bosluk) normalizasyon REGRESYONU testi tamam.");
}

console.log("Ana Gayrimenkul Aciklamasi (mainPropertyDescription) cogullama testleri basarili.");
