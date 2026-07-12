# Codex Devam Notu

## Projenin amacı

Masaüstündeki Excel/VBA tabanlı rapor yazma mantığını tarayıcıda çalışan, mobil ve masaüstü birlikte kullanılabilen HTML/CSS/JavaScript tabanlı yeni rapor yazma programına taşımak.

Ana hedefler:

- Sahada mobil cihazdan hızlı veri girişi yapılması.
- Masaüstü bilgisayarda aynı iş dosyasına devam edilebilmesi.
- TAKBİS, UAVT/adres kodu, EKB, E-İmar, KML ve benzeri belgelerden otomatik veri okunması.
- Otomatik gelen her verinin kullanıcı tarafından değiştirilebilir olması.
- Eksik veya şüpheli alanların kullanıcıya görsel olarak belli edilmesi.
- Banka rapor diline uygun, sade ve tutarlı açıklama paragraflarının otomatik oluşturulması.
- Excel makrolarındaki rapor mantığının web uygulamasına aktarılması.

## Mevcut çalışan dosyalar

Ana uygulama klasörü:

`C:\Users\90551\Documents\Codex\2026-05-11\files-mentioned-by-the-user-rapor\app`

Çalışan ana dosyalar:

- `index.html`: Uygulama arayüzünün ana iskeleti.
- `app.js`: Mevcut ana iş mantığı, veri okuma, form üretimi, paragraf oluşturma ve harita işlemleri.
- `styles.css`: Uygulamanın görsel düzeni ve mobil/masaüstü stilleri.
- `server.js`: Yerel sunucu.
- `mobil-sunucu-baslat.bat`: Mobil/tablet erişimi için yerel sunucuyu başlatma dosyası.
- `backup-now.bat`, `backup-daily.ps1`, `install-daily-backup.bat`: Yedekleme yardımcıları.
- `IOS-PDF-FIX-NOTLARI.md`: iOS PDF okuma sorunu için çözüm notları.
- `PROGRAM-DEGERLENDIRME-VE-YOL-HARITASI.md`: Program değerlendirme ve uzun vadeli geliştirme notları.
- `ARCHITECTURE_RULES.md`: Mimari kurallar.

Kısmen ayrıştırılmış modül klasörü:

- `src/parsers/ekb-parser.js`
- `src/parsers/golden-fixture-parsers.js`
- `src/parsers/imar-normalizer.js`
- `src/parsers/kml-parser.js`

Not: `app.js` halen ana dosya durumunda ve çok büyüktür. Modüler bölme işlemi başladı ancak tamamen bitirilmedi.

## Son yapılan değişiklikler

- Sağ taraftaki `İş Akışı`, `Belge Okuma Kuyruğu` ve `Üretim Kontrolü` panelleri gizlendi/kaldırıldı.
- `Saha modu` bölümü tamamen kaldırıldı.
- Sol bölüm menüsü gizlenip tekrar açılabilir hale getirildi.
- Menü gizleme durumu tarayıcıda hatırlanacak şekilde ayarlandı.
- Son işlem öncesinde yedek alındı:

`C:\Users\90551\Documents\Codex\2026-05-11\files-mentioned-by-the-user-rapor\app\backups\before-layout-sidebar-panel-cleanup_2026-06-24_16-10-07`

Yakın dönemde yapılan önemli geliştirmeler:

- iOS PDF yükleme/okuma sorunu, OCR zorlaması kaldırılarak ve iOS uyumlu PDF okuma mantığı uygulanarak çözüldü.
- Dosya ve Rapor bölümüne mülkiyet, yasal kullanım niteliği ve mevcut kullanım farkı alanları taşındı.
- İmar bölümünde sorun yoksa bazı detay alanlarının gizlenmesi, sorun varsa açılması mantığı eklendi.
- İmar açıklamaları banka seçimine göre farklılaşacak şekilde geliştirildi.
- Belgeler ve Proje bölümünde mimari proje var/yok, kadastroya işli mi, proje kurumları, proje uygunluk ve belge açıklamaları geliştirildi.
- Ana Gayrimenkul Özellikleri bölümü Excel makro mantığına göre yeniden şekillendirildi.
- Bağımsız Bölüm Özellikleri bölümünde kat bazlı alanlar, iç hacimler, dekoratif özellikler ve açıklama paragrafları geliştirildi.
- Arsa Özellikleri bölümünde KML'den arsa şekli, cephe yönleri, cephe uzunlukları, tarım türü, zirai ürün ve sınır unsurları gibi alanlar oluşturuldu.
- Emsaller bölümünde Excel makro mantığına yakın dikey veri girişi, kopyala/reset, haritadan emsal konumu ve emsal paragrafı mantığı geliştirildi.
- Placeholder ve Açıklamalar bölümleri eklendi.
- Kullanıcının manuel girdiği bazı seçimler için varsayılan değer mantığı oluşturuldu.

## Çalışan akış

1. `mobil-sunucu-baslat.bat` ile yerel sunucu başlatılır.
2. Masaüstünde genellikle şu adres kullanılır:

   `http://127.0.0.1:5173/`

3. Tablet veya aynı ağdaki mobil cihaz için bilgisayarın yerel IP adresi kullanılır:

   `http://192.168.1.109:5173/`

   IP adresi ağ değişince farklı olabilir.

4. Dosya ve Rapor bölümünden temel iş bilgileri ve belgeler yüklenir.
5. UAVT/adres kodu, TAKBİS, KML, EKB ve E-İmar verileri ilgili alanlara otomatik aktarılır.
6. Kullanıcı otomatik gelen tüm verileri isterse düzenleyebilir.
7. Adres ve Konum bölümünde KML haritası, yakın çevre, ulaşım ana arteri ve çevresel özellik açıklaması üretilir.
8. Tapu ve Takyidat bölümlerinde malik, ipotek, şerh, beyan ve hak/mükellefiyet kayıtları düzenlenir.
9. İmar, Belgeler, Ana Gayrimenkul, Bağımsız Bölüm, Arsa ve Emsal açıklamaları otomatik oluşturulur.
10. Placeholder ve Açıklamalar bölümleri rapor çıktısında kullanılacak metinleri ve özel açıklamaları toplar.

## Henüz çözülmeyen sorunlar

- `app.js` halen çok büyük; bakım ve yeni özellik ekleme sırasında bağlam okumak zorlaşıyor.
- Modüler bölme işlemi tamamlanmadı. Özellikle şu alanlar ayrılmaya aday:
  - Belge okuma/parsing modülleri
  - Harita/KML modülleri
  - İmar açıklama üretici
  - Belgeler ve Proje açıklama üretici
  - Ana Gayrimenkul açıklama üretici
  - Bağımsız Bölüm açıklama üretici
  - Emsal açıklama üretici
  - Placeholder/varsayılanlar yönetimi
- iOS PDF okuma sorunu çözülmüş görünüyor; yine de iPhone/iPad üzerinde tekrar gerçek dosyalarla kontrol edilmeli.
- Bazı açıklama cümlelerinde banka özel kuralları ve makro varyantları hala aşamalı geliştiriliyor.
- Harita JPEG çıktısı, etiket ve işaretçi konumları her örnekte görsel olarak kontrol edilmeli.
- Mobil görünümde bazı alanların taşma riski daha önce görülmüştü; yeni bölümler eklendikçe tekrar kontrol edilmeli.
- Placeholder bölümünün tüm yeni alanları otomatik yakalama kuralı uygulanmış olsa da yeni eklenen her alan sonrası kontrol edilmeli.

## Dikkat edilmesi gerekenler

- Türkçe karakterler kesinlikle bozulmamalı. Dosyalar UTF-8 olarak korunmalı.
- Her önemli değişiklikten önce yedek alınmalı.
- Eski backup klasörleri silinmemeli; sorun çıkarsa oradan devam edilebilmeli.
- Kullanıcının yaptığı veya önceki oturumlardan kalan değişiklikler geri alınmamalı.
- Otomatik gelen tüm veriler kullanıcı tarafından değiştirilebilir olmalı.
- Belge yükleme ile otomatik dolan alanlar mavi, kullanıcının doldurması gereken alanlar beyaz mantığı korunmalı.
- Başlıklarda her kelimenin baş harfi büyük olmalı.
- Açıklama paragraflarında Türkçe dil bilgisi, büyük/küçük harf ve sayı formatı düzeltilmeli.
- Rapor açıklamalarında sayılar `1.000,25` formatında yazılmalı.
- Banka özel kuralları dikkatli uygulanmalı; bir bankaya özel kural başka bankaya taşmamalı.
- KML idari mahalle alanını değiştirmemeli; idari mahalle öncelikle UAVT/adres kodundan gelmeli. UAVT yoksa TAKBİS/KML yardımcı kaynak olarak kullanılabilir.
- Yeni bölüm veya yeni seçim alanı eklendiğinde Placeholder/Varsayılanlar mantığına da eklenmeli.
- Yedek almadan büyük düzenleme yapılmamalı.

## Yeni session'da ilk yapılacak iş

1. Önce bu dosya okunmalı:

   `Codex Devam Notu.md`

2. Sonra güncel çalışan klasör açılmalı:

   `C:\Users\90551\Documents\Codex\2026-05-11\files-mentioned-by-the-user-rapor\app`

3. Değişiklik yapmadan önce yeni yedek alınmalı.
4. `index.html`, `app.js`, `styles.css` üzerinde Türkçe karakter kontrolü yapılmalı.
5. Sunucunun çalıştığı doğrulanmalı:

   `http://127.0.0.1:5173/`

6. Yeni geliştirme yapılacaksa önce ilgili bölüm bulunmalı, mevcut mantık bozulmadan küçük ve hedefli değişiklik yapılmalı.
7. Yeni özellik eklenecekse Placeholder/Varsayılanlar bölümüne etkisi ayrıca kontrol edilmeli.
8. Özellikle büyük `app.js` değişikliklerinden sonra JavaScript sözdizimi kontrolü yapılmalı.
