"use strict";

/*
  Kullanici talebi (2026-09-16, devam): 0.0.801'de "taşınmazların 2,39 km
  kuzeyinde" ifadesinin "Canbazlarköyü Mahallesinin 2,39 km kuzeyinde"ye
  cevrilmesinin ARDINDAN kullanici sordu: "tamam ama konumu mahalle
  merkezinden mi aliyor yoksa tasinmazdan mi bunu kontrol ettin mi" —
  0.0.801 yalnizca CUMLENIN oznesini degistirmisti, SAYI hala tasinmazin
  kendi noktasindan olculuyordu. Kullanici: "koy ve mahalle koordinatlari
  ve bagli bulundugu koy koordinatlari zaten veritabaninda mevcut."

  Gercekten de /api/neighborhoods sunucu ucu (normalizeNeighborhoodApiRow)
  her satirda GERCEK lat/lng dondurur - applyLocalNeighborhoodForCurrentLocation()
  bunu "bound" (bagli koy) icin zaten okuyup MESAFE/YON hesapliyordu, ama
  ham koordinati (bound.lat/bound.lng) hicbir yerde SAKLAMIYORDU (yalnizca
  bicimlenmis "759 m kuzeyinde" METNI - boundNeighborhoodDistance -
  saklaniyordu).

  Duzeltme: buildLocalNeighborhoodFields() artik boundNeighborhoodLat/
  boundNeighborhoodLng adinda YENI dahili (UI'da hic gosterilmeyen) iki
  alan da uretiyor. buildComparableLocationText() - emsalin konu
  tasinmaz(lar)a olan mesafe/yon METNINI ureten fonksiyon - artik Coklu
  Talep'te (emsaller paylasimli) GERCEKTEN bu saklanan bagli-koy
  koordinatindan olcuyor; veri yoksa (bagli mahalle hic hesaplanmamissa)
  ESKI (tasinmazin kendi noktasi) davranisa GUVENLI dusuyor. Harita
  uzerindeki "KONU TASINMAZ" isaretcisi (getComparableSubjectPoint,
  DEGISTIRILMEDI) hala tasinmazin KENDI konumunu gosterir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// test-project-review-block-pluralization.js'teki AYNI paren+quote-farkinda
// brace-derinligi sayaci (varsayilan parametrelerdeki "{}" veya regex/
// string literallerdeki "{"/"}" karakterlerini gercek kod blogu sanmaz).
function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
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
  let quote = null;
  let prevSignificant = "";
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    const next = appSource[index + 1];
    if (quote) {
      if (quote === "/") {
        if (char === "\\") { index += 1; continue; }
        if (char === "/") quote = null;
        continue;
      }
      if (char === "\\") { index += 1; continue; }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      const eol = appSource.indexOf("\n", index);
      index = eol === -1 ? appSource.length : eol;
      continue;
    }
    if (char === "/" && next === "*") {
      const end = appSource.indexOf("*/", index + 2);
      index = end === -1 ? appSource.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "/" && /[([{,;:=!&|?+\-*%^~<>\n]/.test(prevSignificant)) {
      quote = "/";
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
    if (!/\s/.test(char)) prevSignificant = char;
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "foldTurkish",
  "getTitleUnitCount",
  "getTitleUnitFieldsForLabel",
  "isCondominiumEasementOwnershipType",
  "normalizeOwnershipTypeForSectionVisibility",
  "getTitleUnitKmlRecordsForMap",
  "getSelectedMapPoint",
  "calculateDistanceMeters",
  "calculateBearing",
  "calculateRelativeDirectionText",
  "formatDistanceMeters",
  "formatDistanceWithDirection",
  "formatBoundNeighborhoodDistance",
  "formatCenterDistance",
  "isComparablesSharedAcrossUnits",
  "getComparableSubjectPoint",
  "getComparableBoundNeighborhoodPoint",
  "getComparableDistanceReferencePoint",
  "buildComparableLocationText",
  "buildLocalNeighborhoodFields",
];

const sandboxSource = `
  let state = {};
  function setState(s) { state = s; }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState,
    isComparablesSharedAcrossUnits,
    getComparableSubjectPoint,
    getComparableBoundNeighborhoodPoint,
    getComparableDistanceReferencePoint,
    buildComparableLocationText,
    buildLocalNeighborhoodFields,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function freshState(fields = {}) {
  return {
    fields: { requestType: "Çoklu Talep", latitude: "", longitude: "", ...fields },
    titleUnits: [],
    activeTitleUnitIndex: 0,
    primaryTitleUnitShadow: null,
    sourceValues: {},
  };
}

// --- 1) buildLocalNeighborhoodFields(): bağlı köyün HAM koordinatı da ------
// üretilmeli (yalnızca dahili kullanım, UI alanı DEĞİL).
{
  const row = { city: "Bursa", district: "Mustafakemalpaşa", neighborhood: "Merkez", postalCode: "16xxx", distance: 500, direction: "kuzeyinde" };
  const bound = { neighborhood: "Canbazlar", district: "Mustafakemalpaşa", city: "Bursa", distance: 759, direction: "kuzeyinde", lat: 40.123456, lng: 28.654321 };
  const fields = fns.buildLocalNeighborhoodFields(row, bound);
  assert.equal(fields.boundNeighborhoodLat, "40.123456", `KULLANICI TALEBİ: bağlı köyün HAM enlemi de üretilmeli, bulunan: ${fields.boundNeighborhoodLat}`);
  assert.equal(fields.boundNeighborhoodLng, "28.654321", `Bağlı köyün HAM boylamı da üretilmeli, bulunan: ${fields.boundNeighborhoodLng}`);
  assert.equal(fields.boundNeighborhoodDistance, "Taşınmaz mahalle merkezinin 759 m kuzeyinde", "REGRESYON: eski (biçimlenmiş metin) davranış korunmalı.");

  // Bağlı satırda koordinat YOKSA (sunucudan gelmeyen nadir durum) boş kalmalı.
  const boundWithoutCoords = { neighborhood: "Canbazlar", district: "Mustafakemalpaşa", city: "Bursa", distance: 759, direction: "kuzeyinde" };
  const fieldsWithoutCoords = fns.buildLocalNeighborhoodFields(row, boundWithoutCoords);
  assert.equal(fieldsWithoutCoords.boundNeighborhoodLat, "", "Koordinat yoksa boundNeighborhoodLat boş kalmalı.");
  assert.equal(fieldsWithoutCoords.boundNeighborhoodLng, "", "Koordinat yoksa boundNeighborhoodLng boş kalmalı.");

  console.log("buildLocalNeighborhoodFields() bağlı köy HAM koordinat üretimi testi tamam.");
}

// --- 2) getComparableDistanceReferencePoint()/buildComparableLocationText() -
// KULLANICI TALEBİ: Çoklu Talep + bağlı köy koordinatı VARSA emsal mesafesi
// GERÇEKTEN o noktadan ölçülmeli (taşınmazın kendi noktasından DEĞİL).
{
  // Canbazlarköyü (bağlı köy) ≈ 40.000000, 29.000000; emsal tam kuzeyinde
  // ~2,39 km (0.0215 derece enlem farkı ≈ 2,39 km).
  const context = freshState({
    requestType: "Çoklu Talep",
    latitude: "40.500000", longitude: "29.500000", // taşınmazın KENDİ noktası - farklı yerde
    boundNeighborhoodLat: "40.000000", boundNeighborhoodLng: "29.000000",
  });
  fns.setState(context);
  assert.equal(fns.isComparablesSharedAcrossUnits(), true, "sanity: Çoklu Talep paylaşımlı sayılmalı.");
  assert.deepEqual(fns.getComparableSubjectPoint(), [40.5, 29.5], "sanity: harita işaretçisi (KONU TAŞINMAZ) HALA taşınmazın kendi noktasını göstermeli.");
  assert.deepEqual(fns.getComparableBoundNeighborhoodPoint(), [40, 29], "sanity: bağlı köy noktası doğru okunmalı.");

  const emsalLat = 40.0215; // bağlı köyün ~2,39 km kuzeyi
  const emsalLng = 29.0;
  const referencePoint = fns.getComparableDistanceReferencePoint();
  assert.deepEqual(referencePoint, [40, 29], "KULLANICI TALEBİ: referans nokta BAĞLI KÖY olmalı, taşınmazın kendi noktası DEĞİL.");

  const locationText = fns.buildComparableLocationText(emsalLat, emsalLng);
  assert.match(locationText, /^2,39\s?km kuzeyinde$/, `KULLANICI TALEBİ: mesafe GERÇEKTEN bağlı köyden ölçülmeli (~2,39 km), bulunan: ${locationText}`);

  console.log("getComparableDistanceReferencePoint()/buildComparableLocationText() bağlı köyden GERÇEK ölçüm (KULLANICI TALEBİ) testi tamam.");
}

// --- 3) REGRESYON: bağlı köy koordinatı YOKSA (ör. hiç hesaplanmamış) -----
// eski davranışa (taşınmazın kendi noktası) güvenli düşülmeli — Çoklu
// Talep olsa bile. ------------------------------------------------------
{
  const context = freshState({
    requestType: "Çoklu Talep",
    latitude: "40.500000", longitude: "29.500000",
    // boundNeighborhoodLat/Lng YOK.
  });
  fns.setState(context);
  const referencePoint = fns.getComparableDistanceReferencePoint();
  assert.deepEqual(referencePoint, [40.5, 29.5], "Bağlı köy koordinatı yoksa taşınmazın kendi noktasına GÜVENLİ düşülmeli (regresyon).");
  console.log("getComparableDistanceReferencePoint() bağlı köy koordinatı YOKKEN eski davranış (REGRESYON) testi tamam.");
}

// --- 4) REGRESYON: tekil (paylaşımsız) raporlarda bağlı köy noktasına -----
// HİÇ BAKILMAMALI — taşınmazın kendi noktası kullanılmaya devam eder
// (tek taşınmazlı raporlarda zaten belirsizlik yok). ------------------------
{
  const context = freshState({
    requestType: "Tekli Talep",
    latitude: "40.500000", longitude: "29.500000",
    boundNeighborhoodLat: "40.000000", boundNeighborhoodLng: "29.000000",
  });
  fns.setState(context);
  assert.equal(fns.isComparablesSharedAcrossUnits(), false, "sanity: Tekli Talep paylaşımlı SAYILMAMALI.");
  const referencePoint = fns.getComparableDistanceReferencePoint();
  assert.deepEqual(referencePoint, [40.5, 29.5], "Tekil raporda bağlı köy koordinatı VARSA BİLE taşınmazın kendi noktası kullanılmalı (regresyon).");
  console.log("getComparableDistanceReferencePoint() tekil raporda bağlı köy noktasına GEÇİLMEMESİ (REGRESYON) testi tamam.");
}

console.log("Emsal konum mesafesinin bağlı köy koordinatından GERÇEK ölçümü testleri başarılı.");
