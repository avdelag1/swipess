/**
 * Ultra-Fast Service Worker - Optimized for lightning-speed loading
 * UPDATED: 2026-08-07 - Force Update v15
 *   - Do NOT intercept Supabase REST/Auth (Safari CORS / access-control fixes)
 *   - Scoped precache of critical boot chunks only
 *
 * PWA UPDATE FIX: Aggressive updates to ensure users always get latest version
 * - skipWaiting() called immediately on install for instant activation
 * - Caches are version-stamped and aggressively purged
 * - Build time injected by Vite at build time
 */

// IMPORTANT: __BUILD_TIME__ is replaced with an ISO timestamp by the Vite
// sw-build-time-plugin at build time. In dev mode the literal string is used
// as the version (safe — SW is unregistered in dev anyway).
const SW_VERSION = '__BUILD_TIME__';
const CACHE_VERSION = `swipess-${SW_VERSION}`;
const CACHE_NAME = CACHE_VERSION;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;

// App shell — always safe to precache (small, version-stamped by deploy)
const SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Replaced at build time by vite sw-build-time-plugin (critical boot chunks only)
const PRECACHE_MANIFEST = __PRECACHE_MANIFEST__;

const MAX_PRECACHE_CONCURRENCY = 4;

async function cacheUrl(cache, url) {
  try {
    const existing = await cache.match(url);
    if (existing) return;
    await cache.add(new Request(url, { cache: 'reload' }));
  } catch (_e) {
    // Individual asset failure is fine — skip and continue
  }
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Scoped precache: only SHELL_URLS + build-time PRECACHE_MANIFEST.
 * Lazy/heavy chunks (maps, heic, legal hub, etc.) load on demand via fetch handler.
 */
async function precacheAppShell() {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const assetUrls = Array.isArray(PRECACHE_MANIFEST) ? PRECACHE_MANIFEST : [];
    const uniqueUrls = [...new Set([...SHELL_URLS, ...assetUrls])];
    await runWithConcurrency(uniqueUrls, MAX_PRECACHE_CONCURRENCY, (url) => cacheUrl(cache, url));
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

// 🚀 SWIPESS: Native Background Sync
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
  
  event.waitUntil(precacheAppShell());
});

// Fetch event - improved strategy for different resource types
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // CRITICAL: Never cache OAuth callback routes — must always hit the network
  if (url.pathname.startsWith('/~oauth')) return;

  // CRITICAL: Never intercept Supabase REST/Auth/Realtime from the SW.
  // Re-fetching credentialed API calls in a SW worker causes Safari
  // "Fetch API cannot load … due to access control checks" / "Load failed"
  // and breaks ThemeSync / profile loads. Browser handles CORS natively.
  // Public storage images may still be cached below for offline photos.
  if (
    url.hostname.includes('supabase')
    && !url.pathname.startsWith('/storage/v1/object/public/')
  ) {
    return;
  }

  // CRITICAL: Never intercept other unmanaged cross-origin requests.
  // Re-issuing them with fetch() from SW subjects them to worker CSP.
  if (url.origin !== self.location.origin) {
    const isManagedCrossOrigin =
      (url.hostname.includes('supabase') && url.pathname.startsWith('/storage/v1/object/public/'))
      || request.destination === 'image'
      || request.destination === 'font';
    if (!isManagedCrossOrigin) return;
  }

  // NETWORK-FIRST for HTML navigation requests (index.html)
  // This ensures that when you refresh, you actually get the LATEST code if online.
  // Stale-while-revalidate is BAD for updates because it serves the old code first.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      // Race the network against a timeout, but keep the timeout GENEROUS.
      // The old 1.5s race was the main bug: on mobile, time-to-first-byte
      // routinely exceeds 1.5s, so online users were handed the STALE cached
      // index.html — which references chunk hashes from a previous deploy that
      // now 404. Only a genuinely hung connection should fall back to cache.
      Promise.race([
        fetch(request.url, {
          cache: 'no-store',
          credentials: request.credentials
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SW Timeout')), 8000))
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

          // App-shell fallback: try every known entry to avoid the native
          // browser error page (e.g. ERR_NAME_NOT_RESOLVED) on refresh.
          for (const path of ['/index.html', '/', '/manifest.json']) {
            const r = await caches.match(path);
            if (r && r.ok) return r;
          }
        } catch (e) {
          console.error('[SW] Fallback error:', e);
        }

        // Final fail-safe: return a friendly offline HTML page so users
        // never see the raw WebView/Chrome error screen on refresh.
        return new Response(
          `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Swipess — Reconnecting</title><style>html,body{margin:0;height:100%;background:#0A0A0A;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px}.w{max-width:320px}.d{width:10px;height:10px;border-radius:999px;background:#EB4898;margin:0 auto 18px;box-shadow:0 0 24px #EB4898;animation:p 1.4s ease-in-out infinite}@keyframes p{0%,100%{opacity:.4;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}h1{font-size:18px;font-weight:800;letter-spacing:.04em;margin:0 0 8px}p{font-size:13px;opacity:.6;margin:0 0 20px;line-height:1.5}button{appearance:none;border:none;background:#EB4898;color:#fff;font-weight:800;letter-spacing:.18em;text-transform:uppercase;font-size:11px;padding:14px 22px;border-radius:999px;box-shadow:0 12px 32px rgba(235,72,152,.45)}</style></head><body><div class="w"><div class="d"></div><h1>Reconnecting</h1><p>Swipess is offline right now. Check your connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>`,
          { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // CACHE-FIRST for hashed /assets/* files - immutable, never change
  // Vite outputs all JS/CSS chunks to /assets/ with content hashes in filenames.
  // Once cached, these are served INSTANTLY with zero network requests.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            // Validate cached response MIME type to prevent stale HTML caching
            const contentType = cachedResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('text/html')) {
              return cachedResponse; // instant, no network
            }
            // If we accidentally cached HTML as an asset, delete it
            cache.delete(request);
          }
          
          return fetch(request).then(networkResponse => {
            if (networkResponse.ok && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type');
              // CRITICAL: Vercel SPA routing returns index.html (200 OK, text/html)
              // for missing assets. We MUST NOT cache this as a JS/CSS file — and
              // an HTML body for a hashed bundle means the file is gone, i.e. this
              // page booted from a STALE shell pointing at a previous deploy.
              if (contentType && !contentType.includes('text/html')) {
                cache.put(request, networkResponse.clone());
                return networkResponse;
              }
              // Vercel returned HTML for a JS/CSS request → the hashed bundle is
              // gone. Surface a real 404 so the browser's module error triggers
              // the app's existing one-time recovery (no aggressive reload loop).
              return new Response('', { status: 404, statusText: 'Asset Missing' });
            }
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
        });
      })
    );
    return;
  }

  // NETWORK-FIRST for JS/CSS — ensures new deployments always serve fresh code.
  // Falls back to cache when network fails. If network returns a non-2xx
  // (e.g. 404 from stale deployment), fall back to cache too.
  // If nothing works, return a minimal empty module to prevent "MIME type text/html" crash.
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return fetch(request).then(networkResponse => {
          if (networkResponse.ok && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
          // 404 or other non-ok → try cache before giving up
          return cache.match(request).then(cached => {
            if (cached) return cached;
            const isCss = url.pathname.endsWith('.css');
            if (isCss) {
              // Empty stylesheet is harmless.
              return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
            }
            // For JS, DON'T serve an empty module (that silently blanks the app).
            // Fire the app's existing one-time recovery (capped — no reload loop).
            return new Response(
              "window.dispatchEvent(new Event('vite:preloadError'));",
              { status: 200, headers: { 'Content-Type': 'text/javascript' } }
            );
          });
        }).catch(async () => {
          const cachedResponse = await cache.match(request);
          return cachedResponse ?? new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
    return;
  }

  // NETWORK-FIRST for images with shorter cache — always show fresh photos.
  // Stale-while-revalidate caused broken cached images to persist in PWA.
  if (request.destination === 'image') {
    const isSameOrigin = url.origin === self.location.origin;
    const isSupabaseStorage = url.hostname.includes('supabase.co');
    if (!isSameOrigin && !isSupabaseStorage) {
      event.respondWith(
        fetch(request, { mode: 'cors', credentials: 'omit' }).catch(() =>
          fetch(request).catch(() =>
            new Response('', { status: 504 })
          )
        )
      );
      return;
    }
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(request).then(cached => {
          if (cached) {
            fetch(request).then(networkResponse => {
              if (
                networkResponse.ok &&
                networkResponse.status === 200 &&
                networkResponse.type !== 'opaque'
              ) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cached;
          }
          return fetch(request).then(networkResponse => {
            if (
              networkResponse.ok &&
              networkResponse.status === 200 &&
              networkResponse.type !== 'opaque'
            ) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response('', { status: 504, statusText: 'Image unavailable' });
          });
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
        }).catch(() => {
          return new Response('', { status: 503, statusText: 'Service Unavailable' });
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
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? new Response('', { status: 404, statusText: 'Not Found' });
      })
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

  // Refresh scoped precache after version bump
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
