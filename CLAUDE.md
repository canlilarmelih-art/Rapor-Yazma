# Rapor Yazma Programı (Experify) — Çalışma Kuralları

Proje kuralları `AGENTS.md` dosyasında tutulur; Codex ile ortak olsun diye tek
kaynaktan okunur:

@AGENTS.md

Özet (yukarıdaki dosya okunamazsa geçerli olan asgari kural):

## Kod değişikliğinden ÖNCE bilgi grafına bak

`codebase-memory` MCP araçları grep/glob yerine ilk durak:

- `search_graph(project, query="...")` → fonksiyonun tam adını bul.
  Salt ad güvenilir değil: 37 fonksiyon adı birden çok dosyada geçiyor
  (`foldTurkish` 4 ayrı dosyada). Kimlik `qualified_name`, dosyayı da doğrula.
- `trace_path(project, function_name="...", direction="both", depth=3)` →
  değişiklikten etkilenecek çağıran/çağrılanları çıkar. `outbound` tek başına
  çağıranları kaçırır.
- `get_code_snippet(project, qualified_name="...")` → kaynağı oku.
- `detect_changes(project)` → yerel diff'in etkilediği sembolleri gör.

Proje adı:
`C-Users-90551-Documents-Codex-2026-05-11-files-mentioned-by-the-user-rapor-app`

Hub fonksiyonlara (`foldTurkish` 138 çağıran, `renderSection` 89, `createForm`
69, `cleanTakbisValue` 65) dokunmadan önce mutlaka `trace_path` çalıştır.

Graf indeksleme anındaki halidir — düzenlemeden önce dosyayı yine de oku;
büyük değişiklikten sonra `index_repository` ile yenile.

## Doğrulama ve dağıtım

- Değişiklik sonrası `npm run verify` (check + tüm testler) çalıştırılır.
- `app.js`, `styles.css`, `src/**` veya `cloud/**` içeriği değiştiyse
  `index.html`'deki ilgili `?v=YYYYMMDD-HHMM` cache-buster'ı **mutlaka**
  yükseltilir; yoksa tarayıcılar eski kopyayı önbellekten kullanmaya devam eder.
- Deploy GitHub Actions ile experify.com.tr'ye gider; `verify` job'ı kırmızıysa
  `deploy` hiç çalışmaz.

## Statik dosya oturum kapısı (0.0.284, 2026-08-02)

Kaynak kodu koruması için `server.js` artık `login.html` ve birkaç genel
varlık (Firebase SDK, `cloud/firebase-config.js`, `manifest.json`,
`icons/*` — bkz. `isPublicStaticFile`) DIŞINDA hiçbir statik dosyayı
oturum çerezi (`rapor_session`, HttpOnly, 7 gün) olmadan sunmuyor. Yeni bir
kök HTML dosyası veya login öncesi erişilmesi gereken bir varlık eklerken
`isPublicStaticFile`'ı güncellemeyi unutma; aksi halde 401/302 alır. Testi:
`tools/test-static-auth-gate.js`.

## Deploy-öncesi minify (0.0.285, 2026-08-02)

`app.js`, `cloud/cloud-sync.js`, `cloud/report-library.js` ve `src/**`
altındaki dosyalar deploy sırasında `.github/workflows/deploy.yml`'de
`tools/minify-for-deploy.js` ile küçültülür (sadece CI'ın geçici
checkout'unda — repodaki kaynak asla minified commit edilmez). Yeni bir
`src/**/*.js` dosyası eklersen `minify-for-deploy.js`'deki `TARGET_FILES`
listesine de ekle (unutulursa `tools/test-minify-deploy-coverage.js`
`npm run verify`'de yakalar). Terser ayarlarını (`mangle.toplevel: false`,
`compress.toplevel: false`) DEĞİŞTİRME — `template-engine.js`'in
`globalThis[fnName]` ile yaptığı 147 dinamik çağrı bunlara bağlı. Canlıda
"view source" artık okunabilir kod göstermez; hata ayıklama için yerel
sunucuyu (`npm run` yok, doğrudan `node server.js`) kullan.

## Kullanıcı kaydı + admin onayı (0.0.290, 2026-08-02)

login.html'de herkes hesap oluşturabilir ama `server.js`'deki
`isUserApproved()` onaylamadan (`approved-users.json`) `/api/session` oturum
çerezi vermez — yönetici (`ADMIN_EMAIL`) hariç. Onay panelı `admin-users.html`
(`GET /api/pending-users`, `POST /api/approve-user`/`reject-user`, hepsi
`requireAdmin()` ile korunuyor). Yeni bir statik dosya eklerken olduğu gibi,
bu akışa dokunan bir değişiklik yaparsan `tools/test-user-approval-flow.js`'i
çalıştır — özellikle "miras/grandfather klozu" (approved-users.json ilk kez
oluşurken mevcut oturumlu kullanıcıları otomatik onaylama) davranışını
BOZMA, aksi halde gerçek bir deploy'da aktif kullanıcılar kilitlenebilir.

## Üçüncü erişim katmanı: ayrıcalıklı (privileged) kullanıcı (0.0.291, 2026-08-02)

Onaylı (approved) olmak ile "ayrıcalıklı" olmak FARKLI kavramlardır. Normal
kullanıcılar `app.js`'deki `sensitiveOnly: true` işaretli bölümleri
("Açıklamalar", "Masraf Bilgileri") ve alanları (dağınık ~10 açıklama
textarea'sı) VE dört "Okuma Sonucu" önizleme panelini (Adres/TAKBİS/İmar/
Takyidat ham verisi — `render()` içindeki `canViewSensitiveContent()`
kontrolleriyle) göremez; alttaki otomatik dolan GERÇEK alanlar (kutucuklar)
gizlenmez. Yönetici her zaman görebilir; diğer kullanıcılara
`admin-users.html`'deki "Ayrıcalıklı Erişim" panelinden (`POST
/api/grant-privilege`/`revoke-privilege`, `GET /api/approved-users`, hepsi
`requireAdmin()`) tek tek yetki verilir. İstemci tarafı bunu statik e-posta
karşılaştırmasıyla BİLEMEZ (dinamik sunucu listesi) — bu yüzden
`cloud/cloud-sync.js` her girişte `GET /api/my-role`'i sorgulayıp
`window.RaporAccessControl.setCanViewSensitive(...)` çağırır. Yeni bir
açıklama/otomatik-metin alanı eklerken benzer şekilde gizlenmesi gerekiyorsa
o alana `sensitiveOnly: true` ekle (adminOnly ile aynı desen). Test:
`tools/test-user-approval-flow.js` (bölüm 5).

## Banka Şablonuyla Kaydet artık tek ZIP (0.0.296, 2026-08-03)

Genel (banka şablonu DIŞI) "Word olarak farklı kaydet"/"PDF olarak kaydet"
düğmeleri KALICI OLARAK KALDIRILDI — `collectGeneratedTextPlaceholders()`'daki
HTML tablo üreten girdileri (emsal matrisi/tablosu) düz-metin varsayan
`formatWordParagraphs()`'tan geçirip kaçış karakterli ham HTML basıyordu.
Geri getirme: yapma — asıl çıktı zaten `appendBankTemplateExportBlock()`
("Banka Şablonuyla Kaydet") üzerinden geliyor. Bu düğme artık Word (.doc) +
JSON taslağı + dolu tablolar Excel'i + (varsa) Ziraat ek tablosunu TEK bir
`.zip` dosyasında indiriyor (`buildBankTemplateZipBundle()`, app.js) —
paketleme `window.RaporXlsxFill.writeStoredZip` (zaten `.xlsx` üretimi için
var olan bağımlılıksız STORED-zip yazıcı) ile yapılır, yeni kütüphane
eklenmedi. `exportTemplate`/`exportAllTables`/`exportXlsx` üçü de artık
`{download:false}` seçeneğiyle indirmeden `{fileName, content/blob, ...}`
döndürebiliyor. **UYARI**: `formatWordParagraphs`, `buildWordMhtmlPackage`,
`buildComparableMatrixWordTableHtml` gibi bazı fonksiyonlar hem silinen genel
export'ta HEM DE gerçek banka şablonu boru hattında (template-engine.js'in
`safeCall("fnAdı")` dinamik çağrılarında) kullanılıyordu — bu tür bir
fonksiyonu silmeden önce MUTLAKA `grep -rn "fnAdı" src/ templates/` ile
dinamik referans kontrolü yap (bkz. yukarıdaki "147 dinamik çağrı" uyarısı).
Test: `tools/test-bank-template-zip-bundle.js`.

## Admin dashboard: etkinlik günlüğü (0.0.300, 2026-08-03)

Kullanıcı verileri/istatistikleri için Firestore güvenlik kurallarını (bkz.
`cloud/firestore.rules`, `users/{uid}/reports` yalnızca `isOwner`) ASLA
gevşetme — rapor İÇERİĞİNİ admin'e açar (Firestore field-level güvenlik
yok). Bunun yerine `server.js`'deki `server-data/activity-events.json`
etkinlik günlüğünü kullan: `logActivityEvent(type, uid, email, extra)` ile
`login`/`logout` (otomatik) veya `report-created`/`report-exported`
(istemciden `POST /api/report-event`, `app.js`'teki `pingReportEvent`)
kaydeder — yalnızca opaque `reportId`, ASLA rapor verisi. `GET
/api/user-stats` (`computeUserReportStats()`) ve `GET /api/login-events`
(`requireAdmin()` korumalı) `admin-users.html`'in "Kullanıcı İstatistikleri"
ve "Giriş / Çıkış Geçmişi" kartlarını besler. Yeni bir "kullanıcı ne yaptı"
sorusu gelirse bu günlüğe yeni bir `extra`/olay türü eklemek, Firestore
kurallarını gevşetmekten HER ZAMAN tercih edilmeli. Test:
`tools/test-activity-dashboard.js`.

## Yeni kullanıcı e-posta bildirimi (0.0.305, 2026-08-03)

Yeni bir hesap "onay bekliyor" durumuna düştüğünde (`handleRegisterPendingApi`)
admine (`accessRoles.ADMIN_EMAIL`) otomatik e-posta gider — MEVCUT MFA/Resend
altyapısı (`RESEND_API_KEY`) yeniden kullanılır, yeni bir env var/secret YOK.
`registerPendingUser()` artık bir **boolean döner** (gerçekten yeni bir
bekleyen kayıt mı?) — bildirim kararı buna bağlı; bu dönüş değerinin
anlamını değiştirecek bir refactor yaparsan `tools/test-new-user-notification.js`
kırılır (bilerek). `sendEmailViaResend` artık genel (`toEmail, subject, html`)
— yeni bir e-posta türü eklerken bu imzayı kullan, MFA'ya özel eski hali
GERİ GETİRME.

## Yeni banka şablonu eklerken: İKİ ayrı registry var (0.0.312, 2026-08-03)

Yeni bir `templates/*.html` eklerken SADECE `src/templates/template-engine.js`
içindeki `TEMPLATE_REGISTRY`'ye eklemek YETMEZ. Banka şablonu render'ı artık
sunucu tarafında (imzalı/korumalı, `handleReportTemplateRenderApi`) yapılıyor
ve bu akış `server.js`'teki TAMAMEN AYRI `PRIVATE_REPORT_TEMPLATES`
sözlüğünü kullanıyor — ikisi elle senkron tutulmalı, biri unutulursa export
"Paket hazırlanamadı: Şablon bulunamadı" hatasıyla sessizce başarısız olur
(dropdown'da şablon GÖRÜNÜR ama export ÇALIŞMAZ, çünkü dropdown istemci
listesinden dolar). Ayrıca raporun "Banka" seçim listesi (`caseBankOptions`,
app.js) da AYRI bir üçüncü liste — `mortgageCreditorBankNames` (yalnızca
takyidat/ipotek lehdarı seçimi için, çok daha uzun) ile KARIŞTIRILMASIN.
Üç listenin hepsi güncellenmeli: `caseBankOptions` (app.js), `TEMPLATE_REGISTRY`
(template-engine.js), `PRIVATE_REPORT_TEMPLATES` (server.js). Test:
`tools/test-server-template-rendering.js` artık her `TEMPLATE_REGISTRY`
anahtarının sunucuda gerçek bir dosyaya karşılık geldiğini doğruluyor.

## templates/emlakkatilim.docx'i Word'de düzenledikten sonra (0.0.315, 2026-08-04)

`templates/emlakkatilim.docx` (aşağıdaki bölüme bakın) MUTLAKA STORED
(sıkıştırmasız) zip olarak paketli kalmalı — `src/exports/docx-fill.js`'in
`readStoredZip`'i bağımlılıksız çalışmak için DEFLATE girişte kasıtlı
hata fırlatır. Microsoft Word bir .docx'i HER kaydettiğinde zip'i
otomatik olarak DEFLATE ile yeniden paketler (STORED bilgisini korumaz).
Yani: kullanıcı ya da başka biri bu dosyayı Word'de açıp kaydederse,
commit'lemeden ÖNCE mutlaka STORED'a yeniden paketlenmeli, yoksa hem
`npm run verify` (`tools/test-docx-fill.js`) kırılır hem de canlıda
export "Şablon sıkıştırmasız paketlenmeli" hatası verir:
```python
import zipfile
with zipfile.ZipFile("templates/emlakkatilim.docx") as zf:
    names = zf.namelist(); data = {n: zf.read(n) for n in names}
with zipfile.ZipFile("templates/emlakkatilim.docx", "w", compression=zipfile.ZIP_STORED) as zo:
    for n in names: zo.writestr(n, data[n])
```
İçerik/placeholder'lar birebir korunur, yalnızca sıkıştırma yöntemi
değişir. Değişiklikten sonra `node tools/test-docx-fill.js` ile doğrula.

## Gerçek .docx banka şablonu: Emlak Katılım (0.0.313, 2026-08-03)

Kullanıcı "word formatını bozmamalıydın logolar sayfa yapısı çerçeveler...
template dosyasını word olarak tutabilirsin" dedi — HTML'e çevirip render
eden mevcut motorun (`templates/*.html` + `template-engine.js` fillTemplate)
DIŞINDA, `templates/emlakkatilim.docx` GERÇEK bir Word dosyası olarak
tutuluyor (TEMPLATE_REGISTRY'de `format: "docx"`). Kullanıcının sunduğu
orijinal .docx'e {{TOKEN}} yer tutucuları doğrudan `word/document.xml`
içine (Word'ün run'lara bölme sorunundan kaçınmak için önce
`merge_runs.py` ile birleştirilip) elle yerleştirildi; belge STORED
(sıkıştırmasız) zip olarak paketlendi ki xlsx-fill.js'teki gibi
bağımlılıksız okunabilsin. 0.0.314'te kapsam genişletildi: kapak tablosu +
imar/tanım paragrafları + olumlu-olumsuz faktörler + Emsal 1/2/3 sabit
kartları (belge dinamik satır çoğaltma DEĞİL, sabit 3 kart içeriyor —
emsal listesinden 0/1/2. index doğrudan eşlenir, 4.+ emsal şablona
sığmaz) + malikler (`{{SAHIPLER}}`) + sonuç değerleri doldu. **"8. Ekler"
(fotoğraf başlıkları) BİLİNÇLİ OLARAK BOŞ** — bu metin/veri değil, gerçek
görsel gömme işi (`word/media/` + ilişki dosyaları gerektirir), kapsam
dışı. Devam eklemesi gerekirse teknik: `templates/` kopyasını unzip et,
`word/document.xml`'de hedef etiketin hemen ardındaki `\xa0` (boş) run'ı
bul, `{{TOKEN}}` ile değiştir (tamamen boş hücrede run bile yoksa yeni
`<w:r><w:t>` eklemek gerekir — bkz. Olumlu/Olumsuz Faktörler örneği,
handoff 0.0.314), STORED zip olarak yeniden paketle.

**Bold-seçim mekanizması** (Word'de AYRI hücrelerde duran çoktan-seçmeli
alanlar — ör. "Kent | Kent Dışı | Kırsal" — için "doğru seçeneği KOYU
yap" kullanıcı talebiyle eklendi): şablon metninde her seçeneğin BAŞINA
`{{BOLD:AD}}` işareti konur (hazırlık aşamasında, elle). `docx-fill.js`'in
`applyBoldMarkers(xmlText, boldFlags)`'ı `boldFlags[AD]` true olan
işaretli run'a `<w:b/><w:bCs/>` ekler, işareti HER ZAMAN siler.
`collectTokens()` `{{BOLD:...}}`'u normal `{{TOKEN}}` SAYMAZ (aksi halde
`resolveTemplateTokenValues` hep "missing" derdi). `boldFlags` app.js'teki
`getEmlakKatilimBoldFlags()`'ten gelir — bazı alanlar (developmentDensity/
developmentSpeed) bizim 3'lü ölçeğimizle ("düşük/orta/yüksek") belgenin
3'lü ölçeği ("%25 altı/%25-75/%75 üstü") arasında SIRALI/YAKLAŞIK eşleme
yapar, KESİN değildir — gerçek raporlarda gözden geçirilmeli.

Akış HTML şablonlarından TAMAMEN FARKLI: `exportTemplate()` (template-
engine.js) `format: "docx"` görünce sunucunun HTML-render API'sini
(`/api/report-template-render`) ATLAR — yeni `GET
/api/report-template-docx?key=...` (server.js, `handleReportTemplateDocxApi`
+ `readPrivateTemplateBinary`, yalnızca onaylı kullanıcı) ham baytları
verir, `src/exports/docx-fill.js` (yeni, xlsx-fill.js'in STORED-zip
okuma/yazma tekniğinin bağımsız kopyası) `{{TOKEN}}`'ları
`resolveTemplateTokenValues()`'un (mevcut, HTML şablonlarla PAYLAŞILAN)
ürettiği değerlerle YERELDE doldurur — sunucu-taraflı "korumalı"
değer-imzalama akışına (`applyServerProtectedPlaceholderTokens`) HİÇ
GİRMEZ (tıpkı Excel dışa aktarımların da bu akışı atlaması gibi —
mevcut bir mimari emsal). `PRIVATE_REPORT_TEMPLATES`'te dosya adı
`.docx` uzantılı olursa bu ayrı yol otomatik devreye girer.
Test: `tools/test-docx-fill.js`.

## Bu depoda paralel oturum uyarısı

Aynı çalışma dizininde başka bir ajan (Codex) da düzenleme yapabiliyor.
Commit'lemeden önce `git status` ile hangi değişikliklerin sana ait olduğunu
ayır; yalnızca kendi dosyalarını stage'le.
