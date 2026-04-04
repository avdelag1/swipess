import React, { useState, useEffect } from "react";
import { QueryClient, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, domMax } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { VisualThemeProvider, useVisualTheme } from "@/contexts/VisualThemeContext";
import { AmbientMeshBackground } from "@/components/ui/AmbientMeshBackground";
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

function LifecycleHooks({ children }: { children: React.ReactNode }) {
  useNotifications();
  usePushNotifications();
  useForceUpdateOnVersionChange();
  useProfileAutoSync();
  useEnsureSpecializedProfile();
  return <>{children}</>;
}

function AppLifecycleManager({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // 🚀 ZENITH DELAY: Wait for TTI before firing heavy side-effect hooks
    const timer = setTimeout(() => setActive(true), 6000);
    // Signal initial mount perfection immediately
    const trigger = () => {
      (window as any).__APP_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('app-rendered'));
    };
    if (document.readyState === 'complete') trigger();
    else window.addEventListener('load', trigger, { once: true });
    return () => clearTimeout(timer);
  }, []);

  if (!active) return <>{children}</>;
  return <LifecycleHooks>{children}</LifecycleHooks>;
}

function SentientBackgroundLayer() {
  const { ambientColor } = useVisualTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 🌬️ QUIET BOOT: Wait for network silence
    const timer = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;
  return <AmbientMeshBackground color={ambientColor} intensity={0.12} speed={12} />;
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
    // 🏎️ QUIET BOOT: Wait until 5s after load to even think about insights
    const loadInsights = () => {
      import("@vercel/speed-insights/react").then(mod => setSpeedInsights(() => mod.SpeedInsights));
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(() => setTimeout(loadInsights, 8000));
    } else {
      setTimeout(loadInsights, 12000);
    }
  }, []);

  // Memoize children to prevent provider-re-render cascades
  const content = React.useMemo(() => children, [children]);

  return (
    <ConnectionGuard>
      <PersistQueryClientProvider 
        client={queryClient} 
        persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24, buster: 'v1.5' }}
      >
        <LazyMotion features={domMax}>
          {SpeedInsights && <SpeedInsights />}
          <VisualThemeProvider>
            <SentientBackgroundLayer />
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
