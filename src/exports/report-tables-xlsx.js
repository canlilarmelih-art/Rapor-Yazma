"use strict";

/* =====================================================================
   RAPOR TABLOLARI — TEK EXCEL DOSYASI OLARAK DIŞA AKTARMA (2026-07-25)

   Amaç: Raporun her yerinde hazırlanan TÜM tabloları (kullanıcının
   doldurduğu Malikler/Takyidat/İncelenen Belgeler/Emsaller grid'leri
   VE sistemin ürettiği Değerlendirme/Emsal/Kat Bazı/Masraf tabloları)
   tek bir .xlsx dosyasında, her biri ayrı sayfada, Word çıktısındaki
   BİREBİR biçimlendirmeyle (dolgu rengi, kalın/normal yazı, hizalama,
   satır yüksekliği, sütun genişliği) indirir.

   Ham grid tabloları (state.tables) doğrudan okunur. Sistem tarafından
   üretilen tablolar için app.js'in Word çıktısında da kullandığı AYNI
   HTML üretici fonksiyonlar (buildValuationSummaryWordTableHtml vb.)
   çağrılır ve satır-içi style="..." bilgisi (background/font-weight/
   text-align/colspan/rowspan) ayrıştırılıp gerçek OOXML hücre stiline
   çevrilir — böylece görünüm raporla birebir eşleşir.

   Şablon doldurma değil, SIFIRDAN minimal geçerli bir OOXML .xlsx üretir;
   xlsx-fill.js'teki writeStoredZip/crc32 birimlerini yeniden kullanır
   (yeni bağımlılık eklemeden).

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

  function htmlEntityDecode(text) {
    return String(text ?? "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'");
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

  // --- Stil kaydı: font/dolgu/kenarlık/hücre-stili kombinasyonlarını
  // yalnızca gerçekten kullanıldıkları kadar (tekrarsız) biriktirir. ------
  function createStyleRegistry() {
    const fonts = [{ bold: false, color: null }]; // 0: varsayılan
    const fills = [{ type: "none" }, { type: "gray125" }]; // 0/1: OOXML zorunlu ayrılmış girişler
    const borders = [{ thin: false }, { thin: true }]; // 0: kenarlıksız, 1: ince tüm kenarlar
    const xfs = [{ fontId: 0, fillId: 0, borderId: 0, halign: null }]; // 0: Normal
    const fontIndex = new Map([["false|", 0]]);
    const fillIndex = new Map([["none", 0]]);
    const xfIndex = new Map([["0|0|0|", 0]]);

    function getFontId(bold, colorHex) {
      const key = `${bold}|${colorHex || ""}`;
      if (fontIndex.has(key)) return fontIndex.get(key);
      const id = fonts.length;
      fonts.push({ bold, color: colorHex || null });
      fontIndex.set(key, id);
      return id;
    }

    function getFillId(colorHex) {
      if (!colorHex) return 0;
      const key = colorHex.toUpperCase();
      if (fillIndex.has(key)) return fillIndex.get(key);
      const id = fills.length;
      fills.push({ type: "solid", color: key });
      fillIndex.set(key, id);
      return id;
    }

    function getBorderId(withBorder) {
      return withBorder ? 1 : 0;
    }

    function getXfId({ bold = false, bg = null, align = null, color = null, withBorder = true }) {
      const fontId = getFontId(bold, color);
      const fillId = getFillId(bg);
      const borderId = getBorderId(withBorder);
      const key = `${fontId}|${fillId}|${borderId}|${align || ""}`;
      if (xfIndex.has(key)) return xfIndex.get(key);
      const id = xfs.length;
      xfs.push({ fontId, fillId, borderId, halign: align || null });
      xfIndex.set(key, id);
      return id;
    }

    function buildStylesXml() {
      const fontsXml = fonts
        .map((f) => `<font><sz val="10"/><name val="Calibri"/>${f.bold ? "<b/>" : ""}${f.color ? `<color rgb="FF${f.color.replace("#", "").toUpperCase()}"/>` : ""}</font>`)
        .join("");
      const fillsXml = fills
        .map((f) => {
          if (f.type === "none") return `<fill><patternFill patternType="none"/></fill>`;
          if (f.type === "gray125") return `<fill><patternFill patternType="gray125"/></fill>`;
          return `<fill><patternFill patternType="solid"><fgColor rgb="FF${f.color.replace("#", "").toUpperCase()}"/><bgColor indexed="64"/></patternFill></fill>`;
        })
        .join("");
      const thin = `<left style="thin"><color rgb="FFB0B0B0"/></left><right style="thin"><color rgb="FFB0B0B0"/></right><top style="thin"><color rgb="FFB0B0B0"/></top><bottom style="thin"><color rgb="FFB0B0B0"/></bottom>`;
      const bordersXml = borders.map((b) => (b.thin ? `<border>${thin}</border>` : `<border><left/><right/><top/><bottom/></border>`)).join("");
      const xfsXml = xfs
        .map((xf) => {
          // Kullanıcı bulgusu (2026-09-02, ekran görüntüsü): "hizalama...
          // bence olmamış" — satır yükseklikleri artık içeriğe göre büyük
          // ölçüde değişiyor (bkz. estimateMergedRowHeightPt), bu yüzden
          // dikey "center" hizalama, kısa değerleri (Tarih/Yevmiye No/
          // Kısıtlı Malik gibi) çok uzun bir Açıklama'nın yanında satırın
          // ORTASINDA "yüzer" gösterip satırı bütünlüksüz/hizasız
          // gösteriyordu. Dikey hizalama "top" yapıldı — böylece aynı
          // satırdaki TÜM sütunlar üst kenardan başlıyor, satır ne kadar
          // uzasa da bir bütün olarak okunuyor.
          const alignXml = xf.halign ? `<alignment horizontal="${xf.halign}" vertical="top" wrapText="1"/>` : `<alignment vertical="top" wrapText="1"/>`;
          return `<xf numFmtId="0" fontId="${xf.fontId}" fillId="${xf.fillId}" borderId="${xf.borderId}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">${alignXml}</xf>`;
        })
        .join("");
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="${fonts.length}">${fontsXml}</fonts><fills count="${fills.length}">${fillsXml}</fills><borders count="${borders.length}">${bordersXml}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${xfs.length}">${xfsXml}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
    }

    return { getXfId, buildStylesXml };
  }

  // --- HTML tablo -> hücre ızgarası ayrıştırıcı --------------------------
  // Not: bu üretici fonksiyonların hücre içeriği yalnızca escapeHtml + <br>
  // içerir (iç içe etiket yok); bu yüzden basit bir <br> -> \n dönüşümü +
  // etiket temizliği yeterlidir.
  function cellTextFromInnerHtml(innerHtml) {
    return htmlEntityDecode(
      String(innerHtml || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
    ).trim();
  }

  // İnline style dizgilerinde aynı özellik (ör. "background:") birden fazla
  // kez geçebilir (bir baz stil + üzerine yazan bir "vurgu" stili birleştirmesi);
  // CSS'te olduğu gibi SONUNCU bildirim geçerlidir. Bu yüzden ilk değil son
  // eşleşme alınır.
  function lastMatch(style, pattern) {
    const matches = [...style.matchAll(pattern)];
    return matches.length ? matches[matches.length - 1][1] : null;
  }

  function parseStyleAttr(styleAttr) {
    const style = String(styleAttr || "");
    const bg = lastMatch(style, /background(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/g);
    const weight = lastMatch(style, /font-weight:\s*(\d+)/g);
    const align = lastMatch(style, /text-align:\s*(left|right|center)/g);
    const color = lastMatch(style, /(?<!background-)(?<!background)color:\s*(#[0-9a-fA-F]{3,8})/g);
    return {
      bg: bg || null,
      bold: weight ? Number(weight) >= 700 : false,
      align: align || null,
      color: color || null,
    };
  }

  function ptFromHeightStyle(styleAttr, heightAttr) {
    const style = String(styleAttr || "");
    const cmMatch = style.match(/height:\s*([\d.]+)cm/);
    if (cmMatch) return Number(cmMatch[1]) * 28.3465;
    const ptMatch = style.match(/height:\s*([\d.]+)pt/);
    if (ptMatch) return Number(ptMatch[1]);
    if (heightAttr) {
      const n = Number(heightAttr);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }

  // Tek bir <table>...</table> parçasını satır/sütun ızgarasına çevirir.
  // colspan/rowspan'i standart "kaplanmış sütun" algoritmasıyla ele alır.
  function parseSingleTableHtml(tableHtml) {
    const colgroupMatch = tableHtml.match(/<colgroup>([\s\S]*?)<\/colgroup>/i);
    let colWidthsPercent = null;
    if (colgroupMatch) {
      colWidthsPercent = [...colgroupMatch[1].matchAll(/width:\s*([\d.]+)%/g)].map((m) => Number(m[1]));
      if (!colWidthsPercent.length) colWidthsPercent = null;
    }

    const trMatches = [...tableHtml.matchAll(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi)];
    const occupancy = []; // occupancy[col] = kalan blok satır sayısı
    const grid = []; // grid[rowIndex] = [{col, text, bold, bg, align, header}]
    const merges = []; // {r1,c1,r2,c2}
    const rowHeights = [];
    let maxCol = colWidthsPercent ? colWidthsPercent.length : 0;

    trMatches.forEach((trMatch, rowIndex) => {
      const trAttrs = trMatch[1] || "";
      const trStyle = trAttrs.match(/style="([^"]*)"/)?.[1] || "";
      const trHeightAttr = trAttrs.match(/\sheight="([^"]*)"/)?.[1] || "";
      rowHeights[rowIndex] = ptFromHeightStyle(trStyle, trHeightAttr);

      const cellMatches = [...trMatch[2].matchAll(/<(t[hd])([^>]*)>([\s\S]*?)<\/\1>/gi)];
      const rowCells = [];
      let col = 0;
      cellMatches.forEach((cellMatch) => {
        const tag = cellMatch[1].toLowerCase();
        const attrs = cellMatch[2] || "";
        const inner = cellMatch[3] || "";
        while (occupancy[col] > 0) col += 1;
        const colspan = Number(attrs.match(/colspan="(\d+)"/)?.[1] || 1);
        const rowspan = Number(attrs.match(/rowspan="(\d+)"/)?.[1] || 1);
        const styleAttr = attrs.match(/style="([^"]*)"/)?.[1] || "";
        const parsed = parseStyleAttr(styleAttr);
        rowCells.push({
          col,
          colspan,
          text: cellTextFromInnerHtml(inner),
          bold: parsed.bold || tag === "th",
          bg: parsed.bg,
          align: parsed.align,
          color: parsed.color,
        });
        if (rowspan > 1 || colspan > 1) {
          merges.push({ r1: rowIndex, c1: col, r2: rowIndex + rowspan - 1, c2: col + colspan - 1 });
        }
        for (let c = col; c < col + colspan; c++) {
          occupancy[c] = Math.max(occupancy[c] || 0, rowspan);
        }
        col += colspan;
        maxCol = Math.max(maxCol, col);
      });
      grid[rowIndex] = rowCells;
      for (let c = 0; c < occupancy.length; c++) {
        if (occupancy[c] > 0) occupancy[c] -= 1;
      }
    });

    return { grid, merges, rowHeights, colCount: maxCol, colWidthsPercent };
  }

  // html içindeki TÜM <table> bloklarını sırayla ayrıştırıp satırları
  // (aralarında bir boş satırla) tek bir ızgarada birleştirir.
  // Bazı üretici fonksiyonlar (ör. buildComparableValuationWordTableHtml)
  // gerçek veri tablosunu Word'de tek çerçeveli görünsün diye dekoratif bir
  // "role=presentation" DIŞ tabloya gömer (<table><tr><td>BAŞLIK</td></tr>
  // <tr><td><table>...GERÇEK VERİ...</table></td></tr></table>). Basit,
  // iç içeliği bilmeyen bir regex bu durumda dış ve iç tabloların <tr>
  // satırlarını birbirine karıştırır (kullanıcının bildirdiği "kayma").
  // Bu yüzden yalnızca EN İÇTEKİ (başka tablo barındırmayan) <table>
  // bloklarını, derinlik takip ederek buluruz.
  function findInnermostTableBlocks(html) {
    const tagRe = /<table\b[^>]*>|<\/table>/gi;
    const openStack = [];
    const blocks = [];
    let match;
    while ((match = tagRe.exec(html))) {
      if (/^<table\b/i.test(match[0])) {
        openStack.push(match.index);
      } else {
        const start = openStack.pop();
        if (start === undefined) continue;
        const end = match.index + match[0].length;
        blocks.push({ start, end, html: html.slice(start, end) });
      }
    }
    return blocks.filter((block) => !blocks.some((other) => other !== block && other.start > block.start && other.end < block.end));
  }

  function parseHtmlTables(html) {
    const tableBlocks = findInnermostTableBlocks(String(html || "")).map((b) => b.html);
    if (!tableBlocks.length) return null;
    let grid = [];
    let merges = [];
    let rowHeights = [];
    let colCount = 0;
    let colWidthsPercent = null;
    tableBlocks.forEach((tableHtml, blockIndex) => {
      const parsed = parseSingleTableHtml(tableHtml);
      if (!parsed.grid.length) return;
      if (blockIndex > 0) {
        grid.push([]); // tablolar arası bir boş satır
        rowHeights.push(null);
      }
      const offset = grid.length;
      parsed.grid.forEach((row, index) => {
        grid[offset + index] = row;
        rowHeights[offset + index] = parsed.rowHeights[index] || null;
      });
      parsed.merges.forEach((m) => merges.push({ r1: m.r1 + offset, c1: m.c1, r2: m.r2 + offset, c2: m.c2 }));
      colCount = Math.max(colCount, parsed.colCount);
      if (!colWidthsPercent && parsed.colWidthsPercent) colWidthsPercent = parsed.colWidthsPercent;
    });
    if (!grid.length) return null;
    return { grid, merges, rowHeights, colCount, colWidthsPercent };
  }

  // --- OOXML üretimi ------------------------------------------------------
  // Üst sınır bilinçli olarak DAR tutulur: hücrelerde wrapText açık (bkz.
  // createStyleRegistry.buildStylesXml alignment), bu yüzden uzun metinler
  // sütunu genişletmek yerine hücre içinde birden çok satıra sarılır. Aksi
  // halde tek bir uzun paragraf (ör. Emsal Metni) tüm sütunu — özellikle
  // ince sütun ızgarasında birçok sütunu — aşırı genişletirdi.
  function widthFromPercent(percent) {
    return Math.max(8, Math.min(24, 8 + (percent / 100) * 16));
  }

  function widthFromContent(maxLen) {
    return Math.max(8, Math.min(22, maxLen * 0.9 + 2));
  }

  // Basit (düz) baslik+satir tablosunu ortak {grid,merges,rowHeights,colCount}
  // hucre-izgarasi bicimine cevirir (parseHtmlTables cikisiyla ayni bicim) —
  // boylece hem tek basina bir sayfa olarak hem de combineNamedGrids ile baska
  // tablolarla "alt alta" birlestirilerek kullanilabilir.
  function rawGridToCellGrid(headerRow, dataRows) {
    const grid = [];
    if (headerRow) grid.push(headerRow.map((text, col) => ({ text, col, colspan: 1, bold: true, bg: "#D9D9D9", align: null })));
    dataRows.forEach((row) => grid.push(row.map((text, col) => ({ text, col, colspan: 1, bold: false, bg: null, align: null }))));
    return { grid, merges: [], rowHeights: [], colCount: headerRow ? headerRow.length : (dataRows[0] || []).length, colWidthsPercent: null };
  }

  function buildSheetXmlFromGrid(styleRegistry, headerRow, dataRows, options = {}) {
    return buildSheetXmlFromCellGrid(styleRegistry, rawGridToCellGrid(headerRow, dataRows), options);
  }

  // Birden çok adlı tabloyu ("Beyanlar", "Şerhler", "İpotekler" gibi) TEK bir
  // sayfada alt alta birleştirir; her alt tablonun önüne kalın bir başlık
  // satırı eklenir, hücre birleşimleri (merge) ve satır yükseklikleri, satır
  // ofsetine göre kaydırılarak korunur.
  // Alt tablolar çok farklı sütun sayısına/genişliğine ihtiyaç duyabilir
  // (ör. 3 sütunlu Değerlendirme Tablosu ile 12 sütunlu Emsal Değerleme
  // Tablosu aynı sayfada). Excel'de TÜM satırlar aynı sütun genişliğini
  // paylaştığından, az sütunlu bir tablo geniş sütunlar dayatıp diğer
  // tabloyu sıkıştırırdı. Kullanıcı talebi: "üstte genişlik gerektiren
  // hücreyi böl, altta gereken genişliği yakala" — yani ortak İNCE bir
  // sütun ızgarası kurup, her tablonun her sütununu bu ızgarada kendi
  // göreli genişliğine (colWidthsPercent, yoksa eşit pay) göre birden çok
  // ince sütuna karşılık gelecek şekilde BİRLEŞTİRİLMİŞ (merge) hücre
  // olarak yerleştiriyoruz. Böylece ince sütunlar dar kalır, her tablo
  // kendi hücrelerini gerektiği kadar ince sütunu birleştirerek "geniş"
  // gösterir.
  //
  // Kullanıcı talebi (2026-07-25): "kompakt bir yapı olmalı ... 100 adet
  // sütun olsun ... absürt hücre genişliği olmasın". Bu yüzden birleşik
  // sayfalarda 100 ince sütun kullanılır ve HER ince sütun SABİT, dar bir
  // genişliğe sahiptir — içerik uzunluğuna göre genişlik hesabı YAPILMAZ.
  // Bir hücrenin görünen genişliği yalnızca kaç ince sütunu birleştirdiğine
  // bağlıdır; böylece tek bir hücrenin metni hiçbir sütunu tek başına
  // şişiremez ve sayfanın toplam genişliği her zaman öngörülebilir kalır
  // (100 × 1.8 ≈ 180 karakter).
  const COMBINED_SHEET_FINE_COLUMNS = 100;
  const COMBINED_SHEET_FINE_COLUMN_WIDTH = 1.8;

  function remapCellGridToFineColumns(cellGrid, fineCols) {
    const { grid, merges, rowHeights, colCount, colWidthsPercent } = cellGrid;
    if (!colCount) return cellGrid;
    const weights = colWidthsPercent && colWidthsPercent.length === colCount
      ? colWidthsPercent
      : Array.from({ length: colCount }, () => 100 / colCount);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
    const boundaries = [0];
    let cumulative = 0;
    for (let i = 0; i < colCount; i++) {
      cumulative += weights[i];
      let next = Math.round((cumulative / totalWeight) * fineCols);
      if (next <= boundaries[i]) next = boundaries[i] + 1;
      boundaries.push(next);
    }
    if (boundaries[colCount] > fineCols) boundaries[colCount] = fineCols;

    // Zaten colspan/rowspan ile birleşik olan hücrelerin merge kaydı
    // aşağıda (mevcut merges listesi üzerinden) yeniden hesaplanır; aynı
    // hücre için ikinci kez merge eklememek üzere işaretlenir.
    const existingMergeKeys = new Set(merges.map((m) => `${m.r1}:${m.c1}`));
    const newMerges = merges.map((m) => ({
      r1: m.r1,
      r2: m.r2,
      c1: boundaries[m.c1],
      c2: boundaries[m.c2 + 1] - 1,
    }));

    const newGrid = grid.map((row, rowIndex) =>
      row.map((cell) => {
        const span = cell.colspan || 1;
        const fineStart = boundaries[cell.col];
        const fineEnd = boundaries[cell.col + span] - 1;
        if (fineEnd > fineStart && !existingMergeKeys.has(`${rowIndex}:${cell.col}`)) {
          newMerges.push({ r1: rowIndex, c1: fineStart, r2: rowIndex, c2: fineEnd });
        }
        // colspan artik BU (ince) izgaradaki gercek yayilimi yansitir —
        // genislik hesaplarken tek bir ince sutuna yigilmamasi icin.
        return { ...cell, col: fineStart, colspan: fineEnd - fineStart + 1 };
      })
    );

    return { grid: newGrid, merges: newMerges, rowHeights, colCount: fineCols, colWidthsPercent: null };
  }

  function combineNamedGrids(namedGrids) {
    const filled = namedGrids.filter((named) => named.cellGrid && named.cellGrid.grid.length);
    if (!filled.length) return null;
    const grid = [];
    const merges = [];
    const rowHeights = [];
    filled.forEach((named, index) => {
      if (index > 0) {
        grid.push([]);
        rowHeights.push(null);
      }
      // Alt tablo başlığı tüm ince ızgara boyunca birleştirilir; aksi halde
      // tek bir dar (1.8 birimlik) sütuna sıkışıp okunamaz görünürdü.
      grid.push([{ col: 0, colspan: COMBINED_SHEET_FINE_COLUMNS, text: named.title, bold: true, bg: "#C7D2E8", align: null }]);
      merges.push({ r1: grid.length - 1, c1: 0, r2: grid.length - 1, c2: COMBINED_SHEET_FINE_COLUMNS - 1 });
      rowHeights.push(null);
      const offset = grid.length;
      const remapped = remapCellGridToFineColumns(named.cellGrid, COMBINED_SHEET_FINE_COLUMNS);
      remapped.grid.forEach((row, i) => {
        grid[offset + i] = row;
        rowHeights[offset + i] = remapped.rowHeights[i] || null;
      });
      remapped.merges.forEach((m) => merges.push({ r1: m.r1 + offset, c1: m.c1, r2: m.r2 + offset, c2: m.c2 }));
    });
    return { grid, merges, rowHeights, colCount: COMBINED_SHEET_FINE_COLUMNS, colWidthsPercent: null };
  }

  // Kullanıcı bulgusu (2026-09-02, İKİNCİ ekran görüntüsü): 0.0.603'ün
  // "birleşik sayfalarda satır yüksekliğini HİÇ zorlama, Excel otomatik
  // büyütsün" denemesi AYNI çakışma görüntüsünü vermeye devam etti. KÖK
  // NEDEN: Excel, BİRLEŞTİRİLMİŞ (merge edilmiş) hücreler için satır
  // yüksekliğini ASLA otomatik hesaplamaz — bu resmi, bilinen bir Excel
  // kısıtlamasıdır. Bu sayfadaki HER veri hücresi ince-sütun ızgarasında
  // birleştirilmiş olduğundan, satır yüksekliğini KENDİMİZ hesaplayıp
  // yazmamız gerekiyor — ama HTML'den gelen SABİT (Word'e özgü "en az")
  // değeri DEĞİL, hücrenin GERÇEK (remap sonrası) genişliğine göre KAÇ
  // SATIRA SARILACAĞINI tahmin ederek.
  function estimateWrappedLineCount(text, widthUnits) {
    if (!text) return 1;
    // Excel'in sütun "genişlik" birimi, standart (10pt) hücre yazı tipiyle
    // kabaca 1 karaktere denk gelir.
    const CHARS_PER_UNIT = 1;
    const charsPerLine = Math.max(4, Math.floor(widthUnits * CHARS_PER_UNIT));
    return text
      .split("\n")
      .reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
  }

  function estimateMergedRowHeightPt(rowCells, fineColWidth) {
    const LINE_HEIGHT_PT = 13;
    const PADDING_PT = 3;
    let maxLines = 1;
    rowCells.forEach((cell) => {
      const text = String(cell.text ?? "");
      if (!text) return;
      const widthUnits = Math.max(1, (cell.colspan || 1) * fineColWidth);
      maxLines = Math.max(maxLines, estimateWrappedLineCount(text, widthUnits));
    });
    return PADDING_PT + maxLines * LINE_HEIGHT_PT;
  }

  function buildSheetXmlFromCellGrid(styleRegistry, parsed, options = {}) {
    const { grid, merges, rowHeights, colCount } = parsed;
    const contentWidths = Array.from({ length: colCount }, () => 0);
    const rowsXml = grid
      .map((rowCells, rowIndex) => {
        const r = rowIndex + 1;
        const cellsXml = rowCells
          .map((cell) => {
            const text = String(cell.text ?? "");
            // Birden çok (ince) sütunu birleştiren bir hücrenin metin uzunluğu
            // TEK bir sütuna yığılmamalı — aksi halde o sütun tek başına geniş
            // kalıp aynı sayfadaki diğer (dar) tablonun kazanımını sıfırlardı.
            // Bu yüzden gereken genişlik, hücrenin kapladığı tüm sütunlara
            // orantılı olarak dağıtılır.
            const span = Math.max(1, cell.colspan || 1);
            const perColumnLen = text.length / span;
            for (let c = cell.col; c < cell.col + span; c++) {
              contentWidths[c] = Math.max(contentWidths[c] || 0, perColumnLen);
            }
            if (!text) return "";
            const xf = styleRegistry.getXfId({ bold: cell.bold, bg: cell.bg, align: cell.align, color: cell.color, withBorder: options.withBorder !== false });
            const preserve = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : "";
            return `<c r="${columnLetter(cell.col)}${r}" s="${xf}" t="inlineStr"><is><t${preserve}>${xmlEscape(text)}</t></is></c>`;
          })
          .join("");
        // Birleşik ("Tüm Tablolar") sayfalarında (options.uniformColumnWidth
        // ile işaretli) satır yüksekliği, yukarıdaki estimateMergedRowHeightPt
        // ile GERÇEK (remap sonrası) hücre genişliğine göre hesaplanır — bkz.
        // fonksiyonun üstündeki açıklama (Excel merge edilmiş hücreler için
        // satırı otomatik büyütmez). Diğer (birleşik olmayan) sayfalarda
        // davranış DEĞİŞMEDİ: HTML kaynağından gelen sabit yükseklik kullanılır.
        const heightPt = Number.isFinite(options.uniformColumnWidth)
          ? estimateMergedRowHeightPt(rowCells, options.uniformColumnWidth)
          : rowHeights[rowIndex];
        const heightAttr = heightPt ? ` ht="${heightPt.toFixed(2)}" customHeight="1"` : "";
        return `<row r="${r}"${heightAttr}>${cellsXml}</row>`;
      })
      .join("");

    // options.uniformColumnWidth verildiğinde (birleşik sayfalar) TÜM sütunlar
    // aynı sabit dar genişliği alır; hücrelerin görünen genişliği yalnızca
    // birleştirdikleri ince sütun sayısından gelir. Böylece hiçbir sütun
    // içeriğe bağlı olarak absürt derecede genişlemez.
    const colWidths = Number.isFinite(options.uniformColumnWidth)
      ? Array.from({ length: colCount }, () => options.uniformColumnWidth)
      : parsed.colWidthsPercent
        ? parsed.colWidthsPercent.map((p) => widthFromPercent(p))
        : contentWidths.map((len) => widthFromContent(len || 8));
    const colsXml = colWidths.length
      ? `<cols>${colWidths.map((w, index) => `<col min="${index + 1}" max="${index + 1}" width="${w.toFixed(2)}" customWidth="1"/>`).join("")}</cols>`
      : "";

    const mergesXml = merges.length
      ? `<mergeCells count="${merges.length}">${merges
          .map((m) => `<mergeCell ref="${columnLetter(m.c1)}${m.r1 + 1}:${columnLetter(m.c2)}${m.r2 + 1}"/>`)
          .join("")}</mergeCells>`
      : "";

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colsXml}<sheetData>${rowsXml}</sheetData>${mergesXml}</worksheet>`;
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
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${count + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  }

  function buildContentTypesXml(count) {
    const overrides = Array.from({ length: count }, (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    ).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>`;
  }

  const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  // sheets: [{ name, sheetXml }]
  function buildWorkbookBlob(sheets, stylesXml) {
    const entries = [
      { name: "[Content_Types].xml", bytes: enc.encode(buildContentTypesXml(sheets.length)) },
      { name: "_rels/.rels", bytes: enc.encode(ROOT_RELS_XML) },
      { name: "xl/workbook.xml", bytes: enc.encode(buildWorkbookXml(sheets.map((s) => s.name))) },
      { name: "xl/_rels/workbook.xml.rels", bytes: enc.encode(buildWorkbookRelsXml(sheets.length)) },
      { name: "xl/styles.xml", bytes: enc.encode(stylesXml) },
      ...sheets.map((sheet, index) => ({
        name: `xl/worksheets/sheet${index + 1}.xml`,
        bytes: enc.encode(sheet.sheetXml),
      })),
    ];
    const zipped = window.RaporXlsxFill.writeStoredZip(entries);
    return new Blob([zipped], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  // --- Rapor tablolarını app.js global'lerinden topla --------------------
  function collectRawGridDefs() {
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

  function isRowFilled(row) {
    return Object.values(row || {}).some((value) => String(value ?? "").trim());
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

  function safeCall(fnName) {
    try {
      const fn = window[fnName];
      return typeof fn === "function" ? fn() : "";
    } catch (error) {
      console.warn(`Tüm tablolar Excel: ${fnName} çağrısı başarısız`, error);
      return "";
    }
  }

  // Masraf Tablosu'nu (Banka ve Çıktı bölümündeki canlı özetle aynı satırlar)
  // doğrudan state.fields'ten kurar — HTML üretici bir fonksiyonu olmadığı
  // için ayrı ele alınır.
  function buildExpenseFeesSheet(styleRegistry) {
    if (typeof recalculateExpenseFees === "function") {
      try { recalculateExpenseFees(); } catch (error) { /* alan eksikse sessiz geç */ }
    }
    const fields = typeof state !== "undefined" ? state.fields || {} : {};
    const items = [
      ["Değerleme (Rapor) Ücreti", "expenseAppraisalFeeExVat", "expenseAppraisalFeeIncVat"],
      ["Ulaşım Bedeli", "expenseTransportFeeExVat", "expenseTransportFeeIncVat"],
      ["Tapu Harcı", "expenseTitleDeedFeeExVat", "expenseTitleDeedFeeIncVat"],
      ["Belediye Harcı", "expenseMunicipalityFeeExVat", "expenseMunicipalityFeeIncVat"],
      ["Gayrimenkul Bilgi Merkezi Payı", "expenseInfoCenterShareExVat", "expenseInfoCenterShareIncVat"],
      ["Birlik Payı", "expenseUnionShareExVat", "expenseUnionShareIncVat"],
    ];
    const hasAnyValue = items.some(([, exKey, incKey]) => fields[exKey] || fields[incKey]) || fields.expenseTotalFeeExVat || fields.expenseTotalFeeIncVat;
    if (!hasAnyValue) return null;

    const money = (value) => (value ? `${value} TL` : "");
    const grid = [
      [
        { text: "Kalem", bold: true, bg: "#D9D9D9" },
        { text: "KDV Hariç", bold: true, bg: "#D9D9D9", align: "right" },
        { text: "KDV Dahil", bold: true, bg: "#D9D9D9", align: "right" },
      ],
    ];
    items.forEach(([label, exKey, incKey]) => {
      grid.push([
        { text: label, bold: false, bg: null },
        { text: money(fields[exKey]), bold: false, bg: null, align: "right" },
        { text: money(fields[incKey]), bold: false, bg: null, align: "right" },
      ]);
    });
    grid.push([
      { text: "Toplam Ücret", bold: true, bg: "#F6ECD6" },
      { text: money(fields.expenseTotalFeeExVat), bold: true, bg: "#F6ECD6", align: "right" },
      { text: money(fields.expenseTotalFeeIncVat), bold: true, bg: "#F6ECD6", align: "right" },
    ]);
    grid.forEach((row) => row.forEach((cell, colIndex) => { cell.col = colIndex; }));
    const sheetXml = buildSheetXmlFromCellGrid(styleRegistry, { grid, merges: [], rowHeights: [], colCount: 3, colWidthsPercent: [40, 30, 30] });
    return sheetXml;
  }

  // Kullanıcı talebi: Takyidat alt tabloları (Beyanlar/Şerhler/İpotekler) TEK
  // sayfada alt alta olsun; Değerleme ve Emsal tabloları da TEK sayfada alt
  // alta olsun (hücre birleşimleri korunarak).
  const TAKYIDAT_KEYS = ["encumbranceDeclarations", "encumbranceAnnotations", "encumbranceMortgages"];

  // Tarih hücrelerini gün.ay.yıl'a çevirir. "İncelenen belgeler" tablosu
  // tarihleri ISO (1994-07-15) olarak saklıyor; ham grid doğrudan okunduğu
  // için Excel'e de ISO olarak düşüyordu. app.js'teki dateIsoToTr aynı işi
  // yapar (ISO ve g/a/Y biçimlerini normalize eder, TARİH OLMAYAN değeri
  // aynen döndürür) — yüklüyse o kullanılır, değilse aynı davranış yerelde.
  // Desenler baştan sona sabitli olduğundan "1/1" (hisse) veya "653/09"
  // (belge no) gibi değerler etkilenmez.
  function toTrDate(value) {
    const text = String(value ?? "").trim();
    if (!text) return "";
    if (typeof window !== "undefined" && typeof window.dateIsoToTr === "function") {
      try { return window.dateIsoToTr(text); } catch (error) { /* yedeğe düş */ }
    }
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
    if (iso) return `${iso[3].padStart(2, "0")}.${iso[2].padStart(2, "0")}.${iso[1]}`;
    const local = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (local) return `${local[1].padStart(2, "0")}.${local[2].padStart(2, "0")}.${local[3]}`;
    return text;
  }

  // "İncelenen belgeler" tablosu ekranda/Word çıktısında
  // getReviewedDocumentChronologicalEntries (app.js) ile tarihe göre eskiden
  // yeniye sıralanıyor; Excel'e ham grid sırasıyla düşüyordu. Aynı kanonik
  // sıralama fonksiyonu burada da kullanılarak tek kaynaktan tutarlılık
  // sağlanır (tarihsiz satırlar orijinal sırasıyla en sona düşer).
  function sortDocumentRowsChronologically(rows) {
    if (typeof window === "undefined" || typeof window.getReviewedDocumentChronologicalEntries !== "function") {
      return rows;
    }
    try {
      return window.getReviewedDocumentChronologicalEntries(rows).map((entry) => entry.row);
    } catch (error) {
      return rows;
    }
  }

  function rawGridCellGridFor(def) {
    const tableState = (typeof state !== "undefined" && state.tables && state.tables[def.key]) || [];
    let filledRows = tableState.filter(isRowFilled);
    if (!filledRows.length) return null;
    if (def.key === "documents") filledRows = sortDocumentRowsChronologically(filledRows);
    const rows = filledRows.map((row) => def.columns.map((_, columnIndex) => toTrDate(row[`c${columnIndex}`] || "")));
    return rawGridToCellGrid(def.columns, rows);
  }

  function generatedCellGridFor(fnName) {
    const html = safeCall(fnName);
    return html ? parseHtmlTables(html) : null;
  }

  function buildSheetsFromCurrentState() {
    const styleRegistry = createStyleRegistry();
    const usedNames = new Set();
    const sheets = [];

    const coverRows = buildCoverSheetRows();
    if (coverRows.length) {
      sheets.push({
        name: sanitizeSheetName("Genel Bilgiler", usedNames),
        sheetXml: buildSheetXmlFromGrid(styleRegistry, ["Alan", "Değer"], coverRows),
      });
    }

    // Kullanıcı talebi (2026-08-15): "bu adres ve tapu tablosunu çıktıda
    // yer alan excel tablosunu sayfa olarak aktar" — Çoklu Talep'te
    // (2+ taşınmaz) admin panelinde görünen "Taşınmazlar Tapu Özeti"/
    // "Taşınmazlar Adres Özeti" tabloları (bkz. app.js, Çift Yönlü Özet
    // Tablo özelliği) artık "Tüm Tablolar" Excel'inde de AYRI birer sayfa.
    // buildTitleUnitsSummaryWordTableHtml/buildAddressUnitsSummaryWordTableHtml
    // export-shared (Word/banka şablonu ile PAYLAŞILAN, ekran-içi
    // düzenlenebilir önizlemeden TAMAMEN AYRI) fonksiyonlar — diğer
    // sistem-üretimi tablolarla (ör. "Değerlendirme Tablosu") AYNI
    // generatedCellGridFor() yoluyla, İKİNCİ bir HTML/hücre-ızgara
    // üretici YAZILMADAN kullanılıyor. Yalnızca 2+ taşınmazda (Çoklu
    // Talep) veri döndüklerinden, tekil raporlarda bu iki sayfa hiç
    // eklenmez (generatedCellGridFor zaten null döner).
    const titleUnitsSummaryCellGrid = generatedCellGridFor("buildTitleUnitsSummaryWordTableHtml");
    if (titleUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Tapu Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, titleUnitsSummaryCellGrid) });
    }
    const addressUnitsSummaryCellGrid = generatedCellGridFor("buildAddressUnitsSummaryWordTableHtml");
    if (addressUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Adres Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, addressUnitsSummaryCellGrid) });
    }
    // İmar Durumu Faz B (2026-08-16) — yukarıdaki ikisiyle AYNI desen;
    // yalnızca taşınmazlar FARKLI ada/parselde iken dolu döner (bkz.
    // buildImarUnitsSummaryTableData, app.js).
    const imarUnitsSummaryCellGrid = generatedCellGridFor("buildImarUnitsSummaryWordTableHtml");
    if (imarUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar İmar Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, imarUnitsSummaryCellGrid) });
    }
    // Arsa Özellikleri (2026-08-17) — yukarıdaki İmar sayfasıyla AYNI
    // desen; yalnızca taşınmazlar FARKLI ada/parselde iken dolu döner
    // (bkz. buildLandUnitsSummaryTableData, app.js).
    const landUnitsSummaryCellGrid = generatedCellGridFor("buildLandUnitsSummaryWordTableHtml");
    if (landUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Arsa Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, landUnitsSummaryCellGrid) });
    }
    // Belgeler ve Proje (2026-08-19) — yukarıdakilerle AYNI desen; yalnızca
    // taşınmazlar FARKLI BLOKTA iken dolu döner (ada/parsel değil — bkz.
    // buildDocumentsUnitsSummaryTableData/isDocumentsScopedByBlock, app.js).
    const documentsUnitsSummaryCellGrid = generatedCellGridFor("buildDocumentsUnitsSummaryWordTableHtml");
    if (documentsUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Belgeler Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, documentsUnitsSummaryCellGrid) });
    }
    // Değerleme (2026-08-19) — yukarıdakilerle AYNI desen; yalnızca 2+
    // taşınmaz varsa dolu döner (bkz. buildValuationUnitsSummaryTableData, app.js).
    const valuationUnitsSummaryCellGrid = generatedCellGridFor("buildValuationUnitsSummaryWordTableHtml");
    if (valuationUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Değerleme Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, valuationUnitsSummaryCellGrid) });
    }
    // Bağımsız Bölüm Özellikleri (2026-08-21) — yukarıdakilerle AYNI desen;
    // yalnızca 2+ taşınmaz varsa dolu döner (bkz. buildUnitUnitsSummaryTableData,
    // app.js). Dekoratif Özellikler paneli BİLEREK hariç tutulur.
    const unitUnitsSummaryCellGrid = generatedCellGridFor("buildUnitUnitsSummaryWordTableHtml");
    if (unitUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Bağımsız Bölüm Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, unitUnitsSummaryCellGrid) });
    }
    // Proje Uygunluk Durumu (2026-08-26) — yukarıdakilerle AYNI desen;
    // yalnızca 2+ taşınmaz varsa dolu döner (bkz.
    // buildProjectSuitabilityUnitsSummaryTableData, app.js).
    const projectSuitabilityUnitsSummaryCellGrid = generatedCellGridFor("buildProjectSuitabilityUnitsSummaryWordTableHtml");
    if (projectSuitabilityUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar Proje Uygunluk Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, projectSuitabilityUnitsSummaryCellGrid) });
    }
    // GABİM Veri Seti (2026-09-02) — yukarıdakilerle AYNI desen; yalnızca
    // 2+ taşınmaz varsa dolu döner (bkz. buildGabimUnitsSummaryTableData, app.js).
    const gabimUnitsSummaryCellGrid = generatedCellGridFor("buildGabimUnitsSummaryWordTableHtml");
    if (gabimUnitsSummaryCellGrid) {
      sheets.push({ name: sanitizeSheetName("Taşınmazlar GABİM Özeti", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, gabimUnitsSummaryCellGrid) });
    }

    const rawGridDefs = collectRawGridDefs();
    const takyidatDefs = rawGridDefs.filter((def) => TAKYIDAT_KEYS.includes(def.key));
    const otherRawDefs = rawGridDefs.filter((def) => !TAKYIDAT_KEYS.includes(def.key) && def.key !== "comparables");
    const comparablesDef = rawGridDefs.find((def) => def.key === "comparables");

    otherRawDefs.forEach((def) => {
      const cellGrid = rawGridCellGridFor(def);
      if (!cellGrid) return;
      sheets.push({ name: sanitizeSheetName(def.title, usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, cellGrid) });
    });

    // Kullanıcı talebi (2026-08-31, ekran görüntüsüyle): "ada parseli ayrı
    // çoklu taleplerde takyidat excel export tablosu daha okunaklı ve
    // kullanıcı dostu olmalı şerh türü tarih yevmiye no kısıtlı malik var
    // ise haciz tutarı kapsadığı ada parsel sütunları bulunmalı" —
    // rawGridCellGridFor (yukarıda) yalnızca AKTİF taşınmazın ham
    // ızgarasını okuduğundan, Çoklu Talep'te (2+ taşınmaz) diğer
    // taşınmazların şerh/beyan/ipotek kayıtları bu sayfaya HİÇ YANSIMIYORDU.
    // buildTakyidat*UnitsSummaryWordTableHtml (app.js) — diğer 8
    // "Taşınmazlar ... Özeti" sayfasıyla AYNI generatedCellGridFor()
    // deseninde — 2+ taşınmazda TÜM taşınmazların kayıtlarını, "Ada /
    // Parsel" (hangi taşınmaz(lar)ı kapsadığı) sütunuyla BİRLEŞTİRİP
    // döner; boş dönerse (tekil rapor) ESKİ rawGridCellGridFor davranışına
    // (yalnızca aktif taşınmazın ızgarası) düşülür — kullanıcının paylaştığı
    // TEK taşınmazlı örnek ekran görüntüsündeki düzen AYNEN korunur.
    const multiUnitTakyidatCombined = combineNamedGrids([
      { title: "Beyanlar - Hak ve Mükellefiyetler", cellGrid: generatedCellGridFor("buildTakyidatDeclarationsUnitsSummaryWordTableHtml") },
      { title: "Şerhler", cellGrid: generatedCellGridFor("buildTakyidatAnnotationsUnitsSummaryWordTableHtml") },
      { title: "İpotekler", cellGrid: generatedCellGridFor("buildTakyidatMortgagesUnitsSummaryWordTableHtml") },
    ]);
    const takyidatCombined = multiUnitTakyidatCombined || combineNamedGrids(
      takyidatDefs.map((def) => ({ title: def.title, cellGrid: rawGridCellGridFor(def) }))
    );
    if (takyidatCombined) {
      sheets.push({ name: sanitizeSheetName("Takyidat", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, takyidatCombined, { uniformColumnWidth: COMBINED_SHEET_FINE_COLUMN_WIDTH }) });
    }

    const expenseSheetXml = buildExpenseFeesSheet(styleRegistry);
    if (expenseSheetXml) {
      sheets.push({ name: sanitizeSheetName("Masraf Tablosu", usedNames), sheetXml: expenseSheetXml });
    }

    const valuationAndComparableNamedGrids = [
      { title: "Değerlendirme Tablosu", cellGrid: generatedCellGridFor("buildValuationSummaryWordTableHtml") },
      { title: "Kat Bazında İndirgenmiş Alan Tablosu", cellGrid: generatedCellGridFor("buildExplanationsFloorValuationWordTableHtml") },
      { title: "Emsal Kayıtları", cellGrid: comparablesDef ? rawGridCellGridFor(comparablesDef) : null },
      { title: "Emsal Matrisi", cellGrid: generatedCellGridFor("buildComparableMatrixWordTableHtml") },
      { title: "Emsal Değerleme Tablosu", cellGrid: generatedCellGridFor("buildComparableValuationWordTableHtml") },
    ];
    const valuationAndComparableCombined = combineNamedGrids(valuationAndComparableNamedGrids);
    if (valuationAndComparableCombined) {
      sheets.push({ name: sanitizeSheetName("Değerleme ve Emsaller", usedNames), sheetXml: buildSheetXmlFromCellGrid(styleRegistry, valuationAndComparableCombined, { uniformColumnWidth: COMBINED_SHEET_FINE_COLUMN_WIDTH }) });
    }

    return { sheets, stylesXml: styleRegistry.buildStylesXml() };
  }

  // options.download = false: blob'u indirmeden döner — zip paketleme
  // (Banka Şablonuyla Kaydet) için kullanılır.
  function exportAllTables(options = {}) {
    const { sheets, stylesXml } = buildSheetsFromCurrentState();
    if (!sheets.length) throw new Error("Dışa aktarılacak dolu tablo bulunamadı.");
    const blob = buildWorkbookBlob(sheets, stylesXml);
    const baseName = (typeof buildExportBaseFileName === "function" && buildExportBaseFileName()) || "rapor";
    const fileName = `${baseName}-tum-tablolar.xlsx`;
    if (options.download !== false) window.RaporXlsxFill.downloadBlob(fileName, blob);
    return { fileName, sheetCount: sheets.length, sheetNames: sheets.map((s) => s.name), blob };
  }

  window.RaporReportTablesXlsx = {
    exportAllTables,
    // Test/diagnostik için düşük seviye API'ler:
    parseHtmlTables,
    createStyleRegistry,
    buildSheetXmlFromGrid,
    buildSheetXmlFromCellGrid,
    combineNamedGrids,
    remapCellGridToFineColumns,
    COMBINED_SHEET_FINE_COLUMNS,
    COMBINED_SHEET_FINE_COLUMN_WIDTH,
  };
})();
