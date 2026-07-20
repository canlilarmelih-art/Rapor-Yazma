# Rapor Yazma Programı — Proje Özeti

> Bu belge `handoff.md`'nin güncel durumuna (2026-07-19, sürüm 0.0.188) göre
> hazırlanmıştır. Amaç: projeye yeni bakan biri (insan ya da AI oturumu) için
> tek bakışta "bu ne, nasıl çalışıyor, nerede duruyor" özetini vermek.
> Ayrıntılı, kronolojik değişiklik kaydı için `handoff.md`'ye bakın.

## 1. Bu Uygulama Ne İşe Yarıyor

**Experify — Yarı Otomatik Rapor Oluşturma.** Türkiye'de gayrimenkul
değerleme uzmanlarının banka ekspertiz raporlarını hazırlaması için
geliştirilen, tek kişilik (kullanıcı + AI oturumları) bir web uygulaması.

Kullanıcı (Melih Canlılar, Denge Gayrimenkul Değerleme ve Danışmanlık A.Ş.)
tek bir Excel formunu bölümlü bir dijital iş akışına dönüştürmek istedi:

- Sahada (mobilde) kritik alanları hızlıca doldur.
- Ofiste (masaüstünde) tüm detayları ve tabloları tamamla.
- TAKBİS/adres kodu/EKB PDF'lerini, KML dosyalarını otomatik oku, alanları
  öner (kullanıcı her zaman düzeltebilir, otomatik yenileme onun elle
  girdiğini sessizce ezmez — bkz. `ARCHITECTURE_RULES.md`).
- Bitmiş raporu banka bazlı Word şablonlarına (`.doc`) dökerek dışa aktar.
- Farklı cihazlardan (mobil saha → masaüstü tamamlama) aynı rapora devam
  edebilsin diye Firebase üzerinden bulut senkronizasyonu ve çoklu rapor
  kütüphanesi ("Taleplerim") var.

## 2. Teknoloji ve Mimari

- **Framework/build yok.** `index.html` doğrudan tarayıcıda açılıp çalışır;
  bağımlılık karmaşası bilinçli olarak düşük tutulmuş.
- **`app.js`**: tek dosyalık vanilla JS uygulama çekirdeği (~18.000+ satır,
  800+ fonksiyon). Sekmeler, alanlar, hesaplamalar, otomatik metin üretimi,
  yerel taslak kaydı burada.
- **`server.js`**: yerel Node sunucusu — statik dosya servisi (artık HTTP
  Range destekli, iOS video oynatma sorunu bu yüzden çözüldü), Overpass/
  harita proxy'si (SSRF'ye kapalı sabit endpoint), `/api/pdf-text` (iOS'ta
  OCR yerine sunucu taraflı PDF metin çıkarma), rate limiting.
- **`src/`**: parser modülleri (KML, adres/EKB/imar normalizer), değerleme
  yardımcıları (`comparables/`, `value-factors/`, `land/`, `risk/`) ve
  banka şablon motoru (`src/templates/template-engine.js`).
- **`templates/`**: 8 banka + 2 yardımcı `.html` şablonu (Akbank, Halkbank,
  İş Bankası + masraf yazısı, Kuveyt Türk, Vakıfbank, Vakıf Katılım, Yapı
  Kredi, Ziraat + ek tablo). `{{PLACEHOLDER}}` işaretli, kullanıcı serbestçe
  düzenleyebilir düz HTML dosyaları; `PLACEHOLDER-REHBERI.md`'de tam liste.
- **`cloud/`**: Firebase Auth + Firestore senkronizasyonu, çoklu rapor
  kütüphanesi ("Taleplerim"), zorunlu giriş kapısı (auth gate — D7 kararı:
  internet olmadan uygulama kullanılamaz, bkz. `handoff.md` 0.0.56).
- **`themes/`**: 6 seçilebilir görsel tema (Navy Blue, Apple, Glass, Aurora,
  Clay, Neumorphism) — bkz. `THEME-PROFILES.md`.
- **Test/doğrulama**: `tools/` altında `check-basic.js` (genel sağlık
  kontrolü) ve şablon/parser/karşılaştırma testleri; git commit'i öncesi
  standart doğrulama adımı.
- **Deployment**: GitHub (`canlilarmelih-art/Rapor-Yazma`) → GitHub Actions
  → SSH/rsync → Google Cloud VM'de PM2 → Nginx reverse proxy →
  `experify.com.tr` (HTTPS). `git push origin main` sonrası otomatik.

## 3. Ana Bölümler (Uygulama İçi Menü)

1. Dosya ve Rapor
2. Adres ve Konum (harita, KML, yakın çevre analizi)
3. Tapu ve Mülkiyet (malikler tablosu)
4. Takyidat
5. İmar Durumu
6. Belgeler ve Proje (incelenen belgeler, EKB, ruhsat/iskan)
7. Arsa Özellikleri
8. Ana Gayrimenkul Özellikleri
9. Bağımsız Bölüm Özellikleri
10. Emsaller (karşılaştırma matrisi, arsa/konut dinamik görünüm)
11. Değerleme (yöntem seçimi, özet tablo, kat bazında indirgenmiş alan)
12. Banka ve Çıktı (şablon seçimi, Word/PDF dışa aktarma)
13. Placeholder (tüm alan/tablo/metin karşılıklarının referans listesi)
14. Açıklamalar (otomatik üretilen rapor metinleri)
15. Halkbank Risk Kodları
16. Değeri Etkileyen Faktörler
17. Gabim Veri Seti (GDYS'nin gerçek formunu birebir yansıtan, türe göre
    koşullu alan/grup gösteren özel panel)

## 4. Son Dönemde Öne Çıkan Çalışma Başlıkları

`handoff.md`'deki en güncel ~40 kayıt ağırlıklı olarak şu eksenlerde:

- **iOS kararlılığı**: giriş ekranında video oynatmama (sunucuda Range
  desteği eksikti), form doldururken çökme (arka planda çalışan dev DOM +
  GPU katmanları, "gate lite mode", büyük veri ön yüklemesinin kaldırılması).
- **Banka şablonu Word çıktısı doğruluğu**: sayfa kırılması, kenar boşluğu,
  paragraf hizası/punto/`m²`→`m2` uyumu, Değerleme bölümü sıra düzeni,
  Takyidat/Deprem Derecesi gibi placeholder'ların doğru alana bağlanması,
  GABİM veri seti biçiminin gerçek GDYS formuna birebir uydurulması.
- **Kuveyt Türk ve Halkbank şablonlarında** INVEX ekran görünümüne özel
  ince ayarlar (tablo satır yükseklikleri, açıklama tekrarlarının
  giderilmesi, firma/uzman bilgilerinin şablondan çıkarılması).
- **Konum/emsal krokilerinin Word'e gömülmesi** (sabit 16:9, otomatik kayıt
  kontrollü).
- **Taleplerim / bulut kullanıcı deneyimi** (giriş sonrası varsayılan ekran,
  tema ayarlarının hesaba taşınması, bulut rozetlerinin doğrulanması).

## 5. Bilinen Sınırlar

- **Sunucu tarafı erişim denetimi yok**: auth gate istemci taraflıdır;
  `server.js` dosyaları herkese koşulsuz servis eder (bkz. `handoff.md`
  0.0.56 D7 kararı ve sınır notu). Gerçek "web servisi"ne dönüşüm ayrı bir
  iş.
- **Tek dosyalık `app.js`**: modülerleşme kısmen başladı (ör.
  `src/exports/export-validation.js`) ama büyük ölçüde tek dosya; AI
  oturumları için bağlam maliyeti yüksek.
- **Otomatik test kapsamı sınırlı**: parser/şablon/karşılaştırma testleri
  var ama TAKBİS/OCR ayrıştırma gibi en kırılgan alanlar için golden-file
  test altyapısı (`test-inputs/`) henüz kullanılmıyor.
- iOS'taki son düzeltmelerin gerçek cihazda tam doğrulaması kullanıcı
  tarafından teyit edilmeyi bekliyor durumda olabilir; `handoff.md`'nin en
  üstündeki kayıtlara bakılmalı.

## 6. Marka / Logo (2026-07-20'de yenilendi)

Eski "RY" harfli altın rozet, kullanıcının kendi hazırladığı yeni
Experify işaretiyle değiştirildi (bkz. `handoff.md` 0.0.189):
lacivert (#213f77/#16264a) + altın (#d7b26a) halka içinde serif "E"
harfi, köşe vurgularıyla. Kaynak paket: `icons/experify-mark-navy.svg`,
`icons/experify-mark-white.svg` (koyu/açık zemin varyantları),
`icons/experify-icon.svg` (PWA kare simgesi), `icons/experify-lockup.svg`
(yatay logo+yazı, henüz kullanılmıyor). PWA simgeleri (`icon-192.png`,
`icon-512.png`, `apple-touch-icon.png`) de aynı kimlikle güncellendi.

Sidebar'da (`.brand-mark`) ve giriş ekranının üç durumunda (giriş formu,
bloklanmış, çevrimdışı) mark görünüyor; tema bazlı kontrast otomatik
(Clay/Neumorphism açık sidebar → lacivert varyant, diğer 4 tema koyu
sidebar → beyaz varyant). `experify-lockup.svg` (mark + "Experify" yazısı
tek satırda) henüz hiçbir yerde kullanılmıyor — ileride tam sayfa
başlıklarda değerlendirilebilir.

## 7. Önemli Dosyalar (Hızlı Referans)

| Dosya | İçerik |
|---|---|
| `handoff.md` | Kronolojik, ayrıntılı değişiklik günlüğü — en güncel durum için buraya bakın |
| `README.md` | Eski/ilk iskelet notları (güncelliğini büyük ölçüde yitirmiş) |
| `ARCHITECTURE_RULES.md` | Placeholder kuralı, otomatik veri/kullanıcı onayı ayrımı |
| `PROGRAM-DEGERLENDIRME-VE-YOL-HARITASI.md` | Mühendislik hijyeni değerlendirmesi ve yol haritası (2026-06-21) |
| `THEME-PROFILES.md` | 6 tema profilinin kaynağı ve kapsamı |
| `templates/PLACEHOLDER-REHBERI.md` | Banka şablonlarında kullanılabilecek tüm placeholder adları |
| `GITHUB-ACTIONS-DEPLOY.md` | Dağıtım akışı ve sunucu bilgileri |
