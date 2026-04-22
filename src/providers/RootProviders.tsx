import React, { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { VisualThemeProvider } from "@/contexts/VisualThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useForceUpdateOnVersionChange } from "@/hooks/useAutomaticUpdates";
import { useProfileAutoSync, useEnsureSpecializedProfile } from "@/hooks/useProfileAutoSync";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
// PERF: Lazy-load ZenithPrewarmer — its deps (routePrefetcher, performance) are heavy
// It only activates after auth resolves, so no need in critical boot path
const ZenithPrewarmer = lazy(() => import("@/components/ZenithPrewarmer").then(m => ({ default: m.ZenithPrewarmer })));

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
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createIDBPersister();

function LifecycleHooks({ children }: { children: React.ReactNode }) {
  useNotifications();
  usePushNotifications();
  useForceUpdateOnVersionChange();
  useProfileAutoSync();
  useEnsureSpecializedProfile();
  return <>{children}</>;
}

function AuthReadySignal() {
  const { initialized } = useAuth();

  useEffect(() => {
    // 🚀 SPEED OF LIGHT: Force splash removal after 800ms regardless of Auth status
    // This ensures the user sees the "Searching" UI immediately while Auth hydrates.
    const safetyTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('app-rendered'));
    }, 800);

    if (initialized) {
      (window as any).__APP_INITIALIZED__ = true;
      (window as any).__APP_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('app-rendered'));
      clearTimeout(safetyTimer);
    }
    return () => clearTimeout(safetyTimer);
  }, [initialized]);

  return null;
}

function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Reduce initial quiet period to 500ms for faster background hydration
    const timer = setTimeout(() => setActive(true), 500);
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
  const content = React.useMemo(() => children, [children]);

  return (
    <ConnectionGuard>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1.5' }}
      >
        <LazyMotion features={domAnimation}>
          <WarpPrefetcher />
          <VisualThemeProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AuthProvider authPromise={authPromise}>
                <AuthReadySignal />
                <Suspense fallback={null}>
                  <ZenithPrewarmer />
                </Suspense>
                <ActiveModeProvider>
                  <ThemeProvider>
                    <PWAProvider>
                      <RadioProvider>
                        <ResponsiveProvider>
                          <AppLifecycleManager>
                            {content}
                          </AppLifecycleManager>
                        </ResponsiveProvider>
                      </RadioProvider>
                    </PWAProvider>
                  </ThemeProvider>
                </ActiveModeProvider>
              </AuthProvider>
            </BrowserRouter>
          </VisualThemeProvider>
        </LazyMotion>
      </PersistQueryClientProvider>
    </ConnectionGuard>
  );
}


