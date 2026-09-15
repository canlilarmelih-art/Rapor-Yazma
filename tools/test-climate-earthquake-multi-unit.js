"use strict";

/*
  Kullanici talebi (2026-09-15, iki mesaj):
  1) "İklim ve Deprem Bilgileri bölümünü adres ve konum sekmesine
     Çevresel Özellikler Açıklaması bölümünün altına taşıyalım. çoklu
     arazi taleplerinde İklim ve Deprem Bilgileri bölümünü çoklu olarak
     uyarla Taşınmaz > Taşınmazlar" (0.0.799 — AYRI panel, "address"
     bölümüne taşındı).
  2) "iklim ve deprem bilgileri paragrafını çevresel özellik açıklaması
     bölümünün en altına paragraf olarak ekle" (bu commit — AYRI panel
     TAMAMEN KALDIRILDI, metin artık environmentDescription'ın KENDİSİNİN
     SONUNA "\n\n" ile eklenen bir paragraf).

  Bu test üç kısmı doğrular:
  a) Kaynak-düzeyi: eski AYRI panel mekanizması (createLandClimateEarthquakePanel
     çağrısı/tanımı) TAMAMEN kaldırılmış; environmentDescription'ı yazan
     İKİ gerçek çağıran (createForm'un "self-heal" dalı +
     refreshEnvironmentDescriptionFromCurrentFields) artık
     buildEnvironmentDescriptionWithClimate()'i çağırıyor;
     "earthquakeZone" tetikleyici kümesine eklenmiş.
  b) buildClimateEarthquakeExplanation() çoklu taşınmaz raporunda
     "Taşınmazın"/"taşınmaz" -> "Taşınmazların"/"taşınmazlar" çoğullanır;
     tekil raporda DEĞİŞMEZ (gerçek fonksiyon, vm/Function extraction,
     0.0.799'dan DEĞİŞMEDİ).
  c) buildEnvironmentDescriptionWithClimate() (gerçek fonksiyon, alttaki
     buildEnvironmentalDescription/buildClimateEarthquakeExplanation
     GÖZLEMLENEBİLİR stub'larla) taban metnin SONUNA iklim paragrafını
     doğru ekliyor; iklim boşsa/usePlaceholderTokens iken taban metin
     TEK BAŞINA kalıyor.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- a) Kaynak-düzeyi: eski AYRI panel TAMAMEN kaldırıldı, iki gerçek -----
// yazan çağıran artık buildEnvironmentDescriptionWithClimate()'i kullanıyor.
{
  assert.doesNotMatch(
    appSource,
    /function createLandClimateEarthquakePanel\(|const climatePanel = createLandClimateEarthquakePanel\(\)/,
    "createLandClimateEarthquakePanel() (eski AYRI panel mekanizması) hem tanımı hem çağrısıyla TAMAMEN kaldırılmış olmalı — İklim ve Deprem Bilgileri artık environmentDescription'ın KENDİSİNE eklenen bir paragraf."
  );
  assert.match(
    appSource,
    /field\.key === "environmentDescription" && \(!value \|\| \/\\\{\\\{\[\^\}\]\+\\\}\\\}\/\.test\(value\)\)\) \{\s*state\.fields\.environmentDescription = buildEnvironmentDescriptionWithClimate\(\);/,
    "createForm()'un 'self-heal' dalı artık buildEnvironmentDescriptionWithClimate()'i çağırmalı (buildEnvironmentalDescription() DOĞRUDAN DEĞİL)."
  );
  assert.match(
    appSource,
    /function refreshEnvironmentDescriptionFromCurrentFields\(changedKey = ""\) \{\s*if \(!environmentDescriptionAutoRefreshFields\.has\(changedKey\)\) return;\s*const nextDescription = buildEnvironmentDescriptionWithClimate\(\);/,
    "refreshEnvironmentDescriptionFromCurrentFields() artık buildEnvironmentDescriptionWithClimate()'i çağırmalı."
  );
  assert.match(
    appSource,
    /const environmentDescriptionAutoRefreshFields = new Set\(\[[\s\S]{0,1500}?"earthquakeZone",\s*\]\);/,
    "'earthquakeZone' artık environmentDescriptionAutoRefreshFields tetikleyici kümesinde olmalı (Deprem derecesi değişince iklim paragrafı da tazelenmeli)."
  );

  console.log("İklim ve Deprem Bilgileri: eski AYRI panelin kaldırılması + yeni sarmalayıcının kablolanması kaynak-düzeyi testi tamam.");
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

// --- c) buildEnvironmentDescriptionWithClimate() (gerçek fonksiyon, -------
// alttaki İKİ ağır bağımlılık — buildEnvironmentalDescription (4 bölge
// dallı, bu testin odağı DEĞİL) ve buildClimateEarthquakeExplanation
// (yukarıda ZATEN gerçek fonksiyonla ayrıca test edildi) — gözlemlenebilir
// sabit stub'larla değiştirilir; bu testin odağı SADECE sarmalayıcının
// "\n\n" ile birleştirme/atlama mantığı).
{
  function extractWrapperFunction(name) {
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

  const wrapperSandboxSource = `
    let state = {};
    function setState(s) { state = s; }
    function normalizeReportDescriptionText(value) {
      return String(value || "").split("\\n").map((line) => line.trim()).filter(Boolean).join("\\n").trim();
    }
    function buildEnvironmentalDescription(regionType, options = {}) {
      return options.usePlaceholderTokens ? "BASE_PLACEHOLDER_TOKENS_METNİ" : (state.fields.__baseText ?? "TEMEL_ÇEVRESEL_METİN");
    }
    function buildClimateEarthquakeExplanation() {
      return state.fields.__climateText ?? "İKLİM_VE_DEPREM_METNİ";
    }
    ${extractWrapperFunction("buildEnvironmentDescriptionWithClimate")}
    return { setState, buildEnvironmentDescriptionWithClimate };
  `;
  // eslint-disable-next-line no-new-func
  const wrapperFns = new Function(wrapperSandboxSource)();

  wrapperFns.setState({ fields: {} });
  const combined = wrapperFns.buildEnvironmentDescriptionWithClimate();
  assert.equal(combined, "TEMEL_ÇEVRESEL_METİN\nİKLİM_VE_DEPREM_METNİ", `KULLANICI TALEBİ: iklim paragrafı taban metnin SONUNA eklenmeli, bulunan: ${combined}`);

  wrapperFns.setState({ fields: { __climateText: "" } });
  const noClimate = wrapperFns.buildEnvironmentDescriptionWithClimate();
  assert.equal(noClimate, "TEMEL_ÇEVRESEL_METİN", `İklim verisi (il/ilçe eşleşmesi) yoksa taban metin TEK BAŞINA kalmalı, bulunan: ${noClimate}`);

  wrapperFns.setState({ fields: {} });
  const placeholderPreview = wrapperFns.buildEnvironmentDescriptionWithClimate("Konut Bölgesi", { usePlaceholderTokens: true });
  assert.equal(placeholderPreview, "BASE_PLACEHOLDER_TOKENS_METNİ", `usePlaceholderTokens (Placeholder referans ekranı) modunda iklim paragrafı EKLENMEMELİ, bulunan: ${placeholderPreview}`);

  console.log("buildEnvironmentDescriptionWithClimate() birleştirme/atlama mantığı (gerçek sarmalayıcı fonksiyon) testi tamam.");
}

console.log("İklim ve Deprem Bilgileri: panel kaldırma + en alta paragraf ekleme + çoklu çoğullama testleri başarılı.");
