"use strict";

/* =====================================================================
   BANKA RAPOR ŞABLON MOTORU (2026-07-12)

   Amaç: templates/ klasöründeki KULLANICI TARAFINDAN DÜZENLENEBİLİR
   HTML şablon dosyalarını ({{PLACEHOLDER}} işaretli), uygulamadaki
   rapor verileriyle doldurup Word ile açılabilen .doc dosyası olarak
   indirtmek.

   Placeholder çözümleme sırası (hepsi Türkçe-katlanmış, noktalama
   duyarsız karşılaştırılır — örn. {{DIŞ.KAPI.NO}} == {{dis_kapi_no}}):
     1. LEGACY_ALIASES  — eski Excel adlandırılmış hücre adları
                          (SEHIR, ADRES2025, TAKYIDAT_TABLO...)
     2. Uygulama alan anahtarları (sections[].fields[].key, örn. CITY)
     3. Oluşturulan metinler (collectGeneratedTextPlaceholders anahtarı)
   Eşleşme YOKSA çıktıya sarı "⚠ AD" işareti konur; eşleşme var ama
   değer boşsa çıktı boş kalır (eski Excel davranışıyla aynı).

   Bu dosya app.js'ten SONRA yüklenir ve app.js'in global'lerini
   (state, sections, buildTakyidatTableText, ...) çağrı ANINDA kullanır.
   app.js'e dokunulan tek yer: createOutputExportPanel'e eklenen buton
   bloğu (bkz. handoff).
   ===================================================================== */
(function () {
  // --------------------------------------------------------------
  // Şablon kayıt defteri yalnızca kaynak koddan yönetilir.
  // bank: state.fields.bank değeriyle eşleşirse varsayılan seçilir.
  // --------------------------------------------------------------
  const TEMPLATE_REGISTRY = [
    { key: "akbank", file: "templates/akbank.html", title: "Akbank Rapor Formatı", bank: "Akbank T.A.Ş." },
    // Kullanıcı talebi (2026-08-03): "word formatını bozmamalıydın logolar
    // sayfa yapısı çerçeveler... word olarak tutabilirsin" — bu şablon HTML
    // DEĞİL, kullanıcının bize sunduğu gerçek .docx dosyası (format: "docx").
    // exportTemplate() bu bayrağı görünce sunucunun HTML-render API'sini
    // ATLAYIP /api/report-template-docx'ten ham baytları çeker ve
    // src/exports/docx-fill.js ile yerelde doldurur.
    { key: "emlakkatilim", file: "templates/emlakkatilim.docx", format: "docx", title: "Emlak Katılım Rapor Formatı", bank: "Emlak Katılım Bankası A.Ş." },
    { key: "halkbank", file: "templates/halkbank.html", title: "Halkbank Rapor Formatı", bank: "Türkiye Halk Bankası A.Ş." },
    { key: "isbankasi", file: "templates/isbankasi.html", title: "İş Bankası Rapor Formatı", bank: "Türkiye İş Bankası A.Ş." },
    { key: "isbankasi-masraf", file: "templates/isbankasi-masraf.html", title: "İş Bankası Masraf Yazısı", bank: "" },
    { key: "kuveytturk", file: "templates/kuveytturk.html", title: "Kuveyt Türk Rapor Formatı", bank: "Kuveyt Türk Katılım Bankası A.Ş." },
    { key: "vakifbank", file: "templates/vakifbank.html", title: "Vakıfbank Rapor Formatı", bank: "Türkiye Vakıflar Bankası T.A.O." },
    { key: "vakifkatilim", file: "templates/vakifkatilim.html", title: "Vakıf Katılım Rapor Formatı", bank: "Vakıf Katılım Bankası A.Ş." },
    { key: "yapikredi", file: "templates/yapikredi.html", title: "Yapı Kredi Rapor Formatı", bank: "Yapı ve Kredi Bankası A.Ş." },
    { key: "ziraat", file: "templates/ziraat.html", title: "Ziraat Bankası Rapor Formatı", bank: "T.C. Ziraat Bankası A.Ş." },
    // ownershipType (Mülkiyet) Arsa/Tarla ise otomatik olarak bu varyanta yönlendirilir
    // (bkz. resolveBankTemplateKeyForExport / appendBankTemplateExportBlock). Karışıklığı
    // önlemek için açılır listede AYRI bir seçenek olarak GÖSTERİLMEZ.
    { key: "ziraat-arsa-arazi", file: "templates/ziraat-arsa-arazi.html", title: "Ziraat Bankası Rapor Formatı (Arsa/Arazi)", bank: "T.C. Ziraat Bankası A.Ş.", variant: "arsa-arazi", hiddenFromList: true },
    { key: "ziraat-ek-tablo", file: "templates/ziraat-ek-tablo.html", title: "Ziraat Ek Tablo", bank: "" },
  ];

  // Türkçe katlama + noktalama temizleme: karşılaştırma anahtarı üretir.
  function foldTokenName(name) {
    return String(name || "")
      .replace(/İ/g, "I").replace(/ı/g, "i")
      .replace(/Ç/g, "C").replace(/ç/g, "c")
      .replace(/Ğ/g, "G").replace(/ğ/g, "g")
      .replace(/Ö/g, "O").replace(/ö/g, "o")
      .replace(/Ş/g, "S").replace(/ş/g, "s")
      .replace(/Ü/g, "U").replace(/ü/g, "u")
      .replace(/Â/g, "A").replace(/â/g, "a")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "");
  }

  function field(...keys) {
    for (const key of keys) {
      const value = String(state.fields?.[key] ?? "").trim();
      if (value) return value;
    }
    return "";
  }

  function dateField(...keys) {
    const value = field(...keys);
    if (!value) return "";
    return outputDate(value);
  }

  function outputDate(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    try {
      const formatted = dateIsoToTr(raw);
      return formatted || raw;
    } catch (error) {
      return raw;
    }
  }

  function moneyField(...keys) {
    const raw = field(...keys);
    if (!raw) return "";
    try {
      const numeric = parseValuationNumber(raw);
      if (Number.isFinite(numeric) && numeric > 0) return `${formatSchemeNumber(numeric)} TL`;
    } catch (error) { /* biçimlenemezse ham değer */ }
    return raw;
  }

  function safeCall(fnName, ...args) {
    try {
      const fn = globalThis[fnName];
      if (typeof fn === "function") return fn(...args) || "";
    } catch (error) {
      console.warn(`Şablon: ${fnName} çağrısı başarısız`, error);
    }
    return "";
  }

  async function fetchProtectedTemplateApi(url, options = {}) {
    const getIdToken = window.RaporCloudSync?.getIdToken;
    const idToken = typeof getIdToken === "function" ? await getIdToken() : null;
    if (!idToken) throw new Error("Rapor sablonu icin oturum dogrulamasi gerekli.");
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${idToken}`);
    headers.set("X-Rapor-Client", "1");
    return fetch(url, { ...options, headers, credentials: "same-origin" });
  }

  function firstTitleRowCell(cellKey) {
    const rows = Array.isArray(state.tables?.title) ? state.tables.title : [];
    const filled = rows.find((row) => Object.values(row || {}).some((v) => String(v || "").trim()));
    return String(filled?.[cellKey] || "").trim();
  }

  function ownersListText() {
    const rows = Array.isArray(state.tables?.title) ? state.tables.title : [];
    return rows
      .filter((row) => String(row?.c0 || "").trim())
      .map((row) => (row.c1 ? `${row.c0} (${row.c1})` : row.c0))
      .join(", ");
  }

  // {{HİSSE_PAYI}} — Emlak Katılım kapak tablosunda "Malik: {{SAHIPLER}}"
  // satırının hemen altında AYRI bir "Hisse Oranı" satırı — ownersListText()
  // isim+hisseyi BİRLEŞTİRİYOR ("Ali Veli (1/2)"), bu ise yalnızca hisse
  // oranlarını (malik tablosundaki c1 sütunu) virgülle birleştirir.
  function ownersShareListText() {
    const rows = Array.isArray(state.tables?.title) ? state.tables.title : [];
    return rows
      .filter((row) => String(row?.c0 || "").trim())
      .map((row) => row.c1 || "")
      .filter(Boolean)
      .join(", ");
  }

  // {{MALİK_BÜYÜK}}/{{MALİKLER_BÜYÜK}} — SAHIPLER'in aksine (isim+hisse
  // birleşik: "Ali Veli (1/2)"), yalnızca malik AD(LAR)ını döner — tablo
  // hücresinde tek başına büyük harfle kullanmaya uygun.
  function malikNamesText() {
    const rows = Array.isArray(state.tables?.title) ? state.tables.title : [];
    return rows.map((row) => String(row?.c0 || "").trim()).filter(Boolean).join(", ");
  }

  // Kullanıcı talebi (2026-08-05): "il, ilçe ... bölümleri ... tek
  // placeholder olarak tablolarda kullanılırken daima tamamı büyükharf
  // olarak export edilsin. ancak paragraflarda cümle içinde kullanımlarda
  // türkçe dilbilgisi kurallarına uygun olarak kullanılsın." — mevcut
  // {{CITY}}/{{TITLE_QUALITY}} vb. token'lar (paragraf/cümle içi kullanım
  // için) kullanıcının GİRDİĞİ biçimiyle (Baş Harf Büyük vb.) AYNEN kalır;
  // bu yardımcı, aynı değerin AYRI bir "_BÜYÜK" token ailesiyle (yalnızca
  // tablo hücrelerinde tek başına kullanılmak üzere) Türkçe kurallarına
  // uygun (İ/ı harfleri dahil) büyük harfe çevrilmiş halini üretir.
  function toTrUpper(value) {
    return String(value || "").toLocaleUpperCase("tr-TR");
  }

  function documentsTableHtml() {
    const entries = safeCall("getReviewedDocumentTableEntries", state.tables?.documents)
      || safeCall("getReviewedDocumentChronologicalEntries", state.tables?.documents);
    const rows = (Array.isArray(entries) ? entries.map((entry) => entry.row) : (Array.isArray(state.tables?.documents) ? state.tables.documents : []))
      .filter((row) => Object.values(row || {}).some((v) => String(v || "").trim()))
      .map((row) => [row.c0 || "", row.c1 || "", outputDate(row.c2), row.c3 || "", row.c4 || ""]);
    if (!rows.length) return safeCall("buildReviewedDocumentsDescription");
    return safeCall("buildReviewedDocumentsWordTableHtml")
      || safeCall("buildSimpleHtmlTable", ["Belge Türü", "İncelenen Kurum", "Tarih", "No", "Kapsam"], rows);
  }

  function halkbankValue(value, suffix = "") {
    const text = String(value || "").trim();
    return text ? `${text}${suffix}` : "";
  }

  function halkbankMoney(key) {
    return moneyField(key);
  }

  function halkbankValuationDetailsTableHtml() {
    const detailRows = [
      ["Değerleme Türü", field("propertyType", "ownershipType")],
      ["Arsa Birim m2 Değeri", halkbankMoney("landUnitValue")],
      ["Arsa Payı Değeri", halkbankMoney("landValue")],
      ["Arsa Alanı", halkbankValue(field("landArea"), " m2")],
      ["Yapı Yasal Alanı", halkbankValue(field("legalBuildingValueArea", "legalValueArea", "legalArea"), " m2")],
      ["Tamamlanmış Yapı Değeri (Yasal Alan)", halkbankMoney("legalBuildingValue")],
      ["Yapı Yasal Birim m2 Değeri", halkbankMoney("legalBuildingUnitCost")],
      ["Yapı Mevcut Alanı", halkbankValue(field("currentBuildingValueArea", "currentValueArea", "currentArea"), " m2")],
      ["Tamamlanmış Yapı Değeri (Mevcut Alan)", halkbankMoney("currentBuildingValue")],
      ["Yapı Mevcut Birim m2 Değeri", halkbankMoney("currentBuildingUnitCost")],
      ["Yapı Şerefiye ve Çevre Düzeltme Değeri (Yasal)", halkbankMoney("legalPremiumValue")],
      ["Yapı Şerefiye ve Çevre Düzeltme Değeri (Mevcut)", halkbankMoney("currentPremiumValue")],
      ["İnşaat Seviyesi", field("unitConstructionLevel", "legalBuildingConstructionLevel")],
      ["Aylık Kira", halkbankMoney("currentRent")],
      ["Aylık Kira Birim m2 Değeri", halkbankMoney("currentRentUnit")],
      ["Sigortaya Esas Birim m2 Değeri", halkbankMoney("insuranceUnitCost")],
      ["Sigortaya Esas Değer", halkbankMoney("insuranceValue")],
      ["Bilgi Amaçlı Değer", halkbankMoney("informationValue")],
      ["Bilgi Amaçlı Birim m2 Değeri", halkbankMoney("informationValueUnit")],
      ["Arsa Payı Değeri Sıfırlansın mı?", field("landValue") && parseValuationNumber(field("landValue")) === 0 ? "Evet" : "Hayır"],
      ["Eksperin Kanaati", field("saleability") || "Satılabilir"],
    ];
    const resultRows = [
      ["Taşınmazın Yasal Değeri", halkbankMoney("legalValue")],
      ["Taşınmazın Mevcut Değeri", halkbankMoney("currentValue")],
      ["Taşınmazın Birim m2 Değeri (Yasal)", halkbankMoney("legalValueUnit")],
      ["Taşınmazın Birim m2 Değeri (Mevcut)", halkbankMoney("currentValueUnit")],
    ];
    const detail = safeCall("buildSimpleHtmlTable", ["Değerleme Bilgisi", "Değer"], detailRows, "meta");
    const result = safeCall("buildSimpleHtmlTable", ["Taşınmazın Değeri", "Değer"], resultRows, "meta is-summary");
    return [detail, result].filter(Boolean).join('<div class="table-spacer">&nbsp;</div>');
  }

  function halkbankComparableListTableHtml() {
    const rows = Array.isArray(state.tables?.comparables) ? state.tables.comparables : [];
    const filled = rows.filter((row) => Object.values(row || {}).some((value) => String(value || "").trim()));
    if (!filled.length) return "";
    const bodyRows = filled.map((row) => {
      let metrics = {};
      try { metrics = calculateComparableMetrics(row) || {}; } catch (error) { metrics = {}; }
      const adjustments = [
        Number.isFinite(metrics.featureAdjustment) ? `Özellik ${formatComparableSummarySignedPercent(metrics.featureAdjustment)}` : "",
        Number.isFinite(metrics.locationAdjustment) ? `Konum ${formatComparableSummarySignedPercent(metrics.locationAdjustment)}` : "",
      ].filter(Boolean).join(" / ");
      return [
        row.c23 || row.c4 || "",
        row.c2 || "",
        row.c14 || "",
        row.c15 || "",
        row.c24 || "-",
        row.c13 || row.c12 || "-",
        Number.isFinite(metrics.unitValue) ? formatComparableSummaryNumber(metrics.unitValue, { decimals: 2 }) : "",
        adjustments,
        Number.isFinite(metrics.adjustedUnitValue) ? formatComparableSummaryNumber(metrics.adjustedUnitValue, { decimals: 2 }) : "",
      ];
    });
    return safeCall("buildSimpleHtmlTable", [
      "Niteliği", "Durum", "İstenen Fiyat", "Pazarlıklı Fiyat", "Arsa Alanı", "Yapı Alanı", "Birim Fiyat", "Düzeltmeler", "Düzeltilmiş Birim Fiyat",
    ], bodyRows, "is-summary", { compact: true });
  }

  function halkbankComparableRangeText() {
    const rows = Array.isArray(state.tables?.comparables) ? state.tables.comparables : [];
    const metrics = rows.map((row) => {
      try { return calculateComparableMetrics(row) || {}; } catch (error) { return {}; }
    });
    const unitValues = metrics.map((item) => item.adjustedUnitValue).filter(Number.isFinite);
    const saleValues = metrics.map((item) => item.saleValue).filter(Number.isFinite);
    if (!unitValues.length && !saleValues.length) return "";
    const lines = [];
    if (unitValues.length) {
      lines.push(`Emsal aralığı (birim fiyat): ${formatComparableSummaryNumber(Math.min(...unitValues), { decimals: 2 })} TL - ${formatComparableSummaryNumber(Math.max(...unitValues), { decimals: 2 })} TL`);
    }
    if (saleValues.length) {
      lines.push(`Emsal aralığı (pazarlıklı fiyat): ${formatComparableSummaryMoney(Math.min(...saleValues))} TL - ${formatComparableSummaryMoney(Math.max(...saleValues))} TL`);
    }
    return textParagraphsHtml(lines.join("\n"));
  }

  function firstPermitDocParts() {
    const rows = Array.isArray(state.tables?.documents) ? state.tables.documents : [];
    const hit = rows.find((row) => /ruhsat|kullanma|iskan|yap[ıi] kay[ıi]t/i.test(String(row?.c0 || "")));
    return { type: String(hit?.c0 || "").trim(), date: outputDate(hit?.c2), no: String(hit?.c3 || "").trim() };
  }

  function occupancyPermitDate() {
    const completion = safeCall("calculateBuildingCompletionFromReviewedDocuments");
    if (completion?.source === "occupancy" && completion.displayDate) {
      return completion.displayDate;
    }
    const rows = Array.isArray(state.tables?.documents) ? state.tables.documents : [];
    const hit = rows.find((row) => /kullanma\s*[iİ]zin|iskan/i.test(String(row?.c0 || row?.type || "")));
    return outputDate(hit?.c2 || hit?.date || hit?.documentDate);
  }

  function ekbStatusText() {
    const value = field("hasEkb").toLocaleLowerCase("tr-TR");
    if (value === "evet") return "VAR";
    if (value === "hayır" || value === "hayir") return "YOK";
    return "";
  }

  function planTypeText() {
    const scale = field("planScale").replace(/\s/g, "");
    if (scale === "1/1000" || scale === "1/1.000") return "Uygulama İmar Planı";
    if (scale === "1/5000" || scale === "1/5.000") return "Nazım İmar Planı";
    if (["1/25000", "1/25.000", "1/100000", "1/100.000"].includes(scale)) return "Çevre Düzeni Planı";
    return "";
  }

  function socialFacilityStatus(name) {
    const expected = foldTokenName(name);
    const values = field("socialFacilities")
      .split(/[,;|]/)
      .map((value) => foldTokenName(value))
      .filter(Boolean);
    return values.includes(expected) ? "Evet" : "Hayır";
  }

  function comparableLineText(index) {
    try {
      const rows = getComparableValuationRows();
      const row = rows[index];
      if (!row) return "";
      const parts = [`Emsal ${index + 1}:`];
      if (row.area) parts.push(`${formatComparableSummaryNumber(row.area, { decimals: 2 })} m² alanlı,`);
      if (row.askingPrice) parts.push(`${formatComparableSummaryMoney(row.askingPrice)} talep edilen,`);
      if (row.saleValue) parts.push(`pazarlıklı değeri ${formatComparableSummaryMoney(row.saleValue)},`);
      if (row.adjustedUnitValue) parts.push(`indirgenmiş m² birim değeri ${formatComparableSummaryNumber(row.adjustedUnitValue, { decimals: 2 })} TL/m² olan taşınmaz.`);
      const matrixRows = getComparableRows();
      const distance = safeCall("getComparableDistanceTextForWord", matrixRows[index] || {});
      if (distance) parts.push(`(${distance})`);
      return parts.join(" ").replace(/,\s*$/, ".");
    } catch (error) {
      return "";
    }
  }

  function textParagraphsHtml(text, className = "") {
    const value = String(text || "").replace(/m²/gi, "m2").trim();
    if (!value) return "";
    try {
      return formatWordParagraphs(value, className);
    } catch (error) {
      return escapeHtml(value).replace(/\n/g, "<br />");
    }
  }

  let reportImageAssetsCache = [];

  function reportImageHtml(key, scale = 1) {
    const asset = reportImageAssetsCache.find((item) => item?.key === key);
    if (!asset?.location) return "";
    const title = escapeHtmlSafe(asset.title || "Rapor görseli");
    const width = Math.round(480 * scale);
    const height = Math.round(270 * scale);
    return `<div style="margin:8pt 0 14pt;text-align:center;page-break-inside:avoid;">
      <img src="${escapeHtmlSafe(asset.location)}" width="640" height="360" style="width:${width}pt;height:${height}pt;border:1pt solid #94a3b8;" alt="${title}">
    </div>`;
  }

  function reportMapsSectionHtml() {
    return `${reportMapSectionHtml("location", "Konu Taşınmaz Konum Haritası", "h2")}${reportMapSectionHtml("comparables", "Emsal Konum Krokisi", "h3")}`;
  }

  function reportMapSectionHtml(key, title, headingTag) {
    const image = reportImageHtml(key, key === "location" ? 0.7 : 1);
    if (!image) return "";
    const tag = headingTag === "h2" ? "h2" : "h3";
    return `<div class="pg-section report-maps-section">
      <div class="report-map-figure" style="page-break-inside:avoid;break-inside:avoid;">
        <${tag} style="page-break-after:avoid;break-after:avoid;">${title}</${tag}>
        ${image}
      </div>
    </div>`;
  }

  function unitInteriorPlusDecorative() {
    return [safeCall("composeUnitInteriorDescription"), safeCall("composeUnitDecorativeDescription")]
      .filter(Boolean)
      .join("\n\n");
  }

  // --------------------------------------------------------------
  // ESKİ EXCEL ADLARI (ve yenileri) → çözümleyici tanımları.
  //   f: alan(lar)   d: tarih alanı   m: para alanı
  //   t: metin üretici (paragraf HTML olur)   h: HTML üretici (tablo)
  //   fn: özel fonksiyon (string döner; HTML dönecekse html:true)
  // --------------------------------------------------------------
  const LEGACY_ALIASES = {
    // --- Dosya / genel ---
    BANKA: { f: ["bank"] },
    MUSTERI: { f: ["customerName"] },
    ISBANKMUSTERI: { f: ["customerName"] },
    ISADI: { f: ["caseName"] },
    RANDEVUTARIHI: { d: ["appointmentDate"] },
    // Program alan token'larının tarih/para biçimli halleri: alan indeksi ham
    // değer döndürür; bu takma adlar öncelikli olduğundan biçimli çıktı verir.
    APPOINTMENTDATE: { d: ["appointmentDate"] },
    MUNICIPALITYINSPECTIONDATE: { d: ["municipalityInspectionDate"] },
    PLANDATE: { d: ["planDate"] },
    TAKBISDATE: { d: ["takbisDate"] },
    PROJECTDATE: { d: ["projectDate"] },
    TITLEPROJECTDATE: { d: ["titleProjectDate"] },
    MUNICIPALITYPROJECTDATE: { d: ["municipalityProjectDate"] },
    EKBISSUEDATE: { d: ["ekbIssueDate"] },
    EKBVALIDUNTIL: { d: ["ekbValidUntil"] },
    LEGALVALUE: { m: ["legalValue"] },
    CURRENTVALUE: { m: ["currentValue"] },
    CURRENTRENT: { m: ["currentRent"] },
    LEGALRENT: { m: ["legalRent"] },
    UNITCONSTRUCTIONLEVEL: { f: ["unitConstructionLevel"], fallback: "Tamamlanmış (%100)" },
    RAPORTARIHI: { fn: () => dateIsoToTr(new Date().toISOString().slice(0, 10)) || "" },
    MULKIYET: { f: ["ownershipType"] },

    // --- Adres / konum ---
    SEHIR: { f: ["city", "titleCity"] },
    IL: { f: ["city", "titleCity"] },
    ILCE: { f: ["district", "titleDistrict"] },
    MAHALLE: { f: ["titleNeighborhood", "neighborhood"] },
    IDARIMAHALLE: { f: ["neighborhood", "titleNeighborhood"] },
    SOKAK: { f: ["street"] },
    ADRESAPTSITE: { f: ["addressSiteName"] },
    BINASITE: { f: ["addressSiteName"] },
    BINABLOK: { f: ["addressBlockName", "titleBlockName"] },
    BLOKADI: { f: ["titleBlockName", "addressBlockName"] },
    DISKAPINO: { f: ["outerDoor"] },
    BBNO: { f: ["unitNo", "innerDoor"] },
    ICKAPINO: { f: ["innerDoor", "unitNo"] },
    INNERDOOR: { f: ["innerDoor"] },
    KAT1: { f: ["addressFloor", "titleFloor"] },
    KAT2: { f: ["titleFloor", "addressFloor"] },
    TAPUKAT: { f: ["titleFloor"] },
    UAVT: { f: ["uavt"] },
    POSTAKODU: { f: ["postalCode"] },
    ENLEM: { f: ["latitude"] },
    BOYLAM: { f: ["longitude"] },
    // Ziraat sistemi koordinatların ondalık ayıracını virgül ister.
    // V2 tokenları kaynak alanları değiştirmez; yalnızca şablon çıktısını dönüştürür.
    ENLEMV2: { fn: () => field("latitude").replace(/\./g, ",") },
    BOYLAMV2: { fn: () => field("longitude").replace(/\./g, ",") },
    MEVKII: { f: ["locationName"] },
    ADRES2025: { fn: () => safeCall("buildOpenAddressText") },
    ACIKADRES: { fn: () => safeCall("buildOpenAddressText") },
    LOCATIONMAPIMAGE: { h: () => reportImageHtml("location") },
    KONUMHARITASI: { h: () => reportImageHtml("location") },
    COMPARABLESKETCHIMAGE: { h: () => reportImageHtml("comparables") },
    EMSALKROKISI: { h: () => reportImageHtml("comparables") },
    LOCATIONMAPSECTION: { h: () => reportMapSectionHtml("location", "Konu Taşınmaz Konum Haritası", "h2") },
    COMPARABLESKETCHSECTION: { h: () => reportMapSectionHtml("comparables", "Emsal Konum Krokisi", "h3") },
    REPORTMAPSSECTION: { h: reportMapsSectionHtml },
    RAPORKROKILERI: { h: reportMapsSectionHtml },

    // --- Çevre / bölge ---
    ULASIMTARIFI: { t: () => field("transport") },
    YAKINCEVRESI: { f: ["nearby"] },
    ULASIMANAARTERI: { f: ["mainArtery"] },
    ALTYAPI: { f: ["infrastructureLevel"] },
    YAPILASMA: { f: ["developmentDensity"] },
    CEVRESELGELISMEHIZI: { f: ["developmentSpeed"] },
    SOSYALIHTIYAC: { f: ["socialNeeds"] },
    BOLGEGELIRSEVIYESI: { f: ["regionIncomeLevel"] },
    BOLGEYAPKULAMACI: { f: ["regionUsePurpose"] },
    BOLGEYAPKATADEDI: { f: ["regionFloorRange"] },
    BOLGEYAPIYASI: { f: ["regionBuildingAge"] },
    PLANCILIK: { f: ["planningPrincipleHarmony"] },
    YAPINIZAM: { f: ["regionBuildOrder"] },
    CEVREMETNI: { t: () => field("environmentDescription") || safeCall("buildEnvironmentalDescription") },

    // --- Tapu ---
    ZEMINTIPI: { f: ["groundType", "titleOwnershipKind"] },
    ANATASINMAZNITELIK: { f: ["mainPropertyQuality"] },
    TAPUNITELIKBB: { f: ["titleQuality"] },
    FIILIBBTURU: { f: ["actualUsePurpose", "propertyType", "currentUsageNature"] },
    BBTURU: { f: ["propertyType", "titleQuality"] },
    BBYASALFIILITUR: { fn: () => (field("usageNatureDifference") === "Evet" ? "HAYIR" : "EVET") },
    ADA: { f: ["blockNo"] },
    PARSEL: { f: ["parcelNo"] },
    PAFTA: { f: ["sheetNo"] },
    ESKIADA: { f: ["oldBlockNo"] },
    ESKIPARSEL: { f: ["oldParcelNo"] },
    YUZOLCUMU: { f: ["landArea"] },
    ARSAPAY: { f: ["share"] },
    PAYDA: { f: ["denominator"] },
    CILT: { fn: () => [field("registryVolume"), field("registryPage")].filter(Boolean).join(" / ") },
    TASINMAZID: { f: ["titlePropertyId"] },
    TAPUKAYIT: { f: ["titleRecordChange"] },
    TAPUKAYITNOTU: { f: ["titleRecordChangeNote", "titleRecordChangeExplanation"] },
    TAPUTARIH: { fn: () => dateField("titleDate") || outputDate(firstTitleRowCell("c3")) },
    TAPUTARIHI: { fn: () => dateField("titleDate") || outputDate(firstTitleRowCell("c3")) }, // {{TAPU_TARİHİ}}
    TAPUYEVMIYE: { fn: () => firstTitleRowCell("c4") },
    TAPUYEVMIYESI: { fn: () => firstTitleRowCell("c4") }, // {{TAPU_YEVMİYESİ}}
    EDINME: { fn: () => firstTitleRowCell("c2") },
    EDINMESEBEBI: { fn: () => firstTitleRowCell("c2") }, // {{EDİNME_SEBEBİ}}
    SAHIPLER: { fn: ownersListText },
    HISSEPAYI: { fn: ownersShareListText }, // {{HİSSE_PAYI}}
    HISSELIMI: { fn: () => safeCall("gabimHasShareText") },

    // --- "_BÜYÜK" (büyük harf) aile: kullanıcı talebi (2026-08-05) —
    // "il, ilçe İdari Mahalle Site/Apartman Blok Kat Dış Kapı No Cadde/
    // Sokak ... il ilçe tapu mahalle mevkii pafta bağımsız bölüm niteliği
    // blok tapu katı ana taşınmaz niteliği eklenti, malik yada malikler
    // edinme sebebi ... tek placeholder olarak tablolarda kullanılırken
    // daima tamamı büyükharf olarak export edilsin. ancak paragraflarda
    // cümle içinde kullanımlarda türkçe dilbilgisi kurallarına uygun
    // olarak kullanılsın." — mevcut {{CITY}}/{{TAPU_NITELIK_BB}} vb.
    // token'lar (cümle içi kullanım için) kullanıcının girdiği biçimiyle
    // AYNEN kalır; bu AYRI "_BÜYÜK" aile SADECE tablo hücrelerinde tek
    // başına kullanılmak üzere, aynı veriyi Türkçe büyük harfe (İ/ı dahil)
    // çevirir. Adres ve Tapu bölümlerindeki "İl/İlçe/Blok" gibi AYNI
    // isimli ama FARKLI alanlar (city vs titleCity, addressBlockName vs
    // titleBlockName) kasıtlı olarak AYRI token'lar — birbirine fallback
    // YAPILMAZ, kullanıcı hangi bölümün değerini istiyorsa onu alır.
    CITY_BUYUK: { fn: () => toTrUpper(field("city")) },
    DISTRICT_BUYUK: { fn: () => toTrUpper(field("district")) },
    NEIGHBORHOOD_BUYUK: { fn: () => toTrUpper(field("neighborhood")) },
    ADDRESS_SITE_NAME_BUYUK: { fn: () => toTrUpper(field("addressSiteName")) },
    ADDRESS_BLOCK_NAME_BUYUK: { fn: () => toTrUpper(field("addressBlockName")) },
    ADDRESS_FLOOR_BUYUK: { fn: () => toTrUpper(field("addressFloor")) },
    OUTER_DOOR_BUYUK: { fn: () => toTrUpper(field("outerDoor")) },
    STREET_BUYUK: { fn: () => toTrUpper(field("street")) },
    TITLE_CITY_BUYUK: { fn: () => toTrUpper(field("titleCity")) },
    TITLE_DISTRICT_BUYUK: { fn: () => toTrUpper(field("titleDistrict")) },
    TITLE_NEIGHBORHOOD_BUYUK: { fn: () => toTrUpper(field("titleNeighborhood")) },
    LOCATION_NAME_BUYUK: { fn: () => toTrUpper(field("locationName")) }, // {{MEVKİİ_BÜYÜK}}
    SHEET_NO_BUYUK: { fn: () => toTrUpper(field("sheetNo")) }, // {{PAFTA_BÜYÜK}}
    TITLE_QUALITY_BUYUK: { fn: () => toTrUpper(field("titleQuality")) }, // {{BAĞIMSIZ_BÖLÜM_NİTELİĞİ_BÜYÜK}}
    TITLE_BLOCK_NAME_BUYUK: { fn: () => toTrUpper(field("titleBlockName")) },
    TITLE_FLOOR_BUYUK: { fn: () => toTrUpper(field("titleFloor")) }, // {{TAPU_KATI_BÜYÜK}}
    MAIN_PROPERTY_QUALITY_BUYUK: { fn: () => toTrUpper(field("mainPropertyQuality")) }, // {{ANA_TAŞINMAZ_NİTELİĞİ_BÜYÜK}}
    TITLE_ATTACHMENT_BUYUK: { fn: () => toTrUpper(field("titleAttachment")) }, // {{EKLENTİ_BÜYÜK}}
    MALIK_BUYUK: { fn: () => toTrUpper(malikNamesText()) },
    MALIKLER_BUYUK: { fn: () => toTrUpper(malikNamesText()) },
    // emlakkatilim.docx'in kapak tablosundaki "Malik" hücresi mevcut
    // {{SAHIPLER}} (isim+hisse birleşik, ör. "Ali Veli (1/2)") kullanıyor —
    // tablo kuralı için AYNI verinin büyük harfli hali.
    SAHIPLER_BUYUK: { fn: () => toTrUpper(ownersListText()) },
    EDINME_SEBEBI_BUYUK: { fn: () => toTrUpper(firstTitleRowCell("c2")) },

    // --- "_DÜZGÜN" (cümle içi kullanıma uygun) aile — Tapu ve Mülkiyet
    // bölümündeki metin alanları (titleQuality, titleBlockName, ...)
    // GİRİŞ ANINDA zaten tamamı büyük harfe zorlanıp öyle saklanıyor
    // (bkz. app.js "titleTextUppercaseKeys" — form görünümü/kopyala-
    // yapıştır için). Yani bu 10 alanın DÜZ token'ı (ör. {{TITLE_QUALITY}},
    // {{TAPU_NITELIK_BB}}) ZATEN tablo kullanımı için doğru (büyük harf) —
    // yukarıdaki "_BÜYÜK" ekleri bu yüzden bu alanlarda teknik olarak
    // gereksiz (zaten büyük harf) ama Adres bölümüyle aynı adlandırma
    // tutarlılığı için eklendi. Asıl eksik olan, kullanıcının belirttiği
    // "paragraflarda cümle içinde ... türkçe dilbilgisi kurallarına uygun"
    // gereksinimi: düz token doğrudan bir cümlede kullanılırsa "MESKEN"
    // gibi haykırarak çıkardı. Bu "_DÜZGÜN" ailesi app.js'in KENDİ anlatı
    // cümlelerinin de kullandığı normalizeReportTitleText (Baş Harfleri
    // Büyük Türkçe başlık biçimi) ile düzeltilmiş halini döner.
    TITLE_CITY_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleCity")) },
    TITLE_DISTRICT_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleDistrict")) },
    TITLE_NEIGHBORHOOD_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleNeighborhood")) },
    LOCATION_NAME_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("locationName")) },
    SHEET_NO_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("sheetNo")) },
    TITLE_QUALITY_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleQuality")) },
    TITLE_BLOCK_NAME_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleBlockName")) },
    TITLE_FLOOR_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleFloor")) },
    MAIN_PROPERTY_QUALITY_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("mainPropertyQuality")) },
    TITLE_ATTACHMENT_DUZGUN: { fn: () => safeCall("normalizeReportTitleText", field("titleAttachment")) },
    MALIKLERTABLO: { h: () => safeCall("buildMaliklerTableWordHtml") },
    GABIMVERISETI: { h: () => safeCall("buildGabimDataSetWordHtml") },
    HISSEACIKLAMASI: { t: () => field("shareExplanation"), paragraphClass: "share-explanation" },
    EKLENTI: { f: ["titleAttachment"] },

    // --- Takyidat ---
    TAKYIDATTARIH: { d: ["takbisDate"] },
    TAKYIDATSAAT: { f: ["takbisTime"] },
    TAKYIDAT2025: { t: () => safeCall("buildEncumbranceSummary") || field("takbisSummary"), paragraphClass: "encumbrance-summary" },
    TAKYIDATISBANK: { t: () => safeCall("buildEncumbranceSummary") || field("takbisSummary"), paragraphClass: "encumbrance-summary" },
    ISBANKENCUMBRANCEEXPLANATION: { t: () => safeCall("buildIsbankEncumbranceExplanation") },
    TAKYIDATTABLO: { h: () => safeCall("buildTakyidatWordTableHtml") || safeCall("formatTextTableForWord", safeCall("buildTakyidatTableText")) },
    // `{{ENCUMBRANCE_SUMMARY_TEXT}}` (PLACEHOLDER-REHBERI.md'de belgeli,
    // 7 banka şablonunda kullanılıyor) hiçbir yerde kayıtlı DEĞİLDİ — ne app
    // alan anahtarı ("encumbranceSummaryText" yok) ne de bir alias olarak;
    // şablonlarda sarı "⚠ AD" gösteriyordu. Gerçek alan `takbisSummary`
    // ("Takyidat açıklaması") — TAKBISSUMMARY adıyla zaten çözümleniyor,
    // burada eski adı da aynı değere bağlıyoruz.
    TAKBISSUMMARY: { t: () => safeCall("buildEncumbranceSummary") || field("takbisSummary"), paragraphClass: "encumbrance-summary" },
    ENCUMBRANCESUMMARYTEXT: { t: () => safeCall("buildEncumbranceSummary") || field("takbisSummary"), paragraphClass: "encumbrance-summary" },

    // Kullanıcı talebi: "03.08.2026 tarihinde saat 17:32 Webtapu Sistemi
    // üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde
    // aşağıdaki takyidatlar bulunmaktadır. ... bu açıklama bölümünü de ayrı
    // bir placeholder olarak ekleyelim" — ENCUMBRANCESUMMARYTEXT'in (ve
    // Beyanlar/Rehinler/Şerhler/Hak-Mükellefiyetler bölümlerinin) İLK
    // CÜMLESİ, tek başına.
    TAKYIDATACIKLAMAGIRISCUMLESI: { t: () => safeCall("getEncumbranceIntroSentenceForPlaceholder") },

    // Kullanıcı talebi: "takyidatlar bölümünde beyanlar bölümü rehinler
    // bölümü şerhler bölümü hak ve mükellefiyetler bölümü olarak her bir
    // bölüme placeholder oluştur." — ENCUMBRANCESUMMARYTEXT'in tek parça
    // özetinden farklı olarak, bu dördü şablonda AYRI hücre/satırlara
    // yerleştirilebilsin diye tek tek bölüm metnini döner.
    BEYANLARBOLUMU: { t: () => safeCall("getEncumbranceDeclarationsSectionText"), paragraphClass: "encumbrance-summary" },
    HAKVEMUKELLEFIYETLERBOLUMU: { t: () => safeCall("getEncumbranceEasementsSectionText"), paragraphClass: "encumbrance-summary" },
    REHINLERBOLUMU: { t: () => safeCall("getEncumbranceMortgagesSectionText"), paragraphClass: "encumbrance-summary" },
    SERHLERBOLUMU: { t: () => safeCall("getEncumbranceAnnotationsSectionText"), paragraphClass: "encumbrance-summary" },

    // --- İmar ---
    IMARPLANADI: { f: ["planName"] },
    PLANOLCEGI: { f: ["planScale"] },
    PLANTYPE: { fn: planTypeText },
    IMARTARIHI: { d: ["planDate"] },
    IMARLEJANT: { f: ["legend"] },
    IMARNIZAM: { f: ["order"] },
    TAKS: { f: ["taks"] },
    KAKS: { f: ["kaks"] },
    HMAX: { f: ["hmax"] },
    HESAPLANANEMSAL: { f: ["calculatedEmsal"] },
    ONBAHCE: { f: ["frontGarden"] },
    YANBAHCE: { f: ["sideGarden"] },
    TEVHIDSARTI: { f: ["tevhidCondition"] },
    MINIMUMCEPHESARTI: { f: ["minimumFrontageCondition"] },
    YOLATERKVARMI: { f: ["roadSetback"] },
    ROADSETBACKAMOUNT: { fn: () => safeCall("getRoadSetbackAmount") },
    YOLATERKMIKTARI: { fn: () => safeCall("getRoadSetbackAmount") },
    POSTROADSETBACKPARCELAREA: { fn: () => safeCall("getPostRoadSetbackParcelArea") },
    TERKSONRASIPARSELALANI: { fn: () => safeCall("getPostRoadSetbackParcelArea") },
    KATADEDI: { f: ["floorCount"] },
    IMARDURUMUKISA: { t: () => field("planningNote") || safeCall("buildImarPlanningNote") },
    IMARDURUMU2025: { t: () => field("planningNote") || safeCall("buildImarPlanningNote") },
    IMARKENTSELDONUSUM: { f: ["urbanTransformationArea"] },
    IMARYAPILASMAENGELI: { f: ["licenseObstacle"] },
    ONSEKIZPROBLEM: { f: ["article18Applied"] },
    KENTSELDONUSUM: { fn: () => safeCall("gabimUrbanTransformationText") || field("urbanTransformationArea") },
    IMARBILGIKURUM: { f: ["imarInfoInstitution"] },

    // --- Belgeler / proje ---
    INCELEMELER: { h: documentsTableHtml },
    INCELENENBELGELERTABLO: { h: documentsTableHtml }, // {{İNCELENEN_BELGELER_TABLO}}
    RUHSATVEISKANLAR2025: { t: () => field("reviewedDocumentsDescription") || safeCall("buildReviewedDocumentsDescription") },
    CEZAI2025: { t: () => field("penaltyDecisionExplanation") || safeCall("buildPenaltyDecisionExplanation") },
    CEZAINOTU: { t: () => field("penaltyDecisionExplanation") || safeCall("buildPenaltyDecisionExplanation") },
    STATIK2025SON: { t: () => field("staticSuitabilityExplanation") || safeCall("buildStaticSuitabilityExplanation") },
    YAPIDENETIMACIKLAMA: { t: () => field("buildingInspectionExplanation") || safeCall("buildBuildingInspectionExplanation") },
    PROJEYEUYGUNLUK2025: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    PROJECTREVIEWDESCRIPTION: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    REVIEWEDDOCUMENTSDESCRIPTION: { t: () => field("reviewedDocumentsDescription") || safeCall("buildReviewedDocumentsDescription") },
    BUILDINGINSPECTIONEXPLANATIONTEXT: { t: () => field("buildingInspectionExplanation") || safeCall("buildBuildingInspectionExplanation") },
    BUILDINGINSPECTIONTERMINATIONEXPLANATIONTEXT: { t: () => safeCall("buildBuildingInspectionTerminationExplanation") },
    PENALTYDECISIONEXPLANATION: { t: () => field("penaltyDecisionExplanation") || safeCall("buildPenaltyDecisionExplanation") },
    PROJEYEUYGUNMU2025: { f: ["projectDifference", "mainRealEstateProjectSuitable"] },
    MIMARIUYGUNLUK: { f: ["mainRealEstateProjectSuitable", "projectDifference"] },
    ANAGAYRUYG: { f: ["mainRealEstateProjectSuitable"] },
    ANAGAYRNOTU: { f: ["mainRealEstateProjectSuitabilityNote"] },
    PROJEKURUM2025: { f: ["projectInstitution", "documentReviewInstitution"] },
    ISKANVARMI: { fn: () => safeCall("gabimOccupancyPermitText") },
    // Kullanıcı talebi: "Yapı kullanma izin belgesi var mı placeholder
    // ekleyelim. incelenen belgelerde yapı kullanma izin belgesi eklendi
    // ise Var eklenmedi ise Yok" — ISKANVARMI ile AYNI kaynak (gabimOccupancyPermitText),
    // yalnızca daha açık isimli bir alias.
    YAPIKULLANMAIZINBELGESIVARMI: { fn: () => safeCall("gabimOccupancyPermitText") },
    OCCUPANCYPERMITDATE: { fn: occupancyPermitDate },
    MUNICIPALITYBOUNDARYSTATUS: { fn: () => field("district", "titleDistrict") ? "Evet" : "" },
    DOCUMENTREVIEWINSTITUTION: { f: ["documentReviewInstitution", "projectInstitution"] },
    EKBSTATUS: { fn: ekbStatusText },

    // --- Halkbank "Ruhsat Özellikleri ve Dosya İncelemeleri" (bankanın kendi
    // sistemindeki ~21 alanla eşleşecek şekilde genişletildi, kullanıcı
    // talebi: "bizde sadece 3 satır veri var bunu düzeltelim") ---
    RUHSATVARMI: { fn: () => safeCall("getReviewedBuildingPermitAvailabilityText") },
    RUHSATIPTALIVARMI: { t: () => "Yok" },
    TADILATRUHSATTARIHI: { fn: () => safeCall("getLatestRenovationPermitDateText") },
    KATIRTIFAKIPROJEINCELENDIMI: { fn: () => safeCall("getKatIrtifakiProjectReviewedText") },
    YERINDEOLCUMYAPILDIMI: { fn: () => (field("appointmentType") === "İçi görülmüştür" ? "Evet" : "Hayır") },
    KIRASOZLESMESIVARMI: { fn: () => safeCall("getUnitLeaseAgreementStatusText") },
    KONUTASINMAZALANUYGUNMU: { fn: () => safeCall("getUnitProjectSuitabilityAreaMatchText") },
    KONUTASINMAZKONUMUYGUNMU: { fn: () => safeCall("getUnitProjectSuitabilityLocationMatchText") },
    FIILENKULLANILIYORMU: { fn: () => safeCall("getUnitActivelyUsedStatusText") },
    YASALEKLENTIDEPOVARMI: { fn: () => (field("titleAttachment") ? "Evet" : "Hayır") },
    RISKLIYAPIMI: { t: () => "Hayır" },

    // --- Emlak Katılım "5.5. Kira Kabiliyeti" ---
    DAIREICINDEKIRACI: { fn: () => safeCall("getUnitTenantPresenceText") },
    KIRACININKONTRATI: { fn: () => safeCall("getUnitTenantContractStatusText") },

    // --- Emlak Katılım "4. Taşınmazın Konum Krokisi Ve Emsal Taşınmazlar"
    // (Word belgesindeki SABİT 3 emsal kartı — dinamik satır çoğaltma değil,
    // emsal listesinden 0/1/2. index doğrudan bu kartlara eşlenir) ---
    EMSAL1ILGILIKISIVETEL: { fn: () => safeCall("getComparableCard1ContactText") },
    EMSAL1ACIKLAMASI: { fn: () => safeCall("getComparableCard1DescriptionText") },
    EMSAL1INDIRGENMISKULLANIMALANI: { fn: () => safeCall("getComparableCard1AreaText") },
    EMSAL1INDIRGENMISSATISFIYATI: { fn: () => safeCall("getComparableCard1SaleValueText") },
    EMSAL1INDIRGENMISBIRIMFIYAT: { fn: () => safeCall("getComparableCard1UnitValueText") },
    EMSAL2ILGILIKISIVETEL: { fn: () => safeCall("getComparableCard2ContactText") },
    EMSAL2ACIKLAMASI: { fn: () => safeCall("getComparableCard2DescriptionText") },
    EMSAL2INDIRGENMISKULLANIMALANI: { fn: () => safeCall("getComparableCard2AreaText") },
    EMSAL2INDIRGENMISSATISFIYATI: { fn: () => safeCall("getComparableCard2SaleValueText") },
    EMSAL2INDIRGENMISBIRIMFIYAT: { fn: () => safeCall("getComparableCard2UnitValueText") },
    EMSAL3ILGILIKISIVETEL: { fn: () => safeCall("getComparableCard3ContactText") },
    EMSAL3ACIKLAMASI: { fn: () => safeCall("getComparableCard3DescriptionText") },
    EMSAL3INDIRGENMISKULLANIMALANI: { fn: () => safeCall("getComparableCard3AreaText") },
    EMSAL3INDIRGENMISSATISFIYATI: { fn: () => safeCall("getComparableCard3SaleValueText") },
    EMSAL3INDIRGENMISBIRIMFIYAT: { fn: () => safeCall("getComparableCard3UnitValueText") },
    // Kullanıcı talebi: irtibat kişisi/telefon + açıklama TEK metinde
    // birleşik ({{EMSAL_1_EMSAL_METNİ}}) ve irtibat bilgisi OLMADAN sadece
    // açıklama ({{EMSAL_1_ACIKLAMA_METNI}}, EMSAL1ACIKLAMASI ile aynı veri).
    EMSAL1EMSALMETNI: { fn: () => safeCall("getComparableCard1FullText") },
    EMSAL1ACIKLAMAMETNI: { fn: () => safeCall("getComparableCard1DescriptionText") },
    EMSAL2EMSALMETNI: { fn: () => safeCall("getComparableCard2FullText") },
    EMSAL2ACIKLAMAMETNI: { fn: () => safeCall("getComparableCard2DescriptionText") },
    EMSAL3EMSALMETNI: { fn: () => safeCall("getComparableCard3FullText") },
    EMSAL3ACIKLAMAMETNI: { fn: () => safeCall("getComparableCard3DescriptionText") },
    // Kullanıcı şablona 4. bir emsal kartı da eklemiş (getComparablePlaceholderValue
    // zaten 1-7 index destekliyor) — getComparableCardFullText/DescriptionText
    // index parametresi aldığından 4. kart için ayrı sarmalayıcıya gerek yok.
    EMSAL4EMSALMETNI: { fn: () => safeCall("getComparableCardFullText", 3) },
    EMSAL4ACIKLAMAMETNI: { fn: () => safeCall("getComparableCardDescriptionText", 3) },
    EMSAL4ACIKLAMASI: { fn: () => safeCall("getComparableCardDescriptionText", 3) },
    EMSAL4ILGILIKISIVETEL: { fn: () => safeCall("getComparableCardContactText", 3) },
    EMSAL4INDIRGENMISKULLANIMALANI: { fn: () => safeCall("getComparableCardAreaText", 3) },
    EMSAL4INDIRGENMISSATISFIYATI: { fn: () => safeCall("getComparableCardSaleValueText", 3) },
    EMSAL4INDIRGENMISBIRIMFIYAT: { fn: () => safeCall("getComparableCardUnitValueText", 3) },
    ISBANKMIMARIPROJE: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    UYGACIKLAMA: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    VAKIFMIMARIPROJE: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    KONUMTEYIDI: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    EKBSINIF: { f: ["ekbEnergyClass"] },
    EKBBELGENO: { f: ["ekbDocumentNo"] },
    EKBVERILIS: { d: ["ekbIssueDate"] },
    EKBSON: { d: ["ekbValidUntil"] },
    EKBACIKLAMA: { t: () => field("ekbExplanation") || safeCall("buildEkbExplanation") },
    OPENPOOL: { fn: () => socialFacilityStatus("Açık Yüzme Havuzu") },
    CLOSEDPOOL: { fn: () => socialFacilityStatus("Kapalı Yüzme Havuzu") },

    // --- Ziraat GABIM ekran değerleri ---
    GABIMCALCULATEDEMSAL: { fn: () => safeCall("gabimCalculatedEmsalText") },
    GABIMTRANSPORTATION: { fn: () => safeCall("gabimTransportationLevelText") },
    GABIMMAJORINVESTMENT: { fn: () => safeCall("gabimMajorInvestmentProjectText") },
    GABIMBRANDEDHOUSING: { fn: () => safeCall("gabimBrandedHousingDensityText") },
    GABIMDEVELOPMENTSPEED: { fn: () => safeCall("gabimDevelopmentSpeedText") },
    GABIMCOMMERCIALSPEED: { fn: () => safeCall("gabimCommercialDevelopmentSpeedText") },
    GABIMTOURISMPOTENTIAL: { fn: () => safeCall("gabimTourismPotentialText") },
    GABIMSECURITY: { fn: () => safeCall("gabimSecurityText") },
    GABIMELEVATOR: { fn: () => safeCall("gabimElevatorText") },
    GABIMOPENCARPARK: { fn: () => safeCall("gabimCarparkText", "Açık") },
    GABIMCLOSEDCARPARK: { fn: () => safeCall("gabimCarparkText", "Kapalı") },
    GABIMPOOL: { fn: () => safeCall("gabimPoolText") },
    GABIMPREFERREDUSE: { fn: () => safeCall("gabimPreferredUseAreaText") },
    GABIMCONSTRUCTIONQUALITY: { fn: () => safeCall("gabimConstructionQualityText") },
    GABIMSALEABILITY: { fn: () => safeCall("gabimSaleabilityText") },
    GABIMINDUSTRIALIZATIONSPEED: { fn: () => safeCall("gabimIndustrializationSpeedText") },
    GABIMLANDSLOPE: { fn: () => safeCall("gabimLandSlopeText") },
    GABIMROADFRONTAGE: { fn: () => safeCall("gabimRoadFrontageText") },
    GABIMAGRICULTURETYPE: { fn: () => safeCall("gabimAgricultureTypeText") },
    GABIMLANDCLASSIFICATION: { fn: () => safeCall("gabimLandClassificationText") },
    GABIMARABLELAND: { fn: () => safeCall("gabimArableLandText") },
    GABIMARABLESOIL: { fn: () => safeCall("gabimArableSoilText") },
    TOTALLEGALREDUCEDAREA: { fn: () => safeCall("gabimTotalReducedAreaText", "legal") },
    TOTALCURRENTREDUCEDAREA: { fn: () => safeCall("gabimTotalReducedAreaText", "current") },

    // --- Ana gayrimenkul / bağımsız bölüm ---
    ANAGAYRIMENKUL2025: { t: () => field("mainPropertyDescription") || safeCall("buildMainPropertyDescription") },
    ZIRAATANAGAYRIMENKULNORMAL: { t: () => field("mainPropertyDescription") || safeCall("buildMainPropertyDescription") },
    ZIRAATANAGYDIGER: { fn: () => "" },
    BAGIMSIZBOLUM2025: { t: () => safeCall("composeUnitInteriorDetailsDescription") },
    UNITDESCRIPTIONINTRO: { t: () => safeCall("composeUnitDescriptionIntroForReport") },
    KATBAZLIICHACIMLER: { fn: () => safeCall("formatUnitFloorInteriorSummary", safeCall("getUnitFloorRows")) },
    SALON: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).salon || "" },
    ODA: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).oda || "" },
    BANYO: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).banyo || "" },
    TUVALET: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).tuvalet || "" },
    BALKON: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).balkon || "" },
    MUTFAK: { fn: () => (safeCall("getGabimUnitInteriorCounts") || {}).mutfak || "" },
    ICHACIMGRUPSAYIMI: { fn: () => safeCall("getUnitInteriorGroupSummaryText") },
    DIGER: { fn: () => safeCall("getUnitInteriorOtherCount") },
    BINAYAPITARZI: { f: ["buildingStyle"] },
    YAPISINIFI: { f: ["buildingClass"] },
    MEVCUTYAPINIZAMI: { f: ["buildingOrder"] },
    YAPIYILI: { f: ["buildingConstructionYear"] },
    YAPIYASI: { f: ["buildingAge"] },
    YAPIBITISTARIHI: { d: ["buildingCompletionDate"] },
    MAINPROPERTYFLOORCOUNTTEXT: { fn: () => safeCall("refreshMainPropertyFloorCountTextFromCounts") },
    ANAGYTOPLAMKATADEDI: { f: ["totalFloors"] },
    TOPLAMKAT: { f: ["totalFloors"] },
    YOLKOTUALTIKATADEDI: { fn: () => safeCall("getBuildingBasementFloorCount") },
    YOLKOTUUSTUKATADEDI: { fn: () => safeCall("getBuildingAboveRoadFloorCount") },
    TOPLAMBB: { f: ["totalUnits"] },
    ANAGY: { fn: () => safeCall("buildBuildingFloorMacroSummary") },
    ELEVATOR: { f: ["elevator"] },
    ASANSOR: { f: ["elevator"] },
    CARPARK: { f: ["carpark"] },
    OTOPARK: { f: ["carpark"] },
    SOSYALTESISLER: { fn: () => [field("socialFacilities"), field("siteFacilities")].filter(Boolean).join(", ") },
    ISINMASISTEMI: { f: ["unitHeatingType"] },
    DEPREMDERECE: { fn: () => field("earthquakeZone") },
    EARTHQUAKEZONE: { fn: () => field("earthquakeZone") },
    SEVIYEDURUMU: { f: ["unitConstructionLevel"], fallback: "Tamamlanmış (%100)" },
    INSASEVIYE: { f: ["unitConstructionLevel"], fallback: "Tamamlanmış (%100)" },
    YAPIMASAMASI: { f: ["unitConstructionLevel"], fallback: "Tamamlanmış (%100)" },
    YAPIKALITESI2025: { f: ["unitMaterialQuality"] },
    MALZEMEVEISCILIK: { f: ["unitMaterialQuality"] },
    MANZARA: { f: ["unitViewStatus"] },
    CEPHELER: { f: ["facades"] },
    CEPHECUMLE: { f: ["facades"] },
    CEPHESAYISI: { fn: () => safeCall("getFacadeCountText") },
    BBKULLANIMDURUMU: { f: ["unitUsageStatus"] },
    ISBANKKULLANIMDURUMU: { f: ["unitUsageStatus"] },
    ICIGORULDUMU: { fn: () => (field("appointmentType") === "İçi görülmüştür" ? "EVET" : "HAYIR") },
    DAHAONCESATIS: { fn: () => (safeCall("gabimFirstSaleText") === "Evet" ? "HAYIR" : "EVET") },
    SITEICERISINDEMIYERALIYOR: { fn: () => safeCall("gabimSiteWithinText") },
    SITEICINDEMI: { fn: () => safeCall("gabimSiteWithinText") }, // {{SİTE_İÇİNDE_Mİ}}
    // Vakıf Katılım "İncelenen Belgeler" ekranının üç belge sütunu: iskan,
    // EN YENİ yapı ruhsatı ve tasdikli mimari proje (tarih + belge no).
    LATESTBUILDINGPERMITSTATUS: { fn: () => safeCall("getLatestBuildingPermitStatus") },
    LATESTBUILDINGPERMITDATE: { fn: () => safeCall("getLatestBuildingPermitDateText") },
    LATESTBUILDINGPERMITNO: { fn: () => safeCall("getLatestBuildingPermitNoText") },
    OCCUPANCYPERMITNO: { fn: () => safeCall("getOccupancyPermitNoText") },
    ARCHITECTURALPROJECTDATE: { fn: () => safeCall("getArchitecturalProjectDateText") },
    ARCHITECTURALPROJECTNO: { fn: () => safeCall("getArchitecturalProjectNoText") },
    // İncelendiği kurum: her sütun kendi belge satırından, yalnızca belediye.
    OCCUPANCYPERMITINSTITUTION: { fn: () => safeCall("getOccupancyPermitInstitutionText") },
    LATESTBUILDINGPERMITINSTITUTION: { fn: () => safeCall("getLatestBuildingPermitInstitutionText") },
    ARCHITECTURALPROJECTINSTITUTION: { fn: () => safeCall("getArchitecturalProjectInstitutionText") },
    BUILDINGUSAGETYPES: { fn: () => safeCall("getBuildingUsageTypesText") },
    // Kullanıcı talebi (Vakıfbank şablonu ek alanlar, 2026-08-07).
    RESIDENTIALUSAGEPRESENT: { fn: () => safeCall("getResidentialUsagePresentText") },
    MIXEDUSEBUILDING: { fn: () => safeCall("getMixedUseBuildingText") },
    // İnşaa seviyesi %100 ise boş döner (natamam satırları anlamsız olur).
    INCOMPLETECONSTRUCTIONLEVEL: { fn: () => safeCall("getIncompleteConstructionLevelText") },
    YASALKATDAGILIM2025: { fn: () => safeCall("buildBuildingFloorMacroSummary") },
    MEVCUTKATDAGILIMI2025: { fn: () => safeCall("buildBuildingFloorMacroSummary") },
    PENCERE: { f: ["windows", "unitWindows"] },
    DISKAPI: { f: ["buildingEntranceDoor"] },
    ICKAPI: { f: ["unitInteriorDoors", "interiorDoors"] },
    BINAOTURUMUVEGIRISACIKLAMASI: { t: () => safeCall("buildBuildingFootprintAndEntranceExplanation") },

    // --- Arsa ---
    ARSAACIKLAMA: { t: () => field("landNote") },
    LANDNOTE: { f: ["landNote"] },
    MINIMUMPARSEL: { t: () => field("landMinimumParcelAssessment") },

    // --- Değerleme ---
    YASALDURUMDEGERI: { m: ["legalValue"] },
    MEVCUTDURUMDEGERI: { m: ["currentValue"] },
    LEGALURGENTSALEVALUE: { fn: () => safeCall("getUrgentSaleValueText", "legal") },
    CURRENTURGENTSALEVALUE: { fn: () => safeCall("getUrgentSaleValueText", "current") },
    // Kullanıcı talebi (Yapı Kredi şablonu düzeltme listesi, 2026-08-06):
    // "UAVT den sonra Konut Niteliği (Dikey yada yatay kat irtifakı seçili
    // ise Apartman Dairesi, değilse Müstakil bina)".
    RESIDENCETYPE: { fn: () => safeCall("getResidenceTypeText") },
    MEVCUTKIRA: { m: ["currentRent"] },
    YASALKIRA: { m: ["legalRent"] },
    YILLIKKIRAMEVCUT: {
      fn: () => {
        try {
          const monthly = parseValuationNumber(field("currentRent"));
          return Number.isFinite(monthly) && monthly > 0 ? `${formatSchemeNumber(monthly * 12)} TL` : "";
        } catch (error) { return ""; }
      },
    },
    KIRAM2YASAL: { f: ["legalRentUnit"] },
    KIRAM2MEVCUT: { f: ["currentRentUnit"] },
    ARSABIRIMDEGERI: { f: ["landUnitValue"] },
    YASALKULLANIMALANI: { f: ["legalArea", "legalValueArea"] },
    MEVCUTKULLANIMALANI: { f: ["currentArea", "currentValueArea"] },
    LEGALNETAREA: { fn: () => safeCall("getValuationUnitNetAreaTotals").legal },
    CURRENTNETAREA: { fn: () => safeCall("getValuationUnitNetAreaTotals").current },
    TOTALLEGALAREA: { fn: () => safeCall("getValuationUnitAreaTotals").legal },
    TOTALCURRENTAREA: { fn: () => safeCall("getValuationUnitAreaTotals").current },
    TOPLAMYASALALAN: { fn: () => safeCall("getValuationUnitAreaTotals").legal },
    TOPLAMMEVCUTALAN: { fn: () => safeCall("getValuationUnitAreaTotals").current },
    DEGERLEME2025: { t: () => field("saleabilityNote") || safeCall("buildValuationMethodExplanation") },
    STKACIKLAMA2025: { t: () => field("saleabilityNote") },
    SATISACIKLAMA: { t: () => field("saleabilityNote") },
    SALEABILITY: { f: ["saleability"] },
    DEGERLEMEMETODU: { f: ["valuationMethod"] },
    OLUMLUFAKTOR: { t: () => safeCall("buildValueFactorsPositiveText") },
    OLUMSUZFAKTOR: { t: () => safeCall("buildValueFactorsNegativeText") },
    DEGERLENDIRMETABLOSU: { h: () => safeCall("buildValuationSummaryWordTableHtml") || safeCall("formatTextTableForWord", safeCall("buildValuationSummaryText")) },
    DEGERLENDIRMESEMASI: { h: () => safeCall("buildValuationMethodsSchemeWordHtml") || safeCall("buildValuationMethodsSchemeText") },
    DEGERLEMEYONTEMIACIKLAMASI: { t: () => safeCall("buildValuationMethodExplanation") },
    SATISKABILIYETIACIKLAMASI: { t: () => safeCall("buildValuationSaleabilityExplanationForExport") },
    TARLABAHCEDEGERLEMERISKIACIKLAMASI: { t: () => safeCall("buildTarlaValuationRiskExplanation") },
    VALUATIONSALEABILITYEXPLANATION: { t: () => safeCall("buildValuationSaleabilityExplanation") },
    KIRAACIKLAMASI: { t: () => safeCall("buildValuationRentExplanation") },
    EMLAKBEYANDEGERIACIKLAMASI: { t: () => safeCall("buildPropertyTaxDeclarationExplanationForExport") },
    KATBAZINDAINDIRGENMISALANTABLOSU: { h: () => safeCall("buildExplanationsFloorValuationWordTableHtml") },

    // --- Ziraat Bankası açıklama bölümleri ---
    ZIRAAT_KONUM_CEVRESEL: { t: () => safeCall("buildZiraatLocationEnvironmentalExplanation") },
    ZIRAAT_BOLGE_GELISIMI: { t: () => safeCall("buildZiraatDevelopmentAnalysisExplanation") },
    ZIRAAT_YAPILASMA: { t: () => safeCall("buildZiraatBuildingPatternExplanation") },

    // --- Emsaller ---
    EMSALTABLOSU: { h: () => safeCall("buildComparableValuationWordTableHtml") || safeCall("buildComparableMatrixWordTableHtml") },
    EMSALDEGERLEMETABLOSU: { h: () => safeCall("buildComparableValuationWordTableHtml") || safeCall("buildComparableMatrixWordTableHtml") },
    EMSALMATRISI: { h: () => safeCall("buildComparableMatrixWordTableHtml") },
    EMSAL_ARSA_PIYASA_DEGERI: { h: () => safeCall("buildComparableCalculatedEmsalWordTableHtml") },
    EMSALPIYASAANALIZI: { t: () => field("comparableMarketAnalysisText") || safeCall("buildComparableMarketAnalysisText") },

    // --- Halkbank ---
    RISKKODLARI: { t: () => safeCall("buildHalkbankRiskCodesText") },
    HALKBANKRISKKODLARI: { t: () => safeCall("buildHalkbankRiskCodesText") },
    HALKBANKRISKKODLARITABLO: { h: () => safeCall("formatTextTableForWord", safeCall("buildHalkbankRiskCodesTableText")) },
    HALKBANKDEGERLEME: { t: () => field("saleabilityNote") || safeCall("buildValuationMethodExplanation") },
    HALKBANKPROJEUYGUNLUK: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    HALKBANKDEGERLEMEDETAYTABLO: { h: halkbankValuationDetailsTableHtml },
    HALKBANKEMSALLISTESITABLO: { h: halkbankComparableListTableHtml },
    HALKBANKEMSALARALIGI: { h: halkbankComparableRangeText },
    HALKBANKMERKEZBANKASIACIKLAMA: { t: () => field("halkbankCentralBankExplanation") },
    HALKBANKILKSATISDURUMU: { fn: () => safeCall("gabimFirstSaleText") },
    PENALTYDECISION: { f: ["penaltyDecision"] },
    PENALTYDECISIONSTATUS: { fn: () => safeCall("getPenaltyDecisionStatus") },
    PROJECTSUITABILITYSTATUS: { fn: () => safeCall("getProjectSuitabilityDifferenceStatus") },
    PROJECTCONFORMITY: { f: ["projectConformity"] },
    HASARCHITECTURALPROJECT: { f: ["hasArchitecturalProject"] },
    STATICSUITABILITY: { f: ["staticSuitability"] },
    BUILDINGINSPECTIONCONTRACTACTIVE: { f: ["buildingInspectionContractActive"] },

    // --- Ziraat ek tablo ---
    ZRTYASAL: { m: ["legalValue"] },
    ZRTMEVCUT: { m: ["currentValue"] },
    ZRTTBLBLGTR: { fn: () => firstPermitDocParts().type },
    ZRTDATE: { fn: () => firstPermitDocParts().date },
    ZRTTBLNO: { fn: () => firstPermitDocParts().no },
    ZRTBELGETURU: { fn: () => firstPermitDocParts().type }, // {{ZRT_BELGE_TÜRÜ}}
    ZRTBELGETARIHI: { fn: () => firstPermitDocParts().date }, // {{ZRT_BELGE_TARİHİ}}
    ZRTBELGENO: { fn: () => firstPermitDocParts().no }, // {{ZRT_BELGE_NO}}
  };

  // EMSAL1..EMSAL7 ve KISAEMSAL1..KISAEMSAL7
  for (let i = 1; i <= 7; i += 1) {
    LEGACY_ALIASES[`EMSAL${i}`] = { fn: () => comparableLineText(i - 1) };
    LEGACY_ALIASES[`KISAEMSAL${i}`] = { fn: () => comparableLineText(i - 1) };
    [
      ["IRTIBAT_KAYNAK", "c0"], ["TELEFON", "c1"], ["EMSAL_NITELIGI", "c23"],
      ["EMSAL_DURUMU", "c2"], ["SATIS_ZAMANI", "c3"], ["NITELIK", "c4"],
      ["ODA_SAYISI", "c5"], ["BULUNDUGU_KAT_MULKIYET", "c6"], ["EMSAL_KONUMU", "c7"],
      ["ENLEM", "c18"], ["BOYLAM", "c19"], ["YOLA_CEPHE_DURUMU", "c29"],
      ["IC_OZELLIKLER", "c8"], ["OZELLIK_SEREFIYE_ORANI", "c21"],
      ["TASINMAZA_GORE_KONUM", "c9"], ["KONUM_SEREFIYE_ORANI", "c22"],
      ["KONUM_KARSILASTIRMA_SEBEBI", "c10"], ["BULUNDUGU_YAPI_YASI", "c11"],
      ["BEYAN_EDILEN_ALAN", "c12"], ["DUZELTILMIS_ALAN", "c13"], ["YUZOLCUMU", "c24"],
      ["IMAR_LEJANDI", "c25"], ["YAPILASMA_NIZAMI", "c26"], ["EMSAL_KAKS", "c27"],
      ["KAT_ADEDI", "c28"], ["HESAPLANAN_EMSAL", "c31"], ["TALEP_EDILEN_DEGER", "c14"],
      ["PAZARLIKLI_DEGER", "c15"], ["PAZARLIK_PAYI", "calcNegotiation"],
      ["M2_BIRIM_DEGERI", "calcUnitValue"], ["INDIRGENMIS_M2_BIRIM_DEGERI", "calcAdjustedUnitValue"],
      ["HESAPLANAN_EMSAL_M2_BIRIM_DEGERI", "calcCalculatedEmsalUnitValue"],
      ["INDIRGENMIS_HESAPLANAN_EMSAL_M2_BIRIM_DEGERI", "calcAdjustedCalculatedEmsalUnitValue"],
      ["KIRA_DEGERI", "c16"], ["KIRA_BIRIM_DEGERI", "calcRentUnitValue"],
      ["ACIKLAMA_DUZELTME", "c17"], ["UZUN_EMSAL_METNI", "calcLongText"],
    ].forEach(([token, fieldKey]) => {
      LEGACY_ALIASES[`EMSAL${i}_${token}`] = { fn: () => safeCall("getComparablePlaceholderValue", i - 1, fieldKey) };
    });
  }

  // Genel veri tablolarındaki hücreler de katalogda gösterilen adlarıyla
  // çözümlensin: {{TABLE_TITLE_1_MALIK}} gibi.
  const tableDefinitions = (Array.isArray(sections) ? sections : [])
    .map((section) => section?.table)
    .filter((table) => table?.key && Array.isArray(table.columns));
  tableDefinitions.forEach((table) => {
    table.columns.forEach((column, columnIndex) => {
      for (let rowIndex = 1; rowIndex <= 50; rowIndex += 1) {
        const columnToken = typeof globalThis.toPlaceholderName === "function"
          ? globalThis.toPlaceholderName(column)
          : String(column || "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
        const token = `TABLE_${table.key}_${rowIndex}_${columnToken}`;
        LEGACY_ALIASES[token] = { fn: () => safeCall("getTablePlaceholderValue", table.key, rowIndex - 1, columnIndex) };
      }
    });
  });

  // --------------------------------------------------------------
  // Çözümleyiciler
  // --------------------------------------------------------------
  // sections[].fields dışında, özel panellerce yönetilen gerçek state.fields
  // anahtarları: bunlar da program token'ı olarak çözülür
  // (örn. {{ELEVATOR}}, {{SOCİAL_FACİLİTİES}}, {{UNİT_HEATİNG_TYPE}}).
  const EXTRA_FIELD_KEYS = [
    "elevator", "carpark", "socialFacilities", "siteFacilities",
    "unitHeatingType", "totalFloors", "totalUnits", "unitMaterialQuality",
    "facades", "unitViewStatus", "unitUsageStatus", "unitConstructionLevel", "pga475",
    "buildingStyle", "buildingOrder", "buildingClass", "valuationMethod",
    "legalRentUnit", "currentRentUnit", "mainPropertyDescription",
    "actualUsePurpose", "propertyType", "titleDate",
    "mainRealEstateProjectSuitable", "mainRealEstateProjectSuitabilityNote",
    "buildingEntranceDoor", "damageStatus", "unitFirstSaleStatus",
    "insuranceValue", "legalIncompleteValue", "currentIncompleteValue",
    // Yapı (bina) değer satırlarının alan anahtarları: sections içinde değil,
    // değerleme satırlarında areaKey olarak tanımlı olduğu için buraya elle
    // eklenir — aksi halde {{LEGAL_BUILDING_VALUE_AREA}} çözümlenmez.
    "legalBuildingValueArea", "currentBuildingValueArea",
    // Yasal/mevcut m² birim değerleri ve sigortaya esas alan: aynı şekilde
    // değerleme satırlarında unitKey/areaKey olarak tanımlı.
    "legalValueUnit", "currentValueUnit", "insuranceValueArea",
  ];

  let foldedFieldIndex = null;
  let dateFieldKeys = null;
  function getFoldedFieldIndex() {
    if (foldedFieldIndex) return foldedFieldIndex;
    foldedFieldIndex = new Map();
    dateFieldKeys = new Set();
    try {
      sections.forEach((section) => {
        (section.fields || []).forEach((f) => {
          const folded = foldTokenName(f.key);
          if (!foldedFieldIndex.has(folded)) foldedFieldIndex.set(folded, f.key);
          if (f.type === "date") dateFieldKeys.add(f.key);
        });
      });
    } catch (error) { /* sections yoksa boş kalır */ }
    EXTRA_FIELD_KEYS.forEach((key) => {
      const folded = foldTokenName(key);
      if (!foldedFieldIndex.has(folded)) foldedFieldIndex.set(folded, key);
    });
    return foldedFieldIndex;
  }

  let generatedTextCache = null;
  function getGeneratedTextIndex() {
    // Her dolumda taze üretilir (exportTemplate başında sıfırlanır).
    if (generatedTextCache) return generatedTextCache;
    generatedTextCache = new Map();
    try {
      collectGeneratedTextPlaceholders().forEach((row) => {
        const folded = foldTokenName(row.reference);
        if (!generatedTextCache.has(folded)) generatedTextCache.set(folded, row.value || "");
      });
    } catch (error) { /* boş kalır */ }
    return generatedTextCache;
  }

  // LEGACY_ALIASES nesnesindeki bazı anahtarlar alt çizgi içeriyor (ör.
  // "EMSAL2_TELEFON", "TABLE_..._MALIK", "ZIRAAT_KONUM_CEVRESEL") — ama
  // resolveToken çağıranı foldTokenName() ile HER ZAMAN alt çizgisiz/
  // noktalamasız arıyor (bkz. dosya başındaki "Türkçe-katlanmış, noktalama
  // duyarsız" sözü). Nesneyi doğrudan `LEGACY_ALIASES[folded]` ile aramak bu
  // yüzden alt çizgili anahtarlarla HİÇBİR ZAMAN eşleşmiyordu (örn. kullanıcı
  // şablonuna doğru yazdığı {{EMSAL_2_TELEFON}} "⚠ EMSAL_2_TELEFON" olarak
  // boş kalıyordu). Bu katlanmış indeks aradaki köprü: anahtarları da
  // foldTokenName() ile normalize edip arar.
  let foldedLegacyAliasIndex = null;
  function getFoldedLegacyAliasIndex() {
    if (foldedLegacyAliasIndex) return foldedLegacyAliasIndex;
    foldedLegacyAliasIndex = new Map();
    Object.keys(LEGACY_ALIASES).forEach((key) => {
      const folded = foldTokenName(key);
      if (folded && !foldedLegacyAliasIndex.has(folded)) foldedLegacyAliasIndex.set(folded, LEGACY_ALIASES[key]);
    });
    return foldedLegacyAliasIndex;
  }

  // Dönüş: { ok: true, html: "..." } | { ok: false }  (ok=false → eşleşme yok)
  function resolveToken(rawName) {
    const folded = foldTokenName(rawName);
    if (!folded) return { ok: false };

    const spec = getFoldedLegacyAliasIndex().get(folded);
    if (spec) {
      let value = "";
      let isHtml = false;
      if (spec.f) value = field(...spec.f);
      else if (spec.d) value = dateField(...spec.d);
      else if (spec.m) value = moneyField(...spec.m);
      else if (spec.t) { value = textParagraphsHtml(spec.t(), spec.paragraphClass || ""); isHtml = true; }
      else if (spec.h) { value = String(spec.h() || ""); isHtml = true; }
      else if (spec.fn) value = String(spec.fn() || "");
      if (!value && spec.fallback) value = spec.fallback;
      return { ok: true, html: isHtml ? value : escapeHtmlSafe(value) };
    }

    const fieldKey = getFoldedFieldIndex().get(folded);
    if (fieldKey) {
      // Çok satırlı alanlar (textarea) Word'de satır sonlarını korusun.
      const value = dateFieldKeys?.has(fieldKey) ? dateField(fieldKey) : field(fieldKey);
      return { ok: true, html: escapeHtmlSafe(value).replace(/\n/g, "<br />") };
    }

    const generated = getGeneratedTextIndex();
    if (generated.has(folded)) return { ok: true, html: textParagraphsHtml(generated.get(folded)) };

    return { ok: false };
  }

  function escapeHtmlSafe(value) {
    try {
      return escapeHtml(String(value ?? ""));
    } catch (error) {
      const div = document.createElement("div");
      div.textContent = String(value ?? "");
      return div.innerHTML;
    }
  }

  // GDYS'nin ortak çalışma sayfası dilini yalnızca bu üç yardımcı bölüme
  // uygular. Bankaya özgü şablon gövdeleri ve GABİM alanları değişmeden kalır.
  function applyGdysTemplatePresentation(templateText) {
    const source = String(templateText || "");
    if (!/(?:GABIM_VERI_SETI|GDYS\s+YARDIMCI|ÇALIŞMA\s+KAĞIDI)/i.test(source)) return source;

    const styles = `
<style data-gdys-template-presentation="true">
  [data-gdys-section] {
    display: block;
    margin: 12pt 0 5pt !important;
    padding: 4pt 7pt !important;
    border: 1pt solid #545454 !important;
    border-bottom: 3pt solid #e86c49 !important;
    background: #4b4b4b !important;
    color: #ffffff !important;
    font-family: Arial, sans-serif !important;
    font-size: 8pt !important;
    font-weight: 700 !important;
    line-height: 1.1 !important;
  }
  [data-gdys-section] + table {
    width: 100% !important;
    margin: 0 0 10pt !important;
    border-collapse: collapse !important;
    border: 1pt solid #d8d8d8 !important;
    background: #ffffff !important;
    font-family: Arial, sans-serif !important;
    font-size: 6.5pt !important;
  }
  [data-gdys-section] + table td,
  [data-gdys-section] + table th {
    border: 1pt solid #e0e0e0 !important;
    padding: 3pt 4pt !important;
    background: #ffffff !important;
    color: #383838 !important;
    vertical-align: top !important;
    line-height: 1.15 !important;
  }
  [data-gdys-section] + table td.l,
  [data-gdys-section] + table th {
    background: #f2f2f2 !important;
    color: #4b4b4b !important;
    font-weight: 700 !important;
  }
  .gdys-gabim-sheet {
    margin: 0 0 10pt;
    padding: 7pt 8pt 5pt;
    border: 1pt solid #d8d8d8;
    background: #ffffff;
    font-family: Arial, sans-serif;
  }
</style>`;

    const withStyles = source.replace(/<\/head\s*>/i, `${styles}\n</head>`);
    return withStyles.replace(
      /(<(?:h2|div)\b[^>]*)(>[^<]*(?:GDYS\s+YARDIMCI|GABİM\s+VERİ\s+SETİ|GABIM\s+VERI\s+SETI|ÇALIŞMA\s+KAĞIDI)[^<]*<\/(?:h2|div)>)/gi,
      (match, opening, content) => (
        /data-gdys-section=/i.test(opening)
          ? `${opening}${content}`
          : `${opening} data-gdys-section="true"${content}`
      ),
    );
  }

  // Şablon metnindeki tüm {{...}} işaretlerini doldurur. HTML yorumları
  // (<!-- ... -->) önce ÇIKARILIR: hem şablon içi notlar Word çıktısına
  // sızmaz hem de yorumlarda örnek olarak yazılan {{...}} ifadeleri
  // "eşleşmedi" sayılmaz.
  function fillTemplate(templateText) {
    generatedTextCache = null; // her dolumda güncel değerler
    foldedFieldIndex = null;
    const missing = [];
    const withoutComments = applyGdysTemplatePresentation(templateText).replace(/<!--[\s\S]*?-->/g, "");
    const html = withoutComments.replace(/\{\{([^{}]+)\}\}/g, (match, name) => {
      const trimmed = String(name || "").trim();
      const resolved = resolveToken(trimmed);
      if (resolved.ok) return resolved.html;
      missing.push(trimmed);
      return `<span style="background:#ffe9a8;color:#7a5b00;font-weight:bold;">⚠ ${escapeHtmlSafe(trimmed)}</span>`;
    });
    return { html, missing };
  }

  function resolveTemplateTokenValues(tokenNames) {
    generatedTextCache = null;
    foldedFieldIndex = null;
    const missing = [];
    const values = {};
    for (const rawName of [...new Set(Array.isArray(tokenNames) ? tokenNames : [])]) {
      const name = String(rawName || "").trim();
      if (!name) continue;
      const resolved = resolveToken(name);
      if (!resolved.ok) {
        missing.push(name);
        values[name] = `<span style="color:#d97706;font-weight:700">&#9888; ${escapeHtmlSafe(name)}</span>`;
      } else {
        values[name] = resolved.html;
      }
    }
    return { values, missing };
  }

  function buildServerValuationInput() {
    return {
      legalValue: state.fields?.legalValue ?? "",
      currentValue: state.fields?.currentValue ?? "",
    };
  }

  // Bu küçük ham alan paketi sadece banka şablonu oluşturulurken gönderilir.
  // Form etkileşimleri, otomatik kayıt ve önizleme tamamen yerelde kalır.
  //
  // variantSeed/variantOverrides: sunucunun (server.js, buildServerProjectSuitabilityDescription)
  // buildProjectSuitabilityStatusSentence() ile AYNI cümle-varyantını seçebilmesi
  // için eklendi (bkz. docs/cumle-envanteri.md, Bölüm 3 — daha önce ertelenmiş
  // server senkronu). Yalnızca kalıcı reportId varsa gönderilir; oturum-içi
  // rastgele variantSeed (state.variantSeed, henüz kaydedilmemiş rapor) sunucuya
  // hiç yollanmaz — sunucu bu durumda güvenli varsayılan olarak orijinal (index 0)
  // metni üretir (bkz. server.js selectVariantServer yorumu).
  function buildServerProtectedPlaceholderInput() {
    const fields = state.fields || {};
    return {
      buildingFootprintReference: fields.buildingFootprintReference ?? "",
      buildingEntranceLevel: fields.buildingEntranceLevel ?? "",
      buildingEntranceDirection: fields.buildingEntranceDirection ?? "",
      projectSuitabilityStatus: fields.projectSuitabilityStatus ?? "",
      projectConformity: fields.projectConformity ?? "",
      projectSuitabilitySimpleRepair: fields.projectSuitabilitySimpleRepair ?? "",
      variantSeed: state.reportId || "",
      variantOverrides: fields.variantOverrides && typeof fields.variantOverrides === "object" ? fields.variantOverrides : {},
    };
  }

  function listTemplates() {
    return TEMPLATE_REGISTRY.map((entry) => ({ ...entry }));
  }

  function defaultTemplateKeyForBank(bankName, isLandOwnership = false) {
    const bank = String(bankName || "").trim();
    const matches = TEMPLATE_REGISTRY.filter((entry) => entry.bank && entry.bank === bank);
    if (!matches.length) return "";
    if (matches.length > 1) {
      const preferred = matches.find((entry) => Boolean(entry.variant === "arsa-arazi") === Boolean(isLandOwnership));
      if (preferred) return preferred.key;
    }
    return matches[0].key;
  }

  // Mülkiyet (ownershipType) Arsa/Tarla ise banka için "arsa-arazi" varyantı
  // varsa o kullanılır; aksi halde seçilen anahtar aynen döner. Açılır listede
  // (hiddenFromList) yalnızca tek seçenek gösterildiği için asıl indirmede
  // doğru dosyaya yönlendirmek için bu fonksiyon kullanılır.
  function resolveTemplateKeyForExport(templateKey, isLandOwnership = false) {
    const entry = TEMPLATE_REGISTRY.find((item) => item.key === templateKey);
    if (!entry || !entry.bank) return templateKey;
    return defaultTemplateKeyForBank(entry.bank, isLandOwnership) || templateKey;
  }

  // options.download = false: dosyayı otomatik indirmek yerine içeriği
  // ({content, mimeType}) döner — "Banka Şablonuyla Kaydet" tıklandığında
  // JSON + Excel + Word'ü tek bir zip'te toplamak için kullanılır (kullanıcı
  // talebi: "otomatik zip yada rar içinde insin").
  async function exportTemplate(templateKey, options = {}) {
    const download = options.download !== false;
    const entry = TEMPLATE_REGISTRY.find((item) => item.key === templateKey);
    if (!entry) throw new Error(`Şablon bulunamadı: ${templateKey}`);
    if (entry.format === "docx") return exportDocxTemplate(entry, { download });
    const tokenResponse = await fetchProtectedTemplateApi(`/api/report-template-tokens?key=${encodeURIComponent(entry.key)}`);
    const tokenPayload = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !Array.isArray(tokenPayload?.tokens)) {
      throw new Error(tokenPayload?.error || "Sablon alanlari sunucudan alinamadi.");
    }
    if (tokenPayload.tokens.some((name) => /^(?:REPORT_MAPS_SECTION|LOCATION_MAP_SECTION|COMPARABLE_SKETCH_SECTION|LOCATION_MAP_IMAGE|COMPARABLE_SKETCH_IMAGE)$/i.test(name))) {
      safeCall("ensureReportMapImagesForExport");
    }
    const preparedAssets = await Promise.resolve(safeCall("buildSavedReportImageAssets"));
    reportImageAssetsCache = Array.isArray(preparedAssets) ? preparedAssets : [];
    try {
      const { values, missing } = resolveTemplateTokenValues(tokenPayload.tokens);
      const renderResponse = await fetchProtectedTemplateApi("/api/report-template-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateKey: entry.key,
          tokenValues: values,
          valuationInput: buildServerValuationInput(),
          protectedPlaceholderInput: buildServerProtectedPlaceholderInput(),
        }),
      });
      const renderPayload = await renderResponse.json().catch(() => null);
      if (!renderResponse.ok || typeof renderPayload?.content !== "string") {
        throw new Error(renderPayload?.error || "Sablon sunucuda olusturulamadi.");
      }
      const html = applyGdysTemplatePresentation(renderPayload.content);
      const fileName = `${safeCall("buildExportBaseFileName") || "rapor"}-${entry.key}.doc`;
      const mimeType = "application/msword;charset=utf-8";
      const packaged = reportImageAssetsCache.length
        ? safeCall("buildWordMhtmlPackage", html, reportImageAssetsCache)
        : "";
      const content = packaged || html;
      if (download) safeCall("downloadTextFile", fileName, content, mimeType);
      return {
        fileName,
        missing,
        title: entry.title,
        content,
        mimeType,
        valuationVerification: renderPayload.valuationVerification || null,
      };
    } finally {
      reportImageAssetsCache = [];
    }
  }

  // Gerçek .docx şablonlar (format: "docx") için exportTemplate()'in ayrı
  // dalı: sunucunun HTML-render API'sini ("/api/report-template-render")
  // hiç kullanmaz — ham .docx baytları "/api/report-template-docx"'ten
  // çekilir, hangi {{TOKEN}}'ların şablonda geçtiği İSTEMCİDE
  // (window.RaporDocxFill.collectTokens) bulunur, değerler mevcut
  // resolveTemplateTokenValues() ile hesaplanır ve doldurma yerelde
  // (window.RaporDocxFill.fillTemplate) yapılır — belge asla metne
  // çevrilmediği için logo/çerçeve/sayfa düzeni bozulmaz.
  async function exportDocxTemplate(entry, { download }) {
    if (!window.RaporDocxFill) throw new Error("DOCX doldurma motoru yüklenmedi (docx-fill.js).");
    const docxResponse = await fetchProtectedTemplateApi(`/api/report-template-docx?key=${encodeURIComponent(entry.key)}`);
    if (!docxResponse.ok) {
      const errorPayload = await docxResponse.json().catch(() => null);
      throw new Error(errorPayload?.error || "Sablon indirilemedi.");
    }
    const arrayBuffer = await docxResponse.arrayBuffer();
    const zipEntries = window.RaporDocxFill.readStoredZip(arrayBuffer);
    const docEntry = zipEntries.find((item) => item.name === "word/document.xml");
    if (!docEntry) throw new Error("DOCX şablonunda word/document.xml bulunamadı.");
    const tokens = window.RaporDocxFill.collectTokens(new TextDecoder("utf-8").decode(docEntry.bytes));
    const { values, missing } = resolveTemplateTokenValues(tokens);
    const boldFlags = safeCall("getEmlakKatilimBoldFlags") || {};
    // Kullanıcı talebi: "emsal krokisi çıkmıyor word'de" — HTML yolundaki
    // exportTemplate() gibi, gerçek {{EMSAL_KROKISI}} vb. görsel token'lar
    // varsa önce görsel (kaydedilmemişse otomatik oluşturulan) varlıklar
    // hazırlanır; fillTemplate bunları gerçek <w:drawing> olarak gömer.
    let imageAssets = [];
    if (tokens.includes("EMSAL_KROKISI")) {
      safeCall("ensureReportMapImagesForExport");
      imageAssets = (await Promise.resolve(safeCall("buildSavedReportImageAssets"))) || [];
    }
    const filled = window.RaporDocxFill.fillTemplate(arrayBuffer, values, boldFlags, imageAssets);
    const fileName = `${safeCall("buildExportBaseFileName") || "rapor"}-${entry.key}.docx`;
    if (download && window.RaporXlsxFill?.downloadBlob) window.RaporXlsxFill.downloadBlob(fileName, filled.blob);
    // {{EMSAL_KROKISI}} resolveTemplateTokenValues() icin her zaman "missing"
    // gorunur (o normal metin token'i degil, gorsel gomme icin ayri bir
    // yoldan islenir) — gercekten gomulduyse (imageAssets icinde varlik
    // hazirlandiysa) yanlislikla "eksik alan" olarak raporlanmasin.
    const embeddedImageKeys = new Set(imageAssets.map((a) => a.key));
    const filteredMissing = missing.filter((name) => (
      !(name === "EMSAL_KROKISI" && embeddedImageKeys.has("comparables"))
    ));
    return {
      fileName,
      missing: [...filteredMissing, ...filled.missing],
      title: entry.title,
      bytes: filled.bytes,
      isBinary: true,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      valuationVerification: null,
    };
  }

  // Çözümleyiciler üretimde global API'ye verilmez. Yalnızca Node regresyon
  // testleri, tarayıcıya hiç ulaşmayan bu yardımcıları açabilir.
  const testOnlyApi = globalThis?.process?.env?.NODE_ENV === "test"
    ? { fillTemplate, resolveTemplateTokenValues, resolveToken, foldTokenName }
    : {};

  window.RaporTemplates = {
    listTemplates,
    defaultTemplateKeyForBank,
    resolveTemplateKeyForExport,
    exportTemplate,
    ...testOnlyApi,
  };
})();
