"use strict";

/*
  Kullanici talebi: Emsaller bolumunde isyeri/ofis/ticari bina raporlarinda
  girilen emsalin hangi katta, kac m2, kat bazinda indirgeme orani ve toplam
  indirgenmis alaninin belirtilmesi gerekiyordu — Ana Gayrimenkul'deki "Kat
  Bazinda Hesaplama Tablosu" ile ayni genel mantik. Kullanicinin onayladigi
  plan:
    1) Yeni "Kat Bazinda Indirgeme Orani" (c32, select %0-%100) ve "Toplam
       Indirgenmis Alan" (calcWorkplaceReducedArea, computed) alanlari.
    2) Bu alanlar SADECE konu tasinmaz isyeri/ofis/ticari bina ise gorunur
       (konut HARIC) — isWorkplaceLikeUsageNature().
    3) calcWorkplaceReducedArea, emsalin m2 birim deger hesabinda ("Duzeltilmis
       Alan"in yerine gecerek) kullanilir; oran BOS birakilirsa (%100) eski
       davranis (Duzeltilmis/Beyan Edilen Alan dogrudan) AYNEN korunur.

  Bu test parseComparableWorkplaceReductionRate, isWorkplaceLikeUsageNature,
  calculateComparableMetrics ve calculateComparableFieldValue'yu gercek app.js
  kaynagindan izole calistirir. isLandComparable, bu testin kapsami disindaki
  (arazi/tarim siniflandirma) mantigi tasidigindan basit bir stub'la degistirilir.
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

const foldTurkishSrc = sliceFn("function foldTurkish(");
const isWorkplaceLikeUsageNatureSrc = sliceFn("function isWorkplaceLikeUsageNature(");
const parseComparableWorkplaceReductionRateSrc = sliceFn("function parseComparableWorkplaceReductionRate(");
const calculateComparableMetricsSrc = sliceFn("function calculateComparableMetrics(");
const calculateComparableFieldValueSrc = sliceFn("function calculateComparableFieldValue(");
const calculateComparableAdjustmentSrc = sliceFn("function calculateComparableAdjustment(");
const parseComparableNumberSrc = sliceFn("function parseComparableNumber(");
const parseComparablePercentSrc = sliceFn("function parseComparablePercent(");
const formatComparableMoneySrc = sliceFn("function formatComparableMoney(");

function createContext(fields = {}) {
  const context = {
    state: { fields },
    // isLandComparable'in gercek zinciri (normalizeComparableNature,
    // comparableLandNatureKeys) bu testin kapsami disi; basit bir stub'la
    // degistirilir — testteki satirlar hep "Konut"/"Dukkan" c23 kullanir.
    isLandComparable: (row) => ["arsa", "tarla", "meyve bahcesi"].includes(String(row?.c23 || "").toLocaleLowerCase("tr")),
    syncComparableLandBuildableArea: () => {},
  };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(isWorkplaceLikeUsageNatureSrc, context);
  vm.runInContext(parseComparableWorkplaceReductionRateSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(parseComparablePercentSrc, context);
  vm.runInContext(calculateComparableAdjustmentSrc, context);
  vm.runInContext(calculateComparableMetricsSrc, context);
  vm.runInContext(formatComparableMoneySrc, context);
  vm.runInContext(calculateComparableFieldValueSrc, context);
  return context;
}

// --- 1) parseComparableWorkplaceReductionRate ---------------------------
{
  const context = createContext();
  const cases = [
    ["80%", 0.8],
    ["80", 0.8],
    ["%100", 1],
    ["0%", 0],
    ["", 1],
    [undefined, 1],
    ["geçersiz", 1],
    ["-10%", 1],
  ];
  cases.forEach(([input, expected]) => {
    const actual = context.parseComparableWorkplaceReductionRate(input);
    assert.equal(actual, expected, `parseComparableWorkplaceReductionRate("${input}") -> ${expected} beklenirken ${actual} alındı.`);
  });
}

// --- 2) isWorkplaceLikeUsageNature: konut HARİÇ, işyeri/ofis/ticari dahil ---
{
  const context = createContext();
  assert.equal(context.isWorkplaceLikeUsageNature("İşyeri"), true, "İşyeri true dönmeli.");
  assert.equal(context.isWorkplaceLikeUsageNature("Ofis"), true, "Ofis true dönmeli.");
  assert.equal(context.isWorkplaceLikeUsageNature("Ticari Bina"), true, "Ticari Bina true dönmeli.");
  assert.equal(context.isWorkplaceLikeUsageNature("Konut"), false, "Konut HARİÇ tutulmalı (kullanıcı talebi).");
  assert.equal(context.isWorkplaceLikeUsageNature("Arsa"), false, "Arsa false dönmeli.");
  assert.equal(context.isWorkplaceLikeUsageNature(""), false, "Boş değer false dönmeli.");
}

// --- 3) calculateComparableMetrics: indirgeme orani adjustedArea/unitValue'yu etkilemeli ---
{
  const context = createContext();
  const row = { c23: "Konut", c2: "Satılık", c12: "150", c13: "", c14: "3.000.000", c15: "", c32: "80%" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.workplaceReducedArea, 120, `150 m² × %80 = 120 m² olmalı: ${metrics.workplaceReducedArea}`);
  assert.equal(metrics.adjustedArea, 120, "adjustedArea, workplaceReducedArea ile aynı olmalı (Düzeltilmiş Alan yerine).");
  assert.equal(metrics.unitValue, 25000, `3.000.000 / 120 = 25.000 TL/m² olmalı: ${metrics.unitValue}`);
}

// --- 4) Geriye dönük uyumluluk: c32 boşsa eski davranış (ham alan) korunmalı ---
{
  const context = createContext();
  const row = { c23: "Konut", c2: "Satılık", c12: "150", c13: "", c14: "3.000.000", c15: "", c32: "" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.workplaceReducedArea, 150, "Oran boşken indirgenmiş alan ham alanla aynı olmalı (%100 varsayılan).");
  assert.equal(metrics.adjustedArea, 150, "Oran boşken adjustedArea eski davranışla (ham alan) aynı olmalı.");
  assert.equal(metrics.unitValue, 20000, `3.000.000 / 150 = 20.000 TL/m² olmalı: ${metrics.unitValue}`);
}

// --- 5) Düzeltilmiş Alan (c13) varsa o baz alınıp oranla çarpılmalı ---
{
  const context = createContext();
  const row = { c23: "Konut", c2: "Satılık", c12: "150", c13: "140", c14: "2.800.000", c15: "", c32: "50%" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.workplaceReducedArea, 70, `140 m² (Düzeltilmiş Alan) × %50 = 70 m² olmalı: ${metrics.workplaceReducedArea}`);
}

// --- 6) Arazi emsalinde (isLandComparable=true) bu mekanizma DEVREYE GİRMEMELİ ---
{
  const context = createContext();
  const row = { c23: "Arsa", c24: "500", c31: "480", c14: "5.000.000", c15: "", c32: "50%" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.adjustedArea, 500, "Arazi emsalinde adjustedArea Yüzölçümü (c24) olmalı, c32'den etkilenmemeli.");
}

// --- 7) calculateComparableFieldValue("calcWorkplaceReducedArea", ...) uçtan uca ---
{
  const context = createContext();
  const row = { c23: "Konut", c2: "Satılık", c12: "150", c13: "", c14: "3.000.000", c15: "", c32: "80%" };
  const formatted = context.calculateComparableFieldValue("calcWorkplaceReducedArea", row);
  assert.equal(formatted, "120 m²", `Biçimlenmiş çıktı "120 m²" olmalı: "${formatted}"`);
}

console.log("Emsaller kat bazinda indirgeme testi tamam.");
