import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ChevronLeft, SlidersHorizontal, Radio, Ghost } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';
import { ThemeToggle } from './ThemeToggle';

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
  onBack,
  className,
  userRole,
  transparent: _transparent = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { theme, isLight } = useTheme();

  const isIvanna = theme === 'ivanna-style';
  const isOwner = userRole === 'owner';

  const glassSurfaceStyle: React.CSSProperties = {
    background: _transparent ? 'transparent' : (isIvanna ? 'rgba(255,255,255,0.7)' : (isLight ? 'rgba(255,255,255,0.3)' : 'rgba(15,15,20,0.12)')),
    backdropFilter: _transparent ? 'none' : 'blur(40px) saturate(160%) contrast(1.1)',
    WebkitBackdropFilter: _transparent ? 'none' : 'blur(40px) saturate(160%) contrast(1.1)',
    border: _transparent ? 'none' : (isIvanna ? '1px solid rgba(140, 180, 230, 0.4)' : `1px solid ${isLight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}`),
    borderRadius: isIvanna ? '2rem' : '1.8rem',
    boxShadow: _transparent ? 'none' : (isIvanna ? '0 10px 30px rgba(0,0,0,0.1)' : (isLight
      ? '0 10px 25px rgba(0,0,0,0.04), inset 0 0 15px rgba(255,255,255,0.2)'
      : '0 20px 40px rgba(0,0,0,0.45), inset 0 0 15px rgba(255,255,255,0.05)')),
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
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 pointer-events-none",
        _transparent ? "h-20" : "h-16",
        className
      )}
      style={{
        paddingTop: 'var(--safe-top)',
        height: _transparent ? 'auto' : 'calc(var(--top-bar-height) + var(--safe-top))'
      }}
    >
      <div className="h-full w-full max-w-screen-xl mx-auto px-4 flex items-center justify-between relative">
        
        {/* LEFT CLUSTER: Profile & Back (Unified Pill) */}
        <div className="flex-shrink-0 flex items-center pointer-events-none">
          {(!minimal || onBack) && (
            <div 
              className={cn("flex items-center gap-1.5 pointer-events-auto px-1.5 py-1.5 shadow-2xl transition-all duration-300")} 
              style={{
                ...glassSurfaceStyle,
                background: isIvanna ? 'rgba(255, 252, 240, 0.65)' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,20,0.12)'),
                borderRadius: '2rem',
                border: isIvanna ? '1px solid rgba(140, 180, 230, 0.4)' : '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {onBack && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptics.tap();
                    onBack();
                  }}
                  className="w-10 h-10 flex items-center justify-center p-0"
                >
                  <ChevronLeft className={cn("w-6 h-6", isLight ? "text-foreground" : "text-white")} />
                </motion.button>
              )}
              
              {user && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptics.tap();
                    navigate(isOwner ? '/owner/profile' : '/client/profile');
                  }}
                  className="flex items-center gap-2 pr-4 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-primary/60 shadow-lg ml-0.5">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Ghost className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                  </div>
                  {profile?.full_name && (
                    <span className={cn(
                      "text-[12px] font-black uppercase italic tracking-tight whitespace-nowrap flex-shrink-0 max-w-[11ch] truncate",
                      isLight ? "text-foreground" : "text-white/90"
                    )}>
                      {profile.full_name.split(' ')[0]}
                    </span>
                  )}
                </motion.button>
              )}

              {!minimal && isOwner && (
                <div className="flex items-center px-1">
                  <ModeSwitcher variant="icon" size="sm" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* LOGO: Center Tap Target */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-24 z-10 pointer-events-auto touch-manipulation cursor-pointer flex items-center justify-center"
          style={{ WebkitTapHighlightColor: 'transparent' }}
          onClick={() => {
            haptics.tap();
            navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
          }}
          aria-label="Go to dashboard"
        />

        <div className="flex-1 min-w-0" />

        {/* RIGHT CLUSTER: Actions (Unified Pill) */}
        <div className="flex-shrink-0 flex items-center pointer-events-none">
          {!minimal && (
            <div 
              className={cn("flex items-center gap-1.5 pointer-events-auto px-1.5 py-1.5 shadow-2xl transition-all duration-300")} 
              style={{
                ...glassSurfaceStyle,
                background: isIvanna ? 'rgba(255, 252, 240, 0.65)' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,20,0.12)'),
                borderRadius: '2rem',
                border: isIvanna ? '1px solid rgba(140, 180, 230, 0.4)' : '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptics.tap();
                  if (_onFilterClick) _onFilterClick(e);
                }}
                className="w-10 h-10 flex items-center justify-center p-0"
              >
                <SlidersHorizontal 
                  className={cn("w-5 h-5", isIvanna ? "text-black" : (isLight ? "text-foreground" : "text-white"))} 
                  strokeWidth={2.5} 
                />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
                className="w-10 h-10 flex items-center justify-center p-0"
              >
                <Radio 
                  className={cn("w-5 h-5", isLight ? "text-brand-primary" : "text-brand-primary")} 
                  strokeWidth={2.5} 
                />
              </motion.button>

              <div className="flex items-center">
                <ThemeToggle />
              </div>
              
              <div className="flex items-center">
                <NotificationPopover />
              </div>
            </div>
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
