import React, { useState, useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryCache } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { RadioProvider } from "@/contexts/RadioContext";
import { ThemeSyncManager } from "@/components/ThemeSyncManager";
import { flushSync } from 'react-dom';
import { logger } from '@/utils/prodLogger';
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";

// ──────────────────────────────────────────────────────────────────────────────
// Unified Theme System (Inlined to prevent ReferenceError TDZ)
// ──────────────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'cheers' | 'red-matte' | 'amber-matte' | 'pure-black' | 'Swipess-style';

export interface ThemeToggleCoords {
  x: number;
  y: number;
}

export interface ThemeContextType {
  theme: Theme;
  isLight: boolean;
  isDark: boolean;
  setTheme: (theme: Theme, coords?: ThemeToggleCoords) => void;
}

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function useAppTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    if (import.meta.env.DEV) console.warn('[Theme] useAppTheme called outside ThemeProvider. Using fallback.');
    return {
      theme: 'dark',
      isLight: false,
      isDark: true,
      setTheme: () => {}
    };
  }
  return context;
}

const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'Swipess_theme_preference';

function normalizeTheme(raw: string | null | undefined): Theme {
  if (raw === 'light' || raw === 'white-matte') return 'light';
  if (raw === 'cheers') return 'cheers';
  if (raw === 'red-matte' || raw === 'red') return 'red-matte';
  if (raw === 'amber-matte' || raw === 'amber') return 'amber-matte';
  if (raw === 'pure-black') return 'pure-black';
  if (raw === 'Swipess-style' || raw === 'cyber' || raw === 'Swipess') return 'Swipess-style';
  if (raw === 'dark' || raw === 'black-matte' || raw === 'grey-matte') return 'dark';
  return 'dark';
}

const ALL_THEME_CLASSES = [
  'grey-matte', 'black-matte', 'white-matte', 'red-matte',
  'amber-matte', 'pure-black', 'cheers', 'dark', 'light',
  'amber', 'red', 'Swipess-style'
];

function applyThemeToDOM(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  if (root.classList.contains(theme) && (theme !== 'dark' || root.classList.contains('black-matte'))) return;
  root.style.colorScheme = (theme === 'light') ? 'light' : 'dark';
  root.classList.remove(...ALL_THEME_CLASSES, 'ivanna-style', 'ivana');
  root.classList.add(theme);
  if (theme === 'dark') root.classList.add('black-matte');
  else if (theme === 'light') root.classList.add('white-matte');
  else if (theme !== 'light') root.classList.add('dark');

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  let targetColor: string;
  if (theme === 'dark' || theme === 'pure-black' || theme === 'Swipess-style') targetColor = '#000000';
  else if (theme === 'cheers') targetColor = '#180800';
  else if (theme === 'red-matte') targetColor = '#2d0a0a';
  else if (theme === 'amber-matte') targetColor = '#1a1200';
  else targetColor = '#ffffff';
  meta.setAttribute('content', targetColor);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const cached = localStorage.getItem(STORAGE_KEY);
    return normalizeTheme(cached);
  });

  React.useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme, coords?: ThemeToggleCoords) => {
    const root = window.document.documentElement;
    root.style.setProperty('--theme-reveal-x', coords ? `${coords.x}px` : '50%');
    root.style.setProperty('--theme-reveal-y', coords ? `${coords.y}px` : '50%');
    const doc = document as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        flushSync(() => {
          applyThemeToDOM(newTheme);
          setThemeState(newTheme);
          localStorage.setItem(STORAGE_KEY, newTheme);
        });
      });
    } else {
      flushSync(() => {
        applyThemeToDOM(newTheme);
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
      });
    }
  }, []);

  const isLight = theme === 'light';
  const isDark = !isLight;
  const value = React.useMemo(() => ({ theme, isLight, isDark, setTheme }), [theme, isLight, isDark, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
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
    }, 400);

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
                    <ThemeSyncManager />
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


