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

  Bu test dort katmani izole dogrular:
  1) formatComparableWorkplaceFloorDetailLabel — saf fonksiyon, her kat
     icin "Zemin Kat 100 m² (%100)" formatinda etiket uretir.
  2) formatComparableWorkplaceFloorAreasColumn — KAT ALANLARI hucresinin
     HTML icerigini uretir (her kat + indirgenmis toplam satiri,
     HTML-escape dahil); bu satir row.area (ham) degil
     row.workplaceEffectiveArea (indirgenmis) kullanir.
  3) getComparableValuationRows() — E1 icin row.area'nin ham toplam (150),
     row.workplaceEffectiveArea'nin indirgenmis toplam (115) oldugunu ve
     hesaplama alanlarinin (unitValue, adjustedUnitValue) hala indirgenmis
     alan uzerinden hesaplandigini gercek calculateComparableMetrics
     zinciriyle dogrular.
  4) formatComparableSummaryAreaCell — sade toplam sayi bicimleyicisi.
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
const formatComparableWorkplaceFloorDetailLabelSrc = sliceFn("function formatComparableWorkplaceFloorDetailLabel(");
const formatComparableWorkplaceFloorAreasColumnSrc = sliceFn("function formatComparableWorkplaceFloorAreasColumn(");
const formatComparableSummaryAreaCellSrc = sliceFn("function formatComparableSummaryAreaCell(");
const formatComparableSummaryNumberSrc = sliceFn("function formatComparableSummaryNumber(");

// --- 1) formatComparableWorkplaceFloorDetailLabel — saf fonksiyon testi -
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(normalizeComparableFloorNameSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorDetailLabelSrc, context);

  const zemin = context.formatComparableWorkplaceFloorDetailLabel({ floor: "Zemin kat", area: "100", rate: "100%" });
  assert.equal(zemin, "Zemin Kat 100 m² (%100)", `Zemin kat etiketi beklenen formatta olmalı: "${zemin}"`);

  const asma = context.formatComparableWorkplaceFloorDetailLabel({ floor: "Asma kat", area: "50", rate: "30%" });
  assert.equal(asma, "Asma Kat 50 m² (%30)", `Asma kat etiketi beklenen formatta olmalı: "${asma}"`);

  // Oran boş bırakılırsa (varsayılan %100 indirgenmeden).
  const noRate = context.formatComparableWorkplaceFloorDetailLabel({ floor: "1. normal kat", area: "80", rate: "" });
  assert.equal(noRate, "1. normal Kat 80 m² (%100)", `Oran boşken varsayılan %100 olmalı: "${noRate}"`);
}

// --- 2) formatComparableWorkplaceFloorAreasColumn — KAT ALANLARI hücresi
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(escapeHtmlSrc, context);
  vm.runInContext(normalizeComparableFloorNameSrc, context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorDetailLabelSrc, context);
  vm.runInContext(formatComparableWorkplaceFloorAreasColumnSrc, context);

  // row.area (150, ham toplam) DEĞİL, row.workplaceEffectiveArea (115,
  // indirgenmiş) "Toplam Etkili Alan" satırında kullanılmalı.
  const html = context.formatComparableWorkplaceFloorAreasColumn({
    area: 150,
    workplaceEffectiveArea: 115,
    workplaceFloors: [
      { floor: "Zemin kat", area: "100", rate: "100%" },
      { floor: "Asma kat", area: "50", rate: "30%" },
    ],
  });
  assert.equal(
    html,
    '<div class="comparable-summary-floor-area-line">Zemin Kat 100 m² (%100)</div>' +
      '<div class="comparable-summary-floor-area-line">Asma Kat 50 m² (%30)</div>' +
      '<div class="comparable-summary-floor-area-line">Toplam Etkili Alan = 115 m²</div>',
    `KAT ALANLARI hücresi 3 satır (2 kat + indirgenmiş toplam) içermeli: "${html}"`
  );

  const empty = context.formatComparableWorkplaceFloorAreasColumn({ area: 150, workplaceEffectiveArea: 150, workplaceFloors: [] });
  assert.equal(empty, "", `Kat detayı yokken KAT ALANLARI hücresi boş olmalı: "${empty}"`);

  // HTML-escape: kat adı/oran metninde özel karakter olsa güvenli kaçırılmalı.
  const escaped = context.formatComparableWorkplaceFloorAreasColumn({
    area: 10,
    workplaceEffectiveArea: 10,
    workplaceFloors: [{ floor: "<script>alert(1)</script>", area: "10", rate: "100%" }],
  });
  assert.doesNotMatch(escaped, /<script>/, `KAT ALANLARI hücresi HTML-escape edilmeli (XSS riski): "${escaped}"`);
}

// --- 3) formatComparableSummaryAreaCell — artik sadece toplam sayi ------
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(formatComparableSummaryNumberSrc, context);
  vm.runInContext(formatComparableSummaryAreaCellSrc, context);

  const text = context.formatComparableSummaryAreaCell({ area: 115 });
  assert.equal(text, "115,00", `ALAN hücresi artık sadece toplam sayı olmalı (kat detayı ayrı satırlarda): "${text}"`);
}

// --- 4) getComparableValuationRows — kablolama entegrasyon testi --------
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
