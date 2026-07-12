const {
  cleanImarLegendItem,
  cleanImarPlanName,
  detectImarFunctionFromText,
  extractImarInfoInstitution,
  extractImarPlanDate,
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
  assertEqual(cleanImarLegendItem("Gelişme Konut Alanı (6834.635 m²)"), "Konut", "Gelişme konut lejantı");
  assertEqual(cleanImarLegendItem("Yerleşik Konut Alanı"), "Konut", "Yerleşik konut lejantı");
  assertEqual(cleanImarLegendItem("Ticaret - Konut Alanı (715.848 m²)"), "Ticaret + Konut", "Karma lejant");
  assertEqual(cleanImarLegendItem("Kırsal Yerleşme Alanı"), "Kırsal Yerleşme", "Kırsal lejant sadeleşmeli");

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

  assertEqual(normalizeImarPlanFunction("Mevcut Gelişme Konut Alanı"), "Konut", "Fonksiyon konut sadeleştirme");
  assertEqual(detectImarFunctionFromText("Taşınmaz Ticaret + Konut Alanı lejantında kalmaktadır."), "Ticaret + Konut", "Fonksiyon tespiti karma");
  assertEqual(
    extractImarInfoInstitution([
      "9.05.2026 11:41 E-İmar",
      "T.C. MUDANYA BELEDİYESİ",
      "İMAR VE ŞEHİRCİLİK MÜDÜRLÜĞÜ",
      "Bu Belge Mudanya Belediyesi Resmi Web Sitesinden 19.05.2026 Tarihinde Hazırlanmıştır."
    ]),
    "Mudanya Belediyesi",
    "Mudanya belediye satırından bilgi alınan kurum"
  );
  assertEqual(
    extractImarPlanDate([
      "Bu Belge Mudanya Belediyesi Resmi Web Sitesinden 19.05.2026 Tarihinde Hazırlanmıştır.",
      "YÜRÜRLÜKTEKİ İMAR PLANI YAPILAŞMA BİLGİLERİ",
      "Planı Adı Mudanya Revizyon ve İlave Uygulama İmar Planı",
      "Tasdik Tarihi - No'su 18.02.2016 - 120"
    ]),
    "18.02.2016",
    "Tasdik tarihi no satırından plan tarihi"
  );
  assertEqual(
    extractImarPlanDate([
      "Bu Belge Mudanya Belediyesi Resmi Web Sitesinden 19.05.2026 Tarihinde Hazırlanmıştır.",
      "9.05.2026 11:41 E-İmar"
    ]),
    "",
    "Belge hazırlama tarihi plan tarihi olarak alınmamalı"
  );

  console.log("İmar normalizasyon modul testi tamam.");
}

main();
