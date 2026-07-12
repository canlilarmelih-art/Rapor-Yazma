// =====================================================================
// Bulut Senkron Modülü — Faz 1 (2026-07-09) + Faz 2 çoklu rapor (2026-07-09)
// =====================================================================
// app.js'e DOKUNMADAN çalışır: klasik script olduğu için app.js'in üst
// düzey global'lerine (state, saveState, render, activeSectionId) doğrudan
// erişir. index.html'de app.js'ten SONRA, cloud/report-library.js'ten
// ÖNCE yüklenmelidir (kütüphane bu modülün window.RaporCloudSync API'sini
// kullanır).
//
// Tasarım sözleşmesi: cloud/FAZ0-TASARIM.md
//  - Beyaz liste: fields, tables, lookupOptions, updatedAt (sourceValues,
//    uploads, settings, system ASLA buluta gitmez — KVKK D1).
//  - Yol: users/{uid}/reports/{reportId} (yalnız sahibi erişir — D2).
//  - expireAt = updatedAt + 30 gün; Firestore TTL siler (D3).
//  - Yapılandırma yoksa (apiKey === "YAPISTIR") modül tamamen pasiftir (D6).
//
// Faz 2 değişikliği: artık TEK rapor değil, o an AKTİF olan rapor senkronlanır
// (report-library.js her rapor değişiminde setActiveReportId çağırır).
// Sign-in sırasında "en son değişen raporu otomatik benimse" davranışı
// kaldırıldı — o artık report-library'nin sorumluluğu.
// =====================================================================

(() => {
  "use strict";

  const CLOUD_WHITELIST = ["fields", "tables", "lookupOptions", "updatedAt"];
  const CLOUD_SCHEMA = "rapor-yazma-cloud";
  const CLOUD_SCHEMA_VERSION = 1;
  const RETENTION_DAYS = 30;
  const PUSH_MIN_INTERVAL_MS = 45 * 1000; // kota bütçesi: FAZ0 Bölüm 5
  const DIRTY_CHECK_INTERVAL_MS = 10 * 1000;
  const QUOTA_STORAGE_KEY = "rapor-cloud-push-quota-v1";
  const FIRESTORE_DAILY_WRITE_LIMIT = 20000; // Spark planı ücretsiz kota (bilgilendirme amaçlı)

  const cloud = {
    app: null,
    auth: null,
    db: null,
    user: null,
    activeReportId: null,
    knownRev: 0,
    lastPushedUpdatedAt: null,
    lastPushTime: 0,
    lastSyncText: "",
    statusKind: "off", // off | ready | syncing | synced | warn | error
    pushing: false,
    checkingRemote: false,
  };

  function isConfigured() {
    return typeof RAPOR_FIREBASE_CONFIG === "object"
      && RAPOR_FIREBASE_CONFIG
      && RAPOR_FIREBASE_CONFIG.apiKey
      && RAPOR_FIREBASE_CONFIG.apiKey !== "YAPISTIR";
  }

  function hasAppGlobals() {
    try {
      return typeof state === "object" && typeof saveState === "function" && typeof render === "function";
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Senkron paketi (beyaz liste) — FAZ0 Bölüm 2 sözleşmesi
  // ---------------------------------------------------------------
  function buildCloudReportPayload() {
    const payload = {};
    CLOUD_WHITELIST.forEach((key) => {
      if (state[key] !== undefined) payload[key] = state[key];
    });
    return JSON.parse(JSON.stringify(payload));
  }

  function buildSummary() {
    const f = state.fields || {};
    return {
      caseName: String(f.caseName || ""),
      bank: String(f.bank || ""),
      city: String(f.city || f.titleCity || ""),
      district: String(f.district || f.titleDistrict || ""),
      adaParsel: String(f.titleAdaParsel || f.adaParsel || ""),
      propertyType: String(f.propertyKind || f.legalUsageNature || ""),
    };
  }

  // ---------------------------------------------------------------
  // Kota telemetrisi (FAZ0 Bölüm 5) — görünürlük için basit günlük sayaç.
  // Firestore'un kendi sunucu tarafı kotasını YANSITMAZ; yalnızca bu
  // cihazdan yapılan gönderim sayısını gösterir (bilgilendirme amaçlı).
  // ---------------------------------------------------------------
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function bumpDailyPushCounter() {
    let record;
    try {
      record = JSON.parse(localStorage.getItem(QUOTA_STORAGE_KEY) || "{}");
    } catch {
      record = {};
    }
    const today = todayKey();
    if (record.date !== today) record = { date: today, count: 0 };
    record.count = (record.count || 0) + 1;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(record));
    return record.count;
  }

  function getDailyPushCount() {
    try {
      const record = JSON.parse(localStorage.getItem(QUOTA_STORAGE_KEY) || "{}");
      return record.date === todayKey() ? Number(record.count || 0) : 0;
    } catch {
      return 0;
    }
  }

  function reportDocRef(reportId = cloud.activeReportId) {
    return cloud.db
      .collection("users").doc(cloud.user.uid)
      .collection("reports").doc(reportId);
  }

  function buildEnvelope(existingCreatedAt) {
    const Timestamp = firebase.firestore.Timestamp;
    const now = firebase.firestore.FieldValue.serverTimestamp();
    return {
      schema: CLOUD_SCHEMA,
      schemaVersion: CLOUD_SCHEMA_VERSION,
      status: "draft",
      rev: cloud.knownRev + 1,
      lastDevice: window.matchMedia("(max-width: 820px)").matches ? "mobile" : "desktop",
      lastActiveSection: typeof activeSectionId === "string" ? activeSectionId : "",
      createdAt: existingCreatedAt || now,
      updatedAt: now,
      expireAt: Timestamp.fromMillis(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000),
      summary: buildSummary(),
      payload: buildCloudReportPayload(),
    };
  }

  // ---------------------------------------------------------------
  // Gönderme / çekme (her zaman o an AKTİF rapor üzerinde çalışır)
  // ---------------------------------------------------------------
  async function pushReport({ force = false } = {}) {
    if (!cloud.user || !cloud.activeReportId || cloud.pushing) return false;
    cloud.pushing = true;
    setStatus("syncing", "Buluta gönderiliyor...");
    try {
      const ref = reportDocRef();
      const snapshot = await ref.get();
      const remote = snapshot.exists ? snapshot.data() : null;

      if (remote && Number(remote.rev || 0) > cloud.knownRev && !force) {
        setStatus("warn", "Bulutta daha yeni sürüm var (başka cihaz).");
        showConflictChoice(remote);
        return false;
      }

      const envelope = buildEnvelope(remote?.createdAt || null);
      await ref.set(envelope);
      cloud.knownRev = envelope.rev;
      cloud.lastPushedUpdatedAt = state.updatedAt || null;
      cloud.lastPushTime = Date.now();
      bumpDailyPushCounter();
      setStatus("synced", `Bulutta güncel · ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`);
      return true;
    } catch (error) {
      setStatus("error", "Gönderilemedi; bağlantı gelince yeniden denenecek.");
      console.warn("Bulut gönderme hatası:", error?.code || error?.message || error);
      return false;
    } finally {
      cloud.pushing = false;
    }
  }

  function applyPayloadToState(payload, lastActiveSection = "") {
    CLOUD_WHITELIST.forEach((key) => {
      if (key === "updatedAt") return;
      if (payload[key] !== undefined) state[key] = JSON.parse(JSON.stringify(payload[key]));
    });
    saveState();
    // saveState updatedAt'i şimdiye çeker; yankı-gönderimi engelle.
    cloud.lastPushedUpdatedAt = state.updatedAt || null;
    // Faz 3: diğer cihazda kalınan bölümden devam et (bkz. buildEnvelope'daki
    // lastActiveSection). Geçersiz/eksikse normal render ile 1. bölümde kalınır.
    if (lastActiveSection && typeof sections !== "undefined" && sections.some((section) => section.id === lastActiveSection)) {
      setActiveSection(lastActiveSection);
    } else {
      render();
    }
  }

  async function pullReport(remoteData = null) {
    if (!cloud.user || !cloud.activeReportId) return false;
    setStatus("syncing", "Buluttan yükleniyor...");
    try {
      let data = remoteData;
      if (!data) {
        const snapshot = await reportDocRef().get();
        if (!snapshot.exists) {
          setStatus("ready", "Bulutta kayıt yok; ilk gönderim bekleniyor.");
          return false;
        }
        data = snapshot.data();
      }
      if (data.schema !== CLOUD_SCHEMA || !data.payload) {
        setStatus("error", "Bulut kaydı tanınmadı (şema uyumsuz).");
        return false;
      }
      applyPayloadToState(data.payload, data.lastActiveSection);
      cloud.knownRev = Number(data.rev || 0);
      setStatus("synced", "Buluttaki sürüm yüklendi.");
      return true;
    } catch (error) {
      setStatus("error", "Buluttan yüklenemedi.");
      console.warn("Bulut çekme hatası:", error?.code || error?.message || error);
      return false;
    }
  }

  // report-library.js, aktif rapor değişince (aç/oluştur/kopyala) bunu çağırır.
  // localKnownUpdatedAt: değişimden ÖNCEKİ, o raporun bilinen son güncelleme
  // zamanı (blob'tan okunur). state.updatedAt kullanılMAZ çünkü
  // restoreStateFromImportedJson içindeki saveState() onu "şimdi"ye çeker —
  // bu da "bulut daha yeni mi" karşılaştırmasını her zaman yanlış "hayır"
  // yapardı.
  async function setActiveReportId(reportId, { localKnownUpdatedAt = null } = {}) {
    cloud.activeReportId = reportId || null;
    cloud.knownRev = 0;
    cloud.lastPushedUpdatedAt = null;
    if (!cloud.activeReportId) return;
    if (!isConfigured() || !cloud.user) {
      setStatus(isConfigured() ? "ready" : "off", isConfigured() ? "Giriş yapılmadı; yalnızca bu cihazda saklanıyor." : "Bulut senkronu kurulmadı.");
      return;
    }
    await checkForNewerOnOpen(localKnownUpdatedAt);
  }

  async function checkForNewerOnOpen(localKnownUpdatedAt = null) {
    if (!cloud.user || !cloud.activeReportId || cloud.checkingRemote) return;
    cloud.checkingRemote = true;
    setStatus("syncing", "Bulut kontrol ediliyor...");
    try {
      const snapshot = await reportDocRef().get();
      if (!snapshot.exists) {
        cloud.knownRev = 0;
        setStatus("ready", "Bulutta kayıt yok; ilk gönderim bekleniyor.");
        return;
      }
      const data = snapshot.data();
      cloud.knownRev = Number(data.rev || 0);
      const cloudUpdated = String(data.payload?.updatedAt || "");
      const localUpdated = String(localKnownUpdatedAt || state.updatedAt || "");
      if (cloudUpdated && (!localUpdated || cloudUpdated > localUpdated)) {
        showPullOffer(data, cloudUpdated);
      } else {
        cloud.lastPushedUpdatedAt = state.updatedAt || null;
        setStatus("synced", "Bulut ile eşleşti.");
      }
    } catch (error) {
      setStatus("error", "Bulut kontrol edilemedi.");
      console.warn("Bulut kontrol hatası:", error?.code || error?.message || error);
    } finally {
      cloud.checkingRemote = false;
    }
  }

  // Dashboard'un tüm bulut raporlarını yerel kütüphaneyle eşleştirmesi için.
  async function listCloudReports() {
    if (!cloud.user) return [];
    try {
      const snapshot = await cloud.db
        .collection("users").doc(cloud.user.uid)
        .collection("reports")
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    } catch (error) {
      console.warn("Bulut listeleme hatası:", error?.code || error?.message || error);
      return [];
    }
  }

  async function deleteCloudReport(reportId) {
    if (!cloud.user || !reportId) return false;
    try {
      await cloud.db
        .collection("users").doc(cloud.user.uid)
        .collection("reports").doc(reportId)
        .delete();
      return true;
    } catch (error) {
      console.warn("Bulut silme hatası:", error?.code || error?.message || error);
      return false;
    }
  }

  // "30 gün daha sakla": raporu AÇMADAN/değiştirmeden yalnızca expireAt'i
  // yeniler. rev, FieldValue.increment YERİNE düz sayı olarak yazılır çünkü
  // Firestore Rules'daki "rev is int" kontrolü artış (increment) sentinel'ini
  // değerlendiremez — bu yüzden önce okunup elle +1 yapılır.
  async function extendReportExpiry(reportId) {
    if (!cloud.user || !reportId) return false;
    try {
      const ref = cloud.db
        .collection("users").doc(cloud.user.uid)
        .collection("reports").doc(reportId);
      const snapshot = await ref.get();
      if (!snapshot.exists) return false;
      const newRev = Number(snapshot.data().rev || 0) + 1;
      await ref.update({
        rev: newRev,
        expireAt: firebase.firestore.Timestamp.fromMillis(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      if (reportId === cloud.activeReportId) cloud.knownRev = newRev;
      return true;
    } catch (error) {
      console.warn("Saklama süresi uzatılamadı:", error?.code || error?.message || error);
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Kirlilik takibi (app.js'e dokunmadan): state.updatedAt'i gözler
  // ---------------------------------------------------------------
  function isDirty() {
    return Boolean(cloud.user) && Boolean(cloud.activeReportId)
      && String(state.updatedAt || "") !== String(cloud.lastPushedUpdatedAt || "");
  }

  function startDirtyWatcher() {
    setInterval(() => {
      if (!isDirty()) return;
      if (Date.now() - cloud.lastPushTime < PUSH_MIN_INTERVAL_MS) return;
      pushReport();
    }, DIRTY_CHECK_INTERVAL_MS);

    // iOS'ta beforeunload güvenilmez: pagehide + visibilitychange esas (FAZ0 Bölüm 5).
    const flush = () => {
      if (isDirty()) pushReport();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
    window.addEventListener("pagehide", flush);
  }

  // ---------------------------------------------------------------
  // Arayüz: topbar "Bulut" düğmesi + modal
  // ---------------------------------------------------------------
  const STATUS_COLORS = {
    off: "#94a3b8",
    ready: "#94a3b8",
    syncing: "#d7b26a",
    synced: "#2e9e6b",
    warn: "#d97706",
    error: "#b23434",
  };

  function setStatus(kind, text) {
    cloud.statusKind = kind;
    cloud.lastSyncText = text;
    const dot = document.querySelector("#cloudStatusDot");
    if (dot) dot.style.background = STATUS_COLORS[kind] || STATUS_COLORS.off;
    const line = document.querySelector("#cloudStatusLine");
    if (line) line.textContent = text;
    const button = document.querySelector("#cloudButton");
    if (button) button.title = text;
  }

  function injectCloudButton() {
    const actions = document.querySelector(".topbar-actions");
    if (!actions || document.querySelector("#cloudButton")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "cloudButton";
    button.className = "ghost-button cloud-button";
    button.innerHTML = `<span id="cloudStatusDot" class="cloud-status-dot"></span>Bulut`;
    button.addEventListener("click", openCloudModal);
    actions.append(button);
    setStatus(cloud.statusKind, cloud.lastSyncText || "Bulut senkronu kapalı.");
  }

  function closeCloudModal() {
    document.querySelector("#cloudModalOverlay")?.remove();
  }

  function modalShell(bodyHtml) {
    closeCloudModal();
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "cloudModalOverlay";
    overlay.innerHTML = `
      <div class="modal-card cloud-modal">
        <div class="modal-head">
          <h3>Bulut Senkronu</h3>
          <button type="button" class="modal-close" id="cloudModalClose">×</button>
        </div>
        <div class="cloud-modal-body">${bodyHtml}</div>
      </div>`;
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeCloudModal();
    });
    document.body.append(overlay);
    overlay.querySelector("#cloudModalClose").addEventListener("click", closeCloudModal);
    return overlay;
  }

  function openCloudModal() {
    if (!isConfigured()) {
      modalShell(`
        <p><strong>Bulut senkronu henüz kurulmadı.</strong></p>
        <p class="cloud-muted">Kurulum adımları için <code>cloud/KURULUM.md</code> dosyasına bakın.
        Firebase yapılandırması <code>cloud/firebase-config.js</code> içine yapıştırıldığında
        bu ekrandan giriş yapabileceksiniz. Bulut kapalıyken tüm veriler yalnızca bu cihazda saklanır.</p>`);
      return;
    }
    if (!cloud.user) {
      renderLoginModal();
      return;
    }
    renderAccountModal();
  }

  function renderLoginModal(errorText = "") {
    const overlay = modalShell(`
      <p class="cloud-muted">Raporlar yalnızca kendi hesabınızla erişilebilir; belgeler ve ham
      belge metinleri buluta yüklenmez. Kayıtlar son işlemden ${RETENTION_DAYS} gün sonra buluttan silinir.</p>
      <label class="field"><span>E-posta</span>
        <input type="email" id="cloudEmail" autocomplete="username" inputmode="email"
          autocapitalize="off" autocorrect="off" spellcheck="false" />
      </label>
      <label class="field"><span>Şifre</span>
        <span class="cloud-password-wrap">
          <input type="password" id="cloudPassword" autocomplete="current-password"
            autocapitalize="off" autocorrect="off" spellcheck="false" />
          <button type="button" id="cloudTogglePassword" title="Şifreyi göster/gizle">👁</button>
        </span>
      </label>
      <p id="cloudLoginError" class="cloud-error">${errorText}</p>
      <button type="button" class="primary-button cloud-full-button" id="cloudLoginButton">Giriş Yap</button>`);

    const emailInput = overlay.querySelector("#cloudEmail");
    const passwordInput = overlay.querySelector("#cloudPassword");
    emailInput.value = localStorage.getItem("rapor-cloud-email") || "";

    overlay.querySelector("#cloudTogglePassword").addEventListener("click", () => {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });

    const submit = async () => {
      const errorLine = overlay.querySelector("#cloudLoginError");
      errorLine.textContent = "";
      const button = overlay.querySelector("#cloudLoginButton");
      button.disabled = true;
      button.textContent = "Giriş yapılıyor...";
      try {
        await cloud.auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
        localStorage.setItem("rapor-cloud-email", emailInput.value.trim());
        closeCloudModal();
      } catch (error) {
        // Kullanıcı adı deşifresini önle: her auth hatasında aynı genel mesaj.
        const network = String(error?.code || "").includes("network");
        errorLine.textContent = network
          ? "Bağlantı kurulamadı. İnternetinizi kontrol edin."
          : "E-posta adresi veya şifre hatalı.";
        button.disabled = false;
        button.textContent = "Giriş Yap";
      }
    };
    overlay.querySelector("#cloudLoginButton").addEventListener("click", submit);
    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submit();
    });
  }

  function renderAccountModal() {
    const expireText = `${RETENTION_DAYS} gün (son gönderimden itibaren; süre her gönderimde yenilenir)`;
    const overlay = modalShell(`
      <div class="cloud-status-row"><span>Hesap</span><strong>${cloud.user.email || "-"}</strong></div>
      <div class="cloud-status-row"><span>Açık Rapor</span><strong>${cloud.activeReportId || "-"}</strong></div>
      <div class="cloud-status-row"><span>Durum</span><strong id="cloudStatusLine">${cloud.lastSyncText || "-"}</strong></div>
      <div class="cloud-status-row"><span>Bulutta saklama</span><strong>${expireText}</strong></div>
      <div class="cloud-status-row"><span>Bugünkü gönderim</span><strong>${getDailyPushCount()} / ${FIRESTORE_DAILY_WRITE_LIMIT.toLocaleString("tr-TR")}</strong></div>
      <p class="cloud-muted"><strong>Başka bir cihazda oluşturduğunuz FARKLI bir raporu mu
      arıyorsunuz?</strong> Bu düğmeler yalnızca şu an ekranda açık olan raporu senkronlar.
      Farklı bir rapora geçmek/getirmek için üstteki <strong>Taleplerim</strong> düğmesini kullanın —
      diğer cihazlarda oluşturduğunuz raporlar orada "Yalnızca bulutta" olarak görünür.</p>
      <p class="cloud-muted">Kalıcı arşiv için raporu cihazınıza kaydedin: JSON geri yüklenebilir tam
      yedektir; Word/PDF yalnızca çıktıdır (12 - Banka ve Çıktı bölümü).</p>
      <div class="cloud-modal-actions">
        <button type="button" class="primary-button" id="cloudPushNow">Bu Raporu Şimdi Gönder</button>
        <button type="button" class="ghost-button" id="cloudPullNow">Bu Raporu Buluttan Yenile</button>
        <button type="button" class="ghost-button" id="cloudSignOut">Çıkış Yap</button>
      </div>`);

    overlay.querySelector("#cloudPushNow").addEventListener("click", async () => {
      await pushReport();
    });
    overlay.querySelector("#cloudPullNow").addEventListener("click", async () => {
      if (!window.confirm("Buluttaki sürüm bu cihazdaki rapor alanlarının üzerine yazılacak. Devam edilsin mi?")) return;
      const ok = await pullReport();
      if (ok) return;
      // Bu raporun bulut kaydı yoktu — kullanıcı büyük ihtimalle BAŞKA bir
      // cihazda oluşturduğu farklı bir raporu arıyor. Hesapta başka rapor
      // varsa Taleplerim'e yönlendiren açık bir ipucu göster (bkz. 2026-07-09
      // "boş kaldı" geri bildirimi — kök neden: yanlış düğme kullanımıydı).
      const others = await listCloudReports();
      if (!others.length) return;
      const hintOverlay = modalShell(`
        <p><strong>Bu cihazın açık raporu için bulutta kayıt bulunamadı.</strong></p>
        <p class="cloud-muted">Hesabınızda ${others.length} farklı rapor var. Başka bir cihazda
        oluşturduğunuz bir raporu mu arıyorsunuz? "Taleplerim" ekranında o rapor "Yalnızca
        bulutta" olarak görünür; oradan "Bu Cihaza Getir ve Aç" ile açabilirsiniz.</p>
        <div class="cloud-modal-actions">
          <button type="button" class="primary-button" id="cloudGoToLibrary">Taleplerim'i Aç</button>
          <button type="button" class="ghost-button" id="cloudDismissHint">Kapat</button>
        </div>`);
      hintOverlay.querySelector("#cloudGoToLibrary").addEventListener("click", () => {
        closeCloudModal();
        document.querySelector("#libraryButton")?.click();
      });
      hintOverlay.querySelector("#cloudDismissHint").addEventListener("click", closeCloudModal);
    });
    overlay.querySelector("#cloudSignOut").addEventListener("click", async () => {
      if (!window.confirm("Çıkış yapılacak ve bu cihazdaki yerel rapor verileri (bu cihaza özgü kopyalar) silinecek. Devam edilsin mi?")) return;
      await cloud.auth.signOut();
      purgeLocalReportData();
      closeCloudModal();
      window.location.reload();
    });
  }

  function showPullOffer(remoteData, cloudUpdatedIso) {
    const when = cloudUpdatedIso ? new Date(cloudUpdatedIso).toLocaleString("tr-TR") : "bilinmiyor";
    setStatus("warn", "Bulutta daha yeni sürüm var.");
    const overlay = modalShell(`
      <p><strong>Bulutta daha yeni bir rapor sürümü bulundu.</strong></p>
      <p class="cloud-muted">Bulut son güncelleme: ${when}. Yüklerseniz bu cihazdaki rapor
      alanlarının üzerine yazılır (belge/ham veriler etkilenmez).</p>
      <div class="cloud-modal-actions">
        <button type="button" class="primary-button" id="cloudAcceptPull">Buluttakini Yükle</button>
        <button type="button" class="ghost-button" id="cloudKeepLocal">Bu Cihazdakiyle Devam Et</button>
      </div>`);
    overlay.querySelector("#cloudAcceptPull").addEventListener("click", async () => {
      await pullReport(remoteData);
      closeCloudModal();
    });
    overlay.querySelector("#cloudKeepLocal").addEventListener("click", () => {
      setStatus("ready", "Yereldeki sürümle devam ediliyor; ilk gönderimde bulut güncellenecek.");
      closeCloudModal();
    });
  }

  function showConflictChoice(remoteData) {
    const overlay = modalShell(`
      <p><strong>Bulutta bu rapordan daha yeni bir sürüm var (başka cihaz).</strong></p>
      <p class="cloud-muted">Nasıl devam edilsin?</p>
      <div class="cloud-modal-actions">
        <button type="button" class="primary-button" id="cloudConflictPull">Buluttakini Yükle</button>
        <button type="button" class="ghost-button" id="cloudConflictPush">Bendekiyle Üzerine Yaz</button>
      </div>`);
    overlay.querySelector("#cloudConflictPull").addEventListener("click", async () => {
      await pullReport(remoteData);
      closeCloudModal();
    });
    overlay.querySelector("#cloudConflictPush").addEventListener("click", async () => {
      cloud.knownRev = Number(remoteData.rev || 0);
      await pushReport({ force: true });
      closeCloudModal();
    });
  }

  // ---------------------------------------------------------------
  // Başlatma
  // ---------------------------------------------------------------
  // Taleplerim (report-library.js) gibi dış arayüzlerin oturum değişikliğinde
  // kendini tazeleyebilmesi için basit bir dinleyici listesi.
  const authChangeListeners = [];
  function onAuthChange(callback) {
    if (typeof callback === "function") authChangeListeners.push(callback);
  }
  function notifyAuthChangeListeners() {
    authChangeListeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.warn("onAuthChange dinleyicisi hata verdi:", error);
      }
    });
  }

  // ---------------------------------------------------------------
  // ZORUNLU GİRİŞ KAPISI (2026-07-09) — kullanıcı isteği üzerine önceki D6
  // kararı ("bulutsuz da tam çalışır") TERSİNE ÇEVRİLDİ: artık kimlik
  // doğrulanmış + çevrimiçi olmadan uygulama görünmez/kullanılamaz
  // (fail-closed). index.html'deki #authGateOverlay sayfa açılır açılmaz
  // satır içi stille zaten opaktır; burada yalnızca içerik/görünürlük
  // yönetilir. Bkz. cloud/FAZ0-TASARIM.md D6 (superseded notu).
  // ---------------------------------------------------------------
  let firstAuthCheckDone = false;

  function isOnline() {
    return typeof navigator === "undefined" || navigator.onLine !== false;
  }

  function gateOverlay() {
    return document.querySelector("#authGateOverlay");
  }

  function hideGate() {
    const overlay = gateOverlay();
    if (overlay) overlay.style.display = "none";
  }

  function showGate() {
    const overlay = gateOverlay();
    if (overlay) overlay.style.display = "flex";
  }

  function setGateContent(html) {
    const content = document.querySelector("#authGateContent");
    if (content) content.innerHTML = html;
    showGate();
  }

  function renderGateBlocked(message) {
    setGateContent(`
      <p style="font-weight:800;font-size:15px;letter-spacing:.02em;">RAPOR YAZMA</p>
      <p style="color:#f3b0b0;font-size:14px;margin-top:10px;">${escapeHtmlSafe(message)}</p>
    `);
  }

  function renderGateOffline() {
    setGateContent(`
      <p style="font-weight:800;font-size:15px;letter-spacing:.02em;">RAPOR YAZMA</p>
      <p style="color:#b9c5d6;font-size:14px;margin-top:10px;">İnternet bağlantısı bulunamadı.
      Bu sistem yalnızca çevrimiçiyken kullanılabilir.</p>
      <p style="color:#8a99ad;font-size:12px;margin-top:6px;">Bağlantı gelince bu ekran otomatik kapanır.</p>
    `);
  }

  function renderGateLogin(errorText = "") {
    setGateContent(`
      <div class="gate-card" style="background:#ffffff;border-radius:14px;padding:26px 22px;text-align:left;color:#152238;">
        <p style="margin:0 0 4px;font-weight:800;font-size:15px;letter-spacing:.02em;color:#111d3d;">RAPOR YAZMA</p>
        <p style="margin:0 0 18px;color:#5a6576;font-size:13px;">Devam etmek için giriş yapın. Belgeler ve ham
        belge metinleri buluta yüklenmez; yalnızca kendi hesabınızın raporlarını görürsünüz.</p>
        <label class="field"><span>E-posta</span>
          <input type="email" id="gateEmail" autocomplete="username" inputmode="email"
            autocapitalize="off" autocorrect="off" spellcheck="false" />
        </label>
        <label class="field" style="margin-top:12px;"><span>Şifre</span>
          <span class="cloud-password-wrap">
            <input type="password" id="gatePassword" autocomplete="current-password"
              autocapitalize="off" autocorrect="off" spellcheck="false" />
            <button type="button" id="gateTogglePassword" title="Şifreyi göster/gizle">👁</button>
          </span>
        </label>
        <p id="gateLoginError" class="cloud-error">${errorText}</p>
        <button type="button" class="primary-button cloud-full-button" id="gateLoginButton" style="margin-top:6px;">Giriş Yap</button>
      </div>`);

    const emailInput = document.querySelector("#gateEmail");
    const passwordInput = document.querySelector("#gatePassword");
    emailInput.value = localStorage.getItem("rapor-cloud-email") || "";

    document.querySelector("#gateTogglePassword").addEventListener("click", () => {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });

    const submit = async () => {
      const errorLine = document.querySelector("#gateLoginError");
      errorLine.textContent = "";
      const button = document.querySelector("#gateLoginButton");
      button.disabled = true;
      button.textContent = "Giriş yapılıyor...";
      try {
        await cloud.auth.signInWithEmailAndPassword(emailInput.value.trim(), passwordInput.value);
        localStorage.setItem("rapor-cloud-email", emailInput.value.trim());
        // Başarılı girişte onAuthStateChanged tetiklenir ve evaluateGate() kapıyı kapatır.
      } catch (error) {
        const network = String(error?.code || "").includes("network");
        errorLine.textContent = network
          ? "Bağlantı kurulamadı. İnternetinizi kontrol edin."
          : "E-posta adresi veya şifre hatalı.";
        button.disabled = false;
        button.textContent = "Giriş Yap";
      }
    };
    document.querySelector("#gateLoginButton").addEventListener("click", submit);
    passwordInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") submit();
    });
  }

  function evaluateGate() {
    if (!firstAuthCheckDone) return; // Firebase ilk oturum durumunu henüz bildirmedi; statik "Kontrol ediliyor" kalır.
    if (!isOnline()) {
      renderGateOffline();
      return;
    }
    if (!cloud.user) {
      renderGateLogin();
      return;
    }
    hideGate();
  }

  function escapeHtmlSafe(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  // Yalnızca AÇIK "Çıkış Yap" eylemi çağırır — geçici çevrimdışı anlarda veya
  // sıradan oturum kontrolünde ASLA tetiklenmez (veri kaybı riski).
  function purgeLocalReportData() {
    try {
      localStorage.removeItem("rapor-yazma-programi-draft-v1");
      localStorage.removeItem("rapor-library-index-v1");
      Object.keys(localStorage)
        .filter((key) => key.startsWith("rapor-library-report-"))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.warn("Yerel rapor verisi temizlenemedi:", error);
    }
  }

  async function handleAuthState(user) {
    cloud.user = user || null;
    firstAuthCheckDone = true;
    if (!user) {
      cloud.knownRev = 0;
      cloud.lastPushedUpdatedAt = null;
      setStatus("off", "Bulut senkronu kapalı (giriş yapılmadı).");
      notifyAuthChangeListeners();
      evaluateGate();
      return;
    }
    if (cloud.activeReportId) {
      await checkForNewerOnOpen();
    } else {
      setStatus("ready", "Bulut ile bağlantı kuruldu.");
    }
    notifyAuthChangeListeners();
    evaluateGate();
  }

  function init() {
    if (!hasAppGlobals()) {
      console.warn("cloud-sync: uygulama global'leri bulunamadı; modül pasif.");
      return;
    }
    injectCloudButton();

    if (!isConfigured()) {
      setStatus("off", "Bulut senkronu kurulmadı (cloud/KURULUM.md).");
      renderGateBlocked("Bulut yapılandırması eksik. Sistem yöneticinizle iletişime geçin.");
      return;
    }
    if (typeof firebase === "undefined" || !firebase.initializeApp) {
      setStatus("error", "Firebase kütüphanesi yüklenemedi.");
      renderGateBlocked("Bağlantı bileşenleri yüklenemedi. Sayfayı yenileyin.");
      return;
    }

    cloud.app = firebase.initializeApp(RAPOR_FIREBASE_CONFIG);
    cloud.auth = firebase.auth();
    cloud.db = firebase.firestore();
    // Çevrimdışı önbellek: bağlantı yokken yazmalar kuyruklanır, gelince gönderilir.
    cloud.db.enablePersistence({ synchronizeTabs: true }).catch((error) => {
      console.warn("Firestore çevrimdışı önbellek açılamadı:", error?.code || error);
    });

    cloud.auth.onAuthStateChanged(handleAuthState);
    startDirtyWatcher();

    window.addEventListener("online", evaluateGate);
    window.addEventListener("offline", evaluateGate);
  }

  // report-library.js ve testler için dışa açılan yüzey.
  window.RaporCloudSync = {
    buildCloudReportPayload,
    isConfigured,
    isDirty,
    pushReport,
    pullReport,
    setActiveReportId,
    listCloudReports,
    deleteCloudReport,
    extendReportExpiry,
    getDailyPushCount,
    openCloudModal,
    onAuthChange,
    getStatus: () => ({
      kind: cloud.statusKind,
      text: cloud.lastSyncText,
      activeReportId: cloud.activeReportId,
      rev: cloud.knownRev,
      signedIn: Boolean(cloud.user),
      email: cloud.user?.email || null,
    }),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
