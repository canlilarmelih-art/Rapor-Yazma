# Bulut Senkron — Faz 0 Tasarım Dokümanı

Tarih: 2026-07-09 · Durum: **Karar dokümanı — uygulama koduna henüz dokunulmadı**

Bu doküman, "Cross-Device Değerleme Platformu" büyük güncellemesinin temel
kararlarını, veri sözleşmesini ve güvenlik kurallarını sabitler. Faz 1
uygulaması bu dokümana göre yapılacaktır.

---

## 1. Kesinleşen Kararlar

| # | Karar | Gerekçe |
|---|---|---|
| D1 | **Belgeler ve ham belge metinleri buluta GİTMEZ.** PDF/görsel dosyaları cihazda kalır; state içindeki `sourceValues` (TAKBİS ham satırları, adres/EKB/imar ham metinleri) senkron paketine girmez. | KVKK veri minimizasyonu; 1 MiB belge limiti; ham veri belge yeniden yüklenerek türetilebilir. |
| D2 | **Veri yolu `users/{uid}/reports/{reportId}`.** Kullanıcı yalnızca kendi raporlarını görür; izolasyon Security Rules + yapısal yol ile çift katmanlıdır. | Yanlış sorgu yazımıyla bile başka kullanıcının verisine erişilemez. |
| D3 | **Raporlar son güncellemeden 30 gün sonra buluttan kalıcı silinir.** `expireAt = updatedAt + 30 gün` alanı + Firestore yerleşik **TTL policy**. Cloud Functions gerekmez. | KVKK saklama sınırlaması; 1 GB kota hiç dolmaz; bulut = arşiv değil taşıma tamponu. |
| D4 | **Arşiv kullanıcının cihazıdır.** JSON = geri yüklenebilir tam yedek; Word/PDF = teslim çıktısı (geri yüklenemez). Tamamlama akışında dışa aktarma modalı zorunlu adım olur. | Banka revizyon talepleri buluttan bağımsız karşılanır. |
| D5 | **0 TL sınırları:** Firebase Auth (50K MAU) + Firestore (europe-west bölgesi) + Firebase Hosting + **App Check**. Cloud Functions ve Firebase Storage KULLANILMAZ (yeni projelerde Blaze ister). Cloudflare Turnstile yerine App Check. | Turnstile sunucu doğrulaması ister (sunucumuz yok); App Check SDK çağrılarını da korur. |
| D6 | ~~Bulut kapalıyken uygulama bugünkü gibi %100 çalışır.~~ **SÜPÜRÜLDÜ (superseded) — 2026-07-09.** Bkz. D7. | — |
| D7 | **[D6'yı geçersiz kılar] Giriş ZORUNLUDUR; internet YOKSA uygulama çalışmaz.** Kullanıcı açık talimatı: dosyalar artık GCP Always Free'de barındırılıyor, dışarıdan bu şekilde erişiliyor, ilerde tam bir web servisine dönüştürülecek — "bu bir senkron durumu değil"; yetkisiz kimse ne kullanabilmeli ne görebilmeli. `index.html`'de sayfa açılır açılmaz (satır içi stille, harici CSS beklemeden) opak, tüm viewport'u kaplayan `#authGateOverlay` var; `cloud/cloud-sync.js` yalnızca **kimlik doğrulanmış VE `navigator.onLine`** ikisi birden sağlandığında kaldırır (fail-closed: Firebase yapılandırılmamış/yüklenemiyor/çevrimdışı/girişsiz → kapı kapalı kalır). Açık "Çıkış Yap" yerel taslak + rapor kütüphanesini temizler. | KVKK/erişim kontrolü artık ürünün temel gereksinimi; offline-first vizyonu (orijinal Gemini dokümanındaki "sahada mobil" senaryosu) bilinçli olarak feda edildi. |

**D7 güvenlik sınırı güncellendi:** `#authGateOverlay` istemci tarafında kullanıcı
arayüzünü kapalı tutmaya devam eder. Ayrıca `server.js` üzerindeki `/api/*`
uçları Firebase Authentication ID tokenını sunucu tarafında doğrular; oturumsuz
istekler reddedilir ve yerel state/kullanıcı noktaları Firebase UID'ye göre
ayrılır. Statik HTML/JS/CSS dosyaları ise giriş ekranının yüklenebilmesi için
public kalır; rapor verisi API katmanından geçer. Public erişimde Node servisi
127.0.0.1'e bağlanır ve dış trafik HTTPS reverse proxy üzerinden alınır.

---

## 2. Senkron Paketi Sözleşmesi (Beyaz Liste)

State üst anahtarlarının bulut durumu — `tools/measure-cloud-payload.js` içindeki
`buildCloudReportPayload()` bu sözleşmenin referans uygulamasıdır (Faz 1'de
app.js'e taşınacak):

| Üst anahtar | Bulut? | Neden |
|---|---|---|
| `fields` | ✅ | Rapor form verisi — raporun kendisi. |
| `tables` | ✅ | Malikler, takyidat, emsaller vb. rapor tabloları. |
| `lookupOptions` | ✅ | Küçük; adres seçim listeleri içe aktarma sonrası gerekli. |
| `updatedAt` | ✅ | Sürüm/çakışma karşılaştırması. |
| `sourceValues` | ❌ | **Ham belge metinleri (KVKK).** Belge yeniden yüklenerek türetilebilir. |
| `sourceConflicts` | ❌ | `sourceValues`'tan türetilir. |
| `uploads`, `uploadErrors` | ❌ | Cihaza özgü yükleme meta/hata durumu; dosya adları müşteri bilgisi içerebilir. |
| `settings` | ❌ | Cihaz/kullanıcı tercihi (harita modu vb.); rapora ait değil. |
| `system` | ❌ | Cihaza özgü. |

**Cihaz değişimi bedeli:** Başka cihazda açılan raporda "TAKBİS Ham Verisi" paneli
boş gelir (alan değerleri doludur). Panele not eklenecek: *"Belge içeriği bu
cihazda yok — belgeler buluta yüklenmez. Gerekirse PDF'i yeniden yükleyin."*

### Ölçüm sonucu (2026-07-09, `server-data/active-case.json`, 27 Mayıs tarihli örnek)

```
Tam state           : 23.7 KiB   (sourceValues tek başına 16.5 KiB = %70)
BULUT paketi        :  6.5 KiB   → 1 MiB limitinin %0.6'sı
```

> Bu örnek eski/küçük bir rapor. **Faz 1 öncesi dolu bir üretim raporuyla
> yeniden ölçün:** uygulamada "JSON olarak farklı kaydet" → sonra
> `node tools/measure-cloud-payload.js <indirilen.json>`. Paket %75'i aşarsa
> araç uyarı verir (tabloların alt-belgelere bölünmesi gündeme gelir; mevcut
> verilerle beklenmiyor).

---

## 3. Firestore Belge Şeması

`users/{uid}/reports/{reportId}` — tek belge, zarf + paket:

```jsonc
{
  "schema": "rapor-yazma-cloud",
  "schemaVersion": 1,
  "status": "draft",                 // "draft" | "completed"
  "rev": 7,                          // iyimser kilit sayacı (her yazmada +1)
  "lastDevice": "mobile",            // "mobile" | "desktop"
  "lastActiveSection": "valuation",  // mevcut activeSectionId birebir
  "createdAt": "<serverTimestamp>",
  "updatedAt": "<serverTimestamp>",
  "expireAt": "<Timestamp: updatedAt + 30 gün>",   // TTL alanı
  "summary": {                       // dashboard kartı için hızlı alanlar
    "caseName": "", "bank": "", "city": "", "district": "",
    "adaParsel": "", "propertyType": ""
  },
  "payload": {                       // Bölüm 2'deki beyaz liste
    "fields": {}, "tables": {}, "lookupOptions": {}, "updatedAt": ""
  }
}
```

- `reportId` istemcide üretilir: `RE-<yıl>-<kısa rastgele>` (çakışma ihtimali yok
  denecek kadar düşük; kullanıcı-altı koleksiyonda global benzersizlik gerekmez).
- Dashboard listesi belgeleri okur (1 belge = 1 okuma; boyut okuma sayısını
  etkilemez). Günlük 50K okuma limiti tek kullanıcı için fazlasıyla yeterli.

### TTL Kurulumu (tek seferlik, Console)

Firestore → TTL policies → koleksiyon grubu `reports`, alan `expireAt`.
Silme, süre dolumundan sonra ~24-72 saat içinde gerçekleşir (kabul edilir).
"30 gün daha sakla" butonu = `expireAt`'i `now + 30g` yapar (Rules üst sınırı
40 gün olduğundan istemci kurcalamasıyla süresiz uzatılamaz).

---

## 4. Güvenlik

- **Rules:** `app/cloud/firestore.rules` — varsayılan ret; yalnız sahibi
  okur/yazar/siler; zarf alan doğrulaması; `expireAt` zorunlu ve sınırlı.
- **App Check:** reCAPTCHA v3 sağlayıcıyla açılır; Firestore'a yalnız bizim
  uygulamadan istek gelir.
- **Auth:** E-posta/şifre; "e-posta numaralandırma koruması" AÇIK (Firebase
  ayarı — hata mesajları zaten "e-posta veya şifre hatalı" genelliğinde döner);
  uzun oturum (beni hatırla) varsayılan açık.
- **Bölge:** Firestore **europe-west** (KVKK yurt dışı aktarım değerlendirmesi
  banka sözleşmeleriyle birlikte yapılmalı — hassas tablolar için istemci
  tarafı şifreleme opsiyonu Faz 3'te masada).
- **KVKK metni için hazır cümleler:** "Rapor verileri yalnızca rapor sahibinin
  erişebileceği şekilde saklanır; yüklenen belgeler ve ham belge içerikleri
  sunucuya aktarılmaz; rapor kayıtları son işlemden 30 gün sonra otomatik ve
  kalıcı olarak silinir."

---

## 5. Senkron Kadansı ve Kota Bütçesi

- localStorage: bugünkü gibi anlık (debounce ~350 ms) — birincil kayıt.
- Buluta yazma: **45 sn debounce** + şu anlarda hemen: `visibilitychange(hidden)`,
  `pagehide`, bölüm değişimi, manuel "Kaydet", rapor kapatma.
- Bütçe: 8 saatlik yoğun mesai ≈ 640 yazma/gün → 20K limitinin %3'ü.
- iOS notu: `beforeunload` güvenilmez; `pagehide`+`visibilitychange` esas alınır.

## 6. Çakışma Stratejisi (Faz 3'te uygulanır)

Yazma transaction içinde: buluttaki `rev` beklenenden büyükse yazma iptal →
modal: *"Bu rapor başka cihazda güncellendi."* Seçenekler: buluttakini al /
bendekini yaz / bendekini JSON indir. Okumada: `rev` yerelden büyükse sessizce
buluttaki alınır (yerel kirli değilse).

## 7. Faz Planı

- **Faz 0 (bu doküman):** ✅ kararlar, sözleşme, Rules taslağı, ölçüm aracı.
- **Faz 1:** Firebase projesi (europe-west) + Auth + login ekranı + tek raporun
  flag arkasında senkronu + `buildCloudReportPayload`'ın app.js'e taşınması +
  Rules/App Check devreye alma. Kabul: iki cihazda aynı hesapla açılıp alan
  değerlerinin taşındığının görülmesi; Rules emülatör testleri.
- **Faz 2:** Çoklu rapor + dashboard (kartlar/tablo, arama, arşiv, kopyala,
  geri sayım rozeti) + yeni talep akışı (kısa form) + tamamlama/dışa aktarma modalı.
- **Faz 3:** Çakışma modalı, `lastActiveSection` devri, PWA kurulumu
  (manifest + service worker; iOS 7 gün silme riskine karşı), "30 gün daha
  sakla", kota telemetrisi, istemci şifreleme değerlendirmesi.

## 8. Açık Sorular (Faz 1 öncesi yanıtlanmalı)

1. Firebase projesini kim açacak / Google hesabı hangisi? (Console erişimi gerekir.)
2. Tek kullanıcı mı başlıyoruz, ekip üyeleri var mı? (Auth kayıt akışı: davetli mi, serbest mi?)
3. Dolu bir üretim raporunun JSON'u ile boyut yeniden ölçümü (Bölüm 2'deki komut).
