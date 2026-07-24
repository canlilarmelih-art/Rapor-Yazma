"use strict";

/* =====================================================================
   RAPOR TABLOLARI — TEK EXCEL DOSYASI OLARAK DIŞA AKTARMA (2026-07-24)

   Amaç: Raporun farklı bölümlerinde (Malikler, Takyidat/Beyan/Şerh/İpotek,
   İncelenen Belgeler, Emsaller) doldurulan tüm tablo verilerini TEK bir
   .xlsx dosyasında, her biri ayrı sayfada olacak şekilde indirmek.

   Şablon doldurma değil, SIFIRDAN minimal geçerli bir OOXML .xlsx üretir;
   xlsx-fill.js'teki writeStoredZip/crc32 birimlerini yeniden kullanır (yeni
   bağımlılık eklemeden). Tüm hücreler t="inlineStr" ile yazılır — bu yüzden
   sharedStrings.xml/styles.xml gerekmez, dosya minimal ve bağımsız kalır.

   Bu dosya app.js VE xlsx-fill.js'ten SONRA yüklenir; global
   window.RaporReportTablesXlsx sağlar.
   ===================================================================== */
(function () {
  const enc = new TextEncoder();

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function columnLetter(index) {
    let n = index + 1;
    let letters = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      letters = String.fromCharCode(65 + rem) + letters;
      n = Math.floor((n - 1) / 26);
    }
    return letters;
  }

  function sanitizeSheetName(name, usedNames) {
    let base = String(name || "Sayfa")
      .replace(/[:\\/?*[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Sayfa";
    let candidate = base;
    let suffix = 2;
    while (usedNames.has(candidate)) {
      candidate = `${base.slice(0, 28)} ${suffix}`;
      suffix += 1;
    }
    usedNames.add(candidate);
    return candidate;
  }

  // rows: string[][] (ilk satır başlık kabul edilmez, ayrı verilir)
  function buildSheetXml(header, rows) {
    const allRows = header ? [header, ...rows] : rows;
    const rowsXml = allRows
      .map((row, rowIndex) => {
        const r = rowIndex + 1;
        const cells = row
          .map((value, colIndex) => {
            const raw = String(value ?? "");
            if (!raw) return "";
            const preserve = /^\s|\s$/.test(raw) ? ' xml:space="preserve"' : "";
            return `<c r="${columnLetter(colIndex)}${r}" t="inlineStr"><is><t${preserve}>${xmlEscape(raw)}</t></is></c>`;
          })
          .join("");
        return `<row r="${r}">${cells}</row>`;
      })
      .join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  }

  function buildWorkbookXml(sheetNames) {
    const sheetsXml = sheetNames
      .map((name, index) => `<sheet name="${xmlEscape(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
      .join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetsXml}</sheets></workbook>`;
  }

  function buildWorkbookRelsXml(count) {
    const rels = Array.from({ length: count }, (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
    ).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
  }

  function buildContentTypesXml(count) {
    const overrides = Array.from({ length: count }, (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    ).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${overrides}</Types>`;
  }

  const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  // sheets: [{ name, header: string[], rows: string[][] }]
  function buildWorkbookBlob(sheets) {
    const entries = [
      { name: "[Content_Types].xml", bytes: enc.encode(buildContentTypesXml(sheets.length)) },
      { name: "_rels/.rels", bytes: enc.encode(ROOT_RELS_XML) },
      { name: "xl/workbook.xml", bytes: enc.encode(buildWorkbookXml(sheets.map((s) => s.name))) },
      { name: "xl/_rels/workbook.xml.rels", bytes: enc.encode(buildWorkbookRelsXml(sheets.length)) },
      ...sheets.map((sheet, index) => ({
        name: `xl/worksheets/sheet${index + 1}.xml`,
        bytes: enc.encode(buildSheetXml(sheet.header, sheet.rows)),
      })),
    ];
    const zipped = window.RaporXlsxFill.writeStoredZip(entries);
    return new Blob([zipped], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  // --- Rapor tablolarını app.js global'lerinden topla --------------------
  function collectTableDefs() {
    const defs = [];
    const allSections = typeof sections !== "undefined" ? sections : [];
    allSections.forEach((section) => {
      if (section.table && section.id !== "encumbrance") {
        defs.push({ key: section.id, title: section.table.title, columns: section.table.columns });
      }
    });
    const groupTables = typeof encumbranceReportTables !== "undefined" ? encumbranceReportTables : [];
    const fallbackColumns = typeof encumbranceReportColumns !== "undefined" ? encumbranceReportColumns : [];
    groupTables.forEach((group) => {
      defs.push({ key: group.key, title: group.title, columns: group.columns || fallbackColumns });
    });
    return defs;
  }

  function buildCoverSheetRows() {
    const fields = typeof state !== "undefined" ? state.fields || {} : {};
    const rows = [
      ["İş Adı", fields.caseName || ""],
      ["Banka", fields.bank || ""],
      ["Müşteri / Talep Eden", fields.customerName || ""],
      ["İl / İlçe", [fields.city, fields.district].filter(Boolean).join(" / ")],
      ["Ada / Parsel", [fields.blockNo, fields.parcelNo].filter(Boolean).join(" / ")],
      ["Randevu Türü", fields.appointmentType || ""],
    ];
    return rows.filter((row) => row[1]);
  }

  function isRowFilled(row) {
    return Object.values(row || {}).some((value) => String(value ?? "").trim());
  }

  function buildSheetsFromCurrentState() {
    const usedNames = new Set();
    const sheets = [
      { name: sanitizeSheetName("Genel Bilgiler", usedNames), header: ["Alan", "Değer"], rows: buildCoverSheetRows() },
    ];
    collectTableDefs().forEach((def) => {
      const tableState = (typeof state !== "undefined" && state.tables && state.tables[def.key]) || [];
      const filledRows = tableState.filter(isRowFilled);
      const rows = filledRows.map((row) => def.columns.map((_, columnIndex) => row[`c${columnIndex}`] || ""));
      sheets.push({ name: sanitizeSheetName(def.title, usedNames), header: def.columns, rows });
    });
    return sheets;
  }

  function exportAllTables() {
    const sheets = buildSheetsFromCurrentState();
    const blob = buildWorkbookBlob(sheets);
    const baseName = (typeof buildExportBaseFileName === "function" && buildExportBaseFileName()) || "rapor";
    const fileName = `${baseName}-tum-tablolar.xlsx`;
    window.RaporXlsxFill.downloadBlob(fileName, blob);
    const rowCount = sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0);
    return { fileName, sheetCount: sheets.length, rowCount };
  }

  window.RaporReportTablesXlsx = { exportAllTables };
})();
