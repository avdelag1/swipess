import { useState, useEffect, useRef, useCallback } from 'react';

export type ScrollDirection = 'up' | 'down' | 'none';

interface UseScrollDirectionOptions {
  /** Threshold in pixels before triggering direction change */
  threshold?: number;
  /** Whether to show the element at the very top of scroll */
  showAtTop?: boolean;
  /** Target element selector (defaults to document-level detection) */
  targetSelector?: string;
  /** Optional value that triggers a reset of visibility when changed (e.g. location.pathname) */
  resetTrigger?: any;
}

interface UseScrollDirectionReturn {
  /** Current scroll direction */
  scrollDirection: ScrollDirection;
  /** Whether the bottom bar should be visible */
  isVisible: boolean;
  /** Current scroll position */
  scrollY: number;
  /** Whether user is at the top of the page */
  isAtTop: boolean;
}

/**
 * Hook to detect scroll direction for hide/show navigation behavior
 * 
 * PERMANENT FIX: Uses document-level scroll capture with automatic rebind
 * to ensure it never stops working, even after navigation or DOM changes.
 * 
 * Strategy:
 * 1. Uses document-level capture phase listener (catches ALL scroll events)
 * 2. Dynamically detects the current scroll container each frame
 * 3. Auto-rebinds if the target element changes
 * 4. Uses refs to avoid effect dependency issues
 * 
 * Behavior:
 * - At top of page: Always visible
 * - Scrolling down: Hides the element
 * - Scrolling up: Shows the element
 */
export function useScrollDirection({
  threshold = 10,
  showAtTop = true,
  targetSelector,
  resetTrigger,
}: UseScrollDirectionOptions = {}): UseScrollDirectionReturn {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('none');
  const [isVisible, setIsVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);
  
  // Use refs to avoid effect dependencies that cause remounts
  const lastTriggerY = useRef(0);
  const ticking = useRef(false);
  const thresholdRef = useRef(threshold);
  const showAtTopRef = useRef(showAtTop);
  const targetSelectorRef = useRef(targetSelector);
  const currentTargetRef = useRef<Element | null>(null);
  
  // Update refs when props change
  thresholdRef.current = threshold;
  showAtTopRef.current = showAtTop;
  targetSelectorRef.current = targetSelector;

  // Find the active scroll container
  const findScrollContainer = useCallback((): Element | null => {
    const selector = targetSelectorRef.current;

    // Try the specified selector first, but only if it actually has
    // overflow to scroll. A specified target that is currently not the
    // active scroll container should yield to the fallback chain so
    // the hide/show animation tracks whatever the user is scrolling.
    if (selector) {
      const target = document.querySelector(selector);
      if (target && target.scrollHeight > target.clientHeight + 1) {
        return target;
      }
    }

    // Fallback chain for common scroll containers
    const fallbacks = [
      '#page-scroll-container',
      '#dashboard-scroll-container',
      '#chat-scroll-container',
      '#messages-scroll-container',
      'main[class*="overflow"]',
      '[id*="scroll-container"]',
      'main',
    ];

    for (const fallback of fallbacks) {
      const target = document.querySelector(fallback);
      if (target && target.scrollHeight > target.clientHeight + 1) {
        return target;
      }
    }

    return null;
  }, []);

  // Get current scroll position from the active container
  const getCurrentScrollY = useCallback((target: Element | null): number => {
    if (!target) {
      return window.pageYOffset || document.documentElement.scrollTop;
    }
    return target.scrollTop;
  }, []);

  useEffect(() => {
    let animationFrameId: number | null = null;
    currentTargetRef.current = null; // Clear cache so container is re-found on resetTrigger change

    // Cache the scroll container — only re-find when resetTrigger changes
    const findCachedContainer = (): Element | null => {
      if (!currentTargetRef.current) {
        currentTargetRef.current = findScrollContainer();
      }
      return currentTargetRef.current;
    };
    
    // Main scroll handler - runs on every scroll event
    const handleScroll = (_event: Event) => {
      // Only process if not already processing
      if (ticking.current) return;
      
      ticking.current = true;
      
      // Use requestAnimationFrame for performance
      animationFrameId = requestAnimationFrame(() => {
        // Use cached container — no DOM query per frame
        const target = findCachedContainer();
        
        const currentScrollY = getCurrentScrollY(target);
        const diffFromTrigger = currentScrollY - lastTriggerY.current;
        
        // Update scroll position state
        setScrollY(currentScrollY);
        setIsAtTop(currentScrollY <= 5);

        // At top - always visible + reset baseline
        if (showAtTopRef.current && currentScrollY <= 5) {
          setIsVisible(true);
          setScrollDirection('none');
          lastTriggerY.current = currentScrollY;
          ticking.current = false;
          return;
        }

        // Check if we've scrolled past threshold since last trigger
        if (Math.abs(diffFromTrigger) >= thresholdRef.current) {
          if (diffFromTrigger > 0) {
            // Scrolling DOWN - hide
            setScrollDirection('down');
            setIsVisible(false);
          } else {
            // Scrolling UP - show
            setScrollDirection('up');
            setIsVisible(true);
          }
          // Update baseline when a trigger happens
          lastTriggerY.current = currentScrollY;
        }

        // Handle scroll snapping/momentum jumps
        if (Math.abs(diffFromTrigger) > 5000) {
          lastTriggerY.current = currentScrollY;
        }
        
        ticking.current = false;
      });
    };

    // DOCUMENT-LEVEL CAPTURE: Catches ALL scroll events in the capture phase
    // This ensures we catch scrolls in any container, not just the target
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    // The container is rebound when `resetTrigger` (route pathname) changes
    // because that's when the React tree actually swaps it. The previous
    // 1Hz polling fired forever in the background and forced a DOM query
    // every second — pure waste on every device.


    // Initialize scroll position (uses cached container)
    const initialTarget = findCachedContainer();
    const initialScrollY = getCurrentScrollY(initialTarget);
    lastTriggerY.current = initialScrollY;
    setScrollY(initialScrollY);
    setIsAtTop(initialScrollY <= 5);
    
    // Always start visible at top
    if (initialScrollY <= 5) {
      setIsVisible(true);
    }
    
    return () => {
      document.removeEventListener('scroll', handleScroll, { capture: true });

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [findScrollContainer, getCurrentScrollY, resetTrigger]);

  return {
    scrollDirection,
    isVisible,
    scrollY,
    isAtTop,
  };
}


