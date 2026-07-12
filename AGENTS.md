# Proje Calisma Kurallari

## Graphify ile Kod Haritasi

Bu projede kodlama yapmadan once Graphify haritasi kullanilmalidir.

- Ilgili dosya, fonksiyon veya alan icin `graphify explain` ve `graphify query` ile baglantilar incelenir.
- Bir degisiklikten once etkilenecek kodlar `graphify affected` veya `graphify path` ile kontrol edilir.
- Kod degisikliginden sonra `graphify update` calistirilir; gerekiyorsa `graphify cluster-only` ile rapor ve agac gorunumu yenilenir.
- Harita kod etkilesimini anlamak icin kullanilir; testler, kullanici istegi ve mevcut uygulama davranisi ile birlikte degerlendirilir.
- Graphify kod haritasi `graphify-out/` altinda tutulur. Buyuk projelerde interaktif agac gorunumu (`GRAPH_TREE.html`) tercih edilir.
