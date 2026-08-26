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
  "buildMainPropertyDescription",
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
  function buildMainPropertyFloorComposition() { return ""; }
  function buildBuildingFloorMacroSummary() { return ""; }
  function selectVariant() { return 0; }
  function registerVariantGroup() {}
  ${constArrayNames.map(extractConstArray).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getMainPropertyDescriptionUnitCount,
    pluralizeMainPropertyDescriptionText,
    buildMainPropertyDescription,
    isBuildingBlockGroupingActive,
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

// --- 6) 2+ FARKLI blok: aktif bloğun KENDİ uye sayisina gore karar --------
// (diger bloktan BAGIMSIZ). NOT: senaryo 1c'deki AYNI gerekce ile iki
// AYRI/kendi icinde tutarli state kurulur (state.fields HER ZAMAN aktif
// taşınmazin kendi alanlarini tutar).
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", unitNo: "1", buildingStyle: "Betonarme",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "2" }), // A Blok'un 2. uyesi
      unit("100", "1", "B Blok", { unitNo: "5" }), // B Blok, TEK uyeli
    ],
    activeTitleUnitIndex: 0, // aktif = A Blok'un kendisi (2 uyeli)
  }));
  const aBlockText = fns.buildMainPropertyDescription();
  assert.ok(
    aBlockText.includes("taşınmazların yer aldığı") || aBlockText.includes("gayrimenkullerin bulunduğu"),
    `A Blok (2 uyeli) COGUL olmali, bulunan: ${aBlockText}`
  );

  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Dikey Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", unitNo: "5", buildingStyle: "Betonarme",
    },
    titleUnits: [
      unit("100", "1", "A Blok", { unitNo: "1" }),
      unit("100", "1", "A Blok", { unitNo: "2" }),
    ],
    activeTitleUnitIndex: 0, // aktif = B Blok'un kendisi (TEK uyeli)
  }));
  const bBlockText = fns.buildMainPropertyDescription();
  assert.ok(
    (bBlockText.includes("taşınmazın yer aldığı") || bBlockText.includes("gayrimenkulün bulunduğu"))
    && !bBlockText.includes("taşınmazların yer aldığı") && !bBlockText.includes("gayrimenkullerin bulunduğu"),
    `B Blok (TEK uyeli) TEKIL kalmali - A Blok'un cogul olmasi B Blok'u ETKİLEMEMELİ, bulunan: ${bBlockText}`
  );
  console.log("buildMainPropertyDescription() 2+ FARKLI blok - her blok KENDI uye sayisina gore testi tamam.");
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

console.log("Ana Gayrimenkul Aciklamasi (mainPropertyDescription) cogullama testleri basarili.");
