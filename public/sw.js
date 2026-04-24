/**
 * Ultra-Fast Service Worker - Optimized for lightning-speed loading
 * UPDATED: 2026-04-23T03:15Z - Force Update v6
 * 
 * PWA UPDATE FIX: Aggressive updates to ensure users always get latest version
 * - skipWaiting() called immediately on install for instant activation
 * - Caches are version-stamped and aggressively purged
 * - Build time injected by Vite at build time
 */

// IMPORTANT: __BUILD_TIME__ is replaced with an ISO timestamp by the Vite
// sw-build-time-plugin at build time. In dev mode the literal string is used
// as the version (safe — SW is unregistered in dev anyway).
const SW_VERSION = '__BUILD_TIME__' === '__BUILD_TIME__' ? '2026-04-24T02-icon-fix' : '__BUILD_TIME__';
const CACHE_VERSION = `swipess-${SW_VERSION}`;
const CACHE_NAME = CACHE_VERSION;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// Critical assets to precache immediately for offline-first experience
const urlsToCache = [
  '/',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/**
 * TINDER-SPEED: Precache all JS/CSS chunks after install
 * Native apps have all code pre-downloaded. We simulate this by
 * crawling /assets/ and caching every chunk in the background.
 * This means second+ navigations load INSTANTLY from cache.
 */
async function precacheAppShell() {
  try {
    // Fetch the HTML page to discover all <script> and <link> tags
    const htmlResponse = await fetch('/', { cache: 'no-store' });
    const html = await htmlResponse.text();

    // Extract all /assets/*.js and /assets/*.css URLs from the HTML
    const assetUrls = [];
    const regex = /\/assets\/[a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+\.(js|css)/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      assetUrls.push(match[0]);
    }

    // Also extract modulepreload links
    const modulePreloadRegex = /href="(\/assets\/[^"]+)"/g;
    while ((match = modulePreloadRegex.exec(html)) !== null) {
      if (!assetUrls.includes(match[1])) {
        assetUrls.push(match[1]);
      }
    }

    if (assetUrls.length > 0) {
      const cache = await caches.open(STATIC_CACHE);
      // Cache them one at a time to avoid saturating the network
      for (const url of assetUrls) {
        try {
          const existing = await cache.match(url);
          if (!existing) {
            await cache.add(url);
          }
        } catch (_e) {
          // Individual asset failure is fine — skip and continue
        }
      }
    }
  } catch (_e) {
    // Non-critical — app works fine without precache
  }
}

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

// 🚀 ZENITH: Native Background Sync
// Allows the app to complete swipes or messages even if the user
// closes the app while offline.
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-swipes') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BACKGROUND_SYNC_COMPLETE', tag: event.tag });
        });
      })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-prefetch') {
    event.waitUntil(precacheAppShell());
  }
});

// ─── Push Notification Handlers ──────────────────────────────────

/**
 * Handles incoming push messages from the server (VAPID web push).
 * Works when the app is closed, in background, or in another tab.
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'Swipess', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Swipess';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/swipess-logo.png',
    badge: data.badge || '/icons/swipess-logo.png',
    vibrate: [100, 50, 100, 50, 100],
    tag: `swipess-${(data.data && data.data.type) || 'general'}-${Date.now()}`,
    requireInteraction: false,
    silent: false,
    data: Object.assign({ url: data.url || '/notifications' }, data.data || {}),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handles clicks on push notifications.
 * Opens or focuses the app and navigates to the relevant page.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/notifications';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window and post message to navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', url: targetUrl, data: notificationData });
            return client.focus();
          }
        }
        // No open window - open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Install / Fetch / Activate ──────────────────────────────────

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

  // CRITICAL: Never cache OAuth callback routes — must always hit the network
  if (url.pathname.startsWith('/~oauth')) return;

  // Network-first for Supabase API calls (always fetch fresh data)
  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // NETWORK-FIRST for HTML navigation requests (index.html)
  // This ensures that when you refresh, you actually get the LATEST code if online.
  // Stale-while-revalidate is BAD for updates because it serves the old code first.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      // SPEED OF LIGHT: Add a 5s race to the network fetch.
      // If the network hangs, we drop it and serve from the local cache immediately.
      Promise.race([
        fetch(request.url, { 
          cache: 'no-store',
          credentials: request.credentials
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 5000))
      ])
      .then(networkResponse => {
        // If we got a real response, update the cache and return it
        if (networkResponse && networkResponse.ok && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        // If network is down, serve the latest from cache
        try {
          const cache = await caches.open(DYNAMIC_CACHE);
          const cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;
          
          // Serve any available index.html as ultimate fallback
          const indexResponse = await caches.match('/index.html');
          if (indexResponse) return indexResponse;
        } catch (e) {
          console.error('[SW] Fallback error:', e);
        }
        
        // Final fail-safe: return a valid Response to avoid ERR_FAILED
        return new Response("Service Unavailable", { 
          status: 503, 
          statusText: "Service Unavailable", 
          headers: { 'Content-Type': 'text/plain' } 
        });
      })
    );
    return;
  }

  // CACHE-FIRST for hashed /assets/* files - immutable, never change
  // Vite outputs all JS/CSS chunks to /assets/ with content hashes in filenames.
  // Once cached, these are served INSTANTLY with zero network requests.
  // When a new build deploys, the hashes change → cache miss → fresh fetch.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse; // instant, no network
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
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
          const bgFetch = fetch(request).then(networkResponse => {
            if (networkResponse.ok && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // If network fails, return the cached version if we have it
            if (cachedResponse) return cachedResponse;
            // Otherwise return a tiny valid response to avoid crash
            return new Response('', { status: 404, statusText: 'Not Found' });
          });

          if (cachedResponse) {
            event.waitUntil(bgFetch); 
            return cachedResponse;
          }
          return bgFetch;
        });
      })
    );
    return;
  }

  // 🚀 SPEED OF LIGHT: Image Recompression / Optimization Interceptor
  // Automatically rewrite Supabase storage URLs to include optimal format/quality
  if (request.destination === 'image' && url.hostname.includes('supabase.co/storage')) {
    // Only optimize if transformation params aren't already present
    if (!url.searchParams.has('width') && !url.searchParams.has('format') && !url.searchParams.has('token')) {
      // Append default high-performance transformation parameters
      // format=avif (Supabase will fallback to webp/jpeg if needed)
      // width=720 (Optimal for high-density mobile card feeds)
      url.searchParams.set('format', 'avif');
      url.searchParams.set('quality', '75');
      url.searchParams.set('width', '720');
      
      const optimizedRequest = new Request(url.toString(), {
        headers: request.headers,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache,
        redirect: request.redirect,
        referrer: request.referrer,
        integrity: request.integrity
      });
      
      event.respondWith(
        caches.open(IMAGE_CACHE).then(cache => {
          return cache.match(optimizedRequest).then(cachedResponse => {
            const bgFetch = fetch(optimizedRequest).then(networkResponse => {
              if (networkResponse.ok && networkResponse.status === 200) {
                cache.put(optimizedRequest, networkResponse.clone());
              }
              return networkResponse;
            }).catch(() => {
              if (cachedResponse) return cachedResponse;
              return new Response('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', { 
                status: 200, 
                headers: { 'Content-Type': 'image/gif' } 
              });
            });

            if (cachedResponse) {
              event.waitUntil(bgFetch);
              return cachedResponse;
            }
            return bgFetch;
          });
        })
      );
      return;
    }
  }

  // STALE-WHILE-REVALIDATE for images - instant display, update in background
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const bgFetch = fetch(request).then(networkResponse => {
            if (networkResponse.ok && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            if (cachedResponse) return cachedResponse;
            // Ultimate fallback for images (transparent pixel)
            return new Response('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', { 
              status: 200, 
              headers: { 'Content-Type': 'image/gif' } 
            });
          });

          if (cachedResponse) {
            event.waitUntil(bgFetch);
            return cachedResponse;
          }
          return bgFetch;
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
          if (networkResponse.ok && networkResponse.status === 200) {
            const cloned = networkResponse.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, cloned);
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
        if (response.ok && response.status === 200) {
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
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match current version
            const isCurrentCache = cacheName === STATIC_CACHE ||
                                   cacheName === DYNAMIC_CACHE ||
                                   cacheName === IMAGE_CACHE;

            if (!isCurrentCache) {
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

  // Trigger app shell precaching in the background
  event.waitUntil(precacheAppShell());

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

  // TINDER-SPEED: Precache all JS/CSS chunks in background after activation
  // This makes ALL lazy-loaded routes instant on subsequent navigations
  precacheAppShell();
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
  } catch (_e) {
    // Eviction error is non-critical — continue serving from cache
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
    }
  } catch (_e) {
    // Eviction error is non-critical — continue serving from cache
  }
}
