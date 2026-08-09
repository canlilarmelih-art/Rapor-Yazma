// Çoklu TAKBİS Faz 2 — state.titleUnits[] veri modeli testi (2026-08-09,
// bkz. docs/coklu-takbis-import-plan.md, "state.titleUnits[] veri modeli").
// Bu aşamada YALNIZCA veri modeli + saf yardımcı fonksiyonlar var — hiçbir
// UI/render bunları kullanmıyor. Test kapsamı:
//  1) createEmptyTitleUnit() varsayılan şekli ve override'ları.
//  2) computeTitleUnitTabLabel(): aynı ada/parselde Blok-BBNo, farklı
//     ada/parselde Ada Parsel kuralı (kullanıcı ile netleşen mimari karar).
//  3) loadState() içindeki merge mantığının localStorage'da titleUnits
//     KAYITLI DEĞİLSE boş dizi, KAYITLIYSA aynen korunduğu — regex ile
//     kaynağı doğrudan doğrulanır (loadState DOM/localStorage'a bağımlı
//     olduğu için sandbox'ta çalıştırılamaz, bu yüzden statik metin kontrolü
//     yapılır).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  // Parametre listesi içinde varsayılan nesne değeri olabilir (ör.
  // `overrides = {}`) — bu yüzden gövde başlangıcını bulmak için önce
  // parametre listesinin KAPANAN parantezini (paren-depth ile) bul, gövde
  // "{"'sini ancak ondan SONRA ara (test-multi-takbis-split.js'teki basit
  // "ilk { ara" yaklaşımı, parametre varsayılanı {} içeren fonksiyonlarda
  // yanlış eşleşiyordu).
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
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

const functionNames = ["createEmptyTitleUnit", "computeTitleUnitTabLabel"];
const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) createEmptyTitleUnit() -------------------------------------------
{
  const unit = fns.createEmptyTitleUnit();
  assert.ok(typeof unit.id === "string" && unit.id.length > 0, "id üretilmeli.");
  assert.deepEqual(unit.fields, {}, "Varsayılan fields boş nesne olmalı.");
  assert.deepEqual(unit.tables, {}, "Varsayılan tables boş nesne olmalı.");
  assert.equal(unit.sourceFile, "", "Varsayılan sourceFile boş string olmalı.");

  const withOverrides = fns.createEmptyTitleUnit({
    id: "unit-fixed",
    fields: { blockNo: "709", parcelNo: "2" },
    tables: { title: [["Malik", "1/1", "", "", ""]] },
    sourceFile: "dosya1.pdf",
  });
  assert.equal(withOverrides.id, "unit-fixed", "Verilen id korunmalı.");
  assert.equal(withOverrides.fields.blockNo, "709", "Verilen fields korunmalı.");
  assert.equal(withOverrides.sourceFile, "dosya1.pdf", "Verilen sourceFile korunmalı.");
  console.log("createEmptyTitleUnit varsayilan + override testi tamam.");
}

// --- 2) computeTitleUnitTabLabel(): adlandırma kuralı ---------------------
{
  const unitA = fns.createEmptyTitleUnit({ fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "3" } });
  const unitB = fns.createEmptyTitleUnit({ fields: { blockNo: "709", parcelNo: "2", titleBlockName: "A", unitNo: "12" } });
  const unitC = fns.createEmptyTitleUnit({ fields: { blockNo: "845", parcelNo: "7" } });
  const all = [unitA, unitB, unitC];

  assert.equal(fns.computeTitleUnitTabLabel(unitA, all), "A-3", "Aynı ada/parselde Blok-BBNo formatı (A-3) beklenir.");
  assert.equal(fns.computeTitleUnitTabLabel(unitB, all), "A-12", "Aynı ada/parselde Blok-BBNo formatı (A-12) beklenir.");
  assert.equal(fns.computeTitleUnitTabLabel(unitC, all), "845 7", "Tek başına (farklı ada/parsel) 'Ada Parsel' formatı beklenir.");

  const single = [unitC];
  assert.equal(fns.computeTitleUnitTabLabel(unitC, single), "845 7", "Listede tek taşınmaz varken de 'Ada Parsel' formatı korunmalı.");

  const noBlockName = fns.createEmptyTitleUnit({ fields: { blockNo: "709", parcelNo: "2" } });
  const pairMissingBlock = [unitA, noBlockName];
  assert.equal(
    fns.computeTitleUnitTabLabel(noBlockName, pairMissingBlock),
    "709 2",
    "Aynı ada/parselde olsa da Blok/BB No eksikse 'Ada Parsel'e düşülmeli (boş etiket üretilmemeli)."
  );

  const empty = fns.createEmptyTitleUnit();
  assert.equal(fns.computeTitleUnitTabLabel(empty, [empty]), "Taşınmaz", "Hiç veri yoksa 'Taşınmaz' varsayılanı dönmeli.");
  console.log("computeTitleUnitTabLabel adlandirma kurali testi tamam.");
}

// --- 3) loadState() kaynağında titleUnits alanı doğru kurgulanmış mı ------
{
  const loadStateStart = appSource.indexOf("\nfunction loadState(");
  assert.ok(loadStateStart >= 0, "loadState() bulunamadı.");
  const loadStateSource = appSource.slice(loadStateStart, loadStateStart + 3000);
  assert.ok(
    loadStateSource.includes("titleUnits: [],"),
    "loadState() fallback nesnesinde titleUnits: [] tanımlı olmalı."
  );
  assert.ok(
    loadStateSource.includes("titleUnits: Array.isArray(stored.titleUnits) ? stored.titleUnits : fallback.titleUnits,"),
    "loadState() merge mantığında titleUnits, localStorage'daki dizi KORUNARAK (yalnızca dizi değilse fallback'e düşerek) birleştirilmeli."
  );
  console.log("loadState() titleUnits alani kaynak-duzeyi testi tamam.");
}

// --- 4) cloud-sync.js CLOUD_WHITELIST içinde titleUnits var mı ------------
{
  const cloudSyncSource = fs.readFileSync(path.join(__dirname, "..", "cloud", "cloud-sync.js"), "utf8");
  assert.match(
    cloudSyncSource,
    /CLOUD_WHITELIST = \[[^\]]*"titleUnits"[^\]]*\]/,
    "cloud-sync.js CLOUD_WHITELIST dizisinde \"titleUnits\" olmalı (aksi halde ek taşınmazlar buluta senkronlanmaz)."
  );
  console.log("cloud-sync.js CLOUD_WHITELIST testi tamam.");
}

console.log("Coklu TAKBIS Faz 2 veri modeli testleri basarili.");
