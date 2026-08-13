// =====================================================================
// Rapor Fotoğrafları — istemci-taraflı (yerel) depolama (2026-08-13)
// =====================================================================
// Kullanıcı talebi: "ben görsellerin eklenmesini ve kullanılabilmesini
// istiyorum ancak bunlar kullanıcı cihazında kalmalı ve server a hiç
// gitmemeli KVKK kapsamı ve server maliyeti burada önemli" — bu modül
// server.js'e HİÇBİR ŞEKİLDE bağlanmaz, hiçbir fetch/XHR çağrısı YOKTUR.
// Fotoğraflar yalnızca bu tarayıcının IndexedDB'sinde saklanır ve yalnızca
// templates/emlakkatilim.docx export'una (docx-fill.js, yine tamamen
// istemci-taraflı) gömülür — bkz. handoff.md.
//
// localStorage YERİNE IndexedDB kullanılıyor: mevcut rapor state'i zaten
// tek bir localStorage anahtarında (~5-10 MB tarayıcı kotası) tutuluyor;
// fotoğrafları oraya eklemek raporun geri kalanını da bozma riski taşırdı
// (kota dolunca autosave sessizce başarısız olabilir). IndexedDB kotası
// çok daha büyük (genelde disk alanına bağlı, yüzlerce MB) ve rapor
// verisinden TAMAMEN AYRI bir mağazada durur.
//
// Her fotoğraf, kaydedilmeden ÖNCE bir <canvas> ile sıkıştırılır (uzun
// kenar en fazla 1600px, JPEG kalite 0.8) — telefon kamerası
// orijinallerinin (birkaç MB) IndexedDB'yi hızla şişirmesini önler.

(() => {
  "use strict";

  const DB_NAME = "rapor-report-photos-v1";
  const DB_VERSION = 1;
  const STORE_NAME = "photos";
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.8;

  // templates/emlakkatilim.docx'teki "8. Ekler" alt bölümlerinden yalnızca
  // gerçekten FOTOĞRAF olan ikisi (8.2/8.4/8.5 belge taraması/kroki gibi
  // farklı bir kapsam — kullanıcı talebiyle kapsam dışı bırakıldı).
  const PHOTO_CATEGORIES = [
    { key: "genel", label: "Fotoğraflar (8.1)", token: "FOTO_ALANI_1" },
    { key: "proje", label: "Proje Fotoğrafları (8.3)", token: "FOTO_ALANI_3" },
  ];

  function hasIndexedDb() {
    return typeof indexedDB !== "undefined";
  }

  let dbPromise = null;
  function openDb() {
    if (!hasIndexedDb()) return Promise.reject(new Error("Bu tarayıcıda yerel fotoğraf depolama (IndexedDB) desteklenmiyor."));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("reportId", "reportId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  function runTransaction(mode, work) {
    return openDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const store = tx.objectStore(STORE_NAME);
      let result;
      Promise.resolve(work(store))
        .then((value) => { result = value; })
        .catch((error) => { try { tx.abort(); } catch { /* zaten iptal edilmis olabilir */ } reject(error); });
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error("İşlem iptal edildi."));
    }));
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function compressImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type || "")) {
        reject(new Error("Yalnızca görsel dosyaları eklenebilir."));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (!width || !height) { reject(new Error("Görsel boyutu okunamadı.")); return; }
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) { reject(new Error("Görsel işlenemedi (canvas desteklenmiyor).")); return; }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Görsel sıkıştırılamadı."))),
          "image/jpeg",
          JPEG_QUALITY,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Görsel okunamadı.")); };
      img.src = url;
    });
  }

  function makePhotoId(reportId) {
    return `${reportId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  // files: FileList/File[] — her biri sıkıştırılıp ayrı bir kayıt olarak eklenir.
  async function addPhotos(reportId, files, category = PHOTO_CATEGORIES[0].key) {
    const list = Array.from(files || []);
    const added = [];
    for (const file of list) {
      // Sırayla işlenir (Promise.all DEĞİL) — çok sayıda büyük görsel aynı anda
      // canvas'a çizilirse tarayıcı sekmesi kilitlenebilir.
      // eslint-disable-next-line no-await-in-loop
      const blob = await compressImageFile(file).catch((error) => {
        console.warn(`Fotoğraf sıkıştırılamadı (${file.name}):`, error?.message || error);
        return null;
      });
      if (!blob) continue;
      const record = {
        id: makePhotoId(reportId),
        reportId,
        category,
        blob,
        caption: "",
        order: Date.now() + added.length,
        mimeType: blob.type || "image/jpeg",
        addedAt: new Date().toISOString(),
      };
      // eslint-disable-next-line no-await-in-loop
      await runTransaction("readwrite", (store) => requestToPromise(store.put(record)));
      added.push(record);
    }
    return added;
  }

  async function listPhotos(reportId) {
    if (!reportId) return [];
    const all = await runTransaction("readonly", (store) => (
      requestToPromise(store.index("reportId").getAll(IDBKeyRange.only(reportId)))
    )).catch(() => []);
    return all.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async function removePhoto(id) {
    if (!id) return;
    await runTransaction("readwrite", (store) => requestToPromise(store.delete(id)));
  }

  async function updatePhoto(id, patch) {
    if (!id || !patch) return null;
    return runTransaction("readwrite", async (store) => {
      const existing = await requestToPromise(store.get(id));
      if (!existing) return null;
      const next = { ...existing, ...patch };
      await requestToPromise(store.put(next));
      return next;
    });
  }

  async function reorderPhotos(orderedIds) {
    if (!Array.isArray(orderedIds) || !orderedIds.length) return;
    await runTransaction("readwrite", async (store) => {
      for (let i = 0; i < orderedIds.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const existing = await requestToPromise(store.get(orderedIds[i]));
        if (!existing) continue;
        // eslint-disable-next-line no-await-in-loop
        await requestToPromise(store.put({ ...existing, order: i }));
      }
    });
  }

  async function clearReportPhotos(reportId) {
    if (!reportId) return;
    const photos = await listPhotos(reportId);
    await runTransaction("readwrite", async (store) => {
      for (const photo of photos) {
        // eslint-disable-next-line no-await-in-loop
        await requestToPromise(store.delete(photo.id));
      }
    });
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      };
      reader.onerror = () => reject(reader.error || new Error("Görsel okunamadı."));
      reader.readAsDataURL(blob);
    });
  }

  // docx-fill.js'in embedPhotoGalleryAssets() fonksiyonuna verilecek formata
  // dönüştürür: { token, photos: [{ base64, mimeType, caption }] } — kategori
  // başına bir grup, boş kategoriler dahil edilmez (token şablonda dokunulmadan
  // kalır, "missing" olarak raporlanmaz — embedPhotoGalleryAssets bunu atlar).
  async function getPhotoGroupsForExport(reportId) {
    const photos = await listPhotos(reportId);
    const groups = [];
    for (const category of PHOTO_CATEGORIES) {
      const categoryPhotos = photos.filter((p) => p.category === category.key);
      if (!categoryPhotos.length) continue;
      const withBase64 = [];
      for (const photo of categoryPhotos) {
        // eslint-disable-next-line no-await-in-loop
        const base64 = await blobToBase64(photo.blob).catch(() => null);
        if (!base64) continue;
        withBase64.push({ base64, mimeType: photo.mimeType || "image/jpeg", caption: photo.caption || "" });
      }
      if (withBase64.length) groups.push({ token: category.token, photos: withBase64 });
    }
    return groups;
  }

  window.RaporReportPhotos = {
    PHOTO_CATEGORIES,
    addPhotos,
    listPhotos,
    removePhoto,
    updatePhoto,
    reorderPhotos,
    clearReportPhotos,
    getPhotoGroupsForExport,
    isSupported: hasIndexedDb,
  };
})();
