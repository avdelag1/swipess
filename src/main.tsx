// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAST INITIAL RENDER - Decoupled rendering from Auth initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/responsive.css";
import "./styles/PremiumShine.css";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/prodLogger";

// 1. START AUTH CHECK BEFORE RENDERING (Parallel process)
// We fire this immediately so it's happening while React chunks download.
const authPromise = supabase.auth.getSession().catch(() => ({ data: { session: null } }));

// 2. RENDER REACT IMMEDIATELY
// Do NOT wait for authPromise. The App/AuthProvider will handle the loading state.
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App authPromise={authPromise} />
    </React.StrictMode>
  );
}

// 3. REMOVE SPLASH ONLY AFTER HYDRATION
// We use a double RAF + a tiny delay to ensure the browser has painted the React tree.
window.addEventListener('app-rendered', () => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      // Signal hydration complete — triggers CSS transition on #root
      const root = document.getElementById('root');
      if (root) root.classList.add('hydrated');
      
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.2s ease-out';
        setTimeout(() => loader.remove(), 220);
      }
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
