// "İncelenen Belgeler Açıklaması" (reviewedDocumentsDescription): ORTAK
// (rapor-geneli) kalır, ama artık BLOK BAZINDA ayrım gözetir (2026-08-19,
// devam). Kullanıcı talebi: "İncelenen belgeler açıklaması ortak olmalı
// yalnızca bu ortak açıklamada blok bazında ayrım gözetilmeli." Örnek: A
// Blok Ruhsat 16.11.2012-256/47, B Blok Ruhsat 18.12.2013-569/78 ->
// "...A Bloka ait 16.11.2012 tarih, 256/47 sayılı ..., B Bloka ait ...
// incelenmiştir." Bloklar AYNI belgeyi paylaşıyorsa ("ortak olarak cümle
// kurulabilir"): "A ve B Bloka ait ... incelenmiştir." Kat irtifakı DIŞI /
// tek blok / tekil taşınmaz raporlarda DAVRANIŞ DEĞİŞMEZ (blok etiketi
// YOK, eski düz joinTurkishList birleştirmesi).
//
// Kullanıcı, canlıda test ettikten sonra 2 bulgu bildirdi (2026-08-19,
// devam): (1) "A'ya ait" çıkıyor, "A Blok" olacak, "Blok" kelimesi hiç
// görünmüyor - taşınmazın Blok alanına yalnızca "A" (tek harf, "A Blok"
// DEĞİL) girildiğinde normalizeBlockLabelPrefixForAttribution'ın eski hali
// (stripBlockLabelSuffixForMerging) "Blok" kalıbına uymayan etiketlerde ham
// etiketi KULLANIP "Blok" kelimesini HİÇ EKLEMİYORDU - düzeltildi, artık
// HER ZAMAN "{ad} Blok'a ait" formatında. (2) 4 bloklu (A/C farklı
// tarih, B/D aynı tarih) bir örnekte C Blok açıklamada HİÇ görünmedi -
// KÖK NEDEN henüz netleştirilemedi (kullanıcıdan ek bilgi istendi); bu
// dosyaya kullanıcının TAM senaryosunu (4 blok, 2 farklı + 2 ortak tarih)
// birebir yansıtan bir regresyon senaryosu eklendi - saf algoritma
// SEVİYESİNDE dört bloğun hepsi doğru çıkıyor (bkz. senaryo 6), yani sorun
// buildDocumentsPermitGroupPhrase/collectDocumentsDescriptionRowGroups
// mantığında DEĞİL, muhtemelen canlı veri girişi/senkron zamanlamasında.
//
// Bu test kapsamı:
//  1) normalizeBlockLabelPrefixForAttribution(): "X Blok" kalıbından "X"i
//     çıkarır; kalıba uymayan ("A" gibi tek başına bir ad) ham etiketi
//     AYNEN döner (null DEĞİL - çağıran taraf her durumda "Blok" ekler).
//  2) formatDocumentBlockAttributionPhrase(): tek etiket ("A" -> "A Blok'a
//     ait", "A Blok" -> "A Blok'a ait" - İKİSİ DE AYNI SONUCU vermeli),
//     "Blok" kalıbına uyan/uymayan karışık etiketlerin birleştirilmesi.
//  3) buildDocumentsPermitGroupPhrase(): blok etiketi YOKSA eski davranış
//     (düz birleştirme); AYNI bloktan 2 farklı belge TEK "X Blok'a ait a,
//     b" öbeğinde; 2 FARKLI bloktan AYNI belge TEK "A ve B Blok'a ait"
//     öbeğinde; 2 farklı bloktan 2 farklı belge AYRI öbeklerde.
//  4) collectDocumentsDescriptionRowGroups(): gate KAPALIYKEN tek (etiketsiz)
//     grup + aktif taşınmazın tablosu; gate AÇIKKEN bloklara göre doğru
//     ayrılmış gruplar (her biri kendi temsilci taşınmazının tablosu).
//  5) buildReviewedDocumentsDescription() UÇTAN UCA (ağır bağımlılıklar
//     stub'lanmış): kullanıcının İLK ÖRNEK senaryosu - farklı bloklardan
//     farklı ruhsatlar doğru blok etiketleriyle tek cümlede; AYNI belge 2
//     bloktan geliyorsa "A ve B Blok'a ait" ile birleşiyor; TEKİL/kat-
//     irtifakı-dışı durumda blok etiketi HİÇ görünmüyor (regresyon); Blok
//     alanına yalnızca TEK HARF ("A") girilse bile "A Blok'a ait" çıkıyor.
//  6) buildReviewedDocumentsDescription() 4 BLOKLU senaryo (kullanıcının
//     ikinci bulgusunun BİREBİR yansıması: A/C farklı tarih, B/D aynı
//     tarih) - TÜM 4 bloğun açıklamada göründüğü doğrulanır.

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
  "normalizeBlockLabelPrefixForAttribution",
  "formatDocumentBlockAttributionPhrase",
  "buildDocumentsPermitGroupPhrase",
  "collectDocumentsDescriptionRowGroups",
  "buildReviewedDocumentsDescription",
  "buildDocumentsOccupancyParts",
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
  "isDocumentsBlockGroupingActive",
  "isPermitLikeDocument",
  "formatReviewedDocumentReference",
  // landUnitValue paylasimli-deger bindirme duzeltmesi (2026-08-22) icin -
  // getTitleUnitFieldsForLabel artik bunlara bagimli.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  // EKB'nin de "ortak aciklama" (blok bazinda ayrim) mantigina alinmasi
  // (2026-08-23, kullanici talebi: "burada incelenen belgelerde ortak
  // aciklama mantigi vardi EKB de de aynisi olmali") - buildEkbExplanation
  // (asagida) yine gozlemlenebilir bir stub, ama buildEkbExplanationParts()'in
  // KENDISI (blok-bazinda evet/hayir dallanmasi + getEkbInspectionLead)
  // GERCEK kaynaktan calistirilir.
  "buildEkbExplanationParts",
  "getEkbInspectionLead",
  "getEkbInspectionDateIso",
  // 2026-09-15 (kullanıcı talebi: "İncelenen Belgeler Açıklaması ise yine
  // ortak cümle çoklu formata uygun olacak") — farklı ada/parsel (Kat
  // İrtifakı dışı) çoklu rapor dalı, Madde 4'ün (0.0.788) PAYLAŞTIĞI
  // parsel etiketleyici/atfı.
  "isMultiTitleUnitReportForNarrative",
  "getNarrativeTitleUnitFields",
  "hasMixedTitleUnitParcels",
  "computeDocumentsParcelGroupLabel",
  "formatTitleUnitParcelLabel",
  "formatParcelAttributionPhrase",
  // 2026-09-15 (kullanıcı bulgusu, "olmamış" — hiçbir parselin belge
  // tablosu dolu değilken buildMissingReviewedDocumentSentences() tekil
  // kalıyordu) — çoğullama için.
  "pluralizeEnvironmentalSubjectText",
];

// Ağır/kapsam-dışı bağımlılıklar (bu testin odağı DEĞİL, mevcut/değişmeyen
// kod) diğer test dosyalarındaki AYNI emsalle (bkz. test-documents-units-
// summary-table.js normalizeReviewedDocumentRow stub'ı) basit, davranışı
// KORUYAN stub'larla değiştirilir:
//  - normalizeReportTitleText/normalizeReportDescriptionText: kimlik
//    (identity) - metin normalizasyonu bu testin kapsamı değil.
//  - normalizeReviewedDocumentRow/getReviewedDocumentChronologicalEntries:
//    basit c0-c4 eşlemesi (gerçek fonksiyonların foldTurkish/dateTrToIso
//    zincirine GİRMEDEN).
//  - dateIsoToTr: kimlik - test fixture'ları ZATEN "16.11.2012" gibi
//    TR-bicimli sabit metinler kullanıyor.
//  - buildDocumentArchivePrefix/buildOccupancyPermitDocumentSentence/
//    buildMissingReviewedDocumentSentences/buildEkbExplanation/
//    isOccupancyPermitDocument: sabit/basit stub'lar - bu testin odağı
//    SADECE blok-bazlı gruplama/birleştirme mantığı.
//  - joinTurkishList: app.js'te AYNI ad ALTI 4 KEZ tanımlı (script-seviyesi
//    fonksiyon bildirimleri, EN SONUNCUSU kazanır) - gerçek çalışma zamanı
//    davranışını YANSITAN elle yazılmış eşdeğer kopya (cleanupPlaceName
//    yalnızca boşluk normalize eder, zararsız - bkz. app.js:30047).
const sandboxSource = `
  let state = {};
  function normalizeReportTitleText(value) { return String(value || ""); }
  function normalizeReportDescriptionText(value) { return String(value || "").trim(); }
  function dateIsoToTr(value) { return String(value || ""); }
  function joinTurkishList(items = []) {
    const clean = (items || []).map((item) => String(item || "").replace(/\\s+/g, " ").trim()).filter(Boolean);
    if (!clean.length) return "";
    if (clean.length === 1) return clean[0];
    if (clean.length === 2) return \`\${clean[0]} ve \${clean[1]}\`;
    return \`\${clean.slice(0, -1).join(", ")} ve \${clean[clean.length - 1]}\`;
  }
  function normalizeReviewedDocumentRow(row = {}) {
    return { type: String(row.c0 || "").trim(), institution: String(row.c1 || "").trim(), date: String(row.c2 || "").trim(), no: String(row.c3 || "").trim(), scope: String(row.c4 || "").trim() };
  }
  function getReviewedDocumentChronologicalEntries(rows = []) {
    return (rows || []).map((row, index) => ({ row, index }));
  }
  function buildDocumentArchivePrefix(institution = "") {
    return \`PREFIX(\${institution || "DEFAULT"})\`;
  }
  // Turkce buyuk/kucuk harf katlama tuzagi: naif bir /i regex bayragi
  // "Kullanım"daki noktasiz "ı" ile eslesmez (Unicode varsayilan katlama
  // Turkce degildir) - gercek isBuildingCompletionOccupancyDocument()'in
  // AYNI teknigi (foldTurkish, zaten extract edilmis) kullanilir.
  function isOccupancyPermitDocument(type) {
    const text = foldTurkish(type || "");
    return text.includes("ISKAN") || text.includes("KULLANMA") || text.includes("KULLANIM") || text.includes("OTURMA");
  }
  function buildOccupancyPermitDocumentSentence(row = {}) {
    if (!row.date || !row.no) return "OLD_MISSING_OCCUPANCY_SENTENCE";
    return \`OCCUPANCY_FOUND(\${row.date},\${row.no})\`;
  }
  // 2026-09-15: gerçekçi "taşınmaza ait" kalıbı taşıyan bir sabit metin
  // kullanılıyor (önceki "MISSING_SENTENCE" opak stub'u DEĞİL) - çağıran
  // tarafın (buildReviewedDocumentsDescription) etrafına eklediği
  // pluralizeEnvironmentalSubjectText() çoğullamasının GÖZLEMLENEBİLİR
  // olması için (bu testin odağı buildMissingReviewedDocumentSentences'in
  // KENDİ iç mantığı DEĞİL, çağıranın onu çoğullama şekli).
  function buildMissingReviewedDocumentSentences() {
    return [
      "PREFIX(DEFAULT) yapılan incelemelerde taşınmaza ait yapı kullanma izin belgesi bulunamamıştır.",
      "PREFIX(DEFAULT) yapılan incelemelerde taşınmaza ait yeni yapı ruhsatı bulunamamıştır.",
    ];
  }
  // Gozlemlenebilir stub (2026-08-23) - gercek cumle metni bu dosyanin
  // odagi DEGIL (ruhsat/izin blok-gruplama mantigi); yalnizca
  // buildEkbExplanationParts()'in DOGRU fields/attribution'la cagirdigini
  // dogrulamak icin isaretli bir deger doner.
  function buildEkbExplanation(fields = state.fields, attribution = "") {
    if ((fields || {}).hasEkb === "Evet") return attribution ? \`EKB_FOUND[\${attribution}]\` : "EKB_FOUND";
    return "";
  }
  function normalizeYesNoChoice(value) {
    const text = String(value || "").trim();
    return text === "Evet" || text === "Hayır" ? text : "";
  }
  function dateTrToIso(value) { return String(value || ""); }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    normalizeBlockLabelPrefixForAttribution, formatDocumentBlockAttributionPhrase,
    buildDocumentsPermitGroupPhrase, collectDocumentsDescriptionRowGroups,
    buildReviewedDocumentsDescription, buildDocumentsOccupancyParts, isDocumentsBlockGroupingActive,
    buildEkbExplanationParts,
    hasMixedTitleUnitParcels, computeDocumentsParcelGroupLabel, formatParcelAttributionPhrase,
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

// --- 1) normalizeBlockLabelPrefixForAttribution() -------------------------
{
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution("A Blok"), "A", "'A Blok' -> 'A' donmeli.");
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution("B blok"), "B", "Kucuk harfli 'blok' de eslesmeli (case-insensitive).");
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution("1. Blok"), "1.", "'1. Blok' -> '1.' donmeli.");
  // REGRESYON (kullanici bulgusu): "Blok" kalibina UYMAYAN (kullanicinin
  // Blok alanina yalnizca TEK HARF girdigi) etiketlerde artik null DEGIL,
  // ham etiketin KENDISI donmeli - cagiran taraf HER ZAMAN "Blok" ekleyecek.
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution("A"), "A", "'Blok' kalibina uymayan (yalnizca 'A') etiket AYNEN donmeli (null DEGIL).");
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution("Kule 1"), "Kule 1", "Serbest metin bir blok adi da AYNEN donmeli.");
  assert.equal(fns.normalizeBlockLabelPrefixForAttribution(""), "", "Bos girdide bos string donmeli.");
  console.log("normalizeBlockLabelPrefixForAttribution testi tamam.");
}

// --- 2) formatDocumentBlockAttributionPhrase() ----------------------------
{
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["A Blok"]), "A Blok'a ait", "Tek etiket icin 'X Blok\\'a ait' donmeli.");
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["A Blok", "B Blok"]), "A ve B Blok'a ait", "Iki 'X Blok' etiketi TEK 'Blok' kelimesiyle birlesmeli (kullanici ornegi).");
  // REGRESYON (kullanici bulgusu, 2026-08-19): Blok alanina yalnizca "A"
  // (tek harf, "A Blok" DEGIL) girilse bile sonuc AYNI "A Blok'a ait"
  // olmali - "Blok" kelimesi ASLA kaybolmamali.
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["A"]), "A Blok'a ait", "Yalnizca 'A' etiketiyle bile 'A Blok\\'a ait' cikmali (Blok kelimesi eklenmeli).");
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["A", "B"]), "A ve B Blok'a ait", "Iki 'tek harf' etiket de TEK 'Blok' kelimesiyle birlesmeli.");
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["Kule 1"]), "Kule 1 Blok'a ait", "Serbest metin bir etikete de 'Blok' kelimesi eklenmeli.");
  assert.equal(fns.formatDocumentBlockAttributionPhrase(["Kule 1", "B Blok"]), "Kule 1 ve B Blok'a ait", "Karisik (biri zaten 'Blok' ile bitiyor) etiketler TEK 'Blok' kelimesiyle birlesmeli.");
  assert.equal(fns.formatDocumentBlockAttributionPhrase([]), "", "Bos liste icin bos string donmeli.");
  console.log("formatDocumentBlockAttributionPhrase testi tamam.");
}

// --- 3) buildDocumentsPermitGroupPhrase() ---------------------------------
{
  const blockOrder = new Map([["A Blok", 0], ["B Blok", 1]]);

  // 3a) Blok etiketi YOK (kat irtifaki disi/tekil) -> eski duz birlestirme.
  const noBlockItems = [{ referenceText: "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", blockLabel: null }];
  assert.equal(fns.buildDocumentsPermitGroupPhrase(noBlockItems, blockOrder), "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", "Blok etiketi yokken eski davranis (duz referans) korunmali.");

  // 3b) 2 FARKLI bloktan 2 FARKLI belge -> AYRI ogeler, virgulle birlesir.
  const differentItems = [
    { referenceText: "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", blockLabel: "A Blok" },
    { referenceText: "18.12.2013 tarih, 569/78 sayılı Yeni Yapı Ruhsatı", blockLabel: "B Blok" },
  ];
  const differentPhrase = fns.buildDocumentsPermitGroupPhrase(differentItems, blockOrder);
  assert.equal(differentPhrase, "A Blok'a ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı, B Blok'a ait 18.12.2013 tarih, 569/78 sayılı Yeni Yapı Ruhsatı", `Farkli bloklardan farkli belgeler ayri ogeler olmali, bulunan: ${differentPhrase}`);

  // 3c) AYNI bloktan 2 FARKLI belge (Ruhsat + Tadilat) -> TEK "X Blok'a ait a, b" ogesi.
  const sameBlockItems = [
    { referenceText: "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", blockLabel: "A Blok" },
    { referenceText: "20.05.2015 tarih, 12/34 sayılı Tadilat Ruhsatı", blockLabel: "A Blok" },
  ];
  const sameBlockPhrase = fns.buildDocumentsPermitGroupPhrase(sameBlockItems, blockOrder);
  assert.equal(sameBlockPhrase, "A Blok'a ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı, 20.05.2015 tarih, 12/34 sayılı Tadilat Ruhsatı", `Ayni bloktan 2 farkli belge TEK 'X Blok\\'a ait' ogesinde birlesmeli, bulunan: ${sameBlockPhrase}`);

  // 3d) 2 FARKLI bloktan AYNI (birebir) belge -> TEK "A ve B Blok'a ait" ogesi.
  const identicalAcrossBlocks = [
    { referenceText: "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", blockLabel: "A Blok" },
    { referenceText: "16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", blockLabel: "B Blok" },
  ];
  const mergedPhrase = fns.buildDocumentsPermitGroupPhrase(identicalAcrossBlocks, blockOrder);
  assert.equal(mergedPhrase, "A ve B Blok'a ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı", `Iki bloktan AYNI belge TEK 'A ve B Blok\\'a ait' ogesinde birlesmeli (kullanici: 'ortak olarak cumle kurulabilir'), bulunan: ${mergedPhrase}`);

  console.log("buildDocumentsPermitGroupPhrase testi tamam.");
}

// --- 4) collectDocumentsDescriptionRowGroups() ----------------------------
{
  // 4a) Gate KAPALIYKEN (tekli talep) -> tek, etiketsiz grup, aktif tasinmazin tablosu.
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı" }] },
  }));
  const inactiveGroups = fns.collectDocumentsDescriptionRowGroups();
  assert.equal(inactiveGroups.length, 1, "Gate kapaliyken tek grup donmeli.");
  assert.equal(inactiveGroups[0].blockLabel, null, "Gate kapaliyken blok etiketi null olmali.");
  assert.deepEqual(inactiveGroups[0].rows, [{ c0: "Yeni Yapı Ruhsatı" }], "Gate kapaliyken aktif tasinmazin tablosu donmeli.");

  // 4b) Gate ACIKKEN (kat irtifaki + 2 farkli blok) -> bloklara gore ayrilmis gruplar.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
    },
    tables: { documents: [{ c0: "A-BLOK-BELGESI" }] },
    titleUnits: [{ fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: { documents: [{ c0: "B-BLOK-BELGESI" }] } }],
  }));
  const activeGroups = fns.collectDocumentsDescriptionRowGroups();
  assert.equal(activeGroups.length, 2, "Gate acikken 2 blok grubu donmeli.");
  assert.equal(activeGroups[0].blockLabel, "A Blok", "1. grup A Blok olmali.");
  assert.deepEqual(activeGroups[0].rows, [{ c0: "A-BLOK-BELGESI" }], "1. grubun kendi tablosu donmeli.");
  assert.equal(activeGroups[1].blockLabel, "B Blok", "2. grup B Blok olmali.");
  assert.deepEqual(activeGroups[1].rows, [{ c0: "B-BLOK-BELGESI" }], "2. grubun kendi tablosu donmeli.");

  console.log("collectDocumentsDescriptionRowGroups testi tamam.");
}

// --- 5) buildReviewedDocumentsDescription() UCTAN UCA ---------------------
{
  // 5a) Kullanicinin ORNEK senaryosu: A Blok ve B Blok'un FARKLI ruhsatlari.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" },
      tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "18.12.2013", c3: "569/78" }] },
    }],
  }));
  const description = fns.buildReviewedDocumentsDescription();
  assert.ok(description.includes("A Blok'a ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı"), `Aciklama A Blok'un kendi ruhsatini dogru etiketle icermeli, bulunan: ${description}`);
  assert.ok(description.includes("B Blok'a ait 18.12.2013 tarih, 569/78 sayılı Yeni Yapı Ruhsatı"), `Aciklama B Blok'un kendi ruhsatini dogru etiketle icermeli, bulunan: ${description}`);
  console.log("buildReviewedDocumentsDescription kullanici ornegi (farkli bloklar/farkli ruhsatlar) testi tamam.");

  // 5b) Bloklar AYNI belgeyi paylasiyorsa "A ve B Blok'a ait" ile birlesir.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" },
      tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    }],
  }));
  const mergedDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(mergedDescription.includes("A ve B Blok'a ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı"), `Iki blok AYNI belgeyi paylasiyorsa 'A ve B Blok\\'a ait' ile TEK kez gecmeli, bulunan: ${mergedDescription}`);
  assert.equal((mergedDescription.match(/256\/47/g) || []).length, 1, "Ayni belge (256/47) aciklamada YALNIZCA BIR KEZ gecmeli (birlesmis olmali).");
  console.log("buildReviewedDocumentsDescription ortak belge birlesimi (A ve B Blok'a ait) testi tamam.");

  // 5c) REGRESYON: Tekli Talep'te (blok gruplama KAPALI) blok etiketi HIC gorunmemeli.
  fns.setState(freshState({
    fields: {
      requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
  }));
  const singleDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(!singleDescription.includes("Blok'a ait"), `REGRESYON: Tekli Talep'te blok etiketi HIC gorunmemeli, bulunan: ${singleDescription}`);
  assert.ok(singleDescription.includes("256/47"), "Belge referansi yine de dogru gorunmeli.");
  console.log("buildReviewedDocumentsDescription regresyon (blok gruplama kapaliyken eski davranis) testi tamam.");

  // 5d) REGRESYON (kullanici bulgusu): Blok alanina yalnizca "A" (tek harf,
  // "A Blok" DEGIL) girilse bile aciklamada "A Blok'a ait" cikmali.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B" },
      tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "18.12.2013", c3: "569/78" }] },
    }],
  }));
  const shortLabelDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(shortLabelDescription.includes("A Blok'a ait"), `REGRESYON: Blok alanina yalnizca 'A' girilse bile 'A Blok\\'a ait' cikmali (Blok kelimesi kaybolmamali), bulunan: ${shortLabelDescription}`);
  assert.ok(shortLabelDescription.includes("B Blok'a ait"), `REGRESYON: 'B' etiketi de 'B Blok\\'a ait' cikmali, bulunan: ${shortLabelDescription}`);
  assert.ok(!shortLabelDescription.includes("A'ya ait"), "REGRESYON: 'A'ya ait' (Blok kelimesi olmadan) ARTIK gorunmemeli.");
  console.log("buildReviewedDocumentsDescription regresyon (Blok alanina tek harf girilse bile 'Blok' kelimesi eklenir) testi tamam.");
}

// --- 6) buildReviewedDocumentsDescription() 4 BLOKLU senaryo --------------
// (kullanicinin ikinci bulgusunun BIREBIR yansimasi, 2026-08-19): A ve C
// FARKLI tarih, B ve D AYNI tarih kullanildi; kullanici C Blok'un
// aciklamada HIC gorunmedigini bildirdi. Bu senaryo saf ALGORITMA
// seviyesinde TUM 4 bloğun dogru ciktigini dogrular - eğer bu test
// GECERSE, canlidaki kayip muhtemelen bu fonksiyonun kendi mantiginda
// DEGIL (veri girisi/senkron zamanlamasi ile ilgili, ayri arastirilmali).
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "01.01.2010", c3: "1/1" }] },
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "02.02.2020", c3: "2/2" }] } },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok" }, tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "03.03.2030", c3: "3/3" }] } },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "D Blok" }, tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "02.02.2020", c3: "2/2" }] } },
    ],
  }));
  const fourBlockDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(fourBlockDescription.includes("A Blok'a ait 01.01.2010 tarih, 1/1 sayılı Yeni Yapı Ruhsatı"), `A Blok'un kendi (farkli) ruhsati gorunmeli, bulunan: ${fourBlockDescription}`);
  assert.ok(fourBlockDescription.includes("B ve D Blok'a ait 02.02.2020 tarih, 2/2 sayılı Yeni Yapı Ruhsatı"), `B ve D Blok AYNI tarihi paylastigi icin TEK 'B ve D Blok\\'a ait' ogesinde birlesmeli, bulunan: ${fourBlockDescription}`);
  assert.ok(fourBlockDescription.includes("C Blok'a ait 03.03.2030 tarih, 3/3 sayılı Yeni Yapı Ruhsatı"), `KULLANICI BULGUSU: C Blok'un kendi (farkli) ruhsati de aciklamada MUTLAKA gorunmeli, bulunan: ${fourBlockDescription}`);
  console.log("buildReviewedDocumentsDescription 4 blok senaryosu (A/C farkli, B/D ortak - C Blok kayip DEGIL) testi tamam.");
}

// --- 7) buildDocumentsOccupancyParts() SAF FONKSIYON -----------------------
// Kullanıcı talebi (2026-08-19, devam): "eğer bir blok için yapı kullanma
// izin belgesi eklenmedi ise bu blokun yapı kullanma izin belgesinin
// bulunamadığı açıklamada belirtilmeli... C ve D Blokta yok ise
// 'Ekspertize konu taşınmazların yer aldığı C ve D Bloka ait yapı kullanma
// izin belgesi bulunamamıştır.' cümlesi gelmeli."
{
  const rowGroups = [
    { blockLabel: "A Blok" }, { blockLabel: "B Blok" }, { blockLabel: "C Blok" }, { blockLabel: "D Blok" },
  ];
  const blockOrder = new Map(rowGroups.map((g, i) => [g.blockLabel, i]));
  const rows = [
    { type: "Yapı Kullanım İzin Belgesi", date: "01.01.2015", no: "1/1", institution: "Merkez Belediyesi", blockLabel: "A Blok" },
    { type: "Yapı Kullanım İzin Belgesi", date: "02.02.2016", no: "2/2", institution: "Merkez Belediyesi", blockLabel: "B Blok" },
    // C Blok ve D Blok: HIC İskan satiri YOK (kullanicinin tam senaryosu).
  ];
  const parts = fns.buildDocumentsOccupancyParts(rowGroups, rows, blockOrder);
  const joined = parts.join(" | ");
  assert.ok(joined.includes("yer alan A Blok'a ait"), `A Blok'un bulunan belgesi kendi etiketiyle gorunmeli, bulunan: ${joined}`);
  assert.ok(joined.includes("yer alan"), `Bulunan bloklar icin normal 'incelenmistir' cumlesi olmali, bulunan: ${joined}`);
  assert.ok(joined.includes("Ekspertize konu taşınmazların yer aldığı C ve D Blok'a ait yapı kullanma izin belgesi bulunamamıştır."), `KULLANICI ORNEGI: C ve D Blok icin TAM BEKLENEN cumle gelmeli, bulunan: ${joined}`);
  console.log("buildDocumentsOccupancyParts saf fonksiyon (bulunan/bulunamayan bloklarin ayrimi) testi tamam.");
}

// --- 8) buildReviewedDocumentsDescription() UCTAN UCA: kullanicinin TAM ---
// senaryosu (A ve B'de var, C ve D'de yok).
{
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yapı Kullanım İzin Belgesi", c1: "Merkez Belediyesi", c2: "01.01.2015", c3: "1/1" }] },
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok" }, tables: { documents: [{ c0: "Yapı Kullanım İzin Belgesi", c1: "Merkez Belediyesi", c2: "02.02.2016", c3: "2/2" }] } },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok" }, tables: { documents: [] } },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "D Blok" }, tables: { documents: [] } },
    ],
  }));
  const description = fns.buildReviewedDocumentsDescription();
  assert.ok(description.includes("A Blok'a ait 01.01.2015 tarih, 1/1 sayılı Yapı Kullanım İzin Belgesi"), `A Blok'un bulunan Iskani gorunmeli, bulunan: ${description}`);
  assert.ok(description.includes("B Blok'a ait 02.02.2016 tarih, 2/2 sayılı Yapı Kullanım İzin Belgesi"), `B Blok'un bulunan Iskani gorunmeli, bulunan: ${description}`);
  assert.ok(description.includes("Ekspertize konu taşınmazların yer aldığı C ve D Blok'a ait yapı kullanma izin belgesi bulunamamıştır."), `KULLANICININ TAM ORNEK CUMLESI cikmali, bulunan: ${description}`);
  console.log("buildReviewedDocumentsDescription kullanicinin TAM senaryosu (A/B var, C/D yok) testi tamam.");
}

// --- 9) REGRESYON: blok gruplama KAPALIYKEN eski Iskan davranisi korunur --
{
  fns.setState(freshState({
    fields: {
      requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
  }));
  const description = fns.buildReviewedDocumentsDescription();
  assert.ok(!description.includes("Ekspertize konu taşınmazların yer aldığı"), `REGRESYON: Tekli Talep'te YENI 'Ekspertize konu...' cumlesi gorunmemeli (eski davranis korunmali), bulunan: ${description}`);
  assert.ok(description.includes("OLD_MISSING_OCCUPANCY_SENTENCE"), `REGRESYON: eski (genel, blok-etiketsiz) Iskan-yok cumlesi hala kullanilmali, bulunan: ${description}`);
  console.log("buildReviewedDocumentsDescription regresyon (blok gruplama kapaliyken eski Iskan davranisi) testi tamam.");
}

// --- 10) YENI (2026-08-23, kullanici talebi): "burada incelenen belgelerde
// ortak aciklama mantigi vardi EKB de de aynisi olmali" - buildEkbExplanationParts()
// blok gruplamasi AKTIFKEN "Evet" olan bloklar KENDI (blok-atifli) cumlesini
// alir, "Hayir" olan bloklar TEK birlesik "X ve Y Blok'a ait ... bulunamamistir."
// cumlesinde toplanir (buildDocumentsOccupancyParts'taki AYNI "bulunan/
// bulunamayan" ayrimi), bos/belirsiz olanlar HIC ETKI ETMEZ. --------------
{
  fns.setState(freshState({
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasEkb: "Evet" },
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", hasEkb: "Hayır" }, tables: {} },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "C Blok", hasEkb: "Hayır" }, tables: {} },
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "D Blok" }, tables: {} },
    ],
  }));
  const parts = fns.buildEkbExplanationParts();
  assert.equal(parts.length, 2, `Bulunan (A) + birlesik bulunamayan (B+C) icin TOPLAM 2 parca beklenirdi (D bos oldugu icin hic etki etmez), bulunan: ${JSON.stringify(parts)}`);
  assert.ok(parts.includes("EKB_FOUND[A Blok'a ait]"), `A Blok'un (Evet) kendi blok-atifli cumlesi bulunmali, bulunan: ${JSON.stringify(parts)}`);
  const missingSentence = parts.find((part) => part !== "EKB_FOUND[A Blok'a ait]");
  assert.ok(missingSentence, "Birlesik 'bulunamamistir' cumlesi bulunamadi.");
  assert.ok(missingSentence.includes("B ve C Blok'a ait Enerji Kimlik Belgesi bulunamamıştır."), `B+C (Hayir) TEK birlesik cumlede olmali, bulunan: ${missingSentence}`);
  assert.ok(!missingSentence.includes("D Blok"), `D Blok (bos hasEkb) hic gorunmemeliydi, bulunan: ${missingSentence}`);
  console.log("buildEkbExplanationParts blok-bazli evet/hayir ayrimi testi tamam.");
}

// --- 10b) buildEkbExplanationParts(): blok gruplama KAPALIYKEN eski -------
// (tekil, blok-atifsiz) buildEkbExplanation() davranisi AYNEN korunur -----
{
  fns.setState(freshState({
    fields: { requestType: "Tekli Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasEkb: "Evet" },
  }));
  const parts = fns.buildEkbExplanationParts();
  assert.deepEqual(parts, ["EKB_FOUND"], `Tekli/blok-gruplamasiz raporda blok atifsiz TEK 'EKB_FOUND' donmeli (regresyon), bulunan: ${JSON.stringify(parts)}`);
  console.log("buildEkbExplanationParts regresyon (blok gruplama kapaliyken eski davranis) testi tamam.");
}

// --- 10c) buildReviewedDocumentsDescription(): EKB parcalari ruhsat/izin --
// cumlelerinin ARDINDAN birlesik metne eklenir (uctan uca kablolama) ------
{
  fns.setState(freshState({
    fields: { requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı", blockNo: "100", parcelNo: "1", titleBlockName: "A Blok", hasEkb: "Evet" },
    tables: { documents: [] },
    titleUnits: [
      { fields: { blockNo: "100", parcelNo: "1", titleBlockName: "B Blok", hasEkb: "Hayır" }, tables: { documents: [] } },
    ],
  }));
  const description = fns.buildReviewedDocumentsDescription();
  assert.ok(description.includes("EKB_FOUND[A Blok'a ait]"), `buildReviewedDocumentsDescription() EKB (Evet) parcasini icermeli, bulunan: ${description}`);
  assert.ok(description.includes("B Blok'a ait Enerji Kimlik Belgesi bulunamamıştır."), `buildReviewedDocumentsDescription() EKB (Hayir) parcasini icermeli, bulunan: ${description}`);
  console.log("buildReviewedDocumentsDescription EKB parcalari uctan uca kablolama testi tamam.");
}

// --- 11) Kullanıcı talebi (2026-09-15): "İncelenen Belgeler Açıklaması ---
// ise yine ortak cümle çoklu formata uygun olacak" — farklı ada/parsel
// (Kat İrtifakı DIŞI, isDocumentsBlockGroupingActive HER ZAMAN false)
// çoklu raporlarda önceden yalnızca AKTİF taşınmazın belge tablosu
// yansıyordu, diğer parsellerin belgeleri TAMAMEN kayboluyordu — Madde 4
// (0.0.788) proje açıklamasında düzelttiği AYNI kusur. "Blok" yerine
// "{Ada} Ada {Parsel} Parsel" etiketi/atfı kullanılır.
{
  // 11a) 2 farklı parsel, FARKLI ruhsatlar -> HER İKİSİ DE kendi parsel
  // atfıyla görünmeli (eskiden yalnızca aktif/56 parselin ruhsatı görünürdü).
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "0", parcelNo: "315", titleBlockName: "" },
      tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "18.12.2013", c3: "569/78" }] },
    }],
  }));
  assert.equal(fns.isDocumentsBlockGroupingActive(), false, "sanity: Mustakil Bina'da isDocumentsBlockGroupingActive() HER ZAMAN false olmali.");
  assert.equal(fns.hasMixedTitleUnitParcels(), true, "sanity: 0/56 ve 0/315 farkli parsel sayilmali.");
  const mixedDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(mixedDescription.includes("0 Ada 56 Parsel taşınmazına ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı"), `56 parselin kendi ruhsati parsel atfiyla gorunmeli, bulunan: ${mixedDescription}`);
  assert.ok(mixedDescription.includes("0 Ada 315 Parsel taşınmazına ait 18.12.2013 tarih, 569/78 sayılı Yeni Yapı Ruhsatı"), `315 parselin ruhsati da gorunmeli - eskiden bu TAMAMEN kayboluyordu, bulunan: ${mixedDescription}`);
  assert.ok(!mixedDescription.includes("Blok'a ait"), `Farkli parselli raporda ESKI 'Blok'a ait' etiketi ASLA gorunmemeli, bulunan: ${mixedDescription}`);

  console.log("buildReviewedDocumentsDescription() farkli ada/parsel + FARKLI ruhsatlar -> parsel atifli, kayipsiz testi tamam.");
}
{
  // 11b) 2 farklı parsel AYNI belgeyi paylaşıyorsa "X ve Y taşınmazlarına
  // ait" ile TEK kez birleşmeli (formatDocumentBlockAttributionPhrase'in
  // "A ve B Blok'a ait" birleştirmesiyle AYNI ilke, parsel bağlamında).
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "0", parcelNo: "315", titleBlockName: "" },
      tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    }],
  }));
  const sharedDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(sharedDescription.includes("0 Ada 56 Parsel ve 0 Ada 315 Parsel taşınmazlarına ait 16.11.2012 tarih, 256/47 sayılı Yeni Yapı Ruhsatı"), `Iki parsel AYNI belgeyi paylasiyorsa TEK birlesik parsel atfinda gecmeli, bulunan: ${sharedDescription}`);
  assert.equal((sharedDescription.match(/256\/47/g) || []).length, 1, "Ayni belge (256/47) aciklamada YALNIZCA BIR KEZ gecmeli (birlesmis olmali).");

  console.log("buildReviewedDocumentsDescription() farkli ada/parsel + AYNI belge -> birlesik parsel atfi testi tamam.");
}
{
  // 11c) İskan (yapı kullanma izin belgesi) eksik-parsel cümlesi de parsel
  // atfıyla kurulmalı (buildDocumentsOccupancyParts'ın rowGroups.length
  // tabanlı yeni gate'i, "Blok"tan bağımsız).
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yapı Kullanım İzin Belgesi", c1: "Merkez Belediyesi", c2: "01.01.2015", c3: "1/1" }] },
    titleUnits: [{
      fields: { blockNo: "0", parcelNo: "315", titleBlockName: "" },
      tables: { documents: [] },
    }],
  }));
  const occupancyDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(occupancyDescription.includes("0 Ada 56 Parsel taşınmazına ait 01.01.2015 tarih, 1/1 sayılı Yapı Kullanım İzin Belgesi"), `56 parselin bulunan Iskani parsel atfiyla gorunmeli, bulunan: ${occupancyDescription}`);
  assert.ok(occupancyDescription.includes("Ekspertize konu taşınmazların yer aldığı 0 Ada 315 Parsel taşınmazına ait yapı kullanma izin belgesi bulunamamıştır."), `315 parselin eksik Iskani parsel atfiyla belirtilmeli, bulunan: ${occupancyDescription}`);
  assert.ok(!occupancyDescription.includes("Blok"), `Farkli parselli raporda 'Blok' kelimesi HIC gecmemeli, bulunan: ${occupancyDescription}`);

  console.log("buildReviewedDocumentsDescription() farkli ada/parsel + eksik Iskan -> parsel atifli 'bulunamamistir' testi tamam.");
}
{
  // 11d) REGRESYON: AYNI ada/parselde 2+ bağımsız bölüm (hasMixedTitleUnitParcels
  // false) -> eski (parsel etiketsiz, düz) davranış korunmalı — bu dal
  // YALNIZCA gerçekten FARKLI parsellerde devreye girmeli.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [{ c0: "Yeni Yapı Ruhsatı", c1: "Merkez Belediyesi", c2: "16.11.2012", c3: "256/47" }] },
    titleUnits: [{
      fields: { blockNo: "0", parcelNo: "56", titleBlockName: "" },
      tables: { documents: [] },
    }],
  }));
  assert.equal(fns.hasMixedTitleUnitParcels(), false, "sanity: ayni ada/parselde 2 bagimsiz bolum FARKLI parsel SAYILMAMALI.");
  const samePartcelDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(!samePartcelDescription.includes("taşınmazına ait") && !samePartcelDescription.includes("taşınmazlarına ait"), `Ayni ada/parselde parsel atfi EKLENMEMELI (eski duz davranis korunmali), bulunan: ${samePartcelDescription}`);
  assert.ok(samePartcelDescription.includes("256/47"), "Belge referansi yine de dogru gorunmeli.");

  console.log("buildReviewedDocumentsDescription() REGRESYON (ayni ada/parsel -> parsel atfi YOK) testi tamam.");
}

// --- 12) Kullanıcı bulgusu (2026-09-15, "olmamış" — canlı rapor ekran ----
// görüntüsü): farklı ada/parsel çoklu bir raporda HİÇBİR parselin belge
// tablosu dolu değilse ("19.08.2026 tarihinde, Gürsu Belediyesi İmar Arşiv
// dosyasında yapılan incelemelerde taşınmaza ait yapı kullanma izin belgesi
// bulunamamıştır." + aynı tekil kalıpta ruhsat cümlesi) rows.length === 0
// olduğundan Madde 4'ün 11 numaralı senaryolardaki parsel-birleştirme dalı
// HİÇ DEVREYE GİRMİYORDU — buildMissingReviewedDocumentSentences() rapor-
// geneli SABİT metinler ürettiğinden (taşınmaza-özgü veri yok) yalnızca
// özne çoğullanır, parsel etiketine gerek yok.
{
  // 12a) Farklı ada/parsel (Müstakil Bina) + HER İKİ parselin de belge
  // tablosu BOŞ -> her iki cümle de coğul ("taşınmazlara ait") olmalı.
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [] },
    titleUnits: [{
      fields: { blockNo: "0", parcelNo: "315", titleBlockName: "" },
      tables: { documents: [] },
    }],
  }));
  assert.equal(fns.hasMixedTitleUnitParcels(), true, "sanity: 0/56 ve 0/315 farkli parsel sayilmali.");
  const emptyMixedDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(emptyMixedDescription.includes("taşınmazlara ait yapı kullanma izin belgesi bulunamamıştır."), `Iskan-yok cumlesi COGUL olmali, bulunan: ${emptyMixedDescription}`);
  assert.ok(emptyMixedDescription.includes("taşınmazlara ait yeni yapı ruhsatı bulunamamıştır."), `Ruhsat-yok cumlesi de COGUL olmali, bulunan: ${emptyMixedDescription}`);
  assert.ok(!emptyMixedDescription.includes("taşınmaza ait"), `Eski TEKIL 'tasinmaza ait' kalibi KALMAMALI, bulunan: ${emptyMixedDescription}`);

  console.log("buildReviewedDocumentsDescription() farkli ada/parsel + HICBIR belge yokken cogul ozne testi tamam.");
}
{
  // 12b) Aynı ada/parsel (hasMixedTitleUnitParcels false) çoklu bağımsız
  // bölüm + belge tablosu BOŞ -> yine çoğul olmalı (yalnızca farklı
  // parselle SINIRLI bir düzeltme DEĞİL, isMultiTitleUnitReportForNarrative
  // TEK basina yeterli).
  fns.setState(freshState({
    fields: {
      requestType: "Çoklu Talep", ownershipType: "Yatay Kat İrtifakı",
      blockNo: "100", parcelNo: "1", titleBlockName: "A Blok",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [] },
    titleUnits: [{
      fields: { blockNo: "100", parcelNo: "1", titleBlockName: "A Blok" },
      tables: { documents: [] },
    }],
  }));
  assert.equal(fns.hasMixedTitleUnitParcels(), false, "sanity: ayni ada/parselde 2 bagimsiz bolum FARKLI parsel SAYILMAMALI.");
  const emptySameParcelDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(emptySameParcelDescription.includes("taşınmazlara ait yapı kullanma izin belgesi bulunamamıştır."), `Ayni ada/parselde COKLU bagimsiz bolum de cogul olmali, bulunan: ${emptySameParcelDescription}`);

  console.log("buildReviewedDocumentsDescription() ayni ada/parsel coklu + HICBIR belge yokken cogul ozne testi tamam.");
}
{
  // 12c) REGRESYON: tekil taşınmaz + belge tablosu boş -> TEKİL kalmalı.
  fns.setState(freshState({
    fields: {
      requestType: "Tekli Talep", ownershipType: "Müstakil Bina",
      blockNo: "0", parcelNo: "56", titleBlockName: "",
      documentReviewInstitution: "Merkez Belediyesi",
    },
    tables: { documents: [] },
  }));
  const singleEmptyDescription = fns.buildReviewedDocumentsDescription();
  assert.ok(singleEmptyDescription.includes("taşınmaza ait yapı kullanma izin belgesi bulunamamıştır."), `Tekil tasinmazda TEKIL kalmali (regresyon), bulunan: ${singleEmptyDescription}`);
  assert.ok(!singleEmptyDescription.includes("taşınmazlara ait"), `Tekil tasinmazda COGUL OLMAMALI (regresyon), bulunan: ${singleEmptyDescription}`);

  console.log("buildReviewedDocumentsDescription() tekil tasinmaz + HICBIR belge yokken TEKIL kalmasi (REGRESYON) testi tamam.");
}

console.log("Incelenen Belgeler Aciklamasi blok-bazli gruplama testleri basarili.");
