const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");

const appDir = __dirname;
const dataDir = path.join(appDir, "server-data");
const stateFile = path.join(dataDir, "active-case.json");
const backupDir = path.join(appDir, "backups");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "0.0.0.0";
let lastBackupCheckDate = "";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
]);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) {
        reject(new Error("İstek çok büyük."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function readBinaryBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 30 * 1024 * 1024) {
        reject(new Error("Dosya çok büyük."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(name, targetDir) {
  const source = path.join(appDir, name);
  if (await pathExists(source)) {
    await fs.copyFile(source, path.join(targetDir, name));
  }
}

async function createDailyBackupIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (lastBackupCheckDate === today) return;
  lastBackupCheckDate = today;

  await fs.mkdir(backupDir, { recursive: true });
  const existing = await fs.readdir(backupDir, { withFileTypes: true });
  if (existing.some((entry) => entry.isDirectory() && entry.name.startsWith(today))) return;

  const time = new Date().toTimeString().slice(0, 8).replaceAll(":", "-");
  const target = path.join(backupDir, `${today}_${time}`);
  await fs.mkdir(target, { recursive: true });

  const files = [
    "index.html",
    "app.js",
    "styles.css",
    "server.js",
    "README.md",
    "ARCHITECTURE_RULES.md",
    "mobil-sunucu-baslat.bat",
    "guvenlik-duvari-izin-ver.bat",
  ];

  await Promise.all(files.map((name) => copyIfExists(name, target)));
  if (await pathExists(dataDir)) {
    await fs.cp(dataDir, path.join(target, "server-data"), { recursive: true, force: true });
  }

  const backups = (await fs.readdir(backupDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  await Promise.all(
    backups.slice(30).map((name) => fs.rm(path.join(backupDir, name), { recursive: true, force: true })),
  );
}

async function handleStateApi(request, response) {
  if (request.method === "GET") {
    try {
      const raw = await fs.readFile(stateFile, "utf8");
      sendJson(response, 200, { exists: true, state: JSON.parse(raw) });
    } catch (error) {
      if (error.code === "ENOENT") {
        sendJson(response, 200, { exists: false, state: null });
        return;
      }
      throw error;
    }
    return;
  }

  if (request.method === "PUT" || request.method === "POST") {
    const body = await readBody(request);
    const parsed = JSON.parse(body || "{}");
    if (!parsed || typeof parsed !== "object") {
      sendJson(response, 400, { ok: false, error: "Geçersiz kayıt verisi." });
      return;
    }
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(stateFile, JSON.stringify(parsed, null, 2), "utf8");
    sendJson(response, 200, { ok: true, updatedAt: parsed.updatedAt || null });
    return;
  }

  sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
}

function postFormToOverpass(endpoint, formBody) {
  return new Promise((resolve, reject) => {
    const target = new URL(endpoint);
    const request = https.request(
      {
        method: "POST",
        hostname: target.hostname,
        path: target.pathname,
        port: target.port || 443,
        timeout: 15000,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
          "Content-Length": Buffer.byteLength(formBody),
          "User-Agent": "RaporYazmaProgrami/1.0 local Overpass proxy",
          "Accept": "application/json",
        },
      },
      (overpassResponse) => {
        let body = "";
        overpassResponse.setEncoding("utf8");
        overpassResponse.on("data", (chunk) => {
          body += chunk;
        });
        overpassResponse.on("end", () => {
          resolve({
            statusCode: overpassResponse.statusCode || 500,
            body,
          });
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Yakın çevre servisi zamanında cevap vermedi."));
    });
    request.on("error", reject);
    request.write(formBody);
    request.end();
  });
}

async function handleOverpassApi(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }

  const body = await readBody(request);
  const params = new URLSearchParams(body || "");
  const query = params.get("data") || "";
  if (!query.trim()) {
    sendJson(response, 400, { ok: false, error: "Overpass sorgusu boş." });
    return;
  }

  const formBody = new URLSearchParams({ data: query }).toString();
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];

  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const result = await postFormToOverpass(endpoint, formBody);
      if (result.statusCode >= 200 && result.statusCode < 300) {
        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        });
        response.end(result.body);
        return;
      }
      lastError = new Error(`Overpass ${result.statusCode}`);
    } catch (error) {
      lastError = error;
    }
  }

  sendJson(response, 502, { ok: false, error: lastError?.message || "Yakın çevre servisine ulaşılamadı." });
}

function safeUploadName(name) {
  return String(name || "belge.pdf")
    .replace(/[^\wğüşöçıİĞÜŞÖÇ.-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "belge.pdf";
}

function findPythonExecutable() {
  const bundled = path.join(
    process.env.USERPROFILE || "",
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe",
  );
  return bundled;
}

function runPdfTextExtractor(filePath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(appDir, "tools", "extract_pdf_text.py");
    const child = spawn(findPythonExecutable(), [scriptPath, filePath], {
      windowsHide: true,
      cwd: appDir,
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || "PDF metni okunamadı."));
        return;
      }
      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch (error) {
        reject(new Error("PDF metni okunurken geçersiz cevap alındı."));
      }
    });
  });
}

async function handlePdfTextApi(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }

  const buffer = await readBinaryBody(request);
  if (!buffer.length) {
    sendJson(response, 400, { ok: false, error: "PDF dosyası alınamadı." });
    return;
  }

  const uploadsDir = path.join(dataDir, "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const originalName = decodeURIComponent(String(request.headers["x-file-name"] || "belge.pdf"));
  const tempName = `${Date.now()}-${safeUploadName(originalName)}`;
  const tempPath = path.join(uploadsDir, tempName.toLowerCase().endsWith(".pdf") ? tempName : `${tempName}.pdf`);

  try {
    await fs.writeFile(tempPath, buffer);
    const result = await runPdfTextExtractor(tempPath);
    sendJson(response, 200, { ok: true, text: result.text || "" });
  } finally {
    fs.rm(tempPath, { force: true }).catch(() => {});
  }
}

function resolveStaticPath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${host}:${port}`).pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const resolved = path.resolve(appDir, `.${requested.replace(/\\/g, "/")}`);
  const root = path.resolve(appDir);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

async function handleStatic(request, response) {
  const filePath = resolveStaticPath(request.url || "/");
  if (!filePath) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Erişim reddedildi.");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
    });
    response.end(data);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.code === "ENOENT" ? "Dosya bulunamadı." : error.message);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    createDailyBackupIfNeeded().catch((error) => console.warn("Backup skipped:", error.message));
    if ((request.url || "").startsWith("/api/state")) {
      await handleStateApi(request, response);
      return;
    }
    if ((request.url || "").startsWith("/api/overpass")) {
      await handleOverpassApi(request, response);
      return;
    }
    if ((request.url || "").startsWith("/api/pdf-text")) {
      await handlePdfTextApi(request, response);
      return;
    }
    await handleStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { ok: false, error: error.message || String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`Rapor Yazma yerel sunucu: http://localhost:${port}`);
  createDailyBackupIfNeeded().catch((error) => console.warn("Backup skipped:", error.message));
});
