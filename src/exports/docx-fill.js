"use strict";

/* =====================================================================
   DOCX ŞABLON DOLDURMA MOTORU (tarayıcı, bağımlılıksız) — 2026-08-03

   Kullanıcı talebi: "word formatını bozmamalıydın logolar sayfa yapısı
   çerçeveler... template dosyasını word olarak tutabilirsin" — Emlak
   Katılım gibi bankalarda kullanıcının bize sunduğu GERÇEK Word raporu
   templates/ altında GERÇEK bir .docx olarak tutulur (HTML'e ÇEVRİLMEZ).
   Bu motor, şablonun word/document.xml'i İÇİNDEKİ {{TOKEN}} yer
   tutucularını (tokenler örnek metnin YERİNE, biz tarafımızdan tek bir
   run içine elle yazıldı — Word'ün metni run'lara bölme huyundan
   etkilenmez) düz metin değerlerle değiştirir; belgenin geri kalanı
   (logo, çerçeve, stil, sayfa düzeni, TÜM diğer runlar) BAYT BAZINDA
   AYNEN korunur.

   xlsx-fill.js ile AYNI STORED-zip okuma/yazma tekniğini kullanır (zip
   inflate/deflate kütüphanesi olmadan okunup yazılabilmesi için şablon
   STORED paketlenmiştir — bkz. templates/emlakkatilim.docx).

   Bu dosya app.js'ten SONRA yüklenir; global window.RaporDocxFill sağlar.
   ===================================================================== */
(function () {
  // --- CRC32 (zip için) --- xlsx-fill.js ile aynı, kasıtlı olarak
  // bağımsız kopya (her iki motor da tek başına, bağımlılıksız çalışsın).
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

  function readStoredZip(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const bytes = new Uint8Array(arrayBuffer);
    const entries = [];
    let off = 0;
    while (off + 4 <= bytes.length) {
      const sig = view.getUint32(off, true);
      if (sig !== 0x04034b50) break;
      const method = view.getUint16(off + 8, true);
      const compSize = view.getUint32(off + 18, true);
      const nameLen = view.getUint16(off + 26, true);
      const extraLen = view.getUint16(off + 28, true);
      const nameStart = off + 30;
      const name = dec.decode(bytes.subarray(nameStart, nameStart + nameLen));
      const dataStart = nameStart + nameLen + extraLen;
      if (method !== 0) {
        throw new Error(`DOCX şablonu STORED değil (${name} method=${method}). Şablon sıkıştırmasız paketlenmeli.`);
      }
      const data = bytes.subarray(dataStart, dataStart + compSize);
      entries.push({ name, bytes: data });
      off = dataStart + compSize;
    }
    if (!entries.length) throw new Error("DOCX şablonu okunamadı (geçerli zip girişi yok).");
    return entries;
  }

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
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, 0, true);
      lv.setUint16(12, 0x21, true);
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);
      push(lh);
      push(e.bytes);

      const ch = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
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

  // resolveTemplateTokenValues() değerleri HTML-kaçışlı üretiliyor (aynı
  // motor {{PLACEHOLDER}}'ları HTML şablonlara da basıyor). Word XML metni
  // için: HTML entity'lerini çöz, <br/> ve paragraf sınırlarını tek boşluğa
  // indir (çoklu <w:r>/<w:p> bölme karmaşıklığından kaçınmak için — orijinal
  // Word belgesindeki tek-paragraflık boş alanlarla tutarlı), kalan
  // etiketleri at, sonra XML için kaçışla.
  function htmlValueToXmlText(html) {
    const text = String(html ?? "")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>\s*<p[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function collectTokens(xmlText) {
    const tokens = new Set();
    xmlText.replace(/\{\{([^{}]+)\}\}/g, (match, name) => {
      const trimmed = String(name || "").trim();
      // {{BOLD:AD}} isaretleri gercek deger placeholder'i DEGIL — ayri bir
      // mekanizma (applyBoldMarkers) tarafindan islenir, resolveTemplateTokenValues
      // icin normal "token" sayilmamali (aksi halde hep "missing" cikardi).
      if (trimmed && !trimmed.startsWith("BOLD:")) tokens.add(trimmed);
      return match;
    });
    return [...tokens];
  }

  // "2.1 Çevre Analizi"/"5.5 Kira Kabiliyeti" gibi Word'de AYRI hücrelerde
  // duran çoktan-seçmeli alanlar için: şablon hazırlanırken her seçenek
  // metninin BAŞINA {{BOLD:AD}} işareti kondu (bkz. templates/emlakkatilim.docx
  // hazırlık notları, CLAUDE.md). Burada boldFlags[AD] true olan işaretli
  // run'ın <w:rPr>'ına <w:b/><w:bCs/> eklenir (yoksa oluşturulur), işaret
  // metinden SİLİNİR — false/tanımsız olanlarda yalnızca işaret silinir,
  // biçim değişmez.
  function applyBoldMarkers(xmlText, boldFlags) {
    const flags = boldFlags || {};
    const runPattern = /<w:r>((?:(?!<w:r>|<\/w:r>)[\s\S])*?)<w:t([^>]*)>\{\{BOLD:([A-Za-z0-9_]+)\}\}([^<]*)<\/w:t>((?:(?!<w:r>|<\/w:r>)[\s\S])*?)<\/w:r>/g;
    return xmlText.replace(runPattern, (match, beforeT, tAttrs, name, text, afterT) => {
      let before = beforeT;
      if (flags[name]) {
        before = /<w:rPr>/.test(before)
          ? before.replace(/<w:rPr>/, "<w:rPr><w:b/><w:bCs/>")
          : `<w:rPr><w:b/><w:bCs/></w:rPr>${before}`;
      }
      return `<w:r>${before}<w:t${tAttrs}>${text}</w:t>${afterT}</w:r>`;
    });
  }

  // --- Ana API ---------------------------------------------------------
  // arrayBuffer: STORED .docx şablonu (fetch edilmiş ham bayt)
  // values: { TOKEN: htmlValue } — window.RaporTemplates.resolveTemplateTokenValues() çıktısı
  // boldFlags: { AD: boolean } — çoktan-seçmeli alanlarda hangi {{BOLD:AD}}
  // işaretli seçeneğin kalınlaştırılacağı (bkz. applyBoldMarkers)
  function fillTemplate(arrayBuffer, values, boldFlags) {
    const entries = readStoredZip(arrayBuffer);
    const docEntry = entries.find((e) => e.name === "word/document.xml");
    if (!docEntry) throw new Error("DOCX şablonunda word/document.xml bulunamadı.");

    let xmlText = applyBoldMarkers(dec.decode(docEntry.bytes), boldFlags);
    const tokens = collectTokens(xmlText);
    const missing = [];

    tokens.forEach((token) => {
      const pattern = new RegExp(`\\{\\{${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\}\\}`, "g");
      if (!Object.prototype.hasOwnProperty.call(values || {}, token)) {
        missing.push(token);
        return;
      }
      const xmlValue = htmlValueToXmlText(values[token]);
      xmlText = xmlText.replace(pattern, xmlValue);
    });

    const outEntries = entries.map((e) => (
      e === docEntry ? { name: e.name, bytes: enc.encode(xmlText) } : e
    ));
    const zipped = writeStoredZip(outEntries);
    return {
      blob: new Blob([zipped], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      bytes: zipped,
      missing,
    };
  }

  window.RaporDocxFill = {
    fillTemplate,
    collectTokens,
    applyBoldMarkers,
    htmlValueToXmlText,
    crc32,
    readStoredZip,
    writeStoredZip,
  };
})();
