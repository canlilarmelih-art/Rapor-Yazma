"use strict";

/*
  Kullanici talebi (2 asamali):
  1) Emsaller bolumunde isyeri/ofis/ticari bina raporlarinda girilen emsalin
     hangi katta, kac m2, kat bazinda indirgeme orani ve toplam indirgenmis
     alaninin belirtilmesi gerekiyordu.
  2) Ek talep: "Kat" (c6) alaninda BIRDEN FAZLA kat secildiginde, HER KAT
     icin AYRI bir alan + indirgeme orani satiri olmali (orn. Zemin kat
     100 m2 %100, Asma kat 50 m2 %30) — tek bir duz orana degil, konu
     tasinmazin kendi "Katlar, Alanlar ve Ic Hacimler" tablosuna benzer
     kat-bazli bir liste.

  Nihai tasarim: row.workplaceFloors = [{floor, area, rate}, ...] — "Kat"
  (c6) alaninda secilen her kat icin senkron bir girdi. Kullanicinin ikinci
  soruya verdigi cevap geregi: kat SECILIYSE alan MUTLAKA kat bazinda
  girilir (bos/eksikse hesap NaN/bos kalir); HIC kat secilmemisse eski
  davranisa (Duzeltilmis/Beyan Edilen Alan) geri donulur.

  Bu test su gercek app.js fonksiyonlarini izole calistirir:
  - syncComparableWorkplaceFloors (c6 secimiyle senkron liste)
  - parseComparableWorkplaceReductionRate (oran ayristirma, %0 dahil)
  - calculateComparableMetrics (adjustedArea/unitValue entegrasyonu)
  - calculateComparableFieldValue("calcWorkplaceReducedArea", ...)
  - formatComparableWorkplaceFloorsSummary (Word/placeholder ozet metni)
  - isWorkplaceLikeUsageNature (gorunurluk kurali, konut haric)

  isLandComparable ve getComparableMultiValues bu testin kapsami disindaki
  siniflandirma/parse mantigi tasidigindan; getComparableMultiValues gercek
  kaynaktan alinir (basit, bagimliliksiz), isLandComparable basit bir
  stub'la degistirilir.
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
const getComparableMultiValuesSrc = sliceFn("function getComparableMultiValues(");
const syncComparableWorkplaceFloorsSrc = sliceFn("function syncComparableWorkplaceFloors(");
const formatComparableWorkplaceFloorsSummarySrc = sliceFn("function formatComparableWorkplaceFloorsSummary(");
const parseComparableWorkplaceReductionRateSrc = sliceFn("function parseComparableWorkplaceReductionRate(");
const calculateComparableMetricsSrc = sliceFn("function calculateComparableMetrics(");
const calculateComparableFieldValueSrc = sliceFn("function calculateComparableFieldValue(");
const calculateComparableAdjustmentSrc = sliceFn("function calculateComparableAdjustment(");
const parseComparableNumberSrc = sliceFn("function parseComparableNumber(");
const parseComparablePercentSrc = sliceFn("function parseComparablePercent(");
const formatComparableMoneySrc = sliceFn("function formatComparableMoney(");

function sliceArray(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n];", start) + 3;
  return appSource.slice(start, end);
}

const comparableFloorOptionsArraySrc = sliceArray("const comparableFloorOptions = [");

function createContext(fields = {}) {
  const context = {
    state: { fields },
    isLandComparable: (row) => ["arsa", "tarla", "meyve bahcesi"].includes(String(row?.c23 || "").toLocaleLowerCase("tr")),
    syncComparableLandBuildableArea: () => {},
  };
  vm.createContext(context);
  vm.runInContext(comparableFloorOptionsArraySrc, context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(isWorkplaceLikeUsageNatureSrc, context);
  vm.runInContext(getComparableMultiValuesSrc, context);
  vm.runInContext(syncComparableWorkplaceFloorsSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorsSummarySrc, context);
  vm.runInContext(parseComparableWorkplaceReductionRateSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(parseComparablePercentSrc, context);
  vm.runInContext(calculateComparableAdjustmentSrc, context);
  vm.runInContext(calculateComparableMetricsSrc, context);
  vm.runInContext(formatComparableMoneySrc, context);
  vm.runInContext(calculateComparableFieldValueSrc, context);
  return context;
}

// --- 1) syncComparableWorkplaceFloors: c6 secimiyle senkron liste --------
{
  const context = createContext();
  const row = { c6: "Zemin kat, Asma kat" };
  const floors = context.syncComparableWorkplaceFloors(row);
  // Not: vm.createContext ile calisan diziler farkli bir "realm"den geldigi
  // icin assert.deepEqual (strict) cross-realm dizileri esit saymaz — bu
  // yuzden karsilastirma birlestirilmis metin (join) ile yapilir.
  assert.equal(
    floors.map((f) => f.floor).join(","),
    "Zemin kat,Asma kat",
    `Secili katlar sirayla listelenmeli: ${JSON.stringify(floors)}`
  );
  assert.equal(floors[0].area, "", "Yeni kat girdisi bos alanla baslamali.");

  // Mevcut girilmis degerler KORUNMALI, sadece secim degisikligi uygulanmali.
  row.workplaceFloors[0].area = "100";
  row.workplaceFloors[0].rate = "100%";
  row.workplaceFloors[1].area = "50";
  row.workplaceFloors[1].rate = "30%";
  row.c6 = "Zemin kat, Asma kat, 1. normal kat"; // yeni bir kat eklendi
  const updated = context.syncComparableWorkplaceFloors(row);
  assert.equal(updated.length, 3, "Yeni kat eklenince liste 3 elemanlı olmalı.");
  assert.equal(updated[0].area, "100", "Zemin kat'ın önceden girilmiş alanı korunmalı.");
  assert.equal(updated[1].area, "50", "Asma kat'ın önceden girilmiş alanı korunmalı.");
  assert.equal(updated[2].area, "", "Yeni eklenen kat boş başlamalı.");

  row.c6 = "Zemin kat"; // Asma kat ve 1. normal kat çıkarıldı
  const shrunk = context.syncComparableWorkplaceFloors(row);
  assert.equal(shrunk.length, 1, "Seçim kaldırılınca ilgili girdi listeden silinmeli.");
  assert.equal(shrunk[0].area, "100", "Kalan katın verisi korunmalı.");
}

// --- 2) isWorkplaceLikeUsageNature: konut HARİÇ, işyeri/ofis/ticari dahil ---
{
  const context = createContext();
  assert.equal(context.isWorkplaceLikeUsageNature("İşyeri"), true);
  assert.equal(context.isWorkplaceLikeUsageNature("Ofis"), true);
  assert.equal(context.isWorkplaceLikeUsageNature("Ticari Bina"), true);
  assert.equal(context.isWorkplaceLikeUsageNature("Konut"), false, "Konut HARİÇ tutulmalı (kullanıcı talebi).");
}

// --- 3) parseComparableWorkplaceReductionRate: %0 dahil edge-case'ler ----
{
  const context = createContext();
  assert.equal(context.parseComparableWorkplaceReductionRate("30%"), 0.3);
  assert.equal(context.parseComparableWorkplaceReductionRate("0%"), 0, "%0 gerçek bir oran olmalı, %100'e düşmemeli.");
  assert.equal(context.parseComparableWorkplaceReductionRate(""), 1, "Boşken %100 varsayılmalı.");
}

// --- 4) Örnek senaryo: Zemin kat 100 m² %100, Asma kat 50 m² %30 ---------
// Kat bazlı indirgeme sadece işyeri benzeri raporlarda (state.fields.
// legalUsageNature) devreye girer; bu yüzden context'e legalUsageNature
// "İşyeri" verilir (bkz. senaryo 8 — konut regresyon testi).
{
  const context = createContext({ legalUsageNature: "İşyeri" });
  const row = {
    c23: "Konut",
    c2: "Satılık",
    c6: "Zemin kat, Asma kat",
    c14: "1.150.000",
    c15: "",
    workplaceFloors: [
      { floor: "Zemin kat", area: "100", rate: "100%" },
      { floor: "Asma kat", area: "50", rate: "30%" },
    ],
  };
  const metrics = context.calculateComparableMetrics(row);
  // 100×1.00 + 50×0.30 = 100 + 15 = 115 m²
  assert.equal(metrics.workplaceReducedArea, 115, `Toplam indirgenmiş alan 115 m² olmalı: ${metrics.workplaceReducedArea}`);
  assert.equal(metrics.adjustedArea, 115, "adjustedArea toplam indirgenmiş alanla aynı olmalı.");
  assert.equal(metrics.unitValue, 10000, `1.150.000 / 115 = 10.000 TL/m² olmalı: ${metrics.unitValue}`);

  const formatted = context.calculateComparableFieldValue("calcWorkplaceReducedArea", row);
  assert.equal(formatted, "115 m²", `Biçimlenmiş çıktı "115 m²" olmalı: "${formatted}"`);

  const summary = context.formatComparableWorkplaceFloorsSummary(row);
  assert.equal(summary, "Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)", `Özet metni beklenenle eşleşmeli: "${summary}"`);
}

// --- 5) Hiç kat seçilmemişse eski davranışa (Düzeltilmiş/Beyan Edilen Alan) dönülmeli ---
{
  const context = createContext();
  const row = { c23: "Konut", c2: "Satılık", c6: "", c12: "150", c13: "", c14: "3.000.000", c15: "" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.adjustedArea, 150, "Kat seçilmemişken eski davranış (ham alan) korunmalı.");
  assert.equal(metrics.unitValue, 20000, `3.000.000 / 150 = 20.000 TL/m² olmalı: ${metrics.unitValue}`);
}

// --- 6) Kat SEÇİLİ ama alan(lar) BOŞ bırakılmışsa hesap eksik/boş kalmalı
//    (Düzeltilmiş/Beyan Edilen Alan'a SESSİZCE geri dönülmemeli — kullanıcının
//    açık tercihi: "kat seçiliyse alan mutlaka kat bazında girilsin"). ------
{
  const context = createContext({ legalUsageNature: "İşyeri" });
  const row = {
    c23: "Konut",
    c2: "Satılık",
    c6: "Zemin kat",
    c12: "150",
    c13: "",
    c14: "3.000.000",
    c15: "",
    workplaceFloors: [{ floor: "Zemin kat", area: "", rate: "100%" }],
  };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.workplaceReducedArea, 0, "Kat seçili ama alan boşken toplam indirgenmiş alan 0 olmalı (150'ye geri dönmemeli).");
  assert.ok(!Number.isFinite(metrics.unitValue), "Alan boşken m² birim değer hesaplanamaz (NaN/boş) olmalı.");
}

// --- 8) REGRESYON: gerçek konut raporunda (legalUsageNature ayarlanmamış/
//    "Konut") "Kat" (c6) alanı seçili olsa bile — konut UI'sinde kat bazlı
//    alan/indirgeme girişi hiç gösterilmediğinden workplaceFloors'un alanı
//    hep boş kalır — hesap eskisi gibi Düzeltilmiş/Beyan Edilen Alan'a
//    (c12/c13) göre çalışmaya devam etmeli; M² birim değer NaN/boş
//    KALMAMALI. Kullanıcının bildirdiği regresyon: "emsalleri güncelledik
//    ama konut emsallerinde hiç bir m2 birim değeri otomatik
//    hesaplanmıyor". ------------------------------------------------------
{
  const context = createContext(); // legalUsageNature verilmedi (konut raporu)
  const row = { c23: "Konut", c2: "Satılık", c6: "3. Normal kat", c12: "150", c13: "", c14: "3.000.000", c15: "" };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(
    metrics.adjustedArea,
    150,
    `Konut raporunda kat seçili olsa da ham alan (150) kullanılmalı: ${metrics.adjustedArea}`
  );
  assert.equal(
    metrics.unitValue,
    20000,
    `Konut emsalinde M² birim değer otomatik hesaplanmalı (3.000.000 / 150 = 20.000): ${metrics.unitValue}`
  );
}

// --- 7) Arazi emsalinde bu mekanizma DEVREYE GİRMEMELİ, Yüzölçümü (c24) kullanılmalı ---
{
  const context = createContext();
  const row = { c23: "Arsa", c24: "500", c31: "480", c14: "5.000.000", c15: "", c6: "Zemin kat", workplaceFloors: [{ floor: "Zemin kat", area: "10", rate: "10%" }] };
  const metrics = context.calculateComparableMetrics(row);
  assert.equal(metrics.adjustedArea, 500, "Arazi emsalinde adjustedArea Yüzölçümü (c24) olmalı, kat bazlı veriden etkilenmemeli.");
}

console.log("Emsaller kat bazinda indirgeme (cok katli) testi tamam.");
