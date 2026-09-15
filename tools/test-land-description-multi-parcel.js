"use strict";

/*
  Kullanici talebi (2026-09-15): "cоklu raporlarda 10 tasinmaza kadar arsa
  ozellikleri yazilsin paragraf paragraf." Kullanici gercek bir OLUSTURULAN
  (mevcut, tekil/aktif tasinmaza ozgu) paragraf ve TALEP EDILEN (istenen)
  paragraf ornegi verdi:

  OLUSTURULAN (eski, buildLandDescription() - degismedi, tekil rapor icin
  hala kullanilir):
    "Ekspertize konu 0 Ada 56 Parsel, tapu kaydinda "Seftali Bahcesi" vasifli
    olup 6.100,00 m2 yuzolcumune sahiptir. Parsel geometrik olarak yamuk
    forma sahip olup, topografik acidan egimsiz zemin yapisindadir. Konu
    parselin bati yonunde yer alan kadastro yoluna yaklasik 72,46 metre
    cephesi bulunmaktadir. Tasinmaz uzerinde yaklasik 310 adet 35-40
    yaslarinda Armut Agaci mevcuttur. Agaclarin bakim durumunun orta
    duzeyde oldugu gozlemlenmistir. Tasinmazda sulu tarim yapilmakta olup,
    sulama ihtiyaci sulama kanalindan saglanmaktadir. Parsel uzerinde
    damlama tipi sulama sistemi bulunmaktadir. Parsel sinirlari yol,
    agaclik / bitkisel sinir ve komsu parsel siniri ile belirgin
    vaziyettedir."

  TALEP EDILEN (yeni, buildMultiParcelLandDescription() - coklu/farkli
  parsel raporlarinda):
    1) Her tasinmaz KENDI "{Parsel Etiketi}: ..." ile baslayan oz/kisa
       fiziksel paragrafini alir (ada 0/bos ise SADECE "56 Parsel:" -
       "0 Ada" ASLA gorunmez); "bakim durumu" gozlem cumlesi bu KISA
       paragrafta YER ALMAZ.
    2) Sulama/tarim turu AYRI ele alinir: TUM tasinmazlarda AYNIYSA TEK
       cogul "Tasinmazlarda ..." cumlesinde; FARKLIYSA her biri KENDI
       (gercek, degismemis) cumlesiyle "{parselNo} parselde" ozneli atifli
       sekilde art arda eklenir.

  Bu test, gercek fonksiyonlari (vm/Function extraction, bu oturumda
  kurulan teknik) app.js kaynagindan izole calistirip kullanicinin TAM
  verdigi iki ornegi (OLUSTURULAN=degismedi, TALEP EDILEN=yeni) dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// test-agricultural-multi-unit-transport.js'teki AYNI regex/string/yorum-
// farkinda brace-derinligi sayaci (literal icindeki { } karakterlerini
// gercek kod bloğu sanmaz).
function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  // Önce parametre listesini (varsayılan değerlerdeki "{}" — ör.
  // "item = {}" — dahil) paren-derinliği ile ATLA, gövde "{" ancak
  // ONDAN SONRA aranır (aksi halde bir varsayılan parametredeki "{}"
  // gövde başlangıcı sanılıp erken kapanırdı).
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
  let quote = null;
  let prevSignificant = "";
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    const next = appSource[index + 1];
    if (quote) {
      if (quote === "/" ) {
        if (char === "\\") { index += 1; continue; }
        if (char === "/") quote = null;
        continue;
      }
      if (char === "\\") { index += 1; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      const eol = appSource.indexOf("\n", index);
      index = eol === -1 ? appSource.length : eol;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = appSource.indexOf("*/", index + 2);
      index = end === -1 ? appSource.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "/" && /[([{,;:=!&|?+\-*%^~<>\n]/.test(prevSignificant)) {
      quote = "/";
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
    if (!/\s/.test(char)) prevSignificant = char;
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "foldTurkish",
  "toLowerText",
  "normalizeReportTitleText",
  "normalizeReportDescriptionText",
  // normalizeReportTitleText/normalizeReportDescriptionText'in tam
  // bağımlılık zinciri (test-agricultural-multi-unit-transport.js'teki
  // AYNI emsal).
  "normalizeReportWhitespace",
  "shouldLowercaseReportLine",
  "normalizeReportSentenceLine",
  "normalizeReportProperPhrases",
  "preserveReportSpecialWords",
  "normalizeReportNumberFormats",
  "toTitleCaseTr",
  "escapeRegExp",
  "normalizeYesNoChoice",
  "parseReportNumber",
  "formatSquareMeterArea",
  "formatTurkishList",
  "pluralizeEnvironmentalSubjectText",
  "isMultiTitleUnitReportForNarrative",
  "hasMixedTitleUnitParcels",
  "getNarrativeTitleUnitFields",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  // getTitleUnitFieldsForLabel'in landUnitValue paylasimli-deger bindirme
  // bagimliligi (2026-08-22) - diger testlerdeki AYNI emsal.
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "shouldHideLandAgricultureControls",
  "formatLandAreaForDescription",
  "getLandRoadFrontageItems",
  "getLandAgriculturalProductItems",
  "getLandBoundaryElementItems",
  "roundAgriculturalTreeCount",
  "calculateAgriculturalTotalCount",
  "formatLandAgriculturalProductPhrase",
  "formatLandRoadNameForDescription",
  "formatLandFrontageLength",
  "formatLandBoundaryElementForDescription",
  "buildLandAgriculturalYieldSentence",
  "buildLandAgricultureSentence",
  "formatIrrigationWaterSourceForDescription",
  "formatIrrigationSystemForDescription",
  "buildLandIdentitySentence",
  "buildLandParcelSubject",
  "buildLandGeometrySentence",
  "buildLandRoadFrontageSentence",
  "formatLandRoadFrontagePhrase",
  "buildLandAgriculturalProductSentence",
  "buildLandBoundarySentence",
  "buildLandDescription",
  "buildLandGeometrySentenceCompact",
  "buildLandRoadFrontageSentenceCompact",
  "formatLandRoadFrontagePhraseCompact",
  "buildLandBoundarySentenceCompact",
  "buildLandParcelPhysicalParagraph",
  "formatLandParcelLabel",
  "attributeLandAgricultureSentenceToParcel",
  "buildLandAgricultureConsolidatedParts",
  "buildMultiParcelLandDescription",
];

const limitStart = appSource.indexOf("const LAND_MULTI_PARCEL_DESCRIPTION_LIMIT");
assert(limitStart >= 0, "LAND_MULTI_PARCEL_DESCRIPTION_LIMIT bulunamadı.");
const limitEnd = appSource.indexOf(";", limitStart) + 1;
const limitSrc = appSource.slice(limitStart, limitEnd);

const sandboxSource = `
  let state = {};
  function getState() { return state; }
  function setState(s) { state = s; }
  ${limitSrc}
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState, getState,
    buildLandDescription,
    buildMultiParcelLandDescription,
    formatLandParcelLabel,
    attributeLandAgricultureSentenceToParcel,
    isMultiTitleUnitReportForNarrative,
    hasMixedTitleUnitParcels,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function unit(fields) {
  return { fields, tables: {} };
}

function freshState(fields = {}, titleUnits = []) {
  return {
    fields: {
      requestType: titleUnits.length ? "Çoklu Talep" : "Tekli Talep",
      ownershipType: "Tarla",
      blockNo: "0",
      parcelNo: "56",
      ...fields,
    },
    titleUnits,
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  };
}

// --- 1) formatLandParcelLabel(): "0"/bos ada -> SADECE "{Parsel} Parsel" -
{
  assert.equal(fns.formatLandParcelLabel("0", "56"), "56 Parsel", "'0' ada 'boş ada' ile AYNI kabul edilmeli (kullanıcı talebi).");
  assert.equal(fns.formatLandParcelLabel("", "56"), "56 Parsel", "Boş ada -> yalnızca '{Parsel} Parsel'.");
  assert.equal(fns.formatLandParcelLabel("12", "56"), "12 Ada 56 Parsel", "Anlamlı (0 olmayan) ada -> '{Ada} Ada {Parsel} Parsel'.");
  assert.equal(fns.formatLandParcelLabel("0", ""), "1. taşınmaz", "Ada da parsel de anlamsızsa fallbackIndex+1 kullanılmalı (varsayılan fallbackIndex=0 -> '1. taşınmaz').");
  console.log("formatLandParcelLabel() '0 Ada' istisnası testi tamam.");
}

// --- 2) KULLANICININ TAM ÖRNEĞİ: OLUŞTURULAN (tekil, DEĞİŞMEMELİ) --------
{
  fns.setState(freshState({
    ownershipType: "Tarla",
    blockNo: "0", parcelNo: "56",
    mainPropertyQuality: "Şeftali Bahçesi",
    landArea: "6100",
    landShape: "Yamuk",
    landTopography: "Eğimsiz",
    landRoadFrontage: "Evet",
    landRoadFrontageItems: [{ roadType: "Kadastro Yolu", direction: "Batı", length: "72.46" }],
    landAgriculturalProduct: "Evet",
    landAgriculturalProductItems: [{ productType: "Armut Ağacı", totalCount: "310", age: "35-40", yieldRate: "Orta" }],
    landAgricultureType: "Sulu Tarım",
    landIrrigationWaterSource: "Sulama Kanalı",
    landIrrigationSystem: "Damla Sulama",
    landBoundaryElement: "Evet",
    landBoundaryElementItems: ["Yol", "Ağaçlık / Bitkisel Sınır", "Komşu Parsel Sınırı"],
  }));
  const single = fns.buildLandDescription();
  assert.equal(
    single,
    "Ekspertize konu 0 Ada 56 Parsel, tapu kaydında “Şeftali Bahçesi” vasıflı olup 6.100,00 m² yüzölçümüne sahiptir. Parsel geometrik olarak yamuk forma sahip olup, topografik açıdan eğimsiz zemin yapısındadır. Konu parselin batı yönünde yer alan kadastro yoluna yaklaşık 72,46 metre cephesi bulunmaktadır. Taşınmaz üzerinde yaklaşık 310 adet 35-40 yaşlarında Armut Ağacı mevcuttur. Ağaçların bakım durumunun orta düzeyde olduğu gözlemlenmiştir. Taşınmazda sulu tarım yapılmakta olup, sulama ihtiyacı sulama kanalından sağlanmaktadır. Parsel üzerinde damlama tipi sulama sistemi bulunmaktadır. Parsel sınırları yol, ağaçlık / bitkisel sınır ve komşu parsel sınırı ile belirgin vaziyettedir.",
    `KULLANICININ 'OLUŞTURULAN PARAGRAF' örneği (tekil, DEĞİŞMEMELİ) ile birebir eşleşmeli, bulunan: ${single}`,
  );
  console.log("buildLandDescription() kullanıcının OLUŞTURULAN (tekil) örneğiyle birebir eşleşme (REGRESYON) testi tamam.");
}

// --- 3) KULLANICININ TAM ÖRNEĞİ: TALEP EDİLEN (çoklu, farklı parsel, ------
// AYNI sulama) -------------------------------------------------------------
{
  const fields56 = {
    ownershipType: "Tarla",
    blockNo: "0", parcelNo: "56",
    mainPropertyQuality: "Şeftali Bahçesi",
    landArea: "6100",
    landShape: "Yamuk",
    landTopography: "Eğimsiz",
    landRoadFrontage: "Evet",
    landRoadFrontageItems: [{ roadType: "Kadastro Yolu", direction: "Batı", length: "72.46" }],
    landAgriculturalProduct: "Evet",
    landAgriculturalProductItems: [{ productType: "Armut Ağacı", totalCount: "310", age: "35-40", yieldRate: "Orta" }],
    landAgricultureType: "Sulu Tarım",
    landIrrigationWaterSource: "Sulama Kanalı",
    landIrrigationSystem: "Damla Sulama",
    landBoundaryElement: "Evet",
    landBoundaryElementItems: ["Yol", "Ağaçlık / Bitkisel Sınır", "Komşu Parsel Sınırı"],
  };
  const fields315 = {
    ...fields56,
    parcelNo: "315",
    mainPropertyQuality: "Tarla",
    landArea: "4200",
  };
  fns.setState(freshState(fields56, [unit(fields315)]));
  assert.equal(fns.isMultiTitleUnitReportForNarrative(), true, "sanity: 2 taşınmaz -> çoklu rapor.");
  assert.equal(fns.hasMixedTitleUnitParcels(), true, "sanity: 0/56 ve 0/315 farklı parsel sayılmalı.");
  const multi = fns.buildMultiParcelLandDescription();
  const paragraphs = multi.split("\n");
  assert.equal(paragraphs.length, 3, `2 taşınmaz paragrafı + 1 ORTAK sulama cümlesi = 3 parça beklenir, bulunan: ${JSON.stringify(paragraphs)}`);
  assert.equal(
    paragraphs[0],
    "56 Parsel: “Şeftali Bahçesi” vasıflı olup, 6.100,00 m² yüzölçümlüdür. Geometrik olarak yamuk formda, topografik açıdan eğimsiz zemin yapısındadır. Batı yönünde kadastro yoluna yaklaşık 72,46 metre cephelidir. Taşınmaz üzerinde yaklaşık 310 adet 35-40 yaşlarında Armut Ağacı mevcuttur. Sınırları yol, ağaçlık / bitkisel sınır ve komşu parsel sınırı ile belirgin vaziyettedir.",
    `KULLANICININ 'TALEP EDİLEN PARAGRAF' (56 parsel) örneğiyle birebir eşleşmeli (0 Ada GÖRÜNMEMELİ, bakım durumu cümlesi OLMAMALI), bulunan: ${paragraphs[0]}`,
  );
  assert.ok(paragraphs[1].startsWith("315 Parsel: “Tarla” vasıflı olup, 4.200,00 m² yüzölçümlüdür."), `315 parselin KENDİ (farklı nitelik/alan) paragrafı da görünmeli, bulunan: ${paragraphs[1]}`);
  assert.equal(
    paragraphs[2],
    "Taşınmazlarda sulu tarım yapılmakta olup, sulama ihtiyacı sulama kanalından sağlanmaktadır. Parsel üzerinde damlama tipi sulama sistemi bulunmaktadır.",
    `İki parsel AYNI sulama bilgisini paylaştığından TEK ortak çoğul cümlede birleşmeli (kullanıcının 2. örneği), bulunan: ${paragraphs[2]}`,
  );
  console.log("buildMultiParcelLandDescription() kullanıcının TALEP EDİLEN örneğiyle (AYNI sulama -> ortak cümle) birebir eşleşme testi tamam.");
}

// --- 4) KULLANICININ 3. ÖRNEĞİ: sulama/tarım türü FARKLIYSA parsel -------
// atıflı, art arda eklenmeli ------------------------------------------------
{
  const fields56 = {
    ownershipType: "Tarla",
    blockNo: "0", parcelNo: "56",
    mainPropertyQuality: "Şeftali Bahçesi",
    landArea: "6100",
    landAgricultureType: "Sulu Tarım",
    landIrrigationWaterSource: "Sulama Kanalı",
    landIrrigationSystem: "Damla Sulama",
  };
  const fields312 = {
    ...fields56,
    parcelNo: "312",
    landAgricultureType: "Kuru Tarım",
    landIrrigationWaterSource: "",
    landIrrigationSystem: "",
  };
  fns.setState(freshState(fields56, [unit(fields312)]));
  const multi = fns.buildMultiParcelLandDescription();
  const paragraphs = multi.split("\n");
  const agricultureParagraph = paragraphs[paragraphs.length - 1];
  assert.ok(
    agricultureParagraph.includes("56 parselde sulu tarım yapılmakta olup, sulama ihtiyacı sulama kanalından sağlanmaktadır."),
    `KULLANICININ 3. örneği: 56 parselin KENDİ (sulu) cümlesi '56 parselde' atfıyla görünmeli, bulunan: ${agricultureParagraph}`,
  );
  assert.ok(
    agricultureParagraph.includes("312 parselde kuru tarım arazisi niteliğinde olduğu değerlendirilmektedir."),
    `312 parselin KENDİ (kuru) cümlesi de '312 parselde' atfıyla görünmeli - eskiden bu TAMAMEN kayboluyordu, bulunan: ${agricultureParagraph}`,
  );
  console.log("buildMultiParcelLandDescription() FARKLI sulama/tarım türü -> parsel atıflı ayrı cümleler testi tamam.");
}

// --- 5) REGRESYON: aynı ada/parselde çoklu taşınmaz -> eski (tekil) -------
// davranışa güvenli düşülür (parsel etiketi/ikinci paragraf YOK). ----------
{
  const fields = {
    ownershipType: "Tarla", blockNo: "0", parcelNo: "56",
    mainPropertyQuality: "Bahçe", landArea: "1000",
  };
  fns.setState(freshState(fields, [unit({ ...fields })]));
  assert.equal(fns.hasMixedTitleUnitParcels(), false, "sanity: aynı ada/parselde 2 taşınmaz FARKLI parsel SAYILMAMALI.");
  const multi = fns.buildMultiParcelLandDescription();
  assert.equal(multi, "", "Aynı ada/parselde çoklu taşınmaz -> buildMultiParcelLandDescription() boş dönmeli (eski davranışa düşülür).");
  console.log("buildMultiParcelLandDescription() REGRESYON (aynı ada/parsel -> boş, eski davranışa düşülür) testi tamam.");
}

// --- 6) REGRESYON: 10'dan FAZLA taşınmaz -> eski davranışa güvenli --------
// düşülür (kullanıcının belirttiği "10 taşınmaza kadar" eşiği). -----------
{
  const primary = { ownershipType: "Tarla", blockNo: "0", parcelNo: "1", landArea: "1000" };
  const extraUnits = Array.from({ length: 10 }, (_, index) => unit({ ...primary, parcelNo: String(index + 2) }));
  fns.setState(freshState(primary, extraUnits));
  assert.equal(fns.hasMixedTitleUnitParcels(), true, "sanity: 11 farklı parsel FARKLI parsel sayılmalı.");
  const multi = fns.buildMultiParcelLandDescription();
  assert.equal(multi, "", "11 taşınmaz (10 eşiğinin ÜZERİNDE) -> buildMultiParcelLandDescription() boş dönmeli (eski davranışa düşülür).");
  console.log("buildMultiParcelLandDescription() REGRESYON (10 eşiği aşılınca eski davranışa düşülür) testi tamam.");
}

console.log("Arsa Özellikleri çoklu ada/parsel paragraf testleri başarılı.");
