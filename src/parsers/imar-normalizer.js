(function registerImarNormalizer(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RaporImarNormalizer = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createImarNormalizer() {
  function cleanImarToken(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/[;,\s]+$/g, "")
      .trim();
  }

  function foldTurkish(value) {
    return String(value || "")
      .replace(/[İIı]/g, "I")
      .replace(/[Şş]/g, "S")
      .replace(/[Ğğ]/g, "G")
      .replace(/[Üü]/g, "U")
      .replace(/[Öö]/g, "O")
      .replace(/[Çç]/g, "C")
      .toUpperCase();
  }

  function toTitleCaseTr(value) {
    return String(value || "")
      .toLocaleLowerCase("tr-TR")
      .replace(/(^|[\s/+.-])([a-zçğıöşü])/g, (match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("tr-TR")}`);
  }

  function cleanImarLegendItem(value) {
    const cleaned = cleanImarToken(value)
      .replace(/\([^)]*\)/g, "")
      .replace(/\s*-\s*$/g, "")
      .replace(/\s*-\s*/g, " + ")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned || cleaned === "-") return "";
    return normalizeImarLegendLabel(toTitleCaseTr(cleaned));
  }

  function cleanImarPlanName(value) {
    if (/\bKESTEL\s*R?U?I?P\b|KESTELRUIP/i.test(String(value || ""))) {
      return "Kestel Revizyon Uygulama İmar Planı";
    }
    const cleaned = cleanImarToken(value)
      .replace(/^\d{3,5}\s*\/\s*/i, "")
      .replace(/\s+Plan\s+Fonksiyon\b.*$/i, "")
      .replace(/\s+Plan\s+Fonsiyon\b.*$/i, "")
      .replace(/\s+Fonksiyon\s+Uyar\S*\b.*$/i, "")
      .replace(/\s+Plan\s+notlar\S*\b.*$/i, "")
      .replace(/\s+Parantez\s+\S*inde\b.*$/i, "")
      .replace(/\s*-\s*Uygulama\b.*$/i, "")
      .replace(/^\d+\s*\/\s*\d+\s*[^\s]*l[çc]ekl[ıiİI]\s*/i, "")
      .replace(/\s+Bina\s+Y[üu]ksekli[ğg]i\b.*$/i, "")
      .replace(/\s+Kat\s+Adedi\b.*$/i, "")
      .replace(/\s+[ÖO]n\s+Bah[çc]e\b.*$/i, "")
      .replace(/\s+Yan\s+Bah[çc]e\b.*$/i, "")
      .replace(/\s+Arka\s+Bah[çc]e\b.*$/i, "")
      .replace(/\s+T\.?\s*A\.?\s*K\.?\s*S\.?\b.*$/i, "")
      .replace(/\s+K\.?\s*A\.?\s*K\.?\s*S\.?\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    const planEndMatch = cleaned.match(/^(.*\bPlan[ıiİI]?\b)/i);
    return toTitleCaseTr((planEndMatch ? planEndMatch[1] : cleaned).trim());
  }

  function normalizeImarPlanFunction(value) {
    const normalized = cleanImarToken(value)
      .replace(/\([^)]*\d+(?:[.,]\d+)?\s*m[²2][^)]*\)/gi, "")
      .replace(/\b(Mevcut|Yeni|Kentsel|Az|Orta|Yüksek|Yoğun|İkinci|2\.)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return normalizeImarLegendLabel(normalized);
  }

  function normalizeImarLegendLabel(value) {
    const clean = cleanImarToken(value);
    if (!clean) return "";
    const folded = foldTurkish(clean);

    if (/\b(TICARET\s*\+\s*KONUT|KONUT\s*\+\s*TICARET)(?:\s+ALANI)?\b/.test(folded)) {
      return "Ticaret + Konut";
    }
    if (/\b(GELISME|YERLESIK|YERLESIM)\s+KONUT(?:\s+ALANI)?\b/.test(folded)) {
      return "Konut";
    }
    if (/^KONUT(?:\s+ALANI)?$/.test(folded)) {
      return "Konut";
    }
    return toTitleCaseTr(clean).replace(/\s+Alanı\s*$/i, "");
  }

  function detectImarFunctionFromText(text) {
    const folded = foldTurkish(text);
    const candidates = [
      [/TICARET\s*\+\s*KONUT|KONUT\s*\+\s*TICARET/, "Ticaret + Konut"],
      [/\b(GELISME|YERLESIK|YERLESIM)\s+KONUT(?:\s+ALANI)?\b/, "Konut"],
      [/KONUT\s+ALANI|\bKONUT\b/, "Konut"],
      [/TICARET\s+ALANI|\bTICARET\b/, "Ticaret"],
      [/SANAYI\s+ALANI|\bSANAYI\b/, "Sanayi"],
      [/TURIZM\s+ALANI|\bTURIZM\b/, "Turizm"],
      [/EGITIM\s+ALANI|\bOKUL\b/, "Eğitim"],
      [/SAGLIK\s+ALANI|HASTANE/, "Sağlık"],
      [/PARK|YESIL\s+ALAN|REKREASYON/, "Park / Yeşil Alan"],
      [/SPOR\s+ALANI/, "Spor"],
      [/SOSYAL\s+TESIS/, "Sosyal Tesis"],
    ];
    const found = candidates.find(([pattern]) => pattern.test(folded));
    return found ? normalizeImarPlanFunction(found[1]) : "";
  }

  function cleanImarInstitutionName(value) {
    let text = cleanImarToken(value)
      .replace(/^(?:T\.?\s*C\.?|TC)\s+/i, "")
      .replace(/\bE\s*[- ]?İmar\b.*$/i, "")
      .replace(/\bE\s*[- ]?Imar\b.*$/i, "")
      .replace(/\bİmar\s+ve\s+Şehircilik\b.*$/i, "")
      .replace(/\bImar\s+ve\s+Sehircilik\b.*$/i, "");
    const municipalityMatch = text.match(/(.+?\bBelediyesi)\b/i);
    if (municipalityMatch) text = municipalityMatch[1];
    text = text.replace(/^(?:T\.?\s*C\.?|TC)\s+/i, "").trim();
    return text ? toTitleCaseTr(text) : "";
  }

  function extractImarInfoInstitution(lines) {
    const source = Array.isArray(lines) ? lines : [];
    const firstLines = source.slice(0, 30);
    for (const line of firstLines) {
      const afterDateTime = line.match(/\b\d{1,2}[./-]\d{1,2}[./-]\d{4}(?:\s+(?:Saat|Saati)\s*:?)?\s+\d{1,2}:\d{2}\s+(.+)$/i);
      if (!afterDateTime) continue;
      const institution = cleanImarInstitutionName(afterDateTime[1]);
      if (institution) return institution;
    }

    for (const line of firstLines) {
      const folded = foldTurkish(line);
      if (!folded.includes("BELEDIYESI")) continue;
      if (folded.includes("RESMI WEB SITESINDEN") || folded.includes("BU BELGE")) continue;
      const institution = cleanImarInstitutionName(line);
      if (institution) return institution;
    }

    const fullText = firstLines.join(" ");
    const afterLabel = fullText.match(/Bilgi\s+Al[ıi]n(?:ma|an)\s+(?:Tarih(?:i)?|Zaman[ıi])[^0-9]{0,80}\d{1,2}[./-]\d{1,2}[./-]\d{4}(?:\s+(?:Saat|Saati)\s*:?)?(?:\s+\d{1,2}:\d{2})?\s+(.+?Belediyesi)\b/i);
    if (afterLabel) return cleanImarInstitutionName(afterLabel[1]);

    return "";
  }

  function normalizeImarDate(value) {
    const match = String(value || "").match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
    if (!match) return "";
    return `${match[1].padStart(2, "0")}.${match[2].padStart(2, "0")}.${match[3]}`;
  }

  function extractImarPlanDate(lines) {
    const source = Array.isArray(lines) ? lines : [];
    for (let index = 0; index < source.length; index += 1) {
      const line = cleanImarToken(source[index]);
      if (!line) continue;
      const folded = foldTurkish(line);
      if (folded.includes("BU BELGE") || folded.includes("RESMI WEB SITESINDEN")) continue;
      if (/^\d{1,2}[./-]\d{1,2}[./-]\d{4}\s+\d{1,2}:\d{2}\b/.test(line)) continue;
      const hasPlanDateLabel = /(?:PLAN\s+)?(?:TASDIK|ONAY)\s+TARIH|PLAN\s+TARIH/.test(folded);
      if (!hasPlanDateLabel) continue;
      const combined = `${line} ${cleanImarToken(source[index + 1] || "")}`;
      const date = normalizeImarDate(combined);
      if (date) return date;
    }
    return "";
  }

  return {
    cleanImarLegendItem,
    cleanImarInstitutionName,
    cleanImarPlanName,
    detectImarFunctionFromText,
    extractImarInfoInstitution,
    extractImarPlanDate,
    foldTurkish,
    normalizeImarLegendLabel,
    normalizeImarPlanFunction,
    toTitleCaseTr,
  };
});
