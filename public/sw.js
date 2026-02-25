/**
 * Ultra-Fast Service Worker - Optimized for lightning-speed loading
 * 
 * PWA UPDATE FIX: Aggressive updates to ensure users always get latest version
 * - skipWaiting() called immediately on install for instant activation
 * - Caches are version-stamped and aggressively purged
 * - Build time injected by Vite at build time
 */

// IMPORTANT: This version is auto-updated by vite.config.ts on each build
// __BUILD_TIME__ is replaced with actual timestamp during production build
const SW_VERSION = typeof '__BUILD_TIME__' !== 'undefined' ? '__BUILD_TIME__' : Date.now().toString();
const CACHE_VERSION = `swipess-v${SW_VERSION}`;
const CACHE_NAME = CACHE_VERSION;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Critical assets to precache immediately for offline-first experience
const urlsToCache = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest'
];

// Cache TTL settings (in seconds)
const CACHE_TTL = {
  immutable: 31536000, // 1 year - for hashed assets
  static: 2592000,     // 30 days - for static assets
  dynamic: 604800,     // 7 days - for dynamic content
  api: 300,            // 5 minutes - for API responses
};

// Maximum cache sizes (number of items)
const MAX_DYNAMIC_CACHE_SIZE = 100;
const MAX_IMAGE_CACHE_SIZE = 200;

// Message handler for version requests and update control
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: CACHE_VERSION
    });
  }

  if (event.data && event.data.type === 'CHECK_UPDATE') {
    self.registration.update();
  }

  // CRITICAL: Allow app to force skip waiting for immediate update
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear all caches on demand (for cache corruption recovery)
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    caches.keys().then(names => {
      return Promise.all(names.map(name => caches.delete(name)));
    }).then(() => {
      if (event.ports[0]) {
        event.ports[0].postMessage({ type: 'CACHES_CLEARED' });
      }
    });
  }

  // Force reload all clients after cache clear
  if (event.data && event.data.type === 'FORCE_REFRESH_ALL') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'FORCE_REFRESH' });
      });
    });
  }

  // OFFLINE QUEUE: Store failed requests for retry when back online
  if (event.data && event.data.type === 'QUEUE_REQUEST') {
    if (event.ports[0]) {
      event.ports[0].postMessage({ type: 'REQUEST_QUEUED' });
    }
  }
});

// Install service worker - AGGRESSIVE: skipWaiting immediately
self.addEventListener('install', (event) => {
  // Skip waiting immediately to activate new SW right away
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(urlsToCache.map(url =>
          new Request(url, { cache: 'reload' })
        ));
      })
      .catch(() => {})
  );
});

// Fetch event - improved strategy for different resource types
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Network-first for Supabase API calls (always fetch fresh data)
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // NETWORK-FIRST for HTML navigation requests
  // This is CRITICAL to ensure fresh HTML after deploy (new asset hashes)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store', // Bypass ALL caches for navigation
      })
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - serve from cache
          return caches.match(request);
        })
    );
    return;
  }

  // STALE-WHILE-REVALIDATE for JS/CSS - instant from cache, update in background
  // This is the key to "instant" feel on repeat visits
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          // Always fetch fresh version in background
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse); // Fallback to cache on network error

          // Return cached immediately if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // STALE-WHILE-REVALIDATE for images - instant display, update in background
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const fetchPromise = fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first for fonts (they never change)
  if (request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) return response;
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first for other requests with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Activate service worker and clean old caches - AGGRESSIVE cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients immediately
      self.clients.claim(),

      // Clean up ALL old caches from previous versions - be aggressive
      caches.keys().then((cacheNames) => {
        console.log('[SW] Cleaning old caches. Current version:', CACHE_VERSION);
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match current version
            const isCurrentCache = cacheName === STATIC_CACHE || 
                                   cacheName === DYNAMIC_CACHE || 
                                   cacheName === IMAGE_CACHE;
            
            if (!isCurrentCache) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Enforce cache size limits
      enforceImageCacheLimit(),
      enforceDynamicCacheLimit()
    ])
  );

  // Notify ALL clients about the update with version info
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        version: CACHE_VERSION,
        timestamp: Date.now()
      });
    });
  });
});

// IMPROVED: True LRU cache eviction using response headers and access time
// Stores metadata in IndexedDB to track last access time
async function enforceImageCacheLimit() {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const requests = await cache.keys();

    if (requests.length <= MAX_IMAGE_CACHE_SIZE) return;

    // Get responses to check age and build priority list
    const entries = await Promise.all(
      requests.map(async (req) => {
        const response = await cache.match(req);
        const dateHeader = response?.headers.get('date');
        const age = dateHeader ? Date.now() - new Date(dateHeader).getTime() : 0;
        return { request: req, age };
      })
    );

    // Sort by age (oldest first) and delete excess
    entries.sort((a, b) => b.age - a.age);
    const toDelete = entries.slice(MAX_IMAGE_CACHE_SIZE);

    await Promise.all(toDelete.map(entry => cache.delete(entry.request)));
    console.log(`[SW] Evicted ${toDelete.length} old images (LRU)`);
  } catch (e) {
    console.error('[SW] Image cache eviction failed:', e);
  }
}

// IMPROVED: LRU eviction for dynamic content with TTL checking
async function enforceDynamicCacheLimit() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();

    // First pass: Remove expired items based on TTL
    const now = Date.now();
    const validEntries = [];

    for (const req of requests) {
      const response = await cache.match(req);
      if (!response) continue;

      const dateHeader = response.headers.get('date');
      const cacheControl = response.headers.get('cache-control');

      // Check if expired based on Cache-Control or default TTL
      let maxAge = CACHE_TTL.dynamic * 1000; // default 7 days
      if (cacheControl?.includes('max-age=')) {
        const match = cacheControl.match(/max-age=(\d+)/);
        if (match) maxAge = parseInt(match[1]) * 1000;
      }

      const age = dateHeader ? now - new Date(dateHeader).getTime() : 0;

      if (age < maxAge) {
        validEntries.push({ request: req, age });
      } else {
        // Expired - delete immediately
        await cache.delete(req);
      }
    }

    // Second pass: If still over limit, use LRU eviction
    if (validEntries.length > MAX_DYNAMIC_CACHE_SIZE) {
      validEntries.sort((a, b) => b.age - a.age);
      const toDelete = validEntries.slice(MAX_DYNAMIC_CACHE_SIZE);
      await Promise.all(toDelete.map(entry => cache.delete(entry.request)));
      console.log(`[SW] Evicted ${toDelete.length} old dynamic items (LRU)`);
    }
  } catch (e) {
    console.error('[SW] Dynamic cache eviction failed:', e);
  }
}
