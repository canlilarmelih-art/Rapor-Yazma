"use strict";

/*
  Regresyon: Zemin tipi "AnaTasinmaz" (Ana Taşınmaz) iken Tapu ve Mülkiyet
  bölümünde bağımsız bölüme özgü alanlar (Bağımsız Bölüm Niteliği, Blok,
  Giriş, Tapu Katı, Bağımsız Bölüm No, Arsa Payı, Arsa Payda) gizlenmeliydi.
  "Giriş" (titleEntrance) alanı eklendiğinde shouldHideField()'ın Tapu dalına
  eklenmeyi unutuldu; Arsa Payı/Payda da hiç eklenmemişti. Sonuç: Ana
  Taşınmaz seçiliyken bu alanlar tekrar/hâlâ görünüyordu (kullanıcı
  bildirimi).

  shouldHideField() gerçek app.js kaynağından izole çalıştırılır.
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
assert(foldStart >= 0 && mainGroundStart >= 0, "foldTurkish veya isMainPropertyGroundType bulunamadi.");

function hiddenFieldsFor(groundType) {
  const context = { state: { fields: { groundType } } };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(mainGroundStart, mainGroundEnd), context);
  vm.runInContext(appSource.slice(start, end), context);
  const keys = ["titleQuality", "titleBlockName", "titleEntrance", "titleFloor", "unitNo", "share", "denominator"];
  return Object.fromEntries(keys.map((key) => [key, context.shouldHideField("title", key)]));
}

// 1) Zemin tipi Ana Taşınmaz -> tum 7 alan gizlenmeli.
const hidden = hiddenFieldsFor("AnaTasinmaz");
Object.entries(hidden).forEach(([key, isHidden]) => {
  assert.equal(isHidden, true, `Ana Taşınmaz iken "${key}" gizlenmeli, gizlenmiyor.`);
});

// 2) Diger zemin tiplerinde (ör. KatMulkiyeti) hicbiri gizlenmemeli.
const visible = hiddenFieldsFor("KatMulkiyeti");
Object.entries(visible).forEach(([key, isHidden]) => {
  assert.equal(isHidden, false, `Kat Mülkiyeti'nde "${key}" gizlenmemeli, gizleniyor.`);
});

console.log("Ana Tasinmaz gizli alanlar testi tamam.");
