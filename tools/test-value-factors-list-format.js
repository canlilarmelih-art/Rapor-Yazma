"use strict";

/*
  Kullanici talebi: "değeri etkileyen olumlu ve olumsuz faktörlerde çıktı
  1. 2. 3. olarak numaralandırılarak geliyor. bunun yerine hiç bir
  numaralandırma yada * yada - yerine her bir faktör bir satır diğer
  faktör alt satırdan başlasın" — app.js'teki formatValueFactorsList()
  (OLUMLU_FAKTÖR/OLUMSUZ_FAKTÖR ve DEGERI_ETKILEYEN_OLUMLU/OLUMSUZ_FAKTORLER
  placeholder'larını besliyor) artik numaralandirma/madde isareti
  eklemiyor, yalnizca satirlari birlestiriyor.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

const context = {};
vm.createContext(context);
vm.runInContext(sliceFn("function formatValueFactorsList("), context);

// --- 1) Numaralandirma/madde isareti yok, satir satir ---------------------
{
  const result = context.formatValueFactorsList([
    { text: "Ana caddeye cepheli olması" },
    { text: "Toplu taşımaya yakın olması" },
    { text: "Site içerisinde güvenlikli olması" },
  ]);
  assert.equal(
    result,
    "Ana caddeye cepheli olması\nToplu taşımaya yakın olması\nSite içerisinde güvenlikli olması",
    "Satirlar duz metin olarak, alt alta, numarasiz/isaretsiz gelmeli."
  );
  assert(!/^\d+\.\s/m.test(result), "Numaralandirma (ör. '1. ') olmamali.");
  assert(!/^[*\-]\s/m.test(result), "Madde isareti (* veya -) olmamali.");
}

// --- 2) Tek eleman ----------------------------------------------------------
{
  const result = context.formatValueFactorsList([{ text: "Deniz manzaralı olması" }]);
  assert.equal(result, "Deniz manzaralı olması");
}

// --- 3) Bos liste ------------------------------------------------------------
{
  assert.equal(context.formatValueFactorsList([]), "");
  assert.equal(context.formatValueFactorsList(), "");
}

console.log("Deger etkileyen faktorler liste formati (numarasiz) testi tamam.");
