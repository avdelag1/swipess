// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST INITIAL RENDER - Quita el loader apenas carga la página
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const initialLoader = document.getElementById("initial-loader");
if (initialLoader) {
  initialLoader.remove();
  document.documentElement.style.overflow = '';
  document.documentElement.style.position = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
}

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";
import "./styles/PremiumShine.css";

import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { logger } from "@/utils/prodLogger";

// Arranca la app normalmente
// NOTE: StrictMode REMOVED intentionally for production-like performance
// StrictMode double-mounts components causing: dashboard flicker, duplicate fetches,
// delayed UI completion, subscription thrash. Preview must match production behavior.
const root = createRoot(document.getElementById("root")!);
root.render(
  <ErrorBoundaryWrapper>
    <App />
  </ErrorBoundaryWrapper>,
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEFERRED INITIALIZATION - Todo lo pesado se carga DESPUÉS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const deferredInit = (callback: () => void, timeout = 3000) => {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
};

// SPEED OF LIGHT: Do NOT prefetch routes on startup
// Route prefetching now happens inside DashboardLayout ONLY after first paint
// via requestIdleCallback. This ensures initial render is never blocked.

// Priority 2: Herramientas de rendimiento + Offline Sync
deferredInit(async () => {
  try {
    const [
      { logBundleSize },
      { setupUpdateChecker, checkAppVersion },
      { initPerformanceOptimizations },
      { initWebVitalsMonitoring },
      { initOfflineSync },
    ] = await Promise.all([
      import("@/utils/performance"),
      import("@/utils/cacheManager"),
      import("@/utils/performanceMonitor"),
      import("@/utils/webVitals"),
      import("@/utils/offlineSwipeQueue"),
    ]);
    logBundleSize();
    checkAppVersion();
    // Check for updates every 5 minutes (focus/online events still trigger immediately)
    setupUpdateChecker(300000);
    initPerformanceOptimizations();
    initWebVitalsMonitoring();
    initOfflineSync(); // PERF: Sync queued swipes when back online
  } catch {
    // Silently ignore - these are optional optimizations
  }
}, 2000); // Start earlier (2s instead of 3s)

// Priority 3: Configuración nativa (solo en app móvil)
deferredInit(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch {
    // Silently ignore - only applies to native mobile platforms
  }
}, 5000);

// Service Worker with AGGRESSIVE update handling for PWA
if ("serviceWorker" in navigator) {
  // In dev mode: unregister all service workers and clear all caches
  // so we never serve a stale/broken cached bundle during development
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
    caches.keys().then((keys) => {
      keys.forEach((k) => caches.delete(k));
    });
  }

  window.addEventListener("load", () => {
    if (import.meta.env.DEV) return; // Skip SW in dev mode

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: 'none' }) // Never use HTTP cache for SW
      .then((registration) => {
        logger.info('[SW] Registered successfully');

        // Check for updates immediately on registration
        registration.update();

        // Handle new SW waiting to activate
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            logger.info('[SW] New version installing...');
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                logger.info('[SW] New version installed');
                // If there's a waiting worker, it will auto-activate via skipWaiting()
                // The page will reload when controllerchange fires
              }
            });
          }
        });
      })
      .catch((err) => logger.error('[SW] Registration failed:', err));

    // Graceful update handling instead of forced reload
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      logger.info('[SW] New version active. App will update on next navigation or via Automatic Updates UI.');
      window.dispatchEvent(new CustomEvent('sw-controller-changed'));
    });

    // Listen for update messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SW_UPDATED') {
        window.dispatchEvent(new CustomEvent('sw-updated', { detail: event.data }));
      }
    });
  });
}
