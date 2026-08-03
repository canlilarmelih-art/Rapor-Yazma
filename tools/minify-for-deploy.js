"use strict";

// Deploy-oncesi kod kucultme (minify) — KAYNAK KODU KORUMASI icin. Bu script
// SADECE GitHub Actions'in gecici (ephemeral) checkout kopyasinda calisir;
// repodaki dosyalar ASLA minified olarak commit edilmez, gelistirme deneyimi
// (okunabilir kaynak) etkilenmez.
//
// KRITIK GUVENLIK KURALI: bu dosyalar klasik <script> etiketleriyle
// yukleniyor (ES module degil) ve BIRBIRLERININ global degiskenlerine cIplak
// isimle (`state`, `RAPOR_FIREBASE_CONFIG`, `buildGabimDataSetWordHtml` vb.)
// referans veriyor; ustelik src/templates/template-engine.js icindeki
// safeCall() 147 kez `globalThis[fnName]` seklinde DINAMIK isim-tabanli
// cagri yapiyor (bkz. tools/test-*.js'lerin de kullandigi sliceFn deseni).
// Bu yuzden:
//   - mangle.toplevel MUTLAKA false (varsayilan) — ust duzey fonksiyon/
//     degisken adlari degistirilmemeli, aksi halde globalThis[fnName]
//     aramalari ve script-arasi cIplak referanslar kirilir.
//   - compress.toplevel MUTLAKA false (varsayilan) — "kullanilmiyor gibi
//     gorunen" ust duzey fonksiyonlar SILINMEMELI; safeCall() bunlari
//     statik analizle GORUNMEZ sekilde dinamik cagirir.
// Sadece IC (fonksiyon/blok) kapsamindaki degiskenler kisaltilir, bosluk ve
// yorumlar kaldirilir — bu bile "duz metin okunabilirligi" ni ortadan
// kaldirmaya yeter (kullanici talebi: "bu kopyalanamamalı").

const fs = require("node:fs/promises");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { minify } = require("terser");

const root = path.resolve(__dirname, "..");

const TARGET_FILES = [
  "app.js",
  "cloud/cloud-sync.js",
  "cloud/report-library.js",
  "src/auth/access-control.js",
  "src/comparables/comparable-market-analysis.js",
  "src/exports/docx-fill.js",
  "src/exports/export-validation.js",
  "src/exports/report-tables-xlsx.js",
  "src/exports/xlsx-fill.js",
  "src/exports/ziraat-ek-tablo-xlsx.js",
  "src/land/climate-earthquake-data.js",
  "src/land/minimum-parcel-sizes.js",
  "src/parsers/ekb-parser.js",
  "src/parsers/golden-fixture-parsers.js",
  "src/parsers/imar-normalizer.js",
  "src/parsers/kml-parser.js",
  "src/risk/halkbank-risk-data.js",
  "src/risk/halkbank-risk-rules.js",
  "src/templates/template-engine.js",
  "src/value-factors/value-factors-rules.js",
];

const TERSER_OPTIONS = {
  mangle: {
    toplevel: false, // ZORUNLU — bkz. yukaridaki aciklama.
    keep_fnames: false, // ic kapsamdaki fonksiyon adlari kisaltilabilir.
  },
  compress: {
    toplevel: false, // ZORUNLU — bkz. yukaridaki aciklama.
    // "unsafe*" bayraklari ACILMAZ: davranis degisikligine yol acabilecek
    // agresif donusumler (ornegin tip donusum varsayimlari) bir 30k satirlik
    // urun kodunda risklidir; sadece guvenli olculer uygulanir.
  },
  format: {
    comments: false,
  },
};

async function minifyFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const source = await fs.readFile(absolutePath, "utf8");
  const result = await minify(source, TERSER_OPTIONS);
  if (result.error) throw result.error;
  if (!result.code || !result.code.trim()) {
    throw new Error(`${relativePath}: minify sonucu bos dondu — kaynagin kendisi bos olmadigi surece bu bir hata.`);
  }
  await fs.writeFile(absolutePath, result.code, "utf8");
  // node --check ile minified ciktinin gecerli JavaScript oldugunu hemen
  // dogrula; syntax bozulmasi rsync'ten ONCE burada yakalanmali.
  execFileSync(process.execPath, ["--check", absolutePath], { stdio: "inherit" });
  return { relativePath, beforeBytes: Buffer.byteLength(source, "utf8"), afterBytes: Buffer.byteLength(result.code, "utf8") };
}

async function main() {
  const results = [];
  for (const relativePath of TARGET_FILES) {
    // eslint-disable-next-line no-await-in-loop
    const result = await minifyFile(relativePath);
    results.push(result);
    const savedPercent = Math.round((1 - result.afterBytes / result.beforeBytes) * 100);
    console.log(`  ${relativePath}: ${result.beforeBytes} -> ${result.afterBytes} bayt (%${savedPercent} kucultme)`);
  }
  const totalBefore = results.reduce((sum, r) => sum + r.beforeBytes, 0);
  const totalAfter = results.reduce((sum, r) => sum + r.afterBytes, 0);
  console.log(`Toplam: ${totalBefore} -> ${totalAfter} bayt (%${Math.round((1 - totalAfter / totalBefore) * 100)} kucultme), ${results.length} dosya.`);
}

main().catch((error) => {
  console.error("Minify basarisiz:", error);
  process.exit(1);
});
