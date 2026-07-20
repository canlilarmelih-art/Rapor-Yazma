"use strict";

/* =====================================================================
   XLSX ŞABLON DOLDURMA MOTORU (tarayıcı, bağımlılıksız)  — 2026-07-20

   Amaç: templates/ altındaki STORED (sıkıştırmasız) bir .xlsx şablonunu
   tarayıcıda okuyup, koordinat bazlı bir manifest'e göre hücre değerlerini
   (tip korunarak) doldurup indirilebilir bir .xlsx blob'u üretmek.

   Neden STORED şablon: sıkıştırmasız zip girişleri inflate/deflate
   kütüphanesi olmadan okunup yeniden yazılabilir. Şablon Python tarafında
   ZIP_STORED ile paketlenir (bkz. scratchpad/build_ziraat_ek_tablo.py ve
   handoff). Şablonun TÜM stili/formülü/birleştirmesi zip içinden birebir
   korunur; biz yalnızca manifest'teki giriş hücrelerinin iç değerini
   değiştiririz.

   openpyxl şablonda:
     - metin giriş hücresi:  <c r="B3" s="53" t="inlineStr"><is><t>TOKEN</t></is></c>
     - sayı giriş hücresi:    <c r="D3" s="54" t="n"><v>0</v></c>
   Bu ikisinin İÇ değerini hedefli regex ile değiştiririz; stil (s) ve tip
   (t) attribute'una dokunmayız.

   Bu dosya app.js'ten SONRA yüklenir; global window.RaporXlsxFill sağlar.
   ===================================================================== */
(function () {
  // --- CRC32 (zip için) ---------------------------------------------
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  const enc = new TextEncoder();
  const dec = new TextDecoder("utf-8");

  // --- STORED zip okuma (local file header'ları sırayla gez) --------
  // Dönüş: [{name, bytes(Uint8Array)}] giriş sırasıyla.
  function readStoredZip(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    const entries = [];
    let off = 0;
    while (off + 4 <= bytes.length) {
      const sig = view.getUint32(off, true);
      if (sig !== 0x04034b50) break; // local file header değil (merkezi dizine geldik)
      const method = view.getUint16(off + 8, true);
      const compSize = view.getUint32(off + 18, true);
      const nameLen = view.getUint16(off + 26, true);
      const extraLen = view.getUint16(off + 28, true);
      const nameStart = off + 30;
      const name = dec.decode(bytes.subarray(nameStart, nameStart + nameLen));
      const dataStart = nameStart + nameLen + extraLen;
      if (method !== 0) {
        throw new Error(`XLSX şablonu STORED değil (${name} method=${method}). Şablon sıkıştırmasız paketlenmeli.`);
      }
      const data = bytes.subarray(dataStart, dataStart + compSize);
      entries.push({ name, bytes: data });
      off = dataStart + compSize;
    }
    if (!entries.length) throw new Error("XLSX şablonu okunamadı (geçerli zip girişi yok).");
    return entries;
  }

  // --- STORED zip yazma ---------------------------------------------
  function writeStoredZip(entries) {
    const chunks = [];
    const central = [];
    let offset = 0;

    function push(u8) {
      chunks.push(u8);
      offset += u8.length;
    }

    for (const e of entries) {
      const nameBytes = enc.encode(e.name);
      const crc = crc32(e.bytes);
      const size = e.bytes.length;
      const localOffset = offset;

      const lh = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true); // version
      lv.setUint16(6, 0, true); // flags
      lv.setUint16(8, 0, true); // method STORED
      lv.setUint16(10, 0, true); // time
      lv.setUint16(12, 0x21, true); // date (1980-01-01)
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true); // compressed
      lv.setUint32(22, size, true); // uncompressed
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true); // extra len
      lh.set(nameBytes, 30);
      push(lh);
      push(e.bytes);

      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true); // version made by
      cv.setUint16(6, 20, true); // version needed
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true); // method
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true); // extra
      cv.setUint16(32, 0, true); // comment
      cv.setUint16(34, 0, true); // disk
      cv.setUint16(36, 0, true); // internal attrs
      cv.setUint32(38, 0, true); // external attrs
      cv.setUint32(42, localOffset, true);
      ch.set(nameBytes, 46);
      central.push(ch);
    }

    const centralStart = offset;
    let centralSize = 0;
    for (const c of central) {
      push(c);
      centralSize += c.length;
    }

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralStart, true);
    push(eocd);

    const out = new Uint8Array(offset);
    let p = 0;
    for (const c of chunks) {
      out.set(c, p);
      p += c.length;
    }
    return out;
  }

  // --- XML güvenli değer ---------------------------------------------
  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Bir sheet XML'inde tek bir hücreyi (stil korunarak) yeniden kur.
  //  - number: <c r="D3" s="S"><v>NUM</v></c>            (t yok = sayı)
  //  - text:   <c r="B3" s="S" t="inlineStr"><is><t>VAL</t></is></c>
  // Hücre şablonda yoksa (beklenmez) sessizce atlar. r="COORD" içindeki
  // kapanış tırnağı tam eşleşmeyi garanti eder (r="B3" → r="B33" ile karışmaz).
  function setCellValue(xml, coord, type, value) {
    const cellRe = new RegExp(`<c r="${coord}"([^>]*?)(?:/>|>[\\s\\S]*?</c>)`);
    const m = xml.match(cellRe);
    if (!m) return xml;
    const attrs = m[1] || "";
    const sMatch = attrs.match(/\ss="\d+"/);
    const sAttr = sMatch ? sMatch[0] : "";
    let cell;
    const formula = m[0].match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/)?.[1];
    if (type === "formulaNumber" && formula != null) {
      let num = value;
      if (typeof num !== "number" || !isFinite(num)) num = 0;
      cell = `<c r="${coord}"${sAttr}><f>${formula}</f><v>${num}</v></c>`;
    } else if (type === "formulaText" && formula != null) {
      cell = `<c r="${coord}"${sAttr} t="str"><f>${formula}</f><v>${xmlEscape(value)}</v></c>`;
    } else if (type === "number") {
      let num = value;
      if (typeof num !== "number" || !isFinite(num)) num = 0;
      cell = `<c r="${coord}"${sAttr}><v>${num}</v></c>`;
    } else {
      const raw = String(value ?? "");
      const preserve = /^\s|\s$/.test(raw) ? ' xml:space="preserve"' : "";
      cell = `<c r="${coord}"${sAttr} t="inlineStr"><is><t${preserve}>${xmlEscape(raw)}</t></is></c>`;
    }
    return xml.replace(cellRe, cell);
  }

  function enableFullCalculation(xml) {
    const flags = ' calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"';
    if (/<calcPr\b[^>]*\/>/.test(xml)) {
      return xml.replace(/<calcPr\b[^>]*\/>/, `<calcPr${flags}/>`);
    }
    if (/<calcPr\b[^>]*>/.test(xml)) {
      return xml.replace(/<calcPr\b[^>]*>/, `<calcPr${flags}>`);
    }
    return xml.replace(/<\/workbook>/, `<calcPr${flags}/></workbook>`);
  }

  // --- Ana API -------------------------------------------------------
  // templateUrl: STORED xlsx yolu (ör "templates/ziraat-ek-tablo.xlsx")
  // manifest: { cells: [{sheetIndex, cell, type, ...}] }
  // resolve(entry) → değer (number entry.type==='number' ise sayı; değilse metin)
  async function fillTemplate(templateUrl, manifest, resolve) {
    const res = await fetch(`${templateUrl}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Şablon indirilemedi: ${templateUrl}`);
    const buf = await res.arrayBuffer();
    const entries = readStoredZip(buf);

    // sheetIndex → xl/worksheets/sheetN.xml
    const sheetXml = new Map(); // index → {name, text}
    for (const e of entries) {
      const m = e.name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
      if (m) sheetXml.set(Number(m[1]), { name: e.name, text: dec.decode(e.bytes) });
    }

    for (const cell of manifest.cells) {
      const sheet = sheetXml.get(cell.sheetIndex);
      if (!sheet) continue;
      const value = resolve(cell);
      sheet.text = setCellValue(sheet.text, cell.cell, cell.type, value);
    }

    const outEntries = entries.map((e) => {
      const m = e.name.match(/^xl\/worksheets\/sheet(\d+)\.xml$/);
      if (m && sheetXml.has(Number(m[1]))) {
        return { name: e.name, bytes: enc.encode(sheetXml.get(Number(m[1])).text) };
      }
      if (e.name === "xl/workbook.xml") {
        return { name: e.name, bytes: enc.encode(enableFullCalculation(dec.decode(e.bytes))) };
      }
      return e;
    });

    const zipped = writeStoredZip(outEntries);
    return new Blob([zipped], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  function downloadBlob(fileName, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.RaporXlsxFill = { fillTemplate, downloadBlob, crc32, readStoredZip, writeStoredZip, setCellValue };
})();
