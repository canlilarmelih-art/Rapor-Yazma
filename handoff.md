# Rapor Yazma Programı — Handoff Notu

Son güncelleme: 2026-07-11 (gece) · Servis edilen sürüm: **app.js?v=20260711-0012** (styles.css?v=20260711-0012, cloud/cloud-sync.js?v=20260709-2247, cloud/report-library.js?v=20260710-1626, halkbank-risk-rules.js?v=20260707-1812)

Bu belge, bir sonraki geliştirici/oturum için projeyi çalıştırma, doğrulama ve bu
oturumda yapılanları özetler.

---
## 0.0.136 - 2026-07-17 - GABİM VERİ SETİ Word çıktısı GDYS ile bire bir renk/ızgara uyumu

Kullanıcı, GDYS'nin gerçek "Gabim Veri Seti" formunun 4 gayrimenkul türü
(Arsa, Konut, Diğer Bina, Arazi) için yeni ekran görüntülerini paylaşıp banka
şablonlarındaki `{{GABIM_VERI_SETI}}` çıktısının satır/sütun yerleşiminin ve
renk paletinin görsellerdeki gibi **birebir** olmasını istedi. 0.0.107'de
uygulanan ilk sürüm ızgara/kutu görünümüne geçmişti ama iki noktada
görsellerden sapıyordu: (1) renkler GDYS'nin sabit renkleri yerine uygulama
temasının (Navy Blue/Apple/Glass/...) token'larını kullanıyordu, (2)
"Bağımsız Bölüm / Taşınmaz Özellikleri" ve "BB İçin İmar Bilgileri" düz tek
ızgara olarak render ediliyordu; oysa GDYS'de bunlar soldaki küçük gri
kategori etiketiyle ayrılmış alt bloklardan oluşuyor ("BB İçin Alanlar",
"BB İçin Değerler", "BB İçin Birim Değerler", "BB İçin Cephe ve Kat") ve
"Tapuya Özel Bilgiler" açık gri gölgeli bir kart panelinde gösteriliyor.

`app.js`:
- `GABIM_GROUP_COLUMNS`: "Tapu Bilgileri" ve "Tapuya Özel Bilgiler" 3'ten
  4 sütuna çıkarıldı (görsellerdeki satır yoğunluğuna göre); "Bağımsız Bölüm
  / Taşınmaz Özellikleri" ve "BB İçin İmar Bilgileri" bu tablodan çıkarılıp
  yeni `GABIM_SUBGROUPS` tanımına taşındı.
- Yeni `GABIM_SUBGROUPS`: yukarıdaki iki grup için alt blok tanımları (her
  tanım `title` → solda kategori etiketli girintili satır, `indent: true` →
  aynı kategorinin etiketsiz devamı, ikisi de yoksa → girintisiz tam
  genişlik satır).
- Yeni `GABIM_SHADED_GROUPS`: `Set(["Tapuya Özel Bilgiler"])` — bu grup açık
  gri (`#f3f4f6`) kart paneli içinde render edilir.
- `buildGabimExportGroups()`: `GABIM_SUBGROUPS`'ta tanımlı gruplar için
  düz `rows`+`columns` yerine `subgroups` (etiket/girinti/kendi sütun
  sayısıyla) üretir; boş kalan alt bloklar otomatik elenir.
- `buildGabimDataSetWordHtml()`: renkler artık `getReportThemeToken(...)`
  yerine GDYS ekran görüntülerinden alınan SABİT hex değerler (`ink
  #111827`, `muted #6b7280`, `line #d1d5db`, `surface #ffffff`, panel
  `#f3f4f6`/`#e5e7eb`) — hangi rapor teması (Navy Blue/Apple/Glass/Aurora/
  Clay/Neumorphism) aktif olursa olsun GABİM tablosunun rengi değişmez.
  Alt gruplu render için sol kategori etiketi hücresi (`subgroupLabelStyle`)
  eklendi.

Ekrandaki canlı Gabim paneli (`buildGabimDataGroups`, `.gabim-data-group`
CSS'i) bilinçli olarak DEĞİŞMEDİ — kullanıcı GDYS'ye elle veri girerken
referans olsun diye hâlâ tüm alanları düz liste gösteriyor. Sadece Word/PDF
export'una giden `{{GABIM_VERI_SETI}}` çıktısı güncellendi.

`index.html`: `app.js?v=20260717-2020`. `tools/check-basic.js` içindeki
sabit sürüm kontrolü aynı değere güncellendi.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. **Canlı tarayıcıda GÖRSEL doğrulama YAPILAMADI** — uygulamanın
zorunlu giriş kapısı (bkz. 0.0.56 D7 kararı) bu ortamda gerçek Firebase
kimlik bilgisi olmadığı için aşılamıyor; bu, projenin daha önceki
oturumlarında da tekrarlanan bilinen bir sınırdır. Kullanıcının gerçek bir
raporda Word/PDF çıktısı alıp GABİM VERİ SETİ bölümünü 4 görselle
karşılaştırarak teyit etmesi gerekir.

Ayrı yedek alınmadı (tek fonksiyon/tablo değişikliği; önceki
`backups/before-library-cloud-meta-row_2026-07-17_19-11-29` yeterli taban).

---
## 0.0.135 - 2026-07-17 - Bulut saklama bilgisinin kompakt meta satiri

Taleplerim kart ve liste gorunumlerinde `Son guncelleme` bilgisi ile bulut saklama
rozetini ayni `library-card-meta` satirinda birlestirdim. `+30 gun` butonu artik
bu satirin yaninda yer aliyor; rozet, buton ve tarih font/padding degerleri daha
kompakt hale getirildi. Yedek:
`backups/before-library-cloud-meta-row_2026-07-17_19-11-29/`.

## 0.0.136 - 2026-07-17 - Talep karti basliklarinda tek satir duzeni

Taleplerim kart ve liste gorunumlerinde rapor adi ile banka ve bilgi degerlerinin satir kirarak karti bozmasi engellendi. Rapor adi artik tek satirda ellipsis ile gosteriliyor; belge durum rozetleri gerektiğinde ikinci satira alinıyor. Banka ve diger bilgi degerleri tek satirli gorunumu koruyor.
Yedek: `backups/before-library-card-single-line_2026-07-17_19-34-31/`.

## 0.0.134 - 2026-07-17 - Ana Gayrimenkul ve Bağımsız Bölüm alt panel hizalaması

7. Ana Gayrimenkul Özellikleri ve 8. Bağımsız Bölüm Özellikleri bölümlerindeki alt panellerde
`Bina Yapı Tarzı`, `Asansör`, `Kullanım Durumu` ve benzeri alanlar panel kenarlarına yapışık
görünüyordu. `.section-building .subsection` ve `.section-unit .subsection` için masaüstünde
14px/16px, dar ekranlarda 12px/10px iç boşluk tanımlandı. Başlıklar, tablolar ve alan ızgaraları
artık aynı iç hizayı takip ediyor. Yedek:
`backups/before-building-unit-panel-padding_2026-07-17_18-17-07/`.

## 0.0.114 - 2026-07-17 - Open Design Esintili Motion ve Gorsel Katman

- Open Design reposu ayri bir calisma klasorune kuruldu:
  `C:/Users/90551/Documents/Codex/open-design`.
- Uygulamanin mevcut lacivert degerleme arayuzu korunarak `styles.css` icine
  kontrollu bir ambient motion katmani eklendi: calisma alaninda cok hafif
  hareketli grid/gradient arka plan, nav ve ust bar gecisleri, kart derinligi.
- Giris ekranindaki blueprint sahnesi gelistirildi; cam yuzey etkisi, yumusak
  sahne pulse hareketi ve buton hover derinligi eklendi.
- `prefers-reduced-motion` kurali tum yeni hareketleri kapatir.
- Masaustu (1280x900) ve mobil (390x844) tarayici dogrulamasinda giris ekrani
  goruntulendi, yatay tasma olusmadi.
- Yedek: `backups/before-open-design-visual-update_2026-07-17_08-02-50`.

---
## 0.0.113 - 2026-07-16 - gstack Aciklari ve Guvenlik Sertlestirmesi

- Leaflet stil dosyasinin CSP tarafindan engellenmesi giderildi; `server.js`
  icindeki `style-src` yalnizca bilinen `https://unpkg.com` kaynagini kabul eder.
- GitHub Actions icindeki `actions/checkout` ve `actions/setup-node` kullanimlari
  degismez commit SHA'larina sabitlendi.
- `GITHUB-ACTIONS-DEPLOY.md`, production ortaminda `RAPOR_HOST=0.0.0.0`,
  `RAPOR_PORT=5174` ve Nginx reverse proxy akisini aciklayacak sekilde guncellendi.
- Asagidaki eski parser notu guncel durum degildir: `parseComparableNumber`
  binlik nokta ayracli degerleri artik desteklemektedir.
- Bu kayit sonraki oturumlar icin guncel durumdur; daha asagidaki tarihli notlar
  kendi donemlerindeki degisikliklerin arsiv kaydidir.
- Yedek: `backups/before-gstack-open-issues_2026-07-16_19-09-36`.

---
## 0.0.112 - 2026-07-16 - app.js Modulerlesme Ilk Dilimi

- Disa aktarma oncesi zorunlu alan kontrolu `src/exports/export-validation.js`
  modulune tasindi.
- `app.js` artik bu davranisin uygulama kodunu tasimiyor; modul global API
  uzerinden mevcut dis aktarma butonlariyla uyumlu calisiyor.
- Ilk modulerlesme dilimi sonrasinda `app.js`, `server.js` ve yeni modul syntax
  kontrollerinden gecti.
- Yedek: `backups/before-export-validation-module_2026-07-16_18-46-48`.

---
## 0.0.111 - 2026-07-16 - Graphify Odakli Kod Haritasi

- Graphify code-only guncellemesi yapildi.
- Son harita: `18.598` dugum, `42.205` baglanti.
- `graphify-out/graph.json` ve `graphify-out/GRAPH_TREE.html` yeniden uretildi.
- Bes kaynak dosyasi sifir AST dugumu uretti; bunlar veri/fixture veya desteklenmeyen
  dosya tipleri oldugu icin harita disinda kaldi.

---
## 0.0.110 - 2026-07-16 - Runtime Bagimliliklarinin Sabitlenmesi

- `package.json` icine Node `>=22 <23` ve npm `>=10 <11` engine sozlesmesi eklendi.
- Bagimlilik kullanilmadigi icin minimal `package-lock.json` olusturuldu.
- `.nvmrc` ile yerel/CI Node ana surumu `22` olarak sabitlendi.
- GitHub Actions artik Node surumunu `.nvmrc` dosyasindan okuyor ve runtime
  surumlerini deployment oncesi yazdirarak kontrol ediyor.
- `tools/check-basic.js` yeni `app.js` cache-buster surumunu kontrol ediyor.
- Dogrulama: package metadata, JavaScript syntax, temel kontrol ve diff kontrolu
  basarili.

---
## 0.0.109 - 2026-07-16 - Dis Aktarma Oncesi Eksik Alan Uyarisi

- JSON, Word, PDF ve banka sablonu dis aktarma butonlarina ortak zorunlu alan
  kontrolu eklendi.
- Eksik zorunlu alan varsa kullaniciya eksik alanlar listelenerek devam etme
  veya islemi iptal etme secenegi sunuluyor.
- Eksik alan yoksa mevcut dis aktarma akisi degismeden devam ediyor.
- `app.js` cache-buster'i `app.js?v=20260716-1831` olarak guncellendi.
- Yedek: `backups/before-export-reminder_2026-07-16_18-31-05`.
- Dogrulama: `node --check app.js`, `tools/check-basic.js` ve `git diff --check`
  basarili.

---
## 0.0.108 - 2026-07-16 - Rapor Kutuphanesi Auth Gecidi

- `cloud/report-library.js` artik Firebase oturumu dogrulanmadan aktif rapor,
  localStorage ve Taleplerim kutuphanesi islemlerini baslatmiyor.
- Kimlik dogrulama tamamlandiginda `RaporCloudSync.onAuthChange` ile tek seferlik
  baslatma yapiliyor; mevcut giris akisinin sonraki rapor islemleri korunuyor.
- Ilgili script cache-buster'i `cloud/report-library.js?v=20260716-1825` olarak
  guncellendi.
- Yedek: `backups/before-report-library-auth-gate_2026-07-16_18-23-19`.
- Dogrulama: `node --check` (report-library.js, app.js, server.js) ve
  `tools/check-basic.js` basarili.

---
## 0.0.107 - 2026-07-16 - GitHub Actions ve Google Cloud Deployment

Bu hafta uygulamanin GitHub uzerinden otomatik dogrulama ve Ubuntu sunucuya
dagitim akisi calisir hale getirildi.

- Yerel proje `canlilarmelih-art/Rapor-Yazma` GitHub deposunun `main` branch'ine
  baglandi.
- `.github/workflows/deploy.yml` ile her `git push origin main` sonrasinda test,
  SSH baglantisi, rsync dosya aktarimi, PM2 yeniden baslatma ve localhost
  saglik kontrolu otomatik calisir.
- GitHub Actions secrets yapilandirildi: `DEPLOY_HOST`, `DEPLOY_USER`,
  `DEPLOY_PATH`, `DEPLOY_PORT` ve `DEPLOY_SSH_KEY`.
- SSH deploy anahtari sunucuda `~/.ssh/authorized_keys` dosyasina eklendi.
- Sunucu bilgileri: IP `34.136.126.221`, kullanici `canlilar_melih`, uygulama
  yolu `/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app/`,
  PM2 adi `rapor-app`, uygulama portu `5174`.
- Google Cloud VPC firewall'da 80 ve 443 portlarini acan `allow-http-https`
  kurali mevcut. Dogrudan test icin 5174 portu da acildi.
- `experify.com.tr` DNS A kaydi `34.136.126.221` adresine yonlendirildi.
- Nginx reverse proxy ve Let's Encrypt kurulumu tamamlandi; uygulama
  `https://experify.com.tr` adresinden erisilebilir durumda.
- Ilk dis erisim sorununun nedeni uygulamanin `127.0.0.1:5174` uzerinde
  dinlemesiydi. PM2 `HOST=0.0.0.0` ile yeniden baslatilarak dis erisim saglandi.
- Sudo parolasi gerektiren HTTPS adimlari GitHub Actions icinden kaldirildi;
  HTTPS/Nginx islemleri sunucuda yetkili SSH oturumu ile yapilmalidir.

Kalici deployment akisi:

```text
Kod degisikligi -> git push origin main -> GitHub Actions verify -> SSH/rsync
-> PM2 restart -> health check
```

Kontrol komutlari: `pm2 status` ve `ss -ltnp | grep 5174`.

Acik kalan teknik konu: GitHub Actions icinden Nginx veya Certbot icin sudo
calistirilmasi parola gerektirdigi icin otomatik degildir. Nginx ve sertifika
yenileme sunucu tarafinda systemd/Certbot timer ile izlenmelidir.

Yedek/geri donus: Deployment workflow degisiklikleri GitHub commit gecmisinde
saklanir.

---
## 0.0.101 2026-07-13 Tema Secici

- Ust menude `Apple` ve `Navy Blue` profilleri arasinda gecis yapilabilen tema secici eklendi.
- Secim `localStorage` icinde saklaniyor ve sayfa yenilendiginde ayni tema geri yukleniyor.
- In-app browser dogrulamasi: iki profil de tek secici uzerinden etkinlesti ve renk tokenlari degisti.

---
## 0.0.100 2026-07-13 Apple ve Navy Blue Tema Profilleri

- Mevcut lacivert-beyaz arayuz `themes/navy-blue.css` ile Navy Blue profilinde sabitlendi.
- `DESIGN-apple.md` tokenlari rapor yazma calisma alanina uyarlanarak `themes/apple.css` profili olusturuldu.
- Uygulama varsayilan olarak Apple profilini aciyor; `body[data-app-theme="apple"]` ile etkinlestiriliyor.
- Apple profilinde Action Blue, siyah yan menu, beyaz/parchment yuzeyler, hairline cerceveler, Apple tipografi yiginlari ve chrome golgesizligi uygulandi.
- `THEME-PROFILES.md` tema profillerini ve kullanim amaclarini belgelemektedir.

Yedek:
`backups/before-design-theme-profiles_2026-07-13_01-57-00`

Dogrulama: Uygulama in-app browser uzerinde Apple temasi ile goruntulendi; `app.js` ve template motoru sozdizimi ile banka sablon testleri onceki degisiklik kapsaminda gecti.

---
## 0.0.99 2026-07-12 Placeholder Envanterinin Emsal ve Tablo Alanlariyla Genisletilmesi

- Placeholder yoneticisi, sections[].fields disinda state.fields icinde bulunan ozel panel alanlarini da otomatik katalogluyor.
- Emsaller icin `{{EMSAL_MATRISI}}`, `{{EMSAL_TABLOSU}}` ve `{{EMSAL_ARSA_PIYASA_DEGERI}}` adlari eklendi.
- Emsal 1-7 satirlarinin giris, aciklama ve otomatik hesap alanlari `{{EMSAL_1_...}}` ... `{{EMSAL_7_...}}` seklinde ayri adlandirildi.
- Diger uygulama tablolari icin satir/sutun bazli `{{TABLE_<TABLO>_<SATIR>_<SUTUN>}}` adlari eklendi ve sablon motorunda cozumlenir hale getirildi.
- Placeholder rehberine yeni emsal adlari ve ornekleri eklendi.

Yedek:
`backups/before-placeholder-catalog-audit_2026-07-12_22-25-46`

Dogrulama: `node --check app.js`, `node --check src/templates/template-engine.js`, `tools/test-bank-templates.js` ve `tools/test-comparable-market-analysis.js` gecti. `tools/check-basic.js` mevcut mojibake tabanli `Gabim Veri Seti` kontrolunde halen bilinen nedenle basarisiz.

---
## 0.0.100 2026-07-12 GitHub Actions ile Ubuntu Otomatik Yayin

- `.github/workflows/deploy.yml` eklendi. `main` dalina push sonrasinda JavaScript syntax ve parser testleri calisir.
- Testler basarili olursa GitHub Actions SSH/rsync ile `/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app/` klasorune yayin yapar.
- `server-data/`, `backups/`, `.git/` ve `node_modules/` aktarim silme isleminden korunur.
- Deploy sonunda PM2 `rapor-app` yeniden baslatilir ve 5174, yoksa 5173 portu saglik kontrolunden gecirilir.
- GitHub secret kurulumu `GITHUB-ACTIONS-DEPLOY.md` dosyasinda belgelendi.

Dogrulama: JavaScript syntax ve parser testleri gecti.

---
## 0.0.99 2026-07-12 Ilce Iklim Cumlesi ve Otomatik Deprem Derecesi

- Ilce iklim/cografya aciklamasi, Bursa/Yildirim ornegindeki rapor diliyle; bolge, yagis sinifi, rakim, sicaklik, nem, yagis, guneslenme, donlu gun ve depremsellik bilgilerini ayri cumlelerde uretiyor.
- Deprem bolgesi verisi `Deprem derecesi` alanina il-ilce kaydindan otomatik uygulanir; kullanici secimi degistirdiginde otomatik sahiplik temizlenir ve aciklama kullanicinin secimini esas alir.
- Excel kaydindaki `1 – Cok Yuksek` degeri raporda `1. Derece - Cok Yuksek` bicimine donusturulur.

Servis surumu:
`app.js?v=20260712-0142`, `styles.css?v=20260712-1720`

Yedek:
`backups/before-climate-earthquake-sentence-and-auto-degree_2026-07-12_17-51-18`

Dogrulama: `node --check app.js` ve `node --check src/land/climate-earthquake-data.js` gecti. `tools/check-basic.js`, mevcut kodlama beklentisi nedeniyle `Gabim Veri Seti` kontrolunde basarisiz oldu. Graphify: 18.537 dugum, 42.089 baglanti.

---

## 0.0.66 2026-07-11 Arsa Emsal Yüzölçümü ve Harita Konumu Düzeltmesi (Codex oturumu)

Kullanıcı, `Hesaplanan Emsal` alanının otomatik hesaplanmadığını, m2 birim değerinde kullanılmaması gerektiğini ve arsa/tarla uzun emsal paragrafında harita konumunun yer almasını istedi.

Yapılanlar:
- `Hesaplanan Emsal` artık `Yüzölçümü`, `Yapılaşma Nizamı`, `Emsal/KAKS` veya `Kat Adedi` yazılırken anlık güncellenir.
- Arsa/tarla m2 birim değeri hesabında `Hesaplanan Emsal` kullanılmaz; daima `Yüzölçümü` (`c24`) kullanılır.
- Arsa/tarla uzun emsal paragrafına `Emsal Konumu` ifadesinden sonra haritadan seçilen konum eklendi.
- Harita konumu örneği: `Ekspertize konu taşınmazla aynı bölgede, taşınmazın yaklaşık 350 metre doğusunda, ...`
- Harita mesafesi onlar basamağına yuvarlanır.

Yedek:
`backups/before-comparable-area-and-map-text-fix_2026-07-11_00-05-56`

Servis sürümü:
`app.js?v=20260711-0012`, `styles.css?v=20260711-0012`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.65 2026-07-10 Arsa Emsal Hesaplanan Emsal Kural Düzeltmesi (Codex oturumu)

Kullanıcı, `Hesaplanan Emsal` alanının emsal paragrafında kullanılmamasını ve İmar Durumu bölümündeki hesaplanan emsal kurallarının Emsaller bölümünde de geçerli olmasını istedi.

Yapılanlar:
- Arsa/tarla uzun emsal paragrafından `hesaplanan emsal alanına sahip` cümlesi kaldırıldı.
- `Hesaplanan Emsal` otomatik hesabı İmar Durumu mantığıyla eşitlendi:
  - KAKS/Emsal girilmişse `Yüzölçümü x KAKS/Emsal`
  - KAKS/Emsal boşsa ve kat adedi sayısal ise `Yüzölçümü x Kat Adedi`
- Kural artık yalnızca `Ayrık Nizam` ile sınırlı değil; `Ayrık Nizam` ve `Bitişik Nizam` dahil seçilen nizamdan bağımsız olarak İmar Durumu’ndaki genel hesap mantığı uygulanır.
- Örnek: `Yüzölçümü 1000`, `Emsal/KAKS 1,50` ise `Hesaplanan Emsal 1.500` olur.

Yedek:
`backups/before-comparable-buildable-area-rule-fix_2026-07-10_19-38-18`

Servis sürümü:
`app.js?v=20260710-1942`, `styles.css?v=20260710-1942`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- Emsal paragrafında `hesaplanan emsal alanına sahip` ifadesinin kalmadığı doğrulandı.

---

## 0.0.64 2026-07-10 Arsa Emsal Hesaplanan Emsal Alanı (Codex oturumu)

Arsa/tarla emsal girişinde açılır liste boş seçenekleri ve hesaplanan emsal alanı geliştirildi.

Yapılanlar:
- `Emsal Niteliği`, `İmar Lejantı`, `Yapılaşma Nizamı`, `Kat Adedi` seçicilerinde üstteki boş `Seçiniz` seçeneği kaldırıldı.
- Arsa/tarla metninde `Tarla 15.000.000 TL bedelle satılıktır` yerine `Tarla nitelikli gayrimenkul 15.000.000 TL bedelle satılıktır` formatı kullanılır.
- Arsa/tarla özel alanlarına `Hesaplanan Emsal` satırı eklendi.
- `Yapılaşma Nizamı = Ayrık` ise `Hesaplanan Emsal = Yüzölçümü x Emsal/KAKS` olarak otomatik hesaplanır.
- Kullanıcı `Hesaplanan Emsal` kutusunu değiştirirse manuel değer korunur.
- Arsa/tarla m2 birim değer hesabında önce `Hesaplanan Emsal`, yoksa `Yüzölçümü` kullanılır.
- Uzun emsal paragrafındaki yapılaşma metnine hesaplanan emsal alanı da eklenir.

Yedek:
`backups/before-land-comparable-calculated-buildable-area_2026-07-10_19-29-36`

Servis sürümü:
`app.js?v=20260710-1937`, `styles.css?v=20260710-1937`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.63 2026-07-10 Arsa Emsal Yapılaşma ve Şerefiye Metni (Codex oturumu)

Arsa/tarla emsal uzun paragrafında konum sebebi, yapılaşma koşulu biçimi ve imar şerefiyesi cümlesi düzeltildi.

Yapılanlar:
- `Konum Karşılaştırma Sebebi` artık arsa/tarla uzun emsal paragrafında konum karşılaştırma cümlesine girer.
- `Yapılaşma Koşulları` başlığı `Yapılaşma Nizamı` olarak değiştirildi.
- `Yapılaşma Nizamı` alanı `imarOrderOptions`, `İmar Lejantı` alanı `imarLegendOptions`, `Kat Adedi` alanı `imarFloorCountOptions` listesinden açılır liste olarak çalışır.
- Yapılaşma metni ham `Ayrık, 1, 3` yerine `Ayrık Nizam, KAKS: 1,00, 3 Kat yapılaşma koşullarına sahip` formatına çevrilir.
- Arsa/tarla paragrafına imar şerefiyesi cümlesi eklendi:
  - Benzer durumda: `İmar yapılaşma koşulları bakımından benzer özelliktedir.`
  - Artı/eksi şerefiye durumunda iyi/vasat açıklaması ve oran metne girer.

Yedek:
`backups/before-land-comparable-zoning-text_2026-07-10_17-46-38`

Servis sürümü:
`app.js?v=20260710-1754`, `styles.css?v=20260710-1754`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.62 2026-07-10 Emsaller Arsa Alanları Tüm Görünümde Görünür (Codex oturumu)

Kullanıcı, arsa emsali için `Yüzölçümü`, `İmar Şerefiyesi` ve yapılaşma koşulları alanlarının ekranda görünmediğini bildirdi.

Yapılanlar:
- `Tüm Emsaller` görünümünde artık konut/yapı ve arsa/tarla alanlarının tamamı gösterilir.
- Arsa/tarla özel alanları sadece `Arsa / Tarla Emsalleri` filtresine saklanmaz; kullanıcı emsal niteliğini arsa seçtiğinde aynı ekranda gerekli alanları görür.
- `Yapı Nizamı` başlığı daha anlaşılır olması için `Yapılaşma Koşulları` olarak güncellendi.
- `tools/check-basic.js` bu görünürlük kuralını ve yeni başlığı kontrol edecek şekilde güncellendi.

Yedek:
`backups/before-comparable-land-fields-visible_2026-07-10_17-33-00`

Servis sürümü:
`app.js?v=20260710-1748`, `styles.css?v=20260710-1748`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.61 2026-07-10 Emsaller Arsa/Tarla Dinamik Görünüm (Codex oturumu)

Emsaller matrisi, `Emsal Niteliği` alanına göre konut/yapı emsalleri ile arsa/tarla emsallerini ayrı görünümde yönetebilir hale getirildi.

Yapılanlar:
- Emsaller başlığına `Tüm Emsaller`, `Konut / Yapı Emsalleri`, `Arsa / Tarla Emsalleri` görünüm seçimi eklendi.
- Konut/yapı görünümünde mevcut alanlar ve mevcut metin üretimi korunur.
- Arsa/tarla görünümünde `Yüzölçümü`, `İmar Lejantı`, `Yapı Nizamı`, `Emsal / KAKS`, `Kat Adedi`, `İmar Şerefiyesi` alanları gösterilir.
- Arsa/tarla görünümünde konut alanları (`Oda Sayısı`, `Nitelik`, `Bulunduğu Kat / Mülkiyet`, `Bulunduğu Yapı Yaşı`, kira alanları, beyan/düzeltilmiş alan ayrımı) gizlenir.
- Arsa/tarla için `Emsal Konumu` seçenekleri `Aynı bölge`, `Aynı sokak`, `Aynı cadde` olarak sadeleştirilir.
- Arsa/tarla hesaplarında alan olarak `Yüzölçümü`, şerefiye olarak `İmar Şerefiyesi + Konum Şerefiyesi` kullanılır.
- Arsa/tarla uzun emsal metni satış bedeli, pazarlık payı, yapılaşma koşulları ve indirgenmiş m2 birim değer hesabını içerecek şekilde ayrı üretildi.

Yedek:
`backups/before-land-comparable-dynamic-fields_2026-07-10_17-20-24`

Servis sürümü:
`app.js?v=20260710-1742`, `styles.css?v=20260710-1742`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden HTML servisinde yeni app/css cache-buster doğrulandı.

---

## 0.0.60 2026-07-10 Emsal Niteliği Boş Seçenek Düzeltmesi (Codex oturumu)

`Emsal Niteliği` seçim listesinin başındaki boş seçenek kaldırıldı.

Yapılanlar:
- Liste artık doğrudan `Konut`, `Dükkan`, `Tarla`, `Arsa`, `Müstakil Bina` seçenekleriyle başlar.
- `tools/check-basic.js` boş seçenek geri eklenirse yakalayacak şekilde güncellendi.

Yedek:
`backups/before-comparable-nature-empty-option-fix_2026-07-10_17-03-36`

Servis sürümü:
`app.js?v=20260710-1704`, `styles.css?v=20260709-2232`

---

## 0.0.59 2026-07-10 Emsaller Emsal Niteliği Alanı (Codex oturumu)

Emsaller matrisine `Telefon` ile `Emsal Durumu` arasına yeni `Emsal Niteliği` seçim satırı eklendi.

Yapılanlar:
- `comparableFields` içine görsel sırada `Telefon` satırından sonra `Emsal Niteliği` eklendi.
- Seçenekler: `Konut`, `Dükkan`, `Tarla`, `Arsa`, `Müstakil Bina`.
- Eski emsal verilerinin `Emsal Durumu` (`c2`) ve sonraki hesap alanları kaymasın diye yeni alan veri anahtarı olarak `c23` kullanır.
- `tools/check-basic.js` bu yeni alanın sırasını ve seçeneklerini kontrol eder.

Yedek:
`backups/before-comparable-nature-field_2026-07-10_16-58-25`

Servis sürümü:
`app.js?v=20260710-1700`, `styles.css?v=20260709-2232`

---

## 0.0.58 2026-07-10 Arsa Açıklaması Ana Taşınmaz Niteliği ve Tarım Alanları (Codex oturumu)

Kullanıcı, arsa açıklamasında `tapu kaydında “Mesken” vasıflı` metninin bağımsız bölüm niteliğinden geldiğini; burada ana taşınmaz niteliğinin kullanılması gerektiğini belirtti. Ayrıca `Arsa` ve `Müstakil Bina` seçildiğinde tarım alanlarının gizlenmesi ve açıklama metnine girmemesi istendi.

Yapılanlar:
- `buildLandIdentitySentence()` artık vasıf metninde önce `mainPropertyQuality`, yoksa `titleQuality`, yoksa `Arsa` kullanır.
- `landDescriptionAutoRefreshFields` içine `mainPropertyQuality`, `legalUsageNature`, `ownershipType` eklendi.
- `shouldHideLandAgricultureControls()` eklendi.
- Yasal kullanım niteliği `Arsa`, mülkiyet `Arsa` veya `Müstakil Bina` ise `Tarım Türü` ve `Parsel üzerinde Zirai Ürün Var mı?` alanları gizlenir.
- Aynı koşullarda `buildLandAgriculturalProductSentence()` ve `buildLandAgricultureSentence()` boş döner; arsa açıklamasına zirai ürün/tarım cümleleri eklenmez.

Yedek:
`backups/before-land-main-quality-and-agriculture-visibility_2026-07-10_16-51-21`

Servis sürümü:
`app.js?v=20260710-1653`, `styles.css?v=20260709-2232`

---

## 0.0.57 2026-07-10 Silinen Rapor Hayalet Kart Olarak Geri Geliyordu (Opus oturumu)

Kullanıcı, giriş yaptıktan sonra Taleplerim'de gerçek verisiyle ekran
görüntüsü paylaştı: 1 yerel rapor + **7 "Yalnızca bulutta" hayalet kart**
(muhtemelen bu oturumdaki test raporlarından — kullanıcı gerçek girişle
denemeler yaptıkça arka plandaki dirty-watcher hepsini otomatik buluta
göndermiş). "Talepleri silsem de yine gözüküyor" dedi.

### İki ayrı kök neden

1. **`deleteReport(id)`** bulut kopyasını Firestore'dan siliyordu ama
   bellekteki `cloudReportsCache` (dashboard açıldığında bir kez çekilen
   anlık görüntü) GÜNCELLENMİYORDU. Silinen raporun local index/blob'u
   kalkınca, bir sonraki çizimde `Object.keys(cloudReportsCache).filter(id
   => !localIds.has(id))` mantığı az önce silinen raporu "yalnızca bulutta"
   YENİ bir hayalet kart sanıp tekrar gösteriyordu.
2. **"Yalnızca bulutta" kartlarının (ekran görüntüsündeki 7 kart) hiç Sil
   butonu yoktu** — yalnızca "Bu Cihaza Getir ve Aç" vardı. Bu kartları
   silmenin HİÇBİR yolu yoktu.

### Düzeltme (`cloud/report-library.js`)

- `deleteReport(id)`: bulut silme başarılı olduktan sonra artık
  `if (cloudReportsCache) delete cloudReportsCache[id];` de çalıştırıyor —
  silinen rapor aynı oturumda hayalet olarak geri gelmiyor.
- Yeni `deleteCloudOnlyReport(id)` + "yalnızca bulutta" kartlarına **Sil**
  butonu eklendi — artık hiç bu cihaza getirilmemiş bulut kayıtları da
  doğrudan silinebiliyor (önce getirip sonra silmeye gerek yok).

### Doğrulama

- Sözdizimi temiz, `check-basic` + tüm node testleri geçti.
- Canlı tarayıcıda (bu ortamda gerçek Firebase girişi olmadığından **kapı
  test amaçlı geçici olarak devre dışı bırakılarak**, gerçek dosyalar
  değiştirilmeden) yerel senaryo doğrulandı: `deleteReport` artık
  `cloudReportsCache` null iken de hatasız çalışıyor, konsol temiz.
- **Test EDİLEMEYEN kısım (dürüstçe belirtilmeli)**: gerçek imzalı bir
  hesapla, gerçekten bulutta duran hayalet kayıtların hem "Sil" hem de
  düzeltilen `deleteReport` akışıyla KALICI olarak kaybolduğu bu oturumda
  uçtan uca doğrulanamadı (gerçek kimlik bilgisi yok). Kullanıcının
  ekranındaki 7 hayalet kaydı temizlemesi ve sonucu teyit etmesi gerekir.

Sürüm: `cloud/report-library.js?v=20260710-1626`. Ayrı yedek alınmadı (küçük,
tek dosyalık düzeltme; önceki `backups/before-mandatory-auth-gate_2026-07-09_22-44-05`
yeterli taban).

---

## 0.0.56 2026-07-09 BÜYÜK GÜNCELLEME: Zorunlu Giriş Kapısı — D6 Tersine Çevrildi (Opus oturumu)

Kullanıcı: "Uygulama internet olmadan çalışmamalı. Dosyaları artık Google
Cloud Always Free Amerikan sunucularında saklıyorum, dışarıdan böyle
bağlanıyorum, ilerde tam bir web servisine çevireceğim. Kullanıcı login
olmadan hiçbir detay görememeli. Bu bir senkron durumu değil — yetkisiz kimse
programı kullanamamalı ve görememeli."

Bu, oturum boyunca defalarca savunduğum **D6 kararının** ("bulut kapalıyken
uygulama %100 yerel çalışır") kullanıcının AÇIK talimatıyla **kasıtlı tersine
çevrilmesidir.** `cloud/FAZ0-TASARIM.md`'de D6 SÜPÜRÜLDÜ (superseded) olarak
işaretlendi, yeni **D7** kararı yazıldı — bir sonraki oturum bunu "düzeltme"
sanıp eski haline getirmesin diye.

### Uygulanan: Zorunlu Giriş Kapısı (Auth Gate)

- **`index.html`**: `<body>` açılır açılmaz, HARİCİ CSS'i beklemeden, satır içi
  stille opak ve **tüm viewport'u** kaplayan `#authGateOverlay` eklendi
  (`z-index:99999`, en yüksek). Bu sayede uygulamanın kendisi (app.js hemen
  render eder) HİÇBİR ZAMAN görsel olarak açığa çıkmaz — ilk boyamadan
  itibaren üstü kapalıdır, JS'in "yetişip kapatması" gerekmez.
- **`cloud/cloud-sync.js`**: Yeni `evaluateGate()` mantığı — kapı yalnızca
  **HEM kimlik doğrulanmış HEM `navigator.onLine`** ise kaldırılır
  (`hideGate()`). Aksi hâlde üç olası ekran gösterilir:
  1. **Yapılandırma/Firebase yüklenemedi** → fail-closed engelleme mesajı
     (senkron/init() içinde ANINDA, async beklemeden).
  2. **Çevrimdışı** (`navigator.onLine === false`) → "İnternet bağlantısı
     bulunamadı, bu sistem yalnızca çevrimiçiyken kullanılabilir." + otomatik
     `online`/`offline` olay dinleyicileriyle canlı tepki.
  3. **Girişsiz** → tam e-posta/şifre giriş formu (kapının içinde, ayrı bir
     modal değil).
- **Çıkış Yap**: artık onay istiyor, çıkış sonrası **yerel taslak + tüm rapor
  kütüphanesini** (`rapor-yazma-programi-draft-v1`, `rapor-library-index-v1`,
  `rapor-library-report-*`) temizliyor ve sayfayı yeniden yüklüyor — paylaşılan/
  ortak bir cihazda oturum kapatan kullanıcının verisi bir sonraki kullanıcıya
  açık kalmasın diye. **Yalnızca AÇIK çıkış eyleminde** çalışır; geçici
  çevrimdışı anlarda veya normal oturum kontrolünde ASLA tetiklenmez (veri
  kaybı riski olmasın diye bilinçli sınırlandırıldı).

### ÖNEMLİ SINIR — dürüstçe belirtilmeli (kullanıcıya da iletildi)

Bu **istemci taraflı** bir kapıdır. `server.js` hâlâ statik dosyaları
**herkese koşulsuz** servis eder — sunucu, isteği kimin yaptığını hiç
sormaz. Yani:
- Sayfanın JS/HTML baytlarının kendisi, teorik olarak URL'yi bilen herkes
  tarafından indirilebilir (view-source/ağ sekmesi ile).
- Kapı, UYGULAMANIN GÖRSEL OLARAK AÇILMASINI ve ETKİLEŞİME GEÇİLMESİNİ
  engeller (canlı testte `elementFromPoint` ile piksel düzeyinde doğrulandı —
  kapı açıkken editöre tıklama ulaşmıyor) — bu, normal kullanıcılar için
  "login olmadan göremez/kullanamaz" gereksinimini karşılar.
- Ama teknik bilgili biri tarayıcı geliştirici araçlarıyla JS'i inceleyip
  DOM'u manipüle edebilir veya (varsa) eski bir oturumdan kalma localStorage
  verisini doğrudan okuyabilir.
- **Gerçek/tam güvenlik** (dosyaların kendisinin bile yetkisiz kişiye
  ulaşmaması) için **sunucu tarafı** oturum/yetki denetimi gerekir — bu,
  kullanıcının bahsettiği "web servisine dönüştürme" planıyla birlikte ele
  alınmalı (GCP'de gerçek bir backend — Cloud Run + auth middleware, veya
  benzeri — kadar bu sınır geçerlidir).

### Doğrulama (canlı tarayıcı — güvenlik kritik olduğundan özenle test edildi)

- Fail-closed varsayılan doğrulandı: temiz oturumda kapı otomatik gösterildi,
  giriş formu render edildi ✓
- **Piksel düzeyinde engelleme kanıtı**: `document.elementFromPoint()` ekran
  ortasında `#appShell` İÇİNDE bir eleman DÖNDÜRMEDİ — editör gerçekten
  erişilemez durumda ✓
- Çevrimdışı simülasyonu (`navigator.onLine` override + `offline` event) →
  kapı doğru mesaja geçti; `online` event → giriş formuna geri döndü ✓
- Konsol hatasız; tüm node testleri temiz.
- **Test EDİLEMEYEN kısım (dürüstçe belirtilmeli)**: gerçek kimlik bilgisiyle
  başarılı giriş → kapının kalkması, bu ortamda gerçek Firebase şifresi
  olmadığı için uçtan uca doğrulanamadı. Kod dikkatle satır satır izlendi
  (`hideGate()` tek satırlık, düşük riskli bir dallanma) ama kullanıcının
  ilk gerçek girişinde teyit etmesi önerilir.

### Belge güncellemeleri

- `cloud/FAZ0-TASARIM.md`: D6 süpürüldü, yeni **D7** kararı + sınır notu eklendi.
- `cloud/KURULUM.md`: eski "bugünkü gibi yerel çalışır" notu geçersiz işaretlenip D7'ye yönlendirildi.

Yedek: `backups/before-mandatory-auth-gate_2026-07-09_22-44-05`.

### Bilinen sınırlar / olası sonraki adımlar

- Yerel rapor kütüphanesi (`report-library.js`) init() sırasında hâlâ
  kimlik doğrulanmadan ÖNCE çalışıyor (localStorage'a yazıyor) — kapı bunu
  GÖRSEL olarak gizliyor ama devtools'tan okunabilir kalıyor. Tam sertleştirme
  için report-library.js'in başlatılmasını da auth onayına ERTELEMEK gerekir
  (bu oturumda yapılmadı, ayrı bir iş).
- Gerçek sunucu-taraflı erişim denetimi (asıl "web servisi" planı) henüz yok.

---

## 0.0.55 2026-07-09 Taleplerim: Popup'tan Tam Sayfaya (Faz 3.2, Opus oturumu)

Kullanıcı: "Taleplerim şu an popup şeklinde geliyor, ilk açılışta tam sayfa
olsun; sıralama Kullanıcı girişi > Taleplerim > Rapor Oluştur Bölümü olmalı."

### Karar: giriş opsiyonel kaldı (kullanıcıya soruldu, yanıtsız kaldı → güvenli
### varsayılan uygulandı)

"Giriş zorunlu bir kapı mı olsun?" diye soruldu, kullanıcı yanıt vermedi. Bu
uygulamanın kurucu ilkesi (FAZ0 D6: "Bulut kapalıyken uygulama bugünkü gibi
çalışır") ve "mobil saha, masaüstü tamamlama" vizyonu — sahada internet
olmayabilir — göz önüne alınarak **güvenli varsayılan** uygulandı: **giriş hâlâ
opsiyonel**, uygulama bulutsuz/girişsiz tamamen çalışmaya devam ediyor. Bunun
yerine istenen sıralama SADECE görsel/akış düzeyinde karşılandı: Taleplerim
sayfasının EN ÜSTÜNDE hesap/giriş durumu şeridi var (önce görülen şey bu),
altında talep listesi geliyor — "Kullanıcı girişi > Taleplerim" sıralaması
giriş ZORUNLU olmadan sağlandı. Kullanıcı isterse ileride "girişi zorunlu yap"
seçeneğine geçilebilir.

### Yapılan değişiklik

- **`cloud/report-library.js > openDashboard()`**: Taleplerim artık
  `.modal-overlay` (yarı saydam arka plan + ortada yüzen kart + arka plana
  tıkla-kapat) DEĞİL; yeni `.library-page-overlay` + `.library-page` — **opak
  zemin, tüm viewport, gerçek sayfa**. Arka plana tıkla-kapat davranışı
  KALDIRILDI (artık "arkada" bir şey görünmüyor ki tıklanıp kapatılsın).
  Kapatma yalnızca açık "Rapora Devam Et →" butonuyla.
- **Yeni hesap/giriş şeridi** (`renderAccountStripHtml`): sayfanın en üstünde
  — giriş yapılmadıysa "🔒 Giriş yapılmadı — talepler yalnızca bu cihazda" +
  **Giriş Yap** butonu; giriş yapılmışsa "✅ e-posta" + **Hesap** butonu.
  İkisi de `window.RaporCloudSync.openCloudModal()`'ı açar (bu fonksiyon dışa
  yeni açıldı — önceden yalnızca "Bulut" düğmesinin kendi tıklama olayı
  içinde özeldi).
- **`cloud-sync.js`**: `getStatus()` artık `email` alanını da döndürüyor;
  yeni `onAuthChange(callback)` API'si — giriş/çıkış olduğunda Taleplerim
  açıksa hesap şeridi otomatik tazelenir (`report-library.js`
  `refreshAccountStrip` ile `init()`'te bir kez kaydedilir).
- `styles.css` sonuna tam sayfa düzeni eklendi (`--bg` token'ı zemin rengi;
  mevcut lacivert tema renkleri kullanıldı, yeni renk yok).

### Doğrulama (canlı tarayıcı, masaüstü + mobil)

- Otomatik açılışta: opak zemin, `getBoundingClientRect()` viewport'la BİREBİR
  eşleşti (1000×946 = 1000×946) — gerçekten tam sayfa, küçük kart değil ✓
- Arka plana (overlay'e) tıklama artık kapatmıyor ✓
- "Giriş Yap" → giriş modalı üstte açıldı; "Rapora Devam Et →" → sayfa
  kapanıp editöre dönüldü ✓
- Mobilde (375px) başlık/hesap şeridi/buton dikey sıraya geçti (`flex-direction:
  column`), yatay taşma yok; masaüstünde (1440px) tek satırda hizalı ✓
- Ekran görüntüleriyle görsel olarak da doğrulandı (hem masaüstü hem mobil).
- Konsol hatasız; tüm node testleri temiz.

Yedek: `backups/before-taleplerim-fullpage_2026-07-09_22-28-53`.

---

---

## 0.0.54 2026-07-09 "Buluttan Yükle Boş Geldi" — Çoklu Rapor UX Tuzağı (Opus oturumu)

Kullanıcı: masaüstünde talep girip TAKBİS yükleyip doldurdu, "Şimdi Gönder"
dedi; tablette "Bulut → Buluttan Yükle" dedi ama bölümler **boş** kaldı.

### Kök neden

Faz 2'den beri her cihazın **kendi aktif raporu** (`state.reportId`) var.
Tabletin "Buluttan Yükle" düğmesi `pullReport()`'u çağırır ve bu HER ZAMAN
`cloud.activeReportId`'ye (o cihazın O AN açık olan raporuna) bakar —
masaüstünde oluşturulan FARKLI rapor ID'sine değil. Tablet muhtemelen ilk
açılışta otomatik oluşan boş bir taslakla açıktı; o ID için Firestore'da kayıt
yoktu, `pullReport` "Bulutta kayıt yok" diyip `state`'e hiç dokunmadan geri
döndü → ekran boş kaldı. **Veri kaybı yoktu** — masaüstündeki rapor buluttaydı,
tablet yalnızca yanlış (kendi) rapor kimliğine bakıyordu.

Bu, Faz 1'in "tek rapor" varsayımıyla yazılmış "Buluttan Yükle" düğmesinin,
Faz 2'nin çoklu-rapor dünyasında YANILTICI kaldığı bir UX tuzağıydı — kod
hatası değil, ama gerçek bir kullanıcı hatası tuzağı.

### Doğru kullanım (kullanıcıya iletildi)

Farklı bir cihazda oluşturulan raporu getirmek için **"Bulut" değil,
"Taleplerim"** kullanılmalı: o rapor orada "Yalnızca bulutta" etiketiyle ayrı
bir kart olarak görünür; **"Bu Cihaza Getir ve Aç"** doğru şekilde getirir
(bu yol zaten Faz 2'de test edilip çalıştığı doğrulanmıştı).

### Yapılan düzeltme (`cloud/cloud-sync.js > renderAccountModal`)

- Buton etiketleri netleştirildi: "Şimdi Gönder"→**"Bu Raporu Şimdi Gönder"**,
  "Buluttan Yükle"→**"Bu Raporu Buluttan Yenile"** (yalnızca AÇIK rapora
  uygulandığı artık isimden belli).
- Modal metnine kalın uyarı eklendi: farklı cihazda oluşturulan rapor için
  "Taleplerim" kullanılması gerektiği açıkça yazıyor.
- **Akıllı ipucu:** "Bu Raporu Buluttan Yenile" başarısız olursa (bu ID için
  bulutta kayıt yoksa) ve hesapta BAŞKA raporlar varsa, otomatik olarak
  "Taleplerim'i Aç" butonlu bir uyarı modalı açılır — kullanıcı bir daha bu
  tuzağa düşmeden doğru yola yönlendirilir.
- Ayrıca hesap modalındaki eski/yanlış "Raporlarım" ifadesi "Taleplerim"
  olarak düzeltildi (0.0.53'teki yeniden adlandırmadan kaçmıştı).

### Doğrulama

- Sözdizimi + `check-basic` temiz.
- Canlı tarayıcı: giriş modalı ve Taleplerim akışları bu değişiklikten sonra
  da sorunsuz açılıyor, konsol hatasız.
- **Not:** Yeni "akıllı ipucu" akışının TAMAMI (gerçek Firestore kayıtlarıyla)
  bu oturumda canlı test EDİLEMEDİ — gerçek Firebase kimlik bilgileri
  olmadığından giriş yapılamadı. Kod dikkatle satır satır izlendi (mevcut,
  zaten test edilmiş `modalShell`/`listCloudReports` üzerine kuruldu) ama
  kullanıcının bir sonraki bulut denemesinde gerçek sonucu teyit etmesi gerekir.

Sürüm: `cloud/cloud-sync.js?v=20260709-2218`. Ayrı yedek alınmadı (küçük,
tek dosyalık, düşük riskli metin/mantık düzeltmesi — önceki
`backups/before-taleplerim-dashboard_2026-07-09_21-56-57` yeterli taban).

---

## 0.0.53 2026-07-09 "Taleplerim" Ana Ekran Deneyimi (Opus oturumu)

Kullanıcı, Kuveyt Türk INVEX portalının (banka görevlendirme ekranı) ekran
görüntüsünü paylaşıp "sistem ilk açıldığında böyle bir dashboard olsun,
Taleplerim / Yeni Talep Oluştur kısımları olmalı" dedi.

### Karar: neyi aldık, neyi almadık

Banka ekranındaki YET/YON/GME 10 aşamalı iş akışı daireleri ve "Mobil İmza"
bilerek KOPYALANMADI — onlar bankanın çok taraflı (şube→uzman→inceleme)
sürecine ait; bu uygulamada tek kişi tüm süreci yürütüyor, o daireler burada
anlamsız olurdu. Alınanlar, gerçekten karşılığı olan kısımlar:

- **İlk açılışta otomatik "Taleplerim" ekranı** (Faz 2'nin dashboard'u artık
  bir butonun arkasında gizli değil, sistemin gerçek giriş ekranı).
- **Etiket değişimi:** "Raporlarım" → **Taleplerim**, "+ Yeni Rapor" →
  **+ Yeni Talep Oluştur**, "Raporu Oluştur" → **Talebi Oluştur**.
- **"Gün" geri sayımı** (referans ekrandaki "Gün: 4" karşılığı) — raporun
  zaten var olan `appointmentDate` (Randevu Tarihi) alanına göre her kartta
  "Randevu: X gün kaldı / Bugün / X gün gecikti" (yeşil/amber/kırmızı).
- **Durum filtreleri** (referans ekrandaki "Gönderilmemiş (1)" sekmesinin
  karşılığı) — Tümü / Taslak / Tamamlandı çipleri, sayaçlı. Her kartta elle
  işaretlenebilen "Taslak"/"Tamamlandı" rozeti + "Tamamlandı İşaretle" butonu.

### Teknik: ilk-açılış otomasyonu neden sessionStorage ile

`sessionStorage` (localStorage DEĞİL) kasıtlı seçildi: sekme kapanınca
sıfırlanır ama **aynı sekmede yapılan Ctrl+F5 yenilemelerinde kalıcı kalır**.
Bu proje sık sık cache-buster sonrası Ctrl+F5 gerektiriyor (bkz. Bölüm 1) —
localStorage kullansaydım kullanıcı rapor üzerinde çalışırken her yenilemede
"Taleplerim" ekranı önüne düşüp işini bölerdi. sessionStorage ile yalnızca
GERÇEKTEN yeni bir tarayıcı sekmesi/oturumu açıldığında bir kez gösteriliyor.

### Değişen dosyalar

- **`cloud/report-library.js`**: `summarizeFields`'e `appointmentDate` eklendi;
  index kayıtlarına `status: "draft"|"completed"` eklendi (`flushActiveToLibrary`,
  `cloneReport`, `fetchCloudReportAndOpen` — geriye dönük uyumlu, eksikse
  "draft" varsayılır); yeni `toggleStatus`, `formatDeadlineBadge`,
  `computeStatusCounts`, `renderStatusFilterChips`,
  `maybeAutoShowDashboardOnFreshSession` fonksiyonları; etiket metinleri
  güncellendi.
- **`styles.css`**: `.library-status-filter`/`.library-filter-chip`,
  `.library-status-pill` (`.is-draft`/`.is-completed`), `.library-badge-danger`,
  kart başlığının rozet düzeni (`.library-card-badges`) — mevcut lacivert tema
  token'ları kullanıldı, yeni renk icat edilmedi.
- `app.js`/`cloud/cloud-sync.js` bu turda DEĞİŞMEDİ.

### Doğrulama (canlı tarayıcı)

- Temiz sessionStorage + reload → "Taleplerim" otomatik açıldı, başlık/buton
  etiketleri doğru ✓
- Aynı sekmede tekrar reload → dashboard TEKRAR açılmadı (session bayrağı
  kalıcı) ✓
- `appointmentDate` = bugün+2 gün → kart rozeti "Randevu: 2 gün kaldı" (amber) ✓
- `toggleStatus` → pill "Tamamlandı"ya döndü; filtre çipleri sayaçları doğru
  güncellendi (Tümü 1, Taslak 0, Tamamlandı 1); "Tamamlandı" çipine tıklayınca
  kart görünür, "Taslak" çipine tıklayınca gizlendi ✓
- Mobil (375px): tüm rozetler/çipler doğru render, yatay taşma yok ✓
- Konsol hatasız; tüm node testleri temiz.

Sürümler: `styles.css?v=20260709-2203`, `cloud/report-library.js?v=20260709-2203`
(app.js/cloud-sync.js bu turda değişmediği için sürümleri aynı kaldı:
`20260709-2129`). Yedek: `backups/before-taleplerim-dashboard_2026-07-09_21-56-57`.

---

## 0.0.52 2026-07-09 BÜYÜK GÜNCELLEME Faz 3: lastActiveSection, PWA, Saklama Uzatma, Kota Telemetrisi (Opus oturumu)

Kullanıcı Faz 2'yi başka bir telefonda başarıyla test ettikten sonra (giriş
çalıştı) Faz 3'e geçildi. FAZ0-TASARIM.md Bölüm 7'deki kalemler işlendi.

### 1) lastActiveSection cihazlar arası/rapor arası devri

Önceden `activeSectionId` hiçbir yerde saklanmıyordu (ne bulutta ne yerelde);
rapor değiştirince veya cihaz değiştirince her zaman 1. bölüme dönülüyordu.

- **`app.js`**: `exportReportJson()` artık paketin KÖKÜNE `activeSectionId`
  yazıyor (state'in içine değil — `state` şeması bozulmadı). `restoreStateFromImportedJson`
  bu alanı okuyup geçerliyse `setActiveSection(...)` ile o bölümü açıyor;
  yoksa eskisi gibi 1. bölüme döner (geriye dönük uyumlu, eski JSON dosyaları
  bozulmaz).
- **`cloud/report-library.js`**: Her rapor blobu da kendi `activeSectionId`'ini
  taşır; rapor değişince kullanıcı kaldığı bölümden devam eder.
- **`cloud/cloud-sync.js`**: Bulut zarfındaki `lastActiveSection` (zaten
  Faz 1'den beri gönderiliyordu ama hiç okunmuyordu) artık `pullReport`'ta
  gerçekten uygulanıyor.
- **Doğrulama (canlı tarayıcı):** Değerleme bölümündeyken yeni rapor
  oluşturuldu (→1. bölüme döndü, doğru), eski rapora dönüldü (→Değerleme'ye
  geri geldi, doğru). Ayrıca Takyidat bölümündeyken JSON export/import
  döngüsü de bölümü doğru geri getirdi.

### 2) PWA kurulumu (iOS/Android "Ana Ekrana Ekle")

Amaç: iOS Safari'nin normal sekmelerde 7 gün etkileşimsizlikte
localStorage/IndexedDB'yi silebilme riskine karşı, uygulamayı kurulabilir
("standalone") hale getirmek.

- **`tools/generate-pwa-icons.js`** (yeni, geliştirme aracı): harici bağımlılık
  olmadan, Node'un yerleşik `zlib`'i ile elle PNG üretir (CRC32 dahil elle
  yazıldı). Çıktı: `icons/icon-192.png`, `icons/icon-512.png`,
  `icons/apple-touch-icon.png` — lacivert zemin + kenar çubuğundaki marka
  kutusuyla aynı altın degrade, köşesi kıvrık "belge" silüeti (yeni renk icat
  edilmedi).
- **`manifest.json`** (yeni): ad, ikonlar, `display: standalone`,
  `theme_color/background_color: #111d3d`.
- **`service-worker.js`** (yeni): **kasıtlı olarak HİÇBİR ŞEYİ önbelleklemez**
  — yalnızca tarayıcıların "yüklenebilirlik" kriterini karşılamak için var,
  her isteği ağa olduğu gibi geçirir. Bu proje sürüm sorgu dizeleriyle
  (`?v=...`) manuel taze dağıtım kullandığından ve sunucu zaten
  `no-store`/`no-cache` gönderdiğinden, bir SW önbelleği tam çözülmeye
  çalışılan "eski sürüm görünüyor" sorununu geri getirirdi.
- **`index.html`**: manifest/ikon `<link>`'leri + `apple-mobile-web-app-title`
  eklendi; SW kaydı yalnızca `window.isSecureContext` doğruysa denenir.
- **ÖNEMLİ KISIT:** Service worker'lar yalnızca **https:** veya
  **localhost/127.0.0.1** üzerinde kayıt olabilir (tarayıcı kuralı). Telefon
  LAN IP'si üzerinden düz http ile bağlandığında (`http://192.168.x.x:5174`)
  `isSecureContext` false olur ve SW hiç kaydolmaz — bu ortamda "Ana Ekrana
  Ekle" korumasını sağlayan şey **manifest + meta etiketleri** olur (SW şart
  değil, iOS'un standalone-app muafiyeti zaten bunlara dayanır). SW, yalnızca
  masaüstünde `localhost` üzerinden veya ileride HTTPS'li bir barındırmaya
  (ör. Firebase Hosting) geçilirse tam olarak aktif olur.
- **Doğrulama:** `localhost:5173` üzerinde SW gerçekten kaydoldu ve
  `state: "activated"` oldu (canlı kontrol edildi); `manifest.json`,
  `service-worker.js`, `icons/icon-192.png` hepsi 200 döndü.

### 3) "30 Gün Daha Sakla" + Kota Telemetrisi

- **`cloud-sync.js > extendReportExpiry(reportId)`**: raporu AÇMADAN yalnızca
  `expireAt`'i yeniler. `rev` için `FieldValue.increment` KULLANILMADI —
  Firestore Rules'daki `rev is int` kontrolü artış sentinel'ini
  değerlendiremediğinden önce okunup elle +1 yapılıyor.
- **Dashboard kartları**: bulut rozetinin yanına **"+30 gün"** butonu eklendi
  (yalnızca o raporun bulut kopyası varsa görünür).
- **Kota telemetrisi**: `bumpDailyPushCounter`/`getDailyPushCount` — her
  başarılı gönderimde günlük sayaç artar (yerel, yalnızca bilgi amaçlı;
  Firestore'un kendi sunucu kotasını yansıtmaz). Bulut hesap modalına
  "Bugünkü gönderim: X / 20.000" satırı eklendi.

### 4) İstemci tarafı şifreleme — değerlendirme (uygulanMADI, karar bekliyor)

FAZ0 planında "değerlendirilecek" olarak işaretlenmişti. Mühendislik
tavsiyem: **şimdilik uygulamayın.** Gerekçe:
- En büyük KVKK riski (belgeler + ham metinler) zaten Faz 0'da buluta hiç
  gitmeyecek şekilde çözüldü.
- Kalan senkron veri (malik adı, haciz tutarı gibi) raporun kendisi — ayrı bir
  şifre olmadan da zaten yalnızca Firestore Rules + gerçek giriş ile
  korunuyor, Google altyapısı veriyi zaten diskte şifreli tutuyor, ve 30 gün
  sonra otomatik siliniyor.
- İstemci şifrelemesi, unutulan bir şifrenin TÜM bulut yedeklerini **kalıcı ve
  geri dönüşsüz** olarak okunamaz hale getirme riski taşır (kurtarma akışı
  imkansızdır, çünkü anahtar hiçbir sunucuya gönderilmez) — bu risk, ek
  KVKK faydasından daha ağır basıyor.
- Karar kullanıcıya ait: isterseniz Faz 4'te ele alınabilir.

### Test / Doğrulama

- Tüm node testleri temiz (check-basic, takbis, halkbank, value-factors,
  comparable).
- Canlı tarayıcı: yukarıdaki 1-3 numaralı maddelerin hepsi doğrulandı; konsol
  hatasız, başarısız ağ isteği yok.
- Sürümler `v=20260709-2129`; yedek `backups/before-faz3_2026-07-09_21-18-53`.

### Bilinen sınırlar (Faz 4'e bırakılabilir)

- İstemci şifrelemesi (yukarıda tartışıldı, karar bekliyor).
- Rapor tamamlama/dışa aktarma hatırlatma modalı hâlâ yok.
- Gerçek bir Firestore hesabıyla "+30 gün" ve kota sayacı bu oturumda canlı
  test edilmedi (Firebase şifresi bilinmiyor); yalnızca kod/kural düzeyinde
  doğrulandı. Kullanıcı bir sonraki bulut girişinde bunları da deneyebilir.

---

## 0.0.51 2026-07-09 BÜYÜK GÜNCELLEME Faz 2: Çoklu Rapor Kütüphanesi + Dashboard (Opus oturumu)

Faz 0 (tasarım) ve Faz 1 (tek rapor bulut senkronu) üzerine, uygulamaya **çoklu
rapor yönetimi** eklendi: "Raporlarım" dashboard'u, yeni rapor kısa formu, aç/
kopyala/arşivle/sil, arama, bulut senkron durumu rozeti.

### Önce çözülen açık sorun: telefonda "sayfa açılmıyor" / "şifre girince çöküyor"

- **Kök neden bulundu:** `mobil-sunucu-baslat.bat` sunucuyu **5174** portunda
  açıyor, ama `guvenlik-duvari-izin-ver.bat` yalnızca **5173**'e güvenlik
  duvarı izni veriyordu → telefon isteği Windows tarafından sessizce
  reddediliyordu. **Düzeltildi**: betik artık her iki portu da açıyor; kural
  ayrıca bilgisayarda CANLI olarak da eklendi (`Test-NetConnection` ile 5174
  erişimi doğrulandı, `TcpTestSucceeded: True`).
- **Şifre girişi çökme şüphesi:** Kontrollü testte (sahte e-posta/şifre ile
  gerçek Firebase isteği) **çökme YOK** — ağ isteği gitti (`400`, beklenen),
  hata mesajı doğru göründü, `state` bozulmadı. Muhtemelen cihaza özgü eski
  önbellekti; kod tarafında hata bulunamadı.
- Bu arada mobil sertleştirme sırasında (autocapitalize kapatma) **şifre
  alanını yanlışlıkla silmiştim** — fark edilip düzeltildi, görsel doğrulandı.

### Mimari karar: yerel "rapor kütüphanesi" katmanı

app.js'in 21k satırlık tek-aktif-`state` mimarisi **değiştirilmedi**. Onun
üstüne, orijinal vizyon dokümanındaki (offline-first, çoklu rapor) hedefi
karşılayan bağımsız bir katman eklendi:

- Her rapor `localStorage`'da ayrı bir blob (`rapor-library-report-<id>`) —
  mevcut "JSON olarak farklı kaydet" ile **birebir aynı paket şekli**, tamamen
  çevrimdışı çalışır.
  Özet index'i ayrı anahtarda (`rapor-library-index-v1`).
- Rapor değiştirme = mevcut raporu kütüphaneye kaydet → hedef raporu **mevcut
  `restoreStateFromImportedJson`** ile aktif hale getir (tekerlek yeniden icat
  edilmedi).
- Bulut senkronu artık "tek rapor" değil, **o an aktif olan rapor** üzerinde
  çalışır (`cloud-sync.js` yeniden düzenlendi: `reportId` → `activeReportId`,
  `setActiveReportId`/`listCloudReports`/`deleteCloudReport` API'leri eklendi;
  sign-in'de "en son değişeni otomatik benimse" davranışı kaldırıldı).

### Yeni dosya: `cloud/report-library.js`

- **Veri katmanı**: `ensureActiveReportId`, `flushActiveToLibrary`,
  `openReportById`, `createNewReport`, `cloneReport`, `toggleArchive`,
  `deleteReport`.
- **Dashboard UI**: "Raporlarım" düğmesi (Yeni iş'in yanında) → kart listesi
  (banka/müşteri/konum/ada-parsel/tür/son güncelleme), arama, arşiv filtresi,
  kısa "+ Yeni Rapor" formu (Banka/Müşteri/İş Adı*/İl/Yasal Kullanım
  Niteliği), her kartta bulut senkron rozeti (buluta yüklü + geri sayım /
  yalnızca bu cihazda) ve "yalnızca bulutta olan" raporlar için "Bu Cihaza
  Getir ve Aç" kartı (yeni cihazda ilk açılış senaryosu).
- **Kritik hata önlendi (silme):** Aktif rapor silinince bir sonraki rapora
  geçiş `flushActiveToLibrary` ÇAĞIRMADAN yapılır (`loadReportIntoActiveState`)
  — aksi halde bellekte hâlâ duran silinmiş raporun verisi kendini otomatik
  "diriltirdi". Canlı testte doğrulandı: silinen rapor index/blob'ta kalmıyor.
  ayrıca kendini `resetToFreshEmptyReport()` ile sıfırdan boş rapora düşer.
- **Kritik zamanlama düzeltmesi (bulut karşılaştırması):** Rapor değiştirirken
  "bulut daha yeni mi" karşılaştırması `state.updatedAt`'i DEĞİL, blobun
  DEĞİŞİMDEN ÖNCEKİ `updatedAt`'ini kullanır — çünkü `restoreStateFromImportedJson`
  içindeki `saveState()` `state.updatedAt`'i anında "şimdi"ye çeker; bu da
  karşılaştırmayı her zaman "yerel daha yeni" yapıp bulut uyarısını hiç
  tetiklemezdi. Aynı sorun uygulama ilk açılışı için de düzeltildi
  (`preExistingUpdatedAt` kendi flush'ımızdan ÖNCE yakalanır).

### `app.js`'te tek değişiklik: "Yeni iş" veri kaybı düzeltildi

Eskiden bu buton mevcut taslağı **hiç kaydetmeden** siliyordu. Artık kütüphane
yüklüyse doğrudan `window.RaporReportLibrary.createNewReport({})` çağrılır —
mantık TEKRARLANMADI (aksi halde yeni boş rapor `reportId` almadan kalır ve
arka plandaki bulut senkronu eski raporun bulut kaydının üzerine boş veri
yazabilirdi). Kütüphane yoksa eski davranış korunur.

### CSS

`styles.css` sonuna "RAPOR KÜTÜPHANESİ DASHBOARD" bloğu eklendi (kart ızgarası,
aktif/arşiv/bulut rozetleri, mobilde tek sütun — `--green/--gold/--red` gibi
mevcut lacivert tema token'ları kullanıldı, yeni renk icat edilmedi).

### Doğrulama (canlı tarayıcı, uçtan uca)

1. İlk yükleme → `reportId` otomatik atandı, kütüphanede 1 kayıt ✓
2. Dashboard açıldı, kart doğru render edildi (ekran görüntüsü alındı) ✓
3. "+ Yeni Rapor" → yeni `reportId`, aktif rapor değişti, index 2 kayıt ✓
4. "Aç" ile ilk rapora dönüş → alanlar doğru geri geldi ✓
5. "Kopyala" → yeni `reportId`, aktif rapor kopyaya geçti, index 3 kayıt ✓
6. "Arşivle" → kart gizlendi; "Arşivlenenler" toggle ile geri geldi ✓
7. Arama ("Bursa") → yalnızca eşleşen kart göründü ✓
8. **"Yeni iş" düzeltmesi** → eski rapor kütüphaneye kaydedildiği doğrulandı
   (`oldReportSavedInLibrary: true`), yeni boş rapor fresh `reportId` aldı ✓
9. **Aktif raporu silme** (en riskli senaryo) → silinen rapor index/blob'tan
   tamamen kalktı, kendini DİRİLTMEDİ, bir sonraki rapora doğru geçildi ✓
10. Mobil (375px): dashboard tek sütun, yatay taşma yok ✓
11. Konsol boyunca hiç hata yok; tüm node testleri temiz.

### Bilinen sınırlar / sonraki adımlar (Faz 3'e bırakıldı)

- Rapor **tamamlama/dışa aktarma hatırlatma modalı** henüz yok (FAZ0 planı).
- Geri sayım rozetinin renk eşiği (≤7 gün amber) yalnızca CSS sınıfı düzeyinde;
  gerçek Firestore `expireAt` ile CANLI test edilmedi (bulut girişi bu
  oturumda tamamlanmadı — kullanıcı hâlâ TTL adımını ve ilk canlı girişi
  yapıyor).
- "30 gün daha sakla" butonu yok.
- Bulut ↔ yerel kütüphane tam iki yönlü liste senkronu yok (yalnızca "yalnızca
  bulutta olanı getir" tek yönlü akış var).

Yedekler: `backups/before-cloud-sync-faz1_2026-07-09_15-57-38`,
`backups/before-report-library-faz2_2026-07-09_20-44-55`

---

## 0.0.50 2026-07-09 BÜYÜK GÜNCELLEME Faz 1: Bulut Senkron Uygulaması (Opus oturumu)

Faz 0 kararları (0.0.49) uygulamaya döküldü. Kullanıcı kararları: Firebase
hesabı **canlilar.melih@gmail.com**, **tek kullanıcı**. Üretim raporu ölçümü:
bulut paketi **25.7 KiB = 1 MiB limitinin %2.5'i** (tek belge stratejisi teyit).

### Eklenen dosyalar

- **`vendor/firebase/`** — firebase-app/auth/firestore **compat 11.10.0**
  paketleri yerel vendor (offline dostu; pdfjs/tesseract ile aynı desen).
- **`cloud/firebase-config.js`** — yapılandırma placeholder'ı. `apiKey ===
  "YAPISTIR"` olduğu sürece bulut TAMAMEN pasif (D6); gerçek config Console'dan
  yapıştırılınca aktifleşir.
- **`cloud/cloud-sync.js`** — senkron modülü. **app.js'e sıfır dokunuş**:
  klasik script global'lerini (state/saveState/render/activeSectionId) okur,
  app.js'ten SONRA yüklenir.
  - Beyaz liste payload (fields, tables, lookupOptions, updatedAt) — canlı
    state'te doğrulandı, sourceValues/uploads/settings pakete girmiyor.
  - Kirlilik takibi: 10 sn'de bir `state.updatedAt` gözlenir; buluta yazma
    min 45 sn aralıkla + `visibilitychange(hidden)`/`pagehide`'da anında.
  - `rev` sayacı: gönderim öncesi uzak rev okunur; daha yeniyse sessiz üzerine
    yazma YOK — kullanıcıya "Buluttakini Yükle / Üzerine Yaz" modalı.
  - Girişte en yeni rapor benimsenir; bulut daha yeniyse yükleme teklifi modalı.
  - `expireAt = now + 30 gün` her gönderimde yenilenir (TTL — D3).
  - Firestore offline persistence açık (bağlantısızken kuyruklar).
  - UI: üst barda durum noktalı **Bulut** düğmesi + modal (kurulum-yok /
    giriş formu [göz ikonu, genel hata mesajı] / hesap-durum ekranı).
  - Test yüzeyi: `window.RaporCloudSync` (payload/isDirty/push/pull/getStatus).
- **`cloud/KURULUM.md`** — Console adımları (proje, Auth+tek kullanıcı+sign-up
  kapatma, Firestore eur3, Rules yapıştırma, TTL policy, web app config,
  2-cihaz kabul testi).
- `styles.css` sonuna "BULUT SENKRON ARAYÜZÜ" bloğu eklendi.
- `index.html`: firebase vendor + config + cloud-sync script'leri app.js'ten
  sonra eklendi.

### Doğrulama

- Tüm node testleri temiz; config yokken modül pasif (durum: "kurulmadı"),
  konsol hatasız, bölüm geçişleri/mobil düzen etkilenmedi (375px'te taşma yok).
- Canlı state'te `buildCloudReportPayload()` anahtarları birebir beyaz liste.
- **Canlı Firebase testi henüz YAPILMADI** — kullanıcının `cloud/KURULUM.md`
  adımlarını tamamlaması bekleniyor. Sonrasında kabul: 2 cihaz senkronu +
  Firestore'da `sourceValues` olmadığının görülmesi.

Yedek: `backups/before-cloud-sync-faz1_2026-07-09_15-57-38`

---

## 0.0.49 2026-07-09 BÜYÜK GÜNCELLEME Faz 0: Bulut Senkron Tasarımı (Opus oturumu)

"Cross-Device Değerleme Platformu" büyük güncellemesinin **karar/tasarım fazı**
tamamlandı. **Uygulama koduna dokunulmadı** (app.js/styles.css/index.html
değişmedi; cache-buster artırılmadı).

### Çıktılar

- **`cloud/FAZ0-TASARIM.md`** — kesinleşen kararlar (D1-D6), senkron paketi
  beyaz listesi, Firestore belge şeması, TTL kurulumu, güvenlik, kota bütçesi,
  çakışma stratejisi, faz planı ve açık sorular. **Faz 1 buna göre yapılacak.**
- **`cloud/firestore.rules`** — varsayılan-ret kurallar: yalnız sahibi
  `users/{uid}/reports/{reportId}` okur/yazar; zarf doğrulaması; `expireAt`
  zorunlu ve ≤40 gün sınırlı.
- **`tools/measure-cloud-payload.js`** — senkron paketi boyut ölçer (kişisel
  veri içeriği yazdırmaz). `node tools/measure-cloud-payload.js [export.json]`

### Ana kararlar (kullanıcı onaylı)

1. Belgeler + ham belge metinleri (`sourceValues`) buluta GİTMEZ (KVKK minimizasyonu).
2. Kullanıcı yalnız kendi raporlarını görür (`users/{uid}/reports` + Rules).
3. Raporlar son güncellemeden **30 gün** sonra buluttan kalıcı silinir
   (Firestore TTL, `expireAt`); arşiv = kullanıcı cihazı (JSON geri yüklenebilir,
   Word/PDF çıktıdır).
4. 0 TL altyapı: Firebase Auth + Firestore (europe-west) + Hosting + App Check.
   Cloud Functions/Storage/Turnstile KULLANILMAZ (Blaze/sunucu gerektirir).
5. Bulut kapalıyken uygulama bugünkü gibi çalışır (feature flag).

### Ölçüm

`server-data/active-case.json` (27 Mayıs örneği): tam state 23.7 KiB,
bulut paketi **6.5 KiB = 1 MiB limitinin %0.6'sı** (sourceValues %70'i
kaplıyordu — beyaz listeyi doğrular). Faz 1 öncesi dolu bir üretim raporu
JSON'u ile yeniden ölçülmeli.

### Sonraki adım (Faz 1)

Firebase projesi (europe-west) + Auth + login ekranı + tek raporun flag
arkasında senkronu. Öncesinde `FAZ0-TASARIM.md` Bölüm 8'deki açık sorular
yanıtlanmalı (Google hesabı, tek kullanıcı/ekip, dolu rapor ölçümü).

---

## 0.0.48 2026-07-09 Emlak Beyan Değeri Tarih/Yıl Cümlesi (Codex oturumu)

Emlak beyan değeri girildiğinde Değerleme bölümünde oluşan açıklama cümlesi belediye inceleme tarihi ve ilgili yıl bilgisiyle genişletildi.

Yapılanlar:
- Eski değer cümlesi yerine şu format kullanılır: `(Belediye inceleme tarihi) tarihinde (İlçe) Belediyesi Emlak Servisinden alınan bilgiye göre değerlemeye konu taşınmazın (Yıl) Yılı Emlak Beyan Değeri X TL'dir.`
- Tarih `municipalityInspectionDate || appointmentDate` alanından alınır.
- Yıl öncelikle belediye inceleme/randevu tarihinden, tarih yoksa sistem iş tarihinden alınır.
- `Belediye inceleme tarihi`, `randevu tarihi`, ilçe veya banka değiştiğinde Emlak Beyan açıklaması canlı yenilenir.

Yedek:
`backups/before-property-tax-value-sentence-date-year_2026-07-09_08-19-35`

Servis sürümü:
`app.js?v=20260709-0820`, `styles.css?v=20260709-0759`

---

## 0.0.47 2026-07-09 Ziraat Bankası Emlak Beyan Açıklaması (Codex oturumu)

`T.C. Ziraat Bankası A.Ş.` seçildiğinde emlak beyan değeri checkbox'ı işaretli değilse bilgi verilmeme metninin yeri bankaya özel olarak değiştirildi.

Yapılanlar:
- Ziraat seçili ve `Emlak Beyan Değeri` checkbox'ı işaretsizse rayiç bedel/malik dışı bilgi verilmeme cümlesi `10 - Değerleme` bölümünde `Emlak Beyan Değeri Açıklaması` kartında görünür.
- Aynı koşulda `14 - Açıklamalar` bölümündeki Emlak Beyan açıklama kartı gizlenir; metin iki bölümde birden tekrarlanmaz.
- Diğer bankalarda önceki davranış korunur: checkbox işaretsizse açıklama `14 - Açıklamalar` bölümünde kalır.
- Checkbox işaretli ve değer girilmişse değer açıklaması yine `10 - Değerleme` bölümünde görünür.

Yedek:
`backups/before-ziraat-property-tax-explanation_2026-07-09_08-10-21`

Servis sürümü:
`app.js?v=20260709-0811`, `styles.css?v=20260709-0759`

---

## 0.0.46 2026-07-09 Emlak Beyan Değeri Açıklama Kuralları (Codex oturumu)

Emlak beyan değeri checkbox durumuna göre Değerleme ve Açıklamalar bölümlerine otomatik açıklama üretimi eklendi.

Yapılanlar:
- `Emlak Beyan Değeri` checkbox işaretli ve değer girilmişse `10 - Değerleme` bölümünde `Kira Açıklaması` altında `Emlak Beyan Değeri Açıklaması` kartı görünür.
- Değerleme açıklaması: `(İlçe) Belediyesinden alınan bilgiye göre konu taşınmazın Emlak Beyan Değerinin X TL'dir.`
- Checkbox işaretsizse `14 - Açıklamalar` bölümünde bilgi verilmeme metni görünür.
- Açıklamalar metni: `(İlçe) Belediyesi Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.`
- İlçe metni `titleDistrict || district` alanından alınır; yoksa `İlgili Belediye` kullanılır.
- Checkbox/değer değişimlerinde açıklama kartları canlı güncellenir.

Yedek:
`backups/before-property-tax-explanation-panels_2026-07-09_07-58-15`

Servis sürümü:
`app.js?v=20260709-0759`, `styles.css?v=20260709-0759`

---

## 0.0.45 2026-07-09 Emlak Beyan Değeri Paneli (Codex oturumu)

`10 - Değerleme` bölümünde `Şerefiye Bölümü` altına belediyeden öğrenilen emlak beyan değerinin girilebileceği kapalı başlayan panel eklendi.

Yapılanlar:
- `Şerefiye Bölümü` altına `Emlak Beyan Değeri` paneli eklendi.
- Başlığın yanında varsayılan işaretsiz checkbox bulunur.
- Checkbox işaretlenince başlık satırında `Belediye Emlak Beyan Değeri` TL giriş kutusu açılır.
- Checkbox kapatılırsa değer temizlenir ve kutu gizlenir.
- Girilen değer `propertyTaxDeclarationValue`, checkbox durumu `propertyTaxDeclarationEnabled` alanlarında saklanır.

Yedek:
`backups/before-property-tax-declaration-value_2026-07-09_07-47-53`

Servis sürümü:
`app.js?v=20260709-0748`, `styles.css?v=20260709-0748`

---

## 0.0.44 2026-07-09 Kira Dip Notları Canlı Yenileme Düzeltmesi (Codex oturumu)

Kullanıcı, kira veya satış değeri değiştirildiğinde KAP/GDS dip notlarının dinamik güncellenmediğini bildirdi.

Kök neden:
- `refreshValuationControls()` yalnızca input değerlerini yeniliyordu.
- Kira satır başlığı altındaki `.valuation-label-note` metni tablo ilk oluşturulduktan sonra tekrar hesaplanmıyordu.

Yapılanlar:
- Piyasa değeri satır başlıklarına `data-market-row-key` işareti eklendi.
- Başlık ana metni `.valuation-label-text`, dip not metni `.valuation-label-note` olarak ayrıldı.
- `refreshValuationMarketLabels()` eklendi ve `refreshValuationControls()` içinde çağrıldı.
- Satış/kira değeri değiştiğinde KAP ve GDS dip notu artık aynı render içinde güncellenir.

Yedek:
`backups/before-rent-footnote-live-refresh_2026-07-09_07-34-35`

Servis sürümü:
`app.js?v=20260709-0735`, `styles.css?v=20260709-0735`

---

## 0.0.43 2026-07-09 Kira Kapitilizasyon Dip Notları (Codex oturumu)

`10 - Değerleme` bölümündeki `Piyasa Değeri` tablosu sadeleştirildi.

Yapılanlar:
- `Kapitilizasyon Oranı` ve `Gayrimenkul Amortisman Süresi` ayrı tablo satırları artık gösterilmez.
- Yasal/mevcut kira satırlarında bu bilgiler başlık altında dip not olarak gösterilir: `(KAP: % x, GDS y AY)`.
- Hesap alanları korunur; değerleme açıklamaları ve kira/kapitilizasyon hesapları aynı veriyi kullanmaya devam eder.

Yedek:
`backups/before-rent-metric-footnotes_2026-07-09_07-29-24`

Servis sürümü:
`app.js?v=20260709-0730`, `styles.css?v=20260709-0730`

---

## 0.0.42 2026-07-09 Natamam Değer Piyasa Satırları ve Yuvarlatılmış Eksik İmalat (Codex oturumu)

İnşaat seviyesi %100 olmayan taşınmazlarda Değerleme bölümü piyasa değeri satırları tamamlanmış değer/natamam değer ayrımını gösterecek şekilde genişletildi.

Yapılanlar:
- İnşaat seviyesi %100 değilse `Piyasa Değeri` bölümündeki ana satır adları `Tamamlanması Durumunda ...` formatına döner.
- `Yasal Durum Değeri` altına `Natamam Yasal Durum Değeri`, `Mevcut Durum Değeri` altına `Natamam Mevcut Durum Değeri` otomatik hesap satırları eklendi.
- Natamam satırlar, Açıklamalar bölümündeki eksik imalat hesabıyla aynı hesap motorunu kullanır.
- Açıklamalar bölümündeki natamam tabloda `Eksik İmalat Hesabı` sütunu kaldırıldı.
- Yerine `Yuvarlatılmış Eksik İmalat` sütunu eklendi; eksik imalat tutarı 50.000 TL adımıyla yuvarlanarak gösterilir.

Yedek:
`backups/before-incomplete-value-market-rows_2026-07-09_01-26-52`

Servis sürümü:
`app.js?v=20260709-0127`, `styles.css?v=20260709-0127`

---

## 0.0.41 2026-07-09 Eksik İmalat ve Natamam Durum Değeri Tablosu (Codex oturumu)

İnşaat seviyesi %60 ve üzeri, %100 altı olan taşınmazlarda eksik imalat tutarı ve natamam durum değeri Açıklamalar bölümünde tablo olarak gösterilecek şekilde geliştirildi.

Yapılanlar:
- `14 - Açıklamalar` bölümünde `Değerleme Özet Tablosu` altına `Eksik İmalat ve Natamam Durum Değeri` tablosu eklendi.
- Tablo yalnızca piyasa değeri, alan, yapı birim değeri ve %60-99 arası inşaat seviyesi bulunduğunda görünür.
- Eksik imalat hesabı `Alan × Yapı Birim Değeri × (1 - İnşaat Seviyesi)` olarak yapıldı.
- Natamam durum değeri `Piyasa Değeri - Eksik İmalat Tutarı` ile hesaplanır ve mevcut 50.000 TL yuvarlama kuralı uygulanır.
- Yasal ve mevcut değerler ayrı satırlarda hesaplanır.

Yedek:
`backups/before-incomplete-construction-value-table_2026-07-09_01-12-11`

Servis sürümü:
`app.js?v=20260709-0112`, `styles.css?v=20260709-0112`

---

## 0.0.40 2026-07-09 Sabit Sol Menü ve Sağ Alan Kaydırma (Codex oturumu)

Kullanıcı browser anotasyonu doğrultusunda masaüstü yerleşimde sol `Bölümler` panelinin sayfa ile birlikte akması engellendi.

Yapılanlar:
- Masaüstünde `.app-shell` viewport yüksekliğine sabitlendi ve dış sayfa kaydırması kapatıldı.
- Sağdaki `.workspace` kendi içinde dikey kayacak şekilde ayarlandı; sol sidebar sabit kaldı.
- Sol menüdeki `.section-nav` kendi iç kaydırmasını korur; mobil `max-width: 820px` davranışına dokunulmadı.

Yedek:
`backups/before-fixed-sidebar-workspace-scroll_2026-07-09_00-42-23`

Servis sürümü:
`app.js?v=20260709-0042`, `styles.css?v=20260709-0042`

---

## 0.0.39 2026-07-09 Değerleme Tablo Çerçevesi ve Birim Değeri Başlığı (Codex oturumu)

Kullanıcı browser anotasyonları doğrultusunda `11 - Değerleme` tablolarında görsel ve metinsel küçük revizyon yapıldı.

Yapılanlar:
- Kat bazında hesaplama tablosundaki `Piyasa m² Birim Fiyat` başlığı `Piyasa m² Birim Değeri` olarak değiştirildi.
- Aynı detay tablonun `14 - Açıklamalar` bölümündeki eş başlığı da tutarlılık için güncellendi.
- Değerleme tablolarını saran `.valuation-table-wrap` çerçevesi `1px` yerine `2px` yapıldı.

Yedek:
`backups/before-valuation-table-border-label_2026-07-09_00-32-09`

Servis sürümü:
`app.js?v=20260709-0034`, `styles.css?v=20260709-0034`

---

## 0.0.38 2026-07-09 Kullanıcı Yakın Çevre Noktaları 1000 m Filtresi (Codex oturumu)

`Adres ve Konum` bölümündeki kullanıcı tarafından eklenen yakın çevre noktaları artık konu taşınmaz merkezine göre yalnızca **1000 metre yarıçap** içinde gösterilir/seçime dahil edilir.

Yapılanlar:
- `userNearbyRadiusMeters = 1000` sabiti eklendi.
- `getUserNearbyPlaces()` artık `category === "user"` noktalarını 1000 m mesafe filtresinden geçirir.
- `Kullanıcı Noktalarını Getir` otomatik seçiminde 1000 m dışındaki kullanıcı noktaları seçili listeye eklenmez.
- Yakın çevre seçim başlığındaki `X öğe seçili` sayısı artık ham `selectedIds` yerine ekranda görünen filtreli liste içindeki seçili öğeleri sayar.
- Kayıtlı kullanıcı noktaları silinmez; sadece Adres/Konum yakın çevre çıktısına girerken filtrelenir.

Yedek:
`backups/before-user-poi-1000m-filter_2026-07-09_00-23-21`

Servis sürümü:
`app.js?v=20260709-0025`, `styles.css?v=20260709-0025`

---

## 0.0.37 2026-07-08 EKB ve Adres Kodu: OCR Kaldırıldı, Yalnız PDF Metin Katmanı (Opus oturumu)

Kullanıcı iOS'ta yükleme hataları alması üzerine **EKB ve Adres Kodu akışlarından
OCR mantığının tamamen kaldırılmasını, yalnızca PDF'ten okunmasını** istedi.

### Yapılanlar

- Yeni `readPdfTextLayerOnly(file)`: yalnızca pdf.js metin katmanını okur —
  **OCR yok, sunucu tarafı (python `/api/pdf-text`) çağrısı yok.** iOS'ta
  `loadPdfDocument` worker'sız modda çalışır.
- `readAddressFileText`: yalnız PDF kabul eder; metin katmanı boşsa
  `"Adres kodu PDF'inde metin katmanı bulunamadı..."` hatası. Görsel yüklenirse
  `"...OCR kaldırıldı; lütfen metin katmanlı PDF yükleyin."`
- `readEkbFileText`: koordinatlı pdf.js okuması (`readCoordinatePdfText` — OCR
  değildir) + düz metin katmanı; görsel reddedilir.
- Yükleme kartları: `Adres Kodu PDF / Görsel` → **`Adres Kodu PDF`**,
  `EKB PDF / Görsel` → **`EKB PDF`**; `accept` yalnız `.pdf`; ipuçları güncellendi.
- **Kapsam dışı (dokunulmadı):** TAKBİS OCR yedeği, İmar OCR akışı
  (`E-İmar PDF / Görsel`) ve `/api/pdf-text` sunucu ucu (İmar iOS yolu hâlâ kullanır).

### Doğrulama

- `test-inputs/adres.pdf` → Bursa / Yıldırım / Millet Mahallesi / 16370 ✓
- `test-inputs/ekb.pdf` → belge no Y2216FF6C56C5, enerji sınıfı C, geçerlilik 15.03.2029 ✓
- Ağ kaydında `/api/pdf-text` veya tesseract çağrısı YOK; konsol hatasız.
- Görsel yüklemede iki akışta da yeni Türkçe hata mesajı ✓
- Tüm node testleri temiz. Yedek: `backups/before-ekb-address-pdf-only_2026-07-08_21-50-05`

---

## 0.0.36 2026-07-08 Adres PDF "spawn python.exe" Hatası Düzeltmesi (Opus oturumu)

Kullanıcının iPhone ekran görüntüsünde Adres Kodu PDF kartında kırmızı
`spawn .cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`
hatası görüldü. iOS saha modunda (`shouldUsePdfTextOnlyMode`) PDF metni
`/api/pdf-text` üzerinden **sunucuda Python ile** okunur; iki kök neden vardı:

1. `server.js > findPythonExecutable` Python yolunu `process.env.USERPROFILE`
   ile kuruyordu. Sunucu süreci USERPROFILE göremediğinde (ör. .bat/servis
   ortamı) yol **göreli** (`.cache/...`) kalıyor, spawn ENOENT veriyordu —
   hatadaki önek eksikliği bunun kanıtı.
2. Tek adaya bağlıydı ve ham spawn hatası doğrudan kullanıcı arayüzüne düşüyordu.

### Düzeltmeler

- **server.js:** `getPythonCandidates()` — öncelik sırasıyla:
  1. `RAPOR_PYTHON` ortam değişkeni (elle yol belirtme imkanı),
  2. `os.homedir()` tabanlı **mutlak** codex-primary-runtime python yolu (existsSync kontrolüyle),
  3. `~/.cache/codex-runtimes/*/...` altındaki diğer runtime kopyaları (`.previous-*` dahil),
  4. PATH üzerindeki `py` ve `python`.
  `runPdfTextExtractor` adayları sırayla dener (spawn ENOENT → sıradaki;
  Python çalışıp hata verirse gerçek hata bildirilir). Hiçbiri yoksa Türkçe,
  yol gösteren hata döner: "PDF metin okuyucu (Python) sunucuda bulunamadı...".
- **app.js:** `readPdfText` iOS modunda sunucu okuması başarısız olursa artık
  **tarayıcı içi (worker'sız) metin katmanı okumaya düşer**
  (`readPdfTextInBrowser` olarak ayrıştırıldı); metin katmanı da boşsa sunucu
  hatası bildirilir. OCR iOS'ta kapalı kalır.

### Doğrulama (canlı sunucu + curl ile 3 senaryo)

1. Bozuk `RAPOR_PYTHON` → aday atlandı, codex python kullanıldı → `ok:true`, gerçek TAKBİS metni ✓
2. Ulaşılmaz home (ekran görüntüsündeki senaryo) → PATH python'a düştü → `ok:true` ✓
3. Boş PATH + ulaşılmaz home → ham spawn hatası yerine **zarif Türkçe hata** ✓
- Tüm node testleri temiz (check-basic, takbis, halkbank, value-factors, comparable).

**ÖNEMLİ:** `server.js` değişti — kullanıcının 5173'teki sunucusunun
**yeniden başlatılması** gerekir (Ctrl+F5 yetmez; .bat'ı kapatıp açın).

Yedek: `backups/before-pdf-text-python-fix_2026-07-08_21-09-08`

---

## 0.0.35 2026-07-08 Dışarıdan Ekspertiz Randevu Seçimi ve Tanıma Düzeltmesi (Codex oturumu)

Kullanıcı testinde `Randevu Türü = Dışarıdan ekspertiz` seçildiğinde `Değerleme Yöntemi Açıklaması` paragrafının gelmediği görüldü.

Kök neden:
- `appointmentType` özel select kontrolü yalnızca `input` olayını dinliyordu.
- Select değişimi bazı tarayıcı/etkileşimlerde `change` olayıyla geldiğinde `state.fields.appointmentType` güncellenmiyor, dolayısıyla dışarıdan ekspertiz paragrafı üretilmiyordu.
- Ek izleme testinde seçim state'e yazıldığı halde paragrafın yine gelmediği görüldü; ikinci kök neden `isExternalAppointmentType` fonksiyonunun Türkçe `Dışarıdan` değerini yalnızca `disar` ile yakalamaya çalışmasıydı.

Düzeltme:
- Randevu türü değişim mantığı ortak `handleAppointmentTypeChange` fonksiyonuna alındı.
- Aynı handler hem `input` hem `change` olayına bağlandı.
- `input` sonrası gelen ikinci `change` olayında aynı değer tekrar işlenmesin diye koruma eklendi.
- `isExternalAppointmentType`, `dışarı`, `disari` ve `disar` varyasyonlarını tanıyacak şekilde dayanıklı hale getirildi.

Yedek:
`backups/before-appointment-change-event-fix_2026-07-08_18-01-38`

Servis sürümü:
`app.js?v=20260708-1810`, `styles.css?v=20260708-1810`

---

## 0.0.34 2026-07-08 Dışarıdan Ekspertiz Değerleme Açıklaması (Codex oturumu)

`Randevu Türü = Dışarıdan ekspertiz` seçildiğinde `11 - Değerleme > Değerleme Yöntemi Açıklaması` içine ilk paragraftan sonra otomatik dışarıdan ekspertiz paragrafı eklendi.

Davranış:
- Paragraf `externalAppraisalReason` değerini sebep olarak kullanır; sebep `Diğer` ise `externalAppraisalOtherNote` kullanılır.
- `projectInstitution` değeri makrodaki `ProjeKurum` yerine kullanılır.
- Metin taşınmazın dışarıdan ekspertiz yapıldığını, alan ve mimari/proje uygunluğunun yerinde kontrol edilemediğini, proje ile uygun kabul edildiğini ve iç hacim özelliklerinin vasat kabulüyle değerleme yapıldığını belirtir.
- `appointmentType`, dışarıdan ekspertiz sebebi veya `projectInstitution` değiştiğinde Değerleme Yöntemi Açıklaması canlı yenilenir.

Yedek:
`backups/before-external-appraisal-valuation-note_2026-07-08_17-55-54`

Servis sürümü:
`app.js?v=20260708-1800`, `styles.css?v=20260708-1800`

---

## 0.0.33 2026-07-08 Mevcut Kullanım İfade Revizyonu (Codex oturumu)

`Değerleme Yöntemi Açıklaması` içindeki yasal/mevcut kullanım niteliği farkı paragrafında ifade revize edildi.

Değişiklik:
- `Mevcut Kullanım Niteliği "Y" nitelikli olduğu gözlemlenmiştir.`
- yerine `Mevcut Kullanımı "Y" nitelikli olduğu gözlemlenmiştir.` yazılır.

Yedek:
`backups/before-current-usage-wording-fix_2026-07-08_17-47-29`

Servis sürümü:
`app.js?v=20260708-1748`, `styles.css?v=20260708-1748`

---

## 0.0.32 2026-07-08 Yasal/Mevcut Kullanım Niteliği Farkı Değerleme Açıklaması (Codex oturumu)

`Yasal/Mevcut Kullanım Türü Arasında Fark Var Mı?` işaretliyse `11 - Değerleme > Değerleme Yöntemi Açıklaması` içine otomatik nitelik farkı paragrafı eklendi.

Davranış:
- Önce `Ekspertize konu taşınmaz Tapu Kayıtlarına göre "X" Nitelikli olup, Mevcut Kullanım Niteliği "Y" nitelikli olduğu gözlemlenmiştir.` cümlesi yazılır.
- `legalValueUnit` ve `currentValueUnit` arasındaki fark yasal m2 birim değere göre %10'dan azsa bölgede birim değer farkı bulunmadığına dair matbu cümle eklenir.
- Fark %10 ve üzerindeyse yasal değer için X nitelikli, mevcut değer için Y nitelikli gayrimenkullerin araştırıldığı cümlesi eklenir.
- `legalUsageNature`, `currentUsageNature`, `usageNatureDifference` veya değerleme m2 birim değerleri değiştiğinde açıklama canlı yenilenir.

Yedek:
`backups/before-usage-nature-difference-valuation-note_2026-07-08_17-41-45`

Servis sürümü:
`app.js?v=20260708-1742`, `styles.css?v=20260708-1742`

---

## 0.0.31 2026-07-08 Kat Bazında Hesaplama Etkili Alan Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` açıklamasına toplam indirgenmiş alan özeti eklendi.

Davranış:
- `Kat bazında uygulanan indirgeme oranları rapor ekinde tablo halinde tarafınıza sunulmuştur.` cümlesinden hemen önce alan özeti yazılır.
- Yasal ve mevcut indirgenmiş alan eşitse: `Konu taşınmazın yasal ve mevcut etkili alana indirgenmiş alanı X m² olarak hesaplanmıştır.`
- Yasal ve mevcut indirgenmiş alan farklıysa: `Konu taşınmazın yasal etkili alana indirgenmiş alanı X m², mevcut etkili alana indirgenmiş alanı Y m² olarak hesaplanmıştır.`
- Alanlar `calculateReducedUnitFloorTotal` ile, kat alanı + teras indirgeme oranları dahil edilerek hesaplanır.

Yedek:
`backups/before-floor-calculation-effective-area-note_2026-07-08_17-21-44`

Servis sürümü:
`app.js?v=20260708-1722`, `styles.css?v=20260708-1722`

---

## 0.0.30 2026-07-08 İnşaat Seviyesi Değerleme Yöntemi Risk Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Değerleme Yöntemi Açıklaması` metnine inşaat seviyesi %100 değilse otomatik ikinci paragraf eklendi.

Davranış:
- `İnşaat Seviye` değeri `%80`, `80`, `0,8` veya `0.8` formatlarında okunur.
- Boş, geçersiz veya `0` değerler Excel makro mantığına uygun olarak %100 kabul edilir.
- Seviye %100 altındaysa mevcut değerleme yöntemi açıklamasının altına tamamlanamama/yasal prosedür risk açıklaması eklenir.
- `İnşaat Seviye` alanı değiştirilince Değerleme ekranındaki açıklama canlı yenilenir.

Yedek:
`backups/before-construction-level-valuation-note_2026-07-08_17-08-34`

Servis sürümü:
`app.js?v=20260708-1710`, `styles.css?v=20260708-1710`

---

## 0.0.29 2026-07-08 Çatı Katı Kat Adedi Yazımı Düzeltmesi (Codex oturumu)

`Ana Gayrimenkul Kat Adedi` otomatik metninde `Çatı katı` seçimi `ÇATII` olarak görünüyordu. Kat kompozisyonundan `kat/katı` eki temizlenirken Türkçe `ı` harfinin geride kalmaması sağlandı.

Servis sürümü:
`app.js?v=20260708-1648`, `styles.css?v=20260708-1648`

---

## 0.0.28 2026-07-08 Ana Gayrimenkul Kat Adedi Alanı (Codex oturumu)

`8 - Ana Gayrimenkul Özellikleri` bölümünde `Ana Gayrimenkul Açıklaması` alanının üstüne `Ana Gayrimenkul Kat Adedi` alanı eklendi.

Davranış:
- Alan Türkçe büyük harf formatında tutulur.
- Örnek format: `BODRUM + ZEMİN + 5 NORMAL`.
- Kat dağılımı adetleri kaydedildiğinde alan otomatik hesaplanan kat kompozisyonundan yenilenir.
- Kullanıcı alanı manuel düzenlerse giriş anında büyük harfe çevrilir.
- Placeholder/metin kaynak listesine `Ana Gayrimenkul Kat Adedi` olarak eklendi.

Yedek:
`backups/before-main-property-floor-count-text_2026-07-08_16-44-43`

Servis sürümü:
`app.js?v=20260708-1645`, `styles.css?v=20260708-1645`

---

## 0.0.27 2026-07-08 Kat Bazında Hesaplama Açıklama Revizyonu (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` açıklaması kullanıcı görsel notlarına göre güncellendi.

Davranış:
- Açıklamadaki `indirgeme oranı %100 olan` ara ifadesi kaldırıldı.
- İndirgenen katlar artık oranlarıyla birlikte yazılır: ör. `Asma kat alanı %30 oranında, 1. Normal kat alanı %30 oranında ... indirgenmiştir.`
- Teras cümlesindeki `Teras alanı/alanları` ifadesi `Teras Alanları` olarak sadeleştirildi.

Yedek:
`backups/before-floor-intro-rate-details_2026-07-08_16-33-48`

Servis sürümü:
`app.js?v=20260708-1634`, `styles.css?v=20260708-1634`

---

## 0.0.26 2026-07-08 Kat Bazında Hesaplama Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` üstüne otomatik açıklama paragrafı eklendi.

Davranış:
- Açıklama yalnızca tablo gösteriliyorsa ve birden fazla kat/alan satırı varsa oluşturulur.
- `İndirgeme Oranı %100` olan kat/katlar etkili alan referansı kabul edilir.
- Diğer katlar, etkili alan referans kat seviyesine indirgenmiş olarak metne yazılır.
- Yasal veya mevcut teras alanı varsa terasların kapalı kullanım alanına dahil edilmediğini ve şerefiye unsuru olarak dikkate alındığını belirten cümle eklenir.
- Tablo gizleme kuralı korunur: toplam yasal/mevcut kullanım alanları toplam indirgenmiş alanlara eşitse Değerleme bölümündeki kat bazında tablo görünmez.

Yedek:
`backups/before-floor-valuation-intro_2026-07-08_16-23-50`

Servis sürümü:
`app.js?v=20260708-1624`, `styles.css?v=20260708-1624`

---

## 0.0.25 2026-07-08 Lacivert–Beyaz Yeniden Tasarım (Opus + taste-skill/redesign)

Kullanıcı isteğiyle uygulamanın tüm renk teması **lacivert–beyaz ağırlıklı** hale
getirildi (önceki yeşil marka teması → lacivert). `taste-skill:redesign-skill`
yöntemiyle: mevcut vanilla CSS korundu, **sınıf adı / DOM / JS mantığı
değiştirilmedi**, işlevsellik her adımda test edildi.

### Yedek

`backups/before-navy-white-redesign_2026-07-08_11-18-49`

### Yaklaşım — token yeniden yönlendirme (düşük risk)

Marka rengi token adları geçmişten `--green*` olarak kalıyor **fakat değerleri
artık lacivert**. ~40 CSS kuralı `var(--green)/var(--green-soft)/...` kullandığı
için tema tek noktadan (`:root`) çevrildi. Yeni palet (`styles.css` başı):

| Token | Eski (yeşil) | Yeni (lacivert) |
|---|---|---|
| `--green` (birincil marka) | #0f7a5e | **#213f77** |
| `--green-bright` | #12967a | **#2d59ab** |
| `--green-strong` | #0a5c47 | **#172c56** |
| `--green-soft` | #d9efe6 | **#dde7f6** |
| `--sidebar-ink` | #16222b | **#111d3d** |
| `--bg` | #f2f5f3 | **#f3f6fc** (soğuk beyaz) |
| `--ink` | #17232c | **#152238** |
| `--gold` (aksan) | #f1c66b | **#d7b26a** (kısıtlı) |
| `--ring` | yeşil rgba | **rgba(45,89,171,.25)** |

Palet desatüre lacivert (HSL sat ~%57 < %80, redesign-skill kuralı). Hafif
**altın aksan** yalnızca marka kutusu, aktif nav çubuğu ve durum-kartı şeridinde
tutuldu (klasik lacivert+altın bankacılık/değerleme paleti).

### Değişen sabit (hardcoded) değerler

- `styles.css`: özet kartı zeminleri `#f8faf9→#f6f8fd`, tablo başlıkları
  `#eef4f1→#eaf0fa`, kenar çubuğu degradesi (mavi-gri→lacivert), buton/nav
  gölgeleri yeşil rgba→lacivert rgba, gövde radyal zemini, `::selection`, hover
  kenar renkleri, kaydırma çubuğu grileri (soğutuldu), `.nearby-map-label`
  (harita etiketi) lacivert.
- **Korunan semantik renkler:** `.sync-dot` yeşil (başarı göstergesi),
  `.subject-map-label` kırmızı (harita ana taşınmaz işareti), `--red` uyarılar.
- `app.js` Word/PDF export CSS'i de temayla uyumlandı: `h2` başlık çizgisi
  `#176c54→#213f77`, `.word-table` başlık/çizgili satır tonları lacivert.
- `index.html`: `theme-color` meta `#16222b→#111d3d` (Android adres çubuğu).

### Doğrulama

- Bundled node: `--check app.js` + `tools/check-basic.js` + takbis/halkbank/
  value-factors/comparable testlerinin tümü temiz.
- Claude_Preview: 1440×900 / 768×1024 / 375×812 ekran görüntüleriyle doğrulandı —
  lacivert kenar çubuğu, lacivert birincil buton + altın marka, soğuk beyaz
  yüzeyler, lacivert alt-nav aktif pill. Yatay taşma yok, konsol hatasız.
- İşlevsel: bölüm geçişi + `.section-enter` yalnız geçişte; textarea →
  `saveState()` → localStorage kaydı ✓.
- Önceki oturumun modern tema katmanı (geçişler, cam efektleri, dokunma
  hedefleri, `prefers-reduced-motion`) korundu; yalnız palet lacivere çevrildi.

---

## 0.0.24 2026-07-08 Açıklamalar Temel Metin Alanları Kaldırıldı (Codex oturumu)

`14 - Açıklamalar` bölümündeki manuel temel açıklama alanları sadeleştirildi.

Kaldırılan alanlar:
- `Takyidat Açıklaması`
- `İmar Açıklaması`
- `Belge / Proje Açıklaması`
- `Genel Açıklama`

Teknik not:
- Alanlar yalnızca `explanations.fields` form listesinden çıkarıldı.
- Otomatik üretilen takyidat/imar/belge panelleri ve placeholder akışları korunur.
- Cache-buster `app.js?v=20260708-1022`, `styles.css?v=20260708-1022` olarak yenilendi.

Yedek alındı:
`backups/before-remove-explanations-basic-textareas_2026-07-08_10-19-52`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.23 2026-07-08 Değerleme Satış Kabiliyeti Açıklaması (Codex oturumu)

Değerleme bölümünde `Değerleme Yöntemi Açıklaması` ile `Kira Açıklaması` arasına
otomatik `Satış Kabiliyeti Açıklaması` kartı eklendi.

Teknik not:
- `Satılabilir` seçildiğinde matbu olumlu satış kabiliyeti cümlesi üretilir.
- `Alıcısı Az`, `Satışı Güç` veya `Satılamaz` seçildiğinde kullanıcının modalda
  girdiği açıklama metni, sonuç cümlesiyle birlikte kullanılır.
- Kart kopyalanabilir ve satış kabiliyeti / açıklama değiştiğinde canlı güncellenir.
- Cache-buster `app.js?v=20260708-1015`, `styles.css?v=20260708-1015` olarak yenilendi.

Yedek alındı:
`backups/before-valuation-saleability-explanation_2026-07-08_10-11-47`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.22 2026-07-08 Değerleme Kira Açıklaması (Codex oturumu)

Değerleme bölümünde `Değerleme Yöntemi Açıklaması` kartının altına otomatik
`Kira Açıklaması` kartı eklendi.

Teknik not:
- `legalRent` ve `currentRent` eşitse metin tek cümlede yasal/mevcut kira değerini
  birlikte yazar.
- Değerler farklıysa yasal kira ve mevcut kira ayrı ayrı yazılır.
- Kira değerlerinden yalnızca biri varsa ilgili tek değer için açıklama üretir.
- Kira açıklaması değerleme hesapları yenilendiğinde canlı güncellenir ve kopyalanabilir.
- Cache-buster `app.js?v=20260708-0951`, `styles.css?v=20260708-0951` olarak yenilendi.

Yedek alındı:
`backups/before-valuation-rent-explanation_2026-07-08_09-48-20`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.21 2026-07-08 Değerleme Kat Tablosu Detaylı Tabloyla Değiştirildi (Codex oturumu)

Değerleme bölümündeki eski `Kat Bazında Hesaplama Tablosu`, Açıklamalar bölümünde
oluşturulan detaylı kat bazında indirgenmiş alan / piyasa / kira tablosu düzeniyle
değiştirildi.

Teknik not:
- `createWorkplaceFloorCalculationTable` artık 9 sütunlu detaylı tabloyu üretir:
  normal alan, indirgeme oranı, indirgenmiş alan, piyasa m² birim fiyat, piyasa değeri,
  kira m² birim ve piyasa kira değeri.
- Yasal/mevcut bloklar `createExplanationsFloorValuationSectionRows` üzerinden ortak
  satır mantığını kullanır.
- Kullanım niteliği filtresi yoktur; `shouldShowWorkplaceFloorCalculationTable` yalnızca
  `!shouldHideWorkplaceFloorCalculationTableByEqualAreas()` kuralına bağlı kalır.
- Yani konut dahil tüm niteliklerde, brüt toplam yasal/mevcut alanlar indirgenmiş
  toplamlarla aynıysa tablo Değerleme bölümünde gizlenir; fark varsa görünür.
- Cache-buster `app.js?v=20260708-0943`, `styles.css?v=20260708-0943` olarak yenilendi.

Yedek alındı:
`backups/before-replace-valuation-floor-table-with-detailed_2026-07-08_09-40-31`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.20 2026-07-08 Açıklamalar Kat Tablosu Piyasa ve Kira Sütunları (Codex oturumu)

`Açıklamalar` bölümündeki `Kat Bazında İndirgenmiş Alan Tablosu` genişletildi.

Teknik not:
- Tabloya `Piyasa m² Birim Fiyat`, `Piyasa Değeri`, `Kira m² Birim` ve
  `Piyasa Kira Değeri` sütunları eklendi.
- Yasal blok `legalValue` / `legalRent`, mevcut blok `currentValue` / `currentRent`
  alanlarından beslenir.
- m² birim fiyat ve m² kira değerleri ilgili bloktaki toplam indirgenmiş alana göre
  otomatik hesaplanır.
- Cache-buster `app.js?v=20260708-0938`, `styles.css?v=20260708-0938` olarak yenilendi.

Yedek alındı:
`backups/before-explanations-floor-table-market-rent-columns_2026-07-08_09-35-24`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.19 2026-07-08 Açıklamalar Kat Bazında İndirgenmiş Alan Tablosu (Codex oturumu)

`Açıklamalar` bölümüne daha detaylı `Kat Bazında İndirgenmiş Alan Tablosu`
eklendi. Tablo, bağımsız bölüm kat satırlarından otomatik beslenir.

Teknik not:
- Tablo `Değerleme Özet Tablosu` sonrasında, `Değerleme Yöntemleri Hesap Açıklaması`
  öncesinde görünür.
- Yasal ve mevcut durum için ayrı blok oluşturulur.
- Her kat satırında normal alan, indirgeme oranı ve indirgenmiş alan gösterilir.
- Teras alanı varsa ilgili blokta en alt satırda `Teras Alanı` olarak toplam normal
  alan, ağırlıklı indirgeme oranı ve indirgenmiş alan gösterilir.
- En sonda `Toplam İndirgenmiş Alan` satırı bulunur.
- Cache-buster `app.js?v=20260708-0930`, `styles.css?v=20260708-0930` olarak yenilendi.

Yedek alındı:
`backups/before-explanations-floor-valuation-table_2026-07-08_09-24-58`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.18 2026-07-08 Bölüm Üst Başlıkları Kaldırıldı (Codex oturumu)

Kullanıcıya web ve mobilde daha geniş çalışma alanı vermek için bölüm kartlarının
üstündeki başlık/açıklama/rozet bloğu kaldırıldı.

Teknik not:
- `renderSection` artık her bölümde `section-head` üretmez; kart doğrudan `section-body` ile başlar.
- Sol menüdeki bölüm adları ve rozetleri korunur, yalnızca içerik alanındaki tekrar eden üst başlık gizlenir.
- Cache-buster `app.js?v=20260708-0915`, `styles.css?v=20260708-0915` olarak yenilendi.
- `tools/check-basic.js` içine üst başlıkların tekrar dönmesini yakalayan kontrol eklendi.

Yedek alındı:
`backups/before-remove-section-headers_2026-07-08_09-13-31`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.17 2026-07-08 Dosya Yükleme Kartları Neomorfik Tasarım (Codex oturumu)

`Dosya ve Rapor` bölümündeki dosya yükleme kartları referans görseldeki yumuşak
neomorfik yaklaşıma göre modernize edildi.

Teknik not:
- `upload-grid` masaüstünde 3 kolonlu kart düzenine çıkarıldı.
- `upload-card` dashed eski görünümden yumuşak gölgeli, merkez ikonlu kart yüzeyine dönüştürüldü.
- Kartlarda CSS `::before` ile dosya ikonu, `::after` ile aksiyon etiketi eklendi.
- Tablet/mobil için 2 kolon ve 1 kolon responsive kuralları eklendi.
- HTML ve veri akışı korunarak yalnızca CSS sunum katmanı değiştirildi.
- Cache-buster `app.js?v=20260708-0901`, `styles.css?v=20260708-0901` olarak yenilendi.

Yedek alındı:
`backups/before-upload-panel-neomorphic-redesign_2026-07-08_08-54-38`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.16 2026-07-08 Kat Tablosu Kullanım Niteliği Filtresi Kaldırıldı (Codex oturumu)

Değerleme bölümündeki `Kat Bazında Hesaplama Tablosu` artık yalnızca
`Yasal Kullanım Niteliği = İşyeri` koşuluna bağlı değildir. Konut dahil tüm
kullanım niteliklerinde aynı alan kuralı uygulanır:

- Brüt/toplam yasal ve mevcut kullanım alanları indirgenmiş toplamlarla aynıysa tablo gizlenir.
- Herhangi bir fark varsa tablo gösterilir.

Teknik not:
- `shouldShowWorkplaceFloorCalculationTable` artık sadece
  `!shouldHideWorkplaceFloorCalculationTableByEqualAreas()` döndürür.
- `shouldShowWorkplaceFrontageDepthFields` yalnızca işyeri cephe/derinlik alanları için korunur.
- Tablo açıklamasındaki `İşyeri nitelikli...` metni genel hale getirildi.
- Cache-buster `app.js?v=20260708-0843`, `styles.css?v=20260708-0843` olarak yenilendi.

Yedek alındı:
`backups/before-floor-table-remove-usage-limit_2026-07-08_08-37-53`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.15 2026-07-08 İşyeri Kat Tablosu Eşit Alan Gizleme Kuralı (Codex oturumu)

`Yasal Kullanım Niteliği = İşyeri` olsa bile Değerleme bölümündeki
`Kat Bazında Hesaplama Tablosu` artık şu durumda gizlenir:

`Toplam Yasal Kullanım Alanı = İndirgenmiş Toplam Yasal Alan`
ve
`Toplam Mevcut Kullanım Alanı = İndirgenmiş Toplam Mevcut Alan`

Bu durumda `Piyasa Değeri` tablosu tek başına yeterli kabul edilir.

Teknik not:
- `shouldShowWorkplaceFloorCalculationTable` görünürlüğü artık eşit alan kontrolüne de bağlıdır.
- `shouldHideWorkplaceFloorCalculationTableByEqualAreas` brüt toplamları `getValuationUnitAreaTotals`,
  indirgenmiş toplamları `calculateReducedUnitFloorTotal` üzerinden karşılaştırır.
- Sayısal karşılaştırmada format farkları için küçük tolerans kullanılır (`areValuationAreasEqual`).
- Cache-buster `app.js?v=20260708-0837`, `styles.css?v=20260708-0837` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-table-hide-when-equal_2026-07-08_08-30-24`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.14 2026-07-07 Modern Ön Yüz Yenilemesi — iOS/Android/Windows (Opus oturumu)

Kullanıcı isteğiyle uygulamanın görsel teması modernize edildi; iOS, Android ve
Windows (masaüstü) için platform cilası ve akıcı geçişler eklendi. **Hiçbir sınıf
adı, DOM yapısı veya veri akışı değiştirilmedi** — değişiklik token + CSS katmanı
+ 2 küçük app.js kancası düzeyindedir.

### Yedek

`backups/before-frontend-redesign_2026-07-07_23-02-42` (index.html, styles.css,
app.js, server.js, tools/check-basic.js)

### Yapılanlar

1. **Design token yenilemesi (`styles.css` başındaki `:root`)**
   - Palet derinleştirildi: `--green: #0f7a5e`, yeni `--green-strong/--green-bright/--gold/--sidebar-ink`.
   - Yeni token'lar: `--radius-s/m/l`, `--shadow-1/2`, `--ring` (odak halkası),
     `--ease-out`, `--speed/--speed-fast`. Eski token adlarının tümü korundu.

2. **MODERN TEMA KATMANI (`styles.css` sonunda ~380 satırlık blok)** — dosyanın
   SONUNDA kalmalı; aynı özgüllükteki eski kuralları kaynak sırasıyla ezer:
   - Gövde: köşelerden yeşil/altın radyal degrade zemin, antialiasing, `::selection`.
   - **Windows**: ince yuvarlak kaydırma çubukları (`scrollbar-width: thin` + webkit).
   - **Erişilebilirlik**: buton/bağlantılarda `:focus-visible` halkası; girişlerde
     odakta yeşil halka + kenar geçişi.
   - **Butonlar**: primary'de yeşil degrade + hover'da kalkış/gölge, `:active`
     bastırma (scale 0.98); hover etkileri yalnızca `@media (hover: hover)`.
   - **Kenar çubuğu**: koyu degrade, altın degrade marka kutusu, aktif bölümde
     yeşil degrade + solda altın çubuk (`.nav-button.is-active::before`).
   - **Bölüm kartı**: 14px radius, katmanlı gölge, başlıkta soldan yeşil aksan
     çizgisi ve açık degrade; durum kartlarında üstte yeşil→altın şerit + hover kalkışı.
   - **Tablolar**: satır hover vurgusu (yalnızca hover destekli cihazlarda).
   - **Modallar**: bulanık arka plan (backdrop-filter), yukarı kayarak açılma animasyonu.
   - **Alt gezinme (mobil)**: cam efekti (blur+saturate), aktif sekmede yeşil
     degrade pill + yukarı kalkış; mobil üst bar cam efekti.
   - **iOS/Android**: `viewport-fit=cover` + `env(safe-area-inset-*)` yatay güvenli
     alanlar; `@media (pointer: coarse)` altında 48px giriş yüksekliği ve **16px
     giriş fontu (iOS odak zoom'unu önler)**, 44-46px dokunma hedefleri;
     `touch-action: manipulation`, şeffaf tap-highlight.
   - **`prefers-reduced-motion: reduce`**: tüm animasyon/geçişler kapanır.

3. **Bölüm geçiş animasyonu (app.js — 2 küçük kanca)**
   - `pendingSectionEnterAnimation` bayrağı: `setActiveSection` bayrağı kaldırır,
     `renderSection` karta `.section-enter` sınıfını yalnızca bölüm değişiminde
     ekler → alan güncellemelerinin tetiklediği re-render'larda kart TİTREMEZ
     (doğrulandı: `render()` sonrası sınıf yok). Animasyon: 240ms fade + yukarı kayma.

4. **index.html meta**: `viewport-fit=cover`, `theme-color #16222b` (Android adres
   çubuğu), `mobile-web-app-capable`, iOS `black-translucent` durum çubuğu.

### Doğrulama

- Bundled node: `--check app.js` + `tools/check-basic.js` + takbis/halkbank/
  value-factors/comparable testlerinin tümü temiz.
- Claude_Preview: 1440×900 (Windows), 768×1024 (tablet) ve 375×812 (telefon)
  ekran görüntüleriyle doğrulandı; yatay taşma yok, konsol hatasız.
- Fonksiyonel: bölüm geçişi + `.section-enter` yalnız geçişte; textarea girişi →
  `saveState()` → localStorage kaydı ✓; Emsaller matrisi mobilde sorunsuz.
- Word/PDF çıktısı etkilenmez (çıktı renkleri app.js içinde sabittir, CSS
  token'larından okunmaz).

### Not

- `tools/check-basic.js` artık **hem** `app.js?v=...` **hem** `styles.css?v=...`
  sürümünü sabit doğruluyor (satır ~387-388); cache-buster artırınca ikisini de güncelleyin.

---

## 0.0.13 2026-07-07 İşyeri Kat Tablosu Birim Fiyat Düzeltmesi (Codex oturumu)

`Kat Bazında Hesaplama Tablosu` içindeki `Birim Fiyat (TL)` hesabı düzeltildi.
Artık Değerleme altındaki brüt alan bazlı `M2 Birim Değeri` alanından okunmaz.

Doğru hesap:

`Birim Fiyat = Piyasa Değeri / Toplam İndirgenmiş Alan`

Teknik not:
- `calculateWorkplaceFloorCalculationUnitValue` eklendi.
- `createWorkplaceFloorCalculationSectionRows` içinde `legalValueUnit/currentValueUnit` bağı kaldırıldı.
- Cache-buster `app.js?v=20260707-2247`, `styles.css?v=20260707-2247` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-table-unit-price-fix_2026-07-07_22-44-19`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.12 2026-07-07 İşyeri Kat Bazında Değerleme Tablosu (Codex oturumu)

`Yasal Kullanım Niteliği = İşyeri` olduğunda Değerleme bölümünde,
`Değerleme Yöntemi Açıklaması` ile `Piyasa Değeri` arasına
`Kat Bazında Hesaplama Tablosu` eklendi.

Tablo görsel referansa benzer şekilde yasal ve mevcut alanı ayrı bloklarda gösterir:

`Hesaplama | Katlar | Alan (m²) | Zemin Kata Etki Oranı | Etkili Alan (m²) | Birim Fiyat (TL) | Değer (TL)`

Teknik not:
- `createWorkplaceFloorCalculationTable` tabloyu oluşturur.
- `shouldShowWorkplaceFloorCalculationTable` yalnızca `İşyeri` niteliğinde görünürlüğü sağlar.
- Satır hesapları mevcut kat indirgeme mantığı olan `calculateReducedUnitFloorArea` / `calculateReducedUnitFloorTotal` ile uyumludur.
- Piyasa değeri veya birim fiyat değiştiğinde `refreshWorkplaceFloorCalculationTable` tabloyu canlı günceller.
- Cache-buster `app.js?v=20260707-2242`, `styles.css?v=20260707-2242` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-floor-valuation-table_2026-07-07_22-34-55`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.11 2026-07-07 Gabim Toplam İndirgenmiş Alanlar (Codex oturumu)

`Gabim Veri Seti > Bağımsız Bölüm / Taşınmaz Özellikleri` grubuna iki yeni satır eklendi:

`Zemin Kata İndirgenmiş Yasal Alan | Zemin Kata İndirgenmiş Mevcut Alan`

Bu değerler `Katlar, Alanlar ve İç Hacimler` bölümündeki tüm kat satırlarının toplam
indirgenmiş yasal/mevcut alanlarından hesaplanır. Etiket GABİM formatı gereği
`Zemin Kata İndirgenmiş...` olarak kalır, fakat hesap kaynağı toplam indirgenmiş alandır.

Teknik not:
- `gabimTotalReducedAreaText` yasal/mevcut toplam indirgenmiş alanı formatlar.
- `getGabimGroundFloorRows` filtresi kaldırıldı.
- Cache-buster `app.js?v=20260707-2220`, `styles.css?v=20260707-2220` olarak yenilendi.

Yedek alındı:
`backups/before-gabim-ground-reduced-areas_2026-07-07_22-13-07`
`backups/before-gabim-total-reduced-areas_2026-07-07_22-16-32`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.10 2026-07-07 İndirgenmiş Toplam Alan Özetleri (Codex oturumu)

`Katlar, Alanlar ve İç Hacimler` bölümüne iki salt-okunur özet alanı eklendi:

`İndirgenmiş Toplam Yasal Alan | İndirgenmiş Toplam Mevcut Alan`

Bu alanlar kat satırlarındaki `Yasal İnd. Kat Alanı` ve `Mevcut İnd. Kat Alanı`
değerlerini toplayarak canlı güncellenir.

Teknik not:
- `calculateReducedUnitFloorTotal` toplam hesabını mevcut satır hesabı olan `calculateReducedUnitFloorArea` üzerinden yapar.
- `createUnitFloorReducedTotalSummary` özet kutularını kat kartlarının üstüne ekler.
- Cache-buster `app.js?v=20260707-2206`, `styles.css?v=20260707-2206` olarak yenilendi.

Yedek alındı:
`backups/before-reduced-total-area-summary_2026-07-07_22-01-13`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.9 2026-07-07 İndirgeme Yüzde İşareti Düzeltmesi (Codex oturumu)

Kullanıcı geri bildirimiyle kat satırındaki `İnd. Oranı` yüzde işaretinin kutu dışına kaçması düzeltildi.
Yüzde eki artık kendi indirgeme oranı alanına sabitlenir.

Teknik not:
- `.unit-floor-card-head .has-field-suffix` için `position: relative` eklendi.
- Cache-buster `app.js?v=20260707-2156`, `styles.css?v=20260707-2156` olarak yenilendi.

Yedek alındı:
`backups/before-reduction-percent-inside-input_2026-07-07_21-53-21`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.8 2026-07-07 İndirgeme Oranı Sadeleştirme (Codex oturumu)

Kullanıcı geri bildirimiyle kat satırındaki fazla indirgeme oranları kaldırıldı.
Artık alanlar şu sıradadır:

`Kat | Yasal Alan | Mevcut Alan | İnd. Oranı | Yasal Teras | Mevcut Teras | İnd. Oranı | Yasal İnd. Kat Alanı | Mevcut İnd. Kat Alanı`

Teknik not:
- Alan indirgeme oranı tek alandır: `areaReductionRate`.
- Teras indirgeme oranı tek alandır: `terraceReductionRate`.
- Yasal ve mevcut alan hesapları aynı `areaReductionRate` ile indirgenir.
- Yasal ve mevcut teras hesapları aynı `terraceReductionRate` ile indirgenir.
- Eski `legalReductionRate/currentReductionRate/legalTerraceReductionRate/currentTerraceReductionRate`
  alanları yeni satır düzeninde kullanılmaz; eski tek satır verileri varsa `unitAreaReductionRate`
  ve `unitTerraceReductionRate` için geriye dönük yedek olarak okunur.

Yedek alındı:
`backups/before-shared-reduction-rates_2026-07-07_21-45-27`

Cache-buster: `app.js?v=20260707-2148`, `styles.css?v=20260707-2148`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.7 2026-07-07 İndirgeme Satırı Yerleşim Düzeltmesi (Codex oturumu)

Kullanıcı geri bildirimiyle kat alanı indirgeme alanlarının yerleşimi düzeltildi.
Üst satır artık tek satırlık kompakt grid olarak düzenlenir; `İç Hacimler` seçicisi ayrı alt
satıra taşındı. Hesap mantığı değiştirilmedi.

Teknik not:
- `createUnitFloorInteriorRows` içinde `unit-floor-card-interior-row` eklendi.
- `unit-floor-card-head` grid ölçüleri yeni 11 alan + sil butonu düzenine göre sıkılaştırıldı.
- Kart yatayda taşarsa `overflow-x: auto` ile tek satır korunur.
- Yüzde takısı için `has-field-suffix` sınıfı kullanıldı; `:has()` kullanılmadı.

Yedek alındı:
`backups/before-unit-reduction-layout-fix_2026-07-07_21-39-26`

Cache-buster: `app.js?v=20260707-2142`, `styles.css?v=20260707-2142`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.6 2026-07-07 Kat Alanı İndirgeme Oranları (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `Konut`, `Ofis`, `İşyeri` veya
`Ticari Bina` olduğunda **Bağımsız Bölüm Özellikleri > Katlar, Alanlar ve İç Hacimler**
satırlarında indirgeme alanları gösterilir:

- Yasal Alan sonrası `İnd. Oranı` (`legalReductionRate`)
- Mevcut Alan sonrası `İnd. Oranı` (`currentReductionRate`)
- Yasal Teras sonrası `İnd. Oranı` (`legalTerraceReductionRate`)
- Mevcut Teras sonrası `İnd. Oranı` (`currentTerraceReductionRate`)
- Sağda readonly `Yasal İnd. Kat Alanı`
- Sağda readonly `Mevcut İnd. Kat Alanı`

Varsayılan indirgeme oranı `100` gelir ve ekranda `%` takısıyla gösterilir.

Hesap:
- Yasal ind. kat alanı = `Yasal Alan × Yasal İnd. Oranı + Yasal Teras × Yasal Teras İnd. Oranı`
- Mevcut ind. kat alanı = `Mevcut Alan × Mevcut İnd. Oranı + Mevcut Teras × Mevcut Teras İnd. Oranı`

Örnek: `100 m² × %100 + 20 m² × %50 = 110 m²`.

Kullanıcı notu gereği **Bağımsız Bölüm İç Hacimler Açıklaması** metnine bu hesapla ilgili
herhangi bir açıklama eklenmedi. Bu hesaplar sonraki geliştirmede Değerleme bölümünde
kullanılacak.

Yedek alındı:
`backups/before-unit-reduced-floor-areas_2026-07-07_21-32-01`

Cache-buster: `app.js?v=20260707-2133`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.5 2026-07-07 İşyeri Cephe / Derinlik (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `İşyeri` seçildiğinde
**Bağımsız Bölüm Özellikleri > Bağımsız Bölüm Genel Bilgileri** içinde
`Isınma Sistemi` alanından sonra **Cephe (m)** (`unitShopFrontage`) ve
**Derinlik (m)** (`unitShopDepth`) alanları gösterilir.

Bu alanlar doluysa **Bağımsız Bölüm İç Hacimler Açıklaması** metninde alan/iç hacim
cümlesinden sonra şu cümle otomatik eklenir:

`Taşınmazın dükkan cephe uzunluğu 20 metre, dükkan derinliği ise 30 metre olarak ölçümlenmiştir.`

Teknik not:
- Koşul `shouldShowWorkplaceFrontageDepthFields()` ile `legalUsageNature === İşyeri`.
- Cümle `composeUnitShopFrontageDepthSentence()` içinde üretilir.
- Metin birleşiminde `areaDescription` sonrasına eklendi; dekoratif açıklama ve dışarıdan inceleme metinlerinden önce gelir.

Yedek alındı:
`backups/before-workplace-frontage-depth_2026-07-07_21-14-39`

Cache-buster: `app.js?v=20260707-2115`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.4 2026-07-07 Ticari İç Hacimler Listesi (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `İşyeri`, `Ofis` veya `Ticari Bina`
seçildiğinde **Bağımsız Bölüm Özellikleri > Katlar, Alanlar ve İç Hacimler > İç Hacimler**
seçim listesi ticari kullanıma uygun listeye döner.

Teknik not:
- Konut listesi `unitInteriorValidationOptions` olarak korunur.
- Ticari liste `commercialUnitInteriorValidationOptions` olarak eklendi.
- Seçilecek liste `getUnitInteriorValidationOptions` ile belirlenir.
- Koşul `isCommercialLegalUsageNature(state.fields.legalUsageNature)` üzerinden çalışır.

Yedek alındı:
`backups/before-commercial-interior-options_2026-07-07_19-43-48`

Cache-buster: `app.js?v=20260707-1918`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.3 2026-07-07 Açıklamalar Yapım Yılı (Codex oturumu)

Kullanıcı isteğiyle **Açıklamalar** bölümünde `Yapı Bitiş Tarihi` alanının yanına
**Yapım Yılı** alanı eklendi (`buildingConstructionYear`). Alan, yapı bitiş tarihinin
yılını otomatik alır:

- `24.11.1982` → `1982`

Teknik not:
- `refreshBuildingCompletionFromCurrentFields`, `buildingCompletionDate` ile birlikte
  `buildingConstructionYear` alanını da günceller.
- Yıl çıkarımı `calculateConstructionYearText` fonksiyonundadır.
- Yapı bitiş tarihi belirsizse yapım yılı boş kalır.

Yedek alındı:
`backups/before-construction-year_2026-07-07_19-30-10`

Cache-buster: `app.js?v=20260707-1917`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.2 2026-07-07 Bölüm Sırası (Codex oturumu)

Kullanıcı isteğiyle ana menüde **Emsaller** bölümü, **Değerleme** bölümünün üstüne taşındı.
Bu değişiklik yalnızca `sections` dizisindeki bölüm sırasını etkiler; veri anahtarları ve çıktı
akışları değişmedi.

Yedek alındı:
`backups/before-section-order-emsaller_2026-07-07_19-04-14`

Cache-buster: `app.js?v=20260707-1916`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.1 2026-07-07 TAKBİS Eklenti Bilgileri (Codex oturumu)

Kullanıcının verdiği `TAKBIS_Belgesi.pdf` içinde `EKLENTİ BİLGİLERİ` bölümü görüldü:
`4852346 Komurluk EKLENTİSİ : 11 NOLU KÖMÜRLÜK`.

Yapılanlar:
- **Tapu ve Mülkiyet** bölümünde `Ana taşınmaz niteliği` alanının altına **Eklenti** alanı eklendi (`titleAttachment`).
- `parseTakbisAttachments` ve `formatTakbisAttachmentsForReport` eklendi.
- TAKBİS yüklenince eklenti satırı otomatik okunur ve forma örn. `Kömürlük: 11 NOLU KÖMÜRLÜK` olarak yazılır.
- Yeni TAKBİS yüklemesinde eski eklenti verisi, diğer TAKBİS kaynaklı tapu alanları gibi temizlenir.
- `tools/test-takbis-parsing.js` içine eklenti regresyon vakası eklendi.
- Cache-buster: `app.js?v=20260707-1915`.

Doğrulama:
- `node --check app.js`
- `node tools/test-takbis-parsing.js`
- `node tools/check-basic.js`
- `node tools/test-halkbank-risk-rules.js`
- `node tools/test-value-factors-rules.js`
- `node tools/test-comparable-market-analysis.js`

---

## 0.0.0 2026-07-07 (2) tkb.pdf Şerh Tutarı Düzeltmeleri (Opus oturumu)

Kullanıcının bildirdiği "bazı şerhlerde tutar yanlış yazılıyor" hatası
(`takbis denemeler/tkb.pdf`, Kağıthane düzeni, 20 haciz şerhi) ile iki kök neden bulundu:

1. **Yevmiye numarası tutar metnine karışıyordu.** Kağıthane tipi düzende satır
   birleştirme, tarih-yevmiye sütunundaki yevmiye rakamını "Borç :" ile tutar
   arasına (veya tutardan hemen sonraya) düşürüyor; tutar desenleri
   `[0-9][0-9.,\s]*[0-9]` boşluklu grupları tek sayı sayınca trilyonluk sahte
   tutarlar çıkıyordu:
   - `Borç : 4101 2000000 TL` → **41.012.000.000,00 TL** (yanlış) → şimdi 2.000.000,00 TL
   - `Borç : 4500000 11760 TL` → **450.000.011.760,00 TL** (yanlış) → şimdi 4.500.000,00 TL
   - Çözüm: yeni `stripTakbisJournalNoFromAmountSource` — kaydın kendi yevmiye
     no'su, tutar arama metninden **bağımsız token olarak** ayıklanır (ondalıklı
     "11760.00" gibi parçalara dokunulmaz). `parseTakbisAnnotationRecord`,
     `normalizeTakbisAnnotationTableRow` ve `getTakbisAnnotationAmountSource`
     bu ayıklamayı kullanır. Sayı desenlerindeki `\s` bilinçli korunmuştur
     (OCR'daki "4 500 000" tipi gerçek boşluklu tutarlar için).

2. **Bir önceki oturumdaki scope-bölme kuralının regresyonu.** Satır sarmasında
   sola taşan `Haciz Yazısı sayılı...` satırının ilk kelimesi tip sütununa düşüp
   "Rehin" tipi üretiyor, yeni kural kaydı ortadan bölüyordu → kayıt yevmiyesiz
   kalıyor, tutarı OCR fallback'ten tüm belgenin son tutarı (çöp) geliyordu.
   - Çözüm: yeni `isTakbisSbiStartType` — şerh bölümünde yalnızca gerçek Ş/B/İ
     etiketleri (**Beyan/Şerh/İrtifak**) tarihsiz kayıtta yeni kayıt başlatır;
     Rehin/İpotek çıkarımları başlatmaz. Bölünen kayıt artık bütün:
     Bursa 5. Genel İcra 26.03.2026 → yevmiye **10085**, tutar **3.065.743,03 TL**.

### Doğrulama

- tkb.pdf: 20 haciz şerhinin tamamı doğru tutarla; özet: İhtiyati (6) 30.151.054,94 TL,
  İcrai (13) 70.887.467,80 TL, sahte kayıt yok (37→36 kayıt).
- Önceki 4 PDF regresyonu birebir temiz (bayrampaşa 18 kayıt / 13 icrai 634.466,17 TL;
  emek kamu 2 / 1.108.160,00 TL; uşak 3 malik toplam 1/1; ertuğrulgazi tedbir hariç).
- `tools/test-takbis-parsing.js`'e 6-7 numaralı vakalar eklendi (yevmiye ayıklama +
  Ş/B/İ kısıtı); tüm node testleri temiz.

---

## 0.0 2026-07-07 TAKBİS Ayrıştırma Düzeltmeleri (Opus oturumu)

Kullanıcının bildirdiği 5 TAKBİS ayrıştırma hatası, 4 gerçek TAKBİS PDF'i ile
(bayrampaşa çok şerhli, emek, uşak hisseli, Ertuğrulgazi) doğrulanarak düzeltildi.

### Düzeltilen Hatalar

1. **Haciz tutarları yanlış/eksik okunuyordu.** İki kök neden:
   - `isTakbisLienType` yalnızca `/HACIZ/` arıyordu; "Kamu **Haczi**" Türkçe
     katlamada `KAMU HACZI` olur, eşleşmez → Kamu Haczi kayıtlarında tutar hiç
     okunmuyordu (Emek: 213.160 TL ve 895.000 TL boştu). Artık `/HACIZ|HACZ/`
     aranıyor; `normalizeTakbisAnnotationReportType` ve haciz özet sayacı da aynı
     kalıbı kullanıyor. `halkbank-risk-rules.js` içindeki `isLienRow` da güncellendi.
   - Bayrampaşa'da birleşen kayıt (aşağıda #5) bir haczin 48.430,22 TL tutarını yutuyordu.

2. **Aynı hissedarın hisse payları toplanmıyordu (Uşak).** Üç kök neden:
   - `parseTakbisOwnerSegment` içinde sarmalanmış paydalı kesirlerde
     (`8117/8728` + devam `8`) `fraction.original` metinde birebir bulunamayınca
     `tail` tüm segment oluyor, **malik adı edinme sebebi sanılıyor**, ad
     temizliğinde adın kendisi silinip kayıt düşüyordu. Kesir konumu artık taban
     kesir üzerinden bulunuyor.
   - `findWrappedDenominatorPart` 18px toleransla ilk adayı alıyordu; El Birliği
     No sütununun sarması ("0") payda devamı sanılabiliyordu (8728**0** ≠ 8728**8**).
     Artık kesre en yakın x'li aday, asimetrik pencerede (-18..+45px) seçiliyor.
   - Yeni `mergeTakbisSameOwnerShares`: **aynı SN + aynı ada** sahip malik
     kayıtlarının hisseleri BigInt kesir toplamı ile tek satırda toplanıyor
     (Uşak: 6 kayıt → 3 malik, toplam tam 1/1, uyarı yok). SN yoksa birleştirme yapılmaz.
   - Edinme sebebi olarak `Mülkiyet ve Hisse Oranlarının Düzeltilmesi` artık tanınıyor.

3. **İhtiyati Tedbir şerhi İhtiyati Haciz sayılıyordu (Ertuğrulgazi).**
   `updateAnnotationLienSummary` `/IHTIYATI/` kontrolünü haciz filtresi olmadan
   yapıyordu. Artık özet yalnızca haciz kayıtlarını sayıyor (`TEDBIR` içeren tipler
   hariç). `normalizeTakbisAnnotationReportType` de tip etiketi tedbir içeriyorsa
   veya metinde "ihtiyati tedbir" geçip "ihtiyati haciz" geçmiyorsa haciz
   sınıflaması yapmıyor.

4. **Beyanda Tarih/Yevmiye boşsa sonraki kaydın tarih-yevmiyesi alınıyordu
   (Bayrampaşa Yönetim Planı beyanı).** `shouldStartNewTakbisEncumbranceScope`
   yalnızca tarih tamamlanınca yeni kayıt açıyordu; artık S/B/İ sütununda kendi tip
   etiketi olan satır, önceki kayıt tarihsiz olsa bile yeni kayıt başlatıyor.
   Ayrıca tarih fallback'i `sanitizeTakbisEncumbranceDateFallbackText` ile
   `( Şablon: ...)` ve `YÖNETİM PLANI : 17/07/1981` gibi içerik/etiket tarihlerini
   ayıklıyor → tarihsiz beyan artık **tarihsiz kalıyor**. Eklenti Bilgileri bölümü de
   şerh grubundan kesiliyor (eklenti sistem no'su yevmiye sanılmasın diye).

5. **02-01-2026 / 33 yevmiyeli şerh atlanıyordu (Bayrampaşa).**
   `extractTakbisEncumbranceDateInfo` yevmiyeyi `[0-9]{3,8}` ile arıyordu; yıl
   başındaki 2 haneli yevmiye ("33") eşleşmeyince kayıt "tamamlanmamış" sayılıp
   sonraki şerhle birleşiyordu. Artık 1-2 haneli yevmiye **yalnızca tarihe bitişik
   tire sonrasında** kabul ediliyor ("Ada - 8 Parsel" gibi içerik sayıları
   yevmiye sanılmaz). Bayrampaşa artık 13 icrai haciz + toplam 634.466,17 TL veriyor.

### Doğrulama Sonuçları (gerçek PDF'lerle)

| PDF | Sonuç |
|---|---|
| Bayrampaşa | 18 kayıt; 13 İcrai Haciz = 634.466,17 TL; 02.01.2026/33 = 48.430,22 TL ayrı kayıt; Yönetim Planı beyanı tarihsiz |
| Emek | Kamu Haczi (2) = 1.108.160,00 TL; İcrai (2) = 1.674.611,38 TL |
| Uşak | 3 malik: Servet Ünal 27473/87288, Semra Aydın 6869/21822, Ahmet Ünal 32339/87288; toplam 1/1, uyarı yok; "Hisseli Mülkiyet" otomatik |
| Ertuğrulgazi | İhtiyati Tedbir 23.12.2025/54391 tedbir olarak kalıyor; haciz toplamları 0 |

### Test

- **Yeni:** `tools/test-takbis-parsing.js` — app.js'den ilgili saf fonksiyonları
  kaynak metinden çıkarıp sandbox'ta koşan regresyon testi (5 hatayı da kapsar).
  `node tools/test-takbis-parsing.js` → `TAKBİS ayrıştırma regresyon testi tamam.`
- Mevcut testler temiz: halkbank-risk-rules, value-factors, comparable-market-analysis, check-basic.

---

## 0. 2026-07-04 Codex Devam Notu

Bu oturumda önceki Opus/Claude çalışmaları üzerine devam edildi. Eski session geçmişine
güvenilmeden güncel repo dosyaları, `handoff.md` ve mevcut testler esas alındı.

### Eklenen / Güncellenen Modüller

- `src/risk/halkbank-risk-data.js` ve `src/risk/halkbank-risk-rules.js`
  - **15 - Halkbank Risk Kodları** bölümü eklendi.
  - Excel/makro kaynaklı Halkbank risk kodları sisteme alındı.
  - Rapordaki verilerden otomatik seçilebilen risk kodları için kural motoru kuruldu.
  - 1. ve 2. paket otomatik kurallar eklendi.
  - Test: `tools/test-halkbank-risk-rules.js`

- `src/value-factors/value-factors-rules.js`
  - **16 - Değeri Etkileyen Faktörler** bölümü eklendi.
  - Olumlu/olumsuz özellikler sistem verilerinden otomatik üretiliyor.
  - Madde dili tam cümle yerine kısa rapor maddesi formatına çekildi.
  - Arsa özellikleri, dikey/yatay kat irtifakı mülkiyetlerinde bastırılıyor.
  - Enerji performans metni seçilen sınıfı yazar: `Enerji performans sınıfının B kategorisinde olması`.
  - Yapı denetim olumsuz maddesi: `Yapı denetim sözleşmesinin fesihli olması`.
  - Kat konumu kuralları ara kat / en üst kat / bodrum-zemin / asansörsüz üst kat olarak düzenlendi.
  - Otopark maddesinde tapu `titleBlockName` boşsa **binanın**, doluysa **sitenin** ifadesi kullanılır.
    Örnekler:
    - Blok boş: `Taşınmazın yer aldığı binanın açık otopark imkanının bulunması`
    - Blok dolu: `Taşınmazın yer aldığı sitenin açık otopark imkanının bulunması`
  - `açık otopark otopark` gibi çift tekrarlar temizlendi.
  - Test: `tools/test-value-factors-rules.js`

- `src/comparables/comparable-market-analysis.js`
  - Emsaller bölümünde `Piyasa Özeti` ve `Düzeltme / Şerefiye Notu` kaldırıldı.
  - Emsal Kayıtları ile Emsal krokisi arasına **Piyasa Analizi ve Emsal Değerlendirmesi** paneli eklendi.
  - Placeholder: `{{EMSAL_PIYASA_ANALIZI}}`
  - Emsal sayısı tüm girilmiş emsal kayıtlarından hesaplanır.
  - Beyan alan / düzeltilmiş alan farkı en yakın 5% banda yuvarlanır.
  - Aynı alt/üst pazarlama farkında `%15 ile %15` yerine `yaklaşık %15 aralığında` yazılır.
  - Metnin sonundaki nihai m² birim değer, Değerleme bölümündeki `legalValueUnit` alanından gelir.
    Bu alan boşsa emsal indirgenmiş m² ortalaması yedek olarak kullanılır.
  - Emsal uzaklığı için sistemin ürettiği `c20` mesafe metinlerinden en büyük değer alınır.
    En uzak mesafe 100 metrelik **üst basamağa** yuvarlanır ve mikro-piyasa cümlesine yazılır.
    Örnek: `438 m` → `500 metrelik etki yarıçapı`.
  - Paragraf dili revize edildi:
    - `aksı` kaldırıldı.
    - `mülakatlar` yerine `görüşmeler`.
    - `optimizasyonlar / optimize edilerek` yerine `düzeltmeler / uyumlandırılarak`.
    - `matris` yerine `karşılaştırma tablosu`.
    - Fazla `analiz` tekrarları `değerlendirme`, `piyasa çalışmaları`, `ulaşılan sonuçlar` gibi ifadelerle azaltıldı.
  - Test: `tools/test-comparable-market-analysis.js`

- `app/app.js` çıktı ve taslak aktarım akışı
  - **1 - Dosya ve Temel Bilgiler** bölümüne `JSON Taslak` yükleme kartı eklendi.
  - JSON yükleme, farklı kaydedilen JSON paketinden veya doğrudan state objesinden tüm rapor verilerini geri yükler.
  - **12 - Banka ve Çıktı** bölümüne `JSON olarak farklı kaydet` ve `Word olarak farklı kaydet` butonları eklendi.
  - JSON çıktı, `schema`, `schemaVersion`, `exportedAt`, `appVersion` ve `state` alanlarıyla taslak paketi üretir.
  - Word çıktısı şimdilik Word uyumlu `.doc` HTML dosyasıdır; açıklama metinleri, tablo yapıları, değerleme/emsal tabloları ve koordinat verilerinden üretilen krokiler dosyaya eklenir.
  - Word açıklama metinlerinde Placeholder için üretilen `... Şablonu` kayıtları, `_template` anahtarları ve `{{...}}` token içeren taslak metinler dışarıda bırakılır. Örn. Konut Bölgesi seçiliyken Ticaret/Sanayi/Tarımsal çevresel özellik şablonları Word çıktısına yazılmaz.
  - Word tablo tasarımı uygulamadaki tablo görünümüne yaklaştırıldı: `word-table` sınıfı, daha sıkı hücre tasarımı, geniş tablolar için `@page WordLandscape` yatay sayfa bölümü ve emsal kayıtları için solda alan adları / sağda emsal sütunları olan matris düzeni eklendi.
  - Word tablo fontları küçültüldü; tablo başlıkları ve bölüm başlıkları kalınlaştırıldı. Inline SVG kroki yerine Word uyumlu VML kroki üretimi (`buildPointSketchVml`) ve koordinat lejandı eklendi.
  - Word çıktısı, kroki mevcutsa MHTML paket olarak üretilir; kroki canvas üzerinde PNG'ye çevrilip dosyanın içine `image/png` parçası olarak gömülür. Tablo renkleri uygulama temasındaki `--green`, `--surface-muted`, `--line` tonlarına sabitlendi.
  - **PDF olarak kaydet** butonu eklendi. PDF akışı, aynı rapor HTML'ini gömülü PNG kroki data URL'leriyle yeni yazdırma penceresinde açar ve tarayıcının PDF olarak kaydet ekranını çağırır. Popup engellenirse HTML yedeği indirilir.
  - Emsal çıktı matrisine `Taşınmaza Olan Mesafesi` satırı eklendi. Satır `row.c20` değerini kullanır; boşsa enlem/boylamdan `buildComparableLocationText` ile anlık mesafe/yön metni üretir.
  - JSON taslak import sonrasında Adres ve Konum bölümündeki `city`, `district`, `neighborhood` boşsa Tapu (`titleCity/titleDistrict/titleNeighborhood`), KML veya adres kaynak alanlarından tamamlayan `hydrateImportedAddressAdministrativeFields` koruması eklendi.
  - Gayrimenkul türüne göre bölüm görünürlüğü eklendi: `Dikey Kat İrtifakı` ve `Yatay Kat İrtifakı` seçimlerinde **Arsa Özellikleri**; `Arsa` ve `Tarla` seçimlerinde **Ana Gayrimenkul Özellikleri** ile **Bağımsız Bölüm Özellikleri** menüde, zorunlu alan kontrolünde ve Word/PDF açıklama-export akışında gizlenir.
  - Ana Gayrimenkul teknik bilgilerine **Bina Oturumu Referansı** açılır listesi eklendi (`bina girişi`, `bina köşe kotları`, `bina özgün şekli`, `cephe görselleri`, `bina oturumu geometrisi`). Projeye uygunluk `uygundur` olduğunda, uygunluk cümlesinden önce `BİNAOTURUMU`, `BİNA.GİRİŞ.KAT.SEVİYESİ` ve `BİNA.GİRİŞ.YÖNÜ` alanlarından bina oturumu/giriş açıklaması otomatik oluşturulur.
  - **Gabim Veri Seti** ana menü bölümü eklendi. Kullanıcının gereksiz bulduğu Genel Bilgiler grubu hariç bırakıldı; tapu, tapuya özel bilgiler, yapıya özel bilgiler, yapı türü, ek bilgiler, bağımsız bölüm/taşınmaz özellikleri ve BB imar bilgileri sistem alanlarından otomatik derlenen GABİM formatlı kontrol panelinde gösterilir.
  - GABİM veri seti eşleştirmeleri güncellendi: taşınmaz kimlik no ve eşyalı satış satırları kaldırıldı; tapu türü `Zemin Tipi + Mülkiyet`, hisseli cevabı `Mülkiyet Türü`, halihazır kullanım `Bağımsız Bölüm Kullanım Durumu`, kentsel dönüşüm `İmar sorunu + Kentsel Dönüşüm`, havuz/güvenlik `Sosyal Tesisler` seçimlerinden beslenir. Adres ve Konum bölümüne varsayılan `1. Derece` olan Deprem Derecesi alanı eklendi; GABİM deprem derecesi buradan dolar.
  - GABİM veri setine **Genel Ek Bilgiler** grubu eklendi. Değer türü, hesaplanan emsal, ulaşım imkanı, yatırım/markalı konut/ticari-sanayi-turizm gelişme göstergeleri, satılabilirlik ve inşaat kalitesi mevcut rapor alanlarından türetilir; tasarruf finansman şirketi alanı veri yoksa `Seçiniz`, tercihli kullanım alanı ise güvenli varsayımla `Hayır` gelir.
  - GABİM `Hesaplanan Emsal` satırı artık kullanıcı tarafından değiştirilen `calculatedEmsal` alanını öncelikli okur. `Ulaşım İmkanı`, `Ana Arter Mesafesi` seçimine göre `yakın=Yüksek`, `orta yakın=Orta`, `uzak=Düşük` döner. İnşaat kalitesinde `Lüks` seçimi GABİM'e `Lüks` olarak aktarılır.
  - İncelenen belgeler tablosunda belge bilgisi yoksa ve `Mimari Proje Var mı?` seçimi `Hayır` ise **Yapı Yaşı** manuel girişe açılır; bu durumda belge yenileme akışı kullanıcı tarafından girilen yapı yaşını ezmez.
  - Cezai karar açıklaması kurum kuralı düzeltildi: Büyükşehir Belediyesi veya İl Özel İdaresi seçili değilse metin daima ilçe belediyesi arşivi üzerinden kurulur. Bu özel kurumlardan biri seçiliyse özel kurum ile ilçe belediyesi birlikte yazılır; Webtapu cezai karar kurum metnine dahil edilmez.
  - Adres ve Konum bölümünde **YAKIN ÇEVRESİNDE BULUNAN ÖNEMLİ ARTERLER** metni artık yalnızca Yakın çevre seçimi listesinde o an görünen ve işaretli olan noktalardan üretilir. `Kullanıcı Noktalarını Getir` işlemi, eski otomatik seçili çevre noktalarını korumaz; kullanıcı noktalarını getirirken yalnızca kullanıcı noktalarını seçili bırakır.
  - Harita kullanıcı noktası akışı genişletildi: `Yakın Çevre Kaydet` yakın çevre noktası, `Ulaşım Arteri Kaydet` ise `user-artery` kategorili kullanıcı ana arteri kaydeder. Kullanıcı arterleri aynı `server-data/user-pois.json` veritabanında tutulur, ana arter seçim listesinde görünür ve seçildiğinde ulaşım tarifi koordinata göre otomatik güncellenir.
  - Test: `tools/check-basic.js`

### Bu Oturumda Koşulan Kontroller

Bundled node ile çalıştırıldı:

```powershell
node --check src/comparables/comparable-market-analysis.js
node --check src/value-factors/value-factors-rules.js
node tools/test-comparable-market-analysis.js
node tools/test-value-factors-rules.js
node tools/check-basic.js
```

Son bilinen temiz çıktılar:
- `Emsal piyasa analizi testi tamam.`
- `Değeri etkileyen faktörler testi tamam.`
- `Temel kontrol tamam: dosyalar, JavaScript sozdizimi ve iOS PDF uyumluluk blogu saglam.`

### Güncel Cache-Buster

`index.html` içinde son güncel sürümler (2026-07-12 itibarıyla):

- `src/comparables/comparable-market-analysis.js?v=20260711-0341`
- `src/land/minimum-parcel-sizes.js?v=20260711-0400`
- `src/value-factors/value-factors-rules.js?v=20260707-1050`
- `src/risk/halkbank-risk-rules.js?v=20260707-1812`
- `src/templates/template-engine.js?v=20260712-0133` (yeni, banka şablonları)
- `styles.css?v=20260711-1539`
- `app.js?v=20260712-0133`
- `cloud/cloud-sync.js?v=20260711-1539`
- `cloud/report-library.js?v=20260710-1626`
- `manifest.json`, `icons/*.png`, `service-worker.js` (Faz 3)
- `assets/gate-bg/blueprint-background.png`, `assets/gate-bg/blueprint-background-dark.png` (giriş kapısı arka planı; cache-buster'sız — değişirse dosya adını değiştirin)
- `templates/*.html` (banka şablonları; motor `?t=Date.now()` ile çektiğinden cache-buster GEREKMEZ, düzenleme anında etkilidir)

Yeni değişikliklerde ilgili script ve `app.js` sorgu sürümlerini artırmayı unutmayın.

**Dikkat:** `tools/check-basic.js` güncel `app.js?v=...` VE `styles.css?v=...`
sürümlerini sabit metin olarak doğrular (satır ~420-421); cache-buster artırınca
oraları da güncelleyin, yoksa test kırılır.

---

## 1. Proje & Çalıştırma

Yerel (Türkçe) **gayrimenkul değerleme raporu yazma programı**. Saf JavaScript (build yok).

Ana dosyalar:
- `app/app.js` — ~21k satır, tek klasik script. Üst düzey `function`lar global; `state`
  ve `const`ler `window`'da değil ama tarayıcı-eval'inde çıplak isimle erişilebilir.
- `app/index.html`, `app/styles.css`
- `app/server.js` — statik sunucu, `PORT` env okur (varsayılan 5173), `__dirname`'den servis eder.

**Node PATH'te YOK.** Bundled runtime kullanın:
`C:\Users\90551\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- Sözdizimi: `node --check app.js` · Kontroller: `node tools/check-basic.js`

**Kullanıcının kendi sunucusu genelde 5173'te çalışır — kapatmayın.** Doğrulama için
proje kökünde `.claude/launch.json` içinde `autoPort: true` (runtimeExecutable = tam
bundled node yolu, runtimeArgs `["app/server.js"]`) ile Claude_Preview MCP kullanın;
aynı dosyaları farklı portta ayrı bir kopya olarak açar.

**Cache-buster kuralı:** HER değişiklikte `app/index.html` içindeki İKİ sürüm sorgusunu
da güncelleyin — `styles.css?v=YYYYMMDD-HHMM` ve `app.js?v=...`. Aksi halde tarayıcı
eski derlemeyi kullanır (kullanıcı Ctrl+F5 yapmak zorunda kalır).

Durum kalıcılığı: `localStorage["rapor-yazma-programi-draft-v1"]`, debounce'lu
`autosave`→`saveState` ile. Debounce nedeniyle senkron eval okumaları kaydetme yan
etkilerini görmez → kaydetme-zamanı davranışını test etmek için `saveState()`'i doğrudan çağırın.

PDF/mahalle testleri için: dosyaları `app/test-inputs/_probe_*` altına kopyalayıp
tarayıcıda `fetch('test-inputs/_probe_*')` ile `File` oluşturup `processTakbisFile` /
`processAddressFile` / `processKmlFile` çağırın (pdf.js soğuk başlangıç = gerçek ilk
yükleme). İş bitince probe dosyalarını silin.

---

## 2. Bu Oturumda Eklenen Özellikler

Çoğu **14 - Açıklamalar** bölümüne panel olarak eklendi; her biri Kopyala butonlu ve
ilgili verilerden otomatik üretiliyor.

| Özellik | Yer / Anahtar |
|---|---|
| Emsal Değerleme Tablosu — kira İND. birim değeri sütunu + Değerleme'ye kira otomatik yazımı + modern gruplu tasarım | Emsaller bölümü |
| İpotek lehdar **combobox** (odakta tüm banka listesi, yazınca filtre, serbest lehdar) | Takyidat / İpotekler |
| Emsallerde **Enlem/Boylam** salt-okunur satırları (haritadan seçilen koordinatlar) | Emsaller matrisi (c18/c19) |
| Tüm açıklama textarea'larına ve üretilen açıklama panellerine **Kopyala** butonu | Genel |
| **Değerleme Yöntemleri Hesap Açıklaması** (emsal/gelir/maliyet, yasal-mevcut) | `{{DEGERLENDIRME_SEMASI}}` |
| **Değerleme Yöntemi Seçimi Açıklaması** (seçili yönteme göre canlı güncel matbu cümle) | `{{DEGERLEME_YONTEMI_ACIKLAMASI}}` |
| **Takyidat Tablosu** (Beyanlar/Hak ve Mükellefiyetler/Rehinler/Şerhler bantlı) | `{{TAKYIDAT_TABLO}}` |
| **Malikler Tablosu** (hisse yasal/mevcut değerleri = hisse oranı × toplam; toplam yoksa 0) | `{{MALIKLER_TABLO}}` |
| **Değerleme Özet Tablosu** (Piyasa/Arsa/Yapı/Şerefiye/Sigorta, m² birim + oranlar, kompakt) | Açıklamalar |
| **Açık Adres** (İdari mahalle → sokak → site/apartman → blok → dış kapı → kat → iç kapı → ilçe/il → UAVT) | `{{ACIK_ADRES}}` |

Placeholder kaydı: `collectGeneratedPlaceholders` içindeki `generatedRows` dizisine
`{ category, key, title, value }` eklenerek yapılır; token `makePlaceholderToken(key)`
ile üretilir (ASCII anahtar → makrolarla birebir token, ör. `DEGERLENDIRME_SEMASI`).

---

## 3. Bu Oturumda Düzeltilen Hatalar

1. **Bölümlere girilemiyordu (Ana Gayrimenkul / Değerleme / Açıklamalar).** Kök neden:
   `getBuildingDepreciationAgeNumber` içinde tanımsız `parseDateInputToIso` çağrısı →
   ReferenceError render'ı kırıyordu. Düzeltme: `dateTrToIso` kullanıldı.

2. **Emsal konumu seçilince tüm emsallerin kat/mülkiyet (c6) seçimleri siliniyordu.**
   Kök neden: `saveState()`→`normalizeReportStateFields()`, comparables'ı `section.table.
   columns` ile yanlış eşleştirip select değerlerini başlık-formatına çeviriyordu; değer
   opsiyon listesiyle eşleşmeyince render'da filtrelenip siliniyordu. Düzeltme:
   normalizasyon `tableKey === "comparables"` için atlanıyor.

3. **Tapu ve Mülkiyet alanları büyük harf + kopyala büyük harf.** `titleTextUppercaseKeys`
   ile bu bölümün metin alanları Türkçe büyük harfe çevriliyor (render + blur +
   normalizeReportFieldValue). Anlatı cümleleri bu alanları `normalizeReportTitleText`
   ile yeniden proper-case yaptığından bozulmuyor.

4. **KML, Bağımsız Bölüm Niteliği'ni bozuyordu.** KML `<Data name="Nitelik">` aslında
   ana taşınmaz niteliğidir; `titleQuality`'e `force` ile yazılıyordu. Düzeltme: KML
   niteliği → `mainPropertyQuality`; ayrıca **KML artık `titleQuality` ve `postalCode`
   alanlarına hiç dokunmuyor** (kullanıcı isteği).

5. **İlk adres PDF yüklemesinde posta kodu yanlış (ikinci yüklemede düzeliyordu).** Kök
   neden: adres PDF'i il/ilçe içermiyordu; `findLocalNeighborhoodByAddress` boş il
   filtresini atlayıp **başka ildeki aynı isimli mahalleyi** eşleştiriyordu
   (Panayır→Balıkesir 10442, Soğanlı→72502). Düzeltmeler:
   - **Adres PDF ham metninden il/ilçe çekiliyor** (`parseAddressLine`, "İL/İLÇE/MAHALLE/
     SOKAK" satırı) — birincil ve en sağlam çözüm.
   - Boşsa `titleCity`/`titleDistrict` (TAKBİS) yedeği.
   - İl bilinmiyorsa `findLocalNeighborhoodByAddress` null döner (yanlış-il eşleşmesi yok).
   - `processTakbisFile` de posta kodu lookup'ını yeniden tetikler (yükleme sırası fark etmez).
   - `processAddressFile`, force'lu düzeltmeyi `await` eder (yarış/sessiz hata yok).
   - 48MB'lık Bursa mahalle CSV'si açılışta ön-yükleniyor (`warmUpDeferredResources`).

---

## 4. Bilinen Notlar / Bekleyenler

- `[Cozuldu 2026-07-16]` `parseComparableNumber` binlik nokta ayracli
  ("2.000.000") degerleri destekliyor; bu eski not arsiv amacli tutulmustur.
- Mahalle veritabanı **yalnızca Bursa** (`server-data/bursa_manuel_duzeltilmis_ana_dosya.csv`).
  Bursa dışı adreslerde DB eşleşmesi olmaz → posta kodu adres PDF'inden gelir (yoksa boş).
- `joinTurkishList` app.js'de 3 kez tanımlı (sonuncusu geçerli, `cleanupPlaceName` uygular);
  yeni Türkçe liste birleştirmede buna güvenmeyin, inline yazın.
- Word tarafındaki tablo placeholder'ları (`{{TAKYIDAT_TABLO}}`, `{{MALIKLER_TABLO}}`) makro
  ile Excel'den doldurulabiliyor; uygulama bunların metin karşılığını Placeholder bölümünde
  gösterir.

---

## 5. Doğrulama Kısayolu

Değişiklikten sonra: (1) index.html'de iki sürümü de yükselt, (2) `node --check app.js`,
(3) Claude_Preview ile reload + eval doğrulaması, (4) enjekte test verisini localStorage'dan
temizle (`localStorage.removeItem('rapor-yazma-programi-draft-v1')` + reload) ve probe
dosyalarını sil. Kullanıcıya asıl sunucuda (5173) **Ctrl+F5** hatırlat.
## 0.0.67 2026-07-11 Hesaplanan Emsal Otomatik Hesaplama Düzeltmesi (Codex oturumu)

Kullanıcı, Emsaller bölümündeki `Hesaplanan Emsal` alanının otomatik gelmediğini bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` değiştiğinde hesaplanan emsal değeri görünür kutuya anlık aktarılır.
- Önceki kayıtlardan kalan boş `Hesaplanan Emsal` alanındaki manuel kilit artık otomatik hesabı engellemez.
- Kullanıcı hesaplanan emsal kutusunu boşaltırsa manuel kilit kaldırılır ve otomatik hesap yeniden devreye girer.
- Türkçe binlik yazımı desteklenir: `1.000 x 1,5 = 1.500`.

Yedek:
`backups/before-calculated-emsal-auto-fix_2026-07-11_00-20-51`

Servis sürümü:
`app.js?v=20260711-0025`, `styles.css?v=20260711-0025`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- Canlı tarayıcıda `Yüzölçümü 1000` ve `Emsal/KAKS 1,5` ile `Hesaplanan Emsal = 1.500` doğrulandı.
## 0.0.68 2026-07-11 Hesaplanan Emsal Kaynak Alan Senkronu (Codex oturumu)

Kullanıcı, hesaplanan emsal alanının yalnızca alana backspace uygulandığında değiştiğini bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` değişiklikleri artık önceki manuel hesaplanan emsal değerini zorunlu olarak yeniler.
- Bu davranış İmar Durumu bölümündeki KAKS/Emsal ile Hesaplanan Emsal bağlantısı gibi çalışır.
- Hesaplanan Emsal alanı elle değiştirilebilir; ancak kaynak alanlardan biri değiştiğinde otomatik değer tekrar esas alınır.

Yedek:
`backups/before-calculated-emsal-source-sync-fix_2026-07-11_00-34-31`

Servis sürümü:
`app.js?v=20260711-0030`, `styles.css?v=20260711-0030`
## 0.0.69 2026-07-11 Hesaplanan Emsal Görünür Yenileme (Codex oturumu)

Kaynak alan değişikliğinde hesaplanan emsal değeri görünür kutuya da kesin olarak yansıtıldı.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` veya `Kat Adedi` yazılırken otomatik hesap oluştuğunda Emsaller bölümü yeniden çizilir.
- Eski manuel hesaplanan emsal değeri ekranda kalmaz; yeni kaynak değer hesaplanıp gösterilir.

Servis sürümü:
`app.js?v=20260711-0035`, `styles.css?v=20260711-0035`
## 0.0.70 2026-07-11 Emsal Giriş Performans Düzeltmesi (Codex oturumu)

Kullanıcı, yüzölçümü yazarken her rakamda tüm bölümün yeniden hesaplanması nedeniyle ciddi kasma olduğunu bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` yazılırken ağır emsal/değerleme panelleri artık yeniden çizilmez.
- Otomatik hesaplama ve bölüm yenileme alan tamamlandığında `change` olayında çalışır.
- Yazım sırasında yalnızca taslak değeri tutulur; kullanıcı deneyimi akıcı hale gelir.

Servis sürümü:
`app.js?v=20260711-0040`, `styles.css?v=20260711-0040`
## 0.0.71 2026-07-11 Hesaplanan Emsal m² Birim Değerleri (Codex oturumu)

Emsal matrisinde `İndirgenmiş M2 Birim Değer` altına iki otomatik hesap alanı eklendi:
- `Hesaplanan Emsal m2 Birim Değeri`: satış değeri / hesaplanan emsal alanı.
- `İndirgenmiş Hesaplanan Emsal m2 Birim Değeri`: hesaplanan emsal m2 birim değerine özellik ve konum indirgemelerinin uygulanmış hali.

Arsa/tarla emsallerinde hesaplanır; konut/yapı emsallerinde hesaplanan emsal alanı olmadığı için boş kalır. Mevcut `M2 Birim Değer` hesabı yüzölçümü üzerinden çalışmaya devam eder.

Servis sürümü:
`app.js?v=20260711-0050`, `styles.css?v=20260711-0050`

---

## 0.0.72 2026-07-11 Konum Sebebi Ham Metin ve YalnÄ±zca Konum Åerefiyesi (Codex oturumu)

YapÄ±lanlar:
- `c10` blur sÄ±rasÄ±nda otomatik baÅŸlÄ±k biÃ§imlendirmesine uÄŸramÄ±yor; kullanÄ±cÄ±nÄ±n girdiÄŸi bÃ¼yÃ¼k/kÃ¼Ã§Ã¼k harflerle korunuyor.
- `KÄ±sa Emsal Metni` hesaplanan alanÄ± ve ilgili Ã¼retim fonksiyonu kaldÄ±rÄ±ldÄ±.
- Arsa/tarla emsal alanlarÄ±ndan `Ä°mar Åerefiyesi` kaldÄ±rÄ±ldÄ±; uzun emsal paragrafÄ±ndaki imar ÅŸerefiyesi cÃ¼mlesi kaldÄ±rÄ±ldÄ±.
- Arsa/tarla emsallerinde indirgenmiÅŸ hesaplanan emsal m2 birim deÄŸeri ve indirgenmiÅŸ m2 birim deÄŸer artÄ±k yalnÄ±zca `Konum Åerefiyesi` ile hesaplanÄ±yor.

Yedek:
`backups/before-comparable-location-only-and-text-cleanup_2026-07-11_01-00-37`

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0100`, `styles.css?v=20260711-0100`

---

## 0.0.73 2026-07-11 Emsal Tablosu Arsa/Tarla Görünümü ve Üst Yatay Kaydırma (Codex oturumu)

Yapılanlar:
- Emsaller matrisinin üstüne alt yatay kaydırma çubuğuyla senkron çalışan ikinci yatay kaydırma çubuğu eklendi.
- Emsal Değerleme Tablosu konut/ofis/işyeri emsallerinde mevcut kira ve iç özellik sütunlarıyla çalışmaya devam ediyor.
- Arsa/tarla emsallerinde ayrı tablo görünümü eklendi: Yüzölçümü, satış/pazarlık değerleri, m² birim değer, Konum Şerefiyesi, İndirgenmiş m² Birim Değer, Hesaplanan Emsal m² Birim Değeri ve İndirgenmiş Hesaplanan Emsal m² Birim Değeri.
- Arsa/tarla değerleme özetinde kira ve iç özellik şerefiyesi sütunları gösterilmiyor.

Yedek:
`backups/before-comparable-summary-land-table-and-top-scroll_2026-07-11_01-17-29`

Servis sürümü:
`app.js?v=20260711-0110`, `styles.css?v=20260711-0110`

---

## 0.0.74 2026-07-11 Hesaplanan Emsal Sütunu (Codex oturumu)

Arsa/tarla Emsal Değerleme Tablosu'nda `Yüzölçümü` sütununun hemen yanına otomatik `Hesaplanan Emsal` sütunu eklendi. Değer doğrudan emsal satırının hesaplanan emsal alanından alınır.

Servis sürümü:
`app.js?v=20260711-0120`, `styles.css?v=20260711-0120`

---

## 0.0.75 2026-07-11 Hesaplanan Emsal Değer Tespiti Bölümü (Codex oturumu)

- Emsal Değerleme Tablosu altındaki 50.000 TL yuvarlama açıklaması kaldırıldı.
- Arsa/tarla emsallerinde `Hesaplanan Emsal Değerine Göre Değer Tespiti` bölümü eklendi.
- Konu taşınmazın hesaplanan emsali, arsa/tarla emsallerinin `İndirgenmiş Hesaplanan Emsal m² Birim Değeri` ortalamasıyla çarpılarak piyasa değeri hesaplanıyor.
- Formül satırı görünür şekilde eklendi: `(Hes. Emsal) × İndirgenmiş Hesaplanan Emsal m² Birim Değeri Ortalaması = Piyasa Değeri`.

Servis sürümü:
`app.js?v=20260711-0130`, `styles.css?v=20260711-0130`

---

## 0.0.76 2026-07-11 Hesaplanan Emsal Değer Tespiti Tablo Geliştirmesi (Codex oturumu)

- Değer tespiti tablosuna Taşınmaz Yüzölçümü, KAKS Oranı, Konu Taşınmazın Hesaplanan Emsali, Hesaplanan Emsal m² Birim Değeri, m² Birim Değeri ve Piyasa Değeri sütunları eklendi.
- Piyasa değeri `Hesaplanan Emsal × m² Birim Değeri` hesabından sonra 50.000 TL adımına yuvarlanıyor.
- Eski `İND. HESAPLANAN EMSAL M² BİRİM DEĞERİ ORTALAMASI` başlığı `HESAPLANAN EMSAL M² BİRİM DEĞERİ` olarak güncellendi.
- Formül açıklamasında `Taşınmaz yüzölçümü × KAKS oranı = Hesaplanan Emsal` açıkça gösteriliyor.

Servis sürümü:
`app.js?v=20260711-0140`, `styles.css?v=20260711-0140`

---

## 0.0.77 2026-07-11 Yuvarlanmış Piyasa Değerinden Birim Değer Türetimi (Codex oturumu)

- Piyasa değeri 50.000 TL adımına yuvarlandıktan sonra birim değerler yeniden hesaplanıyor.
- `m² Birim Değeri = Piyasa Değeri / Taşınmaz Yüzölçümü`.
- `Hesaplanan Emsal m² Birim Değeri = Piyasa Değeri / Hesaplanan Emsal`.
- Formül açıklaması bu iki türetimi de gösteriyor.

Servis sürümü:
`app.js?v=20260711-0150`, `styles.css?v=20260711-0150`

---

## 0.0.78 2026-07-11 Emsal Tablosu Başlık ve Formül Sadeleştirmesi (Codex oturumu)

- Değer tespiti tablosundaki `(Hes. Emsal)` parantezi kaldırıldı.
- Tablo altındaki uzun hesaplama/formül açıklaması kaldırıldı.
- Emsal matrisi ve değerleme tablosunda `İstenen Fiyat` → `Talep Edilen Değer`, `Pazarlıklı Fiyat` → `Pazarlıklı Değer` olarak güncellendi.

Servis sürümü:
`app.js?v=20260711-0160`, `styles.css?v=20260711-0160`

---

## 0.0.79 2026-07-11 Arsa Piyasa Değeri Başlığı (Codex oturumu)

Değer tespiti bölümü başlığı `Hesaplanan Emsale Göre Arsa Piyasa Değeri` olarak güncellendi. Dinamik yenileme sırasında da aynı başlık korunuyor.

Servis sürümü:
`app.js?v=20260711-0170`, `styles.css?v=20260711-0170`

Yedek:
`backups/before-comparable-emsal-title-update_2026-07-11_09-20-51`

Yedek:
`backups/before-comparable-derived-unit-values_2026-07-11_09-08-23`

Yedek:
`backups/before-comparable-emsal-value-table-refinement_2026-07-11_09-01-12`

Yedek:
`backups/before-comparable-calculated-emsal-valuation-panel_2026-07-11_08-53-14`

Yedek:
`backups/before-comparable-summary-calculated-area-column_2026-07-11_08-43-41`

---

## 0.0.80 2026-07-11 Arsa/Tarla Mülkiyetinde Değerleme Temizliği ve Tarla Emsal Otomasyonu (Codex oturumu)

- Mülkiyet `Arsa` veya `Tarla` seçildiğinde bina, bağımsız bölüm ve eski değerleme alanları temizleniyor; bina/bağımsız bölüm kat tabloları da boşaltılıyor.
- Arsa/Tarla mülkiyetinde Değerleme bölümündeki `KONU TAŞINMAZIN DEĞERİNİN HESAPLANMASINDA KULLANILACAK TABLO` gizleniyor.
- Arsa/Tarla için Piyasa Değeri alanları taşınmaz yüzölçümüyle eşitleniyor; kira satırları eski verilerin görünmemesi için gösterilmiyor.
- Tarla mülkiyetinde Piyasa Değeri, Emsaller bölümündeki indirgenmiş m² birim değer ortalaması ile yüzölçümünün çarpımından hesaplanıyor ve mevcut 50.000 TL yuvarlama kuralı uygulanıyor.

Servis sürümü:
`app.js?v=20260711-0180`, `styles.css?v=20260711-0180`

Yedek:
`backups/before-land-ownership-valuation-cleanup_2026-07-11_09-36-40`

---

## 0.0.81 2026-07-11 Arsa/Tarla Değerleme Panellerinin Sadeleştirilmesi (Codex oturumu)

- Mülkiyet `Arsa` veya `Tarla` olduğunda Değerleme bölümünde Yapı Değeri, Sigortaya Esas Değer, Arsa Değeri ve Şerefiye panelleri gizleniyor.
- Piyasa Değeri paneli korunuyor; Tarla için indirgenmiş m² emsal ortalaması × taşınmaz yüzölçümü hesabı ve 50.000 TL yuvarlama kuralı uygulanmaya devam ediyor.

Servis sürümü:
`app.js?v=20260711-0190`, `styles.css?v=20260711-0190`

Yedek:
`backups/before-land-valuation-panel-hide_2026-07-11_09-53-58`

---

## 0.0.82 2026-07-11 Arsa Piyasa Değerinin Hesaplanan Emsal Sonucuna Bağlanması (Codex oturumu)

- Mülkiyet `Arsa` seçildiğinde Değerleme bölümündeki yasal ve mevcut piyasa değeri, Emsaller bölümündeki `Hesaplanan Emsale Göre Arsa Piyasa Değeri` tablosunun `Piyasa Değeri` sonucundan otomatik alınır.
- Arsa sonucu değiştiğinde değerleme alanları yeniden oluşturulurken aynı değer korunur; Tarla için mevcut indirgenmiş m² birim değer ortalaması × yüzölçümü ve 50.000 TL yuvarlama kuralı aynen devam eder.

Servis sürümü:
`app.js?v=20260711-0191`, `styles.css?v=20260711-0191`

Yedek:
`backups/before-arsa-valuation-sync_2026-07-11_10-27-20`

---

## 0.0.83 2026-07-11 Arsa Hesaplanan Emsal Tablosunun DeÄŸerleme BÃ¶lÃ¼mÃ¼ne TaÅŸÄ±nmasÄ± (Codex oturumu)

- `Hesaplanan Emsale GÃ¶re Arsa Piyasa DeÄŸeri` tablosu Emsaller bÃ¶lÃ¼mÃ¼nden kaldÄ±rÄ±ldÄ±.
- Tablo yalnÄ±zca mÃ¼lkiyet `Arsa` seÃ§ildiÄŸinde DeÄŸerleme bÃ¶lÃ¼mÃ¼nde, Piyasa DeÄŸeri panelinin hemen Ã¼stÃ¼nde gÃ¶steriliyor.
- Emsal verileri deÄŸiÅŸtiÄŸinde tablo ve Arsa piyasa deÄŸeri baÄŸlantÄ±sÄ± mevcut yenileme akÄ±ÅŸÄ±yla korunuyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0192`, `styles.css?v=20260711-0192`

Yedek:
`backups/before-move-arsa-valuation-table_2026-07-11_10-35-20`

---

## 0.0.84 2026-07-11 Arsa/Tarla Emsal Piyasa Analizi Metni (Codex oturumu)

- Arsa ve Tarla mÃ¼lkiyetlerinde `Piyasa Analizi ve Emsal DeÄŸerlendirmesi` metni araziye uygun ayrÄ± bir akÄ±ÅŸtan Ã¼retiliyor.
- Bu metinlerde cephe, kat, iÃ§ Ã¶zellik ve iÃ§ mekan iÅŸÃ§ilik kriterleri kullanÄ±lmÄ±yor.
- Arazi analizinde konum, yÃ¼zÃ¶lÃ§Ã¼mÃ¼, imar koÅŸullarÄ±, imar yapÄ±laÅŸma nizamÄ±, Emsal/KAKS oranÄ± ve imar lejantÄ± kriterleri kullanÄ±lÄ±yor. Konut/ofis/Ä°ÅŸyeri emsal metni korunuyor.

Emsal analiz modÃ¼lÃ¼ sÃ¼rÃ¼mÃ¼:
`src/comparables/comparable-market-analysis.js?v=20260711-0340`

Yedek:
`backups/before-land-comparable-analysis-text_2026-07-11_10-39-52`

---

## 0.0.85 2026-07-11 Arazi Emsal Metninde Sabit KarÅŸÄ±laÅŸtÄ±rma Ä°fadesi (Codex oturumu)

- Arsa/Tarla emsal analizinde otomatik `olumlu yÃ¶nde` veya `olumsuz yÃ¶nde` ifadesi kaldÄ±rÄ±ldÄ±.
- Arazi metni sabit olarak `olumlu ve olumsuz yÃ¶nleri karÅŸÄ±laÅŸtÄ±rÄ±larak` ifadesini kullanÄ±yor.
- Konut/Ofis/Ä°ÅŸyeri emsal metnindeki mevcut dinamik yÃ¶n mantÄ±ÄŸÄ± korunuyor.

Emsal analiz modÃ¼lÃ¼ sÃ¼rÃ¼mÃ¼:
`src/comparables/comparable-market-analysis.js?v=20260711-0341`

Yedek:
`backups/before-fixed-land-analysis-direction_2026-07-11_10-45-26`

---

## 0.0.86 2026-07-11 Adres Metninde Nokta SonrasÄ± TÃ¼rkÃ§e BÃ¼yÃ¼k Harf (Codex oturumu)

- Adres kodu PDF'sinden gelen `2.selÃ§uk Sokak` benzeri metinlerde nokta sonrasÄ± TÃ¼rkÃ§e harf artÄ±k otomatik bÃ¼yÃ¼tÃ¼lÃ¼yor: `2.SelÃ§uk Sokak`.
- DÃ¼zenleme `toTitleCaseTr` iÃ§inde yapÄ±ldÄ±; mevcut adres baÅŸlÄ±k dÃ¼zeni korunuyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0193`, `styles.css?v=20260711-0193`

Yedek:
`backups/before-address-period-capitalization_2026-07-11_10-53-29`

---

## 0.0.87 2026-07-11 5403 SayÄ±lÄ± Kanun Minimum Parsel KontrolÃ¼ (Codex oturumu)

- KullanÄ±cÄ±nÄ±n paylaÅŸtÄ±ÄŸÄ± `5403_minimum_arazi_olculeri_il_ilce.xlsx` dosyasÄ±ndaki 933 il/ilÃ§e kaydÄ± `src/land/minimum-parcel-sizes.js` iÃ§ine aktarÄ±ldÄ±.
- Tarla bÃ¶lÃ¼mÃ¼nde `Parsel Ã¼zerinde Zirai ÃœrÃ¼n Var mÄ±?` = `Evet` ise Dikili Arazi, `HayÄ±r` ise TarÄ±m TÃ¼rÃ¼ne gÃ¶re Sulu Arazi veya Kuru Arazi limiti kullanÄ±lÄ±yor.
- Parsel yÃ¼zÃ¶lÃ§Ã¼mÃ¼ il/ilÃ§e ve seÃ§ilen arazi tÃ¼rÃ¼ limitiyle karÅŸÄ±laÅŸtÄ±rÄ±lÄ±yor; sonuÃ§ Tarla bÃ¶lÃ¼mÃ¼nde ayrÄ± kontrol alanÄ±nda ve Arsa aÃ§Ä±klamasÄ± iÃ§inde `karÅŸÄ±lamaktadÄ±r/karÅŸÄ±lamamaktadÄ±r` olarak gÃ¶steriliyor.
- Arsa mÃ¼lkiyetinde tarÄ±m kontrolleri Ã¶nceki kurala uygun olarak gizli kaldÄ±rÄ±ldÄ±.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0194`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-agricultural-parcel-limit-rule_2026-07-11_21-29-36`

---

## 0.0.88 2026-07-11 Minimum Parsel KontrolÃ¼nÃ¼n AÃ§Ä±klamalar BÃ¶lÃ¼mÃ¼ne Eklenmesi (Codex oturumu)

- 5403 sayÄ±lÄ± Kanuna gÃ¶re minimum parsel kontrol cÃ¼mlesi 14-AÃ§Ä±klamalar bÃ¶lÃ¼mÃ¼nde de read-only bir aÃ§Ä±klama alanÄ± olarak gÃ¶steriliyor.
- AynÄ± ortak hesap sonucu kullanÄ±ldÄ±ÄŸÄ± iÃ§in il, ilÃ§e, yÃ¼zÃ¶lÃ§Ã¼mÃ¼, tarÄ±m tÃ¼rÃ¼ veya zirai Ã¼rÃ¼n seÃ§imi deÄŸiÅŸtiÄŸinde aÃ§Ä±klama otomatik yenileniyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0195`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-minimum-parcel-explanation-field_2026-07-11_21-51-43`

---

## 0.0.91 2026-07-12 Arsa/Tarla Emsallerinde Yola Cephe ve Tarla Imar Alanlarinin Temizlenmesi

- Arsa/Tarla emsallerinde Boylam satirinin altina `Yola Cephe Durumu` (`c29`) eklendi.
- Secenekler: Kadastro yola cephesiz, Kadastro yola cepheli, Imar yoluna cepheli, Asfalt yola cepheli, Acilmamis imar yoluna cepheli.
- Uzun emsal aciklamasinda yola cephe durumu konum karsilastirmasindan sonra gosteriliyor.
- Emsal Niteligi `Tarla` oldugunda imar lejanti, yapilasma nizamı, Emsal/KAKS, kat adedi ve hesaplanan emsal alanlari otomatik bosaltiliyor; bu bilgiler tarla aciklamasina da yazilmiyor.

Servis surumu:
`app.js?v=20260712-0135`

Yedek:
`backups/before-comparable-road-frontage-and-tarla-zoning_2026-07-12_15-30-10`

Ek duzeltme:
`Yola Cephe Durumu` alani yanlis gorunurluk kumesinden cikarilip land-only gorunurluk kumesine alindi; Arsa/Tarla ve Tum Emsaller gorunumlerinde gorunur hale getirildi.

Servis surumu:
`app.js?v=20260712-0136`

Yedek:
`backups/before-fix-road-frontage-visibility_2026-07-12_15-51-20`

Gorunurluk duzeltmesi:
`Yola Cephe Durumu` sutunu tum Emsal gorunumlerinde gorunur hale getirildi; konut emsallerinde alan bos kalir, Arsa/Tarla emsallerinde secim kullanilir.

Servis surumu:
`app.js?v=20260712-0137`

Yedek:
`backups/before-force-road-frontage-column-visible_2026-07-12_15-57-57`

Artifact cache duzeltmesi:
- `app.js` ve service worker kaydi `20260712-0138` surumune tasindi.
- Artifact tarafinin eski sekme/service worker kodunu kullanmasi engellendi.

Servis surumu:
`app.js?v=20260712-0138`, `service-worker.js?v=20260712-0138`

Yedek:
`backups/before-artifact-cache-refresh_2026-07-12_16-03-45`

---

## 0.0.89 2026-07-11 Minimum Parsel CÃ¼mlesinin Arsa AÃ§Ä±klamasÄ±ndan Ã‡Ä±karÄ±lmasÄ± (Codex oturumu)

- Minimum parsel kontrol cÃ¼mlesi Arsa aÃ§Ä±klamasÄ±ndan kaldÄ±rÄ±ldÄ±.
- CÃ¼mle yalnÄ±zca 14-AÃ§Ä±klamalar bÃ¶lÃ¼mÃ¼ndeki `5403 SayÄ±lÄ± Kanuna GÃ¶re Minimum Parsel KontrolÃ¼` alanÄ±nda gÃ¶steriliyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0196`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-remove-minimum-sentence-from-land-note_2026-07-11_23-07-56`

---

## 0.0.87 2026-07-11 Giris Kapisina Blueprint Arka Plan Sahnesi (Claude oturumu)

- Kullanicinin ayri bir oturumda `ui-ux-pro-max` skill'i ile hazirlattigi giris sayfasi arka plan tasarimi (blueprint illustrasyon + acik/koyu tema anahtari + hafif parcacik animasyonu), zorunlu giris kapisina (`#authGateOverlay`) uygulandi.
- Iki illustrasyon `assets/gate-bg/blueprint-background.png` (acik tema, 1536x1024, ~2.0MB) ve `assets/gate-bg/blueprint-background-dark.png` (koyu tema, 1536x1024, ~2.5MB) olarak projeye kopyalandi.
- `index.html`: `#authGateOverlay` icine `.gate-scene` (blueprint gorsel + izgara deseni, vinyet, 10 adet parcacik, acik/koyu tema anahtari) satir ici `<script>` ile eklendi. Sahne, Firebase/cloud-sync yuklenmesini beklemeden calisir; kapinin kendisi hala satir ici (inline) opak arka planla ilk boyamadan itibaren engelleyicidir (mevcut fail-closed davranis degismedi). Tema tercihi `localStorage` anahtari `rapor-gate-theme` ile hatirlanir (varsayilan: koyu, mevcut lacivert markaya uyumlu).
- `#authGateContent`'e `position:relative;z-index:10` eklendi - CSS boyama sirasi kurali geregi (positioned/z-index'li kardesler arasinda agac sirasina gore boyanma) bu olmadan arka plan sahnesi giris formunun USTUNE binebilirdi; eklenmesiyle form her zaman sahnenin onunde kalir (tarayicida `elementFromPoint` ile dogrulandi).
- `styles.css`: yeni "GIRIS KAPISI ARKA PLANI" bolumu - tum kurallar `#authGateOverlay` altinda izole (`.gate-*` siniflari), uygulamanin geri kalan temasi/diger ekranlar etkilenmiyor. `prefers-reduced-motion: reduce` icin animasyonlar kapatiliyor.
- `cloud-sync.js`: `renderGateLogin()`'deki kart div'ine yalnizca `class="gate-card"` eklendi (kutu golgesi + giris animasyonu icin); e-posta/sifre giris mantigi, buton ID'leri ve dogrulama akisi DOKUNULMADI (gercek Firebase girisi zaten test edilmis durumdaydi, riske atilmadi).
- Bilinen sinirlama / not: PNG dosyalari toplam ~4.5MB; `server.js` no-store/no-cache header'lari geregi her sayfa acilisinda yeniden indirilir. Yavas mobil baglantilarda giris ekraninin ilk boyamasi (kapi zaten opak, engelleyici) etkilenmez ama blueprint gorseli birkac saniye gec belirebilir. Ileride WebP'ye cevirme degerlendirilebilir (bu oturumda yapilmadi).
- Dogrulama: bu sandbox'taki onizleme tarayicisinda (`Rapor Yazma` sunucusu, port 5173) kalici gercek bir Firebase oturumu (canlilar.melih@gmail.com) zaten acik bulundugundan, kapi gizli durumdaydi; gercek auth durumuna dokunmadan `renderGateLogin`'in urettigi DOM parcasi `#authGateContent`'e enjekte edilerek gorsel/etkilesim dogrulamasi yapildi: `.gate-blueprint` gorseli ag isteginde 200 OK dondu, `elementFromPoint` ile kartin sahnenin onunde ve tiklanabilir oldugu, tema anahtarinin `data-gate-theme` ozniteligini ve `localStorage`'i dogru guncelledigi, acik/koyu PNG'lerin dogru yuklendigi teyit edildi. Sayfa daha sonra yeniden yuklenerek test DOM'u temizlendi, konsolda hata kalmadigi dogrulandi. Gercek cihazda uctan uca gorsel onay kullanicidan istenmedi (opsiyonel, dusuk risk).

Servis surumu:
`styles.css?v=20260711-1539`, `cloud/cloud-sync.js?v=20260711-1539`

Yeni dosyalar:
`assets/gate-bg/blueprint-background.png`, `assets/gate-bg/blueprint-background-dark.png`

Yedek:
`backups/before-gate-blueprint-background_2026-07-11_15-23-08`

---

## 0.0.90 2026-07-12 Banka Rapor Sablonlari Sistemi (Claude oturumu)

Kullanicinin eski Excel programinda kullandigi 10 sablon dosyasi
(C:\RAPOR FORMATLARI\ altindaki 8 banka .doc/.docx + Isbank masraf .doc +
Ziraat ek tablo .xlsx) incelendi; her birinin bolum/tablo yapisi ve icindeki
{{PLACEHOLDER}} adlari cikarildi (.doc'lar Word 97-2003 binary; Word COM
kullaniciya ait acik Word ile cakisip takildigi icin Python + olefile ile
piece-table uzerinden metin cikarildi). ONEMLI KESIF: eski sablonlar zaten
{{SEHIR}}, {{ADRES2025}}, {{TAKYIDAT_TABLO}} gibi eski Excel adlandirilmis
hucre adlarini kullaniyor; 213 benzersiz token'in 204'u
server-data/adlandirilmis_hucreler_listesi.json'daki adlarla eslesiyor.

Yeni sistem:

- `src/templates/template-engine.js` (YENI) - `window.RaporTemplates`.
  Cozumleme sirasi: (1) LEGACY_ALIASES eski Excel adlari (~170 ad; alan,
  tarih, para bicimi, metin uretici, HTML tablo uretici turleri),
  (2) uygulama alan anahtarlari (sections[].fields[].key),
  (3) olusturulan metin anahtarlari (collectGeneratedTextPlaceholders).
  Karsilastirma Turkce-katlanmis ve noktalama duyarsiz:
  {{SEHIR}}={{sehir}}={{SEHIR}}, {{DIS.KAPI.NO}}={{dis_kapi_no}}.
  Eslesme yoksa ciktida sari "UYARI AD" isareti + dis aktarma sonunda uyari
  listesi; eslesme var ama deger bossa cikti bos kalir (eski Excel gibi).
  HTML yorumlari (<!-- -->) dolum oncesi cikarilir (sablon notlari Word'e
  sizmasin + yorumdaki ornek {{...}} eksik sayilmasin). Tablolar icin
  app.js'in mevcut ureticileri cagrilir (buildTakyidatTableText,
  buildMaliklerTableText, buildValuationSummaryText,
  buildComparableValuationWordTableHtml, buildHalkbankRiskCodesTableText...).

- `templates/` (YENI klasor) - kullanicinin SERBESTCE DUZENLEYEBILECEGI
  bagimsiz HTML sablonlari: akbank, halkbank, isbankasi, isbankasi-masraf,
  kuveytturk, vakifbank, vakifkatilim, yapikredi, ziraat, ziraat-ek-tablo
  (10 dosya). Her biri ilgili bankanin orijinal .doc yapisina sadik
  (GDYS Yardimci Bilgiler + GABIM Veri Seti + Calisma Kagidi tablolari
  dahil; Halkbank'ta risk kodu tablolari; Ziraat ek tablo yatay sayfa).
  Eski "Konut Bolgesi Ise / Ticaret Bolgesi Ise" cift paragraflari yerine
  uygulamanin bolge turune gore otomatik uretilen
  {{ENVIRONMENTAL_FEATURES_TEXT}} metni kullanildi. Isbank masraf
  yazisindaki ucret kalemleri programda bulunmadigindan sablonda noktali
  bosluk (elle doldurulur) olarak birakildi.

- `templates/PLACEHOLDER-REHBERI.md` (YENI) - kullanici dokumantasyonu:
  duzenleme kurallari, tum placeholder listesi (kategori kategori), yeni
  sablon ekleme talimati (TEMPLATE_REGISTRY), programda karsiligi OLMAYAN
  eski adlarin listesi (ACILYASAL/ACILMEVCUT, NETPARSELALAN, TERKMIKTARI,
  ARKABAHCE, ISKANTARIHI, net alanlar, ucret kalemleri...).

- `app.js`: createOutputExportPanel'e "Banka Sablonuyla Kaydet" blogu
  eklendi (appendBankTemplateExportBlock) - sablon secme listesi (bankaya
  gore otomatik on-secim: state.fields.bank -> defaultTemplateKeyForBank)
  + "Banka sablonuyla kaydet (Word)" butonu. Motor yuklu degilse blok hic
  gorunmez, uygulama eskisi gibi calisir.

- `tools/test-bank-templates.js` (YENI) - regresyon testi: 10 sablondaki
  TUM {{token}}'larin cozumlenebildigini (alan anahtarlari GERCEK app.js
  kaynagindan, uretilen metin anahtarlari gercek
  collectGeneratedTextPlaceholders govdesinden cikarilarak) + ornek deger
  cozumlemeleri (para bicimi, ilk malik satirindan tapu tarihi/yevmiye,
  SAHIPLER listesi, Ziraat belge alanlari) + katlama esdegerliklerini
  dogrular. app.js'te bir alan anahtari yeniden adlandirilirsa bu test kirilir.

Dogrulama: node --check (engine + app.js), tools/test-bank-templates.js,
check-basic.js ve diger 4 test paketi GECTI. Tarayicida canli dogrulandi:
motor yukleniyor, "Banka ve Cikti" bolumunde blok goruluyor (10 secenek),
banka secilince varsayilan sablon otomatik geliyor (Kuveyt Turk denendi),
10 sablonun tamami canli uygulama verisiyle SIFIR eksik token ile doldu,
konsolda hata yok. NOT: gercek .doc indirme tiklamasi tarayicida
denenmedi (indirme diyalogu otomasyonu guvenilir degil); fillTemplate +
downloadTextFile yollari ayri ayri dogrulanmis mevcut kod yollaridir.
Kullanicinin gercek bir raporla "Banka sablonuyla kaydet (Word)" deneyip
Word ciktisini gormesi onerilir.

Bilinen sinirlar / gelecek isler:
- ACILYASAL/ACILMEVCUT, NETPARSELALAN, TERKMIKTARI, ISKANTARIHI, net
  alanlar icin programda alan yok (rehberde listelendi; istenirse alan
  olarak eklenebilir).
- YAPIKALITESI2025 -> unitMaterialQuality esleniyor; kullanici farkli bir
  kaynak isterse LEGACY_ALIASES'ta tek satir degisiklik yeterli.
- Sablonlar .doc (Word-HTML) olarak iner; Word "farkli kaydet" ile .docx'e
  cevrilebilir.

Servis surumu:
`app.js?v=20260712-0133`, `src/templates/template-engine.js?v=20260712-0133`
(check-basic.js pinleri guncellendi)

Yeni dosyalar:
`src/templates/template-engine.js`, `templates/*.html` (10 adet),
`templates/PLACEHOLDER-REHBERI.md`, `tools/test-bank-templates.js`

Yedek:
`backups/before-bank-templates_2026-07-12_01-17-12`

---

## 0.0.90 2026-07-12 Minimum Parsel Kontrolunun Yalnizca Tarla Degerlemesine Tas

- `5403 Sayili Kanuna Gore Minimum Parsel Kontrolu` alani Arsa Ozellikleri ve 14-Aciklamalar formlarindan kaldirildi.
- Kontrol artik yalnizca mulkiyet turu `Tarla` oldugunda Degerleme bolumunde, Degerleme Yontemi Aciklamasi ile Satis Kabiliyeti Aciklamasi arasinda gosteriliyor.
- Arsa ve diger mulkiyet turlerinde bu panel gorunmuyor.

Servis surumu:
`app.js?v=20260712-0134`

Yedek:
`backups/before-minimum-parcel-explanation-field_2026-07-11_21-51-43`

---

## 0.0.92 2026-07-12 Banka Sablonlari: Program Placeholder Adlarina Gecis (Claude oturumu)

Kullanici karari: sablon dosyalarinda SADECE programin urettigi placeholder
adlari kullanilacak; eski Excel adlarinin hangi program adina karsilik
geldigi ongorulerek cevrildi. 0.0.90'daki 10 sablonun tamami yeniden
yazildi (yapi/bolum sirasi degismedi, yalnizca token adlari):

- Alan token'lari artik uygulamanin Placeholder bolumundekiyle ayni:
  {{SEHIR}}->{{CİTY}}, {{ILCE}}->{{DİSTRİCT}}, {{MAHALLE}}->{{TİTLE_NEİGHBORHOOD}},
  {{ADRES2025}}->{{ACIK_ADRES}}, {{ZEMİNTİPİ}}->{{GROUND_TYPE}},
  {{TAPUNİTELİKBB}}->{{TİTLE_QUALİTY}}, {{YASALDURUMDEĞERİ}}->{{LEGAL_VALUE}},
  {{İMARDURUMUKISA}}->{{PLANNİNG_NOTE_TEXT}}, {{OLUMLUFAKTÖR}}->
  {{DEGERI_ETKILEYEN_OLUMLU_FAKTORLER}} vb. (~90 esleme; tam liste rehberde).
- Panel alanlari icin program adi kurali: {{ELEVATOR}}, {{CARPARK}},
  {{SOCİAL_FACİLİTİES}}, {{UNİT_HEATİNG_TYPE}}, {{TOTAL_FLOORS}},
  {{UNİT_MATERİAL_QUALİTY}}, {{FACADES}}... — motorun alan indeksine
  EXTRA_FIELD_KEYS listesi eklendi (sections disinda panellerce yonetilen
  gercek state.fields anahtarlari).
- Program token'larinin tarih/para bicimli halleri icin oncelikli takma
  adlar eklendi: {{APPOİNTMENT_DATE}}/{{PLAN_DATE}}/{{TAKBİS_DATE}}/
  {{EKB_ISSUE_DATE}}/{{EKB_VALİD_UNTİL}} GG.AA.YYYY; {{LEGAL_VALUE}}/
  {{CURRENT_VALUE}}/{{CURRENT_RENT}}/{{LEGAL_RENT}} "1.234.567 TL" bicimli;
  {{UNİT_CONSTRUCTİON_LEVEL}} bossa "Tamamlanmis (%100)".
- Program karsiligi olmayan hesaplanan kavramlarin motor token'lari
  program uslubuyla adlandirildi (rehberde * ile isaretli):
  {{TAPU_TARİHİ}}, {{TAPU_YEVMİYESİ}}, {{EDİNME_SEBEBİ}}, {{HİSSELİ_Mİ}},
  {{İSKAN_VAR_MI}}, {{İÇİ_GÖRÜLDÜ_MÜ}}, {{SİTE_İÇİNDE_Mİ}},
  {{İNCELENEN_BELGELER_TABLO}}, {{EMSAL_1..7}}, {{EMSAL_TABLOSU}},
  {{DEGERLENDIRME_TABLOSU}}, {{YILLIK_KİRA_MEVCUT}},
  {{KAT_BAZLI_İÇ_HACİMLER}}, {{ZRT_BELGE_TÜRÜ/TARİHİ/NO}}.
- {{BAĞIMSIZBÖLÜM2025}} -> {{UNİT_İNTERİOR_DESCRİPTİON_TEXT}} +
  {{UNİT_DECORATİVE_DESCRİPTİON_TEXT}} (iki ayri program metni).
- Akbank'taki ters anlamli "AYNI MI" satiri program semantigine cevrildi
  ("FARK VAR MI" + {{USAGE_NATURE_DİFFERENCE}}); Isbank'taki {{SAHIPLER}}
  hucresi kaldirildi (Malikler tablosu zaten var); {{DAHAÖNCESATIŞ}}
  statik EVET/HAYIR yapildi; Yapi Kredi "var ise aciklamasi" hucresi elle
  doldurulmak uzere "-" birakildi.
- ESKI ADLAR HALA CALISIR (tolerans katmani LEGACY_ALIASES duruyor) —
  kullanicinin kendi eski sablon metinleri bozulmaz; ancak bizim
  dosyalarimizda eski ad kullanilmasi artik test hatasidir:
  tools/test-bank-templates.js'e FORBIDDEN_LEGACY_TOKENS kontrolu eklendi
  (~75 eski adin sablon dosyalarinda GECMEMESI dogrulanir) + yeni program
  adi cozumleme assert'leri ({{LEGAL_VALUE}} para bicimi, {{TAPU_TARİHİ}}
  ilk malik satirindan, EXTRA_FIELD_KEYS cozumu...).
- Alan indeksi cozumlerinde \n -> <br /> donusumu eklendi (cok satirli
  textarea alanlari Word'de satir sonlarini korur).
- templates/PLACEHOLDER-REHBERI.md program adlariyla bastan yazildi.

Dogrulama: test-bank-templates + check-basic + 4 mevcut paket GECTI;
tarayicida 10 sablonun tamami canli dolduruldu, SIFIR eksik token, konsol
temiz; ornek program token'lari (CİTY, LEGAL_VALUE, TAPU_TARİHİ,
SOCİAL_FACİLİTİES, İSKAN_VAR_MI, EMSAL_1) canli ortamda cozuldu.

Servis surumu:
`src/templates/template-engine.js?v=20260712-1542` (check-basic pini
guncellendi; templates/*.html cache-buster gerektirmez)

Yedek:
`backups/before-template-program-tokens_2026-07-12_15-35-48`

---

## 0.0.93 2026-07-12 Kuveyt Turk Sablonuna INVEX Portal Gorunumu (Claude oturumu)

Kullanici Kuveyt Turk INVEX ekspertiz portalinin 5 ekran goruntusunu
paylasip ayni renk tonlari ve sayfa yerlesimiyle sablon istedi.
templates/kuveytturk.html INVEX gorunumunde bastan yazildi:

- Renkler: Kuveyt Turk yesili (#009b6b, koyu #007a55), acik yesil
  sekme/serit zemini (#e7f5ee, kenar #bee0d2), TURUNCU bolum basliklari
  (#e8820c, gri bant #efefef uzerinde - portaldeki "TASINMAZ BILGILERI"
  bandi gibi), gri form kutulari (#e9e9e9, kenar #cfcfcf), sag hizali
  koyu yesil etiketler (#17493b).
- Yerlesim portal akisiyla ayni: ust serit + KuveytTurk | ekspertiz
  markasi + is/musteri satiri > Talep/Rapor sekme hapi seritleri >
  Temel Bilgiler > Tapu Kaydi (malikler tablosu, ada/parsel, arsa payi,
  ADRES NO/Tasinmaz ID uyari notuyla) > Konum (acik adres + ulasim
  tarifi + enlem/boylam) > Rapor/Ozellikler (NITELIGI, TASINMAZ
  BILGILERI, ENERJI KIMLIK, MB ACIKLAMA, TAPU TAKYIDAT, BOLGE
  OZELLIKLERI, TEKNIK OZELLIKLER, ISKAN BILGISI, IMAR DURUMU, INCELENEN
  BELGELER, DEGERLEMEYI ETKILEYEN FAKTORLER) > Degerleme > Emsaller >
  GDYS/GABIM/Calisma Kagidi.
- Placeholder seti degismedi (0.0.92'deki program adlari aynen);
  test-bank-templates + check-basic GECTI.
- Not: .doc ciktisinda Word arka plan renklerini/tablolari korur;
  yuvarlak kose gibi ayrintilar yalnizca tarayici gorunumunde.
- Istenirse ayni INVEX stili diger banka sablonlarina da uygulanabilir
  (her bankanin kendi portal rengiyle).

Yedek:
`backups/before-kuveytturk-invex-style_2026-07-12_15-52-22`
## 0.0.94 2026-07-12 Kullanım Niteliği Farkı Yoksa Mevcut Niteliğin Senkronizasyonu

- `Yasal/Mevcut Kullanım Türü Arasında Fark Var Mı?` seçeneği `Hayır` olduğunda gizli kalan `Mevcut Kullanım Niteliği` state değeri, `Yasal Kullanım Niteliği` ile otomatik eşitleniyor.
- Senkronizasyon ilk yükleme/JSON içe aktarma sırasında, yasal nitelik değiştiğinde ve fark kutusu işaretsiz hale getirildiğinde çalışıyor.
- Alan kullanıcı arayüzünde gizli kalmaya devam ediyor; fark `Evet` olduğunda mevcut kullanım niteliği kullanıcı tarafından seçilebilir.

Servis sürümü:
`app.js?v=20260712-0139`

Dogrulama: `node --check app.js`, `node --check src/templates/template-engine.js`, `tools/check-basic.js` ve `tools/test-bank-templates.js` geçti.

---
## 0.0.95 2026-07-12 Graphify Haritasinin Gelistirme Akisina Eklenmesi

- Graphify kuruldu ve proje kod haritasi `graphify-out/` altinda olusturuldu.
- Harita: 47 kod dosyasi, 18.253 dugum ve 41.551 baglanti.
- Etkilesimli agac: `graphify-out/GRAPH_TREE.html`.
- Gelistirme kuralı: degisiklik oncesi `explain/query/affected/path`, degisiklik sonrasinda `update` ve gerekirse `cluster-only` kullanilacak.
- Bu kural proje kokundeki `AGENTS.md` dosyasina da eklendi.

---
## 0.0.96 2026-07-12 Belge Yukleme Alaninin Belirginlestirilmesi

- `styles.css` icinde belge yukleme kartlari satir/sutun cerceveleri ile daha belirgin hale getirildi.
- Masaustu ve tablet gorunumlerinde kartlar ortak cerceve icinde, mobilde ise ayri cerceveli satirlar olarak gosteriliyor.
- Hover/focus durumunda aktif kart mavi cerceve ile vurgulaniyor.
- Sunucu `127.0.0.1:5174` uzerinden 200 yanit veriyor; in-app browser acik sekme baglantisi bu oturumda kurulamadigi icin yan panel canli olarak dogrulanamadi.
- Graphify kod haritasi guncellendi: 18.521 dugum, 42.055 baglanti.

Yedek:
`backups/before-document-upload-visibility_2026-07-12_17-10-09`

Dogrulama: `tools/check-basic.js` gecti.

---
## 0.0.97 2026-07-12 Hisseli Mulkiyet Hisse Aciklamasinin Degerlemeye Tasınmasi

- Mülkiyet türü `Hisseli Mülkiyet` olduğunda otomatik hisse açıklaması, Değerleme Yöntemi Açıklaması ile Satış Kabiliyeti Açıklaması arasına taşındı.
- 14-Açıklamalar bölümündeki `Hisse Açıklaması` alanı kullanıcı arayüzünde gizli tutuluyor; placeholder/state değeri korunuyor.
- Hisse açıklaması değerleme panelinde kopyalanabilir ve mevcut otomatik güncelleme akışıyla senkron kalıyor.

Servis sürümü:
`app.js?v=20260712-0140`

Yedek:
`backups/before-shared-ownership-valuation-note_2026-07-12_17-26-07`

Dogrulama: `node --check app.js`, `tools/check-basic.js` geçti. Graphify: 18.524 düğüm, 42.061 bağlantı.

---
## 0.0.98 2026-07-12 Ilce Iklim ve Deprem Bilgileri

- `Turkiye_Ilce_Iklim_Deprem.xlsx` incelendi; `İklim & Deprem Verileri` sayfasındaki 998 ilçe kaydı uygulamaya `src/land/climate-earthquake-data.js` olarak aktarıldı.
- İl ve ilçe seçildiğinde Arsa Özellikleri bölümünde `İklim ve Deprem Bilgileri` paneli ve otomatik açıklama cümlesi gösteriliyor.
- Cümlede bölge, yıllık yağış, sıcaklık, don günü, güneşlenme, rakım, nem, deprem bölgesi ve yağış sınıfı yer alıyor.
- İlçe eşleşmesi Türkçe karakter ve parantezli merkez kayıtlarına toleranslı; eşleşme yoksa panel gösterilmiyor.

Servis sürümü:
`app.js?v=20260712-0141`, `styles.css?v=20260712-1720`

Dogrulama: 998 veri kaydı, Bursa/Yıldırım örnek kaydı, JavaScript sözdizimi, `tools/check-basic.js` ve Graphify güncellemesi geçti. Graphify: 18.533 düğüm, 42.079 bağlantı.

---

---

## 0.0.101 2026-07-13 Emsaller Bolumu Tek Standart Formata Gecirildi (Claude oturumu)

Kullanici karari: tum banka sablonlarinin Emsaller bolumu AYNI formatta
olsun - kac emsal girilmisse o kadar sutunlu bir tablo, en altta da emsal
aciklamasi. 8 sablonda (akbank, halkbank, isbankasi, kuveytturk, vakifbank,
vakifkatilim, yapikredi, ziraat) Emsaller bolumu eski
`{{EMSAL_PIYASA_ANALIZI}} + {{EMSAL_TABLOSU}} + {{EMSAL_1}}...{{EMSAL_7}}`
(sabit metin paragraflari) yerine su standart iki placeholder'a cevrildi:

```
{{EMSAL_MATRISI}}

<h3>Emsal Açıklaması</h3>
{{EMSAL_PIYASA_ANALIZI}}
```

(Kuveyt Turk INVEX-stilinde `<div class="kt-subsec">Emsal Açıklaması</div>`
kullanildi, digerleri `<h3>`.)

- `{{EMSAL_MATRISI}}` -> `buildComparableMatrixWordTableHtml()`: satirlar
  emsal alanlari (Nitelik, Emsal Konumu, Yuzolcumu, Talep Edilen Deger...),
  sutunlar YALNIZCA dolu doldurulmus emsal sayisi kadar ("Emsal 1", "Emsal
  2"...) - baska bir oturumun 0.0.99'da ekledigi genisletilmis emsal
  placeholder sistemiyle ayni motor uzerinden calisiyor, ek kod gerekmedi.
- Yapi Kredi sablonunda ayrica statik "Emsallerin Yorumu" alt basligi
  kaldirilip yeni formata gecirildi (diger 7 sablonda zaten sadece
  EMSAL_PIYASA_ANALIZI/EMSAL_TABLOSU/EMSAL_1..7 vardi, ekstra baslik yoktu).
- `tools/test-bank-templates.js`'e yeni regresyon eklendi: 8 sablonun
  TAMAMINDA `{{EMSAL_MATRISI}}` ve "Emsal Açıklaması" basligi VAR, eski
  `{{EMSAL_TABLOSU}}` / `{{EMSAL_1}}`..`{{EMSAL_7}}` YOK olarak dogrulanir
  (masraf yazisi ve Ziraat ek tablosu bu kontrolun disinda, onlarda zaten
  Emsaller bolumu yok). Boylece ileride biri eski formata donerse test kirilir.
- `templates/PLACEHOLDER-REHBERI.md` Emsaller bolumu guncellendi: yeni
  standart format basa yazildi, eski EMSAL_TABLOSU/EMSAL_1..7 "eski format
  - yeni sablonlarda kullanmayin" notuyla isaretlendi (motor hala cozer,
  geriye donuk uyumluluk icin).

Dogrulama: `tools/test-bank-templates.js` (yeni regresyonla) GECTI.
Tarayicida canli test: state.tables.comparables'a 2 sonra 5 satir konulup
`{{EMSAL_MATRISI}}` basliklarinin sirasiyla "Emsal 1, Emsal 2" ve "Emsal 1
... Emsal 5" olarak dogru sekilde dinamik degistigi dogrulandi. 10
sablonun tamami gercek uygulama verisiyle sifir eksik token ile dolduruldu,
konsolda hata yok.

Yedek:
`backups/before-emsal-matrix-format_2026-07-13_00-40-01`

---

## 0.0.102 2026-07-13 Word Ciktisi: Uygulama Renkleriyle Eslesme + Kompaktlik (Claude oturumu)

Kullanici karari: Word/rapor ciktilarindaki tablolar programin ekranda
gosterdigi tablolarla AYNI renk/bicimde olsun; ayrica punto ve bosluklar
genel olarak %30-40 kucultulsun.

- Once styles.css'teki GERCEK ekran-ici tablo stilleri incelendi
  (.malikler-table, .takyidat-table, .halkbank-risk-table,
  .valuation-summary-table): header arka plani `--blue-soft` (#e4ebf8),
  header yazisi `--blue` (#3a5691), govde metni `--ink` (#152238), kenarlik
  `--line` (#dde3ef), cift-satir tonlamasi ~#f7f9f8, toplam/ozet satiri
  koyu `#1f2a32` zemin + beyaz yazi.
- Bu paletle `app.js` `buildWordReportHtml()` CSS blogu ve 7 program-renkli
  banka sablonu (akbank, halkbank, isbankasi, vakifbank, vakifkatilim,
  yapikredi, ziraat) guncellendi: eski `#eaf0fa`/`#d9dfdc`/`#1f2a32`(metin)
  degerleri yukaridaki gercek token degerleriyle degistirildi; ayrica bu 7
  sablonda ONCEDEN HIC OLMAYAN zebra-cizgi kurali eklendi
  (`.word-table tbody tr:nth-child(even) td { background:#f7f9f8; }`).
- Kuveyt Turk sablonunun INVEX (yesil/turuncu) renk semasi KASITLI OLARAK
  DEGISTIRILMEDI - o, bankanin kendi portal gorunumunu taklit ediyor
  (onceki acik talep); yalnizca punto/bosluklari kucultuldu.
- Kompaktlik: tum 10 dosyada (app.js word CSS + 9 sablon) punto/kenar
  bosluklari ~%20-35 kucultuldu (ornek: app.js govde 10pt->7pt, h1
  20pt->14pt, h2 15pt->10pt, .word-table 8.25pt->7pt, sayfa kenar bosluklari
  42/36pt->30/26pt). Zaten kucuk olan tablo puntolari (7-8.5pt araligi)
  okunabilirligi korumak icin biraz daha az agresif kesildi (~%15-20);
  buyuk basliklar/govde metni tam istenen %30-35 araliginda kesildi.
  Kuveyt Turk zaten yogun INVEX-stili oldugundan biraz daha yumusak
  (~%20-25) kesildi.

Dogrulama: `node --check app.js`, `tools/test-bank-templates.js` (regresyon
dahil) ve diger 4 test paketi GECTI. Tarayicida canli dogrulama:
`buildWordReportHtml()` cikan HTML'de yeni renk/punto degerleri dogrulandi;
10 sablonun TAMAMI gercek uygulama verisiyle SIFIR eksik token ile
dolduruldu, program-renkli 7 sablon + Ziraat ek tablo yeni mavi
header/kenarlik renklerini iceriyor (Kuveyt Turk kendi INVEX renginde
kaliyor, masraf yazisinda zaten tablo yok), tum sablonlarda govde puntosu
beklenen kucuk degere indi; konsolda hata yok.

Yedek:
`backups/before-word-style-match-and-compact_2026-07-13_01-18-40`

---

## 0.0.103 2026-07-13 Malikler Tablosu: Ekrandaki Panelle Birebir Ayni Yapida Word Ciktisi (Claude oturumu)

Kullanici gercek "Malikler Tablosu" panelinin ekran goruntusunu paylasip
"tablo birebir eklediğim görseldeki gibi çıktısı olmalı, bankanın renk
paletini boşver" dedi. Onceki oturumda (0.0.102) renk paletini styles.css
token'larindan DOGRU cikardigim onaylandi (tarayicida getComputedStyle ile
olculdu: header #e4ebf8/#3a5691, govde #152238, kenarlik #dde3ef, TOPLAM
satiri #1f2a32/beyaz) ama YAPISAL bir eksik ortaya cikti:

- `{{MALIKLER_TABLO}}` (ve ana Word ciktisindaki "Malikler Değer Tablosu")
  `buildMaliklerTableText()` + `formatTextTableForWord()` uzerinden
  uretiliyordu - bu yol TOPLAM satirini HIC URETMIYORDU ve 7 sutun oldugu
  icin gereksiz yere yatay sayfaya (`word-landscape-section`) sokuyordu,
  ayrica deger sutunlari sola hizaliydi (ekranda saga hizali/tabular).
- Ayrica ana Word ciktisinda ("Word olarak farkli kaydet") ayni veri IKI
  KEZ goruniyordu: eksik 5 sutunlu "Malikler" (ham state.tables.title) VE
  7 sutunlu ama TOPLAM'siz "Malikler Değer Tablosu".

Yapilanlar:
- `app.js`'e yeni `buildMaliklerTableWordHtml()` eklendi: ekrandaki
  `.malikler-table` ile BIREBIR ayni yapida (7 sutun, ilk sutun kalin/sola
  hizali, deger sutunlari saga hizali/tabular, TOPLAM satiri colspan=5 +
  2 deger hucresi, koyu zemin #1f2a32 + beyaz yazi) HTML uretir. Tum
  renkler SATIR ICI (inline) stille sabitlenir - hangi banka sablonuna
  yerlestirilirse yerlestirilsin ayni gorunur, sablonun kendi marka rengi
  (orn. Kuveyt Turk yesili) veri tablosunu etkilemez.
- Ana Word ciktisinda ("Word olarak farkli kaydet"): eksik 5 sutunlu
  "Malikler" satiri regularTables'tan kaldirildi, "Malikler Değer Tablosu"
  (TOPLAM'siz) generatedTables'tan kaldirildi; yerine tek, dogru,
  "Malikler Tablosu" basligiyla `buildMaliklerTableWordHtml()` cikisi
  eklendi (rapor akisinin basinda, ekrandaki gibi).
- `template-engine.js`: `MALIKLERTABLO` takma adi artik dogrudan
  `buildMaliklerTableWordHtml()` cagiriyor (eski formatTextTableForWord+
  buildMaliklerTableText zincirini bypass eder).
- DAHA GENIS ilke (kullanicinin "program içindeki tablolar" ifadesini
  karsilamak icin): `buildSimpleHtmlTable()` (Takyidat, İncelenen Belgeler,
  Beyanlar, Rehinler, Şerhler, Emsal matrisi/degerleme, Değerleme özet,
  Halkbank risk tablolarinin ORTAK ureticisi) da SATIR ICI stille
  boyanacak sekilde yeniden yazildi (ayni #e4ebf8/#3a5691/#dde3ef/#f7f9f8/
  #1f2a32 paleti). Onceki externa CSS-sinifi tabanli yaklasim (`.word-table
  th` vb.) her banka sablonunda ayri tanimlanmasi gerektiginden kirilgandi
  ve Kuveyt Turk gibi kendi CSS'i olan sablonlarda hic uygulanmiyordu;
  simdi TUM tablolar HANGI SABLONA YERLESTIRILIRSE YERLESTIRILSIN ayni
  gorunur. className parametresi ("meta"/"is-matrix"/"is-summary") geriye
  donuk uyumluluk icin korunur, sadece DAVRANISI artik satir ici stille
  uygulanir.
- `tools/test-bank-templates.js`'e iki yeni regresyon eklendi: (1)
  MALIKLERTABLO'nun buildMaliklerTableWordHtml() kullandigini, (2) bu
  fonksiyonun gercekten `colspan="5"` ve `>TOPLAM<` icerdigini dogrular -
  ileride biri eski (TOPLAM'siz) yola donerse test kirilir.

Dogrulama: `node --check app.js`, `tools/test-bank-templates.js` (yeni
regresyonlar dahil) ve diger 4 test paketi GECTI. Tarayicida ekran
goruntusundeki GERCEK verilerle (Enis Kaya, Kemal Kaya, Çiğdem Kaya Dağlı,
1/3 hisse, 3.900.000 TL yasal/mevcut) `buildMaliklerTableWordHtml()`
cagrildi - cikti BIREBIR eslesti: ENİS KAYA/KEMAL KAYA/ÇİĞDEM KAYA DAĞLI,
1/3, SATIŞ, 20.08.2021, 29515, 1.300.000 TL x2, TOPLAM satirinda
3.900.000 TL x2, koyu zemin+beyaz yazi, colspan=5, landscape'e SOKULMUYOR.
10 sablonun tamami sifir eksik token ile dolduruldu (MALIKLERTABLO dahil),
konsolda hata yok. check-basic.js, benimle ilgisiz onceden bilinen
app.js surum-pin farkindan dolayi basarisiz (baska oturumun hizli surum
artislari) - dokunulmadi.

Yedek:
`backups/before-word-style-match-and-compact_2026-07-13_01-18-40` (bu
oturumun 0.0.102 ile paylastigi yedek; ek yedek alinmadi cunku ayni
oturumun devami niteliginde).

## 0.0.104 2026-07-13 Rapor Ciktisi Tablolarinda Ekranla Tema ve Yapi Eslesmesi (Codex oturumu)

- `app.js`: `Değerleme Özet Tablosu`, ekrandaki `buildValuationSummaryGroups()` verisini kullanarak grup bantlari ve Kalem / Birim Değer / Tutar sutunlariyla Word/HTML raporuna aktariliyor. Eski duz metin tablosu yolu bu tablo icin devre disi birakildi.
- `app.js`: Ortak `buildSimpleHtmlTable()` ve `buildMaliklerTableWordHtml()` ciktilari satir ici stille uretiliyor; tablo siniflari banka sablonunun CSS'i tarafindan ezilmeden uygulama tablolarina yaklasiyor.
- `app.js`: Rapor CSS'i ve tablo renkleri secili tema tokenlarindan (`--ink`, `--line`, `--blue`, `--blue-soft`, `--surface`, `--surface-muted`, `--green`) okunuyor. Apple / Navy Blue secimi rapor ciktilarina da yansiyor.
- `src/templates/template-engine.js`: `DEGERLENDIRMETABLOSU` dogrudan ekranla uyumlu ozet tablo uretecini, `MALIKLERTABLO` ise ekranla uyumlu malik tablosunu kullaniyor.
- Dogrulama: `app.js` ve `src/templates/template-engine.js` syntax kontrolleri, `tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js` ve `git diff --check` basarili.

## 0.0.105 2026-07-13 Güvenlik Sertleştirme Turu (Claude oturumu)

Kullanıcı `Downloads/güvenlik.md` (12 kural + AI/LLM eki: secret yönetimi,
rate limiting, input validation, auth, SQL injection, CORS, HTTP güvenlik
header'ları, dosya yükleme, hata yönetimi, bağımlılık güvenliği, XSS/CSP,
deploy kontrol listesi) paylaşıp "bu dosyadaki mümkün olan tüm güvenlik
adımlarını ve aklına gelen diğer önlemleri son handoff ve graphify'ı
inceledikten sonra uygula" dedi. Önce `graphify explain "server.js"` ile
sunucunun gerçek yüzeyi çıkarıldı (POI API, PDF metin API, Overpass proxy,
state API, statik dosya sunumu) ve `PROGRAM-DEGERLENDIRME-VE-YOL-HARITASI.md`
(2026-06-21 tarihli, bu oturumdan önce yazılmış) okunarak İKİ bilinen ama
henüz düzeltilmemiş risk teyit edildi: (1) `resolved.startsWith(root)`
path-traversal kontrolü kardeş-klasör açığına sahipti, (2) `/api/state`
0.0.0.0 üzerinde auth'suz dinliyor.

`server.js` sertleştirmeleri:
- **Path-traversal + hassas-yol düzeltmesi**: `resolveStaticPath` artık
  `root + path.sep` karşılaştırıyor (eski `startsWith(root)` kardeş klasörü
  root sanabiliyordu). Ayrıca `backups/`, `.git/`, `node_modules/`,
  `graphify-out/`, `.env*` ve `server-data/` altındaki KİŞİSEL dosyalar
  (`active-case.json`, `user-pois.json`, `uploads/`) artık statik olarak
  hiç sunulmuyor (403). **Önemli düzeltme**: ilk denemede `server-data/`
  klasörünün TAMAMINI kapatmıştım ama bu, `app.js`'in runtime'da fetch
  ettiği paylaşılan referans veri setlerini (`bursa_manuel_duzeltilmis_
  ana_dosya.csv`, `adlandirilmis_hucreler_listesi.json` — mahalle/adres
  eşleştirme tabloları, kişisel veri değil) kırdı; tarayıcıda 403 görüp
  fark ettim ve denylist'i yalnızca gerçekten kişisel dosyalara daralttım.
- **Güvenlik header'ları + CSP**: tüm yanıtlara `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, ve bir CSP eklendi. CSP
  `script-src`'te `'unsafe-inline'` + `unpkg.com` (Leaflet) içeriyor —
  proje build'siz vanilla JS olduğu ve birkaç sayfa-içi `<script>` bloğu
  bulunduğu için kaçınılmaz bir bilinen sınırlama (yorum olarak
  belgelendi); `connect-src`/`img-src`/`worker-src` gerçek kullanılan tüm
  üçüncü taraf origin'leri (Overpass aynaları, Nominatim, ArcGIS, OSM/
  ArcGIS tile sunucuları, `*.googleapis.com`/`*.firebaseio.com`) açıkça
  beyaz listeye alındı.
- **Rate limiting**: harici bağımlılık eklemeden basit bellek-içi sabit-
  pencere sayaç (`/api/state` 60/dk, `/api/user-pois` 60/dk, `/api/overpass`
  30/dk, `/api/pdf-text` 5/dk — dosya yükleme için güvenlik.md'nin önerdiği
  daha sıkı limit), aşımda `Retry-After` header'lı 429.
- **CSRF sertleştirmesi**: POST/PUT mutasyon uçlarında özel `X-Rapor-Client`
  header'ı zorunlu kılındı (+ varsa Origin/Host eşleşmesi kontrolü). Sunucu
  cross-origin'e CORS izni vermediği için bu header tarayıcıyı preflight'a
  zorluyor ve kullanıcı çalışırken açık bir kötü niyetli sekmenin sessizce
  bu sunucuya yazma isteği göndermesini (drive-by CSRF) engelliyor.
  Overpass'ın kendi ayna sunucularına giden GEÇİCİ/ÜÇÜNCÜ TARAF isteklerine
  bu header EKLENMEDİ (aksi halde onların CORS'u isteği reddedebilirdi).
- **Input validation**: `/api/user-pois` artık lat/lng'yi Türkiye sınırları
  içinde olacak şekilde (35-43 / 25-45) ve ismi kontrol karakterlerinden
  temizleyerek doğruluyor; `/api/overpass` sorgu uzunluğu 20.000 karakterle
  sınırlandı; `/api/pdf-text` artık ilk baytlardaki `%PDF-` imzasını
  doğruluyor (istemcinin content-type beyanına güvenmiyor) ve dosya boyutu
  limiti 25MB'a çekildi (güvenlik.md'nin doküman önerisiyle uyumlu).
- **Hata yönetimi**: istemciye artık ham `error.message`/stack sızmıyor;
  tüm hata yolları `console.error` ile sunucu tarafında zaman damgalı
  loglanıp istemciye genel mesaj dönüyor.

`app.js`: üç `/api/*` fetch çağrısına (`readPdfTextOnServer`,
`saveUserPoiFromMap`, `saveUserMainArteryFromMap`) ve `fetchNearbyEndpoint`
içindeki KENDİ `/api/overpass` proxy çağrısına (üçüncü taraf ayna
sunucularına DEĞİL) `X-Rapor-Client` header'ı eklendi. `escapeHtml()`'e
tek tırnak (`'` → `&#39;`) kaçışı eklendi (savunma derinliği; mevcut 137
çağrı yeri zaten `"` kullanıyordu, kırılma riski yok).

`.gitignore`'a `.env`/`.env.local`/`.env.*.local` eklendi (proje şu an
secret kullanmıyor — Firebase apiKey zaten istemciye açık olması gereken
public bir değer, güvenlik sınırı Firestore Rules'ta — ama güvenlik.md'nin
1. kuralı ileriye dönük olarak istiyor).

**Kapsam dışı bırakılanlar (mimari olarak uygulanamaz, güvenlik.md'de var
ama bu projede karşılığı yok)**: SQL injection (SQL veritabanı yok),
JWT/parola/hesap kilitleme (auth Firebase Authentication'a devredilmiş,
kendi auth'umuz yok), LLM/prompt-injection/token bütçesi (uygulama içinde
hiçbir LLM API çağrısı yok), Zod/Pydantic şema doğrulama kütüphaneleri
(proje sıfır npm bağımlılığıyla çalışıyor; validation elle, aynı ilkeyle
yazıldı).

**Bilinçli olarak ERTELENEN (düzeltilmedi, güvenlik.md'nin isteyeceği ama
mevcut mimariyi kırma riski taşıyan)**: `/api/*` uçları hâlâ auth'suz;
`server.js` hâlâ `0.0.0.0`'da dinliyor (mobil-sunucu-baslat.bat özelliği
kasıtlı). PIN/token tabanlı LAN erişim auth'u zaten `PROGRAM-DEGERLENDIRME-
VE-YOL-HARITASI.md`'de P1 olarak not düşülmüş; bu turda CSRF sertleştirmesi
+ rate limit + validation ile "sürüş-geçişi" (drive-by) senaryosunu
kapattım ama aynı Wi-Fi'daki başka bir cihazın doğrudan `curl` ile
`/api/state`'e erişimini engellemiyor — bu, mevcut D7 (client-side auth
gate, server.js her isteği koşulsuz sunuyor) ile aynı ruhta, dürüstçe
açıklanmış bir sınırlama.

Doğrulama: `node --check` (server.js, app.js), tam test paketi
(`check-basic.js` + 4 parser testi + `test-bank-templates.js`) YEŞİL.
Ayrıca canlı sunucuya karşı `curl` ile: sensitive-path denylist (403),
path-traversal, CSRF header zorunluluğu (header'sız 403, header'lı 200),
koordinat doğrulama (Türkiye dışı 400), rate limit (6. istekte 429 +
Retry-After), PDF magic-byte kontrolü (sahte içerik 400, gerçek PDF —
`test-inputs/adres.pdf` — 200 ve metin çıkarıldı) tek tek test edildi.
Tarayıcıda: konsolda CSP ihlali YOK, Leaflet (unpkg) yüklendi, ArcGIS/OSM
tile görselleri yüklendi, gerçek Firestore/Auth senkronu ("Bulut ile
eşleşti.") çalışıyor durumda kaldı. Test sırasında `/api/user-pois`'e
yanlışlıkla eklenen "test" kaydı `server-data/user-pois.json`'dan temizlendi.

Ayrıca (bu turun kapsamına giren, ilgisiz ama check-basic.js'i bozan iki
sürüm/kalite farkı düzeltildi): `check-basic.js`'in `app.js`/`styles.css`/
`template-engine.js` sürüm-pin'leri gerçek `index.html` değerleriyle
eşitlendi (`app.js?v=20260713-0300`'e ben de bump ettim); ayrıca başka bir
oturumun "Deprem Derecesi" alanını `defaultValue: "1. Derece"`'den `""`'e
ve seçenekleri betimleyici hale getirmesiyle bayatlamış tek bir assertion
satırı, bu artık kasıtlı bir özellik değişikliği olduğu için kaldırıldı.

Yedek: `backups/before-security-hardening_2026-07-13_02-45-00/` (server.js,
app.js, index.html, .gitignore, tools/check-basic.js).

## 0.0.106 — 2026-07-13 — P1 API Guvenligi ve Deployment Sertlestirmesi

Onaylanan P1 kapsaminda su degisiklikler yapildi:

- `server.js` Firebase Authentication ID tokenlarini Firebase'in resmi
  sertifikalariyla dogruluyor. `/api/state`, `/api/user-pois`, `/api/overpass`
  ve `/api/pdf-text` artik oturumsuz isteklere 401 donuyor.
- `active-case.json` ve kullanici noktasi dosyalari artik Firebase UID'ye
  gore `server-data/users/<uid>/` altinda ayriliyor.
- Varsayilan Node host'u `127.0.0.1` oldu. Windows mobil baslatma dosyasi
  `HOST=0.0.0.0` verdigi icin tablet/telefon akisi korunuyor.
- `ecosystem.config.cjs` eklendi. PM2 deployment'i 5174 portunda localhost'a
  bagli, yeniden baslatilabilir ve kalici bir konfigurasyon kullaniyor.
- GitHub Actions deployment'i `pm2 startOrRestart ecosystem.config.cjs` ve
  localhost health check kullanacak sekilde guncellendi.
- Nginx reverse proxy ve Let's Encrypt ilk kurulum scripti eklendi:
  `deploy/nginx/rapor-yazma.conf.template`, `deploy/ubuntu/setup-https.sh`.
- API istemcileri Firebase ID tokenini `Authorization: Bearer` header'i ile
  gonderiyor; `cloud/cloud-sync.js` icinden `getIdToken()` acildi.

Dogrulama: Node syntax kontrolleri, temel kontrol, parser testleri, KML,
Imar, EKB ve banka sablon testleri basarili. Yerel smoke testte statik kok
200, token olmadan `/api/user-pois` 401 dondu.

Graphify code-only harita guncellendi: 18.578 dugum, 41.896 baglanti,
404 community. Dokuman/paper/image semantik guncellemesi API anahtari
gerektirdigi icin bu turda code-only tarama kullanildi.

Yedek: `backups/before-p1-security-deploy_2026-07-13_14-45-24/`.

## 0.0.107 2026-07-17 Gabim Veri Seti: Gayrimenkul Türüne Göre Koşullu Yapı (Claude oturumu)

Kullanıcı GDYS'nin (Denge Değerleme Gayrimenkul Değerleme Yönetim Sistemi)
gerçek "Gabim Veri Seti" formunun 4 farklı gayrimenkul türü için (Arsa,
Konut, Diğer Bina, Arazi) ekran görüntüsünü paylaşıp banka şablonlarındaki
Gabim Veri Seti bölümünün bu şekle uydurulmasını istedi. İnceleme:
şablonlardaki `<h2>GABİM VERİ SETİ</h2>` bölümü (Türkçe İ karakteri yüzünden
ilk taramada gözden kaçtı) sabit, türden bağımsız TEK bir alan listesi
gösteriyordu — GDYS'nin gerçek formu ise Mülkiyet/Yasal Kullanım Niteliği'ne
göre grup/alan kümesini değiştiriyor (ör. Arsa'da Yapıya Özel Bilgiler/Ek
Bilgiler hiç yok; Arazi'de ayrıca "Araziye Özel Bilgiler" var; Konut'ta tam
Cephe/Kat detayları var; diğer bina türlerinde (İşyeri/Ofis/Ticari/Sanayi)
sade Ek Bilgiler + sadece Enerji Sınıfı var).

Yapılanlar (`app.js`):
- `landClassification` ("Arazi Sınıflandırması" — Mutlak/Dikili/Özel Ürün/
  Marjinal/Örtü Altı Tarım Arazisi) alanı "Arsa Özellikleri" bölümüne eklendi
  — GDYS'nin Arazi formunda var, uygulamada hiç yoktu.
- `gabimPropertyProfile()`: `ownershipType` (Arsa/Tarla → bina yok) ve
  `legalUsageNature` (Arazi/Konut) alanlarından `{hasBuilding, isAgricultural,
  isResidential}` çıkarır.
- `gabimManagerText()`: "Yönetici Var mı?" — site içindeyse Var sayılır.
- `buildGabimDataGroups()` (ekran paneli — DEĞİŞMEDİ, hâlâ TÜM alanları
  gösterir, kullanıcı GDYS'ye elle veri girerken referans olsun diye) ek
  olarak yeni "Araziye Özel Bilgiler" grubu, "Yönetici Var mı?" ve "Enerji
  Sınıfı" satırları, "Ana Ulaşım Yoluna Cephesi Var mı?" satırı kazandı —
  bunlar sadece EKLEME, mevcut hiçbir satır kaldırılmadı.
- `buildGabimExportGroups()` (YENİ, sadece rapor/Word çıktısı için): ekran
  panelinin üst kümesini `gabimPropertyProfile()`'a göre budar — GDYS'nin 4
  ekran görüntüsündeki gerçek grup/alan kümesini birebir üretir. Ayrıca tüm
  satırları boş olan grupları (ör. hiç veri girilmemiş taslak raporlarda)
  otomatik gizler.
- `buildGabimDataSetWordHtml()` (YENİ): export gruplarını, diğer tablolarla
  aynı ilkeyle (satır içi stil, `getReportThemeToken` ile seçili temaya göre
  renk — Apple/Navy Blue) her grup için ayrı bir başlık + iki sütunlu
  (etiket/değer) tablo olarak üretir. Başlık metnini KENDİSİ üretmez (her
  banka şablonu kendi "GABİM VERİ SETİ" başlığını `<h2>`/`<div class="kt-sec">`
  ile zaten sağlıyor — MALIKLER_TABLO ile aynı kural).

`src/templates/template-engine.js`: `GABIMVERISETI: { h: () => safeCall
("buildGabimDataSetWordHtml") }` eklendi.

Şablonlar: 10 dosyadan raporun tamamını oluşturan 8'inde (isbankasi-masraf.html
ve ziraat-ek-tablo.html hariç — bunlar masraf yazısı/ek tablo, Gabim bölümü
hiç yok) eski sabit `<table class="meta">`/`<table class="kt-form">` alan
listesi silinip yerine `{{GABIM_VERI_SETI}}` konuldu; başlık (`<h2>GABİM
VERİ SETİ</h2>` veya Kuveyt Türk'te `<div class="kt-sec">`) korundu.

`templates/PLACEHOLDER-REHBERI.md`: yeni "Gabim Veri Seti" bölümü — hangi
türde hangi grupların göründüğünü ve ekran panelinin neden hâlâ tam liste
gösterdiğini açıklıyor.

`tools/test-bank-templates.js`: 8 şablonda `{{GABIM_VERI_SETI}}` varlığını
ve eski sabit tablo formatına dönülmediğini, `GABIMVERISETI` motor
kaydının ve `gabimPropertyProfile`/`buildGabimExportGroups`/
`buildGabimDataSetWordHtml` fonksiyonlarının/`landClassification` alanının
var olduğunu doğrulayan regresyon testleri eklendi.

Doğrulama: `node --check` (app.js, template-engine.js, test-bank-templates.js),
tam test paketi YEŞİL. Tarayıcıda canlı state manipülasyonuyla 4 senaryo
(Arsa/Arsa, Arsa/Arazi, Dikey Kat İrtifakı/Konut, Müstakil Bina/İşyeri) tek
tek `buildGabimExportGroups()` ile çalıştırıldı — grup listeleri 4 ekran
görüntüsüyle eşleşti (Arsa: Genel Ek Bilgiler+Tapu Bilgileri+Tapuya Özel
Bilgiler+Bağımsız Bölüm+İmar; Arazi: +Araziye Özel Bilgiler; Konut: +Yapıya
Özel+Yapı Tür+tam Ek Bilgiler+Cephe/Kat detaylı Bağımsız Bölüm; Diğer Bina:
+Yapıya Özel+sade Ek Bilgiler+sadece Enerji Sınıflı Bağımsız Bölüm). Gerçek
`templates/akbank.html` dosyası `fetch` ile çekilip `RaporTemplates.
fillTemplate()`'den geçirildi — GABİM VERİ SETİ başlığının altında doğru
üretilmiş, seçili temanın renklerini kullanan tablo HTML'i doğrulandı.
Ekrandaki Gabim paneli (`activeSectionId = "gabimData"`) hatasız render
oldu, 9 grup + 81 alan gösterdi (yeni Araziye Özel Bilgiler dahil). Konsol
hatasız.

Not: `Ana Ulaşım Yoluna Cephesi Var mı?` mevcut `landRoadFrontage` ("Kadastro/
İmar Yoluna Cepheli mi?") alanına, `Yönetici Var mı?` site-içi durumuna eşlendi
— GDYS'de ayrı/bağımsız alanlar olabilir; ekran görüntülerindeki tam etiket
eşleşmesi teyit edilemedi, kullanıcı düzeltme isterse hızlı bir takip işi.

Yedek: `backups/before-gabim-veri-seti-format_2026-07-17_06-47-49/`.

## 0.0.115 - 2026-07-17 - Ziraat Bankası açıklama bölümleri

Ziraat Bankası rapor akışına Açıklamalar bölümünde üç otomatik panel eklendi:

- `Ziraat Bankası - Konumu ve Çevresel Özellikleri`
- `Ziraat Bankası - Bölgenin Gelişimine İlişkin Analiz`
- `Ziraat Bankası - Bölgedeki Yapılaşma Durumu`

Paneller yalnızca Ziraat Bankası seçildiğinde görünür. Metinler; adres, yakın
çevre, ana arter, altyapı, yapılaşma yoğunluğu, sosyal ihtiyaç mesafesi, yapı
yaşı, gelir seviyesi, yapılaşma nizamı, yapılaşma hızı, kat aralığı ve planlama
uyumu alanlarından otomatik üretilir. Alan değişikliklerinde açık panelin
metni ve görünürlük durumu dinamik olarak güncellenir.

Ziraat şablonuna şu placeholderlar eklendi:
`{{ZIRAAT_KONUM_CEVRESEL}}`, `{{ZIRAAT_BOLGE_GELISIMI}}`,
`{{ZIRAAT_YAPILASMA}}`. Placeholder rehberi güncellendi.

Doğrulama: `node --check app.js`, `node --check src/templates/template-engine.js`,
`tools/check-basic.js`, `tools/test-bank-templates.js` ve `git diff --check`
başarılıdır.

Yedek: `backups/before-ziraat-explanation-sections_2026-07-17_08-45-17/`.

## 0.0.116 2026-07-17 Glass Tema Profili (Claude oturumu)

Kullanıcı `C:\Users\90551\OneDrive\Masaüstü\claude\design_handoff_glass_theme\`
klasöründe Claude Design ile hazırladığı bir tasarım handoff'u paylaşıp
"tokens/theme-glass.css dosyasını sistemimize yükle" dedi. Bu klasör
uygulamanın üçüncü, opt-in bir tema profili ("Glass" — buzlu cam/
glassmorphism: yarı saydam yüzeyler, backdrop blur, arkada kayan renkli
gradyan) için tam bir tasarım referansı içeriyordu (README.md +
`tokens/theme-glass.css` + `tokens/colors.css` + `ui_kit/*.jsx` click-through
prototip).

Handoff'un kendi token adlandırması (`--brand`, `--accent`, `--warning`,
`--danger`, genel `[data-theme="glass"]` seçicisi, var olmayan `.ds-surface`
sınıfı) uygulamanın gerçek CSS değişken adları ve seçicileriyle (bkz.
`themes/apple.css`/`navy-blue.css`: `body[data-app-theme="X"]`,
`--green/--green-soft/--green-strong/--green-bright/--blue/--blue-soft/
--amber/--amber-soft/--red`, gerçek yüzey sınıfları `.section-card`,
`.assistant-panel`, `.panel-block`, `.status-strip article`, `.mobile-flow`,
`.subsection`, `.table-shell`, `.sidebar`) BİREBİR EŞLEŞMİYORDU — sadece
renk/blur/gölge DEĞERLERİ korunarak gerçek adlandırmaya uyarlandı (ör.
handoff'un `--brand:var(--navy-700)`'ı → `--green:#213f77`; `--accent:
var(--navy-600)`'ı → `--blue:#2d59ab`; genel `aside/article/.ds-surface`
seçicileri → apple.css'in zaten kullandığı gerçek yüzey sınıf listesi).

Yapılanlar:
- `app/themes/glass.css` (YENİ): `body[data-app-theme="glass"]` kapsamında
  tam token bloğu (bg/surface/ink/line/green/blue/amber/red/gold/shadow/ring),
  arka planda üç radyal gradyanlı sabit `::before` katmanı, gerçek yüzey
  sınıflarına + `table/th/input/select/textarea/button`'a `backdrop-filter:
  blur(20px) saturate(180%)`, kenar çubuğuna (`.sidebar`) ayrı koyu-lacivert-
  camsı gradyan + kenarlık, `input/select/textarea` için `!important`'lı
  yarı saydam beyaz zemin (blur kuralını yenmek için — handoff'taki gibi).
- `index.html`: `themes/glass.css` linki eklendi; `#themeProfileSelect`'e
  üçüncü seçenek `<option value="glass">Glass</option>` eklendi.
- `app.js`: tema seçim mantığı düzeltildi — eski kod `value === "navy-blue"
  ? "navy-blue" : "apple"` şeklinde İKİLİ bir ternary idi ve "glass" seçilse
  bile sessizce "apple"a zorlardı. `normalizeThemeProfile()` ile üç geçerli
  değeri (`apple`/`navy-blue`/`glass`) tanıyan bir whitelist'e çevrildi.
- `THEME-PROFILES.md`: Glass profili + kaynağı belgelendi. Ayrıca ÖNEMLİ bir
  kapsam notu eklendi: bu üç profil sadece ANA ÇALIŞMA ALANINA
  (`data-app-theme`) uygulanıyor — giriş ekranının (auth gate) kendi ayrı
  açık/koyu geçişi (`data-gate-theme`, `data-gate-theme-btn`) var ve bu turda
  DOKUNULMADI. Handoff'un README'si Glass'ı hem workspace hem auth gate için
  tarif ediyordu ama ikisi kodda birbirinden bağımsız iki ayrı mekanizma;
  gate'in ikili aç/kapa toggle'ını üçlü hale getirmek ayrı bir karar/iş
  gerektirdiği için kapsam dışı bırakıldı — kullanıcı isterse ayrı istenebilir.

Doğrulama: `node --check app.js`, tam test paketi (check-basic + 4 parser +
test-bank-templates) YEŞİL. Tarayıcıda canlı test: select'te 3 seçenek de
mevcut (`apple/navy-blue/glass`), "glass" seçilince `body[data-app-theme]`
doğru güncelleniyor, gövde arka planı doğru gradyan, `.sidebar` doğru blur +
gradyan, `.section-card` doğru blur + yarı saydam beyaz zemin gösteriyor;
apple→navy-blue→glass ileri-geri geçişler ve localStorage kalıcılığı
(`raporAppTheme`) sorunsuz; konsolda hata yok.

Yedek: `backups/before-glass-theme_2026-07-17_10-24-00/`.

## 0.0.117 - 2026-07-17 - Ziraat açıklamalarının Adres ve Konum'a taşınması

- Banka alanında Ziraat Bankası seçiliyken Adres ve Konum bölümündeki standart
  `Çevresel özellikler açıklaması` alanı gizlenir.
- Bunun yerine `Ziraat Bankası - Konumu ve Çevresel Özellikleri`, `Ziraat
  Bankası - Bölgenin Gelişimine İlişkin Analiz` ve `Ziraat Bankası - Bölgedeki
  Yapılaşma Durumu` otomatik açıklama kartları Adres ve Konum bölümünde
  gösterilir.
- Ziraat dışındaki bankalarda mevcut çevresel açıklama alanı korunur; üç kart
  açıklamalar bölümünde tekrar oluşturulmaz.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js` ve `git diff --check` başarılı.

Yedek: `backups/before-ziraat-address-environment-sections_2026-07-17_10-25-24/`.

## 0.0.118 - 2026-07-17 - Taleplerim kartlarında konum özeti

- Yerel ve bulut rapor kartlarında Konum bilgisine mahalle eklendi.
- Ada/Parsel özeti artık `titleAdaParsel`/`adaParsel` bulunmadığında `blockNo`
  ve `parcelNo` alanlarından otomatik oluşturuluyor.
- Bulut özet payload'ına da mahalle ve ada/parsel alanları eklendi.

Doğrulama: `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi kontrolü,
`tools/check-basic.js` ve `git diff --check` başarılı.

## 0.0.120 - 2026-07-17 - Minimum içerik eşiği ve boş talep filtresi

- Rapor kütüphanesine alınmadan önce düzenlenebilir alanlar ve yüklenen temel
  belgeler üzerinden doluluk hesabı yapılır.
- Toplam düzenlenebilir alanların en az `%5`'i veya en az 5 anlamlı veri dolu
  değilse rapor yerel kütüphane indeksine yazılmaz.
- Aynı eşik bulut senkron gönderiminde ve Taleplerim kartı listelemesinde de
  uygulanır; eski boş yerel/bulut kartları otomatik gizlenir.
- Boş kayıtlar filtrelenirken sekme sayaçları da yalnızca geçerli talepleri
  sayar.

Doğrulama: `app.js`, `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi
kontrolleri, `tools/check-basic.js` ve `git diff --check` başarılı.

Yedek: `backups/before-library-minimum-content_2026-07-17_14-20-36/`.

Yedek: `backups/before-library-location-summary_2026-07-17_10-53-56/`.

## 0.0.119 - 2026-07-17 - Taleplerim belge durum kutucukları

- Talep kartlarının üst kısmına beş küçük belge durum kutusu eklendi:
  `T` (TAKBİS), `U` (Adres Kodu), `I` (İmar Durumu), `E` (Enerji Kimlik
  Belgesi) ve `K` (KML / Konum).
- Yüklenen belgeler yeşil, yüklenmeyenler kırmızı gösterilir; her kutuda
  bölüm adı ve yüklenme durumu tooltip/erişilebilir etiket olarak bulunur.
- Durumlar yalnızca boolean özet olarak tutulur; gerçek dosyalar bulut
  senkron paketine eklenmez.
- Eski yerel taslaklar kart çizimi sırasında blob içinden yeniden özetlenerek
  yeni mahalle, ada/parsel ve belge durumlarını gösterebilir.

Doğrulama: `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi kontrolü,
`tools/check-basic.js` ve `git diff --check` başarılı.
## 0.0.121 - 2026-07-17 - Bos taslaklar icin siki cekirdek icerik filtresi

- Varsayilan banka, il ve ilce alanlari tek basina rapor icerigi sayilmaz.
- Yerel ve bulut kartlarinda musteri, mahalle, ada/parsel veya temel belge cekirdek icerik olarak aranir.
- Bulut ozetlerine doluluk adedi ve yuzdesi eklenmis, eski ozetler de cekirdek icerik kontroluyle filtrelenmistir.

Dogrulama: app.js, cloud/report-library.js ve cloud/cloud-sync.js syntax kontrolleri, tools/check-basic.js ve git diff --check basarilidir.

Yedek: backups/before-library-minimum-content_2026-07-17_14-20-36/.
## 0.0.122 - 2026-07-17 - Taleplerim liste görünümü

- Taleplerim ekranına Kart/Liste görünüm seçici eklendi.
- Liste görünümünde aynı rapor kartları tek satırlı, hızlı taranabilir bir düzende gösterilir; belge durumları, konum bilgileri ve işlem düğmeleri korunur.
- Seçilen görünüm `rapor-library-view-mode` anahtarıyla cihazda saklanır ve mobil ekranda otomatik olarak dikey düzene uyarlanır.

Doğrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve `git diff --check` başarılı.

## 0.0.123 2026-07-17 Giriş Ekranı Arka Planı: Statik Görsel Yerine Döngülü Video (Claude oturumu)

Kullanıcı bir video linki (CloudFront CDN, `hf_...mp4`, ~2.4MB, 1280x720)
paylaşıp "açılış ekranında arka plandaki görsel yerine yerleştir, loop
şeklinde dönebilir" dedi. Video `app/assets/gate-bg/gate-bg-video.mp4`'e
indirildi (mevcut `blueprint-background.png`/`-dark.png` ile aynı klasör,
karşılaştırılabilir boyut — ek ağ yükü yok denecek kadar az).

Yapılanlar:
- `index.html`: gate-scene DOM'una `<video class="gate-video" autoplay muted
  loop playsinline preload="auto">` eklendi (`.gate-blueprint`'ten önce, en
  arkada). `prefers-reduced-motion: reduce` tercihi olan kullanıcılar için
  video JS ile duraklatılıyor (mevcut `reduceMotion` kontrolüne eklendi —
  zaten parçacık/parallax animasyonlarını kapatan aynı mantık).
- `styles.css`: yeni `.gate-video` kuralı (`position:absolute; inset:-2%;
  object-fit:cover; z-index:0`). `.gate-blueprint`'in `background-image`'inden
  PNG katmanı (`url(...)`) kaldırıldı — yalnızca ince mavi/beyaz ızgara
  çizgileri kaldı, artık videonun ÜZERİNDE teknik bir doku katmanı olarak
  duruyor (koyu tema opaklık 0.34, açık tema 0.22→0.18 küçük ayarlamayla).
  Video hem açık hem koyu gate temasında aynı — kullanıcı tek video verdi,
  tema başına ayrı video yok; ızgara/vinyet renkleri temaya göre değişmeye
  devam ediyor.
- `styles.css`'te `#authGateOverlay .gate-blueprint`/`[data-gate-theme="light"]`
  kurallarının ikisi de `background-size`'daki üçüncü ("cover", PNG'ye ait)
  değeri kaldıracak şekilde güncellendi.

Doğrulama: `node --check` gerek yok (CSS/HTML), `tools/check-basic.js` ve
`tools/test-bank-templates.js` YEŞİL. Tarayıcıda canlı doğrulama: video
elementi doğru kaynaktan yükleniyor (`readyState:4`, 1280x720), `paused:
false`, `loop/muted/autoplay: true`, hata yok; `.gate-blueprint` artık
`background-image`'inde `url(...)` İÇERMİYOR (yalnızca ızgara), doğru
z-index sırasıyla videonun üzerinde görünüyor; `elementFromPoint` ile üstte
`.gate-blueprint` olduğu (vinyet/parçacıklar da üstte kalmaya devam ediyor)
doğrulandı. Açık/koyu tema geçişi test edilirken CSS `transition: opacity
0.4s` yüzünden ardışık senkron testlerimde YANILTICI bir "hep 0.34" okuması
aldım (her test kendi perturbation'ıyla geçişi sıfırlıyordu) — temiz bir
sayfa yüklemesiyle (`localStorage` önceden "light" set edilip yeniden
yüklenerek, hiç geçiş TETİKLENMEDEN) doğru değerin (0.18) uygulandığı
kanıtlandı; gerçek kullanıcı deneyiminde bu bir sorun değil, sadece kendi
test metodolojimin bir artefaktıydı.

Cache-buster: `styles.css?v=20260717-1620` (index.html + check-basic.js pin
birlikte güncellendi). `gate-bg-video.mp4` versiyonsuz referans edildi —
mevcut PNG'lerle aynı konvansiyon (bu ikisi de hiç `?v=` almıyor).

Not: Bu video yalnızca giriş ekranının (auth gate) arka planına eklendi;
ana çalışma alanının Apple/Navy Blue/Glass tema sistemiyle (bkz. 0.0.116)
ilgisi yok, ayrı bir mekanizma.

Yedek alınmadı (küçük, kolay geri alınabilir bir değişiklik; git ile
izlenebilir durumda).
## 0.0.123 - 2026-07-17 - Talep kartlarÄ±ndan randevu rozetinin kaldÄ±rÄ±lmasÄ±

- Taleplerim kartlarÄ±ndaki `Randevu: ...` gecikme ve kalan gÃ¼n rozeti kaldÄ±rÄ±ldÄ±.
- Kart/liste gÃ¶rÃ¼nÃ¼mlerindeki diÄŸer durum, belge ve iÅŸlem alanlarÄ± korunuyor.

DoÄŸrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.124 2026-07-17 Üç Yeni Tema Profili: Aurora, Clay, Neumorphism (Claude oturumu)

Kullanıcı `C:\Users\90551\OneDrive\Masaüstü\claude\Experify Design System\`
klasörünü paylaşıp "bu klasördeki 3 yeni oluşturulmuş temayı temalar
bölümüne ekle" dedi. Bu klasör, önceki Glass tema handoff'unun (0.0.116)
işaret ettiği tam "Experify Design System" projesiydi — `readme.md`'de
"Altı tema profili" olarak Navy Blue/Apple/Glass'ın yanına 3 yeni "stil
keşfi" tanımlıyordu: `tokens/theme-aurora.css`, `tokens/theme-clay.css`,
`tokens/theme-neumorphism.css`.

Aynı Glass yöntemi tekrarlandı: kaynak dosyaların `--brand/--accent/
--warning/--danger` + genel `[data-theme]`/`aside/article/.ds-surface`
sözlüğü, uygulamanın gerçek `body[data-app-theme="X"]` seçicisine ve gerçek
değişken/sınıf adlarına (`--green/--blue/--amber/--red`, `.sidebar/
.section-card/.assistant-panel/.panel-block/.status-strip article/
.mobile-flow/.subsection/.table-shell`) birebir renk/gölge/blur DEĞERLERİ
korunarak uyarlandı.

Yapılanlar (`app/themes/` altında 3 YENİ dosya):
- `aurora.css`: Lacivert+gold+teal 4 radyal "blob"un 18s'de yavaşça
  döndüğü sabit bir arkaplan (`::before`, `blur(70px)`), üzerinde
  neredeyse-opak beyaz (`rgba(255,255,255,.80-.92)`) + `blur(14px)
  saturate(160%)` yüzeyler. Teal (`#1f9e8f`) etkileşim rengi olur.
- `clay.css`: Pastel periwinkle taban (`#eceafd`/`#f6f5ff`), imza üçlü
  gölge (dış gölge + 2 iç gölge — açık rim + koyu gölge), kenarlıksız,
  büyük köşe yuvarlaklığı (18-34px), düğmeler `:active`'te 1px aşağı kayar.
- `neumorphism.css`: Monokromatik "soft-UI" — yüzeyler sayfayla AYNI renkte
  (`#e4e9f2`), yalnızca iki yönlü gölge çiftiyle (açık üst-sol/koyu alt-sağ)
  kabartılmış; girdiler ters (inset) gölgeli "basılmış" görünür.
- Clay ve Neumorphism ayrıca uygulamanın GERÇEKTEN tükettiği `--radius-s/
  -m/-l` değişkenlerini de (`styles.css:31-33`) kendi kapsamları içinde
  ezer — böylece köşe yuvarlaklığı stiller genelinde otomatik yayılır
  (Glass/Aurora bu değişkenlere dokunmuyor, geometri Navy Blue/Apple ile
  aynı kalıyor — tasarım dokümanının "Glass yalnızca renk/yüzey/blur/gölge
  dokunur, geometriye asla" ilkesiyle tutarlı).
- `index.html`: 3 yeni `<link rel="stylesheet">` + `#themeProfileSelect`'e
  3 yeni `<option>` (Aurora/Clay/Neumorphism) eklendi.
- `app.js`: `validThemeProfiles` whitelist'ine üç yeni değer eklendi (aksi
  halde 0.0.116'daki `normalizeThemeProfile()` bunları tanımayıp sessizce
  "apple"a düşürürdü).
- `THEME-PROFILES.md`: üç yeni profil + kaynakları belgelendi.

Doğrulama: `node --check app.js`, tam test paketi (check-basic + 4 parser +
test-bank-templates) YEŞİL. Tarayıcıda TEMİZ sayfa yüklemeleriyle (her
temayı `localStorage`'a önceden yazıp yeniden yükleyerek — CANLI/senkron
switch testleri `transition: ...` yüzünden yanıltıcı ara-değer okumaları
verdi, aynı 0.0.123'teki gate-teması testinde keşfedilen artefaktın
aynısı) üç temanın da doğru uygulandığı kanıtlandı: Aurora
(bg `#0b1430`, kart `rgba(255,255,255,.92)`), Clay (bg/girdi `#eceafd`,
kart `#f6f5ff`, radius 26px, üçlü gölge), Neumorphism (bg/girdi/kart hepsi
aynı `#e4e9f2`, iki yönlü dış gölge, radius 18px). Select değeri ve
`body[data-app-theme]` her durumda doğru senkronize; konsolda hata yok.

Cache-buster: `app.js?v=20260717-1700`, yeni tema dosyaları
`?v=20260717-1700` ile linklendi (index.html + check-basic.js pin
birlikte güncellendi).

Not: Bu üç profil de (Glass gibi) yalnızca ana çalışma alanına
uygulanıyor; giriş ekranına (auth gate) uygulanmadı.

Yedek: `backups/before-three-new-themes_2026-07-17_16-55-50/`.
## 0.0.124 - 2026-07-17 - Harita marker ve talep butonlarÄ± UX dÃ¼zeltmeleri

- Leaflet varsayÄ±lan PNG marker yerine CSP uyumlu yerel CSS marker kullanÄ±yor; harita iÅŸaretÃ§ileri uzak gÃ¶rsel engeline takÄ±lmÄ±yor.
- Taleplerim kart ve liste gÃ¶rÃ¼nÃ¼mlerindeki AÃ§, Kopyala, TamamlandÄ±, ArÅŸivle ve Sil dÃ¼ÄŸmeleri kompaktlaÅŸtÄ±rÄ±ldÄ±.
- Liste gÃ¶rÃ¼mÃ¼nde iÅŸlem dÃ¼ÄŸmeleri tek satÄ±rda korunuyor; kart gÃ¶rÃ¼mÃ¼nde gereksiz yÃ¼kseklik azaltÄ±ldÄ±.

DoÄŸrulama: `node --check app.js`, `node --check cloud/report-library.js`,
`tools/check-basic.js` ve `git diff --check` baÅŸarÄ±lÄ±.
## 0.0.125 - 2026-07-17 - Talep tamamlanma butonu metin sadeleÅŸtirmesi

- Taslak kartlarÄ±ndaki `TamamlandÄ± Ä°ÅŸaretle` metni `TamamlandÄ±` olarak kÄ±saltÄ±ldÄ±.
- TamamlanmÄ±ÅŸ raporlardaki `TaslaÄŸa Al` davranÄ±ÅŸÄ± korunuyor.

DoÄŸrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.
## 0.0.126 - 2026-07-17 - Harita dÄ±ÅŸa aktarma butonu metin sadeleÅŸtirmesi

- `HARÄ°TAYI JPEG OLARAK KAYDET` butonu `JPG` olarak kÄ±saltÄ±ldÄ±.
- DÃ¼ÄŸmenin `title` ve `aria-label` aÃ§Ä±klamalarÄ± korunarak kullanÄ±labilirlik sÃ¼rdÃ¼rÃ¼ldÃ¼.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.127 2026-07-17 Clay/Neumorphism Sidebar Okunabilirlik Düzeltmesi (Claude oturumu)

Kullanıcı "clay ve neomorfhsim de sol paneldeki yazılar beyaz olduğundan
yazılar okunaklı değil. tüm temalarda fontlar okunaklı mı kontrol et" dedi.

Kök neden: `styles.css`'in temel (`.sidebar`, `.brand p`, `.nav-button`,
`.sync-panel p` vb.) kuralları sidebar'ı HER ZAMAN koyu zemin varsayarak
alt öğelere DEĞİŞKEN KULLANMAYAN, sabit açık renkler veriyordu
(`.brand p{color:#b9c5c1}`, `.nav-button{color:#dce6e2}`,
`.sync-panel p{color:#c9d2cf}` — bkz. `styles.css:522-604`). Glass/Aurora
temalarında sidebar'ı bilinçli olarak KOYU tuttuğum için sorun yoktu; ama
Clay ve Neumorphism'de tüm yüzeyleri (sidebar dahil) açık/pastel yaptığım
için bu sabit açık renkler artık açık zemin üzerinde okunaksız kalıyordu.
`apple.css`'in kendi zamanında AYNI sorunu `.brand p`/`.nav-button`/
`.nav-badge` için ayrı ayrı ezerek çözdüğünü fark ettim — aynı desen
tekrarlandı.

Yapılanlar (`themes/clay.css`, `themes/neumorphism.css`):
- `.brand p`, `.sync-panel p` → `color: var(--muted)`.
- `.nav-button` → `color: var(--ink)`; `:hover`/`.is-active` → okunaklı,
  ayırt edici bir renk (Clay: `--green-strong` metin + `--green-soft` zemin;
  Neumorphism: `--green` metin + inset gölge — temanın kendi "basılmış"
  diline uygun).
- `.nav-index`/`.sync-panel` arka planları da (eskiden `rgba(255,255,255,.1)`
  — koyu zeminde görünür, açık zeminde görünmez) koyu-tonlu şeffaf
  karşılıklarıyla değiştirildi.
- `--muted` değerleri biraz KOYULAŞTIRILDI (Clay `#736fa0`→`#5f5a91`,
  Neumorphism `#6a7794`→`#566079`) — WCAG kontrast hesabı ilk değerlerin
  küçük metin için sınırda/yetersiz olduğunu gösterdi (4.31:1 ve 3.68:1,
  AA eşiği 4.5:1); yeni değerler 5.78:1/5.15:1'e çıkarıyor. Bu değişken
  sidebar dışında da (alt başlık metinleri vb.) kullanıldığından iyileştirme
  her yerde faydalı, hiçbir yerde zarar vermiyor.

Ayrı, bağımsız bir bulgu (kullanıcı fark etmeden önce kendim buldum): dört
YENİ temanın da (Glass/Aurora/Clay/Neumorphism) yüzey-blur/gölge
kurallarına `table`/`th`'i dahil etmiştim. Bu, ÖZEL koyu+beyaz satırların
(`.malikler-total-row th` — TOPLAM satırı, `.comparable-valuation-summary-
table th.is-accent-sale/rent`) kendi `background`'ını (`#1f2a32` vb.,
`!important` yok) YÜKSEK ÖZGÜLLÜKLE (benim `body[data-app-theme="x"] th`
seçicim onlarınkinden daha özgül) EZİYORDU — zemin açık yeşile dönüp beyaz
yazı okunaksız kalırdı. Dört temadan da `table`/`th`'i kaldırdım; temel
uygulamanın zaten var olan, tema-nötr `th{color:#42515b;background:#f0f3f1}`
kuralı (veya Apple'ın kendi override'ı) devreye giriyor — hem her zaman
okunaklı hem de özel toplam/vurgu satırlarını artık bozmuyor.

Doğrulama: `tools/check-basic.js` + `tools/test-bank-templates.js` YEŞİL.
Tarayıcıda TEMİZ sayfa yüklemeleriyle 4 yeni temanın hepsinde: sidebar
zemin rengi doğru, `.brand p`/`.sync-panel p`/`.nav-button` (aktif VE
pasif durum) rengi doğru hesaplandı (Node ile WCAG kontrast oranları da
ayrıca doğrulandı — hepsi ≥4.3:1, çoğu ≥5:1). Sentetik bir
`.malikler-total-row th` elemanı DOM'a eklenip 4 temanın hepsinde
`rgb(31,42,50)` (koyu) zemin + beyaz yazı ile DOĞRU render edildiği
kanıtlandı (önceden Clay/Neumorphism gibi açık temalarda bu satır da
bozulmuş olacaktı — kullanıcı henüz bunu fark etmemişti). Konsolda hata yok.

Cache-buster: `themes/glass.css?v=20260717-1830`, `themes/aurora.css?v=
20260717-1830`, `themes/clay.css?v=20260717-1840`, `themes/neumorphism.css
?v=20260717-1840` (index.html güncellendi).

Yedek alınmadı (0.0.124'teki `backups/before-three-new-themes_2026-07-17_
16-55-50/` yedeği zaten bu dosyaların ilk hallerini içeriyor; bu tur o
işin doğrudan devamı/düzeltmesi).
## 0.0.127 - 2026-07-17 - Malik tablosu Tapu Tarihi sÃ¼tunu geniÅŸletmesi

- Malikler tablosunda Tapu Tarihi sÃ¼tunu minimum 120 px geniÅŸliÄŸe getirildi.
- Tablo minimum geniÅŸliÄŸi 760 px olarak korunarak masaÃ¼stÃ¼nde dengeli, mobilde yatay kaydÄ±rmalÄ± okunabilir dÃ¼zen saÄŸlandÄ±.
- Yevmiye sÃ¼tununa da sabit alan verilerek tarih alanÄ±nÄ±n sÄ±kÄ±ÅŸmasÄ± Ã¶nlendi.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.
## 0.0.128 - 2026-07-17 - Belge inceleme kurumlarÄ±na OSB seÃ§eneÄŸi

- Belgeler ve Proje bÃ¶lÃ¼mÃ¼ndeki Ä°ncelenen Kurum aÃ§Ä±lÄ±r listesine `OSB BÃ¶lge MÃ¼dÃ¼rlÃ¼ÄŸÃ¼` eklendi.
- Proje incelenen kurumlarÄ±nda mevcut olan aynÄ± seÃ§enek korunarak belge satÄ±rÄ± ile proje seÃ§imleri tutarlÄ± hale getirildi.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.129 2026-07-17 Alt Bölüm Başlıkları ve Tablo Hücrelerinde Boşluk Artırımı (Claude oturumu)

Kullanıcı "İncelenen Belgeler" ve "Ana Taşınmaz Teknik Bilgileri" alt bölüm
başlıklarının ekran görüntülerini paylaşıp "iç tabloda çok kenara yapışık,
tüm formatta bunun gibi kenara sıfır başlıklar var, alt tabloyu biraz
büyüterek ya da başlıkları ayarlayarak daha güzel bir arayüz sağlayabiliriz"
dedi.

İnceleme: `.subsection h4 { margin: 0; }` ve `.subsection { gap: 12px; }`
gerçekten sıfır kenar boşluğu kullanıyordu — bu, tek bir yerde değil,
`.subsection` sınıfının kullanıldığı UYGULAMA GENELİNDEKİ (İncelenen
Belgeler, Ana Taşınmaz Teknik Bilgileri, ve onlarca başka alt bölüm) her
yerde aynı sıkışık görünüme yol açıyordu. Tablo hücreleri de (`th, td`)
10px gibi standart ama görece dar bir dolgu kullanıyordu.

Yapılanlar (`styles.css`, iki tek-satırlık, uygulama genelinde paylaşılan
sınıf değeri):
- `.subsection { gap: 12px }` → `gap: 16px` — başlık ile altındaki
  içerik (tablo/form/grid) arasına biraz daha nefes payı.
- `th, td { padding: 10px }` → `padding: 12px` — tüm tablo hücreleri
  ("alt tablo") biraz daha ferah.

Bu iki değişiklik `.subsection`/`th`/`td` kullanılan HER yerde otomatik
uygulanır (kullanıcının "tüm formatta" ifadesiyle uyumlu) — ayrı ayrı
onlarca alt bölümü tek tek düzeltmek yerine paylaşılan temel sınıflar
düzeltildi.

Doğrulama: `tools/check-basic.js` + tam test paketi YEŞİL. Tarayıcıda
canlı ölçüm: "İncelenen Belgeler" alt bölümünde `subsectionGap: 16px`,
`tdPadding: 12px` doğrulandı (öncekiler 12px/10px idi); ekran görüntüsüyle
görsel olarak da başlık-tablo arası boşluğun arttığı teyit edildi. Konsolda
hata yok, mevcut testler bozulmadı.

Cache-buster: `styles.css?v=20260717-1730` (index.html + check-basic.js
pin birlikte güncellendi).

Yedek: `backups/before-subsection-spacing_2026-07-17_17-28-49/`.
## 0.0.133 - 2026-07-17 - Alt panel başlıklarının dikey boşluğu

Alt panel başlıkları üst kenara da yapışık görünmeye devam ettiği için ortak
`.subsection-table-head` ve `.subsection-title-row` sınıflarına üst/alt iç boşluk
eklendi. Başlıklar artık yatayda 10px, üstte 6px ve altta 4px içeriden başlar.
Yedek: `backups/before-panel-heading-vertical-spacing_2026-07-17_18-09-31/`.

## 0.0.132 - 2026-07-17 - Ana panel başlık hizalaması

Ana Gayrimenkul, Bağımsız Bölüm ve Değerleme içindeki özel alt panellerin başlıkları
tablo/panel sınırına yapışık görünüyordu. Bu panellerin ortak kullandığı
`.subsection-title-row` sınıfına da 10px yatay iç boşluk eklendi. Böylece tablo
başlıkları ve açıklama satırları tüm bölümlerde tutarlı biçimde içeriden başlar.
Yedek: `backups/before-common-panel-heading-fix_2026-07-17_18-06-11/`.

## 0.0.131 - 2026-07-17 - Alt tablo başlık hizalaması

İncelenen Belgeler ve aynı ortak tablo yapısını kullanan alt tabloların başlıklarının
tablo sınırına yapışık görünmesini önlemek için `.subsection-table-head` bileşenine
10px yatay iç boşluk eklendi. Bu düzenleme masaüstü ve mobil görünümlerde ortak uygulanır.

## 0.0.130 - 2026-07-17 - Saha Pro bölümünün kaldırılması

Kullanıcı talebiyle 8. bölüm olarak eklenen Saha Pro tamamen kaldırıldı. Bölüm tanımı,
iframe render kodu ve Saha Pro'ya özel CSS temizlendi; `saha-pro.html` dosyası da projeden
çıkarıldı. İşlem öncesi yedek: `backups/before-remove-saha-pro_2026-07-17_17-52-04/`.

## 0.0.129 - 2026-07-17 - Saha Pro bölüm entegrasyonu

Kullanıcının paylaştığı `C:\Users\90551\OneDrive\Masaüstü\claude\saha çalışma\index.html`
uygulama köküne `saha-pro.html` adıyla alındı. Ana uygulamanın global CSS ve JavaScript
kodlarıyla çakışmayı önlemek için 7. Ana Gayrimenkul Özellikleri ile 8. Bağımsız Bölüm
Özellikleri arasına `Saha Pro` başlığı eklendi ve içerik aynı kaynak üzerinden izole bir
iframe çalışma alanı olarak gösterildi. Saha Pro'nun bağımsız PWA manifest/favicon
referansları iframe içindeki gereksiz 404 isteklerini önlemek için kaldırıldı.

`app.js` içinde `sahaPro` bölümü ve iframe oluşturma akışı, `styles.css` içinde masaüstü
ve mobil yükseklikleri uyarlanan `.saha-pro-frame-wrap` / `.saha-pro-frame` stilleri eklendi.

Doğrulama: `node --check app.js`, `node tools/check-basic.js`, `git diff --check` ve
`http://127.0.0.1:5174/saha-pro.html` servis kontrolü başarılıdır.
