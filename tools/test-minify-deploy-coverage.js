"use strict";

/*
  Kullanici talebi: "bu kopyalanamamalı" — kaynak kodu korumasinin ikinci
  katmani olarak deploy oncesi minify eklendi (bkz. tools/minify-for-deploy.js,
  .github/workflows/deploy.yml "Minify client JS for deploy" adimi). Bu script
  gercekten terser calistirip minify SONUCUNU dogrulamaz (bu, npm run verify'in
  her calisisinda 2+ MB JS'i kucultmek anlamina gelir, gelistirme dongusunu
  yavaslatir); onun yerine DAHA UCUZ ama ayni derecede degerli iki seyi
  dogrular:
  1) minify-for-deploy.js'in TARGET_FILES listesi, app.js/cloud/src altindaki
     GERCEK dosyalarla senkron mu (yeni bir src/ altinda dosyasi eklenip
     listeye eklenmeyi UNUTULURSA bu test yakalar — aksi halde o dosya
     korumasiz kalir, sessizce).
  2) minify-for-deploy.js'in KRITIK guvenlik ayarlari (mangle.toplevel=false,
     compress.toplevel=false) hala kodda mevcut mu — bunlar olmadan
     template-engine.js'in globalThis[fnName] ile 147 dinamik cagrisi kirilir
     (bkz. dosyanin basindaki aciklama).
  3) deploy.yml, "Minify client JS for deploy" adimini gercekten icerip
     icermedigini ve bu adimin rsync'ten ONCE geldigini dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function listJsFilesRecursive(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(listJsFilesRecursive(full));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(path.relative(root, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

// --- 1) TARGET_FILES listesi gercek dosyalarla senkron ------------------
{
  const minifyScriptSrc = fs.readFileSync(path.join(root, "tools", "minify-for-deploy.js"), "utf8");
  const targetFilesMatch = minifyScriptSrc.match(/const TARGET_FILES = \[([\s\S]*?)\];/);
  assert.ok(targetFilesMatch, "TARGET_FILES dizisi bulunamadi.");
  const targetFiles = new Set(
    targetFilesMatch[1]
      .split(",")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^["']|["']$/g, ""))
      .filter((line) => line.length),
  );

  const actualFiles = ["app.js", ...listJsFilesRecursive(path.join(root, "cloud")), ...listJsFilesRecursive(path.join(root, "src"))]
    // firebase-config.js kucuk/genel bir yapilandirma dosyasi (login.html'in
    // de oturumsuz erisebilmesi gerekiyor, bkz. server.js isPublicStaticFile) —
    // bilerek minify listesinden HARIC tutuldu, bu yuzden test disinda birakilir.
    .filter((relativePath) => relativePath !== "cloud/firebase-config.js");

  actualFiles.forEach((relativePath) => {
    assert.ok(
      targetFiles.has(relativePath),
      `"${relativePath}" minify-for-deploy.js TARGET_FILES listesinde YOK — deploy'da kucultulmeden (korumasiz) gonderilir.`,
    );
  });

  targetFiles.forEach((relativePath) => {
    assert.ok(
      fs.existsSync(path.join(root, relativePath)),
      `TARGET_FILES listesindeki "${relativePath}" artik diskte yok — listeyi guncelle.`,
    );
  });
}

// --- 2) Kritik guvenlik ayarlari kodda mevcut ----------------------------
{
  const minifyScriptSrc = fs.readFileSync(path.join(root, "tools", "minify-for-deploy.js"), "utf8");
  assert.match(
    minifyScriptSrc,
    /mangle:\s*\{\s*toplevel:\s*false/,
    "mangle.toplevel:false ayari kaybolmus — globalThis[fnName] dinamik cagrilari (safeCall) kirilir.",
  );
  assert.match(
    minifyScriptSrc,
    /compress:\s*\{\s*toplevel:\s*false/,
    "compress.toplevel:false ayari kaybolmus — 'kullanilmiyor gorunen' ust duzey fonksiyonlar silinebilir.",
  );
  assert.match(
    minifyScriptSrc,
    /execFileSync\(process\.execPath,\s*\["--check",/,
    "Her minify edilen dosya icin node --check dogrulamasi kaybolmus.",
  );
}

// --- 3) deploy.yml minify adimini icerir ve rsync'ten once gelir ---------
{
  const deployYml = fs.readFileSync(path.join(root, ".github", "workflows", "deploy.yml"), "utf8");
  const minifyIndex = deployYml.indexOf("node tools/minify-for-deploy.js");
  const rsyncIndex = deployYml.indexOf("rsync -az");
  assert.ok(minifyIndex >= 0, "deploy.yml artik minify-for-deploy.js'i cagirmiyor.");
  assert.ok(rsyncIndex >= 0, "deploy.yml artik rsync adimini icermiyor (yapisi degismis olabilir).");
  assert.ok(minifyIndex < rsyncIndex, "Minify adimi rsync'ten SONRA geliyor — minified kod sunucuya gitmez.");
}

console.log("Deploy minify kapsam ve guvenlik ayarlari testi tamam.");
