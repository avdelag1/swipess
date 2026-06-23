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
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createHoverPrefetch, prefetchRoute } from '@/utils/routePrefetcher';
import { prefetchConciergeChatModule } from '@/utils/prefetchConciergeChat';
import { prefetchListingFlowModule } from '@/utils/prefetchListingFlow';
import { prefetchCommonModalsModule } from '@/utils/prefetchCommonModals';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';

import { broadcastSectionReset } from '@/utils/sectionNavigation';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { prefetchEventCategoryPhotosImmediate } from '@/utils/prefetchEventCategoryPhotos';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { getNavMotionId } from '@/lib/motion-constants';
import { getHeaderChrome, isDashboardPath } from '@/utils/headerChrome';
import { AIIcon } from '@/components/icons/AIIcon';

const ICON_SIZE = 26;

const ICON_SIZE_TABLET = 28;
const TOUCH_TARGET = 34;
const TOUCH_TARGET_TABLET = 42;

interface BottomNavigationProps {
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
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
  onAddListingClick,
  userRole = 'client',
  className,
}: BottomNavigationProps) => {
  const { navigate } = useAppNavigate();
  const location = useLocation();
  const setCategories = useFilterStore((s) => s.setCategories);
  const setModal = useModalStore((s) => s.setModal);
  const showAIListing = useModalStore((s) => s.showAIListing);
  const showCategoryDialog = useModalStore((s) => s.showCategoryDialog);
  const showAIChat = useModalStore((s) => s.showAIChat);
  const showVapId = useModalStore((s) => s.showVapId);
  const showTokensModal = useModalStore((s) => s.showTokensModal);
  const showFilters = useModalStore((s) => s.showFilters);
  const closeAll = useModalStore((s) => s.closeAll);
  const { isLight } = useAppTheme();

  // Always visible on every page — no chrome-reveal hiding
  const isActuallyVisible = true;
  const { t } = useTranslation();

  const openAIChat = useCallback(() => {
    useModalStore.getState().openAIChat();
  }, []);

  useEffect(() => {
    prefetchConciergeChatModule();
  }, []);

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


  const { unreadCount: unreadMessages } = useUnreadMessageCount();

  const openVapId = useCallback(() => setModal('showVapId', true), [setModal]);

  const openAddListing = useCallback(() => {
    prefetchListingFlowModule();
    if (userRole === 'owner' || userRole === 'admin') {
      if (onAddListingClick) onAddListingClick();
      else useModalStore.getState().openAddListing();
      return;
    }
    navigate('/owner/properties?add=1');
  }, [userRole, onAddListingClick, navigate]);

  const navItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', icon: Zap, label: t('nav.dashboard'), path: '/client/dashboard' },
    { id: 'likes', icon: Flame, label: t('nav.likes'), path: '/client/liked-properties' },
    { id: 'ai', icon: AIIcon, label: t('nav.aiBot', 'AI BOT'), onClick: openAIChat, isSpecial: true },
    { id: 'add', icon: PlusCircle, label: t('nav.add', 'ADD'), onClick: openAddListing, isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages', badge: unreadMessages || undefined },
    { id: 'vapid', icon: ShieldCheck, label: t('nav.idCard', 'ID CARD'), onClick: openVapId },
    { id: 'radio', icon: Radio, label: t('nav.radio', 'RADIO'), path: '/radio' },
    { id: 'search', icon: SlidersHorizontal, label: t('nav.filter'), onClick: onFilterClick },
    { id: 'legal', icon: ScaleIcon, label: t('nav.legal'), path: '/client/legal-services' },
    { id: 'events', icon: PartyPopper, label: t('nav.events'), path: EVENTS_FEED_PATH },
  ], [t, openAIChat, openVapId, onFilterClick, openAddListing, unreadMessages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);


  // Auto-scroll active item into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      // INSTANT VIEW: No smooth scrolling for internal state sync, keep it technical and fast
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }
  }, [location.pathname]);

  const pointerTravelRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    activePointerIdRef.current = e.pointerId;
    pointerOriginRef.current = { x: e.clientX, y: e.clientY };
    pointerTravelRef.current = 0;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId || !pointerOriginRef.current) return;
    const dx = e.clientX - pointerOriginRef.current.x;
    const dy = e.clientY - pointerOriginRef.current.y;
    pointerTravelRef.current = Math.max(pointerTravelRef.current, Math.hypot(dx, dy));
  }, []);

  const handlePointerUp = useCallback(() => {
    activePointerIdRef.current = null;
    pointerOriginRef.current = null;
  }, []);

  // Primary navigation handler — ignore only real drags on this button (dock scroll drifts included).
  const handleNavClick = useCallback(
    (item: NavItem, _event?: React.MouseEvent | React.PointerEvent) => {
      if (pointerTravelRef.current > 42) {
        pointerTravelRef.current = 0;
        return;
      }
      pointerTravelRef.current = 0;

      haptics.tap();

      // Re-tapping the nav button for the section you're already in returns you
      // to that section's home page — and resets any in-page sub-view (e.g. the
      // Legal hub's editor/signing screens) — so you don't have to tap back
      // several times to get back to where you started.
      const withinSection =
        !!item.path &&
        (location.pathname === item.path || location.pathname.startsWith(item.path + '/'));

      if (withinSection && item.path) {
        // Tapping Dashboard while already on dashboard resets to the category grid
        if (item.id === 'dashboard') {
          setCategories([]);
        }
        closeAll();
        broadcastSectionReset(item.path);
        if (location.pathname !== item.path) {
          navigate(item.path); // pop any deeper route back to the section home
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
      case 'add': return showAIListing || showCategoryDialog;
      case 'ai-listing': return showAIListing;
      case 'tokens': return showTokensModal;
      case 'search':
      case 'filters': return showFilters;
      default: return false;
    }
  };



  const isDashboard = isDashboardPath(location.pathname);
  const { useLightIcons, iconColor: baseColor, inactiveIconColor, iconShadow } = getHeaderChrome(
    isLight,
    isDashboard,
  );
  const activeGlow = useLightIcons
    ? 'drop-shadow(0 0 8px rgba(255,255,255,0.45))'
    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
  const inactiveGlow = useLightIcons
    ? 'drop-shadow(0 0 4px rgba(255,255,255,0.22))'
    : undefined;

  const getNavIconFilter = (itemId: string, active: boolean) => {
    if (itemId === 'add') {
      return `${iconShadow} drop-shadow(0 0 12px rgba(255,51,102,0.6))`;
    }
    if (!useLightIcons) {
      return active ? activeGlow : undefined;
    }
    return active ? `${iconShadow} ${activeGlow}` : `${iconShadow} ${inactiveGlow}`;
  };

  const getNavLabelShadow = (itemId: string, active: boolean) => {
    if (itemId === 'add') return '0 0 8px rgba(255,51,102,0.4)';
    if (!useLightIcons) return undefined;
    return active ? '0 0 6px rgba(255,255,255,0.35)' : '0 1px 3px rgba(0,0,0,0.35)';
  };
  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      data-skip-press-engine
      className={cn(
        'app-bottom-bar transition-all duration-150 w-full flex justify-center',
        isActuallyVisible ? 'translate-y-0 opacity-100' : 'opacity-0 translate-y-full',
        className
      )}
      style={{
        transitionTimingFunction: 'ease-out',
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingRight: 'max(0px, env(safe-area-inset-right))',
        viewTransitionName: 'swipess-bottom-nav',
      }}
    >
      {/* ── Solid Premium Bar ────────────────────────────────────────
          The bar sits lower and uses a strong, rich background to feel more premium. */}
      <div
        className={cn(
          "pointer-events-auto floating-dock-nav",
          "w-max max-w-[calc(100vw-24px)]",
          "px-1 py-1.5 border",
          isLight && !isDashboard
            ? "glass-light-surface border-black/20"
            : "glass-dark border-white/12",
        )}
      >
        {/* Nav items row — SCROLLABLE SWIPESS ARCHITECTURE */}
        <div
          ref={scrollRef}
          data-no-swipe-nav
          data-scroll-axis="x"
          onPointerMove={handlePointerMove}
          className={cn(
            // justify-start on phone (items scroll from the left); justify-center
            // on md+ so the buttons sit in the middle. CSS-media-query driven so
            // it never depends on JS resize timing.
            'relative flex items-center justify-start md:justify-center w-full gap-0.5 px-2 py-0.5 nav-scroll-hide transform-gpu select-none',
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
                data-skip-press-engine
                {...(item.path ? createHoverPrefetch(item.path) : {})}
                onPointerDown={(e) => {
                  setPressedId(item.id);
                  if (item.path) prefetchRoute(item.path);
                  if (item.id === 'events') prefetchEventCategoryPhotosImmediate();
                  if (item.id === 'ai') prefetchConciergeChatModule();
                  if (item.id === 'add') prefetchListingFlowModule();
                  if (item.id === 'search' || item.id === 'filters') prefetchCommonModalsModule();
                  handlePointerDown(e);
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={() => { setPressedId(null); handlePointerUp(); }}
                onPointerCancel={() => { setPressedId(null); handlePointerUp(); }}
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
                  <AnimatePresence>
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        key={`${item.id}-badge`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="force-white absolute -top-1 -right-1 rounded-full min-w-[18px] max-w-[28px] h-[18px] overflow-hidden z-20 flex items-center justify-center text-[11px] font-bold text-white shadow-sm px-1"
                        style={{ background: 'linear-gradient(135deg,#FF4D00,#EB4898)' }}
                      >
                        {item.badge > 99 ? '99+' : item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {(() => {
                    const motionId = getNavMotionId(item.id);
                    const iconEl = (
                      <Icon
                        style={{
                          width: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 20 : ICON_SIZE),
                          height: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 20 : ICON_SIZE),
                          color: item.id === 'add' ? '#FF3366' : (active ? baseColor : inactiveIconColor),
                          fill: 'none',
                          strokeWidth: active ? 2.0 : 1.4,
                          filter: getNavIconFilter(item.id, active),
                          transition: 'color 120ms ease-out, filter 120ms ease-out, stroke-width 120ms ease-out',
                        }}
                      />
                    );
                    if (!motionId) return iconEl;
                    return (
                      <MotionIcon
                        id={motionId}
                        active={pressedId === item.id}
                        loop={active}
                      >
                        {iconEl}
                      </MotionIcon>
                    );
                  })()}
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
                        color: item.id === 'add' ? '#FF3366' : (active ? baseColor : inactiveIconColor),
                        textShadow: getNavLabelShadow(item.id, active),
                        transition: 'color 120ms ease-out, text-shadow 120ms ease-out',
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
