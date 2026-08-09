"use strict";

// Çoklu talep/UAVT listesi için bağımlılıksız, küçük XLSX okuyucu-yazıcı.
(function () {
  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function columnLetter(index) {
    let n = index + 1;
    let result = "";
    while (n > 0) {
      const remainder = (n - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      n = Math.floor((n - 1) / 26);
    }
    return result;
  }

  function normalizeHeader(value) {
    return String(value ?? "")
      .trim()
      .toLocaleLowerCase("tr-TR")
      .replace(/[çÇ]/g, "c")
      .replace(/[ğĞ]/g, "g")
      .replace(/[ıİ]/g, "i")
      .replace(/[öÖ]/g, "o")
      .replace(/[şŞ]/g, "s")
      .replace(/[üÜ]/g, "u")
      .replace(/[\s_\-\/]+/g, "");
  }

  function buildSheetXml(rows) {
    const rowsXml = rows.map((row, rowIndex) => {
      const cellsXml = row.map((value, columnIndex) => {
        const text = String(value ?? "");
        if (!text) return "";
        const cellRef = `${columnLetter(columnIndex)}${rowIndex + 1}`;
        return `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(text)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    }).join("");
    const columnCount = Math.max(1, ...rows.map((row) => row.length));
    const cols = Array.from({ length: columnCount }, (_, index) =>
      `<col min="${index + 1}" max="${index + 1}" width="18" customWidth="1"/>`
    ).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${rowsXml}</sheetData></worksheet>`;
  }

  function workbookEntries(sheetXml) {
    const enc = new TextEncoder();
    return [
      { name: "[Content_Types].xml", bytes: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`) },
      { name: "_rels/.rels", bytes: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
      { name: "xl/workbook.xml", bytes: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Çoklu Talepler" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
      { name: "xl/_rels/workbook.xml.rels", bytes: enc.encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`) },
      { name: "xl/worksheets/sheet1.xml", bytes: enc.encode(sheetXml) },
    ];
  }

  function exportRows(rows, fileName = "coklu-talepler.xlsx") {
    if (!window.RaporXlsxFill?.writeStoredZip) throw new Error("Excel motoru yüklenemedi.");
    const bytes = window.RaporXlsxFill.writeStoredZip(workbookEntries(buildSheetXml(rows)));
    const blob = new Blob([bytes], { type: XLSX_MIME });
    window.RaporXlsxFill.downloadBlob(fileName, blob);
    return blob;
  }

  function readU16(view, offset) { return view.getUint16(offset, true); }
  function readU32(view, offset) { return view.getUint32(offset, true); }

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("Bu tarayıcı Excel sıkıştırmasını okuyamıyor. Excel dosyasını CSV olarak kaydedip tekrar yükleyin.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader = stream.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      chunks.push(part.value);
      total += part.value.length;
    }
    const result = new Uint8Array(total);
    let offset = 0;
    chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.length; });
    return result;
  }

  async function readZipEntries(buffer) {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let eocd = -1;
    for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
      if (readU32(view, index) === 0x06054b50) { eocd = index; break; }
    }
    if (eocd < 0) throw new Error("Geçerli bir XLSX ZIP paketi bulunamadı.");
    const count = readU16(view, eocd + 10);
    const centralOffset = readU32(view, eocd + 16);
    const decoder = new TextDecoder();
    const entries = new Map();
    let cursor = centralOffset;
    for (let index = 0; index < count; index += 1) {
      if (readU32(view, cursor) !== 0x02014b50) throw new Error("XLSX merkezi dizini okunamadı.");
      const method = readU16(view, cursor + 10);
      const compressedSize = readU32(view, cursor + 20);
      const nameLength = readU16(view, cursor + 28);
      const extraLength = readU16(view, cursor + 30);
      const commentLength = readU16(view, cursor + 32);
      const localOffset = readU32(view, cursor + 42);
      const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
      const localNameLength = readU16(view, localOffset + 26);
      const localExtraLength = readU16(view, localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(dataStart, dataStart + compressedSize);
      const data = method === 0 ? compressed : method === 8 ? await inflateRaw(compressed) : null;
      if (!data) throw new Error(`XLSX sıkıştırma yöntemi desteklenmiyor: ${method}`);
      entries.set(name, data);
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [], cell = "", quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];
      if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === ";" && !quoted) { row.push(cell); cell = ""; continue; }
      if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") index += 1;
        row.push(cell); cell = "";
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
        continue;
      }
      cell += char;
    }
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
    return rows;
  }

  function parseSheetXml(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("XLSX çalışma sayfası okunamadı.");
    return [...xml.querySelectorAll("row")].map((row) => {
      const values = [];
      row.querySelectorAll("c").forEach((cell) => {
        const ref = cell.getAttribute("r") || "A1";
        const match = ref.match(/^([A-Z]+)/i);
        let col = 0;
        if (match) [...match[1].toUpperCase()].forEach((char) => { col = col * 26 + char.charCodeAt(0) - 64; });
        col -= 1;
        let value = cell.querySelector("is t")?.textContent || cell.querySelector("v")?.textContent || "";
        while (values.length <= col) values.push("");
        values[col] = value;
      });
      return values;
    });
  }

  async function readRows(file) {
    const name = String(file?.name || "").toLocaleLowerCase("tr-TR");
    if (name.endsWith(".csv")) return parseCsv(await file.text());
    const entries = await readZipEntries(await file.arrayBuffer());
    const decoder = new TextDecoder();
    const sheetName = [...entries.keys()].find((key) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(key));
    if (!sheetName) throw new Error("XLSX içinde çalışma sayfası bulunamadı.");
    return parseSheetXml(decoder.decode(entries.get(sheetName)));
  }

  window.RaporMultiRequestXlsx = { exportRows, readRows, normalizeHeader };
})();
