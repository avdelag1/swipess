// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST INITIAL RENDER - Decoupled rendering from Auth initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/prodLogger";

(function() {
  // 🚀 SPEED OF LIGHT: Hardware & Network Awareness
  const memory = (navigator as any).deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const connection = (navigator as any).connection || {};
  
  const isLowEnd = memory < 4 || cores < 4;
  const isSlowNet = connection.saveData || (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType));
  
  const body = document.body;
  if (isLowEnd || isSlowNet) {
    body.classList.add('hw-low', 'perf-lite');
    if (isSlowNet) body.classList.add('net-slow');
    body.style.setProperty('--backdrop-blur-intensity', '0px');
  } else {
    body.classList.add('hw-high', 'perf-ultra');
    body.style.setProperty('--backdrop-blur-intensity', '32px');
  }
})();

// 1. START AUTH CHECK BEFORE RENDERING (Parallel process)
// We fire this immediately so it's happening while React chunks download.
// Ensure we always return a valid object structure even on failure to prevent destructuring crashes.
const authPromise = supabase.auth.getSession()
  .then(res => res || { data: { session: null }, error: null })
  .catch(() => ({ data: { session: null }, error: null }));


// 2. RENDER REACT IMMEDIATELY
// Do NOT wait for authPromise. The App/AuthProvider will handle the loading state.
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement as HTMLElement);

  // 🔥 ZENITH FIX: StrictMode ONLY in development
  // This removes the intentional double-mount / double-fetch in dev
  root.render(
    import.meta.env.DEV ? (
      <React.StrictMode>
        <App authPromise={authPromise} />
      </React.StrictMode>
    ) : (
      <App authPromise={authPromise} />
    )
  );
}

// 3. REMOVE SPLASH ONLY AFTER HYDRATION + FONTS READY
// We use a unified promise to ensure React is painted AND fonts are matched
// before the splash screen dissolves, eliminating 'Font-Wobble' (FOUT).
function dismissSplash() {
  const root = document.getElementById('root');
  if (root) root.classList.add('hydrated');
  const loader = document.getElementById('initial-loader');
  if (loader && !loader.classList.contains('dissolving')) {
    loader.classList.add('dissolving');
    setTimeout(() => {
      if (loader.parentNode) loader.remove();
    }, 450);
  }
}

// Safety net: never let the splash block the app for more than 8 seconds.
// Covers edge cases: React crash, font CDN timeout, missing app-rendered event.
const splashSafetyTimeout = setTimeout(dismissSplash, 8000);

Promise.all([
  new Promise(resolve => window.addEventListener('app-rendered', resolve, { once: true })),
  document.fonts.ready
]).then(() => {
  clearTimeout(splashSafetyTimeout);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dismissSplash();
    });
  });
});

// 4. DEFERRED INITIALIZATION (Background tasks)
const deferredInit = (callback: () => void, timeout = 3000) => {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
};

// Priority: Perf tools, Updates, Offline Sync
deferredInit(async () => {
  try {
    const [
      { logBundleSize },
      { checkAppVersion },
      { initPerformanceOptimizations },
      { initOfflineSync },
    ] = await Promise.all([
      import("@/utils/performance"),
      import("@/utils/cacheManager"),
      import("@/utils/performanceMonitor"),
      import("@/utils/offlineSwipeQueue"),
    ]);
    logBundleSize();
    checkAppVersion();
    initPerformanceOptimizations();
    initOfflineSync();
  } catch { }
}, 4000);

// Priority: Native Mobile Plugins
deferredInit(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch { }
}, 6000);

// Service Worker Registration
if ("serviceWorker" in navigator && !import.meta.env.DEV) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { updateViaCache: 'none' })
      .then((reg) => {
        reg.update();
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.dispatchEvent(new CustomEvent('sw-controller-changed'));
        });
      })
      .catch((err) => logger.error('[SW] Error:', err));
  });
}
