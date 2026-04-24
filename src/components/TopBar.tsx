import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, Radio, UserCircle } from 'lucide-react';
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
import { useModalStore } from '@/state/modalStore';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { AIListingTrigger } from './AIListingTrigger';
import { SwipessLogo } from './SwipessLogo';

interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  onAISearchClick?: () => void;
  onFilterClick?: (e?: React.PointerEvent | React.MouseEvent) => void;
  onBack?: () => void;
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
  
  const onBack = propOnBack || (activeCategory ? () => setActiveCategory(null) : undefined);

  const glassPillStyle: React.CSSProperties = {
    background: 'var(--hud-bg)',
    backdropFilter: 'blur(32px) saturate(210%)',
    WebkitBackdropFilter: 'blur(32px) saturate(210%)',
    borderRadius: '3rem',
    border: isLight ? '1.5px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.08)',

    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.03)' : '0 8px 32px rgba(0, 0, 0, 0.15)',
    pointerEvents: 'auto',
    color: 'var(--hud-text)',
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
        "absolute top-0 left-0 right-0 z-[10005] transition-all duration-700 pointer-events-none",
        _transparent ? "h-20" : "h-16",
        className
      )}
      style={{
        paddingTop: 'var(--safe-top)',
        height: 'calc(var(--top-bar-height) + var(--safe-top))'
      }}
    >
      <div className="h-full w-full px-4 flex items-center justify-between relative">
        
        <div className="flex items-center gap-2">
          {onBack ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); haptics.tap(); onBack(); }}
              className="w-11 h-11 flex shrink-0 items-center justify-center rounded-full"
              style={glassPillStyle}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--hud-text)' }} />
            </motion.button>
          ) : (
            user && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onPointerDown={(e) => {
                e.preventDefault(); e.stopPropagation();
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
                <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80" style={{ color: 'var(--hud-text)' }}>
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

        <div className="flex-1 flex justify-center">
          <SwipessLogo size="sm" variant="transparent" className="opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* RIGHT CLUSTER: Individual Action Pills */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!minimal && (
            <>
              <AIListingTrigger glassPillStyle={glassPillStyle} />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics.impact('light'); navigate('/radio'); }}
                className={cn(
                  glassPillStyle,
                  "p-2 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300",
                  "text-white/80 hover:text-white"
                )}
                aria-label="Sentient Radio"
              >
                <Radio className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>

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


