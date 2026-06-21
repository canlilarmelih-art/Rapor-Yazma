const {
  cleanImarLegendItem,
  cleanImarPlanName,
  detectImarFunctionFromText,
  normalizeImarPlanFunction
} = require("../src/parsers/imar-normalizer");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(
    actual === expected,
    `${label}: beklenen "${expected}", gelen "${actual}"`
  );
}

function main() {
  assertEqual(cleanImarLegendItem("Gelişme Konut Alanı (6834.635 m²)"), "Konut Alanı", "Gelişme konut lejantı");
  assertEqual(cleanImarLegendItem("Yerleşik Konut Alanı"), "Konut Alanı", "Yerleşik konut lejantı");
  assertEqual(cleanImarLegendItem("Ticaret - Konut Alanı (715.848 m²)"), "Ticaret + Konut Alanı", "Karma lejant");
  assertEqual(cleanImarLegendItem("Kırsal Yerleşme Alanı"), "Kırsal Yerleşme Alanı", "Kırsal lejant korunmalı");

  assertEqual(
    cleanImarPlanName("1001/ ANKARA YOLU KUZEYİ 1. BÖLGE İLAVE VE REVİZYON UYGULAMA İMAR PLANI Plan Fonksiyon Uyarı"),
    "Ankara Yolu Kuzeyi 1. Bölge İlave Ve Revizyon Uygulama İmar Planı",
    "Plan adı başındaki kalıntı ve sonrası"
  );
  assertEqual(
    cleanImarPlanName("1/1000 ÖLÇEKLİ BALAT UYGULAMA İMAR PLANI"),
    "Balat Uygulama İmar Planı",
    "Plan adı ölçek temizliği"
  );
  assertEqual(cleanImarPlanName("KESTELRUIP"), "Kestel Revizyon Uygulama İmar Planı", "Kestel özel kural");

  assertEqual(normalizeImarPlanFunction("Mevcut Gelişme Konut Alanı"), "Konut Alanı", "Fonksiyon konut sadeleştirme");
  assertEqual(detectImarFunctionFromText("Taşınmaz Ticaret + Konut Alanı lejantında kalmaktadır."), "Ticaret + Konut Alanı", "Fonksiyon tespiti karma");

  console.log("İmar normalizasyon modul testi tamam.");
}

main();
