const {
  calculateHalkbankRiskCodes,
  formatHalkbankRiskReportText,
  sortHalkbankRiskCodes,
} = require("../src/risk/halkbank-risk-rules");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  assert(actualJson === expectedJson, `${label}: beklenen ${expectedJson}, gelen ${actualJson}`);
}

function codesOf(result) {
  return result.selected.map((item) => item.code);
}

function baseInput(overrides = {}) {
  return {
    fields: {
      legalValue: "1000000",
      currentValue: "1000000",
      legalValueArea: "100",
      currentValueArea: "100",
      titleOwnershipKind: "Tam Mülkiyet",
      appointmentType: "İçi görülmüştür",
      staticSuitability: "Evet",
      projectDifference: "Hayır",
      buildingInspectionContractActive: "Evet",
      buildingInspectionProgressLevel: "%100",
      ...overrides.fields,
    },
    tables: {
      encumbranceDeclarations: [],
      encumbranceAnnotations: [],
      encumbranceMortgages: [],
      ...overrides.tables,
    },
    disabledCodes: overrides.disabledCodes || [],
    manualCodes: overrides.manualCodes || [],
  };
}

function main() {
  const noRisk = calculateHalkbankRiskCodes(baseInput());
  assertDeepEqual(codesOf(noRisk), ["0"], "Takyidat ve risk yoksa risksiz kodu");

  const mortgageAndGrowth = calculateHalkbankRiskCodes(baseInput({
    fields: { currentValueArea: "125" },
    tables: {
      encumbranceMortgages: [
        { c0: "Türkiye Halk Bankası A.Ş.", c1: "1", c2: "500.000 TL" },
        { c0: "Başka Banka A.Ş.", c1: "2", c2: "250.000 TL" },
      ],
    },
  }));
  assertDeepEqual(codesOf(mortgageAndGrowth), ["1A", "1B", "110A"], "İpotekler ve yasal olmayan büyüme");

  const lienPriority = calculateHalkbankRiskCodes(baseInput({
    fields: { currentValue: "1000000" },
    tables: {
      encumbranceMortgages: [{ c0: "Türkiye Halk Bankası A.Ş.", c1: "1", c2: "500.000 TL" }],
      encumbranceAnnotations: [
        { c0: "Kamu Haczi", c1: "Amme alacağı haczi", c2: "150.000 TL" },
        { c0: "İhtiyati Haciz", c1: "İhtiyati haciz", c2: "120.000 TL" },
      ],
    },
  }));
  assertDeepEqual(codesOf(lienPriority), ["1A", "2E"], "2E varsa 2A/2B/2C/2D bastırılır");

  const projectAndInspection = calculateHalkbankRiskCodes(baseInput({
    fields: {
      appointmentType: "Dışarıdan ekspertiz",
      staticSuitability: "Hayır",
      projectDifference: "Evet",
      titleOwnershipKind: "Hisseli Mülkiyet",
      buildingInspectionContractActive: "Hayır (Fesihli)",
      buildingInspectionProgressLevel: "%80",
    },
    manualCodes: ["36A"],
    disabledCodes: ["109E"],
  }));
  assertDeepEqual(codesOf(projectAndInspection), ["3A", "36A", "101B", "101K", "108A", "109B", "129A"], "Belge/proje ve manuel/pasif kuralları");

  assertDeepEqual(sortHalkbankRiskCodes(["110A", "1B", "36A", "2E", "0"]), ["0", "1B", "2E", "36A", "110A"], "Kod sıralaması");

  const text = formatHalkbankRiskReportText(projectAndInspection.selected);
  assert(text.includes("(101K Risk Kodu)"), "Rapor metninde risk kodu etiketi olmalı");
  assert(!text.includes("(109E Risk Kodu)"), "Pasife alınan kod rapor metnine girmemeli");

  const directTakbisCodes = calculateHalkbankRiskCodes(baseInput({
    tables: {
      encumbranceDeclarations: [
        { c0: "Beyan", c1: "Aile Konutu Şerhi vardır." },
        { c0: "Beyan", c1: "Veraset intikal ilişiği kesilmemiştir." },
        { c0: "Beyan", c1: "Malikin ölü olduğu belirtmesi bulunmaktadır." },
        { c0: "Beyan", c1: "Vesayet kanuni kısıtlılık beyanı." },
        { c0: "Beyan", c1: "Kanuni müşavir beyanı." },
        { c0: "Beyan", c1: "Kayyum atandığına dair beyan." },
      ],
      encumbranceAnnotations: [
        { c0: "Şerh", c1: "Kanuni ipotek hakkı bulunmaktadır." },
        { c0: "Şerh", c1: "Ticari işletme rehni bulunmaktadır." },
        { c0: "Şerh", c1: "Tescil işlemi devam etmektedir." },
        { c0: "Şerh", c1: "Geçici tescil şerhi vardır." },
        { c0: "Şerh", c1: "Gayrimenkul satış vaadi sözleşmesi şerhi." },
        { c0: "Şerh", c1: "Bağışlama vaadi şerhi." },
        { c0: "Şerh", c1: "Hibeden rücu hakkı." },
        { c0: "Şerh", c1: "İflas erteleme şerhi." },
        { c0: "Şerh", c1: "İzale-i şüyu ortaklığın giderilmesi davası." },
        { c0: "Şerh", c1: "Finansal kiralama şerhi." },
        { c0: "Şerh", c1: "Mülkiyet davası devam etmektedir." },
        { c0: "Şerh", c1: "İmar kadastro davası devam etmektedir." },
        { c0: "Şerh", c1: "Yapı ruhsatı proje iptali davası vardır." },
        { c0: "Şerh", c1: "Tasfiyeye tabi olduğuna ilişkin beyan." },
        { c0: "Şerh", c1: "Zilyetlik beyanı." },
        { c0: "Şerh", c1: "Teferruat beyanı." },
      ],
    },
  }));
  assertDeepEqual(
    codesOf(directTakbisCodes),
    ["1C", "1F", "1H", "3C", "3E", "5A", "9A", "10A", "13A", "14A", "16A", "16C", "22A", "23A", "24A", "35A", "35B", "35C", "43B", "65A", "69A", "72B"],
    "Takyidat metninden dogrudan gelen 1. paket kodlari"
  );

  const durationCodes = calculateHalkbankRiskCodes(baseInput({
    fields: { reportDate: "2026-07-03" },
    tables: {
      encumbranceAnnotations: [
        { c0: "Şerh", c1: "Geri alım vefa hakkı", c3: "01.01.2010" },
        { c0: "Şerh", c1: "Alım iştira hakkı", c3: "01.01.2020" },
        { c0: "Şerh", c1: "Şufa önalım hakkı", c3: "01.01.2024" },
        { c0: "Şerh", c1: "İntifa hakkı süre bitimi 01.01.2029" },
        { c0: "Şerh", c1: "Sükna oturma hakkı süre bitimi 01.01.2035" },
      ],
    },
  }));
  assertDeepEqual(codesOf(durationCodes), ["6C", "8A", "11B", "17B", "30B"], "Süre hesabina bagli 2. paket kodlari");

  console.log("Halkbank risk kodlari testi tamam.");
}

main();
