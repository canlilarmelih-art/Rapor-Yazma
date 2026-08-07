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
- [ ] 6. Değerleme (Değer Tespiti, Satış Kabiliyeti, Kira, Hisse)
- [ ] 7. Emsaller
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

## Durum ve Sıradaki Adım

- **Varyant metinleri şu an İÇERİK olarak var, KOD olarak YOK.** Yukarıdaki V1/V2 sütunları
  yalnızca bu markdown dosyasında — `app.js` içinde henüz hiçbir fonksiyon
  değiştirilmedi, varyant döndüren kod yazılmadı.
- **Varyant SEÇİM mekanizması bilinçli olarak ERTELENDİ** (kullanıcı: "daha sonra
  ayarlayalım varyant seçimini") — hangi rapor hangi varyantı alacak (kullanıcıya
  sabit / rapor bazlı rastgele / elle seçim) sorusu henüz cevaplanmadı, bu yüzden
  kod entegrasyonu başlamadı.
- **Sıradaki adım (netleşecek):** ya (a) mevcut 3 bölümdeki eksik varyantları
  (özellikle `buildProjectSuitabilityStatusSentence`'ın kalan ~8 alt-durumu,
  `buildEnvironmentalDescription`'ın kalan alt cümleleri) tamamlamaya devam,
  ya da (b) yeni bölümlere (Ana Gayrimenkul, Bağımsız Bölüm, **Değerleme** —
  BDDK riski açısından en kritik bölüm, Emsaller, Takyidat...) geçmek —
  kullanıcı onayı bekleniyor.
