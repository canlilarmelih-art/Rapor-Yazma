// Kullanıcı talebi (2026-09-10): "0,55 yüksekliği diğer hangi tablolara
// uygulayabiliriz... incelenen belgeler tablosunu yap. önce" — Emsal
// Matrisi'nde (bkz. tools/test-comparable-matrix-word-table-compact-rows.js)
// gerçek bir Word ekran görüntüsüyle KANITLANMIŞ olan "at-least" (Word'ün
// kendi hesapladığı 'gereken yükseklik'e göre satırı GEREĞİNDEN FAZLA
// büyütmesine izin veren bir taban) yerine "exactly" (satırı GERÇEKTEN
// zorunlu tutan) kullanma çözümü, İncelenen Belgeler tablosuna da
// uygulandı — bu tablonun hiçbir sütunu (Takyidat'ın "Açıklama"sının
// aksine) UZUN serbest metin (textarea) İÇERMİYOR, bu yüzden güvenli.
//
// KRİTİK: buildCompactReportWordTableHtml() İKİ farklı tablo ailesi
// tarafından PAYLAŞILIYOR — İncelenen Belgeler (bu değişiklik) VE
// Takyidat (tek + çoklu taşınmaz özeti, "Açıklama" sütunu UZUN serbest
// metin içerebiliyor — "exactly" bunu KIRPAR/ÜST ÜSTE BİNDİRİR, Emsal
// Matrisi'nde textarea alanları için AYNI nedenle kaçınılmıştı). Bu
// yüzden yeni `options.rowHeightRule` parametresi İLE opt-in: yalnızca
// İncelenen Belgeler "exactly" geçiriyor, Takyidat çağrıları HİÇBİR ŞEY
// geçirmeyip varsayılan "at-least"te (DEĞİŞMEDEN) kalıyor.
//
// Bu test kapsamı:
//  1) buildCompactReportWordTableHtml() varsayılan (rowHeightRule
//     verilmezse) hâlâ "at-least" üretir (regresyon kilidi).
//  2) { rowHeightRule: "exactly" } verildiğinde HEM başlık HEM gövde
//     (hem normal hem __section) satırlarında "exactly" üretir.
//  3) Yükseklik DEĞERLERİ (0.66cm/0.6cm, height="25"/"23") DEĞİŞMEDİ —
//     yalnızca kural (at-least/exactly) değişti.
//  4) Kaynak metin: buildReviewedDocumentsWordTableHtml()
//     rowHeightRule: "exactly" GEÇİRİYOR; buildTakyidatWordTableHtml()
//     ve buildTakyidatCategoryUnitsSummaryTableHtml() rowHeightRule HİÇ
//     GEÇİRMİYOR (varsayılan "at-least"te kalmalı — Açıklama sütunundaki
//     uzun metin KIRPILMASIN).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = ["buildCompactReportWordTableHtml", "getReportThemeToken", "formatWordCell", "escapeHtml"];
const sandboxSource = `
  ${functionNames.map(extractFunction).join("\n")}
  return { buildCompactReportWordTableHtml };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

const headers = ["Belge Türü", "İncelenen Kurum", "Tarih", "No", "Kapsam"];
const rows = [
  ["Tapu Kaydı", "Tapu Müdürlüğü", "01.02.2026", "12345", "Mülkiyet"],
  Object.assign(["Başlık Satırı"], { __section: true }),
  ["Ruhsat", "Belediye", "03.04.2026", "6789", "İnşaat"],
];

// --- 1) Varsayılan (rowHeightRule verilmezse) -> hâlâ "at-least" --------
{
  const html = fns.buildCompactReportWordTableHtml(headers, rows);
  const trOpenTags = html.match(/<tr[^>]*>/g) || [];
  assert.equal(trOpenTags.length, rows.length + 1, "Başlık + gövde satırı sayısı kadar <tr> olmalı.");
  trOpenTags.forEach((tag, index) => {
    assert.ok(tag.includes("mso-height-rule:at-least"), `Varsayılan: satır #${index} hâlâ "at-least" içermeli (regresyon): ${tag}`);
    assert.ok(!tag.includes("mso-height-rule:exactly"), `Varsayılan: satır #${index} "exactly" İÇERMEMELİ: ${tag}`);
  });
  console.log("buildCompactReportWordTableHtml varsayilan (rowHeightRule yok) -> at-least REGRESYON testi tamam.");
}

// --- 2) + 3) { rowHeightRule: "exactly" } -> TÜM satırlarda "exactly", --
// yükseklik DEĞERLERİ (0.66cm/0.6cm, height="25"/"23") DEĞİŞMEDİ.
{
  const html = fns.buildCompactReportWordTableHtml(headers, rows, { rowHeightRule: "exactly" });
  const trOpenTags = html.match(/<tr[^>]*>/g) || [];
  assert.equal(trOpenTags.length, rows.length + 1, "Başlık + gövde satırı sayısı kadar <tr> olmalı.");

  // Başlık: height="25" / 0.66cm.
  assert.ok(trOpenTags[0].includes('height="25"'), `Başlık satırı height=\"25\" içermeli: ${trOpenTags[0]}`);
  assert.ok(trOpenTags[0].includes("height:0.66cm"), `Başlık satırı 0.66cm içermeli: ${trOpenTags[0]}`);
  assert.ok(trOpenTags[0].includes("mso-height-rule:exactly"), `Başlık satırı "exactly" içermeli: ${trOpenTags[0]}`);

  // Gövde (normal + __section dahil): height="23" / 0.6cm.
  trOpenTags.slice(1).forEach((tag, index) => {
    assert.ok(tag.includes('height="23"'), `Gövde satırı #${index} height=\"23\" içermeli: ${tag}`);
    assert.ok(tag.includes("height:0.6cm"), `Gövde satırı #${index} 0.6cm içermeli: ${tag}`);
    assert.ok(tag.includes("mso-height-rule:exactly"), `Gövde satırı #${index} "exactly" içermeli: ${tag}`);
    assert.ok(!tag.includes("at-least"), `Gövde satırı #${index} artık "at-least" İÇERMEMELİ: ${tag}`);
  });

  console.log("buildCompactReportWordTableHtml rowHeightRule:'exactly' -> TUM satirlar exactly, degerler AYNI testi tamam.");
}

// --- 4) Kaynak metin: kablolama ------------------------------------------
{
  const reviewedFnSource = extractFunction("buildReviewedDocumentsWordTableHtml");
  assert.ok(
    reviewedFnSource.includes('rowHeightRule: "exactly"'),
    "buildReviewedDocumentsWordTableHtml() rowHeightRule: \"exactly\" GEÇİRMELİ."
  );

  const takyidatSingleFnSource = extractFunction("buildTakyidatWordTableHtml");
  assert.ok(
    !takyidatSingleFnSource.includes("rowHeightRule"),
    "buildTakyidatWordTableHtml() rowHeightRule HİÇ GEÇİRMEMELİ (Açıklama sütunundaki uzun metin KIRPILMASIN)."
  );

  const takyidatMultiFnSource = extractFunction("buildTakyidatCategoryUnitsSummaryTableHtml");
  assert.ok(
    !takyidatMultiFnSource.includes("rowHeightRule"),
    "buildTakyidatCategoryUnitsSummaryTableHtml() rowHeightRule HİÇ GEÇİRMEMELİ (Açıklama sütunundaki uzun metin KIRPILMASIN)."
  );

  console.log("Kaynak-duzeyi kablolama: incelenen belgeler exactly, Takyidat (tek+coklu) DEGISMEDI testi tamam.");
}

console.log("Incelenen Belgeler tablosu: kompakt satir yuksekligi (exactly, Takyidat'a sizmayan) testleri basarili.");
