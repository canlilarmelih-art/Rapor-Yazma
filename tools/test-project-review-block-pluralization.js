"use strict";

// Proje İnceleme Açıklaması (projectReviewDescription) — çoğullama +
// blok bazında ortak/ayrı cümle (2026-08-25). Kullanıcı bildirimi
// (aynı ada/parsel çoklu rapor örneği): "Ana gayrimenkulle ilgili olarak
// ada, parsel bazında yerinin doğruluğu ... 25.08.2026 tarihinde Webtapu
// Portalı Ve Düzce Belediyesi kurumlarında ekspertize konu taşınmaza ait
// 12.12.2024 tarih 14/895 sayılı kat irtifakı projesi incelenmiştir. ...
// Ekspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari
// olarak projesine uygundur. olarak geldi. böyle olmamalı. çoğula uygun
// olmalı eğer aynı tarihli ve sayılı mimari proje incelendiyse açıklama
// ona göre yapılmalı blok bazında ortak ve ayrı cümle yapıları
// kurulmalı" — buildEkbExplanationParts/buildDocumentsOccupancyParts ile
// AYNI mimari desen (bkz. o fonksiyonların app.js yorumları) yeni
// buildProjectReviewExplanationParts()'a uygulandı:
//  - Blok gruplama AKTİF DEĞİLSE (kat irtifakı dışı/tek blok/tekil
//    taşınmaz): davranış SERBEST METİN olarak AYNI kalır, yalnızca aynı
//    ada/parselde 2+ bağımsız bölüm varsa (hasMixedTitleUnitParcels
//    false) "taşınmaz(a)"/"bağımsız bölüm" çoğullanır.
//  - Blok gruplama AKTİFSE: HER blok kendi temsilcisinin alanlarıyla
//    (state.fields GEÇİCİ değiştirilerek, switchActiveTitleUnit'e HİÇ
//    dokunulmadan) hesaplanır; AYNI HAM metni üreten bloklar TEK
//    blok-atıflı/çoğul cümlede birleşir (kullanıcının "aynı tarihli ve
//    sayılı mimari proje" örneği), farklı metin üreten bloklar kendi
//    ayrı (yine blok atıflı) cümlesinde kalır.
//
// Bu test kapsamı:
//  1) pluralizeProjectReviewSubjectText(): kelime düzeyinde çoğullama +
//     blok atfı örgüsü ("ait ... ait" tekrarı YOK, buildEkbExplanation
//     düzeltmesiyle AYNI kural).
//  2) buildProjectReviewExplanationParts(): blok gruplama KAPALIYKEN tek
//     taşınmaz (regresyon, DEĞİŞMEMELİ) + aynı ada/parselde 2 bağımsız
//     bölüm (çoğullanmalı, atıf YOK).
//  3) buildProjectReviewExplanationParts(): blok gruplama AÇIKKEN — 2
//     blok AYNI proje tarihini/sayısını paylaşıyorsa TEK birleşik/çoğul
//     cümle; 2 blok FARKLI proje bilgisine sahipse 2 AYRI blok-atıflı
//     cümle.
//  4) buildProjectReviewExplanation(): parts birleşimi ("\n\n" ile) ve
//     eski 7 çağrı noktasının hâlâ beklediği STRING dönüş tipi korunuyor.

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
  "foldTurkish",
  "toLowerText",
  "dateIsoToTr",
  "normalizeYesNoChoice",
  "parseReportNumber",
  "formatSquareMeterArea",
  "normalizeOwnershipTypeForSectionVisibility",
  "isCondominiumEasementOwnershipType",
  "isLandProjectReview",
  "shouldShowArchitecturalProjectFields",
  "getOwnershipTypeText",
  "isCondominiumOwnershipTypeValue",
  "isCondominiumOwnershipType",
  "isOwnershipProjectDifferenceComparable",
  "getSelectedProjectInstitutions",
  "projectInstitutionIncludes",
  "isOsbInstitutionValue",
  "shouldShowProjectDifferenceField",
  "shouldUseProjectDifferenceComparison",
  "getProjectReviewDateText",
  "getProjectReviewDistrictText",
  "formatProjectReviewLocation",
  "formatProjectReviewLocationForMissing",
  "formatProjectReference",
  "formatOldAdaParcelProjectNote",
  "buildNoArchitecturalProjectDescription",
  "buildSingleInstitutionCondominiumProjectDescription",
  "buildProjectReviewInstitutionSummary",
  "formatProjectInstitutionForSummary",
  "buildProjectReviewDescription",
  "buildProjectSuitabilityBuildingReferenceSentence",
  "formatProjectSuitabilityEntranceLevel",
  "buildBuildingFootprintAndEntranceExplanation",
  "stripProjectSuitabilityRepairSentence",
  "shouldShowProjectSuitabilityRepair",
  "projectSuitabilityStatusKey",
  "isProjectSuitabilityOk",
  "selectVariant",
  "buildProjectSuitabilityDescription",
  "buildProjectReviewExplanationSingle",
  "pluralizeProjectReviewSubjectText",
  "buildProjectReviewExplanationParts",
  "buildProjectReviewExplanation",
  "pluralizeEnvironmentalSubjectText",
  "isMultiTitleUnitReportForNarrative",
  "hasMixedTitleUnitParcels",
  "getTitleUnitCount",
  "getNarrativeTitleUnitFields",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "createEmptyTitleUnit",
  "buildAllTitleUnitsForSummaryTable",
  "computeDocumentsBlockGroups",
  "computeDocumentsBlockLabel",
  "isDocumentsBlockGroupingActive",
  "formatDocumentBlockAttributionPhrase",
  "normalizeBlockLabelPrefixForAttribution",
];

// `buildProjectSuitabilityStatusSentence` const/registerVariantGroup
// bloğuna (projectSuitabilityStatusVariants) bağımlı — test-server-
// template-rendering.js'teki AYNI dilim tekniği (marker'dan bir sonraki
// fonksiyon tanımına kadar) yeniden kullanılıyor.
const variantsStart = appSource.indexOf("const projectSuitabilityStatusVariants");
const variantsEnd = appSource.indexOf("function buildProjectSuitabilityBuildingReferenceSentence", variantsStart);
assert(variantsStart >= 0 && variantsEnd > variantsStart, "Proje uygunluk varyant bloğu bulunamadı.");
const projectSuitabilityVariantsAndSentenceFnSrc = appSource.slice(variantsStart, variantsEnd);

// Ağır/kapsam-dışı bağımlılıklar diğer test dosyalarındaki AYNI emsalle
// (bkz. test-project-review-district-merkez.js, test-documents-block-
// description.js) hafif stub'larla değiştirilir — bu testin odağı
// çoğullama + blok bazında ortak/ayrı cümle kurulumu, başlık büyük/küçük
// harf biçimlendirmesi/joinTurkishList'in kendisi DEĞİL.
const sandboxSource = `
  let state = {};
  function normalizeReportTitleText(value) { return String(value || "").trim(); }
  // Gercek normalizeReportDescriptionText() satir/paragraf araligini
  // ("\\n\\n") KORUR (yalnizca HER SATIR icindeki bosluk fazlaligini
  // temizler, cumle-basi buyutme/ozel-kelime zinciri bu testin odagi
  // DEGIL) - naif tek-satirlik ".replace(/\\s+/g,' ')" bunu BOZAR (coklu
  // paragraflari tek satira sikistirir), bu yuzden satir-satir calisan
  // daha sadik bir stub kullaniliyor.
  function normalizeReportDescriptionText(value) {
    return String(value || "")
      .split("\\n")
      .map((line) => line.replace(/\\s+/g, " ").trim())
      .join("\\n")
      .trim();
  }
  // app.js'te joinTurkishList AYNI ad altı birden fazla kez tanımlı
  // (script-seviyesi fonksiyon bildirimi, sonuncusu kazanır) — gerçek
  // çalışma zamanı davranışını yansıtan elle yazılmış eşdeğer kopya
  // (bkz. test-documents-block-description.js'teki AYNI emsal notu).
  function joinTurkishList(items = []) {
    const clean = (items || []).map((item) => String(item || "").replace(/\\s+/g, " ").trim()).filter(Boolean);
    if (!clean.length) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return \`\${clean[0]} ve \${clean[1]}\`;
    return \`\${clean.slice(0, -1).join(", ")} ve \${clean[clean.length - 1]}\`;
  }
  const imarOsbInstitutionOption = "Organize Sanayi Bölge Müdürlüğü";
  function registerVariantGroup() {}
  ${functionNames.map(extractFunction).join("\n")}
  ${projectSuitabilityVariantsAndSentenceFnSrc}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    buildProjectReviewExplanation,
    buildProjectReviewExplanationParts,
    buildProjectReviewExplanationSingle,
    pluralizeProjectReviewSubjectText,
    isDocumentsBlockGroupingActive,
    computeDocumentsBlockGroups,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// `baseFields` gerçek uygulamadaki DOCUMENTS_BLOCK_SHARED_FIELD_KEYS
// senkronunu (syncDocumentsSharedDataToBlockSiblings) simüle eder — aynı
// binanın FARKLI bloklarının, tek tek override edilmedikçe, ana taşınmazla
// (primary/state.fields) AYNI kurum/proje-bilgisi alanlarını paylaştığını
// varsayar; yalnızca blok kimliği (blockNo/titleBlockName) ve — test
// senaryosunda kasıtlı olarak farklılaştırılan alanlar (overrides) değişir.
function unit(baseFields, blockNo, parcelNo, titleBlockName, overrides = {}) {
  return { fields: { ...baseFields, blockNo, parcelNo, titleBlockName, ...overrides }, tables: {} };
}

function freshState(overrides = {}) {
  return {
    reportId: "RE-TEST-0001",
    fields: {
      requestType: "Çoklu Talep",
      ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100",
      parcelNo: "1",
      titleBlockName: "A Blok",
      hasArchitecturalProject: "Evet",
      documentReviewInstitution: "Webtapu Portalı Ve Düzce Belediyesi",
      projectInstitution: "Webtapu,Belediye",
      titleDistrict: "Merkez",
      titleCity: "Düzce",
      projectDate: "2024-12-12",
      projectNo: "14/895",
      projectType: "Kat İrtifakı",
      projectSuitabilityStatus: "",
      ...overrides,
    },
    tables: {},
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  };
}

// --- 1) pluralizeProjectReviewSubjectText(): kelime çoğullama + blok ------
// atfı örgüsü --------------------------------------------------------------
{
  const singularProjectSentence = "Webtapu Portalı Ve Düzce Belediyesi kurumlarında ekspertize konu taşınmaza ait 12.12.2024 tarih 14/895 sayılı kat irtifakı projesi incelenmiştir.";
  const pluralNoAttribution = fns.pluralizeProjectReviewSubjectText(singularProjectSentence, true, "");
  assert.ok(pluralNoAttribution.includes("taşınmazlara ait"), `Cogullama etkinken 'tasinmaza ait' -> 'tasinmazlara ait' olmali, bulunan: ${pluralNoAttribution}`);
  assert.ok(!pluralNoAttribution.includes("taşınmaza ait"), `Eski tekil 'tasinmaza ait' KALMAMALI, bulunan: ${pluralNoAttribution}`);

  const withAttribution = fns.pluralizeProjectReviewSubjectText(singularProjectSentence, true, "A ve B Blok'a ait");
  assert.ok(withAttribution.includes("ekspertize konu A ve B Blok'a ait 12.12.2024"), `Atif 'taniamaz(lar)a ait' kalibinin YERINE gecmeli (buildEkbExplanation'daki 'ait ... ait' kurali), bulunan: ${withAttribution}`);
  assert.ok(!withAttribution.includes("ait ... ait") && !withAttribution.includes("ait taşınmaz"), `REGRESYON: 'ait ... ait' cift tekrari OLMAMALI, bulunan: ${withAttribution}`);

  const suitabilitySentence = "Ekspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur.";
  const pluralSuitability = fns.pluralizeProjectReviewSubjectText(suitabilitySentence, true, "");
  assert.ok(pluralSuitability.includes("bağımsız bölümler kat"), `'bagimsiz bolum' -> 'bagimsiz bolumler' cogullanmali, bulunan: ${pluralSuitability}`);

  const suitabilityWithAttribution = fns.pluralizeProjectReviewSubjectText(suitabilitySentence, true, "A ve B Blok'a ait");
  assert.equal(
    suitabilityWithAttribution,
    "Ekspertize konu A ve B Blok'a ait bağımsız bölümler kat, kattaki konum, alan ve mimari olarak projesine uygundur.",
    `Atif 'bagimsiz bolum(ler)' kelimesinin ONUNE eklenmeli (bu kalipta zaten 'ait' yok), bulunan: ${suitabilityWithAttribution}`,
  );

  const singleBlockAttribution = fns.pluralizeProjectReviewSubjectText(suitabilitySentence, false, "A Blok'a ait");
  assert.equal(
    singleBlockAttribution,
    "Ekspertize konu A Blok'a ait bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur.",
    `Cogullama KAPALIYKEN bile (tek taninmazli TEK blok) atif orulmeli, tekil kalmali, bulunan: ${singleBlockAttribution}`,
  );

  console.log("pluralizeProjectReviewSubjectText() kelime cogullama + blok atfi orgusu testi tamam.");
}

// --- 2) buildProjectReviewExplanationParts(): blok gruplama KAPALI --------
{
  // 2a) Tekil tasinmaz (Musecil Bina) - REGRESYON, cogullanmamali.
  fns.setState(freshState({ requestType: "", ownershipType: "Müstakil Bina" }));
  const singleParts = fns.buildProjectReviewExplanationParts();
  assert.equal(singleParts.length, 1, "Tekil tasinmazda TEK parca donmeli.");
  assert.ok(singleParts[0].includes("taşınmaza ait"), `Tekil tasinmazda ESKI tekil ifade DEGISMEMELI, bulunan: ${singleParts[0]}`);
  assert.ok(!singleParts[0].includes("Blok'a ait"), "Tekil tasinmazda blok atfi OLMAMALI.");

  // 2b) Ayni ada/parselde 2 bagimsiz bolum, blok ayrimi YOK (ownershipType
  // Musecil Bina - isDocumentsBlockGroupingActive false kalir cunku
  // isCondominiumOwnershipTypeValue kosulu saglanmiyor) -> cogullanmali,
  // atif OLMAMALI.
  const sharedParcelState = freshState({ ownershipType: "Müstakil Bina" });
  sharedParcelState.titleUnits = [unit(sharedParcelState.fields, "100", "1", "")];
  fns.setState(sharedParcelState);
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "sanity: Musecil Bina'da blok gruplama aktif OLMAMALI.");
  const sharedParcelParts = fns.buildProjectReviewExplanationParts();
  assert.equal(sharedParcelParts.length, 1, "Blok ayrimi yokken TEK (birlesik) parca donmeli.");
  assert.ok(sharedParcelParts[0].includes("taşınmazlara ait"), `Ayni ada/parselde 2 bagimsiz bolum COGULLANMALI, bulunan: ${sharedParcelParts[0]}`);
  assert.ok(sharedParcelParts[0].includes("bağımsız bölümler kat"), `Uygunluk cumlesi de COGULLANMALI, bulunan: ${sharedParcelParts[0]}`);
  assert.ok(!sharedParcelParts[0].includes("Blok'a ait"), "Blok ayrimi yokken blok atfi OLMAMALI.");

  console.log("buildProjectReviewExplanationParts() blok gruplama KAPALI (regresyon + cogullama) testi tamam.");
}

// --- 3) buildProjectReviewExplanationParts(): blok gruplama AÇIK ----------
{
  // 3a) 2 blok AYNI proje tarihini/sayisini paylasiyor -> TEK birlesik/
  // cogul, blok-atifli cumle (kullanicinin "ayni tarihli ve sayili mimari
  // proje incelendiyse ortak cumle kurulmali" ornegi).
  const sameProjectState = freshState();
  sameProjectState.titleUnits = [
    unit(sameProjectState.fields, "100", "1", "B Blok"),
  ];
  fns.setState(sameProjectState);
  assert.equal(fns.isDocumentsBlockGroupingActive(), true, "sanity: Yatay Kat Irtifaki + 2 farkli blok -> blok gruplama aktif olmali.");
  const sameProjectParts = fns.buildProjectReviewExplanationParts();
  assert.equal(sameProjectParts.length, 1, `Ayni proje bilgisine sahip 2 blok TEK birlesik parcada toplanmali, bulunan sayi: ${sameProjectParts.length}`);
  assert.ok(sameProjectParts[0].includes("A ve B Blok'a ait"), `Birlesik cumle 'A ve B Blok\\'a ait' atfini icermeli, bulunan: ${sameProjectParts[0]}`);
  assert.ok(sameProjectParts[0].includes("taşınmazlara ait") || sameProjectParts[0].includes("Blok'a ait 12.12.2024"), `Birlesik cumle atifla devam etmeli, bulunan: ${sameProjectParts[0]}`);
  assert.ok(sameProjectParts[0].includes("bağımsız bölümler kat"), `Birlesik uygunluk cumlesi COGUL olmali (2 blok = 2 bagimsiz bolum), bulunan: ${sameProjectParts[0]}`);
  assert.ok(!sameProjectParts[0].includes("bağımsız bölüm kat"), `Tekil 'bagimsiz bolum kat' KALMAMALI (cogul olan 'bagimsiz bolumler kat' ile catismamali icin tam eslesme kontrolu), bulunan: ${sameProjectParts[0]}`);

  console.log("buildProjectReviewExplanationParts() blok gruplama ACIK + AYNI proje -> birlesik cogul cumle testi tamam.");
}
{
  // 3b) 2 blok FARKLI proje tarihine/sayisina sahip -> 2 AYRI, blok-atifli
  // cumle (her biri kendi TEKIL - o bloktaki TEK bagimsiz bolum - metniyle).
  const differentProjectState = freshState();
  differentProjectState.titleUnits = [
    unit(differentProjectState.fields, "100", "1", "B Blok", { projectDate: "2020-05-05", projectNo: "9/100" }),
  ];
  fns.setState(differentProjectState);
  const differentProjectParts = fns.buildProjectReviewExplanationParts();
  assert.equal(differentProjectParts.length, 2, `Farkli proje bilgisine sahip 2 blok 2 AYRI parca uretmeli, bulunan sayi: ${differentProjectParts.length}`);
  const joined = differentProjectParts.join(" ||| ");
  assert.ok(joined.includes("A Blok'a ait") && joined.includes("B Blok'a ait"), `Her iki blok da KENDI atfiyla gorunmeli, bulunan: ${joined}`);
  assert.ok(joined.includes("12.12.2024") && joined.includes("05.05.2020"), `Her iki bloğun KENDI proje tarihi gorunmeli, bulunan: ${joined}`);
  assert.ok(joined.includes("14/895") && joined.includes("9/100"), `Her iki bloğun KENDI proje no'su gorunmeli, bulunan: ${joined}`);
  // Her blokta TEK bagimsiz bolum oldugundan (unitIndices.length === 1) ve
  // farkli metin oldugundan (merge yok) COGUL OLMAMALI - yalnizca blok
  // atfi eklenmeli.
  assert.ok(joined.includes("bağımsız bölüm kat") && !joined.includes("bağımsız bölümler kat"), `Tek-tek bloklarda (merge YOK, her blokta 1 birim) TEKIL kalmali (yalnizca blok atifli), bulunan: ${joined}`);

  console.log("buildProjectReviewExplanationParts() blok gruplama ACIK + FARKLI proje -> 2 ayri blok-atifli cumle testi tamam.");
}

// --- 4) buildProjectReviewExplanation(): parts birlesimi ------------------
{
  const differentProjectState = freshState();
  differentProjectState.titleUnits = [
    unit(differentProjectState.fields, "100", "1", "B Blok", { projectDate: "2020-05-05", projectNo: "9/100" }),
  ];
  fns.setState(differentProjectState);
  const parts = fns.buildProjectReviewExplanationParts();
  const combined = fns.buildProjectReviewExplanation();
  assert.equal(combined, parts.join("\n\n"), "buildProjectReviewExplanation() parts'i '\\n\\n' ile birlestirmeli (eski string donus tipi korunmali).");
  assert.equal(typeof combined, "string", "buildProjectReviewExplanation() HER ZAMAN string donmeli (7 eski cagri noktasi bunu bekliyor).");

  console.log("buildProjectReviewExplanation() parts birlesimi (geriye donuk uyumluluk) testi tamam.");
}

console.log("Proje Inceleme Aciklamasi cogullama + blok bazinda ortak/ayri cumle testleri basarili.");
