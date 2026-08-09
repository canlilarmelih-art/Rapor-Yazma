# Çoklu TAKBİS PDF İçe Aktarma — Tasarım Notu ve Durum (2026-08-09)

Bu dosya, Claude ile başlanan "çoklu tapu/TAKBİS PDF içe aktarma" özelliğinin
o oturumda varılan karar ve bulguları kaydeder — devam eden ajan (Codex veya
farklı bir Claude oturumu) buradan kaldığı yerden sürdürebilsin diye.

**Durum (2026-08-09, güncellendi): Faz 1'in ÇEKİRDEK ayrıştırma kısmı VE
salt-önizleme UI'ı app.js'e LANDLENDİ ve test edildi
(`splitMultiTakbisRowBlocks`, `readMultiTakbisPdf`,
`createMultiTakbisPreviewPanel`). Önizleme paneli admin-only/deneysel ve
`state.fields`/`state.tables`'a HİÇBİR ŞEY YAZMAZ — gerçek rapora
aktarma (tab-per-tapu UI + veri modeli, aşağıdaki madde 6) HENÜZ
BAŞLAMADI. Aşağıdaki "Faz 1 kod durumu" bölümüne bak.**

## Kullanıcının orijinal isteği

Kullanıcı örnek bir PDF verdi:
`C:\Users\90551\OneDrive\Masaüstü\OTOMASYON\HAZİRAN\NUROL DÜZCE\NUROL-202600008 düzce çoklu çalışma güncelleme\TKB_20260612182932035261.pdf`

Bu PDF **tek dosyada 43 ayrı taşınmaz (bağımsız bölüm) kaydı** içeren
"çoklu TAKBİS" formatında. İstek: bu tür dosyalardan taşınmaz sayısını ve
kayıtlarını otomatik ayrıştırıp sisteme aktarabilen bir sistem kurmak.
Öncelik sırası kullanıcı tarafından açıkça belirtildi:
1. Verilerin DOĞRU aktarılması (parse doğruluğu) — ÖNCELİKLİ
2. Sistem yapısı (veri modeli)
3. Template'lere nasıl aktarılacağı — SONRAKİ KONU, henüz tasarlanmadı

## Önemli kullanıcı kısıtı: giriş formatı belirsizliği

> "pdfler her zaman birleştirilmiş şekilde gelmeyebilir. Ayrı ayrı atılmış
> tek yada birleştirilmiş pdf dosyalarından toplam tapu adedini ve kayıtları
> çıkartabilmelisin. Burada güzel olan taraf şu: takbis pdf tek bir formatta
> başka formatta gelme durumu yok."

Yani: kullanıcı 1 birleştirilmiş PDF, N ayrı tek-kayıtlı PDF, veya bunların
karışımını yükleyebilir. Format HER ZAMAN aynı standart TAKBİS şablonu
(varyasyon yok) — bu da çözümü kolaylaştırıyor: "her yüklenen dosyayı aynı
ayırıcıyla blokla, tek-kayıtlı bir dosya zaten 1 blok üretir" mantığı hem tek
hem çoklu-kayıt dosyaları için AYNI KOD YOLUYLA çalışır.

## Onaylanan mimari kararlar (kullanıcı ile netleşti)

**Rapor yapısı**: TEK rapor içinde N adet "tapu birimi" (taşınmaz/bağımsız
bölüm). Aşağıdaki **4 sekme tapu-bazlı yatay tab çubuğuna** sahip olacak
(çubuk, ilgili sekmenin EN ÜSTÜNDE durur, tıklanınca o tapunun formu açılır):

- **Tapu ve Mülkiyet**
- **Takyidat**
- **Bağımsız Bölüm**
- **Değerleme**

Diğer tüm sekmeler (Adres, İmar, Ana Gayrimenkul, Emsaller, Açıklamalar vb.)
**PAYLAŞIMLI/ortak** kalır — aynı bina/parsel için tek kopya varsayılıyor.

**Tab isimlendirme kuralı** (kullanıcı talimatı):
- Aynı ada/parseldeki kayıtlar → **"Blok-BBNo"** formatı (örnek: `A-3`, `A-12`)
- Farklı ada/parseldeki kayıtlar → **"Ada/Parsel"** formatı

Bu, PDF'ten çıkan `Ada/Parsel` + `Blok/Kat/Giriş/BBNo` alanlarına bakılarak
otomatik gruplanabilir: aynı ada/parsel değerini paylaşan kayıtlar blok
isimlendirmesine girer, farklı olanlar ada/parsel isimlendirmesine girer.

**Veri modeli etkisi**: `state.fields` şu an TEK düz obje. Bu mimari,
`state.titleUnits` gibi bir **dizi** gerektiriyor. Tasarım kararı ve mevcut
kod durumu için aşağıdaki "Faz 2" bölümüne bak.

## Faz 2: state.titleUnits[] veri modeli (2026-08-09, plumbing LANDLENDİ)

**Tasarım kararı — ADDITIVE (ek), mevcut `state.fields`/`state.tables`'a
DOKUNMAZ:**

- `state.fields` ve `state.tables` **HER ZAMAN "birincil taşınmaz"ı** temsil
  eder — bugünkü TÜM tek-tapu raporlarının verisi, hiçbir dönüşüm/migrasyon
  OLMADAN, birebir aynı yerde kalır. Bu, "Tapu ve Mülkiyet" tab çubuğundaki
  **1. tab**a karşılık gelir.
- `state.titleUnits` **YENİ bir dizi** — yalnızca **EK taşınmazları** (2. ve
  sonraki tab'lar) tutar. Boş dizi (`[]`) = tek-tapu raporu = bugünkü %100
  kullanıcı davranışı, SIFIR risk.
- Neden bu yaklaşım (mevcut `fields`'ı da diziye çevirmek yerine): `createForm`
  (69 çağıran) ve `renderSection` (89 çağıran) gibi hub fonksiyonlar `state.fields`'a
  YÜZLERCE yerden doğrudan erişiyor (bkz. CLAUDE.md/AGENTS.md hub-fonksiyon
  uyarısı). Birincil taşınmazı da diziye taşımak bu erişimlerin TAMAMININ
  değişmesini gerektirirdi — devasa, tek seferde test edilemeyecek bir
  regresyon riski. Additive tasarım, mevcut kodu SIFIR değiştirerek yalnızca
  "tab 2+" için yeni bir katman ekler.

**Şu ana kadar LANDLENDİ (yalnızca veri modeli + saf yardımcı fonksiyonlar,
HİÇBİR UI/render bunları KULLANMIYOR henüz):**

- `loadState()` — fallback nesnesine `titleUnits: []` eklendi, merge
  mantığına `titleUnits: Array.isArray(stored.titleUnits) ? stored.titleUnits
  : fallback.titleUnits` eklendi. `saveState()` zaten `JSON.stringify(state)`
  ile TÜM state'i yazdığı için ayrı bir değişiklik gerekmedi.
- `cloud/cloud-sync.js` — `CLOUD_WHITELIST` dizisine `"titleUnits"` eklendi.
  `buildCloudReportPayload`/`applyPayloadToState` zaten genel bir
  key-listesi döngüsü kullandığı için ayrı kod gerekmedi.
- `createEmptyTitleUnit(overrides)` — yeni bir taşınmaz birimi
  `{ id, fields: {}, tables: {}, sourceFile: "" }` şeklinde üretir.
- `computeTitleUnitTabLabel(unit, allUnits)` — kullanıcının onayladığı
  adlandırma kuralını uygular: aynı ada/parselde birden fazla taşınmaz varsa
  `"Blok-BBNo"` (`A-3`), tekse veya farklı ada/parseldeyse `"Ada Parsel"`.
  Blok/BB No eksikse (veri gelmemişse) boş etikete düşmez, Ada/Parsel'e
  geri döner.
- Test: `tools/test-title-unit-model.js` (4 senaryo) — `npm run verify`
  zincirine eklendi.

**Tab çubuğu UI + anahtarlama motoru — LANDLENDİ (2026-08-09, 2. artış):**

Kullanıcı "faz 2 riskli kısmı yapalım" dedi. `createForm`/`renderSection`'ı
(89/69 çağıranlı hub fonksiyonlar, onlarca ayrı alan-kontrolü fonksiyonu
`state.fields`'a doğrudan erişiyor) TEK TEK yeniden yazmak yerine —
**"checkout/checkin" (takas) mimarisi** seçildi: `state.fields`/`state.tables`
HER ZAMAN "şu an aktif olan taşınmaz"ı temsil etmeye devam eder (createForm
dahil TÜM mevcut kod SIFIR değişiklikle çalışmaya devam eder); tab
değiştirilince aktif taşınmazın verisi kendi yuvasına (`state.titleUnits[i]`
veya birincil için `state.primaryTitleUnitShadow`) "park edilir", hedef
taşınmazın verisi `state.fields`/`state.tables`'a "yüklenir".

- **Kapsam kasıtlı olarak DAR** (`TITLE_UNIT_SCOPED_SECTION_IDS = ["title", "encumbrance"]`):
  yalnızca Tapu ve Mülkiyet + Takyidat taşınmaz-başına ayrılıyor. Bağımsız
  Bölüm/Değerleme sekmeleri KASITLI OLARAK KAPSAM DIŞI — onların gerçek alan
  yüzeyi `sections[].fields`'ta değil, onlarca ayrı panel/hesaplama
  fonksiyonuna yayılmış (`createUnitAreaInteriorPanel`,
  `createBuildingFloorDistribution`, değerleme hesap zinciri vb.); bunları
  güvenle kapsamak ayrı, dikkatli bir denetim ister.
- Yeni fonksiyonlar (app.js): `getTitleUnitScopedFieldKeys`,
  `snapshotTitleUnitScopedData`, `applyTitleUnitScopedData`,
  `getTitleUnitCount`, `getTitleUnitFieldsForLabel`, `getTitleUnitTabModels`,
  `switchActiveTitleUnit` (yalnızca state mutasyonu, render/saveState
  ÇAĞIRMAZ — sandbox'ta test edilebilir olması için bilinçli), `addTitleUnitTab`,
  `removeActiveTitleUnitTab`, `createTitleUnitTabBar` (DOM, admin-only).
- `state.activeTitleUnitIndex`/`state.primaryTitleUnitShadow` eklendi
  (loadState fallback+merge, CLOUD_WHITELIST) — sayfa yenilemede/cihazlar
  arası "hangi tab açıktı" ve birincilin "park edilmiş" verisi kaybolmasın
  diye persist edilir.
- Malikler tablosu (`state.tables.title`) ve Takyidat tabloları
  (`state.tables.encumbrance`/`encumbranceDeclarations`/`encumbranceAnnotations`/`encumbranceMortgages`)
  aynı takas mekanizmasıyla taşınmaza göre ayrılıyor.
- UI: "Tapu ve Mülkiyet"/"Takyidat" sekmelerinin EN ÜSTÜNDE (kullanıcı
  talimatı) tab çubuğu + "+ Taşınmaz Ekle"/"Bu taşınmazı sil" düğmeleri —
  admin-only (deneysel, gerçek rapor verisini değiştiriyor).
- Test: `tools/test-title-unit-switch.js` (6 senaryo — round-trip veri
  kaybı YOK, paylaşımlı/kapsam-dışı alanlar etkilenmiyor, malikler tablosu
  doğru ayrılıyor, birincil silinemiyor) — `npm run verify` zincirine
  eklendi. Admin girişi gerektirdiğinden gerçek tarayıcıda tıklama testi
  YAPILAMADI (standart proje kısıtlaması) — `node --check` + tam test
  suite'i + kod incelemesiyle doğrulandı.

**"Talep Türü" alanı — LANDLENDİ (2026-08-09, 3. artış):**

Kullanıcı "talep oluşturma ekranına talep türü kısmı girelim, tekli talep
çoklu talep olarak seçsek nasıl olur" dedi. `"Dosya ve Rapor"` sekmesine
(ilk alan) `requestType` eklendi: **"Tekli Talep"** (varsayılan) /
**"Çoklu Talep"**. Tab çubuğu artık İKİ koşulun İKİSİ de doğruyken görünür:
admin-only **VE** `requestType === "Çoklu Talep"`. Varsayılan "Tekli Talep"
olduğu ve mevcut/eski raporlarda bu alan hiç kayıtlı olmadığı için TÜM
mevcut raporlarda tab çubuğu sessizce gizli kalır — sıfır görsel değişiklik.
Güvenlik ağı: kullanıcı "Çoklu Talep"ten "Tekli Talep"e dönerse VE aktif tab
birincil değilse, otomatik olarak birincile geçilir (veri KAYBOLMAZ, kendi
yuvasına park edilir) — aksi halde tab çubuğu kaybolunca kullanıcı "yetim"
bir ek taşınmazın verisini görmeye devam ederdi. Test: 7. senaryo olarak
`tools/test-title-unit-switch.js`'e eklendi (kaynak-düzeyi doğrulama).

**Önizleme panelinden "Rapora Aktar" — LANDLENDİ (2026-08-09, 4. artış):**

Kullanıcı onayladı ("dediğin çok mantıklı yapalım"). `createMultiTakbisPreviewPanel`'e
"Rapora Aktar" düğmesi eklendi. Sıfırdan bir alan/tablo eşleme fonksiyonu
YAZILMADI — `processTakbisFile()`'ın (mevcut, kanıtlanmış tek-dosya TAKBİS
akışı) kullandığı AYNI `applyTakbisTitleFieldsToReport`/`applyTakbisOwnersToTable`/
`applyTakbisEncumbranceFieldsToReport`/`applyTakbisEncumbrancesToTable`
fonksiyonları yeni `importTakbisRecordsIntoTitleUnits(records)` orkestratörü
tarafından HER kayıt için tekrar çağrılıyor:

- İlk kayıt **BİRİNCİL** taşınmaza (index 0) yazılır — mevcut Tapu ve
  Mülkiyet/Takyidat verisinin ÜZERİNE yazar (düğmeye basmadan önce
  `window.confirm` ile açıkça uyarılıyor).
- Sonraki kayıtlar için `addTitleUnitTab`/`switchActiveTitleUnit` (takas
  motoru) ile YENİ tab'lar açılır.
- Birden fazla kayıt varsa `requestType` OTOMATİK `"Çoklu Talep"`a çekilir
  — tab çubuğu hemen görünür olur, kullanıcı ayrıca "Talep Türü"nü elle
  değiştirmek zorunda kalmaz.
- İşlem sonunda her zaman birincile (`index 0`) dönülür.

**Bilinen sınırlama**: `state.sourceValues.takbis` ("bu alan TAKBİS'ten mi
geldi" kaynak-rozeti bookkeeping'i) taşınmaz-bazlı DEĞİL — yalnızca EN SON
aktarılan kaydı yansıtır. Alan DEĞERLERİ tüm taşınmazlar için doğru
aktarılır; yalnızca kaynak rozeti diğer taşınmazlarda güncel kalmayabilir
(kozmetik, veri kaybı değil).

Test: `tools/test-title-unit-import.js` (4 senaryo — boş/geçersiz girdi,
tek kayıt/requestType zorlanmaz, üç kayıt/requestType zorlanır + round-trip
doğru, her kaydın kendi `sourceValues.takbis`'iyle eşleştiği) — apply*
fonksiyonları hafif stub'larla değiştirildi (o fonksiyonlar zaten
`processTakbisFile` akışında kanıtlanmış; burada test edilen YENİ
orkestrasyon mantığı).

**Ayrı buton KALDIRILDI, mevcut TAKBİS düğmesi konsolide edildi (2026-08-09, 5. artış):**

Kullanıcı haklı bir soru sordu: "zaten mevcutta takbis ekle butonu vardı
buradan çözemez miydik bunu?" — Cevap: evet, ve bu yapıldı. Önceki artışta
eklenen AYRI "Çoklu TAKBİS Önizleme" paneli/butonu (`createMultiTakbisPreviewPanel`)
TAMAMEN KALDIRILDI. Artık TEK buton var: "Dosya ve Rapor" > TAKBİS PDF.

- `processTakbisUpload(files)` — `createUploadGrid`'in "takbis" dalından
  çağrılır. **Admin + tek dosya**: önce `readMultiTakbisPdf` ile SESSİZCE
  "kaç kayıt var" yoklanır (probe); yoklama BAŞARISIZ olursa VEYA 1 kayıt
  bulunursa HER ZAMAN eski/kanıtlanmış `processTakbisFile()`'a (OCR yedek
  akışı DAHİL) düşülür — normal tek-tapu akışı sıfır regresyonla korunur.
  Yalnızca GERÇEKTEN >1 kayıt bulunursa çoklu akışa geçilir. **Admin + >1
  dosya**: input artık `multiple` (yalnızca admin için, `<input>`'a
  dinamik eklendi) — hepsi işlenip kayıtlar birleştirilir. **Normal
  kullanıcı**: DEĞİŞMEDİ, her zaman `processTakbisFile()` (tek dosya).
- Çoklu kayıt tespit edilince `pendingMultiTakbisImport` (modül-seviyesi,
  `state` DIŞINDA — `activeSectionId` gibi geçici UI durumu) doldurulur;
  "case" sekmesinde `createMultiTakbisPendingImportPanel()` (mevcut
  `createMultiTakbisPreviewTable`'ı yeniden kullanır) bir onay ekranı
  gösterir — "Rapora Aktar" / "Vazgeç".
- `importTakbisRecordsIntoTitleUnits` DEĞİŞMEDİ (bir önceki artıştan).

**"Tapu Kaydı Değişikliği" tümüne uygula — LANDLENDİ (2026-08-09, 6. artış):**

Kullanıcı: "Tapu Kaydı Değişikliği Var Mı? kutucuğunun yanına tüm
taşınmazlara uygulansın mı seçeneği olsun. seçildiğinde tüm taşınmazlara
uygulansın, sonra kullanıcı isterse manuel değiştirebilsin." Landlendi:

- Yalnızca birden fazla taşınmaz varken (admin + `getTitleUnitCount() > 1`)
  `titleRecordChange` alanının yanında "Tüm taşınmazlara uygulansın mı?"
  kutucuğu görünür.
- Kutucuk işaretlenince `applyTitleRecordChangeToAllTitleUnits()` çalışır:
  aktif taşınmazın `titleRecordChange` (Evet/Hayır) + `titleChangedRecords`
  (modal'dan seçilen kayıtlar) değerlerini TÜM diğer taşınmazlara (birincil
  dahil, `primaryTitleUnitShadow` üzerinden) BİR KEZ kopyalar, sonra
  kutucuk kendiliğinden işareti kaldırır — **sürekli senkron modu DEĞİL**,
  tek seferlik toplu uygulama. Sonrasında her taşınmaz yine bağımsız
  düzenlenebilir (kullanıcının isteğiyle birebir).
- **Yan bulgu/düzeltme**: `titleChangedRecords` (hangi tapu kayıtlarının
  değiştiği, `openTitleRecordChangeModal`'dan gelir) `sections[title].fields`'ta
  DEKLARATİF olarak tanımlı değildi — bu yüzden `getTitleUnitScopedFieldKeys()`
  onu görmüyordu ve tab değiştirince bu alan TÜM taşınmazlar arasında
  YANLIŞLIKLA PAYLAŞILIYORDU (gerçek bir hataydı, bu iş sırasında fark
  edildi ve düzeltildi — artık elle `TITLE_UNIT_SCOPED` kümesine ekleniyor).
- Test: `tools/test-title-unit-switch.js`'e 3 yeni senaryo (8-10) eklendi:
  `titleChangedRecords`'un artık sızmadığı, tümüne-uygula'nın doğru
  çalıştığı, UI gate koşulunun kaynakta doğru olduğu.

**Sıradaki istek — "tümüne uygula" TÜM ana başlıklara yayılmalı (2026-08-09,
kullanıcı talebi, HENÜZ BAŞLANMADI):**

Kullanıcı: "bunu tüm ana başlıklar için yapmalıyız" — yani
`applyTitleRecordChangeToAllTitleUnits` deseni (bkz. yukarıdaki "'Tapu
Kaydı Değişikliği' tümüne uygula" bölümü) yalnızca `titleRecordChange`
alanına özel kalmamalı, tab'lı olan TÜM alanlara (Tapu ve Mülkiyet +
Takyidat sekmelerindeki her alan — Ada, Parsel, Blok, Nitelik, Malikler
tablosu, Takyidat tabloları vb.) genelleştirilmeli. Kullanıcı "şimdilik
dur" dedi (haftalık limit endişesiyle) — **HENÜZ HİÇBİR KOD YAZILMADI**,
yalnızca bu not düşüldü ki devam eden ajan (Codex veya yeni oturum)
buradan başlasın.

Olası yaklaşım (tasarlanmadı, yalnızca ilk fikir): `applyTitleRecordChangeToAllTitleUnits`'i
genel bir `applyFieldToAllTitleUnits(fieldKey)` fonksiyonuna dönüştürüp,
`createForm`'un "title"/"encumbrance" alan render mantığına HER alanın
yanına (mevcut `field.wide`/`field.critical` gibi bir bayrakla, ör.
`field.bulkApplyToAllUnits: true`) opsiyonel bir "tümüne uygula" kutucuğu
eklemek — tablo alanları (Malikler/Takyidat kayıtları) için ayrı bir
mekanizma gerekebilir (tablo satırları field.key tabanlı değil). Bu,
`createForm`/`createTable` gibi hub fonksiyonlara dokunmayı gerektirebilir
— dikkatli, `trace_path` ile başlanmalı (bkz. AGENTS.md).

**HENÜZ YAPILMADI (sıradaki adımlar, öncelik sırasıyla):**

1. Gerçek admin girişiyle UÇTAN UCA canlı doğrulama (dosya yükle → önizle
   → Rapora Aktar → tab çubuğunda kontrol et) — bu segment içinde
   yapılamadı (standart kısıtlama), yalnızca kod incelemesi + testlerle
   doğrulandı.
2. **Bağımsız Bölüm/Değerleme sekmelerine tab desteği** — kasıtlı olarak
   ertelendi (yukarıya bak), ayrı bir denetim/oturum gerektiriyor.
3. Autosave/cloud sync'in ek taşınmazlarla birlikte doğru senkronlandığının
   UÇTAN UCA (gerçek çoklu-tapu raporu ile, gerçek admin girişiyle)
   doğrulanması — şu an yalnızca kaynak-düzeyi (statik metin) ve
   sandbox'lanmış mantık testleriyle doğrulandı, canlı tarayıcı senaryosu
   test edilmedi.
4. Banka şablonu export'unun (madde 7, Faz 3) çoklu taşınmazlı raporlarda
   nasıl davranacağı — bugün yalnızca birincil taşınmazın verisini kullanır,
   ek taşınmazlar export'a hiç YANSIMAZ (bilinen, dokümante edilmiş sınır).

## PDF yapısı — doğrulanmış bulgular

pdftotext ile çıkarılan `TKB_20260612182932035261.pdf` metni incelendi
(`app/../` dışında, scratchpad'de — repo'ya dahil değil). Bulgular:

- Dosyada **43 ayrı taşınmaz kaydı**, her biri aynı 3 "sayfalık" şablonla
  tekrarlanıyor (belgenin kendi iç sayfalama numaralandırması `1/3`, `2/3`,
  `3/3` — gerçek PDF sayfa sayısı değil, TAKBİS'in kendi mantıksal
  bölümleme numarası).
- Her kaydın **başlangıcı SABİT bir banner satırıyla** belirleniyor:
  `"BU BELGE TOPLAM 3 SAYFADAN OLUŞMAKTADIR BİLGİ AMAÇLIDIR."` (bir zaman
  damgasıyla birlikte) — bu satır her kayıtta birebir aynı metinle tekrar
  ediyor, TEK GÜVENİLİR AYIRICI olarak kullanılabilir.
- Hemen ardından `"Taşınmaz Kimlik No:"` geliyor — her kayıt için benzersiz
  (116987960, 116987962, ...) — birincil anahtar adayı.
- Her kayıt aynı 4 alt-bölümü SABİT sırayla içeriyor:
  1. **İD TAPU KAYIT BİLGİSİ** (il/ilçe, mahalle, ada/parsel, blok/kat/
     giriş/BB no, nitelik, arsa payı/paydası)
  2. **TAŞINMAZA AİT ŞERH BEYAN İRTİFAK BİLGİLERİ**
  3. **İD MÜLKİYET BİLGİLERİ** (malik(ler), hisse pay/payda, edinme sebebi)
  4. **MÜLKİYETE AİT REHİN BİLGİLERİ** (varsa — ipotek/alacaklı/borç/faiz)
- Bölme mekanizması (banner satırına göre split) **43/43 kaydı KUSURSUZ**
  ayırdı — bu kısım güvenilir ve production'a taşınabilir.

## ✅ Türkçe karakter sorusu ÇÖZÜLDÜ (2026-08-09, canlı pdf.js testi)

Aşağıdaki paragrafta anlatılan endişe **kontrol edildi ve pdf.js'te SORUN
OLMADIĞI kanıtlandı**. Yöntem: `vendor/pdfjs/pdf.local.js` + gerçek
`sample.pdf` (kullanıcının verdiği 43-kayıtlı dosya) session scratchpad'inde
minimal bir statik sunucu üzerinden Browser preview ile canlı çalıştırıldı,
app.js'teki `readTakbisPdfRows`'un AYNI `getTextContent()` +
satır-gruplama mantığı taklit edildi. Sonuç: **"İl/İlçe: DÜZCE/MERKEZ"**,
**"Bağımsız Bölüm Nitelik: MESKEN"**, **"TERA FİNANS FAKTORİNG ANONİM
ŞİRKETİ"**, **"709 Parsel - 2 nolu Bağ. Bölüm"** — TÜM Türkçe karakterler
(İ/ı/ğ/ş/ö/ü/ç) KUSURSUZ çıktı. 43 banner satırı ve 43 "Taşınmaz Kimlik No"
eşleşmesi doğrulandı. **Sorun yalnızca hızlı POC'ta kullanılan `pdftotext`
(poppler) aracına özgüydü — app.js'in gerçek pdf.js tabanlı parser'ında HİÇ
YOK.** Aşağıdaki eski uyarı paragrafı artık TARİHSEL bağlam için korunuyor.

### (Eski, artık çözülmüş) pdftotext ile Türkçe karakter kaybı uyarısı

Faz 1 kanıt-of-concept'i (`pdftotext -layout` + regex alan çıkarma) ile
denendiğinde, **Türkçe özel karakterler (İ, ı, ğ, ş, ö, ü, ç bazı yerlerde)
sistematik olarak KAYBOLUYOR veya bozuk çıkıyor** (ör. "İlçe" → "lçe",
"Bağımsız" → "Baımsız", "FİNANS" → "FNANS" — "İ" harfi tamamen düşüyor).
Bu, TAKBİS'in PDF üretici yazılımının Türkçe karakterleri standart-dışı bir
font/CID kodlamasıyla gömmesinden kaynaklanıyor olabilir.

**BU SORUNUN app.js'İN GERÇEK TAKBİS PARSER'INDA (pdf.js tabanlı,
`readTakbisPdfRows` → pdf.js'in `getTextContent()`'i) DA VAR OLUP OLMADIĞI
DOĞRULANMADI.** Uygulama aylardır tek-kayıtlı TAKBİS PDF'lerini başarıyla
okuyor, bu yüzden pdf.js'in kendi text-extraction'ı muhtemelen bu sorunu
YAŞAMIYOR (poppler/pdftotext'e özgü bir kusur olabilir) — ama bu VARSAYIM,
KANITLANMADI. **Bir sonraki oturumun İLK yapması gereken şey**: bu aynı PDF'i
(veya ondan türetilmiş tek-bloklu bir örneği) uygulamanın gerçek
`readTakbisPdfRows`/`parseTakbisTitleRows` fonksiyonlarından geçirip Türkçe
karakterlerin doğru gelip gelmediğini kontrol etmek. Eğer pdf.js de aynı
sorunu yaşıyorsa, mevcut tek-kayıt akışı da bundan MUTLAKA etkileniyor
olmalıydı (ama kullanıcıdan böyle bir şikayet gelmemiş) — bu ipucu, pdf.js'in
muhtemelen sorunu ZATEN çözdüğüne işaret ediyor, ama teyit gerekiyor.

## Faz 1 kanıt-of-concept scripti (repo dışında, referans için)

`C:\Users\90551\AppData\Local\Temp\claude\...\scratchpad\parse-multi-takbis.js`
— bu geçici bir Node scripti, REPO'YA COMMIT EDİLMEDİ (session scratchpad'inde).
`pdftotext -layout` çıktısını banner satırına göre böler, kaba regex'lerle
alan çıkarır. Yalnızca "43 kayıt doğru bölünüyor mu" sorusunu kanıtlamak
içindi — gerçek alan çıkarma kalitesi (Türkçe karakter sorunu nedeniyle)
production için YETERSİZ. Gerçek uygulamada bu script değil,
**app.js'in mevcut `parseTakbisTitleRows`/`parseTakbisOwners`/
`parseTakbisEncumbrances`/`parseTakbisAttachments` fonksiyonları HER BLOK
İÇİN TEKRAR KULLANILMALI** (bunlar zaten olgun, production'da kanıtlanmış).

## Faz 1 kod durumu — LANDLENDİ (2026-08-09, commit bkz. handoff.md)

`app.js`'e eklendi (henüz UI'a bağlanmadı, yalnızca fonksiyonlar mevcut):

- **`splitMultiTakbisRowBlocks(rows)`** — `readTakbisPdfRows()`'un
  döndürdüğü `rows` dizisini `"TAPU KAYIT BİLGİSİ"` bölüm başlığına göre N
  alt-diziye böler (banner satırı DEĞİL — banner `readTakbisPdfRows`'un
  gürültü filtresinde SİLİNİYOR, bu yüzden ayırıcı olarak KULLANILAMAZ; bu
  ayrımı yaparken düşülen ilk hataydı, canlı pdf.js testiyle düzeltildi).
  Tek başlıkta 1 blok (TÜM satırlar, başlık öncesi dahil) döner — **mevcut
  tek-kayıt akışını (`readTakbisPdf`) birebir korur, geriye dönük uyumlu**.
- **`readMultiTakbisPdf(file)`** — bloklara ayırıp HER blok için mevcut
  `parseTakbisTitleRows`/`parseTakbisOwners`/`parseTakbisEncumbrances`/
  `parseTakbisAttachments` fonksiyonlarını TEKRAR çalıştırır, N adet
  `{ titleRaw, fields, attachments, owners, encumbrances, ownerShareWarning }`
  kaydı döner. **Bilinçli sadeleştirme**: `readTakbisPdf()`'teki OCR yedek
  akışı (eksik kesir/malik/rehin durumunda) BURADA YOK — N kayıt için OCR
  çalıştırmak yavaş olurdu; eksik gelen kayıt kullanıcı tarafından elle
  tamamlanabilir (ileride gerekirse eklenebilir).
- Test: `tools/test-multi-takbis-split.js` (4 senaryo: tek kayıt geriye
  dönük uyumluluk, 3-kayıtlı doğru bölünme, başlıksız/bozuk PDF'te hata
  fırlatmama, büyük/küçük harf + Türkçe karakter varyasyonu) — `npm run
  verify` zincirine eklendi, hepsi geçiyor.

## Sıradaki adımlar (öncelik sırasıyla, kalan)

1. ~~Türkçe karakter doğrulaması~~ ✅ TAMAMLANDI (yukarıda).
2. ~~Çoklu blok bölme fonksiyonu~~ ✅ TAMAMLANDI (`splitMultiTakbisRowBlocks`).
3. ~~Her blok için mevcut parser'ları çalıştır~~ ✅ TAMAMLANDI (`readMultiTakbisPdf`).
4. **Çoklu dosya yükleme desteği**: kullanıcı birden fazla PDF seçebilsin
   (tek dosya da olur — mevcut akış bozulmaz), her dosyanın blokları tek bir
   listede birleştirilsin — `readMultiTakbisPdf` ŞU AN TEK dosya alıyor,
   birden fazla dosyayı dışarıdan (çağıran kod) N kez çağırıp sonuçları
   birleştirerek kullanmak mümkün, ama HENÜZ bunu yapan bir UI/orkestratör
   yok.
5. ✅ TAMAMLANDI — **Doğrulama/önizleme ekranı**: `createMultiTakbisPreviewPanel()`
   eklendi ("Dosya ve Rapor" sekmesi, admin-only, `isCurrentUserAdmin()`
   gated). Birden fazla dosya seçilebilir (`<input type="file" multiple>`),
   her dosya `readMultiTakbisPdf()` ile ayrı işlenir, sonuçlar TEK bir
   tabloda birleştirilir (#, kaynak dosya, Taşınmaz Kimlik No, Ada/Parsel,
   Blok/Kat/BB No, Nitelik, Malik(ler), Rehin sayısı, eksik-alan uyarısı).
   **Hiçbir alanı/tabloyu doldurmaz** — salt önizleme. Admin girişi gerektirdiğinden
   canlı ekranda görsel doğrulama yapılamadı (standart kısıtlama) — `node
   --check` + `npm run verify` ile doğrulandı, fonksiyon adları (`cleanTakbisOwnerDisplayName`,
   `getOwnerShareWarning` vb.) grep ile teyit edildi.
6. **(Büyük iş, ayrı tasarım gerektirir) `state.titleUnits[]` veri modeli**
   ve Tapu ve Mülkiyet / Takyidat / Bağımsız Bölüm / Değerleme sekmelerine
   tab çubuğu eklenmesi — bu, mevcut TEK-tapu varsayımına dayanan pek çok
   yeri (autosave, cloud sync, bank template export, placeholder çözümleme)
   etkileyecek bir mimari değişiklik, dikkatli ayrı bir oturumda ele
   alınmalı.
7. Template'lere aktarım tasarımı — 6. madde netleşmeden ele alınmayacak.

## Bu iş için genel disiplin hatırlatması

Bu proje için geçerli standart discipline (bkz. `AGENTS.md`/`CLAUDE.md`)
aynen uygulanmalı: `codebase-memory` grafiyle önce mevcut TAKBİS
fonksiyonlarını (`trace_path`) incele, değişiklik sonrası `npm run verify`,
`index.html` cache-buster bump, `handoff.md`'ye dated entry, backup, git
divergence check, commit/push, deploy doğrulama.
