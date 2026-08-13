"use strict";

// "Sahibinden.com üzerinden ara" düğmesi (0.0.43x, 2026-08-13) — kullanıcı
// bir rakip programın (Ekspress Rapor) Emsaller ekranını örnek gösterip
// "taşınmaz yada taşınmazların konumuna göre bize sahibinden harita
// üzerinden ilanları göstersin" istedi. sahibinden.com'un kendi bot
// koruması otomatik erişimi engellediğinden (canlı doğrulanamadı), İl-İlçe
// düzeyinde sahibinden'in kendi indekslenmiş SEO URL kalıbı kullanıldı
// (gerçek örnekler: sahibinden.com/satilik-arsa/bursa-nilufer,
// .../satilik-daire/bursa, .../satilik-is-yeri/bursa — web aramasıyla
// doğrulandı, bkz. handoff.md). Bu test, URL üretim mantığının GERÇEK
// KAYNAKTAN doğru çalıştığını doğrular.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function extractFunctionSource(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Bulunamadi: ${name}`);
  const braceStart = appSource.indexOf("{", start);
  let depth = 0;
  let i = braceStart;
  for (; i < appSource.length; i++) {
    if (appSource[i] === "{") depth++;
    else if (appSource[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return appSource.slice(start, i);
}

// Kategori esleme sabitini de (const, function-govdesi taramasi yakalamaz)
// ayrica cikarip yukluyoruz.
function extractConstSource(name) {
  const marker = `const ${name} = `;
  const start = appSource.indexOf(marker);
  assert(start >= 0, `Bulunamadi: const ${name}`);
  const end = appSource.indexOf("\n};", start) + 3;
  return appSource.slice(start, end);
}

const closureFnNames = [
  "getSahibindenCategorySlug",
  "buildSahibindenLocationSlugPart",
  "buildSahibindenNeighborhoodSlug",
  "getSelectedMapPoint",
  "getSahibindenSubjectCentroid",
  "buildSahibindenMapBounds",
  "getComparablePortalCategory",
  "buildHepsiemlakSearchUrl",
  "buildEmlakjetSearchUrl",
  "buildSahibindenSearchUrl",
  "foldTurkish",
  "isLandOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
];

function makeContext(fields, extraState = {}) {
  const context = { state: { fields, sourceValues: {}, ...extraState }, URLSearchParams };
  vm.createContext(context);
  vm.runInContext(extractConstSource("SAHIBINDEN_CATEGORY_BY_USAGE_NATURE"), context);
  closureFnNames.forEach((name) => vm.runInContext(extractFunctionSource(name), context));
  return context;
}

// --- 1) Konut: centroid merkezli harita arama ---------------------------
{
  const ctx = makeContext({ currentUsageNature: "Konut", titleCity: "Bursa", titleDistrict: "Nilüfer", latitude: "40.200000", longitude: "28.900000" });
  const url = new URL(ctx.buildSahibindenSearchUrl());
  assert.equal(url.pathname, "/haritada-emlak-arama/emlak/bursa-nilufer");
  assert.equal(url.searchParams.get("viewType"), "map");
  assert.equal(url.searchParams.get("category"), "satilik-daire");
  assert.equal(url.searchParams.get("geoLocation_latitude_north"), "40.226949");
  assert.equal(url.searchParams.get("geoLocation_latitude_south"), "40.173051");
}

// --- 2) Arsa/Tarla/Arazi -> satilik-arsa --------------------------------
["Arsa", "Tarla", "Arazi", "Sanayi Tesisi"].forEach((usage) => {
  const ctx = makeContext({ currentUsageNature: usage, titleCity: "Bursa", titleDistrict: "Osmangazi" });
  assert.equal(
    ctx.buildSahibindenSearchUrl(),
    "https://www.sahibinden.com/satilik-arsa/bursa-osmangazi?viewType=map",
    `"${usage}" kullanim niteligi satilik-arsa'ya eslenmedi.`
  );
});

// --- 3) Isyeri/Ofis/Ticari Bina -> satilik-is-yeri ----------------------
["İşyeri", "Ofis", "Ticari Bina"].forEach((usage) => {
  const ctx = makeContext({ currentUsageNature: usage, titleCity: "İstanbul", titleDistrict: "Beşiktaş" });
  assert.equal(
    ctx.buildSahibindenSearchUrl(),
    "https://www.sahibinden.com/satilik-is-yeri/istanbul-besiktas?viewType=map",
    `"${usage}" kullanim niteligi satilik-is-yeri'ye eslenmedi.`
  );
});

// --- 4) Turkce karakter katlama (I noktali/noktasiz, ü, ş, ö, ç, ğ) -----
{
  const ctx = makeContext({ currentUsageNature: "Konut", titleCity: "Çanakkale", titleDistrict: "Gökçeada" });
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire/canakkale-gokceada?viewType=map");
}

// --- 5) titleCity/titleDistrict (tapu), city/district'ten ONCELIKLI -----
{
  const ctx = makeContext({
    currentUsageNature: "Konut",
    titleCity: "Bursa", titleDistrict: "Nilüfer",
    city: "İstanbul", district: "Kadıköy",
  });
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire/bursa-nilufer?viewType=map", "titleCity/titleDistrict yerine adres alanlari kullanilmis.");
}
// tapu alanlari BOSSA adres alanlarina duser (fallback).
{
  const ctx = makeContext({ currentUsageNature: "Konut", city: "İstanbul", district: "Kadıköy" });
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire/istanbul-kadikoy?viewType=map");
}

// --- 6) Il/ilce eksikse zarif geri dusus (kirik URL uretilmemeli) -------
{
  const ctx = makeContext({ currentUsageNature: "Konut", titleCity: "Bursa" }); // ilce yok
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire/bursa?viewType=map");
}
{
  const ctx = makeContext({ currentUsageNature: "Konut" }); // ikisi de yok
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire?viewType=map");
}

// --- 7) Kullanim niteligi bossa: ownershipType'a (Arsa/Tarla) bakiyor ----
{
  const ctx = makeContext({ ownershipType: "Tarla", titleCity: "Bursa", titleDistrict: "Nilüfer" });
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-arsa/bursa-nilufer?viewType=map", "ownershipType=Tarla iken satilik-arsa'ya duşmedi.");
}
// hicbir ipucu yoksa varsayilan: satilik-daire (en yaygin/genel dava).
{
  const ctx = makeContext({ titleCity: "Bursa", titleDistrict: "Nilüfer" });
  assert.equal(ctx.buildSahibindenSearchUrl(), "https://www.sahibinden.com/satilik-daire/bursa-nilufer?viewType=map");
}

// --- 7b) İl + ilçe + idari mahalle: Sahibinden mahalle rotası -----------
{
  const ctx = makeContext({
    currentUsageNature: "Tarla",
    titleCity: "Bursa",
    titleDistrict: "Gürsu",
    titleNeighborhood: "İpekyolu Mahallesi",
  });
  assert.equal(
    ctx.buildSahibindenSearchUrl(),
    "https://www.sahibinden.com/satilik-arsa/bursa-gursu-gursu-ipekyolu-mah.?viewType=map",
    "İlçe ve idari mahalle Sahibinden mahalle rotasına eklenmedi."
  );
}
console.log("Sahibinden.com arama URL uretimi (buildSahibindenSearchUrl) gercek-kaynak testleri tamam.");

// --- 8) Buton, Emsaller (comparables) editorune kablanmis mi? -----------
const editorSource = extractFunctionSource("createComparablesVerticalEditor");
assert.match(
  editorSource,
  /portalGroup\.append\(createSahibindenSearchButton\(\), createHepsiemlakSearchButton\(\), createEmlakjetSearchButton\(\)\)/,
  "createSahibindenSearchButton() artik Emsaller basligina eklenmiyor."
);
const buttonSource = extractFunctionSource("createSahibindenSearchButton");
assert.match(buttonSource, /buildUrl: buildSahibindenSearchUrl/, "Sahibinden dugmesi arama URL'sine bagli degil.");
const portalButtonSource = extractFunctionSource("createComparablePortalButton");
assert.match(appSource, /portal-logos\/hepsiemlak\.png/, "Hepsiemlak logosu yerel varliktan kullanilmiyor.");
assert.match(appSource, /portal-logos\/emlakjet\.png/, "Emlakjet logosu yerel varliktan kullanilmiyor.");
assert.match(appSource, /portal-logos\/sahibinden\.png/, "Sahibinden logosu yerel varliktan kullanilmiyor.");
assert.match(appSource, /button\.setAttribute\("aria-label", label\)/, "Portal butonlarinda erisilebilir ad yok.");
assert.match(appSource, /comparable-portal-logo/, "Portal butonlari kare logo gorseli kullanmiyor.");
assert.match(appSource, /intent:\/\//, "Android'de portal web sekmesi zorlanmiyor.");
assert.match(appSource, /com\.android\.chrome/, "Android portal acilisi Chrome web sekmesine bagli degil.");
assert.doesNotMatch(appSource, /window\.location\.assign\(url\)/, "Mobilde portal uygulamasina devreden location.assign kullaniliyor.");

console.log("Sahibinden dugmesi Emsaller basligina kablolama testi tamam.");

console.log("Comparables sahibinden arama testleri basarili.");

// --- 9) Hepsiemlak ve Emlakjet: ayni merkez siniri ----------------------
{
  const ctx = makeContext({ currentUsageNature: "Tarla", titleCity: "Bursa", titleDistrict: "Nilüfer", latitude: "40.200000", longitude: "28.900000" });
  const hepsi = new URL(ctx.buildHepsiemlakSearchUrl());
  const sahibinden = new URL(ctx.buildSahibindenSearchUrl());
  assert.equal(sahibinden.pathname, "/satilik-arsa");
  assert.equal(sahibinden.searchParams.get("geoLocation_latitude"), "40.200000");
  assert.equal(sahibinden.searchParams.get("geoLocation_longitude"), "28.900000");
  assert.equal(sahibinden.searchParams.get("geoLocation_geoDistance_max"), "3000");
  assert.equal(hepsi.pathname, "/harita/bursa-satilik/arsa");
  assert.equal(hepsi.searchParams.get("mapTopLeft"), "40.226949,28.864717");
  assert.equal(hepsi.searchParams.get("mapBottomRight"), "40.173051,28.935283");

  const jet = new URL(ctx.buildEmlakjetSearchUrl());
  assert.equal(jet.pathname, "/satilik-arsa/bursa-nilufer/");
  assert.equal(jet.searchParams.get("bottom_left"), "40.173051,28.864717");
  assert.equal(jet.searchParams.get("top_right"), "40.226949,28.935283");
}
console.log("Hepsiemlak ve Emlakjet merkezli arama testleri basarili.");
