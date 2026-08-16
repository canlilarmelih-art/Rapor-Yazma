"use strict";

/*
  Kullanici bildirimi (2026-08-17): "talebe girip ciktigimda Adres ve Konum
  kismindaki il ve ilce bolumu siliniyor. gorseldeki gibi daha once bu
  sorunu cozmeye calistik ama anladigim kadari ile olmamis sorun halen
  devam ediyor." Ekran goruntusunde: Il ve Ilce "Seciniz" (bos), ama Idari
  Mahalle ("Altinsehir") ve diger tum turetilmis adres alanlari DOLU.

  Kok neden netlestirme ("Talebe girip ciktigimda" ne demek?) AskUserQuestion
  ile soruldu, cevap: "Raporu kapatip yeniden acmak" (Taleplerim listesinden
  ayni raporu tekrar acmak) - state.fields.city/district SIFIRLANMIYOR
  gibi gorunuyordu (Idari Mahalle dolu kaliyordu), sorun SELECT'in EKRANDA
  bos gorunmesiydi.

  Gercek kok neden: clearRetiredAddressSourceFields() (app.js) HER
  normalizeAddressSourceState() cagrisinda (= HER SAYFA ACILISINDA, app.js
  modul-baslangicinda VE restoreStateFromImportedJson'da - yani "raporu
  kapatip yeniden acmak" DAHIL) calisiyor. city/district Adres Kodu (PDF)
  kaynagindan otomatik doldurulmussa (`sourceOwnedValues` icinde eski
  "applied" veya eski parse degeriyle ESLESIYORSA) fonksiyon o alani
  KOSULSUZ bosaltiyordu - "kaynak ARTIK bu degeri saglamiyorsa temizle"
  niyetiyle yazilmis olmasina ragmen, "TAZE yeniden ayristirilan `fields`"
  degeri de (parseAddressCodeText rawText'i HER seferinde yeniden
  ayristirdigindan, normalde AYNI sonucu uretir) "sourceOwnedValues"a dahil
  edildigi icin, kaynak degismemis olsa BILE (normal/sik durum) alan HER
  ACILISTA siliniyordu. neighborhood bu listede olmadigindan etkilenmiyordu
  - ekran goruntusundeki asimetriyle (Il/Ilce bos, Mahalle dolu) BIREBIR
  ortusuyor.

  Duzeltme: artik SADECE "onceden kaynakliydi VE taze parse ARTIK ayni
  degeri DOGRULAMIYOR" ise temizlenir. addressBlockName/blockName icin
  ayristirma KALICI olarak kaldirildigindan (parseAddressCodeText bu ikisi
  icin HER ZAMAN "" doner) davranis DEGISMEDI (hep temizlenir).
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

const clearRetiredSrc = sliceFn("function clearRetiredAddressSourceFields(");

function run(clearRetired, fields, previousApplied, targetState, previousFields) {
  return clearRetired(fields, previousApplied, targetState, previousFields);
}

function makeContext() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(clearRetiredSrc, context);
  return context;
}

// --- 1) "Raporu kapatip yeniden acmak" (normal reload, kaynak HALA AYNI
// degeri dogruluyor) -> il/ilce SILINMEMELI (asil bildirilen hata). --------
{
  const context = makeContext();
  const targetState = {
    fields: { city: "Bursa", district: "Nilüfer" },
    sourceValues: { address: { fields: { city: "Bursa", district: "Nilüfer" }, applied: { city: "Bursa", district: "Nilüfer" } } },
    sourceConflicts: { address: {} },
  };
  // Taze yeniden ayristirilan `fields` (rawText degismedigi icin AYNI sonucu
  // uretiyor) - normalizeAddressSourceState'teki gercek cagri deseniyle
  // BIREBIR: fields === targetState.sourceValues.address.fields (ayni obje).
  const freshFields = targetState.sourceValues.address.fields;
  const previousApplied = { city: "Bursa", district: "Nilüfer" };
  const previousFields = { city: "Bursa", district: "Nilüfer" };
  context.clearRetiredAddressSourceFields(freshFields, previousApplied, targetState, previousFields);
  assert.equal(targetState.fields.city, "Bursa", `REGRESYON: Il, kaynak hala ayni degeri dogruladigi halde silindi: ${JSON.stringify(targetState.fields.city)}`);
  assert.equal(targetState.fields.district, "Nilüfer", `REGRESYON: Ilce, kaynak hala ayni degeri dogruladigi halde silindi: ${JSON.stringify(targetState.fields.district)}`);
  assert.equal(targetState.sourceValues.address.applied.city, "Bursa", "applied.city guncel tutulmali (silinmemeli) - sonraki acilista da dogru karsilastirma yapilabilsin.");
}

// --- 2) IKI ARDISIK acilis (reload #1 -> reload #2) -- applied izlemesi
// kaybolmadan alan HER IKI acilista da korunmali (derin regresyon: applied
// silinirse "kaynakli mi" bilgisi kaybolup bir SONRAKI acilista - farkli bir
// nedenle - tekrar silinme riski dogar). ------------------------------------
{
  const context = makeContext();
  const targetState = {
    fields: { city: "Bursa" },
    sourceValues: { address: { fields: { city: "Bursa" }, applied: { city: "Bursa" } } },
    sourceConflicts: { address: {} },
  };
  // reload #1
  context.clearRetiredAddressSourceFields(targetState.sourceValues.address.fields, { city: "Bursa" }, targetState, { city: "Bursa" });
  assert.equal(targetState.fields.city, "Bursa", "1. acilistan sonra Il korunmali.");
  // reload #2: previousApplied/previousFields artik targetState'in GUNCEL
  // (1. acilistan sonraki) sourceValues.address kayitlaridir.
  const previousAppliedRound2 = { ...targetState.sourceValues.address.applied };
  const previousFieldsRound2 = { ...targetState.sourceValues.address.fields };
  context.clearRetiredAddressSourceFields(targetState.sourceValues.address.fields, previousAppliedRound2, targetState, previousFieldsRound2);
  assert.equal(targetState.fields.city, "Bursa", `2. (ardisik) acilistan sonra da Il korunmali - applied izlemesi kaybolmus olabilir: ${JSON.stringify(targetState.fields.city)}`);
}

// --- 3) GERCEK "kaynak retired" senaryosu (kullanici FARKLI/bos bir Adres
// Kodu yeniden yukledi, yeni parse artik il/ilce URETMIYOR) -> onceden
// kaynakli deger HALA SILINMELI (kastedilen davranis KORUNMALI). ----------
{
  const context = makeContext();
  const targetState = {
    fields: { city: "Bursa" },
    sourceValues: { address: { fields: { city: "" }, applied: { city: "Bursa" } } }, // taze parse artik bos
    sourceConflicts: { address: { city: true } },
  };
  context.clearRetiredAddressSourceFields(targetState.sourceValues.address.fields, { city: "Bursa" }, targetState, { city: "Bursa" });
  assert.equal(targetState.fields.city, "", `Kaynak artik il saglamiyorsa (retired) alan HALA silinmeli: ${JSON.stringify(targetState.fields.city)}`);
  assert.equal(targetState.sourceValues.address.applied.city, undefined, "Retired olunca applied izlemesi de silinmeli.");
  assert.equal(targetState.sourceConflicts.address.city, undefined, "Retired olunca sourceConflicts izlemesi de silinmeli.");
}

// --- 4) Kullanici alani KENDI ELIYLE kaynaktan FARKLI bir degere
// degistirmis (ornegin duzeltme) -> her iki senaryoda da (kaynak hala ayni
// eski degeri uretsin veya uretmesin) KULLANICI degeri KORUNMALI, zaten
// onceki davranista da boyleydi (regresyon kontrolu). ----------------------
{
  const context = makeContext();
  const targetState = {
    fields: { city: "İstanbul" }, // kullanici Bursa'dan Istanbul'a elle degistirdi
    sourceValues: { address: { fields: { city: "Bursa" }, applied: { city: "Bursa" } } },
    sourceConflicts: { address: {} },
  };
  context.clearRetiredAddressSourceFields(targetState.sourceValues.address.fields, { city: "Bursa" }, targetState, { city: "Bursa" });
  assert.equal(targetState.fields.city, "İstanbul", `Kullanicinin elle girdigi deger korunmali: ${JSON.stringify(targetState.fields.city)}`);
}

// --- 5) addressBlockName/blockName: ayristirma KALICI olarak kaldirildigi
// icin (parseAddressCodeText HER ZAMAN "" doner) onceden kaynakliysa HALA
// (degismeden) temizlenmeli - REGRESYON kontrolu. --------------------------
{
  const context = makeContext();
  const targetState = {
    fields: { addressBlockName: "A Blok", blockName: "A Blok" },
    sourceValues: { address: { fields: { addressBlockName: "", blockName: "" }, applied: { addressBlockName: "A Blok", blockName: "A Blok" } } },
    sourceConflicts: { address: {} },
  };
  context.clearRetiredAddressSourceFields(
    targetState.sourceValues.address.fields,
    { addressBlockName: "A Blok", blockName: "A Blok" },
    targetState,
    { addressBlockName: "A Blok", blockName: "A Blok" },
  );
  assert.equal(targetState.fields.addressBlockName, "", "REGRESYON: addressBlockName (kalici olarak kaldirilmis alan) artik temizlenmiyor.");
  assert.equal(targetState.fields.blockName, "", "REGRESYON: blockName (kalici olarak kaldirilmis alan) artik temizlenmiyor.");
}

console.log("Adres kaynagi yeniden yuklendiginde Il/Ilce'nin korunmasi testi tamam.");
