"use strict";

/*
  Kullanici talebi: Degerleme Ozet Tablosu'nda "Yasal Acil Satış Değeri" ve
  "Mevcut Acil Satış Değeri" satirlarinin "Birim Değer / Oran" hucresi sabit
  bir aciklama cumlesi gosteriyordu ("Yasal durum değerinden %10 indirim,
  50.000 TL yuvarlama") — digger satirlar (Yasal Durum Değeri, Arsa Değeri
  vb.) gibi GERCEK hesaplama detayini (kaynak deger x oran) GOSTERMIYORDU.
  Kullanici bunu "yanlis hesaplaniyor" olarak bildirdi; asil sorun deger
  yanlisligi degil, detay hucresinin gercek sayilari yansitmamasiydi.

  buildValuationSummaryUrgentSaleDetail() gercek app.js kaynagindan izole
  calistirilir; formatSchemeNumber (Turkce sayi bicimleme) ve
  parseValuationNumber (metinden sayiya cevirme) gercek kaynaktan alinir.
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

const parseValuationNumberSrc = sliceFn("function parseValuationNumber(");
const formatSchemeNumberSrc = sliceFn("function formatSchemeNumber(");
const buildValuationSummaryUrgentSaleDetailSrc = sliceFn("function buildValuationSummaryUrgentSaleDetail(");

function run(fields) {
  const context = { state: { fields } };
  vm.createContext(context);
  vm.runInContext(parseValuationNumberSrc, context);
  vm.runInContext(formatSchemeNumberSrc, context);
  vm.runInContext(buildValuationSummaryUrgentSaleDetailSrc, context);
  return context.buildValuationSummaryUrgentSaleDetail("legalValue");
}

// 1) Gercek kaynak deger ve oran gosterilmeli — sabit aciklama cumlesi ARTIK kullanilmamali.
{
  const detail = run({ legalValue: "6.000.000" });
  assert.equal(detail, "6.000.000 TL × %90", `Detay gercek hesaplamayi gostermeli: "${detail}"`);
  assert.doesNotMatch(detail, /indirim|yuvarlama/i, "Sabit aciklama cumlesi artik kullanilmamali (kullanici sikayeti).");
}

// 2) Farkli bir kaynak deger de doğru bicimlenmeli (Turkce binlik ayirici).
{
  const detail = run({ legalValue: "12.345.678" });
  assert.equal(detail, "12.345.678 TL × %90", `Buyuk sayi dogru bicimlenmeli: "${detail}"`);
}

// 3) Kaynak deger yoksa/sifirsa "—" donmeli (bos/gecersiz veriyle cokmemeli).
{
  assert.equal(run({ legalValue: "" }), "—", "Bos kaynak deger icin tire donmeli.");
  assert.equal(run({ legalValue: "0" }), "—", "Sifir kaynak deger icin tire donmeli.");
}

console.log("Acil Satis Degeri ozet detayi testi tamam.");
