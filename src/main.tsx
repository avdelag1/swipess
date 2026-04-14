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
    // Apply theme optimizations quietely
    const body = document.body;
    body.classList.add('hw-high', 'perf-ultra');
    body.style.setProperty('--backdrop-blur-intensity', '24px');
    initHaptics();

    const [
      { initPerformanceOptimizations },
      { initOfflineSync },
    ] = (await Promise.all([
      import("@/utils/performanceMonitor"),
      import("@/utils/offlineSwipeQueue"),
    ])) as any;
    initPerformanceOptimizations();
    initOfflineSync();

    // 🚀 ZENITH: SERVICE WORKER REGISTRATION
    // Register the elite sw.js for offline support, push notifications, and background sync.
    if ('serviceWorker' in navigator && !window.location.host.includes('localhost')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then(reg => {
            console.log('[PWA] Service Worker active:', reg.scope);
            // Check for updates every hour
            setInterval(() => reg.update(), 3600000);
          })
          .catch(err => console.error('[PWA] Registration failed:', err));
      });
    }
  } catch { /* intentional */ }
}, 12000);

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
