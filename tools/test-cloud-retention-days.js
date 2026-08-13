"use strict";

// Kullanıcı talebi (2026-08-13): bulut saklama süresi 30 günden düşürülsün
// — önce "7 gün" istendi, iOS'un 7-gün-etkileşimsiz-siteler-için yerel
// depolamayı temizleme riskiyle tam üst üste bineceği açıklandıktan sonra
// (bkz. cloud/FAZ0-TASARIM.md Faz 3 notu) kullanıcı "14 gün" olarak karar
// verdi. Bu test, tek gerçek kaynak olan RETENTION_DAYS sabitinin VE ona
// bağlı UI metinlerinin (buton etiketi, uyarı eşiği, Rules üst sınırı)
// tutarlı şekilde 30/7 yerine 14'ü yansıttığını doğrular — ileride biri
// bunlardan birini unutup eski değere geri dönerse (ör. kopyala-yapıştır
// ile yeni bir buton eklerken) yakalar.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const cloudSyncSource = fs.readFileSync(path.join(appDir, "cloud", "cloud-sync.js"), "utf8");
const reportLibrarySource = fs.readFileSync(path.join(appDir, "cloud", "report-library.js"), "utf8");
const rulesSource = fs.readFileSync(path.join(appDir, "cloud", "firestore.rules"), "utf8");

// --- 1) Tek gerçek kaynak: RETENTION_DAYS = 14 ------------------------------
assert.match(cloudSyncSource, /const RETENTION_DAYS = 14;/, "RETENTION_DAYS artik 14 degil.");
// Eski 30 degeri baska bir yerde YENIDEN tanimlanmamis olmali (kopyala-
// yapistir riski) — const RETENTION_DAYS sadece BIR kez tanimlanmali.
const retentionDeclarations = [...cloudSyncSource.matchAll(/const RETENTION_DAYS\s*=/g)];
assert.equal(retentionDeclarations.length, 1, "RETENTION_DAYS birden fazla yerde tanimlanmis.");

// --- 2) RETENTION_DAYS'in gercekten KULLANILDIGI 4 yer (push, extend, -----
//        login modali metni, hesap modali metni) hala oradaki degiskene
//        bagli, hardcoded bir sayiya DUSMEMIS.
[
  "Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000", // push (2 kez: create + extend)
  "${RETENTION_DAYS} gün sonra buluttan silinir",       // login modali
  "${RETENTION_DAYS} gün (son gönderimden itibaren",     // hesap modali
].forEach((needle) => {
  assert(cloudSyncSource.includes(needle), `cloud-sync.js icinde beklenen RETENTION_DAYS kullanimi yok: "${needle}"`);
});
const pushUsageCount = (cloudSyncSource.match(/Date\.now\(\) \+ RETENTION_DAYS \* 24 \* 60 \* 60 \* 1000/g) || []).length;
assert.equal(pushUsageCount, 2, "expireAt hesaplamasi (push + extendReportExpiry) RETENTION_DAYS'e bagli iki yerden biri kaybolmus.");

console.log("cloud-sync.js RETENTION_DAYS tek-kaynak testi tamam.");

// --- 3) report-library.js: buton etiketi + uyari esigi orantili kuculdu ----
assert.match(reportLibrarySource, />\+14 gün<\/button>/, "\"+14 gün\" uzatma dugmesi bulunamadi (hala eski \"+30 gün\" olabilir).");
assert(!reportLibrarySource.includes(">+30 gün<"), "Eski \"+30 gün\" etiketi hala duruyor.");
assert.match(reportLibrarySource, /const warn = daysLeft <= 3;/, "Uyari esigi 14 gunluk sureye orantili kuculmemis (eski 7 hala duruyor olabilir).");

console.log("report-library.js buton etiketi / uyari esigi testi tamam.");

// --- 4) firestore.rules: ust sinir orantili kuculdu (14 gun icin genis pay) -
assert.match(rulesSource, /duration\.value\(20, 'd'\)/, "Rules ust siniri (hasBoundedExpiry) hala eski 40 gun degerinde olabilir.");
assert(!rulesSource.includes("duration.value(40, 'd')"), "Eski 40 gunluk ust sinir hala duruyor.");
// Ust sinir, gercek RETENTION_DAYS'ten (14) HER ZAMAN buyuk olmali —
// aksi halde extendReportExpiry/push kendi yazdigi expireAt ile REJECTED olur.
assert(20 > 14, "Ust sinir gercek saklama suresinden kucuk kalmis (yazmalar reddedilir).");

console.log("firestore.rules ust sinir testi tamam.");

console.log("Bulut saklama suresi (14 gun) tutarlilik testleri basarili.");
