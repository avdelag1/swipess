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

  const body = document.body;
  // 🚀 SPEED OF LIGHT: Force high-fidelity "sentient" UI for maximum "wow" factor
  body.classList.add('hw-high', 'perf-ultra');
  body.style.setProperty('--backdrop-blur-intensity', '24px');

  // 🚀 ZENITH: ZERO-LATENCY HAPTIC PROTOCOL
  // Triggers haptics on pointerdown (capture phase) to guarantee 
  // immediate physical feedback before React even starts a render cycle.
  document.addEventListener('pointerdown', (e) => {
    const target = (e.target as HTMLElement).closest('button, [role="button"], .interactive, .swipe-card');
    if (target && !target.hasAttribute('data-haptics-fired')) {
      target.setAttribute('data-haptics-fired', 'true');
      setTimeout(() => target.removeAttribute('data-haptics-fired'), 200);
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  }, { capture: true, passive: true });

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
}, 15000);
