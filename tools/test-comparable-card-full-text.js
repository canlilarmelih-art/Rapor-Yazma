"use strict";

/*
  Kullanici talebi: "{{EMSAL_1_EMSAL_METNİ}} (İrtibat Kişisi ve Telefon No:
  Raif Bey / 0 (546) 582 19 29)\n\nEkspertize konu taşınmaz satılık olup,
  ... bu şekilde ben tüm emsallerde bunun yanında irtibat kişi ve telefon
  no olmayan versiyonunu da istiyorum." — getComparableCardFullText(index)
  irtibat satirini parantez icinde bir bosluk satiriyla aciklamaya ekliyor;
  irtibat bilgisi yoksa yalnizca aciklama donuyor (zaten var olan
  getComparableCardDescriptionText/EMSALxACIKLAMASI ile ayni veri —
  EMSALxACIKLAMAMETNI olarak da (yeni alt cizgili adlandirma) alias'landi).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

// --- 1) getComparableCardFullText — izole VM (mock contact/description) --
{
  const src = sliceFn("function getComparableCardFullText(");

  function run({ hasData, contact, description }) {
    const context = {
      getComparableCardData: (index) => (hasData ? { row: {}, metrics: {} } : null),
      getComparableCardContactText: () => contact,
      getComparableCardDescriptionText: () => description,
    };
    vm.createContext(context);
    vm.runInContext(src, context);
    return context.getComparableCardFullText(0);
  }

  assert.equal(
    run({
      hasData: true,
      contact: "Raif Bey / 0 (546) 582 19 29",
      description:
        "Ekspertize konu taşınmaz satılık olup, 90 m2 olarak beyan edilmiş, 67 m2 olduğu bilinmektedir.",
    }),
    "(İrtibat Kişisi ve Telefon No: Raif Bey / 0 (546) 582 19 29)\n\n" +
      "Ekspertize konu taşınmaz satılık olup, 90 m2 olarak beyan edilmiş, 67 m2 olduğu bilinmektedir.",
    "Irtibat + aciklama, kullanicinin ornegiyle birebir ayni formatta birlesmeli."
  );

  assert.equal(
    run({ hasData: true, contact: "", description: "Sadece aciklama metni." }),
    "Sadece aciklama metni.",
    "Irtibat bilgisi yoksa yalnizca aciklama donmeli (bos parantez satiri olmamali)."
  );

  assert.equal(run({ hasData: false, contact: "", description: "" }), "", "Veri yoksa bos donmeli.");

  console.log("Emsal karti birlesik metin (EMSAL_N_EMSAL_METNI) formati testi tamam.");
}

// --- 2) Index-bagli sarmalayicilar app.js'de tanimli mi -------------------
{
  ["getComparableCard1FullText", "getComparableCard2FullText", "getComparableCard3FullText"].forEach((fnName) => {
    assert(
      new RegExp(`function ${fnName}\\(\\) \\{ return getComparableCardFullText\\(\\d\\); \\}`).test(appSource),
      `app.js icinde ${fnName} beklenen sekilde tanimli degil.`
    );
  });
  console.log("Emsal 1/2/3 birlesik metin sarmalayicilari testi tamam.");
}

// --- 3) template-engine.js kablolamasi -------------------------------------
{
  [
    ["EMSAL1EMSALMETNI", "getComparableCard1FullText"],
    ["EMSAL1ACIKLAMAMETNI", "getComparableCard1DescriptionText"],
    ["EMSAL2EMSALMETNI", "getComparableCard2FullText"],
    ["EMSAL2ACIKLAMAMETNI", "getComparableCard2DescriptionText"],
    ["EMSAL3EMSALMETNI", "getComparableCard3FullText"],
    ["EMSAL3ACIKLAMAMETNI", "getComparableCard3DescriptionText"],
  ].forEach(([placeholder, fnName]) => {
    assert(
      engineSource.includes(`${placeholder}: { fn: () => safeCall("${fnName}") }`),
      `template-engine.js: ${placeholder} placeholder'i ${fnName} fonksiyonunu safeCall ile cagirmiyor.`
    );
  });
  console.log("Emsal birlesik/aciklama metni placeholder kablolama testi tamam.");
}
