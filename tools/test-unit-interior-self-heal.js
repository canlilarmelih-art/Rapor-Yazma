"use strict";

/*
  Regresyon: "İç Hacimler" seçici kutusu, kayıtlı degerin listedeki
  seçeneklerden BİRİYLE TAM (harf büyüklüğü dahil) eşleşmesini bekliyordu.
  Eski bir hata (normalizeReportStateFields'in unitFloors'u da title-case
  etmesi) veya farklı bir kaynaktan gelen kayıtlı veri "WC" yerine "Wc"
  içeriyorsa <option value="WC"> ile eşleşmiyor ve kutu BOŞ görünüyordu —
  kod düzeltilse bile ZATEN KAYITLI (eski) veri kendi kendine iyileşmiyordu.

  resolveUnitInteriorOptionValue() artık harf büyüklüğü/Türkçe karakter
  farkını tolere edip kanonik seçenek metnini döndürüyor. Bu test gerçek
  app.js kaynağından fonksiyonu izole çalıştırır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function resolveUnitInteriorOptionValue");
const end = appSource.indexOf("function createUnitFloorInteriorPicker", start);
assert(start >= 0 && end > start, "resolveUnitInteriorOptionValue fonksiyonu bulunamadi.");

const foldTurkishStart = appSource.indexOf("function foldTurkish(");
const foldTurkishEnd = appSource.indexOf("\n}", foldTurkishStart) + 2;
assert(foldTurkishStart >= 0, "foldTurkish fonksiyonu bulunamadi.");

const context = {};
vm.createContext(context);
vm.runInContext(appSource.slice(foldTurkishStart, foldTurkishEnd), context);
vm.runInContext(appSource.slice(start, end), context);

const options = ["Salon", "Oda", "WC", "Duş", "Balkon", "Antre-Hol"];

assert.equal(context.resolveUnitInteriorOptionValue("WC", options), "WC", "Zaten kanonik deger bozulmamali.");
assert.equal(
  context.resolveUnitInteriorOptionValue("Wc", options),
  "WC",
  "Eski bozuk kayit ('Wc') kanonik 'WC' seçenegine eslenmedi."
);
assert.equal(
  context.resolveUnitInteriorOptionValue("wc", options),
  "WC",
  "Kucuk harfli kayit kanonik 'WC' seçenegine eslenmedi."
);
assert.equal(
  context.resolveUnitInteriorOptionValue("  Duş  ", options),
  "Duş",
  "Baştaki/sondaki boşluk temizlenmeli."
);
assert.equal(
  context.resolveUnitInteriorOptionValue("Bilinmeyen Oda", options),
  "Bilinmeyen Oda",
  "Listede olmayan deger AYNEN korunmali (veri kaybı olmamalı)."
);
assert.equal(context.resolveUnitInteriorOptionValue("", options), "", "Boş deger boş dönmeli.");

console.log("Ic Hacimler kendi kendine iyilesme testi tamam.");
