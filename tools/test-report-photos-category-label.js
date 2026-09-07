"use strict";

/*
  Kullanıcı talebi (2026-09-08): "Panel görünümü: Yalnızca içinde
  fotoğraf olan kategoriler, Word çıktısındakiyle aynı lacivert başlık
  banner'ı ile listelenir ... bu kısımı değiştireceğiz. bunun yerine
  eklenen görsel yada görsel grubu altına sadece font olarak yazacağız
  görselin türünü" — AskUserQuestion ile netleştirildi ("Kategori
  grid'inin altında TEK etiket", Önerilen): kategori gruplaması (bir
  kategorideki TÜM fotoğraflar tek grid'de) AYNEN kalıyor — yalnızca
  üstteki lacivert dolgu banner (report-photos-category-banner)
  KALDIRILDI, YERİNE grid'in ALTINA düz (renksiz) font ile bir etiket
  (report-photos-category-label) eklendi.

  Word/.docx export'undaki (templates/emlakkatilim.docx, "8.1
  Fotoğraflar") lacivert banner BU DEĞİŞİKLİKTEN ETKİLENMEDİ — bu
  YALNIZCA ekran-içi önizleme paneli (createReportPhotoCategoryGroup),
  bu yüzden tools/test-emlakkatilim-photo-embed.js'e (export tarafı)
  DOKUNULMADI.

  Bu test kaynak-düzeyinde (gerçek app.js/styles.css metninden) doğrular:
   1) createReportPhotoCategoryGroup() artık report-photos-category-banner
      SINIFINI HİÇ kullanmıyor.
   2) report-photos-category-label sınıfını kullanıyor VE bu, GRİD'İN
      (data-report-photos-grid) HEMEN ARDINDAN (ekran sırasıyla AŞAĞISINDA)
      geliyor — üstte DEĞİL.
   3) Etiket metni hâlâ escapeHtml(category.label) ile kaçışlanıyor (XSS
      güvenliği regresyonu değil).
   4) styles.css'te .report-photos-category-banner kuralı ARTIK YOK;
      .report-photos-category-label düz (arka plansız, yalnızca font/renk)
      bir stil taşıyor; .report-photos-grid artık banner'a "yapışık"
      olmayı varsayan asimetrik kenarlık/köşe (border-top:none,
      border-radius: 0 0 6px 6px) YERİNE tam bir kenarlık/köşe kullanıyor.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const stylesSource = fs.readFileSync(path.join(appDir, "styles.css"), "utf8");

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

// --- 1) createReportPhotoCategoryGroup(): banner kaldırıldı, altta -------
// düz metin etiket eklendi, grid önce/etiket sonra sırası ------------------
{
  const body = extractFunction("createReportPhotoCategoryGroup");
  assert.ok(
    !body.includes("report-photos-category-banner"),
    "createReportPhotoCategoryGroup() artık 'report-photos-category-banner' sınıfını HİÇ kullanmamalı (üstteki lacivert banner kaldırıldı)."
  );
  assert.ok(
    body.includes("report-photos-category-label"),
    "createReportPhotoCategoryGroup() 'report-photos-category-label' sınıfını içermeli (yeni düz-metin etiket)."
  );
  assert.match(
    body,
    /<div class="report-photos-grid" data-report-photos-grid><\/div>\s*<p class="report-photos-category-label">\$\{escapeHtml\(category\.label\)\}<\/p>/,
    "Etiket, grid DIV'İNİN HEMEN ARDINDAN (ekranda ALTINDA) gelmeli — üstte DEĞİL — ve escapeHtml(category.label) ile kaçışlanmalı."
  );
  console.log("createReportPhotoCategoryGroup(): banner kaldırılıp grid altına düz-metin etiket eklenmesi testi tamam.");
}

// --- 2) styles.css: banner kuralı kaldırıldı, yeni düz etiket stili -------
// eklendi, grid artık tam kenarlık/köşe kullanıyor -------------------------
{
  assert.ok(
    !stylesSource.includes(".report-photos-category-banner {"),
    "styles.css'te '.report-photos-category-banner' KURALI (seçici + süslü parantez) ARTIK OLMAMALI (lacivert dolgu banner kaldırıldı)."
  );
  const labelRuleStart = stylesSource.indexOf(".report-photos-category-label {");
  assert.ok(labelRuleStart >= 0, "styles.css'te '.report-photos-category-label' kuralı bulunamadı.");
  const labelRuleEnd = stylesSource.indexOf("}", labelRuleStart);
  const labelRule = stylesSource.slice(labelRuleStart, labelRuleEnd);
  assert.ok(labelRule.includes("color: var(--muted)"), "'.report-photos-category-label' var(--muted) ile mevcut 'ikincil metin' rengini kullanmalı.");
  assert.ok(!labelRule.includes("background"), "'.report-photos-category-label' arka plan (background) TAŞIMAMALI — 'sadece font' talebiyle tutarlı, kutu/banner GÖRÜNÜMÜ olmamalı.");

  const gridRuleStart = stylesSource.indexOf(".report-photos-grid {");
  assert.ok(gridRuleStart >= 0, "styles.css'te '.report-photos-grid' kuralı bulunamadı.");
  const gridRuleEnd = stylesSource.indexOf("}", gridRuleStart);
  const gridRule = stylesSource.slice(gridRuleStart, gridRuleEnd);
  assert.ok(!gridRule.includes("border-top: none"), "'.report-photos-grid' ARTIK 'border-top: none' TAŞIMAMALI (banner'a yapışık olma varsayımı kalktı, üstte de normal kenarlık olmalı).");
  assert.ok(gridRule.includes("border-radius: 6px;"), "'.report-photos-grid' artık TAM (simetrik) bir border-radius kullanmalı (eski '0 0 6px 6px' asimetrisi banner'a özeldi).");
  console.log("styles.css: banner kuralı kaldırılıp düz-metin etiket stili + tam kenarlıklı grid eklenmesi testi tamam.");
}

console.log("Fotoğraflar paneli — kategori etiketi (banner yerine düz metin) testi tamam.");
