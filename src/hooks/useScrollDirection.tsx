import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  /** Threshold in pixels before triggering direction change */
  threshold?: number;
  /** Whether to show the element at the very top of scroll */
  showAtTop?: boolean;
  /** Target element selector (defaults to document-level detection) */
  targetSelector?: string;
  /** Optional value that triggers a reset of visibility when changed (e.g. location.pathname) */
  resetTrigger?: unknown;
  /**
   * When set, all consumers with the same key share ONE scroll listener + visibility
   * state — keeps header, nav, and AI search/date/people/location perfectly in sync.
   */
  sharedKey?: string;
}

interface UseScrollDirectionReturn {
  scrollDirection: ScrollDirection;
  isVisible: boolean;
  scrollY: number;
  isAtTop: boolean;
}

type SharedChrome = {
  isVisible: boolean;
  scrollDirection: ScrollDirection;
  scrollY: number;
  isAtTop: boolean;
  listeners: Set<() => void>;
  attached: boolean;
  lastTriggerY: number;
  ticking: boolean;
  threshold: number;
  showAtTop: boolean;
  targetSelector?: string;
  currentTarget: Element | null;
  rafId: number | null;
};

const sharedMap = new Map<string, SharedChrome>();

function getOrCreateShared(key: string): SharedChrome {
  let s = sharedMap.get(key);
  if (!s) {
    s = {
      isVisible: true,
      scrollDirection: 'none',
      scrollY: 0,
      isAtTop: true,
      listeners: new Set(),
      attached: false,
      lastTriggerY: 0,
      ticking: false,
      threshold: 28,
      showAtTop: true,
      targetSelector: undefined,
      currentTarget: null,
      rafId: null,
    };
    sharedMap.set(key, s);
  }
  return s;
}

function findScrollContainer(selector?: string): Element | null {
  if (selector) {
    const target = document.querySelector(selector);
    if (target && target.scrollHeight > target.clientHeight + 1) return target;
  }
  const fallbacks = [
    '#dashboard-scroll-container',
    '.dashboard-scroll-target',
    '#page-scroll-container',
    '#chat-scroll-container',
    '#messages-scroll-container',
    'main[class*="overflow"]',
    '[id*="scroll-container"]',
    'main',
  ];
  for (const fallback of fallbacks) {
    const target = document.querySelector(fallback);
    if (target && target.scrollHeight > target.clientHeight + 1) return target;
  }
  return null;
}

function getScrollY(target: Element | null): number {
  if (!target) return window.pageYOffset || document.documentElement.scrollTop;
  return (target as HTMLElement).scrollTop;
}

function emitShared(s: SharedChrome) {
  s.listeners.forEach((l) => l());
}

function attachSharedListener(key: string) {
  const s = getOrCreateShared(key);
  if (s.attached) return;

  const handleScroll = () => {
    if (s.ticking) return;
    s.ticking = true;
    s.rafId = requestAnimationFrame(() => {
      if (!s.currentTarget) {
        s.currentTarget = findScrollContainer(s.targetSelector);
      }
      const currentScrollY = getScrollY(s.currentTarget);
      const diff = currentScrollY - s.lastTriggerY;
      s.scrollY = currentScrollY;
      s.isAtTop = currentScrollY <= 5;

      if (s.showAtTop && currentScrollY <= 5) {
        if (!s.isVisible || s.scrollDirection !== 'none') {
          s.isVisible = true;
          s.scrollDirection = 'none';
          emitShared(s);
        }
        s.lastTriggerY = currentScrollY;
        s.ticking = false;
        return;
      }

      if (Math.abs(diff) >= s.threshold) {
        const nextVisible = diff <= 0;
        const nextDir: ScrollDirection = diff > 0 ? 'down' : 'up';
        if (s.isVisible !== nextVisible || s.scrollDirection !== nextDir) {
          s.isVisible = nextVisible;
          s.scrollDirection = nextDir;
          emitShared(s);
        }
        s.lastTriggerY = currentScrollY;
      }

      if (Math.abs(diff) > 5000) s.lastTriggerY = currentScrollY;
      s.ticking = false;
    });
  };

  document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
  s.attached = true;

  // stash remover on the object for cleanup when last subscriber leaves
  (s as SharedChrome & { _remove?: () => void })._remove = () => {
    document.removeEventListener('scroll', handleScroll, { capture: true });
    if (s.rafId) cancelAnimationFrame(s.rafId);
    s.attached = false;
  };
}

function detachSharedIfEmpty(key: string) {
  const s = sharedMap.get(key);
  if (!s || s.listeners.size > 0) return;
  const rem = (s as SharedChrome & { _remove?: () => void })._remove;
  rem?.();
  sharedMap.delete(key);
}

/**
 * Shared dashboard chrome key — TopBar/BottomNav (via SwipessHud) + AI search cluster.
 */
export const DASHBOARD_CHROME_SCROLL_KEY = 'dashboard-chrome';

/**
 * Hook to detect scroll direction for hide/show navigation behavior.
 * Use `sharedKey` so header / nav / AI search / date / people / location stay choreographed.
 */
export function useScrollDirection({
  threshold = 10,
  showAtTop = true,
  targetSelector,
  resetTrigger,
  sharedKey,
}: UseScrollDirectionOptions = {}): UseScrollDirectionReturn {
  // ── Shared path (single listener, many subscribers) ─────────────────────
  const sharedStore = sharedKey ? getOrCreateShared(sharedKey) : null;

  const subscribeShared = useCallback(
    (cb: () => void) => {
      if (!sharedKey) return () => {};
      const s = getOrCreateShared(sharedKey);
      s.threshold = threshold;
      s.showAtTop = showAtTop;
      s.targetSelector = targetSelector;
      s.listeners.add(cb);
      attachSharedListener(sharedKey);
      return () => {
        s.listeners.delete(cb);
        detachSharedIfEmpty(sharedKey);
      };
    },
    [sharedKey, threshold, showAtTop, targetSelector],
  );

  const getSharedSnapshot = useCallback(() => {
    if (!sharedKey) return true;
    return getOrCreateShared(sharedKey).isVisible;
  }, [sharedKey]);

  const sharedVisible = useSyncExternalStore(
    sharedKey ? subscribeShared : () => () => {},
    sharedKey ? getSharedSnapshot : () => true,
    () => true,
  );

  // Reset shared baseline on route change
  useEffect(() => {
    if (!sharedKey) return;
    const s = getOrCreateShared(sharedKey);
    s.currentTarget = null;
    s.currentTarget = findScrollContainer(s.targetSelector);
    const y = getScrollY(s.currentTarget);
    s.lastTriggerY = y;
    s.scrollY = y;
    s.isAtTop = y <= 5;
    if (y <= 5 && !s.isVisible) {
      s.isVisible = true;
      s.scrollDirection = 'none';
      emitShared(s);
    }
  }, [sharedKey, resetTrigger, targetSelector]);

  // Local (non-shared) path — unchanged behavior for other screens
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  const lastTriggerY = useRef(0);
  const ticking = useRef(false);
  const thresholdRef = useRef(threshold);
  const showAtTopRef = useRef(showAtTop);
  const targetSelectorRef = useRef(targetSelector);
  const currentTargetRef = useRef<Element | null>(null);

  thresholdRef.current = threshold;
  showAtTopRef.current = showAtTop;
  targetSelectorRef.current = targetSelector;

  const findContainer = useCallback((): Element | null => {
    return findScrollContainer(targetSelectorRef.current);
  }, []);

  useEffect(() => {
    if (sharedKey) return; // shared path handles this

    let animationFrameId: number | null = null;
    currentTargetRef.current = null;

    const findCachedContainer = (): Element | null => {
      if (!currentTargetRef.current) {
        currentTargetRef.current = findContainer();
      }
      return currentTargetRef.current;
    };

    const handleScroll = (_event: Event) => {
      if (ticking.current) return;
      ticking.current = true;
      animationFrameId = requestAnimationFrame(() => {
        const target = findCachedContainer();
        const currentScrollY = getScrollY(target);
        const diffFromTrigger = currentScrollY - lastTriggerY.current;

        setScrollY(currentScrollY);
        setIsAtTop(currentScrollY <= 5);

        if (showAtTopRef.current && currentScrollY <= 5) {
          setIsVisible(true);
          setScrollDirection('none');
          lastTriggerY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        if (Math.abs(diffFromTrigger) >= thresholdRef.current) {
          if (diffFromTrigger > 0) {
            setScrollDirection('down');
            setIsVisible(false);
          } else {
            setScrollDirection('up');
            setIsVisible(true);
          }
          lastTriggerY.current = currentScrollY;
        }

        if (Math.abs(diffFromTrigger) > 5000) {
          lastTriggerY.current = currentScrollY;
        }
        ticking.current = false;
      });
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    const initialTarget = findCachedContainer();
    const initialScrollY = getScrollY(initialTarget);
    lastTriggerY.current = initialScrollY;
    setScrollY(initialScrollY);
    setIsAtTop(initialScrollY <= 5);
    if (initialScrollY <= 5) setIsVisible(true);

    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [findContainer, resetTrigger, sharedKey]);

  if (sharedKey && sharedStore) {
    return {
      scrollDirection: sharedStore.scrollDirection,
      isVisible: sharedVisible,
      scrollY: sharedStore.scrollY,
      isAtTop: sharedStore.isAtTop,
    };
  }

  return {
    scrollDirection,
    isVisible,
    scrollY,
    isAtTop,
  };
}
