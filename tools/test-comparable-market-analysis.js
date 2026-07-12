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

  console.log("Emsal piyasa analizi testi tamam.");
}

main();
