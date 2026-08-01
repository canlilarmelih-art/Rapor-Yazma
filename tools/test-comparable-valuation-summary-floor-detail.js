"use strict";

/*
  Kullanici talebi: "Emsaller tablosu kat bazında girilen emsalleri
  gösterir şekilde düzenleme planı" — arastirma sonucu iki maddede
  netlesti: (1) ekrandaki "Emsal Değerleme Tablosu" özet paneli
  (createComparableValuationSummaryTable) ALAN hucresinde sadece toplam
  sayiyi gosteriyordu, hangi katin kac m2 oldugunu gostermiyordu; (2) Word/
  rapor ciktisi (buildComparableMatrixWordTableHtml) zaten kat detayini
  gosteriyordu (onceki oturumda eklenmisti), degisiklik gerekmedi.

  Cozum: yeni formatComparableSummaryAreaCell(row) — ALAN sayisinin
  altina, workplaceFloorsSummary doluysa kucuk bir kat-detay satiri ekler.
  getComparableValuationRows() artik her satira workplaceFloorsSummary
  alanini da ekliyor.

  Bu test iki katmani izole dogrular:
  1) formatComparableSummaryAreaCell — saf fonksiyon, HTML-escape dahil.
  2) getComparableValuationRows() — her satirin workplaceFloorsSummary
     alaninin dolu/bos oldugunu gercek calculateComparableMetrics/
     formatComparableWorkplaceFloorsSummary zinciriyle dogrular.
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

const escapeHtmlSrc = sliceFn("function escapeHtml(");
const formatComparableSummaryNumberSrc = sliceFn("function formatComparableSummaryNumber(");
const formatComparableSummaryAreaCellSrc = sliceFn("function formatComparableSummaryAreaCell(");

// --- 1) formatComparableSummaryAreaCell — saf fonksiyon testi -----------
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(escapeHtmlSrc, context);
  vm.runInContext(formatComparableSummaryNumberSrc, context);
  vm.runInContext(formatComparableSummaryAreaCellSrc, context);

  const withDetail = context.formatComparableSummaryAreaCell({
    area: 115,
    workplaceFloorsSummary: "Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)",
  });
  assert.equal(
    withDetail,
    '115,00<span class="comparable-summary-floor-detail">Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)</span>',
    `Kat detayı doğru HTML olarak eklenmeli: "${withDetail}"`
  );

  const withoutDetail = context.formatComparableSummaryAreaCell({ area: 150, workplaceFloorsSummary: "" });
  assert.equal(withoutDetail, "150,00", `Kat detayı yokken sadece alan sayısı dönmeli: "${withoutDetail}"`);

  // HTML-escape: kat adı/oran metninde özel karakter olsa güvenli kaçırılmalı.
  const escaped = context.formatComparableSummaryAreaCell({ area: 10, workplaceFloorsSummary: "<script>alert(1)</script>" });
  assert.doesNotMatch(escaped, /<script>/, `Kat detayı HTML-escape edilmeli (XSS riski): "${escaped}"`);
}

// --- 2) getComparableValuationRows — kablolama entegrasyon testi --------
{
  const calculateComparableMetricsSrc = sliceFn("function calculateComparableMetrics(");
  const calculateComparableAdjustmentSrc = sliceFn("function calculateComparableAdjustment(");
  const parseComparableNumberSrc = sliceFn("function parseComparableNumber(");
  const parseComparablePercentSrc = sliceFn("function parseComparablePercent(");
  const parseComparableWorkplaceReductionRateSrc = sliceFn("function parseComparableWorkplaceReductionRate(");
  const formatComparableWorkplaceFloorsSummarySrc = sliceFn("function formatComparableWorkplaceFloorsSummary(");
  const getComparableMultiValuesSrc = sliceFn("function getComparableMultiValues(");
  const syncComparableWorkplaceFloorsSrc = sliceFn("function syncComparableWorkplaceFloors(");
  const getComparableValuationRowsSrc = sliceFn("function getComparableValuationRows(");

  function sliceArray(startMarker) {
    const start = appSource.indexOf(startMarker);
    assert(start >= 0, `Bulunamadi: ${startMarker}`);
    const end = appSource.indexOf("\n];", start) + 3;
    return appSource.slice(start, end);
  }
  const comparableFloorOptionsArraySrc = sliceArray("const comparableFloorOptions = [");

  const rows = [
    {
      c23: "Konut", c2: "Satılık", c6: "Zemin kat, Asma kat", c14: "1.150.000", c15: "",
      workplaceFloors: [
        { floor: "Zemin kat", area: "100", rate: "100%" },
        { floor: "Asma kat", area: "50", rate: "30%" },
      ],
    },
    { c23: "Konut", c2: "Satılık", c6: "", c12: "150", c13: "", c14: "3.000.000", c15: "" },
  ];
  const context = {
    isLandComparable: (row) => ["arsa", "tarla", "meyve bahcesi"].includes(String(row?.c23 || "").toLocaleLowerCase("tr")),
    syncComparableLandBuildableArea: () => {},
    getComparableRows: () => rows,
  };
  vm.createContext(context);
  vm.runInContext(comparableFloorOptionsArraySrc, context);
  vm.runInContext(getComparableMultiValuesSrc, context);
  vm.runInContext(syncComparableWorkplaceFloorsSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(parseComparablePercentSrc, context);
  vm.runInContext(parseComparableWorkplaceReductionRateSrc, context);
  vm.runInContext(calculateComparableAdjustmentSrc, context);
  vm.runInContext(calculateComparableMetricsSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorsSummarySrc, context);
  vm.runInContext(getComparableValuationRowsSrc, context);

  const valuationRows = context.getComparableValuationRows();
  assert.equal(valuationRows.length, 2, `İki satır dönmeli: ${JSON.stringify(valuationRows.map((r) => r.no))}`);
  assert.equal(
    valuationRows[0].workplaceFloorsSummary,
    "Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)",
    `E1 kat detayı dolu olmalı: "${valuationRows[0].workplaceFloorsSummary}"`
  );
  assert.equal(valuationRows[0].area, 115, `E1 alanı indirgenmiş toplam (115) olmalı: ${valuationRows[0].area}`);
  assert.equal(
    valuationRows[1].workplaceFloorsSummary,
    "",
    `E2 (kat detayı girilmemiş) için özet boş olmalı: "${valuationRows[1].workplaceFloorsSummary}"`
  );
}

console.log("Emsal Degerleme Tablosu kat detayi testi tamam.");
