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
  Megaphone, PartyPopper,
  Zap, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useScrollBounce } from '@/hooks/useScrollBounce';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';

const ICON_SIZE = 26;
const ICON_SIZE_COMPACT = 23;
const TOUCH_TARGET = 52;

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

const TAP_SPRING = {
  type: 'spring' as const,
  stiffness: 1000, // OVERCLOCKED
  damping: 30,
  mass: 0.3, // LIGHTER
};

export const BottomNavigation = memo(({
  userRole,
  onFilterClick,
  className,
}: BottomNavigationProps) => {
  const { navigate, prefetch } = useAppNavigate();
  const location = useLocation();
  const setCategories = useFilterStore((s) => s.setCategories);
  const openAIChat = useModalStore((s) => s.setModal);
  const { unreadCount: _unreadCount } = useUnreadMessageCount();
  const { unreadCount: _unreadNotifCount } = useUnreadNotifications();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const { t } = useTranslation();

  // Detect narrow screens for icon-only compact mode
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 360);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);


  // Client nav items (8 buttons)
  const clientNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'Dashboard', path: '/client/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Profile', path: '/client/profile' },
    { id: 'likes', icon: Flame, label: 'Likes', path: '/client/liked-properties' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/messages' },

    { id: 'roommates', icon: Users2, label: 'Roommates', path: '/explore/roommates' },
    { id: 'events', icon: PartyPopper, label: 'Events', path: '/explore/eventos' },
    { id: 'search', icon: SlidersHorizontal, label: 'Discovery', onClick: onFilterClick },
    { id: 'ai', icon: Sparkles, label: 'AI', onClick: () => openAIChat('showAIChat', true), isSpecial: true },
  ];

  // Owner nav items (8 buttons)
  const ownerNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'System', path: '/owner/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Profile', path: '/owner/profile' },
    { id: 'likes', icon: Flame, label: 'Likes', path: '/owner/liked-clients' },
    { id: 'listings', icon: Building2, label: 'Listings', path: '/owner/properties' },

    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/messages' },
    { id: 'filters', icon: SlidersHorizontal, label: 'Filters', path: '/owner/clients/property' },
    { id: 'promote', icon: Megaphone, label: 'Promote', path: '/client/advertise' },
    { id: 'events', icon: PartyPopper, label: 'Events', path: '/explore/eventos' },
    { id: 'ai', icon: Sparkles, label: 'AI', onClick: () => openAIChat('showAIChat', true), isSpecial: true },
  ];

  // Admin nav items — admin panel + messaging
  const adminNavItems: NavItem[] = [
    { id: 'admin-panel', icon: ShieldCheck, label: 'Admin', path: '/admin/eventos' },
    { id: 'admin-messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userRole === 'client' ? clientNavItems : ownerNavItems;
  const _isScrollable = true; // Always scrollable for both roles

  // ── LIQUID MOMENTUM: Bounce physics on horizontal scroll ──────────
  const bounceRef = useScrollBounce({
    maxTilt: 5,
    maxBounce: 2.5,
    damping: 0.18,
    edgeScale: 0.97,
    childSelector: '> button',
  });

  // Merge bounceRef with our local scrollRef for auto-scroll-to-active
  const scrollRef = useRef<HTMLDivElement>(null);
  const mergedScrollRef = useCallback((node: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (bounceRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [bounceRef]);

  // Auto-scroll active item into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      // INSTANT VIEW: No smooth scrolling for internal state sync, keep it technical and fast
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }
  }, [location.pathname]);

  // ── Tap vs drag detection ─────────────────────────────────────────────
  // isDraggingRef tracks whether the user is scrolling the nav bar.
  // onClick is the primary navigation trigger; pointer events just detect scroll.
  const isDraggingRef = useRef(false);
  const touchState = useRef<{
    x: number; y: number;
  } | null>(null);

  const _handlePointerDown = useCallback(
    (e: React.PointerEvent, item: NavItem) => {
      e.stopPropagation();
      isDraggingRef.current = false;
      touchState.current = { x: e.clientX, y: e.clientY };
      if (item.path) prefetch(item.path);
    },
    [prefetch],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchState.current) return;
    const dx = Math.abs(e.clientX - touchState.current.x);
    const dy = Math.abs(e.clientY - touchState.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingRef.current = true;
    }
  }, []);

  const [ripple, setRipple] = useState<{ x: number, id: string } | null>(null);

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent) => {
      touchState.current = null;
    },
    [],
  );

  // Primary navigation handler — fires after pointer events, checks drag state
  const handleNavClick = useCallback(
    (item: NavItem, event?: React.MouseEvent | React.PointerEvent) => {
      // Immediate haptic on the final click confirmation
      haptics.tap();

      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }
      isDraggingRef.current = false;

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

      // Haptics already triggered on PointerDown if applicable
      if (item.onClick) {
        item.onClick();
      } else if (item.path) {
        navigate(item.path);
      }
    },
    [navigate, location.pathname, setCategories],
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

    return item.path ? location.pathname === item.path : false;
  };

  const iconColorInactive = isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)';
  const activeColor = 'var(--color-brand-primary)';

  const barShadow = 'none';


  return (
    <nav role="navigation" aria-label="Main navigation" className={cn('app-bottom-bar px-3 pb-2 pt-1', className)}>
      {/* ── Liquid Glass bar surface ────────────────────────────────────────
          The bar itself is a glass layer so the swipe card content shows
          through, reinforcing the "floating above" feeling. */}
      <div
        className="pointer-events-auto w-full max-w-md mx-auto"
        style={{
          // LAYER 1: Solid glass base with Heavy Backdrop Blur
          backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(8, 8, 10, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          // No hard borders — defined by shadows and a subtle rim light
          border: 'none',
          borderRadius: '32px',
          boxShadow: barShadow,
          // GPU acceleration
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1000,
        }}
      >
        {/* LAYER 3: Animated liquid highlight — the bar "shines" like glass */}
        {/* Atmospheric rim removed per user request for pure floating look */}

        {/* Liquid Ripple FX */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.35 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full pointer-events-none"
              style={{
                left: ripple.x - 48,
                bottom: -10,
                background: isLight
                  ? 'radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
                zIndex: 1.5,
              }}
            />
          )}
        </AnimatePresence>

        {/* Nav items row — SCROLLABLE ZENITH ARCHITECTURE */}
        <div
          ref={mergedScrollRef}
          data-no-swipe-nav
          onPointerMove={handlePointerMove}
          className={cn(
            'relative flex items-center w-full justify-start gap-1 px-2 py-1.5 nav-scroll-hide transform-gpu',
          )}
          style={{
            zIndex: 2,
            transform: 'translateZ(0)',
            overflowX: 'auto',
            scrollSnapType: 'x proximity', // Premium app landing feel
            scrollbarWidth: 'none' as const,
            WebkitOverflowScrolling: 'touch',
            contentVisibility: 'auto',
            containIntrinsicSize: '60px',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <motion.button
                key={item.id}
                id={item.id === 'ai-search' ? 'ai-search-button' : undefined}
                data-no-cinematic
                onPointerDown={(e) => {
                  haptics.select(); // INSTANT HAPTIC
                  if (item.path) prefetchRoute(item.path); // TOUCH-PRE-WARM
                  isDraggingRef.current = false;
                  touchState.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerEnter={() => {
                  // HOVER PREFETCH: Gain 100-300ms before they even click
                  if (item.path) prefetch(item.path);
                }}
                onPointerUp={(e) => handlePointerUp(e)}
                onKeyDown={(e) => handleNavKeyDown(e, item)}
                onTouchStart={() => {}}
                onClick={(e) => handleNavClick(item, e)}
                whileTap={{ scale: 0.92, transition: TAP_SPRING }}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl gap-1 w-auto flex-shrink-0 h-full',
                  'touch-manipulation focus-visible:outline-none transition-transform active:scale-90 transform-gpu',
                )}
                  style={{
                    minWidth: '68px',
                    scrollSnapAlign: 'start',
                    minHeight: TOUCH_TARGET,
                    padding: '6px 8px',
                  background: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  willChange: 'transform',
                }}
              >
                {/* Active Indicator — Slingshot-Morph Pill */}
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-[4px] rounded-2xl z-0"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 850, // SLINGSHOT
                      damping: 38,
                      mass: 0.6,
                    }}
                     style={{
                       background: isLight ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.22)',
                       boxShadow: isLight ? '0 0 12px rgba(255,107,53,0.15)' : '0 0 16px rgba(255,107,53,0.2)',
                     }}
                  >
                     {/* Liquid highlight catch-light */}
                     <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </motion.div>
                )}
                <motion.div
                  className="relative"
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
                  style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                >
                  {/* 🟢 PRESENCE GLOW: Pulsing indicator for platform activity */}
                  {item.path && !item.isCenter && (
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse opacity-0 group-hover:opacity-100 transition-opacity z-30" />
                  )}

                  {/* Notification badge */}
                  <AnimatePresence mode="popLayout">
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                        className="absolute -top-1 -right-1 rounded-full px-1.5 h-[16px] z-20 shadow-[0_2px_8px_rgba(255,140,0,0.4)] border-2 border-background flex items-center justify-center text-[10px] font-black text-white"
                        style={{ background: 'linear-gradient(135deg,#ff4d00,#ff8c00)' }}
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Icon: filled with brand color when active, outline when inactive */}
                  <Icon
                    className="transition-all duration-300 ease-out"
                    style={{
                      width: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE,
                      height: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE,
                      color: active ? activeColor : iconColorInactive,
                      fill: active ? activeColor : 'none',
                      strokeWidth: active ? 2 : 2.5,
                      filter: active ? 'drop-shadow(0 0 4px rgba(255,107,53,0.3))' : 'none',
                    }}
                  />
                </motion.div>
                {/* Label: Natural height, no clipping */}
                {!isNarrow && (
                  <div className="flex items-center justify-center w-full min-h-[14px]">
                    <span
                      className={cn(
                        'text-[9px] tracking-tight transition-all duration-300 relative font-black uppercase italic whitespace-nowrap',
                      )}
                      style={{
                        color: active
                          ? 'var(--color-brand-primary)'
                        : (isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.65)'),
                        opacity: 1,
                        zIndex: 1,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Edge fade indicators removed by user request (Weird shade color on edges) */}
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
