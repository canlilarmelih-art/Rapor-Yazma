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
  shouldShowArchitecturalProjectFields: () => true,
  isLandProjectReview: () => false,
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
assert.equal(reviewedEntries[1].row.c4, "Onaylı Mimari Projesi");
assert.equal(reviewedEntries[1].isArchitecturalProject, true);

// --- Vakıf Katılım "İncelenen Belgeler" üç belge sütunu ---------------------
// Regresyon: "Tasdikli Mimari Projesi" sütunu boş geliyordu, çünkü arama
// yalnızca state.tables.documents üzerinde yapılıyordu; mimari proje satırı
// ise ÜRETİLEN bir satır ve sadece getReviewedDocumentTableEntries()
// birleşik listesinde yer alıyor.
const docColumnStart = appSource.indexOf("function isPermitLikeDocument");
const docColumnEnd = appSource.indexOf("function buildOccupancyPermitDocumentSentence", docColumnStart);
assert(docColumnStart >= 0 && docColumnEnd > docColumnStart, "Belge sutunu yardimcilari bulunamadi.");
const foldTr = (value) => String(value || "").toLocaleUpperCase("tr-TR")
  .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
  .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C");
// Kullanıcının bildirdiği gerçek senaryo: üç ruhsat + üretilen proje satırı.
const combinedDocumentRows = [
  { c0: "Yeni Yapı Ruhsatı", c1: "Yıldırım Belediyesi", c2: "21.07.2017", c3: "653/09", c4: "" },
  { c0: "Tadilat Ruhsatı", c1: "Yıldırım Belediyesi", c2: "24.01.2020", c3: "697/19", c4: "" },
  { c0: "Kat İrtifakı Projesi", c1: "Webtapu Portalı ve Yıldırım Belediyesi", c2: "24.01.2020", c3: "697/19", c4: "Kat İrtifakı Projesi" },
  { c0: "İsim Değişikliği Ruhsatı", c1: "Yıldırım Belediyesi", c2: "27.03.2023", c3: "750/04", c4: "" },
];
const docColumnContext = {
  state: { tables: { buildingFloors: [{ residential: "20", shop: "1", office: "", storage: "" }] } },
  foldTurkish: foldTr,
  isBuildingCompletionOccupancyDocument: (type) => /YAPI\s*KULLANMA/.test(foldTr(type)),
  dateIsoToTr: (value) => {
    const iso = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    return iso ? `${iso[3].padStart(2, "0")}.${iso[2].padStart(2, "0")}.${iso[1]}` : String(value || "");
  },
  parseBuildingFloorCount: (value) => Number.parseInt(String(value || "0"), 10) || 0,
  // Birleşik liste: eskiden yeniye sıralı (gerçek fonksiyonun sözleşmesi).
  getReviewedDocumentTableEntries: () => combinedDocumentRows.map((row, index) => ({ row, index })),
  // Bilerek yalnızca KULLANICI satırlarını döndürür (üretilen proje satırı yok).
  // Arama bu kaynağa geri dönerse mimari proje sütunu boşalır ve aşağıdaki
  // assert patlar — regresyonun tekrar sızmasını engeller.
  getReviewedDocumentChronologicalEntries: () => combinedDocumentRows
    .filter((row) => !/PROJE/.test(foldTr(row.c0)))
    .map((row, index) => ({ row, index })),
};
vm.runInNewContext(appSource.slice(docColumnStart, docColumnEnd), docColumnContext);

assert.equal(
  docColumnContext.getArchitecturalProjectDateText(),
  "24.01.2020",
  "Tasdikli Mimari Projesi tarihi bulunamadi (uretilen proje satiri atlanmis)."
);
assert.equal(
  docColumnContext.getArchitecturalProjectNoText(),
  "697/19",
  "Tasdikli Mimari Projesi belge no bulunamadi."
);
// "En yeni" ruhsat: proje satiri ruhsat sayilmamali, iskan da ruhsat degil.
assert.equal(
  docColumnContext.getLatestBuildingPermitDateText(),
  "27.03.2023",
  "En yeni yapi ruhsati tarihi yanlis."
);
assert.equal(docColumnContext.getLatestBuildingPermitNoText(), "750/04", "En yeni yapi ruhsati no yanlis.");
// İskan belgesi listede yok → boş kalmalı (uydurma değer üretmemeli).
assert.equal(docColumnContext.getOccupancyPermitNoText(), "", "Iskan belgesi yokken bos donmeli.");
// Kullanım Türü: blokta daire + dükkan var → "Mesken ve İşyeri".
assert.equal(
  docColumnContext.getBuildingUsageTypesText(),
  "Mesken ve İşyeri",
  "Blok kullanim turu daire+dukkan icin 'Mesken ve İşyeri' olmali."
);

console.log("project suitability status tests passed");
