"use strict";

/*
  Kullanici talebi (2026-08-17): "arsa ve arazi raporlarinda adres ve konum
  bolumunde site apartman blok giris dis kapi no ic kapi no uavt ve posta
  kodu bolumleri gizlenmeli" + devam: "Kat bolumu kalmis o kismi da
  kaldiralim" — bu 8 alan bir binadaki bagimsiz bolumun adres kimligine
  ait; Arsa/Tarla (isLandOwnershipType) raporlarinda ortada bir bagimsiz
  bolum olmadigindan anlamsiz.

  shouldHideField() gercek app.js kaynagindan izole calistirilir (bkz.
  tools/test-land-classification-visibility.js'teki AYNI teknik).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

const shouldHideFieldStart = appSource.indexOf("function shouldHideField(");
const shouldHideFieldEnd = appSource.indexOf("\nfunction shouldHideLandAgricultureControls", shouldHideFieldStart);
assert(shouldHideFieldStart >= 0 && shouldHideFieldEnd > shouldHideFieldStart, "shouldHideField bulunamadi.");
const shouldHideFieldSrc = appSource.slice(shouldHideFieldStart, shouldHideFieldEnd);

const foldTurkishSrc = sliceFn("function foldTurkish(");
const normalizeOwnershipTypeSrc = sliceFn("function normalizeOwnershipTypeForSectionVisibility(");
const isLandOwnershipTypeSrc = sliceFn("function isLandOwnershipType(");
const isTarlaOwnershipTypeSrc = sliceFn("function isTarlaOwnershipType(");
const isArsaOwnershipTypeSrc = sliceFn("function isArsaOwnershipType(");

function isHiddenFor(ownershipType, fieldKey) {
  const context = {
    state: { fields: { ownershipType } },
    // Yalnizca LAND_HIDDEN_KEYS DISINDAKI alanlar icin (kapsam-disi kontrolu,
    // senaryo 3) shouldHideField'in "address" bloğunun devamina dusulur —
    // bu yardimcilar orada kullanilir, gercek davranislari bu testin
    // kapsami disinda oldugundan zararsiz sabit degerler yeterli.
    detectEnvironmentalRegionType: () => "",
    isZiraatBankSelectedForPropertyTaxDeclaration: () => false,
  };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(normalizeOwnershipTypeSrc, context);
  vm.runInContext(isLandOwnershipTypeSrc, context);
  vm.runInContext(isTarlaOwnershipTypeSrc, context);
  vm.runInContext(isArsaOwnershipTypeSrc, context);
  vm.runInContext(shouldHideFieldSrc, context);
  return context.shouldHideField("address", fieldKey);
}

const LAND_HIDDEN_KEYS = ["addressSiteName", "addressBlockName", "addressEntrance", "outerDoor", "addressFloor", "innerDoor", "uavt", "postalCode"];

// --- 1) Arsa/Tarla mulkiyetinde 8 alanin TUMU gizlenmeli. ------------------
["Arsa", "Tarla"].forEach((ownershipType) => {
  LAND_HIDDEN_KEYS.forEach((fieldKey) => {
    assert.equal(
      isHiddenFor(ownershipType, fieldKey),
      true,
      `${ownershipType} mulkiyetinde "${fieldKey}" gizli olmaliydi.`
    );
  });
});

// --- 2) Bina niteligindeki mulkiyet turlerinde (Dikey/Yatay Kat Irtifaki, --
// Mustakil Bina) HICBIRI gizlenmemeli — REGRESYON kontrolu (bagimsiz
// bolumu olan raporlarda bu alanlar hala gerekli).
["Dikey Kat İrtifakı", "Yatay Kat İrtifakı", "Müstakil Bina", ""].forEach((ownershipType) => {
  LAND_HIDDEN_KEYS.forEach((fieldKey) => {
    assert.equal(
      isHiddenFor(ownershipType, fieldKey),
      false,
      `"${ownershipType || "(bos)"}" mulkiyetinde "${fieldKey}" GIZLENMEMELIYDI.`
    );
  });
});

// --- 3) Listeye dahil OLMAYAN adres alanlari (Sokak/Cadde, Il/Ilce/Mahalle --
// vb.) HICBIR mulkiyet turunde bu kuralla gizlenmemeli.
["street", "city", "district", "neighborhood"].forEach((fieldKey) => {
  assert.equal(isHiddenFor("Arsa", fieldKey), false, `"${fieldKey}" bu kuralla gizlenmemeliydi (kapsam disi alan).`);
});

console.log("Arsa/Tarla raporlarinda adres alanlarinin gizlenmesi testi tamam.");
