import { memo, useCallback, useRef } from 'react';
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

  // ── Swipe-vs-tap detection for scrollable header ──
  const isDraggingHeader = useRef(false);
  const headerTouchStart = useRef<{ x: number; y: number } | null>(null);

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingHeader.current = false;
    headerTouchStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleHeaderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!headerTouchStart.current) return;
    const dx = Math.abs(e.clientX - headerTouchStart.current.x);
    const dy = Math.abs(e.clientY - headerTouchStart.current.y);
    if (dx > 8 || dy > 8) {
      isDraggingHeader.current = true;
    }
  }, []);

  const handleHeaderPointerUp = useCallback(() => {
    headerTouchStart.current = null;
  }, []);

  /** Only fire action if user tapped (not scrolled) */
  const guardedClick = useCallback((action: () => void) => {
    return () => {
      if (isDraggingHeader.current) {
        isDraggingHeader.current = false;
        return;
      }
      action();
    };
  }, []);

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

          {/* ── Right side: tokens, radio, theme, ID, notifications ── */}
          <div className="flex-shrink-0 relative pointer-events-none">
            {/* Glassmorphic fade masks — blur only, no dark shade, vanishing edges */}
            <div
              className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 z-30"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
              }}
            />
            <div
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 z-30"
              style={{
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
              }}
            />
            <div
              ref={headerBounceRef}
              className="overflow-x-auto pointer-events-none"
              onPointerDown={handleHeaderPointerDown}
              onPointerMove={handleHeaderPointerMove}
              onPointerUp={handleHeaderPointerUp}
              style={{
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-x',
                maxWidth: '200px',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-3 flex-nowrap justify-end pl-1 pr-1 [&>*]:pointer-events-auto">
                {!minimal && (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        haptics.tap();
                        useModalStore.getState().setModal('showTokensModal', true);
                      }}
                      className={cn(
                        'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full pointer-events-auto touch-manipulation transition-all',
                        '!bg-transparent !border-none !shadow-none hover:scale-105 active:scale-95'
                      )}
                      aria-label="View tokens"
                    >
                      <Coins className="w-4 h-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]" strokeWidth={1.8} />
                    </motion.button>

                    <Button
                      variant="ghost"
                      className={cn(
                        'relative h-8 w-8 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none',
                        'hover:scale-105 active:scale-95 group',
                        'touch-manipulation flex items-center justify-center flex-shrink-0',
                      )}
                      onClick={guardedClick(() => {
                        haptics.tap();
                        navigate('/radio');
                      })}
                      aria-label="Go to radio"
                    >
                      <RadioIcon strokeWidth={1.5} className={cn('h-4 w-4', isLight ? 'text-rose-500' : 'text-white/70')} style={{ filter: isLight ? 'drop-shadow(0 0 6px rgba(244,63,94,0.35))' : 'none' }} />
                    </Button>

                    <ThemeToggle />

                    {userRole !== 'owner' && (
                      <Button
                        variant="ghost"
                        className={cn(
                          'relative h-8 w-8 px-0 transition-all duration-150 ease-out !bg-transparent !border-none !shadow-none',
                          'hover:scale-105 active:scale-95 group',
                          'touch-manipulation flex items-center justify-center flex-shrink-0',
                        )}
                        onClick={guardedClick(() => {
                          haptics.select();
                          useModalStore.getState().setModal('showVapId', true);
                        })}
                        aria-label="Resident ID"
                      >
                        <IdCard strokeWidth={1.5} className={cn('h-4 w-4', isLight ? 'text-primary' : 'text-white/70')} />
                      </Button>
                    )}

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
