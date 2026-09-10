// Kullanıcı bildirimi (2026-09-10, DÖRDÜNCÜ tur — "yine olmamış
// başaramadık bunu"): app.js'teki (buildSimpleHtmlTable) ÜÇ ayrı
// satır-içi (<tr>/<td> style="...") düzeltmesinden (0.0.732/733/734)
// SONRA bile Emsal Matrisi Word çıktısında satırlar hâlâ yüksekti,
// PİKSEL PİKSEL değişmemiş gibiydi.
//
// Gerçek kök sebep bulundu: HER banka şablonunun (templates/*.html)
// KENDİ <style> bloğunda `.word-table th, .word-table td { padding:
// ...; }` ve daha ÖZGÜL bir `.pg-section ... td, .pg-section ... th
// { padding: ...; font-size: ...; }` kuralı VAR — bunlar aynı `.word-
// table` sınıfını (buildComparableMatrixWordTableHtml'in ürettiği
// <table class="word-table is-matrix">) hedefliyor. Standart CSS'te
// satır-içi style HER ZAMAN kazanmalı, ama Word'ün (.doc/MHTML) HTML
// motoru bunu GÜVENİLİR şekilde uygulamıyor — sınıf kuralındaki
// `padding` (hiçbir mso-padding-alt eşleniği OLMADAN) etkili kalmaya
// devam ediyordu; bu yüzden app.js'teki üç düzeltme de kaynakta
// DOĞRUYDU ama Word'de HİÇ görünür etkisi olmadı.
//
// akbank.html'deki YORUM (satır ~34-44, düzeltmeden önce) bunu
// AÇIKÇA belgeliyor: "Emsaller/Değerleme motorunun kendi ürettiği
// tablolar ... satır içi stille zaten sıkı punto kullanır" — yani bu
// varsayım daha önce BİLİNÇLİ olarak yapılmış ve YANLIŞ çıkmış.
//
// Düzeltme: Emsal Matrisi ({{EMSALMATRISI}}/{{EMSAL_MATRISI}}/
// {{EMSALTABLOSU}}/{{EMSALDEGERLEMETABLOSU}}) VEYA başka herhangi bir
// `.word-table` sınıflı dinamik tablo (Malikler/Takyidat/Tapu Özeti
// vb.) kullanan TÜM 10 şablonun (bkz. aşağıdaki "2026-09-10 tarama"
// notu) KENDİ `.word-table`/`.pg-section .word-table` (ve kuveytturk'te
// ayrıca `table.kt-list`) CSS kurallarına DA (yalnızca app.js'e DEĞİL)
// mso-padding-alt + mso-line-height-rule:exactly + (yalnızca .pg-section
// kapsamında) satır yüksekliği (mso-height-rule:at-least) eklendi —
// kaynak (satır-içi mi, sınıf kuralı mı) HANGİSİ kazanırsa kazansın
// artık İKİSİ DE kompakt.
//
// Bu test kapsamı: her 10 şablonda hem TABAN (.word-table th/td, veya
// kuveytturk'te + table.kt-list) hem de .pg-section İÇİNDEKİ (daha
// özgül) kuralın mso-padding-alt VE mso-line-height-rule:exactly
// içerdiği, ve .pg-section .word-table (kuveytturk'te + table.kt-list)
// için satır yüksekliği (mso-height-rule:at-least) kuralı olduğu
// doğrulanır; `.word-table` HİÇ kullanmayan 2 şablonun (isbankasi-
// masraf, ziraat-ek-tablo) dokunulmadığı da ayrıca doğrulanır.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");

function extractStyleBlock(source) {
  const start = source.indexOf("<style>");
  const end = source.indexOf("</style>");
  assert(start >= 0 && end > start, "Şablonda <style> bloğu bulunamadı.");
  return source.slice(start, end);
}

// Genel (kuveytturk dışı) şablonlar: yalnızca .word-table sınıfı.
//
// Kullanıcı talebi (2026-09-10): "mevcut tüm template dosyalarını
// tara... emsal matrisi tablosunda yaşadığımız soruna sahip tabloları
// tespit et ve düzelt" — tarama sırasında `isbankasi.html`'in de
// {{EMSAL_MATRISI}} (ALT ÇİZGİLİ yazım) kullandığı ve AYNI eksik
// mso-padding-alt/mso-line-height-rule kuralına sahip olduğu bulundu.
// Bir önceki tur (0.0.735) bunu KAÇIRMIŞTI çünkü envanter taraması
// yalnızca "EMSALMATRISI" (bitişik) dizesini arıyordu — foldTokenName()
// alt çizgiyi RESOLUTION için yok sayar (ikisi de AYNI token'a çözülür),
// ama o taramanın kendisi salt metin arşivlemesiydi, alt çizgili
// yazımı GÖRMEDİ. `isbankasi.html`'in seçici kalıpları (.word-table
// th/td, .pg-section table.meta td/.pg-section .word-table td/th,
// .pg-section .word-table tr) diğer GENERIC şablonlarla BİREBİR aynı
// olduğundan buraya eklenmesi yeterli.
const GENERIC_TEMPLATES = ["akbank", "halkbank", "isbankasi", "vakifbank", "vakifkatilim", "yapikredi", "ziraat", "ziraat-arsa-arazi"];
// kuveytturk ailesi: .word-table VE table.kt-list ikisi de kullanılıyor.
const KUVEYTTURK_TEMPLATES = ["kuveytturk", "kuveytturk-arsa-arazi"];

[...GENERIC_TEMPLATES, ...KUVEYTTURK_TEMPLATES].forEach((templateName) => {
  const filePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
  const source = fs.readFileSync(filePath, "utf8");
  const style = extractStyleBlock(source);
  const isKuveytturk = KUVEYTTURK_TEMPLATES.includes(templateName);

  // 1) TABAN kural: .word-table th, .word-table td { padding: ...; }
  //    mso-padding-alt VE mso-line-height-rule:exactly İÇERMELİ.
  const baseRuleMarker = isKuveytturk
    ? ".word-table th, .word-table td, table.kt-list th, table.kt-list td {"
    : ".word-table th, .word-table td {";
  const baseRuleStart = style.indexOf(baseRuleMarker);
  assert.ok(baseRuleStart >= 0, `${templateName}.html: taban .word-table th/td kuralı bulunamadı.`);
  const baseRuleEnd = style.indexOf("}", baseRuleStart);
  const baseRule = style.slice(baseRuleStart, baseRuleEnd);
  assert.ok(baseRule.includes("mso-padding-alt:"), `${templateName}.html: taban kuralda mso-padding-alt eksik.`);
  assert.ok(baseRule.includes("mso-line-height-rule: exactly"), `${templateName}.html: taban kuralda mso-line-height-rule: exactly eksik.`);

  // 2) .pg-section İÇİNDEKİ (daha özgül) kural: AYNI şekilde
  //    mso-padding-alt + mso-line-height-rule:exactly içermeli.
  const overrideRuleMarker = isKuveytturk
    ? ".pg-section table.kt-form td, .pg-section .word-table td, .pg-section .word-table th, .pg-section table.kt-list td, .pg-section table.kt-list th {"
    : ".pg-section table.meta td, .pg-section .word-table td, .pg-section .word-table th {";
  const overrideRuleStart = style.indexOf(overrideRuleMarker);
  assert.ok(overrideRuleStart >= 0, `${templateName}.html: .pg-section içindeki özgül kural bulunamadı.`);
  const overrideRuleEnd = style.indexOf("}", overrideRuleStart);
  const overrideRule = style.slice(overrideRuleStart, overrideRuleEnd);
  assert.ok(overrideRule.includes("mso-padding-alt:"), `${templateName}.html: .pg-section kuralında mso-padding-alt eksik.`);
  assert.ok(overrideRule.includes("mso-line-height-rule: exactly"), `${templateName}.html: .pg-section kuralında mso-line-height-rule: exactly eksik.`);

  // 3) .pg-section .word-table tr (kuveytturk'te + table.kt-list tr) —
  //    satır yüksekliği İÇİN mso-height-rule:at-least içermeli
  //    (KIRPMASIN — bkz. app.js'teki AYNI "at-least" gerekçesi).
  const trRuleMarker = isKuveytturk
    ? ".pg-section .word-table tr, .pg-section table.kt-list tr {"
    : ".pg-section .word-table tr {";
  const trRuleStart = style.indexOf(trRuleMarker);
  assert.ok(trRuleStart >= 0, `${templateName}.html: .pg-section .word-table tr (satır yüksekliği) kuralı bulunamadı.`);
  const trRuleEnd = style.indexOf("}", trRuleStart);
  const trRule = style.slice(trRuleStart, trRuleEnd);
  assert.ok(trRule.includes("mso-height-source: userset"), `${templateName}.html: satır yüksekliği kuralında mso-height-source: userset eksik.`);
  assert.ok(trRule.includes("mso-height-rule: at-least"), `${templateName}.html: satır yüksekliği kuralında mso-height-rule: at-least eksik (KIRPMAMALI).`);

  console.log(`${templateName}.html: .word-table CSS kuralları (mso-padding-alt/mso-line-height-rule/satır yüksekliği) testi tamam.`);
});

// isbankasi-masraf.html ve ziraat-ek-tablo.html HİÇ .word-table sınıfı
// kullanmıyor (biri düz bir ücret yazısı, diğeri statik/elle doldurulan
// tek bir tablo — app.js'in ürettiği HİÇBİR dinamik <table
// class="word-table"...> buraya enjekte edilmiyor) — bu iki dosyaya
// dokunulmadığını doğrula, kapsam sürüklenmesin.
["isbankasi-masraf", "ziraat-ek-tablo"].forEach((templateName) => {
  const source = fs.readFileSync(path.join(TEMPLATES_DIR, `${templateName}.html`), "utf8");
  assert.ok(!source.includes(".word-table"), `${templateName}.html HİÇ .word-table sınıfı kullanmamalı (bu düzeltmenin kapsamı dışında).`);
  assert.ok(!source.includes("mso-padding-alt"), `${templateName}.html'e YANLIŞLIKLA mso-padding-alt eklenmiş.`);
  console.log(`${templateName}.html: .word-table kullanmıyor, dokunulmadı (kapsam dışı) testi tamam.`);
});

console.log("Banka sablonlari: .word-table CSS'inde mso-padding-alt/mso-line-height-rule/satir yuksekligi testleri basarili.");
