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
  assert(
    basementGround.negative.find((item) => item.id === "unit-basement-ground-floor")?.text === "Bodrum katta/zemin katta yer alması",
    "buildingEntranceLevel bosken (bu senaryoda) eski jenerik sabit metin KULLANILMALI."
  );

  // Kullanıcı takip talebi (2026-09-07): "bina giriş kat seviyesinde ya da
  // altında yer alıyor ise zx katta yer alıyor olması şeklinde olmalı" —
  // 0.0.656'nın "TAM giriş katına eşitse muaf" kararı YANLIŞTI (kullanıcı
  // BUNU düzeltti): artık taşınmaz giriş kat seviyesinde YA DA ALTINDA
  // (bodrum yönünde) İSE olumsuz faktör TETİKLENİR — giriş katının
  // KENDİSİ de dahil (0.0.656'nın "muaf" kararının TAM TERSİ). Metin
  // ARTIK sabit değil, taşınmazın GERÇEKTEN bulunduğu kat adını yazar.
  const atEntranceLevel = calculateValueFactors(baseInput({
    fields: { buildingEntranceLevel: "Zemin" },
    tables: {
      unitFloors: [{ floor: "Zemin" }],
    },
  }));
  assert(
    idsOf(atEntranceLevel.negative).includes("unit-basement-ground-floor"),
    "Taşınmaz TAM bina girişi seviyesinde (Zemin) ise DAHİ olumsuz faktör TETİKLENMELİ (0.0.656'nın 'muaf' kararı düzeltildi)."
  );
  assert(
    atEntranceLevel.negative.find((item) => item.id === "unit-basement-ground-floor")?.text === "Zemin katta yer alıyor olması",
    "Metin taşınmazın GERÇEKTEN bulunduğu kat adını (Zemin) DİNAMİK olarak içermeli."
  );

  const belowEntranceLevel = calculateValueFactors(baseInput({
    fields: { buildingEntranceLevel: "Zemin" },
    tables: {
      unitFloors: [{ floor: "1. Bodrum" }],
    },
  }));
  assert(idsOf(belowEntranceLevel.negative).includes("unit-basement-ground-floor"), "Giris seviyesinin ALTINDAKI (1. Bodrum) kat olumsuz faktor olarak gelmeli.");
  assert(
    belowEntranceLevel.negative.find((item) => item.id === "unit-basement-ground-floor")?.text === "1. Bodrum katta yer alıyor olması",
    "Metin taşınmazın GERÇEKTEN bulunduğu kat adını (1. Bodrum) DİNAMİK olarak içermeli."
  );

  // Giriş seviyesinin ÜSTÜNDEKİ bir kat (1. Normal), giriş "Zemin" iken
  // MUAF olmalı — bu, "at or below" karşılaştırmasının GERÇEK muafiyet
  // durumu.
  const aboveEntranceLevel = calculateValueFactors(baseInput({
    fields: { buildingEntranceLevel: "Zemin" },
    tables: {
      unitFloors: [{ floor: "1. Normal" }],
    },
  }));
  assert(
    !idsOf(aboveEntranceLevel.negative).includes("unit-basement-ground-floor"),
    "Giris seviyesinin (Zemin) UZERINDEKI bir kat (1. Normal) olumsuz faktoru TETIKLEMEMELI."
  );

  // GENELLEME: bina girişinin KENDİSİ bodrum seviyesindeyse (eğimli
  // arazi), "Zemin" kat ARTIK giriş seviyesinin ÜSTÜNDE sayılır ve MUAF
  // olur — sabit "BODRUM"/"ZEMIN" metin eşleşmesinin YAPAMAYACAĞI, giriş
  // referans noktasına göre GERÇEK bir genelleme.
  const entranceBelowGroundMakesGroundFloorSafe = calculateValueFactors(baseInput({
    fields: { buildingEntranceLevel: "1. Bodrum" },
    tables: {
      unitFloors: [{ floor: "Zemin" }],
    },
  }));
  assert(
    !idsOf(entranceBelowGroundMakesGroundFloorSafe.negative).includes("unit-basement-ground-floor"),
    "Bina girisi 1. Bodrum'daysa, Zemin kat GIRIS SEVIYESININ UZERINDE sayilir ve MUAF olmali (sabit metin eslesmesinin yapamayacagi bir genelleme)."
  );

  // Taşınmaz BİRDEN FAZLA kat kaplıyorsa (ör. Zemin + 1. Normal), YALNIZCA
  // giriş seviyesinde/altında olan satır(lar) metne dahil edilir.
  const multiFloorPartialTrigger = calculateValueFactors(baseInput({
    fields: { buildingEntranceLevel: "Zemin" },
    tables: {
      unitFloors: [{ floor: "Zemin" }, { floor: "1. Normal" }],
    },
  }));
  assert(idsOf(multiFloorPartialTrigger.negative).includes("unit-basement-ground-floor"), "En az bir kat (Zemin) giris seviyesinde/altindaysa faktor TETIKLENMELI.");
  assert(
    multiFloorPartialTrigger.negative.find((item) => item.id === "unit-basement-ground-floor")?.text === "Zemin katta yer alıyor olması",
    "Metinde YALNIZCA tetikleyen kat (Zemin) yer almali, tetiklemeyen (1. Normal) DAHIL EDILMEMELI."
  );

  const basementNoEntranceLevelSet = calculateValueFactors(baseInput({
    tables: {
      unitFloors: [{ floor: "Zemin" }],
    },
  }));
  assert(
    idsOf(basementNoEntranceLevelSet.negative).includes("unit-basement-ground-floor"),
    "buildingEntranceLevel HIC girilmemisse (bos) eski davranis (her zaman olumsuz, jenerik sabit metin) KORUNMALI - guvenli varsayilan."
  );
  assert(
    basementNoEntranceLevelSet.negative.find((item) => item.id === "unit-basement-ground-floor")?.text === "Bodrum katta/zemin katta yer alması",
    "buildingEntranceLevel bossa metin ESKİ jenerik sabit hali KORUMALI (dinamik kat adi YAZILAMAZ, veri yok)."
  );

  // Zemin Tipi Kat İrtifakı ise olumsuz; Ana Taşınmaz Niteliği bu kararı etkilemez.
  const easementTitle = calculateValueFactors(baseInput({
    fields: { groundType: "KatIrtifaki", mainPropertyQuality: "Kargir Apartman" },
  }));
  assert(
    idsOf(easementTitle.negative).includes("title-not-condominium"),
    "Zemin Tipi Kat Irtifakı ise olumsuz faktor gelmeli."
  );
  assert(
    easementTitle.negative.find((item) => item.id === "title-not-condominium")?.text === "Kat mülkiyetine geçilmemiş olması",
    "Yeni faktorun metni tam olarak 'Kat mulkiyetine gecilmemis olmasi' olmali."
  );
  ["KatIrtifaki", "Kat İrtifakı", "Katİrtifakı", "KAT IRTIFAKI"].forEach((groundType) => {
    const variant = calculateValueFactors(baseInput({ fields: { groundType } }));
    assert(
      idsOf(variant.negative).includes("title-not-condominium"),
      `Zemin Tipi '${groundType}' yazım varyantı Kat İrtifakı olarak algılanmalı.`
    );
  });
  const horizontalSpecialFactors = calculateValueFactors(baseInput({
    fields: {
      ownershipType: "Yatay Kat İrtifakı",
      groundType: "Kat İrtifakı",
      landArea: "100000",
      denominator: "1000",
      share: "10",
      unitPrivatePool: "Açık Yüzme Havuzu",
      buildingFloorCounts: { normal: "5" },
    },
    tables: { unitFloors: [{ floor: "5. normal kat" }] },
  }));
  assert(!idsOf(horizontalSpecialFactors.negative).includes("unit-top-floor"), "Yatay kat irtifakında en üst kat olumsuz faktör olmamalı.");
  assert(idsOf(horizontalSpecialFactors.positive).includes("title-large-land-share"), "Yatay kat irtifakında 750 m² üzeri arsa payı olumlu faktör olmalı.");
  assert(idsOf(horizontalSpecialFactors.positive).includes("unit-private-pool"), "Yatay kat irtifakında özel havuz olumlu faktör olmalı.");
  const mainPropertyQualityAlone = calculateValueFactors(baseInput({
    fields: { mainPropertyQuality: "Arsa", groundType: "Kat Mülkiyeti" },
  }));
  assert(
    !idsOf(mainPropertyQualityAlone.negative).includes("title-not-condominium"),
    "Ana Taşınmaz Niteliği tek başına Arsa olduğunda yeni faktor tetiklenmemeli."
  );
  [
    "blok bazında konum olarak uygun değildir.",
    "mimari olarak uygun değildir.",
    "kullanım alanı olarak uygun değildir.",
    "kullanım alanı ve mimari olarak uygun değildir.",
  ].forEach((status) => {
    const projectStatus = calculateValueFactors(baseInput({ fields: { projectSuitabilityStatus: status } }));
    assert(idsOf(projectStatus.negative).includes("project-unsuitable-work"), `Proje durumu '${status}' olumsuz faktör üretmeli.`);
  });

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

  // Kullanıcı talebi: "değeri etkileyen olumlu ve olumsuz faktörlerde
  // çıktı 1. 2. 3. olarak numaralandırılarak geliyor. bunun yerine hiç
  // bir numaralandırma yada * yada - ... her bir faktör bir satır diğer
  // faktör alt satırdan başlasın" — numaralandırma/işaretleme KALKMALI.
  assert(!/^\d+\.\s/m.test(text), `Metinde hala numaralandirma (ör. "1. ") var: ${text}`);
  assert(!/^[*\-]\s/m.test(text), `Metinde hala madde isareti (* veya -) var: ${text}`);
  assert(text.includes("Köşe konumlu olması"), "Manuel olumlu faktor metni numarasiz gelmeli");
  assert(text.includes("Ana cadde gürültüsüne maruz kalması"), "Manuel olumsuz faktor metni numarasiz gelmeli");

  console.log("Değeri etkileyen faktörler testi tamam.");
}

main();
