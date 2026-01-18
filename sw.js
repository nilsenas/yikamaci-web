self.addEventListener('install', (e) => {
  console.log('[Service Worker] Kuruluyor...');
});

self.addEventListener('fetch', (e) => {
  console.log('[Service Worker] Veri çekiliyor: ' + e.request.url);
  e.respondWith(fetch(e.request));
});