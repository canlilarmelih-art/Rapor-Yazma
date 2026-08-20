const {
  buildComparableMarketAnalysisText,
} = require("../src/comparables/comparable-market-analysis");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function main() {
  const text = buildComparableMarketAnalysisText({
    fields: {
      titleNeighborhood: "Görükle",
      street: "Üniversite Caddesi",
      legalValueUnit: "24.594",
    },
    rows: [
      { c2: "Satılık", c12: "110", c13: "100", c8: "-", c21: "10%", c9: "0", c22: "0%", c14: "3.800.000", c15: "3.600.000", c20: "250 m kuzeyinde" },
      { c2: "Satılmış", c12: "126", c13: "100", c8: "-", c21: "5%", c9: "-", c22: "5%", c14: "4.000.000", c20: "438 m batısında" },
      { c2: "Kiralık", c12: "95", c13: "95", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "3.420.000", c20: "120 m güneyinde" },
      { c0: "Emlak ofisi", c2: "", c12: "", c13: "" },
    ],
  });

  assert(text.includes("Görükle Mahallesi"), "Mahalle metne gelmeli");
  assert(text.includes("Üniversite Caddesi ve yakın çevresinde"), "Cadde/sokak metne aks kelimesi olmadan gelmeli");
  assert(text.includes("toplam 4 adet emsal veri"), "Emsal sayisi girilmis tum emsal kayitlarindan hesaplanmali");
  assert(text.includes("500 metrelik etki yarıçapı (mikro-piyasa) içerisinde kalan emsal veriler değerlendirmeye dahil edilmiştir"), "Maksimum emsal uzakligi 100 metrelik ust basamaga yuvarlanarak metne gelmeli");
  assert(text.includes("%10 ile %25 aralığında"), "Pazarlama payi alt/ust araligi en yakin yuzde 5 bandina yuvarlanmali");
  assert(text.includes("yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler"), "Mulakat yerine gorusmeler ifadesi kullanilmali");
  assert(text.includes("olumlu yönde uyumlandırılarak"), "Optimize edilerek yerine daha dogal degerleme ifadesi kullanilmali");
  assert(text.includes("Yapılan düzeltmeler sonucunda"), "Optimizasyonlar yerine duzeltmeler ifadesi kullanilmali");
  assert(text.includes("karşılaştırma tablosunun işaret ettiği"), "Matris yerine karsilastirma tablosu ifadesi kullanilmali");
  assert(!/\baks[ıi]?\b/i.test(text), "Aks kelimesi metinden kaldirilmali");
  assert(!/mülakat/i.test(text), "Mulakat kelimesi metinden kaldirilmali");
  assert(!/optimizasyon|optimize/i.test(text), "Optimizasyon/optimize ifadeleri metinden kaldirilmali");
  assert(!/matris/i.test(text), "Matris kelimesi metinden kaldirilmali");
  assert(text.includes("indirgenmiş proje alanları üzerinden değerlendirmeye esas alınmıştır"), "Alan indirgeme cumlesi korunmali");
  assert(text.includes("36.000 TL/m² ile 44.000 TL/m² aralığında"), "Indirgenmis birim deger min/max araligi gelmeli");
  assert(text.includes("24.594 TL/m² olarak takdir edilmiştir"), "Takdir edilen birim fiyat degerleme bolumundeki yasal m2 birim degerinden gelmeli");

  const fallbackText = buildComparableMarketAnalysisText({
    fields: {
      titleNeighborhood: "Görükle",
      street: "Üniversite Caddesi",
    },
    rows: [
      { c2: "Satılık", c12: "110", c13: "100", c8: "-", c21: "10%", c9: "0", c22: "0%", c14: "3.800.000", c15: "3.600.000" },
      { c2: "Satılmış", c12: "126", c13: "100", c8: "-", c21: "5%", c9: "-", c22: "5%", c14: "4.000.000" },
      { c2: "Kiralık", c12: "95", c13: "95", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "3.420.000" },
    ],
  });
  assert(fallbackText.includes("39.867 TL/m² olarak takdir edilmiştir"), "Yasal m2 birim degeri yoksa emsal ortalamasi yedek olarak kullanilmali");

  const parallel = buildComparableMarketAnalysisText({
    fields: { neighborhood: "Nilüfer", street: "" },
    rows: [{ c2: "Satılık", c12: "112", c13: "100", c8: "0", c9: "0" }],
  });
  assert(parallel.includes("yaklaşık %10 aralığında"), "Tek pazarlama bandinda yaklasik ifadesi kullanilmali");
  assert(!parallel.includes("%10 ile %10 aralığında"), "Tek pazarlama bandinda ile/araliginda tekrari olmamali");
  assert(parallel.includes("paralel yönde uyumlandırılarak"), "Sifir duzeltmede paralel yon gelmeli");

  // --- Arsa/Tarla dali: TEKIL (isMultiUnit yok/false) - REGRESYON --------
  const landSingle = buildComparableMarketAnalysisText({
    fields: { ownershipType: "Arsa", titleNeighborhood: "Görükle", street: "Üniversite Caddesi", legalValueUnit: "1000" },
    rows: [
      { c2: "Satılık", c12: "500", c13: "500", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "500.000" },
      { c2: "Satılık", c12: "600", c13: "600", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "600.000" },
    ],
  });
  assert(landSingle.includes("Değerleme konusu taşınmazın konumlu olduğu"), "REGRESYON: Arsa TEKIL modda 'taşınmazın' (tekil) ifadesi kullanilmali.");
  assert(landSingle.includes("taşınmaz ile benzer imar koşullarına"), "REGRESYON: Arsa TEKIL modda 'taşınmaz ile' (tekil) ifadesi kullanilmali.");
  assert(!landSingle.includes("taşınmazların konumlu"), "REGRESYON: Arsa TEKIL modda cogul ifade OLMAMALI.");

  // --- Arsa/Tarla dali: COGUL (isMultiUnit true) - KULLANICI TALEBI ------
  const landMulti = buildComparableMarketAnalysisText({
    fields: { ownershipType: "Arsa", titleNeighborhood: "Görükle", street: "Üniversite Caddesi", legalValueUnit: "1000" },
    rows: [
      { c2: "Satılık", c12: "500", c13: "500", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "500.000" },
      { c2: "Satılık", c12: "600", c13: "600", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "600.000" },
    ],
    isMultiUnit: true,
  });
  assert(landMulti.includes("Değerleme konusu taşınmazların konumlu olduğu"), "KULLANICI TALEBI: Arsa COGUL modda 'taşınmazların' (cogul) ifadesi kullanilmali.");
  assert(landMulti.includes("taşınmazlar ile benzer imar koşullarına"), "KULLANICI TALEBI: Arsa COGUL modda 'taşınmazlar ile' (cogul) ifadesi kullanilmali.");
  assert(!landMulti.includes("taşınmazın konumlu"), "KULLANICI TALEBI: Arsa COGUL modda TEKIL ifade KALMAMALI.");
  assert(landMulti.includes("taşınmazların nihai birim değeri"), "KULLANICI TALEBI: Arsa COGUL modda p3 de cogul olmali.");

  // --- Tarla dali: COGUL - "tarla" landType kelimesi de korunmali --------
  const tarlaMulti = buildComparableMarketAnalysisText({
    fields: { ownershipType: "Tarla", titleNeighborhood: "Görükle", street: "" },
    rows: [
      { c2: "Satılık", c12: "1000", c13: "1000", c8: "0", c21: "0%", c9: "0", c22: "0%", c14: "1.000.000" },
    ],
    isMultiUnit: true,
  });
  assert(tarlaMulti.includes("adet tarla emsali"), "Tarla dalinda 'tarla' landType kelimesi cogul modda da korunmali.");
  assert(tarlaMulti.includes("taşınmazların konumlu"), "Tarla COGUL modda da cogul ifade kullanilmali.");

  // --- Genel (Konut/İşyeri, Arsa/Tarla DIŞI) dal: TEKIL - REGRESYON -------
  // Kullanici bildirimi (2026-08-20): "emsaller bolumunce emsal metni coklu
  // raporlarda tekli rapor gibi davraniyor" - netlestirme sonrasi Kat
  // Irtifaki/Mustakil Bina icin de COGUL destegi eklendi. Bu senaryo
  // isMultiUnit=false (varsayilan) iken davranisin DEGISMEDIGINI kanitlar.
  const generalSingle = buildComparableMarketAnalysisText({
    fields: { ownershipType: "Yatay Kat İrtifakı", titleNeighborhood: "Görükle", street: "Üniversite Caddesi", legalValueUnit: "24594" },
    rows: [
      { c2: "Satılık", c12: "110", c13: "100", c8: "-", c21: "10%", c9: "0", c22: "0%", c14: "3.800.000" },
      { c2: "Satılık", c12: "126", c13: "100", c8: "-", c21: "5%", c9: "-", c22: "5%", c14: "4.000.000" },
    ],
  });
  assert(generalSingle.includes("Değerleme konusu taşınmazın konumlu olduğu"), "REGRESYON: Genel dal TEKIL modda 'taşınmazın' (tekil) ifadesi kullanilmali.");
  assert(generalSingle.includes("taşınmaz ile benzer imar koşullarına"), "REGRESYON: Genel dal TEKIL modda 'taşınmaz ile' (tekil) ifadesi kullanilmali.");
  assert(generalSingle.includes("konu taşınmazın nihai birim değer takdirinde"), "REGRESYON: Genel dal TEKIL modda p2'de 'taşınmazın' (tekil) ifadesi kullanilmali.");
  assert(generalSingle.includes("taşınmazın nihai birim değeri"), "REGRESYON: Genel dal TEKIL modda p3'te 'taşınmazın' (tekil) ifadesi kullanilmali.");
  assert(!generalSingle.includes("taşınmazların konumlu"), "REGRESYON: Genel dal TEKIL modda cogul ifade OLMAMALI.");

  // --- Genel (Konut/İşyeri) dal: COGUL (isMultiUnit true) - KULLANICI TALEBI
  // (2026-08-20, genisletme): "taşınmaz yerine taşınmazlar demeli ... coklu
  // talebe uygun paragraf olmalı" - netlestirme sorusuyla Kat Irtifaki/
  // Mustakil Bina icin de onaylandi.
  const generalMulti = buildComparableMarketAnalysisText({
    fields: { ownershipType: "Yatay Kat İrtifakı", titleNeighborhood: "Görükle", street: "Üniversite Caddesi", legalValueUnit: "24594" },
    rows: [
      { c2: "Satılık", c12: "110", c13: "100", c8: "-", c21: "10%", c9: "0", c22: "0%", c14: "3.800.000" },
      { c2: "Satılık", c12: "126", c13: "100", c8: "-", c21: "5%", c9: "-", c22: "5%", c14: "4.000.000" },
    ],
    isMultiUnit: true,
  });
  assert(generalMulti.includes("Değerleme konusu taşınmazların konumlu olduğu"), "KULLANICI TALEBI: Genel dal COGUL modda 'taşınmazların' (cogul) ifadesi kullanilmali.");
  assert(generalMulti.includes("taşınmazlar ile benzer imar koşullarına"), "KULLANICI TALEBI: Genel dal COGUL modda 'taşınmazlar ile' (cogul) ifadesi kullanilmali.");
  assert(generalMulti.includes("konu taşınmazların nihai birim değer takdirinde"), "KULLANICI TALEBI: Genel dal COGUL modda p2 de cogul olmali.");
  assert(generalMulti.includes("taşınmazların nihai birim değeri"), "KULLANICI TALEBI: Genel dal COGUL modda p3 de cogul olmali (emsallerin konu taşınmazlara indirgenmiş).");
  assert(generalMulti.includes("emsallerin konu taşınmazlara indirgenmiş"), "KULLANICI TALEBI: Genel dal COGUL modda p3'un ilk cumlesinde 'taşınmazlara' (cogul, -e hali) kullanilmali.");
  assert(!generalMulti.includes("taşınmazın konumlu"), "KULLANICI TALEBI: Genel dal COGUL modda TEKIL ifade KALMAMALI.");

  console.log("Emsal piyasa analizi testi tamam.");
}

main();
