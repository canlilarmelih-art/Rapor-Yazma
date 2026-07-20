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
  // Şablon kayıt defteri: kullanıcı templates/ içine yeni bir .html
  // koyup buraya (veya window.RaporTemplates.register ile) ekleyebilir.
  // bank: state.fields.bank değeriyle eşleşirse varsayılan seçilir.
  // --------------------------------------------------------------
  const TEMPLATE_REGISTRY = [
    { key: "akbank", file: "templates/akbank.html", title: "Akbank Rapor Formatı", bank: "Akbank T.A.Ş." },
    { key: "halkbank", file: "templates/halkbank.html", title: "Halkbank Rapor Formatı", bank: "Türkiye Halk Bankası A.Ş." },
    { key: "isbankasi", file: "templates/isbankasi.html", title: "İş Bankası Rapor Formatı", bank: "Türkiye İş Bankası A.Ş." },
    { key: "isbankasi-masraf", file: "templates/isbankasi-masraf.html", title: "İş Bankası Masraf Yazısı", bank: "" },
    { key: "kuveytturk", file: "templates/kuveytturk.html", title: "Kuveyt Türk Rapor Formatı", bank: "Kuveyt Türk Katılım Bankası A.Ş." },
    { key: "vakifbank", file: "templates/vakifbank.html", title: "Vakıfbank Rapor Formatı", bank: "Türkiye Vakıflar Bankası T.A.O." },
    { key: "vakifkatilim", file: "templates/vakifkatilim.html", title: "Vakıf Katılım Rapor Formatı", bank: "Vakıf Katılım Bankası A.Ş." },
    { key: "yapikredi", file: "templates/yapikredi.html", title: "Yapı Kredi Rapor Formatı", bank: "Yapı ve Kredi Bankası A.Ş." },
    { key: "ziraat", file: "templates/ziraat.html", title: "Ziraat Bankası Rapor Formatı", bank: "T.C. Ziraat Bankası A.Ş." },
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

  function documentsTableHtml() {
    const rows = (Array.isArray(state.tables?.documents) ? state.tables.documents : [])
      .filter((row) => Object.values(row || {}).some((v) => String(v || "").trim()))
      .map((row) => [row.c0 || "", row.c1 || "", outputDate(row.c2), row.c3 || "", row.c4 || ""]);
    if (!rows.length) return safeCall("buildReviewedDocumentsDescription");
    return safeCall("buildSimpleHtmlTable", ["Belge Türü", "İncelenen Kurum", "Tarih", "No", "Kapsam"], rows);
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

  function reportImageHtml(key) {
    const asset = reportImageAssetsCache.find((item) => item?.key === key);
    if (!asset?.location) return "";
    const title = escapeHtmlSafe(asset.title || "Rapor görseli");
    return `<div style="margin:8pt 0 14pt;text-align:center;page-break-inside:avoid;">
      <img src="${escapeHtmlSafe(asset.location)}" width="640" height="360" style="width:480pt;height:270pt;border:1pt solid #94a3b8;" alt="${title}">
    </div>`;
  }

  function reportMapsSectionHtml() {
    return `${reportMapSectionHtml("location", "Konu Taşınmaz Konum Haritası", "h2")}${reportMapSectionHtml("comparables", "Emsal Konum Krokisi", "h3")}`;
  }

  function reportMapSectionHtml(key, title, headingTag) {
    const image = reportImageHtml(key);
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
    KAT1: { f: ["addressFloor", "titleFloor"] },
    KAT2: { f: ["titleFloor", "addressFloor"] },
    TAPUKAT: { f: ["titleFloor"] },
    UAVT: { f: ["uavt"] },
    POSTAKODU: { f: ["postalCode"] },
    ENLEM: { f: ["latitude"] },
    BOYLAM: { f: ["longitude"] },
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
    HISSELIMI: { fn: () => safeCall("gabimHasShareText") },
    MALIKLERTABLO: { h: () => safeCall("buildMaliklerTableWordHtml") },
    GABIMVERISETI: { h: () => safeCall("buildGabimDataSetWordHtml") },
    HISSEACIKLAMASI: { t: () => field("shareExplanation"), paragraphClass: "share-explanation" },
    EKLENTI: { f: ["titleAttachment"] },

    // --- Takyidat ---
    TAKYIDATTARIH: { d: ["takbisDate"] },
    TAKYIDATSAAT: { f: ["takbisTime"] },
    TAKYIDAT2025: { t: () => field("takbisSummary") || safeCall("buildEncumbranceSummary"), paragraphClass: "encumbrance-summary" },
    TAKYIDATISBANK: { t: () => field("takbisSummary") || safeCall("buildEncumbranceSummary"), paragraphClass: "encumbrance-summary" },
    TAKYIDATTABLO: { h: () => safeCall("formatTextTableForWord", safeCall("buildTakyidatTableText")) },
    // `{{ENCUMBRANCE_SUMMARY_TEXT}}` (PLACEHOLDER-REHBERI.md'de belgeli,
    // 7 banka şablonunda kullanılıyor) hiçbir yerde kayıtlı DEĞİLDİ — ne app
    // alan anahtarı ("encumbranceSummaryText" yok) ne de bir alias olarak;
    // şablonlarda sarı "⚠ AD" gösteriyordu. Gerçek alan `takbisSummary`
    // ("Takyidat açıklaması") — TAKBISSUMMARY adıyla zaten çözümleniyor,
    // burada eski adı da aynı değere bağlıyoruz.
    TAKBISSUMMARY: { t: () => field("takbisSummary") || safeCall("buildEncumbranceSummary"), paragraphClass: "encumbrance-summary" },
    ENCUMBRANCESUMMARYTEXT: { t: () => field("takbisSummary") || safeCall("buildEncumbranceSummary"), paragraphClass: "encumbrance-summary" },

    // --- İmar ---
    IMARPLANADI: { f: ["planName"] },
    PLANOLCEGI: { f: ["planScale"] },
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
    PROJEYEUYGUNMU2025: { f: ["projectDifference", "mainRealEstateProjectSuitable"] },
    MIMARIUYGUNLUK: { f: ["mainRealEstateProjectSuitable", "projectDifference"] },
    ANAGAYRUYG: { f: ["mainRealEstateProjectSuitable"] },
    ANAGAYRNOTU: { f: ["mainRealEstateProjectSuitabilityNote"] },
    PROJEKURUM2025: { f: ["projectInstitution", "documentReviewInstitution"] },
    ISKANVARMI: { fn: () => safeCall("gabimOccupancyPermitText") },
    ISBANKMIMARIPROJE: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    UYGACIKLAMA: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    VAKIFMIMARIPROJE: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    KONUMTEYIDI: { t: () => field("projectReviewDescription") || safeCall("buildProjectReviewDescription") || field("projectConformity") },
    EKBSINIF: { f: ["ekbEnergyClass"] },
    EKBBELGENO: { f: ["ekbDocumentNo"] },
    EKBVERILIS: { d: ["ekbIssueDate"] },
    EKBSON: { d: ["ekbValidUntil"] },
    EKBACIKLAMA: { t: () => field("ekbExplanation") || safeCall("buildEkbExplanation") },

    // --- Ana gayrimenkul / bağımsız bölüm ---
    ANAGAYRIMENKUL2025: { t: () => field("mainPropertyDescription") || safeCall("buildMainPropertyDescription") },
    ZIRAATANAGAYRIMENKULNORMAL: { t: () => field("mainPropertyDescription") || safeCall("buildMainPropertyDescription") },
    ZIRAATANAGYDIGER: { fn: () => "" },
    BAGIMSIZBOLUM2025: { t: unitInteriorPlusDecorative },
    KATBAZLIICHACIMLER: { fn: () => safeCall("formatUnitFloorInteriorSummary", safeCall("getUnitFloorRows")) },
    BINAYAPITARZI: { f: ["buildingStyle"] },
    YAPISINIFI: { f: ["buildingClass"] },
    MEVCUTYAPINIZAMI: { f: ["buildingOrder"] },
    YAPIYILI: { f: ["buildingConstructionYear"] },
    YAPIYASI: { f: ["buildingAge"] },
    YAPIBITISTARIHI: { d: ["buildingCompletionDate"] },
    ANAGYTOPLAMKATADEDI: { f: ["totalFloors"] },
    TOPLAMKAT: { f: ["totalFloors"] },
    YOLKOTUUSTUKATADEDI: { f: ["totalFloors"] },
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
    BBKULLANIMDURUMU: { f: ["unitUsageStatus"] },
    ISBANKKULLANIMDURUMU: { f: ["unitUsageStatus"] },
    ICIGORULDUMU: { fn: () => (field("appointmentType") === "İçi görülmüştür" ? "EVET" : "HAYIR") },
    DAHAONCESATIS: { fn: () => (safeCall("gabimFirstSaleText") === "Evet" ? "HAYIR" : "EVET") },
    SITEICERISINDEMIYERALIYOR: { fn: () => safeCall("gabimSiteWithinText") },
    SITEICINDEMI: { fn: () => safeCall("gabimSiteWithinText") }, // {{SİTE_İÇİNDE_Mİ}}
    YASALKATDAGILIM2025: { fn: () => safeCall("buildBuildingFloorMacroSummary") },
    MEVCUTKATDAGILIMI2025: { fn: () => safeCall("buildBuildingFloorMacroSummary") },
    PENCERE: { f: ["windows", "unitWindows"] },
    DISKAPI: { f: ["buildingEntranceDoor"] },
    ICKAPI: { f: ["unitInteriorDoors", "interiorDoors"] },

    // --- Arsa ---
    ARSAACIKLAMA: { t: () => field("landNote") },
    MINIMUMPARSEL: { t: () => field("landMinimumParcelAssessment") },

    // --- Değerleme ---
    YASALDURUMDEGERI: { m: ["legalValue"] },
    MEVCUTDURUMDEGERI: { m: ["currentValue"] },
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
    TOTALLEGALAREA: { fn: () => safeCall("getValuationUnitAreaTotals").legal },
    TOTALCURRENTAREA: { fn: () => safeCall("getValuationUnitAreaTotals").current },
    TOPLAMYASALALAN: { fn: () => safeCall("getValuationUnitAreaTotals").legal },
    TOPLAMMEVCUTALAN: { fn: () => safeCall("getValuationUnitAreaTotals").current },
    DEGERLEME2025: { t: () => field("saleabilityNote") || safeCall("buildValuationMethodExplanation") },
    STKACIKLAMA2025: { t: () => field("saleabilityNote") },
    SATISACIKLAMA: { t: () => field("saleabilityNote") },
    DEGERLEMEMETODU: { f: ["valuationMethod"] },
    OLUMLUFAKTOR: { t: () => safeCall("buildValueFactorsPositiveText") },
    OLUMSUZFAKTOR: { t: () => safeCall("buildValueFactorsNegativeText") },
    DEGERLENDIRMETABLOSU: { h: () => safeCall("buildValuationSummaryWordTableHtml") || safeCall("formatTextTableForWord", safeCall("buildValuationSummaryText")) },
    DEGERLENDIRMESEMASI: { t: () => safeCall("buildValuationMethodsSchemeText") },
    DEGERLEMEYONTEMIACIKLAMASI: { t: () => safeCall("buildValuationMethodExplanation") },
    SATISKABILIYETIACIKLAMASI: { t: () => safeCall("buildValuationSaleabilityExplanationForExport") },
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
    "facades", "unitViewStatus", "unitUsageStatus", "unitConstructionLevel",
    "buildingStyle", "buildingOrder", "buildingClass", "valuationMethod",
    "legalRentUnit", "currentRentUnit", "mainPropertyDescription",
    "actualUsePurpose", "propertyType", "titleDate",
    "mainRealEstateProjectSuitable", "mainRealEstateProjectSuitabilityNote",
    "buildingEntranceDoor", "damageStatus", "unitFirstSaleStatus",
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

  // Dönüş: { ok: true, html: "..." } | { ok: false }  (ok=false → eşleşme yok)
  function resolveToken(rawName) {
    const folded = foldTokenName(rawName);
    if (!folded) return { ok: false };

    const spec = LEGACY_ALIASES[folded];
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

  // Şablon metnindeki tüm {{...}} işaretlerini doldurur. HTML yorumları
  // (<!-- ... -->) önce ÇIKARILIR: hem şablon içi notlar Word çıktısına
  // sızmaz hem de yorumlarda örnek olarak yazılan {{...}} ifadeleri
  // "eşleşmedi" sayılmaz.
  function fillTemplate(templateText) {
    generatedTextCache = null; // her dolumda güncel değerler
    foldedFieldIndex = null;
    const missing = [];
    const withoutComments = String(templateText || "").replace(/<!--[\s\S]*?-->/g, "");
    const html = withoutComments.replace(/\{\{([^{}]+)\}\}/g, (match, name) => {
      const trimmed = String(name || "").trim();
      const resolved = resolveToken(trimmed);
      if (resolved.ok) return resolved.html;
      missing.push(trimmed);
      return `<span style="background:#ffe9a8;color:#7a5b00;font-weight:bold;">⚠ ${escapeHtmlSafe(trimmed)}</span>`;
    });
    return { html, missing };
  }

  function listTemplates() {
    return TEMPLATE_REGISTRY.map((entry) => ({ ...entry }));
  }

  function defaultTemplateKeyForBank(bankName) {
    const hit = TEMPLATE_REGISTRY.find((entry) => entry.bank && entry.bank === String(bankName || "").trim());
    return hit ? hit.key : "";
  }

  async function exportTemplate(templateKey) {
    const entry = TEMPLATE_REGISTRY.find((item) => item.key === templateKey);
    if (!entry) throw new Error(`Şablon bulunamadı: ${templateKey}`);
    const response = await fetch(`${entry.file}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`Şablon dosyası okunamadı: ${entry.file}`);
    const templateText = await response.text();
    if (/\{\{\s*(?:REPORT_MAPS_SECTION|LOCATION_MAP_SECTION|COMPARABLE_SKETCH_SECTION|LOCATION_MAP_IMAGE|COMPARABLE_SKETCH_IMAGE)\s*\}\}/i.test(templateText)) {
      safeCall("ensureReportMapImagesForExport");
    }
    const preparedAssets = await Promise.resolve(safeCall("buildSavedReportImageAssets"));
    reportImageAssetsCache = Array.isArray(preparedAssets) ? preparedAssets : [];
    try {
      const { html, missing } = fillTemplate(templateText);
      const fileName = `${safeCall("buildExportBaseFileName") || "rapor"}-${entry.key}.doc`;
      const packaged = reportImageAssetsCache.length
        ? safeCall("buildWordMhtmlPackage", html, reportImageAssetsCache)
        : "";
      safeCall("downloadTextFile", fileName, packaged || html, "application/msword;charset=utf-8");
      return { fileName, missing, title: entry.title };
    } finally {
      reportImageAssetsCache = [];
    }
  }

  window.RaporTemplates = {
    listTemplates,
    defaultTemplateKeyForBank,
    exportTemplate,
    fillTemplate,
    resolveToken,
    foldTokenName,
    register(entry) {
      if (entry && entry.key && entry.file) TEMPLATE_REGISTRY.push(entry);
    },
    // Test/denetim için: bilinen tüm takma adların katlanmış listesi
    _knownAliases: () => Object.keys(LEGACY_ALIASES),
  };
})();
