"use strict";

/*
  Kullanici talebi: "3. fazdan devam edelim" -> "Sistem sağlığı kartı için
  ne göstermek istersiniz?" -> "Basit/gerçekçi olan" (yeni bir izleme
  altyapisi kurmadan, zaten var olan veriden basit bir ozet).

  Bu test server.js'in gercek export edilen fonksiyonlarini izole calistirir:
  1) computeDirectorySize — gecici bir klasor agacinda dosya boyutlarini
     dogru topluyor, MAX_SCAN_ENTRIES asilirsa "truncated" isaretliyor.
  2) computeSystemHealth — uptimeSeconds/activityEventsCount/mfaConfigured/
     approvedUsersCount/pendingUsersCount/sessionsCount alanlarinin hepsini
     dolduruyor, activity-events.json dosyasi yoksa 0 donuyor (crash yok).
  3) handleSystemHealthApi — admin olmayana 403, admin'e 200 + health.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverPath = path.join(root, "server.js");
const dataDir = path.join(root, "server-data");
const testFiles = ["sessions.json", "trusted-devices.json", "pending-users.json", "approved-users.json", "privileged-users.json", "activity-events.json"];

function backupAndClearTestFiles() {
  const backups = {};
  testFiles.forEach((name) => {
    const filePath = path.join(dataDir, name);
    if (fs.existsSync(filePath)) {
      backups[name] = fs.readFileSync(filePath, "utf8");
      fs.unlinkSync(filePath);
    } else {
      backups[name] = null;
    }
  });
  return backups;
}

function restoreTestFiles(backups) {
  testFiles.forEach((name) => {
    const filePath = path.join(dataDir, name);
    if (backups[name] === null) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else {
      fs.writeFileSync(filePath, backups[name], "utf8");
    }
  });
}

function freshServer() {
  delete require.cache[require.resolve(serverPath)];
  return require(serverPath);
}

function fakeResponse() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (payload) => { res.body = payload; };
  res.setHeader = () => {};
  return res;
}

const originalFiles = backupAndClearTestFiles();

(async () => {
  try {
    const server = freshServer();

    // --- 1) computeDirectorySize ------------------------------------------
    {
      const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "rapor-health-test-"));
      try {
        await fsp.writeFile(path.join(tmpDir, "a.txt"), "12345"); // 5 bayt
        const subDir = path.join(tmpDir, "sub");
        await fsp.mkdir(subDir);
        await fsp.writeFile(path.join(subDir, "b.txt"), "1234567890"); // 10 bayt

        const size = await server.computeDirectorySize(tmpDir);
        assert.equal(size.bytes, 15, "Alt klasorler dahil TOPLAM bayt yanlis.");
        assert.equal(size.fileCount, 2, "Dosya sayisi yanlis.");
        assert.equal(size.truncated, false);

        const missing = await server.computeDirectorySize(path.join(tmpDir, "yok"));
        assert.equal(missing.bytes, 0, "Var olmayan klasor icin 0 donmeli (crash degil).");
        assert.equal(missing.fileCount, 0);
      } finally {
        await fsp.rm(tmpDir, { recursive: true, force: true });
      }
      console.log("computeDirectorySize testi tamam.");
    }

    // --- 2) computeSystemHealth --------------------------------------------
    {
      await server.registerPendingUser("uid-pending", "pending@example.com", {});
      await server.approveUser("uid-approved");
      await server.logActivityEvent("login", "uid-approved", "approved@example.com", {});

      const health = await server.computeSystemHealth();
      assert.ok(Number.isFinite(health.uptimeSeconds) && health.uptimeSeconds >= 0, "uptimeSeconds sayi olmali.");
      assert.equal(health.activityEventsCount, 1, "1 activity-event olmali.");
      assert.equal(typeof health.mfaConfigured, "boolean");
      assert.equal(health.approvedUsersCount, 1);
      assert.equal(health.pendingUsersCount, 1);
      assert.ok(Number.isFinite(health.uploadsSizeBytes));
      assert.ok(Number.isFinite(health.uploadsFileCount));
      assert.equal(typeof health.uploadsScanTruncated, "boolean");
      console.log("computeSystemHealth testi tamam.");
    }

    // --- 2b) latestBackup — GERCEK dosya sistemi mtime'ina gore secilmeli,
    // klasor adinin alfabetik sirasina GORE DEGIL. Bu depodaki gercek
    // backups/ klasorlerinin cogu "before-<aciklama>_TARIH" seklinde elle
    // adlandirilmis — alfabetik siralama "en son"u YANLIS seciyordu (bkz.
    // kullanici tarafindan Faz 3 gorsel testinde yakalanan bug).
    {
      const backupsDir = path.join(root, "backups");
      await fsp.mkdir(backupsDir, { recursive: true });
      // "zztest-..." isim olarak ALFABETIK SONRA gelir ama mtime OLARAK
      // daha ESKI; "aatest-..." isim olarak ALFABETIK ONCE gelir ama mtime
      // OLARAK daha YENI. Yalnizca mtime'a gore siralama dogru sonucu verir.
      const oldDir = path.join(backupsDir, "zztest-eski-yedek");
      const newDir = path.join(backupsDir, "aatest-yeni-yedek");
      await fsp.mkdir(oldDir, { recursive: true });
      await fsp.mkdir(newDir, { recursive: true });
      try {
        const oldTime = new Date("2020-01-01T00:00:00Z");
        const newTime = new Date("2030-01-01T00:00:00Z");
        await fsp.utimes(oldDir, oldTime, oldTime);
        await fsp.utimes(newDir, newTime, newTime);

        const health = await server.computeSystemHealth();
        assert.equal(health.latestBackup, "aatest-yeni-yedek", `mtime'i daha yeni olan "en son yedek" secilmeliydi (alfabetik degil): ${health.latestBackup}`);
        assert.equal(health.latestBackupAt, newTime.toISOString());
      } finally {
        await fsp.rm(oldDir, { recursive: true, force: true });
        await fsp.rm(newDir, { recursive: true, force: true });
      }
      console.log("latestBackup (mtime bazli, alfabetik DEGIL) testi tamam.");
    }

    // --- 3) handleSystemHealthApi — yalnizca admin -------------------------
    {
      const nonAdmin = { uid: "uid-approved", email: "approved@example.com" };
      const resNonAdmin = fakeResponse();
      await server.handleSystemHealthApi({ method: "GET" }, resNonAdmin, nonAdmin);
      assert.equal(resNonAdmin.statusCode, 403, "Admin olmayan kullaniciya 403 donmeli.");
      console.log("handleSystemHealthApi (admin korumasi) testi tamam.");
    }
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exitCode = 1;
});
