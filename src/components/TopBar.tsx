import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';


interface TopBarProps {
  onNotificationsClick?: () => void;
  onMessageActivationsClick?: () => void;
  onAISearchClick?: () => void;
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
  onMessageActivationsClick,
  className,
  showFilters,
  userRole,
  transparent = false,
  hideOnScroll: _hideOnScroll = false,
  title,
  showBack = false,
  minimal = false,
}: TopBarProps) {
  const { navigate, prefetch: _prefetch } = useAppNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();

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

          {/* ── Left pinned: avatar + dashboard mode switcher ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5 relative z-20 pointer-events-none">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center z-50 pointer-events-auto touch-manipulation"
                style={{ border: 'none' }}
                aria-label="Go back"
              >
                <ArrowLeft className={cn("w-5 h-5", isLight ? "text-foreground" : "text-white/90")} strokeWidth={1.8} />
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
                className="flex-shrink-0 focus:outline-none z-50 relative pointer-events-auto cursor-pointer touch-manipulation p-0"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Go to profile"
              >
                <Avatar className="h-[36px] w-[36px] rounded-full overflow-hidden cursor-pointer border-none ring-0 shadow-none">
                  <AvatarImage
                    src={profile?.avatar_url || ''}
                    className="object-cover w-full h-full rounded-full"
                    loading="eager"
                    fetchPriority="high"
                  />
                  <AvatarFallback className={cn(
                    "text-sm font-black uppercase rounded-full w-full h-full flex items-center justify-center",
                    isLight
                      ? "bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 text-foreground/90"
                      : "bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-foreground/80"
                  )}>
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            )}

            {!minimal && (
              <div className="flex-shrink-0 pointer-events-auto">
                <ModeSwitcher variant="icon" size="sm" />
              </div>
            )}
          </div>

          {/* ── Center tap: dashboard shortcut ── */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-20 z-10 pointer-events-auto touch-manipulation cursor-pointer"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => {
              haptics.tap();
              navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
            }}
            aria-label="Go to dashboard"
          />

          {/* ── Spacer ── */}
          <div className="flex-1 min-w-0" />

          {/* ── Right side: notifications only ── */}
          <div className="flex-shrink-0 flex items-center gap-2 pointer-events-auto">
            {!minimal && (
              <NotificationPopover />
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
