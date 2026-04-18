// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST INITIAL RENDER - Decoupled rendering from Auth initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
// PERF: Defer non-critical CSS to reduce unused CSS on initial paint (~84 KiB saved total)
// responsive.css = desktop grids, print styles, sidebar nav
// PremiumShine.css = subscription card glow effects
// premium-polish.css = heavy animations
// matte-themes.css = alternate color themes
// pwa-performance.css = hardware overrides
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    import("./styles/responsive.css");
    import("./styles/PremiumShine.css");
    import("./styles/premium-polish.css");
    import("./styles/matte-themes.css");
    import("./styles/pwa-performance.css");
  });
}
import { supabase } from "@/integrations/supabase/client";

const hostname = window.location.hostname;
const isPreviewHost = import.meta.env.DEV
  || hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname.includes('lovableproject.com')
  || hostname.includes('id-preview--');
const PREVIEW_CACHE_RESET_KEY = 'swipess-preview-cache-reset-v1';

// 1. START AUTH CHECK BEFORE RENDERING (Parallel process)
const authPromise = supabase.auth.getSession()
  .then(res => res || { data: { session: null }, error: null })
  .catch(() => ({ data: { session: null }, error: null }));

// 🚀 ZENITH: ZERO-LATENCY HAPTIC PROTOCOL (Optimized)
const initHaptics = () => {
  document.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest('button, [role="button"], .interactive, .swipe-card');
    if (target && !target.hasAttribute('data-haptics-fired')) {
      target.setAttribute('data-haptics-fired', 'true');
      setTimeout(() => target.removeAttribute('data-haptics-fired'), 200);
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, { capture: true, passive: true });
};

async function resetPreviewRuntimeState() {
  if (!isPreviewHost) return false;

  const registrations = 'serviceWorker' in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];
  const cacheKeys = 'caches' in window ? await caches.keys() : [];
  const swipessCaches = cacheKeys.filter((key) => key.startsWith('swipess-'));

  if (registrations.length === 0 && swipessCaches.length === 0) {
    return false;
  }

  await Promise.allSettled(registrations.map((registration) => registration.unregister()));
  await Promise.allSettled(swipessCaches.map((key) => caches.delete(key)));

  const alreadyReset = sessionStorage.getItem(PREVIEW_CACHE_RESET_KEY) === 'true';
  if (!alreadyReset) {
    sessionStorage.setItem(PREVIEW_CACHE_RESET_KEY, 'true');
    return true;
  }

  return false;
}

async function bootstrap() {
  const shouldReload = await resetPreviewRuntimeState();
  if (shouldReload) {
    window.location.reload();
    return;
  }

  // PERF: Yield to browser UI thread to paint the splash screen immediately!
  // This drastically improves FCP times by letting the initial HTML display first
  // before the main thread is blocked by React hydration.
  await new Promise(resolve => setTimeout(resolve, 10));

  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = createRoot(rootElement as HTMLElement);
    root.render(<App authPromise={authPromise} />);
  }
}

void bootstrap();

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
    const body = document.body;
    body.classList.add('hw-high', 'perf-ultra');
    initHaptics();

    // Register service worker with AGGRESSIVE update detection
    if ('serviceWorker' in navigator && !isPreviewHost) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          // Check for updates every 10 seconds while the app is active
          setInterval(() => reg.update(), 10000);
          
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
                         console.log('[SW] New content available');
                     }
                 };
             }
          };
        })
        .catch(() => {});

      // RELOAD CONTROL - when the new SW takes over, let the hook handle it
      navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed');
      });
    }
  } catch { /* intentional */ }
}, 5000);

// Native Plugins — immediate after first render
setTimeout(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch { /* intentional */ }
}, 500);
