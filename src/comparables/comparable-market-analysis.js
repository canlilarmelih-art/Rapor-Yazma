(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ComparableMarketAnalysis = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function buildComparableMarketAnalysisText(input = {}) {
    const fields = input.fields || {};
    const ownership = fold(fields.ownershipType);
    if (ownership === "ARSA" || ownership === "TARLA") {
      return buildLandComparableMarketAnalysisText(fields, input.rows || [], ownership === "TARLA" ? "tarla" : "arsa");
    }
    const rows = getComparableAnalysisRows(input.rows || []);
    const neighborhood = cleanText(fields.titleNeighborhood || fields.neighborhood || "ilgili");
    const street = cleanText(fields.street || fields.mainArtery || "yakın çevre");
    const locationText = buildLocationText(neighborhood, street);
    const comparableCount = rows.length;
    const marketingRange = calculateMarketingRange(rows);
    const correctionDirection = calculateCorrectionDirection(rows);
    const unitValueSummary = calculateAdjustedUnitValueSummary(rows);
    const appraisedUnitValue = selectAppraisedUnitValue(fields, unitValueSummary);
    const microMarketRadius = calculateMicroMarketRadius(rows);

    const marketingText = marketingRange
      ? `Bölgedeki gayrimenkul piyasasında, arz edilen taşınmazların brüt alanlarının pazarlama aşamasında ${formatMarketingRange(marketingRange)} daha yüksek beyan edildiği (ortak alanlar, eklentiler vb. nedenlerle) tespit edilmiştir.`
      : "Bölgedeki gayrimenkul piyasasında, arz edilen taşınmazların brüt alanlarının pazarlama aşamasında ortak alanlar, eklentiler vb. nedenlerle farklılık gösterebildiği tespit edilmiştir.";
    const microMarketText = Number.isFinite(microMarketRadius) && microMarketRadius > 0
      ? ` Piyasa çalışmaları kapsamında verilerin doğruluğunu ve homojenliğini sağlamak adına; değerleme konusu taşınmazı merkez alan ve ${formatMoney(microMarketRadius)} metrelik etki yarıçapı (mikro-piyasa) içerisinde kalan emsal veriler değerlendirmeye dahil edilmiştir.`
      : "";

    const paragraphs = [
      `Değerleme konusu taşınmazın konumlu olduğu ${locationText} yürütülen saha çalışmaları kapsamında; taşınmaz ile benzer imar koşullarına, yapı kalitesine ve fonksiyonel özelliklere sahip toplam ${comparableCount} adet emsal veri değerlendirmeye dahil edilmiştir.${microMarketText} ${marketingText} Bu doğrultuda, değerleme tablosunda yer alan emsal alanları, teknik olarak netleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye esas alınmıştır.`,
      `Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, kat, cephe, manzarası ve iç mekan işçilik kalitesi gibi birim değerini doğrudan etkileyen kriterleri ${correctionDirection} yönde uyumlandırılarak konu taşınmazın nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır.`,
    ];

    if (unitValueSummary && Number.isFinite(appraisedUnitValue)) {
      paragraphs.push(`Yapılan düzeltmeler sonucunda, emsallerin konu taşınmaza indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² aralığında dengelendiği görülmüştür. Karşılaştırma tablosundan elde edilen verilerin bölge piyasasındaki güncel arz-talep dengesiyle örtüşmesi ve sapma oranlarının makul sınırlar içinde kalması sebebiyle, ulaşılan sonuçların piyasa gerçeğini yansıttığı tespit edilmiştir. Bu doğrultuda, taşınmazın nihai birim değeri, karşılaştırma tablosunun işaret ettiği analitik ağırlıklar ve mesleki kanaatimiz çerçevesinde ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`);
    }

    return normalizeParagraphs(paragraphs.join("\n\n"));
  }

  function buildLandComparableMarketAnalysisText(fields, sourceRows, landType) {
    const rows = getComparableAnalysisRows(sourceRows);
    const neighborhood = cleanText(fields.titleNeighborhood || fields.neighborhood || "ilgili");
    const street = cleanText(fields.street || fields.mainArtery || "yak\u0131n \u00e7evre");
    const locationText = buildLocationText(neighborhood, street);
    const comparableCount = rows.length;
    const marketingRange = calculateMarketingRange(rows);
    const correctionDirection = "olumlu ve olumsuz yönleri karşılaştırılarak";
    const unitValueSummary = calculateAdjustedUnitValueSummary(rows);
    const appraisedUnitValue = selectAppraisedUnitValue(fields, unitValueSummary);
    const microMarketRadius = calculateMicroMarketRadius(rows);
    const marketingText = marketingRange
      ? `B\u00f6lgedeki ${landType} piyasas\u0131nda, arz edilen ta\u015f\u0131nmazlar\u0131n beyan edilen y\u00fcz\u00f6l\u00e7\u00fcmlerinin pazarlama a\u015famas\u0131nda ${formatMarketingRange(marketingRange)} farkl\u0131l\u0131k g\u00f6sterebildi\u011fi tespit edilmi\u015ftir.`
      : `B\u00f6lgedeki ${landType} piyasas\u0131nda, arz edilen ta\u015f\u0131nmazlar\u0131n beyan edilen y\u00fcz\u00f6l\u00e7\u00fcmlerinin pazarlama a\u015famas\u0131nda farkl\u0131l\u0131k g\u00f6sterebildi\u011fi tespit edilmi\u015ftir.`;
    const microMarketText = Number.isFinite(microMarketRadius) && microMarketRadius > 0
      ? ` Piyasa \u00e7al\u0131\u015fmalar\u0131 kapsam\u0131nda verilerin do\u011frulu\u011funu ve homojenli\u011fini sa\u011flamak ad\u0131na; de\u011ferleme konusu ta\u015f\u0131nmaz\u0131 merkez alan ve ${formatMoney(microMarketRadius)} metrelik etki yar\u0131\u00e7ap\u0131 i\u00e7erisinde kalan emsal veriler de\u011ferlendirmeye dahil edilmi\u015ftir.`
      : "";
    const paragraphs = [
      `De\u011ferleme konusu ta\u015f\u0131nmaz\u0131n konumlu oldu\u011fu ${locationText} y\u00fcr\u00fct\u00fclen saha \u00e7al\u0131\u015fmalar\u0131 kapsam\u0131nda; ta\u015f\u0131nmaz ile benzer imar ko\u015fullar\u0131na, y\u00fcz\u00f6l\u00e7\u00fcm\u00fcne ve konum \u00f6zelliklerine sahip toplam ${comparableCount} adet ${landType} emsali de\u011ferlendirmeye dahil edilmi\u015ftir.${microMarketText} ${marketingText} Bu do\u011frultuda, de\u011ferleme tablosunda yer alan emsal y\u00fcz\u00f6l\u00e7\u00fcmleri ve indirgenmi\u015f m\u00b2 birim de\u011ferleri de\u011ferlendirmeye esas al\u0131nm\u0131\u015ft\u0131r.`,
      `B\u00f6lgede yap\u0131lan detayl\u0131 piyasa ara\u015ft\u0131rmalar\u0131, yerel gayrimenkul dan\u0131\u015fmanlar\u0131 ile ger\u00e7ekle\u015ftirilen g\u00f6r\u00fc\u015fmeler ve toplanan verilerin de\u011ferlendirilmesi sonucunda; emsallerin konum, y\u00fcz\u00f6l\u00e7\u00fcm\u00fc, imar yap\u0131la\u015fma nizam\u0131, Emsal/KAKS oran\u0131 ve imar lejant\u0131 gibi birim de\u011ferini do\u011frudan etkileyen kriterleri ${correctionDirection} konu ta\u015f\u0131nmaz\u0131n nihai birim de\u011fer takdirinde kar\u015f\u0131la\u015ft\u0131rma tablosu olarak kullan\u0131lm\u0131\u015ft\u0131r.`,
    ];
    if (unitValueSummary && Number.isFinite(appraisedUnitValue)) {
      paragraphs.push(`Yap\u0131lan d\u00fczeltmeler sonucunda, emsallerin konu ta\u015f\u0131nmaza indirgenmi\u015f birim de\u011ferlerinin ${formatMoney(unitValueSummary.min)} TL/m\u00b2 ile ${formatMoney(unitValueSummary.max)} TL/m\u00b2 aral\u0131\u011f\u0131nda dengelendi\u011fi g\u00f6r\u00fclm\u00fc\u015ft\u00fcr. Bu do\u011frultuda, ta\u015f\u0131nmaz\u0131n nihai birim de\u011feri ${formatMoney(appraisedUnitValue)} TL/m\u00b2 olarak takdir edilmi\u015ftir.`);
    }
    return normalizeParagraphs(paragraphs.join("\n\n"));
  }

  function formatMarketingRange(marketingRange) {
    if (marketingRange.min === marketingRange.max) return `yaklaşık %${marketingRange.min} aralığında`;
    return `%${marketingRange.min} ile %${marketingRange.max} aralığında`;
  }

  function buildLocationText(neighborhood, street) {
    const neighborhoodText = cleanText(neighborhood);
    const streetText = cleanText(street);
    const neighborhoodPart = neighborhoodText ? `${neighborhoodText} Mahallesi` : "ilgili mahalle";
    if (!streetText || fold(streetText) === "YAKIN CEVRE") return `${neighborhoodPart} ve yakın çevresinde`;
    return `${neighborhoodPart}, ${streetText} ve yakın çevresinde`;
  }

  function getComparableAnalysisRows(rows) {
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const status = fold(row?.c2);
      if (status.includes("KONU")) return false;
      return ["c0", "c2", "c4", "c12", "c13", "c14", "c15", "c16"].some((key) => String(row?.[key] || "").trim());
    });
  }

  function selectAppraisedUnitValue(fields, unitValueSummary) {
    const legalUnitValue = parseNumber(fields.legalValueUnit);
    if (Number.isFinite(legalUnitValue) && legalUnitValue > 0) return legalUnitValue;
    return unitValueSummary ? unitValueSummary.average : Number.NaN;
  }

  function calculateMicroMarketRadius(rows) {
    const distances = rows
      .map((row) => parseDistanceMeters(row.c20 || row.distance || row.distanceText))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (!distances.length) return Number.NaN;
    return Math.ceil(Math.max(...distances) / 100) * 100;
  }

  function parseDistanceMeters(value) {
    const text = String(value || "").trim();
    if (!text) return Number.NaN;
    const kmMatch = text.match(/(\d+(?:[.,]\d+)?)\s*km\b/i);
    if (kmMatch) {
      const km = parseNumber(kmMatch[1]);
      return Number.isFinite(km) ? km * 1000 : Number.NaN;
    }
    const meterMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:m|metre)\b/i);
    if (meterMatch) return parseNumber(meterMatch[1]);
    return parseNumber(text);
  }

  function calculateMarketingRange(rows) {
    const rates = rows
      .map((row) => {
        const declaredArea = parseNumber(row.c12);
        const adjustedArea = parseNumber(row.c13 || row.c12);
        if (!Number.isFinite(declaredArea) || !Number.isFinite(adjustedArea) || adjustedArea <= 0 || declaredArea <= adjustedArea) return Number.NaN;
        return roundToNearestFive(((declaredArea / adjustedArea) - 1) * 100);
      })
      .filter(Number.isFinite);
    if (!rates.length) return null;
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
    };
  }

  function roundToNearestFive(value) {
    if (!Number.isFinite(value)) return Number.NaN;
    return Math.round(value / 5) * 5;
  }

  function calculateCorrectionDirection(rows) {
    const values = rows
      .map((row) => calculateAdjustment(row.c8, row.c21) + calculateAdjustment(row.c9, row.c22))
      .filter(Number.isFinite);
    if (!values.length) return "paralel";
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    if (average > 0.001) return "olumlu";
    if (average < -0.001) return "olumsuz";
    return "paralel";
  }

  function calculateAdjustedUnitValueSummary(rows) {
    const values = rows.map(calculateAdjustedUnitValue).filter(Number.isFinite);
    if (!values.length) return null;
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
    };
  }

  function calculateAdjustedUnitValue(row) {
    const adjustedArea = parseNumber(row.c13 || row.c12);
    if (!Number.isFinite(adjustedArea) || adjustedArea <= 0) return Number.NaN;
    const askingPrice = parseNumber(row.c14);
    const bargainPrice = parseNumber(row.c15);
    const status = fold(row.c2);
    const saleValue = status.includes("SATILMIS")
      ? askingPrice
      : bargainPrice > 0
        ? bargainPrice
        : askingPrice;
    if (!Number.isFinite(saleValue) || saleValue <= 0) return Number.NaN;
    const unitValue = saleValue / adjustedArea;
    const adjustment = calculateAdjustment(row.c8, row.c21) + calculateAdjustment(row.c9, row.c22);
    return unitValue * (1 + adjustment);
  }

  function calculateAdjustment(direction, percentValue) {
    const percent = parsePercent(percentValue);
    const sign = String(direction || "").trim();
    if (!Number.isFinite(percent) || !sign || sign === "0") return 0;
    if (sign === "+") return -percent;
    if (sign === "-") return percent;
    return 0;
  }

  function parsePercent(value) {
    const number = parseNumber(value);
    if (!Number.isFinite(number)) return Number.NaN;
    return number > 1 ? number / 100 : number;
  }

  function parseNumber(value) {
    const text = String(value || "")
      .replace(/\b(?:TL|TRY|m2|m²|%|\/ay)\b/gi, "")
      .replace(/[₺\s]/g, "")
      .trim();
    if (!text) return Number.NaN;
    const normalized = text.includes(",") && text.includes(".")
      ? text.replace(/\./g, "").replace(",", ".")
      : hasOnlyThousandDots(text)
        ? text.replace(/\./g, "")
        : text.replace(",", ".");
    const number = Number.parseFloat(normalized.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(number) ? number : Number.NaN;
  }

  function hasOnlyThousandDots(value) {
    return /^\d{1,3}(?:\.\d{3})+$/.test(String(value || ""));
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "";
    return Math.round(value).toLocaleString("tr-TR");
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeParagraphs(value) {
    return String(value || "")
      .split(/\n+/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n\n");
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
    buildComparableMarketAnalysisText,
  };
});
