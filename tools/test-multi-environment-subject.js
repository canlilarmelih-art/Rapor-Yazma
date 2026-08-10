"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

const context = { state: { titleUnits: [{}] } };
vm.createContext(context);
vm.runInContext(
  [
    sliceFunction("isMultiTitleUnitReportForNarrative"),
    sliceFunction("pluralizeEnvironmentalSubjectText"),
    sliceFunction("formatZiraatLocationSubject"),
  ].join("\n"),
  context,
);

const ziraatSubject = context.formatZiraatLocationSubject({
  city: "Düzce",
  district: "Merkez",
  neighborhood: "Sancaklar",
  blockNo: "709",
  parcelNo: "2",
  siteName: "Nurol",
  blockName: "A",
  floor: "Zemin",
  unitNo: "2",
});
assert.equal(ziraatSubject, "Ekspertize konu taşınmaz, Düzce ili, Merkez ilçesi, Sancaklar mahallesi üzerinde konumludur");

assert.equal(
  context.pluralizeEnvironmentalSubjectText("Taşınmazın yakın çevresinde gayrimenkule ulaşım mümkündür."),
  "Taşınmazların yakın çevresinde gayrimenkullere ulaşım mümkündür.",
);
assert.equal(
  context.pluralizeEnvironmentalSubjectText("Taşınmazın yakın çevresinde.", false),
  "Taşınmazın yakın çevresinde.",
);
assert.equal(context.isMultiTitleUnitReportForNarrative(), true);

assert.match(appSource, /buildZiraatLocationEnvironmentalExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildZiraatDevelopmentAnalysisExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildZiraatBuildingPatternExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildEnvironmentalDescription\([\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildEnvironmentalIntro\([\s\S]*?sharedBaseLocation/);
assert.match(appSource, /formatZiraatLocationSubject\([\s\S]*?isSharedMultiTitleUnitNarrative/);

console.log("Coklu cevre aciklamalarinda tasinmaz cogullastirma testi tamam.");
