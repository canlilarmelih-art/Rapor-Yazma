"use strict";

// Kuveyt Türk arsa/arazi banka şablonu (0.0.42x, 2026-08-13): kullanıcı
// INVEX portalının arsa/arazi ekranlarını 3 ekran görüntüsüyle gönderdi ve
// "konut raporlarına göre değişiklik olan kısımları" içeren yeni bir şablon
// istedi. Bu test, templates/ziraat-arsa-arazi.html emsalindeki iki-registry
// (TEMPLATE_REGISTRY + PRIVATE_REPORT_TEMPLATES) senkronunu ve otomatik
// varyant seçim mekanizmasının (defaultTemplateKeyForBank/
// resolveTemplateKeyForExport) yeni "kuveytturk-arsa-arazi" anahtarı için de
// doğru çalıştığını doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const serverSource = fs.readFileSync(path.join(appDir, "server.js"), "utf8");
const templatePath = path.join(appDir, "templates", "kuveytturk-arsa-arazi.html");
const templateSource = fs.readFileSync(templatePath, "utf8");

// --- 1) TEMPLATE_REGISTRY girdisi doğru şekilde tanımlı mı? -----------------
const registryStart = engineSource.indexOf("const TEMPLATE_REGISTRY = [");
const registryEnd = engineSource.indexOf("\n  ];", registryStart);
assert(registryStart >= 0 && registryEnd > registryStart, "TEMPLATE_REGISTRY bulunamadi.");
const registrySlice = engineSource.slice(registryStart, registryEnd);

const kuveytEntryMatch = registrySlice.match(/\{\s*key:\s*"kuveytturk-arsa-arazi"[^}]*\}/);
assert(kuveytEntryMatch, "TEMPLATE_REGISTRY icinde kuveytturk-arsa-arazi girdisi bulunamadi.");
const kuveytEntryText = kuveytEntryMatch[0];
assert.match(kuveytEntryText, /file:\s*"templates\/kuveytturk-arsa-arazi\.html"/, "Dosya yolu yanlis.");
assert.match(kuveytEntryText, /variant:\s*"arsa-arazi"/, "variant: \"arsa-arazi\" isaretlenmemis.");
assert.match(kuveytEntryText, /hiddenFromList:\s*true/, "hiddenFromList: true olmali (acilir listede ayri gorunmemeli).");
assert.match(kuveytEntryText, /bank:\s*"Kuveyt Türk Katılım Bankası A\.Ş\."/, "Banka adi konut varyantiyla birebir eslesmiyor.");

const konutEntryMatch = registrySlice.match(/\{\s*key:\s*"kuveytturk"[^}]*\}/);
assert(konutEntryMatch, "TEMPLATE_REGISTRY icinde konut kuveytturk girdisi bulunamadi.");
assert.match(konutEntryMatch[0], /bank:\s*"Kuveyt Türk Katılım Bankası A\.Ş\."/, "Konut varyanti banka adi degismis (arsa-arazi eslesmesi kirilir).");

console.log("TEMPLATE_REGISTRY kuveytturk-arsa-arazi girdisi testi tamam.");

// --- 2) server.js PRIVATE_REPORT_TEMPLATES ile senkron mu? -----------------
assert.match(
  serverSource,
  /"kuveytturk-arsa-arazi":\s*"kuveytturk-arsa-arazi\.html"/,
  "server.js PRIVATE_REPORT_TEMPLATES icinde kuveytturk-arsa-arazi eslemesi yok."
);
assert(fs.existsSync(templatePath), "templates/kuveytturk-arsa-arazi.html diskte yok.");

console.log("server.js PRIVATE_REPORT_TEMPLATES senkron testi tamam.");

// --- 3) Otomatik varyant secimi: defaultTemplateKeyForBank / -----------------
//        resolveTemplateKeyForExport gercek kaynaktan calistirilir.
function sliceFn(source, marker) {
  const s = source.indexOf(marker);
  assert(s >= 0, `Bulunamadi: ${marker}`);
  const e = source.indexOf("\n  }", s) + 4;
  return source.slice(s, e);
}

const context = {
  TEMPLATE_REGISTRY: [
    { key: "kuveytturk", file: "templates/kuveytturk.html", bank: "Kuveyt Türk Katılım Bankası A.Ş." },
    { key: "kuveytturk-arsa-arazi", file: "templates/kuveytturk-arsa-arazi.html", bank: "Kuveyt Türk Katılım Bankası A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "ziraat", file: "templates/ziraat.html", bank: "T.C. Ziraat Bankası A.Ş." },
    { key: "ziraat-arsa-arazi", file: "templates/ziraat-arsa-arazi.html", bank: "T.C. Ziraat Bankası A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "halkbank", file: "templates/halkbank.html", bank: "Türkiye Halk Bankası A.Ş." },
  ],
};
vm.createContext(context);
vm.runInContext(sliceFn(engineSource, "function defaultTemplateKeyForBank("), context);
vm.runInContext(sliceFn(engineSource, "function resolveTemplateKeyForExport("), context);

assert.equal(
  context.defaultTemplateKeyForBank("Kuveyt Türk Katılım Bankası A.Ş.", true),
  "kuveytturk-arsa-arazi",
  "Arsa/Arazi mulkiyetinde Kuveyt Turk icin arsa-arazi varyanti secilmedi."
);
assert.equal(
  context.defaultTemplateKeyForBank("Kuveyt Türk Katılım Bankası A.Ş.", false),
  "kuveytturk",
  "Konut mulkiyetinde Kuveyt Turk icin konut varyanti secilmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk", true),
  "kuveytturk-arsa-arazi",
  "resolveTemplateKeyForExport('kuveytturk', true) arsa-arazi anahtarina yonlendirmedi."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk", false),
  "kuveytturk",
  "resolveTemplateKeyForExport('kuveytturk', false) konut anahtarini bozdu."
);
assert.equal(
  context.resolveTemplateKeyForExport("kuveytturk-arsa-arazi", false),
  "kuveytturk",
  "Kullanici arsa-arazi anahtarini secip mulkiyeti sonradan konuta cevirirse konut varyantina donmeli."
);
// Banka-bagimsiz sablonlar (bank alani bos/yok) etkilenmemeli.
assert.equal(
  context.resolveTemplateKeyForExport("halkbank", true),
  "halkbank",
  "Tek varyantli banka sablonu (Halkbank) yanlislikla degistirildi."
);

console.log("Otomatik arsa-arazi varyant secimi (defaultTemplateKeyForBank/resolveTemplateKeyForExport) testi tamam.");

// --- 4) Yeni sablonun arazi-ozgu placeholder'lari icerdigini dogrula --------
[
  "ARSA BİLGİLERİ",
  "{{LAND_SHAPE}}",
  "{{LAND_TOPOGRAPHY}}",
  "{{LAND_ROAD_FRONTAGE}}",
  "{{LAND_BOUNDARY_ELEMENT}}",
  "{{LAND_CLASSIFICATION}}",
  "{{LAND_AGRICULTURAL_PRODUCT}}",
  "{{LAND_NOTE}}",
  "{{ACTUAL_USE_PURPOSE}}",
  "TİCARİ FİYAT ENDEKSİ ÖZELLİKLERİ",
  "{{GABIM_TRANSPORTATION}}",
  "{{GABIM_ROAD_FRONTAGE}}",
  "{{GABIM_LAND_SLOPE}}",
  "{{GABIM_ARABLE_SOIL}}",
  "{{GABIM_AGRICULTURE_TYPE}}",
  "{{GABIM_MAJOR_INVESTMENT}}",
  "{{GABIM_BRANDED_HOUSING}}",
  "{{GABIM_DEVELOPMENT_SPEED}}",
  "{{GABIM_COMMERCIAL_SPEED}}",
  "{{GABIM_INDUSTRIALIZATION_SPEED}}",
  "{{GABIM_TOURISM_POTENTIAL}}",
  "{{GABIM_PREFERRED_USE}}",
  "{{ALTYAPI}}",
].forEach((needle) => {
  assert(templateSource.includes(needle), `kuveytturk-arsa-arazi.html icinde beklenen icerik yok: ${needle}`);
});
// Bina/bagimsiz bolume ozgu (arazide karsiligi olmayan) bolumler kaldirilmis
// olmali — yalnizca aciklayici HTML yorumunda gecmesi (neden kaldirildigini
// belgelemek icin) sorun degil, bu yuzden baslik/etiket HALINDE aranir.
["<div class=\"kt-sec\">GAYRİMENKULÜN TEKNİK ÖZELLİKLERİ</div>", "{{UNİT_VİEW_STATUS}}", "{{FACADES}}", "{{ELEVATOR}}", "{{CARPARK}}", "<div class=\"kt-sec\">ENERJİ KİMLİK BİLGİSİ</div>"].forEach((needle) => {
  assert(!templateSource.includes(needle), `kuveytturk-arsa-arazi.html hala bina-ozgu icerik barindiriyor: ${needle}`);
});

console.log("kuveytturk-arsa-arazi.html arazi-ozgu placeholder icerigi testi tamam.");

// --- 5) LAND_* token'larinin gercekten field-fold ile cozulecegi field --------
//        anahtarlari app.js'te hala mevcut mu (isim degisirse sessizce
//        bosa duser).
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
["landShape", "landTopography", "landRoadFrontage", "landClassification", "landBoundaryElement", "landAgriculturalProduct", "landNote"].forEach((key) => {
  assert(
    new RegExp(`key:\\s*"${key}"`).test(appSource),
    `app.js icinde "${key}" alan anahtari bulunamadi (LAND_* placeholder'lari bosa dusebilir).`
  );
});

console.log("LAND_* placeholder field-anahtari varligi testi tamam.");

console.log("Kuveyt Turk arsa/arazi sablonu testleri basarili.");
