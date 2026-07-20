const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const { createReadStream, existsSync, readdirSync } = require("fs");
const readline = require("readline");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const crypto = require("crypto");

const appDir = __dirname;
const dataDir = path.join(appDir, "server-data");
const backupDir = path.join(appDir, "backups");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const firebaseProjectId = String(process.env.RAPOR_FIREBASE_PROJECT_ID || "rapor-yazma-pro").trim();
const firebaseIssuer = `https://securetoken.google.com/${firebaseProjectId}`;
const firebaseCertsUrl = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const neighborhoodCsvFile = path.join(dataDir, "bursa_manuel_duzeltilmis_ana_dosya.csv");
let firebaseCertCache = { certs: null, expiresAt: 0, pending: null };
let neighborhoodRowsPromise = null;
let lastBackupCheckDate = "";

// Statik olarak ASLA sunulmayacak kök klasör/isimler — tam kaynak yedekleri
// (backups) ve versiyon geçmişi (.git) istemcinin talep edebileceği bir dosya
// adı DEĞİLDİR. Eskiden tek kontrol `resolved.startsWith(root)` idi; bu appDir
// ile aynı önekle başlayan bir KARDEŞ klasörü (ör. "app-yedek") de root
// sanabiliyordu ve backups/.git altındaki her dosya normal statik dosya gibi
// dışarıya servis edilebiliyordu.
const STATIC_DENYLIST = new Set(["backups", ".git", "node_modules", "graphify-out"]);

// server-data/ klasörü hem KİŞİSEL veriyi hem de paylaşılan referans verilerini
// içeriyor. Büyük mahalle CSV'si yalnızca kimlik doğrulamalı API tarafından
// sunucu içinde okunur; tarayıcıya statik dosya olarak verilmez. Küçük legacy
// placeholder JSON'u ise app.js tarafından doğrudan kullanılmaya devam eder.
const SENSITIVE_SERVER_DATA_FILES = new Set([
  "active-case.json",
  "user-pois.json",
  "bursa_manuel_duzeltilmis_ana_dosya.csv",
]);

function isSensitivePath(relativeSegments) {
  const first = relativeSegments[0];
  if (!first) return false;
  if (STATIC_DENYLIST.has(first)) return true;
  if (first.startsWith(".env")) return true;
  if (first === "server-data") {
    const second = relativeSegments[1];
    if (!second) return true; // server-data'nın kendisi (dizin listesi vb.) da kapalı.
    if (second === "uploads" || second === "users") return true;
    if (SENSITIVE_SERVER_DATA_FILES.has(second)) return true;
  }
  return false;
}

function userDataDirectory(uid) {
  const safeUid = Buffer.from(String(uid || ""), "utf8").toString("base64url");
  if (!safeUid) throw new Error("Kimlik bilgisi eksik.");
  return path.join(dataDir, "users", safeUid);
}

function userStateFile(uid) {
  return path.join(userDataDirectory(uid), "active-case.json");
}

function userPoisFile(uid) {
  return path.join(userDataDirectory(uid), "user-pois.json");
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function cleanNeighborhoodText(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  let previous = "";
  while (text && text !== previous) {
    previous = text;
    text = text
      .replace(/\s+(mahallesi|mahalle|mah\.?|köyü|koyu|köy|koy)$/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return text;
}

function normalizeNeighborhoodPlaceKey(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[ıi]/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeNeighborhoodKey(value) {
  return normalizeNeighborhoodPlaceKey(cleanNeighborhoodText(value));
}

function parseNeighborhoodNumber(value) {
  const number = Number.parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(number) ? number : Number.NaN;
}

function normalizeNeighborhoodPostalCode(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (digits.length === 4) return digits.padStart(5, "0");
  if (digits.length === 5) return digits;
  return String(value || "").trim();
}

function applyNeighborhoodCoordinateOverride(row) {
  if (row.cityKey === "bursa" && row.districtKey === "gursu" && row.neighborhoodKey === "hasankoy") {
    return { ...row, lat: 40.23761, lng: 29.19763 };
  }
  return row;
}

async function loadNeighborhoodRows() {
  if (!neighborhoodRowsPromise) {
    neighborhoodRowsPromise = (async () => {
      const rows = [];
      let headerIndexes = null;
      const lines = readline.createInterface({
        input: createReadStream(neighborhoodCsvFile, { encoding: "utf8" }),
        crlfDelay: Infinity,
      });

      for await (const line of lines) {
        if (!headerIndexes) {
          const headers = parseCsvLine(line).map((header) => header.replace(/^\uFEFF/, "").trim());
          headerIndexes = new Map(headers.map((header, index) => [header, index]));
          continue;
        }
        if (!line.trim()) continue;

        const cells = parseCsvLine(line);
        const value = (header) => cells[headerIndexes.get(header)] || "";
        const city = String(value("il")).replace(/\s+/g, " ").trim();
        const district = String(value("ilçe")).replace(/\s+/g, " ").trim();
        const neighborhood = cleanNeighborhoodText(value("Mahalle"));
        const lat = parseNeighborhoodNumber(value("Final_Enlem") || value("Enlem") || value("OSM_Enlem"));
        const lng = parseNeighborhoodNumber(value("Final_Boylam") || value("Boylam") || value("OSM_Boylam"));
        if (!city || !district || !neighborhood || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;

        rows.push(applyNeighborhoodCoordinateOverride({
          city,
          district,
          neighborhood,
          postalCode: normalizeNeighborhoodPostalCode(value("PK")),
          lat,
          lng,
          cityKey: normalizeNeighborhoodPlaceKey(city),
          districtKey: normalizeNeighborhoodPlaceKey(district),
          neighborhoodKey: normalizeNeighborhoodKey(neighborhood),
          cityCenterLat: parseNeighborhoodNumber(value("Il_Merkez_Enlem")),
          cityCenterLng: parseNeighborhoodNumber(value("Il_Merkez_Boylam")),
          cityCenterDistanceKm: parseNeighborhoodNumber(value("Il_Merkez_Mesafe_Km")),
          cityCenterDirection: String(value("Il_Merkez_Yon")).trim(),
          districtCenterLat: parseNeighborhoodNumber(value("Ilce_Merkez_Enlem")),
          districtCenterLng: parseNeighborhoodNumber(value("Ilce_Merkez_Boylam")),
          districtCenterDistanceKm: parseNeighborhoodNumber(value("Ilce_Merkez_Mesafe_Km")),
          districtCenterDirection: String(value("Ilce_Merkez_Yon")).trim(),
        }));
      }
      return rows;
    })().catch((error) => {
      neighborhoodRowsPromise = null;
      throw error;
    });
  }
  return neighborhoodRowsPromise;
}

function calculateNeighborhoodDistanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterNeighborhoodRowsByArea(rows, cityKey, districtKey) {
  const districtRows = rows.filter((row) => {
    if (cityKey && row.cityKey !== cityKey) return false;
    if (districtKey && row.districtKey !== districtKey) return false;
    return true;
  });
  if (districtRows.length) return districtRows;
  const cityRows = rows.filter((row) => cityKey && row.cityKey === cityKey);
  return cityRows.length ? cityRows : rows;
}

function neighborhoodKeyMatches(rowKey, targetKey) {
  if (!rowKey || !targetKey) return false;
  return rowKey === targetKey || rowKey.endsWith(` ${targetKey}`) || rowKey.includes(` ${targetKey} `);
}

function findNearestNeighborhoodRow(rows, lat, lng) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  rows.forEach((row) => {
    const distance = calculateNeighborhoodDistanceMeters(lat, lng, row.lat, row.lng);
    if (Number.isFinite(distance) && distance < bestDistance) {
      best = row;
      bestDistance = distance;
    }
  });
  return best;
}

function queryNeighborhoodRows(rows, payload) {
  const operation = String(payload?.operation || "");
  const cityKey = normalizeNeighborhoodPlaceKey(payload?.city);
  const districtKey = normalizeNeighborhoodPlaceKey(payload?.district);
  const neighborhoodKey = normalizeNeighborhoodKey(payload?.neighborhood);

  if (operation === "postal") {
    if (!cityKey || !neighborhoodKey) return { match: null };
    const match = rows.find((row) => row.cityKey === cityKey
      && (!districtKey || row.districtKey === districtKey)
      && row.neighborhoodKey === neighborhoodKey) || null;
    return { match };
  }

  const lat = Number(payload?.lat);
  const lng = Number(payload?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 35 || lat > 43 || lng < 25 || lng > 45) {
    throw new Error("Koordinat eksik veya geçersiz.");
  }

  if (operation === "location") {
    const areaRows = filterNeighborhoodRowsByArea(rows, cityKey, districtKey);
    const nearest = findNearestNeighborhoodRow(areaRows, lat, lng);
    const matchingRows = neighborhoodKey
      ? rows.filter((row) => neighborhoodKeyMatches(row.neighborhoodKey, neighborhoodKey))
      : [];
    const bound = matchingRows.length
      ? findNearestNeighborhoodRow(filterNeighborhoodRowsByArea(matchingRows, cityKey, districtKey), lat, lng)
      : null;
    return { nearest, bound };
  }

  if (operation === "nearby") {
    const radius = Math.min(20000, Math.max(100, Number(payload?.radius) || 2000));
    const limit = Math.min(100, Math.max(1, Math.round(Number(payload?.limit) || 45)));
    const matches = rows
      .map((row) => ({ row, distance: calculateNeighborhoodDistanceMeters(lat, lng, row.lat, row.lng) }))
      .filter((item) => Number.isFinite(item.distance) && item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    const seen = new Set();
    const nearby = [];
    for (const item of matches) {
      const key = `${item.row.cityKey}|${item.row.districtKey}|${item.row.neighborhoodKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      nearby.push(item.row);
      if (nearby.length >= limit) break;
    }
    return { nearby };
  }

  throw new Error("Mahalle sorgu türü desteklenmiyor.");
}

// Basit bellek-içi sabit-pencere rate limiter. Harici bağımlılık eklemeden
// (proje sıfır npm bağımlılığıyla çalışıyor) IP başına istek sayısını sınırlar.
const rateLimitBuckets = new Map();

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    rateLimitBuckets.set(key, { windowStart: now, count: 1 });
    return { limited: false };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000));
    return { limited: true, retryAfterSeconds };
  }
  return { limited: false };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets) {
    if (now - bucket.windowStart > 15 * 60 * 1000) rateLimitBuckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

function clientKeyFor(request) {
  return request.socket?.remoteAddress || "unknown";
}

function sendRateLimited(response, retryAfterSeconds) {
  response.writeHead(429, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": String(retryAfterSeconds),
  });
  response.end(JSON.stringify({ ok: false, error: "Çok fazla istek. Lütfen birkaç saniye sonra tekrar deneyin." }));
}

function logServerError(context, error) {
  console.error(`[${new Date().toISOString()}] ${context}:`, error && error.stack ? error.stack : error);
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Uygulama build'siz vanilla JS: birkaç sayfa-içi <script> bloğu ve
  // unpkg.com üzerinden yüklenen Leaflet var; bu yüzden 'unsafe-inline' ve
  // unpkg.com script-src'te tutulmak zorunda (aksi halde sayfa çalışmaz).
  // Yine de yabancı script/frame/obje kaynaklarını ve clickjacking'i engeller.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.arcgisonline.com",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "connect-src 'self' https://overpass-api.de https://overpass.kumi.systems https://overpass.osm.ch https://nominatim.openstreetmap.org https://geocode.arcgis.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

function applySecurityHeaders(response) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.setHeader(key, value);
  }
}

// CSRF sertleştirmesi: sunucu farklı origin'lere Access-Control-Allow-Origin
// vermiyor, ama application/x-www-form-urlencoded gibi "basit" isteklerde
// tarayıcı preflight yapmadan isteği yine de gönderir (ör. /api/overpass).
// Bu, kullanıcı çalışırken açtığı KÖTÜ NİYETLİ bir web sayfasının, kullanıcının
// tarayıcısı üzerinden sessizce bu sunucuya yazma isteği göndermesine
// (drive-by CSRF) izin verir. Özel bir header zorunlu kılmak tarayıcıyı
// preflight yapmaya zorlar; preflight'a CORS izni verilmediği için başarısız
// olur ve asıl istek hiç gönderilmez.
const CSRF_HEADER = "x-rapor-client";
const CSRF_HEADER_VALUE = "1";

function isTrustedRequestOrigin(request) {
  if (request.headers[CSRF_HEADER] !== CSRF_HEADER_VALUE) return false;
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    return originHost === request.headers.host;
  } catch {
    return false;
  }
}

function decodeJwtPart(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function fetchFirebaseCertificates() {
  return new Promise((resolve, reject) => {
    const request = https.get(firebaseCertsUrl, { timeout: 10000 }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode !== 200) {
          reject(new Error(`Firebase certificate endpoint returned ${response.statusCode}`));
          return;
        }
        try {
          const certs = JSON.parse(body);
          const cacheControl = String(response.headers["cache-control"] || "");
          const maxAge = Number(cacheControl.match(/max-age=(\\d+)/i)?.[1] || 3600);
          firebaseCertCache = { certs, expiresAt: Date.now() + Math.max(60, maxAge - 60) * 1000, pending: null };
          resolve(certs);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("timeout", () => request.destroy(new Error("Firebase certificate request timed out")));
    request.on("error", reject);
  });
}

async function getFirebaseCertificates() {
  if (firebaseCertCache.certs && firebaseCertCache.expiresAt > Date.now()) return firebaseCertCache.certs;
  if (!firebaseCertCache.pending) {
    firebaseCertCache.pending = fetchFirebaseCertificates().finally(() => {
      firebaseCertCache.pending = null;
    });
  }
  return firebaseCertCache.pending;
}

async function authenticateRequest(request) {
  const authorization = String(request.headers.authorization || "");
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);
  if (!header || !payload || header.alg !== "RS256" || !header.kid || !payload.sub) return null;

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = Number(payload.exp);
  const issuedAt = Number(payload.iat);
  if (payload.iss !== firebaseIssuer || payload.aud !== firebaseProjectId
    || !Number.isFinite(expiresAt) || !Number.isFinite(issuedAt)
    || expiresAt <= now || issuedAt > now + 60
    || typeof payload.sub !== "string" || payload.sub.length > 256) return null;

  try {
    const certs = await getFirebaseCertificates();
    const certificate = certs[header.kid];
    if (!certificate) return null;
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    if (!verifier.verify(certificate, Buffer.from(parts[2], "base64url"))) return null;
    return { uid: payload.sub, email: payload.email || null };
  } catch (error) {
    logServerError("Firebase token doğrulaması başarısız", error);
    return null;
  }
}

function sendUnauthorized(response) {
  applySecurityHeaders(response);
  response.writeHead(401, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "WWW-Authenticate": "Bearer",
  });
  response.end(JSON.stringify({ ok: false, error: "Oturum doğrulanamadı." }));
}

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
  [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);

function sendJson(response, status, body) {
  applySecurityHeaders(response);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function readBody(request, maxBytes = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        const error = new Error("İstek çok büyük.");
        error.isPayloadTooLarge = true;
        reject(error);
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function readBinaryBody(request, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        const error = new Error("Dosya çok büyük.");
        error.isPayloadTooLarge = true;
        reject(error);
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

async function handleStateApi(request, response, user) {
  const stateFile = userStateFile(user.uid);
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
    let body;
    try {
      body = await readBody(request);
    } catch (error) {
      sendJson(response, error.isPayloadTooLarge ? 413 : 400, { ok: false, error: "İstek gövdesi okunamadı." });
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      sendJson(response, 400, { ok: false, error: "Geçersiz JSON." });
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      sendJson(response, 400, { ok: false, error: "Geçersiz kayıt verisi." });
      return;
    }
    await fs.mkdir(path.dirname(stateFile), { recursive: true });
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

  let body;
  try {
    body = await readBody(request, 200 * 1024);
  } catch (error) {
    sendJson(response, error.isPayloadTooLarge ? 413 : 400, { ok: false, error: "İstek gövdesi okunamadı." });
    return;
  }
  const params = new URLSearchParams(body || "");
  const query = params.get("data") || "";
  if (!query.trim()) {
    sendJson(response, 400, { ok: false, error: "Overpass sorgusu boş." });
    return;
  }
  if (query.length > 20000) {
    sendJson(response, 400, { ok: false, error: "Overpass sorgusu çok uzun." });
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
        applySecurityHeaders(response);
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

  logServerError("Overpass proxy hatası", lastError);
  sendJson(response, 502, { ok: false, error: "Yakın çevre servisine ulaşılamadı." });
}

async function readUserPois(uid) {
  const poisFile = userPoisFile(uid);
  try {
    const raw = await fs.readFile(poisFile, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function handleUserPoisApi(request, response, user) {
  const poisFile = userPoisFile(user.uid);
  if (request.method === "GET") {
    const pois = await readUserPois(user.uid);
    sendJson(response, 200, { ok: true, pois });
    return;
  }
  if (request.method === "POST") {
    let body;
    try {
      body = await readBody(request, 200 * 1024);
    } catch (error) {
      sendJson(response, error.isPayloadTooLarge ? 413 : 400, { ok: false, error: "İstek gövdesi okunamadı." });
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(body || "{}");
    } catch {
      sendJson(response, 400, { ok: false, error: "Geçersiz JSON." });
      return;
    }
    // Kontrol karakterlerini (ör. gizli yön/format karakterleri) temizle —
    // isim serbest metin olarak dosyaya yazılıp sonradan ekranda gösteriliyor.
    const name = String(parsed?.name || "").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 160);
    const category = normalizeUserPoiCategory(parsed?.category);
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    // Türkiye'nin kabaca coğrafi sınırları — anlamsız/kötüye kullanım amaçlı
    // koordinatları (ör. 0,0 ya da dünyanın diğer ucu) en baştan reddeder.
    const isPlausibleLat = Number.isFinite(lat) && lat >= 35 && lat <= 43;
    const isPlausibleLng = Number.isFinite(lng) && lng >= 25 && lng <= 45;
    if (!name || !isPlausibleLat || !isPlausibleLng) {
      sendJson(response, 400, { ok: false, error: "Nokta adı veya koordinat eksik/geçersiz." });
      return;
    }
    const pois = await readUserPois(user.uid);
    const id = `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const next = [{ id, name, lat, lng, category, source: category === "user-artery" ? "Kullanıcı Ulaşım Arteri" : "Kullanıcı", createdAt: new Date().toISOString() }, ...pois]
      .slice(0, 300);
    await fs.mkdir(path.dirname(poisFile), { recursive: true });
    await fs.writeFile(poisFile, JSON.stringify(next, null, 2), "utf8");
    sendJson(response, 200, { ok: true, poi: next[0], pois: next });
    return;
  }
  sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
}

async function handleNeighborhoodsApi(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }

  let payload;
  try {
    const body = await readBody(request, 32 * 1024);
    payload = JSON.parse(body || "{}");
  } catch (error) {
    sendJson(response, error.isPayloadTooLarge ? 413 : 400, { ok: false, error: "Geçersiz mahalle sorgusu." });
    return;
  }

  try {
    const rows = await loadNeighborhoodRows();
    const result = queryNeighborhoodRows(rows, payload);
    sendJson(response, 200, { ok: true, ...result });
  } catch (error) {
    if (/geçersiz|desteklenmiyor/i.test(String(error?.message || ""))) {
      sendJson(response, 400, { ok: false, error: error.message });
      return;
    }
    throw error;
  }
}

function normalizeUserPoiCategory(value) {
  return value === "user-artery" ? "user-artery" : "user";
}

function safeUploadName(name) {
  return String(name || "belge.pdf")
    .replace(/[^\wğüşöçıİĞÜŞÖÇ.-]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "belge.pdf";
}

// Python adayları öncelik sırasıyla döner. Eski sürüm USERPROFILE boş
// geldiğinde ".cache/..." şeklinde GÖRELİ yol üretiyor ve tek adaya bağlı
// kaldığından spawn hatası ("spawn .cache/...python.exe") kullanıcı arayüzüne
// düşüyordu. Artık mutlak yollar os.homedir() ile kurulur, codex çalışma
// zamanının yeniden adlandırılmış kopyaları taranır ve PATH üzerindeki
// python/py son çare olarak denenir.
function getPythonCandidates() {
  const candidates = [];
  if (process.env.RAPOR_PYTHON && process.env.RAPOR_PYTHON.trim()) {
    candidates.push(process.env.RAPOR_PYTHON.trim());
  }

  let homeDir = "";
  try {
    homeDir = os.homedir() || "";
  } catch {
    homeDir = process.env.USERPROFILE || "";
  }

  if (homeDir) {
    const runtimesDir = path.join(homeDir, ".cache", "codex-runtimes");
    const primary = path.join(runtimesDir, "codex-primary-runtime", "dependencies", "python", "python.exe");
    if (existsSync(primary)) candidates.push(primary);
    try {
      readdirSync(runtimesDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== "codex-primary-runtime")
        .forEach((entry) => {
          const alt = path.join(runtimesDir, entry.name, "dependencies", "python", "python.exe");
          if (existsSync(alt)) candidates.push(alt);
        });
    } catch {
      /* codex-runtimes klasörü yoksa sorun değil */
    }
  }

  // Sistem PATH'i (varsa): Windows py launcher ve python.
  candidates.push("py", "python");
  return candidates;
}

function spawnPdfTextExtractor(pythonPath, scriptPath, filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath, [scriptPath, filePath], {
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
    child.on("error", (error) => {
      error.isSpawnError = true;
      reject(error);
    });
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

async function runPdfTextExtractor(filePath) {
  const scriptPath = path.join(appDir, "tools", "extract_pdf_text.py");
  let lastError = null;
  for (const pythonPath of getPythonCandidates()) {
    try {
      return await spawnPdfTextExtractor(pythonPath, scriptPath, filePath);
    } catch (error) {
      lastError = error;
      // Çalıştırılabilir bulunamadıysa (ENOENT vb.) sıradaki adaya geç;
      // python çalışıp da hata verdiyse gerçek hatayı hemen bildir.
      if (!error.isSpawnError) throw error;
    }
  }
  throw new Error(
    "PDF metin okuyucu (Python) sunucuda bulunamadı. Sunucuyu yeniden başlatın; "
      + "gerekirse RAPOR_PYTHON ortam değişkeni ile python.exe yolunu belirtin.",
  );
}

async function handlePdfTextApi(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }

  let buffer;
  try {
    buffer = await readBinaryBody(request);
  } catch (error) {
    sendJson(response, error.isPayloadTooLarge ? 413 : 400, { ok: false, error: "Dosya alınamadı." });
    return;
  }
  if (!buffer.length) {
    sendJson(response, 400, { ok: false, error: "PDF dosyası alınamadı." });
    return;
  }
  // İstemcinin content-type/uzantı beyanına güvenme — dosyanın gerçekten PDF
  // olduğunu ilk baytlardaki "%PDF-" imzasıyla doğrula.
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    sendJson(response, 400, { ok: false, error: "Yüklenen dosya geçerli bir PDF değil." });
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
  } catch (error) {
    logServerError("PDF metin çıkarma hatası", error);
    sendJson(response, 502, { ok: false, error: "PDF metni okunamadı. Dosyayı kontrol edip tekrar deneyin." });
  } finally {
    fs.rm(tempPath, { force: true }).catch(() => {});
  }
}

function resolveStaticPath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, `http://${host}:${port}`).pathname);
  const requested = pathname === "/" ? "/index.html" : pathname;
  const relative = requested.replace(/\\/g, "/").replace(/^\/+/, "");
  const resolved = path.resolve(appDir, relative);
  const root = path.resolve(appDir);
  // "root + path.sep" karşılaştırması şart: salt `startsWith(root)` kontrolü,
  // aynı önekle başlayan bir KARDEŞ klasörü (ör. root "...\app" iken
  // "...\app-yedek") de izin verilen alan sanardı.
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  const relativeFromRoot = path.relative(root, resolved);
  const segments = relativeFromRoot.split(path.sep).filter(Boolean);
  if (isSensitivePath(segments)) return null;
  return resolved;
}

async function handleStatic(request, response) {
  const filePath = resolveStaticPath(request.url || "/");
  if (!filePath) {
    applySecurityHeaders(response);
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Erişim reddedildi.");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    applySecurityHeaders(response);
    const baseHeaders = {
      "Content-Type": mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      // iOS Safari (AVFoundation) video oynatmadan önce `Range: bytes=0-1`
      // sondası atar ve sunucu Range desteklemiyorsa (Accept-Ranges + 206)
      // videoyu HİÇ oynatmaz — giriş ekranı arka plan videosunun iOS'ta
      // görünmemesinin kök nedeni buydu. Chrome/Android 200 + tam gövdeyi
      // tolere ettiği için sorun yalnızca iOS'ta görülüyordu.
      "Accept-Ranges": "bytes",
    };
    const rangeHeader = String(request.headers.range || "");
    const rangeMatch = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (rangeMatch && (rangeMatch[1] || rangeMatch[2])) {
      const size = data.length;
      let start = rangeMatch[1] ? Number.parseInt(rangeMatch[1], 10) : NaN;
      let end = rangeMatch[2] ? Number.parseInt(rangeMatch[2], 10) : NaN;
      if (Number.isNaN(start)) {
        // "bytes=-500" biçimi: son N bayt.
        start = Math.max(0, size - end);
        end = size - 1;
      } else if (Number.isNaN(end)) {
        end = size - 1;
      }
      end = Math.min(end, size - 1);
      if (start > end || start >= size) {
        response.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${size}` });
        response.end();
        return;
      }
      response.writeHead(206, {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": end - start + 1,
      });
      response.end(data.subarray(start, end + 1));
      return;
    }
    response.writeHead(200, baseHeaders);
    response.end(data);
  } catch (error) {
    applySecurityHeaders(response);
    if (error.code === "ENOENT") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Dosya bulunamadı.");
      return;
    }
    logServerError(`Statik dosya sunumu hatası (${filePath})`, error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Sunucu hatası.");
  }
}

// Rota başına rate limit (IP başına, sabit pencere). güvenlik.md rehberindeki
// öneriler local/tek-kullanıcılı bu sunucu için ölçeklendirildi.
const API_RATE_LIMITS = {
  "/api/state": { limit: 60, windowMs: 60 * 1000 },
  "/api/overpass": { limit: 30, windowMs: 60 * 1000 },
  "/api/user-pois": { limit: 60, windowMs: 60 * 1000 },
  "/api/neighborhoods": { limit: 60, windowMs: 60 * 1000 },
  "/api/pdf-text": { limit: 5, windowMs: 60 * 1000 },
};

function matchApiRoute(url) {
  for (const route of Object.keys(API_RATE_LIMITS)) {
    if (url.startsWith(route)) return route;
  }
  return null;
}

const server = http.createServer(async (request, response) => {
  try {
    createDailyBackupIfNeeded().catch((error) => console.warn("Backup skipped:", error.message));
    const url = request.url || "/";
    const apiRoute = matchApiRoute(url);

    if (apiRoute) {
      const authenticatedUser = await authenticateRequest(request);
      if (!authenticatedUser) {
        sendUnauthorized(response);
        return;
      }
      request.user = authenticatedUser;

      const { limit, windowMs } = API_RATE_LIMITS[apiRoute];
      const rateKey = `${apiRoute}:${clientKeyFor(request)}`;
      const rate = checkRateLimit(rateKey, limit, windowMs);
      if (rate.limited) {
        sendRateLimited(response, rate.retryAfterSeconds);
        return;
      }

      const isMutating = request.method === "POST" || request.method === "PUT";
      if (isMutating && !isTrustedRequestOrigin(request)) {
        sendJson(response, 403, { ok: false, error: "İstek doğrulanamadı." });
        return;
      }
    }

    if (apiRoute === "/api/state") {
      await handleStateApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/overpass") {
      await handleOverpassApi(request, response);
      return;
    }
    if (apiRoute === "/api/user-pois") {
      await handleUserPoisApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/neighborhoods") {
      await handleNeighborhoodsApi(request, response);
      return;
    }
    if (apiRoute === "/api/pdf-text") {
      await handlePdfTextApi(request, response);
      return;
    }
    await handleStatic(request, response);
  } catch (error) {
    logServerError(`İstek işlenirken hata (${request.method} ${request.url})`, error);
    sendJson(response, 500, { ok: false, error: "Sunucu hatası." });
  }
});

if (require.main === module) {
  server.listen(port, host, () => {
    console.log(`Rapor Yazma yerel sunucu: http://localhost:${port}`);
    createDailyBackupIfNeeded().catch((error) => console.warn("Backup skipped:", error.message));
  });
}

module.exports = {
  loadNeighborhoodRows,
  normalizeNeighborhoodKey,
  normalizeNeighborhoodPlaceKey,
  parseCsvLine,
  queryNeighborhoodRows,
};
