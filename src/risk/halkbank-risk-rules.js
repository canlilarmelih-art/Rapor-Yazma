(function (root, factory) {
  const data = root.HalkbankRiskData || (typeof require === "function" ? require("./halkbank-risk-data") : []);
  const api = factory(data);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.HalkbankRiskRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (riskData) {
  const halkbankName = "TURKIYE HALK BANKASI A S";
  const directEncumbranceRules = [
    { code: "1C", patterns: ["KANUNI IPOTEK"] },
    { code: "1F", patterns: ["TICARI ISLETME REHNI"] },
    { code: "1H", patterns: ["TESCIL ISLEMI DEVAM"] },
    { code: "3C", patterns: ["VERASET INTIKAL ILISIGI", "VERASET INTIKAL"] },
    { code: "3E", patterns: ["MALIKIN OLU", "MALIK OLU"] },
    { code: "5A", patterns: ["AILE KONUTU"] },
    { code: "5B", patterns: ["AILE YURDU"] },
    { code: "9A", patterns: ["GECICI TESCIL"] },
    { code: "10A", patterns: ["SATIS VAADI"] },
    { code: "13A", patterns: ["BAGISLAMA VAADI"] },
    { code: "14A", patterns: ["HIBEDEN RUCU", "BAGISLAYANA RUCU", "VAHIDE RUCU"] },
    { code: "16A", patterns: ["VESAYET", "KANUNI KISITLILIK"] },
    { code: "16C", patterns: ["KANUNI MUSAVIR"] },
    { code: "22A", patterns: ["IFLAS ERTELEME"] },
    { code: "23A", patterns: ["IZALE I SUYU", "ORTAKLIGIN GIDERILMESI"] },
    { code: "24A", patterns: ["FINANSAL KIRALAMA"] },
    { code: "35A", patterns: ["MULKIYET DAVASI"] },
    { code: "35B", patterns: ["IMAR KADASTRO DAVASI", "KADASTRO DAVASI"] },
    { code: "35C", patterns: ["YAPI RUHSATI PROJE IPTALI", "RUHSAT PROJE IPTALI", "NUMARATAJ DUZELTME DAVASI"] },
    { code: "43B", patterns: ["TASFIYEYE TABI"] },
    { code: "65A", patterns: ["ZILYETLIK"] },
    { code: "69A", patterns: ["TEFERRUAT"] },
    { code: "72B", patterns: ["KAYYUM"] },
  ];

  function calculateHalkbankRiskCodes(input = {}) {
    const fields = input.fields || {};
    const tables = input.tables || {};
    const disabledCodes = new Set((input.disabledCodes || []).map(normalizeCode));
    const manualCodes = (input.manualCodes || []).map(normalizeManualCode).filter(Boolean);
    const candidates = [];

    const add = (code, reason, options = {}) => {
      const normalizedCode = normalizeCode(code);
      if (!normalizedCode || disabledCodes.has(normalizedCode)) return;
      const definition = findRiskDefinition(normalizedCode);
      candidates.push({
        ...definition,
        code: normalizedCode,
        reason,
        source: options.source || "auto",
      });
    };

    const encumbrance = collectEncumbranceFacts(tables, fields);
    const legalArea = firstNumber(fields.legalValueArea, fields.legalArea);
    const currentArea = firstNumber(fields.currentValueArea, fields.currentArea);
    const currentValue = firstNumber(fields.currentValue, fields.legalValue);

    if (encumbrance.managementPlan) add("68A", "Beyanlar bölümünde Yönetim Planı kaydı bulundu.");
    encumbrance.directCodeMatches.forEach((match) => add(match.code, match.reason));
    encumbrance.durationCodeMatches.forEach((match) => add(match.code, match.reason));
    if (Number.isFinite(currentArea) && Number.isFinite(legalArea) && currentArea > legalArea) {
      add("110A", "Mevcut kullanım alanı yasal kullanım alanından büyük.");
    }
    if (Number.isFinite(currentArea) && Number.isFinite(legalArea) && legalArea > currentArea) {
      add("101M", "Yasal/proje alanı mevcut inşa edilmiş alandan büyük.");
    }

    if (encumbrance.hasHalkbankMortgage) add("1A", "İpotekler bölümünde Halkbank lehine ipotek bulundu.");
    if (encumbrance.hasOtherMortgage) add("1B", "İpotekler bölümünde Halkbank dışı ipotek bulundu.");

    const lienLimit10 = Number.isFinite(currentValue) ? currentValue * 0.1 : 0;
    const lienLimit30 = Number.isFinite(currentValue) ? currentValue * 0.3 : 0;
    const hasHalkbankFirstMortgage = encumbrance.hasHalkbankFirstMortgage || encumbrance.hasHalkbankMortgage;
    const use2E = currentValue > 0 && encumbrance.totalLienAmount > 0 && hasHalkbankFirstMortgage && encumbrance.totalLienAmount < lienLimit30;
    if (use2E) {
      add("2E", "Halkbank ipoteği ve mevcut değerin %30'undan az haciz toplamı bulundu.");
    } else if (currentValue > 0) {
      if (encumbrance.publicLienAmount > lienLimit10) add("2A", "Kamu haczi tutarı mevcut değerin %10'undan fazla.");
      if (encumbrance.privateLienAmount > lienLimit10) add("2B", "Özel/ icrai haciz tutarı mevcut değerin %10'undan fazla.");
      if (encumbrance.precautionaryLienAmount > lienLimit10) add("2C", "İhtiyati haciz tutarı mevcut değerin %10'undan fazla.");
      if (encumbrance.totalLienAmount > 0 && encumbrance.totalLienAmount < lienLimit10) add("2D", "Toplam haciz tutarı mevcut değerin %10'undan az.");
    }

    if (isShareTitle(fields.titleOwnershipKind)) add("3A", "Mülkiyet türü hisseli seçildi.");
    if (encumbrance.utilityEasement) add("6A", "Hak/mükellefiyetlerde enerji, su, kanalizasyon veya benzeri irtifak kaydı bulundu.");

    const constructionLevel = parsePercent(firstText(fields.buildingInspectionProgressLevel, fields.constructionLevel, fields.legalConstructionLevel));
    if (Number.isFinite(constructionLevel) && constructionLevel > 0 && constructionLevel < 100) {
      add(constructionLevel >= 50 ? "101B" : "101C", `İnşaat seviyesi %${formatPlainNumber(constructionLevel)} olarak girildi.`);
    }
    if (isBuildingInspectionTerminated(fields)) add("101K", "Yapı denetim sözleşmesi fesihli/aktif değil olarak işaretlendi.");
    if (isExternalAppointment(fields.appointmentType)) {
      add("108A", "Randevu türü dışarıdan ekspertiz olarak seçildi.");
      add("129A", "Dışarıdan ekspertizde konum/yön tespiti riski için otomatik eklendi.");
    }
    if (isNo(fields.staticSuitability)) add("109B", "Statik uygunluk Hayır olarak seçildi.");
    if (isYes(fields.projectDifference)) add("109E", "Tapu projesi ile belediye projesi arasında fark var olarak seçildi.");
    if (encumbrance.ownerPresenceRestriction) add("16B", "Malik/ilgili gelmeden işlem yapılamaz beyanı bulundu.");
    if (encumbrance.saleToExecution) {
      add(encumbrance.saleToExecutionByHalkbank ? "18A" : "18B", encumbrance.saleToExecutionByHalkbank
        ? "Satışa arz şerhi Halkbank ipoteğiyle birlikte bulundu."
        : "Satışa arz şerhi Halkbank dışı kişi/kurumla ilişkilendirildi.");
    }
    if (encumbrance.bankruptcy) add("21A", "İflas/Konkordato şerhi bulundu.");
    if (encumbrance.precautionaryMeasure) add("36A", "İhtiyati tedbir veya ferağdan men şerhi bulundu.");
    if (hasFunctionDifference(fields)) add("104D", "Yasal kullanım niteliği ile mevcut kullanım niteliği farklı.");

    manualCodes.forEach((manual) => add(manual.code, manual.reason || "Kullanıcı tarafından manuel eklendi.", { source: "manual" }));

    const selected = dedupeRiskItems(candidates);
    if (!selected.length && !disabledCodes.has("0") && !disabledCodes.has("MS1") && !hasAnyEncumbranceData(encumbrance)) {
      selected.push({
        ...findRiskDefinition("0"),
        code: "0",
        reason: "Takyidat ve otomatik risk üreten kayıt bulunmadı.",
        source: "auto",
      });
    }

    return {
      selected: selected.sort((a, b) => compareRiskCodes(a.code, b.code)),
      disabledCodes: Array.from(disabledCodes),
    };
  }

  function collectEncumbranceFacts(tables = {}, fields = {}) {
    const declarations = getRows(tables.encumbranceDeclarations);
    const annotations = getRows(tables.encumbranceAnnotations);
    const mortgages = getRows(tables.encumbranceMortgages);
    const mortgageFacts = mortgages.map((row, index) => {
      const creditor = firstText(row.c0, row.creditor, row.lehtar, row.description);
      const degree = firstText(row.c1, row.degree, row.derece);
      return {
        row,
        creditor,
        degree,
        isHalkbank: isHalkbank(creditor),
        isFirstDegree: String(degree || "").trim() === "1",
        index,
      };
    });

    const lienRows = annotations.filter((row) => isLienRow(row));
    const lienAmounts = lienRows.map((row) => ({
      row,
      amount: firstNumber(row.c2, row.amount, row.tutar, row.c1),
      text: searchableRowText(row),
    }));
    const sumBy = (predicate) => lienAmounts
      .filter((item) => predicate(item.text))
      .reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);
    const anyLienAmount = lienAmounts.reduce((sum, item) => sum + (Number.isFinite(item.amount) ? item.amount : 0), 0);

    const allEncumbranceRows = [...declarations, ...annotations];
    const allTexts = allEncumbranceRows.map(searchableRowText);
    const annotationTexts = annotations.map(searchableRowText);
    const directCodeMatches = collectDirectEncumbranceCodeMatches(allEncumbranceRows);
    const durationCodeMatches = collectDurationEncumbranceCodeMatches(allEncumbranceRows, fields);

    return {
      declarations,
      annotations,
      mortgages,
      hasHalkbankMortgage: mortgageFacts.some((item) => item.isHalkbank),
      hasHalkbankFirstMortgage: mortgageFacts.some((item) => item.isHalkbank && item.isFirstDegree),
      hasOtherMortgage: mortgageFacts.some((item) => !item.isHalkbank && item.creditor),
      publicLienAmount: sumBy((text) => text.includes("KAMU") || text.includes("AMME")),
      privateLienAmount: sumBy((text) => !text.includes("KAMU") && !text.includes("AMME") && !text.includes("IHTIYATI")),
      precautionaryLienAmount: sumBy((text) => text.includes("IHTIYATI HACIZ")),
      totalLienAmount: anyLienAmount,
      directCodeMatches,
      durationCodeMatches,
      managementPlan: allTexts.some((text) => text.includes("YONETIM PLANI")),
      utilityEasement: declarations.some((row) => {
        const text = searchableRowText(row);
        return text.includes("IRTIFAK") && /(TEK|TEDAS|ISKI|IETT|ENERJI|SU|KANALIZASYON|PIS SU)/.test(text);
      }),
      ownerPresenceRestriction: allTexts.some((text) => text.includes("MALIK") && (text.includes("GELMEDEN") || text.includes("BIZZAT")) && text.includes("ISLEM")),
      saleToExecution: annotationTexts.some((text) => text.includes("SATISA ARZ") || text.includes("150/C") || text.includes("150 C")),
      saleToExecutionByHalkbank: annotationTexts.some((text) => (text.includes("SATISA ARZ") || text.includes("150/C") || text.includes("150 C")) && text.includes("HALK")),
      bankruptcy: annotationTexts.some((text) => (text.includes("IFLAS") && !text.includes("IFLAS ERTELEME")) || text.includes("KONKORDATO")),
      precautionaryMeasure: annotationTexts.some((text) => text.includes("IHTIYATI TEDBIR") || text.includes("FERAGDAN MEN")),
    };
  }

  function formatHalkbankRiskReportText(items = []) {
    return (items || [])
      .filter((item) => item && item.code)
      .sort((a, b) => compareRiskCodes(a.code, b.code))
      .map((item) => {
        const text = item.reportText || findRiskDefinition(item.code).reportText || item.status || "";
        return text ? `${text} (${item.code} Risk Kodu)` : `(${item.code} Risk Kodu)`;
      })
      .join("\n\n");
  }

  function sortRiskCodes(codes = []) {
    return [...codes].map(normalizeCode).filter(Boolean).sort(compareRiskCodes);
  }

  function dedupeRiskItems(items = []) {
    const byCode = new Map();
    items.forEach((item) => {
      if (!item?.code || byCode.has(item.code)) return;
      byCode.set(item.code, item);
    });
    return Array.from(byCode.values());
  }

  function collectDirectEncumbranceCodeMatches(rows = []) {
    const matches = [];
    rows.forEach((row) => {
      const text = searchableRowText(row);
      directEncumbranceRules.forEach((rule) => {
        if (rule.patterns.some((pattern) => text.includes(pattern))) {
          matches.push({
            code: rule.code,
            reason: `Takyidat metninde "${rule.patterns[0]}" ifadesi bulundu.`,
          });
        }
      });
    });
    return matches;
  }

  function collectDurationEncumbranceCodeMatches(rows = [], fields = {}) {
    const reportDate = parseDateValue(firstText(fields.reportDate, fields.appointmentDate, fields.takbisDate)) || new Date();
    const matches = [];
    rows.forEach((row) => {
      const text = searchableRowText(row);
      if (text.includes("GERI ALIM") || text.includes("VEFA HAKKI")) {
        const startDate = getRowDate(row, text);
        const years = startDate ? fullYearsBetween(startDate, reportDate) : NaN;
        matches.push({
          code: Number.isFinite(years) && years >= 10 ? "8A" : "8B",
          reason: Number.isFinite(years)
            ? `Geri alım/vefa hakkı şerhi ${years} yıllık süreye göre değerlendirildi.`
            : "Geri alım/vefa hakkı şerhi bulundu; süre netleşmediği için dolmamış kabul edildi.",
        });
      }
      if ((text.includes("ALIM") || text.includes("ISTIRA")) && !text.includes("GERI ALIM") && !text.includes("VEFA HAKKI")) {
        const startDate = getRowDate(row, text);
        const years = startDate ? fullYearsBetween(startDate, reportDate) : NaN;
        matches.push({
          code: Number.isFinite(years) && years >= 10 ? "11A" : "11B",
          reason: Number.isFinite(years)
            ? `Alım/iştira hakkı şerhi ${years} yıllık süreye göre değerlendirildi.`
            : "Alım/iştira hakkı şerhi bulundu; süre netleşmediği için dolmamış kabul edildi.",
        });
      }
      if (text.includes("SUFA") || text.includes("ONALIM")) {
        const startDate = getRowDate(row, text);
        const years = startDate ? fullYearsBetween(startDate, reportDate) : NaN;
        matches.push({
          code: Number.isFinite(years) && years >= 10 ? "17A" : "17B",
          reason: Number.isFinite(years)
            ? `Şufa/önalım hakkı şerhi ${years} yıllık süreye göre değerlendirildi.`
            : "Şufa/önalım hakkı şerhi bulundu; süre netleşmediği için dolmamış kabul edildi.",
        });
      }
      if (text.includes("INTIFA")) {
        const endDate = getRowEndDate(row, text);
        const yearsRemaining = endDate ? yearsBetweenFraction(reportDate, endDate) : NaN;
        matches.push({
          code: Number.isFinite(yearsRemaining) && yearsRemaining < 5 ? "6C" : "6D",
          reason: Number.isFinite(yearsRemaining)
            ? `İntifa hakkı kalan süre ${formatPlainNumber(Math.max(yearsRemaining, 0))} yıl olarak hesaplandı.`
            : "İntifa hakkı bulundu; bitiş tarihi netleşmediği için 5 yıldan fazla kabul edildi.",
        });
      }
      if (text.includes("SUKNA") || text.includes("OTURMA HAKKI")) {
        const endDate = getRowEndDate(row, text);
        const yearsRemaining = endDate ? yearsBetweenFraction(reportDate, endDate) : NaN;
        matches.push({
          code: Number.isFinite(yearsRemaining) && yearsRemaining < 5 ? "30A" : "30B",
          reason: Number.isFinite(yearsRemaining)
            ? `Sükna/oturma hakkı kalan süre ${formatPlainNumber(Math.max(yearsRemaining, 0))} yıl olarak hesaplandı.`
            : "Sükna/oturma hakkı bulundu; bitiş tarihi netleşmediği için 5 yıldan fazla kabul edildi.",
        });
      }
    });
    return matches;
  }

  function findRiskDefinition(code) {
    const normalized = normalizeCode(code);
    const matched = (riskData || []).find((row) => normalizeCode(row.code) === normalized);
    if (matched) return { ...matched, code: normalizeCode(matched.code) };
    if (normalized === "0" || normalized === "MS1") {
      return {
        topic: "Risksiz Durumlar",
        code: "0",
        status: "Takyidat-Özel Durum Yok",
        reportText: "Yapılan incelemeye göre değerleme konusu taşınmaz üzerinde herhangi bir takyidat veya riskli durum bulunmamaktadır.",
        valuationMethod: "Yasal ve Mevcut Durum Değeri takdir edilir.",
        valueType: "Y+M",
      };
    }
    return { topic: "", code: normalized, status: "", reportText: "", valuationMethod: "", valueType: "" };
  }

  function compareRiskCodes(a, b) {
    const keyA = riskCodeSortKey(a);
    const keyB = riskCodeSortKey(b);
    return keyA.localeCompare(keyB, "tr");
  }

  function riskCodeSortKey(code) {
    const normalized = normalizeCode(code);
    if (normalized === "0" || normalized === "MS1") return "0000";
    const match = normalized.match(/^(\d+)([A-Z]*)$/);
    if (!match) return `9999-${normalized}`;
    return `${String(match[1]).padStart(4, "0")}-${match[2] || ""}`;
  }

  function normalizeManualCode(value) {
    if (typeof value === "string") return { code: normalizeCode(value), reason: "" };
    if (!value || typeof value !== "object") return null;
    return { code: normalizeCode(value.code), reason: String(value.reason || "").trim() };
  }

  function normalizeCode(value) {
    return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  }

  function getRows(value) {
    return Array.isArray(value) ? value.filter((row) => row && Object.values(row).some((cell) => String(cell || "").trim())) : [];
  }

  function hasAnyEncumbranceData(facts) {
    return Boolean(facts.declarations.length || facts.annotations.length || facts.mortgages.length);
  }

  function searchableRowText(row) {
    return Object.values(row || {}).map((value) => foldTurkish(value)).join(" ");
  }

  function isLienRow(row) {
    // Tip etiketi tedbir olan kayıtlar (İhtiyati Tedbir) haciz değildir.
    if (foldTurkish(row?.c0).includes("TEDBIR")) return false;
    const text = searchableRowText(row);
    // "Haciz" katlanınca "HACIZ", "Haczi" ise "HACZI" olur; ikisi de yakalanır.
    return text.includes("HACIZ") || text.includes("HACZ");
  }

  function isHalkbank(value) {
    return foldTurkish(value).includes(halkbankName);
  }

  function isShareTitle(value) {
    return foldTurkish(value).includes("HISSE");
  }

  function isExternalAppointment(value) {
    const text = foldTurkish(value);
    return text.includes("DISARIDAN") || text.includes("DISARIDAN EKSPERTIZ");
  }

  function isBuildingInspectionTerminated(fields = {}) {
    const status = foldTurkish(fields.buildingInspectionContractActive);
    return status.includes("HAYIR") || status.includes("FESIH") || status.includes("PASIF");
  }

  function hasFunctionDifference(fields = {}) {
    if (isYes(fields.usageNatureDifference)) return true;
    const legal = foldTurkish(fields.legalUsageNature);
    const current = foldTurkish(fields.currentUsageNature);
    return Boolean(legal && current && legal !== current);
  }

  function isYes(value) {
    return foldTurkish(value).startsWith("EVET");
  }

  function isNo(value) {
    return foldTurkish(value).startsWith("HAYIR");
  }

  function firstText(...values) {
    return values.find((value) => String(value || "").trim()) || "";
  }

  function firstNumber(...values) {
    for (const value of values) {
      const number = parseNumber(value);
      if (Number.isFinite(number)) return number;
    }
    return NaN;
  }

  function getRowDate(row = {}, foldedText = "") {
    return parseDateValue(firstText(row.c3, row.date, row.tarih, row.c4))
      || extractFirstDateFromText(rawRowText(row))
      || extractFirstDateFromText(foldedText);
  }

  function getRowEndDate(row = {}, foldedText = "") {
    return parseDateValue(firstText(row.endDate, row.bitisTarihi, row.sureBitimi))
      || extractLastDateFromText(rawRowText(row))
      || extractLastDateFromText(foldedText);
  }

  function rawRowText(row = {}) {
    return Object.values(row || {}).map((value) => String(value || "")).join(" ");
  }

  function parseDateValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const text = String(value || "").trim();
    if (!text) return null;
    let match = text.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
    if (match) return makeDate(Number(match[1]), Number(match[2]), Number(match[3]));
    match = text.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\b/);
    if (match) return makeDate(Number(match[3]), Number(match[2]), Number(match[1]));
    return null;
  }

  function extractFirstDateFromText(text) {
    const matches = extractDatesFromText(text);
    return matches[0] || null;
  }

  function extractLastDateFromText(text) {
    const matches = extractDatesFromText(text);
    return matches[matches.length - 1] || null;
  }

  function extractDatesFromText(text) {
    const dates = [];
    String(text || "").replace(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\b/g, (_, day, month, year) => {
      const date = makeDate(Number(year), Number(month), Number(day));
      if (date) dates.push(date);
      return _;
    });
    return dates;
  }

  function makeDate(year, month, day) {
    if (!year || !month || !day) return null;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date;
  }

  function fullYearsBetween(startDate, endDate) {
    let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
    const endMonth = endDate.getUTCMonth();
    const startMonth = startDate.getUTCMonth();
    if (endMonth < startMonth || (endMonth === startMonth && endDate.getUTCDate() < startDate.getUTCDate())) {
      years -= 1;
    }
    return years;
  }

  function yearsBetweenFraction(startDate, endDate) {
    return (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }

  function parsePercent(value) {
    const number = parseNumber(value);
    if (!Number.isFinite(number)) return NaN;
    return number <= 1 ? number * 100 : number;
  }

  function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    let text = String(value || "").trim();
    if (!text) return NaN;
    text = text.replace(/[%₺TLtl\s]/g, "");
    const lastComma = text.lastIndexOf(",");
    const lastDot = text.lastIndexOf(".");
    if (lastComma > -1 && lastDot > -1) {
      text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
    } else if (lastComma > -1) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else if ((text.match(/\./g) || []).length > 1) {
      text = text.replace(/\./g, "");
    } else if (/^\d{1,3}\.\d{3}$/.test(text)) {
      text = text.replace(/\./g, "");
    }
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function formatPlainNumber(value) {
    return Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
  }

  function foldTurkish(value) {
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
      .replace(/[^\w%/]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  }

  return {
    calculateHalkbankRiskCodes,
    collectEncumbranceFacts,
    compareRiskCodes,
    findRiskDefinition,
    formatHalkbankRiskReportText,
    parseNumber,
    sortHalkbankRiskCodes: sortRiskCodes,
    sortRiskCodes,
  };
});
