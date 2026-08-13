"use strict";

// Kullanıcı bildirimi (2026-08-13): "Banka ve Çıktı bölümünde template türü
// otomatik gelmiyor" — mülkiyet Arsa/Tarla olduğunda "Banka Şablonuyla
// Kaydet" açılır listesinin varsayılan seçimi boşa düşüyordu.
//
// Kök neden: appendBankTemplateExportBlock() (app.js), açılır listenin
// <option>'larını `hiddenFromList !== true` olan kayıtlardan kuruyor (ör.
// "ziraat-arsa-arazi"/"kuveytturk-arsa-arazi" GÖRÜNMEZ) — ama varsayılan
// seçimi hesaplarken `defaultTemplateKeyForBank(bank, isLandPropertyForBankTemplate())`
// çağırıyordu; mülkiyet Arsa/Tarla ise bu GİZLİ ("-arsa-arazi") anahtarı
// döndürür, ve `select.value = <listede olmayan anahtar>` tarayıcıda
// seçimi boşa/ilk seçeneğe düşürür. Bu, TÜM banka+arsa-arazi çiftlerini
// (yalnızca Kuveyt Türk'ü değil) etkileyen GENEL bir hataydı — arsa/arazi
// yönlendirmesi zaten export TIKLANINCA resolveTemplateKeyForExport() ile
// ayrıca ve doğru şekilde yapılıyordu, dropdown'un varsayılanı buna hiç
// ihtiyaç duymuyordu.
//
// Düzeltme: dropdown varsayılanı artık `defaultTemplateKeyForBank(bank)`
// (isLandOwnership argümanı OLMADAN) çağrılıyor — bu her zaman listede
// GERÇEKTEN VAR OLAN (görünür) anahtarı döndürür.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

// --- 1) Kaynak-düzeyi: appendBankTemplateExportBlock artık dropdown -------
//        varsayılanı için isLandPropertyForBankTemplate() GEÇMİYOR.
function extractFnBody(source, name) {
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

const blockFnSrc = extractFnBody(appSource, "appendBankTemplateExportBlock");
assert.match(
  blockFnSrc,
  /const defaultKey = window\.RaporTemplates\.defaultTemplateKeyForBank\(state\.fields\.bank\);/,
  "appendBankTemplateExportBlock hala dropdown varsayilanini isLandPropertyForBankTemplate() ile hesapliyor — gizli (hiddenFromList) anahtar secilip dropdown bos kalabilir."
);
assert.match(
  blockFnSrc,
  /resolveTemplateKeyForExport\(select\.value, isLandPropertyForBankTemplate\(\)\)/,
  "Export tiklama aninda arsa-arazi yonlendirmesi (resolveTemplateKeyForExport) kaybolmus — bu KORUNMALIYDI, yalnizca dropdown varsayilani degismeliydi."
);

console.log("appendBankTemplateExportBlock kaynak-duzeyi kablolama testi tamam.");

// --- 2) Davranissal: defaultTemplateKeyForBank(bank) [isLandOwnership -----
//        OLMADAN] her zaman GORUNUR (hiddenFromList olmayan) anahtari
//        donduruyor mu? Gercek TEMPLATE_REGISTRY sekliyle (ziraat VE
//        kuveytturk arsa-arazi ciftleri) test edilir.
function sliceFn(source, marker) {
  const s = source.indexOf(marker);
  assert(s >= 0, `Bulunamadi: ${marker}`);
  const e = source.indexOf("\n  }", s) + 4;
  return source.slice(s, e);
}

const registryStart = engineSource.indexOf("const TEMPLATE_REGISTRY = [");
const registryEnd = engineSource.indexOf("\n  ];", registryStart);
const registrySlice = engineSource.slice(registryStart, registryEnd);
const registryEntries = [...registrySlice.matchAll(/\{\s*key:\s*"([a-z0-9-]+)"[^}]*\}/g)].map((m) => m[0]);

function parseRegistryEntry(text) {
  const key = /key:\s*"([a-z0-9-]+)"/.exec(text)?.[1] || "";
  const bankMatch = /bank:\s*"([^"]*)"/.exec(text);
  const variantMatch = /variant:\s*"([a-z-]+)"/.exec(text);
  const hidden = /hiddenFromList:\s*true/.test(text);
  return {
    key,
    file: `templates/${key}.html`,
    bank: bankMatch ? bankMatch[1] : "",
    variant: variantMatch ? variantMatch[1] : undefined,
    hiddenFromList: hidden || undefined,
  };
}
const realRegistry = registryEntries.map(parseRegistryEntry);

const context = { TEMPLATE_REGISTRY: realRegistry };
vm.createContext(context);
vm.runInContext(sliceFn(engineSource, "function defaultTemplateKeyForBank("), context);
vm.runInContext(sliceFn(engineSource, "function resolveTemplateKeyForExport("), context);

const dropdownVisibleKeys = new Set(realRegistry.filter((e) => !e.hiddenFromList).map((e) => e.key));
const banksWithLandVariant = [...new Set(
  realRegistry.filter((e) => e.hiddenFromList).map((e) => e.bank)
)].filter(Boolean);
assert(banksWithLandVariant.length >= 2, "En az Ziraat ve Kuveyt Turk arsa-arazi ciftleri kayitli olmali (regresyon icin cesitlilik gerekli).");

banksWithLandVariant.forEach((bank) => {
  // Dropdown varsayilani: isLandOwnership argumanSIZ cagri, HER ZAMAN
  // listede gercekten var olan (gorunur) bir anahtar donmeli.
  const dropdownDefault = context.defaultTemplateKeyForBank(bank);
  assert(dropdownDefault, `"${bank}" icin dropdown varsayilani bos donuyor.`);
  assert(
    dropdownVisibleKeys.has(dropdownDefault),
    `"${bank}" icin dropdown varsayilani ("${dropdownDefault}") acilir listede YOK (gizli anahtar donmus olabilir) — select.value bosa duser.`
  );

  // Export aninda arsa/arazi mulkiyette dogru sekilde GIZLI varyanta
  // yonlendirmeli (bu davranis KORUNMALI, degismedi).
  const exportKey = context.resolveTemplateKeyForExport(dropdownDefault, true);
  assert.notEqual(exportKey, dropdownDefault, `"${bank}" icin arsa/arazi mulkiyette export anahtari hala gorunur/konut anahtariyla ayni — yonlendirme calismiyor olabilir.`);
  const exportEntry = realRegistry.find((e) => e.key === exportKey);
  assert(exportEntry?.hiddenFromList, `"${bank}" icin export anahtari ("${exportKey}") arsa-arazi varyanti degil.`);

  // Konut mulkiyette export anahtari, dropdown'daki gorunur anahtarla AYNI kalmali.
  const exportKeyKonut = context.resolveTemplateKeyForExport(dropdownDefault, false);
  assert.equal(exportKeyKonut, dropdownDefault, `"${bank}" icin konut mulkiyette export anahtari dropdown varsayilanindan farkli.`);
});

console.log(`Dropdown-varsayilani / export-yonlendirmesi davranissal testi tamam (${banksWithLandVariant.length} banka: ${banksWithLandVariant.join(", ")}).`);

console.log("Banka sablonu dropdown varsayilani testleri basarili.");
