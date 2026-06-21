# Mimari Kural Seti

## Placeholder Kuralı

Program genelinde yeni bir ana bölüm, alan, tablo veya otomatik oluşturulan metin eklendiğinde bu içerik Placeholder bölümünde de görünmelidir.

Temel kural:

- Yeni ana bölümler `sections` listesine eklendiğinde Placeholder bölümü bu bölümü otomatik okumalıdır.
- Yeni alanlar ilgili bölümün `fields` listesine eklenmeli; özel çizilen alanlarda da placeholder karşılığı kaybolmamalıdır.
- Yeni tablo yapıları `state.tables` veya ilgili tablo tanımı üzerinden Placeholder bölümünde izlenebilir olmalıdır.
- Yeni otomatik oluşturulan cümle ve paragraflar `collectGeneratedTextPlaceholders` içine eklenmelidir.
- Placeholder bölümü eski Excel adlandırılmış hücrelerini, uygulama alanlarını, tablo kayıtlarını ve oluşturulan metinleri birlikte göstermeye devam etmelidir.
- Bu kural bundan sonra geliştirilecek bütün bölümler için geçerlidir.

## Otomatik Gelen Veriler

Programda PDF, JPEG/OCR, KML, sistem tarihi, önceki kayıt, hesaplama veya başka bir otomatik kaynaktan gelen bütün değerler kullanıcı tarafından değiştirilebilir olmalıdır.

Temel kural:

- Otomatik veri alanı ilk değeri öneri olarak doldurur.
- Kullanıcı isterse bu değeri değiştirebilir.
- Kullanıcı değişiklik yaptıysa otomatik yenileme bu değişikliği sessizce ezmemelidir.
- Otomatik kaynak değeri ile kullanıcı onaylı nihai değer ayrı tutulmalıdır.
- Rapor ve şablon çıktıları kullanıcı onaylı nihai değeri kullanmalıdır.

Bu kural bütün bölümler için geçerlidir:

- Randevu ve belediye inceleme tarihi
- TAKBİS'ten gelen tapu/malik/takyidat alanları
- Adres kodu PDF'sinden gelen adres ve UAVT alanları
- EKB PDF'sinden gelen enerji belgesi alanları
- KML'den gelen koordinat alanları
- JPEG/OCR ile okunan belge alanları
- Hesaplanan değerleme ve rapor metni alanları

## Randevu Tarihi

Randevu tarihi otomatik gelir, fakat kullanıcı tarafından değiştirilebilir.

- Varsayılan değer bugünün tarihidir.
- Bugün hafta sonu veya sabit Türkiye resmi tatili ise son mesai günü kullanılır.
- Belediye inceleme tarihi de ilk açılışta aynı varsayılan değerle doldurulur.
- Kullanıcı randevu veya belediye inceleme tarihini değiştirirse bu değer korunur.
- Randevu saati bu aşamada kullanılmayacaktır.

## KML ve Harita Verisi

KML dosyası yüklendiğinde program dosyayı tarayıcı içinde okuyacaktır.

- KML içindeki koordinatlar okunur.
- Koordinatlardan merkez enlem/boylam hesaplanır.
- KML içindeki `Pafta` alanı bulunursa Tapu ve Mülkiyet bölümündeki Pafta alanına öneri olarak yazılır.
- KML içindeki il, ilçe, idari mahalle, ada, parsel, yüzölçümü ve nitelik gibi alanlar yakalanabildiği ölçüde ilgili alanlara öneri olarak aktarılır.
- Harita altlığı Leaflet ve OpenStreetMap üzerinden çalışır.
- KML geometrisi harita üzerinde parsel poligonu ve merkez işaretçisi olarak çizilir.
- Harita Adres ve Konum bölümünde yer alır; KML yükleme kartı sadece dosya seçimi için kullanılır.
- Kullanıcı harita üzerinde istediği noktayı tıklayarak veya işaretçiyi sürükleyerek nihai konumu seçebilir.
- Kullanıcının seçtiği nokta `Enlem` ve `Boylam` alanlarına yazılır ve rapor çıktısında bu nihai koordinat kullanılır.
- Haritada standart görünüm ve fiziki görünüm seçenekleri bulunmalıdır.
- Harita kütüphanesi yüklenemezse KML yine okunur; alan aktarımı devam eder, yalnız harita çizimi yapılmaz.
- Kullanıcı daha önce bir alanı değiştirmişse otomatik KML yenilemesi bu değeri sessizce ezmemelidir; kullanıcı isterse "okunan değerleri tekrar uygula" işlemiyle KML önerilerini bilinçli olarak uygulayabilir.

## Yakın Çevre Okuma

KML veya koordinat geldikten sonra çevre verileri otomatik olarak öneri kaynağına alınır.

- İlk otomatik tarama yarıçapı varsayılan olarak 500 m'dir; amaç KML yüklenir yüklenmez hızlı sonuç almaktır.
- Okunacak ana sınıflar: devlet kurumları, tarihi yerler, parklar, ana cadde ve bulvarlar, metro istasyonları, özel/kamu eğitim kurumları, alışveriş merkezleri, sahil ve deniz.
- Sistem çok sayıda bulgu getirebilir; rapor metnine yalnızca kullanıcının seçtiği öğeler yazılır.
- Önemli nokta listesinde sıralama önce ana cadde/bulvarlar, sonra eğitim kurumları, sonra kamu kurumları olacak şekilde önceliklendirilir.
- Kullanıcı haritada nihai noktayı değiştirirse çevre taramasını yeniden çalıştırabilir.
- Yakın çevre metni otomatik oluşturulur ancak kullanıcı tarafından sonradan düzenlenebilir.
- Ulaşım ana arteri için yakın çevre taramasından sadece cadde/bulvar yolları alınır; 500 m içindeki yollar yakından uzağa listelenir.
- Kullanıcı ulaşım ana arterini seçer; seçilen arterden taşınmazın bulunduğu parsele giden akıcı ulaşım tarifi taslağı üretilir.
- Yakın çevrede seçilen özel noktalar haritada ayrı işaretçiler ve isim etiketleriyle gösterilir.
- Bölge yapılaşma nizamı, kat adedi, gelir seviyesi, altyapı olanakları, yapılaşma hızı, bölge yapı yaşı, yapılaşma yoğunluğu, sosyal ihtiyaçlar, bölge kullanım amacı ve plancılık uyumu veri doğrulama seçenekleriyle girilir.
- Sistem çevre taraması sonrası bina kat etiketleri, yapı sayısı, arazi kullanımı, yol sayısı ve donatı yoğunluğunu analiz ederek bu bölge alanlarına otomatik öneri yazabilir.
- Bölge analizi önerileri kullanıcı tarafından değiştirilebilir; kullanıcı değişikliği sessizce ezilmez.

## Adres Kodu Okuma

Adres kodu dosyaları tarayıcı içinde okunacaktır.

- PDF dosyalarında önce PDF metin katmanı okunur.
- PDF metin katmanı boşsa ilk sayfalar görsele çevrilip OCR denenir.
- JPG, PNG ve WEBP ekran alıntılarında OCR kullanılır.
- OCR/PDF sonucu aynı adres ayrıştırıcıdan geçirilir.
- Okunacak ana alanlar: idari mahalle, sokak/cadde/bulvar, dış kapı, iç kapı, Site / Apartman, UAVT ve varsa posta kodu.
- Adres kodu belgesinde üst satırdan yalnızca idari mahalle ve sokak/cadde/bulvar bilgileri alınır.
- İl ve ilçe adres kodu belgesinden doldurulmaz; bu alanlar KML/harita adres doğrulama kaynağından gelir.
- Üst satırda kapı bilgisinden sonra gelen kullanım amacı, tip, durum gibi açıklama metinleri adres alanlarına kaynak olarak kullanılmaz.
- Adres kodu belgesinden Blok alanı doldurulmaz; bu bilgi daha sonra TAKBİS/tapu tarafındaki daha güvenilir kaynaktan gelecektir.
- İl, ilçe, idari mahalle ve posta kodu alanları veri doğrulama listesi gibi önerili giriş mantığıyla çalışır; KML/harita noktasından internet adres sorgusu ile gelen değerler listeye eklenir.
- Okunan değerler Adres ve Konum bölümündeki ilgili alanlara öneri olarak yazılır.
- Kullanıcı daha önce alanı değiştirdiyse otomatik okuma değeri sessizce ezmemelidir.
- Kullanıcı isterse "okunan adresi tekrar uygula" işlemiyle OCR/PDF değerlerini bilinçli olarak tekrar basabilir.
