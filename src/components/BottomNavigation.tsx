import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, MessageCircle, CircleUser, Building2,
  Users2, PartyPopper, Zap, SlidersHorizontal, Sparkles,
  Ticket, IdCard, BadgePercent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadMessageCount } from '@/hooks/useUnreadMessageCount';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useFilterStore } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';

const ICON_SIZE = 22;
const ICON_SIZE_COMPACT = 20;
const ICON_SIZE_TABLET = 26;
const TOUCH_TARGET = 48;
const TOUCH_TARGET_TABLET = 54;

interface BottomNavigationProps {
  userRole: 'client' | 'owner' | 'admin';
  onFilterClick?: () => void;
  onAddListingClick?: () => void;
  onListingsClick?: () => void;
  className?: string; 
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

export const BottomNavigation = memo(({
  userRole,
  onFilterClick,
  className,
}: BottomNavigationProps) => {
  const { navigate, prefetch } = useAppNavigate();
  const location = useLocation();
  const setCategories = useFilterStore((s) => s.setCategories);
  const setModal = useModalStore((s) => s.setModal);
  const { unreadCount: messageCount } = useUnreadMessageCount();
  const { unreadCount: notifCount } = useUnreadNotifications();
  const { theme } = useTheme();

  const openAIChat = useCallback(() => {
    setModal('showAIChat', true);
  }, [setModal]);

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

  const clientNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'Explore', path: '/client/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Account', path: '/client/profile' },
    { id: 'likes', icon: Flame, label: 'Vault', path: '/client/liked-properties' },
    { id: 'ai', icon: Sparkles, label: 'Nexus AI', onClick: openAIChat, isSpecial: true },
    { id: 'messages', icon: MessageCircle, label: 'Stream', path: '/messages', badge: messageCount },
    { id: 'roommates', icon: Users2, label: 'Groups', path: '/explore/roommates' },
    { id: 'tokens', icon: Ticket, label: 'Credits', onClick: () => setModal('showTokensModal', true) },
    { id: 'vapid', icon: IdCard, label: 'Legacy ID', onClick: () => setModal('showVapId', true) },
    { id: 'search', icon: SlidersHorizontal, label: 'Radar', onClick: onFilterClick },
    { id: 'events', icon: PartyPopper, label: 'Events', path: '/explore/eventos', badge: notifCount },
    { id: 'perks', icon: BadgePercent, label: 'Perks', path: '/client/perks' },
  ];

  const ownerNavItems: NavItem[] = [
    { id: 'dashboard', icon: Zap, label: 'Control', path: '/owner/dashboard' },
    { id: 'profile', icon: CircleUser, label: 'Brand', path: '/owner/profile' },
    { id: 'likes', icon: Flame, label: 'Network', path: '/owner/liked-clients' },
    { id: 'ai', icon: Sparkles, label: 'Nexus AI', onClick: openAIChat, isSpecial: true },
    { id: 'listings', icon: Building2, label: 'Assets', path: '/owner/properties' },
    { id: 'messages', icon: MessageCircle, label: 'Stream', path: '/messages', badge: messageCount },
    { id: 'filters', icon: SlidersHorizontal, label: 'Target', path: '/owner/clients/property' },
  ];

  const navItems = userRole === 'admin' ? [] : userRole === 'client' ? clientNavItems : ownerNavItems;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeBtn = scrollRef.current.querySelector('[aria-current="page"]') as HTMLElement;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [location.pathname]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      triggerHaptic('medium');
      if (item.path === location.pathname) {
        if (item.id === 'dashboard') setCategories([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (item.onClick) item.onClick();
      else if (item.path) navigate(item.path);
    },
    [navigate, location.pathname, setCategories],
  );

  const isActive = (item: NavItem) => {
    if (!item.path) return false;
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  return (
    <nav className={cn('w-full px-4 pb-6 pt-2 h-auto flex flex-col items-center', className)}>
      <div
        className="relative w-full max-w-lg bg-[#0d0d0f]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      >
        <div
          ref={scrollRef}
          className="relative flex items-center w-full justify-start gap-1 px-4 h-16 overflow-x-auto no-scrollbar touch-pan-x select-none"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.id}
                onPointerEnter={() => item.path && prefetch(item.path)}
                onClick={() => handleNavClick(item)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 shrink-0 h-14 transition-all duration-500 rounded-2xl',
                  active ? "text-white" : "text-white/30"
                )}
                style={{
                   minWidth: isNarrow ? '60px' : '72px',
                }}
              >
                {/* 🛸 ACTIVE INDICATOR GLOW */}
                {active && (
                  <motion.div
                    layoutId="nav-bg-glow"
                    className="absolute inset-x-1 inset-y-1 rounded-2xl bg-white/[0.05] border border-white/5 z-0"
                    transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center gap-1">
                   <div className="relative">
                      <Icon 
                        className={cn("transition-all duration-300", active ? "scale-110" : "scale-100")} 
                        style={{ 
                          width: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE, 
                          height: isNarrow ? ICON_SIZE_COMPACT : ICON_SIZE,
                          color: active ? '#EB4898' : 'currentColor',
                          filter: active ? 'drop-shadow(0 0 8px rgba(235,72,152,0.4))' : 'none'
                        }} 
                      />
                      
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-[#EB4898] text-[8px] font-black italic flex items-center justify-center text-white border-2 border-[#0d0d0f] shadow-lg">
                          {item.badge}
                        </span>
                      )}
                   </div>

                   {!isNarrow && (
                     <span className={cn(
                       "text-[8px] font-black uppercase tracking-widest italic transition-all duration-300",
                       active ? "opacity-100 translate-y-0" : "opacity-40 translate-y-0.5"
                     )}>
                       {item.label}
                     </span>
                   )}
                </div>

                {/* SENTIENT ACCENT LINE */}
                {active && (
                  <motion.div 
                    layoutId="nav-line"
                    className="absolute bottom-1 w-4 h-[2px] bg-[#EB4898] rounded-full shadow-[0_0_10px_#EB4898]" 
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNavigation.displayName = 'BottomNavigation';
