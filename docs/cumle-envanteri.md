# Cümle / Paragraf Envanteri — Versiyonlama Çalışması

**Amaç** (kullanıcı talebi, 2026-08-07): Programda otomatik üretilen tüm cümle/paragrafları
bölüm bölüm listelemek — sonraki adımda her birine **farklı versiyonlar** (aynı
placeholder'lara sahip, farklı cümle/paragraf yapısına sahip alternatif metinler)
eklenecek. Amaç: farklı kullanıcıların aynı taşınmaz için hazırladığı raporların
metinsel olarak **birebir aynı** çıkmasını önlemek (bkz. "Tekrarlanan Ada/Parsel
Tespiti" kartı, 0.0.356 — bu envanter o riskin **kök çözümü**: tespit yerine önleme).

**Nasıl okunur:** Her satır bir fonksiyonu (`app.js`, aksi belirtilmedikçe) ve o
fonksiyonun ürettiği sabit cümle kalıbını/kalıplarını gösterir. "Varyant" sütunu
alternatif ifadeleri içerir (V1/V2 gibi) — bunlar şu an yalnızca METİN olarak
bu dosyada duruyor, `app.js`'te henüz KODA dönüştürülmedi (bkz. "Durum ve
Sıradaki Adım" bölümü).

**İlerleme:** Bu dosya bölüm bölüm dolduruluyor. Şu an tamamlanan bölümler
aşağıda işaretli; kalanlar için onay bekleniyor.

## Varyant Stratejisi (kullanıcı notu, 2026-08-07)

Varyant üretirken **eş anlamlı kelime/ifade değişimi** öncelikli teknik olarak
kullanılacak — placeholder'lar ve anlam AYNI kalır, yalnızca kelime seçimi ve
cümle kuruluşu değişir. Örnek eş anlamlı kümeler (rapor bağlamında serbestçe
birbirinin yerine geçebilir):

| Kavram | Eş anlamlı/alternatif ifadeler |
|---|---|
| Taşınmaz (özne) | taşınmaz · gayrimenkul · mülk · söz konusu yer |
| "Ekspertize konu taşınmaz" (giriş öznesi) | ekspertize konu taşınmaz · değerlemeye konu gayrimenkul · rapor konusu mülk · söz konusu taşınmaz |
| Konumlanma | konumludur · yer almaktadır · bulunmaktadır · konumlanmaktadır |
| Tespit/sonuç fiilleri | tespit edilmiştir · belirlenmiştir · değerlendirilmiştir · kanaatine varılmıştır · görülmüştür |
| Bağımsız bölüm | bağımsız bölüm · birim · taşınmaz (bağlama göre) |

Bir sonraki aşamada her fonksiyon için bu tarz eş anlamlı/yeniden-kurgulanmış
2-3 alternatif cümle üretilip "Varyant" sütununa eklenecek; raporun anlamı ve
doldurduğu placeholder'lar DEĞİŞMEYECEK.

- [x] 1. Adres, Konum ve Çevre Özellikleri
- [x] 2. Tapu ve Mülkiyet
- [x] 3. İmar Durumu (en yüksek öncelikli kalıplar; proje uygunluğunun kalan ~8 alt-durumu devam ediyor)
- [ ] 4. Ana Gayrimenkul / Bina Özellikleri
- [ ] 5. Bağımsız Bölüm İç Özellikleri
- [x] 6. Değerleme (Değer Tespiti, Satış Kabiliyeti, Kira, Hisse) — en yüksek öncelikli kalıplar; `buildTarlaValuationRiskExplanation` uzun paragrafı ve birkaç düşük-sıklıklı koşullu metin devam ediyor
- [x] 7. Emsaller — en yüksek öncelikli (Emsal Piyasa Analizi paragrafları) tamamlandı; per-kart karşılaştırma/hesaplama cümleleri kısmen devam ediyor
- [ ] 8. Takyidat
- [ ] 9. Ziraat/Arsa-Arazi'ye özel metinler
- [ ] 10. GDYS/GABİM'e özel metinler

---

## 1. Adres, Konum ve Çevre Özellikleri

| Fonksiyon | Ne Üretiyor | Örnek Sabit Kalıp | Varyant |
|---|---|---|---|
| `buildEnvironmentalIntro()` | Konum paragrafının giriş cümlesi — ekspertize konu taşınmazın il/ilçe/mahalle/ada/parsel bilgisiyle açılışı | "Ekspertize konu taşınmaz, {il} ili, {ilçe} ilçesi, {mahalle} mahallesinde, {ada} ada, {parsel} parsel üzerinde ... konumludur." | **V1:** "Değerlemeye konu gayrimenkul, {il} ili, {ilçe} ilçesi, {mahalle} mahallesinde, {ada} ada, {parsel} parsel üzerinde ... yer almaktadır." **V2:** "Rapor konusu mülk, {il} ili, {ilçe} ilçesi, {mahalle} mahallesinde, {ada} ada, {parsel} parsel üzerinde ... konumlanmaktadır." |
| `formatEnvironmentalUnitDescriptor()` | Giriş cümlesine eklenen "... konumlu {bina/blok/kat} ... bağımsız bölümde" ifadesi | (yardımcı, `buildEnvironmentalIntro` içinde kullanılır) | Üst fonksiyon (`buildEnvironmentalIntro`) ile birlikte varyantlanır, ayrı ele alınmadı. |
| `appendEnvironmentalIntroProximity()` | Giriş cümlesine yakın çevre/ana arter yakınlığı ekler | "... konumludur." sonrasına eklenen yakınlık ifadesi | Üst fonksiyonla birlikte varyantlanır. |
| `formatEnvironmentalBuildingPhrase()` | Site/blok adı varsa "{site} sitesi, {blok} blok" gibi bina tanımlayıcı ifade üretir | — | Kısa/yapısal ifade, düşük öncelik — şimdilik atlandı. |
| `formatEnvironmentalFloorPhrase()` | Kat bilgisini cümle içine uygun hale getirir ("{kat}. katında" vb.) | — | Kısa/yapısal ifade, düşük öncelik — şimdilik atlandı. |
| `buildCommercialFunctionSentence()` | Ticari bölge yoğunluğu paragrafı (3 cümle: yoğunluk/hareketlilik + etki + yapılaşma tamamlanma durumu) | "Taşınmazın bulunduğu bölge, ticari fonksiyonların {yoğun/orta/seyrek} geliştiği ... bir konumda yer almaktadır." + "Ticari hareketliliğin {…} olması, görünürlük ve erişilebilirlik açısından {avantaj/dezavantaj} oluşturmaktadır." + "Bölge genelinde yapılaşma {tamamlanmış/tamamlanmamış} olup, taşınmazın konumu ticari kullanım ve yatırım açısından {olumlu/standart} nitelik taşımaktadır." | **V1 (giriş):** "Gayrimenkulün konumlandığı bölge, ticari faaliyetlerin {yoğunluk} düzeyde yoğunlaştığı, {hareket kaynağı} {hareket} seviyede olduğu bir alanda bulunmaktadır." **V1 (etki — seyrek/orta/yoğun):** "Ticari hareketliliğin sınırlı kalması, taşınmazın görünürlüğü ve erişilebilirliği bakımından bir dezavantaj teşkil etmektedir." / "...orta düzeyde seyretmesi, görünürlük ve erişim kolaylığı açısından dengeli bir konum avantajı sunmaktadır." / "...yüksek düzeyde olması, görünürlük ve erişim kolaylığı bakımından belirgin bir avantaj sağlamaktadır." **V1 (tamamlanma):** "Bölgedeki yapılaşmanın büyük ölçüde tamamlanmış olması, taşınmazın ticari kullanım ve yatırım potansiyeli açısından olumlu bir unsur olarak değerlendirilmektedir." / "...henüz tamamlanmamış olması ... standart düzeyde kalmasına neden olmaktadır." |
| `buildIndustrialUsePurposeText()` | Sanayi bölgesi kullanım amacı ifadesi (Ziraat/arsa şablonlarında) | Varsayılan: "sanayi tesisleri" | **V1:** "sanayi yapıları" **V2:** "sanayi amaçlı tesisler" |
| `buildAgriculturalActivityText()` | Tarımsal faaliyet türü ifadesi (Ziraat/arsa şablonlarında) | Varsayılan: "bitkisel üretim, hayvancılık ve tarıma dayalı kullanım" | **V1:** "tarımsal üretim, hayvancılık ve tarım kökenli faaliyetler" **V2:** "bitkisel ve hayvansal üretim ile tarımsal amaçlı kullanım" |
| `buildEnvironmentalDescription()` | **Ana konum/çevre paragrafı** — yukarıdaki giriş cümlesini; yapılaşma nizamı, kat aralığı, yapılaşma yoğunluğu/hızı, bina yaşı, gelir seviyesi, ulaşım ana arteri, altyapı seviyesi, sosyal ihtiyaç mesafesi gibi 10+ değişkene göre üretilen alt cümleleri birleştirir. {{ÇEVRE_METNİ}} / `{{ENVIRONMENTAL_FEATURES_TEXT}}` placeholder'ının kaynağı. | (çok parçalı, tek bir sabit kalıp yok — her alt cümle kendi koşuluna göre değişir) | Bu fonksiyon çok parçalı olduğundan varyant çalışması alt-fonksiyonlar (`buildEnvironmentalIntro`, `buildCommercialFunctionSentence` vb.) üzerinden yapılıyor; kalan alt cümleler (yapılaşma nizamı/hızı, bina yaşı, altyapı vb.) için varyant yazımı **devam ediyor**, sonraki turda tamamlanacak. |
| `buildZiraatLocationEnvironmentalExplanation()` | Ziraat Bankası şablonuna özel konum/çevre paragrafı (ayrı, daha kısa bir varyant) | "Bölgede ağırlıklı olarak {nizam} nizamlı yapılaşma görülmektedir." + "Bölgedeki yapılaşma hızı {hız} seviyededir." + "Taşınmazın bulunduğu yakın çevrede genellikle {kat} katlı ve {amaç} amaçlı yapılaşma söz konusudur." | **V1:** "Bölge genelinde çoğunlukla {nizam} nizamda bir yapılaşma dokusu bulunmaktadır." + "Bölgenin yapılaşma temposu {hız} olarak değerlendirilmektedir." + "Gayrimenkulün yakın çevresinde ağırlıklı olarak {kat} katlı, {amaç} amaçlı bir yapılaşma söz konusudur." |
| `buildOpenAddressText()` | Açık adres metni (il/ilçe/mahalle/cadde/site/blok/kat/dış kapı no birleşimi) — `{{ACIK_ADRES}}` kaynağı | Yapısal birleştirme, sabit bağlaç kalıpları var | **Varyantlanmıyor (bilinçli):** bu bir adres — aynı gerçek adres için farklı kullanıcılar da doğal olarak AYNI adresi yazar, bu şüpheli değil, beklenen bir durumdur. Varyant burada YANLIŞ/tutarsız adres izlenimi yaratabilir. |
| `formatOpenAddressNeighborhood()` / `formatOpenAddressBuildingName()` | Açık adres metninin mahalle/bina adı alt parçaları | — | `buildOpenAddressText` ile aynı gerekçeyle varyantlanmıyor. |
| `buildTransportDirectionText()` | Ana ulaşım arterine göre yön/mesafe cümlesi | — | Sonraki turda ele alınacak (henüz okunmadı). |
| `createTransportNearbyComposer()` | Yakın çevre (okul/hastane/AVM vb.) listesini cümleye döken kompozisyon fonksiyonu — `{{TRANSPORT_REPORT_TEXT}}` kaynağı | Liste + bağlaç kalıbı ("... ve ... gibi ihtiyaçlara yakın mesafededir.") | **V1:** "... ve ... gibi günlük ihtiyaçlara kısa mesafede ulaşım imkânı bulunmaktadır." |
| `gabimTransportationLevelText()` | GABİM veri seti için ulaşım imkanı seviyesi (kısa etiket, tam cümle değil) | — | Kısa etiket (cümle değil), varyant gerektirmiyor. |

---

---

## 2. Tapu ve Mülkiyet

| Fonksiyon | Ne Üretiyor | Örnek Sabit Kalıp | Varyant |
|---|---|---|---|
| `buildShareExplanation()` | Hisseli mülkiyet durumunda değerleme sonuç cümlesi — `{{HISSE_ACIKLAMASI}}` kaynağı | **TAMAMEN SABİT** (değişken içermez): "Değerleme konusu taşınmaz hisseli olup, TAŞINMAZIN TÜM HİSSELERİNİN (AÇIKTA HİSSE KALMAYACAK ŞEKİLDE) İPOTEK ALTINA ALINMASI ŞARTIYLA uzman kanaati SATILABİLİR olarak takdir edilmiştir." — **en yüksek öncelikli varyant adayı**, çünkü hisseli olan HER raporda birebir aynı çıkıyor. | **V1:** "Değerlemeye konu gayrimenkul hisseli mülkiyete tabi olup, GAYRİMENKULÜN TÜM HİSSELERİNİN (AÇIKTA HİSSE BIRAKILMAKSIZIN) İPOTEK ALTINA ALINMASI KOŞULUYLA uzman kanaatimizce SATILABİLİR nitelikte olduğu değerlendirilmiştir." **V2:** "Söz konusu mülk hisseli tapu kaydına sahip olup, TÜM HİSSELERİN (AÇIKTA HİSSE KALMAKSIZIN) İPOTEK KAPSAMINA ALINMASI ŞARTIYLA taşınmazın SATILABİLİR olduğu kanaatine varılmıştır." |
| `buildEncumbranceTitleRecordChangeParagraph(date, method)` | Tapu kaydı ile TAKBİS kaydı arasındaki farklılık paragrafı (Takyidat bölümünde) | "Tapu Kaydı Değişikliği:\n{tarih} tarihinde {yöntem} üzerinden alınan TKGM (TAKBİS) kaydı ile tapu senedi arasında {farklılık yok / X bölümlerinin değişmiş olduğu tespit edilmiştir.}" | **V1 (farklılık yok):** "Tapu Kaydı Değişikliği:\n{tarih} tarihli, {yöntem} üzerinden edinilen TKGM (TAKBİS) kaydı ile tapu senedi karşılaştırıldığında herhangi bir uyumsuzluğa rastlanmamıştır." **V1 (farklılık var, seçim yok):** "...bir farklılık bulunduğu ifade edilmiş olup, hangi kayıt bölümlerinin değiştiği belirtilmemiştir." **V1 (farklılık var, seçim var):** "...{liste} bölümlerinde değişiklik olduğu belirlenmiştir." |
| `formatTitleRecordChangeSummary()` | Tapu kaydı değişikliği — **yalnızca formdaki UI özet etiketi**, rapora basılan bir cümle DEĞİL ("Tapu kaydı değişikliği yok." gibi kısa durum metni) | (UI-only, düşük öncelik) | — |

**Not:** Malik/hisse ile ilgili çoğu fonksiyon (`parseTakbisOwners*`, `cleanTakbisOwner*`,
`formatOwnerShareSummary`, `getOwnerShareWarning` vb.) **veri ayrıştırma/doğrulama**
amaçlı — TAKBİS'ten gelen ham metni okunur hale getiriyor, kendi başına rapora
basılan bir cümle ÜRETMİYOR (isim/hisse listesi olarak `{{MALIK}}`/`{{SAHIPLER}}`
placeholder'larına düz veri olarak akıyor). Bu yüzden envantere alınmadı.

---

## 3. İmar Durumu

*Not: bu bölüm 1-2. bölümlerden çok daha büyük (~20 gerçek cümle/paragraf üreten
fonksiyon) — en yüksek öncelikli/en sık görülen kalıplara varyant yazıldı, geri
kalan durum-paragrafı ailesi (`composeImarPlanningStatusParagraphs` altındaki
5 alt-durum: Minimum Cephe Şartı, 18. Madde, Tevhid Şartı, Kentsel Dönüşüm,
Ruhsat Engeli) TEK bir ortak kalıba sahip olduğundan grup olarak ele alındı.*

| Fonksiyon | Ne Üretiyor | Örnek Sabit Kalıp | Varyant |
|---|---|---|---|
| `buildImarPlanningNote()` | **⭐ Ana İmar Durumu Açıklaması paragrafı** — `{{PLANNING_NOTE_TEXT}}` kaynağı, raporun en çok görülen/en riskli paragraflarından biri | "{kaynak önsözü}yer aldığı parsel, {plan tarihi} tarihli {plan ölçeği} ölçekli {plan adı} kapsamında {lejant} alanında yer almakta olup, {koşullar} yapılaşma koşullarına sahiptir." | **V1:** "{kaynak önsözü}bulunduğu parsel, {plan tarihi} tarihli {plan ölçeği} ölçekli {plan adı} çerçevesinde {lejant} alanı içerisinde kalmakta olup, {koşullar} yapılaşma şartlarını taşımaktadır." **V2:** "{kaynak önsözü}üzerinde yer aldığı parsel, {plan tarihi} tarihli {plan ölçeği} ölçekli {plan adı} uyarınca {lejant} alanında değerlendirilmekte olup, {koşullar} yapılaşma koşulları geçerlidir." |
| `composeImarInfoSourcePrefix()` | Yukarıdaki paragrafın kaynak-kurum önsözü | "{tarih} tarihinde {kurum} alınan bilgiye göre konu taşınmazın " | **V1:** "{tarih} tarihinde {kurum} edinilen bilgiye göre söz konusu taşınmazın " **V2:** "{kurum} {tarih} tarihinde temin edilen bilgiye göre ekspertize konu gayrimenkulün " |
| `composeImarConditionList()` / `formatImarFloorCount()` / `formatImarMeasurement()` / `formatImarDecimal()` | Yapılaşma koşulları listesi (nizam/kat/Hmax/TAKS/KAKS/bahçe mesafeleri) — `{Etiket}: {Değer}` formatında veri listesi | "{nizam} nizam, {kat} kat, Hmax: {…}, TAKS: {…}, KAKS/Emsal: {…}, Ön Bahçe: {…}, ..." | **Varyantlanmıyor (bilinçli):** bu sayısal/etiketli bir VERİ listesi (imar hakları), üslup değil — aynı parsel için farklı kelime kullanmak yanıltıcı/tutarsız olur, imar mevzuatı terimleri (TAKS/KAKS/Hmax) zaten standart. |
| `composeImarRoadSetbackSentence()` | Yola/parka terk cümlesi | (Terk var) "Taşınmazın yer aldığı parselin yola/parka{miktar} terki bulunmaktadır. Söz konusu terkin yapıya etkisi bulunmaktadır/bulunmamaktadır." (Terk yok) "Taşınmazın Yola/Parka terki bulunmamaktadır." | **V1 (var):** "Gayrimenkulün konumlandığı parselden yola/parka{miktar} terk ayrılmıştır. Bu terkin yapı üzerinde etkisi bulunmaktadır/bulunmamaktadır." **V1 (yok):** "Gayrimenkulün yer aldığı parselden yola/parka herhangi bir terk ayrılmamıştır." |
| `composeImarPlanningStatusParagraphs()` + `composeImarStatusParagraph()` (grup: Minimum Cephe Şartı, 18. Madde Uygulaması, Tevhid Şartı, Kentsel Dönüşüm, Ruhsat Engeli) | Her biri "{Başlık}: {koşul cümlesi}" formatında, koşul cümlesi hep aynı fiil çiftlerinden biri | "bulunmaktadır." / "bulunmamaktadır." / "yapılmıştır." / "yapılmamıştır." / "yer almaktadır." / "yer almamaktadır." | **Genel dönüşüm kuralı (V1):** bulunmaktadır→mevcuttur · bulunmamaktadır→söz konusu değildir · yapılmıştır→uygulanmıştır · yapılmamıştır→uygulanmamıştır · yer almaktadır→kapsamında bulunmaktadır · yer almamaktadır→kapsamı dışındadır — bu 5 alt-durumun hepsine aynı fiil-değişim tablosu uygulanır. |
| `buildProjectSuitabilityDescription()` + `buildProjectSuitabilityStatusSentence()` | **⭐ "Onaylı Projesine Uygunluk" paragrafı** — 10+ farklı durum (uygun/blok bazında uygun değil/mimari uygun değil/kullanım alanı uygun değil/trampa/ayna simetrisi vb.), her biri sabit cümle | En sık görülen ("UYGUNDUR"): "{lead}Ekspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur." İkinci en sık ("KULLANIM ALANI UYGUN DEĞİL"): "...kullanım alanı olarak projesine uygun değildir." | **V1 (uygun):** "{lead}Değerlemeye konu bağımsız bölüm; kat, kattaki konumu, alanı ve mimarisi itibarıyla onaylı projesine uygun bulunmuştur." **V2 (uygun):** "{lead}Söz konusu bağımsız bölümün kat, konum, alan ve mimari özellikleri onaylı projeyle uyumludur." **V1 (kullanım alanı uygun değil):** "{lead}Değerlemeye konu bağımsız bölüm vaziyet planı esas alındığında blok, kat ve mimari açıdan projesiyle örtüşmekte, ancak kullanım alanı bakımından projeden farklılık göstermektedir." *(Kalan ~8 durum için aynı desende varyant yazımı devam edecek.)* |
| `buildProjectSuitabilityBuildingReferenceSentence()` / `buildBuildingFootprintAndEntranceExplanation()` | Bina oturumu ve giriş açıklaması — **korumalı (server-side) placeholder**, `BINA_OTURUMU_VE_GIRIS_ACIKLAMASI` | "Bina oturumu; vaziyet planında belirtilen {referans} referansından tespit edilmiştir. Bina girişi, projesine göre binanın {seviye} ve yapının {yön} cephesinden sağlanmaktadır." | **V1:** "Bina oturumu, vaziyet planında yer alan {referans} referans alınarak belirlenmiştir. Bina girişi, onaylı projeye göre binanın {seviye} ile yapının {yön} cephesi üzerinden sağlanmaktadır." *(Bu placeholder sunucu tarafında YENİDEN ÜRETİLİYOR — bkz. `applyServerProtectedPlaceholderTokens`; varyant kodu YAZILIRSA server.js tarafında da uygulanmalı.)* |
| `buildStaticSuitabilityExplanation()` | Statik proje uygunluğu açıklaması | "Taşınmazın {kurum} dosyasında bulunan statik proje incelenmiştir. Statik proje, mimari proje ve mahal durum ile uyumludur/uyumlu değildir." | **V1:** "Gayrimenkule ait {kurum} dosyasındaki statik proje incelenmiş olup, statik projenin mimari proje ve yerinde tespit edilen mahal durumu ile uyumlu olduğu/olmadığı görülmüştür." |

---

## 6. Değerleme (Değer Tespiti, Satış Kabiliyeti, Kira, Hisse)

*BDDK riski açısından **en kritik bölüm** — bu paragraflar hemen hemen HER
raporda, en görünür yerde (Değerleme Sekmesi/Sonuç Detayı) çıkıyor ve genellikle
en az değişkenli (dolayısıyla en tekrarlanabilir) metinler bunlar.*

| Fonksiyon | Ne Üretiyor | Örnek Sabit Kalıp | Varyant |
|---|---|---|---|
| `buildValuationMethodExplanation()` | **⭐⭐ Değerleme Yöntemi Açıklaması** — `{{DEGERLEME_YONTEMI_ACIKLAMASI}}` kaynağı, hemen hemen HER raporda birebir aynı çıkan bir giriş paragrafı | "Konu gayrimenkulün değerlemesinde {yöntem} yaklaşım(lar)ı kullanılmıştır. Konumuz taşınmazın değerlendirmesinde civardaki alım satım rayiç değerleri ve günümüz ekonomik koşulları, taşınmazın konumu, yaşı, fiziki özellikleri, emsallerdeki pazarlık payları, arz/talep dengesi gibi dışsal etkenler dikkate alınmıştır." | **V1:** "Değerlemeye konu gayrimenkulün değer tespitinde {yöntem} yaklaşım(lar)ı esas alınmıştır. Söz konusu taşınmazın değerlendirilmesinde bölgedeki alım-satım rayiç bedelleri ile güncel ekonomik koşullar, taşınmazın konumu, yaşı, fiziksel nitelikleri, emsallerdeki pazarlık payları ve arz-talep dengesi gibi dışsal faktörler göz önünde bulundurulmuştur." **V2:** "Rapor konusu mülkün değerlemesinde {yöntem} yaklaşım(lar)ı uygulanmıştır. Mülkün değerlendirilme sürecinde civar alım-satım rayiçleri ve mevcut ekonomik konjonktür, taşınmazın konumu, yaşı, fiziki durumu, emsallerdeki pazarlık marjları ve arz-talep dengesi gibi harici unsurlar dikkate alınmıştır." |
| `buildValuationExternalAppraisalText()` | Dışarıdan ekspertiz yapıldıysa eklenen ek paragraf | "{sebep} sebebi ile dışarıdan ekspertiz yapılmış, taşınmazın alan ve mimari açıdan proje ile uygunluğu kontrol edilememiş olup proje ile uygun olduğu kabul edilmiştir. ..." | Sonraki turda ele alınacak (koşullu, daha az sık görülür). |
| `buildValuationUsageNatureDifferenceText()` / `buildAgriculturalUsageNatureDifferenceText()` | Yasal/mevcut kullanım niteliği farklıysa eklenen açıklama | "Ekspertize konu taşınmaz Tapu Kayıtlarına göre \"{yasal}\" Nitelikli olup, Mevcut Kullanımı \"{mevcut}\" nitelikli olduğu gözlemlenmiştir." + (fark oranına göre 2 farklı devam cümlesi) | Sonraki turda ele alınacak. |
| `buildValuationConstructionLevelRiskText()` | İnşaat seviyesi %100 altındaysa eklenen risk paragrafı | "Konu taşınmaz hali hazırda %{seviye} inşaat seviyeli olup, ... inşaatın herhangi bir nedenle tamamlanamama riski bulunmaktadır." | Sonraki turda ele alınacak. |
| `buildValuationSaleabilityExplanation()` | **⭐⭐ Satış Kabiliyeti Açıklaması** — en sık görülen ("Satılabilir") durumu TAMAMEN SABİT | "Değerlemeye konu taşınmaz yukarıdaki özellikleri sebebiyle tercih edilmektedir. Konumu, ulaşım imkânları ve diğer özellikleri dikkate alındığında SATILABİLİR olduğu kanaatine varılmıştır." | **V1:** "Söz konusu gayrimenkul yukarıda belirtilen özellikleri nedeniyle tercih edilen bir taşınmaz niteliğindedir. Konumu, ulaşım olanakları ve diğer nitelikleri birlikte değerlendirildiğinde SATILABİLİR olduğu görüş ve kanaatine varılmıştır." **V2:** "Rapor konusu mülk, sahip olduğu yukarıdaki özellikler nedeniyle talep gören bir gayrimenkul niteliğindedir. Konumu, ulaşım imkânları ve diğer nitelikleri birlikte ele alındığında SATILABİLİR nitelikte olduğu değerlendirilmiştir." |
| `buildValuationRentExplanation()` | Kira değeri açıklaması — `{{KIRA_ACIKLAMASI}}` kaynağı | "Ekspertize konu taşınmazın yasal ve mevcut kira değerinin {tutar} TL/ay olacağı görüş ve kanaatindeyiz." (yasal=mevcut durumunda) | **V1:** "Değerlemeye konu gayrimenkulün yasal ve mevcut kira bedelinin {tutar} TL/ay olacağı kanaatine varılmıştır." **V1 (yasal≠mevcut):** "...yasal kira bedelinin {X} TL/ay, mevcut kira bedelinin ise {Y} TL/ay olacağı değerlendirilmiştir." |
| `buildPropertyTaxDeclarationValueExplanation()` | Emlak beyan değeri açıklaması (değer varsa) | "{tarih öneki}{belediye} Emlak Servisinden alınan bilgiye göre değerlemeye konu taşınmazın {yıl} Yılı Emlak Beyan Değeri {tutar} TL'dir." | **V1:** "{tarih öneki}{belediye} Emlak Servisinden edinilen bilgiye göre, söz konusu gayrimenkulün {yıl} yılına ait emlak beyan değeri {tutar} TL olarak tespit edilmiştir." |
| `buildPropertyTaxDeclarationUnavailableExplanation()` | Emlak beyan değeri alınamadıysa — **neredeyse tamamen sabit**, çok sık görülür | "{belediye} Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir." | **V1:** "{belediye} Emlak Servisi nezdinde yapılan araştırmada, taşınmazın rayiç bedeline ilişkin bilgilerin malik dışındaki üçüncü kişilerle paylaşılmadığı belirtilmiştir." **V2:** "{belediye} Emlak Servisinden yapılan sorgulamada, gayrimenkulün rayiç değerine dair bilgilerin yalnızca malike açıklandığı, üçüncü kişilere verilmediği ifade edilmiştir." |
| `buildInsuranceConstructionCostExplanation()` | Sigortaya esas yapı birim maliyeti açıklaması | "Ana gayrimenkul yapı sınıfı {sınıf} olarak seçildiğinden sigortaya esas yapı yaklaşık birim maliyeti {tutar} olarak alınmıştır." | **V1:** "Ana gayrimenkulün yapı sınıfı {sınıf} olarak belirlendiğinden, sigortaya esas yaklaşık birim inşaat maliyeti {tutar} olarak dikkate alınmıştır." |
| `buildTarlaValuationRiskExplanation()` (→ `tarlaSaleabilityRiskExplanation` sabiti) | Tarla/Bahçe vasıflı taşınmazlar için **çok uzun, tamamen sabit** risk paragrafı (tarım girdi maliyeti, sınırlı talep, örf-adet, doğal etkiler vb.) | (~150 kelimelik tek paragraf, hiç değişken yok) | **Henüz yazılmadı** — uzunluğu nedeniyle ayrı, odaklı bir turda tam bir alternatif paragraf yazılacak. Tarla/bahçe raporu görece az olsa da, bu metin TAMAMEN SABİT olduğundan (hiç değişken yok) yüksek öncelikli. |
| `buildShareExplanation()` | *(Bkz. Bölüm 2 — Tapu ve Mülkiyet, zaten varyantlandı.)* | — | ✅ Bölüm 2'de tamamlandı. |
| `buildForeignCurrencyValuationExplanation()` | Döviz bazlı değer karşılıkları | "TCMB {tarih} tarihli döviz alış kurları esas alınarak {değer}: {tutar} TL karşılığı {usd} ve {eur}; ... Hesaplamada USD alış kuru {…}, EUR alış kuru {…} olarak dikkate alınmıştır." | **Varyantlanmıyor (bilinçli):** kur/tutar listesi — veri ağırlıklı, üslup değişikliği anlamsız (`composeImarConditionList` ile aynı gerekçe). |

---

## 7. Emsaller

*Bu bölüm İmar Durumu kadar (belki daha da) büyük — 30+ fonksiyon. Emsal Açıklaması
(`{{EMSAL_PIYASA_ANALIZI}}`) ve her emsal kartının tam metni raporun EN UZUN
serbest-metin bölümlerinden; aynı taşınmaz için aynı yakın emsaller kullanılırsa
bu paragraflar da neredeyse birebir aynı çıkar — bu yüzden Değerleme kadar
kritik. En yüksek öncelikliler (`src/comparables/comparable-market-analysis.js`
dosyasında, `app.js`'in DIŞINDA) tam paragraf varyantıyla yazıldı.*

| Fonksiyon | Ne Üretiyor | Örnek Sabit Kalıp | Varyant |
|---|---|---|---|
| `buildComparableMarketAnalysisText()` (→ `ComparableMarketAnalysis.buildComparableMarketAnalysisText`, `src/comparables/comparable-market-analysis.js`) | **⭐⭐⭐ Emsal Piyasa Analizi** — `{{EMSAL_PIYASA_ANALIZI}}` kaynağı, 2-3 uzun paragraf, raporun en uzun serbest metinlerinden biri, HER konut/işyeri raporunda çıkar | **P1:** "Değerleme konusu taşınmazın konumlu olduğu {mahalle/sokak} yürütülen saha çalışmaları kapsamında; taşınmaz ile benzer imar koşullarına, yapı kalitesine ve fonksiyonel özelliklere sahip toplam {sayı} adet emsal veri değerlendirmeye dahil edilmiştir. ... Bu doğrultuda, değerleme tablosunda yer alan emsal alanları, teknik olarak netleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye esas alınmıştır." **P2:** "Bölgede yapılan detaylı piyasa araştırmaları, yerel gayrimenkul danışmanları ile gerçekleştirilen görüşmeler ve toplanan verilerin değerlendirilmesi sonucunda; emsallerin konum, kat, cephe, manzarası ve iç mekan işçilik kalitesi gibi birim değerini doğrudan etkileyen kriterleri {yön} yönde uyumlandırılarak konu taşınmazın nihai birim değer takdirinde karşılaştırma tablosu olarak kullanılmıştır." **P3 (koşullu):** "Yapılan düzeltmeler sonucunda, emsallerin konu taşınmaza indirgenmiş birim değerlerinin {min} TL/m² ile {max} TL/m² aralığında dengelendiği görülmüştür. ... taşınmazın nihai birim değeri ... {değer} TL/m² olarak takdir edilmiştir." | **V1 (P1):** "Değerlemeye konu gayrimenkulün bulunduğu {mahalle/sokak} gerçekleştirilen yerinde incelemeler kapsamında; taşınmazla benzer imar durumuna, yapı niteliğine ve kullanım özelliklerine sahip toplam {sayı} adet emsal veri değerlendirmeye alınmıştır. ... Buna göre, değerleme tablosundaki emsal alanları, teknik olarak sadeleştirilmiş ve indirgenmiş proje alanları üzerinden değerlendirmeye dahil edilmiştir." **V1 (P2):** "Bölgede gerçekleştirilen kapsamlı piyasa incelemeleri, yerel emlak danışmanlarıyla yapılan görüşmeler ve elde edilen verilerin analiz edilmesi neticesinde; emsallerin konum, kat, cephe, manzara ve iç mekân işçilik kalitesi gibi birim değeri doğrudan etkileyen unsurları {yön} yönde dengelenerek gayrimenkulün nihai birim değer tespitinde karşılaştırma tablosu şeklinde kullanılmıştır." **V1 (P3):** "Uygulanan düzeltmeler neticesinde, emsallerin taşınmaza indirgenmiş birim değerlerinin {min} TL/m² - {max} TL/m² bandında yoğunlaştığı görülmüştür. ... gayrimenkulün nihai birim değeri ... {değer} TL/m² olarak takdir edilmiştir." |
| `buildLandComparableMarketAnalysisText()` | Aynı fonksiyonun Arsa/Tarla varyantı (arsa/tarla emsalleri için) | Yukarıdakine çok benzer, "yüzölçümü" vurgulu versiyon | Yukarıdaki V1 mantığı bu varyanta da uygulanacak (sonraki turda). |
| `buildComparableLongText()` | Her emsal kartının tam açıklama cümlesi (konum, yaş, kat/alan, karşılaştırma, pazarlık/kira, hesaplama) — rapor başına 3-4 kez tekrarlanan bir kalıp | Sabit açılış: "Ekspertize konu taşınmazla {konum}, {yaş}, {kat/alan bilgisi} ... {karşılaştırma cümlesi} {pazarlık/kira} {hesaplama}" | **V1 (yalnızca açılış):** "Değerlemeye konu gayrimenkulle {konum}, {yaş}, {kat/alan bilgisi} ..." *(Bu fonksiyon çok parçalı/birleştirmeli olduğundan tam varyant — alt fonksiyonlarla birlikte — sonraki turda tamamlanacak.)* |
| `buildComparableSubjectStatement()` | "Konu Taşınmaz" statüsündeki emsal kartı açıklaması | "Ekspertize konu taşınmaz satılık olup, {alan} olarak beyan edilmiş, {düzeltilmiş alan} olduğu bilinmektedir. {fiyat cümlesi} {pazarlık cümlesi}" | **V1:** "Değerlemeye konu gayrimenkul satışa sunulmuş olup, {alan} olarak beyan edilmiş, {düzeltilmiş alan} olduğu tespit edilmiştir. {fiyat cümlesi} {pazarlık cümlesi}" |
| `buildComparableGeneralStatement()` | "Genel" statüsündeki emsal kartı açıklaması (sözlü bilgi kaynaklı) | "{kaynak}den alınan sözlü bilgiye göre bölgede yer alan benzer özellikteki gayrimenkullerin m2 birim değerinin {aralık} civarında olabileceği bilgisi alınmıştır." | **V1:** "{kaynak}den edinilen sözlü bilgiye göre, bölgedeki benzer nitelikli gayrimenkullerin m² birim değerinin {aralık} arasında değişebileceği bilgisine ulaşılmıştır." |
| `buildComparablePositionComparisonText()` | Emsalin konu taşınmaza göre konum karşılaştırması | "{sebep}taşınmaza göre {çok daha iyi/daha iyi/çok daha vasat/daha vasat} konumda" / "benzer konumda" | Sonraki turda ele alınacak — `buildComparableFeatureComparisonText` ile birlikte cümle içine gömülü olduğundan entegrasyon dikkat gerektiriyor. |
| `buildComparableFeatureComparisonText()` | Emsalin konu taşınmaza göre iç özellik karşılaştırması | "Emsal, konu taşınmaza göre {çok daha iyi/daha iyi/çok daha vasat/daha vasat/benzer} iç özelliklere sahiptir." | **V1:** "Emsal, değerlemeye konu gayrimenkule kıyasla {…} iç özelliklere sahiptir." |
| `buildComparableBargainAndRentText()` | Pazarlık payı / kira değeri cümlesi | "Pazarlık payı vardır/yoktur." + (varsa) "Pazarlık payının yaklaşık %{oran}{, kira değerinin {tutar} olacağı} düşünülmektedir." | **V1:** "Emsalde pazarlık payı bulunmaktadır/bulunmamaktadır." + "Pazarlık payının yaklaşık %{oran}{, kira bedelinin ise {tutar} olacağı} değerlendirilmektedir." |
| `buildComparableCalculationText()` / `buildComparableSaleDateText()` / `buildComparableLocationText()` / `buildComparableWorkplaceFloorReductionExplanation()` | Hesaplama, satış tarihi, konum, kat indirgeme cümleleri (işyeri emsalleri) | — | Sonraki turda ele alınacak (henüz detaylı okunmadı). |

---

## Durum ve Sıradaki Adım

- **Varyant metinleri şu an İÇERİK olarak var, KOD olarak YOK.** Yukarıdaki V1/V2 sütunları
  yalnızca bu markdown dosyasında — `app.js` içinde henüz hiçbir fonksiyon
  değiştirilmedi, varyant döndüren kod yazılmadı.
- **Varyant SEÇİM mekanizması bilinçli olarak ERTELENDİ** (kullanıcı: "daha sonra
  ayarlayalım varyant seçimini") — hangi rapor hangi varyantı alacak (kullanıcıya
  sabit / rapor bazlı rastgele / elle seçim) sorusu henüz cevaplanmadı, bu yüzden
  kod entegrasyonu başlamadı.
- **Sıradaki adım (netleşecek):** ya (a) mevcut 5 bölümdeki eksik varyantları
  (özellikle `buildProjectSuitabilityStatusSentence`'ın kalan ~8 alt-durumu,
  `buildTarlaValuationRiskExplanation`'ın uzun tarla/bahçe risk paragrafı,
  `buildEnvironmentalDescription`'ın kalan alt cümleleri, Emsaller'de
  `buildLandComparableMarketAnalysisText`, `buildComparableLongText`'in tam
  kompozit varyantı, `buildComparablePositionComparisonText` ve henüz
  okunmamış 4 fonksiyon: `buildComparableCalculationText`/
  `buildComparableSaleDateText`/`buildComparableLocationText`/
  `buildComparableWorkplaceFloorReductionExplanation`) tamamlamaya devam,
  ya da (b) yeni bölümlere (Ana Gayrimenkul, Bağımsız Bölüm, Takyidat...)
  geçmek — kullanıcı onayı bekleniyor.
