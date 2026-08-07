"use strict";

/*
  Kullanici, Vakıfbank sablonu icin karsiligi olmayan alanlarin listesini
  gorup 8 tanesini secti ve her biri icin talimat verdi:

  6) Bölgede Güvenlik Problemi Var Mı? -> mevcut regionSecurityIssue
     alaninin cevabi ({{REGİON_SECURİTY_İSSUE}}).
  2) Yapılaşma Hızı -> mevcut developmentSpeed alaninin cevabi
     ({{DEVELOPMENT_SPEED}}).
  7) Karma Yapı Var mı? -> "Bölge Yapılaşma Kul. Amacı zemin ve normal kat
     konut ise hayır diğer seçenekler evet" -> yeni getMixedUseBuildingText().
  5) Mülk Değeri Değişimi (Artıyor/Azalıyor/Sabit) -> yeni "propertyValueTrend"
     alani + {{PROPERTY_VALUE_TREND}}.
  8) Mesken Kullanım Durumu -> "ana gayrimenkulde yer alan katlardan
     herhangi birinde en az 1 daire var ise Evet" -> yeni
     getResidentialUsagePresentText().
  9) 2960 Sayılı Boğaziçi Kanunu Kapsamında mı? -> "Hayır" (sabit).
  10) Kültür Varlığı / Tarihi Eser mi? -> "Hayır" (sabit).
  11) Deprem Dayanıklılığı/Gözlemsel Hasar Durumu -> "Hasarsız" (sabit,
      ziraat.html'deki ayni oruntuye uygun); Deprem Derecesi ->
      {{EARTHQUAKE_ZONE}} (var olan earthquakeZone alani).
  12) Pencere Doğramaları / Kapı Doğramaları -> zaten var olan {{PENCERE}}
      ve {{İÇKAPI}} (ICKAPI) alias'lari kullanildi (Dış Kapı zaten
      "Ana Gayrimenkul Tanımı" tablosunda {{BUİLDİNG_ENTRANCE_DOOR}} ile
      gosteriliyordu, tekrar eklenmedi).
  13) Oda/Salon/Mutfak/Banyo/WC/Balkon sayıları -> zaten var olan
      {{ODA}}/{{SALON}}/{{MUTFAK}}/{{BANYO}}/{{TUVALET}}/{{BALKON}}
      (getGabimUnitInteriorCounts) alias'lari kullanildi.

  Bu test:
  1) getResidentialUsagePresentText() ve getMixedUseBuildingText()
     (app.js, yeni) fonksiyonlarini izole calistirip dogru sonucu
     dogrular.
  2) Yeni "propertyValueTrend" alaninin app.js sema tanimini dogrular.
  3) template-engine.js'teki yeni RESIDENTIALUSAGEPRESENT/MIXEDUSEBUILDING
     alias kablolamasini dogrular.
  4) templates/vakifbank.html'de tum yeni satirlarin (Güvenlik/Yapılaşma
     Hızı/Mülk Değeri Değişimi/Karma Yapı/Mesken Kullanım/Deprem/2960/
     Kültür Varlığı/Pencere-İç Kapı/Oda-Salon-Mutfak-Banyo-WC-Balkon)
     dogru token'larla var oldugunu dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");
const templatePath = path.join(appDir, "templates", "vakifbank.html");
const template = fs.readFileSync(templatePath, "utf8");

function indexAfter(text, needle, fromIndex) {
  const idx = text.indexOf(needle, fromIndex);
  assert(idx >= 0, `Bulunamadi: "${needle}"`);
  return idx;
}

function sliceFn(startMarker) {
  const start = appSource.indexOf(startMarker);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}

// --- 1) getResidentialUsagePresentText() ----------------------------------
{
  function run(buildingFloors) {
    const context = { state: { tables: { buildingFloors } } };
    vm.createContext(context);
    vm.runInContext(sliceFn("function parseBuildingFloorCount("), context);
    vm.runInContext(sliceFn("function getResidentialUsagePresentText("), context);
    return context.getResidentialUsagePresentText();
  }

  assert.equal(run([{ residential: "3" }, { residential: "0" }]), "Evet", "En az bir katta daire varsa Evet donmeli.");
  assert.equal(run([{ residential: "0" }, { shop: "2" }]), "Hayır", "Hic daire yoksa Hayır donmeli.");
  assert.equal(run([]), "Hayır", "Bos tabloda Hayır (varsayilan) donmeli.");
  assert.equal(run([{ residential: "" }]), "Hayır");

  console.log("getResidentialUsagePresentText() testi tamam.");
}

// --- 2) getMixedUseBuildingText() -----------------------------------------
{
  function run(fieldValue) {
    const context = {
      state: { fields: { regionUsePurpose: fieldValue } },
      regionUsePurposeOptions: [
        "zemin ve normal katları konut",
        "zemin katları işyeri, normal katları konut",
        "Villa Tipi Konut",
      ],
    };
    vm.createContext(context);
    vm.runInContext(sliceFn("function getMultiCheckboxValues("), context);
    vm.runInContext(sliceFn("function normalizeMultiCheckboxValues("), context);
    vm.runInContext(sliceFn("function parseStoredMultiCheckboxOptions("), context);
    vm.runInContext(sliceFn("function getMixedUseBuildingText("), context);
    return context.getMixedUseBuildingText();
  }

  assert.equal(run(["zemin ve normal katları konut"]), "Hayır", "Sadece 'zemin ve normal katları konut' seciliyse Hayır donmeli.");
  assert.equal(run(["Villa Tipi Konut"]), "Evet", "Baska bir secenek Evet donmeli.");
  assert.equal(run(["zemin ve normal katları konut", "Villa Tipi Konut"]), "Evet", "Birden fazla secenek (bu dahil) Evet donmeli.");
  assert.equal(run([]), "", "Hic secim yoksa bos donmeli.");
  assert.equal(run(undefined), "", "Alan hic ayarlanmamissa bos donmeli.");

  console.log("getMixedUseBuildingText() testi tamam.");
}

// --- 3) Yeni "propertyValueTrend" alani app.js semasinda var mi ----------
{
  assert(
    /key:\s*"propertyValueTrend"[\s\S]{0,200}options:\s*\["",\s*"Artıyor",\s*"Azalıyor",\s*"Sabit"\]/.test(appSource),
    "propertyValueTrend alani (Artıyor/Azalıyor/Sabit secenekleriyle) app.js'te bulunamadi."
  );
  console.log("propertyValueTrend alan tanimi testi tamam.");
}

// --- 4) template-engine.js alias kablolamasi -------------------------------
{
  assert(
    /RESIDENTIALUSAGEPRESENT:\s*\{\s*fn:\s*\(\)\s*=>\s*safeCall\("getResidentialUsagePresentText"\)\s*\}/.test(engineSource),
    "RESIDENTIALUSAGEPRESENT -> getResidentialUsagePresentText() kablolamasi bulunamadi."
  );
  assert(
    /MIXEDUSEBUILDING:\s*\{\s*fn:\s*\(\)\s*=>\s*safeCall\("getMixedUseBuildingText"\)\s*\}/.test(engineSource),
    "MIXEDUSEBUILDING -> getMixedUseBuildingText() kablolamasi bulunamadi."
  );
  console.log("template-engine.js alias kablolamasi testi tamam.");
}

// --- 5) templates/vakifbank.html'deki yeni satirlar ------------------------
{
  const cevreIdx = template.indexOf("Gayrimenkulün Konum ve Çevre Özellikleri");
  const guvenlikIdx = indexAfter(template, "BÖLGEDE GÜVENLİK PROBLEMİ VAR MI?", cevreIdx);
  assert(template.slice(guvenlikIdx, guvenlikIdx + 80).includes("{{REGİON_SECURİTY_İSSUE}}"));
  const yapilasmaIdx = indexAfter(template, "YAPILAŞMA HIZI", guvenlikIdx);
  assert(template.slice(yapilasmaIdx, yapilasmaIdx + 60).includes("{{DEVELOPMENT_SPEED}}"));
  const mulkDegeriIdx = indexAfter(template, "MÜLK DEĞERİ DEĞİŞİMİ", yapilasmaIdx);
  assert(template.slice(mulkDegeriIdx, mulkDegeriIdx + 60).includes("{{PROPERTY_VALUE_TREND}}"));

  const anaGmIdx = template.indexOf("Ana Gayrimenkul Tanımı");
  const karmaIdx = indexAfter(template, "KARMA YAPI VAR MI?", anaGmIdx);
  assert(template.slice(karmaIdx, karmaIdx + 60).includes("{{MİXED_USE_BUİLDİNG}}"));
  const meskenIdx = indexAfter(template, "MESKEN KULLANIM DURUMU", karmaIdx);
  assert(template.slice(meskenIdx, meskenIdx + 70).includes("{{RESİDENTİAL_USAGE_PRESENT}}"));
  const depremDayanikIdx = indexAfter(template, "BİNANIN DEPREM DAYANIKLILIĞI, GÖZLEMSEL HASAR DURUMU", meskenIdx);
  assert(template.slice(depremDayanikIdx, depremDayanikIdx + 90).includes(">Hasarsız<"));
  const depremDereceIdx = indexAfter(template, "DEPREM DERECESİ", depremDayanikIdx);
  assert(template.slice(depremDereceIdx, depremDereceIdx + 60).includes("{{EARTHQUAKE_ZONE}}"));
  const bogaziciIdx = indexAfter(template, "2960 SAYILI BOĞAZİÇİ KANUNU KAPSAMINDA MI?", depremDereceIdx);
  assert(template.slice(bogaziciIdx, bogaziciIdx + 70).includes(">Hayır<"));
  const kulturIdx = indexAfter(template, "KÜLTÜR VARLIĞI / TARİHİ ESER Mİ?", bogaziciIdx);
  assert(template.slice(kulturIdx, kulturIdx + 60).includes(">Hayır<"));

  const icMekanIdx = template.indexOf("Gayrimenkulün İç Mekan Özellikleri");
  const pencereIdx = indexAfter(template, "PENCERE DOĞRAMALARI", icMekanIdx);
  assert(template.slice(pencereIdx, pencereIdx + 60).includes("{{PENCERE}}"));
  const icKapiIdx = indexAfter(template, "İÇ KAPI</td>", pencereIdx);
  assert(template.slice(icKapiIdx, icKapiIdx + 40).includes("{{İÇKAPI}}"));
  const odaIdx = indexAfter(template, "ODA SAYISI", icKapiIdx);
  assert(template.slice(odaIdx, odaIdx + 40).includes("{{ODA}}"));
  const salonIdx = indexAfter(template, "SALON SAYISI", odaIdx);
  assert(template.slice(salonIdx, salonIdx + 40).includes("{{SALON}}"));
  const mutfakIdx = indexAfter(template, "MUTFAK SAYISI", salonIdx);
  assert(template.slice(mutfakIdx, mutfakIdx + 40).includes("{{MUTFAK}}"));
  const banyoIdx = indexAfter(template, "BANYO SAYISI", mutfakIdx);
  assert(template.slice(banyoIdx, banyoIdx + 40).includes("{{BANYO}}"));
  const wcIdx = indexAfter(template, "WC SAYISI", banyoIdx);
  assert(template.slice(wcIdx, wcIdx + 40).includes("{{TUVALET}}"));
  const balkonIdx = indexAfter(template, "BALKON SAYISI", wcIdx);
  assert(template.slice(balkonIdx, balkonIdx + 40).includes("{{BALKON}}"));

  console.log("templates/vakifbank.html yeni satirlar testi tamam.");
}
