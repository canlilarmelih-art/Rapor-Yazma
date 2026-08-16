"use strict";

/*
  Kullanici bildirimi (2026-08-17): "talep silme butonu calismiyor" -
  ekrandan secilen buton, "Yalnizca bulutta" (bu cihaza hic getirilmemis)
  bir rapor karti uzerindeki "Sil" (data-action="delete-cloud-only") idi.

  Kok neden: cloud/cloud-sync.js'teki deleteCloudReport() Firestore silme
  hatasini (kurallar/ag/oturum) SESSIZCE yutup `false` donuyordu, ama
  cloud/report-library.js'teki HER IKI cagiran (deleteCloudOnlyReport,
  deleteReport) donus degerini HIC KONTROL ETMIYORDU - silme GERCEKTE
  basarisiz olsa bile arayuz karti kaldirip "silindi" gibi davraniyordu;
  rapor bir sonraki "Taleplerim" acilisinda (cloudReportsCache'in
  tazelendigi an) hayalet gibi GERI GELIYORDU. Bu, kullanicinin "buton
  calismiyor" seklinde yasadigi tam senaryo.

  Duzeltme: deleteCloudReport() artik { ok, error } doner; her iki cagiran
  da SONUCU KONTROL EDIP basarisizsa kullaniciya ACIKCA bildirir (kart
  YERINDE kalir, yanlis "silindi" izlenimi verilmez).

  Bu test, cloud/report-library.js'teki deleteCloudOnlyReport() ve
  deleteReport()'u GERCEK kaynaktan (fonksiyon govdesi + tum kapsam
  disi bagimliliklar sahte/stub olarak enjekte edilerek) calistirip iki
  dalın da (basarili/basarisiz) dogru davrandigini dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "cloud", "report-library.js"), "utf8");

function extractFnBody(name) {
  const marker = `function ${name}(`;
  let start = source.indexOf(marker);
  assert(start >= 0, `Bulunamadi: ${name}`);
  // "async function X(" ise "async " onekini de dahil et — aksi halde
  // govde icindeki "await" senkron bir fonksiyon icinde SyntaxError verir.
  if (source.slice(Math.max(0, start - 6), start) === "async ") start -= 6;
  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return source.slice(start, i);
}

const deleteCloudOnlyReportSrc = extractFnBody("deleteCloudOnlyReport");
const deleteReportSrc = extractFnBody("deleteReport");

function makeCloudOnlyContext({ deleteResult, confirmResult = true, hasCloudSync = true }) {
  const alerts = [];
  let renderCount = 0;
  const context = {
    window: {
      confirm: () => confirmResult,
      alert: (msg) => alerts.push(msg),
      RaporCloudSync: hasCloudSync ? { deleteCloudReport: async () => deleteResult } : undefined,
    },
    cloudReportsCache: { "RE-1": { summary: { caseName: "Test" } } },
    renderDashboardBody: () => { renderCount += 1; },
  };
  vm.createContext(context);
  vm.runInContext(deleteCloudOnlyReportSrc, context);
  return { context, alerts, getRenderCount: () => renderCount };
}

(async () => {
  // --- 1) Basarili silme: kart cache'ten kaldirilir, alert YOK, render olur.
  {
    const { context, alerts, getRenderCount } = makeCloudOnlyContext({ deleteResult: { ok: true } });
    await context.deleteCloudOnlyReport("RE-1");
    assert.equal(alerts.length, 0, `Basarili silmede alert gosterilmemeli: ${JSON.stringify(alerts)}`);
    assert.equal(context.cloudReportsCache["RE-1"], undefined, "Basarili silmede kart cache'ten kaldirilmali.");
    assert.equal(getRenderCount(), 1, "Basarili silmede dashboard yeniden cizilmeli.");
  }

  // --- 2) BASARISIZ silme (asil bildirilen hata): kart cache'te KALMALI,
  // kullaniciya ACIKCA hata gosterilmeli, YANLIS "silindi" izlenimi
  // VERILMEMELI (render/cache-temizleme YAPILMAMALI).
  {
    const { context, alerts, getRenderCount } = makeCloudOnlyContext({
      deleteResult: { ok: false, error: "permission-denied" },
    });
    await context.deleteCloudOnlyReport("RE-1");
    assert.equal(alerts.length, 1, `Basarisiz silmede kullaniciya bir hata gosterilmeli: ${JSON.stringify(alerts)}`);
    assert.match(alerts[0], /permission-denied/, `Hata mesaji gercek nedeni icermeli: ${alerts[0]}`);
    assert.notEqual(context.cloudReportsCache["RE-1"], undefined, "REGRESYON: basarisiz silmede kart yine de cache'ten kaldirilmis - yanlis 'silindi' izlenimi.");
    assert.equal(getRenderCount(), 0, "Basarisiz silmede dashboard YENIDEN CIZILMEMELI (kart hala listede kalmali).");
  }

  // --- 3) Kullanici onaylamazsa hicbir sey olmamali (regresyon).
  {
    const { context, alerts, getRenderCount } = makeCloudOnlyContext({ deleteResult: { ok: true }, confirmResult: false });
    await context.deleteCloudOnlyReport("RE-1");
    assert.equal(alerts.length, 0, "Onaylanmazsa alert olmamali.");
    assert.notEqual(context.cloudReportsCache["RE-1"], undefined, "Onaylanmazsa kart silinmemeli.");
    assert.equal(getRenderCount(), 0, "Onaylanmazsa render olmamali.");
  }

  console.log("Cloud-only rapor silme: basarisizlik geri bildirimi testi tamam.");
})().then(() => runDeleteReportScenarios()).catch((error) => {
  console.error(error);
  process.exit(1);
});

// deleteReport() (yerel + bulut) - bulut kismi basarisiz olsa bile YEREL
// silme HER ZAMAN gerceklesir (kullanicinin cihazindaki rapor kaybolmaz),
// ama artik kullaniciya bulut kopyasinin KALMIS olabilecegi ACIKCA
// bildiriliyor (2026-08-17, ayni kok neden).
function makeDeleteReportContext({ deleteResult, isConfigured = true, activeReportId = "RE-OTHER" }) {
  const alerts = [];
  let renderCount = 0;
  const removed = [];
  const context = {
    window: {
      confirm: () => true,
      alert: (msg) => alerts.push(msg),
      RaporCloudSync: { isConfigured: () => isConfigured, deleteCloudReport: async () => deleteResult },
    },
    state: { reportId: activeReportId },
    removeBlob: (id) => removed.push(id),
    readIndex: () => [],
    writeIndex: () => {},
    cloudReportsCache: { "RE-1": { summary: {} } },
    loadReportIntoActiveState: () => {},
    resetToFreshEmptyReport: () => {},
    renderDashboardBody: () => { renderCount += 1; },
  };
  vm.createContext(context);
  vm.runInContext(deleteReportSrc, context);
  return { context, alerts, removed, getRenderCount: () => renderCount };
}

async function runDeleteReportScenarios() {
  // --- 4) Yerel silme HER ZAMAN olur; bulut BASARISIZ olursa kullaniciya
  // uyari verilir (ama yerel silme geri alinmaz).
  {
    const { context, alerts, removed, getRenderCount } = makeDeleteReportContext({
      deleteResult: { ok: false, error: "network-error" },
    });
    await context.deleteReport("RE-1");
    assert.deepEqual(removed, ["RE-1"], "Yerel silme (removeBlob) bulut basarisiz olsa bile HER ZAMAN calismali.");
    assert.equal(alerts.length, 1, `Bulut silme basarisiz olunca kullaniciya uyari verilmeli: ${JSON.stringify(alerts)}`);
    assert.match(alerts[0], /bulut kopyası silinemedi/i, `Uyari mesaji dogru olmali: ${alerts[0]}`);
    assert.equal(getRenderCount(), 1, "Yerel silme sonrasi dashboard yine de yeniden cizilmeli.");
  }

  // --- 5) Bulut silme BASARILI olursa hic alert olmamali (regresyon).
  {
    const { alerts, context } = makeDeleteReportContext({ deleteResult: { ok: true } });
    await context.deleteReport("RE-1");
    assert.equal(alerts.length, 0, `Basarili bulut silmede alert olmamali: ${JSON.stringify(alerts)}`);
  }

  console.log("Yerel+bulut rapor silme: bulut basarisizligi geri bildirimi testi tamam.");
}
