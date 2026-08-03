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

## Bu depoda paralel oturum uyarısı

Aynı çalışma dizininde başka bir ajan (Codex) da düzenleme yapabiliyor.
Commit'lemeden önce `git status` ile hangi değişikliklerin sana ait olduğunu
ayır; yalnızca kendi dosyalarını stage'le.
