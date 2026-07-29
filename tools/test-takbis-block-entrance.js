"use strict";

/*
  Kullanici bildirimi: gercek bir TAKBIS ciktisinda "Blok/Kat/Giris/BBNo"
  alani "1./9/G/40" seklinde geliyor (Blok=1, Kat=9, Giris=G, BBNo=40), ama
  parseTakbisBlockFloorUnit() sadece blockName/floor/unitNo dondurup Giris
  (G) harfini sessizce atiyordu. Bu test, gercek app.js kaynagindan
  parseTakbisBlockFloorUnit()'i izole calistirip Giris alaninin artik
  dondugunu dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("function parseTakbisBlockFloorUnit");
const end = appSource.indexOf("\n}", start) + 2;
assert(start >= 0, "parseTakbisBlockFloorUnit fonksiyonu bulunamadi.");

const cleanStart = appSource.indexOf("function cleanTakbisValue");
const cleanEnd = appSource.indexOf("function splitFirst", cleanStart);
assert(cleanStart >= 0 && cleanEnd > cleanStart, "cleanTakbisValue/normalizeSlash bulunamadi.");

const context = {};
vm.createContext(context);
vm.runInContext(appSource.slice(cleanStart, cleanEnd), context);
vm.runInContext(appSource.slice(start, end), context);

// Kullanicinin gonderdigi gercek TAKBIS ornegi: "Blok/Kat/Giriş/BBNo: 1./9/G/40"
const real = context.parseTakbisBlockFloorUnit("1./9/G/40");
assert.equal(real.blockName, "1.", "Blok adi yanlis okundu.");
assert.equal(real.floor, "9", "Kat yanlis okundu.");
assert.equal(real.entrance, "G", "Giris harfi (G) parseTakbisBlockFloorUnit'ten donmuyor.");
assert.equal(real.unitNo, "40", "BBNo yanlis okundu.");

// Giris slotu "-" ise (yok) bos donmeli, "-" degil.
const noEntrance = context.parseTakbisBlockFloorUnit("A/3/-/12");
assert.equal(noEntrance.entrance, "", "Giris '-' iken bos donmeli, '-' degil.");

// Yapisal olmayan (4'ten az alanli) eski bicimlerde giris alani zorlanmamali,
// yanlis deger uydurmak yerine bos donmeli.
const legacy = context.parseTakbisBlockFloorUnit("A/3.Normal Kat/12");
assert.equal(legacy.entrance, "", "Yapisal olmayan bicimde giris alani uydurulmamali.");
assert.equal(legacy.unitNo, "12", "Yapisal olmayan bicimde BBNo hala dogru okunmali (regresyon).");

console.log("TAKBIS Blok/Kat/Giris/BBNo ayristirma testi tamam.");
