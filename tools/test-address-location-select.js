"use strict";

/*
  Kullanıcı bildirimi: Adres ve Konum bölümünde İl/İlçe/İdari mahalle için
  gerçek bir açılır liste YOKTU — sadece UAVT PDF'inden serbest metin olarak
  geliyordu (harf büyüklüğü eşleme mantığı eklenmişti ama dropdown'un kendisi
  hiç yoktu). Bu test iki şeyi doğrular:
   1) address section field tanımlarında city/district/neighborhood artık
      type: "select" (Tapu'daki titleCity/titleDistrict/titleNeighborhood
      ile aynı desen).
   2) populateAddressLocationSelect() gerçek app.js kaynağından izole
      çalıştırıldığında idari veritabanından gelen seçenekleri Baş Harf
      Büyük yazılışa çevirip açılır listeyi doldurur; eşleşmeyen bir deger
      degismeden korunur.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- 1) Field tanimi kontrolu -------------------------------------------
const sectionsStart = appSource.indexOf("const sections = [");
const sectionsEnd = appSource.indexOf("\n];", sectionsStart);
assert(sectionsStart > -1 && sectionsEnd > sectionsStart, "sections dizisi bulunamadi.");
const addressStart = appSource.indexOf('id: "address"', sectionsStart);
const addressFieldsSlice = appSource.slice(addressStart, appSource.indexOf('id: "title"', addressStart));
["city", "district", "neighborhood"].forEach((key) => {
  const match = addressFieldsSlice.match(new RegExp(`key: "${key}"[^}]*type: "([a-zA-Z]+)"`));
  assert(match, `${key} alan tanimi bulunamadi.`);
  assert.equal(match[1], "select", `${key} artik gercek bir acilir liste (type: "select") olmali, "${match[1]}" degil.`);
});

// --- 2) populateAddressLocationSelect davranisi -------------------------
const start = appSource.indexOf("async function populateLocationSelect");
const end = appSource.indexOf("function populateAddressLocationSelect", start);
const tailStart = appSource.indexOf("function populateAddressLocationSelect");
const tailEnd = appSource.indexOf("\n}", tailStart) + 2;
assert(start >= 0 && tailStart >= 0, "populateLocationSelect/populateAddressLocationSelect bulunamadi.");

const foldStart = appSource.indexOf("function foldTurkish(");
const foldEnd = appSource.indexOf("\n}", foldStart) + 2;
const titleCaseStart = appSource.indexOf("function toTitleCaseTr(");
const titleCaseEnd = appSource.indexOf("\n}", titleCaseStart) + 2;
assert(foldStart >= 0 && titleCaseStart >= 0, "foldTurkish/toTitleCaseTr bulunamadi.");

const cleanupPlaceStart = appSource.indexOf("function cleanupPlaceName(");
const cleanupPlaceEnd = appSource.indexOf("\n}", cleanupPlaceStart) + 2;
const stripSuffixStart = appSource.indexOf("function stripNeighborhoodSuffix(");
const stripSuffixEnd = appSource.indexOf("\n}", stripSuffixStart) + 2;
const foldPlaceStart = appSource.indexOf("function foldPlaceNameForMatch(");
const foldPlaceEnd = appSource.indexOf("\n}", foldPlaceStart) + 2;
assert(cleanupPlaceStart >= 0 && stripSuffixStart >= 0 && foldPlaceStart >= 0, "Mahalle eki temizleme yardimcilari bulunamadi.");

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

async function runScenario({ storedValue, choices }) {
  const control = createSelectStub();
  const context = {
    document: { createElement: (tag) => (tag === "option" ? { value: "", textContent: "" } : {}) },
    state: { fields: { neighborhood: storedValue, city: "YALOVA", district: "ARMUTLU" } },
    autosave: () => { context.autosaveCalled = true; },
    fetchNeighborhoodLookup: async () => ({ ok: true, choices }),
  };
  vm.createContext(context);
  vm.runInContext(appSource.slice(foldStart, foldEnd), context);
  vm.runInContext(appSource.slice(titleCaseStart, titleCaseEnd), context);
  vm.runInContext(appSource.slice(cleanupPlaceStart, cleanupPlaceEnd), context);
  vm.runInContext(appSource.slice(stripSuffixStart, stripSuffixEnd), context);
  vm.runInContext(appSource.slice(foldPlaceStart, foldPlaceEnd), context);
  vm.runInContext(appSource.slice(start, end) + appSource.slice(tailStart, tailEnd), context);
  await context.populateAddressLocationSelect(control, "neighborhood");
  return {
    optionValues: control.options.map((o) => o.value),
    selected: control.value,
    stateValue: context.state.fields.neighborhood,
  };
}

// DB (CSV) ham veri TUMU BUYUK gelir; Adres icin Bas Harf Buyuk gosterilmeli.
const dbChoicesUpper = ["50. YIL", "BAYIR", "KARŞIYAKA", "YALI MAH (FISTIKLI KÖYÜ)"];

(async () => {
  const matched = await runScenario({ storedValue: "KARŞIYAKA", choices: dbChoicesUpper });
  assert.equal(matched.selected, "Karşıyaka", "Eslesen deger Bas Harf Buyuk yazilisa cevrilmeli (TUMU BUYUK degil).");
  assert.equal(matched.stateValue, "Karşıyaka", "state.fields de Bas Harf Buyuk yazilisa guncellenmeli.");
  assert(
    matched.optionValues.includes("Karşıyaka") && !matched.optionValues.includes("KARŞIYAKA"),
    `Secenekler de Bas Harf Buyuk gosterilmeli, TUMU BUYUK kalmamali: ${JSON.stringify(matched.optionValues)}`
  );
  assert.equal(
    matched.optionValues.filter((v) => v === "Karşıyaka").length,
    1,
    "Eslesen deger listede iki kez gorunmemeli."
  );

  const unmatched = await runScenario({ storedValue: "Uydurma Mahalle", choices: dbChoicesUpper });
  assert.equal(unmatched.selected, "Uydurma Mahalle", "Eslesmeyen UAVT degeri degismeden korunmali.");

  // Kullanici bildirimi: UAVT PDF'i mahalleyi EKLİ verir ("Hacıseyfettin
  // Mahallesi"), idari veritabani EKSİZ tutar ("HACISEYFETTİN"). Ek
  // atilmadan yapilan foldTurkish karsilastirmasi eslesmeyi kaciriyordu.
  const suffixed = await runScenario({
    storedValue: "Hacıseyfettin Mahallesi",
    choices: ["HACISEYFETTİN", "BAYIR"],
  });
  assert.equal(
    suffixed.selected,
    "Hacıseyfettin",
    `"Hacıseyfettin Mahallesi" -> acilir listeden "Hacıseyfettin" secilmeli: ${JSON.stringify(suffixed)}`
  );
  assert.equal(suffixed.stateValue, "Hacıseyfettin", "state.fields de ek atilmis Bas Harf Buyuk yazilisa guncellenmeli.");

  console.log("Adres ve Konum acilir liste testi tamam.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
