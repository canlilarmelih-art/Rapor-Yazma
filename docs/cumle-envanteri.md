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
- [ ] 3. İmar Durumu
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

*(Henüz doldurulmadı — kullanıcı talebi: "önce varyantları oluşturalım daha sonra ayarlayalım varyant seçimini", bu yüzden şu an yeni bölüm eklemek yerine 1-2. bölümlerdeki varyantları derinleştirmeye/tamamlamaya öncelik veriliyor.)*

---

## Durum ve Sıradaki Adım

- **Varyant metinleri şu an İÇERİK olarak var, KOD olarak YOK.** Yukarıdaki V1/V2 sütunları
  yalnızca bu markdown dosyasında — `app.js` içinde henüz hiçbir fonksiyon
  değiştirilmedi, varyant döndüren kod yazılmadı.
- **Varyant SEÇİM mekanizması bilinçli olarak ERTELENDİ** (kullanıcı: "daha sonra
  ayarlayalım varyant seçimini") — hangi rapor hangi varyantı alacak (kullanıcıya
  sabit / rapor bazlı rastgele / elle seçim) sorusu henüz cevaplanmadı, bu yüzden
  kod entegrasyonu başlamadı.
- **Sıradaki adım (netleşecek):** ya (a) mevcut 2 bölümdeki eksik varyantları
  (özellikle `buildEnvironmentalDescription`'ın kalan alt cümleleri,
  `buildTransportDirectionText`) tamamlamaya devam, ya da (b) yeni bölümlere
  (İmar, Ana Gayrimenkul, Bağımsız Bölüm, Değerleme...) geçmek — kullanıcı
  onayı bekleniyor.
