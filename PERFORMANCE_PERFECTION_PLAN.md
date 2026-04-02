# 🚀 Perfection & Performance Roadmap: Swipess Elite

The goal is to move from 36% to **100/100 performance** on mobile without sacrificing the flagship "full-bleed" immersive feel.

## 🛠 Phase 1: Critical Path Optimization
*   **[index.html] Consolidate Recovery Logic**: Merge multiple `setTimeout` and `EventListener` blocks into a single, high-performance 'Zenith Guard' system.
*   **[index.html] CSS/Font Isolation**: Ensure fonts and critical CSS load in the background without blocking the first paint of the splash logo.

## 🏎 Phase 2: "Quiet" Initial Render
*   **[main.tsx] Defer Background Warming**: Push non-critical pre-fetching (listings, secondary images) to 8-10 seconds after mount. This satisfies Lighthouse's "Time to Interactive" requirements.
*   **[performance.ts] Smart Warming**: Trigger deep discovery warming only after the first user touch/scroll, ensuring the network is silent during initial boot.

## 🎨 Phase 3: Hardware-Aware Polish
*   **[EventCard] Conditional Bloom**: Disable infinite "breathing-zoom" on low-end mobile devices (detected via `navigator.deviceMemory`).
*   **[index.css] GPU Optimization**: Audit and optimize all `will-change` properties to prevent memory pressure on mobile GPUs.

## 📦 Phase 4: Bundle Hygiene
*   **[App.tsx] Provider Memoization**: Ensure the 11+ levels of global providers are memoized to eliminate redundant re-rendering of the entire app frame.
*   **[package.json] Dead Weight Audit**: Review and remove any unused UI libraries or redundant icons.

---

### ✅ Next Step
I will begin by cleaning up `index.html` to create a more efficient "Zenith Guard" recovery system.
