const CACHE_NAME = 'dubon-cache-v1';
const urlsToCache = [
  '/',
  '/styles/globals.css',
  '/logod.png',
  // Ajoutez ici d'autres ressources à mettre en cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
}); 