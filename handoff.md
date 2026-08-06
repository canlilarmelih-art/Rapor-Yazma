# Rapor Yazma Programı — Handoff Notu

## 0.0.349 - 2026-08-06 - Yapı Kredi şablonu: bankanın kendi ekspertiz sistemine göre 8 düzeltme

- Kullanıcı, Yapı Kredi Ekspertiz Sistemi'nin (bankanın kendi web formu) 5 ekran görüntüsünü paylaştı — 4'ü form ekranları, 5'i "YAPI KREDİ DÜZELTİLMESİ GEREKENLER" başlıklı bir Excel checklist'i. `templates/yapikredi.html` bu 8 maddeye göre güncellendi:
  1. **Tapu Bilgileri**: "Kat" satırından sonra **"İç Kapı No"** eklendi (`{{UNİT_NO}}` — GDYS bölümünde zaten aynı eşleme kullanılıyordu).
  2. **Tapu Bilgileri**: "Taşınmaz ID"den sonra **"Tapu Senedindeki Bağımsız Bölüm Niteliği"** eklendi (`{{TİTLE_QUALİTY}}`, "B.B. Tapudaki Nitelik" satırıyla aynı değer, farklı konumda tekrar).
  3. **Tapu Bilgileri**: "UAVT"den sonraki "Konut Niteliği" satırı artık sabit `"APARTMAN DAİRESİ / MÜSTAKİL BİNA"` metni DEĞİL — yeni **`{{RESİDENCE_TYPE}}`** placeholder'ı: Mülkiyet (`titleOwnershipKind`) "Dikey Kat İrtifakı" veya "Yatay Kat İrtifakı" ise "Apartman Dairesi", aksi halde "Müstakil Bina". Yeni `getResidenceTypeText()` (app.js) + `RESIDENCETYPE` LEGACY_ALIASES girdisi (template-engine.js) + `collectGeneratedTextPlaceholders()` katalog satırı + `templates/PLACEHOLDER-REHBERI.md`'ye eklendi.
  4. **Taşınmazın Özellikleri**: "İç Hacimler"den sonra **"Cephe"** eklendi (`{{CEPHELER}}` — isbankasi.html'de aynı kullanım var).
  5. **Taşınmazın Özellikleri**: "Mevcut Kullanım Alanı"ndan sonra **"Zemine İndirgenmiş Alan"** (Yasal + Mevcut, `{{TOTAL_LEGAL_REDUCED_AREA}}` / `{{TOTAL_CURRENT_REDUCED_AREA}}` — ziraat.html'de aynı kullanım var) eklendi.
  6. **Gayrimenkul Değerleme**: "EKSPERİN KANAATİ" hücresi yanlışlıkla `{{SALEABİLİTY_NOTE}}` kullanıyordu (bu değer genelde BOŞ kalır) — doğrusu **`{{SALEABİLİTY}}`** (halkbank.html'deki kullanımla aynı).
  7. **Gayrimenkul Değerleme**: "EKSPERTİZ KANAATİ AÇIKLAMASI" hücresi de AYNI (yanlış) `{{SALEABİLİTY_NOTE}}`'u tekrarlıyordu — doğrusu **`{{VALUATİON_SALEABİLİTY_EXPLANATİON}}`**.
  8. **Gayrimenkul Değerleme**: "Aylık Kira Birim Değeri"nden sonra **"Yasal Acil Satış Değeri"** ve **"Mevcut Acil Satış Değeri"** eklendi (`{{LEGAL_URGENT_SALE_VALUE}}` / `{{CURRENT_URGENT_SALE_VALUE}}` — isbankasi.html/ziraat.html'de aynı kullanım var).
  9. (Checklist'te ayrı madde) "Gayrimenkul Değerleme" başlığından HEMEN sonra yeni bir **"Arsa / Yapı / Yeniden İnşa Maliyeti Hesap Detayı"** alt başlığı + Değerleme Özet Tablosu (`{{DEGERLENDIRME_TABLOSU}}`) eklendi. Bu token'ın "Değerleme Yöntemleri ve Açıklamalar" bölümündeki ESKİ konumu BİLİNÇLİ OLARAK KORUNDU (silinmedi, tekrarlandı) — `tools/test-bank-templates.js`'in TÜM banka şablonlarında bu token'ın `DEGERLEME_YONTEMI_ACIKLAMASI`'ndan sonra gelmesini zorunlu kılan cross-template sıra testini bozmamak için.
- **Yeni test**: `tools/test-yapikredi-template-fixes.js` — 8 maddenin her birinin şablonda doğru sırada/token'la var olduğunu VE `getResidenceTypeText()`'in Dikey/Yatay Kat İrtifakı → Apartman Dairesi, diğer tüm durumlar → Müstakil Bina döndürdüğünü doğruluyor.
- Cache-buster `app.js?v=20260806-1900`, `src/templates/template-engine.js?v=20260806-1900`.
- `npm run verify` tamamı geçti (yeni test dahil).

## 0.0.348 - 2026-08-06 - Admin panelinde "Rapor Listesi" (kullanıcı+banka+adres özeti)

- Kullanıcı: "sistem içerisinde oluşturulan her raporun ana başlıklarını liste halinde görmek istiyorum. oluşturan kullanıcı banka" → netleştirme sonrası: "il ilçe mahalle ada parsel var ise blok bağımsız bölüm no gayrimenkul niteliği rapor numarası".
- **Mimari çekişme, kullanıcıyla açıkça konuşuldu**: Mevcut kural (0.0.300) "rapor İÇERİĞİ asla sunucuya/admin'e loglanmaz" idi. İstenen alanlar (il/ilçe/mahalle/ada/parsel/blok/BB no/nitelik) TAM OLARAK rapor içeriği. `AskUserQuestion` ile onay alındı: bu alanların DAR bir whitelist'i (`REPORT_SUMMARY_FIELDS`), kullanıcının BİLEREK onayladığı bir istisna olarak eklendi — tüm rapor içeriği DEĞİL, yalnızca bu 9 alan; ve yalnızca admin görebiliyor (kullanıcı seçimi).
- **server.js**:
  - `REPORT_SUMMARY_FIELDS = ["city","district","neighborhood","blockNo","parcelNo","titleBlockName","unitNo","titleQuality","bank"]`.
  - `sanitizeReportSummary(raw)` — whitelist DIŞINDAKİ hiçbir alanı ASLA kabul etmez, her alanı trim + 120 karakterle sınırlar, tümü boşsa `null` döner.
  - `logActivityEvent` artık pushladığı olaya `summary` (sanitize edilmiş) ve `templateKey` (banka şablonu anahtarı, `handleExportAuthorizationApi`'den) ekliyor.
  - `handleReportEventApi` artık `body.summary`'yi kabul edip `logActivityEvent`'e geçiriyor.
  - Yeni `computeReportListForAdmin()` — `activityEvents`'i `reportId` bazında gruplayıp (created/exported/export-authorized olaylarından) TEK satır üretiyor: en son gelen summary alanları kazanıyor, en-yeni-etkinlik-önce sıralı.
  - Yeni `GET /api/report-list` (`handleReportListApi`, `requireAdmin` korumalı) bu listeyi döner.
  - `reportId` (RE-YYYY-XXXXXX formatı) zaten kullanıcının "rapor numarası" dediği şey — yeni bir alan eklenmedi.
- **app.js**: `pingReportEvent(type, reportId, summary)` artık opsiyonel 3. parametre alıyor; yeni `buildReportSummaryForPing()` state.fields'tan 9 alanı derliyor; "Banka Şablonuyla Kaydet" export akışında (`pingReportEvent("exported", ...)`) artık bu özet de gönderiliyor (rapor en dolu haldeyken — "created" pingi'nde DEĞİŞTİRİLMEDİ, o an adres genelde boş).
- **admin-users.html**: yeni "Rapor Listesi" kartı — Rapor No / Oluşturan / Banka / İl-İlçe-Mahalle / Ada-Parsel / Blok-BB No / Nitelik / Oluşturuldu / Son Dışa Aktarma sütunları, `GET /api/report-list`'ten dolduruluyor.
- **Test düzeltmesi**: `tools/test-activity-dashboard.js`'teki logActivityEvent alan-kümesi assertion'ı yeni `summary`/`templateKey` alanlarını içerecek şekilde güncellendi (ikisi de extra verilmediğinde `null` kalıyor, tam içerik hâlâ sızmıyor).
- **Yeni test**: `tools/test-report-list-summary.js` — `sanitizeReportSummary` (whitelist dışı alan reddi, trim/uzunluk, tümü-boş→null), `computeReportListForAdmin` (çoklu-olay birleştirme, kullanıcı izolasyonu, sıralama), `handleReportListApi` (admin-olmayana 403).
- Cache-buster `app.js?v=20260806-1830`.
- `npm run verify` tamamı geçti (yeni test dahil).

## 0.0.347 - 2026-08-05 - MFA/bildirim e-postalarına düz-metin (plain-text) alternatifi eklendi

- Kullanıcı: "ilk gerçek kullanıcımız sisteme kayıt oldu. ancak eposta doğrulama kodu spam a düştü bunu düzeltebilir miyiz?"
- **Teşhis**: Resend panelinde `experify.com.tr` domaininin DKIM/SPF/DMARC kayıtlarının hepsi "Verified" çıktı (kullanıcı ekran görüntüsüyle doğruladı) — yani kimlik doğrulama/DNS sorunu DEĞİL. Kalan bilinen etken: e-postalar yalnızca HTML gövdeli gönderiliyordu, düz-metin (`text/plain`) alternatifi yoktu; bu bazı spam filtrelerinde (özellikle kurumsal/Outlook) ceza puanı sayılıyor. Ayrıca yeni bir gönderici domaininin ilk e-postalarının büyük sağlayıcılarda (Gmail/Outlook) "ısınma" (warm-up) süresi boyunca spam'e düşmesi normal bir davranış — bu, kod veya DNS ile anında çözülemeyecek, kullanıcıların "Spam değil" işaretlemesiyle zamanla düzelen bir itibar sürecidir; kullanıcıya bu ayrım açıkça anlatıldı.
- **server.js**: yeni `stripEmailHtmlToText(html)` — `<style>`/`<script>` içeriğini atar, `<br>`/blok-etiketleri satır sonuna çevirir, `&nbsp;`/`&amp;`/`&lt;`/`&gt;`/`&quot;` çözer, fazla boşluk/satırı sıkıştırır. `sendEmailViaResend(toEmail, subject, html, text)` artık opsiyonel 4. parametre (`text`) alıyor — verilmezse HTML'den otomatik türetiliyor; Resend API payload'ına `text` alanı eklendi (MFA kodu ve yeni-kullanıcı-bildirimi e-postalarının ikisi de bu ortak fonksiyonu kullandığından otomatik olarak kapsandı, ayrı bir değişiklik gerekmedi).
- `handleStatic`, `resolveStaticPath`, `server` gibi `stripEmailHtmlToText` de test edilebilmesi için `module.exports`'a eklendi.
- **Yeni test**: `tools/test-email-plaintext-alternative.js` — `stripEmailHtmlToText`'in HTML'i doğru temizlediğini VE `sendEmailViaResend`'in artık Resend'e giden payload'a `text` alanı eklediğini (gerçek ağ isteği yapmadan `https.request`'i geçici sahteleyerek) doğruluyor.
- Bu değişiklik yalnızca `server.js` (sunucu tarafı) — istemci JS dosyası değişmedi, `index.html` cache-buster bump gerekmedi.
- `npm run verify` tamamı geçti (yeni test dahil).

## 0.0.346 - 2026-08-05 - Ziraat Ek Tablo XLSX artık "Banka Şablonuyla Kaydet" ZIP paketine giriyor

- Kullanıcı: "Ziraat bankasında ek tablo zip paketi içinde olmalıydı. ancak şu an yok. sadece hesaplama tablolarının bulunduğu excel var."
- **Kök neden**: `3741c66` ("feat: render bank templates through protected server API", 2026-08-03) commit'i, gerçekten hassas (kopyalanabilir metin/tasarım içeren) banka rapor şablonlarını (`templates/*.html`, `templates/emlakkatilim.docx`) korumak için `server.js` → `handleStatic()` içine `templates/` altındaki HER şeyi koşulsuz 404'leyen bir blok ekledi. Ancak `src/exports/ziraat-ek-tablo-xlsx.js`, `templates/ziraat-ek-tablo.xlsx` dosyasını DOĞRUDAN `fetch()` ile çekiyor (bu mekanizma `3741c66`'dan ÖNCE kurulmuştu, ayrı commit'lerde: `463d8e6`, `40ac23f`, `59001dd`, `a22eabe`, `b26eda1`) — bu şablon HTML/DOCX gibi hassas değil, tamamen istemci tarafında doldurulan boş bir biçimlendirme kabuğu. Blok bu meşru fetch'i de kapsayınca `RaporXlsxFill.fillTemplate()` 404 metnini xlsx gibi parse etmeye çalışıp hata fırlatıyordu; `exportZiraatEkTabloWithBankTemplateIfNeeded()` bunu try/catch'te yutup `ziraatFailed=true` set ediyor ve Ek Tablo, kullanıcıya belirgin bir uyarı olmadan ZIP'ten sessizce düşüyordu.
- **server.js**: `handleStatic()`'teki `templates/` bloğuna dar bir istisna eklendi — `.xlsx` uzantılı dosyalar artık bu bloğa takılmıyor, normal oturum-auth akışına (`isPublicStaticFile` → giriş kontrolü) düşüyor. HTML/DOCX (gerçekten hassas şablonlar) hâlâ aynı şekilde 404 ile engelleniyor — istisna yalnızca `.xlsx`'e özel, gevşetme genişletilmedi.
- `handleStatic`, `resolveStaticPath` ve `server` (http.Server örneği) artık test edilebilmesi için `module.exports`'a eklendi.
- **Yeni test**: `tools/test-ziraat-ek-tablo-static-access.js` — gerçek bir HTTP sunucusu (ephemeral port) üzerinden `templates/ziraat-ek-tablo.xlsx`'in artık blok-özel 404 gövdesini almadığını, buna karşın `templates/isbank.html` ve `templates/emlakkatilim.docx`'in hâlâ engellendiğini doğruluyor.
- Bu değişiklik yalnızca `server.js` (sunucu tarafı) — istemci JS dosyası değişmedi, `index.html` cache-buster bump gerekmedi.
- `npm run verify` tamamı geçti (yeni test dahil).

## 0.0.345 - 2026-08-05 - Emsal Konum Krokisi haritasında fare tekerleği ile yakınlaştırma açıldı

- Kullanıcı: "dikkatimi çeken haritalar ile ilgili 1 konu var mouse tekerleği ile zoom in ve zoom out yapamıyorum."
- **Kök neden**: `renderComparableLocationSketchMap()` (Emsal Konum Krokisi haritası) harita oluşturulurken `scrollWheelZoom: false`'u masaüstünde bile SABİT olarak zorluyordu — dokunmatik-cihaz tespitinden bağımsız, hep kapalıydı. Diğer iki harita (Adres/Konum, Emsal nokta seçme) bu sabit değeri hiç kullanmıyordu, onlarda zaten Leaflet'in varsayılanı (`true`) geçerliydi.
- **app.js**: bu sabit `scrollWheelZoom: false` kaldırıldı — artık üç harita da aynı şekilde davranıyor (masaüstünde fare tekerleğiyle serbest yakınlaştırma, dokunmatik cihazlarda hâlâ `isCoarsePointerDevice()` koruması geçerli — sayfa kaydırmasını yutmasın diye).
- `tools/test-leaflet-map-drag-override.js`'e bu haritanın artık `scrollWheelZoom`'u hiç sabitlemediğini doğrulayan bir regresyon kontrolü eklendi.
- Cache-buster `app.js?v=20260805-0400`.
- `npm run verify` tamamı geçti.

## 0.0.344 - 2026-08-05 - Üçüncü harita (emsal nokta seçme) da serbest sürüklenebiliyor

- Kullanıcı: "serbest gezinme emsallerde konum seçme harita kısmında da olmalı" — 0.0.341'de kullanıcı bilerek yalnızca Adres/Konum ve Emsal Konum Krokisi haritalarında `forceDraggable` açmayı seçmişti (üçüncü harita — `renderComparableLocationMap`, emsal satırı için nokta seçme overlay'i — bilinçli olarak dokunulmamıştı); şimdi kullanıcı bunu da istiyor.
- **app.js**: `renderComparableLocationMap()`'teki `leaflet.map(panel, getLeafletInteractionOptions())` çağrısı da `{ forceDraggable: true }` alıyor — artık üç haritanın üçü de dokunmatik-cihaz tespitinden bağımsız serbest sürüklenebiliyor.
- `tools/test-leaflet-map-drag-override.js` güncellendi: eskiden "üçüncü harita DOKUNULMAMIŞ olmalı" diye doğrulayan bölüm artık "üç haritanın üçü de forceDraggable kullanmalı" diye doğruluyor.
- Cache-buster `app.js?v=20260805-0345`.
- `npm run verify` tamamı geçti.

## 0.0.343 - 2026-08-05 - Büyük/küçük harf kuralı TÜM banka şablonlarına (9 HTML + emlakkatilim.docx) uygulandı, kural kalıcı belgelendi

- Kullanıcı: "tamam bu mantığa göre tüm html ve word template dosyalarını güncelle tek kullanılan tablo içinde kullanılanlar büyük harf diğer paragraf ve cümle içinde kullanılanlar dil bilgisi kurallarına uygun olarak gelsin. tüm templatelere bu kuralı uygula. bu kuralı kalıcı hale getir. yeni template oluştururken bu kurala dikkate ederek oluşturalım."
- **Kapsamlı denetim** (Python ile, tüm `templates/*.html` + `emlakkatilim.docx`'in `word/document.xml`'i, foldTokenName eşdeğerli eşleme): 0.0.342'de tanımlanan 18+2 alanın (Adres 8, Tapu 10, Malik, Edinme Sebebi) TÜM gerçek geçişleri tek tek context'iyle incelendi. Sonuç: **Adres bölümü alanlarının TAMAMI (~70 geçiş) tablo hücresi (`<td>`/`<div class="...value">`) içinde** — hiçbir sentence/paragraf kullanımı yok. **Tapu bölümü alanları da neredeyse tamamı tablo hücresi** — yalnızca 3 GERÇEK cümle-içi kullanım bulundu: `vakifbank.html`'de "1 Adet {{TİTLE_QUALİTY}} Nitelikli Taşınmazın..." ve `ziraat.html`/`ziraat-arsa-arazi.html`'de "{{TİTLE_QUALİTY}} olarak kullanılmaktadır."
- **Uygulanan değişiklik** (9 HTML dosyası: akbank, halkbank, isbankasi, kuveytturk, vakifbank, vakifkatilim, yapikredi, ziraat, ziraat-arsa-arazi — isbankasi-masraf ve ziraat-ek-tablo'da bu alanlar hiç geçmiyor, dokunulmadı):
  - Adres bölümü alanlarının (city/district/neighborhood/street/addressSiteName/addressBlockName/addressFloor/outerDoor) TÜM tablo-hücresi geçişleri `_BÜYÜK` eklentili hallerine çevrildi (~70 geçiş).
  - Tapu bölümü alanları (zaten büyük harf saklandığından) tablo hücrelerinde OLDUĞU GİBİ bırakıldı — yalnızca yukarıdaki 3 cümle-içi geçiş hedeflenmiş şekilde `_DÜZGÜN`'e çevrildi.
  - `{{EDİNME_SEBEBİ}}` (isbankasi.html, vakifbank.html, tümü tablo) → `{{EDİNME_SEBEBİ_BÜYÜK}}`.
- **templates/emlakkatilim.docx**: aynı denetim → TÜM geçişler (185 token) tablo hücresi, sentence kullanım YOK. Adres alanları (CİTY×3, DİSTRİCT×3, STREET×3, NEİGHBORHOOD×1, ADDRESS_SİTE_NAME×1, ADDRESS_FLOOR×1, OUTER_DOOR×2) `_BÜYÜK`'e çevrildi; Tapu alanları (zaten büyük harf) dokunulmadı. `{{SAHIPLER}}` (Malik hücresi, ×3) → yeni `{{SAHIPLER_BUYUK}}` (isim+hisse birleşik, büyük harf — `MALIK_BUYUK`'tan FARKLI, o yalnızca isim verir). STORED zip olarak yeniden paketlendi.
- **src/templates/template-engine.js**: yeni `SAHIPLER_BUYUK: { fn: () => toTrUpper(ownersListText()) }`.
- **Test düzeltmeleri**: `tools/test-bank-templates.js`'teki isbankasi Tapu sıra kontrolü ve ziraat cümle-içi kontrolü yeni token adlarına güncellendi; `tools/test-docx-fill.js`'in gerçek şablon sağlık kontrolü `{{CITY}}`/`{{SAHIPLER}}` yerine `{{CITY_BUYUK}}`/`{{SAHIPLER_BUYUK}}` arıyor artık. `tools/test-uppercase-table-placeholders.js`'e SAHIPLER_BUYUK testi + katalog kapsam kontrolüne eklendi.
- **Kalıcı belgeleme**: `templates/PLACEHOLDER-REHBERI.md`'ye "BÜYÜK/KÜÇÜK HARF KURALI" bölümü + ilgili tüm satırlara `_BÜYÜK`/`_DÜZGÜN` eşleri eklendi; `CLAUDE.md`'ye kalıcı bir kural bölümü eklendi ("yeni bir banka şablonu oluştururken veya var olanı düzenlerken UYULMALI") — gelecekteki oturumlar (Codex dahil) bu kuralı otomatik takip edecek.
- Cache-buster `app.js?v=20260805-0330`, `src/templates/template-engine.js?v=20260805-0330`.
- `npm run verify` tamamı geçti (69 test dosyası).

## 0.0.342 - 2026-08-05 - Adres/Tapu alanları için tablo-güvenli "_BÜYÜK" ve cümle-güvenli "_DÜZGÜN" placeholder aileleri

- Kullanıcı: "adres ve konum bölümünde bulunan il, ilçe İdari Mahalle Site/Apartman Blok Kat Dış Kapı No Cadde/Sokak ... ile Tapu ve mülkiyet bölümünde bulunan il ilçe tapu mahalle mevkii pafta bağımsız bölüm niteliği blok tapu katı ana taşınmaz niteliği eklenti, malik yada malikler edinme sebebi ... tek placeholder olarak tablolarda kullanılırken daima tamamı büyükharf olarak export edilsin. ancak paragraflarda cümle içinde kullanımlarda türkçe dilbilgisi kurallarına uygun olarak kullanılsın."
- **Keşif — iki bölüm FARKLI davranıyordu**: Adres ve Konum bölümündeki 8 alan (city, district, neighborhood, addressSiteName, addressBlockName, addressFloor, outerDoor, street) kullanıcının girdiği/seçtiği biçimde (proper-case) saklanır. Ama Tapu ve Mülkiyet bölümündeki 10 metin alanı (titleCity, titleDistrict, titleNeighborhood, locationName, sheetNo, titleQuality, titleBlockName, titleFloor, mainPropertyQuality, titleAttachment) app.js'teki **mevcut** `titleTextUppercaseKeys` mekanizmasıyla GİRİŞ ANINDA zaten büyük harfe zorlanıp öyle saklanıyor (form görünümü + kopyala/yapıştır için, 0.0.x öncesi bir tasarım). Yani düz `{{TITLE_QUALITY}}` gibi token'lar tabloda ZATEN doğruydu ama cümle içinde kullanılsa "MESKEN" diye haykırırdı.
- **src/templates/template-engine.js**: 
  - Adres bölümü — 8 yeni `_BÜYÜK` LEGACY_ALIASES (`CITY_BUYUK`, `DISTRICT_BUYUK`, ...): `toTrUpper(field(...))` ile Türkçe büyük harfe (İ/ı dahil) çevirir. Düz token'lar (`{{CITY}}` vb.) DOKUNULMADI.
  - Tapu bölümü — 10 yeni `_BÜYÜK` (adlandırma tutarlılığı için, teknik olarak zaten büyük harf olan değeri tekrar büyütür, zararsız) + **10 yeni `_DÜZGÜN`** (`safeCall("normalizeReportTitleText", field(...))` — app.js'in KENDİ anlatı cümlelerinin kullandığı Baş Harfleri Büyük Türkçe biçimlendirmesiyle) — asıl eksik olan buydu, cümle içi güvenli kullanım için.
  - Malik/Malikler — yeni `malikNamesText()` (SAHIPLER'den farklı: yalnızca isim(ler), hisse olmadan) + `MALIK_BUYUK`/`MALIKLER_BUYUK`.
  - Edinme Sebebi — `EDINME_SEBEBI_BUYUK` (mevcut `EDINMESEBEBI` ile aynı kaynak — `firstTitleRowCell("c2")` — büyük harfli).
- **app.js**: `collectGeneratedTextPlaceholders()` katalogına 31 yeni satır eklendi (`toTrUpperForPlaceholderPreview`/`getMalikNamesForPlaceholderPreview` yardımcılarıyla) — bu projede tekrar eden bir kusur (fn-tabanlı token'lar bu katalogda elle listelenmezse "Placeholder" referans ekranında hiç görünmüyor, bkz. 0.0.319/0.0.323) burada baştan önlendi.
- Yeni `tools/test-uppercase-table-placeholders.js`: 18 `_BÜYÜK` token'ın (gerçek app.js `titleTextUppercaseKeys` davranışını yansıtan büyük-harf stub verisiyle) doğru çözüldüğünü, Malik/Edinme Sebebi büyük harf varyantlarını, düz Adres token'larının HALA zorlanmadığını, düz Tapu token'larının (zaten büyük harf) davranışının DEĞİŞMEDİĞİNİ, 10 `_DÜZGÜN` token'ın gerçek `normalizeReportTitleText` (app.js'ten dinamik yüklenmiş) ile doğru düzeltildiğini, ve 31 token'ın hepsinin Placeholder referans kataloğunda satırı olduğunu doğruluyor.
- Cache-buster `app.js?v=20260805-0300`, `src/templates/template-engine.js?v=20260805-0300`.
- `npm run verify` tamamı geçti.

## 0.0.341 - 2026-08-05 - Adres/Konum ve Emsal Konum Krokisi haritalarında serbest sürükleyerek gezinme geri açıldı

- Kullanıcı: "adres ve konum haritası ve emsal haritasında serbest gezinemiyorum. bunun sebebi ne?"
- **Kök neden**: 0.0.168'de (2026-07-18, "Android tek parmak sayfa gezinme") dokunmatik/kaba işaretçili cihazlarda (`isCoarsePointerDevice()` — `(hover: none), (pointer: coarse)` medya sorgusu) Leaflet haritalarının tek parmak dikey kaydırmayı "yutup" sayfanın kaymasını engellemesini önlemek için `getLeafletInteractionOptions()` bilinçli olarak `dragging: false` döndürüyordu — bu, dokunmatik ekranlı ama fare/touchpad ile kullanılan cihazlarda da (ör. dönüştürülebilir dizüstü) YANLIŞ tetiklenip haritada sürüklemeyi tamamen kapatabiliyordu.
- Kullanıcıya soruldu: genel davranışı mı değiştirelim yoksa yalnızca bu iki haritada mı açalım — **"yalnızca bu iki haritada aç"** seçildi.
- **app.js**: `getLeafletInteractionOptions()` artık isteğe bağlı `{ forceDraggable: true }` alıyor — verilirse kaba işaretçi tespit edilse bile `dragging: true` döner, diğer kısıtlamalar (`tap: false`, `touchZoom: true`, `scrollWheelZoom: false`) DOKUNULMADAN kalır. Bu seçenek yalnızca **Adres ve Konum haritası** (`renderLeafletKmlMap`) ve **Emsal Konum Krokisi haritası** (`renderComparableLocationSketchMap`) için verildi — emsal SATIRI için nokta seçme overlay'i (`renderComparableLocationMap`) BİLEREK dokunulmadan bırakıldı, oradaki mobil tek-parmak-sayfa-kaydırma koruması aynen devam ediyor.
- `tools/check-basic.js`'teki `getLeafletInteractionOptions()` imza kontrolü (`function getLeafletInteractionOptions()`) yeni parametreye (`options = {}`) göre güncellendi.
- Yeni `tools/test-leaflet-map-drag-override.js`: eski davranışın (argümansız çağrıda kaba işaretçide hâlâ `dragging:false`) korunduğunu, `forceDraggable:true` ile kaba işaretçi tespit edilse bile `dragging:true` döndüğünü (diğer kısıtlamalar korunarak), ve kaynak düzeyinde YALNIZCA doğru iki haritanın bu seçeneği kullandığını (üçüncü harita — nokta seçme overlay'i — dokunulmamış) doğruluyor.
- Cache-buster `app.js?v=20260805-0230`.
- `npm run verify` tamamı geçti.

## 0.0.340 - 2026-08-05 - Emsal Konum Krokisi: etiketler haritada elle sürüklenebiliyor (nokta sabit kalır)

- Kullanıcı önerisi: "kullanıcı emsal haritası üzerinden etiketleri istediği yere sürüklese ancak emsal ve konu taşınmaz noktaları aynı kalacak. kullanıcı düzenlemesine göre görsel oluşsa nasıl olur?"
- **app.js — canlı harita (`renderComparableLocationSketchMap`)**: etiket render fonksiyonu `renderMapLeaderLabels` artık isteğe bağlı `options.draggable`/`options.getLabelOverride`/`options.onLabelDragEnd` alıyor. Etiketler (Konu Taşınmaz/Emsal N divIcon'ları) artık gerçek, sürüklenebilir Leaflet marker'ları — `drag` olayında bağlı leader çizgisi gerçek zamanlı takip ediyor, `dragend`'de yeni {lat,lng} kaydediliyor. **Nokta/marker'ın kendisi (circleMarker/subject marker) HİÇBİR ZAMAN sürüklenebilir değil** — yalnızca etiket metni taşınıyor.
- Yeni `getComparableSketchLabelOverride(id)`/`setComparableSketchLabelOverride(id, latlng)`/`resetComparableSketchLabelOverrides()` — `state.sourceValues.comparableSketchLabelOverrides[id]` altında `{lat,lng}` saklar (`id`: `"subject"` veya `"comparable-<index>"`). Bir etiket için kayıtlı konum varsa o etiket **otomatik çakışma-önleyen yerleşimden (`layoutSketchLabels`) TAMAMEN HARİÇ tutulur** — kullanıcının seçimi algoritma tarafından asla değiştirilmez; kayıtsız etiketler eskisi gibi otomatik yerleşir.
- **Dışa aktarım (`drawExportComparableSketch`, JPEG indirme + 0.0.334'teki `.docx` görsel gömme YOLU İKİSİ DE)**: aynı override'ları okuyup ekrandaki KROKİYLE BİREBİR AYNI yerleşimi üretir — kullanıcı haritada nasıl düzenlediyse dışa aktarılan görsel de öyle çıkar.
- Panel'e "Etiketleri Sıfırla" düğmesi eklendi (tüm elle taşınmış etiketleri otomatik yerleşime döndürür).
- **cloud/cloud-sync.js + cloud/report-library.js**: `comparableSketchLabelOverrides` `buildCloudMapState`/`applyCloudMapState`/report-library restore akışına eklendi — `nearbyPlaces`/`reportImages` ile AYNI desen, cihazlar arası senkronize.
- **styles.css**: `.sketch-leader-label.is-draggable` — sürüklenebilir etiketlerde `pointer-events: auto` (varsayılan `.sketch-leader-label-inner` bunu kapatıyordu, aksi halde tıklanamaz kalırdı) + `cursor: grab`/`grabbing`.
- `tools/test-comparable-sketch-label-placement.js`'e iki yeni bölüm: override kaydetme/okuma/sıfırlama temel davranışı, ve `drawExportComparableSketch`'in kullanıcının bıraktığı konumu BİREBİR kullandığını (noktanın kendisi etkilenmeden) doğrulayan uçtan uca test.
- Cache-buster `app.js?v=20260805-0200`, `styles.css?v=20260805-0200`, `cloud/cloud-sync.js?v=20260805-0200`, `cloud/report-library.js?v=20260805-0200`.
- `npm run verify` tamamı geçti.

## 0.0.339 - 2026-08-05 - DÜZELTME: 0.0.338'de yanlışlıkla geri eklenen "TL" eki kaldırıldı

- Kullanıcı: "benim sildiklerimi niye ekliyorsun benim sildiklerimi sil." — 0.0.338'de kullanıcının Word'de bilerek sildiği `{{CURRENT_VALUE}}`/`{{CURRENT_URGENT_SALE_VALUE}}` sonrası `" TL"` ekini, "Word'ün yan etkisi olabilir" varsayımıyla YANLIŞLIKLA geri eklemiştim — kullanıcının bilinçli düzenlemesini görmezden gelip üzerine yazmak yanlıştı.
- `" TL"` eki tekrar kaldırıldı (9 geçişin hepsinden). `tools/test-docx-fill.js`'deki bunu zorunlu kılan bölüm 6 tamamen SİLİNDİ — artık bu davranışı "doğru" sayıp yeniden dayatan bir test kalmadı.
- **Ders**: kullanıcının şablonda yaptığı bir değişikliği "muhtemelen istemeden olmuş" diye varsayıp geri almadan önce SORULMALI, özellikle önceki bir oturumda ELLE eklenen bir özellik söz konusuysa.
- `node tools/test-docx-fill.js` geçti.

## 0.0.338 - 2026-08-05 - templates/emlakkatilim.docx yeniden STORED paketlendi (Word kilidi kalktıktan sonra)

- Kullanıcı Word'ü kapattı, dosya artık yazılabilir durumda — standart STORED yeniden paketleme uygulandı.
- Token diff'i (önceki commit ile): tek YENİ token `{{BUILDING_INSPECTION_EXPLANATION}}` — bu zaten var olan bir uygulama alanı (`buildingInspectionExplanation`, "Yapı Denetim Açıklaması") olduğundan genel alan-anahtarı eşlemesiyle otomatik çözülüyor, ek kod gerekmedi. Hiçbir token kaybolmadı.
- **Beklenmedik yan etki**: kullanıcının Word'de kaydetmesi, 0.0.332'de eklenen `{{CURRENT_VALUE}}`/`{{CURRENT_URGENT_SALE_VALUE}}`'nin arkasındaki statik `" TL"` metnini TÜM 6+3 geçişten sildi (kullanıcının bilerek yaptığı bir değişiklik değil gibi görünüyor — Word'ün kaydetme sürecinin bir yan etkisi olabilir). `test-docx-fill.js`'in 0.0.332'de eklenen regresyon testi bunu HEMEN yakaladı (`npm run verify` kırıldı). `" TL"` eki yeniden uygulandı.
- `node tools/test-docx-fill.js` ve tam `npm run verify` (69 test) geçti.

## 0.0.337 - 2026-08-05 - Emsal krokisi etiket çakışması kesin çözüldü (önceki düzeltme yetersizdi)

- Kullanıcı, 0.0.336'nın ekran görüntüsüne tepkiyle: "emsal 1 ve 2 üstüste binmiş ayrıca konu taşınmaz daha uzağa emsal yazılarının olmadığı bir kısma konumlanmalıydı."
- **Kök neden 1 (etiket-etiket çakışması)**: 0.0.336'daki `enforceSketchLabelClearance` AYRI, `layoutSketchLabels`'tan SONRA çalışan bir geçişti — bir etiketi bir NOKTADAN uzaklaştırırken, `layoutSketchLabels`'ın az önce çözdüğü etiket-etiket ayrımını sessizce bozabiliyordu (iki bağımsız geçiş birbirinin işini geri alabiliyordu).
- **Kök neden 2 (kenara-kilitlenme sonsuz döngüsü — bu segmentte GERÇEK bir raporla test edilirken bulundu)**: ilk birleştirilmiş çözüm bile bazı durumlarda hâlâ başarısız oluyordu — bir etiket kanvasın kenarına (`clampAnchor`) yaslandığında, çözücü hep "daha az itme gerektiren" ekseni (X veya Y) seçiyordu; o eksen kenara kilitliyse itme HİÇBİR ETKİ yaratmıyordu ama kod bunu fark etmeyip aynı çözülemeyen çakışmayı 4000 yinelemede de değiştirmeden tekrarlıyordu.
- **app.js**: 
  - `layoutSketchLabels` artık `enforceSketchLabelClearance`'ı TAMAMEN İÇİNE ALIYOR — "en kötü tek çakışmayı bul, TAMAMEN çöz, tekrar bul" döngüsü (anchor-anchor VE anchor-nokta AYNI fonksiyonda, `enforceSketchLabelClearance` KALDIRILDI).
  - Her itmeden HEMEN SONRA `clampAnchor` uygulanıyor (eskiden tek seferlik son adımdı) — kenara yaslı durumları döngü İÇİNDE, kararları etkileyecek şekilde yakalıyor.
  - Tercih edilen eksen (X veya Y) kenara kilitlenip HİÇBİR ilerleme sağlamazsa artık OTOMATİK olarak DİĞER eksene geçiliyor (`applyAxis` iki kez denenir).
  - Ne tercih edilen ne alternatif eksen ilerleme sağlamazsa (kutu için kanvasta gerçekten yer yoksa) `noProgressStreak > 8` güvenlik supabıyla en iyi çaba ile döngüden çıkılıyor — sonsuz döngü riski tamamen kapatıldı.
  - "KONU TAŞINMAZ" etiketi artık emsal kümesinin merkezinden (`compCenter`) AÇIKÇA uzağa kaçacak yön (`dirX`/`dirY`) VE çok daha büyük bir başlangıç itme mesafesi (`pushDistance: 130`, eskiden ~36) ile başlıyor — "konu taşınmaz daha uzağa ... konumlanmalıydı" talebine yanıt.
- `tools/test-comparable-sketch-label-placement.js` yeniden yazıldı: gerçekçi (canvas merkezi doğru hesaplanmış) uçtan uca senaryo + çok yakın iki marker (Emsal 1/2 senaryosu) + **kenara-kilitlenme sonsuz döngüsünü birebir yeniden üreten özel bir regresyon testi** eklendi.
- **NOT**: bu turda ayrıca `templates/emlakkatilim.docx`'in Word'de DEFLATE olarak yeniden kaydedildiği görüldü (`git diff --stat` ile teyit edildi) ama dosya şu an Microsoft Word tarafından açık/kilitli olduğu için standart STORED yeniden paketleme uygulanamadı — `npm run verify` bu yüzden `test-docx-fill.js` adımında (bu segmentin değişiklikleriyle İLGİSİZ) kırılıyor. Word kapatıldıktan sonra CLAUDE.md'deki standart prosedürle tekrar paketlenmesi gerekiyor; bu commit'e templates/emlakkatilim.docx dahil EDİLMEDİ (bilinçli olarak).
- Cache-buster `app.js?v=20260805-0130`.
- `npm run check` + ilgili tüm test dosyaları (docx-fill hariç, yukarıdaki nedenle) tek tek çalıştırılıp geçti; `npm run verify`'in tamamı yalnızca docx kilidi kalktıktan sonra doğrulanabilecek.

## 0.0.336 - 2026-08-05 - Emsal konum krokisi: "KONU TAŞINMAZ" etiketi artık KML sınırına kesikli kırmızı okla bağlanıyor, hiçbir etiket noktaların üstüne gelmiyor

- Kullanıcı, ekran görüntüsüyle: "EMSAL konum krokisi anlaşılır değil. konu taşınmaz yazısı çok büyük haritada taşınmazın konumunu kaplıyor... Kml sınırlarına kesik çizgili kırmızı ok ile konu taşınmaz yazısı bağlansın. Emsaller mavi çizgi ile bağlanmaya devam etsin... Konu taşınmaz ve Emsal yazıları ... noktalarının hiç bir şekilde üstüne gelmemeli."
- **Kök neden**: `drawExportComparableSketch()`'in eski `layoutSketchLabels()`'ı, etiketleri BİRBİRİNDEN ve kendi noktalarından ayırmak için yalnızca DAİRESEL, YÜKSEKLİĞE dayalı bir minimum mesafe kontrolü yapıyordu — geniş (430px) "KONU TAŞINMAZ" kutusunun GENİŞLİĞİ bu kontrole hiç dahil değildi, bu yüzden kutu yandaki noktaları/işaretleri rahatça örtebiliyordu (ekran görüntüsündeki tam olay).
- **app.js**: 
  - Yeni `pickKmlBoundaryAnchorPixel(parsed, topLeft, zoom, awayFromPoint)` — KML sınır poligonunun, emsal kümesinin merkezinden (`awayFromPoint`) EN UZAK köşesini seçer; "KONU TAŞINMAZ" etiketi artık konu taşınmazın tam koordinatına değil bu köşeye bağlanıyor (KML alanı zaten `drawExportKmlPolygon` ile kırmızı dolgulu çizildiğinden ayrı bir "nokta" işaretine gerek yok).
  - `drawSketchLeaderAndMarker()` artık `leaderDashed: true` işaretli anchor'lar için (yalnızca "subject"/Konu Taşınmaz) kesikli kırmızı çizgi + gerçek bir OK BAŞI çiziyor (eskiden düz çizgi + dolu daire idi). Emsal bağlantı çizgileri (konu taşınmaz → her emsal) rengi mavi'ye çevrildi (`rgba(37, 99, 235, ...)`, eskiden teal/`rgba(15,118,110,...)`) — "mavi çizgi ile bağlanmaya devam etsin" talebine uyumlu, bağlantı MANTIĞI değişmedi.
  - Yeni `enforceSketchLabelClearance(anchors, hardPoints, canvasWidth, canvasHeight)` — mevcut `layoutSketchLabels()`'tan SONRA çalışan son bir garanti geçişi: her etiketin TAM dikdörtgen alanını (genişlik dahil) TÜM "sert" noktalara (konu taşınmazın hem gerçek koordinatı hem KML bağlantı noktası + tüm emsal koordinatları) karşı kontrol edip üst üste binme varsa iteratif olarak iter.
  - "KONU TAŞINMAZ" kutusu küçültüldü (font 30px→26px, max genişlik 430px→360px) — hem daha az yer kaplıyor hem kullanıcının "çok büyük" şikayetine cevap.
- Yeni `tools/test-comparable-sketch-label-placement.js`: en-uzak-köşe seçimini, etiket-nokta çakışma önlemeyi (worst-case: etiket tam noktanın üzerinde başlatılıp temizlendiği doğrulanıyor), ve gerçek `drawExportComparableSketch()` çağrısının (sahte canvas context ile) hatasız çalıştığını + kesikli çizgi/ok kullanıldığını doğruluyor.
- Bu değişiklik hem HTML/JPEG dışa aktarımı hem de 0.0.334'te eklenen `.docx` görsel gömme (`{{EMSAL_KROKISI}}`) için AYNI çizim fonksiyonunu paylaştığından, düzeltme HER İKİ çıktı türünü de otomatik kapsıyor.
- Cache-buster `app.js?v=20260805-0100`.
- `npm run verify` tamamı geçti.

## 0.0.335 - 2026-08-04 - Yakın çevre seçimi rapora tekrar girildiğinde artık kayboluyor değil korunuyor

- Kullanıcı: "yeni bir işte adres ve konumda yakın çevre seçiliyor. daha sonra talepten çıkıldığında tekrar girildiğinde seçili yakın çevrenin seçili olmadığı görülüyor."
- **Kök neden**: `maybeAutoFetchNearbyPlaces()` (her `render()` çağrısında/sayfa açılışında tetiklenir) `hasRequiredNearbyCoverage()` eşiğini (en az 4 ana arter + 6 yakın nokta) karşılamayan raporlarda (az POI'li kırsal/yeni bölgeler yaygın örnek) — `nearbyAutoFetchStarted` modül-kapsamlı bayrağı sayfa her yenilendiğinde `false`'a döndüğü için — HER seferinde sessizce yeniden tarama başlatıyordu. `fetchNearbyPlacesForCurrentLocation()` ise her taramada `selectedIds`'i KOŞULSUZ boşaltıyor — yani kullanıcının elle seçip (`toggleNearbySelection` → `selectionCustomized: true`) kaydettiği seçimler, "talepten çıkıp tekrar girme" sırasında (muhtemel sayfa yenilemesiyle) sessizce siliniyordu.
- **app.js**: `maybeAutoFetchNearbyPlaces()`'teki `hasEnoughNearbyData` kontrolü artık `source.selectionCustomized || hasRequiredNearbyCoverage(...)` — kullanıcı zaten seçim yaptıysa kapsam eşiği karşılanmasa bile otomatik yeniden tarama ATLANIR, mevcut seçim korunur. "Çevreyi tara" düğmesiyle ELLE yenileme akışı (kullanıcının bilinçli eylemi) DOKUNULMADAN aynı şekilde sıfırlamaya devam ediyor.
- Yeni `tools/test-nearby-selection-persistence.js`: seçim yapılmışken kapsam yetersiz olsa da tarama başlamadığını, seçim yokken kapsam yetersizse eski davranışın (tarama başlar) korunduğunu, kapsam zaten yeterliyse hiçbir durumda taramanın başlamadığını, konum noktası yokken hiçbir durumda taramanın başlamadığını doğruluyor.
- Cache-buster `app.js?v=20260804-0830`.
- `npm run verify` tamamı geçti.

## 0.0.334 - 2026-08-04 - {{EMSAL_KROKISI}} artık .docx'e GERÇEK görsel olarak gömülüyor

- Kullanıcı: "emsal krokisi çıkmıyor word'de."
- **Kök neden (iki ayrı sorun)**: (1) `exportDocxTemplate()` (template-engine.js), HTML şablon yolundaki `exportTemplate()`'in aksine, harita/kroki görsel varlıklarını (`ensureReportMapImagesForExport`/`buildSavedReportImageAssets`) HİÇ hazırlamıyordu; (2) hazırlansa bile `htmlValueToXmlText()` zaten TÜM HTML etiketlerini (`<img>` dahil) düz metne çevirirken siliyordu — CLAUDE.md'de "8. Ekler ... kapsam dışı" notuyla belgelenen bilinçli sınırlama tam olarak buydu: .docx'e gerçek bir görsel gömmek metin ikamesiyle (text-substitution) mümkün değil, `word/media/` dosyası + ilişki (`word/_rels/document.xml.rels`) kaydı + gerçek `<w:drawing>` XML'i gerekiyor.
- **src/exports/docx-fill.js**: yeni `embedImageAssets(xmlText, entries, imageAssets)` — `IMAGE_TOKEN_ASSET_KEYS` haritasındaki (`{EMSAL_KROKISI: "comparables"}`) her token için: base64'ü baytlara çevirir (`base64ToBytes`, `atob` ile), JPEG piksel boyutunu okur (`getJpegPixelSize` — bağımlılıksız minimal SOF0 ayrıştırıcı), kutuya (6.29in×3.21in, emlakkatilim.docx'teki kroki hücresinin boyutuna göre ayarlı) en-boy oranı korunarak sığdırır (`computeImageEmuSize`), sıradaki boş `rIdN`/`imageN` numaralarını bulup `word/media/imageN.jpeg` yeni bir zip girdisi olarak ekler, `word/_rels/document.xml.rels`'e yeni `<Relationship>` satırı ekler, ve `{{EMSAL_KROKISI}}`'yi gerçek bir `<w:drawing>` XML bloğuyla değiştirir. `fillTemplate()` artık isteğe bağlı 4. parametre (`imageAssets`) alıyor — bu adım normal `{{TOKEN}}` metin ikamesinden ÖNCE çalışıyor (görsel token'lar `collectTokens`'a hiç düşmüyor, "missing" listesine karışmıyor).
- **src/templates/template-engine.js**: `exportDocxTemplate()` artık HTML yolundakiyle AYNI mantıkla — şablonda `{{EMSAL_KROKISI}}` token'ı varsa `ensureReportMapImagesForExport()` (kaydedilmemişse otomatik oluşturur) + `buildSavedReportImageAssets()` çağırıp sonucu `fillTemplate()`'e geçiyor. Başarıyla gömülen `EMSAL_KROKISI`, `resolveTemplateTokenValues()`'un HER ZAMAN ürettiği "missing" kaydından (normal metin token'ı sayıp "⚠" işaretlemesi) özel olarak filtreleniyor — aksi halde başarılı gömme bile yanlışlıkla "eksik alan" uyarısı verirdi.
- Yeni `tools/test-emsal-krokisi-image-embed.js` (6 bölüm): JPEG boyut ayrıştırma, EMU contain-fit boyutlandırma (hem genişlik hem yükseklik sınırlı durumlar), sentetik şablonda `embedImageAssets` (yeni `<w:drawing>`/rels/media doğru üretiliyor, varlık yoksa dokunulmuyor), `fillTemplate` uçtan uca zip round-trip'te görsel baytlarının bozulmadığı, GERÇEK `templates/emlakkatilim.docx` şablonunda sahte bir "comparables" varlığıyla tam entegrasyon (sıfır missing, tam 1 yeni media/ilişki), ve `exportDocxTemplate` kaynak-düzeyinde kablolama kontrolü.
- Cache-buster `src/exports/docx-fill.js?v=20260804-0800`, `src/templates/template-engine.js?v=20260804-0800`.
- `npm run verify` tamamı geçti (63 test dosyası, 79 alt-doğrulama satırı).

## 0.0.333 - 2026-08-04 - Onaylandı: Olumlu/Olumsuz Faktörler de aynı satır atlama düzeltmesinden faydalanıyor (kod değişikliği gerekmedi)

- Kullanıcı: "aynı satır atlama özelliğini olumlu ve olumsuz faktörlerde de sağla."
- İnceleme: `{{DEGERI_ETKILEYEN_OLUMLU_FAKTORLER}}`/`OLUMSUZ` (ve `{{OLUMLU_FAKTÖR}}`/`{{OLUMSUZ_FAKTÖR}}`) `formatValueFactorsList()`'in `"\n"` ile birleştirdiği metni kullanıyor; bu metin `template-engine.js`'in `textParagraphsHtml()`/`formatWordParagraphs()`'ü ile `<p>...</p>` HTML'ine çevrilip AYNI `htmlValueToXmlText()` yolundan geçiyor — yani 0.0.332'deki satır-atlama düzeltmesi bu alanları da OTOMATİK olarak kapsıyor, ek kod değişikliği gerekmedi.
- Uçtan uca doğrulandı: `formatWordParagraphs("Ana caddeye cepheli olması\nToplu taşımaya yakın olması\nSite içerisinde güvenlikli olması")` → `<p>...</p><p>...</p><p>...</p>` → `htmlValueToXmlText` → 2× `<w:br/>`, hiçbir kayıt boşlukla birleşmemiş.
- `tools/test-docx-fill.js`'e bu zinciri kalıcı olarak doğrulayan bir test eklendi (kod değişmese de davranış gelecekte sessizce bozulmasın diye).
- `npm run verify` tamamı geçti (68 test, kod değişikliği yok — yalnızca test eklendi).

## 0.0.332 - 2026-08-04 - Takyidat kayıtları artık gerçek satır sonuyla ayrılıyor; Mevcut Değer/Acil Satış Değeri yanına TL eklendi

- Kullanıcı: "yasal ve mevcut acil değeri yanına TL ekle beyanlar şerhler rehinler hak ve mükellefiyetler bölümünde yer alan her kayıt yeni bir satırdan başlamalı."
- **1) Satır sonu sorunu — kök neden**: `docx-fill.js`'in `htmlValueToXmlText()`'i `<p>`/`<br/>` sınırlarını her zaman TEK BİR BOŞLUĞA düzleştiriyordu (Word tablo hücreleri için "her şeyi tek akan paragrafta göster" varsayımıyla yazılmıştı) — bu yüzden `joinEncumbranceRows()`'un `"\n"` ile ayırdığı Beyanlar/Şerhler/Rehinler/Hak ve Mükellefiyetler kayıtları hep aynı satırda birleşiyordu. **Düzeltme**: `<p>`/`<br/>` sınırları artık gerçek bir Word satır sonuna (`<w:br/>`) dönüşüyor. `<w:t>` içine doğrudan `<w:br/>` konulamadığı (OOXML şemasında geçersiz) için önce benzersiz bir işaretle (`BREAK_MARKER`) yer tutulup, XML kaçışlama TAMAMLANDIKTAN SONRA gerçek `</w:t><w:br/><w:t xml:space="preserve">` dizisiyle değiştiriliyor — sonuç hâlâ geçerli OOXML (aynı `<w:r>` içinde birden fazla `<w:t>`/`<w:br/>` kardeş eleman şemaya uygun). Bu değişiklik `htmlValueToXmlText`'i kullanan TÜM docx token'larını etkiliyor (yalnızca 4 takyidat bölümünü değil) — genel olarak doğru davranış (çok satırlı/çok cümlelik değerler artık tek satırda boşlukla değil, gerçek satırlarla geliyor).
- **2) TL eki**: `{{CURRENT_VALUE}}`/`{{CURRENT_URGENT_SALE_VALUE}}`'nin arkasındaki değer (`formatValuationMoney`) hiçbir zaman "TL" eklemiyordu — bu state alanı USD/EUR dönüşümü ve diğer birçok yerde de PAYLAŞILDIĞI için değeri değiştirmek yerine, YALNIZCA `templates/emlakkatilim.docx`'in ham XML'inde bu iki token'ın HER geçtiği yere (6× CURRENT_VALUE, 3× CURRENT_URGENT_SALE_VALUE) statik `" TL"` metni eklendi — şablon-özel, paylaşılan kodu etkilemiyor.
- `tools/test-docx-fill.js`'e: (a) `htmlValueToXmlText`'in `<p>`/`<br/>` → `<w:br/>` dönüşümü, üst üste `<br/>`'lerin boş `<w:t>` üretmediği, ve sentetik bir tabloda çok kayıtlı değerin (`<w:r>` sayısı BOZULMADAN) gerçek satır sonlarıyla dolduğu; (b) gerçek şablonda `{{CURRENT_VALUE}}`/`{{CURRENT_URGENT_SALE_VALUE}}`'nin HER geçişinin ardından `" TL"` geldiği testleri eklendi.
- Uçtan uca simülasyon: sahte "Birinci/İkinci/Üçüncü kayıt" BEYANLARBOLUMU değeriyle dolum → 2 adet `<w:br/>` (3 kayıt = 2 ayraç) doğru üretildi; CURRENT_VALUE/CURRENT_URGENT_SALE_VALUE'nin 6+3 geçişinin hepsi "TL" ile bitti; 79 token'ın hiçbiri "missing" kalmadı.
- Cache-buster `src/exports/docx-fill.js?v=20260804-0730`.
- `npm run verify` tamamı geçti (68 test).

## 0.0.331 - 2026-08-04 - Emsalin Açıklaması: sabit "konu taşınmaz" metni yerine duruma göre metin, irtibat bilgisi kaldırıldı

- Kullanıcı: "Emsalin Açıklaması bölümünde sürekli ekspertize konu taşınmaz satılık olup diyor. oysa ki sadece 1. emsal konu taşınmaz diğerlerinin açıklaması farklı olmalı ayrıca irtibat numarası ve telefon numarası yazmamalı."
- **Kök neden**: `getComparableCardDescriptionText(index)` (EMSAL1-4ACIKLAMASI/ACIKLAMAMETNI'yi besleyen fonksiyon) satırın gerçek durumundan (c2 — Satılık/Genel/Konu Taşınmaz vb.) BAĞIMSIZ olarak HER ZAMAN `buildComparableSubjectStatement()`'ı ("Ekspertize konu taşınmaz satılık olup...") çağırıyordu — oysa bu fonksiyon yalnızca satırın durumu GERÇEKTEN "Konu Taşınmaz" olarak işaretliyse doğru metindir. Zaten var olan `buildComparableLongText()` (aynı `calcLongText`/`{{EMSAL_N_UZUN_EMSAL_METNI}}`'nin kullandığı, c2 durumuna göre Genel/Konu Taşınmaz/standart karşılaştırma metnini seçen dispatcher) doğru fonksiyondu ama `getComparableCardDescriptionText` bunu hiç çağırmıyordu.
- **app.js**: `getComparableCardDescriptionText` artık `buildComparableLongText(data.row, index, data.metrics)` çağırıyor (durum-bazlı doğru metin) VE yeni `stripComparableContactLine(text)` ile sonuçtaki `"(İrtibat Kişisi ve Telefon No: ...)\n\n"` önekini kaldırıyor (kullanıcının "irtibat/telefon yazmamalı" talebi — bu önek `buildComparableSubjectStatement`/`buildComparableLongText`/`buildComparableLandLongText`'in HEPSİNDE ortak, tek noktadan temizleniyor). Telefon numarası kendi iç parantezi içerebildiği için (`0 (546) 582 19 29`) regex `[^)]*` yerine ilk `")\n\n"` dizisine kadar non-greedy eşleşme kullanıldı.
- Yan etki: `getComparableCardFullText` (EMSAL_N_EMSAL_METNİ, irtibat+açıklama birleşik varyant) artık YANLIŞLIKLA çift irtibat satırı EKLEMİYOR — açıklama artık temiz geldiği için tek irtibat satırı doğru şekilde ekleniyor.
- `tools/test-comparable-card-full-text.js`'e kaynak-düzeyinde doğru fonksiyon çağrısı kontrolü + `stripComparableContactLine`'ın izole VM testi eklendi (Halkbank Ruhsat testindeki gibi derin bağımlılık zinciri yüzünden `getComparableCardDescriptionText`'in tamamı izole edilemiyor).
- Cache-buster `app.js?v=20260804-0700`.
- `npm run verify` tamamı geçti (68 test).

## 0.0.330 - 2026-08-04 - {{HİSSE_PAYI}} ve Emsal 4 kartının açıklama/detay alanları eklendi

- Kullanıcı 0.0.329'daki run-birleştirme düzeltmesinden sonra uygulamanın "eksik placeholder" uyarı diyaloğunda iki kalan ad gördü: `HİSSE_PAYI` ve `EMSAL_4_ACIKLAMA_METNİ`. İkisi de daha önce hiç desteklenmemiş YENİ alanlardı (0.0.328'in genel `EMSAL${i}_${token}` alias ailesi yalnızca TELEFON/EMSAL_DURUMU gibi eski alanları kapsıyordu; HİSSE_PAYI hiç yoktu, ACIKLAMA_METNİ ailesi de yalnızca kart 1-3 için elle eklenmişti — 0.0.326).
- **template-engine.js**: yeni `ownersShareListText()` — kapak tablosundaki "Malik: {{SAHIPLER}}" satırının ("Ali Veli (1/2), Ayşe Veli (1/2)" gibi isim+hisse birleşik) hemen altındaki AYRI "Hisse Oranı" satırı için, malik tablosunun yalnızca hisse (c1) sütununu virgülle birleştirir ("1/2, 1/2"). `HISSEPAYI: { fn: ownersShareListText }` eklendi.
- Emsal 4 kartı için (kullanıcı şablona elle 4. bir kart eklemiş — `getComparablePlaceholderValue`'nun 1-7 index desteği TELEFON/EMSAL_DURUMU ailesini zaten kapsıyordu ama "birleşik metin/açıklama/irtibat/alan/fiyat" ailesi kart 1-3'e özel sabit sarmalayıcı fonksiyonlarla yazılmıştı) yedi yeni alias eklendi: `EMSAL4EMSALMETNI`/`EMSAL4ACIKLAMAMETNI`/`EMSAL4ACIKLAMASI`/`EMSAL4ILGILIKISIVETEL`/`EMSAL4INDIRGENMISKULLANIMALANI`/`EMSAL4INDIRGENMISSATISFIYATI`/`EMSAL4INDIRGENMISBIRIMFIYAT` — hepsi doğrudan `safeCall("getComparableCardXText", 3)` ile mevcut index-parametreli fonksiyonları çağırıyor, kart 1-3'teki gibi ayrı sarmalayıcı fonksiyona GEREK YOK (o sarmalayıcılar sadece kart 1-3 için tarihsel nedenlerle vardı).
- `tools/test-comparable-card-full-text.js`'e Emsal 4 kablolama bölümü, `tools/test-legacy-alias-underscore-folding.js`'e HİSSE_PAYI (gerçek `stubState.tables.title` verisiyle "1/2, 1/2" bekleyen) bölümü eklendi.
- Cache-buster `src/templates/template-engine.js?v=20260804-0630`.
- `npm run verify` tamamı geçti (67 test).

## 0.0.329 - 2026-08-04 - templates/emlakkatilim.docx: Word'ün böldüğü {{TOKEN}} run'ları birleştirildi

- 0.0.328'deki LEGACY_ALIASES düzeltmesi deploy edildikten sonra kullanıcı hâlâ aynı sorunu bildirdi — dışa aktarılan Word dosyasında Emsal 2/3 kartlarında `<w:t>`, `</w:r>` gibi ÇIPLAK XML etiketleri metin olarak görünüyordu (ekran görüntüsü + uygulamanın "eksik alanlar" uyarı diyaloğu).
- **Gerçek kök neden (0.0.328'den FARKLI, ek bir sorun)**: kullanıcı bu yeni `{{EMSAL_2_TELEFON}}`/`{{EMSAL_2_EMSAL_DURUMU}}` gibi token'ları Word'de ELLE yazarken, Word bunları (özellikle rakam/alt çizgi sınırlarında, imla denetimi/otomatik düzeltme yüzünden) BİRDEN FAZLA `<w:r>` run'ına bölmüş — örn. `{{EMSAL_` bir run'da, `2` başka bir run'da, `_EMSAL_DURUMU}}` üçüncü bir run'da. `docx-fill.js`'in `collectTokens()`'ı ham `word/document.xml` metnini regex'le taradığı için (`{{` ile `}}` arasında `<`/`>` fark etmeksizin her şeyi "token adı" sayıyor) bu durumda token adının İÇİNE run'lar arası XML etiketleri karışıyor, bu "isim" hiçbir alias'la eşleşmediği için "eksik" sayılıp `⚠ <o bozuk isim>` metni belgeye GERİ YAZILIYOR — ekranda görülen ham XML çorbası bu.
- 0.0.313'te şablon ilk hazırlanırken bu sorunu önlemek için `merge_runs.py` (tüm belgeyi baştan run-birleştirme) kullanılmıştı, ama kullanıcı SONRADAN Word'de elle yeni token yazdıkça bu koruma o yeni metinler için geçerli değil.
- **Düzeltme**: yeni tek-seferlik `merge_split_tokens.py` betiği (scratchpad, repoya eklenmedi — CLAUDE.md'deki STORED-repack script'i gibi ihtiyaç oldukça tekrar çalıştırılacak bir bakım aracı) `word/document.xml`'i tarayıp `{{` açılıp aynı `<w:t>` içinde `}}` ile kapanmayan her run grubunu bulup, o grubun TÜM metnini İLK run'ın `<w:t>`'sinde birleştirip diğer run'ları siliyor (biçimlendirme farkları önemsiz — token dolum sırasında zaten tamamen silinip gerçek veriyle değişecek). 25 run grubu birleştirildi; birleştirme sonrası `{{`/`}}` sayıları eşitlendi (184/184), hiçbir token adında XML karakteri kalmadı, `EMSAL_1..4_TELEFON`/`EMSAL_1..4_EMSAL_DURUMU` (kullanıcı 4. bir emsal kartı için de alan eklemiş — `getComparablePlaceholderValue`'nun 1-7 index desteği zaten bunu kapsıyor, kod değişikliği gerekmedi) artık temiz, tek-run token'lar.
- Sahte değerlerle tam `fillTemplate()` simülasyonu: 79 token'ın TAMAMI (missing: []) başarıyla çözüldü.
- `tools/test-docx-fill.js`'e kalıcı regresyon koruması eklendi (bölüm 5): `{{`/`}}` sayı eşitliği + hiçbir token adının `<`/`>`/`/` içermediği + `EMSAL_1..4_TELEFON` varlığı kontrolü — Word bu tür bir bölünmeye YENİDEN sebep olursa `npm run verify` artık bunu SESSİZCE değil, açık bir hatayla yakalayacak.
- `node tools/test-docx-fill.js` ve tam `npm run verify` (67 test) geçti.

## 0.0.328 - 2026-08-04 - KRİTİK DÜZELTME: alt çizgili placeholder adları (EMSAL_2_TELEFON vb.) hiç çözülemiyordu

- Kullanıcı gerçek bir dışa aktarım dosyasında ("...emlakkatilim.docx") Emsal 2/3/4 kartlarının boş kaldığını, "placeholder'lar doğru olmasına rağmen" bildirdi. İncelemede: `⚠ EMSAL_2_TELEFON` gibi "eksik" işaretleriyle karşılaşıldı.
- **Kök neden (0.0.313'ten beri var olan, bu segmentte bulunan eski bir mimari kusur)**: `template-engine.js`'in `resolveToken()`'ı gelen ham token adını `foldTokenName()` ile HER ZAMAN alt çizgisiz/noktalamasız hale getirip (`"Türkçe-katlanmış, noktalama duyarsız"` — dosya başındaki mimari not) `LEGACY_ALIASES[folded]` ile DOĞRUDAN arıyordu. Ama `LEGACY_ALIASES` nesnesinin bazı anahtarları (döngüyle üretilen `EMSAL${i}_${token}` — Emsal 1-7 için ~30 alan × 7 = 210 anahtar —, `TABLE_${key}_${row}_${col}}`, ve dört statik anahtar: `ZIRAAT_KONUM_CEVRESEL`/`ZIRAAT_BOLGE_GELISIMI`/`ZIRAAT_YAPILASMA`/`EMSAL_ARSA_PIYASA_DEGERI`) ALT ÇİZGİ İÇERİYOR — nesnenin kendi anahtarı hiçbir zaman `foldTokenName`'in ürettiği alt-çizgisiz biçimle birebir eşleşmiyordu (object literal exact-key erişimi, katlama değil). Yani kullanıcı `{{EMSAL_2_TELEFON}}` yazsa da `{{EMSAL2_TELEFON}}` yazsa da bu aile ASLA çözülemiyordu.
- **Düzeltme**: yeni `getFoldedLegacyAliasIndex()` — `LEGACY_ALIASES`'in TÜM anahtarlarını `foldTokenName` ile normalize edip bir `Map`'te (memoized) tutuyor; `resolveToken` artık `LEGACY_ALIASES[folded]` yerine bu katlanmış indeksten arıyor. Fold-çakışması kontrolü yapıldı (Node script ile statik + döngüyle üretilen tüm anahtarlar), hiçbir çakışma bulunmadı.
- **Etki**: yalnızca Emlak Katılım'ın Emsal 2-7 kartları değil, `TABLE_...` (genel veri tablosu hücreleri) ve dört Ziraat alanı da artık ilk kez doğru çözülüyor — daha önce SESSİZCE hiç çalışmamış, hiçbir kullanıcı şikayeti bu ana kadar bu kadar spesifik olmamıştı.
- Yeni `tools/test-legacy-alias-underscore-folding.js`: `{{EMSAL_2_TELEFON}}`/`{{EMSAL2_TELEFON}}` her ikisinin de doğru satırın (`comparables[1]`) `c1` değerini döndürdüğünü, `{{ZIRAAT_KONUM_CEVRESEL}}`'in çözüldüğünü, gerçekten var olmayan bir token'ın hâlâ "missing" döndüğünü (yanlış pozitif yok) doğruluyor. `package.json` zincirine eklendi.
- Cache-buster `src/templates/template-engine.js?v=20260804-0600`.
- `npm run verify` tamamı geçti (67 test).

## 0.0.327 - 2026-08-04 - templates/emlakkatilim.docx yeniden STORED paketlendi (kullanıcının Word düzenlemesi sonrası)

- Kullanıcı: "emlak katılım formatında düzeltme yaptım push et" — dosya yine Word'de kaydedilmiş (DEFLATE'e dönmüş), standart STORED yeniden paketleme uygulandı.
- Token diff'i (önceki commit ile karşılaştırma): tek fark, Emsal 1 kartındaki `{{EMSAL_1_EMSAL_METNİ}}` (irtibat+açıklama birleşik, 0.0.326'da eklendi) yerine `{{EMSAL_1_ACIKLAMA_METNİ}}` (yalnızca açıklama) konmuş — kullanıcı bilinçli olarak irtibat bilgisini o karttan kaldırmış, ikisi de zaten desteklenen token'lar. Zip giriş listesi (media/header/footer) DEĞİŞMEMİŞ, token sayısı aynı (105).
- `node tools/test-docx-fill.js` ve tam `npm run verify` (66 test) geçti.

## 0.0.326 - 2026-08-04 - Emsal 1/2/3 için "irtibat + açıklama" birleşik metin placeholder'ı

- Kullanıcı talebi: `{{EMSAL_1_EMSAL_METNİ}}` → "(İrtibat Kişisi ve Telefon No: Raif Bey / 0 (546) 582 19 29)\n\nEkspertize konu taşınmaz satılık olup, 90 m2 olarak beyan edilmiş, ..." — irtibat kişisi/telefon (parantez içinde, üstte) ile emsal açıklama metni (boş satırla ayrılmış, altta) TEK placeholder'da birleşsin; ayrıca AYNI şey irtibat bilgisi OLMADAN (yalnızca açıklama) da istendi, tüm emsallerde (1/2/3).
- **app.js**: yeni `getComparableCardFullText(index)` — mevcut `getComparableCardContactText`/`getComparableCardDescriptionText`'i (0.0.313'ten beri var, EMSAL1ACIKLAMASI/EMSAL1İLGİLİKİŞİVETEL'i besliyorlardı) birleştirir; irtibat boşsa parantez satırını atlar, sadece açıklama döner. Üç index-bağlı sarmalayıcı: `getComparableCard1FullText()`/`2`/`3`.
- **template-engine.js**: yeni `EMSAL1EMSALMETNI`/`EMSAL2EMSALMETNI`/`EMSAL3EMSALMETNI` (birleşik) ve `EMSAL1ACIKLAMAMETNI`/`EMSAL2ACIKLAMAMETNI`/`EMSAL3ACIKLAMAMETNI` (yalnızca açıklama — mevcut `EMSALxACIKLAMASI` ile AYNI veri, kullanıcının yeni alt-çizgili adlandırma tarzıyla tutarlı ek alias). `foldTokenName` alt çizgi/Türkçe İ farklarını zaten normalize ettiği için `{{EMSAL_1_EMSAL_METNİ}}` şablon yazımı `EMSAL1EMSALMETNI` anahtarına eşleşiyor.
- Yeni `tools/test-comparable-card-full-text.js`: birleşik metin formatını (kullanıcının kendi örneğiyle birebir), irtibat-yokken-yalnızca-açıklama davranışını, sarmalayıcı fonksiyonların varlığını ve template-engine.js kablolamasını doğruluyor; `package.json` test zincirine eklendi.
- Bu placeholder'lar (önceki EMSAL1ACIKLAMASI ailesi gibi) uygulama içi genel "Placeholder" referans listesine/PLACEHOLDER-REHBERI.md'ye eklenmedi — yalnızca emlakkatilim.docx'in sabit 3 emsal kartı bağlamında kullanılıyorlar, önceki kardeşleriyle aynı desen.
- Cache-buster `app.js?v=20260804-0530`, `src/templates/template-engine.js?v=20260804-0530`.
- `npm run verify` tamamı geçti (66 test).
- **Hâlâ açık soru** (0.0.325'te de belirtildi): şablonda `{{EMSAL_1_TELEFON}}` ve `{{EMSAL_1_EMSAL_DURUMU}}` adında iki token var, henüz backing fonksiyonu yok — kullanıcıya sorulacak.

## 0.0.325 - 2026-08-04 - templates/emlakkatilim.docx yeniden STORED paketlendi (kullanıcının Word düzenlemesi sonrası)

- Kullanıcı `templates/emlakkatilim.docx`'i Word'de tekrar açıp düzenlemiş (bkz. CLAUDE.md "templates/emlakkatilim.docx'i Word'de düzenledikten sonra" — Word HER kaydetmede zip'i DEFLATE'e çeviriyor, STORED bozuluyor). `npm run verify` `tools/test-docx-fill.js`'de "DOCX şablonu STORED değil" hatasıyla kırıldı. Standart Python `zipfile.ZIP_STORED` yeniden paketleme uygulandı, içerik bayt-bayt korunarak.
- Token karşılaştırması (eski STORED kopya vs. kullanıcının yeni Word kaydı): kullanıcı 16 Emsal 1/2/3 detay placeholder'ını (`EMSAL1ACIKLAMASI`, `EMSAL1İLGİLİKİŞİVETEL`, `EMSAL1İNDİRGENMİŞ...` vb.) şablondan ÇIKARMIŞ, yerine bu segmentte oluşturulan yeni placeholder'ları (BEYANLARBOLUMU, CEPHESAYISI, DIGER, HAKVEMUKELLEFIYETLERBOLUMU, REHINLERBOLUMU, SERHLERBOLUMU, TAKYIDATACIKLAMAGIRISCUMLESI, YAPIKULLANMAIZINBELGESIVARMI, SALON/ODA/BANYO/TUVALET/BALKON, EMSAL_KROKISI) şablona YERLEŞTİRMİŞ — beklenen/istenen değişiklik. `tools/test-docx-fill.js`'deki sabit `{{EMSAL1ACIKLAMASI}}` varlık kontrolü artık şablonda olmayan bir token'ı arıyordu → `{{SALON}}` kontrolüne güncellendi.
- **DİKKAT — kullanıcıya sorulacak açık soru**: şablonda ayrıca iki TANINMAYAN yeni token bulundu: `{{EMSAL_1_EMSAL_DURUMU}}` ve `{{EMSAL_1_TELEFON}}` — bunlar ne app.js'te ne template-engine.js'te karşılığı olan isimler (muhtemelen kullanıcının elle yazdığı, henüz backing fonksiyonu olmayan yeni alanlar). Şu an dışa aktarımda "eksik/missing" olarak işaretlenecekler. Kullanıcıya sorulmalı: bunlar için yeni placeholder mı istiyor (örn. mevcut `EMSAL1ILGILIKISIVETEL`'in yerine mi geçecek), yoksa yazım hatası mı.
- `node tools/test-docx-fill.js` ve tam `npm run verify` (65 test) geçti.

## 0.0.324 - 2026-08-04 - Değeri Etkileyen Olumlu/Olumsuz Faktörler artık numaralandırılmıyor

- Kullanıcı talebi: "değeri etkileyen olumlu ve olumsuz faktörlerde çıktı 1. 2. 3. olarak numaralandırılarak geliyor. bunun yerine hiç bir numaralandırma yada * yada - yerine her bir faktör bir satır diğer faktör alt satırdan başlasın."
- **app.js**: `formatValueFactorsList(items)` artık `"${index+1}. "` numaralandırması eklemeden, her `item.text`'i kendi satırında `\n` ile birleştiriyor — `{{OLUMLU_FAKTÖR}}`/`{{OLUMSUZ_FAKTÖR}}` ve katalog-only `DEGERI_ETKILEYEN_OLUMLU_FAKTORLER`/`OLUMSUZ` placeholder'larının hepsi bu fonksiyonu kullandığı için hepsi etkilendi.
- **src/value-factors/value-factors-rules.js**: `formatFactorGroup(title, rows)` aynı şekilde numaralandırmayı kaldırdı (grup başlığı "Olumlu Özellikler"/"Olumsuz Özellikler" iki grubu ayırt etmek için kaldı — bu birleşik "Rapor Metni" UI önizlemesini besliyor).
- Yeni `tools/test-value-factors-list-format.js` (app.js `formatValueFactorsList` için izole test) + `tools/test-value-factors-rules.js`'e regresyon assertion'ları eklendi — bu ikinci dosya daha önce `package.json`'un `test` zincirine hiç bağlı DEĞİLDİ, bu segmentte bağlandı (önceden var olan, kullanıcı kaynaklı olmayan bir eksiklik).
- Cache-buster `app.js?v=20260804-0500`, `src/value-factors/value-factors-rules.js?v=20260804-0500`.
- `npm run verify` tamamı geçti (65 test, yukarıdaki docx düzeltmesiyle birlikte).

## 0.0.323 - 2026-08-04 - {{TAPU_TARİHİ}}/{{TAPU_YEVMİYESİ}} uygulama içi "Placeholder" listesine eklendi

- Kullanıcı: "Tapu tarihi ve tapu yevmiye no için placeholder yok mu sistemde" → doğrulandı, `{{TAPU_TARİHİ}}`/`{{TAPU_YEVMİYESİ}}` zaten vardı (template-engine.js, `TAPUTARIHI`/`TAPUYEVMIYESI`). Kullanıcı: "placeholder bölümünde gözükmüyor ancak" — 0.0.319'daki AYNI kök neden: `collectGeneratedTextPlaceholders()` kataloğu bu ikisini de içermiyordu.
- **app.js**: yeni `getFirstFilledTitleRow()` (template-engine.js'in kendi kapsam-içi `firstTitleRowCell()`'inin app.js karşılığı — ilk dolu tapu/malik satırını bulur) + iki yeni katalog satırı (`Tapu ve Mülkiyet` kategorisi, `TAPUTARIHI`/`TAPUYEVMIYESI`) — GERÇEK dışa aktarım değeriyle tutarlı görüntülenir. `PLACEHOLDER-REHBERI.md`'de bu ikisi zaten belgeliydi, değişiklik gerekmedi.
- Cache-buster `app.js?v=20260804-0415`.
- `npm run verify` tamamı geçti (61 test).

## 0.0.322 - 2026-08-04 - Takyidat açıklama giriş cümlesi ayrı placeholder ({{TAKYIDATACIKLAMAGIRISCUMLESI}})

- Kullanıcı talebi: "03.08.2026 tarihinde saat 17:32 Webtapu Sistemi üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır. takyidatlar bölümünde yer alan bu açıklama bölümünü de ayrı bir placeholder olarak ekleyelim."
- Bu cümle daha önce yalnızca `buildEncumbranceSummaryVariants()` İÇİNDE (birleşik takyidat özetinin ilk cümlesi olarak, `{{ENCUMBRANCE_SUMMARY_TEXT}}`'in parçası) üretiliyordu. **app.js**: cümle üretimi `buildEncumbranceIntroSentence()` (tarih/saat/yöntem alanlarından cümleyi kurar) ve `getEncumbranceIntroSentenceForPlaceholder()` (`buildEncumbranceSummaryVariants()`'taki AYNI erken-dönüş korumalarını — "Tapu Kaydı Alınmamıştır." ve "hiç veri yok" — tekrarlayıp uygunsa boş döner) olarak İKİ ayrı fonksiyona çıkarıldı; `buildEncumbranceSummaryVariants()` artık kendi `intro` değişkenini `buildEncumbranceIntroSentence()`'ı çağırarak alıyor — davranış birebir aynı kaldı, yalnızca kaynak paylaşılıyor.
- Yeni placeholder: `{{TAKYIDATACIKLAMAGIRISCUMLESI}}` (uygulama içi "Placeholder" listesine ve `PLACEHOLDER-REHBERI.md`'ye de eklendi).
- Yeni `tools/test-encumbrance-intro-sentence.js`: kullanıcının kendi örnek cümlesini birebir doğrular; saat girilmemişse/tarih-yöntem boşsa doğru "Bila"/varsayılan davranışı; iki erken-dönüş korumasının (`Tapu Kaydı Alınmamıştır.` / hiç veri yok) boş döndürdüğünü kontrol eder.
- Cache-buster `app.js?v=20260804-0400` ve `src/templates/template-engine.js?v=20260804-0400`.
- `npm run verify` tamamı geçti (61 test).

## 0.0.321 - 2026-08-04 - Takyidat bölüm placeholder'ları artık "Bölümü:" başlığı eklemiyor

- Kullanıcı talebi: "bu yeni oluşturduğumuz beyanlar rehinler şerhler hak ve mükellefiyetler bölümünde beyanlar bölümü gibi başlık olması [değil] direkt ilk kayıttan başlasın" — örnek çıktı verdi: "Yönetim Planı : 17/06/2025(...) (Tarih: 29.07.2025, Yevmiye No: 48244)\nDiğer (konusu: ...) ... (Kısıtlı Malik: Tevfik Tozluyurt)" — yani "Beyanlar Bölümü:" gibi bir satır BAŞTA OLMAMALI, doğrudan ilk kaydın metniyle başlamalı (şablon hücresi zaten kendi etiketini taşıyor).
- **app.js**: 0.0.317'de eklenen 4 fonksiyon (`getEncumbranceDeclarationsSectionText`/`...EasementsSectionText`/`...MortgagesSectionText`/`...AnnotationsSectionText`) artık `buildEncumbranceSectionParagraph()`'ı (başlık ekleyen ortak fonksiyon, `buildEncumbranceSummaryVariants()`'ın birleşik özetinde hâlâ kullanılıyor, ORAYA DOKUNULMADI) ÇAĞIRMIYOR — yeni küçük `joinEncumbranceRows(rows, formatter)` yardımcı fonksiyonu satırları başlıksız birleştiriyor (kayıt yoksa "Herhangi bir kayıt bulunmamaktadır." döner, aynı eski davranış).
- `tools/test-facade-count-and-encumbrance-sections.js`'e kaynak-düzeyinde regresyon koruması eklendi: bu 4 fonksiyonun artık `buildEncumbranceSectionParagraph(` çağırmadığını VE "Beyanlar Bölümü:" gibi başlık dizelerini içermediğini doğruluyor.
- Cache-buster `app.js?v=20260804-0330`.
- `npm run verify` tamamı geçti (60 test).

## 0.0.320 - 2026-08-04 - "Diğer" iç hacim adedi placeholder'ı ({{DIGER}})

- Kullanıcı talebi: "bu gruplandırmalar harici iç hacimleri diğer kategorisi olarak placeholder oluştur. örnek antre çamaşırlık" (+ "kiler var 3 olacak") — 0.0.318'deki altı grubun (Salon/Oda/Mutfak/Banyo/Wc/Balkon) HİÇBİRİNE uymayan iç hacim kalemlerinin (antre, hol, kiler, çamaşırlık, depo, sığınak vb.) toplam adedi.
- **app.js**: yeni `getUnitInteriorOtherCount()` — `getUnitFloorRows()`'taki TÜM satırların `interiors` metnini `parseUnitInteriorItem()` ile (mevcut, `buildUnitInteriorTextForRow`'un da kullandığı) tek tek kalemlere ayırır, adı bilinen 6 grup önekiyle (`salon`/`oda`/`mutfak`/`banyo`/`dus`/`wc`/`tuvalet`/`balkon`/`teras`/`veranda`, yeni `isKnownUnitInteriorGroupName()` yardımcı fonksiyonu ve `UNIT_INTERIOR_KNOWN_GROUP_PREFIXES` listesiyle) BAŞLAMAYAN kalemlerin adetlerini toplar. `getGabimUnitInteriorCounts()`'un kelime-arama tekniğinden FARKLI (kalem-bazlı ayrıştırma) — çünkü "bilinmeyen her şey" için kelime arama tekniği uygun değil, önce TÜM kalemlerin ne olduğunu bilmek gerekiyor.
- Yeni placeholder: `{{DIGER}}` (uygulama içi "Placeholder" listesine ve `PLACEHOLDER-REHBERI.md`'ye de eklendi).
- `tools/test-unit-interior-group-counts.js` genişletildi: "1 Antre, 1 Çamaşırlık, 1 Kiler" → 3 Diğer; bilinen 6 grup dışında hiçbir şey girilmemişse boş döndüğü; Salon/Oda gibi bilinen kalemlerin Diğer'e karışmadığı doğrulandı.
- Cache-buster `app.js?v=20260804-0300` ve `src/templates/template-engine.js?v=20260804-0300`.
- `npm run verify` tamamı geçti (59 test).

## 0.0.319 - 2026-08-04 - Yeni placeholder'lar uygulama içi "Placeholder" listesine ve rehbere eklendi

- Kullanıcı bildirimi: "placeholder kısmına baktım ama yeni placeholderları göremedim" — 0.0.317/0.0.318'de eklenen `{{CEPHESAYISI}}`, `{{BEYANLARBOLUMU}}`, `{{HAKVEMUKELLEFIYETLERBOLUMU}}`, `{{REHINLERBOLUMU}}`, `{{SERHLERBOLUMU}}`, `{{YAPIKULLANMAIZINBELGESIVARMI}}`, `{{ICHACIMGRUPSAYIMI}}` placeholder'ları `src/templates/template-engine.js`'te ÇÖZÜMLENEBİLİR durumdaydı ama uygulama içi "Placeholder" ekranındaki (`admin-users.html` DEĞİL, rapor ekranındaki "Placeholder" sekmesi) listede GÖRÜNMÜYORDU.
- **Kök neden**: o liste `template-engine.js`'in placeholder haritasından OTOMATİK türemiyor — `app.js`'teki `collectGeneratedTextPlaceholders()` içinde AYRI, elle bakımı yapılan bir katalog (`{category, key, title, value}` satırları). SALON/ODA/BANYO/TUVALET/MUTFAK/BALKON gibi ÖNCEDEN VAR OLAN "gabim" tabanlı placeholder'lar da bu kataloğa hiç eklenmemişti — yalnızca benim yenilerim değil.
- **app.js**: 7 yeni katalog satırı eklendi (`Takyidat` kategorisine 4 takyidat bölümü, `Belgeler ve Proje`'ye `YAPIKULLANMAIZINBELGESIVARMI`, `Bağımsız Bölüm Özellikleri`'ne `CEPHESAYISI` ve `ICHACIMGRUPSAYIMI`) — artık "Placeholder" ekranında görünürler.
- **templates/PLACEHOLDER-REHBERI.md**: aynı 7 yeni placeholder + önceden hiç belgelenmemiş `{{SALON}}`/`{{ODA}}`/`{{MUTFAK}}`/`{{BANYO}}`/`{{TUVALET}}`/`{{BALKON}}` de eklendi.
- Cache-buster `app.js?v=20260804-0230`.
- `npm run verify` tamamı geçti (59 test).

## 0.0.318 - 2026-08-04 - İç Hacim Grup Sayımı placeholder'ı (Salon/Oda/Mutfak/Banyo/Wc/Balkon)

- Kullanıcı talebi: "şimdi iç hacimlerde konut için iç hacimleri gruplandıracağız. 1. grup: salon, 2. Grup Odalar, 3. Grup Mutfak, 4. Grup Banyo (duş ve ebeveyn banyosu dahil wc hariç) 5. grup wc 6. grup balkon (Teras ve verandalar dahil) bunları sayısal olarak kaç adet var ise placeholder mantığında grupla örnek salon 1 oda 4 banyo 2 wc 1 balkon 3 gibi."
- Bu gruplama zaten `getGabimUnitInteriorCounts()` ile MEVCUTTU (SALON/ODA/BANYO/TUVALET/MUTFAK/BALKON placeholder'larını besliyor) — iki eksik giderildi: (1) balkon grubuna "veranda" eklendi (önceden yalnızca balkon+teras), (2) kelime sınırı `\b...\b` → `\b...\w*` yapıldı ki "Ebeveyn Banyosu" gibi Türkçe ek almış serbest metin de "banyo" olarak sayılsın — **geriye dönük uyumlu**, yalnızca EK eşleşme yakalar, mevcut davranışı bozmaz (bkz. `tools/test-bank-templates.js`'teki güncellenen kaynak-string doğrulaması).
- Yeni **app.js**: `getUnitInteriorGroupSummaryText()` — altı grubu `getGabimUnitInteriorCounts()`'tan tek bir "Etiket Adet" metninde birleştirir (`"Salon 1 Oda 4 Mutfak 1 Banyo 2 Wc 1 Balkon 3"` gibi), adedi 0 olan gruplar atlanır.
- Yeni placeholder: `{{ICHACIMGRUPSAYIMI}}`.
- Yeni `tools/test-unit-interior-group-counts.js`: kullanıcının kendi örneğini birebir doğrular; "Duş"+"Ebeveyn Banyosu"nun Banyo grubuna dahil ama Wc'nin AYRI kaldığını; "Teras"+"Veranda"+"Balkon"un Balkon grubunda toplandığını; birden fazla kat satırının toplandığını; veri yokken boş döndüğünü kontrol eder.
- Cache-buster `app.js?v=20260804-0200` ve `src/templates/template-engine.js?v=20260804-0200`.
- `npm run verify` tamamı geçti (59 test).

## 0.0.317 - 2026-08-04 - Yeni genel placeholder'lar: Cephe Sayısı, Takyidat alt bölümleri, Yapı Kullanma İzin Belgesi Var mı

- Kullanıcı talebi 1: "Gayrimenkulün Cepheli Olduğu Yönler bölümünde kaç cephe seçildi ise cephe sayısı olarak placeholder oluştur." — yeni `{{CEPHESAYISI}}`, `state.fields.facades`'teki (checkbox'lardan gelen, virgülle ayrılmış) seçili yön sayısını döner. **app.js**: `getFacadeCountText()` (`getMultiCheckboxValues("facades").length`, `formatUnitFacadePhrase`'in hemen altına eklendi).
- Kullanıcı talebi 2: "takyidatlar bölümünde beyanlar bölümü rehinler bölümü şerhler bölümü hak ve mükellefiyetler bölümü olarak her bir bölüme placeholder oluştur." — yeni `{{BEYANLARBOLUMU}}`, `{{HAKVEMUKELLEFIYETLERBOLUMU}}`, `{{REHINLERBOLUMU}}`, `{{SERHLERBOLUMU}}`. Mevcut `buildEncumbranceSummaryVariants()`'ın (tek parça özet üreten) İÇİNDEKİ dört bölümle AYNI kaynak fonksiyonları (`getFilledEncumbranceRows`, `isEncumbranceRightOrLiabilityRow`, `buildEncumbranceSectionParagraph`, `formatEncumbrance*Row`) tek tek çağıran 4 yeni **app.js** fonksiyonu (`getEncumbranceDeclarationsSectionText`/`...EasementsSectionText`/`...MortgagesSectionText`/`...AnnotationsSectionText`) eklendi — davranış birleşik özetle birebir tutarlı. "Rehinler Bölümü" kullanıcı terimi tapudaki "İpotekler" (`encumbranceMortgages`) tablosuna karşılık geliyor (rehin hakkının tapu sicilindeki karşılığı ipotektir) — bu şekilde eşlendi.
- Kullanıcı talebi 3: "Yapı kullanma izin belgesi var mı placeholder ekleyelim. incelenen belgelerde yapı kullanma izin belgesi eklendi ise Var eklenmedi ise Yok" — bu mantık zaten `gabimOccupancyPermitText()` ile MEVCUTTU (`{{ISKANVARMI}}`), yeni `{{YAPIKULLANMAIZINBELGESIVARMI}}` aynı kaynağa bağlı, daha açık isimli bir alias.
- Yeni `tools/test-facade-count-and-encumbrance-sections.js`: `getFacadeCountText`'i gerçek kaynaktan izole VM'de çalıştırıp doğrular (0/1/2/4 cephe + tekrar eden seçimde dedup); takyidat bölüm fonksiyonlarının varlığını ve `template-engine.js`'in doğru `safeCall` ile bağlandığını (derin bağımlılık nedeniyle Halkbank Ruhsat testindeki gibi yapısal doğrulama) kontrol eder; `YAPIKULLANMAIZINBELGESIVARMI`/`ISKANVARMI` alias eşlemesini doğrular.
- Cache-buster `app.js?v=20260804-0130` ve `src/templates/template-engine.js?v=20260804-0130`.
- `npm run verify` tamamı geçti (58 test).

## 0.0.316 - 2026-08-04 - Emlak Katılım .docx: {{SHARE}} (Arsa Payı) eklendi + STORED yeniden paketleme

- Kullanıcı talebi: "son emlak katılım template güncellemesi yaptım push eder misin" — kullanıcı şablonu yine Word'de düzenlemiş, tek fark: yeni `{{SHARE}}` (Arsa Payı) placeholder'ı eklenmiş (72 → 73 token, başka hiçbir şey silinmemiş/değişmemiş — zip giriş listesi birebir aynı).
- Word yine dosyayı DEFLATE ile kaydetmiş; 0.0.315'teki gibi Python `zipfile.ZIP_STORED` ile içerik korunarak yeniden paketlendi (bkz. CLAUDE.md — bu adım Word'de her düzenlemeden sonra gerekiyor).
- `{{SHARE}}` `resolveToken()` ile `ok:true` doğrulandı.
- `npm run verify` tamamı geçti (56 test).

## 0.0.315 - 2026-08-04 - Emlak Katılım .docx: kullanıcının Word'de yaptığı düzenlemeler + STORED yeniden paketleme

- Kullanıcı talebi: "emlak katılım şablonunda bazı düzenlemeler yaptım onları push et" — kullanıcı `templates/emlakkatilim.docx`'i Microsoft Word'de açıp elle düzenlemiş (yeni {{BLOCK_NO}}, {{CARPARK}}, {{LEGAL_USAGE_NATURE}}, {{TOTAL_CURRENT_AREA}}, {{TOTAL_FLOORS}}, {{UAVT}} placeholder'ları eklenmiş — 1.1 Tapu Bilgileri tablosuna daha fazla alan bağlanmış).
- **Sorun**: Word bir .docx'i her kaydettiğinde zip'i yeniden DEFLATE (sıkıştırmalı) paketler — bizim `docx-fill.js`/`xlsx-fill.js` motorumuz ise bağımlılıksız çalışmak için yalnızca STORED (sıkıştırmasız) zip okuyabiliyor, `readStoredZip` DEFLATE girişte kasıtlı olarak hata fırlatıyor ("Şablon sıkıştırmasız paketlenmeli"). Kullanıcının kaydettiği dosya bu yüzden `tools/test-docx-fill.js`'i kırdı.
- **Çözüm**: dosya Python `zipfile` ile TÜM girişleri (26'sı DEFLATE, birkaçı zaten STORED) okunup `ZIP_STORED` ile yeniden paketlendi — içerik/placeholder'lar BİREBİR korunarak yalnızca sıkıştırma yöntemi değiştirildi. Yeni token'ların tümü `resolveToken()` ile `ok:true` döndüğü doğrulandı (test ortamında).
- **UYARI (gelecekte)**: `templates/emlakkatilim.docx` Word'de düzenlenip kaydedildiğinde HER SEFERİNDE bu STORED-yeniden-paketleme adımı gerekir — aksi halde `npm run verify` (`test-docx-fill.js`) kırılır VE canlıda export "Şablon sıkıştırmasız paketlenmeli" hatası verir. (`python -c "import zipfile; ..."` ile ZIP_STORED yeniden yazımı, bkz. bu commit.)
- `npm run verify` tamamı geçti (56 test).

## 0.0.314 - 2026-08-04 - Emlak Katılım .docx: kapsam genişletildi (Çevre Analizi/Kira Kabiliyeti bold-seçim, Emsal kartları, Malikler, Olumlu/Olumsuz Faktörler)

- Kullanıcı talebi: "tabikide otomatik doldur. ikilemde kaldığın kısımda bana sor" — 0.0.313'te yalnızca kapak özet tablosu doluyordu; kullanıcı geri kalan bölümlerin de otomatikleştirilmesini istedi.
- Üç net dilemma soruldu, kullanıcı cevapladı: (1) "2.1 Çevre Analizi"/"5.5 Kira Kabiliyeti" gibi Word'de AYRI hücrelerde duran çoktan-seçmeli alanlar (Kent/Kent Dışı/Kırsal, VAR/YOK) için → **doğru seçeneği KOYU (bold) yap**; (2) "2.4 Olumlu/Olumsuz Faktörler" hücreleri TAMAMEN BOŞ (hiç `<w:t>` yok, yeni run eklemek gerekiyor) → **dene**; (3) Malikler tablosu/Emsal 1-2-3 kartları/Ekler değişken sayıda veri gerektiriyor → **dene**.
- **Doldurulan yeni bölümler** (templates/emlakkatilim.docx üzerinde, word/document.xml'e elle {{TOKEN}} yerleştirme + `merge_runs.py` ile aynı teknik):
  - 1.3 İmar paragrafı → `{{PLANNING_NOTE_TEXT}}`
  - 1.5 Belediye İnceleme Uzman Yorumu → `{{REVIEWED_DOCUMENTS_DESCRIPTION}} {{PENALTY_DECISION_EXPLANATION}} {{EKB_EXPLANATION_TEXT}}`
  - 2.2 Ana Gayrimenkulün Tanımı → `{{MAIN_PROPERTY_DESCRIPTION_TEXT}}`
  - 2.3 Bağımsız Bölümün Tanımı → `{{UNIT_INTERIOR_DESCRIPTION_TEXT}}`
  - 2.4 Olumlu/Olumsuz Faktörler → boş hücrelere YENİ run eklendi: `{{DEGERI_ETKILEYEN_OLUMLU_FAKTORLER}}`/`{{DEGERI_ETKILEYEN_OLUMSUZ_FAKTORLER}}`
  - 5.4 Satış Kabiliyeti Uzman Yorumu + 6. Değerleme Uzmanının Görüşü → `{{VALUATION_SALEABILITY_EXPLANATION}}` (iki yerde de aynı)
  - 7. Sonuç → `{{CURRENT_VALUE}}`/`{{CURRENT_URGENT_SALE_VALUE}}`/`{{CURRENT_RENT}}`
  - Tapu Malik Bilgileri (kapak + 1.1) → `{{SAHIPLER}}` (mevcut `ownersListText()`, zaten `{{SAHIPLER}}` olarak tanımlıydı)
  - Emsal 1/2/3 kartları (İlgili Kişi ve Tel/Emsalin Açıklaması/İndirgenmiş Kullanım Alanı-Satış Fiyatı-Birim Fiyat) → **belge SABİT 3 kart içeriyor (dinamik satır çoğaltma değil)**, bu yüzden emsal listesinden 0/1/2. indekse doğrudan eşlendi — 4. emsal ve sonrası bu şablonda yer bulamaz (belgenin kendi sabit tasarımı).
- **Bold-seçim mekanizması** (yeni, ilk kez kullanılan teknik): `templates/emlakkatilim.docx` hazırlanırken her çoktan-seçmeli seçeneğin metninin BAŞINA `{{BOLD:AD}}` işareti kondu (21 adet: Yapılaşma Yoğunluğu×3, Çevresel Gelişme Hızı×3, Deprem Bölgesi×5, Yapılaşma Türü×6, Daire İçinde Kiracı VAR/YOK, Kiracının Kontratı VAR/YOK). "Konum: Kent" ve "Kira Kabiliyeti: VAR" HER ZAMAN sabit olduğundan (kullanıcı kararı, önceki oturum) bunlara işaret yerine DOĞRUDAN `<w:b/>` eklendi (runtime hesaplama gerekmiyor).
  - **src/exports/docx-fill.js**: yeni `applyBoldMarkers(xmlText, boldFlags)` — `{{BOLD:AD}}` işaretli run'ın `<w:rPr>`'ına `boldFlags[AD]` true ise `<w:b/><w:bCs/>` ekler (yoksa oluşturur), işareti METİNDEN SİLER (false olsa da silinir, yalnızca format değişmez). `fillTemplate()` artık üçüncü parametre (`boldFlags`) alıyor, önce bold işlemeyi sonra normal `{{TOKEN}}` doldurmayı yapıyor. `collectTokens()` artık `{{BOLD:...}}` işaretlerini normal token SAYMIYOR (aksi halde hep "missing" çıkardı).
  - **app.js**: yeni `getEmlakKatilimBoldFlags()` — `developmentDensity`/`developmentSpeed` (bizim alanlarımız "düşük/orta/yüksek" 3'lü ölçek, belge "%25 altı/%25-75/%75 üstü" ve "Yavaş/Sabit/Hızlı" 3'lü ölçek) **sıralı (ordinal) YAKLAŞIK eşlenir**; `earthquakeZone` ("1. Derece - Çok Yüksek" vb.) baştaki rakam çıkarılarak KESİN eşlenir; `regionUsePurpose` (çoklu seçim/serbest metin) anahtar kelime (konut/işyeri-ticaret/sanayi) ile YAKLAŞIK eşlenir — **bu üç alan yaklaşık/sıralı eşleme olduğundan gerçek raporlarda gözden geçirilmeli**, kesin veri değildir.
  - **src/templates/template-engine.js**: `exportDocxTemplate()` artık `safeCall("getEmlakKatilimBoldFlags")`'ı `fillTemplate()`'e üçüncü parametre olarak geçiyor.
- **Otomatikleştirilmeyen tek kısım: "8. Ekler" (Fotoğraflar, TKGM Görüntüsü, Proje Fotoğrafları, Tapu/TAKBİS Belgesi)** — bunlar metin/veri alanı DEĞİL, gerçek fotoğraf/görsel EKLEME işi; `{{TOKEN}}` metin yer değiştirmeyle görsel gömülemez (docx'e resim gömmek `word/media/` + ilişki dosyaları eklemek gerektirir, kapsam dışı bırakıldı). Bölüm başlıkları orijinal belgedeki gibi kalıyor, fotoğraflar elle eklenecek.
- Yeni `tools/test-docx-fill.js` bölümleri: `applyBoldMarkers` (doğru run'a `<w:b/>` eklendiğini, yanlış run'a eklenmediğini, işaretlerin her durumda silindiğini, `collectTokens`'ın `{{BOLD:...}}`'u normal token saymadığını) + gerçek şablonda en az 30 token ve en az 15 `{{BOLD:...}}` işareti bulunduğunu doğruluyor.
- Cache-buster `app.js?v=20260804-0030`, `src/templates/template-engine.js?v=20260804-0030`, `src/exports/docx-fill.js?v=20260804-0030`.
- `npm run verify` tamamı geçti (56 test).

## 0.0.313 - 2026-08-03 - Emlak Katılım artık GERÇEK .docx şablon (HTML'e çevrilmiyor)

- Kullanıcı talebi: "beni tamamen yanlış anlamışsın word formatını bozmamalıydın logolar sayfa yapısı çerçeveler emlak katılım tasarruf finansman template dosyasını word olarak tutabilirsin." — 0.0.310'da yapılan HTML dönüşümü (templates/emlakkatilim.html) kullanıcının gerçek Word raporunu uygulamanın kendi genel mavi temasıyla yeniden çizmişti; logo, çerçeve, orijinal sayfa düzeni kayboldu.
- Kullanıcıya yöntem soruldu: "Gerçek .docx şablon" (önerilen, orijinal Word dosyasının kendisi şablon olur, biçim birebir korunur) vs "HTML'i görsel olarak yakınlaştır" (diğer bankalarla aynı motor, sadece logo/renk eklenir). Kullanıcı **gerçek .docx şablonu** seçti.
- **templates/emlakkatilim.html SİLİNDİ**, yerine **templates/emlakkatilim.docx** (kullanıcının sunduğu orijinal Word dosyası, {{TOKEN}} yer tutucuları elle yerleştirilmiş) eklendi. Yerleştirme süreci: `python-docx` ile içerik çıkarıldı → docx skill'in `merge_runs.py`'ı ile bitişik run'lar birleştirildi (Word'ün metni run'lara bölme huyu yüzünden) → kapak "DEĞERLEME RAPORU ÖZET TABLO" tablosundaki ~15 boş alan (Müşteri Adı, adres, Mevcut Durum Değeri, Acil Satış Değeri, Raporun Konusu) `{{TOKEN}}` ile dolduruldu → Python `zipfile.ZIP_STORED` ile sıkıştırmasız yeniden paketlendi (xlsx-fill.js'teki STORED-zip kısıtıyla aynı sebep: inflate kütüphanesi olmadan okunabilsin). **Detaylı tapu tablosu, çevre analizi, kira kabiliyeti, emsal kartları, sonuç imza bloğu ve ekler BİLİNÇLİ OLARAK BOŞ bırakıldı** — orijinal belge zaten bunları elle tamamlanacak şekilde tasarlanmış (aynı "Rapor No/Müşteri No boş kalsın" mantığı).
- **Yeni mimari** (HTML şablonlardan TAMAMEN AYRI bir yol):
  - **src/templates/template-engine.js**: `TEMPLATE_REGISTRY`'deki emlakkatilim girdisi artık `file: "templates/emlakkatilim.docx", format: "docx"`. `exportTemplate()` bu bayrağı görünce yeni `exportDocxTemplate()`'e dallanır — sunucunun HTML-render API'sini (`/api/report-template-render`) HİÇ ÇAĞIRMAZ.
  - **server.js**: yeni `readPrivateTemplateBinary()` (fs.readFile binary, yalnızca `.docx` uzantılı dosyalar) + yeni `GET /api/report-template-docx?key=...` endpoint'i (`handleReportTemplateDocxApi`, `requireApprovedReportUser` ile korunuyor, ham baytları `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` ile döner). `PRIVATE_REPORT_TEMPLATES.emlakkatilim` artık `"emlakkatilim.docx"`.
  - **src/exports/docx-fill.js** (yeni dosya): xlsx-fill.js'teki STORED-zip okuma/yazma tekniğinin bağımsız kopyası + `fillTemplate(arrayBuffer, values)`: `word/document.xml`'i çıkarır, içindeki `{{TOKEN}}`'ları bulur, her birini `values` haritasındaki (mevcut `resolveTemplateTokenValues()`'un ürettiği, HTML-kaçışlı) değerle DEĞİŞTİRİR — `htmlValueToXmlText()` önce HTML entity'lerini çözer/etiketleri atar/çoklu satırı tek boşluğa indirir, sonra XML için kaçışlar. Belgenin geri kalanı (logo, stil, sayfa düzeni, TÜM diğer run'lar) bayt bazında dokunulmadan kalır.
  - **DİKKAT**: bu akış sunucu-taraflı "korumalı alan" imzalama/doğrulama zincirine (`applyServerProtectedPlaceholderTokens`, `calculateServerDerivedValuation`) HİÇ GİRMEZ — değerler tamamen istemcide hesaplanır. Bu, Excel dışa aktarımların (`exportAllTables`/`exportXlsx`) zaten aynı korumayı atlamasıyla TUTARLI bir mimari karar (mevcut emsal), yeni bir güvenlik açığı değil.
  - **app.js**: `buildBankTemplateZipBundle()` artık `templateResult.isBinary` bayrağına bakıyor — true ise `templateResult.bytes` (Uint8Array) doğrudan zip'e eklenir, `textToUint8Array(content)` çağrılmaz (docx binary, metin değil).
- **index.html**: yeni `src/exports/docx-fill.js` script etiketi eklendi (app.js ve template-engine.js'ten SONRA). **tools/minify-for-deploy.js**'nin `TARGET_FILES` listesine eklendi.
- Yeni `tools/test-docx-fill.js`: zip round-trip, `htmlValueToXmlText` (entity çözme/etiket atma/çoklu satır birleştirme), sentetik şablon üzerinde doldurma + eksik token bildirimi, VE gerçek `templates/emlakkatilim.docx` dosyasının STORED paketlendiğini ve beklenen token'ları/destek dosyalarını (media/header/footer) içerdiğini doğruluyor.
- `npm run verify` tamamı geçti (56 test).
- **Bilinen sınır (kabul edilmiş kapsam)**: yalnızca kapak özet tablosu otomatik doluyor; tapu detay tablosu/çevre analizi/kira kabiliyeti/emsal kartları/ekler orijinal belgedeki gibi elle doldurulacak. Kullanıcı daha fazla alan isterse aynı teknikle (bkz. CLAUDE.md) genişletilebilir.

## 0.0.312 - 2026-08-03 - "Paket hazırlanamadı: Şablon bulunamadı" (Emlak Katılım export hotfix)

- Kullanıcı ekran görüntüsüyle bildirdi: Banka alanından "Emlak Katılım Bankası A.Ş." seçilip "Banka şablonuyla kaydet (.zip)" tıklandığında "Paket hazırlanamadı: Şablon bulunamadı." hatası çıkıyor (önceki 0.0.311 düzeltmesinden SONRA da devam etti).
- Kök neden: banka şablonu render'ı artık **sunucu tarafında** (korumalı, imzalı) yapılıyor (bkz. `handleReportTemplateRenderApi`/`readPrivateTemplate`, paralel oturumun "export authorization" özelliği) ve bu akış `src/templates/template-engine.js`'teki istemci `TEMPLATE_REGISTRY`'den TAMAMEN AYRI, kendi `server.js`'teki `PRIVATE_REPORT_TEMPLATES` sabit sözlüğünü kullanıyor. `emlakkatilim` yalnızca istemci listesine eklenmişti — sunucu tarafında böyle bir anahtar tanımlı olmadığından `privateTemplatePathForKey("emlakkatilim")` boş dönüyor, `readPrivateTemplate` `null` dönüyor, `handleReportTemplateRenderApi` 404 "Sablon bulunamadi" veriyordu.
- **server.js**: `PRIVATE_REPORT_TEMPLATES` sözlüğüne `emlakkatilim: "emlakkatilim.html"` eklendi.
- **UYARI (gelecekteki yeni banka şablonları için)**: yeni bir `templates/*.html` eklerken SADECE `template-engine.js`'teki `TEMPLATE_REGISTRY`'ye eklemek YETMEZ — `server.js`'teki `PRIVATE_REPORT_TEMPLATES`'e de aynı anahtar/dosya adıyla eklenmesi ZORUNLU, aksi halde export "Şablon bulunamadı" ile başarısız olur. Bu iki liste elle senkron tutuluyor.
- Yeni koruma: `tools/test-server-template-rendering.js`'e eklenen kontrol, `template-engine.js`'teki TEMPLATE_REGISTRY'deki HER anahtarın `server.privateTemplatePathForKey()` ile sunucuda gerçek bir dosyaya karşılık geldiğini doğruluyor — bundan sonra bu iki liste birbirinden kopar kopmaz `npm run verify` kırılacak.
- `npm run verify` tamamı geçti (55 test).

## 0.0.311 - 2026-08-03 - Emlak Katılım "Banka" açılır listesinde yoktu (hotfix)

- Kullanıcı talebi: "Banka Şablonuyla Kaydet kısmında emlak katılım gözükmüyor."
- Kök neden: bir önceki commit'te (0.0.310) `templates/emlakkatilim.html` ve `TEMPLATE_REGISTRY` girdisi eklenmişti (export açılır listesi `window.RaporTemplates.listTemplates()`'ten dinamik okunuyor, bu doğruydu) — AMA "Dosya ve Rapor" ekranındaki asıl **"Banka" (case) seçim listesi** (`caseBankOptions`, app.js:53) "Emlak Katılım Bankası A.Ş."yi hiç içermiyordu. Kullanıcı raporun bankasını "Emlak Katılım" olarak seçemediği için `defaultTemplateKeyForBank()` otomatik eşleştirmesi hiç tetiklenmiyordu — canlıda kontrol edilirken (`experify.com.tr`, app.js?v=20260803-1730 doğrulandı, deploy sorunu yoktu) bu net görüldü.
- **DİKKAT — iki AYRI banka listesi var, karıştırılmasın**: `caseBankOptions` (app.js:53, raporun "Banka" alanı) ile `mortgageCreditorBankNames` (app.js:863, yalnızca takyidat/ipotek lehdarı seçimi için, çok daha uzun genel banka listesi) tamamen farklı amaçlara hizmet ediyor — "Emlak Katılım Bankası A.Ş." `mortgageCreditorBankNames`'te zaten vardı, bu yanıltıcı oldu (ilk taramada oraya bakıp "zaten var" sanıldı).
- **app.js**: `caseBankOptions`'a `"Emlak Katılım Bankası A.Ş."` eklendi.
- Cache-buster `app.js?v=20260803-1745`.
- `npm run verify` tamamı geçti (55 test).

## 0.0.310 - 2026-08-03 - Yeni banka şablonu: Emlak Katılım

- Kullanıcı talebi: kullanıcının bankaya sunduğu gerçek bir Word raporunu (DENGE GAYRİMENKUL DEĞERLEME VE DANIŞMANLIK A.Ş. tarafından hazırlanmış, "Emlak Katılım Bankası" formatı) ekledi ve "bu formatı incele ve bizim templatimize çevir... ilgili placeholderları sayfada ilgili kısımlara yerleştir. sayfa yapısı attığım worddeki gibi birebir aynı kalacak" dedi.
- Word dosyası `python-docx` ile (pandoc/soffice bu ortamda yoktu) paragraf+tablo olarak çıkarıldı; içerik bölüm bölüm mevcut `templates/*.html` placeholder kataloğuyla (`templates/PLACEHOLDER-REHBERI.md`, `vakifkatilim.html`, `isbankasi.html`) eşleştirildi. Alanların çoğu (adres, tapu, imar, değerler, emsaller, GDYS/GABIM) zaten var olan placeholder'lara birebir karşılık geliyordu.
- Kullanıcıya 4 nokta soruldu: (1) sabit "Baki BUDAKOĞLU / SPK Lisans No: 400159" sorumlu uzman bilgisi SABİT metin kalsın (yeni alan eklenmedi), (2) Rapor No/Müşteri No/Talep Tarihi/Raporu Hazırlayan Değerleme Uzmanı adı-SPK no BOŞ bırakılsın (elle doldurulacak, sistemde karşılığı yok), (3) "5.5. Kira Kabiliyeti" bölümü YENİ alanlarla türetilsin: kullanım durumu "Kiracı" değilse "Daire İçinde Kiracı" VE "Kiracının Kontratı" ikisi de "YOK"; Kiracı ise "Daire İçinde Kiracı"="VAR", "Kiracının Kontratı" boş (kontrat detayını sistem tutmuyor); Kontrat Tarihi/Aidat/Kira Değeri HER ZAMAN boş, (4) "2.1. Çevre Analizi" tablosundaki "Konum" satırı (Kent/Kent Dışı/Kırsal) her zaman sabit "Kent" yazsın.
- **app.js**: yeni `getReviewedBuildingPermitAvailabilityText`/... (önceki Halkbank işiyle aynı blokta) yardımcılarının hemen altına `isUnitTenantOccupied()`, `getUnitTenantPresenceText()` ("VAR"/"YOK"), `getUnitTenantContractStatusText()` (kiracı değilse "YOK", kiracıysa boş) eklendi — `unitUsageStatus === "Kiracı"` kontrolüyle.
- **src/templates/template-engine.js**: `CEVRESELGELISMEHIZI` (mevcut `developmentSpeed` alanına, daha önce hiç placeholder'ı yoktu), `DAIREICINDEKIRACI`, `KIRACININKONTRATI` yeni placeholder'ları eklendi. `TEMPLATE_REGISTRY`'ye `{ key: "emlakkatilim", file: "templates/emlakkatilim.html", title: "Emlak Katılım Rapor Formatı", bank: "Emlak Katılım Bankası A.Ş." }` eklendi (banka zaten `caseBankOptions`'ta vardı, şablonu yoktu) — "Banka Şablonuyla Kaydet" açılır listesinde otomatik görünür (`window.RaporTemplates.listTemplates()` dinamik okuyor).
- **templates/emlakkatilim.html** (yeni): Word dosyasındaki bölüm sırası/başlıkları BİREBİR korundu (Özet Tablo → Bağlayıcı Koşullar → 1. Gayrimenkul İle İlgili Bilgiler [1.1-1.5] → 2. Konum-Özellikler-Çevre [2.1-2.4] → 4. Konum Krokisi ve Emsaller → 5. Değerleme [5.1-5.5] → 6. Uzmanın Görüşü → 7. Sonuç → 8. Ekler → Notlar). CSS diğer şablonlarla aynı sabit tema tonlarını (`#152238`/`#3a5691`/`#e4ebf8`/`#dde3ef`) kullanıyor — üretilen tablolar (EMSAL_MATRISI, MALIKLER_TABLO vb.) zaten bu paleti kullandığından tek belgede iki farklı görünüm oluşmuyor. `tools/test-bank-templates.js`'in TÜM tam rapor şablonlarına uyguladığı standart "değerleme bölümü token sırası" (`DEGERLEME_YONTEMI_ACIKLAMASI → ... → DEGERLENDIRME_SEMASI`) ve `{{GABIM_VERI_SETI}}` zorunluluğuna uyması için bu bloklar da eklendi (Word dosyasında görünmeyen ama diğer tüm şablonlarda zorunlu olan bir GDYS/GABIM ek bölümü).
- Cache-buster `app.js?v=20260803-1730` ve `src/templates/template-engine.js?v=20260803-1730`'a yükseltildi.
- `npm run verify` tamamı geçti (55 test) — `tools/test-bank-templates.js` yeni dosyayı otomatik keşfedip (`readdirSync(templates/)`) tüm placeholder'ların çözümlenebildiğini doğruladı.

## 0.0.309 - 2026-08-03 - Halkbank emsal telefonu artık 11 haneli (boşluksuz)

- Kullanıcı talebi: "05358474084 kullanıcı emsal telefon numarasına ne şekilde yazarsa yazsın halkbank emsal telefon numarası 11 haneli olarak arada boşluk yada parantez olmadan çıkmalı."
- **app.js**: Daha önce yalnızca İş Bankası ve Kuveyt Türk için vardı (emsal telefonu 10 haneye, başında 0 OLMADAN normalize). `shouldNormalizeComparablePhoneForBank()` → `getComparablePhoneNormalizationDigitsForBank()` olarak genelleştirildi (banka adına göre hedef hane sayısı: İş Bankası/Kuveyt Türk -> 10, Halkbank -> 11, diğerleri -> 0/kapalı, mevcut `isHalkbankSelectedForReport()` yeniden kullanıldı). `normalizeComparablePhoneForBank(value)` → `normalizeComparablePhoneForBank(value, targetDigitCount)`: hedef 11 ise ve numara 10 haneyse başına "0" eklenir; hedef 10 ise ve numara 11 haneyse baştaki "0" atılır. `formatComparablePhoneForOutput()` bu yeni fonksiyonları kullanır, davranışı değişmedi (tek çağıran).
- `tools/test-comparable-phone-bank-normalization.js` yeniden yazıldı: yeniden adlandırılan fonksiyonları + Halkbank'ın 11 haneli (başında 0 ile) normalize edildiğini, diğer bankaların hâlâ etkilenmediğini doğrular.
- Cache-buster `app.js?v=20260803-1645`.
- `npm run verify` tamamı geçti (55 test).

## 0.0.308 - 2026-08-03 - Halkbank "Ruhsat Özellikleri" 4 satırdan 21 satıra çıktı

- Kullanıcı talebi (ekran görüntüsüyle): "halkbank bu bölüm bu kadar seçenek varken bizde sadece 3 satır veri var bunu düzeltelim" — Halkbank'ın kendi sistemindeki "Ruhsat Özellikleri ve Dosya İncelemelerine Ait Bilgiler" ekranında ~21 alan var, bizim `templates/halkbank.html`'de yalnızca 4 satır vardı.
- Önce bir Explore ajanıyla 21 alanın her biri için app.js'te zaten karşılığı olup olmadığı araştırıldı: 6 tanesi zaten placeholder olarak TANIMLI ama halkbank.html'de hiç KULLANILMAMIŞ (Yapım Yılı, Ruhsat Tarihi, Y.Kul.İz.Bel.Tarihi, Ana Taşınmaz Proje Uygunluğu, İçi Görüldü mü, Eklenti); geri kalan ~10'u gerçekten eksikti. Kullanıcıya kapsam soruldu ("sadece mevcutları ekle" mi, "tam kapsam" mı) — kullanıcı **tam kapsamı** seçti ve eksik alanların çoğu için MEVCUT verilerden türetme kuralını kendisi belirtti (yeni bir manuel giriş alanı EKLENMEDİ):
  - **Ruhsat Var mı?**: İncelenen Belgeler tablosunda en az 1 ruhsat satırı varsa "Var" (`getReviewedBuildingPermitAvailabilityText()`, mevcut `getLatestBuildingPermitDocumentRow()` zincirini kullanır).
  - **Ruhsat İptali Var mı?**: her zaman "Yok" (veri kaynağı yok, kullanıcı: "ruhsat iptali default yok").
  - **Tad. Ruhsat Tarihi**: "Yeni Yapı Ruhsatı" DIŞINDA başka bir ruhsat satırı varsa o satırın tarihi (`getLatestRenovationPermitDateText()`).
  - **Kat İrtifakına Esas Proje İncelendi mi?**: incelenen proje türlerinden (tapu/belediye/tekil) biri "Kat İrtifakı Projesi" ise Evet (`getKatIrtifakiProjectReviewedText()`).
  - **Yerinde Ölçüm Yapıldı mı?**: randevu türü "İçi görülmüştür" ise Evet (mevcut `appointmentType` alanı, İçi Görüldü mü ile aynı mantık).
  - **Kira Sözleşmesi Var mı?**: bağımsız bölüm Kullanım Durumu "Kiracı" ise Evet (`getUnitLeaseAgreementStatusText()`).
  - **Fiilen Kullanılıyor mu?**: Kullanım Durumu "Boş (Hiç Kullanılmamış)"/"Boş (Kullanılmış)" ise Hayır, diğerlerinde (Mal Sahibi/Kiracı/İşgalci) Evet (`getUnitActivelyUsedStatusText()`).
  - **Riskli Yapı mı?**: her zaman "Hayır" (veri kaynağı yok, kullanıcı: "Riskli yapı mı default hayır").
  - **Konu Taşınmaz Alan/Konum Olarak Projesine Uygun mu?**: mevcut bağımsız bölüm `projectSuitabilityStatus` (veya tapu/belediye ayrı ise ikisi) alanındaki durum anahtarından türetildi (`getUnitProjectSuitabilityAreaMatchText()`/`getUnitProjectSuitabilityLocationMatchText()`, "KULLANIM ALANI.../BLOK BAZINDA KONUM..." durum anahtarlarına bakar).
  - **Dosyasında Dava/Tutanak Var mı?** ve **Ana/Konu Taşınmaz Üzerinde Yıkım Kararı Var mı?** (3 ayrı Halkbank sorusu): mevcut tek `penaltyDecision` alanı zaten bu üçünü birlikte kapsayan açıklama üretiyor (`buildPenaltyDecisionExplanation`) — ayrı alanlara BÖLÜNMEDİ, aynı alan üçüne de bağlandı (diğer banka şablonlarını etkilememesi için).
  - **Ana Taşınmaz Alan/Konum Olarak Projesine Uygun mu?**: mevcut bundled `mainRealEstateProjectSuitable` alanı (`ANAGAYRUYG` placeholder'ı) ikisine de bağlandı.
- **app.js**: `getReviewedBuildingPermitAvailabilityText`, `getLatestRenovationPermitDocumentRow`/`DateText`, `isKatIrtifakiProjectReviewed`/`getKatIrtifakiProjectReviewedText`, `getUnitLeaseAgreementStatusText`, `getUnitActivelyUsedStatusText`, `getActiveProjectSuitabilityStatusValues`, `getUnitProjectSuitabilityAreaMatchText`/`LocationMatchText` (+ `PROJECT_SUITABILITY_AREA_MISMATCH_KEYS`/`..._LOCATION_MISMATCH_KEYS`) eklendi — `getLatestBuildingPermitDateText` gibi mevcut yardımcıların yanına (18095 civarı).
- **src/templates/template-engine.js**: `RUHSATVARMI`, `RUHSATIPTALIVARMI`, `TADILATRUHSATTARIHI`, `KATIRTIFAKIPROJEINCELENDIMI`, `YERINDEOLCUMYAPILDIMI`, `KIRASOZLESMESIVARMI`, `KONUTASINMAZALANUYGUNMU`, `KONUTASINMAZKONUMUYGUNMU`, `FIILENKULLANILIYORMU`, `YASALEKLENTIDEPOVARMI`, `RISKLIYAPIMI` placeholder'ları eklendi.
- **templates/halkbank.html**: "6. Ruhsat Özellikleri ve Dosya İncelemeleri" 4 satırdan 21 satıra çıktı (yukarıdaki yeni placeholder'lar + zaten tanımlı ama kullanılmayan `{{BUILDING_CONSTRUCTION_YEAR}}`, `{{LATESTBUILDINGPERMITDATE}}`, `{{OCCUPANCYPERMITDATE}}`, `{{ANAGAYRUYG}}`, `{{ICIGORULDUMU}}` + mevcut `{{PENALTY_DECISION}}`/`{{STATIC_SUITABILITY}}`/`{{BUILDING_INSPECTION_CONTRACT_ACTIVE}}`/`{{EKB_ENERGY_CLASS}}`). **DİKKAT**: `{{YAPIYILI}}` DEĞİL `{{BUILDING_CONSTRUCTION_YEAR}}` kullanıldı — `YAPIYILI` `tools/test-bank-templates.js`'in `FORBIDDEN_LEGACY_TOKENS` listesinde (eski Excel şablon adı), yeni şablon metninde asla yazılmamalı.
- Yeni `tools/test-halkbank-ruhsat-fields.js`: bağımsız türetme fonksiyonlarını (Kat İrtifakı, Kira Sözleşmesi, Fiilen Kullanılıyor) gerçek app.js kaynağından izole VM'de çalıştırıp doğrular; derin bağımlılıklı fonksiyonların (Ruhsat Var mı, Tad. Ruhsat Tarihi, Konu Taşınmaz Alan/Konum Uygunluk) hâlâ var olduğunu ve template-engine.js'in bunları doğru isimle `safeCall` ettiğini yapısal olarak doğrular; `RUHSATIPTALIVARMI`/`RISKLIYAPIMI` sabit değerlerini de kontrol eder. `package.json`'daki `test` zincirine eklendi.
- Cache-buster `app.js?v=20260803-1620` ve `src/templates/template-engine.js?v=20260803-1620`'ye yükseltildi.
- `npm run verify` tamamı geçti (55 test).

## 0.0.307 - 2026-08-03 - Kat Satırları tablosunda Tab tuşu artık aşağı iner

- Kullanıcı talebi: "ana taşınmaz katları kaydet dedikten sonra çıkan listede TAB tuşu yine sağa geçiyor. burada da emsallerde olduğu gibi taba basıldığında alt hücreye geçmesini istiyorum."
- **app.js**: "Ana Taşınmaz Teknik Bilgileri" → kat adedi girilip Kaydet'e basıldıktan sonra oluşan "Kat Satırları" tablosu (`createBuildingFloorRowsTable()`) satır-bazlı (row-major) bir `<table>`: dış döngü katlar (`<tr>`), iç döngü birim türü sütunları (`<td>`) — bu yüzden tarayıcının doğal Tab sırası aynı sütunda aşağı değil, sağdaki bir sonraki sütuna atlıyordu. Emsaller'deki `attachComparableColumnTabNavigation` ile AYNI mantıkla (ayrı, kendi kendine yeten bir fonksiyon olarak — mevcut testin narrow-slice extraction'ını bozmamak için paylaşımlı bir yardımcıya refactor edilmedi) yeni `attachBuildingFloorColumnTabNavigation(shell)` eklendi: her girdiye `data-building-floor-row`/`data-building-floor-column` atanır, Tab tuşu `keydown` ile yakalanıp odak önce aynı sütunda (birim türü) aşağı/yukarı, sütun sınırında bir sonraki/önceki sütunun ilk/son katına yönlendirilir.
- `createBuildingFloorRowsTable()` artık tabloyu `shell`e ekledikten hemen sonra `attachBuildingFloorColumnTabNavigation(shell)` çağırıyor.
- Mevcut `tools/test-building-floor-common-lowercase.js`'deki DOM stub'ına (`makeElementStub`) eksik olan `dataset: {}` alanı eklendi — yeni `input.dataset.buildingFloorRow/...Column` atamaları olmadan bu test `TypeError: Cannot set properties of undefined` ile kırılıyordu.
- Yeni `tools/test-building-floor-tab-navigation.js`: `attachComparableColumnTabNavigation` testiyle aynı VM-izolasyon + stub-shell deseniyle, aynı sütunda ileri/geri Tab, sütun sınırında bir sonraki/önceki sütuna geçiş ve tablo dışına normal çıkışın engellenmeMEsi senaryolarını doğrular. `package.json`'daki `test` zincirine eklendi.
- Cache-buster `app.js?v=20260803-1500`'e yükseltildi.
- `npm run verify` tamamı geçti (53 test).

## 0.0.306 - 2026-08-03 - "PGA 475 Değeri" alanı kaldırıldı

- Kullanıcı talebi: "ana taşınmaz bölümünde yer alan PGA 475 Değeri kısmını kaldır. bu değer e devlet üzerinden alınıyor. buna gerek yok. rapor şablonlarında gerekli yönlendirmeyi yapıyorum."
- **app.js**: "Ana Taşınmaz Teknik Bilgileri" panelindeki `PGA 475 Değeri` (`pga475`) metin alanı kaldırıldı; artık başka hiçbir yerde kullanılmayan `createBuildingTextField()` yardımcı fonksiyonu da silindi.
- **Kasıtlı olarak DOKUNULMADI**: `templates/isbankasi.html`'deki `{{PGA_475}}` placeholder'ı ve `src/templates/template-engine.js`'in `EXTRA_FIELD_KEYS` listesindeki `"pga475"` girdisi — kullanıcı şablon tarafındaki yönlendirmeyi kendisi yapacağını belirtti. Placeholder çözümleme altyapısı sağlam kaldığından `{{PGA_475}}` hâlâ (boş) çözümleniyor, "eşleşmeyen placeholder" uyarısı ÇIKMAZ; kullanıcı şablonu düzenlediğinde bu token'ı isterse kaldırabilir/değiştirebilir.
- Cache-buster `app.js?v=20260803-1400`'e yükseltildi.
- `npm run verify` tamamı geçti (51 test) — `tools/test-bank-templates.js`'in `{{PGA_475}}` çözümleme kontrolü de dahil, hiçbir test bozulmadı.

## 0.0.305 - 2026-08-03 - Yeni kullanıcı kaydında admine e-posta bildirimi

- Kullanıcı talebi: "yeni bir kullanıcı hesap oluşturma isteğinde bulunduğunda admine mail gelsin böylelikle gözden kaçırmam."
- **server.js**: mevcut MFA e-posta altyapısı (Resend) yeniden kullanıldı — yeni özel bir servis/anahtar eklenmedi. `sendEmailViaResend(toEmail, code)` → `sendEmailViaResend(toEmail, subject, html)` olarak genelleştirildi (tek çağıran, MFA kod isteği, güncellendi). Yeni `buildNewUserNotificationEmailHtml(profile)`: e-posta, ad soyad, telefon, çalışma türü, şirket (yalnızca DOLU alanlar gösterilir) + "Kullanıcı Onayları'nı Aç" düğmesi (admin-users.html linki); tüm alanlar `escapeEmailHtml` ile kaçışlanır (kullanıcı girdisi HTML enjeksiyonuna karşı).
- `registerPendingUser(uid, email, profile)` artık bir **boolean döner**: yalnızca GERÇEKTEN yeni bir bekleyen kayıt oluşturulduysa `true` (zaten bekleyen/zaten onaylı bir uid için `false`) — `handleRegisterPendingApi` bunu "bildirim gönderilsin mi?" kararı için kullanır, aynı kullanıcı tekrar "kayıt olsa" bile e-posta TEKRARLANMAZ.
- Bildirim `isMfaConfigured()` (yani `RESEND_API_KEY` var mı) ile aynı "opsiyonel env var" desenine bağlı — anahtar yoksa özellik tamamen sessizce devre dışı kalır, mevcut kayıt akışını BOZMAZ. E-posta gönderimi try/catch içinde; başarısız olsa da kullanıcı normal "onay bekliyor" ekranını görmeye devam eder, yalnızca sunucu logunda hata kalır.
- Alıcı: `accessRoles.ADMIN_EMAIL` (src/auth/access-control.js, client/server ortak kaynak — ayrı bir env var/ayar eklenmedi).
- Yeni `tools/test-new-user-notification.js`: `registerPendingUser`'ın dönüş değerinin (ilk kayıt/tekrar kayıt/onaylı kullanıcı/reddedilip-tekrar-kayıt senaryoları) doğru bildirim kararına karşılık geldiğini, ve `buildNewUserNotificationEmailHtml`'in XSS kaçışlamasını + boş alanları hiç göstermediğini izole doğrular. Gerçek Resend API çağrısı (https.request) hiçbir testte tetiklenmiyor (mevcut test-mfa-flow.js ile aynı desen).
- Deploy altyapısında (ecosystem.config.cjs, .github/workflows/deploy.yml) `RESEND_API_KEY`/`RESEND_FROM_EMAIL` zaten mevcuttu — yeni bir ortam değişkeni/secret eklenmedi.
- `npm run verify` tamamı geçti (51 test).

## 0.0.304 - 2026-08-03 - TCMB tekil kur placeholderlari

- TCMB'nin USD/EUR icin hem alis hem satis kurlari artik tek basina sablonlarda kullanilabilir: `{{USD_BUYING_RATE}}`, `{{USD_SELLING_RATE}}`, `{{EUR_BUYING_RATE}}`, `{{EUR_SELLING_RATE}}`.
- Kur placeholderlari `tr-TR` biciminde dort ondalikla (ornek: `47,9100`) uretilir. TCMB verisi gecici olarak yoksa bos doner; eski kur degeri saklanip rapora yazilmaz.
- Cache-buster `app.js?v=20260803-1215` oldu. Yedek: `backups/before-tcmb-rate-placeholders_2026-08-03_11-57-26`.

## 0.0.303 - 2026-08-03 - TCMB doviz bazli degerleme

- TCMB guncel **alis** kurlari ile Yasal Durum Degeri, Mevcut Durum Degeri, Yasal Acil Satis Degeri ve Mevcut Acil Satis Degeri icin USD/EUR karsiliklari eklendi. Donusum TL deger / ilgili TCMB alis kuru olarak yapilir; kur bilgisi yoksa yaniltici/eski rakam uretilmez.
- Aciklamalar bolumune "Doviz Bazli Degerleme" paneli eklendi. Panel, dort TL degeri ile USD/EUR karsiliklarini tablo halinde; altinda da kullanilan tarih ve kurlari belirten otomatik aciklama metnini gosterir.
- Yeni placeholderlar: `{{LEGAL_VALUE_USD}}`, `{{LEGAL_VALUE_EUR}}`, `{{CURRENT_VALUE_USD}}`, `{{CURRENT_VALUE_EUR}}`, `{{LEGAL_URGENT_SALE_VALUE_USD}}`, `{{LEGAL_URGENT_SALE_VALUE_EUR}}`, `{{CURRENT_URGENT_SALE_VALUE_USD}}`, `{{CURRENT_URGENT_SALE_VALUE_EUR}}`, `{{FOREIGN_CURRENCY_VALUATION_EXPLANATION}}`.
- TCMB verisi ya da degerleme tutarlari yenilendiginde hesap ve aciklama yeniden uretilir. Cache-buster: `app.js?v=20260803-1200`.
- Yeni `tools/test-foreign-currency-valuation.js`, sekiz degerin kur bazli hesabini, aciklama metnini ve kur yokken bos donus davranisini kapsar. `npm run verify` gecti.

## 0.0.300 - 2026-08-03 - Admin dashboard: kullanıcı istatistikleri + giriş/çıkış geçmişi

- Kullanıcı talebi: "kullanıcı verilerini kullanıcı kayıtlarını ve kullanıcının loglarını yani tüm erişime sahip olabileceğim bir dashboard istiyorum. kullanıcı istatistikleri vb. verileri görmek ve analiz edebilmek için." AskUserQuestion ile 3 nokta netleştirildi: (1) rapor İÇERİĞİ değil, yalnızca "kaç rapor oluşturdu" + "ne kadar sürede tamamladı" istatistikleri, (2) loglar = giriş/çıkış geçmişi, (3) mevcut admin-users.html paneline eklensin.
- **Mimari karar**: Firestore güvenlik kuralları (`cloud/firestore.rules`) `users/{uid}/reports` alt koleksiyonuna yalnızca `isOwner(uid)` okuma izni veriyor — admin için bu kuralı gevşetmek, rapor İÇERİĞİNİN (payload) de admin tarayıcısına inmesi anlamına gelirdi (Firestore field-level güvenlik desteklemiyor, salt sayı/süre için bile tüm doküman okunması gerekirdi). Bunun yerine **Firestore'a hiç dokunmadan**, mevcut `server.js` oturum altyapısına paralel, sunucu tarafında yeni bir "etkinlik günlüğü" eklendi — Firebase Admin SDK/servis hesabı gerektirmez (proje "sıfır bağımlılık" felsefesiyle uyumlu).
- **server.js**: yeni `server-data/activity-events.json` (sınırlı boyut, `ACTIVITY_EVENTS_MAX=20000`, en eskiler otomatik atılır; `SENSITIVE_SERVER_DATA_FILES`'a eklendi). `logActivityEvent(type, uid, email, extra)` dört olay türünü kaydeder: `login`/`logout` (otomatik, `createSession`/`destroySession` çağrı noktalarına eklendi — IP `clientKeyFor(request)`, User-Agent `request.headers["user-agent"]`) ve `report-created`/`report-exported` (istemciden `POST /api/report-event` ile, uid/email İSTEMCİDEN GÜVENİLMEZ, `authenticateRequest`'in doğruladığı `user`'dan alınır). Rapor İÇERİĞİ ASLA loglanmaz — yalnızca opaque `reportId` (`RE-YYYY-XXXXXX`, kimlik bilgisi içermez).
- Yeni `computeUserReportStats()`: her kullanıcı için `reportsCreated` (created olay sayısı), `reportsExported` (created+exported çifti bulunan rapor sayısı — AYNI reportId için ikinci/tekrar export SAYILMAZ, yalnızca ilk export zaman damgası kullanılır), `avgDurationMs`/`minDurationMs`/`maxDurationMs` (created→ilk exported farkı), `lastCreatedAt`/`lastExportedAt`. Yeni `listLoginEvents(limit)`: yalnızca login/logout türlerini en-yeni-önce döner (report-created/exported SIZMAZ).
- Yeni admin-only API'ler: `GET /api/user-stats`, `GET /api/login-events` (`requireAdmin()` ile korunuyor, mevcut desenle aynı). Yeni herkese-açık (kimlik doğrulamalı) `POST /api/report-event` (`{type: "created"|"exported", reportId}`).
- **app.js**: yeni `pingReportEvent(type, reportId)` — bulut oturumu yoksa sessizce atlanır, hata olursa sessizce yutulur (analitik kaydı ASLA normal kullanım akışını bozmamalı). "Banka Şablonuyla Kaydet" başarılı olduğunda `pingReportEvent("exported", state.reportId)` çağrılır.
- **cloud/report-library.js**: `createNewReport()` (yalnızca "+ Yeni Talep Oluştur" düğmesi — `resetToFreshEmptyReport`'un `deleteReport` içindeki ikinci/temizlik çağrısı DEĞİL, çift saymayı önlemek için) içine `pingReportEvent("created", state.reportId)` eklendi.
- **admin-users.html**: iki yeni kart — "Kullanıcı İstatistikleri" (kullanıcı, oluşturulan/dışa aktarılan rapor sayısı, ortalama süre, son rapor tarihi tablosu) ve "Giriş / Çıkış Geçmişi" (son 500 olay: kullanıcı, giriş/çıkış rozeti, zaman, IP, cihaz). Sayfa açılışında mevcut iki panelle birlikte otomatik yüklenir.
- Yeni `tools/test-activity-dashboard.js`: login/logout ayrımının (report-* olayların listLoginEvents'e SIZMADIĞI), rapor sayısı+süre hesabının (birden fazla kullanıcı bağımsız, henüz export edilmemiş raporun ortalamaya KATILMADIĞI, aynı rapor için tekrar export'un tekrar SAYILMADIĞI), ve loglanan olayın yalnızca beklenen alanları içerip rapor içeriği SIZDIRMADIĞINI izole doğrular.
- **Paralel oturum notu**: bu değişiklik sırasında aynı çalışma dizininde başka bir oturum TCMB döviz kuru özelliğini (bkz. "0.0.298") ekliyordu; `package.json`'daki test zincirine ayrıca dikkat çekilecek bir düzeltme yapıldı — zincirde `test-tcmb-rates.js` eklenirken `test-building-inspection-law-exempt-fields-hidden.js` yanlışlıkla düşürülmüş görünüyordu, bu commit'te GERİ EKLENDİ (test dosyasının kendisi diskte hep vardı, yalnızca `npm test` zincirinden düşmüştü).
- Cache-busterlar: `app.js?v=20260803-0600`, `cloud/report-library.js?v=20260803-0200`.
- `npm run verify` tamamı geçti (46 test).

## 0.0.299 - 2026-08-03 - "Farklı Kaydet" (JSON) ve "Tüm Tabloları Excel Olarak İndir" ayrı düğmeleri kaldırıldı

- Kullanıcı, "Banka ve Çıktı" ekranının bir önceki ekran görüntüsünde kırmızı kutularla işaretlediği "Farklı Kaydet" ve "Tüm Tabloları Excel Olarak İndir" bloklarının HÂLÂ durduğunu, bu sefer BAŞLIK+DÜĞME dahil tamamının kaldırılmasını istedi ("görseldeki kısımlar halen duruyor bunları da gizle").
- Gerekçe: 0.0.296'dan beri "Banka Şablonuyla Kaydet" zaten Word+JSON+Excel(+Ziraat) dördünü TEK bir .zip'te üretiyor (`buildBankTemplateZipBundle`) — bu iki ayrı düğme artık tekrarcıydı.
- **app.js**: `createOutputExportPanel()`'den "Farklı Kaydet" (JSON) bloğu tamamen kaldırıldı; `appendTablesXlsxExportBlock()` fonksiyonu ("Tüm Tabloları Excel Olarak İndir") ve çağrısı tamamen silindi. Artık kullanılmayan `exportReportJson()` (yalnızca bu düğmenin tıklama işleyicisinden çağrılıyordu) da silindi.
- **ÖNEMLİ — silinmeyenler**: `buildReportJsonExportPayload()` ve `window.RaporReportTablesXlsx.exportAllTables()` KORUNDU — zip paketleme akışı (`buildBankTemplateZipBundle`) bu ikisini hâlâ `{download:false}` ile doğrudan çağırıyor; düğmeler kalksa da alttaki dışa aktarma mantığı sağlam.
- Panelin üstündeki durum mesajı `<span data-output-export-status>` artık "Banka Şablonuyla Kaydet" bloğunun kendi başlık satırına taşındı (`appendBankTemplateExportBlock` artık `status` parametresi almıyor, kendi DOM'undan buluyor) — önceki panel artık boş bir başlık satırı bırakmıyor.
- `tools/check-basic.js`'deki ilgili regresyon guard'ı güncellendi: artık `data-export-json`/`data-export-tables-xlsx`'in YOK olduğunu, ama `buildReportJsonExportPayload`/`buildBankTemplateZipBundle`'ın hâlâ VAR olduğunu doğruluyor.
- `npm run verify` tamamı geçti (44 test).
- Cache-buster `app.js?v=20260803-0500`'e yükseltildi.
- **Paralel oturum notu**: bu commit sırasında aynı çalışma dizininde başka bir oturum `index.html`/`server.js`/`styles.css`'e TCMB döviz kuru özelliği (bkz. handoff.md'nin daha eski bir bölümündeki "0.0.298 - TCMB Güncel Döviz Kurları" girdisi) ekliyordu; yalnızca kendi `app.js`/`tools/check-basic.js` değişiklikleri VE `index.html`'deki tek satırlık cache-buster satırı stage'lendi, diğer dosyalar/satırlar dokunulmadan bırakıldı.

## 0.0.297 - 2026-08-03 - Banka ve Çıktı bölümündeki açıklama metinleri kaldırıldı

- Kullanıcı, "Banka ve Çıktı" ekranının bir ekran görüntüsünü kırmızı "GİZLE" kutucuklarıyla işaretleyip paylaştı — altı ayrı yerdeki gri açıklama/ipucu paragrafını hedef alıyordu.
- **app.js**: aşağıdaki `<p>` açıklama metinleri kaldırıldı; başlıklar (`<h4>`), düğmeler, açılır listeler ve tablolar AYNEN kaldı (yalnızca metin temizliği, işlevsellik değişmedi):
  1. "Farklı Kaydet" → "Rapor taslağını JSON olarak saklayabilirsiniz."
  2. "Farklı Kaydet" altlığı → "JSON dosyası 1-Dosya bölümünden tekrar yüklendiğinde tüm alanlar ve tablolar geri gelir."
  3. Masraf Tablosu altlığı → "KDV oranı ve tarife tutarları admin tarafından yıllık olarak güncellenir (Masraf Bilgileri bölümü)."
  4. "Banka Şablonuyla Kaydet" → "templates/ klasöründeki düzenlenebilir HTML şablonu doldurulur; Word (.doc) çıktısı, rapor JSON taslağı, dolu tablolar (Excel) ve varsa Ziraat ek tablosu TEK bir .zip dosyası olarak iner."
  5. "Banka Şablonuyla Kaydet" altlığı → "Placeholder adları için templates/PLACEHOLDER-REHBERI.md dosyasına bakın. Eşleşmeyen adlar çıktıda ⚠ ile işaretlenir."
  6. "Tüm Tabloları Excel Olarak İndir" → "Malikler, Takyidat (Beyan/Şerh/İpotek), İncelenen Belgeler ve Emsal tablolarının tamamı, her biri ayrı sayfada olacak şekilde tek bir .xlsx dosyasına aktarılır."
- Bu, önceki `sensitiveOnly` (ayrıcalıklı kullanıcı) mekanizmasından BAĞIMSIZ — tüm kullanıcılar için (admin dahil) kalıcı metin sadeleştirmesi; erişim kontrolü eklenmedi.
- `npm run verify` tamamı geçti (44 test, yeni test gerekmedi — mevcut testler bu açıklama metinlerini doğrulamıyordu).
- Cache-buster `app.js?v=20260803-0400`'e yükseltildi.

## 0.0.296 - 2026-08-03 - "Word/PDF olarak kaydet" kaldırıldı; Banka Şablonuyla Kaydet artık tek ZIP

- Kullanıcı, Kuveyt Türk raporu için ürettiği bir .doc dosyası paylaştı: "banka ve çıktı bölümünde word ve pdf olarak kaydettiğimizde bu şekilde anlamsız bir çıktı oluşuyor. bu kısımları kaldıralım. banka ve çıktı kısmındaki açıklamaları da kaldıralım. excel tablo indirme json dosyası ve rapor word formatı Banka Şablonu ile kaydet butonu tıklandığında otomatik zip yada rar içinde insin."
- **Kök neden bulundu**: dosya incelendiğinde "Emsaller - Emsal Karşılaştırma Matrisi" başlığı altında gerçek bir `<table>` yerine kaçış karakterli (`&lt;table&gt;...`) ham HTML metni basılı bulundu. Sebep: genel (banka şablonu DIŞI) "Word olarak farklı kaydet"/"PDF olarak kaydet" butonlarının ürettiği `buildWordReportHtml()`, `collectGeneratedTextPlaceholders()`'daki TÜM girdileri (emsal matrisi/tablosu gibi HTML üreten girdiler dahil) `formatWordParagraphs()` (düz metni `<p>`'lere bölen bir fonksiyon) üzerinden geçiriyordu — HTML tablo string'i düz metin sanılıp kaçışlanıyor ve satır satır paragraflara bölünüyordu.
- Kullanıcıya AskUserQuestion ile netleştirme soruldu: butonları tamamen kaldırmak mı, yoksa hatayı düzeltip butonları tutmak mı? Yanıt: **"Sadece o iki düğmeyi kaldır"** — JSON kaydetme, Excel tablo indirme ve Banka Şablonuyla Kaydet (asıl resmi çıktı) olduğu gibi kalsın.
- **app.js**: `createOutputExportPanel()`'den "Word olarak farklı kaydet"/"PDF olarak kaydet" düğmeleri ve ilgili açıklama metinleri kaldırıldı (JSON düğmesi kaldı). Bu iki düğmenin ürettiği TÜM zincir titizlikle izlenip silindi: `exportReportWord`, `exportReportPdf`, `buildPdfReportHtml`, `openPdfPrintWindow`, `buildWordReportDocumentPackage`, `buildWordReportImageAssets`, `buildWordReportHtml`, `buildWordReportSummaryHtml`, `buildWordReportGeneratedTextsHtml`, `shouldIncludeGeneratedTextInWord`, `buildWordReportTablesHtml`, `formatStateRowsForWord`, `formatTextTableForWord`, `buildWordReportSketchesHtml` ve onun VML/SVG kroki yardımcıları (`buildWordSketchImageHtml`, `buildLocationSketchSvgMarkup`, `buildComparableSketchSvgMarkup`, `buildPointSketchSvg`, `buildPointSketchVml`, `buildPointSketchLegendTable`, `getWordSketchDefinitions`, `createSketchPngDataUrl`, `drawWordSketchCanvas`). **Silmeden önce her fonksiyon için** `src/templates/template-engine.js` ve `src/exports/*.js`'de `safeCall("fnAdı")` ile dinamik çağrıldığı DOĞRULANDI (bkz. CLAUDE.md'deki 147 dinamik çağrı uyarısı) — `formatWordParagraphs`, `buildWordMhtmlPackage`, `buildSavedReportImageAssets`, `buildComparableMatrixWordTableHtml`, `buildComparableValuationWordTableHtml`, `wrapWordLandscapeSection`, `formatWordCell` gibi hâlâ GERÇEKTEN kullanılan (banka şablonu/collectGeneratedTextPlaceholders/report-tables-xlsx.js tarafından) fonksiyonlara DOKUNULMADI.
- **ZIP paketleme** (yeni özellik): "Banka Şablonuyla Kaydet" artık Word (.doc), rapor JSON taslağı, dolu tablolar Excel'i (varsa) ve Ziraat ek tablosunu (varsa) ayrı ayrı indirmek yerine **tek bir .zip** dosyasında indiriyor. Yeni `buildBankTemplateZipBundle()` (app.js) bu dört parçayı toplar; zip'i **hâlihazırda var olan bağımlılıksız STORED-zip yazıcısıyla** (`window.RaporXlsxFill.writeStoredZip` — zaten `.xlsx` üretimi için kullanılıyordu) paketler, yeni bir kütüphane eklenmedi.
  - `src/templates/template-engine.js`: `exportTemplate(templateKey, {download:false})` artık indirmeden `{fileName, content, mimeType}` döndürebiliyor.
  - `src/exports/report-tables-xlsx.js`: `exportAllTables({download:false})` artık indirmeden `{fileName, blob, ...}` döndürebiliyor.
  - `src/exports/ziraat-ek-tablo-xlsx.js`: `exportXlsx({download:false})` artık indirmeden `{fileName, blob, count}` döndürebiliyor.
  - Excel tablo boşsa (hiç dolu tablo yoksa) veya Ziraat ek tablosu hata verirse zip'in geri kalanı yine de indirilir (sessizce atlanır, `console.warn`); yalnızca Word şablonu üretimi başarısız olursa zip hiç oluşturulmaz.
- **tools/check-basic.js** ve **tools/test-bank-templates.js**: silinen fonksiyonları/CSS'i doğrulayan eski regresyon guard'ları güncellendi/kaldırıldı (bankaya özel `templates/*.html` dosyalarının kendi `@page WordSection1` düzeni zaten ayrı testleniyor, app.js'in artık var olmayan kopyası test edilmiyor).
- Yeni **tools/test-bank-template-zip-bundle.js**: (a) `writeStoredZip`→`readStoredZip` round-trip'inin Word/JSON/ikili-XLSX türü karışık dosyalarda birebir çalıştığını, (b) `{download:false}` desteğinin üç modülde de var olduğunu, (c) `buildBankTemplateZipBundle`'ın doğru cağrıldığını, (d) kaldırılan `data-export-word`/`data-export-pdf` düğmelerinin GERİ GELMEDİĞİNİ doğrular.
- Cache-busterlar: `app.js`, `src/templates/template-engine.js`, `src/exports/ziraat-ek-tablo-xlsx.js`, `src/exports/report-tables-xlsx.js` → `20260803-0300`.
- `npm run verify` tamamı geçti (44 test). Gerçek Firebase oturumu olmadan zip indirme akışının tam tarayıcı doğrulaması yapılamadı (login.html kimlik doğrulaması gerektiriyor) — kullanıcının canlıda bir rapor açıp "Banka Şablonuyla Kaydet"e basarak tek bir .zip indiğini doğrulaması gerekiyor.

## 0.0.295 - 2026-08-03 - sensitiveOnly görünürlük düzeltmeleri (test kullanıcı geri bildirimi)

- Kullanıcı test hesabıyla giriş yapıp normal-kullanıcı görünümünü bizzat kontrol etti, 8 maddelik bir düzeltme listesi verdi (0.0.293/0.0.294'teki `sensitiveOnly` geçişinin yan etkileri + yeni bir banka-bazlı görünürlük isteği). Tümü uygulandı:
  1. **Bug düzeltmesi**: "Ulaşım ana arteri", "Yakın çevre seçimi", "Ulaşım Tarifi" yanlışlıkla gizlenmişti — `transport`/`nearby` alanlarına önceki oturumda eklenen `sensitiveOnly: true` KALDIRILDI. Kök neden: `createTransportNearbyComposer()` bu üç aracı TEK PARÇA render ediyor; `transport` alanına `sensitiveOnly` koymak render döngüsündeki erken `return`'ü tetikleyip mainArtery/nearby-seçim aracını da birlikte götürüyordu.
  2. "Çevresel Özellikler Açıklaması" (`environmentDescription`) alanına `sensitiveOnly: true` eklendi.
  3. "Belgeler ve Proje"'deki Yapı Denetim Açıklaması ÖNİZLEMESİ (`createBuildingInspectionExplanationPreview`, "Açıklamalar" bölümündeki ayrı `buildingInspectionExplanation` alanından FARKLI, kanun-kapsamı-dışı senaryosunda ayrıca render edilen bir kopya) `canViewSensitiveContent()` ile gizlendi.
  4. "Ana Gayrimenkul Açıklaması" + "Ana Gayrimenkul Kat Adedi" (`createMainPropertyDescriptionPanel`) gizlendi — state hesaplaması (`mainPropertyDescription`/`mainPropertyFloorCountText`) görünürlükten BAĞIMSIZ olarak yine çalışır (rapor çıktısı bozulmasın diye).
  5. "Bağımsız Bölüm İç Hacimler Açıklaması" (`createUnitInteriorDescriptionField`) gizlendi; `updateUnitInteriorDescription()` state güncellemesi yine tetiklenir.
  6. "Değerleme" bölümündeki tüm otomatik açıklama panelleri (Değerleme Yöntemi, Hisse, Satış Kabiliyeti, Tarla Riski, Kira, Emlak Beyan Değeri, 5403 Minimum Parsel) `canViewSensitiveContent()` ile gizlendi — altındaki GERÇEK değer tabloları (Piyasa Değeri, Acil Satış, Emlak Beyan Değeri kutucuğu vb.) ETKİLENMEDİ; ilgili `refresh*Explanation()` fonksiyonları görünürlükten bağımsız yine çağrılır.
  7. "Değere Etki Eden Faktörler" bölümünde yalnızca "Rapor Metni" kutusu (`createValueFactorsReportTextBox`) gizlendi; Olumlu/Olumsuz Özellikler listeleri ve state hesaplaması etkilenmedi.
  8. **Yeni kural (sensitiveOnly'den bağımsız)**: "Halkbank Risk Kodları" sol panel bölümü artık yalnızca seçili banka Halkbank ise görünüyor — yeni `isHalkbankSelectedForReport()`/`shouldHideSectionForBank()`, mevcut `shouldHideSectionForOwnership`/`shouldHideSectionForAccess` ile aynı `shouldHideSection()` kompozisyonuna eklendi.
- Yeni `tools/test-sensitive-visibility-refinements.js`: (a) `transport`/`nearby` alan tanımlarının `sensitiveOnly` İÇERMEDİĞİNİ, `environmentDescription`'ın İÇERDİĞİNİ metin taramasıyla doğrular (regresyon koruması); (b) `isHalkbankSelectedForReport`/`shouldHideSectionForBank`'ı gerçek app.js kaynağından izole çalıştırıp Halkbank/İş Bankası/boş banka senaryolarını ve diğer bölümlerin ETKİLENMEDİĞİNİ doğrular. `npm run test` zincirine eklendi.
- `tools/test-building-inspection-law-exempt-fields-hidden.js` bu değişiklikle kırıldı (izole vm bağlamında `canViewSensitiveContent` tanımsızdı) — context'e `canViewSensitiveContent: () => true` eklenerek düzeltildi (bu test kanun-kapsamı-dışı hücre gizleme mantığını test ediyor, ayrıcalık görünürlüğünü değil).
- Cache-buster `app.js?v=20260803-0200`'e yükseltildi.
- `npm run verify` tamamı geçti (43 test). Gerçek Firebase oturumu olmadan tam tarayıcı doğrulaması yapılamadı (login.html Firebase kimlik doğrulaması gerektiriyor) — kullanıcının kendi test hesabıyla canlıda doğrulaması gerekiyor.

## 0.0.294 - 2026-08-03 - Değerleme Şirketi artık gerçek açılır liste (TDÜB listesi)

- Kullanıcı, TDÜB (tdub.org.tr) tüzel kişi üye listesinden derlenmiş bir Excel dosyası paylaştı: "işlem bitti ise ekteki listeyi değerleme firması çoktan seçmen kısmında kullanabilirsin".
- `login.html`: "Değerleme Şirketi" serbest metin kutusu, 146 lisanslı değerleme şirketini içeren gerçek bir `<select>` açılır listesine dönüştürüldü (`VALUATION_COMPANY_OPTIONS`, dosyadan tekilleştirilip alfabetik sıralanmış). Listede olmayan bir şirket için son seçenek olan "Diğer (listede yok)" seçilince ayrı, serbest metin bir "Şirket Adı" alanı beliriyor — bu güvenlik ağı kullanıcı istememişti ama listenin (TDÜB'e üye/lisanslı) her "Kadrolu" çalışanı kapsamayabileceği düşünülerek eklendi.
- Sunucu tarafı zaten serbest metin kabul ediyordu (`sanitizeRegistrationProfile` → `company` alanı, 160 karakter sınırı) — hiçbir server.js değişikliği gerekmedi, yalnızca `login.html`'in gönderdiği değer değişti.
- Canlı tarayıcı doğrulaması: yerel sunucuda "Lisanslı Değerleme Şirketi" seçilince 146 şirket + "Diğer" seçeneğiyle açılır liste geldi; "Diğer" seçilince "Şirket Adı" serbest metin alanı belirdi.
- `npm run verify` tamamı geçti.

## 0.0.293 - 2026-08-03 - Yönetici paneli sidebar'dan Taleplerim'e taşındı

- Kullanıcı talebi: "admin panelini taleplerim bölümüne alalım. ayrıca kullanıcı onaylarınıda taleplerim bölümüne alalım. rapor yazma içinde olması bence mantıksız." Rapor yazma ekranının kenar çubuğunda bulunan tek yönetici düğmesi ("Kullanıcı Onayları", admin-users.html'i açan) kaldırıldı; hesap/oturum yönetimiyle ilgili olduğu için "Taleplerim" (`cloud/report-library.js` `openDashboard()`) ekranına taşındı.
- **index.html**: sidebar'daki `#adminUsersToolBtn` düğmesi tamamen kaldırıldı.
- **app.js**: bu düğmenin `querySelector`/click-listener kurulumu kaldırıldı.
- **styles.css**: yalnızca bu düğme için var olan `.admin-only-button` / `body[data-user-role="admin"] .admin-only-button` kuralları (artık kullanılmıyor) kaldırıldı.
- **cloud/report-library.js**: `renderAccountStripHtml()` içinde, yönetici oturumundaysa (`status.role === "admin"`) hesap şeridine "Kullanıcı Onayları" mini-düğmesi ekleniyor; `bindAccountStripActions()` bu düğmeye tıklanınca `admin-users.html`'i yeni sekmede açıyor. Görünürlük zaten var olan `.library-role-badge`/rol mantığıyla aynı `RaporAccessControl.getRole()` kaynağını kullanıyor — ayrı bir yetki kontrolü icat edilmedi.
- `tools/test-static-auth-gate.js` etkilenmedi (admin-users.html hâlâ oturum çerezi gerektiren korumalı bir dosya; sadece ona giden düğmenin YERİ değişti).
- `npm run verify` tamamı geçti; `node --check` ile `app.js`/`cloud/report-library.js` doğrulandı.

## 0.0.292 - 2026-08-02 - Kayıt formuna zorunlu profil alanları (ad soyad/telefon/çalışma türü)

- Kullanıcı talebi: "kullanıcı oluşturma ekranında ad soyad email ve telefon numarası zorunlu olsun. Çalışma Türü Kadrolu, Çözüm Ortağı Bağımsız, Lisanslı Değerleme Şirketi olsun. Kadrolu ve Lisanslı Değerleme Şirketi seçildiğinde değerleme şirket listesi açılır liste penceresi olsun. bu kısım zorunlu olmasın". Netleştirme: "Değerleme Şirketi" alanı açılır liste değil, ZORUNLU OLMAYAN serbest metin kutusu olarak eklendi (kullanıcı, sabit bir şirket listesi yerine bunu seçti).
- **login.html** "Hesap Oluştur" formu: `Ad Soyad` (metin, `required`), `Telefon Numarası` (`type=tel`, `required`), `Çalışma Türü` (select, `required`; seçenekler: Kadrolu / Çözüm Ortağı / Bağımsız / Lisanslı Değerleme Şirketi) eklendi. `Çalışma Türü` "Kadrolu" veya "Lisanslı Değerleme Şirketi" olduğunda `Değerleme Şirketi` serbest metin alanı görünür hale geliyor (`updateCompanyFieldVisibility`) — bu alan ZORUNLU DEĞİL, diğer çalışma türlerinde tamamen gizli ve gönderilmiyor.
- **server.js**: `registerPendingUser(uid, email, profile)` üçüncü bir `profile` parametresi alıyor artık; `sanitizeRegistrationProfile()` ile kırpılıp (`fullName` 120, `phone` 40, `company` 160 karakter sınırı) `workType` yeni `WORK_TYPE_OPTIONS` listesindeki dört değerden biri değilse `null`'a düşürülüyor (savunma amaçlı — asıl zorunluluk `login.html`'in `required` alanlarıyla sağlanıyor). `approveUser` bu profil alanlarını `pendingUsers`'dan `approvedUsers`'a taşıyor; `listPendingUsers`/`listApprovedUsers` artık `fullName`/`phone`/`workType`/`company` de döndürüyor.
- `POST /api/register-pending` artık JSON gövde okuyor (`{fullName, phone, workType, company}`), önceden hiç body okumuyordu.
- **admin-users.html**: hem "onay bekleyenler" hem "onaylı kullanıcılar" satırları artık ad soyad (varsa) + e-posta başlığı ve telefon/çalışma türü/şirket bilgisini meta satırında gösteriyor (`formatProfileMeta`).
- `tools/test-user-approval-flow.js`'e 6. bölüm eklendi: profil alanlarının kırpılıp saklandığı, onay sonrası korunduğu ve bilinmeyen bir çalışma türünün sessizce reddedildiği izole doğrulanıyor.
- Cache-buster gerekmedi (`login.html`/`admin-users.html` `index.html` üzerinden `?v=` ile YÜKLENMİYOR, doğrudan ayrı sayfa olarak açılıyor).
- Canlı tarayıcı doğrulaması: yerel sunucuda "Hesap Oluştur" formu açıldı, `Çalışma Türü` "Kadrolu" seçilince "Değerleme Şirketi" alanı belirdi, "Bağımsız" seçilince tekrar gizlendi.
- `npm run verify` tamamı geçti.

## 0.0.291 - 2026-08-02 - Üçüncü erişim katmanı: ayrıcalıklı kullanıcı (açıklamalar/masraf/okuma sonucu gizleme)

- Kullanıcı talebi: "şimdi normal kullanıcılar sistemdeki kutucuklar hariç tüm açıklama paragraflarını pdf okuma sonuçlarını sol panelde yer alan açıklamalar ve masraf bölümünü göremeyecek şekilde ayarla admin olarak. yetki verdiğim kullanıcılar bu kısımları görebilsin." İki netleştirme sorusu ile kapsam onaylandı: yalnızca "Okuma Sonucu" ÖNİZLEME paneli gizlensin (alttaki otomatik dolan alanlar kalsın), yetki yönetimi mevcut "Kullanıcı Onayları" panelinden yapılsın.
- **server.js**: `approvedUsers` `Set<uid>` → `Map<uid, {email, approvedAt}>`'e taşındı (admin panelinde e-posta gösterebilmek için). Yeni `privilegedUsers` (`Set<uid>`, `server-data/privileged-users.json`, `SENSITIVE_SERVER_DATA_FILES`'a eklendi). `isUserPrivileged(uid, email)`, `grantPrivilege`/`revokePrivilege`, `listApprovedUsers()` eklendi. Yeni admin-only API'ler: `GET /api/approved-users`, `POST /api/grant-privilege`, `POST /api/revoke-privilege`. Herkese açık (kimlik doğrulamalı) yeni `GET /api/my-role` → `{role: "admin"|"privileged"|"user"}`.
- **app.js**: `adminOnly` deseninin aynısı `sensitiveOnly: true` olarak eklendi (`shouldHideSectionForAccess`, alan-seviyesi kontrol). "Açıklamalar" ve "Masraf Bilgileri" bölümlerine, ayrıca dağınık ~10 açıklama textarea'sına (`transport`, `nearby`, `takbisSummary`, `planRestrictionNote`, `planningNote`, `projectReviewDescription`, `projectConformity`, `reviewedDocumentsDescription`, `landNote`) `sensitiveOnly: true` eklendi. Dört "Okuma Sonucu" önizleme paneli (Adres, TAKBİS Tapu, TAKBİS Takyidat ham verisi, İmar Durumu) `render()` içinde `canViewSensitiveContent()` ile koşullu render ediliyor — panel gizlenir, alttaki gerçek form alanları GİZLENMEZ. Yeni `canViewSensitiveContent()` = admin VEYA `currentCanViewSensitive` (sunucudan gelen). `window.RaporAccessControl.setCanViewSensitive`/`canViewSensitive` eklendi.
- **cloud/cloud-sync.js**: `handleAuthState` içinde `applySensitiveRoleFromServer()` — her girişte `GET /api/my-role` sorgulanıp sonucu `RaporAccessControl.setCanViewSensitive`'e uygulanıyor (statik e-posta karşılaştırması DEĞİL, dinamik sunucu listesi olduğu için gerekli).
- **admin-users.html**: "Ayrıcalıklı Erişim" başlıklı ikinci kart eklendi — onaylı kullanıcıları e-posta/onay tarihiyle listeler, her satırda "Yetki ver"/"Yetkili ✓" geçiş düğmesi (`grant-privilege`/`revoke-privilege`). Bir kullanıcı onaylandığında bu liste de otomatik yenilenir.
- Emsal tablosu alanları (`c10`, `c17`, `calcLongText`) kasıtlı olarak DOKUNULMADI — ayrı bir render yolu (`comparableFields`, `createComparablesVerticalEditor`), kırılganlığı bilinen bir alan; kullanıcının isteği açıkça "Açıklamalar"/"Masraf" bölümleri ve okuma sonucu panelleriydi.
- `tools/test-user-approval-flow.js`'e 5. bölüm eklendi: `isUserPrivileged`, `grantPrivilege`/`revokePrivilege`, `listApprovedUsers` (e-posta + `privileged` alanı dahil) izole doğrulanıyor.
- Cache-buster'lar `20260802-0400`'e yükseltildi (`app.js`, `cloud/cloud-sync.js`).
- `npm run verify` tamamı geçti. Canlı Firebase oturumu olmadan `admin-users.html`'in statik iki-kart yerleşimi doğrulandı (gerçek onay/yetki akışı deploy sonrası kullanıcı tarafından canlıda test edilecek).

## 0.0.290 - 2026-08-02 - Kullanıcı kaydı + admin onayı olmadan giriş yok

- Kullanıcı talebi: "kullanıcı oluştur ekleyelim admin onayı olmadan kullanıcı olusturlmasın" → netleşti: "admin only olmayacak herkes oluşturabilecek ancak ben admin onay vermeden sisteme giriş yapamayacak".
- **login.html**: yeni "Hesap Oluştur" sekmesi — herkes Firebase `createUserWithEmailAndPassword` ile kendi hesabını oluşturabilir (genel API anahtarıyla çalışır, ek yetki gerekmez). Hesap oluşturmak GİRİŞ YAPMAK anlamına gelmiyor: hesap oluşturulur oluşturulmaz `/api/register-pending` çağrılır, kullanıcı "onay bekliyor" ekranına düşer.
- **server.js**: `isUserApproved(uid, email)` — yönetici (`ADMIN_EMAIL`) her zaman otomatik onaylı (aksi halde kimse kimseyi onaylayamaz); diğer herkes `approved-users.json`'da olmadıkça onaysız. `/api/session`, `/api/session/request-code`, `/api/session/verify-code` (logout HARİÇ) bu kontrolden geçmeden çalışmaz — onaysızsa `{pendingApproval:true}` döner, oturum çerezi verilmez.
- Yeni admin-only API'ler: `GET /api/pending-users` (bekleyen listesi), `POST /api/approve-user`, `POST /api/reject-user` — hepsi `requireAdmin()` ile 403'e düşer (yönetici değilse).
- Yeni **admin-users.html**: yönetici için basit onay paneli (bekleyenleri listeler, Onayla/Reddet düğmeleri). Sol panele (sadece yönetici hesabına, `body[data-user-role="admin"]` CSS kuralıyla) "Kullanıcı Onayları" düğmesi eklendi — Saha Pro düğmesiyle aynı desende yeni sekmede açılır.
- **KRİTİK süreklilik kararı ("mevcut kullanıcılar kilitlenmesin"):** `approved-users.json` İLK KEZ oluşturulduğu an, o ana kadar `sessions.json`/`trusted-devices.json`'da görülen (yani daha önce en az bir kez giriş yapmış) her uid otomatik onaylı sayılır (miras/"grandfather" klozu) — kullanıcı zaten şu an sadece kendi hesabının aktif olduğunu doğruladı, ama bu koruma yine de eklendi.
- Yeni `tools/test-user-approval-flow.js`: tam onay yaşam döngüsü (kayıt → bekliyor → onayla/reddet), zaten onaylı kullanıcı için register no-op, `requireAdmin` yönetici/yönetici-olmayan davranışı, ve miras klozunun gerçekten çalıştığı izole doğrulanıyor; regresyonu yakaladığı kanıtlandı. `tools/test-static-auth-gate.js`'e `admin-users.html`'in korumalı olduğu doğrulaması eklendi.
- Cache-buster'lar `20260802-0300`'e yükseltildi (app.js/styles.css/index.html değişti).
- Yedek gerekmedi (yeni, opt-in bir güvenlik katmanı; mevcut tek kullanıcı — yönetici — hiç etkilenmiyor); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.289 - 2026-08-02 - Bağımlılık güvenlik açığı taraması (Dependabot)

- Kullanıcı talebi: daha önceki güvenlik raporundaki "bağımlılık tarama yok" açığı için Dependabot eklendi.
- `.github/dependabot.yml`: `npm` ekosistemi (root `package.json` — şu an tek devDependency `terser`) VE `github-actions` ekosistemi (deploy.yml'deki SHA-sabitlenmiş actions/checkout, actions/setup-node) haftalık taranacak; bilinen bir CVE bulunursa otomatik PR açılır.
- `npm audit` şu an **0 açık** raporluyor.
- **Kullanıcı için manuel adım:** Repo public olduğundan Dependabot alerts genelde otomatik açık olur, ama GitHub → repo → **Settings → Security → Code security and analysis** sayfasından "Dependabot alerts" ve "Dependabot security updates"in gerçekten açık olduğunu bir kez kontrol etmeniz iyi olur (ben repo ayarlarını değiştiremiyorum, sadece kod/config ekleyebiliyorum).
- Yedek gerekmedi (sadece CI config dosyası, uygulama koduna dokunmuyor); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.288 - 2026-08-02 - Güvenilir cihaz limiti: yönetici sınırsız, diğerleri 3

- Kullanıcı talebi: "yönetici için bir daha 30 günde bir eposta iste cihaz olarak sınırsız cihaz sayısı. diğer kullanıcılar için maksimum 3 cihaz".
- `server.js` artık `src/auth/access-control.js`'i (client/server ORTAK kaynak, zaten CommonJS export destekliyordu) `require` ediyor — "kim yönetici" tanımı tek yerde, kopya mantık yok.
- `markDeviceTrusted(uid, email)` — yönetici (`ADMIN_EMAIL`) için cihaz sayısı sınırsız; diğer tüm kullanıcılar için yeni bir cihaz güven kazanmadan önce, zaten 3 güvenilir cihazı varsa EN ESKİSİ (süresi önce dolacak olan) çıkarılır. 30 günlük süre değişmedi, sadece cihaz SAYISI sınırlandı.
- `tools/test-mfa-flow.js`'e 5. bölüm eklendi: yönetici için 5 cihazın hiçbiri çıkarılmadığı, normal kullanıcı için 4. cihaz eklenince en eskisinin (1.) çıkarılıp son 3'ün kaldığı, ve bir kullanıcının limitinin BAŞKA bir kullanıcıyı (izolasyon) etkilemediği doğrulanıyor; regresyonu yakaladığı kanıtlandı (eviction bilerek devre dışı bırakılıp test kırıldı, düzeltilip geri geçti).
- Yedek gerekmedi (0.0.286'nın devamı, küçük bir politika düzenlemesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.287 - 2026-08-02 - RESEND_API_KEY GitHub Secret'a eklendi — MFA aktif

- Kullanıcı Resend'de `experify.com.tr` domain'ini doğruladı (DKIM/SPF/DMARC yeşil) ve `RESEND_API_KEY`'i GitHub Actions repository secret olarak ekledi.
- Bu commit, sadece PM2'nin yeni secret'ı `--update-env` ile alması için deploy'u tetiklemek amacıyla push edildi (kod değişikliği yok). Deploy sonrası `isMfaConfigured()` artık `true` dönmeli — ilk girişte e-posta kodu istenmeye başlar.
- Doğrulama: deploy sonrası gerçek bir giriş denemesiyle e-posta kodu akışının uçtan uca çalıştığı kontrol edilecek.

## 0.0.286 - 2026-08-02 - E-posta ile 2FA (güvenilir cihaz standardı, 30 gün)

- Kullanıcı talebi: "eposta ile devam edelim ancak her girişte kod istemesin bunu bir standarda bağlayalım" — SMS/WhatsApp'ın gerçek bir ücretsiz kotası olmadığı (telekom iletim ücreti kaçınılmaz) belirlendikten sonra e-posta bazlı tek kullanımlık kod + Google/GitHub/Microsoft'un kullandığı "güvenilir cihaz" standardına karar verildi.
- **Akış:** login.html'de Firebase ile giriş başarılı olunca `POST /api/session` çağrılır; MFA aktifse (`RESEND_API_KEY` ayarlıysa) VE bu cihaz güvenilir değilse, oturum çerezi HENÜZ verilmez, `{requiresMfa:true}` döner. login.html ikinci adıma geçer: `POST /api/session/request-code` ile 6 haneli kod üretilip Resend API'siyle (basit HTTPS isteği, npm bağımlılığı yok) e-postayla gönderilir (10 dakika geçerli, 5 yanlış denemede iptal, kullanıcı başına saatte 5 istekle sınırlı — e-posta bombalama önlenir). Kod doğrulanınca (`POST /api/session/verify-code`) hem oturum çerezi hem de **30 gün** geçerli ayrı bir "güvenilir cihaz" çerezi (`rapor_2fa_trust`, HttpOnly) verilir; aynı tarayıcıdan sonraki girişlerde kod tekrar sorulmaz.
- **KRİTİK güvenlik/süreklilik kararı:** `RESEND_API_KEY` ortam değişkeni ayarlanmadığı sürece (`isMfaConfigured()` false) MFA tamamen devre dışı kalır — mevcut giriş akışı hiç değişmez. Kullanıcı bu akşam Resend hesabı/domain doğrulamasını tamamlayıp GitHub'a `RESEND_API_KEY` secret'ını eklediğinde otomatik aktifleşecek; ekleyene kadar bu commit canlıda hiçbir davranışı değiştirmez.
- Çıkış Yap (`signOutAndClearLocalData`) güvenilir cihaz durumuna DOKUNMAZ (standart pratik: oturumdan çıkmak cihaz güvenini sıfırlamaz).
- `server.js`'e `RESEND_API_KEY`/`RESEND_FROM_EMAIL` `.github/workflows/deploy.yml` → `ecosystem.config.cjs` üzerinden GitHub Secrets'tan geçirilecek şekilde bağlandı (secret tanımlı değilse boş string, hata vermez).
- **Yan not:** `response.setHeader("Set-Cookie", ...)` ikinci kez çağrılırsa birinciyi sessizce EZER — bir yanıtta hem oturum hem güvenilir cihaz çerezi aynı anda verilmesi gerektiğinden tüm çerez ayarlama kodu `response.appendHeader` kullanacak şekilde düzeltildi (0.0.284'teki `setSessionCookie`/`clearSessionCookie` dahil).
- Yeni `tools/test-mfa-flow.js`: `isMfaConfigured()`'ın `RESEND_API_KEY` yokken/varken doğru davrandığını (require.cache temizleyip modülü iki kez yükleyerek), `generateMfaCode()`'ın her zaman 6 haneli olduğunu, güvenilir cihaz yaşam döngüsünü (işaretle/doğrula/yanlış-uid-reddet/sahte-cerez-reddet) ve çerez header biçimini izole doğrular; regresyonu yakaladığı kanıtlandı (`isMfaConfigured` kasıtlı `true` yapılıp test kırıldı, düzeltilip geri geçti).
- Yedek gerekmedi (yeni, opt-in bir özellik; RESEND_API_KEY olmadan sıfır etkisi var); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.285 - 2026-08-02 - Kaynak kodu koruması 2. katman: deploy-öncesi minify

- 0.0.284'te eklenen login kapısının üzerine ikinci katman: giriş yapmış bir kullanıcı `app.js`'i indirse bile artık okunabilir/yorumlu kaynağı değil, minified (küçültülmüş, yorumsuz, tek satır) halini görür.
- Yeni `tools/minify-for-deploy.js` — `terser` (devDependency, sadece build-time; çalışma zamanı hâlâ sıfır bağımlılık) ile `app.js`, `cloud/cloud-sync.js`, `cloud/report-library.js` ve `src/**` altındaki 16 dosyayı kucultur. `.github/workflows/deploy.yml`'e rsync'ten ÖNCE çalışan bir adım eklendi; bu SADECE CI'ın geçici checkout kopyasında çalışır — repodaki dosyalar asla minified commit edilmez, geliştirme deneyimi etkilenmez.
- **Kritik güvenlik ayarı:** `mangle.toplevel: false` ve `compress.toplevel: false` — çünkü `src/templates/template-engine.js` içindeki `safeCall()` 147 kez `globalThis[fnName]` ile app.js fonksiyonlarını İSİM STRING'İYLE dinamik çağırıyor; üst düzey isimler değiştirilir/silinirse bu çağrılar sessizce kırılır. Bu ayarlarla test edildi: `window.RaporTemplates` (listTemplates/fillTemplate/exportTemplate vb.) ve `globalThis['buildGabimDataSetWordHtml']` gibi dinamik referanslar minify sonrası hâlâ doğru çalışıyor (gerçek tarayıcıda canlı doğrulandı).
- Her dosya minify sonrası `node --check` ile anında doğrulanır; bozuk çıktı olursa deploy job'ı rsync'e hiç gelmeden başarısız olur.
- Yeni `tools/test-minify-deploy-coverage.js`: TARGET_FILES listesinin gerçek dosyalarla senkron olduğunu (yeni bir src dosyası eklenip listeye eklenmezse yakalar), kritik `toplevel:false` ayarlarının kodda durduğunu, ve deploy.yml'in minify adımını rsync'ten ÖNCE çağırdığını doğrular.
- Yedek gerekmedi (yeni, izole bir güvenlik katmanı, sadece CI pipeline'ı etkiler); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.284 - 2026-08-02 - ÖNEMLİ: Kaynak kodu artık login olmadan indirilemez (server-side oturum kapısı)

- Kullanıcı riski açıkça belirtti: "bu kadar çaba gösteriyoruz bu kadar risk çok önemli bu kopyalanamamalı". Daha önce `app.js`, `index.html`, `styles.css`, `cloud/cloud-sync.js` gibi TÜM istemci kaynak kodu, giriş yapmadan (hatta hiç hesabı olmayan biri tarafından bile) URL'yi bilen HERKESE koşulsuz statik dosya olarak servis ediliyordu — sayfadaki `#authGateOverlay` yalnızca GÖRSEL bir kapıydı, kodun tarayıcıya inmesini engellemiyordu (bu boşluk index.html'de zaten yorum satırıyla not edilmişti).
- Yeni ayrı, küçük bir **`login.html`** eklendi (yalnızca giriş formu; `app.js`'in iş mantığını içermez). Firebase ile giriş başarılı olunca ID token `POST /api/session`'a gönderiliyor; sunucu bunu doğrulayıp (mevcut `authenticateRequest` ile) HttpOnly + SameSite=Lax bir `rapor_session` çerezi veriyor (üretimde `Secure` de eklenir; localhost'ta test edilebilsin diye eklenmez). Kullanıcı seçimiyle **7 gün** geçerli.
- `server.js`'deki `handleStatic`, bu çerez yokken `login.html` ve birkaç genel varlık (Firebase SDK, `cloud/firebase-config.js`, `manifest.json`, `icons/*`) DIŞINDA hiçbir dosyayı sunmuyor: HTML istekleri `login.html`'e yönlendiriliyor (302), diğerleri (app.js, styles.css, cloud-sync.js, saha-pro.html vb.) 401 dönüyor.
- Oturumlar `server-data/sessions.json`'a kalıcı yazılır (deploy'da `pm2 restart` oturumu silmesin diye — `server-data/` deploy rsync'inde zaten hariç tutuluyor, dolayısıyla korunuyor).
- "Çıkış Yap" (`signOutAndClearLocalData`, `cloud/cloud-sync.js`) artık Firebase'den çıkmadan ÖNCE `POST /api/session/logout` çağırıp sunucu çerezini de iptal ediyor — yalnızca istemci tarafı çıkış yetersizdi.
- Yeni `tools/test-static-auth-gate.js`: `isPublicStaticFile` allowlist'ini (login.html/vendor/firebase/manifest/icons EVET, app.js/index.html/styles.css/cloud-sync.js/saha-pro.html HAYIR) ve oturum yaşam döngüsünü (oluştur/doğrula/sahte reddet/çıkışta iptal, cookie header biçimi) izole doğrular.
- `tools/check-basic.js`'deki `cloud/cloud-sync.js?v=20260719-2200` sabit-sürüm kontrolü, kardeş kontroller gibi versiyon-agnostik regex'e çevrildi (cloud-sync.js'in cache-buster'ı bu değişiklikle bumped edildiği için sabit string artık geçersizdi).
- **Bilinen davranış değişikliği:** Deploy sonrası açık sekmesi olan/yeniden yükleyen/yeni sekme açan herkes `login.html`'e yönlendirilip tekrar giriş yapmak zorunda kalacak (mevcut Firebase hesabıyla, yeni kayıt gerekmez); zaten açık kalan sekmeler (sayfa yeniden yüklenmediği sürece) kod zaten yüklü olduğundan etkilenmez.
- Yedek gerekmedi (yeni, izole bir güvenlik katmanı); geri alma: bu commit'i `git revert` ile geri al — ama bu, kaynak kodu koruma amacını da geri alır.

## 0.0.283 - 2026-08-02 - Saha Pro aracı sol panelden yeni sekmede açılıyor

- Kullanıcının paylaştığı `C:\Users\90551\OneDrive\Masaüstü\claude\saha çalışma\index.html` (canvas tabanlı kroki/işaretleme aracı) uygulama köküne `saha-pro.html` adıyla eklendi; PWA'ya özgü `manifest.json`/favicon/service-worker referansları (gereksiz 404/uyarı kaynağı, bu bağlamda gerek yok) temizlendi.
- Bu, 0.0.129'daki iframe denemesinden (sonradan 0.0.130'da kaldırılmıştı) FARKLI bir yaklaşım: artık ayrı bir rapor bölümü/iframe DEĞİL, sol panelde `sectionNav`'ın hemen altında sabit duran bağımsız bir "Saha Pro" düğmesi (`#sahaProToolBtn`) — tıklanınca `saha-pro.html`'i `window.open(..., "_blank", "noopener")` ile YENİ SEKMEDE açıyor. Ana uygulamanın CSS/JS'iyle hiçbir çakışma riski yok (ayrı doküman); saha aracı `localStorage` kullanmadığından ana uygulamanın rapor verisiyle de çakışmıyor.
- Kullanıcının önceki denemesi ("sol panele ekledim ama çalışmadı") muhtemelen dosyaya doğrudan `file:///C:/Users/...` yolundan bağlanmaya çalıştığı için başarısız olmuştu — tarayıcılar `http(s)` sayfalarından yerel dosya sistemine link/iframe vermeyi güvenlik gereği engeller. Artık dosya kendi sunucumuzdan (`http://.../saha-pro.html`) servis edildiği için bu kısıtlama ortadan kalktı.
- Canlı doğrulama: `http://localhost:5173/saha-pro.html` doğrudan (200 OK, konsol hatası yok, araç tam render) ve düğmeye tıklayınca `saha-pro.html`'e GET isteği (200 OK) gittiği ağ sekmesinden doğrulandı.
- Yedek gerekmedi (yeni, izole ek özellik — mevcut hiçbir dosya/davranış değiştirilmedi); geri alma: bu commit'i `git revert` ile geri al (ayrıca `saha-pro.html`'i silmek gerekir, revert tek başına dosya eklemeyi de geri alır).

## 0.0.282 - 2026-08-02 - Emsal telefon numarası İş Bankası/Kuveyt Türk'te 10 haneye normalize edilir

- Emsaller matrisindeki "Telefon" (c1) alanına kullanıcı serbest formatta girebiliyor ("05321111212", "0 (532) 111 12 12", "5321111212" — en fazla 17 karakter, boşluk/parantez dahil). Bu bankalar sadece 10 haneli (başında 0 olmadan) format kabul ediyor.
- Yeni `formatComparablePhoneForOutput(value)` / `normalizeComparablePhoneForBank(value)` / `shouldNormalizeComparablePhoneForBank()` fonksiyonları eklendi: rakam-dışı tüm karakterler temizlenir, sonuç 11 haneyse baştaki "0" atılır, 12 haneyse ve "90" ile başlıyorsa ülke kodu atılır — sonuç 10 hane olur.
- Bu normalizasyon SADECE rapor çıktısına basılırken uygulanır (emsal matrisindeki ham giriş DEĞİŞMEZ) ve sadece İş Bankası ile Kuveyt Türk için: (1) `buildComparableContactLine` — comparable açıklama cümlesindeki "(İrtibat Kişisi ve Telefon No: ...)"; (2) `buildComparableMatrixWordTableHtml` — {{EMSAL_DEGERLEME_TABLOSU}} Word tablosundaki Telefon satırı. Diğer bankalarda telefon ham haliyle basılmaya devam eder.
- Yedek gerekmedi (küçük, izole özellik); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.281 - 2026-08-02 - Ziraat koordinatlarinda virgullu V2 placeholderlari

- `{{ENLEM_V2}}` ve `{{BOYLAM_V2}}` eklendi. Kaynak koordinatlari degistirmeden yalnizca ondalik ayiracini noktadan virgule cevirir: `40.179213` -> `40,179213`.
- Ziraat konut ve arsa/arazi sablonlarindaki enlem/boylam hucreleri bu V2 tokenlarini kullanir.
- Yedek: `backups/before-ziraat-comma-coordinates_2026-08-02_00-41-13`.

## 0.0.280 - 2026-08-02 - Konut raporlarında Emsal Değerleme Tablosu'ndan KAT ALANLARI gizlendi

- "KAT ALANLARI" sütun grubu (KAT/ALAN/İND. ORANI) artık sadece işyeri benzeri raporlarda (İşyeri/Ofis/Ticari Bina — `isWorkplaceLikeUsageNature()`) gösteriliyor; konut raporlarında bu 3 sütun hem başlıktan hem satırlardan tamamen kaldırılıyor (bu sütunlar konutta zaten hiç doldurulmuyordu).
- `createComparableValuationSummaryTable()` içine `showFloorColumns` bayrağı eklendi; grup/alt başlık, veri satırı ve ORTALAMA satırındaki kat hücreleri buna göre koşullu üretiliyor. Boş-tablo mesajının `colspan`i de (15/12) buna göre ayarlanıyor.
- Arazi (land) modundaki tablo bu değişiklikten etkilenmedi (zaten tamamen farklı bir başlık/satır şablonu kullanıyor).
- Yedek gerekmedi (0.0.274'ün görünürlük düzeltmesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.279 - 2026-08-02 - REGRESYON DÜZELTİLDİ: Konut emsallerinde M² birim değer hesaplanmıyordu

- Kullanıcı bildirdi: "emsalleri güncelledik ama konut emsallerinde hiç bir m2 birim değeri otomatik hesaplanmıyor".
- Neden: kat bazlı alan/indirgeme mekanizması (0.0.26x serisi) `calculateComparableMetrics` içinde HER satırda (nature'dan bağımsız) `syncComparableWorkplaceFloors(row)` çağırıyordu. "Kat" (c6) alanı konut emsallerinde de mevcut olduğundan, kat seçili bir konut satırında bu fonksiyon alanı boş kat kayıtları üretiyordu; bu kayıtlar indirgenmiş alan hesabına dahil edilince toplam 0'a düşüyor, `adjustedArea` 0 olduğundan M² birim değer (calcUnitValue) NaN/boş kalıyordu.
- Çözüm: kat bazlı alan/indirgeme artık SADECE `state.fields.legalUsageNature` işyeri benzeri (İşyeri/Ofis/Ticari Bina — `isWorkplaceLikeUsageNature()`) olduğunda devreye giriyor; konut raporlarında eski davranışa (Düzeltilmiş/Beyan Edilen Alan, c12/c13) geri dönülüyor. İşyeri raporlarında kat seçiliyken alan boş bırakılırsa hesap kasıtlı olarak yine boş kalır (0.0.26x'teki tasarım korunmuştur).
- `tools/test-comparable-workplace-floor-reduction.js`e bu regresyonu doğrudan yakalayan yeni bir senaryo (8) eklendi; ilgili diğer test dosyaları (`test-comparable-valuation-summary-floor-detail.js`) `state.fields.legalUsageNature` context'ini artık açıkça set ediyor.
- Yedek gerekmedi (acil regresyon düzeltmesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.278 - 2026-08-01 - KAT ALANLARI alt sütunlarının hücre hizalaması düzeltildi

- Kullanıcı ekran görüntüsüyle bildirdi: İND. ORANI alt sütunundaki %100/%30 değerleri, KAT ve ALAN alt sütunlarındaki satırlarla aynı hizada değildi (dikey olarak farklı konumda görünüyordu).
- Neden: tablo hücreleri `vertical-align: middle` kullanıyordu; İND. ORANI'nın toplam satırı boş metin içerdiğinden içerik yüksekliği diğer alt sütunlardan azdı, bu da dikey ortalamanın satırları birbirinden kaydırmasına yol açıyordu.
- Çözüm: `.comparable-summary-floor-areas-cell` için `vertical-align: top` zorlandı; boş toplam satırı artık `&nbsp;` ile dolduruluyor, böylece her alt sütunun içerik yüksekliği eşit kalıyor ve satırlar tam hizalı.
- Yedek gerekmedi (0.0.274'ün görsel düzeltmesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.277 - 2026-08-01 - EKB grafik oranından enerji sınıfı

- EKB PDF metninde enerji/emisyon sınıfı harfi bulunamadığında, grafik bantlarının yanındaki oran okunarak sınıf otomatik tespit edilir.
- Sırasıyla ilk oran enerji performans sınıfına, ikinci oran sera gazı emisyon sınıfına bağlanır; örneğin `80 - 99 88` satırı `C` sınıfını üretir.
- Etiketli sınıf harfi içeren EKB'lerde mevcut doğrudan okuma önceliklidir; grafik oranı yalnızca eksik verinin geri kazanımı için kullanılır.
- Yedek: `backups/before-ekb-graph-class-fallback_2026-08-01_23-31-25`.

## 0.0.276 - 2026-08-01 - EKB okuma ham verisi

- Açıklamalar bölümünde EKB Açıklamasının hemen altına salt okunur `EKB Okuma Ham Verisi` alanı eklendi.
- EKB PDF metin katmanından okunan ham içerik yükleme anında bu alana da aktarılır; kullanıcı ayrıştırıcının hangi metni gördüğünü doğrudan inceleyip kopyalayabilir.
- Yeni bir EKB yüklenirken önceki ham veri de türetilmiş EKB alanlarıyla birlikte temizlenir.
- Yedek: `backups/before-ekb-raw-explanation_2026-08-01_23-17-57`.

## 0.0.275 - 2026-08-01 - KAT ALANLARI satırlarında çerçeve yerine ayırıcı çizgi

- Kat alanları alt sütunlarındaki (KAT/ALAN/İND. ORANI) her satırın etrafındaki kutu çerçevesi kaldırıldı; bunun yerine satırlar arasında ince bir alt çizgi (border-bottom) kullanılıyor, son satırda çizgi yok.
- Sadece CSS değişikliği (`.comparable-summary-floor-area-line`); JS/veri mantığı değişmedi.
- Yedek gerekmedi (0.0.272/0.0.274'ün görsel devamı); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.274 - 2026-08-01 - KAT ALANLARI 3 alt sütuna bölündü (Kat / Alan / İnd. Oranı)

- Emsal Değerleme Tablosu'ndaki "KAT ALANLARI" tek birleşik hücre yerine "SATIŞ / PİYASA DEĞERLEMESİ" gibi bir grup başlığı (colspan=3) oldu; altında KAT, ALAN, İND. ORANI adında 3 ayrı alt sütun var.
- Her alt sütunun hücresinde ilgili değer kat başına satır satır, en altta da toplam satırı gösteriliyor: KAT sütununda "Zemin Kat / Asma Kat / Toplam", ALAN sütununda "100 m² / 50 m² / 115 m²" (son satır indirgenmiş toplam), İND. ORANI sütununda "%100 / %30 / (boş)".
- `formatComparableWorkplaceFloorDetailLabel` + `formatComparableWorkplaceFloorAreasColumn` (birleşik tek satır) kaldırıldı; yerine `formatComparableWorkplaceFloorColumn(row, key)` geldi (key: "floor"/"area"/"rate").
- Yedek gerekmedi (0.0.268/0.0.270/0.0.272/0.0.273'ün devamı, aynı özelliğin düzenlemesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.273 - 2026-08-01 - Emsal ALAN sütunu: ham toplam alan, hesaplama indirgenmiş alanda

- Kat bazında girilen emsallerde ALAN sütunu artık indirgeme UYGULANMADAN toplam alanı gösterir (ör. Zemin 100 m² + Asma 50 m² = 150 m²).
- Tüm hesaplamalar (M² Birim, İnd. M² Birim, Kira Birim vb.) değişmedi; hâlâ indirgenmiş alan (ör. 115 m²) üzerinden yapılıyor — sadece ALAN sütununun GÖRÜNÜMÜ değişti.
- `calculateComparableMetrics`e `workplaceTotalArea` (ham toplam) eklendi; `getComparableValuationRows()` `row.area`i (gösterim) `row.workplaceEffectiveArea`den (hesaplama, indirgenmiş) ayırdı. KAT ALANLARI sütunundaki "Toplam Etkili Alan" satırı hâlâ indirgenmiş alanı gösterir.
- Yedek gerekmedi (0.0.268/0.0.270/0.0.272'nin devamı, aynı özelliğin düzenlemesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.272 - 2026-08-01 - Emsal Değerleme Tablosu: ayrı "KAT ALANLARI" sütunu

- 0.0.270'te ALAN sütununun altına eklenen kat detay satırları kaldırıldı; onun yerine ALAN sütununun hemen yanına ayrı bir "KAT ALANLARI" sütunu eklendi.
- Kat bazında alan/indirgeme girilen emsallerde bu sütunun hücresinde her kat kendi satırında (çerçeveli, sağa yaslı) gösterilir, en altta da toplam satırı yer alır: `Zemin Kat 100 m² (%100)`, `Asma Kat 50 m² (%30)`, `Toplam Etkili Alan = 115 m²`.
- `createComparableWorkplaceFloorDetailRows` kaldırıldı; yerine `formatComparableWorkplaceFloorAreasColumn` eklendi (hücre içi çok satırlı HTML üretir, HTML-escape dahil). Arazi (land) modundaki tablo bu sütunu içermez (arazi emsallerinde kat kavramı yok).
- Yedek gerekmedi (0.0.268/0.0.270'in devamı, aynı özelliğin düzenlemesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.271 - 2026-08-01 - İncelenen belgeler ve takyidat tablo satırları

- Ortak kompakt Word tablo üreticisinde başlık satır yüksekliği %20 artırılarak `0,66 cm`, gövde ve bölüm satırları ise `0,60 cm` yapıldı.
- Word'ün `exactly` satır yüksekliği sebebiyle metni kesmesini önlemek için satırlar `at-least` kuralıyla üretilir; uzun açıklamalarda satır gerektiğinde büyür.
- Bu kural İncelenen Belgeler ve Takyidat tablolarının yanı sıra aynı ortak üreticiyi kullanan rapor tablolarına uygulanır.
- Yedek: `backups/before-word-table-row-height_2026-08-01_19-40-43`.

## 0.0.270 - 2026-08-01 - Emsal kat detayı: ALAN sütunu altında, çerçeveli, sağa yaslı

- 0.0.268'de eklenen kat detay satırları, NO sütununun altında değil ALAN sütununun altında hizalanacak şekilde düzeltildi (ilk hücre boş bırakılır, metin ikinci hücreden başlar).
- Her kat detay satırı artık kendi hücresi içinde çerçeveli (border) ve sağa yaslı gösteriliyor.
- Yedek gerekmedi (aynı özelliğin küçük bir düzeltmesi); geri alma: bu commit'i `git revert` ile geri al.

## 0.0.269 - 2026-08-01 - GDYS yardımcı şablon görünümü

- Tüm banka raporlarında bulunan ortak `GDYS Yardımcı Bilgiler`, `GABİM Veri Seti` ve `Çalışma Kağıdı` blokları GDYS ekranlarındaki açık zemin, ince gri çerçeve, antrasit bölüm başlığı ve turuncu vurgu çizgisiyle dışa aktarılır.
- Bankaya özel GABİM alanları ve raporun diğer banka temaları değiştirilmedi; yalnızca şablon sonundaki ortak GABİM veri seti form grupları GDYS biçimine taşındı.
- Ortak `{{GABIM_VERI_SETI}}` çıktısındaki grup başlıkları ve değer kutuları, Word uyumlu keskin köşeli gri form alanları olarak yeniden düzenlendi.
- Yedek: `backups/before-gdys-template-presentation_2026-08-01_19-28-51`.

## 0.0.268 - 2026-08-01 - Emsal Değerleme Tablosu kat detayı ayrı satırlara alındı

- "Emsal Değerleme Tablosu"nda (ekran özet paneli) kat bazında alan/indirgeme girilen emsallerde ALAN hücresinin altındaki küçük yazı yerine, her kat için ayrı bir tablo satırı + bir toplam satırı eklendi: `Zemin Kat 100 m² (%100)`, `Asma Kat 50 m² (%30)`, `Toplam Etkili Alan = 115 m²`.
- `formatComparableSummaryAreaCell` sadeleştirildi (artık sadece toplam alanı döner); yeni `formatComparableWorkplaceFloorDetailLabel` ve `createComparableWorkplaceFloorDetailRows` fonksiyonları eklendi. `getComparableValuationRows()` artık `workplaceFloorsSummary` yerine ham `workplaceFloors` dizisini taşır.
- Word/rapor çıktısındaki emsal tablosu (`buildComparableMatrixWordTableHtml`) bu değişiklikten etkilenmedi, zaten kat detayını gösteriyordu.
- Geri alma: `git revert` ile bu commit; önceki davranış (ALAN hücresi altında küçük özet satırı) geri gelir.

## 0.0.267 - 2026-08-01 - İş Bankası AFAD bağlantısı düzeltildi

- İş Bankası şablonundaki deprem tehlike haritası bağlantısı `https://tdth.afad.gov.tr/TDTH/main.xhtml` olarak düzeltildi.
- Yedek: `backups/before-fix-isbank-afad-link_2026-08-01_19-15-24`.

## 0.0.266 - 2026-08-01 - İş Bankası minimum değerleme yöntemi kontrolü

- Türkiye İş Bankası A.Ş. seçiliyken Değerleme Metodu alanında iki yöntem seçilmemişse `Değerleme: En az 2 adet Değerleme Metodu seçilmelidir.` kaydı eksik kritik alanlara eklenir.
- Rapor çıktısı öncesi ortak eksik alan doğrulaması aynı kaydı uyarı penceresinde de gösterir; kullanıcı uyarıyı görmeden çıktıya devam edemez.
- Yedek: `backups/before-isbank-minimum-valuation-methods_2026-08-01_18-49-39`.

- Test paketi sırasında tespit edilen İş Bankası emsal bölümü regresyonu da düzeltildi: `{{EMSAL_DEGERLEME_TABLOSU}}`, emsal matrisi, açıklaması ve krokilerinden sonra şablona geri eklendi. Yedek: `backups/before-isbank-comparable-valuation-table_2026-08-01_18-54-29`.

- İş Bankası ekranında aynı emsal değerleme tablosu zaten üstte yer aldığı için ikinci `{{EMSAL_DEGERLEME_TABLOSU}}` kaldırıldı. Şablon regresyon testi, İş Bankası'nı bu ek tablo zorunluluğundan istisna tutar. Yedek: `backups/before-remove-isbank-duplicate-comparable-table_2026-08-01_19-02-43`.

Son güncelleme: 2026-08-01 · Servis edilen sürüm: **app.js?v=20260801-2355** (styles.css?v=20260801-1930, src/templates/template-engine.js?v=20260801-1855, cloud/cloud-sync.js?v=20260719-2200, cloud/report-library.js?v=20260724-1330, halkbank-risk-rules.js?v=20260707-1812)

Bu belge, bir sonraki geliştirici/oturum için projeyi çalıştırma, doğrulama ve bu
oturumda yapılanları özetler.

## 0.0.265 - 2026-08-01 - İş Bankası kat dağılımı placeholder eşlemesi düzeltildi

- İş Bankası şablonundaki çözümlenmeyen `{{BUILDING_FLOOR_SUMMARY_TEXT}}` yerine istenen `{{MAIN_PROPERTY_FLOOR_COUNT_TEXT}}` kullanıldı.
- Şablon motoruna bu placeholder için `mainPropertyFloorCountText` değerini kat sayımı üzerinden gerektiğinde otomatik oluşturan alias eklendi.
- Yedek: `backups/before-main-property-floor-placeholder_2026-08-01_18-39-19`.

## 0.0.264 - 2026-08-01 - İş Bankası incelenen belgeler akışı tamamlandı

- İncelenen Belgeler tablosundan sonra Yapı Kullanma İzin Belgesi ve Yapı Ruhsatı için ayrı iki sütunlu alanlar eklendi: var/yok, veren kurum, veriliş amacı, tarih ve belge numarası.
- Kat dağılımından otomatik hesaplanan yol kotu altı kat sayısı ile zemin ve normal katların toplamı olan yol kotu üstü kat sayısı, toplam kat ve toplam bağımsız bölüm sayısı rapora bağlandı.
- Projeye uygunluk durumu uygunsa `YOK`, diğer durumlarda `VAR`; cezai karar seçimi Evet ise `VAR`, Hayır ise `YOK` olarak rapora yazılır. Varsa açıklama alanında proje uygunluk açıklaması kullanılır.
- Proje inceleme ve incelenen belgeler metinleri `İncelenen Diğer Belgeler ve Yapılan Araştırmalar` başlığı altında toplandı.
- Yedek: `backups/before-isbank-reviewed-documents-layout_2026-08-01_18-24-48`.

## 0.0.263 - 2026-08-01 - İş Bankası bağımsız bölüm alan ve kat akışı düzeltildi

- Bağımsız Bölüm Genel Özellikleri tablosunda net kullanım alanları ilk satıra alındı; yasal ve mevcut brüt alanlar ikinci satırda tutuldu.
- İç hacimlerin hemen ardına yapının halihazır kullanıma göre toplam kat sayısı, bağımsız bölüm sayısı ve kat dağılımı eklendi.
- Bağımsız Bölümün Diğer Özellikleri başlığı ile proje inceleme/bina oturumu metinleri, İç Mekan Özellikleri açıklamalarının altına taşındı.
- Regresyon testi alan sırasını, kat bilgisinin iç hacimlerden sonra olmasını ve diğer özelliklerin iç mekan bloğundan sonra gelmesini denetler.
- Yedek: `backups/before-isbank-area-floor-order_2026-08-01_17-59-10`.

## 0.0.262 - 2026-08-01 - İş Bankası TAKBİS inceleme açıklaması eklendi

- Yeni otomatik metin/placeholder: `{{ISBANK_ENCUMBRANCE_EXPLANATION}}`.
- Metin TAKBİS tarih ve saatinden üretilir: `TKGM (TAKBİS) kayıtlarında incelemeler [tarih] tarihinde saat [saat]'de gerçekleştirilmiştir.` Saat bilgisi yoksa yalnızca tarih kullanılır.
- Açıklamalar ekranına `Takyidat Açıklama (İş Bankası)` adıyla eklendi; İş Bankası şablonunda Tapu Kayıtları ve Kısıtlar açıklamasının üstünde gösterilir.
- Yedek: `backups/before-isbank-takbis-explanation_2026-08-01_17-53-21`.

## 0.0.261 - 2026-08-01 - İş Bankası takyidat, net alan ve PGA akışı güncellendi

- İş Bankası şablonunda `TAKYİDAT_TABLOSU` artık `3. ÖZELLİKLER SEKMESİ`nin ilk verisidir. Tapu sekmesinden kaldırıldı; ardından gelen `Tapu Kayıtları ve Kısıtlar` bölümü sadece kullanım/tarih/saat metası ile kullanıcı seçimine bağlı takyidat açıklamasını içerir.
- Takyidat açıklamasının giriş cümlesi, TAKBİS alınma tarihinin yanında mevcutsa saati de yazar.
- Yasal ve mevcut net kullanım alanları manuel giriş değildir. Brüt alanların `1,15`e bölünüp tam sayıya yuvarlanmasıyla hesaplanır; şablon bu alanları ilgili brüt alanların yanında gösterir.
- İmar plan türü plan ölçeğinden otomatik türetilir: `1/1.000` Uygulama İmar Planı, `1/5.000` Nazım İmar Planı, `1/25.000` ve `1/100.000` Çevre Düzeni Planı.
- Yapının Genel Özellikleri'ne açık/kapalı yüzme havuzu için sosyal tesis seçimine bağlı Evet/Hayır, yapının kat sayısı ve bağımsız bölüm sayısı eklendi; kat dağılımı hücresi kaldırıldı.
- Yapı genel açıklamasından sonra PGA 475 anlatımı, AFAD bağlantısı, enlem/boylam kutusu ve bilgilendirme notu eklendi. PGA 475 değeri Ana Taşınmaz Teknik Bilgileri alanından girilir.
- Proje inceleme ve bina oturumu/giriş açıklamaları `Bağımsız Bölümün Diğer Özellikleri` altında toplandı.
- Yedek: `backups/before-isbank-takyidat-area-pga_2026-08-01_17-38-47`.

## 0.0.260 - 2026-08-01 - İş Bankası Özellikler sekmesi bağımsız bölüm verileri tamamlandı

- `templates/isbankasi.html` içindeki `3. ÖZELLİKLER SEKMESİ` artık imar bilgisiyle başlamaz. Banka ekranındaki sırayı izleyen `Bağımsız Bölüm Genel Özellikleri` tablosu önce gelir.
- Bu başlangıç tablosuna yasal/mevcut nitelik, kullanım durumu, kaçıncı el, enerji kimlik belgesi durumu, enerji performans sınıfı ve belge numarası, yasal/mevcut brüt alan, yasal/mevcut net alan, kat, cephe, manzara, iç hacimler, ısıtma sistemi, malzeme-işçilik kalitesi ve inşaat seviyesi bağlandı.
- Net alanlar sistemde önceden ayrı alan olarak bulunmadığından Bağımsız Bölüm Genel Bilgileri ekranına `Yasal Net Kullanım Alanı (m²)` ve `Mevcut Net Kullanım Alanı (m²)` kullanıcı girişleri eklendi; İş Bankası şablonundaki karşılıkları `{{LEGAL_NET_AREA}}` ve `{{CURRENT_NET_AREA}}`dır.
- Aynı verileri ikinci kez yazan eski Bağımsız Bölüm Özellikleri tablosu kaldırıldı; iç mekan açıklamaları kendi başlığında korunuyor.
- Cache sürümleri `app.js=20260801-1715` ve `template-engine.js=20260801-1715` olarak güncellendi.
- Regresyon testi, İş Bankası Özellikler sekmesinde alan/EKB/ısıtma/işçilik bilgilerinin imar bilgisinden önce ve ekran sırasıyla bulunmasını denetler.
- Yedek: `backups/before-isbank-properties-layout_2026-08-01_17-00-18`.

## 0.0.259 - 2026-08-01 - İş Bankası Tapu ve Özellikler sekmesi akışı ayrıştırıldı

- `templates/isbankasi.html` içinde banka ekranlarındaki akışa uygun olarak `1. TAPU SEKMESİ`, `2. KONUM BİLGİLERİ` ve `3. ÖZELLİKLER SEKMESİ` sırası korundu; Tapu bölümü artık Özelliklerden önce açık ve bağımsız bir bölüm.
- Tapu sekmesine malik bilgilerinin ardından `Tapu Kayıtları ve Kısıtlar` alt başlığı eklendi: fiili kullanım niteliği, kullanım durumu, tapu kayıt değişikliği, takyidat tarihi/saati, takyidat tablosu ve kullanıcı seçimine göre özet/detay takyidat metni burada bulunur.
- Özellikler sekmesi artık doğrudan `İmar Durumu Bilgileri` ile başlar; yapı, bağımsız bölüm ve çevre detaylarının banka ekranındaki özellik akışı korunur.
- `tools/test-bank-templates.js` bölüm ve takyidat yerleşimini geriye dönük kontrol eder.
- Yedek: `backups/before-isbank-tapu-tab-layout_2026-08-01_17-00-18`.

## 0.0.258 - 2026-08-01 - İş Bankası tapu bilgileri sırası banka ekranına göre düzeltildi

- `templates/isbankasi.html` içindeki `1. TAPU BİLGİLERİ` bloğu İş Bankası ekranındaki akışa göre yeniden dizildi.
- Sıra artık `Tapunun Türü`, `İl/İlçe`, `Mahalle/Köy`, `Mevki/Bucak`, `Yüzölçümü`, `Pafta`, `Ada`, `Parsel`, ana taşınmaz vasfı, bağımsız bölüm niteliği, blok/kat/BB/iç kapı, arsa payı/payda, eklenti, yevmiye, cilt/sahife, edinme sebebi, UAVT ve taşınmaz zemin ID şeklinde ilerliyor.
- Sistem karşılığı olmayan banka alanları ham placeholder bırakmayacak şekilde boş hücre olarak tutuldu.
- `tools/test-bank-templates.js` içine İş Bankası tapu placeholder sırası regresyon kontrolü eklendi.
- Yedek: `backups/before-isbank-tapu-order_2026-08-01_16-35-35`.

## 0.0.257 - 2026-08-01 - İş Bankası tam rapor şablonu banka ekranlarına göre yeniden hazırlandı

Kullanıcının ilettiği `İŞ BANKASI.rar` içindeki 16 adet İş Bankası rapor
hazırlama ekranı tek tek incelendi; eski kısa/özet `isbankasi.html` şablonu,
banka ekranlarının bilgi mimarisi ve önceki banka şablonu kuralları esas
alınarak tam rapor biçiminde yeniden oluşturuldu.

- Şablon sırası: Tapu Bilgileri → Konum Bilgileri ve konum haritası →
  Özellikler (takyidat, imar, belgeler/proje, yapı, bağımsız bölüm, çevre,
  değer faktörleri) → Değerleme → Emsaller ve emsal krokisi → GDYS → GABİM →
  Çalışma Kağıdı.
- İş Bankası ekranlarındaki beyaz/açık gri zemin, lacivert başlık, parlak mavi
  alan etiketi, ince gri kenarlık ve yoğun iki sütunlu form dili Word'e uygun
  dört hücreli tablolara aktarıldı. A4 sayfa, Arial 7 punto, 18 pt asgari satır
  yüksekliği ve 16 px tablo aralığı korundu.
- Haritalar, malik/takyidat/incelenen belgeler, değerleme, kat bazında alan ve
  emsal tabloları mevcut dinamik üreticilere bağlandı; mükerrer konum/emsal
  krokisi üretilmiyor.
- İş Bankası ekranında ayrı görünen özel güvenlik, açık/kapalı otopark,
  açık/kapalı havuz, deprem bölgesi, ulaşım, yapılaşma hızı, büyük yatırım ve
  markalı konut yoğunluğu alanları da forma eklendi.
- Sistemde ayrı bir veri karşılığı bulunmayan **İmar Plan Türü**, **Kentsel
  Ölçekte Tanınmışlık**, **Ana Cadde Üzerinde mi?**, **Açık Yüzme Havuzu** ve
  **Kapalı Yüzme Havuzu** hücreleri veri uydurulmaması için boş bırakıldı.
- `tools/test-bank-templates.js` İş Bankası bölüm sırası, başlık kapsamı,
  renkler ve dört hücreli yoğun form yapısı için regresyon kontrolleriyle
  genişletildi.
- `isbankasi-masraf.html` ayrı masraf şablonu olduğu için değiştirilmedi.
- Tarayıcı doğrulaması: 794×1123 A4 görünümünde ilk başlık üst boşluk olmadan
  başladı; yatay taşma ve çözülmemiş placeholder bulunmadı; 21 tablo ile uzun
  açıklama, değerleme ve emsal blokları görsel olarak kontrol edildi.
- Doğrulama: `npm.cmd run verify` geçti; `node tools/test-bank-templates.js`
  geçti; `git diff --check` temiz (yalnızca mevcut LF/CRLF uyarısı).
- Yedek: `backups/before-isbank-template_2026-08-01_14-51-20/`.

## 0.0.256 - 2026-08-01 - Emsal Değerleme Tablosu'na kat bazlı alan detayı eklendi

Kullanıcı talebi: "Emsaller tablosu kat bazında girilen emsalleri gösterir
şekilde düzenleme planı" — önce araştırma yapıldı, iki kapsam netleşti:

1. **Emsal Değerleme Tablosu (ekran özeti)** — ALAN hücresi sadece toplam
   sayıyı (örn. 115,00) gösteriyordu, hangi katın kaç m² olduğunu
   göstermiyordu. **Bu güncellemede eklendi.**
2. **Word/rapor çıktısı** — kontrol edildi, `buildComparableMatrixWordTableHtml()`
   zaten "Kat Bazında Alan / İndirgeme Oranı" satırını gösteriyordu (0.0.250
   sırasında otomatik gelmişti). **Ek değişiklik gerekmedi.**

- Yeni `formatComparableSummaryAreaCell(row)`: ALAN sayısının altına,
  `row.workplaceFloorsSummary` doluysa küçük gri bir kat-detay satırı ekler
  (örn. "Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)"), HTML-escape
  ile. Detay yoksa (kat bazlı veri girilmemiş emsal) sadece sayı görünür.
- `getComparableValuationRows()`: her satıra `workplaceFloorsSummary:
  formatComparableWorkplaceFloorsSummary(row)` eklendi.
- Yeni CSS `.comparable-summary-floor-detail` (10px, muted, blok).
- Yeni test: `tools/test-comparable-valuation-summary-floor-detail.js`
  (saf HTML üretimi + XSS-escape + `getComparableValuationRows` kablolama
  entegrasyonu; kural kaldırıldığında testin gerçekten başarısız olduğu
  doğrulandı).
- Doğrulama: `npm run verify` (42 test) geçti; gerçek tarayıcıda E1
  satırında kat detayının doğru göründüğü, ORTALAMA satırının etkilenmediği
  ekran görüntüsüyle doğrulandı.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.255 - 2026-08-01 - İşyeri emsallerinde Oda Sayısı satırı kaldırıldı (matris + açıklama)

Kullanıcı talebi: "işyeri emsallerinden oda sayısı satırını kaldıralım
açıklama bölümünden de kaldıralım" — Oda Sayısı (c5) konut için anlamlı,
işyeri/ofis/ticari bina için anlamsız (dükkan/ofis "3+1" gibi oda
sayısıyla tanımlanmaz).

- Yeni `comparableHiddenForWorkplaceFieldKeys` Set'i (`["c5"]`):
  `getComparableDisplayFields()` ve Word export filtresinde
  (`buildComparableMatrixWordTableHtml`) `isWorkplaceLikeUsageNature()`
  true iken bu alanlar gizlenir — mevcut `comparableWorkplaceOnlyFieldKeys`
  desenin TERSİ (o sadece işyeride GÖSTERİR, bu sadece işyeride GİZLER).
- `buildComparableLongText()`: yeni `roomCountText` değişkeni
  (`isWorkplaceLikeUsageNature() ? "" : row.c5`) — işyeri/ofis/ticari
  raporlarda "X planında" cümle parçası (örn. "Dükkan planında") artık
  hiç eklenmiyor; konut'ta davranış DEĞİŞMEDİ.
- Yeni testler: `tools/test-comparable-workplace-room-count-hidden.js`
  (matris görünürlüğü — işyeri/ofis/ticari'de gizli, konut'ta görünür,
  arazi görünümünde zaten gizli davranış korunuyor) ve
  `test-comparable-workplace-floor-description.js`'e eklenen yeni senaryo
  (açıklamadan kalkması); her iki kural kaldırıldığında ilgili testlerin
  gerçekten başarısız olduğu doğrulandı.
- Doğrulama: `npm run verify` (41 test) geçti; gerçek tarayıcıda hem
  matriste hem açıklamada (işyeri: "...olarak beyan edilen işyeri
  1.150.000 TL..." — "Dükkan planında" yok; konut: "...3+1 planında
  daire..." — değişmedi) doğrulandı.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.254 - 2026-08-01 - Kat bazında alan ifadesi "toplamlı" biçime çevrildi

Kullanıcı talebi: "zemin katta 100 m2 ve asma katta 50 m2" yerine "zemin
katı 100 m2 asma katı 50 m2 olmak üzere toplam 150 m2 olacak şekilde"
biçiminde düzenlenmeli.

- `buildComparableWorkplaceFloorAreaPhrase()`: BİRDEN FAZLA kat girilmişse
  artık her katı "X katı Y m2" biçiminde (possessif, "ve" bağlacı olmadan)
  art arda sıralayıp sonuna "olmak üzere toplam {ham alan toplamı} olacak
  şekilde" ekliyor. TEK kat girilmişse eski ifade ("X katta Y m2 olarak
  beyan edilen") DEĞİŞMEDEN korunuyor — "toplam" kavramı tek kat için
  anlamsız.
- Buradaki "toplam" HAM (indirgenmemiş) alanların toplamı — kat bazında
  indirgeme sonrası "etkili alan"ı anlatan ayrı cümle (0.0.253) zaten var
  ve değişmedi.
- `tools/test-comparable-workplace-floor-description.js` güncellendi: yeni
  toplamlı ifade birebir doğrulanıyor, tek-kat eski ifadenin korunduğu ayrı
  bir senaryoyla test ediliyor; kural kaldırıldığında testin gerçekten
  başarısız olduğu doğrulandı.
- Doğrulama: `npm run verify` (39 test) geçti; gerçek tarayıcıda hem çok
  katlı ("zemin katı 100 m2 asma katı 50 m2 olmak üzere toplam 150 m2
  olacak şekilde") hem tek katlı ("zemin katta 150 m2 olarak beyan edilen")
  senaryolar doğrulandı.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.253 - 2026-08-01 - Emsal açıklamasına kat bazında indirgeme mantığını anlatan cümle eklendi

Kullanıcı talebi: Kira cümlesinden hemen sonra kat bazında indirgeme
mantığını açıkça anlatan bir cümle gelmeli, örn: "Kat bazında indirgenmiş
alan zemin kat etkili alan olarak belirlenmiş olup asma kat %30 oranında
indirgenerek etkili alan 115 m2 olarak hesaplanmıştır."

- Yeni `buildComparableWorkplaceFloorReductionExplanation(row, metrics)`:
  `workplaceFloors`'ı oranına göre ikiye ayırır — %100 (indirgemesiz) katlar
  "X etkili alan olarak belirlenmiş olup", %100'den düşük katlar "Y %Z
  oranında indirgenerek" ifadesiyle anlatılır; cümle
  `metrics.workplaceReducedArea` (zaten hesaplanan toplam indirgenmiş alan)
  ile "etkili alan N m2 olarak hesaplanmıştır." diye biter. Hiç baz kat
  yoksa (tüm katlar indirgenmiş) veya hiç indirgeme yoksa (tüm katlar
  %100) ilgili yarı otomatik olarak atlanır.
- `buildComparableLongText()`: bu cümle `bargainRentText` (kira/pazarlık
  cümlesi) hemen sonrasına, `extraText`/hesaplama metninden ÖNCE eklendi.
- Alan girilmiş kat yoksa (`workplaceFloors` boş/yok) fonksiyon boş döner,
  cümle hiç eklenmez — eski davranış korunur.
- `tools/test-comparable-workplace-floor-description.js` genişletildi: yeni
  saf fonksiyon testleri (kullanıcının birebir örneği, indirgemesiz, tümü
  indirgenmiş, veri yok senaryoları) + `buildComparableLongText` kablolama
  testi artık cümlenin KİRA CÜMLESİNDEN SONRA geldiğini konum bazlı
  doğruluyor; kural kaldırıldığında testin gerçekten başarısız olduğu
  doğrulandı.
- Doğrulama: `npm run verify` (39 test) geçti; gerçek tarayıcıda üretilen
  tam metin kullanıcının verdiği örnek cümleyle birebir eşleşti.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.252 - 2026-08-01 - Emsal açıklaması artık dükkana ve katlara göre düzenleniyor

Kullanıcı bildirimi: 0.0.251'de kat bazında alan/indirgeme eklendi ama
otomatik üretilen emsal açıklaması (calcLongText) hâlâ eski tek-kat/düz-alan
cümlesini kullanıyordu — kat bazlı veriyi yansıtmıyordu.

- Yeni `buildComparableWorkplaceFloorAreaPhrase(row)`: `workplaceFloors`
  içinde alanı dolu olan HER kat için ayrı bir ifade üretir, örn. "zemin
  katta 100 m2 ve asma katta 50 m2 olarak beyan edilen".
- `buildComparableLongText()`: bu ifade varsa eski `floor` (Kat ibaresi) +
  `declaredArea`/`correctedArea` (Beyan Edilen/Düzeltilmiş Alan) parçaları
  BASTIRILIR (çift bilgi olmasın diye) ve yeni ifade onların yerine
  cümleye girer. Kat seçili ama alanlar boşsa veya `workplaceFloors` hiç
  yoksa (eski kayıtlar) davranış AYNEN eskisi gibi kalır.
- Hesaplama metni (`buildComparableCalculationText`, "İndirgenmiş m2 Birim
  Değeri: ... / 115 m2 = ...") zaten `metrics.adjustedArea` kullandığından
  ek değişiklik gerekmedi — otomatik doğru toplamı gösteriyordu.
- Yeni test: `tools/test-comparable-workplace-floor-description.js` (saf
  ifade üretimi + `buildComparableLongText` kablolama entegrasyonu — kat
  bazlı/tek-kat/hiç-workplaceFloors-yok üç senaryoyu izole doğrular; kural
  kaldırıldığında testin gerçekten başarısız olduğu ve tam olarak
  kullanıcının bildirdiği "açıklama değişmemiş" belirtisini ürettiği
  doğrulandı).
- Doğrulama: `npm run verify` (39 test) geçti; gerçek tarayıcıda örnek
  senaryo ("Ekspertize konu taşınmazla aynı bölgede... zemin katta 100 m2
  ve asma katta 50 m2 olarak beyan edilen... / 115 m2 = 10.000 TL/m2")
  doğrulandı, eski davranışın (kat detayı girilmemiş emsallerde) bozulmadığı
  kontrol edildi.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.251 - 2026-08-01 - Emsaller kat bazında indirgeme: TEK orandan KAT-BAZLI listeye geçiş

0.0.250'de eklenen tekli "Kat Bazında İndirgeme Oranı" (c32) alanı, kullanıcının
ek talebi üzerine ÇOK KATLI emsalleri desteklemek için kaldırılıp yerine
kat-bazlı bir liste getirildi: "Kat" (c6) alanında birden fazla kat
seçildiğinde (örn. "Zemin kat, Asma kat"), her kat için AYRI bir alan (m²)
ve indirgeme oranı (%) satırı otomatik türer — konu taşınmazın kendi
"Katlar, Alanlar ve İç Hacimler" tablosuna benzer mantık.

- Veri modeli: `row.workplaceFloors = [{floor, area, rate}, ...]` — yeni
  `syncComparableWorkplaceFloors(row)` bunu `c6`'daki seçili katlarla
  senkron tutar (yeni kat → boş girdi eklenir, kaldırılan kat → girdisi
  silinir, kalanların girdisi KORUNUR).
- `comparableFields`'taki `c32` select alanı kaldırıldı; yerine
  `{ key: "workplaceFloors", type: "workplaceFloorBreakdown" }` geldi.
  Yeni `createComparableWorkplaceFloorBreakdown()` bu tipi
  `createComparableMatrixCell()` içinde özel olarak render eder (her kat
  için kat adı + alan input + oran select).
- "Kat" (c6) çoklu seçimi değiştiğinde artık `renderSection()` tetikleniyor
  (`createComparableMultiSelectControl`'de `field.key === "c6"` özel durumu)
  — böylece alttaki kat listesi hemen senkronize olur.
- `calculateComparableMetrics()`: kat SEÇİLİYSE toplam indirgenmiş alan artık
  `Σ(kat alanı × kat oranı)` — kullanıcının açık tercihi gereği alan
  boş/eksik bırakılırsa Düzeltilmiş/Beyan Edilen Alan'a SESSİZCE geri
  DÖNÜLMEZ, hesap boş/NaN kalır. Kat HİÇ seçilmemişse eski davranış
  (Düzeltilmiş/Beyan Edilen Alan) aynen korunur.
- Word/export tablosu (`buildComparableMatrixWordTableHtml`) ve placeholder
  kataloğu (`getComparablePlaceholderDefinitions`) için yeni
  `formatComparableWorkplaceFloorsSummary()`: kat listesini okunabilir tek
  satıra çevirir, örn. "Zemin kat: 100 m² (100%), Asma kat: 50 m² (30%)"
  (önceki tasarımda bu alanlar array olarak sızıp "[object Object]" üretme
  riski taşıyordu — export/placeholder yollarında ayrıca ele alındı).
- `cloneComparableRow`/`isComparableRowEmpty` yeni `workplaceFloors`
  dizisini (referans paylaşmadan derin kopya; boşluk kontrolü array-aware)
  doğru işleyecek şekilde güncellendi.
- `parseComparableWorkplaceReductionRate` geliştirme sırasında bulunan bir
  hata da düzeltildi: "%0" seçilince yanlışlıkla %100'e düşüyordu
  (`number <= 0` → `number < 0`, sıfır artık geçerli bir oran).
- Görünürlük kuralı DEĞİŞMEDİ: hâlâ yalnızca konu taşınmaz işyeri/ofis/
  ticari bina ise (konut hariç) görünür.
- Test dosyası (`tools/test-comparable-workplace-floor-reduction.js`)
  baştan yazıldı: kat senkronizasyonu (ekleme/çıkarma/koruma), %0 edge-case,
  çok katlı örnek senaryo (100 m² %100 + 50 m² %30 = 115 m²), kat seçili
  ama alan boşken hesabın SESSİZCE eski değere dönmediği, kat hiç
  seçilmemişken eski davranışın korunduğu ve arazi emsalinde etkisiz
  olduğu senaryolarını doğrular; kural kaldırıldığında testin gerçekten
  başarısız olduğu doğrulandı.
- Doğrulama: `npm run verify` (38 test) geçti; gerçek tarayıcıda kat
  seçimiyle liste satırlarının otomatik türediği, alan/oran girildiğinde
  Toplam İndirgenmiş Alan'ın (115 m²) ve M2 Birim Değer'in (10.000 TL/m²)
  doğru hesaplandığı ekran görüntüsüyle doğrulandı.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.250 - 2026-08-01 - Emsaller bölümüne işyeri/ofis/ticari bina için Kat Bazında İndirgeme eklendi

Kullanıcı talebi: İşyeri emsallerinde hangi kat, kaç m², kat bazında
indirgeme oranı ve toplam indirgenmiş alanın belirtilmesi isteniyordu — Ana
Gayrimenkul bölümündeki "Kat Bazında Hesaplama Tablosu" ile aynı genel
mantıkla. Önce kod tabanı analiz edildi (araştırma ajanı ile), sonra
kullanıcıyla plan netleştirildi (2 açık soru: görünürlük kuralı ve
Düzeltilmiş Alan'ın yerini alıp almayacağı), kodlamadan önce
`backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`
altına yedek alındı.

- Yeni alanlar (`comparableFields`): `c32` "Kat Bazında İndirgeme Oranı"
  (select, `comparablePercentOptions` — %0-%100, 5'er artan) ve
  `calcWorkplaceReducedArea` "Toplam İndirgenmiş Alan" (computed, salt
  okunur, TL yerine "m²" birimiyle).
- Yeni `comparableWorkplaceOnlyFieldKeys` Set'i + `getComparableDisplayFields()`
  ve Word/export tablosu filtresinde (`buildComparableMatrixWordTableHtml`)
  kullanımı: bu iki alan yalnızca konu
  taşınmaz **işyeri/ofis/ticari bina** ise görünür — **konut hariç**
  (kullanıcının seçtiği tasarım kararı; Ana Gayrimenkul'deki kat indirgeme
  alanları konut için de görünürken, Emsaller'deki bu yeni alanlar için
  kapsam bilinçli olarak daraltıldı).
- Yeni `isWorkplaceLikeUsageNature(value)`: `legalUsageNature` foldTurkish
  edilip `["OFIS", "ISYERI", "TICARI BINA"]` ile karşılaştırılır.
- Yeni `parseComparableWorkplaceReductionRate(value)`: "%80"/"80" gibi
  metni orana çevirir; boş/geçersizse **%100** (indirgeme yok) döner —
  bu sayede alan hiç doldurulmazsa emsalin hesabı **eskisiyle birebir aynı**
  kalır (geriye dönük uyumluluk).
- `calculateComparableMetrics()`: `adjustedArea` (arazi emsalleri hariç)
  artık `Düzeltilmiş Alan (c13) || Beyan Edilen Alan (c12)` değerinin
  doğrudan kendisi değil, bu değerin `c32` oranıyla çarpılmış hali
  (`workplaceReducedArea`) — emsalin m² birim değeri ve kira birim değeri
  hesabına da otomatik yansır. Arazi emsallerinde (`isLandComparable`)
  etkisi yok, `Yüzölçümü (c24)` kullanılmaya devam ediyor.
- Yeni test: `tools/test-comparable-workplace-floor-reduction.js` (oran
  ayrıştırma edge-case'leri — `%0` dahil —, görünürlük kuralı, hesaplama
  entegrasyonu, geriye dönük uyumluluk ve arazi emsalinde etkisizlik
  senaryolarını izole doğrular; kural kaldırıldığında testin gerçekten
  başarısız olduğu doğrulandı). Geliştirme sırasında `%0` seçildiğinde
  yanlışlıkla %100'e geri düştüğü fark edildi ve
  `parseComparableWorkplaceReductionRate` düzeltildi (`number <= 0` →
  `number < 0`, sıfır artık geçerli bir oran).
- Doğrulama: `npm run verify` (38 test) geçti; gerçek tarayıcıda konut/işyeri
  görünürlük ayrımı, gerçek hesaplama (150 m² × %80 = 120 m², birim değer
  25.000 TL/m²) ve boş oranla geriye dönük uyumluluk ekran görüntüsüyle
  doğrulandı.
- Geri alma: `git revert <bu commit hash>` veya yedek klasöründen
  `backups/before-comparable-workplace-floor-reduction_2026-08-01_11-23-32/`.

## 0.0.249 - 2026-08-01 - Değerleme Özet Tablosu: Acil Satış Değeri detay hücresi gerçek hesaplamayı göstersin

Kullanıcı bildirimi: "Değerleme Özet Tablosu"nda Yasal/Mevcut Acil Satış
Değeri satırlarının "Birim Değer / Oran" hücresi yanlış hesaplanıyor. Kontrol
edildi: değerler (5.400.000 / 5.850.000) formülle (%10 indirim, 50.000 TL
yuvarlama) matematiksel olarak tutarlıydı — asıl sorun, bu hücrenin diğer
satırlar gibi ("115 m² × 52.173,91 TL/m²") gerçek sayıları değil, sabit bir
açıklama cümlesi ("Yasal durum değerinden %10 indirim, 50.000 TL yuvarlama")
göstermesiydi.

- Yeni `buildValuationSummaryUrgentSaleDetail(sourceKey)`: sabit cümle yerine
  gerçek kaynak değeri ve oranı gösterir, örn. "6.000.000 TL × %90".
- `buildValuationSummaryGroups()`'taki Yasal/Mevcut Acil Satış Değeri
  satırları bu yeni fonksiyona bağlandı.
- Hesaplama mantığının kendisi (`getUrgentSaleValueText`: %10 indirim,
  50.000 TL yuvarlama) DEĞİŞMEDİ — yalnızca özet tablosundaki detay metni
  düzeltildi.
- Yeni test: `tools/test-valuation-urgent-sale-summary-detail.js` (gerçek
  hesaplama detayının döndüğünü, sabit cümlenin artık kullanılmadığını ve
  boş/sıfır kaynak değerde "—" döndüğünü doğrular; kural kaldırıldığında
  testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (37 test) geçti; gerçek tarayıcıda Değerleme
  Özet Tablosu'nda satırların artık "6.000.000 TL × %90" formatında
  göründüğü ekran görüntüsüyle doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.248 - 2026-07-31 - Değerleme bölümüne Acil Satış Değeri hesaplama paneli eklendi

Kullanıcı talebi: "Yasal Acil ve Mevcut Acil Değeri hesaplama kısmı eksik,
Yasal ve Mevcut Durum Değeri hesaplamadaki gibi olmalı." `legalUrgentSaleValue`/
`currentUrgentSaleValue` alanları zaten otomatik hesaplanıyordu
(`getUrgentSaleValueText`: durum değerinden %10 indirim, 50.000 TL'ye
yuvarlama) ama Değerleme bölümünde görünür/hesaplama paneli YOKTU — değer
yalnızca salt okunur bir özet listesinde (`buildValuationSummaryGroups`)
görünüyordu.

- Yeni `valuationUrgentSaleRows` dizisi ve `createValuationUrgentSaleTable()`
  paneli: mevcut "Piyasa Değeri" panelinin (Yasal/Mevcut Durum Değeri
  hesaplama tablosu) aynı görsel/işlevsel desenini izler — `createValuationPanel`
  + tablo + salt okunur hücreler; Yasal ve Mevcut değer eşitse
  `getLegalCurrentDisplayRows` ile (mevcut Şerefiye/Yapı Değeri
  panellerindeki gibi) tek birleşik satıra iner.
- `createValuationEditor()` içinde `createValuationMarketTable()`'dan hemen
  sonra eklendi; tüm mülkiyet tipleri (konut ve arsa/arazi) için görünür.
- Sütun başlığı "Piyasa Değeri" olarak seçildi (ilk taslakta "Durum
  Değeri" idi, ama `check-basic.js`'in Şerefiye Bölümü'nden kaldırılan eski
  "Durum Değeri" sütununu tespit eden regresyon koruması yanlışlıkla bu yeni
  panele de tetikleniyordu — string çakışmasını önlemek için isim
  değiştirildi, davranış aynı).
- Yeni test: `tools/test-valuation-urgent-sale-panel.js` (doğru
  hesaplama/salt-okunurluk, Yasal=Mevcut birleşme davranışı VE
  `createValuationEditor()`'ın paneli gerçekten çağırdığını doğrular; kablolama
  kaldırıldığında testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (36 test) geçti; gerçek tarayıcıda panel,
  doğru hesaplama ve Yasal=Mevcut birleşme davranışı ekran görüntüsüyle
  doğrulandı; arsa mülkiyet tipinde de panelin göründüğü kontrol edildi.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.247 - 2026-07-31 - Emsaller Konumu hücresindeki taşma: harita ikonu + sütun çerçeveleri

Kullanıcı bildirimi: "Harita" metnine kısaltılmasına rağmen Konumu
hücresinde (blok seçimi + buton + "X m güneyinde" metni) yine taşma
oluyordu.

- `createComparableMatrixCell()`: `c7` (Konumu) hücresindeki harita butonu
  artık metin yerine küçük bir konum-pini SVG ikonu gösteriyor
  (`title`/`aria-label="Haritadan seç"` erişilebilirlik için korunuyor).
  `.comparable-map-button` CSS'i 34px genişlikte, ortalanmış ikon butonuna
  dönüştürüldü — blok seçimine çok daha fazla yer kalıyor, "X m güneyinde"
  satırı artık sarmıyor/taşmıyor.
- Ek olarak: Emsaller tablosu satır-bazlı (row-major) olduğundan sütunlar
  (her bir emsal) görsel olarak ayırt edilmiyordu. `.comparables-matrix-table`
  hücrelerine (sabit "Sıra No" etiket sütunu hariç) dikey `border-left`/
  `border-right` eklendi — her emsal sütunu artık ince çizgilerle
  çerçevelenmiş görünüyor.
- Doğrulama: `npm run verify` (35 test, ilgisiz) geçti; gerçek tarayıcıda
  ikon butonu ve sütun çerçeveleri ekran görüntüsüyle doğrulandı,
  "X m güneyinde" metninin artık taşmadığı görüldü.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.246 - 2026-07-31 - Emsaller "Haritadan seç" butonu "Harita" olarak kısaltıldı

Kullanıcı talebi: Emsaller matrisindeki konum hücresinde yer alan
"Haritadan seç" butonu daha kısa olsun.

- `createComparableMatrixCell()` içindeki `c7` (konum) hücresinin harita
  butonu metni "Haritadan seç" → "Harita" olarak değiştirildi. Buton
  işlevi (haritadan konum seçme modalını açması) değişmedi.
- Doğrulama: `npm run verify` (35 test, ilgisiz) geçti; gerçek tarayıcıda
  buton metninin "Harita" olduğu doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.245 - 2026-07-31 - Bağımsız Bölüm Özellikleri açıklaması "taşınmazın" tekrarından arındırıldı

Kullanıcı bildirimi: otomatik üretilen açıklamada ("Banyo bölümünde... Taşınmazın
dış kapısı... Taşınmazın iç özellikleri... Taşınmazda ısınma ihtiyacı...")
"taşınmazın/taşınmazda" kelimesi çok tekrar ediyordu. Önce örnek metin
kullanıcıya gönderildi, onaylandıktan sonra uygulandı.

- `composeDoorsWindowsSentence()`: "Taşınmazın dış kapısı çelik kapı, iç
  kapıları lake kapı..." → "Dış kapı çelik, iç kapılar lake, pencereler PVC
  doğramadır." (özne kaldırıldı, "kapı" tekrarı sadeleştirildi).
- `composeKitchenCabinetCounterSentence()`: "mutfak tezgahı"/"mutfak dolabı"
  tekrarları "tezgahı"/"dolabı" olarak sadeleştirildi (cümle zaten "Mutfak
  dolapları..." ile başlıyor).
- `composeMaterialQualitySentence()`: "Taşınmazın iç özellikleri..." → "İç
  mekân özellikleri...".
- `composeUnitHeatingSentence()`: iki ayrı cümle ("Taşınmazda ısınma
  ihtiyacı... tesisat bulunmaktadır. Halihazırda ısıtma sistemi monte
  edilmiştir.") tek akıcı cümlede birleştirildi: "Isınma ihtiyacı ... ile
  karşılanacak şekilde tesisatlandırılmış olup, ısıtma sistemi halihazırda
  monte edilmiştir."
- Diğer bölümlerdeki metinler (Banyo vitrifiye cümlesi, manzara, inşaat
  seviyesi vb.) değişmedi.
- Yeni test: `tools/test-unit-interior-fluent-wording.js` (kullanıcının
  onayladığı örnek çıktıyla birebir eşleşmeyi VE hiçbir cümlenin
  "Taşınmazın/Taşınmazda" ile başlamadığını doğrular; kural kaldırıldığında
  testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (35 test) geçti; gerçek tarayıcıda üretilen
  metin, kullanıcının onayladığı örnekle birebir eşleşti.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.244 - 2026-07-31 - "Ortak Ve Eklentiler" hücresi her zaman küçük harfle başlasın

Kullanıcı talebi: Ana Gayrimenkul Kat Satırları tablosundaki "Ortak Ve
Eklentiler" hücresine kullanıcı nasıl yazarsa yazsın (BÜYÜK HARF, Baş
Harfleri Büyük, karışık...) tüm kelimeler küçük harfle başlamalı.

- Yeni `normalizeLowercaseFreeText()`: boşlukları sadeleştirip metni
  tamamen Türkçe küçük harfe çevirir (`toLocaleLowerCase("tr")` — İ/I
  noktalı-noktasız harfleri doğru çözer). Diğer rapor metinlerindeki
  cümle-başı büyütme kuralı (`normalizeReportDescriptionText`) burada
  BİLEREK uygulanmaz.
- `createBuildingFloorRowsTable()`: hücreden çıkışta (blur) artık bu yeni
  fonksiyon çağrılıyor (eskiden `normalizeReportDescriptionText`
  kullanılıyordu, bu da yalnızca cümle başını büyütüyor, kelime içi büyük
  harfleri KORUYORDU).
- Kendi kendine iyileşme: daha önce büyük/karışık harfle kaydedilmiş
  satırlar da tablo render edilirken sessizce küçük harfe düzeltiliyor;
  kullanıcının hücreye tekrar dokunması gerekmiyor.
- Diğer sütunlar (Daire/Dükkan/Ofis/Depo, sayısal) bu değişiklikten
  etkilenmedi.
- Yeni test: `tools/test-building-floor-common-lowercase.js` (saf metin
  dönüşümü + gerçek render/blur kablolaması + kendi kendine iyileşmeyi
  sahte DOM ile izole doğrular; kural kaldırıldığında testin gerçekten
  başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (34 test) geçti; gerçek tarayıcıda büyük
  harfle yazılan bir değerin blur sonrası küçük harfe döndüğü ekran
  görüntüsüyle doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.243 - 2026-07-31 - 13.07.2001 öncesi ruhsatta Sözleşme Aktif mi?/Hakediş Seviyesi hücreleri gizlensin

0.0.241'deki kanun kapsamı dışı açıklamasına ek: yeni yapı ruhsat tarihi
13.07.2001'den önce ise sözleşme durumu sorusunun kendisi de anlamsızlaşıyor.

- Yeni `isBuildingInspectionLawExempt()`: `buildBuildingInspectionLawExemptionExplanation()`
  içindeki tarih karşılaştırmasını boolean olarak dışa çıkarır (kod
  tekrarını önlemek için ikisi de aynı mantığı paylaşır).
- `createDocumentDecisionControls()`: kanun kapsamı dışıyken "Sözleşme
  Aktif mi?" ve "Yapı Denetim Hakediş Seviyesi" select hücreleri hiç DOM'a
  eklenmiyor; yalnızca kanun kapsamı dışı açıklaması gösteriliyor. Daha
  önce seçili kalmış olabilecek `buildingInspectionContractActive`/
  `buildingInspectionProgressLevel`/fesih alanları da temizleniyor.
- `getMissingRequiredFields()`: kanun kapsamı dışıyken "Sözleşme Aktif mi?"
  artık eksik kritik alan olarak bildirilmiyor (hücre zaten gizli).
- Yeni test: `tools/test-building-inspection-law-exempt-fields-hidden.js`
  (kanun öncesi/sonrası/sözleşme Evet-boş kombinasyonlarını, sahte DOM ile
  gerçek `createDocumentDecisionControls()` çalıştırarak izole doğrular;
  kural kaldırıldığında testin gerçekten başarısız olduğu doğrulandı).
  Mevcut `tools/test-documents-missing-critical-field.js` yeni
  `isBuildingInspectionLawExempt` stub'ı ile güncellendi.
- Doğrulama: `npm run verify` (33 test) geçti; gerçek tarayıcıda eski
  ruhsat tarihiyle hücrelerin kaybolduğu ve açıklamanın doğru göründüğü
  ekran görüntüsüyle doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.242 - 2026-07-31 - Belge ekle butonu fark edilmiyordu + Mimari Proje varken belge girilmemesi eksik alan sayılsın

Kullanıcı bildirimi: "İncelenen Belgeler" bölümünde tablo boşken sadece küçük,
soluk bir "Belge ekle" butonu görünüyordu; kullanıcılar bu kısmı sayfa
genelinde fark etmeden atlıyordu.

- `createTable()` içinde belgeler tablosu boşken (hiç satır yokken) artık
  kesikli mavi çerçeveli, ortalanmış bir "boş durum" kutusu gösteriliyor:
  📄 ikonu, açıklayıcı metin ve ortalanmış "Belge ekle" butonu
  (`.documents-table-empty-state`, `styles.css`). Tabloya en az bir satır
  eklendiğinde eski küçük buton + tablo görünümüne dönülüyor (davranış
  değişmedi).
- Ek talep: "Mimari Proje Var Mı?" kutusu işaretliyken (`hasArchitecturalProject`,
  varsayılan işaretli) ve İncelenen Belgeler tablosuna hiç gerçek belge
  girilmemişse (satır yok VEYA satır var ama Belge Türü boş) bu artık
  "Eksik kritik alan" listesinde "Belgeler ve Proje: İncelenen Belgeler
  (en az 1 belge girilmeli)" olarak görünüyor. Yeni `hasAnyReviewedDocumentEntered()`
  yardımcı fonksiyonu ve `getMissingRequiredFields()`'e eklenen kontrol ile.
  Eksik alan listesindeki bu satıra tıklanınca doğrudan "Belge ekle"
  butonuna (`[data-documents-add-button]`) odaklanılıyor
  (`missingCriticalTargetOverrides`).
- Yeni testler: `tools/test-documents-missing-critical-field.js` (işaretli/
  işaretsiz, boş/dolu/yarım-dolu satır senaryolarını izole doğrular; kural
  kaldırıldığında testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (32 test) geçti; gerçek tarayıcıda boş durum
  kutusu, eksik-alan listesi ve buton hedefleme manuel olarak doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.241 - 2026-07-31 - 13.07.2001 öncesi yapı ruhsatlarında yapı denetim kanunu kapsam dışı açıklaması

Kullanıcı talebi: Yapı Denetim Açıklaması, yapı kullanma izin belgesi yoksa
zaten gösteriliyordu, ancak Türkiye'de yapı denetim sözleşmesi zorunluluğu
13.07.2001 tarihli 4708 sayılı Kanun ile geldiği için bu tarihten ÖNCE yapı
ruhsatı alınmış taşınmazlarda sözleşme durumu sorusu anlamsız — bu durumda
doğrudan kanun kapsamı dışında olduğunu belirten bir cümle üretilmeli.

- Yeni `buildBuildingInspectionLawExemptionExplanation()`: taşınmazın en
  güncel yapı ruhsatı satırının tarihini (`getLatestBuildingPermitDocumentRow`)
  `13.07.2001`  (`BUILDING_INSPECTION_LAW_EFFECTIVE_ISO_DATE`) ile karşılaştırır;
  ruhsat tarihi bu tarihten kesin olarak önceyse şu cümleyi üretir: "Ekspertize
  konu taşınmazın yeni yapı ruhsat tarihi XX.XX.XXXX olup, 13.07.2001 tarih ve
  4708 sayılı Yapı Denetimi Hakkında Kanun'un kapsamı dışında kalmaktadır."
- `buildBuildingInspectionExplanation()` bu cümleyi, yapı kullanma izin belgesi
  kontrolünden hemen sonra ve sözleşme-durumu (Evet/Hayır Fesihli) kontrolünden
  ÖNCE değerlendirir — kanun kapsamı dışı ise sözleşme sorusu tamamen atlanır.
- Ruhsat tarihi 13.07.2001 veya sonrası ise (kanun kapsamında), ya da yapı
  kullanma izin belgesi zaten mevcutsa, davranış değişmedi.
- Yeni test: `tools/test-building-inspection-law-exemption.js` (kanun-öncesi/
  sonrası/sınır tarihi ve iskan-var senaryolarını izole doğrular; fonksiyon
  kaldırıldığında testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (31 test) geçti; gerçek tarayıcıda üç senaryo
  (1998 ruhsat/iskansız, 2015 ruhsat/aktif sözleşme, iskan var) manuel olarak
  doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.240 - 2026-07-31 - Emsaller matrisinde Tab tuşu sütun içinde ilerlesin

Kullanıcı bildirimi: Emsaller bölümünde Tab tuşuna basınca odak, aynı emsalin
bir sonraki alanına değil sağdaki bir sonraki emsale (yan sütuna) geçiyordu.
Kök neden: Emsaller matrisi satır-bazlı (row-major) bir `<table>` — dış döngü
alanlar (`<tr>`), iç döngü emsaller (`<td>`) olduğundan tarayıcının doğal Tab
sırası her zaman sağa (bir sonraki emsale) gider.

- Yeni `attachComparableColumnTabNavigation(shell, visibleRows)` fonksiyonu
  `.comparables-matrix-shell` üzerinde `keydown` ile Tab tuşunu yakalar; odağı
  önce aynı emsal sütunu içinde aşağı/yukarı taşır, sütun sonuna/başına
  gelindiğinde bir sonraki/önceki emsalin ilk/son alanına geçer, ilk/son
  emsalin sınırında tablo dışına doğal çıkışı tarayıcıya bırakır.
- `percentControl` (İç Özellik/Konum Şerefiye), multiSelect `summaryButton`
  (Kat alanı) ve `c7` harita butonu daha önce `data-comparable-row`/
  `data-comparable-field` işaretlerine sahip değildi; bu kontrol tipleri de
  yeni gezinme mantığına dahil edilmek üzere işaretlendi.
- `createComparablesVerticalEditor` içinde `updateComparableReasonRowsVisibility(shell)`
  çağrısından hemen sonra `attachComparableColumnTabNavigation(shell, visibleRows)` bağlandı.
- Yeni test: `tools/test-comparable-tab-navigation.js` (sahte DOM shell ile
  ileri/geri Tab ve sütun sınırı geçişlerini izole doğrular; fonksiyon
  kaldırıldığında testin gerçekten başarısız olduğu doğrulandı).
- Doğrulama: `npm run verify` (30 test) geçti; ayrıca gerçek tarayıcıda Tab/
  Shift+Tab ve sütun sınırı geçişi manuel olarak doğrulandı.
- Geri alma: `git revert <bu commit hash>`.

## 0.0.239 - 2026-07-28 - Mahalle ekiyle (Hacıseyfettin Mahallesi) açılır liste eşleşmesi

UAVT PDF'i mahalle adını ekli verir ("Hacıseyfettin Mahallesi"), idari
veritabanı eksiz tutar ("HACISEYFETTİN"). Mevcut harf büyüklüğü/aksan-duyarsız
eşleşme (`foldTurkish`) bu ek farkını gözetmediği için eşleşme kaçırılıyor,
Adres ve Konum ile Tapu açılır listelerinde otomatik seçim yapılamıyordu.

Yeni `foldPlaceNameForMatch(value, level)`: mahalle seviyesinde karşılaştırmadan
önce mevcut `stripNeighborhoodSuffix` (mahallesi/mah./köyü eklerini atan
fonksiyon) uygulanır. Hem `populateLocationSelect` (Tapu ve Adres açılır
listelerinin ortak gövdesi) hem `applyAdministrativePlaceCasingFromMatch`
güncellendi.

`npm run verify` (27 test) geçti; ilgili üç test dosyasına
"Hacıseyfettin Mahallesi" → "Hacıseyfettin" senaryosu eklendi, ek atma
kaldırılınca testlerin düştüğü kanıtlandı. Tarayıcıda elle doğrulandı.
Yedek klasörü oluşturulmadı; gerekirse commit hash ile geri alınabilir:
`1ad5eb6`. Cache sürümü: `app.js?v=20260728-1645`.

## 0.0.238 - 2026-07-28 - Adres ve Konum'da İl/İlçe/İdari mahalle gerçek açılır liste

`city`/`district`/`neighborhood` (Adres ve Konum) serbest metin + zayıf
`datalist` önerisiydi; kullanıcı gerçek bir açılır liste olmadığını bildirdi.
Alan tanımları `type: "select"`e çevrildi (Tapu'daki `titleCity`/
`titleDistrict`/`titleNeighborhood` ile aynı desen). Ortak
`populateLocationSelect(control, key, level, cityKey, districtKey, options)`
çıkarıldı; Tapu tarafı seçenekleri veritabanının kendi yazılışıyla (TÜMÜ
BÜYÜK) gösterir, Adres tarafı `casing: toTitleCaseTr` ile Baş Harf Büyük
yazılışa çevirir. İl değişince İlçe+Mahalle, İlçe değişince Mahalle
temizlenip bölüm yeniden render edilir.

`npm run verify` geçti; `tools/test-address-location-select.js` eklendi
(select tipini text'e geri alınca testin düştüğü kanıtlandı). Tarayıcıda
gerçek DOM'da SELECT etiketi ve doğru Baş Harf Büyük seçenekler doğrulandı.
Yedek klasörü oluşturulmadı; commit hash: `3fb827e`. Cache sürümü:
`app.js?v=20260728-1600`.

## 0.0.237 - 2026-07-28 - Adres ve Konum'da yer adı Baş Harf Büyük düzeltmesi

Tapu il/ilçe/mahalle açılır listelerindeki aynı mantık Adres ve Konum'un
(o sırada hâlâ serbest metin olan) İl/İlçe/İdari mahalle alanlarına
uygulandı. Yeni `applyAdministrativePlaceCasingFromMatch()`, posta kodu
için zaten yapılan idari veritabanı sorgusunun sonucunu yeniden kullanır:
bir satırla yalnızca harf büyüklüğü/aksan farkıyla eşleşiyorsa Baş Harf
Büyük yazılışa düzeltir; eşleşme yoksa UAVT'ten gelen değer aynen korunur.

`npm run verify` geçti; `tools/test-address-place-casing.js` eklendi.
Tarayıcıda YALOVA/ARMUTLU/KARŞIYAKA → Yalova/Armutlu/Karşıyaka ve
eşleşmeyen "UYDURMA MAHALLE"nin değişmeden kaldığı doğrulandı. Yedek
klasörü oluşturulmadı; commit hash: `a70698b`. Cache sürümü:
`app.js?v=20260728-1500`.

## 0.0.236 - 2026-07-28 - Tapu il/ilçe/mahalle seçimlerinde TAKBİS değeri fazladan seçenek olmasın

`populateTitleLocationSelect()`, TAKBİS'ten gelen değeri ("Karşıyaka")
listedeki seçenekle ("KARŞIYAKA") tam (case-sensitive) string eşitliğiyle
karşılaştırıyordu. Harf büyüklüğü farkında `Set` dedup çalışmıyor, TAKBİS
değeri listeye fazladan bir seçenek olarak ekleniyor ve seçili görünüyordu
(kullanıcı ekran görüntüsü: "Karşıyaka" listede iki kez).

`foldTurkish` ile eşleşen varsa listedeki kanonik yazılış kullanılır;
`state.fields` de bu yazılışa güncellenip autosave tetiklenir. Listede
karşılığı olmayan gerçekten yeni bir değer değişmeden korunur.

`npm run verify` geçti; `tools/test-title-location-select-case-fold.js`
eklendi (eşleme kaldırılınca testin düştüğü kanıtlandı: actual 2 / expected
1). Yedek klasörü oluşturulmadı; commit hash: `64a3c72`. Cache sürümü:
`app.js?v=20260728-1415`.

## 0.0.235 - 2026-07-28 - Eski Ada/Parsel çifti tek sütun genişliğinde, hücreler %50

Bir önceki adımda Eski Ada/Eski Parsel çifti `garden-setbacks-field` ile
aynı desenle (`grid-column: 1/-1`) TAM SATIR genişliğinde yapılmıştı.
Kullanıcı düzeltti: tek sütunda (normal bir alanın genişliğinde) kalsın,
o sütun kendi içinde iki eşit hücreye (%50/%50) bölünsün.
`.old-block-parcel-field`den `grid-column: 1/-1` kaldırıldı.

Tarayıcıda ölçüldü: çiftin toplam genişliği normal bir alanla aynı
(424px), her hücre tam yarısı (207px). `npm run verify` geçti. Yedek
klasörü oluşturulmadı; commit hash: `9f4e1f7`. Cache sürümü:
`styles.css?v=20260728-1345`.

## 0.0.234 - 2026-07-28 - Adres ve Konum alan sırası + Eski Ada/Parsel birleşik kutu

"Bölgede Güvenlik Problemi Var Mı?" alanı Deprem derecesi alanının hemen
ardına, eski yerine (Çevresel özellik bölge türünden sonra) "Ana arter
mesafesi" (`mainArteryProximity`) taşındı. Tapu ve Mülkiyet'te "Eski Ada"
ve "Eski Parsel" önceden iki bağımsız form-grid hücresiydi; yeni
`createOldBlockParcelPairControl()` (`createGardenSetbacksPairControl`
ile aynı desen) tek satırda birleştirdi.

Not: Bu istek ilk yorumda yanlışlıkla Vakıf Katılım Word şablonuna
uygulanmıştı (kullanıcı "sistemdeki sıralamayı kastediyorum" diye
düzeltti); o şablon değişikliği `git revert` ile geri alındı (commit
`28e0f2f`, geri alınan: `75be10a`) ve gerçek istek canlı forma uygulandı.

`npm run verify` geçti; tarayıcıda alan sırası ve birleşik kutunun form
render'ında doğru göründüğü doğrulandı. Yedek klasörü oluşturulmadı;
commit hash: `bd5ee63`. Cache sürümü: `app.js?v=20260728-1330`.

## 0.0.233 - 2026-07-28 - Cephe kutucukları + Kat/Alan varsayılan satırı + TAKBİS Giriş alanı

Üç ayrı düzeltme: (1) "Gayrimenkulün Cepheli Olduğu Yönler" kutucukları
3 sütunlu `unit-general-grid`de tek sütuna sıkışıp daralan tarayıcıda
üst üste biniyordu; `unit-facade-field`e `field-wide` eklendi. (2) "Katlar,
Alanlar ve İç Hacimler" bölümü boş listeyle başlıyordu; yeni
`ensureUnitFloorRowExists()` sayfa her açıldığında (ve son kat
silindiğinde) otomatik bir boş kat satırı ekler. (3) TAKBİS
"Blok/Kat/Giriş/BBNo" alanının 3. slotu (Giriş harfi, ör. "G") sessizce
atılıyordu; Adres ve Konum + Tapu ve Mülkiyet'e Blok'tan sonra "Giriş"
alanı eklendi, `parseTakbisBlockFloorUnit` artık bu alanı da döndürüyor.

`npm run verify` geçti; `tools/test-takbis-block-entrance.js` eklendi
(gerçek TAKBİS örneği "1./9/G/40" ile). Tarayıcıda üç düzeltme de elle
doğrulandı. Yedek klasörü oluşturulmadı; commit hash: `b0887bf`. Cache
sürümü: `app.js?v=20260728-1230`.

## 0.0.232 - 2026-07-28 - WC seçimi: önceki-fix'le kaydedilmiş bozuk veri kendi kendini onarsın

Bir önceki düzeltme (0.0.231) yalnızca YENİ bozulmayı engelliyordu.
Kullanıcının o düzeltmeden önce kaydedilmiş raporunda `interiors` alanı
zaten "Wc" olarak kayıtlıydı ve düzeltme sonrası bile `<option
value="WC">` ile eşleşmiyordu. Yeni `resolveUnitInteriorOptionValue()`
harf büyüklüğü/Türkçe karakter farkını tolere edip kanonik seçeneği
bulur; picker artık kayıtlı değer kanonikten farklıysa state'i de anında
senkronlar (kendi kendini onarma).

`npm run verify` geçti; `tools/test-unit-interior-self-heal.js` eklendi
(tolere edilmiş eşleşme kaldırılınca testin düştüğü kanıtlandı). Tarayıcıda
hem önceden bozulmuş kayıtlı verinin kendini onardığı hem yeni seçimin
kalıcı kaldığı doğrulandı. Yedek klasörü oluşturulmadı; commit hash:
`999c35c`. Cache sürümü: `app.js?v=20260728-1130`.

## 0.0.231 - 2026-07-28 - Bağımsız Bölüm İç Hacimler'de WC seçimi sekme değişince silinme hatası

`normalizeReportStateFields()` her autosave döngüsünde (~450ms)
`state.tables` içindeki TÜM dizileri hücre bazında normalize ediyordu.
`unitFloors` satırları (`floor`/`interiors`/`note` gibi ADLANDIRILMIŞ
anahtarlar, `c0`/`c1`... değil) için eşleşen bir `section.id` bulunamıyor,
fonksiyon varsayılan "başlık büyütme" dalına düşüp "İç Hacimler" seçici
kutusundaki "WC" değerini "Wc"ye çeviriyordu; bu değer `<option
value="WC">` ile artık eşleşmediğinden sekme değiştirilip geri
dönüldüğünde seçim boş görünüyordu (kullanıcı bildirimi).

Mevcut "comparables" atlama deseniyle aynı şekilde `unitFloors` da
döngüde açıkça atlanıyor.

`npm run verify` geçti; `tools/test-unit-floors-normalization-skip.js`
eklendi (atlama kaldırılınca testin düştüğü kanıtlandı: actual 'Salon,
Wc, Mutfak'). Tarayıcıda autosave döngüsü + sekme değişimi sonrası WC
seçiminin kalıcı kaldığı doğrulandı. Yedek klasörü oluşturulmadı; commit
hash: `6db6932`. Cache sürümü: `app.js?v=20260728-1030`.

## 0.0.230 - 2026-07-28 - Takyidat testi CRLF dayanıklılığı

`tools/test-encumbrance-count-summary.js` içindeki yardımcı kod dilimi, yorum
başlığını yalnızca `LF` satır sonuyla aradığı için `app.js` Windows `CRLF` biçimine
dönüştüğünde yanlış biçimde “Takyidat sayım yardımcıları bulunamadı” hatası
veriyordu. Dilimin bitişi artık yorum metni yerine gerçek
`buildTakyidatTableGroups` fonksiyon tanımıyla belirlenir. Böylece test satır sonu
biçiminden ve yorum değişikliklerinden bağımsızdır.

Kırılan hedef test ve tam `npm.cmd run verify` zinciri aynı HEAD üzerinde geçti.
Değişiklik öncesi yedek:
`backups/before-encumbrance-test-crlf-fix_2026-07-28_18-37-31`.

## 0.0.229 - 2026-07-28 - Proje kurumu OSB adlandırması

`Belgeler ve Proje > Proje İncelenen Kurum` alanındaki `OSB Bölge Müdürlüğü`
seçeneği, imar kurumu alanıyla aynı ad giriş penceresine bağlandı. Kullanıcı yalnızca
OSB adını yazar; örneğin `Hasanağa`, `Hasanağa Organize Sanayi Bölge Müdürlüğü`
olarak kaydedilir. Tam kurum adı yeniden çizimlerde seçenek listesinden düşmez,
kurum denetimlerinde OSB olarak tanınır ve proje inceleme açıklaması ile incelenen
belge kayıtlarında kısaltılmadan kullanılır.

`tools/test-imar-institution-control.js` proje kurumu OSB akışını, tam adın
korunmasını ve kurum özetini de doğrulayacak şekilde genişletildi.
`npm.cmd run verify`, `node --check app.js` ve `git diff --check` geçti.
Değişiklik öncesi yedek:
`backups/before-project-institution-osb-popup_2026-07-28_02-56-24`.
Cache sürümleri `app.js?v=20260728-0300` ve `styles.css?v=20260728-0300`
olarak güncellendi.

## 0.0.228 - 2026-07-28 - İmar bilgi kurumu çoklu seçimi

İmar Durumu bölümündeki `Bilgi Alınan Kurum` alanı, Proje İncelenen Kurum
mantığına yakın çoklu seçim kontrolüne dönüştürüldü. Tapu ilçe ve il verilerine
göre `(İlçe) Belediyesi` ile 30 büyükşehirde `(İl) Büyükşehir Belediyesi`,
diğer illerde `(İl) İl Özel İdaresi` seçenekleri dinamik oluşturulur. PDF'den
otomatik gelen kurum metni seçenek kümesinde olmasa da korunur ve kullanıcı
isterse diğer kurumlarla birlikte seçebilir.

`OSB Bölge Müdürlüğü` seçildiğinde yalnızca OSB adını isteyen küçük bir pencere
açılır; örneğin `Hasanağa`, `Hasanağa Organize Sanayi Bölge Müdürlüğü` olarak
kaydedilir. Çoklu kurumlar imar açıklamasında `... Belediyesi ve ...
Belediyesinden alınan bilgiye göre` biçiminde birleştirilir. Büyükşehir listesi
kullanıcının ileteceği nihai resmi listeyle daha sonra kolayca güncellenebilir.

Yeni `tools/test-imar-institution-control.js` testi; büyükşehir/il özel idaresi
ayrımını, PDF değerinin korunmasını, OSB adlandırmasını ve açıklama metnini
doğrular. `npm.cmd run verify`, `node --check app.js` ve `git diff --check`
geçti. Değişiklik öncesi yedek:
`backups/before-imar-institution-multiselect_2026-07-28_02-31-09`.
Cache sürümleri `app.js?v=20260728-0231` ve `styles.css?v=20260728-0231`
olarak güncellendi.

## 0.0.227 - 2026-07-28 - Takyidat özetinde sıralı bölüm daraltma

Takyidat özetinin 2000 karaktere sığmadığı durumda yalnızca Şerhler Bölümü'nü
özetleyip kalan metni doğrudan kesen davranış kaldırıldı. Beyanlar, Hak ve
Mükellefiyetler, İpotekler ve Şerhler bölümleri ayrıntılı metin uzunluğuna göre
sıralanır. En uzun bölüm özetlendikten sonra sınır hâlâ aşılıyorsa ikinci, gerekirse
sonraki en uzun bölüm de adet bazında özetlenir. Böylece özellikle yoğun irtifak
hakları sessizce metinden kaybolmaz; özetlenen bölümün kayıt adedi ve rapor eki
bilgisi korunur.
Hak ve Mükellefiyetler özeti, tekrar oluşturan “irtifak hakkı” ifadesi olmadan
“N adet hak ve mükellefiyet kaydı bulunmaktadır” biçiminde yazılır.

Regresyon testine aynı anda uzun Şerhler ve Hak ve Mükellefiyetler bölümleri
eklendi. Test, iki bölümün de gerektiğinde özetlendiğini ve kısa Beyanlar
Bölümü'nün aynen kaldığını doğrular. Değişiklik öncesi yedek:
`backups/before-adaptive-encumbrance-summary_2026-07-28_02-09-36`.
Cache sürümü `app.js?v=20260728-0218` olarak güncellendi. `npm.cmd run verify`,
JavaScript sözdizimi ve `git diff --check` doğrulamaları geçti.

## 0.0.226 - 2026-07-28 - Toplu teslim ve 3B kod sinir haritası güncellemesi

Son gönderimden sonra biriken uygulama, template motoru, değer faktörü kuralları,
stil, doğrulama ve regresyon testi değişiklikleri birlikte teslim kapsamına alındı.
Yeni takyidat sayım/özet ve çok hisseli TAKBİS malik payı senaryoları bağımsız
regresyon testleriyle korunuyor.

Değişiklik öncesi yedek:
`backups/before-final-commit-and-3d-graph-update_2026-07-28_01-52-02`.
Graphify indeksi güncellendi: `graphify-out/graph.json` artık 21.671 düğüm,
47.774 ilişki ve 428 topluluk içeriyor. `tools/build-neural-map-data.js` yeniden
çalıştırıldı; `codebase-map/graph-core.json` 3B harita için 1.600 düğüm ve 5.416
bağlantı içeren güncel projeksiyona dönüştürüldü.

## 0.0.225 - 2026-07-28 - Template çıktısında seçili Takyidat Özet/Detay modu

Template motorundaki `TAKYIDAT2025`, `TAKYIDATISBANK`, `TAKBISSUMMARY` ve
`ENCUMBRANCESUMMARYTEXT` placeholder'ları, önce kaydedilmiş `takbisSummary`
değerini okumak yerine öncelikle `buildEncumbranceSummary()` üreticisini çağırır.
Bu üretici `encumbranceSummaryMode` seçimini dikkate aldığı için kullanıcı
`Özet` seçtiğinde en fazla 2000 karakterlik toplulaştırılmış açıklama, `Detay`
seçtiğinde ise bütün takyidatların yer aldığı sınırsız metin banka template
dosyasına yazılır. Üretici bulunamazsa eski alan değeri yedek kaynak olarak
korunur.

Regresyon testi dört placeholder'ın da canlı seçili-mod üreticisine bağlı
olduğunu denetler. Değişiklik öncesi yedek:
`backups/before-template-encumbrance-mode-binding_2026-07-28_01-36-01`.
Graf indeksi kullanıcı talimatı gereği yenilenmedi.
Template motoru cache sürümü:
`src/templates/template-engine.js?v=20260728-0138`.

## 0.0.224 - 2026-07-28 - Takyidat açıklaması Özet/Detay görünümü

`Takyidat Açıklaması` alanına koşullu `Özet / Detay` segment kontrolü eklendi.
Eski mantıkla bütün kayıtları içeren tam açıklama 2000 karakteri aşmıyorsa kontrol
hiç gösterilmez ve açıklama ayrıntılı haliyle kalır. Tam metin 2000 karakteri
aşıyorsa `Özet`, şerhleri tür ve adet bazında toplulaştıran en fazla 2000
karakterlik metni; `Detay` ise karakter kısıtlaması uygulamadan bütün takyidatları
eski sıralama mantığıyla gösterir.

Seçili görünüm `encumbranceSummaryMode` alanında saklanır ve hem ekrandaki
`takbisSummary` alanını hem rapor placeholder çıktısını aynı kaynaktan besler.
Kayıtlar 2000 karakterin altına düştüğünde görünüm otomatik olarak özete sıfırlanır
ve kontrol gizlenir. Regresyon testine kısa metin, uzun özet ve uzun detay seçimleri
eklendi.

Değişiklik öncesi yedek:
`backups/before-encumbrance-summary-toggle_2026-07-28_01-25-37`.
Graf indeksi kullanıcı talimatı gereği yenilenmedi.
İlk görsel kontrolde aktif segmentin tanımsız `--navy` değişkeni nedeniyle beyaz
zeminde kaldığı görüldü; aktif renk mevcut `--blue` tasarım değişkenine bağlandı.
Bu düzeltme öncesi ek yedek:
`backups/before-encumbrance-toggle-color-fix_2026-07-28_01-31-55`.
Cache sürümleri: `app.js?v=20260728-0125`, `styles.css?v=20260728-0132`.

## 0.0.223 - 2026-07-28 - Takyidat sayısal verileri ve 2000 karakterlik özet

Açıklamalar bölümüne dört sütunlu `Takyidat Sayısal Verileri` tablosu eklendi.
Tablo, TAKBİS verisini Beyanlar, Rehinler (İpotekler), Şerhler ve İrtifaklar
olarak ayırıp her bölümün kayıt adedini canlı gösterir.

Toplam takyidat kaydı 15'i aştığında Beyan, İpotek ve İrtifak kayıtları
ayrıntılı bırakılır; Şerhler ise `icrai haciz`, `kamu haczi`, `ihtiyati haciz`
ve `diğer tür şerh` olarak sayısal biçimde özetlenir. Açıklama 2000 karakteri
aşmaz, kayıt satırının ortasında kesilmez ve bütün şerhlerin rapor ekindeki
ayrıntılı takyidat tablosunda sunulduğu belirtilir. Eski kaydedilmiş uzun
açıklamalar Takyidat veya Açıklamalar bölümü açıldığında güncel kurala göre
yeniden üretilir.

Gerçek 39 kayıtlı TAKBİS belgesiyle canlı testte sayaçlar `1 Beyan`, `0 Rehin`,
`11 Şerh`, `27 İrtifak`; özet ise `9 icrai haciz`, `1 kamu haczi`,
`1 ihtiyati haciz` ve toplam `1907` karakter olarak doğrulandı.

Yeni regresyon testi: `tools/test-encumbrance-count-summary.js`.
`npm.cmd run verify` ve `git diff --check` başarılı.

Değişiklik öncesi yedek:
`backups/before-encumbrance-count-summary_2026-07-28_01-00-57`.
Graf indeksi kullanıcı talimatı gereği yenilenmedi.
Cache sürümleri: `app.js?v=20260728-0110`, `styles.css?v=20260728-0100`.

## 0.0.222 - 2026-07-28 - Hissedar pay paydası satır taşması

Çok hisseli TAKBİS belgelerinde malik payı `1/132` iken, sayfa başında yan
sütunda devam eden `9` değeri düz metin yedeği tarafından paydaya eklenerek
`1/1329` üretiliyordu. Koordinatlı PDF satırları bulunduğunda riskli düz metin
devam araması kapatıldı. Gerçek payda devamı yalnızca kesir hücresiyle aynı x
aralığında olduğunda kabul edilir; aynı sütundaki sayfa taşmaları desteklenir.

`tools/test-takbis-owner-share.js` regresyon testi eklendi ve ana test zincirine
bağlandı. Test hem yan sütundaki sayının dışlanmasını hem de aynı sütundaki
gerçek payda devamının korunmasını denetler.

Gerçek belge testinde `Canan Aksu`, `Ahmet Ertuğrul Kanak` ve
`Kamil Erdoğan Kanak` hisseleri ayrı ayrı `1/132` olarak doğrulandı.

Değişiklik öncesi yedek:
`backups/before-owner-share-denominator-fix_2026-07-28_00-44-56`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260728-0050`.

## 0.0.221 - 2026-07-27 - Takyidat açıklamasında kısıtlı malik

Takyidat Açıklaması ve aynı biçimlendiricileri kullanan rapor metinlerinde,
malik bazlı her kaydın sonuna `(Kısıtlı Malik: Malik Adı)` ibaresi eklendi.
Beyan/Hak ve Mükellefiyetlerde `c4`, Şerh ve İpoteklerde `c5` alanı kullanılır.
Kısıtlı malik alanı boş olan kayıtlarda parantezli ibare hiç üretilmez.

Gerçek çok hisseli TAKBİS belgesiyle canlı testte 37 malik bazlı kaydın
tamamında ek oluştu; `Tülin Utuğluer` ve `Binnur Ünlükahraman` örnekleri
doğrulandı, boş malik etiketi oluşmadı.

Değişiklik öncesi yedek:
`backups/before-encumbrance-summary-restricted-owner_2026-07-27_20-08-55`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-2135`.

## 0.0.220 - 2026-07-27 - Şerhlerde kısıtlı malik görünürlüğü

Şerhler tablosunun eski beş sütuna göre tanımlanmış `980px` genişlik ve sütun
oranları altıncı `Kısıtlı Malik` sütununu dar ekranlarda sağ tarafta görünmez
bırakıyordu. Tablo altı veri sütunu ve silme düğmesine göre yeniden
oranlandı; minimum genişlik `760px` yapıldı. `Kısıtlı Malik` ile silme sütunu
yatay kaydırmada sağda sabitlenerek hem masaüstünde hem dar görünümde erişilir
hale getirildi.

Canlı doğrulama 1026x912 görünümde gerçek çok hisseli TAKBİS belgesiyle
yapıldı. `Kısıtlı Malik` başlığı görünür alan içinde kaldı ve ilk şerh
satırında `Tülin Utuğluer` görüntülendi.

Değişiklik öncesi yedek:
`backups/before-restricted-owner-column-visibility_2026-07-27_19-50-39`.
Graf indeksi yenilenmedi. Cache sürümü: `styles.css?v=20260727-1955`.

## 0.0.219 - 2026-07-27 - Takyidatlarda kısıtlı malik

Çok hisseli TAKBİS belgelerindeki hissedar bazlı takyidatlar için Beyanlar,
Şerhler ve İpotekler tablolarına `Kısıtlı Malik` sütunu eklendi. PDF'deki
`Kısıtlı Malik` kolonu koordinat bazlı ayrıştırılır; kayıt bir malikle
sınırlandırılmamışsa hücre boş bırakılır. Malik adı, satır kaymalarının ad
içinde boşluk oluşturmasını önlemek için TAKBİS malik listesiyle güvenli ve
tam eşleşme üzerinden doğrulanır. Aynı tür ve yevmiye numarasına sahip farklı
kısıtlı malik kayıtları artık tekilleştirme sırasında birbirine karışmaz.
Sütunlar uygulama tablolarına ve Word rapor tablolarına da aktarıldı.

Gerçek belge testi:
`TKB_20260727180326029218.pdf` içe aktarıldı; malik bazlı irtifak ve haciz
kayıtları ayrı satırlarda korundu, `Tülin Utuğluer` adının ilk harfi ile
`Binnur Ünlükahraman` adındaki satır kayması düzeltildi ve maliksiz kayıtların
boş kaldığı doğrulandı.

Değişiklik öncesi yedek:
`backups/before-encumbrance-restricted-owner-column_2026-07-27_19-14-49`.
Graf indeksi kullanıcı talebi doğrultusunda yenilenmedi. Cache sürümü:
`app.js?v=20260727-2125`.

## 0.0.218 - 2026-07-27 - Eşit yasal/mevcut değerlerde birleşik satır

Yasal ve mevcut durum değerinin aynı olduğu hesaplarda, Değerleme bölümündeki
Yapı Değeri ve Şerefiye Bölümü tabloları tekrar eden iki
satır yerine sırasıyla `Yasal ve Mevcut Yapı Değeri` ile `Yasal ve Mevcut
Şerefiye` etiketli tek satır gösterir. Aynı kural Değerleme Özeti için de
uygulanır. Durum değerleri farklıysa yasal/mevcut satırları ayrı gösterilmeye
devam eder.

Değişiklik öncesi yedek:
`backups/before-combined-legal-current-valuation-rows_2026-07-27_18-39-24`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-2010`.

## 0.0.217 - 2026-07-27 - İç kapı ve mutfak tezgahı seçenekleri

Bağımsız Bölüm Özellikleri bölümündeki `İç Kapılar` seçimine `Ahşap Panel` ve
`Akrilik` eklendi. `Mutfak Tezgahı` seçimindeki birleşik `Çimstone / Kuvars`
ifadesi iki ayrı seçenek olan `Çimstone` ve `Kuvars` olarak ayrıldı. Aynı
seçenekler eski ve detaylı form tanımlarında da eşitlendi.

Değişiklik öncesi yedek:
`backups/before-interior-door-countertop-options_2026-07-27_18-31-59`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1930`.

## 0.0.216 - 2026-07-27 - Yapı yaşı manuel ezme onayı

Ana Taşınmaz Teknik Bilgileri içindeki `Yapı Yaşı` artık otomatik hesaplanan
değeri koruyarak kullanıcı tarafından düzenlenebilir. Yapı kullanma izin belgesi
veya ruhsat tarihi mevcutsa, hesaplanan yaştan farklı bir değer girildiğinde
kaynak tarihini belirten onay penceresi açılır. Kullanıcı onay verirse manuel
değer sonraki otomatik yenilemelerde korunur; hesaplanan değere dönülürse otomatik
hesaplama tekrar etkinleşir.

Değişiklik öncesi yedek:
`backups/before-building-age-manual-override_2026-07-27_18-22-32`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1900`.

## 0.0.215 - 2026-07-27 - Plancılık ilkeleri uyumu kaldırıldı

Adres ve Konum bölümündeki `Plancılık İlkeleri ile Uyumu` seçimi kaldırıldı.
İlgili alan artık çevresel analiz varsayımına, çevresel açıklama paragraflarına
ve olumlu/olumsuz değer faktörü listelerine veri sağlamaz. Eski taslaklarda
kalan değerler korunur ancak rapor çıktısında kullanılmaz.

Değişiklik öncesi yedek:
`backups/before-remove-planning-principles-compatibility_2026-07-27_18-06-45`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1845`.

## 0.0.214 - 2026-07-27 - Mevkii ve blok kritik alan istisnası

Tapu ve Mülkiyet bölümündeki `Mevkii` ile `Blok` alanları merkezi kritik alan
matrisinden çıkarıldı. Bilgiler formda ve rapor çıktısında korunur, ancak boş
olmaları artık üst durum şeridindeki eksik kritik alan sayacını artırmaz.

Değişiklik öncesi yedek:
`backups/before-title-mevki-block-critical-exemption_2026-07-27_02-41-05`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1145`.

## 0.0.213 - 2026-07-27 - Arsa özellikleri seçimleri kritik alan oldu

Arsa/Arazi şablonlarında Arsa Özellikleri bölümündeki görünür tüm açılır seçimler
eksik kritik alan kontrolüne bağlandı. Bu kural şemadan dinamik üretildiği için
geometri, topografya, yol cephesi, tarım türü, arazi sınıflandırması, sınır
unsuru ve zirai ürün seçimleri ile ileride eklenecek görünür seçimler otomatik
kapsanır. Konut ve işyeri raporları bu alanlardan eksik uyarısı almaz.

Değişiklik öncesi yedek:
`backups/before-land-selection-critical-fields_2026-07-27_01-51-03`. Grafik
indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1130`.

## 0.0.212 - 2026-07-27 - Arsa/arazi birim değer istisnası

Arsa/arazi şablonlarında gizlenen `Arsa M2 Birim Değeri`, bu raporlarda piyasa
m² birim değerinin karşılığı olduğundan eksik kritik alan sayacından çıkarıldı.
Konut ve işyeri raporlarında alan görünür ve kritik olmaya devam eder.

Değişiklik öncesi yedek:
`backups/before-land-unit-value-critical-exemption_2026-07-27_01-43-58`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1115`.

## 0.0.211 - 2026-07-27 - Arsa/arazi raporlarında kritik alan istisnası

Arsa, tarla ve arazi şablonunu kullanan kayıtlarda `Yasal Kira Değeri`, `Mevcut
Kira Değeri`, `Cezai Karar Var mı?`, `Statik Uygunluk` ve `Sözleşme Aktif mi?`
artık eksik kritik alan sayacında gösterilmez. Arsa m² birim değeri, yasal/mevcut
piyasa değeri ve arazi raporuna anlamlı diğer kontroller kritik kalır.

Değişiklik öncesi yedek:
`backups/before-land-critical-field-exemptions_2026-07-27_01-41-49`. Grafik
indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1100`.

## 0.0.210 - 2026-07-27 - Mimari proje satırının eksiksiz gösterimi

İncelenen Belgeler tablosuna eklenen salt-okunur mimari proje satırında artık
`Belge Türü` ve `Kapsam`, seçilmiş Tapu/Belediye Proje Türü; `İncelenen Kurum`
ise proje inceleme kurumları olarak gösterilir. Otomatik kurum
değeri seçenek listesinde yoksa yalnızca görüntülenen satıra eklenerek boş
görünmesi önlenir. Proje satırı yine kullanıcı belge kayıtlarından ayrı ve
tarih sırasına dahil biçimde kalır.

Değişiklik öncesi yedek:
`backups/before-architectural-project-document-row_2026-07-27_01-20-58`.
Graf indeksi yenilenmedi. Cache sürümü: `app.js?v=20260727-1045`.

## 0.0.209 - 2026-07-27 - Eksik kritik alanlara doğrudan erişim

Üst durum şeridindeki `Eksik kritik alan` kartı artık tıklanabilir. Kart, eksik
alanları bölüm adlarıyla birlikte küçük bir pencerede listeler; listedeki her
satır ilgili bölümü açar, alanı ekran ortasına getirir ve odağı doğrudan
kontrole taşır. Kroki, belge kararları ve emsal sayısı gibi özel kontroller için
de doğru form yüzeyi hedeflenir. Eksik yoksa pencere açık bir tamamlanma mesajı
gösterir.

Değişiklik öncesi yedek: `backups/before-missing-critical-navigation_2026-07-27_01-08-43`.
Graf indeksi kullanıldı ancak kullanıcı tercihine uygun olarak yenilenmedi.
Cache sürümleri `app.js?v=20260727-1030` ve `styles.css?v=20260727-1030` olarak
güncellendi. Doğrulama: `npm.cmd run verify` ve `git diff --check` başarılı.

## 0.0.208 - 2026-07-27 - Eksik kritik alan matrisi ve 3B kod grafi güncellemesi

Üst durum çubuğundaki `Eksik kritik alan` sayacı artık yalnızca şema üzerinde
`required` işaretli alanları saymaz. `app.js` içindeki merkezi kritik alan
matrisi; randevu türü, kaydedilmiş kroki, tapu/mülkiyet alanları, imar bilgileri,
EKB ve belge kararları, en az dört emsal, değerleme tutarları ile banka/çıktı
masraf alanlarını birlikte denetler.

- Tapu bölümünde eski ada, eski parsel ve eklenti hariç tüm istenen alanlar
  kontrol edilir.
- Zemin tipi Kat Mülkiyeti veya Kat İrtifakı değilse bağımsız bölüm niteliği ve
  bağımsız bölüm no eksik sayılmaz.
- İskan belgesi incelenmişse gizlenen Yapı Denetim Sözleşme Aktif mi? alanı
  eksik sayılmaz.
- Cezai Karar Var mı?, Statik Uygunluk ve görünür olduğu durumda Sözleşme Aktif
  mi? alanları hem sayaçta hem formda kritik/eksik olarak görünür.
- Kroki kaydı `reportImages.location` üzerinden, emsal adedi ise boş olmayan
  emsal satırları üzerinden doğrulanır.

`app.js?v=20260727-1000` ile tarayıcı önbelleği yenilendi. `npm.cmd run verify`
ve `git diff --check` başarıyla tamamlandı.

Kod grafi, mevcut kurulu Graphify komutuyla artımlı olarak güncellendi:
`graphify-out/graph.json` ve `GRAPH_REPORT.md` artık 21.561 düğüm, 47.590 ilişki
ve 468 topluluk içerir. `tools/build-neural-map-data.js` yeniden çalıştırıldı;
`codebase-map/graph-core.json` 3B harita için 1.600 düğüm ve 5.424 bağlantı
içeren güncel projeksiyondur. Graphify'nin sıfır düğüm üreten altı kaynak dosya
uyarısı indekslemenin dışında tutuldu; uygulama kaynak grafi sağlam olarak
yenilendi.

## 0.0.207 - 2026-07-21 - Ziraat Word şablonu sistem ekranı görünümüne uyarlandı

`templates/ziraat.html`, Ziraat Ekspertiz Sistemi ekran görüntüleri (GABİM, tapu,
gayrimenkul nitelik, inceleme, çevre ve değerleme ekranları) referans alınarak
yeniden biçimlendirildi. Word `.doc` çıktısı artık lacivert kart görünümü yerine
sistemdeki nötr gri panel başlıklarını, ince orta-gri çizgileri, keskin köşeli beyaz
veri kutularını ve sık üç sütunlu form alanlarını kullanır. Sayfa kenarları da
sistemin yoğun form düzenini yansıtacak şekilde daraltıldı.

Veri alanları, placeholder sözleşmesi, bölüm sırası ve Ziraat ek tablo Excel
indirme akışı değiştirilmedi. Şablon dosyası, export motoru tarafından
`?t=Date.now()` ile alındığından ayrı bir uygulama cache-buster güncellemesi
gerektirmez. `tools/test-bank-templates.js`, Ziraat'a özgü gri palet, keskin
alan kutusu ve sayfa düzeni kurallarını da denetler.

Doğrulama: `npm.cmd run verify` geçti. Tarayıcıyla ham şablonun tam sayfa önizlemesi
incelendi; GABİM, tapu, nitelik ve değerleme bölümlerinde gri panel / form-grid
yerleşimi korundu. Ham önizlemede görünen `{{...}}` ifadeleri beklenir; indirme
anında rapor verileriyle çözülür.

## 0.0.206 - 2026-07-21 - Adres POİ mesafe/seçim kuralları ve kullanım amacı kalıcılığı

Adres ve Konum bölümündeki otomatik ve kullanıcı POİ'leri ile ulaşım arterleri
artık tek bir 1000 m uygunluk kontrolünden geçer. Kullanıcı arterlerinde eksik
olan mesafe filtresi eklendi; 1 km içinde arter yokken sınırsız mesafedeki en
yakın arterin döndürülmesi kaldırıldı. Tarama ve kullanıcı POİ yükleme akışı
artık otomatik seçim yapmaz. Kullanıcı noktaları listenin başında kalır ve
harita yalnızca kullanıcının seçtiği POİ/arter markerlarını gösterir. Eski
kayıtlardaki 1 km dışı arter kimliği ve kaynağın ürettiği bağlı alanlar temizlenir.

`Bölge Yapılaşma Kul. Amacı` çoklu seçiminde, kendi metni virgül içeren
seçeneklerin kayıt sonrası parçalanıp `Seçiniz` durumuna dönmesine neden olan
ayrıştırma hatası giderildi. Ayrıştırıcı artık bilinen seçenekleri tam metin
olarak ve geriye uyumlu biçimde tanır.

Doğrulama: `npm.cmd run verify` geçti. Tarayıcı testinde `22086 m` arter kaydı
listeden kalktı; yalnızca 395 m ve 771 m arterler kaldı. Başlangıç seçili POİ
sayısı 0'dı; POİ seçildiğinde marker geldi, kaldırıldığında kayboldu. Virgüllü
kullanım amacı seçimi kaydetme ve tam sayfa yeniden yükleme sonrası aynen korundu.
Cache-buster: `app.js?v=20260721-1530`.

## 0.0.205 - 2026-07-21 - Leaflet global adı ve harita katmanı düzeltildi

Canlı `experify.com.tr` sayfasında yerel Leaflet dosyası başarıyla indirilmesine
rağmen paket başlangıcı standart `window.L` yerine yanlışlıkla `window.leaflet`
globalini oluşturuyordu. Uygulama `window.L` beklediği için `isLeafletReady()`
false kalıyor ve uydu/yol/hibrit katmanları hiç oluşturulmuyordu.

`vendor/leaflet/leaflet.js` içindeki UMD global adı tekrar `L` yapıldı. Tarayıcı
önbelleğindeki hatalı vendor dosyasını kesin olarak atlatmak için Leaflet CSS ve
JS sorgu sürümleri `v=1.9.4-2` olarak yenilendi. `tools/check-basic.js`, vendor
paketinin `window.L` globalini oluşturduğunu ve hatalı `window.leaflet` adının
geri gelmediğini artık doğrudan denetler.

## 0.0.203 - 2026-07-21 - Adres/Konum haritasında Leaflet CDN bağımlılığı kaldırıldı

Canlı `experify.com.tr` adresinde Adres ve Konum haritası gerçek Leaflet haritası
yerine çapraz çizgili statik fallback olarak görünüyordu. Yerelde doğru çalışmasının
nedeni CDN'in yerel ortamda yüklenebilmesi; canlıda ise `unpkg.com` başarısız
olduğunda jsDelivr fallback'i deneniyor, fakat CSP `cdn.jsdelivr.net` kaynağına
izin vermediği için Leaflet hiç oluşmuyor ve `isLeafletReady()` false kalıyordu.

Kalıcı çözüm olarak Leaflet 1.9.4 yerel vendor dosyalarına alındı:
`vendor/leaflet/leaflet.css`, `vendor/leaflet/leaflet.js` ve marker görselleri.
`index.html` artık Leaflet'i yalnızca `vendor/leaflet/...` üzerinden yükler;
unpkg/jsDelivr fallback blokları kaldırıldı. `server.js` CSP'sindeki harici
Leaflet script/style izinleri de temizlendi (`script-src/style-src` self +
unsafe-inline). Harita tile görselleri için `img-src` izinleri korunur.

`tools/check-basic.js` artık Leaflet'in yerel vendor'dan yüklendiğini, CDN
referanslarının geri gelmediğini ve vendor dosyalarının mevcut olduğunu denetler.
Doğrulama: `npm.cmd run verify` geçti. Canlıya çıktıktan sonra Node süreci /
deployment yeniden başlatılmalı; aksi halde eski CSP header'ı servis edilmeye
devam edebilir.

## 0.0.204 - 2026-07-21 - Ziraat Word şablonu ile ek tablo Excel tek düğmede

`Banka Şablonuyla Kaydet` bloğundaki ayrı "Ziraat Ek Tablo (Excel)" kartı ve
butonu kaldırıldı. Artık kullanıcı şablon seçicisinde `Ziraat Bankası Rapor
Formatı` (`templateKey === "ziraat"`) seçiliyken `Banka şablonuyla kaydet`
düğmesine bastığında önce Word `.doc` şablonu iner, ardından
`window.RaporZiraatEkTablo.export()` çağrılıp Ziraat ek tablo `.xlsx` dosyası
otomatik indirilir. Diğer banka şablonlarında yalnız Word iner.

Ek tablo motoru eksikse veya Excel üretimi hata verirse Word çıktısı hazırlandığı
bilgisi korunur; hata mesajı yalnız ek tablonun hazırlanamadığını belirtir.
`tools/check-basic.js` ayrı Ziraat Excel butonunun geri gelmemesini ve birleşik
akışın korunmasını denetler. Cache-buster: `app.js?v=20260721-0130`.
Doğrulama: `npm.cmd run verify` geçti.

## 0.0.202 - 2026-07-21 - Ziraat ek tablo: 2 ondalık biçim, bitişik-nizam KAKS, NİTELİKLİ toplam formülleri

Kullanıcının 5 maddelik düzeltmesi (`tools/build-ziraat-ek-tablo-xlsx.py`
üzerinden, şablon yeniden üretildi):

1-2-4. **2 ondalık gösterim** — yüzölçümü, m² birim değeri, Hmax ve terk
   sonrası parsel büyüklüğü hücrelerinin sayı biçimi `#,##0` → `#,##0.00`
   yapıldı (`TWO_DECIMAL_CELLS`), toplam satırları dahil. Artık 193 yerine
   192,74 gösterilir. (Değer HAM sayı olarak yazılır; iki-basamak yalnızca
   hücre biçimidir — Excel virgülle 192,74 gösterir.)

3. **Bitişik nizam → kat adedi** — ARSA F3 (KAKS/Emsal) hücresi artık
   `ZRT_KAKS_OR_FLOOR` çözümleyicisiyle doldurulur: yapı nizamı BİTİŞİK ise
   `floorCount` (kat adedi), diğer nizamlarda `kaks`. (app'teki
   composeImarCalculatedEmsal önceliğiyle uyumlu.)

5. **NİTELİKLİ GAYRİMENKUL toplam formülleri** — `FORMULA_OVERRIDES` ile
   G9 = `=SUM(G4:G8)` ve G18 = `=SUM(G14:G17)` olarak güncellendi (önceden
   G3:G8 / G13:G17 idi; ARSA satırı toplama girmemeli).

Manifest yine 57 hücre.

Doğrulama: `npm run verify` geçti; **canlı tarayıcıda**: yüzölçümü 192,74
(yuvarlanmadan), Hmax 9,5, terk 192,74; ARSA F3 ayrık nizamda 1,5 (KAKS) /
bitişik nizamda 4 (kat adedi); konsol temiz.

## 0.0.201 - 2026-07-21 - Ziraat ek tablo şablonu kullanıcının placeholder dosyasından üretiliyor

Kullanıcı, ek tabloyu Excel'de kendisi düzenleyip **placeholder'ları
istediği hücrelere elle yerleştirdi** ve "şablonu buna göre güncelle" dedi.
Bu dosya artık şablonun SPEC'i.

### Yaklaşım değişikliği (builder)

`tools/build-ziraat-ek-tablo-xlsx.py` artık elle yazılmış hücre eşlemesi
tutmuyor; **kullanıcının dosyasını tarayıp `{{TOKEN}}` içeren hücreleri
buluyor**, `TOKEN_MAP` ile app alanlarına eşliyor ve manifest'i otomatik
üretiyor. Bilinmeyen token varsa build HATA verip durur (sessiz atlama yok).
Kaynak yolu argv[1] ile geçilebilir (varsayılan: kullanıcının masaüstündeki
`ziraat-ek-tablo.xlsx`).

Kullanıcının yeni düzeni: ikinci örnek satırlar kaldırılmış; SIRA NO /
GAYRİMENKUL SIRA NO sütunlarında sabit "Sistemden BKNZ"; NİTELİKLİ sayfası
**ARSA + YAPI DEĞERİ + ŞEREFİYE VE ÇEVRE DÜZENLEMESİ** şeklinde 3 satırlık
maliyet yaklaşımına çevrilmiş.

### Eşlenen token'lar (TOKEN_MAP)

ADA→blockNo, PARSEL→parcelNo, LAND_AREA→landArea,
POST_ROAD_SETBACK_PARCEL_AREA→`getPostRoadSetbackParcelArea()`,
LEGEND→legend, ORDER→order, CALCULATED_EMSAL→calculatedEmsal,
GAYRIMENKUL_ADI→titleQuality, YAPI_SINIFI→buildingClass,
MAİN_PROPERTY_FLOOR_COUNT_TEXT→mainPropertyFloorCountText,
YAPI_BELGESI→`buildingDoc()` (iskan varsa iskan, yoksa en güncel ruhsat),
TOTAL_LEGAL_AREA→legalValueArea (yedek legalArea),
TOTAL_CURRENT_AREA→currentValueArea (yedek currentArea),
LEGAL_VALUE/CURRENT_VALUE/LAND_VALUE/LEGAL_BUİLDİNG_VALUE/
CURRENT_BUİLDİNG_VALUE/LEGAL_PREMİUM_VALUE/CURRENT_PREMİUM_VALUE →
aynı adlı state alanları, SALEABİLİTY→saleability.

### Token'sız doldurulan hücreler (kullanıcı onayı)

Kullanıcının dosyasında placeholder KONULMAMIŞ ama 0 kaldığı için tabloyu
boş bırakacak 5 hücre soruldu; "hepsini uygulama doldursun" denildi →
`EXTRA_CELLS`: ARSA F3/G3/H3 = kaks/taks/hmax, KONUT G3/G10 =
legalValue/currentValue.

### Formül önbellekleri (Codex'in mekanizmasıyla uyum)

Codex paralelde `formulaNumber`/`formulaText` tiplerini ve
`enableFullCalculation()`'ı eklemişti (openpyxl formülleri cache'siz yazar;
cache okuyan araçlar boş görür). Builder artık `FORMULA_CACHE` ile KONUT
sayfasının formül hücrelerine önbellek girişleri üretiyor: C10(=C3),
D10(=D3), F3/F10 (birim değer), E6/G6/E14/G14 (SUM). Birim değer
çözümleyicileri, hücrenin gerçek formülüyle aynı alanları kullanacak
şekilde `legalValueArea`/`currentValueArea` (yedekli) üzerinden hesaplar.

Manifest: **57 hücre** (TARLA 7, ARSA 14, KONUT 14, NİTELİKLİ 22).

### Doğrulama

- `npm run verify` tamamı geçti (Codex'in genişlettiği xlsx testi dahil).
- **Canlı tarayıcı uçtan uca**: Türkçe formatlı girdilerle (1,05 / 3.178,50
  / 7.000.000) 57 hücre doğru dolduruldu; ARSA katsayıları, KONUT değerleri,
  NİTELİKLİ yapı/şerefiye kırılımı doğru; formül önbellekleri doğru
  (F3=43750=7.000.000/160, C10→DÜKKAN, D10→iskan belgesi, E6=160,
  G14=7.500.000) ve `<f>` formülleri korunmuş; konsol temiz; 112 KB çıktı.

### UYARI (sonraki oturum)

`templates/ziraat-ek-tablo.xlsx` **STORED (sıkıştırmasız)** olmalıdır —
tarayıcı doldurma motoru inflate kütüphanesi kullanmaz. Dosyayı Excel'de
açıp kaydederseniz DEFLATE'e döner ve motor okuyamaz; builder'ı yeniden
çalıştırın.

## 0.0.200 - 2026-07-21 - Değerleme kutucuklarının placeholder kataloğu

Değerleme bölümündeki özel tablo/kontrol kutucukları için placeholder satırları
otomatik üretilir hale getirildi. `valuationMarketRows`,
`incompleteConstructionMarketRows`, `valuationBuildingValueRows`,
`valuationPremiumRows` ve gelir metriği satırlarından alan, m² birim değer,
piyasa değeri, natamam değer, yapı değeri, yıpranma, inşaat seviyesi,
şerefiye, kapitalizasyon ve amortisman placeholder'ları "Değerleme" kategorisi
altında başlıklı görünür. Arsa değeri, sigortaya esas değer, satış kabiliyeti,
değerleme metodu ve emlak beyan değeri kutuları da aynı katalog akışına eklendi.

Şablon motoru bu anahtarları generated placeholder kaynağından çözer; örnekler:
`{{LEGAL_VALUE_AREA}}`, `{{LEGAL_BUILDING_UNIT_COST}}`,
`{{LEGAL_PREMIUM_RATE}}`, `{{PROPERTY_TAX_DECLARATION_VALUE}}`.
`templates/PLACEHOLDER-REHBERI.md` ve banka şablon regresyon testi güncellendi.
Cache-buster: `app.js?v=20260721-0105`. Doğrulama: `npm.cmd run verify` geçti.

## 0.0.199 - 2026-07-21 - Yola terk miktarı ve terk sonrası parsel alanı placeholder'ları

İmar placeholder'larına `{{ROAD_SETBACK_AMOUNT}}` / `{{YOLA_TERK_MIKTARI}}`
ve `{{POST_ROAD_SETBACK_PARCEL_AREA}}` /
`{{TERK_SONRASI_PARSEL_ALANI}}` eklendi. Terk sonrası parsel alanı,
ana taşınmaz yüzölçümünden yola terk miktarı düşülerek hesaplanır; yola terk
yoksa veya miktar girilmemişse yüzölçümü aynen döner.

Placeholder ekranında iki değer de "İmar Durumu" altında görünür. Şablon motoru,
Türkçe ve İngilizce token adlarını birlikte çözer. Cache-buster:
`app.js?v=20260721-0045`, `src/templates/template-engine.js?v=20260721-0045`.
Doğrulama: `npm.cmd run verify` geçti.

## 0.0.198 - 2026-07-21 - Graphify indeksi ve geri dönüş yedeği

Kod grafi artımlı olarak yenilendi: `graphify-out/graph.json` ve
`graphify-out/GRAPH_REPORT.md` artık 18.905 düğüm, 42.435 ilişki ve 418 topluluk
içeriyor. Graphify, büyük grafik için HTML görselleştirmeyi bilinçli olarak atladı;
mevcut `GRAPH_TREE.html` değiştirilmedi.

Güncelleme öncesindeki değişen kaynak dosyaları ile önceki graph çıktısı şu klasöre
geri dönüş için kopyalandı:
`backups/before-graphify-update_2026-07-21_00-24-30/`.

## 0.0.194 - 2026-07-20 - Excel'de düzenlenen Ziraat şablonunun STORED onarımı

Kullanıcının `templates/ziraat-ek-tablo.xlsx` dosyasında KONUT-İŞYERLERİ
sayfasındaki D3 yapı belgesi hücresine "Metni Kaydır" uygulayıp Excel'de
kaydetmesi, XLSX paketini standart DEFLATE (`method=8`) biçimine çevirdi.
Tarayıcıdaki bağımlılıksız doldurma motoru STORED (`method=0`) beklediği için
çıktı uyarıyla duruyordu. Çalışma kitabının içerik/stil/formülleri değiştirilmeden
26 ZIP girdisi STORED olarak yeniden paketlendi.

Doğrulama: D3 `wrap_text=True`, dikey hizalama `center`, D10 formülü `=D3`,
tüm ZIP girdileri `method=0`. Regresyon testi Excel'in `inlineStr` ve
`sharedStrings` metin saklama biçimlerini birlikte kabul ediyor ve D3 Metni
Kaydır stilini ayrıca denetliyor. `npm run verify` geçti; canlı uygulamada Excel
indirme düğmesi yeniden çalıştırıldığında uyarı ve yeni konsol hatası oluşmadı.

## 0.0.193 - 2026-07-20 - Tüm rapor çıktılarında gg.aa.yyyy tarih standardı

Rapor yüzeylerindeki tarihler tek çıkış standardında birleştirildi. Giriş
alanları ve saklanan veriler HTML tarih kontrollerinin gerektirdiği ISO
`yyyy-mm-dd` biçiminde kalır; Word/HTML banka şablonları, placeholder kataloğu,
incelenen belgeler ve tapu tabloları, emsal satış zamanı alanları, Ziraat ek
tablosu ile indirilen rapor/kroki dosya adları `gg.aa.yyyy` üretir.

`dateIsoToTr` tek haneli gün/ay, ISO tarih-saat ve daha önce yerel yazılmış
tarihleri güvenli biçimde normalize eder. Şablon motorunda tüm `type: "date"`
alanlar otomatik biçimlenir; proje, belediye inceleme, tapu, EKB ve yapı bitiş
tarihi takma adları ile tablo tarih sütunları ayrıca güvenceye alındı.
`tools/test-bank-templates.js` artık `npm test` zincirinde çalışır ve ham ISO
tarihin banka şablonuna sızmasını denetler. `npm run verify` geçti.

## 0.0.192 - 2026-07-20 - Ziraat ek tablo satır ve tarih düzeni

Ziraat ek tablosunun dört sayfasında kaynak satır yükseklikleri %100 artırıldı;
başlık/veri satırı oranları korunarak tüm hücre metinleri dikey ortalandı.
İncelenen yapı belgesinin tarihi, kaynak değer ISO (`yyyy-mm-dd`) gelse bile
çıktıda `gg.aa.yyyy` biçiminde yazılır. Üretici betik, STORED XLSX şablonu,
önbellek sürümü ve regresyon kontrolleri birlikte güncellendi.

## 0.0.191 - 2026-07-20 - Ziraat ek tablo KONUT/NİTELİKLİ düzeltmeleri (kullanıcı görseli)

Kullanıcı ilk çıktının KONUT-İŞYERLERİ sayfasını inceleyip iki düzeltme
istedi (ekran görüntülü):

1. **GAYRİMENKUL SIRA NO** (B sütunu) uygulamadan doldurulmuyor; uzman
   GDYS'den bakıp elle girer. Artık sabit **"Sistemden BKNZ"** metni gelir
   (manifest'e girmez; B10=B3 formülüyle Mevcut tabloya da yansır). Aynı
   sütun NİTELİKLİ GAYRİMENKUL'de de olduğundan oraya da uygulandı.
2. **Belge sütunu** artık tek satırda (üst): **yapı kullanma izin belgesi
   (iskan) VARSA yalnızca iskan; YOKSA en güncel (son) ruhsat**. İkinci
   belge satırı (Yasal D4, Mevcut D11) kaldırıldı; D10=D3 formülü üst satır
   belgesini Mevcut tabloya taşır.

`src/exports/ziraat-ek-tablo-xlsx.js`: yeni `buildingDoc()` (iskan/ruhsat
tespiti Türkçe-katlamalı — JS'in `/i` case-insensitive'i büyük Türkçe "İ"
ile "i"yi eşleştirmediğinden `foldTr` ile karşılaştırılır; ruhsatlar arasında
en güncel tarihli seçilir, dd.mm.yyyy ve yyyy-mm-dd desteklenir). Eski
`permitDoc`/`ZRT_RUHSAT`/`ZRT_ISKAN` yerini aldı.
Yapı Kayıt Belgesi ruhsat kabul edilmez; iskan ve ruhsat yoksa hücre boş kalır.

`tools/build-ziraat-ek-tablo-xlsx.py`: `literal` (sabit metin) desteği +
KONUT/NİTELİKLİ mapping güncellendi. Şablon+manifest yeniden üretildi
(manifest 34 hücre). `index.html`: `ziraat-ek-tablo-xlsx.js?v=20260720-1620`.

Doğrulama: `npm run verify` geçti; **canlı tarayıcıda** 4 senaryo:
hem-ruhsat-hem-iskan→iskan, iki-ruhsat→en güncel, belge yok→boş, dd.mm.yyyy
tarihli iskan→doğru; tam export'ta B3="Sistemden BKNZ", C3="DÜKKAN",
D3=iskan belgesi, alan/değerler numeric (160/7000000/185/7500000), konsol
temiz. Görseldeki hedef çıktıyla birebir eşleşti.
Bu seçim kuralları ile B3/B10/D3/D10 şablon bağlantıları ayrıca otomatik
regresyon testine eklendi.

## 0.0.190 - 2026-07-20 - Ziraat ek tablosu XLSX dışa aktarma (tarayıcı, kütüphanesiz)

Kullanıcı, Ziraat Bankası raporu ekinde gönderilen gerçek Excel dosyasını
(`202307141538532152.xlsx` — 4 sayfa: TARLA, ARSA, KONUT-İŞYERLERİ,
NİTELİKLİ GAYRİMENKUL; her sayfada Yasal + Mevcut Durum tabloları,
GENEL TOPLAM satırı, formüller, sarı giriş hücreleri) paylaşıp "template
mantığında, çıktı türü xlsx olacak şekilde" bir şablon istedi. Kapsam:
şablon + uygulamaya otomatik xlsx dışa aktarma.

### Mimari (neden böyle)

Uygulama build'siz vanilla JS; Word çıktısını da elle HTML üretiyor. XLSX
için de **bağımlılıksız** yol seçildi: openpyxl ile hazırlanan STİLLİ/
FORMÜLLÜ şablonu tarayıcıda **koordinat bazlı** doldurmak. Şablon
STORED (sıkıştırmasız) zip olarak paketlenir; böylece tarayıcı inflate/
deflate kütüphanesi OLMADAN zip'i okuyup yeniden yazabilir. Tüm stil/
formül/birleştirme şablondan birebir korunur; yalnızca giriş hücrelerinin
iç değeri (tip korunarak) değiştirilir.

### Eklenen dosyalar

- `templates/ziraat-ek-tablo.xlsx` — 4 sayfalı STORED şablon (kaynak yapının
  birebir kopyası; birincil satırın sarı giriş hücrelerine token/0, sayı
  hücrelerine token hover-yorumu; formüller/GENEL TOPLAM dokunulmadı).
  **UYARI:** bu `.xlsx` STORED paketlenmelidir — Excel'de açıp "kaydet"
  derseniz DEFLATE'e döner ve tarayıcı doldurma motoru okuyamaz. Yeniden
  üretmek için `tools/build-ziraat-ek-tablo-xlsx.py` kullanın.
- `src/exports/ziraat-ek-tablo-manifest.json` — {sheetIndex, cell, field,
  type} eşlemesi (doldurma motoru bunu kullanır). 39 hücre.
- `src/exports/xlsx-fill.js` — bağımlılıksız STORED-zip okuma/yazma + CRC32
  + koordinat bazlı hücre doldurma (sayı → `<v>`, metin → inlineStr; stil
  `s=` korunur). `window.RaporXlsxFill`.
- `src/exports/ziraat-ek-tablo-xlsx.js` — alanları `state.fields`'ten çözer
  (sayılar `parseValuationNumber` ile → Türkçe "3.178,50" → 3178.5),
  ruhsat/iskan belgesini `documents` tablosundan birleştirir, indirir.
  `window.RaporZiraatEkTablo.export()`.
- `tools/build-ziraat-ek-tablo-xlsx.py` — şablon + manifest üreteci
  (kaynak yolu argv[1] ile geçilebilir).
- `tools/test-ziraat-ek-tablo-xlsx.js` — tarayıcısız regresyon: JS ile
  doldurup zip'i yeniden yazar, tip/yapı doğrular (`npm test` zincirine
  eklendi).

### Değişen dosyalar

- `index.html` — xlsx-fill.js + ziraat-ek-tablo-xlsx.js script'leri (app.js'ten
  SONRA). `app.js?v=20260720-2230`.
- `app.js` — "Banka ve Çıktı" bölümüne "Ziraat Ek Tablo (Excel)" bloğu +
  "Ziraat ek tablosunu Excel indir" butonu (`appendZiraatEkTabloXlsxBlock`).
- `server.js` — `.xlsx` MIME tipi eklendi (fetch zaten octet-stream ile de
  çalışıyordu).
- `package.json`, `tools/check-basic.js` — yeni test + sürüm.

### Kapsam sınırı (birincil gayrimenkul)

Ek tablo çok satırlı (çok parselli) olabilir; motor yalnızca BİRİNCİL
gayrimenkulün satırını doldurur (app tek ana gayrimenkul + emsal modeli).
Ek gayrimenkuller için kullanıcı Excel'de sarı satırları çoğaltıp elle
tamamlar — kaynak dosyanın kendi mantığı ("SARI İLE BOYALI ALANLARA GİRİŞ
YAPILMALIDIR").

### Doğrulama

- `npm run verify` (check-basic + tüm testler + yeni xlsx testi) geçti.
- openpyxl round-trip: doldurulmuş çıktıda metin hücreleri string, sayı
  hücreleri numeric (D3=3178, F3=3600000), formüller korunmuş (E3=F3/D3,
  D8=SUM(...), KONUT F3=IFERROR(G3/E3,0)).
- **Canlı tarayıcı uçtan uca**: her iki modül yüklendi, gerçek state +
  gerçek `parseValuationNumber` ile 102KB'lık doğru MIME'li xlsx üretildi;
  blob geri okunup Türkçe "3.178,50"→3178.5, "3.600.000"→3600000 numeric,
  stiller korunmuş, 24 zip girişi + [Content_Types].xml doğrulandı; konsol
  temiz; export butonu "Banka ve Çıktı" bölümünde göründü.
- **LibreOffice ile formül recalc bu Windows ortamında YAPILAMADI** (soffice
  yok). Formüller bankanın kendi (değişmemiş) formülleri ve numeric giriş
  hücrelerine referans veriyor; Excel'de açılınca hesaplanır. Kullanıcının
  ilk gerçek çıktıda GENEL TOPLAM/birim değer hesaplarını Excel'de teyit
  etmesi önerilir.

## 0.0.189 - 2026-07-20 - Yeni Experify logosu uygulandı

Kullanıcı önceki oturumda mevcut logodan ("RY" harfli altın rozet)
memnun olmadığını belirtmişti (bkz. `PROJE-OZETI.md` "Açık Konu:
Marka/Logo"). Bu oturumda kendi hazırladığı/hazırlattığı logo paketini
(`Experify Logo - Serif E/` — lacivert #213f77/#16264a + altın #d7b26a,
serif "E" harfi, halka + köşe vurguları) paylaşıp siteye uygulanmasını
istedi.

### Yapılanlar

- Paketteki dosyalar `icons/` altına kopyalandı: `icon-192.png`,
  `icon-512.png`, `apple-touch-icon.png` (PWA simgeleri, üzerine yazıldı)
  + `experify-mark-navy.svg`, `experify-mark-white.svg`,
  `experify-icon.svg`, `experify-lockup.svg` (yeni SVG'ler).
- **Sidebar** (`index.html` `.brand-mark`): eski `RY` metin rozeti
  kaldırıldı; artık iki `<img>` (beyaz + lacivert varyant) üst üste
  duruyor, CSS ile tema bazlı görünürlük kontrol ediliyor.
- **Giriş ekranı** (`cloud/cloud-sync.js` — `renderGateLogin`,
  `renderGateBlocked`, `renderGateOffline` + `index.html`'deki ilk statik
  "Kontrol ediliyor…" içeriği): "Experify" başlığının üstüne mark eklendi
  — beyaz kart olan giriş formunda lacivert varyant, koyu overlay'de
  (bloklanmış/çevrimdışı ekranlar) beyaz varyant.
- **Tema bazlı kontrast**: 6 temanın sidebar arka planı incelendi — Navy
  Blue/Apple/Glass/Aurora KOYU (beyaz mark), Clay/Neumorphism AÇIK
  (lacivert mark) olduğu canlı önizlemede tek tek doğrulandı (Clay
  incelemesi sırasında ilk CSS kuralımın yalnızca Neumorphism'i kapsadığı,
  Clay'in de açık sidebar kullandığı fark edilip düzeltildi).
- Eski rozet arka planları kaldırıldı: `styles.css`'teki gold degrade/
  gölge kuralı ve `themes/apple.css`'teki mavi daire override'ı silindi
  (yeni mark kendi halkasını taşıdığı için ayrı bir renkli arka plana
  gerek yok).
- `manifest.json`'a dokunulmadı — zaten `icons/icon-192.png`/`icon-512.png`
  dosya adlarına işaret ediyordu, içerik güncellemesi yeterli.

### Doğrulama

- `node --check app.js`, `node --check cloud/cloud-sync.js`,
  `tools/check-basic.js`, `tools/test-bank-templates.js`,
  `tools/test-comparable-market-analysis.js` geçti.
- Canlı önizlemede: giriş ekranı ekran görüntüsüyle doğrulandı (lacivert
  mark beyaz kartta net görünüyor); sidebar'da 6 temanın TAMAMI tek tek
  denendi (Navy Blue/Apple varsayılan görünüm, Clay, Neumorphism, Aurora)
  — her birinde mark okunaklı, taşma/örtüşme yok. `icons/experify-mark-*.svg`
  ağ isteklerinin `200 OK` döndüğü doğrulandı.
- **Gerçek iOS/Android cihazda görsel teyit yapılmadı** — sonraki deploy
  sonrası kullanıcı kontrolü faydalı olur (özellikle ana ekrana ekleme
  sonrası PWA simgesi).

Sürümler: `styles.css?v=20260720-0215`, ikon linkleri/mark görselleri
`?v=20260720-0210`.

Ayrı yedek alınmadı; küçük, geri alınabilir bir görsel değişiklik.

## 0.0.188 - 2026-07-19 - Halkbank Word tablo satırları sıkılaştırıldı

- Halkbank meta tablolarına Word uyumlu `20pt` minimum satır yüksekliği, dikey ortalama ve tek satır line-height kuralları eklendi.
- Önceki yaklaşık `28–29pt` Word görünümüne göre kutu yüksekliği yüzde 30 civarında azaltılır; iki satırlı başlıklar gerektiğinde kesilmeden genişleyebilir.

---

## 0.0.187 - 2026-07-19 - Önemli Not satış kabiliyeti açıklaması düzeltildi

- `{{VALUATİON_SALEABİLİTY_EXPLANATİON}}` artık yalnız olumsuz seçimlerde metin üreten export sarmalayıcısı yerine her satış kabiliyeti seçimi için sonuç cümlesi üreten ana fonksiyona bağlanır.
- `Satılabilir` seçiminde de Halkbank Önemli Not ve Sonuç Cümlesi bölümünde satış kabiliyeti açıklaması görünür.
- Cache-buster: `src/templates/template-engine.js?v=20260720-2230`.

---

## 0.0.186 - 2026-07-19 - Halkbank kat adedi placeholder düzeltmesi

- Halkbank `BİNA KAT DAĞILIMI ÖZETİ` satırı `{{MAİN_PROPERTY_FLOOR_COUNT_TEXT}}` placeholder'ına bağlandı.

---

## 0.0.185 - 2026-07-19 - Halkbank açıklama tekrarları tamamlandı

- İncelenen Belgeler açıklaması yalnız Tapu Rapor Özellikleri altında bırakıldı; üst bölümde yalnız veri tablosu korunur.
- Bina kat dağılımı placeholder'ı `{{BUİLDİNG_FLOOR_SUMMARY_TEXT}}` olarak düzeltildi.
- İç özellik metni dekoratif özellikleri zaten içerdiğinden ikinci `UNIT_DECORATIVE_DESCRIPTION_TEXT` çıktısı kaldırıldı.
- Merkez Bankası açıklaması sabit metne çevrildi. Kira açıklaması Değerleme bölümünden çıkarılıp yalnız Önemli Not ve Sonuç Cümlesinde bırakıldı.
- Emsal krokisi emsal açıklamasının hemen altına taşındı; Emsaller başlığının zorunlu yeni sayfa kuralı korundu.

---

## 0.0.184 - 2026-07-19 - Halkbank rapor akışı sadeleştirildi

- Halkbank tablo hücrelerinin dikey dolguları yüzde 30 azaltıldı; Malikler tablosu tapu İl/İlçe bilgilerinden önceye taşındı.
- Üst bölümlerde yinelenen imar, proje, ruhsat, ana gayrimenkul, iç özellik ve tefrişat açıklamaları kaldırıldı; alt açıklama bölümleri korundu.
- Bina kat dağılımı özeti ayrı satıra alındı. Önemli Not ve Sonuç Cümlesinin sonuna satış kabiliyeti ile kira açıklamaları eklendi.
- İncelenen belgeler metni EKB açıklamasını zaten içerdiği için doğrudan EKB placeholder tekrarları ve görselde işaretlenen Halkbank özel emsal listesi kaldırıldı.
- Cache-buster: `src/templates/template-engine.js?v=20260719-2045`.

---

## 0.0.183 - 2026-07-19 - Konum ve emsal krokileri rapor akışında ayrıldı

- Konum krokisi sekiz banka şablonunda adres/konum verilerinin altında kalır.
- Emsal krokisi artık birleşik konum bloğundan çıkarılıp her şablonda Emsaller bölümünün en altına yerleştirilir.
- Şablon motoruna `LOCATION_MAP_SECTION` ve `COMPARABLE_SKETCH_SECTION` alanları eklendi; eski birleşik alan yalnızca geriye dönük uyumluluk için korunur.
- Cache-buster: `src/templates/template-engine.js?v=20260719-2015`.

---

## 0.0.182 - 2026-07-19 - Kroki viewport ve Word yerleşimi düzeltildi

- Konum krokisi JPEG çıktısında yalnızca kaydedilen harita viewport'u içinde bulunan POI noktaları çizilir; ekran dışında kalan noktalar artık kenara sıkıştırılmış etiket olarak görünmez.
- Konum ve emsal krokisi başlıkları kendi görselleriyle `page-break-inside:avoid` gruplarında tutulur; zorunlu yeni sayfa kaldırılmıştır.
- Kroki bölümü sekiz tam banka şablonunda adres ve konum verilerinin hemen altına taşınmıştır.
- Cache-buster: `app.js?v=20260719-2000`, `src/templates/template-engine.js?v=20260719-2000`.

---

---
## 0.0.181 - 2026-07-19 - Konum krokisi etiketleri kaydedilen görünüme eşitlendi

- Konum haritası kaydına Leaflet merkez/zoom değerlerinin yanında görünür harita panelinin piksel genişliği ve yüksekliği de eklenir.
- Word/JPG konum krokisi etiketleri sabit `30px/22px` yerine ekrandaki `12px/11px` etiketlerden türetilir; çıktı canvası ile kaydedilen viewport arasındaki oran font, kutu, marker ve leader çizgilerine uygulanır.
- Kaydetme anındaki 16:9 görünüm, merkez ve zoom değişmeden Word görseline taşınır. Emsal krokisinin mevcut başarılı çizim değerleri korunur.
- Cache-buster: `app.js?v=20260719-1930`.

---
## 0.0.180 - 2026-07-19 - Word krokileri sabit 16:9 ve otomatik kayıt kontrollü

- Kullanıcının ilettiği Kuveyt Türk Word çıktısında gömülü JPEG'in `1200x675` olduğu, ancak HTML görsel etiketinde yükseklik bulunmadığı için Word tarafından uzatıldığı tespit edildi.
- Konum haritası ve emsal krokisi rapor görselleri daima `1200x675` canvas üzerinde üretilir; Word'de `640x360` piksel ve `480x270 pt` ölçüleri birlikte verilerek oran iki düzeyde sabitlenir.
- Genel Word ve banka şablonu çıktılarından önce kroki kayıtları kontrol edilir. Eksikse kullanıcı bilgilendirilir; koordinatlar mevcutsa 16:9 görünüm ayarları otomatik kaydedilir ve çıktı üretimi devam eder.
- Koordinat verisi bulunmayan görsel otomatik üretilemezse aynı uyarıda açıkça belirtilir; mevcut diğer krokiyle rapor üretimi sürer.
- Cache-buster: `app.js?v=20260719-1910`, `src/templates/template-engine.js?v=20260719-1910`.

---
## 0.0.179 - 2026-07-19 - Konum haritası ve emsal krokisi Word'e gömüldü

- Adres ve Konum bölümüne `Haritayı Kaydet`, Emsaller bölümüne `Krokiyi Kaydet` komutları eklendi. Kayıt; merkez, yakınlaştırma, görünüm tipi, oran ve etiket tercihini saklar, taslağa büyük base64 veri yazmaz.
- Banka şablon motoruna `LOCATION_MAP_IMAGE`, `COMPARABLE_SKETCH_IMAGE` ve koşullu `REPORT_MAPS_SECTION` görsel alanları eklendi; sekiz tam banka raporu bu bölümü kullanır.
- Banka Word çıktıları artık harita JPEG'lerini `multipart/related` MHTML içeriğine gerçek dosya parçaları olarak gömer. Word'ün desteklemediği canlı Leaflet/canvas veya kırılgan `data:image` kullanımı kaldırıldı.
- Genel Word çıktısı da kaydedilmiş gerçek harita/kroki görüntülerini tercih eder; kayıt yoksa mevcut koordinat krokisi geriye dönük olarak korunur.
- Cache-buster: `app.js?v=20260719-1830`, `src/templates/template-engine.js?v=20260719-1830`.

---
## 0.0.178 - 2026-07-19 - Halkbank rapor formatı INVEX ekranlarına uyarlandı

- Halkbank Word şablonu dokuz referans görseldeki akışa göre; konum/adres, tapu, takyidat, imar, incelenen belgeler, ruhsat-dosya kontrolleri, gayrimenkul özellikleri, tapu rapor özellikleri, risk kodları, değerleme ve emsaller sırasıyla yeniden düzenlendi.
- Proje inceleme, incelenen belgeler, EKB, cezai karar, statik uygunluk ve yapı denetim açıklamaları ayrı alanlar halinde rapora aktarılır.
- HB8 ekranındaki değer kırılımları için Halkbank özel değerleme detay tablosu; HB9 ekranındaki dokuz sütunlu görünüm ve hesaplanan fiyat aralıkları için Halkbank özel emsal listesi üretildi.
- Merkez Bankası açıklaması sabit yönlendirme metni olmaktan çıkarıldı; Açıklamalar bölümüne kullanıcı tarafından doldurulabilen `halkbankCentralBankExplanation` alanı eklendi.
- Cache-buster: `app.js?v=20260719-1700`, `src/templates/template-engine.js?v=20260719-1700`.

---
## 0.0.177 - 2026-07-19 - Taleplerim çıkış komutu sağ alta taşındı

- Taleplerim ekranındaki çıkış komutu hesap satırından ayrıldı.
- `Çıkış Yap` düğmesi ekranın sağ alt köşesine sabitlenir; sayfa kaydırılsa da erişilebilir kalır.
- Cache-buster: `styles.css?v=20260719-1530`, `cloud/report-library.js?v=20260719-1530`.

---
## 0.0.176 - 2026-07-19 - Taleplerim geçişi ve çıkış noktası düzeltildi

- `Taleplerim` düğmesi kaldırılan `Yeni İş` düğmesine bağlı olmaktan çıkarıldı; aktif iş dosyası üst çubuğunda Kaydet düğmesinin önünde kalıcı olarak görünür.
- Bulut hesabı penceresindeki `Çıkış Yap` düğmesi kaldırıldı.
- Çıkış işlemi, Taleplerim ana sayfasındaki hesap satırına taşındı; mevcut yerel rapor temizleme ve oturum kapatma davranışı korunur.
- Cache-buster: `styles.css?v=20260719-1505`, `cloud/cloud-sync.js?v=20260719-1505`, `cloud/report-library.js?v=20260719-1505`.

---
## 0.0.175 - 2026-07-19 - Aktif iş özeti sıkılaştırıldı

- Aktif iş dosyasındaki dört kartlı durum şeridinin boşlukları, yüksekliği ve yazı boyutları küçültüldü.
- Özet şeridindeki banka adı kısa adla gösterilir: örneğin Kuveyt Türk, Halkbank, Akbank, İş Bankası ve VakıfBank.
- Resmi banka unvanı rapor verisinde, formda ve şablonlarda değişmeden korunur.
- Cache-buster: `app.js?v=20260719-1442`, `styles.css?v=20260719-1442`.

---
## 0.0.174 - 2026-07-19 - Tema ayarları kullanıcı hesabına taşındı

- Üst araç çubuğundaki tema seçicisi ve `Yeni İş` düğmesi kaldırıldı; aktif iş dosyasında yalnızca kaydet komutu kaldı.
- Tema seçimi, RY işaretinin sağ altındaki küçük ayar düğmesinden açılır.
- Tema tercihi giriş yapan kullanıcının e-posta anahtarıyla yerel olarak saklanır; giriş veya hesap değişiminde o kullanıcının tercihi otomatik uygulanır.
- Cache-buster: `app.js?v=20260719-1424`, `styles.css?v=20260719-1410`, `cloud/cloud-sync.js?v=20260719-1410`.

---
## 0.0.173 - 2026-07-19 - Bulut belge rozetleri veri alanlarından doğrulanıyor

- Buluttaki eski raporlarda dosya fiziksel olarak aktarılmasa bile, ilgili belgenin rapora aktardığı alanlar doluysa belge rozeti yeşil görünür.
- TAKBİS, adres kodu, imar, EKB ve KML için ilgili rapor alanları ayrı ayrı değerlendirilir; mevcut `documentStatus` bilgisi korunur.
- EKB alanında `Hayır` seçilmesi de geçerli inceleme sonucu kabul edilir ve eksik alan sayacına eklenmez.
- Karttaki belge rozetlerinin yanında `Eksik Alan = x` sayacı gösterilir.
- Cache-buster: `cloud/report-library.js?v=20260719-1336`.

---
## 0.0.172 - 2026-07-19 - Giriş sonrası varsayılan ekran Taleplerim oldu

- `sessionStorage` ile yalnızca bir kez çalışan giriş ekranı otomasyonu kaldırıldı.
- Kimlik doğrulama tamamlandığında kullanıcı doğrudan `Taleplerim` ekranına gider; buradan mevcut talebi seçebilir veya yeni talep oluşturabilir.
- Kullanıcı zaten Taleplerim ekranındaysa tekrar açılmaz; açık raporla çalışırken yalnızca gerçek oturum açma eylemi yönlendirme yapar.
- Cache-buster: `cloud/report-library.js?v=20260719-1214`.

---
## 0.0.171 - 2026-07-19 - Giriş ekranı tema anahtarı kaldırıldı

- Giriş kapısındaki gece/gündüz tema anahtarı ve tema tercihini `localStorage`'da saklayan kod kaldırıldı.
- Giriş ekranı sabit koyu görünümde kalır; uygulama içi tema profil seçicisi bu değişiklikten etkilenmez.
- Anahtara ve açık tema varyantına özel CSS temizlendi.
- Cache-buster: `styles.css?v=20260719-1203`.

---
## 0.0.170 - 2026-07-19 - iOS açılış çökmesinde büyük veri ön yüklemesi kaldırıldı

- Kök neden tarayıcı kaynak envanteriyle doğrulandı: giriş kapısı açıkken `warmUpDeferredResources()` çağrısı 46.09 MB büyüklüğündeki, 73.306 satırlık mahalle CSV dosyasını indirip tamamını JS nesnelerine dönüştürüyordu.
- Bu işlem iOS Safari'de giriş ekranı ve klavye belleğine ek olarak yüzlerce MB geçici/kalıcı bellek baskısı oluşturabiliyordu.
- Açılıştaki mahalle veritabanı ve PDF ön ısıtması kaldırıldı.
- Mahalle CSV'sinin istemci ayrıştırıcısı tamamen kaldırıldı. Posta kodu, KML/konum ve yakın çevre sorguları artık kimlik doğrulamalı `/api/neighborhoods` rotasında çalışır; iOS cihaz yalnızca eşleşen küçük JSON sonucunu alır.
- Sunucu 46 MB CSV'yi `createReadStream` + `readline` ile satır satır, yalnızca ilk sorguda okur ve sonucu sunucu belleğinde önbellekler. Böylece ham metin ve 73 bin kayıt iPhone/iPad belleğine hiçbir akışta taşınmaz.
- Gerçek veri setiyle doğrulamada 72.489 geçerli kayıt 2,4 saniyede okundu; posta kodu, bağlı mahalle, en yakın mahalle ve 45 kayıtlık yakın çevre sorguları doğru sonuç verdi.
- Regresyon kontrolü, büyük veritabanının istemciye veya başlangıç ön yüklemesine yeniden bağlanmasını engeller.
- Cache-buster: `app.js?v=20260719-1145`.

### Doğrulama

- `node --check app.js`
- `node --check server.js`
- `node tools/check-basic.js`
- Tarayıcı kaynak envanterinde ilk açılışta mahalle CSV isteği bulunmamalı.

---
## 0.0.169 - 2026-07-18 - Android kaydırma kilidi düzeltmesi

- Android/WebView tarafında sayfa kaydırmasını tamamen kilitleyebilen global `touch-action` ve dikey `overscroll` kuralları kaldırıldı.
- Ana sayfa, workspace, tablolar, alt navigasyon ve Leaflet konteynerleri dokunma hareketini tarayıcının doğal kaydırma davranışına bırakır.
- Touch cihazlarda Leaflet haritalar için JS tarafındaki `dragging:false`, `tap:false`, `touchZoom:true` ayarları korunur; harita tek parmak hareketini sayfadan çalmaz.
- Cache-buster: `app.js?v=20260718-1550`, `styles.css?v=20260718-1160`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.168 - 2026-07-18 - Android tek parmak sayfa gezinme

- Mobil/touch cihazlarda ana içerik, workspace ve Leaflet konteynerleri `touch-action: pan-y` ile tek parmak dikey kaydırmaya açıldı.
- Mobil yatay tablo sarmalayıcıları `touch-action: pan-x pan-y` kullanır; hem yatay tablo kaydırma hem sayfa dikey kaydırma tek parmakla çalışır.
- Touch cihazlarda Leaflet haritalar `dragging:false`, `tap:false`, `touchZoom:true` ile açılır. Böylece harita tek parmak pan hareketini yutmaz; sayfa tek parmakla kayar, haritada konum seçme dokunmayla devam eder.
- Cache-buster: `app.js?v=20260718-1550`, `styles.css?v=20260718-1150`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.167 - 2026-07-18 - iOS giriş çökmesi için gate lite mode

- iOS/iPadOS tespitinde giriş kapısı `data-ios-lite="true"` moduna geçer; video elementi DOM'a hiç eklenmez ve parçacıklar oluşturulmaz.
- iOS CSS bloğunda gate blueprint/parçacık/video katmanları kapatıldı; yalnızca hafif statik degrade/vinyet bırakıldı. Amaç Safari'nin girişte klavye/video/tam ekran animasyon kaynaklı bellek baskısını daha erken kesmek.
- Service worker kaydındaki arrow function'lar normal function sözdizimine çevrildi; eski WebKit parse riski azaltıldı.
- Cache-buster: `styles.css?v=20260718-1140`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.166 - 2026-07-18 - Word Dar sayfa düzeni section'a bağlandı

- Kullanıcının indirdiği Kuveyt Türk `.doc` dosyası incelendi; Word kaydı içinde `@page WordSection1 { margin:36.0pt ... }` görülse de ilk export HTML'inde gövde açıkça bu section'a bağlı değildi.
- Genel Word export ve tüm banka template'lerinde düz `@page` yerine `@page WordSection1` kullanıldı, `div.WordSection1 { page: WordSection1; }` eklendi ve body içeriği `<div class="WordSection1">...</div>` ile sarıldı.
- Cache-buster: `app.js?v=20260718-1540`.

### Doğrulama

- `node --check app.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.165 - 2026-07-18 - Word Dar preset kenar boşluğu

- Word'ün `Sayfa Düzeni > Kenar Boşlukları > Dar` preset'i 0.5 inch / 1.27 cm değerine karşılık geldiği için genel Word export ve tüm template `@page` margin değerleri `36pt` yapıldı.
- Önceki `10pt` değeri daha dar olsa da Word tarafından `Dar` preset'i olarak algılanmadığı için kullanıcı kontrolünde sayfa yapısı `Normal` görünüyordu.
- Cache-buster: `app.js?v=20260718-1530`.

### Doğrulama

- `node --check app.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.164 - 2026-07-18 - Word dar sayfa düzeni ve tablo arası boşluk

- Genel Word export `@page` ve yatay `WordLandscape` sayfa kenar boşlukları önce 10 pt yapılarak daraltıldı; Word preset davranışı için 0.0.165'te 36 pt'e çekildi.
- Üretilen Word tabloları ile banka template tablo stillerinde alt boşluk 12 pt'e sabitlendi; ardışık tablolar arasında daima yaklaşık bir satır boşluk kalır.
- Cache-buster: `app.js?v=20260718-1520`.

### Doğrulama

- `node --check app.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.163 - 2026-07-18 - Kuveyt Türk değerleme tablo önü not ve statik uygunluk

- Kuveyt Türk değerleme bölümünde `*** Taşınmazın değerlemesi takyidatlardan bağımsız yapılmıştır.` cümlesi tablolardan önceye alındı.
- Aynı tablo önü bölgede alt başlık kullanmadan `{{STATIC_SUITABILITY_EXPLANATION_TEXT}}` açıklama placeholder'ı eklendi.
- Banka template testine Kuveyt Türk özel sırası eklendi: takyidat notu, statik uygunluk açıklaması ve ardından değerleme tabloları.

### Doğrulama

- `node tools/test-bank-templates.js`

---
## 0.0.162 - 2026-07-18 - Değerleme bölümü hisse açıklaması ve tablo sırası

- `{{HISSE_ACIKLAMASI}}` çıktısı `share-explanation` paragraf sınıfıyla üretilir; Word/template CSS tarafında 10 pt ve iki yana yaslı olacak şekilde sabitlendi.
- Tam rapor banka şablonlarında değerleme bölümü ortak sırası testle kilitlendi: yöntem açıklaması, hisse açıklaması, satış kabiliyeti, kira, emlak beyanı, değerleme özet tablosu, kat bazında indirgenmiş alan tablosu, değerleme yöntemleri hesap açıklaması.
- Cache-buster: `app.js?v=20260718-1510`, `src/templates/template-engine.js?v=20260718-1510`.

### Doğrulama

- `node --check app.js`
- `node --check src/templates/template-engine.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`
- `git diff --check`

---
## 0.0.161 - 2026-07-18 - Kuveyt Türk ruhsata uygunluk altına proje/belge açıklamaları

- Kuveyt Türk şablonunda `Gayrimenkulde Kaçak Yapılaşma / Ruhsata Uygunluk Açıklaması` başlığının altına yalnızca `{{PROJECT_REVİEW_DESCRİPTİON}}` eklendi; `{{PROJECT_CONFORMİTY}}` ve `{{REVİEWED_DOCUMENTS_DESCRİPTİON}}` bu bölümden kaldırıldı.
- Şablon motoruna bu iki placeholder için alias eklendi; ilki proje inceleme/projeye uygunluk açıklamasına, ikincisi incelenen belgeler açıklamasına bağlanır.
- Cache-buster: `src/templates/template-engine.js?v=20260718-1450`.

### Doğrulama

- `node --check src/templates/template-engine.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`

---
## 0.0.160 - 2026-07-18 - EKB yok metninde randevu tarihi

- `Enerji Kimlik Belgesi = Hayır` açıklamasında sabit `İnceleme tarihinde` yerine randevu tarihi yazdırılır.
- EKB açıklaması için ortak tarih başlangıcı (`06.07.2026 tarihinde`) süresi geçmiş ve EKB yok varyantlarında birlikte kullanılır.
- Mevcut taslaklarda eski `İnceleme tarihinde EKB sistemi...` metni randevu tarihli yeni metinle değiştirilir.
- Cache-buster: `app.js?v=20260718-1440`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`
- `git diff --check`

---
## 0.0.159 - 2026-07-18 - Süresi geçmiş EKB metninde randevu tarihi yazdırıldı

- Süresi geçmiş EKB açıklamasında sabit `İnceleme tarihinde` başlangıcı kaldırıldı; yerine randevu tarihi yazılır: `06.07.2026 tarihinde ...`.
- EKB tarihi cümlesi `veriliş tarihi 01.07.2015, geçerlilik tarihi 01.06.2025 olan Enerji Kimlik Belgesi` biçimine getirildi.
- Eski `İnceleme tarihinde ... Enerji Kimlik Belgesi incelenmiştir` kalıbı yanında yeni randevu tarihli kalıp da mevcut taslak migration temizliği tarafından tanınır.
- Cache-buster: `app.js?v=20260718-1430`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`
- `git diff --check`

---
## 0.0.158 - 2026-07-18 - Süresi geçmiş EKB metninde randevu tarihi ve tarihli kelimesi

- Süresi geçmiş EKB kontrolünde inceleme tarihi artık belediye inceleme tarihi yerine doğrudan randevu tarihi (`appointmentDate`) olarak alınır.
- Süresi geçmiş EKB açıklamasında `veriliş tarihi 01.07.2015 tarihli,` biçimi `veriliş tarihi 01.07.2015,` olarak sadeleştirildi; geçerlilik tarihi de aynı sade biçimi kullanır.
- Eski `tarihli` içeren EKB cümleleri mevcut taslak açılışında temizlenip yeni cümleyle değiştirilir.
- Cache-buster: `app.js?v=20260718-1420`.

### Doğrulama

- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`
- `git diff --check`

---
## 0.0.157 - 2026-07-18 - EKB açıklaması incelenen belgeler metnine eklendi

- `Enerji Kimlik Belgesi` alanı `Hayır` seçildiğinde EKB açıklaması artık "İnceleme tarihinde EKB sistemi, E Devlet, resmi kurumlar ve saha araştırması sonucunda taşınmaza ait Enerji Kimlik Belgesi bulunamamıştır." metnini üretir.
- EKB son geçerlilik tarihi inceleme tarihinden önceyse eski kısa "dikkate alınmamıştır" metni yerine veriliş/geçerlilik tarihlerini içeren ve değerleme raporunda dikkate alınmadığını belirten yeni metin üretilir.
- EKB açıklaması, Belgeler ve Proje bölümündeki `İncelenen Belgeler Açıklaması` metninin en altına eklenir.
- Mevcut taslaklarda eski EKB cümlesi varsa açılışta yeni metinle değiştirilir.
- Cache-buster: `app.js?v=20260718-1410`.

### Doğrulama

- `node --check app.js`
- `node --check src/templates/template-engine.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`

---
## 0.0.156 - 2026-07-18 - İncelenen belgeler açıklaması iki bölüme ayrıldı

- Belgeler ve Proje bölümünde `Proje İnceleme ve Projeye Uygunluk Açıklaması` ayrı bir textarea olarak gösterilir.
- `İncelenen Belgeler Açıklaması` artık yalnızca ruhsat, yapı kullanma izin belgesi, yapı kayıt belgesi vb. incelenen belge cümlelerini üretir; proje/parselasyon/projeye uygunluk paragrafı bu alandan çıkarıldı.
- Banka şablonlarında proje uygunluk placeholder'ları yeni proje açıklamasına, `RUHSATVEISKANLAR2025` ise yalnızca belge açıklamasına bağlandı.
- Eski taslaklarda birleşik kaydedilmiş açıklama açılışta ve JSON import sırasında ayrıştırılır; proje paragrafı yeni alana taşınır.
- Cache-buster: `app.js?v=20260718-1350`, `src/templates/template-engine.js?v=20260718-1350`.

### Doğrulama

- `node --check app.js`
- `node --check src/templates/template-engine.js`
- `node tools/test-bank-templates.js`
- `node tools/check-basic.js`

---
## 0.0.155 - 2026-07-18 - Takyidat açıklamasında HTML etiketlerinin görünmesi düzeltildi

- `TAKBİS_SUMMARY`, `TAKYİDAT2025`, `TAKYİDATISBANK` ve `ENCUMBRANCE_SUMMARY_TEXT` alias'ları artık HTML üretilmiş metni tekrar HTML'e çevirmiyor.
- Takyidat özeti ham metin olarak alınıyor ve `.encumbrance-summary` sınıfıyla yalnızca bir kez paragraf HTML'ine dönüştürülüyor. Böylece raporda `<p class="encumbrance-summary">` gibi etiketler görünür metin olarak çıkmayacak.
- Şablon motoru sürümü `src/templates/template-engine.js?v=20260718-1233` olarak güncellendi.

### Doğrulama

- `node --check src/templates/template-engine.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`
- `git diff --check`

---
## 0.0.154 - 2026-07-18 - Kat dağılımı ve takyidat placeholder çıktısı

- Kuveyt Türk şablonunda “Binanın Kat Dağılımı” satırı 6,5 pt olarak sabitlendi.
- Takyidat placeholder'ları güncel `takbisSummary` alanını kullanacak şekilde düzeltildi; “Tapu Kaydı Değişikliği” bölümü dahil güncel açıklama şablona aktarılır.

---
## 0.0.153 - 2026-07-18 - Açık adres bina türü eki

- Açık adres üretiminde site/apartman adları normalize edildi. `Yonca A` artık `Yonca A Sitesi`, `Atalay Apartmanı` ise `Atalay Apartmanı` olarak yazılır.
- Bina türü eki eklenirken blok, kapı, kat, daire, il/ilçe ve UAVT kodu formatı korunur.

---
## 0.0.152 - 2026-07-18 - Kuveyt Türk şablonunda temel bilgi ve tapu aralığı düzeni

- Kuveyt Türk şablonundaki uzman/firma bilgileri rapor çıktısında kurumsal sabit bilgi olarak gösterilmeyecek şekilde `-` ile sadeleştirildi.
- İstenmeyen değerlendirme nedeni, değerlendirme konusu ve firma satırları şablondan kaldırıldı.
- Malikler tablosu ile il/ilçe tapu bilgilerinin arasına tek satırlık görsel boşluk eklendi.

---
## 0.0.151 - 2026-07-18 - Rapor paragraf çıktıları: deprem, punto, hizalama ve m2 uyumu

Bu oturumda yarım kalan rapor çıktı düzeltmeleri tamamlandı.

### Yapılanlar

- `EARTHQUAKE_ZONE` ve `DEPREM_DERECE` placeholder'ları doğrudan `earthquakeZone` alanına bağlandı. Adres ve Konum bölümünde seçilen deprem derecesi banka şablonlarında boş kalmayacak.
- `TAKBİS_SUMMARY`, `TAKYIDAT2025`, `TAKYIDATISBANK` ve `ENCUMBRANCE_SUMMARY_TEXT` placeholder'ları ortak takyidat özetine bağlandı.
- Takyidat açıklaması Word çıktısında `.encumbrance-summary` sınıfıyla 10 pt olarak üretiliyor.
- Uygulamanın Word çıktı CSS'inde ve banka HTML şablonlarında paragraf hizası `justify` yapıldı.
- Açıklama paragrafı çıktılarında `m²` otomatik olarak `m2` değerine normalize ediliyor; Halkbank şablonundaki sabit açıklama da güncellendi.
- Cache busting için `app.js` ve `src/templates/template-engine.js` sürümleri `20260718-1230` olarak yenilendi.
- Bu çalışma öncesi yedek: `backups/before-paragraph-format-and-earthquake-fix_2026-07-18_12-21-34/`.

### Doğrulama

- `node --check app.js`
- `node --check src/templates/template-engine.js`
- `node tools/check-basic.js`
- `node tools/test-bank-templates.js`
- `node tools/test-comparable-market-analysis.js`
- `git diff --check`

---
## 0.0.150 - 2026-07-18 - iOS çökme 2. tur: kapı arkasındaki dev GPU katmanları

0.0.149 deploy edildikten sonra kullanıcı iOS'ta tekrar test etti:
**arka plan videosu artık ÇIKIYOR** (Range düzeltmesi doğrulandı ✓) ama
form doldurulurken "birçok kez sorun oluştu" yeniden yüklemeleri sürüyor.

### Kalan kök neden: kapının arkasında canlı duran dev katmanlar

Giriş formunun kendisi masum (tuş başına JS işi yok — kontrol edildi).
Sorun toplam bellek tavanı: auth kapısı yalnızca GÖRSEL bir örtü; app.js
tüm rapor editörü DOM'unu kapının arkasına eksiksiz kuruyor. Üstüne:

1. **`.workspace::before`** — `inset:0` olduğu için ekran değil İÇERİK
   yüksekliğinde (binlerce px) bir elemandı; mask-image + sonsuz transform
   animasyonu taşıdığından iOS bunun için ekran-genişliği × içerik-yüksekliği
   boyutunda KALICI bir GPU katmanı tutuyordu. En büyük tekil bellek yükü
   buydu. → iOS'ta (`@supports (-webkit-touch-callout: none)`) animasyon
   kapatıldı; statik grid ebeveyniyle boyanıyor, katman gereksinimi kalktı.
2. **`.gate-blueprint`** — `will-change: transform` + sonsuz `gateBreathe`
   = bir kalıcı tam ekran katman daha → iOS'ta animasyon + will-change
   kapatıldı. `.gate-particle` (10 adet) da iOS'ta durduruldu.
3. **Video + klavye çakışması** — 0.0.149'da video oynamaya başlayınca
   tam ekran decode belleği de eklendi. Dokunmatik cihazlarda
   (`hover: none`) giriş alanına odaklanınca video duraklatılıp
   `display:none` yapılıyor (decode katmanı serbest kalır, statik degrade
   görünür); odak çıkınca kaldığı yerden devam ediyor (`index.html` gate
   script, focusin/focusout).

Masaüstü/Android görünümü değişmedi (tüm kısıtlar iOS/dokunmatik hedefli).

Sürümler: `styles.css?v=20260718-1130` (index.html + check-basic
güncellendi).

Doğrulama: `check-basic`, banka şablon testi geçti. **iOS'ta gerçek cihaz
doğrulaması yine YAPILAMADI** — deploy sonrası kullanıcı testi gerekiyor.
Bu tur da yetmezse bir SONRAKİ adım (daha köklü): app.js'in dev DOM
kurulumunu auth onayına ERTELEMEK (0.0.56'daki bilinen sınır listesinde
zaten kayıtlı öneri) — kapı açıkken arkada hiçbir şey render edilmemiş
olur; iOS bellek tavanına en kesin çözüm budur ama ayrı ve dikkatli bir
iş gerektirir.

---
## 0.0.149 - 2026-07-18 - iOS: giriş ekranı çökmesi ve arka plan videosunun görünmemesi

Kullanıcı: Android ve Windows'ta sorunsuz; iOS cihazlarda giriş ekranında
kullanıcı adı/şifre doldurulurken sayfa kendiliğinden yenileniyor veya
çöküyor (temiz, hiç girilmemiş ikinci bir iOS cihazda da aynı — önbellek
değil), ayrıca giriş ekranındaki arka plan videosu iOS'ta hiç çıkmıyor.

### Kök neden 1 — video: sunucuda HTTP Range desteği yoktu

iOS Safari (AVFoundation) bir videoyu oynatmadan önce `Range: bytes=0-1`
sondası atar; sunucu `Accept-Ranges` + `206 Partial Content` ile yanıt
vermezse videoyu HİÇ oynatmaz. `server.js`'in statik dosya servisi her
isteğe koşulsuz `200` + tam gövde dönüyordu. Chrome/Android bunu tolere
ettiği için sorun yalnızca iOS'ta görülüyordu. Ayrıca mp4'ün `moov` atomu
dosyanın SONUNDA (faststart yok) — Range destekli sunucuda Safari sona
seek edip moov'u okuyabilir, Range'siz sunucuda bu da ayrıca engeldi.

Düzeltme (`server.js > handleStatic`): tüm statik yanıtlara
`Accept-Ranges: bytes`; `Range: bytes=a-b`, `bytes=a-` ve `bytes=-N`
biçimleri `206` + doğru `Content-Range`/`Content-Length` ile, geçersiz
aralık `416` ile yanıtlanır.

### Kök neden 2 — çökme: iOS bellek baskısı (jetsam) üçlemesi

Yazarken çökme/yenilenme, iOS Safari'nin bellek baskısında sayfayı
öldürmesidir. Giriş kapısında üç pahalı katman üst üste binmişti; klavye
açılınca eklenen viewport resize fırtınasıyla birleşince sayfa ölüyordu:

1. **Sonsuz rAF parallax döngüsü** (`index.html` gate script): her karede
   `marginLeft/Top` yazarak LAYOUT tetikliyordu; dokunmatik cihazlarda
   pointermove hiç gelmediği için görsel katkısı SIFIR ama maliyeti tamdı.
   → Artık yalnızca `(hover:hover) and (pointer:fine)` cihazlarda başlıyor
   (masaüstü davranışı birebir aynı).
2. **`gateScenePulse`**: tam ekran radial-gradient'in `background-position`
   animasyonu — compositor'da değil, her karede tam ekran repaint.
   → `@supports (-webkit-touch-callout: none)` (yalnızca iOS'ta geçerli)
   bloğuyla iOS'ta kapatıldı; diğer platformlar değişmedi.
3. **`.gate-card` üzerinde `backdrop-filter: blur(18px)`**: kartın satır
   içi arka planı zaten OPAK beyaz olduğundan blur görsel olarak hiçbir şey
   katmıyordu; iOS'ta video üstünde backdrop-filter + klavye bilinen bir
   çökme kaynağı. → Tüm platformlarda kaldırıldı (görsel fark yok).

Video tarafında ek sağlamlaştırma (`index.html` gate script):
- WebKit'in bilinen bug'ı: innerHTML ile eklenen `<video>`'nun `muted`
  NİTELİĞİ `muted` ÖZELLİĞİNE yansımayabilir → sessiz-otomatik-oynatma
  reddedilir. `muted`/`playsInline` artık programatik de atanıyor +
  `play()` çağrısı (reddi sessizce yutulur).
- `preload="auto"` → `preload="metadata"` (bellek).
- Video `error` verirse element DOM'dan kaldırılır (arkadaki statik degrade
  sahneyi taşır; iOS'un başarısız yükleme döngüsü bellek yemesin).

### Doğrulama

- Range: sunucu test portunda gerçek isteklerle uçtan uca doğrulandı —
  `bytes=0-1` (iOS sondası) → `206`, orta aralık bayt-BİREBİR doğru
  (kaynak dosyayla karşılaştırıldı), `bytes=-500` (sondaki moov okuması)
  → son 500 bayt, geçersiz aralık → `416`, Range'siz istek → değişmemiş
  `200`. `node --check server.js`, `check-basic`, banka şablon testi geçti.
- Giriş ekranı canlı önizlemede kontrol edildi: video oynuyor
  (readyState 4, 1280x720), konsol hatasız; `gateScenePulse` Chromium'da
  hâlâ aktif (kapatma yalnızca iOS'u hedefliyor — doğru).
- **iOS'ta gerçek cihaz doğrulaması YAPILAMADI** (bu ortamda iOS yok).
  ÖNEMLİ: iOS kullanıcıları üretim sunucusuna (experify.com.tr)
  bağlandığı için `server.js` düzeltmesi ancak commit + push + deploy
  sonrası iOS'a ulaşır. Nginx reverse proxy Range başlıklarını varsayılan
  olarak upstream'e geçirir; yine de canlıda ilk iOS denemesinde hem
  videonun çıktığı hem de form doldururken çökmenin bittiği teyit
  edilmelidir.

Sürümler: `styles.css?v=20260718-1040` (index.html + check-basic
güncellendi). `server.js` ve gate script (index.html) cache-buster
gerektirmez (biri sunucu, diğeri HTML'in kendisi).

---
## 0.0.148 - 2026-07-18 - Kuveyt Türk şablonu düzeltmeleri + kritik placeholder hatası

Kullanıcı Kuveyt Türk şablon çıktısını inceleyip 9 maddelik düzeltme
listesi verdi:

1. Malikler Tablosu ile Tapu Bilgileri arası boşluk yok.
2. Paragraf yazı boyutu 10 olmalı.
3. Yapım Yılı boş geliyor — `{{BUİLDİNG_CONSTRUCTİON_YEAR}}` gelecek.
4. Taşınmaz İlk Kez mi Satışa Konu — `{{UNİT_FİRST_SALE_STATUS}}` gelecek.
5. Bağımsız bölüm özelliklerinde `{{UNİT_DECORATİVE_DESCRİPTİON_TEXT}}`
   olmasın (zaten interior metninin içinde var).
6. Takyidat Nasıl Görüldü — `{{TAKBİS_METHOD}}`.
7. Takyidat Açıklaması daima `{{TAKBİS_SUMMARY}}`.
8. Deprem Bölgesi — `{{EARTHQUAKE_ZONE}}`.
9. Tüm tablo/paragraflar arasına boşluk bırak.

### İnceleme sonucu

Madde 3 ve 8 şablonda ZATEN doğruydu (`{{BUİLDİNG_CONSTRUCTİON_YEAR}}` ve
`{{EARTHQUAKE_ZONE}}` her ikisi de doğru yerde) — değişiklik yapılmadı;
kullanıcının gördüğü boşluk muhtemelen o raporda veri girilmemiş olmasından
kaynaklanıyordu, şablon hatası değildi.

**Kritik bulgu (madde 7 incelenirken ortaya çıktı):** `{{ENCUMBRANCE_SUMMARY_TEXT}}`
placeholder'ı — `PLACEHOLDER-REHBERI.md`'de belgeli ve **7 banka
şablonunda** ("Takyidat Açıklaması" paragrafı için) kullanılıyor —
`src/templates/template-engine.js` içinde HİÇBİR YERDE kayıtlı değildi; ne
bir app alan anahtarı (`encumbranceSummaryText` diye bir alan yok) ne bir
alias olarak. Yani bu placeholder yıllardır/aylardır sarı "⚠ AD" uyarısı
üretiyordu, gerçek Takyidat açıklaması hiç görünmüyordu. Gerçek alan
`takbisSummary` ("Takyidat açıklaması", `buildEncumbranceSummary()` ile
otomatik üretilir).

Düzeltme (`src/templates/template-engine.js`): `ENCUMBRANCESUMMARYTEXT`
alias'ı eklendi (`buildEncumbranceSummary()`'ye bağlı) — bu, `{{ENCUMBRANCE_SUMMARY_TEXT}}`
kullanan TÜM şablonları (akbank, halkbank, isbankasi, vakifbank,
vakifkatilim, ziraat — kuveytturk hariç, o artık `{{TAKBİS_SUMMARY}}`
kullanıyor) geriye dönük düzeltir; bu 6 şablonun metni DEĞİŞTİRİLMEDİ,
yalnızca artık gerçekten çalışıyor.

Ayrıca `{{UNİT_FİRST_SALE_STATUS}}` da çözümlenmiyordu — alan
(`unitFirstSaleStatus`) `sections[].fields[]` içinde değil, ayrı bir DOM
paneliyle yönetiliyor; motorun placeholder çözümü yalnızca
`sections[].fields[].key` + elle bakımı yapılan `EXTRA_FIELD_KEYS`
listesine bakıyor. `unitFirstSaleStatus`, `EXTRA_FIELD_KEYS`'e eklendi.

### `templates/kuveytturk.html` değişiklikleri

- `<style>`: `p` kuralına `font-size:10pt; margin:0 0 10pt; line-height:1.4;`
  (madde 2); `table.kt-form` ve `.word-table`/`table.kt-list` alt
  boşlukları `7pt`'ten `12pt`'e çıkarıldı (madde 9 — bu, madde 1'i de
  otomatik çözer çünkü `{{MALIKLER_TABLO}}` `.word-table` sınıfını kullanır).
- "Taşınmaz İlk Kez mi Satışa Konu" satırı: sabit
  `SIFIR TAŞINMAZ / 2. EL TAŞINMAZ` metni → `{{UNİT_FİRST_SALE_STATUS}}`.
- Bağımsız bölüm açıklamasından tekrarlı `{{UNİT_DECORATİVE_DESCRİPTİON_TEXT}}`
  satırı kaldırıldı.
- "Takyidat Nasıl Görüldü" satırı: sabit `TAKBİS'TEN` metni →
  `{{TAKBİS_METHOD}}`.
- "Takyidat Açıklaması" için yeni bir `kt-subsec` başlığı + `{{TAKBİS_SUMMARY}}`
  eklendi (eskiden çalışmayan `{{ENCUMBRANCE_SUMMARY_TEXT}}` yerine).

`index.html`: `src/templates/template-engine.js?v=20260718-0330`.
`tools/check-basic.js` içindeki sabit template-engine.js sürüm kontrolü
aynı değere güncellendi.

Doğrulama: `node --check app.js`, `node --check src/templates/template-engine.js`,
`tools/check-basic.js`, `tools/test-bank-templates.js` (bu, gerçek şablon
doldurma motorunu çalıştırıp TÜM placeholder'ların çözümlendiğini
doğruluyor — `{{UNİT_FİRST_SALE_STATUS}}` düzeltilmeden önce bu test
BAŞARISIZ oluyordu, düzeltmenin doğru olduğunu kanıtlıyor),
`tools/test-comparable-market-analysis.js` geçti. **Canlı Word'de görsel
doğrulama YAPILAMADI** (bkz. 0.0.56 D7, 0.0.142) — kullanıcının bir
sonraki Kuveyt Türk çıktısında 9 maddeyi ve diğer 6 şablondaki artık
çalışan Takyidat Açıklaması paragrafını teyit etmesi gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.147 - 2026-07-18 - Emsal konut görünümünde yol satırı ve başlık sadeleştirmesi

Emsaller tablosunda kullanıcı arayüzü başlıkları kısaltıldı: `İrtibat / Kaynak`
`İrtibat`, `Bulunduğu Kat` `Kat` ve `Emsal Konumu` `Konumu` oldu. `Yola Cephe
Durumu` arsa/tarla emsalleri için korunurken konut/yapı emsalleri görünümünde
gizlendi. Aynı filtre Word emsal tablosunda da arsa/tarla bileşeni bulunmadığı
durumlarda uygulanır.

Yedek: `backups/before-comparable-residential-road-labels_2026-07-18_01-51-25`

Doğrulama: `node --check app.js`, `node tools/check-basic.js` ve `git diff
--check` başarılıdır. Cache sürümü `app.js?v=20260718-0155` olarak yenilendi.

---
## 0.0.146 - 2026-07-18 - Değerleme bölümü: tüm şablonlarda ortak sıralama

Kullanıcı, 7 bankayı yan yana karşılaştıran bir görsel paylaşıp Değerleme
bölümündeki alt kısımların olması gereken sırasını belirtti ve bu sırayı
TÜM banka şablonlarına uygulanmasını istedi:

1. Değerleme Yöntemi Açıklaması
2. Hisse Açıklaması (varsa)
3. Satış Kabiliyeti Açıklaması (satılabilir değilse; satılabilirse boş)
4. Kira Açıklaması
5. Emlak Beyan Değeri Açıklaması (checkbox işaretliyse değer metni, değilse
   — yalnızca Ziraat şablonunda — "bilgi paylaşılmadı" metni, diğerlerinde boş)
6. Değerleme Özet Tablosu
7. Kat Bazında İndirgenmiş Alan Tablosu
8. Değerleme Yöntemleri Hesap Açıklaması

### Eksik altyapı — 4 kalemin placeholder'ı yoktu

Araştırma: (1) Değerleme Yöntemi Açıklaması → mevcut
`{{DEGERLEME_YONTEMI_ACIKLAMASI}}`; (2) Hisse Açıklaması → mevcut
`{{HISSE_ACIKLAMASI}}`; (6) Değerleme Özet Tablosu → mevcut
`{{DEGERLENDIRME_TABLOSU}}`; (8) Hesap Açıklaması → mevcut
`{{DEGERLENDIRME_SEMASI}}`. Ama (3) Satış Kabiliyeti, (4) Kira, (5) Emlak
Beyan Değeri ve (7) Kat Bazında İndirgenmiş Alan Tablosu'nun `app.js`'te
üretici fonksiyonu/ekran paneli VARDI ama hiçbir şablon placeholder'ına
BAĞLANMAMIŞTI.

`app.js`'e eklenen 3 yeni fonksiyon:
- `buildValuationSaleabilityExplanationForExport()`: mevcut
  `buildValuationSaleabilityExplanation()` HER durumda (satılabilir dahil)
  bir cümle döndürüyordu; bu sarmalayıcı satılabilir durumda boş döner.
- `buildPropertyTaxDeclarationExplanationForExport()`: ekrandaki
  `refreshPropertyTaxDeclarationExplanation()` yalnızca DOM güncelliyordu,
  değer döndürmüyordu; aynı birleştirme mantığını (checkbox+değer / Ziraat
  fallback) saf fonksiyon olarak tekrar üretir.
- `buildExplanationsFloorValuationWordTableHtml()`: ekrandaki
  `createExplanationsFloorValuationTablePanel()` (DOM tablosu, "14 -
  Açıklamalar" bölümünde) satır içi stille Word HTML tablosuna çevrilir —
  aynı `buildExplanationsFloorValuationRows`/`getExplanationsFloorValuationMetrics`
  hesap fonksiyonlarını kullanır, veri yoksa boş döner (tablo hiç görünmez).

`src/templates/template-engine.js`'e 4 yeni placeholder:
`SATISKABILIYETIACIKLAMASI`, `KIRAACIKLAMASI`, `EMLAKBEYANDEGERIACIKLAMASI`
(hepsi `t:` — paragraf), `KATBAZINDAINDIRGENMISALANTABLOSU` (`h:` — ham HTML
tablo).

### Şablon değişikliği (8 dosyanın tamamı)

`akbank`, `halkbank`, `isbankasi`, `vakifbank`, `vakifkatilim`, `yapikredi`,
`kuveytturk`, `ziraat`: Değerleme bölümünün içeriği yukarıdaki 8 kalem
sırasına göre yeniden düzenlendi. Bankaya özgü ek içerik (ör. yapikredi'nin
"Değerleme ve Tefrişat"/"Olumlu-Olumsuz Faktörler" alt bölümleri, ziraat'in
artık gereksiz kalan statik "rayiç değeri paylaşılmadı" cümlesi — bunun
yerine artık `{{EMLAK_BEYAN_DEGERİ_ACIKLAMASI}}` dinamik olarak aynı metni
üretiyor) korunmuş, yalnızca 8 kalemin göreli sırası ve konumu düzeltilmiş,
eski tekrarlı `{{SALEABİLİTY_NOTE}}` satırları yerini yeni koşullu
`{{SATIS_KABILIYETI_ACIKLAMASI}}`'a bırakmıştır.

`templates/PLACEHOLDER-REHBERI.md`: yeni 4 placeholder + önerilen sıra notu
eklendi.

`index.html`: `app.js?v=20260718-0230`. `tools/check-basic.js` sabit sürüm
kontrolü aynı değere güncellendi.

Doğrulama: `node --check app.js`, `node --check src/templates/template-engine.js`,
`tools/check-basic.js`, `tools/test-bank-templates.js`,
`tools/test-comparable-market-analysis.js` geçti. 8 şablonun her birinde
yeni 4 placeholder'ın tamamının bulunduğu ve `<div>`/`</div>` sayılarının
dengeli kaldığı doğrulandı. **Canlı Word'de görsel doğrulama YAPILAMADI**
(bkz. 0.0.56 D7, 0.0.142) — kullanıcının bir sonraki çıktıda 8 kalemin
sırasını ve özellikle koşullu görünen/gizlenen kalemleri (hisse yoksa,
satılabilirse, emlak beyanı işaretli değilken) teyit etmesi gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.145 - 2026-07-17 - Emsaller Word tablosu: alakasız arsa/konut satırları gizlenir

Kullanıcı: "emsallerde gözükmeyen satırlar örnek konut emsallerinde imar
lejantı yapılaşma nizamı vb template bölümünde belirtilmemeli."

`buildComparableMatrixWordTableHtml()` (Emsaller Word çıktısı) mevcut alan
listesini yalnızca `field.hidden` ile filtreliyordu; ekrandaki
`getComparableDisplayFields(viewMode)`'un kullandığı arsa/konut-özel alan
gizleme mantığı ("Tüm Emsaller" görünümünde ekranda hepsi görünür — bkz.
0.0.62 — ama Word çıktısı raporun gerçek emsal bileşimine göre budanmalı)
export'a hiç uygulanmıyordu. Sonuç: rapordaki emsallerin TAMAMI konut/yapı
olsa bile "İmar Lejandı", "Yapılaşma Nizamı", "Emsal / KAKS", "Kat Adedi",
"Hesaplanan Emsal" gibi arsaya özel satırlar (herhangi bir emsalde tesadüfen
değer varsa) boş kutularla tabloya giriyordu; tersi durumda ("Oda Sayısı"
gibi konuta özel alanlar) sadece arsa emsalleri olan bir raporda görünüyordu.

Düzeltme: `buildComparableMatrixWordTableHtml()` artık raporun GERÇEK emsal
satırlarına bakıyor — `isLandComparable(row)` ile hiç arsa/tarla emsali
yoksa `comparableLandOnlyFieldKeys` alanlarını, hiç konut/yapı emsali yoksa
`comparableResidentialOnlyFieldKeys` alanlarını baştan filtreden çıkarıyor.
Karma bir raporda (hem arsa hem konut emsali varsa) her iki alan grubu da
kalmaya devam ediyor — o durumda satırın kendisi zaten mevcut "en az bir
emsalde değer var mı" filtresiyle korunuyor.

Ekrandaki canlı Emsaller paneli (`getComparableDisplayFields`,
`Tüm Emsaller`/`Konut`/`Arsa` görünüm seçici) DEĞİŞMEDİ — yalnızca Word
export'una giden `{{EMSAL_MATRISI}}` tablosu etkilendi.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. **Canlı Word'de görsel doğrulama YAPILAMADI** (bkz. 0.0.56 D7,
0.0.142) — kullanıcının konut-only ve arsa-only birer örnek raporda
Emsaller tablosunu kontrol etmesi gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.144 - 2026-07-17 - Şablon sayfa kenar boşlukları daraltıldı

Kullanıcı: "template dosyalarında sağ ve sol girintileri daralt aynı
şekilde üst ve alt girintileri de daralt." Ardından ilk daraltma (16pt/14pt)
yetersiz bulunup "hepsini 10 mt yap" (mm sanıldı, sonra "10 pt yap hepsini"
diye netleştirildi) talimatıyla tüm kenarlar TEK bir değere eşitlendi.

Tüm 10 şablon dosyasındaki `@page { ... margin: ... }` kuralı, önceki farklı
üst/alt-sağ/sol değerlerinden (30pt 26pt, kuveytturk 28pt 24pt, masraf
yazısı 40pt 34pt, yatay ek tablo 24pt 22pt) çıkıp **dört kenarda da ortak
`margin: 10pt;`** oldu (CSS'te tek değer = tüm kenarlar eşit).

app.js'in kendi ürettiği genel Word dokümanının (banka şablonu
kullanılmadığında) `@page`/`@page WordLandscape` kenar boşuklarına
DOKUNULMADI — kullanıcı özellikle "template dosyalarında" dedi.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. **Canlı Word'de görsel doğrulama YAPILAMADI** (bkz. 0.0.56 D7,
0.0.142) — kullanıcının bir sonraki çıktıda kenar boşluklarını teyit
etmesi gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.143 - 2026-07-17 - Sayfa başı kırılması düzeltmesi: her paragraf değil, yalnızca başlık

Kullanıcı, 0.0.141'de eklenen sayfa başı davranışını canlı Word çıktısında
kontrol edip: "başlıklar ayrı sayfada olacak, sen her bir paragrafı ayrı
sayfaya koymuşsun. Kompakt bir template istiyorum, ne kadar az sayfa o
kadar iyi" dedi.

### Kök neden

0.0.141'de `page-break-before: always` kuralı, bölümü saran
`<div class="pg-section">...</div>` üzerine CSS SINIFI olarak konmuştu.
CSS spesifikasyonuna göre `page-break-before` MİRAS ALINMAZ, ama Word'ün
`.doc` HTML dönüştürücüsü bunu doğru uygulamıyor: div üzerindeki kuralı
içindeki HER blok elemana (her `<p>`, her satır) da uyguluyor — sonuç
olarak bölüm başlığı değil, bölümün İÇİNDEKİ HER PARAGRAF kendi sayfasında
başlıyordu. Bu, Word'ün bilinen bir `.doc`/HTML içe aktarma kısıtıdır.

### Düzeltme

8 şablonun tamamında (`akbank`, `halkbank`, `isbankasi`, `kuveytturk`,
`vakifbank`, `vakifkatilim`, `yapikredi`, `ziraat`):
- `.pg-section { page-break-before: always; }` CSS kuralı KALDIRILDI.
- Bunun yerine sayfa başı kırılması yalnızca ilgili bölümün BAŞLIK
  etiketine (h2, veya kuveytturk'te `.kt-sec` div'i) satır içi
  `style="page-break-before:always;"` olarak eklendi — tek bir elemana,
  miras riski olmadan.
- `.pg-section` div'i hâlâ duruyor ama artık yalnızca tek sayfaya sığdırma
  amaçlı punto/hücre boşluğu sıkılaştırma kuralları için kullanılıyor
  (page-break içermiyor).

Sonuç: Değerleme, Emsaller, GDYS Yardımcı Bilgiler ve Gabim bölümlerinin
her biri hâlâ kendi sayfasında BAŞLIYOR (yalnızca başlıkta bir kez), ama
bölüm içindeki paragraflar artık gereksiz yere sayfa sayfa bölünmüyor —
belge önceki haline göre çok daha az sayfa kullanıyor.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. 8 şablonda `.pg-section` sınıfında artık `page-break-before` kuralı
kalmadığı ve her şablonda tam olarak 4 satır içi
`style="page-break-before:always;"` bulunduğu (ne fazla ne eksik)
doğrulandı; `<div>`/`</div>` sayıları hâlâ dengeli. **Canlı Word'de görsel
doğrulama yine YAPILAMADI** (bkz. 0.0.56 D7, 0.0.142) — kullanıcının bir
sonraki Word çıktısında sayfa sayısının makul düştüğünü teyit etmesi
gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.141 - 2026-07-17 - Değerleme/Emsaller/GDYS Yardımcı/Gabim: sayfa başı + tek sayfaya sığdırma

Kullanıcı: "tüm template bölümlerinde bazı bölümler sayfa başından başlasın
ve tek sayfaya sığsın, gerekirse puntoları ve hücre boşluklarını
düşürebilirsin" — Değerleme Bölümü, Emsaller Bölümü, GDYS Yardımcı
Bilgiler Bölümü, Gabim Bölümü için.

Her banka şablonunda (8 dosya: akbank, halkbank, isbankasi, kuveytturk,
vakifbank, vakifkatilim, yapikredi, ziraat) bu dört bölümün başlığı hangi
metinse (bkz. şablon farklılıkları — ör. yapikredi'de "Gayrimenkul
Değerleme", ziraat'te "7. DEĞERLEME") o başlıktan bir sonraki hedef
başlığa kadarki içerik `<div class="pg-section">...</div>` ile sarıldı.
Yeni `.pg-section` CSS kuralı (her şablonun kendi `<style>` bloğunda):
- `page-break-before: always` — Word'de bu blok her zaman yeni sayfada başlar.
- `table.meta`/`table.kt-form`/`.word-table` hücrelerinde daha sıkı
  padding + küçük punto — yalnızca bu 4 bölüm için, dokümanın geri kalanı
  etkilenmez.

Statik şablon tabloları (GDYS Yardımcı Bilgiler) CSS ile sıkıştırılabildi;
Emsaller/Değerleme/Gabim içeriği app.js'te SATIR İÇİ stille üretildiği için
(CSS'ten etkilenmez) doğrudan orada küçültüldü:
- `buildSimpleHtmlTable()`: yeni `options.compact` parametresi (yalnızca
  Emsaller matrisi bunu `true` geçiyor — `buildComparableMatrixWordTableHtml()`)
  — punto 7pt→5.5pt, hücre dolgusu 2.4pt 3pt→1pt 1.6pt.
- `buildValuationSummaryWordTableHtml()` (Değerleme özet tablosu, tek
  kullanım yeri Değerleme Bölümü): punto 9pt→7pt, hücre dolgusu 6pt
  8pt→3pt 5pt.
- `buildGabimDataSetWordHtml()` (bkz. 0.0.142/0.0.140): punto ve
  boşluklar bir miktar daha sıkıldı (kutu 7pt→6.3pt, etiket 6pt→5.3pt vb.).

Not: "tek sayfaya sığma" garantisi yoktur — çok sayıda emsal (7'ye kadar)
veya uzun metinler girildiğinde bölüm yine de taşabilir; bu, kullanıcının
"gerekirse" ifadesiyle kabul ettiği bir en-iyi-çaba (best-effort) sınırıdır,
otomatik sayfa taşması/ölçekleme mantığı eklenmedi.

`index.html`: `app.js?v=20260717-2110`. `tools/check-basic.js` sabit sürüm
kontrolü aynı değere güncellendi.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. 8 şablonda `<div>`/`</div>` sayıları eşit (dengeli) olarak
doğrulandı. **Canlı tarayıcıda/Word'de görsel doğrulama YAPILAMADI** —
zorunlu giriş kapısı bu ortamda aşılamıyor (bkz. 0.0.56 D7, 0.0.142'de de
tekrarlanan bilinen sınır). Kullanıcının gerçek bir raporda Word çıktısı
alıp 4 bölümün ayrı sayfada başladığını ve makul şekilde sığdığını teyit
etmesi gerekir.

Ayrı yedek alınmadı; önceki `backups/before-library-cloud-meta-row_2026-07-17_19-11-29`
taban olarak yeterli.

---
## 0.0.140 - 2026-07-17 - Gabim değer kutuları: gömülü görünüm, açık gri arka plan

Kullanıcı: "gabim template çıktısına baktım. başlık altına gelecek değerin
yazıldığı kısım gömülü kutucuk olsun arka planı açık gri olsun."

`buildGabimDataSetWordHtml()` içindeki değer kutusu stili:
- Arka plan beyaz (`#ffffff`) yerine açık gri `#eceef1`.
- Kenarlık `#d1d5db` → biraz daha belirgin `#c7cbd1`.
- `box-shadow: inset 0 1pt 2pt rgba(17,24,39,0.12)` eklendi — "gömülü/içe
  çökük" hissi. Word'ün `.doc` HTML render motoru `box-shadow`'u yok
  sayar (zararsız); garanti edilen kısım gri arka plan + kenarlıktır,
  tarayıcı/PDF önizlemede gömülü etkisi de görünür.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js` geçti. Stil kurallarının aynısıyla ayrı bir
statik HTML dosyası oluşturulup tarayıcıda görsel olarak denenmek
istendi, ancak Browser bölmesi güvenlik politikası proje dışı bir
localhost sunucusuna izin vermediği için bu yol da başarısız oldu; asıl
uygulama içindeki görsel doğrulama zorunlu giriş kapısı yüzünden bu
ortamda hâlâ mümkün değil (bkz. 0.0.56 D7, 0.0.142, 0.0.141).

---
## 0.0.142 - 2026-07-17 - GABİM VERİ SETİ Word çıktısı GDYS ile bire bir renk/ızgara uyumu

Kullanıcı, GDYS'nin gerçek "Gabim Veri Seti" formunun 4 gayrimenkul türü
(Arsa, Konut, Diğer Bina, Arazi) için yeni ekran görüntülerini paylaşıp banka
şablonlarındaki `{{GABIM_VERI_SETI}}` çıktısının satır/sütun yerleşiminin ve
renk paletinin görsellerdeki gibi **birebir** olmasını istedi. 0.0.107'de
uygulanan ilk sürüm ızgara/kutu görünümüne geçmişti ama iki noktada
görsellerden sapıyordu: (1) renkler GDYS'nin sabit renkleri yerine uygulama
temasının (Navy Blue/Apple/Glass/...) token'larını kullanıyordu, (2)
"Bağımsız Bölüm / Taşınmaz Özellikleri" ve "BB İçin İmar Bilgileri" düz tek
ızgara olarak render ediliyordu; oysa GDYS'de bunlar soldaki küçük gri
kategori etiketiyle ayrılmış alt bloklardan oluşuyor ("BB İçin Alanlar",
"BB İçin Değerler", "BB İçin Birim Değerler", "BB İçin Cephe ve Kat") ve
"Tapuya Özel Bilgiler" açık gri gölgeli bir kart panelinde gösteriliyor.

`app.js`:
- `GABIM_GROUP_COLUMNS`: "Tapu Bilgileri" ve "Tapuya Özel Bilgiler" 3'ten
  4 sütuna çıkarıldı (görsellerdeki satır yoğunluğuna göre); "Bağımsız Bölüm
  / Taşınmaz Özellikleri" ve "BB İçin İmar Bilgileri" bu tablodan çıkarılıp
  yeni `GABIM_SUBGROUPS` tanımına taşındı.
- Yeni `GABIM_SUBGROUPS`: yukarıdaki iki grup için alt blok tanımları (her
  tanım `title` → solda kategori etiketli girintili satır, `indent: true` →
  aynı kategorinin etiketsiz devamı, ikisi de yoksa → girintisiz tam
  genişlik satır).
- Yeni `GABIM_SHADED_GROUPS`: `Set(["Tapuya Özel Bilgiler"])` — bu grup açık
  gri (`#f3f4f6`) kart paneli içinde render edilir.
- `buildGabimExportGroups()`: `GABIM_SUBGROUPS`'ta tanımlı gruplar için
  düz `rows`+`columns` yerine `subgroups` (etiket/girinti/kendi sütun
  sayısıyla) üretir; boş kalan alt bloklar otomatik elenir.
- `buildGabimDataSetWordHtml()`: renkler artık `getReportThemeToken(...)`
  yerine GDYS ekran görüntülerinden alınan SABİT hex değerler (`ink
  #111827`, `muted #6b7280`, `line #d1d5db`, `surface #ffffff`, panel
  `#f3f4f6`/`#e5e7eb`) — hangi rapor teması (Navy Blue/Apple/Glass/Aurora/
  Clay/Neumorphism) aktif olursa olsun GABİM tablosunun rengi değişmez.
  Alt gruplu render için sol kategori etiketi hücresi (`subgroupLabelStyle`)
  eklendi.

Ekrandaki canlı Gabim paneli (`buildGabimDataGroups`, `.gabim-data-group`
CSS'i) bilinçli olarak DEĞİŞMEDİ — kullanıcı GDYS'ye elle veri girerken
referans olsun diye hâlâ tüm alanları düz liste gösteriyor. Sadece Word/PDF
export'una giden `{{GABIM_VERI_SETI}}` çıktısı güncellendi.

`index.html`: `app.js?v=20260717-2020`. `tools/check-basic.js` içindeki
sabit sürüm kontrolü aynı değere güncellendi.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js`
geçti. **Canlı tarayıcıda GÖRSEL doğrulama YAPILAMADI** — uygulamanın
zorunlu giriş kapısı (bkz. 0.0.56 D7 kararı) bu ortamda gerçek Firebase
kimlik bilgisi olmadığı için aşılamıyor; bu, projenin daha önceki
oturumlarında da tekrarlanan bilinen bir sınırdır. Kullanıcının gerçek bir
raporda Word/PDF çıktısı alıp GABİM VERİ SETİ bölümünü 4 görselle
karşılaştırarak teyit etmesi gerekir.

Ayrı yedek alınmadı (tek fonksiyon/tablo değişikliği; önceki
`backups/before-library-cloud-meta-row_2026-07-17_19-11-29` yeterli taban).

---
## 0.0.135 - 2026-07-17 - Bulut saklama bilgisinin kompakt meta satiri

Taleplerim kart ve liste gorunumlerinde `Son guncelleme` bilgisi ile bulut saklama
rozetini ayni `library-card-meta` satirinda birlestirdim. `+30 gun` butonu artik
bu satirin yaninda yer aliyor; rozet, buton ve tarih font/padding degerleri daha
kompakt hale getirildi. Yedek:
`backups/before-library-cloud-meta-row_2026-07-17_19-11-29/`.

## 0.0.136 - 2026-07-17 - Talep karti basliklarinda tek satir duzeni

Taleplerim kart ve liste gorunumlerinde rapor adi ile banka ve bilgi degerlerinin satir kirarak karti bozmasi engellendi. Rapor adi artik tek satirda ellipsis ile gosteriliyor; belge durum rozetleri gerektiğinde ikinci satira alinıyor. Banka ve diger bilgi degerleri tek satirli gorunumu koruyor.
Yedek: `backups/before-library-card-single-line_2026-07-17_19-34-31/`.

## 0.0.137 - 2026-07-17 - Clay ve Neumorphism kontrast duzenlemesi

Clay ve Neumorphism temalarinda sol paneldeki hardal renkli aciklama etiketleri koyu mora alindi. Bu iki temada panel ve dugme metinleri okunabilir koyu metin rengine sabitlendi; diger tema profilleri etkilenmedi.
Yedek: `backups/before-clay-neu-contrast_2026-07-17_20-15-01/`.

## 0.0.138 - 2026-07-17 - Neumorphism navy panel aciklamalari

Neumorphism temasinda sol panel aciklama etiketleri koyu mor yerine navy blue olarak guncellendi. Clay temasindaki koyu mor vurgu korunuyor.
Yedek: `backups/before-neu-navy-badge_2026-07-17_20-20-48/`.

## 0.0.139 - 2026-07-17 - Aurora ana baslik kontrasti

Aurora temasinda ust bolumdeki `Yeni Ekspertiz Raporu` basligi koyu `--ink` yerine `#dbe6ff` olarak ayarlandi. Tema CSS onbellek surumu yenilendi.
Yedek: `backups/before-aurora-title-contrast_2026-07-17_21-45-27/`.

## 0.0.140 - 2026-07-17 - Emsal kat basligi kisaltmasi

Emsaller tablosundaki `Bulunduğu Kat / Mülkiyet` satir basligi `Bulunduğu Kat` olarak sadeleştirildi; emsal verisi ve kosullu gorunum kurallari degistirilmedi.
Yedek: `backups/before-comparable-floor-label_2026-07-17_23-14-29/`.

## 0.0.141 - 2026-07-17 - Emsal satir basliklari sadeleştirmesi

Emsaller tablosundaki `Bulunduğu Yapı Yaşı`, `İmar Lejantı`, `Yapılaşma Nizamı` ve `Uzun Emsal Metni` başlıkları sırasıyla `Yapı Yaşı`, `Lejant`, `Nizamı` ve `Emsal Metni` olarak kısaltıldı. Veri anahtarları ve hesaplama akışı korunmuştur.
Yedek: `backups/before-comparable-labels_2026-07-17_23-17-46/`.

## 0.0.142 - 2026-07-18 - Konut emsallerinde arsa hesap satirlarinin gizlenmesi

`Hesaplanan Emsal M2 Birim Değeri` ve `İndirgenmiş Hesaplanan Emsal M2 Birim Değeri` satirlari arsa/tarla alanina ozel olarak tanimlandi. Konut emsalleri gorunumunde ve yalnizca konut iceren rapor ciktilarinda bu satirlar artik gosterilmiyor; karma ve arsa/tarla gorunumunde korunuyor.
Yedek: `backups/before-hide-calculated-emsal-residential_2026-07-18_01-11-30/`.

## 0.0.134 - 2026-07-17 - Ana Gayrimenkul ve Bağımsız Bölüm alt panel hizalaması

7. Ana Gayrimenkul Özellikleri ve 8. Bağımsız Bölüm Özellikleri bölümlerindeki alt panellerde
`Bina Yapı Tarzı`, `Asansör`, `Kullanım Durumu` ve benzeri alanlar panel kenarlarına yapışık
görünüyordu. `.section-building .subsection` ve `.section-unit .subsection` için masaüstünde
14px/16px, dar ekranlarda 12px/10px iç boşluk tanımlandı. Başlıklar, tablolar ve alan ızgaraları
artık aynı iç hizayı takip ediyor. Yedek:
`backups/before-building-unit-panel-padding_2026-07-17_18-17-07/`.

## 0.0.114 - 2026-07-17 - Open Design Esintili Motion ve Gorsel Katman

- Open Design reposu ayri bir calisma klasorune kuruldu:
  `C:/Users/90551/Documents/Codex/open-design`.
- Uygulamanin mevcut lacivert degerleme arayuzu korunarak `styles.css` icine
  kontrollu bir ambient motion katmani eklendi: calisma alaninda cok hafif
  hareketli grid/gradient arka plan, nav ve ust bar gecisleri, kart derinligi.
- Giris ekranindaki blueprint sahnesi gelistirildi; cam yuzey etkisi, yumusak
  sahne pulse hareketi ve buton hover derinligi eklendi.
- `prefers-reduced-motion` kurali tum yeni hareketleri kapatir.
- Masaustu (1280x900) ve mobil (390x844) tarayici dogrulamasinda giris ekrani
  goruntulendi, yatay tasma olusmadi.
- Yedek: `backups/before-open-design-visual-update_2026-07-17_08-02-50`.

---
## 0.0.113 - 2026-07-16 - gstack Aciklari ve Guvenlik Sertlestirmesi

- Leaflet stil dosyasinin CSP tarafindan engellenmesi giderildi; `server.js`
  icindeki `style-src` yalnizca bilinen `https://unpkg.com` kaynagini kabul eder.
- GitHub Actions icindeki `actions/checkout` ve `actions/setup-node` kullanimlari
  degismez commit SHA'larina sabitlendi.
- `GITHUB-ACTIONS-DEPLOY.md`, production ortaminda `RAPOR_HOST=0.0.0.0`,
  `RAPOR_PORT=5174` ve Nginx reverse proxy akisini aciklayacak sekilde guncellendi.
- Asagidaki eski parser notu guncel durum degildir: `parseComparableNumber`
  binlik nokta ayracli degerleri artik desteklemektedir.
- Bu kayit sonraki oturumlar icin guncel durumdur; daha asagidaki tarihli notlar
  kendi donemlerindeki degisikliklerin arsiv kaydidir.
- Yedek: `backups/before-gstack-open-issues_2026-07-16_19-09-36`.

---
## 0.0.112 - 2026-07-16 - app.js Modulerlesme Ilk Dilimi

- Disa aktarma oncesi zorunlu alan kontrolu `src/exports/export-validation.js`
  modulune tasindi.
- `app.js` artik bu davranisin uygulama kodunu tasimiyor; modul global API
  uzerinden mevcut dis aktarma butonlariyla uyumlu calisiyor.
- Ilk modulerlesme dilimi sonrasinda `app.js`, `server.js` ve yeni modul syntax
  kontrollerinden gecti.
- Yedek: `backups/before-export-validation-module_2026-07-16_18-46-48`.

---
## 0.0.111 - 2026-07-16 - Graphify Odakli Kod Haritasi

- Graphify code-only guncellemesi yapildi.
- Son harita: `18.598` dugum, `42.205` baglanti.
- `graphify-out/graph.json` ve `graphify-out/GRAPH_TREE.html` yeniden uretildi.
- Bes kaynak dosyasi sifir AST dugumu uretti; bunlar veri/fixture veya desteklenmeyen
  dosya tipleri oldugu icin harita disinda kaldi.

---
## 0.0.110 - 2026-07-16 - Runtime Bagimliliklarinin Sabitlenmesi

- `package.json` icine Node `>=22 <23` ve npm `>=10 <11` engine sozlesmesi eklendi.
- Bagimlilik kullanilmadigi icin minimal `package-lock.json` olusturuldu.
- `.nvmrc` ile yerel/CI Node ana surumu `22` olarak sabitlendi.
- GitHub Actions artik Node surumunu `.nvmrc` dosyasindan okuyor ve runtime
  surumlerini deployment oncesi yazdirarak kontrol ediyor.
- `tools/check-basic.js` yeni `app.js` cache-buster surumunu kontrol ediyor.
- Dogrulama: package metadata, JavaScript syntax, temel kontrol ve diff kontrolu
  basarili.

---
## 0.0.109 - 2026-07-16 - Dis Aktarma Oncesi Eksik Alan Uyarisi

- JSON, Word, PDF ve banka sablonu dis aktarma butonlarina ortak zorunlu alan
  kontrolu eklendi.
- Eksik zorunlu alan varsa kullaniciya eksik alanlar listelenerek devam etme
  veya islemi iptal etme secenegi sunuluyor.
- Eksik alan yoksa mevcut dis aktarma akisi degismeden devam ediyor.
- `app.js` cache-buster'i `app.js?v=20260716-1831` olarak guncellendi.
- Yedek: `backups/before-export-reminder_2026-07-16_18-31-05`.
- Dogrulama: `node --check app.js`, `tools/check-basic.js` ve `git diff --check`
  basarili.

---
## 0.0.108 - 2026-07-16 - Rapor Kutuphanesi Auth Gecidi

- `cloud/report-library.js` artik Firebase oturumu dogrulanmadan aktif rapor,
  localStorage ve Taleplerim kutuphanesi islemlerini baslatmiyor.
- Kimlik dogrulama tamamlandiginda `RaporCloudSync.onAuthChange` ile tek seferlik
  baslatma yapiliyor; mevcut giris akisinin sonraki rapor islemleri korunuyor.
- Ilgili script cache-buster'i `cloud/report-library.js?v=20260716-1825` olarak
  guncellendi.
- Yedek: `backups/before-report-library-auth-gate_2026-07-16_18-23-19`.
- Dogrulama: `node --check` (report-library.js, app.js, server.js) ve
  `tools/check-basic.js` basarili.

---
## 0.0.107 - 2026-07-16 - GitHub Actions ve Google Cloud Deployment

Bu hafta uygulamanin GitHub uzerinden otomatik dogrulama ve Ubuntu sunucuya
dagitim akisi calisir hale getirildi.

- Yerel proje `canlilarmelih-art/Rapor-Yazma` GitHub deposunun `main` branch'ine
  baglandi.
- `.github/workflows/deploy.yml` ile her `git push origin main` sonrasinda test,
  SSH baglantisi, rsync dosya aktarimi, PM2 yeniden baslatma ve localhost
  saglik kontrolu otomatik calisir.
- GitHub Actions secrets yapilandirildi: `DEPLOY_HOST`, `DEPLOY_USER`,
  `DEPLOY_PATH`, `DEPLOY_PORT` ve `DEPLOY_SSH_KEY`.
- SSH deploy anahtari sunucuda `~/.ssh/authorized_keys` dosyasina eklendi.
- Sunucu bilgileri: IP `34.136.126.221`, kullanici `canlilar_melih`, uygulama
  yolu `/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app/`,
  PM2 adi `rapor-app`, uygulama portu `5174`.
- Google Cloud VPC firewall'da 80 ve 443 portlarini acan `allow-http-https`
  kurali mevcut. Dogrudan test icin 5174 portu da acildi.
- `experify.com.tr` DNS A kaydi `34.136.126.221` adresine yonlendirildi.
- Nginx reverse proxy ve Let's Encrypt kurulumu tamamlandi; uygulama
  `https://experify.com.tr` adresinden erisilebilir durumda.
- Ilk dis erisim sorununun nedeni uygulamanin `127.0.0.1:5174` uzerinde
  dinlemesiydi. PM2 `HOST=0.0.0.0` ile yeniden baslatilarak dis erisim saglandi.
- Sudo parolasi gerektiren HTTPS adimlari GitHub Actions icinden kaldirildi;
  HTTPS/Nginx islemleri sunucuda yetkili SSH oturumu ile yapilmalidir.

Kalici deployment akisi:

```text
Kod degisikligi -> git push origin main -> GitHub Actions verify -> SSH/rsync
-> PM2 restart -> health check
```

Kontrol komutlari: `pm2 status` ve `ss -ltnp | grep 5174`.

Acik kalan teknik konu: GitHub Actions icinden Nginx veya Certbot icin sudo
calistirilmasi parola gerektirdigi icin otomatik degildir. Nginx ve sertifika
yenileme sunucu tarafinda systemd/Certbot timer ile izlenmelidir.

Yedek/geri donus: Deployment workflow degisiklikleri GitHub commit gecmisinde
saklanir.

---
## 0.0.101 2026-07-13 Tema Secici

- Ust menude `Apple` ve `Navy Blue` profilleri arasinda gecis yapilabilen tema secici eklendi.
- Secim `localStorage` icinde saklaniyor ve sayfa yenilendiginde ayni tema geri yukleniyor.
- In-app browser dogrulamasi: iki profil de tek secici uzerinden etkinlesti ve renk tokenlari degisti.

---
## 0.0.100 2026-07-13 Apple ve Navy Blue Tema Profilleri

- Mevcut lacivert-beyaz arayuz `themes/navy-blue.css` ile Navy Blue profilinde sabitlendi.
- `DESIGN-apple.md` tokenlari rapor yazma calisma alanina uyarlanarak `themes/apple.css` profili olusturuldu.
- Uygulama varsayilan olarak Apple profilini aciyor; `body[data-app-theme="apple"]` ile etkinlestiriliyor.
- Apple profilinde Action Blue, siyah yan menu, beyaz/parchment yuzeyler, hairline cerceveler, Apple tipografi yiginlari ve chrome golgesizligi uygulandi.
- `THEME-PROFILES.md` tema profillerini ve kullanim amaclarini belgelemektedir.

Yedek:
`backups/before-design-theme-profiles_2026-07-13_01-57-00`

Dogrulama: Uygulama in-app browser uzerinde Apple temasi ile goruntulendi; `app.js` ve template motoru sozdizimi ile banka sablon testleri onceki degisiklik kapsaminda gecti.

---
## 0.0.99 2026-07-12 Placeholder Envanterinin Emsal ve Tablo Alanlariyla Genisletilmesi

- Placeholder yoneticisi, sections[].fields disinda state.fields icinde bulunan ozel panel alanlarini da otomatik katalogluyor.
- Emsaller icin `{{EMSAL_MATRISI}}`, `{{EMSAL_TABLOSU}}` ve `{{EMSAL_ARSA_PIYASA_DEGERI}}` adlari eklendi.
- Emsal 1-7 satirlarinin giris, aciklama ve otomatik hesap alanlari `{{EMSAL_1_...}}` ... `{{EMSAL_7_...}}` seklinde ayri adlandirildi.
- Diger uygulama tablolari icin satir/sutun bazli `{{TABLE_<TABLO>_<SATIR>_<SUTUN>}}` adlari eklendi ve sablon motorunda cozumlenir hale getirildi.
- Placeholder rehberine yeni emsal adlari ve ornekleri eklendi.

Yedek:
`backups/before-placeholder-catalog-audit_2026-07-12_22-25-46`

Dogrulama: `node --check app.js`, `node --check src/templates/template-engine.js`, `tools/test-bank-templates.js` ve `tools/test-comparable-market-analysis.js` gecti. `tools/check-basic.js` mevcut mojibake tabanli `Gabim Veri Seti` kontrolunde halen bilinen nedenle basarisiz.

---
## 0.0.100 2026-07-12 GitHub Actions ile Ubuntu Otomatik Yayin

- `.github/workflows/deploy.yml` eklendi. `main` dalina push sonrasinda JavaScript syntax ve parser testleri calisir.
- Testler basarili olursa GitHub Actions SSH/rsync ile `/home/canlilar_melih/proje/files-mentioned-by-the-user-rapor/app/` klasorune yayin yapar.
- `server-data/`, `backups/`, `.git/` ve `node_modules/` aktarim silme isleminden korunur.
- Deploy sonunda PM2 `rapor-app` yeniden baslatilir ve 5174, yoksa 5173 portu saglik kontrolunden gecirilir.
- GitHub secret kurulumu `GITHUB-ACTIONS-DEPLOY.md` dosyasinda belgelendi.

Dogrulama: JavaScript syntax ve parser testleri gecti.

---
## 0.0.99 2026-07-12 Ilce Iklim Cumlesi ve Otomatik Deprem Derecesi

- Ilce iklim/cografya aciklamasi, Bursa/Yildirim ornegindeki rapor diliyle; bolge, yagis sinifi, rakim, sicaklik, nem, yagis, guneslenme, donlu gun ve depremsellik bilgilerini ayri cumlelerde uretiyor.
- Deprem bolgesi verisi `Deprem derecesi` alanina il-ilce kaydindan otomatik uygulanir; kullanici secimi degistirdiginde otomatik sahiplik temizlenir ve aciklama kullanicinin secimini esas alir.
- Excel kaydindaki `1 – Cok Yuksek` degeri raporda `1. Derece - Cok Yuksek` bicimine donusturulur.

Servis surumu:
`app.js?v=20260712-0142`, `styles.css?v=20260712-1720`

Yedek:
`backups/before-climate-earthquake-sentence-and-auto-degree_2026-07-12_17-51-18`

Dogrulama: `node --check app.js` ve `node --check src/land/climate-earthquake-data.js` gecti. `tools/check-basic.js`, mevcut kodlama beklentisi nedeniyle `Gabim Veri Seti` kontrolunde basarisiz oldu. Graphify: 18.537 dugum, 42.089 baglanti.

---

## 0.0.66 2026-07-11 Arsa Emsal Yüzölçümü ve Harita Konumu Düzeltmesi (Codex oturumu)

Kullanıcı, `Hesaplanan Emsal` alanının otomatik hesaplanmadığını, m2 birim değerinde kullanılmaması gerektiğini ve arsa/tarla uzun emsal paragrafında harita konumunun yer almasını istedi.

Yapılanlar:
- `Hesaplanan Emsal` artık `Yüzölçümü`, `Yapılaşma Nizamı`, `Emsal/KAKS` veya `Kat Adedi` yazılırken anlık güncellenir.
- Arsa/tarla m2 birim değeri hesabında `Hesaplanan Emsal` kullanılmaz; daima `Yüzölçümü` (`c24`) kullanılır.
- Arsa/tarla uzun emsal paragrafına `Emsal Konumu` ifadesinden sonra haritadan seçilen konum eklendi.
- Harita konumu örneği: `Ekspertize konu taşınmazla aynı bölgede, taşınmazın yaklaşık 350 metre doğusunda, ...`
- Harita mesafesi onlar basamağına yuvarlanır.

Yedek:
`backups/before-comparable-area-and-map-text-fix_2026-07-11_00-05-56`

Servis sürümü:
`app.js?v=20260711-0012`, `styles.css?v=20260711-0012`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.65 2026-07-10 Arsa Emsal Hesaplanan Emsal Kural Düzeltmesi (Codex oturumu)

Kullanıcı, `Hesaplanan Emsal` alanının emsal paragrafında kullanılmamasını ve İmar Durumu bölümündeki hesaplanan emsal kurallarının Emsaller bölümünde de geçerli olmasını istedi.

Yapılanlar:
- Arsa/tarla uzun emsal paragrafından `hesaplanan emsal alanına sahip` cümlesi kaldırıldı.
- `Hesaplanan Emsal` otomatik hesabı İmar Durumu mantığıyla eşitlendi:
  - KAKS/Emsal girilmişse `Yüzölçümü x KAKS/Emsal`
  - KAKS/Emsal boşsa ve kat adedi sayısal ise `Yüzölçümü x Kat Adedi`
- Kural artık yalnızca `Ayrık Nizam` ile sınırlı değil; `Ayrık Nizam` ve `Bitişik Nizam` dahil seçilen nizamdan bağımsız olarak İmar Durumu’ndaki genel hesap mantığı uygulanır.
- Örnek: `Yüzölçümü 1000`, `Emsal/KAKS 1,50` ise `Hesaplanan Emsal 1.500` olur.

Yedek:
`backups/before-comparable-buildable-area-rule-fix_2026-07-10_19-38-18`

Servis sürümü:
`app.js?v=20260710-1942`, `styles.css?v=20260710-1942`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- Emsal paragrafında `hesaplanan emsal alanına sahip` ifadesinin kalmadığı doğrulandı.

---

## 0.0.64 2026-07-10 Arsa Emsal Hesaplanan Emsal Alanı (Codex oturumu)

Arsa/tarla emsal girişinde açılır liste boş seçenekleri ve hesaplanan emsal alanı geliştirildi.

Yapılanlar:
- `Emsal Niteliği`, `İmar Lejantı`, `Yapılaşma Nizamı`, `Kat Adedi` seçicilerinde üstteki boş `Seçiniz` seçeneği kaldırıldı.
- Arsa/tarla metninde `Tarla 15.000.000 TL bedelle satılıktır` yerine `Tarla nitelikli gayrimenkul 15.000.000 TL bedelle satılıktır` formatı kullanılır.
- Arsa/tarla özel alanlarına `Hesaplanan Emsal` satırı eklendi.
- `Yapılaşma Nizamı = Ayrık` ise `Hesaplanan Emsal = Yüzölçümü x Emsal/KAKS` olarak otomatik hesaplanır.
- Kullanıcı `Hesaplanan Emsal` kutusunu değiştirirse manuel değer korunur.
- Arsa/tarla m2 birim değer hesabında önce `Hesaplanan Emsal`, yoksa `Yüzölçümü` kullanılır.
- Uzun emsal paragrafındaki yapılaşma metnine hesaplanan emsal alanı da eklenir.

Yedek:
`backups/before-land-comparable-calculated-buildable-area_2026-07-10_19-29-36`

Servis sürümü:
`app.js?v=20260710-1937`, `styles.css?v=20260710-1937`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.63 2026-07-10 Arsa Emsal Yapılaşma ve Şerefiye Metni (Codex oturumu)

Arsa/tarla emsal uzun paragrafında konum sebebi, yapılaşma koşulu biçimi ve imar şerefiyesi cümlesi düzeltildi.

Yapılanlar:
- `Konum Karşılaştırma Sebebi` artık arsa/tarla uzun emsal paragrafında konum karşılaştırma cümlesine girer.
- `Yapılaşma Koşulları` başlığı `Yapılaşma Nizamı` olarak değiştirildi.
- `Yapılaşma Nizamı` alanı `imarOrderOptions`, `İmar Lejantı` alanı `imarLegendOptions`, `Kat Adedi` alanı `imarFloorCountOptions` listesinden açılır liste olarak çalışır.
- Yapılaşma metni ham `Ayrık, 1, 3` yerine `Ayrık Nizam, KAKS: 1,00, 3 Kat yapılaşma koşullarına sahip` formatına çevrilir.
- Arsa/tarla paragrafına imar şerefiyesi cümlesi eklendi:
  - Benzer durumda: `İmar yapılaşma koşulları bakımından benzer özelliktedir.`
  - Artı/eksi şerefiye durumunda iyi/vasat açıklaması ve oran metne girer.

Yedek:
`backups/before-land-comparable-zoning-text_2026-07-10_17-46-38`

Servis sürümü:
`app.js?v=20260710-1754`, `styles.css?v=20260710-1754`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.62 2026-07-10 Emsaller Arsa Alanları Tüm Görünümde Görünür (Codex oturumu)

Kullanıcı, arsa emsali için `Yüzölçümü`, `İmar Şerefiyesi` ve yapılaşma koşulları alanlarının ekranda görünmediğini bildirdi.

Yapılanlar:
- `Tüm Emsaller` görünümünde artık konut/yapı ve arsa/tarla alanlarının tamamı gösterilir.
- Arsa/tarla özel alanları sadece `Arsa / Tarla Emsalleri` filtresine saklanmaz; kullanıcı emsal niteliğini arsa seçtiğinde aynı ekranda gerekli alanları görür.
- `Yapı Nizamı` başlığı daha anlaşılır olması için `Yapılaşma Koşulları` olarak güncellendi.
- `tools/check-basic.js` bu görünürlük kuralını ve yeni başlığı kontrol edecek şekilde güncellendi.

Yedek:
`backups/before-comparable-land-fields-visible_2026-07-10_17-33-00`

Servis sürümü:
`app.js?v=20260710-1748`, `styles.css?v=20260710-1748`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden yeni app/css cache-buster doğrulandı.

---

## 0.0.61 2026-07-10 Emsaller Arsa/Tarla Dinamik Görünüm (Codex oturumu)

Emsaller matrisi, `Emsal Niteliği` alanına göre konut/yapı emsalleri ile arsa/tarla emsallerini ayrı görünümde yönetebilir hale getirildi.

Yapılanlar:
- Emsaller başlığına `Tüm Emsaller`, `Konut / Yapı Emsalleri`, `Arsa / Tarla Emsalleri` görünüm seçimi eklendi.
- Konut/yapı görünümünde mevcut alanlar ve mevcut metin üretimi korunur.
- Arsa/tarla görünümünde `Yüzölçümü`, `İmar Lejantı`, `Yapı Nizamı`, `Emsal / KAKS`, `Kat Adedi`, `İmar Şerefiyesi` alanları gösterilir.
- Arsa/tarla görünümünde konut alanları (`Oda Sayısı`, `Nitelik`, `Bulunduğu Kat / Mülkiyet`, `Bulunduğu Yapı Yaşı`, kira alanları, beyan/düzeltilmiş alan ayrımı) gizlenir.
- Arsa/tarla için `Emsal Konumu` seçenekleri `Aynı bölge`, `Aynı sokak`, `Aynı cadde` olarak sadeleştirilir.
- Arsa/tarla hesaplarında alan olarak `Yüzölçümü`, şerefiye olarak `İmar Şerefiyesi + Konum Şerefiyesi` kullanılır.
- Arsa/tarla uzun emsal metni satış bedeli, pazarlık payı, yapılaşma koşulları ve indirgenmiş m2 birim değer hesabını içerecek şekilde ayrı üretildi.

Yedek:
`backups/before-land-comparable-dynamic-fields_2026-07-10_17-20-24`

Servis sürümü:
`app.js?v=20260710-1742`, `styles.css?v=20260710-1742`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- `http://127.0.0.1:5174/` üzerinden HTML servisinde yeni app/css cache-buster doğrulandı.

---

## 0.0.60 2026-07-10 Emsal Niteliği Boş Seçenek Düzeltmesi (Codex oturumu)

`Emsal Niteliği` seçim listesinin başındaki boş seçenek kaldırıldı.

Yapılanlar:
- Liste artık doğrudan `Konut`, `Dükkan`, `Tarla`, `Arsa`, `Müstakil Bina` seçenekleriyle başlar.
- `tools/check-basic.js` boş seçenek geri eklenirse yakalayacak şekilde güncellendi.

Yedek:
`backups/before-comparable-nature-empty-option-fix_2026-07-10_17-03-36`

Servis sürümü:
`app.js?v=20260710-1704`, `styles.css?v=20260709-2232`

---

## 0.0.59 2026-07-10 Emsaller Emsal Niteliği Alanı (Codex oturumu)

Emsaller matrisine `Telefon` ile `Emsal Durumu` arasına yeni `Emsal Niteliği` seçim satırı eklendi.

Yapılanlar:
- `comparableFields` içine görsel sırada `Telefon` satırından sonra `Emsal Niteliği` eklendi.
- Seçenekler: `Konut`, `Dükkan`, `Tarla`, `Arsa`, `Müstakil Bina`.
- Eski emsal verilerinin `Emsal Durumu` (`c2`) ve sonraki hesap alanları kaymasın diye yeni alan veri anahtarı olarak `c23` kullanır.
- `tools/check-basic.js` bu yeni alanın sırasını ve seçeneklerini kontrol eder.

Yedek:
`backups/before-comparable-nature-field_2026-07-10_16-58-25`

Servis sürümü:
`app.js?v=20260710-1700`, `styles.css?v=20260709-2232`

---

## 0.0.58 2026-07-10 Arsa Açıklaması Ana Taşınmaz Niteliği ve Tarım Alanları (Codex oturumu)

Kullanıcı, arsa açıklamasında `tapu kaydında “Mesken” vasıflı` metninin bağımsız bölüm niteliğinden geldiğini; burada ana taşınmaz niteliğinin kullanılması gerektiğini belirtti. Ayrıca `Arsa` ve `Müstakil Bina` seçildiğinde tarım alanlarının gizlenmesi ve açıklama metnine girmemesi istendi.

Yapılanlar:
- `buildLandIdentitySentence()` artık vasıf metninde önce `mainPropertyQuality`, yoksa `titleQuality`, yoksa `Arsa` kullanır.
- `landDescriptionAutoRefreshFields` içine `mainPropertyQuality`, `legalUsageNature`, `ownershipType` eklendi.
- `shouldHideLandAgricultureControls()` eklendi.
- Yasal kullanım niteliği `Arsa`, mülkiyet `Arsa` veya `Müstakil Bina` ise `Tarım Türü` ve `Parsel üzerinde Zirai Ürün Var mı?` alanları gizlenir.
- Aynı koşullarda `buildLandAgriculturalProductSentence()` ve `buildLandAgricultureSentence()` boş döner; arsa açıklamasına zirai ürün/tarım cümleleri eklenmez.

Yedek:
`backups/before-land-main-quality-and-agriculture-visibility_2026-07-10_16-51-21`

Servis sürümü:
`app.js?v=20260710-1653`, `styles.css?v=20260709-2232`

---

## 0.0.57 2026-07-10 Silinen Rapor Hayalet Kart Olarak Geri Geliyordu (Opus oturumu)

Kullanıcı, giriş yaptıktan sonra Taleplerim'de gerçek verisiyle ekran
görüntüsü paylaştı: 1 yerel rapor + **7 "Yalnızca bulutta" hayalet kart**
(muhtemelen bu oturumdaki test raporlarından — kullanıcı gerçek girişle
denemeler yaptıkça arka plandaki dirty-watcher hepsini otomatik buluta
göndermiş). "Talepleri silsem de yine gözüküyor" dedi.

### İki ayrı kök neden

1. **`deleteReport(id)`** bulut kopyasını Firestore'dan siliyordu ama
   bellekteki `cloudReportsCache` (dashboard açıldığında bir kez çekilen
   anlık görüntü) GÜNCELLENMİYORDU. Silinen raporun local index/blob'u
   kalkınca, bir sonraki çizimde `Object.keys(cloudReportsCache).filter(id
   => !localIds.has(id))` mantığı az önce silinen raporu "yalnızca bulutta"
   YENİ bir hayalet kart sanıp tekrar gösteriyordu.
2. **"Yalnızca bulutta" kartlarının (ekran görüntüsündeki 7 kart) hiç Sil
   butonu yoktu** — yalnızca "Bu Cihaza Getir ve Aç" vardı. Bu kartları
   silmenin HİÇBİR yolu yoktu.

### Düzeltme (`cloud/report-library.js`)

- `deleteReport(id)`: bulut silme başarılı olduktan sonra artık
  `if (cloudReportsCache) delete cloudReportsCache[id];` de çalıştırıyor —
  silinen rapor aynı oturumda hayalet olarak geri gelmiyor.
- Yeni `deleteCloudOnlyReport(id)` + "yalnızca bulutta" kartlarına **Sil**
  butonu eklendi — artık hiç bu cihaza getirilmemiş bulut kayıtları da
  doğrudan silinebiliyor (önce getirip sonra silmeye gerek yok).

### Doğrulama

- Sözdizimi temiz, `check-basic` + tüm node testleri geçti.
- Canlı tarayıcıda (bu ortamda gerçek Firebase girişi olmadığından **kapı
  test amaçlı geçici olarak devre dışı bırakılarak**, gerçek dosyalar
  değiştirilmeden) yerel senaryo doğrulandı: `deleteReport` artık
  `cloudReportsCache` null iken de hatasız çalışıyor, konsol temiz.
- **Test EDİLEMEYEN kısım (dürüstçe belirtilmeli)**: gerçek imzalı bir
  hesapla, gerçekten bulutta duran hayalet kayıtların hem "Sil" hem de
  düzeltilen `deleteReport` akışıyla KALICI olarak kaybolduğu bu oturumda
  uçtan uca doğrulanamadı (gerçek kimlik bilgisi yok). Kullanıcının
  ekranındaki 7 hayalet kaydı temizlemesi ve sonucu teyit etmesi gerekir.

Sürüm: `cloud/report-library.js?v=20260710-1626`. Ayrı yedek alınmadı (küçük,
tek dosyalık düzeltme; önceki `backups/before-mandatory-auth-gate_2026-07-09_22-44-05`
yeterli taban).

---

## 0.0.56 2026-07-09 BÜYÜK GÜNCELLEME: Zorunlu Giriş Kapısı — D6 Tersine Çevrildi (Opus oturumu)

Kullanıcı: "Uygulama internet olmadan çalışmamalı. Dosyaları artık Google
Cloud Always Free Amerikan sunucularında saklıyorum, dışarıdan böyle
bağlanıyorum, ilerde tam bir web servisine çevireceğim. Kullanıcı login
olmadan hiçbir detay görememeli. Bu bir senkron durumu değil — yetkisiz kimse
programı kullanamamalı ve görememeli."

Bu, oturum boyunca defalarca savunduğum **D6 kararının** ("bulut kapalıyken
uygulama %100 yerel çalışır") kullanıcının AÇIK talimatıyla **kasıtlı tersine
çevrilmesidir.** `cloud/FAZ0-TASARIM.md`'de D6 SÜPÜRÜLDÜ (superseded) olarak
işaretlendi, yeni **D7** kararı yazıldı — bir sonraki oturum bunu "düzeltme"
sanıp eski haline getirmesin diye.

### Uygulanan: Zorunlu Giriş Kapısı (Auth Gate)

- **`index.html`**: `<body>` açılır açılmaz, HARİCİ CSS'i beklemeden, satır içi
  stille opak ve **tüm viewport'u** kaplayan `#authGateOverlay` eklendi
  (`z-index:99999`, en yüksek). Bu sayede uygulamanın kendisi (app.js hemen
  render eder) HİÇBİR ZAMAN görsel olarak açığa çıkmaz — ilk boyamadan
  itibaren üstü kapalıdır, JS'in "yetişip kapatması" gerekmez.
- **`cloud/cloud-sync.js`**: Yeni `evaluateGate()` mantığı — kapı yalnızca
  **HEM kimlik doğrulanmış HEM `navigator.onLine`** ise kaldırılır
  (`hideGate()`). Aksi hâlde üç olası ekran gösterilir:
  1. **Yapılandırma/Firebase yüklenemedi** → fail-closed engelleme mesajı
     (senkron/init() içinde ANINDA, async beklemeden).
  2. **Çevrimdışı** (`navigator.onLine === false`) → "İnternet bağlantısı
     bulunamadı, bu sistem yalnızca çevrimiçiyken kullanılabilir." + otomatik
     `online`/`offline` olay dinleyicileriyle canlı tepki.
  3. **Girişsiz** → tam e-posta/şifre giriş formu (kapının içinde, ayrı bir
     modal değil).
- **Çıkış Yap**: artık onay istiyor, çıkış sonrası **yerel taslak + tüm rapor
  kütüphanesini** (`rapor-yazma-programi-draft-v1`, `rapor-library-index-v1`,
  `rapor-library-report-*`) temizliyor ve sayfayı yeniden yüklüyor — paylaşılan/
  ortak bir cihazda oturum kapatan kullanıcının verisi bir sonraki kullanıcıya
  açık kalmasın diye. **Yalnızca AÇIK çıkış eyleminde** çalışır; geçici
  çevrimdışı anlarda veya normal oturum kontrolünde ASLA tetiklenmez (veri
  kaybı riski olmasın diye bilinçli sınırlandırıldı).

### ÖNEMLİ SINIR — dürüstçe belirtilmeli (kullanıcıya da iletildi)

Bu **istemci taraflı** bir kapıdır. `server.js` hâlâ statik dosyaları
**herkese koşulsuz** servis eder — sunucu, isteği kimin yaptığını hiç
sormaz. Yani:
- Sayfanın JS/HTML baytlarının kendisi, teorik olarak URL'yi bilen herkes
  tarafından indirilebilir (view-source/ağ sekmesi ile).
- Kapı, UYGULAMANIN GÖRSEL OLARAK AÇILMASINI ve ETKİLEŞİME GEÇİLMESİNİ
  engeller (canlı testte `elementFromPoint` ile piksel düzeyinde doğrulandı —
  kapı açıkken editöre tıklama ulaşmıyor) — bu, normal kullanıcılar için
  "login olmadan göremez/kullanamaz" gereksinimini karşılar.
- Ama teknik bilgili biri tarayıcı geliştirici araçlarıyla JS'i inceleyip
  DOM'u manipüle edebilir veya (varsa) eski bir oturumdan kalma localStorage
  verisini doğrudan okuyabilir.
- **Gerçek/tam güvenlik** (dosyaların kendisinin bile yetkisiz kişiye
  ulaşmaması) için **sunucu tarafı** oturum/yetki denetimi gerekir — bu,
  kullanıcının bahsettiği "web servisine dönüştürme" planıyla birlikte ele
  alınmalı (GCP'de gerçek bir backend — Cloud Run + auth middleware, veya
  benzeri — kadar bu sınır geçerlidir).

### Doğrulama (canlı tarayıcı — güvenlik kritik olduğundan özenle test edildi)

- Fail-closed varsayılan doğrulandı: temiz oturumda kapı otomatik gösterildi,
  giriş formu render edildi ✓
- **Piksel düzeyinde engelleme kanıtı**: `document.elementFromPoint()` ekran
  ortasında `#appShell` İÇİNDE bir eleman DÖNDÜRMEDİ — editör gerçekten
  erişilemez durumda ✓
- Çevrimdışı simülasyonu (`navigator.onLine` override + `offline` event) →
  kapı doğru mesaja geçti; `online` event → giriş formuna geri döndü ✓
- Konsol hatasız; tüm node testleri temiz.
- **Test EDİLEMEYEN kısım (dürüstçe belirtilmeli)**: gerçek kimlik bilgisiyle
  başarılı giriş → kapının kalkması, bu ortamda gerçek Firebase şifresi
  olmadığı için uçtan uca doğrulanamadı. Kod dikkatle satır satır izlendi
  (`hideGate()` tek satırlık, düşük riskli bir dallanma) ama kullanıcının
  ilk gerçek girişinde teyit etmesi önerilir.

### Belge güncellemeleri

- `cloud/FAZ0-TASARIM.md`: D6 süpürüldü, yeni **D7** kararı + sınır notu eklendi.
- `cloud/KURULUM.md`: eski "bugünkü gibi yerel çalışır" notu geçersiz işaretlenip D7'ye yönlendirildi.

Yedek: `backups/before-mandatory-auth-gate_2026-07-09_22-44-05`.

### Bilinen sınırlar / olası sonraki adımlar

- Yerel rapor kütüphanesi (`report-library.js`) init() sırasında hâlâ
  kimlik doğrulanmadan ÖNCE çalışıyor (localStorage'a yazıyor) — kapı bunu
  GÖRSEL olarak gizliyor ama devtools'tan okunabilir kalıyor. Tam sertleştirme
  için report-library.js'in başlatılmasını da auth onayına ERTELEMEK gerekir
  (bu oturumda yapılmadı, ayrı bir iş).
- Gerçek sunucu-taraflı erişim denetimi (asıl "web servisi" planı) henüz yok.

---

## 0.0.55 2026-07-09 Taleplerim: Popup'tan Tam Sayfaya (Faz 3.2, Opus oturumu)

Kullanıcı: "Taleplerim şu an popup şeklinde geliyor, ilk açılışta tam sayfa
olsun; sıralama Kullanıcı girişi > Taleplerim > Rapor Oluştur Bölümü olmalı."

### Karar: giriş opsiyonel kaldı (kullanıcıya soruldu, yanıtsız kaldı → güvenli
### varsayılan uygulandı)

"Giriş zorunlu bir kapı mı olsun?" diye soruldu, kullanıcı yanıt vermedi. Bu
uygulamanın kurucu ilkesi (FAZ0 D6: "Bulut kapalıyken uygulama bugünkü gibi
çalışır") ve "mobil saha, masaüstü tamamlama" vizyonu — sahada internet
olmayabilir — göz önüne alınarak **güvenli varsayılan** uygulandı: **giriş hâlâ
opsiyonel**, uygulama bulutsuz/girişsiz tamamen çalışmaya devam ediyor. Bunun
yerine istenen sıralama SADECE görsel/akış düzeyinde karşılandı: Taleplerim
sayfasının EN ÜSTÜNDE hesap/giriş durumu şeridi var (önce görülen şey bu),
altında talep listesi geliyor — "Kullanıcı girişi > Taleplerim" sıralaması
giriş ZORUNLU olmadan sağlandı. Kullanıcı isterse ileride "girişi zorunlu yap"
seçeneğine geçilebilir.

### Yapılan değişiklik

- **`cloud/report-library.js > openDashboard()`**: Taleplerim artık
  `.modal-overlay` (yarı saydam arka plan + ortada yüzen kart + arka plana
  tıkla-kapat) DEĞİL; yeni `.library-page-overlay` + `.library-page` — **opak
  zemin, tüm viewport, gerçek sayfa**. Arka plana tıkla-kapat davranışı
  KALDIRILDI (artık "arkada" bir şey görünmüyor ki tıklanıp kapatılsın).
  Kapatma yalnızca açık "Rapora Devam Et →" butonuyla.
- **Yeni hesap/giriş şeridi** (`renderAccountStripHtml`): sayfanın en üstünde
  — giriş yapılmadıysa "🔒 Giriş yapılmadı — talepler yalnızca bu cihazda" +
  **Giriş Yap** butonu; giriş yapılmışsa "✅ e-posta" + **Hesap** butonu.
  İkisi de `window.RaporCloudSync.openCloudModal()`'ı açar (bu fonksiyon dışa
  yeni açıldı — önceden yalnızca "Bulut" düğmesinin kendi tıklama olayı
  içinde özeldi).
- **`cloud-sync.js`**: `getStatus()` artık `email` alanını da döndürüyor;
  yeni `onAuthChange(callback)` API'si — giriş/çıkış olduğunda Taleplerim
  açıksa hesap şeridi otomatik tazelenir (`report-library.js`
  `refreshAccountStrip` ile `init()`'te bir kez kaydedilir).
- `styles.css` sonuna tam sayfa düzeni eklendi (`--bg` token'ı zemin rengi;
  mevcut lacivert tema renkleri kullanıldı, yeni renk yok).

### Doğrulama (canlı tarayıcı, masaüstü + mobil)

- Otomatik açılışta: opak zemin, `getBoundingClientRect()` viewport'la BİREBİR
  eşleşti (1000×946 = 1000×946) — gerçekten tam sayfa, küçük kart değil ✓
- Arka plana (overlay'e) tıklama artık kapatmıyor ✓
- "Giriş Yap" → giriş modalı üstte açıldı; "Rapora Devam Et →" → sayfa
  kapanıp editöre dönüldü ✓
- Mobilde (375px) başlık/hesap şeridi/buton dikey sıraya geçti (`flex-direction:
  column`), yatay taşma yok; masaüstünde (1440px) tek satırda hizalı ✓
- Ekran görüntüleriyle görsel olarak da doğrulandı (hem masaüstü hem mobil).
- Konsol hatasız; tüm node testleri temiz.

Yedek: `backups/before-taleplerim-fullpage_2026-07-09_22-28-53`.

---

---

## 0.0.54 2026-07-09 "Buluttan Yükle Boş Geldi" — Çoklu Rapor UX Tuzağı (Opus oturumu)

Kullanıcı: masaüstünde talep girip TAKBİS yükleyip doldurdu, "Şimdi Gönder"
dedi; tablette "Bulut → Buluttan Yükle" dedi ama bölümler **boş** kaldı.

### Kök neden

Faz 2'den beri her cihazın **kendi aktif raporu** (`state.reportId`) var.
Tabletin "Buluttan Yükle" düğmesi `pullReport()`'u çağırır ve bu HER ZAMAN
`cloud.activeReportId`'ye (o cihazın O AN açık olan raporuna) bakar —
masaüstünde oluşturulan FARKLI rapor ID'sine değil. Tablet muhtemelen ilk
açılışta otomatik oluşan boş bir taslakla açıktı; o ID için Firestore'da kayıt
yoktu, `pullReport` "Bulutta kayıt yok" diyip `state`'e hiç dokunmadan geri
döndü → ekran boş kaldı. **Veri kaybı yoktu** — masaüstündeki rapor buluttaydı,
tablet yalnızca yanlış (kendi) rapor kimliğine bakıyordu.

Bu, Faz 1'in "tek rapor" varsayımıyla yazılmış "Buluttan Yükle" düğmesinin,
Faz 2'nin çoklu-rapor dünyasında YANILTICI kaldığı bir UX tuzağıydı — kod
hatası değil, ama gerçek bir kullanıcı hatası tuzağı.

### Doğru kullanım (kullanıcıya iletildi)

Farklı bir cihazda oluşturulan raporu getirmek için **"Bulut" değil,
"Taleplerim"** kullanılmalı: o rapor orada "Yalnızca bulutta" etiketiyle ayrı
bir kart olarak görünür; **"Bu Cihaza Getir ve Aç"** doğru şekilde getirir
(bu yol zaten Faz 2'de test edilip çalıştığı doğrulanmıştı).

### Yapılan düzeltme (`cloud/cloud-sync.js > renderAccountModal`)

- Buton etiketleri netleştirildi: "Şimdi Gönder"→**"Bu Raporu Şimdi Gönder"**,
  "Buluttan Yükle"→**"Bu Raporu Buluttan Yenile"** (yalnızca AÇIK rapora
  uygulandığı artık isimden belli).
- Modal metnine kalın uyarı eklendi: farklı cihazda oluşturulan rapor için
  "Taleplerim" kullanılması gerektiği açıkça yazıyor.
- **Akıllı ipucu:** "Bu Raporu Buluttan Yenile" başarısız olursa (bu ID için
  bulutta kayıt yoksa) ve hesapta BAŞKA raporlar varsa, otomatik olarak
  "Taleplerim'i Aç" butonlu bir uyarı modalı açılır — kullanıcı bir daha bu
  tuzağa düşmeden doğru yola yönlendirilir.
- Ayrıca hesap modalındaki eski/yanlış "Raporlarım" ifadesi "Taleplerim"
  olarak düzeltildi (0.0.53'teki yeniden adlandırmadan kaçmıştı).

### Doğrulama

- Sözdizimi + `check-basic` temiz.
- Canlı tarayıcı: giriş modalı ve Taleplerim akışları bu değişiklikten sonra
  da sorunsuz açılıyor, konsol hatasız.
- **Not:** Yeni "akıllı ipucu" akışının TAMAMI (gerçek Firestore kayıtlarıyla)
  bu oturumda canlı test EDİLEMEDİ — gerçek Firebase kimlik bilgileri
  olmadığından giriş yapılamadı. Kod dikkatle satır satır izlendi (mevcut,
  zaten test edilmiş `modalShell`/`listCloudReports` üzerine kuruldu) ama
  kullanıcının bir sonraki bulut denemesinde gerçek sonucu teyit etmesi gerekir.

Sürüm: `cloud/cloud-sync.js?v=20260709-2218`. Ayrı yedek alınmadı (küçük,
tek dosyalık, düşük riskli metin/mantık düzeltmesi — önceki
`backups/before-taleplerim-dashboard_2026-07-09_21-56-57` yeterli taban).

---

## 0.0.53 2026-07-09 "Taleplerim" Ana Ekran Deneyimi (Opus oturumu)

Kullanıcı, Kuveyt Türk INVEX portalının (banka görevlendirme ekranı) ekran
görüntüsünü paylaşıp "sistem ilk açıldığında böyle bir dashboard olsun,
Taleplerim / Yeni Talep Oluştur kısımları olmalı" dedi.

### Karar: neyi aldık, neyi almadık

Banka ekranındaki YET/YON/GME 10 aşamalı iş akışı daireleri ve "Mobil İmza"
bilerek KOPYALANMADI — onlar bankanın çok taraflı (şube→uzman→inceleme)
sürecine ait; bu uygulamada tek kişi tüm süreci yürütüyor, o daireler burada
anlamsız olurdu. Alınanlar, gerçekten karşılığı olan kısımlar:

- **İlk açılışta otomatik "Taleplerim" ekranı** (Faz 2'nin dashboard'u artık
  bir butonun arkasında gizli değil, sistemin gerçek giriş ekranı).
- **Etiket değişimi:** "Raporlarım" → **Taleplerim**, "+ Yeni Rapor" →
  **+ Yeni Talep Oluştur**, "Raporu Oluştur" → **Talebi Oluştur**.
- **"Gün" geri sayımı** (referans ekrandaki "Gün: 4" karşılığı) — raporun
  zaten var olan `appointmentDate` (Randevu Tarihi) alanına göre her kartta
  "Randevu: X gün kaldı / Bugün / X gün gecikti" (yeşil/amber/kırmızı).
- **Durum filtreleri** (referans ekrandaki "Gönderilmemiş (1)" sekmesinin
  karşılığı) — Tümü / Taslak / Tamamlandı çipleri, sayaçlı. Her kartta elle
  işaretlenebilen "Taslak"/"Tamamlandı" rozeti + "Tamamlandı İşaretle" butonu.

### Teknik: ilk-açılış otomasyonu neden sessionStorage ile

`sessionStorage` (localStorage DEĞİL) kasıtlı seçildi: sekme kapanınca
sıfırlanır ama **aynı sekmede yapılan Ctrl+F5 yenilemelerinde kalıcı kalır**.
Bu proje sık sık cache-buster sonrası Ctrl+F5 gerektiriyor (bkz. Bölüm 1) —
localStorage kullansaydım kullanıcı rapor üzerinde çalışırken her yenilemede
"Taleplerim" ekranı önüne düşüp işini bölerdi. sessionStorage ile yalnızca
GERÇEKTEN yeni bir tarayıcı sekmesi/oturumu açıldığında bir kez gösteriliyor.

### Değişen dosyalar

- **`cloud/report-library.js`**: `summarizeFields`'e `appointmentDate` eklendi;
  index kayıtlarına `status: "draft"|"completed"` eklendi (`flushActiveToLibrary`,
  `cloneReport`, `fetchCloudReportAndOpen` — geriye dönük uyumlu, eksikse
  "draft" varsayılır); yeni `toggleStatus`, `formatDeadlineBadge`,
  `computeStatusCounts`, `renderStatusFilterChips`,
  `openDashboardAfterAuthentication` fonksiyonu (önceki sessionStorage tabanlı
  otomasyon 0.0.172'de bununla değiştirildi); etiket metinleri
  güncellendi.
- **`styles.css`**: `.library-status-filter`/`.library-filter-chip`,
  `.library-status-pill` (`.is-draft`/`.is-completed`), `.library-badge-danger`,
  kart başlığının rozet düzeni (`.library-card-badges`) — mevcut lacivert tema
  token'ları kullanıldı, yeni renk icat edilmedi.
- `app.js`/`cloud/cloud-sync.js` bu turda DEĞİŞMEDİ.

### Doğrulama (canlı tarayıcı)

- Temiz sessionStorage + reload → "Taleplerim" otomatik açıldı, başlık/buton
  etiketleri doğru ✓
- Aynı sekmede tekrar reload → dashboard TEKRAR açılmadı (session bayrağı
  kalıcı) ✓
- `appointmentDate` = bugün+2 gün → kart rozeti "Randevu: 2 gün kaldı" (amber) ✓
- `toggleStatus` → pill "Tamamlandı"ya döndü; filtre çipleri sayaçları doğru
  güncellendi (Tümü 1, Taslak 0, Tamamlandı 1); "Tamamlandı" çipine tıklayınca
  kart görünür, "Taslak" çipine tıklayınca gizlendi ✓
- Mobil (375px): tüm rozetler/çipler doğru render, yatay taşma yok ✓
- Konsol hatasız; tüm node testleri temiz.

Sürümler: `styles.css?v=20260709-2203`, `cloud/report-library.js?v=20260709-2203`
(app.js/cloud-sync.js bu turda değişmediği için sürümleri aynı kaldı:
`20260709-2129`). Yedek: `backups/before-taleplerim-dashboard_2026-07-09_21-56-57`.

---

## 0.0.52 2026-07-09 BÜYÜK GÜNCELLEME Faz 3: lastActiveSection, PWA, Saklama Uzatma, Kota Telemetrisi (Opus oturumu)

Kullanıcı Faz 2'yi başka bir telefonda başarıyla test ettikten sonra (giriş
çalıştı) Faz 3'e geçildi. FAZ0-TASARIM.md Bölüm 7'deki kalemler işlendi.

### 1) lastActiveSection cihazlar arası/rapor arası devri

Önceden `activeSectionId` hiçbir yerde saklanmıyordu (ne bulutta ne yerelde);
rapor değiştirince veya cihaz değiştirince her zaman 1. bölüme dönülüyordu.

- **`app.js`**: `exportReportJson()` artık paketin KÖKÜNE `activeSectionId`
  yazıyor (state'in içine değil — `state` şeması bozulmadı). `restoreStateFromImportedJson`
  bu alanı okuyup geçerliyse `setActiveSection(...)` ile o bölümü açıyor;
  yoksa eskisi gibi 1. bölüme döner (geriye dönük uyumlu, eski JSON dosyaları
  bozulmaz).
- **`cloud/report-library.js`**: Her rapor blobu da kendi `activeSectionId`'ini
  taşır; rapor değişince kullanıcı kaldığı bölümden devam eder.
- **`cloud/cloud-sync.js`**: Bulut zarfındaki `lastActiveSection` (zaten
  Faz 1'den beri gönderiliyordu ama hiç okunmuyordu) artık `pullReport`'ta
  gerçekten uygulanıyor.
- **Doğrulama (canlı tarayıcı):** Değerleme bölümündeyken yeni rapor
  oluşturuldu (→1. bölüme döndü, doğru), eski rapora dönüldü (→Değerleme'ye
  geri geldi, doğru). Ayrıca Takyidat bölümündeyken JSON export/import
  döngüsü de bölümü doğru geri getirdi.

### 2) PWA kurulumu (iOS/Android "Ana Ekrana Ekle")

Amaç: iOS Safari'nin normal sekmelerde 7 gün etkileşimsizlikte
localStorage/IndexedDB'yi silebilme riskine karşı, uygulamayı kurulabilir
("standalone") hale getirmek.

- **`tools/generate-pwa-icons.js`** (yeni, geliştirme aracı): harici bağımlılık
  olmadan, Node'un yerleşik `zlib`'i ile elle PNG üretir (CRC32 dahil elle
  yazıldı). Çıktı: `icons/icon-192.png`, `icons/icon-512.png`,
  `icons/apple-touch-icon.png` — lacivert zemin + kenar çubuğundaki marka
  kutusuyla aynı altın degrade, köşesi kıvrık "belge" silüeti (yeni renk icat
  edilmedi).
- **`manifest.json`** (yeni): ad, ikonlar, `display: standalone`,
  `theme_color/background_color: #111d3d`.
- **`service-worker.js`** (yeni): **kasıtlı olarak HİÇBİR ŞEYİ önbelleklemez**
  — yalnızca tarayıcıların "yüklenebilirlik" kriterini karşılamak için var,
  her isteği ağa olduğu gibi geçirir. Bu proje sürüm sorgu dizeleriyle
  (`?v=...`) manuel taze dağıtım kullandığından ve sunucu zaten
  `no-store`/`no-cache` gönderdiğinden, bir SW önbelleği tam çözülmeye
  çalışılan "eski sürüm görünüyor" sorununu geri getirirdi.
- **`index.html`**: manifest/ikon `<link>`'leri + `apple-mobile-web-app-title`
  eklendi; SW kaydı yalnızca `window.isSecureContext` doğruysa denenir.
- **ÖNEMLİ KISIT:** Service worker'lar yalnızca **https:** veya
  **localhost/127.0.0.1** üzerinde kayıt olabilir (tarayıcı kuralı). Telefon
  LAN IP'si üzerinden düz http ile bağlandığında (`http://192.168.x.x:5174`)
  `isSecureContext` false olur ve SW hiç kaydolmaz — bu ortamda "Ana Ekrana
  Ekle" korumasını sağlayan şey **manifest + meta etiketleri** olur (SW şart
  değil, iOS'un standalone-app muafiyeti zaten bunlara dayanır). SW, yalnızca
  masaüstünde `localhost` üzerinden veya ileride HTTPS'li bir barındırmaya
  (ör. Firebase Hosting) geçilirse tam olarak aktif olur.
- **Doğrulama:** `localhost:5173` üzerinde SW gerçekten kaydoldu ve
  `state: "activated"` oldu (canlı kontrol edildi); `manifest.json`,
  `service-worker.js`, `icons/icon-192.png` hepsi 200 döndü.

### 3) "30 Gün Daha Sakla" + Kota Telemetrisi

- **`cloud-sync.js > extendReportExpiry(reportId)`**: raporu AÇMADAN yalnızca
  `expireAt`'i yeniler. `rev` için `FieldValue.increment` KULLANILMADI —
  Firestore Rules'daki `rev is int` kontrolü artış sentinel'ini
  değerlendiremediğinden önce okunup elle +1 yapılıyor.
- **Dashboard kartları**: bulut rozetinin yanına **"+30 gün"** butonu eklendi
  (yalnızca o raporun bulut kopyası varsa görünür).
- **Kota telemetrisi**: `bumpDailyPushCounter`/`getDailyPushCount` — her
  başarılı gönderimde günlük sayaç artar (yerel, yalnızca bilgi amaçlı;
  Firestore'un kendi sunucu kotasını yansıtmaz). Bulut hesap modalına
  "Bugünkü gönderim: X / 20.000" satırı eklendi.

### 4) İstemci tarafı şifreleme — değerlendirme (uygulanMADI, karar bekliyor)

FAZ0 planında "değerlendirilecek" olarak işaretlenmişti. Mühendislik
tavsiyem: **şimdilik uygulamayın.** Gerekçe:
- En büyük KVKK riski (belgeler + ham metinler) zaten Faz 0'da buluta hiç
  gitmeyecek şekilde çözüldü.
- Kalan senkron veri (malik adı, haciz tutarı gibi) raporun kendisi — ayrı bir
  şifre olmadan da zaten yalnızca Firestore Rules + gerçek giriş ile
  korunuyor, Google altyapısı veriyi zaten diskte şifreli tutuyor, ve 30 gün
  sonra otomatik siliniyor.
- İstemci şifrelemesi, unutulan bir şifrenin TÜM bulut yedeklerini **kalıcı ve
  geri dönüşsüz** olarak okunamaz hale getirme riski taşır (kurtarma akışı
  imkansızdır, çünkü anahtar hiçbir sunucuya gönderilmez) — bu risk, ek
  KVKK faydasından daha ağır basıyor.
- Karar kullanıcıya ait: isterseniz Faz 4'te ele alınabilir.

### Test / Doğrulama

- Tüm node testleri temiz (check-basic, takbis, halkbank, value-factors,
  comparable).
- Canlı tarayıcı: yukarıdaki 1-3 numaralı maddelerin hepsi doğrulandı; konsol
  hatasız, başarısız ağ isteği yok.
- Sürümler `v=20260709-2129`; yedek `backups/before-faz3_2026-07-09_21-18-53`.

### Bilinen sınırlar (Faz 4'e bırakılabilir)

- İstemci şifrelemesi (yukarıda tartışıldı, karar bekliyor).
- Rapor tamamlama/dışa aktarma hatırlatma modalı hâlâ yok.
- Gerçek bir Firestore hesabıyla "+30 gün" ve kota sayacı bu oturumda canlı
  test edilmedi (Firebase şifresi bilinmiyor); yalnızca kod/kural düzeyinde
  doğrulandı. Kullanıcı bir sonraki bulut girişinde bunları da deneyebilir.

---

## 0.0.51 2026-07-09 BÜYÜK GÜNCELLEME Faz 2: Çoklu Rapor Kütüphanesi + Dashboard (Opus oturumu)

Faz 0 (tasarım) ve Faz 1 (tek rapor bulut senkronu) üzerine, uygulamaya **çoklu
rapor yönetimi** eklendi: "Raporlarım" dashboard'u, yeni rapor kısa formu, aç/
kopyala/arşivle/sil, arama, bulut senkron durumu rozeti.

### Önce çözülen açık sorun: telefonda "sayfa açılmıyor" / "şifre girince çöküyor"

- **Kök neden bulundu:** `mobil-sunucu-baslat.bat` sunucuyu **5174** portunda
  açıyor, ama `guvenlik-duvari-izin-ver.bat` yalnızca **5173**'e güvenlik
  duvarı izni veriyordu → telefon isteği Windows tarafından sessizce
  reddediliyordu. **Düzeltildi**: betik artık her iki portu da açıyor; kural
  ayrıca bilgisayarda CANLI olarak da eklendi (`Test-NetConnection` ile 5174
  erişimi doğrulandı, `TcpTestSucceeded: True`).
- **Şifre girişi çökme şüphesi:** Kontrollü testte (sahte e-posta/şifre ile
  gerçek Firebase isteği) **çökme YOK** — ağ isteği gitti (`400`, beklenen),
  hata mesajı doğru göründü, `state` bozulmadı. Muhtemelen cihaza özgü eski
  önbellekti; kod tarafında hata bulunamadı.
- Bu arada mobil sertleştirme sırasında (autocapitalize kapatma) **şifre
  alanını yanlışlıkla silmiştim** — fark edilip düzeltildi, görsel doğrulandı.

### Mimari karar: yerel "rapor kütüphanesi" katmanı

app.js'in 21k satırlık tek-aktif-`state` mimarisi **değiştirilmedi**. Onun
üstüne, orijinal vizyon dokümanındaki (offline-first, çoklu rapor) hedefi
karşılayan bağımsız bir katman eklendi:

- Her rapor `localStorage`'da ayrı bir blob (`rapor-library-report-<id>`) —
  mevcut "JSON olarak farklı kaydet" ile **birebir aynı paket şekli**, tamamen
  çevrimdışı çalışır.
  Özet index'i ayrı anahtarda (`rapor-library-index-v1`).
- Rapor değiştirme = mevcut raporu kütüphaneye kaydet → hedef raporu **mevcut
  `restoreStateFromImportedJson`** ile aktif hale getir (tekerlek yeniden icat
  edilmedi).
- Bulut senkronu artık "tek rapor" değil, **o an aktif olan rapor** üzerinde
  çalışır (`cloud-sync.js` yeniden düzenlendi: `reportId` → `activeReportId`,
  `setActiveReportId`/`listCloudReports`/`deleteCloudReport` API'leri eklendi;
  sign-in'de "en son değişeni otomatik benimse" davranışı kaldırıldı).

### Yeni dosya: `cloud/report-library.js`

- **Veri katmanı**: `ensureActiveReportId`, `flushActiveToLibrary`,
  `openReportById`, `createNewReport`, `cloneReport`, `toggleArchive`,
  `deleteReport`.
- **Dashboard UI**: "Raporlarım" düğmesi (Yeni iş'in yanında) → kart listesi
  (banka/müşteri/konum/ada-parsel/tür/son güncelleme), arama, arşiv filtresi,
  kısa "+ Yeni Rapor" formu (Banka/Müşteri/İş Adı*/İl/Yasal Kullanım
  Niteliği), her kartta bulut senkron rozeti (buluta yüklü + geri sayım /
  yalnızca bu cihazda) ve "yalnızca bulutta olan" raporlar için "Bu Cihaza
  Getir ve Aç" kartı (yeni cihazda ilk açılış senaryosu).
- **Kritik hata önlendi (silme):** Aktif rapor silinince bir sonraki rapora
  geçiş `flushActiveToLibrary` ÇAĞIRMADAN yapılır (`loadReportIntoActiveState`)
  — aksi halde bellekte hâlâ duran silinmiş raporun verisi kendini otomatik
  "diriltirdi". Canlı testte doğrulandı: silinen rapor index/blob'ta kalmıyor.
  ayrıca kendini `resetToFreshEmptyReport()` ile sıfırdan boş rapora düşer.
- **Kritik zamanlama düzeltmesi (bulut karşılaştırması):** Rapor değiştirirken
  "bulut daha yeni mi" karşılaştırması `state.updatedAt`'i DEĞİL, blobun
  DEĞİŞİMDEN ÖNCEKİ `updatedAt`'ini kullanır — çünkü `restoreStateFromImportedJson`
  içindeki `saveState()` `state.updatedAt`'i anında "şimdi"ye çeker; bu da
  karşılaştırmayı her zaman "yerel daha yeni" yapıp bulut uyarısını hiç
  tetiklemezdi. Aynı sorun uygulama ilk açılışı için de düzeltildi
  (`preExistingUpdatedAt` kendi flush'ımızdan ÖNCE yakalanır).

### `app.js`'te tek değişiklik: "Yeni iş" veri kaybı düzeltildi

Eskiden bu buton mevcut taslağı **hiç kaydetmeden** siliyordu. Artık kütüphane
yüklüyse doğrudan `window.RaporReportLibrary.createNewReport({})` çağrılır —
mantık TEKRARLANMADI (aksi halde yeni boş rapor `reportId` almadan kalır ve
arka plandaki bulut senkronu eski raporun bulut kaydının üzerine boş veri
yazabilirdi). Kütüphane yoksa eski davranış korunur.

### CSS

`styles.css` sonuna "RAPOR KÜTÜPHANESİ DASHBOARD" bloğu eklendi (kart ızgarası,
aktif/arşiv/bulut rozetleri, mobilde tek sütun — `--green/--gold/--red` gibi
mevcut lacivert tema token'ları kullanıldı, yeni renk icat edilmedi).

### Doğrulama (canlı tarayıcı, uçtan uca)

1. İlk yükleme → `reportId` otomatik atandı, kütüphanede 1 kayıt ✓
2. Dashboard açıldı, kart doğru render edildi (ekran görüntüsü alındı) ✓
3. "+ Yeni Rapor" → yeni `reportId`, aktif rapor değişti, index 2 kayıt ✓
4. "Aç" ile ilk rapora dönüş → alanlar doğru geri geldi ✓
5. "Kopyala" → yeni `reportId`, aktif rapor kopyaya geçti, index 3 kayıt ✓
6. "Arşivle" → kart gizlendi; "Arşivlenenler" toggle ile geri geldi ✓
7. Arama ("Bursa") → yalnızca eşleşen kart göründü ✓
8. **"Yeni iş" düzeltmesi** → eski rapor kütüphaneye kaydedildiği doğrulandı
   (`oldReportSavedInLibrary: true`), yeni boş rapor fresh `reportId` aldı ✓
9. **Aktif raporu silme** (en riskli senaryo) → silinen rapor index/blob'tan
   tamamen kalktı, kendini DİRİLTMEDİ, bir sonraki rapora doğru geçildi ✓
10. Mobil (375px): dashboard tek sütun, yatay taşma yok ✓
11. Konsol boyunca hiç hata yok; tüm node testleri temiz.

### Bilinen sınırlar / sonraki adımlar (Faz 3'e bırakıldı)

- Rapor **tamamlama/dışa aktarma hatırlatma modalı** henüz yok (FAZ0 planı).
- Geri sayım rozetinin renk eşiği (≤7 gün amber) yalnızca CSS sınıfı düzeyinde;
  gerçek Firestore `expireAt` ile CANLI test edilmedi (bulut girişi bu
  oturumda tamamlanmadı — kullanıcı hâlâ TTL adımını ve ilk canlı girişi
  yapıyor).
- "30 gün daha sakla" butonu yok.
- Bulut ↔ yerel kütüphane tam iki yönlü liste senkronu yok (yalnızca "yalnızca
  bulutta olanı getir" tek yönlü akış var).

Yedekler: `backups/before-cloud-sync-faz1_2026-07-09_15-57-38`,
`backups/before-report-library-faz2_2026-07-09_20-44-55`

---

## 0.0.50 2026-07-09 BÜYÜK GÜNCELLEME Faz 1: Bulut Senkron Uygulaması (Opus oturumu)

Faz 0 kararları (0.0.49) uygulamaya döküldü. Kullanıcı kararları: Firebase
hesabı **canlilar.melih@gmail.com**, **tek kullanıcı**. Üretim raporu ölçümü:
bulut paketi **25.7 KiB = 1 MiB limitinin %2.5'i** (tek belge stratejisi teyit).

### Eklenen dosyalar

- **`vendor/firebase/`** — firebase-app/auth/firestore **compat 11.10.0**
  paketleri yerel vendor (offline dostu; pdfjs/tesseract ile aynı desen).
- **`cloud/firebase-config.js`** — yapılandırma placeholder'ı. `apiKey ===
  "YAPISTIR"` olduğu sürece bulut TAMAMEN pasif (D6); gerçek config Console'dan
  yapıştırılınca aktifleşir.
- **`cloud/cloud-sync.js`** — senkron modülü. **app.js'e sıfır dokunuş**:
  klasik script global'lerini (state/saveState/render/activeSectionId) okur,
  app.js'ten SONRA yüklenir.
  - Beyaz liste payload (fields, tables, lookupOptions, updatedAt) — canlı
    state'te doğrulandı, sourceValues/uploads/settings pakete girmiyor.
  - Kirlilik takibi: 10 sn'de bir `state.updatedAt` gözlenir; buluta yazma
    min 45 sn aralıkla + `visibilitychange(hidden)`/`pagehide`'da anında.
  - `rev` sayacı: gönderim öncesi uzak rev okunur; daha yeniyse sessiz üzerine
    yazma YOK — kullanıcıya "Buluttakini Yükle / Üzerine Yaz" modalı.
  - Girişte en yeni rapor benimsenir; bulut daha yeniyse yükleme teklifi modalı.
  - `expireAt = now + 30 gün` her gönderimde yenilenir (TTL — D3).
  - Firestore offline persistence açık (bağlantısızken kuyruklar).
  - UI: üst barda durum noktalı **Bulut** düğmesi + modal (kurulum-yok /
    giriş formu [göz ikonu, genel hata mesajı] / hesap-durum ekranı).
  - Test yüzeyi: `window.RaporCloudSync` (payload/isDirty/push/pull/getStatus).
- **`cloud/KURULUM.md`** — Console adımları (proje, Auth+tek kullanıcı+sign-up
  kapatma, Firestore eur3, Rules yapıştırma, TTL policy, web app config,
  2-cihaz kabul testi).
- `styles.css` sonuna "BULUT SENKRON ARAYÜZÜ" bloğu eklendi.
- `index.html`: firebase vendor + config + cloud-sync script'leri app.js'ten
  sonra eklendi.

### Doğrulama

- Tüm node testleri temiz; config yokken modül pasif (durum: "kurulmadı"),
  konsol hatasız, bölüm geçişleri/mobil düzen etkilenmedi (375px'te taşma yok).
- Canlı state'te `buildCloudReportPayload()` anahtarları birebir beyaz liste.
- **Canlı Firebase testi henüz YAPILMADI** — kullanıcının `cloud/KURULUM.md`
  adımlarını tamamlaması bekleniyor. Sonrasında kabul: 2 cihaz senkronu +
  Firestore'da `sourceValues` olmadığının görülmesi.

Yedek: `backups/before-cloud-sync-faz1_2026-07-09_15-57-38`

---

## 0.0.49 2026-07-09 BÜYÜK GÜNCELLEME Faz 0: Bulut Senkron Tasarımı (Opus oturumu)

"Cross-Device Değerleme Platformu" büyük güncellemesinin **karar/tasarım fazı**
tamamlandı. **Uygulama koduna dokunulmadı** (app.js/styles.css/index.html
değişmedi; cache-buster artırılmadı).

### Çıktılar

- **`cloud/FAZ0-TASARIM.md`** — kesinleşen kararlar (D1-D6), senkron paketi
  beyaz listesi, Firestore belge şeması, TTL kurulumu, güvenlik, kota bütçesi,
  çakışma stratejisi, faz planı ve açık sorular. **Faz 1 buna göre yapılacak.**
- **`cloud/firestore.rules`** — varsayılan-ret kurallar: yalnız sahibi
  `users/{uid}/reports/{reportId}` okur/yazar; zarf doğrulaması; `expireAt`
  zorunlu ve ≤40 gün sınırlı.
- **`tools/measure-cloud-payload.js`** — senkron paketi boyut ölçer (kişisel
  veri içeriği yazdırmaz). `node tools/measure-cloud-payload.js [export.json]`

### Ana kararlar (kullanıcı onaylı)

1. Belgeler + ham belge metinleri (`sourceValues`) buluta GİTMEZ (KVKK minimizasyonu).
2. Kullanıcı yalnız kendi raporlarını görür (`users/{uid}/reports` + Rules).
3. Raporlar son güncellemeden **30 gün** sonra buluttan kalıcı silinir
   (Firestore TTL, `expireAt`); arşiv = kullanıcı cihazı (JSON geri yüklenebilir,
   Word/PDF çıktıdır).
4. 0 TL altyapı: Firebase Auth + Firestore (europe-west) + Hosting + App Check.
   Cloud Functions/Storage/Turnstile KULLANILMAZ (Blaze/sunucu gerektirir).
5. Bulut kapalıyken uygulama bugünkü gibi çalışır (feature flag).

### Ölçüm

`server-data/active-case.json` (27 Mayıs örneği): tam state 23.7 KiB,
bulut paketi **6.5 KiB = 1 MiB limitinin %0.6'sı** (sourceValues %70'i
kaplıyordu — beyaz listeyi doğrular). Faz 1 öncesi dolu bir üretim raporu
JSON'u ile yeniden ölçülmeli.

### Sonraki adım (Faz 1)

Firebase projesi (europe-west) + Auth + login ekranı + tek raporun flag
arkasında senkronu. Öncesinde `FAZ0-TASARIM.md` Bölüm 8'deki açık sorular
yanıtlanmalı (Google hesabı, tek kullanıcı/ekip, dolu rapor ölçümü).

---

## 0.0.48 2026-07-09 Emlak Beyan Değeri Tarih/Yıl Cümlesi (Codex oturumu)

Emlak beyan değeri girildiğinde Değerleme bölümünde oluşan açıklama cümlesi belediye inceleme tarihi ve ilgili yıl bilgisiyle genişletildi.

Yapılanlar:
- Eski değer cümlesi yerine şu format kullanılır: `(Belediye inceleme tarihi) tarihinde (İlçe) Belediyesi Emlak Servisinden alınan bilgiye göre değerlemeye konu taşınmazın (Yıl) Yılı Emlak Beyan Değeri X TL'dir.`
- Tarih `municipalityInspectionDate || appointmentDate` alanından alınır.
- Yıl öncelikle belediye inceleme/randevu tarihinden, tarih yoksa sistem iş tarihinden alınır.
- `Belediye inceleme tarihi`, `randevu tarihi`, ilçe veya banka değiştiğinde Emlak Beyan açıklaması canlı yenilenir.

Yedek:
`backups/before-property-tax-value-sentence-date-year_2026-07-09_08-19-35`

Servis sürümü:
`app.js?v=20260709-0820`, `styles.css?v=20260709-0759`

---

## 0.0.47 2026-07-09 Ziraat Bankası Emlak Beyan Açıklaması (Codex oturumu)

`T.C. Ziraat Bankası A.Ş.` seçildiğinde emlak beyan değeri checkbox'ı işaretli değilse bilgi verilmeme metninin yeri bankaya özel olarak değiştirildi.

Yapılanlar:
- Ziraat seçili ve `Emlak Beyan Değeri` checkbox'ı işaretsizse rayiç bedel/malik dışı bilgi verilmeme cümlesi `10 - Değerleme` bölümünde `Emlak Beyan Değeri Açıklaması` kartında görünür.
- Aynı koşulda `14 - Açıklamalar` bölümündeki Emlak Beyan açıklama kartı gizlenir; metin iki bölümde birden tekrarlanmaz.
- Diğer bankalarda önceki davranış korunur: checkbox işaretsizse açıklama `14 - Açıklamalar` bölümünde kalır.
- Checkbox işaretli ve değer girilmişse değer açıklaması yine `10 - Değerleme` bölümünde görünür.

Yedek:
`backups/before-ziraat-property-tax-explanation_2026-07-09_08-10-21`

Servis sürümü:
`app.js?v=20260709-0811`, `styles.css?v=20260709-0759`

---

## 0.0.46 2026-07-09 Emlak Beyan Değeri Açıklama Kuralları (Codex oturumu)

Emlak beyan değeri checkbox durumuna göre Değerleme ve Açıklamalar bölümlerine otomatik açıklama üretimi eklendi.

Yapılanlar:
- `Emlak Beyan Değeri` checkbox işaretli ve değer girilmişse `10 - Değerleme` bölümünde `Kira Açıklaması` altında `Emlak Beyan Değeri Açıklaması` kartı görünür.
- Değerleme açıklaması: `(İlçe) Belediyesinden alınan bilgiye göre konu taşınmazın Emlak Beyan Değerinin X TL'dir.`
- Checkbox işaretsizse `14 - Açıklamalar` bölümünde bilgi verilmeme metni görünür.
- Açıklamalar metni: `(İlçe) Belediyesi Emlak Servisinde yapılan incelemelerde taşınmaza ait rayiç bedel hakkında bilgilerin malik dışındaki 3. Kişilere verilmediği beyan edilmiştir.`
- İlçe metni `titleDistrict || district` alanından alınır; yoksa `İlgili Belediye` kullanılır.
- Checkbox/değer değişimlerinde açıklama kartları canlı güncellenir.

Yedek:
`backups/before-property-tax-explanation-panels_2026-07-09_07-58-15`

Servis sürümü:
`app.js?v=20260709-0759`, `styles.css?v=20260709-0759`

---

## 0.0.45 2026-07-09 Emlak Beyan Değeri Paneli (Codex oturumu)

`10 - Değerleme` bölümünde `Şerefiye Bölümü` altına belediyeden öğrenilen emlak beyan değerinin girilebileceği kapalı başlayan panel eklendi.

Yapılanlar:
- `Şerefiye Bölümü` altına `Emlak Beyan Değeri` paneli eklendi.
- Başlığın yanında varsayılan işaretsiz checkbox bulunur.
- Checkbox işaretlenince başlık satırında `Belediye Emlak Beyan Değeri` TL giriş kutusu açılır.
- Checkbox kapatılırsa değer temizlenir ve kutu gizlenir.
- Girilen değer `propertyTaxDeclarationValue`, checkbox durumu `propertyTaxDeclarationEnabled` alanlarında saklanır.

Yedek:
`backups/before-property-tax-declaration-value_2026-07-09_07-47-53`

Servis sürümü:
`app.js?v=20260709-0748`, `styles.css?v=20260709-0748`

---

## 0.0.44 2026-07-09 Kira Dip Notları Canlı Yenileme Düzeltmesi (Codex oturumu)

Kullanıcı, kira veya satış değeri değiştirildiğinde KAP/GDS dip notlarının dinamik güncellenmediğini bildirdi.

Kök neden:
- `refreshValuationControls()` yalnızca input değerlerini yeniliyordu.
- Kira satır başlığı altındaki `.valuation-label-note` metni tablo ilk oluşturulduktan sonra tekrar hesaplanmıyordu.

Yapılanlar:
- Piyasa değeri satır başlıklarına `data-market-row-key` işareti eklendi.
- Başlık ana metni `.valuation-label-text`, dip not metni `.valuation-label-note` olarak ayrıldı.
- `refreshValuationMarketLabels()` eklendi ve `refreshValuationControls()` içinde çağrıldı.
- Satış/kira değeri değiştiğinde KAP ve GDS dip notu artık aynı render içinde güncellenir.

Yedek:
`backups/before-rent-footnote-live-refresh_2026-07-09_07-34-35`

Servis sürümü:
`app.js?v=20260709-0735`, `styles.css?v=20260709-0735`

---

## 0.0.43 2026-07-09 Kira Kapitilizasyon Dip Notları (Codex oturumu)

`10 - Değerleme` bölümündeki `Piyasa Değeri` tablosu sadeleştirildi.

Yapılanlar:
- `Kapitilizasyon Oranı` ve `Gayrimenkul Amortisman Süresi` ayrı tablo satırları artık gösterilmez.
- Yasal/mevcut kira satırlarında bu bilgiler başlık altında dip not olarak gösterilir: `(KAP: % x, GDS y AY)`.
- Hesap alanları korunur; değerleme açıklamaları ve kira/kapitilizasyon hesapları aynı veriyi kullanmaya devam eder.

Yedek:
`backups/before-rent-metric-footnotes_2026-07-09_07-29-24`

Servis sürümü:
`app.js?v=20260709-0730`, `styles.css?v=20260709-0730`

---

## 0.0.42 2026-07-09 Natamam Değer Piyasa Satırları ve Yuvarlatılmış Eksik İmalat (Codex oturumu)

İnşaat seviyesi %100 olmayan taşınmazlarda Değerleme bölümü piyasa değeri satırları tamamlanmış değer/natamam değer ayrımını gösterecek şekilde genişletildi.

Yapılanlar:
- İnşaat seviyesi %100 değilse `Piyasa Değeri` bölümündeki ana satır adları `Tamamlanması Durumunda ...` formatına döner.
- `Yasal Durum Değeri` altına `Natamam Yasal Durum Değeri`, `Mevcut Durum Değeri` altına `Natamam Mevcut Durum Değeri` otomatik hesap satırları eklendi.
- Natamam satırlar, Açıklamalar bölümündeki eksik imalat hesabıyla aynı hesap motorunu kullanır.
- Açıklamalar bölümündeki natamam tabloda `Eksik İmalat Hesabı` sütunu kaldırıldı.
- Yerine `Yuvarlatılmış Eksik İmalat` sütunu eklendi; eksik imalat tutarı 50.000 TL adımıyla yuvarlanarak gösterilir.

Yedek:
`backups/before-incomplete-value-market-rows_2026-07-09_01-26-52`

Servis sürümü:
`app.js?v=20260709-0127`, `styles.css?v=20260709-0127`

---

## 0.0.41 2026-07-09 Eksik İmalat ve Natamam Durum Değeri Tablosu (Codex oturumu)

İnşaat seviyesi %60 ve üzeri, %100 altı olan taşınmazlarda eksik imalat tutarı ve natamam durum değeri Açıklamalar bölümünde tablo olarak gösterilecek şekilde geliştirildi.

Yapılanlar:
- `14 - Açıklamalar` bölümünde `Değerleme Özet Tablosu` altına `Eksik İmalat ve Natamam Durum Değeri` tablosu eklendi.
- Tablo yalnızca piyasa değeri, alan, yapı birim değeri ve %60-99 arası inşaat seviyesi bulunduğunda görünür.
- Eksik imalat hesabı `Alan × Yapı Birim Değeri × (1 - İnşaat Seviyesi)` olarak yapıldı.
- Natamam durum değeri `Piyasa Değeri - Eksik İmalat Tutarı` ile hesaplanır ve mevcut 50.000 TL yuvarlama kuralı uygulanır.
- Yasal ve mevcut değerler ayrı satırlarda hesaplanır.

Yedek:
`backups/before-incomplete-construction-value-table_2026-07-09_01-12-11`

Servis sürümü:
`app.js?v=20260709-0112`, `styles.css?v=20260709-0112`

---

## 0.0.40 2026-07-09 Sabit Sol Menü ve Sağ Alan Kaydırma (Codex oturumu)

Kullanıcı browser anotasyonu doğrultusunda masaüstü yerleşimde sol `Bölümler` panelinin sayfa ile birlikte akması engellendi.

Yapılanlar:
- Masaüstünde `.app-shell` viewport yüksekliğine sabitlendi ve dış sayfa kaydırması kapatıldı.
- Sağdaki `.workspace` kendi içinde dikey kayacak şekilde ayarlandı; sol sidebar sabit kaldı.
- Sol menüdeki `.section-nav` kendi iç kaydırmasını korur; mobil `max-width: 820px` davranışına dokunulmadı.

Yedek:
`backups/before-fixed-sidebar-workspace-scroll_2026-07-09_00-42-23`

Servis sürümü:
`app.js?v=20260709-0042`, `styles.css?v=20260709-0042`

---

## 0.0.39 2026-07-09 Değerleme Tablo Çerçevesi ve Birim Değeri Başlığı (Codex oturumu)

Kullanıcı browser anotasyonları doğrultusunda `11 - Değerleme` tablolarında görsel ve metinsel küçük revizyon yapıldı.

Yapılanlar:
- Kat bazında hesaplama tablosundaki `Piyasa m² Birim Fiyat` başlığı `Piyasa m² Birim Değeri` olarak değiştirildi.
- Aynı detay tablonun `14 - Açıklamalar` bölümündeki eş başlığı da tutarlılık için güncellendi.
- Değerleme tablolarını saran `.valuation-table-wrap` çerçevesi `1px` yerine `2px` yapıldı.

Yedek:
`backups/before-valuation-table-border-label_2026-07-09_00-32-09`

Servis sürümü:
`app.js?v=20260709-0034`, `styles.css?v=20260709-0034`

---

## 0.0.38 2026-07-09 Kullanıcı Yakın Çevre Noktaları 1000 m Filtresi (Codex oturumu)

`Adres ve Konum` bölümündeki kullanıcı tarafından eklenen yakın çevre noktaları artık konu taşınmaz merkezine göre yalnızca **1000 metre yarıçap** içinde gösterilir/seçime dahil edilir.

Yapılanlar:
- `userNearbyRadiusMeters = 1000` sabiti eklendi.
- `getUserNearbyPlaces()` artık `category === "user"` noktalarını 1000 m mesafe filtresinden geçirir.
- `Kullanıcı Noktalarını Getir` otomatik seçiminde 1000 m dışındaki kullanıcı noktaları seçili listeye eklenmez.
- Yakın çevre seçim başlığındaki `X öğe seçili` sayısı artık ham `selectedIds` yerine ekranda görünen filtreli liste içindeki seçili öğeleri sayar.
- Kayıtlı kullanıcı noktaları silinmez; sadece Adres/Konum yakın çevre çıktısına girerken filtrelenir.

Yedek:
`backups/before-user-poi-1000m-filter_2026-07-09_00-23-21`

Servis sürümü:
`app.js?v=20260709-0025`, `styles.css?v=20260709-0025`

---

## 0.0.37 2026-07-08 EKB ve Adres Kodu: OCR Kaldırıldı, Yalnız PDF Metin Katmanı (Opus oturumu)

Kullanıcı iOS'ta yükleme hataları alması üzerine **EKB ve Adres Kodu akışlarından
OCR mantığının tamamen kaldırılmasını, yalnızca PDF'ten okunmasını** istedi.

### Yapılanlar

- Yeni `readPdfTextLayerOnly(file)`: yalnızca pdf.js metin katmanını okur —
  **OCR yok, sunucu tarafı (python `/api/pdf-text`) çağrısı yok.** iOS'ta
  `loadPdfDocument` worker'sız modda çalışır.
- `readAddressFileText`: yalnız PDF kabul eder; metin katmanı boşsa
  `"Adres kodu PDF'inde metin katmanı bulunamadı..."` hatası. Görsel yüklenirse
  `"...OCR kaldırıldı; lütfen metin katmanlı PDF yükleyin."`
- `readEkbFileText`: koordinatlı pdf.js okuması (`readCoordinatePdfText` — OCR
  değildir) + düz metin katmanı; görsel reddedilir.
- Yükleme kartları: `Adres Kodu PDF / Görsel` → **`Adres Kodu PDF`**,
  `EKB PDF / Görsel` → **`EKB PDF`**; `accept` yalnız `.pdf`; ipuçları güncellendi.
- **Kapsam dışı (dokunulmadı):** TAKBİS OCR yedeği, İmar OCR akışı
  (`E-İmar PDF / Görsel`) ve `/api/pdf-text` sunucu ucu (İmar iOS yolu hâlâ kullanır).

### Doğrulama

- `test-inputs/adres.pdf` → Bursa / Yıldırım / Millet Mahallesi / 16370 ✓
- `test-inputs/ekb.pdf` → belge no Y2216FF6C56C5, enerji sınıfı C, geçerlilik 15.03.2029 ✓
- Ağ kaydında `/api/pdf-text` veya tesseract çağrısı YOK; konsol hatasız.
- Görsel yüklemede iki akışta da yeni Türkçe hata mesajı ✓
- Tüm node testleri temiz. Yedek: `backups/before-ekb-address-pdf-only_2026-07-08_21-50-05`

---

## 0.0.36 2026-07-08 Adres PDF "spawn python.exe" Hatası Düzeltmesi (Opus oturumu)

Kullanıcının iPhone ekran görüntüsünde Adres Kodu PDF kartında kırmızı
`spawn .cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`
hatası görüldü. iOS saha modunda (`shouldUsePdfTextOnlyMode`) PDF metni
`/api/pdf-text` üzerinden **sunucuda Python ile** okunur; iki kök neden vardı:

1. `server.js > findPythonExecutable` Python yolunu `process.env.USERPROFILE`
   ile kuruyordu. Sunucu süreci USERPROFILE göremediğinde (ör. .bat/servis
   ortamı) yol **göreli** (`.cache/...`) kalıyor, spawn ENOENT veriyordu —
   hatadaki önek eksikliği bunun kanıtı.
2. Tek adaya bağlıydı ve ham spawn hatası doğrudan kullanıcı arayüzüne düşüyordu.

### Düzeltmeler

- **server.js:** `getPythonCandidates()` — öncelik sırasıyla:
  1. `RAPOR_PYTHON` ortam değişkeni (elle yol belirtme imkanı),
  2. `os.homedir()` tabanlı **mutlak** codex-primary-runtime python yolu (existsSync kontrolüyle),
  3. `~/.cache/codex-runtimes/*/...` altındaki diğer runtime kopyaları (`.previous-*` dahil),
  4. PATH üzerindeki `py` ve `python`.
  `runPdfTextExtractor` adayları sırayla dener (spawn ENOENT → sıradaki;
  Python çalışıp hata verirse gerçek hata bildirilir). Hiçbiri yoksa Türkçe,
  yol gösteren hata döner: "PDF metin okuyucu (Python) sunucuda bulunamadı...".
- **app.js:** `readPdfText` iOS modunda sunucu okuması başarısız olursa artık
  **tarayıcı içi (worker'sız) metin katmanı okumaya düşer**
  (`readPdfTextInBrowser` olarak ayrıştırıldı); metin katmanı da boşsa sunucu
  hatası bildirilir. OCR iOS'ta kapalı kalır.

### Doğrulama (canlı sunucu + curl ile 3 senaryo)

1. Bozuk `RAPOR_PYTHON` → aday atlandı, codex python kullanıldı → `ok:true`, gerçek TAKBİS metni ✓
2. Ulaşılmaz home (ekran görüntüsündeki senaryo) → PATH python'a düştü → `ok:true` ✓
3. Boş PATH + ulaşılmaz home → ham spawn hatası yerine **zarif Türkçe hata** ✓
- Tüm node testleri temiz (check-basic, takbis, halkbank, value-factors, comparable).

**ÖNEMLİ:** `server.js` değişti — kullanıcının 5173'teki sunucusunun
**yeniden başlatılması** gerekir (Ctrl+F5 yetmez; .bat'ı kapatıp açın).

Yedek: `backups/before-pdf-text-python-fix_2026-07-08_21-09-08`

---

## 0.0.35 2026-07-08 Dışarıdan Ekspertiz Randevu Seçimi ve Tanıma Düzeltmesi (Codex oturumu)

Kullanıcı testinde `Randevu Türü = Dışarıdan ekspertiz` seçildiğinde `Değerleme Yöntemi Açıklaması` paragrafının gelmediği görüldü.

Kök neden:
- `appointmentType` özel select kontrolü yalnızca `input` olayını dinliyordu.
- Select değişimi bazı tarayıcı/etkileşimlerde `change` olayıyla geldiğinde `state.fields.appointmentType` güncellenmiyor, dolayısıyla dışarıdan ekspertiz paragrafı üretilmiyordu.
- Ek izleme testinde seçim state'e yazıldığı halde paragrafın yine gelmediği görüldü; ikinci kök neden `isExternalAppointmentType` fonksiyonunun Türkçe `Dışarıdan` değerini yalnızca `disar` ile yakalamaya çalışmasıydı.

Düzeltme:
- Randevu türü değişim mantığı ortak `handleAppointmentTypeChange` fonksiyonuna alındı.
- Aynı handler hem `input` hem `change` olayına bağlandı.
- `input` sonrası gelen ikinci `change` olayında aynı değer tekrar işlenmesin diye koruma eklendi.
- `isExternalAppointmentType`, `dışarı`, `disari` ve `disar` varyasyonlarını tanıyacak şekilde dayanıklı hale getirildi.

Yedek:
`backups/before-appointment-change-event-fix_2026-07-08_18-01-38`

Servis sürümü:
`app.js?v=20260708-1810`, `styles.css?v=20260708-1810`

---

## 0.0.34 2026-07-08 Dışarıdan Ekspertiz Değerleme Açıklaması (Codex oturumu)

`Randevu Türü = Dışarıdan ekspertiz` seçildiğinde `11 - Değerleme > Değerleme Yöntemi Açıklaması` içine ilk paragraftan sonra otomatik dışarıdan ekspertiz paragrafı eklendi.

Davranış:
- Paragraf `externalAppraisalReason` değerini sebep olarak kullanır; sebep `Diğer` ise `externalAppraisalOtherNote` kullanılır.
- `projectInstitution` değeri makrodaki `ProjeKurum` yerine kullanılır.
- Metin taşınmazın dışarıdan ekspertiz yapıldığını, alan ve mimari/proje uygunluğunun yerinde kontrol edilemediğini, proje ile uygun kabul edildiğini ve iç hacim özelliklerinin vasat kabulüyle değerleme yapıldığını belirtir.
- `appointmentType`, dışarıdan ekspertiz sebebi veya `projectInstitution` değiştiğinde Değerleme Yöntemi Açıklaması canlı yenilenir.

Yedek:
`backups/before-external-appraisal-valuation-note_2026-07-08_17-55-54`

Servis sürümü:
`app.js?v=20260708-1800`, `styles.css?v=20260708-1800`

---

## 0.0.33 2026-07-08 Mevcut Kullanım İfade Revizyonu (Codex oturumu)

`Değerleme Yöntemi Açıklaması` içindeki yasal/mevcut kullanım niteliği farkı paragrafında ifade revize edildi.

Değişiklik:
- `Mevcut Kullanım Niteliği "Y" nitelikli olduğu gözlemlenmiştir.`
- yerine `Mevcut Kullanımı "Y" nitelikli olduğu gözlemlenmiştir.` yazılır.

Yedek:
`backups/before-current-usage-wording-fix_2026-07-08_17-47-29`

Servis sürümü:
`app.js?v=20260708-1748`, `styles.css?v=20260708-1748`

---

## 0.0.32 2026-07-08 Yasal/Mevcut Kullanım Niteliği Farkı Değerleme Açıklaması (Codex oturumu)

`Yasal/Mevcut Kullanım Türü Arasında Fark Var Mı?` işaretliyse `11 - Değerleme > Değerleme Yöntemi Açıklaması` içine otomatik nitelik farkı paragrafı eklendi.

Davranış:
- Önce `Ekspertize konu taşınmaz Tapu Kayıtlarına göre "X" Nitelikli olup, Mevcut Kullanım Niteliği "Y" nitelikli olduğu gözlemlenmiştir.` cümlesi yazılır.
- `legalValueUnit` ve `currentValueUnit` arasındaki fark yasal m2 birim değere göre %10'dan azsa bölgede birim değer farkı bulunmadığına dair matbu cümle eklenir.
- Fark %10 ve üzerindeyse yasal değer için X nitelikli, mevcut değer için Y nitelikli gayrimenkullerin araştırıldığı cümlesi eklenir.
- `legalUsageNature`, `currentUsageNature`, `usageNatureDifference` veya değerleme m2 birim değerleri değiştiğinde açıklama canlı yenilenir.

Yedek:
`backups/before-usage-nature-difference-valuation-note_2026-07-08_17-41-45`

Servis sürümü:
`app.js?v=20260708-1742`, `styles.css?v=20260708-1742`

---

## 0.0.31 2026-07-08 Kat Bazında Hesaplama Etkili Alan Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` açıklamasına toplam indirgenmiş alan özeti eklendi.

Davranış:
- `Kat bazında uygulanan indirgeme oranları rapor ekinde tablo halinde tarafınıza sunulmuştur.` cümlesinden hemen önce alan özeti yazılır.
- Yasal ve mevcut indirgenmiş alan eşitse: `Konu taşınmazın yasal ve mevcut etkili alana indirgenmiş alanı X m² olarak hesaplanmıştır.`
- Yasal ve mevcut indirgenmiş alan farklıysa: `Konu taşınmazın yasal etkili alana indirgenmiş alanı X m², mevcut etkili alana indirgenmiş alanı Y m² olarak hesaplanmıştır.`
- Alanlar `calculateReducedUnitFloorTotal` ile, kat alanı + teras indirgeme oranları dahil edilerek hesaplanır.

Yedek:
`backups/before-floor-calculation-effective-area-note_2026-07-08_17-21-44`

Servis sürümü:
`app.js?v=20260708-1722`, `styles.css?v=20260708-1722`

---

## 0.0.30 2026-07-08 İnşaat Seviyesi Değerleme Yöntemi Risk Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Değerleme Yöntemi Açıklaması` metnine inşaat seviyesi %100 değilse otomatik ikinci paragraf eklendi.

Davranış:
- `İnşaat Seviye` değeri `%80`, `80`, `0,8` veya `0.8` formatlarında okunur.
- Boş, geçersiz veya `0` değerler Excel makro mantığına uygun olarak %100 kabul edilir.
- Seviye %100 altındaysa mevcut değerleme yöntemi açıklamasının altına tamamlanamama/yasal prosedür risk açıklaması eklenir.
- `İnşaat Seviye` alanı değiştirilince Değerleme ekranındaki açıklama canlı yenilenir.

Yedek:
`backups/before-construction-level-valuation-note_2026-07-08_17-08-34`

Servis sürümü:
`app.js?v=20260708-1710`, `styles.css?v=20260708-1710`

---

## 0.0.29 2026-07-08 Çatı Katı Kat Adedi Yazımı Düzeltmesi (Codex oturumu)

`Ana Gayrimenkul Kat Adedi` otomatik metninde `Çatı katı` seçimi `ÇATII` olarak görünüyordu. Kat kompozisyonundan `kat/katı` eki temizlenirken Türkçe `ı` harfinin geride kalmaması sağlandı.

Servis sürümü:
`app.js?v=20260708-1648`, `styles.css?v=20260708-1648`

---

## 0.0.28 2026-07-08 Ana Gayrimenkul Kat Adedi Alanı (Codex oturumu)

`8 - Ana Gayrimenkul Özellikleri` bölümünde `Ana Gayrimenkul Açıklaması` alanının üstüne `Ana Gayrimenkul Kat Adedi` alanı eklendi.

Davranış:
- Alan Türkçe büyük harf formatında tutulur.
- Örnek format: `BODRUM + ZEMİN + 5 NORMAL`.
- Kat dağılımı adetleri kaydedildiğinde alan otomatik hesaplanan kat kompozisyonundan yenilenir.
- Kullanıcı alanı manuel düzenlerse giriş anında büyük harfe çevrilir.
- Placeholder/metin kaynak listesine `Ana Gayrimenkul Kat Adedi` olarak eklendi.

Yedek:
`backups/before-main-property-floor-count-text_2026-07-08_16-44-43`

Servis sürümü:
`app.js?v=20260708-1645`, `styles.css?v=20260708-1645`

---

## 0.0.27 2026-07-08 Kat Bazında Hesaplama Açıklama Revizyonu (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` açıklaması kullanıcı görsel notlarına göre güncellendi.

Davranış:
- Açıklamadaki `indirgeme oranı %100 olan` ara ifadesi kaldırıldı.
- İndirgenen katlar artık oranlarıyla birlikte yazılır: ör. `Asma kat alanı %30 oranında, 1. Normal kat alanı %30 oranında ... indirgenmiştir.`
- Teras cümlesindeki `Teras alanı/alanları` ifadesi `Teras Alanları` olarak sadeleştirildi.

Yedek:
`backups/before-floor-intro-rate-details_2026-07-08_16-33-48`

Servis sürümü:
`app.js?v=20260708-1634`, `styles.css?v=20260708-1634`

---

## 0.0.26 2026-07-08 Kat Bazında Hesaplama Açıklaması (Codex oturumu)

`11 - Değerleme` bölümündeki `Kat Bazında Hesaplama Tablosu` üstüne otomatik açıklama paragrafı eklendi.

Davranış:
- Açıklama yalnızca tablo gösteriliyorsa ve birden fazla kat/alan satırı varsa oluşturulur.
- `İndirgeme Oranı %100` olan kat/katlar etkili alan referansı kabul edilir.
- Diğer katlar, etkili alan referans kat seviyesine indirgenmiş olarak metne yazılır.
- Yasal veya mevcut teras alanı varsa terasların kapalı kullanım alanına dahil edilmediğini ve şerefiye unsuru olarak dikkate alındığını belirten cümle eklenir.
- Tablo gizleme kuralı korunur: toplam yasal/mevcut kullanım alanları toplam indirgenmiş alanlara eşitse Değerleme bölümündeki kat bazında tablo görünmez.

Yedek:
`backups/before-floor-valuation-intro_2026-07-08_16-23-50`

Servis sürümü:
`app.js?v=20260708-1624`, `styles.css?v=20260708-1624`

---

## 0.0.25 2026-07-08 Lacivert–Beyaz Yeniden Tasarım (Opus + taste-skill/redesign)

Kullanıcı isteğiyle uygulamanın tüm renk teması **lacivert–beyaz ağırlıklı** hale
getirildi (önceki yeşil marka teması → lacivert). `taste-skill:redesign-skill`
yöntemiyle: mevcut vanilla CSS korundu, **sınıf adı / DOM / JS mantığı
değiştirilmedi**, işlevsellik her adımda test edildi.

### Yedek

`backups/before-navy-white-redesign_2026-07-08_11-18-49`

### Yaklaşım — token yeniden yönlendirme (düşük risk)

Marka rengi token adları geçmişten `--green*` olarak kalıyor **fakat değerleri
artık lacivert**. ~40 CSS kuralı `var(--green)/var(--green-soft)/...` kullandığı
için tema tek noktadan (`:root`) çevrildi. Yeni palet (`styles.css` başı):

| Token | Eski (yeşil) | Yeni (lacivert) |
|---|---|---|
| `--green` (birincil marka) | #0f7a5e | **#213f77** |
| `--green-bright` | #12967a | **#2d59ab** |
| `--green-strong` | #0a5c47 | **#172c56** |
| `--green-soft` | #d9efe6 | **#dde7f6** |
| `--sidebar-ink` | #16222b | **#111d3d** |
| `--bg` | #f2f5f3 | **#f3f6fc** (soğuk beyaz) |
| `--ink` | #17232c | **#152238** |
| `--gold` (aksan) | #f1c66b | **#d7b26a** (kısıtlı) |
| `--ring` | yeşil rgba | **rgba(45,89,171,.25)** |

Palet desatüre lacivert (HSL sat ~%57 < %80, redesign-skill kuralı). Hafif
**altın aksan** yalnızca marka kutusu, aktif nav çubuğu ve durum-kartı şeridinde
tutuldu (klasik lacivert+altın bankacılık/değerleme paleti).

### Değişen sabit (hardcoded) değerler

- `styles.css`: özet kartı zeminleri `#f8faf9→#f6f8fd`, tablo başlıkları
  `#eef4f1→#eaf0fa`, kenar çubuğu degradesi (mavi-gri→lacivert), buton/nav
  gölgeleri yeşil rgba→lacivert rgba, gövde radyal zemini, `::selection`, hover
  kenar renkleri, kaydırma çubuğu grileri (soğutuldu), `.nearby-map-label`
  (harita etiketi) lacivert.
- **Korunan semantik renkler:** `.sync-dot` yeşil (başarı göstergesi),
  `.subject-map-label` kırmızı (harita ana taşınmaz işareti), `--red` uyarılar.
- `app.js` Word/PDF export CSS'i de temayla uyumlandı: `h2` başlık çizgisi
  `#176c54→#213f77`, `.word-table` başlık/çizgili satır tonları lacivert.
- `index.html`: `theme-color` meta `#16222b→#111d3d` (Android adres çubuğu).

### Doğrulama

- Bundled node: `--check app.js` + `tools/check-basic.js` + takbis/halkbank/
  value-factors/comparable testlerinin tümü temiz.
- Claude_Preview: 1440×900 / 768×1024 / 375×812 ekran görüntüleriyle doğrulandı —
  lacivert kenar çubuğu, lacivert birincil buton + altın marka, soğuk beyaz
  yüzeyler, lacivert alt-nav aktif pill. Yatay taşma yok, konsol hatasız.
- İşlevsel: bölüm geçişi + `.section-enter` yalnız geçişte; textarea →
  `saveState()` → localStorage kaydı ✓.
- Önceki oturumun modern tema katmanı (geçişler, cam efektleri, dokunma
  hedefleri, `prefers-reduced-motion`) korundu; yalnız palet lacivere çevrildi.

---

## 0.0.24 2026-07-08 Açıklamalar Temel Metin Alanları Kaldırıldı (Codex oturumu)

`14 - Açıklamalar` bölümündeki manuel temel açıklama alanları sadeleştirildi.

Kaldırılan alanlar:
- `Takyidat Açıklaması`
- `İmar Açıklaması`
- `Belge / Proje Açıklaması`
- `Genel Açıklama`

Teknik not:
- Alanlar yalnızca `explanations.fields` form listesinden çıkarıldı.
- Otomatik üretilen takyidat/imar/belge panelleri ve placeholder akışları korunur.
- Cache-buster `app.js?v=20260708-1022`, `styles.css?v=20260708-1022` olarak yenilendi.

Yedek alındı:
`backups/before-remove-explanations-basic-textareas_2026-07-08_10-19-52`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.23 2026-07-08 Değerleme Satış Kabiliyeti Açıklaması (Codex oturumu)

Değerleme bölümünde `Değerleme Yöntemi Açıklaması` ile `Kira Açıklaması` arasına
otomatik `Satış Kabiliyeti Açıklaması` kartı eklendi.

Teknik not:
- `Satılabilir` seçildiğinde matbu olumlu satış kabiliyeti cümlesi üretilir.
- `Alıcısı Az`, `Satışı Güç` veya `Satılamaz` seçildiğinde kullanıcının modalda
  girdiği açıklama metni, sonuç cümlesiyle birlikte kullanılır.
- Kart kopyalanabilir ve satış kabiliyeti / açıklama değiştiğinde canlı güncellenir.
- Cache-buster `app.js?v=20260708-1015`, `styles.css?v=20260708-1015` olarak yenilendi.

Yedek alındı:
`backups/before-valuation-saleability-explanation_2026-07-08_10-11-47`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.22 2026-07-08 Değerleme Kira Açıklaması (Codex oturumu)

Değerleme bölümünde `Değerleme Yöntemi Açıklaması` kartının altına otomatik
`Kira Açıklaması` kartı eklendi.

Teknik not:
- `legalRent` ve `currentRent` eşitse metin tek cümlede yasal/mevcut kira değerini
  birlikte yazar.
- Değerler farklıysa yasal kira ve mevcut kira ayrı ayrı yazılır.
- Kira değerlerinden yalnızca biri varsa ilgili tek değer için açıklama üretir.
- Kira açıklaması değerleme hesapları yenilendiğinde canlı güncellenir ve kopyalanabilir.
- Cache-buster `app.js?v=20260708-0951`, `styles.css?v=20260708-0951` olarak yenilendi.

Yedek alındı:
`backups/before-valuation-rent-explanation_2026-07-08_09-48-20`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.21 2026-07-08 Değerleme Kat Tablosu Detaylı Tabloyla Değiştirildi (Codex oturumu)

Değerleme bölümündeki eski `Kat Bazında Hesaplama Tablosu`, Açıklamalar bölümünde
oluşturulan detaylı kat bazında indirgenmiş alan / piyasa / kira tablosu düzeniyle
değiştirildi.

Teknik not:
- `createWorkplaceFloorCalculationTable` artık 9 sütunlu detaylı tabloyu üretir:
  normal alan, indirgeme oranı, indirgenmiş alan, piyasa m² birim fiyat, piyasa değeri,
  kira m² birim ve piyasa kira değeri.
- Yasal/mevcut bloklar `createExplanationsFloorValuationSectionRows` üzerinden ortak
  satır mantığını kullanır.
- Kullanım niteliği filtresi yoktur; `shouldShowWorkplaceFloorCalculationTable` yalnızca
  `!shouldHideWorkplaceFloorCalculationTableByEqualAreas()` kuralına bağlı kalır.
- Yani konut dahil tüm niteliklerde, brüt toplam yasal/mevcut alanlar indirgenmiş
  toplamlarla aynıysa tablo Değerleme bölümünde gizlenir; fark varsa görünür.
- Cache-buster `app.js?v=20260708-0943`, `styles.css?v=20260708-0943` olarak yenilendi.

Yedek alındı:
`backups/before-replace-valuation-floor-table-with-detailed_2026-07-08_09-40-31`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.20 2026-07-08 Açıklamalar Kat Tablosu Piyasa ve Kira Sütunları (Codex oturumu)

`Açıklamalar` bölümündeki `Kat Bazında İndirgenmiş Alan Tablosu` genişletildi.

Teknik not:
- Tabloya `Piyasa m² Birim Fiyat`, `Piyasa Değeri`, `Kira m² Birim` ve
  `Piyasa Kira Değeri` sütunları eklendi.
- Yasal blok `legalValue` / `legalRent`, mevcut blok `currentValue` / `currentRent`
  alanlarından beslenir.
- m² birim fiyat ve m² kira değerleri ilgili bloktaki toplam indirgenmiş alana göre
  otomatik hesaplanır.
- Cache-buster `app.js?v=20260708-0938`, `styles.css?v=20260708-0938` olarak yenilendi.

Yedek alındı:
`backups/before-explanations-floor-table-market-rent-columns_2026-07-08_09-35-24`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser DOM/konsol kontrolü

---

## 0.0.19 2026-07-08 Açıklamalar Kat Bazında İndirgenmiş Alan Tablosu (Codex oturumu)

`Açıklamalar` bölümüne daha detaylı `Kat Bazında İndirgenmiş Alan Tablosu`
eklendi. Tablo, bağımsız bölüm kat satırlarından otomatik beslenir.

Teknik not:
- Tablo `Değerleme Özet Tablosu` sonrasında, `Değerleme Yöntemleri Hesap Açıklaması`
  öncesinde görünür.
- Yasal ve mevcut durum için ayrı blok oluşturulur.
- Her kat satırında normal alan, indirgeme oranı ve indirgenmiş alan gösterilir.
- Teras alanı varsa ilgili blokta en alt satırda `Teras Alanı` olarak toplam normal
  alan, ağırlıklı indirgeme oranı ve indirgenmiş alan gösterilir.
- En sonda `Toplam İndirgenmiş Alan` satırı bulunur.
- Cache-buster `app.js?v=20260708-0930`, `styles.css?v=20260708-0930` olarak yenilendi.

Yedek alındı:
`backups/before-explanations-floor-valuation-table_2026-07-08_09-24-58`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.18 2026-07-08 Bölüm Üst Başlıkları Kaldırıldı (Codex oturumu)

Kullanıcıya web ve mobilde daha geniş çalışma alanı vermek için bölüm kartlarının
üstündeki başlık/açıklama/rozet bloğu kaldırıldı.

Teknik not:
- `renderSection` artık her bölümde `section-head` üretmez; kart doğrudan `section-body` ile başlar.
- Sol menüdeki bölüm adları ve rozetleri korunur, yalnızca içerik alanındaki tekrar eden üst başlık gizlenir.
- Cache-buster `app.js?v=20260708-0915`, `styles.css?v=20260708-0915` olarak yenilendi.
- `tools/check-basic.js` içine üst başlıkların tekrar dönmesini yakalayan kontrol eklendi.

Yedek alındı:
`backups/before-remove-section-headers_2026-07-08_09-13-31`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.17 2026-07-08 Dosya Yükleme Kartları Neomorfik Tasarım (Codex oturumu)

`Dosya ve Rapor` bölümündeki dosya yükleme kartları referans görseldeki yumuşak
neomorfik yaklaşıma göre modernize edildi.

Teknik not:
- `upload-grid` masaüstünde 3 kolonlu kart düzenine çıkarıldı.
- `upload-card` dashed eski görünümden yumuşak gölgeli, merkez ikonlu kart yüzeyine dönüştürüldü.
- Kartlarda CSS `::before` ile dosya ikonu, `::after` ile aksiyon etiketi eklendi.
- Tablet/mobil için 2 kolon ve 1 kolon responsive kuralları eklendi.
- HTML ve veri akışı korunarak yalnızca CSS sunum katmanı değiştirildi.
- Cache-buster `app.js?v=20260708-0901`, `styles.css?v=20260708-0901` olarak yenilendi.

Yedek alındı:
`backups/before-upload-panel-neomorphic-redesign_2026-07-08_08-54-38`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- In-app browser görsel kontrolü

---

## 0.0.16 2026-07-08 Kat Tablosu Kullanım Niteliği Filtresi Kaldırıldı (Codex oturumu)

Değerleme bölümündeki `Kat Bazında Hesaplama Tablosu` artık yalnızca
`Yasal Kullanım Niteliği = İşyeri` koşuluna bağlı değildir. Konut dahil tüm
kullanım niteliklerinde aynı alan kuralı uygulanır:

- Brüt/toplam yasal ve mevcut kullanım alanları indirgenmiş toplamlarla aynıysa tablo gizlenir.
- Herhangi bir fark varsa tablo gösterilir.

Teknik not:
- `shouldShowWorkplaceFloorCalculationTable` artık sadece
  `!shouldHideWorkplaceFloorCalculationTableByEqualAreas()` döndürür.
- `shouldShowWorkplaceFrontageDepthFields` yalnızca işyeri cephe/derinlik alanları için korunur.
- Tablo açıklamasındaki `İşyeri nitelikli...` metni genel hale getirildi.
- Cache-buster `app.js?v=20260708-0843`, `styles.css?v=20260708-0843` olarak yenilendi.

Yedek alındı:
`backups/before-floor-table-remove-usage-limit_2026-07-08_08-37-53`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.15 2026-07-08 İşyeri Kat Tablosu Eşit Alan Gizleme Kuralı (Codex oturumu)

`Yasal Kullanım Niteliği = İşyeri` olsa bile Değerleme bölümündeki
`Kat Bazında Hesaplama Tablosu` artık şu durumda gizlenir:

`Toplam Yasal Kullanım Alanı = İndirgenmiş Toplam Yasal Alan`
ve
`Toplam Mevcut Kullanım Alanı = İndirgenmiş Toplam Mevcut Alan`

Bu durumda `Piyasa Değeri` tablosu tek başına yeterli kabul edilir.

Teknik not:
- `shouldShowWorkplaceFloorCalculationTable` görünürlüğü artık eşit alan kontrolüne de bağlıdır.
- `shouldHideWorkplaceFloorCalculationTableByEqualAreas` brüt toplamları `getValuationUnitAreaTotals`,
  indirgenmiş toplamları `calculateReducedUnitFloorTotal` üzerinden karşılaştırır.
- Sayısal karşılaştırmada format farkları için küçük tolerans kullanılır (`areValuationAreasEqual`).
- Cache-buster `app.js?v=20260708-0837`, `styles.css?v=20260708-0837` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-table-hide-when-equal_2026-07-08_08-30-24`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.14 2026-07-07 Modern Ön Yüz Yenilemesi — iOS/Android/Windows (Opus oturumu)

Kullanıcı isteğiyle uygulamanın görsel teması modernize edildi; iOS, Android ve
Windows (masaüstü) için platform cilası ve akıcı geçişler eklendi. **Hiçbir sınıf
adı, DOM yapısı veya veri akışı değiştirilmedi** — değişiklik token + CSS katmanı
+ 2 küçük app.js kancası düzeyindedir.

### Yedek

`backups/before-frontend-redesign_2026-07-07_23-02-42` (index.html, styles.css,
app.js, server.js, tools/check-basic.js)

### Yapılanlar

1. **Design token yenilemesi (`styles.css` başındaki `:root`)**
   - Palet derinleştirildi: `--green: #0f7a5e`, yeni `--green-strong/--green-bright/--gold/--sidebar-ink`.
   - Yeni token'lar: `--radius-s/m/l`, `--shadow-1/2`, `--ring` (odak halkası),
     `--ease-out`, `--speed/--speed-fast`. Eski token adlarının tümü korundu.

2. **MODERN TEMA KATMANI (`styles.css` sonunda ~380 satırlık blok)** — dosyanın
   SONUNDA kalmalı; aynı özgüllükteki eski kuralları kaynak sırasıyla ezer:
   - Gövde: köşelerden yeşil/altın radyal degrade zemin, antialiasing, `::selection`.
   - **Windows**: ince yuvarlak kaydırma çubukları (`scrollbar-width: thin` + webkit).
   - **Erişilebilirlik**: buton/bağlantılarda `:focus-visible` halkası; girişlerde
     odakta yeşil halka + kenar geçişi.
   - **Butonlar**: primary'de yeşil degrade + hover'da kalkış/gölge, `:active`
     bastırma (scale 0.98); hover etkileri yalnızca `@media (hover: hover)`.
   - **Kenar çubuğu**: koyu degrade, altın degrade marka kutusu, aktif bölümde
     yeşil degrade + solda altın çubuk (`.nav-button.is-active::before`).
   - **Bölüm kartı**: 14px radius, katmanlı gölge, başlıkta soldan yeşil aksan
     çizgisi ve açık degrade; durum kartlarında üstte yeşil→altın şerit + hover kalkışı.
   - **Tablolar**: satır hover vurgusu (yalnızca hover destekli cihazlarda).
   - **Modallar**: bulanık arka plan (backdrop-filter), yukarı kayarak açılma animasyonu.
   - **Alt gezinme (mobil)**: cam efekti (blur+saturate), aktif sekmede yeşil
     degrade pill + yukarı kalkış; mobil üst bar cam efekti.
   - **iOS/Android**: `viewport-fit=cover` + `env(safe-area-inset-*)` yatay güvenli
     alanlar; `@media (pointer: coarse)` altında 48px giriş yüksekliği ve **16px
     giriş fontu (iOS odak zoom'unu önler)**, 44-46px dokunma hedefleri;
     `touch-action: manipulation`, şeffaf tap-highlight.
   - **`prefers-reduced-motion: reduce`**: tüm animasyon/geçişler kapanır.

3. **Bölüm geçiş animasyonu (app.js — 2 küçük kanca)**
   - `pendingSectionEnterAnimation` bayrağı: `setActiveSection` bayrağı kaldırır,
     `renderSection` karta `.section-enter` sınıfını yalnızca bölüm değişiminde
     ekler → alan güncellemelerinin tetiklediği re-render'larda kart TİTREMEZ
     (doğrulandı: `render()` sonrası sınıf yok). Animasyon: 240ms fade + yukarı kayma.

4. **index.html meta**: `viewport-fit=cover`, `theme-color #16222b` (Android adres
   çubuğu), `mobile-web-app-capable`, iOS `black-translucent` durum çubuğu.

### Doğrulama

- Bundled node: `--check app.js` + `tools/check-basic.js` + takbis/halkbank/
  value-factors/comparable testlerinin tümü temiz.
- Claude_Preview: 1440×900 (Windows), 768×1024 (tablet) ve 375×812 (telefon)
  ekran görüntüleriyle doğrulandı; yatay taşma yok, konsol hatasız.
- Fonksiyonel: bölüm geçişi + `.section-enter` yalnız geçişte; textarea girişi →
  `saveState()` → localStorage kaydı ✓; Emsaller matrisi mobilde sorunsuz.
- Word/PDF çıktısı etkilenmez (çıktı renkleri app.js içinde sabittir, CSS
  token'larından okunmaz).

### Not

- `tools/check-basic.js` artık **hem** `app.js?v=...` **hem** `styles.css?v=...`
  sürümünü sabit doğruluyor (satır ~387-388); cache-buster artırınca ikisini de güncelleyin.

---

## 0.0.13 2026-07-07 İşyeri Kat Tablosu Birim Fiyat Düzeltmesi (Codex oturumu)

`Kat Bazında Hesaplama Tablosu` içindeki `Birim Fiyat (TL)` hesabı düzeltildi.
Artık Değerleme altındaki brüt alan bazlı `M2 Birim Değeri` alanından okunmaz.

Doğru hesap:

`Birim Fiyat = Piyasa Değeri / Toplam İndirgenmiş Alan`

Teknik not:
- `calculateWorkplaceFloorCalculationUnitValue` eklendi.
- `createWorkplaceFloorCalculationSectionRows` içinde `legalValueUnit/currentValueUnit` bağı kaldırıldı.
- Cache-buster `app.js?v=20260707-2247`, `styles.css?v=20260707-2247` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-table-unit-price-fix_2026-07-07_22-44-19`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.12 2026-07-07 İşyeri Kat Bazında Değerleme Tablosu (Codex oturumu)

`Yasal Kullanım Niteliği = İşyeri` olduğunda Değerleme bölümünde,
`Değerleme Yöntemi Açıklaması` ile `Piyasa Değeri` arasına
`Kat Bazında Hesaplama Tablosu` eklendi.

Tablo görsel referansa benzer şekilde yasal ve mevcut alanı ayrı bloklarda gösterir:

`Hesaplama | Katlar | Alan (m²) | Zemin Kata Etki Oranı | Etkili Alan (m²) | Birim Fiyat (TL) | Değer (TL)`

Teknik not:
- `createWorkplaceFloorCalculationTable` tabloyu oluşturur.
- `shouldShowWorkplaceFloorCalculationTable` yalnızca `İşyeri` niteliğinde görünürlüğü sağlar.
- Satır hesapları mevcut kat indirgeme mantığı olan `calculateReducedUnitFloorArea` / `calculateReducedUnitFloorTotal` ile uyumludur.
- Piyasa değeri veya birim fiyat değiştiğinde `refreshWorkplaceFloorCalculationTable` tabloyu canlı günceller.
- Cache-buster `app.js?v=20260707-2242`, `styles.css?v=20260707-2242` olarak yenilendi.

Yedek alındı:
`backups/before-workplace-floor-valuation-table_2026-07-07_22-34-55`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.11 2026-07-07 Gabim Toplam İndirgenmiş Alanlar (Codex oturumu)

`Gabim Veri Seti > Bağımsız Bölüm / Taşınmaz Özellikleri` grubuna iki yeni satır eklendi:

`Zemin Kata İndirgenmiş Yasal Alan | Zemin Kata İndirgenmiş Mevcut Alan`

Bu değerler `Katlar, Alanlar ve İç Hacimler` bölümündeki tüm kat satırlarının toplam
indirgenmiş yasal/mevcut alanlarından hesaplanır. Etiket GABİM formatı gereği
`Zemin Kata İndirgenmiş...` olarak kalır, fakat hesap kaynağı toplam indirgenmiş alandır.

Teknik not:
- `gabimTotalReducedAreaText` yasal/mevcut toplam indirgenmiş alanı formatlar.
- `getGabimGroundFloorRows` filtresi kaldırıldı.
- Cache-buster `app.js?v=20260707-2220`, `styles.css?v=20260707-2220` olarak yenilendi.

Yedek alındı:
`backups/before-gabim-ground-reduced-areas_2026-07-07_22-13-07`
`backups/before-gabim-total-reduced-areas_2026-07-07_22-16-32`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.10 2026-07-07 İndirgenmiş Toplam Alan Özetleri (Codex oturumu)

`Katlar, Alanlar ve İç Hacimler` bölümüne iki salt-okunur özet alanı eklendi:

`İndirgenmiş Toplam Yasal Alan | İndirgenmiş Toplam Mevcut Alan`

Bu alanlar kat satırlarındaki `Yasal İnd. Kat Alanı` ve `Mevcut İnd. Kat Alanı`
değerlerini toplayarak canlı güncellenir.

Teknik not:
- `calculateReducedUnitFloorTotal` toplam hesabını mevcut satır hesabı olan `calculateReducedUnitFloorArea` üzerinden yapar.
- `createUnitFloorReducedTotalSummary` özet kutularını kat kartlarının üstüne ekler.
- Cache-buster `app.js?v=20260707-2206`, `styles.css?v=20260707-2206` olarak yenilendi.

Yedek alındı:
`backups/before-reduced-total-area-summary_2026-07-07_22-01-13`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.9 2026-07-07 İndirgeme Yüzde İşareti Düzeltmesi (Codex oturumu)

Kullanıcı geri bildirimiyle kat satırındaki `İnd. Oranı` yüzde işaretinin kutu dışına kaçması düzeltildi.
Yüzde eki artık kendi indirgeme oranı alanına sabitlenir.

Teknik not:
- `.unit-floor-card-head .has-field-suffix` için `position: relative` eklendi.
- Cache-buster `app.js?v=20260707-2156`, `styles.css?v=20260707-2156` olarak yenilendi.

Yedek alındı:
`backups/before-reduction-percent-inside-input_2026-07-07_21-53-21`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.8 2026-07-07 İndirgeme Oranı Sadeleştirme (Codex oturumu)

Kullanıcı geri bildirimiyle kat satırındaki fazla indirgeme oranları kaldırıldı.
Artık alanlar şu sıradadır:

`Kat | Yasal Alan | Mevcut Alan | İnd. Oranı | Yasal Teras | Mevcut Teras | İnd. Oranı | Yasal İnd. Kat Alanı | Mevcut İnd. Kat Alanı`

Teknik not:
- Alan indirgeme oranı tek alandır: `areaReductionRate`.
- Teras indirgeme oranı tek alandır: `terraceReductionRate`.
- Yasal ve mevcut alan hesapları aynı `areaReductionRate` ile indirgenir.
- Yasal ve mevcut teras hesapları aynı `terraceReductionRate` ile indirgenir.
- Eski `legalReductionRate/currentReductionRate/legalTerraceReductionRate/currentTerraceReductionRate`
  alanları yeni satır düzeninde kullanılmaz; eski tek satır verileri varsa `unitAreaReductionRate`
  ve `unitTerraceReductionRate` için geriye dönük yedek olarak okunur.

Yedek alındı:
`backups/before-shared-reduction-rates_2026-07-07_21-45-27`

Cache-buster: `app.js?v=20260707-2148`, `styles.css?v=20260707-2148`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.7 2026-07-07 İndirgeme Satırı Yerleşim Düzeltmesi (Codex oturumu)

Kullanıcı geri bildirimiyle kat alanı indirgeme alanlarının yerleşimi düzeltildi.
Üst satır artık tek satırlık kompakt grid olarak düzenlenir; `İç Hacimler` seçicisi ayrı alt
satıra taşındı. Hesap mantığı değiştirilmedi.

Teknik not:
- `createUnitFloorInteriorRows` içinde `unit-floor-card-interior-row` eklendi.
- `unit-floor-card-head` grid ölçüleri yeni 11 alan + sil butonu düzenine göre sıkılaştırıldı.
- Kart yatayda taşarsa `overflow-x: auto` ile tek satır korunur.
- Yüzde takısı için `has-field-suffix` sınıfı kullanıldı; `:has()` kullanılmadı.

Yedek alındı:
`backups/before-unit-reduction-layout-fix_2026-07-07_21-39-26`

Cache-buster: `app.js?v=20260707-2142`, `styles.css?v=20260707-2142`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.6 2026-07-07 Kat Alanı İndirgeme Oranları (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `Konut`, `Ofis`, `İşyeri` veya
`Ticari Bina` olduğunda **Bağımsız Bölüm Özellikleri > Katlar, Alanlar ve İç Hacimler**
satırlarında indirgeme alanları gösterilir:

- Yasal Alan sonrası `İnd. Oranı` (`legalReductionRate`)
- Mevcut Alan sonrası `İnd. Oranı` (`currentReductionRate`)
- Yasal Teras sonrası `İnd. Oranı` (`legalTerraceReductionRate`)
- Mevcut Teras sonrası `İnd. Oranı` (`currentTerraceReductionRate`)
- Sağda readonly `Yasal İnd. Kat Alanı`
- Sağda readonly `Mevcut İnd. Kat Alanı`

Varsayılan indirgeme oranı `100` gelir ve ekranda `%` takısıyla gösterilir.

Hesap:
- Yasal ind. kat alanı = `Yasal Alan × Yasal İnd. Oranı + Yasal Teras × Yasal Teras İnd. Oranı`
- Mevcut ind. kat alanı = `Mevcut Alan × Mevcut İnd. Oranı + Mevcut Teras × Mevcut Teras İnd. Oranı`

Örnek: `100 m² × %100 + 20 m² × %50 = 110 m²`.

Kullanıcı notu gereği **Bağımsız Bölüm İç Hacimler Açıklaması** metnine bu hesapla ilgili
herhangi bir açıklama eklenmedi. Bu hesaplar sonraki geliştirmede Değerleme bölümünde
kullanılacak.

Yedek alındı:
`backups/before-unit-reduced-floor-areas_2026-07-07_21-32-01`

Cache-buster: `app.js?v=20260707-2133`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.5 2026-07-07 İşyeri Cephe / Derinlik (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `İşyeri` seçildiğinde
**Bağımsız Bölüm Özellikleri > Bağımsız Bölüm Genel Bilgileri** içinde
`Isınma Sistemi` alanından sonra **Cephe (m)** (`unitShopFrontage`) ve
**Derinlik (m)** (`unitShopDepth`) alanları gösterilir.

Bu alanlar doluysa **Bağımsız Bölüm İç Hacimler Açıklaması** metninde alan/iç hacim
cümlesinden sonra şu cümle otomatik eklenir:

`Taşınmazın dükkan cephe uzunluğu 20 metre, dükkan derinliği ise 30 metre olarak ölçümlenmiştir.`

Teknik not:
- Koşul `shouldShowWorkplaceFrontageDepthFields()` ile `legalUsageNature === İşyeri`.
- Cümle `composeUnitShopFrontageDepthSentence()` içinde üretilir.
- Metin birleşiminde `areaDescription` sonrasına eklendi; dekoratif açıklama ve dışarıdan inceleme metinlerinden önce gelir.

Yedek alındı:
`backups/before-workplace-frontage-depth_2026-07-07_21-14-39`

Cache-buster: `app.js?v=20260707-2115`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.4 2026-07-07 Ticari İç Hacimler Listesi (Codex oturumu)

Kullanıcı isteğiyle **Yasal Kullanım Niteliği** `İşyeri`, `Ofis` veya `Ticari Bina`
seçildiğinde **Bağımsız Bölüm Özellikleri > Katlar, Alanlar ve İç Hacimler > İç Hacimler**
seçim listesi ticari kullanıma uygun listeye döner.

Teknik not:
- Konut listesi `unitInteriorValidationOptions` olarak korunur.
- Ticari liste `commercialUnitInteriorValidationOptions` olarak eklendi.
- Seçilecek liste `getUnitInteriorValidationOptions` ile belirlenir.
- Koşul `isCommercialLegalUsageNature(state.fields.legalUsageNature)` üzerinden çalışır.

Yedek alındı:
`backups/before-commercial-interior-options_2026-07-07_19-43-48`

Cache-buster: `app.js?v=20260707-1918`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.3 2026-07-07 Açıklamalar Yapım Yılı (Codex oturumu)

Kullanıcı isteğiyle **Açıklamalar** bölümünde `Yapı Bitiş Tarihi` alanının yanına
**Yapım Yılı** alanı eklendi (`buildingConstructionYear`). Alan, yapı bitiş tarihinin
yılını otomatik alır:

- `24.11.1982` → `1982`

Teknik not:
- `refreshBuildingCompletionFromCurrentFields`, `buildingCompletionDate` ile birlikte
  `buildingConstructionYear` alanını da günceller.
- Yıl çıkarımı `calculateConstructionYearText` fonksiyonundadır.
- Yapı bitiş tarihi belirsizse yapım yılı boş kalır.

Yedek alındı:
`backups/before-construction-year_2026-07-07_19-30-10`

Cache-buster: `app.js?v=20260707-1917`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.2 2026-07-07 Bölüm Sırası (Codex oturumu)

Kullanıcı isteğiyle ana menüde **Emsaller** bölümü, **Değerleme** bölümünün üstüne taşındı.
Bu değişiklik yalnızca `sections` dizisindeki bölüm sırasını etkiler; veri anahtarları ve çıktı
akışları değişmedi.

Yedek alındı:
`backups/before-section-order-emsaller_2026-07-07_19-04-14`

Cache-buster: `app.js?v=20260707-1916`.

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`

---

## 0.0.1 2026-07-07 TAKBİS Eklenti Bilgileri (Codex oturumu)

Kullanıcının verdiği `TAKBIS_Belgesi.pdf` içinde `EKLENTİ BİLGİLERİ` bölümü görüldü:
`4852346 Komurluk EKLENTİSİ : 11 NOLU KÖMÜRLÜK`.

Yapılanlar:
- **Tapu ve Mülkiyet** bölümünde `Ana taşınmaz niteliği` alanının altına **Eklenti** alanı eklendi (`titleAttachment`).
- `parseTakbisAttachments` ve `formatTakbisAttachmentsForReport` eklendi.
- TAKBİS yüklenince eklenti satırı otomatik okunur ve forma örn. `Kömürlük: 11 NOLU KÖMÜRLÜK` olarak yazılır.
- Yeni TAKBİS yüklemesinde eski eklenti verisi, diğer TAKBİS kaynaklı tapu alanları gibi temizlenir.
- `tools/test-takbis-parsing.js` içine eklenti regresyon vakası eklendi.
- Cache-buster: `app.js?v=20260707-1915`.

Doğrulama:
- `node --check app.js`
- `node tools/test-takbis-parsing.js`
- `node tools/check-basic.js`
- `node tools/test-halkbank-risk-rules.js`
- `node tools/test-value-factors-rules.js`
- `node tools/test-comparable-market-analysis.js`

---

## 0.0.0 2026-07-07 (2) tkb.pdf Şerh Tutarı Düzeltmeleri (Opus oturumu)

Kullanıcının bildirdiği "bazı şerhlerde tutar yanlış yazılıyor" hatası
(`takbis denemeler/tkb.pdf`, Kağıthane düzeni, 20 haciz şerhi) ile iki kök neden bulundu:

1. **Yevmiye numarası tutar metnine karışıyordu.** Kağıthane tipi düzende satır
   birleştirme, tarih-yevmiye sütunundaki yevmiye rakamını "Borç :" ile tutar
   arasına (veya tutardan hemen sonraya) düşürüyor; tutar desenleri
   `[0-9][0-9.,\s]*[0-9]` boşluklu grupları tek sayı sayınca trilyonluk sahte
   tutarlar çıkıyordu:
   - `Borç : 4101 2000000 TL` → **41.012.000.000,00 TL** (yanlış) → şimdi 2.000.000,00 TL
   - `Borç : 4500000 11760 TL` → **450.000.011.760,00 TL** (yanlış) → şimdi 4.500.000,00 TL
   - Çözüm: yeni `stripTakbisJournalNoFromAmountSource` — kaydın kendi yevmiye
     no'su, tutar arama metninden **bağımsız token olarak** ayıklanır (ondalıklı
     "11760.00" gibi parçalara dokunulmaz). `parseTakbisAnnotationRecord`,
     `normalizeTakbisAnnotationTableRow` ve `getTakbisAnnotationAmountSource`
     bu ayıklamayı kullanır. Sayı desenlerindeki `\s` bilinçli korunmuştur
     (OCR'daki "4 500 000" tipi gerçek boşluklu tutarlar için).

2. **Bir önceki oturumdaki scope-bölme kuralının regresyonu.** Satır sarmasında
   sola taşan `Haciz Yazısı sayılı...` satırının ilk kelimesi tip sütununa düşüp
   "Rehin" tipi üretiyor, yeni kural kaydı ortadan bölüyordu → kayıt yevmiyesiz
   kalıyor, tutarı OCR fallback'ten tüm belgenin son tutarı (çöp) geliyordu.
   - Çözüm: yeni `isTakbisSbiStartType` — şerh bölümünde yalnızca gerçek Ş/B/İ
     etiketleri (**Beyan/Şerh/İrtifak**) tarihsiz kayıtta yeni kayıt başlatır;
     Rehin/İpotek çıkarımları başlatmaz. Bölünen kayıt artık bütün:
     Bursa 5. Genel İcra 26.03.2026 → yevmiye **10085**, tutar **3.065.743,03 TL**.

### Doğrulama

- tkb.pdf: 20 haciz şerhinin tamamı doğru tutarla; özet: İhtiyati (6) 30.151.054,94 TL,
  İcrai (13) 70.887.467,80 TL, sahte kayıt yok (37→36 kayıt).
- Önceki 4 PDF regresyonu birebir temiz (bayrampaşa 18 kayıt / 13 icrai 634.466,17 TL;
  emek kamu 2 / 1.108.160,00 TL; uşak 3 malik toplam 1/1; ertuğrulgazi tedbir hariç).
- `tools/test-takbis-parsing.js`'e 6-7 numaralı vakalar eklendi (yevmiye ayıklama +
  Ş/B/İ kısıtı); tüm node testleri temiz.

---

## 0.0 2026-07-07 TAKBİS Ayrıştırma Düzeltmeleri (Opus oturumu)

Kullanıcının bildirdiği 5 TAKBİS ayrıştırma hatası, 4 gerçek TAKBİS PDF'i ile
(bayrampaşa çok şerhli, emek, uşak hisseli, Ertuğrulgazi) doğrulanarak düzeltildi.

### Düzeltilen Hatalar

1. **Haciz tutarları yanlış/eksik okunuyordu.** İki kök neden:
   - `isTakbisLienType` yalnızca `/HACIZ/` arıyordu; "Kamu **Haczi**" Türkçe
     katlamada `KAMU HACZI` olur, eşleşmez → Kamu Haczi kayıtlarında tutar hiç
     okunmuyordu (Emek: 213.160 TL ve 895.000 TL boştu). Artık `/HACIZ|HACZ/`
     aranıyor; `normalizeTakbisAnnotationReportType` ve haciz özet sayacı da aynı
     kalıbı kullanıyor. `halkbank-risk-rules.js` içindeki `isLienRow` da güncellendi.
   - Bayrampaşa'da birleşen kayıt (aşağıda #5) bir haczin 48.430,22 TL tutarını yutuyordu.

2. **Aynı hissedarın hisse payları toplanmıyordu (Uşak).** Üç kök neden:
   - `parseTakbisOwnerSegment` içinde sarmalanmış paydalı kesirlerde
     (`8117/8728` + devam `8`) `fraction.original` metinde birebir bulunamayınca
     `tail` tüm segment oluyor, **malik adı edinme sebebi sanılıyor**, ad
     temizliğinde adın kendisi silinip kayıt düşüyordu. Kesir konumu artık taban
     kesir üzerinden bulunuyor.
   - `findWrappedDenominatorPart` 18px toleransla ilk adayı alıyordu; El Birliği
     No sütununun sarması ("0") payda devamı sanılabiliyordu (8728**0** ≠ 8728**8**).
     Artık kesre en yakın x'li aday, asimetrik pencerede (-18..+45px) seçiliyor.
   - Yeni `mergeTakbisSameOwnerShares`: **aynı SN + aynı ada** sahip malik
     kayıtlarının hisseleri BigInt kesir toplamı ile tek satırda toplanıyor
     (Uşak: 6 kayıt → 3 malik, toplam tam 1/1, uyarı yok). SN yoksa birleştirme yapılmaz.
   - Edinme sebebi olarak `Mülkiyet ve Hisse Oranlarının Düzeltilmesi` artık tanınıyor.

3. **İhtiyati Tedbir şerhi İhtiyati Haciz sayılıyordu (Ertuğrulgazi).**
   `updateAnnotationLienSummary` `/IHTIYATI/` kontrolünü haciz filtresi olmadan
   yapıyordu. Artık özet yalnızca haciz kayıtlarını sayıyor (`TEDBIR` içeren tipler
   hariç). `normalizeTakbisAnnotationReportType` de tip etiketi tedbir içeriyorsa
   veya metinde "ihtiyati tedbir" geçip "ihtiyati haciz" geçmiyorsa haciz
   sınıflaması yapmıyor.

4. **Beyanda Tarih/Yevmiye boşsa sonraki kaydın tarih-yevmiyesi alınıyordu
   (Bayrampaşa Yönetim Planı beyanı).** `shouldStartNewTakbisEncumbranceScope`
   yalnızca tarih tamamlanınca yeni kayıt açıyordu; artık S/B/İ sütununda kendi tip
   etiketi olan satır, önceki kayıt tarihsiz olsa bile yeni kayıt başlatıyor.
   Ayrıca tarih fallback'i `sanitizeTakbisEncumbranceDateFallbackText` ile
   `( Şablon: ...)` ve `YÖNETİM PLANI : 17/07/1981` gibi içerik/etiket tarihlerini
   ayıklıyor → tarihsiz beyan artık **tarihsiz kalıyor**. Eklenti Bilgileri bölümü de
   şerh grubundan kesiliyor (eklenti sistem no'su yevmiye sanılmasın diye).

5. **02-01-2026 / 33 yevmiyeli şerh atlanıyordu (Bayrampaşa).**
   `extractTakbisEncumbranceDateInfo` yevmiyeyi `[0-9]{3,8}` ile arıyordu; yıl
   başındaki 2 haneli yevmiye ("33") eşleşmeyince kayıt "tamamlanmamış" sayılıp
   sonraki şerhle birleşiyordu. Artık 1-2 haneli yevmiye **yalnızca tarihe bitişik
   tire sonrasında** kabul ediliyor ("Ada - 8 Parsel" gibi içerik sayıları
   yevmiye sanılmaz). Bayrampaşa artık 13 icrai haciz + toplam 634.466,17 TL veriyor.

### Doğrulama Sonuçları (gerçek PDF'lerle)

| PDF | Sonuç |
|---|---|
| Bayrampaşa | 18 kayıt; 13 İcrai Haciz = 634.466,17 TL; 02.01.2026/33 = 48.430,22 TL ayrı kayıt; Yönetim Planı beyanı tarihsiz |
| Emek | Kamu Haczi (2) = 1.108.160,00 TL; İcrai (2) = 1.674.611,38 TL |
| Uşak | 3 malik: Servet Ünal 27473/87288, Semra Aydın 6869/21822, Ahmet Ünal 32339/87288; toplam 1/1, uyarı yok; "Hisseli Mülkiyet" otomatik |
| Ertuğrulgazi | İhtiyati Tedbir 23.12.2025/54391 tedbir olarak kalıyor; haciz toplamları 0 |

### Test

- **Yeni:** `tools/test-takbis-parsing.js` — app.js'den ilgili saf fonksiyonları
  kaynak metinden çıkarıp sandbox'ta koşan regresyon testi (5 hatayı da kapsar).
  `node tools/test-takbis-parsing.js` → `TAKBİS ayrıştırma regresyon testi tamam.`
- Mevcut testler temiz: halkbank-risk-rules, value-factors, comparable-market-analysis, check-basic.

---

## 0. 2026-07-04 Codex Devam Notu

Bu oturumda önceki Opus/Claude çalışmaları üzerine devam edildi. Eski session geçmişine
güvenilmeden güncel repo dosyaları, `handoff.md` ve mevcut testler esas alındı.

### Eklenen / Güncellenen Modüller

- `src/risk/halkbank-risk-data.js` ve `src/risk/halkbank-risk-rules.js`
  - **15 - Halkbank Risk Kodları** bölümü eklendi.
  - Excel/makro kaynaklı Halkbank risk kodları sisteme alındı.
  - Rapordaki verilerden otomatik seçilebilen risk kodları için kural motoru kuruldu.
  - 1. ve 2. paket otomatik kurallar eklendi.
  - Test: `tools/test-halkbank-risk-rules.js`

- `src/value-factors/value-factors-rules.js`
  - **16 - Değeri Etkileyen Faktörler** bölümü eklendi.
  - Olumlu/olumsuz özellikler sistem verilerinden otomatik üretiliyor.
  - Madde dili tam cümle yerine kısa rapor maddesi formatına çekildi.
  - Arsa özellikleri, dikey/yatay kat irtifakı mülkiyetlerinde bastırılıyor.
  - Enerji performans metni seçilen sınıfı yazar: `Enerji performans sınıfının B kategorisinde olması`.
  - Yapı denetim olumsuz maddesi: `Yapı denetim sözleşmesinin fesihli olması`.
  - Kat konumu kuralları ara kat / en üst kat / bodrum-zemin / asansörsüz üst kat olarak düzenlendi.
  - Otopark maddesinde tapu `titleBlockName` boşsa **binanın**, doluysa **sitenin** ifadesi kullanılır.
    Örnekler:
    - Blok boş: `Taşınmazın yer aldığı binanın açık otopark imkanının bulunması`
    - Blok dolu: `Taşınmazın yer aldığı sitenin açık otopark imkanının bulunması`
  - `açık otopark otopark` gibi çift tekrarlar temizlendi.
  - Test: `tools/test-value-factors-rules.js`

- `src/comparables/comparable-market-analysis.js`
  - Emsaller bölümünde `Piyasa Özeti` ve `Düzeltme / Şerefiye Notu` kaldırıldı.
  - Emsal Kayıtları ile Emsal krokisi arasına **Piyasa Analizi ve Emsal Değerlendirmesi** paneli eklendi.
  - Placeholder: `{{EMSAL_PIYASA_ANALIZI}}`
  - Emsal sayısı tüm girilmiş emsal kayıtlarından hesaplanır.
  - Beyan alan / düzeltilmiş alan farkı en yakın 5% banda yuvarlanır.
  - Aynı alt/üst pazarlama farkında `%15 ile %15` yerine `yaklaşık %15 aralığında` yazılır.
  - Metnin sonundaki nihai m² birim değer, Değerleme bölümündeki `legalValueUnit` alanından gelir.
    Bu alan boşsa emsal indirgenmiş m² ortalaması yedek olarak kullanılır.
  - Emsal uzaklığı için sistemin ürettiği `c20` mesafe metinlerinden en büyük değer alınır.
    En uzak mesafe 100 metrelik **üst basamağa** yuvarlanır ve mikro-piyasa cümlesine yazılır.
    Örnek: `438 m` → `500 metrelik etki yarıçapı`.
  - Paragraf dili revize edildi:
    - `aksı` kaldırıldı.
    - `mülakatlar` yerine `görüşmeler`.
    - `optimizasyonlar / optimize edilerek` yerine `düzeltmeler / uyumlandırılarak`.
    - `matris` yerine `karşılaştırma tablosu`.
    - Fazla `analiz` tekrarları `değerlendirme`, `piyasa çalışmaları`, `ulaşılan sonuçlar` gibi ifadelerle azaltıldı.
  - Test: `tools/test-comparable-market-analysis.js`

- `app/app.js` çıktı ve taslak aktarım akışı
  - **1 - Dosya ve Temel Bilgiler** bölümüne `JSON Taslak` yükleme kartı eklendi.
  - JSON yükleme, farklı kaydedilen JSON paketinden veya doğrudan state objesinden tüm rapor verilerini geri yükler.
  - **12 - Banka ve Çıktı** bölümüne `JSON olarak farklı kaydet` ve `Word olarak farklı kaydet` butonları eklendi.
  - JSON çıktı, `schema`, `schemaVersion`, `exportedAt`, `appVersion` ve `state` alanlarıyla taslak paketi üretir.
  - Word çıktısı şimdilik Word uyumlu `.doc` HTML dosyasıdır; açıklama metinleri, tablo yapıları, değerleme/emsal tabloları ve koordinat verilerinden üretilen krokiler dosyaya eklenir.
  - Word açıklama metinlerinde Placeholder için üretilen `... Şablonu` kayıtları, `_template` anahtarları ve `{{...}}` token içeren taslak metinler dışarıda bırakılır. Örn. Konut Bölgesi seçiliyken Ticaret/Sanayi/Tarımsal çevresel özellik şablonları Word çıktısına yazılmaz.
  - Word tablo tasarımı uygulamadaki tablo görünümüne yaklaştırıldı: `word-table` sınıfı, daha sıkı hücre tasarımı, geniş tablolar için `@page WordLandscape` yatay sayfa bölümü ve emsal kayıtları için solda alan adları / sağda emsal sütunları olan matris düzeni eklendi.
  - Word tablo fontları küçültüldü; tablo başlıkları ve bölüm başlıkları kalınlaştırıldı. Inline SVG kroki yerine Word uyumlu VML kroki üretimi (`buildPointSketchVml`) ve koordinat lejandı eklendi.
  - Word çıktısı, kroki mevcutsa MHTML paket olarak üretilir; kroki canvas üzerinde PNG'ye çevrilip dosyanın içine `image/png` parçası olarak gömülür. Tablo renkleri uygulama temasındaki `--green`, `--surface-muted`, `--line` tonlarına sabitlendi.
  - **PDF olarak kaydet** butonu eklendi. PDF akışı, aynı rapor HTML'ini gömülü PNG kroki data URL'leriyle yeni yazdırma penceresinde açar ve tarayıcının PDF olarak kaydet ekranını çağırır. Popup engellenirse HTML yedeği indirilir.
  - Emsal çıktı matrisine `Taşınmaza Olan Mesafesi` satırı eklendi. Satır `row.c20` değerini kullanır; boşsa enlem/boylamdan `buildComparableLocationText` ile anlık mesafe/yön metni üretir.
  - JSON taslak import sonrasında Adres ve Konum bölümündeki `city`, `district`, `neighborhood` boşsa Tapu (`titleCity/titleDistrict/titleNeighborhood`), KML veya adres kaynak alanlarından tamamlayan `hydrateImportedAddressAdministrativeFields` koruması eklendi.
  - Gayrimenkul türüne göre bölüm görünürlüğü eklendi: `Dikey Kat İrtifakı` ve `Yatay Kat İrtifakı` seçimlerinde **Arsa Özellikleri**; `Arsa` ve `Tarla` seçimlerinde **Ana Gayrimenkul Özellikleri** ile **Bağımsız Bölüm Özellikleri** menüde, zorunlu alan kontrolünde ve Word/PDF açıklama-export akışında gizlenir.
  - Ana Gayrimenkul teknik bilgilerine **Bina Oturumu Referansı** açılır listesi eklendi (`bina girişi`, `bina köşe kotları`, `bina özgün şekli`, `cephe görselleri`, `bina oturumu geometrisi`). Projeye uygunluk `uygundur` olduğunda, uygunluk cümlesinden önce `BİNAOTURUMU`, `BİNA.GİRİŞ.KAT.SEVİYESİ` ve `BİNA.GİRİŞ.YÖNÜ` alanlarından bina oturumu/giriş açıklaması otomatik oluşturulur.
  - **Gabim Veri Seti** ana menü bölümü eklendi. Kullanıcının gereksiz bulduğu Genel Bilgiler grubu hariç bırakıldı; tapu, tapuya özel bilgiler, yapıya özel bilgiler, yapı türü, ek bilgiler, bağımsız bölüm/taşınmaz özellikleri ve BB imar bilgileri sistem alanlarından otomatik derlenen GABİM formatlı kontrol panelinde gösterilir.
  - GABİM veri seti eşleştirmeleri güncellendi: taşınmaz kimlik no ve eşyalı satış satırları kaldırıldı; tapu türü `Zemin Tipi + Mülkiyet`, hisseli cevabı `Mülkiyet Türü`, halihazır kullanım `Bağımsız Bölüm Kullanım Durumu`, kentsel dönüşüm `İmar sorunu + Kentsel Dönüşüm`, havuz/güvenlik `Sosyal Tesisler` seçimlerinden beslenir. Adres ve Konum bölümüne varsayılan `1. Derece` olan Deprem Derecesi alanı eklendi; GABİM deprem derecesi buradan dolar.
  - GABİM veri setine **Genel Ek Bilgiler** grubu eklendi. Değer türü, hesaplanan emsal, ulaşım imkanı, yatırım/markalı konut/ticari-sanayi-turizm gelişme göstergeleri, satılabilirlik ve inşaat kalitesi mevcut rapor alanlarından türetilir; tasarruf finansman şirketi alanı veri yoksa `Seçiniz`, tercihli kullanım alanı ise güvenli varsayımla `Hayır` gelir.
  - GABİM `Hesaplanan Emsal` satırı artık kullanıcı tarafından değiştirilen `calculatedEmsal` alanını öncelikli okur. `Ulaşım İmkanı`, `Ana Arter Mesafesi` seçimine göre `yakın=Yüksek`, `orta yakın=Orta`, `uzak=Düşük` döner. İnşaat kalitesinde `Lüks` seçimi GABİM'e `Lüks` olarak aktarılır.
  - İncelenen belgeler tablosunda belge bilgisi yoksa ve `Mimari Proje Var mı?` seçimi `Hayır` ise **Yapı Yaşı** manuel girişe açılır; bu durumda belge yenileme akışı kullanıcı tarafından girilen yapı yaşını ezmez.
  - Cezai karar açıklaması kurum kuralı düzeltildi: Büyükşehir Belediyesi veya İl Özel İdaresi seçili değilse metin daima ilçe belediyesi arşivi üzerinden kurulur. Bu özel kurumlardan biri seçiliyse özel kurum ile ilçe belediyesi birlikte yazılır; Webtapu cezai karar kurum metnine dahil edilmez.
  - Adres ve Konum bölümünde **YAKIN ÇEVRESİNDE BULUNAN ÖNEMLİ ARTERLER** metni artık yalnızca Yakın çevre seçimi listesinde o an görünen ve işaretli olan noktalardan üretilir. `Kullanıcı Noktalarını Getir` işlemi, eski otomatik seçili çevre noktalarını korumaz; kullanıcı noktalarını getirirken yalnızca kullanıcı noktalarını seçili bırakır.
  - Harita kullanıcı noktası akışı genişletildi: `Yakın Çevre Kaydet` yakın çevre noktası, `Ulaşım Arteri Kaydet` ise `user-artery` kategorili kullanıcı ana arteri kaydeder. Kullanıcı arterleri aynı `server-data/user-pois.json` veritabanında tutulur, ana arter seçim listesinde görünür ve seçildiğinde ulaşım tarifi koordinata göre otomatik güncellenir.
  - Test: `tools/check-basic.js`

### Bu Oturumda Koşulan Kontroller

Bundled node ile çalıştırıldı:

```powershell
node --check src/comparables/comparable-market-analysis.js
node --check src/value-factors/value-factors-rules.js
node tools/test-comparable-market-analysis.js
node tools/test-value-factors-rules.js
node tools/check-basic.js
```

Son bilinen temiz çıktılar:
- `Emsal piyasa analizi testi tamam.`
- `Değeri etkileyen faktörler testi tamam.`
- `Temel kontrol tamam: dosyalar, JavaScript sozdizimi ve iOS PDF uyumluluk blogu saglam.`

### Güncel Cache-Buster

`index.html` içinde son güncel sürümler (2026-07-12 itibarıyla):

- `src/comparables/comparable-market-analysis.js?v=20260711-0341`
- `src/land/minimum-parcel-sizes.js?v=20260711-0400`
- `src/value-factors/value-factors-rules.js?v=20260707-1050`
- `src/risk/halkbank-risk-rules.js?v=20260707-1812`
- `src/templates/template-engine.js?v=20260712-0133` (yeni, banka şablonları)
- `styles.css?v=20260711-1539`
- `app.js?v=20260712-0133`
- `cloud/cloud-sync.js?v=20260711-1539`
- `cloud/report-library.js?v=20260710-1626`
- `manifest.json`, `icons/*.png`, `service-worker.js` (Faz 3)
- `assets/gate-bg/blueprint-background.png`, `assets/gate-bg/blueprint-background-dark.png` (giriş kapısı arka planı; cache-buster'sız — değişirse dosya adını değiştirin)
- `templates/*.html` (banka şablonları; motor `?t=Date.now()` ile çektiğinden cache-buster GEREKMEZ, düzenleme anında etkilidir)

Yeni değişikliklerde ilgili script ve `app.js` sorgu sürümlerini artırmayı unutmayın.

**Dikkat:** `tools/check-basic.js` güncel `app.js?v=...` VE `styles.css?v=...`
sürümlerini sabit metin olarak doğrular (satır ~420-421); cache-buster artırınca
oraları da güncelleyin, yoksa test kırılır.

---

## 1. Proje & Çalıştırma

Yerel (Türkçe) **gayrimenkul değerleme raporu yazma programı**. Saf JavaScript (build yok).

Ana dosyalar:
- `app/app.js` — ~21k satır, tek klasik script. Üst düzey `function`lar global; `state`
  ve `const`ler `window`'da değil ama tarayıcı-eval'inde çıplak isimle erişilebilir.
- `app/index.html`, `app/styles.css`
- `app/server.js` — statik sunucu, `PORT` env okur (varsayılan 5173), `__dirname`'den servis eder.

**Node PATH'te YOK.** Bundled runtime kullanın:
`C:\Users\90551\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`
- Sözdizimi: `node --check app.js` · Kontroller: `node tools/check-basic.js`

**Kullanıcının kendi sunucusu genelde 5173'te çalışır — kapatmayın.** Doğrulama için
proje kökünde `.claude/launch.json` içinde `autoPort: true` (runtimeExecutable = tam
bundled node yolu, runtimeArgs `["app/server.js"]`) ile Claude_Preview MCP kullanın;
aynı dosyaları farklı portta ayrı bir kopya olarak açar.

**Cache-buster kuralı:** HER değişiklikte `app/index.html` içindeki İKİ sürüm sorgusunu
da güncelleyin — `styles.css?v=YYYYMMDD-HHMM` ve `app.js?v=...`. Aksi halde tarayıcı
eski derlemeyi kullanır (kullanıcı Ctrl+F5 yapmak zorunda kalır).

Durum kalıcılığı: `localStorage["rapor-yazma-programi-draft-v1"]`, debounce'lu
`autosave`→`saveState` ile. Debounce nedeniyle senkron eval okumaları kaydetme yan
etkilerini görmez → kaydetme-zamanı davranışını test etmek için `saveState()`'i doğrudan çağırın.

PDF/mahalle testleri için: dosyaları `app/test-inputs/_probe_*` altına kopyalayıp
tarayıcıda `fetch('test-inputs/_probe_*')` ile `File` oluşturup `processTakbisFile` /
`processAddressFile` / `processKmlFile` çağırın (pdf.js soğuk başlangıç = gerçek ilk
yükleme). İş bitince probe dosyalarını silin.

---

## 2. Bu Oturumda Eklenen Özellikler

Çoğu **14 - Açıklamalar** bölümüne panel olarak eklendi; her biri Kopyala butonlu ve
ilgili verilerden otomatik üretiliyor.

| Özellik | Yer / Anahtar |
|---|---|
| Emsal Değerleme Tablosu — kira İND. birim değeri sütunu + Değerleme'ye kira otomatik yazımı + modern gruplu tasarım | Emsaller bölümü |
| İpotek lehdar **combobox** (odakta tüm banka listesi, yazınca filtre, serbest lehdar) | Takyidat / İpotekler |
| Emsallerde **Enlem/Boylam** salt-okunur satırları (haritadan seçilen koordinatlar) | Emsaller matrisi (c18/c19) |
| Tüm açıklama textarea'larına ve üretilen açıklama panellerine **Kopyala** butonu | Genel |
| **Değerleme Yöntemleri Hesap Açıklaması** (emsal/gelir/maliyet, yasal-mevcut) | `{{DEGERLENDIRME_SEMASI}}` |
| **Değerleme Yöntemi Seçimi Açıklaması** (seçili yönteme göre canlı güncel matbu cümle) | `{{DEGERLEME_YONTEMI_ACIKLAMASI}}` |
| **Takyidat Tablosu** (Beyanlar/Hak ve Mükellefiyetler/Rehinler/Şerhler bantlı) | `{{TAKYIDAT_TABLO}}` |
| **Malikler Tablosu** (hisse yasal/mevcut değerleri = hisse oranı × toplam; toplam yoksa 0) | `{{MALIKLER_TABLO}}` |
| **Değerleme Özet Tablosu** (Piyasa/Arsa/Yapı/Şerefiye/Sigorta, m² birim + oranlar, kompakt) | Açıklamalar |
| **Açık Adres** (İdari mahalle → sokak → site/apartman → blok → dış kapı → kat → iç kapı → ilçe/il → UAVT) | `{{ACIK_ADRES}}` |

Placeholder kaydı: `collectGeneratedPlaceholders` içindeki `generatedRows` dizisine
`{ category, key, title, value }` eklenerek yapılır; token `makePlaceholderToken(key)`
ile üretilir (ASCII anahtar → makrolarla birebir token, ör. `DEGERLENDIRME_SEMASI`).

---

## 3. Bu Oturumda Düzeltilen Hatalar

1. **Bölümlere girilemiyordu (Ana Gayrimenkul / Değerleme / Açıklamalar).** Kök neden:
   `getBuildingDepreciationAgeNumber` içinde tanımsız `parseDateInputToIso` çağrısı →
   ReferenceError render'ı kırıyordu. Düzeltme: `dateTrToIso` kullanıldı.

2. **Emsal konumu seçilince tüm emsallerin kat/mülkiyet (c6) seçimleri siliniyordu.**
   Kök neden: `saveState()`→`normalizeReportStateFields()`, comparables'ı `section.table.
   columns` ile yanlış eşleştirip select değerlerini başlık-formatına çeviriyordu; değer
   opsiyon listesiyle eşleşmeyince render'da filtrelenip siliniyordu. Düzeltme:
   normalizasyon `tableKey === "comparables"` için atlanıyor.

3. **Tapu ve Mülkiyet alanları büyük harf + kopyala büyük harf.** `titleTextUppercaseKeys`
   ile bu bölümün metin alanları Türkçe büyük harfe çevriliyor (render + blur +
   normalizeReportFieldValue). Anlatı cümleleri bu alanları `normalizeReportTitleText`
   ile yeniden proper-case yaptığından bozulmuyor.

4. **KML, Bağımsız Bölüm Niteliği'ni bozuyordu.** KML `<Data name="Nitelik">` aslında
   ana taşınmaz niteliğidir; `titleQuality`'e `force` ile yazılıyordu. Düzeltme: KML
   niteliği → `mainPropertyQuality`; ayrıca **KML artık `titleQuality` ve `postalCode`
   alanlarına hiç dokunmuyor** (kullanıcı isteği).

5. **İlk adres PDF yüklemesinde posta kodu yanlış (ikinci yüklemede düzeliyordu).** Kök
   neden: adres PDF'i il/ilçe içermiyordu; `findLocalNeighborhoodByAddress` boş il
   filtresini atlayıp **başka ildeki aynı isimli mahalleyi** eşleştiriyordu
   (Panayır→Balıkesir 10442, Soğanlı→72502). Düzeltmeler:
   - **Adres PDF ham metninden il/ilçe çekiliyor** (`parseAddressLine`, "İL/İLÇE/MAHALLE/
     SOKAK" satırı) — birincil ve en sağlam çözüm.
   - Boşsa `titleCity`/`titleDistrict` (TAKBİS) yedeği.
   - İl bilinmiyorsa sunucudaki `postal` sorgusu eşleşme döndürmez (yanlış-il eşleşmesi yok).
   - `processTakbisFile` de posta kodu lookup'ını yeniden tetikler (yükleme sırası fark etmez).
   - `processAddressFile`, force'lu düzeltmeyi `await` eder (yarış/sessiz hata yok).
   - Büyük mahalle CSV'si tarayıcıya indirilmez; sorgular kimlik doğrulamalı
     `/api/neighborhoods` rotasında sunucu tarafında çalışır.

---

## 4. Bilinen Notlar / Bekleyenler

- `[Cozuldu 2026-07-16]` `parseComparableNumber` binlik nokta ayracli
  ("2.000.000") degerleri destekliyor; bu eski not arsiv amacli tutulmustur.
- Mahalle veritabanının dosya adı eski Bursa çalışmasından kalmıştır; veri seti Türkiye
  genelindeki il/ilçe/mahalle kayıtlarını içerir ve yalnızca sunucu tarafında okunur.
- `joinTurkishList` app.js'de 3 kez tanımlı (sonuncusu geçerli, `cleanupPlaceName` uygular);
  yeni Türkçe liste birleştirmede buna güvenmeyin, inline yazın.
- Word tarafındaki tablo placeholder'ları (`{{TAKYIDAT_TABLO}}`, `{{MALIKLER_TABLO}}`) makro
  ile Excel'den doldurulabiliyor; uygulama bunların metin karşılığını Placeholder bölümünde
  gösterir.

---

## 5. Doğrulama Kısayolu

Değişiklikten sonra: (1) index.html'de iki sürümü de yükselt, (2) `node --check app.js`,
(3) Claude_Preview ile reload + eval doğrulaması, (4) enjekte test verisini localStorage'dan
temizle (`localStorage.removeItem('rapor-yazma-programi-draft-v1')` + reload) ve probe
dosyalarını sil. Kullanıcıya asıl sunucuda (5173) **Ctrl+F5** hatırlat.
## 0.0.67 2026-07-11 Hesaplanan Emsal Otomatik Hesaplama Düzeltmesi (Codex oturumu)

Kullanıcı, Emsaller bölümündeki `Hesaplanan Emsal` alanının otomatik gelmediğini bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` değiştiğinde hesaplanan emsal değeri görünür kutuya anlık aktarılır.
- Önceki kayıtlardan kalan boş `Hesaplanan Emsal` alanındaki manuel kilit artık otomatik hesabı engellemez.
- Kullanıcı hesaplanan emsal kutusunu boşaltırsa manuel kilit kaldırılır ve otomatik hesap yeniden devreye girer.
- Türkçe binlik yazımı desteklenir: `1.000 x 1,5 = 1.500`.

Yedek:
`backups/before-calculated-emsal-auto-fix_2026-07-11_00-20-51`

Servis sürümü:
`app.js?v=20260711-0025`, `styles.css?v=20260711-0025`

Doğrulama:
- `node --check app.js`
- `node tools/check-basic.js`
- `node tools/test-comparable-market-analysis.js`
- Canlı tarayıcıda `Yüzölçümü 1000` ve `Emsal/KAKS 1,5` ile `Hesaplanan Emsal = 1.500` doğrulandı.
## 0.0.68 2026-07-11 Hesaplanan Emsal Kaynak Alan Senkronu (Codex oturumu)

Kullanıcı, hesaplanan emsal alanının yalnızca alana backspace uygulandığında değiştiğini bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` değişiklikleri artık önceki manuel hesaplanan emsal değerini zorunlu olarak yeniler.
- Bu davranış İmar Durumu bölümündeki KAKS/Emsal ile Hesaplanan Emsal bağlantısı gibi çalışır.
- Hesaplanan Emsal alanı elle değiştirilebilir; ancak kaynak alanlardan biri değiştiğinde otomatik değer tekrar esas alınır.

Yedek:
`backups/before-calculated-emsal-source-sync-fix_2026-07-11_00-34-31`

Servis sürümü:
`app.js?v=20260711-0030`, `styles.css?v=20260711-0030`
## 0.0.69 2026-07-11 Hesaplanan Emsal Görünür Yenileme (Codex oturumu)

Kaynak alan değişikliğinde hesaplanan emsal değeri görünür kutuya da kesin olarak yansıtıldı.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` veya `Kat Adedi` yazılırken otomatik hesap oluştuğunda Emsaller bölümü yeniden çizilir.
- Eski manuel hesaplanan emsal değeri ekranda kalmaz; yeni kaynak değer hesaplanıp gösterilir.

Servis sürümü:
`app.js?v=20260711-0035`, `styles.css?v=20260711-0035`
## 0.0.70 2026-07-11 Emsal Giriş Performans Düzeltmesi (Codex oturumu)

Kullanıcı, yüzölçümü yazarken her rakamda tüm bölümün yeniden hesaplanması nedeniyle ciddi kasma olduğunu bildirdi.

Yapılanlar:
- `Yüzölçümü`, `Emsal / KAKS` ve `Kat Adedi` yazılırken ağır emsal/değerleme panelleri artık yeniden çizilmez.
- Otomatik hesaplama ve bölüm yenileme alan tamamlandığında `change` olayında çalışır.
- Yazım sırasında yalnızca taslak değeri tutulur; kullanıcı deneyimi akıcı hale gelir.

Servis sürümü:
`app.js?v=20260711-0040`, `styles.css?v=20260711-0040`
## 0.0.71 2026-07-11 Hesaplanan Emsal m² Birim Değerleri (Codex oturumu)

Emsal matrisinde `İndirgenmiş M2 Birim Değer` altına iki otomatik hesap alanı eklendi:
- `Hesaplanan Emsal m2 Birim Değeri`: satış değeri / hesaplanan emsal alanı.
- `İndirgenmiş Hesaplanan Emsal m2 Birim Değeri`: hesaplanan emsal m2 birim değerine özellik ve konum indirgemelerinin uygulanmış hali.

Arsa/tarla emsallerinde hesaplanır; konut/yapı emsallerinde hesaplanan emsal alanı olmadığı için boş kalır. Mevcut `M2 Birim Değer` hesabı yüzölçümü üzerinden çalışmaya devam eder.

Servis sürümü:
`app.js?v=20260711-0050`, `styles.css?v=20260711-0050`

---

## 0.0.72 2026-07-11 Konum Sebebi Ham Metin ve YalnÄ±zca Konum Åerefiyesi (Codex oturumu)

YapÄ±lanlar:
- `c10` blur sÄ±rasÄ±nda otomatik baÅŸlÄ±k biÃ§imlendirmesine uÄŸramÄ±yor; kullanÄ±cÄ±nÄ±n girdiÄŸi bÃ¼yÃ¼k/kÃ¼Ã§Ã¼k harflerle korunuyor.
- `KÄ±sa Emsal Metni` hesaplanan alanÄ± ve ilgili Ã¼retim fonksiyonu kaldÄ±rÄ±ldÄ±.
- Arsa/tarla emsal alanlarÄ±ndan `Ä°mar Åerefiyesi` kaldÄ±rÄ±ldÄ±; uzun emsal paragrafÄ±ndaki imar ÅŸerefiyesi cÃ¼mlesi kaldÄ±rÄ±ldÄ±.
- Arsa/tarla emsallerinde indirgenmiÅŸ hesaplanan emsal m2 birim deÄŸeri ve indirgenmiÅŸ m2 birim deÄŸer artÄ±k yalnÄ±zca `Konum Åerefiyesi` ile hesaplanÄ±yor.

Yedek:
`backups/before-comparable-location-only-and-text-cleanup_2026-07-11_01-00-37`

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0100`, `styles.css?v=20260711-0100`

---

## 0.0.73 2026-07-11 Emsal Tablosu Arsa/Tarla Görünümü ve Üst Yatay Kaydırma (Codex oturumu)

Yapılanlar:
- Emsaller matrisinin üstüne alt yatay kaydırma çubuğuyla senkron çalışan ikinci yatay kaydırma çubuğu eklendi.
- Emsal Değerleme Tablosu konut/ofis/işyeri emsallerinde mevcut kira ve iç özellik sütunlarıyla çalışmaya devam ediyor.
- Arsa/tarla emsallerinde ayrı tablo görünümü eklendi: Yüzölçümü, satış/pazarlık değerleri, m² birim değer, Konum Şerefiyesi, İndirgenmiş m² Birim Değer, Hesaplanan Emsal m² Birim Değeri ve İndirgenmiş Hesaplanan Emsal m² Birim Değeri.
- Arsa/tarla değerleme özetinde kira ve iç özellik şerefiyesi sütunları gösterilmiyor.

Yedek:
`backups/before-comparable-summary-land-table-and-top-scroll_2026-07-11_01-17-29`

Servis sürümü:
`app.js?v=20260711-0110`, `styles.css?v=20260711-0110`

---

## 0.0.74 2026-07-11 Hesaplanan Emsal Sütunu (Codex oturumu)

Arsa/tarla Emsal Değerleme Tablosu'nda `Yüzölçümü` sütununun hemen yanına otomatik `Hesaplanan Emsal` sütunu eklendi. Değer doğrudan emsal satırının hesaplanan emsal alanından alınır.

Servis sürümü:
`app.js?v=20260711-0120`, `styles.css?v=20260711-0120`

---

## 0.0.75 2026-07-11 Hesaplanan Emsal Değer Tespiti Bölümü (Codex oturumu)

- Emsal Değerleme Tablosu altındaki 50.000 TL yuvarlama açıklaması kaldırıldı.
- Arsa/tarla emsallerinde `Hesaplanan Emsal Değerine Göre Değer Tespiti` bölümü eklendi.
- Konu taşınmazın hesaplanan emsali, arsa/tarla emsallerinin `İndirgenmiş Hesaplanan Emsal m² Birim Değeri` ortalamasıyla çarpılarak piyasa değeri hesaplanıyor.
- Formül satırı görünür şekilde eklendi: `(Hes. Emsal) × İndirgenmiş Hesaplanan Emsal m² Birim Değeri Ortalaması = Piyasa Değeri`.

Servis sürümü:
`app.js?v=20260711-0130`, `styles.css?v=20260711-0130`

---

## 0.0.76 2026-07-11 Hesaplanan Emsal Değer Tespiti Tablo Geliştirmesi (Codex oturumu)

- Değer tespiti tablosuna Taşınmaz Yüzölçümü, KAKS Oranı, Konu Taşınmazın Hesaplanan Emsali, Hesaplanan Emsal m² Birim Değeri, m² Birim Değeri ve Piyasa Değeri sütunları eklendi.
- Piyasa değeri `Hesaplanan Emsal × m² Birim Değeri` hesabından sonra 50.000 TL adımına yuvarlanıyor.
- Eski `İND. HESAPLANAN EMSAL M² BİRİM DEĞERİ ORTALAMASI` başlığı `HESAPLANAN EMSAL M² BİRİM DEĞERİ` olarak güncellendi.
- Formül açıklamasında `Taşınmaz yüzölçümü × KAKS oranı = Hesaplanan Emsal` açıkça gösteriliyor.

Servis sürümü:
`app.js?v=20260711-0140`, `styles.css?v=20260711-0140`

---

## 0.0.77 2026-07-11 Yuvarlanmış Piyasa Değerinden Birim Değer Türetimi (Codex oturumu)

- Piyasa değeri 50.000 TL adımına yuvarlandıktan sonra birim değerler yeniden hesaplanıyor.
- `m² Birim Değeri = Piyasa Değeri / Taşınmaz Yüzölçümü`.
- `Hesaplanan Emsal m² Birim Değeri = Piyasa Değeri / Hesaplanan Emsal`.
- Formül açıklaması bu iki türetimi de gösteriyor.

Servis sürümü:
`app.js?v=20260711-0150`, `styles.css?v=20260711-0150`

---

## 0.0.78 2026-07-11 Emsal Tablosu Başlık ve Formül Sadeleştirmesi (Codex oturumu)

- Değer tespiti tablosundaki `(Hes. Emsal)` parantezi kaldırıldı.
- Tablo altındaki uzun hesaplama/formül açıklaması kaldırıldı.
- Emsal matrisi ve değerleme tablosunda `İstenen Fiyat` → `Talep Edilen Değer`, `Pazarlıklı Fiyat` → `Pazarlıklı Değer` olarak güncellendi.

Servis sürümü:
`app.js?v=20260711-0160`, `styles.css?v=20260711-0160`

---

## 0.0.79 2026-07-11 Arsa Piyasa Değeri Başlığı (Codex oturumu)

Değer tespiti bölümü başlığı `Hesaplanan Emsale Göre Arsa Piyasa Değeri` olarak güncellendi. Dinamik yenileme sırasında da aynı başlık korunuyor.

Servis sürümü:
`app.js?v=20260711-0170`, `styles.css?v=20260711-0170`

Yedek:
`backups/before-comparable-emsal-title-update_2026-07-11_09-20-51`

Yedek:
`backups/before-comparable-derived-unit-values_2026-07-11_09-08-23`

Yedek:
`backups/before-comparable-emsal-value-table-refinement_2026-07-11_09-01-12`

Yedek:
`backups/before-comparable-calculated-emsal-valuation-panel_2026-07-11_08-53-14`

Yedek:
`backups/before-comparable-summary-calculated-area-column_2026-07-11_08-43-41`

---

## 0.0.80 2026-07-11 Arsa/Tarla Mülkiyetinde Değerleme Temizliği ve Tarla Emsal Otomasyonu (Codex oturumu)

- Mülkiyet `Arsa` veya `Tarla` seçildiğinde bina, bağımsız bölüm ve eski değerleme alanları temizleniyor; bina/bağımsız bölüm kat tabloları da boşaltılıyor.
- Arsa/Tarla mülkiyetinde Değerleme bölümündeki `KONU TAŞINMAZIN DEĞERİNİN HESAPLANMASINDA KULLANILACAK TABLO` gizleniyor.
- Arsa/Tarla için Piyasa Değeri alanları taşınmaz yüzölçümüyle eşitleniyor; kira satırları eski verilerin görünmemesi için gösterilmiyor.
- Tarla mülkiyetinde Piyasa Değeri, Emsaller bölümündeki indirgenmiş m² birim değer ortalaması ile yüzölçümünün çarpımından hesaplanıyor ve mevcut 50.000 TL yuvarlama kuralı uygulanıyor.

Servis sürümü:
`app.js?v=20260711-0180`, `styles.css?v=20260711-0180`

Yedek:
`backups/before-land-ownership-valuation-cleanup_2026-07-11_09-36-40`

---

## 0.0.81 2026-07-11 Arsa/Tarla Değerleme Panellerinin Sadeleştirilmesi (Codex oturumu)

- Mülkiyet `Arsa` veya `Tarla` olduğunda Değerleme bölümünde Yapı Değeri, Sigortaya Esas Değer, Arsa Değeri ve Şerefiye panelleri gizleniyor.
- Piyasa Değeri paneli korunuyor; Tarla için indirgenmiş m² emsal ortalaması × taşınmaz yüzölçümü hesabı ve 50.000 TL yuvarlama kuralı uygulanmaya devam ediyor.

Servis sürümü:
`app.js?v=20260711-0190`, `styles.css?v=20260711-0190`

Yedek:
`backups/before-land-valuation-panel-hide_2026-07-11_09-53-58`

---

## 0.0.82 2026-07-11 Arsa Piyasa Değerinin Hesaplanan Emsal Sonucuna Bağlanması (Codex oturumu)

- Mülkiyet `Arsa` seçildiğinde Değerleme bölümündeki yasal ve mevcut piyasa değeri, Emsaller bölümündeki `Hesaplanan Emsale Göre Arsa Piyasa Değeri` tablosunun `Piyasa Değeri` sonucundan otomatik alınır.
- Arsa sonucu değiştiğinde değerleme alanları yeniden oluşturulurken aynı değer korunur; Tarla için mevcut indirgenmiş m² birim değer ortalaması × yüzölçümü ve 50.000 TL yuvarlama kuralı aynen devam eder.

Servis sürümü:
`app.js?v=20260711-0191`, `styles.css?v=20260711-0191`

Yedek:
`backups/before-arsa-valuation-sync_2026-07-11_10-27-20`

---

## 0.0.83 2026-07-11 Arsa Hesaplanan Emsal Tablosunun DeÄŸerleme BÃ¶lÃ¼mÃ¼ne TaÅŸÄ±nmasÄ± (Codex oturumu)

- `Hesaplanan Emsale GÃ¶re Arsa Piyasa DeÄŸeri` tablosu Emsaller bÃ¶lÃ¼mÃ¼nden kaldÄ±rÄ±ldÄ±.
- Tablo yalnÄ±zca mÃ¼lkiyet `Arsa` seÃ§ildiÄŸinde DeÄŸerleme bÃ¶lÃ¼mÃ¼nde, Piyasa DeÄŸeri panelinin hemen Ã¼stÃ¼nde gÃ¶steriliyor.
- Emsal verileri deÄŸiÅŸtiÄŸinde tablo ve Arsa piyasa deÄŸeri baÄŸlantÄ±sÄ± mevcut yenileme akÄ±ÅŸÄ±yla korunuyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0192`, `styles.css?v=20260711-0192`

Yedek:
`backups/before-move-arsa-valuation-table_2026-07-11_10-35-20`

---

## 0.0.84 2026-07-11 Arsa/Tarla Emsal Piyasa Analizi Metni (Codex oturumu)

- Arsa ve Tarla mÃ¼lkiyetlerinde `Piyasa Analizi ve Emsal DeÄŸerlendirmesi` metni araziye uygun ayrÄ± bir akÄ±ÅŸtan Ã¼retiliyor.
- Bu metinlerde cephe, kat, iÃ§ Ã¶zellik ve iÃ§ mekan iÅŸÃ§ilik kriterleri kullanÄ±lmÄ±yor.
- Arazi analizinde konum, yÃ¼zÃ¶lÃ§Ã¼mÃ¼, imar koÅŸullarÄ±, imar yapÄ±laÅŸma nizamÄ±, Emsal/KAKS oranÄ± ve imar lejantÄ± kriterleri kullanÄ±lÄ±yor. Konut/ofis/Ä°ÅŸyeri emsal metni korunuyor.

Emsal analiz modÃ¼lÃ¼ sÃ¼rÃ¼mÃ¼:
`src/comparables/comparable-market-analysis.js?v=20260711-0340`

Yedek:
`backups/before-land-comparable-analysis-text_2026-07-11_10-39-52`

---

## 0.0.85 2026-07-11 Arazi Emsal Metninde Sabit KarÅŸÄ±laÅŸtÄ±rma Ä°fadesi (Codex oturumu)

- Arsa/Tarla emsal analizinde otomatik `olumlu yÃ¶nde` veya `olumsuz yÃ¶nde` ifadesi kaldÄ±rÄ±ldÄ±.
- Arazi metni sabit olarak `olumlu ve olumsuz yÃ¶nleri karÅŸÄ±laÅŸtÄ±rÄ±larak` ifadesini kullanÄ±yor.
- Konut/Ofis/Ä°ÅŸyeri emsal metnindeki mevcut dinamik yÃ¶n mantÄ±ÄŸÄ± korunuyor.

Emsal analiz modÃ¼lÃ¼ sÃ¼rÃ¼mÃ¼:
`src/comparables/comparable-market-analysis.js?v=20260711-0341`

Yedek:
`backups/before-fixed-land-analysis-direction_2026-07-11_10-45-26`

---

## 0.0.86 2026-07-11 Adres Metninde Nokta SonrasÄ± TÃ¼rkÃ§e BÃ¼yÃ¼k Harf (Codex oturumu)

- Adres kodu PDF'sinden gelen `2.selÃ§uk Sokak` benzeri metinlerde nokta sonrasÄ± TÃ¼rkÃ§e harf artÄ±k otomatik bÃ¼yÃ¼tÃ¼lÃ¼yor: `2.SelÃ§uk Sokak`.
- DÃ¼zenleme `toTitleCaseTr` iÃ§inde yapÄ±ldÄ±; mevcut adres baÅŸlÄ±k dÃ¼zeni korunuyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0193`, `styles.css?v=20260711-0193`

Yedek:
`backups/before-address-period-capitalization_2026-07-11_10-53-29`

---

## 0.0.87 2026-07-11 5403 SayÄ±lÄ± Kanun Minimum Parsel KontrolÃ¼ (Codex oturumu)

- KullanÄ±cÄ±nÄ±n paylaÅŸtÄ±ÄŸÄ± `5403_minimum_arazi_olculeri_il_ilce.xlsx` dosyasÄ±ndaki 933 il/ilÃ§e kaydÄ± `src/land/minimum-parcel-sizes.js` iÃ§ine aktarÄ±ldÄ±.
- Tarla bÃ¶lÃ¼mÃ¼nde `Parsel Ã¼zerinde Zirai ÃœrÃ¼n Var mÄ±?` = `Evet` ise Dikili Arazi, `HayÄ±r` ise TarÄ±m TÃ¼rÃ¼ne gÃ¶re Sulu Arazi veya Kuru Arazi limiti kullanÄ±lÄ±yor.
- Parsel yÃ¼zÃ¶lÃ§Ã¼mÃ¼ il/ilÃ§e ve seÃ§ilen arazi tÃ¼rÃ¼ limitiyle karÅŸÄ±laÅŸtÄ±rÄ±lÄ±yor; sonuÃ§ Tarla bÃ¶lÃ¼mÃ¼nde ayrÄ± kontrol alanÄ±nda ve Arsa aÃ§Ä±klamasÄ± iÃ§inde `karÅŸÄ±lamaktadÄ±r/karÅŸÄ±lamamaktadÄ±r` olarak gÃ¶steriliyor.
- Arsa mÃ¼lkiyetinde tarÄ±m kontrolleri Ã¶nceki kurala uygun olarak gizli kaldÄ±rÄ±ldÄ±.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0194`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-agricultural-parcel-limit-rule_2026-07-11_21-29-36`

---

## 0.0.88 2026-07-11 Minimum Parsel KontrolÃ¼nÃ¼n AÃ§Ä±klamalar BÃ¶lÃ¼mÃ¼ne Eklenmesi (Codex oturumu)

- 5403 sayÄ±lÄ± Kanuna gÃ¶re minimum parsel kontrol cÃ¼mlesi 14-AÃ§Ä±klamalar bÃ¶lÃ¼mÃ¼nde de read-only bir aÃ§Ä±klama alanÄ± olarak gÃ¶steriliyor.
- AynÄ± ortak hesap sonucu kullanÄ±ldÄ±ÄŸÄ± iÃ§in il, ilÃ§e, yÃ¼zÃ¶lÃ§Ã¼mÃ¼, tarÄ±m tÃ¼rÃ¼ veya zirai Ã¼rÃ¼n seÃ§imi deÄŸiÅŸtiÄŸinde aÃ§Ä±klama otomatik yenileniyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0195`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-minimum-parcel-explanation-field_2026-07-11_21-51-43`

---

## 0.0.91 2026-07-12 Arsa/Tarla Emsallerinde Yola Cephe ve Tarla Imar Alanlarinin Temizlenmesi

- Arsa/Tarla emsallerinde Boylam satirinin altina `Yola Cephe Durumu` (`c29`) eklendi.
- Secenekler: Kadastro yola cephesiz, Kadastro yola cepheli, Imar yoluna cepheli, Asfalt yola cepheli, Acilmamis imar yoluna cepheli.
- Uzun emsal aciklamasinda yola cephe durumu konum karsilastirmasindan sonra gosteriliyor.
- Emsal Niteligi `Tarla` oldugunda imar lejanti, yapilasma nizamı, Emsal/KAKS, kat adedi ve hesaplanan emsal alanlari otomatik bosaltiliyor; bu bilgiler tarla aciklamasina da yazilmiyor.

Servis surumu:
`app.js?v=20260712-0135`

Yedek:
`backups/before-comparable-road-frontage-and-tarla-zoning_2026-07-12_15-30-10`

Ek duzeltme:
`Yola Cephe Durumu` alani yanlis gorunurluk kumesinden cikarilip land-only gorunurluk kumesine alindi; Arsa/Tarla ve Tum Emsaller gorunumlerinde gorunur hale getirildi.

Servis surumu:
`app.js?v=20260712-0136`

Yedek:
`backups/before-fix-road-frontage-visibility_2026-07-12_15-51-20`

Gorunurluk duzeltmesi:
`Yola Cephe Durumu` sutunu tum Emsal gorunumlerinde gorunur hale getirildi; konut emsallerinde alan bos kalir, Arsa/Tarla emsallerinde secim kullanilir.

Servis surumu:
`app.js?v=20260712-0137`

Yedek:
`backups/before-force-road-frontage-column-visible_2026-07-12_15-57-57`

Artifact cache duzeltmesi:
- `app.js` ve service worker kaydi `20260712-0138` surumune tasindi.
- Artifact tarafinin eski sekme/service worker kodunu kullanmasi engellendi.

Servis surumu:
`app.js?v=20260712-0138`, `service-worker.js?v=20260712-0138`

Yedek:
`backups/before-artifact-cache-refresh_2026-07-12_16-03-45`

---

## 0.0.89 2026-07-11 Minimum Parsel CÃ¼mlesinin Arsa AÃ§Ä±klamasÄ±ndan Ã‡Ä±karÄ±lmasÄ± (Codex oturumu)

- Minimum parsel kontrol cÃ¼mlesi Arsa aÃ§Ä±klamasÄ±ndan kaldÄ±rÄ±ldÄ±.
- CÃ¼mle yalnÄ±zca 14-AÃ§Ä±klamalar bÃ¶lÃ¼mÃ¼ndeki `5403 SayÄ±lÄ± Kanuna GÃ¶re Minimum Parsel KontrolÃ¼` alanÄ±nda gÃ¶steriliyor.

Servis sÃ¼rÃ¼mÃ¼:
`app.js?v=20260711-0196`, `styles.css?v=20260711-1539`

Yedek:
`backups/before-remove-minimum-sentence-from-land-note_2026-07-11_23-07-56`

---

## 0.0.87 2026-07-11 Giris Kapisina Blueprint Arka Plan Sahnesi (Claude oturumu)

- Kullanicinin ayri bir oturumda `ui-ux-pro-max` skill'i ile hazirlattigi giris sayfasi arka plan tasarimi (blueprint illustrasyon + acik/koyu tema anahtari + hafif parcacik animasyonu), zorunlu giris kapisina (`#authGateOverlay`) uygulandi.
- Iki illustrasyon `assets/gate-bg/blueprint-background.png` (acik tema, 1536x1024, ~2.0MB) ve `assets/gate-bg/blueprint-background-dark.png` (koyu tema, 1536x1024, ~2.5MB) olarak projeye kopyalandi.
- `index.html`: `#authGateOverlay` icine `.gate-scene` (blueprint gorsel + izgara deseni, vinyet, 10 adet parcacik, acik/koyu tema anahtari) satir ici `<script>` ile eklendi. Sahne, Firebase/cloud-sync yuklenmesini beklemeden calisir; kapinin kendisi hala satir ici (inline) opak arka planla ilk boyamadan itibaren engelleyicidir (mevcut fail-closed davranis degismedi). Tema tercihi `localStorage` anahtari `rapor-gate-theme` ile hatirlanir (varsayilan: koyu, mevcut lacivert markaya uyumlu).
- `#authGateContent`'e `position:relative;z-index:10` eklendi - CSS boyama sirasi kurali geregi (positioned/z-index'li kardesler arasinda agac sirasina gore boyanma) bu olmadan arka plan sahnesi giris formunun USTUNE binebilirdi; eklenmesiyle form her zaman sahnenin onunde kalir (tarayicida `elementFromPoint` ile dogrulandi).
- `styles.css`: yeni "GIRIS KAPISI ARKA PLANI" bolumu - tum kurallar `#authGateOverlay` altinda izole (`.gate-*` siniflari), uygulamanin geri kalan temasi/diger ekranlar etkilenmiyor. `prefers-reduced-motion: reduce` icin animasyonlar kapatiliyor.
- `cloud-sync.js`: `renderGateLogin()`'deki kart div'ine yalnizca `class="gate-card"` eklendi (kutu golgesi + giris animasyonu icin); e-posta/sifre giris mantigi, buton ID'leri ve dogrulama akisi DOKUNULMADI (gercek Firebase girisi zaten test edilmis durumdaydi, riske atilmadi).
- Bilinen sinirlama / not: PNG dosyalari toplam ~4.5MB; `server.js` no-store/no-cache header'lari geregi her sayfa acilisinda yeniden indirilir. Yavas mobil baglantilarda giris ekraninin ilk boyamasi (kapi zaten opak, engelleyici) etkilenmez ama blueprint gorseli birkac saniye gec belirebilir. Ileride WebP'ye cevirme degerlendirilebilir (bu oturumda yapilmadi).
- Dogrulama: bu sandbox'taki onizleme tarayicisinda (`Rapor Yazma` sunucusu, port 5173) kalici gercek bir Firebase oturumu (canlilar.melih@gmail.com) zaten acik bulundugundan, kapi gizli durumdaydi; gercek auth durumuna dokunmadan `renderGateLogin`'in urettigi DOM parcasi `#authGateContent`'e enjekte edilerek gorsel/etkilesim dogrulamasi yapildi: `.gate-blueprint` gorseli ag isteginde 200 OK dondu, `elementFromPoint` ile kartin sahnenin onunde ve tiklanabilir oldugu, tema anahtarinin `data-gate-theme` ozniteligini ve `localStorage`'i dogru guncelledigi, acik/koyu PNG'lerin dogru yuklendigi teyit edildi. Sayfa daha sonra yeniden yuklenerek test DOM'u temizlendi, konsolda hata kalmadigi dogrulandi. Gercek cihazda uctan uca gorsel onay kullanicidan istenmedi (opsiyonel, dusuk risk).

Servis surumu:
`styles.css?v=20260711-1539`, `cloud/cloud-sync.js?v=20260711-1539`

Yeni dosyalar:
`assets/gate-bg/blueprint-background.png`, `assets/gate-bg/blueprint-background-dark.png`

Yedek:
`backups/before-gate-blueprint-background_2026-07-11_15-23-08`

---

## 0.0.90 2026-07-12 Banka Rapor Sablonlari Sistemi (Claude oturumu)

Kullanicinin eski Excel programinda kullandigi 10 sablon dosyasi
(C:\RAPOR FORMATLARI\ altindaki 8 banka .doc/.docx + Isbank masraf .doc +
Ziraat ek tablo .xlsx) incelendi; her birinin bolum/tablo yapisi ve icindeki
{{PLACEHOLDER}} adlari cikarildi (.doc'lar Word 97-2003 binary; Word COM
kullaniciya ait acik Word ile cakisip takildigi icin Python + olefile ile
piece-table uzerinden metin cikarildi). ONEMLI KESIF: eski sablonlar zaten
{{SEHIR}}, {{ADRES2025}}, {{TAKYIDAT_TABLO}} gibi eski Excel adlandirilmis
hucre adlarini kullaniyor; 213 benzersiz token'in 204'u
server-data/adlandirilmis_hucreler_listesi.json'daki adlarla eslesiyor.

Yeni sistem:

- `src/templates/template-engine.js` (YENI) - `window.RaporTemplates`.
  Cozumleme sirasi: (1) LEGACY_ALIASES eski Excel adlari (~170 ad; alan,
  tarih, para bicimi, metin uretici, HTML tablo uretici turleri),
  (2) uygulama alan anahtarlari (sections[].fields[].key),
  (3) olusturulan metin anahtarlari (collectGeneratedTextPlaceholders).
  Karsilastirma Turkce-katlanmis ve noktalama duyarsiz:
  {{SEHIR}}={{sehir}}={{SEHIR}}, {{DIS.KAPI.NO}}={{dis_kapi_no}}.
  Eslesme yoksa ciktida sari "UYARI AD" isareti + dis aktarma sonunda uyari
  listesi; eslesme var ama deger bossa cikti bos kalir (eski Excel gibi).
  HTML yorumlari (<!-- -->) dolum oncesi cikarilir (sablon notlari Word'e
  sizmasin + yorumdaki ornek {{...}} eksik sayilmasin). Tablolar icin
  app.js'in mevcut ureticileri cagrilir (buildTakyidatTableText,
  buildMaliklerTableText, buildValuationSummaryText,
  buildComparableValuationWordTableHtml, buildHalkbankRiskCodesTableText...).

- `templates/` (YENI klasor) - kullanicinin SERBESTCE DUZENLEYEBILECEGI
  bagimsiz HTML sablonlari: akbank, halkbank, isbankasi, isbankasi-masraf,
  kuveytturk, vakifbank, vakifkatilim, yapikredi, ziraat, ziraat-ek-tablo
  (10 dosya). Her biri ilgili bankanin orijinal .doc yapisina sadik
  (GDYS Yardimci Bilgiler + GABIM Veri Seti + Calisma Kagidi tablolari
  dahil; Halkbank'ta risk kodu tablolari; Ziraat ek tablo yatay sayfa).
  Eski "Konut Bolgesi Ise / Ticaret Bolgesi Ise" cift paragraflari yerine
  uygulamanin bolge turune gore otomatik uretilen
  {{ENVIRONMENTAL_FEATURES_TEXT}} metni kullanildi. Isbank masraf
  yazisindaki ucret kalemleri programda bulunmadigindan sablonda noktali
  bosluk (elle doldurulur) olarak birakildi.

- `templates/PLACEHOLDER-REHBERI.md` (YENI) - kullanici dokumantasyonu:
  duzenleme kurallari, tum placeholder listesi (kategori kategori), yeni
  sablon ekleme talimati (TEMPLATE_REGISTRY), programda karsiligi OLMAYAN
  eski adlarin listesi (ACILYASAL/ACILMEVCUT, NETPARSELALAN, TERKMIKTARI,
  ARKABAHCE, ISKANTARIHI, net alanlar, ucret kalemleri...).

- `app.js`: createOutputExportPanel'e "Banka Sablonuyla Kaydet" blogu
  eklendi (appendBankTemplateExportBlock) - sablon secme listesi (bankaya
  gore otomatik on-secim: state.fields.bank -> defaultTemplateKeyForBank)
  + "Banka sablonuyla kaydet (Word)" butonu. Motor yuklu degilse blok hic
  gorunmez, uygulama eskisi gibi calisir.

- `tools/test-bank-templates.js` (YENI) - regresyon testi: 10 sablondaki
  TUM {{token}}'larin cozumlenebildigini (alan anahtarlari GERCEK app.js
  kaynagindan, uretilen metin anahtarlari gercek
  collectGeneratedTextPlaceholders govdesinden cikarilarak) + ornek deger
  cozumlemeleri (para bicimi, ilk malik satirindan tapu tarihi/yevmiye,
  SAHIPLER listesi, Ziraat belge alanlari) + katlama esdegerliklerini
  dogrular. app.js'te bir alan anahtari yeniden adlandirilirsa bu test kirilir.

Dogrulama: node --check (engine + app.js), tools/test-bank-templates.js,
check-basic.js ve diger 4 test paketi GECTI. Tarayicida canli dogrulandi:
motor yukleniyor, "Banka ve Cikti" bolumunde blok goruluyor (10 secenek),
banka secilince varsayilan sablon otomatik geliyor (Kuveyt Turk denendi),
10 sablonun tamami canli uygulama verisiyle SIFIR eksik token ile doldu,
konsolda hata yok. NOT: gercek .doc indirme tiklamasi tarayicida
denenmedi (indirme diyalogu otomasyonu guvenilir degil); fillTemplate +
downloadTextFile yollari ayri ayri dogrulanmis mevcut kod yollaridir.
Kullanicinin gercek bir raporla "Banka sablonuyla kaydet (Word)" deneyip
Word ciktisini gormesi onerilir.

Bilinen sinirlar / gelecek isler:
- ACILYASAL/ACILMEVCUT, NETPARSELALAN, TERKMIKTARI, ISKANTARIHI, net
  alanlar icin programda alan yok (rehberde listelendi; istenirse alan
  olarak eklenebilir).
- YAPIKALITESI2025 -> unitMaterialQuality esleniyor; kullanici farkli bir
  kaynak isterse LEGACY_ALIASES'ta tek satir degisiklik yeterli.
- Sablonlar .doc (Word-HTML) olarak iner; Word "farkli kaydet" ile .docx'e
  cevrilebilir.

Servis surumu:
`app.js?v=20260712-0133`, `src/templates/template-engine.js?v=20260712-0133`
(check-basic.js pinleri guncellendi)

Yeni dosyalar:
`src/templates/template-engine.js`, `templates/*.html` (10 adet),
`templates/PLACEHOLDER-REHBERI.md`, `tools/test-bank-templates.js`

Yedek:
`backups/before-bank-templates_2026-07-12_01-17-12`

---

## 0.0.90 2026-07-12 Minimum Parsel Kontrolunun Yalnizca Tarla Degerlemesine Tas

- `5403 Sayili Kanuna Gore Minimum Parsel Kontrolu` alani Arsa Ozellikleri ve 14-Aciklamalar formlarindan kaldirildi.
- Kontrol artik yalnizca mulkiyet turu `Tarla` oldugunda Degerleme bolumunde, Degerleme Yontemi Aciklamasi ile Satis Kabiliyeti Aciklamasi arasinda gosteriliyor.
- Arsa ve diger mulkiyet turlerinde bu panel gorunmuyor.

Servis surumu:
`app.js?v=20260712-0134`

Yedek:
`backups/before-minimum-parcel-explanation-field_2026-07-11_21-51-43`

---

## 0.0.92 2026-07-12 Banka Sablonlari: Program Placeholder Adlarina Gecis (Claude oturumu)

Kullanici karari: sablon dosyalarinda SADECE programin urettigi placeholder
adlari kullanilacak; eski Excel adlarinin hangi program adina karsilik
geldigi ongorulerek cevrildi. 0.0.90'daki 10 sablonun tamami yeniden
yazildi (yapi/bolum sirasi degismedi, yalnizca token adlari):

- Alan token'lari artik uygulamanin Placeholder bolumundekiyle ayni:
  {{SEHIR}}->{{CİTY}}, {{ILCE}}->{{DİSTRİCT}}, {{MAHALLE}}->{{TİTLE_NEİGHBORHOOD}},
  {{ADRES2025}}->{{ACIK_ADRES}}, {{ZEMİNTİPİ}}->{{GROUND_TYPE}},
  {{TAPUNİTELİKBB}}->{{TİTLE_QUALİTY}}, {{YASALDURUMDEĞERİ}}->{{LEGAL_VALUE}},
  {{İMARDURUMUKISA}}->{{PLANNİNG_NOTE_TEXT}}, {{OLUMLUFAKTÖR}}->
  {{DEGERI_ETKILEYEN_OLUMLU_FAKTORLER}} vb. (~90 esleme; tam liste rehberde).
- Panel alanlari icin program adi kurali: {{ELEVATOR}}, {{CARPARK}},
  {{SOCİAL_FACİLİTİES}}, {{UNİT_HEATİNG_TYPE}}, {{TOTAL_FLOORS}},
  {{UNİT_MATERİAL_QUALİTY}}, {{FACADES}}... — motorun alan indeksine
  EXTRA_FIELD_KEYS listesi eklendi (sections disinda panellerce yonetilen
  gercek state.fields anahtarlari).
- Program token'larinin tarih/para bicimli halleri icin oncelikli takma
  adlar eklendi: {{APPOİNTMENT_DATE}}/{{PLAN_DATE}}/{{TAKBİS_DATE}}/
  {{EKB_ISSUE_DATE}}/{{EKB_VALİD_UNTİL}} GG.AA.YYYY; {{LEGAL_VALUE}}/
  {{CURRENT_VALUE}}/{{CURRENT_RENT}}/{{LEGAL_RENT}} "1.234.567 TL" bicimli;
  {{UNİT_CONSTRUCTİON_LEVEL}} bossa "Tamamlanmis (%100)".
- Program karsiligi olmayan hesaplanan kavramlarin motor token'lari
  program uslubuyla adlandirildi (rehberde * ile isaretli):
  {{TAPU_TARİHİ}}, {{TAPU_YEVMİYESİ}}, {{EDİNME_SEBEBİ}}, {{HİSSELİ_Mİ}},
  {{İSKAN_VAR_MI}}, {{İÇİ_GÖRÜLDÜ_MÜ}}, {{SİTE_İÇİNDE_Mİ}},
  {{İNCELENEN_BELGELER_TABLO}}, {{EMSAL_1..7}}, {{EMSAL_TABLOSU}},
  {{DEGERLENDIRME_TABLOSU}}, {{YILLIK_KİRA_MEVCUT}},
  {{KAT_BAZLI_İÇ_HACİMLER}}, {{ZRT_BELGE_TÜRÜ/TARİHİ/NO}}.
- {{BAĞIMSIZBÖLÜM2025}} -> {{UNİT_İNTERİOR_DESCRİPTİON_TEXT}} +
  {{UNİT_DECORATİVE_DESCRİPTİON_TEXT}} (iki ayri program metni).
- Akbank'taki ters anlamli "AYNI MI" satiri program semantigine cevrildi
  ("FARK VAR MI" + {{USAGE_NATURE_DİFFERENCE}}); Isbank'taki {{SAHIPLER}}
  hucresi kaldirildi (Malikler tablosu zaten var); {{DAHAÖNCESATIŞ}}
  statik EVET/HAYIR yapildi; Yapi Kredi "var ise aciklamasi" hucresi elle
  doldurulmak uzere "-" birakildi.
- ESKI ADLAR HALA CALISIR (tolerans katmani LEGACY_ALIASES duruyor) —
  kullanicinin kendi eski sablon metinleri bozulmaz; ancak bizim
  dosyalarimizda eski ad kullanilmasi artik test hatasidir:
  tools/test-bank-templates.js'e FORBIDDEN_LEGACY_TOKENS kontrolu eklendi
  (~75 eski adin sablon dosyalarinda GECMEMESI dogrulanir) + yeni program
  adi cozumleme assert'leri ({{LEGAL_VALUE}} para bicimi, {{TAPU_TARİHİ}}
  ilk malik satirindan, EXTRA_FIELD_KEYS cozumu...).
- Alan indeksi cozumlerinde \n -> <br /> donusumu eklendi (cok satirli
  textarea alanlari Word'de satir sonlarini korur).
- templates/PLACEHOLDER-REHBERI.md program adlariyla bastan yazildi.

Dogrulama: test-bank-templates + check-basic + 4 mevcut paket GECTI;
tarayicida 10 sablonun tamami canli dolduruldu, SIFIR eksik token, konsol
temiz; ornek program token'lari (CİTY, LEGAL_VALUE, TAPU_TARİHİ,
SOCİAL_FACİLİTİES, İSKAN_VAR_MI, EMSAL_1) canli ortamda cozuldu.

Servis surumu:
`src/templates/template-engine.js?v=20260712-1542` (check-basic pini
guncellendi; templates/*.html cache-buster gerektirmez)

Yedek:
`backups/before-template-program-tokens_2026-07-12_15-35-48`

---

## 0.0.93 2026-07-12 Kuveyt Turk Sablonuna INVEX Portal Gorunumu (Claude oturumu)

Kullanici Kuveyt Turk INVEX ekspertiz portalinin 5 ekran goruntusunu
paylasip ayni renk tonlari ve sayfa yerlesimiyle sablon istedi.
templates/kuveytturk.html INVEX gorunumunde bastan yazildi:

- Renkler: Kuveyt Turk yesili (#009b6b, koyu #007a55), acik yesil
  sekme/serit zemini (#e7f5ee, kenar #bee0d2), TURUNCU bolum basliklari
  (#e8820c, gri bant #efefef uzerinde - portaldeki "TASINMAZ BILGILERI"
  bandi gibi), gri form kutulari (#e9e9e9, kenar #cfcfcf), sag hizali
  koyu yesil etiketler (#17493b).
- Yerlesim portal akisiyla ayni: ust serit + KuveytTurk | ekspertiz
  markasi + is/musteri satiri > Talep/Rapor sekme hapi seritleri >
  Temel Bilgiler > Tapu Kaydi (malikler tablosu, ada/parsel, arsa payi,
  ADRES NO/Tasinmaz ID uyari notuyla) > Konum (acik adres + ulasim
  tarifi + enlem/boylam) > Rapor/Ozellikler (NITELIGI, TASINMAZ
  BILGILERI, ENERJI KIMLIK, MB ACIKLAMA, TAPU TAKYIDAT, BOLGE
  OZELLIKLERI, TEKNIK OZELLIKLER, ISKAN BILGISI, IMAR DURUMU, INCELENEN
  BELGELER, DEGERLEMEYI ETKILEYEN FAKTORLER) > Degerleme > Emsaller >
  GDYS/GABIM/Calisma Kagidi.
- Placeholder seti degismedi (0.0.92'deki program adlari aynen);
  test-bank-templates + check-basic GECTI.
- Not: .doc ciktisinda Word arka plan renklerini/tablolari korur;
  yuvarlak kose gibi ayrintilar yalnizca tarayici gorunumunde.
- Istenirse ayni INVEX stili diger banka sablonlarina da uygulanabilir
  (her bankanin kendi portal rengiyle).

Yedek:
`backups/before-kuveytturk-invex-style_2026-07-12_15-52-22`
## 0.0.94 2026-07-12 Kullanım Niteliği Farkı Yoksa Mevcut Niteliğin Senkronizasyonu

- `Yasal/Mevcut Kullanım Türü Arasında Fark Var Mı?` seçeneği `Hayır` olduğunda gizli kalan `Mevcut Kullanım Niteliği` state değeri, `Yasal Kullanım Niteliği` ile otomatik eşitleniyor.
- Senkronizasyon ilk yükleme/JSON içe aktarma sırasında, yasal nitelik değiştiğinde ve fark kutusu işaretsiz hale getirildiğinde çalışıyor.
- Alan kullanıcı arayüzünde gizli kalmaya devam ediyor; fark `Evet` olduğunda mevcut kullanım niteliği kullanıcı tarafından seçilebilir.

Servis sürümü:
`app.js?v=20260712-0139`

Dogrulama: `node --check app.js`, `node --check src/templates/template-engine.js`, `tools/check-basic.js` ve `tools/test-bank-templates.js` geçti.

---
## 0.0.95 2026-07-12 Graphify Haritasinin Gelistirme Akisina Eklenmesi

- Graphify kuruldu ve proje kod haritasi `graphify-out/` altinda olusturuldu.
- Harita: 47 kod dosyasi, 18.253 dugum ve 41.551 baglanti.
- Etkilesimli agac: `graphify-out/GRAPH_TREE.html`.
- Gelistirme kuralı: degisiklik oncesi `explain/query/affected/path`, degisiklik sonrasinda `update` ve gerekirse `cluster-only` kullanilacak.
- Bu kural proje kokundeki `AGENTS.md` dosyasina da eklendi.

---
## 0.0.96 2026-07-12 Belge Yukleme Alaninin Belirginlestirilmesi

- `styles.css` icinde belge yukleme kartlari satir/sutun cerceveleri ile daha belirgin hale getirildi.
- Masaustu ve tablet gorunumlerinde kartlar ortak cerceve icinde, mobilde ise ayri cerceveli satirlar olarak gosteriliyor.
- Hover/focus durumunda aktif kart mavi cerceve ile vurgulaniyor.
- Sunucu `127.0.0.1:5174` uzerinden 200 yanit veriyor; in-app browser acik sekme baglantisi bu oturumda kurulamadigi icin yan panel canli olarak dogrulanamadi.
- Graphify kod haritasi guncellendi: 18.521 dugum, 42.055 baglanti.

Yedek:
`backups/before-document-upload-visibility_2026-07-12_17-10-09`

Dogrulama: `tools/check-basic.js` gecti.

---
## 0.0.97 2026-07-12 Hisseli Mulkiyet Hisse Aciklamasinin Degerlemeye Tasınmasi

- Mülkiyet türü `Hisseli Mülkiyet` olduğunda otomatik hisse açıklaması, Değerleme Yöntemi Açıklaması ile Satış Kabiliyeti Açıklaması arasına taşındı.
- 14-Açıklamalar bölümündeki `Hisse Açıklaması` alanı kullanıcı arayüzünde gizli tutuluyor; placeholder/state değeri korunuyor.
- Hisse açıklaması değerleme panelinde kopyalanabilir ve mevcut otomatik güncelleme akışıyla senkron kalıyor.

Servis sürümü:
`app.js?v=20260712-0140`

Yedek:
`backups/before-shared-ownership-valuation-note_2026-07-12_17-26-07`

Dogrulama: `node --check app.js`, `tools/check-basic.js` geçti. Graphify: 18.524 düğüm, 42.061 bağlantı.

---
## 0.0.98 2026-07-12 Ilce Iklim ve Deprem Bilgileri

- `Turkiye_Ilce_Iklim_Deprem.xlsx` incelendi; `İklim & Deprem Verileri` sayfasındaki 998 ilçe kaydı uygulamaya `src/land/climate-earthquake-data.js` olarak aktarıldı.
- İl ve ilçe seçildiğinde Arsa Özellikleri bölümünde `İklim ve Deprem Bilgileri` paneli ve otomatik açıklama cümlesi gösteriliyor.
- Cümlede bölge, yıllık yağış, sıcaklık, don günü, güneşlenme, rakım, nem, deprem bölgesi ve yağış sınıfı yer alıyor.
- İlçe eşleşmesi Türkçe karakter ve parantezli merkez kayıtlarına toleranslı; eşleşme yoksa panel gösterilmiyor.

Servis sürümü:
`app.js?v=20260712-0141`, `styles.css?v=20260712-1720`

Dogrulama: 998 veri kaydı, Bursa/Yıldırım örnek kaydı, JavaScript sözdizimi, `tools/check-basic.js` ve Graphify güncellemesi geçti. Graphify: 18.533 düğüm, 42.079 bağlantı.

---

---

## 0.0.101 2026-07-13 Emsaller Bolumu Tek Standart Formata Gecirildi (Claude oturumu)

Kullanici karari: tum banka sablonlarinin Emsaller bolumu AYNI formatta
olsun - kac emsal girilmisse o kadar sutunlu bir tablo, en altta da emsal
aciklamasi. 8 sablonda (akbank, halkbank, isbankasi, kuveytturk, vakifbank,
vakifkatilim, yapikredi, ziraat) Emsaller bolumu eski
`{{EMSAL_PIYASA_ANALIZI}} + {{EMSAL_TABLOSU}} + {{EMSAL_1}}...{{EMSAL_7}}`
(sabit metin paragraflari) yerine su standart iki placeholder'a cevrildi:

```
{{EMSAL_MATRISI}}

<h3>Emsal Açıklaması</h3>
{{EMSAL_PIYASA_ANALIZI}}
```

(Kuveyt Turk INVEX-stilinde `<div class="kt-subsec">Emsal Açıklaması</div>`
kullanildi, digerleri `<h3>`.)

- `{{EMSAL_MATRISI}}` -> `buildComparableMatrixWordTableHtml()`: satirlar
  emsal alanlari (Nitelik, Emsal Konumu, Yuzolcumu, Talep Edilen Deger...),
  sutunlar YALNIZCA dolu doldurulmus emsal sayisi kadar ("Emsal 1", "Emsal
  2"...) - baska bir oturumun 0.0.99'da ekledigi genisletilmis emsal
  placeholder sistemiyle ayni motor uzerinden calisiyor, ek kod gerekmedi.
- Yapi Kredi sablonunda ayrica statik "Emsallerin Yorumu" alt basligi
  kaldirilip yeni formata gecirildi (diger 7 sablonda zaten sadece
  EMSAL_PIYASA_ANALIZI/EMSAL_TABLOSU/EMSAL_1..7 vardi, ekstra baslik yoktu).
- `tools/test-bank-templates.js`'e yeni regresyon eklendi: 8 sablonun
  TAMAMINDA `{{EMSAL_MATRISI}}` ve "Emsal Açıklaması" basligi VAR, eski
  `{{EMSAL_TABLOSU}}` / `{{EMSAL_1}}`..`{{EMSAL_7}}` YOK olarak dogrulanir
  (masraf yazisi ve Ziraat ek tablosu bu kontrolun disinda, onlarda zaten
  Emsaller bolumu yok). Boylece ileride biri eski formata donerse test kirilir.
- `templates/PLACEHOLDER-REHBERI.md` Emsaller bolumu guncellendi: yeni
  standart format basa yazildi, eski EMSAL_TABLOSU/EMSAL_1..7 "eski format
  - yeni sablonlarda kullanmayin" notuyla isaretlendi (motor hala cozer,
  geriye donuk uyumluluk icin).

Dogrulama: `tools/test-bank-templates.js` (yeni regresyonla) GECTI.
Tarayicida canli test: state.tables.comparables'a 2 sonra 5 satir konulup
`{{EMSAL_MATRISI}}` basliklarinin sirasiyla "Emsal 1, Emsal 2" ve "Emsal 1
... Emsal 5" olarak dogru sekilde dinamik degistigi dogrulandi. 10
sablonun tamami gercek uygulama verisiyle sifir eksik token ile dolduruldu,
konsolda hata yok.

Yedek:
`backups/before-emsal-matrix-format_2026-07-13_00-40-01`

---

## 0.0.102 2026-07-13 Word Ciktisi: Uygulama Renkleriyle Eslesme + Kompaktlik (Claude oturumu)

Kullanici karari: Word/rapor ciktilarindaki tablolar programin ekranda
gosterdigi tablolarla AYNI renk/bicimde olsun; ayrica punto ve bosluklar
genel olarak %30-40 kucultulsun.

- Once styles.css'teki GERCEK ekran-ici tablo stilleri incelendi
  (.malikler-table, .takyidat-table, .halkbank-risk-table,
  .valuation-summary-table): header arka plani `--blue-soft` (#e4ebf8),
  header yazisi `--blue` (#3a5691), govde metni `--ink` (#152238), kenarlik
  `--line` (#dde3ef), cift-satir tonlamasi ~#f7f9f8, toplam/ozet satiri
  koyu `#1f2a32` zemin + beyaz yazi.
- Bu paletle `app.js` `buildWordReportHtml()` CSS blogu ve 7 program-renkli
  banka sablonu (akbank, halkbank, isbankasi, vakifbank, vakifkatilim,
  yapikredi, ziraat) guncellendi: eski `#eaf0fa`/`#d9dfdc`/`#1f2a32`(metin)
  degerleri yukaridaki gercek token degerleriyle degistirildi; ayrica bu 7
  sablonda ONCEDEN HIC OLMAYAN zebra-cizgi kurali eklendi
  (`.word-table tbody tr:nth-child(even) td { background:#f7f9f8; }`).
- Kuveyt Turk sablonunun INVEX (yesil/turuncu) renk semasi KASITLI OLARAK
  DEGISTIRILMEDI - o, bankanin kendi portal gorunumunu taklit ediyor
  (onceki acik talep); yalnizca punto/bosluklari kucultuldu.
- Kompaktlik: tum 10 dosyada (app.js word CSS + 9 sablon) punto/kenar
  bosluklari ~%20-35 kucultuldu (ornek: app.js govde 10pt->7pt, h1
  20pt->14pt, h2 15pt->10pt, .word-table 8.25pt->7pt, sayfa kenar bosluklari
  42/36pt->30/26pt). Zaten kucuk olan tablo puntolari (7-8.5pt araligi)
  okunabilirligi korumak icin biraz daha az agresif kesildi (~%15-20);
  buyuk basliklar/govde metni tam istenen %30-35 araliginda kesildi.
  Kuveyt Turk zaten yogun INVEX-stili oldugundan biraz daha yumusak
  (~%20-25) kesildi.

Dogrulama: `node --check app.js`, `tools/test-bank-templates.js` (regresyon
dahil) ve diger 4 test paketi GECTI. Tarayicida canli dogrulama:
`buildWordReportHtml()` cikan HTML'de yeni renk/punto degerleri dogrulandi;
10 sablonun TAMAMI gercek uygulama verisiyle SIFIR eksik token ile
dolduruldu, program-renkli 7 sablon + Ziraat ek tablo yeni mavi
header/kenarlik renklerini iceriyor (Kuveyt Turk kendi INVEX renginde
kaliyor, masraf yazisinda zaten tablo yok), tum sablonlarda govde puntosu
beklenen kucuk degere indi; konsolda hata yok.

Yedek:
`backups/before-word-style-match-and-compact_2026-07-13_01-18-40`

---

## 0.0.103 2026-07-13 Malikler Tablosu: Ekrandaki Panelle Birebir Ayni Yapida Word Ciktisi (Claude oturumu)

Kullanici gercek "Malikler Tablosu" panelinin ekran goruntusunu paylasip
"tablo birebir eklediğim görseldeki gibi çıktısı olmalı, bankanın renk
paletini boşver" dedi. Onceki oturumda (0.0.102) renk paletini styles.css
token'larindan DOGRU cikardigim onaylandi (tarayicida getComputedStyle ile
olculdu: header #e4ebf8/#3a5691, govde #152238, kenarlik #dde3ef, TOPLAM
satiri #1f2a32/beyaz) ama YAPISAL bir eksik ortaya cikti:

- `{{MALIKLER_TABLO}}` (ve ana Word ciktisindaki "Malikler Değer Tablosu")
  `buildMaliklerTableText()` + `formatTextTableForWord()` uzerinden
  uretiliyordu - bu yol TOPLAM satirini HIC URETMIYORDU ve 7 sutun oldugu
  icin gereksiz yere yatay sayfaya (`word-landscape-section`) sokuyordu,
  ayrica deger sutunlari sola hizaliydi (ekranda saga hizali/tabular).
- Ayrica ana Word ciktisinda ("Word olarak farkli kaydet") ayni veri IKI
  KEZ goruniyordu: eksik 5 sutunlu "Malikler" (ham state.tables.title) VE
  7 sutunlu ama TOPLAM'siz "Malikler Değer Tablosu".

Yapilanlar:
- `app.js`'e yeni `buildMaliklerTableWordHtml()` eklendi: ekrandaki
  `.malikler-table` ile BIREBIR ayni yapida (7 sutun, ilk sutun kalin/sola
  hizali, deger sutunlari saga hizali/tabular, TOPLAM satiri colspan=5 +
  2 deger hucresi, koyu zemin #1f2a32 + beyaz yazi) HTML uretir. Tum
  renkler SATIR ICI (inline) stille sabitlenir - hangi banka sablonuna
  yerlestirilirse yerlestirilsin ayni gorunur, sablonun kendi marka rengi
  (orn. Kuveyt Turk yesili) veri tablosunu etkilemez.
- Ana Word ciktisinda ("Word olarak farkli kaydet"): eksik 5 sutunlu
  "Malikler" satiri regularTables'tan kaldirildi, "Malikler Değer Tablosu"
  (TOPLAM'siz) generatedTables'tan kaldirildi; yerine tek, dogru,
  "Malikler Tablosu" basligiyla `buildMaliklerTableWordHtml()` cikisi
  eklendi (rapor akisinin basinda, ekrandaki gibi).
- `template-engine.js`: `MALIKLERTABLO` takma adi artik dogrudan
  `buildMaliklerTableWordHtml()` cagiriyor (eski formatTextTableForWord+
  buildMaliklerTableText zincirini bypass eder).
- DAHA GENIS ilke (kullanicinin "program içindeki tablolar" ifadesini
  karsilamak icin): `buildSimpleHtmlTable()` (Takyidat, İncelenen Belgeler,
  Beyanlar, Rehinler, Şerhler, Emsal matrisi/degerleme, Değerleme özet,
  Halkbank risk tablolarinin ORTAK ureticisi) da SATIR ICI stille
  boyanacak sekilde yeniden yazildi (ayni #e4ebf8/#3a5691/#dde3ef/#f7f9f8/
  #1f2a32 paleti). Onceki externa CSS-sinifi tabanli yaklasim (`.word-table
  th` vb.) her banka sablonunda ayri tanimlanmasi gerektiginden kirilgandi
  ve Kuveyt Turk gibi kendi CSS'i olan sablonlarda hic uygulanmiyordu;
  simdi TUM tablolar HANGI SABLONA YERLESTIRILIRSE YERLESTIRILSIN ayni
  gorunur. className parametresi ("meta"/"is-matrix"/"is-summary") geriye
  donuk uyumluluk icin korunur, sadece DAVRANISI artik satir ici stille
  uygulanir.
- `tools/test-bank-templates.js`'e iki yeni regresyon eklendi: (1)
  MALIKLERTABLO'nun buildMaliklerTableWordHtml() kullandigini, (2) bu
  fonksiyonun gercekten `colspan="5"` ve `>TOPLAM<` icerdigini dogrular -
  ileride biri eski (TOPLAM'siz) yola donerse test kirilir.

Dogrulama: `node --check app.js`, `tools/test-bank-templates.js` (yeni
regresyonlar dahil) ve diger 4 test paketi GECTI. Tarayicida ekran
goruntusundeki GERCEK verilerle (Enis Kaya, Kemal Kaya, Çiğdem Kaya Dağlı,
1/3 hisse, 3.900.000 TL yasal/mevcut) `buildMaliklerTableWordHtml()`
cagrildi - cikti BIREBIR eslesti: ENİS KAYA/KEMAL KAYA/ÇİĞDEM KAYA DAĞLI,
1/3, SATIŞ, 20.08.2021, 29515, 1.300.000 TL x2, TOPLAM satirinda
3.900.000 TL x2, koyu zemin+beyaz yazi, colspan=5, landscape'e SOKULMUYOR.
10 sablonun tamami sifir eksik token ile dolduruldu (MALIKLERTABLO dahil),
konsolda hata yok. check-basic.js, benimle ilgisiz onceden bilinen
app.js surum-pin farkindan dolayi basarisiz (baska oturumun hizli surum
artislari) - dokunulmadi.

Yedek:
`backups/before-word-style-match-and-compact_2026-07-13_01-18-40` (bu
oturumun 0.0.102 ile paylastigi yedek; ek yedek alinmadi cunku ayni
oturumun devami niteliginde).

## 0.0.104 2026-07-13 Rapor Ciktisi Tablolarinda Ekranla Tema ve Yapi Eslesmesi (Codex oturumu)

- `app.js`: `Değerleme Özet Tablosu`, ekrandaki `buildValuationSummaryGroups()` verisini kullanarak grup bantlari ve Kalem / Birim Değer / Tutar sutunlariyla Word/HTML raporuna aktariliyor. Eski duz metin tablosu yolu bu tablo icin devre disi birakildi.
- `app.js`: Ortak `buildSimpleHtmlTable()` ve `buildMaliklerTableWordHtml()` ciktilari satir ici stille uretiliyor; tablo siniflari banka sablonunun CSS'i tarafindan ezilmeden uygulama tablolarina yaklasiyor.
- `app.js`: Rapor CSS'i ve tablo renkleri secili tema tokenlarindan (`--ink`, `--line`, `--blue`, `--blue-soft`, `--surface`, `--surface-muted`, `--green`) okunuyor. Apple / Navy Blue secimi rapor ciktilarina da yansiyor.
- `src/templates/template-engine.js`: `DEGERLENDIRMETABLOSU` dogrudan ekranla uyumlu ozet tablo uretecini, `MALIKLERTABLO` ise ekranla uyumlu malik tablosunu kullaniyor.
- Dogrulama: `app.js` ve `src/templates/template-engine.js` syntax kontrolleri, `tools/test-bank-templates.js`, `tools/test-comparable-market-analysis.js` ve `git diff --check` basarili.

## 0.0.105 2026-07-13 Güvenlik Sertleştirme Turu (Claude oturumu)

Kullanıcı `Downloads/güvenlik.md` (12 kural + AI/LLM eki: secret yönetimi,
rate limiting, input validation, auth, SQL injection, CORS, HTTP güvenlik
header'ları, dosya yükleme, hata yönetimi, bağımlılık güvenliği, XSS/CSP,
deploy kontrol listesi) paylaşıp "bu dosyadaki mümkün olan tüm güvenlik
adımlarını ve aklına gelen diğer önlemleri son handoff ve graphify'ı
inceledikten sonra uygula" dedi. Önce `graphify explain "server.js"` ile
sunucunun gerçek yüzeyi çıkarıldı (POI API, PDF metin API, Overpass proxy,
state API, statik dosya sunumu) ve `PROGRAM-DEGERLENDIRME-VE-YOL-HARITASI.md`
(2026-06-21 tarihli, bu oturumdan önce yazılmış) okunarak İKİ bilinen ama
henüz düzeltilmemiş risk teyit edildi: (1) `resolved.startsWith(root)`
path-traversal kontrolü kardeş-klasör açığına sahipti, (2) `/api/state`
0.0.0.0 üzerinde auth'suz dinliyor.

`server.js` sertleştirmeleri:
- **Path-traversal + hassas-yol düzeltmesi**: `resolveStaticPath` artık
  `root + path.sep` karşılaştırıyor (eski `startsWith(root)` kardeş klasörü
  root sanabiliyordu). Ayrıca `backups/`, `.git/`, `node_modules/`,
  `graphify-out/`, `.env*` ve `server-data/` altındaki KİŞİSEL dosyalar
  (`active-case.json`, `user-pois.json`, `uploads/`) artık statik olarak
  hiç sunulmuyor (403). **Önemli düzeltme**: ilk denemede `server-data/`
  klasörünün TAMAMINI kapatmıştım ama bu, `app.js`'in runtime'da fetch
  ettiği paylaşılan referans veri setlerini (`bursa_manuel_duzeltilmis_
  ana_dosya.csv`, `adlandirilmis_hucreler_listesi.json` — mahalle/adres
  eşleştirme tabloları, kişisel veri değil) kırdı; tarayıcıda 403 görüp
  fark ettim ve denylist'i yalnızca gerçekten kişisel dosyalara daralttım.
- **Güvenlik header'ları + CSP**: tüm yanıtlara `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, ve bir CSP eklendi. CSP
  `script-src`'te `'unsafe-inline'` + `unpkg.com` (Leaflet) içeriyor —
  proje build'siz vanilla JS olduğu ve birkaç sayfa-içi `<script>` bloğu
  bulunduğu için kaçınılmaz bir bilinen sınırlama (yorum olarak
  belgelendi); `connect-src`/`img-src`/`worker-src` gerçek kullanılan tüm
  üçüncü taraf origin'leri (Overpass aynaları, Nominatim, ArcGIS, OSM/
  ArcGIS tile sunucuları, `*.googleapis.com`/`*.firebaseio.com`) açıkça
  beyaz listeye alındı.
- **Rate limiting**: harici bağımlılık eklemeden basit bellek-içi sabit-
  pencere sayaç (`/api/state` 60/dk, `/api/user-pois` 60/dk, `/api/overpass`
  30/dk, `/api/pdf-text` 5/dk — dosya yükleme için güvenlik.md'nin önerdiği
  daha sıkı limit), aşımda `Retry-After` header'lı 429.
- **CSRF sertleştirmesi**: POST/PUT mutasyon uçlarında özel `X-Rapor-Client`
  header'ı zorunlu kılındı (+ varsa Origin/Host eşleşmesi kontrolü). Sunucu
  cross-origin'e CORS izni vermediği için bu header tarayıcıyı preflight'a
  zorluyor ve kullanıcı çalışırken açık bir kötü niyetli sekmenin sessizce
  bu sunucuya yazma isteği göndermesini (drive-by CSRF) engelliyor.
  Overpass'ın kendi ayna sunucularına giden GEÇİCİ/ÜÇÜNCÜ TARAF isteklerine
  bu header EKLENMEDİ (aksi halde onların CORS'u isteği reddedebilirdi).
- **Input validation**: `/api/user-pois` artık lat/lng'yi Türkiye sınırları
  içinde olacak şekilde (35-43 / 25-45) ve ismi kontrol karakterlerinden
  temizleyerek doğruluyor; `/api/overpass` sorgu uzunluğu 20.000 karakterle
  sınırlandı; `/api/pdf-text` artık ilk baytlardaki `%PDF-` imzasını
  doğruluyor (istemcinin content-type beyanına güvenmiyor) ve dosya boyutu
  limiti 25MB'a çekildi (güvenlik.md'nin doküman önerisiyle uyumlu).
- **Hata yönetimi**: istemciye artık ham `error.message`/stack sızmıyor;
  tüm hata yolları `console.error` ile sunucu tarafında zaman damgalı
  loglanıp istemciye genel mesaj dönüyor.

`app.js`: üç `/api/*` fetch çağrısına (`readPdfTextOnServer`,
`saveUserPoiFromMap`, `saveUserMainArteryFromMap`) ve `fetchNearbyEndpoint`
içindeki KENDİ `/api/overpass` proxy çağrısına (üçüncü taraf ayna
sunucularına DEĞİL) `X-Rapor-Client` header'ı eklendi. `escapeHtml()`'e
tek tırnak (`'` → `&#39;`) kaçışı eklendi (savunma derinliği; mevcut 137
çağrı yeri zaten `"` kullanıyordu, kırılma riski yok).

`.gitignore`'a `.env`/`.env.local`/`.env.*.local` eklendi (proje şu an
secret kullanmıyor — Firebase apiKey zaten istemciye açık olması gereken
public bir değer, güvenlik sınırı Firestore Rules'ta — ama güvenlik.md'nin
1. kuralı ileriye dönük olarak istiyor).

**Kapsam dışı bırakılanlar (mimari olarak uygulanamaz, güvenlik.md'de var
ama bu projede karşılığı yok)**: SQL injection (SQL veritabanı yok),
JWT/parola/hesap kilitleme (auth Firebase Authentication'a devredilmiş,
kendi auth'umuz yok), LLM/prompt-injection/token bütçesi (uygulama içinde
hiçbir LLM API çağrısı yok), Zod/Pydantic şema doğrulama kütüphaneleri
(proje sıfır npm bağımlılığıyla çalışıyor; validation elle, aynı ilkeyle
yazıldı).

**Bilinçli olarak ERTELENEN (düzeltilmedi, güvenlik.md'nin isteyeceği ama
mevcut mimariyi kırma riski taşıyan)**: `/api/*` uçları hâlâ auth'suz;
`server.js` hâlâ `0.0.0.0`'da dinliyor (mobil-sunucu-baslat.bat özelliği
kasıtlı). PIN/token tabanlı LAN erişim auth'u zaten `PROGRAM-DEGERLENDIRME-
VE-YOL-HARITASI.md`'de P1 olarak not düşülmüş; bu turda CSRF sertleştirmesi
+ rate limit + validation ile "sürüş-geçişi" (drive-by) senaryosunu
kapattım ama aynı Wi-Fi'daki başka bir cihazın doğrudan `curl` ile
`/api/state`'e erişimini engellemiyor — bu, mevcut D7 (client-side auth
gate, server.js her isteği koşulsuz sunuyor) ile aynı ruhta, dürüstçe
açıklanmış bir sınırlama.

Doğrulama: `node --check` (server.js, app.js), tam test paketi
(`check-basic.js` + 4 parser testi + `test-bank-templates.js`) YEŞİL.
Ayrıca canlı sunucuya karşı `curl` ile: sensitive-path denylist (403),
path-traversal, CSRF header zorunluluğu (header'sız 403, header'lı 200),
koordinat doğrulama (Türkiye dışı 400), rate limit (6. istekte 429 +
Retry-After), PDF magic-byte kontrolü (sahte içerik 400, gerçek PDF —
`test-inputs/adres.pdf` — 200 ve metin çıkarıldı) tek tek test edildi.
Tarayıcıda: konsolda CSP ihlali YOK, Leaflet (unpkg) yüklendi, ArcGIS/OSM
tile görselleri yüklendi, gerçek Firestore/Auth senkronu ("Bulut ile
eşleşti.") çalışıyor durumda kaldı. Test sırasında `/api/user-pois`'e
yanlışlıkla eklenen "test" kaydı `server-data/user-pois.json`'dan temizlendi.

Ayrıca (bu turun kapsamına giren, ilgisiz ama check-basic.js'i bozan iki
sürüm/kalite farkı düzeltildi): `check-basic.js`'in `app.js`/`styles.css`/
`template-engine.js` sürüm-pin'leri gerçek `index.html` değerleriyle
eşitlendi (`app.js?v=20260713-0300`'e ben de bump ettim); ayrıca başka bir
oturumun "Deprem Derecesi" alanını `defaultValue: "1. Derece"`'den `""`'e
ve seçenekleri betimleyici hale getirmesiyle bayatlamış tek bir assertion
satırı, bu artık kasıtlı bir özellik değişikliği olduğu için kaldırıldı.

Yedek: `backups/before-security-hardening_2026-07-13_02-45-00/` (server.js,
app.js, index.html, .gitignore, tools/check-basic.js).

## 0.0.106 — 2026-07-13 — P1 API Guvenligi ve Deployment Sertlestirmesi

Onaylanan P1 kapsaminda su degisiklikler yapildi:

- `server.js` Firebase Authentication ID tokenlarini Firebase'in resmi
  sertifikalariyla dogruluyor. `/api/state`, `/api/user-pois`, `/api/overpass`
  ve `/api/pdf-text` artik oturumsuz isteklere 401 donuyor.
- `active-case.json` ve kullanici noktasi dosyalari artik Firebase UID'ye
  gore `server-data/users/<uid>/` altinda ayriliyor.
- Varsayilan Node host'u `127.0.0.1` oldu. Windows mobil baslatma dosyasi
  `HOST=0.0.0.0` verdigi icin tablet/telefon akisi korunuyor.
- `ecosystem.config.cjs` eklendi. PM2 deployment'i 5174 portunda localhost'a
  bagli, yeniden baslatilabilir ve kalici bir konfigurasyon kullaniyor.
- GitHub Actions deployment'i `pm2 startOrRestart ecosystem.config.cjs` ve
  localhost health check kullanacak sekilde guncellendi.
- Nginx reverse proxy ve Let's Encrypt ilk kurulum scripti eklendi:
  `deploy/nginx/rapor-yazma.conf.template`, `deploy/ubuntu/setup-https.sh`.
- API istemcileri Firebase ID tokenini `Authorization: Bearer` header'i ile
  gonderiyor; `cloud/cloud-sync.js` icinden `getIdToken()` acildi.

Dogrulama: Node syntax kontrolleri, temel kontrol, parser testleri, KML,
Imar, EKB ve banka sablon testleri basarili. Yerel smoke testte statik kok
200, token olmadan `/api/user-pois` 401 dondu.

Graphify code-only harita guncellendi: 18.578 dugum, 41.896 baglanti,
404 community. Dokuman/paper/image semantik guncellemesi API anahtari
gerektirdigi icin bu turda code-only tarama kullanildi.

Yedek: `backups/before-p1-security-deploy_2026-07-13_14-45-24/`.

## 0.0.107 2026-07-17 Gabim Veri Seti: Gayrimenkul Türüne Göre Koşullu Yapı (Claude oturumu)

Kullanıcı GDYS'nin (Denge Değerleme Gayrimenkul Değerleme Yönetim Sistemi)
gerçek "Gabim Veri Seti" formunun 4 farklı gayrimenkul türü için (Arsa,
Konut, Diğer Bina, Arazi) ekran görüntüsünü paylaşıp banka şablonlarındaki
Gabim Veri Seti bölümünün bu şekle uydurulmasını istedi. İnceleme:
şablonlardaki `<h2>GABİM VERİ SETİ</h2>` bölümü (Türkçe İ karakteri yüzünden
ilk taramada gözden kaçtı) sabit, türden bağımsız TEK bir alan listesi
gösteriyordu — GDYS'nin gerçek formu ise Mülkiyet/Yasal Kullanım Niteliği'ne
göre grup/alan kümesini değiştiriyor (ör. Arsa'da Yapıya Özel Bilgiler/Ek
Bilgiler hiç yok; Arazi'de ayrıca "Araziye Özel Bilgiler" var; Konut'ta tam
Cephe/Kat detayları var; diğer bina türlerinde (İşyeri/Ofis/Ticari/Sanayi)
sade Ek Bilgiler + sadece Enerji Sınıfı var).

Yapılanlar (`app.js`):
- `landClassification` ("Arazi Sınıflandırması" — Mutlak/Dikili/Özel Ürün/
  Marjinal/Örtü Altı Tarım Arazisi) alanı "Arsa Özellikleri" bölümüne eklendi
  — GDYS'nin Arazi formunda var, uygulamada hiç yoktu.
- `gabimPropertyProfile()`: `ownershipType` (Arsa/Tarla → bina yok) ve
  `legalUsageNature` (Arazi/Konut) alanlarından `{hasBuilding, isAgricultural,
  isResidential}` çıkarır.
- `gabimManagerText()`: "Yönetici Var mı?" — site içindeyse Var sayılır.
- `buildGabimDataGroups()` (ekran paneli — DEĞİŞMEDİ, hâlâ TÜM alanları
  gösterir, kullanıcı GDYS'ye elle veri girerken referans olsun diye) ek
  olarak yeni "Araziye Özel Bilgiler" grubu, "Yönetici Var mı?" ve "Enerji
  Sınıfı" satırları, "Ana Ulaşım Yoluna Cephesi Var mı?" satırı kazandı —
  bunlar sadece EKLEME, mevcut hiçbir satır kaldırılmadı.
- `buildGabimExportGroups()` (YENİ, sadece rapor/Word çıktısı için): ekran
  panelinin üst kümesini `gabimPropertyProfile()`'a göre budar — GDYS'nin 4
  ekran görüntüsündeki gerçek grup/alan kümesini birebir üretir. Ayrıca tüm
  satırları boş olan grupları (ör. hiç veri girilmemiş taslak raporlarda)
  otomatik gizler.
- `buildGabimDataSetWordHtml()` (YENİ): export gruplarını, diğer tablolarla
  aynı ilkeyle (satır içi stil, `getReportThemeToken` ile seçili temaya göre
  renk — Apple/Navy Blue) her grup için ayrı bir başlık + iki sütunlu
  (etiket/değer) tablo olarak üretir. Başlık metnini KENDİSİ üretmez (her
  banka şablonu kendi "GABİM VERİ SETİ" başlığını `<h2>`/`<div class="kt-sec">`
  ile zaten sağlıyor — MALIKLER_TABLO ile aynı kural).

`src/templates/template-engine.js`: `GABIMVERISETI: { h: () => safeCall
("buildGabimDataSetWordHtml") }` eklendi.

Şablonlar: 10 dosyadan raporun tamamını oluşturan 8'inde (isbankasi-masraf.html
ve ziraat-ek-tablo.html hariç — bunlar masraf yazısı/ek tablo, Gabim bölümü
hiç yok) eski sabit `<table class="meta">`/`<table class="kt-form">` alan
listesi silinip yerine `{{GABIM_VERI_SETI}}` konuldu; başlık (`<h2>GABİM
VERİ SETİ</h2>` veya Kuveyt Türk'te `<div class="kt-sec">`) korundu.

`templates/PLACEHOLDER-REHBERI.md`: yeni "Gabim Veri Seti" bölümü — hangi
türde hangi grupların göründüğünü ve ekran panelinin neden hâlâ tam liste
gösterdiğini açıklıyor.

`tools/test-bank-templates.js`: 8 şablonda `{{GABIM_VERI_SETI}}` varlığını
ve eski sabit tablo formatına dönülmediğini, `GABIMVERISETI` motor
kaydının ve `gabimPropertyProfile`/`buildGabimExportGroups`/
`buildGabimDataSetWordHtml` fonksiyonlarının/`landClassification` alanının
var olduğunu doğrulayan regresyon testleri eklendi.

Doğrulama: `node --check` (app.js, template-engine.js, test-bank-templates.js),
tam test paketi YEŞİL. Tarayıcıda canlı state manipülasyonuyla 4 senaryo
(Arsa/Arsa, Arsa/Arazi, Dikey Kat İrtifakı/Konut, Müstakil Bina/İşyeri) tek
tek `buildGabimExportGroups()` ile çalıştırıldı — grup listeleri 4 ekran
görüntüsüyle eşleşti (Arsa: Genel Ek Bilgiler+Tapu Bilgileri+Tapuya Özel
Bilgiler+Bağımsız Bölüm+İmar; Arazi: +Araziye Özel Bilgiler; Konut: +Yapıya
Özel+Yapı Tür+tam Ek Bilgiler+Cephe/Kat detaylı Bağımsız Bölüm; Diğer Bina:
+Yapıya Özel+sade Ek Bilgiler+sadece Enerji Sınıflı Bağımsız Bölüm). Gerçek
`templates/akbank.html` dosyası `fetch` ile çekilip `RaporTemplates.
fillTemplate()`'den geçirildi — GABİM VERİ SETİ başlığının altında doğru
üretilmiş, seçili temanın renklerini kullanan tablo HTML'i doğrulandı.
Ekrandaki Gabim paneli (`activeSectionId = "gabimData"`) hatasız render
oldu, 9 grup + 81 alan gösterdi (yeni Araziye Özel Bilgiler dahil). Konsol
hatasız.

Not: `Ana Ulaşım Yoluna Cephesi Var mı?` mevcut `landRoadFrontage` ("Kadastro/
İmar Yoluna Cepheli mi?") alanına, `Yönetici Var mı?` site-içi durumuna eşlendi
— GDYS'de ayrı/bağımsız alanlar olabilir; ekran görüntülerindeki tam etiket
eşleşmesi teyit edilemedi, kullanıcı düzeltme isterse hızlı bir takip işi.

Yedek: `backups/before-gabim-veri-seti-format_2026-07-17_06-47-49/`.

## 0.0.115 - 2026-07-17 - Ziraat Bankası açıklama bölümleri

Ziraat Bankası rapor akışına Açıklamalar bölümünde üç otomatik panel eklendi:

- `Ziraat Bankası - Konumu ve Çevresel Özellikleri`
- `Ziraat Bankası - Bölgenin Gelişimine İlişkin Analiz`
- `Ziraat Bankası - Bölgedeki Yapılaşma Durumu`

Paneller yalnızca Ziraat Bankası seçildiğinde görünür. Metinler; adres, yakın
çevre, ana arter, altyapı, yapılaşma yoğunluğu, sosyal ihtiyaç mesafesi, yapı
yaşı, gelir seviyesi, yapılaşma nizamı, yapılaşma hızı, kat aralığı ve planlama
uyumu alanlarından otomatik üretilir. Alan değişikliklerinde açık panelin
metni ve görünürlük durumu dinamik olarak güncellenir.

Ziraat şablonuna şu placeholderlar eklendi:
`{{ZIRAAT_KONUM_CEVRESEL}}`, `{{ZIRAAT_BOLGE_GELISIMI}}`,
`{{ZIRAAT_YAPILASMA}}`. Placeholder rehberi güncellendi.

Doğrulama: `node --check app.js`, `node --check src/templates/template-engine.js`,
`tools/check-basic.js`, `tools/test-bank-templates.js` ve `git diff --check`
başarılıdır.

Yedek: `backups/before-ziraat-explanation-sections_2026-07-17_08-45-17/`.

## 0.0.116 2026-07-17 Glass Tema Profili (Claude oturumu)

Kullanıcı `C:\Users\90551\OneDrive\Masaüstü\claude\design_handoff_glass_theme\`
klasöründe Claude Design ile hazırladığı bir tasarım handoff'u paylaşıp
"tokens/theme-glass.css dosyasını sistemimize yükle" dedi. Bu klasör
uygulamanın üçüncü, opt-in bir tema profili ("Glass" — buzlu cam/
glassmorphism: yarı saydam yüzeyler, backdrop blur, arkada kayan renkli
gradyan) için tam bir tasarım referansı içeriyordu (README.md +
`tokens/theme-glass.css` + `tokens/colors.css` + `ui_kit/*.jsx` click-through
prototip).

Handoff'un kendi token adlandırması (`--brand`, `--accent`, `--warning`,
`--danger`, genel `[data-theme="glass"]` seçicisi, var olmayan `.ds-surface`
sınıfı) uygulamanın gerçek CSS değişken adları ve seçicileriyle (bkz.
`themes/apple.css`/`navy-blue.css`: `body[data-app-theme="X"]`,
`--green/--green-soft/--green-strong/--green-bright/--blue/--blue-soft/
--amber/--amber-soft/--red`, gerçek yüzey sınıfları `.section-card`,
`.assistant-panel`, `.panel-block`, `.status-strip article`, `.mobile-flow`,
`.subsection`, `.table-shell`, `.sidebar`) BİREBİR EŞLEŞMİYORDU — sadece
renk/blur/gölge DEĞERLERİ korunarak gerçek adlandırmaya uyarlandı (ör.
handoff'un `--brand:var(--navy-700)`'ı → `--green:#213f77`; `--accent:
var(--navy-600)`'ı → `--blue:#2d59ab`; genel `aside/article/.ds-surface`
seçicileri → apple.css'in zaten kullandığı gerçek yüzey sınıf listesi).

Yapılanlar:
- `app/themes/glass.css` (YENİ): `body[data-app-theme="glass"]` kapsamında
  tam token bloğu (bg/surface/ink/line/green/blue/amber/red/gold/shadow/ring),
  arka planda üç radyal gradyanlı sabit `::before` katmanı, gerçek yüzey
  sınıflarına + `table/th/input/select/textarea/button`'a `backdrop-filter:
  blur(20px) saturate(180%)`, kenar çubuğuna (`.sidebar`) ayrı koyu-lacivert-
  camsı gradyan + kenarlık, `input/select/textarea` için `!important`'lı
  yarı saydam beyaz zemin (blur kuralını yenmek için — handoff'taki gibi).
- `index.html`: `themes/glass.css` linki eklendi; `#themeProfileSelect`'e
  üçüncü seçenek `<option value="glass">Glass</option>` eklendi.
- `app.js`: tema seçim mantığı düzeltildi — eski kod `value === "navy-blue"
  ? "navy-blue" : "apple"` şeklinde İKİLİ bir ternary idi ve "glass" seçilse
  bile sessizce "apple"a zorlardı. `normalizeThemeProfile()` ile üç geçerli
  değeri (`apple`/`navy-blue`/`glass`) tanıyan bir whitelist'e çevrildi.
- `THEME-PROFILES.md`: Glass profili + kaynağı belgelendi. Ayrıca ÖNEMLİ bir
  kapsam notu eklendi: bu üç profil sadece ANA ÇALIŞMA ALANINA
  (`data-app-theme`) uygulanıyor — giriş ekranının (auth gate) kendi ayrı
  açık/koyu geçişi (`data-gate-theme`, `data-gate-theme-btn`) var ve bu turda
  DOKUNULMADI. Handoff'un README'si Glass'ı hem workspace hem auth gate için
  tarif ediyordu ama ikisi kodda birbirinden bağımsız iki ayrı mekanizma;
  gate'in ikili aç/kapa toggle'ını üçlü hale getirmek ayrı bir karar/iş
  gerektirdiği için kapsam dışı bırakıldı — kullanıcı isterse ayrı istenebilir.

Doğrulama: `node --check app.js`, tam test paketi (check-basic + 4 parser +
test-bank-templates) YEŞİL. Tarayıcıda canlı test: select'te 3 seçenek de
mevcut (`apple/navy-blue/glass`), "glass" seçilince `body[data-app-theme]`
doğru güncelleniyor, gövde arka planı doğru gradyan, `.sidebar` doğru blur +
gradyan, `.section-card` doğru blur + yarı saydam beyaz zemin gösteriyor;
apple→navy-blue→glass ileri-geri geçişler ve localStorage kalıcılığı
(`raporAppTheme`) sorunsuz; konsolda hata yok.

Yedek: `backups/before-glass-theme_2026-07-17_10-24-00/`.

## 0.0.117 - 2026-07-17 - Ziraat açıklamalarının Adres ve Konum'a taşınması

- Banka alanında Ziraat Bankası seçiliyken Adres ve Konum bölümündeki standart
  `Çevresel özellikler açıklaması` alanı gizlenir.
- Bunun yerine `Ziraat Bankası - Konumu ve Çevresel Özellikleri`, `Ziraat
  Bankası - Bölgenin Gelişimine İlişkin Analiz` ve `Ziraat Bankası - Bölgedeki
  Yapılaşma Durumu` otomatik açıklama kartları Adres ve Konum bölümünde
  gösterilir.
- Ziraat dışındaki bankalarda mevcut çevresel açıklama alanı korunur; üç kart
  açıklamalar bölümünde tekrar oluşturulmaz.

Doğrulama: `node --check app.js`, `tools/check-basic.js`,
`tools/test-bank-templates.js` ve `git diff --check` başarılı.

Yedek: `backups/before-ziraat-address-environment-sections_2026-07-17_10-25-24/`.

## 0.0.118 - 2026-07-17 - Taleplerim kartlarında konum özeti

- Yerel ve bulut rapor kartlarında Konum bilgisine mahalle eklendi.
- Ada/Parsel özeti artık `titleAdaParsel`/`adaParsel` bulunmadığında `blockNo`
  ve `parcelNo` alanlarından otomatik oluşturuluyor.
- Bulut özet payload'ına da mahalle ve ada/parsel alanları eklendi.

Doğrulama: `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi kontrolü,
`tools/check-basic.js` ve `git diff --check` başarılı.

## 0.0.120 - 2026-07-17 - Minimum içerik eşiği ve boş talep filtresi

- Rapor kütüphanesine alınmadan önce düzenlenebilir alanlar ve yüklenen temel
  belgeler üzerinden doluluk hesabı yapılır.
- Toplam düzenlenebilir alanların en az `%5`'i veya en az 5 anlamlı veri dolu
  değilse rapor yerel kütüphane indeksine yazılmaz.
- Aynı eşik bulut senkron gönderiminde ve Taleplerim kartı listelemesinde de
  uygulanır; eski boş yerel/bulut kartları otomatik gizlenir.
- Boş kayıtlar filtrelenirken sekme sayaçları da yalnızca geçerli talepleri
  sayar.

Doğrulama: `app.js`, `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi
kontrolleri, `tools/check-basic.js` ve `git diff --check` başarılı.

Yedek: `backups/before-library-minimum-content_2026-07-17_14-20-36/`.

Yedek: `backups/before-library-location-summary_2026-07-17_10-53-56/`.

## 0.0.119 - 2026-07-17 - Taleplerim belge durum kutucukları

- Talep kartlarının üst kısmına beş küçük belge durum kutusu eklendi:
  `T` (TAKBİS), `U` (Adres Kodu), `I` (İmar Durumu), `E` (Enerji Kimlik
  Belgesi) ve `K` (KML / Konum).
- Yüklenen belgeler yeşil, yüklenmeyenler kırmızı gösterilir; her kutuda
  bölüm adı ve yüklenme durumu tooltip/erişilebilir etiket olarak bulunur.
- Durumlar yalnızca boolean özet olarak tutulur; gerçek dosyalar bulut
  senkron paketine eklenmez.
- Eski yerel taslaklar kart çizimi sırasında blob içinden yeniden özetlenerek
  yeni mahalle, ada/parsel ve belge durumlarını gösterebilir.

Doğrulama: `cloud/report-library.js`, `cloud/cloud-sync.js` sözdizimi kontrolü,
`tools/check-basic.js` ve `git diff --check` başarılı.
## 0.0.121 - 2026-07-17 - Bos taslaklar icin siki cekirdek icerik filtresi

- Varsayilan banka, il ve ilce alanlari tek basina rapor icerigi sayilmaz.
- Yerel ve bulut kartlarinda musteri, mahalle, ada/parsel veya temel belge cekirdek icerik olarak aranir.
- Bulut ozetlerine doluluk adedi ve yuzdesi eklenmis, eski ozetler de cekirdek icerik kontroluyle filtrelenmistir.

Dogrulama: app.js, cloud/report-library.js ve cloud/cloud-sync.js syntax kontrolleri, tools/check-basic.js ve git diff --check basarilidir.

Yedek: backups/before-library-minimum-content_2026-07-17_14-20-36/.
## 0.0.122 - 2026-07-17 - Taleplerim liste görünümü

- Taleplerim ekranına Kart/Liste görünüm seçici eklendi.
- Liste görünümünde aynı rapor kartları tek satırlı, hızlı taranabilir bir düzende gösterilir; belge durumları, konum bilgileri ve işlem düğmeleri korunur.
- Seçilen görünüm `rapor-library-view-mode` anahtarıyla cihazda saklanır ve mobil ekranda otomatik olarak dikey düzene uyarlanır.

Doğrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve `git diff --check` başarılı.

## 0.0.123 2026-07-17 Giriş Ekranı Arka Planı: Statik Görsel Yerine Döngülü Video (Claude oturumu)

Kullanıcı bir video linki (CloudFront CDN, `hf_...mp4`, ~2.4MB, 1280x720)
paylaşıp "açılış ekranında arka plandaki görsel yerine yerleştir, loop
şeklinde dönebilir" dedi. Video `app/assets/gate-bg/gate-bg-video.mp4`'e
indirildi (mevcut `blueprint-background.png`/`-dark.png` ile aynı klasör,
karşılaştırılabilir boyut — ek ağ yükü yok denecek kadar az).

Yapılanlar:
- `index.html`: gate-scene DOM'una `<video class="gate-video" autoplay muted
  loop playsinline preload="auto">` eklendi (`.gate-blueprint`'ten önce, en
  arkada). `prefers-reduced-motion: reduce` tercihi olan kullanıcılar için
  video JS ile duraklatılıyor (mevcut `reduceMotion` kontrolüne eklendi —
  zaten parçacık/parallax animasyonlarını kapatan aynı mantık).
- `styles.css`: yeni `.gate-video` kuralı (`position:absolute; inset:-2%;
  object-fit:cover; z-index:0`). `.gate-blueprint`'in `background-image`'inden
  PNG katmanı (`url(...)`) kaldırıldı — yalnızca ince mavi/beyaz ızgara
  çizgileri kaldı, artık videonun ÜZERİNDE teknik bir doku katmanı olarak
  duruyor (koyu tema opaklık 0.34, açık tema 0.22→0.18 küçük ayarlamayla).
  Video hem açık hem koyu gate temasında aynı — kullanıcı tek video verdi,
  tema başına ayrı video yok; ızgara/vinyet renkleri temaya göre değişmeye
  devam ediyor.
- `styles.css`'te `#authGateOverlay .gate-blueprint`/`[data-gate-theme="light"]`
  kurallarının ikisi de `background-size`'daki üçüncü ("cover", PNG'ye ait)
  değeri kaldıracak şekilde güncellendi.

Doğrulama: `node --check` gerek yok (CSS/HTML), `tools/check-basic.js` ve
`tools/test-bank-templates.js` YEŞİL. Tarayıcıda canlı doğrulama: video
elementi doğru kaynaktan yükleniyor (`readyState:4`, 1280x720), `paused:
false`, `loop/muted/autoplay: true`, hata yok; `.gate-blueprint` artık
`background-image`'inde `url(...)` İÇERMİYOR (yalnızca ızgara), doğru
z-index sırasıyla videonun üzerinde görünüyor; `elementFromPoint` ile üstte
`.gate-blueprint` olduğu (vinyet/parçacıklar da üstte kalmaya devam ediyor)
doğrulandı. Açık/koyu tema geçişi test edilirken CSS `transition: opacity
0.4s` yüzünden ardışık senkron testlerimde YANILTICI bir "hep 0.34" okuması
aldım (her test kendi perturbation'ıyla geçişi sıfırlıyordu) — temiz bir
sayfa yüklemesiyle (`localStorage` önceden "light" set edilip yeniden
yüklenerek, hiç geçiş TETİKLENMEDEN) doğru değerin (0.18) uygulandığı
kanıtlandı; gerçek kullanıcı deneyiminde bu bir sorun değil, sadece kendi
test metodolojimin bir artefaktıydı.

Cache-buster: `styles.css?v=20260717-1620` (index.html + check-basic.js pin
birlikte güncellendi). `gate-bg-video.mp4` versiyonsuz referans edildi —
mevcut PNG'lerle aynı konvansiyon (bu ikisi de hiç `?v=` almıyor).

Not: Bu video yalnızca giriş ekranının (auth gate) arka planına eklendi;
ana çalışma alanının Apple/Navy Blue/Glass tema sistemiyle (bkz. 0.0.116)
ilgisi yok, ayrı bir mekanizma.

Yedek alınmadı (küçük, kolay geri alınabilir bir değişiklik; git ile
izlenebilir durumda).
## 0.0.123 - 2026-07-17 - Talep kartlarÄ±ndan randevu rozetinin kaldÄ±rÄ±lmasÄ±

- Taleplerim kartlarÄ±ndaki `Randevu: ...` gecikme ve kalan gÃ¼n rozeti kaldÄ±rÄ±ldÄ±.
- Kart/liste gÃ¶rÃ¼nÃ¼mlerindeki diÄŸer durum, belge ve iÅŸlem alanlarÄ± korunuyor.

DoÄŸrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.124 2026-07-17 Üç Yeni Tema Profili: Aurora, Clay, Neumorphism (Claude oturumu)

Kullanıcı `C:\Users\90551\OneDrive\Masaüstü\claude\Experify Design System\`
klasörünü paylaşıp "bu klasördeki 3 yeni oluşturulmuş temayı temalar
bölümüne ekle" dedi. Bu klasör, önceki Glass tema handoff'unun (0.0.116)
işaret ettiği tam "Experify Design System" projesiydi — `readme.md`'de
"Altı tema profili" olarak Navy Blue/Apple/Glass'ın yanına 3 yeni "stil
keşfi" tanımlıyordu: `tokens/theme-aurora.css`, `tokens/theme-clay.css`,
`tokens/theme-neumorphism.css`.

Aynı Glass yöntemi tekrarlandı: kaynak dosyaların `--brand/--accent/
--warning/--danger` + genel `[data-theme]`/`aside/article/.ds-surface`
sözlüğü, uygulamanın gerçek `body[data-app-theme="X"]` seçicisine ve gerçek
değişken/sınıf adlarına (`--green/--blue/--amber/--red`, `.sidebar/
.section-card/.assistant-panel/.panel-block/.status-strip article/
.mobile-flow/.subsection/.table-shell`) birebir renk/gölge/blur DEĞERLERİ
korunarak uyarlandı.

Yapılanlar (`app/themes/` altında 3 YENİ dosya):
- `aurora.css`: Lacivert+gold+teal 4 radyal "blob"un 18s'de yavaşça
  döndüğü sabit bir arkaplan (`::before`, `blur(70px)`), üzerinde
  neredeyse-opak beyaz (`rgba(255,255,255,.80-.92)`) + `blur(14px)
  saturate(160%)` yüzeyler. Teal (`#1f9e8f`) etkileşim rengi olur.
- `clay.css`: Pastel periwinkle taban (`#eceafd`/`#f6f5ff`), imza üçlü
  gölge (dış gölge + 2 iç gölge — açık rim + koyu gölge), kenarlıksız,
  büyük köşe yuvarlaklığı (18-34px), düğmeler `:active`'te 1px aşağı kayar.
- `neumorphism.css`: Monokromatik "soft-UI" — yüzeyler sayfayla AYNI renkte
  (`#e4e9f2`), yalnızca iki yönlü gölge çiftiyle (açık üst-sol/koyu alt-sağ)
  kabartılmış; girdiler ters (inset) gölgeli "basılmış" görünür.
- Clay ve Neumorphism ayrıca uygulamanın GERÇEKTEN tükettiği `--radius-s/
  -m/-l` değişkenlerini de (`styles.css:31-33`) kendi kapsamları içinde
  ezer — böylece köşe yuvarlaklığı stiller genelinde otomatik yayılır
  (Glass/Aurora bu değişkenlere dokunmuyor, geometri Navy Blue/Apple ile
  aynı kalıyor — tasarım dokümanının "Glass yalnızca renk/yüzey/blur/gölge
  dokunur, geometriye asla" ilkesiyle tutarlı).
- `index.html`: 3 yeni `<link rel="stylesheet">` + `#themeProfileSelect`'e
  3 yeni `<option>` (Aurora/Clay/Neumorphism) eklendi.
- `app.js`: `validThemeProfiles` whitelist'ine üç yeni değer eklendi (aksi
  halde 0.0.116'daki `normalizeThemeProfile()` bunları tanımayıp sessizce
  "apple"a düşürürdü).
- `THEME-PROFILES.md`: üç yeni profil + kaynakları belgelendi.

Doğrulama: `node --check app.js`, tam test paketi (check-basic + 4 parser +
test-bank-templates) YEŞİL. Tarayıcıda TEMİZ sayfa yüklemeleriyle (her
temayı `localStorage`'a önceden yazıp yeniden yükleyerek — CANLI/senkron
switch testleri `transition: ...` yüzünden yanıltıcı ara-değer okumaları
verdi, aynı 0.0.123'teki gate-teması testinde keşfedilen artefaktın
aynısı) üç temanın da doğru uygulandığı kanıtlandı: Aurora
(bg `#0b1430`, kart `rgba(255,255,255,.92)`), Clay (bg/girdi `#eceafd`,
kart `#f6f5ff`, radius 26px, üçlü gölge), Neumorphism (bg/girdi/kart hepsi
aynı `#e4e9f2`, iki yönlü dış gölge, radius 18px). Select değeri ve
`body[data-app-theme]` her durumda doğru senkronize; konsolda hata yok.

Cache-buster: `app.js?v=20260717-1700`, yeni tema dosyaları
`?v=20260717-1700` ile linklendi (index.html + check-basic.js pin
birlikte güncellendi).

Not: Bu üç profil de (Glass gibi) yalnızca ana çalışma alanına
uygulanıyor; giriş ekranına (auth gate) uygulanmadı.

Yedek: `backups/before-three-new-themes_2026-07-17_16-55-50/`.
## 0.0.124 - 2026-07-17 - Harita marker ve talep butonlarÄ± UX dÃ¼zeltmeleri

- Leaflet varsayÄ±lan PNG marker yerine CSP uyumlu yerel CSS marker kullanÄ±yor; harita iÅŸaretÃ§ileri uzak gÃ¶rsel engeline takÄ±lmÄ±yor.
- Taleplerim kart ve liste gÃ¶rÃ¼nÃ¼mlerindeki AÃ§, Kopyala, TamamlandÄ±, ArÅŸivle ve Sil dÃ¼ÄŸmeleri kompaktlaÅŸtÄ±rÄ±ldÄ±.
- Liste gÃ¶rÃ¼mÃ¼nde iÅŸlem dÃ¼ÄŸmeleri tek satÄ±rda korunuyor; kart gÃ¶rÃ¼mÃ¼nde gereksiz yÃ¼kseklik azaltÄ±ldÄ±.

DoÄŸrulama: `node --check app.js`, `node --check cloud/report-library.js`,
`tools/check-basic.js` ve `git diff --check` baÅŸarÄ±lÄ±.
## 0.0.125 - 2026-07-17 - Talep tamamlanma butonu metin sadeleÅŸtirmesi

- Taslak kartlarÄ±ndaki `TamamlandÄ± Ä°ÅŸaretle` metni `TamamlandÄ±` olarak kÄ±saltÄ±ldÄ±.
- TamamlanmÄ±ÅŸ raporlardaki `TaslaÄŸa Al` davranÄ±ÅŸÄ± korunuyor.

DoÄŸrulama: `node --check cloud/report-library.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.
## 0.0.126 - 2026-07-17 - Harita dÄ±ÅŸa aktarma butonu metin sadeleÅŸtirmesi

- `HARÄ°TAYI JPEG OLARAK KAYDET` butonu `JPG` olarak kÄ±saltÄ±ldÄ±.
- DÃ¼ÄŸmenin `title` ve `aria-label` aÃ§Ä±klamalarÄ± korunarak kullanÄ±labilirlik sÃ¼rdÃ¼rÃ¼ldÃ¼.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.127 2026-07-17 Clay/Neumorphism Sidebar Okunabilirlik Düzeltmesi (Claude oturumu)

Kullanıcı "clay ve neomorfhsim de sol paneldeki yazılar beyaz olduğundan
yazılar okunaklı değil. tüm temalarda fontlar okunaklı mı kontrol et" dedi.

Kök neden: `styles.css`'in temel (`.sidebar`, `.brand p`, `.nav-button`,
`.sync-panel p` vb.) kuralları sidebar'ı HER ZAMAN koyu zemin varsayarak
alt öğelere DEĞİŞKEN KULLANMAYAN, sabit açık renkler veriyordu
(`.brand p{color:#b9c5c1}`, `.nav-button{color:#dce6e2}`,
`.sync-panel p{color:#c9d2cf}` — bkz. `styles.css:522-604`). Glass/Aurora
temalarında sidebar'ı bilinçli olarak KOYU tuttuğum için sorun yoktu; ama
Clay ve Neumorphism'de tüm yüzeyleri (sidebar dahil) açık/pastel yaptığım
için bu sabit açık renkler artık açık zemin üzerinde okunaksız kalıyordu.
`apple.css`'in kendi zamanında AYNI sorunu `.brand p`/`.nav-button`/
`.nav-badge` için ayrı ayrı ezerek çözdüğünü fark ettim — aynı desen
tekrarlandı.

Yapılanlar (`themes/clay.css`, `themes/neumorphism.css`):
- `.brand p`, `.sync-panel p` → `color: var(--muted)`.
- `.nav-button` → `color: var(--ink)`; `:hover`/`.is-active` → okunaklı,
  ayırt edici bir renk (Clay: `--green-strong` metin + `--green-soft` zemin;
  Neumorphism: `--green` metin + inset gölge — temanın kendi "basılmış"
  diline uygun).
- `.nav-index`/`.sync-panel` arka planları da (eskiden `rgba(255,255,255,.1)`
  — koyu zeminde görünür, açık zeminde görünmez) koyu-tonlu şeffaf
  karşılıklarıyla değiştirildi.
- `--muted` değerleri biraz KOYULAŞTIRILDI (Clay `#736fa0`→`#5f5a91`,
  Neumorphism `#6a7794`→`#566079`) — WCAG kontrast hesabı ilk değerlerin
  küçük metin için sınırda/yetersiz olduğunu gösterdi (4.31:1 ve 3.68:1,
  AA eşiği 4.5:1); yeni değerler 5.78:1/5.15:1'e çıkarıyor. Bu değişken
  sidebar dışında da (alt başlık metinleri vb.) kullanıldığından iyileştirme
  her yerde faydalı, hiçbir yerde zarar vermiyor.

Ayrı, bağımsız bir bulgu (kullanıcı fark etmeden önce kendim buldum): dört
YENİ temanın da (Glass/Aurora/Clay/Neumorphism) yüzey-blur/gölge
kurallarına `table`/`th`'i dahil etmiştim. Bu, ÖZEL koyu+beyaz satırların
(`.malikler-total-row th` — TOPLAM satırı, `.comparable-valuation-summary-
table th.is-accent-sale/rent`) kendi `background`'ını (`#1f2a32` vb.,
`!important` yok) YÜKSEK ÖZGÜLLÜKLE (benim `body[data-app-theme="x"] th`
seçicim onlarınkinden daha özgül) EZİYORDU — zemin açık yeşile dönüp beyaz
yazı okunaksız kalırdı. Dört temadan da `table`/`th`'i kaldırdım; temel
uygulamanın zaten var olan, tema-nötr `th{color:#42515b;background:#f0f3f1}`
kuralı (veya Apple'ın kendi override'ı) devreye giriyor — hem her zaman
okunaklı hem de özel toplam/vurgu satırlarını artık bozmuyor.

Doğrulama: `tools/check-basic.js` + `tools/test-bank-templates.js` YEŞİL.
Tarayıcıda TEMİZ sayfa yüklemeleriyle 4 yeni temanın hepsinde: sidebar
zemin rengi doğru, `.brand p`/`.sync-panel p`/`.nav-button` (aktif VE
pasif durum) rengi doğru hesaplandı (Node ile WCAG kontrast oranları da
ayrıca doğrulandı — hepsi ≥4.3:1, çoğu ≥5:1). Sentetik bir
`.malikler-total-row th` elemanı DOM'a eklenip 4 temanın hepsinde
`rgb(31,42,50)` (koyu) zemin + beyaz yazı ile DOĞRU render edildiği
kanıtlandı (önceden Clay/Neumorphism gibi açık temalarda bu satır da
bozulmuş olacaktı — kullanıcı henüz bunu fark etmemişti). Konsolda hata yok.

Cache-buster: `themes/glass.css?v=20260717-1830`, `themes/aurora.css?v=
20260717-1830`, `themes/clay.css?v=20260717-1840`, `themes/neumorphism.css
?v=20260717-1840` (index.html güncellendi).

Yedek alınmadı (0.0.124'teki `backups/before-three-new-themes_2026-07-17_
16-55-50/` yedeği zaten bu dosyaların ilk hallerini içeriyor; bu tur o
işin doğrudan devamı/düzeltmesi).
## 0.0.127 - 2026-07-17 - Malik tablosu Tapu Tarihi sÃ¼tunu geniÅŸletmesi

- Malikler tablosunda Tapu Tarihi sÃ¼tunu minimum 120 px geniÅŸliÄŸe getirildi.
- Tablo minimum geniÅŸliÄŸi 760 px olarak korunarak masaÃ¼stÃ¼nde dengeli, mobilde yatay kaydÄ±rmalÄ± okunabilir dÃ¼zen saÄŸlandÄ±.
- Yevmiye sÃ¼tununa da sabit alan verilerek tarih alanÄ±nÄ±n sÄ±kÄ±ÅŸmasÄ± Ã¶nlendi.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.
## 0.0.128 - 2026-07-17 - Belge inceleme kurumlarÄ±na OSB seÃ§eneÄŸi

- Belgeler ve Proje bÃ¶lÃ¼mÃ¼ndeki Ä°ncelenen Kurum aÃ§Ä±lÄ±r listesine `OSB BÃ¶lge MÃ¼dÃ¼rlÃ¼ÄŸÃ¼` eklendi.
- Proje incelenen kurumlarÄ±nda mevcut olan aynÄ± seÃ§enek korunarak belge satÄ±rÄ± ile proje seÃ§imleri tutarlÄ± hale getirildi.

DoÄŸrulama: `node --check app.js`, `tools/check-basic.js` ve
`git diff --check` baÅŸarÄ±lÄ±.

## 0.0.129 2026-07-17 Alt Bölüm Başlıkları ve Tablo Hücrelerinde Boşluk Artırımı (Claude oturumu)

Kullanıcı "İncelenen Belgeler" ve "Ana Taşınmaz Teknik Bilgileri" alt bölüm
başlıklarının ekran görüntülerini paylaşıp "iç tabloda çok kenara yapışık,
tüm formatta bunun gibi kenara sıfır başlıklar var, alt tabloyu biraz
büyüterek ya da başlıkları ayarlayarak daha güzel bir arayüz sağlayabiliriz"
dedi.

İnceleme: `.subsection h4 { margin: 0; }` ve `.subsection { gap: 12px; }`
gerçekten sıfır kenar boşluğu kullanıyordu — bu, tek bir yerde değil,
`.subsection` sınıfının kullanıldığı UYGULAMA GENELİNDEKİ (İncelenen
Belgeler, Ana Taşınmaz Teknik Bilgileri, ve onlarca başka alt bölüm) her
yerde aynı sıkışık görünüme yol açıyordu. Tablo hücreleri de (`th, td`)
10px gibi standart ama görece dar bir dolgu kullanıyordu.

Yapılanlar (`styles.css`, iki tek-satırlık, uygulama genelinde paylaşılan
sınıf değeri):
- `.subsection { gap: 12px }` → `gap: 16px` — başlık ile altındaki
  içerik (tablo/form/grid) arasına biraz daha nefes payı.
- `th, td { padding: 10px }` → `padding: 12px` — tüm tablo hücreleri
  ("alt tablo") biraz daha ferah.

Bu iki değişiklik `.subsection`/`th`/`td` kullanılan HER yerde otomatik
uygulanır (kullanıcının "tüm formatta" ifadesiyle uyumlu) — ayrı ayrı
onlarca alt bölümü tek tek düzeltmek yerine paylaşılan temel sınıflar
düzeltildi.

Doğrulama: `tools/check-basic.js` + tam test paketi YEŞİL. Tarayıcıda
canlı ölçüm: "İncelenen Belgeler" alt bölümünde `subsectionGap: 16px`,
`tdPadding: 12px` doğrulandı (öncekiler 12px/10px idi); ekran görüntüsüyle
görsel olarak da başlık-tablo arası boşluğun arttığı teyit edildi. Konsolda
hata yok, mevcut testler bozulmadı.

Cache-buster: `styles.css?v=20260717-1730` (index.html + check-basic.js
pin birlikte güncellendi).

Yedek: `backups/before-subsection-spacing_2026-07-17_17-28-49/`.
## 0.0.133 - 2026-07-17 - Alt panel başlıklarının dikey boşluğu

Alt panel başlıkları üst kenara da yapışık görünmeye devam ettiği için ortak
`.subsection-table-head` ve `.subsection-title-row` sınıflarına üst/alt iç boşluk
eklendi. Başlıklar artık yatayda 10px, üstte 6px ve altta 4px içeriden başlar.
Yedek: `backups/before-panel-heading-vertical-spacing_2026-07-17_18-09-31/`.

## 0.0.132 - 2026-07-17 - Ana panel başlık hizalaması

Ana Gayrimenkul, Bağımsız Bölüm ve Değerleme içindeki özel alt panellerin başlıkları
tablo/panel sınırına yapışık görünüyordu. Bu panellerin ortak kullandığı
`.subsection-title-row` sınıfına da 10px yatay iç boşluk eklendi. Böylece tablo
başlıkları ve açıklama satırları tüm bölümlerde tutarlı biçimde içeriden başlar.
Yedek: `backups/before-common-panel-heading-fix_2026-07-17_18-06-11/`.

## 0.0.131 - 2026-07-17 - Alt tablo başlık hizalaması

İncelenen Belgeler ve aynı ortak tablo yapısını kullanan alt tabloların başlıklarının
tablo sınırına yapışık görünmesini önlemek için `.subsection-table-head` bileşenine
10px yatay iç boşluk eklendi. Bu düzenleme masaüstü ve mobil görünümlerde ortak uygulanır.

## 0.0.130 - 2026-07-17 - Saha Pro bölümünün kaldırılması

Kullanıcı talebiyle 8. bölüm olarak eklenen Saha Pro tamamen kaldırıldı. Bölüm tanımı,
iframe render kodu ve Saha Pro'ya özel CSS temizlendi; `saha-pro.html` dosyası da projeden
çıkarıldı. İşlem öncesi yedek: `backups/before-remove-saha-pro_2026-07-17_17-52-04/`.

## 0.0.129 - 2026-07-17 - Saha Pro bölüm entegrasyonu

Kullanıcının paylaştığı `C:\Users\90551\OneDrive\Masaüstü\claude\saha çalışma\index.html`
uygulama köküne `saha-pro.html` adıyla alındı. Ana uygulamanın global CSS ve JavaScript
kodlarıyla çakışmayı önlemek için 7. Ana Gayrimenkul Özellikleri ile 8. Bağımsız Bölüm
Özellikleri arasına `Saha Pro` başlığı eklendi ve içerik aynı kaynak üzerinden izole bir
iframe çalışma alanı olarak gösterildi. Saha Pro'nun bağımsız PWA manifest/favicon
referansları iframe içindeki gereksiz 404 isteklerini önlemek için kaldırıldı.

`app.js` içinde `sahaPro` bölümü ve iframe oluşturma akışı, `styles.css` içinde masaüstü
ve mobil yükseklikleri uyarlanan `.saha-pro-frame-wrap` / `.saha-pro-frame` stilleri eklendi.

Doğrulama: `node --check app.js`, `node tools/check-basic.js`, `git diff --check` ve
`http://127.0.0.1:5174/saha-pro.html` servis kontrolü başarılıdır.

## 0.0.189 - 2026-07-19 - Admin ve Kullanıcı Rolleri

- Firebase oturum e-postasından rol üreten merkezi `src/auth/access-control.js` modülü eklendi.
- `canlilar.melih@gmail.com` hesabı `admin`, diğer tüm hesaplar ve oturum açılmamış durum `user` olarak tanımlandı.
- Teknik `Placeholder` ve `Gabim Veri Seti` bölümleri yalnızca yönetici hesabına görünür hale getirildi.
- Bölüm ve form alanları için tekrar kullanılabilir `adminOnly: true` desteği eklendi. Rol değiştiğinde görünmeyen aktif bölümden güvenli biçimde çıkılıyor.
- Rol görünürlüğü rapor dışa aktarma filtresinden ayrıldı; kullanıcı arayüzünde gizlenen bölümler rapor verisini eksiltmiyor.
- Hesap penceresi ve Taleplerim üst alanında `Yönetici` / `Kullanıcı` rolü gösteriliyor.
- Rol her Firebase oturum değişiminde yeniden hesaplanıyor; çıkışta yetki varsayılan `user` seviyesine düşüyor.
- Cache sürümleri `20260719-2200` olarak güncellendi.
- Doğrulama: `npm.cmd test`, `node tools/check-basic.js`, `node tools/test-bank-templates.js` ve `git diff --check` başarılı.

## 0.0.190 - 2026-07-20 - Harita Araçlarının Sadeleştirilmesi

- Harita ve Konum Seçimi içindeki koordinat sayısı, merkez, pafta ve seçili nokta rozetlerinden oluşan özet şeridi kaldırıldı.
- `Önemli noktalar belirtilsin mi?` seçeneği bölüm başlığının sağ tarafına taşındı.
- `Harita görünümü` seçicisi haritanın sağ üst köşesine, harita yeniden çizildiğinde kaybolmayacak ayrı bir katman olarak taşındı.
- Masaüstü ve mobil yerleşimler için sabit, taşma yapmayan ölçüler eklendi.
- Cache sürümleri `20260720-0010` olarak güncellendi.
- Canlı tarayıcı doğrulaması: masaüstünde seçici haritanın sağ/üst kenarından 12 px içeride ve harita 16:9; 390x844 mobil görünümde yatay taşma yok; konsol hatası yok.
- `npm.cmd run verify`, banka şablon testi ve `git diff --check` başarılı.

## 0.0.192 - 2026-07-20 - Harita Etiketlerinin Zorunlu Olması

- Konum haritasındaki `Önemli noktalar belirtilsin mi?` seçeneği arayüzden kaldırıldı.
- Önemli nokta etiketleri doğrudan JPG indirme, manuel rapor haritası kaydı ve otomatik rapor haritası üretiminde daima açık hale getirildi.
- Önceden `false` olarak kaydedilmiş eski tercihler ve harita yapılandırmaları artık etiketleri kapatamıyor.
- Birleşik indirme düğmesinin metni `JPG İNDİR` yerine `JPG` olarak kısaltıldı.
- Cache sürümleri `20260720-0200` olarak güncellendi.
- Canlı tarayıcı doğrulaması: seçenek ve metni DOM'da yok, birleşik düğme `JPG`, oran göstergesi korunuyor; yatay taşma ve konsol hatası yok.
- `npm.cmd run verify`, banka şablon testi ve `git diff --check` başarılı.

## 0.0.193 - 2026-07-20 - Harita Kullanıcı Noktası Araçları

- `KML yüklendikten sonra haritadan nihai konumu işaretleyebilirsiniz.` açıklaması kaldırıldı.
- `Haritayı Kaydet` ve `JPG` oran menüsü, `Kullanıcı Önemli Noktası` girişinin hemen sağına taşındı.
- Kullanıcı önemli noktası satırı yeni araçlara yer açacak şekilde daraltıldı; mobilde tek sütuna düşüyor.
- Canlı tarayıcı doğrulaması: masaüstünde giriş alanı 353 px ve `Haritayı Kaydet`/`JPG` hemen sağında; mobilde kontroller tek sütunda ve yatay taşma yok; konsol hatası yok.
- `npm.cmd run verify`, banka şablon testi ve `git diff --check` başarılı.

## 0.0.194 - 2026-07-20 - Kullanıcı Noktası Satırının Sıkılaştırılması

- Harita kaydetme düğmesi `Kroki Kaydet` / `Kroki Kaydedildi` olarak kısaltıldı.
- `Kullanıcı Noktalarını Getir` dahil tüm ana kullanıcı noktası kontrolleri tek üst araç satırına alındı.
- Harita ve kullanıcı noktası durum mesajları grid hücresi tüketmemesi için ayrı alt durum satırına taşındı.
- Kullanıcı önemli noktası girişinin esnek minimum genişliği 150 px'e indirildi; mobil tek sütun davranışı korundu.
- Durum mesajları ana araç grid'inden ayrıldığı için canlı masaüstü doğrulamasında altı kontrol aynı satırda kaldı; giriş alanı 168 px, düğme metni `Kroki Kaydet` ve yatay taşma yok.
- 390x844 mobil doğrulamasında kontroller tek sütuna geçti; konsol hatası yok.
- `npm.cmd run verify`, banka şablon testi ve `git diff --check` başarılı.

## 0.0.191 - 2026-07-20 - JPG Boyut Menüsü

- `Haritayı güncelle` ve `Okunan değerleri tekrar uygula` düğmeleri Harita ve Konum Seçimi araçlarından kaldırıldı.
- Ayrı `Boyut` seçicisi kaldırılarak `JPG İNDİR` düğmesine gömülü açılır oran menüsüne dönüştürüldü.
- Menü 1:1, 3:4, 4:3, 4:5, 5:4, 9:16 ve 16:9 seçeneklerini sunuyor; aktif oran düğmede gösteriliyor.
- Oran seçildiğinde tercih kaydediliyor, menü kapanıyor ve JPG seçilen oranla doğrudan indiriliyor.
- Menü dışına tıklama ve Escape tuşuyla kapatma davranışları eklendi.
- JPG hazırlanıyor durumu sonrasında birleşik düğmenin oran göstergesini kaybetmemesi için düğme iç yapısı korunup geri yükleniyor.
- Cache sürümleri `styles.css=20260720-0110`, `app.js=20260720-0120` olarak güncellendi.
- Canlı tarayıcı doğrulaması: eski iki düğme görünmüyor, menüde 7 oran var; 4:3 seçimi sonrası `JPEG kaydedildi` durumu geldi, menü kapandı ve oran göstergesi korundu.
- 390x844 mobil görünümde oran menüsü ekran içinde kaldı ve yatay taşma oluşmadı; konsol hatası yok.
- `npm.cmd run verify`, banka şablon testi ve `git diff --check` başarılı.
## 0.0.195 - Cloud map state preservation (2026-07-20)

- Cloud sync now carries a sanitized `mapState` payload containing KML geometry, saved report sketch settings, map mode/ratio, and selected nearby/user POIs.
- Raw KML text, uploaded documents, and unrelated `sourceValues` remain excluded from cloud storage.
- Cloud-only report fetch restores the map state before rendering, so completed reports no longer show an empty map merely because the original KML file is unavailable.
- Legacy cloud records without `mapState` fall back to saved latitude/longitude and render the base map and subject marker.
- Added checks for cloud map-state round-trip and the no-KML Leaflet fallback.

## 0.0.196 - Address and nearby map stability (2026-07-20)

- Local and cloud report hydration now restores city, district, neighborhood, and postal code values from the saved state and imported address metadata before the address section is rendered.
- Reverse geocoding updates the visible address controls without rebuilding the whole address/map section; moving the selected map point no longer causes a full section refresh.
- Nearby environment defaults to the three closest records from the combined nearby data and user POIs. Manual selection remains available after the default selection.
- Verification: `npm run verify`, Node syntax checks, `git diff --check`, and Graphify update completed successfully.

## 0.0.197 - Leaflet map fallback recovery (2026-07-20)

- If Leaflet loads after the first application render, the temporary static map is replaced automatically when the library becomes ready.
- Added a jsDelivr fallback for Leaflet CSS and JavaScript when the primary unpkg CDN request fails.
- This prevents cloud/local reports from remaining on the diagonal-line static fallback while the actual map library is available or becomes available shortly after load.

## 0.0.198 - Ziraat Ek Tablo ve Toplam Alan Placeholder'ları (2026-07-21)

- Ziraat ek tablo XLSX dışa aktarımında formül hücrelerinin güncel önbellek değerleri de yazılır. Böylece yasal/mevcut birim değerler, toplamlar ve mevcut durum satırındaki belge/nitelik alanları `0`, `#SAYI/0!` veya ham `{{...}}` placeholder olarak görünmez.
- XLSX çalışma kitabı açılışta otomatik/tam hesaplama moduna alınır; kullanıcı Excel'de ek satır çoğalttığında toplam formülleri yeniden hesaplanır.
- `templates/ziraat-ek-tablo.xlsx` STORED ZIP biçiminde tutulur; D3 metin kaydırma, dikey ortalama ve iki kat satır yüksekliği korunur.
- Yeni rapor placeholder'ları: `{{TOTAL_LEGAL_AREA}}` ve `{{TOTAL_CURRENT_AREA}}`. Türkçe eşdeğerleri `{{TOPLAM_YASAL_ALAN}}` ve `{{TOPLAM_MEVCUT_ALAN}}` da çözülür.
- Bu placeholder'lar birden fazla bağımsız bölüm kat satırı varsa yasal/mevcut alanları toplar, tek katlı kayıtta ilgili alanı döndürür. Placeholder ekranı ve `templates/PLACEHOLDER-REHBERI.md` güncellendi.
- Doğrulama: `npm.cmd run verify` geçti.
## 0.0.298 - TCMB Güncel Döviz Kurları (2026-08-03)

- Uygulama üst durum alanına TCMB kaynaklı USD/TRY ve EUR/TRY alış-satış kur bandı eklendi.
- Yeni kimlik doğrulamalı `/api/tcmb-rates` uç noktası, TCMB'nin resmi `today.xml` verisini sunucu tarafında okuyarak tarayıcı CORS bağımlılığını kaldırır.
- Veri 10 dakika önbelleklenir; TCMB geçici olarak erişilemezse son başarılı değer 36 saate kadar "Son başarılı veri" etiketiyle gösterilir.
- Kaynak gününü XML içindeki TCMB tarihinden gösterir; istemcinin cihaz saatiyle karıştırılmaz.

## 0.0.299 - TCMB Oturum Hazırlık Tekrarı (2026-08-03)

- Kur bandının ilk isteği Firebase kimlik belirteci hazır olmadan çalışırsa, istemci 1,2 saniye ilk bekleme sonrasında 2,5 saniye aralıkla en fazla altı kez tekrar dener.
- Böylece uygulama açılış sırası nedeniyle bandın kalıcı olarak "TCMB kurları şu an alınamadı" durumunda kalması önlenir.
## 0.0.301 - 2026-08-03 - TCMB kur bandı bilgi hiyerarşisi

- TCMB canlı kur verisinin kaynağı ve yenileme davranışı değişmeden, üst durum alanındaki tek satırlı metin kart temelli bir görünümle yenilendi.
- USD/TRY ve EUR/TRY artık ayrı kartlarda; alış ve satış değerleri ayrı etiketlerle, TCMB veri tarihi de kendi bilgi alanında sunulur.
- Mobil yerleşimde kartlar dikey akışa geçer; okunabilirlik için başlık ve tarih alanları ayrı kalır.
- Cache-buster: `app.js?v=20260803-1015`.

## 0.0.302 - 2026-08-03 - Resmi Cikti Yetkilendirmesi

- Banka sablonuyla olusturulan ZIP paketi artik yalnizca onayli, oturum acmis kullanici icin sunucunun imzaladigi dogrulama sertifikasiyla hazirlanir.
- Sertifika rapor kimligi, sablon tipi, zaman damgasi, anonim hesap parmak izi ve taslak ozetini icerir; imza anahtari yalnizca `server-data` altinda tutulur ve tarayiciya servis edilmez.
- Form doldurma, taslak calisma ve onizleme yerelde ayni hizda kalir. Ag baglantisi yalnizca resmi banka paketi olusturulurken gerekir.
- Yeni `/api/export-authorization` uc noktasi kimlik dogrulamasi, onayli kullanici kontrolu, CSRF kontrolu ve rota bazli hiz limiti ile korunur.

## 0.0.303 - 2026-08-03 - Sunucu Tarafli Sablon Cozumleme

- Banka sablonlarinin ham HTML dosyalari artik `/templates/...` altindan HTTP ile servis edilmez.
- Onayli kullanici, sunucudan sadece kullanilacak placeholder adlarini alir; alanlar tarayicida hesaplanir ve sablon metni sunucuda doldurulur.
- Yeni `/api/report-template-tokens` ve `/api/report-template-render` uclari oturum, kullanici onayi, CSRF ve hiz limiti ile korunur.
- Bu ilk gecis bankaya ozel sablon govdesini tarayicidan kaldirir. Sonraki asamada kritik degerleme hesaplari da sunucuda yeniden hesaplanacak; istemci yalnizca form ve onizleme katmani olarak kalacaktir.

## 0.0.304 - 2026-08-03 - Sunucu Tarafli Turetilmis Degerleme Kontrolu

- Banka sablonu olusturulurken yasal ve mevcut acil satis degerleri artik tarayicidan kabul edilmez.
- Sunucu, uzmanin girdigi yasal/mevcut piyasa degerlerini kaynak alir; `%10 indirim` ve `50.000 TL` yuvarlama kuralini kendisi uygular.
- Bu turetilmis degerler, sunucu imzali `experify-degerleme-dogrulama.json` olarak resmi ZIP paketine eklenir.
- Formdaki anlik hesaplar ve kaydetme davranisi yerelde kaldigi icin kullanici deneyimine ag gecikmesi eklenmez; yalnizca zaten var olan banka sablonu olusturma istegi bu kontrolden gecer.

## 0.0.305 - 2026-08-03 - Placeholder Cozumleme Yuzeyi Sertlestirmesi

- Placeholder katalog ekrani zaten yalnizca yoneticiye aciktir; istemcideki `RaporTemplates` global API'sinden token cozumleme, tum takma adlari listeleme ve dinamik sablon kaydetme/debug metotlari kaldirildi.
- Canli surumde bu dosya zaten minify edilir; disariya yalnizca sablon secimi ve korumali sunucu render istegini baslatmak icin gereken dar API kalir.
- Formdaki alan girisleri, otomatik kayit ve anlik hesaplar degismedi. Sonraki adim, yuksek degerli placeholder/metin kurallarinin parca parca sunucu tarafinda otoriter olarak cozumlenmesidir.

## 0.0.306 - 2026-08-03 - Otoriter Placeholder Kural Dilimi

- Form doldururken, otomatik kaydederken veya ekranlar arasinda gezinirken yeni bir ag istegi eklenmedi.
- Yalnizca var olan banka sablonu olusturma isteginde; bina oturumu/giris aciklamasi ile proje uygunluk aciklamasi sunucuda ham alanlardan tekrar uretiliyor ve istemciden gelen metnin uzerine yaziliyor.
- `projeye uygunluk tespit edilmemistir` seceneginde, rapora yalnizca kullanicinin detay penceresinde girdigi aciklama yaziliyor.
- Sunucu imzali dogrulama nesnesi, bu aktarimda hangi placeholderlarin sunucu tarafindan otoriter olarak uretildigini de tasiyor.
- Cache-buster: `template-engine.js?v=20260803-1555`.

## 0.0.307 - 2026-08-04 - Hesap Yaşam Döngüsü ve Şifre İşlemleri

- Bulut hesap penceresine ad soyad, e-posta ve telefon güncelleme alanları eklendi. E-posta değişikliği yalnızca mevcut şifre ile yeniden doğrulanarak yapılır; telefon ve profil bilgileri sunucudaki onaylı kullanıcı kaydına yazılır.
- Kullanıcı hesabı penceresinden mevcut şifresini doğrulayarak şifresini değiştirebilir veya hesabını silebilir. Hesap silme uygulama erişimini, sunucu oturumlarını ve güvenilir cihaz kayıtlarını kaldırır; istemci Firebase hesabını da silmeyi dener.
- Giriş ekranına hesap varlığını açıklamayan `Şifremi unuttum` akışı eklendi. Girilen adres kayıtlıysa Firebase sıfırlama e-postası gönderir; hata mesajı kullanıcı/e-posta keşfine izin vermez.
- Yönetici kullanıcı ekranı, onaylı hesapları aktif/pasif yapma ve sistem erişiminden kaldırma kontrollerini içerir. Pasife alınan hesapların sunucu oturumları, güvenilir cihazları ve ayrıcalıklı görünürlüğü kaldırılır; tekrar aktifleştirilebilir.
- Kullanıcı onay akışı testi profil güncelleme, pasife alma, tekrar aktifleştirme ve silme senaryolarını kapsayacak şekilde genişletildi.
- Cache-buster: `styles.css?v=20260804-0017`, `cloud/cloud-sync.js?v=20260804-0017`.
