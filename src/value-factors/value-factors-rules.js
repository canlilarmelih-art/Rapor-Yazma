(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ValueFactorsRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function calculateValueFactors(input = {}) {
    const fields = input.fields || {};
    const tables = input.tables || {};
    const disabledIds = new Set((input.disabledIds || []).map(normalizeId));
    const positive = [];
    const negative = [];

    const add = (kind, id, text, sourceKey, sourceLabel) => {
      const normalizedId = normalizeId(id);
      if (!normalizedId || disabledIds.has(normalizedId)) return;
      const item = {
        id: normalizedId,
        kind,
        text,
        sourceKey: sourceKey || "",
        sourceLabel: sourceLabel || sourceKey || "Sistem",
        source: "auto",
      };
      (kind === "positive" ? positive : negative).push(item);
    };

    if (fold(fields.titleOwnershipKind).includes("HISSE")) add("negative", "title-shared-ownership", "Hisseli olması", "titleOwnershipKind", "Mülkiyet");
    if (isCondominiumOwnership(fields.groundType)) add("positive", "title-condominium", "Kat mülkiyetli olması", "groundType", "Zemin Tipi");
    if (hasOccupancyPermitDocument(tables.documents)) add("positive", "document-occupancy-permit", "Bulunduğu binanın Yapı Kullanma İzin Belgesi bulunması", "documents", "İncelenen Belgeler");

    if (hasPositiveElevator(fields.elevator)) add("positive", "building-elevator", "Taşınmazın asansörlü bir binada yer alması", "elevator", "Asansör");
    if (isNoLike(fields.elevator)) add("negative", "building-no-elevator", "Bulunduğu binada asansör bulunmaması", "elevator", "Asansör");

    if (hasPositiveCarpark(fields.carpark)) add("positive", "building-carpark", `Taşınmazın yer aldığı ${formatSiteOrBuildingPossessive(fields)} ${formatCarparkText(fields.carpark)} otopark imkanının bulunması`, "carpark", "Otopark");
    if (isNoLike(fields.carpark)) add("negative", "building-no-carpark", `Taşınmazın yer aldığı ${formatSiteOrBuildingPossessive(fields)} otopark imkanının bulunmaması`, "carpark", "Otopark");

    if (isYes(fields.hasEkb) && isStrongEnergyClass(fields.ekbEnergyClass)) add("positive", "building-energy-efficient", formatEnergyClassText(fields.ekbEnergyClass), "ekbEnergyClass", "EKB");
    if (isNo(fields.hasEkb)) add("negative", "building-no-ekb", "Yer aldığı binanın enerji kimlik belgesinin bulunmaması", "hasEkb", "EKB");
    if (isWeakEnergyClass(fields.ekbEnergyClass)) add("negative", "building-energy-weak", formatEnergyClassText(fields.ekbEnergyClass), "ekbEnergyClass", "EKB");

    const age = parseNumber(fields.buildingAge);
    if (Number.isFinite(age) && age <= 10) add("positive", "building-new-age", "Yeni bir yapıda yer alıyor olması", "buildingAge", "Yapı Yaşı");
    if (Number.isFinite(age) && age > 20) add("negative", "building-old-age", "Eski bir yapıda yer alıyor olması", "buildingAge", "Yapı Yaşı");

    if (isGood(fields.infrastructureLevel)) add("positive", "location-infrastructure-good", "Bölgenin altyapı olanaklarının iyi seviyede olması", "infrastructureLevel", "Altyapı");
    if (isWeak(fields.infrastructureLevel)) add("negative", "location-infrastructure-weak", "Bölgenin altyapı olanaklarının kısıtlı olması", "infrastructureLevel", "Altyapı");

    if (fold(fields.mainArteryProximity).includes("YAKIN")) add("positive", "location-main-artery-near", "Ana ulaşım arterlerine yakın konumda yer alması", "mainArteryProximity", "Ana Arter");
    if (fold(fields.mainArteryProximity).includes("UZAK")) add("negative", "location-main-artery-far", "Ana ulaşım arterlerine uzak konumda yer alması", "mainArteryProximity", "Ana Arter");

    if (isHighIncome(fields.regionIncomeLevel)) add("positive", "location-income-high", "Bölgenin sosyo-ekonomik düzeyinin yüksek seviyede olması", "regionIncomeLevel", "Bölge Gelir Seviyesi");
    if (isLowIncome(fields.regionIncomeLevel)) add("negative", "location-income-low", "Bölgenin sosyo-ekonomik düzeyinin düşük seviyede olması", "regionIncomeLevel", "Bölge Gelir Seviyesi");

    if (fold(fields.planningPrincipleHarmony).includes("UYUMLUDUR")) add("positive", "planning-compatible", "Bölgenin plancılık ilkeleri ile uyumlu olması", "planningPrincipleHarmony", "Plancılık Uyumu");
    if (fold(fields.planningPrincipleHarmony).includes("UYUMLU DEGIL")) add("negative", "planning-incompatible", "Bölgenin plancılık ilkeleri ile uyumlu olmaması", "planningPrincipleHarmony", "Plancılık Uyumu");

    if (!shouldSuppressLandFactors(fields)) {
      if (isYes(fields.landRoadFrontage)) add("positive", "land-road-frontage", "Kadastro/imar yoluna cepheli olması", "landRoadFrontage", "Yola Cephe");
      if (isNo(fields.landRoadFrontage)) add("negative", "land-no-road-frontage", "Kadastro/imar yoluna cephesinin bulunmaması", "landRoadFrontage", "Yola Cephe");

      if (isRegularShape(fields.landShape)) add("positive", "land-regular-shape", "Parsel geometrisinin düzgün olması", "landShape", "Parsel Geometrisi");
      if (isIrregularShape(fields.landShape)) add("negative", "land-irregular-shape", "Parsel geometrisinin amorf/şekilsiz olması", "landShape", "Parsel Geometrisi");

      if (isLowSlope(fields.landTopography)) add("positive", "land-low-slope", "Topoğrafyanın eğimsiz veya az eğimli olması", "landTopography", "Topografya");
      if (fold(fields.landTopography).includes("COK EGIMLI")) add("negative", "land-steep-slope", "Topoğrafyanın çok eğimli olması", "landTopography", "Topografya");

      if (fold(fields.landAgricultureType).includes("SULU")) add("positive", "land-irrigated-agriculture", "Taşınmaz üzerinde sulu tarım yapılması", "landAgricultureType", "Tarım Türü");
      if (fold(fields.landAgricultureType).includes("KURU")) add("negative", "land-dry-agriculture", "Taşınmaz üzerinde kuru tarım yapılması", "landAgricultureType", "Tarım Türü");
    }

    const viewText = formatViewFactorText(fields.unitViewStatus);
    if (viewText) add("positive", "unit-view-positive", viewText, "unitViewStatus", "Manzara");

    if (isHighMaterialQuality(fields.unitMaterialQuality)) add("positive", "unit-material-quality-high", formatHighMaterialQualityText(fields.unitMaterialQuality), "unitMaterialQuality", "Malzeme ve İşçilik");
    if (isLowMaterialQuality(fields.unitMaterialQuality)) add("negative", "unit-material-quality-low", "İç malzeme ve işçilik kalitesinin düşük seviyede olması", "unitMaterialQuality", "Malzeme ve İşçilik");

    const interiorText = fold(fields.unitInteriors);
    const hasBalcony = interiorText.includes("BALKON");
    const hasTerrace = interiorText.includes("TERAS") || interiorText.includes("VERANDA");
    if (hasBalcony || hasTerrace) add("positive", "unit-balcony-terrace", formatBalconyTerraceText(hasBalcony, hasTerrace), "unitInteriors", "Balkon/Teras");
    if (interiorText.includes("GIYINME") || interiorText.includes("EBEVEYN")) add("positive", "unit-dressing-room", "Ebeveyn banyosu/giyinme odası imkanına sahip olması", "unitInteriors", "İç Hacimler");

    const facadeItems = splitList(fields.facades);
    if (facadeItems.length === 1) add("negative", "unit-single-facade", "Tek yöne cepheli olması", "facades", "Cephe");
    if (hasSouthFacade(facadeItems)) add("positive", "unit-south-facade", "Güney cepheli olması", "facades", "Cephe");
    if (facadeItems.length >= 2) add("positive", "unit-multi-facade", `${formatCountWord(facadeItems.length)} yöne cepheli olması`, "facades", "Cephe");

    if (isConstructionIncomplete(fields.unitConstructionLevel)) add("negative", "unit-construction-incomplete", "Bazı inşaat işlerinin eksik durumda olması", "unitConstructionLevel", "İnşaat Seviye");

    const socialText = formatSocialFacilitiesText(fields.socialFacilities);
    if (socialText) add("positive", "building-social-facilities", socialText, "socialFacilities", "Sosyal Tesisler");

    const floorFactors = analyzeUnitFloorFactors(fields, tables);
    if (floorFactors.isMiddleFloor) add("positive", "unit-middle-floor", "Ara katta yer alıyor olması", "unitFloors", "Kat Konumu");
    if (floorFactors.isTopFloor) add("negative", "unit-top-floor", "En üst katta yer alıyor olması", "unitFloors", "Kat Konumu");
    if (floorFactors.isBasementOrGroundFloor) add("negative", "unit-basement-ground-floor", "Bodrum katta/zemin katta yer alması", "unitFloors", "Kat Konumu");
    if (floorFactors.isNoElevatorUpperFloor) add("negative", "unit-no-elevator-upper-floor", "Asansörsüz binada üst kat konumuna bağlı erişilebilirlik dezavantajı bulunması", "unitFloors", "Kat Konumu");

    if (isNo(fields.staticSuitability)) add("negative", "document-static-unsuitable", "Statik uygunluğun olumsuz olması", "staticSuitability", "Statik Uygunluk");
    if (isYes(fields.projectDifference)) add("negative", "document-project-difference", "Tapu projesi ile belediye projesi arasında farklılık bulunması", "projectDifference", "Proje Farkı");
    if (isBuildingInspectionTerminated(fields.buildingInspectionContractActive)) add("negative", "document-building-inspection-terminated", "Yapı denetim sözleşmesinin fesihli olması", "buildingInspectionContractActive", "Yapı Denetim");

    if (isYes(fields.roadSetback)) add("negative", "planning-road-setback", "Taşınmazın yer aldığı parselin yola terki bulunması", "roadSetback", "Yola Terk");
    if (isYes(fields.tevhidCondition)) add("negative", "planning-tevhid", "Tevhid şartı bulunması", "tevhidCondition", "Tevhid Şartı");
    if (isYes(fields.minimumFrontageCondition)) add("negative", "planning-min-frontage", "Minimum cephe şartı bulunması", "minimumFrontageCondition", "Minimum Cephe");
    if (isYes(fields.licenseObstacle)) add("negative", "planning-license-obstacle", "Ruhsat almaya engel durum bulunması", "licenseObstacle", "Ruhsat Engeli");

    if (isWeakSaleability(fields.saleability)) add("negative", "valuation-saleability-weak", "Satış kabiliyetinin sınırlı olması", "saleability", "Satış Kabiliyeti");

    appendManualItems(positive, input.manualPositive, "positive");
    appendManualItems(negative, input.manualNegative, "negative");

    return {
      positive: dedupeById(positive),
      negative: dedupeById(negative),
    };
  }

  function formatValueFactorsText(result = {}) {
    return [
      formatFactorGroup("Olumlu Özellikler", result.positive || []),
      formatFactorGroup("Olumsuz Özellikler", result.negative || []),
    ].filter(Boolean).join("\n\n");
  }

  function formatFactorGroup(title, rows) {
    const lines = (rows || []).map((item, index) => `${index + 1}. ${item.text}`);
    return `${title}\n${lines.length ? lines.join("\n") : "Kayıt bulunmamaktadır."}`;
  }

  function appendManualItems(target, rows, kind) {
    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      const text = typeof row === "string" ? row : row?.text;
      if (!String(text || "").trim()) return;
      target.push({
        id: `manual-${kind}-${index + 1}`,
        kind,
        text: String(text).trim(),
        sourceKey: "",
        sourceLabel: "Manuel",
        source: "manual",
      });
    });
  }

  function dedupeById(items) {
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  function hasPositiveElevator(value) {
    const text = fold(value);
    return text && !text.includes("YOK") && !text.includes("MONTAJ");
  }

  function hasPositiveCarpark(value) {
    const text = fold(value);
    return text && !text.includes("YOK");
  }

  function formatCarparkText(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.toLocaleLowerCase("tr-TR").replace(/\s+otopark\s*$/i, "");
  }

  function formatSiteOrBuildingPossessive(fields) {
    return String(fields?.titleBlockName || "").trim() ? "sitenin" : "binanın";
  }

  function isHighBuildingClass(value) {
    const text = fold(value);
    return /^4|^5|4\/|5\//.test(text);
  }

  function isGood(value) {
    const text = fold(value);
    return text.includes("IYI") || text.includes("COK IYI");
  }

  function isWeak(value) {
    return fold(value).includes("ZAYIF");
  }

  function isHighIncome(value) {
    const text = fold(value);
    return text.includes("ORTA VE UST") || text === "UST";
  }

  function isLowIncome(value) {
    return fold(value) === "ALT";
  }

  function isStrongEnergyClass(value) {
    return ["A", "B", "C"].includes(fold(value));
  }

  function isWeakEnergyClass(value) {
    return ["E", "F", "G"].includes(fold(value));
  }

  function formatEnergyClassText(value) {
    const text = String(value || "").trim();
    return text ? `Enerji performans sınıfının ${text} kategorisinde olması` : "Enerji performans sınıfının belirtilmiş olması";
  }

  function shouldSuppressLandFactors(fields) {
    const ownership = fold(fields.ownershipType);
    return ownership.includes("DIKEY KAT IRTIFAK") || ownership.includes("YATAY KAT IRTIFAK");
  }

  function isCondominiumOwnership(value) {
    const text = fold(value);
    const compact = text.replace(/[^A-Z0-9]/g, "");
    return text.includes("KAT MULKIYET") || compact.includes("KATMULKIYET");
  }

  function hasOccupancyPermitDocument(rows) {
    return (Array.isArray(rows) ? rows : []).some((row) => {
      const type = fold(row?.type || row?.c0 || row?.documentType || "");
      return type.includes("YAPI KULLANIM IZIN")
        || type.includes("YAPI KULLANMA IZIN")
        || type.includes("ISKAN");
    });
  }

  function isHighMaterialQuality(value) {
    const text = fold(value);
    return text.includes("LUKS") || text.includes("KALITELI");
  }

  function isLowMaterialQuality(value) {
    const text = fold(value);
    return text.includes("DUSUK") || text.includes("KOTU") || text.includes("VASAT") || text.includes("EKSIK");
  }

  function formatHighMaterialQualityText(value) {
    return fold(value).includes("LUKS")
      ? "Lüks sınıf iç malzeme kalitesine sahip olması"
      : "Orta üst sınıf iç malzeme kalitesine sahip olması";
  }

  function formatViewFactorText(value) {
    const text = String(value || "").trim();
    if (!text || fold(text).includes("MANZARA YOK")) return "";
    let lower = text.toLocaleLowerCase("tr-TR");
    lower = lower.replace(/\s+manzarası$/i, " manzarasına");
    if (!/manzarasına$/i.test(lower)) lower = `${lower} manzarasına`;
    return `Taşınmazın ${lower} sahip olması`;
  }

  function formatBalconyTerraceText(hasBalcony, hasTerrace) {
    if (hasBalcony && hasTerrace) return "Balkon ve teras alanlarının bulunması";
    if (hasBalcony) return "Balkon alanının bulunması";
    return "Teras alanının bulunması";
  }

  function splitList(value) {
    return String(value || "").split(/\s*,\s*/).map((item) => item.trim()).filter(Boolean);
  }

  function hasSouthFacade(items) {
    return items.some((item) => fold(item).includes("GUNEY"));
  }

  function formatCountWord(count) {
    if (count === 2) return "İki";
    if (count === 3) return "Üç";
    if (count === 4) return "Dört";
    return `${count}`;
  }

  function isConstructionIncomplete(value) {
    const number = parseNumber(value);
    return Number.isFinite(number) && number > 0 && number < 100;
  }

  function formatSocialFacilitiesText(value) {
    const items = splitList(value).filter((item) => fold(item) !== "YOK");
    if (!items.length) return "";
    const names = items.map((item) => item.toLocaleLowerCase("tr-TR"));
    return `Taşınmazın ${joinTurkishList(names)} gibi imkanlara sahip bir sitede/apartmanda yer alması`;
  }

  function analyzeUnitFloorFactors(fields = {}, tables = {}) {
    const unitFloors = getUnitFloorNames(fields, tables);
    const normalCount = parseNumber(fields.buildingFloorCounts?.normal);
    const hasTopFloor = unitFloors.some((floor) => isTopFloor(floor, normalCount));
    const hasBasementOrGround = unitFloors.some(isBasementOrGroundFloor);
    const hasMiddleFloor = !hasTopFloor && unitFloors.some((floor) => isMiddleFloor(floor, normalCount));
    const hasUpperNormalFloor = unitFloors.some((floor) => {
      const ordinal = extractNormalFloorOrdinal(floor);
      return Number.isFinite(ordinal) && ordinal >= 3;
    });

    return {
      isMiddleFloor: hasMiddleFloor,
      isTopFloor: hasTopFloor,
      isBasementOrGroundFloor: hasBasementOrGround,
      isNoElevatorUpperFloor: isNoLike(fields.elevator) && normalCount > 3 && hasUpperNormalFloor,
    };
  }

  function getUnitFloorNames(fields = {}, tables = {}) {
    const tableRows = Array.isArray(tables.unitFloors) ? tables.unitFloors : [];
    const floors = tableRows.map((row) => row?.floor).filter((floor) => String(floor || "").trim());
    if (floors.length) return floors;
    return String(fields.unitFloor || "").trim() ? [fields.unitFloor] : [];
  }

  function isTopFloor(floor, normalCount) {
    const text = fold(floor);
    if (text.includes("CATI") || text.includes("TERAS")) return true;
    const ordinal = extractNormalFloorOrdinal(floor);
    return Number.isFinite(ordinal) && Number.isFinite(normalCount) && normalCount > 0 && ordinal >= normalCount;
  }

  function isMiddleFloor(floor, normalCount) {
    const ordinal = extractNormalFloorOrdinal(floor);
    if (!Number.isFinite(ordinal)) return false;
    if (!Number.isFinite(normalCount) || normalCount <= 0) return ordinal > 1;
    return ordinal > 1 && ordinal < normalCount;
  }

  function isBasementOrGroundFloor(floor) {
    const text = fold(floor);
    return text.includes("BODRUM") || text === "ZEMIN" || text.includes("ZEMIN KAT");
  }

  function extractNormalFloorOrdinal(floor) {
    const text = fold(floor);
    if (!text.includes("NORMAL")) return NaN;
    const match = text.match(/(\d+)/);
    return match ? Number.parseInt(match[1], 10) : NaN;
  }

  function joinTurkishList(items) {
    const clean = (items || []).filter(Boolean);
    if (clean.length <= 1) return clean[0] || "";
    return `${clean.slice(0, -1).join(", ")} ve ${clean[clean.length - 1]}`;
  }

  function isRegularShape(value) {
    const text = fold(value);
    return ["DIKDORTGEN", "KARE"].includes(text);
  }

  function isIrregularShape(value) {
    const text = fold(value);
    return ["AMORF", "UCGEN"].includes(text);
  }

  function isLowSlope(value) {
    const text = fold(value);
    return text.includes("EGIMSIZ") || text.includes("AZ EGIMLI");
  }

  function isWeakSaleability(value) {
    const text = fold(value);
    return text.includes("ALICISI AZ") || text.includes("SATISI GUC") || text.includes("SATILAMAZ");
  }

  function hasRiskCodes(value) {
    const codes = String(value || "").split(",").map((code) => code.trim()).filter(Boolean);
    return codes.some((code) => code !== "0");
  }

  function isBuildingInspectionTerminated(value) {
    const text = fold(value);
    return text.includes("HAYIR") || text.includes("FESIH") || text.includes("PASIF");
  }

  function isNoLike(value) {
    return fold(value).includes("YOK");
  }

  function isYes(value) {
    return fold(value).startsWith("EVET");
  }

  function isNo(value) {
    return fold(value).startsWith("HAYIR");
  }

  function parseNumber(value) {
    const text = String(value || "").replace(",", ".").replace(/[^\d.]/g, "");
    if (!text) return NaN;
    const number = Number(text);
    return Number.isFinite(number) ? number : NaN;
  }

  function normalizeId(value) {
    return String(value || "").trim();
  }

  function fold(value) {
    return String(value || "")
      .replace(/İ/g, "I")
      .replace(/ı/g, "I")
      .replace(/i/g, "I")
      .replace(/Ş/g, "S")
      .replace(/ş/g, "S")
      .replace(/Ğ/g, "G")
      .replace(/ğ/g, "G")
      .replace(/Ü/g, "U")
      .replace(/ü/g, "U")
      .replace(/Ö/g, "O")
      .replace(/ö/g, "O")
      .replace(/Ç/g, "C")
      .replace(/ç/g, "C")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return {
    calculateValueFactors,
    formatValueFactorsText,
  };
});
