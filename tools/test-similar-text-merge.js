"use strict";

// "Benzer Metinleri Birleştir" (2026-08-26) — kullanıcı talebi: "uygunluk
// açıklaması normalde kullanıcının elle girdiği değerler yani manuel
// giriş yapıyor. örnek a2 2 oda hacmi birleştirilmiştir. a4 iki oda
// birleştirilmiştir birinde nokta var diğerinde yok bu insan hatası bunu
// metinlerin yüzde doksanı aynı ise ile bunu kastediyorum" — Proje
// Uygunluk Özeti tablosunun "Uygunluk Açıklaması" (projectConformity)
// sütununa, aynı anlama gelen ama insan hatası (noktalama/boşluk/büyük-
// küçük harf) yüzünden birebir eşleşmeyen metinleri TEK ortak metinde
// birleştiren bir başlık düğmesi ("≈") eklendi.
//
// Bu test kapsamı:
//  1) normalizeTextForSimilarityComparison(): noktalama/boşluk/büyük-
//     küçük harf/Türkçe karakter farkını YOK sayar (kullanıcının "nokta
//     var/yok" örneğini BİREBİR çözer).
//  2) levenshteinDistance()/computeTextSimilarityRatio(): bilinen
//     değerler + uç durumlar (iki boş metin -> 1, tamamen farklı -> düşük
//     oran).
//  3) findSimilarTitleUnitsSummaryTextGroups(): normalize sonrası birebir
//     aynı olan metinler TEK grupta; gerçekten FARKLI bir metin kendi
//     (döndürülmeyen, tek üyeli) grubunda kalır; boş değerler yok sayılır.
//  4) mergeSimilarTitleUnitsSummaryTextValues(): benzer grup yoksa uyarı
//     (alert) + hiçbir yazma yok; onay reddedilirse hiçbir yazma yok;
//     onaylanırsa HER grubun İLK üyesinin metni DİĞER üyelere yazılır (
//     kendine yazma YOK), TEK "bulk" Geri Al kaydı bırakılır, undoLastTableEdit()
//     bunu doğru tersine çevirir.
//  5) Kaynak-düzeyi kablolama: PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS'te
//     projectConformity `mergeSimilar: true`; buildTitleUnitsSummaryTableHtmlEditable
//     ".tus-merge-similar-btn"'i üretiyor; attachTitleUnitsSummaryTableEditing
//     tıklamayı mergeSimilarTitleUnitsSummaryTextValues'a bağlıyor;
//     styles.css'te buton stili tanımlı.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const cssSource = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

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

const sandboxSource = `
  let state = {};
  let confirmResult = true;
  let alertMessages = [];
  let commitCalls = [];
  let lastTableEditUndo = null;
  let suppressTableEditUndoRecording = false;
  const window = { confirm: () => confirmResult, alert: (msg) => { alertMessages.push(msg); } };
  function autosave() {}
  function renderSection() {}
  ${extractFunction("foldTurkish")}
  function getTitleUnitCount() { return 1 + (Array.isArray(state.titleUnits) ? state.titleUnits.length : 0); }
  function getTitleUnitFieldsForLabel(index) {
    if (index === state.activeTitleUnitIndex) return state.fields;
    if (index === 0) return state.primaryTitleUnitShadow?.fields || {};
    return state.titleUnits?.[index - 1]?.fields || {};
  }
  // commitTitleUnitsSummaryCellEdit'in TAM KENDİSİ burada test edilmiyor
  // (tools/test-title-units-summary-column-apply.js'in AYNI emsali) - spy
  // + basit yazma simülasyonu (undoLastTableEdit'in dogru calisabilmesi icin).
  function commitTitleUnitsSummaryCellEdit(fieldKey, rawValue, unitIndex) {
    commitCalls.push({ fieldKey, rawValue, unitIndex });
    const fields = getTitleUnitFieldsForLabel(unitIndex);
    if (fields) fields[fieldKey] = rawValue;
  }
  ${extractFunction("normalizeTextForSimilarityComparison")}
  ${extractFunction("levenshteinDistance")}
  ${extractFunction("computeTextSimilarityRatio")}
  ${extractFunction("findSimilarTitleUnitsSummaryTextGroups")}
  ${extractFunction("mergeSimilarTitleUnitsSummaryTextValues")}
  ${extractFunction("undoLastTableEdit")}
  return {
    setState: (s) => { state = s; },
    setConfirmResult: (v) => { confirmResult = v; },
    getAlertMessages: () => alertMessages,
    resetAlertMessages: () => { alertMessages = []; },
    getCommitCalls: () => commitCalls,
    resetCommitCalls: () => { commitCalls = []; },
    getLastUndo: () => lastTableEditUndo,
    normalizeTextForSimilarityComparison,
    levenshteinDistance,
    computeTextSimilarityRatio,
    findSimilarTitleUnitsSummaryTextGroups,
    mergeSimilarTitleUnitsSummaryTextValues,
    undoLastTableEdit,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

// --- 1) normalizeTextForSimilarityComparison() -----------------------------
{
  assert.equal(
    fns.normalizeTextForSimilarityComparison("iki oda birleştirilmiştir."),
    fns.normalizeTextForSimilarityComparison("iki oda birleştirilmiştir"),
    "Kullanicinin ornegi: sonda nokta olan/olmayan AYNI normalize sonucunu vermeli."
  );
  assert.equal(
    fns.normalizeTextForSimilarityComparison("İKİ ODA BİRLEŞTİRİLMİŞTİR"),
    fns.normalizeTextForSimilarityComparison("iki oda birleştirilmiştir"),
    "Buyuk/kucuk harf ve Turkce karakter farki (foldTurkish) yok sayilmali."
  );
  assert.equal(
    fns.normalizeTextForSimilarityComparison("iki   oda  birleştirilmiştir"),
    fns.normalizeTextForSimilarityComparison("iki oda birleştirilmiştir"),
    "Fazla bosluklar tek bosluğa indirgenmeli."
  );
  console.log("normalizeTextForSimilarityComparison() testi tamam.");
}

// --- 2) levenshteinDistance() / computeTextSimilarityRatio() --------------
{
  assert.equal(fns.levenshteinDistance("kitten", "sitting"), 3, "Bilinen Levenshtein degeri (kitten->sitting) 3 olmali.");
  assert.equal(fns.levenshteinDistance("", ""), 0, "Iki bos metin arasi mesafe 0 olmali.");
  assert.equal(fns.levenshteinDistance("abc", ""), 3, "Bos metne mesafe, digerinin uzunlugu olmali.");
  assert.equal(fns.computeTextSimilarityRatio("aynı metin", "aynı metin"), 1, "Birebir ayni metinlerin orani 1 olmali.");
  assert.equal(fns.computeTextSimilarityRatio("", ""), 1, "Iki bos metin 'ayni' (1) sayilmali (cokme yok guvenlik agi).");
  assert.ok(fns.computeTextSimilarityRatio("iki oda birleştirilmiştir", "üç kat farklı bir şey") < 0.5, "Tamamen farkli metinlerin orani dusuk olmali.");
  console.log("levenshteinDistance()/computeTextSimilarityRatio() testi tamam.");
}

// --- 3) findSimilarTitleUnitsSummaryTextGroups() ---------------------------
{
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { projectConformity: "İki oda birleştirilmiştir." },
    titleUnits: [
      { fields: { projectConformity: "iki oda birleştirilmiştir" } }, // ayni (nokta farki) -> AYNI grup
      { fields: { projectConformity: "" } }, // bos -> yok sayilir
      { fields: { projectConformity: "Balkon kapatılmıştır." } }, // TAMAMEN farkli -> kendi (tekil) grubunda kalir, DONMEZ
    ],
  });
  const groups = fns.findSimilarTitleUnitsSummaryTextGroups("projectConformity", 0.9);
  assert.equal(groups.length, 1, `Yalnizca 2+ uyeli (gercekten birlesecek) grup(lar) donmeli, bulunan: ${groups.length}`);
  assert.equal(groups[0].members.length, 2, "Nokta farkli 2 metin AYNI grupta olmali.");
  assert.equal(groups[0].canonicalValue, "İki oda birleştirilmiştir.", "Grubun temsilcisi ILK (en dusuk index) taşınmazın ORIJINAL metni olmali.");
  assert.deepEqual(groups[0].members.map((m) => m.unitIndex).sort(), [0, 1], "Grup dogru 2 tasinmazi (0 ve 1) icermeli.");
  console.log("findSimilarTitleUnitsSummaryTextGroups() testi tamam.");
}

// --- 4) mergeSimilarTitleUnitsSummaryTextValues() --------------------------
{
  // 4a) Benzer grup YOKSA -> uyari (alert), hicbir yazma yok.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { projectConformity: "Balkon kapatılmıştır." },
    titleUnits: [{ fields: { projectConformity: "Çatı katı ilave edilmiştir." } }],
  });
  fns.resetAlertMessages();
  fns.resetCommitCalls();
  fns.mergeSimilarTitleUnitsSummaryTextValues("projectConformity", "Uygunluk Açıklaması");
  assert.equal(fns.getCommitCalls().length, 0, "Benzer grup yoksa hicbir yazma olmamali.");
  assert.equal(fns.getAlertMessages().length, 1, "Benzer grup yoksa kullaniciya bir uyari (alert) gosterilmeli.");
  console.log("mergeSimilarTitleUnitsSummaryTextValues: benzer grup yok -> uyari testi tamam.");

  // 4b) Benzer grup VAR ama onay REDDEDILIRSE -> hicbir yazma yok.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { projectConformity: "İki oda birleştirilmiştir." },
    titleUnits: [{ fields: { projectConformity: "iki oda birleştirilmiştir" } }],
  });
  fns.setConfirmResult(false);
  fns.resetCommitCalls();
  fns.mergeSimilarTitleUnitsSummaryTextValues("projectConformity", "Uygunluk Açıklaması");
  assert.equal(fns.getCommitCalls().length, 0, "Onay reddedilirse hicbir yazma olmamali.");
  console.log("mergeSimilarTitleUnitsSummaryTextValues: onay reddedilince no-op testi tamam.");

  // 4c) Onaylanirsa -> grubun ILK uyesinin metni DIGER uyelere yazilir
  // (kendine yazma YOK, zaten ayni), TEK 'bulk' Geri Al kaydi birakilir.
  fns.setState({
    activeTitleUnitIndex: 0,
    fields: { projectConformity: "İki oda birleştirilmiştir." },
    titleUnits: [
      { fields: { projectConformity: "iki oda birleştirilmiştir" } },
      { fields: { projectConformity: "Balkon kapatılmıştır." } }, // farkli, ETKILENMEMELI
    ],
  });
  fns.setConfirmResult(true);
  fns.resetCommitCalls();
  fns.mergeSimilarTitleUnitsSummaryTextValues("projectConformity", "Uygunluk Açıklaması");
  const calls = fns.getCommitCalls();
  assert.equal(calls.length, 1, `Yalnizca DIGER (kendisi degil) grup uyesine yazilmali, bulunan cagri sayisi: ${calls.length}`);
  assert.equal(calls[0].unitIndex, 1, "Yazma hedefi grubun IKINCI uyesi (index 1) olmali.");
  assert.equal(calls[0].rawValue, "İki oda birleştirilmiştir.", "Yazilan metin grubun ILK uyesinin ORIJINAL metni olmali.");

  const undo = fns.getLastUndo();
  assert.ok(undo, "Birlestirme sonrasi lastTableEditUndo dolu olmali.");
  assert.equal(undo.type, "bulk", "'bulk' turunde TEK bir kayit birakilmali.");
  assert.equal(undo.fieldKey, "projectConformity");
  assert.deepEqual(undo.previousValues, [{ unitIndex: 1, value: "iki oda birleştirilmiştir" }], "Onceki (uzerine yazilmadan ONCEki) deger dogru kaydedilmeli.");
  console.log("mergeSimilarTitleUnitsSummaryTextValues: onaylanirsa dogru yazma + tek 'bulk' Geri Al kaydi testi tamam.");

  // 4d) undoLastTableEdit(): eski metni geri yukler, kayit tek adimli temizlenir.
  fns.undoLastTableEdit();
  const restoreCalls = fns.getCommitCalls().slice(1);
  assert.equal(restoreCalls.length, 1, "Geri al TEK etkilenen satiri eski degerine dondurmeli.");
  assert.deepEqual({ unitIndex: restoreCalls[0].unitIndex, rawValue: restoreCalls[0].rawValue }, { unitIndex: 1, rawValue: "iki oda birleştirilmiştir" }, "Geri al cagrisi ESKI metni dogru satira yazmali.");
  assert.equal(fns.getLastUndo(), null, "Geri al TEK ADIMLI - kendisi bir daha geri alinamamali.");
  console.log("mergeSimilarTitleUnitsSummaryTextValues + undoLastTableEdit(): geri alma testi tamam.");
}

// --- 5) Kaynak-düzeyi kablolama --------------------------------------------
{
  const fieldDefsSrc = appSource.slice(
    appSource.indexOf("const PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS = ["),
    appSource.indexOf("];", appSource.indexOf("const PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS = ["))
  );
  assert.ok(
    fieldDefsSrc.includes('{ key: "projectConformity", label: "Uygunluk Açıklaması", kind: "scalar", mergeSimilar: true }'),
    "PROJECT_SUITABILITY_UNITS_TABLE_FIELD_DEFS'te projectConformity 'mergeSimilar: true' ile isaretli olmali."
  );

  const editableSrc = extractFunction("buildTitleUnitsSummaryTableHtmlEditable");
  assert.match(
    editableSrc,
    /meta\?\.mergeSimilar\s*\n\s*\?\s*`<button type="button" class="tus-merge-similar-btn"/,
    "buildTitleUnitsSummaryTableHtmlEditable 'mergeSimilar' isaretli sutunlar icin '.tus-merge-similar-btn' butonu uretmiyor."
  );

  const attachSrc = extractFunction("attachTitleUnitsSummaryTableEditing");
  assert.match(
    attachSrc,
    /container\.querySelectorAll\("\.tus-merge-similar-btn"\)\.forEach\(\(button\) => \{[\s\S]{0,200}mergeSimilarTitleUnitsSummaryTextValues\(button\.dataset\.fieldKey, button\.dataset\.columnLabel\)/,
    "attachTitleUnitsSummaryTableEditing '.tus-merge-similar-btn' tiklamalarini mergeSimilarTitleUnitsSummaryTextValues'a baglamiyor."
  );

  assert.ok(cssSource.includes(".tus-merge-similar-btn {"), "styles.css'te '.tus-merge-similar-btn' stili tanimli olmali.");
  console.log("Kaynak-duzeyi kablolama (field def + buton + CSS) testi tamam.");
}

console.log("Benzer Metinleri Birlestir testleri basarili.");
