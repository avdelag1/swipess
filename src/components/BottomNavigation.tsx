/**
 * BOTTOM NAVIGATION BAR
 *
 * Full-width, ergonomic bottom navigation optimized for one-handed use.
 * DARK MODE: Clean dark background with white icons for premium look.
 */

import { startTransition } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, SlidersHorizontal, Flame, MessageCircle, User, List, Building2, Heart, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { prefetchRoute } from '@/utils/routePrefetcher';

// ICON SIZING
const ICON_SIZE = 26;
const TOUCH_TARGET_SIZE = 56;

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
  
  // Hide on scroll down, show on scroll up - targets the dashboard scroll container
  const { isVisible } = useScrollDirection({ 
    threshold: 15, 
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container'
  });

  // Client/Renter Navigation Items - Profile next to Browse, Filter at the end
  const clientNavItems: NavItem[] = [
    {
      id: 'browse',
      icon: Home,
      label: 'Home',
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
      icon: Filter,
      label: 'Filters',
      path: '/client/filters',
    },
  ];

  // Owner/Landlord Navigation Items - Profile next to Browse, Filter at the end
  const ownerNavItems: NavItem[] = [
    {
      id: 'browse',
      icon: Building2,
      label: 'Home',
      path: '/owner/dashboard',
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      path: '/owner/profile',
    },
    {
      id: 'liked',
      icon: Heart,
      label: 'Likes',
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

  const handleNavClick = (event: React.MouseEvent, item: NavItem) => {
    // Prevent event bubbling to avoid accidental triggers of other buttons
    event.stopPropagation();

    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      // INSTANT NAVIGATION: Use startTransition to keep current UI responsive
      // while React prepares the new route - feels like native app
      startTransition(() => {
        navigate(item.path!);
      });
    }
  };

  const isActive = (item: NavItem) => {
    if (!item.path) return false;
    return location.pathname === item.path;
  };

  return (
    <nav className={cn("app-bottom-bar pointer-events-none px-1", !isVisible && "nav-hidden")}>
      <div
        // Transparent - no background, no rounded corners
        className="flex items-center justify-between w-full max-w-xl mx-auto px-2 py-2 pointer-events-auto bg-transparent"
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <button
              key={item.id}
              onClick={(e) => handleNavClick(e, item)}
              onPointerDown={(e) => { e.stopPropagation(); if (item.path) prefetchRoute(item.path); }}
              onTouchStart={(e) => { e.stopPropagation(); if (item.path) prefetchRoute(item.path); }}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl gap-0.5',
                'transition-all duration-100 ease-out',
                'active:scale-[0.9]',
                'hover:bg-white/10',
                'touch-manipulation',
                '-webkit-tap-highlight-color-transparent'
              )}
              style={{
                minWidth: TOUCH_TARGET_SIZE,
                minHeight: TOUCH_TARGET_SIZE,
                padding: '8px 4px',
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className={cn(
                    'absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full',
                    'bg-orange-500'
                  )}
                />
              )}

              {/* Notification Badge */}
              <AnimatePresence>
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={cn(
                      "absolute top-0.5 right-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white px-1 z-10",
                      "bg-orange-500"
                    )}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </AnimatePresence>

              <Icon
                className={cn(
                  'transition-colors duration-150',
                  active ? 'text-orange-500' : 'text-white/90'
                )}
                style={{
                  width: ICON_SIZE - 4,
                  height: ICON_SIZE - 4,
                }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={cn(
                'text-[10px] leading-tight font-medium transition-colors duration-150',
                active ? 'text-orange-500' : 'text-white/90'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
