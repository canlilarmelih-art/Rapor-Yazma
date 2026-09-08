"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "server-data");
const stateFiles = ["sessions.json", "trusted-devices.json", "pending-users.json", "approved-users.json", "privileged-users.json"];

function backupAndClear() {
  const backups = new Map();
  fs.mkdirSync(dataDir, { recursive: true });
  stateFiles.forEach((name) => {
    const file = path.join(dataDir, name);
    backups.set(name, fs.existsSync(file) ? fs.readFileSync(file) : null);
    fs.rmSync(file, { force: true });
  });
  return backups;
}

function restore(backups) {
  stateFiles.forEach((name) => {
    const file = path.join(dataDir, name);
    fs.rmSync(file, { force: true });
    const data = backups.get(name);
    if (data) fs.writeFileSync(file, data);
  });
}

function freshServer() {
  const serverPath = path.join(root, "server.js");
  delete require.cache[require.resolve(serverPath)];
  return require(serverPath);
}

async function main() {
  const backups = backupAndClear();
  try {
    const server = freshServer();
    const uid = "uid-operational-api-test";
    const email = "operational-api@example.com";
    const request = { headers: { host: "localhost" } };
    const user = { uid, email };

    let failure = await server.getOperationalApiAccessFailure(request, user, { mfaRequired: true });
    assert.equal(failure?.code, "approval_required", "Onaysiz kullanici veri API'sine ulasamamali.");

    await server.registerPendingUser(uid, email);
    await server.approveUser(uid);
    failure = await server.getOperationalApiAccessFailure(request, user, { mfaRequired: true });
    assert.equal(failure?.code, "session_required", "Onay tek basina veri API'si icin yeterli olmamali.");

    const session = server.createSession(uid, email);
    request.headers.cookie = `rapor_session=${session.id}`;
    failure = await server.getOperationalApiAccessFailure(request, user, { mfaRequired: true });
    assert.equal(failure?.code, "mfa_required", "MFA zorunluyken guvenilir cihaz olmadan veri API'si reddedilmeli.");

    const trusted = server.markDeviceTrusted(uid, email);
    request.headers.cookie += `; rapor_2fa_trust=${trusted.id}`;
    assert.equal(await server.getOperationalApiAccessFailure(request, user, { mfaRequired: true }), null, "Onayli + oturumlu + MFA tamamlanmis kullanici erisebilmeli.");

    await server.setManagedUserStatus(uid, "suspended");
    failure = await server.getOperationalApiAccessFailure(request, user, { mfaRequired: true });
    assert.equal(failure?.code, "approval_required", "Askidaki kullanici mevcut cerezlerle de veri API'sine ulasamamali.");
  } finally {
    restore(backups);
  }
  console.log("Operasyonel API erisim kapisi testi tamam.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
