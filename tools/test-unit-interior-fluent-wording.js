"use strict";

/*
  Kullanici talebi: Bağımsız Bölüm Özellikleri bölümündeki otomatik üretilen
  açıklamada "taşınmazın" kelimesi çok tekrar ediyordu (kapı/pencere, iç
  özellikler, ısınma cümlelerinin her biri ayrı ayrı "Taşınmazın"/
  "Taşınmazda" ile başlıyordu). Kullanıcıya önce örnek metin gönderildi,
  onaylandıktan sonra composeDoorsWindowsSentence(), composeKitchenCabinetCounterSentence(),
  composeMaterialQualitySentence() ve composeUnitHeatingSentence()
  fonksiyonlarındaki sabit metinler daha akıcı bir üsluba (tekrarsız,
  bölüm başlıklarından öznenin zaten belli olduğu) güncellendi.

  Bu dört fonksiyon gercek app.js kaynagindan izole calistirilir; ortak
  bagimliliklari (toLowerText, formatTurkishList, formatDoorWindowMaterial,
  vb.) bu testin kapsami disi oldugundan basit stub'larla degistirilir —
  odak, ureilen cumlelerin "Taşınmazın/Taşınmazda" ile BAŞLAMAMASI ve
  kullanicinin onayladigi ornek cikti ile birebir eslesmesidir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

function sliceRange(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf(endMarker, start);
  assert(end > start, `Bulunamadi (bitis): ${endMarker}`);
  return appSource.slice(start, end);
}

const foldTurkishSrc = sliceFn("function foldTurkish(");
const capitalizeSentenceSrc = sliceFn("function capitalizeSentence(");
const composeDoorsWindowsSentenceSrc = sliceFn("function composeDoorsWindowsSentence(");
// composeKitchenCabinetCounterSentence artik disaridan tanimli varyant
// dizilerine bagli (bkz. docs/cumle-envanteri.md, Bolum 5) — o const'lar da
// birlikte yuklenmeli.
const kitchenCabinetCounterVariantsSrc = sliceRange(
  "const kitchenCabinetCounterNoneVariants = [",
  "function composeKitchenCabinetCounterSentence("
);
const composeKitchenCabinetCounterSentenceSrc = sliceFn("function composeKitchenCabinetCounterSentence(");
// composeMaterialQualitySentence artik varyant secimi icin ayri bir
// `const materialQualitySentenceVariants` sozlugune bagli — o da birlikte
// yuklenmeli (bkz. docs/cumle-envanteri.md, Bolum 5).
const materialQualitySentenceVariantsSrc = sliceRange(
  "const materialQualitySentenceVariants = {",
  "function composeMaterialQualitySentence("
);
const composeMaterialQualitySentenceSrc = sliceFn("function composeMaterialQualitySentence(");
// composeUnitHeatingSentence artik disaridan tanimli varyant dizisine bagli.
const unitHeatingSentenceVariantsSrc = sliceRange(
  "const unitHeatingSentenceVariants = [",
  "function composeUnitHeatingSentence("
);
const composeUnitHeatingSentenceSrc = sliceFn("function composeUnitHeatingSentence(");

function createContext(fields) {
  const context = {
    state: { fields },
    toLowerText: (value) => String(value || "").toLocaleLowerCase("tr"),
    formatTurkishList: (arr) => (arr.length <= 1 ? arr[0] || "" : `${arr.slice(0, -1).join(", ")} ve ${arr[arr.length - 1]}`),
    formatDoorWindowMaterial: (value) => (
      String(value || "").toLocaleUpperCase("tr") === "PVC" ? "PVC" : String(value || "").toLocaleLowerCase("tr")
    ),
    isNotInstalledDecorative: (value) => /^(yok)$/i.test(String(value || "").trim()),
    ensureCabinetText: (value) => `${String(value || "").toLocaleLowerCase("tr")} dolap`,
    normalizeYesNoChoice: (value) => (value === "Evet" ? "Evet" : "Hayır"),
    // selectVariant burada BİLEREK her zaman 0 (orijinal metin) döner — bu
    // test cümle YAPISINI (özne tekrarı yok) doğruluyor, varyant SEÇİMİ
    // ayrı olarak tools/test-variant-selection.js'te test ediliyor.
    selectVariant: () => 0,
    // registerVariantGroup çağrıları (materialQualitySentenceVariants'ın
    // hemen ardında, modül-yükleme anında çalışır) burada no-op — kayıt
    // defteri ayrıca tools/test-variant-selection.js'te test ediliyor.
    registerVariantGroup: () => {},
  };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(capitalizeSentenceSrc, context);
  vm.runInContext(composeDoorsWindowsSentenceSrc, context);
  vm.runInContext(kitchenCabinetCounterVariantsSrc, context);
  vm.runInContext(composeKitchenCabinetCounterSentenceSrc, context);
  vm.runInContext(materialQualitySentenceVariantsSrc, context);
  vm.runInContext(composeMaterialQualitySentenceSrc, context);
  vm.runInContext(unitHeatingSentenceVariantsSrc, context);
  vm.runInContext(composeUnitHeatingSentenceSrc, context);
  return context;
}

const context = createContext({
  unitExteriorDoor: "çelik",
  unitInteriorDoors: "lake",
  unitWindows: "PVC",
  unitKitchenCabinet: "akrilik",
  unitKitchenCounter: "çimstone / kuvars",
  unitMaterialQuality: "Kaliteli",
  unitHeatingType: "yerden ısıtma doğalgaz kombi",
  unitHeatingMounted: "Evet",
});

// 1) Kullanicinin onayladigi ornekle BIREBIR eslesme.
assert.equal(
  context.composeDoorsWindowsSentence(),
  "Dış kapı çelik, iç kapılar lake ve pencereler PVC doğramadır.",
  "Kapı/pencere cümlesi onaylanan örnekle eşleşmiyor."
);
assert.equal(
  context.composeKitchenCabinetCounterSentence(),
  "Mutfak dolapları akrilik dolap olup, tezgahı çimstone / kuvars olarak düzenlenmiştir.",
  "Mutfak cümlesi onaylanan örnekle eşleşmiyor."
);
assert.equal(
  context.composeMaterialQualitySentence(),
  "İç mekân özellikleri kaliteli seviyede olup, tadilat ihtiyacı bulunmamaktadır.",
  "İç mekân kalite cümlesi onaylanan örnekle eşleşmiyor."
);
assert.equal(
  context.composeUnitHeatingSentence(),
  "Isınma ihtiyacı yerden ısıtma doğalgaz kombi ile karşılanacak şekilde tesisatlandırılmış olup, ısıtma sistemi halihazırda monte edilmiştir.",
  "Isınma cümlesi onaylanan örnekle eşleşmiyor."
);

// 2) Genel kural: hicbir cumle "Taşınmazın"/"Taşınmazda" ile BAŞLAMAMALI
//    (tekrar eden ozne kaldirildi — kullanici sikayeti buydu).
[
  context.composeDoorsWindowsSentence(),
  context.composeKitchenCabinetCounterSentence(),
  context.composeMaterialQualitySentence(),
  context.composeUnitHeatingSentence(),
].forEach((sentence) => {
  assert.doesNotMatch(
    sentence,
    /^Taşınmazın |^Taşınmazda /,
    `Cümle "Taşınmazın/Taşınmazda" ile başlamamalı: "${sentence}"`
  );
});

// 3) Isıtma sistemi monte EDİLMEMİŞSE dogru ek kullanilmali (regresyon:
//    string birleştirme sırasında "memiştir"/"miştir" eki karışabilir).
const notMountedContext = createContext({
  unitHeatingType: "kombi doğalgaz",
  unitHeatingMounted: "Hayır",
});
assert.match(
  notMountedContext.composeUnitHeatingSentence(),
  /monte edilmemiştir\.$/,
  "Isıtma sistemi monte edilmemişken cümle 'monte edilmemiştir.' ile bitmeli."
);

console.log("Bagimsiz bolum ic ozellikleri akici anlatim testi tamam.");
