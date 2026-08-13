"use strict";

// Kullanıcı bildirimi (2026-08-13): "Talep Arama kısmı çalışmıyor.
// herhangi bir kelime yazıyorum örnek kuvyt ama bu kelime haricinde
// sonuçlar da geliyor" — GERÇEK HATA (cloud/report-library.js):
// renderDashboardBody() içinde "Yalnızca bulutta" (bu cihaza hiç
// getirilmemiş) kartlar `visible` (searchQuery/statusFilter/showArchived'a
// göre filtrelenmiş) listesinin TAMAMEN DIŞINDA, AYRI bir döngüyle ekleniyordu
// (Object.keys(cloudReportsCache)...forEach) — arama kutusuna ne yazılırsa
// yazılsın hepsi HER ZAMAN gösteriliyordu, ekran görüntüsündeki gibi.
// matchesSearch() artık bu ikinci döngüde de uygulanıyor.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(appDir, "cloud", "report-library.js"), "utf8");

// --- 1) Kaynak-duzeyi: cloud-only dongude matchesSearch cagrisi var mi? ----
const cloudOnlyLoopStart = source.indexOf("if (window.RaporCloudSync?.isConfigured() && window.RaporCloudSync.getStatus().signedIn && cloudReportsCache) {");
const cloudOnlyLoopEnd = source.indexOf("\n    }", cloudOnlyLoopStart);
assert(cloudOnlyLoopStart >= 0 && cloudOnlyLoopEnd > cloudOnlyLoopStart, "cloud-only dongu bulunamadi (kaynak degismis olabilir).");
const cloudOnlyLoopSource = source.slice(cloudOnlyLoopStart, cloudOnlyLoopEnd);
assert.match(
  cloudOnlyLoopSource,
  /\.filter\(\(id\) => matchesSearch\(\{ summary: cloudReportsCache\[id\]\?\.summary \}, searchQuery\)\)/,
  "cloud-only kartlar dongusu artik matchesSearch/searchQuery ile filtrelenmiyor — arama kutusu bu kartlari yok saymaya geri donmus olabilir."
);

console.log("Cloud-only kartlar arama filtresi kaynak-duzeyi kablolama testi tamam.");

// --- 2) Davranissal: matchesSearch() gercek kaynaktan calistirilir --------
function extractFnBody(name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `Bulunamadi: ${name}`);
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return source.slice(start, i);
}

const context = {
  foldTurkish: (value) => String(value || "")
    .toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ğ", "G")
    .replaceAll("Ü", "U").replaceAll("Ö", "O").replaceAll("Ç", "C"),
};
vm.createContext(context);
vm.runInContext(extractFnBody("matchesSearch"), context);

// Kullanicinin ekran goruntusundeki senaryo: "kuvyt" arandiginda SADECE
// caseName/bank/adaParsel gibi ozet alanlarinda "kuvyt" GECEN kayitlar
// eslesmeli, ilgisiz bir "Isbnk-..."/"Halk-..." kaydi eslesmemeli.
const kuvytEntry = { summary: { caseName: "Kuvyt-202600748", bank: "Kuveyt Türk Katılım Bankası A.Ş." } };
const isbnkEntry = { summary: { caseName: "Isbnk-2026011", bank: "Türkiye İş Bankası A.Ş." } };
const halkEntry = { summary: { caseName: "Halk-202601569", bank: "Türkiye Halk Bankası A.Ş." } };

assert.equal(context.matchesSearch(kuvytEntry, "kuvyt"), true, "kuvyt sorgusu kendi kaydiyla eslesmedi.");
assert.equal(context.matchesSearch(isbnkEntry, "kuvyt"), false, "kuvyt sorgusu ilgisiz Isbnk kaydiyla YANLISLIKLA eslesti.");
assert.equal(context.matchesSearch(halkEntry, "kuvyt"), false, "kuvyt sorgusu ilgisiz Halk kaydiyla YANLISLIKLA eslesti.");

// Ozet alani hic doldurulmamis/eksikse (cloud-only kart henuz tam hidrate
// olmamis) sorgu boş degilse eslesmemeli — sessizce "her seyi goster"e
// dusmemeli (asil hatanin kok nedeni tam olarak buydu).
assert.equal(context.matchesSearch({ summary: {} }, "kuvyt"), false, "Bos ozetli kayit, bos olmayan bir sorguyla YANLISLIKLA eslesti.");
assert.equal(context.matchesSearch({ summary: undefined }, "kuvyt"), false, "summary undefined olan kayit, bos olmayan bir sorguyla YANLISLIKLA eslesti.");

// Bos sorgu -> her zaman true (arama kutusu bosken tum kartlar gorunur).
assert.equal(context.matchesSearch(isbnkEntry, ""), true, "Bos sorguda kayit gizlendi.");

console.log("matchesSearch() gercek-kaynak davranis testi tamam.");

console.log("Rapor kutuphanesi bulut-arama testleri basarili.");
