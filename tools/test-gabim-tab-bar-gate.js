// "GABİM Veri Seti" (gabimData): taşınmaz tab çubuğu eklendi (2026-09-13).
// Kullanıcı bildirimi: "gabim bölümünde taşınmaz tabları yok. bu bölüme
// de taşınmaz tablarını ekleyelim." — Tapu/Adres/İmar/Arsa/Değerleme/
// Bağımsız Bölüm sekmelerinin HEPSİNDE bulunan createTitleUnitTabBar()
// Gabim'e HİÇ eklenmemişti; "unit" (Bağımsız Bölüm) sekmesinde 0.0.488'de
// YAŞANAN BİREBİR AYNI kusurun ("Bağımsız bölüm özellikleri bölümünde
// bağımsız bölüm tabları bulunmuyor", bkz. tools/test-unit-tab-bar-gate.js)
// tekrarı — kullanıcı Gabim sekmesine gelmek için Tapu sekmesi üzerinden
// aktif taşınmazı değiştirmek zorunda kalıyordu.
//
// Gate Değerleme/Bağımsız Bölüm ile BİREBİR AYNI (ada/parsel/blok koşulu
// YOK, yalnızca admin + Çoklu Talep). "Tümüne uygula"/"Seçili Taşınmazlara
// Kopyala" BİLİNÇLİ OLARAK YOK — GABİM alanları salt-okunur (diğer
// bölümlerden otomatik dolar), kopyalanacak elle girilmiş bir değer yok.
//
// Bu test kaynak-düzeyinde (createTitleUnitTabBar() admin girişi
// gerektirdiği için canlıda görsel test yapılamıyor, standart proje
// kısıtlaması) şunu doğrular:
//  1) renderSection()'da "gabimData" için doğru koşulla (extraActions
//     OLMADAN) createTitleUnitTabBar() eklendi.
//  2) Tab çubuğu, GABİM veri panelinden (createGabimDataSetPanel) ÖNCE
//     ekleniyor — diğer TÜM sekmelerle (Tapu/Adres/İmar/Arsa/Değerleme/
//     Bağımsız Bölüm) AYNI sıralama.
//  3) Mevcut "gabimData" özet-tablo gate'i (createGabimUnitsSummaryTablePreview,
//     0.0.706 civarı eklenen) REGRESYONSUZ, aynı koşulla duruyor.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- 1) renderSection() "gabimData" tab-bar gate'i dogru kosulla kablolu ---
{
  assert.match(
    appSource,
    /if \(section\.id === "gabimData" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\)\);\s*\n\s*\}/,
    "renderSection() 'gabimData' icin admin + Coklu Talep kosuluyla (extraActions OLMADAN) createTitleUnitTabBar()'i eklemiyor."
  );
  console.log("renderSection gabimData tab-bar gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 2) Tab cubugu, GABIM veri panelinden ONCE ekleniyor -------------------
{
  const tabBarGateMatch = /if \(section\.id === "gabimData" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\)\);/.exec(appSource);
  assert.ok(tabBarGateMatch, "gabimData tab-bar gate'i bulunamadi.");
  const panelGateMatch = /if \(section\.id === "gabimData"\) \{\s*\n\s*body\.append\(createGabimDataSetPanel\(\)\);/.exec(appSource);
  assert.ok(panelGateMatch, "gabimData panel gate'i (createGabimDataSetPanel) bulunamadi.");
  assert.ok(
    tabBarGateMatch.index < panelGateMatch.index,
    "Tab cubugu, GABIM veri panelinden (createGabimDataSetPanel) ONCE eklenmeli - diger tum sekmelerle (Tapu/Adres/Imar/Arsa/Degerleme/Bagimsiz Bolum) AYNI siralama."
  );
  console.log("gabimData tab cubugu -> panel siralamasi testi tamam.");
}

// --- 3) Mevcut ozet-tablo gate'i regresyonsuz duruyor ----------------------
{
  assert.match(
    appSource,
    /if \(section\.id === "gabimData" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createGabimUnitsSummaryTablePreview\(\)\);\s*\n\s*\}/,
    "renderSection() 'gabimData' icin ozet-tablo (createGabimUnitsSummaryTablePreview) gate'i regresyona ugramis (bulunamadi)."
  );
  console.log("gabimData ozet-tablo gate'i regresyon kilidi testi tamam.");
}

console.log("GABIM Veri Seti tab cubugu testleri basarili.");
