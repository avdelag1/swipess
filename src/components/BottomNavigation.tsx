/**
 * BOTTOM NAVIGATION BAR
 *
 * Full-width, ergonomic bottom navigation optimized for one-handed use.
 * Theme-aware: adapts colors for dark and light modes.
 */

import { startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, SlidersHorizontal, Flame, MessageCircle, User, List, Building2, Heart, Filter,
  Search, Compass, LayoutGrid, Users, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';

// ICON SIZING - responsive
const ICON_SIZE = 22;
const TOUCH_TARGET_SIZE = 48;

interface BottomNavigationProps {
  userRole: 'client' | 'owner' | 'admin';
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
  onListingsClick?: () => void;
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

export function BottomNavigation({ userRole, onFilterClick, onAddListingClick, onListingsClick }: BottomNavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessageCount();
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';

  // Hide on scroll down, show on scroll up - targets the dashboard scroll container
  const { isVisible } = useScrollDirection({
    threshold: 15,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container'
  });

  // Client Navigation Items — distinct icons
  const clientNavItems: NavItem[] = [
    {
      id: 'browse',
      icon: Compass,
      label: 'Explore',
      path: '/client/dashboard',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      path: '/client/profile',
    },
    {
      id: 'likes',
      icon: Flame,
      label: 'Likes',
      path: '/client/liked-properties',
    },
    {
      id: 'messages',
      icon: MessageCircle,
      label: 'Messages',
      path: '/messages',
      badge: unreadCount,
    },
    {
      id: 'filter',
      icon: Search,
      label: 'Filters',
      path: '/client/filters',
    },
  ];

  // Owner Navigation Items — distinct icons
  const ownerNavItems: NavItem[] = [
    {
      id: 'browse',
      icon: LayoutGrid,
      label: 'Dashboard',
      path: '/owner/dashboard',
    },
    {
      id: 'profile',
      icon: Briefcase,
      label: 'Profile',
      path: '/owner/profile',
    },
    {
      id: 'liked',
      icon: Users,
      label: 'Clients',
      path: '/owner/liked-clients',
    },
    {
      id: 'listings',
      icon: List,
      label: 'Listings',
      path: '/owner/properties',
      isCenter: true,
    },
    {
      id: 'messages',
      icon: MessageCircle,
      label: 'Messages',
      path: '/messages',
      badge: unreadCount,
    },
    {
      id: 'filter',
      icon: SlidersHorizontal,
      label: 'Filters',
      path: '/owner/filters',
    },
  ];

  const navItems = userRole === 'client' ? clientNavItems : ownerNavItems;

  const handleNavPress = (event: React.PointerEvent, item: NavItem) => {
    event.stopPropagation();
    event.preventDefault();
    haptics.select();

    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      startTransition(() => {
        navigate(item.path!);
      });
    }
  };

  const isActive = (item: NavItem) => {
    if (!item.path) return false;
    return location.pathname === item.path;
  };

  // Theme-aware colors
  const iconColor = isLight ? 'hsl(var(--foreground) / 0.85)' : 'hsl(var(--foreground))';
  const activeColor = isLight ? 'hsl(var(--primary))' : '#f97316';
  const bgDefault = isLight ? 'hsl(var(--background) / 0.88)' : 'hsl(var(--background) / 0.28)';
  const bgActive = isLight ? 'hsl(var(--background) / 0.96)' : 'hsl(var(--background) / 0.42)';
  const borderColor = isLight ? 'hsl(var(--border) / 0.72)' : 'hsl(var(--border) / 0.55)';
  const shadowColor = isLight
    ? 'inset 0 1px 0 hsl(var(--foreground) / 0.65), 0 3px 10px hsl(0 0% 0% / 0.08)'
    : 'inset 0 1px 0 hsl(var(--foreground) / 0.1), 0 4px 12px hsl(0 0% 0% / 0.3)';
  const controlBlur = isLight ? 'none' : 'blur(8px)';

  return (
    <nav className={cn("app-bottom-bar pointer-events-none px-1", !isVisible && "nav-hidden")}>
      <div
        className="flex items-center justify-between w-full max-w-xl mx-auto px-2 py-2 pointer-events-auto bg-transparent"
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onPointerDown={(e) => { handleNavPress(e, item); if (item.path) prefetchRoute(item.path); }}
              onTouchStart={(e) => { e.stopPropagation(); }}
              onClick={(e) => e.preventDefault()}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl gap-0.5',
                'transition-all duration-100 ease-out',
                'active:scale-[0.9]',
                'touch-manipulation',
                '-webkit-tap-highlight-color-transparent'
              )}
              style={{
                minWidth: TOUCH_TARGET_SIZE,
                minHeight: TOUCH_TARGET_SIZE,
                padding: '8px 4px',
                backgroundColor: active ? bgActive : bgDefault,
                backdropFilter: controlBlur,
                WebkitBackdropFilter: controlBlur,
                border: `1px solid ${borderColor}`,
                borderRadius: '14px',
                boxShadow: shadowColor,
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                />
              )}

              {/* Notification Badge */}
              <AnimatePresence>
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-0.5 right-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white px-1 z-10"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </AnimatePresence>

              <div className="relative">
                <Icon
                  className="transition-all duration-300 ease-out"
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    color: active ? 'transparent' : iconColor,
                    stroke: active ? 'url(#active-gradient)' : 'currentColor',
                    fill: active ? 'url(#active-gradient)' : 'none',
                    filter: active ? 'drop-shadow(0 4px 6px rgba(249, 115, 22, 0.3))' : 'none'
                  }}
                  strokeWidth={active ? 3.5 : 3}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-wide transition-all duration-300",
                  active ? "font-black" : "font-extrabold"
                )}
                style={{
                  color: active ? activeColor : iconColor,
                  opacity: active ? 1 : 0.7
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* SVG Defs for Gradient Icons */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor="#ec4899" offset="0%" />
              <stop stopColor="#f97316" offset="100%" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </nav>
  );
}
