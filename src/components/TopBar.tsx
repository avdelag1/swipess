import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, UserCircle, Ticket } from 'lucide-react';
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
      ? 'rgba(255, 255, 255, 0.85)'
      : 'rgba(10, 15, 35, 0.45)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '1.25rem',
    border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.03)' : '0 4px 16px rgba(0,0,0,0.2)',
    pointerEvents: 'auto',
    color: isLight ? '#000000' : 'var(--hud-text)',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
              whileTap={{ scale: 0.95 }}
              onClick={() => { haptics.tap(); onBack(); }}
              className="px-2.5 flex shrink-0 items-center justify-center rounded-[1rem]"
              style={glassPillStyle}
            >
              <ChevronLeft className="w-4 h-4" style={{ color: isLight ? '#000000' : 'var(--hud-text)' }} />
            </motion.button>
          ) : (
            user && (
              <div className="flex items-center gap-2">
                <motion.button
                  transition={TAP_SPRING}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    haptics.tap();
                    navigate(isOwner ? '/owner/profile' : '/client/profile');
                  }}
                  className="flex shrink-0 items-center gap-2 px-2.5 rounded-[1rem]"
                  style={glassPillStyle}
                >
                  <div className="w-6 h-6 rounded-[0.5rem] overflow-hidden shrink-0 flex items-center justify-center relative"
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
                      <UserCircle className="w-4 h-4" style={{ color: 'var(--hud-text)', opacity: 0.35 }} strokeWidth={1.5} />
                    </div>
                  </div>
                  {profile?.full_name && (
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] opacity-80" style={{ color: 'var(--hud-text)' }}>
                      {profile.full_name.split(' ')[0]}
                    </span>
                  )}
                </motion.button>
                

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
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics.tap(); setModal('showTokensModal', true); }}
                className="w-8 flex shrink-0 items-center justify-center rounded-[1rem] relative overflow-hidden"
                style={{
                  ...glassPillStyle,
                  background: isLight
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'linear-gradient(135deg, rgba(124, 58, 237, 0.42), rgba(79, 70, 229, 0.38))',
                  border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.08)',
                }}
                aria-label="Tokens"
              >
                <Ticket
                  className="w-3.5 h-3.5"
                  style={{
                    color: isLight ? '#000000' : '#8b5cf6',
                    filter: isLight ? 'none' : 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))',
                  }}
                  strokeWidth={2.4}
                />
              </motion.button>

              <ThemeToggle glassPillStyle={glassPillStyle} />

              {isOwner && (
                <AIListingTrigger glassPillStyle={glassPillStyle} />
              )}

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
