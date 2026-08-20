// "Bağımsız Bölüm Özellikleri" (unit): taşınmaz tab çubuğu eklendi
// (2026-08-20). Kullanıcı bildirimi: "Bağımsız bölüm özellikleri
// bölümünde bağımsız bölüm tabları bulunmuyor." — 0.0.486'da "unit"
// bölümünün verisi doğru taşınmaza-özgü scoped edilmişti (bkz.
// tools/test-title-unit-switch.js senaryo 30) ama hiçbir tab/UI
// eklenmemişti; kullanıcı Tapu sekmesi ÜZERİNDEN aktif taşınmazı
// değiştirip Bağımsız Bölüm'e gelmek zorundaydı. Değerleme'nin EN BASİT
// deseni (ada/parsel/blok koşulu YOK, yalnızca 2+ taşınmaz, "Tümüne
// uygula" BİLİNÇLİ OLARAK YOK) eklendi.
//
// Bu test kaynak-düzeyinde (kaynak metni doğrulanır, DOM/localStorage
// gerekmez — createTitleUnitTabBar() admin girişi gerektirdiği için
// canlıda görsel test yapılamıyor, standart proje kısıtlaması) şunu
// doğrular:
//  1) renderSection()'da "unit" için doğru koşulla createTitleUnitTabBar()
//     eklendi.
//  2) createTitleUnitTabBar()'ın ortak not metni artık BAYAT DEĞİL —
//     hangi bölümlerin "henüz bağlı değil" olduğunu tek tek SAYMIYOR
//     (bu liste her yeni bölüm eklendiğinde bayatlıyordu — bkz.
//     handoff.md 0.0.484/0.0.486 notları).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// --- 1) renderSection() "unit" gate'i dogru kosulla kablolu ---------------
{
  assert.match(
    appSource,
    /if \(section\.id === "unit" && isCurrentUserAdmin\(\) && state\.fields\.requestType === "Çoklu Talep"\) \{\s*\n\s*body\.append\(createTitleUnitTabBar\(\)\);/,
    "renderSection() 'unit' icin admin + Coklu Talep kosuluyla createTitleUnitTabBar()'i eklemiyor."
  );
  console.log("renderSection unit tab-bar gate kaynak-duzeyi kablolama testi tamam.");
}

// --- 2) createTitleUnitTabBar() not metni artik bolum adi SAYMIYOR --------
// (bayatlama riskini kalici olarak ortadan kaldirmak icin).
{
  const fnStart = appSource.indexOf("function createTitleUnitTabBar()");
  assert(fnStart >= 0, "createTitleUnitTabBar() bulunamadi.");
  const fnEnd = appSource.indexOf("\n}", fnStart);
  const fnSource = appSource.slice(fnStart, fnEnd);
  assert(
    !/(Bağımsız Bölüm|Değerleme).{0,40}(henüz|hala|hâlâ).{0,60}bağlı/i.test(fnSource),
    "createTitleUnitTabBar()'in not metni hala belirli bolum adlarini 'henuz baglı degil' diye sayiyor - bu her yeni bolum eklendiginde bayatliyor (regresyon)."
  );
  assert(fnSource.includes("her taşınmaz için ayrı ayrı tutulur"), "createTitleUnitTabBar() not metni beklenen genel ifadeyi icermiyor.");
  console.log("createTitleUnitTabBar not metni artik bolum-adi-saymiyor (bayatlama-onleme) testi tamam.");
}

console.log("Bagimsiz Bolum tab cubugu testleri basarili.");
