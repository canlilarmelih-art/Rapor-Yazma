// "İncelenen Belgeler (Blok Bazında)" — çift taraflı önizleme (2026-09-03).
// Kullanıcı takip talebi: "bu tabloyu aynı zamanda çift taraflı olarak
// belgeler ve proje bölümüne koyabilir miyiz?" — 0.0.626'da Excel
// export'una eklenen (buildDocumentsRowsWithBlockColumn, bkz.
// tools/test-documents-block-column-export.js) blok bazlı "İncelenen
// Belgeler" birleşimi, "Belgeler ve Proje" bölümünde de canlı önizlenmeli.
//
// AskUserQuestion ile netleştirildi: SALT-OKUNUR önizleme (kullanıcının
// seçimi: "Salt-okunur önizleme (Önerilen)") — Tapu/Adres/Değerleme'nin
// "hücreye tıkla, aktif taşınmazı düzenle" ÇİFT YÖNLÜ mekanizması
// (attachTitleUnitsSummaryTableEditing) BİLİNÇLİ OLARAK KULLANILMADI,
// çünkü bu tablonun satırları TAŞINMAZ değil BELGE bazlı ve bazı
// satırlar 2+ bloğu AYNI ANDA temsil ediyor — birleşik bir satırda
// "hangi bloğu düzenliyorum" belirsizliği hiç oluşmasın diye.
//
// UI/DOM üreten create*TablePreview() fonksiyonları bu projede (bkz.
// tools/test-documents-units-summary-table.js'in KENDİSİ de create*
// fonksiyonunu HİÇ çağırmıyor) jsdom ile test edilmiyor — yalnızca
// KAYNAK-DÜZEYİ (string/regex) kablolama kontrolleri yapılır, GERÇEK veri
// mantığı (buildDocumentsRowsWithBlockColumn) zaten ayrı dosyada test
// edilmiş durumda.
//
// Kapsanan kontroller:
//  1) createDocumentsBlockColumnTablePreview() var, buildDocumentsRowsWithBlockColumn()
//     ve buildSimpleHtmlTable() çağırıyor.
//  2) attachTitleUnitsSummaryTableEditing() BİLİNÇLİ OLARAK ÇAĞRILMIYOR
//     (salt-okunur karar — regresyon: biri yanlışlıkla editable yaparsa yakalanır).
//  3) renderSection() "documents" bölümünde, isDocumentsScopedByBlock() dalında,
//     createDocumentsUnitsSummaryTablePreview()'in HEMEN ardından çağrılıyor.
//  4) refreshDocumentsBlockColumnTablePreview()/...Debounced tanımlı ve
//     3 tetikleyici noktaya (merkezi alan-değişikliği dispatcher'ı, özet
//     tablo hücre commit'i, ham "documents" tablosu hücre düzenleme —
//     hem input hem blur olayı) kablolanmış.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert.ok(start >= 0, `Fonksiyon bulunamadı: ${name}`);
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

// --- 1) createDocumentsBlockColumnTablePreview() var, doğru fonksiyonları çağırıyor
{
  const body = extractFunction("createDocumentsBlockColumnTablePreview");
  assert.ok(body.includes("buildDocumentsRowsWithBlockColumn()"), "buildDocumentsRowsWithBlockColumn() çağrılmalı.");
  assert.ok(body.includes("buildSimpleHtmlTable("), "buildSimpleHtmlTable() ile salt-okunur HTML üretilmeli.");
  assert.ok(body.includes('"Blok"'), "Başlıklarda 'Blok' sütunu olmalı.");
  // --- 2) attachTitleUnitsSummaryTableEditing BİLİNÇLİ OLARAK çağrılmıyor
  assert.ok(
    !body.includes("attachTitleUnitsSummaryTableEditing"),
    "Salt-okunur karar gereği attachTitleUnitsSummaryTableEditing() ÇAĞRILMAMALI (regresyon: editable yapılmamalı)."
  );
  console.log("createDocumentsBlockColumnTablePreview() içerik + salt-okunur karar testi tamam.");
}

// --- 3) renderSection: "documents" bölümünde, createDocumentsBlockColumnTablePreview()
//     İKİ dalın (isDocumentsBlockGroupingActive tab-bar / isDocumentsScopedByBlock
//     fallback) DIŞINDA, KENDİ isDocumentsScopedByBlock() koşuluyla ekleniyor mu ---
// KULLANICI BULGUSU (2026-09-03): "GÖZÜKMÜYOR baktım tablo yok dediğin
// kısımda" — panel ÖNCE yanlışlıkla yalnızca "else if (isDocumentsScopedByBlock())"
// dalının İÇİNE eklenmişti, yani Dikey/Yatay Kat İrtifakı raporlarında
// (isDocumentsBlockGroupingActive() true -> createDocumentsBlockTabBar dalı)
// panel HİÇ görünmüyordu. Bu REGRESYON testi: panel çağrısının
// createDocumentsBlockTabBar() çağrısından SONRA, "} else if" bloğunun
// KAPANIŞINDAN SONRA (yani her iki dalın da DIŞINDA) yer aldığını doğrular.
{
  const documentsSectionMarker = 'if (section.id === "documents" && isCurrentUserAdmin() && state.fields.requestType === "Çoklu Talep") {';
  const sectionStart = appSource.indexOf(documentsSectionMarker);
  assert.ok(sectionStart >= 0, "renderSection'daki 'documents' bölüm bloğu bulunamadı.");
  const sectionSlice = appSource.slice(sectionStart, sectionStart + 2500);

  const tabBarIndex = sectionSlice.indexOf("createDocumentsBlockTabBar()");
  const elseIfCloseIndex = sectionSlice.indexOf("}", sectionSlice.indexOf("body.append(createDocumentsUnitsSummaryTablePreview());"));
  // Bare fonksiyon adı yerine GERÇEK çağrı kalıbı aranıyor — bu dosyanın
  // KENDİ regresyon yorumu fonksiyon adını DÜZ METİN olarak da geçiriyor
  // (yukarıdaki kullanıcı bulgusu açıklaması), bare ad aramak YANLIŞLIKLA
  // o yorum metnini eşleştirirdi.
  const previewCallIndex = sectionSlice.indexOf("body.append(createDocumentsBlockColumnTablePreview());");
  assert.ok(tabBarIndex >= 0 && elseIfCloseIndex >= 0 && previewCallIndex >= 0, "Beklenen çağrılar bulunamadı.");
  assert.ok(
    previewCallIndex > elseIfCloseIndex,
    "createDocumentsBlockColumnTablePreview() 'if/else if' bloğunun (tab-bar VE fallback dallarının) DIŞINDA olmalı — REGRESYON: kullanıcının GERÇEK (Kat İrtifakı, tab-bar) raporlarında panel görünmüyordu."
  );
  // Kendi bağımsız isDocumentsScopedByBlock() koşuluyla sarmalanmış olmalı
  // (if/else-if zincirinin bir PARÇASI DEĞİL, ayrı bir "if").
  const guardSlice = sectionSlice.slice(elseIfCloseIndex, previewCallIndex);
  assert.ok(
    /if \(isDocumentsScopedByBlock\(\)\) \{/.test(guardSlice),
    "createDocumentsBlockColumnTablePreview() KENDİ ayrı 'if (isDocumentsScopedByBlock())' koşuluyla sarmalanmalı (tab-bar dalıyla İÇ İÇE olmamalı)."
  );
  console.log("renderSection kablolama (İKİ daldan BAĞIMSIZ, her zaman görünür) REGRESYON testi tamam.");
}

// --- 4) Refresh fonksiyonu + debounce + 3 tetikleyici noktaya kablolama -----
{
  const refreshBody = extractFunction("refreshDocumentsBlockColumnTablePreview");
  assert.ok(refreshBody.includes('activeSectionId !== "documents"'), "Yalnızca 'documents' bölümü aktifken çalışmalı.");
  assert.ok(refreshBody.includes(".documents-block-column-table-preview"), "Kendi benzersiz CSS sınıfını hedeflemeli (diğer panellerle karışmamalı).");
  assert.ok(refreshBody.includes("createDocumentsBlockColumnTablePreview()"), "Paneli yeniden üretmeli.");

  assert.ok(
    appSource.includes("const refreshDocumentsBlockColumnTablePreviewDebounced = debounce(refreshDocumentsBlockColumnTablePreview, 350);"),
    "350ms debounce sarmalayıcısı tanımlı olmalı (diğer önizleme panelleriyle AYNI desen)."
  );

  // 4a) Merkezi alan-değişikliği dispatcher'ı (getTitleUnitScopedFieldKeys)
  assert.ok(
    /refreshDocumentsUnitsSummaryTablePreviewDebounced\(\);\s*\n\s*refreshDocumentsBlockColumnTablePreviewDebounced\(\);/.test(appSource),
    "Merkezi alan-değişikliği dispatcher'ında refreshDocumentsUnitsSummaryTablePreviewDebounced() ile AYNI yerde tetiklenmeli."
  );

  // 4b) Özet tablo hücre commit'i (debounce'suz, anında)
  assert.ok(
    /refreshDocumentsUnitsSummaryTablePreview\(\);\s*\n\s*refreshDocumentsBlockColumnTablePreview\(\);/.test(appSource),
    "Özet tablo hücre commit'inde (debounce'suz) refreshDocumentsUnitsSummaryTablePreview() ile AYNI yerde tetiklenmeli."
  );

  // 4c) Ham "documents" tablosu hücre düzenleme — iki ayrı olay (input + blur)
  const occurrences = appSource.split("refreshDocumentsBlockColumnTablePreviewDebounced();").length - 1;
  assert.equal(occurrences, 3, `refreshDocumentsBlockColumnTablePreviewDebounced() TAM 3 yerde çağrılmalı (merkezi dispatcher + ham tablo input + ham tablo blur). Bulunan: ${occurrences}`);

  console.log("refreshDocumentsBlockColumnTablePreview()/debounce + 3 tetikleyici nokta kablolama testi tamam.");
}

console.log("Tum 'Incelenen Belgeler (Blok Bazinda) - cift tarafli onizleme' testleri basarili.");
