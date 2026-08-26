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
  "pluralizeProjectReferenceTypeText",
  "getProjectReviewLocationLead",
  "getProjectReviewSimpleReferenceParts",
  "buildProjectReviewConsolidatedReferenceSentence",
  "buildProjectReviewConsolidatedSentences",
  "buildProjectReviewConsolidatedParts",
  "buildProjectReviewBlockFallbackParts",
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
  "formatTitleUnitSuitabilityLabel",
  "formatTitleUnitAttributionPhrase",
  "replaceProjectReviewSubjectWithOtherPropertiesPhrase",
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
    buildAllTitleUnitsForSummaryTable,
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
    "Ekspertize konu A ve B Blok'a ait bağımsız bölümler kat, kattaki konum, alan ve mimari olarak projelerine uygundur.",
    `Atif 'bagimsiz bolum(ler)' kelimesinin ONUNE eklenmeli (bu kalipta zaten 'ait' yok) VE 'projesine' -> 'projelerine' cogullanmali (2026-08-26 genisletmesi), bulunan: ${suitabilityWithAttribution}`,
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

// --- 3) buildProjectReviewExplanationParts(): blok gruplama AÇIK, SADE ----
// (konsolide) şekil — 2026-08-26 kullanıcı bildirimi: "çok tekrar eden
// cümleler var ... 2-3 cümlede bu paragraf oluşabilir" — artık her blok
// için TAM paragraf TEKRARLANMAZ; sabit giriş 1 kez, proje referansı TEK
// (gruplanmış) cümlede, uygunluk TEK/az sayıda cümlede.
{
  // 3a) 2 blok AYNI proje tarihini/sayisini VE AYNI uygunluk durumunu
  // paylasiyor -> HEM BÜTÜN olarak "unanimous" -> blok adi HİÇ gecmemeli,
  // duz cogul ("taşınmazlara ait" / "tüm bağımsız bölümler").
  const sameProjectState = freshState();
  sameProjectState.titleUnits = [
    unit(sameProjectState.fields, "100", "1", "B Blok"),
  ];
  fns.setState(sameProjectState);
  assert.equal(fns.isDocumentsBlockGroupingActive(), true, "sanity: Yatay Kat Irtifaki + 2 farkli blok -> blok gruplama aktif olmali.");
  const sameProjectParts = fns.buildProjectReviewExplanationParts();
  assert.equal(sameProjectParts.length, 3, `Sabit giris + proje cumlesi + uygunluk cumlesi = 3 parca beklenir (footprint bos oldugundan atlanir), bulunan sayi: ${sameProjectParts.length}, parcalar: ${JSON.stringify(sameProjectParts)}`);
  assert.equal(sameProjectParts[0], "Ana gayrimenkulle ilgili olarak ada, parsel bazında yerinin doğruluğu parselasyon planından ve imar planından tespit edilmiştir.", "1. parca HER ZAMAN sabit giris cumlesi olmali (bir kez, tekrarsiz).");
  assert.ok(!sameProjectParts[1].includes("Blok'a ait"), `TUM bloklar ayni proje bilgisine sahipse (unanimous) blok atfi OLMAMALI, bulunan: ${sameProjectParts[1]}`);
  assert.ok(sameProjectParts[1].includes("taşınmazlara ait 12.12.2024 tarih 14/895 sayılı"), `Unanimous proje cumlesi duz cogul olmali, bulunan: ${sameProjectParts[1]}`);
  assert.ok(!sameProjectParts[2].includes("Blok'a ait"), `TUM bloklar ayni uygunluk durumundaysa (unanimous) blok atfi OLMAMALI, bulunan: ${sameProjectParts[2]}`);
  assert.ok(sameProjectParts[2].includes("tüm bağımsız bölümler kat") && sameProjectParts[2].includes("projelerine uygundur"), `Unanimous uygunluk cumlesi 'tum' onekiyle cogul olmali (bagimsiz bolumler + projelerine), bulunan: ${sameProjectParts[2]}`);

  console.log("buildProjectReviewExplanationParts() blok gruplama ACIK + TUM bloklar unanimous -> 3 sade cumle, atifsiz testi tamam.");
}
{
  // 3b) 2 blok FARKLI proje tarihine/sayisina sahip (uygunluk durumu AYNI
  // kaliyor - varsayilan "" -> UYGUNDUR ikisinde de) -> proje cumlesi
  // bloklara gore ATIFLI VE TEK cumlede birlesik; uygunluk cumlesi ise
  // (kendi basina unanimous oldugundan) HALA atifsiz/duz cogul kalir -
  // bu IKI grubun BAGIMSIZ degerlendirildigini dogrular.
  const differentProjectState = freshState();
  differentProjectState.titleUnits = [
    unit(differentProjectState.fields, "100", "1", "B Blok", { projectDate: "2020-05-05", projectNo: "9/100" }),
  ];
  fns.setState(differentProjectState);
  const differentProjectParts = fns.buildProjectReviewExplanationParts();
  assert.equal(differentProjectParts.length, 3, `Sabit giris + TEK (gruplanmis) proje cumlesi + TEK (unanimous) uygunluk cumlesi = 3 parca, bulunan: ${JSON.stringify(differentProjectParts)}`);
  const reviewSentence = differentProjectParts[1];
  assert.ok(reviewSentence.includes("A Blok'a ait 12.12.2024 tarih 14/895 sayılı") && reviewSentence.includes("B Blok'a ait 05.05.2020 tarih 9/100 sayılı"), `Farkli proje referanslari TEK cumlede, HER BIRI KENDI blok atfiyla gorunmeli, bulunan: ${reviewSentence}`);
  assert.ok(reviewSentence.includes(" ve B Blok'a ait"), `Iki referans 'X, Y' degil 'X ve Y' ile (joinTurkishList) baglanmali, bulunan: ${reviewSentence}`);
  assert.ok(reviewSentence.includes("kat irtifakı projeleri incelenmiştir."), `2 FARKLI referans oldugundan proje TURU cogullanmali (projesi->projeleri), TEK 'incelenmistir' ile bitmeli, bulunan: ${reviewSentence}`);
  assert.equal((reviewSentence.match(/incelenmiştir/g) || []).length, 1, `Eski (0.0.550) davranistaki gibi HER blok icin AYRI 'incelenmistir' cumlesi OLMAMALI, TEK olmali, bulunan: ${reviewSentence}`);
  assert.ok(!differentProjectParts[2].includes("Blok'a ait"), `Proje referansi FARKLI olsa bile uygunluk durumu unanimous ise (bu senaryoda ikisi de varsayilan UYGUNDUR) uygunluk cumlesinde blok atfi OLMAMALI, bulunan: ${differentProjectParts[2]}`);
  assert.ok(differentProjectParts[2].includes("tüm bağımsız bölümler"), `Uygunluk unanimous kaldigindan 'tum bagimsiz bolumler' ifadesi gorunmeli, bulunan: ${differentProjectParts[2]}`);

  console.log("buildProjectReviewExplanationParts() blok gruplama ACIK + proje FARKLI/uygunluk AYNI -> bagimsiz gruplama testi tamam.");
}

// --- 4) Kullanıcının bildirdiği TAM senaryo (2026-08-26): 4 blok, A+B ----
// ayni proje, C ve D farkli kendi projelerine sahip, HEPSI "uygundur" ----
{
  const fourBlockState = freshState({ titleBlockName: "A Blok" });
  fourBlockState.titleUnits = [
    unit(fourBlockState.fields, "100", "1", "B Blok"),
    unit(fourBlockState.fields, "100", "1", "C Blok", { projectDate: "2024-10-10", projectNo: "14/2024" }),
    unit(fourBlockState.fields, "100", "1", "D Blok", { projectDate: "2023-03-08", projectNo: "08/2023" }),
  ];
  fns.setState(fourBlockState);
  const parts = fns.buildProjectReviewExplanationParts();
  assert.equal(parts.length, 3, `4 blok (2 farkli+2 tekil proje referansi, HEPSI unanimous uygunluk) icin de 3 parca (giris+proje+uygunluk) beklenir, bulunan: ${JSON.stringify(parts)}`);
  const review = parts[1];
  assert.ok(review.includes("A ve B Blok'a ait 12.12.2024 tarih 14/895 sayılı"), `A+B ayni proje PAYLASTIGINDAN TEK atifta birlesmeli, bulunan: ${review}`);
  assert.ok(review.includes("C Blok'a ait 10.10.2024 tarih 14/2024 sayılı"), `C kendi AYRI atifiyla gorunmeli, bulunan: ${review}`);
  assert.ok(review.includes("D Blok'a ait 08.03.2023 tarih 08/2023 sayılı"), `D kendi AYRI atifiyla gorunmeli, bulunan: ${review}`);
  assert.ok(review.includes("kat irtifakı projeleri incelenmiştir."), `3 FARKLI referans grubu oldugundan proje turu cogul olmali, bulunan: ${review}`);
  assert.equal((review.match(/incelenmiştir/g) || []).length, 1, `TUM rapor icin TEK 'incelenmistir' olmali (kullanicinin sikayet ettigi 3x tekrar ARTIK YOK), bulunan: ${review}`);
  assert.equal((parts.join(" ").match(/Ana gayrimenkulle ilgili olarak/g) || []).length, 1, `Sabit giris cumlesi SADECE 1 KEZ gorunmeli (kullanicinin sikayet ettigi 3x tekrar ARTIK YOK), bulunan: ${JSON.stringify(parts)}`);
  assert.ok(!parts[2].includes("Blok'a ait"), `HEPSI 'uygundur' oldugundan (unanimous) uygunluk cumlesinde blok atfi OLMAMALI, bulunan: ${parts[2]}`);
  assert.ok(parts[2].includes("tüm bağımsız bölümler") && parts[2].includes("projelerine uygundur"), `Unanimous uygunluk cumlesi tek, cogul, atifsiz olmali, bulunan: ${parts[2]}`);

  console.log("buildProjectReviewExplanationParts() kullanicinin 4-blok TAM senaryosu (A+B ortak, C/D ayri, hepsi uygun) testi tamam.");
}

// --- 4b) REGRESYON (2026-08-26, kullanıcı bildirimi): "proje inceleme ----
// açıklamaları blok bazında değil bağımsız bölüm bazında olmalıdır" —
// AYNI BLOKTAKİ 2 FARKLI bağımsız bölümün FARKLI uygunluk durumu artık
// İKİSİ DE görünmeli (eskiden blok TEMSİLCİSİNİN — yalnızca İLK
// bağımsız bölümün — durumu kullanılıp diğeri SESSİZCE kayboluyordu).
// NOT (2026-08-26, ikinci güncelleme): 3 taşınmazın 2'si (>%50) AYNI
// (varsayılan UYGUNDUR) durumda olduğundan, >%50-çoğunluk sadeleştirmesi
// (bkz. Senaryo 8) burada da devreye girer — çoğunluk artık TEK TEK
// isimlendirilmez, "Diğer taşınmazlar" olarak genellenir; azınlık (A Blok
// 2 No'lu) kendi tam atıflı cümlesinde AYRI kalmaya devam eder (asıl
// regresyon amacı — azınlığın sessizce KAYBOLMAMASI — hâlâ korunuyor).
{
  const sameBlockDifferentUnitsState = freshState({ titleBlockName: "A Blok", unitNo: "1" });
  // A Blok'un 2. bağımsız bölümü (unitNo farklı, blockNo/parcelNo/titleBlockName
  // AYNI -> proje referansı icin AYNI blok grubu) FARKLI bir uygunluk durumuna sahip.
  sameBlockDifferentUnitsState.titleUnits = [
    unit(sameBlockDifferentUnitsState.fields, "100", "1", "A Blok", { unitNo: "2", projectSuitabilityStatus: "mimari olarak uygun değildir." }),
    unit(sameBlockDifferentUnitsState.fields, "100", "1", "B Blok", { unitNo: "3" }),
  ];
  fns.setState(sameBlockDifferentUnitsState);
  const groups = fns.computeDocumentsBlockGroups(fns.buildAllTitleUnitsForSummaryTable());
  assert.equal(groups.length, 2, "sanity: A Blok'un 2 bagimsiz bolumu AYNI blok grubunda (proje referansi icin) toplanmali.");
  const parts = fns.buildProjectReviewExplanationParts();
  assert.equal(parts.length, 4, `Giris + proje referansi (unanimous, blok bazinda) + 2 FARKLI uygunluk cumlesi (bagimsiz bolum bazinda) = 4 parca beklenir, bulunan: ${JSON.stringify(parts)}`);
  const suitabilityText = parts.slice(2).join(" ||| ");
  assert.ok(suitabilityText.includes("Diğer taşınmazlar"), `Cogunluk (2/3 > %50, varsayilan UYGUNDUR) artik TEK TEK isimlendirilmeyip 'Diger tasinmazlar' olarak genellenmeli, bulunan: ${suitabilityText}`);
  assert.ok(!suitabilityText.includes("A Blok 1 No'lu ve B Blok 3 No'lu"), `Cogunluk ARTIK eski gibi TEK TEK (A Blok 1 No'lu ve B Blok 3 No'lu) isimlendirilmemeli, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("A Blok 2 No'lu bağımsız bölüm") && !suitabilityText.includes("A Blok 2 No'lu ve"), `A Blok'un FARKLI durumdaki (azinlik) 2. bagimsiz bolumu KENDI (tekil) cumlesinde, kendi kimligiyle ayri kalmali - eskiden bu SESSIZCE kayboluyordu, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("uygundur") && suitabilityText.includes("uygun değildir"), `Iki FARKLI durum da metinde gorunmeli (biri kaybolmamali), bulunan: ${suitabilityText}`);
  assert.ok(!suitabilityText.includes("A, B Blok'a ait") && !suitabilityText.includes("A ve B Blok'a ait bağımsız bölümler"), `Atif ARTIK blok adiyla degil bagimsiz bolum kimligiyle kurulmali (kullanicinin sikayet ettigi 'A, B ve C Blok'a ait bağımsız bölümler' kalibi ARTIK olmamali), bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.indexOf("uygun değildir") < suitabilityText.indexOf("Diğer taşınmazlar"), `Azinlik cumlesi ONCE, cogunluk ('Diger tasinmazlar') cumlesi EN SONDA olmali, bulunan: ${suitabilityText}`);

  console.log("buildProjectReviewExplanationParts() AYNI bloktaki FARKLI bagimsiz bolum uygunluk durumlari (REGRESYON) testi tamam.");
}

// --- 5) Paylaşımlı (rapor-geneli) alanların blok hesaplaması sırasında ----
// KAYBOLMAMASI — 2026-08-26 kullanıcı örneğinde "25.08.2026 tarihinde"
// yalnızca SON (aktif) bloğun cümlesinde görünmüştü; kök neden:
// appointmentDate/municipalityInspectionDate TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS'te
// olduğundan hiçbir taşınmazın gölgesine KOPYALANMAZ — state.fields'ı
// doğrudan gölgeyle DEĞİŞTİRMEK (eski hata) bu alanı diğer bloklar için
// KAYBEDİYORDU. Düzeltme: `{ ...originalFields, ...representativeFields }`.
{
  const dateFieldState = freshState({ municipalityInspectionDate: "2026-08-25" });
  dateFieldState.titleUnits = [
    unit(dateFieldState.fields, "100", "1", "B Blok", { projectDate: "2020-05-05", projectNo: "9/100" }),
  ];
  fns.setState(dateFieldState);
  const parts = fns.buildProjectReviewExplanationParts();
  const review = parts[1];
  assert.ok(review.startsWith("25.08.2026 tarihinde"), `Rapor-geneli inceleme tarihi TUM bloklarda (ilk blok DAHIL) korunmali - REGRESYON, bulunan: ${review}`);
  assert.equal((review.match(/25\.08\.2026 tarihinde/g) || []).length, 1, `Tarih onceki SADECE-1-blok hatasinin AKSINE TUM bloklar icin AYNI/TUTARLI olmali (tek kez basta), bulunan: ${review}`);

  console.log("buildProjectReviewExplanationParts() paylasimli inceleme tarihinin TUM bloklarda korunmasi (REGRESYON) testi tamam.");
}

// --- 6) Sade şekle UYMAYAN blok varsa -> ESKİ (0.0.550, ayrı tam --------
// paragraf) davranışına güvenli GERİ DÖNÜŞ (fallback) --------------------
{
  // 6a) Bir blokta mimari proje YOK (hasArchitecturalProject: "Hayır") ->
  // getProjectReviewSimpleReferenceParts() o blok icin null doner ->
  // TUM rapor eski per-blok tam paragraf davranisina doner (disqualified).
  const noProjectBlockState = freshState();
  noProjectBlockState.titleUnits = [
    unit(noProjectBlockState.fields, "100", "1", "B Blok", { hasArchitecturalProject: "Hayır" }),
  ];
  fns.setState(noProjectBlockState);
  const fallbackParts = fns.buildProjectReviewExplanationParts();
  // Eski davranis: her FARKLI ham metin ayri bir parca - burada A ve B
  // FARKLI govdeler (biri "incelenmistir", digeri "bulunamamistir" temalı)
  // urettiginden en az 2 parca beklenir, VE sabit giris cumlesi HER
  // parcanin ICINDE tekrar eder (eski/uzun davranis, KASITLI olarak
  // sadelestirilmedi).
  assert.ok(fallbackParts.length >= 2, `Sade sekle uymayan blok varsa ESKI (coklu parca) davranisa donulmeli, bulunan sayi: ${fallbackParts.length}`);
  const fallbackJoined = fallbackParts.join(" ||| ");
  // Not: B bloğu "hasArchitecturalProject: Hayır" olduğundan KENDİ metni
  // (buildNoArchitecturalProjectDescription) locationLead'i (sabit giriş
  // cümlesini) HİÇ İÇERMEZ (bu, buildProjectReviewDescription'ın ESKİ/
  // değişmeyen dallanma davranışı) - bu yüzden burada "HER parçada
  // tekrar" değil, "fallback moduna GERÇEKTEN geçildi mi" (sade/konsolide
  // tek proje cümlesi YERİNE eski çoklu-parça davranışı) doğrulanır.
  assert.ok(fallbackJoined.includes("Ana gayrimenkulle ilgili olarak"), "A bloğunun (mimari proje VAR) parçası sabit giriş cümlesini içermeli.");
  assert.ok(!fallbackJoined.includes("kat irtifakı projeleri incelenmiştir."), "Fallback modunda YENİ konsolide/çoğul 'projeleri incelenmiştir' cümlesi ASLA üretilmemeli (sadeleştirme atlandı).");

  console.log("buildProjectReviewExplanationParts() sade sekle uymayan blok -> eski coklu-paragraf fallback testi tamam.");
}

// --- 7) buildProjectReviewExplanation(): parts birlesimi ------------------
{
  const fourBlockState = freshState({ titleBlockName: "A Blok" });
  fourBlockState.titleUnits = [
    unit(fourBlockState.fields, "100", "1", "B Blok"),
    unit(fourBlockState.fields, "100", "1", "C Blok", { projectDate: "2024-10-10", projectNo: "14/2024" }),
  ];
  fns.setState(fourBlockState);
  const parts = fns.buildProjectReviewExplanationParts();
  const combined = fns.buildProjectReviewExplanation();
  assert.equal(combined, parts.join("\n\n"), "buildProjectReviewExplanation() parts'i '\\n\\n' ile birlestirmeli (eski string donus tipi korunmali).");
  assert.equal(typeof combined, "string", "buildProjectReviewExplanation() HER ZAMAN string donmeli (7 eski cagri noktasi bunu bekliyor).");

  console.log("buildProjectReviewExplanation() parts birlesimi (geriye donuk uyumluluk) testi tamam.");
}

// --- 8) Kullanıcı talebi (2026-08-26): "eğer taşınmazların %50 sinden --------
// fazlası aynı uygunlukta ise ... bunu her bir bağımsız bölümü yazarak
// gösterme. ilk olarak uygun olmayanların açıklamasını belirt. kalan
// diğer taşınmazları Diğer Taşınmazlar olarak belirtebilirsin." — 5
// bağımsız bölümden 3'ü (>%50) varsayılan "uygundur", 2'si (azınlık, AYNI
// metin) "mimari olarak uygun değildir." Beklenen: azınlık ÖNCE kendi tam
// (2 isimli) atfıyla, çoğunluk EN SONDA "Diğer taşınmazlar" ile
// genellenmiş TEK cümle — hiçbir yerde 3 çoğunluk üyesinin adı TEK TEK
// (A/B Blok 1/2/5 No'lu) geçmemeli.
{
  const majorityState = freshState({ titleBlockName: "A Blok", unitNo: "1" });
  majorityState.titleUnits = [
    unit(majorityState.fields, "100", "1", "A Blok", { unitNo: "2" }),
    unit(majorityState.fields, "100", "1", "B Blok", { unitNo: "3", projectSuitabilityStatus: "mimari olarak uygun değildir." }),
    unit(majorityState.fields, "100", "1", "C Blok", { unitNo: "4", projectSuitabilityStatus: "mimari olarak uygun değildir." }),
    unit(majorityState.fields, "100", "1", "D Blok", { unitNo: "5" }),
  ];
  fns.setState(majorityState);
  const parts = fns.buildProjectReviewExplanationParts();
  const suitabilityText = parts.slice(2).join(" ||| ");

  assert.ok(suitabilityText.includes("B Blok 3 No'lu ve C Blok 4 No'lu"), `Azinlik (2 uye, AYNI metin) TEK cumlede kendi tam atfiyla gorunmeli, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("uygun değildir"), `Azinlik cumlesinin kendi metni (uygunsuzluk durumu) korunmali, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("Diğer taşınmazlar") , `Cogunluk (3/5 > %50) 'Diger tasinmazlar' olarak genellenmeli, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("Diğer taşınmazlar kat, kattaki konum, alan ve mimari olarak projelerine uygundur."), `Cogunluk cumlesi coguldan (projelerine) olusmali ve atifsiz OZNE ile baslamali, bulunan: ${suitabilityText}`);
  ["A Blok 1", "A Blok 2", "D Blok 5"].forEach((forbidden) => {
    assert.ok(!suitabilityText.includes(forbidden), `Cogunluk uyesi '${forbidden}' TEK TEK adlandirilmamali (kullanicinin sikayet ettigi 41-isimli cumle kalibi), bulunan: ${suitabilityText}`);
  });
  const minorityIndex = suitabilityText.indexOf("uygun değildir");
  const majorityIndex = suitabilityText.indexOf("Diğer taşınmazlar");
  assert.ok(minorityIndex >= 0 && majorityIndex > minorityIndex, `Azinlik cumlesi ONCE, cogunluk ('Diger tasinmazlar') cumlesi EN SONDA olmali, bulunan: ${suitabilityText}`);

  console.log("buildProjectReviewExplanationParts() >%50 cogunluk -> 'Diger Tasinmazlar' sadelestirmesi testi tamam.");
}

// --- 9) Hicbir grup %50'yi GECMIYORSA (ör. 2 esit grup) sadelestirme -----
// UYGULANMAMALI — mevcut (her grup kendi atifli cumlesi) davranis korunur.
{
  const tieState = freshState({ titleBlockName: "A Blok", unitNo: "1" });
  tieState.titleUnits = [
    unit(tieState.fields, "100", "1", "B Blok", { unitNo: "2", projectSuitabilityStatus: "mimari olarak uygun değildir." }),
  ];
  fns.setState(tieState);
  const parts = fns.buildProjectReviewExplanationParts();
  const suitabilityText = parts.slice(2).join(" ||| ");
  assert.ok(!suitabilityText.includes("Diğer taşınmazlar"), `%50/%50 esitlikte 'Diger tasinmazlar' sadelestirmesi TETIKLENMEMELI, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("A Blok 1 No'lu bağımsız bölüm"), `Esitlikte HER grup kendi tam atfiyla gorunmeye devam etmeli, bulunan: ${suitabilityText}`);
  assert.ok(suitabilityText.includes("B Blok 2 No'lu bağımsız bölüm"), `Esitlikte HER grup kendi tam atfiyla gorunmeye devam etmeli, bulunan: ${suitabilityText}`);

  console.log("buildProjectReviewExplanationParts() %50/%50 esitlikte sadelestirme UYGULANMAMASI testi tamam.");
}

console.log("Proje Inceleme Aciklamasi cogullama + blok bazinda ortak/ayri/sade cumle testleri basarili.");
