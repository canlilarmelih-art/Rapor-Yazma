"use strict";

/*
  Kullanici talebi: "işyeri emsallerinden oda sayısı satırını kaldıralım
  açıklama bölümünden de kaldıralım" — konu taşınmaz işyeri/ofis/ticari
  bina ise Emsaller tablosundaki "Oda Sayısı" (c5) satırı hem interaktif
  matriste hem de otomatik üretilen açıklamada (bkz.
  test-comparable-workplace-floor-description.js) görünmemeli; konut'ta
  DAVRANIŞ DEĞİŞMEMELİ.

  Bu test getComparableDisplayFields()'i gercek app.js kaynagindan, gercek
  comparableFields dizisiyle izole calistirir. comparableFields'in
  referans verdigi imar/il-imar secenek dizileri (imarLegendOptions vb.)
  bu testin kapsami disi oldugundan bos dizi stub'lariyla degistirilir —
  yalnizca ALAN ANAHTARLARININ (field.key) view/usage kurallarina gore
  dogru filtrelenip filtrelenmedigi test edilir, secenek icerikleri degil.
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

function sliceArray(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n];", start) + 3;
  return appSource.slice(start, end);
}

const foldTurkishSrc = sliceFn("function foldTurkish(");
const isWorkplaceLikeUsageNatureSrc = sliceFn("function isWorkplaceLikeUsageNature(");
const comparableFieldSetsSrc = appSource.slice(
  appSource.indexOf("const comparablePercentOptions ="),
  appSource.indexOf("const comparableFields = [")
);
const comparableFieldsArraySrc = sliceArray("const comparableFields = [");
const getComparableDisplayFieldsSrc = sliceFn("function getComparableDisplayFields(");

function createContext(legalUsageNature) {
  const context = {
    state: { fields: { legalUsageNature } },
    // comparableFields'in referans verdigi secenek dizileri bu testin
    // kapsami disi — icerikleri degil, yalnizca field.key filtrelemesi
    // test ediliyor.
    comparableNatureOptions: [],
    imarLegendOptions: [],
    imarOrderOptions: [],
    imarFloorCountOptions: [],
  };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(isWorkplaceLikeUsageNatureSrc, context);
  vm.runInContext(comparableFieldSetsSrc, context);
  vm.runInContext(comparableFieldsArraySrc, context);
  vm.runInContext(getComparableDisplayFieldsSrc, context);
  return context;
}

function fieldKeys(context, viewMode) {
  return context.getComparableDisplayFields(viewMode).map((field) => field.key);
}

// 1) İşyeri: Oda Sayısı (c5) HİÇBİR görünümde (all/residential) gösterilmemeli.
{
  const context = createContext("İşyeri");
  assert.ok(!fieldKeys(context, "all").includes("c5"), "İşyeri + 'all' görünümünde c5 gizli olmalı.");
  assert.ok(!fieldKeys(context, "residential").includes("c5"), "İşyeri + 'residential' görünümünde c5 gizli olmalı.");
}

// 2) Ofis / Ticari Bina için de aynı kural geçerli olmalı.
{
  assert.ok(!fieldKeys(createContext("Ofis"), "all").includes("c5"), "Ofis'te c5 gizli olmalı.");
  assert.ok(!fieldKeys(createContext("Ticari Bina"), "all").includes("c5"), "Ticari Bina'da c5 gizli olmalı.");
}

// 3) Konut: Oda Sayısı (c5) DEĞİŞMEDEN görünmeye devam etmeli.
{
  const context = createContext("Konut");
  assert.ok(fieldKeys(context, "all").includes("c5"), "Konut + 'all' görünümünde c5 görünmeli.");
  assert.ok(fieldKeys(context, "residential").includes("c5"), "Konut + 'residential' görünümünde c5 görünmeli.");
}

// 4) Arsa/boş legalUsageNature: c5 zaten sadece residential-only alan —
//    "land" görünümünde (usage nature'dan bağımsız) her zaman gizli olmalı,
//    bu davranış BOZULMAMALI.
{
  const context = createContext("Konut");
  assert.ok(!fieldKeys(context, "land").includes("c5"), "'land' görünümünde c5 hâlâ gizli olmalı (mevcut davranış).");
}

console.log("Emsaller Oda Sayisi (isyeri gizleme) gorunurluk testi tamam.");
