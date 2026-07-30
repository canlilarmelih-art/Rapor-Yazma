"use strict";

/*
  Regresyon: Tapu ve Mülkiyet bölümünde bağımsız bölüme özgü alanlar
  (Bağımsız Bölüm Niteliği, Blok, Giriş, Tapu Katı, Bağımsız Bölüm No,
  Arsa Payı, Arsa Payda) iki durumda gizlenmeli:
    1) Zemin tipi "AnaTasinmaz" (Ana Taşınmaz) ise, VEYA
    2) Mülkiyet "Yatay Kat İrtifakı" / "Dikey Kat İrtifakı" DEĞİLSE
       (Müstakil Bina/Arsa/Tarla/seçilmemiş) — kullanıcı talebi.
  "Giriş" (titleEntrance) alanı eklendiğinde shouldHideField()'ın Tapu
  dalına eklenmeyi unutuldu; Arsa Payı/Payda da hiç eklenmemişti; Mülkiyet
  koşulu da hiç yoktu. Sonuç: bu alanlar olmaması gereken durumlarda
  görünüyordu (kullanıcı bildirimi).

  shouldHideField() gerçek app.js kaynağından izole çalıştırılır.
  normalizeReportTitleText, getOwnershipTypeText'in bağımlılığıdır ve
  bu testin kapsamı dışında (metin normalizasyonu değil, gizleme mantığı
  test ediliyor) olduğundan kimlik (identity) fonksiyonuyla stub'lanır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function shouldHideField(");
const end = appSource.indexOf("\nfunction shouldHideLandAgricultureControls", start);
assert(start >= 0 && end > start, "shouldHideField fonksiyonu bulunamadi.");

const foldStart = appSource.indexOf("function foldTurkish(");
const foldEnd = appSource.indexOf("\n}", foldStart) + 2;
const mainGroundStart = appSource.indexOf("function isMainPropertyGroundType(");
const mainGroundEnd = appSource.indexOf("\n}", mainGroundStart) + 2;
const ownershipTextStart = appSource.indexOf("function getOwnershipTypeText(");
const ownershipTextEnd = appSource.indexOf("\n}", ownershipTextStart) + 2;
const condoStart = appSource.indexOf("function isCondominiumOwnershipType(");
const condoEnd = appSource.indexOf("\n}", condoStart) + 2;
assert(
  foldStart >= 0 && mainGroundStart >= 0 && ownershipTextStart >= 0 && condoStart >= 0,
  "foldTurkish / isMainPropertyGroundType / getOwnershipTypeText / isCondominiumOwnershipType bulunamadi."
);

function hiddenFieldsFor(groundType, ownershipType = "") {
  const context = {
    state: { fields: { groundType, ownershipType } },
    normalizeReportTitleText: (value) => value, // bkz. dosya basi aciklama
  };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(mainGroundStart, mainGroundEnd), context);
  vm.runInContext(appSource.slice(ownershipTextStart, ownershipTextEnd), context);
  vm.runInContext(appSource.slice(condoStart, condoEnd), context);
  vm.runInContext(appSource.slice(start, end), context);
  const keys = ["titleQuality", "titleBlockName", "titleEntrance", "titleFloor", "unitNo", "share", "denominator"];
  return Object.fromEntries(keys.map((key) => [key, context.shouldHideField("title", key)]));
}

function assertAllHidden(fields, groundType, ownershipType, label) {
  Object.entries(fields).forEach(([key, isHidden]) => {
    assert.equal(isHidden, true, `${label} (groundType=${groundType}, ownershipType=${JSON.stringify(ownershipType)}) iken "${key}" gizlenmeli, gizlenmiyor.`);
  });
}

function assertAllVisible(fields, groundType, ownershipType, label) {
  Object.entries(fields).forEach(([key, isHidden]) => {
    assert.equal(isHidden, false, `${label} (groundType=${groundType}, ownershipType=${JSON.stringify(ownershipType)}) iken "${key}" gizlenmemeli, gizleniyor.`);
  });
}

// 1) Zemin tipi Ana Taşınmaz -> Mülkiyetten bagimsiz tum 7 alan gizlenmeli.
assertAllHidden(hiddenFieldsFor("AnaTasinmaz", "Dikey Kat İrtifakı"), "AnaTasinmaz", "Dikey Kat İrtifakı", "Ana Taşınmaz");

// 2) Zemin tipi Kat Mülkiyeti + Mülkiyet Dikey/Yatay Kat İrtifakı -> gorunur.
assertAllVisible(hiddenFieldsFor("KatMulkiyeti", "Dikey Kat İrtifakı"), "KatMulkiyeti", "Dikey Kat İrtifakı", "Kat Mülkiyeti + Dikey K.İ.");
assertAllVisible(hiddenFieldsFor("KatMulkiyeti", "Yatay Kat İrtifakı"), "KatMulkiyeti", "Yatay Kat İrtifakı", "Kat Mülkiyeti + Yatay K.İ.");

// 3) Zemin tipi Kat Mülkiyeti ama Mülkiyet ne Yatay ne Dikey Kat İrtifakı
//    (Müstakil Bina, Arsa, Tarla, secilmemis) -> yine gizlenmeli (kullanici talebi).
["Müstakil Bina", "Arsa", "Tarla", ""].forEach((ownershipType) => {
  assertAllHidden(
    hiddenFieldsFor("KatMulkiyeti", ownershipType),
    "KatMulkiyeti",
    ownershipType,
    "Kat İrtifakı dışı mülkiyet"
  );
});

console.log("Ana Tasinmaz / Kat Irtifaki disi gizli alanlar testi tamam.");
