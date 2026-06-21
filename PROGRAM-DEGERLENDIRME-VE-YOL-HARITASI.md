# Rapor Yazma Programı — Eleştirel Değerlendirme ve Geliştirme Yol Haritası

> Tarih: 2026-06-21 · Kapsam: `app.js` (17.743 satır, ~846 fonksiyon), `server.js`, `index.html`, `vendor/`, mimari kurallar.
> Amaç: Codex'in geliştirme planı olarak kullanması için kanıta dayalı, önceliklendirilmiş değerlendirme.

---

## 0. Genel Çerçeve
Tek kişi + AI ile geliştirilmiş, Türkiye gayrimenkul değerleme raporu üreten, tek sayfalık (vanilla JS) web uygulaması. Yerel Node `server.js` ile çalışıyor; PDF/OCR/KML okuma, harita, yakın çevre analizi gibi gerçek domain özellikleri var. İşlevsel olarak güçlü; asıl boşluk **mühendislik hijyeni** (sürüm kontrolü, test, modülerlik).

---

## 1. Güçlü Yönler (korunmalı)
1. **Olgun domain disiplini** — `ARCHITECTURE_RULES.md`: otomatik veri öneridir, kullanıcı değiştirebilir, kullanıcı değişikliği sessizce ezilmez, kaynak değer ile onaylı değer ayrı tutulur. Çoğu yazılımın atladığı bir olgunluk.
2. **Framework/build yok** — `index.html` aç çalışıyor; bağımlılık karmaşası düşük.
3. **Doğru mimari kararlar** — Overpass/harita sorguları sunucu proxy'sinde (sabit endpoint, SSRF yok); iOS'ta OCR yerine sunucu-tarafı metin çıkarma (`/api/pdf-text`).
4. **XSS bilinci** — 66 `innerHTML`'e karşı 104 `escapeHtml` çağrısı.
5. **iOS uyumluluk katmanı** — `index.html > installCompatibilityFixes()` polyfill bloğu.

---

## 2. Dezavantajlar / Riskler (en kritikten sıralı)

### 2.1 🔴 Sürüm kontrolü (git) YOK — en büyük risk
Git yerine elle kopyalanan klasörler ve `backups/` var. Sonuç: "hangi kopya canlı?" kaosu (bir kopya diğerinin düzeltmesini ezebiliyor). 17.743 satırı AI'a düzenletirken **tek kötü 'baştan üret' = ciddi iş kaybı.** Backup `.bat`'ları bunu çözmüyor.

### 2.2 🔴 Otomatik test YOK
En karmaşık ve regresyona açık kod (TAKBİS/adres/EKB regex + OCR ayrıştırma) testsiz. Her düzenleme başka bir PDF tipinin ayrıştırmasını sessizce bozabilir. `test-inputs/` altındaki örnek PDF'ler golden-file test olmaya hazır ama kullanılmıyor.

### 2.3 🟠 17.743 satırlık tek dosya
AI bağlamı kaybeder; diff/inceleme/geri-alma zor; her şey global (`app.js:702` `let state`, 625 `state.` referansı). İzolasyon yok.

### 2.4 🟠 Güvenlik / mahremiyet
Sunucu `0.0.0.0:5173`'te **auth'suz** dinliyor. Aynı ağdaki herkes tek state dosyasını okuyabilir/yazabilir (`server.js:142` `/api/state` PUT). Değerleme verisi kişisel/finansal. Ayrıca path-traversal kontrolü `resolved.startsWith(root)` (`server.js:326`) tuzaklı — `root + path.sep` ile karşılaştırılmalı.

### 2.5 🟠 Ortam taşınamaz / kırılgan
`server.js:248` Python yolunu Codex cache dizinine **sabit kodluyor**; başka makinede kırılır. `package.json` yok → node sürümü, `pdfplumber` gibi bağımlılıklar tanımsız; ortam tekrar üretilemez.

### 2.6 🟡 Tek state dosyası = tek rapor
Çoklu iş dosyası yönetimi, geçmişe dönme, arama yok.

### 2.7 🟡 Offline yarım
`pdf.js`/Tesseract vendored ama **Leaflet `unpkg.com` CDN'inden** (`index.html`). İnternet yoksa harita çalışmaz.

---

## 3. Yol Haritası (önceliklendirilmiş, Codex için görevler)

### P0 — Hemen (ucuz, yüksek etki)
- [ ] **`git init`** + anlamlı `.gitignore` (`server-data/`, `backups/`, `*.log`, geçici PDF'ler). İlk commit: mevcut çalışan sürüm. Tüm kopya/backup kaosunu bitirir.
- [ ] **Golden-file test koşucusu** (basit Node script, `node tools/test-parsers.js`): `test-inputs/*.pdf` → ayrıştırıcıdan geçir → `test-inputs/*.expected.json` ile karşılaştır. En az 8–10 fixture (TAKBİS, adres, EKB, imar). Hedef: her değişiklikten sonra çalıştırılabilir regresyon kalkanı.
- [ ] Tek "kaynak doğruluk" klasörü belirle; diğer duplike kopyaları arşivle/sil.

### P1 — Yapısal sağlamlık
- [ ] **`app.js`'i ES modüllerine böl:** `parsers/{takbis,adres,ekb,imar}.js`, `sections/`, `render/`, `state/`, `compat/`. Saf ayrıştırma fonksiyonlarını DOM'dan ayır (test edilebilirlik için kritik).
- [ ] **Sunucuyu sıkılaştır:** varsayılan `127.0.0.1` bind; mobil erişim için basit token/PIN; path-guard düzeltmesi (`root + path.sep`).
- [ ] **`package.json` ekle;** sabit-kodlu Codex Python/Node yollarını kaldır, `PATH`/env ile çöz; `requirements.txt` (pdfplumber) ekle.

### P2 — Olgunluk
- [ ] **Çoklu iş dosyası yönetimi:** rapor başına dosya, liste + arama + arşiv.
- [ ] **PWA / service worker:** tam offline; Leaflet'i vendor'a al.
- [ ] **Uygulama içi tanılama paneli:** hata + stack + ortam bilgisi (cihazdan tur attırmadan teşhis).
- [ ] **`state` şema doğrulaması:** bozuk veriyi erken yakala.

---

## 4. Eklenebilecek Özellikler (fikirler)

| Özellik | Değer |
|---|---|
| **Word/PDF rapor çıktısı** (banka şablonuyla) | İşin asıl çıktısı; mevcut metin üretimi gerçek `.docx`/`.pdf`'e bağlanmalı. |
| **Banka-bazlı kural setleri** | Her banka farklı zorunlu alan/format; banka seçimi şablonu değiştirsin. |
| **Saha fotoğrafı yönetimi** (EXIF geotag → harita) | Raporun ayrılmaz parçası; konumla otomatik eşleşme. |
| **Bulut senkron / çok cihaz** | README'nin "sonraki katman"ı: mobilde başla, masaüstünde bitir. |
| **Geri al / yinele + kayıt geçmişi** | Veri kaybına karşı güven. |
| **Ayrıştırma güven göstergesi** | OCR/PDF alanlarının yanında güven rozeti; kullanıcı neyi kontrol edeceğini bilir. |
| **Değerleme/emsal tutarlılık denetimi** | Mantık hatalarını rapordan önce yakalar. |

---

## 5. Tek Cümlelik Özet
İşlevsel olarak güçlü, mimari niyeti olgun; ama mühendislik hijyeni (git, test, modülerlik) eksik ve asıl risk burada. **İlk iki adım — `git` + golden-file testleri — AI ile geliştirmenin en büyük tehlikesi olan "sessiz regresyon ve kayıp iş"i ortadan kaldırır.**

---

### Ek bağlam (Codex için referans dosyalar)
- `ARCHITECTURE_RULES.md` — domain kuralları (otomatik veri / kullanıcı override disiplini).
- `IOS-PDF-FIX-NOTLARI.md` — iOS PDF uyumluluk geçmişi (pdf.js v5 + ReadableStream asyncIterator polyfill).
- `test-inputs/` — golden-file testleri için hazır örnek PDF'ler (takbis.pdf, adres.pdf, ekb.pdf, imar.pdf, parsel.kml).
