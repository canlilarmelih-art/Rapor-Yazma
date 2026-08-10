# Çoklu Talep (state.titleUnits[]) — Fonksiyonel Test Bulguları (2026-08-10)

Bu dosya, "Çoklu Talep" özelliğinin (bkz. `docs/coklu-takbis-import-plan.md`,
handoff.md 0.0.388-0.0.406) genel bir işlevsellik incelemesinin sonucudur.
Devam eden ajan (Codex veya yeni bir Claude oturumu) buradan kaldığı yerden
sürdürebilsin diye yazıldı.

## Yöntem ve kısıt

Admin girişi gerektiren UI (`createTitleUnitTabBar`, Excel panelleri) bu
projedeki standart kısıtlama nedeniyle **gerçek tarayıcıda uçtan uca
tıklanarak test edilemedi** (kimlik bilgisi girişi/hesap oluşturma yasak).
Bunun yerine:

1. `codebase-memory` grafiyle ve `grep`'le `TitleUnit` ailesi fonksiyonları
   ve çağıranları haritalandı.
2. Kaynak kodu satır satır okunarak veri modeli, kapsam (scope) listeleri ve
   render/gate koşulları karşılaştırıldı.
3. **En kritik bulgu (aşağıda #1) canlı bir Node sandbox'ında, app.js'İN
   GERÇEK `getTitleUnitScopedFieldKeys`/`switchActiveTitleUnit` fonksiyon
   gövdeleri ve GERÇEK `TITLE_UNIT_SCOPED_SECTION_IDS` sabiti metinden
   çıkarılıp çalıştırılarak DOĞRULANDI** (varsayım değil, çalıştırılmış
   kanıt) — script `tools/test-title-unit-switch.js`'teki `extractFunction`
   tekniğinin aynısını kullanır.
4. `npm run verify` çalıştırıldı — **tamamı yeşil**. Aşağıdaki bulguların
   çoğu tam da bu yüzden önemli: testler geçiyor ama gerçek davranışı
   doğrulamıyorlar (bkz. bulgu #4).

## Öncelik sırasıyla bulgular

### 1. [KRİTİK] "Bağımsız Bölüm"/"Değerleme"/"Ana Gayrimenkul" bölümleri KISMEN taşınmaza ayrılıyor — sessizce, tutarsız şekilde

`TITLE_UNIT_SCOPED_SECTION_IDS` (`app.js:1177-1180`) bir noktada
`["title","encumbrance"]`'dan şu hale genişletildi:

```js
const TITLE_UNIT_SCOPED_SECTION_IDS = [
  "case", "address", "title", "encumbrance", "planning", "documents", "land",
  "building", "unit", "comparables", "valuation",
];
```

Ama bu sabitin **hemen üstündeki yorum hâlâ eski/dar kapsamı anlatıyor**
(`app.js:1163-1176`): "Bağımsız Bölüm/Değerleme sekmeleri KASITLI OLARAK
KAPSAM DIŞI... bunları güvenle kapsamak ayrı, dikkatli bir denetim
gerektirir." Bu denetim **yapılmadan** liste genişletilmiş görünüyor.

Sorunun kaynağı: `getTitleUnitScopedFieldKeys()` (`app.js:1186`) yalnızca
`sections[].fields` içindeki **deklaratif** alanları taşınmaza göre ayırır.
Ama:

- `"building"` (Ana Gayrimenkul, `app.js:572-578`) → **`fields: []`** —
  hiçbir gerçek alanı deklaratif değil (blok/kat sayısı, yapı sınıfı, asansör
  vb. hepsi `createBuildingFloorDistribution` gibi ayrı panel
  fonksiyonlarında `state.fields`'a doğrudan yazılıyor).
- `"unit"` (Bağımsız Bölüm, `app.js:580-589`) → yalnızca **2 alan** deklaratif
  (`legalArea`, `currentArea`); oda/iç mekan/cephe/teras vb. onlarca alan
  (`createUnitAreaInteriorPanel` ve komşu fonksiyonlar) deklaratif DEĞİL.
- `"valuation"` (Değerleme, `app.js:606-621`) → 8 alan deklaratif ama
  değerleme yöntemi/karşılaştırma tablosu/hesap girdileri
  (`createValuationEditor`, `createValuationMarketTable`) deklaratif DEĞİL.

**Sonuç**: taşınmaz tabı değiştirildiğinde bu 3 bölümün SADECE deklaratif
alanları (toplam 10 alan) taşınmaza göre ayrılır/sıfırlanır; geri kalan
onlarca gerçek alan (oda sayısı, iç özellikler, bina sınıfı, değerleme
hesap girdileri) **TÜM taşınmazlar arasında paylaşılmaya devam eder** —
kullanıcıya HİÇBİR uyarı olmadan. Pratik etkisi: admin taşınmaz A için
Bağımsız Bölüm'ü doldurur, taşınmaz B'ye geçer, B için Bağımsız Bölüm'ü
"düzenler" — ama düzenlediği çoğu alan aslında A'yı da DEĞİŞTİRİR (aynı
değişkenler paylaşılıyor). Değerleme sonuçları için bu özellikle riskli:
banka çıktısına giden yasal/mevcut değer gibi 8 alan doğru ayrılır ama
değerleme YÖNTEMİ/gerekçe tablosu ayrılmaz — rapor taşınmazlar arası
tutarsız görünebilir.

**Doğrulama** (çalıştırıldı, `tools/verify-scope-gap.js` benzeri geçici
script — repo'ya eklenmedi): gerçek `getTitleUnitScopedFieldKeys()` ve
gerçek sabit kullanılarak `legalArea`'nın yeni taşınmaza geçince
`undefined` olduğu (yani AYRILDIĞI) doğrulandı — ama bu SADECE 10
deklaratif alan için geçerli, geri kalan onlarca "unit"/"valuation"/
"building" alanı için geçerli DEĞİL (onlar hiç `sections[].fields`'ta yok).

**Önerilen çözüm yönü**: ya (a) bu 3 bölümü tekrar
`TITLE_UNIT_SCOPED_SECTION_IDS`'ten çıkarıp plan dosyasındaki orijinal dar
kapsama dönülmeli, ya da (b) her ad-hoc panelin kullandığı GERÇEK alan
anahtarları çıkarılıp `getTitleUnitScopedFieldKeys()`'e (veya ayrı bir
"ek anahtar listesi"ne) eklenmeli — ikincisi çok daha büyük bir iş, plan
dosyasının kendisi de bunu "ayrı, dikkatli bir oturum" gerektirdiğini
söylüyor.

### 2. [KRİTİK] `tools/test-title-unit-switch.js` artık gerçek davranışı doğrulamıyor (yanlış güven veriyor)

`tools/test-title-unit-switch.js:93` testin KENDİ sandbox'ında
`TITLE_UNIT_SCOPED_SECTION_IDS`'in **eski/dar** bir kopyasını elle
tanımlıyor:

```js
const TITLE_UNIT_SCOPED_SECTION_IDS = ["address", "title", "encumbrance"];
```

Test, `getTitleUnitScopedFieldKeys`/`switchActiveTitleUnit` fonksiyon
GÖVDELERİNİ app.js'ten gerçek metinden çıkarıyor (`extractFunction`), ama bu
İKİ SABİTİ çıkarmıyor — kendi sabit kopyasını kullanıyor. Senaryo 6
(satır 217-227) tam olarak bunun üstüne kurulu:

```js
assert.equal(afterAdd.fields.legalArea, "120",
  "\"unit\" sekmesi alanı (legalArea) KAPSAM DIŞI olduğu için taşınmaz
  geçişinden etkilenmemeli (Faz 2 bilinçli sınırlama).");
```

Bu assertion **artık YANLIŞ** — bulgu #1'de kanıtlandığı gibi gerçek
app.js'te `legalArea` ARTIK kapsam İÇİNDE (taşınmaz değişince
`undefined` olur). Test yine de YEŞİL geçiyor çünkü sandbox kendi eski
sabitini kullanıyor, gerçek app.js sabitini DEĞİL. `npm run verify`'in
yeşil olması bu yüzden bulgu #1'i YAKALAYAMADI — testin kendisi bir
"regresyon güvenlik ağı" olmaktan çıkmış, "başlangıçtaki tasarım niyetini"
test eder hale gelmiş.

İlginç bir detay: aynı dosyada satır 76-82'de app.js'in gerçek metnine karşı
bir regex kontrolü VAR (`TITLE_UNIT_SCOPED_SECTION_IDS ... "address" ...
"valuation" ...`) — yani test YAZARI sabitin genişlediğinin FARKINDAYDI,
ama senaryo 6'yı buna göre güncellemeyi unutmuş/atlamış.

**Önerilen çözüm**: senaryo 6, sandbox'a kendi sabit kopyasını vermek yerine
app.js'ten GERÇEK `TITLE_UNIT_SCOPED_SECTION_IDS`/`TITLE_UNIT_SCOPED_TABLE_KEYS`
metnini de çıkarıp kullanmalı (aynı `extractFunction` tekniğiyle, ya da basit
bir regex ile). Böylece test bulgu #1'deki gibi bir sürüklenmeyi gelecekte
otomatik yakalar.

### 3. [ÖNEMLİ] Normal kullanıcı çoklu TAKBİS içe aktarabiliyor ama asla göremiyor/yönetemiyor

- `processTakbisUpload` artık **rol bağımsız** çoklu TAKBİS algılaması
  yapıyor ve `importTakbisRecordsIntoTitleUnits` (`app.js:16412`) ile
  bulunan TÜM kayıtları `state.titleUnits[]`'e yazıyor (handoff.md
  0.0.401, son iki madde — "çoklu seçim de tüm kullanıcılara açıldı").
- Ama taşınmaz-tabı-çubuğu (`createTitleUnitTabBar`, çağrı yeri
  `app.js:2271`) hâlâ ŞÖYLE gate'li:
  ```js
  if (["address", "title", "encumbrance"].includes(section.id)
      && isCurrentUserAdmin()
      && state.fields.requestType === "Çoklu Talep") {
  ```
  `isCurrentUserAdmin()` şartı KALDIRILMADI.

**Sonuç**: normal (admin olmayan) bir kullanıcı 3 taşınmazlı bir TAKBİS
PDF yüklerse, `requestType` otomatik "Çoklu Talep"e döner ve
`state.titleUnits`'e 2 ek taşınmaz yazılır (buluta senkronlanır) — ama bu
kullanıcı bunu görecek/düzenleyecek HİÇBİR arayüze sahip değil. Taşınmaz
2 ve 3, TAKBİS'ten gelen alanlarla (Ada/Parsel/Malik/İpotek) kalıcı olarak
"tamamlanmamış" durumda kalır (Adres/İmar/Bağımsız Bölüm/Değerleme hiç
girilmez) ve kullanıcı bunun farkına bile varmaz — rapor sessizce eksik
kalır. Bu, "tümüne uygula tüm ana başlıklar" işinden BAĞIMSIZ, daha temel
bir erişim sorunu.

**Önerilen çözüm**: ya multi-TAKBİS algılamasını da admin-only'e geri
çekmek (roll-back), ya da tab çubuğunu (en azından "görüntüle" modunda)
normal kullanıcılara da açmak — ikisi de bilinçli bir ürün kararı
gerektirir, kullanıcıya sorulmalı.

### 4. [ÖNEMLİ] "Dosya ve Rapor" (case) alanları taşınmaza göre ayrılıyor — muhtemelen YANLIŞ

`"case"` bölümü `TITLE_UNIT_SCOPED_SECTION_IDS`'e eklendi. Bu bölümün
alanları arasında **Banka, Müşteri/talep eden, İş adı, Randevu türü/tarihi,
Belediye inceleme tarihi, Yasal/Mevcut Kullanım Niteliği, Mülkiyet** var
(`app.js:80` civarı, `id: "case"` bloğu). `getTitleUnitScopedFieldKeys()`
yalnızca `requestType`'ı özel olarak hariç tutuyor (`app.js:1193`) —
Banka/Müşteri/İş adı/Randevu için böyle bir istisna YOK.

Ama plan dosyasının kendi mimari kararı (`docs/coklu-takbis-import-plan.md`,
"Onaylanan mimari kararlar") "Çoklu Talep"i **TEK rapor + N taşınmaz**
olarak tanımlıyor — yani Banka/Müşteri/İş adı/Randevu mantıken RAPOR
GENELİ olmalı, taşınmaz başına DEĞİL. Şu anki davranışla:

- Yeni bir taşınmaz tabı eklendiğinde Banka/Müşteri/İş adı BOŞ açılır —
  kullanıcı aynı bilgiyi taşınmaz başına TEKRAR girmek zorunda kalır.
- Taşınmazlar arasında FARKLI Banka/Müşteri girilmesi mümkündür (hiçbir
  engel yok) — export sırasında hangi taşınmaz aktifse onun Banka alanı
  kullanılır, bu da tutarsız/yanlış banka şablonu seçimine yol açabilir.
- `ownershipType` için (aynı bölümde) kısmi bir düzeltme zaten var:
  `syncMultiTitleUnitOwnershipType()` (`app.js:1320`) SADECE "Dikey/Yatay
  Kat İrtifakı" değerlerini tüm taşınmazlara zorla eşitliyor — bu, tam
  olarak aynı kategoriden bir sorunun (paylaşılması gereken bir alanın
  yanlışlıkla taşınmaza-özel hale gelmesi) bilinen bir yamasıdır. Banka/
  Müşteri/İş adı/Randevu için böyle bir yama YOK.

**Önerilen çözüm**: `requestType` deseni genişletilip (`field.key !==
"requestType"` → bir liste/bayrak) Banka/Müşteri/İş adı/Randevu türü/
Randevu tarihi/Belediye inceleme tarihi de kapsam dışına alınmalı — ya da
kullanıcıya bu alanların GERÇEKTEN taşınmaz başına farklı olabileceği
teyit ettirilmeli (bazı meslek pratiklerinde teorik olarak mümkün olabilir,
ama plan dosyasındaki karar bunun aksini söylüyor).

### 5. [KRİTİK — bilinen, hâlâ geçerliliği doğrulandı] Rapor ÇIKTISI (export) çoklu taşınmazı hiç bilmiyor

`src/templates/template-engine.js` ve `server.js` içinde `titleUnits`/
`getTitleUnitCount` referansı **SIFIR** (grep ile doğrulandı). Yani:

- Banka şablonu HTML render'ı (`/api/report-template-render`) ve gerçek
  `.docx` akışı (`/api/report-template-docx`) yalnızca o an
  `state.fields`/`state.tables`'ta ne varsa (aktif taşınmaz, export
  anında hangisiyse) onu kullanır.
- Bugün itibarıyla "Çoklu Talep" özelliği YALNIZCA veri girişini
  (tab çubuğu + Excel toplu içe/dışa aktarım + çoklu TAKBİS içe aktarma)
  kapsıyor — nihai rapor ÇIKTISINDA (Word/PDF/banka şablonu) birden fazla
  taşınmazı YANSITMANIN hiçbir yolu yok. Bu, plan dosyasında zaten "6.
  madde netleşmeden ele alınmayacak" diye not edilmiş ama kullanıcıya
  UI'da hiçbir uyarı/engelleme YOK — admin N taşınmazlı bir rapor
  hazırlayıp "Banka Şablonuyla Kaydet" dediğinde SESSİZCE yalnızca 1
  taşınmazlık bir çıktı alır, hata/uyarı vermez.

**Önerilen çözüm (kısa vadede, ucuz)**: export düğmesine, `getTitleUnitCount()
> 1` iken bir uyarı/onay diyaloğu eklemek ("Bu rapor N taşınmaz içeriyor,
çıktı yalnızca [X] taşınmazını yansıtacak, devam edilsin mi?") — asıl
çoklu-taşınmaz export tasarımı ayrı, büyük bir iştir.

### 6. [ORTA] "Ana Gayrimenkul Özellikleri" bölümünde Excel toplu araç çubuğu hiç görünmüyor

`createSectionExcelPanel()` guard'ı (`app.js:14933`):
```js
if (!window.RaporMultiRequestXlsx || !section?.fields?.length) return null;
```
`"building"` bölümünün `fields: []` olması nedeniyle (bkz. bulgu #1) bu
bölüm için panel HİÇ render edilmiyor. Kullanıcı diğer TÜM ana bölümlerde
(Tapu, Takyidat, İmar, Belgeler, Arsa, Bağımsız Bölüm, Emsaller, Değerleme,
Adres) sağ üstte Excel indir/yükle araç çubuğunu görürken, "Ana
Gayrimenkul Özellikleri"nde göremez — sebebi kullanıcıya hiç
açıklanmıyor, kasıtlı mı unutulmuş mu belirsiz. En azından dokümante
edilmeli.

### 7. [ORTA] `docs/coklu-takbis-import-plan.md` artık kodla çelişiyor

Plan dosyası hâlâ şunu söylüyor: *"Bağımsız Bölüm/Değerleme sekmelerine
tab desteği — kasıtlı olarak ertelendi... ayrı bir denetim/oturum
gerektiriyor"* ve bunu "HENÜZ YAPILMADI" listesinin 2. maddesi olarak
işaretliyor. Ama kod (bulgu #1) bu iki bölümü (+ building/case/planning/
documents/land/comparables) ÇOKTAN `TITLE_UNIT_SCOPED_SECTION_IDS`'e
eklemiş — muhtemelen "Ana bölümlerin çoklu Excel aktarımı" işi sırasında
(handoff 0.0.389 civarı), bu genişlemenin kendisinin plan dosyasındaki
"ayrı, dikkatli denetim" şartını karşılayıp karşılamadığı hiç
değerlendirilmeden. Belge güncellenmeli (ya "denetim yapıldı, kısıtlı ama
bilinçli" ya da bulgu #1'e göre kapsam geri daraltılmalı).

### 8. [DÜŞÜK] Ölü/kafa karıştırıcı fallback anahtarlar: `titleBlockNo`/`titleParcelNo`

`getSharedNarrativeParcelPhrase()` (`app.js:2969` civarı) ve
`hasMixedTitleUnitParcels()` (`app.js:14908`) şu deseni kullanıyor:
```js
String(unit.blockNo || unit.titleBlockNo || "").trim()
String(unit.parcelNo || unit.titleParcelNo || "").trim()
```
Ama `titleBlockNo`/`titleParcelNo` kod tabanının HİÇBİR yerinde gerçek bir
alan anahtarı olarak tanımlı değil (yalnızca `blockNo`/`parcelNo` var,
`app.js:424-425`). Davranışsal bir hataya yol açmıyor (blockNo/parcelNo
zaten önce deneniyor ve her zaman var) ama okuyanı yanıltıyor — sanki
böyle bir alternatif alan varmış izlenimi veriyor. Temizlenebilir.

### 9. [DÜŞÜK] Kullanılmayan CSS sınıfı: `.section-excel-panel--mixed-parcels`

`hasMixedTitleUnitParcels()` sonucuna göre `createSectionExcelPanel`
(`app.js:14932` civarı) panel'e `section-excel-panel--mixed-parcels`
sınıfı ve `data-parcel-scope="mixed"` niteliği ekliyor (0.0.406,
`app.js` satır ~14935-14937) ama `styles.css`'te bu sınıf için HİÇBİR
kural yok (grep ile doğrulandı) — şu an tamamen görünmez/etkisiz. Ya
gerçek bir görsel uyarı eklenmeli (örn. "Bu bölümdeki taşınmazlar farklı
ada/parselde, dikkatli kontrol edin" rozeti), ya da bu ölü altyapı
kaldırılmalı.

### 10. [DÜŞÜK — bilinen, doğrulandı] `sourceValues.takbis` rozeti taşınmaz bazlı değil

Plan dosyasında zaten not edilmiş: TAKBİS kaynak-rozeti bookkeeping'i
yalnızca EN SON aktarılan kaydı yansıtır, alan DEĞERLERİ etkilenmez —
kozmetik. Değişen bir şey yok, tekrar teyit edildi.

## Test kapsamı özeti

Mevcut testler (`npm run verify` zincirinde, hepsi yeşil):
`test-title-unit-model.js`, `test-title-unit-switch.js`,
`test-title-unit-import.js`, `test-multi-takbis-split.js`,
`test-multi-environment-subject.js`, `test-multi-encumbrance-grouping.js`,
`test-encumbrance-intro-sentence.js`.

**Kapsamıyor**:
- Bulgu #1 (unit/valuation/building kısmi ayrım) — hiçbir test bunu
  kontrol etmiyor, aksine test #2 (stale fixture) yanlışlıkla TERSİNİ
  doğruluyormuş gibi görünüyor.
- Bulgu #3 (normal kullanıcı erişim boşluğu) — hiçbir test rol bazlı
  tab-çubuğu görünürlüğünü kontrol etmiyor.
- Bulgu #4 (case alanlarının taşınmaza göre ayrılması) — hiçbir test
  bank/customerName/caseName'in taşınmaz geçişinde ne olduğunu kontrol
  etmiyor (yalnızca ownershipType için `syncMultiTitleUnitOwnershipType`
  testi var).
- Export/template tarafı (bulgu #5) için hiç test yok (zaten hiç kod da
  yok).
- Gerçek admin girişiyle uçtan uca tarayıcı testi (plan dosyasının
  "HENÜZ YAPILMADI" #1 maddesi) — hâlâ yapılmadı.

## Codex için önerilen sıradaki adımlar (öncelik sırasıyla)

1. **Bulgu #2'yi düzelt** (test artık gerçek sabiti kullansın) — küçük,
   düşük riskli, ama bulgu #1'in bir daha sessizce tekrarlanmasını önler.
2. **Bulgu #1 için bir ürün kararı al**: unit/valuation/building'i
   TITLE_UNIT_SCOPED_SECTION_IDS'ten çıkar (güvenli, hızlı) VEYA ad-hoc
   panel alanlarını da kapsama al (büyük iş). Kullanıcıya sorulmalı.
3. **Bulgu #3 ve #4 için kullanıcıya sor** — bunlar davranış/ürün kararı,
   kod kusuru değil ama mevcut hâliyle veri kaybı/tutarsızlık riski
   taşıyorlar.
4. Bulgu #5 için en azından export-öncesi uyarı ekle (ucuz, yüksek
   değer — sessiz veri kaybını önler).
5. Bulgu #6/7/8/9 küçük temizlik işleri, ayrı bir "toplu temizlik"
   PR'ında toplanabilir.
