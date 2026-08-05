"use strict";

/*
  Kullanici talebi: "adres ve konum bölümünde bulunan il, ilçe İdari
  Mahalle Site / Apartman Blok Kat Dış Kapı No Cadde/Sokak bölümleri ile
  Tapu ve mülkiyet bölümünde bulunan il içe tapu mahalle mevkii pafta
  bağımsız bölüm niteliği blok tapu katı ana taşınmaz niteliği eklenti,
  malik yada malikler edinme sebebi bölümleri tek placeholder olarak
  tablolarda kullanılırken daima tamamı büyükharf olarak export edilsin.
  ancak paragraflarda cümle içinde kullanımlarda türkçe dilbilgisi
  kurallarına uygun olarak kullanılsın." — bu 20 alan icin AYRI "_BÜYÜK"
  token ailesi eklendi (mevcut duz token'lar DEGISMEDI, cumle ici kullanim
  icin kullanicinin girdigi bicimde kaliyor); "_BÜYÜK" ailesi Turkce
  kurallarina uygun (İ/ı dahil) buyuk harfe cevirir.

  ONEMLI bulgu: Tapu ve Mulkiyet bolumundeki 10 metin alani (titleQuality,
  titleBlockName, ...) app.js'teki titleTextUppercaseKeys mekanizmasi
  yuzunden GIRIS ANINDA ZATEN buyuk harfe zorlanip oyle saklaniyor — yani
  bu alanlarin DUZ token'i (ornek {{TITLE_QUALITY}}) tablo kullanimi icin
  ZATEN dogru (buyuk harf), ama CUMLE ICINDE kullanilirsa da buyuk harf
  gelip Turkce dilbilgisine AYKIRI olurdu. Bu yuzden bu 10 alan icin AYRICA
  "_DUZGUN" (normalizeReportTitleText ile Bas Harfleri Buyuk) aile eklendi.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function sliceAppFn(marker) {
  const start = appSource.indexOf(marker);
  assert(start >= 0, `app.js icinde bulunamadi: ${marker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

process.env.NODE_ENV = "test";
const sandboxWindow = {};

// normalizeReportTitleText ve TUM bagimliliklari (foldTurkish,
// toTitleCaseTr, normalizeReportWhitespace, normalizeReportProperPhrases,
// preserveReportSpecialWords) AYNI vm baglaminda GERCEK app.js
// kaynagindan calistirilip globalThis'e aktarilir — safeCall("normalizeReportTitleText", ...)
// bunu globalThis uzerinden bulur.
const normalizeFnSrc = [
  sliceAppFn("function foldTurkish("),
  sliceAppFn("function toTitleCaseTr("),
  sliceAppFn("function normalizeReportWhitespace("),
  sliceAppFn("function normalizeReportProperPhrases("),
  sliceAppFn("function escapeRegExp("),
  sliceAppFn("function preserveReportSpecialWords("),
  sliceAppFn("function normalizeReportTitleText("),
].join("\n");
const normalizeContext = {};
vm.createContext(normalizeContext);
vm.runInContext(normalizeFnSrc, normalizeContext);
globalThis.normalizeReportTitleText = normalizeContext.normalizeReportTitleText;

const stubState = {
  fields: {
    city: "İstanbul",
    district: "Beşiktaş",
    neighborhood: "Levent Mahallesi",
    addressSiteName: "Yeşil Vadi Sitesi",
    addressBlockName: "C Blok",
    addressFloor: "3",
    outerDoor: "12",
    street: "Çınar Sokak",
    // Tapu ve Mülkiyet bölümü metin alanları GERÇEKTE app.js'teki
    // titleTextUppercaseKeys mekanizmasıyla GİRİŞ ANINDA büyük harfe
    // zorlanıp öyle saklanıyor (bkz. app.js satır ~1971) — test verisi
    // bu gerçek durumu birebir yansıtıyor (küçük harfle değil).
    titleCity: "İZMİR",
    titleDistrict: "KARŞIYAKA",
    titleNeighborhood: "BOSTANLI MAHALLESİ",
    locationName: "ÖRNEK MEVKİİ",
    sheetNo: "F19",
    titleQuality: "MESKEN",
    titleBlockName: "D BLOK",
    titleFloor: "5",
    mainPropertyQuality: "BETONARME KARKAS APARTMAN",
    titleAttachment: "KÖMÜRLÜK",
  },
  tables: {
    title: [
      { c0: "Ali Veli", c1: "1/2", c2: "Satış" },
      { c0: "İnci Şahin", c1: "1/2", c2: "Satış" },
    ],
  },
};
const stubSections = [{
  id: "test",
  fields: Object.keys(stubState.fields).map((key) => ({ key, type: "text" })),
}];

function stubEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const loader = new Function(
  "window", "state", "sections", "collectGeneratedTextPlaceholders",
  "escapeHtml", "formatWordParagraphs", "dateIsoToTr", "parseValuationNumber", "formatSchemeNumber",
  engineSource
);
loader(
  sandboxWindow,
  stubState,
  stubSections,
  () => [],
  stubEscapeHtml,
  (text, paragraphClass) => {
    const classAttr = paragraphClass ? ` class="${stubEscapeHtml(paragraphClass)}"` : "";
    return `<p${classAttr}>${stubEscapeHtml(text)}</p>`;
  },
  (iso) => String(iso || ""),
  (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
  (value) => new Intl.NumberFormat("tr-TR").format(value)
);

const engine = sandboxWindow.RaporTemplates;
assert.ok(engine, "window.RaporTemplates olusmadi.");

// --- 1) Adres ve Konum bolumu — 8 alan --------------------------------
{
  const cases = [
    ["CITY_BUYUK", "İSTANBUL"],
    ["DISTRICT_BUYUK", "BEŞİKTAŞ"],
    ["NEIGHBORHOOD_BUYUK", "LEVENT MAHALLESİ"],
    ["ADDRESS_SITE_NAME_BUYUK", "YEŞİL VADİ SİTESİ"],
    ["ADDRESS_BLOCK_NAME_BUYUK", "C BLOK"],
    ["ADDRESS_FLOOR_BUYUK", "3"],
    ["OUTER_DOOR_BUYUK", "12"],
    ["STREET_BUYUK", "ÇINAR SOKAK"],
  ];
  cases.forEach(([token, expected]) => {
    const resolved = engine.resolveToken(token);
    assert.ok(resolved.ok, `{{${token}}} cozulemedi.`);
    assert.equal(resolved.html, expected, `{{${token}}} -> "${expected}" beklenirken "${resolved.html}" geldi.`);
  });
  console.log("Adres ve Konum buyuk harf token'lari (8 alan) testi tamam.");
}

// --- 2) Tapu ve Mulkiyet bolumu — 10 alan ------------------------------
{
  const cases = [
    ["TITLE_CITY_BUYUK", "İZMİR"],
    ["TITLE_DISTRICT_BUYUK", "KARŞIYAKA"],
    ["TITLE_NEIGHBORHOOD_BUYUK", "BOSTANLI MAHALLESİ"],
    ["LOCATION_NAME_BUYUK", "ÖRNEK MEVKİİ"],
    ["SHEET_NO_BUYUK", "F19"],
    ["TITLE_QUALITY_BUYUK", "MESKEN"],
    ["TITLE_BLOCK_NAME_BUYUK", "D BLOK"],
    ["TITLE_FLOOR_BUYUK", "5"],
    ["MAIN_PROPERTY_QUALITY_BUYUK", "BETONARME KARKAS APARTMAN"],
    ["TITLE_ATTACHMENT_BUYUK", "KÖMÜRLÜK"],
  ];
  cases.forEach(([token, expected]) => {
    const resolved = engine.resolveToken(token);
    assert.ok(resolved.ok, `{{${token}}} cozulemedi.`);
    assert.equal(resolved.html, expected, `{{${token}}} -> "${expected}" beklenirken "${resolved.html}" geldi.`);
  });
  console.log("Tapu ve Mulkiyet buyuk harf token'lari (10 alan) testi tamam.");
}

// --- 3) Malik/Malikler + Edinme Sebebi ---------------------------------
{
  const malik = engine.resolveToken("MALIK_BUYUK");
  const malikler = engine.resolveToken("MALIKLER_BUYUK");
  assert.equal(malik.html, "ALİ VELİ, İNCİ ŞAHİN", `MALIK_BUYUK yanlis: ${malik.html}`);
  assert.equal(malikler.html, "ALİ VELİ, İNCİ ŞAHİN", `MALIKLER_BUYUK yanlis: ${malikler.html}`);

  const edinme = engine.resolveToken("EDINME_SEBEBI_BUYUK");
  assert.equal(edinme.html, "SATIŞ", `EDINME_SEBEBI_BUYUK yanlis: ${edinme.html}`);

  // emlakkatilim.docx kapak tablosunun "Malik" hucresi SAHIPLER'i
  // (isim+hisse birlesik, ör. "Ali Veli (1/2)") kullaniyor — ayni verinin
  // buyuk harfli hali.
  const sahiplerBuyuk = engine.resolveToken("SAHIPLER_BUYUK");
  assert.equal(sahiplerBuyuk.html, "ALİ VELİ (1/2), İNCİ ŞAHİN (1/2)", `SAHIPLER_BUYUK yanlis: ${sahiplerBuyuk.html}`);

  console.log("Malik/Malikler ve Edinme Sebebi buyuk harf token'lari testi tamam.");
}

// --- 4) Regresyon: Adres bolumu duz token'lari (cumle ici kullanim
// icin) HALA kullanicinin girdigi bicimde (buyuk harfe ZORLANMADAN)
// donmeli — bu alanlar titleTextUppercaseKeys mekanizmasina TABI DEGIL. --
{
  const cases = [
    ["CITY", "İstanbul"],
    ["SAHIPLER", "Ali Veli (1/2), İnci Şahin (1/2)"],
    ["EDINMESEBEBI", "Satış"],
  ];
  cases.forEach(([token, expected]) => {
    const resolved = engine.resolveToken(token);
    assert.ok(resolved.ok, `{{${token}}} cozulemedi.`);
    assert.equal(resolved.html, expected, `Duz {{${token}}} token'i buyuk harfe zorlanmis olabilir (regresyon): "${expected}" beklenirken "${resolved.html}" geldi.`);
  });
  console.log("Adres bolumu duz (cumle ici) token'larinin buyuk harfe zorlanmadigi regresyon testi tamam.");
}

// --- 5) Tapu ve Mulkiyet duz token'lari — GERCEKTE zaten buyuk harf
// (girisde zorlanip oyle saklaniyor, bkz. dosya basi notu) — bu davranis
// DEGISTIRILMEDI, sadece belgelendi/kilitlendi. -------------------------
{
  const cases = [
    ["TAPUNITELIKBB", "MESKEN"],
    ["ANATASINMAZNITELIK", "BETONARME KARKAS APARTMAN"],
  ];
  cases.forEach(([token, expected]) => {
    const resolved = engine.resolveToken(token);
    assert.ok(resolved.ok, `{{${token}}} cozulemedi.`);
    assert.equal(resolved.html, expected, `Duz Tapu token'i beklenenden farkli: "${expected}" beklenirken "${resolved.html}" geldi.`);
  });
  console.log("Tapu bolumu duz token'larinin (zaten buyuk harf) davranisi degismedi testi tamam.");
}

// --- 6) "_DÜZGÜN" (cumle-guvenli, Bas Harfleri Buyuk) aile — Tapu ve
// Mulkiyet'in 10 metin alani icin ----------------------------------------
{
  const cases = [
    ["TITLE_CITY_DUZGUN", "İzmir"],
    ["TITLE_DISTRICT_DUZGUN", "Karşıyaka"],
    ["TITLE_NEIGHBORHOOD_DUZGUN", "Bostanlı Mahallesi"],
    ["LOCATION_NAME_DUZGUN", "Örnek Mevkii"],
    ["TITLE_QUALITY_DUZGUN", "Mesken"],
    ["TITLE_BLOCK_NAME_DUZGUN", "D Blok"],
    ["MAIN_PROPERTY_QUALITY_DUZGUN", "Betonarme Karkas Apartman"],
  ];
  cases.forEach(([token, expected]) => {
    const resolved = engine.resolveToken(token);
    assert.ok(resolved.ok, `{{${token}}} cozulemedi.`);
    assert.equal(resolved.html, expected, `{{${token}}} -> "${expected}" beklenirken "${resolved.html}" geldi.`);
  });
  console.log("Tapu ve Mulkiyet 'duzgun' (cumle-guvenli) token'lari testi tamam.");
}

// --- 7) Uygulama ici "Placeholder" referans ekrani — collectGeneratedTextPlaceholders
// katalogunda TUM yeni "_BUYUK"/"_DUZGUN" token'lari icin satir olmali
// (bu proje icin bilinen tekrar eden bir kusur: fn-tabanli/hesaplanan
// token'lar bu katalogda AYRICA elle listelenmezse UI referans ekraninda
// hic gorunmuyor — bkz. handoff 0.0.319/0.0.323). --------------------
{
  const expectedKeys = [
    "CITY_BUYUK", "DISTRICT_BUYUK", "NEIGHBORHOOD_BUYUK", "ADDRESS_SITE_NAME_BUYUK",
    "ADDRESS_BLOCK_NAME_BUYUK", "ADDRESS_FLOOR_BUYUK", "OUTER_DOOR_BUYUK", "STREET_BUYUK",
    "TITLE_CITY_BUYUK", "TITLE_DISTRICT_BUYUK", "TITLE_NEIGHBORHOOD_BUYUK", "LOCATION_NAME_BUYUK",
    "SHEET_NO_BUYUK", "TITLE_QUALITY_BUYUK", "TITLE_BLOCK_NAME_BUYUK", "TITLE_FLOOR_BUYUK",
    "MAIN_PROPERTY_QUALITY_BUYUK", "TITLE_ATTACHMENT_BUYUK", "MALIK_BUYUK", "MALIKLER_BUYUK", "SAHIPLER_BUYUK",
    "EDINME_SEBEBI_BUYUK",
    "TITLE_CITY_DUZGUN", "TITLE_DISTRICT_DUZGUN", "TITLE_NEIGHBORHOOD_DUZGUN", "LOCATION_NAME_DUZGUN",
    "SHEET_NO_DUZGUN", "TITLE_QUALITY_DUZGUN", "TITLE_BLOCK_NAME_DUZGUN", "TITLE_FLOOR_DUZGUN",
    "MAIN_PROPERTY_QUALITY_DUZGUN", "TITLE_ATTACHMENT_DUZGUN",
  ];
  const missingFromCatalog = expectedKeys.filter((key) => !appSource.includes(`key: "${key}"`));
  assert.equal(missingFromCatalog.length, 0, `collectGeneratedTextPlaceholders katalogunda eksik "_BUYUK"/"_DUZGUN" satirlari: ${JSON.stringify(missingFromCatalog)}`);
  console.log("Placeholder referans ekrani katalog kapsami (31 yeni token) testi tamam.");
}

console.log("Buyuk harf tablo placeholder ailesi testi tamam.");
