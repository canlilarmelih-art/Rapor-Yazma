"use strict";

// Kullanıcı bildirimi (2026-08-27): "başka bir cihazdan girildiğinde tüm
// taşınmaz tabları kayboluyor bunun sebebi nedir" — GERÇEK HATA
// (cloud/report-library.js, fetchCloudReportAndOpen): bir raporu BAŞKA bir
// cihazdan ilk kez "Buluttan Getir" ile açarken, bu fonksiyon `blob.state`'i
// ELLE, cloud-sync.js'in gerçek CLOUD_WHITELIST'inden (fields/tables/
// lookupOptions/titleUnits/activeTitleUnitIndex/primaryTitleUnitShadow/
// updatedAt) BAĞIMSIZ, AYRI bir alan listesiyle kuruyordu — titleUnits/
// activeTitleUnitIndex/primaryTitleUnitShadow UNUTULMUŞTU.
// `restoreStateFromImportedJson()`'daki `{...fallback, ...imported}`
// birleşimi, `imported`de HİÇ olmayan bir anahtarı fallback'in BOŞ
// varsayılanıyla (titleUnits: []) bırakır — sonuç: rapor buluttan (ek
// taşınmazlarıyla birlikte) doğru şekilde gönderilmiş olsa bile, başka bir
// cihazdan "Buluttan Getir" ile açıldığında yalnızca birincil taşınmaz
// kalıyor, TÜM ek taşınmaz tabları kayboluyordu. Cihaz A'da normal
// senkron (pullReport/applyPayloadToState, cloud-sync.js) bu hatayı
// GÖSTERMEZ çünkü o yol zaten CLOUD_WHITELIST'i jenerik bir döngüyle
// uyguluyor — hata YALNIZCA "kütüphaneden buluttan getir" (bu cihazda
// HİÇ bulunmayan bir raporu ilk kez açma) yolunda ortaya çıkıyordu.
//
// Bu test kapsamı: fetchCloudReportAndOpen()'ın kurduğu blob.state
// nesnesinin, cloud-sync.js'in CLOUD_WHITELIST'indeki HER alanı
// (titleUnits/activeTitleUnitIndex/primaryTitleUnitShadow dahil) taşıdığını
// kaynak-düzeyinde doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const librarySource = fs.readFileSync(path.join(appDir, "cloud", "report-library.js"), "utf8");
const cloudSyncSource = fs.readFileSync(path.join(appDir, "cloud", "cloud-sync.js"), "utf8");

// --- 1) cloud-sync.js'in CLOUD_WHITELIST'i degismedi mi? -------------------
// (asagidaki kaynak-duzeyi kontrol bu listeye gore yazildi - liste
// degisirse bu test de guncellenmeli.)
assert.match(
  cloudSyncSource,
  /const CLOUD_WHITELIST = \["fields", "tables", "lookupOptions", "titleUnits", "activeTitleUnitIndex", "primaryTitleUnitShadow", "updatedAt"\];/,
  "cloud-sync.js CLOUD_WHITELIST beklenenden farkli - bu testin varsayimlari guncel olmayabilir."
);
console.log("cloud-sync.js CLOUD_WHITELIST kaynak-duzeyi sabitlik testi tamam.");

// --- 2) fetchCloudReportAndOpen()'in blob.state'i titleUnits/ --------------
// activeTitleUnitIndex/primaryTitleUnitShadow'u da tasiyor mu?
const fnStart = librarySource.indexOf("\n  async function fetchCloudReportAndOpen(");
assert(fnStart >= 0, "fetchCloudReportAndOpen bulunamadi.");
const fnEnd = librarySource.indexOf("\n  function openDashboardAfterAuthentication(", fnStart);
assert(fnEnd > fnStart, "fetchCloudReportAndOpen fonksiyon siniri bulunamadi.");
const fnBody = librarySource.slice(fnStart, fnEnd);

["fields", "tables", "lookupOptions", "titleUnits", "activeTitleUnitIndex", "primaryTitleUnitShadow", "updatedAt"].forEach((key) => {
  assert.match(
    fnBody,
    new RegExp(`\\b${key}:\\s`),
    `fetchCloudReportAndOpen()'in kurdugu blob.state "${key}" alanini TASIMALI (cloud-sync.js CLOUD_WHITELIST'in TAMAMI ile ayni olmali).`
  );
});

// KRITIK REGRESYON: titleUnits Array.isArray guard'iyla, undefined/eksik
// oldugunda BOS DIZIYE (fallback'in zaten varsayilani) degil, GERCEK
// bulut verisine dusmeli - yani cloudData.payload.titleUnits GERCEKTEN
// okunmali (sabit "[]" DEGIL).
assert.match(
  fnBody,
  /titleUnits:\s*Array\.isArray\(cloudData\.payload\.titleUnits\)\s*\?\s*cloudData\.payload\.titleUnits\s*:\s*\[\]/,
  "titleUnits, cloudData.payload.titleUnits'ten OKUNMALI (sabit bos dizi degil)."
);
assert.match(
  fnBody,
  /activeTitleUnitIndex:\s*Number\.isInteger\(cloudData\.payload\.activeTitleUnitIndex\)\s*\?\s*cloudData\.payload\.activeTitleUnitIndex\s*:\s*0/,
  "activeTitleUnitIndex, cloudData.payload.activeTitleUnitIndex'ten OKUNMALI."
);
assert.match(
  fnBody,
  /primaryTitleUnitShadow:\s*cloudData\.payload\.primaryTitleUnitShadow/,
  "primaryTitleUnitShadow, cloudData.payload.primaryTitleUnitShadow'dan OKUNMALI."
);

console.log("fetchCloudReportAndOpen() titleUnits/activeTitleUnitIndex/primaryTitleUnitShadow kaynak-duzeyi REGRESYON testi tamam.");

console.log("Bulut-getir (fetchCloudReportAndOpen) tasinmaz-tablari korunma testleri basarili.");
