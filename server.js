const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const { createReadStream, existsSync, readdirSync } = require("fs");
const readline = require("readline");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const crypto = require("crypto");
// Yönetici/kullanıcı rolü tek kaynaktan (src/auth/access-control.js zaten
// CommonJS export'u destekliyor) — istemci ve sunucu AYNI "kim admin"
// tanımını kullanır, kopya mantık yazılmaz.
const accessRoles = require("./src/auth/access-control.js");

const appDir = __dirname;
const dataDir = path.join(appDir, "server-data");
const backupDir = path.join(appDir, "backups");
// Banka rapor sablonlari HTTP ile statik olarak verilmez. Sablon metni sadece
// sunucu icinde okunur ve onayli kullanicinin cozulmus alanlariyla doldurulur.
const PRIVATE_REPORT_TEMPLATES = Object.freeze({
  akbank: "akbank.html",
  emlakkatilim: "emlakkatilim.docx",
  halkbank: "halkbank.html",
  isbankasi: "isbankasi.html",
  "isbankasi-masraf": "isbankasi-masraf.html",
  kuveytturk: "kuveytturk.html",
  vakifbank: "vakifbank.html",
  vakifkatilim: "vakifkatilim.html",
  yapikredi: "yapikredi.html",
  ziraat: "ziraat.html",
  "ziraat-arsa-arazi": "ziraat-arsa-arazi.html",
  "ziraat-ek-tablo": "ziraat-ek-tablo.html",
});
const privateTemplateDir = path.join(appDir, "templates");
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || "127.0.0.1";
const firebaseProjectId = String(process.env.RAPOR_FIREBASE_PROJECT_ID || "rapor-yazma-pro").trim();
const firebaseIssuer = `https://securetoken.google.com/${firebaseProjectId}`;
const firebaseCertsUrl = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const neighborhoodCsvFile = path.join(dataDir, "bursa_manuel_duzeltilmis_ana_dosya.csv");
let firebaseCertCache = { certs: null, expiresAt: 0, pending: null };
let neighborhoodRowsPromise = null;
let lastBackupCheckDate = "";
// TCMB gunluk gosterge kurlari: ayni anda tum kullanicilar icin tek kaynaktan
// okunur. Kisa bellek hem TCMB'yi gereksiz sorgulamayi onler hem de anlik servis
// kesintisinde son basarili kurun ekranda kalmasini saglar.
const TCMB_RATES_URL = "https://www.tcmb.gov.tr/kurlar/today.xml";
const TCMB_CACHE_TTL_MS = 10 * 60 * 1000;
const TCMB_STALE_TTL_MS = 36 * 60 * 60 * 1000;
let tcmbRatesCache = { payload: null, fetchedAt: 0, pending: null };

// Statik dosya erişim kapısı (kod koruması): daha önce app.js/index.html gibi
// istemci kaynak kodu HERKESE, giriş yapmadan indirilebiliyordu — sayfa
// içindeki #authGateOverlay yalnızca GÖRSEL bir kapıydı, kodun tarayıcıya
// inmesini engellemiyordu. Artık login.html'de Firebase ile giriş yapılınca
// sunucu, doğrulanmış kimliği bu HttpOnly oturum çerezine bağlıyor; çerez
// olmadan (login.html ve birkaç genel varlık DIŞINDA) hiçbir statik dosya
// sunulmuyor. Süreç yeniden başlatıldığında (deploy) oturumların düşmemesi
// için server-data/sessions.json'a kalıcı olarak yazılır.
const sessionsFile = path.join(dataDir, "sessions.json");
const sessions = new Map(); // sessionId -> { uid, email, expiresAt }
const SESSION_COOKIE_NAME = "rapor_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // kullanıcı seçimi: 7 gün
let sessionsLoaded = false;
let sessionsSaveTimer = null;

// E-posta ile 2 Faktörlü Doğrulama (MFA) — kullanıcı talebi: "her girişte kod
// istemesin, standarda bağlayalım". Google/GitHub/Microsoft'un hepsinin
// kullandığı "güvenilir cihaz" standardı uygulanır: bir cihaz koddan
// GEÇTİKTEN sonra 30 gün boyunca tekrar sorulmaz; farklı bir cihaz/tarayıcı
// veya 30 gün sonrasında kod yeniden istenir. E-posta gönderimi Resend'in
// basit HTTPS API'siyle yapılır (npm bağımlılığı eklenmez — proje "sıfır
// çalışma zamanı bağımlılığı" prensibini korur, bkz. tools/minify-for-deploy.js
// üstündeki not).
//
// RESEND_API_KEY ortam değişkeni AYARLANMAMIŞSA (kullanıcı henüz Resend
// hesabı/domain doğrulamasını tamamlamadıysa) MFA tamamen DEVRE DIŞI kalır —
// mevcut giriş akışı hiç değişmez. Bu, kullanıcı Resend kurulumunu
// tamamlamadan yapılan deploy'ların canlı girişi BOZMAMASI için bilinçli bir
// tasarım kararıdır.
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "Experify <giris@experify.com.tr>").trim();
const MFA_CODE_TTL_MS = 10 * 60 * 1000; // kod 10 dakika gecerli
const MFA_CODE_MAX_ATTEMPTS = 5; // 5 yanlis denemeden sonra kod gecersiz olur
const MFA_CODE_REQUEST_LIMIT_PER_HOUR = 5; // kullanici basina, e-posta bombalamayi onler
const trustedDevicesFile = path.join(dataDir, "trusted-devices.json");
const trustedDevices = new Map(); // deviceId -> { uid, expiresAt }
const TRUST_COOKIE_NAME = "rapor_2fa_trust";
const TRUST_TTL_MS = 30 * 24 * 60 * 60 * 1000; // standart: 30 gun (Google/GitHub/Microsoft ile ayni)
// Kullanici talebi: "yönetici için ... sınırsız cihaz sayısı. diğer
// kullanıcılar için maksimum 3 cihaz". Yönetici (ADMIN_EMAIL) icin cihaz
// sayisi sinirsizdir; diger tum kullanicilar icin bir cihaz 30 gunluk
// guven kazandiginda, eger o kullanicinin zaten 3 guvenilir cihazi varsa
// EN ESKI (once suresi dolacak olan) cihaz cikarilir.
const MAX_TRUSTED_DEVICES_PER_USER = 3;
const mfaCodes = new Map(); // uid -> { code, expiresAt, attempts, email }
const mfaCodeRequestLog = new Map(); // uid -> { windowStart, count }
let trustedDevicesLoaded = false;
let trustedDevicesSaveTimer = null;

// Kullanıcı onay akışı — kullanıcı talebi: "admin only olmayacak herkes
// oluşturabilecek ancak ben admin onay vermeden sisteme giriş yapamayacak".
// login.html'de HERKES kendi hesabını oluşturabilir (Firebase client SDK,
// createUserWithEmailAndPassword — genel API anahtarıyla çalışır, ek yetki
// gerekmez); ama hesap oluşturmak GİRİŞ YAPMAK anlamına gelmez —
// isUserApproved() false döndüğü sürece /api/session oturum çerezi
// VERMEZ. Yönetici (ADMIN_EMAIL) her zaman otomatik onaylıdır (aksi halde
// kimse kimseyi onaylayamaz — "kim onaylayacak" sorununu önler).
const pendingUsersFile = path.join(dataDir, "pending-users.json");
const approvedUsersFile = path.join(dataDir, "approved-users.json");
// Ayrıcalıklı (privileged) kullanıcılar — kullanıcı talebi: "yetki verdiğim
// kullanıcılar bu kısımları görebilsin". Yönetici (ADMIN_EMAIL) her zaman
// ayrıcalıklıdır; bunun dışındaki kullanıcılar admin-users.html panelinden
// tek tek işaretlenir. Onaylı olmak (approvedUsers) ile ayrıcalıklı olmak
// (privilegedUsers) BAĞIMSIZ iki kavramdır — ayrıcalık, onaydan SONRA verilir.
const privilegedUsersFile = path.join(dataDir, "privileged-users.json");
const pendingUsers = new Map(); // uid -> { email, requestedAt }
const approvedUsers = new Map(); // uid -> { email, approvedAt }
const privilegedUsers = new Set(); // uid
let approvalStateLoaded = false;
let approvalStateSaveTimer = null;

// Etkinlik günlüğü — kullanıcı talebi: "kullanıcı verilerini kullanıcı
// kayıtlarını ve kullanıcının loglarını ... tüm erişime sahip olabileceğim
// bir dashboard istiyorum ... kaç adet rapor oluşturdu, bir raporu ne
// kadar sürede oluşturdu gibi istatistiki verileri görmek istiyorum".
// Giriş/çıkış (login/logout) ve rapor oluşturma/dışa aktarma (created/
// exported) olaylarını sınırlı boyutlu, kalıcı bir günlükte tutar.
// Rapor İÇERİĞİ ASLA loglanmaz — yalnızca opaque reportId (RE-YYYY-XXXXXX,
// kimlik bilgisi içermez). Admin dashboard (admin-users.html) bunu okuyup
// "kaç rapor oluşturdu" / "ortalama tamamlama süresi" gibi istatistikleri
// hesaplar (bkz. computeUserReportStats).
const activityEventsFile = path.join(dataDir, "activity-events.json");
const activityEvents = []; // { type, uid, email, reportId, at, ip, userAgent }
const ACTIVITY_EVENTS_MAX = 20000;
let activityEventsLoaded = false;
let activityEventsSaveTimer = null;

// Resmi banka paketi, oturum açmış/onaylı kullanıcı için sunucunun imzaladığı
// bir sertifika ile birlikte üretilir. Anahtar tarayıcıya hiç gitmez; ilk
// çalışmada server-data içinde oluşturulur ve statik erişime kapalıdır.
const exportSigningKeyFile = path.join(dataDir, "export-signing-key.txt");
let exportSigningKeyPromise = null;

function isMfaConfigured() {
  return Boolean(RESEND_API_KEY);
}

// login.html'in kendisini ve giriş yapabilmesi için ihtiyaç duyduğu Firebase
// SDK / yapılandırma / ikon dosyalarını session ÇEREZİ OLMADAN da sunar.
// Buradaki HİÇBİR dosya iş mantığı (formüller, banka tabloları, şablonlar)
// içermez — sadece genel Firebase istemci SDK'sı ve marka ikonlarıdır.
function isPublicStaticFile(relativePath) {
  if (relativePath === "login.html") return true;
  if (relativePath === "manifest.json") return true;
  if (relativePath.startsWith("icons/")) return true;
  if (relativePath.startsWith("vendor/firebase/")) return true;
  if (relativePath === "cloud/firebase-config.js") return true;
  return false;
}

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
  "sessions.json",
  "trusted-devices.json",
  "pending-users.json",
  "approved-users.json",
  "privileged-users.json",
  "activity-events.json",
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

async function getExportSigningKey() {
  if (!exportSigningKeyPromise) {
    exportSigningKeyPromise = (async () => {
      try {
        const existing = (await fs.readFile(exportSigningKeyFile, "utf8")).trim();
        if (/^[a-f0-9]{64,}$/i.test(existing)) return existing;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      const generated = crypto.randomBytes(48).toString("hex");
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(exportSigningKeyFile, generated, { encoding: "utf8", mode: 0o600 });
      return generated;
    })();
  }
  return exportSigningKeyPromise;
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

  if (operation === "choices") {
    const level = String(payload?.level || "");
    let values = [];
    if (level === "city") {
      values = rows.map((row) => row.city);
    } else if (level === "district") {
      values = cityKey ? rows.filter((row) => row.cityKey === cityKey).map((row) => row.district) : [];
    } else if (level === "neighborhood") {
      values = cityKey && districtKey
        ? rows.filter((row) => row.cityKey === cityKey && row.districtKey === districtKey).map((row) => row.neighborhood)
        : [];
    } else {
      throw new Error("Mahalle seçim türü desteklenmiyor.");
    }
    return {
      choices: [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, "tr")),
    };
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
  // Uygulama build'siz vanilla JS: birkaç sayfa-içi <script> bloğu var; bu
  // yüzden 'unsafe-inline' tutulur. Leaflet yerel vendor dosyalarından yüklenir,
  // böylece harita deneyimi CDN/CSP erişimine bağlı kalmaz.
  // Yine de yabancı script/frame/obje kaynaklarını ve clickjacking'i engeller.
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
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

async function loadSessionsOnce() {
  if (sessionsLoaded) return;
  sessionsLoaded = true;
  try {
    const raw = await fs.readFile(sessionsFile, "utf8");
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && typeof parsed === "object") {
      for (const [id, entry] of Object.entries(parsed)) {
        if (entry && Number(entry.expiresAt) > now) sessions.set(id, entry);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Oturum dosyası okunamadı", error);
  }
}

function saveSessionsSoon() {
  if (sessionsSaveTimer) return;
  sessionsSaveTimer = setTimeout(async () => {
    sessionsSaveTimer = null;
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(sessionsFile, JSON.stringify(Object.fromEntries(sessions)), "utf8");
    } catch (error) {
      logServerError("Oturum dosyası yazılamadı", error);
    }
  }, 200);
  sessionsSaveTimer.unref?.();
}

function createSession(uid, email) {
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(id, { uid, email: email || null, expiresAt });
  saveSessionsSoon();
  return { id, expiresAt };
}

function destroySession(id) {
  if (id && sessions.delete(id)) saveSessionsSoon();
}

function parseCookieHeader(request) {
  const header = String(request.headers.cookie || "");
  const cookies = {};
  header.split(";").forEach((part) => {
    const eq = part.indexOf("=");
    if (eq < 0) return;
    const key = part.slice(0, eq).trim();
    if (!key) return;
    try {
      cookies[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      cookies[key] = part.slice(eq + 1).trim();
    }
  });
  return cookies;
}

async function getSessionFromRequest(request) {
  await loadSessionsOnce();
  const id = parseCookieHeader(request)[SESSION_COOKIE_NAME];
  if (!id) return null;
  const entry = sessions.get(id);
  if (!entry) return null;
  if (Number(entry.expiresAt) <= Date.now()) {
    sessions.delete(id);
    saveSessionsSoon();
    return null;
  }
  return { id, uid: entry.uid, email: entry.email };
}

// Yerelde (127.0.0.1/localhost) http üzerinden test edilebilsin diye
// `Secure` bayrağı yalnızca gerçek (https) host'larda eklenir — aksi halde
// tarayıcı çerezi http'de asla kaydetmez ve yerel giriş testi imkansız olur.
function isLocalHost(request) {
  const hostHeader = String(request.headers.host || "").split(":")[0];
  return hostHeader === "localhost" || hostHeader === "127.0.0.1" || hostHeader === "::1";
}

// NOT: response.setHeader("Set-Cookie", ...) İKİNCİ kez çağrılırsa BİRİNCİYİ
// SESSİZCE EZER (Node.js davranışı) — bir yanıtta hem oturum hem güvenilir
// cihaz çerezi AYNI ANDA verilmesi gerektiğinden (bkz. verifyMfaCode),
// appendHeader kullanılır; bu birden fazla Set-Cookie başlığını doğru
// şekilde biriktirir.
function appendCookie(request, response, name, value, maxAgeSeconds) {
  const secureFlag = isLocalHost(request) ? "" : " Secure;";
  response.appendHeader("Set-Cookie", `${name}=${value}; Path=/; HttpOnly;${secureFlag} SameSite=Lax; Max-Age=${maxAgeSeconds}`);
}

function setSessionCookie(request, response, id, expiresAt) {
  appendCookie(request, response, SESSION_COOKIE_NAME, id, Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
}

function clearSessionCookie(request, response) {
  appendCookie(request, response, SESSION_COOKIE_NAME, "", 0);
}

function setTrustCookie(request, response, id, expiresAt) {
  appendCookie(request, response, TRUST_COOKIE_NAME, id, Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
}

async function loadTrustedDevicesOnce() {
  if (trustedDevicesLoaded) return;
  trustedDevicesLoaded = true;
  try {
    const raw = await fs.readFile(trustedDevicesFile, "utf8");
    const parsed = JSON.parse(raw);
    const now = Date.now();
    if (parsed && typeof parsed === "object") {
      for (const [id, entry] of Object.entries(parsed)) {
        if (entry && Number(entry.expiresAt) > now) trustedDevices.set(id, entry);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Güvenilir cihaz dosyası okunamadı", error);
  }
}

function saveTrustedDevicesSoon() {
  if (trustedDevicesSaveTimer) return;
  trustedDevicesSaveTimer = setTimeout(async () => {
    trustedDevicesSaveTimer = null;
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(trustedDevicesFile, JSON.stringify(Object.fromEntries(trustedDevices)), "utf8");
    } catch (error) {
      logServerError("Güvenilir cihaz dosyası yazılamadı", error);
    }
  }, 200);
  trustedDevicesSaveTimer.unref?.();
}

async function isRequestFromTrustedDevice(request, uid) {
  await loadTrustedDevicesOnce();
  const id = parseCookieHeader(request)[TRUST_COOKIE_NAME];
  if (!id) return false;
  const entry = trustedDevices.get(id);
  if (!entry || entry.uid !== uid) return false;
  if (Number(entry.expiresAt) <= Date.now()) {
    trustedDevices.delete(id);
    saveTrustedDevicesSoon();
    return false;
  }
  return true;
}

function evictOldestTrustedDevicesForUser(uid, keepUnder) {
  const entries = Array.from(trustedDevices.entries())
    .filter(([, entry]) => entry.uid === uid)
    .sort((a, b) => Number(a[1].expiresAt) - Number(b[1].expiresAt)); // en eski (once dolacak) once
  while (entries.length >= keepUnder) {
    const [oldestId] = entries.shift();
    trustedDevices.delete(oldestId);
  }
}

function markDeviceTrusted(uid, email) {
  // Yonetici sinirsiz cihaz; diger tum kullanicilar icin 3 cihaz sinirini
  // asmamak adina yeni cihaz eklenmeden once en eskisi cikarilir.
  if (!accessRoles.isAdminEmail(email)) {
    evictOldestTrustedDevicesForUser(uid, MAX_TRUSTED_DEVICES_PER_USER);
  }
  const id = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + TRUST_TTL_MS;
  trustedDevices.set(id, { uid, expiresAt });
  saveTrustedDevicesSoon();
  return { id, expiresAt };
}

// İlk yükleme: approved-users.json HİÇ YOKSA (bu özelliğin ilk devreye
// girdiği an), o ana kadar en az bir kez oturum açmış (sessions.json) veya
// güvenilir cihazı olan (trusted-devices.json) her uid otomatik onaylı
// sayılır — aksi halde bu özelliğin devreye girdiği gün, halihazırda
// hesabı olup kullanan herkes aniden kilitlenir. BUNDAN SONRA oluşturulan
// yeni hesaplar bu listede olmadığından normal şekilde onay bekler.
async function loadApprovalStateOnce() {
  if (approvalStateLoaded) return;
  approvalStateLoaded = true;
  let approvedFileExisted = true;
  try {
    const raw = await fs.readFile(approvedUsersFile, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Eski format (0.0.290): sadece uid dizisi. Geriye dönük uyumluluk için
      // e-posta/approvedAt bilgisi olmadan Map'e taşınır.
      parsed.forEach((uid) => approvedUsers.set(uid, { email: null, approvedAt: null }));
    } else if (parsed && typeof parsed === "object") {
      for (const [uid, entry] of Object.entries(parsed)) {
        approvedUsers.set(uid, {
          email: entry?.email ?? null,
          approvedAt: entry?.approvedAt ?? null,
          status: entry?.status === "suspended" ? "suspended" : "active",
          fullName: entry?.fullName ?? null,
          phone: entry?.phone ?? null,
          workType: entry?.workType ?? null,
          company: entry?.company ?? null,
          updatedAt: entry?.updatedAt ?? null,
        });
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Onaylı kullanıcı dosyası okunamadı", error);
    else approvedFileExisted = false;
  }
  try {
    const raw = await fs.readFile(pendingUsersFile, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      for (const [uid, entry] of Object.entries(parsed)) pendingUsers.set(uid, entry);
    }
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Bekleyen kullanıcı dosyası okunamadı", error);
  }
  try {
    const raw = await fs.readFile(privilegedUsersFile, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) parsed.forEach((uid) => privilegedUsers.add(uid));
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Ayrıcalıklı kullanıcı dosyası okunamadı", error);
  }
  if (!approvedFileExisted) {
    await loadSessionsOnce();
    await loadTrustedDevicesOnce();
    const grandfatheredUids = new Set([
      ...Array.from(sessions.values()).map((entry) => entry.uid),
      ...Array.from(trustedDevices.values()).map((entry) => entry.uid),
    ]);
    if (grandfatheredUids.size) {
      const approvedAt = new Date().toISOString();
      grandfatheredUids.forEach((uid) => approvedUsers.set(uid, { email: null, approvedAt }));
      saveApprovalStateSoon();
    }
  }
}

function saveApprovalStateSoon() {
  if (approvalStateSaveTimer) return;
  approvalStateSaveTimer = setTimeout(async () => {
    approvalStateSaveTimer = null;
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await Promise.all([
        fs.writeFile(approvedUsersFile, JSON.stringify(Object.fromEntries(approvedUsers)), "utf8"),
        fs.writeFile(pendingUsersFile, JSON.stringify(Object.fromEntries(pendingUsers)), "utf8"),
        fs.writeFile(privilegedUsersFile, JSON.stringify(Array.from(privilegedUsers)), "utf8"),
      ]);
    } catch (error) {
      logServerError("Kullanıcı onay dosyaları yazılamadı", error);
    }
  }, 200);
  approvalStateSaveTimer.unref?.();
}

async function isUserApproved(uid, email) {
  if (accessRoles.isAdminEmail(email)) return true;
  await loadApprovalStateOnce();
  const entry = approvedUsers.get(uid);
  // Eski kayitlarda status alani yoktur; bunlar geriye donuk uyumluluk icin
  // aktif kabul edilir. Yalnizca yoneticinin acikca pasife aldigi hesaplar
  // uygulama oturumu ve korumali cikti alamaz.
  return Boolean(entry) && entry.status !== "suspended";
}

// Üçüncü erişim katmanı — kullanıcı talebi: "normal kullanıcılar ...
// açıklamalar ve masraf bölümünü göremeyecek ... yetki verdiğim kullanıcılar
// bu kısımları görebilsin". Yönetici her zaman ayrıcalıklıdır.
async function isUserPrivileged(uid, email) {
  if (accessRoles.isAdminEmail(email)) return true;
  await loadApprovalStateOnce();
  return approvedUserStatus(approvedUsers.get(uid)) === "active" && privilegedUsers.has(uid);
}

// Kayıt formu (login.html) profil alanları — kullanıcı talebi: "kullanıcı
// oluşturma ekranında ad soyad email ve telefon numarası zorunlu olsun.
// Çalışma Türü Kadrolu, Çözüm Ortağı, Bağımsız, Lisanslı Değerleme Şirketi
// olsun". Sunucu tarafında da kaba bir doğrulama yapılır (uzunluk sınırı,
// bilinen çalışma türü) — asıl zorunluluk login.html'in `required` alanları
// ile sağlanır, burası savunma amaçlıdır.
const WORK_TYPE_OPTIONS = ["Kadrolu", "Çözüm Ortağı", "Bağımsız", "Lisanslı Değerleme Şirketi"];

function sanitizeProfileField(value, maxLength) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function sanitizeRegistrationProfile(profile) {
  const workType = sanitizeProfileField(profile?.workType, 60);
  return {
    fullName: sanitizeProfileField(profile?.fullName, 120),
    phone: sanitizeProfileField(profile?.phone, 40),
    workType: WORK_TYPE_OPTIONS.includes(workType) ? workType : null,
    company: sanitizeProfileField(profile?.company, 160),
  };
}

// Dönüş değeri: bu çağrı GERÇEKTEN yeni bir bekleyen kayıt oluşturduysa
// true (çağıran, örn. handleRegisterPendingApi, bunu admin bildirim
// e-postası göndermek için kullanır — zaten onaylı/zaten bekleyen bir
// kullanıcı tekrar "kayıt olsa" bile e-posta TEKRARLANMAMALI).
async function registerPendingUser(uid, email, profile) {
  await loadApprovalStateOnce();
  if (approvedUsers.has(uid)) return false;
  if (!pendingUsers.has(uid)) {
    pendingUsers.set(uid, {
      email: email || null,
      requestedAt: new Date().toISOString(),
      ...sanitizeRegistrationProfile(profile),
    });
    saveApprovalStateSoon();
    return true;
  }
  return false;
}

async function approveUser(uid) {
  await loadApprovalStateOnce();
  const pendingEntry = pendingUsers.get(uid);
  const previousApproved = approvedUsers.get(uid);
  const email = pendingEntry?.email ?? previousApproved?.email ?? null;
  approvedUsers.set(uid, {
    email,
    approvedAt: new Date().toISOString(),
    status: "active",
    fullName: pendingEntry?.fullName ?? previousApproved?.fullName ?? null,
    phone: pendingEntry?.phone ?? previousApproved?.phone ?? null,
    workType: pendingEntry?.workType ?? previousApproved?.workType ?? null,
    company: pendingEntry?.company ?? previousApproved?.company ?? null,
  });
  pendingUsers.delete(uid);
  saveApprovalStateSoon();
}

function approvedUserStatus(entry) {
  return entry?.status === "suspended" ? "suspended" : "active";
}

async function updateOwnUserProfile(uid, email, profile) {
  await loadApprovalStateOnce();
  const current = approvedUsers.get(uid);
  if (!current) return null;
  const safe = sanitizeRegistrationProfile(profile);
  const next = {
    ...current,
    // E-posta Firebase kimlik belirtecinden gelir; istemci girdiğine guvenilmez.
    email: sanitizeProfileField(email, 320) || current.email || null,
    fullName: Object.hasOwn(profile || {}, "fullName") ? safe.fullName : current.fullName ?? null,
    phone: Object.hasOwn(profile || {}, "phone") ? safe.phone : current.phone ?? null,
    workType: Object.hasOwn(profile || {}, "workType") ? safe.workType : current.workType ?? null,
    company: Object.hasOwn(profile || {}, "company") ? safe.company : current.company ?? null,
    updatedAt: new Date().toISOString(),
  };
  approvedUsers.set(uid, next);
  saveApprovalStateSoon();
  return next;
}

async function setManagedUserStatus(uid, status) {
  await loadApprovalStateOnce();
  const current = approvedUsers.get(uid);
  if (!current) return null;
  const nextStatus = status === "suspended" ? "suspended" : "active";
  approvedUsers.set(uid, { ...current, status: nextStatus, updatedAt: new Date().toISOString() });
  if (nextStatus === "suspended") privilegedUsers.delete(uid);
  saveApprovalStateSoon();
  return approvedUsers.get(uid);
}

async function revokeUserSessionsAndTrustedDevices(uid) {
  await loadSessionsOnce();
  await loadTrustedDevicesOnce();
  let sessionsChanged = false;
  let trustedChanged = false;
  for (const [id, entry] of sessions.entries()) {
    if (entry?.uid === uid) {
      sessions.delete(id);
      sessionsChanged = true;
    }
  }
  for (const [id, entry] of trustedDevices.entries()) {
    if (entry?.uid === uid) {
      trustedDevices.delete(id);
      trustedChanged = true;
    }
  }
  if (sessionsChanged) saveSessionsSoon();
  if (trustedChanged) saveTrustedDevicesSoon();
}

async function deleteManagedUser(uid) {
  await loadApprovalStateOnce();
  const existed = approvedUsers.delete(uid) || pendingUsers.delete(uid);
  privilegedUsers.delete(uid);
  if (existed) saveApprovalStateSoon();
  await revokeUserSessionsAndTrustedDevices(uid);
  return existed;
}

async function rejectPendingUser(uid) {
  await loadApprovalStateOnce();
  if (pendingUsers.delete(uid)) saveApprovalStateSoon();
}

async function listPendingUsers() {
  await loadApprovalStateOnce();
  return Array.from(pendingUsers.entries()).map(([uid, entry]) => ({
    uid,
    email: entry.email,
    requestedAt: entry.requestedAt,
    fullName: entry.fullName ?? null,
    phone: entry.phone ?? null,
    workType: entry.workType ?? null,
    company: entry.company ?? null,
  }));
}

async function listApprovedUsers() {
  await loadApprovalStateOnce();
  return Array.from(approvedUsers.entries())
    .filter(([uid]) => !accessRoles.isAdminEmail(approvedUsers.get(uid)?.email))
    .map(([uid, entry]) => ({
      uid,
      email: entry.email,
      approvedAt: entry.approvedAt,
      fullName: entry.fullName ?? null,
      phone: entry.phone ?? null,
      workType: entry.workType ?? null,
      company: entry.company ?? null,
      status: approvedUserStatus(entry),
      privileged: privilegedUsers.has(uid),
    }));
}

async function grantPrivilege(uid) {
  await loadApprovalStateOnce();
  privilegedUsers.add(uid);
  saveApprovalStateSoon();
}

async function revokePrivilege(uid) {
  await loadApprovalStateOnce();
  if (privilegedUsers.delete(uid)) saveApprovalStateSoon();
}

async function loadActivityEventsOnce() {
  if (activityEventsLoaded) return;
  activityEventsLoaded = true;
  try {
    const raw = await fs.readFile(activityEventsFile, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) activityEvents.push(...parsed);
  } catch (error) {
    if (error.code !== "ENOENT") logServerError("Etkinlik günlüğü okunamadı", error);
  }
}

function saveActivityEventsSoon() {
  if (activityEventsSaveTimer) return;
  activityEventsSaveTimer = setTimeout(async () => {
    activityEventsSaveTimer = null;
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(activityEventsFile, JSON.stringify(activityEvents), "utf8");
    } catch (error) {
      logServerError("Etkinlik günlüğü yazılamadı", error);
    }
  }, 200);
  activityEventsSaveTimer.unref?.();
}

// Kullanıcı talebi: "sistem içerisinde oluşturulan her raporun ana
// başlıklarını liste halinde görmek istiyorum. oluşturan kullanıcı banka
// il ilçe mahalle ada parsel var ise blok bağımsız bölüm no gayrimenkul
// niteliği rapor numarası" — admin, TÜM kullanıcıların raporlarının bir
// özetini görebilsin istiyor. Bu, mevcut "rapor İÇERİĞİ asla loglanmaz"
// kuralına BİLİNÇLİ, DAR bir istisna: yalnızca aşağıdaki 9 alanın (tüm
// rapor verisinin küçük bir alt kümesi) özeti, kullanıcı tarafından
// ONAYLANDIKTAN sonra eklendi. `resolveTemplateTokenValues` gibi rapor
// içeriğinin TAMAMINI kapsayan bir akışa ASLA bağlanma; yalnızca bu
// whitelist'i genişletmeden önce kullanıcıya tekrar sor.
const REPORT_SUMMARY_FIELDS = ["city", "district", "neighborhood", "blockNo", "parcelNo", "titleBlockName", "unitNo", "titleQuality", "bank"];

function sanitizeReportSummary(raw) {
  if (!raw || typeof raw !== "object") return null;
  const summary = {};
  let hasValue = false;
  for (const key of REPORT_SUMMARY_FIELDS) {
    const value = sanitizeProfileField(raw[key], 120);
    if (value) hasValue = true;
    summary[key] = value;
  }
  return hasValue ? summary : null;
}

async function logActivityEvent(type, uid, email, extra = {}) {
  await loadActivityEventsOnce();
  activityEvents.push({
    type,
    uid: uid || null,
    email: email || null,
    reportId: extra.reportId || null,
    at: new Date().toISOString(),
    ip: extra.ip || null,
    userAgent: extra.userAgent || null,
    summary: sanitizeReportSummary(extra.summary),
    templateKey: sanitizeProfileField(extra.templateKey, 80),
    // Kullanıcı talebi (admin paneli eleştirel değerlendirme, Faz 1,
    // 2026-08-07): admin işlemlerinin (onay/red/yetki/askıya alma/silme)
    // KİMİN yaptığını da kaydet — önceden yalnızca HEDEF kullanıcının
    // uid/email'i tutuluyordu, işlemi yapan admin hiç görünmüyordu.
    actorUid: sanitizeProfileField(extra.actorUid, 200),
    actorEmail: sanitizeProfileField(extra.actorEmail, 320),
  });
  if (activityEvents.length > ACTIVITY_EVENTS_MAX) {
    activityEvents.splice(0, activityEvents.length - ACTIVITY_EVENTS_MAX);
  }
  saveActivityEventsSoon();
}

async function listLoginEvents(limit = 500) {
  await loadActivityEventsOnce();
  return activityEvents
    .filter((event) => event.type === "login" || event.type === "logout")
    .slice(-limit)
    .reverse();
}

// Kullanıcı talebi (admin paneli eleştirel değerlendirme, Faz 1): admin
// tarafından yapılan kullanıcı-yönetimi işlemlerinin (onay/red/yetki
// verme-alma/askıya alma-aktifleştirme/silme) TAMAMI için tek bir denetim
// listesi — kim, kime, ne zaman, ne yaptı.
const ADMIN_ACTION_EVENT_TYPES = [
  "user-approved",
  "user-rejected",
  "privilege-granted",
  "privilege-revoked",
  "account-suspended",
  "account-activated",
  "account-deleted-by-admin",
];

async function listAdminActionEvents(limit = 500) {
  await loadActivityEventsOnce();
  return activityEvents
    .filter((event) => ADMIN_ACTION_EVENT_TYPES.includes(event.type))
    .slice(-limit)
    .reverse();
}

// "Kaç rapor oluşturdu" / "bir raporu ne kadar sürede tamamladı"
// istatistikleri — rapor İÇERİĞİNE hiç bakmadan, yalnızca "report-created"
// ve "report-exported" olay çiftlerinin zaman damgalarından hesaplanır.
// Süre = aynı reportId için İLK "created" ile İLK "exported" arasındaki fark
// (ilk dışa aktarma "tamamlandı" için makul bir vekil gösterge).
async function computeUserReportStats() {
  await loadApprovalStateOnce();
  await loadActivityEventsOnce();
  const byUid = new Map(); // uid -> { email, createdAt: Map(reportId->at), exportedAt: Map(reportId->at) }
  const ensure = (uid, email) => {
    if (!byUid.has(uid)) {
      byUid.set(uid, { email: email || null, createdAt: new Map(), exportedAt: new Map() });
    }
    const entry = byUid.get(uid);
    if (email && !entry.email) entry.email = email;
    return entry;
  };
  activityEvents.forEach((event) => {
    if (!event.uid || !event.reportId) return;
    if (event.type !== "report-created" && event.type !== "report-exported") return;
    const entry = ensure(event.uid, event.email);
    const bucket = event.type === "report-created" ? entry.createdAt : entry.exportedAt;
    if (!bucket.has(event.reportId)) bucket.set(event.reportId, event.at);
  });
  const results = [];
  for (const [uid, entry] of byUid.entries()) {
    const durations = [];
    let lastCreatedAt = null;
    let lastExportedAt = null;
    entry.createdAt.forEach((createdAt, reportId) => {
      if (!lastCreatedAt || createdAt > lastCreatedAt) lastCreatedAt = createdAt;
      const exportedAt = entry.exportedAt.get(reportId);
      if (exportedAt) {
        const durationMs = new Date(exportedAt).getTime() - new Date(createdAt).getTime();
        if (Number.isFinite(durationMs) && durationMs >= 0) durations.push(durationMs);
      }
    });
    entry.exportedAt.forEach((exportedAt) => {
      if (!lastExportedAt || exportedAt > lastExportedAt) lastExportedAt = exportedAt;
    });
    const avgDurationMs = durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : null;
    results.push({
      uid,
      email: entry.email || approvedUsers.get(uid)?.email || null,
      reportsCreated: entry.createdAt.size,
      reportsExported: durations.length,
      avgDurationMs,
      minDurationMs: durations.length ? Math.min(...durations) : null,
      maxDurationMs: durations.length ? Math.max(...durations) : null,
      lastCreatedAt,
      lastExportedAt,
    });
  }
  results.sort((a, b) => (b.reportsCreated || 0) - (a.reportsCreated || 0));
  return results;
}

// Kullanıcı talebi: "sistem içerisinde oluşturulan her raporun ana
// başlıklarını liste halinde görmek istiyorum. oluşturan kullanıcı banka
// il ilçe mahalle ada parsel var ise blok bağımsız bölüm no gayrimenkul
// niteliği rapor numarası" — yalnızca admin panelinde, tek satırda bir
// rapor için: kimin oluşturduğu, hangi banka şablonuyla dışa aktarıldığı,
// ve REPORT_SUMMARY_FIELDS whitelist'indeki adres/tapu özeti. Aynı
// reportId için birden çok olay (created/exported/export-authorized)
// olabilir; en SON gelen (en dolu) summary alanları kazanır — rapor
// zamanla dolduruldukça özet de tazelenir. reportId (RE-YYYY-XXXXXX
// formatında) zaten kullanıcının "rapor numarası" dediği şey.
async function computeReportListForAdmin() {
  await loadActivityEventsOnce();
  const byReportId = new Map(); // reportId -> { uid, email, templateKey, summary, createdAt, lastExportedAt, lastEventAt }
  activityEvents.forEach((event) => {
    if (!event.reportId) return;
    if (!["report-created", "report-exported", "report-export-authorized"].includes(event.type)) return;
    if (!byReportId.has(event.reportId)) {
      byReportId.set(event.reportId, {
        reportId: event.reportId,
        uid: event.uid || null,
        email: event.email || null,
        templateKey: null,
        summary: {},
        createdAt: null,
        lastExportedAt: null,
        lastEventAt: null,
      });
    }
    const entry = byReportId.get(event.reportId);
    if (event.email && !entry.email) entry.email = event.email;
    if (event.uid && !entry.uid) entry.uid = event.uid;
    if (event.templateKey) entry.templateKey = event.templateKey;
    if (event.summary) {
      for (const key of REPORT_SUMMARY_FIELDS) {
        if (event.summary[key]) entry.summary[key] = event.summary[key];
      }
    }
    if (event.type === "report-created" && (!entry.createdAt || event.at < entry.createdAt)) entry.createdAt = event.at;
    if (event.type === "report-exported" && (!entry.lastExportedAt || event.at > entry.lastExportedAt)) entry.lastExportedAt = event.at;
    if (!entry.lastEventAt || event.at > entry.lastEventAt) entry.lastEventAt = event.at;
  });
  const results = Array.from(byReportId.values()).map((entry) => ({
    ...entry,
    email: entry.email || approvedUsers.get(entry.uid)?.email || null,
  }));
  results.sort((a, b) => String(b.lastEventAt || "").localeCompare(String(a.lastEventAt || "")));
  return results;
}

function generateMfaCode() {
  // 000000-999999 arasi 6 haneli, basindaki sifirlar korunur (padStart).
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

function escapeEmailHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Kullanıcı talebi: "yeni bir kullanıcı hesap oluşturma isteğinde
// bulunduğunda admine mail gelsin böylelikle gözden kaçırmam" — yeni bir
// "onay bekliyor" kaydı oluşturulduğunda (handleRegisterPendingApi) admine
// gönderilir. Profil alanları (fullName/phone/workType/company) kullanıcı
// girdisi olduğundan HTML kaçışlaması ZORUNLU (e-posta gövdesine enjeksiyon
// riski).
function buildNewUserNotificationEmailHtml(profile) {
  const rows = [
    ["E-posta", profile.email],
    ["Ad Soyad", profile.fullName],
    ["Telefon", profile.phone],
    ["Çalışma Türü", profile.workType],
    ["Şirket", profile.company],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `<tr><td style="padding:4px 10px 4px 0;color:#5a6576;font-size:13px;white-space:nowrap;">${escapeEmailHtml(label)}</td><td style="padding:4px 0;color:#152238;font-size:13px;font-weight:700;">${escapeEmailHtml(value)}</td></tr>`)
    .join("");
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f2f4f8;font-family:Arial,sans-serif;">
    <div style="max-width:460px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 24px;">
      <p style="margin:0 0 4px;font-weight:800;font-size:15px;color:#111d3d;">Yeni Kullanıcı Onayı Bekliyor</p>
      <p style="margin:0 0 18px;color:#5a6576;font-size:13px;">Experify'de yeni bir hesap oluşturuldu ve girişe izin verilmeden önce onayınızı bekliyor.</p>
      <table style="border-collapse:collapse;width:100%;margin:0 0 20px;">${rows}</table>
      <a href="https://experify.com.tr/admin-users.html" style="display:inline-block;background:#213f77;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:10px 18px;border-radius:8px;">Kullanıcı Onayları'nı Aç</a>
    </div>
  </body></html>`;
}

function buildMfaEmailHtml(code) {
  return `<!doctype html><html lang="tr"><body style="margin:0;padding:24px;background:#f2f4f8;font-family:Arial,sans-serif;">
    <div style="max-width:420px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 24px;">
      <p style="margin:0 0 4px;font-weight:800;font-size:15px;color:#111d3d;">Experify Giriş Kodu</p>
      <p style="margin:0 0 20px;color:#5a6576;font-size:13px;">Yeni bir cihazdan/tarayıcıdan giriş isteği alındı. Devam etmek için aşağıdaki kodu girin.</p>
      <p style="margin:0 0 20px;font-size:32px;font-weight:800;letter-spacing:0.12em;color:#213f77;text-align:center;">${code}</p>
      <p style="margin:0 0 6px;color:#5a6576;font-size:12px;">Bu kod 10 dakika içinde geçerliliğini yitirir.</p>
      <p style="margin:0;color:#8a99ad;font-size:12px;">Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; hesabınızda herhangi bir değişiklik yapılmadı.</p>
    </div>
  </body></html>`;
}

// Kullanici raporu: "eposta doğrulama kodu spam a düştü" — Resend'de
// domain SPF/DKIM/DMARC doğrulanmış olsa bile yalnızca HTML gövdeli
// (düz-metin alternatifi olmayan) e-postalar bazı spam filtrelerinde
// (özellikle kurumsal/Outlook tarafında) ceza puanı alır. Bu fonksiyon
// gönderilen HTML'den basit bir düz-metin alternatifi türetir; çağıran
// isterse kendi metnini de verebilir (opsiyonel 4. parametre).
function stripEmailHtmlToText(html) {
  return String(html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|table|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sendEmailViaResend(toEmail, subject, html, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [toEmail],
      subject,
      html,
      text: text || stripEmailHtmlToText(html),
    });
    const request = https.request(
      {
        method: "POST",
        hostname: "api.resend.com",
        path: "/emails",
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => { body += chunk; });
        response.on("end", () => {
          if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
          } else {
            reject(new Error(`Resend API ${response.statusCode}: ${body.slice(0, 300)}`));
          }
        });
      },
    );
    request.on("timeout", () => request.destroy(new Error("Resend API zaman aşımına uğradı.")));
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
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

// Kullanıcı talebi (admin paneli Faz 3, "Basit/gerçekçi olan" sağlık
// kartı, 2026-08-07): yeni bir izleme altyapısı KURMADAN, zaten var olan
// veriden (bellekteki Map'ler, dosya boyutları, process.uptime) basit bir
// sistem özeti üretir. Uploads klasörü derin/patalojik olabileceğinden
// dosya sayısı bir üst sınırla (MAX_SCAN_ENTRIES) sınırlanır — aşılırsa
// "en az" olarak işaretlenir, tarama durur (sonsuz/çok yavaş tarama riski
// yok).
const SYSTEM_HEALTH_MAX_SCAN_ENTRIES = 5000;

async function computeDirectorySize(rootDir) {
  const result = { bytes: 0, fileCount: 0, truncated: false };
  async function walk(dir) {
    if (result.truncated) return;
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (result.fileCount >= SYSTEM_HEALTH_MAX_SCAN_ENTRIES) {
        result.truncated = true;
        return;
      }
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (entry.isFile()) {
        try {
          const stat = await fs.stat(entryPath);
          result.bytes += stat.size;
          result.fileCount += 1;
        } catch {
          /* dosya tarama sırasında silinmiş olabilir, atla */
        }
      }
    }
  }
  await walk(rootDir);
  return result;
}

async function computeSystemHealth() {
  await loadActivityEventsOnce();
  await loadApprovalStateOnce();
  await loadSessionsOnce();

  const activityEventsPath = path.join(dataDir, "activity-events.json");
  const uploadsDir = path.join(dataDir, "uploads");

  const [activityEventsStat, uploadsSize, backupEntries] = await Promise.all([
    fs.stat(activityEventsPath).catch(() => null),
    computeDirectorySize(uploadsDir),
    fs.readdir(backupDir, { withFileTypes: true }).catch(() => []),
  ]);

  // NOT: yedek klasor adlari her zaman "YYYY-MM-DD_HH-MM-SS" formatinda
  // DEGIL — bu depoda cogu "before-<aciklama>_YYYY-MM-DD_HH-MM-SS" gibi
  // elle/baska bir araçla olusturulmus adlar tasiyor. Isim bazli alfabetik
  // siralama bu yuzden YANLIS "en son"u seçebiliyordu (ör. "before-ziraat..."
  // "before-word..."dan alfabetik SONRA gelir ama tarih olarak ONCE
  // olabilir). Bunun yerine klasorun GERCEK dosya sistemi degisiklik
  // zamanina (mtime) gore siralanir.
  const backupDirs = backupEntries.filter((entry) => entry.isDirectory());
  const backupStats = await Promise.all(
    backupDirs.map((entry) =>
      fs.stat(path.join(backupDir, entry.name)).then(
        (stat) => ({ name: entry.name, mtime: stat.mtime.toISOString() }),
        () => null,
      ),
    ),
  );
  const latestBackupEntry = backupStats
    .filter(Boolean)
    .sort((a, b) => b.mtime.localeCompare(a.mtime))[0] || null;

  return {
    uptimeSeconds: Math.round(process.uptime()),
    activityEventsCount: activityEvents.length,
    activityEventsFileSizeBytes: activityEventsStat ? activityEventsStat.size : 0,
    uploadsSizeBytes: uploadsSize.bytes,
    uploadsFileCount: uploadsSize.fileCount,
    uploadsScanTruncated: uploadsSize.truncated,
    mfaConfigured: isMfaConfigured(),
    approvedUsersCount: approvedUsers.size,
    pendingUsersCount: pendingUsers.size,
    sessionsCount: sessions.size,
    latestBackup: latestBackupEntry ? latestBackupEntry.name : null,
    latestBackupAt: latestBackupEntry ? latestBackupEntry.mtime : null,
  };
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

const MAP_TILE_SOURCES = {
  osm: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
  imagery: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  transport: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  places: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
};

function parseMapTileRequest(urlPath) {
  const pathname = new URL(urlPath, `http://${host}:${port}`).pathname;
  const match = pathname.match(/^\/map-tiles\/(osm|imagery|transport|places)\/(\d{1,2})\/(\d+)\/(\d+)$/);
  if (!match) return null;
  const [, source, zoomText, xText, yText] = match;
  const zoom = Number(zoomText);
  const x = Number(xText);
  const y = Number(yText);
  const limit = 2 ** zoom;
  if (zoom > 20 || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= limit || y >= limit) return null;
  return { source, zoom, x, y };
}

function handleMapTile(response, tile) {
  const endpoint = MAP_TILE_SOURCES[tile.source]
    .replace("{z}", String(tile.zoom))
    .replace("{x}", String(tile.x))
    .replace("{y}", String(tile.y));

  return new Promise((resolve) => {
    const upstream = https.get(endpoint, {
      headers: {
        "User-Agent": "ExperifyMap/1.0",
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
      },
      timeout: 10000,
    }, (tileResponse) => {
      const contentType = String(tileResponse.headers["content-type"] || "");
      if (tileResponse.statusCode !== 200 || !contentType.startsWith("image/")) {
        tileResponse.resume();
        applySecurityHeaders(response);
        response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        response.end("Harita katmanı alınamadı.");
        resolve();
        return;
      }

      applySecurityHeaders(response);
      response.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      });
      tileResponse.pipe(response);
      tileResponse.on("end", resolve);
      tileResponse.on("error", () => {
        if (!response.writableEnded) response.end();
        resolve();
      });
    });

    upstream.on("timeout", () => upstream.destroy(new Error("Harita katmanı zaman aşımına uğradı.")));
    upstream.on("error", () => {
      if (!response.headersSent) {
        applySecurityHeaders(response);
        response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      }
      if (!response.writableEnded) response.end("Harita katmanı alınamadı.");
      resolve();
    });
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

function fetchHttpsText(endpoint, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const target = new URL(endpoint);
    const upstream = https.get({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      port: target.port || 443,
      timeout: timeoutMs,
      headers: {
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.1",
        "User-Agent": "Experify/1.0 TCMB currency client",
      },
    }, (upstreamResponse) => {
      let body = "";
      upstreamResponse.setEncoding("utf8");
      upstreamResponse.on("data", (chunk) => { body += chunk; });
      upstreamResponse.on("end", () => {
        const statusCode = upstreamResponse.statusCode || 500;
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`TCMB ${statusCode}`));
          return;
        }
        resolve(body);
      });
    });
    upstream.on("timeout", () => upstream.destroy(new Error("TCMB zaman asimina ugradi.")));
    upstream.on("error", reject);
  });
}

function xmlTagText(xml, tagName) {
  const match = String(xml || "").match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? match[1].trim() : "";
}

function parseTcmbCurrency(xml, code) {
  const currencyMatch = String(xml || "").match(new RegExp(`<Currency\\b[^>]*\\bKod="${code}"[^>]*>([\\s\\S]*?)</Currency>`, "i"));
  if (!currencyMatch) return null;
  const currencyXml = currencyMatch[1];
  const buying = Number(xmlTagText(currencyXml, "ForexBuying").replace(",", "."));
  const selling = Number(xmlTagText(currencyXml, "ForexSelling").replace(",", "."));
  if (!Number.isFinite(buying) || !Number.isFinite(selling)) return null;
  return { buying, selling };
}

function parseTcmbRates(xml) {
  const date = String(xml || "").match(/<Tarih_Date\b[^>]*\bTarih="([^"]+)"/i)?.[1]
    || String(xml || "").match(/<Tarih_Date\b[^>]*\bDate="([^"]+)"/i)?.[1]
    || "";
  const usd = parseTcmbCurrency(xml, "USD");
  const eur = parseTcmbCurrency(xml, "EUR");
  if (!usd || !eur) throw new Error("TCMB USD veya EUR kuru bulunamadi.");
  return { source: "TCMB", date, usd, eur };
}

async function getTcmbRates() {
  const now = Date.now();
  if (tcmbRatesCache.payload && now - tcmbRatesCache.fetchedAt < TCMB_CACHE_TTL_MS) {
    return { ...tcmbRatesCache.payload, cached: true, stale: false };
  }
  if (!tcmbRatesCache.pending) {
    tcmbRatesCache.pending = fetchHttpsText(TCMB_RATES_URL)
      .then((xml) => {
        const payload = parseTcmbRates(xml);
        tcmbRatesCache = { payload, fetchedAt: Date.now(), pending: null };
        return payload;
      })
      .catch((error) => {
        tcmbRatesCache.pending = null;
        throw error;
      });
  }
  try {
    return { ...(await tcmbRatesCache.pending), cached: false, stale: false };
  } catch (error) {
    if (tcmbRatesCache.payload && now - tcmbRatesCache.fetchedAt < TCMB_STALE_TTL_MS) {
      return { ...tcmbRatesCache.payload, cached: true, stale: true };
    }
    throw error;
  }
}

async function handleTcmbRatesApi(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  try {
    const rates = await getTcmbRates();
    sendJson(response, 200, { ok: true, ...rates, fetchedAt: new Date(tcmbRatesCache.fetchedAt).toISOString() });
  } catch (error) {
    logServerError("TCMB kur servisi hatasi", error);
    sendJson(response, 502, { ok: false, error: "TCMB guncel kurlarina ulasilamadi." });
  }
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

// login.html'de Firebase ile giriş yapıldıktan sonra çağrılır: geçerli bir
// Firebase ID token'ı (genel /api/* Bearer kontrolüyle zaten doğrulanmış
// olur) HttpOnly bir oturum çerezine bağlar. RESEND_API_KEY ayarlıysa (MFA
// aktifse) ve bu cihaz güvenilir değilse, oturum çerezi HENÜZ verilmez —
// önce e-posta kodu doğrulanmalı (bkz. /api/session/request-code ve
// /api/session/verify-code). /api/session/logout ise oturum çerezini
// sunucu tarafında da iptal eder (güvenilir cihaz durumuna dokunmaz —
// standart pratik: çıkış yapmak cihaz güvenini SIFIRLAMAZ).
async function handleSessionApi(request, response, url, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }

  // Onay kapısı: /api/session/logout HARİÇ tüm giriş adımları (oturum
  // kurma, MFA kodu isteme/doğrulama) onaylanmamış bir hesap için burada
  // durur — hesap oluşturmak giriş izni vermez (kullanıcı talebi).
  if (url !== "/api/session/logout" && !(await isUserApproved(user.uid, user.email))) {
    sendJson(response, 200, { ok: true, pendingApproval: true });
    return;
  }

  if (url === "/api/session") {
    if (isMfaConfigured() && !(await isRequestFromTrustedDevice(request, user.uid))) {
      sendJson(response, 200, { ok: true, requiresMfa: true });
      return;
    }
    const { id, expiresAt } = createSession(user.uid, user.email);
    setSessionCookie(request, response, id, expiresAt);
    logActivityEvent("login", user.uid, user.email, { ip: clientKeyFor(request), userAgent: request.headers["user-agent"] });
    sendJson(response, 200, { ok: true, requiresMfa: false });
    return;
  }

  if (url === "/api/session/request-code") {
    if (!isMfaConfigured()) {
      sendJson(response, 400, { ok: false, error: "MFA yapılandırılmamış." });
      return;
    }
    if (!user.email) {
      sendJson(response, 400, { ok: false, error: "Hesapta e-posta adresi bulunamadı." });
      return;
    }
    const now = Date.now();
    const log = mfaCodeRequestLog.get(user.uid);
    if (!log || now - log.windowStart >= 60 * 60 * 1000) {
      mfaCodeRequestLog.set(user.uid, { windowStart: now, count: 1 });
    } else if (log.count >= MFA_CODE_REQUEST_LIMIT_PER_HOUR) {
      sendJson(response, 429, { ok: false, error: "Çok fazla kod isteği. Lütfen bir süre sonra tekrar deneyin." });
      return;
    } else {
      log.count += 1;
    }
    const code = generateMfaCode();
    mfaCodes.set(user.uid, { code, expiresAt: now + MFA_CODE_TTL_MS, attempts: 0, email: user.email });
    try {
      await sendEmailViaResend(user.email, "Experify Giriş Kodu", buildMfaEmailHtml(code));
    } catch (error) {
      logServerError("MFA kodu e-postası gönderilemedi", error);
      sendJson(response, 502, { ok: false, error: "Kod e-postası gönderilemedi. Lütfen tekrar deneyin." });
      return;
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url === "/api/session/verify-code") {
    if (!isMfaConfigured()) {
      sendJson(response, 400, { ok: false, error: "MFA yapılandırılmamış." });
      return;
    }
    let body;
    try {
      body = JSON.parse((await readBody(request, 2048)) || "{}");
    } catch {
      sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
      return;
    }
    const submittedCode = String(body?.code || "").trim();
    const entry = mfaCodes.get(user.uid);
    if (!entry || Number(entry.expiresAt) <= Date.now()) {
      mfaCodes.delete(user.uid);
      sendJson(response, 400, { ok: false, error: "Kodun süresi doldu. Yeni kod isteyin." });
      return;
    }
    if (entry.attempts >= MFA_CODE_MAX_ATTEMPTS) {
      mfaCodes.delete(user.uid);
      sendJson(response, 400, { ok: false, error: "Çok fazla yanlış deneme. Yeni kod isteyin." });
      return;
    }
    if (!submittedCode || submittedCode !== entry.code) {
      entry.attempts += 1;
      sendJson(response, 400, { ok: false, error: "Kod hatalı." });
      return;
    }
    mfaCodes.delete(user.uid);
    const { id: sessionId, expiresAt: sessionExpiresAt } = createSession(user.uid, user.email);
    setSessionCookie(request, response, sessionId, sessionExpiresAt);
    const { id: trustId, expiresAt: trustExpiresAt } = markDeviceTrusted(user.uid, user.email);
    setTrustCookie(request, response, trustId, trustExpiresAt);
    logActivityEvent("login", user.uid, user.email, { ip: clientKeyFor(request), userAgent: request.headers["user-agent"] });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url === "/api/session/logout") {
    const session = await getSessionFromRequest(request);
    if (session) {
      destroySession(session.id);
      logActivityEvent("logout", session.uid, session.email, { ip: clientKeyFor(request), userAgent: request.headers["user-agent"] });
    }
    clearSessionCookie(request, response);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { ok: false, error: "Bulunamadı." });
}

// login.html'de Firebase createUserWithEmailAndPassword ile hesap
// oluşturulduktan HEMEN sonra çağrılır — kullanıcının KENDİ taze ID
// token'ıyla (sahte bir uid için başkası adına kayıt açılamaz) kendini
// "onay bekliyor" listesine ekler. Zaten onaylıysa (ör. yönetici) no-op.
async function handleRegisterPendingApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  let body;
  try {
    body = JSON.parse((await readBody(request, 4096)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const profile = {
    fullName: body?.fullName,
    phone: body?.phone,
    workType: body?.workType,
    company: body?.company,
  };
  const isNewlyPending = await registerPendingUser(user.uid, user.email, profile);
  // E-posta gönderimi başarısız olsa bile kayıt akışı ASLA bloklanmaz/
  // bozulmaz (kullanıcı yine "onay bekliyor" ekranını görür) — yalnızca
  // sunucu logunda hata kalır. RESEND_API_KEY yoksa (isMfaConfigured false)
  // bu adım tamamen sessizce atlanır (MFA'daki "opsiyonel env var" deseniyle
  // aynı — bkz. CLAUDE.md).
  if (isNewlyPending && isMfaConfigured() && accessRoles.ADMIN_EMAIL) {
    try {
      await sendEmailViaResend(
        accessRoles.ADMIN_EMAIL,
        "Experify — Yeni Kullanıcı Onayı Bekliyor",
        buildNewUserNotificationEmailHtml({ email: user.email, ...sanitizeRegistrationProfile(profile) }),
      );
    } catch (error) {
      logServerError("Yeni kullanıcı bildirim e-postası gönderilemedi", error);
    }
  }
  sendJson(response, 200, { ok: true });
}

function requireAdmin(response, user) {
  if (accessRoles.isAdminEmail(user.email)) return true;
  sendJson(response, 403, { ok: false, error: "Bu işlem için yönetici yetkisi gerekir." });
  return false;
}

async function handlePendingUsersListApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const pending = await listPendingUsers();
  sendJson(response, 200, { ok: true, pending });
}

async function handleApproveUserApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  if (!targetUid) {
    sendJson(response, 400, { ok: false, error: "Kullanıcı kimliği eksik." });
    return;
  }
  await approveUser(targetUid);
  await loadApprovalStateOnce();
  await logActivityEvent("user-approved", targetUid, approvedUsers.get(targetUid)?.email || null, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true });
}

async function handleRejectUserApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  if (!targetUid) {
    sendJson(response, 400, { ok: false, error: "Kullanıcı kimliği eksik." });
    return;
  }
  await loadApprovalStateOnce();
  const targetEmail = pendingUsers.get(targetUid)?.email || null;
  await rejectPendingUser(targetUid);
  await logActivityEvent("user-rejected", targetUid, targetEmail, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true });
}

async function handleApprovedUsersListApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const approved = await listApprovedUsers();
  sendJson(response, 200, { ok: true, approved });
}

async function handleGrantPrivilegeApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  if (!targetUid) {
    sendJson(response, 400, { ok: false, error: "Kullanıcı kimliği eksik." });
    return;
  }
  await grantPrivilege(targetUid);
  await loadApprovalStateOnce();
  await logActivityEvent("privilege-granted", targetUid, approvedUsers.get(targetUid)?.email || null, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true });
}

async function handleRevokePrivilegeApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  if (!targetUid) {
    sendJson(response, 400, { ok: false, error: "Kullanıcı kimliği eksik." });
    return;
  }
  await revokePrivilege(targetUid);
  await loadApprovalStateOnce();
  await logActivityEvent("privilege-revoked", targetUid, approvedUsers.get(targetUid)?.email || null, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true });
}

// Herhangi bir kimlik doğrulanmış kullanıcı kendi rolünü sorgulayabilir —
// app.js/cloud-sync.js bunu tek seferlik çağırıp "explanations"/"expenseFees"
// bölümlerini ve PDF okuma sonucu panellerini normal kullanıcılardan gizlemek
// için kullanır (bkz. sensitiveOnly alanı).
async function handleAccountProfileApi(request, response, user) {
  if (request.method === "GET") {
    await loadApprovalStateOnce();
    const entry = approvedUsers.get(user.uid);
    sendJson(response, 200, {
      ok: true,
      profile: entry ? {
        email: user.email || entry.email || null,
        fullName: entry.fullName ?? null,
        phone: entry.phone ?? null,
        workType: entry.workType ?? null,
        company: entry.company ?? null,
        status: approvedUserStatus(entry),
      } : null,
    });
    return;
  }
  if (request.method !== "PUT") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  let body;
  try {
    body = JSON.parse((await readBody(request, 4096)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Gecersiz istek." });
    return;
  }
  const profile = await updateOwnUserProfile(user.uid, user.email, body);
  if (!profile) {
    sendJson(response, 403, { ok: false, error: "Bu hesap icin profil guncellenemedi." });
    return;
  }
  sendJson(response, 200, { ok: true, profile: {
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    workType: profile.workType,
    company: profile.company,
    status: approvedUserStatus(profile),
  } });
}

async function handleDeleteOwnAccountApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (accessRoles.isAdminEmail(user.email)) {
    sendJson(response, 400, { ok: false, error: "Yonetici hesabi bu ekrandan silinemez." });
    return;
  }
  await deleteManagedUser(user.uid);
  await logActivityEvent("account-deleted", user.uid, user.email, { ip: clientKeyFor(request), userAgent: request.headers["user-agent"] });
  sendJson(response, 200, { ok: true });
}

async function handleManagedUserStatusApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Gecersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  const status = body?.status === "suspended" ? "suspended" : (body?.status === "active" ? "active" : "");
  if (!targetUid || !status) {
    sendJson(response, 400, { ok: false, error: "Kullanici veya durum eksik." });
    return;
  }
  const entry = await setManagedUserStatus(targetUid, status);
  if (!entry) {
    sendJson(response, 404, { ok: false, error: "Kullanici bulunamadi." });
    return;
  }
  if (status === "suspended") await revokeUserSessionsAndTrustedDevices(targetUid);
  await logActivityEvent(status === "suspended" ? "account-suspended" : "account-activated", targetUid, entry.email, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true, status });
}

async function handleDeleteManagedUserApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Gecersiz istek." });
    return;
  }
  const targetUid = String(body?.uid || "").trim();
  if (!targetUid) {
    sendJson(response, 400, { ok: false, error: "Kullanici kimligi eksik." });
    return;
  }
  await loadApprovalStateOnce();
  const entry = approvedUsers.get(targetUid) || pendingUsers.get(targetUid);
  if (!entry || accessRoles.isAdminEmail(entry.email)) {
    sendJson(response, 400, { ok: false, error: "Bu kullanici silinemez." });
    return;
  }
  await deleteManagedUser(targetUid);
  await logActivityEvent("account-deleted-by-admin", targetUid, entry.email, {
    actorUid: user.uid,
    actorEmail: user.email,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true });
}

async function handleMyRoleApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  let role = "user";
  if (accessRoles.isAdminEmail(user.email)) role = "admin";
  else if (await isUserPrivileged(user.uid, user.email)) role = "privileged";
  sendJson(response, 200, { ok: true, role });
}

// login.html/app.js'ten çağrılır — "kaç rapor oluşturdu / ne kadar sürede
// tamamladı" istatistikleri için reportId (opaque) ve olay türünü
// (created/exported) loglar. Ayrıca (0.0.348, admin "rapor listesi"
// talebi) opsiyonel, DAR bir whitelist'e (REPORT_SUMMARY_FIELDS) sıkıştırılmış
// bir `summary` alabilir — rapor içeriğinin TAMAMI değil. uid/email
// İSTEMCİDEN GÜVENİLMEZ, authenticateRequest'in doğruladığı `user`'dan alınır.
async function handleReportEventApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  let body;
  try {
    body = JSON.parse((await readBody(request, 2048)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }
  const type = body?.type === "exported" ? "report-exported" : (body?.type === "created" ? "report-created" : null);
  if (!type) {
    sendJson(response, 400, { ok: false, error: "Geçersiz olay türü." });
    return;
  }
  const reportId = String(body?.reportId || "").trim().slice(0, 64);
  if (!reportId) {
    sendJson(response, 400, { ok: false, error: "reportId eksik." });
    return;
  }
  await logActivityEvent(type, user.uid, user.email, { reportId, summary: body?.summary });
  sendJson(response, 200, { ok: true });
}

async function handleExportAuthorizationApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!(await isUserApproved(user.uid, user.email))) {
    sendJson(response, 403, { ok: false, error: "Resmi rapor çıktısı için onaylı kullanıcı hesabı gerekir." });
    return;
  }

  let body;
  try {
    body = JSON.parse((await readBody(request, 4096)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Geçersiz istek." });
    return;
  }

  const reportId = String(body?.reportId || "").trim().slice(0, 64);
  const templateKey = String(body?.templateKey || "").trim().slice(0, 80);
  const stateDigest = String(body?.stateDigest || "").trim().toLowerCase();
  if (!reportId || !templateKey || !/^[a-f0-9]{64}$/.test(stateDigest)) {
    sendJson(response, 400, { ok: false, error: "Rapor doğrulama verisi eksik veya geçersiz." });
    return;
  }

  const issuedAt = new Date().toISOString();
  const accountFingerprint = crypto.createHash("sha256").update(user.uid).digest("hex").slice(0, 16);
  const certificate = { version: 1, reportId, templateKey, issuedAt, accountFingerprint, stateDigest };
  const canonical = Object.values(certificate).join("|");
  certificate.signature = crypto.createHmac("sha256", await getExportSigningKey()).update(canonical).digest("base64url");

  await logActivityEvent("report-export-authorized", user.uid, user.email, {
    reportId,
    templateKey,
    ip: clientKeyFor(request),
    userAgent: request.headers["user-agent"],
  });
  sendJson(response, 200, { ok: true, certificate });
}

function privateTemplatePathForKey(templateKey) {
  const fileName = PRIVATE_REPORT_TEMPLATES[String(templateKey || "")];
  return fileName ? path.join(privateTemplateDir, fileName) : "";
}

function collectTemplateTokens(templateText) {
  const tokens = new Set();
  String(templateText || "").replace(/<!--[\s\S]*?-->/g, "").replace(/\{\{([^{}]+)\}\}/g, (match, rawName) => {
    const name = String(rawName || "").trim();
    if (name) tokens.add(name);
    return match;
  });
  return [...tokens];
}

function renderPrivateTemplate(templateText, tokenValues) {
  const values = tokenValues && typeof tokenValues === "object" ? tokenValues : {};
  return String(templateText || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\{\{([^{}]+)\}\}/g, (match, rawName) => {
      const name = String(rawName || "").trim();
      return Object.prototype.hasOwnProperty.call(values, name) ? String(values[name] ?? "") : match;
    });
}

function normalizeServerTemplateTokenName(value) {
  return String(value || "")
    .replace(/[İIıi]/g, "I")
    .replace(/[Çç]/g, "C")
    .replace(/[Ğğ]/g, "G")
    .replace(/[Öö]/g, "O")
    .replace(/[Şş]/g, "S")
    .replace(/[Üü]/g, "U")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
}

function parseServerValuationNumber(value) {
  let text = String(value ?? "").trim().replace(/\s+/g, "");
  if (!text) return Number.NaN;
  text = text.replace(/[^0-9,.-]/g, "");
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    text = lastComma > lastDot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const decimals = text.length - lastComma - 1;
    text = decimals === 3 && text.indexOf(",") === lastComma ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if ((text.match(/\./g) || []).length > 1) {
    text = text.replace(/\./g, "");
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1e15 ? parsed : Number.NaN;
}

function formatServerValuationMoney(value) {
  return Number.isFinite(value) && value > 0
    ? `${Math.round(value).toLocaleString("tr-TR")} TL`
    : "";
}

function calculateServerDerivedValuation(valuationInput) {
  const legalValue = parseServerValuationNumber(valuationInput?.legalValue);
  const currentValue = parseServerValuationNumber(valuationInput?.currentValue);
  const urgent = (value) => Number.isFinite(value) ? Math.round((value * 0.9) / 50000) * 50000 : Number.NaN;
  return {
    version: 1,
    rule: "market-value-x-0.90-rounded-to-50000",
    legalUrgentSaleValue: formatServerValuationMoney(urgent(legalValue)),
    currentUrgentSaleValue: formatServerValuationMoney(urgent(currentValue)),
  };
}

function applyServerDerivedValuationTokens(tokenValues, valuationInput) {
  const derived = calculateServerDerivedValuation(valuationInput);
  const overrides = new Map([
    ["LEGALURGENTSALEVALUE", derived.legalUrgentSaleValue],
    ["YASALACILSATISDEGERI", derived.legalUrgentSaleValue],
    ["CURRENTURGENTSALEVALUE", derived.currentUrgentSaleValue],
    ["MEVCUTACILSATISDEGERI", derived.currentUrgentSaleValue],
  ]);
  for (const key of Object.keys(tokenValues)) {
    const value = overrides.get(normalizeServerTemplateTokenName(key));
    if (value !== undefined) tokenValues[key] = value;
  }
  return derived;
}

function serverTemplateRuleText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function serverTemplateRuleLower(value) {
  return serverTemplateRuleText(value).toLocaleLowerCase("tr-TR");
}

function buildServerBuildingFootprintAndEntranceExplanation(input) {
  const footprintReference = serverTemplateRuleLower(input?.buildingFootprintReference);
  const entranceLevel = serverTemplateRuleLower(input?.buildingEntranceLevel);
  const entranceDirection = serverTemplateRuleLower(input?.buildingEntranceDirection);
  const sentences = [];

  if (footprintReference) {
    sentences.push(`Bina oturumu; vaziyet planında belirtilen ${footprintReference} referansından tespit edilmiştir.`);
  }
  if (entranceLevel && entranceDirection) {
    const level = entranceLevel.includes("kat") ? `${entranceLevel}ından` : `${entranceLevel} katından`;
    sentences.push(`Bina girişi, projesine göre binanın ${level} ve yapının ${entranceDirection} cephesinden sağlanmaktadır.`);
  } else if (entranceLevel) {
    const level = entranceLevel.includes("kat") ? `${entranceLevel}ından` : `${entranceLevel} katından`;
    sentences.push(`Bina girişi, projesine göre binanın ${level} sağlanmaktadır.`);
  } else if (entranceDirection) {
    sentences.push(`Bina girişi, projesine göre yapının ${entranceDirection} cephesinden sağlanmaktadır.`);
  }
  return sentences.join(" ");
}

// Cumle-varyanti mekanizmasi (istemci: app.js "VARYANT SEÇİM mekanizması")
// sunucuda TEKRAR UYGULANIYOR ki korumali placeholder (BINA_OTURUMU_VE_
// GIRIS_ACIKLAMASI/PROJECT_SUITABILITY_DESCRIPTION) istemcinin o rapor icin
// secmis oldugu varyantla AYNI metni uretsin — aksi halde sunucu HER ZAMAN
// index 0'i (orijinal metni) dondurur ve banka sablonu export'unda goruntu
// ekrandaki (istemci) onizlemeyle UYUSMAZ. Hash algoritmasi app.js'teki
// hashVariantSeedText/getAutoVariantIndex ile BİREBİR AYNI olmali — biri
// degisirse digeri de guncellenmeli (bkz. tools/test-server-template-rendering.js
// "varyant senkronu" bolumu).
function hashVariantSeedTextServer(text) {
  let hash = 2166136261;
  const value = String(text || "");
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// seed bos ise (rapor henuz kaydedilmemis/reportId yok) DAIMA index 0
// (orijinal metin) dondurulur — istemcinin rastgele oturum-ici variantSeed
// yedegi sunucuya hic gonderilmez (kalici olmadigindan senkron edilemez);
// bu, "rapor henuz kaydedilmeden export edilirse orijinal metin gorunur"
// seklinde guvenli ve deterministik bir varsayilan saglar.
function selectVariantServer(seed, overrides, sentenceKey, variantCount) {
  if (!Number.isInteger(variantCount) || variantCount <= 1) return 0;
 const override = overrides?.[sentenceKey];
 if (Number.isInteger(override) && override >= 0 && override < variantCount) return override;
  return 0;
}

function foldTurkishServer(value) {
  return String(value || "")
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// AŞAĞIDAKİ VARYANT METİNLERİ app.js'teki projectSuitabilityStatusVariants /
// projectSuitabilityRepairVariants ile BİREBİR AYNI TUTULMALI (ayrı
// çalışma zamanı/modül oldukları için elle senkron edilir — bkz. yukarıdaki
// yorum). tools/test-server-template-rendering.js bu iki listenin
// birbirinden kopmadığını otomatik doğrular.
const serverProjectSuitabilityStatusVariants = {
  UYGUNDUR: [
    (lead) => `${lead}Ekspertize konu bağımsız bölüm kat, kattaki konum, alan ve mimari olarak projesine uygundur.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölüm; kat, kattaki konumu, alanı ve mimarisi itibarıyla onaylı projesine uygun bulunmuştur.`,
    (lead) => `${lead}Söz konusu bağımsız bölümün kat, konum, alan ve mimari özellikleri onaylı projeyle uyumludur.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölüm kat, konumu, alanı ve mimarisi bakımından onaylı projeye uygun bulunmuştur.`,
    (lead) => `${lead}Söz konusu bağımsız bölüm; kat, kattaki konum, alan ve mimari özellikleri itibarıyla projesine uygun olduğu tespit edilmiştir.`,
  ],
  "BLOK BAZINDA KONUM OLARAK UYGUN DEGILDIR": [
    (lead) => `${lead}Ekspertize konu taşınmaz blok bazında projesine uygun değildir.`,
    (lead) => `${lead}Değerlemeye konu gayrimenkul, blok bazında incelendiğinde projesine uygun bulunmamıştır.`,
    (lead) => `${lead}Söz konusu taşınmaz blok bazında incelendiğinde projesiyle uyumsuz bulunmuştur.`,
    (lead) => `${lead}Rapor konusu gayrimenkul, blok bazında projesine uygun olmadığı tespit edilmiştir.`,
    (lead) => `${lead}Mülk, blok konumu itibarıyla onaylı projeyle örtüşmemektedir.`,
  ],
  "MIMARI OLARAK UYGUN DEGILDIR": [
    (lead) => `${lead}Ekspertize konu bağımsız bölüm vaziyet planına göre blok bazında konum, kat, kattaki konum ve kullanım alanı olarak projesine uygun olup, mimari olarak projesine uygun değildir.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölüm, vaziyet planı esas alındığında blok, kat, kattaki konum ve kullanım alanı bakımından projesiyle uyumlu olup, yalnızca mimari açıdan projesine uygun bulunmamıştır.`,
    (lead) => `${lead}Söz konusu bağımsız bölüm, vaziyet planına göre blok, kat, kattaki konum ve kullanım alanı bakımından projesine uygun olup, yalnızca mimari yönden farklılık göstermektedir.`,
    (lead) => `${lead}Rapor konusu bağımsız bölüm blok, kat, konum ve kullanım alanı itibarıyla projeyle örtüşmekte, mimari açıdan uygunsuzluk tespit edilmiştir.`,
    (lead) => `${lead}Mülk; blok, kat, konum ve kullanım alanı bakımından projesine uygun olmakla birlikte, mimari yönden uyumsuzluk bulunmaktadır.`,
  ],
  "KULLANIM ALANI OLARAK UYGUN DEGILDIR": [
    (lead) => `${lead}Ekspertize konu bağımsız bölüm vaziyet planına göre blok bazında konum, kat, kattaki konum ve mimari olarak projesine uygun olup, kullanım alanı olarak projesine uygun değildir.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölüm vaziyet planı esas alındığında blok, kat ve mimari açıdan projesiyle örtüşmekte, ancak kullanım alanı bakımından projeden farklılık göstermektedir.`,
    (lead) => `${lead}Söz konusu bağımsız bölüm blok, kat ve mimari açıdan projesiyle uyumlu olup, kullanım alanı bakımından farklılık göstermektedir.`,
    (lead) => `${lead}Rapor konusu bağımsız bölüm; blok, kat, konum ve mimari özellikleri itibarıyla projeye uygun olup, kullanım alanında uyumsuzluk tespit edilmiştir.`,
    (lead) => `${lead}Mülk blok, kat ve mimari bakımdan projesiyle örtüşmekte, kullanım alanı açısından farklılık taşımaktadır.`,
  ],
  "KULLANIM ALANI VE MIMARI OLARAK UYGUN DEGILDIR": [
    (lead) => `${lead}Ekspertize konu bağımsız bölüm vaziyet planına göre blok bazında konum, kat ve kattaki konum olarak projesine uygun olup, kullanım alanı ve mimari olarak projesine uygun değildir.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölüm, vaziyet planına göre blok, kat ve kattaki konum bakımından projesine uygun olmakla birlikte, kullanım alanı ve mimari açıdan projeyle uyumsuzluk göstermektedir.`,
    (lead) => `${lead}Söz konusu bağımsız bölüm blok, kat ve konum bakımından projesine uygun olup, kullanım alanı ve mimari açıdan farklılık göstermektedir.`,
    (lead) => `${lead}Rapor konusu bağımsız bölüm; blok, kat ve kattaki konum itibarıyla projeyle uyumlu olup, kullanım alanı ile mimari yönden uygunsuzluk tespit edilmiştir.`,
    (lead) => `${lead}Mülk, blok, kat ve konum bakımından projesine uygun olmakla birlikte, kullanım alanı ve mimari açıdan uyumsuzluk taşımaktadır.`,
  ],
  "PROJEYE UYGUNLUK TESPIT EDILMEMISTIR": [
    (lead) => `${lead}Ekspertize konu bağımsız bölümün konum tespiti dışarıdan yapılmış olup kat, alan ve mimari olarak uygunluk tespit edilememiştir.`,
    (lead) => `${lead}Değerlemeye konu bağımsız bölümün konum tespiti dışarıdan gerçekleştirilmiş olup, kat, alan ve mimari açıdan projeye uygunluk belirlenememiştir.`,
    (lead) => `${lead}Söz konusu bağımsız bölümün konumu dışarıdan tespit edilmiş olup, kat, alan ve mimari uygunluk belirlenememiştir.`,
    (lead) => `${lead}Rapor konusu bağımsız bölümün yeri dışarıdan incelenmiş, kat, alan ve mimari açıdan uygunluk tespiti yapılamamıştır.`,
    (lead) => `${lead}Mülkün konumu dışarıdan değerlendirilmiş olup, kat, alan ve mimari uygunluğu belirlenememiştir.`,
  ],
  TRAMPA: [
    (lead) => `${lead}ekspertize konu taşınmaz vaziyet planına göre blok bazında konum, kat, kattaki konum ve kullanım alanı olarak projesine uygun değildir.`,
    (lead) => `${lead}değerlemeye konu taşınmaz, vaziyet planına göre blok bazında konum, kat, kattaki konum ve kullanım alanı bakımından projesine uygun değildir.`,
    (lead) => `${lead}söz konusu taşınmaz vaziyet planına göre blok, kat, konum ve kullanım alanı bakımından projesine uygun değildir.`,
    (lead) => `${lead}rapor konusu gayrimenkul vaziyet planına göre blok, kat, konum ve kullanım alanı yönünden projeyle uyumsuzdur.`,
    (lead) => `${lead}mülk, vaziyet planı esas alındığında blok, kat, konum ve kullanım alanı bakımından projesine aykırıdır.`,
  ],
  "TRAMPA VE AYNA SIMETRISI": [
    (lead) => `${lead}ekspertize konu taşınmaz kattaki konum olarak projesine uygun değildir.`,
    (lead) => `${lead}değerlemeye konu taşınmaz, kattaki konumu itibarıyla projesine uygun bulunmamıştır.`,
    (lead) => `${lead}söz konusu taşınmaz kattaki konumu bakımından projesine uygun değildir.`,
    (lead) => `${lead}rapor konusu gayrimenkul, kattaki konumu itibarıyla projeyle örtüşmemektedir.`,
    (lead) => `${lead}mülk, kattaki konumu açısından onaylı projeye aykırıdır.`,
  ],
  "AYNA SIMETRISI (KONUM ETKILENMIYOR)": [
    (lead) => `${lead}yapılan ruhsata aykırı imalat taşınmazın konumunu etkilememektedir.`,
    (lead) => `${lead}gerçekleştirilen ruhsata aykırı imalatın taşınmazın konumu üzerinde herhangi bir etkisi bulunmamaktadır.`,
    (lead) => `${lead}gerçekleştirilen ruhsata aykırı imalatın taşınmazın konumuna herhangi bir etkisi yoktur.`,
    (lead) => `${lead}yapılan ruhsata aykırı imalat, gayrimenkulün konumunu değiştirmemektedir.`,
    (lead) => `${lead}söz konusu ruhsata aykırı imalat, mülkün konumu üzerinde etki oluşturmamaktadır.`,
  ],
};
const serverProjectSuitabilityRepairVariants = [
  (repair) => `Basit bir tadilat ile ${repair === "Evet" ? "düzeltilebilir" : "düzeltilemez"} niteliktedir.`,
  (repair) => `Basit bir tadilat uygulanarak ${repair === "Evet" ? "düzeltilebilir" : "düzeltilemez"} durumdadır.`,
  (repair) => `Küçük çaplı bir tadilat ile ${repair === "Evet" ? "giderilebilir" : "giderilemez"} durumdadır.`,
  (repair) => `Basit onarımla ${repair === "Evet" ? "düzeltilmesi mümkündür" : "düzeltilmesi mümkün değildir"}.`,
];

// İstemcideki normalizeYesNoChoice(value) ile BİREBİR AYNI: "Evet"/"Hayır"
// dönüyor, tanınmayan değerde "" döner.
function normalizeYesNoChoiceServer(value) {
  const folded = foldTurkishServer(String(value || "").trim());
  if (/^(EVET|VAR|YES|TRUE|1)$/.test(folded)) return "Evet";
  if (/^(HAYIR|YOK|NO|FALSE|0)$/.test(folded)) return "Hayır";
  return "";
}

// İstemcideki buildProjectSuitabilityStatusSentence(statusValue, noteValue,
// repairValue, prefix) ile BİREBİR AYNI mantık — tek bir durum/not/tadilat
// üçlüsünü, verilen önekle (prefix) birlikte tek bir cümleye çevirir. Hem tek
// (dual-project olmayan) durumda HEM de Webtapu/Belediye ayrı ayrı dallarında
// (farklı prefix ile, ama AYNI sentenceKey ile — bkz. çağıranlar) kullanılır.
function buildServerProjectSuitabilityStatusSentence(statusValue, noteValue, repairValue, prefix, seed, overrides) {
  const status = serverTemplateRuleText(statusValue);
  // İstemcideki projectSuitabilityStatusKey(value) = foldTurkish(...).replace(/\./g, "").trim()
  // ile BİREBİR AYNI (boşluklar KORUNUR — sözlük anahtarları boşluklu).
  const statusKey = foldTurkishServer(status).replace(/\./g, "").trim();
  const note = serverTemplateRuleText(noteValue);
  const repair = normalizeYesNoChoiceServer(repairValue);
  const lead = prefix ? `${prefix} ` : "";
  // İstemcideki shouldShowProjectSuitabilityRepair(value) ile BİREBİR AYNI.
  const repairEligible = new Set([
    "MIMARI OLARAK UYGUN DEGILDIR",
    "KULLANIM ALANI OLARAK UYGUN DEGILDIR",
    "KULLANIM ALANI VE MIMARI OLARAK UYGUN DEGILDIR",
  ]);
  // İstemcideki buildProjectSuitabilityStatusSentence'daki acceptsConformityNote
  // listesiyle BİREBİR AYNI (repairEligible'dan FARKLI — ayrıca "BLOK BAZINDA..."
  // da not eklemeye uygundur, ama tadilat notu almaz).
  const acceptsConformityNote = new Set([
    "BLOK BAZINDA KONUM OLARAK UYGUN DEGILDIR",
    "MIMARI OLARAK UYGUN DEGILDIR",
    "KULLANIM ALANI OLARAK UYGUN DEGILDIR",
    "KULLANIM ALANI VE MIMARI OLARAK UYGUN DEGILDIR",
  ]);

  if (statusKey === "PROJEYE UYGUNLUK TESPIT EDILMEMISTIR" || statusKey === "PROJEYE UYGUNLUK TESPIT EDILEMEMISTIR") {
    if (note) return note;
    const variants = serverProjectSuitabilityStatusVariants["PROJEYE UYGUNLUK TESPIT EDILMEMISTIR"];
    const index = selectVariantServer(seed, overrides, "buildProjectSuitabilityStatusSentence:PROJEYE UYGUNLUK TESPIT EDILMEMISTIR", variants.length);
    return variants[index](lead);
  }

  let registryKey = statusKey || "UYGUNDUR";
  const variants = serverProjectSuitabilityStatusVariants[registryKey];
  if (!variants) return `${lead}${status}`;

  const variantIndex = selectVariantServer(seed, overrides, `buildProjectSuitabilityStatusSentence:${registryKey}`, variants.length);
  const sentences = [variants[variantIndex](lead)];
  if (acceptsConformityNote.has(registryKey) && note) sentences.push(note);
  if (repairEligible.has(registryKey) && repair) {
    const repairIndex = selectVariantServer(seed, overrides, "buildProjectSuitabilityStatusSentence:repair", serverProjectSuitabilityRepairVariants.length);
    sentences.push(serverProjectSuitabilityRepairVariants[repairIndex](repair));
  }
  return sentences.join(" ");
}

// İstemcideki isProjectSuitabilityOk(value) ile BİREBİR AYNI.
function isProjectSuitabilityOkServer(value) {
  const key = foldTurkishServer(serverTemplateRuleText(value)).replace(/\./g, "").trim();
  return !key || key === "UYGUNDUR";
}

// Basit Türkçe başlık-harf büyütme (yalnızca ilçe adı gibi kısa, 1-3 kelimelik
// metinler için — istemcideki normalizeReportTitleText()'in tam kapsamlı
// (özel kelime koruma, "ve/ile" gibi bağlaçları küçük tutma vb.) davranışının
// SADELEŞTİRİLMİŞ bir yaklaşımı; bu fonksiyonun tek kullanım yeri ilçe adını
// "{İlçe} Belediyesinde" kalıbına yerleştirmek olduğundan bu yeterlidir).
function titleCaseTrServerSimple(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr")
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase("tr") + word.slice(1) : word))
    .join(" ");
}

// İstemcideki shouldShowArchitecturalProjectFields/isOwnershipProjectDifferenceComparable/
// getSelectedProjectInstitutions/shouldShowProjectDifferenceField/
// shouldUseProjectDifferenceComparison zinciriyle BİREBİR AYNI (bkz. app.js).
function serverShouldUseProjectDifferenceComparison(input) {
  if (normalizeYesNoChoiceServer(input?.projectDifference) !== "Evet") return false;
  const showsArchitecturalFields = (String(input?.hasArchitecturalProject || "").trim() || "Evet") === "Evet";
  if (!showsArchitecturalFields) return false;
  const ownershipFolded = foldTurkishServer(serverTemplateRuleText(input?.ownershipType));
  const isComparable = !["MUSTAKIL BINA", "ARSA", "TARLA"].some((keyword) => ownershipFolded.includes(keyword));
  if (!isComparable) return false;
  const seen = new Set();
  const institutions = String(input?.projectInstitution || "")
    .split(",")
    .map((item) => titleCaseTrServerSimple(item).trim())
    .filter((value) => value && !/^seçiniz$/i.test(value))
    .filter((value) => {
      const key = foldTurkishServer(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return institutions.length !== 1;
}

// İstemcideki buildProjectSuitabilityDescription()'ın "her ikisi de uygun"
// (Webtapu/Belediye) dalıyla BİREBİR AYNI metin havuzu.
const serverProjectSuitabilityBothOkVariants = [
  (municipalityText) => `Webtapu Portalında incelenen mimari proje ve ${municipalityText} incelenen proje karşılaştırıldığında taşınmazın konumunu ve alanını etkileyen herhangi bir farklılık bulunmamaktadır. Taşınmaz incelenen her iki projeye de uygun olarak inşa edilmiştir.`,
  (municipalityText) => `Webtapu Portalında incelenen mimari proje ile ${municipalityText} incelenen proje karşılaştırıldığında, taşınmazın konumu ve alanını etkileyen bir farklılığa rastlanmamıştır. Taşınmaz, incelenen her iki projeye de uygun şekilde inşa edilmiştir.`,
  (municipalityText) => `Webtapu Portalında incelenen mimari proje ile ${municipalityText} incelenen proje karşılaştırıldığında, taşınmazın konumu ve alanını etkileyen bir farka rastlanmamıştır. Gayrimenkul, incelenen her iki projeye de uygun şekilde inşa edilmiştir.`,
  (municipalityText) => `Webtapu Portalı'ndaki mimari proje ile ${municipalityText} incelenen proje karşılaştırıldığında, taşınmazın konum ve alanını etkileyecek bir uyumsuzluk tespit edilmemiştir. Mülk, her iki projeye de uygun olarak inşa edilmiştir.`,
  (municipalityText) => `Webtapu Portalında yer alan mimari proje ile ${municipalityText} incelenen proje kıyaslandığında, taşınmazın konumu ve alanı bakımından farklılık bulunmamıştır. Söz konusu gayrimenkul, incelenen her iki proje ile de uyumlu şekilde inşa edilmiştir.`,
];

// İstemcideki buildProjectSuitabilityDescription() ile BİREBİR AYNI mantık
// (Webtapu/Belediye ayrı proje karşılaştırması dahil — daha önce burada
// eksikti, bkz. handoff.md 0.0.369). PROJECT_SUITABILITY_DESCRIPTION/
// PROJEUYGUNLUKACIKLAMASI korumalı placeholder'ının kaynağıdır.
function buildServerProjectSuitabilityDescription(input) {
  const seed = String(input?.variantSeed || "").trim();
  const overrides = input?.variantOverrides && typeof input.variantOverrides === "object" ? input.variantOverrides : null;
  const parts = [];

  if (serverShouldUseProjectDifferenceComparison(input)) {
    const titleOk = isProjectSuitabilityOkServer(input?.titleProjectSuitabilityStatus);
    const municipalityOk = isProjectSuitabilityOkServer(input?.municipalityProjectSuitabilityStatus);
    if (titleOk && municipalityOk) {
      const district = titleCaseTrServerSimple(serverTemplateRuleText(input?.titleDistrict) || serverTemplateRuleText(input?.district));
      const municipalityText = district ? `${district} Belediyesinde` : "Belediye arşivinde";
      const variantIndex = selectVariantServer(
        seed,
        overrides,
        "buildProjectSuitabilityDescription:bothOk",
        serverProjectSuitabilityBothOkVariants.length
      );
      parts.push(serverProjectSuitabilityBothOkVariants[variantIndex](municipalityText));
    } else {
      const titleSentence = buildServerProjectSuitabilityStatusSentence(
        input?.titleProjectSuitabilityStatus,
        input?.titleProjectSuitabilityNote,
        input?.titleProjectSuitabilitySimpleRepair,
        "Webtapu Portalında incelenen mimari proje yönünden",
        seed,
        overrides
      );
      const municipalitySentence = buildServerProjectSuitabilityStatusSentence(
        input?.municipalityProjectSuitabilityStatus,
        input?.municipalityProjectSuitabilityNote,
        input?.municipalityProjectSuitabilitySimpleRepair,
        "Belediye arşivinde incelenen mimari proje yönünden",
        seed,
        overrides
      );
      if (titleSentence) parts.push(titleSentence);
      if (municipalitySentence) parts.push(municipalitySentence);
      if (!parts.length) {
        parts.push(
          "Webtapu Portalında ve belediye arşivinde incelenen mimari projeler arasında vaziyet planı ve kat planı bazında taşınmazın konumunu ve kullanım alanını etkileyen bir farklılık bulunmamaktadır."
        );
      }
    }
  } else {
    const statusSentence = buildServerProjectSuitabilityStatusSentence(
      input?.projectSuitabilityStatus,
      input?.projectConformity,
      input?.projectSuitabilitySimpleRepair,
      "",
      seed,
      overrides
    );
    if (statusSentence) parts.push(statusSentence);
  }

  const mainProjectSuitable = normalizeYesNoChoiceServer(input?.mainRealEstateProjectSuitable || "Evet");
  if (mainProjectSuitable === "Hayır") {
    const note = serverTemplateRuleText(input?.mainRealEstateProjectSuitabilityNote);
    parts.push(`Ana gayrimenkul projesine uygunluk yönünden ${note || "uyumsuzluk tespit edilmiştir."}`);
  }

  return parts.join(" ");
}

function applyServerProtectedPlaceholderTokens(tokenValues, protectedPlaceholderInput) {
  const buildingExplanation = buildServerBuildingFootprintAndEntranceExplanation(protectedPlaceholderInput);
  const projectSuitabilityExplanation = buildServerProjectSuitabilityDescription(protectedPlaceholderInput);
  const overrides = new Map([
    ["BINAOTURUMUVEGIRISACIKLAMASI", buildingExplanation],
    ["BUILDINGFOOTPRINTANDENTRANCEEXPLANATION", buildingExplanation],
    ["PROJEUYGUNLUKACIKLAMASI", projectSuitabilityExplanation],
    ["PROJECTSUITABILITYDESCRIPTION", projectSuitabilityExplanation],
  ]);
  const protectedTokens = [];
  for (const key of Object.keys(tokenValues)) {
    const folded = normalizeServerTemplateTokenName(key);
    if (!overrides.has(folded)) continue;
    tokenValues[key] = overrides.get(folded);
    protectedTokens.push(key);
  }
  return { version: 1, protectedTokens };
}

async function createDerivedValuationVerification(user, templateKey, derived, protectedResolution = {}) {
  const issuedAt = new Date().toISOString();
  const accountFingerprint = crypto.createHash("sha256").update(user.uid).digest("hex").slice(0, 16);
  const verification = { version: 2, templateKey, issuedAt, accountFingerprint, derived, protectedResolution };
  verification.signature = crypto.createHmac("sha256", await getExportSigningKey())
    .update(JSON.stringify(verification))
    .digest("base64url");
  return verification;
}

async function readPrivateTemplate(templateKey) {
  const filePath = privateTemplatePathForKey(templateKey);
  if (!filePath) return null;
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

// Gerçek .docx şablonlar (ör. Emlak Katılım) — kullanıcının bankaya sunduğu
// orijinal Word dosyasının logo/çerçeve/sayfa düzeni BOZULMADAN korunması
// için HTML'e çevrilmez; ham baytlar olarak servis edilir, doldurma
// (placeholder → değer) tamamen istemcide (src/exports/docx-fill.js) yapılır
// — templates/*.html gibi HTTP ile statik verilmez, yalnızca bu API ile.
async function readPrivateTemplateBinary(templateKey) {
  const filePath = privateTemplatePathForKey(templateKey);
  if (!filePath || !filePath.toLowerCase().endsWith(".docx")) return null;
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function requireApprovedReportUser(response, user) {
  if (await isUserApproved(user.uid, user.email)) return true;
  sendJson(response, 403, { ok: false, error: "Rapor sablonu islemleri icin onayli kullanici hesabi gerekir." });
  return false;
}

async function handleReportTemplateTokensApi(request, response, user, url) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (!(await requireApprovedReportUser(response, user))) return;
  const templateKey = String(new URL(url, `http://${host}:${port}`).searchParams.get("key") || "").trim();
  const templateText = await readPrivateTemplate(templateKey);
  if (!templateText) {
    sendJson(response, 404, { ok: false, error: "Sablon bulunamadi." });
    return;
  }
  sendJson(response, 200, { ok: true, tokens: collectTemplateTokens(templateText) });
}

// Kullanıcı talebi (2026-08-03): "word formatını bozmamalıydın... emlak
// katılım... template dosyasını word olarak tutabilirsin" — Emlak Katılım
// gibi gerçek .docx şablonlar HTML'e çevrilip sunucuda metin olarak
// render edilmez (word/document.xml içindeki {{TOKEN}} yer tutucuları
// ham bayt düzeyinde korunmalı ki logo/çerçeve/sayfa düzeni bozulmasın).
// Bu endpoint yalnızca ham .docx baytlarını (onaylı kullanıcıya) verir;
// doldurma tamamen istemcide (src/exports/docx-fill.js) yapılır.
async function handleReportTemplateDocxApi(request, response, user, url) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (!(await requireApprovedReportUser(response, user))) return;
  const templateKey = String(new URL(url, `http://${host}:${port}`).searchParams.get("key") || "").trim();
  const templateBytes = await readPrivateTemplateBinary(templateKey);
  if (!templateBytes) {
    sendJson(response, 404, { ok: false, error: "Sablon bulunamadi." });
    return;
  }
  response.writeHead(200, {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Length": templateBytes.length,
    "Cache-Control": "no-store",
  });
  response.end(templateBytes);
}

async function handleReportTemplateRenderApi(request, response, user) {
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "Bu islem desteklenmiyor." });
    return;
  }
  if (!(await requireApprovedReportUser(response, user))) return;
  let body;
  try {
    body = JSON.parse((await readBody(request, 25 * 1024 * 1024)) || "{}");
  } catch {
    sendJson(response, 400, { ok: false, error: "Sablon verisi gecersiz." });
    return;
  }
  const templateKey = String(body?.templateKey || "").trim();
  const templateText = await readPrivateTemplate(templateKey);
  const tokenValues = body?.tokenValues;
  if (!templateText || !tokenValues || typeof tokenValues !== "object" || Array.isArray(tokenValues)) {
    sendJson(response, 400, { ok: false, error: "Sablon veya alan verisi gecersiz." });
    return;
  }
  const allowedTokens = new Set(collectTemplateTokens(templateText));
  const acceptedValues = {};
  let totalLength = 0;
  for (const [rawName, rawValue] of Object.entries(tokenValues)) {
    const name = String(rawName || "").trim();
    const value = String(rawValue ?? "");
    totalLength += value.length;
    if (allowedTokens.has(name) && value.length <= 2 * 1024 * 1024) acceptedValues[name] = value;
  }
  if (totalLength > 20 * 1024 * 1024) {
    sendJson(response, 413, { ok: false, error: "Rapor alanlari izin verilen boyutu asiyor." });
    return;
  }
  // Kullanici piyasa degerini uzman takdiriyle girer; ondan tureyen acil satis
  // degerleri ise resmi cikti icin yalnizca sunucunun kuralindan gelir.
  const derivedValuation = applyServerDerivedValuationTokens(acceptedValues, body?.valuationInput);
  // Form yazimi sirasinda istek yapilmaz. Bu kurallar yalnizca zaten var olan
  // rapor olusturma isteginde sunucunun ham alanlardan tekrar hesaplanir.
  const protectedResolution = applyServerProtectedPlaceholderTokens(acceptedValues, body?.protectedPlaceholderInput);
  const valuationVerification = await createDerivedValuationVerification(user, templateKey, derivedValuation, protectedResolution);
  await logActivityEvent("report-derived-valuation-rendered", user.uid, user.email, {
    templateKey,
    legalUrgentSaleValue: derivedValuation.legalUrgentSaleValue || null,
    currentUrgentSaleValue: derivedValuation.currentUrgentSaleValue || null,
  });
  sendJson(response, 200, {
    ok: true,
    content: renderPrivateTemplate(templateText, acceptedValues),
    valuationVerification,
  });
}

async function handleLoginEventsApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const events = await listLoginEvents(500);
  sendJson(response, 200, { ok: true, events });
}

// Kullanıcı talebi (admin paneli eleştirel değerlendirme, Faz 1): admin
// işlem geçmişi (onay/red/yetki/askıya alma/silme) — kim, kime, ne zaman.
async function handleAdminActionEventsApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const events = await listAdminActionEvents(500);
  sendJson(response, 200, { ok: true, events });
}

// Kullanıcı talebi (admin paneli Faz 3): sistem sağlığı kartı.
async function handleSystemHealthApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const health = await computeSystemHealth();
  sendJson(response, 200, { ok: true, health });
}

async function handleUserStatsApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const stats = await computeUserReportStats();
  sendJson(response, 200, { ok: true, stats });
}

async function handleReportListApi(request, response, user) {
  if (request.method !== "GET") {
    sendJson(response, 405, { ok: false, error: "Bu işlem desteklenmiyor." });
    return;
  }
  if (!requireAdmin(response, user)) return;
  const reports = await computeReportListForAdmin();
  sendJson(response, 200, { ok: true, reports });
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
  const relativePath = path.relative(path.resolve(appDir), filePath).replace(/\\/g, "/");
  // Not: bu blok yalnizca gercekten proprietary (metni/tasarimi kopyalanabilir)
  // banka rapor sablonlarini (HTML/DOCX) korur — onlar sadece /api/report-template-*
  // uzerinden servis edilir. .xlsx sablonlari (orn. templates/ziraat-ek-tablo.xlsx)
  // ise icerik acisindan hassas olmayan, tamamen istemci tarafinda doldurulan bos
  // bicimlendirme kabuklaridir; asagidaki normal oturum-auth kapisindan gecmeye
  // devam ederler. Bu istisna olmadan ziraat-ek-tablo-xlsx.js'nin dogrudan fetch()
  // cagrisi 404 alip "Ek Tablo" zip paketinden sessizce dusuyordu (2026-08-05).
  if (relativePath.startsWith("templates/") && !relativePath.toLowerCase().endsWith(".xlsx")) {
    applySecurityHeaders(response);
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Sablonlar dogrudan indirilemez.");
    return;
  }
  if (!isPublicStaticFile(relativePath)) {
    const session = await getSessionFromRequest(request);
    if (!session) {
      applySecurityHeaders(response);
      if (relativePath.toLowerCase().endsWith(".html")) {
        const nextParam = encodeURIComponent(`/${relativePath}`);
        response.writeHead(302, { Location: `/login.html?next=${nextParam}`, "Cache-Control": "no-store" });
        response.end();
      } else {
        response.writeHead(401, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
        response.end("Giriş gerekli.");
      }
      return;
    }
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
  "/api/tcmb-rates": { limit: 30, windowMs: 60 * 1000 },
  "/api/pdf-text": { limit: 5, windowMs: 60 * 1000 },
  "/api/session": { limit: 20, windowMs: 60 * 1000 },
  "/api/register-pending": { limit: 10, windowMs: 60 * 1000 },
  "/api/pending-users": { limit: 60, windowMs: 60 * 1000 },
  "/api/approve-user": { limit: 30, windowMs: 60 * 1000 },
  "/api/reject-user": { limit: 30, windowMs: 60 * 1000 },
  "/api/approved-users": { limit: 60, windowMs: 60 * 1000 },
  "/api/grant-privilege": { limit: 30, windowMs: 60 * 1000 },
  "/api/revoke-privilege": { limit: 30, windowMs: 60 * 1000 },
  "/api/account-profile": { limit: 30, windowMs: 60 * 1000 },
  "/api/account-delete": { limit: 5, windowMs: 60 * 1000 },
  "/api/admin-user-status": { limit: 30, windowMs: 60 * 1000 },
  "/api/admin-user-delete": { limit: 15, windowMs: 60 * 1000 },
  "/api/my-role": { limit: 60, windowMs: 60 * 1000 },
  "/api/report-event": { limit: 60, windowMs: 60 * 1000 },
  "/api/export-authorization": { limit: 12, windowMs: 60 * 1000 },
  "/api/report-template-tokens": { limit: 60, windowMs: 60 * 1000 },
  "/api/report-template-render": { limit: 12, windowMs: 60 * 1000 },
  "/api/report-template-docx": { limit: 12, windowMs: 60 * 1000 },
  "/api/login-events": { limit: 30, windowMs: 60 * 1000 },
  "/api/admin-action-events": { limit: 30, windowMs: 60 * 1000 },
  "/api/system-health": { limit: 20, windowMs: 60 * 1000 },
  "/api/user-stats": { limit: 30, windowMs: 60 * 1000 },
  "/api/report-list": { limit: 30, windowMs: 60 * 1000 },
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
    const mapTile = parseMapTileRequest(url);
    if (mapTile) {
      await handleMapTile(response, mapTile);
      return;
    }
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
    if (apiRoute === "/api/tcmb-rates") {
      await handleTcmbRatesApi(request, response);
      return;
    }
    if (apiRoute === "/api/pdf-text") {
      await handlePdfTextApi(request, response);
      return;
    }
    if (apiRoute === "/api/session") {
      await handleSessionApi(request, response, url, request.user);
      return;
    }
    if (apiRoute === "/api/register-pending") {
      await handleRegisterPendingApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/pending-users") {
      await handlePendingUsersListApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/approve-user") {
      await handleApproveUserApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/reject-user") {
      await handleRejectUserApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/approved-users") {
      await handleApprovedUsersListApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/grant-privilege") {
      await handleGrantPrivilegeApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/revoke-privilege") {
      await handleRevokePrivilegeApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/account-profile") {
      await handleAccountProfileApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/account-delete") {
      await handleDeleteOwnAccountApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/admin-user-status") {
      await handleManagedUserStatusApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/admin-user-delete") {
      await handleDeleteManagedUserApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/my-role") {
      await handleMyRoleApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/report-event") {
      await handleReportEventApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/export-authorization") {
      await handleExportAuthorizationApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/report-template-tokens") {
      await handleReportTemplateTokensApi(request, response, request.user, url);
      return;
    }
    if (apiRoute === "/api/report-template-render") {
      await handleReportTemplateRenderApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/report-template-docx") {
      await handleReportTemplateDocxApi(request, response, request.user, url);
      return;
    }
    if (apiRoute === "/api/login-events") {
      await handleLoginEventsApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/admin-action-events") {
      await handleAdminActionEventsApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/system-health") {
      await handleSystemHealthApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/user-stats") {
      await handleUserStatsApi(request, response, request.user);
      return;
    }
    if (apiRoute === "/api/report-list") {
      await handleReportListApi(request, response, request.user);
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
  parseMapTileRequest,
  queryNeighborhoodRows,
  isPublicStaticFile,
  createSession,
  destroySession,
  getSessionFromRequest,
  setSessionCookie,
  clearSessionCookie,
  parseCookieHeader,
  sessions,
  isMfaConfigured,
  getExportSigningKey,
  handleExportAuthorizationApi,
  privateTemplatePathForKey,
  collectTemplateTokens,
  renderPrivateTemplate,
  normalizeServerTemplateTokenName,
  parseServerValuationNumber,
  calculateServerDerivedValuation,
  applyServerDerivedValuationTokens,
  buildServerBuildingFootprintAndEntranceExplanation,
  buildServerProjectSuitabilityDescription,
  applyServerProtectedPlaceholderTokens,
  handleReportTemplateTokensApi,
  handleReportTemplateRenderApi,
  handleReportTemplateDocxApi,
  readPrivateTemplateBinary,
  generateMfaCode,
  markDeviceTrusted,
  isRequestFromTrustedDevice,
  setTrustCookie,
  trustedDevices,
  mfaCodes,
  buildMfaEmailHtml,
  MAX_TRUSTED_DEVICES_PER_USER,
  accessRoles,
  isUserApproved,
  isUserPrivileged,
  approvedUserStatus,
  WORK_TYPE_OPTIONS,
  registerPendingUser,
  approveUser,
  updateOwnUserProfile,
  setManagedUserStatus,
  revokeUserSessionsAndTrustedDevices,
  deleteManagedUser,
  rejectPendingUser,
  listPendingUsers,
  listApprovedUsers,
  grantPrivilege,
  revokePrivilege,
  requireAdmin,
  parseTcmbCurrency,
  parseTcmbRates,
  pendingUsers,
  approvedUsers,
  privilegedUsers,
  logActivityEvent,
  listLoginEvents,
  computeUserReportStats,
  activityEvents,
  buildNewUserNotificationEmailHtml,
  sendEmailViaResend,
  stripEmailHtmlToText,
  sanitizeReportSummary,
  computeReportListForAdmin,
  handleReportListApi,
  listAdminActionEvents,
  handleAdminActionEventsApi,
  computeDirectorySize,
  computeSystemHealth,
  handleSystemHealthApi,
  handleApproveUserApi,
  handleRejectUserApi,
  handleGrantPrivilegeApi,
  handleRevokePrivilegeApi,
  handleManagedUserStatusApi,
  handleDeleteManagedUserApi,
  ADMIN_ACTION_EVENT_TYPES,
  REPORT_SUMMARY_FIELDS,
  handleStatic,
  resolveStaticPath,
  server,
};
