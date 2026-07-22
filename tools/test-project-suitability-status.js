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

const documentTableStart = appSource.indexOf("function getArchitecturalProjectReviewedDocumentRows");
const documentTableEnd = appSource.indexOf("function hasReviewedDocumentInfo", documentTableStart);
assert(documentTableStart >= 0 && documentTableEnd > documentTableStart, "Mimari proje belge satırı fonksiyonları bulunamadı.");
const documentTableContext = {
  state: {
    fields: {
      hasArchitecturalProject: "Evet",
      projectType: "Onaylı Mimari Projesi",
      projectDate: "2020-02-01",
      projectNo: "55",
      documentReviewInstitution: "Belediye",
    },
  },
  normalizeYesNoChoice: (value) => String(value || "").trim(),
  shouldUseProjectDifferenceComparison: () => false,
  normalizeDocumentInstitutionText: (value) => String(value || "").trim(),
  buildProjectReviewInstitutionSummary: () => "",
  getReviewedDocumentChronologicalEntries: (rows) => (rows || []).map((row, index) => ({
    row,
    index,
    date: String(row?.c2 || ""),
  })),
  parseReviewedDocumentDate: (value) => String(value || ""),
};
vm.runInNewContext(appSource.slice(documentTableStart, documentTableEnd), documentTableContext);
const reviewedEntries = documentTableContext.getReviewedDocumentTableEntries([
  { c0: "Yapı Ruhsatı", c1: "Belediye", c2: "2019-01-01", c3: "20", c4: "" },
]);
assert.equal(reviewedEntries.length, 2, "Mimari proje incelenen belgeler tablosuna eklenmedi.");
assert.equal(reviewedEntries[1].row.c0, "Onaylı Mimari Projesi");
assert.equal(reviewedEntries[1].row.c4, "Mimari Proje");
assert.equal(reviewedEntries[1].isArchitecturalProject, true);

console.log("project suitability status tests passed");
