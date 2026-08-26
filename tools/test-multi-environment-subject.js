"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFunction(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

// openAddressStyleVariants bir `const` dizi (fonksiyon DEĞİL) — sliceFunction
// bunu bulamaz, ayrı bir dilim alınır (kapanış "\n];" ile, hemen ardından
// gelen registerVariantGroup çağrısı DAHİL EDİLMEZ — bu sandbox'ta
// registerVariantGroup zaten no-op stub olarak tanımlı).
function sliceConstArray(name) {
  const start = appSource.indexOf(`const ${name} = [`);
  assert(start >= 0, `Const bulunamadı: ${name}`);
  const end = appSource.indexOf("\n];", start) + 3;
  return appSource.slice(start, end);
}

const context = { state: { titleUnits: [{}] }, registerVariantGroup: () => {} };
vm.createContext(context);
vm.runInContext(
  [
    "function registerVariantGroup() {}",
    sliceConstArray("openAddressStyleVariants"),
    sliceFunction("formatOpenAddressBuildingName"),
    sliceFunction("normalizeBlockLabelPrefixForAttribution"),
    sliceFunction("isMultiTitleUnitReportForNarrative"),
    sliceFunction("getNarrativeTitleUnitFields"),
    sliceFunction("getSharedNarrativeParcelPhrase"),
    sliceFunction("pluralizeEnvironmentalSubjectText"),
    sliceFunction("formatZiraatLocationSubject"),
  ].join("\n"),
  context,
);

const ziraatSubject = context.formatZiraatLocationSubject({
  city: "Düzce",
  district: "Merkez",
  neighborhood: "Sancaklar",
  blockNo: "709",
  parcelNo: "2",
  siteName: "Nurol",
  blockName: "A",
  floor: "Zemin",
  unitNo: "2",
});
assert.equal(ziraatSubject, "Ekspertize konu taşınmaz, Düzce ili, Merkez ilçesi, Sancaklar mahallesi üzerinde konumludur");

assert.equal(
  context.pluralizeEnvironmentalSubjectText("Taşınmazın yakın çevresinde gayrimenkule ulaşım mümkündür."),
  "Taşınmazların yakın çevresinde gayrimenkullere ulaşım mümkündür.",
);
assert.equal(
  context.pluralizeEnvironmentalSubjectText("Taşınmazın yakın çevresinde.", false),
  "Taşınmazın yakın çevresinde.",
);
assert.equal(context.isMultiTitleUnitReportForNarrative(), true);

assert.match(appSource, /buildZiraatLocationEnvironmentalExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildZiraatDevelopmentAnalysisExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildZiraatBuildingPatternExplanation\(\)[\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildEnvironmentalDescription\([\s\S]*?pluralizeEnvironmentalSubjectText/);
assert.match(appSource, /buildEnvironmentalIntro\([\s\S]*?sharedBaseLocation/);
assert.match(appSource, /formatZiraatLocationSubject\([\s\S]*?isSharedMultiTitleUnitNarrative/);

context.state.fields = { blockNo: "0", parcelNo: "709", titleBlockName: "A" };
context.state.titleUnits = [
  { fields: { blockNo: "0", parcelNo: "709", titleBlockName: "B" } },
  { fields: { blockNo: "0", parcelNo: "709", titleBlockName: "C" } },
];
const sharedZiraatSubject = context.formatZiraatLocationSubject({
  city: "Düzce",
  district: "Merkez",
  neighborhood: "Sancaklar",
});
assert.equal(
  sharedZiraatSubject,
  "Ekspertize konu taşınmazlar, Düzce ili, Merkez ilçesi, Sancaklar mahallesi, 0 ada 709 parsel üzerinde A, B, C bloklarda yer almaktadır.",
);

context.state.titleUnits[1].fields.parcelNo = "710";
const differentParcelSubject = context.formatZiraatLocationSubject({
  city: "Düzce",
  district: "Merkez",
  neighborhood: "Sancaklar",
});
assert.ok(!differentParcelSubject.includes("0 ada 709 parsel"));

// REGRESYON (2026-08-27, kullanıcı bildirimi): "ilk cümle eksik kalmış
// nedense" — blok adı hiç YOKKEN (blocks.length === 0) cümle "... parsel
// üzerinde." ile YÜKLEMSİZ/YARIM bitiyordu (kullanıcının gerçek örneği:
// "...11652 ada 1 parsel üzerinde." — bir yüklem HİÇ yoktu). Artık 2+
// farklı blok adı olan daldaki ("... bloklarda yer almaktadır") AYNI
// yüklem, blok adı hiç girilmediğinde de kullanılıyor.
context.state.fields = { blockNo: "11652", parcelNo: "1", titleBlockName: "" };
context.state.titleUnits = [
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "" } },
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "" } },
];
const noBlockNameSubject = context.formatZiraatLocationSubject({
  city: "Bursa",
  district: "Osmangazi",
  neighborhood: "Yunuseli",
});
assert.equal(
  noBlockNameSubject,
  "Ekspertize konu taşınmazlar, Bursa ili, Osmangazi ilçesi, Yunuseli mahallesi, 11652 ada 1 parsel üzerinde yer almaktadır.",
  "Blok adi hic girilmemisken de cumle 'yer almaktadir' yuklemiyle tam bitmeli."
);

// Kullanıcı takip talebi (2026-08-27): "blok var ve taşınmazlar tek
// blokta yer alıyor ise ... hepsi A blokta yer alıyor ... (var ise site
// apartman adı) sitesi/apartmanı içinde A Blokta yer almaktadırlar
// şeklinde olmalı" — TÜM taşınmazlar AYNI (TEK) blok adını paylaşıyorsa
// artık hangi blokta (ve varsa hangi site/apartmanda) olduğu AÇIKÇA
// belirtilir, sadece genel "yer almaktadır" DEĞİL.
context.state.fields = { blockNo: "11652", parcelNo: "1", titleBlockName: "A" };
context.state.titleUnits = [
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" } },
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" } },
];
const sameSingleBlockSubject = context.formatZiraatLocationSubject({
  city: "Bursa",
  district: "Osmangazi",
  neighborhood: "Yunuseli",
});
assert.equal(
  sameSingleBlockSubject,
  "Ekspertize konu taşınmazlar, Bursa ili, Osmangazi ilçesi, Yunuseli mahallesi, 11652 ada 1 parsel üzerinde A Blokta yer almaktadırlar.",
  "TUM tasinmazlarin PAYLASTIGI TEK blok adi, site adi YOKKEN dogrudan '{Blok} Blokta yer almaktadirlar' ile belirtilmeli."
);

// Site/apartman adı VARSA (herhangi bir taşınmazın addressSiteName'i) o da
// "{Site} içinde {Blok} Blokta yer almaktadırlar" biçiminde eklenir — çıplak
// ("Nurol") girilmiş olsa bile formatOpenAddressBuildingName ile doğru
// "Sitesi" ekini alır (bkz. buildOpenAddressText'in AYNI yardımcı fonksiyonu).
context.state.fields = { blockNo: "11652", parcelNo: "1", titleBlockName: "A", addressSiteName: "Nurol" };
context.state.titleUnits = [
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" } },
  { fields: { blockNo: "11652", parcelNo: "1", titleBlockName: "A" } },
];
const siteBlockSubject = context.formatZiraatLocationSubject({
  city: "Bursa",
  district: "Osmangazi",
  neighborhood: "Yunuseli",
});
assert.equal(
  siteBlockSubject,
  "Ekspertize konu taşınmazlar, Bursa ili, Osmangazi ilçesi, Yunuseli mahallesi, 11652 ada 1 parsel üzerinde Nurol Sitesi içinde A Blokta yer almaktadırlar.",
  "Site adi VARKEN cumle '{Site} Sitesi icinde {Blok} Blokta yer almaktadirlar' bicimini almali."
);

console.log("Coklu cevre aciklamalarinda tasinmaz cogullastirma testi tamam.");
