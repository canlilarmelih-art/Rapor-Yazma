"use strict";

// Kullanici bildirimi (2026-09-15, ekran goruntusu — Ana Gayrimenkul Kat
// Dagilimi tablosu, "1. Bodrum" satiri "Ortak Ve Eklentiler" hucresi
// "otopark ve ortak alanlar", "Cati" satiri "4. normal katta yer alan
// dairelerin devamlari"): "ortak ve eklentiler kullanici nasil yazdi ise
// buyuk kucuk harf o sekilde paragrafa aktarilmali" — uretilen "Ana
// Gayrimenkul Aciklamasi" paragrafinda bu hucrenin metni "Otopark ve ortak
// alanlar" / "4. Normal katta..." olarak BUYUK harfle cikiyordu, hucrede
// yazan (kucuk harfli, bkz. test-building-floor-common-lowercase.js —
// hucre zaten girisde normalizeLowercaseFreeText() ile kucuk harfe
// zorlanip oyle saklaniyor) ile UYUSMUYORDU.
//
// Kok neden: buildBuildingFloorMacroSummary() (app.js) "common" hucresini
// normalizeReportDescriptionText() ile isliyordu — bu fonksiyonun cumle-ici
// buyutme regex'i (/(^|[.!?]\s+)([a-zcgiosu])/g) SATIR BASI'ni VE HER
// ". " (nokta+bosluk) sonrasini buyutuyor: "otopark..." satir basinda ->
// "Otopark...", "4. normal katta..." icindeki "4. " -> "4. Normal...".
// Hucre zaten (baska bir kullanici talebiyle) DAIMA kucuk harfe
// normallestirilerek saklandigindan, paragrafa aktarilirken AYNI
// normalizeLowercaseFreeText() (idempotent, YENI bir kural DEGIL) ile
// islenmesi yeterli ve doGRU — sonuc hucrede goruneni AYNEN yansitir.
//
// Bu test buildBuildingFloorMacroSummary()'yi TUM gercek bagimliliklariyla
// (parseBuildingFloorCount, isNormalBuildingFloor, joinBuildingUnitCounts,
// writeBuildingNormalGroup, formatBuildingFloorLocative,
// formatBuildingUnitLabel, getBuildingDistributionSuffix, joinTurkishList,
// cleanComparablePunctuation, normalizeLowercaseFreeText) TEK bir
// vm.runInContext cagrisinda calistirir (bkz. proje belleği: ayri
// vm.runInContext cagrilari arasinda top-level const/let paylasilmaz).
// normalizeReportDescriptionText VE onun TUM zinciri (eski/stash'lenmis
// koddaki cagriyi da GERCEKTEN calistirabilmek icin — degeri yanlis
// SEBEPTEN degil, GERCEKTEN yanlis DEGERDEN dolayi kirmak icin) de ayni
// context'e eklenir.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, { toMarker } = {}) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = toMarker ? appSource.indexOf(toMarker, start) : appSource.indexOf("\n}", start) + 2;
  assert(end > start, `Bitis bulunamadi: ${startMarker}`);
  return appSource.slice(start, end);
}

const combinedSource = [
  sliceFn("function normalizeLowercaseFreeText("),
  sliceFn("const buildingFloorUnitColumns = [", { toMarker: "\n];" }) + "\n];",
  sliceFn("function parseBuildingFloorCount("),
  sliceFn("function isNormalBuildingFloor("),
  sliceFn("function appendBuildingFloorSummaryPart("),
  sliceFn("function joinBuildingUnitCounts("),
  sliceFn("function writeBuildingNormalGroup("),
  sliceFn("function formatBuildingFloorLocative("),
  sliceFn("function formatBuildingFloorNameForList("),
  sliceFn("function extractBuildingFloorOrdinal("),
  sliceFn("function formatOrdinalList("),
  sliceFn("function formatBuildingUnitLabel("),
  sliceFn("function getBuildingDistributionSuffix("),
  sliceFn("function joinTurkishList("),
  sliceFn("function cleanComparablePunctuation("),
  // Eski (stash'lenmis) kodun cagirdigi normalizeReportDescriptionText
  // zinciri — YALNIZCA regresyon senaryosunda gercekten kullanilir, ama
  // her iki (fix'li/fix'siz) app.js icin de context'te hazir bulunmasi
  // gerekir (hangi versiyonun calisacagi test calisma anindaki app.js
  // icerigine bagli).
  sliceFn("function escapeRegExp("),
  sliceFn("function foldTurkish("),
  sliceFn("function toTitleCaseTr("),
  sliceFn("function normalizeReportNumberFormats("),
  sliceFn("function shouldLowercaseReportLine("),
  sliceFn("function normalizeReportWhitespace("),
  sliceFn("function normalizeReportProperPhrases("),
  sliceFn("function preserveReportSpecialWords("),
  sliceFn("function normalizeReportSentenceLine("),
  sliceFn("function normalizeReportDescriptionText("),
  sliceFn("function buildBuildingFloorMacroSummary(", { toMarker: "\nfunction isNormalBuildingFloor" }),
].join("\n\n");

function runScenario(rows, totalUnits) {
  const context = {
    state: { fields: { totalUnits }, tables: { buildingFloors: rows } },
  };
  vm.createContext(context);
  vm.runInContext(combinedSource, context);
  return context.buildBuildingFloorMacroSummary();
}

// --- 1) KULLANICI ORNEGI (BIREBIR, ekran goruntusu): 1. Bodrum "otopark ve
// ortak alanlar", Cati "4. normal katta yer alan dairelerin devamlari" —
// ikisi de hucrede yazan KUCUK harfle PARAGRAFA aktarilmali, BUYUK harfe
// DONUSMEMELI.
{
  const rows = [
    { floorName: "1. Bodrum", common: "otopark ve ortak alanlar" },
    { floorName: "Zemin", residential: "3" },
    { floorName: "1. Normal", residential: "3" },
    { floorName: "2. Normal", residential: "3" },
    { floorName: "3. Normal", residential: "3" },
    { floorName: "4. Normal", residential: "5" },
    { floorName: "Çatı", common: "4. normal katta yer alan dairelerin devamları" },
  ];
  const text = runScenario(rows, "17");

  assert.ok(text.includes("otopark ve ortak alanlar"), `"otopark ve ortak alanlar" (kucuk harf) metinde bulunmali: ${text}`);
  assert.ok(!text.includes("Otopark"), `"Otopark" (BUYUK O ile) metinde OLMAMALI (hucrede kucuk yaziliydi): ${text}`);

  assert.ok(
    text.includes("4. normal katta yer alan dairelerin devamları"),
    `Çatı satırının "4. normal katta yer alan dairelerin devamları" metni (kucuk n) BIREBIR bulunmali: ${text}`
  );
  assert.ok(!text.includes("4. Normal"), `"4. Normal" (BUYUK N ile) metinde OLMAMALI (hucrede kucuk yaziliydi): ${text}`);

  console.log("KULLANICI ORNEGI (1. Bodrum + Cati ortak metni): kucuk harf korunuyor testi tamam.");
}

// --- 2) Eski/ithal veri (blur'dan gecmemis, KARISIK harfli "common") icin
// de self-heal ile daima kucuk harfe donusmeli — buildBuildingFloorMacroSummary
// normalizeLowercaseFreeText()'i idempotent bicimde tekrar uygular.
{
  const rows = [{ floorName: "Zemin", common: "OTOPARK Ve Merdiven BOŞLUĞU" }];
  const text = runScenario(rows, "");
  assert.ok(text.includes("otopark ve merdiven boşluğu"), `Karisik harfli "common" da kucuk harfe donmeli: ${text}`);
  assert.ok(!/OTOPARK|Merdiven|BOŞLUĞU/.test(text), `Orijinal buyuk/karma harfler PARAGRAFTA kalmamali: ${text}`);
  console.log("Karisik harfli (blur oncesi) common self-heal testi tamam.");
}

// --- 3) Sayisal birim metni (floor adindan/joinBuildingUnitCounts'tan gelen
// "4. normal katta 5 adet daire" gibi) bu degisiklikten ETKİLENMEMELİ —
// yalnizca KULLANICI GIRDISI olan "common" hucresi icin kucuk harf
// korunuyor, floor adlarinin KENDI normalizasyonu (formatBuildingFloorNameForList,
// zaten daima kucuk harf) DEGISMEDI.
{
  const rows = [
    { floorName: "1. Normal", residential: "3" },
    { floorName: "2. Normal", residential: "3" },
    { floorName: "3. Normal", residential: "3" },
    { floorName: "4. Normal", residential: "5" },
  ];
  const text = runScenario(rows, "");
  assert.ok(text.includes("4. normal katta 5 adet daire"), `Kat adedinden gelen kisim degismemeli: ${text}`);
  console.log("Kat adedi (floor adi) kismi etkilenmedi testi tamam.");
}

console.log("Ana Gayrimenkul Kat Dagilimi - Ortak Ve Eklentiler paragraf buyuk/kucuk harf testleri basarili.");
