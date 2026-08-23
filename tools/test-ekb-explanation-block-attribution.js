"use strict";

// EKB Açıklaması (ekbExplanation) — blok atıflı cümle üretimi (2026-08-23).
// Kullanıcı talebi: "burada incelenen belgelerde ortak açıklama mantığı
// vardı EKB de de aynısı olmalı" — buildEkbExplanation() artık isteğe
// bağlı bir `blockAttribution` ("A Blok'a ait" gibi) parametresi kabul
// ediyor; verilmezse (mevcut/tüm eski çağrı noktaları) DAVRANIŞ BİREBİR
// AYNI kalıyor. Blok-bazlı gruplama mantığının kendisi (hangi blokların
// "bulundu"/"bulunamadı" sayıldığı, tools/test-documents-block-description.js'te
// (buildEkbExplanationParts, gözlemlenebilir stub'la) test ediliyor — bu
// dosya SADECE buildEkbExplanation()'ın GERÇEK cümle metnini (blok atıflı
// ve atıfsız) ve stripEkbExplanationFromReviewedDocumentsText()'in YENİ
// blok-atıflı "bulunamamıştır" varyantını doğru sildiğini kapsar.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = appSource.indexOf(`\n${marker}`);
  assert(start >= 0, `Fonksiyon bulunamadı: ${name}`);
  const parenStart = appSource.indexOf("(", start);
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < appSource.length; cursor += 1) {
    const char = appSource[cursor];
    if (char === "(") parenDepth += 1;
    if (char === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) break;
    }
  }
  let index = appSource.indexOf("{", cursor);
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
  "getEkbInspectionDateIso",
  "getEkbInspectionLead",
  "buildEkbExplanation",
  "stripEkbExplanationFromReviewedDocumentsText",
];

// Metin normalizasyonu bu testin kapsamı DEĞİL (mevcut/değişmeyen kod) —
// diğer test dosyalarındaki AYNI kimlik (identity) stub deseni (bkz.
// test-documents-block-description.js).
const sandboxSource = `
  let state = {};
  function normalizeYesNoChoice(value) {
    const text = String(value || "").trim();
    return text === "Evet" || text === "Hayır" ? text : "";
  }
  function dateTrToIso(value) {
    const m = String(value || "").match(/^(\\d{2})\\.(\\d{2})\\.(\\d{4})$/);
    return m ? \`\${m[3]}-\${m[2]}-\${m[1]}\` : "";
  }
  function dateIsoToTr(value) { return String(value || ""); }
  function toTitleFieldUppercase(value) { return String(value || "").toUpperCase(); }
  function normalizeReportTitleText(value) { return String(value || ""); }
  function normalizeReportDescriptionText(value) { return String(value || "").replace(/\\s+/g, " ").trim(); }
  ${functionNames.map(extractFunction).join("\n")}
  return {
    setState: (s) => { state = s; },
    getState: () => state,
    getEkbInspectionLead,
    buildEkbExplanation,
    stripEkbExplanationFromReviewedDocumentsText,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) buildEkbExplanation(): parametresiz çağrı (mevcut TÜM çağrı ------
// noktalarının kullandığı yol) — TAM OLARAK ESKİ metni üretmeli (regresyon) -
{
  // 1a) hasEkb: Hayır -> blok atıfsız "taşınmaza ait" YOK, genel cümle.
  fns.setState({ fields: { hasEkb: "Hayır", appointmentDate: "" } });
  assert.equal(
    fns.buildEkbExplanation(),
    "İnceleme tarihinde EKB sistemi, E Devlet, resmi kurumlar ve saha araştırması sonucunda taşınmaza ait Enerji Kimlik Belgesi bulunamamıştır.",
    "hasEkb Hayır + boş randevu tarihi -> 'İnceleme tarihinde' varsayılan önekiyle genel cümle üretmeli."
  );

  // 1b) hasEkb: Evet + belge no/tarih/sınıf dolu -> "Konu taşınmazın yer
  // aldığı binaya ait ..." (blok atıfsız, ESKİ metin BİREBİR).
  fns.setState({ fields: {
    hasEkb: "Evet", appointmentDate: "10.03.2026",
    ekbDocumentNo: "abc-123", ekbIssueDate: "01.01.2025", ekbValidUntil: "01.01.2035", ekbEnergyClass: "B",
  } });
  const found = fns.buildEkbExplanation();
  assert.ok(found.includes("Konu taşınmazın yer aldığı binaya ait"), `Blok atıfsız (tekil) 'found' cümlesi ESKİ önekiyle başlamalı, bulunan: ${found}`);
  assert.ok(found.includes("ABC-123 belge numaralı"), `Belge no büyük harfe çevrilip cümleye eklenmeli, bulunan: ${found}`);
  assert.ok(found.includes("enerji performans sınıfı B sınıfıdır"), `Enerji sınıfı cümlesi eklenmeli, bulunan: ${found}`);
  assert.ok(found.includes("taşınmazın yer aldığı binanın enerji performans sınıfı"), `Blok atıfsızken enerji-sınıfı cümlesi de ESKİ 'taşınmazın yer aldığı binanın' ifadesini kullanmalı, bulunan: ${found}`);

  console.log("buildEkbExplanation() parametresiz cagri (regresyon, ESKI metin BIREBIR) testi tamam.");
}

// --- 2) buildEkbExplanation(fields, blockAttribution): blok atıflı YENİ --
// varyant — "found" ve "expired" cümlelerinde "Konu taşınmazın yer aldığı
// binaya ait"/"taşınmazın yer aldığı binanın" yerine atıf ifadesi geçmeli -
{
  // 2a) "found" (geçerli EKB) + blok atıfı.
  const foundFields = { hasEkb: "Evet", appointmentDate: "10.03.2026", ekbDocumentNo: "xyz-9", ekbIssueDate: "01.01.2025", ekbValidUntil: "01.01.2035", ekbEnergyClass: "A" };
  fns.setState({ fields: { appointmentDate: "10.03.2026" } }); // getEkbInspectionDateIso hâlâ state.fields.appointmentDate okur (rapor-geneli paylaşımlı)
  const foundWithBlock = fns.buildEkbExplanation(foundFields, "A Blok'a ait");
  assert.ok(foundWithBlock.startsWith("İnceleme tarihinde") === false, "sanity: found cumlesi inceleme tarihi onekiyle BASLAMAZ (sadece 'bulunamadi' cumlesi baslar).");
  assert.ok(foundWithBlock.includes("A Blok'a ait binaya ait"), `Blok atifli 'found' cumlesi 'A Blok'a ait binaya ait' ifadesini icermeli, bulunan: ${foundWithBlock}`);
  assert.ok(!foundWithBlock.includes("Konu taşınmazın yer aldığı"), `Blok atifi VERILDIGINDE eski jenerik onek ARTIK gorunmemeli, bulunan: ${foundWithBlock}`);
  assert.ok(foundWithBlock.includes("A Blok'a ait binanın enerji performans sınıfı A sınıfıdır"), `Enerji sinifi cumlesi de blok atifini kullanmali, bulunan: ${foundWithBlock}`);

  // 2b) "expired" (süresi dolmuş EKB) + blok atıfı.
  const expiredFields = { hasEkb: "Evet", ekbIssueDate: "01.01.2010", ekbValidUntil: "01.01.2015" };
  fns.setState({ fields: { appointmentDate: "10.03.2026" } });
  const expiredWithBlock = fns.buildEkbExplanation(expiredFields, "B Blok'a ait");
  assert.ok(expiredWithBlock.includes("B Blok'a ait"), `Blok atifli 'expired' cumlesi 'B Blok'a ait' ifadesini icermeli, bulunan: ${expiredWithBlock}`);
  assert.ok(!expiredWithBlock.includes("taşınmaza ait"), `Blok atifi VERILDIGINDE eski 'tasinmaza ait' ifadesi ARTIK gorunmemeli, bulunan: ${expiredWithBlock}`);
  assert.ok(expiredWithBlock.includes("son geçerlilik tarihi sona erdiği"), "Sure-dolmus aciklamasi hala yer almali.");

  console.log("buildEkbExplanation(fields, blockAttribution) blok atifli varyant testi tamam.");
}

// --- 3) buildEkbExplanation(): elle seçim korunuyor mu (manuel-degistirme --
// koruma ilkesiyle CELISMEZ - bu fonksiyon zaten HER ZAMAN mevcut veriden
// yeniden hesaplar, "manuel" bir depolama yok - sadece hasEkb bos/gecersizse
// bos donmesi test edilir) --------------------------------------------------
{
  fns.setState({ fields: { hasEkb: "", appointmentDate: "" } });
  assert.equal(fns.buildEkbExplanation(), "", "hasEkb bos/belirsizken bos string donmeli (zorla bir varsayim yapilmamali).");
  console.log("buildEkbExplanation() bos/belirsiz hasEkb -> bos donus testi tamam.");
}

// --- 4) stripEkbExplanationFromReviewedDocumentsText(): YENİ blok-atıflı --
// "bulunamamıştır" varyantını da (eski "taşınmaza ait" varyantının YANINDA)
// doğru siliyor mu -----------------------------------------------------------
{
  const legacyText = "Bazı ilgisiz cümle. İnceleme tarihinde EKB sistemi, E Devlet, resmi kurumlar ve saha araştırması sonucunda taşınmaza ait Enerji Kimlik Belgesi bulunamamıştır. Başka bir ilgisiz cümle.";
  const stripped1 = fns.stripEkbExplanationFromReviewedDocumentsText(legacyText);
  assert.ok(!stripped1.includes("Enerji Kimlik Belgesi bulunamamıştır"), `Eski (blok atifsiz) 'bulunamamistir' cumlesi silinmeli, bulunan: ${stripped1}`);
  assert.ok(stripped1.includes("Bazı ilgisiz cümle") && stripped1.includes("Başka bir ilgisiz cümle"), "Ilgisiz cumleler KORUNMALI.");

  const blockText = "Bazı ilgisiz cümle. İnceleme tarihinde EKB sistemi, E Devlet, resmi kurumlar ve saha araştırması sonucunda B ve C Blok'a ait Enerji Kimlik Belgesi bulunamamıştır. Başka bir ilgisiz cümle.";
  const stripped2 = fns.stripEkbExplanationFromReviewedDocumentsText(blockText);
  assert.ok(!stripped2.includes("Enerji Kimlik Belgesi bulunamamıştır"), `YENI (blok atifli) 'bulunamamistir' cumlesi de silinmeli, bulunan: ${stripped2}`);
  assert.ok(stripped2.includes("Bazı ilgisiz cümle") && stripped2.includes("Başka bir ilgisiz cümle"), "Ilgisiz cumleler KORUNMALI (blok-atifli varyantta da).");

  console.log("stripEkbExplanationFromReviewedDocumentsText blok-atifli varyant testi tamam.");
}

console.log("EKB Aciklamasi blok-atifli cumle uretimi testleri basarili.");
