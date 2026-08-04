"use strict";

/*
  Kullanici talebi: "yeni bir işte adres ve konumda yakın çevre seçiliyor.
  daha sonra talepten çıkıldığında tekrar girildiğinde seçili yakın
  çevrenin seçili olmadığı görülüyor. bunu düzelt."

  Kok neden: maybeAutoFetchNearbyPlaces() sayfa her acildiginda/render
  edildiginde (nearbyAutoFetchStarted modul-kapsamli bayragi sayfa
  yenilenince sifirlaniyor) kapsam esigini (hasRequiredNearbyCoverage —
  en az 4 arter + 6 yakin nokta) karsilamayan raporlarda (az POI'li
  bolgeler) SESSIZCE yeniden tarama baslatiyordu.
  fetchNearbyPlacesForCurrentLocation HER taramada selectedIds'i
  KOSULSUZ bosaltiyor — yani kullanicinin elle secip
  (toggleNearbySelection -> selectionCustomized:true) kaydettigi
  secimler sessizce siliniyordu. Duzeltme: kullanici zaten secim
  yaptiysa (selectionCustomized) kapsam esigi karsilanmasa bile
  otomatik yeniden tarama ATLANIR.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

function run({ selectionCustomized, coverageOk, kmlPoint = { lat: 40.1, lng: 29.1 } }) {
  const fetchCalls = [];
  const context = {
    state: {
      sourceValues: {
        kml: kmlPoint ? { centroid: kmlPoint } : null,
        nearbyPlaces: {
          readAt: "2026-08-01T00:00:00.000Z",
          places: [],
          selectedIds: ["poi-1", "poi-2"],
          selectionCustomized,
          loading: false,
        },
      },
    },
    activeSectionId: "address",
    nearbyAutoFetchStarted: false,
    getSelectedMapPoint: () => null,
    hasRequiredNearbyCoverage: () => coverageOk,
    fetchNearbyPlacesForCurrentLocation: (...args) => {
      fetchCalls.push(args);
      return { then: (cb) => { cb(); return { catch: () => {} }; } };
    },
    fetchAddressLookupForCurrentLocation: () => ({ then: (cb) => { cb(); return { catch: () => {} }; } }),
    renderSection: () => {},
    renderValidation: () => {},
    updateStatus: () => {},
    autosave: () => {},
  };
  vm.createContext(context);
  vm.runInContext(sliceFn("function maybeAutoFetchNearbyPlaces("), context);
  context.maybeAutoFetchNearbyPlaces();
  return { fetchCalls, nearbyAutoFetchStarted: context.nearbyAutoFetchStarted };
}

// --- 1) Kullanici zaten secim yaptiysa (selectionCustomized), kapsam esigi
// karsilanmasa bile otomatik yeniden tarama BASLAMAMALI (secimler
// korunmali). ----------------------------------------------------------
{
  const result = run({ selectionCustomized: true, coverageOk: false });
  assert.equal(result.fetchCalls.length, 0, "Kullanici secim yapmisken kapsam yetersiz olsa da otomatik tarama BASLAMAMALIYDI (secimler silinirdi).");
  assert.equal(result.nearbyAutoFetchStarted, false, "Tarama baslamadiysa bayrak da true olmamali.");
}

// --- 2) Kullanici HENUZ secim yapmadiysa VE kapsam yetersizse, otomatik
// tarama normal sekilde BASLAMALI (mevcut/eski davranis korunuyor). ------
{
  const result = run({ selectionCustomized: false, coverageOk: false });
  assert.equal(result.fetchCalls.length, 1, "Secim yokken kapsam yetersizse otomatik tarama baslamali (regresyon: eski davranis bozulmus).");
}

// --- 3) Kapsam zaten yeterliyse (selectionCustomized ne olursa olsun)
// otomatik tarama gerekmez — bu zaten eski davranis, bozulmamali. --------
{
  const result = run({ selectionCustomized: false, coverageOk: true });
  assert.equal(result.fetchCalls.length, 0, "Kapsam yeterliyse otomatik tarama baslamamali.");
  const result2 = run({ selectionCustomized: true, coverageOk: true });
  assert.equal(result2.fetchCalls.length, 0, "Kapsam yeterliyse (secim de yapilmis olsa) otomatik tarama baslamamali.");
}

// --- 4) KML/konum noktasi yoksa hicbir kosulda tarama baslamamali. ------
{
  const result = run({ selectionCustomized: true, coverageOk: false, kmlPoint: null });
  assert.equal(result.fetchCalls.length, 0, "Konum noktasi yoksa otomatik tarama baslamamali.");
}

console.log("Yakin cevre secimi kalicilik (otomatik yeniden tarama korumasi) testi tamam.");
