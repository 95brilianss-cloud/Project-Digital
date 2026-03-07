const CACHE_NAME = 'turbine-logsheet-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './config.js',
  './app.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  
  // API calls - Network First
  if (request.url.includes('google.com')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  
  // Static assets - Cache First
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
