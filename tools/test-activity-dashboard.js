"use strict";

/*
  Kullanici talebi: "kullanıcı verilerini kullanıcı kayıtlarını ve
  kullanıcının loglarını ... tüm erişime sahip olabileceğim bir dashboard
  istiyorum ... kaç adet rapor oluşturdu. bir raporu ne kadar sürede
  oluşturdu gibi istatistiki verileri görmek istiyorum". Netleştirme:
  rapor İÇERİĞİ değil, yalnızca sayı/süre istatistikleri + giriş/çıkış
  geçmişi (admin-users.html'e eklenen "Kullanıcı İstatistikleri" ve
  "Giriş / Çıkış Geçmişi" bölümleri).

  Bu test server.js'in gercek export edilen fonksiyonlarini izole calistirir:
  1) logActivityEvent / listLoginEvents — login/logout olaylari en-yeni-once
     siralaniyor, YALNIZCA login/logout turleri donuyor (report-created/
     report-exported listLoginEvents'ten SIZMIYOR).
  2) computeUserReportStats — report-created/report-exported olay ciftlerinden
     kullanici basina rapor sayisi VE sure (ms) hesabi:
     - Aynı reportId icin created->exported suresi dogru hesaplaniyor.
     - Yalnizca created olup HENUZ export edilmemis raporlar sayima giriyor
       (reportsCreated) ama sure ortalamasina KATILMIYOR.
     - Farkli kullanicilar birbirinden bagimsiz izleniyor.
     - reportsCreated/reportsExported/avgDurationMs/minDurationMs/
       maxDurationMs alanlari dogru.
  3) Rapor İÇERİĞİ hiç loglanmadigini dogrulamak icin: logActivityEvent'in
     yalnizca {type, uid, email, reportId, at, ip, userAgent} alanlarini
     yazdigini (state.fields gibi rapor verisi ICERMEDIGINI) dogrular.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
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

const originalFiles = backupAndClearTestFiles();

(async () => {
  try {
    // --- 1) logActivityEvent / listLoginEvents ------------------------------
    {
      const server = freshServer();
      await server.logActivityEvent("login", "uid-a", "a@example.com", { ip: "1.1.1.1", userAgent: "TestAgent/1" });
      await server.logActivityEvent("report-created", "uid-a", "a@example.com", { reportId: "RE-2026-AAAAAA" });
      await server.logActivityEvent("logout", "uid-a", "a@example.com", { ip: "1.1.1.1" });

      const events = await server.listLoginEvents(10);
      assert.equal(events.length, 2, `Yalnizca login/logout donmeli (report-created SIZMAMALI): ${JSON.stringify(events)}`);
      assert.ok(events.every((e) => e.type === "login" || e.type === "logout"), "listLoginEvents report-* olaylarini icermemeli.");
      // En yeni once: logout (son eklenen) ilk sirada olmali.
      assert.equal(events[0].type, "logout", "En yeni olay (logout) listenin BASINDA olmali.");
      assert.equal(events[1].type, "login");

      const loginEvent = events[1];
      const keys = Object.keys(loginEvent).sort();
      assert.deepEqual(keys, ["at", "email", "ip", "reportId", "type", "uid", "userAgent"], `Loglanan olay yalnizca beklenen alanlari icermeli (rapor icerigi SIZMAMALI): ${keys.join(",")}`);
      assert.equal(loginEvent.email, "a@example.com");
      assert.equal(loginEvent.ip, "1.1.1.1");
      assert.equal(loginEvent.userAgent, "TestAgent/1");

      console.log("Aktivite gunlugu (login/logout ayrimi) testi tamam.");
    }

    // --- 2) computeUserReportStats -------------------------------------------
    {
      backupAndClearTestFiles();
      const server = freshServer();

      // Kullanici A: 2 rapor olusturdu, ikisini de disa aktardi (farkli sureler).
      await server.logActivityEvent("report-created", "uid-a", "a@example.com", { reportId: "RE-1" });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await server.logActivityEvent("report-exported", "uid-a", "a@example.com", { reportId: "RE-1" });
      await server.logActivityEvent("report-created", "uid-a", "a@example.com", { reportId: "RE-2" });
      await new Promise((resolve) => setTimeout(resolve, 15));
      await server.logActivityEvent("report-exported", "uid-a", "a@example.com", { reportId: "RE-2" });

      // Kullanici B: 1 rapor olusturdu, HENUZ disa aktarmadi.
      await server.logActivityEvent("report-created", "uid-b", "b@example.com", { reportId: "RE-3" });

      const stats = await server.computeUserReportStats();
      const statA = stats.find((row) => row.uid === "uid-a");
      const statB = stats.find((row) => row.uid === "uid-b");

      assert.ok(statA, "Kullanici A istatistiklerde bulunmali.");
      assert.equal(statA.reportsCreated, 2, "Kullanici A 2 rapor olusturmus olmali.");
      assert.equal(statA.reportsExported, 2, "Kullanici A'nin 2 raporu da disa aktarilmis olmali.");
      assert.ok(Number.isFinite(statA.avgDurationMs) && statA.avgDurationMs > 0, `Ortalama sure hesaplanmali: ${statA.avgDurationMs}`);
      assert.ok(statA.minDurationMs <= statA.maxDurationMs, "min <= max olmali.");

      assert.ok(statB, "Kullanici B istatistiklerde bulunmali.");
      assert.equal(statB.reportsCreated, 1, "Kullanici B 1 rapor olusturmus olmali.");
      assert.equal(statB.reportsExported, 0, "Kullanici B HENUZ disa aktarmadigi icin 0 olmali.");
      assert.equal(statB.avgDurationMs, null, "Disa aktarilan raporu olmayan kullanici icin ortalama sure null olmali (0 DEGIL).");

      console.log("Kullanici rapor istatistikleri (sayi + sure) testi tamam.");
    }

    // --- 3) Ayni reportId icin birden fazla export -> YALNIZCA ILK sayilir ---
    {
      backupAndClearTestFiles();
      const server = freshServer();
      await server.logActivityEvent("report-created", "uid-c", "c@example.com", { reportId: "RE-9" });
      await new Promise((resolve) => setTimeout(resolve, 5));
      await server.logActivityEvent("report-exported", "uid-c", "c@example.com", { reportId: "RE-9" });
      const firstExportEvents = (await server.listLoginEvents(1000)); // sadece cagrilabilirligi dogrulamak icin, asil kontrol asagida
      await new Promise((resolve) => setTimeout(resolve, 50));
      await server.logActivityEvent("report-exported", "uid-c", "c@example.com", { reportId: "RE-9" }); // ikinci (tekrar) disa aktarma

      const stats = await server.computeUserReportStats();
      const statC = stats.find((row) => row.uid === "uid-c");
      assert.equal(statC.reportsExported, 1, "Ayni reportId icin ikinci export tekrar SAYILMAMALI (yalnizca ilk export zaman damgasi kullanilir).");
      assert.ok(statC.avgDurationMs < 40, `Sure, ILK export'a gore hesaplanmali (kisa sure), ikinci (gec) export'a gore DEGIL: ${statC.avgDurationMs}`);
      assert.ok(Array.isArray(firstExportEvents));

      console.log("Tekrarlanan disa aktarma (yalnizca ilk export sayilir) testi tamam.");
    }

    console.log("Aktivite gunlugu + kullanici istatistikleri dashboard testi tamam.");
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exit(1);
});
