# Experify Denetim Bulguları Uygulama Planı

> Kaynak: `denetim-2026-09-08/EXPERIFY-DENETIM-RAPORU.md` (8 Eylül 2026) ve `PROGRAM-DEGERLENDIRME-VE-YOL-HARITASI.md`.
>
> İlke: Her uygulama adımından önce yalnızca değişecek dosyaların tarih damgalı yedeği `app/backups/` altında alınır. Önceden kullanıcı tarafından değiştirilmiş dosyalar (`tools/check-basic.js`, `tools/test-comparable-furnished-support.js`, `tools/test-documents-block-grouping.js`) bu iş kapsamında değiştirilmez veya geri alınmaz.

## Faz 0 — Güvenli çalışma zemini

1. Her faz için dosya-seçici yedek oluşturma ve yedek envanteri.
2. Mevcut test taban çizgisini kaydetme; Node 22 ve Windows/Linux farklarını açıkça ayırma.
3. Kaynak keşfini bilgi grafı ile yapma; değişiklikten sonra etki haritalama ve ilgili testleri çalıştırma.

**Bitti sayılır:** Yedek dizini, değişen dosyalar ve test sonucu her değişiklikte izlenebilir durumdadır.

## Faz 1 — Doğrudan güvenlik ve veri bütünlüğü

1. **G-01 — tamamlandı:** `server-data/` ağacı statik sunuma bütünüyle kapatıldı; imzalama anahtarı ve gelecekte eklenecek dosyalar için rota testi eklendi.
2. **V-01 — tamamlandı:** Bulut kaydı Firestore transaction içinde beklenen revizyonu atomik doğruluyor; uyuşmazlık görünür çakışma akışına gidiyor.
3. **V-02 — tamamlandı:** İlk asenkron sınırdan önce rapor kimliği, revizyon ve payload donduruluyor; eski rapor yanıtı yeni aktif raporun durumunu değiştirmiyor.
4. **V-03 — tamamlandı:** Yerel `/api/state` yazımı şema/revizyon kontrolü, kullanıcı-dosyasına özel yazım sırası, geçici dosya ve atomik değiştirme kullanıyor.

**Bitti sayılır:** Oturumlu/oturumsuz gizli yol testleri, eşzamanlı kayıt ve rapor-değişimi yarış testleri, yerel yazım başarısızlığı senaryoları geçer.

## Faz 2 — Yetkilendirme ve operasyon güvenilirliği

1. **G-02 — kısmen tamamlandı:** Sunucu rotaları ve harita karo yolu için oturumsuz / doğrulanmış / onaylı / oturum / MFA matrisi uygulandı. Doğrudan Firestore erişiminin onay/MFA claim'leriyle korunması, Firebase üretim yapılandırması veya güvenli aracı servis gerektirdiğinden açık altyapı adımıdır.
2. **G-03 — geçiş altyapısı tamamlandı:** `MFA_REQUIRED=true` üretim politikası e-posta anahtarından ayrıldı; bu politika seçiliyken anahtar yoksa sunucu/dağıtım güvenli biçimde başarısız olur. Üretimde etkinleştirme için GitHub `MFA_REQUIRED` variable'ının `true` yapılması gerekir.
3. **U-01 — tamamlandı:** Ortak masraf okuma/yazma izin veya ağ hatasını "kayıt yok" sonucundan ayır; görünür durum alanında yerel kullanım bilgisini göster ve yeniden deneme düğmesi sun.
4. **O-01 — kısmen tamamlandı:** Dağıtım izinli manifestle yalnız çalışma zamanı dosyalarını gönderiyor; `/api/readiness` sürüm/Node 22 uyumunu doğruluyor. Gerçek oturumla sentetik rapor ve örnek çıktı smoke testi için üretim test hesabı/kimliği gerekir.

**Bitti sayılır:** Onaysız/askıya alınmış/MFA'sız negatif testler; masraf yetki hatası görünürlüğü; dağıtım öncesi gerçek akış kontrolü geçer.

## Faz 3 — Rapor doğruluğu ve test güveni

1. **Q-01 — kullanıcı kararıyla beklemede:** Mevcut proje uygunluğu, belge, GABİM ve adres varsayılanları kullanıcı tarafından bilinçli ayarlanmıştır; bu alanlarda denetim önerisine göre otomatik metin değişikliği yapılmayacak. İleride ele alınırsa yalnız kullanıcının belirleyeceği yeni durum modeliyle çalışılacak.
2. **T-01 — ilk hata tamamlandı:** `test-title-unit-switch.js` kaynak dilimini CRLF/LF'den bağımsız çıkarıyor ve bulunamayan sınırda açık hata veriyor. Kalan metin-dilimleme testleri ayrı taranacak; yeni testlerde saf model/AST yaklaşımı tercih edilecek.
3. **Ş-01 — teknik destek tamamlandı:** STORED ve Word'ün standart DEFLATE ZIP girdileri tarayıcıda okunup STORED ara pakete normalleştiriliyor. Gerçek Word ile açma/onarım uyarısı kabul testi ayrıca yapılmalı.
4. Banka şablonları için tekli/çoklu onay örnekleri, Word açılış ve sayısal/görsel karşılaştırma seti oluştur.

**Bitti sayılır:** Boş rapor doğrulanmamış iddia üretmez; Windows/Linux testleri aynı sonucu verir; desteklenen Word şablonu onarım uyarısı vermez.

## Faz 4 — Kullanılabilirlik ve sürdürülebilirlik

1. **U-02 — kod tarafı tamamlandı, cihaz kabul testi açık:** 480 px ve altında emsal matrisi tek-emsel odağına göre sıkılaştırıldı; sabit alan etiketleri, dokunma ile yatay emsal geçişi, görünür kaydırma çubuğu ve 42 px giriş hedefleri eklendi. 390 px gerçek cihazda alan/fiyat/mobilya girişi kabul testi ayrıca yapılmalı.
2. **K-01 — tamamlandı:** `joinTurkishList` ve `escapeRegExp` için üst kapsamda oluşmuş yinelenen erken tanımlar alanına göre adlandırıldı; son/etkin davranış korunarak sessiz ezme kaldırıldı. `tools/test-no-duplicate-top-level-functions.js`, `app.js`teki tüm üst kapsam `function` tanımlarını kontrol eder ve yeni bir tekrarda satır numaralarıyla başarısız olur.
3. **P-01 — beklemede:** Saf metin yardımcılarını ayrı dosyaya alma denemesi, kaynak dilimlerini `window` olmadan çalıştıran mevcut `test-title-unit-switch.js` ile uyumsuz bulundu ve geri alındı. Sonraki modülerleştirme, tarayıcı ve Node test ortamında aynı sözleşmeyi koruyan bağımsız modül/test yükleyicisi hazırlanmadan yapılmayacak.
4. **Rapor Kontrol Merkezi — kullanıcı kararıyla atlandı:** Mevcut durum korunacak; yeniden ele alınması açık yeni istek gerektirir.
5. **Emsal Hafızası — tamamlandı:** Emsal verisi kullanıcının kendi sunucu alanındaki ayrı dosyada tutulur; yönetici veya başka kullanıcı için listeleme rotası yoktur. Tam koordinat zorunludur. Harita varsayılanında yalnız son 6 ayın kayıtları gelir; 6 aydan eski kayıtlar silinmez, kullanıcı açıkça isterse arşiv görünümüne dahil edilir. Emsal Konum Krokisi araç çubuğundaki Geçmiş Emsaller düğmesi POI'leri gösterir; seçilen kaydın "Emsal getir" eylemi yalnız ilk boş sütunu doldurur.

**Bitti sayılır:** Mobilde emsal girişi çift eksenli kaydırmaya zorlamaz; her modüler taşıma sonrası çıktı/test karşılaştırması değişmez.

## Uygulama sırası

Tamamlanan ilk paket: Faz 1.1–1.3 (G-01, V-01, V-02). Her alt adım için: bilgi grafı → seçici yedek → değişiklik → ilgili testler → `npm run verify` → değişen dosya/sonuç kaydı.
