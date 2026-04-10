import { memo, useState, useCallback } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, MessageCircle, Crown, FileText, ArrowLeft, Search, Eye, Radio as RadioIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatPriceMXN } from '@/utils/subscriptionPricing';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { STORAGE } from '@/constants/app';
import { haptics } from '@/utils/microPolish';
import { SwipessLogo } from './SwipessLogo';


import { ModeSwitcher } from './ModeSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { NotificationPopover } from './NotificationPopover';
import { useScrollBounce } from '@/hooks/useScrollBounce';


// Tier styling for package cards
const tierConfig = {
  starter: {
    icon: MessageCircle,
    gradient: 'from-purple-500/30 to-purple-600/20',
    border: 'border-purple-500/40',
    iconBg: 'bg-purple-500/20 text-purple-300',
    button: 'bg-purple-600 hover:bg-purple-500 text-white',
  },
  standard: {
    icon: Zap,
    gradient: 'from-blue-500/30 to-blue-600/20',
    border: 'border-blue-500/50 ring-1 ring-blue-500/30',
    iconBg: 'bg-blue-500/20 text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
  premium: {
    icon: Crown,
    gradient: 'from-brand-accent-2/30 to-brand-accent-2/20',
    border: 'border-brand-accent-2/40',
    iconBg: 'bg-brand-accent-2/20 text-pink-300',
    button: 'bg-gradient-to-r from-brand-accent-2 to-[#B0005E] hover:from-pink-500 hover:to-brand-accent-2 text-white',
  },
} as const;

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
  const { unreadCount: _unreadCount } = useUnreadNotifications();
  const { navigate, prefetch: _prefetch } = useAppNavigate();
  const [tokensOpen, setTokensOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const location = useLocation();
  const shouldHide = false;
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();

  // ── LIQUID MOMENTUM: Bounce physics on horizontal header scroll ──
  const headerBounceRef = useScrollBounce({
    maxTilt: 4,
    maxBounce: 2,
    damping: 0.2,
    edgeScale: 0.97,
    childSelector: '> div, > button',
  });

  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';
  const cinematicShadow = isLight ? 'var(--shadow-cinematic-sm)' : 'var(--shadow-cinematic-md)';

  // 🚀 SPEED: Token packages are static, cache them for 24 hours
  const { data: packages } = useQuery({
    queryKey: ['topbar-token-packages', packageCategory],
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('package_category', packageCategory)
        .eq('is_active', true)
        .order('message_activations', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // 🚀 SPEED: User profile is cached forever (invalidated by profile updates elsewhere)
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

  const tierNames: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];

  const handleQuickPurchase = (pkg: any, tier: string) => {
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.message_activations,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole || 'client'}/dashboard`);

    if (pkg.paypal_link) {
      window.open(pkg.paypal_link, '_blank');
      toast({
        title: t('topbar.redirectingPaypal'),
        description: t('topbar.processingPackage', { tier, price: formatPriceMXN(pkg.price) }),
      });
      setTokensOpen(false);
    } else {
      toast({
        title: t('topbar.paymentUnavailable'),
        description: t('topbar.contactSupport'),
        variant: "destructive",
      });
    }
  };

  const handleBack = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    // Use history-based navigation as requested by user
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
    }
  };

  const handleGoHome = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.success();
    navigate('/');
  };

  return (
    <>
      <header
        className={cn(
          'app-header opacity-100 translate-y-0 transform-gpu will-change-transform',
          'bg-transparent', // Pure floating look
          className
        )}
      >

        <div className="max-w-[1400px] mx-auto w-full flex items-center relative z-10 px-3">

          {/* ── Pinned left anchor: avatar / back button only ── */}
          <div className="flex-shrink-0 flex items-center gap-1 relative z-20">
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
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      haptics.select();
                      const profilePath = userRole === 'owner' ? '/owner/profile' : '/client/profile';
                      navigate(profilePath);
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
                </div>
              )}

            {/* Atmospheric mask removed per user request for floating simple buttons */}
          </div>

          {/* ── Horizontally scrollable row: all other buttons ── */}
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
            <div className="flex items-center gap-1.5 flex-nowrap justify-end pl-2">
                {!minimal && (
                  <div className="flex items-center bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-border/10 rounded-full px-1.5 py-1 gap-0.5 shadow-sm">
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
                        >
                          <Zap strokeWidth={1.5} className={cn("h-4 w-4", isLight ? "text-amber-500" : "text-white/70")} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" sideOffset={12} className="w-[min(calc(100vw-1.5rem),380px)] p-0 rounded-[2rem] bg-card border border-border/20 shadow-2xl backdrop-blur-3xl">
                         <Suspense fallback={null}>
                            <MessageActivationPackages onClose={() => setTokensOpen(false)} />
                         </Suspense>
                      </PopoverContent>
                    </Popover>

                    {/* Notifications */}
                    <NotificationPopover />

                    {/* Mode Switcher */}
                    <ModeSwitcher variant="icon" size="sm" />

                    {/* Theme Toggle */}
                    <ThemeToggle className="h-9 w-9" />
                  </div>
                )}
                                  <div className={cn("flex-shrink-0 p-2 rounded-lg", config.iconBg)}>
                                    <Icon className="w-5 h-5" />
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-bold text-foreground text-sm capitalize">{tier}</span>
                                      <span className="text-muted-foreground text-xs">{tokens} {t('topbar.tokens')}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                      <span className="font-bold text-foreground text-base">{formatPriceMXN(pkg.price)}</span>
                                      <span className="text-muted-foreground text-[10px]">({formatPriceMXN(pricePerToken)}/ea)</span>
                                    </div>
                                  </div>

                                  {/* Buy Button */}
                                  <Button
                                    size="sm"
                                    className={cn(
                                      "flex-shrink-0 h-8 px-3 rounded-lg font-semibold text-xs",
                                      config.button
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuickPurchase(pkg, tier);
                                    }}
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    {t('topbar.buy')}
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })
                        ) : (
                          <div className="py-6 text-center">
                            <div className="flex justify-center gap-2 mb-3">
                              {[0, 1, 2].map((i) => (
                                <div key={i} className="h-12 w-full rounded-lg bg-muted animate-pulse" />
                              ))}
                            </div>
                            <p className="text-muted-foreground text-xs">{t('topbar.loadingPackages')}</p>
                          </div>
                        )}
                      </div>

                      {/* Footer: View All link */}
                      <div className="px-4 pb-3 pt-1 border-t border-border">
                        <button
                          className="w-full text-center text-xs text-blue-500 hover:text-blue-400 font-medium py-1.5 transition-colors"
                          onClick={() => {
                            setTokensOpen(false);
                            onMessageActivationsClick?.();
                          }}
                        >
                          {t('topbar.viewAllPackages')}
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>


                  {/* Swipess Radio Button */}
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

                  {/* Notifications Button */}
                  <NotificationPopover />
                </>
              )}

              {/* Minimal Mode Centering Spacer: Balances the back button on the left - REMOVED for clean HUD */}
            </div>
          </div>
          {/* Atmospheric right mask removed */}
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
