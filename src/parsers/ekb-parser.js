(function registerEkbParser(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RaporEkbParser = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createEkbParser() {
  function foldTurkish(value) {
    return String(value || "")
      .replace(/İ/g, "I")
      .replace(/I/g, "I")
      .replace(/ı/g, "I")
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
      .toUpperCase();
  }

  function normalizeEkbDate(value) {
    const match = String(value || "").match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
    if (!match) return "";
    return `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${match[3]}`;
  }

  function dateTrToIso(value) {
    const match = normalizeEkbDate(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
  }

  function addYearsToTrDate(value, years) {
    const normalized = normalizeEkbDate(value);
    const match = normalized.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return "";
    const year = Number(match[3]) + years;
    return `${match[1]}.${match[2]}.${String(year).padStart(4, "0")}`;
  }

  function extractEkbDocumentNo(text) {
    const belgePattern = /\b([A-Z]\d[A-Z0-9]{11})\b/i;
    const windIndex = foldTurkish(text).search(/RUZGAR\s+ENERJISI/);
    if (windIndex >= 0) {
      const match = text.slice(windIndex).match(belgePattern);
      if (match) return match[1].toUpperCase();
    }
    const labeled = text.match(/Numarası\s*:?\s*([A-Z]\d[A-Z0-9]{11})\b/i);
    if (labeled) return labeled[1].toUpperCase();
    const fallback = text.match(belgePattern);
    return fallback ? fallback[1].toUpperCase() : "";
  }

  function findEkbTenYearDatePair(dates) {
    const list = Array.isArray(dates) ? dates.filter((date) => date.value) : [];
    let pair = null;
    for (let i = 0; i < list.length; i += 1) {
      const expectedValidUntil = addYearsToTrDate(list[i].value, 10);
      if (!expectedValidUntil) continue;
      const later = list.slice(i + 1).find((date) => date.value === expectedValidUntil);
      if (later) {
        pair = { issueDate: list[i].value, validUntil: later.value };
      }
    }
    return pair;
  }

  function extractEkbDates(lines) {
    const datePattern = /\b(\d{1,2}\.\d{1,2}\.\d{4})\b/g;
    const allDates = lines.flatMap((line, lineIndex) =>
      Array.from(line.matchAll(datePattern))
        .map((match) => ({
          value: normalizeEkbDate(match[1]),
          lineIndex,
          index: match.index || 0,
        }))
        .filter((date) => date.value),
    );
    const uniqueDates = Array.from(new Set(allDates.map((date) => date.value)));
    let issueDate = "";
    let validUntil = "";

    lines.forEach((line) => {
      const folded = foldTurkish(line);
      const date = normalizeEkbDate((line.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/) || [])[1]);
      if (!date) return;
      if (!issueDate && /VERILIS\s+TARIHI/.test(folded)) issueDate = date;
      if (!validUntil && /(SON\s+)?GECERLILIK\s+TARIHI/.test(folded)) validUntil = date;
    });

    const tenYearPair = findEkbTenYearDatePair(allDates);
    if (tenYearPair && (!issueDate || !validUntil)) {
      issueDate = issueDate || tenYearPair.issueDate;
      validUntil = validUntil || tenYearPair.validUntil;
    }

    if (issueDate && !validUntil) {
      const expectedValidUntil = addYearsToTrDate(issueDate, 10);
      if (uniqueDates.includes(expectedValidUntil)) validUntil = expectedValidUntil;
    }
    if (validUntil && !issueDate) {
      const expectedIssueDate = addYearsToTrDate(validUntil, -10);
      if (uniqueDates.includes(expectedIssueDate)) issueDate = expectedIssueDate;
    }

    if (!issueDate && uniqueDates.length >= 1) {
      issueDate = uniqueDates[uniqueDates.length >= 2 ? uniqueDates.length - 2 : 0];
    }
    if (!validUntil && uniqueDates.length >= 2) {
      validUntil = uniqueDates[uniqueDates.length - 1];
    }

    return { issueDate, validUntil };
  }

  function pickClassNearLabel(lines, labelPattern) {
    for (let i = 0; i < lines.length; i += 1) {
      const folded = foldTurkish(lines[i]);
      if (!labelPattern.test(folded)) continue;
      const sameLine = lines[i].match(/\b([A-G])\b(?!.*\b[A-G]\b)/i);
      if (sameLine) return sameLine[1].toUpperCase();
      for (let offset = 1; offset <= 3; offset += 1) {
        const next = lines[i + offset] || "";
        const match = next.match(/\b([A-G])\b(?!.*\b[A-G]\b)/i);
        if (match) return match[1].toUpperCase();
      }
    }
    return "";
  }

  function findGraphClass(lines, occurrenceIndex = 0) {
    const matches = [];
    lines.forEach((line) => {
      const graphMatch =
        line.match(/\b\d+\s*[-–]\s*\d+\s+\d+\s+\d+\s*[-–]\s*\d+\s+\d+\s+([A-G])\b/i) ||
        line.match(/\b\d+\s*[-–]\s*\d+\s+\d+\s+([A-G])\s*$/i) ||
        line.match(/\b\d{1,3}(?:\.\d{3})+,\d+\s+([A-G])\s*$/i);
      if (graphMatch) matches.push(graphMatch[1].toUpperCase());
    });
    return matches[occurrenceIndex] || matches[0] || "";
  }

  function extractEkbClasses(lines, text) {
    let energyClass = pickClassNearLabel(lines, /PERFORMANS\s+SINIFI|ENERJI\s+SINIFI/);
    let emissionClass = pickClassNearLabel(lines, /EMISYON\s+SINIFI|SERA\s+GAZI/);

    if (!energyClass) {
      energyClass = findGraphClass(lines, 0);
    }
    if (!emissionClass) {
      emissionClass = findGraphClass(lines, 1);
    }
    if (!emissionClass && energyClass && /SERA|EMISYON/i.test(foldTurkish(text))) {
      emissionClass = findGraphClass(lines, 1) || "";
    }

    return { energyClass, emissionClass };
  }

  function parseEkbFields(text) {
    const raw = String(text || "");
    const lines = raw.split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    const normalizedText = lines.join("\n");
    const belgeNo = extractEkbDocumentNo(normalizedText);
    const dates = extractEkbDates(lines);
    const classes = extractEkbClasses(lines, normalizedText);

    return {
      ekbDocumentNo: belgeNo,
      ekbIssueDate: dateTrToIso(dates.issueDate),
      ekbValidUntil: dateTrToIso(dates.validUntil),
      ekbEnergyClass: classes.energyClass,
      ekbEmissionClass: classes.emissionClass,
    };
  }

  return {
    addYearsToTrDate,
    dateTrToIso,
    extractEkbClasses,
    extractEkbDates,
    extractEkbDocumentNo,
    findEkbTenYearDatePair,
    normalizeEkbDate,
    parseEkbFields,
  };
});
