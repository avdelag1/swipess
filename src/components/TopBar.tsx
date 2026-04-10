import { memo, useState, useCallback, Suspense, lazy } from 'react';

const MessageActivationPackages = lazy(() => import('./MessageActivationPackages').then(module => ({ default: module.MessageActivationPackages })));
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowLeft, Sun, Moon, Radio as RadioIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
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
  className,
  userRole,
  title,
  showBack = false,
  minimal = false,
}: TopBarProps) {
  const { navigate } = useAppNavigate();
  const [tokensOpen, setTokensOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isLight = theme === 'light';

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

  // Pages where tapping the center logo should NOT navigate (already on dashboard)
  const isDashboard =
    location.pathname === '/client/dashboard' ||
    location.pathname === '/owner/dashboard';

  const handleLogoTap = useCallback((e: React.PointerEvent) => {
    if (isDashboard) return;
    e.preventDefault();
    e.stopPropagation();
    haptics.success();
    const dashPath = userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard';
    navigate(dashPath);
  }, [isDashboard, userRole, navigate]);

  const handleBack = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
    }
  }, [navigate, userRole]);

  // Theme toggle handler
  const handleThemeToggle = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    setTheme(isLight ? 'dark' : 'light', { x: e.clientX, y: e.clientY });
  }, [isLight, setTheme]);

  // Navigate to profile
  const handleProfileTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.select();
    navigate(userRole === 'owner' ? '/owner/profile' : '/client/profile');
  }, [navigate, userRole]);

  // Navigate to radio
  const handleRadioTap = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    navigate('/radio');
  }, [navigate]);

  return (
    <>
      <header
        className={cn(
          'app-header opacity-100 translate-y-0 transform-gpu will-change-transform',
          'bg-transparent',
          className
        )}
      >
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between relative z-10 px-3 gap-2 pointer-events-auto">

          {/* ── LEFT: Back? → Avatar → Mode Switcher → Tokens ── */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center z-50 pointer-events-auto touch-manipulation"
                style={{ border: 'none', WebkitTapHighlightColor: 'transparent' }}
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
                  onPointerDown={handleProfileTap}
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

                {/* Left pill: Mode Switcher + Tokens (NO FRAME) */}
                <div className="flex items-center gap-0.5">
                  {/* Mode Switcher (client ↔ owner) */}
                  <ModeSwitcher variant="icon" size="sm" />

                  {/* Token Packages — use onClick for Radix Dialog compatibility */}
                  <Dialog open={tokensOpen} onOpenChange={setTokensOpen}>
                    <DialogTrigger asChild>
                      <button
                        className={cn(
                          "relative h-9 w-9 flex items-center justify-center flex-shrink-0",
                          "transition-all duration-150 ease-out rounded-full",
                          "hover:scale-110 active:scale-90",
                          "touch-manipulation focus:outline-none",
                        )}
                        style={{ background: 'transparent', border: 'none', WebkitTapHighlightColor: 'transparent' }}
                        aria-label="Token packages"
                      >
                        <Zap strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-amber-500" : "text-white/70")} />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-[min(calc(100vw-2rem),400px)] p-0 rounded-[2rem] bg-[#111] sm:bg-card border border-white/10 sm:border-border/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden pointer-events-auto !max-h-[85vh]">
                      <Suspense fallback={null}>
                        <MessageActivationPackages userRole={userRole} onClose={() => setTokensOpen(false)} />
                      </Suspense>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>

          {/* ── CENTER: Logo / Title — tap goes to dashboard ── */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            {(!isDashboard || title) && (
              <motion.button
                onPointerDown={handleLogoTap}
                whileTap={!isDashboard ? { scale: 0.95 } : {}}
                className={cn(
                  "flex items-center justify-center transition-opacity touch-manipulation",
                  isDashboard ? "cursor-default opacity-100" : "cursor-pointer opacity-90 hover:opacity-100"
                )}
                aria-label={isDashboard ? "Swipess" : "Go to dashboard"}
                style={{ WebkitTapHighlightColor: 'transparent', border: 'none', background: 'transparent' }}
              >
                {title ? (
                  <span className={cn("text-base font-bold truncate", isLight ? "text-foreground" : "text-white/90")}>
                    {title}
                  </span>
                ) : (
                  <SwipessLogo size="xs" variant="gradient" />
                )}
              </motion.button>
            )}
          </div>

          {/* ── RIGHT: Theme (Sun/Moon) + Notifications + Radio ── */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {!minimal && (
              <div className="flex items-center gap-0.5">

                {/* ☀️/🌙 Theme Toggle */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onPointerDown={handleThemeToggle}
                  className={cn(
                    "relative h-9 w-9 flex items-center justify-center flex-shrink-0",
                    "touch-manipulation focus:outline-none rounded-full",
                  )}
                  style={{ background: 'transparent', border: 'none', WebkitTapHighlightColor: 'transparent' }}
                  aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={theme}
                      initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                      {isLight ? (
                        <Sun strokeWidth={1.5} className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Moon strokeWidth={1.5} className="h-4 w-4 text-white/70" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>

                {/* Notifications */}
                <NotificationPopover />

                {/* Radio */}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onPointerDown={handleRadioTap}
                  className={cn(
                    "relative h-9 w-9 flex items-center justify-center flex-shrink-0",
                    "touch-manipulation focus:outline-none rounded-full",
                  )}
                  style={{ background: 'transparent', border: 'none', WebkitTapHighlightColor: 'transparent' }}
                  aria-label="Go to radio"
                >
                  <RadioIcon strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-rose-500" : "text-white/70")} style={{ filter: isLight ? 'drop-shadow(0 0 6px rgba(244,63,94,0.35))' : 'none' }} />
                </motion.button>
              </div>
            )}
          </div>

        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
