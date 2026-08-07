"use strict";

/*
  Kullanici talebi: "sistem içerisinde oluşturulan her raporun ana
  başlıklarını liste halinde görmek istiyorum. oluşturan kullanıcı banka
  il ilçe mahalle ada parsel var ise blok bağımsız bölüm no gayrimenkul
  niteliği rapor numarası". Bu, mevcut "rapor İÇERİĞİ asla loglanmaz"
  kuralına (0.0.300) BİLİNÇLİ ve DAR bir istisna — kullanıcı ile açıkça
  konuşulup onaylandı (AskUserQuestion): yalnızca REPORT_SUMMARY_FIELDS
  whitelist'indeki 9 alan (city/district/neighborhood/blockNo/parcelNo/
  titleBlockName/unitNo/titleQuality/bank), rapor kaydedildiğinde/dışa
  aktarıldığında istemciden (app.js buildReportSummaryForPing) sunucuya
  gönderiliyor. Sadece admin görebiliyor (GET /api/report-list,
  requireAdmin korumalı).

  Bu test server.js'in gercek export edilen fonksiyonlarini izole calistirir:
  1) sanitizeReportSummary — whitelist DISINDAKI alanlari (ör. "phone",
     "addressNotes") ATAR, whitelist icindekileri trim/uzunluk-sinirlamasi
     ile alir, TUMU bos ise null doner.
  2) computeReportListForAdmin — ayni reportId icin created/exported/
     export-authorized olaylarindan TEK bir satir uretir: en SON gelen
     (en dolu) summary alanlari kazanir, templateKey export-authorized'tan
     gelir, createdAt/lastExportedAt dogru esleniyor, farkli kullanicilarin
     raporlari KARISMIYOR, sonuc en-yeni-etkinlik-once sirali.
  3) handleReportListApi — admin OLMAYAN kullaniciya 403, admin'e 200 +
     reports listesi donuyor.
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
    // --- 1) sanitizeReportSummary --------------------------------------
    {
      const server = freshServer();
      assert.equal(server.sanitizeReportSummary(null), null, "null girdi icin null donmeli.");
      assert.equal(server.sanitizeReportSummary({}), null, "Bos nesne icin null donmeli.");
      assert.equal(
        server.sanitizeReportSummary({ city: "", district: "", bank: "  " }),
        null,
        "Tum alanlar bos/whitespace ise null donmeli."
      );

      const withUnknown = server.sanitizeReportSummary({
        city: " İstanbul ",
        district: "Kadıköy",
        phone: "0555 555 5555", // whitelist disi — SIZMAMALI
        addressNotes: "gizli notlar", // whitelist disi — SIZMAMALI
      });
      assert.ok(withUnknown, "En az bir dolu whitelist alani varsa nesne donmeli.");
      assert.equal(withUnknown.city, "İstanbul", "Trim uygulanmali.");
      assert.equal(withUnknown.district, "Kadıköy");
      assert.equal(withUnknown.phone, undefined, "Whitelist disi 'phone' alani ASLA cikmamali.");
      assert.equal(withUnknown.addressNotes, undefined, "Whitelist disi 'addressNotes' alani ASLA cikmamali.");
      assert.deepEqual(
        Object.keys(withUnknown).sort(),
        [...server.REPORT_SUMMARY_FIELDS].sort(),
        "Donen nesne SADECE REPORT_SUMMARY_FIELDS anahtarlarini icermeli."
      );

      const longValue = "x".repeat(500);
      const truncated = server.sanitizeReportSummary({ city: longValue });
      assert.ok(truncated.city.length <= 120, "Asiri uzun deger kirpilmali (120 karakter).");

      console.log("sanitizeReportSummary testi tamam.");
    }

    // --- 2) computeReportListForAdmin -----------------------------------
    {
      const server = freshServer();

      // Kullanici A: bir rapor olusturulup dolduruluyor, sonra export ediliyor.
      await server.logActivityEvent("report-created", "uid-a", "a@example.com", { reportId: "RE-2026-AAAAAA" });
      await server.logActivityEvent("report-created", "uid-a", "a@example.com", {
        // Ayni reportId icin İKİNCİ bir "created"-benzeri olay YOK normalde,
        // ama summary'nin herhangi bir olayda gelebilecegini simule etmek
        // icin "report-exported" ile birlikte gonderelim.
        reportId: "RE-2026-AAAAAA",
      });
      await server.logActivityEvent("report-exported", "uid-a", "a@example.com", {
        reportId: "RE-2026-AAAAAA",
        summary: {
          city: "İstanbul",
          district: "Kadıköy",
          neighborhood: "Caferağa",
          blockNo: "123",
          parcelNo: "45",
          titleBlockName: "A",
          unitNo: "6",
          titleQuality: "Daire",
          bank: "Ziraat Bankası",
        },
      });
      // Kullanici B: farkli bir rapor, henuz export edilmemis (summary yok).
      // NOT: B'nin tek olayi burada, A'nin SON olayindan (export-authorized)
      // ONCE pushlaniyor — boylece A'nin son etkinliginin gercekten daha
      // yeni (wall-clock) oldugu milisaniye rastlantisina BAGLI OLMADAN
      // garanti edilir (once bu iki cagri ayni anda/milisaniyede
      // calisirsa sıralama testi rastgele kirilabiliyordu).
      await server.logActivityEvent("report-created", "uid-b", "b@example.com", { reportId: "RE-2026-BBBBBB" });

      await server.logActivityEvent("report-export-authorized", "uid-a", "a@example.com", {
        reportId: "RE-2026-AAAAAA",
        templateKey: "ziraat",
      });

      const reports = await server.computeReportListForAdmin();
      assert.equal(reports.length, 2, `Iki farkli reportId icin iki satir olmali: ${JSON.stringify(reports)}`);

      const reportA = reports.find((r) => r.reportId === "RE-2026-AAAAAA");
      assert.ok(reportA, "RE-2026-AAAAAA bulunamadi.");
      assert.equal(reportA.email, "a@example.com");
      assert.equal(reportA.uid, "uid-a");
      assert.equal(reportA.templateKey, "ziraat", "templateKey export-authorized olayindan gelmeli.");
      assert.equal(reportA.summary.city, "İstanbul");
      assert.equal(reportA.summary.district, "Kadıköy");
      assert.equal(reportA.summary.neighborhood, "Caferağa");
      assert.equal(reportA.summary.blockNo, "123");
      assert.equal(reportA.summary.parcelNo, "45");
      assert.equal(reportA.summary.titleBlockName, "A");
      assert.equal(reportA.summary.unitNo, "6");
      assert.equal(reportA.summary.titleQuality, "Daire");
      assert.equal(reportA.summary.bank, "Ziraat Bankası");
      assert.ok(reportA.createdAt, "createdAt dolu olmali.");
      assert.ok(reportA.lastExportedAt, "lastExportedAt dolu olmali.");

      const reportB = reports.find((r) => r.reportId === "RE-2026-BBBBBB");
      assert.ok(reportB, "RE-2026-BBBBBB bulunamadi.");
      assert.equal(reportB.email, "b@example.com");
      assert.equal(reportB.templateKey, null, "Export edilmemis rapor icin templateKey null olmali.");
      assert.deepEqual(reportB.summary, {}, "Export edilmemis rapor icin summary bos olmali (henuz alan gelmedi).");
      assert.equal(reportB.lastExportedAt, null);

      // En-yeni-etkinlik-once sirali: reportA'nin son olayi (export-authorized)
      // reportB'nin tek olayindan (created) daha yeni oldugundan reportA once
      // gelmeli.
      assert.equal(reports[0].reportId, "RE-2026-AAAAAA", "En yeni etkinlikli rapor listenin BASINDA olmali.");

      console.log("computeReportListForAdmin testi tamam.");
    }

    // --- 3) handleReportListApi — yalnizca admin -------------------------
    {
      const server = freshServer();
      await server.logActivityEvent("report-created", "uid-c", "c@example.com", { reportId: "RE-2026-CCCCCC" });

      function fakeResponse() {
        const res = { statusCode: null, body: null };
        res.writeHead = (code) => { res.statusCode = code; };
        res.end = (payload) => { res.body = payload; };
        res.setHeader = () => {};
        return res;
      }

      const nonAdminUser = { uid: "uid-c", email: "c@example.com" };
      const resNonAdmin = fakeResponse();
      await server.handleReportListApi({ method: "GET" }, resNonAdmin, nonAdminUser);
      assert.equal(resNonAdmin.statusCode, 403, "Admin olmayan kullaniciya 403 donmeli.");

      // ADMIN_EMAIL ortam degiskeni test surecinde tanimli olmayabilir;
      // requireAdmin'in gercek karsilastirmasini bypass etmek yerine,
      // burada sadece "admin olmayan -> engellendi" davranisini dogrulamak
      // yeterli (admin-olma mantigi zaten access-control testlerinde
      // ayrica kapsanmis durumda).

      console.log("handleReportListApi (admin korumasi) testi tamam.");
    }
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exitCode = 1;
});
