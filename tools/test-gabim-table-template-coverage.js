"use strict";

/*
  Kullanıcı bildirimi (2026-09-13): "Gabim çoklu tablo template
  dosyalarında yok. kuveyttürkte kesin yok diğerlerine bakmadım kontrol
  eder misin" — tarama sonucu: `{{TASINMAZLARGABIMTABLOSU}}` (bkz.
  buildGabimUnitsSummaryWordTableHtml, template-engine.js'teki
  TASINMAZLARGABIMTABLOSU kablolaması) HİÇBİR şablonda YOKTU — yalnızca
  Kuveyt Türk değil, 10 "gerçek" şablonun (bkz. aşağıdaki
  REAL_TEMPLATES) TAMAMINDA eksikti. Hesaplama tarafı (buildGabimUnitsSummaryTableData/
  buildGabimUnitsSummaryWordTableHtml) VE template-engine.js kablolaması
  ZATEN tam çalışır durumdaydı — yalnızca şablon dosyalarına token'ın
  KENDİSİ hiç eklenmemişti.

  Kullanıcıya AskUserQuestion ile soruldu: hangi kapsamda eklensin —
  yalnızca Ziraat (Gabim'in alan yapısı Ziraat'in kendi ekspertiz
  sistemine göre modellenmiş), TASINMAZLARBAGIMSIZBOLUMTABLOSU ile aynı
  8 şablon (arsa/arazi HARİÇ), yoksa TASINMAZLARTAPUTABLOSU ile aynı 10
  şablon (arsa/arazi DAHİL, yalnızca isbankasi-masraf/ziraat-ek-tablo
  hariç — bu ikisi zaten HİÇBİR dinamik `.word-table`/token mekanizması
  kullanmıyor). Kullanıcı "TASINMAZLARTAPUTABLOSU ile aynı 10 şablona"
  seçeneğini seçti — Gabim, tapu/tescil bilgilerine en yakın kapsamlı
  bankalar-arası veri seti olarak ele alındı.

  Düzeltme: `{{TASINMAZLARGABIMTABLOSU}}` her 10 şablonda, kendi
  `{{TASINMAZLARTAPUTABLOSU}}` satırının HEMEN ALTINA (aynı girinti
  biçimiyle) eklendi — Tapu Bilgileri'ni takip eden en doğal konum
  (Gabim de tapu-kayıt kökenli, bankaya-özel EK bir veri seti).

  Bu test:
  1) 10 "gerçek" şablonun HER BİRİNİN `{{TASINMAZLARGABIMTABLOSU}}`
     içerdiğini VE bunun `{{TASINMAZLARTAPUTABLOSU}}` ile AYNI şablonda
     bulunduğunu (kapsam eşleşmesi) doğrular.
  2) isbankasi-masraf.html/ziraat-ek-tablo.html'in (hiçbir dinamik tablo
     kullanmayan, kapsam dışı 2 dosya) HÂLÂ dokunulmadığını doğrular.
  3) template-engine.js'teki TASINMAZLARGABIMTABLOSU -> buildGabimUnitsSummaryWordTableHtml
     kablolamasının (ZATEN var olan, bu turda dokunulmayan) sağlam
     olduğunu regresyon kilidi olarak doğrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
const REAL_TEMPLATES = [
  "akbank", "halkbank", "isbankasi", "kuveytturk", "kuveytturk-arsa-arazi",
  "vakifbank", "vakifkatilim", "yapikredi", "ziraat", "ziraat-arsa-arazi",
];
const OUT_OF_SCOPE_TEMPLATES = ["isbankasi-masraf", "ziraat-ek-tablo"];

// --- 1) 10 gerçek şablonun HER BİRİ Gabim tablosunu (Tapu tablosuyla ---
// AYNI kapsamda) içermeli --------------------------------------------
REAL_TEMPLATES.forEach((name) => {
  const source = fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.html`), "utf8");
  assert.ok(
    source.includes("{{TASINMAZLARTAPUTABLOSU}}"),
    `${name}.html: {{TASINMAZLARTAPUTABLOSU}} bulunamadı (REAL_TEMPLATES listesi hatalı olabilir).`
  );
  assert.ok(
    source.includes("{{TASINMAZLARGABIMTABLOSU}}"),
    `${name}.html: {{TASINMAZLARGABIMTABLOSU}} EKSİK — kullanıcı bildirimi (2026-09-13) bu şablonun Tapu tablosuyla AYNI kapsamda Gabim tablosu da içermesini istedi.`
  );
  console.log(`${name}.html: {{TASINMAZLARGABIMTABLOSU}} mevcut testi tamam.`);
});

// --- 2) Kapsam dışı 2 dosya HÂLÂ dokunulmamış olmalı --------------------
OUT_OF_SCOPE_TEMPLATES.forEach((name) => {
  const source = fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.html`), "utf8");
  assert.ok(
    !source.includes("{{TASINMAZLARGABIMTABLOSU}}"),
    `${name}.html'e YANLIŞLIKLA {{TASINMAZLARGABIMTABLOSU}} eklenmiş (bu dosya hiçbir dinamik tablo/token mekanizması kullanmıyor, kapsam dışı).`
  );
  console.log(`${name}.html: Gabim tablosu YOK (kapsam dışı, doğru) testi tamam.`);
});

// --- 3) template-engine.js kablolama regresyon kilidi -------------------
{
  const templateEngineSource = fs.readFileSync(
    path.join(__dirname, "..", "src", "templates", "template-engine.js"),
    "utf8"
  );
  assert.ok(
    /TASINMAZLARGABIMTABLOSU:\s*\{\s*h:\s*\(\)\s*=>\s*safeCall\("buildGabimUnitsSummaryWordTableHtml"\)\s*\}/.test(templateEngineSource),
    "template-engine.js'te {{TASINMAZLARGABIMTABLOSU}} -> buildGabimUnitsSummaryWordTableHtml kablolaması bulunamadı."
  );
  console.log("template-engine.js {{TASINMAZLARGABIMTABLOSU}} kablolama regresyon kilidi testi tamam.");
}

console.log("Gabim Özeti tablosu şablon kapsamı testleri başarılı.");
