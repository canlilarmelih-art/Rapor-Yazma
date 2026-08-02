"use strict";

/*
  Kullanici talebi: "kullanıcı oluştur ekleyelim admin onayı olmadan
  kullanıcı olusturlmasın" — sonra netlestirildi: "admin only olmayacak
  herkes oluşturabilecek ancak ben admin onay vermeden sisteme giriş
  yapamayacak". Yani: login.html'de HERKES kendi Firebase hesabini
  olusturabilir (createUserWithEmailAndPassword, genel API anahtariyla
  calisir) ama hesap olusturmak GIRIS YAPMAK anlamina gelmez — sunucu
  tarafinda isUserApproved() false oldugu surece /api/session (ve MFA
  adimlari) oturum cerezi VERMEZ. Yonetici (ADMIN_EMAIL) her zaman otomatik
  onaylidir. Kullanicinin acikca sordugu risk ("mevcut kullanicilar aniden
  kilitlenir mi?") uzerine: approved-users.json HIC YOKSA, o ana kadar
  sessions.json/trusted-devices.json'da gorulen her uid otomatik onayli
  sayilir (grandfather/miras klozu) — bu testin 4. bolumu tam olarak bunu
  dogrular.

  Bu test dort katmani izole dogrular:
  1) isUserApproved / registerPendingUser / approveUser / rejectPendingUser /
     listPendingUsers — tam yasam dongusu (yonetici her zaman onayli;
     normal kullanici once onaysiz, kayittan sonra "bekliyor" listesinde,
     onaylaninca onayli VE listeden dusuyor; reddedilen BASKA bir kullanici
     onaysiz kaliyor).
  2) registerPendingUser zaten onayli bir uid icin NO-OP (bekleyen listesine
     tekrar eklenmiyor).
  3) requireAdmin — yonetici icin true donup hicbir yanit gondermiyor;
     yonetici olmayan icin 403 JSON gonderip false donuyor.
  4) Grandfather/miras klozu — approved-users.json ilk kez olusturulurken,
     o ana kadar sessions.json/trusted-devices.json'da gorulen uid'ler
     otomatik onayli sayiliyor (mevcut, aktif kullanicilari kilitlememe
     garantisi).

  Test, gercek server-data/ dosyalarina yazip test SONUNDA temizler (fresh
  klonlarda bu dosyalar zaten yok, testin kendisi de onlari kalici
  birakmamali).
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const serverPath = path.join(root, "server.js");
const dataDir = path.join(root, "server-data");
const testFiles = ["sessions.json", "trusted-devices.json", "pending-users.json", "approved-users.json", "privileged-users.json"];

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

// Bu testin çalışması sırasında yerel geliştirme ortamındaki GERÇEK
// server-data dosyaları (varsa) etkilenmesin diye önce yedeklenir, test
// bitince (başarılı/başarısız fark etmez) geri yüklenir.
const originalFiles = backupAndClearTestFiles();

(async () => {
  try {
    // --- 1) + 2) tam yaşam döngüsü ----------------------------------------
    {
      const server = freshServer();
      const adminEmail = server.accessRoles.ADMIN_EMAIL;

      assert.equal(await server.isUserApproved("uid-admin", adminEmail), true, "Yönetici her zaman onaylı olmalı.");

      const normalUid = "uid-normal-approval-1";
      const normalEmail = "yeni.kullanici@example.com";
      assert.equal(await server.isUserApproved(normalUid, normalEmail), false, "Kayıt olmamış normal kullanıcı onaysız olmalı.");

      await server.registerPendingUser(normalUid, normalEmail);
      assert.equal(await server.isUserApproved(normalUid, normalEmail), false, "Kayıt olduktan hemen sonra HÂLÂ onaysız olmalı (onay girişten önce şart).");
      let pending = await server.listPendingUsers();
      assert.ok(pending.some((entry) => entry.uid === normalUid && entry.email === normalEmail), `Kayıt olan kullanıcı bekleyen listesinde olmalı: ${JSON.stringify(pending)}`);

      // 2) Zaten onaylı bir uid için registerPendingUser NO-OP olmalı.
      await server.approveUser(normalUid);
      assert.equal(await server.isUserApproved(normalUid, normalEmail), true, "Onaylandıktan sonra giriş yapabilmeli.");
      pending = await server.listPendingUsers();
      assert.ok(!pending.some((entry) => entry.uid === normalUid), "Onaylanan kullanıcı bekleyen listesinden çıkmalı.");
      await server.registerPendingUser(normalUid, normalEmail);
      pending = await server.listPendingUsers();
      assert.ok(!pending.some((entry) => entry.uid === normalUid), "Zaten onaylı bir kullanıcı tekrar 'kayıt olsa' bile bekleyen listesine EKLENMEMELİ.");

      // Reddedilen BAŞKA bir kullanıcı onaysız kalmalı.
      const rejectedUid = "uid-rejected-1";
      await server.registerPendingUser(rejectedUid, "reddedilecek@example.com");
      await server.rejectPendingUser(rejectedUid);
      assert.equal(await server.isUserApproved(rejectedUid, "reddedilecek@example.com"), false, "Reddedilen kullanıcı onaysız kalmalı.");
      pending = await server.listPendingUsers();
      assert.ok(!pending.some((entry) => entry.uid === rejectedUid), "Reddedilen kullanıcı bekleyen listesinden çıkmalı.");
    }

    // --- 3) requireAdmin — 403 gönderip false dönmeli (yönetici değilse) --
    {
      const server = freshServer();
      let jsonCalls = [];
      const fakeResponse = {
        setHeader: () => {},
        writeHead: (status, headers) => jsonCalls.push({ type: "writeHead", status, headers }),
        end: (body) => jsonCalls.push({ type: "end", body }),
      };

      const adminResult = server.requireAdmin(fakeResponse, { email: server.accessRoles.ADMIN_EMAIL });
      assert.equal(adminResult, true, "Yönetici için requireAdmin true dönmeli.");
      assert.equal(jsonCalls.length, 0, "Yönetici için hiçbir yanıt gönderilmemeli (akış devam etmeli).");

      const normalResult = server.requireAdmin(fakeResponse, { email: "normal@example.com" });
      assert.equal(normalResult, false, "Yönetici olmayan için requireAdmin false dönmeli.");
      assert.equal(jsonCalls.find((c) => c.type === "writeHead")?.status, 403, "Yönetici olmayan için 403 gönderilmeli.");
    }

    // --- 4) Grandfather/miras klozu ---------------------------------------
    {
      backupAndClearTestFiles(); // her senaryo temiz dosya durumundan başlasın
      const server = freshServer();

      const existingUid = "uid-already-using-app";
      server.createSession(existingUid, "eski.kullanici@example.com");
      server.markDeviceTrusted(existingUid, "eski.kullanici@example.com");

      const brandNewUid = "uid-brand-new-signup";
      // approved-users.json İLK KEZ bu çağrıda oluşturulacak (henüz yok) —
      // bu an itibarıyla sessions/trusted-devices'ta GÖRÜLEN uid'ler miras
      // alınır, GÖRÜLMEYENLER (brandNewUid gibi) miras alınmaz.
      const existingApproved = await server.isUserApproved(existingUid, "eski.kullanici@example.com");
      const newApproved = await server.isUserApproved(brandNewUid, "yeni.kayit@example.com");

      assert.equal(existingApproved, true, "Özellik devreye girmeden ÖNCE zaten oturum açmış/cihazı güvenilir bir kullanıcı OTOMATİK onaylı sayılmalı (kilitlenmemeli).");
      assert.equal(newApproved, false, "Daha önce hiç görülmemiş YENİ bir kayıt otomatik onaylı sayılmamalı.");
    }

    // --- 5) Ayrıcalık (privileged) katmanı ve onaylı kullanıcı listesi -----
    {
      backupAndClearTestFiles();
      const server = freshServer();
      const adminEmail = server.accessRoles.ADMIN_EMAIL;

      assert.equal(await server.isUserPrivileged("uid-admin", adminEmail), true, "Yönetici her zaman ayrıcalıklı sayılmalı.");

      const uid = "uid-privilege-test-1";
      const email = "ayricalik.testi@example.com";
      await server.registerPendingUser(uid, email);
      assert.equal(await server.isUserPrivileged(uid, email), false, "Onaylanmamış kullanıcı ayrıcalıklı olamaz.");
      await server.approveUser(uid);
      assert.equal(await server.isUserPrivileged(uid, email), false, "Onaylı ama ayrıcalık verilmemiş kullanıcı hâlâ ayrıcalıksız olmalı.");

      await server.grantPrivilege(uid);
      assert.equal(await server.isUserPrivileged(uid, email), true, "Ayrıcalık verildikten sonra true dönmeli.");

      let approved = await server.listApprovedUsers();
      const entry = approved.find((row) => row.uid === uid);
      assert.ok(entry, "Onaylı kullanıcılar listesinde bu uid bulunmalı.");
      assert.equal(entry.email, email, "Onay sırasında kaydedilen e-posta listede görünmeli.");
      assert.equal(entry.privileged, true, "Liste, ayrıcalık durumunu da içermeli.");

      await server.revokePrivilege(uid);
      assert.equal(await server.isUserPrivileged(uid, email), false, "Ayrıcalık geri alındıktan sonra false dönmeli.");
      approved = await server.listApprovedUsers();
      assert.equal(approved.find((row) => row.uid === uid)?.privileged, false, "Liste de geri alınan ayrıcalığı yansıtmalı.");
    }

    console.log("Kullanıcı onay akışı (kayıt + admin onayı) testi tamam.");
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exit(1);
});
