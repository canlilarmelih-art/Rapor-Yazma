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

## Bu depoda paralel oturum uyarısı

Aynı çalışma dizininde başka bir ajan (Codex) da düzenleme yapabiliyor.
Commit'lemeden önce `git status` ile hangi değişikliklerin sana ait olduğunu
ayır; yalnızca kendi dosyalarını stage'le.
