// Kullanıcı bildirimi (2026-09-10, ekran görüntüsüyle): "TEMPLATE ile
// alınan word çıktılarında görseldeki emsaller tablosunda satır
// yüksekliklerini %30 oranında kısaltalım. tek bir sayfaya sığmalı emsal
// tablosu" — ekran görüntüsü buildComparableMatrixWordTableHtml()'in
// ürettiği "Emsal Matrisi" tablosuydu (Alan | Emsal 1 | Emsal 2 | ...).
//
// Bu, DÖRT turluk bir düzeltme dizisinin SONUNCUSU:
//  1) <tr>'ye mso-height-rule (0.0.732) — kök sebep: satır yüksekliği
//     CSS padding/line-height'tan değil <tr>'deki MSO stilinden okunur.
//  2) nokta-birimli line-height + mso-line-height-rule:exactly (0.0.733)
//     — kök sebep: birimsiz line-height Word'de güvenilir değil.
//  3) hücre mso-padding-alt (0.0.734) — kök sebep: Word padding'i
//     mso-padding-alt'tan okur, CSS padding'ten değil.
//  4) BU TUR — şablonların KENDİ CSS'ine AYNI üçlü eklendi (0.0.735,
//     kaynak: app.js DIŞINDA, templates/*.html) — kök sebep: her banka
//     şablonunun kendi <style>'ında AYNI .word-table sınıfını hedefleyen
//     bir kural vardı, mso-padding-alt'sız.
//
// SON KANIT (2026-09-10, kullanıcı GERÇEK bir .doc dosyası + Word'ün
// kendi "Tablo Özellikleri > Satır" iletişim kutusunun ekran görüntüsünü
// paylaştı): Word, satır yüksekliğini ("0,28 cm" / "En az") DOĞRU
// ALGILAMIŞ VE SAKLAMIŞ — yani <tr>'deki mso-height-rule mekanizmasının
// KENDİSİ çalışıyor. Sorun: "at-least" (En az) bir TABAN'dır; Word,
// satırı GERÇEKTEN ihtiyaç duyduğunu DÜŞÜNDÜĞÜ yüksekliğe kadar
// büyütüyor — ve bu "gereken yükseklik" hesabı hücre-düzeyi
// mso-padding-alt/mso-line-height-rule'u GÜVENİLİR şekilde dikkate
// almıyor (kaynak HTML standart bir tarayıcıda PİKSEL PİKSEL doğru/
// sıkışık render ediyor — ayrıca doğrulandı — yalnızca Word'ün kendi
// hesabı farklı).
//
// SON DÜZELTME: kısa (textarea/wide OLMAYAN) satırlarda "at-least"
// YERİNE "exactly" kullanılır — <tr> mekanizması Word tarafından doğru
// okunduğu KANITLANDIĞINDAN, "exactly" Word'ün kendi (yanlış) "gereken
// yükseklik" hesabını TAMAMEN BYPASS EDER. UZUN metin (textarea,
// field.wide === true — "Konum Karşılaştırma Sebebi"/"Açıklama /
// Düzeltme"/"Emsal Metni") satırları "exactly" ALAMAZ (metni KIRPAR) —
// bu satırların etiketleri yeni `options.autoHeightRowLabels`
// parametresiyle işaretlenip o satırlarda <tr> yükseklik ZORLAMASI
// TAMAMEN ATLANIR (Word'ün doğal büyümesine bırakılır).
//
// BEŞİNCİ tur (2026-09-10, "şimdi de çok dar" + satırlar arası metin
// ÇAKIŞIYORDU ekran görüntüsü): "exactly" mekanizmasının kendisi artık
// KANITLANMIŞ şekilde çalışıyordu, ama 0.28cm değeri dolgu+satır aralığı
// TOPLAMIYLA (1.4pt+6.5pt≈7.9pt≈0.279cm) neredeyse BİREBİR aynıydı —
// pratikte SIFIR pay bırakıyordu. Word'ün gerçek font/hinting/subpiksel
// render farkları bu payı aştığında, "exactly" metni KIRPMAK yerine ÜST
// ÜSTE BİNDİRİYOR. Düzeltme: satır yüksekliği 0.28cm -> 0.4cm (gerçek
// pay: ~%40).
//
// ALTINCI tur (2026-09-10, kullanıcı talebi: "0,55 e çıkar" — kendi
// gerçek Word çıktısını görerek verdiği ölçü): satır yüksekliği
// 0.4cm -> 0.55cm'e çıkarıldı.
//
// Bu test kapsamı:
//  1) compact:true + KISA satır (autoHeightRowLabels'ta YOK) ->
//     mso-height-rule:exactly (artık "at-least" DEĞİL).
//  2) compact:true + autoHeightRowLabels'taki bir etiketle eşleşen satır
//     -> <tr>'ye HİÇBİR yükseklik zorlaması EKLENMEZ (düz <tr>), metin
//     eksiksiz kalır (KIRPILMAZ).
//  3) Başlık satırı HER ZAMAN "exactly" alır (autoHeightRowLabels'tan
//     bağımsız).
//  4) compact:false (diğer buildSimpleHtmlTable çağrıları) DEĞİŞMEDİ —
//     hiçbir <tr> yükseklik zorlaması yok.
//  5) hücre dolgusu (mso-padding-alt) ve satır aralığı (nokta-birimli
//     line-height + mso-line-height-rule:exactly) ÖNCEKİ turların
//     regresyon kilitleri olarak korunur.
//  6) buildComparableMatrixWordTableHtml() kaynak metninin
//     field.wide'dan autoHeightRowLabels hesaplayıp buildSimpleHtmlTable'a
//     geçirdiği (kablolama) doğrulanır.

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

const functionNames = ["buildSimpleHtmlTable", "getReportThemeToken", "formatWordCell", "escapeHtml"];
const sandboxSource = `
  ${functionNames.map(extractFunction).join("\n")}
  return { buildSimpleHtmlTable };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

const headers = ["Alan", "Emsal 1", "Emsal 2"];
const longText = "Çok uzun bir açıklama metni burada yer alacak ve Word'de birden fazla satıra sarabilir.";
const rows = [
  ["İrtibat", "Ali Bey", "Veli Bey"],
  ["Enlem", "40.301190", "40.298161"],
  ["Emsal Metni", longText, "İkinci emsalin de kendi uzun metni burada."],
];

// --- 1) + 2) + 3) compact:true -> KISA satırlar "exactly", "Emsal ------
// Metni" (autoHeightRowLabels'ta) hiçbir yükseklik zorlaması ALMAZ.
{
  const html = fns.buildSimpleHtmlTable(headers, rows, "is-matrix", { compact: true, autoHeightRowLabels: ["Emsal Metni"] });
  const trOpenTags = html.match(/<tr[^>]*>/g) || [];
  assert.equal(trOpenTags.length, rows.length + 1, "Başlık + gövde satırı sayısı kadar <tr> olmalı.");

  // Başlık ("Alan"/"Emsal 1"/"Emsal 2") + "İrtibat" + "Enlem" -> exactly.
  const shortRowTags = [trOpenTags[0], trOpenTags[1], trOpenTags[2]];
  shortRowTags.forEach((tag, index) => {
    assert.ok(tag.includes('height="21"'), `Kısa satır #${index} height=\"21\" içermeli: ${tag}`);
    assert.ok(tag.includes("height:0.55cm"), `Kısa satır #${index} 0.55cm yükseklik içermeli: ${tag}`);
    assert.ok(tag.includes("mso-height-source:userset"), `Kısa satır #${index} mso-height-source:userset içermeli: ${tag}`);
    assert.ok(
      tag.includes("mso-height-rule:exactly"),
      `Kısa satır #${index} artık mso-height-rule:exactly İÇERMELİ (Word'ün "at-least" ile satırı kendi hesabına göre büyütmesini ENGELLER): ${tag}`
    );
    assert.ok(!tag.includes("at-least"), `Kısa satır #${index} artık "at-least" İÇERMEMELİ: ${tag}`);
  });

  // "Emsal Metni" (autoHeightRowLabels'ta) -> düz <tr>, HİÇBİR yükseklik yok.
  const wideRowTag = trOpenTags[3];
  assert.equal(wideRowTag, "<tr>", `"Emsal Metni" satırına HİÇBİR yükseklik zorlaması eklenmemeli (Word'ün doğal büyümesine bırakılmalı): ${wideRowTag}`);
  assert.ok(html.includes("Çok uzun bir açıklama metni burada yer alacak"), "Uzun metin içeriği eksiksiz kalmalı (KIRPILMAMALI).");
  console.log("compact Emsal Matrisi: kisa satirlar exactly, uzun-metin satiri yukseklik-zorlamasiz testi tamam.");
}

// --- Hücre dolgusu/satır aralığı: önceki turların regresyon kilitleri --
{
  const html = fns.buildSimpleHtmlTable(headers, rows, "is-matrix", { compact: true, autoHeightRowLabels: [] });
  assert.ok(html.includes("padding:0.7pt 1.2pt;"), "compact hücre dolgusu sıkılaştırılmış olmalı.");
  assert.ok(
    html.includes("mso-padding-alt:0.7pt 1.2pt 0.7pt 1.2pt;"),
    "compact hücrelerde mso-padding-alt (padding ile AYNI değerlerle) olmalı — yoksa Word kendi buyuk varsayilan hucre bosluğunu kullanir."
  );
  assert.ok(html.includes("line-height:6.5pt;mso-line-height-rule:exactly;"), "compact hücrelerde nokta-birimli line-height + mso-line-height-rule:exactly olmalı.");
  assert.ok(!/line-height:1;/.test(html), "line-height artik BIRIMSIZ bir carpan (\"1\") OLMAMALI — Word bunu guvenilir yorumlamiyor.");
  console.log("compact hucre dolgusu/satir araligi regresyon kilidi testi tamam.");
}

// --- 4) compact:false (varsayılan) -> DEĞİŞMEDİ ---------------------------
{
  const html = fns.buildSimpleHtmlTable(headers, rows, "meta");
  assert.ok(!html.includes("mso-height-rule"), "compact:false iken <tr>'lere HİÇBİR satır-yüksekliği mso-height-rule EKLENMEMELİ (regresyon, <tr> düzeyi).");
  assert.ok(!html.includes('height="21"'), "compact:false iken height=\"21\" attribute'ü EKLENMEMELİ.");
  assert.ok(!html.includes("padding:0.7pt 1.2pt;"), "compact:false iken sıkılaştırılmış compact dolgu KULLANILMAMALI.");
  assert.ok(html.includes("line-height:8pt;mso-line-height-rule:exactly;"), "compact:false (dar tablo) iken de nokta-birimli line-height + mso-line-height-rule:exactly OLMALI.");
  assert.ok(
    html.includes("mso-padding-alt:2.4pt 3pt 2.4pt 3pt;"),
    "compact:false (dar tablo) iken de mso-padding-alt OLMALI."
  );
  console.log("compact:false (diger tablolar): degismedi REGRESYON testi tamam.");
}

// --- 5) Kaynak metin: buildComparableMatrixWordTableHtml field.wide'dan --
// autoHeightRowLabels hesaplayıp buildSimpleHtmlTable'a geçiriyor.
{
  const fnSource = extractFunction("buildComparableMatrixWordTableHtml");
  assert.ok(
    fnSource.includes("fields.filter((field) => field.wide)"),
    "buildComparableMatrixWordTableHtml() UZUN metin (field.wide) alanlarını tespit etmeli."
  );
  assert.ok(
    fnSource.includes("autoHeightRowLabels"),
    "buildComparableMatrixWordTableHtml() autoHeightRowLabels hesaplamalı."
  );
  assert.ok(
    fnSource.includes('buildSimpleHtmlTable(headers, bodyRows, "is-matrix", { compact: true, autoHeightRowLabels })'),
    "buildComparableMatrixWordTableHtml() hâlâ buildSimpleHtmlTable(..., \"is-matrix\", { compact: true, autoHeightRowLabels }) çağırmalı."
  );
  console.log("buildComparableMatrixWordTableHtml kaynak-duzeyi kablolama (autoHeightRowLabels) testi tamam.");
}

console.log("Emsal Matrisi Word tablosu: kompakt satir yuksekligi (exactly + uzun-metin istisnasi) testleri basarili.");
