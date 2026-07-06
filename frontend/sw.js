/* ==========================================================================
   sw.js — Service Worker for Bazar-Trace
   ========================================================================== */

const CACHE_NAME = 'bazar-trace-cache-v1';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/base.css',
  '/css/components.css',
  '/css/layout.css',
  '/css/pages/products.css',
  '/css/pages/transactions.css',
  '/css/pages/dashboard.css',
  '/js/app.js',
  '/js/router/router.js',
  '/js/store/auth.store.js',
  '/js/api/client.js',
  '/js/api/auth.api.js',
  '/js/api/products.api.js',
  '/js/api/transactions.api.js',
  '/js/api/analytics.api.js',
  '/js/components/bottom-nav.js',
  '/js/components/toast.js',
  '/js/components/loader.js',
  '/js/db/idb.js',
  '/js/sync/sync-manager.js',
  '/js/utils/uuid.js',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
];

// 1. Install Event: Cache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching App Shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Interception
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // We only intercept requests to our own site or our API
  if (url.origin !== self.location.origin) {
    return;
  }

  // Do NOT intercept POST/PATCH/DELETE mutations (handled in client API layer)
  if (e.request.method !== 'GET') {
    return;
  }

  // API requests strategy: Network First, falling back to cache
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          // If valid response, clone and cache it
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: search cache
          return caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Throw custom error matching our fetch wrapper catch criteria
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'OFFLINE', message: 'You are offline and no cache is available' }
              }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // App shell assets strategy: Stale-While-Revalidate (load fast from cache, fetch update in background)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Suppress network errors in background fetching when offline
      });

      return cachedResponse || fetchPromise;
    })
  );
});
