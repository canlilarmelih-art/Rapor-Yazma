# Bulut Senkron Kurulumu (Faz 1) — Tek Seferlik Console Adımları

Hesap: **canlilar.melih@gmail.com** · Süre: ~15 dk · Maliyet: 0 TL
(Blaze/faturalama İSTEMEZ; kredi kartı girmeyin.)

Uygulama tarafı hazırdır. Aşağıdaki adımlar bitip yapılandırma
`cloud/firebase-config.js` içine yapıştırılınca üst bardaki **Bulut** düğmesi
giriş ekranını açar.

---

## 1. Firebase projesi oluştur

1. https://console.firebase.google.com → canlilar.melih@gmail.com ile giriş.
2. **Add project / Proje ekle** → ad: `rapor-yazma` (ID otomatik, örn. `rapor-yazma-xxxxx`).
3. **Google Analytics: KAPAT** (gerekmez) → Create.

## 2. Authentication (e-posta/şifre, tek kullanıcı)

1. Sol menü **Build → Authentication → Get started**.
2. **Sign-in method** → **Email/Password** → Enable (yalnız ilk seçenek; "Email link" kapalı kalsın) → Save.
3. **Users** sekmesi → **Add user** → e-posta: `canlilar.melih@gmail.com`, güçlü bir şifre belirle → Add.
4. **Settings** sekmesi → **User actions**:
   - **Create (sign-up)** kapat ✅ → dışarıdan kimse kendine hesap açamaz.
   - **Email enumeration protection** açık kalsın (varsayılan).

## 3. Firestore veritabanı (europe-west — KVKK D5)

1. **Build → Firestore Database → Create database**.
2. Konum: **eur3 (europe-west)** ← ÖNEMLİ, sonradan değiştirilemez.
3. **Production mode** seç (kilitli başlar) → Create.

## 4. Güvenlik kuralları

1. Firestore → **Rules** sekmesi.
2. Bu depodaki `cloud/firestore.rules` dosyasının TÜM içeriğini yapıştır → **Publish**.
3. Doğrulama: Rules playground'da `get /users/BAŞKA_UID/reports/x` → Denied görmelisin.

## 5. TTL (30 gün otomatik silme — D3)

1. Firestore → **TTL** (Time-to-live) sekmesi → **Create policy**.
2. Collection group: `reports` · Timestamp field: `expireAt` → Create.
   (Politika "Active" olana kadar birkaç dk sürebilir.)

## 6. Web uygulaması kaydı ve yapılandırma

1. Proje ana sayfası → **⚙ Project settings → General → Your apps → Web (</>)**.
2. Takma ad: `rapor-yazma-web` · **Firebase Hosting kutusunu İŞARETLEME** (şimdilik) → Register.
3. Ekrandaki `firebaseConfig` değerlerinden şu 4'ünü kopyala:
   `apiKey`, `authDomain`, `projectId`, `appId`.
4. Bu depoda `cloud/firebase-config.js` dosyasını aç, `YAPISTIR` değerlerini
   gerçekleriyle değiştir, kaydet.
5. Uygulamada **Ctrl+F5** → sağ üstte **Bulut** düğmesi → e-posta/şifreyle giriş.

## 7. İlk senkron testi (kabul kriteri)

1. Masaüstünde giriş yap → modalda **"Şimdi Gönder"** → durum: *Bulutta güncel*.
2. Telefonda aynı sayfayı aç → **Bulut** → aynı hesapla giriş →
   *"Bulutta daha yeni sürüm var"* teklifi → **Buluttakini Yükle** → alanların
   geldiğini gör.
3. Console → Firestore → Data: `users/<uid>/reports/RE-2026-…` belgesinde
   `payload.fields` dolu, `sourceValues` YOK olmalı (beyaz liste kanıtı).

---

## 8. Yeni kullanıcı ekleme (birine erişim vermek istediğinde)

**Karar (2026-07-09):** Kayıt tamamen kapalı ve MANUEL onaylı kalacak — kimse
kendine hesap açamaz, yalnızca sen Console'dan eklersin. Bu, "önce izin ben
vereyim, otomatik olmasın" isteğini zaten karşılıyor (Adım 2.4'te "Create
(sign-up)" kapatılmıştı) ve ileride üyelik satışına geçilecekse ödeme
onayından SONRA hesap açma adımına doğal olarak oturuyor.

Birine erişim vermek istediğinde:

1. https://console.firebase.google.com → proje → **Authentication → Users**.
2. **Add user** → kişinin e-postasını ve geçici bir şifre belirle → Add.
3. Kişiye e-posta + geçici şifreyi ilet (kendi belirlediği kanaldan — WhatsApp,
   mail vb.); uygulamada **Bulut** düğmesinden bu bilgilerle giriş yapabilir.
4. Erişimi geri almak istersen: aynı ekranda kullanıcının yanındaki ⋮ menüsü →
   **Disable account** (siler yerine devre dışı bırakır — geri açılabilir) veya
   **Delete account** (kalıcı).

### İleride: Üyelik satışı

Bu, Console-tık'ı ile yapılan MANUEL bir işlemdir; otomatik/ödemeli bir akış
DEĞİLDİR. Gerçek üyelik satışına geçilecekse (ödeme alma, otomatik hesap
açma/kapama, abonelik yönetimi) bu ayrı ve daha büyük bir çalışma gerektirir:
ödeme sağlayıcı entegrasyonu (Stripe/iyzico), muhtemelen Cloud Functions
(Blaze/faturalı plan gerektirir — artık "0 TL" sınırı dışına çıkar), ve
Türkiye'de bireysel/şirket olarak online satışta e-fatura/KDV ve mesafeli
satış sözleşmesi yükümlülükleri. Bu noktaya gelindiğinde ayrı bir planlama
oturumu gerekir; şimdiden hazırlık yapılmadı.

---

## Notlar / Sınırlar (Faz 1)

- **Bulut = taşıma tamponu:** kayıt son gönderimden 30 gün sonra silinir.
  Kalıcı arşiv: *12 - Banka ve Çıktı → JSON olarak farklı kaydet* (geri
  yüklenebilir tek format; Word/PDF çıktıdır).
- Belgeler (PDF/görsel) ve ham belge metinleri hiçbir koşulda buluta gitmez.
- Tek aktif rapor senkronlanır (en son güncellenen). Çoklu rapor + dashboard: Faz 2.
- **(2026-07-09 itibarıyla GEÇERSİZ — kasıtlı olarak tersine çevrildi)** ~~Giriş
  yapılmadıysa/yapılandırma yoksa uygulama bugünkü gibi %100 yerel çalışır.~~
  Artık giriş VE internet bağlantısı ZORUNLU; ikisinden biri eksikse
  `index.html`'deki `#authGateOverlay` tüm uygulamayı kaplayıp engeller
  (bkz. FAZ0-TASARIM.md D7).
- **App Check** (önerilir, Faz 2'de): Project settings → App Check →
  reCAPTCHA v3 ile web uygulamasını kaydet; önce "monitor" modunda izle,
  sonra Firestore için "Enforce" aç. Şimdilik atlanabilir.
- Sorun giderme: Bulut düğmesi kırmızı nokta + "Firebase kütüphanesi
  yüklenemedi" diyorsa `vendor/firebase/*.js` dosyalarının sunucudan
  yüklendiğini kontrol edin (Ağ sekmesi).
