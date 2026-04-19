import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { motion } from 'framer-motion';
import { ArrowLeft, Radio } from 'lucide-react';
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
  onFilterClick?: () => void;
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
  onNotificationsClick: _onNotificationsClick,
  onMessageActivationsClick: _onMessageActivationsClick,
  onFilterClick: _onFilterClick,
  className,
  showFilters: _showFilters,
  userRole,
  transparent: _transparent = false,
  hideOnScroll: _hideOnScroll = false,
  title: _title,
  showBack = false,
  minimal = false,
}: TopBarProps) {
  const { navigate, prefetch: _prefetch } = useAppNavigate();
  const { user } = useAuth();
  const { theme, isLight } = useTheme();

  const glassSurfaceStyle: React.CSSProperties = {
    background: _transparent ? 'transparent' : (isLight ? 'rgba(255,255,255,0.45)' : 'rgba(25,25,30,0.3)'),
    backdropFilter: _transparent ? 'none' : 'blur(16px) saturate(1.4)',
    WebkitBackdropFilter: _transparent ? 'none' : 'blur(16px) saturate(1.4)',
    border: _transparent ? 'none' : `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
    boxShadow: _transparent ? 'none' : (isLight
      ? '0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.2)'
      : '0 8px 22px rgba(0,0,0,0.4), inset 0 0.5px 1px rgba(255,255,255,0.1)'),
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

  const handleBack = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
    }
  }, [navigate, userRole]);

  return (
    <>
      <header
        className={cn(
          'app-header pointer-events-none opacity-100 translate-y-0 transform-gpu will-change-transform bg-transparent',
          className
        )}
      >
        <div className="max-w-[1400px] mx-auto w-full flex items-center relative z-10 px-3 pointer-events-none">
          <div className="flex-shrink-0 flex items-center gap-1.5 relative z-20 pointer-events-none">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center z-50 pointer-events-auto touch-manipulation transition-all hover:scale-105 active:scale-95"
                style={{
                  ...glassSurfaceStyle,
                  background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.12)',
                  borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,107,53,0.4)',
                }}
                aria-label="Go back"
              >
                <ArrowLeft className={cn("w-5 h-5", isLight ? "text-foreground" : "text-white")} strokeWidth={2} />
              </motion.button>
            )}

            {user && !minimal && (
                <motion.button
                whileTap={{ scale: 0.92 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptics.select();
                  navigate(userRole === 'owner' ? '/owner/profile' : '/client/profile');
                }}
                className={cn(
                  "flex-shrink-0 focus:outline-none z-50 relative pointer-events-auto cursor-pointer touch-manipulation p-0 inline-flex items-center gap-2 rounded-2xl pl-1.5 pr-3.5 py-1.5 border transition-all duration-300 w-auto",
                  isLight 
                    ? "bg-white/80 border-black/10 shadow-sm" 
                    : "bg-black/60 border-white/20 shadow-xl"
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Go to profile"
              >
                <Avatar className="h-[32px] w-[32px] md:h-[38px] md:w-[38px] rounded-xl overflow-hidden cursor-pointer border-none ring-0 shadow-lg flex-shrink-0">
                  <AvatarImage
                    src={profile?.avatar_url || ''}
                    className="object-cover w-full h-full"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <AvatarFallback className={cn(
                    "text-sm font-black uppercase w-full h-full flex items-center justify-center",
                    isLight
                      ? "bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 text-foreground/90"
                      : "bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-foreground/80"
                  )}>
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {profile?.full_name && (
                  <span className={cn(
                    "text-[13px] font-black uppercase italic tracking-tight whitespace-nowrap flex-shrink-0 max-w-[11ch] truncate",
                    isLight ? "text-foreground" : "text-white/90"
                  )}>
                    {profile.full_name.split(' ')[0].substring(0, 12)}
                  </span>
                )}
              </motion.button>
            )}

            {!minimal && (
              <div className="flex-shrink-0 ml-2 pointer-events-auto rounded-xl overflow-hidden border border-white/10" style={glassSurfaceStyle}>
                <ModeSwitcher variant="icon" size="sm" />
              </div>
            )}
          </div>

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-20 z-10 pointer-events-auto touch-manipulation cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => {
              haptics.tap();
              navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
            }}
            aria-label="Go to dashboard"
          />

          <div className="flex-1 min-w-0" />

          <div
            className="flex-shrink-0 flex items-center gap-1.5 pointer-events-none"
          >
            {!minimal && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptics.tap();
                  navigate('/radio');
                }}
              >
                <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center touch-manipulation pointer-events-auto bg-brand-primary/10 border border-brand-primary/30" style={glassSurfaceStyle}>
                  <Radio className={cn("w-5 h-5", isLight ? "text-brand-primary" : "text-brand-primary")} strokeWidth={2} />
                </div>
              </motion.button>
            )}
            {!minimal && (
              <div className="rounded-full overflow-hidden pointer-events-auto" style={glassSurfaceStyle}>
                <ThemeToggle />
              </div>
            )}
            {!minimal && (
              <div className="rounded-full overflow-hidden pointer-events-auto" style={glassSurfaceStyle}>
                <NotificationPopover />
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
