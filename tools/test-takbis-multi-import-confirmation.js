// TAKBİS çoklu-kayıt tespiti: "Rapora Aktar / Vazgeç" onay paneli
// gerçekten devreye girsin (2026-08-15). Kullanıcının kendi gerçek
// dosyalarıyla (TAKBİS PDF + 3 KML, ZRT-202606006) canlı test sırasında
// bulundu ve kullanıcı onayıyla düzeltildi: processTakbisUpload() çoklu
// kayıt tespit edince importTakbisRecordsIntoTitleUnits()'i DOĞRUDAN
// çağırıyordu — pendingMultiTakbisImport'u yalnızca null'a set ediyordu,
// HİÇ gerçek değerle doldurmuyordu. Bu yüzden zaten var olan (ve render()'da
// doğru koşulla gösterilen) createMultiTakbisPendingImportPanel() "Rapora
// Aktar / Vazgeç" onay ekranı HİÇBİR ZAMAN tetiklenmiyordu — birden fazla
// taşınmaz kaydı kullanıcıya SORULMADAN, birincil taşınmazın mevcut Tapu
// ve Mülkiyet/Takyidat verisinin üzerine SESSİZCE yazılıyordu.
//
// Bu test kapsamı: processTakbisUpload() DOM/pdf.js bağımlı olduğundan
// (bkz. handoff 0.0.386 notu) tam entegrasyon sandbox'ta test edilemez —
// readMultiTakbisPdf/processTakbisFile/importTakbisRecordsIntoTitleUnits
// HAFİF STUB'larla değiştirilip yalnızca KONTROL AKIŞI (hangi durumda
// hangi fonksiyon çağrılıyor / pendingMultiTakbisImport ne oluyor)
// doğrulanır — tıpkı tools/test-title-unit-import.js'in aynı fonksiyonlar
// için kullandığı YÖNTEM.
//
//  1) Tek dosya, probe >1 kayıt bulur -> pendingMultiTakbisImport DOLAR
//     (sourceFile dahil), importTakbisRecordsIntoTitleUnits VE
//     processTakbisFile HİÇ ÇAĞRILMAZ (asıl regresyon testi).
//  2) Tek dosya, probe tam 1 kayıt bulur -> processTakbisFile'a düşülür,
//     pendingMultiTakbisImport null kalır.
//  3) Tek dosya, probe hata fırlatır -> processTakbisFile'a düşülür.
//  4) Birden fazla dosya, hepsi okunur -> pendingMultiTakbisImport TÜM
//     kayıtları DOLAR, importTakbisRecordsIntoTitleUnits ÇAĞRILMAZ.
//  5) Birden fazla dosya, hepsi başarısız -> hata fırlatılır.
//  6) Önceki (yanıtlanmamış) bir pendingMultiTakbisImport, YENİ bir
//     yükleme başında bayat kalmadan temizlenir.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const appSource = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

// "async function processTakbisUpload(" ile eşleşsin diye AYRI bir marker.
function extractAsyncFunction(name) {
  const marker = `async function ${name}(`;
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

const processTakbisUploadBody = extractAsyncFunction("processTakbisUpload");

// --- 0) Kaynak-düzeyi: processTakbisUpload artık importTakbisRecordsIntoTitleUnits'i
// DOĞRUDAN çağırmıyor (asıl regresyon — eski hata BUYDU) ------------------
{
  assert.ok(
    !/importTakbisRecordsIntoTitleUnits\(/.test(processTakbisUploadBody),
    "processTakbisUpload() artik importTakbisRecordsIntoTitleUnits()'i DOGRUDAN cagirmamali (onay paneli atlaniyor demektir)."
  );
  assert.ok(
    /pendingMultiTakbisImport\s*=\s*\{\s*records:/.test(processTakbisUploadBody),
    "processTakbisUpload() coklu kayit bulununca pendingMultiTakbisImport'u GERCEK bir {records, errors} nesnesiyle DOLDURMALI."
  );
  console.log("Kaynak-duzeyi: dogrudan importTakbisRecordsIntoTitleUnits cagrisi kaldirildi testi tamam.");
}

const sandboxSource = `
  let pendingMultiTakbisImport = null;
  let state = { uploads: {} };
  const importCalls = [];
  function importTakbisRecordsIntoTitleUnits(records) { importCalls.push(records); return records.length; }
  let readMultiTakbisPdfImpl = null;
  async function readMultiTakbisPdf(file) { return readMultiTakbisPdfImpl(file); }
  const processTakbisFileCalls = [];
  async function processTakbisFile(file) { processTakbisFileCalls.push(file); }
  ${processTakbisUploadBody}
  return {
    setState: (s) => { state = s; },
    getPending: () => pendingMultiTakbisImport,
    setPending: (p) => { pendingMultiTakbisImport = p; },
    setReadMultiTakbisPdfImpl: (fn) => { readMultiTakbisPdfImpl = fn; },
    getImportCalls: () => importCalls,
    getProcessTakbisFileCalls: () => processTakbisFileCalls,
    resetCalls: () => { importCalls.length = 0; processTakbisFileCalls.length = 0; },
    processTakbisUpload,
  };
`;
// eslint-disable-next-line no-new-func
const fns = new Function(sandboxSource)();

function file(name) {
  return { name };
}

// Node CommonJS betiklerinde top-level await YOK — tum async senaryolar
// bir main() icinde calisir (bu dosyadaki tek async gereksinim budur).
async function main() {
  // --- 1) Tek dosya, probe >1 kayıt -> pendingMultiTakbisImport dolar -----
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    fns.setReadMultiTakbisPdfImpl(async () => ({
      records: [
        { fields: { titlePropertyId: "111", blockNo: "709", parcelNo: "1" }, owners: [{ name: "A" }] },
        { fields: { titlePropertyId: "222", blockNo: "710", parcelNo: "2" }, owners: [{ name: "B" }] },
      ],
    }));
    await fns.processTakbisUpload([file("coklu.pdf")]);
    const pending = fns.getPending();
    assert.ok(pending, "pendingMultiTakbisImport DOLMALIYDI (coklu kayit tespit edildi).");
    assert.equal(pending.records.length, 2, "2 kayit da pendingMultiTakbisImport.records'a gecmeli.");
    assert.equal(pending.records[0].sourceFile, "coklu.pdf", "Her kayda kaynak dosya adi eklenmeli.");
    assert.equal(fns.getImportCalls().length, 0, "importTakbisRecordsIntoTitleUnits BU ASAMADA cagrilmamali (kullanici onay vermedi).");
    assert.equal(fns.getProcessTakbisFileCalls().length, 0, "processTakbisFile (tekil akis) cagrilmamali.");
    console.log("Tek dosya + coklu kayit -> onay bekleyen pending dolar testi tamam.");
  }

  // --- 2) Tek dosya, probe tam 1 kayıt -> processTakbisFile'a düşülür -----
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    fns.setReadMultiTakbisPdfImpl(async () => ({
      records: [{ fields: { titlePropertyId: "111", blockNo: "709", parcelNo: "1" }, owners: [{ name: "A" }] }],
    }));
    await fns.processTakbisUpload([file("tekli.pdf")]);
    assert.equal(fns.getPending(), null, "Tek kayitta pendingMultiTakbisImport null KALMALI.");
    assert.equal(fns.getProcessTakbisFileCalls().length, 1, "Tek kayitta ESKI/kanitlanmis processTakbisFile() cagrilmali.");
    assert.equal(fns.getImportCalls().length, 0, "importTakbisRecordsIntoTitleUnits tek kayitta cagrilmamali.");
    console.log("Tek dosya + tek kayit -> processTakbisFile'a dusme testi tamam.");
  }

  // --- 3) Tek dosya, probe hata fırlatır -> processTakbisFile'a düşülür ---
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    fns.setReadMultiTakbisPdfImpl(async () => { throw new Error("PDF okunamadi"); });
    await fns.processTakbisUpload([file("bozuk.pdf")]);
    assert.equal(fns.getPending(), null, "Yoklama hatasinda pendingMultiTakbisImport null kalmali.");
    assert.equal(fns.getProcessTakbisFileCalls().length, 1, "Yoklama hatasinda ESKI processTakbisFile() akisina dusulmeli.");
    console.log("Tek dosya + yoklama hatasi -> processTakbisFile'a dusme testi tamam.");
  }

  // --- 4) Birden fazla dosya, hepsi okunur -> pendingMultiTakbisImport dolar
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    let callIndex = 0;
    fns.setReadMultiTakbisPdfImpl(async () => {
      callIndex += 1;
      return { records: [{ fields: { titlePropertyId: String(callIndex), blockNo: String(700 + callIndex), parcelNo: "1" }, owners: [] }] };
    });
    await fns.processTakbisUpload([file("a.pdf"), file("b.pdf")]);
    const pending4 = fns.getPending();
    assert.ok(pending4, "Coklu dosyada pendingMultiTakbisImport DOLMALIYDI.");
    assert.equal(pending4.records.length, 2, "Iki dosyadan gelen 2 kayit da pending'e gecmeli.");
    assert.equal(fns.getImportCalls().length, 0, "importTakbisRecordsIntoTitleUnits coklu dosyada da DOGRUDAN cagrilmamali.");
    console.log("Birden fazla dosya -> onay bekleyen pending dolar testi tamam.");
  }

  // --- 5) Birden fazla dosya, hepsi başarısız -> hata fırlatılır ----------
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    fns.setReadMultiTakbisPdfImpl(async () => { throw new Error("okunamadi"); });
    await assert.rejects(
      () => fns.processTakbisUpload([file("x.pdf"), file("y.pdf")]),
      /Hiçbir dosya okunamadı/,
      "Tum dosyalar basarisizsa anlamli bir hata firlatilmali."
    );
    console.log("Birden fazla dosya + hepsi basarisiz -> hata firlatma testi tamam.");
  }

  // --- 6) Bayat (yanıtlanmamış) pending, yeni yükleme başında temizlenir --
  {
    fns.setState({ uploads: {} });
    fns.resetCalls();
    fns.setPending({ records: [{ fields: { titlePropertyId: "ESKI" } }], errors: [] });
    fns.setReadMultiTakbisPdfImpl(async () => ({
      records: [{ fields: { titlePropertyId: "YENI", blockNo: "1", parcelNo: "1" }, owners: [] }],
    }));
    await fns.processTakbisUpload([file("yeni-tekli.pdf")]);
    assert.equal(fns.getPending(), null, "Bayat pending, tek-kayitli YENI yuklemede null'a donmeli (eski panelde takili KALMAMALI).");
    console.log("Bayat pending'in yeni yuklemede temizlenmesi testi tamam.");
  }

  console.log("TAKBIS coklu-kayit onay paneli (pendingMultiTakbisImport) testleri basarili.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
