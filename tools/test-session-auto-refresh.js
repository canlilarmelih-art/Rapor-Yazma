"use strict";

/*
  Kullanici bildirimi (2026-09-17, ekran goruntusu): "normal kullanici yine
  bu uyariyi aliyor" - "Banka Sablonuyla Kaydet" tiklandiginda "Paket
  hazirlanamadi: Bu islem icin gecerli uygulama oturumu gerekir."

  Kok neden: server.js'teki HttpOnly `rapor_session` cerezi (7 gun TTL,
  bkz. SESSION_TTL_MS) yalnizca login.html'de ILK girişte POST /api/session
  ile kuruluyor. Firebase istemci oturumu (ID token) SDK tarafindan
  sessizce yenilenip GUNLERCE/HAFTALARCA canli kalabildigi halde, sunucu
  cerezi bundan HABERSIZ ve suresi dolunca getOperationalApiAccessFailure()
  (server.js) TUM korumali API'lerde "session_required" (401) donduruyor.

  Cozum: RaporCloudSync.ensureAppSession() (cloud/cloud-sync.js) gecerli
  Firebase token'i ile cerezi SESSIZCE yeniden kurar; app.js'teki
  fetchRaporApi()/isSessionRequiredResponse() ve template-engine.js'teki
  fetchProtectedTemplateApi() (ayrica cloud-sync.js'teki accountApi())
  bir "session_required" yaniti gorunce bunu cagirip istegi BIR KEZ
  yeniden dener.

  Bu test GERCEK app.js/cloud-sync.js/template-engine.js kaynagindan
  izole calistirilir; global `fetch`/`Headers`/`Response` Node'un kendi
  yerlesikleri (stub GEREKMEZ), yalnizca `fetch` bir test-double ile
  degistirilir.
*/

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appDir = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(appDir, "app.js"), "utf8");
const cloudSyncSource = fs.readFileSync(path.join(appDir, "cloud", "cloud-sync.js"), "utf8");
const engineSource = fs.readFileSync(path.join(appDir, "src", "templates", "template-engine.js"), "utf8");

function extractFnBody(source, name) {
  const marker = `function ${name}(`;
  let start = source.indexOf(marker);
  assert(start >= 0, `Bulunamadi: ${name}`);
  if (source.slice(Math.max(0, start - 6), start) === "async ") start -= 6;
  // Parametre listesi varsayilan deger olarak nesne/dizi literali icerebilir
  // (ör. `init = {}`) - govdenin ACILIS suslu parantezini ARAMADAN once
  // parantez derinligini takip ederek parametre listesinin SONUNU bulmak
  // gerekir, aksi halde ilk `{` parametre varsayilanindaki suslu parantez
  // olur.
  const parenStart = source.indexOf("(", start);
  let parenDepth = 0;
  let parenEnd = parenStart;
  for (; parenEnd < source.length; parenEnd++) {
    if (source[parenEnd] === "(") parenDepth++;
    else if (source[parenEnd] === ")") { parenDepth--; if (parenDepth === 0) break; }
  }
  const braceStart = source.indexOf("{", parenEnd);
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") { depth--; if (depth === 0) { i++; break; } }
  }
  return source.slice(start, i);
}

(async () => {
  // ===== 1) ensureAppSession() (cloud/cloud-sync.js) gercek kaynaktan =====
  function makeSessionContext({ user = { uid: "u1", getIdToken: async () => "token-1" }, fetchImpl } = {}) {
    const context = { cloud: { user }, console, fetch: fetchImpl, Headers, pendingSessionRefresh: null };
    vm.createContext(context);
    vm.runInContext(extractFnBody(cloudSyncSource, "getIdToken"), context);
    vm.runInContext(extractFnBody(cloudSyncSource, "ensureAppSession"), context);
    return context;
  }

  // 1a) Basarili yenileme: fetch 200 + {ok:true, requiresMfa:false} -> true,
  //     fresh (force-refresh) token ile POST /api/session atilir.
  {
    let callCount = 0;
    const context = makeSessionContext({
      fetchImpl: async (url, init) => {
        callCount += 1;
        assert.equal(url, "/api/session");
        assert.equal(init.method, "POST");
        assert.equal(init.headers.Authorization, "Bearer token-1");
        return new Response(JSON.stringify({ ok: true, requiresMfa: false }), { status: 200 });
      },
    });
    const result = await context.ensureAppSession();
    assert.equal(result, true, "Basarili /api/session yanitinda ensureAppSession() true donmeli.");
    assert.equal(callCount, 1, "fetch tam olarak bir kez cagrilmali.");
  }

  // 1b) Kullanicinin onayi geri alinmis (pendingApproval) -> sessizce
  //     devam EDILEMEZ, false donmeli.
  {
    const context = makeSessionContext({
      fetchImpl: async () => new Response(JSON.stringify({ ok: true, pendingApproval: true }), { status: 200 }),
    });
    assert.equal(await context.ensureAppSession(), false, "pendingApproval durumunda sessizce true donmemeli.");
  }

  // 1c) MFA_REQUIRED acikken cihaz artik guvenilir degil (requiresMfa) ->
  //     sessizce devam EDILEMEZ (kullanici etkilesimi gerekir), false.
  {
    const context = makeSessionContext({
      fetchImpl: async () => new Response(JSON.stringify({ ok: true, requiresMfa: true }), { status: 200 }),
    });
    assert.equal(await context.ensureAppSession(), false, "requiresMfa durumunda sessizce true donmemeli.");
  }

  // 1d) Ag hatasi -> false (throw etmemeli).
  {
    const context = makeSessionContext({ fetchImpl: async () => { throw new Error("network down"); } });
    assert.equal(await context.ensureAppSession(), false, "Ag hatasinda false donmeli, throw etmemeli.");
  }

  // 1e) Firebase oturumu da yoksa (getIdToken null) -> fetch HIC cagrilmadan
  //     false donmeli.
  {
    let called = false;
    const context = makeSessionContext({
      user: { uid: "u1", getIdToken: async () => null },
      fetchImpl: async () => { called = true; return new Response("{}", { status: 200 }); },
    });
    assert.equal(await context.ensureAppSession(), false, "Token yoksa false donmeli.");
    assert.equal(called, false, "Token yoksa fetch hic cagrilmamali.");
  }

  // 1f) Eszamanli cagrilar TEK bir istekte birlesir (dedupe) - export ve
  //     otomatik-kaydetme AYNI ANDA 401 alirsa iki ayri /api/session
  //     POST'u atilmamali. Dedupe, pendingSessionRefresh'in ILK cagrida
  //     SENKRON olarak (herhangi bir await'ten once) atanmasina dayanir -
  //     bu yuzden p1/p2 ayni senkron turda, ARADA baska bir await OLMADAN
  //     baslatilir (fetchImpl'in ne zaman cozuldugu onemsizdir).
  {
    let callCount = 0;
    const context = makeSessionContext({
      fetchImpl: async () => {
        callCount += 1;
        return new Response(JSON.stringify({ ok: true, requiresMfa: false }), { status: 200 });
      },
    });
    const p1 = context.ensureAppSession();
    const p2 = context.ensureAppSession();
    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(callCount, 1, "Eszamanli iki cagriya ragmen fetch yalnizca BIR KEZ atilmali (dedupe).");
    assert.equal(r1, true);
    assert.equal(r2, true);
  }

  console.log("RaporCloudSync.ensureAppSession() gercek-kaynak testleri tamam.");

  // ===== 2) isSessionRequiredResponse() (app.js) gercek kaynaktan =========
  function runIsSessionRequired(response) {
    const context = { console };
    vm.createContext(context);
    vm.runInContext(extractFnBody(appSource, "isSessionRequiredResponse"), context);
    return context.isSessionRequiredResponse(response);
  }
  assert.equal(
    await runIsSessionRequired(new Response(JSON.stringify({ ok: false, code: "session_required" }), { status: 401 })),
    true,
    "401 + code session_required -> true olmali."
  );
  assert.equal(
    await runIsSessionRequired(new Response(JSON.stringify({ ok: false, code: "mfa_required" }), { status: 401 })),
    false,
    "401 + baska bir kod (ör. mfa_required) -> false olmali (yanlislikla yeniden denenmemeli)."
  );
  assert.equal(
    await runIsSessionRequired(new Response(JSON.stringify({ ok: true }), { status: 200 })),
    false,
    "200 yanitinda false olmali."
  );
  assert.equal(
    await runIsSessionRequired(new Response("not json", { status: 401 })),
    false,
    "Gecersiz JSON govdesinde throw etmemeli, false donmeli."
  );
  console.log("isSessionRequiredResponse() gercek-kaynak testleri tamam.");

  // ===== 3) fetchRaporApi() (app.js) uctan uca yeniden-deneme testi ========
  function makeFetchRaporApiContext({ tokens, ensureAppSessionResult = true, fetchImpl }) {
    let tokenCallIndex = 0;
    const context = {
      console,
      Headers,
      fetch: fetchImpl,
      window: {
        RaporCloudSync: {
          getIdToken: async () => tokens[Math.min(tokenCallIndex++, tokens.length - 1)],
          ensureAppSession: async () => ensureAppSessionResult,
        },
      },
    };
    vm.createContext(context);
    vm.runInContext(extractFnBody(appSource, "isSessionRequiredResponse"), context);
    vm.runInContext(extractFnBody(appSource, "fetchRaporApi"), context);
    return context;
  }

  // 3a) Ilk istek basarili (200) -> yeniden deneme YOK, tek fetch cagrisi.
  {
    let fetchCalls = [];
    const context = makeFetchRaporApiContext({
      tokens: ["token-1"],
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, auth: init.headers.get("Authorization") });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });
    const response = await context.fetchRaporApi("/api/state");
    assert.equal(response.status, 200);
    assert.equal(fetchCalls.length, 1, "Basarili ilk istekte yeniden deneme olmamali.");
    assert.equal(fetchCalls[0].auth, "Bearer token-1");
  }

  // 3b) Ilk istek session_required (401) -> ensureAppSession() cagrilir,
  //     TAZE token ile istek BIR KEZ yeniden denenir, nihai yanit ikinci
  //     (basarili) cevap olmali.
  {
    const fetchCalls = [];
    const context = makeFetchRaporApiContext({
      tokens: ["stale-token", "fresh-token"],
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, auth: init.headers.get("Authorization") });
        if (fetchCalls.length === 1) {
          return new Response(JSON.stringify({ ok: false, code: "session_required", error: "Bu işlem için geçerli uygulama oturumu gerekir." }), { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true, data: "yenilendi" }), { status: 200 });
      },
    });
    const response = await context.fetchRaporApi("/api/state", { method: "POST" });
    assert.equal(fetchCalls.length, 2, "session_required sonrasi istek TAM OLARAK bir kez yeniden denenmeli.");
    assert.equal(fetchCalls[0].auth, "Bearer stale-token", "Ilk deneme eski token ile atilmali.");
    assert.equal(fetchCalls[1].auth, "Bearer fresh-token", "Yeniden deneme TAZE (yenilenmis) token ile atilmali.");
    assert.equal(response.status, 200, "Kullaniciya nihai olarak BASARILI yanit donmeli (uyari GORMEMELI).");
    const body = await response.json();
    assert.equal(body.data, "yenilendi");
  }

  // 3c) ensureAppSession() basarisiz olursa (ör. hesap onaydan cikarilmis)
  //     -> ORIJINAL 401 yaniti degismeden donmeli (sessizce basarili
  //     gibi davranilmamali).
  {
    const fetchCalls = [];
    const context = makeFetchRaporApiContext({
      tokens: ["stale-token"],
      ensureAppSessionResult: false,
      fetchImpl: async (url, init) => {
        fetchCalls.push(init.headers.get("Authorization"));
        return new Response(JSON.stringify({ ok: false, code: "session_required" }), { status: 401 });
      },
    });
    const response = await context.fetchRaporApi("/api/state");
    assert.equal(fetchCalls.length, 1, "ensureAppSession basarisizsa yeniden deneme YAPILMAMALI.");
    assert.equal(response.status, 401);
  }

  // 3d) Baska bir 401 kodu (ör. mfa_required) -> yeniden deneme YAPILMAMALI
  //     (yalnizca session_required tetiklemeli).
  {
    const fetchCalls = [];
    const context = makeFetchRaporApiContext({
      tokens: ["token-1"],
      fetchImpl: async (url, init) => {
        fetchCalls.push(init.headers.get("Authorization"));
        return new Response(JSON.stringify({ ok: false, code: "mfa_required" }), { status: 401 });
      },
    });
    const response = await context.fetchRaporApi("/api/state");
    assert.equal(fetchCalls.length, 1, "mfa_required gibi baska bir 401 kodunda yeniden deneme YAPILMAMALI.");
    assert.equal(response.status, 401);
  }

  console.log("fetchRaporApi() session_required otomatik yeniden-deneme testleri tamam.");

  // ===== 4) fetchProtectedTemplateApi() (template-engine.js) ayni desen ===
  function makeTemplateApiContext({ tokens, ensureAppSessionResult = true, fetchImpl }) {
    let tokenCallIndex = 0;
    const context = {
      console,
      Headers,
      fetch: fetchImpl,
      window: {
        RaporCloudSync: {
          getIdToken: async () => tokens[Math.min(tokenCallIndex++, tokens.length - 1)],
          ensureAppSession: async () => ensureAppSessionResult,
        },
      },
    };
    vm.createContext(context);
    vm.runInContext(extractFnBody(engineSource, "fetchProtectedTemplateApi"), context);
    return context;
  }

  {
    const fetchCalls = [];
    const context = makeTemplateApiContext({
      tokens: ["stale-token", "fresh-token"],
      fetchImpl: async (url, init) => {
        fetchCalls.push({ url, auth: init.headers.get("Authorization") });
        if (fetchCalls.length === 1) {
          return new Response(JSON.stringify({ ok: false, code: "session_required" }), { status: 401 });
        }
        return new Response(JSON.stringify({ ok: true, tokens: ["CITY"] }), { status: 200 });
      },
    });
    const response = await context.fetchProtectedTemplateApi("/api/report-template-tokens?key=akbank");
    assert.equal(fetchCalls.length, 2, "Banka sablonu export'unda session_required sonrasi bir kez yeniden denenmeli.");
    assert.equal(fetchCalls[1].auth, "Bearer fresh-token");
    assert.equal(response.status, 200, "'Paket hazirlanamadi' uyarisi yerine nihai basarili yanit donmeli.");
  }

  console.log("fetchProtectedTemplateApi() session_required otomatik yeniden-deneme testi tamam.");

  console.log("Oturum cerezi sessiz yenileme (ensureAppSession) testleri basarili.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
