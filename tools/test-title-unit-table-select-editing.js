"use strict";

/*
  Kullanici bildirimi (2026-08-17): raporu test ederken "sulama kaynagi
  belirtilmemis" gozlemlendi, ardindan: "bu tablolarda kullanici degisiklik
  yaparken eger degisiklik yaptigi bolum acilir liste ise tablo uzerinde
  degisiklik yapilmaya calisildiginda da ayni acilir liste olmali."

  Kok neden: Tasinmazlar Tapu/Adres/Imar/Arsa Ozeti tablolarinin (Cift
  Yonlu Duzenleme) TUMU beginEditingTitleUnitsSummaryCell()'i PAYLASIYOR
  ve bu fonksiyon HER "scalar" hucreyi (alanin GERCEK formda select mi
  text mi oldugundan BAGIMSIZ) sabit bir <input type="text"> ile
  duzenletiyordu. "Su Kaynagi" (landIrrigationWaterSource) ozelinde bu
  cift kat sorun yaratiyordu: bu alan section.fields'ta HIC deklaratif
  olarak listelenmiyor (yalnizca "Sulu Tarim Detayi" popup'inda elle
  yerlestiriliyor), yani serbest metinle yazilan bir deger form'un
  KENDI acilir listesindeki (irrigationWaterSourceOptions) seceneklerle
  eslesmeyebiliyor - kullanici "kuyu" yazsa GERCEK secenek "Kuyu Suyu"
  ile eslesmez, sonuc "belirtilmemis" gibi gorunur.

  Duzeltme: yeni getSelectOptionsForFieldKey(fieldKey) - alanin GERCEK
  formundaki (statik) secenek listesini bulur; beginEditingTitleUnitsSummaryCell
  artik bu liste VARSA <select>, YOKSA (ornegin canli/idari veritabanindan
  doldurulan Il/Ilce gibi statik options'i olmayan alanlar) eskisi gibi
  <input type="text"> uretir.

  Bu test getSelectOptionsForFieldKey()'i (saf, DOM'suz) gercek app.js
  kaynagindan izole calistirir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

function sliceArray(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n];", start) + 3;
  return appSource.slice(start, end);
}

const getSelectOptionsSrc = sliceFn("function getSelectOptionsForFieldKey(");
const irrigationWaterSourceOptionsSrc = sliceArray("const irrigationWaterSourceOptions = [");
const irrigationSystemOptionsSrc = sliceArray("const irrigationSystemOptions = [");

function run(sectionsFixture, fieldKey) {
  const context = { sections: sectionsFixture };
  vm.createContext(context);
  vm.runInContext(irrigationWaterSourceOptionsSrc, context);
  vm.runInContext(irrigationSystemOptionsSrc, context);
  vm.runInContext(getSelectOptionsSrc, context);
  return context.getSelectOptionsForFieldKey(fieldKey);
}

const FIXTURE_SECTIONS = [
  {
    id: "land",
    fields: [
      { key: "landShape", label: "Arsanın geometrik şekli", type: "select", options: ["", "Dikdörtgen", "Kare"] },
      { key: "landNote", label: "Arsa açıklaması", type: "textarea" },
    ],
  },
  {
    id: "address",
    // Il/Ilce/Idari Mahalle GERCEK formda static bir options dizisi
    // TASIMAZ (canli idari veritabanindan async doldurulur, bkz.
    // populateAddressLocationSelect) - fixture bunu BIREBIR yansitir.
    fields: [
      { key: "city", label: "İl", type: "select", required: true },
      { key: "street", label: "Sokak / cadde", type: "text" },
    ],
  },
];

// --- 1) Statik options'i olan GERCEK bir select alani -> secenekler doner -
{
  const options = run(FIXTURE_SECTIONS, "landShape");
  assert.deepEqual(options, ["", "Dikdörtgen", "Kare"], `landShape icin static options donmeliydi: ${JSON.stringify(options)}`);
  console.log("Statik secenekli select alani -> dogru options donusu testi tamam.");
}

// --- 2) Canli/idari veritabanindan doldurulan select (Il) -> null döner ---
// (KASITLI kapsam disi - populateAddressLocationSelect'in canli agi
// tekrarlamak bu duzeltmenin kapsami DISINDA, metin girisine dusulur).
{
  const options = run(FIXTURE_SECTIONS, "city");
  assert.equal(options, null, `Statik options'i OLMAYAN (canli doldurulan) "city" icin null donmeliydi, bulunan: ${JSON.stringify(options)}`);
  console.log("Canli/idari veritabanindan doldurulan select (Il) -> null (kapsam disi) testi tamam.");
}

// --- 3) type: "text" alani -> null döner ------------------------------------
{
  const options = run(FIXTURE_SECTIONS, "street");
  assert.equal(options, null, "type:\"text\" alani icin null donmeliydi.");
  console.log("Metin alani -> null donusu testi tamam.");
}

// --- 4) Hicbir sections'ta olmayan bir anahtar -> null döner ---------------
{
  const options = run(FIXTURE_SECTIONS, "olmayanAlan");
  assert.equal(options, null, "Bilinmeyen bir alan anahtari icin null donmeliydi.");
  console.log("Bilinmeyen alan anahtari -> null donusu testi tamam.");
}

// --- 5) landIrrigationWaterSource/landIrrigationSystem: section.fields'ta --
// HIC YOK (yalnizca Sulu Tarim Detayi popup'inda elle yerlestiriliyor) -
// ama YINE DE dogru secenekleri donmeli (kullanicinin bildirdigi ASIL
// hata - "sulama kaynagi belirtilmemis").
{
  const waterOptions = run(FIXTURE_SECTIONS, "landIrrigationWaterSource");
  assert.ok(Array.isArray(waterOptions) && waterOptions.length > 1, `landIrrigationWaterSource icin (section.fields'ta olmamasina ragmen) gercek secenek listesi donmeliydi, bulunan: ${JSON.stringify(waterOptions)}`);
  assert.ok(waterOptions.includes("Kuyu Suyu"), `Gercek "Sulu Tarim Detayi" popup secenekleriyle (irrigationWaterSourceOptions) AYNI liste donmeliydi: ${JSON.stringify(waterOptions)}`);

  const systemOptions = run(FIXTURE_SECTIONS, "landIrrigationSystem");
  assert.ok(Array.isArray(systemOptions) && systemOptions.length > 1, `landIrrigationSystem icin gercek secenek listesi donmeliydi, bulunan: ${JSON.stringify(systemOptions)}`);
  console.log("landIrrigationWaterSource/landIrrigationSystem (popup-only alanlar) -> dogru secenekler testi tamam.");
}

// --- 6) Kaynak-duzeyi: beginEditingTitleUnitsSummaryCell() secenek --------
// VARSA <select>, YOKSA <input type="text"> uretiyor mu (DOM gerektirdigi
// icin davranissal olarak test edilemiyor, bkz. dosya basi yorum -
// canli tarayicida dogrulanmali).
{
  const fnSrc = sliceFn("function beginEditingTitleUnitsSummaryCell(");
  assert.match(
    fnSrc,
    /const selectOptions = getSelectOptionsForFieldKey\(fieldKey\);/,
    "beginEditingTitleUnitsSummaryCell artik getSelectOptionsForFieldKey() sonucuna gore dallanmali."
  );
  assert.match(
    fnSrc,
    /document\.createElement\(selectOptions \? "select" : "input"\)/,
    "Hucre duzenleyicisi secenek VARSA <select>, YOKSA <input> uretmeli."
  );
  console.log("beginEditingTitleUnitsSummaryCell select/input dallanmasi (kaynak-duzeyi) testi tamam.");
}

console.log("Tablo hucresi duzenleme: acilir liste alanlari testleri basarili.");
