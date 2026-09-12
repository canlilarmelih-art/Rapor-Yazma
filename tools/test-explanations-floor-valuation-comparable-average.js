"use strict";

/*
  Kullanici bildirimi (2026-09-12, ekran goruntusu — "Kat Bazinda Hesaplama
  Tablosu"): "bu kısımda mevcut durum değeri hesaplanırken zemin kata
  indirgenen alan emsaller bölümünde bulunan ortalama m2 birim değeri ile
  çarpılmalıydı".

  Gercek ornek (kullanicinin ekran goruntusu): Zemin 75 m² (%100 indirgeme,
  75 m² efektif), Asma 35 m² (%30 indirgeme, 10,50 m² efektif) -> Mevcut
  Toplam Indirgenmis Alan = 85,50 m². Yasal tarafta sadece Zemin (75 m²,
  %100) var, Yasal Toplam Indirgenmis Alan = 75 m² (raw alanla AYNI).

  ONCEKI (hatali) davranis: getExplanationsFloorValuationMetrics() "Piyasa
  m² Birim Degeri" sutununu state.fields.legalValue/currentValue (RAW/
  indirgenmemis toplam alana gore kullanicinin elle girdigi TOPLAM Piyasa
  Degeri) degerini INDIRGENMIS alana BOLEREK turetiyordu. Yasal'da raw alan
  (75) = indirgenmis alan (75) oldugundan bu TESADUFEN dogru sonucu
  veriyordu (44.000 TL/m² -- gercek emsal ortalamasiyla ayni), ama
  Mevcut'ta raw alan (110) != indirgenmis alan (85,50) oldugundan turetilen
  "birim deger" YAPAY sekilde SISIYORDU (4.800.000 / 85,50 = 56.140,35
  TL/m² -- oysa asil emsal ortalamasi hala 44.000,00 TL/m² idi).

  DOGRU davranis: Emsal Degerleme Tablosu'ndaki ("ORTALAMA" satiri, IND. M²
  BIRIM sutunu -- calculateComparableValuationAverages().adjustedUnitValue)
  GERCEK ortalama emsal birim degeri HEM Yasal HEM Mevcut icin ayni referans
  olarak kullanilir; Piyasa Degeri bu birim degerin INDIRGENMIS alanla
  ILERIYE DOGRU carpilmasiyla (alan × birim = deger) hesaplanir. Emsal
  girilmemisse (ortalama hesaplanamiyorsa) eski (state.fields uzerinden ters
  turetim) davranisa dusulur -- geri uyumluluk.

  Kullanici devam bildirimi (2026-09-12): "85,50 × 44.000 = 3.762.000 TL bu
  bölümde 50.000'e yuvarla yap" -- ileriye dogru hesaplanan Piyasa Degeri de
  uygulamanin HER YERİNDE emsal ortalamasindan turetilen degerlere uygulanan
  AYNI yuvarlama kuralina (roundComparableValuationValue, bkz.
  syncComparableValuationMarketValue) tabi: Piyasa Degeri en yakin 50.000
  TL'ye (comparableValuationRoundStep), Piyasa Kira Degeri en yakin 1.000
  TL'ye (comparableValuationRentRoundStep) yuvarlanir. 85,50 × 44.000 =
  3.762.000 -> 50.000'e yuvarlaninca 3.750.000 TL olur.

  Bu test dort senaryoyu dogrular:
  1) Emsal ortalamasi mevcutken Mevcut satirinin "Piyasa m² Birim Degeri"
     artik YAPAY sekilde sismiyor, gercek emsal ortalamasini (44.000)
     kullaniyor; "Piyasa Degeri" = indirgenmis alan (85,50) × 44.000 =
     3.762.000 TL, en yakin 50.000'e yuvarlaninca 3.750.000 TL (ONCEKI
     hatali 4.800.000 DEGIL).
  2) Yasal satirinda (raw alan = indirgenmis alan oldugu icin onceden de
     dogru gorunen) sonuc DEGISMEDEN kaliyor (44.000 TL/m², 3.300.000 TL,
     zaten 50.000'in tam kati) -- regresyon yok.
  3) Kira (rentUnitValue/rentValue) icin de AYNI mantik (adjustedRentUnitValue
     + en yakin 1.000'e yuvarlama) uygulaniyor.
  4) Emsal hic girilmemisse (ortalama hesaplanamiyor, NaN) eski geri-uyumlu
     davranisa (state.fields degerini indirgenmis alana bolme, YENIDEN
     YUVARLANMADAN) dusuluyor -- boylece emsal doldurulmamis eski raporlarda
     tablo BOMBOŞ kalmiyor ve kullanicinin kendi girdigi deger degistirilmiyor.
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

function sliceConst(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf(";", start) + 1;
  return appSource.slice(start, end);
}

function buildContext(comparableRows) {
  const context = {
    state: { fields: { legalUsageNature: "İşyeri" } },
    isLandComparable: (row) => ["arsa", "tarla", "meyve bahcesi"].includes(String(row?.c23 || "").toLocaleLowerCase("tr")),
    syncComparableLandBuildableArea: () => {},
    getComparableRows: () => comparableRows,
  };
  vm.createContext(context);
  vm.runInContext(sliceArray("const comparableFloorOptions = ["), context);
  vm.runInContext(sliceFn("function foldTurkish("), context);
  vm.runInContext(sliceFn("function isWorkplaceLikeUsageNature("), context);
  vm.runInContext(sliceFn("function getComparableMultiValues("), context);
  vm.runInContext(sliceFn("function syncComparableWorkplaceFloors("), context);
  vm.runInContext(sliceFn("function parseComparableNumber("), context);
  vm.runInContext(sliceFn("function parseComparablePercent("), context);
  vm.runInContext(sliceFn("function parseComparableWorkplaceReductionRate("), context);
  vm.runInContext(sliceFn("function calculateComparableAdjustment("), context);
  vm.runInContext(sliceFn("function calculateComparableMetrics("), context);
  vm.runInContext(sliceFn("function getComparableValuationRows("), context);
  vm.runInContext(sliceFn("function calculateComparableValuationAverages("), context);
  vm.runInContext(sliceFn("function parseReportNumber("), context);
  vm.runInContext(sliceFn("function parseUnitReductionRate("), context);
  vm.runInContext(sliceFn("function parseValuationNumber("), context);
  vm.runInContext(sliceConst("const comparableValuationRoundStep = "), context);
  vm.runInContext(sliceConst("const comparableValuationRentRoundStep = "), context);
  vm.runInContext(sliceFn("function roundComparableValuationValue("), context);
  vm.runInContext(sliceFn("function buildExplanationsFloorValuationRows("), context);
  vm.runInContext(sliceFn("function getExplanationsFloorValuationMetrics("), context);
  return context;
}

// Kullanicinin gercek ornegindeki kat satirlari.
const legalFloorRows = [{ floor: "Zemin kat", legalArea: "75", areaReductionRate: "100" }];
const currentFloorRows = [
  { floor: "Zemin kat", currentArea: "75", areaReductionRate: "100" },
  { floor: "Asma kat", currentArea: "35", areaReductionRate: "30" },
];

// --- 1) & 2) Emsal ortalamasi mevcutken Mevcut DUZELIYOR, Yasal AYNI kaliyor
{
  const comparableRows = [
    // saleValue/area = 880.000/20 = 44.000 TL/m² (ozellik/konum ayari yok
    // -> adjustedUnitValue de 44.000). Kira: 4.000/20 = 200 TL/m².
    { c23: "İşyeri", c2: "Satılık", c12: "20", c14: "880.000", c16: "4.000" },
  ];
  const context = buildContext(comparableRows);
  context.state.fields.legalValue = "3.300.000"; // eski dogru deger (geri uyum icin fallback'i de dogrulamak icin tutuluyor)
  context.state.fields.currentValue = "4.800.000"; // KULLANICININ bildirdigi hatali senaryo
  context.state.fields.legalRent = "16.000";
  context.state.fields.currentRent = "23.000";

  const legalDetailRows = context.buildExplanationsFloorValuationRows(legalFloorRows, "legal");
  const legalMetrics = context.getExplanationsFloorValuationMetrics(legalDetailRows, "legal");
  assert.equal(Math.round(legalMetrics.marketUnitValue), 44000, `Yasal birim deger gercek emsal ortalamasi (44.000) olmali: ${legalMetrics.marketUnitValue}`);
  assert.equal(Math.round(legalMetrics.marketValue), 3300000, `Yasal Piyasa Degeri 75 m² × 44.000 = 3.300.000 olmali (regresyon yok): ${legalMetrics.marketValue}`);

  const currentDetailRows = context.buildExplanationsFloorValuationRows(currentFloorRows, "current");
  const currentMetrics = context.getExplanationsFloorValuationMetrics(currentDetailRows, "current");
  // Toplam indirgenmis alan: 75×1 + 35×0,30 = 85,50 m².
  assert.equal(
    Math.round(currentMetrics.marketUnitValue),
    44000,
    `Mevcut birim deger ARTIK YAPAY sekilde sismemeli, gercek emsal ortalamasi (44.000) kullanilmali: ${currentMetrics.marketUnitValue}`
  );
  assert.notEqual(
    Math.round(currentMetrics.marketUnitValue * 100) / 100,
    56140.35,
    "Mevcut birim deger ESKI hatali (56.140,35 TL/m², marketValue/reducedArea) degerine DONMEMELI."
  );
  assert.equal(
    Math.round(currentMetrics.marketValue),
    3750000,
    `Mevcut Piyasa Degeri indirgenmis alan (85,50) × 44.000 = 3.762.000, en yakin 50.000'e yuvarlaninca 3.750.000 olmali (ONCEKI hatali 4.800.000 DEGIL): ${currentMetrics.marketValue}`
  );

  // 3) Kira icin ayni mantik: adjustedRentUnitValue = 200 TL/m² referans alinir,
  // sonuc en yakin 1.000 TL'ye yuvarlanir.
  assert.equal(Math.round(legalMetrics.rentUnitValue), 200, `Yasal kira birim degeri emsal ortalamasi (200) olmali: ${legalMetrics.rentUnitValue}`);
  assert.equal(Math.round(legalMetrics.rentValue), 15000, `Yasal Piyasa Kira Degeri 75 × 200 = 15.000 olmali (zaten 1.000'in tam kati): ${legalMetrics.rentValue}`);
  assert.equal(Math.round(currentMetrics.rentUnitValue), 200, `Mevcut kira birim degeri de AYNI emsal ortalamasini (200) kullanmali: ${currentMetrics.rentUnitValue}`);
  assert.equal(Math.round(currentMetrics.rentValue), 17000, `Mevcut Piyasa Kira Degeri 85,50 × 200 = 17.100, en yakin 1.000'e yuvarlaninca 17.000 olmali (ONCEKI hatali 23.000 DEGIL): ${currentMetrics.rentValue}`);

  console.log("Emsal ortalamasi mevcutken Mevcut/Yasal Piyasa m² Birim Degeri + Piyasa Degeri testi tamam.");
}

// --- 4) Emsal hic girilmemisse (ortalama NaN) eski geri-uyumlu davranisa dusulur
{
  const context = buildContext([]); // hic emsal yok -> average.adjustedUnitValue NaN
  context.state.fields.currentValue = "4.800.000";
  context.state.fields.currentRent = "23.000";

  const currentDetailRows = context.buildExplanationsFloorValuationRows(currentFloorRows, "current");
  const currentMetrics = context.getExplanationsFloorValuationMetrics(currentDetailRows, "current");
  // Geri uyum: eski ters-turetim (marketValue / totalReducedArea) korunur.
  assert.equal(
    Math.round(currentMetrics.marketUnitValue * 100) / 100,
    56140.35,
    `Emsal girilmemisken eski geri-uyumlu ters-turetim davranisi korunmali: ${currentMetrics.marketUnitValue}`
  );
  assert.equal(Math.round(currentMetrics.marketValue), 4800000, `Emsal yokken Piyasa Degeri state.fields.currentValue'dan degismeden gelmeli: ${currentMetrics.marketValue}`);

  console.log("Emsal girilmemisken geri-uyumlu (eski) davranis testi tamam.");
}

console.log("Kat Bazinda Hesaplama Tablosu: emsal ortalamasi ile Piyasa m² Birim Degeri/Piyasa Degeri testi basarili.");
