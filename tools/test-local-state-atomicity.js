"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const server = require(path.join(__dirname, "..", "server.js"));

async function conditionalWrite(stateFile, expectedRevision, state) {
  const serialized = JSON.stringify(state, null, 2);
  return server.enqueueStateWrite(stateFile, async () => {
    const current = await server.readLocalStateRecord(stateFile);
    const currentRevision = current?.revision || "0";
    if (currentRevision !== expectedRevision) return { conflict: true, revision: current?.revision || null };
    await server.writeLocalStateAtomically(stateFile, serialized);
    return { conflict: false, revision: server.calculateStateRevision(serialized) };
  });
}

async function main() {
  assert.ok(server.validateLocalStatePayload({ fields: {}, tables: {}, uploads: {} }));
  assert.equal(server.validateLocalStatePayload([]), false);
  assert.equal(server.validateLocalStatePayload({ fields: [] }), false);
  assert.equal(server.getExpectedStateRevision({ headers: { "if-match": "0" } }), "0");
  assert.equal(server.getExpectedStateRevision({ headers: {} }), null);

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "experify-local-state-"));
  const stateFile = path.join(directory, "active-case.json");
  try {
    assert.equal(await server.readLocalStateRecord(stateFile), null, "Yeni kaydin revizyonu 0 kabul edilmeli.");

    const initial = await conditionalWrite(stateFile, "0", { fields: { city: "ANKARA" }, updatedAt: "first" });
    assert.equal(initial.conflict, false);
    const stored = await server.readLocalStateRecord(stateFile);
    assert.equal(stored.state.fields.city, "ANKARA");
    assert.equal(stored.revision, initial.revision);

    const [first, second] = await Promise.all([
      conditionalWrite(stateFile, stored.revision, { fields: { city: "IZMIR" }, updatedAt: "second" }),
      conditionalWrite(stateFile, stored.revision, { fields: { city: "BURSA" }, updatedAt: "third" }),
    ]);
    assert.equal([first, second].filter((result) => !result.conflict).length, 1, "Ayni revizyondan yalniz bir yazma kabul edilmeli.");
    assert.equal([first, second].filter((result) => result.conflict).length, 1, "Diger yazma acik bir cakisma almali.");

    const files = await fs.readdir(directory);
    assert.equal(files.some((name) => name.endsWith(".tmp")), false, "Atomik yazimdan sonra gecici dosya kalmamali.");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
  console.log("Yerel durum atomik kayit ve revizyon testi tamam.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
