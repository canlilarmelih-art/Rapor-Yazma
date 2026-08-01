"use strict";

/*
  Kullanici talebi: "Emsaller bölümünde Telefon numarası 05321111212 yada
  0 (532) 111 12 12 yada 5321111212 olarak girilebiliyor... bazı bankalar
  sadece 10 karakter girişine izin veriyor... İş Bankası ve Kuveyt Türk
  şimdilik" — kullanıcı emsal matrisine telefon numarasını serbest formatta
  (boşluk/parantez/tire/başında 0 ile, en fazla 17 karakter) girebilir;
  rapora basılırken sadece İş Bankası ve Kuveyt Türk raporlarında bu değer
  otomatik 10 haneli formata (başında 0 olmadan, sadece rakam) normalize
  edilir. Diğer bankalarda ham değer DEĞİŞMEDEN kalır.

  Bu test üç katmanı izole doğrular:
  1) normalizeComparablePhoneForBank — saf fonksiyon, tüm giriş formatlarını
     10 haneye indirger (başında 0 varsa/+90 varsa temizler).
  2) shouldNormalizeComparablePhoneForBank — banka adı kontrolü (İş Bankası
     ve Kuveyt Türk dahil, diğer bankalar hariç).
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
const shouldNormalizeSrc = sliceFn("function shouldNormalizeComparablePhoneForBank(");
const normalizeSrc = sliceFn("function normalizeComparablePhoneForBank(");
const formatForOutputSrc = sliceFn("function formatComparablePhoneForOutput(");
const buildContactLineSrc = sliceFn("function buildComparableContactLine(");

function createContext(bank) {
  const context = { state: { fields: { bank } } };
  vm.createContext(context);
  vm.runInContext(foldTurkishSrc, context);
  vm.runInContext(shouldNormalizeSrc, context);
  vm.runInContext(normalizeSrc, context);
  vm.runInContext(formatForOutputSrc, context);
  vm.runInContext(buildContactLineSrc, context);
  return context;
}

// --- 1) normalizeComparablePhoneForBank — saf fonksiyon, tüm formatlar ---
{
  const context = createContext("");
  const cases = [
    ["05321111212", "5321111212"],
    ["0 (532) 111 12 12", "5321111212"],
    ["5321111212", "5321111212"],
    ["0 224 254 65 86", "2242546586"],
    ["+90 532 111 12 12", "5321111212"],
    ["90 532 111 12 12", "5321111212"],
    ["", ""],
  ];
  cases.forEach(([input, expected]) => {
    const result = context.normalizeComparablePhoneForBank(input);
    assert.equal(result, expected, `"${input}" -> "${expected}" olmalı, gelen: "${result}"`);
  });
}

// --- 2) shouldNormalizeComparablePhoneForBank — banka kontrolü -----------
{
  assert.equal(createContext("Türkiye İş Bankası A.Ş.").shouldNormalizeComparablePhoneForBank(), true, "İş Bankası dahil olmalı.");
  assert.equal(createContext("Kuveyt Türk Katılım Bankası A.Ş.").shouldNormalizeComparablePhoneForBank(), true, "Kuveyt Türk dahil olmalı.");
  assert.equal(createContext("T.C. Ziraat Bankası A.Ş.").shouldNormalizeComparablePhoneForBank(), false, "Ziraat Bankası HARİÇ tutulmalı (kullanıcı: 'şimdilik' sadece bu iki banka).");
  assert.equal(createContext("Türkiye Halk Bankası A.Ş.").shouldNormalizeComparablePhoneForBank(), false, "Halkbank HARİÇ tutulmalı.");
  assert.equal(createContext("").shouldNormalizeComparablePhoneForBank(), false, "Banka seçilmemişken normalize edilmemeli.");
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
