const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function buildProjectSuitabilityStatusSentence");
const end = appSource.indexOf("function buildProjectSuitabilityBuildingReferenceSentence", start);
assert(start >= 0 && end > start, "Proje uygunluk aciklamasi fonksiyonu bulunamadi.");
const source = appSource.slice(start, end);

const blockStatus = "blok bazında konum olarak uygun değildir.";
const context = {
  normalizeReportDescriptionText: (value) => String(value || "").replace(/\s+/g, " ").trim(),
  normalizeYesNoChoice: (value) => String(value || "").trim(),
  projectSuitabilityStatusKey: (value) => String(value || "").toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I")
    .replaceAll("Ş", "S")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C")
    .replaceAll(".", ""),
  stripProjectSuitabilityRepairSentence: (value) => String(value || "").trim(),
  shouldShowProjectSuitabilityRepair: () => false,
};
vm.runInNewContext(source, context);

const result = context.buildProjectSuitabilityStatusSentence(
  blockStatus,
  "Vaziyet planında blok konumu farklı tespit edilmiştir.",
  "Evet",
);
assert.equal(
  result,
  "Ekspertize konu taşınmaz blok bazında projesine uygun değildir. Vaziyet planında blok konumu farklı tespit edilmiştir.",
);
assert.doesNotMatch(result, /Basit bir tadilat/i);

const reviewStart = appSource.indexOf("function buildProjectReviewExplanation");
const reviewEnd = appSource.indexOf("function buildProjectSuitabilityDescription", reviewStart);
assert(reviewStart >= 0 && reviewEnd > reviewStart, "Birlesik proje inceleme aciklamasi fonksiyonu bulunamadi.");
const reviewContext = {
  normalizeReportDescriptionText: (value) => String(value || "").trim(),
  buildProjectReviewDescription: () => "Mevcut proje inceleme açıklaması.",
  buildBuildingFootprintAndEntranceExplanation: () => "Bina oturumu ve giriş açıklaması.",
  buildProjectSuitabilityDescription: () => "Ekspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur.",
};
vm.runInNewContext(appSource.slice(reviewStart, reviewEnd), reviewContext);
assert.equal(
  reviewContext.buildProjectReviewExplanation(),
  "Mevcut proje inceleme açıklaması.\n\nBina oturumu ve giriş açıklaması.\n\nEkspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur.",
);

assert.match(appSource, /function createProjectReviewDescriptionField\(/);
assert.match(appSource, /wrapper\.append\(createProjectReviewDescriptionField\(\)\)/);
assert.doesNotMatch(appSource, /project-suitability-explanation/);

console.log("project suitability status tests passed");
