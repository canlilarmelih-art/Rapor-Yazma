# Rapor Yazma Tema Profilleri

- `Navy Blue`: Mevcut lacivert-beyaz rapor arayüzünün sabitlenmiş profili.
- `Apple`: `DESIGN-apple.md` içindeki Apple renk, tipografi, yüzey ve etkileşim tokenlarının rapor çalışma alanına uyarlanmış profili.
- `Glass`: Buzlu cam (glassmorphism) — yarı saydam yüzeyler, backdrop blur,
  arkada kayan renkli gradyan; Navy Blue'nun lacivert/gold marka vurgularını
  korur. Kaynak: `design_handoff_glass_theme/` klasöründeki tasarım
  handoff'u (`tokens/theme-glass.css`), uygulamanın gerçek değişken adlarına
  ve yüzey sınıflarına uyarlanarak `themes/glass.css`'e taşındı.
- `Aurora`: Renkli, akan "aurora" gökyüzü zemini (lacivert + gold + teal
  blob'lar, 18s'de süzülen), üzerinde neredeyse-opak beyaz buzlu yüzeyler;
  teal etkileşim rengi olur. Kaynak: `Experify Design System/tokens/
  theme-aurora.css` → `themes/aurora.css`.
- `Clay`: Şişkin "kil" yüzeyler — büyük köşe yuvarlaklığı, pastel
  lacivert/periwinkle taban, imza üçlü gölge (dış gölge + iki iç gölge).
  Kenarlık yok, düğmeler basılınca 1px aşağı kayar. Kaynak: `Experify Design
  System/tokens/theme-clay.css` → `themes/clay.css`.
- `Neumorphism`: Soft-UI — yüzeyler sayfayla aynı renkte, yalnızca iki yönlü
  gölge çiftiyle (açık/koyu) kabartılmış; kenarlık yok, girdiler basılmış
  (inset) gölgeli. Kaynak: `Experify Design System/tokens/
  theme-neumorphism.css` → `themes/neumorphism.css`.

Uygulama varsayılan olarak Apple profiliyle açılır. Profil dosyaları uygulama içindeki `themes/` klasöründedir.

Not: Bu altı profil yalnızca ana çalışma alanındaki (`#themeProfileSelect`,
`body[data-app-theme]`) seçime uygulanır. Giriş ekranının (auth gate) kendi
ayrı açık/koyu geçişi (`data-gate-theme`) var; hiçbiri şu an oraya
uygulanmadı — istenirse ayrı bir iş olarak eklenebilir.

Not (Clay/Neumorphism): bu iki profil ayrıca uygulamanın gerçekten tükettiği
`--radius-s/-m/-l` değişkenlerini de (bkz. `styles.css:31-33`) kendi
profilleri içinde ezer — böylece köşe yuvarlaklığı bu iki temada stiller
genelinde otomatik olarak büyür/tutarlı kalır.
