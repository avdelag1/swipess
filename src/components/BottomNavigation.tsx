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

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, MessageCircle, CircleUser, Building2,
  Users2, ShieldCheck,
  Megaphone, PartyPopper, Scale,
  Zap, SlidersHorizontal, Sparkles,
  IdCard, BadgePercent, Radio, Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { prefetchRoute } from '@/utils/routePrefetcher';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { uiSounds } from '@/utils/uiSounds';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';
import { useActiveMode } from '@/hooks/useActiveMode';

const ICON_SIZE = 18;
const ICON_SIZE_COMPACT = 16;
const ICON_SIZE_TABLET = 24;
const TOUCH_TARGET = 32;
const TOUCH_TARGET_TABLET = 46;

interface BottomNavigationProps {
  userRole: 'client' | 'owner' | 'admin';
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
  onListingsClick?: () => void;

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
  stiffness: 1000, // OVERCLOCKED
  damping: 30,
  mass: 0.3, // LIGHTER
};

export const BottomNavigation = memo(({
  userRole,
  onFilterClick,
  onListingsClick,
  className,
}: BottomNavigationProps) => {
  const { navigate, prefetch } = useAppNavigate();
  const location = useLocation();
  const setCategories = useFilterStore((s) => s.setCategories);
  const setModal = useModalStore((s) => s.setModal);
  const showAIListing = useModalStore((s) => s.showAIListing);
  const showAIChat = useModalStore((s) => s.showAIChat);
  const { unreadCount: _unreadCount } = useUnreadMessageCount();
  const { unreadCount: _unreadNotifCount } = useUnreadNotifications();
  const { theme, isLight } = useAppTheme();
  const { activeMode, switchMode, isSwitching } = useActiveMode();

  const { t } = useTranslation();

  const prewarmAIChat = useCallback(() => {
    import('@/components/ConciergeChat').catch(() => {});
  }, []);

  const openAIChat = useCallback(() => {
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


  // Client nav items — Legal lives inside Profile, not in the bar
  const clientNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: t('nav.dashboard'), path: '/client/dashboard' },
    { id: 'profile', icon: CircleUser, label: t('nav.profile'), path: '/client/profile' },
    { id: 'likes', icon: Flame, label: t('nav.likes'), path: '/client/liked-properties', onClick: onListingsClick },
    { id: 'ai', icon: Sparkles, label: t('nav.aiBot'), onClick: openAIChat, isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
    { id: 'vapid', icon: IdCard, label: t('nav.idCard'), onClick: () => setModal('showVapId', true) },
    { id: 'events', icon: PartyPopper, label: t('nav.events'), path: '/explore/eventos' },
    { id: 'roommates', icon: Users2, label: t('nav.roommates'), path: '/explore/roommates' },
    { id: 'tokens', icon: Ticket, label: t('nav.tokens'), onClick: () => setModal('showTokensModal', true) },
    { id: 'search', icon: SlidersHorizontal, label: t('nav.filter'), onClick: onFilterClick },
    { id: 'perks', icon: BadgePercent, label: t('nav.perks'), path: '/client/perks' },
    { id: 'radio', icon: Radio, label: t('nav.radio'), path: '/radio' },
  ];

  // Owner nav items
  const ownerNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: t('nav.dashboard'), path: '/owner/dashboard' },
    { id: 'profile', icon: CircleUser, label: t('nav.profile'), path: '/owner/profile' },
    { id: 'likes', icon: Flame, label: t('nav.likes'), path: '/owner/liked-clients' },
    { id: 'ai', icon: Sparkles, label: t('nav.aiBot'), onClick: openAIChat, isSpecial: true },
    { id: 'listings', icon: Building2, label: t('nav.listings'), path: '/owner/properties', onClick: onListingsClick },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
    { id: 'ai-listing', icon: Sparkles, label: t('nav.aiListing'), onClick: () => setModal('showAIListing', true), isSpecial: true },
    { id: 'legal', icon: Scale, label: t('nav.legal'), path: '/owner/legal-services' },
    { id: 'promote', icon: Megaphone, label: t('nav.promote'), path: '/client/advertise' },
    { id: 'filters', icon: SlidersHorizontal, label: t('nav.filter'), onClick: onFilterClick },
  ];

  // Admin nav items — admin panel + messaging
  const adminNavItems: NavItem[] = [
    { id: 'admin-panel', icon: ShieldCheck, label: t('nav.admin'), path: '/admin/eventos' },
    { id: 'admin-messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userRole === 'client' ? clientNavItems : ownerNavItems;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollGuardTimeoutRef = useRef<number | null>(null);

  // Auto-scroll active item into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      // INSTANT VIEW: No smooth scrolling for internal state sync, keep it technical and fast
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname]);

  const isDraggingRef = useRef(false);
  const touchState = useRef<{ x: number; y: number } | null>(null);
  const [ripple, setRipple] = useState<{ x: number, id: string } | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchState.current) return;
    const dx = Math.abs(e.clientX - touchState.current.x);
    const dy = Math.abs(e.clientY - touchState.current.y);
    if (dx > 15 || dy > 15) isDraggingRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    touchState.current = null;
  }, []);

  // Primary navigation handler — fires after pointer events, checks drag state
  const handleNavClick = useCallback(
    (item: NavItem, event?: React.MouseEvent | React.PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }
      isDraggingRef.current = false;

      haptics.tap();
      uiSounds.playTap();

      if (item.path === location.pathname) {
        haptics.tap();
        // Tapping Dashboard while already on dashboard resets to category selection grid
        if (item.id === 'dashboard') {
          setCategories([]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Trigger ripple at click position
      if (event && scrollRef.current) {
        const rect = scrollRef.current.getBoundingClientRect();
        const x = (event as any).clientX - rect.left;
        setRipple({ x, id: Math.random().toString() });
        setTimeout(() => setRipple(null), 800);
      }

      // Close any open full-screen modals before navigating to a new page
      if (item.path) {
        if (showAIListing) setModal('showAIListing', false);
        if (showAIChat) setModal('showAIChat', false);
      }

      // Haptics already triggered on PointerDown if applicable
      if (item.onClick) {
        item.onClick();
      } else if (item.path) {
        navigate(item.path);
      }
    },
    [navigate, location.pathname, setCategories, showAIListing, showAIChat, setModal],
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

  const iconColorInactive = 'var(--icon-inactive)';
  const activeColor = 'var(--icon-active)';

  const barShadow = 'none';


  return (
    <nav role="navigation" aria-label="Main navigation" className={cn('app-bottom-bar px-3 pb-2 pt-1', className, isTablet ? 'px-4' : '')} style={{ paddingBottom: 'calc(8px + max(0px, env(safe-area-inset-bottom)))' }}>
      {/* ── Liquid Glass bar surface ────────────────────────────────────────
          The bar itself is a glass layer so the swipe card content shows
          through, reinforcing the "floating above" feeling. */}
      <div
        className={cn(
          "pointer-events-auto glass-pill-nav px-1.5",
          isTablet ? "mx-auto w-fit max-w-full" : "w-full"
        )}
        style={{
          background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(10, 15, 30, 0.55)',
          backdropFilter: 'blur(32px) saturate(220%)',
          WebkitBackdropFilter: 'blur(32px) saturate(220%)',
          borderRadius: '3rem',
          padding: '4px',
          boxShadow: 'none',
          border: 'none',
        }}

      >
        {/* Nav items row — SCROLLABLE ZENITH ARCHITECTURE */}
        <div
          ref={scrollRef}
          data-no-swipe-nav
          data-scroll-axis="x"
          onPointerMove={handlePointerMove}
          className={cn(
            'relative flex items-center w-full gap-1 px-3 py-0.5 nav-scroll-hide transform-gpu select-none',
          )}
          style={{
            zIndex: 2,
            transform: 'translateZ(0)',
            overflowX: 'auto',
            scrollSnapType: 'none',
            scrollPaddingLeft: '16px',
            scrollPaddingRight: '16px',
            scrollbarWidth: 'none' as const,
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            contentVisibility: 'auto',
            containIntrinsicSize: '60px',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'none',
            // 'safe center' centers the items when they fit, but falls back to
            // start-alignment when they overflow so nothing gets clipped.
            justifyContent: 'safe center',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.id}
                id={item.id === 'ai-search' ? 'ai-search-button' : undefined}
                data-no-cinematic
                data-instant-feedback
                onPointerDown={(e) => {
                  if (item.path) prefetchRoute(item.path);
                  isDraggingRef.current = false;
                  touchState.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={(e) => {
                  handleNavClick(item, e);
                  handlePointerUp();
                }}
                onPointerCancel={handlePointerUp}
                onKeyDown={(e) => handleNavKeyDown(e, item)}

                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-full gap-1 w-auto flex-shrink-0 h-full',
                  'touch-manipulation focus-visible:outline-none transform-gpu',
                )}
                style={{
                  minWidth: 'clamp(42px, 10vw, 54px)',
                  scrollSnapAlign: 'start',
                  minHeight: isTablet ? TOUCH_TARGET_TABLET : TOUCH_TARGET,
                  padding: isTablet ? '8px 12px' : (isNarrow ? '4px' : 'clamp(4px, 1.2vw, 8px)'),
                  borderRadius: '3rem',
                  cursor: 'pointer',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none' as any,
                  transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                {/* No per-button frame — the bar is already a pill. Active
                    state is communicated by the icon color alone. */}

                <div
                  className="relative z-10"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: active ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 180ms cubic-bezier(0.32, 0.72, 0, 1)',
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
                        className="absolute -top-1 -right-1 rounded-full px-1.5 h-[16px] z-20 shadow-[0_2px_8px_rgba(255,140,0,0.4)] border-2 border-[var(--hud-bg)] flex items-center justify-center text-[11px] font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#ff4d00,#ff8c00)' }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Icon: brand-colored when active, muted when inactive.
                      No frame, no glow — just color. */}
                  <Icon
                    style={{
                      width: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 16 : ICON_SIZE),
                      height: isTablet ? ICON_SIZE_TABLET : (isNarrow ? 16 : ICON_SIZE),
                      color: active
                        ? '#FF4D00'
                        : (isLight ? '#000000' : 'rgba(255,255,255,0.7)'),
                      fill: 'none',
                      strokeWidth: active ? 2.4 : 1.9,
                      transition: 'color 160ms ease-out, stroke-width 160ms ease-out',
                    }}
                  />
                </div>
                {/* Label */}
                {!isNarrow && (
                  <div className="flex items-center justify-center w-full min-h-[12px] px-0.5">
                    <span
                      className={cn(
                        'tracking-wide relative font-black uppercase truncate',
                        isTablet ? 'text-[11px] max-w-[56px]' : 'text-[8px] max-w-[40px]',
                      )}
                      style={{
                        color: active
                          ? '#FF4D00'
                          : (isLight ? '#000000' : 'rgba(255,255,255,0.7)'),
                        transition: 'color 160ms ease-out',
                        zIndex: 1,
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
