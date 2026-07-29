"use strict";

/*
  Adres ve Konum bolumundeki Il/Ilce/Idari mahalle icin Tapu dropdown'undaki
  ile ayni mantik: idari veritabanindaki bir satirla YALNIZCA harf
  buyuklugu/aksan farkiyla eslesiyorsa deger "Bas Harf Buyuk" (title case)
  yazilisa duzeltilir. Eslesme yoksa (UAVT PDF'indeki deger veritabaninda
  yoksa) hicbir sey degistirilmez.

  applyAdministrativePlaceCasingFromMatch() gercek app.js kaynagindan
  izole calistirilir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function applyAdministrativePlaceCasingFromMatch");
const end = appSource.indexOf("\n}", start) + 2;
assert(start >= 0, "applyAdministrativePlaceCasingFromMatch fonksiyonu bulunamadi.");

const foldStart = appSource.indexOf("function foldTurkish(");
const foldEnd = appSource.indexOf("\n}", foldStart) + 2;
const titleCaseStart = appSource.indexOf("function toTitleCaseTr(");
const titleCaseEnd = appSource.indexOf("\n}", titleCaseStart) + 2;
assert(foldStart >= 0 && titleCaseStart >= 0, "foldTurkish veya toTitleCaseTr bulunamadi.");

function run(fieldsBefore, match) {
  const applied = [];
  const context = {
    state: { fields: { ...fieldsBefore } },
    applyLocalNeighborhoodFields: (fields, options) => {
      applied.push({ fields, options });
      Object.entries(fields).forEach(([key, value]) => { context.state.fields[key] = value; });
    },
  };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(titleCaseStart, titleCaseEnd), context);
  vm.runInContext(appSource.slice(start, end), context);
  const changed = context.applyAdministrativePlaceCasingFromMatch(match, { silent: true });
  return { changed, fields: context.state.fields, applied };
}

// 1) UAVT PDF'inden ALL-CAPS gelen deger, idari veritabanindaki ayni yerle
//    (case-insensitive) eslesiyor -> Baş Harf Büyük yazilisa duzeltilmeli.
const r1 = run(
  { city: "YALOVA", district: "ARMUTLU", neighborhood: "KARŞIYAKA" },
  { city: "Yalova", district: "Armutlu", neighborhood: "Karşıyaka" },
);
assert.equal(r1.changed, true, "Eslesen deger duzeltilmeli.");
assert.equal(r1.fields.city, "Yalova", "Il Bas Harf Buyuk olmali.");
assert.equal(r1.fields.district, "Armutlu", "Ilce Bas Harf Buyuk olmali.");
assert.equal(r1.fields.neighborhood, "Karşıyaka", "Mahalle Bas Harf Buyuk olmali.");
assert.equal(r1.applied[0].options.force, true, "Duzeltme force ile uygulanmali.");

// 2) Zaten dogru yazilan deger tekrar degistirilmemeli, applyLocalNeighborhoodFields
//    cagrilmamali (gereksiz autosave/render tetiklenmesin).
const r2 = run(
  { city: "Yalova", district: "Armutlu", neighborhood: "Karşıyaka" },
  { city: "Yalova", district: "Armutlu", neighborhood: "Karşıyaka" },
);
assert.equal(r2.changed, false, "Zaten doğru yazilan deger degismemeli.");
assert.equal(r2.applied.length, 0, "Degisiklik yoksa applyLocalNeighborhoodFields cagrilmamali.");

// 3) Eslesme YOK (match null, ör. UAVT'teki mahalle veritabaninda bulunamadi):
//    UAVT PDF'ten gelen deger AYNEN korunmali, hicbir sey degismemeli.
const r3 = run(
  { city: "YALOVA", district: "ARMUTLU", neighborhood: "UYDURMA MAHALLE" },
  null,
);
assert.equal(r3.changed, false, "Eslesme yokken hicbir alan degismemeli.");
assert.equal(r3.fields.neighborhood, "UYDURMA MAHALLE", "Eslesmeyen mahalle UAVT'ten geldigi gibi korunmali.");

// 4) Deger DB'deki eslesenden FARKLI bir yer ise (foldTurkish esit degil)
//    dokunulmamali — yanlis yere zorla eslestirme yapilmamali.
const r4 = run(
  { city: "YALOVA", district: "ARMUTLU", neighborhood: "BAYIR" },
  { city: "Yalova", district: "Armutlu", neighborhood: "Karşıyaka" },
);
assert.equal(r4.fields.neighborhood, "BAYIR", "Farkli mahalle DB eslesenine zorla degistirilmemeli.");

console.log("Adres yer adi harf buyuklugu duzeltme testi tamam.");
