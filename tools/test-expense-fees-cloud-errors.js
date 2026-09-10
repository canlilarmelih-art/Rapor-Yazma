"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const cloudSource = fs.readFileSync(path.join(root, "cloud", "cloud-sync.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");

assert.match(
  cloudSource,
  /async function loadAppSetting\(docId\)[\s\S]*?catch \(error\) \{[\s\S]*?throw error;/,
  "appSettings okuma izin/ağ hatasını yutmayıp çağırana iletmelidir.",
);
assert.match(
  appSource,
  /data-expense-fee-cloud-status/,
  "Masraf ayarları için görünür bulut durum alanı bulunmalıdır.",
);
assert.match(
  appSource,
  /data-expense-fee-cloud-retry[^>]*>Tekrar dene</,
  "Masraf ayarları için yeniden deneme düğmesi bulunmalıdır.",
);
assert.match(
  appSource,
  /senkronlanamadı; yerel değer kullanılıyor\. Tekrar deneyin\./,
  "Hata durumunda yerel kullanım ve yeniden deneme açıkça bildirilmelidir.",
);
assert.match(
  appSource,
  /Bulut bağlantısı yok; ortak masraf ayarları yalnızca bu cihazda kullanılıyor\./,
  "Bulut kapalıysa yanlış senkron durumu gösterilmemelidir.",
);
assert.match(
  appSource,
  /const appraisalArea = appraisalAreaField === "currentArea"[\s\S]*?getValuationUnitAreaTotals\(\)\.current[\s\S]*?lookupExpenseAppraisalFeeExVat\(state\.fields\.expenseAppraisalPropertyType, appraisalArea\)/,
  "Çok katlı taşınmazlarda değerleme ücreti toplam mevcut alan üzerinden hesaplanmalıdır.",
);

console.log("expense fees cloud error feedback checks passed");
