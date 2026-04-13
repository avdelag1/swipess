import { memo, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coins, ArrowLeft, Radio as RadioIcon, IdCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { ModeSwitcher } from './ModeSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { NotificationPopover } from './NotificationPopover';
import { useScrollBounce } from '@/hooks/useScrollBounce';
import { useModalStore } from '@/state/modalStore';


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
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();
  

  const headerBounceRef = useScrollBounce({
    maxTilt: 4,
    maxBounce: 2,
    damping: 0.2,
    edgeScale: 0.97,
    childSelector: '> div, > button',
  });

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
          'app-header opacity-100 translate-y-0 transform-gpu will-change-transform bg-transparent',
          className
        )}
      >
        <div className="max-w-[1400px] mx-auto w-full flex items-center relative z-10 px-3">

          {/* ── Pinned left: avatar + mode switcher + token badge ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5 relative z-20">
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
              <>
                {/* Avatar */}
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

                {/* Mode Switcher — pinned next to avatar */}
                <div className="flex-shrink-0">
                  <ModeSwitcher variant="icon" size="sm" />
                </div>

                {/* Token Badge — icon only */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    haptics.tap();
                    useModalStore.getState().setModal('showTokensModal', true);
                  }}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full touch-manipulation transition-all",
                    isLight
                      ? "bg-amber-500/10 hover:bg-amber-500/15"
                      : "bg-white/[0.06] hover:bg-white/[0.10]"
                  )}
                  aria-label="View tokens"
                >
                  <Coins className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
                </motion.button>
              </>
            )}
          </div>

          {/* ── Horizontally scrollable row: remaining action buttons ── */}
          <div className="flex-1 min-w-0 relative">
            <div
              ref={headerBounceRef}
              className="overflow-x-auto"
              style={{
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 flex-nowrap justify-end pl-2">
                {!minimal && (
                  <>
                    {/* Radio */}
                    <Button
                      variant="ghost"
                      className={cn(
                        "relative h-8 w-8 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none",
                        "hover:scale-105 active:scale-95 group",
                        "touch-manipulation flex items-center justify-center flex-shrink-0",
                      )}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        haptics.tap();
                        navigate('/radio');
                      }}
                      aria-label="Go to radio"
                    >
                      <RadioIcon strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-rose-500" : "text-white/70")} style={{ filter: isLight ? 'drop-shadow(0 0 6px rgba(244,63,94,0.35))' : 'none' }} />
                    </Button>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Resident ID Card (Client only) */}
                    {userRole !== 'owner' && (
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative h-8 w-8 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none",
                          "hover:scale-105 active:scale-95 group",
                          "touch-manipulation flex items-center justify-center flex-shrink-0",
                        )}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          haptics.select();
                          useModalStore.getState().setModal('showVapId', true);
                        }}
                        aria-label="Resident ID"
                      >
                        <IdCard strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-primary" : "text-white/70")} />
                      </Button>
                    )}

                    {/* Notifications */}
                    <NotificationPopover />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
