"use strict";

/*
  Kullanici talebi: "BDDK'nın 10 M TL üstü raporlarda 2 ayrı değerleme
  uzmanına iş yönlendirme zorunluluğu var ... bu sebeple bizim
  sistemimizden yapılan raporlarda aynı ada parsel, ya da aynı ada parsel
  blok bağımsız bölüm nu yapılıyor ise bunun tespit edilmesi gerekiyor."

  admin-users.html'e yeni bir "Tekrarlanan Ada/Parsel Tespiti" karti
  eklendi (client-side, mevcut Rapor Listesi ozetinden hesaplaniyor, yeni
  bir API/veri toplama YOK). Bu test o kartin cekirdek mantigini
  (groupReportsByKey/toDuplicateGroupList/detectDuplicateParcels)
  admin-users.html'in inline script'inden dogrudan cikarip vm ile
  calistirir:

  1) Ayni ada+parsel+blok+BBNo (AYNI BIRIM) FARKLI kullanicilar tarafindan
     kullanilmissa "fullUnit" grubunda, distinctUserCount>1 ile tespit
     edilmeli (KRITIK).
  2) Ayni ada+parsel ama FARKLI blok/BBNo (AYNI BINA, farkli birim)
     "adaParsel" grubunda ayrica tespit edilmeli — VE fullUnit'te zaten
     TAM olarak gorunen bir grup (tum uyeler ayni birim) adaParsel
     katmaninda TEKRAR gosterilmemeli (gereksiz tekrar/gurultu).
  3) Ayni kullanicinin kendi ic tekrarlari (distinctUserCount===1) daha
     dusuk onemli (AYNI KULLANICI) olarak isaretlenmeli, kritik SAYILMAMALI.
  4) Ada/parsel bilgisi eksik olan raporlar (bos summary) hic gruplanmamali
     (crash yok, sessizce atlanir).
  5) Tekil (tek raporlu) ada/parsel'ler hic grup olusturmamali.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(appDir, "admin-users.html"), "utf8");
const scriptMatch = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.trim().startsWith("(function"));
assert.ok(scriptMatch, "admin-users.html'deki ana inline script bulunamadi.");

function extractFn(source, startMarker) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  // Fonksiyon govdesini basit parantez sayaciyla cikar (ic ice fonksiyonlar
  // icerdiginden "\\n}" gibi kaba bir isaretleyici yeterli degil).
  let depth = 0;
  let i = source.indexOf("{", start);
  const bodyStart = i;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return source.slice(start, i);
}

const fnsSource = [
  extractFn(scriptMatch, "function groupReportsByKey("),
  extractFn(scriptMatch, "function toDuplicateGroupList("),
  extractFn(scriptMatch, "function detectDuplicateParcels("),
].join("\n\n");

const context = {};
vm.createContext(context);
vm.runInContext(fnsSource, context);

function mkReport(reportId, uid, blockNo, parcelNo, titleBlockName, unitNo, createdAt) {
  return {
    reportId,
    uid,
    email: uid + "@example.com",
    createdAt: createdAt || "2026-08-07T10:00:00.000Z",
    summary: { blockNo, parcelNo, titleBlockName, unitNo, city: "Bursa", district: "Nilüfer", neighborhood: "Özlüce" },
  };
}

// --- 1) Ayni birim (ada+parsel+blok+BBNo), FARKLI kullanicilar -----------
{
  const reports = [
    mkReport("RE-1", "uid-a", "4475", "5", "A", "1"),
    mkReport("RE-2", "uid-b", "4475", "5", "A", "1"),
  ];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 1, "Ayni birim icin 1 fullUnit grubu olusmali.");
  assert.equal(detected.fullUnit[0].distinctUserCount, 2, "Farkli kullanicilar dogru sayilmali.");
  assert.equal(detected.fullUnit[0].reports.length, 2);
  console.log("Ayni birim, farkli kullanici (KRITIK) testi tamam.");
}

// --- 2) Ayni ada/parsel, FARKLI blok/BBNo (ayni bina) ---------------------
{
  const reports = [
    mkReport("RE-3", "uid-a", "100", "10", "A", "1"),
    mkReport("RE-4", "uid-b", "100", "10", "B", "2"),
  ];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 0, "Farkli birimler oldugundan fullUnit grubu OLUSMAMALI.");
  assert.equal(detected.adaParsel.length, 1, "Ayni ada/parsel icin 1 adaParsel grubu olusmali.");
  assert.equal(detected.adaParsel[0].distinctUserCount, 2);
  console.log("Ayni ada/parsel, farkli birim (ayni bina) testi tamam.");
}

// --- 2b) fullUnit'te TAM gorunen bir grup adaParsel'de TEKRAR gosterilmez
{
  const reports = [
    mkReport("RE-5", "uid-a", "200", "20", "C", "3"),
    mkReport("RE-6", "uid-b", "200", "20", "C", "3"),
  ];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 1, "Ayni birim fullUnit'te gorunmeli.");
  assert.equal(detected.adaParsel.length, 0, "Tum uyeler ayni birime sahipse adaParsel'de TEKRAR gosterilmemeli (gurultu onleme).");
  console.log("fullUnit/adaParsel gereksiz tekrar onleme testi tamam.");
}

// --- 3) Ayni kullanicinin kendi ic tekrari — KRITIK degil -----------------
{
  const reports = [
    mkReport("RE-7", "uid-a", "300", "30", "A", "1"),
    mkReport("RE-8", "uid-a", "300", "30", "A", "1"),
  ];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 1);
  assert.equal(detected.fullUnit[0].distinctUserCount, 1, "Ayni kullanici icin distinctUserCount 1 olmali (KRITIK degil).");
  console.log("Ayni kullanici kendi ic tekrari (KRITIK DEGIL) testi tamam.");
}

// --- 4) Ada/parsel eksikse hic gruplanmaz (crash yok) ---------------------
{
  const reports = [
    { reportId: "RE-9", uid: "uid-a", email: "a@example.com", createdAt: "2026-08-07T10:00:00.000Z", summary: {} },
    { reportId: "RE-10", uid: "uid-b", email: "b@example.com", createdAt: "2026-08-07T10:00:00.000Z", summary: null },
  ];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 0);
  assert.equal(detected.adaParsel.length, 0);
  console.log("Ada/parsel eksik veri (crash yok, gruplanmiyor) testi tamam.");
}

// --- 5) Tekil (tek raporlu) ada/parsel grup olusturmaz --------------------
{
  const reports = [mkReport("RE-11", "uid-a", "400", "40", "A", "1")];
  const detected = context.detectDuplicateParcels(reports);
  assert.equal(detected.fullUnit.length, 0);
  assert.equal(detected.adaParsel.length, 0);
  console.log("Tekil ada/parsel (grup olusturmaz) testi tamam.");
}
