// "İç Hacimler Açıklaması (Çoklu Taşınmaz)" — çoklu taleplerde bağımsız
// bölümlerin İç Hacimler Açıklaması metinlerini birleştirir (2026-09-03).
// Kullanıcı talebi #1: "geçelim aynı ada parsel bağımsız bölüm özellikleri
// çoklu çalışma açıklamalarına." AskUserQuestion ile netleştirildi:
// (1) İç Hacimler Açıklaması (unitInteriorDescription — HER bağımsız
// bölümün KENDİ oda/salon/mutfak vb. bileşimini anlatan, taşınmaza-özgü
// metin), (2) "aynı/benzer metinleri TEK cümlede birleştir".
//
// Kullanıcı DÜZELTMESİ #2 (iki işaretli GERÇEK örnekle): "İç Hacimler
// Açıklaması (Çoklu Taşınmaz) bölümünde DEKORATİF özellikler olmasın."
// İLK sürüm kaynak olarak DOĞRUDAN `unitInteriorDescription` (canlı
// panelin TAMAMI — intro + alan/oda kompozisyonu + Dekoratif Özellikler
// Açıklaması ÜÇLÜSÜ) okuyordu. Kullanıcının işaretlediği örnekte HEM
// Dekoratif Özellikler HEM DE intro'nun İÇİNDEKİ "binanın 1. Normal
// Katında yer alan," gibi KAT referansı çizilmişti — kat bilgisi HER
// bağımsız bölüme özgüdür, benzer oda/alan bileşimine sahip ama FARKLI
// kattaki bağımsız bölümler TEK grupta birleşince bu ifade YANILTICI
// olurdu. Düzeltme: artık `buildUnitInteriorDescriptionParts()`'ın YENİ
// `areaDetails` alanı (ne intro ne decorative — yalnızca kat/alan/oda-
// hacim kompozisyonu) kaynak alınıyor; HER taşınmaz için `state.fields`/
// `state.tables` GEÇİCİ olarak o taşınmazınkiyle değiştirilerek TEKRAR
// hesaplanır (buildProjectReviewConsolidatedParts'taki AYNI teknik).
//
// Bu test dosyasında `buildUnitInteriorDescriptionParts()` (GERÇEK
// fonksiyon, kat satırları/registerVariantGroup zincirine bağımlı, bu
// testin kapsamı DIŞINDA) BİLEREK extract EDİLMEZ — davranış-koruyan
// basit bir SAHTE: `state.fields.mockAreaDetails`'i aynen döner (diğer
// test dosyalarındaki AYNI "generatörü sahtele, birleştirme/gruplama
// mantığını GERÇEK test et" konvansiyonu — bkz. test-multi-unit-open-address.js'in
// buildOpenAddressText SAHTEsi).
//
// Kapsam kararı: ada/parsel eşitliğine BAKILMAZ (yalnızca "2+ taşınmaz
// var mı") — İç Hacimler bileşimi ada/parsel'e değil bağımsız bölümün
// KENDİSİNE bağlı olduğundan Bağımsız Bölüm Özeti tablosunun kendisiyle
// (o da ada/parsel-koşullu DEĞİL) TUTARLIDIR.
//
// Kullanıcı DÜZELTMESİ #3 (üçüncü işaretli GERÇEK örnekle, RENK kodlu):
// "A5, A10 ve A11: Taşınmazlar 131 m2... oluşmaktadırlar." — "-lar"
// ekleri KIRMIZI ile işaretlenmişti. AskUserQuestion ile netleştirildi:
// "Evet, çoğullansın" — 2+ bağımsız bölüm TEK grupta birleşince (atıflı
// olsun ya da olmasın) metin gramer olarak ÇOĞULLANMALI. Kapsam BİLİNÇLİ
// OLARAK dar: yalnızca cümlenin ÇIPLAK "Taşınmaz" ÖZNESİYLE başladığı
// durumlar (bkz. pluralizeUnitInteriorAreaSentence yorumu) — kat adı
// öznesiyle başlayan çok-katlı cümleler VE "Taşınmazın"/"Taşınmazda"
// (genitif/lokatif) ile başlayan teras/dükkan cümleleri kendi doğru
// Türkçe gramerini KORUR (bkz. UNIT_INTERIOR_AREA_VERB_ENDING_PLURAL_MAP
// yorumu).
//
// LANDMINE UYARISI (test-multi-unit-open-address.js'teki AYNI uyarı):
// app.js'te 4 ayrı `function joinTurkishList(...)` var, aynı isim aynı
// scope'ta olduğundan SONUNCUSU (cleanupPlaceName() ile KML'e özgü
// temizlik yapan) TÜM çağrı yerlerinde kazanır — formatTitleUnitAttributionPhrase()
// bu fonksiyona (dolaylı olarak, formatDocumentBlockAttributionPhrase
// üzerinden) BAĞIMLI olduğundan, bu test GERÇEK çalışma zamanı davranışını
// yansıtmak için extractFunction'ın normal İLK-eşleşme mantığı YERİNE
// özel bir extractLastFunction ile SONUNCU (kazanan) tanımı çeker.
//
// Kullanıcı DÜZELTMESİ #4 (2026-09-03): "dekoratif özellikleri ortak
// olarak yazmamız gerekiyor" — #2'de BİLEREK dışlanan Dekoratif Özellikler
// artık AYRI bir alan DEĞİL (AskUserQuestion: "Önerilen" seçenek), BU
// ALANIN (unitInteriorDescriptionMulti) SONUNA YENİ BİR PARAGRAF olarak
// geri eklendi. Kaynak `getUnitDecorativeDescriptionForCombinedText()`
// (HER taşınmaz için AYNI state-swap tekniğiyle) — %90-benzerlik gruplama
// çekirdeği areaDetails İLE PAYLAŞIMLI hale getirildi
// (groupUnitInteriorTextEntries/composeMultiUnitInteriorGroupedText, YENİ
// çıkarılan ortak yardımcılar) ama ÇOĞULLAMA UYGULANMAZ (Dekoratif
// Özellikler cümleleri UNIT_INTERIOR_AREA_VERB_ENDING_PLURAL_MAP'in
// kapalı fiil-sonu kümesinin kapsamı DIŞINDA çok daha çeşitli özne/fiil
// kalıpları kullanır — yanlış çoğul eki riski).
//
// Kapsanan senaryolar:
//  1) Tekil rapor (1 taşınmaz): state.fields.unitInteriorDescription
//     AYNEN döner (davranış DEĞİŞMEDİ — İÇ HACİMLER Açıklaması'nın TEK
//     alan hali için areaDetails-only kısıtlaması UYGULANMAZ, bkz. yorum).
//  2) 2+ taşınmaz, TÜM areaDetails AYNI: atıf EKLENMEDEN TEK, ortak metin.
//  3) 2+ taşınmaz, TÜM areaDetails %90+ BENZER (yazım/noktalama farkı):
//     YİNE TEK, ortak (İLK yazılan) metin.
//  4) 2+ taşınmaz, 2 FARKLI (birbirine benzemeyen) areaDetails grubu:
//     HER grup KENDİ atıflı ("A 2 No'lu: ...") cümlesinde ayrı kalır.
//  5) Boş/whitespace-only areaDetails dışarıda bırakılır (gruplamaya
//     KATILMAZ).
//  6) HER taşınmaz için state.fields/state.tables GEÇİCİ değiştirilip
//     SONRADA ORİJİNALİNE dönüyor mu (yan etki sızıntısı YOK).
//  7) buildUnitInteriorDescriptionParts()'ın GERÇEK gövdesi artık
//     `areaDetails` alanını (hem dolu-satır hem boş-satır dallarında)
//     döndürüyor mu (kaynak-düzeyi).
//  8) buildMultiUnitInteriorDescriptionText()'in GERÇEK gövdesi
//     `.details`/`unitInteriorDescription` DEĞİL, `.areaDetails`'ı
//     okuyor mu (kaynak-düzeyi REGRESYON — "dekoratif/kat sızıntısı"
//     hatasının GERİ GELMEDİĞİNİ doğrular).
//  9) explanations bölümünde yeni alan tanımı (kaynak-düzeyi).
//  10) refreshMultiUnitInteriorDescriptionTextFromCurrentFields merkezi
//      dispatcher'a (2 çağrı noktası) + koşulsuz "Açıklamalar" render
//      tazeleyicisine + setUnitFloorRows()'a (kat satırı düzenleme,
//      field.key ÜRETMEYEN TEK gerçek tetikleyici) kablolanmış mı.
//  11) template-engine.js'te {{ICHACIMLERACIKLAMASICOKLU}} kayıtlı mı.
//  12) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı.
//  13) Dekoratif Özellikler: 2+ taşınmaz AYNI dekoratif metni ürettiyse
//      ortak (atıfsız, ÇOĞULLANMAMIŞ) TEK paragraf, alan/oda paragrafının
//      HEMEN ALTINDA ("\n" ile ayrı) eklenir.
//  14) Dekoratif Özellikler: 2 FARKLI grup -> HER grup kendi atıflı
//      cümlesinde ayrı satırda kalır (ÇOĞULLANMADAN).
//  15) Dekoratif Özellikler boşsa (tüm taşınmazlarda) yalnızca alan/oda
//      paragrafı döner (davranış-koruma regresyonu).
//  16) buildMultiUnitInteriorDescriptionText() GERÇEK gövdesi hem
//      areaDetails hem getUnitDecorativeDescriptionForCombinedText()
//      kaynaklarını okuyor mu + composeMultiUnitInteriorGroupedText'e
//      dekoratif için pluralize:true GEÇMİYOR mu (kaynak-düzeyi).
//  17) refreshMultiUnitInteriorDescriptionTextFromCurrentFields artık
//      getUnitDecorativeFieldKeys()'i watchedKeys'e dahil ediyor mu.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  return extractFunctionBodyFrom(start);
}

// LANDMINE: joinTurkishList için SONUNCU (kazanan) tanımı çeker — bkz.
// dosya başı yorumu.
function extractLastFunction(name) {
  const marker = `\nfunction ${name}(`;
  const start = appSource.lastIndexOf(marker);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  return extractFunctionBodyFrom(start);
}

function extractFunctionBodyFrom(start) {
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
  throw new Error("Fonksiyon gövdesi kapanmadı.");
}

// app.js CRLF satır sonlarıyla saklanıyor — "[" / "]" derinliğine göre
// sabitin GERÇEK sonunu bulan yöntem (diğer test dosyalarındaki AYNI emsal).
function extractConstArray(name) {
  const marker = `const ${name} = [`;
  const start = appSource.indexOf(marker);
  assert.ok(start >= 0, `Sabit bulunamadı: ${name}`);
  let index = start + marker.length - 1;
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return `${appSource.slice(start, index + 1)};`;
    }
  }
  throw new Error(`Sabit sonu bulunamadı: ${name}`);
}

const functionNames = [
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getTitleUnitTablesForLabel",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "foldTurkish",
  "buildAllTitleUnitsForSummaryTable",
  "normalizeTextForSimilarityComparison",
  "levenshteinDistance",
  "computeTextSimilarityRatio",
  "formatTitleUnitSuitabilityLabel",
  "normalizeBlockLabelPrefixForAttribution",
  "formatDocumentBlockAttributionPhrase",
  "formatTitleUnitAttributionPhrase",
  "cleanupPlaceName",
  "pluralizeEnvironmentalSubjectText",
  "pluralizeUnitInteriorAreaSentence",
  "pluralizeUnitInteriorAreaDetailsText",
  "groupUnitInteriorTextEntries",
  "composeMultiUnitInteriorGroupedText",
  "buildMultiUnitInteriorDescriptionText",
];
const constArrayNames = ["UNIT_INTERIOR_AREA_VERB_ENDING_PLURAL_MAP"];

const sandboxSource = `
  let state = {};
  let stateSwapLog = [];
  // normalizeReportDescriptionText (GERÇEK fonksiyon, normalizeReportSentenceLine/
  // shouldLowercaseReportLine/normalizeReportNumberFormats/preserveReportSpecialWords
  // zincirine bağımlı, bu testin kapsamı DIŞINDA) — davranış-koruyan basit
  // bir SAHTE: yalnızca trim.
  function normalizeReportDescriptionText(value) { return String(value || "").trim(); }
  // buildUnitInteriorDescriptionParts() (GERÇEK fonksiyon, kat satırları/
  // registerVariantGroup zincirine bağımlı, bu testin kapsamı DIŞINDA) —
  // davranış-koruyan basit bir SAHTE: state.fields.mockAreaDetails'i AYNEN
  // döner. Her çağrıda mevcut state.fields'ı (o an HANGİ taşınmazınki
  // olursa) kaydeder — senaryo 6'nın "state doğru değiştirildi mi" testi
  // için.
  function buildUnitInteriorDescriptionParts() {
    stateSwapLog.push(state.fields);
    return { areaDetails: state.fields.mockAreaDetails || "" };
  }
  // getUnitDecorativeDescriptionForCombinedText() (GERÇEK fonksiyon,
  // composeUnitDecorativeDescription/getUnitInteriorPresence zincirine
  // bağımlı, bu testin kapsamı DIŞINDA) — AYNI davranış-koruyan SAHTE
  // desen: state.fields.mockDecorativeDetails'i AYNEN döner. Varsayılan
  // "" (tanımsız) OLDUĞUNDAN dekoratif katkısı EKLEMEYEN eski senaryular
  // (1-12) davranışı BOZULMADAN aynen geçmeye devam eder.
  function getUnitDecorativeDescriptionForCombinedText() {
    return state.fields.mockDecorativeDetails || "";
  }
  ${extractLastFunction("joinTurkishList")}
  ${constArrayNames.map(extractConstArray).join("\n")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getStateSwapLog: () => stateSwapLog,
    resetStateSwapLog: () => { stateSwapLog = []; },
    getState: () => state,
    buildMultiUnitInteriorDescriptionText,
    pluralizeUnitInteriorAreaSentence,
    pluralizeUnitInteriorAreaDetailsText,
    groupUnitInteriorTextEntries,
    composeMultiUnitInteriorGroupedText,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

// Kullanıcının GERÇEK örneğiyle BİREBİR (composeSingleUnitFloorInteriorParagraph'ın
// ÇIPLAK "Taşınmaz" öznesiyle başlayan, "hacimlerinden oluşmaktadır." ile
// biten şablonu) — pluralizasyon testlerinin ÇIPLAK özneyi doğru tespit
// ettiğini doğrulamak için BİLEREK bu GERÇEK kalıpla yazıldı.
const SALON_2_ODA = "Taşınmaz projesine ve mevcut duruma göre 131 m2 kullanım alanına sahip olup, antre-hol, salon, 3 oda, mutfak, banyo, wc, duş ve 3 balkon hacimlerinden oluşmaktadır.";
const SALON_2_ODA_PLURAL = "Taşınmazlar projesine ve mevcut duruma göre 131 m2 kullanım alanına sahip olup, antre-hol, salon, 3 oda, mutfak, banyo, wc, duş ve 3 balkon hacimlerinden oluşmaktadırlar.";
const SALON_2_ODA_TYPO = "Taşınmaz projesine ve mevcut duruma göre 131 m2 kullanım alanına sahip olup, antre-hol, salon, 3 oda, mutfak, banyo,wc, duş ve 3 balkon hacimlerinden oluşmaktadır"; // eksik boşluk + nokta yok
const SALON_3_ODA = "Dubleks bağımsız bölüm zemin katta 1 salon ve mutfaktan, üst katta 3 yatak odası ile 2 banyodan meydana gelmektedir.";

// --- 1) Tekil rapor: mevcut unitInteriorDescription AYNEN döner ------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { unitInteriorDescription: SALON_2_ODA, mockAreaDetails: "kullanılmamalı" },
    tables: {},
    titleUnits: [],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Tekil raporda mevcut unitInteriorDescription AYNEN dönmeli (areaDetails-only kısıtlaması yalnızca ÇOKLU taşınmazda geçerli).");
  console.log("Tekil rapor (davranış değişmedi) testi tamam.");
}

// --- 2) 2+ taşınmaz, TÜM areaDetails BİREBİR AYNI: atıfsız TEK, ÇOĞUL metin
// (kullanıcı düzeltmesi #3: "Evet, çoğullansın") ------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA_PLURAL, "2+ bağımsız bölüm AYNI areaDetails ürettiyse atıf EKLENMEDEN TEK, ÇOĞUL ('Taşınmazlar ... oluşmaktadırlar') metin dönmeli.");
  assert.ok(!result.includes("No'lu"), "Atıf etiketi (ör. 'No'lu') HİÇ görünmemeli (tek grup = atıfsız).");
  console.log("2+ taşınmaz, TÜM areaDetails AYNI -> atıfsız TEK ÇOĞUL ortak metin testi tamam.");
}

// --- 3) 2+ taşınmaz, TÜM areaDetails %90+ BENZER (yazım/noktalama farkı) --
// -> YİNE TEK, ÇOĞUL ortak metin.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA_TYPO })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA_PLURAL, "Yazım/noktalama farkı OLAN ama %90+ BENZER areaDetails de TEK, ÇOĞUL (İLK yazılan tabana dayalı) ortak metinde birleşmeli.");
  console.log("2+ taşınmaz, %90+ BENZER (yazım/noktalama farklı) areaDetails -> TEK ÇOĞUL ortak metin testi tamam.");
}

// --- 4) 2+ taşınmaz, 2 FARKLI grup, HER İKİ grup da TEK üyeli: HER grup
// KENDİ atıflı ama TEKİL cümlesinde (tek üyeli grup ÇOĞULLANMAZ) --------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_3_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, `2 FARKLI grup -> 2 ayrı satır beklenir. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("A 2 No'lu") && line.includes(SALON_2_ODA)), `A 2 No'lu atıflı TEKİL satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("B 5 No'lu") && line.includes(SALON_3_ODA)), `B 5 No'lu atıflı TEKİL satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  console.log("2+ taşınmaz, 2 FARKLI TEK-üyeli grup -> her grup kendi atıflı TEKİL cümlesinde testi tamam.");
}

// --- 4b) KULLANICININ GERÇEK ÖRNEĞİ: 3 üyeli grup (A5/A10/A11) + 1 üyeli
// FARKLI grup (A15) — 3 üyeli grup ATIFLI VE ÇOĞUL, 1 üyeli grup atıflı
// ama TEKİL (birebir kullanıcının işaretlediği senaryo) --------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "5", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [
      unit({ titleBlockName: "A", unitNo: "10", mockAreaDetails: SALON_2_ODA }),
      unit({ titleBlockName: "A", unitNo: "11", mockAreaDetails: SALON_2_ODA }),
      unit({ titleBlockName: "A", unitNo: "15", mockAreaDetails: SALON_3_ODA }),
    ],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, `3-üyeli + 1-üyeli grup -> 2 satır beklenir. Bulunan: ${JSON.stringify(lines)}`);
  const groupLine = lines.find((line) => line.includes(SALON_2_ODA_PLURAL));
  assert.ok(groupLine, `3 üyeli grubun ÇOĞUL metni bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(groupLine.includes("A 5 No'lu, A 10 No'lu ve A 11 No'lu"), `3 üyeli grubun atfı kullanıcının GERÇEK örneğiyle BİREBİR eşleşmeli. Bulunan: ${groupLine}`);
  assert.ok(lines.some((line) => line.includes("A 15 No'lu") && line.includes(SALON_3_ODA)), `Tek üyeli (A15) grup atıflı ama TEKİL kalmalı. Bulunan: ${JSON.stringify(lines)}`);
  console.log("KULLANICI ÖRNEĞİ: 3 üyeli grup ATIFLI+ÇOĞUL, 1 üyeli grup atıflı+TEKİL testi tamam.");
}

// --- 4c) pluralizeUnitInteriorAreaSentence(): ÇIPLAK "Taşınmaz" öznesi
// hem KENDİSİ hem SONUNDAKİ fiil çoğullanır -------------------------------
{
  assert.equal(
    fns.pluralizeUnitInteriorAreaSentence(SALON_2_ODA),
    SALON_2_ODA_PLURAL,
    "Çıplak 'Taşınmaz' öznesiyle başlayan cümlenin HEM öznesi HEM fiili çoğullanmalı."
  );
  assert.equal(
    fns.pluralizeUnitInteriorAreaSentence("Taşınmaz kullanım alanına haizdir."),
    "Taşınmazlar kullanım alanına haizdirler.",
    "'haizdir.' sonu 'haizdirler.' olarak çoğullanmalı."
  );
  assert.equal(
    fns.pluralizeUnitInteriorAreaSentence("Taşınmaz oda hacimlerinden oluşmaktadır."),
    "Taşınmazlar oda hacimlerinden oluşmaktadırlar.",
    "'oluşmaktadır.' sonu 'oluşmaktadırlar.' olarak çoğullanmalı."
  );
  console.log("pluralizeUnitInteriorAreaSentence(): çıplak 'Taşınmaz' öznesi + fiil çoğullama testi tamam.");
}

// --- 4d) pluralizeUnitInteriorAreaSentence(): GENİTİF/LOKATİF ("Taşınmazın"/
// "Taşınmazda") ile başlayan cümlelerde YALNIZCA özne çoğullanır, fiil
// DOKUNULMAZ (fiil "alan/uzunluk" gibi BAŞKA bir isme bağlı, doğru gramer
// tekil kalmasıdır) -----------------------------------------------------
{
  const terraceSentence = "Taşınmazın 13 m2 yasal ve mevcut teras alanı bulunmaktadır.";
  const expected = "Taşınmazların 13 m2 yasal ve mevcut teras alanı bulunmaktadır.";
  assert.equal(fns.pluralizeUnitInteriorAreaSentence(terraceSentence), expected, "'Taşınmazın ...' cümlesinde özne çoğullanır AMA fiil ('bulunmaktadır') DOKUNULMAZ.");
  console.log("pluralizeUnitInteriorAreaSentence(): genitif özne + tekil fiil (dokunulmaz) testi tamam.");
}

// --- 4e) pluralizeUnitInteriorAreaSentence(): KAT ADI öznesiyle başlayan
// çok-katlı BB cümlesi HİÇ DEĞİŞTİRİLMEZ (composeMultiUnitFloorInteriorSentence,
// A15'in GERÇEK örneği — kendi doğru grameri, taşınmaz sayısından bağımsız)
{
  const floorLedSentence = "4. Normal Kat projesine göre 85 m2 kullanım alanına sahip olup, antre-hol, salon, oda, mutfak, banyo ve 2 balkon iç hacimlerinden oluşmaktadır.";
  assert.equal(fns.pluralizeUnitInteriorAreaSentence(floorLedSentence), floorLedSentence, "Kat adı öznesiyle başlayan cümle HİÇ DEĞİŞTİRİLMEMELİ (ne özne ne fiil).");
  console.log("pluralizeUnitInteriorAreaSentence(): kat-adı-öznesi cümlesi DOKUNULMAZ testi tamam.");
}

// --- 4f) pluralizeUnitInteriorAreaDetailsText(): ÇOK CÜMLELİ metinde HER
// cümle BAĞIMSIZ değerlendirilir (biri çoğullanır, diğeri dokunulmaz) ------
{
  const multi = `${SALON_2_ODA} Taşınmazın 13 m2 yasal ve mevcut teras alanı bulunmaktadır. Teras alanları kullanım alanına dahil edilmemiştir.`;
  const expected = `${SALON_2_ODA_PLURAL} Taşınmazların 13 m2 yasal ve mevcut teras alanı bulunmaktadır. Teras alanları kullanım alanına dahil edilmemiştir.`;
  assert.equal(fns.pluralizeUnitInteriorAreaDetailsText(multi), expected, "Çok cümleli metinde HER cümle kendi kuralına göre BAĞIMSIZ çoğullanmalı/dokunulmamalı.");
  console.log("pluralizeUnitInteriorAreaDetailsText(): çok cümleli bağımsız değerlendirme testi tamam.");
}

// --- 5) Boş/whitespace-only areaDetails gruplamaya KATILMAZ ----------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [
      unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: "   " }),
      unit({ titleBlockName: "C", unitNo: "9", mockAreaDetails: "" }),
    ],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Boş/whitespace-only areaDetails'li taşınmazlar hariç tutulup TEK dolu metin AYNEN dönmeli.");
  console.log("Boş/whitespace-only areaDetails'lerin gruplamaya katılmaması testi tamam.");
}

// --- 6) HER taşınmaz için state GEÇİCİ değiştirilip SONRA ORİJİNALE döner --
{
  const originalFields = { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA, requestType: "Çoklu Talep" };
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: originalFields,
    tables: { unitFloors: [{ floor: "aktif-taşınmazın-kendi-tablosu" }] },
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_3_ODA })],
  });
  fns.resetStateSwapLog();
  fns.buildMultiUnitInteriorDescriptionText();
  const swapLog = fns.getStateSwapLog();
  assert.equal(swapLog.length, 2, "Her taşınmaz için (2 taşınmaz) buildUnitInteriorDescriptionParts() TAM 1 kez çağrılmalı.");
  assert.equal(swapLog[0].titleBlockName, "A", "1. çağrıda state.fields A taşınmazınınkine değişmeli.");
  assert.equal(swapLog[1].titleBlockName, "B", "2. çağrıda state.fields B taşınmazınınkine değişmeli.");
  assert.equal(swapLog[1].requestType, "Çoklu Talep", "Rapor-geneli PAYLAŞIMLI alanlar (requestType) B taşınmazının değiştirilmiş state.fields'ında da KORUNMALI.");
  assert.equal(fns.getState().fields, originalFields, "Fonksiyon bittikten SONRA state.fields orijinaline (aynı referansa) dönmeli — yan etki sızıntısı OLMAMALI.");
  console.log("Her taşınmaz için state.fields GEÇİCİ değiştirilip sonra orijinaline dönme testi tamam.");
}

// --- 13) Dekoratif Özellikler: 2 taşınmaz AYNI dekoratif metni ürettiyse
// ortak (atıfsız, ÇOĞULLANMAMIŞ) TEK paragraf, alan/oda paragrafının
// HEMEN ALTINDA ("\n" ile ayrı) eklenir --------------------------------------
{
  const DEKORATIF_ORTAK = "Salon, oda ve mutfak zeminleri seramik kaplı vaziyette olup, duvarlar saten boyalıdır.";
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA, mockDecorativeDetails: DEKORATIF_ORTAK },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA, mockDecorativeDetails: DEKORATIF_ORTAK })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, `Alan paragrafı + ortak dekoratif paragrafı -> 2 satır beklenir. Bulunan: ${JSON.stringify(lines)}`);
  assert.equal(lines[0], SALON_2_ODA_PLURAL, "1. satır (alan/oda) her zamanki gibi ÇOĞUL ortak metin olmalı.");
  assert.equal(lines[1], DEKORATIF_ORTAK, "2. satır (Dekoratif Özellikler) AYNI olduğu için atıfsız VE ÇOĞULLANMADAN (tekil) ortak metin olmalı.");
  console.log("Dekoratif Özellikler: 2 taşınmaz AYNI -> atıfsız, ÇOĞULLANMAMIŞ ortak paragraf testi tamam.");
}

// --- 14) Dekoratif Özellikler: 2 FARKLI grup -> her grup kendi atıflı
// (ÇOĞULLANMAMIŞ) cümlesinde ayrı satırda kalır ------------------------------
{
  const DEKORATIF_A = "Salon ve oda zeminleri seramik kaplı vaziyette olup, duvarlar saten boyalıdır.";
  const DEKORATIF_B = "Salon ve oda zeminleri laminat parke kaplı vaziyette olup, duvarlar saten boyalıdır.";
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA, mockDecorativeDetails: DEKORATIF_A },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA, mockDecorativeDetails: DEKORATIF_B })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  const lines = result.split("\n");
  assert.equal(lines.length, 3, `Alan paragrafı (1) + 2 FARKLI dekoratif grup (2) -> 3 satır beklenir. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("A 2 No'lu") && line.includes(DEKORATIF_A)), `A 2 No'lu atıflı dekoratif satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("B 5 No'lu") && line.includes(DEKORATIF_B)), `B 5 No'lu atıflı dekoratif satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  console.log("Dekoratif Özellikler: 2 FARKLI grup -> her biri kendi atıflı satırında testi tamam.");
}

// --- 15) Dekoratif Özellikler tüm taşınmazlarda boşsa yalnızca alan/oda
// paragrafı döner (davranış-koruma regresyonu — 1-12 numaralı eski
// senaryoların hiçbiri mockDecorativeDetails TANIMLAMIYOR, bu da AYNI
// koşulu örtük olarak zaten doğruluyor; burada AÇIKÇA da doğrulanıyor) ------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA_PLURAL, "Dekoratif Özellikler tüm taşınmazlarda boşsa sonuç yalnızca alan/oda paragrafından ibaret olmalı (ekstra '\\n' veya boş satır YOK).");
  console.log("Dekoratif Özellikler tümüyle boş -> yalnızca alan/oda paragrafı (regresyon) testi tamam.");
}

// --- 7) buildUnitInteriorDescriptionParts() GERÇEK gövdesi areaDetails döndürüyor mu
{
  const realBody = extractFunction("buildUnitInteriorDescriptionParts");
  assert.ok(/return \{ intro, areaDetails: "", details: "" \};/.test(realBody), "Boş-satır dalı da areaDetails alanını içermeli.");
  assert.ok(/areaDetails,\s*\r?\n\s*details:/.test(realBody), "Dolu-satır dalındaki dönüş nesnesi areaDetails alanını içermeli.");
  console.log("buildUnitInteriorDescriptionParts() areaDetails alanı (kaynak-düzeyi) testi tamam.");
}

// --- 8) buildMultiUnitInteriorDescriptionText() GERÇEK gövdesi .areaDetails
// okuyor, .details/unitInteriorDescription OKUMUYOR (REGRESYON) ------------
{
  const realBody = extractFunction("buildMultiUnitInteriorDescriptionText");
  assert.ok(realBody.includes("buildUnitInteriorDescriptionParts().areaDetails"), "Çoklu-taşınmaz kaynağı buildUnitInteriorDescriptionParts().areaDetails OLMALI.");
  assert.ok(!realBody.includes("unit.fields?.unitInteriorDescription") && !realBody.includes("unit.fields.unitInteriorDescription"), "REGRESYON: unitInteriorDescription (dekoratif+kat DAHİL tam metin) artık ÇOKLU-taşınmaz döngüsünde DOĞRUDAN okunmamalı.");
  console.log("buildMultiUnitInteriorDescriptionText() .areaDetails kaynağı (dekoratif/kat sızıntısı REGRESYONU) testi tamam.");
}

// --- 8b) composeMultiUnitInteriorGroupedText() GERÇEK gövdesi çoğullamayı
// (kullanıcı düzeltmesi #3) taşıyor mu (kaynak-düzeyi) -----------------------
{
  const realBody = extractFunction("composeMultiUnitInteriorGroupedText");
  assert.ok(realBody.includes("pluralizeUnitInteriorAreaDetailsText"), "2+ üyeli gruplar için pluralizeUnitInteriorAreaDetailsText() çağrılmalı (kullanıcı düzeltmesi #3: 'Evet, çoğullansın').");
  assert.ok(/entries\.length > 1/.test(realBody), "Çoğullama YALNIZCA 2+ üyeli gruplara uygulanmalı (tek üyeli gruplar tekil kalmalı).");
  console.log("composeMultiUnitInteriorGroupedText() çoğullama kablolaması testi tamam.");
}

// --- 8c) buildMultiUnitInteriorDescriptionText() GERÇEK gövdesi Dekoratif
// Özellikler'i (kullanıcı düzeltmesi #4) OKUYOR, ama pluralize:true İLE
// ÇAĞIRMIYOR (kaynak-düzeyi) -------------------------------------------------
{
  const realBody = extractFunction("buildMultiUnitInteriorDescriptionText");
  assert.ok(realBody.includes("getUnitDecorativeDescriptionForCombinedText()"), "Çoklu-taşınmaz Dekoratif Özellikler kaynağı getUnitDecorativeDescriptionForCombinedText() OLMALI.");
  const decorativeCallMatch = realBody.match(/composeMultiUnitInteriorGroupedText\(groupUnitInteriorTextEntries\(decorativeEntries\)\)/);
  assert.ok(decorativeCallMatch, "Dekoratif metin composeMultiUnitInteriorGroupedText'e pluralize SEÇENEĞİ OLMADAN (varsayılan false) geçmeli.");
  assert.ok(/composeMultiUnitInteriorGroupedText\(groupUnitInteriorTextEntries\(areaEntries\), \{ pluralize: true \}\)/.test(realBody), "Alan/oda metni composeMultiUnitInteriorGroupedText'e { pluralize: true } İLE geçmeli.");
  console.log("buildMultiUnitInteriorDescriptionText(): Dekoratif Özellikler kablolaması + ÇOĞULLANMAMA (kaynak-düzeyi) testi tamam.");
}

// --- 9) explanations bölümünde yeni alan tanımı (kaynak-düzeyi) ------------
{
  assert.ok(
    appSource.includes('{ key: "unitInteriorDescriptionMulti", label: "İç Hacimler Açıklaması (Çoklu Taşınmaz)", type: "textarea", wide: true }'),
    "'explanations' bölümünde unitInteriorDescriptionMulti alanı tanımlı olmalı."
  );
  console.log("explanations bölümünde yeni alan tanımı testi tamam.");
}

// --- 10) refreshMultiUnitInteriorDescriptionTextFromCurrentFields kablolaması
{
  const occurrences = appSource.split("refreshMultiUnitInteriorDescriptionTextFromCurrentFields(field.key);").length - 1;
  assert.equal(occurrences, 2, `Merkezi alan-değişikliği dispatcher'ında TAM 2 çağrı noktasına kablolanmalı. Bulunan: ${occurrences}`);
  assert.ok(
    appSource.includes("() => refreshMultiUnitInteriorDescriptionTextFromCurrentFields(),"),
    "refreshAllVariantDependentExplanationFields()'ın koşulsuz tazeleyici listesinde olmalı (programatik veri girişi güvenliği)."
  );
  const setUnitFloorRowsBody = extractFunction("setUnitFloorRows");
  assert.ok(
    setUnitFloorRowsBody.includes("refreshMultiUnitInteriorDescriptionTextFromCurrentFields();"),
    "setUnitFloorRows() (kat satırı düzenleme — field.key ÜRETMEYEN TEK gerçek tetikleyici) bu tazeleyiciyi (koşulsuz) çağırmalı."
  );
  console.log("refreshMultiUnitInteriorDescriptionTextFromCurrentFields kaynak-düzeyi kablolama (dispatcher + koşulsuz + setUnitFloorRows) testi tamam.");
}

// --- 17) refreshMultiUnitInteriorDescriptionTextFromCurrentFields artık
// getUnitDecorativeFieldKeys()'i (Dekoratif Özellikler panelinin TÜM
// alanları, TEK KAYNAK) watchedKeys'e dahil ediyor mu -----------------------
{
  const refreshBody = extractFunction("refreshMultiUnitInteriorDescriptionTextFromCurrentFields");
  assert.ok(
    refreshBody.includes("...getUnitDecorativeFieldKeys()"),
    "watchedKeys, Dekoratif Özellikler alanlarının TEK kaynağı olan getUnitDecorativeFieldKeys()'i spread ETMELİ (elle ikinci bir liste TUTULMAMALI)."
  );
  console.log("refreshMultiUnitInteriorDescriptionTextFromCurrentFields: Dekoratif Özellikler watchedKeys kablolaması testi tamam.");
}

// --- 11) template-engine.js kablolaması -------------------------------------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.ok(templateEngineSource.includes("ICHACIMLERACIKLAMASICOKLU"), "template-engine.js ICHACIMLERACIKLAMASICOKLU token'ını içermeli.");
  assert.ok(templateEngineSource.includes("buildMultiUnitInteriorDescriptionText"), "template-engine.js buildMultiUnitInteriorDescriptionText()'i çağırmalı.");
  console.log("{{ICHACIMLERACIKLAMASICOKLU}} template-engine.js kablolama testi tamam.");
}

// --- 12) collectGeneratedTextPlaceholders katalog kaydı ---------------------
{
  assert.ok(
    appSource.includes('key: "unit_interior_description_multi_text"'),
    "collectGeneratedTextPlaceholders() katalogunda unit_interior_description_multi_text kaydı olmalı."
  );
  console.log("collectGeneratedTextPlaceholders katalog kaydı testi tamam.");
}

console.log("Tum 'Ic Hacimler Aciklamasi (Coklu Tasinmaz)' testleri basarili.");
