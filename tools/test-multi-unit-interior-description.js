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
// LANDMINE UYARISI (test-multi-unit-open-address.js'teki AYNI uyarı):
// app.js'te 4 ayrı `function joinTurkishList(...)` var, aynı isim aynı
// scope'ta olduğundan SONUNCUSU (cleanupPlaceName() ile KML'e özgü
// temizlik yapan) TÜM çağrı yerlerinde kazanır — formatTitleUnitAttributionPhrase()
// bu fonksiyona (dolaylı olarak, formatDocumentBlockAttributionPhrase
// üzerinden) BAĞIMLI olduğundan, bu test GERÇEK çalışma zamanı davranışını
// yansıtmak için extractFunction'ın normal İLK-eşleşme mantığı YERİNE
// özel bir extractLastFunction ile SONUNCU (kazanan) tanımı çeker.
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
  "buildMultiUnitInteriorDescriptionText",
];

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
  ${extractLastFunction("joinTurkishList")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getStateSwapLog: () => stateSwapLog,
    resetStateSwapLog: () => { stateSwapLog = []; },
    getState: () => state,
    buildMultiUnitInteriorDescriptionText,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(overrides = {}) {
  return { fields: { ...overrides }, tables: {} };
}

const SALON_2_ODA = "Bağımsız bölüm; 1 salon, 2 oda, 1 mutfak, 1 banyo, 1 wc hacimlerinden oluşmaktadır.";
const SALON_2_ODA_TYPO = "Bağımsız bölüm; 1 salon, 2 oda, 1 mutfak, 1 banyo,1 wc hacimlerinden oluşmaktadır"; // eksik boşluk + nokta yok
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

// --- 2) 2+ taşınmaz, TÜM areaDetails BİREBİR AYNI: atıfsız TEK ortak metin -
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Tüm bağımsız bölümler AYNI areaDetails ürettiyse atıf EKLENMEDEN TEK ortak metin dönmeli.");
  assert.ok(!result.includes("No'lu"), "Atıf etiketi (ör. 'No'lu') HİÇ görünmemeli (tek grup = atıfsız).");
  console.log("2+ taşınmaz, TÜM areaDetails AYNI -> atıfsız TEK ortak metin testi tamam.");
}

// --- 3) 2+ taşınmaz, TÜM areaDetails %90+ BENZER (yazım/noktalama farkı) --
// -> YİNE TEK ortak metin.
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", mockAreaDetails: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", mockAreaDetails: SALON_2_ODA_TYPO })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Yazım/noktalama farkı OLAN ama %90+ BENZER areaDetails de TEK ortak (İLK yazılan) metinde birleşmeli.");
  console.log("2+ taşınmaz, %90+ BENZER (yazım/noktalama farklı) areaDetails -> TEK ortak metin testi tamam.");
}

// --- 4) 2+ taşınmaz, 2 FARKLI grup: HER grup KENDİ atıflı cümlesinde -------
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
  assert.ok(lines.some((line) => line.includes("A 2 No'lu") && line.includes(SALON_2_ODA)), `A 2 No'lu atıflı satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("B 5 No'lu") && line.includes(SALON_3_ODA)), `B 5 No'lu atıflı satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  console.log("2+ taşınmaz, 2 FARKLI grup -> her grup kendi atıflı cümlesinde testi tamam.");
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
