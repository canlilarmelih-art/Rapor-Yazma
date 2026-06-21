# Rapor Yazma Programı - HTML İskelet

Bu klasör, yeni rapor yazma programının ilk tarayıcı tabanlı iskeletidir.

## Dosyalar

- `index.html`: Ana uygulama ekranı
- `styles.css`: Masaüstü ve mobil hibrit arayüz
- `app.js`: Sekmeler, alanlar, yerel taslak kayıt, eksik alan kontrolü

## İlk Sürümde Kurulan Bölümler

- Dosya ve Rapor
- Adres ve Konum
- Tapu ve Mülkiyet
- Takyidat
- İmar Durumu
- Belgeler ve Proje
- Yapı ve BB
- Değerleme
- Emsaller
- Banka ve Çıktı

## Ana Mantık

Program tek sayfalı Excel formunu bölümlü bir iş akışına dönüştürür.

- Mobil kullanımda saha için kritik alanlar öne çıkar.
- Masaüstünde tüm detay alanları ve tablolar açılır.
- Kullanıcının girdiği veriler otomatik olarak yerel taslak olarak saklanır.
- Depolama bu bilgisayardaki tarayıcı yerel kayıt alanında yapılır; bu aşamada bulut senkronizasyonu yoktur.
- Belge yükleme alanları şimdilik dosya seçimini kaydeder; PDF/JPEG okuma motoru sonraki aşamada bu kartlara bağlanacaktır.
- Eksik zorunlu alanlar üretim kontrolünde görünür.

## Randevu ve Belediye İnceleme Tarihi

Randevu tarihi program açıldığında otomatik hesaplanır, fakat kullanıcı isterse değiştirebilir.

- Normal günlerde bugünün tarihi kullanılır.
- Hafta sonu veya sabit Türkiye resmi tatillerinde son mesai günü kullanılır.
- Aynı tarih belediye inceleme tarihi için de ilk değer olarak kullanılır.
- Otomatik gelen tarih kullanıcı tarafından değiştirilirse korunur.
- Randevu saati bu aşamada kaldırılmıştır.

Sabit tatil kontrolü: 1 Ocak, 23 Nisan, 1 Mayıs, 19 Mayıs, 15 Temmuz, 30 Ağustos, 29 Ekim.

Detaylı mimari kararlar için: `ARCHITECTURE_RULES.md`

## Cihazlar Arası Devam İçin Gereken Sonraki Katman

Bu ilk HTML iskeletinde kayıt `localStorage` ile aynı cihazda tutulur. Mobilde başlayıp masaüstünde devam etmek için sonraki adımda şu katmanlar eklenmelidir:

- Kullanıcı oturumu
- Merkezi veritabanı
- Taslak senkronizasyon API'si
- Çevrimdışı kayıt kuyruğu
- Dosya yükleme deposu
- Belge okuma iş kuyruğu

## Belge Okuma Motoru İçin Ayrılacak Modüller

- TAKBİS PDF okuyucu
- Adres kodu PDF/görsel okuyucu: PDF metin katmanı, OCR; üst satırdan idari mahalle ve sokak/cadde/bulvar, alttaki tablodan dış kapı, iç kapı, Site / Apartman, UAVT ve posta kodu alanları
- EKB PDF okuyucu
- JPEG/OCR belge okuyucu
- KML/konum okuyucu: koordinat, merkez enlem/boylam, pafta, Adres ve Konum haritası, standart/fiziki görünüm ve kullanıcı nokta seçimi
- Adres doğrulama önerileri: KML/harita noktasından internet adres sorgusu ile il, ilçe, mahalle ve posta kodu veri listelerini besleme
- Yakın çevre okuyucu: KML merkezinden 500 m çevredeki kurum, park, ulaşım, eğitim, AVM ve sahil/deniz öğeleri için kısa kullanıcı seçim paneli
- Bölge analizi önerileri: çevre taramasından bina katı, yapı yoğunluğu, arazi kullanımı ve donatı bilgileriyle doğrulamalı bölge alanlarını ön doldurma
- Okunan veri ile kullanıcı onaylı veri karşılaştırma ekranı

## Test

İlk görsel kontrolde masaüstü ve mobil görünüm açıldı; JavaScript hatası görülmedi.
