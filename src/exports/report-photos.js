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
// 2026-08-13 (2. tur): kullanıcı rakip bir programın ekran görüntülerini
// örnek gösterip kapsamı genişletti — 23 fotoğraf/belge TÜRÜ (kategori),
// her tür için tek satır lacivert zeminli başlık + fotoğraflar, 4 sayfa
// yerleşim şablonu (Yatay İkili/Dikey Tekli/Alt Alta İkili/6'lı Grid),
// fotoğrafın yatay/dikey olduğunun otomatik algılanması, TEK "Fotoğraf
// Ekle" düğmesi (kategori seç → dosya seç → yerleşim şablonu seç akışı).
// Seçilmeyen (fotoğrafsız) kategoriler çıktıda HİÇ görünmez.
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
// orijinallerinin (birkaç MB) IndexedDB'yi hızla şişirmesini önler. Aynı
// adımda gerçek piksel genişlik/yükseklik okunup "landscape"/"portrait"/
// "square" olarak sınıflandırılır (yerleşim önerisi ve hücre kırpma
// hesapları için kullanılır — bkz. docx-fill.js embedPhotoAppendix).

(() => {
  "use strict";

  const DB_NAME = "rapor-report-photos-v1";
  const DB_VERSION = 1;
  const STORE_NAME = "photos";
  const MAX_DIMENSION = 1600;
  const JPEG_QUALITY = 0.8;

  // templates/emlakkatilim.docx'teki "8. Ekler" bölümüne gömülen TEK
  // konsolide fotoğraf ekinin kategori listesi — kullanıcının gönderdiği
  // ekran görüntüsündeki sıra ile BİREBİR aynı. Yeni bir kategori
  // eklenirse yalnızca bu diziye eklenmesi yeterli (docx tarafında
  // değişiklik gerekmez — hepsi TEK {{FOTO_ALANI_1}} token'ına gömülür).
  const PHOTO_CATEGORIES = [
    { key: "kapak", label: "Kapak Fotoğrafı" },
    { key: "dis_mekan", label: "Dış Mekan" },
    { key: "ic_mekan", label: "İç Mekan" },
    { key: "yapi_ruhsati", label: "Yapı Ruhsatı" },
    { key: "yapi_kullanma_izin", label: "Yapı Kullanma İzin Belgesi" },
    { key: "yapi_kayit", label: "Yapı Kayıt Belgesi" },
    { key: "mimari_proje_belediye", label: "Mimari Proje - Belediye" },
    { key: "mimari_proje_tapu", label: "Mimari Proje - Tapu" },
    { key: "imar_durumu", label: "İmar Durumu" },
    { key: "kadastro_paftasi", label: "Kadastro Paftası" },
    { key: "tapu_senedi", label: "Tapu Senedi" },
    { key: "takbis_belgesi", label: "Takbis Belgesi" },
    { key: "konum_kroki", label: "Konum - Kroki" },
    { key: "konum_harita", label: "Konum - Harita" },
    { key: "emsal_harita", label: "Emsal - Harita" },
    { key: "adres_kodu", label: "Adres Kodu" },
    { key: "enerji_kimlik", label: "Enerji Kimlik Belgesi" },
    { key: "tutanaklar", label: "Tutanaklar" },
    { key: "mahkeme_evraklari", label: "Mahkeme Evrakları" },
    { key: "uzman_ozcekim", label: "Uzman Özçekim" },
    { key: "hesaplama_tablolari", label: "Hesaplama Tabloları" },
    { key: "finansal_tablolar", label: "Finansal Tablolar" },
    { key: "diger", label: "Diğer" },
  ];

  // "8. Ekler" içindeki TÜM kategoriler için TEK gömme noktası — 8.1
  // "Fotoğraflar" başlığı zaten bu amaca uygun genel bir başlık.
  const PHOTO_APPENDIX_TOKEN = "FOTO_ALANI_1";

  // 4 sayfa yerleşim şablonu (kullanıcının gönderdiği ekran görüntüsündeki
  // isim ve sırayla) — columns×rows, bir sayfaya kaç fotoğraf sığdığını
  // belirler. Kalan fotoğraflar sonraki sayfa(lar)a taşar.
  const LAYOUT_TEMPLATES = [
    { key: "horizontal_pair", label: "Yatay İkili Sayfa", columns: 2, rows: 1, orientation: "landscape" },
    { key: "vertical_single", label: "Dikey Tekli Sayfa", columns: 1, rows: 1, orientation: "portrait" },
    { key: "stacked_pair", label: "Alt Alta İkili Sayfa", columns: 1, rows: 2, orientation: "landscape" },
    { key: "grid_six", label: "6'lı Grid Sayfa", columns: 2, rows: 3, orientation: "any" },
  ];

  function getLayoutTemplate(key) {
    return LAYOUT_TEMPLATES.find((t) => t.key === key) || LAYOUT_TEMPLATES[0];
  }

  // Bir kategorideki fotoğrafların çoğunluğunun en-boy oranına göre en
  // uygun yerleşim şablonunu ÖNERİR (kullanıcı yine de istediğini
  // seçebilir — bu yalnızca varsayılan/öneri).
  function suggestLayoutForOrientations(orientations) {
    const landscapeCount = orientations.filter((o) => o === "landscape").length;
    const portraitCount = orientations.filter((o) => o === "portrait").length;
    if (portraitCount > landscapeCount) return "vertical_single";
    if (orientations.length >= 5) return "grid_six";
    if (orientations.length >= 3) return "horizontal_pair";
    return "stacked_pair";
  }

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

  function classifyOrientation(width, height) {
    if (!width || !height) return "landscape";
    const ratio = width / height;
    if (ratio > 1.15) return "landscape";
    if (ratio < 0.87) return "portrait";
    return "square";
  }

  // Dosyayı sıkıştırır (uzun kenar <= MAX_DIMENSION, JPEG q=0.8) ve gerçek
  // piksel boyutlarını/yönünü döner — bkz. dosya başı yorumu.
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
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        if (!naturalWidth || !naturalHeight) { reject(new Error("Görsel boyutu okunamadı.")); return; }
        let width = naturalWidth;
        let height = naturalHeight;
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
          (blob) => (blob ? resolve({ blob, width, height, orientation: classifyOrientation(naturalWidth, naturalHeight) }) : reject(new Error("Görsel sıkıştırılamadı."))),
          "image/jpeg",
          JPEG_QUALITY,
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Görsel okunamadı.")); };
      img.src = url;
    });
  }

  // Sıkıştırmadan ÖNCE, yalnızca yerleşim şablonu ÖNERİSİ için dosyaların
  // gerçek piksel yön (orientation) bilgisini hızlıca okur (canvas YOK,
  // yalnızca <img> naturalWidth/Height) — addPhotos()'un asıl sıkıştırma
  // adımını TEKRARLAMAZ, arayüzün "kaç sütun/satır" adımında varsayılan
  // önerisini (suggestLayoutForOrientations) hesaplamak için kullanılır.
  function peekOrientations(files) {
    const list = Array.from(files || []);
    return Promise.all(list.map((file) => new Promise((resolve) => {
      if (!file || !/^image\//.test(file.type || "")) { resolve("landscape"); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      const finish = (orientation) => { URL.revokeObjectURL(url); resolve(orientation); };
      img.onload = () => finish(classifyOrientation(img.naturalWidth || img.width, img.naturalHeight || img.height));
      img.onerror = () => finish("landscape");
      img.src = url;
    })));
  }

  function makePhotoId(reportId) {
    return `${reportId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  // files: FileList/File[] — hepsi AYNI kategori + AYNI yerleşim şablonu
  // (layoutKey) ile TEK bir "grup" (batchId) olarak eklenir; bu grup, o
  // kategorinin başlığı altında SEÇİLEN şemayla sayfalara dizilir.
  async function addPhotos(reportId, files, category, layoutKey) {
    const list = Array.from(files || []);
    const batchId = `${reportId}:batch:${Date.now()}`;
    const added = [];
    for (const file of list) {
      // Sırayla işlenir (Promise.all DEĞİL) — çok sayıda büyük görsel aynı anda
      // canvas'a çizilirse tarayıcı sekmesi kilitlenebilir.
      // eslint-disable-next-line no-await-in-loop
      const compressed = await compressImageFile(file).catch((error) => {
        console.warn(`Fotoğraf sıkıştırılamadı (${file.name}):`, error?.message || error);
        return null;
      });
      if (!compressed) continue;
      const record = {
        id: makePhotoId(reportId),
        reportId,
        category,
        layoutKey,
        batchId,
        width: compressed.width,
        height: compressed.height,
        orientation: compressed.orientation,
        blob: compressed.blob,
        caption: "",
        order: Date.now() + added.length,
        mimeType: compressed.blob.type || "image/jpeg",
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

  // docx-fill.js'in embedPhotoAppendix() fonksiyonuna verilecek formata
  // dönüştürür: TEK token ({{FOTO_ALANI_1}}) + kategori sırasına göre
  // sıralanmış, İÇİNDE FOTOĞRAF OLAN kategoriler (fotoğrafsız kategoriler
  // TAMAMEN atlanır — kullanıcı talebi: "seçilmeyen görseller ... başlık
  // olarak belirtilmesin"). Her kategori kendi içinde batch'lere (aynı
  // ekleme turunda seçilen yerleşim şablonuyla) bölünür.
  async function getPhotoAppendixForExport(reportId) {
    const photos = await listPhotos(reportId);
    if (!photos.length) return [];
    const categoryGroups = [];
    PHOTO_CATEGORIES.forEach((category) => {
      const categoryPhotos = photos.filter((p) => p.category === category.key);
      if (!categoryPhotos.length) return;
      const batchIds = [...new Set(categoryPhotos.map((p) => p.batchId))];
      categoryGroups.push({
        category: category.key,
        label: category.label,
        batches: batchIds.map((batchId) => {
          const batchPhotos = categoryPhotos.filter((p) => p.batchId === batchId);
          return {
            layoutKey: batchPhotos[0]?.layoutKey || LAYOUT_TEMPLATES[0].key,
            photos: batchPhotos,
          };
        }),
      });
    });
    // base64'e cevirme (agir islem) TEK SEFERDE, en sonda yapilir.
    const result = [];
    for (const group of categoryGroups) {
      const batches = [];
      for (const batch of group.batches) {
        const withBase64 = [];
        for (const photo of batch.photos) {
          // eslint-disable-next-line no-await-in-loop
          const base64 = await blobToBase64(photo.blob).catch(() => null);
          if (!base64) continue;
          withBase64.push({ base64, mimeType: photo.mimeType || "image/jpeg", caption: photo.caption || "", width: photo.width, height: photo.height, orientation: photo.orientation });
        }
        if (withBase64.length) batches.push({ layoutKey: batch.layoutKey, photos: withBase64 });
      }
      if (batches.length) result.push({ label: group.label, batches });
    }
    if (!result.length) return [];
    return [{ token: PHOTO_APPENDIX_TOKEN, categories: result }];
  }

  window.RaporReportPhotos = {
    PHOTO_CATEGORIES,
    LAYOUT_TEMPLATES,
    PHOTO_APPENDIX_TOKEN,
    getLayoutTemplate,
    suggestLayoutForOrientations,
    peekOrientations,
    addPhotos,
    listPhotos,
    removePhoto,
    updatePhoto,
    reorderPhotos,
    clearReportPhotos,
    getPhotoGroupsForExport: getPhotoAppendixForExport,
    isSupported: hasIndexedDb,
  };
})();
