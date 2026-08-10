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
  [sliceFunction("isMultiTitleUnitReportForNarrative"), sliceFunction("pluralizeEnvironmentalSubjectText")].join("\n"),
  context,
);

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

console.log("Coklu cevre aciklamalarinda tasinmaz cogullastirma testi tamam.");
