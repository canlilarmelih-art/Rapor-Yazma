# Test Girdileri

Bu klasor, belge okuma ve KML ayrıştırma kontrolleri için örnek dosyaları tutar.

Mevcut ilk test katmanı:

- Zorunlu örnek dosyaların yerinde olduğunu kontrol eder.
- `parsel.kml` içinde koordinat okunabildiğini kontrol eder.
- `*.expected.json` dosyaları eklendikçe JSON biçimini doğrular.

Sonraki aşamada `app.js` parser fonksiyonları modüllere ayrıldığında bu klasördeki PDF/TXT/KML dosyaları gerçek golden-file regresyon testlerine bağlanacaktır.

