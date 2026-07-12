// PWA service worker — Faz 3 (2026-07-09).
//
// AMAÇ: yalnızca iOS/Android'de "Ana Ekrana Ekle" ile kurulabilir bir uygulama
// olmak (bkz. cloud/FAZ0-TASARIM.md Faz 3). iOS'ta Safari sekmelerindeki
// localStorage/IndexedDB 7 gün etkileşimsizlikte silinebiliyor; Ana Ekrana
// eklenmiş bir PWA bu riske daha az tabidir.
//
// KASITLI OLARAK HİÇBİR ŞEY ÖNBELLEKLENMEZ. Bu proje sürüm sorgu dizeleriyle
// (?v=YYYYMMDD-HHMM) manuel taze dağıtım kullanıyor ve sunucu zaten
// no-store/no-cache başlıkları gönderiyor (bkz. server.js, tools/check-basic.js).
// Bir service worker önbelleği tam olarak çözülmeye çalışılan "eski sürüm
// görünüyor" sorununu geri getirir. Bu worker yalnızca tarayıcıların PWA
// "yüklenebilirlik" kriterini (fetch handler varlığı) karşılamak için var;
// her isteği ağdan olduğu gibi geçirir, davranışı SW yokmuş gibidir.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
