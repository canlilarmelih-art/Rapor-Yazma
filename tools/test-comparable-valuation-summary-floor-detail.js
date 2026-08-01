"use strict";

/*
  Kullanici talebi: "Emsaller tablosu kat bazında girilen emsalleri
  gösterir şekilde düzenleme planı" — arastirma sonucu iki maddede
  netlesti: (1) ekrandaki "Emsal Değerleme Tablosu" özet paneli
  (createComparableValuationSummaryTable) ALAN hucresinde sadece toplam
  sayiyi gosteriyordu, hangi katin kac m2 oldugunu gostermiyordu; (2) Word/
  rapor ciktisi (buildComparableMatrixWordTableHtml) zaten kat detayini
  gosteriyordu (onceki oturumda eklenmisti), degisiklik gerekmedi.

  Sonraki kullanici talebi ("hücre içinde kat kat var ise emsalde o kadar
  satır + 1 satır açalım...") ile once ALAN hucresi altina ayri satirlar
  eklendi (createComparableWorkplaceFloorDetailRows) — sonra kullanici bunu
  da degistirdi: "alan sütunun yanına kat alanları sütünü aç 3 satırı oraya
  koy". Son haliyle ALAN sütununun YANINA ayrı bir "KAT ALANLARI" sütunu
  eklendi; kat detayi artik ayri tablo satirlari degil, bu yeni sutunun
  HUCRESI icinde alt alta satirlar (formatComparableWorkplaceFloorAreasColumn)
  olarak gosteriliyor. ALAN hücresi sadece toplam sayiyi gosterir
  (formatComparableSummaryAreaCell sadelestirildi).

  En son kullanici talebi ("alan kısmında toplam emsal alanı yazsin örnek
  150 m2 ama hesaplamaları tamamı indirgenmiş alan üzerinden yapılmaya
  devam etsin"): ALAN sütunu artik indirgenMEMİŞ toplam alani gosterir
  (Zemin 100 + Asma 50 = 150 m²); tum hesaplamalar (birim deger, kira
  birim vb.) yine de indirgenmis alan (workplaceReducedArea/adjustedArea)
  uzerinden yapilir — sadece GORUNUM degisti. calculateComparableMetrics'e
  yeni `workplaceTotalArea` alani eklendi; getComparableValuationRows()
  `row.area`i (goruntu, ham toplam) `row.workplaceEffectiveArea`den
  (hesaplama, indirgenmis) ayirdi. KAT ALANLARI sutunundaki "Toplam Etkili
  Alan" satiri hala indirgenmis alani gosterir (workplaceEffectiveArea).

  Daha da son kullanici talebi ("Kat alanları bölümünü 3 alt sütuna
  bölelim. Kat; Alan; İnd. Oranı"): KAT ALANLARI artik TEK birlesik hucre
  degil, "SATIŞ / PİYASA DEĞERLEMESİ" gibi bir grup basligi (colspan=3) —
  altinda KAT / ALAN / İND. ORANI adinda 3 ayri alt sutun var. Eski
  formatComparableWorkplaceFloorDetailLabel + formatComparableWorkplaceFloor-
  AreasColumn (birlesik "Zemin Kat 100 m² (%100)" satiri) kaldirildi; yerine
  formatComparableWorkplaceFloorColumn(row, key) geldi — key "floor"/"area"/
  "rate" icin ilgili alt sutunun kendi satirlarini (+ toplam satirini) uretir.

  Bu test dort katmani izole dogrular:
  1) formatComparableWorkplaceFloorColumn — saf fonksiyon, her key icin
     dogru satirlari (+ toplam satirini) uretir, HTML-escape dahil.
  2) formatComparableSummaryAreaCell — sade toplam sayi bicimleyicisi.
  3) getComparableValuationRows() — E1 icin row.area'nin ham toplam (150),
     row.workplaceEffectiveArea'nin indirgenmis toplam (115) oldugunu ve
     hesaplama alanlarinin (unitValue, adjustedUnitValue) hala indirgenmis
     alan uzerinden hesaplandigini gercek calculateComparableMetrics
     zinciriyle dogrular.
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
const normalizeComparableFloorNameSrc = sliceFn("function normalizeComparableFloorName(");
const parseComparableNumberSrc = sliceFn("function parseComparableNumber(");
const formatComparableWorkplaceFloorColumnLineSrc = sliceFn("function formatComparableWorkplaceFloorColumnLine(");
const formatComparableWorkplaceFloorColumnSrc = sliceFn("function formatComparableWorkplaceFloorColumn(");
const formatComparableSummaryAreaCellSrc = sliceFn("function formatComparableSummaryAreaCell(");
const formatComparableSummaryNumberSrc = sliceFn("function formatComparableSummaryNumber(");

function lineDiv(text) {
  return `<div class="comparable-summary-floor-area-line">${text}</div>`;
}

// --- 1) formatComparableWorkplaceFloorColumn — 3 alt sütun (KAT/ALAN/İND. ORANI)
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(escapeHtmlSrc, context);
  vm.runInContext(normalizeComparableFloorNameSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorColumnLineSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorColumnSrc, context);

  const row = {
    area: 150,
    workplaceEffectiveArea: 115,
    workplaceFloors: [
      { floor: "Zemin kat", area: "100", rate: "100%" },
      { floor: "Asma kat", area: "50", rate: "30%" },
    ],
  };

  const floorCol = context.formatComparableWorkplaceFloorColumn(row, "floor");
  assert.equal(
    floorCol,
    lineDiv("Zemin Kat") + lineDiv("Asma Kat") + lineDiv("Toplam"),
    `KAT alt sütunu 2 kat adı + "Toplam" satırı içermeli: "${floorCol}"`
  );

  // ALAN alt sütununun toplam satırı row.area (150, ham) DEĞİL,
  // row.workplaceEffectiveArea (115, indirgenmiş) kullanmalı.
  const areaCol = context.formatComparableWorkplaceFloorColumn(row, "area");
  assert.equal(
    areaCol,
    lineDiv("100 m²") + lineDiv("50 m²") + lineDiv("115 m²"),
    `ALAN alt sütunu ham kat alanları + indirgenmiş toplam içermeli: "${areaCol}"`
  );

  const rateCol = context.formatComparableWorkplaceFloorColumn(row, "rate");
  assert.equal(
    rateCol,
    lineDiv("%100") + lineDiv("%30") + lineDiv(""),
    `İND. ORANI alt sütunu her katın oranı + boş toplam satırı içermeli: "${rateCol}"`
  );

  const empty = context.formatComparableWorkplaceFloorColumn({ area: 150, workplaceEffectiveArea: 150, workplaceFloors: [] }, "floor");
  assert.equal(empty, "", `Kat detayı yokken alt sütun hücresi boş olmalı: "${empty}"`);

  // HTML-escape: kat adı metninde özel karakter olsa güvenli kaçırılmalı.
  const escaped = context.formatComparableWorkplaceFloorColumn(
    { area: 10, workplaceEffectiveArea: 10, workplaceFloors: [{ floor: "<script>alert(1)</script>", area: "10", rate: "100%" }] },
    "floor"
  );
  assert.doesNotMatch(escaped, /<script>/, `Alt sütun hücresi HTML-escape edilmeli (XSS riski): "${escaped}"`);
}

// --- 2) formatComparableSummaryAreaCell — artik sadece toplam sayi ------
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(formatComparableSummaryNumberSrc, context);
  vm.runInContext(formatComparableSummaryAreaCellSrc, context);

  const text = context.formatComparableSummaryAreaCell({ area: 115 });
  assert.equal(text, "115,00", `ALAN hücresi artık sadece toplam sayı olmalı (kat detayı ayrı satırlarda): "${text}"`);
}

// --- 3) getComparableValuationRows — kablolama entegrasyon testi --------
{
  const calculateComparableMetricsSrc = sliceFn("function calculateComparableMetrics(");
  const calculateComparableAdjustmentSrc = sliceFn("function calculateComparableAdjustment(");
  const parseComparablePercentSrc = sliceFn("function parseComparablePercent(");
  const parseComparableWorkplaceReductionRateSrc = sliceFn("function parseComparableWorkplaceReductionRate(");
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
  vm.runInContext(getComparableValuationRowsSrc, context);

  const valuationRows = context.getComparableValuationRows();
  assert.equal(valuationRows.length, 2, `İki satır dönmeli: ${JSON.stringify(valuationRows.map((r) => r.no))}`);
  assert.equal(
    valuationRows[0].workplaceFloors.map((f) => `${f.floor}:${f.area}:${f.rate}`).join("|"),
    "Zemin kat:100:100%|Asma kat:50:30%",
    `E1 kat listesi dolu olmalı: ${JSON.stringify(valuationRows[0].workplaceFloors)}`
  );
  // ALAN sütunu (row.area) ham toplam (100+50=150) göstermeli; hesaplamada
  // kullanılan indirgenmiş alan (100×%100 + 50×%30 = 115) ayrı bir alanda
  // (workplaceEffectiveArea) taşınmalı — kullanıcı talebi.
  assert.equal(valuationRows[0].area, 150, `E1 ALAN sütunu ham toplam (150) olmalı: ${valuationRows[0].area}`);
  assert.equal(
    valuationRows[0].workplaceEffectiveArea,
    115,
    `E1 hesaplama alanı indirgenmiş toplam (115) olmalı: ${valuationRows[0].workplaceEffectiveArea}`
  );
  // Hesaplamalar (unitValue = saleValue / indirgenmişAlan) hâlâ indirgenmiş
  // alan üzerinden yapılmalı: 1.150.000 / 115 = 10.000, ham alan (150)
  // üzerinden hesaplansaydı 7.666,67 çıkardı.
  assert.equal(
    Math.round(valuationRows[0].unitValue),
    10000,
    `E1 birim değeri indirgenmiş alan (115) üzerinden hesaplanmalı: ${valuationRows[0].unitValue}`
  );
  assert.equal(
    valuationRows[1].workplaceFloors.length,
    0,
    `E2 (kat detayı girilmemiş) için kat listesi boş olmalı: ${JSON.stringify(valuationRows[1].workplaceFloors)}`
  );
  // E2 kat detayı girilmemiş: ALAN ve hesaplama alanı aynı (150) olmalı.
  assert.equal(valuationRows[1].area, 150, `E2 ALAN sütunu (kat detayı yok) 150 olmalı: ${valuationRows[1].area}`);
  assert.equal(
    valuationRows[1].workplaceEffectiveArea,
    150,
    `E2 hesaplama alanı (kat detayı yok) da 150 olmalı: ${valuationRows[1].workplaceEffectiveArea}`
  );
}

console.log("Emsal Degerleme Tablosu kat detayi testi tamam.");
