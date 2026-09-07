// "Değeri Etkileyen Faktörler", çoklu taşınmazlı raporlarda "Taşınmaz
// Bazında" kategorideki faktörler için artık YALNIZCA aktif taşınmazı
// değil, TÜM taşınmazları yansıtıyor (2026-09-07).
//
// Kullanıcı talebi: "değere etki eden faktörlere geçelim bunlarda bazı
// faktörler ana yapı ile ilgili bazı faktörler bulunulan bölge ile ilgili
// bazı faktörler ise taşınmaz bazında. bunları önce gruplandırarak
// listele" — sohbette önerilen 3'lü sınıflandırma (Ana Yapı/Bölge/Taşınmaz
// Bazında, ID önekine göre: building-/document- | location- |
// title-/land-/unit-/planning-/valuation-) ONAYLANDI, ardından: "uygundur
// buna göre koda geç taşınmaz bazında olanların başına yine gruplandırma
// mantığı ile yap. Örnek A-5 ve A-8 Nolu taşınmazların ara katta yer
// alması gibi."
//
// Kök neden: value-factors-rules.js'in calculateValueFactors() fonksiyonu
// TEK bir { fields, tables } girdisinden hesaplama yapar — çoklu
// taşınmazlı raporlarda bu YALNIZCA aktif taşınmazı yansıtıyordu; diğer
// taşınmazların (farklı olabilecek) "taşınmaz bazında" özellikleri (kat
// konumu, cephe, manzara, malzeme kalitesi, arsa/parsel özellikleri, satış
// kabiliyeti vb.) TAMAMEN GÖRMEZDEN geliniyordu.
//
// KULLANICI DÜZELTMESİ (2026-09-07, GERÇEK canlı çıktı üzerinden): "Taşınmazın
// asansörlü bir binada yer alması bu cümle çoğul değil. Taşınmazların
// asansörlü bir binada yer almaları buna göre diğer faktörleri çoklu
// raporlarda güncelle" — İKİ ayrı düzeltme gerektirdi: (a) ÖZNE
// pluralizasyonuna EK OLARAK metnin SONUNDAKİ 3. tekil şahıs iyelik eki
// ("-sı", ör. "alma-sı") de ÇOĞUL olmalı ("-ları", "alma-ları") — bu HEM
// "taşınmaz bazında" (grup+atıf) HEM "Ana Yapı/Bölge" (paylaşımlı)
// metinlerini etkiler; (b) Ana Yapı/Bölge (paylaşımlı) faktörleri ÖNCEKİ
// commit'te (0.0.653) BİLİNÇLİ OLARAK HİÇ ÇOĞULLANMIYORDU — artık HER
// metin AYRI AYRI incelenip, GERÇEKTEN taşınmaza atıf yapanlar (ya da
// "Bulunduğu"/"Yer aldığı" gibi taşınmaza dolaylı atıfta bulunanlar)
// çoğullanıyor; "Bölgenin.../Statik uygunluğun..." gibi zaten paylaşılan
// bir ÖZNEYE (bölge/belge/proje/sözleşme) sahip metinler DOKUNULMUYOR.
//
// KULLANICI 2. TAKİP TALEBİ (2026-09-07): "tüm taşınmazları kapsayan
// taşınmaz bazında bir faktör var ise burada taşınmazların numaralarını
// yazmaya gerek yok. A-5, A-8, A-11 ve A-15 No'lu taşınmazların iki yöne
// cepheli olmaları yerine Taşınmazların iki yöne cepheli olmaları gibi" —
// groupAndAttributeValueFactorEntries()/buildValueFactorAttributedText()
// artık RAPORDAKİ TOPLAM taşınmaz sayısını da alır: bir grup TÜM
// taşınmazları kapsıyorsa (labels.length === totalUnitCount) özne JENERİK
// "Taşınmazların" olur, etiket LİSTELENMEZ — SADECE gerçek bir ALT KÜME
// söz konusu olduğunda etiketler görünür (satış kabiliyeti/değerleme
// yöntemi ailesindeki "TÜM taşınmazlar aynı → atıfsız TEK cümle" ilkesiyle
// TUTARLI).
//
// Bu test kapsamı:
//  1) count<2 -> davranış DEĞİŞMEDİ (representative sonuç AYNEN döner).
//  2) Ana Yapı/Bölge kalemleri: taşınmaza HİÇ atıf yapmayanlar (Bölgenin
//     altyapısı gibi) ÇOKLU raporda DAHİ DEĞİŞMEZ; manuel kalemler TEK
//     SEFER görünür, ASLA çoğullanmaz/tekrarlanmaz.
//  3) Ana Yapı kalemleri: taşınmaza AÇIKÇA atıf yapanlar (asansör —
//     kullanıcının BİZZAT verdiği örnek) DOĞRU çoğul cümleye döner; DOLAYLI
//     atıf yapanlar ("Bulunduğu binanın..." gibi) yalnızca İLGİLİ kısım
//     çoğullanır, paylaşılan (belge/imkan) kısım TEKİL kalır.
//  4) AYNI "taşınmaz bazında" faktörü üreten 2+ taşınmaz TEK, atıflı
//     satırda birleşir VE metnin SONUNDAKİ iyelik eki de ÇOĞULLANIR
//     (kullanıcının düzeltmesiyle TUTARLI — "...sahip olması" DEĞİL
//     "...sahip olmaları").
//  5) YALNIZCA 1 taşınmazda tetiklenen bir faktör TEKİL atıfla (ör. "A-5
//     No'lu taşınmazın ... olması") görünür — iyelik eki TEKİL kalır.
//  6) "Taşınmazın " ile BAŞLAYAN faktör metinlerinde (manzara gibi) önek
//     atıf öznesiyle DEĞİŞTİRİLİR, SONDAKİ iyelik eki de ÇOĞULLANIR.
//  7) manualPositive/manualNegative kalemleri HER taşınmaz turunda TEKRAR
//     EKLENMEZ (yalnızca TEK KEZ, representative sonuçtan gelir).
//  8) Bir taşınmazda HİÇ tetiklenmeyen bir faktör o taşınmaz İÇİN hiç
//     satır üretmez (yalnızca GERÇEKTEN tetiklenen taşınmazlar atfa dahil
//     olur).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ValueFactorsRules = require("../src/value-factors/value-factors-rules");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = appSource.indexOf(startMarker);
  const end = appSource.indexOf(endMarker, start);
  assert(start >= 0 && end > start, `Kaynak fonksiyon bulunamadı: ${startMarker}`);
  return appSource.slice(start, end);
}

const valueFactorsMultiUnitSource = sourceBetween(
  "function isPerUnitValueFactorId(id) {",
  "function createValueFactorsPanel"
);
const joinTurkishListSource = sourceBetween(
  "function joinTurkishList(items = []) {",
  "function fillWorkplaceFloorCalculationTableBody"
);
const shortLabelSource = sourceBetween(
  "function formatTitleUnitSuitabilityShortLabel(fields, index) {",
  "// Tam şablonlu cümlenin"
);
const lowercaseFirstLetterTrSource = sourceBetween(
  "function lowercaseFirstLetterTr(text) {",
  "// Türkçe \"bildirme eki\""
);

function makeContext() {
  const context = {
    globalThis: { ValueFactorsRules },
    state: { fields: {} },
    normalizeReportDescriptionText: (value) => String(value || "").trim().replace(/\s+/g, " "),
    getTitleUnitCount: () => (context.__units ? context.__units.length : 1),
    buildAllTitleUnitsForSummaryTable: () => context.__units || [],
  };
  vm.createContext(context);
  vm.runInContext(`${joinTurkishListSource}\n${shortLabelSource}\n${lowercaseFirstLetterTrSource}\n${valueFactorsMultiUnitSource}`, context);
  return context;
}

function withUnits(context, unitFieldsList) {
  context.__units = unitFieldsList.map((fields) => ({ fields, tables: {} }));
  context.state.fields = { ...unitFieldsList[0] };
}

// unit(): "unit-middle-floor" (Ara katta) tetiklenmesi için buildingFloorCounts.normal
// paylaşımlı (aktif/orijinal fields'tan "sızan") bir alan olduğundan burada
// ELLE verilmiyor — floor faktörleri tables.unitFloors + fields.elevator'a bağlı.
// Testte sade tutmak için doğrudan "unit-view-positive"/"unit-material-quality-high"
// gibi tables'a bağımlı OLMAYAN, saf `fields`-tabanlı kurallar kullanılıyor.
// NOT: gerçek üretimde her taşınmazın `fields` nesnesi (getTitleUnitFieldsForLabel
// üzerinden) HER ZAMAN TÜM alan anahtarlarını taşır (boşsa "" olarak) —
// bu yüzden test kullanılan alanlar BURADA da her zaman AÇIKÇA boş
// verilir (eksik bırakılırsa test sandbox'ında state.fields =
// {...originalFields, ...unit.fields} birleştirmesi bir ÖNCEKİ
// taşınmazın değerinin YANLIŞLIKLA sızmasına yol açar — bu SADECE test
// mock'unun eksikliği, gerçek koddaki bir kusur DEĞİL).
const unit = (overrides = {}) => ({
  unitNo: "",
  titleBlockName: "",
  elevator: "",
  infrastructureLevel: "",
  unitMaterialQuality: "",
  unitViewStatus: "",
  ...overrides,
});

function idsOf(items) {
  return items.map((item) => item.id);
}

// --- 1) count < 2 -> representative sonuç AYNEN döner -------------------
{
  const context = makeContext();
  context.state.fields = { unitViewStatus: "Geniş Deniz Manzarası" };
  context.getTitleUnitCount = () => 1;
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const direct = ValueFactorsRules.calculateValueFactors(baseInput);
  const wrapped = context.calculateValueFactorsForAllTitleUnits(baseInput);
  assert.deepEqual(idsOf(wrapped.positive), idsOf(direct.positive), "count<2 iken pozitif liste DEĞİŞMEMELİ.");
  assert.deepEqual(wrapped.positive.map((i) => i.text), direct.positive.map((i) => i.text), "count<2 iken metinler DEĞİŞMEMELİ (atıf eklenmemeli).");
  console.log("count<2 (tek taşınmaz) geriye dönük uyumluluk testi tamam.");
}

// --- 2) Ana Yapı/Bölge (taşınmaza atıf YAPMAYAN) + manuel kalemler TEK ---
// SEFER görünür, DEĞİŞMEDEN kalır.
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", infrastructureLevel: "iyi" }),
    unit({ unitNo: "8", infrastructureLevel: "iyi" }),
  ]);
  const baseInput = {
    fields: context.state.fields,
    tables: {},
    disabledIds: [],
    manualPositive: [{ text: "Ek olumlu özellik" }],
    manualNegative: [],
  };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const manualEntries = result.positive.filter((item) => item.source === "manual");
  assert.equal(manualEntries.length, 1, "Manuel kalem HER taşınmaz turunda TEKRAR EKLENMEMELİ, TEK KEZ görünmeli.");
  assert.equal(manualEntries[0].text, "Ek olumlu özellik", "Manuel kalem ASLA çoğullanmamalı (kullanıcının kendi serbest metni).");
  const infraEntries = result.positive.filter((item) => item.id === "location-infrastructure-good");
  assert.equal(infraEntries.length, 1, "Bölge faktörü (paylaşımlı) TEK KEZ görünmeli, taşınmaz sayısı kadar TEKRARLANMAMALI.");
  assert.equal(infraEntries[0].text, "Bölgenin altyapı olanaklarının iyi seviyede olması", "Taşınmaza atıf YAPMAYAN Bölge faktörü ÇOKLU raporda DAHİ DEĞİŞMEMELİ (özne zaten 'Bölgenin').");
  console.log("Ana Yapı/Bölge (atıfsız)/manuel kalemlerin tek sefer, değişmeden hesaplanması testi tamam.");
}

// --- 3) KULLANICI ÖRNEĞİ (BİREBİR): Ana Yapı faktörü taşınmaza AÇIKÇA ----
// atıf yapıyorsa (asansör) ÇOKLU raporda DOĞRU çoğul cümleye döner;
// DOLAYLI atıf yapan (occupancy-permit) yalnızca İLGİLİ kısmı çoğullanır.
{
  const context = makeContext();
  withUnits(context, [
    unit({ unitNo: "5", elevator: "2 Adet Asansör" }),
    unit({ unitNo: "8", elevator: "2 Adet Asansör" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const elevatorEntries = result.positive.filter((item) => item.id === "building-elevator");
  assert.equal(elevatorEntries.length, 1, "Ana Yapı faktörü (paylaşımlı) TEK KEZ görünmeli.");
  assert.equal(
    elevatorEntries[0].text,
    "Taşınmazların asansörlü bir binada yer almaları",
    "KULLANICI DÜZELTMESİ: 'Taşınmazın ... yer alması' artık 'Taşınmazların ... yer almaları' (hem özne HEM iyelik eki çoğul) olmalı."
  );
  console.log("KULLANICI ÖRNEĞİNİN BİREBİR REPRODÜKSİYONU (Ana Yapı: asansör çoğullaması) testi tamam.");
}

// --- 3b) DOLAYLI atıf (occupancy-permit): yalnızca "Bulunduğu"->"Bulundukları" --
// değişir, paylaşılan BELGE tekil kalır ("bulunması" DEĞİŞMEZ).
{
  const context = makeContext();
  withUnits(context, [unit({ unitNo: "5" }), unit({ unitNo: "8" })]);
  const baseInput = {
    fields: context.state.fields,
    tables: { documents: [{ type: "Yapı Kullanma İzin Belgesi" }] },
    disabledIds: [],
    manualPositive: [],
    manualNegative: [],
  };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const permitEntries = result.positive.filter((item) => item.id === "document-occupancy-permit");
  assert.equal(permitEntries.length, 1);
  assert.equal(
    permitEntries[0].text,
    "Bulundukları binanın Yapı Kullanma İzin Belgesi bulunması",
    "Dolaylı atıf ('Bulunduğu'->'Bulundukları') değişmeli, paylaşılan belgenin KENDİSİ ('bulunması') TEKİL kalmalı."
  );
  console.log("Dolayli atif (Bulundugu->Bulunduklari, paylasilan belge tekil kalir) testi tamam.");
}

// --- 4) KULLANICI ÖRNEĞİ (BİREBİR): AYNI taşınmaz-bazında faktörü üreten -
// 2 taşınmaz TEK atıflı satırda birleşir, SONDAKİ iyelik eki de ÇOĞULLANIR.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "11", unitMaterialQuality: "Vasat" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1, "AYNI metni üreten 2 taşınmaz TEK satırda birleşmeli.");
  assert.equal(
    qualityEntries[0].text,
    "A-5 ve A-8 No'lu taşınmazların lüks sınıf iç malzeme kalitesine sahip olmaları",
    "Birleşik atıflı metin: özne ÇOĞUL ('taşınmazların') VE sondaki iyelik eki ÇOĞUL ('olmaları', 'olması' DEĞİL) olmalı."
  );
  console.log("Aynı faktörü üreten taşınmazların TEK atıflı satırda (iyelik eki çoğul) birleşmesi testi tamam.");
}

// --- 5) YALNIZCA 1 taşınmazda tetiklenen faktör TEKİL atıfla (iyelik ----
// eki de TEKİL) görünür.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8", unitMaterialQuality: "Vasat" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1, "Yalnızca 1 taşınmazda tetiklenen faktör TEK satır üretmeli.");
  assert.equal(
    qualityEntries[0].text,
    "A-5 No'lu taşınmazın lüks sınıf iç malzeme kalitesine sahip olması",
    "Tekil atıf 'taşınmazın' (tekil genitif) + 'olması' (tekil iyelik eki) formunda olmalı."
  );
  console.log("Yalnızca 1 taşınmazda tetiklenen faktörün tekil atıfla (iyelik eki tekil) görünmesi testi tamam.");
}

// --- 6) "Taşınmazın " ile BAŞLAYAN metinlerde önek atıf öznesiyle -------
// DEĞİŞTİRİLİR VE sondaki iyelik eki de ÇOĞULLANIR (manzara örneği) —
// ÜÇÜNCÜ bir taşınmaz (unitViewStatus'u FARKLI/boş) BİLEREK eklendi ki
// grup TÜM taşınmazları KAPSAMASIN (bu senaryo 6b'de test ediliyor) ve
// etiket listesi (A-5 ve A-8) GERÇEKTEN gerekli/anlamlı kalsın.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitViewStatus: "Geniş Deniz Manzarası" }),
    unit({ titleBlockName: "A", unitNo: "8", unitViewStatus: "Geniş Deniz Manzarası" }),
    unit({ titleBlockName: "A", unitNo: "11" }), // unitViewStatus YOK -> tetiklenmez, grup TÜMÜNÜ kapsamaz
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const viewEntries = result.positive.filter((item) => item.id === "unit-view-positive");
  assert.equal(viewEntries.length, 1);
  assert.equal(
    viewEntries[0].text,
    "A-5 ve A-8 No'lu taşınmazların geniş deniz manzarasına sahip olmaları",
    "'Taşınmazın ' öneki atıf öznesiyle DEĞİŞTİRİLMELİ VE sondaki iyelik eki ('olması'->'olmaları') ÇOĞULLANMALI (grup TÜM taşınmazları KAPSAMADIĞINDAN etiketler GÖRÜNMELİ)."
  );
  console.log("'Taşınmazın ' oneki + iyelik eki cogullamasi (kismi grup, etiketli) testi tamam.");
}

// --- 6b) KULLANICI TAKİP TALEBİ (BİREBİR): grup RAPORDAKİ TÜM taşınmazları
// kapsıyorsa (A-5, A-8, A-11, A-15 HEPSİ aynı faktörü paylaşıyor) etiket
// LİSTELENMEZ, JENERİK "Taşınmazların ..." kullanılır.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", facades: "Güney, Batı" }),
    unit({ titleBlockName: "A", unitNo: "8", facades: "Kuzey, Doğu" }),
    unit({ titleBlockName: "A", unitNo: "11", facades: "Güney, Doğu" }),
    unit({ titleBlockName: "A", unitNo: "15", facades: "Kuzey, Batı" }),
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const facadeEntries = result.positive.filter((item) => item.id === "unit-multi-facade");
  assert.equal(facadeEntries.length, 1, "TÜM taşınmazlar AYNI 'İki yöne cepheli' metnini ürettiğinden TEK grup olmalı.");
  assert.equal(
    facadeEntries[0].text,
    "Taşınmazların iki yöne cepheli olmaları",
    "KULLANICI TAKİP TALEBİ: grup RAPORDAKİ TÜM taşınmazları (4/4) kapsadığından etiketler ('A-5, A-8, A-11 ve A-15 No'lu') LİSTELENMEMELİ, JENERİK 'Taşınmazların' kullanılmalı."
  );
  assert.ok(!facadeEntries[0].text.includes("No'lu"), "Tüm taşınmazları kapsayan grupta HİÇBİR etiket/No görünmemeli.");
  console.log("KULLANICI TAKIP TALEBININ BIREBIR REPRODUKSIYONU (tum tasinmazlari kapsayan grup -> jenerik 'Tasinmazlarin') testi tamam.");
}

// --- 7) Bir taşınmazda hiç tetiklenmeyen faktör o taşınmaz için hiç -----
// satır üretmez.
{
  const context = makeContext();
  withUnits(context, [
    unit({ titleBlockName: "A", unitNo: "5", unitMaterialQuality: "Lüks" }),
    unit({ titleBlockName: "A", unitNo: "8" }), // unitMaterialQuality YOK -> tetiklenmez
  ]);
  const baseInput = { fields: context.state.fields, tables: {}, disabledIds: [], manualPositive: [], manualNegative: [] };
  const result = context.calculateValueFactorsForAllTitleUnits(baseInput);
  const qualityEntries = result.positive.filter((item) => item.id === "unit-material-quality-high");
  assert.equal(qualityEntries.length, 1);
  assert.equal(qualityEntries[0].text, "A-5 No'lu taşınmazın lüks sınıf iç malzeme kalitesine sahip olması", "Yalnızca GERÇEKTEN tetiklenen taşınmaz (A-5) atfa dahil olmalı.");
  console.log("Tetiklenmeyen taşınmazın atfa dahil edilmemesi testi tamam.");
}

console.log("Deger etkileyen faktorler coklu tasinmaz (taşınmaz bazinda + Ana Yapi/Bolge cogullama) testleri basarili.");
