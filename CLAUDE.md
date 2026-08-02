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

## Bu depoda paralel oturum uyarısı

Aynı çalışma dizininde başka bir ajan (Codex) da düzenleme yapabiliyor.
Commit'lemeden önce `git status` ile hangi değişikliklerin sana ait olduğunu
ayır; yalnızca kendi dosyalarını stage'le.
