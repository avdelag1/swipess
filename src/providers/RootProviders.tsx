/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense, useEffect, useState } from "react";
import { keepPreviousData, QueryCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { BrowserRouter } from "react-router-dom";
import { domAnimation, LazyMotion } from "framer-motion";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { RadioProvider } from "@/contexts/RadioContext";
import { ThemeSyncManager } from "@/components/ThemeSyncManager";
import { logger } from '@/utils/prodLogger';
import { markAppRendered } from '@/utils/bootSplash';
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";

// ──────────────────────────────────────────────────────────────────────────────
// Theme System (Imported from separate context to avoid circular dependencies)
// ──────────────────────────────────────────────────────────────────────────────
import { type Theme, ThemeContext, type ThemeContextType, ThemeProvider, type ThemeToggleCoords, useAppTheme } from '@/contexts/ThemeContext';

export type { Theme, ThemeToggleCoords, ThemeContextType };
export { ThemeContext, ThemeProvider, useAppTheme };
import { VisualThemeProvider } from "@/contexts/VisualThemeContext";
import { GlobalThemeProvider } from "./GlobalThemeProvider";
import { CMSPreviewListener } from "@/components/CMSPreviewListener";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useForceUpdateOnVersionChange } from "@/hooks/useAutomaticUpdates";
import { useEnsureSpecializedProfile, useProfileAutoSync } from "@/hooks/useProfileAutoSync";
import { useReengagementNotifications } from "@/hooks/useReengagementNotifications";
import { useNativeKeyboard } from "@/hooks/useNativeKeyboard";
import { useAppBadge } from "@/hooks/useAppBadge";
import { Capacitor } from "@capacitor/core";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
import { registerAppShortcuts } from "@/hooks/useAppShortcuts";
import { PaymentOrchestrator } from "@/lib/iap/PaymentOrchestrator";
// PERF: Lazy-load SwipessPrewarmer — its deps (routePrefetcher, performance) are heavy
// It only activates after auth resolves, so no need in critical boot path
const SwipessPrewarmer = lazy(() => import("@/components/SwipessPrewarmer").then(m => ({ default: m.SwipessPrewarmer })));

// ──────────────────────────────────────────────────────────────────────────────
// Performance-First Query Client Configuration
// ──────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (import.meta.env.DEV) console.warn('[QueryCache] Uncaught query error:', error);
    }
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 1000 * 60 * 60 * 24,
      networkMode: 'offlineFirst',
      // Keep showing the last results while a query with a CHANGED key refetches
      // (filters, search, pagination) instead of flashing a loading state — the
      // list stays put and updates in place, which feels instant. Only affects
      // a mounted query whose key changes; navigating to a new page is unchanged.
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createIDBPersister();

// Native-only: drives the home-screen icon badge. Gated behind a component so
// its two unread-count queries + realtime subscriptions never run on web/PWA,
// where the badge does nothing.
function NativeAppBadge() {
  useAppBadge();
  return null;
}

function LifecycleHooks({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  useForceUpdateOnVersionChange();
  useProfileAutoSync();
  useEnsureSpecializedProfile();
  useReengagementNotifications();
  useNativeKeyboard();

  useEffect(() => {
    void PaymentOrchestrator.init();
  }, []);
  return (
    <>
      {Capacitor.isNativePlatform() && <NativeAppBadge />}
      {children}
    </>
  );
}

function AuthReadySignal() {
  useEffect(() => {
    // 🚀 SWIPESS ONE-RUN PROTOCOL:
    // We only remove the splash once:
    // 1. Auth is initialized
    // 2. The layout sends the 'swipess-ready' signal (meaning first paint happened)
    
    const handleReady = () => {
      if ((window as any).__APP_READY_FIRED__) return;
      logger.log('[BOOT] Received swipess-ready signal from layout shell.');
      markAppRendered();
    };

    // Safety net: force signal after 1 second if layout shell fails to mount
    const safetyTimer = setTimeout(handleReady, 1000);

    window.addEventListener('swipess-ready', handleReady);
    window.addEventListener('app-rendered-signal', handleReady);

    // If already initialized by a previous render, fire immediately
    if ((window as any).__APP_INITIALIZED__) {
      handleReady();
    }

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('swipess-ready', handleReady);
      window.removeEventListener('app-rendered-signal', handleReady);
    };
  }, []);

  return null;
}

function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Reduce initial quiet period to 100ms for faster background hydration
    const timer = setTimeout(() => setActive(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!active) return <>{children}</>;
  return <LifecycleHooks>{children}</LifecycleHooks>;
}

function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const { status, retryCount, retry } = useConnectionHealth();

  if (status === 'disconnected') {
    return <ConnectionErrorScreen status={status} retryCount={retryCount} onRetry={retry} />;
  }
  return <>{children}</>;
}

/**
 * Splash failsafe — mounted ABOVE <ConnectionGuard> so it always renders, even
 * when the guard short-circuits to the offline screen (which would otherwise
 * leave the boot splash covering the screen until the 6s "Something went wrong"
 * watchdog). Guarantees the splash fades once React has committed, in every
 * render branch. <AppLayout> still fires the real `swipess-ready` first on a
 * healthy boot — this only catches the cases where it can't.
 */
function BootSplashFailsafe() {
  useEffect(() => {
    // Fade as soon as the layout shell signals it painted...
    window.addEventListener('swipess-ready', markAppRendered);
    // ...otherwise force it well before the splash watchdog (6s) fires, so the
    // user sees real UI (e.g. the connection error screen) instead of the
    // generic "Something went wrong" recovery prompt.
    const timer = setTimeout(markAppRendered, 2500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('swipess-ready', markAppRendered);
    };
  }, []);
  return null;
}

// One-time native app icon shortcuts registration (long-press home icon actions)
function AppShortcutsRegistrar() {
  useEffect(() => {
    // Fire and forget; errors are logged inside the util
    void registerAppShortcuts();
  }, []);
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Unified Root Providers
// ──────────────────────────────────────────────────────────────────────────────

interface RootProvidersProps {
  children: React.ReactNode;
  authPromise?: Promise<any>;
}

function WarpPrefetcher() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__PREDICTED_ROLE) {
      import('@/utils/routePrefetcher').then(m => {
        m.prefetchRoleRoutes((window as any).__PREDICTED_ROLE);
      });
    }
  }, []);
  return null;
}

export function RootProviders({ children, authPromise }: RootProvidersProps) {
  return (
    <>
      <BootSplashFailsafe />
      <ConnectionGuard>
      <HelmetProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1.5' }}
        >
          <CMSPreviewListener />
          <LazyMotion features={domAnimation}>
            <WarpPrefetcher />
            <GlobalThemeProvider>
              <VisualThemeProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider authPromise={authPromise}>
                  <AuthReadySignal />
                  <Suspense fallback={null}>
                    <SwipessPrewarmer />
                  </Suspense>
                  <AppShortcutsRegistrar />
                  <ActiveModeProvider>
                    <ThemeProvider>
                      <ThemeSyncManager />
                      <PWAProvider>
                        <RadioProvider>
                          <ResponsiveProvider>
                            <AppLifecycleManager>
                              {children}
                            </AppLifecycleManager>
                          </ResponsiveProvider>
                        </RadioProvider>
                      </PWAProvider>
                    </ThemeProvider>
                  </ActiveModeProvider>
                </AuthProvider>
              </BrowserRouter>
              </VisualThemeProvider>
            </GlobalThemeProvider>
          </LazyMotion>
        </PersistQueryClientProvider>
      </HelmetProvider>
      </ConnectionGuard>
    </>
  );
}


