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
    body.style.setProperty('--backdrop-blur-intensity', '0px');
  } else {
    body.classList.add('hw-high', 'perf-ultra');
    body.style.setProperty('--backdrop-blur-intensity', '24px');
  }
})();

// 1. START AUTH CHECK BEFORE RENDERING (Parallel process)
const authPromise = supabase.auth.getSession()
  .then(res => res || { data: { session: null }, error: null })
  .catch(() => ({ data: { session: null }, error: null }));

// 2. RENDER REACT (Robust)
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement as HTMLElement);
  root.render(<App authPromise={authPromise} />);
}

// 3. DEFERRED INITIALIZATION (Quiet Background)
const deferredInit = (callback: () => void, timeout = 5000) => {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, timeout);
  }
};

// Secondary Tools: Pushed to 12s+ to ensure 0% main-thread noise during boot
deferredInit(async () => {
  try {
    const [
      { initPerformanceOptimizations },
      { initOfflineSync },
    ] = (await Promise.all([
      import("@/utils/performanceMonitor"),
      import("@/utils/offlineSwipeQueue"),
    ])) as any;
    initPerformanceOptimizations();
    initOfflineSync();
  } catch { /* intentional */ }
}, 12000);

// Native Plugins
deferredInit(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: "#000000" });
    }
  } catch { /* intentional */ }
<<<<<<< HEAD
}, 12000);

// Service Worker Registration
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch (_e) {
    return true;
  }
})();
const isPreviewHost =
  window.location.hostname.includes('id-preview--') ||
  window.location.hostname.includes('lovableproject.com');

if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV || isPreviewHost || isInIframe) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch(() => undefined);
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((reg) => {
          reg.update();
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.dispatchEvent(new CustomEvent('sw-controller-changed'));
          });
        })
        .catch(() => undefined);
    });
  }
}
=======
}, 15000);
>>>>>>> df25a7bb ( Performance Perfection & Heartbeat Branding: Optimized initial load, deferred heavy JS, and refined the flagship logo heartbeat animation.)
