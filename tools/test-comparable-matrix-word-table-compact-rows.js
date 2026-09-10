// Kullanıcı bildirimi (2026-09-10, ekran görüntüsüyle): "TEMPLATE ile
// alınan word çıktılarında görseldeki emsaller tablosunda satır
// yüksekliklerini %30 oranında kısaltalım. tek bir sayfaya sığmalı emsal
// tablosu" — ekran görüntüsü buildComparableMatrixWordTableHtml()'in
// ürettiği "Emsal Matrisi" tablosuydu (Alan | Emsal 1 | Emsal 2 | ...).
//
// Kök sebep: bu tablo buildSimpleHtmlTable(..., { compact: true }) ile
// üretiliyor, ama compact modu yalnızca <td>/<th> üzerinde CSS
// padding/line-height küçültüyordu — <tr>'ye ayrıca eklenmesi gereken
// mso-height-source/mso-height-rule YOKTU. Word (MSO) satır yüksekliğini
// CSS padding/line-height'tan DEĞİL, <tr>'deki bu MSO-özel stillerden
// okur; bu dosyadaki DİĞER "tek sayfaya sığmalı" tablolar (ör.
// buildComparableValuationWordTableHtml, buildValuationSummaryWordTableHtml)
// zaten bu tekniği kullanıyordu, yalnızca bu genel fonksiyon eksikti —
// bu yüzden CSS küçük olsa da Word'de satırlar OLMASI GEREKENDEN çok
// daha uzun görünüyordu.
//
// TAKİP bildirimi (2026-09-10, İKİNCİ ekran görüntüsü — yukarıdaki <tr>
// yükseklik düzeltmesinden SONRA): şimdi hücrelerin ÇOĞUNDA metnin
// hemen altında boş, sınır çizgili bir "boşluk" görünüyordu ("bu
// boşlukları istemiyorum"). Üretilen ham HTML'de (bkz. bu dosyanın
// kontrol ettiği kaynak) fazladan hiçbir <tr> YOKTU — kök sebep farklı:
// line-height BİRİMSİZ bir çarpandı ("1"/"1.05"). Word (MSO) satır
// aralığını yalnızca NOKTA (pt) birimli bir değer + mso-line-height-
// rule:exactly VARSA güvenilir şekilde uygular; bu ikisi yoksa kendi
// "Normal" stilinin varsayılan (bizim küçük puntomuzdan ÇOK daha büyük)
// satır aralığını/boşluğunu kullanır — dosyadaki DİĞER MSO tabloları
// zaten nokta-birimli line-height + mso-line-height-rule:exactly
// kullanıyordu, yalnızca bu genel fonksiyon eksikti. Düzeltme TÜM
// buildSimpleHtmlTable çağrılarını (compact olsun olmasın) kapsar.
//
// İKİNCİ TAKİP bildirimi (2026-09-10, ÜÇÜNCÜ ekran görüntüsü —
// "düzelmemiş ki hala boşluk var görmüyor musun"): ilk iki düzeltmeden
// sonra bile satırlar hâlâ ÇOK yüksekti. Kök sebep: Word (MSO), hücre iç
// boşluğunu standart CSS `padding`'ten DEĞİL, kendi `mso-padding-alt`
// özelliğinden okur — bu YOKSA kendi (bizim küçük değerimizden ÇOK daha
// büyük) varsayılan hücre kenar boşluğunu kullanır. Dosyadaki DİĞER MSO
// tabloları ZATEN mso-padding-alt kullanıyordu; yalnızca bu genel
// fonksiyon eksikti — bu ÜÇÜNCÜ, gerçekten eksik parçaydı (ilk ikisi
// GEREKLİYDİ ama TEK BAŞINA YETMEDİ). Düzeltme de TÜM buildSimpleHtmlTable
// çağrılarını kapsar.
//
// Bu test kapsamı:
//  1) compact:true iken (Emsal Matrisi'nin TEK kullanıcısı) hem başlık
//     hem gövde <tr>'lerinde açık bir minimum yükseklik (mso-height-rule)
//     olduğu doğrulanır.
//  2) BİLEREK "exactly" DEĞİL "at-least" kullanıldığı doğrulanır — bu
//     tablo "Konum Karşılaştırma Sebebi"/"Açıklama / Düzeltme"/"Emsal
//     Metni" gibi UZUN metin (textarea) satırları da içeriyor; "exactly"
//     bu satırlarda metni Word'de KIRPARDI.
//  3) compact:false (varsayılan, DİĞER buildSimpleHtmlTable çağrıları —
//     Takyidat/İncelenen Belgeler/Hesaplanan Emsal vb.) davranışının
//     DEĞİŞMEDİĞİ — <tr>'lere herhangi bir yükseklik EKLENMEDİĞİ
//     (regresyon kilidi) doğrulanır.
//  4) buildComparableMatrixWordTableHtml() kaynak metninin hâlâ
//     buildSimpleHtmlTable(..., "is-matrix", { compact: true }) çağırdığı
//     (kablolama) doğrulanır.
//  5) her iki modda (compact ve değil) hücre satır-aralığının nokta-
//     birimli + mso-line-height-rule:exactly olduğu, ASLA birimsiz bir
//     çarpan olmadığı doğrulanır (yukarıdaki İKİNCİ bildirimin kök
//     sebebine karşı regresyon kilidi).
//  6) her iki modda hücre dolgusunun mso-padding-alt'ı da (padding ile
//     AYNI değerlerle) içerdiği doğrulanır (yukarıdaki ÜÇÜNCÜ bildirimin
//     kök sebebine karşı regresyon kilidi).

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
const rows = [
  ["İrtibat", "Ali Bey", "Veli Bey"],
  ["Enlem", "40.301190", "40.298161"],
  ["Emsal Metni", "Çok uzun bir açıklama metni burada yer alacak ve Word'de birden fazla satıra sarabilir.", "İkinci emsalin de kendi uzun metni burada."],
];

// --- 1) + 2) compact:true -> her <tr>'de "at-least" minimum yükseklik ----
{
  const html = fns.buildSimpleHtmlTable(headers, rows, "is-matrix", { compact: true });
  const trOpenTags = html.match(/<tr[^>]*>/g) || [];
  assert.equal(trOpenTags.length, rows.length + 1, "Başlık + gövde satırı sayısı kadar <tr> olmalı.");
  trOpenTags.forEach((tag, index) => {
    assert.ok(tag.includes('height="11"'), `<tr> #${index} height=\"11\" içermeli: ${tag}`);
    assert.ok(tag.includes("height:0.28cm"), `<tr> #${index} 0.28cm yükseklik içermeli: ${tag}`);
    assert.ok(tag.includes("mso-height-source:userset"), `<tr> #${index} mso-height-source:userset içermeli: ${tag}`);
    assert.ok(tag.includes("mso-height-rule:at-least"), `<tr> #${index} mso-height-rule:at-least içermeli (KIRPMASIN): ${tag}`);
  });
  assert.ok(!html.includes("mso-height-rule:exactly"), "compact Emsal Matrisi \"exactly\" KULLANMAMALI (uzun metin satırlarını kırpar).");
  assert.ok(html.includes("padding:0.7pt 1.2pt;"), "compact hücre dolgusu sıkılaştırılmış olmalı.");
  // Kullanıcı bildirimi (2026-09-10, ÜÇÜNCÜ ekran görüntüsü — "düzelmemiş
  // ki hala boşluk var"): ilk İKİ düzeltmeden (<tr> yüksekliği + line-
  // height/mso-line-height-rule) SONRA bile satırlar hâlâ çok yüksekti.
  // Kök sebep: Word, hücre iç boşluğunu standart CSS `padding`'ten DEĞİL,
  // kendi `mso-padding-alt` özelliğinden okur — bu YOKSA kendi çok daha
  // büyük varsayılan hücre kenar boşluğunu kullanır.
  assert.ok(
    html.includes("mso-padding-alt:0.7pt 1.2pt 0.7pt 1.2pt;"),
    "compact hücrelerde mso-padding-alt (padding ile AYNI değerlerle) olmalı — yoksa Word kendi buyuk varsayilan hucre bosluğunu kullanir."
  );
  // Kullanıcı bildirimi (2026-09-10, İKİNCİ ekran görüntüsü — yukarıdaki
  // <tr> yüksekliği düzeltmesinden SONRA): hücrelerin çoğunda metnin
  // altında boş bir "boşluk" görünüyordu. Kök sebep: line-height BİRİMSİZ
  // bir çarpandı ("1") — Word (MSO) satır aralığını yalnızca NOKTA (pt)
  // birimli bir değer + mso-line-height-rule:exactly VARSA dikkate alır;
  // yoksa kendi (bizim küçük puntomuzdan çok daha büyük) varsayılan satır
  // aralığını kullanıp fazladan boşluk ekler.
  assert.ok(html.includes("line-height:6.5pt;mso-line-height-rule:exactly;"), "compact hücrelerde nokta-birimli line-height + mso-line-height-rule:exactly olmalı (fazladan bosluk BIRAKMAMALI).");
  assert.ok(!/line-height:1;/.test(html), "line-height artik BIRIMSIZ bir carpan (\"1\") OLMAMALI — Word bunu guvenilir yorumlamiyor.");
  // Uzun metin hücresi HÂLÂ tam olarak içerikte yer almalı (kırpılmamalı) —
  // yükseklik kısıtlaması yalnızca <tr> ATTRIBUTE/STYLE düzeyinde, metnin
  // kendisi buildSimpleHtmlTable tarafından hiç kesilmiyor.
  assert.ok(html.includes("Çok uzun bir açıklama metni burada yer alacak"), "Uzun metin içeriği eksiksiz kalmalı.");
  console.log("compact Emsal Matrisi: <tr> minimum yukseklik (at-least, kirpmayan) testi tamam.");
}

// --- 3) compact:false (varsayılan) -> <tr> YÜKSEKLİK ZORLAMASI/dolgu -----
// DEĞİŞMEZ (o kısım hâlâ yalnızca compact'e özel); ama satır-aralığı
// düzeltmesi (mso-line-height-rule:exactly) TÜM çağrıları etkiliyor —
// eksiklik ORADA da vardı, yalnızca Emsal Matrisi'nde fark edildi.
{
  const html = fns.buildSimpleHtmlTable(headers, rows, "meta");
  assert.ok(!html.includes("mso-height-rule"), "compact:false iken <tr>'lere HİÇBİR satır-yüksekliği mso-height-rule EKLENMEMELİ (regresyon, <tr> düzeyi).");
  assert.ok(!html.includes('height="11"'), "compact:false iken height=\"11\" attribute'ü EKLENMEMELİ.");
  assert.ok(!html.includes("padding:0.7pt 1.2pt;"), "compact:false iken sıkılaştırılmış compact dolgu KULLANILMAMALI.");
  assert.ok(html.includes("line-height:8pt;mso-line-height-rule:exactly;"), "compact:false (dar tablo) iken de nokta-birimli line-height + mso-line-height-rule:exactly OLMALI (bu düzeltme TÜM çağrıları kapsar).");
  assert.ok(
    html.includes("mso-padding-alt:2.4pt 3pt 2.4pt 3pt;"),
    "compact:false (dar tablo) iken de mso-padding-alt OLMALI (bu düzeltme de TÜM çağrıları kapsar)."
  );
  console.log("compact:false (diger tablolar): satir yuksekligi zorlamasi degismedi, dolgu/satir araligi duzeltmesi UYGULANDI testi tamam.");
}

// --- 4) Kaynak metin: buildComparableMatrixWordTableHtml hâlâ compact ----
// modunu kullanarak buildSimpleHtmlTable çağırıyor.
{
  const fnSource = extractFunction("buildComparableMatrixWordTableHtml");
  assert.ok(
    fnSource.includes('buildSimpleHtmlTable(headers, bodyRows, "is-matrix", { compact: true })'),
    "buildComparableMatrixWordTableHtml() hâlâ buildSimpleHtmlTable(..., \"is-matrix\", { compact: true }) çağırmalı."
  );
  console.log("buildComparableMatrixWordTableHtml kaynak-duzeyi kablolama testi tamam.");
}

console.log("Emsal Matrisi Word tablosu: kompakt satir yuksekligi testleri basarili.");
