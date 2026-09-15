"use strict";

/*
  Kullanici talebi (2026-09-15): "İklim ve Deprem Bilgileri bölümünü adres
  ve konum sekmesine Çevresel Özellikler Açıklaması bölümünün altına
  taşıyalım. çoklu arazi taleplerinde İklim ve Deprem Bilgileri bölümünü
  çoklu olarak uyarla Taşınmaz > Taşınmazlar"

  Bu test iki kısmı doğrular:
  a) Panel artık "land" (Arsa Özellikleri) DEĞİL "address" (Adres ve Konum)
     bölümünde, createForm(section)'ın hemen ardından ekleniyor —
     "environmentDescription" (Çevresel Özellikler Açıklaması) "address"
     bölümünün fields[] dizisindeki SON alan olduğundan panel doğal olarak
     onun altında görünür (kaynak-düzeyi kontrol).
  b) buildClimateEarthquakeExplanation() çoklu taşınmaz raporunda
     "Taşınmazın"/"taşınmaz" -> "Taşınmazların"/"taşınmazlar" çoğullanır;
     tekil raporda DEĞİŞMEZ (gerçek fonksiyon, vm/Function extraction).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- a) Kaynak-düzeyi: panel "address" bölümünde, "land" bölümünde DEĞİL --
{
  assert.doesNotMatch(
    appSource,
    /if \(section\.id === "land"\) \{\s*const climatePanel = createLandClimateEarthquakePanel\(\);/,
    "İklim ve Deprem Bilgileri paneli ARTIK 'land' bölümünde eklenmemeli (kullanıcı talebiyle 'address'e taşındı)."
  );
  assert.match(
    appSource,
    /if \(section\.id === "address"\) \{\s*const climatePanel = createLandClimateEarthquakePanel\(\);\s*if \(climatePanel\) body\.append\(climatePanel\);\s*\}/,
    "İklim ve Deprem Bilgileri paneli 'address' bölümünde, createForm(section)'ın hemen ardından eklenmeli."
  );
  // "environmentDescription" address bölümünün fields[] dizisindeki SON
  // alan olmalı (panelin "Çevresel Özellikler Açıklaması"nın ALTINDA
  // görünmesini garanti eden yapısal koşul) — regresyon kilidi.
  const addressStart = appSource.indexOf('id: "address"');
  assert(addressStart >= 0, "'address' bölümü bulunamadı.");
  const fieldsStart = appSource.indexOf("fields: [", addressStart);
  const fieldsEnd = appSource.indexOf("\n    ],", fieldsStart);
  const fieldsSlice = appSource.slice(fieldsStart, fieldsEnd);
  const lastKeyMatch = [...fieldsSlice.matchAll(/key: "([A-Za-z0-9_]+)"/g)].map((m) => m[1]).pop();
  assert.equal(lastKeyMatch, "environmentDescription", `REGRESYON: 'address' bölümünün SON alanı 'environmentDescription' olmalı (panel konumu buna bağlı), bulunan: ${lastKeyMatch}`);

  console.log("İklim ve Deprem Bilgileri paneli kaynak-düzeyi konum (address, Çevresel Özellikler'in altı) testi tamam.");
}

// --- b) buildClimateEarthquakeExplanation() gerçek fonksiyon testi --------
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
  "normalizeReportTitleText",
  "normalizeReportDescriptionText",
  "normalizeReportWhitespace",
  "shouldLowercaseReportLine",
  "normalizeReportSentenceLine",
  "normalizeReportProperPhrases",
  "preserveReportSpecialWords",
  "normalizeReportNumberFormats",
  "toTitleCaseTr",
  "escapeRegExp",
  "pluralizeEnvironmentalSubjectText",
  "isMultiTitleUnitReportForNarrative",
  "getTitleUnitCount",
  "normalizeClimateLookupValue",
  "findClimateEarthquakeRecord",
  "formatClimateNumber",
  "formatEarthquakeZoneForReport",
  "buildClimateEarthquakeExplanation",
];

const sandboxSource = `
  let state = {};
  function setState(s) { state = s; }
  function getState() { return state; }
  ${functionNames.map(extractFunction).join("\n")}
  return { setState, getState, buildClimateEarthquakeExplanation };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

const climateRecord = {
  il: "Bursa",
  ilce: "Nilüfer",
  bolge: "Marmara",
  yagisSinifi: "Ilıman",
  rakimM: 100,
  sicaklikC: 14.5,
  nemYuzde: 65,
  yagisMmYil: 700,
  guneslenmeSaatYil: 2500,
  donGunu: 20,
  depremBolgesi: "2-Yüksek",
};

function freshState(overrides = {}, titleUnits = []) {
  return {
    fields: {
      city: "Bursa",
      district: "Nilüfer",
      earthquakeZone: "",
      ...overrides,
    },
    titleUnits,
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  };
}

// --- 1) REGRESYON: tekil taşınmaz -> "Taşınmazın"/"taşınmaz" TEKİL kalır --
{
  globalThis.climateEarthquakeData = [climateRecord];
  fns.setState(freshState());
  const single = fns.buildClimateEarthquakeExplanation();
  assert.ok(single.startsWith("Taşınmazın konumlandığı Bursa ili, Nilüfer ilçesine ait"), `Tekil raporda 'Taşınmazın' TEKİL kalmalı (regresyon), bulunan: ${single}`);
  assert.ok(single.includes("söz konusu taşınmaz,"), `Tekil raporda 'söz konusu taşınmaz' TEKİL kalmalı (regresyon), bulunan: ${single}`);
  assert.ok(!single.includes("Taşınmazların") && !single.includes("taşınmazlar"), `Tekil raporda ÇOĞUL ifade OLMAMALI, bulunan: ${single}`);
  console.log("buildClimateEarthquakeExplanation() tekil taşınmaz (REGRESYON, TEKİL kalır) testi tamam.");
}

// --- 2) KULLANICI TALEBİ: çoklu taşınmaz -> "Taşınmazların"/"taşınmazlar" -
// ÇOĞUL olur -------------------------------------------------------------
{
  globalThis.climateEarthquakeData = [climateRecord];
  fns.setState(freshState({}, [{ fields: { city: "Bursa", district: "Nilüfer" } }]));
  const multi = fns.buildClimateEarthquakeExplanation();
  assert.ok(multi.startsWith("Taşınmazların konumlandığı Bursa ili, Nilüfer ilçesine ait"), `KULLANICI TALEBİ: çoklu raporda 'Taşınmazın' -> 'Taşınmazların' çoğullanmalı, bulunan: ${multi}`);
  assert.ok(multi.includes("söz konusu taşınmazlar,"), `KULLANICI TALEBİ: çoklu raporda 'taşınmaz' -> 'taşınmazlar' çoğullanmalı, bulunan: ${multi}`);
  console.log("buildClimateEarthquakeExplanation() çoklu taşınmaz (KULLANICI TALEBİ, ÇOĞUL) testi tamam.");
}

delete globalThis.climateEarthquakeData;

console.log("İklim ve Deprem Bilgileri: bölüm taşıma + çoklu taşınmaz çoğullama testleri başarılı.");
