// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST INITIAL RENDER - Decoupled rendering from Auth initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Import token/themes CSS before index.css so CSS vars are available for Tailwind
import "./styles/tokens.css";
import "./styles/matte-themes.css";
import "./styles/elevation-system.css";
import "./index.css";
import "./styles/pwa-performance.css";
// PERF: Defer non-critical CSS to reduce unused CSS on initial paint
import "./styles/responsive.css";
import { applyHardwareTierClasses } from "@/utils/hardwareTier";

applyHardwareTierClasses();

// 🚀 EMERGENCY RECOVERY: Handle Vite preload / missing chunk failures after deploy.
// STRICT: at most ONE automatic recovery per tab session. Multiple independent
// reloaders (lazyRetry + this + SW) used to thrash Chrome into a permanent loop.
let emergencyRecoveryLocked = false;
let emergencyMaxLogged = false;

const handleEmergencyRecovery = async (reason: string) => {
  // Coalesce burst of vite:preloadError events from many missing chunks
  if (emergencyRecoveryLocked) return;
  // NEVER execute web-centric reload recoveries on Native iOS/Android (Capacitor)
  // Native code doesn't load chunks from the web, so "missing chunk" errors
  // are false positives (usually native plugin network rejections) that cause
  // devastating reload loops.
  if (typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.()) return;

  const reloadCount = parseInt(sessionStorage.getItem('Swipess_emergency_reload_count') || '0', 10);

  if (reloadCount >= 1) {
    // Log once — not once per missing chunk (was flooding Safari console)
    if (!emergencyMaxLogged && import.meta.env.DEV) {
      emergencyMaxLogged = true;
      console.debug(`[Emergency] Already recovered once this session (${reason}).`);
    }
    return;
  }

  emergencyRecoveryLocked = true;
  if (import.meta.env.DEV) {
    console.warn(`[Emergency] ${reason} detected. One-time recovery…`);
  }
  sessionStorage.setItem('Swipess_emergency_reload_count', '1');
  sessionStorage.setItem('swipess_chunk_reload_once', '1'); // align with lazyWithRetry

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    localStorage.removeItem('Swipess_app_version');
    localStorage.removeItem('last-chunk-reload-time');

    const u = new URL(window.location.href);
    u.searchParams.delete('reset');
    u.searchParams.delete('clear-cache');
    u.searchParams.set('v', Date.now().toString());
    window.location.replace(u.toString());
  } catch (err) {
    emergencyRecoveryLocked = false;
    if (import.meta.env.DEV) console.error('[Emergency] Recovery failed:', err);
  }
};

// Successful boot after cache-buster → allow future recoveries next session only.
// (Counter stays for this session so we never thrash.)
window.addEventListener('vite:preloadError', () => {
  handleEmergencyRecovery('Vite preload error');
});

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'STALE_SHELL_RELOAD') {
      handleEmergencyRecovery('Stale app shell (chunk 404 from service worker)');
    }
  });
}

window.addEventListener('unhandledrejection', (event) => {
  const msg = String(event.reason?.message || event.reason || '');
  // Local storage / private mode noise
  if (msg.includes('storage.getItem') || msg.includes('localStorage')) {
    event.preventDefault();
    return;
  }
  // Dynamic import failures sometimes only surface as rejections
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(msg)
  ) {
    event.preventDefault();
    handleEmergencyRecovery('Dynamic import rejection');
    return;
  }
  if (import.meta.env.DEV) {
    console.error('[Global] Unhandled rejection:', msg);
  }
});

if (typeof window !== 'undefined') {
  // ONLY recover for our own dynamic-import failures — never for every <script>
  // (extensions / analytics / third-party used to trigger infinite reloads).
  window.addEventListener('error', (event: ErrorEvent) => {
    const msg = String(event.message || '');
    if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg)) {
      handleEmergencyRecovery('Dynamic import error');
    }
  });

  requestAnimationFrame(() => {
    import("./styles/PremiumShine.css");
    import("./styles/premium-polish.css");
  });
}
import { supabase } from "@/integrations/supabase/client";

const hostname = window.location.hostname;
// Native Capacitor serves from localhost — never treat it as a web preview
// host, so app launches skip the service-worker/cache inspection entirely.
const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();
const isPreviewHost = !isNativeApp && (import.meta.env.DEV
  || hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname.includes('id-preview--')
  || (typeof window !== 'undefined' && window.location.search.includes('preview=true')));
const PREVIEW_CACHE_RESET_KEY = 'Swipess-preview-cache-reset-v1';

// 1. START AUTH CHECK BEFORE RENDERING (Parallel process)
const authPromise = supabase.auth.getSession()
  .then(res => res || { data: { session: null }, error: null })
  .catch(() => ({ data: { session: null }, error: null }));

// 🚀 SWIPESS: ZERO-LATENCY HAPTIC PROTOCOL (Optimized)
const initHaptics = () => {
  document.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest('button, [role="button"], .interactive, .swipe-card');
    if (target && !target.hasAttribute('data-haptics-fired')) {
      target.setAttribute('data-haptics-fired', 'true');
      setTimeout(() => target.removeAttribute('data-haptics-fired'), 200);
      if ('vibrate' in navigator) {
        if (!('userActivation' in navigator) || (navigator as any).userActivation?.hasBeenActive) {
          try { navigator.vibrate(10); } catch { /* vibrate not supported */ }
        }
      }
    }
  }, { capture: true, passive: true });
};

async function resetPreviewRuntimeState() {
  if (!isPreviewHost) return false;

  const registrations = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const cacheKeys = 'caches' in window ? await caches.keys() : [];
  const SwipessDiscoveryCaches = cacheKeys.filter((key) => key.startsWith('Swipess-discovery-'));

  if (registrations.length === 0 && SwipessDiscoveryCaches.length === 0) {
    return false;
  }

  await Promise.allSettled(registrations.map((registration) => registration.unregister()));
  await Promise.allSettled(SwipessDiscoveryCaches.map((key) => caches.delete(key)));

  const alreadyReset = sessionStorage.getItem(PREVIEW_CACHE_RESET_KEY) === 'true';
  if (!alreadyReset) {
    sessionStorage.setItem(PREVIEW_CACHE_RESET_KEY, 'true');
    return true;
  }

  return false;
}

async function bootstrap() {
  // Clean cache-buster from URL if it succeeded
  if (typeof window !== 'undefined' && window.location.search.includes('v=')) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('v');
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch { /* empty */ }
  }

  // EMERGENCY RESET: ?reset=1 (or legacy ?clear-cache=1) wipes state to escape crash loops
  if (window.location.search.includes('reset=1') || window.location.search.includes('clear-cache=1')) {
    // Synchronous storage wipes can't hang — do them first, unconditionally.
    try {
      sessionStorage.clear();
      localStorage.removeItem('swipe-deck-store');
      localStorage.removeItem('swipe-deck-version');
      localStorage.removeItem('swipess_global_reload_count');
    } catch { /* empty */ }

    // Service-worker + Cache Storage cleanup CAN hang on some Android WebViews
    // (the promise never settles). If we awaited it directly, the recovery
    // redirect below would never run and the user would be stranded on the
    // boot splash at ?reset=1 — exactly the crash-loop this branch exists to
    // escape. Race the cleanup against a hard timeout so recovery ALWAYS
    // proceeds.
    const wipeRuntimeCaches = async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    };
    await Promise.race([
      wipeRuntimeCaches().catch(() => { /* best-effort */ }),
      new Promise<void>((resolve) => setTimeout(resolve, 2000)),
    ]);

    // Force cache bust on replace to completely bypass browser HTTP disk cache!
    const u = new URL(window.location.href);
    u.searchParams.delete('reset');
    u.searchParams.delete('clear-cache');
    u.searchParams.set('v', Date.now().toString());
    window.location.replace(u.toString());
    return;
  }

  const shouldReload = await resetPreviewRuntimeState();
  if (shouldReload) {
    const u = new URL(window.location.href);
    u.searchParams.delete('reset');
    u.searchParams.delete('clear-cache');
    u.searchParams.set('v', Date.now().toString());
    window.location.replace(u.toString());
    return;
  }

  if ((window as any).__ROOT_RENDERED__) return;
  (window as any).__ROOT_RENDERED__ = true;

  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = createRoot(rootElement as HTMLElement);
    root.render(<App authPromise={authPromise} />);
    // NOTE: We intentionally do NOT dispatch 'swipess-ready' here.
    // The splash should stay visible (with the breathing Swipess
    // wordmark) until the real layout shell mounts AND the window
    // 'load' event fires — index.html handles that handshake.
  }
}

void bootstrap();

// 🚀 Warm the in-memory image cache for swipe-card photos so the deck
// renders instantly. The <link rel="preload"> tags in index.html start
// the network fetch; this seeds the JS-side cache so the same Image()
// calls used by PokerCategoryCard hit a warm decode.
if (typeof window !== 'undefined') {
  // 🔥 Critical images only — 5 most-used category photos loaded immediately
  const CRITICAL_PHOTOS = [
    '/images/filters/property.jpg',
    '/images/filters/scooter.jpg',
    '/images/filters/bicycle.jpg',
    '/images/filters/workers.jpg',
    '/images/filters/all.jpg',
  ];
  // 🕐 Secondary photos — loaded after idle to avoid competing with first paint
  const DEFERRED_PHOTOS = [
    '/images/filters/radio.jpg',
    '/images/filters/resident_card.jpg',
    '/images/filters/owner_all_clients_tulum.png',
    '/images/filters/owner_buyers_card.jpg',
    '/images/filters/owner_renters_card.jpg',
    '/images/filters/owner_hire_card.jpg',
    '/images/filters/owner_lawyer_card.jpg',
    '/images/filters/owner_promote_card.jpg',
    '/images/filters/ai_listing_card.jpg',
    '/images/filters/property_jungle_villa.jpg',
    '/images/filters/property_loft_interior.jpg',
    '/images/filters/property_bamboo_dome.jpg',
    '/images/filters/buyers_tulum_sold.jpg',
    '/images/filters/workers_tulum_directory.jpg',
    '/images/filters/workers_tulum_team.jpg',
    '/images/filters/bicycle_beach_ride.jpg',
    '/images/filters/bicycle_coco_sunset.jpg',
  ];
  const warmImage = (src: string) => {
    const img = new Image();
    (img as any).fetchPriority = 'low';
    img.decoding = 'async';
    img.src = src;
  };
  // Critical images: load immediately after first paint
  requestAnimationFrame(() => {
    CRITICAL_PHOTOS.forEach(warmImage);
  });
  // Deferred: load after browser is fully idle
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => { DEFERRED_PHOTOS.forEach(warmImage); }, { timeout: 3000 });
  } else {
    setTimeout(() => { DEFERRED_PHOTOS.forEach(warmImage); }, 2000);
  }
}

// 3. DEFERRED INITIALIZATION (Quiet Background)
const deferredInit = (callback: () => void, timeout = 5000) => {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
};

// Secondary Tools: Pushed to idle to avoid main-thread noise during boot
deferredInit(async () => {
  try {
    initHaptics();

    // Register service worker with AGGRESSIVE update detection.
    // Never on native: Capacitor serves assets from local disk, so a SW only
    // adds cache-layer overhead and stale-chunk reload risk inside the app.
    if ('serviceWorker' in navigator && !isPreviewHost && !isNativeApp) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          // Check for updates once per hour + whenever the user comes back to the tab
          setInterval(() => reg.update(), 60 * 60 * 1000);
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) reg.update();
          });
          
          // If a new worker was waiting, skip waiting immediately
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          
          reg.onupdatefound = () => {
             const newWorker = reg.installing;
             if (newWorker) {
                 newWorker.onstatechange = () => {
                     if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                         // Content available - handled by useAutomaticUpdates.tsx
                         if (import.meta.env.DEV) console.debug('[SW] New content available');
                     }
                 };
             }
          };
        })
        .catch(() => {});

      // RELOAD CONTROL - when the new SW takes over, let the hook handle it
      navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (import.meta.env.DEV) console.debug('[SW] Controller changed');
      });
    }

    // Offline swipe queue — sync queued likes/dislikes when back online
    try {
      const { initOfflineSync } = await import('@/utils/offlineSwipeQueue');
      initOfflineSync();

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'BACKGROUND_SYNC_COMPLETE' && event.data?.tag === 'sync-swipes') {
          initOfflineSync();
        }
      });
    } catch { /* offline queue optional */ }
  } catch { /* intentional */ }
}, 5000);

// Native Plugins — immediate after first render
setTimeout(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      // overlay:true lets the web view extend under the status bar so the
      // app's own (black) background fills the notch strip. With overlay:false
      // the strip is a native bar that iOS paints with the window background
      // (it showed white). setBackgroundColor is Android-only, so overlay:true
      // + the black html background is the reliable iOS fix.
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch { /* intentional */ }
}, 500);


