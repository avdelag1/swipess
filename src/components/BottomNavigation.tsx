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

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Flame, MessageCircle, User, Building2, Heart, Filter,
  Search, Compass, LayoutGrid, Briefcase, Users, List, Sparkles, ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { useTranslation } from 'react-i18next';

const ICON_SIZE = 22;
const ICON_SIZE_COMPACT = 20;
const TOUCH_TARGET = 48;
const TOUCH_TARGET_COMPACT = 44;

interface BottomNavigationProps {
  userRole: 'client' | 'owner' | 'admin';
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
  onListingsClick?: () => void;
  onAISearchClick?: () => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  path?: string;
  onClick?: () => void;
  badge?: number;
  isCenter?: boolean;
}

// ── SPRING CONFIGS ────────────────────────────────────────────────────────────

const TAP_SPRING = {
  type: 'spring' as const,
  stiffness: 440,
  damping: 24,
  mass: 0.6,
};

export function BottomNavigation({
  userRole,
  onFilterClick,
  onAddListingClick,
  onListingsClick,
  onAISearchClick,
}: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessageCount();
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

  const { isVisible } = useScrollDirection({
    threshold: 15,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
  });

  // Client nav items — order: Dashboard, Profile, Likes, AI, Messages, Roommates, Filters
  const clientNavItems: NavItem[] = [
    { id: 'browse', icon: Compass, label: t('nav.explore'), path: '/client/dashboard' },
    { id: 'profile', icon: User, label: t('nav.profile'), path: '/client/profile' },
    { id: 'likes', icon: Flame, label: t('nav.liked'), path: '/client/liked-properties' },
    { id: 'ai-search', icon: Sparkles, label: 'AI', onClick: onAISearchClick },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages', badge: unreadCount },
    { id: 'roommates', icon: Users, label: 'Roommates', path: '/explore/roommates' },
    { id: 'filter', icon: Search, label: t('actions.filter'), path: '/client/filters' },
  ];

  // Owner nav items — order: Dashboard, Profile, Likes, Messages, Listings, Filters
  const ownerNavItems: NavItem[] = [
    { id: 'browse', icon: Compass, label: t('nav.explore'), path: '/owner/dashboard' },
    { id: 'profile', icon: User, label: t('nav.profile'), path: '/owner/profile' },
    { id: 'likes', icon: Flame, label: t('nav.liked'), path: '/owner/liked-clients' },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages', badge: unreadCount },
    { id: 'listings', icon: Building2, label: t('nav.listings'), path: '/owner/properties' },
    { id: 'filter', icon: Search, label: t('actions.filter'), path: '/owner/filters' },
  ];

  // Admin nav items — admin panel only
  const adminNavItems: NavItem[] = [
    { id: 'admin', icon: ShieldCheck, label: 'Admin', path: '/admin/eventos' },
    { id: 'messages', icon: MessageCircle, label: t('nav.messages'), path: '/messages', badge: unreadCount },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : userRole === 'client' ? clientNavItems : ownerNavItems;
  const isScrollable = true; // Always scrollable for both roles

  // Auto-scroll active item into view
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname]);

  // ── Edge fade indicators ──────────────────────────────────────────────
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollFades();
    // Re-check on resize
    window.addEventListener('resize', updateScrollFades);
    return () => window.removeEventListener('resize', updateScrollFades);
  }, [updateScrollFades, navItems.length]);

  // ── Tap vs drag detection ─────────────────────────────────────────────
  const touchState = useRef<{
    x: number; y: number; time: number; item: NavItem; isDragging: boolean;
  } | null>(null);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, item: NavItem) => {
      e.stopPropagation();
      touchState.current = {
        x: e.clientX, y: e.clientY, time: Date.now(), item, isDragging: false,
      };
      if (item.path) prefetchRoute(item.path);
    },
    [],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchState.current) return;
    const dx = Math.abs(e.clientX - touchState.current.x);
    if (dx > 8) {
      touchState.current.isDragging = true;
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!touchState.current) return;
      const { item, isDragging, time } = touchState.current;
      const elapsed = Date.now() - time;
      const dx = Math.abs(e.clientX - touchState.current.x);

      // Quick tap with minimal movement → navigate
      if (!isDragging && elapsed < 300 && dx < 8) {
        haptics.select();
        if (item.onClick) {
          item.onClick();
        } else if (item.path) {
          navigate(item.path);
        }
      }

      touchState.current = null;
    },
    [navigate],
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

  const isActive = (item: NavItem) => item.path ? location.pathname === item.path : false;

  // ── Colour tokens ────────────────────────────────────────────────────────
  const iconColorInactive = isLight ? '#1a1a1a' : 'rgba(255,255,255,0.65)';
  const activeColor = isLight ? 'hsl(var(--primary))' : '#f97316';

  // ── Nav bar glass surface ────────────────────────────────────────────────
  // Heavy blur shows the swipe card and content behind the navigation bar.
  const barBg = isLight ? 'rgba(255,255,255,0.72)' : 'rgba(12,12,14,0.68)';
  const barBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';
  const barShadow = isLight
    ? 'inset 0 1px 0 rgba(255,255,255,0.92), 0 -2px 12px rgba(0,0,0,0.06)'
    : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 -4px 20px rgba(0,0,0,0.35)';


  return (
    <nav className={cn('app-bottom-bar pointer-events-none px-3 pb-1', !isVisible && 'nav-hidden')}>
      {/* ── Liquid Glass bar surface ────────────────────────────────────────
          The bar itself is a glass layer so the swipe card content shows
          through, reinforcing the "floating above" feeling. */}
      <div
        className="pointer-events-auto w-full max-w-md mx-auto"
        style={{
          // LAYER 1: Solid glass base (no blur - massive GPU savings)
          backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(12,12,14,0.92)',
          // LAYER 2: Top rim catch-light (bright edge = physical glass rim)
          borderTop: `1px solid ${isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.14)'}`,
          borderLeft: `1px solid ${barBorder}`,
          borderRight: `1px solid ${barBorder}`,
          borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '22px',
          boxShadow: barShadow,
          // GPU acceleration
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* LAYER 3: Animated liquid highlight — the bar "shines" like glass */}
        <div
          aria-hidden="true"
          className="liquid-glass-highlight--animated pointer-events-none absolute inset-0"
          style={{
            borderRadius: 'inherit',
            background: `
              radial-gradient(ellipse 160% 50% at 15% 0%,
                rgba(255,255,255,${isLight ? 0.55 : 0.14}) 0%, transparent 60%),
              radial-gradient(ellipse 100% 60% at 85% 100%,
                rgba(255,255,255,${isLight ? 0.22 : 0.06}) 0%, transparent 55%)
            `,
            backgroundSize: '220% 220%, 100% 100%',
            zIndex: 1,
          }}
        />

        {/* Nav items row */}
        <div
          ref={scrollRef}
          data-no-swipe-nav
          onScroll={updateScrollFades}
          onPointerMove={handlePointerMove}
          className={cn(
            'relative flex items-center w-full px-1 py-2.5 nav-scroll-hide',
          )}
          style={{
            zIndex: 2,
            transform: 'translateZ(0)',
            overflowX: 'auto',
            scrollbarWidth: 'none' as const,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <motion.button
                key={item.id}
                id={item.id === 'ai-search' ? 'ai-search-button' : undefined}
                onPointerDown={(e) => handlePointerDown(e, item)}
                onPointerUp={(e) => handlePointerUp(e)}
                onKeyDown={(e) => handleNavKeyDown(e, item)}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => e.preventDefault()}
                whileTap={{ scale: 0.88, transition: TAP_SPRING }}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl gap-0.5 min-w-0 flex-1',
                  'touch-manipulation focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-offset-1',
                  isLight
                    ? 'focus-visible:ring-orange-500/70 focus-visible:ring-offset-white'
                    : 'focus-visible:ring-orange-400/70 focus-visible:ring-offset-black',
                )}
                style={{
                  minWidth: 64,
                  minHeight: isNarrow ? TOUCH_TARGET_COMPACT : TOUCH_TARGET,
                  padding: isNarrow ? '4px 2px' : '6px 4px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >

                {/* Notification badge */}
                <AnimatePresence>
                  {item.badge && item.badge > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute top-0.5 right-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white px-1 z-20"
                      style={{ background: 'linear-gradient(135deg,#ec4899,#f97316)' }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div className="relative" style={{ zIndex: 1 }}>
                  <Icon
                    className="transition-all duration-250 ease-out"
                    style={{
                      width: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE,
                      height: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE,
                      color: active ? 'transparent' : iconColorInactive,
                      stroke: active ? 'url(#nav-active-gradient)' : 'currentColor',
                      fill: active ? 'url(#nav-active-gradient)' : 'none',
                      filter: active && !isLight
                        ? 'drop-shadow(0 2px 6px rgba(249,115,22,0.45))'
                        : 'none',
                    }}
                    strokeWidth={active ? 3.5 : 2.8}
                  />
                </div>

                {/* Label — hidden on very narrow screens (<360px) for icon-only mode */}
                {!isNarrow && (
                  <span
                    className={cn(
                      'text-[10px] tracking-wide transition-all duration-250 relative',
                      active ? 'font-black' : 'font-bold',
                    )}
                    style={{
                      color: active ? activeColor : iconColorInactive,
                      opacity: active ? 1 : (isLight ? 0.75 : 0.65),
                      zIndex: 1,
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Edge fade indicators ──────────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 bottom-0 transition-opacity duration-200"
          style={{
            width: 24,
            zIndex: 10,
            borderRadius: 'inherit',
            opacity: canScrollLeft ? 1 : 0,
            background: `linear-gradient(to right, ${isLight ? 'rgba(255,255,255,0.95)' : 'rgba(12,12,14,0.92)'} 0%, transparent 100%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 transition-opacity duration-200"
          style={{
            width: 24,
            zIndex: 10,
            borderRadius: 'inherit',
            opacity: canScrollRight ? 1 : 0,
            background: `linear-gradient(to left, ${isLight ? 'rgba(255,255,255,0.95)' : 'rgba(12,12,14,0.92)'} 0%, transparent 100%)`,
          }}
        />
      </div>

      {/* SVG gradient defs for active icon */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="nav-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#ec4899" offset="0%" />
            <stop stopColor="#f97316" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </nav>
  );
}
