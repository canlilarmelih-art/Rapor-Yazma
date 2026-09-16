"use strict";

/*
  Kullanici talebi (2026-09-16): "Degerleme bolumunde varsayilan emlak
  beyan degeri kutucugu isaretsiz olarak geliyor. Coklu raporlarda eger
  tum tasinmazlarin emlak beyan degeri kutucugu isaretsiz ise 'Gursu
  Belediyesi Emlak Servisinde yapilan incelemelerde tasinmazlara ait
  rayic bedel hakkinda bilgilerin malik disindaki 3. Kisilere verilmedigi
  beyan edilmistir.' seklinde olmali."

  Kok durum: buildPropertyTaxDeclarationUnavailableExplanation() (kutucuk
  isaretsizken calisan varyant metni) SADECE aktif tasinmazin kendi
  propertyTaxDeclarationEnabled durumuna bakiyordu, TEKIL "tasinmaza"/
  "tasinmazin"/"gayrimenkulun" ozneli 3 varyanttan birini uretiyordu.
  Coklu Talep raporlarinda TUM tasinmazlar isaretsizken bile metin tekil
  kaliyordu (kullanicinin bildirdigi tam durum).

  Duzeltme: yeni areAllTitleUnitsPropertyTaxDeclarationDisabled() - TUM
  tasinmazlarin (getNarrativeTitleUnitFields()) propertyTaxDeclarationEnabled
  alaninin "1" OLMADIGINI dogrular. buildPropertyTaxDeclarationUnavailableExplanation()
  artik bu kosul (VE coklu tasinmaz raporu) dogruyken, mevcut GENEL
  pluralizeEnvironmentalSubjectText() ile metni cogullar (bu fonksiyon
  zaten "tasinmaza"->"tasinmazlara", "tasinmazin"->"tasinmazlarin",
  "gayrimenkulun"->"gayrimenkullerin" donusumlerini destekliyor - 3
  varyantin HER BIRI icin AYRI AYRI dogrulanir).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// test-comparable-bound-neighborhood-distance.js'teki AYNI paren+quote-
// farkinda brace-derinligi sayaci (varsayilan parametrelerdeki "{}" veya
// regex/string literallerdeki "{"/"}" karakterlerini gercek kod blogu
// sanmaz; "async function" onekini de destekler).
function extractFunction(name) {
  const marker = `function ${name}(`;
  let start = appSource.indexOf(`\n${marker}`);
  if (start < 0) start = appSource.indexOf(`\nasync ${marker}`);
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
  let quote = null;
  let prevSignificant = "";
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    const next = appSource[index + 1];
    if (quote) {
      if (quote === "/") {
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
  "getProjectReviewDistrictText",
  "getPropertyTaxDeclarationMunicipalityText",
  "isPropertyTaxDeclarationEnabled",
  "selectVariant",
  "registerVariantGroup",
  "pluralizeEnvironmentalSubjectText",
  "isMultiTitleUnitReportForNarrative",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "getNarrativeTitleUnitFields",
  "areAllTitleUnitsPropertyTaxDeclarationDisabled",
  "buildPropertyTaxDeclarationUnavailableExplanation",
];

// getProjectReviewDistrictText()'in normalizeReportTitleText bağımlılığı
// bu dosyanın konusu DEĞİL (ilçe adının Baş Harf Büyük yazılışı zaten
// başka testlerde kapsanıyor) — basit "geçiştir" saplaması yeterli.
const sandboxSource = `
  let state = {};
  function setState(s) { state = s; }
  function normalizeReportTitleText(value) { return String(value || "").trim(); }
  function isCondominiumEasementOwnershipType() { return false; }
  const propertyTaxDeclarationUnavailableVariants = [
    (municipality) => \`\${municipality} Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.\`,
    (municipality) => \`\${municipality} Emlak Servisi nezdinde yapılan araştırmada, taşınmazın rayiç bedeline ilişkin bilgilerin malik dışındaki üçüncü kişilerle paylaşılmadığı belirtilmiştir.\`,
    (municipality) => \`\${municipality} Emlak Servisinden yapılan sorgulamada, gayrimenkulün rayiç değerine dair bilgilerin yalnızca malike açıklandığı, üçüncü kişilere verilmediği ifade edilmiştir.\`,
  ];
  const VARIANT_REGISTRY = [];
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState,
    isPropertyTaxDeclarationEnabled,
    getPropertyTaxDeclarationMunicipalityText,
    areAllTitleUnitsPropertyTaxDeclarationDisabled,
    buildPropertyTaxDeclarationUnavailableExplanation,
    setSelectedVariant: (index) => { state.fields.variantOverrides = { buildPropertyTaxDeclarationUnavailableExplanation: index }; },
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function freshState(fields = {}) {
  return {
    fields: { requestType: "Çoklu Talep", district: "Gürsu", ...fields },
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
  };
}

// --- 1) TEKİL rapor: kutucuk işaretsiz -> mevcut TEKİL varyant, DEĞİŞMEDEN. -
{
  const context = freshState({ requestType: "Tekli Talep" });
  fns.setState(context);
  const text = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(
    text,
    "Gürsu Belediyesi Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.",
    `Tekil raporda eski TEKİL metin (REGRESYON) korunmalı, bulunan: ${text}`,
  );
  console.log("Tekil rapor: emlak beyan değeri işaretsiz TEKİL metin (REGRESYON) testi tamam.");
}

// --- 2) KULLANICI TALEBİ: Çoklu Talep + TÜM taşınmazlar işaretsiz -> --------
// kullanıcının TAM bildirdiği çoğul metin.
{
  const context = freshState({
    requestType: "Çoklu Talep",
    district: "Gürsu",
    propertyTaxDeclarationEnabled: "",
  });
  context.titleUnits = [{ fields: { propertyTaxDeclarationEnabled: "" } }, { fields: { propertyTaxDeclarationEnabled: "" } }];
  fns.setState(context);
  assert.equal(fns.areAllTitleUnitsPropertyTaxDeclarationDisabled(), true, "sanity: tüm taşınmazlar işaretsiz sayılmalı.");
  const text = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(
    text,
    "Gürsu Belediyesi Emlak Servisinde yapılan incelemelerde taşınmazlara ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.",
    `KULLANICI TALEBİ: tüm taşınmazlar işaretsizken tam bildirilen ÇOĞUL metin üretilmeli, bulunan: ${text}`,
  );
  console.log("KULLANICI TALEBİ: Çoklu Talep + TÜM taşınmazlar işaretsiz -> ÇOĞUL metin testi tamam.");
}

// --- 3) Diğer 2 varyant da (taşınmazın.../gayrimenkulün...) doğru çoğullanmalı. -
{
  const context = freshState({ requestType: "Çoklu Talep", district: "Gürsu" });
  context.titleUnits = [{ fields: { propertyTaxDeclarationEnabled: "" } }];
  fns.setState(context);

  fns.setSelectedVariant(1);
  const textV1 = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(
    textV1,
    "Gürsu Belediyesi Emlak Servisi nezdinde yapılan araştırmada, taşınmazların rayiç bedeline ilişkin bilgilerin malik dışındaki üçüncü kişilerle paylaşılmadığı belirtilmiştir.",
    `2. varyant ("taşınmazın...") da çoğullanmalı, bulunan: ${textV1}`,
  );

  fns.setSelectedVariant(2);
  const textV2 = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(
    textV2,
    "Gürsu Belediyesi Emlak Servisinden yapılan sorgulamada, gayrimenkullerin rayiç değerine dair bilgilerin yalnızca malike açıklandığı, üçüncü kişilere verilmediği ifade edilmiştir.",
    `3. varyant ("gayrimenkulün...") da çoğullanmalı, bulunan: ${textV2}`,
  );
  console.log("Diğer 2 varyantın (taşınmazın.../gayrimenkulün...) çoğullanması testi tamam.");
}

// --- 4) REGRESYON: Çoklu Talep ama bir taşınmaz İŞARETLİ (karışık durum) ----
// -> aktif taşınmaz işaretsiz olsa bile TEKİL kalmalı (yalnızca TÜMÜ
// işaretsizken çoğullama uygulanır).
{
  const context = freshState({ requestType: "Çoklu Talep", district: "Gürsu", propertyTaxDeclarationEnabled: "" });
  context.titleUnits = [{ fields: { propertyTaxDeclarationEnabled: "1", propertyTaxDeclarationValue: "500000" } }];
  fns.setState(context);
  assert.equal(fns.areAllTitleUnitsPropertyTaxDeclarationDisabled(), false, "sanity: bir taşınmaz işaretliyken 'tümü işaretsiz' YANLIŞ olmalı.");
  const text = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(
    text,
    "Gürsu Belediyesi Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.",
    `REGRESYON: karışık durumda (bazı taşınmazlar işaretli) TEKİL metin korunmalı, bulunan: ${text}`,
  );
  console.log("REGRESYON: karışık durumda (bazı taşınmazlar işaretli) TEKİL metin testi tamam.");
}

// --- 5) REGRESYON: kutucuk İŞARETLİYSE bu açıklama hâlâ boş dönmeli --------
// (bu fonksiyonun kapsamı DEĞİL, buildPropertyTaxDeclarationValueExplanation'ın).
{
  const context = freshState({ requestType: "Çoklu Talep", district: "Gürsu", propertyTaxDeclarationEnabled: "1" });
  fns.setState(context);
  const text = fns.buildPropertyTaxDeclarationUnavailableExplanation();
  assert.equal(text, "", `REGRESYON: kutucuk işaretliyken bu açıklama boş dönmeli, bulunan: ${text}`);
  console.log("REGRESYON: kutucuk işaretliyken boş açıklama testi tamam.");
}

console.log("Emlak Beyan Değeri (işaretsiz) çoğullama testleri başarılı.");
