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
      return "Ticaret + Konut Alanı";
    }
    if (/\b(GELISME|YERLESIK|YERLESIM)\s+KONUT(?:\s+ALANI)?\b/.test(folded)) {
      return "Konut Alanı";
    }
    if (/^KONUT(?:\s+ALANI)?$/.test(folded)) {
      return "Konut Alanı";
    }
    return toTitleCaseTr(clean);
  }

  function detectImarFunctionFromText(text) {
    const folded = foldTurkish(text);
    const candidates = [
      [/TICARET\s*\+\s*KONUT|KONUT\s*\+\s*TICARET/, "Ticaret + Konut Alanı"],
      [/\b(GELISME|YERLESIK|YERLESIM)\s+KONUT(?:\s+ALANI)?\b/, "Konut Alanı"],
      [/KONUT\s+ALANI|\bKONUT\b/, "Konut Alanı"],
      [/TICARET\s+ALANI|\bTICARET\b/, "Ticaret Alanı"],
      [/SANAYI\s+ALANI|\bSANAYI\b/, "Sanayi Alanı"],
      [/TURIZM\s+ALANI|\bTURIZM\b/, "Turizm Alanı"],
      [/EGITIM\s+ALANI|\bOKUL\b/, "Eğitim Alanı"],
      [/SAGLIK\s+ALANI|HASTANE/, "Sağlık Alanı"],
      [/PARK|YESIL\s+ALAN|REKREASYON/, "Park / Yeşil Alan"],
      [/SPOR\s+ALANI/, "Spor Alanı"],
      [/SOSYAL\s+TESIS/, "Sosyal Tesis Alanı"],
    ];
    const found = candidates.find(([pattern]) => pattern.test(folded));
    return found ? normalizeImarPlanFunction(found[1]) : "";
  }

  return {
    cleanImarLegendItem,
    cleanImarPlanName,
    detectImarFunctionFromText,
    foldTurkish,
    normalizeImarLegendLabel,
    normalizeImarPlanFunction,
    toTitleCaseTr,
  };
});
