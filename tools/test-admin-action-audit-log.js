"use strict";

/*
  Kullanici talebi: "admin panelini elestirel goz ile degerlendir ... 1.
  fazdan baslayalim" — elestiride bulunan somut bosluk: "approve-user,
  reject-user, grant-privilege, revoke-privilege cagrilari hic
  logActivityEvent'e gitmiyor" VE "account-suspended/account-deleted-by-
  admin olaylari HANGI adminin yaptigini kaydetmiyor".

  Bu test server.js'in gercek export edilen HTTP handler fonksiyonlarini
  (sahte request/response ile) calistirir:
  1) handleApproveUserApi / handleRejectUserApi / handleGrantPrivilegeApi /
     handleRevokePrivilegeApi / handleManagedUserStatusApi /
     handleDeleteManagedUserApi — hepsi artik "user-approved"/"user-
     rejected"/"privilege-granted"/"privilege-revoked"/"account-suspended"/
     "account-deleted-by-admin" olaylarini actorUid/actorEmail (islemi
     YAPAN admin) ile birlikte logActivityEvent'e yaziyor.
  2) listAdminActionEvents() / handleAdminActionEventsApi — bu 6 olay
     turunu en-yeni-once dondurur, login/logout/report-* gibi ILGISIZ olay
     turlerini SIZDIRMAZ; admin olmayana 403.
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

function fakeRequest(body) {
  return {
    method: "POST",
    headers: { "user-agent": "TestAgent/1" },
    setEncoding() {},
    on(event, handler) {
      if (event === "data") handler(JSON.stringify(body || {}));
      if (event === "end") handler();
      return this;
    },
  };
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
    const admin = { uid: "admin-uid", email: "canlilar.melih@gmail.com" };

    // Hazirlik: bir bekleyen kullanici olustur (approve/reject icin).
    await server.registerPendingUser("uid-a", "a@example.com", {});
    await server.registerPendingUser("uid-b", "b@example.com", {});

    // --- 1) approve-user -> "user-approved" (actor ile) ------------------
    {
      const res = fakeResponse();
      await server.handleApproveUserApi(fakeRequest({ uid: "uid-a" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- 2) reject-user -> "user-rejected" (actor ile) --------------------
    {
      const res = fakeResponse();
      await server.handleRejectUserApi(fakeRequest({ uid: "uid-b" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- 3) grant-privilege -> "privilege-granted" (actor ile) -----------
    {
      const res = fakeResponse();
      await server.handleGrantPrivilegeApi(fakeRequest({ uid: "uid-a" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- 4) revoke-privilege -> "privilege-revoked" (actor ile) ----------
    {
      const res = fakeResponse();
      await server.handleRevokePrivilegeApi(fakeRequest({ uid: "uid-a" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- 5) admin-user-status (suspend) -> "account-suspended" (actor ile)
    {
      const res = fakeResponse();
      await server.handleManagedUserStatusApi(fakeRequest({ uid: "uid-a", status: "suspended" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- 6) admin-user-delete -> "account-deleted-by-admin" (actor ile) --
    {
      const res = fakeResponse();
      await server.handleDeleteManagedUserApi(fakeRequest({ uid: "uid-a" }), res, admin);
      assert.equal(res.statusCode, 200);
    }

    // --- İLGİSİZ olay türleri (sızmamalı) -------------------------------
    await server.logActivityEvent("login", "uid-a", "a@example.com", {});
    await server.logActivityEvent("report-created", "uid-a", "a@example.com", { reportId: "RE-1" });

    const events = await server.listAdminActionEvents(500);
    assert.equal(events.length, 6, `TAM OLARAK 6 admin-islem olayi olmali (login/report-created SIZMAMALI): ${JSON.stringify(events.map((e) => e.type))}`);
    assert.ok(events.every((e) => server.ADMIN_ACTION_EVENT_TYPES.includes(e.type)), "listAdminActionEvents ilgisiz bir tur dondurdu.");
    // En-yeni-once: son eklenen (account-deleted-by-admin) ilk sirada.
    assert.equal(events[0].type, "account-deleted-by-admin", "En yeni olay listenin BASINDA olmali.");
    events.forEach((event) => {
      assert.equal(event.actorUid, admin.uid, `${event.type} icin actorUid eksik/yanlis.`);
      assert.equal(event.actorEmail, admin.email, `${event.type} icin actorEmail eksik/yanlis.`);
    });
    const types = events.map((e) => e.type).sort();
    assert.deepEqual(types, [
      "account-deleted-by-admin",
      "account-suspended",
      "privilege-granted",
      "privilege-revoked",
      "user-approved",
      "user-rejected",
    ]);

    console.log("Admin islem denetim gunlugu (6 handler, actorUid/actorEmail dahil) testi tamam.");

    // --- handleAdminActionEventsApi — admin olmayana 403 ------------------
    {
      const nonAdmin = { uid: "uid-b", email: "b@example.com" };
      const res = fakeResponse();
      await server.handleAdminActionEventsApi({ method: "GET" }, res, nonAdmin);
      assert.equal(res.statusCode, 403, "Admin olmayan kullaniciya 403 donmeli.");
      console.log("handleAdminActionEventsApi (admin korumasi) testi tamam.");
    }
  } finally {
    restoreTestFiles(originalFiles);
  }
})().catch((error) => {
  restoreTestFiles(originalFiles);
  console.error(error);
  process.exitCode = 1;
});
