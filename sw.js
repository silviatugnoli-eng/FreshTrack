const CACHE = 'freshtrack-v1';
const ASSETS = [
  './freshtrack.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap'
];

// Installazione: mette in cache le risorse principali
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Attivazione: rimuove cache vecchie
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first per le risorse locali, network-first per le API esterne
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Per Tesseract.js e Google Fonts usa network con fallback cache
  if (url.hostname.includes('jsdelivr') || url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Per le risorse locali: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Notifiche push (per uso futuro)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'FreshTrack', body: 'Controlla le scadenze!' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png'
    })
  );
});
