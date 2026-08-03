"use strict";

/*
  Kullanici talebi: "yeni bir kullanıcı hesap oluşturma isteğinde
  bulunduğunda admine mail gelsin böylelikle gözden kaçırmam".

  Gercek Resend API cagrisini (https.request) hicbir test bu depoda tetiklemiyor
  (bkz. test-mfa-flow.js — ayni desen); bu yuzden bu test iki katmani izole
  dogrular:

  1) registerPendingUser'in DÖNÜŞ DEĞERİ — handleRegisterPendingApi bu degeri
     "admine bildirim e-postasi gonderilsin mi?" kararinda kullaniyor:
     - Ilk kayitta true (GERCEKTEN yeni bir bekleyen kayit olusturuldu).
     - Ayni uid tekrar "kayit olsa" (zaten bekliyor) false — TEKRAR bildirim
       GONDERILMEMELI.
     - Zaten ONAYLI bir uid icin false (ör. admin/mevcut kullanici) — bildirim
       GONDERILMEMELI.
     - Reddedilip TEKRAR kayit olan bir kullanici icin yine true (yeni bir
       bekleyen kayit, bildirim HAKLI olarak tekrar gonderilmeli).
  2) buildNewUserNotificationEmailHtml — profildeki HTML enjeksiyonuna karsi
     kacislama (XSS), yalnizca DOLU alanlarin gosterilmesi, admin panel
     linkinin dogru oldugu.
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
    // --- 1) registerPendingUser dönüş değeri ---------------------------------
    {
      const server = freshServer();
      const adminEmail = server.accessRoles.ADMIN_EMAIL;

      const firstCall = await server.registerPendingUser("uid-new-1", "yeni@example.com", { fullName: "Yeni Kullanıcı" });
      assert.equal(firstCall, true, "İlk kayıtta true dönmeli (bildirim gönderilmeli).");

      const repeatCall = await server.registerPendingUser("uid-new-1", "yeni@example.com", { fullName: "Yeni Kullanıcı" });
      assert.equal(repeatCall, false, "Zaten bekleyen bir kullanıcı tekrar 'kayıt olsa' false dönmeli (tekrar bildirim GÖNDERİLMEMELİ).");

      await server.approveUser("uid-new-1");
      const afterApproval = await server.registerPendingUser("uid-new-1", "yeni@example.com");
      assert.equal(afterApproval, false, "Onaylanmış (approvedUsers'ta olan) bir kullanıcı için false dönmeli.");
      assert.ok(adminEmail, "accessRoles.ADMIN_EMAIL tanımlı olmalı (referans için).");

      await server.rejectPendingUser("uid-new-2");
      const rejectedThenRetried = await server.registerPendingUser("uid-new-2", "reddedilen@example.com", { fullName: "Reddedilen" });
      const rejectedThenRetriedAgain = await server.registerPendingUser("uid-new-2", "reddedilen@example.com", { fullName: "Reddedilen" });
      assert.equal(rejectedThenRetried, true, "Hiç bekleyen kaydı olmayan yeni bir uid için (reddedilmiş olsa dahi ilk kez kayıt oluyorsa) true dönmeli.");
      assert.equal(rejectedThenRetriedAgain, false, "Aynı bekleyen kayıt tekrar tetiklenmemeli.");

      console.log("registerPendingUser dönüş değeri (bildirim tetikleme kararı) testi tamam.");
    }

    // --- 2) buildNewUserNotificationEmailHtml ------------------------------
    {
      const server = freshServer();
      const html = server.buildNewUserNotificationEmailHtml({
        email: "test@example.com",
        fullName: '<script>alert(1)</script>',
        phone: "5551112233",
        workType: "Kadrolu",
        company: null,
      });

      assert.ok(!html.includes("<script>alert(1)</script>"), "Ham HTML enjeksiyonu KAÇIŞLANMADAN e-postaya girmemeli.");
      assert.ok(html.includes("&lt;script&gt;"), "Kaçışlanmış (escaped) hali e-postada bulunmalı.");
      assert.ok(html.includes("test@example.com"), "E-posta alanı gösterilmeli.");
      assert.ok(html.includes("5551112233"), "Telefon alanı gösterilmeli.");
      assert.ok(html.includes("Kadrolu"), "Çalışma türü alanı gösterilmeli.");
      assert.ok(html.includes("https://experify.com.tr/admin-users.html"), "Admin paneline yönlendiren link bulunmalı.");
      // company null olduğu için satırın kendisi hiç basılmamalı (etiketi bile).
      assert.ok(!html.includes(">Şirket<"), "Boş (null) bir profil alanı için satır hiç gösterilmemeli.");

      console.log("buildNewUserNotificationEmailHtml (XSS kaçışlama + alan filtreleme) testi tamam.");
    }
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exit(1);
});
