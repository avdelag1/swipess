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
  Ticket, IdCard, BadgePercent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { uiSounds } from '@/utils/uiSounds';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';

const ICON_SIZE = 23;
const ICON_SIZE_COMPACT = 20;
const ICON_SIZE_TABLET = 26;
const TOUCH_TARGET = 46;
const TOUCH_TARGET_TABLET = 54;

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
  const setModal = useModalStore((s) => s.setModal);
  const { unreadCount: _unreadCount } = useUnreadMessageCount();
  const { unreadCount: _unreadNotifCount } = useUnreadNotifications();
  const { theme, isLight, isDark } = useTheme();

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


  // Client nav items
  const clientNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'Dashboard', path: '/client/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Profile', path: '/client/profile' },
    { id: 'likes', icon: Flame, label: 'Likes', path: '/client/liked-properties' },
    { id: 'ai', icon: Sparkles, label: 'AI Bot', onClick: openAIChat, isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/messages' },
    { id: 'roommates', icon: Users2, label: 'Roommates', path: '/explore/roommates' },
    { id: 'tokens', icon: Ticket, label: 'Tokens', onClick: () => setModal('showTokensModal', true) },
    { id: 'vapid', icon: IdCard, label: 'ID Card', onClick: () => setModal('showVapId', true) },
    { id: 'search', icon: SlidersHorizontal, label: 'Filter', onClick: onFilterClick },
    { id: 'events', icon: PartyPopper, label: 'Events', path: '/explore/eventos' },
    { id: 'perks', icon: BadgePercent, label: 'Perks', path: '/client/perks' },
  ];

  // Owner nav items
  const ownerNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'Dashboard', path: '/owner/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Profile', path: '/owner/profile' },
    { id: 'likes', icon: Flame, label: 'Likes', path: '/owner/liked-clients' },
    { id: 'ai', icon: Sparkles, label: 'AI Bot', onClick: openAIChat, isSpecial: true },
    { id: 'listings', icon: Building2, label: 'Listings', path: '/owner/properties' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/messages' },
    { id: 'promote', icon: Megaphone, label: 'Promote', path: '/client/advertise' },
    { id: 'legal', icon: Scale, label: 'Legal', path: '/owner/legal-services' },
    { id: 'filters', icon: SlidersHorizontal, label: 'Filter', path: '/owner/clients/property' },
  ];

  // Admin nav items — admin panel + messaging
  const adminNavItems: NavItem[] = [
    { id: 'admin-panel', icon: ShieldCheck, label: 'Admin', path: '/admin/eventos' },
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
    if (dx > 8 || dy > 8) isDraggingRef.current = true;
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
    if (!item.path) return false;
    // Exact match OR startsWith for sub-routes (e.g. /client/dashboard/*)
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const iconColorInactive = isLight ? 'rgba(17,17,17,0.45)' : 'rgba(255,255,255,0.65)';
  const activeColor = isLight ? '#0D6A63' : 'var(--color-brand-primary)';

  const barShadow = 'none';


  return (
    <nav role="navigation" aria-label="Main navigation" className={cn('app-bottom-bar px-3 pb-2 pt-1', className)}>
      {/* ── Liquid Glass bar surface ────────────────────────────────────────
          The bar itself is a glass layer so the swipe card content shows
          through, reinforcing the "floating above" feeling. */}
      <div
        className="pointer-events-auto w-full max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto glass-pill-nav px-1"
        style={{
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
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
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                zIndex: 1.5,
              }}
            />
          )}
        </AnimatePresence>

        {/* Nav items row — SCROLLABLE ZENITH ARCHITECTURE */}
        <div
          ref={scrollRef}
          data-no-swipe-nav
          data-scroll-axis="x"
          onPointerMove={handlePointerMove}
          className={cn(
            'relative flex items-center w-full justify-start gap-3 px-4 py-1.5 nav-scroll-hide transform-gpu select-none',
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
                onPointerEnter={() => {
                  if (item.path) prefetch(item.path);
                }}
                onPointerUp={() => handlePointerUp()}
                onKeyDown={(e) => handleNavKeyDown(e, item)}
                onClick={(e) => handleNavClick(item, e)}
                aria-label={item.label}
                aria-current={isActive(item) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl gap-1 w-auto flex-shrink-0 h-full',
                  'touch-manipulation focus-visible:outline-none transform-gpu',
                )}
                style={{
                  minWidth: isTablet ? '100px' : (isNarrow ? '58px' : '68px'),
                  scrollSnapAlign: 'start',
                  minHeight: isTablet ? TOUCH_TARGET_TABLET : TOUCH_TARGET,
                  padding: isTablet ? '8px 12px' : '6px 8px',
                  background: 'transparent',
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  WebkitUserSelect: 'none' as any,
                  transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-[4px] rounded-2xl z-0 pointer-events-none"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 850, // SLINGSHOT
                      damping: 38,
                      mass: 0.6,
                    }}
                     style={{
                       background: 'transparent',
                       boxShadow: 'none',
                     }}
                  />
                )}
                <motion.div
                  className="relative"
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.6 }}
                  style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                >

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
                      width: isTablet ? ICON_SIZE_TABLET : (isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE),
                      height: isTablet ? ICON_SIZE_TABLET : (isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE),
                      color: active ? activeColor : iconColorInactive,
                      fill: active ? activeColor : 'none',
                      strokeWidth: active ? 1.8 : 1.5,
                      filter: active ? 'drop-shadow(0 0 4px rgba(255,107,53,0.3))' : 'none',
                    }}
                  />
                </motion.div>
                {/* Label: Natural height, no clipping */}
                {!isNarrow && (
                  <div className="flex items-center justify-center w-full min-h-[14px]">
                    <span
                      className={cn(
                        'tracking-tight transition-all duration-300 relative font-black uppercase italic whitespace-nowrap',
                        isTablet ? 'text-[11px]' : 'text-[9px]',
                      )}
                      style={{
                        color: active
                          ? 'var(--color-brand-primary)'
                          : 'rgba(255,255,255,0.65)',
                        opacity: 1,
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
