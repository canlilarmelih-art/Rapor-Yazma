// Faz 0 ölçüm aracı: bir rapor state'inin bulut senkron paketi boyutunu ölçer.
// Kişisel veri İÇERİĞİ asla yazdırılmaz; yalnızca anahtar adları ve bayt boyutları raporlanır.
//
// Kullanım:
//   node tools/measure-cloud-payload.js                     -> server-data/active-case.json
//   node tools/measure-cloud-payload.js <dosya.json>        -> JSON taslak paketi veya ham state
//
// Beyaz liste (buluta GİDEN): fields, tables, lookupOptions, updatedAt
// Kara liste (cihazda KALAN): sourceValues (ham belge metinleri), sourceConflicts,
//                             uploads (belge meta), settings (cihaz/kullanıcı tercihi)

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const CLOUD_WHITELIST = ["fields", "tables", "lookupOptions", "updatedAt"];
const FIRESTORE_DOC_LIMIT = 1048576; // 1 MiB

function jsonBytes(value) {
  return Buffer.byteLength(JSON.stringify(value === undefined ? null : value), "utf8");
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

function resolveState(parsed) {
  // JSON taslak paketi ({schema, state}) veya ham state kabul edilir.
  if (parsed && typeof parsed === "object" && parsed.state && typeof parsed.state === "object") {
    return { state: parsed.state, wrapper: "json-taslak-paketi" };
  }
  return { state: parsed, wrapper: "ham-state" };
}

function buildCloudReportPayload(state) {
  // FAZ 0 SÖZLEŞMESİ: beyaz liste dışında hiçbir üst anahtar buluta gitmez.
  const payload = {};
  CLOUD_WHITELIST.forEach((key) => {
    if (state[key] !== undefined) payload[key] = state[key];
  });
  return payload;
}

function main() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(root, "server-data", "active-case.json");

  if (!fs.existsSync(inputPath)) {
    console.error(`Dosya bulunamadı: ${inputPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const { state, wrapper } = resolveState(parsed);

  if (!state || typeof state !== "object") {
    console.error("Geçerli bir state bulunamadı.");
    process.exit(1);
  }

  const totalBytes = jsonBytes(state);
  const cloudPayload = buildCloudReportPayload(state);
  const cloudBytes = jsonBytes(cloudPayload);

  console.log(`Kaynak: ${path.relative(root, inputPath)} (${wrapper})`);
  console.log(`Tam state boyutu           : ${formatBytes(totalBytes)}`);
  console.log("");
  console.log("Üst anahtar dökümü (içerik yazdırılmaz):");
  Object.keys(state)
    .map((key) => ({ key, bytes: jsonBytes(state[key]) }))
    .sort((a, b) => b.bytes - a.bytes)
    .forEach(({ key, bytes }) => {
      const mark = CLOUD_WHITELIST.includes(key) ? "BULUT " : "cihaz ";
      console.log(`  [${mark}] ${key.padEnd(18)} ${formatBytes(bytes).padStart(10)}`);
    });
  console.log("");

  // tables içindeki en büyük tabloları da göster (anahtar adı + boyut).
  if (state.tables && typeof state.tables === "object") {
    console.log("En büyük 5 tablo:");
    Object.keys(state.tables)
      .map((key) => ({ key, bytes: jsonBytes(state.tables[key]) }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 5)
      .forEach(({ key, bytes }) => console.log(`  tables.${key.padEnd(24)} ${formatBytes(bytes).padStart(10)}`));
    console.log("");
  }

  const percent = ((cloudBytes / FIRESTORE_DOC_LIMIT) * 100).toFixed(1);
  console.log(`BULUT SENKRON PAKETİ (${CLOUD_WHITELIST.join(", ")}):`);
  console.log(`  Boyut                    : ${formatBytes(cloudBytes)}`);
  console.log(`  Firestore 1 MiB limiti   : %${percent} doluluk`);
  console.log(`  Kalan pay                : ${formatBytes(FIRESTORE_DOC_LIMIT - cloudBytes)}`);
  console.log(`  Dışarıda bırakılan       : ${formatBytes(totalBytes - cloudBytes)} (sourceValues vb.)`);

  if (cloudBytes > FIRESTORE_DOC_LIMIT * 0.75) {
    console.log("");
    console.log("UYARI: Paket 1 MiB limitinin %75'ini aşıyor; tabloların alt-belgelere bölünmesi değerlendirilmeli.");
    process.exitCode = 2;
  }
}

main();
