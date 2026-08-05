# Banka Şablonları — Placeholder Rehberi

Bu klasördeki `.html` dosyaları banka rapor şablonlarıdır. Programda
**Banka ve Çıktı** bölümündeki *"Banka şablonuyla kaydet (Word)"* butonu, seçilen
şablon dosyasını okur, içindeki `{{PLACEHOLDER}}` işaretlerini rapor
verilerinizle doldurur ve Word ile açılabilen bir `.doc` dosyası indirir.

Şablonlar **programın kendi placeholder adlarını** kullanır — uygulamanın
**Placeholder** bölümünde gördüğünüz adların aynısı. Oradan kopyalayıp
şablona yapıştırabilirsiniz.

## Şablonları düzenleme

- Dosyalar düz HTML'dir; **Not Defteri, VS Code veya herhangi bir metin
  düzenleyiciyle** açıp değiştirebilirsiniz. Metin ekleyin/silin, tablo
  satırı ekleyin, sıralamayı değiştirin — serbestsiniz. Kaydettiğiniz anda
  geçerli olur (sürüm numarası gerekmez).
- Placeholder yazımında **büyük/küçük harf ve Türkçe karakter farkı
  önemsizdir**; noktalama da yok sayılır:
  `{{CİTY}}` = `{{city}}` = `{{CITY}}`, `{{TAPU_TARİHİ}}` = `{{taputarihi}}`.
- Bir placeholder **tanımlıysa ama raporda değeri boşsa** çıktıda boş kalır.
  **Tanımsız bir ad** yazarsanız çıktıda sarı `⚠ AD` işareti görünür ve
  dışa aktarma sonunda uyarı listelenir.
- **BÜYÜK/KÜÇÜK HARF KURALI (2026-08-05, kalıcı kural — yeni şablon
  oluştururken de uygulanır)**: aşağıda "★" işaretli alanlar (İl, İlçe,
  İdari/Tapu Mahalle, Site/Apartman, Blok, Kat, Dış Kapı No, Cadde/Sokak,
  Mevkii, Pafta, Bağımsız Bölüm Niteliği, Ana Taşınmaz Niteliği, Eklenti,
  Malik(ler), Edinme Sebebi) için İKİ ayrı placeholder ailesi var:
  - **Tek başına bir tablo hücresinde** kullanıyorsanız `..._BÜYÜK` ekli
    olanı seçin (ör. `{{CITY_BÜYÜK}}`, `{{TITLE_QUALITY_BÜYÜK}}`) — değer
    HER ZAMAN tamamen büyük harfle (Türkçe İ/ı dahil) gelir.
  - **Bir cümlenin/paragrafın içine gömüyorsanız** (ör. "...1 Adet
    {{TİTLE_QUALİTY_DÜZGÜN}} nitelikli taşınmazın...") düz adı VEYA
    (Tapu bölümü alanları için) `..._DÜZGÜN` ekli olanı kullanın — bu
    ikisi Türkçe dilbilgisine uygun (Baş Harfleri Büyük) gelir, ASLA
    tamamen büyük harfle haykırmaz.
  - Neden iki aile var: Adres bölümü alanları (İl, İlçe, İdari Mahalle,
    Site/Apartman, Blok, Kat, Dış Kapı No, Cadde/Sokak) siz nasıl
    girdiyseniz öyle saklanır — düz adı zaten cümle-güvenlidir, `_BÜYÜK`
    eki AYRICA gerekir. Tapu bölümü alanları (Tapu İl/İlçe/Mahalle,
    Mevkii, Pafta, Bağımsız Bölüm Niteliği, Blok, Tapu Katı, Ana Taşınmaz
    Niteliği, Eklenti) programda GİRİŞ ANINDA otomatik büyük harfe
    çevrilip öyle saklanır — düz adı zaten tablo-güvenlidir (büyük harf),
    cümle içinde kullanmak için `_DÜZGÜN` eki gerekir.
- Eski Excel programınızın adları (`{{SEHIR}}`, `{{ADRES2025}}` vb.) de
  tolerans amaçlı hâlâ çözümlenir; ancak şablonlarda ve yeni eklemelerde
  programın adlarını kullanın.
- Yeni bir şablon dosyası eklemek isterseniz: `.html` dosyasını bu klasöre
  koyun ve `src/templates/template-engine.js` içindeki `TEMPLATE_REGISTRY`
  listesine bir satır ekleyin (örnek satırlar dosyada mevcut).

## Şablon dosyaları

| Dosya | Banka / Amaç |
|---|---|
| `akbank.html` | Akbank özet rapor |
| `halkbank.html` | Halkbank özet rapor (risk kodları dahil) |
| `isbankasi.html` | İş Bankası özet rapor |
| `isbankasi-masraf.html` | İş Bankası masraf/ücret yazısı (tutarlar elle doldurulur) |
| `kuveytturk.html` | Kuveyt Türk özet rapor |
| `vakifbank.html` | Vakıfbank özet rapor |
| `vakifkatilim.html` | Vakıf Katılım özet rapor |
| `yapikredi.html` | Yapı Kredi özet rapor |
| `ziraat.html` | Ziraat Bankası özet rapor |
| `ziraat-ek-tablo.html` | Ziraat ek değer tablosu (yatay sayfa) |

## Placeholder listesi (programın adları)

### Dosya ve genel

| Placeholder | İçerik |
|---|---|
| `{{BANK}}` | Banka adı |
| `{{CUSTOMER_NAME}}` | Müşteri / talep eden |
| `{{CASE_NAME}}` | İş adı |
| `{{APPOİNTMENT_DATE}}` | Randevu tarihi (GG.AA.YYYY biçimli) |
| `{{OWNERSHİP_TYPE}}` | Mülkiyet türü |
| `{{USAGE_NATURE_DİFFERENCE}}` | Yasal/mevcut kullanım türü farkı var mı |

### Adres ve konum

| Placeholder | İçerik |
|---|---|
| `{{CİTY}}` / `{{DİSTRİCT}}` | İl / ilçe (cümle içi kullanım — zaten Baş Harf Büyük) ★ |
| `{{CİTY_BÜYÜK}}` / `{{DİSTRİCT_BÜYÜK}}` | İl / ilçe (TABLO hücresi — her zaman büyük harf) ★ |
| `{{TİTLE_NEİGHBORHOOD}}` | Tapu mahallesi (cümle içi — zaten büyük harf saklanır, cümlede `{{TİTLE_NEİGHBORHOOD_DÜZGÜN}}` kullanın) ★ |
| `{{TİTLE_NEİGHBORHOOD_BÜYÜK}}` | Tapu mahallesi (TABLO hücresi) ★ |
| `{{NEİGHBORHOOD}}` | İdari (adres) mahallesi (cümle içi — zaten Baş Harf Büyük) ★ |
| `{{NEİGHBORHOOD_BÜYÜK}}` | İdari (adres) mahallesi (TABLO hücresi) ★ |
| `{{STREET}}` / `{{STREET_BÜYÜK}}` | Sokak / cadde (cümle içi / TABLO hücresi) ★ |
| `{{ADDRESS_SİTE_NAME}}` / `{{ADDRESS_SİTE_NAME_BÜYÜK}}` | Site / apartman adı (cümle içi / TABLO hücresi) ★ |
| `{{ADDRESS_BLOCK_NAME}}` / `{{ADDRESS_BLOCK_NAME_BÜYÜK}}` | Blok — adres (cümle içi / TABLO hücresi) ★ |
| `{{TİTLE_BLOCK_NAME}}` | Blok — tapu (cümle içi — zaten büyük harf saklanır, cümlede `{{TİTLE_BLOCK_NAME_DÜZGÜN}}` kullanın) ★ |
| `{{TİTLE_BLOCK_NAME_BÜYÜK}}` | Blok — tapu (TABLO hücresi) ★ |
| `{{OUTER_DOOR}}` / `{{OUTER_DOOR_BÜYÜK}}` | Dış kapı no (cümle içi / TABLO hücresi) ★ |
| `{{İNNER_DOOR}}` | İç kapı no |
| `{{ADDRESS_FLOOR}}` / `{{ADDRESS_FLOOR_BÜYÜK}}` | Kat — adres (cümle içi / TABLO hücresi) ★ |
| `{{TİTLE_FLOOR}}` | Kat — tapu (cümle içi — zaten büyük harf saklanır, cümlede `{{TİTLE_FLOOR_DÜZGÜN}}` kullanın) ★ |
| `{{TİTLE_FLOOR_BÜYÜK}}` | Kat — tapu (TABLO hücresi) ★ |
| `{{UAVT}}` | UAVT adres kodu |
| `{{POSTAL_CODE}}` | Posta kodu |
| `{{LATİTUDE}}` / `{{LONGİTUDE}}` | Koordinatlar |
| `{{LOCATİON_NAME}}` | Mevkii (cümle içi — zaten büyük harf saklanır, cümlede `{{LOCATİON_NAME_DÜZGÜN}}` kullanın) ★ |
| `{{LOCATİON_NAME_BÜYÜK}}` | Mevkii (TABLO hücresi) ★ |
| `{{ACIK_ADRES}}` | Açık adres (otomatik birleştirilmiş) |
| `{{LOCATION_MAP_IMAGE}}` | “Haritayı Kaydet” ile seçilen konu taşınmaz haritası |
| `{{COMPARABLE_SKETCH_IMAGE}}` | “Krokiyi Kaydet” ile seçilen emsal konum krokisi |
| `{{REPORT_MAPS_SECTION}}` | Kaydedilmiş harita ve krokileri başlıklarıyla birlikte ekleyen bölüm |

### Çevre ve bölge

| Placeholder | İçerik |
|---|---|
| `{{TRANSPORT_REPORT_TEXT}}` | Ulaşım tarifi metni |
| `{{NEARBY}}` | Yakın çevre listesi |
| `{{ENVIRONMENTAL_FEATURES_TEXT}}` | Çevresel özellikler paragrafı (bölge türüne göre otomatik) |
| `{{MAİN_ARTERY}}` | Ulaşım ana arteri |
| `{{İNFRASTRUCTURE_LEVEL}}` | Altyapı olanakları |
| `{{DEVELOPMENT_DENSİTY}}` | Yapılaşma yoğunluğu |
| `{{SOCİAL_NEEDS}}` | Sosyal ihtiyaç mesafesi |
| `{{REGİON_INCOME_LEVEL}}` | Bölge gelir seviyesi |

### Tapu

| Placeholder | İçerik |
|---|---|
| `{{GROUND_TYPE}}` | Tapu türü / zemin tipi |
| `{{MAİN_PROPERTY_QUALİTY}}` | Ana taşınmaz niteliği (cümle içi — zaten büyük harf saklanır, cümlede `{{MAİN_PROPERTY_QUALİTY_DÜZGÜN}}` kullanın) ★ |
| `{{MAİN_PROPERTY_QUALİTY_BÜYÜK}}` | Ana taşınmaz niteliği (TABLO hücresi) ★ |
| `{{TİTLE_QUALİTY}}` | B.B. tapudaki nitelik (cümle içi — zaten büyük harf saklanır, cümlede `{{TİTLE_QUALİTY_DÜZGÜN}}` kullanın) ★ |
| `{{TİTLE_QUALİTY_BÜYÜK}}` | B.B. tapudaki nitelik (TABLO hücresi) ★ |
| `{{CURRENT_USAGE_NATURE}}` | Mevcut/fiili kullanım niteliği |
| `{{BLOCK_NO}}` / `{{PARCEL_NO}}` / `{{SHEET_NO}}` | Ada / parsel / pafta |
| `{{SHEET_NO_BÜYÜK}}` | Pafta (TABLO hücresi — Pafta zaten büyük harf saklanır, cümlede `{{SHEET_NO_DÜZGÜN}}` kullanın) ★ |
| `{{OLD_BLOCK_NO}}` / `{{OLD_PARCEL_NO}}` | Eski ada / parsel |
| `{{LAND_AREA}}` | Parsel yüzölçümü |
| `{{SHARE}}` / `{{DENOMİNATOR}}` | Arsa payı / paydası |
| `{{REGİSTRY_VOLUME}}` / `{{REGİSTRY_PAGE}}` | Cilt / sayfa |
| `{{TİTLE_PROPERTY_ID}}` | Taşınmaz zemin ID |
| `{{TİTLE_RECORD_CHANGE}}` | Tapu kaydı değişikliği var mı |
| `{{TAPU_TARİHİ}}` | İlk malikin tapu tarihi * |
| `{{TAPU_YEVMİYESİ}}` | İlk malikin yevmiye no'su * |
| `{{EDİNME_SEBEBİ}}` | İlk malikin edinme sebebi (cümle içi) * |
| `{{EDİNME_SEBEBİ_BÜYÜK}}` | İlk malikin edinme sebebi (TABLO hücresi) * ★ |
| `{{SAHİPLER}}` / `{{SAHİPLER_BÜYÜK}}` | Tüm malikler, isim+hisse birleşik ("Ali Veli (1/2)") — cümle içi / TABLO hücresi ★ |
| `{{MALİK_BÜYÜK}}` / `{{MALİKLER_BÜYÜK}}` | Tüm malikler, YALNIZCA isim(ler) (hissesiz), TABLO hücresi ★ |
| `{{TİTLE_ATTACHMENT}}` | Eklenti (cümle içi — zaten büyük harf saklanır, cümlede `{{TİTLE_ATTACHMENT_DÜZGÜN}}` kullanın) ★ |
| `{{TİTLE_ATTACHMENT_BÜYÜK}}` | Eklenti (TABLO hücresi) ★ |
| `{{MALIKLER_TABLO}}` | Malikler tablosu (HTML tablo) |
| `{{HİSSELİ_Mİ}}` | Hisseli mi (Evet/Hayır) * |
| `{{SHARE_EXPLANATİON}}` | Hisse açıklaması |

### Takyidat

| Placeholder | İçerik |
|---|---|
| `{{TAKBİS_DATE}}` / `{{TAKBİS_TİME}}` | Takyidat tarih / saat |
| `{{ENCUMBRANCE_SUMMARY_TEXT}}` | Takyidat paragrafı |
| `{{TAKYIDAT_TABLO}}` | Takyidat tablosu (HTML tablo) |
| `{{TAKYIDATACIKLAMAGIRISCUMLESI}}` | Takyidat açıklamasının giriş cümlesi (ör. "03.08.2026 tarihinde saat 17:32 Webtapu Sistemi üzerinden alınan TAKBİS belgesine göre, konu taşınmaz üzerinde aşağıdaki takyidatlar bulunmaktadır.") |
| `{{BEYANLARBOLUMU}}` | Takyidat - Beyanlar Bölümü metni |
| `{{HAKVEMUKELLEFIYETLERBOLUMU}}` | Takyidat - Hak ve Mükellefiyetler Bölümü metni |
| `{{REHINLERBOLUMU}}` | Takyidat - Rehinler (İpotekler) Bölümü metni |
| `{{SERHLERBOLUMU}}` | Takyidat - Şerhler Bölümü metni |

### İmar

| Placeholder | İçerik |
|---|---|
| `{{PLAN_NAME}}` / `{{PLAN_SCALE}}` / `{{PLAN_DATE}}` | Plan adı / ölçek / tarih |
| `{{LEGEND}}` / `{{ORDER}}` | İmar lejantı / nizamı |
| `{{TAKS}}` / `{{KAKS}}` / `{{HMAX}}` | Yapılaşma katsayıları |
| `{{CALCULATED_EMSAL}}` | Hesaplanan emsal |
| `{{FRONT_GARDEN}}` / `{{SİDE_GARDEN}}` | Ön / yan bahçe |
| `{{TEVHİD_CONDİTİON}}` / `{{MİNİMUM_FRONTAGE_CONDİTİON}}` | Tevhid / minimum cephe şartı |
| `{{ROAD_SETBACK}}` | Yola terk var mı |
| `{{ROAD_SETBACK_AMOUNT}}` / `{{YOLA_TERK_MIKTARI}}` | Yola terk miktarı |
| `{{POST_ROAD_SETBACK_PARCEL_AREA}}` / `{{TERK_SONRASI_PARSEL_ALANI}}` | Terk sonrası parsel alanı (yüzölçümü - yola terk miktarı; terk yoksa yüzölçümü) |
| `{{FLOOR_COUNT}}` | İmar kat adedi |
| `{{PLANNİNG_NOTE_TEXT}}` | İmar açıklaması |
| `{{URBAN_TRANSFORMATİON_AREA}}` | Kentsel dönüşüm bölgesinde mi |
| `{{ARTİCLE18_APPLİED}}` | 18. madde uygulaması |

### Belgeler ve proje

| Placeholder | İçerik |
|---|---|
| `{{İNCELENEN_BELGELER_TABLO}}` | İncelenen belgeler tablosu (HTML tablo) * |
| `{{REVİEWED_DOCUMENTS_TEXT}}` | İncelenen belgeler / ruhsat-iskan açıklaması |
| `{{PROJECT_CONFORMİTY}}` | Projeye uygunluk açıklaması |
| `{{PROJECT_DİFFERENCE}}` | Tapu/belediye projesi arasında fark var mı |
| `{{MAİN_REAL_ESTATE_PROJECT_SUİTABLE}}` | Ana gayrimenkul projesine uygun mu |
| `{{MAİN_REAL_ESTATE_PROJECT_SUİTABİLİTY_NOTE}}` | Uygunluk açıklama notu |
| `{{PROJECT_İNSTİTUTİON}}` | Proje incelenen kurum |
| `{{PENALTY_DECİSİON_EXPLANATİON_TEXT}}` | Cezai karar açıklaması |
| `{{STATİC_SUİTABİLİTY_EXPLANATİON_TEXT}}` | Statik uygunluk açıklaması |
| `{{BUİLDİNG_İNSPECTİON_EXPLANATİON_TEXT}}` | Yapı denetim açıklaması |
| `{{İSKAN_VAR_MI}}` / `{{YAPIKULLANMAIZINBELGESIVARMI}}` | Yapı kullanma izin belgesi var mı (aynı kaynak, iki isim) * |
| `{{EKB_ENERGY_CLASS}}` / `{{EKB_DOCUMENT_NO}}` | EKB sınıfı / belge no |
| `{{EKB_ISSUE_DATE}}` / `{{EKB_VALİD_UNTİL}}` | EKB veriliş / geçerlilik tarihi |

### Ana gayrimenkul ve bağımsız bölüm

| Placeholder | İçerik |
|---|---|
| `{{MAİN_PROPERTY_DESCRİPTİON_TEXT}}` | Ana gayrimenkul açıklaması |
| `{{UNİT_İNTERİOR_DESCRİPTİON_TEXT}}` | Kat, alan ve iç hacimler açıklaması |
| `{{UNİT_DECORATİVE_DESCRİPTİON_TEXT}}` | Dekoratif özellikler açıklaması |
| `{{KAT_BAZLI_İÇ_HACİMLER}}` | Kat bazlı iç hacimler özeti * |
| `{{BUİLDİNG_FLOOR_SUMMARY_TEXT}}` | Kat dağılımı özeti |
| `{{MAİN_PROPERTY_FLOOR_COUNT_TEXT}}` | Ana gayrimenkul kat adedi metni |
| `{{BUİLDİNG_STYLE}}` / `{{BUİLDİNG_CLASS}}` / `{{BUİLDİNG_ORDER}}` | Yapı tarzı / sınıfı / nizamı |
| `{{BUİLDİNG_CONSTRUCTİON_YEAR}}` / `{{BUİLDİNG_AGE}}` | Yapım yılı / yapı yaşı |
| `{{BUİLDİNG_COMPLETİON_DATE}}` | Yapı bitiş tarihi |
| `{{TOTAL_FLOORS}}` / `{{TOTAL_UNİTS}}` | Kat sayısı / bağımsız bölüm sayısı |
| `{{ELEVATOR}}` / `{{CARPARK}}` | Asansör / otopark |
| `{{SOCİAL_FACİLİTİES}}` | Sosyal tesisler |
| `{{UNİT_HEATİNG_TYPE}}` | Isınma sistemi |
| `{{UNİT_MATERİAL_QUALİTY}}` | Malzeme ve işçilik kalitesi |
| `{{UNİT_VİEW_STATUS}}` / `{{FACADES}}` | Manzara / cepheler |
| `{{CEPHESAYISI}}` | Seçili cephe (yön) sayısı * |
| `{{SALON}}` / `{{ODA}}` / `{{MUTFAK}}` | Salon / oda / mutfak adedi (iç hacimlerden otomatik sayılır) * |
| `{{BANYO}}` / `{{TUVALET}}` / `{{BALKON}}` | Banyo (duş + ebeveyn banyosu dahil) / wc / balkon (teras + veranda dahil) adedi * |
| `{{ICHACIMGRUPSAYIMI}}` | Yukarıdaki altı grubu tek metinde birleştirir (ör. "Salon 1 Oda 4 Banyo 2 Wc 1 Balkon 3") * |
| `{{DIGER}}` | Yukarıdaki altı gruba uymayan iç hacimlerin (antre, hol, kiler, çamaşırlık, depo vb.) toplam adedi * |
| `{{UNİT_USAGE_STATUS}}` | Kullanım durumu |
| `{{UNİT_CONSTRUCTİON_LEVEL}}` | İnşaat seviyesi (boşsa "Tamamlanmış (%100)") * |
| `{{EARTHQUAKE_ZONE}}` | Deprem derecesi |
| `{{İÇİ_GÖRÜLDÜ_MÜ}}` | İçi görüldü mü (randevu türünden) * |
| `{{SİTE_İÇİNDE_Mİ}}` | Site içerisinde mi * |
| `{{BUİLDİNG_ENTRANCE_DOOR}}` | Bina giriş kapısı |
| `{{BINA_OTURUMU_VE_GIRIS_ACIKLAMASI}}` | Bina oturumu referansı ile giriş kat/yön bilgisinden oluşturulan açıklama * |

### Değerleme

| Placeholder | İçerik |
|---|---|
| `{{LEGAL_VALUE}}` / `{{CURRENT_VALUE}}` | Yasal / mevcut değer ("1.234.567 TL" biçimli) |
| `{{CURRENT_RENT}}` / `{{LEGAL_RENT}}` | Aylık kira (biçimli) |
| `{{YILLIK_KİRA_MEVCUT}}` | Yıllık mevcut kira (aylık × 12) * |
| `{{LEGAL_RENT_UNİT}}` / `{{CURRENT_RENT_UNİT}}` | Kira m² birim değerleri |
| `{{LAND_UNİT_VALUE}}` | Arsa m² birim değeri |
| `{{LEGAL_AREA}}` / `{{CURRENT_AREA}}` | Yasal / mevcut kullanım alanı |
| `{{TOTAL_LEGAL_AREA}}` / `{{TOTAL_CURRENT_AREA}}` | Birden fazla kat girilmişse katların toplam yasal / mevcut alanı; tek katlı kayıtta ilgili alanı getirir |
| `{{LEGAL_VALUE_AREA}}`, `{{LEGAL_VALUE_UNIT}}`, `{{CURRENT_VALUE_AREA}}`, `{{CURRENT_VALUE_UNIT}}` | Piyasa değeri tablosundaki alan ve m² birim değer kutucukları |
| `{{LEGAL_BUILDING_VALUE_AREA}}`, `{{LEGAL_BUILDING_UNIT_COST}}`, `{{LEGAL_BUILDING_DEPRECIATION_RATE}}`, `{{LEGAL_BUILDING_CONSTRUCTION_LEVEL}}` | Yapı değeri tablosundaki yasal durum kutucukları; mevcut durum için aynı adların `CURRENT_...` karşılıkları kullanılır |
| `{{INSURANCE_VALUE_AREA}}`, `{{INSURANCE_UNIT_COST}}`, `{{INSURANCE_VALUE}}` | Sigortaya esas değer kutucukları |
| `{{LAND_VALUE}}`, `{{LEGAL_PREMIUM_VALUE}}`, `{{LEGAL_PREMIUM_RATE}}`, `{{CURRENT_PREMIUM_VALUE}}`, `{{CURRENT_PREMIUM_RATE}}` | Arsa değeri ve şerefiye kutucukları |
| `{{PROPERTY_TAX_DECLARATION_VALUE}}` | Emlak beyan değeri kutucuğu |
| `{{SALEABİLİTY_NOTE}}` | Satış kabiliyeti / eksper kanaati |
| `{{VALUATİON_METHOD}}` | Değerleme yöntemi |
| `{{DEGERI_ETKILEYEN_OLUMLU_FAKTORLER}}` | Olumlu faktörler |
| `{{DEGERI_ETKILEYEN_OLUMSUZ_FAKTORLER}}` | Olumsuz faktörler |
| `{{DEGERI_ETKILEYEN_FAKTORLER}}` | Faktörlerin tamamı tek metin |
| `{{DEGERLENDIRME_TABLOSU}}` | Değerleme özet tablosu (HTML tablo) * |
| `{{DEGERLENDIRME_SEMASI}}` | Değerleme yöntemleri hesap açıklaması |
| `{{DEGERLEME_YONTEMI_ACIKLAMASI}}` | Değerleme yöntemi seçimi açıklaması |
| `{{SATIS_KABILIYETI_ACIKLAMASI}}` | Satış kabiliyeti açıklaması — yalnızca "Satılabilir" DIŞINDAKİ bir seçimde dolu gelir, satılabilir ise boştur * |
| `{{TARLA_BAHCE_DEGERLEME_RISKI_ACIKLAMASI}}` | Tarla mülkiyet türünde zorunlu tarla/bahçe değerleme riski açıklaması; diğer türlerde boştur * |
| `{{VALUATİON_SALEABİLİTY_EXPLANATİON}}` | Satış kabiliyeti açıklaması (Halkbank uyumlu İngilizce alan adı) * |
| `{{KIRA_ACIKLAMASI}}` | Kira açıklaması (yasal/mevcut kira değerlerinden otomatik) * |
| `{{EMLAK_BEYAN_DEGERI_ACIKLAMASI}}` | Emlak beyan değeri açıklaması — "Emlak Beyan Değeri" kutucuğu işaretliyse değer metni, işaretli değilse (yalnızca Ziraat Bankası şablonunda) "bilgi paylaşılmadı" metni, diğer bankalarda işaretsizken boştur * |
| `{{KAT_BAZINDA_INDIRGENMIS_ALAN_TABLOSU}}` | Kat bazında indirgenmiş alan tablosu (yasal/mevcut, HTML tablo) * |

Değerleme bölümünün önerilen sırası (bkz. `handoff.md`): Değerleme Yöntemi
Açıklaması → Hisse Açıklaması (varsa) → Satış Kabiliyeti Açıklaması
(satılabilir değilse) → Kira Açıklaması → Emlak Beyan Değeri Açıklaması →
Değerleme Özet Tablosu → Kat Bazında İndirgenmiş Alan Tablosu → Değerleme
Yöntemleri Hesap Açıklaması. Tüm banka şablonları bu sırayı kullanır.

### Ziraat Bankası açıklama bölümleri

Bu üç placeholder yalnızca Ziraat Bankası rapor şablonunda kullanılır. Metinler,
Adres ve Konum ile çevresel/ana gayrimenkul alanlarından otomatik oluşturulur:

| `{{ZIRAAT_KONUM_CEVRESEL}}` | Konumu ve çevresel özellikleri |
| `{{ZIRAAT_BOLGE_GELISIMI}}` | Bölgenin gelişimine ilişkin analiz |
| `{{ZIRAAT_YAPILASMA}}` | Bölgedeki yapılaşma durumu |

### Emsaller

**Standart format (2026-07-13 itibarıyla tüm banka şablonlarında kullanılan format):**
Emsaller bölümünde önce `{{EMSAL_MATRISI}}` (kaç emsal girilmişse o kadar
sütun açan karşılaştırma tablosu), altında "Emsal Açıklaması" başlığı ve
`{{EMSAL_PIYASA_ANALIZI}}` (analiz metni) yer alır. Yeni bir şablon
eklerken Emsaller bölümünü bu iki placeholder ile kurun; eski
`{{EMSAL_TABLOSU}}` / `{{EMSAL_1}}`...`{{EMSAL_7}}` paragraf listesi artık
hiçbir şablonda kullanılmaz (bkz. `tools/test-bank-templates.js`, bu kuralı
otomatik doğrular).

| Placeholder | İçerik |
|---|---|
| `{{EMSAL_MATRISI}}` | Emsal karşılaştırma matrisi — satırlar alan (nitelik, konum, yüzölçümü, değer...), sütunlar dolu emsal sayısı kadar ("Emsal 1", "Emsal 2"...) (HTML tablo) * |
| `{{EMSAL_PIYASA_ANALIZI}}` | Piyasa analizi ve emsal değerlendirme metni |
| `{{EMSAL_ARSA_PIYASA_DEGERI}}` | Arsa/tarla için "Hesaplanan Emsale Göre Piyasa Değeri" tablosu (yalnızca hesaplanabiliyorsa) * |
| `{{EMSAL_TABLOSU}}` | *(eski format — yeni şablonlarda kullanmayın)* Emsal değerleme özet tablosu (No/Alan/Talep Edilen Değer...) * |
| `{{EMSAL_1}}` ... `{{EMSAL_7}}` | *(eski format — yeni şablonlarda kullanmayın)* Emsal özet cümleleri * |

### Gabim Veri Seti

Rapor formatlarının en alt bölümündeki "Gabim Veri Seti" artık GDYS'nin
gerçek formunu (gayrimenkul türüne göre farklı grup/alan gösteren form)
birebir yansıtır — bkz. `app.js` içindeki `gabimPropertyProfile()` ve
`buildGabimExportGroups()`. Gösterilen gruplar `Mülkiyet` (ownershipType)
ve `Yasal Kullanım Niteliği` (legalUsageNature) alanlarından türetilir:

- **Arsa/Tarla** (bina yok): sadece Genel Ek Bilgiler, Tapu Bilgileri,
  Tapuya Özel Bilgiler, Bağımsız Bölüm/Taşınmaz Özellikleri (Birim
  Değerler ve Cephe/Kat alanları olmadan).
- **Arazi** (bina yok + Yasal Kullanım Niteliği = Arazi): yukarıdakine ek
  olarak "Araziye Özel Bilgiler" (Tarım Türü, Arazi Sınıflandırması,
  Kadastro Yoluna Cephesi).
- **Konut** (bina var + Yasal Kullanım Niteliği = Konut): Yapıya Özel
  Bilgiler, Yapı Tür Bilgisi, tam Ek Bilgiler, Bağımsız Bölüm bölümünde
  Birim Değerler + tam Cephe ve Kat (Site Adı/Oda/Salon/Banyo/Mutfak/
  Balkon/Cepheler).
- **Diğer Bina** (bina var, Konut dışı — İşyeri/Ofis/Ticari Bina/Sanayi
  Tesisi): Yapıya Özel Bilgiler + sadeleştirilmiş Ek Bilgiler (Yönetici/
  Otopark/Asansör/Güvenlik), Bağımsız Bölüm bölümünde Birim Değerler +
  sadece Enerji Sınıfı (Cephe/Kat detayları yok). Yapı Tür Bilgisi
  gösterilmez.

Ekrandaki "Gabim Veri Seti" paneli (uygulama içi, son bölüm) bilinçli
olarak TÜM alanları göstermeye devam eder (kullanıcı GDYS'ye elle veri
girerken referans olsun diye) — yalnızca rapor/Word çıktısı türe göre
budanır.

| Placeholder | İçerik |
|---|---|
| `{{GABIM_VERI_SETI}}` | Gayrimenkul türüne göre koşullu Gabim Veri Seti grupları (HTML) * |

### Halkbank'a özel

| Placeholder | İçerik |
|---|---|
| `{{HALKBANK_RISK_KODLARI}}` | Risk kodları rapor metni |
| `{{HALKBANK_RISK_KODLARI_TABLO}}` | Risk kodları tablosu |

### Ziraat ek tablo

| Placeholder | İçerik |
|---|---|
| `{{ZRT_BELGE_TÜRÜ}}` / `{{ZRT_BELGE_TARİHİ}}` / `{{ZRT_BELGE_NO}}` | İncelenen belgelerdeki ilk ruhsat/iskan belgesinin türü, tarihi, no'su * |

`*` işaretli adlar, uygulamanın Placeholder bölümünde listelenen alanlardan
değil, **şablon motorunun mevcut rapor verilerinden hesapladığı** ek
placeholderlardır (kaynakları yine tamamen programdır).

## Programda karşılığı OLMAYAN kavramlar

Eski Excel'de olup programda veri kaynağı olmayan alanlar (şablona
yazarsanız `⚠` görürsünüz; elle doldurmanız gerekir): acil satış değerleri,
terk sonrası parsel alanı, terk miktarı, arka bahçe, iskan tarihi, EKB bina
kodu, net kullanım alanları ve İş Bankası masraf yazısındaki ücret kalemleri
(masraf şablonunda bu alanlar noktalı boşluk olarak bırakılmıştır).
## Emsal Alanlarinin Ayrintili Placeholder Adlari

Emsal tablolarina ek olarak her emsal satirindaki veri girisi ve otomatik
hesap alani `{{EMSAL_1_...}}` ile `{{EMSAL_7_...}}` arasinda ayrica kullanilabilir.
Ornekler:

| Placeholder | Icerik |
|---|---|
| `{{EMSAL_1_EMSAL_NITELIGI}}` | 1. emsalin niteligi |
| `{{EMSAL_1_YUZOLCUMU}}` | 1. emsalin yuzolcumu |
| `{{EMSAL_1_YOLA_CEPHE_DURUMU}}` | 1. emsalin yola cephe durumu |
| `{{EMSAL_1_KONUM_KARSILASTIRMA_SEBEBI}}` | 1. emsalin konum karsilastirma aciklamasi |
| `{{EMSAL_1_INDIRGENMIS_M2_BIRIM_DEGERI}}` | 1. emsalin otomatik indirgenmis birim degeri |
| `{{EMSAL_1_UZUN_EMSAL_METNI}}` | 1. emsal icin olusturulan uzun aciklama |

`1` yerine `2`-`7` kullanilarak diger emsal satirlarina erisilebilir. Ayrica
`{{EMSAL_ARSA_PIYASA_DEGERI}}` hesaplanan emsale gore arsa piyasa degeri
tablosunu, `{{EMSAL_MATRISI}}` emsal giris matrisini ve `{{EMSAL_TABLOSU}}`
emsal degerleme tablosunu getirir.
