# iOS PDF Yükleme Hatası — Çözüm Notları

> Tarih: 2026-06-21 · Cihaz: iPhone (iOS 26.5) · pdf.js v5.6.205

## 🎯 Problem
**Rapor Yazma Programı** (tek dosyalık web app, pdf.js + Tesseract) iPhone'da **her PDF yüklemesinde** `undefined is not a function` hatası veriyordu. Masaüstü tarayıcıda sorunsuz çalışıyordu.

---

## 🔍 Teşhis Süreci (ve yanlış dönüşler)

| Aşama | Bulgu |
|---|---|
| 1. İlk inceleme | Hata, `app.js`'teki yükleme `catch`'inde yakalanıp ekrana basılıyor. iOS Safari'nin "fonksiyon değil" ifadesi. |
| 2. "iOS 18" varsayımı | Anket cevabına göre eksik bir JS API'si sanıldı → `Promise.try` / `Uint8Array.fromBase64` polyfill'leri eklendi. **Yanlış teşhis.** |
| 3. Gerçek sürüm: **iOS 26.5** | En güncel sürüm; tüm modern API'ler zaten var. Eksik-API teorisi çürüdü. |
| 4. Cihazdan gerçek stack trace | Ekrana ayrıntılı hata + satır numarası bastıran geçici teşhis kodu eklendi. |

**Cihazdan gelen gerçek hata:**
```
TypeError: undefined is not a function (near '...t of e...')
getTextContent@.../pdf.local.js
readTakbisPdfRows@.../app.js:7772
```

---

## ✅ Asıl Kök Neden
**pdf.js v5.6**'nın `getTextContent()` metni bir **`ReadableStream`** üzerinden okuyor:
```js
for await (const x of this.streamTextContent(t)) { ... }
```
**Safari/iOS, `ReadableStream` üzerinde async iterasyonu (`for await…of`) hiçbir sürümde desteklemiyor** (iOS 26.5 dahil). `e[Symbol.asyncIterator]` `undefined` → çökme. Chrome desteklediği için masaüstü çalışıyordu. Her PDF okuması `getTextContent`'e gittiğinden **dört yükleme de** etkileniyordu.

---

## 🛠️ Çözüm
`index.html`'deki uyumluluk bloğuna **`ReadableStream.prototype[Symbol.asyncIterator]` / `.values()` polyfill'i** eklendi. (Masaüstünde native var, devreye girmez — `if (typeof ... !== "function")` korumalı.)

**Doğrulama (masaüstünde iOS koşulu taklit edilerek):**
- Native async iterator silindi → `getTextContent` **çöktü** (`e is not async iterable` = aynı kök neden)
- Polyfill devredeyken → `getTextContent` **çalıştı**, TAKBİS PDF okundu (3 sayfa, 81 öğe)

---

## 📂 İkinci Sorun: Adres Kodu PDF
- iOS'ta Adres PDF'i **sunucuda** okunuyor (`/api/pdf-text`, `shouldUsePdfTextOnlyMode()`).
- Test sırasında iPhone geçici statik test sunucusuna (`:4599`) bağlıydı — orada endpoint yok → hata.
- Gerçek `server.js` (`:5173`) endpoint'i var (`pdfplumber` ile metni çıkarıyor). Test edildi → çalışıyor.
- Düzeltme, canlı `:5173` sunucusunun servis ettiği klasöre de eklendi. `server.js` diski her istekte okuduğu için **yeniden başlatma gerekmedi.**

---

## 📊 Sonuç Durumu

| Yükleme | Durum |
|---|---|
| TAKBİS PDF | ✅ Okunuyor |
| EKB PDF | ✅ Okunuyor |
| Adres Kodu PDF | ✅ (`:5173` / `/api/pdf-text`) |
| İmar PDF | ✅ (taranmış/görsel olanlarda iOS "masaüstü" uyarısı — kasıtlı) |

**Test adresi (iPhone):** `http://192.168.1.107:5173/?v=fix`

---

## ⚠️ Kalıcılık Uyarısı
Çözüm `index.html` içindeki uyumluluk (polyfill) bloğunda. Şu **3 polyfill** kalıcı kalmalı:

1. **`ReadableStream.prototype[Symbol.asyncIterator]`** ← asıl düzeltme (iOS'ta PDF okuma)
2. `Promise.try`  (eski iOS 18.0–18.1 için ek güvence)
3. `Uint8Array.fromBase64`  (eski iOS < 18.4 için ek güvence)

Codex ile `index.html`'i **baştan ürettirirsen bu bloklar silinebilir** — kontrol et.

**Canlı klasör:** `C:\Users\90551\Documents\Codex\2026-05-11\files-mentioned-by-the-user-rapor\app`

---

## 🔧 Teknik Arka Plan
- **Worker durumu:** `pdf.worker.fake.js` `globalThis.pdfjsWorker`'ı kuruyor → pdf.js gerçek Web Worker yerine **ana thread'de "fake worker"** çalıştırıyor. Bu yüzden `index.html`'deki (ana thread) polyfiller pdf.js'i de kapsıyor.
- **Neden sürümden bağımsız:** ReadableScream async iterator eksiği bir sürüm açığı değil; Safari bu özelliği hiç eklemedi.
- **Test sunucuları:** `:4599` = geçici Python statik (`python -m http.server`), `:5173` = gerçek `server.js` (Node v24, `pdfplumber` ile `/api/pdf-text`).
