# Çoklu Talep: yeni bir alan/bölüm eklerken kontrol listesi

> Bkz. `docs/coklu-talep-tarama-ve-yol-haritasi.md` madde 05 — 13 gün içinde
> AYNI sınıf sessiz sızıntı hatası 6 farklı bölümde ayrı ayrı, kaza eseri
> bulundu (Arsa Özellikleri, Belgeler, Değerleme ×3, Bağımsız Bölüm, Ana
> Gayrimenkul, Dosya ve Rapor). Bu kısa liste, 7. kez aynı hatayı elle
> keşfetmeye güvenmek yerine bir alışkanlık haline getirmek için var.

## Kök neden (tek cümle)

Bir Çoklu Talep bölümündeki (`TITLE_UNIT_SCOPED_SECTION_IDS`'te olan) bir
alan **`sections[].fields`'ta deklaratif değilse** (popup, özel kontrol,
`createConditionalYesNoControl`/`createBuildingSelectField` gibi programatik
bir yapıcıyla `state.fields.KEY = ...` şeklinde yazılıyorsa), genel
taşınmaz-kapsam taraması (`getTitleUnitScopedFieldKeys()`) onu **hiç
görmez** — alan sessizce ya (a) taşınmaza-özgü olması gerekirken
rapor-geneli paylaşılır, ya da (b) tam tersi.

## Yeni bir alan/kontrol eklerken sorulacak 3 soru

Bir Çoklu Talep bölümüne (İmar/Arsa/Belgeler/Değerleme/Bağımsız Bölüm/Ana
Gayrimenkul/Dosya ve Rapor) **yeni bir `state.fields.X` alanı** eklerken —
özellikle popup, modal, veya `createXxxControl()` tarzı özel bir yapıcıyla
yazılıyorsa — şu 3 soru cevaplanmadan iş "bitti" sayılmaz:

1. **Bu alan `sections[].fields`'ta deklaratif mi?**
   Evetse (hatta `hidden: true` ile bile olsa) genel tarama onu zaten
   otomatik topluyor — başka bir şey yapmanıza gerek yok.
   Hayırsa 2. soruya geçin.

2. **Bu alan gerçekten taşınmaza-özgü mü, yoksa rapor-geneli mi olmalı?**
   - Taşınmaza-özgüyse: ilgili bölümün `getXxxPerUnitOnlyFieldKeys()` /
     `getXxxSectionFieldKeys()` fonksiyonuna (`getValuationPerUnitOnlyFieldKeys`,
     `getDocumentsPerUnitOnlyFieldKeys`, `getUnitSectionFieldKeys`,
     `getBuildingSectionFieldKeys`, `getLandSectionFieldKeys`,
     `getImarSectionFieldKeys`) ekleyin.
   - Rapor-geneliyse (aynı iş dosyasının/binanın tamamı için tek değer —
     ör. Banka, Randevu Tarihi, çevresel açıklamalar): `TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS`'e
     ekleyin.
   - Bir "ana" alana bağlı bir DETAY/açıklama alanıysa (ör. `saleability` →
     `saleabilityNote`, `appointmentType` → `externalAppraisalReason`),
     ana alanla AYNI sınıfa (ikisi de taşınmaza-özgü ya da ikisi de
     paylaşımlı) koyun — biri diğerinden farklı davranırsa kafa karıştırır.

3. **Bölüm Excel'e (varsa) yansıması gerekiyor mu?**
   `createSectionExcelPanel()` `section.fields`'ı DOĞRUDAN tarar (hidden
   alanlar dahil, ama yalnızca deklaratif olanlar) — bir alanı Excel'de
   toplu düzenlenebilir yapmak istiyorsanız `hidden: true` ile
   `sections[]`'a ekleyin (kendi bespoke UI'ınız varsa `createForm()` onu
   görünür render ETMEZ, çakışma olmaz). **DİKKAT**: alan panel HER
   render'da koşulsuz yeniden hesaplanıyorsa (ör. `buildingAge`,
   `buildingCompletionDate`) bunu Excel'e YAPMAYIN — içe aktarılan değer
   bir sonraki render'da sessizce eski/hesaplanan haline döner
   (`tools/test-title-unit-switch.js` senaryo 31b'deki "BİLİNÇLİ OLARAK
   DIŞARIDA" listesine bakın).

## Bunu otomatik yakalayan test

`tools/test-multi-request-scoping-audit.js` (`npm run verify`'nin bir
parçası) yukarıdaki 1-2 sorularını **kaynak taramasıyla otomatik**
doğrular: `app.js`'teki her `state.fields.KEY = ...` (literal nokta-erişimli)
yazma noktasını bulur, üç güvenlik kaynağının (deklaratif alanlar +
`TITLE_UNIT_SHARED_EXPLANATION_FIELD_KEYS` + tüm `getXxxPerUnitOnlyFieldKeys()`
fonksiyonları) birleşimine karşı doğrular. Hiçbirinde yoksa test KIRILIR —
yani yeni bir alan bu 3 kaynaktan birine eklenmeden `npm run verify` YEŞİL
olmaz (test dosyasının kendi `KNOWN_EXCEPTIONS` listesine, NEDEN zararsız
olduğunu açıklamadan eklemek "testi geçirmek için" bir kaçış yoludur —
yapmayın).

## Bilinen sınırlamalar (bu tarama neyi YAKALAMAZ)

- Genel `createForm()` alanları (`state.fields[field.key] = ...`, bracket
  notation) zaten deklaratif olmak ZORUNDA olduğundan taramaya hiç girmez
  — risk yalnızca ÖZEL/programatik yazıcılarda.
- Bir alanın YANLIŞ kategoriye (paylaşımlı yerine taşınmaza-özgü, ya da
  tersi) konulduğunu YAKALAMAZ — yalnızca "hiçbir kategoride değil" durumunu
  yakalar. Doğru kategoriyi seçmek hâlâ insan kararı (yukarıdaki 2. soru).
- `state.tables` (satır tabloları) kapsam dışı — ayrı bir mekanizma
  (`getTitleUnitScopedTableKeys()`/`getSectionExcelTableKeys()`).
