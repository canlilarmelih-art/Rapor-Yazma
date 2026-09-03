// "İç Hacimler Açıklaması (Çoklu Taşınmaz)" — çoklu taleplerde bağımsız
// bölümlerin İç Hacimler Açıklaması metinlerini birleştirir (2026-09-03).
// Kullanıcı talebi: "geçelim aynı ada parsel bağımsız bölüm özellikleri
// çoklu çalışma açıklamalarına." AskUserQuestion ile netleştirildi:
// (1) İç Hacimler Açıklaması (unitInteriorDescription — HER bağımsız
// bölümün KENDİ oda/salon/mutfak vb. bileşimini anlatan, taşınmaza-özgü
// metin), (2) "aynı/benzer metinleri TEK cümlede birleştir".
//
// Kapsam kararı: ada/parsel eşitliğine BAKILMAZ (yalnızca "2+ taşınmaz
// var mı") — İç Hacimler bileşimi ada/parsel'e değil bağımsız bölümün
// KENDİSİNE bağlı olduğundan Bağımsız Bölüm Özeti tablosunun kendisiyle
// (o da ada/parsel-koşullu DEĞİL) TUTARLIDIR.
//
// LANDMINE UYARISI (test-multi-unit-open-address.js'teki AYNI uyarı):
// app.js'te 4 ayrı `function joinTurkishList(...)` var, aynı isim aynı
// scope'ta olduğundan SONUNCUSU (37491 civarı, cleanupPlaceName() ile
// KML'e özgü temizlik yapan) TÜM çağrı yerlerinde kazanır — formatTitleUnitAttributionPhrase()
// bu fonksiyona (dolaylı olarak, formatDocumentBlockAttributionPhrase
// üzerinden) BAĞIMLI olduğundan, bu test GERÇEK çalışma zamanı davranışını
// yansıtmak için extractFunction'ın normal İLK-eşleşme mantığı YERİNE
// özel bir extractLastFunction ile SONUNCU (kazanan) tanımı çeker.
//
// Kapsanan senaryolar:
//  1) Tekil rapor (1 taşınmaz): state.fields.unitInteriorDescription
//     AYNEN döner (davranış DEĞİŞMEDİ).
//  2) 2+ taşınmaz, TÜM metinler AYNI: atıf EKLENMEDEN TEK, ortak metin.
//  3) 2+ taşınmaz, TÜM metinler %90+ BENZER (yazım/noktalama farkı):
//     YİNE TEK, ortak (İLK yazılan) metin (kullanıcı: "benzer metinleri
//     de birleştir").
//  4) 2+ taşınmaz, 2 FARKLI (birbirine benzemeyen) grup: HER grup KENDİ
//     atıflı ("A 2 No'lu: ...") cümlesinde ayrı kalır.
//  5) Boş/whitespace-only metinler dışarıda bırakılır (gruplamaya
//     KATILMAZ).
//  6) explanations bölümünde yeni alan tanımı (kaynak-düzeyi).
//  7) refreshMultiUnitInteriorDescriptionTextFromCurrentFields merkezi
//     dispatcher'a (2 çağrı noktası) VE koşulsuz "Açıklamalar" render
//     tazeleyicisine kablolanmış mı (kaynak-düzeyi).
//  8) template-engine.js'te {{ICHACIMLERACIKLAMASICOKLU}} kayıtlı mı.
//  9) collectGeneratedTextPlaceholders() katalogunda kayıtlı mı.

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
  // normalizeReportDescriptionText (GERÇEK fonksiyon, normalizeReportSentenceLine/
  // shouldLowercaseReportLine/normalizeReportNumberFormats/preserveReportSpecialWords
  // zincirine bağımlı, bu testin kapsamı DIŞINDA) — davranış-koruyan basit
  // bir SAHTE: yalnızca trim (diğer test dosyalarındaki AYNI konvansiyon,
  // bkz. test-multi-unit-open-address.js'in buildOpenAddressText SAHTEsi).
  function normalizeReportDescriptionText(value) { return String(value || "").trim(); }
  ${extractLastFunction("joinTurkishList")}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
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

// --- 1) Tekil rapor: mevcut değer AYNEN döner ------------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { unitInteriorDescription: SALON_2_ODA },
    tables: {},
    titleUnits: [],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Tekil raporda mevcut unitInteriorDescription AYNEN dönmeli.");
  console.log("Tekil rapor (davranış değişmedi) testi tamam.");
}

// --- 2) 2+ taşınmaz, TÜM metinler BİREBİR AYNI: atıfsız TEK ortak metin ----
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", unitInteriorDescription: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", unitInteriorDescription: SALON_2_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Tüm bağımsız bölümler AYNI metni ürettiyse atıf EKLENMEDEN TEK ortak metin dönmeli.");
  assert.ok(!result.includes("No'lu"), "Atıf etiketi (ör. 'No'lu') HİÇ görünmemeli (tek grup = atıfsız).");
  console.log("2+ taşınmaz, TÜM metinler AYNI -> atıfsız TEK ortak metin testi tamam.");
}

// --- 3) 2+ taşınmaz, TÜM metinler %90+ BENZER (yazım/noktalama farkı) -----
// -> YİNE TEK ortak metin (kullanıcı: "benzer metinleri de birleştir").
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", unitInteriorDescription: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", unitInteriorDescription: SALON_2_ODA_TYPO })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Yazım/noktalama farkı OLAN ama %90+ BENZER metinler de TEK ortak (İLK yazılan) metinde birleşmeli.");
  console.log("2+ taşınmaz, %90+ BENZER (yazım/noktalama farklı) metinler -> TEK ortak metin testi tamam.");
}

// --- 4) 2+ taşınmaz, 2 FARKLI grup: HER grup KENDİ atıflı cümlesinde -------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", unitInteriorDescription: SALON_2_ODA },
    tables: {},
    titleUnits: [unit({ titleBlockName: "B", unitNo: "5", unitInteriorDescription: SALON_3_ODA })],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  const lines = result.split("\n");
  assert.equal(lines.length, 2, `2 FARKLI grup -> 2 ayrı satır beklenir. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("A 2 No'lu") && line.includes(SALON_2_ODA)), `A 2 No'lu atıflı satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  assert.ok(lines.some((line) => line.includes("B 5 No'lu") && line.includes(SALON_3_ODA)), `B 5 No'lu atıflı satır bulunamadı. Bulunan: ${JSON.stringify(lines)}`);
  console.log("2+ taşınmaz, 2 FARKLI grup -> her grup kendi atıflı cümlesinde testi tamam.");
}

// --- 5) Boş/whitespace-only metinler gruplamaya KATILMAZ -------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { titleBlockName: "A", unitNo: "2", unitInteriorDescription: SALON_2_ODA },
    tables: {},
    titleUnits: [
      unit({ titleBlockName: "B", unitNo: "5", unitInteriorDescription: "   " }),
      unit({ titleBlockName: "C", unitNo: "9", unitInteriorDescription: "" }),
    ],
  });
  const result = fns.buildMultiUnitInteriorDescriptionText();
  assert.equal(result, SALON_2_ODA, "Boş/whitespace-only metinli taşınmazlar hariç tutulup TEK dolu metin AYNEN dönmeli.");
  console.log("Boş/whitespace-only metinlerin gruplamaya katılmaması testi tamam.");
}

// --- 6) explanations bölümünde yeni alan tanımı (kaynak-düzeyi) ------------
{
  assert.ok(
    appSource.includes('{ key: "unitInteriorDescriptionMulti", label: "İç Hacimler Açıklaması (Çoklu Taşınmaz)", type: "textarea", wide: true }'),
    "'explanations' bölümünde unitInteriorDescriptionMulti alanı tanımlı olmalı."
  );
  console.log("explanations bölümünde yeni alan tanımı testi tamam.");
}

// --- 7) refreshMultiUnitInteriorDescriptionTextFromCurrentFields kablolaması
{
  const occurrences = appSource.split("refreshMultiUnitInteriorDescriptionTextFromCurrentFields(field.key);").length - 1;
  assert.equal(occurrences, 2, `Merkezi alan-değişikliği dispatcher'ında TAM 2 çağrı noktasına kablolanmalı. Bulunan: ${occurrences}`);
  assert.ok(
    appSource.includes("() => refreshMultiUnitInteriorDescriptionTextFromCurrentFields(),"),
    "refreshAllVariantDependentExplanationFields()'ın koşulsuz tazeleyici listesinde olmalı (programatik veri girişi güvenliği)."
  );
  console.log("refreshMultiUnitInteriorDescriptionTextFromCurrentFields kaynak-düzeyi kablolama testi tamam.");
}

// --- 8) template-engine.js kablolaması --------------------------------------
{
  const templateEngineSource = fs.readFileSync(path.join(__dirname, "..", "src", "templates", "template-engine.js"), "utf8");
  assert.ok(templateEngineSource.includes("ICHACIMLERACIKLAMASICOKLU"), "template-engine.js ICHACIMLERACIKLAMASICOKLU token'ını içermeli.");
  assert.ok(templateEngineSource.includes("buildMultiUnitInteriorDescriptionText"), "template-engine.js buildMultiUnitInteriorDescriptionText()'i çağırmalı.");
  console.log("{{ICHACIMLERACIKLAMASICOKLU}} template-engine.js kablolama testi tamam.");
}

// --- 9) collectGeneratedTextPlaceholders katalog kaydı ----------------------
{
  assert.ok(
    appSource.includes('key: "unit_interior_description_multi_text"'),
    "collectGeneratedTextPlaceholders() katalogunda unit_interior_description_multi_text kaydı olmalı."
  );
  console.log("collectGeneratedTextPlaceholders katalog kaydı testi tamam.");
}

console.log("Tum 'Ic Hacimler Aciklamasi (Coklu Tasinmaz)' testleri basarili.");
