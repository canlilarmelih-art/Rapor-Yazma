"use strict";

// Kullanıcı bildirimi (2026-09-14): "Bağımsız bölüm özellikleri dekoratif
// açıklama çoklu raporlarda dekoratif açıklama '...dukkan hacimlerinde
// zeminler seramik kaplı... açık ofis alanı, ofis ve yönetici odalarında
// zeminler laminant parke kaplı... wc hacimlerinde zeminler seramik
// kaplı...' bu şekilde geliyor türkçe dil kurallarına uygun olmayan
// büyük küçük harf olayları var. ayrıca dekoratif açıklamada ilk başta
// zemin ve duvar açıklamaları yer almalı."
//
// İki ayrı kök neden:
//
//  1) buildMultiUnitInteriorDescriptionText()'in nihai dekoratif metni
//     (decorativeText) HİÇ normalizeReportDescriptionText() ile
//     sarılmıyordu — tek taşınmazlı composeUnitDecorativeDescription()
//     ZATEN sarıyordu (cümle-başı büyük harf + "wc"->"WC" gibi sabit
//     kelime düzeltmeleri için), ama ÇOKLU taşınmazlı sürüm joinNonEmptySentences()
//     ile DÜZ birleştirip dönüyordu. getDynamicDecorativeAreaPrefix()
//     (işyeri alan önekleri: "Dükkan"/"Açık ofis alanı"/"WC" vb.) mid-
//     sentence kullanım için TASARIM GEREĞİ küçük harfle üretir — normal
//     durumda paragrafın BAŞINDA olmadıkları için sorun değildi, ama bu
//     işyeri raporunda mainRoom/wetArea/outdoor/bathroomFixture hepsi boş
//     olduğundan dynamicArea cümlesi PARAGRAFIN İLK cümlesi oluyordu ve
//     hiçbir yerde cümle-başı büyütme uygulanmıyordu.
//  2) getDynamicDecorativeAreaPrefix() etiketin TAMAMINI (WC dahil)
//     küçük harfe çeviriyordu — "WC" bir kısaltma/akronim olduğundan
//     konumdan BAĞIMSIZ olarak HER ZAMAN büyük kalmalı ("wc hacimlerinde"
//     DEĞİL "WC hacimlerinde").
//  3) (Sıralama) dynamicArea:* (işyeri alan) cümleleri buildMultiUnitInteriorDescriptionText()'te
//     HER ZAMAN paragrafın EN SONUNA ekleniyordu (doorsWindows/bathroomFixture/
//     kitchen/materialQuality/view/heating/constructionLevel'DAN SONRA);
//     doorsWindows İSE mainRoom'un HEMEN ardından (wetArea/outdoorCombined'DAN
//     BİLE ÖNCE) geliyordu. Kullanıcı: zemin/duvar (floor/wall) tipi TÜM
//     cümleler (mainRoom+wetArea+outdoor+dynamicAreas) paragrafın EN
//     BAŞINDA, TEK BLOKTA olmalı.
//
// Düzeltme: (1) preserveReportSpecialWords()'e ["wc","WC"] eklendi —
// akronim artık konumdan bağımsız HER ZAMAN büyük. (2) buildMultiUnitInteriorDescriptionText()'in
// nihai decorativeText'i artık normalizeReportDescriptionText() ile
// sarılıyor (tek taşınmazlı sürümle TUTARLI) — cümle-başı büyütme genel
// olarak çalışır, HANGİ slot ilk sıradaysa onu büyütür (dynamicArea'ya
// ÖZEL bir düzeltme DEĞİL, genel mekanizma). (3) wetArea/outdoorCombined/
// dynamicArea:* artık doorsWindows'tan ÖNCE emitleniyor (kaynak-düzeyi
// kanıt: tools/test-multi-unit-interior-description.js senaryo 8c).
//
// Bu dosya SADECE (1)+(2)'yi (metin normalizasyon zincirini, GERÇEK
// fonksiyonlarla) test eder — sıralama zaten test-multi-unit-interior-description.js'te
// kaynak-düzeyinde kilitlendi.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

// normalizeReportDescriptionText()'in TÜM GERÇEK bağımlılık zinciri —
// hepsi kendi içinde kapalı (başka fonksiyona bağımlı DEĞİL, foldTurkish/
// toTitleCaseTr HARİÇ, onlar da kapalı).
const functionNames = [
  "normalizeReportDescriptionText",
  "normalizeReportWhitespace",
  "normalizeReportSentenceLine",
  "shouldLowercaseReportLine",
  "normalizeReportProperPhrases",
  "preserveReportSpecialWords",
  "escapeRegExp",
  "normalizeReportNumberFormats",
  "foldTurkish",
  "toTitleCaseTr",
];

function makeContext() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(functionNames.map(extractFunction).join("\n"), context);
  return context;
}

// --- 1) "wc" -> "WC" HER ZAMAN (konumdan bağımsız, akronim) --------------
{
  const context = makeContext();
  assert.equal(
    context.normalizeReportDescriptionText("wc hacimlerinde zeminler seramik kaplı, duvarlar ise fayans kaplıdır."),
    "WC hacimlerinde zeminler seramik kaplı, duvarlar ise fayans kaplıdır.",
    "'wc' cümle başında bile olsa 'WC' (akronim, büyük) olmalı — salt cümle-başı büyütme ('Wc') YETERSİZ."
  );
  assert.equal(
    context.normalizeReportDescriptionText("Taşınmazların dış kapıları camlı alüminyumdur. wc hacimlerinde zeminler seramik kaplıdır."),
    "Taşınmazların dış kapıları camlı alüminyumdur. WC hacimlerinde zeminler seramik kaplıdır.",
    "'wc' cümle ORTASINDA (2. cümlenin başında) da 'WC' olmalı."
  );
  console.log("preserveReportSpecialWords(): 'wc'->'WC' konumdan bağımsız testi tamam.");
}

// --- 2) KULLANICI ÖRNEĞİ (BİREBİR): dynamicArea cümleleri paragrafın ------
// İLK cümlesi olduğunda cümle-başı büyük harf + "wc" akronim DÜZELTMESİ
// birlikte doğru çalışıyor mu (getDynamicDecorativeAreaPrefix()'in ÜRETTİĞİ
// GERÇEK küçük-harfli önek biçimiyle, ör. "dükkan hacimlerinde"/"açık
// ofis alanı, ofis ve yönetici odalarında"/"wc hacimlerinde").
{
  const context = makeContext();
  const rawDecorativeText = "dükkan hacimlerinde zeminler seramik kaplı, duvarlar ise alçı sıva üzeri saten boyalıdır. "
    + "açık ofis alanı, ofis ve yönetici odalarında zeminler laminant parke kaplı, duvarlar ise alçı sıva üzeri saten boyalıdır. "
    + "wc hacimlerinde zeminler seramik kaplı, duvarlar ise fayans kaplıdır.";
  const normalized = context.normalizeReportDescriptionText(rawDecorativeText);
  assert.equal(
    normalized,
    "Dükkan hacimlerinde zeminler seramik kaplı, duvarlar ise alçı sıva üzeri saten boyalıdır. "
      + "Açık ofis alanı, ofis ve yönetici odalarında zeminler laminant parke kaplı, duvarlar ise alçı sıva üzeri saten boyalıdır. "
      + "WC hacimlerinde zeminler seramik kaplı, duvarlar ise fayans kaplıdır.",
    "Kullanıcının ekran görüntüsündeki 3 cümlenin tamamı doğru büyük/küçük harfle normalize edilmeli."
  );
  console.log("KULLANICI ÖRNEĞİ (Dükkan/Açık ofis alanı/WC 3 cümle): normalizeReportDescriptionText() büyük/küçük harf testi tamam.");
}

// --- 3) Regresyon: zaten doğru olan diğer sabit kelimeler etkilenmedi ----
{
  const context = makeContext();
  assert.equal(context.normalizeReportDescriptionText("takbis kaydı incelenmiştir."), "TAKBİS kaydı incelenmiştir.");
  assert.equal(context.normalizeReportDescriptionText("uavt kodu doğrulanmıştır."), "UAVT kodu doğrulanmıştır.");
  console.log("preserveReportSpecialWords(): diğer sabit kelimeler (TAKBİS/UAVT) regresyon testi tamam.");
}

console.log("Coklu tasinmaz dekoratif aciklama siralama+buyuk-kucuk harf testleri basarili.");
