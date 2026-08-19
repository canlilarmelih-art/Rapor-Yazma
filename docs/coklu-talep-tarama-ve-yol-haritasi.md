# Çoklu Talep Tarama Raporu ve Yol Haritası

## Genel Durum

Çoklu talep altyapısının önemli bölümü kurulmuş durumdadır:

- Çoklu TAKBİS PDF'sinden kayıtları ayırma ve taşınmaz tablarına aktarma.
- Taşınmaz kimlik no ve TAKBİS tarihiyle tekrar kayıt kontrolü.
- Tapu, malik ve takyidat verilerinin taşınmaz bazında ayrılması.
- Çoklu KML eşleştirme ve tüm taşınmazları haritada gösterme.
- Ada/parsel bazlı tab isimleri ve harita etiketleri.
- Takyidatların yevmiye no'ya göre gruplanması.
- Ortak çevresel açıklamalar, takyidat açıklamaları ve ortak rapor metinleri.
- Farklı ada/parseller için İmar, Arsa ve Belgeler tabloları.
- Bölüm bazlı Excel içe/dışa aktarma.
- Açılır liste alanlarının Excel düzenlemesine aktarılması.
- Çoklu JPG/KML harita çıktıları ve emsal krokisi etiketleri.
- Sahibinden, Hepsiemlak ve Emlakjet için konum merkezli arama URL'leri.
- İlk taşınmazın mülkiyet türünün tüm taşınmazlara aktarılması.

Ana kapsamlandırma ve tab geçiş motoru `app.js` içindeki `titleUnits`, `TITLE_UNIT_SCOPED_SECTION_IDS` ve `switchActiveTitleUnit` yapıları etrafında çalışmaktadır.

## Eksik veya Riskli Kısımlar

### 1. Bağımsız Bölüm ve Ana Gayrimenkul

Deklaratif alanların bir bölümü ayrılmış olsa da oda, iç özellik, bina teknik bilgileri, kat dağılımı ve benzeri programatik alanların tamamının taşınmaz bazında ayrıldığı henüz kanıtlanmış değildir. En yüksek riskli alan budur.

### 2. Değerleme

Bazı değerleme alanları taşınmaz bazında ayrılmıştır. Ancak değerleme yöntemi, hesaplama tabloları ve yardımcı panel verilerinin tamamı için uçtan uca kontrol gereklidir.

### 3. Banka, müşteri ve iş bilgileri

Bu alanların rapor-geneli mi, taşınmaz bazlı mı olması kesinleştirilmelidir. Mevcut kapsamlandırmada bazı alanların yanlışlıkla taşınmaz bazına ayrılma ihtimali vardır.

### 4. Word/PDF ve banka şablonu çıktısı

Ekrandaki çoklu yapı büyük ölçüde hazırdır. Buna karşılık banka şablonu çıktısında tüm taşınmazların tapu, adres, imar, değerleme ve bağımsız bölüm detaylarının yapılandırılmış biçimde üretilmesi tamamlanmamıştır.

### 5. Normal kullanıcı erişimi

Çoklu TAKBİS aktarımı yapılabilmesine rağmen tab arayüzü hâlâ admin kontrolüne bağlı görünmektedir. Normal kullanıcı çoklu veri aktarırsa veriyi yönetememe riski vardır.

### 6. Ana Gayrimenkul Excel paneli

Ana Gayrimenkul bölümünde alanlar deklaratif olarak tanımlı değilse bölüm bazlı Excel paneli görünmeyebilir. Bu bölüm için ayrı Excel şeması gereklidir.

### 7. Gerçek tarayıcı testi

Test paketi güçlü olsa da çoklu TAKBİS → tablar → KML → POİ → JPG → Word/PDF akışı gerçek mobil ve masaüstü tarayıcıda uçtan uca otomatik test edilmemektedir.

### 8. Çalışma ağacı durumu

Son commit dışında çalışma ağacında commitlenmemiş değişiklikler bulunmaktadır. Bunlar özellikle çoklu emsal açıklaması, şablon bağlantıları ve kapsam testleriyle ilgilidir. Bu değişiklikler ayrı olarak test edilip commitlenmelidir.

## Yol Haritası

### Faz 1: Veri Bütünlüğü

1. Bağımsız Bölüm, Ana Gayrimenkul ve Değerleme alanlarının tam envanterini çıkar.
2. Her alanı taşınmaz bazlı veya rapor-geneli olarak sınıflandır.
3. Tab değişiminde veri kaybı ve yanlış paylaşım testlerini tamamla.
4. Normal kullanıcıların çoklu talep arayüzüne erişim kararını netleştir.

### Faz 2: Excel

1. Ana Gayrimenkul ve Bağımsız Bölüm için eksik Excel şemalarını ekle.
2. Açılır liste seçeneklerini tek kanonik tanımdan Excel'e aktar.
3. Excel yükleme sonrası başlık, seçenek ve ada/parsel eşleşme doğrulamasını güçlendir.
4. Bölüm bazlı Excel yükleme ve indirme davranışını tüm ana bölümlerde doğrula.

### Faz 3: Çıktı

1. Ortak açıklamaları şablona yalnızca bir kez aktar.
2. Taşınmaz bazlı detayları tablo veya taşınmaz blokları halinde üret.
3. Aynı ve farklı ada/parsel senaryoları için ayrı çıktı kuralları uygula.
4. Eksik veri varsa çıktı öncesi açık uyarı göster.

### Faz 4: Harita ve Mobil

1. Üç KML'li gerçek senaryo için otomatik tarayıcı testi oluştur.
2. Tüm KML sınırlarını, etiketleri ve POİ'leri JPG çıktısında doğrula.
3. Emsal krokisinde konu taşınmaz ve emsal etiketlerinin doğru bağlandığını test et.
4. Mobilde portal açılışlarını ve harita parametrelerini ayrı ayrı doğrula.

### Faz 5: Son Temizlik

1. Çoklu TAKBİS plan dosyasını mevcut kodla eşitle.
2. Eski veya çelişkili fonksiyon yorumlarını güncelle.
3. Sentetik sandbox testlerini gerçek sabit ve şemalardan besle.
4. Commitlenmemiş değişiklikleri ayrı bir özellik commit'i olarak test edip pushla.

## Test Durumu

Son mülkiyet türü değişikliğinden önce tam test paketi başarıyla tamamlanmıştır. Ancak çalışma ağacında sonradan oluşan commitlenmemiş değişiklikler ayrıca doğrulanmadan üretim tamamlanmış kabul edilmemelidir.

## Referanslar

- `app.js:1112` — `titleUnits` veri modeli
- `app.js:1222` — taşınmaz bazlı bölüm kapsamı
- `app.js:1640` — taşınmaz alanlarının kapsamlandırılması
- `app.js:30402` — çoklu KML işleme
- `app.js:31041` — çoklu KML harita gösterimi
- `app.js:31676` — konum haritası JPG çıktısı
- `app.js:16799` — bölüm Excel paneli
- `docs/coklu-takbis-import-plan.md` — çoklu TAKBİS tasarım notu
- `docs/coklu-talep-fonksiyonel-test-bulgulari.md` — fonksiyonel test bulguları
