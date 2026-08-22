"use strict";

// Kullanıcı talebi (2026-08-22): "mülkiyet seçme kısmını talep açma
// kısmına taşı böylece kullanıcı mecburen seçmek zorunda kalsın talep
// açma kısmından yasal kullanım niteliğini kaldır" — "Talep Açma" =
// cloud/report-library.js'teki "+ Yeni Talep Oluştur" hızlı formu
// (buildQuickFormHtml). Bu form artık:
//   (1) Mülkiyet'i (ownershipType) İÇERİYOR ve ZORUNLU kılıyor,
//   (2) Yasal Kullanım Niteliği'ni (legalUsageNature) ARTIK İÇERMİYOR
//       (ana rapordaki TAKBİS-tabanlı otomatik öneriye devredildi, bkz.
//       app.js suggestLegalUsageNatureForAllTitleUnits).
//
// Bu test kapsamı:
//  1) buildQuickFormHtml() kaynağı: libraryNewOwnership select'i var,
//     libraryNewUsage select'i YOK.
//  2) Submit handler kaynağı: ownershipType boşsa hata verip
//     createNewReport()'u ÇAĞIRMIYOR (kaynak-düzeyi doğrulama), ve
//     createNewReport()'a legalUsageNature DEĞİL ownershipType geçiyor.
//  3) QUICK_OWNERSHIP_TYPE_OPTIONS, app.js'teki gerçek "case" bölümü
//     ownershipType alanının `options` dizisiyle BİREBİR aynı (elle
//     senkron tutulan iki liste — bkz. AGENTS.md'deki "İKİ AYRI
//     REGISTRY" uyarısıyla aynı sınıf risk).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const librarySource = fs.readFileSync(path.join(appDir, "cloud", "report-library.js"), "utf8");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

// --- 1) buildQuickFormHtml(): Mülkiyet var, Yasal Kullanım Niteliği yok ---
{
  const start = librarySource.indexOf("function buildQuickFormHtml()");
  assert(start >= 0, "buildQuickFormHtml bulunamadı.");
  const end = librarySource.indexOf("\n  }\n", start);
  assert(end > start, "buildQuickFormHtml gövdesi kapanmadı.");
  const fnSource = librarySource.slice(start, end);

  assert.match(fnSource, /id="libraryNewOwnership"/, "Mülkiyet select'i (libraryNewOwnership) hızlı formda bulunamadı.");
  assert.match(fnSource, /QUICK_OWNERSHIP_TYPE_OPTIONS/, "buildQuickFormHtml artık QUICK_OWNERSHIP_TYPE_OPTIONS'ı kullanmıyor.");
  assert.match(fnSource, /<span>Mülkiyet \*<\/span>/, "Mülkiyet alanı ZORUNLU (*) olarak işaretlenmemiş.");
  assert.doesNotMatch(fnSource, /libraryNewUsage/, "REGRESYON: Yasal Kullanım Niteliği select'i (libraryNewUsage) hâlâ hızlı formda — kullanıcı isteği bu alanın KALDIRILMASIYDI.");

  console.log("buildQuickFormHtml(): Mülkiyet eklendi + Yasal Kullanım Niteliği kaldırıldı testi tamam.");
}

// --- 2) Submit handler: ownershipType ZORUNLU + createNewReport payload --
{
  const start = librarySource.indexOf('newPanel.querySelector("#libraryNewReportSubmit").addEventListener("click"');
  assert(start >= 0, "Talebi Oluştur submit handler'ı bulunamadı.");
  const end = librarySource.indexOf("\n        });\n", start);
  assert(end > start, "Submit handler gövdesi kapanmadı.");
  const handlerSource = librarySource.slice(start, end);

  assert.match(handlerSource, /libraryNewOwnership"\)\.value/, "Submit handler artık libraryNewOwnership değerini okumuyor.");
  assert.match(handlerSource, /if \(!ownershipType\)/, "Mülkiyet boşsa engelleyen zorunluluk kontrolü bulunamadı.");
  assert.match(handlerSource, /Mülkiyet seçimi zorunludur\./, "Mülkiyet zorunluluğu için kullanıcıya gösterilen hata metni bulunamadı.");
  assert.match(handlerSource, /ownershipType,\s*\n\s*\}\);/, "createNewReport(...) çağrısı artık ownershipType'ı GEÇMİYOR.");
  assert.doesNotMatch(handlerSource, /legalUsageNature:/, "REGRESYON: createNewReport(...) hâlâ legalUsageNature geçiyor — kullanıcı isteği bunun KALDIRILMASIYDI.");

  console.log("Submit handler: Mülkiyet zorunluluğu + createNewReport payload testi tamam.");
}

// --- 3) QUICK_OWNERSHIP_TYPE_OPTIONS, app.js'teki gerçek liste ile --------
// BİREBİR aynı (elle-senkron iki liste riski).
{
  const constMatch = librarySource.match(/const QUICK_OWNERSHIP_TYPE_OPTIONS = (\[[^\]]*\]);/);
  assert(constMatch, "QUICK_OWNERSHIP_TYPE_OPTIONS tanımı bulunamadı.");
  // eslint-disable-next-line no-eval
  const quickOptions = eval(constMatch[1]);

  const fieldStart = appSource.indexOf('key: "ownershipType"');
  assert(fieldStart >= 0, 'app.js\'te ownershipType alanı bulunamadı.');
  const optionsStart = appSource.indexOf("options:", fieldStart);
  const optionsEnd = appSource.indexOf("]", optionsStart) + 1;
  const optionsMatch = appSource.slice(optionsStart, optionsEnd).match(/options:\s*(\[[^\]]*\])/);
  assert(optionsMatch, "app.js ownershipType alanının options dizisi ayrıştırılamadı.");
  // eslint-disable-next-line no-eval
  const realOptions = eval(optionsMatch[1]);

  assert.deepEqual(quickOptions, realOptions, "QUICK_OWNERSHIP_TYPE_OPTIONS (report-library.js) app.js'teki gerçek ownershipType seçenekleriyle senkron DEĞİL — elle senkron iki liste birbirinden ayrıştı.");

  console.log("QUICK_OWNERSHIP_TYPE_OPTIONS <-> app.js ownershipType seçenekleri senkron testi tamam.");
}

console.log("Talep açma (hızlı form) Mülkiyet zorunluluğu testleri başarılı.");
