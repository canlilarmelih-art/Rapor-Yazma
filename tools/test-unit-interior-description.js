"use strict";

/*
  Bağımsız bölüm iç hacimler açıklaması testi.

  Kullanıcı talebi: "Dekoratif Özellikler Açıklaması" metni, kat/alan/iç hacim
  anlatısıyla AYNI paragrafta birleşiyordu; kendi paragrafında başlamalı.

  buildUnitInteriorDescriptionParts() ve composeUnitInteriorDescription()
  gerçek app.js kaynağından okunur; bağımlılıkları stub'lanır. Böylece app.js'te
  birleştirme tekrar tek satıra dönerse bu test kırılır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function buildUnitInteriorDescriptionParts");
const end = appSource.indexOf("function composeUnitInteriorDetailsDescription", start);
assert(start >= 0 && end > start, "Ic hacimler aciklamasi fonksiyonlari bulunamadi.");

const AREA_TEXT = "3. Normal Kat projesine göre 56 m2 kullanım alanına sahiptir.";
const DECORATIVE_TEXT = "Salon ve oda zeminleri laminant parke kaplıdır.";

const context = {
  getUnitFloorRows: () => [{ floor: "3. Normal Kat" }],
  normalizeUnitFloorDescriptionRow: (row) => ({ ...row, interiorText: "x" }),
  composeUnitDescriptionIntro: () => "Ekspertize konu taşınmaz, dubleks mesken niteliklidir.",
  composeSingleUnitFloorInteriorParagraph: () => AREA_TEXT,
  composeMultiUnitFloorInteriorSentence: () => "",
  composeUnitTotalAreaTerraceSentence: () => "",
  shouldUseExternalUnitInspectionText: () => false,
  composeExternalUnitInspectionSentence: () => "",
  composeUnitShopFrontageDepthSentence: () => "",
  getUnitDecorativeDescriptionForCombinedText: () => DECORATIVE_TEXT,
  joinNonEmptySentences: (sentences = []) =>
    sentences.map((item) => String(item || "").trim()).filter(Boolean).join(" "),
  // Gerçek normalizeReportDescriptionText satır sonlarını KORUR (satır satır
  // normalize edip "\n" ile birleştirir); burada aynı sözleşme taklit edilir.
  normalizeReportDescriptionText: (value) => String(value || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n"),
};
vm.runInNewContext(appSource.slice(start, end), context);

const parts = context.buildUnitInteriorDescriptionParts();
assert(
  parts.details.includes("\n"),
  "Dekoratif aciklama alan anlatisiyla ayni satirda kalmis (paragraf bolunmesi yok)."
);
assert.equal(
  parts.details,
  `${AREA_TEXT}\n${DECORATIVE_TEXT}`,
  `details beklenen iki paragrafi uretmiyor: ${JSON.stringify(parts.details)}`
);

const combined = context.composeUnitInteriorDescription();
const paragraphs = combined.split("\n");
assert.equal(paragraphs.length, 2, `Birlesik metin iki paragraf olmali: ${JSON.stringify(combined)}`);
assert(
  paragraphs[0].endsWith(AREA_TEXT),
  "Ilk paragraf giris + alan anlatisi olmali (dekoratif metin sizmis)."
);
assert.equal(paragraphs[1], DECORATIVE_TEXT, "Ikinci paragraf dekoratif aciklama olmali.");
// Giris ile alan anlatisi AYNI paragrafta kalmali (davranis degismedi).
assert(
  paragraphs[0].includes("dubleks mesken niteliklidir.") && paragraphs[0].includes(AREA_TEXT),
  "Giris ile alan anlatisi ayni paragrafta kalmali."
);

console.log("Bagimsiz bolum ic hacimler aciklamasi testi tamam.");
