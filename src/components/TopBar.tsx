import { memo, useState, useCallback, Suspense, lazy } from 'react';

const MessageActivationPackages = lazy(() => import('./MessageActivationPackages').then(module => ({ default: module.MessageActivationPackages })));
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, MessageCircle, Crown, ArrowLeft, Search, Radio as RadioIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { SwipessLogo } from './SwipessLogo';
import { ModeSwitcher } from './ModeSwitcher';
import { NotificationPopover } from './NotificationPopover';
import { useQuery } from '@tanstack/react-query';

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
  onFilterClick,
  className,
  showFilters,
  userRole,
  transparent = false,
  hideOnScroll: _hideOnScroll = false,
  title,
  showBack = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const [tokensOpen, setTokensOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();

  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';

  // 🚀 SPEED: User profile is cached forever
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

  // Pages where tapping the center logo should NOT navigate (you're already on the dashboard)
  const isDashboard =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard';

  const handleLogoTap = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    if (isDashboard) return;
    e.preventDefault();
    e.stopPropagation();
    haptics.success();
    const dashPath = userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard';
    navigate(dashPath);
  }, [isDashboard, userRole, navigate]);

  const handleBack = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
    }
  };

  const handleFilterNav = useCallback(() => {
    haptics.tap();
    if (onFilterClick) {
      onFilterClick();
    } else {
      navigate(userRole === 'owner' ? '/owner/filters' : '/client/filters');
    }
  }, [onFilterClick, userRole, navigate]);

  return (
    <>
      <header
        className={cn(
          'app-header opacity-100 translate-y-0 transform-gpu will-change-transform',
          'bg-transparent',
          className
        )}
      >
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between relative z-10 px-3 gap-2">

          {/* ── LEFT ANCHOR: Back? → Avatar → Mode Switcher → Tokens ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center z-50 pointer-events-auto touch-manipulation transition-all"
                style={{ border: 'none' }}
                aria-label="Go back"
              >
                <ArrowLeft className={cn("w-5 h-5", isLight ? "text-foreground" : "text-white/90")} strokeWidth={1.8} />
              </motion.button>
            )}

            {user && !minimal && (
              <div className="flex items-center gap-1.5">
                {/* Avatar → Profile */}
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

                {/* Left pill: Mode Switcher + Tokens */}
                <div className="flex items-center bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-border/10 rounded-full px-1.5 py-1 gap-0.5 shadow-sm">
                  {/* Mode Switcher (client ↔ owner) */}
                  <ModeSwitcher variant="icon" size="sm" />

                  {/* Token Packages */}
                  <Popover open={tokensOpen} onOpenChange={setTokensOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative h-9 w-9 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none",
                          "hover:scale-110 active:scale-92 group focus-visible:ring-0",
                          "touch-manipulation flex items-center justify-center flex-shrink-0",
                        )}
                        onPointerDown={(e) => { e.preventDefault(); haptics.tap(); setTokensOpen(!tokensOpen); }}
                        aria-label="Token packages"
                      >
                        <Zap strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-amber-500" : "text-white/70")} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={12} className="w-[min(calc(100vw-1.5rem),380px)] p-0 rounded-[2rem] bg-card border border-border/20 shadow-2xl backdrop-blur-3xl">
                      <Suspense fallback={null}>
                        <MessageActivationPackages onClose={() => setTokensOpen(false)} />
                      </Suspense>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: Logo / Title — taps go to dashboard (if not already there) ── */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <motion.button
              onPointerDown={handleLogoTap}
              whileTap={!isDashboard ? { scale: 0.95 } : {}}
              className={cn(
                "flex items-center justify-center transition-opacity touch-manipulation",
                isDashboard ? "cursor-default opacity-100" : "cursor-pointer opacity-90 hover:opacity-100"
              )}
              aria-label={isDashboard ? "Swipess" : "Go to dashboard"}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {title ? (
                <span className={cn("text-base font-bold truncate", isLight ? "text-foreground" : "text-white/90")}>
                  {title}
                </span>
              ) : (
                <SwipessLogo size="xs" variant="gradient" />
              )}
            </motion.button>
          </div>

          {/* ── RIGHT ANCHOR: Filter + Notifications + Radio ── */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {!minimal && (
              <div className="flex items-center bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-border/10 rounded-full px-1.5 py-1 gap-0.5 shadow-sm">

                {/* Filter / Search */}
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-9 w-9 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none",
                    "hover:scale-110 active:scale-92 focus-visible:ring-0",
                    "touch-manipulation flex items-center justify-center flex-shrink-0",
                  )}
                  onPointerDown={(e) => { e.preventDefault(); handleFilterNav(); }}
                  aria-label="Filters"
                >
                  <Filter strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-foreground/70" : "text-white/70")} />
                </Button>

                {/* Notifications */}
                <NotificationPopover />

                {/* Radio */}
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-9 w-9 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none",
                    "hover:scale-110 active:scale-92 group focus-visible:ring-0",
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
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
