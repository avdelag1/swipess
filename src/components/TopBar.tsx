import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, UserCircle } from 'lucide-react';
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
  onFilterClick: _onFilterClick,
  onBack: propOnBack,
  showBack,
  onCenterTap,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  
  const activeCategory = useFilterStore(s => s.activeCategory);
  const { setActiveCategory } = useFilterActions();



  const isOwner = userRole === 'owner';
  
  const onBack = propOnBack || (showBack ? () => window.history.length > 2 ? navigate(-1) : navigate(`/${isOwner ? 'owner' : 'client'}/dashboard`) : (activeCategory ? () => setActiveCategory(null) : undefined));

  const glassPillStyle: React.CSSProperties = {
    background: isLight 
      ? 'rgba(255, 255, 255, 0.75)' 
      : 'rgba(15, 25, 55, 0.45)', // Richer blue glass for Swipess Dark
    backdropFilter: 'blur(36px) saturate(280%)',
    WebkitBackdropFilter: 'blur(36px) saturate(280%)',
    borderRadius: '3rem',
    border: 'none',
    boxShadow: isLight 
      ? '0 12px 40px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.4)' 
      : '0 25px 70px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05)',
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
        paddingTop: 'var(--safe-top)',
        height: 'calc(var(--top-bar-height) + var(--safe-top))',
        background: 'transparent',
        border: 'none'
      }}
    >
      <div className="h-full w-full px-4 flex items-center justify-between relative">
        
        <div className="flex items-center gap-2">
          {onBack ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
               onClick={() => { haptics.tap(); onBack(); }}
              className="w-11 h-11 flex shrink-0 items-center justify-center rounded-full"
              style={glassPillStyle}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: isLight ? '#000000' : 'var(--hud-text)' }} />
            </motion.button>
          ) : (
            user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptics.tap();
                  navigate(isOwner ? '/owner/profile' : '/client/profile');
                }}
              className="flex shrink-0 items-center gap-3 px-2.5 py-2 pr-4 rounded-2xl"
              style={glassPillStyle}
            >
              {/* Rounded Square avatar — 'window' style */}
              <div className="w-8 h-8 rounded-[0.7rem] overflow-hidden shrink-0 flex items-center justify-center relative"
                style={{
                  background: profile?.avatar_url ? 'transparent' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                  border: isLight ? '1.5px solid rgba(0,0,0,0.06)' : '1.5px solid rgba(255,255,255,0.1)',
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
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!minimal && (
            <>
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


