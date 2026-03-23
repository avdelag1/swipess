import { memo, useState } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, MessageCircle, Crown, FileText, ArrowLeft } from 'lucide-react';
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
import { prefetchRoute } from '@/utils/routePrefetcher';

import { QuickFilterDropdown } from './QuickFilterDropdown';
import { ModeSwitcher } from './ModeSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { NotificationPopover } from './NotificationPopover';

import { useScrollDirection } from '@/hooks/useScrollDirection';
import { SwipessLogo } from './SwipessLogo';

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
}

function TopBarComponent({
  onNotificationsClick: _onNotificationsClick,
  onMessageActivationsClick,
  className,
  showFilters,
  userRole,
  transparent = false,
  hideOnScroll = false,
  title,
  showBack = false,
}: TopBarProps) {
  const { unreadCount } = useUnreadNotifications();
  const { navigate } = useAppNavigate();
  const [tokensOpen, setTokensOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const location = useLocation();
  const { isVisible } = useScrollDirection({ 
    threshold: 25, 
    showAtTop: true,
    resetTrigger: location.pathname
  });
  const shouldHide = hideOnScroll && !isVisible;
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { t } = useTranslation();

  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';
  const cinematicShadow = isLight ? 'var(--shadow-cinematic-sm)' : 'var(--shadow-cinematic-md)';

  // Fetch the three token packages
  const { data: packages } = useQuery({
    queryKey: ['topbar-token-packages', packageCategory],
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

  // Fetch the user profile to display the avatar
  const { data: profile } = useQuery({
    queryKey: ['topbar-user-profile', user?.id],
    enabled: !!user?.id,
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

  return (
    <>
      <header
        className={cn(
          'app-header',
          shouldHide && 'header-hidden',
          className
        )}
      >
        {/* Normal header background - Hardware accelerated transitions */}
        <div 
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-in-out -z-10",
            isLight ? "bg-white" : "bg-black",
            transparent ? "opacity-0" : "opacity-100"
          )} 
          style={{ transform: 'translateZ(0)' }}
        />

        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between relative z-10 px-2">
          {/* Left section: Avatar + Mode switcher + filters */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            {/* Unified Nav Group: [Back?] [Avatar] [Title] */}
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center z-50 pointer-events-auto touch-manipulation rounded-xl bg-card transition-all"
                style={{
                  boxShadow: cinematicShadow,
                  border: 'none',
                }}
                aria-label="Go back"
              >
                <ArrowLeft className={cn("w-5 h-5", isLight ? "text-foreground/80" : "text-white/90")} strokeWidth={2.5} />
              </motion.button>
            )}

            {/* User Avatar - Tapping navigates to profile */}
            {user ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  haptics.select(); // Higher urgency than tap
                  const profilePath = userRole === 'owner' ? '/owner/profile' : '/client/profile';
                  prefetchRoute(profilePath);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const profilePath = userRole === 'owner' ? '/owner/profile' : '/client/profile';
                  navigate(profilePath);
                }}
                className="flex-shrink-0 focus:outline-none z-50 relative pointer-events-auto cursor-pointer touch-manipulation p-0"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="Go to profile"
              >
                <Avatar className="h-12 w-12 rounded-full overflow-hidden cursor-pointer border-none ring-0 shadow-none">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover w-full h-full rounded-full" />
                  <AvatarFallback className={cn(
                    "text-xs font-black uppercase rounded-full w-full h-full flex items-center justify-center",
                    isLight
                      ? "bg-gradient-to-br from-brand-primary/15 to-brand-accent/15 text-foreground/70"
                      : "bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-foreground/80"
                  )}>
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            ) : (
              !showBack && !title && (
                <div onPointerDown={() => prefetchRoute('/')} className="cursor-pointer">
                  <SwipessLogo size="sm" className="flex-shrink-0" />
                </div>
              )
            )}


            <div className="flex items-center gap-1.5 flex-shrink-0 ml-1 relative z-10">

              <ModeSwitcher variant="icon" size="sm" />
            </div>

            {showFilters && userRole && (
              <div className="flex-shrink-0 relative z-10">
                <QuickFilterDropdown userRole={(userRole === 'admin' ? 'client' : userRole) as 'client' | 'owner'} />
              </div>
            )}
          </div>

          {/* Global Header Tap Zone: Navigates back to Dashboard from anywhere on the header background */}
          <div
            className="absolute inset-0 z-0 cursor-pointer pointer-events-auto"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onPointerDown={(e) => {
              // Only trigger if we tap the background, not children buttons
              if (e.target === e.currentTarget) {
                haptics.tap();
                navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
              }
            }}
          />

          {/* Center Content Section */}
          <div className="flex-1 h-full flex items-center justify-center pointer-events-none relative z-10">
            {title ? (
              <span className={cn(
                "font-black text-xl uppercase tracking-tighter leading-none select-none",
                isLight
                  ? "text-foreground drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]"
                  : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              )}>
                {title}
              </span>
            ) : null}
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
            {/* Token Packages Button with Popover */}
            <Popover open={tokensOpen} onOpenChange={setTokensOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-9 w-9 px-0 rounded-xl transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95 group bg-card",
                    "touch-manipulation flex items-center gap-1 flex-shrink-0",
                  )}
                  style={{
                    boxShadow: cinematicShadow,
                    border: 'none',
                  }}
                  onPointerDown={(e) => { e.preventDefault(); haptics.tap(); setTokensOpen(!tokensOpen); }}
                  onClick={(e) => e.preventDefault()}
                  aria-label="Token Packages"
                >
                  <Zap strokeWidth={3} className={cn("h-4 w-4", isLight ? "text-amber-500" : "text-amber-300")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[min(calc(100vw-1.5rem),420px)] p-0 rounded-2xl bg-card border border-border shadow-2xl"
              >
                {/* Popover Header */}
                <div className="px-4 pt-4 pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-base">{t('topbar.tokenPackages')}</h3>
                    <span className="text-xs text-muted-foreground">
                      {userRole === 'owner' ? t('topbar.provider') : t('topbar.explorer')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userRole === 'owner'
                      ? t('topbar.connectExplorers')
                      : t('topbar.startConversations')}
                  </p>
                </div>

                {/* Three Package Token Cards */}
                <div className="p-3 space-y-2">
                  {packages && packages.length > 0 ? (
                    packages.slice(0, 3).map((pkg, index) => {
                      const tier = tierNames[index] || 'starter';
                      const config = tierConfig[tier];
                      const Icon = config.icon;
                      const isPopular = tier === 'standard';
                      const tokens = pkg.message_activations || 0;
                      const pricePerToken = tokens > 0 ? pkg.price / tokens : 0;

                      return (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "relative rounded-xl border p-3 bg-gradient-to-r transition-all duration-200",
                            config.gradient,
                            config.border,
                            isPopular && "ring-1 ring-blue-500/30"
                          )}
                        >
                          {isPopular && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                              {t('topbar.bestValue')}
                            </span>
                          )}
                          <div className="flex items-center gap-3">
                            {/* Icon */}
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

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Button - Navigates directly to page per user request */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-10 w-10 rounded-xl transition-all duration-200",
                "hover:scale-105 active:scale-95 group bg-card border-0",
                "touch-manipulation"
              )}
              onClick={() => {
                haptics.tap();
                navigate('/notifications');
              }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <div className="relative">
                <Bell
                  strokeWidth={3}
                  className={cn(
                    "h-5 w-5 transition-colors duration-150",
                    isLight ? "text-foreground/80" : "text-white/80",
                    "group-hover:text-foreground"
                  )}
                />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1.5 shadow-lg"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
