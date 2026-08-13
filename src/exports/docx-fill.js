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
  // Kullanici talebi (2026-08-04): "beyanlar şerhler rehinler hak ve
  // mükellefiyetler bölümünde yer alan her kayıt yeni bir satırdan
  // başlamalı" — eskiden <br/>/<p> sinirlari TEK BIR BOSLUGA duzlestirilip
  // butun kayitlar ayni satirda birlesiyordu. Artik bu sinirlar gercek bir
  // Word satir sonuna (<w:br/>) donusuyor. <w:t> icine DOGRUDAN <w:br/>
  // konulamaz (OOXML semasinda gecersiz) — bu yuzden once benzersiz, hicbir
  // gercek metinde gecmeyecek bir isaretle (BREAK_MARKER) yer tutuluyor,
  // XML kacislama TAMAMLANDIKTAN SONRA bu isaret gercek
  // "</w:t><w:br/><w:t xml:space=\"preserve\">" dizisiyle degistiriliyor —
  // boylece {{TOKEN}} orijinal <w:t>...</w:t> icinde tek basina oldugu
  // surece sonuc hala gecerli OOXML (ayni <w:r> icinde birden fazla
  // <w:t>/<w:br/> kardes eleman semaya uygun).
  const BREAK_MARKER = "WORDBREAK";

  function htmlValueToXmlText(html) {
    const text = String(html ?? "")
      .replace(/<br\s*\/?>/gi, BREAK_MARKER)
      .replace(/<\/p>\s*<p[^>]*>/gi, BREAK_MARKER)
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/[ \t\r\n\f\v]+/g, " ")
      .trim();
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
    return escaped
      .split(BREAK_MARKER)
      .map((segment) => segment.trim())
      .filter(Boolean)
      .join('</w:t><w:br/><w:t xml:space="preserve">');
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

  // Kullanıcı talebi (2026-08-04): "emsal krokisi çıkmıyor word'de" —
  // {{EMSAL_KROKISI}} HTML şablonlarda gerçek bir <img> üretiyordu (bkz.
  // reportImageHtml("comparables")), ama docx yolunda hem bu görsel varlık
  // hiç hazırlanmıyordu (exportDocxTemplate ensureReportMapImagesForExport/
  // buildSavedReportImageAssets'i hiç çağırmıyordu) HEM DE htmlValueToXmlText
  // zaten TÜM HTML etiketlerini (dolayısıyla <img>'i) düz metne çevirirken
  // siliyordu — .docx'e GERÇEK bir görsel gömmek text-substitution ile
  // MÜMKÜN DEĞİL, word/media/ + ilişki (rels) + <w:drawing> XML'i gerekiyor
  // (bkz. CLAUDE.md "8. Ekler ... kapsam dışı" notu — bu segment o notu
  // Emsal Krokisi için kaldırıyor).
  const IMAGE_TOKEN_ASSET_KEYS = { EMSAL_KROKISI: "comparables" };

  // Basit JPEG SOF (Start Of Frame) ayrıştırıcı — yalnızca genişlik/
  // yükseklik piksel boyutlarını okur, resmi decode etmez (bağımlılıksız).
  function getJpegPixelSize(bytes) {
    if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return null;
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
      if (marker >= 0xd0 && marker <= 0xd7) { offset += 2; continue; }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      offset += 2 + length;
    }
    return null;
  }

  function base64ToBytes(base64) {
    const binary = atob(String(base64 || ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  // Sablon hucresinin (emlakkatilim.docx'te Emsal Krokisi hucresi
  // trHeight="4629" twip ~ 3.21in) makul sigdirma sinirlari — resim bu
  // kutuya EN-BOY ORANI KORUNARAK sigdirilir (contain).
  const IMAGE_MAX_WIDTH_EMU = 5760000; // ~6.29 in
  const IMAGE_MAX_HEIGHT_EMU = 2939415; // ~3.21 in

  function computeImageEmuSize(pixelSize) {
    const width = pixelSize?.width;
    const height = pixelSize?.height;
    if (!width || !height) return { cx: IMAGE_MAX_WIDTH_EMU, cy: Math.round((IMAGE_MAX_WIDTH_EMU * 9) / 16) };
    const aspect = width / height;
    let cx = IMAGE_MAX_WIDTH_EMU;
    let cy = Math.round(cx / aspect);
    if (cy > IMAGE_MAX_HEIGHT_EMU) {
      cy = IMAGE_MAX_HEIGHT_EMU;
      cx = Math.round(cy * aspect);
    }
    return { cx, cy };
  }

  function extensionForMimeType(mimeType) {
    if (/png/i.test(mimeType || "")) return "png";
    return "jpeg";
  }

  function buildDrawingXml(relId, title, cx, cy) {
    const safeTitle = String(title || "Rapor görseli").replace(/[<>&"']/g, (ch) => (
      { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[ch]
    ));
    const uid = 1000000000 + (relId % 900000000);
    return `<w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${uid}" name="Resim ${relId}" descr="${safeTitle}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${uid}" name="Resim ${relId}" descr="${safeTitle}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${relId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>`;
  }

  // xmlText icindeki {{EMSAL_KROKISI}} gibi gorsel-turu token'lari, elde
  // mevcut resim varliklariyla (imageAssets — buildSavedReportImageAssets()
  // ciktisi) gercek <w:drawing>'e gomer. entries GUNCELLENMIS listeyi
  // (yeni word/media/imageN.* + guncellenmis word/_rels/document.xml.rels)
  // dondurur. Karsiligi olmayan resim token'lari DOKUNULMADAN birakilir
  // (normal metin-token dongusu onlari "missing" olarak raporlar).
  function embedImageAssets(xmlText, entries, imageAssets) {
    const assetsByKey = new Map((Array.isArray(imageAssets) ? imageAssets : []).map((a) => [a.key, a]));
    let nextEntries = entries.slice();
    let text = xmlText;
    let embeddedAny = false;

    Object.keys(IMAGE_TOKEN_ASSET_KEYS).forEach((token) => {
      const pattern = new RegExp(`\\{\\{${token}\\}\\}`, "g");
      if (!pattern.test(text)) return;
      const asset = assetsByKey.get(IMAGE_TOKEN_ASSET_KEYS[token]);
      if (!asset?.base64) return;

      const relsEntry = nextEntries.find((e) => e.name === "word/_rels/document.xml.rels");
      if (!relsEntry) return; // rels dosyasi yoksa (beklenmedik sablon) gorsel gomulmez, token metin olarak "missing" kalir
      const relsXml = dec.decode(relsEntry.bytes);
      const existingRelIds = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
      const relId = (existingRelIds.length ? Math.max(...existingRelIds) : 0) + 1;

      const existingMediaIndices = nextEntries
        .map((e) => e.name.match(/^word\/media\/image(\d+)\./))
        .filter(Boolean)
        .map((m) => Number(m[1]));
      const mediaIndex = (existingMediaIndices.length ? Math.max(...existingMediaIndices) : 0) + 1;
      const extension = extensionForMimeType(asset.mimeType);
      const mediaName = `word/media/image${mediaIndex}.${extension}`;

      const imageBytes = base64ToBytes(asset.base64);
      const pixelSize = extension === "jpeg" ? getJpegPixelSize(imageBytes) : null;
      const { cx, cy } = computeImageEmuSize(pixelSize);

      const updatedRelsXml = relsXml.replace(
        "</Relationships>",
        `<Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${mediaIndex}.${extension}"/></Relationships>`
      );

      text = text.replace(pattern, buildDrawingXml(relId, asset.title, cx, cy));

      nextEntries = nextEntries
        .map((e) => (e === relsEntry ? { name: e.name, bytes: enc.encode(updatedRelsXml) } : e))
        .concat([{ name: mediaName, bytes: imageBytes }]);
      embeddedAny = true;
    });

    return { xmlText: text, entries: nextEntries, embeddedAny };
  }

  // "8. Ekler" fotoğraf modülü (2026-08-13) — kullanıcı talebi: "ben
  // görsellerin eklenmesini ve kullanılabilmesini istiyorum ancak bunlar
  // kullanıcı cihazında kalmalı ve server a hiç gitmemeli". embedImageAssets
  // TEK bir token'a TEK bir görsel gömer (Emsal Krokisi); burada bir
  // token'a (ör. {{FOTO_ALANI_1}}) N adet görsel + altyazı, alt alta
  // paragraflar halinde gömülür. templates/emlakkatilim.docx'teki "8.1
  // Fotoğraflar"/"8.3 Proje Fotoğrafları" hücreleri satır-birleştirmeli
  // (vMerge restart) BOŞ hücreler — Word bu tür hücrelerde içerik satır
  // sayısından fazlaysa hücreyi otomatik BÜYÜTÜR (trHeight değerleri
  // minimum, exact DEĞİL), bu yüzden yeni <w:tr> satırı üretmeye GEREK
  // YOK — token'ı barındıran TEK paragraf, N görsel+altyazı paragrafıyla
  // değiştirilir.
  function escapeXmlText(value) {
    return String(value || "").replace(/[<>&"']/g, (ch) => (
      { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[ch]
    ));
  }

  // Galeri görselleri, çok sayıda yan yana sığması için Emsal Krokisi'nden
  // (tek, büyük görsel) daha küçük bir kutuya sığdırılır (en-boy korunarak).
  const GALLERY_IMAGE_MAX_WIDTH_EMU = 3200000; // ~3.5 in
  const GALLERY_IMAGE_MAX_HEIGHT_EMU = 2400000; // ~2.62 in

  function computeGalleryImageEmuSize(pixelSize) {
    const width = pixelSize?.width;
    const height = pixelSize?.height;
    if (!width || !height) return { cx: GALLERY_IMAGE_MAX_WIDTH_EMU, cy: Math.round((GALLERY_IMAGE_MAX_WIDTH_EMU * 3) / 4) };
    const aspect = width / height;
    let cx = GALLERY_IMAGE_MAX_WIDTH_EMU;
    let cy = Math.round(cx / aspect);
    if (cy > GALLERY_IMAGE_MAX_HEIGHT_EMU) {
      cy = GALLERY_IMAGE_MAX_HEIGHT_EMU;
      cx = Math.round(cy * aspect);
    }
    return { cx, cy };
  }

  function buildPhotoParagraphXml(relId, caption, cx, cy) {
    const drawing = buildDrawingXml(relId, caption || "Rapor fotoğrafı", cx, cy);
    const imageParagraph = `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr><w:r>${drawing}</w:r></w:p>`;
    if (!caption) return imageParagraph;
    const captionParagraph = `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/><w:rPr><w:i/><w:iCs/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:pPr><w:r><w:rPr><w:i/><w:iCs/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">${escapeXmlText(caption)}</w:t></w:r></w:p>`;
    return imageParagraph + captionParagraph;
  }

  // xmlText icindeki {{FOTO_ALANI_N}} gibi galeri token'larini, elde mevcut
  // fotoğraf gruplarıyla (photoGroups — RaporReportPhotos.getPhotoGroupsForExport()
  // çıktısı: [{ token, photos: [{ base64, mimeType, caption }] }]) gerçek
  // <w:drawing>+altyazı paragraf dizisine gömer. Token'ın İÇİNDE BULUNDUĞU
  // TEK paragraf (en yakın <w:p>...</w:p>) bulunup TAMAMEN bu dizi ile
  // DEĞİŞTİRİLİR. Karşılığı olmayan/boş grup token'ları DOKUNULMADAN
  // bırakılır (normal metin-token döngüsü onları "missing" raporlar).
  function embedPhotoGalleryAssets(xmlText, entries, photoGroups) {
    let nextEntries = entries.slice();
    let text = xmlText;
    let embeddedAny = false;

    (Array.isArray(photoGroups) ? photoGroups : []).forEach((group) => {
      const token = group?.token;
      const photos = Array.isArray(group?.photos) ? group.photos : [];
      if (!token || !photos.length) return;
      const marker = `{{${token}}}`;
      const markerIndex = text.indexOf(marker);
      if (markerIndex < 0) return; // sablonda bu token yoksa (beklenmeyen sürüm) sessizce atlanır

      const paragraphStart = text.lastIndexOf("<w:p>", markerIndex) >= 0 || text.lastIndexOf("<w:p ", markerIndex) >= 0
        ? Math.max(text.lastIndexOf("<w:p>", markerIndex), text.lastIndexOf("<w:p ", markerIndex))
        : -1;
      const paragraphEndTagIndex = text.indexOf("</w:p>", markerIndex);
      if (paragraphStart < 0 || paragraphEndTagIndex < 0) return; // beklenmeyen sablon yapisi — dokunulmaz
      const paragraphEnd = paragraphEndTagIndex + "</w:p>".length;

      const relsEntry = nextEntries.find((e) => e.name === "word/_rels/document.xml.rels");
      if (!relsEntry) return;
      let relsXml = dec.decode(relsEntry.bytes);

      const galleryParagraphs = [];
      photos.forEach((photo) => {
        if (!photo?.base64) return;
        const existingRelIds = [...relsXml.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
        const relId = (existingRelIds.length ? Math.max(...existingRelIds) : 0) + 1;
        const existingMediaIndices = nextEntries
          .map((e) => e.name.match(/^word\/media\/image(\d+)\./))
          .filter(Boolean)
          .map((m) => Number(m[1]));
        const mediaIndex = (existingMediaIndices.length ? Math.max(...existingMediaIndices) : 0) + 1;
        const extension = extensionForMimeType(photo.mimeType);
        const mediaName = `word/media/image${mediaIndex}.${extension}`;
        const imageBytes = base64ToBytes(photo.base64);
        const pixelSize = extension === "jpeg" ? getJpegPixelSize(imageBytes) : null;
        const { cx, cy } = computeGalleryImageEmuSize(pixelSize);

        relsXml = relsXml.replace(
          "</Relationships>",
          `<Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${mediaIndex}.${extension}"/></Relationships>`
        );
        nextEntries = nextEntries.concat([{ name: mediaName, bytes: imageBytes }]);
        galleryParagraphs.push(buildPhotoParagraphXml(relId, photo.caption, cx, cy));
      });
      if (!galleryParagraphs.length) return;

      nextEntries = nextEntries.map((e) => (e.name === "word/_rels/document.xml.rels" ? { name: e.name, bytes: enc.encode(relsXml) } : e));
      text = text.slice(0, paragraphStart) + galleryParagraphs.join("") + text.slice(paragraphEnd);
      embeddedAny = true;
    });

    return { xmlText: text, entries: nextEntries, embeddedAny };
  }

  // --- Ana API ---------------------------------------------------------
  // arrayBuffer: STORED .docx şablonu (fetch edilmiş ham bayt)
  // values: { TOKEN: htmlValue } — window.RaporTemplates.resolveTemplateTokenValues() çıktısı
  // boldFlags: { AD: boolean } — çoktan-seçmeli alanlarda hangi {{BOLD:AD}}
  // işaretli seçeneğin kalınlaştırılacağı (bkz. applyBoldMarkers)
  // imageAssets: [{key, title, base64, mimeType}] — buildSavedReportImageAssets()
  // çıktısı; IMAGE_TOKEN_ASSET_KEYS'teki token'lar (ör. {{EMSAL_KROKISI}})
  // gerçek <w:drawing> olarak gömülür (bkz. embedImageAssets).
  // photoGroups: [{token, photos:[{base64, mimeType, caption}]}] —
  // RaporReportPhotos.getPhotoGroupsForExport() çıktısı (2026-08-13,
  // "8.1 Fotoğraflar"/"8.3 Proje Fotoğrafları" — bkz. embedPhotoGalleryAssets).
  // Tamamen opsiyonel: window.RaporReportPhotos hiç yüklenmemiş/kullanılmamışsa
  // undefined/[] geçilir, hiçbir şey değişmez.
  function fillTemplate(arrayBuffer, values, boldFlags, imageAssets, photoGroups) {
    let entries = readStoredZip(arrayBuffer);
    let docEntry = entries.find((e) => e.name === "word/document.xml");
    if (!docEntry) throw new Error("DOCX şablonunda word/document.xml bulunamadı.");

    let xmlText = applyBoldMarkers(dec.decode(docEntry.bytes), boldFlags);

    const imageResult = embedImageAssets(xmlText, entries, imageAssets);
    xmlText = imageResult.xmlText;
    if (imageResult.embeddedAny) {
      entries = imageResult.entries;
      docEntry = entries.find((e) => e.name === "word/document.xml");
    }

    const photoResult = embedPhotoGalleryAssets(xmlText, entries, photoGroups);
    xmlText = photoResult.xmlText;
    if (photoResult.embeddedAny) {
      entries = photoResult.entries;
      docEntry = entries.find((e) => e.name === "word/document.xml");
    }

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
    embedImageAssets,
    getJpegPixelSize,
    computeImageEmuSize,
  };
})();
