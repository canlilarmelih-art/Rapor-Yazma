const {
  calculateValueFactors,
  formatValueFactorsText,
} = require("../src/value-factors/value-factors-rules");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertDeepEqual(actual, expected, label) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  assert(actualJson === expectedJson, `${label}: beklenen ${expectedJson}, gelen ${actualJson}`);
}

function idsOf(items) {
  return items.map((item) => item.id);
}

function baseInput(overrides = {}) {
  return {
    fields: {
      legalUsageNature: "Konut",
      titleOwnershipKind: "Tam Mülkiyet",
      ownershipType: "Arsa",
      elevator: "2 Adet Asansör",
      carpark: "Kapalı Otopark",
      hasEkb: "Evet",
      ekbEnergyClass: "B",
      buildingAge: "4",
      buildingClass: "4/A",
      infrastructureLevel: "iyi",
      mainArteryProximity: "yakın",
      regionIncomeLevel: "orta ve üst",
      planningPrincipleHarmony: "uyumludur",
      landRoadFrontage: "Evet",
      landShape: "Dikdörtgen",
      landTopography: "Eğimsiz",
      landAgricultureType: "Sulu Tarım",
      facades: "Güney, Batı",
      unitViewStatus: "Geniş Deniz Manzarası",
      unitMaterialQuality: "Lüks",
      unitInteriors: "Salon, 3 Oda, Mutfak, Banyo, Giyinme Odası, Balkon, Teras",
      socialFacilities: "Özel Güvenlik, Kamera, Sosyal Tesis Binası",
      staticSuitability: "Evet",
      projectDifference: "Hayır",
      saleability: "Satılabilir",
      ...overrides.fields,
    },
    disabledIds: overrides.disabledIds || [],
    manualPositive: overrides.manualPositive || [],
    manualNegative: overrides.manualNegative || [],
    tables: overrides.tables || {},
  };
}

function main() {
  const positive = calculateValueFactors(baseInput());
  assertDeepEqual(
    idsOf(positive.positive),
    [
      "building-elevator",
      "building-carpark",
      "building-energy-efficient",
      "building-new-age",
      "location-infrastructure-good",
      "location-main-artery-near",
      "location-income-high",
      "planning-compatible",
      "land-road-frontage",
      "land-regular-shape",
      "land-low-slope",
      "land-irrigated-agriculture",
      "unit-view-positive",
      "unit-material-quality-high",
      "unit-balcony-terrace",
      "unit-dressing-room",
      "unit-south-facade",
      "unit-multi-facade",
      "building-social-facilities",
    ],
    "Olumlu otomatik faktorler"
  );
  assert(
    positive.positive.find((item) => item.id === "building-energy-efficient")?.text === "Enerji performans sınıfının B kategorisinde olması",
    "EKB olumlu metni secilen sinifi yazmali"
  );
  assert(
    positive.positive.find((item) => item.id === "building-elevator")?.text === "Taşınmazın asansörlü bir binada yer alması",
    "Asansor metni kisa madde formatinda olmali"
  );
  assert(
    positive.positive.find((item) => item.id === "building-carpark")?.text === "Taşınmazın yer aldığı binanın kapalı otopark imkanının bulunması",
    "Tapu blok bilgisi bos ise otopark metni bina baglaminda olmali"
  );
  assert(
    positive.positive.find((item) => item.id === "unit-view-positive")?.text === "Taşınmazın geniş deniz manzarasına sahip olması",
    "Manzara metni alan degerine gore gelmeli"
  );

  const titleAndDocumentPositive = calculateValueFactors(baseInput({
    fields: {
      groundType: "Kat Mülkiyeti",
    },
    tables: {
      documents: [{ type: "Yapı Kullanım İzin Belgesi" }],
    },
  }));
  assert(idsOf(titleAndDocumentPositive.positive).includes("title-condominium"), "Kat mulkiyeti olumlu faktor olarak gelmeli");
  assert(idsOf(titleAndDocumentPositive.positive).includes("document-occupancy-permit"), "Yapi kullanma izin belgesi olumlu faktor olarak gelmeli");
  ["KATMULKIYETI", "KATMULKİYETİ", "KAT-MULKIYETI", "KatMülkiyeti"].forEach((groundType) => {
    const variedTitle = calculateValueFactors(baseInput({ fields: { groundType } }));
    assert(idsOf(variedTitle.positive).includes("title-condominium"), `${groundType} kat mulkiyeti olarak algilanmali`);
  });

  const siteCarpark = calculateValueFactors(baseInput({
    fields: {
      titleBlockName: "A Blok",
      carpark: "Açık Otopark",
    },
  }));
  assert(
    siteCarpark.positive.find((item) => item.id === "building-carpark")?.text === "Taşınmazın yer aldığı sitenin açık otopark imkanının bulunması",
    "Tapu blok bilgisi dolu ise otopark metni site baglaminda olmali"
  );

  const negative = calculateValueFactors(baseInput({
    fields: {
      titleOwnershipKind: "Hisseli Mülkiyet",
      elevator: "Yok",
      carpark: "Yok",
      hasEkb: "Hayır",
      ekbEnergyClass: "F",
      buildingAge: "38",
      infrastructureLevel: "zayıf",
      mainArteryProximity: "uzak",
      regionIncomeLevel: "alt",
      planningPrincipleHarmony: "uyumlu değildir",
      landRoadFrontage: "Hayır",
      landShape: "Amorf",
      landTopography: "Çok eğimli",
      landAgricultureType: "Kuru Tarım",
      facades: "Kuzey",
      unitMaterialQuality: "Kötü (Kapsamlı Tadilat İhtiyacı)",
      unitConstructionLevel: "%90",
      staticSuitability: "Hayır",
      projectDifference: "Evet",
      buildingInspectionContractActive: "Hayır (Fesihli)",
      roadSetback: "Evet",
      tevhidCondition: "Evet",
      minimumFrontageCondition: "Evet",
      licenseObstacle: "Evet",
      saleability: "Satışı Güç",
      halkbankRiskSelectedCodes: "1B, 36A",
    },
  }));
  assertDeepEqual(
    idsOf(negative.negative),
    [
      "title-shared-ownership",
      "building-no-elevator",
      "building-no-carpark",
      "building-no-ekb",
      "building-energy-weak",
      "building-old-age",
      "location-infrastructure-weak",
      "location-main-artery-far",
      "location-income-low",
      "planning-incompatible",
      "land-no-road-frontage",
      "land-irregular-shape",
      "land-steep-slope",
      "land-dry-agriculture",
      "unit-material-quality-low",
      "unit-single-facade",
      "unit-construction-incomplete",
      "document-static-unsuitable",
      "document-project-difference",
      "document-building-inspection-terminated",
      "planning-road-setback",
      "planning-tevhid",
      "planning-min-frontage",
      "planning-license-obstacle",
      "valuation-saleability-weak",
    ],
    "Olumsuz otomatik faktorler"
  );
  assert(
    negative.negative.find((item) => item.id === "document-building-inspection-terminated")?.text === "Yapı denetim sözleşmesinin fesihli olması",
    "Yapi denetim fesih metni dogru olmali"
  );
  assert(
    negative.negative.find((item) => item.id === "building-energy-weak")?.text === "Enerji performans sınıfının F kategorisinde olması",
    "EKB olumsuz metni secilen sinifi yazmali"
  );
  assert(
    negative.negative.find((item) => item.id === "building-no-carpark")?.text === "Taşınmazın yer aldığı binanın otopark imkanının bulunmaması",
    "Tapu blok bilgisi bos ise otopark yok metni bina baglaminda olmali"
  );

  const condominium = calculateValueFactors(baseInput({
    fields: {
      ownershipType: "Dikey Kat İrtifakı",
      landRoadFrontage: "Evet",
      landShape: "Dikdörtgen",
      landTopography: "Eğimsiz",
      landAgricultureType: "Sulu Tarım",
    },
  }));
  assert(
    !idsOf(condominium.positive).some((id) => id.startsWith("land-")),
    "Dikey/yatay kat irtifakinda arsa ozellikleri faktor olarak gelmemeli"
  );

  const middleFloor = calculateValueFactors(baseInput({
    fields: {
      buildingFloorCounts: { normal: "5" },
    },
    tables: {
      unitFloors: [{ floor: "2. Normal" }],
    },
  }));
  assert(idsOf(middleFloor.positive).includes("unit-middle-floor"), "Ara kat olumlu faktor olarak gelmeli");

  const topFloor = calculateValueFactors(baseInput({
    fields: {
      buildingFloorCounts: { normal: "4" },
    },
    tables: {
      unitFloors: [{ floor: "4. Normal" }, { floor: "Çatı" }],
    },
  }));
  assert(idsOf(topFloor.negative).includes("unit-top-floor"), "En ust kat olumsuz faktor olarak gelmeli");
  assert(!idsOf(topFloor.positive).includes("unit-middle-floor"), "En ust katta ara kat olumlu faktoru gelmemeli");

  const basementGround = calculateValueFactors(baseInput({
    tables: {
      unitFloors: [{ floor: "1. Bodrum" }, { floor: "Zemin" }],
    },
  }));
  assert(idsOf(basementGround.negative).includes("unit-basement-ground-floor"), "Bodrum/zemin kat olumsuz faktor olarak gelmeli");

  const noElevatorUpper = calculateValueFactors(baseInput({
    fields: {
      elevator: "Yok",
      buildingFloorCounts: { normal: "5" },
    },
    tables: {
      unitFloors: [{ floor: "4. Normal" }],
    },
  }));
  assert(
    noElevatorUpper.negative.find((item) => item.id === "unit-no-elevator-upper-floor")?.text === "Asansörsüz binada üst kat konumuna bağlı erişilebilirlik dezavantajı bulunması",
    "Asansorsuz ust kat ozel olumsuz metni gelmeli"
  );

  const edited = calculateValueFactors(baseInput({
    disabledIds: ["building-elevator"],
    manualPositive: [{ text: "Köşe konumlu olması" }],
    manualNegative: [{ text: "Ana cadde gürültüsüne maruz kalması" }],
  }));
  assert(!idsOf(edited.positive).includes("building-elevator"), "Pasife alinan olumlu faktor gelmemeli");
  assert(idsOf(edited.positive).includes("manual-positive-1"), "Manuel olumlu faktor eklenmeli");
  assert(idsOf(edited.negative).includes("manual-negative-1"), "Manuel olumsuz faktor eklenmeli");

  const text = formatValueFactorsText(edited);
  assert(text.includes("Olumlu Özellikler"), "Metinde olumlu baslik olmali");
  assert(text.includes("Olumsuz Özellikler"), "Metinde olumsuz baslik olmali");

  console.log("Değeri etkileyen faktörler testi tamam.");
}

main();
