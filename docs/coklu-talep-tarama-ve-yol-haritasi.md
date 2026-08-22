# Çoklu Talep Tarama Raporu ve Yol Haritası

> Son güncelleme: 0.0.522 (2026-08-22), `app.js` gerçek kaynağı taranarak
> ve `npm run verify` (EXIT:0) ile doğrulanarak. Önceki tarama tarihinden
> bu yana pek çok madde çözüldü; bu revizyon her maddeyi kaynaktan tek tek
> yeniden doğrulayıp durumunu günceller (**[ÇÖZÜLDÜ]** / **[KISMEN]** /
> **[AÇIK]** etiketleriyle).

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
- Bölüm bazlı Excel içe/dışa aktarma (Tapu/Adres/İmar/Arsa/Belgeler/
  Bağımsız Bölüm/Değerleme — bkz. aşağıdaki "Eksik" bölümünde kapsam notu).
- Açılır liste alanlarının Excel düzenlemesine aktarılması.
- Çoklu JPG/KML harita çıktıları ve emsal krokisi etiketleri.
- Sahibinden, Hepsiemlak ve Emlakjet için konum merkezli arama URL'leri.
- İlk taşınmazın mülkiyet türünün tüm taşınmazlara aktarılması.
- **[YENİ]** Bağımsız Bölüm ve Ana Gayrimenkul'ün TÜM programatik alanları
  (oda/iç özellik/kat dağılımı vb.) artık tab değişiminde sızmıyor —
  `getUnitSectionFieldKeys()`/`getBuildingSectionFieldKeys()` ile scoped
  set'e dahil edildi, round-trip testleriyle doğrulandı.
- **[YENİ]** Değerleme'nin TÜM alt aileleri (Yapı Değeri/Sigorta/Arsa
  Değeri/Natamam İnşaat/Şerefiye/Kapitilizasyon/Piyasa Değeri alan-birim
  çiftleri, Değerleme Metodu, Satış Kabiliyeti + açıklaması) artık gerçekten
  taşınmaza-özgü — hem tab-geçiş kapsamında hem de "Değerleme Excel"inde.
- **[YENİ]** `landUnitValue` (Arsa M2 Birim Değeri) Kat İrtifakı'nda
  (Yatay/Dikey) GERÇEKTEN paylaşımlı — hem okuma yolu (aktif olmayan
  taşınmazların özet-tablo görünümü) hem yazma yolu (özet tablodan
  düzenleme) düzeltildi.
- **[YENİ]** Tapu/Adres/İmar/Arsa/Belgeler/Bağımsız Bölüm/Değerleme'nin
  7'si de kendi özet tablosuna VE banka şablonu çıktısına
  (`{{TASINMAZLARxxxTABLOSU}}`) sahip.
- **[YENİ]** "Seçili Taşınmazlara Kopyala" deseni (taşınmaz listesinden
  seçim + "Tümünü Seç" — Bağımsız Bölüm/Arsa/Değerleme/İmar'da) eski
  "Tümüne Uygula" tek-tık checkbox'larının çoğunun yerini aldı.
- **[YENİ]** Değerleme özet tablosunda TOPLAM satırı ve negatif değerler
  için kırmızı vurgu.

Ana kapsamlandırma ve tab geçiş motoru `app.js` içindeki `titleUnits`,
`TITLE_UNIT_SCOPED_SECTION_IDS` ve `switchActiveTitleUnit` yapıları
etrafında çalışmaktadır (bkz. Referanslar — dosya büyüdükçe satır
numaraları kayar, fonksiyon adıyla aramak daha güvenilir).

## Eksik veya Riskli Kısımlar

### 1. Bağımsız Bölüm ve Ana Gayrimenkul — **[ÇÖZÜLDÜ]** (veri kapsamı)

Tüm deklaratif VE programatik alanlar artık taşınmaz bazında doğru
ayrılıyor (`getUnitSectionFieldKeys()`/`getBuildingSectionFieldKeys()`,
2026-08-20 scoping-gap-fix, round-trip testleriyle doğrulanmış). Veri
BÜTÜNLÜĞÜ riski kalmadı — kalan risk artık Excel kapsamı (bkz. madde 6).

### 2. Değerleme — **[BÜYÜK ÖLÇÜDE ÇÖZÜLDÜ]**

Piyasa Değeri, Yapı Değeri/Sigorta/Arsa Değeri/Natamam İnşaat/Şerefiye/
Kapitilizasyon aileleri VE Değerleme Metodu/Satış Kabiliyeti (+ açıklaması)
artık taşınmaza-özgü, uçtan uca test edilmiş. `landUnitValue` Kat
İrtifakı'nda bilinçli olarak paylaşımlı (fiziksel gerekçe: tek arsa/birden
çok bağımsız bölüm) — hem okuma hem yazma yolu doğru çalışıyor.

### 3. Banka, müşteri ve iş bilgileri — **[ÇÖZÜLDÜ]** (2026-08-22, 0.0.522)

Önceki taramada "risk ihtimali" olarak işaretlenmişti, bir sonraki
revizyonda kaynaktan DOĞRULANDI ve düzeltildi: `bank`/`customerName`/
`caseName`/`appointmentType`/`appointmentDate`/`municipalityInspectionDate`
`TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS`'e eklenerek artık gerçekten
rapor-geneli paylaşımlı — yeni bir taşınmaz tabı eklendiğinde bu alanlar
artık BOŞ başlamıyor, herhangi birinde değişiklik diğerlerine de yansıyor.
`ownershipType` (kendi senkron-yayma mekanizması var) ve `legalUsageNature`/
`currentUsageNature`/`usageNatureDifference` (karma kullanımlı binalarda
GERÇEKTEN taşınmaza göre farklılaşabilir) BİLİNÇLİ OLARAK taşınmaza-özgü
bırakıldı. Test: `tools/test-title-unit-switch.js` senaryo 26d.

### 4. Word/PDF ve banka şablonu çıktısı — **[ÇÖZÜLDÜ]**

7 bölümün (Tapu/Adres/İmar/Arsa/Belgeler/Bağımsız Bölüm/Değerleme) hepsi
kendi özet tablosuna VE template-engine.js'teki `{{TASINMAZLARxxxTABLOSU}}`
placeholder'ına sahip — `grep -o 'TASINMAZLAR[A-Z]*TABLOSU' app.js` 7
benzersiz sonuç veriyor, hepsi test kapsamında.

### 5. Normal kullanıcı erişimi — **[AÇIK, DOĞRULANDI]**

Çoklu-taşınmaz tab çubuğunu/özet tablolarını açan 6 `renderSection()`
dalının (`planning`/`land`/`documents`/`valuation`/`unit`/`building`)
HEPSİ hâlâ `isCurrentUserAdmin() && state.fields.requestType === "Çoklu Talep"`
koşuluyla kapılı — Çoklu TAKBİS aktarımı normal kullanıcı için de
çalışabilse bile, taşınmaz başına düzenleme arayüzünü yalnızca admin
görebiliyor. Değişmedi.

### 6. Bölüm Excel kapsamı (Bağımsız Bölüm/Ana Gayrimenkul) — **[AÇIK, NETLEŞTİRİLDİ]**

Kaynaktan doğrulandı: `"building"` bölümünün `section.fields` dizisi
KELİMENİN TAM ANLAMIYLA BOŞ (`fields: []` — tüm alanlar programatik
yazılıyor) — `createSectionExcelPanel()` `!section?.fields?.length` iken
`null` döndüğünden Ana Gayrimenkul'ün HİÇ Excel paneli yok. `"unit"`
(Bağımsız Bölüm) bölümünün YALNIZCA 2 deklaratif alanı var (`legalArea`/
`currentArea`, ikisi de `hidden:true`) — yani Bağımsız Bölüm Excel paneli
VAR ama yalnızca bu 2 sütunu kapsıyor; oda sayısı/iç özellikler/cephe/kat
gibi `getUnitSectionFieldKeys()`'in kapsadığı onlarca programatik alan
Excel'e YANSIMIYOR. Aynı desen (`hidden: true` ile deklaratif hale
getirme — 0.0.520'de Değerleme'nin `valuationMethod`/`saleability` için
kullandığı yöntem) burada da uygulanabilir, ama alan sayısı çok daha
fazla olduğundan ayrı bir oturum/kapsam gerektirir.

### 7. Gerçek tarayıcı testi — **[AÇIK]**

Değişmedi — test paketi güçlü (`npm run verify`, tüm test dosyaları
kaynak-düzeyinde/sandbox'ta), ama çoklu TAKBİS → tablar → KML → POİ → JPG
→ Word/PDF akışı gerçek mobil/masaüstü tarayıcıda uçtan uca otomatik test
edilmiyor. Bu oturumdaki HER değişiklik notunda da "canlı tarayıcı testi
yapılamadı (giriş bilgisi yok)" olarak işaretlendi — yapısal bir kısıt
(admin girişi bu ortamda mevcut değil), araç eksikliği değil.

### 8. Çalışma ağacı durumu — **[GEÇERSİZ, KALDIRILDI]**

Önceki taramadaki "commitlenmemiş değişiklikler var" uyarısı o anın
görüntüsüydü (kalıcı bir mimari risk değil) — güncel durumda çalışma
ağacı temiz, her değişiklik `npm run verify` (EXIT:0) sonrası anında
commit+push+CI (yeşil) ile kapatılıyor (bkz. `handoff.md`, en güncel giriş
0.0.521). Bu madde artık takip edilmiyor.

## Yol Haritası

### Faz 1: Veri Bütünlüğü

1. ~~Bağımsız Bölüm, Ana Gayrimenkul ve Değerleme alanlarının tam envanterini çıkar.~~ **[ÇÖZÜLDÜ]**
2. ~~Her alanı taşınmaz bazlı veya rapor-geneli olarak sınıflandır.~~ **[ÇÖZÜLDÜ]** (Değerleme/Bağımsız Bölüm/Ana Gayrimenkul/`case` için).
3. ~~Tab değişiminde veri kaybı ve yanlış paylaşım testlerini tamamla.~~ **[ÇÖZÜLDÜ]**
4. Normal kullanıcıların çoklu talep arayüzüne erişim kararını netleştir. **[AÇIK]** (madde 5).

**Kalan öncelik**: Faz 1'in veri-bütünlüğü kısmı artık tamamlandı — kalan
tek açık madde normal kullanıcı erişim kararı (madde 5).

### Faz 2: Excel

1. Ana Gayrimenkul ve Bağımsız Bölüm için eksik Excel şemalarını ekle. **[AÇIK]** (madde 6 — Ana Gayrimenkul hiç yok, Bağımsız Bölüm eksik).
2. ~~Açılır liste seçeneklerini tek kanonik tanımdan Excel'e aktar.~~ **[ÇÖZÜLDÜ]** (`getSectionExcelOptions()` canlı DOM `<select>`'ten otomatik alıyor — 0.0.520'de Satış Kabiliyeti ile doğrulandı).
3. Excel yükleme sonrası başlık, seçenek ve ada/parsel eşleşme doğrulamasını güçlendir. **[KISMEN]** (başlık eşleme/JSON hata mesajları var — ada/parsel çakışma doğrulaması ayrıca denetlenmedi).
4. Bölüm bazlı Excel yükleme ve indirme davranışını tüm ana bölümlerde doğrula. **[KISMEN]** (mekanizma 7 bölümde çalışıyor, ama Bölüm Excel'in KENDİSİ hiç birim/entegrasyon testi almadı — bkz. madde 6 notundaki gözlem).

### Faz 3: Çıktı

1. Ortak açıklamaları şablona yalnızca bir kez aktar. **[ÇÖZÜLDÜ]**
2. ~~Taşınmaz bazlı detayları tablo veya taşınmaz blokları halinde üret.~~ **[ÇÖZÜLDÜ]** (7 özet tablosu + blok bazlı Belgeler/Ana Gayrimenkul tab yapısı).
3. Aynı ve farklı ada/parsel senaryoları için ayrı çıktı kuralları uygula. **[ÇÖZÜLDÜ]** (İmar/Arsa'nın `isPlanningScopedByAdaParsel()` koşullu gate'i, Değerleme özet tablosunun `showLandShareColumns` koşulu).
4. Eksik veri varsa çıktı öncesi açık uyarı göster. **[KISMEN]** (`getMissingRequiredFields()`/"Zorunlu alanlar" paneli var ve genişletiliyor — 0.0.521'de Satış Kabiliyeti Açıklaması eklendi — ama yalnızca AKTİF taşınmazı kontrol ediyor, diğer taşınmazlar ayrıca ziyaret edilmeden eksiklikleri görünmez).

### Faz 4: Harita ve Mobil

1. Üç KML'li gerçek senaryo için otomatik tarayıcı testi oluştur. **[AÇIK]**
2. Tüm KML sınırlarını, etiketleri ve POİ'leri JPG çıktısında doğrula. **[AÇIK]**
3. Emsal krokisinde konu taşınmaz ve emsal etiketlerinin doğru bağlandığını test et. **[KISMEN]** (kaynak-düzeyi test var, gerçek görsel karşılaştırma yok).
4. Mobilde portal açılışlarını ve harita parametrelerini ayrı ayrı doğrula. **[AÇIK]**

Bu faz genel olarak Faz 7 (gerçek tarayıcı testi, madde 7) ile aynı
yapısal kısıta bağlı — admin girişi bu ortamda mevcut değil.

### Faz 5: Son Temizlik

1. ~~Çoklu TAKBİS plan dosyasını mevcut kodla eşitle.~~ **[KISMEN]** (`docs/coklu-takbis-import-plan.md` ayrıca gözden geçirilmedi bu revizyonda).
2. ~~Eski veya çelişkili fonksiyon yorumlarını güncelle.~~ **[SÜREKLİ]** (her değişiklikte yapılıyor, `handoff.md`'ye bkz.).
3. ~~Sentetik sandbox testlerini gerçek sabit ve şemalardan besle.~~ **[ÇÖZÜLDÜ]** (fixture'lar gerçek `sections[]`/`TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS` ile senkron tutuluyor — bu revizyonda da 0.0.519/520 değişiklikleriyle güncellendi).
4. ~~Commitlenmemiş değişiklikleri ayrı bir özellik commit'i olarak test edip pushla.~~ **[ÇÖZÜLDÜ]**, madde 8'e bkz.

## Test Durumu

`npm run verify` (check + tüm test dosyaları) 0.0.522 itibarıyla EXIT:0 —
`case`/`unit`/`building`/`valuation`/`land`/`planning`/`documents`
bölümlerinin taşınmaz-bazlı kapsam, "Seçili Taşınmazlara Kopyala", Bölüm
Excel gate kablolaması ve özet tablo davranışları dahil geniş bir
regresyon paketiyle kapsanıyor. Çalışma ağacı temiz, her commit CI'da
(GitHub Actions "Verify and Deploy") ayrıca doğrulanıyor. Kapsanmayan tek
şey gerçek tarayıcı/mobil testi (madde 7).

## Referanslar

Dosya sürekli büyüdüğünden satır numaraları hızla kayıyor — güvenilir
arama için fonksiyon/const adını kullanın:

- `createEmptyTitleUnit()` — `titleUnits` veri modeli
- `TITLE_UNIT_SCOPED_SECTION_IDS` (const) — taşınmaz bazlı bölüm kapsamı
- `getTitleUnitScopedFieldKeys()` — taşınmaz alanlarının kapsamlandırılması
- `getValuationPerUnitOnlyFieldKeys()` — Değerleme'nin programatik alt-alanları
- `TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS` (const) — rapor-geneli paylaşımlı açıklama alanları (madde 3'ün düzeltileceği yer)
- `getKmlTargetIndexes()` — çoklu KML hedef eşleştirme
- `saveLocationMapForReport()` — konum haritası JPG çıktısı
- `createSectionExcelPanel()` — bölüm Excel paneli (madde 6)
- `getMissingRequiredFields()` — "Zorunlu alanlar" doğrulama paneli
- `docs/coklu-takbis-import-plan.md` — çoklu TAKBİS tasarım notu
- `docs/coklu-talep-fonksiyonel-test-bulgulari.md` — fonksiyonel test bulguları
- `handoff.md` — en güncel değişiklik günlüğü (0.0.500-0.0.522 arası bu taramanın çoğu maddesini kapsar)
