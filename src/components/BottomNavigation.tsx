/**
 * BOTTOM NAVIGATION — 2026 Liquid Glass Design
 *
 * Full-width ergonomic bottom navigation with Liquid Glass treatment.
 *
 * UPGRADES FROM PREVIOUS VERSION:
 *   - The entire navigation bar is now a Liquid Glass surface with heavy
 *     backdrop blur (32px) and a bright top rim catch-light
 *   - Active item gets a floating glass pill (also Liquid Glass) with
 *     an animated liquid highlight — the pill "shines" to indicate focus
 *   - The active indicator dot was replaced by the pill glow
 *   - Entry animation: the bar slides up from below with spring physics
 *   - Tab press: individual button spring compression + ripple
 *   - The glass bar clearly shows blurred content behind it (no opaque bg)
 */

/* eslint-disable react-refresh/only-export-components */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Flame,
  MessageCircle,
  PartyPopper,
  PlusCircle,
  Radio,
  Scale as ScaleIcon,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHoverPrefetch, prefetchRoute } from '@/utils/routePrefetcher';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';
import { useGuidedTourActive } from '@/state/guidedTourStore';

const ICON_SIZE = 26;

const ICON_SIZE_TABLET = 28;
const TOUCH_TARGET = 34;
const TOUCH_TARGET_TABLET = 42;

interface BottomNavigationProps {
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
  onListingsClick?: () => void;
  userRole?: 'client' | 'owner' | 'admin';
  className?: string; // High-stability HUD support
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number;
  isCenter?: boolean;
  isSpecial?: boolean;
}

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────

export const TAP_SPRING = {
  type: 'spring' as const,
  stiffness: 1500, // HYPER-OVERCLOCKED
  damping: 20,
  mass: 0.15, // ALMOST WEIGHTLESS
};

export const BottomNavigation = memo(({
  onFilterClick,
  className,
}: BottomNavigationProps) => {
  const { navigate } = useAppNavigate();
  const location = useLocation();
  const setCategories = useFilterStore((s) => s.setCategories);
  const setModal = useModalStore((s) => s.setModal);
  const showAIListing = useModalStore((s) => s.showAIListing);
  const showAIChat = useModalStore((s) => s.showAIChat);
  const showVapId = useModalStore((s) => s.showVapId);
  const showTokensModal = useModalStore((s) => s.showTokensModal);
  const showFilters = useModalStore((s) => s.showFilters);
  const closeAll = useModalStore((s) => s.closeAll);
  const { isLight } = useAppTheme();

  // Always visible on every page — no chrome-reveal hiding
  const isActuallyVisible = true;
  // Theme rule:
  //  - Dark theme (black filter): nav icons always WHITE everywhere.
  //  - Light theme (white filter): BLACK everywhere, even on dashboard.


  const { t } = useTranslation();

  const prewarmAIChat = useCallback(() => {
    import('@/components/ConciergeChat').catch(() => {});
  }, []);

  const openAIChat = useCallback(() => {
    // While the guided tour is running, the Concierge launcher is reserved
    // as a tour highlight target only — tapping it must NOT open the chat
    // (that was crashing navigation). The tour itself explains it.
    if (useGuidedTourActive.getState().isActive) return;
    prewarmAIChat();
    setModal('showAIChat', true);
  }, [prewarmAIChat, setModal]);

  // Detect narrow screens for icon-only compact mode
  const [isNarrow, setIsNarrow] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  useEffect(() => {
    const check = () => {
      setIsNarrow(window.innerWidth < 360);
      setIsTablet(window.innerWidth >= 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);


  const openVapId = useCallback(() => setModal('showVapId', true), [setModal]);

  const navItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', icon: Zap, label: t('nav.dashboard'), path: '/client/dashboard' },
    { id: 'likes', icon: Flame, label: t('nav.likes'), path: '/client/liked-properties' },
    { id: 'ai', icon: Sparkles, label: t('nav.aiBot'), onClick: openAIChat, isSpecial: true },
    { id: 'add', icon: PlusCircle, label: t('nav.add', 'ADD'), path: '/owner/properties', isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
    { id: 'vapid', icon: ShieldCheck, label: t('nav.idCard', 'ID CARD'), onClick: openVapId },
    { id: 'radio', icon: Radio, label: t('nav.radio', 'RADIO'), path: '/radio' },
    { id: 'search', icon: SlidersHorizontal, label: t('nav.filter'), onClick: onFilterClick },
    { id: 'legal', icon: ScaleIcon, label: t('nav.legal'), path: '/client/legal-services' },
    { id: 'events', icon: PartyPopper, label: t('nav.events'), path: '/explore/events' },
  ], [t, openAIChat, openVapId, onFilterClick]);

  const scrollRef = useRef<HTMLDivElement>(null);


  // Auto-scroll active item into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      // INSTANT VIEW: No smooth scrolling for internal state sync, keep it technical and fast
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }
  }, [location.pathname]);

  const isDraggingRef = useRef(false);
  const touchState = useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchState.current) return;
    const dx = Math.abs(e.clientX - touchState.current.x);
    const dy = Math.abs(e.clientY - touchState.current.y);
    // Only a clear scroll/drag (not minor tap drift) should suppress the tap.
    if (dx > 24 || dy > 24) isDraggingRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    touchState.current = null;
  }, []);

  // Primary navigation handler — fires after pointer events, checks drag state
  const handleNavClick = useCallback(
    (item: NavItem, _event?: React.MouseEvent | React.PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }
      isDraggingRef.current = false;

      haptics.tap();

      if (item.path === location.pathname) {
        haptics.tap();
        // Tapping Dashboard while already on dashboard resets to category selection grid
        if (item.id === 'dashboard') {
          setCategories([]);
        }
        // Pressing the current page's nav item also closes any open overlays
        closeAll();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Close other overlays first so the destination is fully visible,
      // then perform the action. We do NOT toggle-close the same modal —
      // each tap on a modal nav item just (re)opens it.
      closeAll();
      if (item.onClick) {
        item.onClick();
      } else if (item.path) {
        navigate(item.path);
      }
    },
    [navigate, location.pathname, setCategories, closeAll],
  );

  const handleNavKeyDown = useCallback(
    (event: React.KeyboardEvent, item: NavItem) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      haptics.select();
      if (item.onClick) {
        item.onClick();
      } else if (item.path) {
        navigate(item.path!);
      }
    },
    [navigate],
  );

  const isActive = (item: NavItem) => {
    if (!item.path) return false;
    // Exact match OR startsWith for sub-routes (e.g. /client/dashboard/*)
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  // Modal items light up pink when their overlay is currently visible,
  // so the user always knows which popup is on screen.
  const isModalActive = (item: NavItem) => {
    switch (item.id) {
      case 'vapid': return showVapId;
      case 'ai': return showAIChat;
      case 'ai-listing': return showAIListing;
      case 'tokens': return showTokensModal;
      case 'search':
      case 'filters': return showFilters;
      default: return false;
    }
  };



  const isDashboard = location.pathname.includes('/dashboard');
  const useLightIcons = isDashboard || !isLight;
  const baseColor = useLightIcons ? '#FFFFFF' : '#0A0A0A';
  const activeGlow = useLightIcons
    ? 'drop-shadow(0 0 8px rgba(255,255,255,0.45))'
    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        'app-bottom-bar transition-all duration-150',
        isActuallyVisible ? 'translate-y-0 opacity-100' : 'opacity-0 translate-y-full',
        className
      )}
      style={{
        transitionTimingFunction: 'ease-out',
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingRight: 'max(0px, env(safe-area-inset-right))',
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
        viewTransitionName: 'swipess-bottom-nav',
      }}
    >
      {/* ── Solid Premium Bar ────────────────────────────────────────
          The bar sits lower and uses a strong, rich background to feel more premium. */}
      <div
        className={cn(
          "pointer-events-auto",
          "mx-auto w-full",
          "px-1 py-1",
          "rounded-t-[32px] border-t",
          isLight 
            ? "bg-white border-black/5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]" 
            : "bg-black border-white/10 shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Nav items row — SCROLLABLE SWIPESS ARCHITECTURE */}
        <div
          ref={scrollRef}
          data-no-swipe-nav
          data-scroll-axis="x"
          onPointerMove={handlePointerMove}
          className={cn(
            'relative flex items-center w-full gap-0.5 px-2 py-0.5 nav-scroll-hide transform-gpu select-none',
          )}
          style={{
            zIndex: 2,
            transform: 'translateZ(0)',
            overflowX: 'auto',
            scrollbarWidth: 'none' as const,
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            contentVisibility: 'auto',
            containIntrinsicSize: '60px',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'none',
            justifyContent: isTablet ? 'center' : 'flex-start',
            scrollBehavior: 'smooth',
            padding: '0 8px',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item) || isModalActive(item);

            return (
              <button
                key={item.id}
                id={item.id === 'ai-search' ? 'ai-search-button' : undefined}
                data-no-cinematic
                data-instant-feedback
                {...(item.path ? createHoverPrefetch(item.path) : {})}
                onPointerDown={(e) => {
                  if (item.path) prefetchRoute(item.path);
                  isDraggingRef.current = false;
                  touchState.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={(e) => handleNavClick(item, e)}
                onKeyDown={(e) => handleNavKeyDown(e, item)}

                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                data-active={active ? 'true' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 w-auto flex-shrink-0 h-full',
                  'touch-manipulation focus-visible:outline-none transform-gpu rounded-full',
                )}
                style={{
                  minWidth: isTablet ? '64px' : 'calc(100vw / 6.5)', // Let about 6.5 items fit on screen at once
                  minHeight: isTablet ? TOUCH_TARGET_TABLET : TOUCH_TARGET,
                  padding: isTablet ? '8px 14px' : (isNarrow ? '5px' : 'clamp(5px, 1.4vw, 10px)'),
                  cursor: 'pointer',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none' as any,
                  transition: 'none',
                }}
              >
                {/* Active state is color-only: no nested pill/frame behind icons. */}
                <div
                  className="relative z-10"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 140ms cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >

                  {/* Notification badge */}
                  <AnimatePresence mode="popLayout">
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="force-white absolute -top-1 -right-1 rounded-full min-w-[18px] h-[18px] z-20 flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#FF4D00,#EB4898)' }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Icon: brand-colored when active, muted when inactive.
                      No frame, no glow — just color. */}
                  <Icon
                    style={{
                      width: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 20 : ICON_SIZE),
                      height: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 20 : ICON_SIZE),
                      color: item.id === 'add' ? '#FF3366' : (active ? baseColor : (isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)')),
                      fill: 'none',
                      strokeWidth: active ? 2.0 : 1.4,
                      filter: item.id === 'add' ? 'drop-shadow(0 0 12px rgba(255,51,102,0.6))' : (active ? activeGlow : undefined),
                      transition: 'color 120ms ease-out, filter 120ms ease-out, stroke-width 120ms ease-out',
                    }}
                  />
                </div>
                {/* Label */}
                {!isNarrow && (
                  <div className="flex items-center justify-center w-full min-h-[14px] px-0.5">
                    <span
                      className={cn(
                        'tracking-wide relative font-black uppercase whitespace-nowrap',
                        isTablet ? 'text-[12px]' : 'text-[10px]',
                      )}
                      style={{
                        color: item.id === 'add' ? '#FF3366' : (active ? baseColor : (isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)')),
                        textShadow: item.id === 'add' ? '0 0 8px rgba(255,51,102,0.4)' : (active && isLight ? '0 0 4px rgba(0,0,0,0.1)' : undefined),
                        transition: 'color 120ms ease-out',
                        zIndex: 1,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG gradient defs for active icon */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="nav-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="var(--color-brand-accent)" offset="0%" />
            <stop stopColor="var(--color-brand-primary)" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
