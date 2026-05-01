import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, UserCircle, Ticket, Radio, Ghost, Zap, SlidersHorizontal, MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useModalStore } from '@/state/modalStore';
import { TAP_SPRING } from './BottomNavigation';
import { AIListingTrigger } from './AIListingTrigger';

interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  onAISearchClick?: () => void;
  onFilterClick?: (e?: React.PointerEvent | React.MouseEvent) => void;
  onBack?: () => void;
  onCenterTap?: () => void;
  className?: string;
  showFilters?: boolean;
  userRole?: 'client' | 'owner' | 'admin';
  transparent?: boolean;
  hideOnScroll?: boolean;
  title?: string;
  showBack?: boolean;
  minimal?: boolean;
}

function TopBarComponent({
  onFilterClick,
  onBack: propOnBack,
  onMessageActivationsClick,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
  showBack,
  onCenterTap,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const setModal = useModalStore(s => s.setModal);

  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();

  const isOwner = userRole === 'owner';
  
  const onBack = propOnBack || (showBack ? () => window.history.length > 2 ? navigate(-1) : navigate(`/${isOwner ? 'owner' : 'client'}/dashboard`) : (activeCategory ? () => setActiveCategory(null) : undefined));

  const glassPillStyle: React.CSSProperties = {
    background: isLight
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(15, 25, 55, 0.55)',
    backdropFilter: 'blur(32px) saturate(210%)',
    WebkitBackdropFilter: 'blur(32px) saturate(210%)',
    borderRadius: '3rem',
    border: 'none',
    boxShadow: isLight
      ? '0 10px 30px -5px rgba(0,0,0,0.1)'
      : '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
    color: isLight ? '#000000' : 'var(--hud-text)',
  };

  const { data: profile } = useQuery({
    queryKey: ['topbar-user-profile', user?.id],
    enabled: !!user?.id,
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <header 
      className={cn(
        "relative w-full transition-all duration-500 pointer-events-none",
        className
      )}
      style={{
        paddingTop: 'calc(var(--safe-top, 0px) + 6px)',
        height: 'calc(var(--top-bar-height) + var(--safe-top, 0px))',
        background: 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-4 flex items-center justify-between relative">
        
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBack ? (
            <motion.button
              transition={TAP_SPRING}
              whileTap={{ scale: 0.9 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="w-9 h-9 flex shrink-0 items-center justify-center rounded-full"
              style={glassPillStyle}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: isLight ? '#000000' : 'var(--hud-text)' }} />
            </motion.button>
          ) : (
            user && (
              <div className="flex items-center gap-2">
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptics.tap();
                    navigate(isOwner ? '/owner/profile' : '/client/profile');
                  }}
                  className="flex shrink-0 items-center gap-2.5 px-2 py-1.5 pr-3.5 rounded-2xl"
                  style={glassPillStyle}
                >
                  <div className="w-7 h-7 rounded-[0.6rem] overflow-hidden shrink-0 flex items-center justify-center relative"
                    style={{
                      background: profile?.avatar_url ? 'transparent' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                      border: 'none',
                    }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ display: profile?.avatar_url ? 'none' : 'flex' }}
                    >
                      <UserCircle className="w-5 h-5" style={{ color: 'var(--hud-text)', opacity: 0.35 }} strokeWidth={1.5} />
                    </div>
                  </div>
                  {profile?.full_name && (
                    <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-80" style={{ color: 'var(--hud-text)' }}>
                      {profile.full_name.split(' ')[0]}
                    </span>
                  )}
                </motion.button>
                
                {/* Brand Logo - The "Heather Bottle" / Glass Pill Logo */}
                <div 
                  className="hidden md:flex h-11 items-center px-5 rounded-full"
                  style={glassPillStyle}
                >
                  <span className="swipess-logo-sm text-lg">Swipess</span>
                </div>
              </div>
            )
          )}

          {/* Mode Switcher — Standalone buttons next to profile */}
          {!minimal && (
            <ModeSwitcher />
          )}
        </div>

        {onCenterTap ? (
          <motion.button
            className="flex-1 h-full pointer-events-auto"
            whileTap={{ opacity: 0.7 }}
            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); haptics.tap(); onCenterTap(); }}
            aria-label="Go to dashboard"
          />
        ) : (
          <div className="flex-1" />
        )}

        {/* RIGHT CLUSTER: Individual Action Pills */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {!minimal && (
            <>
              <motion.button
                transition={TAP_SPRING}
                whileTap={{ scale: 0.9 }}
                onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
                className="w-9 h-9 flex shrink-0 items-center justify-center rounded-full relative overflow-hidden"
                style={{
                  ...glassPillStyle,
                  background: isLight
                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(79, 70, 229, 0.18))'
                    : 'linear-gradient(135deg, rgba(124, 58, 237, 0.32), rgba(79, 70, 229, 0.28))',
                  boxShadow: isLight
                    ? '0 8px 24px -6px rgba(124, 58, 237, 0.4)'
                    : '0 12px 32px -8px rgba(124, 58, 237, 0.5)',
                }}
                aria-label="Tokens"
              >
                <Ticket
                  className="w-4 h-4"
                  style={{
                    color: '#8b5cf6',
                    filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))',
                  }}
                  strokeWidth={2.4}
                />
              </motion.button>

              <motion.button
                transition={TAP_SPRING}
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center p-0.5 relative group overflow-hidden"
                style={glassPillStyle}
                title="Radio"
              >
                <Radio 
                  className="w-5 h-5 text-[var(--hud-text)] transition-colors group-hover:text-orange-500" 
                  strokeWidth={2.5} 
                />
              </motion.button>

              <motion.button
                transition={TAP_SPRING}
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  haptics.tap();
                  navigate(isOwner ? '/owner/dashboard' : '/client/dashboard');
                }}
                className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center p-0.5 relative group overflow-hidden"
                style={glassPillStyle}
                title="Dashboard"
              >
                <Zap 
                  className="w-5 h-5 text-[var(--hud-text)] transition-colors group-hover:text-yellow-500" 
                  strokeWidth={2.5} 
                />
              </motion.button>

              {onFilterClick && (
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    haptics.tap();
                    onFilterClick(e);
                  }}
                  className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center p-0.5 relative group overflow-hidden"
                  style={glassPillStyle}
                  title="Filters"
                >
                  <SlidersHorizontal 
                    className="w-5 h-5 text-[var(--hud-text)] transition-colors group-hover:text-blue-500" 
                    strokeWidth={2.5} 
                  />
                </motion.button>
              )}

              {onMessageActivationsClick && (
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    haptics.tap();
                    onMessageActivationsClick();
                  }}
                  className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center p-0.5 relative group overflow-hidden"
                  style={glassPillStyle}
                  title="Messages & Activations"
                >
                  <MessageCircle 
                    className="w-5 h-5 text-[var(--hud-text)] transition-colors group-hover:text-indigo-500" 
                    strokeWidth={2.5} 
                  />
                </motion.button>
              )}

              <AIListingTrigger glassPillStyle={glassPillStyle} />

              <ThemeToggle glassPillStyle={glassPillStyle} />

              <NotificationPopover glassPillStyle={glassPillStyle} />
            </>
          )}
        </div>
      </div>

      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="nav-active-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="var(--color-brand-accent)" offset="0%" />
            <stop stopColor="var(--color-brand-primary)" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </header>
  );
}

export const TopBar = memo(TopBarComponent);
