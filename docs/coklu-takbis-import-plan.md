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

**HENÜZ YAPILMADI (sıradaki adımlar, öncelik sırasıyla):**

1. **Tab çubuğu UI bileşeni** — Tapu ve Mülkiyet/Takyidat/Bağımsız
   Bölüm/Değerleme sekmelerinin üstünde `computeTitleUnitTabLabel` ile
   etiketlenen bir yatay tab çubuğu. Tıklanınca "aktif taşınmaz index"i
   değiştirir (yeni bir ephemeral state, `state.titleUnits`'e YAZILMAZ —
   sadece "şu an hangi tab açık" bilgisi).
2. **`createForm`/`renderSection`'ın "aktif taşınmaz"a göre okuma/yazma
   yapması** — bu 4 sekmenin field get/set mantığı, aktif tab birincil
   taşınmazsa `state.fields`'a, değilse `state.titleUnits[i].fields`'a
   yönlenmeli. **EN YÜKSEK RİSKLİ ADIM** — `createForm`/`renderSection` hub
   fonksiyon olduğu için `trace_path` ile TÜM çağıranlar gözden geçirilmeden
   başlanmamalı. Ayrı, odaklı bir oturumda ele alınmalı.
3. **Önizleme panelinden "İçe Aktar" akışı** — `createMultiTakbisPreviewPanel`
   şu an salt önizleme; bir "Rapora Aktar" düğmesi eklenip her önizleme
   kaydını `createEmptyTitleUnit` ile bir `state.titleUnits` elemanına
   (birincisi `state.fields`'a) dönüştürecek bir eşleme fonksiyonu
   (`titleUnitFromTakbisRecord` gibi) yazılmalı — `record.owners`/`record.encumbrances`
   şeklinin `tables.title`/`tables.encumbrance` ile tam örtüştüğü ayrıca
   doğrulanmalı (bu segment içinde doğrulanmadı).
4. **Malikler/Takyidat tabloları** — bugün `state.tables.title`/`state.tables.encumbrance`
   tek taşınmaza ait; aktif taşınmaza göre `state.titleUnits[i].tables`'a
   yönlenmesi gerekiyor (madde 2 ile aynı risk sınıfı).
5. Autosave/cloud sync'in ek taşınmazlarla birlikte doğru senkronlandığının
   UÇTAN UCA (gerçek çoklu-tapu raporu ile) doğrulanması — şu an yalnızca
   kaynak-düzeyi (statik metin) testle doğrulandı, canlı senaryo test
   edilmedi.

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
