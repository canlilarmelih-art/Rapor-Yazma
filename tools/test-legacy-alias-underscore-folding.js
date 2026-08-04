"use strict";

/*
  Kullanici raporu: bir gercek disa aktarim dosyasinda ("...emlakkatilim.docx")
  Emsal 2/3/4 kartlarinda dogru yazilmis placeholder'lar ("EMSAL_2_TELEFON",
  "EMSAL_2_EMSAL_DURUMU" vb.) "⚠ EMSAL_2_TELEFON" gibi COZULEMEDI isaretiyle
  bos kaldi. Kok neden: template-engine.js'in resolveToken() fonksiyonu
  gelen ham token adini foldTokenName() ile HER ZAMAN alt cizgisiz/noktalamasiz
  hale getirip LEGACY_ALIASES nesnesinde ARAR ("Turkce-katlanmis, noktalama
  duyarsiz karsilastirilir" — dosya basindaki mimari not), ama LEGACY_ALIASES
  nesnesinin bazi anahtarlari (orn. "EMSAL2_TELEFON", "TABLE_x_1_MALIK",
  "ZIRAAT_KONUM_CEVRESEL") ALT CIZGI ICERIYOR — yani nesnenin kendi anahtari
  hicbir zaman foldTokenName'in urettigi alt-cizgisiz bicimle birebir
  eslesmiyordu. Dogrudan `LEGACY_ALIASES[folded]` erisimi bu yuzden bu
  anahtarlar icin HICBIR ZAMAN eslesme bulamiyordu (object literal exact-key
  lookup, fold degil). Duzeltme: yeni getFoldedLegacyAliasIndex() nesnenin
  TUM anahtarlarini da foldTokenName ile normalize edip bir Map'te tutuyor;
  resolveToken artik bu katlanmis indeksten ariyor.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

process.env.NODE_ENV = "test";
const sandboxWindow = {};

const stubState = {
  fields: { city: "Bursa" },
  tables: {
    comparables: [
      {},
      { c0: "Raif Emlak", c1: "05465821929" },
    ],
  },
};
const stubSections = [{ id: "test", fields: [{ key: "city", type: "text" }] }];

function stubEscapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

globalThis.getComparablePlaceholderValue = (rowIndex, fieldKey) => {
  const row = stubState.tables.comparables[rowIndex] || {};
  if (fieldKey === "c1") return row.c1 || "";
  if (fieldKey === "c0") return row.c0 || "";
  return "";
};

const loader = new Function(
  "window", "state", "sections", "collectGeneratedTextPlaceholders",
  "escapeHtml", "formatWordParagraphs", "dateIsoToTr", "parseValuationNumber", "formatSchemeNumber",
  engineSource
);
loader(
  sandboxWindow,
  stubState,
  stubSections,
  () => [],
  stubEscapeHtml,
  (text, paragraphClass) => {
    const classAttr = paragraphClass ? ` class="${stubEscapeHtml(paragraphClass)}"` : "";
    return `<p${classAttr}>${stubEscapeHtml(text)}</p>`;
  },
  (iso) => String(iso || ""),
  (value) => Number.parseFloat(String(value).replace(/\./g, "").replace(",", ".")),
  (value) => new Intl.NumberFormat("tr-TR").format(value)
);

const engine = sandboxWindow.RaporTemplates;
assert.ok(engine, "window.RaporTemplates olusmadi.");

// --- 1) Kullanicinin gercekte yazdigi alt cizgili emsal token'lari --------
{
  const withUnderscore = engine.resolveToken("EMSAL_2_TELEFON");
  assert.ok(withUnderscore.ok, "{{EMSAL_2_TELEFON}} artik cozulebilmeli (eskiden hep 'missing' donuyordu).");
  assert.equal(withUnderscore.html, "05465821929", "EMSAL_2_TELEFON dogru satirin (index 1) c1 degerini donmeli.");

  const noUnderscore = engine.resolveToken("EMSAL2_TELEFON");
  assert.ok(noUnderscore.ok, "Alt cizgisiz yazim ({{EMSAL2_TELEFON}}) de ayni sekilde cozulmeli.");
  assert.equal(noUnderscore.html, withUnderscore.html, "Iki yazim da ayni degeri dondurmeli.");
}

// --- 2) Diger onceden-eslesemeyen alt cizgili statik anahtarlar -----------
{
  globalThis.buildZiraatKonumCevreselText = () => "test cevresel metin";
  const engineSourceHasKey = engineSource.includes("ZIRAAT_KONUM_CEVRESEL:");
  assert.ok(engineSourceHasKey, "ZIRAAT_KONUM_CEVRESEL anahtari template-engine.js'den kaldirilmis olabilir.");
  const resolved = engine.resolveToken("ZIRAAT_KONUM_CEVRESEL");
  assert.ok(resolved.ok, "{{ZIRAAT_KONUM_CEVRESEL}} artik cozulebilmeli.");
}

// --- 3) Var olmayan bir token hala 'missing' donmeli (yanlis pozitif yok) -
{
  const missing = engine.resolveToken("BOYLE_BIR_TOKEN_YOK");
  assert.equal(missing.ok, false, "Gercekten var olmayan bir token yanlislikla 'ok' donmemeli.");
}

console.log("LEGACY_ALIASES alt cizgili anahtar katlama (fold) duzeltmesi testi tamam.");
