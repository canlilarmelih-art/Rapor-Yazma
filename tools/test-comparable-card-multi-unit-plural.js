"use strict";

/*
  Kullanici bildirimi (2026-08-20): "SORUN ÇOK TALEPLERDE ekspertize konu
  taşınmazla aynı bölgede yerine ekspertize konu taşınmazlarla aynı
  bölgede demesi gerekiyor. konum olarak taşınmazla benzer konumda yerine
  konum olarak taşınmazlarla benzer konumda demeli bunun gibi
  değişikliklerden bahsediyorum."

  Emsaller artık Çoklu Talep raporlarında rapor-geneli ORTAK (bkz.
  isComparablesSharedAcrossUnits, 0.0.489) — bu nedenle TEK BİR emsal
  kartının açıklama metnindeki (buildComparableLongText/
  buildComparableLandLongText) TÜM tekil "taşınmaz" (taşınmazla/taşınmaza
  göre/taşınmazın) referansları da bu durumda çoğul olmalı — 0.0.489'da
  yalnızca AGREGE "Piyasa Analizi ve Emsal Değerlendirmesi" metnine
  (buildComparableMarketAnalysisText) uygulanan çoğullaştırma, burada TEK
  EMSAL KARTI seviyesine de taşındı.

  Bu test gerçek kaynaktan (mock DEĞİL) şu fonksiyonları çalıştırır:
  buildComparableLongText, buildComparableLandLongText,
  buildComparablePositionComparisonText, buildComparableFeatureComparisonText,
  buildComparableLandPositionText, formatComparableMapLocationPhrase +
  tüm gerçek yardımcı bağımlılıkları (normalizeComparableText dahil, tam
  noktalama temizleme zinciriyle).
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

function sliceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi (baslangic): ${startMarker}`);
  const end = appSource.indexOf(endMarker, start);
  assert(end > start, `Bulunamadi (bitis): ${endMarker}`);
  return appSource.slice(start, end);
}

// Emsaller metin uretici kumesinin BUYUK BOLUMU (37972'den 39009'a kadar,
// bkz. app.js) contiguous - tek slice ile alinir; dis bagimliliklar
// (isLandComparable/isWorkplaceLikeUsageNature/isExternalAppointmentType/
// isHalkbankSelectedForReport/foldTurkish/normalizeReportSentenceLine
// zinciri) ayri extract edilir.
const bigSlice = sliceBetween(
  "function parseComparableWorkplaceReductionRate(",
  "\nfunction buildComparableLocationText("
);

const isWorkplaceLikeUsageNatureSrc = sliceFn("function isWorkplaceLikeUsageNature(");
const isHalkbankSelectedForReportSrc = sliceFn("function isHalkbankSelectedForReport(");
const foldTurkishSrc = sliceFn("function foldTurkish(");
const shouldLowercaseReportLineSrc = sliceFn("function shouldLowercaseReportLine(");
const toTitleCaseTrSrc = sliceFn("function toTitleCaseTr(");
const normalizeReportProperPhrasesSrc = sliceFn("function normalizeReportProperPhrases(");
const normalizeReportSentenceLineSrc = sliceFn("function normalizeReportSentenceLine(");

// isComparablesSharedAcrossUnits() kaynak-duzeyinde gercekten "yalnizca
// requestType === Coklu Talep" kontrolu mu yapiyor, dogrula (0.0.489
// genisletmesinin BOZULMADIGINI garanti eder).
assert.match(
  appSource,
  /function isComparablesSharedAcrossUnits\(\) \{\s*\n\s*return state\.fields\.requestType === "Çoklu Talep";\s*\n\}/,
  "isComparablesSharedAcrossUnits() beklenen kosulu (yalnizca requestType) icermiyor - kaynak degismis olabilir."
);

function createContext(overrides = {}) {
  let multiUnit = false;
  const context = {
    state: { fields: { appointmentType: "İçi görülmüştür", legalUsageNature: "Konut", bank: "", ...overrides.fields } },
    selectVariant: () => 0,
    registerVariantGroup: () => {},
    isLandComparable: () => false,
    isExternalAppointmentType: (value) => String(value || "").includes("Dışarıdan"),
    isComparablesSharedAcrossUnits: () => multiUnit,
    syncComparableLandBuildableArea: () => {},
  };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(isWorkplaceLikeUsageNatureSrc, context);
  vm.runInContext(isHalkbankSelectedForReportSrc, context);
  vm.runInContext(shouldLowercaseReportLineSrc, context);
  vm.runInContext(toTitleCaseTrSrc, context);
  vm.runInContext(normalizeReportProperPhrasesSrc, context);
  vm.runInContext(normalizeReportSentenceLineSrc, context);
  vm.runInContext(bigSlice, context);
  context.setMultiUnit = (value) => { multiUnit = value; };
  return context;
}

// --- 1) Konut/İşyeri (dahili ekspertiz) dalı: TEKİL (regresyon) + ÇOĞUL ---
{
  const context = createContext();
  const row = {
    c0: "Melih Canlılar", c1: "5515861280",
    c2: "Satılık", c4: "daire", c5: "3+1", c6: "Zemin kat",
    c7: "Aynı Bölge / Site",
    c8: "-", c21: "15%",
    c9: "+", c10: "deniz manzaralı olması", c22: "10%",
    c11: "7-8", c12: "120", c13: "100",
  };
  const metrics = {
    askingPrice: 4500000, negotiationRate: 0.11, rent: 20000,
    saleValue: 4000000, adjustedArea: 100, adjustedUnitValue: 40000,
    featureAdjustment: 0, locationAdjustment: 0, netSaleValue: 4000000,
  };

  context.setMultiUnit(false);
  const single = context.buildComparableLongText(row, 0, metrics);
  assert.match(single, /^\(İrtibat Kişisi ve Telefon No: Melih Canlılar \/ 5515861280\)\n\nEkspertize konu taşınmazla aynı bölgede/, "REGRESYON: Tekli/paylaşımsız durumda 'taşınmazla' (tekil) korunmalı.");
  assert.match(single, /taşınmaza göre daha iyi konumda/, "REGRESYON: Tekil konum karşılaştırması 'taşınmaza göre' olmalı.");
  assert.match(single, /konu taşınmaza göre daha vasat iç özelliklere sahiptir/, "REGRESYON: Tekil iç özellik karşılaştırması 'taşınmaza göre' olmalı.");
  assert(!single.includes(".."), "REGRESYON: Metinde cift noktalama olmamali.");
  // Kullanicinin ORIJINAL ornek metniyle BIREBIR eslesme (bu PR'dan once de dogruydu).
  assert.equal(
    single,
    "(İrtibat Kişisi ve Telefon No: Melih Canlılar / 5515861280)\n\n" +
    "Ekspertize konu taşınmazla aynı bölgede, 7-8 yıllık bir sitede konumlu, zemin katta yer alan, 120 m2 olarak beyan edilen, 100 m2 olduğu düşünülen, 3+1 planında daire 4.500.000 TL bedelle satılıktır. Emsal, deniz manzaralı olması sebebiyle taşınmaza göre daha iyi konumda ve konu taşınmaza göre daha vasat iç özelliklere sahiptir. Pazarlık payı vardır. Pazarlık payının yaklaşık %11, kira değerinin 20.000 TL/ay olacağı düşünülmektedir. (İndirgenmiş m2 Birim Değeri: 4.000.000 TL (Pazarlıklı Değer) × 1,00 (Toplam Şerefiye Katsayısı) / 100 m2 = 40.000 TL/m2)",
    "Tekil metin kullanicinin bildirdigi orijinal ornekle BIREBIR eslesmeli."
  );

  context.setMultiUnit(true);
  const multi = context.buildComparableLongText(row, 0, metrics);
  assert.match(multi, /Ekspertize konu taşınmazlarla aynı bölgede/, "KULLANICI TALEBI: Coklu Talep + paylasimli durumda 'taşınmazlarla' (cogul) kullanilmali.");
  assert.match(multi, /taşınmazlara göre daha iyi konumda/, "KULLANICI TALEBI: Cogul konum karsilastirmasi 'taşınmazlara göre' olmali.");
  assert.match(multi, /konu taşınmazlara göre daha vasat iç özelliklere sahiptir/, "KULLANICI TALEBI: Cogul ic ozellik karsilastirmasi 'taşınmazlara göre' olmali.");
  assert(!multi.includes("taşınmazla aynı"), "KULLANICI TALEBI: Cogul modda TEKIL 'taşınmazla' KALMAMALI.");
  assert(!multi.includes(".."), "Cogul metinde de cift noktalama olmamali.");
  console.log("Emsal karti (Konut/Isyeri, dahili ekspertiz) tekil/cogul testi tamam.");
}

// --- 2) Konut/İşyeri (dışarıdan ekspertiz) dalı: TEKİL + ÇOĞUL ------------
{
  const context = createContext({ fields: { appointmentType: "Dışarıdan ekspertiz" } });
  const row = {
    c0: "Melih Canlılar", c1: "5515861280",
    c2: "Satılık", c4: "daire", c5: "3+1", c6: "Zemin kat",
    c7: "Aynı Bölge / Site",
    c8: "-", c21: "15%",
    c9: "+", c10: "deniz manzaralı olması", c22: "10%",
    c11: "7-8", c12: "120", c13: "100",
  };
  const metrics = {
    askingPrice: 4500000, negotiationRate: 0.11, rent: 20000,
    saleValue: 4000000, adjustedArea: 100, adjustedUnitValue: 40000,
    featureAdjustment: 0, locationAdjustment: 0, netSaleValue: 4000000,
  };

  context.setMultiUnit(false);
  const single = context.buildComparableLongText(row, 0, metrics);
  assert.match(single, /Emsal konu taşınmaz ile deniz manzaralı olması sebebiyle daha iyi konumda yer almakta olup/, "REGRESYON: Disaridan ekspertiz TEKIL modda 'taşınmaz ile' olmali, 'taşınmaza göre' ARINDIRILMALI.");

  context.setMultiUnit(true);
  const multi = context.buildComparableLongText(row, 0, metrics);
  assert.match(multi, /Emsal konu taşınmazlarla deniz manzaralı olması sebebiyle daha iyi konumda yer almakta olup/, "KULLANICI TALEBI: Disaridan ekspertiz COGUL modda 'taşınmazlarla' olmali, 'taşınmazlara göre' de ARINDIRILMALI.");
  assert(!multi.includes("taşınmaza göre"), "KULLANICI TALEBI: Cogul disaridan-ekspertiz metninde ARTIK-ARINDIRILMAMIS tekil 'taşınmaza göre' kalmamali.");

  console.log("Emsal karti (Konut/Isyeri, disaridan ekspertiz) tekil/cogul testi tamam.");
}

// --- 3) Arsa/Tarla dalı: TEKİL (regresyon) + ÇOĞUL ------------------------
{
  const context = createContext();
  const row = {
    c0: "Melih Canlılar", c1: "5515861280",
    c2: "Satılık", c7: "Aynı Bölge",
    c9: "+", c10: "yola cephe olması", c22: "10%",
    c20: "250 m kuzeyinde",
    c23: "Tarla", c24: "1000",
  };
  const metrics = { negotiationRate: 0.1, adjustedUnitValue: 1000, adjustedArea: 1000, saleValue: 1000000, netSaleValue: 1000000, locationAdjustment: 0 };

  context.setMultiUnit(false);
  const single = context.buildComparableLandLongText(row, 0, metrics);
  assert.match(single, /Ekspertize konu taşınmazla aynı bölgede/, "REGRESYON: Arsa/Tarla TEKIL modda acilis 'taşınmazla' olmali.");
  assert.match(single, /taşınmazın yaklaşık 250 metre kuzeyinde/, "REGRESYON: Arsa/Tarla TEKIL modda mesafe ifadesi 'taşınmazın' (genitif) olmali.");
  assert.match(single, /taşınmaza göre daha iyi konumda/, "REGRESYON: Arsa/Tarla TEKIL modda konum karsilastirmasi 'taşınmaza göre' olmali.");

  context.setMultiUnit(true);
  const multi = context.buildComparableLandLongText(row, 0, metrics);
  assert.match(multi, /Ekspertize konu taşınmazlarla aynı bölgede/, "KULLANICI TALEBI: Arsa/Tarla COGUL modda acilis 'taşınmazlarla' olmali.");
  assert.match(multi, /taşınmazların yaklaşık 250 metre kuzeyinde/, "KULLANICI TALEBI: Arsa/Tarla COGUL modda mesafe ifadesi 'taşınmazların' (genitif cogul) olmali.");
  assert.match(multi, /taşınmazlara göre daha iyi konumda/, "KULLANICI TALEBI: Arsa/Tarla COGUL modda konum karsilastirmasi 'taşınmazlara göre' olmali (kullanicinin 2. ornegiyle ayni desen).");

  console.log("Emsal karti (Arsa/Tarla) tekil/cogul testi tamam.");
}

console.log("Emsal karti coklu-talep cogullastirma testleri basarili.");
