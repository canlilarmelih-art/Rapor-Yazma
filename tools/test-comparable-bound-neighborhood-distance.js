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

  Duzeltme (0.0.802): buildLocalNeighborhoodFields() artik boundNeighborhoodLat/
  boundNeighborhoodLng adinda YENI dahili (UI'da hic gosterilmeyen) iki
  alan da uretiyor. buildComparableLocationText() - emsalin konu
  tasinmaz(lar)a olan mesafe/yon METNINI ureten fonksiyon - artik Coklu
  Talep'te (emsaller paylasimli) GERCEKTEN bu saklanan bagli-koy
  koordinatindan olcuyor; veri yoksa (bagli mahalle hic hesaplanmamissa)
  ESKI (tasinmazin kendi noktasi) davranisa GUVENLI dusuyor. Harita
  uzerindeki "KONU TASINMAZ" isaretcisi (getComparableSubjectPoint,
  DEGISTIRILMEDI) hala tasinmazin KENDI konumunu gosterir.

  DEVAM (0.0.802 sonrasi, kullanici testi basarisiz oldu): kullanici
  0.0.802'yi test edip "hala tasinmazdan aliniyor koy yada mahalle
  merkezinden alinmali test ettim ama sonuc basarisiz" dedi. Kok neden:
  "Bagli mahalle / koy" (boundNeighborhood) duz bir METIN alani - kullanici
  bunu ELLE YAZABILIR/DUZELTEBILIR, VEYA applyLocalNeighborhoodForCurrentLocation
  icindeki sunucu "bound" eslesmesi (SADECE KML'nin "Mahalle" etiketiyle
  calisir) hic tetiklenmemis/bos donmus olabilir - bu durumlarda
  buildLocalNeighborhoodFields SESSIZCE "nearest" (tasinmaza GPS ile en
  yakin veritabani satiri) satirina dusuyordu; boundNeighborhoodLat/Lng
  kullanicinin GERCEKTEN yazdigi/gordugu koy adinin veritabani koordinatini
  YANSITMIYORDU. Duzeltme: yeni parseBoundNeighborhoodTextForLookup()/
  refreshBoundNeighborhoodCoordinatesFromCurrentFields() - "Bagli mahalle /
  koy" alaninin GUNCEL METNINDEN dogrudan AD BAZLI bir veritabani sorgusu
  (mevcut "postal" islemi, GPS noktasina ihtiyac duymaz) yapip GERCEK
  koordinati YENIDEN senkronluyor; createForm'un genel alan-commit (blur)
  noktasinda tetikleniyor.

  DEVAM (2026-09-16, ekran goruntusuyle): kullanici yine "hala coklu
  tarla raporlarinda mahalle merkezi yerine tasinmaz konumunu baz aliyor"
  dedi. Kok neden: bir onceki duzeltme (refreshBoundNeighborhoodCoordinatesFromCurrentFields)
  YALNIZCA kullanici "Bagli mahalle / koy" alanini ELLE duzenleyip blur
  olduğunda tetikleniyordu - 0.0.803'TEN ONCE olusturulmus (veya bu alana
  hic yeniden dokunulmamis) raporlarda boundNeighborhoodLat/Lng SONSUZA
  KADAR bos kaliyor, emsal mesafesi sessizce tasinmazin kendi noktasina
  geri donuyordu. Duzeltme: yeni selfHealBoundNeighborhoodCoordinatesIfNeeded()
  - render() HER calistiginda (kullanici HANGI sekmede olursa olsun,
  maybeAutoFetchNearbyPlaces() ile AYNI ilke) deger VARSA ama koordinat
  YOKSA otomatik senkronlanir; "Adres ve Konum" sekmesine gidilmesini
  BEKLEMEZ.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- Kaynak-düzeyi: render() (DOM'a bağımlı, izole edilip çalıştırılamaz) ---
// gerçekten selfHealBoundNeighborhoodCoordinatesIfNeeded()'i çağırıyor mu?
// KULLANICI TALEBİ: kullanıcı "Adres ve Konum" sekmesine hiç gitmeden
// (ör. doğrudan "Emsaller" sekmesindeyken) bile bu self-heal çalışmalı —
// bu yüzden createForm("address")'e DEĞİL, render()'ın kendisine (HER
// sekmede çalışır, maybeAutoFetchNearbyPlaces() ile AYNI nokta) kablolu
// olmalı.
{
  const renderStart = appSource.indexOf("\nfunction render() {");
  assert(renderStart >= 0, "render() fonksiyonu bulunamadı.");
  const renderEnd = appSource.indexOf("\n}", renderStart);
  const renderBody = appSource.slice(renderStart, renderEnd);
  assert.match(
    renderBody,
    /maybeAutoFetchNearbyPlaces\(\);\s*\n\s*selfHealBoundNeighborhoodCoordinatesIfNeeded\(\);/,
    "KULLANICI TALEBİ: render() artık selfHealBoundNeighborhoodCoordinatesIfNeeded()'i (maybeAutoFetchNearbyPlaces() ile AYNI ilkeyle, HER sekmede) çağırmalı.",
  );
  console.log("Kaynak-düzeyi: render() -> selfHealBoundNeighborhoodCoordinatesIfNeeded() kablolaması testi tamam.");
}

// test-project-review-block-pluralization.js'teki AYNI paren+quote-farkinda
// brace-derinligi sayaci (varsayilan parametrelerdeki "{}" veya regex/
// string literallerdeki "{"/"}" karakterlerini gercek kod blogu sanmaz).
function extractFunction(name) {
  const marker = `function ${name}(`;
  let start = appSource.indexOf(`\n${marker}`);
  if (start < 0) start = appSource.indexOf(`\nasync ${marker}`);
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
  "parseCsvNumber",
  "calculateDistanceMetersIfPossible",
  "normalizeNeighborhoodApiRow",
  "parseBoundNeighborhoodTextForLookup",
  "refreshBoundNeighborhoodCoordinatesFromCurrentFields",
  "selfHealBoundNeighborhoodCoordinatesIfNeeded",
];

// normalizeNeighborhoodApiRow'un metin-temizleme yardımcıları (cleanupPlaceName/
// cleanNeighborhoodName/normalizePostalCodeValue/normalizeLocalPlaceKey/
// normalizeLocalNeighborhoodKey) bu dosyanın konusu DEĞİL — o alan-bazlı
// büyük/küçük harf davranışı zaten tools/test-address-place-casing.js'te
// ayrı test ediliyor. Burada YALNIZCA basit "geçiştir" (passthrough) saplama
// kullanılır ki normalizeNeighborhoodApiRow'un GERÇEK yapısı (lat/lng
// geçerlilik kontrolü + "postal" işleminde nokta olmadan çalışması) test
// edilebilsin, devasa bir bağımlılık ağacı çekmeden.
const sandboxSource = `
  let state = {};
  function setState(s) { state = s; }
  let fetchNeighborhoodLookupImpl = async () => ({ ok: true, match: null });
  function setFetchNeighborhoodLookupImpl(fn) { fetchNeighborhoodLookupImpl = fn; }
  async function fetchNeighborhoodLookup(operation, payload) { return fetchNeighborhoodLookupImpl(operation, payload); }
  function cleanupPlaceName(value) { return String(value || "").trim(); }
  function cleanNeighborhoodName(value) { return String(value || "").trim(); }
  function normalizePostalCodeValue(value) { return String(value || "").trim(); }
  function normalizeLocalPlaceKey(value) { return String(value || "").toLowerCase().trim(); }
  function normalizeLocalNeighborhoodKey(value) { return String(value || "").toLowerCase().trim(); }
  let boundNeighborhoodCoordinateSyncAttempts = new Set();
  function resetBoundNeighborhoodCoordinateSyncAttempts() { boundNeighborhoodCoordinateSyncAttempts = new Set(); }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState,
    setFetchNeighborhoodLookupImpl,
    resetBoundNeighborhoodCoordinateSyncAttempts,
    isComparablesSharedAcrossUnits,
    getComparableSubjectPoint,
    getComparableBoundNeighborhoodPoint,
    getComparableDistanceReferencePoint,
    buildComparableLocationText,
    buildLocalNeighborhoodFields,
    parseBoundNeighborhoodTextForLookup,
    refreshBoundNeighborhoodCoordinatesFromCurrentFields,
    selfHealBoundNeighborhoodCoordinatesIfNeeded,
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

// --- 5) parseBoundNeighborhoodTextForLookup(): "Ad - İlçe / İl" biçimini ---
// AYRIŞTIRIR (buildLocalNeighborhoodFields'in ürettiği GERÇEK biçim);
// serbest metin girildiğinde (kullanıcı elle yazmışsa) mevcut il/ilçe
// alanlarına GÜVENLİ düşer. -------------------------------------------
{
  fns.setState(freshState({ district: "Mustafakemalpaşa", city: "Bursa" }));
  assert.deepEqual(
    fns.parseBoundNeighborhoodTextForLookup("Canbazlar - Mustafakemalpaşa / Bursa"),
    { neighborhood: "Canbazlar", district: "Mustafakemalpaşa", city: "Bursa" },
    "KULLANICI TALEBİ: 'Ad - İlçe / İl' biçimi doğru ayrıştırılmalı.",
  );
  assert.deepEqual(
    fns.parseBoundNeighborhoodTextForLookup("Hasanköy"),
    { neighborhood: "Hasanköy", district: "Mustafakemalpaşa", city: "Bursa" },
    "Serbest metin (kullanıcının elle yazdığı) mevcut il/ilçe alanlarına düşmeli.",
  );
  assert.equal(fns.parseBoundNeighborhoodTextForLookup(""), null, "Boş metin -> sorgu YAPILMAMALI (null).");
  assert.equal(fns.parseBoundNeighborhoodTextForLookup("   "), null, "Yalnızca boşluk -> null.");
  console.log("parseBoundNeighborhoodTextForLookup() ayrıştırma testi tamam.");
}

// --- 6-9) Aşağıdaki senaryolar refreshBoundNeighborhoodCoordinatesFromCurrentFields()
// ASYNC olduğundan (fetchNeighborhoodLookup çağırır) tek bir async IIFE
// içinde çalıştırılır — tools/test-address-location-select.js'teki AYNI
// üst-düzey async test deseni. --------------------------------------------
(async () => {
  // --- 6) KULLANICI TALEBİ: "Bağlı mahalle / köy" alanı ELLE YAZILDIĞINDA
  // (veya otomatik dolup sonradan düzeltildiğinde FARK ETMEZ) GERÇEK
  // ad-bazlı veritabanı koordinatı YENİDEN senkronlanmalı — kullanıcının
  // "hala tasinmazdan aliniyor ... test ettim ama sonuc basarisiz"
  // bildirimini giderir. ----------------------------------------------
  {
    const context = freshState({
      boundNeighborhood: "Canbazlar - Mustafakemalpaşa / Bursa",
      // Kasıtlı olarak YANLIŞ/eski bir koordinat (ör. önceki "nearest"
      // düşüşünden kalma, taşınmazın kendi noktasına yakın) — düzeltme
      // sonrası GERÇEK köy koordinatıyla EZİLMELİ.
      boundNeighborhoodLat: "40.500000", boundNeighborhoodLng: "29.500000",
    });
    fns.setState(context);
    let capturedCall = null;
    fns.setFetchNeighborhoodLookupImpl(async (operation, payload) => {
      capturedCall = { operation, payload };
      return {
        ok: true,
        match: { city: "Bursa", district: "Mustafakemalpaşa", neighborhood: "Canbazlar", lat: "40.123456", lng: "28.654321" },
      };
    });

    await fns.refreshBoundNeighborhoodCoordinatesFromCurrentFields("boundNeighborhood");

    assert.equal(capturedCall.operation, "postal", "KULLANICI TALEBİ: AD BAZLI ('postal') sorgu yapılmalı, GPS-yakınlık DEĞİL.");
    assert.deepEqual(capturedCall.payload, { neighborhood: "Canbazlar", district: "Mustafakemalpaşa", city: "Bursa" }, "Sorgu, 'Bağlı mahalle / köy' metninden AYRIŞTIRILAN ad/ilçe/il ile yapılmalı.");
    assert.equal(context.fields.boundNeighborhoodLat, "40.123456", `KULLANICI TALEBİ: koordinat GERÇEK köy veritabanı satırıyla GÜNCELLENMELİ (eski/yanlış değerle EZİLMEMELİ), bulunan: ${context.fields.boundNeighborhoodLat}`);
    assert.equal(context.fields.boundNeighborhoodLng, "28.654321", `Boylam da güncellenmeli, bulunan: ${context.fields.boundNeighborhoodLng}`);

    console.log("refreshBoundNeighborhoodCoordinatesFromCurrentFields() KULLANICI TALEBİ (ad-bazlı yeniden senkron) testi tamam.");
  }

  // --- 7) REGRESYON: değişen alan "boundNeighborhood" DEĞİLSE hiçbir ---
  // ağ çağrısı/güncelleme YAPILMAMALI (her alan commit'inde gereksiz
  // istek atılmasın). --------------------------------------------------
  {
    const context = freshState({
      boundNeighborhood: "Canbazlar - Mustafakemalpaşa / Bursa",
      boundNeighborhoodLat: "40.500000", boundNeighborhoodLng: "29.500000",
    });
    fns.setState(context);
    let callCount = 0;
    fns.setFetchNeighborhoodLookupImpl(async () => { callCount += 1; return { ok: true, match: null }; });

    await fns.refreshBoundNeighborhoodCoordinatesFromCurrentFields("city");

    assert.equal(callCount, 0, "REGRESYON: 'boundNeighborhood' DIŞINDA bir alan değiştiğinde ağ çağrısı YAPILMAMALI.");
    assert.equal(context.fields.boundNeighborhoodLat, "40.500000", "İlgisiz alan değişiminde koordinat DEĞİŞMEMELİ.");
    console.log("refreshBoundNeighborhoodCoordinatesFromCurrentFields() ilgisiz alan REGRESYON testi tamam.");
  }

  // --- 8) REGRESYON: veritabanında eşleşme YOKSA (match: null) mevcut ---
  // koordinat KORUNMALI, boş/hatalı değerle EZİLMEMELİ. -------------------
  {
    const context = freshState({
      boundNeighborhood: "Var Olmayan Köy - Mustafakemalpaşa / Bursa",
      boundNeighborhoodLat: "40.500000", boundNeighborhoodLng: "29.500000",
    });
    fns.setState(context);
    fns.setFetchNeighborhoodLookupImpl(async () => ({ ok: true, match: null }));

    await fns.refreshBoundNeighborhoodCoordinatesFromCurrentFields("boundNeighborhood");

    assert.equal(context.fields.boundNeighborhoodLat, "40.500000", "REGRESYON: eşleşme yoksa mevcut koordinat KORUNMALI (boş metinle EZİLMEMELİ).");
    assert.equal(context.fields.boundNeighborhoodLng, "29.500000", "REGRESYON: eşleşme yoksa mevcut boylam KORUNMALI.");
    console.log("refreshBoundNeighborhoodCoordinatesFromCurrentFields() eşleşme-yok REGRESYON testi tamam.");
  }

  // --- 9) UÇTAN UCA: manuel düzeltme SONRASI emsal mesafesi de GERÇEKTEN ---
  // yeni köyden ölçülüyor (parseleme + ağ senkronu + mesafe hesabı BİR
  // ARADA). ----------------------------------------------------------------
  {
    const context = freshState({
      requestType: "Çoklu Talep",
      latitude: "40.500000", longitude: "29.500000",
      boundNeighborhood: "Canbazlar - Mustafakemalpaşa / Bursa",
      // Kullanıcı bu alanı ELLE yazdı/düzeltti; koordinat henüz senkron
      // DEĞİL (boş) - tıpkı kullanıcının bildirdiği gerçek senaryo gibi.
    });
    fns.setState(context);
    fns.setFetchNeighborhoodLookupImpl(async () => ({
      ok: true,
      match: { city: "Bursa", district: "Mustafakemalpaşa", neighborhood: "Canbazlar", lat: "40.000000", lng: "29.000000" },
    }));

    await fns.refreshBoundNeighborhoodCoordinatesFromCurrentFields("boundNeighborhood");

    const emsalLat = 40.0215; // yeni (doğru) köy noktasının ~2,39 km kuzeyi
    const emsalLng = 29.0;
    const locationText = fns.buildComparableLocationText(emsalLat, emsalLng);
    assert.match(locationText, /^2,39\s?km kuzeyinde$/, `UÇTAN UCA: manuel düzeltme SONRASI emsal mesafesi GERÇEKTEN yeni köyden ölçülmeli, bulunan: ${locationText}`);
    console.log("UÇTAN UCA: manuel 'Bağlı mahalle / köy' düzeltmesi -> emsal mesafesi doğru köyden testi tamam.");
  }

  // --- 10) KULLANICI TALEBİ (2026-09-16, devam): selfHealBoundNeighborhoodCoordinatesIfNeeded()
  // — "Bağlı mahalle / köy" alanına HİÇ dokunulmadan (0.0.803'ten ÖNCE
  // oluşturulmuş bir rapor gibi) bile, render() her çalıştığında otomatik
  // senkronlanmalı; kullanıcının "Adres ve Konum" sekmesine gitmesi
  // GEREKMEMELİ.
  {
    fns.resetBoundNeighborhoodCoordinateSyncAttempts();
    const context = freshState({
      boundNeighborhood: "Canbazlar - Mustafakemalpaşa / Bursa",
      // boundNeighborhoodLat/Lng YOK — 0.0.803 öncesi/hiç düzenlenmemiş rapor.
    });
    fns.setState(context);
    let callCount = 0;
    fns.setFetchNeighborhoodLookupImpl(async () => {
      callCount += 1;
      return { ok: true, match: { city: "Bursa", district: "Mustafakemalpaşa", neighborhood: "Canbazlar", lat: "40.000000", lng: "29.000000" } };
    });

    fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(callCount, 1, "KULLANICI TALEBİ: 'Adres ve Konum' sekmesine hiç gidilmeden (render() her çalıştığında) otomatik senkron denenmeli.");
    assert.equal(context.fields.boundNeighborhoodLat, "40.000000", `Koordinat otomatik senkronlanmalı, bulunan: ${context.fields.boundNeighborhoodLat}`);
    console.log("selfHealBoundNeighborhoodCoordinatesIfNeeded() KULLANICI TALEBİ (sekmeye gitmeden otomatik senkron) testi tamam.");
  }

  // --- 11) REGRESYON: koordinat ZATEN varsa self-heal HİÇ ağ çağrısı YAPMAMALI.
  {
    fns.resetBoundNeighborhoodCoordinateSyncAttempts();
    const context = freshState({
      boundNeighborhood: "Canbazlar - Mustafakemalpaşa / Bursa",
      boundNeighborhoodLat: "40.000000", boundNeighborhoodLng: "29.000000",
    });
    fns.setState(context);
    let callCount = 0;
    fns.setFetchNeighborhoodLookupImpl(async () => { callCount += 1; return { ok: true, match: null }; });

    fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(callCount, 0, "REGRESYON: koordinat zaten varken self-heal gereksiz ağ çağrısı YAPMAMALI.");
    console.log("selfHealBoundNeighborhoodCoordinatesIfNeeded() koordinat-zaten-var REGRESYON testi tamam.");
  }

  // --- 12) REGRESYON: AYNI değer için render() TEKRAR TEKRAR çağrılsa bile
  // (eşleşme bulunamayan bir köy adı gibi) ağ isteği yalnızca BİR KEZ
  // denenmeli — her render'da gereksiz istek atılmamalı.
  {
    fns.resetBoundNeighborhoodCoordinateSyncAttempts();
    const context = freshState({
      boundNeighborhood: "Var Olmayan Köy - Mustafakemalpaşa / Bursa",
    });
    fns.setState(context);
    let callCount = 0;
    fns.setFetchNeighborhoodLookupImpl(async () => { callCount += 1; return { ok: true, match: null }; });

    fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(callCount, 1, `REGRESYON: aynı metin için render() tekrar tekrar çağrılsa bile ağ isteği yalnızca BİR KEZ denenmeli, bulunan: ${callCount}`);
    console.log("selfHealBoundNeighborhoodCoordinatesIfNeeded() aynı-değer tekrar-render REGRESYON testi tamam.");
  }

  // --- 13) KULLANICI TALEBİ (2026-09-16, canlı tarayıcı kanıtıyla doğrulandı):
  // sayfa YENİ açılırken bu self-heal'in İLK denemesi GEÇİCİ bir nedenle
  // (canlı üründe: Firebase kimlik doğrulama jetonu henüz hazır değilken
  // atılan istek, bkz. fetchRaporApi/getIdToken — burada bir "throw" ile
  // taklit edilir) başarısız olabiliyordu — ESKİ kodda değer YİNE DE
  // "denendi" olarak KALICI işaretlenip bir daha ASLA yeniden denenmiyordu
  // (koordinat SONSUZA KADAR boş kalıyordu, tıpkı kullanıcının bildirdiği
  // gerçek raporda olduğu gibi). Düzeltme: yalnızca GEÇİCİ hatada (error:true)
  // işaret geri alınır ki BİR SONRAKİ render() çağrısı (burada: self-heal'in
  // İKİNCİ çağrısı) GERÇEKTEN yeniden dener ve başarılı olur.
  {
    fns.resetBoundNeighborhoodCoordinateSyncAttempts();
    const context = freshState({
      boundNeighborhood: "Canbazlarköyü - Gürsu / Bursa",
    });
    fns.setState(context);
    let callCount = 0;
    fns.setFetchNeighborhoodLookupImpl(async () => {
      callCount += 1;
      if (callCount === 1) throw new Error("Sunucu işlemleri için geçerli bir oturum açın.");
      return { ok: true, match: { city: "Bursa", district: "Gürsu", neighborhood: "Canbazlarköyü", lat: "40.243823", lng: "29.188681" } };
    });

    // 1. deneme (sayfa ilk açıldığında, kimlik doğrulama jetonu henüz hazır DEĞİL) — BAŞARISIZ olmalı.
    await fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    assert.equal(context.fields.boundNeighborhoodLat, undefined, "1. deneme (geçici hata) koordinatı YANLIŞLIKLA doldurmamalı.");
    assert.equal(callCount, 1, "1. deneme tam olarak bir ağ çağrısı yapmalı.");

    // 2. deneme (bir SONRAKİ render() — jeton artık hazır) — BAŞARILI olmalı,
    // ESKİ kod bu noktada (kalıcı işaret nedeniyle) SESSİZCE hiçbir şey yapmazdı.
    await fns.selfHealBoundNeighborhoodCoordinatesIfNeeded();
    assert.equal(callCount, 2, "KULLANICI TALEBİ: geçici hatadan SONRA bir sonraki render() YENİDEN denemeli (kalıcı olarak vazgeçmemeli).");
    assert.equal(context.fields.boundNeighborhoodLat, "40.243823", `KULLANICI TALEBİ: 2. denemede koordinat GERÇEKTEN senkronlanmalı, bulunan: ${context.fields.boundNeighborhoodLat}`);

    console.log("selfHealBoundNeighborhoodCoordinatesIfNeeded() KULLANICI TALEBİ (geçici hatadan sonra yeniden deneme) testi tamam.");
  }

  console.log("Emsal konum mesafesinin bağlı köy koordinatından GERÇEK ölçümü testleri başarılı.");
})();
