"use strict";

/* =====================================================================
   ZİRAAT BANKASI EK TABLO — XLSX DIŞA AKTARMA (tarayıcı)  — 2026-07-20

   templates/ziraat-ek-tablo.xlsx (4 sayfa: TARLA, ARSA, KONUT-İŞYERLERİ,
   NİTELİKLİ GAYRİMENKUL) STORED şablonunu, rapor verisiyle doldurup
   .xlsx olarak indirir. Doldurma koordinatları
   src/exports/ziraat-ek-tablo-manifest.json içindedir.

   Şablonun stil/formül/birleştirme yapısı zip içinden birebir korunur;
   yalnızca manifest'teki giriş hücreleri (birincil gayrimenkul) doldurulur.
   Ek gayrimenkuller için kullanıcı Excel'de satırları çoğaltır (kaynak
   dosyanın kendi mantığı: "SARI İLE BOYALI ALANLARA GİRİŞ YAPILMALIDIR").

   app.js'ten SONRA yüklenir; window.RaporXlsxFill'e bağımlıdır.
   Global: window.RaporZiraatEkTablo.export()
   ===================================================================== */
(function () {
  const TEMPLATE_URL = "templates/ziraat-ek-tablo.xlsx";
  const MANIFEST_URL = "src/exports/ziraat-ek-tablo-manifest.json";

  // app.js global'leri classic-script paylaşımlı kapsamda BARE isimle
  // erişilir (state `let` olduğundan window.state DEĞİL). template-engine.js
  // ile aynı desen.
  function appState() {
    try {
      return typeof state !== "undefined" ? state : null;
    } catch (error) {
      return null;
    }
  }

  function fieldValue(key) {
    const s = appState();
    return String(s?.fields?.[key] ?? "").trim();
  }

  function toNumber(value) {
    try {
      if (typeof parseValuationNumber === "function") {
        const n = parseValuationNumber(value);
        return Number.isFinite(n) ? n : 0;
      }
    } catch (error) {
      /* yerel ayrıştırmaya düş */
    }
    const n = Number(String(value ?? "").replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function documentRows() {
    const s = appState();
    return Array.isArray(s?.tables?.documents) ? s.tables.documents : [];
  }

  // Belge satırını "TÜR / TARİH / SAYI" biçiminde birleştirir
  // (c0=tür, c2=tarih, c3=no; bkz. app.js documents tablosu).
  function formatDoc(row) {
    if (!row) return "";
    return [String(row.c0 || "").trim(), formatDocDate(row.c2), String(row.c3 || "").trim()]
      .filter(Boolean)
      .join(" / ");
  }

  function formatDocDate(value) {
    const s = String(value || "").trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);
    if (m) return `${m[3].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[1]}`;
    m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
    if (m) return `${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[3]}`;
    return s;
  }

  // dd.mm.yyyy veya yyyy-mm-dd → karşılaştırılabilir sayı (yyyymmdd).
  function docDateKey(value) {
    const s = String(value || "").trim();
    let m = s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (m) return Number(`${m[3]}${m[2].padStart(2, "0")}${m[1].padStart(2, "0")}`);
    m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return Number(`${m[1]}${m[2]}${m[3]}`);
    return 0;
  }

  // Türkçe-katlama: İ/ı/Ş/Ğ/Ü/Ö/Ç → ascii + küçük harf. JS'in /i case-insensitive
  // eşleşmesi Türkçe İ (U+0130) ile "i"yi eşleştirmez; bu yüzden belge türü
  // tespitinde katlanmış metin üzerinde includes ile bakarız.
  function foldTr(value) {
    return String(value || "")
      .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
      .replace(/Ş/g, "s").replace(/ş/g, "s")
      .replace(/Ğ/g, "g").replace(/ğ/g, "g")
      .replace(/Ü/g, "u").replace(/ü/g, "u")
      .replace(/Ö/g, "o").replace(/ö/g, "o")
      .replace(/Ç/g, "c").replace(/ç/g, "c")
      .toLowerCase();
  }

  function isIskanDoc(c0) {
    const f = foldTr(c0);
    return f.includes("iskan") || f.includes("kullanim izin") || f.includes("kullanma izin") || f.includes("yapi kullan");
  }

  function isRuhsatDoc(c0) {
    const f = foldTr(c0);
    return f.includes("ruhsat");
  }

  // Kullanıcı kuralı: yapı kullanma izin belgesi (iskan) VARSA yalnızca onu;
  // YOKSA en güncel (son) ruhsatı döndür.
  function buildingDoc() {
    const rows = documentRows();
    const iskan = rows.find((row) => isIskanDoc(row?.c0));
    if (iskan) return formatDoc(iskan);
    const ruhsat = rows.filter((row) => isRuhsatDoc(row?.c0));
    if (!ruhsat.length) return "";
    const last = ruhsat.reduce((a, b) => (docDateKey(b.c2) >= docDateKey(a.c2) ? b : a));
    return formatDoc(last);
  }

  // Bazı alanların doğal yedeği var: değerleme alanı boşsa kullanım alanına düş.
  const FIELD_FALLBACKS = {
    legalValueArea: "legalArea",
    currentValueArea: "currentArea",
  };

  function rawField(key) {
    const value = fieldValue(key);
    return value || (FIELD_FALLBACKS[key] ? fieldValue(FIELD_FALLBACKS[key]) : "");
  }

  function numberField(key) {
    return toNumber(rawField(key));
  }

  function resolveCell(entry) {
    const field = entry.field;
    if (field === "saleability") {
      return fieldValue("saleability") || "SATILABİLİR";
    }
    if (field === "ZRT_BUILDING_DOC") return buildingDoc();
    // Birim değer önbellekleri, tablodaki formülle (=değer/alan) aynı alanları
    // kullanmalı: alan hücresi legalValueArea/currentValueArea (yedeği
    // legalArea/currentArea) ile doldurulur.
    if (field === "ZRT_LEGAL_UNIT_VALUE") {
      const area = numberField("legalValueArea");
      return area > 0 ? numberField("legalValue") / area : 0;
    }
    if (field === "ZRT_CURRENT_UNIT_VALUE") {
      const area = numberField("currentValueArea");
      return area > 0 ? numberField("currentValue") / area : 0;
    }
    // Terk sonrası parsel alanı: app'te ayrı bir alan değil, yola terk
    // miktarından hesaplanır (bkz. getPostRoadSetbackParcelArea).
    if (field === "ZRT_POST_SETBACK_AREA") {
      let text = "";
      try {
        if (typeof getPostRoadSetbackParcelArea === "function") text = getPostRoadSetbackParcelArea();
      } catch (error) {
        text = "";
      }
      return toNumber(text) || toNumber(fieldValue("landArea"));
    }

    const raw = rawField(field);
    return entry.type === "number" || entry.type === "formulaNumber" ? toNumber(raw) : raw;
  }

  async function loadManifest() {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error("Ziraat ek tablo manifest'i indirilemedi.");
    return res.json();
  }

  function buildFileName() {
    let base = "ziraat-ek-tablo";
    try {
      if (typeof buildExportBaseFileName === "function") base = buildExportBaseFileName();
    } catch (error) {
      /* varsayılan */
    }
    return `${base}-ek-tablo.xlsx`;
  }

  async function exportXlsx() {
    if (!window.RaporXlsxFill) throw new Error("XLSX doldurma motoru yüklenmedi (xlsx-fill.js).");
    const manifest = await loadManifest();
    const blob = await window.RaporXlsxFill.fillTemplate(TEMPLATE_URL, manifest, resolveCell);
    window.RaporXlsxFill.downloadBlob(buildFileName(), blob);
    return { count: manifest.cells.length };
  }

  window.RaporZiraatEkTablo = { export: exportXlsx, resolveCell, buildingDoc };
})();
