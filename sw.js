const CACHE_NAME = 'cookie-monster-cache-v4';
const urlsToCache = [
  '.',
  'index.html',
  'glass.css',
  'app.js',
  'translations.js'
];


// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  // Force immediate activation
  self.skipWaiting();
});

// Serve cached content when offline, fetch when online
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached version or fetch from network
      return response || fetch(event.request).catch(() => {
        // If both cache and network fail, return offline page for HTML requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Clean up old caches and take control
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});
