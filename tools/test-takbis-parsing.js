// TAKBİS ayrıştırma regresyon testleri (2026-07-07 oturumu düzeltmeleri).
// app.js tarayıcı scripti olduğundan ilgili saf fonksiyonlar kaynak metinden
// çıkarılıp sandbox'ta değerlendirilir. Kapsanan hatalar:
//  1) 2 haneli yevmiye no ("02-01-2026 - 33") atlanıyordu.
//  2) "Kamu Haczi" tipi (katlanınca HACZI) haciz sayılmıyor, tutarı okunmuyordu.
//  3) "İhtiyati Tedbir" şerhi ihtiyati haciz olarak sınıflanıyordu.
//  4) Tarihsiz beyanlar fallback ile şablon/etiket tarihini tesis tarihi sanıyordu.
//  5) Aynı malikin (aynı SN) birden çok hisse kaydı toplanmıyordu.
//  6) Yevmiye no'su tutar metnine karışınca trilyonluk sahte tutarlar üretiliyordu
//     ("Borç : 4101 2000000 TL" → 41 milyar); yevmiye kaynak metinden ayıklanır.
//  7) Satır sarmasında sola taşan "Haciz Yazısı..." kelimesi Rehin tipi üretip
//     kaydı ortadan bölüyordu; yalnızca gerçek Ş/B/İ etiketi kayıt başlatır.
//  8) EKLENTİ BİLGİLERİ bölümü Tapu ve Mülkiyet alanına aktarılmak üzere okunur.

const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  if (start < 0) throw new Error(`Fonksiyon bulunamadı: ${name}`);
  let index = appSource.indexOf("{", start);
  let depth = 0;
  for (; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(start + 1, index + 1);
    }
  }
  throw new Error(`Fonksiyon gövdesi kapanmadı: ${name}`);
}

const functionNames = [
  "normalizeSlash",
  "cleanTakbisValue",
  "foldTurkish",
  "toTitleCaseTr",
  "gcdBigInt",
  "sumOwnerFractionsBigInt",
  "cleanTakbisAnnotationType",
  "normalizeTakbisAnnotationReportType",
  "isTakbisLienType",
  "extractTakbisEncumbranceDateInfo",
  "sanitizeTakbisEncumbranceDateFallbackText",
  "mergeTakbisSameOwnerShares",
  "findTakbisAcquisitionToken",
  "isTakbisSbiStartType",
  "stripTakbisJournalNoFromAmountSource",
  "extractTakbisLienAmount",
  "extractTakbisDebtToCurrencyAmount",
  "extractTakbisDebtWindowAmount",
  "extractTakbisCurrencyLeftWindowAmount",
  "extractTakbisDebtLabelAmount",
  "extractTakbisLabeledLienAmount",
  "extractTakbisCurrencyNearbyAmount",
  "extractTakbisPowerQueryLienAmount",
  "extractTakbisIleCurrencyAmount",
  "extractTakbisMoneyCandidate",
  "formatTakbisTurkishMoney",
  "isLikelyTakbisLienAmount",
  "isTakbisDebtLabelAmount",
  "getTakbisNumericPieces",
  "parseTakbisSmartNumber",
  "hasTakbisDecimalPart",
  "parseTakbisAttachments",
  "normalizeTakbisAttachmentType",
  "formatTakbisAttachmentsForReport",
];

const sandboxSource = `${functionNames.map(extractFunction).join("\n")}\nreturn { ${functionNames.join(", ")} };`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  assert(
    String(actual) === String(expected),
    `${label}: beklenen "${expected}", gelen "${actual}"`,
  );
}

// 1) 2 haneli yevmiye: tarihe bitişik tire sonrası kabul edilir.
let info = fns.extractTakbisEncumbranceDateInfo("Bayrampaşa - 02-01-2026 13:18 - 33");
assertEqual(info.date, "02.01.2026", "2 haneli yevmiye tarih");
assertEqual(info.journalNo, "33", "2 haneli yevmiye no");

// 1b) Klasik 5 haneli yevmiye değişmedi.
info = fns.extractTakbisEncumbranceDateInfo("Bayrampaşa - 07-08-2024 09:29 - 14107");
assertEqual(info.date, "07.08.2024", "klasik yevmiye tarih");
assertEqual(info.journalNo, "14107", "klasik yevmiye no");

// 1c) İçerik sayıları ("Ada - 8 Parsel") yevmiye sanılmaz; uzun sayı tercih edilir.
info = fns.extractTakbisEncumbranceDateInfo("Uşak - 21-05-2026 - Ada - 8 Parsel YAŞAR Oğlu TL 14:58 - 21353");
assertEqual(info.journalNo, "21353", "içerik sayısı yevmiye sanılmamalı");

// 2) Kamu Haczi haciz tipidir (katlama HACZI üretir); tutar okuma zinciri açılır.
assert(fns.isTakbisLienType("Kamu Haczi"), "Kamu Haczi haciz tipi sayılmalı");
assert(fns.isTakbisLienType("İcrai Haciz"), "İcrai Haciz haciz tipi sayılmalı");
assert(fns.isTakbisLienType("İhtiyati Haciz"), "İhtiyati Haciz haciz tipi sayılmalı");
assert(!fns.isTakbisLienType("İhtiyati Tedbir"), "İhtiyati Tedbir haciz tipi sayılmamalı");
assertEqual(
  fns.normalizeTakbisAnnotationReportType("Kamu Haczi", "KOCAELİ MERKEZ İZMİT S.G.M. nin yazıları ile. Borç : 213160 TL (Alacaklı : SGK )"),
  "Kamu Haczi",
  "Kamu Haczi sınıflaması",
);

// 3) İhtiyati Tedbir şerhi ihtiyati haciz olarak sınıflanmaz.
assertEqual(
  fns.normalizeTakbisAnnotationReportType("İhtiyati Tedbir", "BURSA 7.SULH HUKUK MAHKEMESİ nin 23/12/2025 tarih 2025/1923 ESAS sayılı Mahkeme Müzekkeresi (Açıklama: vesayet tedbir şerhi vardır. )"),
  "İhtiyati Tedbir",
  "İhtiyati Tedbir sınıflaması",
);
assertEqual(
  fns.normalizeTakbisAnnotationReportType("", "İhtiyati Tedbir: mahkeme kararı ile haciz yazısı gereği tedbir konulmuştur"),
  "İhtiyati Tedbir",
  "açıklamada haciz geçen tedbir yine tedbirdir",
);
assertEqual(
  fns.normalizeTakbisAnnotationReportType("", "İhtiyati Haciz: icra dairesi yazısı"),
  "İhtiyati Haciz",
  "gerçek ihtiyati haciz korunmalı",
);
assertEqual(
  fns.normalizeTakbisAnnotationReportType("Şerh", "İcrai Haciz : Bakırköy Banka Alacakları İcra Dairesi nin Haciz Yazısı"),
  "İcrai Haciz",
  "icrai haciz sınıflaması korunmalı",
);

// 4) Tarihsiz beyan: şablon/etiket tarihleri tesis tarihi değildir.
const sanitized = fns.sanitizeTakbisEncumbranceDateFallbackText(
  "Beyan YÖNETİM PLANI : 17/07/1981( Şablon: Yönetim Planının Belirtilmesi)",
);
info = fns.extractTakbisEncumbranceDateInfo(sanitized);
assertEqual(info.date, "", "tarihsiz beyan tarih boş kalmalı");
assertEqual(info.journalNo, "", "tarihsiz beyan yevmiye boş kalmalı");

// 4b) Gerçek tesis tarihli hacizlerde fallback bozulmaz.
info = fns.extractTakbisEncumbranceDateInfo(fns.sanitizeTakbisEncumbranceDateFallbackText(
  "Serh İcrai Haciz : İcra Dairesi nin 06/08/2024 tarih sayılı yazıları ile 07-08-2024 09:29 - 14107",
));
assertEqual(info.date, "07.08.2024", "haciz fallback tarihi korunmalı");
assertEqual(info.journalNo, "14107", "haciz fallback yevmiyesi korunmalı");

// 5) Aynı SN'li malik kayıtları toplanır (Uşak senaryosu).
const merged = fns.mergeTakbisSameOwnerShares([
  { name: "Servet Ünal", sn: "162271173", share: "1613/7274" },
  { name: "Semra Aydın", sn: "162271324", share: "6453/29096" },
  { name: "Ahmet Ünal", sn: "162271365", share: "4037/14548" },
  { name: "Servet Ünal", sn: "162271173", share: "8117/87288" },
  { name: "Semra Aydın", sn: "162271324", share: "8117/87288" },
  { name: "Ahmet Ünal", sn: "162271365", share: "8117/87288" },
]);
assertEqual(merged.length, 3, "malik birleştirme sayısı");
assertEqual(merged[0].share, "27473/87288", "Servet Ünal toplam hisse");
assertEqual(merged[1].share, "6869/21822", "Semra Aydın toplam hisse");
assertEqual(merged[2].share, "32339/87288", "Ahmet Ünal toplam hisse");
const total = fns.sumOwnerFractionsBigInt(merged.map((owner) => owner.share));
assert(total && total.numerator === total.denominator, "malik hisse toplamı 1/1 olmalı");

// 5b) SN yoksa veya adlar farklıysa birleştirme yapılmaz.
assertEqual(fns.mergeTakbisSameOwnerShares([
  { name: "Ali Veli", sn: "", share: "1/2" },
  { name: "Ali Veli", sn: "", share: "1/2" },
]).length, 2, "SN'siz kayıtlar birleşmemeli");
assertEqual(fns.mergeTakbisSameOwnerShares([
  { name: "Ali Veli", sn: "1", share: "1/2" },
  { name: "Ayşe Fatma", sn: "1", share: "1/2" },
]).length, 2, "farklı adlı kayıtlar birleşmemeli");

// 5c) Edinme sebebi: hisse oranlarının düzeltilmesi tanınır; Satış önceliği korunur.
assertEqual(
  fns.findTakbisAcquisitionToken("SERVET ÜNAL : 16200118 Mülkiyet ve Hisse Oranlarının Düzeltilmesi 13-02-2026 6991"),
  "Mülkiyet ve Hisse Oranlarının Düzeltilmesi",
  "hisse düzeltme edinme sebebi",
);
assertEqual(fns.findTakbisAcquisitionToken("Satış 09-09-2009 15725"), "Satış", "satış edinme sebebi korunmalı");

// 6) Yevmiye no'su tutar metnine karışması (tkb.pdf gerçek örnekleri).
const stripAndExtract = (text, journal) => fns.extractTakbisLienAmount(fns.stripTakbisJournalNoFromAmountSource(text, journal));
assertEqual(
  stripAndExtract("sayılı Haciz Yazısı sayılı yazıları ile. Borç : 4101 2000000 TL . (Alacaklı : Univar )", "4101"),
  "2.000.000,00 TL",
  "yevmiye tutar önünde: sahte 41 milyar üretilmemeli",
);
assertEqual(
  stripAndExtract("sayılı Haciz Yazısı sayılı yazıları ile. Borç : 4500000 11760 TL . (Alacaklı : Enabir Koç )", "11760"),
  "4.500.000,00 TL",
  "yevmiye tutar arkasında: tutar korunmalı",
);
assertEqual(
  stripAndExtract("Haciz Yazısı sayılı yazıları ile 3065743.03 10085 TL bedel ile Alacaklı : Veser Kimyevi", "10085"),
  "3.065.743,03 TL",
  "bedel + yevmiye bitişik: tutar korunmalı",
);
assertEqual(
  stripAndExtract("yazıları ile. Borç : 2365658.39 TL .", "4650"),
  "2.365.658,39 TL",
  "yevmiye metinde yokken davranış değişmemeli",
);
assertEqual(
  fns.stripTakbisJournalNoFromAmountSource("Borç : 11760.00 TL", "11760"),
  "Borç : 11760.00 TL",
  "ondalıklı tutarın parçası ayıklanmamalı",
);

// 7) Yalnızca gerçek Ş/B/İ etiketleri kayıt başlatır.
assert(fns.isTakbisSbiStartType("Beyan") && fns.isTakbisSbiStartType("Şerh") && fns.isTakbisSbiStartType("İrtifak"), "Ş/B/İ etiketleri kayıt başlatmalı");
assert(!fns.isTakbisSbiStartType("Rehin") && !fns.isTakbisSbiStartType("İpotek") && !fns.isTakbisSbiStartType(""), "Rehin/İpotek çıkarımı şerh bölümünde kayıt başlatmamalı");

// 8) Eklenti bölümü okunur ve rapor alanı için sadeleştirilir.
const attachments = fns.parseTakbisAttachments([
  { text: "EKLENTİ BİLGİLERİ" },
  { text: "Sistem No Tip Tanım Tesis Kurum Tarih-Yevmiye" },
  { text: "4852346 Komurluk EKLENTİSİ : 11 NOLU KÖMÜRLÜK" },
  { text: "MÜLKİYET BİLGİLERİ" },
]);
assertEqual(attachments.length, 1, "eklenti kayıt sayısı");
assertEqual(attachments[0].systemNo, "4852346", "eklenti sistem no");
assertEqual(attachments[0].type, "Kömürlük", "eklenti tipi");
assertEqual(attachments[0].description, "11 NOLU KÖMÜRLÜK", "eklenti tanımı");
assertEqual(
  fns.formatTakbisAttachmentsForReport(attachments),
  "Kömürlük: 11 NOLU KÖMÜRLÜK",
  "eklenti rapor alanı",
);

console.log("TAKBİS ayrıştırma regresyon testi tamam.");
