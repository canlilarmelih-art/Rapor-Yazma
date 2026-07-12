// Halkbank g?ncel risk kodlar? listesi HB R?SK KODLARI.xlsx dosyas?ndan ?retilmi?tir.
(function (root, factory) {
  var data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  root.HalkbankRiskData = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  return [
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "1A",
    "status": "İpotek- Halkbank Lehine",
    "description": "Raporun hazırlandığı tarihten önce HALKBANK lehine ipotek tesis edilmişse bu risk kodu seçilir.",
    "reportText": "Taşınmaz üzerinde Halkbank lehine ipotek bulunmaktadır.",
    "valuationMethod": "Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "1B",
    "status": "İpotek- 3. Kişiler Lehine",
    "description": "Raporun hazırlandığı tarihten önce lehtarı HALKBANK olmayan ipotekler tesis edilmişse bu risk kodu seçilir.",
    "reportText": "Taşınmaz üzerinde 3. Kişiler/Kurumlar Lehine İpotek bulunmakta olup ipoteğin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "İpotek 3. kişiler/kurumlar lehine ise kaldırılması koşuluyla değer takdir edilmelidir. İpotek sahibi, tarihi, derecesi, tutarı ve döviz cinsi raporda belirtilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "1C",
    "status": "Kanuni İpotek Hakkı",
    "description": "Kanuni ipotek haklarının doğumu, aksi kanunda öngörülmüş olmadıkça, tapu kütüğüne tescil edilmelerine bağlı değildir. Türk Medeni Kanununun 893. maddesinde sayılan hallerde ise kanuni ipotek tescile bağlı olarak kurulmaktadır. Aşağıdaki durumlarda (tescilsiz) kanuni ipotek hakkı sonradan kurularak ve ipotek sıralarının önüne geçebilmektedir.",
    "reportText": "Taşınmaz üzerinde Kanuni İpotek Hakkı bulunmakta olup ipoteğin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Kanuni ipoteğin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tescil Hataları ve Tapu İptalleri",
    "code": "1D",
    "status": "Tapu Sicili ve Kadastro Arasındaki Tescil Hataları - Mülkiyet Haklarını Etkilemeyen",
    "description": "Takbis kayıtları, Tapu Sicili (Tapu Kütüğü), Kadastro Sicili, İmar ve parselasyon arasında farklılıklar olması, mükerrer/hatalı parsel numarası verilmesi, mükerrer (binmeli) parseller, kat irtifakı kuruluşu, parsel yüzölçümü veya hisse/arsa payı toplamları, tarih vb. konularda hata yapıldığının tespit edilmesi halinde kayıtların düzeltilmesi için TKGM'ne başvuru yapılması önerilir. Blok, kat ve bağımsız bölüm numarataj hata ve eksiklerinde bu risk kodu kullanılmaz; duruma uygun 107'li veya 109'lu risk kodlarından uygun olanlar seçilmelidir. İtilafa konu alanlar düşülerek değer takdir edilir.",
    "reportText": "Tapu kayıtlarında tescil hatası yapıldığı tespit edilmiş olup düzeltilmesi önerilmektedir.",
    "valuationMethod": "Öncelikle mutlaka tescil hatası olan kısmın büyüklüğü tespit edilmelidir. İtilafa konu alanlar düşülerek Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tescil Hataları ve Tapu İptalleri",
    "code": "1E",
    "status": "Arsa Payı Uyumsuzluğu",
    "description": "Kat irtifaklı/mülkiyetli taşınmazlarda taşınmazın değeri ile arsa payı orantılı olmalıdır. Orantılı olmadığı durumlarda arsa payı düzeltme davası açılabilir. Konu taşınmazın yasal alanına göre değeri ile sahip olması gereken arsa payı arasında %20'den fazla fark tespit edilmiş ise raporda detaylı açıklama yapılmalı ve taşınmaz aleyhine durumlarda arsa payının düzeltilmesi önerilmelidir. Arsa payının düşüklüğü taşınmazın değerini etkileyecek kadar fazla ise bu durum dikkate alınarak değer takdir edilmelidir. Arsa payı olması gerekenden yüksek belirlenmiş ise olması gereken arsa payına göre değer takdir edilir arsa payı fazlalığı dikkate alınmaz.",
    "reportText": "Taşınmazın değeri ile sahip olduğu arsa payı arasında orantısızlık tespit edilmiştir.",
    "valuationMethod": "Arsa payı taşınmazın değerine göre olması gerekenden düşük ise olumsuz etkisi dikkate alınarak değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "1F",
    "status": "Ticari İşletme Rehni - Halkbank Dışında 3. Kişiler Lehine",
    "description": "Taşınmaz üzerinde ticari işletme rehni bulunması halinde (Halkbank lehine rehinler hariç) rehnin kaldırılması koşulu ile değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde Ticari İşletme Rehni bulunmakta olup rehnin değere etkisi dikkate alınmadan kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Ticari işletme rehinini kaldırılması koşuluyla değer takdir edilmelidir. Ticari işletme rehini Halkbank lehine ise bu risk kodu kullanılmaz, raporun önemli not bölümünde belirtilmesi yeterlidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tescil Hataları ve Tapu İptalleri",
    "code": "1G",
    "status": "Tapu Sicili ve Kadastro Arasındaki Tescil Hataları - Mülkiyet Haklarını Etkileyen",
    "description": "Takpas kayıtları, Tapu Sicili (Tapu Kütüğü), Kadastro Sicili, İmar ve parselasyon arasında farklılıklar olması, mükerrer/hatalı parsel numarası verilmesi, mükerrer (binmeli) parseller, kat irtifakı kuruluşu, kat irtifakına esas onaylı projelerde bağımsız bölümün konum karşılığının yer almaması, parsel yüzölçümü veya hisse/arsa payı toplamları vb. konularda önemli hata yapıldığının tespit edilmesi halinde kayıtların düzeltilmesi için TKGM'ne başvuru yapılması önerilir. Blok, kat ve bağımsız bölüm numarataj hata ve eksiklerinde bu risk kodu kullanılmaz; duruma uygun 107'li veya 109'lu risk kodlarından uygun olanlar seçilmelidir. Tapu Sicilinde malikinin belirsiz olduğu durumlarda öncelikle mülkiyet hakları kesinleştirilmesi önerilir. İtilafa konu alanlar düşülerek değer takdir edilir.",
    "reportText": "Tapu kayıtlarında tescil hatası yapıldığı tespit edilmiş olup düzeltilmesi gerekmektedir. Mülkiyetiyle ilgili belirsizlik ve çekişmeli durumların ortadan kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Eksper tescil hatası olan kısmın büyüklüğü ve konumunu tespit etmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "1H",
    "status": "Tescil İşlemi Devam Eden Taşınmaz",
    "description": "Tapu Siciline tescil işlemleri devam eden (İmar uygulaması görmüş, kat irtifakı kurulacak, üst hakkı süresi uzatılacak vb.) taşınmazlara, tescilin tamamlanması şartı ile ve işlemden sonraki durumu dikkate alınarak Mevcut Durum Değeri takdir edilir. Belge ve bilgi eksikliği olması halinde sadece bilgi amaçlı değeri verilebilir.",
    "reportText": "Tapu Sicilinde tescil işlemleri devam etmekte olup tescil işleminin tamamlanması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Bu madde istisnai durumlar için olup Bankanın Genel Müdürlüğünün onayı alınmadan kullanılmaz. Tapu bilgisi olarak ana taşınmazın bilgileri yazılır ve önemli not bölümünde açıklanır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Tescil Hataları ve Tapu İptalleri",
    "code": "1I",
    "status": "Kat İrtifakı/Mülkiyeti Terkini",
    "description": "Binanın yıkılması, kentsel dönüşüm, deprem hasarı, imar uygulamaları, hatalı işlemler vb. nedenlerle kat irtifakının/mülkiyetinin terkin edildiği durumlarda taşınmazlar hisseli hale gelir.",
    "reportText": "Tapu Sicilinde kat irtifakı/mülkiyeti iptal edilmiştir.",
    "valuationMethod": "Arsa payından gelen hissesi dikkate alınarak değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Tescil Hataları ve Tapu İptalleri",
    "code": "1J",
    "status": "Tapu İptali, Tapu Terkini",
    "description": "Doğal afetler, resmi düzenlemeler vb. nedeniyle taşınmazların varlığının tamamen ortadan kalkması halinde kat mülkiyeti iptal edilebilir veya ilgili kütük sayfası tamamen kapatılabilir. Kütük sayfası kapatılan tapular için işlem yapılamaz, devredilen mülkiyet hakları incelenmelidir.",
    "reportText": "Taşınmazın tapusu iptal edilmiştir.",
    "valuationMethod": "Mülkiyet hakları başka bir parsele taşınmış ve taşıma işlemi kesinleşmiş ise bu risk kodu kullanılmaz, eksper tarafından yeni tapu bilgileri temin edilerek değerleme raporu hazırlanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "1K",
    "status": "Yıkılmış, Harap Olmuş Bina Beyanı",
    "description": "Kullanım ömrünün dolması, deprem vb. nedenlerle yıkılan yapılar için kullanılan beyandır.",
    "reportText": "Taşınmazın üzerindeki yapının yıkıldığına dair beyan bulunmaktadır.",
    "valuationMethod": "Yıkılan yapı dikkate alınmadan arsası için değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "2A",
    "status": "Kamu Haczi (Amme Alacağı Haczi) - Haciz Tutarı Taşınmazın Mevcut Değerinin %10'undan Fazla",
    "description": "Devlete olan borçların ödenmemesi durumunda ilgili kamu kurumlarının icra kanalları aracılığı ile gerçekleştirdiği hacze kamu haczi denilmektedir. Haciz şerhi olan bir taşınmazın net teminat değeri, haciz tutarının faizi ile birlikte ulaşacağı toplam tutar düşülerek belirlenebileceğinden ve kamu alacakları da ayrıca tahsil edileceğinden hacizli taşınmazın teminat değeri kısıtlıdır. Kamu hacizleri öncelikli olarak tahsil edilir.",
    "reportText": "Taşınmaz üzerinde Kamu (Amme Alacağı) Haczi bulunmakta olup haczin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle durumun 2E risk koduna uygunluğu kontrol edilir. Diğer şerh ve ipoteklerden önce 1. Sırada Halkbank ipoteği varsa ve haciz tutarı taşınmazın mevcut değerinin %30'undan dan az ise (durum 2E risk koduna uygun ise) 2ABCD risk kodları kullanılmaz; 2E risk koduna göre değer takdir edilir. Durum 2E risk koduna uygun değilse ve kamu haczi tutarı taşınmazın mevcut değerinin %10'lundan fazla ise 2A risk kodu seçilir ve haczin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "2B",
    "status": "Haciz Şerhi - Haciz Tutarı Taşınmazın Mevcut Değerinin %10'undan Fazla",
    "description": "Taşınmazın net teminat değeri, haciz tutarının faizi ile birlikte ulaşacağı toplam tutar düşülerek belirlenebileceğinden hacizli taşınmazın teminat değeri kısıtlıdır.",
    "reportText": "Taşınmaz üzerinde özel kişiler/kurumlar lehine Haciz bulunmakta olup haczin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle durumun 2E risk koduna uygunluğu kontrol edilir. Diğer şerh ve ipoteklerden önce 1. Sırada Halkbank ipoteği varsa ve haciz tutarı taşınmazın mevcut değerinin %30'undan dan az ise (durum 2E risk koduna uygun ise) 2ABCD risk kodları kullanılmaz; 2E risk koduna göre değer takdir edilir. Durum 2E risk koduna uygun değilse ve haczi tutarı taşınmazın mevcut değerinin %10'lundan fazla ise 2B risk kodu seçilir ve haczin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "2C",
    "status": "İhtiyati Haciz Şerhi - Haciz Tutarı Taşınmazın Mevcut Değerinin %10'Undan Fazla",
    "description": "Taşınmazın net teminat değeri, haciz tutarının faizi ile birlikte ulaşacağı toplam tutar düşülerek belirlenebileceğinden hacizli taşınmazın teminat değeri kısıtlıdır.",
    "reportText": "Taşınmaz üzerinde İhtiyati Haciz şerhi bulunmakta olup haczin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle durumun 2E risk koduna uygunluğu kontrol edilir. Diğer şerh ve ipoteklerden önce 1. Sırada Halkbank ipoteği varsa ve haciz tutarı taşınmazın mevcut değerinin %30'undan dan az ise (durum 2E risk koduna uygun ise) 2ABCD risk kodları kullanılmaz; 2E risk koduna göre değer takdir edilir. Durum 2E risk koduna uygun değilse ve ihtiyati haczi tutarı taşınmazın mevcut değerinin %10'lundan fazla ise 2C risk kodu seçilir ve haczin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "2D",
    "status": "Haciz; İhtiyati Haciz veya Kamu Haczi Şerhi - Haciz Tutarı Taşınmazın Mevcut Değerinin %10'undan Az",
    "description": "Taşınmazın net teminat değeri, haciz tutarının faizi ile birlikte ulaşacağı toplam tutar düşülerek belirlenebileceğinden hacizli taşınmazın teminat değeri kısıtlıdır.",
    "reportText": "Taşınmaz üzerinde özel kişiler/kurumlar lehine Haciz bulunmakta olup haczin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle durumun 2E risk koduna uygunluğu kontrol edilir. Diğer şerh ve ipoteklerden önce 1. Sırada Halkbank ipoteği varsa ve haciz tutarı taşınmazın mevcut değerinin %30'undan dan az ise (durum 2E risk koduna uygun ise) 2ABCD risk kodları kullanılmaz; 2E risk koduna göre değer takdir edilir. Durum 2E risk koduna uygun değilse ve haciz ya da kamu haczi tutarı taşınmazın mevcut değerinin %10'lundan az ise 2D risk kodu seçilir ve haczin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "2E",
    "status": "Haciz, İhtiyati Haciz veya Kamu Haczi Şerhi - Halkbank'a İpotekli ve Haciz Tutarı Taşınmazın Mevcut Değerinin %30'Undan Az",
    "description": "Daha önce Bankamız lehine ipotek tesis edilmiş olup, (1A Risk Kodu işaretli olup) Haciz şerhindeki tutarın gayrimenkul değerinin %30 ve altında olması durumunda bu risk kodu seçilmelidir.",
    "reportText": "Taşınmaz üzerinde 3. kişiler/kurumlar lehine haciz ve Halkbank ipoteği bulunmakta olup haczin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Diğer şerh ve ipoteklerden önce 1. Sırada Halkbank ipoteği varsa ve haciz tutarı taşınmazın mevcut değerinin %30'undan dan az ise 2E risk kodu seçilerek Yasal ve Mevcut Durum Değeri takdir edilir ve haczin kaldırılması koşuluyla değer takdir edilir. Bu madde seçildiğinde ayrıca 2ABCD maddeleri seçilmez.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "3A",
    "status": "Hisseli Taşınmaz Değerlemesi",
    "description": "Hisseli taşınmazların hisselerin tamamının değeri takdir edilir. Taşınmazın hisse bazında satışı tüm hisselerin birlikte satışına göre daha güç olacağından istisnai durumlar hariç tüm hisselerinin teminat alınması önerilmektedir.",
    "reportText": "Taşınmaz hisseli olup hisselerin tamamının değeri takdir edilmiştir. Taşınmazın hisse bazında satışı güç olacağından tüm hisselerinin teminat alınması önerilmektedir.",
    "valuationMethod": "Talep aşamasında hisse tapularının bir bölümü gönderilse dahi Banka tarafından işlem özelinde kısmi değerleme istenmediği sürece taşınmazın tamamının yasal ve mevcut değeri takdir edilmeli, hissedarların isimleri ve hisse payları raporda belirtilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "3B",
    "status": "İştirak Halinde Mülkiyet ve Mal Ortaklığı",
    "description": "İştirak halinde (elbirliği) mülkiyet, birden fazla şahsın, aralarında kanundan veya sözleşmeden doğan ortaklık nedeniyle ve pay oranları açıkça gösterilmeksizin, bir taşınmaz mala birlikte malik olmalarıdır. İştirak halinde mülkiyet kanundan (mirasçılık) ya da sözleşmeden doğmaktadır ve her paydaşın hakkı, iştirake konu taşınmaz malın tümünü kapsamaktadır. İştirak halinde tasarruf edilen payların iştirake dahil olmayan üçüncü kişilere devri yasak olup miras payının sadece mirasçılara devri mümkündür. Belirtilen beyanlar kaldırılmadan alım/satım ve ipotek tesisi yapılamamaktadır.",
    "reportText": "Taşınmaz İştirak Halinde (Elbirliği) Mülkiyete konu olup iştirak halinin giderilmesi veya tüm hisselerin teminat alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu sadece iştirak halinde mülkiyet ve mal ortaklıkları içindir, hisseli taşınmazlar için kullanılmaz. İştirak halinde mülkiyete konu taşınmazlarda iştirak halinin giderilmesi veya tüm hisselerin teminat alınması koşuluyla değer belirlenmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "3C",
    "status": "Veraset İntikal İlişiği Kesilmemiştir Beyanı",
    "description": "Veraset ilişiği kesilmemiştir veya İntikal İlişiği Kesilmemiştir beyanları taşınmazın alım satımına engel teşkil etmektedir. Bu beyanlar kaldırılmadan alım/satım ve ipotek tesisi yapılamamaktadır. Herhangi bir işlem sırasında, vefat eden kişinin borcu olmadığına dair tapu müdürlüğüne yazı ibraz edilerek beyanların kaldırılması gerekmektedir.",
    "reportText": "Taşınmaz üzerinde Veraset İntikal beyanı bulunmakta olup beyanın kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Veraset İntikal beyanının kaldırılması koşuluyla değer takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "3D",
    "status": "Hisseli Kısım Değerlemesi",
    "description": "Hisseli taşınmazlarda tüm hissedarlar taşınmazın her kısmı üzerinde hisseleri oranında hak sahibi olduğundan taşınmazın ayrılmış bir bölümü üzerinde kullanım ve tam mülkiyet hakkı öne sürülemez. Hisseye karşılık taşınmazın gösterilen/kullanılan bir bölümü için değer takdir edilse dahi itilaflı durumlar oluşabilir ve hissedarlar ortaklığın giderilmesi için dava açabilir. Bu nedenle hisseli taşınmazların tüm hisselerinin teminat alınması genel kural olup sadece hisseli kısma değer takdir edilerek teminat alınması istisna kapsamındadır. Bir hissenin ve/veya hissenin kullanımındaki yapının değerlemesi talep edildiğinde ekspertiz öncesinde Ekspertiz Müdürlüğü onayı alınmalı ve raporda değerleme yapılan kısım açıkça belirtilerek bilgi amaçlı değer takdir edilmelidir.",
    "reportText": "Taşınmaz hisseli olup sadece hissesi için değerleme talep edilmiştir. Hisseli taşınmazların ve üzerindeki binaların kullanım hakkı müştereken tüm hissedarlara aittir. Bu nedenle beyan edilen hisse ve bina için bilgi amaçlı değer belirlenmiştir.",
    "valuationMethod": "Bu risk kodu hisse sahiplerinin parseli yada binayı kat irtifakı kurmadan kendi aralarında yaptıkları anlaşmayla paylaştığı ve kullandığı, taşınmazın sadece bir bölümü ve üzerindeki bina için değerleme yapılan durumlarda kullanılır. (Örneğin büyük bir parseli hissedarların fiilen parseli paylaştığı ve ayrı ayrı müstakil binalar yaparak kullandığı durumlar.)",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "3E",
    "status": "Malikin Ölü Olduğu Belirtmesi",
    "description": "Malikin ölmesi halinde konu taşınmaz üzerindeki 3. kişilere ait ayni haklarla birlikte devir işlemlerini takiben hak sahibi mirasçıların mülkiyetine geçecektir. Üzerinde ölünceye kadar bakma vaadi şerhi bulunan taşınmazlarda bakmakla yükümlü kişi hak sahibi olacaktır.",
    "reportText": "Taşınmaz üzerinde malikin öldüğü beyanı bulunmakta olup beyanın kaldırılması ya da kanuni mirasçılara veya hak sahiplerine devir işleminin tamamlanması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Veraset ve mülkiyet devir işlemlerinin tamamlanması koşuluyla değer takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "3F",
    "status": "Nakil İle Yükümlü Mirasçı Tayini",
    "description": "Mirası bırakan kişinin mirası, belirlediği kişi ya da kişilere, belirlediği zaman diliminde geçmesi için bir nakil ile yükümlü mirasçıya (ön mirasçıya) bırakır. Ön mirasçı mirasa ortaktır ve mirastan yararlanma hakkına sahiptir. Bununla birlikte, ön mirasçı mirası bırakan kişinin belirlediği kişiye (art mirasçıya) mirasın bırakılacağı belirtilen zamana kadar beklemekle görevlidir. Zamanı geldiğinde belirlenen kişiye mirası devreder. Eğer taşınmazlarda daha önceden konulan bir şerh söz konusu ise ve buna rağmen art mirasçıya geçmeden satış işlemi gerçekleşmişse, art mirasçı mirasın belirlenen zamanı geldiğinde üçüncü kişilerden taşınmazları geri alabilir.",
    "reportText": "Taşınmaz üzerinde Nakil ile Yükümlü Mirasçı Tayini beyanı bulunmakta olup beyanın değere etkisi dikkate alınmadan, kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Nakil ile Yükümlü Mirasçı Tayini beyanının kaldırılması koşuluyla değer takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "4A",
    "status": "Zemine Yönelik Hisse - Belediye, OSB veya Resmi Kurumlara Ait",
    "description": "Zemine Yönelik Belediye, OSB ya da kamu kurumu hissesi bulunması durumunda bu hissenin değeri düşülerek değer takdir edilmelidir. Söz konusu hisselerin (özellikle binanın yıkılarak yenilenmesi durumunda) kat maliklerince satın alınması gerekmektedir.",
    "reportText": "Ana taşınmaz üzerinde zemine yönelik Belediye/OSB/Resmi Kurum hissesi bulunmaktadır. Zemin hissesinin değeri konu taşınmazın değerinden (arsa payı oranında) düşülerek değer takdir edilmiştir.",
    "valuationMethod": "İmar ve parselasyon uygulamaları nedeniyle belediye ve kamu kurumları (Maliye Hazinesi hariç) lehine zemin hissesi oluşan, üzerinde yapı olan veya olmayan tüm parsellerde 4A risk kodu seçilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "4B",
    "status": "Maliye Hazinesi Hissesi - Doğrudan Hissedarlara Satış Yapılabilir Hisse",
    "description": "Zemine Yönelik Hisse Maliye Hazinesi adına ise; Milli Emlak Genel Tebliği’ndeki Hazinenin hissedar olduğu taşınmazların diğer hissedar veya hissedarlara satışında çeşitli nedenlerle hisseli hale gelmiş taşınmazlardaki hazine hissesi, uygulama imar planı sınırları içinde 400, dışında ise 4.000 metrekareyi ve her iki durumda da taşınmazın %40 hissesini aşmamak kaydıyla talep sahibi hissedar veya hissedarlarına doğrudan satılabilecektir, maddesi kapsamına girip girmediği incelenerek değer takdir edilmelidir. Hazine hissesi %40'ı aşan durumlarda sadece Mevcut Durum Değeri takdir edilir.",
    "reportText": "Zemine Yönelik Maliye Hazinesi Hissesi bulunmaktadır. Hazinenin zemin hissesinin değeri konu taşınmazın değerinden (arsa payı oranında) düşülerek değer takdir edilmiştir.",
    "valuationMethod": "Maliye hazinesi zemin hissesi imar planı sınırları içinde 400, dışında ise 4.000 metrekareyi ve her iki durumda da taşınmazın %40 hissesini aşmıyorsa bu risk kodu kullanılır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "4C",
    "status": "Maliye Hazinesi Hissesi - Doğrudan Hissedarlara Satış Yapılamayan Hisse",
    "description": "Zemine Yönelik Hisse Maliye Hazinesi adına ise; Milli Emlak Genel Tebliği’ndeki Hazinenin hissedar olduğu taşınmazların diğer hissedar veya hissedarlara satışında çeşitli nedenlerle hisseli hale gelmiş taşınmazlardaki hazine hissesi, uygulama imar planı sınırları içinde 400, dışında ise 4.000 metrekareyi ve her iki durumda da taşınmazın %40 hissesini aşmamak kaydıyla talep sahibi hissedar veya hissedarlarına doğrudan satılabilecektir, maddesi kapsamına girip girmediği incelenerek değer takdir edilmelidir. Hazine hissesi %40'ı aşan durumlarda sadece Mevcut Durum Değeri takdir edilir.",
    "reportText": "Zemine Yönelik Maliye Hazinesi Hissesi bulunmaktadır. Hazinenin zemin hissesinin değeri konu taşınmazın değerinden (arsa payı oranında) düşülerek değer takdir edilmiştir.",
    "valuationMethod": "Maliye hazinesi zemin hissesi imar planı sınırları içinde 400, dışında ise 4.000 metrekareyi ve her iki durumda da taşınmazın %40 hissesini aşıyorsa bu risk kodu kullanılır.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "4D",
    "status": "Zemine Yönelik Hisse - Şahıs veya Şirket Hissesi",
    "description": "Mevcut yapının yıkılması halinde zemine yönelik hisse sahiplerinin parsel ve üzerinde inşa edilecek yeni binada hakları olacaktır. Zemine Yönelik Hisse şahıs veya şirket lehine ise, zemine yönelik hisse miktarının taşınmaza etkisi yorumlanarak ve zemin hissesinin değeri konu taşınmazın değerinden (arsa payı oranında) düşülerek değer takdir edilir. Üzerindeki yapının ekonomik ömrü tamamlanmış ise hisseli arsa gibi değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde özel şahıs/şirket lehine zemine yönelik hisse bulunmaktadır. Zemin hissesinin değeri konu taşınmazın değerinden (arsa payı oranında) düşülerek değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle zemine yönelik hissenin miktarı belirlenmelidir. Zemine yönelik hisse miktarının taşınmazın değerine etkisi incelenmeli ve hisse binanın satış değerini etkileyecek büyüklükte ise taşınmazın toplam değerinden düşülerek değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "5A",
    "status": "Aile Konutu Şerhi (TMK 194)",
    "description": "Aile konutu şerhi yüklü taşınmaz üzerinde mülkiyete ilişkin tasarruflarda bulunulabilmesi için mülk sahibinin eşinin muvafakatinin alınmasını gerekmektedir.",
    "reportText": "Taşınmaz üzerinde Aile Konutu şerhi bulunmakta olup Şerhin Kaldırılması veya Eş Muvafakati Alınması Koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "5B",
    "status": "Aile Yurdu Şerhi (TMK 386)",
    "description": "Aile yurdu şerhi verilmiş taşınmazın malikinin tasarruf yetkisi kullanımla sınırlıdır. Taşınmaz devrolunamaz, rehnedilemez, kiraya verilemez, aleyhine cebrî icra yoluna başvurulamaz.",
    "reportText": "Taşınmaz üzerinde Aile Yurdu şerhi bulunmakta olup Şerhin kaldırılması veya eş muvafakati alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "6A",
    "status": "İrtifak Hakkı - TEK, TEDAŞ, İSKİ, İETT, Kanalizasyon Geçiş, Vb.",
    "description": "İrtifak hakkı sahip olan kişiye, başkasına ait bir taşınmazı kullanma ve yararlanma hakkı vermektedir. Mülkiyet ve kullanım hakkını kısıtlayan ve bu kısıtlamaya bağlı olarak değeri etkileyen bir sınırlandırma söz konusudur. TEK, TEDAŞ, İSKİ, İETT, Kanalizasyon Geçiş, vb. lehine altyapı ihtiyaçların karşılanması amacıyla tesis edilen irtifak hakları genellikle değeri etkilememektedir. Kullanımı kısıtlayan ve değeri etkileyen durumlar ayrıca değerlendirilmelidir.",
    "reportText": "Taşınmaz üzerinde TEK, İSKİ, TEDAŞ, İETT, enerji veya su-pis su nakil hatları vb. lehine İrtifak Hakkı bulunmaktadır.",
    "valuationMethod": "TEK, TEDAŞ, İSKİ vb. lehine irtifak hakkının konumu, kapsadığı alan ve taşınmazın değerine etkisi incelenmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "6B",
    "status": "Akaryakıt İstasyonu İntifa Hakkı veya Kira Şerhi",
    "description": "İntifa hakkı veya kira şerhi bulunan taşınmazlarda süre sonuna kadar kullanım hakkı intifa sahibinde yada kiracıda olacaktır. Akaryakıt istasyonlarında yapılan yatırımlar karşılığı bayrak hakkı sahibi dağıtım firması lehine intifa hakkı ve kira şerhi tesis edilmekte olup genellikle 5 yıl ile sınırlı olsa da yatırımın büyüklüğüne göre daha uzun süreli tesis edilebilmektedir. Değer takdirinde intifa hakkı/kira sözleşmesi etkisi dikkate alınmaz ve kullanım hakkı dahil tam mülkiyet değeri takdir edilir. Bununla birlikte, kullanımın ana dağıtım firmasında olması taşınmazın satış kabiliyetini olumsuz yönde etkileyeceği hususu raporda ayrıca belirtilir.",
    "reportText": "Taşınmaz üzerinde İntifa Hakkı/Kira Sözleşmesi bulunmaktadır. Değer takdirinde intifa hakkı/kira sözleşmesi etkisi dikkate alınmamıştır. Kullanım hakkının süre sonuna kadar dağıtım firmasında olması taşınmazın satış kabiliyetini olumsuz yönde etkileyecektir.",
    "valuationMethod": "Akaryakıt istasyonuna isim veren akaryakıt dağıtım firması lehine intifa hakkı veya kira şerhi bulunuyor ise;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "6C",
    "status": "İntifa Hakkı - 5 Yıldan Az Süresi Kalan",
    "description": "İntifa hakkı sahip olan kişiye, başkasına ait bir taşınmazı kullanma ve yararlanma hakkı vermektedir. Mülkiyet ve kullanım hakkını kısıtlayan ve bu kısıtlamaya bağlı olarak değeri etkileyen bir sınırlandırma söz konusudur.",
    "reportText": "Taşınmaz üzerinde İntifa Hakkı bulunmaktadır. İntifa hakkı süresinin bitmesine 5 yıldan az süre kaldığından değer takdirinde intifa hakkının etkisi dikkate alınmamıştır.",
    "valuationMethod": "Diğer intifa hakkı şerhlerinde, kalan süre 5 yıldan az ise intifa hakkının etkisi dikkate alınmadan değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "6D",
    "status": "İntifa Hakkı - 5 Yıldan Fazla Süresi Kalan",
    "description": "İntifa hakkı sahip olan kişiye, başkasına ait bir taşınmazı kullanma ve yararlanma hakkı vermektedir. Mülkiyet ve kullanım hakkını kısıtlayan ve bu kısıtlamaya bağlı olarak değeri etkileyen bir sınırlandırma söz konusudur.",
    "reportText": "Taşınmaz üzerinde İntifa Hakkı bulunmaktadır. İntifa hakkı süresinin bitmesine 5 yıldan fazla süre kaldığından intifa hakkının etkisi dikkate alınmadan takyidatın kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Süresiz veya kalan süresi 5 yıldan uzun süreli ise intifa hakkının kaldırılması koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7A",
    "status": "Üst Hakkı Değerlemesi - 15 Yıldan Fazla Süresi Kalan Bağımsız Üst Hakkının Değerlemesi",
    "description": "Üst hakkı, başkasına ait bir taşınmazın üstünde veya altında, yapı yapmak veya yapılmış bir yapıyı muhafaza etmek yetkisini sağlayan, gerçek ve tüzel kişiler lehine kurulabilen şahsi bir irtifak hakkıdır. Üst hakkı farklı amaçlarla tesis edilebilmekte olup, kapsamına ve süresine göre, taşınmazın değerine ve satış kabiliyetine etkisi bulunmaktadır. Üst hakkı değerlemesinde, kalan kullanım süresine göre üst hakkının değeri belirlenir. Üst hakkı sözleşmelerinde arsa-arazi üzerinde yapılacak yapı-tesislerin üçüncü şahıslara devrini veya ipotek edilmesini engelleyici bir hüküm bulunup bulunmadığı araştırılmalı, devri veya ipotek tesisini engelleyici bir hüküm varsa raporda açıklanmalıdır. Üst hakkı değeri belirlenirken üst hakkı sözleşmesinden kaynaklanan kira bedeli dikkate alınmaz. Bununla birlikte üst hakkı sözleşmesi temin edilebilirse üst hakkı kira değeri ve varsa diğer taahhütler ile üst hakkı iptaline neden olabilecek sözleşme şartları raporda ayrıca incelenmelidir. Bağımsız üst hakkı değerlemesinde raporda mutlaka üst hakkı için oluşturulmuş zemin ID yazılmalı ve üst hakkı sayfasındaki takyidatlar belirlenmelidir. Üst hakkı değerlemesinde kesinlikle ana taşınmazın Zemin ID'si üst Hakkı Zemin ID'si yerine yazılmamalıdır.",
    "reportText": "Tapu Sicilinde ayrı sayfaya tescil edilmiş Üst Hakkı Değerlemesi yapılmıştır. Üst hakkı sözleşmesinden kaynaklanan kira bedelinin maliyeti ile üst hakkı iptali ve sözleşmeden kaynaklanan diğer riskler dikkate alınmadan, kalan üst hakkı süresi için değer takdir edilmiştir.",
    "valuationMethod": "\"Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmiş üst hakları için kullanılmalıdır. Her durumda üst hakkı kira bedeli ile sözleşmeden kaynaklanan üst hakkı iptali vb. riskler dikkate alınmadan, üst hakkının kapsamına ve kalan süresine göre değer takdir edilir ve bu durum raporun önemli not bölümüne açıklanır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7B",
    "status": "Üst Hakkı Değerlemesi - 15 Yıldan Az Süresi Kalan Bağımsız Üst Hakkının Değerlemesi",
    "description": "Üst hakkı, başkasına ait bir taşınmazın üstünde veya altında, yapı yapmak veya yapılmış bir yapıyı muhafaza etmek yetkisini sağlayan, gerçek ve tüzel kişiler lehine kurulabilen şahsi bir irtifak hakkıdır. Üst hakkı farklı amaçlarla tesis edilebilmekte olup, kapsamına ve süresine göre, taşınmazın değerine ve satış kabiliyetine etkisi bulunmaktadır. Üst hakkı değerlemesinde, kalan kullanım süresine göre üst hakkının değeri belirlenir. 15 yıldan az süre kalmış ise sadece Mevcut Durum Değeri takdir edilir. Üst hakkı sözleşmelerinde arsa-arazi üzerinde yapılacak yapı-tesislerin üçüncü şahıslara devrini veya ipotek edilmesini engelleyici bir hüküm bulunup bulunmadığı araştırılmalı, devri veya ipotek tesisini engelleyici bir hüküm varsa raporda açıklanmalıdır. Üst hakkı değeri belirlenirken üst hakkı sözleşmesinden kaynaklanan kira bedeli dikkate alınmaz. Bununla birlikte üst hakkı sözleşmesi temin edilebilirse üst hakkı kira değeri ve varsa diğer taahhütler ile üst hakkı iptaline neden olabilecek sözleşme şartları raporda ayrıca incelenmelidir. Bağımsız üst hakkı değerlemesinde raporda mutlaka üst hakkı için oluşturulmuş zemin ID yazılmalı ve üst hakkı sayfasındaki takyidatlar belirlenmelidir. Üst hakkı değerlemesinde kesinlikle ana taşınmazın Zemin ID'si üst Hakkı Zemin ID'si yerine yazılmamalıdır.",
    "reportText": "Tapu Sicilinde ayrı sayfaya tescil edilmiş Üst Hakkı Değerlemesi yapılmıştır. Üst hakkı sözleşmesinden kaynaklanan kira bedelinin maliyeti ile üst hakkı iptali ve sözleşmeden kaynaklanan diğer riskler dikkate alınmadan, kalan üst hakkı süresi için (kalan üst hakkı süresinin 15 yıldan az olması sebebiyle sadece Mevcut Durum Değeri) takdir edilmiştir.",
    "valuationMethod": "\"Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmiş üst hakları için kullanılmalıdır. Her durumda üst hakkı kira bedeli ile sözleşmeden kaynaklanan üst hakkı iptali vb. riskler dikkate alınmadan, üst hakkının kapsamına ve kalan süresine göre değer takdir edilir ve bu durum raporun önemli not bölümüne açıklanır.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7C",
    "status": "Bağımsız Olmayan Üst Hakkı - Süre Bitimine 5 Yıldan Az Kalan Ana Taşınmazın Değerlemesi",
    "description": "Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmemiş üst hakları için kullanılmalıdır. Üst hakkı süresi boyunca kullanım hakkı üst hakkı sahibine aittir. Bu durum taşınmazın değerini ve satış kabiliyetini olumsuz etkilemektedir. Üst hakkı tapu siciline “Bağımsız Taşınmaz” olarak tescil edilmemiş ise, üst hakkı ipoteği alınamaz, teminat değeri yoktur ve bağımsız olmayan üst hakları için hiçbir değer takdir edilemez.",
    "reportText": "Taşınmaz üzerinde bağımsız ve sürekli olmayan Üst Hakkı bulunmaktadır. Üst hakkı süresinin bitmesine 5 yıldan az kaldığından değerlemede üst hakkının etkisi dikkate alınmamıştır.",
    "valuationMethod": "Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmemiş üst hakları için kullanılmalıdır. Bağımsız taşınmaz olarak tapu sicilinde ayrı sayfada tescil edilmemiş üst haklarında kalan süre 5 yıldan az ise (üst hakkı dikkate alınmadan) ana taşınmaz için Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7D",
    "status": "Bağımsız Olmayan Üst Hakkı - Süre Bitimine 5 Yıldan Fazla Kalan Ana Taşınmazın Değerlemesi",
    "description": "Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmemiş üst hakları için kullanılmalıdır. Üst hakkı süresi boyunca kullanım hakkı üst hakkı sahibine aittir. Üst hakkı yüklü taşınmaz için kalan üst hakkı süresindeki kullanım hakkının değeri düşülerek kuru (çıplak) mülkiyet değeri takdir edilebilir. Üst hakkının uzun süreli olması fiili durumda satış kabiliyetini ciddi ölçüde olumsuz etkileyen bir durumdur. Üst hakkı tapu siciline “Bağımsız Taşınmaz” olarak tescil edilmemiş ise, üst hakkı ipoteği alınamaz, teminat değeri yoktur ve bağımsız olmayan üst hakları için hiçbir değer takdir edilemez.",
    "reportText": "Taşınmaz üzerinde bağımsız ve sürekli olmayan Üst Hakkı bulunmaktadır. Üst hakkı süresinin bitmesine 5 yıldan fazla süre kaldığından değerlemede üst hakkının etkisi dikkate alınmıştır.",
    "valuationMethod": "Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmemiş üst hakları için kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7E",
    "status": "Üst Hakkı Bağımsız Gayrimenkul Olarak Tescil Edilmiş Ana Taşınmazın Değerlemesi",
    "description": "Bağımsız ve sürekli üst hakkı yüklü taşınmazlarda sadece çıplak mülkiyet değer talep edilen durumlarda taşınmazın toplam (tam mülkiyet) değerinden kalan üst hakkı süresine göre 7A ve 7B maddelerine göre hesaplanacak üst hakkı değeri çıkartılarak bulunacak taşınmaz değeri takdir edilmelidir. Üst hakkının uzun süreli olması fiili durumda satış kabiliyetini ciddi ölçüde olumsuz etkileyen bir durumdur.",
    "reportText": "Üst Hakkı yüklü taşınmazın kuru (çıplak) mülkiyetinin değerlemesi yapılmıştır. Üst hakkı süresi bitinceye kadar taşınmazın kullanım ve diğer tasarruf hakları üst hakkı sahibinde olacaktır.",
    "valuationMethod": "Bu risk kodu sadece Tapu Sicilinde ayrı bir sayfaya tescil edilmiş üst hakkı bulunması halinde (üst hakkı değeri hariç) ana taşınmaz değerlemesi yapılırken kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Üst Hakkı",
    "code": "7F",
    "status": "Üst Hakkı Değerlemesi - Tahsis Şartlarını Gerçekleştirmemiş Bağımsız Üst Hakkının Değerlemesi",
    "description": "Üst Hakkı tahsisleri belirli bir süre içinde inşaat yapılmasına ve tesisin faaliyete geçmesine, yapılan binanın Turizm tesisi vb. amaçlarla işletilmesine, belirli bir süreden fazla faaliyetin durdurulmamasına bağlı olarak yapılabilmektedir. Tahsis koşullarının gerçekleşmemesi halinde tahsislerin iptal riski bulunmaktadır. Üst Hakkı Tahsisinin iptal edilmesi üst hakkı üzerine tesis edilmiş olan ipoteklerin de iptaline neden olacaktır. Binaların inşaatının tamamlanmadığı, tesisin faaliyette olmadığı ancak tahsis koşullarının gerçekleşmesi için yeterli süre bulunan durumlarda sadece MEVCUT DURUM DEĞERİ takdir edilir.",
    "reportText": "Taşınmazın üst hakkı tahsis şartları gerçekleştirilmemiş olup verilen süre içinde tahsis şartlarının gerçekleştirilmesi koşuluyla bağımsız üst hakkı için değer takdir edilmiştir.",
    "valuationMethod": "\"Üst Hakkı sözleşmesi temin edilip tahsis koşulları incelenmelidir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Üst Hakkı",
    "code": "7G",
    "status": "Üst Hakkı Değerlemesi - Tahsis Şartlarını Gerçekleştirme Süresi Bitmiş/Yetersiz/Bilinmeyen Bağımsız Üst Hakkı Değerlemesi",
    "description": "Üst Hakkı tahsisleri belirli bir süre içinde inşaat yapılmasına ve tesisin faaliyete geçmesine, yapılan binanın Turizm tesisi vb. amaçlarla işletilmesine, belirli bir süreden fazla faaliyetin durdurulmamasına bağlı olarak yapılabilmektedir. Tahsis koşullarının gerçekleşmemesi halinde tahsislerin iptal riski bulunmaktadır. Üst Hakkı Tahsisinin iptal edilmesi üst hakkı üzerine tesis edilmiş olan ipoteklerin de iptaline neden olacaktır. Tahsis koşullarının gerçekleşmesi (binaların inşaatının tamamlanması, tesisin faaliyete geçmesi vb.) için verilen sürenin bittiği ya da yetersiz olduğu durumlarda sadece Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmazın üst hakkı tahsis şartları gerçekleştirilmesi için verilen süre dolmuştur. Bu durum üst hakkının ve üzerindeki ipoteklerin iptaline neden olabilir.",
    "valuationMethod": "Üst Hakkı sözleşmesi temin edilip tahsis koşulları incelenmelidir.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "İrtifak Hakları",
    "code": "7H",
    "status": "Diğer İrtifak Hakları",
    "description": "Sözleşme ile kurulan ya da 5084 sayılı Yatırımların Ve İstihdamın Teşviki Hakkında Kanun, 6831 sayılı Orman Kanunu veya diğer muhtelif kanunlardan kaynaklanan irtifak haklarının ve irtifak hakkı vaatlerinin, niteliği, kapsamı, taşınmazın kullanımına, yapılaşmasına, satış kabiliyetine etkileri incelenerek ve kısıtlanan kısmın olumsuz etkisi göz önünde bulundurularak değer değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde İrtifak Hakkı bulunmakta olup kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "İrtifak hakkının kapsamına ve süresine göre taşınmaza etkisi değerlendirilerek ve taşınmaz değerinden düşülerek değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "8A",
    "status": "Geri Alım (Vefa) Hakkı - 10 Yıllık Süre Dolmuş, OSB Dışında",
    "description": "Vefa hakkı bir taşınmazı satanın, sattığı şartlarda taşınmazını belirlenen süre içinde ve sözleşme şartlarına göre geri alma hakkıdır. Tapu kütüğüne şerh edilen geri alım hakları, şerhten itibaren 10 yıl içinde olmak kaydıyla şerhte belirtilen süre içinde her malike karşı kullanılabilir. Hak sahibinin hakkı kullanma ihtimali, fiili durumda satış kabiliyetini ciddi ölçüde kısıtlayan bir durumdur. OSB'lerde arsa borcu olan ve tesisi üretime geçmeyen yatırımcılara tapuları geri alım hakkı (Vefa hakkı) şerhi konularak verilmekte; gayrimenkul borçlar ödenip, tesis işletmeye açılmadıkça şerh tapu kayıtlarından kaldırılmamaktadır.",
    "reportText": "Taşınmaz üzerinde Geri Alım (Vefa) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmuş olması sebebiyle değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık hak düşürücü süresi dolmuş ise Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "8B",
    "status": "Geri Alım (Vefa) Hakkı - 10 Yıllık Süre Dolmamış, OSB Dışında",
    "description": "Vefa hakkı bir taşınmazı satanın, sattığı şartlarda taşınmazını belirlenen süre içinde ve sözleşme şartlarına göre geri alma hakkıdır. Tapu kütüğüne şerh edilen geri alım hakları, şerhten itibaren 10 yıl içinde olmak kaydıyla şerhte belirtilen süre içinde her malike karşı kullanılabilir. Hak sahibinin hakkı kullanma ihtimali, fiili durumda satış kabiliyetini ciddi ölçüde kısıtlayan bir durumdur.",
    "reportText": "Taşınmaz üzerinde Geri Alım (Vefa) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmamış olması sebebiyle şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "OSB'ler lehinde olmayan ve 10 yıllık hak düşürücü süresi dolmamış vefa hakkı varsa şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "8C",
    "status": "Geri Alım (Vefa) Hakkı - OSB Lehine",
    "description": "OSB tarafından tahsis edilen arsaların tapuları tahsis bedelinin tümüyle ödenmesi veya kalan borç için teminat mektubu verilmesi halinde, tesisi üretime geçenlere geri alım hakkı şerhi konulmadan, tesisi üretime geçmeyenlere ise geri alım hakkı şerhi konularak verilmektedir. Sabit yatırım tutarının en az %50’si tutarında yatırım kredisi alan katılımcılara tahsis bedelini defaten ödemeleri veya tahsis bedelinden kalan borcu için teminat mektubunu vermeleri durumunda üretime geçme şartı aranmaksızın geri alım hakkı şerhi konulmadan tapuları verilebilmektedir. Taahhütlere uyulmaması nedeniyle arsa tahsisinin iptali halinde arsa bedeli, OSB tarafından parsel tahsis veya satış işleminin gerçekleştiği tarihteki arsa bedeline 213 sayılı Kanun uyarınca yeniden değerleme oranı eklenmek suretiyle hesaplanır, binalar için ilave bir bedel ödenmez. Her hâlükârda katılımcıya geri ödenecek tutar, OSB'nin güncel parsel tahsis bedelinin üzerinde olamaz. Ayrıca bedelsiz tahsislerin taahhüt şartlarının yerine getirilmemesi halinde bedel iadesiz iptali de söz konusudur. OSB'nin geri alım (vefa) hakkı kullanma ihtimali, fiili durumda satış kabiliyetini ciddi ölçüde kısıtlayan bir durumdur. Gayrimenkul borçlar ödenip, tesis işletmeye açılmadıkça şerh tapu kayıtlarından kaldırılmamaktadır. Değer takdirinde tesisin üretime geçme durumu, ödenmemiş arsa taksitleri ve diğer borçları dikkate alınmamakta olup müşteri tarafından OSB Müdürlüğünden muaccel hale gelen ve gelmeyen tüm taksit ve borçlara ilişkin yazı alınarak şubeye ibraz edilmelidir. Organize Sanayi Bölgeleri Uygulama Yönetmeliğinin 61 maddesindeki başkalarına devirlerle ilgili hususlara aykırılığın mahkemelerce tespiti halinde ise, arsa kimin tasarrufunda olursa olsun, tahsis veya satış tarihindeki bedeliyle OSB tarafından geri alınabilir.",
    "reportText": "Taşınmaz üzerindeki OSB lehine Geri Alım (Vefa) Hakkı bulunmaktadır. Değer takdirinde tesisin ödenmemiş arsa taksitleri ve diğer borçları dikkate alınmamış olup şerhin kaldırılması veya borçların ödenerek tesisin üretime geçmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Geri alım hakkının kullanılarak, arsa tahsisinin iptali halinde arsa bedeli, OSB tarafından parsel tahsis veya satış işleminin gerçekleştiği tarihteki arsa bedeline 213 sayılı Kanun uyarınca yeniden değerleme oranı eklenmek suretiyle hesaplanır, binalar için ilave bir bedel ödenmez.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "9A",
    "status": "Geçici Tescil Şerhi",
    "description": "Geçici Tescil Şerhi var olduğu ileri sürülen bir ayni hakkın güvence altına alınması veya tasarruf yetkisini belirleyen belgelerin eksikliği halinde tamamlanmasına olanak sağlanması için koyulan şerhtir. Bildirime konu hak kesinleştiğinde bildirimin sicile işlendiği tarihten itibaren hüküm ifade eder. Mülkiyet hakkının sona erme ihtimali söz konusudur.",
    "reportText": "Taşınmaz üzerinde Geçici Tescil şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "10A",
    "status": "Gayrimenkul Satış Vaadi",
    "description": "Satış vaadi, ileride yapılacak satışın süre ve tutar üzerinden taahhüt edilmesidir. Bu taahhütle, taşınmaz maliki taşınmazı belirlenmiş değer üzerinden satma borcu altına girer. Satış vaad eden satmaktan kaçınırsa satış vaadini kabul edenin mahkemeye başvurarak cebri tescil isteme hakkı vardır. Alacaklı dava yoluyla mülkiyetin adına tescilini ve şerhten sonraki tarihli ipotek-haciz gibi takyidatların terkinini sağlayabilir. Taşınmazın satış kabiliyetini ve buna bağlı olarak da piyasa değerini ciddi ölçüde düşüren bir etki söz konusudur.",
    "reportText": "Taşınmaz üzerinde Gayrimenkul Satış Vaadi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "11A",
    "status": "Alım (İştira) Hakkı - 10 Yıllık Süre Dolmuş",
    "description": "Alım (İştira) hakkı, bu hakka sahip olana, şerhten itibaren 10 yıl içinde olmak kaydıyla sözleşmede belirlenen süre içinde, tek taraflı bir istemle, taşınmazı belli bir bedel ile satın almasını sağlayan bir haktır. Alım hakkı sahibi açısından bir alma mecburiyeti yoktur. Alım hakkı sahibi bu hakkı dilerse kullanabilir. Alım (iştira) hakkı ile kısıtlı bir taşınmazın talep edilirliği ve buna bağlı olarak piyasa değeri ciddi ölçüde düşük olacaktır.",
    "reportText": "Taşınmaz üzerinde Alım (İştira) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmuş olması sebebiyle değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık hak düşürücü süresi dolmuş ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "11B",
    "status": "Alım (İştira) Hakkı - 10 Yıllık Süre Dolmamış",
    "description": "Alım (İştira) hakkı, bu hakka sahip olana, şerhten itibaren 10 yıl içinde olmak kaydıyla sözleşmede belirlenen süre içinde, tek taraflı bir istemle, taşınmazı belli bir bedel ile satın almasını sağlayan bir haktır. Alım hakkı sahibi açısından bir alma mecburiyeti yoktur. Alım hakkı sahibi bu hakkı dilerse kullanabilir. Alım (iştira) hakkı ile kısıtlı bir taşınmazın talep edilirliği ve buna bağlı olarak piyasa değeri ciddi ölçüde düşük olacaktır.",
    "reportText": "Taşınmaz üzerinde Alım (İştira) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmamış olması sebebiyle şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık hak düşürücü süre dolmamış ise şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "12A",
    "status": "Ayni Sermaye Şerhi - Hak Sahibi Şirket Taşınmazın Mülkiyetini Devralmış",
    "description": "TTK 342. Maddeye Göre üzerlerinde sınırlı ayni bir hak, haciz ve tedbir bulunmayan, nakden değerlendirilebilen ve devrolunabilen, taşınmazlar şirketlere ayni sermaye olarak konulabilir. Ayni sermaye olarak koyulmuş taşınmazların ipotek alımında hak sahibi şirket ile malikin aynı tüzel kişi olması şartı aranmalıdır. Malik ile ayni sermayesi olarak belirtilen kayıt sahibi şirketin farklı olması durumunda, hak sahibi olan şirketin, açacağı dava ile hukuki değeri bulunmayan ipoteğin terkinine neden olabilir.",
    "reportText": "Taşınmaz üzerinde Ayni Sermaye şerhi bulunmakta olup hak sahibi şirket ile taşınmazın maliki aynıdır.",
    "valuationMethod": "Hak sahibi şirket ile taşınmazın maliki aynı tüzel kişi ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "12B",
    "status": "Ayni Sermaye Şerhi - Hak Sahibi Şirket Taşınmazın Mülkiyetini Devralmamış",
    "description": "TTK 342. Maddeye Göre üzerlerinde sınırlı ayni bir hak, haciz ve tedbir bulunmayan, nakden değerlendirilebilen ve devrolunabilen, taşınmazlar şirketlere ayni sermaye olarak konulabilir. Ayni sermaye olarak koyulmuş taşınmazların ipotek alımında hak sahibi şirket ile malikin aynı tüzel kişi olması şartı aranmalıdır. Malik ile ayni sermayesi olarak belirtilen kayıt sahibi şirketin farklı olması durumunda, hak sahibi olan şirketin, açacağı dava ile hukuki değeri bulunmayan ipoteğin terkinine neden olabilir.",
    "reportText": "Taşınmaz üzerinde Ayni Sermaye şerhi bulunmakta olup taşınmazın hak sahibi şirkete devrinin yapılmamış olmaması sebebiyle şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Hak sahibi şirket ile taşınmazın maliki aynı tüzel kişi değilse şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "13A",
    "status": "Bağışlama Vaadi Şerhi",
    "description": "Bağışlama vaadi, bir kimsenin, bir malının tümünün veya bir kısmının mülkiyetini karşılıksız olarak başka bir kimseye devretmek için söz vermesidir. Şerhin satış kabiliyetini ve piyasa değerini ciddi ölçüde düşüren bir etkisi bulunmaktadır.",
    "reportText": "Taşınmaz üzerinde Bağışlama Vaadi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "14A",
    "status": "Hibeden Rücu, Bağışlayana Rücu, Vahide Rücu",
    "description": "Hibeden Rücu, Bağışlayana Rücu, Vahide Rücu durumlarında şartlı bağışlamadan cayma hakkı söz konusu olduğundan malikin değişme riski bulunmaktadır.",
    "reportText": "Taşınmaz üzerinde Hibeden Rücu (Bağışlayana rücu, Vahide rücu) hakkı bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "15A",
    "status": "Ölünceye Kadar Bakma Sözleşmesi Şerhi - Vefat Belgelenmemiş",
    "description": "Ölünceye kadar bakma şerhi bakım alacaklısı hak sahibine taşınmaz üzerinde öncelikli yasal ipotek hakkı vermektedir. Malikinin tasarrufuna bir sınırlama getirilmemiş olmakla birlikte şerh nedeniyle mülkiyet hakkının sona erme ihtimali söz konusudur. Mülkiyet üzerindeki fiili sınırlandırıcı etkisi nedeniyle talepte azalma ve değerde bir düşüş etkisi yaratır.",
    "reportText": "Taşınmaz üzerinde Ölünceye Kadar Bakma Sözleşmesi şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması veya bakmakla yükümlü bulunan kişinin vefat ettiğinin belgelenmesi ve mülkiyet hakkının kesinleşmesi koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "15B",
    "status": "Ölünceye Kadar Bakma Sözleşmesi Şerhi - Vefat Belgelenmiş",
    "description": "Ölünceye kadar bakma şerhi bakım alacaklısı hak sahibine taşınmaz üzerinde öncelikli yasal ipotek hakkı vermektedir. Bakılması vaad edilen kişinin vefat ettiği nüfus kayıtları ile belgelenmiş ise şartsız değer takdir edilebilir.",
    "reportText": "Taşınmaz üzerinde Ölünceye Kadar Bakma Sözleşmesi şerhi bulunmakta olup bakılması vaad edilen kişinin vefat ettiği nüfus kayıtları ile belgelendiğinden değer takdir edilmiştir.",
    "valuationMethod": "Bakılması vaad edilen kişinin vefat ettiği nüfus kayıtları ile belgelenmiş ise şartsız değer takdir edilebilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "16A",
    "status": "Vesayet (Kanuni Kısıtlılık) Beyanı",
    "description": "Mahkeme kararı ile kesinleşmiş vasi tayinlerinde (Vesayet altına alınmıştır) beyanı, vesayet davası devam eden durumlarda ise mahkeme kararı ile (Vesayet Tedbir Şerhi) koyulabilmektedir. Taşınmazların alımı, satımı, rehnedilmesi ve bunlar üzerinde başka bir aynî hak kurulması için vesayet makamının izni gereklidir.",
    "reportText": "Taşınmaz üzerinde Vesayet (Kanuni kısıtlılık) beyanı bulunmakta olup beyan terkin edilmeden veya Yetkili Vasi olmadan alım satım veya teminat işlemleri yapılamayacaktır.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir. Vesayetin kaldırıldığı belgelenmiş ise bu risk kodu kullanılmaz 74A risk kodu kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "16B",
    "status": "Malik/İlgili Bizzat Gelmeden İşlem Yapılamaz Beyanı",
    "description": "Tapu Sicilinde malik veya ilgilinin bizzat gelmeden işlem yapılamayacağının belirtilmesi halinde vekalet ile işlem yapılamaz.",
    "reportText": "Taşınmaz üzerinde malik veya ilgilinin bizzat gelmeden işlem yapılamayacağı beyanı bulunmakta olup ilgilisi olmadan alım satım veya teminat işlemleri yapılamayacaktır.",
    "valuationMethod": "Şerhin kaldırılması veya malikin işleme onay vermesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "16C",
    "status": "Kanuni Müşavir Beyanı",
    "description": "Vesayet altına alınmasına gerek olmayan ancak fiil ehliyetinden kısmen mahrum edilmesi kendi yararına olan reşit kimselere, resmi, hukuki, mali işleri için görüşü alınmak üzere mahkemece atanan kişilere Kanuni Müşavir denilmektedir. Yapılacak işlemlerde malikle birlikte Kanuni Müşavirin de olurunun alınması gerekmektedir.",
    "reportText": "Taşınmaz üzerinde Kanuni Müşavir beyanı bulunmakta olup yapılacak işlemlerde malikle birlikte olurunun alınması gerekmektedir.",
    "valuationMethod": "Şerhin kaldırılması veya malikin ve Kanuni Müşavirin işleme onay vermesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir. Kanuni Müşavirin iptal edildiği belgelenmiş ise bu risk kodu kullanılmaz 74A risk kodu kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "17A",
    "status": "Şufa (Önalım) Hakkı - 10 Yıllık Süre Dolmuş",
    "description": "Şufa (önalım) hakkı, hak sahibine, taşınmazın satışı halinde öncelikle satın alma imkânı verir. Şufa hakkı, kanundan (yasal) veya sözleşmeden olmak üzere iki şekilde doğabilir. Tapu kütüğüne şerh verilen sözleşmeden doğan önalım hakkı, şerhte belirtilen sürede ve belirtilen koşullara göre her malike karşı kullanılabilir. Kütükte koşullar belirtilmemişse taşınmazın üçüncü kişiye satışındaki koşullar esas alınır. Şerhin etkisi şerhin verildiği tarihin üzerinden on yıl geçmekle sona erer. Şufa hakkı sahibinin taşınmazı öncelikli alım hakkı bulunduğundan, taşınmazın satış kabiliyetini olumsuz etkileyecektir.",
    "reportText": "Taşınmaz üzerinde Akdi Önalım (Şufa) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmuş olması sebebiyle değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık süre dolmuş ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "17B",
    "status": "Şufa (Önalım) Hakkı - 10 Yıllık Süre Dolmamış",
    "description": "Şufa (önalım) hakkı, hak sahibine, taşınmazın satışı halinde öncelikle satın alma imkânı verir. Şufa hakkı, kanundan (yasal) veya sözleşmeden olmak üzere iki şekilde doğabilir. Tapu kütüğüne şerh verilen sözleşmeden doğan önalım hakkı, şerhte belirtilen sürede ve belirtilen koşullara göre her malike karşı kullanılabilir. Kütükte koşullar belirtilmemişse taşınmazın üçüncü kişiye satışındaki koşullar esas alınır. Şerhin etkisi şerhin verildiği tarihin üzerinden on yıl geçmekle sona erer. Şufa hakkı sahibinin taşınmazı öncelikli alım hakkı bulunduğundan, taşınmazın satış kabiliyetini olumsuz etkileyecektir.",
    "reportText": "Taşınmaz üzerinde Akdi Önalım (Şufa) Hakkı bulunmakta olup 10 yıllık hak düşürücü sürenin dolmamış olması sebebiyle şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık hak düşürücü süre dolmamış ise şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "17C",
    "status": "1164 Sayılı Arsa Ofisi Kanununun 10. Maddesi Gereğince Önalım Hakkı",
    "description": "Arsa Ofisi Genel Müdürlüğü; konut, sanayi, eğitim, sağlık ve turizm yatırımları ve kamu tesisleri için planlamayı öngördüğü ve ilgili tapu idarelerine bildirdiği arsa ve arazinin satışlarında şuf'a hakkına haizdir. Tapu dairelerine yapılacak bildiri üzerine Arsa Ofisi en geç 30 gün zarfında şuf'a hakkını kullanacağını bildirmediği ve bu süre içinde ödenmiş satış bedelini malik adına yatırmadığı takdirde, şuf'a hakkının kullanılmasından vazgeçmiş sayılır. 30 günlük süre içinde ödenmiş satış bedeli ile her türlü harç ve masrafların yatırılmasını müteakip, tapu dairelerince re 'sen eski satışın iptali ile Arsa Ofisi adına tescil işlemi yapılır. Bu halde tapu idareleri re 'sen şuf'a hakkı şerhini kaldırmaya yetkilidir.",
    "reportText": "Taşınmaz üzerinde 1164 Sayılı Arsa Ofisi Kanununun 10. Maddesi Gereğince Önalım Hakkı bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir. Satış kabiliyeti SATILABİLİR seçilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "17D",
    "status": "Kanunlardan Kaynaklanan Önalım Hakkı",
    "description": "6306 sayılı Afet Riski Altındaki Alanların Dönüştürülmesi Hakkında Kanun ve diğer muhtelif kanunlardan kaynaklanan önalım haklarının taşınmazın teminat değerine etkisi incelenerek ve olası sonuçları değerlendirilerek işlem yapılmalıdır.",
    "reportText": "Taşınmaz üzerinde Önalım Hakkı bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir. Satış kabiliyeti SATILABİLİR seçilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "18A",
    "status": "Satışa Arz (İİK 150/C Maddesi) Şerhi, İpoteğin Paraya Çevrilmesi - Halkbank Talebiyle Satışa Arz",
    "description": "Taşınmaz ile ilgili olarak İcra İflas Kanunun 150/C maddesine göre ipotek alacağının paraya çevrilmesi işlemlerinin başlandığına ilişkin şerhtir. Taşınmazın alım-satım işlemine konu olmasında engel bulunmamakla birlikte taşınmaz İcra İhalesi yapılarak satışa çıkarılır ve ihale sonucu ihale alıcısı adına cebri icra yoluyla tescili yapılır. İcra İhalesinin kesinleşmesiyle birlikte şerhten sonra yapılan mülkiyet devirleri ve ipotekler sicilden kaldırılacaktır. Taşınmaz icra ihalesi ile satış aşamasında olduğundan, 150/c şerhi uygulamada tasarrufu ciddi ölçüde güçleştiren bir durum yaratacaktır.",
    "reportText": "Taşınmaz üzerinde Satışa Arz (İİK 150/C Maddesi) şerhi bulunmakta olup Halkbank tarafından satışa arz edilmiştir.",
    "valuationMethod": "Halkbank tarafından satışa arz edilmiş ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "18B",
    "status": "Satışa Arz (İİK 150/C Maddesi) Şerhi, İpoteğin Paraya Çevrilmesi - Halkbank Dışında Satışa Arz",
    "description": "Taşınmaz ile ilgili olarak İcra İflas Kanunun 150/C maddesine göre ipotek alacağının paraya çevrilmesi işlemlerinin başlandığına ilişkin şerhtir. Taşınmazın alım-satım işlemine konu olmasında engel bulunmamakla birlikte taşınmaz İcra İhalesi yapılarak satışa çıkarılır ve ihale sonucu ihale alıcısı adına cebri icra yoluyla tescili yapılır. İcra İhalesinin kesinleşmesiyle birlikte şerhten sonra yapılan mülkiyet devirleri ve ipotekler sicilden kaldırılacaktır. Taşınmaz icra ihalesi ile satış aşamasında olduğundan, 150/c şerhi uygulamada tasarrufu ciddi ölçüde güçleştiren bir durum yaratacaktır.",
    "reportText": "Taşınmaz üzerinde Satışa Arz (İİK 150/C Maddesi) şerhi bulunmakta olup 3. kişiler/kurumlar tarafından satış talep edildiğinden şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "3. kişiler/kurumlar tarafından satışa arz edilmiş ise şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "19A",
    "status": "Davacı Lehine Hüküm (İİK. 28. Madde)",
    "description": "İcra-İflas Kanunu 28. Madde Şerhi davacı lehine hüküm verildiğine dair şerhtir.",
    "reportText": "Taşınmaz üzerinde davacı lehine hüküm verildiğine dair İcra İflas Kanunu 28. madde şerhi (davacı lehine hüküm verildiğine dair şerh) bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "19B",
    "status": "İcra Satışı Yapılmış Taşınmaz (İİK. 131. Madde)",
    "description": "İcra-İflas Kanunu 131. Madde Şerhi icra satışının yapıldığına ve bedelinin tahsil edilerek devredileceğine dair şerhtir.",
    "reportText": "Taşınmaz üzerinde icra satışının yapıldığına ve bedelinin tahsil edilerek devredileceğine dair İcra İflas Kanunu 131. madde şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "20A",
    "status": "Ticareti Terk Eden Tacir (İİK. 44. Madde) - Halkbank İpoteği Tarihi Şerhten Sonra",
    "description": "Ticareti terk eden bir tacir için verilen şerhtir. Ticareti terk eden bir tacir onbeş gün içinde keyfiyeti kayıtlı bulunduğu ticaret siciline bildirmeye ve bütün aktif ve pasifi ile alacaklılarının isim ve adreslerini gösteren bir mal beyanında bulunmaya mecburdur. Bu ilan tarihinden itibaren bir sene içinde, ticareti terk eden tacir hakkında iflas yolu ile takip yapılabilir. Ticareti terk etmek suretiyle alacaklıların takibinden kurtulmak isteyen kişiler tarafından kullanılabilen bir madde olduğundan şerhin koyulduğu tarih ayrıca önemlidir. Şerhten sonra alınacak ipoteklerde öncelikli sırada başka alacaklar bulunabilir.",
    "reportText": "Taşınmaz üzerinde ticareti terk eden bir tacir, İcra İflas Kanunu 44. madde şerhi bulunmakta olup Halkbank ipoteği şerhten sonradır. Şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "20B",
    "status": "Ticareti Terk Eden Tacir (İİK. 44. Madde) - Halkbank İpoteği Tarihi Şerhten Önce",
    "description": "Ticareti terk eden bir tacir için verilen şerhtir. Ticareti terk eden bir tacir onbeş gün içinde keyfiyeti kayıtlı bulunduğu ticaret siciline bildirmeye ve bütün aktif ve pasifi ile alacaklılarının isim ve adreslerini gösteren bir mal beyanında bulunmaya mecburdur. Bu ilan tarihinden itibaren bir sene içinde, ticareti terk eden tacir hakkında iflas yolu ile takip yapılabilir. Ticareti terk etmek suretiyle alacaklıların takibinden kurtulmak isteyen kişiler tarafından kullanılabilen bir madde olduğundan şerhin koyulduğu tarih ayrıca önemlidir. Mevcut Halkbank ipotekleri öncelikli alacak olup, şerhten sonra alınacak ipoteklerde öncelikli sırada başka alacaklar bulunabilir.",
    "reportText": "Taşınmaz üzerinde ticareti terk eden bir tacir, İcra İflas Kanunu 44. madde şerhi bulunmakta olup Halkbank ipoteği şerhten öncedir.",
    "valuationMethod": "Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "21A",
    "status": "İflas/ Konkordato Şerhi",
    "description": "İİK’nın 184.maddesi gereğince iflas açıldığı zaman müflisin haczi kabil bütün malları hangi yerde bulunursa bulunsun bir masa teşkil eder ve alacakların ödenmesine tahsis olunur. İİK’nın 191.maddesine göre borçlunun iflas açıldıktan sonra masaya ait mallar üzerinde her türlü tasarrufu alacaklılara karşı hükümsüz olur. Aynı şekilde konkordatonun tasdikinden önce yapılmış hukuki işlemler de iptale tabidir. Kanunda aranan şartların varlığı halinde ipotek işlemi de tasarrufun iptali davasına konu olabilecektir. Şerhin geçerli olduğu süre boyunca taşınmaz tasarruf edilemediğinden teminat değeri bulunmamaktadır. İflas masası tarafından taşınmazın satışı yapılabilir. İİK 285 ila 309 maddeleri ise konkordatonun genel hükümlerini içermektedir.",
    "reportText": "Taşınmaz üzerinde İflas/Konkordato şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İpotek-Haciz-İflas-Cebri Satışlar",
    "code": "22A",
    "status": "İflas Erteleme",
    "description": "Şirket durumunun ıslahı mümkün görülüyorsa idare meclisi veya bir alacaklının talebi üzerine mahkeme iflas kararını tehir edebilir. Yeni Türk Ticaret Kanunu’nda iflasın ertelenmesi 376 ve 377 maddelerde yer almaktadır. 377. Maddede de İcra ve İflas Kanununun 179 ilâ 179/b maddelerine atıf yapılmıştır.",
    "reportText": "Taşınmaz üzerinde İflas Erteleme şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "23A",
    "status": "İzale-i Şüyu (Ortaklığın Giderilmesi) Davası Şerhi",
    "description": "İzale-İ Şüyuu (Ortaklığın Giderilmesi) Davası taşınmazın hissedarları arasındaki ortaklığın taksim veya satış yoluyla giderilmesi için açılan davadır. Ortaklığın taşınmazın bölünmesi veya satışı suretiyle giderilmesi mümkün olup ipotekli taşınmazlarda, bölünme halinde taşınmaz üzerindeki ipotek parçalar üzerinde korunacak, satış halinde ise ipotekli olarak satın alana geçecektir. Davanın seyri sırasında mahkemelerce maliklerin tasarruf yetkisinin kısıtlanma ihtimali de bulunmaktadır. Hisseli taşınmazlarda ortaklığın giderilmesi için her zaman dava yoluna başvurulabilir.",
    "reportText": "Taşınmaz üzerinde İzale-i Şüyu (Ortaklığın Giderilmesi) Davası şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "23B",
    "status": "Şüyuunun İdamesi Sözleşmesi",
    "description": "Kat irtifakı kurulmasına kanunen izin verilmeyen, imar fonksiyonu (turizm alanı vb.) gereğince kat irtifakı tesis edilemeyen alanlarda malikler kendi aralarında şüyuunun idamesi sözleşmesi düzenleyerek fiilen paylaşım yapabilmektedir. Şüyuunun idamesi sözleşmesi yapılsa ve Tapu siciline eklense dahi bu taşınmazlar mevzuata göre hisseli taşınmaz durumundadır. Kanuni kısıtlamalara ve yapı ruhsatındaki fonksiyonlara aykırı olarak şüyuunun idamesi sözleşmesi ile konut olarak kullanılan ve/veya fazla yapı inşa edilen taşınmazların ruhsat ve iskanlarının iptali söz konusu olabilir ve bu projelerden tapu alan hak sahipleri ile kredi veren bankalar zarara uğrayabilirler. Mevzuata aykırı olarak konut amaçlı kullanılan taşınmazların konut kullanımdan men edilmesi ve ceza riskleri de bulunmaktadır. Kat irtifakı kurulup bağımsız bölümler teşkil edilmediğinden bilgi amaçlı değer takdir edilir. Farklı bir nedenle şunun idamesi sözleşmesi yapılmış ise rapor özelinde değerlendirilmelidir.",
    "reportText": "Taşınmaz Şüyuunun İdamesi Sözleşmesi ile malikler arasında paylaşıma konu olmuştur. Kat irtifakı kurulup bağımsız bölümler teşkil edilmediğinden bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "İmar planında izin verilenden fazla inşaat izni alınması ve konut kullanımına açılması için düzenlenen şüyuunun idamesi sözleşmelerinde sadece Bilgi Amaçlı Değeri takdir edilmelidir. Farklı bir nedenle şunun idamesi sözleşmesi yapılmış ise rapor özelinde değerlendirilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "24A",
    "status": "Finansal Kiralama Şerhi",
    "description": "Finansal Kiralama yöntemiyle edinilen taşınmazın kiralama sözleşmesi tapu kütüğünün beyanlar hanesine şerh edilir. Tescil veya şerhten sonra, üçüncü kişilerin finansal kiralama konusu mal üzerindeki aynî hak iktisapları kiralayana karşı ileri sürülemez. Kiralama döneminin ve ödemelerin bitmiş olması yeterli değildir, şerhin kaldırılması gerekir.",
    "reportText": "Taşınmaz üzerinde Finansal Kiralama şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "25A",
    "status": "2981 Sayılı Kanuna Göre Kat İrtifakı/Mülkiyeti Edinimi",
    "description": "2981 sayılı İmar ve Gecekondu Mevzuatına Aykırı Yapılara Uygulanacak Bazı İşlemler Kanununa göre kat mülkiyeti edinimi şerhi, kat mülkiyetine geçiş işleminin anılan kanun hükümlerinin uygulanması sonucu oluştuğunu ve hak sahibi adına kat mülkiyeti tesis edildiğini göstermektedir. Taşınmazın değerini olumsuz etkilememektedir. Riskli alanlar dâhilindeki yapılar ile riskli yapıların değerini etkileyen unsurların somut durum ve uygulamalar gözetilerek mahallinde tespiti gerekmektedir.",
    "reportText": "Taşınmaz üzerinde 2981 Sayılı Kanuna Göre Kat İrtifakı/Mülkiyeti Edinimi şerhi bulunmaktadır.",
    "valuationMethod": "Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "25B",
    "status": "2981 Sayılı Kanuna Göre Tapu Tahsis Belgesi ile Mülkiyet Hakkı Kazanımı",
    "description": "2981 sayılı Kanun hükümlerine göre hazine, belediye, il özel idaresine ait veya Vakıflar Genel Müdürlüğünün idare ettiği arsa veya araziler üzerinde, gecekondu sahiplerince yapılmış yapılar, kanunun 12'nci madde hükümlerine göre tespit ettirildikten sonra, kayıt maliki kamu kuruluşunca bu yer hak sahibine tahsis edilir ve bu tahsisin yapıldığı tapu sicilinin beyanlar hanesinde gösterilerek ilgilisine Tapu Tahsis Belgesi verilir. Tapu tahsis belgesi, ıslah imar planı veya kadastro planları yapıldıktan sonra hak sahiplerine verilecek tapuya esas teşkil etmektedir. Belirtme taşınmazın değerini olumsuz etkilememektedir. Teminat alınması için tahsis belgesi tapuya dönüşmüş olmalıdır.",
    "reportText": "2981 Sayılı Kanuna Göre verilen Tapu Tahsis Belgesi ile mülkiyet hakkı kazanılmıştır.",
    "valuationMethod": "Tahsis belgesi tapuya dönüşmüş taşınmazlar için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "26A",
    "status": "Hazineye İade Şerhi - Devir Protokolü Şartları Gerçekleşmiş",
    "description": "Taşınmazlar, Hazine, Arsa Ofisi ve Toplu Konut İdaresi tarafından amacına uygun kullanım ve satış, altyapı tesis vb. yapma taahhütlerine bağlı olarak satılabilmektedir. Satılan taşınmazların satış amacı dışında kullanılamayacağına, amacı dışında kullanıldığının tespiti halinde, satılan taşınmazın satış bedelinin faizsiz iade edilerek Hazine tarafından geri alınacağına dair tapu kütüğüne şerh konulur. Taahhütlerin yerine getirilmemesi durumunda kayıtsız şartsız Hazine’ye iade riski bulunmaktadır. Şerhin kaldırılması için devir protokolündeki yatırım taahhütlerinin yerine getirilmesi ve ilgili kanunda belirtilen ödemelerin yapılması gerekebilir. 4706 Sayılı Hazineye Ait Taşınmaz Malların Değerlendirilmesi Hakkında Kanuna göre toplu konut amaçlı olarak kullanılmak üzere Belediyelere, Toplu Konut İdaresi Başkanlığına, Konut Yapı Kooperatiflerine, küçük sanayi sitesi yapma amacıyla kurulmuş kooperatiflere, borsa yapılmak üzere ticaret borsalarına, serbest bölge olarak kullanılmak üzere, kamu kurum ve kuruluşları ile kamu kurumu niteliğindeki meslek kuruluşlarına, teknoloji geliştirme bölgelerindeki yönetici şirkete satılabilir. 4706 sayılı Kanun kapsamında edinilen taşınmazlar iktisap ve satış şekline bakılmaksızın satış tarihinden itibaren on tam yıl geçmiş olması, yapı kullanma izin belgesinin alınması ve idareye borcun ve dava durumunun bulunmaması halinde şerh idarece kaldırılabilir. Arsa Ofisi ve Toplu Konut İdaresi sattığı veya devrettiği arsa ve arazinin amacına uygun kullanılması için tapu kayıtlarına, satış şartlarına uygun alt yapı, yapı veya tesis yapılmadıkça üçüncü kişilere satış, devir, temlik yapılamayacağı ve haczedilemeyeceği hususunda şerhler koydurmaya ve/veya bu amaca yönelik sözleşmeler yapmaya yetkilidir. Tanzim satışı yapılan arsalar üzerine plân amacına uygun yapı veya tesis yapılmadıkça üçüncü kişilere satış, devir ve temlik yapılamayacağı ve haczedilemeyeceği konusunda tapu kayıtlarına şerh konur. Şerhin kaldırılması 1164 sayılı Kanunun 11. Maddesine ilişkin Yönetmeliğin 7. Maddesindeki şartların yerine getirilmesi halinde mümkündür.",
    "reportText": "Taşınmaz üzerinde Hazineye İade şerhi bulunmakta olup, devir protokolündeki amaca uygun kullanım olması nedeniyle Hazineye borçlarının ödenmiş olması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Hazineden devir protokolündeki kullanım amacı ve yatırım taahhütleri belirlenmeli, amacına uygun yatırımlarda Yasal ve Mevcut Durum Değeri takdir edilmelidir. Kullanım amacı bölge genelinde protokole uygun ise inşaatlar ve boş arsalar bu madde kapsamında değerlendirilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "26B",
    "status": "Hazineye İade Şerhi - Devir Protokolü Şartları Gerçekleşmemiş",
    "description": "Taşınmazlar, Hazine, Arsa Ofisi ve Toplu Konut İdaresi tarafından amacına uygun kullanım ve satış, altyapı tesis vb. yapma taahhütlerine bağlı olarak satılabilmektedir. Satılan taşınmazların satış amacı dışında kullanılamayacağına, amacı dışında kullanıldığının tespiti halinde, satılan taşınmazın satış bedelinin faizsiz iade edilerek Hazine tarafından geri alınacağına dair tapu kütüğüne şerh konulur. Taahhütlerin yerine getirilmemesi durumunda kayıtsız şartsız Hazine’ye iade riski bulunmaktadır. Şerhin kaldırılması için devir protokolündeki yatırım taahhütlerinin yerine getirilmesi ve ilgili kanunda belirtilen ödemelerin yapılması gerekebilir. 4706 Sayılı Hazineye Ait Taşınmaz Malların Değerlendirilmesi Hakkında Kanuna göre toplu konut amaçlı olarak kullanılmak üzere Belediyelere, Toplu Konut İdaresi Başkanlığına, Konut Yapı Kooperatiflerine, küçük sanayi sitesi yapma amacıyla kurulmuş kooperatiflere, borsa yapılmak üzere ticaret borsalarına, serbest bölge olarak kullanılmak üzere, kamu kurum ve kuruluşları ile kamu kurumu niteliğindeki meslek kuruluşlarına, teknoloji geliştirme bölgelerindeki yönetici şirkete satılabilir. 4706 sayılı Kanun kapsamında edinilen taşınmazlar iktisap ve satış şekline bakılmaksızın satış tarihinden itibaren on tam yıl geçmiş olması, yapı kullanma izin belgesinin alınması ve idareye borcun ve dava durumunun bulunmaması halinde şerh idarece kaldırılabilir. Arsa Ofisi ve Toplu Konut İdaresi sattığı veya devrettiği arsa ve arazinin amacına uygun kullanılması için tapu kayıtlarına, satış şartlarına uygun alt yapı, yapı veya tesis yapılmadıkça üçüncü kişilere satış, devir, temlik yapılamayacağı ve haczedilemeyeceği hususunda şerhler koydurmaya ve/veya bu amaca yönelik sözleşmeler yapmaya yetkilidir. Tanzim satışı yapılan arsalar üzerine plân amacına uygun yapı veya tesis yapılmadıkça üçüncü kişilere satış, devir ve temlik yapılamayacağı ve haczedilemeyeceği konusunda tapu kayıtlarına şerh konur. Şerhin kaldırılması 1164 sayılı Kanunun 11. Maddesine ilişkin Yönetmeliğin 7. Maddesindeki şartların yerine getirilmesi halinde mümkündür.",
    "reportText": "Taşınmaz üzerinde Hazineye İade şerhi bulunmakta olup, devir protokolü temin edilmemiş ve/veya amaca uygunluk tespit edilememiştir. Devir protokolündeki amaca uygun satış, kullanım ve yatırım taahhütlerinin yerine getirilmesi ve Hazineye borçlarının ödenmiş olması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Devir protokolü temin edilemeyen ve/veya amaca uygunluk tespit edilemeyen durumlarda ve boş arsalarda devir protokolündeki amaca uygun satış, kullanım ve yatırım taahhütlerinin yerine getirilmesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "28A",
    "status": "Müşterek Mahal/Ortak Kullanım Yeri Şerhi",
    "description": "Otopark, sosyal tesis, yüzme havuzu, bahçe, aydınlık vb. alanlar için ayrı bağımsız bölüm numarası verilmeden tapu kaydında müşterek mahal/ortak kullanım yeri şerhi bulunması, belirtilen kısımların kullanım haklarının diğer bağımsız bölümlere müştereken ait olduğu ve diğer bağımsız bölümlerin konu taşınmazdan yararlanabileceği anlamına gelmektedir. Rapora konu taşınmazlara için bu kısımların kullanım haklarının olumlu etkisi de dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz lehine Müşterek Mahal/Ortak Kullanım Yeri şerhi bulunmaktadır.",
    "valuationMethod": "Bu risk kodu Bağımsız bölüm yada parsel olmayan, Tapu sicilinde bağımsız bölüm veya parsellerin ortak kullanıma tahsis edilerek beyanlar hanesine işlenmiş otopark, sosyal tesis, yüzme havuzu, bahçe vb. ortak yerler içindir. Bu kısımlara ayrıca değer takdir edilmez, raporu hazırlanan bağımsız bölümün şerefiye değerine katkısı değerlemede dikkate alınır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "28B",
    "status": "Ayrı Tapulu ve Bağımsız Olarak Kullanma, İşletme Hakkı Bulunan Ortak Alanlar (Müşterek Metalar)",
    "description": "Sosyal tesis, yüzme havuzu, otopark vb. alanlar için ayrı tapu verilmesi ve bu kısımların site ortak alanı sayılmadan bağımsız ticari işletme olarak kullanılabilme imkanı bulunması halinde bu bağımsız bölümler veya parseller ayrıca değerlemeye tabi tutulur. Projelerde ve emsal alanı (Taks, Kaks) hesaplamalarında ortak alan olarak planlanmış kısımlar (ayrı tapusu bulunsa dahi) site ortak alanı statüsünde olup mülkiyet ve kullanım hakkı davalarına konu olabilmektedir. Sosyal tesis vb. değerlemelerinde ortak alan olup olmadığı ve bağımsız olarak kullanma/işletme hakkı bulunup bulunmadığı detaylı olarak incelenerek değer takdir edilmelidir.",
    "reportText": "Taşınmazın ortak sosyal alanlarının bağımsız olarak işletme ve kullanma hakkı bulunduğundan bu kısımlara değer takdir edilmiştir.",
    "valuationMethod": "Yönetim planı ruhsat ve projeler incelenerek değerlendirme yapılmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "28C",
    "status": "Ayrı Tapulu, Köyün/Sitenin Ortak Kullanımına Tahsis Edilmiş Bağımsız Bölüm ve Parseller",
    "description": "Ayrı tapusu bulunsa dahi Tapu Sicilinde sitedeki diğer bağımsız bölüm ve parsellerin kullanımına tahsis edilmiş bağımsız bölüm ve parsellere (ticari bir işletmeye kiralanmış olsa dahi) sadece bilgi amaçlı değer takdir edilir. Ortak kullanıma tahsis edilmiş taşınmazların kullanım hakları sitedeki diğer bağımsız bölümlere ve parsellere ait olmakla birlikte siteye katkısı nedeniyle ipotek altına alınması hususunun ayrıca değerlendirilmesi önerilir.",
    "reportText": "Konu taşınmaz ortak kullanıma tahsis edildiğinden Bilgi Amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Yönetim planı ruhsat ve projeler incelenerek değerlendirme yapılmalıdır.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "İrtifak Hakları",
    "code": "29A",
    "status": "Muhdesat Şerhi veya Tespiti - Muhdesat Fiilen Mevcut ve Muhdesat Harici Alan Yapılaşmaya Uygun",
    "description": "Muhdesat, taşınmaz üzerinde sonradan yapılmış/meydana gelmiş 3. kişilere ait varlıkları (baraka, ağaç, bağ vb. gibi) ifade etmekte olup, tapu kütüğünün beyanlar hanesinde gösterilmekte ve hak sahibine kişisel bir hak sağlamaktadır. Kadastro öncesi haklara dayanarak veya İmar Kanunu'nun 18. maddesine göre gerçekleştirilen imar uygulamaları sonucunda oluşabilen muhdesat şerhleri büyüklüğüne ve özelliğine göre taşınmaz malikinin mülkiyet tasarrufunu hukuken önemli ölçüde sınırlandırabilmektedir. Tapu maliki ile muhdesat sahibi aynı kişi olması halinde bu hak Tapu Sicil Müdürlüğünce terkin edilmelidir; terkin işlemi yapılmamış ise müşteriden muhdesatın da teminat verildiğine ilişkin taahhüt alınması uygun olacaktır. Tapu maliki ile muhdesat sahibi aynı kişi değilse muhdesatın ve etkilediği kısmın değeri dikkate alınmadan değer takdir edilir. Tapu maliki ile muhdesat sahibi aynı kişi olması halinde terkin edilmesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilebilir.",
    "reportText": "Taşınmaz üzerinde Muhdesat (3. kişilere ait bina, ağaç vb.) bulunmakta olup muhdesatın ve etkilediği kısmın değeri dikkate alınmamıştır.",
    "valuationMethod": "Üçüncü şahsa ait muhdesatın arsa/araziden yararlanmayı ne ölçüde sınırlandırdığı belirlenerek muhdesatın ve etkilediği kısmın (binanın zemine oturduğu ve ayrıca bahçe, yol vb. amaçla kullandığı alanların) değeri dikkate alınmaksızın Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "29B",
    "status": "Muhdesat Şerhi veya Tespiti - Muhdesat Fiilen Mevcut Değil",
    "description": "Muhdesat, taşınmaz üzerinde sonradan yapılmış/meydana gelmiş 3. kişilere ait varlıkları (baraka, ağaç, bağ vb. gibi) ifade etmekte olup, tapu kütüğünün beyanlar hanesinde gösterilmekte ve hak sahibine kişisel bir hak sağlamaktadır. Fiilen mevcudiyeti kalmamış muhdesat dikkate alınmadan değerleme çalışması yapılır.",
    "reportText": "Taşınmaz üzerinde Muhdesat bulunmakta olup muhdesatın yıkıldığı/mevcudiyetini kaybettiği tespit edilmiştir. Beyanın terkin edilmesi önerilmektedir.",
    "valuationMethod": "Muhdesatın yıkıldığı veya mevcudiyetini kaybettiği tespit edilmiş ise değerlemede dikkate alınmamalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "29C",
    "status": "Muhdesat Şerhi veya Tespiti- Muhdesat Fiilen Mevcut ve Muhdesat Harici Alan Yapılaşmaya Uygun Değil",
    "description": "Muhdesat, taşınmaz üzerinde sonradan yapılmış/meydana gelmiş 3. kişilere ait varlıkları (baraka, ağaç, bağ vb. gibi) ifade etmekte olup, tapu kütüğünün beyanlar hanesinde gösterilmekte ve hak sahibine kişisel bir hak sağlamaktadır. Kadastro öncesi haklara dayanarak veya İmar Kanunu'nun 18. maddesine göre gerçekleştirilen imar uygulamaları sonucunda oluşabilen muhdesat şerhleri büyüklüğüne ve özelliğine göre taşınmaz malikinin mülkiyet tasarrufunu hukuken önemli ölçüde sınırlandırabilmektedir. Muhdesattan geriye kalan alan yapılaşmaya ve kullanıma uygun değilse bu durum taşınmazın satış kabiliyetini önemli ölçüde azaltacaktır. Muhdesattan geriye kalan alan yapılaşmaya uygun olmadığında sadece bilgi amaçlı değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde Muhdesat beyanı bulunmaktadır. Muhdesattan geriye kalan alan yapılaşmaya uygun değildir. Beyanın terkin edilmesi önerilmektedir.",
    "valuationMethod": "Muhdesattan geriye kalan alan yapılaşmaya uygun değilse, muhdesatın ve etkilediği kısmın değeri dikkate alınmadan geriye kalan kısım için Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "29D",
    "status": "Muhdesat Şerhi veya Tespiti- Tapu Maliki ile Muhdesat Sahibi Aynı Kişi",
    "description": "Muhdesat, taşınmaz üzerinde sonradan yapılmış/meydana gelmiş 3. kişilere ait varlıkları (baraka, ağaç, bağ vb. gibi) ifade etmekte olup, tapu kütüğünün beyanlar hanesinde gösterilmekte ve hak sahibine kişisel bir hak sağlamaktadır. Tapu maliki ile muhdesat sahibi aynı kişi olması halinde muhdesat beyanının terkin edilmesi veya teminata dahil olduğuna ilişkin taahhüt alınması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde Muhdesat beyanı bulunmaktadır. Tapu maliki ile muhdesat sahibi aynı kişidir. Muhdesat beyanının terkin edilmesi veya teminata dahil olduğuna ilişkin taahhüt alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Tapu maliki ile muhdesat sahibi aynı kişi olması halinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "İrtifak Hakları",
    "code": "30A",
    "status": "Sükna (Oturma) Hakkı - Süre Bitimine 5 Yıldan Az Kalan",
    "description": "Sükna(oturma) hakkı, bir binadan veya onun bir bölümünden konut olarak yararlanma yetkisi vermektedir. Mülkiyet ve kullanım hakkını kısıtlayan ve değeri etkileyen bir sınırlandırma söz konusudur. Oturma hakkının süreli veya süresiz olduğu belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Sükna(Oturma) Hakkı bulunmaktadır. Süre bitimine 5 yıldan az süre kaldığından değer takdirinde sükna hakkının etkisi dikkate alınmamıştır.",
    "valuationMethod": "Kalan süre 5 yıldan az ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "30B",
    "status": "Sükna (Oturma) Hakkı - Süre Bitimine 5 Yıldan Fazla Kalan",
    "description": "Sükna(oturma) hakkı, bir binadan veya onun bir bölümünden konut olarak yararlanma yetkisi vermektedir. Mülkiyet ve kullanım hakkını kısıtlayan ve değeri etkileyen bir sınırlandırma söz konusudur. Oturma hakkının süreli veya süresiz olduğu belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Sükna(Oturma) Hakkı bulunmaktadır. Süre bitimine 5 yıldan fazla süre kaldığından değer takdirinde sükna hakkının etkisi dikkate alınmadan sükna hakkının kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Süresiz veya kalan süresi 5 yıldan uzun süreli ise Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "31A",
    "status": "Geçit (Mürur) Hakkı",
    "description": "Geçit (Mürur) Hakkı ile taşınmazın bir bölümü üzerinde diğer taşınmaz lehine geçit hakkı tanınması söz konusudur. Geçit hakkı tanınan kısım üzerinde inşaat vb. tasarruf yetkileri kısıtlanmaktadır. Geçit hakkının işgal ettiği alana ve konumuna göre taşınmaza etkisi (ihmal edilebilir ölçüde de olabilir) dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerindeki Geçit (Mürur) Hakkı dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "Geçit hakkının işgal ettiği alana ve konumuna göre taşınmaza etkisi yaratacağı değer düşüşü (ihmal edilebilir ölçüde de olabilir) dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "32A",
    "status": "Mecra Hakkı",
    "description": "Mecra elektrik, gaz, su gibi akıcı şeylerin nakil ve dağıtımı amacına yönelik teknik tesisatı ifade eder. Taşınmaz maliki başka yerden geçirilmesi mümkün olmayan veya çok masraflı olan tesisatın (mecranın) kendi taşınmazından geçirilmesine katlanmak zorundadır. Mecranın işgal ettiği alana ve konumuna göre taşınmaza etkisi (ihmal edilebilir ölçüde de olabilir) dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerindeki Mecra İrtifak Hakkı dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "Mecra irtifakının işgal ettiği alana ve konumuna göre taşınmaza etkisi yaratacağı değer düşüşü (ihmal edilebilir ölçüde de olabilir) dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "33A",
    "status": "Kaynak Hakkı",
    "description": "Kaynak irtifakı hak sahibine kaynaktan çıkan suyun toplanması, belli yere akıtılması, bunlar için gereken mecraların kullanım haklarını kapsamaktadır. Kaynak hakkının işgal ettiği alana, konumuna ve geçeceği güzergaha göre taşınmaza etkisi (ihmal edilebilir ölçüde de olabilir) dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerindeki Kaynak Hakkı bulunmaktadır.",
    "valuationMethod": "Kaynak hakkının işgal ettiği alana ve konumuna göre taşınmaza etkisi yaratacağı değer düşüşü (ihmal edilebilir ölçüde de olabilir) dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "34A",
    "status": "Kat Karşılığı İnşaat Sözleşmesi - Bina Sözleşmeye Uygun Şekilde Tamamlanmış",
    "description": "Kat karşılığı inşaat şerhi, arsa sahibine ve müteahhitte yükümlülükler getirmekte, şerhin yüklü olduğu taşınmazı alan 3. Kişiler de bu yükümlülüklerden etkilenmektedir. Bina sözleşmeye uygun olarak tamamlandıktan ve kat irtifakı kurulduktan sonra kat karşılığı inşaat şerhinin riski azalmakla birlikte binadaki eksikler, kusurları vb. nedenler itilafa konu olmaya devam edebilmektedir.",
    "reportText": "Taşınmaz üzerinde Kat Karşılığı İnşaat Sözleşmesi Şerhi bulunmakta olup, bina inşaatı sözleşmeye uygun şekilde tamamlanmıştır.",
    "valuationMethod": "Kat irtifakının kurulmuş ve binanın sözleşmeye uygun şekilde tamamlanmış olması halinde Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "34B",
    "status": "Kat Karşılığı İnşaat Sözleşmesi - Bina Sözleşmeye Tamamlanmamış ya da Kat İrtifakı Yeniden Tesis Edilmemiş",
    "description": "Kat karşılığı inşaat şerhi, arsa sahibine ve müteahhitte yükümlülükler getirmekte, şerhin yüklü olduğu taşınmazı alan 3. Kişilerde bu yükümlülüklerden etkilenmektedir. Yeni kat irtifakının kurulmadığı veya inşaatın sözleşmeye uygun şekilde tamamlanmadığı hallerde kat karşılığı şerhi yüklü taşınmazlar dava konusu olabilmekte satış kabiliyetlerinde ve piyasa değerlerinde ciddi bir düşüş oluşabilmektedir.",
    "reportText": "Taşınmaz üzerinde Kat Karşılığı İnşaat Sözleşmesi Şerhi bulunmaktadır. Bina henüz sözleşmeye uygun şekilde tamamlanmadığından şerhin kaldırılması veya arsa sahibi tarafından satılıyorsa kat karşılığı iş yapan müteahhitten, müteahhit tarafından satılıyorsa arsa sahibinden/sahiplerinden satışa ilişkin muvafakat alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Yeni kat irtifakının kurulmamış ve bina henüz sözleşmeye uygun şekilde tamamlanmamış ise şerhin kaldırılması veya arsa sahibi tarafından satılıyorsa kat karşılığı iş yapan müteahhitten, müteahhit tarafından satılıyorsa arsa sahibinden/sahiplerinden satışa ilişkin muvafakat alınması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "35A",
    "status": "Mülkiyet Davaları",
    "description": "Miras, tescil, tapu (mülkiyet) hakkı iptali, istihkak, iflas, konkordato gibi mülkiyet üzerinde hak sahipliğinin ya da borçların anlaşmazlık konusu olduğu davalarda, davanın açıldığı mahkemelerce tapu sicil müdürlüğüne bildirilmekte ve tapuya şerh edilmektedir. Türk Medeni Kanunu’nun 1010. maddesinde tapu kaydına şerh düşülen tasarruf yetkisi kısıtlamalarının, taşınmaz üzerinde sonradan kazanılan hakların sahiplerine karşı ileri sürülebileceği hususu düzenlenmiştir. Davalıdır şerhi taşınmazın mülkiyet devrine ve ipotek alınmasına sınırlama getirmemekle birlikte, mülkiyet hakkını sona erdirme ihtimali de söz konusudur. Taşınmazın dava sonucunda verilecek karardan ne şekilde etkileneceği değişiklik gösterebileceğinden ve öngörülemeyeceğinden dava konusuna göre somut olay bazında değerlendirme yapılmalıdır. Tapu Sicilinde şerh bulunmasa da yapılan incelemelerde taşınmazı ilgilendiren davalar bulunduğu tespit edilirse raporda belirtilmeli ve detaylı bilgi temin edilmeye çalışılmalıdır. Bilgi temin edilemeyen durumlarda sadece bilgi amaçlı değer verilebilir.",
    "reportText": "Taşınmaz üzerinde davalıdır şerhi/devam eden dava bulunmaktadır. Mülkiyet haklarını etkileyebileceğinden davanın risklerinin ve hukuki sonuçlarının ayrıca değerlendirilmesi önerilmektedir.",
    "valuationMethod": "Dava konusuna ilişkin bilgiler eksper tarafından temin edilmelidir. Bu risk kodu miras, tescil, tapu (mülkiyet) hakkı iptali, istihkak, iflas, konkordato gibi mülkiyet üzerinde hak sahipliğinin ya da borçların anlaşmazlık konusu olduğu davalar içindir. Davanın içeriği ve kapsamı ( resmi kurum, şube veya müşteriden) araştırılarak somut olay bazında değerlendirilmesi gerekmektedir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "35B",
    "status": "İmar-Kadastro Davaları",
    "description": "Parseller arasındaki sınır çekişmeleri ya da bölge genelindeki imar kadastro düzenlemeleri nedeniyle açılmış davaların içeriğine, taşınmazın değerini ve mülkiyet haklarını etkileme durumuna göre değerlendirme yapılmalıdır. İmar planlarına iptal davası sonucu henüz kesinleşmemiş ise oluşabilecek riskler (plan ve/veya yapı ruhsatı iptali olabileceği, değer değişim riskleri vb.) detaylı olarak açıklanmalıdır. Tapu Sicilinde şerh bulunmasa da yapılan incelemelerde taşınmazı ilgilendiren davalar bulunduğu tespit edilirse raporda belirtilmeli ve detaylı bilgi temin edilmeye çalışılmalıdır.",
    "reportText": "Taşınmazın imar-kadastro davalıdır şerhi/devam eden davası bulunmaktadır. Davanın risklerinin ve hukuki sonuçlarının ayrıca değerlendirilmesi önerilmektedir.",
    "valuationMethod": "Dava konusuna ilişkin bilgiler eksper tarafından temin edilmelidir. Bu risk kodu imar planı ve kadastro davaları ile bunlara bağlı kamulaştırma davaları içindir. Belediyeden sorgulama yapılmalı ve dava belgeleri incelenmeli, mahkeme kararının konu taşınmazı ne şekilde etkileyeceği öğrenilmeli, davanın etkisi dikkate alınarak değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "35C",
    "status": "Yapı Ruhsatı-Proje İptali ve Numarataj Düzeltme Davaları",
    "description": "Resmi kurumlar, hissedar malikler, komşu taşınmaz sahipleri, menfaati ihlal edilen kişiler tarafından yapı ruhsatı ve projelerin iptali ya da yıkım kararı vb. idari kararların durdurulması, numarataj hatalarının düzeltilmesi, kat irtifakının değiştirilmesi, arsa payı düzeltme vb. taleplerle dava açılabilmektedir. Yapı ruhsatı iptali istemiyle açılan davalarda ayrıca yürütmenin durdurulması da talep edilebilir. Taşınmazın dava sonucunda verilecek karardan ne şekilde etkileneceği değişiklik gösterebileceğinden ve öngörülemeyeceğinden dava konusuna göre somut olay bazında değerlendirme yapılmalıdır. Tapu Sicilinde şerh bulunmasa da yapılan incelemelerde taşınmazı ilgilendiren davalar bulunduğu tespit edilirse raporda belirtilmeli ve detaylı bilgi temin edilmeye çalışılmalıdır. Bilgi temin edilemeyen durumlarda sadece mevcut durum değeri verilebilir.",
    "reportText": "Taşınmazın yapı ruhsatı, projeleri davalı durumdadır. Davanın risklerinin ve hukuki sonuçlarının ayrıca değerlendirilmesi önerilmektedir.",
    "valuationMethod": "Dava konusuna ilişkin bilgiler eksper tarafından temin edilmelidir. Bu risk kodu, yapı, ruhsatı, proje iptali, yıkım vb. idari kararların durdurulması, numarataj hatalarının düzeltilmesi, kat irtifakının değiştirilmesi, arsa payı düzeltme vb. içindir. Belediyeden sorgulama yapılmalı, dava belgeleri temin edilmeli, mahkeme kararının konu taşınmazı ne şekilde etkileyeceği incelenmeli, ruhsat iptali varsa davanın kapsamına göre 128AC maddeleri kıyasen uygulanarak değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "36A",
    "status": "İhtiyati Tedbir ve Ferağdan Men Şerhi",
    "description": "İhtiyati tedbir ve ferağdan men kararları, tedbir kaldırılıncaya veya kararının verildiği dava sonuçlanıncaya kadar mülkiyete tasarrufu hukuken ve fiilen imkânsız hale getirmektedir. Kısıtlı hale geldiğinden ihtiyati tedbir şerhi bulunan taşınmazlarda mülkiyete ilişkin tasarruf (satış vb.) yapılamaz.",
    "reportText": "Taşınmaz üzerinde İhtiyati Tedbir/Ferağdan Men Şerhi bulunmakta olup şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmeli, satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "36B",
    "status": "Mülkiyet Devri Şarta Bağlı Taşınmaz",
    "description": "Mülkiyet devri veya ipotek vb. ayni haklar tesis edilmesi bir koşula (bir sözleşme şartlarının yerine getirilmesi, bir kurumdan izin alınması, bir borcun ödenmesi vb.) veya taahhüde (bir bağış yapılması vb.) bağlı taşınmazların durumu işlem özelinde değerlendirilmelidir.",
    "reportText": "Taşınmazın mülkiyet devri ve ayni hak tesisi işlemleri ön şarta bağlanmış olup ön şartın gerçekleştirilmesi ya da ilgili şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Söz konusu ön şart veya taahhüdün yerine getirilmesi ya da şerhin kaldırılması koşuluyla değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "36C",
    "status": "Mülkiyetin Tesciline Yönelik Kesinleşmiş Mahkeme Kararı",
    "description": "Mülkiyetin tesciline yönelik kesinleşmiş mahkeme kararları malik değişikliği olduğunu ifade etmektedir. Bu şerhten sonraki tarihli ipotekler yeni malik için hüküm ifade etmemektedir.",
    "reportText": "Taşınmazın mülkiyetin 3. kişilere tesciline yönelik kesinleşmiş mahkeme kararları bulunmaktadır. Mülkiyet devrinin tamamlanması ya da şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Mülkiyet değişikliğinin nedeni belirtilerek şerhin kaldırılması koşuluyla değer takdir edilmeli, satış kabiliyeti SATILAMAZ seçilmelidir. Mahkeme kararına konu tescil gerçekleşmiş ise Bu risk kodu kullanılmaz; satış kabiliyeti satılabilir işaretlenir ve 74A risk kodu seçilir ve şerhin kaldırılması önerilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "36D",
    "status": "Mülkiyet Devrini Yasaklayan İdari Tedbir",
    "description": "Mahkeme kararı ile mülkiyet devri yasaklanması haricinde, 4749 sayılı Kamu Finansmanı Ve Borç Yönetiminin Düzenlenmesi Hakkında Kanun, 5366 sayılı Yıpranan Tarihi ve Kültürel Taşınmazların Yenilerek Korunması Hakkında Kanun ya da diğer kanunlarla geçici veya sürekli olarak devir yasağı getirilen durumlarda Tapu Sicilinde devir talepleri ve ipotek gibi ayni hak talepleri karşılanmaz.",
    "reportText": "Taşınmazın mülkiyet devri yasaklanmış olup, mülkiyet devrine ve ayni hakların tesisine izin verilmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Yasaklama nedeni belirtilerek mülkiyet devrine ve ayni hakların tesisine izin verilmesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmeli, satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37A",
    "status": "OSB İçinde Taşınmaz - Tesis İnşaatı Tamamlanmış",
    "description": "4562 Sayılı OSB Kanununa göre katılımcılara tahsis veya satışı yapılan arsalar hiçbir şekilde tahsis amacı dışında kullanılamaz, katılımcılar tarafından borcun tamamı ödenmeden ve tesis üretime geçmeden satılamaz, devredilemez ve temlik edilemez. OSB’lerdeki taşınmazların tapu kaydına -Taşınmazın icra yoluyla satışı dâhil üçüncü kişilere devrinde OSB’den uygunluk görüşü alınması zorunludur.- şerhi konulur. Bu durumda eski katılımcının vermiş olduğu taahhütler, yeni alıcı tarafından da aynen kabul edilmiş sayılır. Arsaların tapuları tahsis bedelinin tümüyle ödenmesi veya kalan borç için teminat mektubu verilmesi halinde, tesisi üretime geçenlere geri alım hakkı şerhi konulmadan, tesisi üretime geçmeyenlere ise geri alım hakkı şerhi konularak verilmektedir. Ayrıca sabit yatırım tutarının en az %50’si tutarında yatırım kredisi alan katılımcılara tahsis bedelini defaten ödemeleri veya tahsis bedelinden kalan borcu için teminat mektubunu vermeleri durumunda üretime geçme şartı aranmaksızın geri alım hakkı şerhi konulmadan tapuları verilebilmektedir. Taahhütlere uyulmaması nedeniyle arsa tahsisinin iptali halinde arsa bedeli, OSB tarafından parsel tahsis veya satış işleminin gerçekleştiği tarihteki arsa bedeline 213 sayılı Kanun uyarınca yeniden değerleme oranı eklenmek suretiyle hesaplanır, binalar için ilave bir bedel ödenmez. OSB'nin arsa tahsisini iptal etme ihtimali, inşaatı tamamlanıp üretime geçmemiş taşınmazlar için riskli bir durumdur. Gayrimenkul borçlar ödenip, tesis işletmeye açılmadıkça şerh tapu kayıtlarından kaldırılmamaktadır. Değer takdirinde tesisin üretime geçme durumu, ödenmemiş arsa taksitleri ve diğer borçları dikkate alınmamakta olup müşteri tarafından OSB Müdürlüğünden muaccel hale gelen ve gelmeyen tüm taksit ve borçlara ilişkin yazı alınarak şubeye ibraz edilmelidir. Organize Sanayi Bölgeleri Uygulama Yönetmeliğinin 61 maddesindeki başkalarına devirlerle ilgili hususlara aykırılığın mahkemelerce tespiti halinde ise, arsa kimin tasarrufunda olursa olsun, tahsis tarihindeki bedeliyle OSB tarafından geri alınabilmektedir. OSB kurulmadan önce de arsa sahibi olan kişilerin kullanımına bırakılan taşınmazlar için de OSB mevzuatı geçerli olup OSB Yönetimince izin verilmediği sürece taşınmazların tasarruf/satış hakkı bulunmamaktadır.",
    "reportText": "Taşınmaz OSB sınırları içinde olup tesis tamamlanmış ve üretime geçmiştir. Değer takdirinde tesisin arsa taksitleri ve diğer borçları dikkate alınmamış olup varsa OSB'ne borçlarının ödenmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Tesisin tamamlanmış ve üretime geçmiş olması halinde, arsa ve üzerindeki yapılar için Yasal ve Mevcut Durum Değeri, takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37B",
    "status": "OSB İçinde Taşınmaz - Tesis İnşaatı Tamamlanmamış",
    "description": "4562 Sayılı OSB Kanununa göre katılımcılara tahsis veya satışı yapılan arsalar hiçbir şekilde tahsis amacı dışında kullanılamaz, katılımcılar tarafından borcun tamamı ödenmeden ve tesis üretime geçmeden satılamaz, devredilemez ve temlik edilemez. OSB’lerdeki taşınmazların tapu kaydına -Taşınmazın icra yoluyla satışı dâhil üçüncü kişilere devrinde OSB’den uygunluk görüşü alınması zorunludur.- şerhi konulur. Bu durumda eski katılımcının vermiş olduğu taahhütler, yeni alıcı tarafından da aynen kabul edilmiş sayılır. Arsaların tapuları tahsis bedelinin tümüyle ödenmesi veya kalan borç için teminat mektubu verilmesi halinde, tesisi üretime geçenlere geri alım hakkı şerhi konulmadan, tesisi üretime geçmeyenlere ise geri alım hakkı şerhi konularak verilmektedir. Ayrıca sabit yatırım tutarının en az %50’si tutarında yatırım kredisi alan katılımcılara tahsis bedelini defaten ödemeleri veya tahsis bedelinden kalan borcu için teminat mektubunu vermeleri durumunda üretime geçme şartı aranmaksızın geri alım hakkı şerhi konulmadan tapuları verilebilmektedir. Taahhütlere uyulmaması nedeniyle arsa tahsisinin iptali halinde arsa bedeli, OSB tarafından parsel tahsis veya satış işleminin gerçekleştiği tarihteki arsa bedeline 213 sayılı Kanun uyarınca yeniden değerleme oranı eklenmek suretiyle hesaplanır, binalar için ilave bir bedel ödenmez. OSB'nin arsa tahsisini iptal etme ihtimali, inşaatı tamamlanıp üretime geçmemiş taşınmazlar için riskli bir durumdur. Gayrimenkul borçlar ödenip, tesis işletmeye açılmadıkça şerh tapu kayıtlarından kaldırılmamaktadır. Değer takdirinde tesisin üretime geçme durumu, ödenmemiş arsa taksitleri ve diğer borçları dikkate alınmamakta olup müşteri tarafından OSB Müdürlüğünden muaccel hale gelen ve gelmeyen tüm taksit ve borçlara ilişkin yazı alınarak şubeye ibraz edilmelidir. Organize Sanayi Bölgeleri Uygulama Yönetmeliğinin 61 maddesindeki başkalarına devirlerle ilgili hususlara aykırılığın mahkemelerce tespiti halinde ise, arsa kimin tasarrufunda olursa olsun, tahsis tarihindeki bedeliyle OSB tarafından geri alınabilmektedir. OSB kurulmadan önce de arsa sahibi olan kişilerin kullanımına bırakılan taşınmazlar için de OSB mevzuatı geçerli olup OSB Yönetimince izin verilmediği sürece taşınmazların tasarruf/satış hakkı bulunmamaktadır.",
    "reportText": "Taşınmaz OSB sınırları içinde olup tesisin inşaatının tamamlanması, üretime geçmesi ve varsa OSB'ne borçlarının ödenmesi koşuluyla mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Tesis tamamlanmamış ve üretime geçmemiş ise inşaatının tamamlanması ve üretime geçmesi koşuluyla aşağıdaki şekilde değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37G",
    "status": "OSB Tarafından Teminat Verilecek Taşınmaz - 3. Kişilere Tahsis Edilmemiş",
    "description": "3. Kişilere tahsis edilmemiş ve OSB'nin idari binası, alt yapı tesisi vb. olarak kullanılmayan ticari değeri bulunan taşınmazlar OSB tüzel kişiliğinin teminatı olarak alınabilir. Bununla birlikte taşınmazların teminatta kaldığı süre içinde 3. kişilere tahsis edilmesi halinde mülkiyet/kullanım hakları olumsuz etkileneceğinden teminat değişikliğine gidilmesi hususu ayrıca değerlendirilmelidir. OSB sınırları içinde (üçüncü kişilere icra yoluyla satışlar dahil) mülkiyet devir işlemleri OSB’nin onayına bağlıdır. OSB mülkiyetindeki taşınmazlar ticari satış kabiliyetine bağlı olarak teminat alınmalıdır.",
    "reportText": "Taşınmaz OSB mülkiyetindedir. Taşınmazın 3. kişilere tahsis edilmemiş olması, kamu yararına (altyapı tesisi, OSB idari binası vb. amaçlarla) kullanılmaması ve OSB'nin satışına izin vermesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "OSB teminatına konu olacak taşınmazların 3. kişilere tahsis edilmemiş olması, altyapı tesisi, OSB idari binası vb. amaçlarla kullanılmaması ve OSB'nin satışına izin vermesi koşuluyla Yasal ve Mevcut Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37H",
    "status": "OSB Tarafından Teminat Verilecek Taşınmaz - 3. Kişilere Tahsis Edilmiş",
    "description": "Mülkiyeti OSB'de olmakla birlikte (Tapu Siciline işlenmeyen tahsisler dahil) üçüncü kişilere tahsis edilen ya da arsa üzerinde üçüncü kişilere ait binalar bulunan taşınmazların OSB'lerin teminatı olarak alınmaları halinde 3. kişilere yapılan tahsisler nedeniyle mülkiyet sorunları yaşanacağından teminat kaliteleri düşüktür. Bu durumdaki taşınmazlara binalar hariç sadece arsa için BİLGİ AMAÇLI DEĞERİ belirlenir.",
    "reportText": "Taşınmaz üçüncü kişilere tahsis edilmiş olup devir süreci sonuçlandığında 3. kişilerin mülkiyetine geçecektir.",
    "valuationMethod": "Mülkiyeti OSB'de olmakla birlikte üçüncü kişilere tahsis edilen ya da üzerinde üçüncü kişilere ait inşaatlar veya yapılar bulunan taşınmazların tahsisler nedeniyle oluşabilecek mülkiyet sorunları değerlemede dikkate alınmalı, binalar hariç sadece arsa için Bilgi Amaçlı Değeri belirlenmelidir.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37I",
    "status": "OSB Tarafından Teminat Verilecek Taşınmaz - OSB'nin İdari Binası veya Alt Yapı Tesisi vb. Olarak Kullanılan",
    "description": "OSB mülkiyetinde olup arıtma tesisleri, trafo merkezleri, OSB idari binaları vb. amaçlarla kullanılan taşınmazların 3. kişilere satışı söz konusu olamayacağından teminat kaliteleri düşüktür. OSB mülkiyetindeki taşınmazlar ticari satış kabiliyetine bağlı olarak teminat alınması tavsiye edilir.",
    "reportText": "Taşınmaz OSB mülkiyetinde olup OSB idaresinin kullanımına tahsis edilmiştir.",
    "valuationMethod": "OSB mülkiyetinde olup OSB'nin kendi kullanımına tahsis edilen taşınmazlara sadece Bilgi Amaçlı Değeri belirlenmelidir.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "37J",
    "status": "OSB Mülkiyetindeki 3. Kişilere Satılacak Taşınmaz",
    "description": "Yatırımcılara satılacak (OSB tüzel kişiliğinin teminatı olmayan) sanayi arsaları, fabrikalar, dükkanlar, kafeterya, banka şubesi vb. taşınmazların kamu yararına kullanılmadığı/kullanılmayacağı, mülkiyet devrine bağlı borçları olup olmadığı incelenerek değerlendirilmelidir.",
    "reportText": "Taşınmaz OSB mülkiyetinde olup 3. kişilere satılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "OSB mülkiyetinde olan taşınmazların 3. kişilere tahsis edilmemiş olması, üzerinde 3. kişilere ait yapıların bulunmaması, altyapı tesisi, OSB idari binası vb. amaçlarla kullanılmaması, kamulaştırma kaynaklı borçlarının ödenmesi ve satışına engel bulunmaması koşuluyla değer takdir edilir. 3. kişilere tahsis edilmiş veya üzerinde 3. kişilere ait yapılar bulunan taşınmazlar için bu risk kodu kullanılmaz; 37H risk kodu kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "38A",
    "status": "Süreli Devir, Rehin Yasağı - Kısıtlılık Süresi Biten veya Şerh Tarihinden Sonra Satış Gören",
    "description": "2510 Sayılı İskân Kanunu, 5543 Sayılı İskân Kanunu ve 775 Sayılı Gecekondu Kanunu (34. Madde) vb. uyarınca edinilen taşınmazlara süre ile sınırlı devir yasağı şartı getirilmekte ve Tapu siciline bu husus şerh edilebilmektedir. İlgili Kanunlarla belirlenen devir yasağı (genellikle 10 yıl) süresi biten veya bu süre içinde ilgili kurum onayı ile satış görmüş taşınmazlar için malikin mülkiyeti tasarruf (devir, temlik, rehin ve diğer ayni haklarla takyit, satış vaadinde bulunma, taksim veya satış suretiyle ortaklığı giderme) kısıtlaması bulunmamaktadır.",
    "reportText": "Taşınmaz üzerinde Devir Yasağı bulunmaktadır. 10 yıllık kısıtlılık süresinin bitmiş/şerh tarihinden sonra satış görmüş olması nedeniyle değer takdir edilmiştir.",
    "valuationMethod": "10 yıllık kısıtlılık süresi bitmiş veya şerh tarihinden sonra satış yapılmış ise Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "38B",
    "status": "Süreli Devir, Rehin Yasağı - Kısıtlılık Süresi Dolmamış",
    "description": "2510 Sayılı İskân Kanunu, 5543 Sayılı İskân Kanunu ve 775 Sayılı Gecekondu Kanunu (34. Madde) vb. uyarınca edinilen taşınmazlara süre ile sınırlı devir yasağı şartı getirilmekte ve Tapu siciline bu husus şerh edilebilmektedir. Kanun'la belirlenen devir yasağı (genellikle 10 yıl) süresince konut kredisi veren kuruluşların ipotekli alacaklarından dolayı yapılacak satış ve işlemler hariç, malikin mülkiyete tasarruf (devir, temlik, rehin ve diğer ayni haklarla takyit, satış vaadinde bulunma, taksim veya satış suretiyle ortaklığı giderme) yetkisi yoktur.",
    "reportText": "Taşınmaz üzerinde Devir Yasağı bulunmaktadır. 10 yıllık kısıtlılık süresinin dolmamış olması nedeniyle şerhin kaldırılması veya devir yasağı süresinin bitmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin geçerli olduğu süre boyunca taşınmaz tasarruf edilemediğinden devir yasağının kalan süresi belirlenmelidir. Şerhin kaldırılması veya devir yasağı süresinin bitmesi koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "40A",
    "status": "3367 Sayılı Köy Kanuna Göre Kısıtlılık - Bina Yapılmış ve 10 Yıllık Kısıtlılık Süresi bitmiş",
    "description": "3367 sayılı Köy Kanunu uyarınca ihtiyaç sahiplerine satılan parseller üzerine satış tarihinden itibaren en geç 5 yıl içinde bina yapılması zorunludur. Hak sahipleri bu yerleri 10 yıl müddetle başkalarına devir ve temlik edemezler.",
    "reportText": "Taşınmaz üzerinde 3367 sayılı Köy Kanunu uyarınca Devir ve Temlik Yasağı şerhi bulunmaktadır. Bina yapılmış ve 10 yıllık kısıtlılık süresi bitmiştir.",
    "valuationMethod": "Tapu devir tarihi ve şerhin tesis tarihi belirlenmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "40B",
    "status": "3367 Sayılı Köy Kanuna Göre Kısıtlılık - Bina Yapılmış, 10 Yıllık Kısıtlılık Süresi Bitmemiş",
    "description": "3367 sayılı Köy Kanunu uyarınca ihtiyaç sahiplerine satılan parseller üzerine satış tarihinden itibaren en geç 5 yıl içinde bina yapılması zorunludur. Hak sahipleri bu yerleri 10 yıl müddetle başkalarına devir ve temlik edemezler.",
    "reportText": "Taşınmaz üzerinde 3367 sayılı Köy Kanunu uyarınca Devir ve Temlik Yasağı şerhi bulunmaktadır. 10 yıllık kısıtlılık süresinin bitmemiş olması nedeniyle devir yasağı süresinin dolması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Tapu devir tarihi ve şerhin tesis tarihi belirlenmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "40C",
    "status": "3367 Sayılı Köy Kanuna Göre Kısıtlılık - Bina Yapılmamış",
    "description": "3367 sayılı Köy Kanunu uyarınca ihtiyaç sahiplerine satılan parseller üzerine satış tarihinden itibaren en geç 5 yıl içinde bina yapılması zorunludur. Hak sahipleri bu yerleri 10 yıl müddetle başkalarına devir ve temlik edemezler. Büyükşehir statüsünde köyler mahalle haline gelip tüzel kişilikleri kalktığından, bu konudaki tasarruflar ilçe belediyelerine ait olacaktır. Şerhin geri alım da dahil olmak üzere doğurabileceği menfi sonuçlar itibariyle risk unsuru taşıdığı değerlendirilmektedir. Kanunda 5 yıl içinde yapı yapılmadığı takdirde; köy muhtarlığınca (büyükşehir ise Büyük Şehir Belediyelerince) alınacak yargı kararı ile tapu iptal edilerek köy tüzel kişiliği adına tescil ettirilir hükmü bulunmakta olup daha sonra yapılan düzenlemeler ile verilen süre 31.12.2024 tarihine kadar uzatılmıştır.",
    "reportText": "Taşınmaz üzerinde 3367 sayılı Köy Kanunu uyarınca Devir ve Temlik Yasağı şerhi bulunmakta olup yasada öngörülen süreler içinde bina yapılması ve 10 yıllık kısıtlılık süresinin dolması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Bina yapılmamış ise 10 yıllık kısıtlılık süresinin bitmiş olup olmamasına bakılmaksızın,",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "41A",
    "status": "Hazineye Ait Tarım Arazilerinin Satışı Beyanı",
    "description": "4070 sayılı Kanunun 5,6,7 maddeleri uyarınca Hazinece satışı yapılan tarım arazileri on yıl süre ile tarım dışı amaçlarla kullanılamaz, bu husus tapu kütüğünün beyanlar hanesine yazılır. Bu süre sonunda tarım dışı amaçla kullanım Tarım ve Köy işleri Bakanlığından alınacak izne tâbidir.",
    "reportText": "Taşınmaz üzerinde 4070 sayılı Kanun uyarınca Hazineye Ait Tarım Arazilerinin Satışı beyanı bulunmaktadır.",
    "valuationMethod": "Tapu devir tarihi ve şerhin tesis tarihi belirlenerek Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "42C",
    "status": "Türk Vatandaşlığı Verilmesi Nedeniyle 3 yıl Satılamaz Beyanı",
    "description": "5901 Sayılı Kanun ve ilgili yönetmelik hükümlerine göre 13.06.2022 tarihinden itibaren en az 400.000 Amerikan Doları (13.06.2022 öncesinde 250.000 USD) veya karşılığı döviz ya da karşılığı Türk Lirası tutarında taşınmazı tapu kayıtlarına üç yıl satılmaması beyanı koyulmak şartıyla satın aldığı tespit edilen kişilere Türk Vatandaşlığı verilebilmektedir. 3 yıllık kısıtlılık süresinin sonuna kadar satış engeli bulunmaktadır.",
    "reportText": "Taşınmaz üzerinde malikine Türk Vatandaşlığı verilmesini nedeniyle 3 Yıl Satılmaması beyanı bulunmaktadır. Değer takdirinde satılmama şerhinin etkisi dikkate alınmamıştır.",
    "valuationMethod": "Devir yasağının kalan süresi belirlenmeli, şerhin kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "42D",
    "status": "Afet Yardımı Olarak Edinilen Taşınmaz",
    "description": "7269 sayılı Umumi Hayata Müessir Afetler Dolayısıyla Alınacak Tedbirlerle Yapılacak Yardımlara Dair Kanun kapsamında edinilen konutlar en az 20 ve en çok 30 yıl; dükkan ve fırın gibi taşınmazla ise en az 5 ve on çok 15 yıl borçlandırılarak devredilir. Bu taşınmazlar üzerinde ayrıca kanuni ipotek tesis edilebilir.",
    "reportText": "Taşınmaz Afet Yardımı olarak edinilmiştir. Borçların tamamının ödenmesi, kanuni ipoteklerin kaldırılması ve satışına engel durumu kalmaması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Borçların tamamının ödenmesi, kanuni ipoteklerin kaldırılması ve satışına engel durumu kalmaması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "43A",
    "status": "Yabancı Uyruklulara Satış Yasağı",
    "description": "Mevzuata göre askeri güvenlik bölgelerindeki taşınmazların yabancılara satışına ve sınırlı ayni hak edinimlerine yasaklar getirilebilmektedir. Ayrıca ilçenin yüzölçümünün %10’unundan fazlasının yabancı uyrukluların mülkiyetine geçmesi yasaklanmış olup, bu kotanın doldurulması halinde askeri bölge içinde olmasa dahi yabancıların mülk edinimleri durdurulmaktadır. Yabancılara satış yasağının genellikle fiilen taşınmazın piyasa değerini azaltıcı etkisi olmamakla birlikte, bölge özelinde satış kabiliyetini fiilen önemli ölçüde azaltan somut durumlar dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde Yabancı Uyruklulara Satış Yasağı/Sınırlaması şerhi bulunmaktadır.",
    "valuationMethod": "Yasal ve Mevcut Durum Değeri takdir edilir. Satış kabiliyetini fiilen önemli ölçüde azaltan somut bir durum varsa, bu durum dikkate alınarak değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "43B",
    "status": "Tasfiyeye Tabi Olduğu Belirtmesi",
    "description": "Yabancı uyrukluların taşınmaz ediniminin yasak olduğu bölgelerde miras yoluyla edinilen taşınmazlar; yabancıların proje geliştirme taahhüdü ile edindiği ancak 2 yıl içinde proje geliştirilmeyen taşınmazlar ve vatandaşlıkları iptal edilen ve iptal kararında mallarının tasfiyesi hükmü bulunan maliklerin taşınmazları, Tapu Kanununun 35. maddesine ve diğer ilgili mevzuata göre tasfiye edilir.",
    "reportText": "Taşınmaz üzerinde (Tasfiyeye Tabi Olduğuna) ilişkin beyan bulunmaktadır. Beyanın kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Tasfiyeye tabi olduğu beyanı bulunman taşınmazlarda beyanın kaldırılması ya da tapu devrinin yapılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "43C",
    "status": "Yabancıların Yapısız Taşınmaz Edinimlerinde İnşaat Yapma Zorunluluğu - Bina İnşa Edilmiş",
    "description": "2644 sayılı Tapu Kanunun 35. maddesi yabancıların taşınmaz edinimini düzenlemektedir. Yabancı gerçek ve tüzel kişiler satın aldıkları yapısız taşınmazda geliştireceği projeyi iki yıl içinde ilgili Bakanlığın onayına sunmak zorundadır. İlgili Bakanlıkça başlama ve bitirilme süresi belirlenerek onaylanan proje tapu kütüğünün beyanlar hanesine kaydedilmek üzere Tapu Müdürlüğüne gönderilir. Bu madde hükümlerine aykırı olarak edinilen, edinim amacına aykırı kullanıldığı ilgili Bakanlık ve idarelerce tespit edilen, süresi içinde ilgili Bakanlığa başvurulmayan veya süresi içinde projeleri gerçekleştirilmeyen taşınmazlar ve sınırlı ayni haklar, Maliye Bakanlığınca verilecek bir yılı geçmeyen süre içinde maliki tarafından tasfiye edilmediği takdirde tasfiye edilerek bedele çevrilir ve bedeli hak sahibine ödenir.",
    "reportText": "Taşınmaz üzerinde yabancıların yapısız taşınmaz edinimlerinde bakanlığa proje sunulduğuna dair beyan bulunmakta olup proje gerçekleştirilmiştir.",
    "valuationMethod": "Yabancıların yapısız taşınmaz edinimlerinde bakanlığa proje sunulduğuna dair beyan bulunmakta ise öncelikle proje hakkında bilgi alınmalı, Bakanlıkça verilen başlama ve bitirilme süresi öğrenilmeli, projenin (inşaatın) gerçekleşme oranı belirlenmeli ve raporda açıklanarak değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "43D",
    "status": "Yabancıların Yapısız Taşınmaz Edinimlerinde İnşaat Yapma Zorunluluğu - Bina İnşa Edilmemiş, Tamamlanmamış",
    "description": "2644 sayılı Tapu Kanunun 35. maddesi yabancıların taşınmaz edinimini düzenlemektedir. Yabancı gerçek ve tüzel kişiler satın aldıkları yapısız taşınmazda geliştireceği projeyi iki yıl içinde ilgili Bakanlığın onayına sunmak zorundadır. İlgili Bakanlıkça başlama ve bitirilme süresi belirlenerek onaylanan proje tapu kütüğünün beyanlar hanesine kaydedilmek üzere Tapu Müdürlüğüne gönderilir. Bu madde hükümlerine aykırı olarak edinilen, edinim amacına aykırı kullanıldığı ilgili Bakanlık ve idarelerce tespit edilen, süresi içinde ilgili Bakanlığa başvurulmayan veya süresi içinde projeleri gerçekleştirilmeyen taşınmazlar ve sınırlı ayni haklar, Maliye Bakanlığınca verilecek bir yılı geçmeyen süre içinde maliki tarafından tasfiye edilmediği takdirde tasfiye edilerek bedele çevrilir ve bedeli hak sahibine ödenir. Projenin tamamlanmaması halinde mülkiyetin tasfiyesi riski bulunduğundan sadece Mevcut Durum Değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde yabancıların yapısız taşınmaz edinimlerinde bakanlığa proje sunulduğuna dair beyan bulunmakta olup proje henüz tamamlanmamıştır. Beyanın kaldırılması veya projenin tapu devrinden itibaren 2 yıl içinde bitirilmesi koşuluyla Mevcut Durum Değeri takdir edilmiştir.",
    "valuationMethod": "Proje tamamlanmamış ise projeye ait temel bilgiler ve tamamlanması gereken tarih (tapu devrinden sonra 2 yıl) raporda açıklanarak şerhin kaldırılması veya projenin tapu devrinden itibaren 2 yıl içinde bitirilmesi koşuluyla varsa bina inşaatları dahil Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44A",
    "status": "I. Derece Arkeolojik Sit Bölgesi - Kullanım İmkanı Olan",
    "description": "Arkeolojik Sit Alanı şerhleri özellikle yapılaşma haklarına sınırlamalar getirdiğinden taşınmazın değerini olumsuz yönde etkileyebilmektedir. I. Derece Arkeolojik Sit Bölgesi'nde bulunan taşınmazlar için, hiçbir yapılaşmaya izin verilmez, yalnızca sınırlı mevsimlik tarımsal faaliyetler devam edebilir, koruma kurullarınca uygun görülmesi halinde seracılığa devam edilebilir. Sit alanlarındaki taşınmazlara kullanım imkanına ve ticari değerine göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde 1. Derece Arkeolojik Sit Bölgesi Şerhi bulunmaktadır. Sadece sınırlı mevsimlik tarımsal faaliyetlere izin verildiği dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "Tarım, konut veya ticaret gibi bir amaçla kullanma izini bulunan ve kullanılmakta olan taşınmazlar için mevcut kullanım özellikleri dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir. Örneğin, Tarımsal faaliyet izni varsa tarla değeri verilmelidir. Tarihi yapının konut yada ticari olarak kullanılmasına Anıtlar Kurulu tarafından izin verilmiş ise kullanım amacına göre değer verilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44B",
    "status": "I. Derece Arkeolojik Sit Bölgesi - Kullanım İmkanı Olmayan",
    "description": "Arkeolojik Sit Alanı şerhleri özellikle yapılaşma haklarına sınırlamalar getirdiğinden taşınmazın değerini olumsuz yönde etkileyebilmektedir. I. Derece Arkeolojik Sit Bölgesi'nde bulunan taşınmazlar için, hiçbir yapılaşmaya izin verilmez, yalnızca sınırlı mevsimlik tarımsal faaliyetler devam edebilir, koruma kurullarınca uygun görülmesi halinde seracılığa devam edilebilir. Sit alanlarındaki taşınmazlara kullanım imkanına ve ticari değerine göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde 1. Derece Arkeolojik Sit Bölgesi Şerhi bulunmaktadır. Tarım, konut ve ticaret gibi herhangi bir amaçla kullanılma olanağı bulunmaması nedeniyle bilgi amaçlı değeri takdir edilmiştir.",
    "valuationMethod": "Kullanım kısıtlamaları nedeniyle herhangi bir amaçla kullanılma olanağı bulunmayan taşınmazlar için sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44C",
    "status": "II. Derece Arkeolojik Sit Bölgesi",
    "description": "II. Derece Arkeolojik Sit Bölgesi'nde bulunan taşınmazlar için, yeni yapılaşmaya izin verilmez, taşınmaz üzerindeki kullanılmakta olan tescilsiz yapıların basit onarımına ilke kararları doğrultusunda izin verilebilir. II. Derece Sit Alanları önemli bir tarihi bulguya rastlanırsa I. Derece statüsüne dönüşebilir. Sit alanlarındaki taşınmazlara kullanım imkanına ve ticari değerine göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde 2. Derece Arkeolojik Sit Bölgesi Şerhi bulunmaktadır. II. ve III. derece sit bölgelerinde kazı çalışmaları sırasında önemli bir tarihi bulguya rastlanırsa I. Derece statüsüne dönüşebilir.",
    "valuationMethod": "2. Derece Arkeolojik Sit Bölgelerinde bulunan taşınmazlar için kullanım özellikleri ve yapılaşma koşulları dikkate alınarak Yasal ve Mevcut Durum Değeri belirlenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44D",
    "status": "III. Derece Arkeolojik Sit Bölgesi",
    "description": "III. Derece Arkeolojik Sit Bölgesi'nde bulunan taşınmazlar için; arkeolojik değerler korunmak koşuluyla yapılaşma mümkündür. Ancak bu taşınmazların temel kazısı sırasında önemli bir tarihi bulguya rastlanırsa I. Derece statüsüne dönüşebilir. Sit alanlarındaki taşınmazlara kullanım imkanına ve ticari değerine göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde 3. Derece Arkeolojik Sit Bölgesi Şerhi bulunmaktadır. II. ve III. derece sit bölgelerinde kazı çalışmaları sırasında önemli bir tarihi bulguya rastlanırsa I. Derece statüsüne dönüşebilir.",
    "valuationMethod": "3. Derece Arkeolojik Sit Bölgelerinde bulunan taşınmazlar için kullanım özellikleri ve yapılaşma koşulları dikkate alınarak Yasal ve Mevcut Durum Değeri belirlenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44E",
    "status": "Kentsel Arkeolojik Sit Bölgesi",
    "description": "Kentsel Arkeolojik Sit ve Tarihi Sit Bölgelerinde bulunan taşınmazlar için Koruma Kurulu kararıyla uygun görülen yapılaşma ve yenileme koşullarına göre işlem yapılır. Sit alanlarında yapılaşma kısıtlamaları bulunduğundan taşınmazlara kullanım imkanına ve ticari değerine göre değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde Kentsel Arkeolojik/Tarihi Sit Bölgesi Şerhi bulunmakta olup imar planlarına göre yapılaşma şartları dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "Kentsel Arkeolojik/Tarihi Sit Bölgesi'nde bulunan taşınmazlar için kullanım özellikleri ve yapılaşma koşulları dikkate alınarak Yasal ve Mevcut Durum Değeri belirlenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "44F",
    "status": "2863 Sayılı Kanunun 15/A Maddesi (Kamulaştırma) Şerhi",
    "description": "Gerçek ve tüzel kişilerle mülkiyetine geçmiş korunması gerekli taşınmaz kültür ve tabiat varlıkları ile korunma alanları Kültür ve Turizm Bakanlığınca hazırlanacak programlara uygun olarak kamulaştırılır. 2863 Sayılı Kültür Ve Tabiat Varlıklarını Koruma Kanununun 15/A Maddesi (Kamulaştırma) Şerhi parselin kamulaştırılacağını belirtir.",
    "reportText": "Taşınmaz, 2863 sayılı Kanunun 15/A maddesi uyarınca kamulaştırılacak olup sadece bilgi amaçlı değeri takdir edilmiştir.",
    "valuationMethod": "Korunması Gerekli Kültür Varlığı olup üzerinde 2863 sayılı kanunun 15/A maddesine istinaden Kamulaştırma Şerhi olan taşınmazlar için Bilgi Amaçlı Değeri verilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44G",
    "status": "Tarihi Eser- Kullanım İmkanı Olan I. Grup Korunması Gerekli Kültür Varlığı",
    "description": "Kullanım imkanı olan, I. Grup Korunması Gerekli Kültür Varlığı orijinal tarihi eser yapının, ticari değeri, kullanım izinleri ve fonksiyonu incelenerek ve bina yasal kabul edilerek değer takdir edilir. Tarihi esere sonradan ilave edilen kısımları yasal değere ilave edilmez.",
    "reportText": "Taşınmaz üzerinde 1. Grup Korunması Gerekli Kültür Varlığı Şerhi bulunmakta olup taşınmazın ticari değeri ve kullanım imkanları dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "I. grup korunması gerekli kültür varlığı statüsündeki taşınmazlar için (2863 sayılı Kanunun 15/A maddesi uyarınca kamulaştırma şerhi olanlar hariç)",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44H",
    "status": "Tarihi Eser- Kullanım İmkanı Olmayan I. Grup Korunması Gerekli Kültür Varlığı",
    "description": "Kullanım imkanı olmayan, kullanılmasına Anıtlar Kurulu tarafından izin verilmeyen I. Grup Korunması Gerekli Kültür Varlığı orijinal tarihi eser yapılara Bilgi Amaçlı Değeri Takdir edilir.",
    "reportText": "Taşınmaz üzerinde 1. Grup Korunması Gerekli Kültür Varlığı Şerhi bulunmakta olup taşınmazın kullanım kısıtlamaları nedeniyle Bilgi Amaçlı Değeri takdir edilmiştir.",
    "valuationMethod": "I. grup korunması gerekli kültür varlığı statüsündeki kullanım kısıtlamaları nedeniyle konut, tarım ve ticaret gibi herhangi bir amaçla kullanılma olanağı bulunmayan taşınmazlar için Bilgi Amaçlı Değeri verilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44I",
    "status": "II. Grup Korunması Gerekli Kültür Varlığı",
    "description": "Orijinal tarihi eser yapı ise bina yasal kabul edilerek, bina yıkılarak yenilenmiş ise yapı ruhsatı ve izinlerine göre değer takdir edilmelidir. III Grup Korunması Gerekli Kültür Varlığı ifadesi yeni mevzuattan çıkarılmış olup eski tarihli şerhlerle karşılaşılan durumlarda bu risk kodu kullanılmalıdır. Tescilli bina yıkılmış ve üzerine yeni bina yapılmışsa yasal kabul edilmesi için yapı ruhsatı alınmış olmalıdır. Tarihi eser tescilli yapılarda sonradan ruhsatsız eklenen kısımlara sadece Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde 2. Grup Korunması Gerekli Kültür Varlığı Şerhi bulunmakta olup taşınmazın ticari değeri ve kullanım imkanları dikkate alınarak değer takdir edilmiştir.",
    "valuationMethod": "II. ve III. grup korunması gerekli kültür varlığı statüsündeki taşınmazlar için (2863 sayılı Kanunun 15/A maddesi uyarınca kamulaştırma şerhi olanlar hariç)",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44K",
    "status": "Doğal Sit Alanı - Kesin Korunacak Hassas Alan",
    "description": "Doğal sit, 2863 sayılı Kanunun 3.Maddesinin a bendine göre; Jeolojik devirlere ait olup, ender bulunmaları nedeniyle olağanüstü özelliklere sahip yer üstünde, yeraltında veya su altında bulunan korunması gerekli alanlardır. Yönetmelikle doğal sitler 3 kategoriye ayrılmıştır. 1) Kesin Korunacak Hassas Alanlar: Yapı yasağı bulunmaktadır ve bilimsel çalışmalar hariç tüm kullanımlar sınırlıdır. Bu alanlardaki taşınmazlar yönetmelik doğrultusunda programa alınarak takas işlemleri yapılabilecektir. 2) Nitelikli Doğal Koruma Alanları: Koruma amaçlarına uygun olarak yörede yaşayanların alanın mevcut kaynaklarını kullanmasını sağlayarak doğal hayata dayalı geleneksel yaşam şekillerinin korunacağı alanlardır. 3) Sürdürülebilir Koruma ve Kontrollü Kullanım Alanları: Kesin korunacak hassas alanları veya nitelikli doğal koruma alanlarını etkileyen, bölgelerdir. Korumaya katkı sağlayacak, doğal ve kültürel bakımdan uyumlu düşük yoğunlukta faaliyetler, turizm ve yerleşimlere izin veren alanlardır. Doğal Sit Alanı şerhleri tasarruf ve özellikle yapılaşma haklarına sınırlamalar getirdiğinden taşınmazın değerini olumsuz yönde etkileyebilecektir. Öncelikle doğal sit 'in kategorisi tespit edilmeli, (Bakanlar Kurulu kararı ile ilan edilmektedir.) henüz kategorisi belirlenmemiş alanlar için ilgili kurumlardan bilgi alınarak ve raporda bu durum açıklanarak çevredeki piyasa koşullarına göre değer takdir edilmelidir. Kesin korunacak hassas alan kategorisindeki bölgeler için sadece bilgi amaçlı değer takdir edilmelidir.",
    "reportText": "Taşınmaz Doğal Sit Alanında, Kesin Korunacak Hassas Alanlar kategorisindedir. Tarım, konut ve ticaret gibi herhangi bir amaçla kullanılma izni bulunmaması nedeniyle bilgi amaçlı değeri takdir edilmiştir.",
    "valuationMethod": "Doğal Sit Alanında, Kesin Korunacak Hassas Alanlar kategorisinde ise Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44L",
    "status": "Doğal Sit Alanı - Nitelikli Doğal Koruma, Sürdürülebilir Koruma ve Kontrollü Kullanım, Kategorisi Belirlenmemiş Alanları",
    "description": "Doğal sit, 2863 sayılı Kanunun 3.Maddesinin a bendine göre; Jeolojik devirlere ait olup, ender bulunmaları nedeniyle olağanüstü özelliklere sahip yer üstünde, yeraltında veya su altında bulunan korunması gerekli alanlardır. Yönetmelikle doğal sitler 3 kategoriye ayrılmıştır. 1) Kesin Korunacak Hassas Alanlar: Yapı yasağı bulunmaktadır ve bilimsel çalışmalar hariç tüm kullanımlar sınırlıdır. Bu alanlardaki taşınmazlar yönetmelik doğrultusunda programa alınarak takas işlemleri yapılabilecektir. 2) Nitelikli Doğal Koruma Alanları: Koruma amaçlarına uygun olarak yörede yaşayanların alanın mevcut kaynaklarını kullanmasını sağlayarak doğal hayata dayalı geleneksel yaşam şekillerinin korunacağı alanlardır. 3) Sürdürülebilir Koruma ve Kontrollü Kullanım Alanları: Kesin korunacak hassas alanları veya nitelikli doğal koruma alanlarını etkileyen, bölgelerdir. Korumaya katkı sağlayacak, doğal ve kültürel bakımdan uyumlu düşük yoğunlukta faaliyetler, turizm ve yerleşimlere izin veren alanlardır. Doğal Sit Alanı şerhleri tasarruf ve özellikle yapılaşma haklarına sınırlamalar getirdiğinden taşınmazın değerini olumsuz yönde etkileyebilecektir. Öncelikle doğal sit 'in kategorisi tespit edilmeli, (Bakanlar Kurulu kararı ile ilan edilmektedir.) henüz kategorisi belirlenmemiş alanlar için ilgili kurumlardan bilgi alınarak ve raporda bu durum açıklanarak çevredeki piyasa koşullarına göre değer takdir edilmelidir. Kesin korunacak hassas alan kategorisindeki bölgeler için sadece bilgi amaçlı değer takdir edilmelidir.",
    "reportText": "Taşınmaz Doğal Sit Alanında Nitelikli Doğal Koruma / Sürdürülebilir Koruma ve Kontrollü Kullanım kategorisinde veya kategorisi belirlenmemiş alanda kalmaktadır.",
    "valuationMethod": "Taşınmaz Doğal Sit Alanında Nitelikli Doğal Koruma Alanlarında veya Sürdürülebilir Koruma ve Kontrollü Kullanım Alanlarında kalmakta ise,",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "44M",
    "status": "5366 Sayılı Yıpranan Tarihi ve Kültürel Taşınmaz Varlıkların Yenilenerek Korunması Hakkında Kanun Beyanı",
    "description": "Yıpranan Tarihi Ve Kültürel Taşınmaz Varlıkların Yenilenerek Korunması Ve Yaşatılarak Kullanılması Hakkında Kanun, yenileme ve koruma alanları oluşturulmasına, bu alanlarda binaların il özel idareleri ve belediyeler, Toplu Konut İdaresi tarafından yeniden inşa ve restore edilerek konut, ticaret, kültür, turizm ve sosyal donatı alanları oluşturulmasına ilişkin hükümleri düzenlemektedir. Düzenlenecek yenileme projesine göre parseli ve yapısı aynen korunarak yenilenecek yapıların, il özel idaresi ve belediyenin belirleyeceği amaçta kullanılmak ve yenilemenin projeyle eş zamanlı olarak yapılması kaydıyla parsel sahibince de yenilenmesine izin verilebilmektedir. İl özel idaresi ve belediye, yenileme alanı ilan edilen yerlerdeki taşınmazlar üzerinde, her türlü yapılaşma, kullanım ve işletme konularında proje tamamlanıncaya kadar geçici kısıtlamalar uygulayabilir, toplu yapı olarak tek bir kat mülkiyeti tesis edilebilir veya kamulaştırabilir. Yenilemenin ne şekilde yapılacağı ve kamulaştırma uygulaması incelenerek değer takdir edilmelidir. Yapılacak uygulamaya göre 120'li (Kentsel Dönüşüm) kodları kıyasen kullanılarak değer tipi belirlenir.",
    "reportText": "Taşınmaz 5366 Sayılı Yıpranan Tarihi Ve Kültürel Taşınmaz Varlıkların Yenilenerek Korunması Ve Yaşatılarak Kullanılması Hakkında Kanun kapsamındadır.",
    "valuationMethod": "Taşınmazların değerinin tespiti yapılırken eksper tarafından öncelikle bölge ölçeğinde topluca mı, parsel bazlı mı yenileme yapılacağı belirlenmeli, kamulaştırma yapılıp yapılmayacağı sorgulanmalı, yenileme projeleri temin edilerek incelenmeli, Belediyeden ve ilgili idarelerden öğrenilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Askeri Bölgeler",
    "code": "45A",
    "status": "Askeri Yasak Bölge/ Güvenlik Bölgesi - 1. Derece ve Kamulaştırma Yapılacak",
    "description": "2565 Sayılı Kanun ile Askeri Yasak Bölgeler ve Güvenlik Bölgelerinde taşınmaz edinimine, ikamet edilmesine, mesleki faaliyetlere ve inşaat yapılmasına sınırlamalar getirilmiştir. Özellikle yabancı uyruklulara bölgeye giriş ve mülkiyet edinme yasakları bulunmaktadır. Türk vatandaşları için de bölgeye giriş sınırlamaları olabilmektedir. 1. derece Askeri Yasak Bölgeler içindeki taşınmazlar mevzuata göre kamulaştırılır. (Kara sınır hattı boyunca ve kıyılarda tesis edilen birinci derece kara askeri yasak bölgelerinde kamulaştırma yapılması zorunlu değildir.) Askeri ve güvenlik bölgeleri içinde yabancı uyruklu kişilerin mülkiyet edinimi izne tabi olup yabancı uyruklu kişilerin mülkiyetinde olan taşınmazlar gerekli görülmesi halinde kamulaştırılabilir. Bölgenin kamulaştırma uygulaması incelenerek kamulaştırma yapılacağına dair bilgi alınan taşınmazlara sadece bilgi amaçlı değeri takdir edilir.",
    "reportText": "Taşınmaz 1. Derece Askeri Yasak Bölgede kalmaktadır. Bölgede kamulaştırma yapılacağı bilgisi alınmıştır.",
    "valuationMethod": "Kamulaştırma yapılacağına dair kesin bilgi alınmış ise, Bilgi Amaçlı Değeri verilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Askeri Bölgeler",
    "code": "45B",
    "status": "Askeri Yasak Bölge/ Güvenlik Bölgesi - 2. Derece",
    "description": "2. derece Askeri Yasak Bölgelerde ve Güvenlik Bölgelerinde inşaat, hafriyat, tadilat vb. faaliyetler özel izne tabi olup güvenlik nedeniyle izin verilmezse yapılamaz. Askeri ve güvenlik bölgeleri içinde yabancı uyruklu kişilerin mülkiyet edinimi izne tabi olup yabancı ve (gerek görülmesi halinde TC. uyruklu) kişilerin mülkiyetinde olan taşınmazlar kamulaştırılabilir.",
    "reportText": "Taşınmaz 2. Derece Askeri Yasak Bölgede/Güvenlik Bölgesinde kalmaktadır. Mülkiyet edinimi, inşaat yapılması, kullanım ve bölgeye giriş çıkışlarda tasarruf kısıtlaması bulunmaktadır. 2. Derece Askeri Yasak Bölgede ve Güvenlik Bölgesinde yer alan taşınmazlar ihtiyaç halinde kamulaştırılabilir.",
    "valuationMethod": "2. derece Askeri Yasak Bölgelerde ve Güvenlik bölgelerinde yapılaşma, yeni inşaat izni ve bölgeye giriş çıkışla ilgili bilgiler alınarak yapılaşma koşullarına göre Yasal ve Mevcut Durum Değeri takdir edilir. (Kara sınır hattı boyunca ve kıyılarda tesis edilen 1. Derece Askeri Yasak Bölgeler bu madde kapsamında değerlendirilmelidir.)",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Askeri Bölgeler",
    "code": "45C",
    "status": "Askeri Yasak Bölge/ Güvenlik Bölgesi - 1. Derece ve Kamulaştırma Kararı Alınmamış",
    "description": "2565 Sayılı Kanun ile Askeri Yasak Bölgeler ve Güvenlik Bölgelerinde taşınmaz edinimine, ikamet edilmesine, mesleki faaliyetlere ve inşaat yapılmasına sınırlamalar getirilmiştir. Özellikle yabancı uyruklulara bölgeye giriş ve mülkiyet edinme yasakları bulunmaktadır. Türk vatandaşları için de bölgeye giriş sınırlamaları olabilmektedir. 1. derece Askeri Yasak Bölgeler içindeki taşınmazlar mevzuata göre kamulaştırılır. (Kara sınır hattı boyunca ve kıyılarda tesis edilen birinci derece kara askeri yasak bölgelerinde kamulaştırma yapılması zorunlu değildir.) Askeri ve güvenlik bölgeleri içinde yabancı uyruklu kişilerin mülkiyet edinimi izne tabi olup yabancı uyruklu (gerek görülmesi halinde TC. uyruklu) kişilerin mülkiyetinde olan taşınmazlar kamulaştırılabilir. Bölgenin kamulaştırma uygulaması incelenerek değer takdir edilmelidir.",
    "reportText": "Taşınmaz 1. Derece Askeri Yasak Bölgede kalmaktadır. Taşınmazın kamulaştırılmasına ilişkin bir karar tespit edilmemiştir.",
    "valuationMethod": "Kamulaştırma sürecinin başlamadığı kesin olarak tespit edilmiş ise Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46A",
    "status": "Orman Kanunu 2B Beyanı (6831 Sayılı Orman Kanunu 2/B Maddesi)",
    "description": "6831 sayılı Orman Kanununun 2/B Beyanı, orman vasfını kaybetmiş hazine arazileri için koyulmaktadır. 31.12.1981 tarihinden önce orman niteliğini tam olarak kaybetmiş yerlerden; tarla, bağ, bahçe gibi çeşitli tarım alanları, otlak vb. araziler ile şehir, kasaba ve köy yapılarının toplu olarak bulunduğu yerleşim alanları orman sınırları dışına çıkartılır. 6292 sayılı Kanunla 2/B arazilerinin satışı düzenlenmiştir. Buna göre; 2/B alanlarında bulunan taşınmazların güncelleme listelerine veya kadastro tutanaklarına ya da kesinleşmiş mahkeme kararlarına göre oluşturulan tapu kütüklerinin beyanlar hanesinde 31.12.2011 tarihinden önce kullanıcısı ve/veya üzerindeki muhdesatın sahibi olarak gösterilen kişilerden bu taşınmazları satın almak için süresi içerisinde idareye başvuranlar hak sahibi sayılmaktadır. Taksitle yapılan satışlarda kalan miktarı karşılayacak tutarda kesin ve taksitlendirmeye uygun süreli banka teminat mektubu verilmesi veya Hazine lehine kanuni ipotek düzenlenmesi halinde taşınmaz, tapuda hak sahibi adına devredilir. İpotek tesis edilerek devredilen taşınmazların üçüncü kişilere satılması hâlinde borcun kalan tutarından alıcılar sorumludur.",
    "reportText": "Taşınmaz üzerinde 6831 sayılı Orman Kanunu 2B Beyanı bulunmakta olup beyanın kaldırılması veya borçların ödenerek devir sürecinin tamamlanması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "2B maddesiyle mülkiyeti edinilmiş taşınmazların değerlemesinde, Milli Emlak Müdürlüğünden araştırma yapılarak konu taşınmazın borç bilgileri ve hukuki durumu incelenmeli, imar uygulaması sonucu parselin ne şekilde etkileneceği de tespit edilerek değer takdirinde dikkate alınmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46B",
    "status": "Devlet Ormanı (6831 Sayılı Orman Kanunu 47. Madde Beyanı)",
    "description": "6831 sayılı Orman Kanununun 47. maddesi beyanı, amme müesseselerine ait ormanların parçalanarak şahıslara veya müesseselere toprağı ile birlikte devir ve temlik edilemeyeceğine ilişkin olup satışa engeldir.",
    "reportText": "Taşınmaz üzerinde 6831 sayılı Orman Kanunu 47. madde beyanı bulunmakta olup, Orman arazilerinin parçalanarak özel şahıslara veya müesseselere devir ve temlik edilememesi nedeniyle sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Satış kabiliyeti SATILAMAZ seçilmeli ve sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46C",
    "status": "Özel Orman (Özel Mülkiyete veya 6831 Sayılı Orman Kanunu 52. Maddesi Beyanı)",
    "description": "6831 sayılı Orman Kanununun 52. Maddesi uyarınca koyulan beyan ekim ve dikim suretiyle meydana getirilen hususi ormanlar hariç olmak üzere hususi ormanların 500 hektardan küçük parçalar teşkil edecek şekilde parçalanıp, başkalarına temlik ve mirasçılar arasında ifrazen taksim edilemeyeceği ve üzerinde aynı madde hükmü dışında inşaat yapılamayacağına ilişkin olup satışa engel değildir. Kasaba ve köy yapılarının toplu olarak bulunduğu yerlerdeki hususi orman alanlarında 6831 sayılı Orman Kanununun 17. maddesine göre Orman Bakanlığınca izin verilmesi uygun görüldüğü taktirde ve yatay alanın % 6’sını geçmemek koşuluyla imar planlamasına uygun inşaat yapılabilir.",
    "reportText": "Taşınmaz 6831 sayılı Orman Kanunu uyarınca Özel Orman statüsündedir. Özel ormanlar 500 hektardan küçük parçalar halinde temlik ve ifrazen taksim edilemez.",
    "valuationMethod": "Raporda beyanın etkisi açıklanmalıdır. “Ön izin” ve “Kesin izin” incelenerek bulunduğu statüye göre değer takdir edilir. İmar planı olmayan özel ormanlara imarsız arazi gibi değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46D",
    "status": "Orman Alanında Kalan Taşınmaz",
    "description": "Orman alanında kalan taşınmazların kamulaştırmaya konu olup olmayacağı belirlendikten sonra imar durumu ve sağlayacağı ekonomik fayda dikkate alınarak değer takdir edilmelidir. Orman kanununda sayılan istisnalar hariç olmak üzere, Orman Kadastrosu tarafından yapılan çalışmalarda orman olarak tescil edilen taşınmazlara kamulaştırmasız el atma yapılabilir. Toplu yapılaşma bulunan bölgelerin yakınlarındaki özel ormanlarda Orman Bakanlığından izin alınması ve imar planı yapılması şartıyla en fazla %6 yapılaşmaya izin verilmektedir. Her türlü sosyal-idari tesisler, yüzme havuzları ve diğer yapılar hesaplamalarda inşaat alanı sayılmakta olup sadece yollar inşaat alanı sayılmamaktadır. Özel orman alanlarını yapılaşmaya açarken Bakanlık 2 aşamalı izin süreci uygulamaktadır. Ön izin sadece proje çizimlerini ve resmi işlemleri kapsamaktadır. İnşaatın başlaması için kesin izin alınması ve Belediye tarafından imar planlarının yapılması gerekmektedir.",
    "reportText": "Taşınmaz Orman Alanında kalmaktadır.",
    "valuationMethod": "Orman Alanında kalan taşınmazlara yapılaşma hakları, kamulaştırma durumu ve sağlayacağı ekonomik faydalar dikkate alınarak değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46E",
    "status": "İmar Planında Ağaçlandırılacak Alanda Kalan Taşınmaz",
    "description": "İmar planlarında ağaçlandırılacak alanda kalan taşınmazların plan notları incelenmeli, kullanım hakları sorgulanmalı ve sağlayacağı ekonomik fayda dikkate alınarak değer takdir edilmelidir. Özel mülkiyete konu taşınmazın plan notlarında “tarım amaçlı ağaçlandırmaya” izin verildiği belirtilmiş veya kullanımı kısıtlayıcı bir husus bulunmuyor ise Mevcut Durum Değeri takdir edilir. İmar plan notlarında veya idari uygulamada kullanım kısıtlaması varsa sadece bilgi amaçlı değer takdir edilir.",
    "reportText": "Taşınmaz Ağaçlandırılacak Alanda kalmaktadır.",
    "valuationMethod": "Ağaçlandırılacak Alanda kalan taşınmazlara kamulaştırma durumu ve sağlayacağı ekonomik faydalar dikkate alınarak değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46F",
    "status": "Eylemli Orman Beyanı",
    "description": "Daha önceden 2-B maddesine göre orman vasfını yitirmiş, zirai faaliyet amaçlı ağaçlandırılmış veya tarlaya dönüştürülmüş yerlerin ilerleyen dönemlerde kullanım yetersizliğinden dolayı yeniden ormanlaşma sürecine girmiş olmasına Eylemli Orman denilmektedir. Eylemli Orman alanlarında Hazine mülkiyetindeki yerlerde hak sahiplerinin zilyet hakkı iptal edilir, özel mülkiyete konu alanlar kamulaştırılır.",
    "reportText": "Taşınmaz üzerinde Eylemli Orman beyanı bulunmaktadır.",
    "valuationMethod": "Öncelikle eylemli orman olarak belirlenen alanın yüzölçümü tespit edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "46G",
    "status": "Orman Kanunu 2A Beyanı (6831 Sayılı Orman Kanunu 2/A Maddesi)",
    "description": "Orman sınırları içinde olup, orman köyleri halkının yerleştirilmesi maksadıyla tarım alanlarına dönüştürülmesinde yarar olduğu tespit edilen yerler orman sınırları dışına çıkartılır. Bu yerler Devlete ait ise Hazine adına, hususi orman ise sahipleri adına orman sınırları dışına çıkartılır. Uygulama kesinleştikten sonra tapuda kesin tashih ve tescil işlemi yapılır. Kişiler adına kayıtlı olan ve Hazine adına orman sınırı dışına çıkarıldığı gerekçesiyle tapu kütüklerine 2/A veya 2/B belirtmesi konulan taşınmazların tapu kayıtları bedel alınmaksızın geçerli kabul edilir ve tapu kütüklerindeki 2/A veya 2/B belirtmeleri terkin edilerek tescilleri aynen devam eder. Devlet tarafından kişilere satılan, dağıtılan, trampa edilen, bedelli veya bedelsiz olarak devredilen veya iskânen verilen ya da özelleştirme suretiyle satılanlar ile hisseleri devredilen özel hukuk tüzel kişileri adına kayıtlı olan ancak daha sonra Hazine adına orman sınırı dışına çıkarıldığı gerekçesiyle tapu kütüklerine 2/A veya 2/B belirtmesi konulan taşınmazların tapu kayıtları geçerli kabul edilir.",
    "reportText": "Taşınmaz üzerinde 6831 sayılı Orman Kanunu 2A Beyanı bulunmakta olup şerhin kaldırılması veya borçların ödenerek devir sürecinin tamamlanması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "2A maddesiyle mülkiyeti edinilmiş taşınmazların değerlemesinde, Milli Emlak Müdürlüğünden araştırma yapılarak konu taşınmazın borç bilgileri ve hukuki durumu incelenmeli, imar uygulaması sonucu parselin ne şekilde etkileneceği de tespit edilerek değer takdirinde dikkate alınmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "50B",
    "status": "Riskli Yapı Beyanı - Riskli Bina Yıkılarak Yenilenmiş",
    "description": "Riskli yapı, yıkılma veya ağır hasar görme riski taşıdığı resmi kurumlarca tespit edilen yapıları ifade eder. Riskli yapı ilan edilen binalar yıkılarak yenilenmiş ise tapudaki beyan geçerliliğini yitirmektedir.",
    "reportText": "Taşınmaz üzerinde Riskli Yapı Beyanı bulunmakta olup bina yıkılarak yenilenmiştir. Beyanın malik tarafından kaldırılması önerilir.",
    "valuationMethod": "Bina yıkılarak yenilenmiş ise yeni inşa edilmiş yapıya göre Yasal ve Mevcut Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "51A",
    "status": "Kadastro Yenileme Beyanı - Değeri Etkilemeyen Düzenlemeler",
    "description": "3402 sayılı Kadastro Kanunun 22. maddesi kadastro yenileme işlemleriyle ilgili hükümleri düzenlemektedir. Yenileme işlemi daha önce yapılan kadastro sonucunda tespit edilip kesinleşmiş mülkiyet ve diğer ayni hakları değiştirmeyen, sadece daha önce yapılmış kadastro çalışmasının teknik yönden eksik kaldığı, kadastro haritası ile fiili sınırların tam olarak uyuşmaması hallerinde teknik eksiklik ve aksaklıkları gidermeye yönelik bir kadastro uygulaması olduğundan, fiili olarak tasarrufu sınırlandıran bir niteliğe sahip bulunmamaktadır. 11. Madde Kadastro düzeltmelerinin ilanına ve askıya çıkmasına ilişkindir. Ek-1. madde Beyanı kadastro veya tapulama haritalarının sayısallaştırılmasında uyulması gereken usul ve esasları belirlemektedir. 41. Madde Şerhi Kadastro sırasında veya sonrasında yapılan işlemlerdeki hataların re ’sen düzeltilmesine ilişkindir.",
    "reportText": "Taşınmaz üzerinde Kadastro Yenileme/Düzeltme beyanı bulunmaktadır.",
    "valuationMethod": "Yenileme sonucu oluşacak durum dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "51B",
    "status": "Kadastro Yenileme Beyanı - Değeri %5 den fazla Etkileyen Düzenlemeler",
    "description": "Değere %5 den fazla etkisi olan kadastro düzenlemelerinde parsel alanındaki değişim de dikkate alınarak değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde Kadastro Yenileme/Düzeltme beyanı bulunmakta olup değere etkisi dikkate alınmıştır.",
    "valuationMethod": "Yenileme sonucu oluşacak durum dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "51C",
    "status": "Kadastro Yenileme Beyanı - Değere Etkisi Belirsiz Düzenlemeler",
    "description": "Değere etkisi tespit edilemeyen kadastro düzenlemelerinde mevcut arsa alanı dikkate alınarak sadece Mevcut Durum Değeri takdir edilir ve düzenlemenin kapsamına ilişkin olarak müşteri aracılığı ile belge temin edilmeye çalışılır.",
    "reportText": "Taşınmaz üzerinde Kadastro Yenileme/Düzeltme beyanı bulunmakta olup kapsamı tespit edilemediğinden sadece mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Yenileme sonucu oluşacak durum dikkate alınarak Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Hisseli ve Zemin Hisseli Taşınmazlar",
    "code": "52A",
    "status": "Hazine Fazlalığı Beyanı",
    "description": "Kadastro çalışmaları sırasında konulan ve taşınmazın fiili sınırları dahilinde kalan taşınmaz alanı tapuda kayıtlı alanından fazla ise bu fazlalığın mülkiyetinin Hazine'ye ait olduğuna dair Tapu Siciline beyan koyulur. Hazineye ait alanlar düşülerek değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde Hazine Fazlalığı Beyanı bulunmakta olup Hazineye ait alan düşülerek değer takdir edilmiştir.",
    "valuationMethod": "Hazineye ait alanlar düşülerek Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "54A",
    "status": "Kamulaştırma Şerhi (2942 Sayılı Kamulaştırma Kanunu 7. Madde)",
    "description": "2942 sayılı Kamulaştırma Kanunun 7. Maddesine göre, kamulaştırmayı yapacak idare, kamulaştırma kararı verdikten sonra kamulaştırmanın tapu siciline şerh verilmesini kamulaştırmaya konu taşınmaz malın kayıtlı bulunduğu tapu idaresine bildirir. Kamulaştırma yapılacak tarihin belirsiz olması, kamulaştırmanın rayice uygun değerden yapılmaması, değerin yargı süreciyle belirlenmesi kamulaştırılacak taşınmazların satış kabiliyetini ve değerini önemli ölçüde sınırlandırmaktadır. Kamulaştırma bedeli ile rayiç bedeli arasında farklılık bulunabileceği, kamulaştırma bedelinin daha düşük olması halinde teminat açığı oluşturabileceği, kamulaştırma şerhi olan taşınmazın 3. şahsa satış ihtimalinin zayıf olacağı, kamulaştırma sürecinin uzun zaman alacağı, teminatın beklenenden geç nakde dönüşeceği, kamulaştırma kanununun 3.maddesi kapsamındaki büyük projelerde 5 yılda taksitle ödenebileceği hususları dikkate alınarak somut olay bazında değerlendirme yapılmalıdır.",
    "reportText": "Taşınmaz üzerinde Kamulaştırma (2942 sayılı Kamulaştırma Kanunu 7. madde) şerhi bulunmaktadır.",
    "valuationMethod": "Öncelikle kamulaştırma yapan belediye veya resmi kurumdan kamulaştırmanın nedeni, kapsadığı alan ve parsele göre konumu tespit edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "54B",
    "status": "Kesinleşmiş Kamulaştırma Şerhi (2942 Sayılı Kanun 31/B Madde) - Kalan Kısımlarda İnşaat Yapılabilen",
    "description": "2942 sayılı Kamulaştırma Kanunun 31. maddesinin 2. fıkrasına göre, mahkemece aynı kanunun 10 uncu maddesi uyarınca yapılan tebligat, davet veya ilanen tebliğden sonra taşınmaz malın başkasına devir ve ferağ veya temliki yasaklanmıştır. Kamulaştırmanın kapsamı, alanı tespit edilerek geriye kalan kısım için değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde Kesinleşmiş Kamulaştırma (2942 sayılı Kamulaştırma Kanunu 31/B maddesi) şerhi bulunmaktadır.",
    "valuationMethod": "Öncelikle kamulaştırma yapan belediye veya resmi kurumdan kamulaştırmanın nedeni, kapsadığı alan ve parsele göre konumu tespit edilmelidir. Bu şerh nedeniyle devir temlik yasağı bulunduğundan satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "54C",
    "status": "Kesinleşmiş Kamulaştırma Şerhi (2942 Sayılı Kanun 31/B Madde) - Kalan Kısımlarda İnşaat Yapılamayan",
    "description": "2942 sayılı Kamulaştırma Kanunun 31. maddesinin 2. fıkrasına göre, mahkemece aynı kanunun 10 uncu maddesi uyarınca yapılan tebligat, davet veya ilanen tebliğden sonra taşınmaz malın başkasına devir ve ferağ veya temliki yasaklanmıştır. Kamulaştırmadan sonra kalan kısımlarda yapı yapılamıyorsa geriye kalan kısım için bilgi amaçlı değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde Kesinleşmiş Kamulaştırma (2942 sayılı Kamulaştırma Kanunu 31/B maddesi) şerhi bulunmaktadır. Kamulaştırmadan sonra kalan kısımlarda yapı yapılamamaktadır.",
    "valuationMethod": "Öncelikle kamulaştırma yapan belediye veya resmi kurumdan kamulaştırmanın nedeni, kapsadığı alan ve parsele göre konumu tespit edilmelidir. Bu şerh nedeniyle devir temlik yasağı bulunduğundan satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "55A",
    "status": "Turizm Bölgesi Şerhi (2634 Sayılı Turizmi Teşvik Kanunu)",
    "description": "2634 sayılı Kanuna göre kültür ve turizm koruma ve gelişim bölgeleri içinde kalan özel mülkiyet konusu taşınmazların turizm yatırımlarına tahsisi amacıyla, acele kamulaştırması yapılabilir, Kamulaştırılan taşınmazlar Hazine mülkiyetine geçirilerek yönetmelikte belirlenen esaslara göre tespit edilecek Turizm yatırımcılarına bağımsız ve sürekli üst hakkı tesis edilir. Düzenleme turizm yatırımcısı olmayan malikler için kamulaştırma riski teşkil etmektedir.",
    "reportText": "Taşınmaz 2634 sayılı Kanuna göre Kültür ve Turizm Koruma ve Gelişim Bölgeleri içinde olup taşınmazların turizm yatırımlarına tahsisi amacıyla, acele kamulaştırması yapılabilir.",
    "valuationMethod": "Bu risk kodu sadece 2634 sayılı Kanuna göre kültür ve turizm koruma ve gelişim bölgeleri içinde kalan ve üzerinde şerh bulunan taşınmazlar içindir. Toplum Yararına Yapı/Turizm Tesisi Beyanı bulunan (turizm tesisi dışında bir amaçla kullanılmaması için beyan koyulan) taşınmazlar için bu risk kodu kullanılmaz; 55BCD risk kodlarından uygun olan seçilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "55B",
    "status": "Toplum Yararına Yapı/Turizm Tesisi Beyanı - Turizm Amaçlı Kullanılıyor ve Tesisin Tamamı Rapora Konu",
    "description": "Turizm Tesislerinin Niteliklerine İlişkin Yönetmeliğin 18. Maddesine göre Turizm Belgeli konaklama tesisleri tek bir bağımsız bölüm olmalıdır ve bu tesislerin konaklama birimleri üzerinde devre tatil hakkı tesis edilebilir. Bu tesislerin konaklama birimleri üzerinde devre mülk, kat irtifakı ve kat mülkiyeti gibi şerhe konu haklar tesis edilemez. Bu koşulları sağlayamayan tesislere turizm belgesi verilemez, bu sisteme kısmen veya tamamen geçen tesislerin belgeleri iptal edilir. Turizm alanları konut amaçlı kullanılamaz. Tercihli imar fonksiyonu verilen alanlarda turizm fonksiyonuna göre ruhsat verilmesi halinde izin verilen inşaat alanı genellikle konut fonksiyonuna göre izin verilen inşaat alanından daha fazla olmaktadır. Bu nedenle turizm imarına göre yapı ruhsatı alınıp daha sonra bu yapıları konut kullanımına açılması haksız kazanç sağlamaktadır. Mevzuata uygun olmayan işlemlerin (ruhsat, iskan, kat irtifakı kurulması) iptali söz konusu olabilir ve bu projelerden tapu alan hak sahipleri ile kredi veren bankalar zarara uğrayabilirler. Ayrıca, mevzuata aykırı olarak konut amaçlı kullanılan taşınmazların konut kullanımdan men edilmesi ve ceza riskleri de bulunmaktadır. Tesisin tamamının birlikte teminat alınıp fek edilmesi önerilmektedir.",
    "reportText": "Taşınmaz üzerinde Toplum Yararına Yapı/Turizm Tesisi Beyanı bulunmakta olup mevzuata göre konut amaçlı kullanılamaz ve kat irtifakı kurulamaz. Mevcut yapı turizm amaçlı kullanılmaktadır.",
    "valuationMethod": "Üzerinde Toplum Yararına Yapı /Turizm Tesisi Beyanı bulunan tesislerin Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "55C",
    "status": "Toplum Yararına Yapı/Turizm Tesisi Beyanı - Turizm Amaçlı Kullanılıyor ve Bağımsız Bölümlerin Bir Kısmı Rapora Konu",
    "description": "Turizm Tesislerinin Niteliklerine İlişkin Yönetmeliğin 18. Maddesine göre Turizm Belgeli konaklama tesisleri tek bir bağımsız bölüm olmalıdır ve bu tesislerin konaklama birimleri üzerinde devre tatil hakkı tesis edilebilir. Bu tesislerin konaklama birimleri üzerinde devre mülk, kat irtifakı ve kat mülkiyeti gibi şerhe konu haklar tesis edilemez. Bu koşulları sağlayamayan tesislere turizm belgesi verilemez, bu sisteme kısmen veya tamamen geçen tesislerin belgeleri iptal edilir. Turizm alanları konut amaçlı kullanılamaz. Tercihli imar fonksiyonu verilen alanlarda turizm fonksiyonuna göre ruhsat verilmesi halinde izin verilen inşaat alanı genellikle konut fonksiyonuna göre izin verilen inşaat alanından daha fazla olmaktadır. Bu nedenle turizm imarına göre yapı ruhsatı alınıp daha sonra bu yapıları konut kullanımına açılması haksız kazanç sağlamaktadır. Mevzuata uygun olmayan işlemlerin (ruhsat, iskan, kat irtifakı kurulması) iptali söz konusu olabilir ve bu projelerden tapu alan hak sahipleri ile kredi veren bankalar zarara uğrayabilirler. Ayrıca, mevzuata aykırı olarak konut amaçlı kullanılan taşınmazların konut kullanımdan men edilmesi ve ceza riskleri de bulunmaktadır. Tesisin tamamının birlikte teminat alınıp fek edilmesi önerilmektedir.",
    "reportText": "Taşınmaz üzerinde Toplum Yararına Yapı/Turizm Tesisi Beyanı bulunmakta olup mevzuata göre konut amaçlı kullanılamaz ve kat irtifakı kurulamaz. Mevcut yapı turizm amaçlı kullanılmaktadır ve bağımsız bölümlerin bir kısmı rapora konudur.",
    "valuationMethod": "Üzerinde Toplum Yararına Yapı /Turizm Tesisi Beyanı bulunan tesisin tamamı rapora konu değilse kat irtifakının iptal edilmesi riski bulunduğundan sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "55D",
    "status": "Toplum Yararına Yapı/ Turizm Tesisi Beyanı - Turizm Amacı Dışında Kullanım",
    "description": "Turizm Tesislerinin Niteliklerine İlişkin Yönetmeliğin 18. Maddesine göre Turizm Belgeli konaklama tesisleri tek bir bağımsız bölüm olmalıdır ve bu tesislerin konaklama birimleri üzerinde devre tatil hakkı tesis edilebilir. Bu tesislerin konaklama birimleri üzerinde devre mülk, kat irtifakı ve kat mülkiyeti gibi şerhe konu haklar tesis edilemez. Bu koşulları sağlayamayan tesislere turizm belgesi verilemez, bu sisteme kısmen veya tamamen geçen tesislerin belgeleri iptal edilir. Turizm alanları konut amaçlı kullanılamaz. Tercihli imar fonksiyonu verilen alanlarda turizm fonksiyonuna göre ruhsat verilmesi halinde izin verilen inşaat alanı genellikle konut fonksiyonuna göre izin verilen inşaat alanından daha fazla olmaktadır. Bu nedenle turizm imarına göre yapı ruhsatı alınıp daha sonra bu yapıları konut kullanımına açılması haksız kazanç sağlamaktadır. Mevzuata uygun olmayan işlemlerin (ruhsat, iskan, kat irtifakı kurulması) iptali söz konusu olabilir ve bu projelerden tapu alan hak sahipleri ile kredi veren bankalar zarara uğrayabilirler. Ayrıca, mevzuata aykırı olarak konut amaçlı kullanılan taşınmazların konut kullanımdan men edilmesi ve ceza riskleri de bulunmaktadır. Tesisin tamamının birlikte teminat alınıp fek edilmesi önerilmektedir.",
    "reportText": "Taşınmaz üzerinde Toplum Yararına Yapı/Turizm Tesisi Beyanı bulunmakta olup mevzuata göre turizm amacı dışında kullanılamaz ve kat irtifakı kurulamaz. Amaç dışı kullanım tespit edilmiştir.",
    "valuationMethod": "Üzerinde Toplum Yararına Yapı /Turizm Tesisi Beyanı bulunan taşınmazlar turizm amacı dışlında, konut amaçlı vb. kullanılıyor ise sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "56A",
    "status": "Kamulaştırmasız El Atma Davası - Kalan Kısımlarda İnşaat Yapılabilen",
    "description": "Kamulaştırmasız el atma ve acele el koyma uygulamaları idarenin usulüne uygun bir kamulaştırma işlemi yapmadan özel mülkiyete konu taşınmazı kamu hizmetine tahsis etmesidir. Kamulaştırma işleminden farkı idarenin taşınmaza bedelsiz olarak el koymasıdır. Mülk sahibinin taşınmaz bedelini alabilmesi için dava açması gerekir. Kamulaştırmadan sonra kalan kısımlarda inşaat yapma ve kullanım imkanları incelenerek değer belirlenmelidir. Tapu Sicilinde şerh bulunmasa da yapılan incelemelerde taşınmazı ilgilendiren davalar bulunduğu tespit edilirse raporda belirtilmeli ve detaylı bilgi temin edilmeye çalışılmalıdır.",
    "reportText": "Taşınmaz Kamulaştırmasız El Atma işlemine tabi olup sadece kamulaştırma harici kısımlar için değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle el atma davasının kapsamı tespit edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Davalı Taşınmazlar",
    "code": "56B",
    "status": "Kamulaştırmasız El Atma Davası - Kalan Kısımlarda İnşaat Yapılamayan",
    "description": "Kamulaştırmasız el atma ve acele el koyma uygulamaları idarenin usulüne uygun bir kamulaştırma işlemi yapmadan özel mülkiyete konu taşınmazı kamu hizmetine tahsis etmesidir. Kamulaştırma işleminden farkı idarenin taşınmaza bedelsiz olarak el koymasıdır. Mülk sahibinin taşınmaz bedelini alabilmesi için dava açması gerekir. Kamulaştırmadan sonra kalan kısımlarda inşaat yapma ve kullanım imkanları incelenerek değer belirlenmelidir. Tapu Sicilinde şerh bulunmasa da yapılan incelemelerde taşınmazı ilgilendiren davalar bulunduğu tespit edilirse raporda belirtilmeli ve detaylı bilgi temin edilmeye çalışılmalıdır.",
    "reportText": "Taşınmazı Kamulaştırmasız El Atma işlemine tabi olup sadece kamulaştırma harici kısımlar için bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Öncelikle el atma davasının kapsamı tespit edilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57A",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu - Arazi Toplulaştırılması Henüz Yapılmamış",
    "description": "3083 sayılı Kanun ile arazi toplulaştırılması yapılan alanlarda, Bakanlar Kurulu kararının Resmi Gazete 'de yayımı tarihinden itibaren, kamulaştırma, toplulaştırma, arazi değiştirilmesi ve dağıtım işlemlerinin tamamlanıncaya veya tapuya tescili sonuçlandırılıncaya kadar, gerçek kişilerle özel hukuk tüzel kişilerine ait arazinin mülkiyet ve zilyetliği devir ve temlik edilemez. Bu araziler sulama şebekesi tamamlanıp sulamaya geçinceye kadar ipotek edilemez ve satış vaadine konu olamaz. Kısıtlama süresi 5 yıl olup uygulama devam edecekse uzatılabilir. Sahibine bırakılan arazilerin ise, Bankalarca ipotek alınması mümkün olup, tasarruf hakkı süreli olarak kısıtlandığından kısıtlama süresi içinde satılmak istenirse uygulayıcı kuruluştan izin alınması gerekmektedir. Şerh yüklü taşınmazlar arazi düzenlemesi sonucunda ifraz, tevhit, sınır-alan değişikliğine tabi olabileceğinden, şerh kaldırılıncaya kadar satış kabiliyeti ciddi ölçüde azalmış olacaktır. Toplulaştırma alanlarında gerçek kişiler ile kamu özel tüzel kişilerin arazilerinden uygulama projesinin özelliğine göre, yol ve kanal gibi kamunun ortak kullanacağı yerler için %10'a kadar katılım payı kesilebilir. Tapu Sicilinde taşınmaz üzerinde şerh bulunup bulunmadığına bakılmaksızın ilgili kanunlar kapsamındaki tüm taşınmazlar için kapsamına girdiği kanun maddesinin risk kodu seçilerek raporda belirtilmelidir. Uygulamanın tamamlanıp tamamlanmadığı, tamamlanmış ise önceki mülkiyet hakları karşılığında sahibine bırakılarak mı, dağıtım sonucu tahsis edilerek mi mülkiyet edinildiği, uygulama tamamlanmamış ise süre uzatımı yapılıp yapılmadığı incelenerek değerlendirme yapılır.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu kapsamında olup henüz toplulaştırılma işlemi yapılmamıştır. Arazi toplulaştırma sonucunda parsel alanında, konumunda, yüzölçümünde ve biçiminde değişiklik olması, hisseli duruma gelmesi, kamulaştırma riskleri bulunmaktadır. Bankanın ipotek alması halinde icra yoluyla arazinin mülkiyeti edinilebilir ancak, arazinin elden çıkarması toplulaştırma yapan idarenin izni ve takdirine bağlı olup, izin verilmemesi olasılığı dikkate alınmalıdır.",
    "valuationMethod": "Arazi toplulaştırılması henüz yapılmamış tarım arazileri için Yasal Durum Değeri verilmemeli, sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57B",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu 6. Madde Şerhi - Küçük Parçalara Taksim Edilemez ve İfraz İşlemlerine Konu Olamaz",
    "description": "57A risk kodundaki genel açıklamalar geçerlidir. Ayrıca, Kanunun 6. maddesine göre uygulama alanlarında ilgili kuruluşça, isteğe bağlı veya maliklerin muvafakatı aranmaksızın arazi toplulaştırılması yapılabilir. Toplulaştırma sonunda malikleri adına tescil edilen araziler 3083 sayılı Kanun hükümleri dışında o bölge için tespit edilen dağıtım normundan daha küçük parçalara rıza en veya hükmen taksim edilemez ve ifraz işlemlerine konu olamaz. Bu husus tapu siciline şerh edilir.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu 6. madde kapsamında olup toplulaştırılma uygulaması yapılmıştır. Kanunun 6. maddesine göre bölge için tespit edilen dağıtım normundan daha küçük parçalara rıza en veya hükmen taksim edilemez ve ifraz işlemlerine konu olamaz.",
    "valuationMethod": "Toplulaştırma işlemi yapılmış ise, 3083 sayılı yasanın 6. maddesine göre kısıtlı olduğu beyanı bulunması durumunda Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57C",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu 11. Madde Şerhi - Topraksız Çiftçilere Dağıtılan Arazi",
    "description": "57A risk kodundaki genel açıklamalar geçerlidir. Ayrıca, uygulayıcı kuruluş, tasarrufuna geçen araziyi yeterli toprağı bulunmayan çiftçilere dağıtabilir. Bu Kanuna göre dağıtılan topraklar bölünemez. 11. maddeye göre Miras hükümleri dışında başkalarına devredilemez. Ancak dağıtılan çiftçilerle mirasçıları tarafından işletilebilir. Bu arazi kamu yararı dışında hiçbir ayni hakla kayıtlanamaz, haczedilemez, satış vadine konu edilemez ve kiraya verilemez. Bu husus tapu siciline şerh edilir.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu 11. madde kapsamındadır. Taşınmazın kanunen kısıtlı olması ve satışa konu edilememesi sebebiyle sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "11. madde şerhi varsa toplulaştırma işleminin yapılmış olup olmamasına bakılmaksızın sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57D",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu 13. Madde Şerhi (Temliki Tasarrufların Durdurulması) - Toplulaştırma Yapılmamış",
    "description": "57A risk kodundaki genel açıklamalar geçerlidir. Ayrıca, Kanunun 13. maddesine göre uygulama alanlarında Bakanlar Kurulu kararının Resmi Gazete 'de yayımı tarihinden itibaren, kamulaştırma, toplulaştırma, arazi değiştirilmesi ve dağıtım işlemlerinin tamamlanması veya tapuya tescili sonuçlandırılıncaya kadar, gerçek kişilerle özel hukuk tüzelkişilerine ait arazinin mülkiyet ve zilyetliği devir ve temlik edilemez. Bu araziler ipotek edilemez ve satış vaadine konu olamaz. Toplulaştırma yapılması ve sulama şebekesinin tamamlanıp sulamaya geçirilmesi sonrasında kısıtlılıklar kaldırılır.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu 13. madde (Temliki tasarrufların durdurulması maddesidir. Şerh kaldırılmadan veya izin alınmadan satış işlemi yapılamaz.) kapsamında olup toplulaştırılma uygulaması yapılmamıştır. Taşınmazın kanunen kısıtlı olması ve satışının izne tabi olması sebebiyle %10 düzenleme ortaklık payı düşülerek sadece mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Toplulaştırma işlemi yapılmamış ve yasanın 13. maddesine göre kısıtlı olduğu beyanı varsa %10 düzenleme ortaklık payı düşülerek sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57E",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu 13. Madde Şerhi (Temliki Tasarrufların Durdurulması) - Toplulaştırma Yapılmış",
    "description": "57A risk kodundaki genel açıklamalar geçerlidir. Ayrıca, Kanunun 13. maddesine göre uygulama alanlarında Bakanlar Kurulu kararının Resmi Gazete 'de yayımı tarihinden itibaren, kamulaştırma, toplulaştırma, arazi değiştirilmesi ve dağıtım işlemlerinin tamamlanması veya tapuya tescili sonuçlandırılıncaya kadar, gerçek kişilerle özel hukuk tüzelkişilerine ait arazinin mülkiyet ve zilyetliği devir ve temlik edilemez. Bu araziler ipotek edilemez ve satış vaadine konu olamaz. Toplulaştırma yapılması ve sulama şebekesinin tamamlanıp sulamaya geçirilmesi sonrasında kısıtlılıklar kaldırılır.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu 13. madde (Temliki tasarrufların durdurulması maddesidir. Şerh kaldırılmadan veya izin alınmadan satış işlemi yapılamaz.) kapsamında olup toplulaştırılma uygulaması tamamlanmıştır. Şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Toplulaştırma işlemi yapılmış ve yasanın 13. maddesine göre kısıtlı olduğu beyanı varsa Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "57F",
    "status": "Arazi Toplulaştırma, 3083 Sayılı Tarım Reformu Kanunu Kapsamında Toplulaştırma Sonucu Sahibine Bırakılan Arazi",
    "description": "57A risk kodundaki genel açıklamalar geçerlidir. Sahibine bırakılacak topraklar, bölgenin özellikleri dikkate alınarak Bakanlar Kurulunca belirlenir. Sahibine bırakılan topraklar, o bölge için tespit edilen dağıtım normundan daha küçük parçalara hükmen veya rıza en bölünmemek suretiyle devir ve temlik edilebilir. Bu husus tapu siciline şerh edilir.",
    "reportText": "Taşınmaz 3083 sayılı Tarım Reformu Kanunu kapsamında olup, toplulaştırma sonucu sahibine bırakıldığı tespit edilmiştir.",
    "valuationMethod": "Toplulaştırma sonucu sahibine bırakılan arazilerde (varsa yol ve kanal vb. terkleri düşülerek) Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58D",
    "status": "6200 Sayılı Kanunun Ek 9. Maddesine Göre Toplulaştırma Belirtmesi - Toplulaştırma Yapılmış",
    "description": "6200 Sayılı Devlet Su İşleri Genel Müdürlüğünce Yürütülen Hizmetler Hakkında Kanuna göre, Arazi toplulaştırması sahası ilan edilen yerlerle toplulaştırma işlemleri sonuçlanıncaya kadar arazilerin mülkiyet ve zilyetliğinin devir, temlik, ipotek ve satış vaadi işlemleri DSİ’nin ve proje idaresinin iznine bağlıdır. Arazi üzerinde, DSİ veya proje idaresi tarafından yapılacak fiili uygulamalar, hak sahiplerinin iznine tabi değildir. Arazi toplulaştırması sonucu oluşturulan parsellerin alanı ve arazi özellikleri birlikte değerlendirilir ve arazilerden yol, kanal, tahliye kanalı gibi kamunun ortak kullanacağı yerler için en fazla %10’u kadar ortak tesislere katılım payı düşülür.",
    "reportText": "Taşınmaz 6200 sayılı DSİ Genel Müdürlüğünce Yürütülen Hizmetler Hakkında Kanun kapsamında olup toplulaştırması tamamlanmıştır.",
    "valuationMethod": "Toplulaştırma işlemi yapılmış ise, Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58E",
    "status": "6200 Sayılı Kanunun Ek 9. Maddesine Göre Toplulaştırma Belirtmesi - Toplulaştırma Yapılmamış",
    "description": "6200 Sayılı Devlet Su İşleri Genel Müdürlüğünce Yürütülen Hizmetler Hakkında Kanuna göre, Arazi toplulaştırması sahası ilan edilen yerlerle toplulaştırma işlemleri sonuçlanıncaya kadar arazilerin mülkiyet ve zilyetliğinin devir, temlik, ipotek ve satış vaadi işlemleri DSİ’nin ve proje idaresinin iznine bağlıdır. Arazi üzerinde, DSİ veya proje idaresi tarafından yapılacak fiili uygulamalar, hak sahiplerinin iznine tabi değildir. Arazi toplulaştırması sonucu oluşturulan parsellerin alanı ve arazi özellikleri birlikte değerlendirilir ve arazilerden yol, kanal, tahliye kanalı gibi kamunun ortak kullanacağı yerler için en fazla %10’u kadar ortak tesislere katılım payı düşülür.",
    "reportText": "Taşınmaz 6200 sayılı DSİ Genel Müdürlüğünce Yürütülen Hizmetler Hakkında Kanun kapsamındadır. Arazi toplulaştırma sonucunda parsel alanında, konumunda, yüzölçümünde ve biçiminde değişiklik olması, hisseli duruma gelmesi, kamulaştırma riskleri bulunmaktadır.",
    "valuationMethod": "Arazi toplulaştırılması henüz yapılmamış araziler için sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58F",
    "status": "5403 Sayılı Toprak Koruma Kanunu Beyanı veya Tespiti - Tam Mülkiyet",
    "description": "5403 sayılı Toprak Koruma ve Arazi Kullanım Kanunu tarımsal arazilerin büyüklüklerine, ifraz ve tevhit işlemlerine, el değiştirme tasarruflarına ve toplulaştırma uygulamalarına ilişkin düzenlemeler getirmektedir. 8/A maddesine göre Tarım arazileri Kanuna ekli (1) sayılı listede belirlenen yeter gelirli tarımsal arazi büyüklüklerinin altında ifraz edilemez, bölünemez. 8/B maddesine göre ise tarım arazilerinde; ifraz, hisselendirme, pay temliki, elbirliği mülkiyetinin paylı mülkiyete dönüştürülmesi, elbirliği mülkiyetinin devri, paylı mülkiyet olarak intikal, taksim ve vasıf değişikliği işlemleri Bakanlığın izni ile yapılır. İmar planında “tarımsal niteliği korunacak arazi” lejantında kalan veya imar planı ve köy yerleşik alanı kapsamı dışındaki tüm tarımsal arazilerin üzerinde şerh bulunup bulunmadığına bakılmaksızın 5403 sayılı Kanun kapsamında olduğu dikkate alınarak rapor düzenlenmelidir.",
    "reportText": "Taşınmaz üzerinde 5403 sayılı Toprak Koruma Kanunu kapsamındadır.",
    "valuationMethod": "Tüm tarım arazilerinde 58FG risk kodlarından birisi mutlaka seçilmelidir. Yeter gelirli tarımsal arazilerin ekonomik bütünlüğe sahip olmayan kısımları Bakanlığın izni ile satılabilir; ifadesi kanunun 8/A maddesinden çıkarılmıştır. Yerine 8/B maddesine Tarım arazilerinde; ifraz, hisselendirme, pay temliki, elbirliği mülkiyetinin paylı mülkiyete dönüştürülmesi, elbirliği mülkiyetinin devri, paylı mülkiyet olarak intikal, taksim ve vasıf değişikliği işlemleri Bakanlığın izni ile yapılır, ifadesi eklenmiştir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58G",
    "status": "5403 Sayılı Toprak Koruma Kanunu Beyanı veya Tespiti - Hisseli Mülkiyet",
    "description": "5403 sayılı Toprak Koruma ve Arazi Kullanım Kanunu tarımsal arazilerin büyüklüklerine, ifraz ve tevhit işlemlerine, el değiştirme tasarruflarına ve toplulaştırma uygulamalarına ilişkin düzenlemeler getirmektedir. 8/A maddesine göre Tarım arazileri Kanuna ekli (1) sayılı listede belirlenen yeter gelirli tarımsal arazi büyüklüklerinin altında ifraz edilemez, bölünemez. 8/B maddesine göre ise tarım arazilerinde; ifraz, hisselendirme, pay temliki, elbirliği mülkiyetinin paylı mülkiyete dönüştürülmesi, elbirliği mülkiyetinin devri, paylı mülkiyet olarak intikal, taksim ve vasıf değişikliği işlemleri Bakanlığın izni ile yapılır. İmar planında “tarımsal niteliği korunacak arazi” lejantında kalan veya imar planı ve köy yerleşik alanı kapsamı dışındaki tüm tarımsal arazilerin üzerinde şerh bulunup bulunmadığına bakılmaksızın 5403 sayılı Kanun kapsamında olduğu dikkate alınarak rapor düzenlenmelidir.",
    "reportText": "Taşınmaz üzerinde 5403 sayılı Toprak Koruma Kanunu kapsamındadır. Kanun kapsamındaki alanlarda hisseli taşınmazların satışı Tarım ve Köy İşleri Bakanlığının iznine bağlıdır.",
    "valuationMethod": "Tüm tarım arazilerinde 58FG risk kodlarından birisi mutlaka seçilmelidir. Yeter gelirli tarımsal arazilerin ekonomik bütünlüğe sahip olmayan kısımları Bakanlığın izni ile satılabilir; ifadesi kanunun 8/A maddesinden çıkarılmıştır. Yerine 8/B maddesine Tarım arazilerinde; ifraz, hisselendirme, pay temliki, elbirliği mülkiyetinin paylı mülkiyete dönüştürülmesi, elbirliği mülkiyetinin devri, paylı mülkiyet olarak intikal, taksim ve vasıf değişikliği işlemleri Bakanlığın izni ile yapılır, ifadesi eklenmiştir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58H",
    "status": "Tarımsal Amaçlı Kullanılan Taşınmaz Beyanı ve/veya Büyük Ova Alanında Taşınmaz",
    "description": "Tarım arazileri, 5403 sayılı Toprak Koruma ve Arazi Kullanımı Kanununda belirtilen izinler alınmadan; tarımsal amaç dışında kullanılamaz, planlanamaz, köy ve/veya mezraların yerleşik alanı ve civarı veya yerleşik alan olarak tespit edilemez. 5403 sayılı kanuna ve Tarım Arazilerinin Korunması, Kullanılması ve Planlamasına Dair Yönetmeliğe göre tarım arazisi olarak belirlenen alanlar Tapu sicilinde belirtilebilir. Bu alanlarda yapılaşma kısıtlaması bulunmakta olup yapılaşma sadece özel izinlerle gerçekleştirilebilir. Cumhurbaşkanlığı Kararı ile bellenen Büyük Ova Alanları da bu kapsamdadır.",
    "reportText": "Taşınmaz Büyük Ova Alanında kalmaktadır.",
    "valuationMethod": "Tarımsal Amaçlı Kullanılan Taşınmazlar Beyanı bulunan ya da Cumhurbaşkanlığı kararıyla Büyük Ova olarak belirlenen alanlarda öncelikle ilgili kurumun bölgeyle ilgili projeleri, toplulaştırma çalışmaları tespit edilmeli ve uygulama özelinde 57ABCDEF risk kodlarından uygun olan seçilerek değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58I",
    "status": "Ağaçlı Tarım Arazisi",
    "description": "Bağ, bahçe, fidanlık, orman vb. arazilerde ağaçların taşınmaza kattığı değer dikkate alınarak mevcut durum değeri takdir edilir. Mevzuata göre ağaç sigortası yapılmadığı (sadece ürünler sigortalanabildiği) için yasal değer belirlenirken ağaçlar dikkate alınmaz. Ekspertiz raporunda, ağaçların, türü, sayısı, yaşı, ürün verimi, üretim gelirleri/giderleri periyodik bakım gerektiren kiraz, şeftali, kayısı gibi ağaçların bakım durumu, kereste vb. amaçlı yetiştirilen ağaçların kesime ve satışa uygun olup olmadığı hakkında yeterli açıklama yapılmalı ve emsal taşınmazlardaki ağaçlar hakkında genel bilgi verilmelidir. Üzerinde ticari değeri olan ağaçlar bulunan bahçeler imara açılmış veya imar beklentisi ile fiyatı oluşmuş ise ağaçlar değerlemeye dahil edilmez çevredeki imarlı arsalara göre değer takdir edilmelidir.",
    "reportText": "",
    "valuationMethod": "Meyve bahçesi ya da kerestelik ağaçlar gibi üzerinde ticari değeri olan ağaçlar bulunan taşınmazlarda,",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Tarım ve Orman Alanları",
    "code": "58J",
    "status": "Sera Yapısı",
    "description": "Basit naylon seralar hariç tüm sera yapılarının yapı ruhsatı alması gerekmektedir. Ruhsatı bulunmayan seralar ile beraberindeki kulübe, depo, prefabrik yapı sundurma, vb. tarımsal yapıların ve tel çit, sulama tesisatı gibi yatırımların değerleri mevcut durum değerine eklenir.",
    "reportText": "Taşınmaz üzerinde sera yapısı bulunmaktadır.",
    "valuationMethod": "Sera yapılarında;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "59A",
    "status": "Muvakkat (Geçici) İnşaat Şerhi veya Tespiti",
    "description": "Muvakkat İnşaat şerhi geçici süreyle verilen bina inşaatını ifade etmektedir. İmar düzenlemesi yapılmamış yerlerde veya geçici inşa edilen binalar için verilebilmektedir. Geçici izin süresi en fazla 10 yıl ile sınırlı olup sonrasında binalar ruhsatsız hale gelmektedir ve binanın yıkım riski bulunmaktadır. Raporda geçici ruhsatın verildiği tarih ve varsa şerh tarihi belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Muvakkat (Geçici) İnşaat Şerhi bulunmakta olup binalar geçici izinle inşa edilmiştir. Muvakkat inşaat izinlerinin süresi 10 yıl ile sınırlıdır.",
    "valuationMethod": "Muvakkat (geçici) inşaat şerhi bulunan taşınmazlarda",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "60C",
    "status": "Para Cezası - İmar Kanunu 42. Madde Şerhi veya Ceza Tespiti",
    "description": "Taşınmaz üzerinde imar mevzuatına aykırılık teşkil eden durumlar tespit edildiğinde Belediye tarafından İmar Kanununun 42. maddesine göre para cezası uygulanır. Ceza tutarı konusunda bilgi alınmalı, tespit edilebiliyorsa raporda belirtilmelidir. İlgili para cezasının ödenmesi koşulu ile değer takdir edilmelidir. Takyidatta belirtilmese de belediyenin para cezası kestiği tespit edilen tüm durumlarda bu risk kodu kullanılmalıdır.",
    "reportText": "Taşınmaz üzerinde para cezası tespit edilmiştir. Ceza tutarı takdir edilen değerden düşülmemiş olup cezanın ödenerek şerhin kaldırılması tavsiye edilir.",
    "valuationMethod": "Ceza tutarı dikkate alınmaksızın Yasal ve Mevcut Durum Değeri takdir edilmeli ve cezanın ödenip şerhin kaldırılması tavsiye edilerek değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "61A",
    "status": "Vakıf Taviz Bedeli Şerhi/Beyanı",
    "description": "Vakıf taviz bedeli vakıf malı olmaktan çıkarılıp özel mülkiyete geçirilen taşınmazların serbestçe kullanılabilmeleri karşılığı olarak ödenmesi gereken tutardır. Özel mülkiyete geçirilirken ödenmesi gereken taviz bedeli ödenmemiş ise, bu ödeme yapılmadan satış işlemi yapılmamaktadır.",
    "reportText": "Taşınmaz üzerinde Vakıf Taviz Bedeli şerhi bulunmaktadır. Taviz bedeli takdir edilen değerden düşülmemiş olup taviz bedelinin ödenerek şerhin kaldırılması tavsiye edilir.",
    "valuationMethod": "Ödenmesi gereken güncel taviz bedeli tutarı tapu sicil evrakı incelenerek tespit edilmeli, tutarı ve ödenip ödenmediği raporun önemli not bölümünde ayrıca belirtilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "62A",
    "status": "Harcamalara Katılım Payı Beyanı",
    "description": "2464 sayılı Belediye Gelirleri Kanununda yol, kanalizasyon, su tesisleri harcamalarına katılma payları düzenlenmiş ve katılma payının bina ve arsalarda vergi değerinin % 2’sini geçemeyeceği hüküm altına alınmıştır. Harcamalara katılma payına tabi taşınmazların listesi belediyelerce ilgili tapu dairelerine bildirilir. Bu taşınmazların satış, hibe ve trampaları halinde tapu dairesi payın tahsilini sağlamak üzere, belediyeyi haberdar eder ve pay ödenmedikçe mülkiyet devri yapılmaz.",
    "reportText": "Taşınmaz üzerinde Harcamalara Katılım Payı Beyanı bulunmaktadır. Katlım payı bedeli takdir edilen değerden düşülmemiş olup taviz bedelinin ödenerek şerhin kaldırılması tavsiye edilir.",
    "valuationMethod": "Katılım payı tutarı dikkate alınmaksızın Yasal ve Mevcut Durum Değeri takdir edilmeli ve ödenip şerhin kaldırılması tavsiye edilerek değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "62B",
    "status": "Taşınmaz Mal Mükellefiyeti",
    "description": "Borç Yükü (Taşınmaz Mal Mükellefiyetti) bir gayrimenkulün mal sahibinin, sadece o gayrimenkulle sınırlı olmak üzere, diğer bir kişiye bir şey vermek ya da yapmak yükümlülüğüdür. Gayrimenkul mükellefiyetinin kurulması için tapu siciline tescili şarttır. Tescilde, taşınmaz yükünün değeri olarak TL veya döviz ile belirlenmiş bir meblağ gösterilir. İnşaat şirketlerine; taş, kum, çakıl, ağaç ve toprak sağlamak için bu iş için uygun gayrimenkullerin mükellefiyet altına sokulması bu yükümlülüğe örnek olarak gösterilebilir. Ölünceye kadar gelir sözleşmesi de bu madde kapsamında değerlendirilir.",
    "reportText": "Taşınmaz üzerinde Mal Mükellefiyeti (Borç yükü) bulunmaktadır. Değer takdirinde borç yükü düşülmemiş olup, borcun ödenerek beyanın kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Taşınmaz Mal Mükellefiyetti (Borç yükü) bulunan taşınmazlarda borç yükünün kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "63A",
    "status": "Otopark Taahhütnamesi",
    "description": "İmar Kanunu ve Otopark Yönetmeliği uyarınca, yapı yapılırken parsel içinde ayrılmayan otopark yerlerinin bedelinin belediyeye peşin ödenmeyip, taksitle ödenmesinin taahhüt edilmesi halinde konulan beyandır. Otopark şerhi, taşınmazın piyasa değerinde ciddi azalma yaratacak bir unsur olarak değerlendirilmemeli tespit edilebiliyorsa tutarı belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Otopark Taahhütnamesi beyanı bulunmaktadır. Otopark bedeli takdir edilen değerden düşülmemiş olup bedelin ödenerek şerhin kaldırılması tavsiye edilir.",
    "valuationMethod": "Otopark bedeli dikkate alınmaksızın Yasal ve Mevcut Durum Değeri takdir edilmeli ve ödenip şerhin kaldırılması tavsiye edilerek değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "64A",
    "status": "Gedik Hakkı",
    "description": "Gedik Hakkı eski hukuk sisteminden kaynaklanan bir tür kullanım hakkı olup mülkiyet ikiliğini kaldırmak amacıyla 3194 sayılı İmar Kanununun geçici 5. Maddesi ile gedik haklarının tasfiyesine yönelik düzenleme yapılmıştır. Gedik ve zeminler yıkılıp yok olarak varlıklarını kaybedip, kaybetmediklerine bakılmaksızın bu kanun hükümlerine göre tasfiye olunurlar. Tasfiyeye tabi tutulan taşınmaz mallardaki zemin hakları bedele çevrilmiştir. Gedik bedeli, ait olduğu taşınmaz malın zemine ait son emlak vergi değerinin 1/5’idir. Bu şekilde belirlenecek zemin hakkı bedeli, tapu idaresince gedik sahibinin müracaatı halinde zemin hakkı sahibi adına emaneten milli bir bankaya yatırılır. Müracaat edilmediği takdirde zemin sahibi lehine Kanuni ipotek tesis edilir. hükmü bulunmaktadır. Kanunda gedik sahibinin başvurusu için bir süre tanınmamıştır. Tapu Kadastro Genel Müdürlüğünün 1477 sayılı genelgesinde gedik sahibinin makul bir sürede başvurusu olmadığı takdirde hesaplanacak zemin bedeli üzerinden örfü belde hakkı sahibi yararına kanuni ipotek tesis edilerek kütük sahifesi üzerindeki örfü belde kayıtlarının resen terkin edileceği belirtilmiştir.",
    "reportText": "Taşınmaz üzerinde Gedik Hakkı bulunmaktadır. Gedik bedeli, ait olduğu taşınmaz malın zemine ait son emlak vergi değerinin 1/5’idir. Gedik bedeli takdir edilen değerden düşülmemiş olup bedelin ödenerek şerhin kaldırılması tavsiye edilir.",
    "valuationMethod": "Gedik bedeli dikkate alınmaksızın Yasal ve Mevcut Durum Değeri takdir edilmeli ve ödenip şerhin kaldırılması tavsiye edilerek değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "65A",
    "status": "Zilyetlik Beyanı",
    "description": "Zilyetlik bir kimsenin taşınır ya da taşınmaz bir mal üzerindeki fiili hâkimiyetidir. Taşınmaz üzerindeki kullanım hakkını elinde bulundurma durumudur. Taşınmaz malikinin kullanım hakkını sınırlandırıcı etkisi nedeniyle talepte azalma ve değerde düşüş etkisi yaratır.",
    "reportText": "Taşınmaz üzerinde Zilyetlik Beyanı bulunmakta olup beyanın kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Zilyet beyanının kaldırılması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kira Şerhi",
    "code": "66A",
    "status": "Kira Şerhi - TEK, TEDAŞ, İSKİ vb. Lehine",
    "description": "TEK, TEDAŞ, İSKİ vb. lehine altyapı ihtiyaçların karşılanması amacıyla tesis edilen kira şerhleri genellikle değeri etkilememektedir. Kullanımı kısıtlayan ve değeri etkileyen durumlar ayrıca değerlendirilmelidir.",
    "reportText": "Taşınmaz üzerinde TEK/TEDAŞ/İSKİ vb. lehine kira şerhi bulunmaktadır.",
    "valuationMethod": "TEK, TEDAŞ, İSKİ gibi kuruluşlar lehine kira şerhlerinin konumu, kapsadığı alan ve değere etkisi incelenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kira Şerhi",
    "code": "66B",
    "status": "Kira Şerhi - Kira Tutarı Piyasa Rayiçlerine Uygun",
    "description": "Kira sözleşmeleri mülk sahibinin taşınmaz üzerindeki tasarruf haklarını etkilemektedir. Kira süresi boyunca kullanım hakkının -taşınmaz satılsa dahi- kiracıda olması, kiranın tamamının peşin ödenmesi, kira rakamının düşüklüğü gibi nedenlerle taşınmaza talebi olumsuz yönde etkileyebilmektedir. Akaryakıt tesisleri üzerindeki kira şerhleri 6B maddesinde değerlendirilir.",
    "reportText": "Taşınmaz üzerinde Kira Şerhi bulunmaktadır. Kira tutarı bölgedeki kira rayiçlerine uygundur.",
    "valuationMethod": "Kira şerhlerinde süre, tutar ve şartların taşınmazın değerine olan etkisi de dikkate alınarak değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kira Şerhi",
    "code": "66C",
    "status": "Kira Şerhi - Kira Tutarı Piyasa Rayiçlerine Uygun Değil",
    "description": "Kira sözleşmeleri mülk sahibinin taşınmaz üzerindeki tasarruf haklarını etkilemektedir. Kira süresi boyunca kullanım hakkının -taşınmaz satılsa dahi- kiracıda olması, kiranın tamamının peşin ödenmesi, kira rakamının düşüklüğü gibi nedenlerle taşınmaza talebi olumsuz yönde etkileyebilmektedir. Kira değeri piyasa rayiçlerine uygun değilse ya da peşin ödenmiş ise kalan kira süresine göre hesaplanacak kullanım değeri taşınmazın değerinden düşülerek Yasal Durum Değeri, şerhsiz durumuna göre Mevcut Durum Değeri takdir edilir. Akaryakıt tesisleri üzerindeki kira şerhleri 6B maddesinde değerlendirilir.",
    "reportText": "Taşınmaz üzerinde Kira Şerhi bulunmaktadır. Kira şerhinin kaldırılması koşuluyla mevcut durum değeri takdir edilmiştir. Kira şerhinin kaldırılması tavsiye edilir.",
    "valuationMethod": "Kira şerhlerinde süre, tutar ve şartların taşınmazın değerine olan etkisi de dikkate alınarak değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kira Şerhi",
    "code": "66D",
    "status": "Kira Şerhi - Kira Tutarı Belirsiz veya Değişken",
    "description": "Kira tutarı ve süresi taşınmazların değerini etkilemektedir. Kira sözleşmesi, kira tutarı ve süresi bilgileri temin edilememiş ise ya da sözleşmedeki kira tutarı işletmenin cirosuna, satış kârına vb. gelecekte oluşacak bir değere bağlı ise (ciro ve kira ödemesi bilgileri alınamıyorsa) kira sözleşmesinin taşınmazın değerine etkisi ölçülememektedir. Kira değerinin rayiçlere göre düşük kalması halinde taşınmazın satış kabiliyeti ve değeri olumsuz etkilenecektir. Kira değeri belirsiz ise ya da piyasa rayiçlerine uygun değilse kalan kira süresine göre hesaplanacak kullanım değeri taşınmazın değerinden düşülerek Yasal Durum Değeri, şerhsiz durumuna göre Mevcut Durum Değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde Kira Şerhi bulunmaktadır. Kira tutarının rayiçlere uygunluğunun belgelenmesi ya da şerhin kaldırılması koşuluyla mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu istisnai durumlar içindir. Kira sözleşmesi şubelerinde desteğiyle eksper tarafından temin edilmeye çalışılmalıdır. Kira tutarı tespit edilemiyorsa tespit edilememe sebebi raporda açıklanmalıdır. Kira tutarı belirsizse ya da ciroya bağlı olması vb. (enflasyon artışları dışında) bir sebeple değişken ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "68A",
    "status": "Yönetim Planı Beyanı",
    "description": "Yönetim planı, apartmanın kullanım şekli, uyulması gereken kurallar, yönetici görevleri vb. apartmanla ilgili konuları içeren ve apartmandaki bütün hak sahiplerini bağlayan belgeye denir. Yönetim planında satışı, kullanımı veya diğer tasarrufları kısıtlayan haller var ise durum hakkında raporda bilgi verilmeli, tespit edilen kısıtlar ve düzenlemeler göz önünde bulundurulmalıdır. Yönetim planları taşınmazın kullanımını etkileyebilecek hükümler de içerebilmektedir. Yönetim Planı kat maliklerinin 4/5'inin kararıyla değiştirilebilir ve taşınmazlara binanın ortak alanlarının (otopark, bodrum, bahçe, kat holü, çatı arası vb.) bir bağımsız bölüm tarafından kullanılmasına veya tahsisine ilişkin mülkiyet hakkı kazandırmaz. Yönetim planının değişmesi halinde taşınmaz değerine olumsuz etkisi olacak ise raporun önemli not bölümünde ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Yönetim Planı Beyanı bulunmaktadır.",
    "valuationMethod": "Beyanın olumlu/olumsuz etkisi yorumlanarak değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Menkul Ve Teferruatlar",
    "code": "69A",
    "status": "Teferruat Beyanı",
    "description": "Teferruat (eklenti) bir taşınmazın işletilmesi, korunması ya da yarar sağlaması için ana nesneye sürekli olarak tahsis edilen taşınır mallardır. Tapu Siciline eklenmiş dahi olsa icra satışlarında bilirkişi tespiti esas olduğundan makineler ve diğer menkuller gayrimenkul değerlemesine dahil edilmez. Binanın kullanımı için zorunlu olan, kalorifer kazanı, kombi, hidrofor asansör vb. ise teferruat olarak değerlendirilmez, binanın mütemmim cüz'ü olarak kabul edilir ve değerlemeye dahil edilir. Gayrimenkulle birlikte makine değerlemesi de yapılıyorsa menkullerin mükerrer değerlemesinin yapılmamasına dikkat edilmelidir.",
    "reportText": "Taşınmaz üzerinde Teferruat Beyanı bulunmaktadır.",
    "valuationMethod": "Değerleme işlemi teferruatlar dikkate alınmadan yapılmalı, raporda teferruat şerhine ilişkin bilgi verilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "70A",
    "status": "5957 Sayılı Hal Kanun Beyanı",
    "description": "5957 Saylı Sebze Ve Meyveler İle Yeterli Arz ve Talep Derinliği Bulunan Diğer Malların Ticaretinin Düzenlenmesi Hakkında Kanun'un 11. Maddesi uyarınca aynı maddede sayılan eylemlerin (pazarda malların bildirimsiz satışı, işyerinin mazeretsiz kapatılması, rekabete aykırı davranışlar, fatura düzenlenmemesi vb.) tespiti halinde satış işlemlerinin iptal edilip işyerlerinin geri alınacağına ilişkin olarak tapu kütüğüne şerh konulur ve bu şartların gerçekleşmesi durumunda taşınmazlar geri alınır. Satış iptali riskleri açıklanarak sadece Mevcut Durum Değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde 5957 Sayılı Kanunu Beyanı bulunmaktadır. Kanunun 11. maddesinde sayılan eylemlerin tespiti halinde satış işlemlerinin iptal edilip işyerlerinin geri alınacağına ilişkin hükümler yer almaktadır.",
    "valuationMethod": "Satış iptali riskleri açıklanarak sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "71A",
    "status": "Yap-İşlet-Devret Sözleşmesi",
    "description": "Taşınmaz üzerinde Yap-İşlet Devret Şerhi bulunması halinde sözleşme süresi içinde kullanım hakları işletmeci firmada olacaktır. Sözleşmede belirtilen sürenin sonunda ise işletmeci firmanın taşınmazın kullanımını taşınmaz malikine devir yapılması gerekmektedir. Şerhin etkisi dikkate alınmadan, kaldırılması koşuluyla değer takdir edilir ancak, şerhin kaldırılmama ihtimaline göre kalan işletme süresinin kullanım hakkı değeri (taşınmazın değerine olumsuz etkisi) ayrıca hesaplanarak raporda belirtilmelidir.",
    "reportText": "Taşınmaz üzerinde Yap-İşlet-Devret şerhi bulunmaktadır. Değer takdirinde şerhin etkisi dikkate alınmadan, kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Yap-İşlet-Devret Sözleşmesi bulunan taşınmazlar için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "72A",
    "status": "Terörle Mücadele Kanunu Devir Yasağı Şerhi",
    "description": "3713 sayılı Terörle Mücadele Kanunun 20/a Maddesi uyarınca, terör suçları nedeniyle gerçek veya tüzel kişiler ile kamu kurum ve kuruluşlarının uğradığı zararların tazmini amacıyla mahkeme tarafından şüpheli veya sanıklara ait taşınmazların devir ve temlikini veya bunlarla ilgili hak tesisini önlemek ya da tasarruf yetkisini kısıtlamak için şerh düşülmesine karar verilebilir. Kovuşturmaya yer olmadığına dair kararın kesinleşmesi halinde veya şerhin konulduğu tarihten itibaren iki yıl içinde, şerhin devamı yönünde hukuk mahkemesinden verilmiş ihtiyati haciz veya ihtiyati tedbir kararı ibraz edilmediği takdirde şerh kendiliğinden terkin edilir.",
    "reportText": "Taşınmaz üzerinde Terörle Mücadele Kanunun 20/a Maddesi uyarınca devir yasağı vardır. Şerhin kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla değer takdir edilmeli ve satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Mülkiyet Hakları ve Devir Yükümlülükleri",
    "code": "72B",
    "status": "Kayyum Beyanı",
    "description": "Mahkemeler ya da TMSF tarafından kayyum atanan kişilerin ve şirketlerin mülkiyetindeki taşınmazlar yetkili kayyumların onayı ile satılabilmektedir.",
    "reportText": "Taşınmaz üzerinde Kayyum atandığına dair beyan bulunmaktadır. Kayyum tarafından taşınmazın satışının yapılmasına izin verilmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Kayyum tarafından taşınmazın satışının yapılmasına izin verilmesi koşuluyla değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devir Engelleri Ve Yasakları",
    "code": "72C",
    "status": "El Koyma Kararı",
    "description": "Cumhuriyet Savcılığı veya mahkeme kararı ile taşınmaza el koyma kararı bulunması devir ve temlik işlemlerine engel oluşturmaktadır.",
    "reportText": "Taşınmaz üzerinde El Koyma Kararı bulunmakta olup kaldırılması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Şerhin kaldırılması koşuluyla değer takdir edilmeli ve satış kabiliyeti SATILAMAZ seçilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "73A",
    "status": "3303 Sayılı Taşkömürü Havzasındaki Taşınmaz Malların İktisabına Dair Kanun Beyanı",
    "description": "3303 Sayılı Taşkömürü Havzasındaki Taşınmaz Malların İktisabına Dair Kanuna göre tespit ve tescil edilen taşınmaz malların sahipleri; madenler üzerinde herhangi bir hak iddia edemezler, işletme ve arama hakları yoktur, maden işletmeciliği sebebiyle meydana gelen zararlardan dolayı bir hak ve tazminat talep edemezler. Madenleri işleten kurum veya tahsis sahiplerinin arama ve işletme hakları aynen devam eder. Kanuna göre tespit ve tescil edilen taşınmaz malların sahipleri, mülkiyet hakkına dayanarak bu konularda bir hak ve tazminat iddiasında bulunamazlar. Taşınmaz üzerinde maden arama faaliyetine başlanması halinde taşınmaz değer kaybedecektir.",
    "reportText": "Taşınmaz üzerinde 3303 Sayılı Taşkömürü Havzasındaki Taşınmaz Malların İktisabına Dair Kanun Beyanı bulunmaktadır. Gelecekte taşınmazın maden sahasına dönüşmeyeceği ve mevcut fonksiyonu ile kullanımına devam edileceği koşuluyla değer takdir edilmiştir. Taşınmaz üzerinde maden arama faaliyetine başlanması halinde taşınmaz değer kaybedecektir.",
    "valuationMethod": "Gelecekte taşınmazın maden sahasına dönüşmeyeceği ve mevcut fonksiyonu ile kullanımına devam edileceği kabulüyle, sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "İrtifak Hakları",
    "code": "73B",
    "status": "Maden Rezervi - Maden İşletme Ruhsatı Sahibi ve Taşınmaz Maliki Aynı Kişi",
    "description": "Madenler ve yeraltı kaynakları devlet mülkiyetinde olup çıkartılması ve işlenmesi devletten ücreti karşılığı alınacak süreli maden işletme ruhsatına ve ilgili mevzuata tabidir. İşletme ruhsat süresi boyunca ruhsat alanında kalan özel mülkiyet arazilerine madencilik faaliyeti için kamulaştırma yapılır. Parsel malikleri arazileri altındaki rezervlerde hak sahibi değildir. Ekspertiz çalışmasında maden rezervinin değeri dikkate alınmaz, sadece taşınmazın değerlemesi yapılır. Maden Rezervi Değerlemesi için ayrıca Ulusal Maden Kaynak ve Rezerv Raporlama Komisyonu (UMREK) lisanslı maden eksperlerine rapor hazırlatılması ve sondaj yapılarak rezerv miktarı ve kalitesinin tespit edilmesi gerekmektedir. Maden çıkarma ruhsatı verilmesi taşınmazın malikinin kullanım haklarını etkileyeceğinden bu durum değerlemede dikkate alınmalıdır.",
    "reportText": "Taşınmaz Maden Rezervi Alanında kalmaktadır. Maden işletme ruhsatı sahibi ve taşınmaz maliki aynı kişidir.",
    "valuationMethod": "Ekspertiz çalışmasında maden rezervinin değeri dikkate alınmaz, sadece taşınmazın üzerindeki binalar ile birlikte değerlemesi yapılır. Maden ruhsatının taşınmazın malikinin kullanım haklarını ne şekilde etkilediği belirlenmeli ve maden çıkarma işlemi sonucu oluşacak durum da dikkate alınarak değer takdir edilir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "İrtifak Hakları",
    "code": "73C",
    "status": "Maden Rezervi - Maden İşletme Ruhsatı Sahibi ve Taşınmaz Maliki Aynı Kişi Değil",
    "description": "Madenler ve yeraltı kaynakları devlet mülkiyetinde olup çıkartılması ve işlenmesi devletten ücreti karşılığı alınacak süreli maden işletme ruhsatına ve ilgili mevzuata tabidir. İşletme ruhsat süresi boyunca ruhsat alanında kalan özel mülkiyet arazilerine madencilik faaliyeti için kamulaştırma yapılır. Parsel malikleri arazileri altındaki rezervlerde hak sahibi değildir. Ekspertiz çalışmasında maden rezervinin değeri dikkate alınmaz, sadece taşınmazın değerlemesi yapılır. Maden Rezervi Değerlemesi için ayrıca Ulusal Maden Kaynak ve Rezerv Raporlama Komisyonu (UMREK) lisanslı maden eksperlerine rapor hazırlatılması ve sondaj yapılarak rezerv miktarı ve kalitesinin tespit edilmesi gerekmektedir. Maden çıkarma ruhsatı verilmesi taşınmazın malikinin kullanım haklarını etkileyeceğinden bu durum değerlemede dikkate alınmalıdır.",
    "reportText": "Taşınmaz Maden Rezervi Alanında kalmaktadır. Maden işletme ruhsatı sahibi ve taşınmaz maliki aynı kişi değildir.",
    "valuationMethod": "Ekspertiz çalışmasında maden rezervinin değeri dikkate alınmaz, sadece taşınmazın üzerindeki binalar ile birlikte değerlemesi yapılır. Maden ruhsatının taşınmazın malikinin kullanım haklarını ne şekilde etkilediği belirlenmeli ve maden çıkarma işlemi sonucu oluşacak durum da dikkate alınarak değer takdir edilir.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "Risksiz Durumlar",
    "code": "74A",
    "status": "Risk İçermeyen veya Geçerliliğini Yitirmiş, Geçerlilik Süresi Dolmuş Şerhler, Beyanlar",
    "description": "Takyidat belgesinde olmakla birlikte risk kodu bulunmayan ve taşınmaz için risk oluşturmayan takyidatlar için bu risk kodu kullanılmalı ve raporun önemli not kısmında detayları açıklanmalıdır. (Örneğin, ön alım hakkından feragat) Süresinin dolması veya şerh/beyan konusu olan durumun ortadan kalkması nedeniyle geçerliliğini yitirmiş şerhler tapuda terkin edilmemiş ise bu durum raporda açıklanmalıdır. (Örnek: Kira şerhinin süresinin dolması, davanın sonuçlanması vb.)",
    "reportText": "Taşınmaz üzerinde risk içermeyen ya da geçerliliğini yitirmiş, süresi dolmuş şerh/beyan bulunmaktadır. Değer takdirinde dikkate alınmamıştır.",
    "valuationMethod": "Şerh veya beyan raporda açıklanmalı; risk içermediği, geçerliliğini yitirdiği, süresinin dolduğu, belirtilerek piyasa koşullarına göre Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "75A",
    "status": "Değer Artışı Payı - Değer Artış Bedeli Ödenmiş ve İmar Planı Kesinleşmiş",
    "description": "İmar Planı Değişikliğine Dair Değer Artış Payı Hakkında Yönetmelik kapsamında maliklerin talebiyle yapılan imar durumu değişikliği nedeniyle değer artışı gören taşınmazların artan değerinin tamamı değer artış payına konu edilerek ilgili idareye ödenmesi gerekir. Değer artış payı, en geç taşınmazın ilk satışında veya inşaat ruhsatının alımı aşamasında önce Çevre ve Şehircilik Bakanlığının muhasebe birimi hesabına ödenir. Değer artış payının ödenmemesi halinde, imar planı değişikliği yapılan taşınmaz için hiçbir koşulda satış izni verilmez, yapı ruhsatı düzenlenemez. Taşınmazın ilgili yönetmelik kapsamında değer artışına konu olduğunun tespit edilmesi halinde öncelikle değer artış bedelinin ödenip ödenmediğine dair ilgili resmi kurumlarda inceleme yapılmalıdır. Değer artış payının ödendiğinin tespit edilmesi halinde kesinleşmiş imar durumuna göre değer takdir edilir.",
    "reportText": "Maliklerin talebine bağlı imar durumu değişikliği nedeniyle konu taşınmazın Değer Artış Payı Hakkında Yönetmelik kapsamında olduğu tespit edilmiştir. İlgili yönetmelik gereği değer artış payı tutarının ödendiği ve yeni imar planının kesinleştiği belirlendiğinden kesinleşen imar durumuna göre değer takdir edilmiştir.",
    "valuationMethod": "Değer artış bedelinin ödendiği belgelerle tespit edilmiş ise yeni imar durumuna göre Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "75B",
    "status": "Değer Artışı Payı - Değer Artış Bedeli Ödenmemiş ve/veya İmar Planı Kesinleşmemiş",
    "description": "İmar Planı Değişikliğine Dair Değer Artış Payı Hakkında Yönetmelik kapsamında maliklerin talebiyle yapılan imar durumu değişikliği nedeniyle değer artışı gören taşınmazların artan değerinin tamamı değer artış payına konu edilerek ilgili idareye ödenmesi gerekir. Değer artış payı, en geç taşınmazın ilk satışında veya inşaat ruhsatının alımı aşamasında önce Çevre ve Şehircilik Bakanlığının muhasebe birimi hesabına ödenir. Değer artış payının ödenmemesi halinde, imar planı değişikliği yapılan taşınmaz için hiçbir koşulda satış izni verilmez, yapı ruhsatı düzenlenemez. Taşınmazın ilgili yönetmelik kapsamında değer artışına konu olduğunun tespit edilmesi halinde öncelikle değer artış bedelinin ödenip ödenmediğine dair ilgili resmi kurumlarda inceleme yapılmalıdır. Değer artış payının ödenmemiş olduğunun belirlenmesi halinde -taşınmaz borçla yüklü geleceğinden- bu durum dikkate alınarak değer takdir edilir, değer artışı dahil değeri ise bilgi amaçlı olarak belirlenir. İmar planları kesinleşmemiş ise önceki imarına göre Yasal ve Mevcut Durum Değeri takdir edilmeli, kesinleşmeyen imar durumuna göre Bilgi Amaçlı Değeri ayrıca belirtilmelidir.",
    "reportText": "Maliklerin talebine bağlı imar durumu değişikliği nedeniyle konu taşınmazın Değer Artış Payı Hakkında Yönetmelik kapsamında olduğu tespit edilmiştir. İlgili yönetmelik gereği değer artış payı tutarı ödenmediğinden ve/veya yeni imar planı kesinleşmediğinden yasal ve mevcut durum değerleri değer artış payı düşülerek takdir edilmiş olup yeni imar koşullarına göre değer artışı dahil değeri ise bilgi amaçlı olarak belirlemiştir.",
    "valuationMethod": "Değer artış bedeli ödenmemiş veya yeni imar durumu kesinleşmemiş ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Devre mülkler",
    "code": "76A",
    "status": "Devre Mülk - Tüm Devreler Rapora Konu ve Fiziken Bağımsız Olarak Kullanılabilir",
    "description": "Devre mülk, bir gayrimenkulün kullanımının yılın çeşitli zamanlarında farklı maliklere bırakıldığı ortaklık usulü mülkiyet hakkıdır. Her tapu sahibi yılın sözleşme ile belirlenen dönemlerinde kullanım hakkına sahip olur. Hisse oranları ile devre mülkün sağlayacağı kullanma hakkı orantılı olmalıdır. Devre mülk sistemi kurulurken gayrimenkulün yönetimine (devir teslim usulleri, kullanım şartları, bakım masrafları bakım dönemi gibi hususlara) ilişkin bir sözleşme hazırlanarak tapu siciline şerh edilecek ve malikler bu sözleşme ile bağlı olacaklardır. Devre mülk sözleşmesi ve tapu kayıtları incelenmeli, bakım, onarım, işletme giderleri için ödenecek aidat rakamları ve fiziken bir tesisten bağımsız kullanım imkanı bulunup bulunmadığı raporda belirtilmelidir. Kullanım hakkına sahip olunan aylara göre devre mülk dönem değeri farklılık göstermekte olup, aynı taşınmazın dönemleri için ayrı ayrı değer takdir edilerek raporun açıklamalarında ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz devre mülk tapulu olup tüm dönemlerin toplam değeri takdir edilmiştir. Tüm dönemler ve malikler üzerinde ipotek tesis edilmelidir.",
    "valuationMethod": "Devre mülkün tüm dönemleri rapora konu ve fiziken bağımsız olarak kullanılabiliyorsa Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Devre mülkler",
    "code": "76B",
    "status": "Devre Mülk - Tüm Devreler Rapora Konu ve Fiziken Bağımsız Olarak Kullanılamaz",
    "description": "Devre mülk, bir gayrimenkulün kullanımının yılın çeşitli zamanlarında farklı maliklere bırakıldığı ortaklık usulü mülkiyet hakkıdır. Her tapu sahibi yılın sözleşme ile belirlenen dönemlerinde kullanım hakkına sahip olur. Hisse oranları ile devre mülkün sağlayacağı kullanma hakkı orantılı olmalıdır. Devre mülk sistemi kurulurken gayrimenkulün yönetimine (devir teslim usulleri, kullanım şartları, bakım masrafları bakım dönemi gibi hususlara) ilişkin bir sözleşme hazırlanarak tapu siciline şerh edilecek ve malikler bu sözleşme ile bağlı olacaklardır. Devre mülk sözleşmesi ve tapu kayıtları incelenmeli, bakım, onarım, işletme giderleri için ödenecek aidat rakamları ve fiziken bir tesisten bağımsız kullanım imkanı bulunup bulunmadığı raporda belirtilmelidir. Kullanım hakkına sahip olunan aylara göre devre mülk dönem değeri farklılık göstermekte olup, aynı taşınmazın dönemleri için ayrı ayrı değer takdir edilerek raporun açıklamalarında ayrıca belirtilmelidir. Taşınmazın fiziken bağımsız kullanım imkanı yoksa sadece mevcut durum değeri takdir edilir.",
    "reportText": "Taşınmaz devre mülk tapulu olup fiziken bağımsız kullanılmadığından mevcut durum değeri takdir edilmiştir. Raporda tüm dönemlerin toplam değeri takdir edilmiştir; tüm dönemler ve malikler üzerinde ipotek tesis edilmelidir.",
    "valuationMethod": "Devre mülkün tüm dönemleri rapora konu ve fiziken bağımsız kullanım imkanı yoksa sadece Mevcut Durum Değeri takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Devre mülkler",
    "code": "76C",
    "status": "Devre Mülk - Tüm Devreler Rapora Konu Değil",
    "description": "Devre mülk, bir gayrimenkulün kullanımının yılın çeşitli zamanlarında farklı maliklere bırakıldığı ortaklık usulü mülkiyet hakkıdır. Tüm devreleri rapora konu olmayan devre mülklere bilgi amaçlı değeri takdir edilir. Devre mülk sözleşmesi ve tapu kayıtları incelenmeli, bakım, onarım, işletme giderleri için ödenecek aidat rakamları ve fiziken bir tesisten bağımsız kullanım imkanı bulunup bulunmadığı raporda belirtilmelidir. Kullanım hakkına sahip olunan aylara göre devre mülk dönem değeri farklılık göstermekte olup, aynı taşınmazın dönemleri için ayrı ayrı değer takdir edilerek raporun açıklamalarında ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz devre mülk tapulu olup tüm dönemleri rapora konu değildir. Raporda tüm dönemlerin toplamı için bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Devre mülkün tüm dönemleri rapora konu değilse sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "77A",
    "status": "Endüstri Bölgeleri - İmar Düzenlemeleri Tamamlanmış",
    "description": "4737 sayılı Endüstri Bölgeleri Kanunu ve ilgili yönetmeliği, Endüstri Bölgelerinin, Münferit Yatırım Yerlerinin ve Özel Endüstri Bölgelerinin kurulması, yönetilmesi ve faaliyete geçmesine ilişkin usul ve esasları düzenlemektedir. Endüstri bölgesi olarak ilan edilen alanlar yatırım için gerekli olan sosyal, idari, lojistik, ticari vb. faaliyetler haricinde hiçbir şekilde başka amaçlarla kullanılamaz. Bu bölgelerde kamulaştırma, alt yatırımcılara irtifak hakkı ile devir, kiralama ve Yönetici şirket mülkiyetindeki taşınmazların satışı gibi uygulamalar yapılacak olup durum özelinde değerlendirme yapılmalıdır. Yatırım taahhüdünün yerine getirilmemesi halinde tahsis iptali riski bulunduğundan taahhüt sürelerine, tutarlarına ve gerçekleşmelere ayrıca dikkat edilmelidir.",
    "reportText": "Taşınmaz Endüstri Bölgeleri Kanunu kapsamında olup imar düzenlemeleri tamamlanmıştır.",
    "valuationMethod": "Yönetici Şirketin mülkiyetinde olup satışına engel durumu bulunmayan, imar düzenlemesi yapılmış taşınmazlar için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "77B",
    "status": "Endüstri Bölgeleri - İmar Düzenlemeleri Yapılmamış",
    "description": "4737 sayılı Endüstri Bölgeleri Kanunu ve ilgili yönetmeliği, Endüstri Bölgelerinin, Münferit Yatırım Yerlerinin ve Özel Endüstri Bölgelerinin kurulması, yönetilmesi ve faaliyete geçmesine ilişkin usul ve esasları düzenlemektedir. Endüstri bölgesi olarak ilan edilen alanlar yatırım için gerekli olan sosyal, idari, lojistik, ticari vb. faaliyetler haricinde hiçbir şekilde başka amaçlarla kullanılamaz. Bu bölgelerde kamulaştırma, alt yatırımcılara irtifak hakkı ile devir, kiralama ve Yönetici şirket mülkiyetindeki taşınmazların satışı gibi uygulamalar yapılacak olup durum özelinde değerlendirme yapılmalıdır. Yatırım taahhüdünün yerine getirilmemesi halinde tahsis iptali riski bulunduğundan taahhüt sürelerine, tutarlarına ve gerçekleşmelere ayrıca dikkat edilmelidir. İmar düzenlemesi tamamlanmamış taşınmazlar için mevcut durum değeri takdir edilir.",
    "reportText": "Taşınmaz Endüstri Bölgeleri Kanunu kapsamında olup imar düzenlemeleri tamamlanmamıştır.",
    "valuationMethod": "Yönetici Şirketin mülkiyetinde olup satışına engel durumu bulunmayan, imar düzenlemesi yapılmamış taşınmazlar için Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Taşınmaz Borçları",
    "code": "78A",
    "status": "Kooperatif Mülkiyetindeki Taşınmaz",
    "description": "Kooperatif mülkiyetinde olan ve hak sahiplerine tapu devri yapılacak taşınmazlarda kat irtifakı kurulmuş ve her üyenin hak sahibi olduğu bağımsız bölüm belirlenmiş olmalı ve üyelerin kooperatife borcu bulunmamalıdır. Üyeler borçlarını ödemeden mülkiyet devri yapılmamaktadır. Taşınmaz Kooperatif tüzel kişiliğinin teminatı olarak alınacak ise kooperatif üyelerinin hak sahibi olmadığı ve üyelere devir yapılmayacağı ayrıca belgelenmelidir.",
    "reportText": "Taşınmaz kooperatif mülkiyetindedir. Hak sahiplerinin kooperatife borçlarının ödenmesi ve devrini engelleyecek bir husus veya işgal bulunmaması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Konu taşınmazın kooperatife borçlarının ödenmesi ve devrini engelleyecek bir husus veya işgal bulunmaması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "3. Kişilere ve Kamu Yararına Tahsisili taşınmazlar",
    "code": "79A",
    "status": "Umumi Hizmete Ayrılmış Taşınmaz",
    "description": "Kamu kurum ve kuruluşları, belediyeler, üniversite vakıfları vb. mülkiyetindeki taşınmazlar; kamu yararına tahsis edilmiş ise ipotekli dahi olsa icra satışı istenememektedir. Ayrıca, 3194 sayılı İmar Kanununun 11.maddesine göre meydan, yol, su yolu, park, yeşil saha, otopark, toplu taşıma istasyonu ve terminal vb. amaçlarla kullanılmak üzere umumi hizmetlere ayrılan alanlar belediye ya da özel idare tarafından satılamaz ve bu husus Tapu siciline işlenir. Kamu yararına tahsisli taşınmazlara kamu yararına kullanım devam ettiği sürece sadece BİLGİ AMAÇLI DEĞERİ belirlenir.",
    "reportText": "Taşınmaz İmar Kanununa göre umumi hizmete ayrılmış alanda kalmaktadır.",
    "valuationMethod": "Umumi hizmete ayrılmış taşınmazlara, tapuda şerh olup olmamasına bakılmaksızın;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "3. Kişilere ve Kamu Yararına Tahsisili taşınmazlar",
    "code": "79B",
    "status": "3. Kişi/Kurum Kullanımına Tahsis Edilmiş Taşınmaz - Kullanım Hakları Devredilecek",
    "description": "Özel ya da kamu kurum ve kuruluşları mülkiyetindeyken Tapu Siciline şerh edilmeden sözleşme ile ya da sözleşmesiz olarak fiilen 3. kişilerin kullanımına bırakılan taşınmazların mülkiyet el değiştirdiğinde satış kabiliyetleri ve kullanım imkanları sorgulanmalıdır. Bu taşınmazların el değiştirdikten sonra yeni malik tarafından kullanılması söz konusu ve piyasada talep görebilir durumda ise zilliyedin de devredilmesi şartıyla değer takdir edilebilir. (Örneğin vakıf kullanımına tahsis edilmiş, vakfedilmiş dükkanlar.)",
    "reportText": "Taşınmaz fiilen 3. kişilerin/kurumların kullanımına tahsis edilmiş olup mülkiyet devri ile birlikte kullanımın da devredilmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "3. Kişi/Kurum Kullanımına Tahsis Edilmiş Taşınmazlara;",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "3. Kişilere ve Kamu Yararına Tahsisili taşınmazlar",
    "code": "79C",
    "status": "3. Kişi/Kurum Kullanımına Bırakılmış Tahsis Edilmiş Taşınmaz - Kullanımı Kısıtlı",
    "description": "Özel ya da kamu kurum ve kuruluşları mülkiyetindeyken Tapu Siciline şerh edilmeden sözleşme ile ya da sözleşmesiz olarak fiilen 3. kişilerin kullanımına bırakılan taşınmazların mülkiyet el değiştirdiğinde satış kabiliyetleri ve kullanım imkanları sorgulanmalıdır. Bu taşınmazların el değiştirdikten sonra yeni malik tarafından kullanılma imkanı yoksa sadece Bilgi Amaçlı Değeri takdir edilir. (Örneğin devlet okulu, belediye hizmet binası, semt kütüphanesi, aile sağlığı merkezi, cami vb. kamu kullanımına bırakılmış taşınmazlar.)",
    "reportText": "Taşınmaz fiilen 3. kişilerin/kurumların kullanımına tahsis edilmiş olup kullanım imkanları ve satış kabiliyeti kısıtlıdır.",
    "valuationMethod": "3. Kişi/Kurum Kullanımına Tahsis Edilmiş Taşınmazlara;",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "80A",
    "status": "Yatırım Teşvik ve Düzenli Kentleşme Amacıyla Tahsis Edilen Taşınmaz - Tahsis Koşulları Gerçekleştirilmiş",
    "description": "Yatırımları teşvik düzenli kentleşmeyi sağlamak vb. amacıyla -3573 sayılı Zeytinciliğin Islahı, 5084 Sayılı Yatırımların Teşviki, 5393 Sayılı Belediye Kanunu vb.- muhtelif kanunlara istinaden yatırımcılara, kullanıcılara bedelli veya bedelsiz tahsisler yapılabilmektedir. Tahsisler hak sahiplerine, tahsis şartlarına göre belirtilen sürelerde ve tutarda yatırım yapılması, inşaatların tamamlanması, belirli sayıda çalışan istihdam edilmesi veya belirli sürelerle devirlerin kısıtlanması gibi yükümlülükler getirilmekte olup, yükümlülüklerin yerine getirilmemesi halinde bedelsiz tahsislerin bedelliye dönüştürülmesi, tahsislerin iptal edilmesi gibi yaptırımlar uygulanabilmektedir.",
    "reportText": "Taşınmazın mülkiyeti tahsis yoluyla edinilmiş olup, tahsis şartları gerçekleşmiştir.",
    "valuationMethod": "Tahsis şartları sorgulanmalı, gerçekleşmiş ise Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "80B",
    "status": "Yatırım Teşvik ve Düzenli Kentleşme Amacıyla Tahsis Edilen Taşınmaz - Tahsis Koşulları Gerçekleştirilmemiş",
    "description": "Yatırımları teşvik düzenli kentleşmeyi sağlamak vb. amacıyla -3573 sayılı Zeytinciliğin Islahı, 5084 Sayılı Yatırımların Teşviki, 5393 Sayılı Belediye Kanunu vb.- muhtelif kanunlara istinaden yatırımcılara, kullanıcılara bedelli veya bedelsiz tahsisler yapılabilmektedir. Tahsisler hak sahiplerine, tahsis şartlarına göre belirtilen sürelerde ve tutarda yatırım yapılması, inşaatların tamamlanması, belirli sayıda çalışan istihdam edilmesi veya belirli sürelerle devirlerin kısıtlanması gibi yükümlülükler getirilmekte olup, yükümlülüklerin yerine getirilmemesi halinde bedelsiz tahsislerin bedelliye dönüştürülmesi, tahsislerin iptal edilmesi gibi yaptırımlar uygulanabilmektedir.",
    "reportText": "Taşınmazın mülkiyeti tahsis yoluyla edinilmiş olup, tahsis şartları gerçekleşmemiş/belirsizdir. Tahsisin iptal edilme riski ayrıca değerlendirilmelidir.",
    "valuationMethod": "Tahsis şartları sorgulanmalı, gerçekleşmemiş ise sadece Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "M",
    "isNew": "Yeni"
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "80C",
    "status": "4046 Sayılı Özelleştirme Uygulamaları Hakkında Kanunu Beyanı",
    "description": "4046 Sayılı Özelleştirme Uygulamaları Hakkında Kanunun ile tahsis edilmiş ayni haklar kanunun 2/i,15,19/E vb. maddelerine istinaden Tapu Sicilinde beyan edilmektedir. Beyanlar kamu kuruluşlarına devir yapılmaması, işletme haklarının verilmesi veya kiralanması ve mülkiyetin devri dışındaki benzeri diğer yöntemlerle özelleştirilmesi, hak ve yükümlülüklerin devri gibi hususları içermektedir. Beyanın özelliğine ve sonuçlarına göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz üzerinde 4046 sayılı Özelleştirme Uygulamaları Hakkında Kanun beyanı bulunmaktadır.",
    "valuationMethod": "Eksper tarafından özelleştirme bedeli, taksitli satış ise ödeme süresi ve koşulları, özelleştirme bedelinin tesisteki menkulleri kapsayıp kapsamadığı tespit edilerek raporda açıklanmalıdır. Özelleştirme uygulamaları hakkında kanunu beyanı varsa beyanın kapsamına sözleşme içeriğine ve taşınmaza etkisine göre değer takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101A",
    "status": "İnşa Halinde Bina - Binanın Tamamı Rapora Konu",
    "description": "İnşaat halindeki binaların ekspertiz tarihindeki inşa seviyeleri, Halkbank İnşaat Seviyesi Tabloları kullanılarak belirlenir. Birden fazla bloktan oluşan inşaat seviyeli toplu değerleme veya (kat irtifakı kurulmamış olsa da) proje değerleme çalışmalarında sitüasyon tabloları blok/bağımsız bölüm bazında oluşturulmalıdır. Özel nitelikli (yüksek yapılar, data center gibi çok yüksek maliyetli, özel teknoloji ile inşa edilen binalar vb.) inşaatlarda, standart tablolarının yeterli görülmemesi halinde, inşaatın niteliğine ve özelliğine uygun işe özel tablolar kullanarak inşa seviyesi tespit edilebilir. Proje değerlemeleri hariç seviye tespiti yapılırken sadece imalata dönüşmüş işler dikkate alınmalı, şantiyede imalat bekleyen (ihzaratı yapılan) malzemeler seviye tespitinde hesaba katılmamalıdır. Ek maliyet gerektiren derin kazı, ankraj, kazık temel vb. durumlarda da Halkbank İnşaat Seviyesi Tabloları kullanılmalı, ek maliyete konu imalatlar ayrıca açıklanarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz inşaat halindedir. Binanın inşa seviyesine göre yasal ve mevcut değerleri takdir edilmiş, inşaatın tamamlanması durumundaki tahmini değeri bilgi amaçlı verilmiştir.",
    "valuationMethod": "İnşa halindeki ruhsatlı binalarda (ruhsat süresi dolmuş olsa dahi, ruhsat yenileme imkânı varsa) taşınmazların maliyet yaklaşımına göre değeri aşağıdaki formüller ile hesaplanmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101B",
    "status": "İnşa Halinde Bağımsız Bölüm - Betonarme İnşaatı, Dış Cephe, Bina Girişi, Merdivenler ve Daire Dış Kapısı Tamamlanmış",
    "description": "İnşaat halindeki binaların ekspertiz tarihindeki inşa seviyeleri, Halkbank İnşaat Seviyesi Tabloları kullanılarak belirlenir. Bilgi amaçlı olarak (yasal ve mevcut alanlara göre ayrı ayrı) bitmiş durum değeri ve bitirime maliyetleri ayrıca raporda belirtilmelidir. İnşa halindeki binalar tamamlanmama riski taşır ve satış kabiliyetleri daha kısıtlıdır. Binanın betonarme kısımları (tüm taşıyıcı sistemin inşaatı), dış cephesi (sıva, boya, pencere doğramaları vb.), bina girişi, merdiven ve merdiven holleri ve daire dış kapısı tamamlanmış ise, bağımsız bölümün inşa seviyesine esas alınır.",
    "reportText": "Taşınmaz inşaat halindedir. Bağımsız bölümün inşa seviyesine göre yasal ve mevcut değerleri takdir edilmiş, inşaatın tamamlanması durumundaki tahmini değeri bilgi amaçlı verilmiştir.",
    "valuationMethod": "Betonarme inşaatı, dış cephe, bina girişi, merdivenler ve daire dış kapısı tamamlanmış bağımsız bölümün değerlemesi yapılırken,",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101C",
    "status": "İnşa Halinde Bağımsız Bölüm - Betonarme İnşaatı Bitmiş, Dış Cephe, Bina Girişi, Merdivenler ve Daire Dış Kapısı Tamamlanmamış",
    "description": "İnşaat halindeki binaların ekspertiz tarihindeki inşa seviyeleri, Halkbank İnşaat Seviyesi Tabloları kullanılarak belirlenir. Bilgi amaçlı olarak (yasal ve mevcut alanlara göre ayrı ayrı) bitmiş durum değeri ve bitirime maliyetleri ayrıca raporda belirtilmelidir. İnşa halindeki binalar tamamlanmama riski taşır ve satış kabiliyetleri daha kısıtlıdır. Binanın betonarme kısımları dış cephe, bina girişi, merdivenler ve daire dış kapısı tamamlanmamış ise, Bağımsız bölümün inşa seviyesi ile blok genelindeki inşa seviyesinden daha düşük olanı esas alınır. (Örnek: Bağımsız bölümün inşa seviyesi %70, binanın genel inşa seviyesi %40 ise, Bağımsız bölümün inşa seviyesi raporda %70 olarak belirtilir %40 inşa seviyesine göre değer hesaplaması yapılır.)",
    "reportText": "Taşınmaz inşaat halindedir. Binanın genel inşa seviyesine göre yasal ve mevcut değerleri takdir edilmiş, inşaatın tamamlanması durumundaki tahmini değeri bilgi amaçlı verilmiştir.",
    "valuationMethod": "Betonarme inşaatı bitmiş ancak, dış cephe, bina girişi, merdivenler ve daire dış kapısı tamamlanmamış bağımsız bölümün değerlemesi yapılırken, binanın genel inşa seviyesi ile bağımsız bölümün inşa seviyesi ayrı ayrı hesaplanır ve düşük olana göre değer takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101D",
    "status": "İnşa Halinde Kullanılabilir Durumdaki Zemin Kat Dükkan",
    "description": "Sahibinin iç dekorasyonu kendi imkanlarıyla tamamlayarak binadan bağımsız olarak kullanmaya başlayabileceği, elektrik, temiz ve pis su bağlantıları tamamlanmış zemin kotunda yer alan dükkân vasıflı bağımsız bölümler dışarıdan doğrudan erişimle kullanılabilir özellikte ise ve binanın tamamının betonarmesi tamamlanmış ise dükkanın kendi inşa seviyesine göre (binanın genel inşa seviyesi dikkate alınmadan) değer takdir edilebilir.",
    "reportText": "Taşınmaz inşaat halinde dükkandır. İç dekorasyonu tamamlanıp dışarıdan doğrudan erişimle binadan bağımsız olarak kullanma imkanı olması nedeniyle dükkanın kendi inşa seviyesine göre değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu zemin kotundaki her dükkan için kullanılmaz. Sadece sahibinin iç dekorasyonunu tamamlayarak binadan bağımsız olarak kullanmaya başlayabileceği, elektrik, temiz ve pis su bağlantıları tamamlanmış dışarıdan doğrudan erişimi bulunan zemin kotunda yer alan ticari olarak kullanılabilir durumdaki dükkanlar için istisnai olarak bu risk kodu seçilmelidir. Binanın genel inşa seviyesi ile çevre düzenlemesi dükkanın kullanımına izin verecek seviyede olmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101E",
    "status": "Henüz İnşa Edilmemiş/Yıkılmış Bağımsız Bölüm (Kentsel Dönüşüm Kredileri Hariç)",
    "description": "Kat irtifakı, yapı ruhsatı alındıktan sonra, bağımsız bölümlerin kaba inşaatının tamamlanmasından önce kurulabilmektedir. İnşaatları subasman seviyesine gelip temel üstü ruhsatı alınmayan binaların yapı ruhsatı alınmış dahi olsa yapılaşma için müktesep hakkı bulunmamaktadır. Henüz inşa edilmemiş ya da yıkılmış bağımsız bölümlerin tamamlanmama riski taşıdığından (parselin tamamı rapora konu değilse) arsa payı ve tahmini bitmiş durum değerleri bilgi amaçlı olarak takdir edilir. Yatay kat irtifakı kurulmuş, yapı ruhsatı alınmış (ruhsat süresi dolmuş olup ruhsat yenilemesi mümkün olanlar dâhil), yolları, altyapısı tamamlanmış durumda, yatay kat irtifakına ayrılmış alan üzerine malik tarafından diğer bağımsız bölüm maliklerine bağlı olmadan, müstakilen bina inşa edilmesine izin verilen ve pazarda alıcı bulabilecek durumdaki taşınmazların, arsa payı değerleri Yasal ve Mevcut Durum Değeri olarak takdir edilebilir. Yatay kat irtifakına ayrılmış alan üzerine malik tarafından diğer bağımsız bölüm maliklerine bağlı olmadan kendi başına inşaat yapma imkanı/izni bulunmayan, altyapısı tamamlanmamış veya satışı halinde pazarda alıcı bulma imkânı kısıtlı taşınmazlara sadece mevcut durum değeri takdir edilir. Kat irtifakı kurulmuş olup inşaatı başlamamış ya da üzerindeki bina yıkılmış arsaların durumu güncel imar koşullarına ve yapılaşma şartlarına göre değerlendirilir ve tüm bağımsız bölümler birlikte teminat alınıyor ise arsa payları toplamına Yasal ve Mevcut Değer takdir edilir; bağımsız bölümler kısmen rapora konu ve düşey kat irtifakı varsa (arsa payları için) tahmini bitmiş durum değeri bilgi amaçlı olarak takdir edilir.",
    "reportText": "Taşınmaz henüz inşa edilmemiştir. Tahmini bitmiş durum değeri bilgi amaçlı olarak verilmiştir.",
    "valuationMethod": "Henüz inşa edilmemiş ya da yıkılmış bağımsız bölümler için,",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101H",
    "status": "Shell And Core Olarak Satışa Sunulan Taşınmaz",
    "description": "Shell and Core (sadece dış cephe, ortak alanlar ve ortak tesisat tamamlanarak satışa sunulan) inşaatlar ve satış politikasına göre son kullanıcıya natamam satışı yapılan dükkân, büro, ofis ve villalarda sitedeki/binadaki emsaller de aynı şekilde natamam satılmakta ise, raporda bu durum açıklanmalı ve Halkbank inşaat seviyesi tablolarından Shell&Core Seviye Tablosu kullanılarak inşa seviyesi belirlenmelidir. Bilgi amaçlı olarak (yasal ve mevcut alanlara göre ayrı ayrı) bitmiş durum değeri ve bitirime maliyetleri ayrıca raporda belirtilmelidir.",
    "reportText": "Taşınmaz Shell and Core (sadece dış cephe ve ortak alanlar tamamlanarak) şeklinde pazarlanmaktadır. Satışa dâhil olmayan inşaat kalemleri düşülerek hazırlanan inşa seviyesi tablosuna göre inşa seviyesi ve yasal, mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu her inşaatta kullanılmaz. Satış politikasına göre shell and core şeklinde satılan lüks konut, ofis vb. için istisnai olarak kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101I",
    "status": "İnşaatı Uzun Süre Durmuş Bina - Binanın Tamamı",
    "description": "Uzun süre inşaatı durmuş binaların talepleri kısıtlıdır. Ayrıca bu binaların taşıyıcı sistemleri genellikle güncel deprem yönetmelikleriyle uyumsuz olduğundan ve uzun süre tamamlanmaması nedeniyle zarar gördüğünden belediyeden inşaatın tamamlanması için yapı ruhsatı yenilemesi ve inşaata devam izinlerini alması güçtür. Uzun süre inşaatı durmuş binaların tamamı rapora konu ise yapı değerleme dışı tutularak arsa değeri takdir edilir.",
    "reportText": "Parsel üzerindeki binanın inşaatı uzun süre durmuştur. Güncel deprem yönetmeliklerine göre binanın statik durumu incelenmeli ve ruhsat yenilemesi yapılmalıdır. Sadece arsası için yasal ve mevcut durum değeri takdir edilmiş olup yıkım maliyetleri dikkate alınmamıştır.",
    "valuationMethod": "6 aydan uzun süre inşaatı durmuş binaların tamamı rapora konu ise; yapı değerleme dışı tutularak arsası için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101J",
    "status": "İnşaatı Uzun Süre Durmuş Bina - Bağımsız Bölüm",
    "description": "Uzun süre inşaatı durmuş binaların talepleri kısıtlıdır. Ayrıca bu binaların taşıyıcı sistemleri genellikle güncel deprem yönetmelikleriyle uyumsuz olduğundan ve uzun süre tamamlanmaması nedeniyle zarar gördüğünden belediyeden inşaatın tamamlanması için yapı ruhsatı yenilemesi ve inşaata devam izinlerini alması güçtür. Uzun süre inşaatı durmuş yapıların bağımsız bölümlerinin bir kısmının ekspertizi yapılıyor ise bilgi amaçlı olarak arsa payı değeri takdir edilir.",
    "reportText": "Parsel üzerindeki binanın inşaatı uzun süre durmuştur. Güncel deprem yönetmeliklerine göre binanın statik durumu incelenmeli ve ruhsat yenilemesi yapılmalıdır. Bağımsız bölüm için Bilgi Amaçlı Değeri takdir edilmiş olup yıkım maliyetleri dikkate alınmamıştır.",
    "valuationMethod": "6 aydan uzun süre inşaatı durmuş binalardaki Bağımsız Bölümlerin bir kısmı rapora konu ise arsa payı için Bilgi Amaçlı Değeri verilmelidir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101K",
    "status": "Yapı Denetim Firmasının/Şantiye Şefinin İstifa Ettiğine İlişkin Tutanak",
    "description": "Bina inşaat halindeyken yapı denetim firması ya da şantiye şefi istifa etmiş ise, binanın yapı ruhsatına, onaylı projelerine ve teknik gerekliliklere uygun inşa edilmesine, inşaatın devamına izin verilmesine ilişkin hususlar araştırılmalı ve değer takdir ederken dikkate alınmalıdır. Yapı Denetim onayı almadan yapı kullanma izin belgesi alınamamaktadır. Yapı kullanma izin belgesi olmayan binalara ise su elektrik ve doğalgaz aboneliği verilmemektedir.",
    "reportText": "İnşa halindeki binada Yapı Denetim Firmasının/Şantiye Şefinin istifa ettiğine dair tutanak bulunmaktadır. Binanın yapı ruhsatına ve projelerine uygun şekilde tamamlanması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Binanın yapı ruhsatına ve projelerine uygun şekilde tamamlanması koşuluyla Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101L",
    "status": "Kısmen İnşa Edilen Binadaki Tamamlanmış ve Kullanılan Bağımsız Bölümler",
    "description": "Kısmen inşa edilen binalardaki inşaatı %100 tamamlanan, su elektrik ve doğalgaz abonelikleri tesis edilmiş ve kullanılabilir durumdaki bağımsız bölümler için istisnai olarak Yasal ve Mevcut Durum Değeri takdir edilebilir. Tamamı inşa edilmeyen yapılarda arsa payı düzetmesi gerekebilir, mülkiyet sorunları yaşanabilir ve bina inşaatı tamamlanmadığından tamamlanan kısımların talebi düşebilir. Değerleme aşamasında bu hususlar göz önünde bulundurulmalıdır. Binanın tamamı rapora konu ise inşa edilmemiş kısımların arsa payı değerleri (şerefiye hariç) takdir edilebilir.",
    "reportText": "Taşınmaz kat irtifaklı/mülkiyetli olup kısmen inşa edilmiştir. İnşaatı tamamlanmış ve kullanılabilir durumdaki bağımsız bölümler dikkate alınarak değerleme yapılmıştır.",
    "valuationMethod": "Mahallinde %100 inşa edilmiş ve kullanılabilir durumdaki bağımsız bölümler için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "101M",
    "status": "Onaylı Projesine Göre Küçük İnşa Edilen Taşınmaz",
    "description": "Onaylı projesine göre küçük (eksik alanlı) inşa edilen (örneğin projesinde 100 m2 daire yerinde 80 m2 inşa edilmiş ya da fabrika kısmı inşa edilip projesindeki idari binası kısmı inşa edilmemiş) binalarda mahallinde inşa edilmiş alan ve inşa seviyesi dikkate alınarak değerleme yapılmalıdır. Yapı ruhsatı ve onaylı projelerinde bulunan ancak mahallinde inşa edilmemiş kısımlar (proje değerlemeleri hariç) değerlemede dikkate alınmaz.",
    "reportText": "Taşınmaz yapı ruhsatı ve onaylı projesindeki alandan daha küçük inşa edilmiştir. Mahallinde inşa edilmiş alan dikkate alınarak değerleme yapılmıştır.",
    "valuationMethod": "Bu risk kodu sadece projesine göre küçük (eksik alanlı) inşa edilmiş binalar ve bağımsız bölümler içindir. İnşaat çalışmaları devam eden ya da yarım kalmış binalar için kullanılmaz.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "101O",
    "status": "Tadilat Halindeki Taşınmaz",
    "description": "Konu taşınmazın eskime, dekorasyon değişikliği vb. nedenlerle tadilat halindeyse Halkbank İnşaat Seviyesi Tabloları kullanılarak rapor tarihindeki inşa seviyesi belirlenir. Tadilatın tamamlanması için gereken tutar taşınmazın bitmiş durum değerinden düşülerek değer taktir edilir.",
    "reportText": "Taşınmaz tadilat halindedir. Taşınmazın bitmiş durum değerinden tadilatın tamamlanması için gereken tutar düşülerek değer takdir edilmiştir.",
    "valuationMethod": "Tadilatın tamamlanması halindeki değerinden tamamlanma masrafları düşülerek Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "İnşa Halindeki Binalar",
    "code": "102A",
    "status": "Yatırım Projesi İnşaat İlerleme Tespitleri",
    "description": "Yatırım projelerinde inşaat ilerleme tespitleri yapılırken bankamızca yatırım projesi özelinde hazırlanmış sitüasyon tablosuna göre yatırımın seviye tespiti yapılmalı, inşa edilmiş kısımların yapım (hakediş) maliyeti ve kalan kısımları için gereken tamamlama maliyeti ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz yatırım projesi kapsamında olup ilgili mevzuat ayrıca incelenmelidir. Projeye özel sitüasyon tablosu kullanılmıştır.",
    "valuationMethod": "Bu risk kodu sadece bankamızın yatırım projesi finansmanı kapsamında kullandıracağı kredileri raporları için kullanılır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103A",
    "status": "İmar Uygulaması (18. Madde) Görecek Parsel - İmar Durumu Belirsiz",
    "description": "İmar Kanunun 18. Maddesine göre imar düzenlemesi yapılmamış ham parsellerin %45'e kadar bedelsiz terkleri de yapılarak imar parsellerine dönüştürülmekte ve yapılaşmaya açılabilmektedir. İmar uygulaması yapılacak arsa ve arazilerde öncelikle konu taşınmazın plan düzenlemelerinden ne şekilde etkileneceği tespit edilmeli; düzenlemelerin maliklerin talebiyle mi belediyece resen mi yapıldığı, parselasyon çalışmalarının hangi aşamada olduğu, her bir hissedara veya parsel malikine müstakil bir imar parseli verilip verilemeyeceği, kadastral parselin isabet ettiği imar parselinin hisseli mülkiyete dönüşüp dönüşemeyeceği, Düzenleme Ortaklık Payı (DOP) adıyla bedelsiz yapılacak kesinti oranı, parselin terk ve ihdasları, verilecek parselin kullanım fonksiyonu ve yapılaşma hakları sorgulanmalıdır. İmar uygulaması görecek olup üst ölçekli planlardan taşınmazın kullanım fonksiyonu ve yapılaşma nizamı açık olarak tespit edilemiyorsa, taşınmazla sadece Mevcut Durum Değeri takdir edilmelidir.",
    "reportText": "Taşınmaz imar uygulaması görecektir. Parselasyon düzenlemesi sonucu parsel yüzölçümünde, konumunda, biçiminde değişiklik olması ve parselin hisseli duruma gelmesi riskleri bulunmaktadır. Uygulama imar planları kesinleştikten sonra ekspertiz raporunun güncellenmesi önerilmektedir.",
    "valuationMethod": "Taşınmazın kullanım fonksiyonu, yapılaşma koşulları ve net olarak tespit edilemiyorsa, çevredeki henüz imar uygulaması yapılmamış emsallerin birim fiyatları dikkate alınarak (DOP düşülmeden) ya da çevredeki imar uygulaması görmüş emsallerin birim fiyatları dikkate alınıp rapora konu taşınmazdan %45 oranında DOP kesileceği kabulü ile sadece Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103B",
    "status": "İmar Uygulaması (18. Madde) Görecek Parsel - Taslak Halindeki İmar Planında Kullanım Fonksiyonu Tespit Edilen",
    "description": "İmar Kanunun 18. Maddesine göre imar düzenlemesi yapılmamış ham parsellerin %45'e kadar bedelsiz terkleri de yapılarak imar parsellerine dönüştürülmekte ve yapılaşmaya açılabilmektedir. İmar durumuna göre terk oranı %45'in üzerine çıktığında fazla terk edilecek kısım için Taşınmazın taslak imar planlarından tespit edilebiliyorsa, imar düzenlemesi sonucu oluşacak kullanım fonksiyonu, yapılaşma koşulları ve yaklaşık terk miktarı belirlenmelidir. Mülkiyet haklarının ve yapılaşma koşullarının kesinleşmesi için uygulama imar planının yapılması ve parselasyon planlarının da hazırlanıp onaylanması gerekmektedir. Kesinleşmemiş dahi olsa parselasyon sonucu mülkiyet hakkının hangi parsellere taşınacağı incelenerek raporda belirtilmelidir. Kısmen kamuya ayrılacak alanda kalıp, terklerden sonra müstakil yapı yapılabilecek parsellerde terklerden geriye kalan kısımlara göre değer takdir edilmelidir.",
    "reportText": "Taşınmaz imar uygulaması görecektir. Uygulama İmar planları kesinleşmediğinden üst ölçekli ve taslak halindeki planlara göre değer takdir edilmiştir. Kesin imar durumu, yapılaşma koşulları ve parsel yüzölçümü uygulama imar planı ile belirlenecektir. Uygulama imar planları kesinleştikten sonra ekspertiz raporunun güncellenmesi önerilmektedir.",
    "valuationMethod": "Çevredeki imar uygulaması görmüş emsallerin birim fiyatları dikkate alınarak, üst ölçekli ve taslak halindeki imar planlarındaki yapılaşma koşullarına ve uygulamadan sonraki parsel yüzölçümüne göre Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103C",
    "status": "İmar Uygulaması (18. Madde) Görecek Parsel - Tamamı Kamuya Ayrılacak Parsel",
    "description": "İmar Kanunun 18. Maddesine göre imar düzenlemesi yapılmamış ham parsellerin %45'e kadar bedelsiz terkleri de yapılarak imar parsellerine dönüştürülmekte ve yapılaşmaya açılabilmektedir. İmar planlarına göre parselin tamamının da kamusal alana ayrılması ve kamulaştırılması ihtimal dahilindedir. Kamulaştırma tarihi ise ilgili idarenin parseli yatırım kapsamına almasına bağlıdır. Taslak imar planından kullanım fonksiyonu ve yapılaşma nizamı açık tespit edilmekle birlikte, imar planlarında taşınmazın tamamının kamuya ayrılacak (yol, meydan, park, yeşil alan, otopark, arıtma tesisi, kamu hastanesi ve sağlık ocakları, devlet okulları, üniversiteler, kreşler, ibadet yeri ile karakol vb.) kısıtlı bir alanda kalması halinde sadece Bilgi Amaçlı Değeri takdir edilmelidir.",
    "reportText": "Taşınmaz imar uygulaması görecek olup parselinin tamamı kamuya ayrılacak kısıtlı alanda kalmaktadır.",
    "valuationMethod": "İmar uygulaması sonucu parselinin tamamı kamuya ayrılacak kısıtlı alanda kalıyorsa sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103I",
    "status": "İmar Plan Ölçekleri Arasında Uyumsuzluk ve Planlama Hataları",
    "description": "Planlama hiyerarşisine göre alt ölçeli (1/1000) planların kendisinden üst ölçekli (sırasıyla 1/5000, 1/25000, 1/100.000 vb.) planların kararlarına ve yapılaşma koşullarına uygun hazırlanması gerekmektedir. 1/1000 ölçekli Uygulama imar planları, plan hiyerarşisinde en alt kademeyi oluşturmakla birlikte uygulama açısından nihai belirleyicidir. İmar uygulamalarına esas olan 1/1000 ölçekli planlar yürürlükte olduğu ve üst ölçekli planlarla birlikte iptal edilmediği sürece geçerliliğini korumaya devam edecektir. Bununla birlikte alt ölçekli plan üst ölçekliye uygun hazırlanmaması, üst ölçekli plan hazırlanmadan alt ölçekli plan hazırlanması vb. durumlar mevzuata aykırılık teşkil edecek ve uyuşmazlık konusu haline gelecektir. Üst ölçekli planların iptali veya revizesi halinde bölgedeki planlama kararlarının, yapılaşma koşullarının ve dolayısıyla alt ölçekli planlamaların değişme ihtimali bulunduğundan ilgili idare (belediye) tarafından da alt ölçekli planlar da üst ölçeklere uyum amacıyla iptal edilebilir ya da yeni düzenlenecek üst ölçekli planlara uygun hale getirilinceye kadar bölgede yapılaşma izni verilmeyebilir. Ayrıca plan iptalleri parselasyon düzenlemelerini de etkileyeceğinden parsellerin konum ve alanlarının değişmesi ihtimali de bulunmaktadır. Uygulama İmar Planlarının ve parselasyon düzenlemelerin iptali halinde yeni plan hazırlanıncaya kadar varsa önceki imar planındaki yapılaşma şartları geçerli olacaktır. Bununla birlikte uygulamada farklı durumlarla karşılaşılmakta olup ilgili belediyenin yapı ruhsatı verirken esas aldığı plandaki yapılaşma koşulları incelenmeli; iptal edilen planlara göre verilen yapı ruhsatlarının geçerliliği, inşaatın devamına izin verilip verilmediği ve parselin yapışama koşullarının iptalden ne şekilde etkileneceği sorgulanarak durum özelinde değer takdir edilmelidir.",
    "reportText": "Taşınmazın imar plan ölçekleri arasında uyumsuzluk/hata bulunmaktadır. İmar planlarının ve parselasyon düzenlemelerinin iptali, revizesi, parsel sınırlarının ve yapılaşma koşullarının değişmesi ihtimalleri vardır. Mevcut uygulama imar planına göre değer takdir edilmiş olup plan değişikliği halinde eksperiz raporlarının güncellenmesi önerilmektedir.",
    "valuationMethod": "Öncelikle hangi ölçekli planda değişiklik yapılacağı (1/1000 planların korunup, 1/15000 planların değiştirilmesi uygulamada karşılaşılan durumlardandır.) ve belediyenin 1/1000 planlara göre yapılaşma izini verip vermediği, yapı ruhsatı verirken esas aldığı yapılaşma koşulları sorgulanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Fonksiyon Değişikliği, Uyumsuzluğu",
    "code": "103J",
    "status": "Akaryakıt Tesisi Lisansı Alma Şartlarını Taşımayan Arsa",
    "description": "İmar planlarında Akaryakıt Tesisi lejantlı olsa da 5015 sayılı Petrol Piyasası Kanunu’nun 8. maddesi ve Petrol Piyasası Lisans Yönetmeliği’nin 45. maddesine göre aynı yön üzerinde bulunan şehir içi yollarda 1 km şehirler arası yollarda 10 km ileride ve geride başka bir akaryakıt veya LPG istasyonunun olması halinde, yeni istasyon açılması izni verilmemektedir. Bu durumdaki taşınmazlar için yakın çevredeki imar şartlarına göre değer takdir edilir.",
    "reportText": "Mevzuatta belirtilen asgari mesafe içinde başka bir Akaryakıt/LPG tesisi bulunduğundan konu taşınmaza Akaryakıt/LPG satış lisansı verilmemektedir. Taşınmaza yakın çevredeki imar şartlarına göre değer takdir edilmiştir.",
    "valuationMethod": "Raporun önemli not bölümünde ilgili husus açıklanarak taşınmaza yakın çevredeki imar şartlarına göre Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103K",
    "status": "İmar Kanununun 15. ve 16. Maddeleri ile Parsel Düzenlemesi",
    "description": "İmar planı bulunan alanlarda, uygulama imar planına uygun olarak öncelikle parselasyon planının yapılması esastır. Parselasyon düzenlemesine tâbi tutulması gerektiği halde, Arazi ve Arsa Düzenlemeleri Hakkında Yönetmeliğin 7. maddesindeki istisnalardan dolayı İmar Kanununun 18 inci maddesinin uygulanmasının mümkün olmadığı hallerde İmar Kanununun 15 ve 16. maddeleri ve yönetmelik hükümlerine göre ifraz, tevhit ve cins değişikliği yoluyla; imar planına uygun, müstakil ve inşaata elverişli hale getirilen parsellere inşaat ruhsatı verilebilmektedir. Mevcut hâliyle yapılaşma izni verilmeyen imar parsellerinde, maliklerden birinin talebi üzerine veya doğrudan tevhit ve fiilî duruma göre ifraz yoluyla işlem yapmaya ilgili idare (belediye) yetkilidir. Evvelce yapılan düzenlemeler dolayısıyla düzenleme ortaklık payı alınmış olan arsa veya arazilerde, değer artışı olduğunun raporlanması halinde, ilk uygulamadaki düzenleme ortaklık payı oranını yüzde kırk beşe (%45) kadar tamamlamak üzere ilave düzenleme ortaklık payı kesintisi yapılabilir, parsel üzerinde ruhsatlı bina varsa ilave düzenleme ortaklık payı bedele dönüştürülerek tahsil edilebilir.",
    "reportText": "Taşınmaza yapılaşma izni verilmesi için İmar Kanunun 15 ve 16. maddelerine göre parselasyon düzenlemesi yapılmalıdır.",
    "valuationMethod": "Yeni inşaat izinlerinin alınması için İmar Kanunun 15 ve 16. maddelerine göre işlem yapılması gereken taşınmazlara tevhit ifraz ve terk durumları incelenerek değer takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103L",
    "status": "İmar Hakkı Transferi",
    "description": "İmar hakkı transferi, arsa sahibinin gayrimenkulü üzerinde var olan imar hakkının başka bir parsele aktarılması, bir başka projede veya mekanda kullanmak üzere menkul hale getirilmesidir. İmar hakkı transferi, imar hakkın alındığı parselin değerin azaltan, hakkın verildiği parselin değerini arttıran bir işlemdir. Rapora konu taşınmazın transferden sonraki yapılaşma koşulları dikkate alınarak değer takdir edilmelidir.",
    "reportText": "Parselde imar hakkı transferi yapılmış olup değerlemede bu durum dikkate alınmıştır.",
    "valuationMethod": "İmar hakkı transferlerinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103N",
    "status": "Geçici Olarak Yapı Ruhsatı ve Yapılaşma İzni Verilmeyen Parsel",
    "description": "İmar planı bulunan ancak mevzuat veya imar planı değişikliği nedeniyle geçici olarak yapı ruhsatı ve yapılaşma izni verilmeyen taşınmazlara yapılacak düzenlemenin etkileri dikkate alınarak değer takdir edilir.",
    "reportText": "Taşınmazın bulunduğu bölgenin imar planları revize edilecek olup düzenlemeler tamamlanıncaya kadar ruhsat ve yapılaşma izini verilmemektedir.",
    "valuationMethod": "Bu madde sadece geçici olarak ruhsat verilmesi durdurulan boş parseller içindir. Geçici durdurma nedeni sorgulanmalı raporda açıklanmalı ve yapılacak düzenlemenin etkilerine göre değer belirlenmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103O",
    "status": "Mevzi İmar Planlı Taşınmaz",
    "description": "Mevcut planların yerleşmiş nüfusa yetersiz olması durumunda veya yeni yerleşme alanlarının acilen kullanmaya açılmasını temin için; parsel özelinde hazırlanan ve ilgili idare tarafından onaylanan imar planlarına mevzi imar planı denilmektedir. Bu şekilde imar düzenlemesi yapılmış parsellerde daha sonra bölgesel imar planları hazırlandığında yeniden imar ve parselasyon düzenlemesi yapılır ve parsellerden bedelsiz düzenleme ortaklık payı kesintileri yapılabilir.",
    "reportText": "Taşınmaz mevzi imar planı ile yapılaşmaya açılmıştır. Bölgesel imar planları hazırlandığında yeniden imar ve parselasyon düzenlemesi yapılacaktır.",
    "valuationMethod": "Mevzi imar planındaki yapılaşma koşullarına göre Yasal ve Mevcut Durum Değeri takdir edilmelidir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "103P",
    "status": "Uygulama İmar Planı İptali",
    "description": "İmar planları çeşitli nedenlerle iptal edilebilmektedir. İmar Planı iptali -beraberinde ruhsatlarında iptaline ilişkin bir mahkeme kararı olmadıkça- doğrudan ruhsat iptaline neden olmaz ancak idare (belediye) plan iptaline bağlı olarak mevzuatın verdiği yetki çerçevesinde ruhsatları da ayrıca iptal edebilir. İmar plan iptali olan durumlarda, plan iptalinin/revizenin gerekçesi ve kapsamı, parselin yapışama koşullarının iptalden ne şekilde etkileneceği, varsa daha önceki imar planının uygulamaya alınıp alınmadığı, mevcut binaların ve yapı ruhsatlarının iptalden nasıl etkilendiği, iptalinden önce verilmiş ruhsatların geçerliliği, inşaatın devamına izin verilip verilmediği, kazanılmış haklar vb. hususlar incelenerek durum özelinde değer takdir edilmelidir. İmar planı değişikliklerinde de yeni yapılaşma koşullarının parseli, mevcut binaları ve inşaatları ne şekilde etkilediği incelenerek değer takdir edilmelidir.",
    "reportText": "Taşınmazın uygulama imar planı iptal edilmiştir.",
    "valuationMethod": "Bu risk koduna göre belirlenmiş bir değer tipi yoktur. İmar planı iptalinin oluşturduğu sonuçlara ve aşağıdaki açıklamalara göre değer tipi belirlenmelidir. Bu risk kodu parselin imar durumuna, kamulaştırma ve terklerine göre, ruhsat iptaline göre uygun risk kodu ile birlikte kullanılmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Fonksiyon Değişikliği, Uyumsuzluğu",
    "code": "104A",
    "status": "İmar Planı Revizesiyle Yapılaşma Koşulları ve Fonksiyonu Değişen Taşınmaz",
    "description": "Üzerinde mevcut yapı bulunan ve imar planının değişmesi nedeniyle kullanım fonksiyonu ve yapılaşma hakları değişen taşınmazlara yeni İmar Planındaki kullanım fonksiyonunun ve yapılaşma koşullarının getirdiği değer artırıcı-azaltıcı etkiler dikkate alınarak değer takdir edilmelidir.",
    "reportText": "İmar planının değişmesi nedeniyle parselin yapılaşma hakları ve/veya kullanım fonksiyonu değişmiştir. Mevcut yapı eski imar planındaki yapılaşma şartlarına göre inşa edilmiştir.",
    "valuationMethod": "Bu madde sadece imar plan fonksiyonunun yapı ruhsatı alındıktan sonra değişmesi durumunda kullanılır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Fonksiyon Değişikliği, Uyumsuzluğu",
    "code": "104D",
    "status": "Yapı Ruhsat ve Projesinde Belirtilenden Farklı Amaçla Kullanılan Taşınmaz",
    "description": "Taşınmaz yapı ruhsatında ve onaylı projelerinde belirtilen kullanım fonksiyonu dışında bir amaçla kullanılıyor ise, (örneğin ruhsat ve projesi ofis olup konut olarak kat irtifakı siciline işlenmişse) onaylı projesindeki ve ruhsattaki kullanım fonksiyonuna göre yasal değeri; mevcut kullanım fonksiyonuna göre mevcut değeri takdir edilir. Tercihli imar hakkı bulunan parsellerde kullanım fonksiyonuna göre KAKS (Emsal) farklılığı bulunuyorsa ve mevcut kullanım fonksiyonuna göre emsal aşımı söz konusu ise bu durum raporun Önemli Not Bölümünde ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz ruhsat ve projesinde izin verilenden farklı bir fonksiyonda kullanılmaktadır. Onaylı projesindeki kullanım fonksiyonuna göre Yasal Durum Değeri, mevcut kullanım fonksiyonuna göre Mevcut Durum Değeri takdir edilmiştir.",
    "valuationMethod": "\"Bu madde sadece bina yapı ruhsatındaki ve projelerindeki fonksiyonundan farklı bir amaçla kullanılıyorsa seçilmelidir, güncel imar durumu ile yapı ruhsatındaki fonksiyon farklılıklarında bu risk kodu seçilmemelidir. Taşınmaz yapı ruhsatında ve onaylı projelerinde belirtilen kullanım fonksiyonu dışında bir amaçla kullanılıyor ise,",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "104J",
    "status": "Boğaziçi Kanunu Kapsamında Bina",
    "description": "2960 sayılı Boğaziçi Kanunu ile Boğaziçi Alanı olarak tanımlanan bölge, Boğaziçi sahil şeridi, Öngörünüm bölgesi, Geri görünüm bölgesi, Etkilenme bölgesi olmak üzere kategorilere ayrılmış, bu alanlarda farklı yapılaşma koşulları ve sınırlamaları getirilmiştir. Boğaziçi sahil şeridi ve öngörünüm bölgesinde turizm ve rekreasyon amacı ile ayrılan alanlara toplumun yararlanmasına ayrılan yapı yapılır ve bu husus Tapu Siciline işlenir; toplumun yararlanmasına ayrılan bu yapılar amaç dışı kullanılamaz; konut kullanımına ayrılmış, ancak yapı yapılmamış olan yerlerde yeşil alan statüsü uygulanır. Boğaziçi Alanı sınırları içinde Devlet ormanı statüsüne alınacak yerler, Boğaziçi İmar Yüksek Koordinasyon Kurulunca kararlaştırılır, özel mülkiyete ait olanlar Tarım ve Orman Bakanlığınca kamulaştırılır. Orman sayılmayan özel mülkiyete ait koru, koruya katılacak alan, vb. alanlar yeşil alan sayılır ve bitki varlıkları geliştirilerek muhafaza edilir. Boğaziçi Kanunundaki kısıtlamalar nedeniyle, parsellerin yapılaşma koşulları, (imar planında yapılaşmaya uygun görülse de) yeni yapılaşma izni veya tadilat izni verilip verilmediği, müktesep yapılaşma hakları incelenip sorgulanarak değer takdir edilmeli, incelenen hususlar raporda belirtilmelidir. Yapılaşma imkanları kısıtlı, koruya katılacak alanlardaki binalar için sadece mevcut değeri takdir edilir.",
    "reportText": "Taşınmaz Boğaziçi Kanunu kapsamındadır. Koruya katılacak alanlardaki binalar için sadece mevcut değeri takdir edilmiştir.",
    "valuationMethod": "Tapuda şerh olmasa dâhi Boğaziçi Kanunu kapsamındaki (koruya katılacak alanlardaki binalar dahil) kullanılır durumdaki binalı taşınmazlar için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "104K",
    "status": "Boğaziçi Kanunu Kapsamında - Kullanım İmkanı Olan Parsel",
    "description": "104F risk kodundaki genel açıklamalar geçerlidir. Boş arsaların ve ekonomik değeri olmayan metruk binaların yapılaşma koşulları ve alternatif kullanım seçenekleri (açık otopark, komşu parsellerin bahçesi vb.) incelenmelidir. Yapılaşma izni olan parsellere yasal değer; yapılaşma imkanları kısıtlı, koruya katılacak alanlardaki boş (ve üzerinde ekonomik değeri olmayan binalar bulunan) parsellerin alternatif kullanım imkanı varsa mevcut durum değeri takdir edilir.",
    "reportText": "Taşınmaz Boğaziçi Kanunu kapsamındadır. Kullanım imkanlarına göre değer takdir edilmiştir.",
    "valuationMethod": "Tapuda şerh olmasa dâhi Boğaziçi Kanunu kapsamındaki boş veya üzerinde metruk binalar bulunan taşınmazlar için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Sit Alanları, Tarihi Eserler ve Boğaziçi",
    "code": "104L",
    "status": "Boğaziçi Kanunu Kapsamında - Kullanım İmkanı Olmayan Parsel",
    "description": "104F risk kodundaki genel açıklamalar geçerlidir. Boş arsaların ve ekonomik değeri olmayan metruk binaların yapılaşma koşulları ve alternatif kullanım seçenekleri (açık otopark, komşu parsellerin bahçesi vb.) incelenmelidir. Yapılaşma imkanları kısıtlı, koruya katılacak alanlardaki boş (ve üzerinde ekonomik değeri olmayan binalar bulunan) parsellerin alternatif kullanım imkanı da yoksa ya da kamulaştırma kararı varsa sadece bilgi amaçlı değeri takdir edilir.",
    "reportText": "Taşınmaz Boğaziçi Kanunu kapsamında koruya katılacak yapılaşma izni bulunmayan alanda kalmaktadır.",
    "valuationMethod": "Tapuda şerh olmasa dâhi Boğaziçi Kanunu kapsamındaki kullanım imkanı olmayan boş veya metruk binalar bulunan taşınmazlar için;",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "105A",
    "status": "Tevhit, İfraz Şartı - %50 den Fazla Hisseli Duruma Gelecek Taşınmaz",
    "description": "İmar planlarında komşu parsellerin tevhit edilerek (birleştirilerek), ifraz edilerek (bölünerek) ya da yoldan ihdas (yol ile parsel arasında kalan alanlar parsele katılarak) yapılaşma izni, yapı ruhsatı alabileceği şeklinde ön şartlar bulunabilir. Tevhit, ifraz veya ihdas şartı bulunan taşınmazların; birleşeceği diğer taşınmazların ada/parsel numaraları, uygulamadan sonra oluşacak parselin alanı, hisseli hale gelip gelmeyeceği, terk miktarı ve ihdas miktarı hususları incelenmeli ve raporda belirtilmelidir. Ekonomik ömrünü henüz tamamlamamış, kullanımda olan binalar için kalan tahmini ekonomik ömür süresi belirtilerek değer takdir edilmelidir. Tevhit işlemleri maliklerin onayı ile gerçekleşecek parsellerde, tevhit yapılmadan yeni yapılaşma imkanı kalmayacağından, mümkünse tevhit işlemine konu diğer parsellerin de rapora dahil edilerek teminat alınması önerilir. İfraz işlemi rıza en, mahkeme kararı ile ya da cebri olarak yapılabilmektedir. İfraz edilen kısımlarda yapılaşma izni yoksa ya da artık parsel olup kamuya terk edilecekse bu kısımlara değer takdir edilmez.",
    "reportText": "İmar planlarına göre konu parselde yeni yapılaşma izin verilmesi için tevhit/ifraz şartı vardır. Tevhit edilecek parsellerin tümünün teminat alınması önerilir.",
    "valuationMethod": "Tevhit gerektiği tespit edilirse, rapor sonuçlandırılmadan şubeye bilgi verilerek mümkünse diğer parsellerin rapora konu edilmesi sağlanmalıdır. Tevhitten sonra %50-100 arası hisseye sahip olunacak ise;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "105B",
    "status": "Tevhit, İfraz Şartı - %50 den Az Hissesi Duruma Gelecek Taşınmaz",
    "description": "İmar planlarında komşu parsellerin tevhit edilerek (birleştirilerek), ifraz edilerek (bölünerek) ya da yoldan ihdas (yol ile parsel arasında kalan alanlar parsele katılarak) yapılaşma izni, yapı ruhsatı alabileceği şeklinde ön şartlar bulunabilir. Tevhit, ifraz veya ihdas şartı bulunan taşınmazların; birleşeceği diğer taşınmazların ada/parsel numaraları, uygulamadan sonra oluşacak parselin alanı, hisseli hale gelip gelmeyeceği, terk miktarı ve ihdas miktarı hususları incelenmeli ve raporda belirtilmelidir. Ekonomik ömrünü henüz tamamlamamış, kullanımda olan binalar için kalan tahmini ekonomik ömür süresi belirtilerek değer takdir edilmelidir. Tevhit işlemleri maliklerin onayı ile gerçekleşecek parsellerde, tevhit yapılmadan yeni yapılaşma imkanı kalmayacağından, mümkünse tevhit işlemine konu diğer parsellerin de rapora dahil edilerek teminat alınması önerilir. İfraz işlemi rıza en, mahkeme kararı ile ya da cebri olarak yapılabilmektedir. İfraz edilen kısımlarda yapılaşma izni yoksa ya da artık parsel olup kamuya terk edilecekse bu kısımlara değer takdir edilmez. Tevhitten sonra %50 den küçük hisseye sahip olunacak boş parseller için sadece mevcut durum değeri; üzerinde kullanılır durumdaki binalar bulunan parseller için binalar dahil yasal ve mevcut değer takdir edilir.",
    "reportText": "İmar planlarına göre konu parselde yeni yapılaşma izin verilmesi için tevhit/ifraz şartı vardır. Uygulamadan sonra %50 den az hisseye sahip olunacaktır. Tevhit edilecek parsellerin tümünün teminat alınması önerilir.",
    "valuationMethod": "Tevhit gerektiği tespit edilirse, rapor sonuçlandırılmadan şubeye bilgi verilerek mümkünse diğer parsellerin rapora konu edilmesi sağlanmalıdır. Tevhitten sonra %50 den küçük hisseye sahip olunacak ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "105D",
    "status": "İhdas Şartı",
    "description": "İmar uygulaması sonucunda ortaya çıkan, yapılaşmaya uygun olmayan artık alanlar Belediye adına tescil edilmekte, tevhit edilecek parselin kaydına şerhi konulmakta veya yapı ruhsatı verilmeden önce bedelinin ödenerek satın alınması istenmektedir. Mevcut yapılar için risk oluşturmayan bu durum boş durumdaki ve üzerindeki bina yıkılarak yenilenecek parsellerde yapılaşmanın ön koşulu olmaktadır. Bedeli karşılığı ihdas edilecek kısmın satın alınarak tevhit yapılmasını gerektirmektedir.",
    "reportText": "Konu parselde yeniden yapılaşma aşamasına ihdas şartı bulunmaktadır.",
    "valuationMethod": "Rapora konu taşınmaz için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "106A",
    "status": "İmar Planında Kısmen Kamuya Ayrılmış Parsel",
    "description": "İmar planlarında kısmen kamuya ayrılacak (yol, meydan, park, yeşil alan, otopark, arıtma tesisi, kamu hastanesi ve sağlık ocakları, devlet okulları, üniversiteler, kreşler, ibadet yeri ile karakol vb.) kısıtlı bir alanda kalan taşınmazlar için terklerinden sonra geriye kalan kısımların yüzölçümüne göre değer takdir edilir. Daha önce %45'den az oranda bedelsiz terki yapılmış parsellerin yeni imar planlarına göre ilave terkleri olabilir ve terkleri yapılmadan yapılaşma hakkı verilmez. Değer takdir edilirken geriye kalan kısmın yapılaşma koşulları ve müstakilen yapılaşma hakkı da incelenerek raporda belirtilmelidir. Belediyelerin kamulaştırma kararı bulunmadığı yazıları taşınmazın imar plan fonksiyonu değişerek özel mülkiyetin yapılamasına ve kullanıma izin verilmediği sürece taşınmazın hukuki durumunu değiştirmemektedir; belediyeler bütçelerine ve yaptırım planlarına göre daha sonra kamulaştırma yapabilir.",
    "reportText": "Taşınmazın kamulaştırması/kamuya terki bulunmakta olup terkten sonra geriye kalan bölüm için değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu kısmen kamulaştırması/terki (yol, yeşil alan, çocuk bahçesi, park, ibadethane, devlet okulu, sağlık ocağı vb. her türlü kamusal terkleri) bulunan parseller için kullanılmalıdır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "106B",
    "status": "İmar Planında Tamamı Kamuya Ayrılmış Parsel",
    "description": "İmar planlarında tamamı kamuya ayrılmış (yol, meydan, park, yeşil alan, otopark, arıtma tesisi, kamu hastanesi ve sağlık ocakları, devlet okulları, üniversiteler, kreşler, ibadethane, karakol vb.) kısıtlı alanlarda kalan veya idari kararla kamu yararına tahsis edilmiş taşınmazlara sadece Bilgi Amaçlı Değeri takdir edilir. İmar plan fonksiyonu veya tapu vasfı okul, yurt, sağlık tesisi vb. olan taşınmazlarda parselin özel mülkiyet tarafından kullanım izni olup olmadığına (kamuya tahsis edilip edilmeyeceğine) incelenmelidir. Kamu yararına tahsis edilmiş taşınmazlar için icra satışı istenememektedir ve teminat değeri yoktur. Belediyelerin kamulaştırma kararı bulunmadığı yazıları taşınmazın imar plan fonksiyonu değişerek özel mülkiyetin yapılamasına ve kullanıma izin verilmediği sürece taşınmazın hukuki durumunu değiştirmemektedir; belediyeler bütçelerine ve yaptırım planlarına göre daha sonra kamulaştırma yapabilir.",
    "reportText": "Taşınmazın tamamı kamulaştırılacak/kamuya terk edilecek alanda kalmaktadır. Kamu kullanımına tahsis edildiğinden bilgi amaçlı değeri takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu kamulaştırması/terki (yol, yeşil alan, çocuk bahçesi, park, ibadethane, devlet okulu, sağlık ocağı vb. her türlü kamusal terkleri) bulunan parseller için kullanılmalıdır.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "106C",
    "status": "İrtifak Hakkı Kamulaştırması",
    "description": "Kamusal hizmetler (yer altından boru ya da üstünden elektrik hattı geçmesi vb.) için irtifak hakkı kamulaştırması yapılacak, malikin tasarrufu kısmen kısıtlanan taşınmazların kullanımına, yapılaşmasına, satış kabiliyetine etkisi incelenerek ve kısıtlanan kısmın olumsuz etkisi dikkate alınarak değer takdir edilir.",
    "reportText": "Taşınmaz üzerinde İrtifak Hakkı Kamulaştırması tespit edilmiştir. İrtifak hakkına konu kısımda maliklerin kullanım ve inşaat hakları kısıtlanacak olup olumsuz etkisi olumsuz etkisi dikkate alınarak takdir edilmiştir.",
    "valuationMethod": "İrtifak hakkı kamulaştırılmak suretiyle kullanımı kısıtlanacak kısmın olumsuz etkisi taşınmaz değerinden düşülerek Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kamulaştırma ve Önalım Hakları",
    "code": "106D",
    "status": "Kamu Kurumu, Belediye ve Vakıf Taşınmazları - Kurum Tarafından Teminat Gösterilecek",
    "description": "Kamu kurum ve kuruluşları, belediyeler, OSB, Üniversite Vakıfları vb. tarafından kamu yararı gözetilerek kamulaştırma yapılabilmektedir. Kamulaştırılacak alanlar daha sonra teminat gösterilecek ise ve yapılaşma koşullarına göre bu taşınmazlara yasal ve/veya mevcut durum değeri takdir edilebilir. Taşınmazların kamu yararına tahsis edilmesi halinde icra satışının istenemeyeceği göz önünde bulundurularak ilgili idareden taahhüt alınması sağlanmalıdır. İtilaflı durumlar ayrıca değerlendirilmelidir.",
    "reportText": "Taşınmazların kamulaştırıldıktan sonra teminata konu olacağı bilgisi alınmıştır. İlgili idareden taşınmazların kamu yararına tahsis edilmeyeceği hususunda taahhüt alınması önerilir.",
    "valuationMethod": "Kamulaştırmadan sonra teminat gösterilecek taşınmazlar için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Resmi Kurum Mülkiyetindeki Taşınmazlar",
    "code": "106E",
    "status": "Kamu Kurumu, Belediye ve Vakıf Taşınmazları - Satılacak",
    "description": "Kamu kurum ve kuruluşları, belediyeler, üniversite vakıfları vb. mülkiyetindeki ihtiyaç fazlası olan veya kat karşılığı yöntemiyle alınan taşınmazlar 3. kişilere satılabilir. Taşınmazın satışına ilişkin alınmış kararlar ve kamu yararına tahsis edilmediğine dair yazı temin edilmeli; temin edilemiyorsa ilgili onay ve yazıların alınması koşuluyla değer takdir edilmelidir.",
    "reportText": "Taşınmaz kamu kurumu/belediye/vakıf mülkiyetinde olup satılacağı bilgisi alınmıştır. Taşınmazın satışına ve kamu yararına tahsis edilmediğine ilişkin kararların alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Satılacağı tespit edilen kamu taşınmazları için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "106G",
    "status": "İmar Plan Fonksiyonu Özel Okul, Özel Yurt, Özel Sağlık Tesisi vb. Taşınmaz",
    "description": "İmar plan fonksiyonu veya tapu vasfı okul, yurt, sağlık tesisi vb. olan taşınmazlarda parselin özel mülkiyet tarafından kullanım izni olup olmadığına (kamuya tahsis edilip edilmeyeceğine) göre değer takdir edilir. Özel mülkiyetin kullanımına uygun taşınmazlara Yasal ve Mevcut Durum Değeri verilebilir.",
    "reportText": "Taşınmaz imar planında okul, yurt, sağlık tesisi vb. fonksiyonlu alanda kalmaktadır. Özel teşebbüs tarafından kullanılabileceği ve kamu yararına tahsis edilmeyeceği bilgilerine istinaden değer takdir edilmiştir.",
    "valuationMethod": "İmar planında okul, yurt, sağlık tesisi vb. fonksiyonlu alanda bulunan taşınmazlar için;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Resmi Kurum Mülkiyetindeki Taşınmazlar",
    "code": "106H",
    "status": "Kamu Kurumu, Belediye ve Vakıf Taşınmazları - Teminat Verilecek",
    "description": "Kamu kurum ve kuruluşları, belediyeler, üniversite vakıfları vb. mülkiyetindeki ihtiyaç fazlası olan veya kat karşılığı yöntemiyle alınan taşınmazlar teminat verilebilir. Taşınmazın teminat verilebileceğine ilişkin alınmış kararlar ve kamu yararına tahsis edilmediğine dair yazı temin edilmeli; temin edilemiyorsa ilgili onay ve yazıların alınması koşuluyla değer takdir edilmelidir.",
    "reportText": "Taşınmaz kamu kurumu/belediye/vakıf mülkiyetindedir. Taşınmazın teminat verilebileceğine ve kamu yararına tahsis edilmediğine ilişkin kararların alınması koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Teminata konu kamu taşınmazları için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "107F",
    "status": "Binada Projesine Göre Dönme, Aynalama, Konum Değişikliği",
    "description": "Onaylı projesine aykırı olarak dönme, aynalama ya da vaziyet planına göre konum değişikliği yapılarak binanın inşa edilmesi, binaları yapı ruhsatına uygun olmayan yapı haline getirir ve ayrıca bağımsız bölümlerin konumunu ve mülkiyet haklarını belirsizleştirir. Dönme ve aynalama sonucu bağımsız bölümün konumunda meydana gelen değişikliklerin mülkiyet haklarını etkileme, çekişmeye konu olma ve değerinde değişikliğe neden olma durumları incelenerek değer takdir edilmelidir. Bağımsız bölümlerin bir kısmı rapora konu ise kattaki şerefiyesi en düşük taşınmaza göre mevcut durum değeri, yer gösterimi yapılan bağımsız bölüme Bilgi Amaçlı Değeri takdir edilir. Bu risk kodu konum tespitiyle ilgili 129'lu risk kodlarından uygun olanla birlikte kullanılmalı ve seçilecek 129'lu risk kodları açıklamalarına göre değer tipi belirlenmelidir.",
    "reportText": "Onaylı projesine aykırı olarak bina dönme/aynalama yapılarak inşa edildiğinden projesine uyumsuz hale gelmiştir.",
    "valuationMethod": "Binada Projesine Göre Dönme, Aynalama, Konum Değişikliği varsa;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Fonksiyon Değişikliği, Uyumsuzluğu",
    "code": "107K",
    "status": "Tapu Sicili ile Projeler ve Yapı Ruhsatı Arasında Fonksiyonu Farklılığı",
    "description": "Taşınmazların inşaat (veya tadilat) ruhsatlarındaki ya da onaylı projelerindeki kullanım fonksiyonu ile Tapu Sicilindeki niteliği farklı ise (Örneğin ruhsatta ofis olup konut olarak Tapu Siciline işlenmişse) resmi belgeler arasındaki uyuşmazlıklar idari yaptırımlara ve hukuki sorunlara neden olabilir.",
    "reportText": "Tapu sicili ile onaylı projeler/belgeler arasında kullanım fonksiyonu farklılığı bulunduğundan onaylı projesindeki ve yapı ruhsatındaki kullanım fonksiyonuna göre yasal durum değeri, mevcut kullanım fonksiyonuna göre mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Taşınmazların inşaat (veya tadilat) ruhsatlarındaki ya da onaylı projelerindeki kullanım fonksiyonu ile Tapu Sicilindeki niteliği farklı ise resmi belgeler arasındaki uyuşmazlığa ilişkin detaylı açıklamalar ekspertiz raporunda yapılmalıdır. Söz konusu uyuşmazlık yapılaşma koşullarında KAKS (emsal) artışı sağlıyorsa bu durum belirtilmelidir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "108A",
    "status": "Dışarıdan Ekspertiz Yapılması",
    "description": "Taşınmazın içine girilerek incelenmesi zorunludur. İstisnai olarak, dışarıdan ekspertiz yapılan, yer gösteriminin yapılmaması nedeniyle binaya girilemeyen, konum teyidi yapılamayan veya örnek olarak başka bir bağımsız bölümün içi gösterilen durumlarda, konu bağımsız bölümün iç imalatlarının tamamlanma durumu hakkında bilgi temin edilmeye çalışılmalı, trampa riskine karşı kapı numaralarından, kapı ve zili üzerindeki isimlerden karşılaştırma yapılmalı, uyumsuzluk tespit edilirse raporda belirtilmelidir. Dışarıdan ekspertiz yapılan durumlarda, konum tespiti yapılamıyorsa sadece bilgi amaçlı değer verilebilir.",
    "reportText": "Taşınmazın konum tespiti bina dışından yapılmıştır.",
    "valuationMethod": "Konum doğrulaması, malikin veya apartman görevlisinin yer göstermesiyle ve daire kapısı numarası görülecek şekilde dışarıdan fotoğraflanarak yapılmalıdır. Doğrulamanın kimin aracılığı ile ve nasıl yapıldığı önemli notta açıklanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Deprem Ve Taşıyıcı Sistem Sorunları",
    "code": "109B",
    "status": "Taşıyıcı Sistemi Onaylı Statik Projesine Uygun Olmayan Taşınmaz",
    "description": "Taşıyıcı sistemi belediye onaylı statik projesine uygun olmayan taşınmazların aks aralarının açılması, kolon ilavesi ya da eksiltmesi gibi gözle görülür kusurları ve aykırılıkları raporda ayrıntılı olarak açıklanmalı, aykırılığın giderilebilir olup olmadığına bakılmaksızın değer takdir edilmelidir.",
    "reportText": "Taşınmazın taşıyıcı sisteminin onaylı statik projesine uygun olmadığı tespit edilmiştir. Statik risklerinin ayrıca incelenmesi önerilir.",
    "valuationMethod": "Bu risk kodu sadece belediyedeki onaylı statik projelerin incelenmesi halinde kullanılabilir. Mimari projeler incelenerek bu risk kodu kullanılmaz.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "109C",
    "status": "Subasman Kotu, Kat Yüksekliği ve Doğal Zemin Uyumsuzlukları",
    "description": "Binanın subasman kotunun, onaylı projesinde belirtilenden yüksek/düşük inşa edilmiş olması, kat yüksekliklerinin değiştirilmiş olması ya da izinsiz kazı yapılarak bodrumlar açığa çıkartılması vb. durumlar binayı projesine ve yapı ruhsatına aykırı hale getirmekte olup İmar Kanununa göre cezaya ve projesine uygun hale getirme yükümlülüğüne tabidir. Aykırılıklar detaylı olarak açıklanmalı ve olası idari yaptırımlar raporda belirtilmelidir.",
    "reportText": "Taşınmazın bulunduğu binanın su basman kotu/kat yükseklikleri ve/veya doğal zemin kotu değiştirilmiştir.",
    "valuationMethod": "Subasman kotu ve kat yüksekliği değişikliklerinde belediyede konuya ilişkin herhangi bir tutanak, yıkım kararı vb. yoksa Yasal Durum Değeri verilebilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "109E",
    "status": "Tapu Tescilsiz Tadilat Projesi",
    "description": "Kat irtifakı kurulduktan sonra Belediyede farklı bir tadilat projesi onaylanan (ve mahallinde uygulanan) ancak Tapu Siciline bu tadilat projesi tescil edilmeyen taşınmazların; projeleri arasındaki farklar tespit edilmeli, bağımsız bölüm sayısı, kullanım fonksiyonu değişmesi, daireler arasında mülkiyet sınırlarının değişmesi, büyüme veya küçülmeler, bağımsız bölümlerin birleştirilmesi gibi hususlar incelenerek raporda açıklanmalıdır. Tadilat projesi tapu siciline tescil edilmediği sürece maliklere mülkiyet hakkı kazandırmaz, bununla birlikte tadilat projesi ile bağımsız bölüm sınırlarının değiştirilmesi itilaflara neden olabilir. İtilaflı olabilecek durumlar dışında değerleme tapu sicilindeki proje esas alınarak yapılır. Tadilat projesi mülkiyet haklarını belirsiz hale getiriyorsa sadece Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Binanın Tapu Sicil Müdürlüğündeki kat irtifakına esas projesi ve Belediyede incelenen onaylı tadilat projesi arasında farklılıklar bulunmaktadır. Tadilat projesinin tapu siciline tescil edilmesi tavsiye edilir.",
    "valuationMethod": "Tapu sicile tescil edilmemiş mülkiyet sınırlarını az yada çok etkileyen tadilat projesi varsa;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "110A",
    "status": "Yasal Olmayan Bina Büyütmesi",
    "description": "Binanın onaylı projeye aykırı alan büyütmelerinde ya da bağımsız bölümlerin bina içindeki ortak alanlarına doğru yapılan alan büyümelerinde; onaylı projesindeki alana göre yasal durum değeri, mahallindeki alan üzerinden büyümeleri dahil edilerek mevcut durum değeri takdir edilmelidir. Mevcut durum değeri belirlenirken ortak alana taşmalar dikkate alınır ancak, başka bağımsız bölümün veya parselin mülkiyet sınırlarını ihlal eden büyümeler, bilgi amaçlı da olsa değere dahil edilmez.",
    "reportText": "Taşınmazın alanı onaylı projesine aykırı şekilde büyütülmüştür. Onaylı projesindeki alana göre yasal durum değeri, mahallindeki alana göre büyümeler de dahil edilerek mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu yapı ruhsatlı veya yasal sayılan binalardan olup ruhsata ve projelere göre büyütüldüğü veya kat ilave edildiği tespit edilen binalar için kullanılır. Binanın tamamı ruhsatsız ise 114L risk kodu seçilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "110B",
    "status": "Binanın Tamamının Ortak Alanları Dahil Değerlendirilmesi",
    "description": "Kat irtifaklı/mülkiyetli taşınmazlarda binanın tamamının ekspertizi yapılıyor ise, ortak alanların taşınmazın değerine katkısı yasal ve mevcut durum değerlerine dahil edilmelidir. Ortak alanların değeri, plana ve kullanım ilişkilerine göre bağlantılı olduğu en yakın bağımsız bölümün değerlerine eklenmelidir. Takdir edilen değer ortak alanları da içerdiğinden taşınmazların tümümün ipotek altına alınması ve ipoteklerin ayrı ayrı fek edilmemesi durumunda geçerli olacaktır.",
    "reportText": "Binanın tamamının ortak alanları dahil bütün halinde değerlendirilmiş ve ortak alanlarının değeri, yasal durum değerine dahil edilmiştir. Takdir edilen yasal değer taşınmazların tamamının teminat olarak alınması ve ipoteklerin ayrı ayrı fek edilmemesi halinde geçerli olacaktır.",
    "valuationMethod": "Binanın tamamının ortak alanları dahil değerlendirilmesi halinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "110C",
    "status": "Çatı Arasında, Bodrum Katta vb. İzdüşümü Aşan Ortak Alana Büyümeler",
    "description": "Çatı arası, bodrum vb. katlarda bağımsız bölümün normal kattaki izdüşümlerini aşan büyümeler olması halinde, sadece normal kattaki iz düşümüne kadar büyümeler dikkate alınarak mevcut durum değeri takdir edilir.",
    "reportText": "Taşınmazın onaylı projesine aykırı olarak, normal kattaki izdüşümün sınırlarını da aşacak şekilde ortak alanlarla birleştirildiği tespit edilmiştir. Onaylı projesindeki alana göre yasal durum değeri, normal kat izdüşümüne kadar büyümelerle birlikte mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu sadece çatı arası, bodrum vb. katlarda bağımsız bölümün normal kattaki izdüşümlerini aşan büyümeler olması halinde kullanılmalıdır; izdüşümün içinde ortak alana yapılan büyümeler 110A risk kodu kapsamında değerlendirilmelidir. İzdüşümün sınırlarını aşan büyümeler olması halinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "110D",
    "status": "Ortak Alan Kullanım Hakkının Yönetim Planı ile Bir Bağımsız Bölüme Verilmesi",
    "description": "Otopark, kat holü, bahçe, bodrum, teras, çatı arası veya diğer ortak alanların fiilen bağımsız bölüme eklendiği kullanımlarda, söz konusu eklemeler binanın Yönetim Planına işlenmiş olabilir ve değerine olumlu etkisi bulunabilir ancak; Yönetim planında binanın ortak alanlarının bir bağımsız bölümün kullanımına bırakılması mülkiyet hakkı kazandırmaz. Yönetim Planı kat maliklerinin 4/5 çoğunluğunun kararıyla değiştirilebilir ve ortak alan kullanımı için hak iddiasında bulunulamaz. Bağımsız bölüm kullanımına bırakılan ortak alanların kullanım hakkının geri alınmasının rapora konu taşınmazın değerine olumsuz etkisi olacaksa raporda ayrıca açıklanmalıdır.",
    "reportText": "Yönetim planıyla bağımsız bölümün kullanımına bırakılan ortak alanlara Yönetim Planının değiştirilmemesi koşuluyla yasal durum değeri takdir edilmiştir.",
    "valuationMethod": "Tapu Sicilindeki Yönetim planıyla bağımsız bölümün kullanımına bırakılan ortak alanlara Yönetim Planının değiştirilmemesi koşuluyla Yasal Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Ortak Alan Kullanımı, Ortak Mallar ve Yönetim planı",
    "code": "110E",
    "status": "Kat Bahçeleri",
    "description": "Kat bahçeleri onaylı projelerdeki ve yönetim planındaki durumuna göre değerlemeye dahil edilmelidir. Kat bahçesi Tapu Sicilinde ve onaylı projelerde eklenti olarak tescil edilmiş ise, yönetim planına işlenmiş ise veya onaylı projesinde sadece bağımsız bölümden geçiş imkânı verilmiş ise yasal alana ve YASAL DURUM DEĞERİ 'ne dahil edilebilir. Yasal olarak ilişkilendirilmemiş, ortak alandan ulaşılan ya da sonradan bağlantı sağlanan kat bahçeleri MEVCUT DURUM DEĞERİ 'ne dahil edilir.",
    "reportText": "Taşınmazın kat bahçesi onaylı projesindeki/yönetim planındaki mülkiyet hakları dikkate alınarak değerlendirilmiştir.",
    "valuationMethod": "Kat bahçesi;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "110F",
    "status": "Taşınmazın Fiilen Bölünerek Kullanılması",
    "description": "Rapor konusu taşınmaz (Tapu Sicilinde ayrılmadığı halde) fiilen ayrılmış ise sadece yer gösterimi yapılan kısma (arsa alanı olarak kullanılan kısmın yaklaşık arsa payı alınarak) değer takdir edilir. Fiilen ayrılıp ekspere gösterilmeyen kısımlar ve ekspere gösterilse dahi ayrıldıktan sonra rapor konusu olmayan başka bir bağımsız bölümle birleştirilen kısımlar değerlemede dikkate alınmaz.",
    "reportText": "Taşınmaz onaylı projesine aykırı şekilde fiilen ayrılmış durumda olup ekspere gösterilen kısım için yasal ve mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Sadece bağımsız olarak kullanılan ve yer gösterimi yapılan kısım için yasal ve mevcut değer takdir edilerek raporda bu durum belirtilmelidir.",
    "valueType": "Y+M (Gösterilen kısımlara)",
    "isNew": ""
  },
  {
    "topic": "Kullanım Bütünlüğü",
    "code": "111A",
    "status": "Birleştirilmiş Taşınmazların Tamamı Rapora Konu",
    "description": "Ekspertiz konusu taşınmaz fiilen başka parsel veya bağımsız bölümlerle birleştirilmiş ve birlikte kullanılmakta ise her bir bağımsız bölüm için onaylı projelerindeki konum ve şerefiyelerine göre yasal durum değeri; birleştirme halinde taşınmazların toplam değeri artıyor ise bu durum dikkate alınarak Mevcut Durum Değeri takdir edilir. Ekspertiz raporunda birlikte kullanım haline göre değer takdir edildiği ve taşınmazlar ayrıldığı takdirde ekspertiz değerlerinde değişiklik olabileceği belirtilmelidir. (Örnek: Cadde cepheli dükkanın pasaj içindeki dükkan ile birleştirilmesi)",
    "reportText": "Taşınmaz başka parsel veya bağımsız bölümlerle birleştirilmiş olup onaylı projelerindeki konum ve şerefiyelerine göre yasal durum değeri, birleştirilmiş haline göre mevcut durum değeri takdir edilmiştir. Fiilen birleştirilmiş taşınmazlar birlikte satışa sunulmadığında satış kabiliyetleri sınırlıdır ve ayrılmaları halinde değerlerinde değişim olabilir. Fiziki bütünlüğünün korunması ve değerinin olumsuz etkilenmemesi için birleştirilen taşınmazların tamamının ipotek alınması ve ipoteklerin ayrı ayrı fek edilmemesi önerilmektedir.",
    "valuationMethod": "Birleştirilen taşınmazların (bağımsız bölümlerin veya parsellerin) tamamı rapora konu ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kullanım Bütünlüğü",
    "code": "111B",
    "status": "Birleştirilmiş Taşınmazların Bir Bölümü Rapora Konu",
    "description": "Ayrı tapuları olan ve fiziken birleştirilen taşınmazların sadece bir bölümü rapora konu ediliyor ise, -yasal olarak satışlarına engel bulunmasa da- fiziki sınırları ve taşınmaz bütünlüğü bozulduğundan, tekrar fiziken ayrılmadan satış kabiliyeti sınırlı olacaktır. Birleştirilen taşınmazların tümünün ipotek altına alınması ve ipoteklerin ayrı ayrı fek edilmemesi önerilmektedir. Aksi durumda diğer taşınmaz maliklerinin mülkiyet ve zilliyet hakları nedeniyle konu taşınmazın İcra Müdürlüğünden teslim alınmasına ilişkin sorunlar yaşanabilmektedir. Birleştirilmiş taşınmazların sadece bir bölümü rapora konu edildiğinde, (fiziken ayrılmadığı veya birleştirildiği diğer taşınmazlarla birlikte ipotek alınmadığı taktirde) onaylı projesindeki konum ve şerefiyesine göre sadece mevcut durum değeri takdir edilir.",
    "reportText": "Birleştirilmiş taşınmazların sadece bir bölümü rapora konu edildiğinden, taşınmaza onaylı projesindeki konum ve şerefiyesine göre sadece mevcut durum değeri takdir edilmiştir. Fiilen birleştirilmiş taşınmazlar birlikte satışa sunulmadığında satış kabiliyetleri sınırlıdır ve ayrılmaları halinde değerlerinde değişim olabilir. Fiziki bütünlüğünün korunması ve değerinin olumsuz etkilenmemesi için birleştirilen taşınmazların tamamının ipotek alınması ve ipoteklerin ayrı ayrı fek edilmemesi önerilmektedir.",
    "valuationMethod": "Birleştirilen taşınmazların (bağımsız bölümlerin veya parsellerin) bir bölümü rapora konu ise;",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Kullanım Bütünlüğü",
    "code": "111C",
    "status": "Ticari İşletme Bütünlüğü - Parsel Sınırları İçinde Müstakilen Faaliyet Gösterebilir",
    "description": "Ticari bütünlük olarak faaliyet gösteren birden fazla parsel üzerinde konumlanmış tesisleri oluşturan taşınmazların değerleri ve satış kabiliyetleri müstakilen faaliyet gösterebilmelerine ve birlikte faaliyet gösterdikleri diğer parsellerin konum ve şerefiyelerine göre değişebilmektedir. Özellikle arsa değerleri birlikte kullanılan diğer parsellerin şerefiye ve yol bağlantılarına göre değişebilmektedir. Tesisten ayrı, müstakilen faaliyet göstermesi mümkün olan parseller ve üzerindeki binalar için konum ve şerefiyelerine göre YASAL DURUM DEĞERİ, ticari bütün halinde taşınmazların toplam değeri artıyor ise bu durum dikkate alınarak MEVCUT DURUM DEĞERİ takdir edilir.",
    "reportText": "Taşınmazlar ticari bütünlük olarak faaliyet göstermektedir. Ticari işletme bütünlüğü olan parsellerin birlikte ve ayrı ayrı değerleri farklılaşabilmekte; birlikte satışa sunulmadıkları taktirde satış kabiliyetleri sınırlı olabilmektedir. Fiziki yapı/tesis bütünlüğünün korunması ve değerinin olumsuz etkilenmemesi için ticari işletme bütünlüğü olan taşınmazların tamamının ipotek alınması ve ipoteklerin ayrı ayrı fek edilmemesi koşuluyla değer takdir edilmiştir. Parsellere konum ve şerefiyelerine göre YASAL DURUM DEĞERİ, ticari bütün haline göre MEVCUT DURUM DEĞERİ takdir edilmiştir.",
    "valuationMethod": "Ticari işletme bütünlüğü olan taşınmazlarda;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kullanım Bütünlüğü",
    "code": "111D",
    "status": "Ticari İşletme Bütünlüğü - Parsel Sınırları İçinde Müstakilen Faaliyet Gösteremez",
    "description": "Ticari bütünlük olarak faaliyet gösteren birden fazla parsel üzerinde konumlanmış tesisleri oluşturan taşınmazların değerleri ve satış kabiliyetleri müstakilen faaliyet gösterebilmelerine ve birlikte faaliyet gösterdikleri diğer parsellerin konum ve şerefiyelerine göre değişebilmektedir. Özellikle arsa değerleri birlikte kullanılan diğer parsellerin şerefiye ve yol bağlantılarına göre değişebilmektedir. Konu parselin tesisten ayrı, müstakilen faaliyet göstermesi güç ise (tesisin geriye kalanı olmadan kullanılabilir değilse, parsele ulaşım için diğer parsel içinden geçilmesi gerekiyorsa ya da ayrılması parselin değerini düşürüyorsa vb.) parselin kendi konum ve şerefiyesine göre sadece MEVCUT DURUM DEĞERİ takdir edilir. Ticari bütünlük halinde taşınmazın değeri artıyor ise bu durum dikkate alınarak Bilgi Amaçlı Değeri takdir edilebilir.",
    "reportText": "Taşınmaz ticari bütünlük olarak faaliyet gösteren tesislerin bir bölümünü oluşturmaktadır. Ticari işletme bütünlüğü olan parsellerin birlikte ve ayrı ayrı değerleri farklılaşabilmekte; birlikte satışa sunulmadıkları taktirde satış kabiliyetleri sınırlı olabilmektedir. Fiziki yapı/tesis bütünlüğünün korunması ve değerinin olumsuz etkilenmemesi için ticari işletme bütünlüğü olan taşınmazların tamamının ipotek alınması ve ipoteklerin ayrı ayrı fek edilmemesi önerilmektedir. Taşınmaz için kendi konum ve şerefiyesine göre mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Ticari işletme bütünlüğü olan taşınmazlarda;",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Kullanım Bütünlüğü",
    "code": "111E",
    "status": "Başka Bir Taşınmaz İçinden Geçilerek Ulaşılan Taşınmaz (Tarlalar Hariç)",
    "description": "Ticari işletme bütünlüğü olmasa da, fiziken ayrılmış olmakla birlikte (tarla ekspertizleri hariç) rapor konusu taşınmaza sadece başka bir taşınmaz içinden geçilerek ulaşılabilen ve geçiş için kullanılan taşınmaz üzerinde irtifak hakkı tesis edilmeyen taşınmazlara sadece MEVCUT DURUM DEĞERİ takdir edilir. (Örneğin sadece showroom içinden geçilerek ulaşılabilen bir konut ya da imar adası ortasında yola cephesi olmayan müstakil bina)",
    "reportText": "Taşınmaza sadece başka bir taşınmaz içinden geçilerek ulaşılabildiğinden mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Sadece Mevcut Durum Değeri takdir edilip raporda sadece başka bir taşınmaz içinden geçilerek ulaşılabildiği açıklanmalıdır.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Sınır İhlalleri ve İşgaller",
    "code": "113A",
    "status": "Sınır İhlali - Konu Taşınmaza İhlal",
    "description": "Başka bir taşınmazın konu taşınmazın sınırlarını ihlal ettiği (sınır tecavüzü) tespit edilirse, işgal edilen alanın büyüklüğü ve kullanımı ne şekilde etkilediği incelenmelidir. Rapor konusu binanın bütününe zarar vermeksizin sınır düzeltmesi ile ihlalinin giderilebilir olması ve sınır düzeltmesinin rapora konu taşınmazın üzerindeki yapıların kullanım imkânını ortadan kaldırmayacağının tespiti halinde ihlale konu parsel yüzölçümü düşülerek geriye kalan kısma yasal ve mevcut değer değer takdir edilir. Sınır düzeltmesi ile giderilemeyecek ihlallerde, konu parsel üzerindeki binanın ihlalden ne kadar etkilendiği ve parselin ihlalden geriye kalan kısmının bağımsız kullanılıp kullanılamayacağı incelenir. Bağımsız olarak kullanılabilir durumda ise, ekonomik değeri varsa, ihlalden geriye kalan kısma yasal ve mevcut değer takdir edilebilir.",
    "reportText": "Rapor konusu taşınmaza sınır ihlali yapıldığı tespit edilmiştir. Sınır ihlalinden geriye kalan kısım için değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu parsel ve bağımsız bölümler arasındaki sınır ihlalleri içindir, sınır ihlali yoksa birleştirilmiş taşınmazlarda bu risk kodu kullanılmaz. Konu taşınmaza sınır ihlali yapılmışsa;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Sınır İhlalleri ve İşgaller",
    "code": "113B",
    "status": "Sınır İhlali - Konu Taşınmazın Kullanım İmkanı Kalmayan İhlal",
    "description": "Komşu bir taşınmazın rapora konu taşınmazın sınırlarını ihlal etmesi halinde ihlalden geriye kalan kısımın kullanım imkanı kalmamışsa sadece Bilgi Amaçlı Değer takdir edilir.",
    "reportText": "Rapor konusu taşınmaza sınır ihlali yapıldığı tespit edilmiştir. Taşınmazın kullanım imkanı kalmadığından bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu parsel ve bağımsız bölümler arasındaki sınır ihlalleri içindir, sınır ihlali yoksa birleştirilmiş taşınmazlarda bu risk kodu kullanılmaz.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Sınır İhlalleri ve İşgaller",
    "code": "113C",
    "status": "Sınır İhlali - Konu Taşınmazın Başka Taşınmaza Binasız Sınır İhlali",
    "description": "Rapor konusu taşınmaz tarafından komşu bir taşınmaza binanın komşu parsele taşması olmadan, bahçe, otopark vb. taşması ile sınır ihlali bulunması halinde mülkiyet sınırlarının dışına, komşu parsele taşan kısımların yüzölçümü değerlemeye dahil edilmez.",
    "reportText": "Rapor konusu taşınmaz tarafından komşu bir taşınmaza sınır ihlali yapılmıştır. Binanın komşu parsele taşması yoktur.",
    "valuationMethod": "Bu risk kodu parsel ve bağımsız bölümler arasındaki sınır ihlalleri içindir, sınır ihlali yoksa birleştirilmiş taşınmazlarda bu risk kodu kullanılmaz.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Sınır İhlalleri ve İşgaller",
    "code": "113D",
    "status": "Sınır İhlali - Konu Taşınmazın Başka Taşınmaza Binalı Sınır İhlali",
    "description": "Rapor konusu taşınmazın üzerindeki bina ile birlikte komşu bir taşınmaza sınır ihlali yapılmış ise taşmanın binanın kullanımını ne ölçüde etkilediği incelenir. Konu binanın kullanımını önemli ölçüde etkileyen ve binanın taşıyıcı sistemine zarar vermeksizin giderilemeyecek sınır ihlallerinde, ruhsatlı dahi olsa bina için yasal değer takdir edilmez. Mülkiyet sınırlarının dışına, komşu parsele taşan bina alanı değerlemeye dahil edilmez.",
    "reportText": "Rapor konusu taşınmaz tarafından komşu bir taşınmaza sınır ihlali yapılmıştır. Binanın da komşu parsele taşması bulunmaktadır.",
    "valuationMethod": "Bu risk kodu parsel ve bağımsız bölümler arasındaki sınır ihlalleri içindir, sınır ihlali yoksa birleştirilmiş taşınmazlarda bu risk kodu kullanılmaz.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "113E",
    "status": "İmar Düzenlemesi Nedeniyle Binanın %5'ine Kadar Yolda/Kamusal Alanda Kalması",
    "description": "İmar planı değişiklikleri ve parselasyon sınırlarının değişmesi nedeniyle ruhsatlı dahi olsa mevcut binalar yolda ya da park okul alanı vb. kamusal alanlarda kalabilmektedir. Bu binalar belediye ya da ilgili idarelerin yatırım programına bağlı olarak yıkım riski taşımaktadır. Binaların yıkımı Belediyenin ve ilgili idarenin inisiyatifinde olup bina ekonomik ömrünü dolduruncaya kadar ya da bölge yatırım programına alınıncaya kadar ertelenebilmektedir. Yıkılacak binalar için müktesep yapılaşma hakkı bulunmamakta, yapılacak yeni binalara güncel imar planındaki sınırlarına, çekme mesafelerine, imar fonksiyonuna ve yapılaşma şartlarına göre ruhsat verilmektedir. Yolda ve kamusal alanlarda kalan binalar için Belediye ya da ilgili idarelerin yıkım planı olup olmadığı sorgulanmalı, yıkım planı yoksa binanın malikler tarafından yenilenmesine kadar korunmasına ve kullanılmasına izin verilip verilmediği tespit edilmelidir. Yıkılması planlanan binalar için değer takdir edilmez. Binanın taban oturumuna göre en fazla %5'e kadarının yolda veya kamusal alanda kalması halinde 5 yıl içinde yıkım planı da yoksa raporda bu durum açıklanarak taşınmaza yasal değer takdir edilebilir.",
    "reportText": "Konu binanın %5 den az kısmı imar planına göre yolda/kamusal alanda kalmaktadır.",
    "valuationMethod": "Öncelikle belediyenin yıkım planı olup olmadığı öğrenilmelidir. Belediyenin veya maliklerin 5 yıl içinde yıkma planı yoksa, binanın sadece parsel sınırları içinde kalan bölümü dikkate alınarak Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "113F",
    "status": "İmar Düzenlemesi Nedeniyle Binanın %5'inden Fazlasının Yolda/Kamusal Alanda Kalması",
    "description": "İmar planı değişiklikleri ve parselasyon sınırlarının değişmesi nedeniyle ruhsatlı dahi olsa mevcut binalar yolda ya da park okul alanı vb. kamusal alanlarda kalabilmektedir. Bu binalar belediye ya da ilgili idarelerin yatırım programına bağlı olarak yıkım riski taşımaktadır. Binaların yıkımı Belediyenin ve ilgili idarenin inisiyatifinde olup bina ekonomik ömrünü dolduruncaya kadar ya da bölge yatırım programına alınıncaya kadar ertelenebilmektedir. Yıkılacak binalar için müktesep yapılaşma hakkı bulunmamakta, yapılacak yeni binalara güncel imar planındaki sınırlarına, çekme mesafelerine, imar fonksiyonuna ve yapılaşma şartlarına göre ruhsat verilmektedir. Yolda ve kamusal alanlarda kalan binalar için Belediye ya da ilgili idarelerin yıkım planı olup olmadığı sorgulanmalı, yıkım planı yoksa binanın malikler tarafından yenilenmesine kadar korunmasına ve kullanılmasına izin verilip verilmediği tespit edilmelidir. Yıkılması planlanan binalar için değer takdir edilmez. Binanın taban oturumuna göre %5'den fazlasının yolda veya kamusal alanda kalması halinde 5 yıl içinde yıkım planı da yoksa raporda bu durum açıklanarak taşınmaza mevcut değer takdir edilebilir. Binanın %20'den fazlası yolda/kamusal alanda kalıyorsa binaya sadece bilgi amaçlı değeri takdir edilir. Teminat alındıktan sonra imar değişikliği nedeniyle kamusal alanda kalan taşınmazlar için teminat değişikliğine gidilmesi ayrıca değerlendirilmelidir.",
    "reportText": "Konu binanın %5 den fazla kısmı imar planına göre yolda/kamusal alanda kalmaktadır.",
    "valuationMethod": "Öncelikle belediyenin yıkım planı olup olmadığı öğrenilmelidir. Belediyenin veya maliklerin 5 yıl içinde yıkma planı yoksa, binanın sadece parsel sınırları içinde kalan bölümü dikkate alınarak bina dahil Mevcut Durum Değeri takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yasal Kabul Edilen Binalar",
    "code": "114A",
    "status": "Kanunen Yasal Kabul Edilen 17 Ocak 1957 Öncesi İnşa Edildiği Belgelenen Bina",
    "description": "2981 sayılı Kanunun geçici 2. Maddesine göre 17 Ocak 1957 öncesi inşa edildiği belgelenen tüm binalar, sonradan ilave edildiği tespit edilen kısımları hariç yasal kabul edilir. Bu binaların güncel imar planlarına göre yapılaşma koşulları, kamulaştırma ve terkleri ayrıca dikkate alınmalıdır.",
    "reportText": "Taşınmazın 17 Ocak 1957 öncesi inşa edildiği tespit edilmiş ve bina kanunen yasal kabul edilerek değer takdir edilmiştir.",
    "valuationMethod": "Sonradan ilave edildiği tespit edilen kısımları hariç yasal kabul edilerek değer takdiri yapılır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Yasal Kabul Edilen Binalar",
    "code": "114B",
    "status": "Kanunen Yasal Kabul Edilen 6785 Sayılı İmar Kanunu Ek Madde 8 Kapsamına Giren Bina",
    "description": "6785 Sayılı İmar Kanununun Ek Madde 8 kapsamına giren, Belediye ve mücavir alan sınırları dışında olup valilik izniyle inşa edilen ya da 10 Ocak 1975 tarihinden önce inşa edildiği belgelenen binalar (sonradan ilave edildiği veya ruhsatsız olarak yıkılıp yeniden inşa edildiği tespit edilen kısımları hariç) yasal kabul edilir. Binaların bu kapsama girdiği valilik tarafından verilen yapı izinleriyle ya da belediyelerden alınan yazılarla belgelenmiş olmalıdır.",
    "reportText": "Binanın 6785 sayılı İmar Kanununun Ek Madde 8 kapsamında olduğu tespit edilmiş ve bina yasal kabul edilerek değer takdir edilmiştir.",
    "valuationMethod": "Sonradan ilave edildiği tespit edilen kısımları hariç yasal kabul edilerek değer takdiri yapılır.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Yasal Kabul Edilen Binalar",
    "code": "114I",
    "status": "Cins Tashihli Kadastro Paftasına İşli Taşınmaz",
    "description": "Cins tashihi taşınmazların üzerindeki binalara kadastro paftasında işli olması halinde yasal kabul edilerek değer takdir edilir. Cins tashihli olsa da kadastro paftasına işli olmayan ve sonradan inşa edildiği tespit edilen binalar için sadece Mevcut Durum Değeri takdir edilir. Bu risk kodu sadece 114A ve 114B risk kodları kapsamına girmeyen kat irtifakı kurulmamış, kadastro paftasına işli cins tashihli yapılar için kullanılır.",
    "reportText": "Taşınmaz cins tashihlidir. Üzerindeki binalara kadastro paftasında işlenmiş olmalarına göre değer takdir edilmiştir.",
    "valuationMethod": "Bu risk kodu sadece 114A ve 114B risk kodları kapsamına girmeyen kadastro paftasına işli ve cins tashihli yapılar için kullanılır. Bina 114AB kapsamında yasal kabul ediliyorsa ya da binanın yapı ruhsatı, yapı kullanma izin belgesi (iskan), onaylı projesi varsa veya kat irtifakı kurulmuşsa bu risk kodu kullanılmaz.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "114L",
    "status": "Yapı Ruhsatsız (Yasal Olmayan) Bina",
    "description": "İmar mevzuatına göre yasal kabul edilmeleri için tüm binaların yapı ruhsatı bulunmalıdır. İstisnai olarak tarihi eser ve özel kanunlarla tescil edilen binalar yasal kabul edilmektedir. Parsel üzerindeki bina tamamen ruhsatsız inşa edilmiş ve istisna kapsamında değilse yıkım ve para cezası riskleri taşıdığından sadece Mevcut Durum Değeri; hisselerin tamamı rapora konu değilse sadece bilgi amaçlı değer takdir edilir. Eski ruhsatlı bir bina yeni yapı ruhsatı alınmadan yıkılarak yenilenmiş ise bina ruhsatsız hale gelir.",
    "reportText": "Parsel üzerindeki bina ruhsatsız, izinsiz olarak inşa edilmiştir.",
    "valuationMethod": "Bu risk kodu sadece tamamı ruhsatsız binalar için kullanılır. Yapı ruhsatlı veya yasal sayılan ancak ruhsata ve projelere göre büyütüldüğü tespit edilen binalar için 110A risk kodu seçilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Proje Uyumsuzluğu",
    "code": "114M",
    "status": "Onaylı Projesi Temin Edilemeyen Ruhsatlı Bina",
    "description": "Yapı ruhsatlı olmakla birlikte onaylı projesi temin edilemediğinden projesine göre yasal alanı tespit edilemeyen ancak eksperin binanın yasal olduğu kanaati bulunan durumlarda belediye dosyasındaki diğer resmi belgelere göre alan belirlenir. Diğer belgelerden de yasal alan tespit edilemiyorsa yer gösterimi yapılan kısımlara göre sadece Mevcut Durum Değeri takdir edilir. Eski ruhsatlı bir bina yeni yapı ruhsatı alınmadan yıkılarak yenilenmiş ise bina ruhsatsız hale gelir.",
    "reportText": "Taşınmazın onaylı projesi temin edilemediğinden binanın yasal alanı tespit edilememiştir.",
    "valuationMethod": "Onaylı projesi temin edilemediğinden binanın yasal alanının tespit edilemediği durumlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Yasal Kabul Edilen Binalar",
    "code": "115A",
    "status": "Köy ve Kırsal Yerleşik Alanları İçinde Proje Onayı ile İnşa edilen Konut ve Tarım Yapısı",
    "description": "Köy ve mezraların yerleşik alanı ile civarında yapılacak konut, tarımsal ve hayvancılıkla ilgili binalar yapı projelerinin fen ve sağlık kurallarına uygun olduğuna dair ilgili idare onayı alınmasından sonra, muhtarlığa bildirimde bulunulmak suretiyle yapı ruhsatı almadan inşa edilebilmektedir ve yapı kullanma iznine tabi değildir. Büyükşehirlerde proje onayları ilçe belediyesince yapılır. Diğer niteliklerdeki yapılar için ilgili idareden yapı ruhsatı alınması gerekmektedir. Yerleşik alan sınırları büyükşehir belediyesi olan illerde ilçe belediye meclisinin teklifi üzerine büyükşehir belediye meclisi kararı ile diğer yerlerde il genel meclisi kararı ile belirlenir. Köy yerleşik alanı ve civarındaki konut, tarımsal ve hayvancılıkla ilgili binalar ilgili proje onaylarının alındığı, projesine ve yönetmeliğe uygun inşa edildiği ve muhtarlığa bildirimde bulunulduğu tespit edilmişse yasal olarak kabul edilir.",
    "reportText": "Taşınmaz Köy Yerleşik Alanı sınırları içinde kalmaktadır.",
    "valuationMethod": "Köy yerleşik alanlarında ve civarındaki konut, tarımsal ve hayvancılıkla ilgili binalar;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "OSB, Serbest Bölgeler ve Endüstri Bölgeleri",
    "code": "116A",
    "status": "Serbest Bölgede Taşınmaz",
    "description": "Serbest Bölgelerde yer alan taşınmazların alım satımı ve kullanımı, Serbest Bölge Yönetiminin iznine tabidir. Serbest bölgelerde satın aldığı arazide yaptırdığı işyerinde faaliyette bulunan kullanıcılar, faaliyetlerine son verilmesi veya faaliyet ruhsatlarının iptal edilmesi halinde arazileri ile üzerindeki bina ve tesislerini Genel Müdürlüğün uygun göreceği diğer bir gerçek veya tüzel kişiye satabilirler. Tahsis şartları ve satın alma aşamasında verilen taahhütler incelenerek konu taşınmazın mülkiyetini etkileyen durumlar raporda belirtilmelidir.",
    "reportText": "Taşınmaz Serbest Bölge içinde konumlu olup her türlü alım satım işlemi izne tabidir.",
    "valuationMethod": "37a ve 37B risk kodları kıyasen uygulanarak değer tipi seçilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "117A",
    "status": "Yıkım Kararı - Binanın Bütününü Kapsayan ve Tamamı Rapora Konu",
    "description": "3194 sayılı İmar Kanunu Kanun hükümlerine göre yapı ruhsatsız ve ruhsata aykırılığı bulunan yapılar kanunun 32. maddesine göre mühürlenerek inşaatları derhal durdurulur ve yapının imar mevzuatına aykırı olduğu bilgisi Tapu Siciline işlenir. İnşaatın mühürlenmesinden sonra bir ay içinde aykırılıklar giderilmezse, yapı ruhsatı iptal edilir, ruhsata aykırı veya ruhsatsız yapılan bina belediye encümeni veya il idare kurulu kararını müteakip yıktırılır. İlgili Belediye tarafından iki ay içinde hakkında yıkım kararı alınmayan yapılar ile yıkım kararı alınmış olmasına rağmen altı ay içinde yıkılmayan yapılar Bakanlıkça yıkılabilir veya yıktırılabilir. Yıkım kararı, ruhsatsız veya projesinden tamamen farklı yapılarda binanın tamamı için ya da kısmi farklılıklarda sadece onaylı projesine aykırı kısımlar için düzenlenebilir. Yıkım kararının kısmi olup olmaması önemlidir. Ruhsat ve proje uyumsuzlukları nedeniyle ruhsat iptali, yapı tatil tutanağı, yıkım kararı vb. düzenlenmiş ise öncelikle yıkım kararının nedeni, kapsamı ve etkisi incelenip raporda açılanarak değer takdir edilmelidir. Kal (Yıkım) Davası Şerhi bulunan taşınmalarda Takyidatlarda Kal (Yıkım) Davası Şerhi veya İmar Kanunu 32. Madde (yıkım kararı) beyanı varsa davanın veya kararın kapsamına uygun 117'li risk kodu seçilmelidir. Belediyeden binanın kesin olarak yıkımının yapılacağı bilgisi alınmış ise bina dahil Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Binanın bütününü kapsayan yıkım kararı bulunmaktadır. Arsa için yasal değer takdir edilmiştir.",
    "valuationMethod": "Binanın bütününü kapsayan yıkım kararlarında, binanın tamamı rapora konu ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "117B",
    "status": "Yıkım Kararı - Binanın Bütününü Kapsayan ve Bağımsız Bölümlerin Bir Kısmı Rapora Konu",
    "description": "3194 sayılı İmar Kanunu Kanun hükümlerine göre yapı ruhsatsız ve ruhsata aykırılığı bulunan yapılar kanunun 32. maddesine göre mühürlenerek inşaatları derhal durdurulur ve yapının imar mevzuatına aykırı olduğu bilgisi Tapu Siciline işlenir. İnşaatın mühürlenmesinden sonra bir ay içinde aykırılıklar giderilmezse, yapı ruhsatı iptal edilir, ruhsata aykırı veya ruhsatsız yapılan bina belediye encümeni veya il idare kurulu kararını müteakip yıktırılır. İlgili Belediye tarafından iki ay içinde hakkında yıkım kararı alınmayan yapılar ile yıkım kararı alınmış olmasına rağmen altı ay içinde yıkılmayan yapılar Bakanlıkça yıkılabilir veya yıktırılabilir. Yıkım kararı, ruhsatsız veya projesinden tamamen farklı yapılarda binanın tamamı için ya da kısmi farklılıklarda sadece onaylı projesine aykırı kısımlar için düzenlenebilir. Yıkım kararının kısmi olup olmaması önemlidir. Ruhsat ve proje uyumsuzlukları nedeniyle ruhsat iptali, yapı tatil tutanağı, yıkım kararı vb. düzenlenmiş ise öncelikle yıkım kararının nedeni, kapsamı ve etkisi incelenip raporda açılanarak değer takdir edilmelidir. Kal (Yıkım) Davası Şerhi bulunan taşınmalarda Takyidatlarda Kal (Yıkım) Davası Şerhi veya İmar Kanunu 32. Madde (yıkım kararı) beyanı varsa davanın veya kararın kapsamına uygun 117'li risk kodu seçilmelidir. Binanın bütününü kapsayan yıkım kararlarında, sadece bazı bağımsız bölümlerin değerlemesi yapılıyor ise Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Binanın bütününü kapsayan yıkım kararı bulunmakta olup bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Binanın bütününü kapsayan yıkım kararlarında,",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "117C",
    "status": "Yıkım Kararı - Kısmi (Yapı Ruhsatına Uygun Olmayan Kısımlar İçin)",
    "description": "3194 sayılı İmar Kanunu Kanun hükümlerine göre yapı ruhsatsız ve ruhsata aykırılığı bulunan yapılar kanunun 32. maddesine göre mühürlenerek inşaatları derhal durdurulur ve yapının imar mevzuatına aykırı olduğu bilgisi Tapu Siciline işlenir. İnşaatın mühürlenmesinden sonra bir ay içinde aykırılıklar giderilmezse, yapı ruhsatı iptal edilir, ruhsata aykırı veya ruhsatsız yapılan bina belediye encümeni veya il idare kurulu kararını müteakip yıktırılır. İlgili Belediye tarafından iki ay içinde hakkında yıkım kararı alınmayan yapılar ile yıkım kararı alınmış olmasına rağmen altı ay içinde yıkılmayan yapılar Bakanlıkça yıkılabilir veya yıktırılabilir. Yıkım kararı, ruhsatsız veya projesinden tamamen farklı yapılarda binanın tamamı için ya da kısmi farklılıklarda sadece onaylı projesine aykırı kısımlar için düzenlenebilir. Yıkım kararının kısmi olup olmaması önemlidir. Ruhsat ve proje uyumsuzlukları nedeniyle ruhsat iptali, yapı tatil tutanağı, yıkım kararı vb. düzenlenmiş ise öncelikle yıkım kararının nedeni, kapsamı ve etkisi incelenip raporda açılanarak değer takdir edilmelidir. Kal (Yıkım) Davası Şerhi bulunan taşınmalarda Takyidatlarda Kal (Yıkım) Davası Şerhi veya İmar Kanunu 32. Madde (yıkım kararı) beyanı varsa davanın veya kararın kapsamına uygun 117'li risk kodu seçilmelidir.",
    "reportText": "Binanın onaylı projesine uygun olmayan kısımları için alınmış yıkım kararı bulunmaktadır.",
    "valuationMethod": "Yapı ruhsatına uygun olmayan kısımlar için alınmış kısmi yıkım kararlarında;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "117D",
    "status": "Yıkım Kararından Sonra Onaylı Projesine Uygun Hale Getirilen veya İskân Belgesi Alınan Bina",
    "description": "İnşaatın mühürlenmesinden sonra bir ay içinde aykırılıklar giderilirse veya yapı ruhsatı ve projelerde tadilat yapılarak bina tadilat projesi ile uyumlu hale getirilirse yıkım kararı Belediye Encümeni tarafından kaldırılabilir. Tadilat projeler Belediye tarafından onaylanmış dahi olsa tüm maliklerin onayı ile Tapu Sicilinde tescil edilmeden mülkiyet hakkı kazandırmaz ve hukuki sorunlara neden olabilir.",
    "reportText": "Binanın onaylı projesine uygun olmayan kısımları için yıkım kararı bulunmaktadır. Yıkım kararından sonra binanın onaylı projesine uygun hale getirildiği tespit edilmiştir.",
    "valuationMethod": "Yıkım kararından sonra geçerli bir iskân belgesi alınması, tadilat projesi düzenlenmesi ya da aykırılıkların giderilerek binanın onaylı projesine uygun hale getirilmesi halinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "117E",
    "status": "İnşaatın Mühürlenmesi",
    "description": "Ruhsat alınmadan inşaata başlandığı veya ruhsat ve eklerine aykırı inşaat yapıldığı idarece tespit edilirse yapı mühürlenerek inşaat durdurulur. Mevzuata göre inşaatın mühürlenmesinden sonra bir ay içinde aykırılıklar giderilmezse, yapı ruhsatı iptal edilir, ruhsata aykırı veya ruhsatsız yapılan bina belediye encümeni veya il idare kurulu kararını müteakip yıktırılır. İlgili Belediye tarafından iki ay içinde hakkında yıkım kararı alınmayan yapılar ile yıkım kararı alınmış olmasına rağmen altı ay içinde yıkılmayan yapılar Bakanlıkça yıktırılabilir. Yıkım kararı, ruhsatsız veya projesinden tamamen farklı yapılarda binanın tamamı için ya da kısmi farklılıklarda sadece onaylı projesine aykırı kısımlar için düzenlenebilir. Mühürlenen inşaatlar için para cezası ayrıca tahakkuk ettirilebilir ve aykırılıklar giderilmediğinde yapı kullanma izin belgesi (iskan) verilmez, kat mülkiyetine geçilemez. Bağımsız bölümlerin bir kısmı rapora konu ise arsa ve bina için Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Bina inşaatı mühürlenerek durdurulmuştur. Aykırılıkların giderilerek inşaatın tamamlanmasına izin verilmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "İnşa halindeyken mühürlenmiş ve durdurulmuş inşaatlar içi, mühürleme gerekçesi tespit edilerek raporda açıklanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Su Havzaları, Taşkın ve Heyelan Alanları",
    "code": "118C",
    "status": "Su Havzası Mutlak ve Kısa Mesafe Koruma Kuşağında Taşınmaz - Tarımsal Faaliyete İzin Verilen",
    "description": "Su havzalarının mutlak ve kısa mesafe koruma kuşağında kalan bölgelerde yapılaşma yasağı vardır ve mevcut binaların yıkım riski bulunmaktadır. Bu bölgelerdeki yapılar için değer takdir edilmez. Bölgedeki yetkili idareden (İstanbul için İSKİ) yapılacak sorgulamaya göre tarımsal faaliyete izin veriliyorsa sadece arsa değeri Yasal ve Mevcut Durum Değeri olarak verilebilir.",
    "reportText": "Taşınmaz su havzasında mutlak/kısa mesafe koruma kuşağında yapılaşma yasağı bulunan bölgede kalmaktadır. Tarımsal amaçlı kullanımına izin verilmesi nedeniyle sadece arsa değeri yasal ve mevcut durum değeri olarak takdir edilmiştir.",
    "valuationMethod": "Taşınmazda tarım yapılmasına izin veriliyor ise sadece arsa değeri Yasal ve Mevcut Durum Değeri olarak takdir edilir.",
    "valueType": "Arsa değeri Y+M",
    "isNew": ""
  },
  {
    "topic": "Su Havzaları, Taşkın ve Heyelan Alanları",
    "code": "118D",
    "status": "Su Havzası Mutlak ve Kısa Mesafe Koruma Kuşağında Taşınmaz - Tarımsal Faaliyete İzin Verilmeyen",
    "description": "Su havzalarının mutlak ve kısa mesafe koruma kuşağında kalan bölgelerde yapılaşma yasağı vardır ve mevcut binaların yıkım riski bulunmaktadır. Bu bölgelerdeki yapılar için değer takdir edilmez. Bölgedeki yetkili idareden (İstanbul için İSKİ) yapılacak sorgulamaya göre tarımsal faaliyete de izin verilmiyorsa sadece bilgi amaçlı arsa değeri takdir edilir.",
    "reportText": "Taşınmaz su havzasında mutlak/kısa mesafe koruma kuşağında yapılaşma yasağı bulunan bölgede kalmaktadır. Tarımsal amaçlı kullanımına da izin verilmemesi nedeniyle sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Taşınmazda tarım yapılmasına da izin verilmiyorsa arsası için Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Su Havzaları, Taşkın ve Heyelan Alanları",
    "code": "118E",
    "status": "Su Havzası Orta ve Uzun Mesafe Koruma Kuşağında Taşınmaz",
    "description": "Orta ve uzun mesafe koruma kuşaklarında yetki ilçe belediyelerinde olup yetkili idarenin de (İstanbul için İSKİ) görüşü alınarak imar planları hazırlanmaktadır. İmar planlarındaki yapılaşma koşulları ve yapı ruhsatı vb. belgeler dikkate alınarak değer takdir edilmelidir. Yetkili idarenin onayı alınmadan hazırlanan imar planları ve yapı ruhsatları itilaflara konu olabildiğinden detaylı araştırma yapılmalıdır.",
    "reportText": "Taşınmaz su havzasında orta ve uzun mesafe koruma kuşağında kalmaktadır.",
    "valuationMethod": "Orta ve uzun mesafe koruma kuşaklarında imar planlarındaki koşullar ve yapı ruhsatı vb. belgeler incelenmeli ve geçerlilikleri sorgulanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "118F",
    "status": "Koşula Bağlı Yapılaşma İzni Verilen Taşınmaz",
    "description": "Yapılaşma izni verilmesi bir taahhüde (başka bir parselin doğrudan ya da üzerine devlet okulu vb. yapılıp bağışlanması, park/yeşil alan vb. olarak terk edilmesi, asfalt yol, istinat duvarı yapılması vb.), alt yapıların taşınmasına (elektrik hattının yer altına alınması, trafonun yer değiştirmesi vb.) ya da bir sonuca (kazı sırasında tarihi eser çıkmamasına, OSB'de uygun arsa kalmamasına, yeterli doluluk oranına ulaşmasına vb.) bağlı olan taşınmazlarda söz konusu şartlar gerçekleştirilmeden yapı ruhsatı ve iskan verilmez. Bu taşınmazlara değer takdir edilirken söz konusu şartı gerçekleştirme maliyeti hesaplanarak taşınmaz değerinden ıskonto edilmeli veya maliyet belirsiz ise raporda açıklanmalıdır.",
    "reportText": "Taşınmaza yapılaşma izni verilmesi koşula bağlanmıştır. Bu durumun taşınmazın değerine ve satış kabiliyetine etkisi ayrıca değerlendirilmelidir.",
    "valuationMethod": "Taşınmaza yapılaşma izni verilmesi koşula bağlı ise; her durumda öncelikle söz konusu şartı gerçekleştirme maliyeti hesaplanıp taşınmaz değerinden düşülerek değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "119A",
    "status": "Kentsel Dönüşüm Kredisi Ekspertizi",
    "description": "Kentsel Dönüşüm Kredisi talebiyle ekspertize konu olan taşınmazlar için yenilenecek binalarda sadece arsa payı değerleri Yasal ve Mevcut Durum Değeri olarak takdir edilmelidir. Yeni projeye göre oluşacak bağımsız bölümlerin bilgi amaçlı değerleri ve inşa maliyetleri de raporda ayrıca belirtilmelidir.",
    "reportText": "Taşınmaz Kentsel Dönüşüm Kredisi talebiyle ekspertize konu olduğundan sadece arsa payı değerleri yasal ve mevcut durum değeri olarak takdir edilmiş ve yeni projeye göre oluşacak bağımsız bölüm değerleri bilgi amaçlı olarak belirtilmiştir.",
    "valuationMethod": "Kentsel Dönüşüm Kredisi talebiyle ekspertize konu taşınmazlar için,",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120A",
    "status": "Kentsel Dönüşüm - Toplulaştırma Yapılacak Arsa veya Bina",
    "description": "6306 sayılı Afet Riski Altındaki Alanların Dönüştürülmesi Hakkında Kanun veya 5393 sayılı Belediye Kanununa göre toplulaştırama yapılacak (riskli alan, rezerv yapı alanı ya da kentsel dönüşüm ve gelişim alanı ilan edilen) bölgelerdeki taşınmazların değerinin tespiti yapılırken öncelikle kentsel dönüşümün bölge ölçeğinde topluca mı veya parsel bazlı mı yapıldığı, konu taşınmazın mevcut hali ile korunması, parselin rezerv alan olarak kullanılması hususları belediyeden ve ilgili idarelerden sorgulanmalıdır. Bölgedeki tüm binalar (yeni binalar için de yıkım kararı verilebilir) yıkılıp toplulaştırma ile yeni bir proje yapılacak ise mülkiyet haklarında değişiklik olacağından sadece Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmazın konumlu olduğu bölgede toplulaştırma ve yeni bir proje yapılacağı tespit edilmiş ve sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Kentsel dönüşüm kapsamında toplulaştırma yapılacağı tespit edilmiş ise;",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120B",
    "status": "Kentsel Dönüşüm - Riskli Alanda Parsel Bazlı Dönüşüm Yapılacak Arsa",
    "description": "Riskli alan, zemin yapısı veya üzerindeki yapılaşma sebebiyle can ve mal kaybına yol açma riski taşıyan alanları ifade eder. Eski yerleşim bölgelerinin kentsel dönüşümü için riskli alan ilan edilebilmektedir. Üzerinde yapı bulunmayan, rezerv alan amaçlı kullanılmayacağı ve toplulaştırma yapılmayacağı kesin olarak belirlenen, tek başına yapılaşma hakkına sahip boş parsellere (varsa terkleri düşülerek) değer takdir edilir.",
    "reportText": "Taşınmaz kentsel dönüşüm kapsamındadır. Parsel bazlı dönüşüm yapılacağı tespit edilmiştir.",
    "valuationMethod": "Parsel bazlı dönüşüm yapılacağı (toplulaştırma yapılmayacağı) tespit edilmiş ise;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120C",
    "status": "Kentsel Dönüşüm - Rezerv Yapı Alanı",
    "description": "Rezerv yapı alanı, gerçekleştirilecek kentsel dönüşüm uygulamalarında yeni yerleşim alanı olarak kullanılmak üzere, Bakanlıkça belirlenen alanları ifade eder. Kentsel dönüşümde rezerv alan amaçlı kullanılacağı belirlenen parsellerde, başka taşınmazlarla takas yapılabilir veya mülkiyet hakları kamulaştırılabilir. Takas yapılacaksa sadece arsası için Mevcut Durum Değeri; kamulaştırılacak ise Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmaz kentsel dönüşüm kapsamında, Rezerv Yapı Alanı içindedir.",
    "valuationMethod": "Rezerv Yapı Alanlarında;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120D",
    "status": "Kentsel Dönüşüm - Yıkılmasına Kadar Korunacak Bina",
    "description": "Bakanlığın, TOKİ'nin ya da belediyenin toplulaştırma ve dönüşüm projesi olmayan bölgelerde riskli alan içinde kalan binalar parsel bazlı olarak maliklerin kararıyla yenilenebilmektedir. Riskli Yapı kararı alınmadığı sürece bu binalar ekonomik ömürlerinin sonuna kadar kullanılabilir. Riskli alan içinde toplulaştırma veya yıkım yapılmayacağı tespit edilen, riskli yapı kararı alınmamış binalar için Yasal ve Mevcut Durum Değeri takdir edilir. Rezerv alanlardaki binalara da rezerv alan ilanından sonra yapı ruhsatı almaları ya da yenileme ihtiyacı olmadığına dair belediyeden yazı veya bilgi alınması halinde Yasal ve Mevcut Durum Değeri verilebilir.",
    "reportText": "Taşınmaz kentsel dönüşüm alanı içindedir. Yenileme amacıyla yıkılıncaya kadar kullanılmaya devam edileceği tespit edilmiştir.",
    "valuationMethod": "Malikleri tarafından yenileme amacıyla yıkılıncaya kadar kullanımına devam edileceği tespit edilen binalar için Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120E",
    "status": "Riskli Yapıda Bağımsız Bölüm (Kentsel Dönüşüm Kredileri Hariç)",
    "description": "Yıkılma veya ağır hasar görme riski taşıdığı tespit edilen binalar Riskli Yapı olarak sınıflandırılır ve bu durum tapu siciline işlenir. Riskli yapıların yıktırılması için maliklerine altmış gün süre verilir. Bu süre içinde yapı, malik tarafından yıktırılmadığı takdirde mahalli idarelerin de iştiraki ile mülki amirler tarafından yıktırılır. Riskli yapılarda binaya değer verilmez, bağımsız bölümlerin arsa payı değeri bilgi amaçlı değeri takdir edilir. Riskli yapılar yıkıldıktan sonra parsel üzerinde yeni inşaat başlamış ise inşa seviyesine göre yapı değerleri de Mevcut Durum Değerine ilave edilmelidir.",
    "reportText": "Bağımsız bölümün bulunduğu bina Riskli Yapı ilan edilmiştir ve yıkılacaktır. Bağımsız bölümün arsa payının Bilgi Amaçlı Değeri takdir edilmiştir.",
    "valuationMethod": "Riskli Yapılarda bağımsız bölüm değerlemesi yapılıyorsa;",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120F",
    "status": "Riskli Yapının Tamamı (Kentsel Dönüşüm Kredileri Hariç)",
    "description": "Yıkılma veya ağır hasar görme riski taşıdığı tespit edilen binalar Riskli Yapı olarak sınıflandırılır ve bu durum tapu siciline işlenir. Riskli yapıların yıktırılması için maliklerine altmış gün süre verilir. Bu süre içinde yapı, malik tarafından yıktırılmadığı takdirde mahalli idarelerin de iştiraki ile mülki amirler tarafından yıktırılır. Riskli yapılarda binaya değer verilmez binanın tamamı rapora konu ise arsası için değer takdir edilir. Riskli yapılar yıkıldıktan sonra parsel üzerinde yeni inşaat başlamış ise inşa seviyesine göre yapı değerleri de Mevcut Durum Değerine ilave edilmelidir.",
    "reportText": "Taşınmaz Riskli Yapı ilan edilmiştir ve bina yıkılacaktır. Sadece arsasına değer takdir edilmiştir.",
    "valuationMethod": "Riskli yapılarda tüm arsa paylarının ekspertizi yapılıyorsa;",
    "valueType": "Arsa değeri Y+M",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120I",
    "status": "Kentsel Dönüşüm - Yıkılacak Bina",
    "description": "Riskli yapıların yıktırılması için maliklerine altmış gün süre verilir. Bu süre içinde yapı, malik tarafından yıktırılmadığı takdirde mahalli idarelerin de iştiraki ile mülki amirler tarafından yıktırılır. Kentsel Dönüşüm kapsamında yıkılacağı tespit edilen yapılara Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmaz kentsel dönüşüm kapsamında olup binanın yıkılacağı tespit edilmiştir.",
    "valuationMethod": "Kentsel dönüşüm kapsamında yıkılacağı tespit edilen binalarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "120J",
    "status": "Terör Nedeniyle Riskli Alan/Kentsel Dönüşüm Alanı İlan Edilen Bölgedeki Taşınmaz",
    "description": "Terör nedeniyle Riskli Alan veya Kentsel Dönüşüm Alanı ilan edilen bölgelerde kamulaştırma, yıkım planları, mevcut yapıların korunmasına ilişkin kararlar ve yeni yapı ruhsatı verme durumları araştırılarak karar verilmelidir. İlgili belediyeden konu taşınmaz ile ilgili herhangi bir yıkım ve olumsuz karar bulunmadığına dair alınacak yazıya istinaden yapıya yasal değer verilebilir. Yıkım ve yenileme yapılacağı tespit edilen taşınmazlara sadece Bilgi Amaçlı Değeri takdir edilmelidir.",
    "reportText": "Taşınmazın bulunduğu bölge Terör ve güvenlik riskleri nedeniyle Riskli Alan ilan edilmiştir.",
    "valuationMethod": "İlgili belediyeden ya da bakanlıktan konu taşınmaz ile ilgili herhangi bir yıkım ve olumsuz karar bulunmadığına dair alınacak yazıya istinaden;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "120K",
    "status": "İmar Düzenlemesi Sonucu Mülkiyet Hakları Taşınan Taşınmaz",
    "description": "İmar düzenlemeleri sonucu konumu değişen ve mülkiyet hakları taşınan taşınmazlara mülkiyet hakkının taşındığı parseldeki yapılaşma koşullarına ve hisseli hale gelmişse arsa payına göre bilgi amaçlı değer takdir edilir. İmar ve parselasyon düzenlemesi tamamlandıktan sonra ekspertiz raporu güncellenmelidir.",
    "reportText": "İmar düzenlemeleri sonucu taşınmazın konumunda değişiklik olmuş ve mülkiyet hakları taşınmıştır. İmar ve parselasyon düzenlemesi tamamlandıktan sonra ekspertiz raporu güncellenmelidir.",
    "valuationMethod": "İmar düzenlemeleri sonucu konumunda değişiklik olan taşınmazlar için;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Deprem Ve Taşıyıcı Sistem Sorunları",
    "code": "121A",
    "status": "Deprem/Taşıyıcı Sistem Hasarlı veya Taşıyıcı Sistemi Zayıf Bina- Az Hasarlı",
    "description": "Deprem hasarlı binalarda, Çevre ve Şehircilik Bakanlığı sınıflandırmasına göre Az Hasarlı binalar için, Yasal ve Mevcut Durum Değeri verilebilir.",
    "reportText": "Bina Çevre ve Şehircilik Bakanlığı sınıflamasına göre Az Hasarlı Yapı olarak tespit edilmiştir.",
    "valuationMethod": "Az hasarlı binalarda Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Deprem Ve Taşıyıcı Sistem Sorunları",
    "code": "121B",
    "status": "Deprem/Taşıyıcı Sistem Hasarlı Bina - Orta veya Ağır Hasarlı, Binanın Tamamı Rapora Konu",
    "description": "Deprem hasarlı binalarda, Çevre ve Şehircilik Bakanlığı sınıflandırmasına göre Orta ve ağır hasarlı binalar için güçlendirme yapılmamış ise sadece arsa değeri takdir edilmelidir.",
    "reportText": "Bina Çevre ve Şehircilik Bakanlığı sınıflamasına göre Orta/Ağır Hasarlı Yapı olarak tespit edilmiştir. Binanın tamamı ekspertize konu olduğundan arsa değeri takdir edilmiştir.",
    "valuationMethod": "Orta/Ağır Hasarlı binalarda güçlendirme yapılmamış ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Deprem Ve Taşıyıcı Sistem Sorunları",
    "code": "121C",
    "status": "Deprem/Taşıyıcı Sistem Hasarlı Bina - Orta veya Ağır Hasarlı, Bağımsız Bölüm",
    "description": "Deprem hasarlı binalarda, Çevre ve Şehircilik Bakanlığı sınıflandırmasına göre Orta ve Ağır Hasarlı binalar için güçlendirme yapılmamış ise, sadece Bilgi Amaçlı Değeri takdir edilmelidir.",
    "reportText": "Bina Çevre ve Şehircilik Bakanlığı sınıflamasına göre Orta/Ağır Hasarlı Yapı olarak tespit edilmiş ve sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Orta/Ağır Hasarlı binalarda güçlendirme yapılmamış ise;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Deprem Ve Taşıyıcı Sistem Sorunları",
    "code": "121D",
    "status": "Deprem/Taşıyıcı Sistem Hasarlı Bina - Güçlendirme Yapılmış",
    "description": "Deprem, taşıyıcı sistem hasarlı binalarda, güçlendirme yapıldığının güçlendirme sonrası alınacak iskân belgesi veya mahallinde gözle yapılan kontroller ile tespit edilmesi halinde, Yasal ve Mevcut Durum Değeri verilebilir.",
    "reportText": "Bina Çevre ve Şehircilik Bakanlığı sınıflamasına göre Orta/Ağır Hasarlı Yapı olarak tespit edilmiş olup güçlendirmesi yapılmıştır.",
    "valuationMethod": "Hasarlı binada güçlendirme yapıldığının güçlendirme sonrası alınacak iskân belgesi veya mahallinde gözle yapılan kontrollerde tespit edilmesi halinde; Yasal ve Mevcut Durum Değeri takdir edilir. (Sadece güçlendirme ruhsatı alınması yeterli değildir, güçlendirme işlemi yapılmış olmalıdır.)",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122A",
    "status": "Kıyı Kanunu Kapsamında Kıyı Alanı (Kumsal) İçinde Kalan Taşınmaz",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamındaki -Kıyı Alanında- (kıyı kenar çizgisi ile deniz arasında kalan kumsal vb. alanlar) yapılaşma yasağı bulunduğundan ve bu alanlar kamulaştırmasız el atmaya konu olacağından (binaların iskânı olsa dahi) arsa ve yapılar için sadece Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Taşınmaz 3621 sayılı Kıyı Kanununa göre Kıyı Alanı (kumsal) içinde kalmaktadır. Kıyı alanlarında yapılaşma yasağı bulunduğundan ve kamulaştırmasız el atmaya konu olacağından sadece bilgi amaçlı değeri takdir edilmiştir.",
    "valuationMethod": "Kıyı Alanı (Kumsal) içinde kalan taşınmaz için;",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122B",
    "status": "Kıyı Kanunu Kapsamında 11/07/1992 Tarihinden Önce Yapı Ruhsatı Alınmış ve Kullanılır Durumda Yapı",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamında -Sahil Şeridi- içinde 11 Temmuz 1992 tarihinden önce yapı ruhsatı almış binalara bina yaşı, kalan kullanım ömrü, binanın yıkılması durumunda yeni yapılaşma izni incelenip müktesep haklar yorumlanarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz, 3621 sayılı Kıyı Kanununa göre Sahil Şeridi içinde kalmaktadır. Bina kullanılabilir durumdadır ve 11 Temmuz 1992 tarihinden önce yapı ruhsatı alınmıştır.",
    "valuationMethod": "Sahil Şeridi- içinde 11 Temmuz 1992 tarihinden önce yapı ruhsatı almış binalara;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122D",
    "status": "Kıyı Kanunu Kapsamında 11/07/1992 Tarihinden Sonra Yapı Ruhsatı Alınmış ve Ruhsatına Uygun Yapı",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamında -Sahil Şeridi- içinde 11 Temmuz 1992 tarihinden sonra bölgede yapılan uygulama imar planına istinaden yapı ruhsatı alınmış binaların ruhsatlarının geçerliliği (Kıyı Kanununun Uygulanmasına Dair Yönetmeliğin -Kısmi Yapılaşma- bölümüne uygunluğu), yapılaşma hakları ve binanın yapı ruhsatı ile onaylı projelerine uygunluğu sorgulanarak değer takdir edilmelidir.",
    "reportText": "Taşınmaz, 3621 sayılı Kıyı Kanununa göre Sahil Şeridi içinde kalmaktadır. Bina kullanılabilir durumdadır ve 11 Temmuz 1992 tarihinden sonra uygulama imar planına göre yapı ruhsatı alınmıştır.",
    "valuationMethod": "Sahil Şeridi- içinde 11 Temmuz 1992 tarihinden önce yapı ruhsatı almış binalara;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122E",
    "status": "Kıyı Kanunu Kapsamında Yasallığı Sorunlu Bina",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamında -Sahil Şeridi- içinde yapı ruhsatın mevzuata uygun verilmediği, binanın projesinden çok farklı veya ruhsatsız şekilde yeniden inşa edildiği durumlarda arsanın yapılaşma izni varsa sadece arsa için Yasal; yapı dahil Mevcut Durum değeri takdir edilmelidir.",
    "reportText": "Taşınmaz, 3621 sayılı Kıyı Kanununa göre Sahil Şeridi içinde kalmaktadır. Binanın yasallığına ilişkin sorunlar tespit edildiğinden bina için mevcut durum değeri takdir edilmiştir.",
    "valuationMethod": "Sahil Şeridi- içinde 11 Temmuz 1992 tarihinden önce veya sonra yapı ruhsatı almış, yapı ruhsatın mevzuata uygun verilmediği, binanın projesinden çok farklı veya ruhsatsız şekilde yeniden inşa edildiği durumlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122F",
    "status": "Kıyı Kanunu Kapsamında Yapılaşma İzni Bulunan Arsa",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamında -Sahil Şeridi- içinde boş (veya üzerinde ekonomik ömrünü doldurmuş yapılar bulunan) arazilerde, ilgili yönetmeliğin -Kısmi Yapılaşma- bölümüne istinaden, yapı ruhsatı alabileceğine dair imar planı vb. resmi yazı veya bilgileri doğrulayan yasal evrak bulunması ya da parsele yapılaşma izni veren geçerli güncel bir imar planı bulunması durumunda Yasal ve Mevcut Durum Değeri verilebilir.",
    "reportText": "Taşınmaz, 3621 sayılı Kıyı Kanununa göre Sahil Şeridi içinde kalmaktadır. Sahil şeridinin ikinci 50 metrelik kısmında kalan taşınmazlarda/kısımlarda mevzuatta izin verilen fonksiyonlar için yapılaşma imkânı bulunmaktadır.",
    "valuationMethod": "Sahil Şeridi içindeki boş (veya üzerinde ekonomik ömrünü doldurmuş yapılar bulunan) arsalarda;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Kıyı Kanunu",
    "code": "122G",
    "status": "Kıyı Kanunu Kapsamında Yapılaşma İzni Bulunmayan Arazi",
    "description": "3621 Sayılı Kıyı Kanunu Kapsamında -Sahil Şeridi- içinde boş (veya üzerinde ekonomik ömrünü doldurmuş yapılar bulunan) arazilerde, yapılaşma imkanı yoksa veya Belediyeden yapılaşma imkânı olduğuna dair bir resmi evrak verilmiyorsa sadece Mevcut Durum Değeri takdir edilmelidir.",
    "reportText": "Taşınmaz, 3621 sayılı Kıyı Kanununa göre Sahil Şeridi içinde kalmakta olup yapılaşma imkânı bulunmamaktadır. Çevre rayiçlerine göre el değiştirme değeri takdir edilmiştir.",
    "valuationMethod": "Sahil Şeridi içindeki boş (veya üzerinde ekonomik ömrünü doldurmuş yapılar bulunan) arazilerde, yapılaşma izni yoksa yada imar planı henüz hazırlanmamışsa çevre rayiçlerine göre el değiştirme değeri Mevcut Durum Değeri olarak takdir edilir.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Su Havzaları, Taşkın ve Heyelan Alanları",
    "code": "123A",
    "status": "Jeolojik Olarak Sakıncalı Alanda İmar Durumuna Göre Yapılaşma İzni Bulunan Taşınmaz",
    "description": "Dere taşkın ve heyelan, fay hattı vb. nedenlerle (kesinleşmemiş afet alanları dahil) jeolojik olarak sakıncalı alanlarda kalan taşınmazların durumlarının rapor özelinde yorumlaması gerekmektedir. Mevcut yapılar riskli yapı kararı alınıncaya veya ekonomik ömrü bitinceye kadar kullanılabilir ancak yeni bina yapılması yasaklanmış veya özel izinlere tabi olabilir. Jeolojik olarak sakıncalı alanlarda imar planı, ilgili mevzuat ve idare tarafından izin verildiği taktirde yeni yapılaşma mümkündür.",
    "reportText": "Taşınmaz dere taşkın/heyelan, fay hattı vb. alanda kalmakta olup yapılaşma hakkı bulunmaktadır.",
    "valuationMethod": "Jeolojik olarak sakıncalı alandaki taşınmazın imar durumuna göre yapılaşma izni varsa;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Su Havzaları, Taşkın ve Heyelan Alanları",
    "code": "123B",
    "status": "Jeolojik Olarak Sakıncalı Alanda İmar Durumuna Göre Yapılaşma İzni Bulunmayan Taşınmaz",
    "description": "Dere taşkın ve heyelan, fay hattı vb. nedenlerle (kesinleşmemiş afet alanları dahil) jeolojik olarak sakıncalı alanlarda kalan taşınmazların durumlarının rapor özelinde yorumlaması gerekmektedir. Mevcut yapılar riskli yapı kararı alınıncaya veya ekonomik ömrü bitinceye kadar kullanılabilir ancak yeni bina yapılması yasaklanmış veya özel izinlere tabi olabilir. İmar durumuna ve mevzuata göre yapılaşma izni bulunmayan taşınmazlar için binanın ekonomik ömrü devam ediyorsa veya arsasının ekonomik değeri varsa bina dahil MEVCUT DURUM DEĞERİ takdir edilebilir. Arsanın da ekonomik değeri yoksa sadece BİLGİ AMAÇLI DEĞERİ takdir edilmelidir.",
    "reportText": "Taşınmaz dere taşkın/heyelan, fay hattı vb. alanda kalmakta olup yapılaşma izni bulunmamaktadır.",
    "valuationMethod": "Jeolojik olarak sakıncalı alandaki taşınmazın imar durumuna göre yapılaşma izni yoksa;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Talebi Kısıtlı Taşınmazlar",
    "code": "123C",
    "status": "Tarıma ve Yapılaşmaya Elverişsiz Arazi",
    "description": "Doğal yapısı nedeniyle tarıma elverişsiz (yüksek eğimli, topraksız, kayalık, taşlık araziler, daimi karla kaplı alanlar, ırmak yatakları, sazlık ve bataklıkları vb.) olup aynı zamanda yapılaşmaya da uygun olmayan (imarsız, yerleşim ve gelişim alanlarının çok uzağında kırsalda bulunan, ulaşım imkanları kısıtlı vb.) arazilerin talebi ve satış kabiliyeti çok düşük seviyededir. Bu taşınmazlar için tahmini el değiştirme değeri bilgi amaçlı olarak takdir edilir.",
    "reportText": "Taşınmaz tarıma ve yapılaşmaya elverişsizdir. Talebi ve satış kabiliyeti kısıtlı olduğundan bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Tarıma ve yapılaşmaya elverişsiz arazilere; sadece Bilgi Amaçlı Değeri takdir edilir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Yapılaşma Ve Kullanım Kısıtlamaları",
    "code": "123D",
    "status": "Tarımsal Niteliğini Kaybetmiş Tarım Arazisi",
    "description": "Tarım alanı olarak belirlenen bölgelerdeki araziler yapılaşmaya kapalıdır ve tarım dışı amaçlarla kullanılamaz. İstisnai olarak Toprak Koruma Projelerine uyulması kaydı ile bu arazilerin tarımsal amaç dışı kullanımına ilgili Bakanlık tarafından izin verilebilir. Bakanlık yetkisini valiliklere devredebilir. Bu durumdaki taşınmazların tarım dışı amaçlarla kullanılmasına ilişkin izinleri ve yapılaşma hakları incelenerek değer takdir edilmelidir.",
    "reportText": "Taşınmaz Tarım Alanında kalmakta olup tarımsal faaliyet dışında amaçlarla kullanılmaktadır.",
    "valuationMethod": "Tarımsal niteliğin kaybetmiş, üzerine bina yapılarak ya da saha betonu dökülerek farklı amaçlarla kullanılan tarım arazilerinde;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "124A",
    "status": "Üzerinde Yeni Proje Geliştirilecek Taşınmaz",
    "description": "Parsel üzerinde yeni bir proje geliştirileceği tespit edilmişse mevcut binalar değerlemede dikkate alınmaz. (Yıkılacağı belirlenen ekonomik ömrünü doldurmamış kullanılır durumdaki binalar da değerlemeye dahil edilmez.) Arsa paylarının tamamı rapora konu ise arsa değeri takdir edilir.",
    "reportText": "Taşınmaz üzerinde yeni proje geliştirileceği tespit edilmiştir.",
    "valuationMethod": "Parsel üzerinde yeni bir proje geliştirileceği tespit edilen durumlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "124B",
    "status": "Ekonomik Ömrü Bitmiş Bağımsız Bölüm",
    "description": "Ekonomik ömrünü tamamlamış binalarda, bağımsız bölümlerin bir kısmı teminata konu olduğunda Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Binanın ekonomik ömrünün bitmiş olması nedeniyle sadece bilgi amaçlı arsa payı değeri takdir edilmiştir.",
    "valuationMethod": "Ekonomik ömrü bitmiş bağımsız bölümler için;",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Kentsel Dönüşüm, Kat Karşılığı İnşaat",
    "code": "124C",
    "status": "Ekonomik Ömrü Bitmiş Binanın Tamamı",
    "description": "Ekonomik ömrünü tamamlamış binanın tamamı teminata konu olduğunda sadece bina değerlemede dikkate alınmaz ve arsa değeri takdir edilir.",
    "reportText": "Binanın ekonomik ömrünün bitmiş olması nedeniyle arsa değeri takdir edilmiştir.",
    "valuationMethod": "Ekonomik ömrü bitmiş binanın tamamı için;",
    "valueType": "Arsa değeri Y+M",
    "isNew": ""
  },
  {
    "topic": "Sınır İhlalleri ve İşgaller",
    "code": "125A",
    "status": "İşgal Edilmiş Taşınmaz",
    "description": "Kredi müşterisi veya kiracıları dışındaki 3. kişiler tarafından işgal edilerek kullanıldığı tespit edilen taşınmazlara (Banka mülkiyetindeki taşınmazlar hariç) sadece Bilgi Amaçlı Değeri takdir edilir. Bankamız mülkiyetindeki taşınmazlar için piyasa değerinin belirlenmesi esastır ve Mevcut Durum Değeri takdir edilir. Kredi müşterisinin kullanmaya devam ettiği (henüz tahliye edilmemiş) taşınmazlar için bu risk kodu kullanılmaz.",
    "reportText": "Taşınmazın 3. kişiler tarafından işgal edilerek kullanıldığı tespit edilmiştir.",
    "valuationMethod": "Eksper kullanan kişinin kredi müşterisi olup olmadığını tespit etmelidir. Kredi müşterisi ve kiracıları dışındaki 3. kişiler tarafından işgal edilerek kullanıldığı tespit edilen taşınmazlara;",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Banka Malı/Takip",
    "code": "126A",
    "status": "Banka Mülkiyetinde Taşınmaz",
    "description": "Banka mülkiyetindeki taşınmazların piyasa değerinin belirlenmesi esas olup teminat değeri belirlenmesindeki özel durumlara ilişkin kurallar uygulanmaz. Taşınmaza mülkiyet, yapı ruhsatı, iskân, onaylı proje gibi belgeler incelenerek yasal durum değeri; mülkiyet sınırları içindeki tüm yapılara (içi görülemese dahi dışarıdan yapılan gözlem ve incelemelere göre) Mevcut Durum Değeri takdir edilmeli ve riskler detaylı olarak açıklanmalıdır. Banka mülkiyetindeki taşınmazlar hisseli ise sadece Halkbank mülkiyetindeki hisseye değer taktir edilir.",
    "reportText": "Taşınmaz HALKBANK mülkiyetindedir.",
    "valuationMethod": "Banka malı taşınmazlar için piyasa değerinin belirlenmesi esastır. Banka mülkiyetindeki taşınmazlar hisseli ise sadece Halkbank mülkiyetindeki hisseye değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Banka Malı/Takip",
    "code": "126B",
    "status": "Banka Mülkiyetinde Teslim Alınmamış Taşınmaz",
    "description": "Banka mülkiyetindeki taşınmazların piyasa değerinin belirlenmesi esas olup teminat değeri belirlenmesindeki özel durumlara ilişkin kurallar uygulanmaz. Taşınmaza mülkiyet, yapı ruhsatı, iskân, onaylı proje gibi belgeler incelenerek yasal durum değeri; mülkiyet sınırları içindeki tüm yapılara (içi görülemese dahi dışarıdan yapılan gözlem ve incelemelere göre) Mevcut Durum Değeri takdir edilmeli ve riskler detaylı olarak açıklanmalıdır. Kredi müşterisi veya kiracıları tarafından kullanılmaya devam eden (İcradan henüz teslim alınmamış) taşınmazlar için bu risk kodu kullanılır. Banka mülkiyetindeki taşınmazlar hisseli ise sadece Halkbank mülkiyetindeki hisseye değer taktir edilir.",
    "reportText": "Taşınmaz HALKBANK mülkiyetinde olup henüz teslim alınmamıştır. Ekspertiz çalışması dışarıdan yapılmıştır.",
    "valuationMethod": "Bu risk kodu bankamız mülkiyetine geçmiş ancak kredi müşterisi veya kiracıları tarafından kullanılmaya devam eden (İcradan henüz teslim alınmamış) taşınmazlar içindir. 3. kişiler tarafından işgal varsa 126E risk kodu seçilmelidir. Banka malı taşınmazlar için piyasa değerinin belirlenmesi esastır. Banka mülkiyetindeki taşınmazlar hisseli ise sadece Halkbank mülkiyetindeki hisseye değer takdir edilir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Banka Malı/Takip",
    "code": "126C",
    "status": "İdari/ Yasal Takip Aşamasında Hisse Değerlemesi Talep Edilen Taşınmaz",
    "description": "Takip aşamasındaki taşınmazlar için sadece hisse değerlemesi talep edilen istisnai durumlarda bu risk kodu kullanılır. Hisseli taşınmazlarda tüm hissedarlar taşınmazın her kısmı üzerinde hisseleri oranında hak sahibi olduğundan taşınmazın ayrılmış bir bölümü üzerinde kullanım ve tam mülkiyet hakkı öne sürülemez. Hisseye karşılık taşınmazın gösterilen/kullanılan bir bölümü için değer takdir edilse dahi itilaflı durumlar oluşabilir ve hissedarlar ortaklığın giderilmesi için dava açabilir. Bu nedenle hisseli taşınmazların tüm hisselerinin teminat alınması genel kural olup sadece hisseli kısma değer takdir edilerek teminat alınması istisna kapsamındadır. Bir hissenin ve/veya hissenin kullanımındaki yapının değerlemesi talep edildiğinde ekspertiz öncesinde Ekspertiz Müdürlüğü onayı alınmalı ve raporda değerleme yapılan kısım açıkça belirtilerek sadece mevcut durum değeri takdir edilmelidir.",
    "reportText": "Taşınmaz hisseli olup sadece hissesi için yapı dahil mevcut durum değeri takdir edilmiştir. Taşınmazın hisse bazında satışı güç olacağından mümkün ise tüm hisselerinin teminat alınması önerilmektedir.",
    "valuationMethod": "Halkbank tarafından takip aşamasında olan taşınmazlar için sadece hisse değerlemesi talep edilen durumlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Banka Malı/Takip",
    "code": "126D",
    "status": "İdari/ Yasal Takip Aşamasında Taşınmaz",
    "description": "İdari ve yasal takip aşamasındaki taşınmazlarda teminat değerliliğini belirlemek için her durumda Mevcut Durum Değeri takdir edilir ve olası riskler ayrıntılı açıklanır. Bu taşınmazların yasal durum değeri tablonun diğer risk kodlarına göre belirlenecektir. Özel olarak hisse değerlemesi talep edilmediği sürece takip aşamasındaki taşınmazların tüm hisselerine değer takdir edilmektedir. Hisse değerlemesi talep edilen durumlarda 126C risk kodu kullanılır.",
    "reportText": "Konu taşınmaz (Takip) aşamasındadır.",
    "valuationMethod": "Halkbank tarafından takip aşamasında olan taşınmazlar için piyasa değerinin belirlenmesi esastır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127A",
    "status": "Yapı Kayıt Belgesi - Binanın Tamamı Rapora Konu",
    "description": "3194 sayılı kanuna eklenen geçici 16.madde ile ruhsatsız veya ruhsat ve eklerine aykırı yapıların kayıt altına alınması ve imar barışının sağlanması amacıyla, 31.12.2017 öncesi inşa edilmiş ruhsatsız veya ruhsat ve eklerine aykırı yapıların kayıt altına alınması amacıyla YAPI KAYIT BELGESİ (YKB) düzenlenmesine imkan sağlanmıştır. Kamulaştırılacak ve sosyal donatı alanı olan yerlerdeki taşınmazlar ile İstanbul Boğaziçi, İstanbul tarihi yarımada ve Çanakkale Boğazı kapsam dışı tutulmuştur. YKB alınan yapıların, (belgenin belediyeye iletilerek talepte bulunulması halinde) yıkım kararları ile tahsil edilemeyen idari para cezaları iptal edilecek, tüm maliklerin tamamının muvafakatinin bulunması halinde Tapu Sicilinde cins değişikliği yapılıp kat mülkiyeti kurulabilecektir. YKB alınması mülkiyeti tescil etmez, kat mülkiyetinin de kurulmuş olması gerekir. YKB, yapının yeniden yapılmasına veya kentsel dönüşüm uygulamasına kadar geçerlidir, müktesep yapılaşma hakkı kazandırmaz. YKB alınması sırasında yapı alanları, daire sayısı, parsel alanı maliklerin beyanı ile belirlenmekte, YKB ücreti malik beyanıyla e-devlet üzerinden girilen bilgilere göre hesaplanmakta, beyanların doğruluğu herhangi bir resmi kurum tarafından onaya tabi tutulmamaktadır. YKB hatalı düzenlenmiş ise hukuken geçersiz sayılmaktadır. Hatalı YKB'ne bağlı olarak kurulan kat mülkiyetinin iptal olması ve taşınmazın hisseli hale gelmesi riskleri bulunmaktadır. YKB ücretinin tamamının ödenmemesi belgenin iptaline neden olabileceğinden malikten ödemeler hakkında bilgi alınmalıdır. 31.12.2017 sonrasında inşaatına başlanmış binalar veya tavan tabliyesi atılmış katlar YKB'den yararlanamaz, alınan belgeler hükümsüzdür. 31.12.2017 öncesi inşaatına başlanmış binaların ise sadece tavan tabliyesi atılmış kısımları için (duvarlar ve ince inşaat yapılmamış olsa dahi) YKB alınabilir. Bu tarihten sonra yapılan kat ve alan ilaveleri ile binanın yıkılıp yenilenmesi imar barışı kapsamında değildir ve YKB alınmış olsa dahi sonradan inşa edilen kısımlara yasallık sağlamaz. Binanın yapı kullanma izin belgesi yoksa tüm bina için YKB alınması gerekmekte olup tek bir bağımsız bölüm için alınan belgeler geçersizdir. Orman, tarım arazisi ve kıyılar gibi özel kanunlar kapsamına giren bölgelerdeki binalar için alınan YKB'lerin iptal edilme riski bulunmaktadır. YKB'de beyan edilen alanla mevcut alan arasındaki %20 den fazla alan hatası olan YKB'ler için 127FG risk kodlarından duruma uygun olan seçilir.",
    "reportText": "Bina için Yapı Kayıt Belgesi alınmıştır.",
    "valuationMethod": "Binanın tamamı ekspertize konu ise;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127B",
    "status": "Yapı Kayıt Belgesi - Belgeye Bağlı Olarak Kat Mülkiyeti Kurulan veya Yenilenen",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Sadece YKB alınması mülkiyeti tescil etmez, kat mülkiyetinin de kurulmuş (eski binada kat mülkiyeti varsa terkin edilerek yeniden kurulmuş) olması gerekir. Hatalı YKB'ne bağlı olarak kurulan kat mülkiyetinin iptal olması ve taşınmazın hisseli hale gelmesi riskleri bulunmaktadır. Bu durum ayrıca incelenmelidir. YKB'de beyan edilen alanla mevcut alan arasındaki %20 den fazla alan hatası olan YKB'ler için 127FG risk kodlarından duruma uygun olan seçilir.",
    "reportText": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti kurulmuş/yenilenmiş olup bina dahil değeri takdir edilmiştir.",
    "valuationMethod": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti kurulmuş veya yenilenmiş ise;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127C",
    "status": "Yapı Kayıt Belgesi - Bağımsız Bölümlere Eşit Fayda Sağlayan",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Sadece YKB alınması mülkiyeti tescil etmez, kat mülkiyetinin de kurulmuş (eski binada kat mülkiyeti varsa terkin edilerek yeniden kurulmuş) olması gerekir. Kat irtifakı/mülkiyeti YKB'ne bağlı olarak yenilenmeyen durumlarda mülkiyet haklarına ilişkin sorunlar yaşanabilir. Kat mülkiyetinin yenilenmediği durumlarda, rapora konu taşınmaz YKB alındıktan sonra kazanılan haklardan eşit derecede fayda sağlıyorsa, binadaki bağımsız bölümler arasında mülkiyet haklarıyla ilgili çekişmeli durumlar ya da haksız zenginleşme söz konusu değilse, YKB'ne istinaden yasal durum değeri takdir edilebilir. YKB'de beyan edilen alanla mevcut alan arasındaki %20 den fazla alan hatası olan YKB'ler için 127FG risk kodlarından duruma uygun olan seçilir.",
    "reportText": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti yenilenmemiştir. Kat mülkiyetinin kurulması/yenilenmesi önerilir.",
    "valuationMethod": "Kat mülkiyetinin yenilenmediği eski kat irtifakının devam ettiği durumlarda;",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127D",
    "status": "Yapı Kayıt Belgesi - Konu Taşınmaza Diğer Bağımsız Bölümlerden Fazla Fayda Sağlayan",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Sadece YKB alınması mülkiyeti tescil etmez, kat mülkiyetinin de kurulmuş (eski binada kat mülkiyeti varsa terkin edilerek yeniden kurulmuş) olması gerekir. Kat irtifakı/mülkiyeti YKB'ne bağlı olarak yenilenmeyen durumlarda mülkiyet haklarına ilişkin sorunlar yaşanabilir. Kat mülkiyetinin yenilenmediği durumlarda, rapora konu taşınmaz YKB alındıktan sonra kazanılan haklardan diğer taşınmazlardan fazla fayda sağlıyorsa, binadaki bağımsız bölümler arasında mülkiyet haklarıyla ilgili çekişmeli durumlar ya da haksız zenginleşme tespit edilmişse, (örneğin konut alanları sabit kalıp sadece dükkan alanı büyütülmüşse) YKB'ne istinaden fazladan fayda sağlanan kısımlar için sadece mevcut durum değeri takdir edilir. YKB'de beyan edilen alanla mevcut alan arasındaki %20 den fazla alan hatası olan YKB'ler için 127FG risk kodlarından duruma uygun olan seçilir.",
    "reportText": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti yenilenmemiştir. Yapı Kayıt Belgesi konu bağımsız bölüme diğer bağımsız bölümlere göre fazlaca fayda sağladı tespit edilmiştir. YKB'ne istinaden fazladan fayda sağlanan kısımlar için sadece mevcut durum değeri takdir edilmiştir. Kat mülkiyetinin mevcut duruma göre yenilenmesi önerilir.",
    "valuationMethod": "Kat mülkiyetinin yenilenmediği eski kat irtifakının devam ettiği durumlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127E",
    "status": "Yapı Kayıt Belgesi - Kat İrtifakı Kurulmamış Arsa Paylı Daire",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Sadece YKB alınması mülkiyeti tescil etmez, kat mülkiyetinin de kurulmuş olması gerekir. Kat mülkiyeti YKB'ne bağlı olarak kurulmayan durumlarda mülkiyet haklarına ilişkin sorunlar yaşanabilir. Kat mülkiyeti kurulup bağımsız bölümler oluşturulmadan hisseye bağlı olarak bir dairenin değerlemesi yapılıyorsa sadece Bilgi amaçlı Değeri takdir edilir.",
    "reportText": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti kurulmamıştır. Sürecin tamamlanarak kat mülkiyetinin kurulması gerekmektedir.",
    "valuationMethod": "Yapı Kayıt Belgesi alındıktan sonra kat mülkiyeti hiç kurulmamış taşınmazlar hisseli taşınmaz statüsündedir. Bağımsız bölüm oluşması ve mülkiyetinin tescili için öncelikle kat mülkiyeti kurulması gerekmektedir.",
    "valueType": "B",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127F",
    "status": "Yapı Kayıt Belgesinin Hatalı Düzenlenmesi - Kat Mülkiyeti İptali Konumu Belirsiz Hale Getirmeyen Durumlar",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Hatalı YKB alınması halinde belgenin iptali, binanın yapı ruhsatına uygun olmayan kısımları için ceza, yıkım ve YKB'ne bağlı olarak kurulan kat mülkiyetinin iptal edilerek taşınmazın hisseli hale gelmesi riskleri bulunmaktadır. YKB'nin iptaline neden olacak kadar hatalı alınması halinde eski ve yeni kat irtifakına esas projelerinden bağımsız bölüm konum ve alanları karşılaştırmalı olarak incelenmelidir. Bağımsız bölümlerin konumu YKB iptalinden etkilenmiyorsa ve mülkiyet haklarını sınırlarını etkileyebilecek çelişkili durumlar oluşmuyorsa YKB dikkate alınmasan eski ruhsat ve projelerine göre yasal, mahallindeki duruma göre Mevcut Durum Değeri takdir edilebilir.",
    "reportText": "Yapı Kayıt Belgesi hatalı beyanla alınmış olup düzetme başvurusu yapılması önerilir. YKB iptali taşınmazın konumunu belirsiz hale getirmediğinden yapı ruhsatına ve onaylı projelerine göre değerleme yapılmıştır.",
    "valuationMethod": "Hatalı sayılan YKB'ler bu maddenin açıklama kısmında belirtilmiştir. Yapı Kayıt Belgesi geçersiz sayılacak kadar hatalı ise ancak, YKB iptali halinde binadaki bağımsız bölümler arasında konum ve mülkiyet haklarıyla ilgili çekişmeli durumlar oluşmuyorsa bu madde kullanılır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127G",
    "status": "Yapı Kayıt Belgesinin Hatalı Düzenlenmesi - Kat Mülkiyeti İptali Konumu Belirsiz Hale Getirecek Durumlar",
    "description": "127A risk kodundaki açıklamalar geçerlidir. Hatalı YKB alınması halinde belgenin iptal riski, binanın yapı ruhsatına uygun olmayan kısımları için ceza ve yıkım riskleri ve YKB'ne bağlı olarak kurulan kat mülkiyetinin iptal edilerek taşınmazın hisseli hale gelmesi riskleri bulunmaktadır. YKB'nin iptaline neden olacak kadar hatalı alınması halinde eski ve yeni kat irtifakına esas projelerinden bağımsız bölüm konum ve alanları karşılaştırmalı olarak incelenmelidir. Bağımsız bölümlerin konumu YKB iptalinden etkileniyorsa ve mülkiyet haklarını sınırlarını etkileyebilecek çelişkili durumlar oluşuyorsa (eski yapı ruhsatı yada onaylı projesi olsa dahi) mülkiyet sorunları oluşabileceğinden sadece Bilgi Amaçlı Değer takdir edilir.",
    "reportText": "Yapı Kayıt Belgesi hatalı beyanla alınmış olup düzetme başvurusu yapılması önerilir. YKB iptali taşınmazın konumunu ve mülkiyetini çekişmeli hale getirdiğinden sadece bilgi amaçlı değer takdir edilmiştir.",
    "valuationMethod": "Hatalı sayılan YKB'ler bu maddenin açıklama kısmında belirtilmiştir. Yapı Kayıt Belgesi geçersiz sayılacak kadar hatalı ise ve YKB konu taşınmazda bağımsız bölümler arasında konum değişikliğine neden olmuş ise bu madde kullanılmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127H",
    "status": "Yapı Kayıt Belgesinin İptali",
    "description": "Aşağıdaki durumlarda sınırlı olmamak üzere hatalı beyanla alınan YKB'ler hukuken geçersiz sayılmakta ve Bakanlık tarafından yapılan denetimlerde YKB iptal edilebilmektedir. YKB iptali halinde varsa daha önce alınmış yapı ruhsatına, projelere, bağımsız bölümlerin konum ve mülkiyet haklarıyla ilgili değişikliklere göre değer takdir edilir.",
    "reportText": "Konu taşınmaz için alınan Yapı Kayıt Belgesi iptal edilmiştir.",
    "valuationMethod": "Yapı Kayıt Belgesi (YKB) iptal edilmiş ise belgenin iptalinin yaratacağı sonuçlara göre işlem yapılmalıdır. Bu risk kodu taşınmazın belge iptalinin neden olacağı konum ve alan değişimlerine ve mülkiyet durumu belirsizliklerine göre 127FG risk kodlarından uygun olanla birlikte kullanılır. Seçilen risk koduna göre yasal, mevcut veya Bilgi Amaçlı Değeri belirlenir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Yapı Kayıt Belgesi",
    "code": "127I",
    "status": "Hazineye Ait Taşınmaz Üzerine İnşa Edilen Yapılar İçin Yapı Kayıt Belgesi Alınması",
    "description": "3194 sayılı kanunun geçici 16.maddesine istinaden Hazineye veya belediyelere ait taşınmazlar üzerine inşa edilen yapılar için Yapı kayıt Belgesi Alınması halinde bedellerinin ödenmesi şartıyla bu parsellerin hak sahiplerine satışına imkan tanınmıştır. Taksitli satışlarda satış bedelinin en az yüzde onu peşin ödenir, kalan bedel ise beş yıla kadar taksitlendirilir. Satış bedelinin tamamının ödendiği teyit edilmelidir.",
    "reportText": "Konu taşınmaz kamu mülkiyetindeyken üzerindeki yapı için 3. kişiler tarafından Yapı Kayıt Belgesi alınmıştır. Parselin satışına ilişkin borçların ödenmesi koşuluyla değer takdir edilmiştir.",
    "valuationMethod": "Arsanın satışına ilişkin borçlar incelenmeli ve borçların ödenmesi koşuluyla Yasal ve Mevcut Durum Değeri verilmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "128A",
    "status": "Yapı Ruhsatı İptali",
    "description": "Yapı ruhsatının iptali binaların hukuki statüsü belirsizleştirir ve yıkım riski oluşur. Öncelikle iptal gerekçesi ve kapsamı sorgulanmalıdır. Hukuka ve mevzuata uygun olmadan düzenlenmiş ruhsatlar kazanılmış hak oluşturmaz ve dava konusu olabilir. Ruhsat alındıktan sonra bina subasman seviyesine gelip Temel Üstü Vizesi alındığında -istisnai bir engel yoksa- ruhsat kazanılmış hak olarak değerlendirilebilir. Temel üstü vizesi almadan imar plan şartları değişirse yeniden ruhsat alınması gerekecektir. Ruhsat süresinin dolmuş olması ruhsatın iptal edildiği anlamına gelmez; ruhsat yenileme izni alınması halinde inşaata devam edilebilir. Belediyeden ruhsat yenilemesi durumunda hangi yapılaşma koşullarının geçerliği olacağı (TAKS, KAKS, Hmax, Fonksiyon vb.) sorgulanmalıdır. Taşıyıcı sisteminin güncel deprem yönetmelikleriyle uyumsuz olduğu ve/veya yapının uzun süre tamamlanmaması nedeniyle zarar gördüğü durumlarda Belediye yapı ruhsatını yenilemeyebilir.",
    "reportText": "Binanın yapı ruhsatı iptal edilmiştir.",
    "valuationMethod": "Yapı Ruhsatı iptal edilen taşınmazlarda;",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "128B",
    "status": "Hatalı Yapı Ruhsatı Düzenlenmiş Bina",
    "description": "Yapı ruhsatı veya yapı kullanma izin belgeleri yürürlükteki mevzuata ve imar planlarına uygun olarak düzenlenmelidir. Hatalı belge düzenlenmesi belgelerin geçersiz olmasına, bu belgelere bağlı olarak kurulan kat irtifaklarının iptaline, mülkiyet haklarının olumsuz etkilenmesine, yıkım kararlarına ve para cezalarına neden olabilir. Bu risk kodu binanın ruhsata uygun olmadığı durumlar için değildir, yapı ruhsatının imar planlarına ve mevzuata uygun olmadığı, hatalı şekilde düzenlendiği durumlarda kullanılmalıdır.",
    "reportText": "Bina için düzenlenen yapı ruhsatının hatalı olduğu tespit edilmiştir.",
    "valuationMethod": "Bu risk kodu binanın ruhsata uygun olmadığı durumlar için değildir. Yapı Ruhsatının imar planlarına ve mevzuata uygun olmadığı, hatalı şekilde düzenlendiği durumlarda kullanılmalıdır. Yapı ruhsatı ve eklerindeki hatanın içeriği raporda açıklanmalı ve durum özelinde değer tipi belirlenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "128C",
    "status": "Hatalı Yapı Kullanma İzin Belgesi (İskan Belgesi) Düzenlenmiş Bina",
    "description": "Yapı ruhsatı veya yapı kullanma izin belgeleri yürürlükteki mevzuata ve imar planlarına uygun olarak düzenlenmelidir. Hatalı belge düzenlenmesi belgelerin geçersiz olmasına, bu belgelere bağlı olarak kurulan kat irtifaklarının iptaline, mülkiyet haklarının olumsuz etkilenmesine, yıkım kararlarına ve para cezalarına neden olabilir. Yapı kullanma izin belgesi mevzuata uygun düzenlenmemiş ise binanın projesine uygun inşan edildiği söylenemez. Bu risk kodu yapı kullanma izin belgesinin düzenlendiği tarihte binanın projesine ve ruhsatınsa uygun olduğu ancak sonradan değişiklik yapıldığı durumlar için değildir; binada ruhsat ve projelerine göre önemli farklılıklar bulunmasına rağmen hatalı şekilde yapı kullanma izin belgesi düzenlenen durumlarda kullanılır.",
    "reportText": "Bina için düzenlenen yapı kullanma izin belgesinin hatalı olduğu tespit edilmiştir.",
    "valuationMethod": "Bu risk kodu yapı kullanma izin belgesinin düzenlendiği tarihte binanın projesine ve ruhsatınsa uygun olduğu ancak sonradan değişiklik yapıldığı durumlar için değildir, binada ruhsat ve projelerine göre önemli farklılıklar bulunmasına rağmen hatalı şekilde yapı kullanma izin belgesi düzenlenen durumlarda kullanılır. Yapı kullanma izin belgesindeki hatanın içeriği raporda açıklanmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "129A",
    "status": "Konum Belirsizliği - Kesin Konum Tespiti Yapılabilen",
    "description": "Kesin konum tespiti yapılabilen ve mülkiyet belirsizliği oluşturmayan durumlarda bu risk kodu kullanılmalıdır.",
    "reportText": "Konu taşınmazın (numarataj, proje eksikleri ya da yer tespiti nedeniyle) konum belirsizliği bulunmakta olup incelenen belgelere göre konum/yön tespiti yapılarak değer takdir edilmiştir.",
    "valuationMethod": "Kesin konum tespiti yapılabilen durumlarda bu risk kodu seçilerek Yasal ve Mevcut Durum Değeri takdir edilir. Düzeltme yapılması ayrıca tavsiye edilebilir.",
    "valueType": "Y+M",
    "isNew": ""
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "129B",
    "status": "Konum Belirsizliği - Konum Tespit Kısmen Yapılabilen",
    "description": "Konum kısmen tespit edilebilen (binanın varlığı tespit edilip bağımsız bölümün konumu tam olarak tespit edilemeyen) durumlarda bu risk kodu kullanılmalıdır.",
    "reportText": "Konu taşınmazın (numarataj, proje eksikleri ya da yer tespiti nedeniyle) konum belirsizliği bulunmaktadır. İncelenen belgelere göre kısmen konum/yön tespiti yapılmış ve kattaki en düşük alanlı ve şerefiyeli bağımsız bölüme göre Yasal Durum Değeri, yer gösterimi yapılan bağımsız bölüme göre Mevcut Durum Değeri takdir edilmiştir.",
    "valuationMethod": "Konum kısmen tespit edilebilen (binanın varlığı tespit edilip bağımsız bölümün konumu tam olarak tespit edilemeyen) durumlarda bu risk kodu kullanılmalıdır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "129C",
    "status": "Konum Belirsizliği - Konum Tespit Edilemeyen",
    "description": "Konum tespit edilemeyen (binanın varlığı da tespit edilemeyen) durumlarda bu risk kodu kullanılmalıdır.",
    "reportText": "Konu taşınmazın (numarataj, proje eksikleri ya da yer tespiti nedeniyle) konum belirsizliği bulunmakta olup incelenen belgelere göre konum/yön tespiti yapılamamaktadır.",
    "valuationMethod": "Konum tespit edilemeyen (binanın varlığı da tespit edilemeyen) durumlarda bu risk kodu kullanılmalıdır.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "129D",
    "status": "Konum Kullanım Hatası (Trampa) Tespit Edilen",
    "description": "Kullanılmakta olan konumun resmi belgelerle uyumsuz ve hatalı olduğu kesin olarak tespit edilebilen (Tapu Sicilinde trampa yapılması veya numarataj düzeltmesi gerektiren) durumlarda bu risk kodu kullanılmalıdır. Mülkiyet hakkı Tapu Sicilindeki kat irtifakına esas onaylı numaratajlı projeye göre belirlenir. Taşınmazın kat irtifakına esas onaylı projesindeki konumu ile mahallinde kullanılan/gösterilen konumun kullanım/yerleşim hatası nedeniyle farklı olması Trampa Durumu olarak ifade edilir. Taşınmazın katı ve konumu numaratajlı projeye göre tespit edilip yer gösterimi yapılan bağımsız bölüm ile arasında uyumsuzluk varsa mülkiyet ve zilliyet uyumsuzluğu bulunduğundan sadece mahallinde gösterilen bağımsız bölümün Bilgi Amaçlı Değeri takdir edilir.",
    "reportText": "Konu taşınmazın onaylı projesindeki konumu ile mahallinde kullanılmakta olan bağımsız bölüm arasındaki konum farklılığı nedeniyle değer takdir edilmemiştir. Taşınmazın numaratajındaki uyumsuzluğun/belirsizliğin düzeltilmesi için Lisanslı Harita Kadastro Bürolarına (LİHKAB) başvurularak tapu sicilinde düzeltme yaptırılması tavsiye edilir.",
    "valuationMethod": "Bu risk kodu sadece projedeki ve mahallinde kullanılan konumların kesin olarak uyumsuz olduğu tespit edilebilen durumlarda kullanılmalıdır. Konum uyumsuzluğunun kesin tespiti şarttır, belirsiz durumlarda bu risk kodu kullanılmaz.",
    "valueType": "B",
    "isNew": "Yeni"
  },
  {
    "topic": "Konum Belirsizlikleri",
    "code": "129E",
    "status": "Tapu Sicilinde Blok, Bağımsız Bölüm Numarası Değişikliği Belirtmesi",
    "description": "Blok ve Bağımsız bölüm hatalarının düzeltmeleri Tapu Siciline beyan olarak belirtilebilmektedir. Düzelme nedeni ve sonuçları raporda açıklanmalıdır.",
    "reportText": "Taşınmazın onaylı projelerindeki blok/bağımsız bölüm numarasında değişiklik yapılmıştır.",
    "valuationMethod": "Düzeltmeden sonraki bağımsız bölüm konum, alan, şerefiye vb. özelliklerine göre Yasal ve Mevcut Durum Değeri takdir edilir.",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Ruhsat İptali ve Yıkım Kararları",
    "code": "129F",
    "status": "Projesine Uygun İnşa Edilmeyen Bina",
    "description": "Binalar yapı ruhsatına ve onaylı projelerine uygun inşa edilmelidir. 3194 sayılı İmar Kanunu Kanun hükümlerine göre yapı ruhsatı ve projelerine uygun inşa edilmeyen binaların yıkım ve para cezası riskleri bulunmaktadır. Projesine uygun inşa edilemeyen binalarda mahallindeki durum ile onaylı projeleri arasındaki farklar tespit edilerek raporda açıklanmalıdır.",
    "reportText": "Bina yapı ruhsatına ve onaylı projesine uygun inşa edilmemiştir.",
    "valuationMethod": "Bu risk kodu onaylı projesine uygun inşa edilmemiş binalar içindir. Aşağıdaki son maddedeki risk kodlarından biri seçilmiş ise bu risk kodu seçilmemeli; son maddedeki risk kodlarının kapsamına girmeyen aykırılıkların sonuçlarına göre değer tipi belirlenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Talebi Kısıtlı Taşınmazlar",
    "code": "130A",
    "status": "Tercih Edilirliği Düşük Taşınmaz",
    "description": "Potansiyel alıcılar tarafından rağbet görmeyen, yapısal, çevresel, maddi veya idari kusuru bulunan, konumu ve planlaması nedeniyle tercih edilmeyen, uzun süredir faaliyette olmasına rağmen doluluk oranı düşük, taşınmazların etkilendiği olumsuz faktörler tespit edilerek raporda detaylı şekilde belirtilmeli ve değerlemede dikkate alınmalıdır. (Örneğin, bir yıldan uzun süre açık olmasına rağmen mağaza doluluk oranı %50'den düşük AVM'ler, pasaj içinde, bodrum katta kalan parekende ürün satış potansiyeli çok düşük dükkanlar, konut bölgesi içinde ara sokakta ya da site içinde kalan talep görmeyen depo ve dükkanlar, kırsal bölgede kalan sadece aynı köyden kişilerin talep göstereceği köy evleri, heyelan bölgesinde kaldığından talep görmeyen binalar, çok eski ve bakımsız olması nedeniyle tercih edilmeyen binalar, imar uygulaması yapıldığında büyük bölümü yolda, yeşil alanda kalacak binalar, asayiş problemi olan bölgeler vb.) Bu gruba giren taşınmazlara sadece mevcut durum değeri takdir edilir.",
    "reportText": "Taşınmazın potansiyel alıcılar tarafından tercih edilirliğinin düşük olduğu tespit edilmiştir.",
    "valuationMethod": "Bu risk kodu kullanılmadan önce Bankanın Ekspertiz Bölümünün görüş ve onayı alınmalıdır. Bu risk kodu sadece aşağıda örnekleri de verilen, taşınmazın takyidatlarından ve hisse oranından bağımsız olarak kendi fiziki özellikleri ve konumu nedeniyle piyasada tercih edilmediği durumlarda kullanılmalı; taşınmaz üzerinde bir takyidat bulunması veya hisseli olması nedeniyle kullanılmamalıdır.",
    "valueType": "M",
    "isNew": ""
  },
  {
    "topic": "Koşula Bağlı Mülkiyet Hakları",
    "code": "131A",
    "status": "Ecrimisil Bağlantılı Taşınmaz",
    "description": "Daha geniş alanda hizmet verebilmek amacıyla turizm ve yeme-içme sektörü ağırlıklı olmak üzere işletmeler parsel sınırlarını aşarak Hazine ya da belediyeler mülkiyetindeki alanları ecrimisil ödemesi yaparak kullanabilmektedir. Parsel sınırları dışında kalmakla birlikte restoran, kafeterya gibi işletmelerin müştemilatı ya da bahçesi olarak kullanılabilen bu alanlar taşınmazların kullanım fonksiyonunu ve değerini önemli ölçüde etkileyebilmektedir. İşletmenin devamlılığının ecrimisil olarak kullanılan alanlara bağlı olduğu durumlarla da karşılaşılabilmektedir. Parsel sınırları dışındaki kullanımın taşınmaza etkisi yasal ve mevcut durum değerlerine dahil edilmez, bilgi amaçlı olarak takdir edilir. Ecrimisil olarak ödenen tutarlar tespit edilerek değerleme raporunda belirtilmelidir.",
    "reportText": "Taşınmaz ecrimisil bağlantılı olarak kullanılmaktadır. Ecrimisil konusu kısımlar taşınmaz yüzölçümüne dahil değildir. Taşınmazın değeri ecrimisil devamlılığına ve ücretine bağlı olarak değişim gösterebilir.",
    "valuationMethod": "Ecrimisil bağlantılı taşınmalarda;",
    "valueType": "Y+M",
    "isNew": "Yeni"
  },
  {
    "topic": "Diğer Takyidatlar ve Riskler",
    "code": "200A",
    "status": "Risk Kodlarında Karşılığı Bulunmayan Takyidatlar ve Özel Durumlar",
    "description": "Risk Kodları Tablosunda karşılığı bulunmayan mülkiyet haklarını etkileyebilecek takyidatlar ve riskler bu madde kapsamında, takyidatın, riskin özelliğine ve taşınmazın mülkiyet haklarına etkisine göre rapor özelinde değerlendirilir.",
    "reportText": "Açıklama:….",
    "valuationMethod": "Bu madde sadece risk kodlarında karşılığı bulunmayan ve aynı zamanda mülkiyet haklarını etkileyebilecek durumlarda kullanılır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Diğer Takyidatlar ve Riskler",
    "code": "200B",
    "status": "Şerh, Beyan ve İdari Kararlarla İlgili Detaylı Bilgi Edinilemeyen Mülkiyet Haklarını Etkileyebilecek Durumlar",
    "description": "Risk Kodları Tablosunda karşılığı olmakla birlikte değerleme çalışması sırasında elde edilen bilgi ve belgelerle detaylı bilgi edinilemeyen mülkiyet haklarını etkileyebilecek şerh, beyan ya da idari kararlar bu madde kapsamında ve rapor özelinde değerlendirilmelidir. (Örneğin kamulaştırma şerhi olup eksperin araştırmalarına rağmen kamulaştırılacak alanın büyüklüğüne ilişkin bilgi edinilemeyen durumlarda)",
    "reportText": "Takyidat içeriği ve idari karlarla ilgili detaylı bilgi temin edilememiştir. Ek bilgilerin temin edilmesi halinde raporun güncellenmesi önerilmektedir.",
    "valuationMethod": "Bu madde sadece riskli durum ya da takyidatla ilgili detaylı bilgi temin edilemeyen ve aynı zamanda mülkiyet haklarını etkileyebilecek durumlarda kullanılır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Diğer Takyidatlar ve Riskler",
    "code": "200C",
    "status": "Takyidat Belgesi Alınamayan Durumlar",
    "description": "Takyidat belgelerinin temin edilmediği durumlarda taşınmazlar üzerinde şerh ve beyan bulunmadığı varsayımıyla; çok tapulu, takyidatların tamamının temin edilmediği raporlarda ise temin edilen takyidatlara göre kıyasen ekspertiz raporu hazırlanmaktadır. Takyidat belgesi temin edilmeyen taşınmazların durumu ipotek tesisinden önce takyidatlar şube tarafından temin edilerek incelenmeli; takyidatlarda farklılık ya da kısıtlayıcı bir durum tespit edilmesi halinde ipotek tesisinden önce Ekspertiz Bölümünün görüşü alınarak gerekirse ekspertiz raporu revize edilmelidir.",
    "reportText": "Takbis takyidat belgelerinin tamamı temin edilmemiş olup ipotek aşamasında tüm takyidat belgelerinin temin edilerek incelenmesi gerekmektedir.",
    "valuationMethod": "Takyidat alınmayan tapular için takyidat alınan tapulardaki şerh ve beyanlara göre kıyasen değer takdir edilmeli ve bu durum raporda açıklanarak diğer takyidat belgelerinin temin edilmesi istenmelidir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Diğer Takyidatlar ve Riskler",
    "code": "200D",
    "status": "İnceleme Tarihi Sonrasında Tapu Bilgilerinde ya da Takyidatta Değişiklik",
    "description": "Ekspertiz raporları hazırlandığı tarihteki taşınmazın fiili ve yasal durumunu gösteren belgelerdir. Raporun hazırlandığı tarihten sonra tapu bilgilerinde ya da takyidatlarda değişiklik olması halinde ekspertiz raporunda değişiklik yapılmaz; kaldırılan şerh ve beyanların karşılığı olan risk kodları dikkate alınmadan güncel takyidat bilgileri esas alınarak teminat işlemleri yürütülür. Bununla birlikte -ipotek işleminin yapılabilmesi için vb. için- istisnai olarak raporda değişiklik yapılmasının zorunlu olduğu özel hallerde (örneğin zemin ID değişikliği) rapor tarihinden itibaren 30 gün içinde talep edilmesi halinde Ekspertiz Bölümünün uygunluğu alınarak ve oluşacak ilave ekspertiz masrafları ödenmek suretiyle değişiklik yapılabilir ve bu risk kodu seçilerek raporda gerekçesi açıklanır. 30 günden sonraki düzeltme talepleri için güncel rapor hazırlatılması gerekmektedir. Raporun büyük bölümünde değişiklik gerektiren (kat irtifakı kurulması vb.) durumlarda ya da rapora tapu eklenmesi/çıkartılması taleplerinde bu risk kodu kullanılmaz ve güncel rapor hazırlatılmalıdır.",
    "reportText": "Tapu belgesinde veya takyidatta raporda değişiklik gerektiren durum tespit edilmiş ve raporun sadece ilgili kısmı güncellenmiştir. Değiştirilen İçerik: …",
    "valuationMethod": "Takyidat değişikliğinin sonrasındaki duruma göre karar verilir ve raporun önemli not bölümünde yapılan değişikler kısaca açıklanır.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "Kadastro Ve İmar Düzenlemeleri",
    "code": "201A",
    "status": "Belediye ve Mücavir Alan Sınırları Dışındaki Taşınmaz",
    "description": "Belediye ve mücavir alan sınırları dışındaki taşınmazlar ayrı planlama yönetmeliklerine ve yapılaşma şartlarına sahiptirler. Sistemsel veri üretmek üzere bu risk kodu ilave edilmiştir.",
    "reportText": "Taşınmaz belediye ve mücavir alan sınırları içinde değildir.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Menkul Ve Teferruatlar",
    "code": "202A",
    "status": "Menkul Ekspertizi",
    "description": "Menkul ekspertizlerinde bu risk kodu seçilir.",
    "reportText": "Menkul ekspertizidir.",
    "valuationMethod": "Menkul ve makinelere piyasadaki 2. el satış değerlerine göre değer takdir edilir ve rapordaki menkul ve makineler aşağıdaki sınıflamaya göre gruplandırılır. Küçük teçhizat ve makinalar (el matkabı vb.), elektrik panosu, binanın ısıtma, havalandırma, yangın, güvenlik vb. tesisatı, pc, printer vb. ofis cihazları, laboratuvar ekipmanları vb. Bankanın Ekspertiz Bölümünün özel bir talebi olmadıkça değerlemeye dahil edilmez.",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": ""
  },
  {
    "topic": "Menkul Ve Teferruatlar",
    "code": "202B",
    "status": "Güneş Enerjisi Santrali (GES)",
    "description": "Güneş enerjisi santralleri (GES) 1 MW'a kadar lisanssız, 1MW üzerinde lisanla inşa edilebilmektedir. Santralin kurulduğu alan yatırımcıya ait ya da kiralık olabilir ve bir binanın çatısına paneller yerleştirilebilir. İmalat aşamasına gelmeyen tesislerin değerlemesi boş arsa değerlemesi gibi yapılır. Lisans sahibi müşteri ve arazi maliki farklı ise aralarında kurdukları kira sözleşmesi ve tapuya tescil durumu incelenmelidir. Lisansız Elektrik üretimine ait yönetmeliğin 29. Maddesine göre geçici kabul olmayan üretim tesisleri devredilemez, sadece arsa devri yapılabilir; bu durumdaki tesislere yasal değer verilmez sadece mevcut durum değeri takdir edilir. Geçici kabulü yapılmış olmak kaydıyla, yönetmelik kapsamındaki üretim tesisi; satış, devir veya diğer bir düzenleme ile üretim faaliyeti göstermek isteyen başka bir gerçek veya tüzel kişiye devredilebilir. Geçici kabul işlemi ilgili bakanlık ya da yetkili dağıtım şirketi tarafından yapılmaktadır. GES tesisleri gelir yöntemi kullanılarak değerlendirildiğinden ticari işletme rehni ve/veya üretilen elektriğin satışından elde edilecek gelirlerin temlik alınması suretiyle teminat yapısı güçlendirilmelidir.",
    "reportText": "Güneş enerjisi santrali değerlemesi yapılmıştır.",
    "valuationMethod": "Güneş enerjisi santrali raporlarında,",
    "valueType": "Değer tespit açıklamalarına göre",
    "isNew": "Yeni"
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203A",
    "status": "KKTC Türk Koçanı",
    "description": "01.01.1964 tarihinde Rum kesimince tek taraflı olarak fesih edilen Londra anlaşması ile 16.08.1960 tarihinde kurulan ve iki toplumlu Kıbrıs Cumhuriyeti kayıtları esas alındığında, 20.07.1974 öncesinde de Kıbrıslı Türklere ait gayrimenkullere (arazi) ilişkin koçanlardır.",
    "reportText": "KKTC Türk Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203B",
    "status": "KKTC Eşdeğer Koçanı",
    "description": "20.07.1974 öncesinde Kıbrıslı Rumlara ait gayrimenkullere (arazi) ilişkin koçanlardır. 1974 yılı sonrası Kıbrıs Türk Yönetimince, güneyden kuzeye göç etmiş olan Kıbrıslı Türklere güneydeki malları karşılığında “EŞDEĞER” olarak dağıtılmış taşınmazlardır.",
    "reportText": "KKTC Eşdeğer Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203C",
    "status": "KKTC Tahsisli Arazi Koçanı",
    "description": "20.07.1974 öncesinde Kıbrıslı Rumlara ait gayrimenkul (arazi) koçanlarıdır. 15.11.1983 tarihinde KKTC’nin kurulması ile 1974 sonrasında adaya yerleşen Türk vatandaşlarına puanlama usulü tahsis edilen arazilere verilen koçanlardır. Eşdeğer koçanlardan farklı olarak Rum tarafında bir karşılığı bulunmamaktadır.",
    "reportText": "KKTC Tahsisli Arazi Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203D",
    "status": "KKTC Mücahit Koçanı",
    "description": "20.07.1974 öncesinde Kıbrıslı Rumlara ait gayrimenkul (arazi) koçanlarıdır. 15.11.1983 tarihinde KKTC’nin kurulması ile Rumlardan geçen/alınan arazilerin bir kısmı savaşta şehit/mücahit olan kişi ve yakınlarına belli bir puanlama usulü ile tahsis edilerek verilen arazilere ilişkin koçanlardır. Eşdeğer koçanlardan farklı olarak Rum tarafında bir karşılığı bulunmamaktadır. Her halükarda bu tip koçanlar eşdeğer ve/veya Türk malı statüsünde değildir.",
    "reportText": "KKTC Mücahit Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203E",
    "status": "KKTC Hazine Arazisi-Kiralık Arazi Koçanı, (Ayni Hak/Üst Hakkı)",
    "description": "Hazine Mallarında, 63/1993 sayılı Taşınmaz Hazine Malları (Kiralama ve Değerlendirme) Yasası’nın 13. maddesi koşullarının yerine getirilmesi gerekmektedir. İlgili Yasanın 13. maddesine istinaden, kiralanan taşınmaz hazine malı ile ilgili sözleşmelerin, Tapu ve Kadastro Dairesine kaydedilmesi, Devlet Emlak ve Malzeme Dairesinin yazılı iznine bağlıdır. Kaydı yapılmayan sözleşmeler bu yasa kurallarına göre ipotek konusu olmaz. Kaydı yapılan sözleşmelerle ilgili olarak, kiracıya “Devlet Hazine Malı Belgesi” verilir. Buna bağlı olarak ilgili Bakanlık ve Bakanlar Kurulu tarafından bir karar üretilerek ipoteğin kaydına ve satışına izin verilmesi ve daha sonra ipoteğin tesis edilmesi gerekmektedir.",
    "reportText": "KKTC Hazine Arazisi-Kiralık Arazi, (Ayni Hak/Üst Hakkı) Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203F",
    "status": "KKTC Vakıf Arazisi Koçanı",
    "description": "Vakıf beyannamesinde (senedinde) vakıf malının ipotek verilebileceği konusunda Mütevelli Heyetine açıkça yetki veren bir hüküm var ise, Mütevelli vakıf malını ipotek verebilir.",
    "reportText": "KKTC Vakıf Arazisi Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203G",
    "status": "KKTC Üçüncü Ülke/Yabancı Uyruklu Kişi Koçanı",
    "description": "20.07.1974 öncesinde, yabancı uyruklu ve/veya 3. Ülke mensubu kişilere ait olan koçanlar 1974 sonrası herhangi bir Türk Vatandaşına tahsis yoluyla verilmemiştir. Sonraki dönemde bu gayrimenkuller sadece satış yoluyla el değiştirmiştir. Söz konusu koçanların teminat olarak alınmasında sakınca bulunmamaktadır.",
    "reportText": "KKTC Üçüncü Ülke/Yabancı Uyruklu Kişi Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  },
  {
    "topic": "KKTC Koçanları",
    "code": "203H",
    "status": "KKTC Türkleştirilmiş Gayrimenkul Koçanı",
    "description": "20.07.1974 öncesinde, Rum malı olan, 67/2005 sayılı yasa ile Anayasanın 159. maddesinin 1’inci fıkrasının b bendi kapsamına giren Taşınmaz Malların Tazmini Takası ve İadesi Yasası gereğince bedeli ödenerek Türkleştirilmiş gayrimenkuller mevcuttur. Söz konusu gayrimenkuller üzerinde, ilgili Tapu ve Kadastro Dairesinden alınacak Araştırma Belgesi ile durumun teyit edilmesi kaydıyla ipotek tesis edilebilir.",
    "reportText": "KKTC Türkleştirilmiş Gayrimenkul Koçanlı taşınmazdır.",
    "valuationMethod": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "valueType": "Sadece sistemsel veri üretmek üzere bu madde ilave edilmiştir.",
    "isNew": ""
  }
];
});
