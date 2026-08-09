# Çoklu TAKBİS PDF İçe Aktarma — Tasarım Notu ve Durum (2026-08-09)

Bu dosya, Claude ile başlanan "çoklu tapu/TAKBİS PDF içe aktarma" özelliğinin
o oturumda varılan karar ve bulguları kaydeder — devam eden ajan (Codex veya
farklı bir Claude oturumu) buradan kaldığı yerden sürdürebilsin diye.

**Durum: Yalnızca PLANLAMA + izole (uygulamaya bağlanmamış) bir Faz 1
kanıt-of-concept scripti var. app.js'e HENÜZ hiçbir değişiklik yapılmadı.**

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

**Veri modeli etkisi (henüz tasarlanmadı, sadece tespit edildi)**:
`state.fields` şu an TEK düz obje. Bu mimari, `state.titleUnits` (veya
benzeri) gibi bir **dizi** gerektirecek — her eleman
`{ id, label, fields: {...tapu/takyidat/BB/değerleme alanları...} }`.
Bu, uygulamanın state şeklinde temel bir değişiklik — autosave, cloud sync,
bank template export, mevcut TAKBİS okuma akışının HEPSİ etkilenir. **Bu
kısım henüz hiç tasarlanmadı — sıradaki büyük iş bu.**

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

## ⚠️ Kritik açık nokta: pdftotext ile Türkçe karakter kaybı

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

## Sıradaki adımlar (öncelik sırasıyla)

1. **Türkçe karakter doğrulaması** (yukarıda açıklandı) — pdf.js tabanlı
   gerçek parser'ın bu PDF ile çalıştırılıp çalıştırılmadığını kontrol et.
2. **Çoklu blok bölme fonksiyonu app.js'e eklensin**: `readTakbisPdfRows`'un
   döndürdüğü `rows` dizisini (pdf.js satırları, `{page, y, text}`) aynı
   banner metnine göre N alt-diziye bölen bir fonksiyon (ör.
   `splitMultiTakbisRowBlocks(rows)`). Tek-kayıtlı bir PDF için doğal olarak
   1 blok döner — GERİYE DÖNÜK UYUMLU, mevcut tek-kayıt akışını BOZMAZ.
3. **Her blok için mevcut parser'ları çalıştır**, N adet
   `{ titleRaw, fields, attachments, owners, encumbrances }` sonucu topla.
4. **Çoklu dosya yükleme desteği**: kullanıcı birden fazla PDF seçebilsin
   (tek dosya da olur — mevcut akış bozulmaz), her dosyanın blokları tek bir
   listede birleştirilsin.
5. **Doğrulama/önizleme ekranı**: N kaydı listeleyip zorunlu alanların
   (Taşınmaz Kimlik No, Ada/Parsel, en az 1 malik) dolu geldiğini gösteren,
   henüz rapora YAZMAYAN bir ara ekran — kullanıcı "doğru mu" diye kontrol
   edebilsin.
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
