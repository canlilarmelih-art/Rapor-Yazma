// =====================================================================
// Yerel Rapor Kütüphanesi — Faz 2 (2026-07-09)
// =====================================================================
// app.js'in tek-aktif-taslak mimarisini DEĞİŞTİRMEZ: 21k satırlık uygulama
// hâlâ tek bir `state` üzerinde çalışır. Bu modül onun ÜSTÜNE, çoklu rapor
// yönetimi için bir "kütüphane" katmanı ekler:
//   - Her rapor localStorage'da ayrı bir blob olarak durur (mevcut
//     "JSON olarak farklı kaydet" ile birebir aynı paket şekli — bkz.
//     app.js > exportReportJson), böylece tamamen ÇEVRİMDIŞI çalışır.
//   - Bir özet index'i (liste/arama/arşiv için) ayrı bir anahtarda tutulur.
//   - Rapor değiştirme = mevcut raporu kütüphaneye kaydet, sonra hedef
//     raporun blobunu mevcut var olan `restoreStateFromImportedJson` ile
//     aktif hale getir (tekerlek yeniden icat edilmedi).
//   - Bulut senkronu (cloud-sync.js) artık "aktif rapor" kavramını bu
//     modülden alır (setActiveReportId).
//
// index.html'de app.js VE cloud/cloud-sync.js'ten SONRA yüklenmelidir.
// =====================================================================

(() => {
  "use strict";

  const INDEX_KEY = "rapor-library-index-v1";
  const BLOB_PREFIX = "rapor-library-report-";
  const BLOB_SCHEMA = "rapor-yazma-programi-state";
  const QUICK_LEGAL_USAGE_OPTIONS = ["", "Konut", "İşyeri", "Ofis", "Arsa", "Arazi", "Ticari Bina", "Sanayi Tesisi"];
  // Faz 3.1: "Taleplerim" ekranı sistem açılışında bir kez otomatik gösterilir.
  // sessionStorage kasıtlı seçildi (localStorage değil): sekme kapanınca
  // sıfırlanır ama AYNI sekmede yapılan cache-buster Ctrl+F5 yenilemelerinde
  // kalıcıdır — kullanıcı rapor üzerinde çalışırken her yenilemede ekranın
  // önüne düşüp işini bölmez, yalnızca gerçekten yeni bir oturumda görünür.
  const DASHBOARD_SESSION_FLAG_KEY = "rapor-dashboard-shown-this-session";

  function hasAppGlobals() {
    try {
      return typeof state === "object" && typeof saveState === "function" && typeof render === "function"
        && typeof restoreStateFromImportedJson === "function" && typeof loadState === "function";
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------
  // Depolama yardımcıları
  // ---------------------------------------------------------------
  function blobKey(id) {
    return `${BLOB_PREFIX}${id}`;
  }

  function readIndex() {
    try {
      const parsed = JSON.parse(localStorage.getItem(INDEX_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeIndex(list) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  }

  function readBlob(id) {
    try {
      const parsed = JSON.parse(localStorage.getItem(blobKey(id)) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeBlob(id, blob) {
    localStorage.setItem(blobKey(id), JSON.stringify(blob));
  }

  function removeBlob(id) {
    localStorage.removeItem(blobKey(id));
  }

  function generateReportId() {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `RE-${year}-${random}`;
  }

  function summarizeFields(fields = {}) {
    return {
      caseName: String(fields.caseName || ""),
      customerName: String(fields.customerName || ""),
      bank: String(fields.bank || ""),
      city: String(fields.city || fields.titleCity || ""),
      district: String(fields.district || fields.titleDistrict || ""),
      adaParsel: String(fields.titleAdaParsel || fields.adaParsel || ""),
      propertyType: String(fields.legalUsageNature || fields.propertyKind || ""),
      // Dashboard'daki "Gün" geri sayımı için (bkz. formatDeadlineBadge).
      appointmentDate: String(fields.appointmentDate || ""),
    };
  }

  function buildBlobFromActiveState() {
    return {
      schema: BLOB_SCHEMA,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "report-library",
      // Faz 3: rapor değişince kullanıcı kaldığı bölümden devam etsin
      // (restoreStateFromImportedJson bu alanı okur — bkz. app.js).
      activeSectionId: typeof activeSectionId === "string" ? activeSectionId : "",
      state: JSON.parse(JSON.stringify(state)),
    };
  }

  // ---------------------------------------------------------------
  // Aktif rapor <-> kütüphane
  // ---------------------------------------------------------------
  function ensureActiveReportId() {
    if (!state.reportId) {
      state.reportId = generateReportId();
      saveState();
    }
  }

  // Mevcut aktif raporu kütüphaneye (blob + index) yazar. Rapor değişiminden
  // ÖNCE her zaman çağrılır ki veri kaybı olmasın.
  function flushActiveToLibrary() {
    ensureActiveReportId();
    saveState();
    const id = state.reportId;
    writeBlob(id, buildBlobFromActiveState());

    const index = readIndex();
    const existingIndex = index.findIndex((entry) => entry.reportId === id);
    const now = new Date().toISOString();
    const entry = {
      reportId: id,
      createdAt: existingIndex >= 0 ? (index[existingIndex].createdAt || now) : now,
      updatedAt: state.updatedAt || now,
      archived: existingIndex >= 0 ? Boolean(index[existingIndex].archived) : false,
      // "Taslak" | "Tamamlandı" — kullanıcı dashboard'dan elle işaretler
      // (bkz. toggleStatus); otomatik hesaplanmaz.
      status: existingIndex >= 0 ? (index[existingIndex].status || "draft") : "draft",
      summary: summarizeFields(state.fields || {}),
    };
    if (existingIndex >= 0) index[existingIndex] = entry; else index.unshift(entry);
    writeIndex(index);
    return id;
  }

  // Bir kütüphane blobunu doğrudan aktif hale getirir (ÖNCEKİ aktif raporu
  // kaydetmeden). Yalnızca çağıranın önceki raporu zaten ele aldığı
  // durumlarda kullanılır (bkz. deleteReport).
  function loadReportIntoActiveState(id) {
    const blob = readBlob(id);
    if (!blob) return false;
    const localKnownUpdatedAt = blob.state?.updatedAt || null;
    restoreStateFromImportedJson(blob, `${id}.json`);
    if (state.reportId !== id) state.reportId = id;
    window.RaporCloudSync?.setActiveReportId(id, { localKnownUpdatedAt });
    return true;
  }

  function resetToFreshEmptyReport(initialFields = {}) {
    localStorage.removeItem(storageKey);
    state = loadState();
    normalizeAddressSourceState(state);
    applySystemDefaults(state);
    applyUserFieldDefaults(state);
    applyImarDerivedBusinessRules(state);
    state.reportId = generateReportId();
    Object.assign(state.fields, initialFields);
    activeSectionId = sections[0].id;
    saveState();
    flushActiveToLibrary();
    window.RaporCloudSync?.setActiveReportId(state.reportId, { localKnownUpdatedAt: state.updatedAt });
    render();
  }

  function openReportById(id) {
    if (id === state.reportId) {
      closeDashboard();
      return;
    }
    flushActiveToLibrary();
    if (!loadReportIntoActiveState(id)) {
      window.alert("Rapor bu cihazda bulunamadı.");
      return;
    }
    closeDashboard();
  }

  function createNewReport(quickFields) {
    flushActiveToLibrary();
    resetToFreshEmptyReport(quickFields);
    closeDashboard();
  }

  function cloneReport(sourceId) {
    const sourceBlob = readBlob(sourceId);
    if (!sourceBlob) return;
    flushActiveToLibrary();

    const cloned = JSON.parse(JSON.stringify(sourceBlob));
    const newId = generateReportId();
    cloned.state = cloned.state || {};
    cloned.state.reportId = newId;
    cloned.state.updatedAt = new Date().toISOString();
    if (cloned.state.fields) {
      // Not: " (Kopya)" değil " - Kopya" — uygulamanın başlık normalizasyonu
      // (toTitleCaseTr) kelime sınırı olarak boşluk/tire kullanır, parantez
      // sonrası harfi büyütmez ("(kopya)" çıkardı). Tire ile doğru görünür.
      cloned.state.fields.caseName = `${cloned.state.fields.caseName || "Rapor"} - Kopya`;
    }
    writeBlob(newId, cloned);

    const index = readIndex();
    index.unshift({
      reportId: newId,
      createdAt: new Date().toISOString(),
      updatedAt: cloned.state.updatedAt,
      archived: false,
      status: "draft",
      summary: summarizeFields(cloned.state.fields || {}),
    });
    writeIndex(index);

    loadReportIntoActiveState(newId);
    closeDashboard();
    renderDashboardBody();
  }

  function toggleStatus(id) {
    const index = readIndex();
    const entry = index.find((item) => item.reportId === id);
    if (!entry) return;
    entry.status = entry.status === "completed" ? "draft" : "completed";
    writeIndex(index);
    renderDashboardBody();
  }

  function toggleArchive(id) {
    const index = readIndex();
    const entry = index.find((item) => item.reportId === id);
    if (!entry) return;
    entry.archived = !entry.archived;
    writeIndex(index);
    renderDashboardBody();
  }

  async function deleteReport(id) {
    const confirmed = window.confirm(
      "Bu rapor bu cihazdan ve (bağlıysa) bulut hesabınızdan kalıcı olarak silinecek. Devam edilsin mi?",
    );
    if (!confirmed) return;

    const wasActive = state.reportId === id;
    removeBlob(id);
    const index = readIndex().filter((entry) => entry.reportId !== id);
    writeIndex(index);

    if (window.RaporCloudSync?.isConfigured()) {
      await window.RaporCloudSync.deleteCloudReport(id);
    }
    // Bellekteki bulut listesi önbelleği (cloudReportsCache) burada
    // güncellenmezse, biraz önce silinen rapor bir sonraki çizimde "yalnızca
    // bulutta" hayalet kart olarak YENİDEN belirir (localIds'de artık yok
    // ama eski önbellekte hâlâ var görünür). Bkz. kullanıcı geri bildirimi
    // 2026-07-10: "talepleri silsem de yine gözüküyor".
    if (cloudReportsCache) delete cloudReportsCache[id];

    if (wasActive) {
      const next = [...index]
        .filter((entry) => !entry.archived)
        .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")))[0]
        || index[0];
      if (next) {
        loadReportIntoActiveState(next.reportId);
      } else {
        resetToFreshEmptyReport();
      }
    }
    renderDashboardBody();
  }

  // ---------------------------------------------------------------
  // Arayüz
  // ---------------------------------------------------------------
  let showArchived = false;
  let searchQuery = "";
  let statusFilter = "all"; // "all" | "draft" | "completed"
  let cloudReportsCache = null; // { [reportId]: cloudDocData }

  function closeDashboard() {
    document.querySelector("#libraryModalOverlay")?.remove();
  }

  function injectLibraryButton() {
    const newCaseBtn = document.querySelector("#newCaseBtn");
    if (!newCaseBtn || document.querySelector("#libraryButton")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.id = "libraryButton";
    button.className = "ghost-button";
    button.textContent = "Taleplerim";
    button.addEventListener("click", openDashboard);
    newCaseBtn.insertAdjacentElement("afterend", button);
  }

  function formatRelativeUpdatedAt(iso) {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // Randevu tarihine göre "Gün" geri sayımı — banka portalındaki gün sayacının
  // karşılığı. Alan boşsa (henüz randevu tarihi girilmemiş) rozet gösterilmez.
  function formatDeadlineBadge(appointmentDateIso) {
    if (!appointmentDateIso) return "";
    const target = new Date(`${appointmentDateIso}T00:00:00`);
    if (Number.isNaN(target.getTime())) return "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    let label;
    let cls;
    if (daysLeft < 0) {
      label = `${Math.abs(daysLeft)} gün gecikti`;
      cls = "library-badge-danger";
    } else if (daysLeft === 0) {
      label = "Bugün";
      cls = "library-badge-warn";
    } else if (daysLeft <= 2) {
      label = `${daysLeft} gün kaldı`;
      cls = "library-badge-warn";
    } else {
      label = `${daysLeft} gün kaldı`;
      cls = "library-badge-ok";
    }
    return `<span class="library-badge ${cls}">Randevu: ${label}</span>`;
  }

  function formatExpiryBadge(expireAtTimestamp) {
    if (!expireAtTimestamp || typeof expireAtTimestamp.toDate !== "function") return "";
    const expireDate = expireAtTimestamp.toDate();
    const daysLeft = Math.ceil((expireDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const warn = daysLeft <= 7;
    const label = daysLeft <= 0 ? "bugün silinecek" : `${daysLeft} gün sonra silinecek`;
    return `<span class="library-badge ${warn ? "library-badge-warn" : "library-badge-ok"}">Bulut · ${label}</span>`;
  }

  async function refreshCloudBadges(grid) {
    if (!window.RaporCloudSync?.isConfigured()) return;
    const status = window.RaporCloudSync.getStatus();
    if (!status.signedIn) return;
    if (!cloudReportsCache) {
      const list = await window.RaporCloudSync.listCloudReports();
      cloudReportsCache = {};
      list.forEach((item) => {
        cloudReportsCache[item.id] = item.data;
      });
    }
    grid.querySelectorAll("[data-sync-slot]").forEach((slot) => {
      const id = slot.dataset.syncSlot;
      const cloudData = cloudReportsCache[id];
      if (!cloudData) {
        slot.innerHTML = `<span class="library-badge library-badge-off">Yalnızca bu cihazda</span>`;
        return;
      }
      const badge = formatExpiryBadge(cloudData.expireAt) || `<span class="library-badge library-badge-ok">Bulutta</span>`;
      slot.innerHTML = `${badge} <button type="button" class="library-extend-button" data-action="extend" data-id="${escapeHtml(id)}">+30 gün</button>`;
    });
  }

  async function extendCloudExpiry(reportId) {
    const ok = await window.RaporCloudSync?.extendReportExpiry(reportId);
    if (!ok) return;
    cloudReportsCache = null; // sunucudan taze veriyi göstermek için yeniden çek
    const overlay = document.querySelector("#libraryModalOverlay");
    if (overlay) refreshCloudBadges(overlay.querySelector("#libraryCardsGrid"));
  }

  function matchesSearch(entry, query) {
    if (!query) return true;
    const folded = typeof foldTurkish === "function" ? foldTurkish : (v) => String(v || "").toUpperCase();
    const haystack = folded(Object.values(entry.summary || {}).join(" "));
    return haystack.includes(folded(query));
  }

  function cardHtml(entry) {
    const s = entry.summary || {};
    const isActive = entry.reportId === state.reportId;
    const isCompleted = entry.status === "completed";
    const safe = (value) => escapeHtml(String(value || "-"));
    const deadlineBadge = formatDeadlineBadge(s.appointmentDate);
    return `
      <article class="library-card${isActive ? " is-active" : ""}" data-report-id="${escapeHtml(entry.reportId)}">
        <header class="library-card-head">
          <h4>${safe(s.caseName || "Adsız Rapor")}</h4>
          <span class="library-card-badges">
            <span class="library-status-pill ${isCompleted ? "is-completed" : "is-draft"}">${isCompleted ? "Tamamlandı" : "Taslak"}</span>
            ${isActive ? '<span class="library-active-pill">Şu an açık</span>' : ""}
          </span>
        </header>
        <dl class="library-card-facts">
          <div><dt>Banka</dt><dd>${safe(s.bank)}</dd></div>
          <div><dt>Müşteri</dt><dd>${safe(s.customerName)}</dd></div>
          <div><dt>Konum</dt><dd>${safe([s.city, s.district].filter(Boolean).join(" / "))}</dd></div>
          <div><dt>Ada/Parsel</dt><dd>${safe(s.adaParsel)}</dd></div>
          <div><dt>Tür</dt><dd>${safe(s.propertyType)}</dd></div>
        </dl>
        ${deadlineBadge ? `<p class="library-card-deadline">${deadlineBadge}</p>` : ""}
        <p class="library-card-updated">Son güncelleme: ${formatRelativeUpdatedAt(entry.updatedAt)}</p>
        <p class="library-card-sync" data-sync-slot="${escapeHtml(entry.reportId)}"></p>
        <div class="library-card-actions">
          <button type="button" class="mini-button" data-action="open" data-id="${escapeHtml(entry.reportId)}">Aç</button>
          <button type="button" class="mini-button" data-action="clone" data-id="${escapeHtml(entry.reportId)}">Kopyala</button>
          <button type="button" class="mini-button" data-action="status" data-id="${escapeHtml(entry.reportId)}">${isCompleted ? "Taslağa Al" : "Tamamlandı İşaretle"}</button>
          <button type="button" class="mini-button" data-action="archive" data-id="${escapeHtml(entry.reportId)}">${entry.archived ? "Arşivden Çıkar" : "Arşivle"}</button>
          <button type="button" class="mini-button library-danger-button" data-action="delete" data-id="${escapeHtml(entry.reportId)}">Sil</button>
        </div>
      </article>`;
  }

  function cloudOnlyCardHtml(reportId, cloudData) {
    const s = cloudData.summary || {};
    const safe = (value) => escapeHtml(String(value || "-"));
    return `
      <article class="library-card library-card-cloud-only" data-report-id="${escapeHtml(reportId)}">
        <header class="library-card-head">
          <h4>${safe(s.caseName || "Adsız Rapor")}</h4>
          <span class="library-active-pill library-cloud-pill">Yalnızca bulutta</span>
        </header>
        <dl class="library-card-facts">
          <div><dt>Banka</dt><dd>${safe(s.bank)}</dd></div>
          <div><dt>Konum</dt><dd>${safe([s.city, s.district].filter(Boolean).join(" / "))}</dd></div>
        </dl>
        <div class="library-card-actions">
          <button type="button" class="primary-button" data-action="fetch-cloud" data-id="${escapeHtml(reportId)}">Bu Cihaza Getir ve Aç</button>
          <button type="button" class="mini-button library-danger-button" data-action="delete-cloud-only" data-id="${escapeHtml(reportId)}">Sil</button>
        </div>
      </article>`;
  }

  async function deleteCloudOnlyReport(id) {
    const confirmed = window.confirm(
      "Bu rapor bu cihaza hiç getirilmedi; yalnızca bulut hesabınızdan kalıcı olarak silinecek. Devam edilsin mi?",
    );
    if (!confirmed) return;
    await window.RaporCloudSync?.deleteCloudReport(id);
    if (cloudReportsCache) delete cloudReportsCache[id];
    renderDashboardBody();
  }

  function computeStatusCounts(index) {
    const base = index.filter((entry) => showArchived || !entry.archived);
    return {
      all: base.length,
      draft: base.filter((entry) => (entry.status || "draft") === "draft").length,
      completed: base.filter((entry) => (entry.status || "draft") === "completed").length,
    };
  }

  function renderStatusFilterChips(overlay, index) {
    const container = overlay.querySelector("#libraryStatusFilter");
    if (!container) return;
    const counts = computeStatusCounts(index);
    const chips = [
      { key: "all", label: "Tümü" },
      { key: "draft", label: "Taslak" },
      { key: "completed", label: "Tamamlandı" },
    ];
    container.innerHTML = chips
      .map(({ key, label }) => `
        <button type="button" class="library-filter-chip${statusFilter === key ? " is-active" : ""}" data-status-filter="${key}">
          ${label} (${counts[key]})
        </button>`)
      .join("");
    container.querySelectorAll("[data-status-filter]").forEach((chip) => {
      chip.addEventListener("click", () => {
        statusFilter = chip.dataset.statusFilter;
        renderDashboardBody();
      });
    });
  }

  async function renderDashboardBody() {
    const overlay = document.querySelector("#libraryModalOverlay");
    if (!overlay) return;
    const grid = overlay.querySelector("#libraryCardsGrid");
    const index = readIndex();
    renderStatusFilterChips(overlay, index);
    const localIds = new Set(index.map((entry) => entry.reportId));
    const visible = index
      .filter((entry) => showArchived || !entry.archived)
      .filter((entry) => statusFilter === "all" || (entry.status || "draft") === statusFilter)
      .filter((entry) => matchesSearch(entry, searchQuery))
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

    let html = "";
    if (!visible.length) {
      html += `<p class="library-empty-state">Görüntülenecek talep yok. "+ Yeni Talep Oluştur" ile başlayın veya filtre/aramayı temizleyin.</p>`;
    } else {
      html += visible.map(cardHtml).join("");
    }

    if (window.RaporCloudSync?.isConfigured() && window.RaporCloudSync.getStatus().signedIn && cloudReportsCache) {
      Object.keys(cloudReportsCache)
        .filter((id) => !localIds.has(id))
        .forEach((id) => {
          html += cloudOnlyCardHtml(id, cloudReportsCache[id]);
        });
    }

    grid.innerHTML = html;
    refreshCloudBadges(grid);
  }

  function buildQuickFormHtml() {
    const bankOptions = (typeof caseBankOptions !== "undefined" ? caseBankOptions : [])
      .map((bank) => `<option value="${escapeHtml(bank)}">${escapeHtml(bank)}</option>`)
      .join("");
    const usageOptions = QUICK_LEGAL_USAGE_OPTIONS
      .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt || "Seçiniz")}</option>`)
      .join("");
    return `
      <div class="library-new-report-form">
        <label class="field"><span>Banka</span>
          <select id="libraryNewBank"><option value="">Seçiniz</option>${bankOptions}</select>
        </label>
        <label class="field"><span>Müşteri / Talep Eden</span>
          <input type="text" id="libraryNewCustomer" />
        </label>
        <label class="field field-wide"><span>İş Adı *</span>
          <input type="text" id="libraryNewCaseName" placeholder="Örn. Yeni Ekspertiz Raporu" />
        </label>
        <label class="field"><span>İl</span>
          <input type="text" id="libraryNewCity" />
        </label>
        <label class="field"><span>Yasal Kullanım Niteliği</span>
          <select id="libraryNewUsage">${usageOptions}</select>
        </label>
      </div>
      <p id="libraryNewReportError" class="cloud-error"></p>
      <div class="cloud-modal-actions">
        <button type="button" class="primary-button" id="libraryNewReportSubmit">Talebi Oluştur</button>
        <button type="button" class="ghost-button" id="libraryNewReportCancel">Vazgeç</button>
      </div>`;
  }

  // Taleplerim açıkken kullanıcı "Giriş Yap"a basıp giriş yaparsa (veya
  // çıkış yaparsa) şerit otomatik güncellensin diye — bkz. init()'teki
  // window.RaporCloudSync.onAuthChange(...) kaydı.
  function refreshAccountStrip() {
    const strip = document.querySelector("#libraryAccountStrip");
    if (!strip) return;
    strip.innerHTML = renderAccountStripHtml();
    strip.querySelector("#libraryAccountAction")?.addEventListener("click", () => {
      window.RaporCloudSync?.openCloudModal();
    });
    renderDashboardBody(); // bulut rozetleri de yeni oturuma göre tazelensin
  }

  function renderAccountStripHtml() {
    const cloudApi = window.RaporCloudSync;
    if (!cloudApi?.isConfigured()) {
      return `<span class="library-account-text">Bulut senkronu kurulmadı — yalnızca bu cihaz.</span>`;
    }
    const status = cloudApi.getStatus();
    if (!status.signedIn) {
      return `
        <span class="library-account-text">🔒 Giriş yapılmadı — talepler yalnızca bu cihazda.</span>
        <button type="button" class="mini-button" id="libraryAccountAction">Giriş Yap</button>`;
    }
    return `
      <span class="library-account-text">✅ ${escapeHtml(status.email || "Bulut hesabı")}</span>
      <button type="button" class="mini-button" id="libraryAccountAction">Hesap</button>`;
  }

  function openDashboard() {
    flushActiveToLibrary(); // sayfayı açmadan önce mevcut değişiklikleri kaydet
    cloudReportsCache = null; // her açılışta bulut listesini tazele

    closeDashboard();
    const overlay = document.createElement("div");
    overlay.className = "library-page-overlay";
    overlay.id = "libraryModalOverlay";
    overlay.innerHTML = `
      <div class="library-page">
        <header class="library-page-head">
          <div class="library-page-brand">
            <h2>Taleplerim</h2>
            <p class="subtle-text">Rapor Yazma Programı</p>
          </div>
          <div class="library-account-strip" id="libraryAccountStrip">${renderAccountStripHtml()}</div>
          <button type="button" class="ghost-button library-continue-button" id="libraryModalClose">Rapora Devam Et →</button>
        </header>
        <div class="library-modal-body">
          <div class="library-status-filter" id="libraryStatusFilter"></div>
          <div class="library-toolbar">
            <input type="search" id="librarySearch" placeholder="Ara: müşteri, iş adı, il, ilçe, ada/parsel..." />
            <label class="toggle"><input type="checkbox" id="libraryShowArchived" /> Arşivlenenler</label>
            <button type="button" class="primary-button" id="libraryNewReportBtn">+ Yeni Talep Oluştur</button>
          </div>
          <div id="libraryNewReportPanel" hidden></div>
          <div id="libraryCardsGrid" class="library-cards-grid"></div>
        </div>
      </div>`;
    document.body.append(overlay);
    overlay.querySelector("#libraryModalClose").addEventListener("click", closeDashboard);
    overlay.querySelector("#libraryAccountAction")?.addEventListener("click", () => {
      window.RaporCloudSync?.openCloudModal();
    });

    const searchInput = overlay.querySelector("#librarySearch");
    searchInput.value = searchQuery;
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      renderDashboardBody();
    });

    const archivedToggle = overlay.querySelector("#libraryShowArchived");
    archivedToggle.checked = showArchived;
    archivedToggle.addEventListener("change", () => {
      showArchived = archivedToggle.checked;
      renderDashboardBody();
    });

    const newPanel = overlay.querySelector("#libraryNewReportPanel");
    overlay.querySelector("#libraryNewReportBtn").addEventListener("click", () => {
      newPanel.hidden = !newPanel.hidden;
      if (!newPanel.hidden) {
        newPanel.innerHTML = buildQuickFormHtml();
        newPanel.querySelector("#libraryNewReportCancel").addEventListener("click", () => {
          newPanel.hidden = true;
        });
        newPanel.querySelector("#libraryNewReportSubmit").addEventListener("click", () => {
          const caseName = newPanel.querySelector("#libraryNewCaseName").value.trim();
          const errorLine = newPanel.querySelector("#libraryNewReportError");
          if (!caseName) {
            errorLine.textContent = "İş adı zorunludur.";
            return;
          }
          createNewReport({
            caseName,
            bank: newPanel.querySelector("#libraryNewBank").value,
            customerName: newPanel.querySelector("#libraryNewCustomer").value.trim(),
            city: newPanel.querySelector("#libraryNewCity").value.trim(),
            legalUsageNature: newPanel.querySelector("#libraryNewUsage").value,
          });
        });
      }
    });

    const grid = overlay.querySelector("#libraryCardsGrid");
    grid.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;
      const { action, id } = button.dataset;
      if (action === "open") openReportById(id);
      else if (action === "clone") cloneReport(id);
      else if (action === "status") toggleStatus(id);
      else if (action === "archive") toggleArchive(id);
      else if (action === "delete") deleteReport(id);
      else if (action === "fetch-cloud") fetchCloudReportAndOpen(id);
      else if (action === "delete-cloud-only") deleteCloudOnlyReport(id);
      else if (action === "extend") extendCloudExpiry(id);
    });

    renderDashboardBody();
  }

  async function fetchCloudReportAndOpen(reportId) {
    if (!cloudReportsCache || !cloudReportsCache[reportId]) return;
    const cloudData = cloudReportsCache[reportId];
    if (!cloudData.payload) {
      window.alert("Bulut kaydı okunamadı (eksik veri).");
      return;
    }
    flushActiveToLibrary();
    const blob = {
      schema: BLOB_SCHEMA,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "report-library-cloud-fetch",
      activeSectionId: cloudData.lastActiveSection || "",
      state: {
        reportId,
        fields: cloudData.payload.fields || {},
        tables: cloudData.payload.tables || {},
        lookupOptions: cloudData.payload.lookupOptions || {},
        updatedAt: cloudData.payload.updatedAt || new Date().toISOString(),
      },
    };
    writeBlob(reportId, blob);
    const index = readIndex();
    index.unshift({
      reportId,
      createdAt: new Date().toISOString(),
      updatedAt: blob.state.updatedAt,
      archived: false,
      status: "draft",
      summary: summarizeFields(blob.state.fields),
    });
    writeIndex(index);
    loadReportIntoActiveState(reportId);
    closeDashboard();
  }

  // Sistem ilk açıldığında (yeni tarayıcı sekmesi/oturumu) "Taleplerim"
  // otomatik gösterilir. Aynı sekmede sonradan yapılan Ctrl+F5 yenilemeleri
  // TEKRAR açmaz (sessionStorage bayrağı kalıcıdır) — kullanıcı bir rapor
  // üzerinde çalışırken bölünmesin diye.
  function maybeAutoShowDashboardOnFreshSession() {
    try {
      if (sessionStorage.getItem(DASHBOARD_SESSION_FLAG_KEY)) return;
      sessionStorage.setItem(DASHBOARD_SESSION_FLAG_KEY, "1");
    } catch {
      return; // sessionStorage erişilemiyorsa (ör. gizli sekme kısıtı) sessizce atla
    }
    openDashboard();
  }

  // ---------------------------------------------------------------
  // Başlatma
  // ---------------------------------------------------------------
  let initialized = false;
  let authListenerRegistered = false;

  function init() {
    if (!hasAppGlobals()) {
      console.warn("report-library: uygulama global'leri bulunamadı; modül pasif.");
      return;
    }
    // Bulut karşılaştırması için "gerçek" son bilinen zamanı, kendi
    // flush'ımız state.updatedAt'i tazelemeden ÖNCE yakalıyoruz.
    if (initialized) return;

    const cloudStatus = window.RaporCloudSync?.getStatus?.();
    if (cloudStatus && !cloudStatus.signedIn) {
      if (!authListenerRegistered) {
        authListenerRegistered = true;
        window.RaporCloudSync.onAuthChange(() => {
          if (window.RaporCloudSync?.getStatus?.().signedIn) init();
        });
      }
      return;
    }
    initialized = true;

    const preExistingUpdatedAt = state.reportId ? state.updatedAt : null;
    ensureActiveReportId();
    const localKnownUpdatedAt = preExistingUpdatedAt || state.updatedAt;

    flushActiveToLibrary();
    injectLibraryButton();
    window.RaporCloudSync?.setActiveReportId(state.reportId, { localKnownUpdatedAt });
    window.RaporCloudSync?.onAuthChange(refreshAccountStrip);
    maybeAutoShowDashboardOnFreshSession();
  }

  // Test/teşhis için dışa açılan yüzey.
  window.RaporReportLibrary = {
    readIndex,
    flushActiveToLibrary,
    openReportById,
    createNewReport,
    cloneReport,
    toggleArchive,
    toggleStatus,
    deleteReport,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
