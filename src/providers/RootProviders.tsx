import React, { useState, useEffect } from "react";
import { QueryClient, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, domMax } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useForceUpdateOnVersionChange } from "@/hooks/useAutomaticUpdates";
import { useProfileAutoSync, useEnsureSpecializedProfile } from "@/hooks/useProfileAutoSync";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
import { ZenithPrewarmer } from "@/components/ZenithPrewarmer";
import { PredictiveBundleLoader } from "@/components/PredictiveBundleLoader";

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

// ──────────────────────────────────────────────────────────────────────────────
// Feature Wrappers (Consolidated for Cleanliness)
// ──────────────────────────────────────────────────────────────────────────────

function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  useNotifications();
  usePushNotifications();
  useForceUpdateOnVersionChange();
  useProfileAutoSync();
  useEnsureSpecializedProfile();
  
  // Signal initial mount perfection
  useEffect(() => {
    requestAnimationFrame(() => {
      (window as any).__APP_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('app-rendered'));
    });
  }, []);

  return <>{children}</>;
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

export function RootProviders({ children, authPromise }: RootProvidersProps) {
  const [SpeedInsights, setSpeedInsights] = useState<any>(null);

  useEffect(() => {
    const loadInsights = () => {
      import("@vercel/speed-insights/react").then(mod => setSpeedInsights(() => mod.SpeedInsights));
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => setTimeout(loadInsights, 5000));
    } else {
      setTimeout(loadInsights, 8000);
    }
  }, []);

  return (
    <ConnectionGuard>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1.4' }}
      >
        <LazyMotion features={domMax}>
          {SpeedInsights && <SpeedInsights />}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider authPromise={authPromise}>
              <ZenithPrewarmer />
              <PredictiveBundleLoader />
              <ActiveModeProvider>
                <ThemeProvider>
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
        </LazyMotion>
      </PersistQueryClientProvider>
    </ConnectionGuard>
  );
}
