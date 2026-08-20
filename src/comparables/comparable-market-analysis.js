(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ComparableMarketAnalysis = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  // Varyant seçimi — bkz. docs/cumle-envanteri.md "Varyant Seçim
  // Mekanizması" (rapor bazında sabit-tohumlu, cümle bazında bağımsız).
  // Bu modül state/app.js'e erişemediğinden gerçek seçici app.js'ten
  // `input.selectVariant(sentenceKey, variantCount)` olarak enjekte edilir;
  // sağlanmazsa (ör. mevcut testlerde olduğu gibi) her zaman orijinal metin
  // (index 0) döner — geriye dönük uyumluluk bilerek korunmuştur.
  function pickVariant(input, key, variants) {
    const count = variants.length;
    const selector = typeof input.selectVariant === "function" ? input.selectVariant : null;
    const index = selector ? Number(selector(key, count)) : 0;
    return variants[Number.isInteger(index) && index >= 0 && index < count ? index : 0];
  }

  // Kullanıcı talebi (2026-08-19): "ÇOKLU ARSA TARLA raporlarında emsaller
  // ortak olmalı ... yalnızca emsal açıklamalarını çoğul şekilde güncelle
  // taşınmaz yerine taşınmazlar vb." — başlangıçta yalnızca Arsa/Tarla dalına
  // (buildLandComparableMarketAnalysisText) uygulanmıştı.
  //
  // Kullanıcı talebi (2026-08-20, genişletme): "emsaller bölümünce emsal
  // metni çoklu raporlarda tekli rapor gibi davranıyor... taşınmaz yerine
  // taşınmazlar demeli" — netleştirme (AskUserQuestion) Kat İrtifakı/
  // Müstakil Bina için de AYNI davranışı (emsaller ortak + çoğul metin)
  // onayladı. `isMultiUnit` true iken (Çoklu Talep raporu, bkz. app.js
  // isComparablesSharedAcrossUnits) BU genel/Konut-İşyeri dalı da,
  // Arsa/Tarla dalı gibi, her paragrafın TEKİL yerine ÇOĞUL (elle yazılmış,
  // ayrı) varyantlarını kullanır — bu kod tabanının HER YERDE izlediği
  // "varyant metinleri elle yazılır, regex ile tekil→çoğul çevirimi
  // YAPILMAZ" ilkesi (linguistik risk nedeniyle) burada da korunur.
  function buildComparableMarketAnalysisText(input = {}) {
    const fields = input.fields || {};
    const ownership = fold(fields.ownershipType);
    if (ownership === "ARSA" || ownership === "TARLA") {
      return buildLandComparableMarketAnalysisText(input, fields, input.rows || [], ownership === "TARLA" ? "tarla" : "arsa", Boolean(input.isMultiUnit));
    }
    const isMultiUnit = Boolean(input.isMultiUnit);
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
    const microMarketSubjectPhrase = isMultiUnit ? "değerleme konusu taşınmazları" : "değerleme konusu taşınmazı";
    const microMarketText = Number.isFinite(microMarketRadius) && microMarketRadius > 0
      ? ` Piyasa çalışmaları kapsamında verilerin doğruluğunu ve homojenliğini sağlamak adına; ${microMarketSubjectPhrase} merkez alan ve ${formatMoney(microMarketRadius)} metrelik etki yarıçapı (mikro-piyasa) içerisinde kalan emsal veriler değerlendirmeye dahil edilmiştir.`
      : "";

    const p1Variants = isMultiUnit ? [
      `Değerleme konusu taşınmazların konumlu olduğu ${locationText} yürütülen saha çalışmaları kapsamında; taşınmazlar ile benzer imar koşullarına, yapı kalitesine ve fonksiyonel özelliklere sahip toplam ${comparableCount} adet emsal veri değerlendirmeye dahil edilmiştir.${microMarketText} ${marketingText} Bu doğrultuda, değerleme tablosunda yer alan emsal alanları, teknik olarak netleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye esas alınmıştır.`,
      `Değerlemeye konu gayrimenkullerin bulunduğu ${locationText} gerçekleştirilen yerinde incelemeler kapsamında; taşınmazlarla benzer imar durumuna, yapı niteliğine ve kullanım özelliklerine sahip toplam ${comparableCount} adet emsal veri değerlendirmeye alınmıştır.${microMarketText} ${marketingText} Buna göre, değerleme tablosundaki emsal alanları, teknik olarak sadeleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye dahil edilmiştir.`,
    ] : [
      `Değerleme konusu taşınmazın konumlu olduğu ${locationText} yürütülen saha çalışmaları kapsamında; taşınmaz ile benzer imar koşullarına, yapı kalitesine ve fonksiyonel özelliklere sahip toplam ${comparableCount} adet emsal veri değerlendirmeye dahil edilmiştir.${microMarketText} ${marketingText} Bu doğrultuda, değerleme tablosunda yer alan emsal alanları, teknik olarak netleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye esas alınmıştır.`,
      `Değerlemeye konu gayrimenkulün bulunduğu ${locationText} gerçekleştirilen yerinde incelemeler kapsamında; taşınmazla benzer imar durumuna, yapı niteliğine ve kullanım özelliklerine sahip toplam ${comparableCount} adet emsal veri değerlendirmeye alınmıştır.${microMarketText} ${marketingText} Buna göre, değerleme tablosundaki emsal alanları, teknik olarak sadeleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye dahil edilmiştir.`,
    ];
    const p2Variants = isMultiUnit ? [
      `Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, kat, cephe, manzarası ve iç mekan işçilik kalitesi gibi birim değerini doğrudan etkileyen kriterleri ${correctionDirection} yönde uyumlandırılarak konu taşınmazların nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır.`,
      `Bölgede gerçekleştirilen kapsamlı piyasa incelemeleri, yerel emlak danışmanlarıyla yapılan görüşmeler ve elde edilen verilerin analiz edilmesi neticesinde; emsallerin konum, kat, cephe, manzara ve iç mekân işçilik kalitesi gibi birim değeri doğrudan etkileyen unsurları ${correctionDirection} yönde dengelenerek gayrimenkullerin nihai birim değer tespitinde karşılaştırma tablosu şeklinde kullanılmıştır.`,
    ] : [
      `Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, kat, cephe, manzarası ve iç mekan işçilik kalitesi gibi birim değerini doğrudan etkileyen kriterleri ${correctionDirection} yönde uyumlandırılarak konu taşınmazın nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır.`,
      `Bölgede gerçekleştirilen kapsamlı piyasa incelemeleri, yerel emlak danışmanlarıyla yapılan görüşmeler ve elde edilen verilerin analiz edilmesi neticesinde; emsallerin konum, kat, cephe, manzara ve iç mekân işçilik kalitesi gibi birim değeri doğrudan etkileyen unsurları ${correctionDirection} yönde dengelenerek gayrimenkulün nihai birim değer tespitinde karşılaştırma tablosu şeklinde kullanılmıştır.`,
    ];

    const paragraphs = [
      pickVariant(input, "buildComparableMarketAnalysisText:p1", p1Variants),
      pickVariant(input, "buildComparableMarketAnalysisText:p2", p2Variants),
    ];

    if (unitValueSummary && Number.isFinite(appraisedUnitValue)) {
      const p3Variants = isMultiUnit ? [
        `Yapılan düzeltmeler sonucunda, emsallerin konu taşınmazlara indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² aralığında dengelendiği görülmüştür. Karşılaştırma tablosundan elde edilen verilerin bölge piyasasındaki güncel arz-talep dengesiyle örtüşmesi ve sapma oranlarının makul sınırlar içinde kalması sebebiyle, ulaşılan sonuçların piyasa gerçeğini yansıttığı tespit edilmiştir. Bu doğrultuda, taşınmazların nihai birim değeri, karşılaştırma tablosunun işaret ettiği analitik ağırlıklar ve mesleki kanaatimiz çerçevesinde ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
        `Uygulanan düzeltmeler neticesinde, emsallerin taşınmazlara indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² - ${formatMoney(unitValueSummary.max)} TL/m² bandında yoğunlaştığı görülmüştür. Karşılaştırma tablosundan elde edilen bulguların bölge piyasasındaki güncel arz-talep dengesiyle uyumlu olması ve sapma oranlarının makul sınırlar içinde kalması nedeniyle, ulaşılan sonuçların piyasa gerçeğini yansıttığı değerlendirilmiştir. Bu doğrultuda, gayrimenkullerin nihai birim değeri, karşılaştırma tablosunun işaret ettiği analitik ağırlıklar ve mesleki kanaatimiz çerçevesinde ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
      ] : [
        `Yapılan düzeltmeler sonucunda, emsallerin konu taşınmaza indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² aralığında dengelendiği görülmüştür. Karşılaştırma tablosundan elde edilen verilerin bölge piyasasındaki güncel arz-talep dengesiyle örtüşmesi ve sapma oranlarının makul sınırlar içinde kalması sebebiyle, ulaşılan sonuçların piyasa gerçeğini yansıttığı tespit edilmiştir. Bu doğrultuda, taşınmazın nihai birim değeri, karşılaştırma tablosunun işaret ettiği analitik ağırlıklar ve mesleki kanaatimiz çerçevesinde ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
        `Uygulanan düzeltmeler neticesinde, emsallerin taşınmaza indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² - ${formatMoney(unitValueSummary.max)} TL/m² bandında yoğunlaştığı görülmüştür. Karşılaştırma tablosundan elde edilen bulguların bölge piyasasındaki güncel arz-talep dengesiyle uyumlu olması ve sapma oranlarının makul sınırlar içinde kalması nedeniyle, ulaşılan sonuçların piyasa gerçeğini yansıttığı değerlendirilmiştir. Bu doğrultuda, gayrimenkulün nihai birim değeri, karşılaştırma tablosunun işaret ettiği analitik ağırlıklar ve mesleki kanaatimiz çerçevesinde ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
      ];
      paragraphs.push(pickVariant(input, "buildComparableMarketAnalysisText:p3", p3Variants));
    }

    return normalizeParagraphs(paragraphs.join("\n\n"));
  }

  // bkz. yukarıdaki buildComparableMarketAnalysisText() yorumu — AYNI
  // "isMultiUnit -> elle yazılmış çoğul varyant" ilkesi burada da geçerli.
  function buildLandComparableMarketAnalysisText(input, fields, sourceRows, landType, isMultiUnit) {
    const rows = getComparableAnalysisRows(sourceRows);
    const neighborhood = cleanText(fields.titleNeighborhood || fields.neighborhood || "ilgili");
    const street = cleanText(fields.street || fields.mainArtery || "yakın çevre");
    const locationText = buildLocationText(neighborhood, street);
    const comparableCount = rows.length;
    const marketingRange = calculateMarketingRange(rows);
    const correctionDirection = "olumlu ve olumsuz yönleri karşılaştırılarak";
    const unitValueSummary = calculateAdjustedUnitValueSummary(rows);
    const appraisedUnitValue = selectAppraisedUnitValue(fields, unitValueSummary);
    const microMarketRadius = calculateMicroMarketRadius(rows);
    const marketingText = marketingRange
      ? `Bölgedeki ${landType} piyasasında, arz edilen taşınmazların beyan edilen yüzölçümlerinin pazarlama aşamasında ${formatMarketingRange(marketingRange)} farklılık gösterebildiği tespit edilmiştir.`
      : `Bölgedeki ${landType} piyasasında, arz edilen taşınmazların beyan edilen yüzölçümlerinin pazarlama aşamasında farklılık gösterebildiği tespit edilmiştir.`;
    const microMarketSubjectPhrase = isMultiUnit ? "değerleme konusu taşınmazları" : "değerleme konusu taşınmazı";
    const microMarketText = Number.isFinite(microMarketRadius) && microMarketRadius > 0
      ? ` Piyasa çalışmaları kapsamında verilerin doğruluğunu ve homojenliğini sağlamak adına; ${microMarketSubjectPhrase} merkez alan ve ${formatMoney(microMarketRadius)} metrelik etki yarıçapı içerisinde kalan emsal veriler değerlendirmeye dahil edilmiştir.`
      : "";
    const p1Variants = isMultiUnit ? [
      `Değerleme konusu taşınmazların konumlu olduğu ${locationText} yürütülen saha çalışmaları kapsamında; taşınmazlar ile benzer imar koşullarına, yüzölçümüne ve konum özelliklerine sahip toplam ${comparableCount} adet ${landType} emsali değerlendirmeye dahil edilmiştir.${microMarketText} ${marketingText} Bu doğrultuda, değerleme tablosunda yer alan emsal yüzölçümleri ve indirgenmiş m² birim değerleri değerlendirmeye esas alınmıştır.`,
      `Değerlemeye konu taşınmazların bulunduğu ${locationText} gerçekleştirilen yerinde incelemeler kapsamında; taşınmazlarla benzer imar durumuna, yüzölçümüne ve konum niteliklerine sahip toplam ${comparableCount} adet ${landType} emsali değerlendirmeye alınmıştır.${microMarketText} ${marketingText} Buna göre, değerleme tablosundaki emsal yüzölçümleri ve indirgenmiş m² birim değerleri değerlendirmeye dahil edilmiştir.`,
    ] : [
      `Değerleme konusu taşınmazın konumlu olduğu ${locationText} yürütülen saha çalışmaları kapsamında; taşınmaz ile benzer imar koşullarına, yüzölçümüne ve konum özelliklerine sahip toplam ${comparableCount} adet ${landType} emsali değerlendirmeye dahil edilmiştir.${microMarketText} ${marketingText} Bu doğrultuda, değerleme tablosunda yer alan emsal yüzölçümleri ve indirgenmiş m² birim değerleri değerlendirmeye esas alınmıştır.`,
      `Değerlemeye konu taşınmazın bulunduğu ${locationText} gerçekleştirilen yerinde incelemeler kapsamında; taşınmazla benzer imar durumuna, yüzölçümüne ve konum niteliklerine sahip toplam ${comparableCount} adet ${landType} emsali değerlendirmeye alınmıştır.${microMarketText} ${marketingText} Buna göre, değerleme tablosundaki emsal yüzölçümleri ve indirgenmiş m² birim değerleri değerlendirmeye dahil edilmiştir.`,
    ];
    const p2Variants = isMultiUnit ? [
      `Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, yüzölçümü, imar yapılaşma nizamı, Emsal/KAKS oranı ve imar lejantı gibi birim değerini doğrudan etkileyen kriterleri ${correctionDirection} konu taşınmazların nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır.`,
      `Bölgede gerçekleştirilen kapsamlı piyasa incelemeleri, yerel emlak danışmanlarıyla yapılan görüşmeler ve elde edilen verilerin analiz edilmesi neticesinde; emsallerin konum, yüzölçümü, imar yapılaşma nizamı, Emsal/KAKS oranı ve imar lejantı gibi birim değeri doğrudan etkileyen unsurları ${correctionDirection} taşınmazların nihai birim değer tespitinde karşılaştırma tablosu şeklinde kullanılmıştır.`,
    ] : [
      `Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, yüzölçümü, imar yapılaşma nizamı, Emsal/KAKS oranı ve imar lejantı gibi birim değerini doğrudan etkileyen kriterleri ${correctionDirection} konu taşınmazın nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır.`,
      `Bölgede gerçekleştirilen kapsamlı piyasa incelemeleri, yerel emlak danışmanlarıyla yapılan görüşmeler ve elde edilen verilerin analiz edilmesi neticesinde; emsallerin konum, yüzölçümü, imar yapılaşma nizamı, Emsal/KAKS oranı ve imar lejantı gibi birim değeri doğrudan etkileyen unsurları ${correctionDirection} gayrimenkulün nihai birim değer tespitinde karşılaştırma tablosu şeklinde kullanılmıştır.`,
    ];
    const paragraphs = [
      pickVariant(input, "buildLandComparableMarketAnalysisText:p1", p1Variants),
      pickVariant(input, "buildLandComparableMarketAnalysisText:p2", p2Variants),
    ];
    if (unitValueSummary && Number.isFinite(appraisedUnitValue)) {
      const p3Variants = isMultiUnit ? [
        `Yapılan düzeltmeler sonucunda, emsallerin konu taşınmazlara indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² aralığında dengelendiği görülmüştür. Bu doğrultuda, taşınmazların nihai birim değeri ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
        `Uygulanan düzeltmeler neticesinde, emsallerin taşınmazlara indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² bandında dengelendiği görülmüştür. Bu doğrultuda, taşınmazların nihai birim değeri ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
      ] : [
        `Yapılan düzeltmeler sonucunda, emsallerin konu taşınmaza indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² aralığında dengelendiği görülmüştür. Bu doğrultuda, taşınmazın nihai birim değeri ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
        `Uygulanan düzeltmeler neticesinde, emsallerin taşınmaza indirgenmiş birim değerlerinin ${formatMoney(unitValueSummary.min)} TL/m² ile ${formatMoney(unitValueSummary.max)} TL/m² bandında dengelendiği görülmüştür. Bu doğrultuda, taşınmazın nihai birim değeri ${formatMoney(appraisedUnitValue)} TL/m² olarak takdir edilmiştir.`,
      ];
      paragraphs.push(pickVariant(input, "buildLandComparableMarketAnalysisText:p3", p3Variants));
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
