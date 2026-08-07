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
  Users,
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
import { useScrollDirection } from '@/hooks/useScrollDirection';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { useTranslation } from 'react-i18next';
import { isDashboardPath } from '@/utils/chromeStyles';

import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';

import { broadcastSectionReset } from '@/utils/sectionNavigation';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { prefetchEventCategoryPhotosImmediate } from '@/utils/prefetchEventCategoryPhotos';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { getNavMotionId } from '@/lib/motion-constants';
import { getBottomNavChrome } from '@/utils/chromeStyles';
import { AIIcon } from '@/components/icons/AIIcon';

const ICON_SIZE = 20;
const ICON_SIZE_TABLET = 24;
const _TOUCH_TARGET = 34;
const _TOUCH_TARGET_TABLET = 42;

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

  const { isVisible: isScrollVisible } = useScrollDirection({ threshold: 20 });

  const navItems: NavItem[] = useMemo(() => [
    { id: 'dashboard', icon: Zap, label: t('nav.dashboard'), path: '/client/dashboard' },
    { id: 'likes', icon: Flame, label: t('nav.likes'), path: '/client/liked-properties' },
    { id: 'ai', icon: AIIcon, label: t('nav.aiBot', 'AI BOT'), onClick: openAIChat, isSpecial: true },
    { id: 'add', icon: PlusCircle, label: t('nav.add', 'ADD'), onClick: openAddListing, isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages', badge: unreadMessages || undefined },
    { id: 'vapid', icon: ShieldCheck, label: t('nav.idCard', 'ID CARD'), onClick: openVapId },
    { id: 'seekers', icon: Users, label: t('nav.seekers', 'SEEKERS'), onClick: () => useModalStore.getState().setModal('showSeekerRequestDialog', true) },
    { id: 'search', icon: SlidersHorizontal, label: t('nav.filter'), onClick: onFilterClick },
    { id: 'legal', icon: ScaleIcon, label: t('nav.legal'), path: '/client/legal-services' },
    { id: 'events', icon: PartyPopper, label: t('nav.events'), path: EVENTS_FEED_PATH },
  ], [t, openAIChat, openVapId, onFilterClick, openAddListing, unreadMessages]);

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
  // Primary navigation handler
  const handleNavClick = useCallback(
    (item: NavItem, _event?: React.MouseEvent | React.PointerEvent) => {
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

  const _handleNavKeyDown = useCallback(
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
      case 'filters': return showFilters || location.pathname.includes('/filters');
      default: return false;
    }
  };



  const isDashboard = isDashboardPath(location.pathname);
  
  const {
    pillStyle,
    iconColor: baseColor,
    inactiveIconColor,
  } = getBottomNavChrome(isLight, isDashboard);

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      data-skip-press-engine
      className={cn(
        'app-bottom-bar transition-all duration-300 ease-out w-full flex justify-center',
        (isActuallyVisible && isScrollVisible) ? 'translate-y-0 opacity-100' : 'opacity-0 translate-y-full',
        className
      )}
      style={{
        paddingLeft: 'max(0px, env(safe-area-inset-left))',
        paddingRight: 'max(0px, env(safe-area-inset-right))',
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        viewTransitionName: 'swipess-bottom-nav',
      }}
    >
      {/* Dark glass dock + white frameless icons (dashboard always dark).
          ZERO circular backgrounds behind icons. */}
      <div
        className={cn(
          'pointer-events-auto floating-dock-nav',
          'max-w-[340px] w-[90vw] mx-auto rounded-[999px]',
          isDashboard && 'floating-dock-nav--dashboard',
        )}
        style={{
          ...pillStyle,
          padding: '6px 8px',
        }}
      >
        <div
          ref={scrollRef}
          data-no-swipe-nav
          data-scroll-axis="x"
          className={cn(
            'relative z-[2] flex items-center justify-start w-full transform-gpu select-none overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-1.5',
          )}
          style={{
            padding: '2px 4px',
            pointerEvents: 'auto',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item) || isModalActive(item);
            const isAddBtn = item.id === 'add';

            const triggerItem = (e: React.MouseEvent | React.PointerEvent) => {
              if (item.path) prefetchRoute(item.path);
              if (item.id === 'events') prefetchEventCategoryPhotosImmediate();
              if (item.id === 'ai') prefetchConciergeChatModule();
              if (item.id === 'add') prefetchListingFlowModule();
              if (item.id === 'search' || item.id === 'filters') prefetchCommonModalsModule();

              handleNavClick(item, e);
            };

            return (
              <button
                key={item.id}
                id={item.id === 'ai-search' ? 'ai-search-button' : undefined}
                data-no-cinematic
                data-instant-feedback
                data-skip-press-engine
                {...(item.path ? createHoverPrefetch(item.path) : {})}
                onClick={(e) => {
                  triggerItem(e);
                }}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                data-active={active ? 'true' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 shrink-0 snap-center',
                  'focus-visible:outline-none transform-gpu pointer-events-auto',
                )}
                style={{
                  minWidth: isTablet ? '56px' : '44px',
                  minHeight: isTablet ? '56px' : '44px',
                  padding: isTablet ? '10px' : '4px 2px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  background: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                {/* Icon host — never a filled circle */}
                <div
                  className="relative z-10 flex items-center justify-center"
                  style={{
                    width: isTablet ? 40 : 36,
                    height: isTablet ? 40 : 36,
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    borderRadius: 0,
                  }}
                >
                  {/* Notification badge only */}
                  <AnimatePresence>
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        key={`${item.id}-badge`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="force-white absolute -top-0.5 -right-0.5 rounded-full min-w-[18px] max-w-[28px] h-[18px] overflow-hidden z-20 flex items-center justify-center text-[11px] font-bold text-white px-1"
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
                          width: isAddBtn ? 24 : (isTablet ? ICON_SIZE_TABLET : (isNarrow ? 18 : ICON_SIZE)),
                          height: isAddBtn ? 24 : (isTablet ? ICON_SIZE_TABLET : (isNarrow ? 18 : ICON_SIZE)),
                          // Add = brand pink glyph only (no pink disc). Active = pure white.
                          color: isAddBtn
                            ? '#FF4D6A'
                            : (active ? baseColor : inactiveIconColor),
                          fill: active && !isAddBtn ? baseColor : 'none',
                          strokeWidth: active || isAddBtn ? 2.35 : 2,
                          filter: 'none',
                          opacity: active || isAddBtn ? 1 : 0.85,
                          transition: 'color 120ms ease-out, fill 120ms ease-out, opacity 120ms ease-out',
                        }}
                      />
                    );
                    if (!motionId) return iconEl;
                    return (
                      <MotionIcon
                        id={motionId}
                        active={false}
                        loop={active}
                      >
                        {iconEl}
                      </MotionIcon>
                    );
                  })()}
                </div>
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
