"use strict";

/*
  Kullanici talebi: 13.07.2001 tarihli 4708 sayili Yapi Denetimi Hakkinda
  Kanun'dan ONCE tarihli yeni yapi ruhsati bulunan (ve yapi kullanma izin
  belgesi olmayan) taleplerde Yapi Denetim Aciklamasi, sozlesme durumu
  sorulmadan dogrudan kanun kapsami disi oldugunu belirten profesyonel bir
  cumle uretmeli: "Ekspertize konu tasinmazin yeni yapi ruhsat tarihi
  XX.XX.XXXX olup, 13.07.2001 tarih ve 4708 sayili Yapi Denetimi Hakkinda
  Kanun'un kapsami disinda kalmaktadir."

  Bu kural yapi kullanma izin belgesi VARSA (mevcut davranis) veya yapi
  ruhsat tarihi kanun tarihinden SONRA/AYNI ise devreye girmemeli; o
  durumlarda mevcut sozlesme-durumu tabanli aciklama (Evet/Hayir Fesihli)
  degismeden calismaya devam etmeli.

  buildBuildingInspectionExplanation() gercek app.js kaynagindan izole
  calistirilir; metin normalizasyonu (normalizeReportDescriptionText) ve
  ilgisiz kurum/il-ilce metin temizleme yardimcilari kimlik fonksiyonuyla
  stub'lanir (bu testin kapsami tarih/oncelik mantigi, metin bicimleme
  degil).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sliceFn(startMarker, endMarker, { fromIndex = 0 } = {}) {
  const start = appSource.indexOf(startMarker, fromIndex);
  assert(start >= 0, `Bulunamadi: ${startMarker}`);
  const end = appSource.indexOf(endMarker, start);
  assert(end > start, `Bitis bulunamadi: ${startMarker} -> ${endMarker}`);
  return appSource.slice(start, end);
}

const foldSrc = sliceFn("function foldTurkish(", "\nfunction ");
const normalizeEkbDateSrc = sliceFn("function normalizeEkbDate(", "\n}") + "\n}";
const dateTrToIsoSrc = sliceFn("function dateTrToIso(", "\n}") + "\n}";
const dateIsoToTrSrc = sliceFn("function dateIsoToTr(", "\n}") + "\n}";
const parseReviewedDocumentDateSrc = sliceFn("function parseReviewedDocumentDate(", "\n}") + "\n}";
const getReviewedDocumentChronologicalEntriesSrc = sliceFn("function getReviewedDocumentChronologicalEntries(", "\n}") + "\n}";
const getReviewedDocumentTableEntriesSrc = sliceFn("function getReviewedDocumentTableEntries(", "\n}") + "\n}";
const findReviewedDocumentRowBySrc = sliceFn("function findReviewedDocumentRowBy(", "\n}") + "\n}";
const isPermitLikeDocumentSrc = sliceFn("function isPermitLikeDocument(", "\n}") + "\n}";
const isBuildingCompletionOccupancyDocumentSrc = sliceFn("function isBuildingCompletionOccupancyDocument(", "\n}") + "\n}";
const isOccupancyPermitDocumentSrc = sliceFn("function isOccupancyPermitDocument(", "\n}") + "\n}";
const getLatestBuildingPermitDocumentRowSrc = sliceFn("function getLatestBuildingPermitDocumentRow(", "\n}") + "\n}";

const lawExemptionStart = appSource.indexOf("const BUILDING_INSPECTION_LAW_EFFECTIVE_ISO_DATE");
const buildingInspectionExplanationEnd = appSource.indexOf("\nfunction buildBuildingInspectionTerminationExplanation");
assert(lawExemptionStart >= 0 && buildingInspectionExplanationEnd > lawExemptionStart, "Yapi denetim aciklama bloku bulunamadi.");
const buildingInspectionBlockSrc = appSource.slice(lawExemptionStart, buildingInspectionExplanationEnd);

function runScenario({ documents = [], occupancyPermit = false, contractStatus = "" }) {
  const context = {
    state: {
      tables: { documents },
      fields: {
        buildingInspectionContractActive: contractStatus,
        buildingInspectionProgressLevel: "",
        buildingInspectionTerminationDate: "",
        buildingInspectionTerminationLevel: "",
        municipalityInspectionDate: "",
        appointmentDate: "",
        district: "Karşıyaka",
        titleDistrict: "",
        hasArchitecturalProject: "Hayır", // proje satirlari testin kapsami disi
      },
    },
    // Bu testin kapsami disindaki metin normalizasyonu/kurum cozumleme
    // yardimcilari kimlik fonksiyonuyla stub'lanir.
    normalizeReportDescriptionText: (value) => value,
    normalizeReportTitleText: (value) => value,
    normalizeYesNoChoice: (value) => value,
    getArchitecturalProjectReviewedDocumentRows: () => [],
    normalizeReviewedDocumentRow: (row) => ({ type: occupancyPermit ? "Yapı Kullanma İzin Belgesi" : String(row?.c0 || "") }),
    hasReviewedOccupancyPermitDocument: () => occupancyPermit,
  };
  vm.createContext(context);
  vm.runInContext(foldSrc, context);
  vm.runInContext(normalizeEkbDateSrc, context);
  vm.runInContext(dateTrToIsoSrc, context);
  vm.runInContext(dateIsoToTrSrc, context);
  vm.runInContext(parseReviewedDocumentDateSrc, context);
  vm.runInContext(getReviewedDocumentChronologicalEntriesSrc, context);
  vm.runInContext(getReviewedDocumentTableEntriesSrc, context);
  vm.runInContext(findReviewedDocumentRowBySrc, context);
  vm.runInContext(isPermitLikeDocumentSrc, context);
  vm.runInContext(isBuildingCompletionOccupancyDocumentSrc, context);
  vm.runInContext(isOccupancyPermitDocumentSrc, context);
  vm.runInContext(getLatestBuildingPermitDocumentRowSrc, context);
  vm.runInContext(buildingInspectionBlockSrc, context);
  return context.buildBuildingInspectionExplanation();
}

const permitRuhsatRow = { c0: "Yeni Yapı Ruhsatı", c1: "Karşıyaka Belediyesi", c2: "1998-04-10", c3: "12/34" };

// 1) Ruhsat tarihi kanundan ONCE, iskan yok, sozlesme durumu bos ->
//    kanun kapsami disi cumlesi uretilmeli (kullanicinin ana talebi).
{
  const text = runScenario({ documents: [permitRuhsatRow], occupancyPermit: false, contractStatus: "" });
  assert.match(text, /13\.07\.2001/, `Kanun tarihi cumlede gecmeli: ${JSON.stringify(text)}`);
  assert.match(text, /10\.04\.1998/, `Ruhsat tarihi (TR bicimli) cumlede gecmeli: ${JSON.stringify(text)}`);
  assert.match(text, /4708 sayılı Yapı Denetimi Hakkında Kanun/, `Kanun adi/sayisi cumlede gecmeli: ${JSON.stringify(text)}`);
}

// 2) Ruhsat tarihi kanundan ONCE olsa bile sozlesme durumu SEÇİLİYSE dahi
//    kanun-disi cumle ONCELIKLI olmali (sozlesme sorusu anlamsizlasir).
{
  const text = runScenario({ documents: [permitRuhsatRow], occupancyPermit: false, contractStatus: "Evet" });
  assert.match(text, /13\.07\.2001/, `Sozlesme durumu secili olsa da kanun-disi cumle oncelikli olmali: ${JSON.stringify(text)}`);
  assert.doesNotMatch(text, /sözleşmesinin aktif/, "Kanun-disi durumda sozlesme-aktif cumlesi uretilmemeli.");
}

// 3) Iskan (yapi kullanma izin belgesi) VARSA, ruhsat tarihi eski olsa da
//    aciklama tamamen BOS olmali (mevcut davranis korunmali).
{
  const text = runScenario({ documents: [permitRuhsatRow], occupancyPermit: true, contractStatus: "Evet" });
  assert.equal(text, "", `Iskan varsa aciklama uretilmemeli: ${JSON.stringify(text)}`);
}

// 4) Ruhsat tarihi kanundan SONRA ise kanun-disi cumle uretilmemeli, mevcut
//    sozlesme-durumu mantigina devam edilmeli.
{
  const modernPermitRow = { ...permitRuhsatRow, c2: "2015-06-01" };
  const text = runScenario({ documents: [modernPermitRow], occupancyPermit: false, contractStatus: "Evet" });
  assert.doesNotMatch(text, /13\.07\.2001/, `Ruhsat tarihi kanundan sonraysa kanun-disi cumle uretilmemeli: ${JSON.stringify(text)}`);
  assert.match(text, /sözleşmesinin aktif/, "Sozlesme durumu 'Evet' iken normal aciklama uretilmeli.");
}

// 5) Ruhsat tarihi TAM olarak 13.07.2001 ise (kanun kapsamina DAHIL, sinirda
//    kapsam disi degil) kanun-disi cumle uretilmemeli.
{
  const boundaryRow = { ...permitRuhsatRow, c2: "2001-07-13" };
  const text = runScenario({ documents: [boundaryRow], occupancyPermit: false, contractStatus: "" });
  assert.doesNotMatch(text, /13\.07\.2001 tarih ve 4708/, `Sinir tarihi kanun kapsaminda sayilmali (kapsam disi degil): ${JSON.stringify(text)}`);
}

console.log("Yapi denetim kanunu kapsam disi (13.07.2001 oncesi ruhsat) testi tamam.");
