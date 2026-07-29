"use strict";

/*
  Regresyon: Tapu İl/İlçe/Mahalle açılır listeleri TAKBİS'ten gelen değeri
  ("Karşıyaka") ile veritabanındaki kanonik seçeneği ("KARŞIYAKA") harf
  büyüklüğü/aksan farkı yüzünden AYRI iki seçenek sayıyordu — kullanıcı
  ekran görüntüsünde "Karşıyaka" listede İKİ KEZ (biri fazladan enjekte
  edilmiş, biri gerçek KARŞIYAKA seçeneği) görünüyordu.

  populateLocationSelect() (Tapu ve Adres ve Konum açılır listelerinin
  paylaştığı ortak fonksiyon) gerçek app.js kaynağından, gerçek DOM (jsdom
  benzeri minimal stub) ile izole çalıştırılır; fetchNeighborhoodLookup
  stub'lanır. Bu test Tapu tarafını (casing yok, TÜMÜ BÜYÜK karşılaştırma)
  kapsar; Adres ve Konum'un Baş Harf Büyük dönüşümü ayrı testte
  (test-address-place-casing.js) doğrulanır.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = appSource.indexOf("async function populateLocationSelect");
const end = appSource.indexOf("function populateTitleLocationSelect", start);
assert(start >= 0 && end > start, "populateLocationSelect fonksiyonu bulunamadi.");

const foldStart = appSource.indexOf("function foldTurkish(");
const foldEnd = appSource.indexOf("\n}", foldStart) + 2;
assert(foldStart >= 0, "foldTurkish fonksiyonu bulunamadi.");

const cleanupPlaceStart = appSource.indexOf("function cleanupPlaceName(");
const cleanupPlaceEnd = appSource.indexOf("\n}", cleanupPlaceStart) + 2;
const stripSuffixStart = appSource.indexOf("function stripNeighborhoodSuffix(");
const stripSuffixEnd = appSource.indexOf("\n}", stripSuffixStart) + 2;
const foldPlaceStart = appSource.indexOf("function foldPlaceNameForMatch(");
const foldPlaceEnd = appSource.indexOf("\n}", foldPlaceStart) + 2;
assert(cleanupPlaceStart >= 0 && stripSuffixStart >= 0 && foldPlaceStart >= 0, "Mahalle eki temizleme yardimcilari bulunamadi.");

// Minimal DOM stub: yalnizca <select>/<option> icin gereken kadar.
function createSelectStub() {
  const options = [];
  const select = {
    isConnected: true,
    _value: "",
    get options() { return options; },
    set value(v) { this._value = options.some((o) => o.value === v) ? v : ""; },
    get value() { return this._value; },
    replaceChildren() { options.length = 0; },
    append(option) { options.push(option); },
  };
  return select;
}

function createOptionStub() {
  return { value: "", textContent: "" };
}

async function runScenario({ storedValue, choices }) {
  const control = createSelectStub();
  const context = {
    document: { createElement: (tag) => (tag === "option" ? createOptionStub() : {}) },
    state: { fields: { titleNeighborhood: storedValue } },
    autosave: () => { context.autosaveCalled = true; },
    fetchNeighborhoodLookup: async () => ({ ok: true, choices }),
  };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(cleanupPlaceStart, cleanupPlaceEnd), context);
  vm.runInContext(appSource.slice(stripSuffixStart, stripSuffixEnd), context);
  vm.runInContext(appSource.slice(foldPlaceStart, foldPlaceEnd), context);
  vm.runInContext(appSource.slice(start, end), context);
  await context.populateLocationSelect(control, "titleNeighborhood", "neighborhood", "titleCity", "titleDistrict");
  return {
    optionValues: control.options.map((o) => o.value),
    selected: control.value,
    stateValue: context.state.fields.titleNeighborhood,
    autosaveCalled: Boolean(context.autosaveCalled),
  };
}

const dbChoices = [
  "50. YIL", "BAYIR", "HAYRİYE MERKEZ MAH (HAYRİYE KÖYÜ)", "İHSANİYE MAH (MECİDİYE KÖYÜ)",
  "KARŞIYAKA", "KÖY MERKEZİ MAH (FISTIKLI KÖYÜ)",
];

(async () => {
  // 1) TAKBİS'ten karışık büyük/küçük harfle gelen deger listede TEK sefer
  //    gorunmeli, kanonik (veritabanindaki) yaziliş secili olmali.
  const mixedCase = await runScenario({ storedValue: "Karşıyaka", choices: dbChoices });
  const karsiyakaCount = mixedCase.optionValues.filter(
    (value) => value.toLocaleUpperCase("tr") === "KARŞIYAKA"
  ).length;
  assert.equal(karsiyakaCount, 1, `"Karşıyaka" listede tek olmali, ikinci kez enjekte edilmemeli: ${JSON.stringify(mixedCase.optionValues)}`);
  assert.equal(mixedCase.selected, "KARŞIYAKA", "Secili deger listedeki kanonik yaziliş olmali.");
  assert.equal(mixedCase.stateValue, "KARŞIYAKA", "state.fields de kanonik yazilisa guncellenmeli (kendi kendini onarma).");
  assert.equal(mixedCase.autosaveCalled, true, "Kanonik yaziliş uygulaninca autosave tetiklenmeli.");

  // 2) Zaten kanonik olan deger degismemeli, gereksiz autosave tetiklenmemeli.
  const alreadyCanonical = await runScenario({ storedValue: "KARŞIYAKA", choices: dbChoices });
  assert.equal(alreadyCanonical.selected, "KARŞIYAKA", "Zaten kanonik deger bozulmamali.");
  assert.equal(alreadyCanonical.autosaveCalled, false, "Deger zaten kanonikken gereksiz autosave tetiklenmemeli.");

  // 3) Listede hicbir seceneğe (case-insensitive) uymayan YENİ bir deger
  //    veri kaybi olmadan aynen korunmali (tek secenek olarak eklenir).
  const novel = await runScenario({ storedValue: "Yepyeni Mahalle", choices: dbChoices });
  assert.equal(novel.selected, "Yepyeni Mahalle", "Listede olmayan yeni deger kaybolmamali.");
  const novelCount = novel.optionValues.filter((v) => v === "Yepyeni Mahalle").length;
  assert.equal(novelCount, 1, "Bilinmeyen deger listede tek kez gorunmeli.");

  console.log("Tapu konum secimi harf buyuklugu esleme testi tamam.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
