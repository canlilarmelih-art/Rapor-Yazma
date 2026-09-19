"use strict";

/*
  Kullanıcı bildirimi (2026-09-19): "müstakil yapılarda tapuda genelde
  proje bulunmuyor o yüzden eğer proje incelenen kurum webtapu seçilmesi
  ise webtapuda incelenmemiştir bulunamamıştır gibi ibareler olmamalı."

  buildNoArchitecturalProjectDescription() ("Mimari Proje Var mı?" =
  "Hayır" iken "Proje İnceleme Açıklaması"nı üreten fonksiyon), kullanıcının
  Belgeler ve Proje bölümünde SEÇTİĞİ kurumdan (projectInstitution) TAMAMEN
  BAĞIMSIZ olarak HER ZAMAN "{ilçe} Belediyesi ve Webtapu Portalında ...
  bulunamamıştır" diyordu. Müstakil Bina (genelde ruhsatsız/kayıt dışı)
  yapılarda Webtapu'da proje "aranıp bulunamaması" beklenen/normal bir
  durumdur, rapor metninde bunu bir "eksiklik" gibi vurgulamak yanıltıcı —
  kullanıcı bunun KALDIRILMASINI istedi.

  Düzeltme: Müstakil Bina'da VE kullanıcı projectInstitution'ı GERÇEKTEN
  Webtapu'yu İÇERECEK şekilde seçtiyse Webtapu bu cümleden çıkarılır
  (Belediye de seçiliyse yalnız Belediye anılır; yalnız Webtapu seçiliyse
  kurum adı hiç anılmaz). Hiçbir kurum seçilmemişse (varsayılan durum)
  eski iki-kurumlu cümle DEĞİŞMEDEN kalır. Müstakil Bina DIŞINDAKİ (ör.
  Dikey Kat İrtifakı) mülkiyet türlerinde davranış TAMAMEN DEĞİŞMEDEN
  kalır (regresyon kilidi, bkz. Senaryo 1).

  Bu test buildNoArchitecturalProjectDescription()'ı GERÇEK app.js
  kaynağından (yardımcı fonksiyonlarıyla birlikte) izole çalıştırır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") { parenDepth -= 1; if (parenDepth === 0) break; }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") { depth -= 1; if (depth === 0) return appSource.slice(start + 1, index + 1); }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "foldTurkish",
  "normalizeOwnershipTypeForSectionVisibility",
  "isMustakilBinaOwnershipType",
  "isLandProjectReview",
  "getSelectedProjectInstitutions",
  "projectInstitutionIncludes",
  "isOsbInstitutionValue",
  "getProjectReviewDistrictText",
  "buildNoArchitecturalProjectDescription",
];

function buildContext(fields) {
  const context = {
    state: { fields },
    normalizeReportTitleText: (value) => String(value || "").trim(),
    normalizeReportDescriptionText: (value) => String(value || "").replace(/\n{3,}/g, "\n\n").trim(),
    normalizeYesNoChoice: (value) => {
      const text = String(value || "").trim();
      if (text === "Evet" || text === "Hayır") return text;
      return "";
    },
    parseReportNumber: (value) => {
      const num = Number(String(value || "").replace(",", "."));
      return Number.isFinite(num) ? num : Number.NaN;
    },
    formatSquareMeterArea: (value) => `${value} m²`,
  };
  const source = functionNames.map(extractFunction).join("\n");
  vm.createContext(context);
  vm.runInContext(source, context);
  return context;
}

// --- 1) REGRESYON KİLİDİ: Müstakil Bina OLMAYAN mülkiyette (Dikey Kat
// İrtifakı) davranış DEĞİŞMEMELİ — Webtapu seçili olsa BİLE eski iki-
// kurumlu cümle aynen görünmeli. -----------------------------------------
{
  const context = buildContext({
    ownershipType: "Dikey Kat İrtifakı",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /Kadıköy Belediyesi ve Webtapu Portalında yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina DIŞINDAKİ mülkiyette eski iki-kurumlu cümle DEĞİŞMEMELİ (regresyon): ${result}`
  );
  console.log("Regresyon: Müstakil Bina DIŞINDAKİ mülkiyette Webtapu ifadesi DEĞİŞMEDİ testi tamam.");
}

// --- 2) REGRESYON KİLİDİ: Müstakil Bina'da HİÇBİR kurum seçilmemişse ----
// (varsayılan durum) eski iki-kurumlu cümle DEĞİŞMEMELİ. -----------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /Kadıköy Belediyesi ve Webtapu Portalında yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina'da kurum SEÇİLMEMİŞKEN eski iki-kurumlu cümle DEĞİŞMEMELİ (regresyon): ${result}`
  );
  console.log("Regresyon: Müstakil Bina + kurum seçilmemiş -> eski cümle DEĞİŞMEDİ testi tamam.");
}

// --- 3) YENİ DAVRANIŞ: Müstakil Bina + SADECE Webtapu seçili -> Webtapu -
// hiç anılmamalı, kurum adı olmadan sade cümle. ---------------------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Müstakil Bina + yalnız Webtapu seçiliyken cümlede Webtapu HİÇ geçmemeli: ${result}`);
  assert.match(
    result,
    /^Ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + yalnız Webtapu seçiliyken kurum adı olmadan sade cümle beklenir: ${result}`
  );
  console.log("YENİ: Müstakil Bina + yalnız Webtapu seçili -> Webtapu ifadesi kaldırıldı testi tamam.");
}

// --- 4) YENİ DAVRANIŞ: Müstakil Bina + Webtapu VE Belediye ikisi de -----
// seçili -> yalnız Belediye anılmalı, Webtapu kaldırılmalı. ---------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu, Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.doesNotMatch(result, /Webtapu/i, `Müstakil Bina + Webtapu+Belediye seçiliyken cümlede Webtapu HİÇ geçmemeli: ${result}`);
  assert.match(
    result,
    /^Kadıköy Belediyesinde yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + Webtapu+Belediye seçiliyken yalnız Belediye anılmalı: ${result}`
  );
  console.log("YENİ: Müstakil Bina + Webtapu+Belediye seçili -> yalnız Belediye anıldı testi tamam.");
}

// --- 5) REGRESYON KİLİDİ: Müstakil Bina + SADECE Belediye seçili -> ------
// Webtapu zaten SEÇİLMEDİĞİ için suppress tetiklenmez, eski iki-kurumlu
// cümle DEĞİŞMEDEN kalır (kullanıcının bildirdiği koşul özellikle
// "webtapu seçilmesi ise" idi). -------------------------------------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Belediye",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(
    result,
    /Kadıköy Belediyesi ve Webtapu Portalında yapılan incelemelerde ekspertize konu taşınmaza ait mimari proje bulunamamıştır\./,
    `Müstakil Bina + yalnız Belediye seçiliyken (Webtapu seçili DEĞİL) eski cümle DEĞİŞMEMELİ: ${result}`
  );
  console.log("Regresyon: Müstakil Bina + yalnız Belediye seçili (Webtapu seçili değil) -> eski cümle DEĞİŞMEDİ testi tamam.");
}

// --- 6) Kadastro paragrafı, YENİ davranışta da eskisi gibi eklenmeye -----
// devam ediyor (ikinci paragraf, kurum cümlesinden BAĞIMSIZ). ------------
{
  const context = buildContext({
    ownershipType: "Müstakil Bina",
    titleDistrict: "Kadıköy",
    projectInstitution: "Webtapu",
    projectRegisteredInCadastre: "Evet",
    cadastralRegisteredBaseArea: "120",
  });
  const result = context.buildNoArchitecturalProjectDescription();
  assert.match(result, /pafta üzerine işli taban alanının 120 m² olduğu bilgisi alınmıştır\./, `Kadastro paragrafı Webtapu-hariç senaryoda da eklenmeye devam etmeli: ${result}`);
  console.log("Kadastro paragrafı, Webtapu kaldırılan senaryoda da korunuyor testi tamam.");
}

console.log("Müstakil Bina + Webtapu 'mimari proje bulunamamıştır' düzeltmesi testleri başarılı.");
