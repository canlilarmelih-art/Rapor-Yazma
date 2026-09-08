"use strict";

// Bulut kaydında iki temel veri bütünlüğü garantisini gerçek pushReport
// fonksiyonunu sahte Firestore ile çalıştırarak korur:
// 1) Beklenen revizyon transaction içinde uyuşmazsa yazma yapılmaz.
// 2) Ağ beklerken aktif rapor değişse bile hedef ve payload başlangıçtaki
//    rapora ait kalır.

const assert = require("node:assert/strict");
const acorn = require("acorn");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "cloud", "cloud-sync.js"), "utf8");
const ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script" });

function functionSource(name) {
  let found = null;
  function visit(node) {
    if (!node || typeof node !== "object" || found) return;
    if (node.type === "FunctionDeclaration" && node.id?.name === name) {
      found = node;
      return;
    }
    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value.type === "string") visit(value);
    });
  }
  visit(ast);
  assert.ok(found, `${name} fonksiyonu bulunamadi.`);
  return source.slice(found.start, found.end);
}

const testedSource = `${functionSource("buildEnvelope")}\n${functionSource("pushReport")}`;

function makeClient({ activeReportId = "report-A", knownRev = 7, label = "A-verisi", runTransaction }) {
  const statuses = [];
  const cloud = {
    user: { uid: "audit-user" },
    activeReportId,
    knownRev,
    pushing: false,
    db: { runTransaction },
  };
  const context = vm.createContext({
    cloud,
    state: { updatedAt: `${label}-tarih`, label },
    CLOUD_SCHEMA: "experify-report",
    CLOUD_SCHEMA_VERSION: 1,
    RETENTION_DAYS: 90,
    firebase: {
      firestore: {
        Timestamp: { fromMillis: (value) => ({ value }) },
        FieldValue: { serverTimestamp: () => "SERVER_TIMESTAMP" },
      },
    },
    window: { matchMedia: () => ({ matches: false }) },
    activeSectionId: "property",
    Date,
    console,
    reportDocRef: (reportId) => ({ reportId }),
    buildCloudReportPayload: () => ({ label: context.state.label }),
    buildSummary: () => ({ label: context.state.label }),
    setStatus: (...args) => statuses.push(args),
    showConflictChoice: (remote) => statuses.push(["conflict", remote]),
    bumpDailyPushCounter: () => {},
  });
  vm.runInContext(testedSource, context);
  return { context, cloud, statuses };
}

async function main() {
  // Aynı revizyonun başka cihaz tarafından transaction içinde ilerletildiği
  // durumda ikinci istemci yazamaz ve çakışma görür.
  {
  const remote = { rev: 8, createdAt: "old" };
  const client = makeClient({
    runTransaction: async (callback) => callback({
      get: async () => ({ exists: true, data: () => remote }),
      set: () => { throw new Error("Uyumsuz revizyonda yazma yapilmamali."); },
    }),
  });
  const result = await client.context.pushReport();
  assert.equal(result, false);
  assert.ok(client.statuses.some(([kind]) => kind === "conflict"), "Revizyon uyusmazligi kullaniciya gosterilmeli.");
  }

  // A kaydı beklerken kullanıcı B raporuna geçse dahi transaction A referansına
  // ve A anlık görüntüsüne yazmalıdır; B'nin durum göstergesi değiştirilmez.
  {
  let releaseRead;
  const waitForRead = new Promise((resolve) => { releaseRead = resolve; });
  let written = null;
  const client = makeClient({
    activeReportId: "report-A",
    knownRev: 0,
    label: "A-verisi",
    runTransaction: async (callback) => callback({
      get: async () => {
        await waitForRead;
        return { exists: false, data: () => null };
      },
      set: (ref, envelope) => { written = { reportId: ref.reportId, envelope }; },
    }),
  });
  const pending = client.context.pushReport();
  client.cloud.activeReportId = "report-B";
  client.context.state.label = "B-verisi";
  releaseRead();
  assert.equal(await pending, true);
  assert.equal(written.reportId, "report-A");
  assert.deepEqual(written.envelope.payload, { label: "A-verisi" });
  assert.equal(client.cloud.knownRev, 0, "A'nin yaniti B'nin aktif revizyonunu degistirmemeli.");
  }

  console.log("Bulut atomik kayit ve rapor-degisimi yarisi testi tamam.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
