# Proje Calisma Kurallari

## Codebase-Memory Bilgi Grafi (ZORUNLU ilk adim)

Bu projede kod arama/degistirme yapmadan ONCE codebase-memory bilgi grafina
bakilir. Amac: bir fonksiyonu degistirmeden once onu KIMIN cagirdigini ve onun
NEYI cagirdigini bilmek. Grep ile 80K token harcanan kesif, graf ile ~500 token.

Proje adi (tool cagrilarinda `project` parametresi):
`C-Users-90551-Documents-Codex-2026-05-11-files-mentioned-by-the-user-rapor-app`

Sira:
1. `search_graph(query="...")` veya `search_graph(name_pattern=".*Ad.*")` ile
   fonksiyonun TAM adini bul. Salt ad guvenilir degil: bu projede 37 fonksiyon
   adi birden fazla dosyada geciyor (`foldTurkish` 4 ayri dosyada). Kimlik
   `qualified_name`dir; dosya yolunu da dogrula.
2. `trace_path(function_name="...", direction="both", depth=3)` ile cagri
   zincirini cikar. Degisiklik oncesi etkilenecek yerleri bu belirler.
   `direction="outbound"` tek basina yeterli degil — cagiranlari kacirir.
3. `get_code_snippet(qualified_name="...")` ile kaynagi oku.
4. Yerel degisikliklerin etkisini `detect_changes()` ile haritala.
5. Mimari/kume resmi icin `get_architecture(aspects=["clusters","hotspots"])`.

Dikkat edilecekler:
- Yuksek fan-in'li "hub" fonksiyonlar (ornek: `foldTurkish` 138 cagiran,
  `renderSection` 89, `createForm` 69, `cleanTakbisValue` 65) degistirilirken
  once `trace_path` ile tum cagiranlar gozden gecirilir; kucuk bir imza/davranis
  degisikligi genis alana yayilir.
- `search_graph` sonuclari varsayilan olarak sinirlidir; `has_more` true ise
  `offset` ile sayfalanir.
- `query_graph` cok satirli sonuclarda dosyaya yazar; genis sorgularda LIMIT ver.
- Graf, indeksleme anindaki halidir. Bir fonksiyon/alan adi grafta gorunuyor
  diye kodda hala var saymayin — duzenlemeden once dosyayi okuyun.
- Kod degistikten sonra graf bayatlar; buyuk degisiklik sonrasi
  `index_repository` ile yenilenir.

Graf kod etkilesimini anlamak icindir; testler (`npm run verify`), kullanici
istegi ve mevcut uygulama davranisi ile birlikte degerlendirilir.

Kod tabaninin canli gorsel haritasi (1.926 fonksiyon, 4.303 cagri, 13 kume):
https://claude.ai/code/artifact/d7c5717f-a8cb-436d-be5c-5b3563862763

## Graphify ile Kod Haritasi

Bu projede kodlama yapmadan once Graphify haritasi kullanilmalidir.

- Ilgili dosya, fonksiyon veya alan icin `graphify explain` ve `graphify query` ile baglantilar incelenir.
- Bir degisiklikten once etkilenecek kodlar `graphify affected` veya `graphify path` ile kontrol edilir.
- Kod degisikliginden sonra `graphify update` calistirilir; gerekiyorsa `graphify cluster-only` ile rapor ve agac gorunumu yenilenir.
- Harita kod etkilesimini anlamak icin kullanilir; testler, kullanici istegi ve mevcut uygulama davranisi ile birlikte degerlendirilir.
- Graphify kod haritasi `graphify-out/` altinda tutulur. Buyuk projelerde interaktif agac gorunumu (`GRAPH_TREE.html`) tercih edilir.
