"use strict";

/*
  Kullanici talebi: "emsal açıklaması değişmemiş dükkana ve katlara göre bu
  açıklama düzenlenmeli" — Emsaller'e kat bazında alan/indirgeme oranı
  eklendikten (bkz. test-comparable-workplace-floor-reduction.js) sonra
  otomatik uretilen emsal aciklamasi (calcLongText) hala eski, tek katlı,
  duz "Beyan Edilen Alan/Duzeltilmis Alan" cumlesini kullaniyordu; kat
  bazinda alan girildiginde bu bilgiyi YANSITMIYORDU.

  Cozum: yeni buildComparableWorkplaceFloorAreaPhrase(row) — workplaceFloors
  icinde alani dolu olan HER kat icin ayri bir ifade uretir, orn. "zemin
  katta 100 m2, asma katta 50 m2 olarak beyan edilen". Bu ifade varsa
  buildComparableLongText() eski floor/declaredArea/correctedArea
  parcalarini KULLANMAZ (cift bilgi olmasin diye); yoksa eski davranis
  aynen korunur.

  Bu test iki katmani izole dogrular:
  1) buildComparableWorkplaceFloorAreaPhrase — gercek kaynaktan, gercek
     bagimliliklarla (normalizeComparableFloorName, joinComparableTurkishList,
     formatComparableArea, parseComparableNumber).
  2) buildComparableLongText — gercek kaynaktan, bu testin kapsami disindaki
     alt-cumle uretici fonksiyonlar (irtibat, konum, yas, karsilastirma,
     pazarlik/kira, hesaplama metni vb.) sabit/basit stub'larla degistirilir;
     odak SADECE kat-bazli alan ifadesinin dogru yerde gorunmesi VE eski
     floor/declaredArea/correctedArea parcalarinin bu durumda BASTIRILMASIDIR.
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

const normalizeComparableFloorNameSrc = sliceFn("function normalizeComparableFloorName(");
const joinComparableTurkishListSrc = sliceFn("function joinComparableTurkishList(");
const formatComparableAreaSrc = sliceFn("function formatComparableArea(");
const parseComparableNumberSrc = sliceFn("function parseComparableNumber(");
const buildComparableWorkplaceFloorAreaPhraseSrc = sliceFn("function buildComparableWorkplaceFloorAreaPhrase(");
const buildComparableFloorPhraseSrc = sliceFn("function buildComparableFloorPhrase(");
const buildComparableLongTextSrc = sliceFn("function buildComparableLongText(");

// --- 1) buildComparableWorkplaceFloorAreaPhrase — saf fonksiyon testi ---
{
  const context = {};
  vm.createContext(context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(normalizeComparableFloorNameSrc, context);
  vm.runInContext(joinComparableTurkishListSrc, context);
  vm.runInContext(formatComparableAreaSrc, context);
  vm.runInContext(buildComparableWorkplaceFloorAreaPhraseSrc, context);

  const twoFloor = context.buildComparableWorkplaceFloorAreaPhrase({
    workplaceFloors: [
      { floor: "Zemin kat", area: "100", rate: "100%" },
      { floor: "Asma kat", area: "50", rate: "30%" },
    ],
  });
  assert.equal(
    twoFloor,
    "zemin katta 100 m2 ve asma katta 50 m2 olarak beyan edilen",
    `İki katlı ifade beklenenle eşleşmeli: "${twoFloor}"`
  );

  const areaBlank = context.buildComparableWorkplaceFloorAreaPhrase({
    workplaceFloors: [{ floor: "Ara kat", area: "", rate: "100%" }],
  });
  assert.equal(areaBlank, "", "Alan boşken (kat seçili olsa da) ifade boş dönmeli.");

  const noFloors = context.buildComparableWorkplaceFloorAreaPhrase({});
  assert.equal(noFloors, "", "workplaceFloors hiç yokken ifade boş dönmeli.");
}

// --- 2) buildComparableLongText — kablolama entegrasyon testi ------------
function createLongTextContext(fields = {}) {
  const context = {
    state: { fields: { appointmentType: "", ...fields } },
    isLandComparable: () => false,
    buildComparableLandLongText: () => "",
    buildComparableGeneralStatement: () => "",
    buildComparableSubjectStatement: () => "",
    buildComparableContactLine: () => "İRTİBAT_SATIRI",
    buildComparableLocationLocative: () => "KONUM_İFADESİ",
    buildComparableBuildingAgePhrase: () => "",
    getComparableStatusText: () => "",
    buildComparablePositionComparisonText: () => "",
    isExternalAppointmentType: () => false,
    buildComparableFeatureComparisonText: () => "",
    buildComparableBargainAndRentText: () => "",
    buildComparableCalculationText: () => "",
    formatComparableExtraNote: () => "",
    normalizeComparableText: (value) => value,
  };
  vm.createContext(context);
  vm.runInContext(parseComparableNumberSrc, context);
  vm.runInContext(normalizeComparableFloorNameSrc, context);
  vm.runInContext(joinComparableTurkishListSrc, context);
  vm.runInContext(formatComparableAreaSrc, context);
  vm.runInContext(buildComparableWorkplaceFloorAreaPhraseSrc, context);
  vm.runInContext(buildComparableFloorPhraseSrc, context);
  vm.runInContext(buildComparableLongTextSrc, context);
  return context;
}

// 2a) Kat bazında alan girilmişse: açıklama her katı ayrı belirtmeli, eski
//     "X katta yer alan, Y m2 olarak beyan edilen" ifadesi GÖRÜNMEMELİ.
{
  const context = createLongTextContext();
  const row = {
    c0: "Duygu Hanım", c2: "Satılık", c4: "işyeri", c5: "Dükkan", c6: "Zemin kat, Asma kat",
    c12: "150", c13: "",
    workplaceFloors: [
      { floor: "Zemin kat", area: "100", rate: "100%" },
      { floor: "Asma kat", area: "50", rate: "30%" },
    ],
  };
  const text = context.buildComparableLongText(row, 0, {});
  assert.match(text, /zemin katta 100 m2 ve asma katta 50 m2 olarak beyan edilen/, `Kat bazlı alan ifadesi metinde olmalı: "${text}"`);
  assert.doesNotMatch(text, /katta yer alan/, `Eski tek-kat ifadesi ("katta yer alan") artık kullanılmamalı: "${text}"`);
  assert.doesNotMatch(text, /150 m2 olarak beyan edilen/, `Eski düz Beyan Edilen Alan (c12) cümlesi bastırılmalı: "${text}"`);
}

// 2b) Kat seçili ama TÜM alanlar boşsa: eski davranışa (c6 kat ifadesi +
//     Beyan Edilen/Düzeltilmiş Alan) AYNEN dönülmeli.
{
  const context = createLongTextContext();
  const row = {
    c0: "Recep Bey", c2: "Satılık", c4: "daire", c5: "3+1", c6: "Ara kat",
    c12: "143", c13: "125",
    workplaceFloors: [{ floor: "Ara kat", area: "", rate: "100%" }],
  };
  const text = context.buildComparableLongText(row, 1, {});
  assert.match(text, /ara katta yer alan/, `Eski kat ifadesi korunmalı: "${text}"`);
  assert.match(text, /143 m2 olarak beyan edilen/, `Eski Beyan Edilen Alan cümlesi korunmalı: "${text}"`);
  assert.match(text, /125 m2 olduğu düşünülen/, `Eski Düzeltilmiş Alan cümlesi korunmalı: "${text}"`);
}

// 2c) workplaceFloors hiç yoksa (eski/kaydedilmemiş emsal satırı): çökmeden
//     eski davranışa dönülmeli.
{
  const context = createLongTextContext();
  const row = { c0: "Yaren Hanım", c2: "Satılık", c4: "daire", c5: "3+1", c6: "Çatı Dubleks", c12: "155", c13: "130" };
  const text = context.buildComparableLongText(row, 2, {});
  assert.match(text, /çatı dubleks katta yer alan/, `workplaceFloors yokken eski kat ifadesi korunmalı: "${text}"`);
}

console.log("Emsaller kat bazinda aciklama (dukkana/katlara gore) testi tamam.");
