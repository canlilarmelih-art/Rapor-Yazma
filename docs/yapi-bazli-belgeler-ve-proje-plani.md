# Yapı Bazlı Belgeler ve Proje Planı — Revizyon 2

Tarih: 17.09.2026
Revizyon tarihi: 18.09.2026
Durum: Faz 0–7 tamamlandı; yerel doğrulama başarılı, canlı dağıtım paketi hazırlandı.

## Uygulama sonucu

- Yapı, yapı bölümü, resmî belge ve belge kapsamı kalıcı kimliklerle ayrı veri katmanlarında saklanıyor.
- Belgeler ve Proje bölümünde `Parsel Geneli` ve ortak yapı listesini kullanan yapı sekmeleri çalışıyor.
- Bir belge birden fazla yapı veya yapı bölümüne bağlanabiliyor; ruhsat/iskan/yasal/mevcut m² değerleri ayrı tutuluyor.
- İlave, revizyon ve bilgi amaçlı kapsamlar çift sayımı önleyen alan etkisiyle hesaplanıyor.
- Yapı bazlı proje/EKB profili, alan mutabakatı, sanayi teknik değişkenleri, faktör önerileri, açıklama ve Excel dışa aktarımı tamamlandı.
- Eski raporlar güvenli biçimde `Parsel Geneli` kapsamına taşınıyor; Kat İrtifakı blok sistemi korunuyor.
- Fabrika + iki ruhsat dönemi + iskan senaryosu tarayıcıda doğrulandı; 194 dosyalık tam test paketi geçti.

## 0. Araştırma dayanağı ve revizyonun sonucu

Bu revizyon, halka açık sanayi tesisi/fabrika/depo değerleme raporlarının incelenmesiyle hazırlanmıştır:

- [Casa Emtia — Sinop Fabrika Değerleme Raporu](https://www.kap.org.tr/tr/api/file/download/4028328d9e2771a0019e2b52bf92214c): Aynı parselde fabrika, idari bina, havuz ve güvenlik kulübesi ayrı yapılardır; yapıların proje alanı, taşıyıcı sistemi ve mevcut/yıkılmış durumu ayrı izlenmiştir. Ruhsat ve iskanlar yapı adı ve m² kapsamıyla ilişkilendirilmiştir.
- [Adra GYO — Çayırova Tesis Değerleme Raporu](https://kap.org.tr/tr/api/file/download/4028328c9b82727a019bc31f7c7b773b): A, B ve C bloklar; sundurmalar, trafo, güvenlik ve su deposu ayrı bileşenlerdir. Aynı blok için yeni yapı ve tadilat ruhsatları, sundurmalar için ayrıca ruhsatlar ve farklı m² kapsamları bulunmaktadır.
- [Kiler GYO — Depo Değerleme Raporu](https://kap.org.tr/tr/api/file/download/4028328c9b82727b019bb8510aa72bd7): Net yükseklik, kolon aralığı, tır manevrası ve tır yanaşma kabiliyeti emsal düzeltmesinde kullanılan işlevsel değişkenlerdir.
- [SPK — Değerleme Raporlarında Bulunması Gereken Asgari Hususlar](https://spk.gov.tr/data/61e878ca1b41c611a4c53a46/44df6169-476d-44b5-840f-85b4d018fda9.pdf): Plan, proje, ruhsat ve yasal/mevcut durum incelemelerinin raporda açıkça yer alması gerekir.
- [TDUB — Uluslararası Değerleme Standartları](https://www.tdub.org.tr/Images/Uploads/UDS%202017.pdf): Maliyet yaklaşımında fiziksel bozulmanın yanında işlevsel ve dışsal yıpranma da değerlendirilir.

Araştırmanın plana getirdiği ana değişiklikler:

1. Bir resmî belge tek bir yapıya ait olmak zorunda değildir; birden fazla yapıyı veya yapı bölümünü kapsayabilir.
2. Aynı yapı, farklı yıllarda düzenlenmiş birden fazla yeni yapı/ilave/tadilat ruhsatına sahip olabilir.
3. Ruhsat, iskan, proje ve mevcut alan tek bir `yapı alanı` değerinde birleştirilemez.
4. Planlanan, inşa halindeki, mevcut, metruk ve yıkılmış yapılar veri geçmişi korunarak ayrı durumlarda izlenmelidir.
5. Sanayi yapılarında bina özelliklerine ek olarak işlevsel üretim/lojistik değişkenleri gerekir.
6. Olumlu/olumsuz faktörler, ölçülebilir olgular ile uzman yorumu gerektiren değerlendirmeler olarak ikiye ayrılmalıdır.

## 1. Amaç

Tek bir parselde birden fazla fiziksel yapı bulunabildiği durumlarda Belgeler ve Proje bölümünü yapı bazında çalıştırmak:

- İdari Bina
- Fabrika Binası
- Kapalı Sundurma
- Depo, bekçi kulübesi ve benzeri diğer yapılar

Aynı yapıya ait birden fazla ruhsat/proje/iskan kaydı bulunabilmeli; belgeler yapının tamamını veya yalnızca belirli bir bölümünü kapsayabilmelidir. Her belge için kapsadığı alanın m² değeri kaydedilmelidir.

Örnek:

- Fabrika Binası / 1. Üretim Holü / 2005 tarihli ruhsat / 1.000 m²
- Fabrika Binası / 2. ve 3. Üretim Holleri / 2010 tarihli ilave ruhsat / 2.400 m²

## 2. Temel mimari karar

Yapı, resmî belge ve belgenin kapsamı aynı veri değildir. Bu nedenle dört bağlantılı kayıt katmanı kullanılacaktır:

1. `state.tables.buildings`: Parseldeki fiziksel yapıların tek ve ortak listesi.
2. `state.tables.buildingParts`: Gerektiğinde yapının üretim holü, sundurma, idari bölüm gibi alt bileşenleri.
3. `state.tables.documents`: Resmî belgenin tekil kimliği; belge türü, kurum, tarih ve sayı burada tutulur.
4. `state.tables.documentScopes`: Belgenin hangi yapı/bölümü kaç m² ile kapsadığını gösteren ilişki kayıtları.

Bu ayrım sayesinde aynı tarih ve sayılı ruhsat, belgeyi kopyalamadan İdari Bina ile Fabrika Binasını birlikte kapsayabilir. Aynı şekilde tek bir Fabrika Binası ruhsatı 1. ve 2. üretim holüne farklı alanlarla dağıtılabilir.

Yapıların asıl teknik bilgileri Bina Özellikleri bölümünde kalacaktır. Belgeler ve Proje bölümünde aynı yapı listesi sekme olarak gösterilecek; ayrı bir ikinci yapı listesi oluşturulmayacaktır. Böylece iki bölümde farklılaşan veya mükerrer yapı kayıtları oluşmaz.

Belgeler ve Proje bölümündeki `+ Yapı Ekle` düğmesi de kullanılabilir; ancak bu düğme ayrı veri yaratmak yerine aynı `state.tables.buildings` listesine kayıt ekler. Yapının ayrıntılı teknik özellikleri Bina Özellikleri bölümünden tamamlanır.

```text
                 Tek yapı listesi
              state.tables.buildings
                  /            \
       Bina Özellikleri     Belgeler ve Proje
       teknik bilgiler      yapı sekmeleri
                                  |
                       belge + kapsam kayıtları
                    /             |             \
              yapı/bölüm       kapsanan m²    alan etkisi
                                  |
                 açıklama + Word/Excel çıktısı
```

## 3. Mevcut sistemden yararlanılacak parçalar

- Mevcut `Yapılar` sekme arayüzü ve `state.tables.buildings` listesi korunacak.
- Çoklu raporlardaki `createDocumentsBlockTabBar()` görsel/etkileşim deseni yapı sekmelerine uyarlanacak.
- Mevcut `İncelenen belgeler` tablosunun `c0..c4` alanları korunacak:
  - Belge türü
  - İncelenen kurum
  - Tarih
  - No
  - Kapsam
- `buildReviewedDocumentsDescription()` ve Word/Excel üreticileri yeni yapı bağlamını okuyacak şekilde genişletilecek.
- Mevcut Kat İrtifakı blok mantığı kaldırılmayacak. Yeni yapı sekmeleri yalnızca yapı bazlı rapor akışında devreye girecek.

## 4. Veri modeli

### 4.1. Yapı kaydı

Mevcut yapı kayıtlarına kalıcı kimlik ve hukuki/fiziksel durum katmanları eklenecek:

```js
{
  id: "building-...",
  name: "Fabrika Binası",
  structureType: "production",
  parentStructureId: null,
  buildingClass: "...",
  buildingStyle: "...",
  floors: [],
  projectAreaM2: "3282.64",
  licensedAreaM2: "3282.64",
  occupancyAreaM2: "3282.64",
  currentMeasuredAreaM2: "0",
  constructionStatus: "demolished",
  completionRatio: "0"
}
```

İlişki dizi sırasına göre kurulmayacaktır. Yapı silinir veya sekmelerin sırası değişirse belgelerin yanlış yapıya geçmesini engellemek için her bağlantı `id` üzerinden yapılacaktır.

`structureType` için başlangıç sözlüğü:

- Üretim binası / fabrika
- Üretim holü
- İdari bina
- Depo / soğuk hava deposu
- Atölye
- Sundurma / yarı açık alan
- Sosyal tesis
- Güvenlik binası
- Trafo / jeneratör binası
- Kazan dairesi / teknik bina
- Arıtma tesisi
- Su deposu
- Silo / tank
- Diğer

`constructionStatus` seçenekleri:

- `planned`: Projede/ruhsatta var, inşaatına başlanmamış
- `underConstruction`: İnşa halinde
- `active`: Mevcut ve kullanılabilir
- `partiallyActive`: Kısmen kullanılabilir
- `vacant`: Boş
- `derelict`: Metruk
- `demolished`: Yıkılmış/sökülmüş

Yıkılmış yapı veri listesinden silinmeyecektir. Ruhsat, iskan ve geçmiş değer bağlantılarının korunması için durumu `demolished` olarak değiştirilecektir.

### 4.2. Yapı bölümü kaydı

Her tesis için zorunlu değildir. Aynı yapı içinde farklı ruhsat dönemleri veya farklı fiziksel bölümler varsa kullanılır:

```js
{
  id: "building-part-...",
  structureId: "building-factory",
  name: "2. Üretim Holü",
  partType: "productionHall",
  floorName: "Zemin",
  projectAreaM2: "1200",
  currentAreaM2: "1200",
  status: "active"
}
```

### 4.3. Belge kaydı

Resmî belgenin kimliği yalnızca bir kez saklanacaktır:

```js
{
  id: "document-...",
  c0: "İlave Yapı Ruhsatı",
  c1: "Belediye / OSB Bölge Müdürlüğü",
  c2: "2010-05-10",
  c3: "2010/123",
  c4: "Açıklama",
  previousDocumentId: null,
  documentStatus: "valid"
}
```

Belge satırında doğrudan `structureId` tutulmayacaktır; yapı bağlantıları kapsam tablosundadır. `previousDocumentId`, tadilat/revizyon belgesinin yerine geçtiği önceki belgeyi açıkça gösterir.

### 4.4. Belge kapsamı kaydı

```js
{
  id: "document-scope-...",
  documentId: "document-2010-123",
  structureId: "building-factory",
  structurePartId: "building-part-production-hall-2",
  scopeLabel: "2. ve 3. Üretim Holleri",
  coveredAreaM2: "2400",
  areaEffect: "additive",
  legalStatus: "licensed"
}
```

Aynı belge için birden fazla kapsam satırı eklenebilir. Örneğin tek ruhsat:

- Fabrika Binası / 2. Üretim Holü / 1.200 m²
- Fabrika Binası / 3. Üretim Holü / 1.200 m²
- Kapalı Sundurma / 300 m²

`areaEffect` alanı, aynı alanı kapsayan tadilat/revizyon belgelerinin yanlışlıkla tekrar toplanmasını engeller:

- `additive`: Yeni veya ilave alan; toplam ruhsat alanına eklenir.
- `replacement`: Önceki kapsamın yerine geçen/revize toplam alan.
- `informational`: Alan bilgisi gösterilir fakat toplam hesabına eklenmez.

Bu modelde aynı belge farklı yapılara bağlandığında kopya belge satırı oluşturulmaz. Tarih/no benzerliği üzerinden sonradan birleştirmeye güvenilmez; gerçek ilişki `documentId` üzerinden kurulur.

### 4.5. Parsel genelindeki belgeler

Herhangi bir yapıya özel olmayan belgeler için `Parsel Geneli` sekmesi bulunacaktır. Kapsam kaydının `scopeType` değeri `parcel` olacak; `structureId` ve `structurePartId` boş bırakılacaktır.

### 4.6. Alanların birbirinden ayrılması

Tek bir `toplam alan` alanı hukuki ve fiziksel durumu temsil etmeyecektir. Her yapı için en az şu alanlar ayrı tutulacaktır:

- Onaylı proje alanı
- Ruhsat kapsam alanı
- Yapı kullanma izin alanı
- Yerinde ölçülen mevcut alan
- Yasal kabul edilen alan
- Ruhsatsız/projeye aykırı alan
- Yıkılmış alan
- İnşa halindeki alan ve tamamlanma oranı
- Sundurma/yarı açık alan

Bu alanların hiçbiri kullanıcı onayı olmadan diğerini güncellemeyecek veya değerleme hesabını değiştirmeyecektir.

## 5. Kullanıcı arayüzü

Belgeler ve Proje bölümünün üstünde şu sekmeler bulunacaktır:

```text
[Parsel Geneli] [İdari Bina] [Fabrika Binası] [Kapalı Sundurma] [+ Yapı Ekle]
```

Aktif yapı sekmesinde:

- Yapının adı ve temel özeti salt okunur olarak gösterilir.
- Mevcut proje/ruhsat/iskan alanları ilgili yapı kapsamında çalışır.
- İncelenen Belgeler tablosu aktif yapıyı kapsayan belgeleri gösterir; birden fazla yapıyı kapsayan belge aynı resmî belge kimliğiyle görünür.
- Belge satırının altında/yanında `Kapsamlar` düzenleyicisi bulunur.
- Her kapsam satırında `Yapı`, `Yapı Bölümü`, `Kapsam Açıklaması`, `Kapsanan Alan (m²)` ve `Alan Etkisi` bulunur.
- `Kapsam` alanı “Yapının tamamı”, “1. Üretim Holü”, “2. ve 3. Üretim Holleri” gibi bölüm bilgisini taşır.
- Kullanıcı aynı belge türünden sınırsız sayıda satır ekleyebilir.
- Aynı belgeye sınırsız kapsam satırı ekleyebilir.
- Yapı özeti üzerinde proje/ruhsat/iskan/mevcut alanlar yan yana gösterilir; farklılıklar uyarı rozetiyle belirtilir.

Kat İrtifakı çoklu raporlarında mevcut Blok → Bağımsız Bölüm sekmeleri aynen korunacaktır. Yapı sekmesi sistemi Müstakil Bina ve parselde birden fazla yapı bulunan ilgili rapor tipleri için ayrı bir kapıyla çalışacaktır.

## 6. Alan kapsamı matrisi

Uygulama öncesinde Belgeler ve Proje alanları üç gruba ayrılacaktır:

### Parsel geneli

- İnceleme yapılan kurumun rapor-geneli bilgileri
- Parselin tamamına ilişkin kadastro/kurum kayıtları
- Yapıya bağlanması mümkün olmayan ortak belgeler

### Yapı bazlı

- Mimari proje var/yok
- Proje türü, tarih ve no
- Tapu/belediye projesi karşılaştırması
- Ruhsat, ilave ruhsat, tadilat ruhsatı
- Yapı kullanma izin belgesi
- Enerji Kimlik Belgesi
- Statik uygunluk ve yapı denetim bilgileri
- Yapı/proje uygunluk açıklaması
- İncelenen belgeler tablosu

### Bağımsız bölüm bazlı

- Kat İrtifakı raporlarında mevcut “Proje Uygunluk Durumu - Bağımsız Bölüm” alanı

Bu matris kodlamadan önce mevcut `DOCUMENTS_BLOCK_SHARED_FIELD_KEYS` ile karşılaştırılacak; hiçbir alan yanlış kapsamda taşınmayacaktır.

## 6.1. Sanayi yapısı teknik değişkenleri

Bu alanların asıl sahibi Bina Özellikleri bölümüdür. Belgeler ve Proje bölümü yalnızca gerekli özeti ve belge bağlantısını gösterir.

### Birinci aşamada gerekli çekirdek alanlar

- Yapı türü ve kullanım amacı
- Taşıyıcı sistem
- Yapı sınıfı/grubu
- Yapım yılı/yapı yaşı
- Kat sayısı ve kat bazında alanlar
- Proje, ruhsat, iskan, yasal ve mevcut alanlar
- İnşaat/mevcudiyet durumu
- Tamamlanma oranı
- Çatı ve cephe tipi
- Fiziksel kondisyon/bakım durumu

### Sanayi ve lojistik kullanımında ikinci aşama alanları

- Net iç yükseklik ve mahya yüksekliği
- Kolon aks aralıkları/açıklık genişliği
- Döşeme taşıma kapasitesi
- Tır girişi, manevra ve yanaşma kabiliyeti
- Yükleme rampası sayısı
- Katlara araç erişimi
- Gezer vinç/vinç yolu ve kapasitesi
- Açık stok/sevkiyat alanı ve saha betonu
- Üretim holleri arasındaki bağlantı
- Trafo ve jeneratör kapasitesi
- Su deposu, arıtma, basınçlı hava, doğalgaz ve havalandırma
- Yangın algılama, sprinkler, hidrant ve yangın suyu deposu
- Alternatif kullanıma dönüşebilme ve genişleme alanı

Sayılarla ifade edilebilen alanlarda yalnız `Var/Yok` kullanılmayacaktır. Örneğin trafo için `mevcut mu + kapasite (kVA)`, gezer vinç için `adet + kapasite (ton)`, net yükseklik için `metre` saklanacaktır.

## 6.2. Olumlu/olumsuz faktör üretim ilkesi

Faktör motoru iki katmanlı olacaktır.

### Nesnel veriden güvenle otomatik üretilebilecekler

- Ruhsat/iskan mevcut veya eksik
- Proje-ruhsat-mevcut alan uyuşuyor/uyuşmuyor
- Ruhsatsız veya projeye aykırı alan var
- Yapı faal, inşa halinde, metruk veya yıkılmış
- İnşaat tamamlanma oranı
- Tır girişi/rampa/yangın sistemi/trafo/jeneratör mevcut veya değil
- Resmî yıkım/encümen/mühürleme kaydı var veya yok

### Kullanıcı/uzman kararı gerektirenler

- Net yüksekliğin kullanım için yeterli olması
- Trafo kapasitesinin üretim için yeterli olması
- Kolon aralıklarının işlevsel olması
- Tır manevra alanının yeterliliği
- Alternatif kullanım kabiliyetinin güçlü/zayıf olması
- Yapının sınırlı alıcı kitlesine hitap etmesi
- Yapıların tesis bütünlüğüne olumlu/olumsuz etkisi
- Fiziksel, işlevsel ve dışsal yıpranma düzeyi

Bu ikinci grupta sistem yalnız öneri sunacak; kullanıcı onayı olmadan rapor metnine kesin hüküm yazmayacaktır.

Başlangıç olumlu faktör havuzu:

- Ruhsat, iskan ve projenin eksiksiz/uyumlu olması
- Yapıların bakımlı ve faal olması
- Üretim hollerinin bütüncül çalışması
- Tır erişimi, manevra ve yükleme imkânının bulunması
- Yeterli enerji/trafo kapasitesi ve jeneratör bulunması
- Yangın algılama ve söndürme altyapısının bulunması
- Genişleme ve alternatif kullanım imkânı
- Tamamlanmış altyapı ve sanayi kümelenmesi

Başlangıç olumsuz faktör havuzu:

- Ruhsatsız/projeye aykırı alan
- Ruhsat, iskan ve mevcut alan uyumsuzluğu
- Yarım kalmış, metruk veya yıkılmış yapı
- Yapılar arası üretim bütünlüğünün kaybolması
- Fiziksel bozulma veya yüksek yenileme ihtiyacı
- Yetersiz net yükseklik, kolon açıklığı, taşıma kapasitesi veya enerji kapasitesi
- Tır erişimi/manevra/yükleme imkânının yetersizliği
- Eksik yangın/çevre/arıtma altyapısı
- Aşırı özel tasarım nedeniyle düşük alternatif kullanım
- Büyük toplam değer veya özel kullanım nedeniyle sınırlı alıcı kitlesi

## 7. Alan kontrolleri ve uyarılar

Sistem sert engel yerine açıklayıcı uyarı verecektir:

- Belge alanı boş, sıfır veya geçersizse uyarı.
- Yapıya bağlı belge varken yapıyı silme girişiminde yeniden atama veya belgelerle birlikte silme onayı.
- Ruhsatların toplama dahil alanı ile yapının toplam yasal alanı farklıysa uyarı.
- Yapı kullanma izin alanı ile ruhsat alanı farklıysa uyarı.
- Aynı tarih/no ile mükerrer belge girilmişse uyarı.
- Revizyon/tadilat belgesi `additive` seçilmişse olası çift sayım uyarısı.
- Belge kapsamlarının toplamı ile belgenin beyan edilen toplam alanı farklıysa uyarı.
- Aynı yapı bölümünün aynı belge kapsamında iki kez girilmesi halinde uyarı.
- `replacement` kapsamının yerine geçtiği önceki kapsam seçilmemişse uyarı.
- `demolished` durumdaki yapı için güncel kullanım/faal bilgisi girilmişse tutarlılık uyarısı.
- Tamamlanma oranı %100'den düşük yapı için iskan kaydı girilmişse bilgilendirici kontrol.

Toplamlar otomatik olarak rapor değerini değiştirmeyecek; yalnızca kullanıcıya denetim bilgisi sunacaktır.

Boş sekme “belge bulunamadı” anlamına gelmeyecektir. Her yapı için belge durumu açıkça seçilecektir:

- Belge mevcut
- Resmî incelemede bulunamadı
- Uygulanamaz
- Henüz incelenmedi

Yalnızca “Resmî incelemede bulunamadı” seçimi rapor metninde “bulunamamıştır” cümlesi üretecektir.

## 8. Rapor metni ve çıktı

Örnek açıklama:

> Fabrika Binasının 1. Üretim Holü için 1.000 m² alanlı, 12.05.2005 tarih ve 2005/123 sayılı Yeni Yapı Ruhsatı incelenmiştir. Aynı yapının 2. ve 3. Üretim Holleri için toplam 2.400 m² alanlı, 10.05.2010 tarih ve 2010/456 sayılı İlave Yapı Ruhsatı incelenmiştir.

Çıktı kuralları:

- Word tablosunda yapı adı ayrı bölüm satırı olarak gösterilir; tablo gereksiz yere aşırı genişletilmez.
- Excel çıktısında açık bir `Yapı` sütunu bulunur.
- Kapsam ve kapsanan alan hiçbir çıktıda kaybolmaz.
- Aynı resmî belge birden fazla yapıyı kapsıyorsa belge bir kez, kapsamları alt satırlar veya birleşik açıklama halinde gösterilir.
- Yalnız tarih/no benzerliğine bakılarak belgeler birleştirilmez; birleştirme yalnız aynı `documentId` için yapılır.
- Eski raporlarda yapı ilişkisi olmayan belge satırları `Parsel Geneli` altında gösterilir; veri kaybı olmaz.
- Yasal ve mevcut alan özeti yapı bazında verilir; parsel toplamı ayrıca hesaplanır.
- Yıkılmış ve inşa halindeki yapılar mevcut/final alanla yanlış biçimde toplanmaz; durumları açıkça belirtilir.

## 9. Uygulama fazları

### Faz 0 — Güvenlik ve kapsam sabitleme — Tamamlandı

- Claude'un devam eden Bina Özellikleri çalışması tamamlanıp değişiklikleri gözden geçirilmeden ortak `buildings` modelinde kodlamaya başlanmaz.
- Değişiklik öncesi `app.js`, `styles.css`, `index.html`, ilgili testler ve `handoff.md` yedeği.
- Belgeler alan kapsamı matrisi çıkarılır.
- Mevcut örnek JSON dosyalarıyla geriye uyumluluk sözleşmesi yazılır.
- Claude'un eklediği alanlar ile bu plandaki yapı alanları karşılaştırılır; aynı anlamdaki alanlar yeniden oluşturulmaz.

### Faz 1 — Kalıcı kimlik ve veri taşıma — Tamamlandı

- Yapılara kalıcı `id` eklenir.
- Yapı bölümlerine kalıcı `id` eklenir.
- Belgelere kalıcı `id` eklenir.
- Belge kapsamlarına `documentId`, `structureId`, `structurePartId`, `coveredAreaM2`, `areaEffect` eklenir.
- Eski yapı/belge kayıtları yüklenirken güvenli normalizasyon yapılır.
- Eski belgeler otomatik olarak `Parsel Geneli`ne atanır; kullanıcı verisi silinmez.
- Önceki taslak modele göre `structureId` taşıyan belgeler yüklenirse otomatik kapsam kaydına dönüştürülür.

### Faz 2 — Yapı sekmeli Belgeler ve Proje arayüzü — Tamamlandı

- `Parsel Geneli` + yapı sekmeleri + ortak `+ Yapı Ekle` düğmesi.
- Aktif sekmeye göre filtrelenen belge tablosu.
- Belge kimliği ile çoklu kapsam satırlarının ayrı düzenlenmesi.
- Kapsam, yapı bölümü, alan ve alan etkisi girişleri.
- Normal kullanıcı ve admin için aynı temel çalışma davranışı.

### Faz 3 — Yapı bazlı proje/EKB/uygunluk alanları — Tamamlandı

- Alan kapsamı matrisine göre proje, EKB, statik uygunluk ve yapı denetim alanları yapı sekmesine bağlanır.
- Kat İrtifakı blok/bağımsız bölüm davranışı korunur.

### Faz 4 — Açıklama ve çıktı entegrasyonu — Tamamlandı

- Yapı bazlı incelenen belgeler açıklaması.
- Word tablo gruplaması.
- Excel `Yapı`, `Kapsam` ve `Belge Alanı` sütunları.
- Banka şablonları ve placeholder denetimi.

### Faz 5 — Alan mutabakatı ve uyarılar — Tamamlandı

- Proje / ruhsat / iskan / yapı yasal alanı / mevcut alan karşılaştırmaları.
- Revizyon ve çift sayım uyarıları.
- Yapı silme ve yeniden atama güvenliği.

### Faz 6 — Sanayi teknik değişkenleri ve faktör önerileri — Tamamlandı

- Bina Özellikleri bölümündeki mevcut alanlar korunarak sanayiye özgü eksik teknik değişkenler eklenir.
- Ölçülebilir nesnel faktörler için otomatik öneriler üretilir.
- Uzman kararı gerektiren faktörlerde kullanıcı onayı aranır.
- Faktörün hangi yapı ve hangi veri nedeniyle oluştuğu kaynak etiketiyle gösterilir.

### Faz 7 — Regresyon, tarayıcı testi ve canlıya hazırlık — Tamamlandı

- Her fazdan önce ayrı yedek.
- İlgili izole testler, ardından `npm run verify`.
- Artifact/tarayıcı üzerinden gerçek senaryo testi.
- Handoff güncellemesi.
- Kullanıcı onayından sonra commit/push/deploy.

## 10. Zorunlu test senaryoları

1. Tek yapı + tek ruhsat.
2. Tek yapı + birden fazla ruhsat.
3. Fabrika yapısında 2005 tarihli 1. hol ruhsatı + 2010 tarihli 2. ve 3. hol ilave ruhsatı.
4. Aynı parselde İdari Bina + Fabrika + Kapalı Sundurma; belgeler birbirine karışmamalı.
5. Yapı sırası değişse bile belge bağlantıları korunmalı.
6. Belgesi bağlı yapı silinmek istendiğinde güvenli uyarı/re-atama akışı.
7. Eski JSON açıldığında tüm belgeler görünmeli ve veri kaybı olmamalı.
8. Kat İrtifakı blok sekmeleri değişmeden çalışmalı.
9. Normal kullanıcı yapı sekmelerini ve belge girişlerini görebilmeli.
10. Word ve Excel çıktısında yapı, kapsam ve m² eksiksiz görünmeli.
11. Tadilat/revizyon belgesi alan toplamını yanlışlıkla iki kez artırmamalı.
12. “Henüz incelenmedi” ile “bulunamadı” aynı rapor cümlesini üretmemeli.
13. Tek ruhsatın Fabrika + İdari Bina + Sundurma kapsamları tek belge kimliği altında saklanmalı.
14. Aynı ruhsat içinde iki üretim holüne farklı m² atanabilmeli.
15. Eski belgenin yerine geçen tadilat ruhsatı toplam alanda çift sayılmamalı.
16. Projede bulunan fakat yıkılmış yapı silinmeden ve belge bağlantıları kaybolmadan gösterilmeli.
17. İnşa halindeki yapının tamamlanma oranı maliyet/rapor özetinde doğru görünmeli; mevcut alanı otomatik değiştirmemeli.
18. Proje, ruhsat, iskan ve mevcut alan farkları ayrı ayrı uyarılmalı.
19. Nesnel olumsuz faktörün kaynağı (ör. `Yapı Kullanma İzni: bulunamadı`) kullanıcıya gösterilmeli.
20. Uzman yorumu isteyen faktör kullanıcı onayı olmadan rapora eklenmemeli.
21. Belge kapsamı birden fazla yapıya bağlıyken Word ve Excel'de belge kopyalanmadan tüm kapsamlar görünmeli.

## 11. Kabul kriterleri

- Yapı listesi iki farklı bölümde çoğaltılmıyor; tek kaynaktan yönetiliyor.
- Her resmî belge bir veya birden fazla doğru yapıya/yapı bölümüne bağlanabiliyor.
- Belgenin her yapı/bölüm için kapsadığı m² ayrı ve denetlenebilir veri olarak saklanıyor.
- Tek resmî belge, birden fazla kapsam için mükerrer belge kayıtlarına bölünmüyor.
- Bir yapının birden fazla tarihli ve farklı kapsamlı belgesi girilebiliyor.
- Yapı silme/sıralama işlemleri belge bağlantısını bozmuyor.
- Planlanan, inşa halinde, mevcut, metruk ve yıkılmış yapılar geçmiş bağlantıları korunarak izleniyor.
- Proje, ruhsat, iskan, yasal ve mevcut alanlar birbirinin üzerine yazılmıyor.
- Eski raporlar ve Kat İrtifakı blok sistemi geriye dönük çalışıyor.
- Açıklama, Word ve Excel çıktısı yapı bazını açıkça gösteriyor.
- Otomatik olumlu/olumsuz faktörler yalnız nesnel verilere dayanıyor; mesleki kanaat gerektirenler kullanıcı onaylı çalışıyor.
- Plan onaylandı; fazlar tamamlandı ve canlıya alma öncesi doğrulandı.

## 12. Kapsam dışı

- Yapıların banka değerleme hesaplarına otomatik bağlanması bu işin ilk sürümünde yapılmaz.
- Belge alanı farkı, kullanıcının onayı olmadan yasal/mevcut alan veya piyasa değerini değiştirmez.
- Mevcut Kat İrtifakı blok sistemi kaldırılmaz veya yeniden yazılmaz.
- Makine ve ekipmanların ayrı piyasa değeri ilk sürüm kapsamına alınmaz; yalnız yapıyla bütünleşik teknik tesisat varlık bilgisi tutulur.
- Çevresel kirlenme, zemin kontaminasyonu veya üretim kapasitesi için uzman mühendislik görüşü yerine otomatik kesin hüküm kurulmaz.
