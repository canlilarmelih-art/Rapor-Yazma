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

  // İncelenen belgeler tablosundan ruhsat/iskan satırını "TÜR / TARİH / SAYI"
  // biçiminde birleştirir. c0=tür, c2=tarih, c3=no (bkz. app.js documents).
  function permitDoc(kind) {
    const s = appState();
    const rows = Array.isArray(s?.tables?.documents) ? s.tables.documents : [];
    const test =
      kind === "iskan"
        ? /iskan|kullanma|yap[ıi] kullan/i
        : /ruhsat|yap[ıi] kay[ıi]t/i;
    const hit = rows.find((row) => test.test(String(row?.c0 || "")));
    if (!hit) return "";
    const parts = [String(hit.c0 || "").trim(), String(hit.c2 || "").trim(), String(hit.c3 || "").trim()]
      .filter(Boolean);
    return parts.join(" / ");
  }

  function resolveCell(entry) {
    const field = entry.field;
    if (field === "saleability") {
      return fieldValue("saleability") || "SATILABİLİR";
    }
    if (field === "ZRT_RUHSAT") return permitDoc("ruhsat");
    if (field === "ZRT_ISKAN") return permitDoc("iskan");

    if (entry.type === "number") {
      return toNumber(fieldValue(field));
    }
    return fieldValue(field);
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

  window.RaporZiraatEkTablo = { export: exportXlsx, resolveCell, permitDoc };
})();
