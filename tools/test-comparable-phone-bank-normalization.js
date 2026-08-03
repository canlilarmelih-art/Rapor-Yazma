"use strict";

/*
  Kullanici talebi (ilk surum): "Emsaller bölümünde Telefon numarası
  05321111212 yada 0 (532) 111 12 12 yada 5321111212 olarak girilebiliyor...
  bazı bankalar sadece 10 karakter girişine izin veriyor... İş Bankası ve
  Kuveyt Türk şimdilik" — kullanıcı emsal matrisine telefon numarasını
  serbest formatta (boşluk/parantez/tire/başında 0 ile, en fazla 17 karakter)
  girebilir; rapora basılırken İş Bankası ve Kuveyt Türk raporlarında bu
  değer otomatik 10 haneli formata (başında 0 OLMADAN, sadece rakam)
  normalize edilir.

  İkinci talep: "05358474084 kullanıcı emsal telefon numarasına ne şekilde
  yazarsa yazsın halkbank emsal telefon numarası 11 haneli olarak arada
  boşluk yada parantez olmadan çıkmalı" — Halkbank raporlarında ise aynı
  serbest girdi 11 haneli formata (başında 0 İLE, sadece rakam) normalize
  edilir. Diğer bankalarda ham değer DEĞİŞMEDEN kalır.

  Bu test üç katmanı izole doğrular:
  1) normalizeComparablePhoneForBank — saf fonksiyon, tüm giriş formatlarını
     hedef hane sayısına (10 veya 11) indirger/tamamlar (başında 0 varsa/+90
     varsa temizler, 11 hedefinde eksikse 0 ekler).
  2) getComparablePhoneNormalizationDigitsForBank — banka adı kontrolü
     (İş Bankası ve Kuveyt Türk -> 10, Halkbank -> 11, diğerleri -> 0/kapalı).
  3) buildComparableContactLine — gerçek entegrasyon: seçili bankaya göre
     normalize edilmiş/ham telefon numarasını "(İrtibat Kişisi ve Telefon
     No: ...)" cümlesine doğru şekilde yerleştirir.

  buildComparableMatrixWordTableHtml (Word/{{EMSAL_DEGERLEME_TABLOSU}}
  tablosundaki Telefon satırı) da aynı formatComparablePhoneForOutput
  fonksiyonunu kullanır (bkz. app.js field.key === "c1" özel durumu); bu
  fonksiyon burada zaten izole test edildiğinden, DOM'a bağımlı o tabloyu
  ayrıca test etmeye gerek yok.
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

const foldTurkishSrc = sliceFn("function foldTurkish(");
const isHalkbankSelectedSrc = sliceFn("function isHalkbankSelectedForReport(");
const digitsForBankSrc = sliceFn("function getComparablePhoneNormalizationDigitsForBank(");
const normalizeSrc = sliceFn("function normalizeComparablePhoneForBank(");
const formatForOutputSrc = sliceFn("function formatComparablePhoneForOutput(");
const buildContactLineSrc = sliceFn("function buildComparableContactLine(");

function createContext(bank) {
  const context = { state: { fields: { bank } } };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(isHalkbankSelectedSrc, context);
  vm.runInContext(digitsForBankSrc, context);
  vm.runInContext(normalizeSrc, context);
  vm.runInContext(formatForOutputSrc, context);
  vm.runInContext(buildContactLineSrc, context);
  return context;
}

// --- 1) normalizeComparablePhoneForBank — saf fonksiyon, tüm formatlar ---
{
  const context = createContext("");
  const tenDigitCases = [
    ["05321111212", "5321111212"],
    ["0 (532) 111 12 12", "5321111212"],
    ["5321111212", "5321111212"],
    ["0 224 254 65 86", "2242546586"],
    ["+90 532 111 12 12", "5321111212"],
    ["90 532 111 12 12", "5321111212"],
    ["", ""],
  ];
  tenDigitCases.forEach(([input, expected]) => {
    const result = context.normalizeComparablePhoneForBank(input, 10);
    assert.equal(result, expected, `(10 hane) "${input}" -> "${expected}" olmalı, gelen: "${result}"`);
  });

  const elevenDigitCases = [
    ["05358474084", "05358474084"],
    ["0 (535) 847 40 84", "05358474084"],
    ["5358474084", "05358474084"],
    ["+90 535 847 40 84", "05358474084"],
    ["90 535 847 40 84", "05358474084"],
    ["", ""],
  ];
  elevenDigitCases.forEach(([input, expected]) => {
    const result = context.normalizeComparablePhoneForBank(input, 11);
    assert.equal(result, expected, `(11 hane) "${input}" -> "${expected}" olmalı, gelen: "${result}"`);
  });
}

// --- 2) getComparablePhoneNormalizationDigitsForBank — banka kontrolü ----
{
  assert.equal(createContext("Türkiye İş Bankası A.Ş.").getComparablePhoneNormalizationDigitsForBank(), 10, "İş Bankası 10 hane olmalı.");
  assert.equal(createContext("Kuveyt Türk Katılım Bankası A.Ş.").getComparablePhoneNormalizationDigitsForBank(), 10, "Kuveyt Türk 10 hane olmalı.");
  assert.equal(createContext("Türkiye Halk Bankası A.Ş.").getComparablePhoneNormalizationDigitsForBank(), 11, "Halkbank 11 hane olmalı.");
  assert.equal(createContext("T.C. Ziraat Bankası A.Ş.").getComparablePhoneNormalizationDigitsForBank(), 0, "Ziraat Bankası HARİÇ tutulmalı (kullanıcı: 'şimdilik' sadece İş Bankası/Kuveyt Türk/Halkbank).");
  assert.equal(createContext("").getComparablePhoneNormalizationDigitsForBank(), 0, "Banka seçilmemişken normalize edilmemeli.");
}

// --- 3) buildComparableContactLine — entegrasyon --------------------------
{
  const row = { c0: "Ahmet Yılmaz", c1: "0 (532) 111 12 12" };

  const isbank = createContext("Türkiye İş Bankası A.Ş.").buildComparableContactLine(row);
  assert.equal(
    isbank,
    "(İrtibat Kişisi ve Telefon No: Ahmet Yılmaz / 5321111212)",
    `İş Bankası'nda telefon 10 haneye normalize edilmeli: "${isbank}"`
  );

  const kuveytTurk = createContext("Kuveyt Türk Katılım Bankası A.Ş.").buildComparableContactLine(row);
  assert.equal(
    kuveytTurk,
    "(İrtibat Kişisi ve Telefon No: Ahmet Yılmaz / 5321111212)",
    `Kuveyt Türk'te telefon 10 haneye normalize edilmeli: "${kuveytTurk}"`
  );

  const halkbankRow = { c0: "Ahmet Yılmaz", c1: "0 (535) 847 40 84" };
  const halkbank = createContext("Türkiye Halk Bankası A.Ş.").buildComparableContactLine(halkbankRow);
  assert.equal(
    halkbank,
    "(İrtibat Kişisi ve Telefon No: Ahmet Yılmaz / 05358474084)",
    `Halkbank'ta telefon 11 haneye (başında 0 ile) normalize edilmeli: "${halkbank}"`
  );
  const halkbankNoLeadingZero = createContext("Türkiye Halk Bankası A.Ş.").buildComparableContactLine({
    c0: "Ahmet Yılmaz",
    c1: "5358474084",
  });
  assert.equal(
    halkbankNoLeadingZero,
    "(İrtibat Kişisi ve Telefon No: Ahmet Yılmaz / 05358474084)",
    `Halkbank'ta başında 0 olmadan girilen numaraya da 0 eklenmeli: "${halkbankNoLeadingZero}"`
  );

  const other = createContext("T.C. Ziraat Bankası A.Ş.").buildComparableContactLine(row);
  assert.equal(
    other,
    "(İrtibat Kişisi ve Telefon No: Ahmet Yılmaz / 0 (532) 111 12 12)",
    `Diğer bankalarda telefon HAM haliyle kalmalı (değiştirilmemeli): "${other}"`
  );

  const empty = createContext("Türkiye İş Bankası A.Ş.").buildComparableContactLine({ c0: "", c1: "" });
  assert.equal(empty, "(İrtibat Kişisi ve Telefon No: -)", `İkisi de boşken "-" gösterilmeli: "${empty}"`);
}

console.log("Emsal telefon numarasi banka bazli normalizasyon testi tamam.");
