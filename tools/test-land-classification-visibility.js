"use strict";

/*
  Kullanici talebi: "Arazi Sınıflandırması" (landClassification, Arsa
  Özellikleri bölümü) yalnızca Arazi/Tarla raporlarında bulunmali; Müstakil
  Bina ve Arsa raporlarinda gösterilmemeli. Bu alan zaten var olan
  shouldHideLandAgricultureControls() kuralina (Tarım Türü/Zirai Ürün ile
  ayni kapsam) eklendi.

  shouldHideField() gerçek app.js kaynağından izole çalıştırılır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function shouldHideField(");
const end = appSource.indexOf("\nfunction shouldHideLandAgricultureControls", start);
const controlsStart = appSource.indexOf("function shouldHideLandAgricultureControls(");
const controlsEnd = appSource.indexOf("\n}", controlsStart) + 2;
assert(start >= 0 && end > start && controlsStart >= 0, "shouldHideField/shouldHideLandAgricultureControls bulunamadi.");

const foldStart = appSource.indexOf("function foldTurkish(");
const foldEnd = appSource.indexOf("\n}", foldStart) + 2;
assert(foldStart >= 0, "foldTurkish bulunamadi.");

function isHiddenFor(ownershipType, legalUsageNature = "") {
  const context = { state: { fields: { ownershipType, legalUsageNature } } };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(controlsStart, controlsEnd), context);
  vm.runInContext(appSource.slice(start, end), context);
  return context.shouldHideField("land", "landClassification");
}

assert.equal(isHiddenFor("Tarla"), false, "Tarla mülkiyetinde Arazi Sınıflandırması görünür olmalı.");
assert.equal(isHiddenFor("Arsa"), true, "Arsa mülkiyetinde Arazi Sınıflandırması gizli olmalı.");
assert.equal(isHiddenFor("Müstakil Bina"), true, "Müstakil Bina mülkiyetinde Arazi Sınıflandırması gizli olmalı.");
assert.equal(isHiddenFor("Dikey Kat İrtifakı"), false, "Dikey Kat İrtifakı'nda gizlenmemeli (zaten bölüm hariç tutuluyor, kural burada devrede değil).");
assert.equal(isHiddenFor("", "Arsa"), true, "legalUsageNature=Arsa iken de gizli olmalı (mevcut kural, mülkiyetten bağımsız).");

console.log("Arazi Siniflandirmasi gorunurluk testi tamam.");
