"use strict";

// Kullanıcı bulgusu (2026-09-01, gerçek bir çok-parselli TAKBİS raporunun
// indirilen Excel'inde): "takbis kayıtlarında ipotek olmamasına rağmen
// ipotek sütunu açmış" — incelemede, "İpotekler" tablosunda üç satır
// bulundu; her biri gerçekte "İcrai Haciz" (yani bir ŞERH kaydı) olup,
// tutarı yanlışlıkla yevmiye numarasıyla ("3.699 TL" ~ yevmiye "3699"),
// lehdarı ise "Haciz Yazısı Sayılı Yazıları İle" gibi bir açıklama
// PARÇASIYLA doldurulmuştu.
//
// KÖK NEDEN: PDF'te bir haciz kaydının UZUN açıklaması birden fazla
// fiziksel satıra sarıyor. getTakbisEncumbranceStartType() BİLEREK bu tür
// sarma satırlarındaki ("Haciz Yazısı...") metni "Rehin" tipi olarak
// algılar (bkz. o fonksiyonun yorumu) — ve isTakbisSbiStartType() bu SAHTE
// tipin bir kaydı YARIDAN BÖLMESİNİ önlemek için tasarlanmıştı. AMA
// shouldStartNewTakbisEncumbranceScope()'taki hasCompleteTakbisEncumbranceDateInfo
// KISAYOLU bu korumadan ÖNCE çalışıyordu — bir haciz kaydının tarih/yevmiyesi
// genellikle satırın İLK bölümünde (Tesis Kurum Tarih-Yevmiye sütununda)
// hemen tamamlandığından, bu kısayol neredeyse HER ZAMAN erken devreye
// girip korumayı BAYPAS ediyor, kaydı ortasından bölüp ikinci yarısını
// (garbled açıklama + YANLIŞ tarih/yevmiye ile) sahte bir "Rehin" kaydı
// (-> encumbranceMortgages, "İpotekler" tablosu) olarak açıyordu.
//
// DÜZELTME: isTakbisSbiStartType() koruması artık hasCompleteTakbisEncumbranceDateInfo
// kısayolundan ÖNCE, "serh" bölümünde (sectionKey === "serh") çalışıyor —
// bir haciz-sarma satırı ARTIK asla yeni bir kayıt AÇMIYOR, mevcut Şerh
// kaydının açıklamasına devam ediyor. Bu koruma YALNIZCA "serh" bölümüne
// özgü — gerçek "REHİN"/"İPOTEK BİLGİLERİ" bölümlerinde (sectionKey
// "rehin"/"ipotek") Rehin/İpotek tipleri HÂLÂ gerçek kayıt başlangıçlarıdır.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    if (appSource[cursor] === "(") parenDepth += 1;
    if (appSource[cursor] === ")") {
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

const functionNames = [
  "foldTurkish",
  "normalizeSlash",
  "cleanTakbisValue",
  "cleanTakbisEncumbranceText",
  "parseTakbisSmartNumber",
  "extractTakbisEncumbranceDateInfo",
  "sanitizeTakbisEncumbranceDateFallbackText",
  "normalizeTakbisEncumbranceType",
  "getTakbisEncumbranceStartType",
  "isTakbisSbiStartType",
  "hasCompleteTakbisEncumbranceDateInfo",
  "getTakbisEncumbranceScopeDescription",
  "shouldStartNewTakbisEncumbranceScope",
  "buildTakbisEncumbranceScopes",
  "getEncumbranceReportTableKey",
];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) getTakbisEncumbranceStartType(): "Haciz Yazısı..." sarma metni ----
// gerçekten "Rehin" tipi üretiyor mu (BİLİNEN, kasıtlı davranış — bkz.
// app.js yorumu) — bu davranışın KENDİSİ DEĞİŞMEDİ, sorun bu tipin bir
// kaydı BÖLMESİYDİ.
{
  const type = fns.getTakbisEncumbranceStartType("Haciz Yazısı Sayılı Yazıları İle");
  assert.equal(type, "Rehin", `"Haciz Yazısı..." sarma metni Rehin tipi üretmeli (bilinen davranış), bulunan: ${type}`);
  assert.equal(fns.isTakbisSbiStartType(type), false, "Rehin tipi gerçek bir Ş/B/İ kayıt-başlangıcı SAYILMAMALI.");
  console.log("getTakbisEncumbranceStartType/isTakbisSbiStartType temel davranış testi tamam.");
}

// --- 2) REGRESYON: haciz kaydının tarih/yevmiyesi ERKEN tamamlanmış olsa --
// bile (hasCompleteTakbisEncumbranceDateInfo true dönse bile), "serh"
// bölümünde bir "Rehin" sarma-tipi kaydı ASLA bölmemeli.
{
  const firstEntry = {
    row: { y: 100 },
    type: "Şerh",
    cells: {
      type: "Serh",
      description: "İcrai Haciz : KIRIKKALE İCRA DAİRESİ nin 27/12/2021 tarih 2021/2167 ESAS sayılı",
      dateJournal: "Bahşili - 27-12-2021 13:34 - 3694",
      restrictedOwner: "BAHŞILI BELEDİYESİ VKN",
    },
  };
  // Bu, kullanıcının PDF'inde tam olarak görülen sarma satırı: haciz
  // açıklamasının devamı, ama sütun kayması yüzünden "type" alanı
  // "Haciz Yazısı..." metnini yakalayıp Rehin'e normalize edilmiş.
  const wrappedEntry = {
    row: { y: 112 },
    type: fns.getTakbisEncumbranceStartType("Haciz Yazısı Sayılı Yazıları İle"),
    cells: {
      type: "Haciz Yazısı Sayılı Yazıları İle",
      description: "37995.32 TL bedel ile Alacaklı : Musa UĞUR lehine haciz işlenmiştir.",
      dateJournal: "",
      restrictedOwner: "",
    },
  };
  assert.equal(wrappedEntry.type, "Rehin", "Test kurulumu: sarma satırı Rehin tipi üretmeli.");
  // hasCompleteTakbisEncumbranceDateInfo KISAYOLUNUN erken devreye girdiğini
  // doğrula (bu, düzeltmeden ÖNCEki asıl BAYPAS mekanizmasıydı).
  assert.equal(fns.hasCompleteTakbisEncumbranceDateInfo([firstEntry]), true, "Test kurulumu: ilk satırda tarih/yevmiye TAMAMLANMIŞ olmalı (BAYPAS senaryosu).");

  const scopes = fns.buildTakbisEncumbranceScopes([firstEntry, wrappedEntry], "serh");
  assert.equal(scopes.length, 1, `Sarma satırı (Rehin tipi) kaydı BÖLMEMELİ - TEK kapsam (scope) beklenir, bulunan: ${scopes.length}`);
  assert.equal(scopes[0].type, "Şerh", `Birleşik kaydın tipi Şerh (İLK satırdan) kalmalı, bulunan: ${scopes[0].type}`);
  assert.equal(scopes[0].entries.length, 2, "Her iki satır da AYNI kapsamda (scope) birleşmeli.");
  console.log("Haciz sarma satırının (hasCompleteTakbisEncumbranceDateInfo ERKEN tamamlanmış olsa bile) kaydı BOLMEMESİ REGRESYON testi tamam.");
}

// --- 3) getEncumbranceReportTableKey(): düzeltmeden sonra bu haciz kaydı --
// artık "encumbranceAnnotations" (Şerhler) tablosuna gitmeli, ASLA
// "encumbranceMortgages" (İpotekler) tablosuna DEĞİL.
{
  const mergedRecordLikeType = "Şerh"; // buildTakbisEncumbranceScopes'un ürettiği DÜZELTİLMİŞ tip
  const tableKey = fns.getEncumbranceReportTableKey({ type: mergedRecordLikeType });
  assert.equal(tableKey, "encumbranceAnnotations", `Düzeltilmiş haciz kaydı Şerhler (encumbranceAnnotations) tablosuna gitmeli, bulunan: ${tableKey}`);
  // Eski (yanlış) davranışın simülasyonu: eğer kayıt yanlışlıkla "Rehin"
  // tipiyle kalsaydı ne olurdu (REGRESYON kanıtı, KASITLI olarak eski
  // hatayı da doğruluyoruz - boylece testin GERCEKTEN anlamli oldugundan
  // emin oluyoruz).
  assert.equal(fns.getEncumbranceReportTableKey({ type: "Rehin" }), "encumbranceMortgages", "Sanity: 'Rehin' tipi hâlâ encumbranceMortgages'e eşlenir (bu eşleme KENDİSİ doğru - sorun kaydın YANLIŞLIKLA bu tipi almasıydı).");
  console.log("getEncumbranceReportTableKey() duzeltilmis Serh kaydinin dogru tabloya gitmesi testi tamam.");
}

// --- 4) Gerçek "REHİN"/"İPOTEK BİLGİLERİ" bölümlerinde davranış DEĞİŞMEDİ -
// bu bölümlerde Rehin/İpotek tipleri HÂLÂ gerçek kayıt başlangıçlarıdır.
{
  const firstMortgage = {
    row: { y: 100 },
    type: "İpotek",
    cells: { type: "Ipotek", description: "Nurol Yatırım Bankası", dateJournal: "29.05.2025 28866", restrictedOwner: "" },
  };
  const secondMortgage = {
    row: { y: 250 },
    type: "İpotek",
    cells: { type: "Ipotek", description: "Başka Bir Banka", dateJournal: "01.06.2025 99999", restrictedOwner: "" },
  };
  const scopes = fns.buildTakbisEncumbranceScopes([firstMortgage, secondMortgage], "ipotek");
  assert.equal(scopes.length, 2, `Gerçek İPOTEK BİLGİLERİ bölümünde 2 ayrı İpotek kaydı AYRI kalmalı (düzeltme bu senaryoyu ETKİLEMEMELİ), bulunan: ${scopes.length}`);
  console.log("Gercek REHIN/IPOTEK bolumlerinde davranisin DEGISMEMESI REGRESYON testi tamam.");
}

console.log("TAKBİS Haciz/Rehin yanlis siniflandirma duzeltmesi testleri basarili.");
