const CACHE_NAME = 'magic-words-cache-v3';
const ASSETS = [
  'index.html',
  'styles.css',
  'particles.js',
  'app.js',
  'manifest.json',
  'assets/boy_front.png',
  'assets/boy_action.png',
  'assets/animal_cat.png',
  'assets/animal_dog.png',
  'assets/animal_rabbit.png',
  'assets/animal_dragon.png',
  'assets/animal_lion.png',
  'assets/animal_cow.png'
];

// Install Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Assets
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
