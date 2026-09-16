"use strict";

// Akbank Müstakil Bina banka şablonu (0.0.81x, 2026-09-17, pilot): kullanıcı
// talebi "müstakil bina formatlarını ... yazma aşamasına geldik" —
// AskUserQuestion ile netleştirildi: (1) önce tek pilot (Akbank), (2)
// "Bağımsız Bölüm" bölümleri komple kaldırılıp "Bina Özellikleri" olarak
// birleştirilir (müstakil binada "bina" ile "bağımsız bölüm" AYNI fiziksel
// varlıktır). Bu test, templates/akbank-arsa-arazi.html emsalindeki
// iki-registry (TEMPLATE_REGISTRY + PRIVATE_REPORT_TEMPLATES) senkronunu ve
// otomatik varyant seçim mekanizmasının (artık 3 yönlü: temel/arsa-arazi/
// mustakil-bina) yeni "akbank-mustakil-bina" anahtarı için de doğru
// çalıştığını doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const serverSource = fs.readFileSync(path.join(appDir, "server.js"), "utf8");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const templatePath = path.join(appDir, "templates", "akbank-mustakil-bina.html");
const templateSource = fs.readFileSync(templatePath, "utf8");

// --- 1) TEMPLATE_REGISTRY girdisi doğru şekilde tanımlı mı? -----------------
const registryStart = engineSource.indexOf("const TEMPLATE_REGISTRY = [");
const registryEnd = engineSource.indexOf("\n  ];", registryStart);
assert(registryStart >= 0 && registryEnd > registryStart, "TEMPLATE_REGISTRY bulunamadi.");
const registrySlice = engineSource.slice(registryStart, registryEnd);

const mustakilEntryMatch = registrySlice.match(/\{\s*key:\s*"akbank-mustakil-bina"[^}]*\}/);
assert(mustakilEntryMatch, "TEMPLATE_REGISTRY icinde akbank-mustakil-bina girdisi bulunamadi.");
const mustakilEntryText = mustakilEntryMatch[0];
assert.match(mustakilEntryText, /file:\s*"templates\/akbank-mustakil-bina\.html"/, "Dosya yolu yanlis.");
assert.match(mustakilEntryText, /variant:\s*"mustakil-bina"/, "variant: \"mustakil-bina\" isaretlenmemis.");
assert.match(mustakilEntryText, /hiddenFromList:\s*true/, "hiddenFromList: true olmali (acilir listede ayri gorunmemeli).");
assert.match(mustakilEntryText, /bank:\s*"Akbank T\.A\.Ş\."/, "Banka adi konut varyantiyla birebir eslesmiyor.");

const konutEntryMatch = registrySlice.match(/\{\s*key:\s*"akbank"[^}]*\}/);
assert(konutEntryMatch, "TEMPLATE_REGISTRY icinde konut akbank girdisi bulunamadi.");
assert.match(konutEntryMatch[0], /bank:\s*"Akbank T\.A\.Ş\."/, "Konut varyanti banka adi degismis (mustakil-bina eslesmesi kirilir).");

console.log("TEMPLATE_REGISTRY akbank-mustakil-bina girdisi testi tamam.");

// --- 2) server.js PRIVATE_REPORT_TEMPLATES ile senkron mu? -----------------
assert.match(
  serverSource,
  /"akbank-mustakil-bina":\s*"akbank-mustakil-bina\.html"/,
  "server.js PRIVATE_REPORT_TEMPLATES icinde akbank-mustakil-bina eslemesi yok."
);
assert(fs.existsSync(templatePath), "templates/akbank-mustakil-bina.html diskte yok.");

console.log("server.js PRIVATE_REPORT_TEMPLATES senkron testi tamam.");

// --- 3) Otomatik varyant secimi: defaultTemplateKeyForBank / ---------------
//        resolveTemplateKeyForExport artik UC YONLU (temel/arsa-arazi/
//        mustakil-bina) — geriye donuk uyumluluk (2 parametreli eski
//        cagrilar) DA korunmus olmali.
function sliceFn(source, marker) {
  const s = source.indexOf(marker);
  assert(s >= 0, `Bulunamadi: ${marker}`);
  const e = source.indexOf("\n  }", s) + 4;
  return source.slice(s, e);
}

const context = {
  TEMPLATE_REGISTRY: [
    { key: "akbank", file: "templates/akbank.html", bank: "Akbank T.A.Ş." },
    { key: "akbank-arsa-arazi", file: "templates/akbank-arsa-arazi.html", bank: "Akbank T.A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "akbank-mustakil-bina", file: "templates/akbank-mustakil-bina.html", bank: "Akbank T.A.Ş.", variant: "mustakil-bina", hiddenFromList: true },
    { key: "halkbank", file: "templates/halkbank.html", bank: "Türkiye Halk Bankası A.Ş." },
  ],
};
vm.createContext(context);
vm.runInContext(sliceFn(engineSource, "function defaultTemplateKeyForBank("), context);
vm.runInContext(sliceFn(engineSource, "function resolveTemplateKeyForExport("), context);

// Geriye donuk uyumluluk: eski 2-parametreli cagrilar (isMustakilBina hic
// verilmeden) davranisi BOZMAMALI.
assert.equal(
  context.defaultTemplateKeyForBank("Akbank T.A.Ş.", true),
  "akbank-arsa-arazi",
  "Arsa/Arazi mulkiyetinde Akbank icin arsa-arazi varyanti secilmedi (regresyon)."
);
assert.equal(
  context.defaultTemplateKeyForBank("Akbank T.A.Ş.", false),
  "akbank",
  "Konut mulkiyetinde Akbank icin konut varyanti secilmedi (regresyon)."
);

// Yeni 3. parametre: Musttakil Bina.
assert.equal(
  context.defaultTemplateKeyForBank("Akbank T.A.Ş.", false, true),
  "akbank-mustakil-bina",
  "Mustakil Bina mulkiyetinde Akbank icin mustakil-bina varyanti secilmedi."
);
assert.equal(
  context.defaultTemplateKeyForBank("Akbank T.A.Ş.", false, false),
  "akbank",
  "Her iki bayrak da false iken konut varyanti secilmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("akbank", false, true),
  "akbank-mustakil-bina",
  "resolveTemplateKeyForExport('akbank', false, true) mustakil-bina anahtarina yonlendirmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("akbank-mustakil-bina", false, false),
  "akbank",
  "Kullanici mustakil-bina anahtarini secip mulkiyeti sonradan konuta cevirirse konut varyantina donmeli."
);
assert.equal(
  context.resolveTemplateKeyForExport("akbank-mustakil-bina", true, false),
  "akbank-arsa-arazi",
  "Ayni raporda mulkiyet Arsa/Tarla'ya cevrilirse arsa-arazi varyantina donmeli (Mustakil Bina anahtari degil)."
);
// Banka-bagimsiz sablonlar (tek varyantli) etkilenmemeli.
assert.equal(
  context.resolveTemplateKeyForExport("halkbank", false, true),
  "halkbank",
  "Tek varyantli banka sablonu (Halkbank) yanlislikla degistirildi."
);

console.log("Uc yonlu otomatik varyant secimi (defaultTemplateKeyForBank/resolveTemplateKeyForExport) testi tamam.");

// --- 4) isMustakilBinaOwnershipType/isMustakilBinaPropertyForBankTemplate --
//        GERCEK kaynaktan calistirilir.
function extractFunctionSource(source, name) {
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

{
  const appContext = { state: { fields: {} }, foldTurkish: undefined };
  vm.createContext(appContext);
  ["foldTurkish", "normalizeOwnershipTypeForSectionVisibility", "isLandOwnershipType", "isMustakilBinaOwnershipType", "isMustakilBinaPropertyForBankTemplate"].forEach((name) => {
    vm.runInContext(extractFunctionSource(appSource, name), appContext);
  });

  appContext.state.fields.ownershipType = "Müstakil Bina";
  assert.equal(appContext.isMustakilBinaOwnershipType(), true, "'Müstakil Bina' icin isMustakilBinaOwnershipType true donmedi.");
  assert.equal(appContext.isMustakilBinaPropertyForBankTemplate(), true, "'Müstakil Bina' icin isMustakilBinaPropertyForBankTemplate true donmedi.");

  appContext.state.fields.ownershipType = "Arsa";
  assert.equal(appContext.isMustakilBinaOwnershipType(), false, "'Arsa' icin isMustakilBinaOwnershipType yanlislikla true.");

  appContext.state.fields.ownershipType = "Dikey Kat İrtifakı";
  assert.equal(appContext.isMustakilBinaOwnershipType(), false, "'Dikey Kat İrtifakı' icin isMustakilBinaOwnershipType yanlislikla true.");

  appContext.state.fields.ownershipType = "";
  assert.equal(appContext.isMustakilBinaOwnershipType(), false, "Bos mulkiyette isMustakilBinaOwnershipType yanlislikla true.");

  console.log("isMustakilBinaOwnershipType/isMustakilBinaPropertyForBankTemplate gercek-kaynak testi tamam.");
}

// --- 5) Export tiklama noktasi: appendBankTemplateExportBlock artik --------
//        isMustakilBinaPropertyForBankTemplate()'i de resolveTemplateKeyForExport'a
//        geciriyor mu (kaynak-duzeyi kablolama kontrolu).
assert.match(
  appSource,
  /resolveTemplateKeyForExport\(select\.value, isLandPropertyForBankTemplate\(\), isMustakilBinaPropertyForBankTemplate\(\)\)/,
  "appendBankTemplateExportBlock artik export tiklaninca Mustakil Bina bayragini gecirmiyor."
);
console.log("appendBankTemplateExportBlock Mustakil Bina kablolamasi testi tamam.");

// --- 6) Şablon içeriği: "Bağımsız Bölüm" tamamen kaldırılmış, "Bina --------
//        Özellikleri" ile birleştirilmiş olmalı; Değerleme bölümü token
//        sırası (test-bank-templates.js'in genel kontrolüyle AYNI liste)
//        Akbank'ın konut varyantıyla BİREBİR aynı kalmalı (bu dosyada ayrıca
//        doğrulanır, çünkü test-bank-templates.js templates/*.html'i
//        otomatik keşfeder ve bu dosya da o taramaya dahildir).
[
  "Bina Özellikleri",
  "{{TASINMAZLARBINATABLOSU}}",
].forEach((needle) => {
  assert(templateSource.includes(needle), `akbank-mustakil-bina.html icinde beklenen icerik yok: ${needle}`);
});
// Not: dosyanin ust-bilgi HTML yorumu ("neden kaldirildi" aciklamasi) bu
// basliklardan BAHSETMESI beklenir (bkz. dosyanin <!-- --> yorumu) — bu
// yuzden bare substring yerine GERCEK baslik etiketi HALINDE aranir
// (kuveytturk-arsa-arazi testindeki AYNI ilke).
[
  "<h3>Bağımsız Bölümün Bilgileri</h3>",
  "<h2>Ana Gayrimenkulün Fiziksel Özellikleri</h2>",
  "{{TASINMAZLARBAGIMSIZBOLUMTABLOSU}}",
  "BİNADAKİ BAĞIMSIZ BÖLÜM SAYISI",
].forEach((needle) => {
  assert(!templateSource.includes(needle), `akbank-mustakil-bina.html hala bagimsiz-bolum-ozgu icerik barindiriyor: ${needle}`);
});

console.log("akbank-mustakil-bina.html Bina Ozellikleri birlesimi icerik testi tamam.");

console.log("Akbank Mustakil Bina sablonu testleri basarili.");
