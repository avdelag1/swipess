import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Sparkles, MessageCircle, Crown, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { QuickFilterDropdown } from './QuickFilterDropdown';
import { ModeSwitcher } from './ModeSwitcher';
import { ThemeToggle } from './ThemeToggle';

import { useScrollDirection } from '@/hooks/useScrollDirection';
import { AISearchDialog } from './AISearchDialog';
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
  className?: string;
  showFilters?: boolean;
  userRole?: 'client' | 'owner';
  transparent?: boolean;
  hideOnScroll?: boolean;
  title?: string;
  onAISearchClick?: () => void;
  showBack?: boolean;
}

function TopBarComponent({
  onNotificationsClick,
  onMessageActivationsClick,
  className,
  showFilters,
  userRole,
  transparent = false,
  hideOnScroll = false,
  title,
  onAISearchClick,
  showBack = false,
}: TopBarProps) {
  const { unreadCount: notificationCount } = useUnreadNotifications();
  const navigate = useNavigate();
  const [tokensOpen, setTokensOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const { isVisible } = useScrollDirection({ threshold: 10, showAtTop: true });
  const shouldHide = hideOnScroll && !isVisible;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { t } = useTranslation();

  const glassBg = isDark
    ? 'var(--glass-bg)'
    : 'rgba(255, 255, 255, 0.95)';
  const glassBorder = isDark
    ? '1px solid var(--glass-border)'
    : '1px solid rgba(0, 0, 0, 0.05)';
  const floatingShadow = isDark
    ? '0 10px 30px -10px rgba(0,0,0,0.5)'
    : '0 10px 30px -10px rgba(0,0,0,0.1)';
  // Removed backdropFilter blur for performance - using solid backgrounds instead
  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';

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
        title: "Redirecting to PayPal",
        description: `Processing ${tier} package (${formatPriceMXN(pkg.price)})`,
      });
      setTokensOpen(false);
    } else {
      toast({
        title: "Payment link unavailable",
        description: "Please contact support to complete this purchase.",
        variant: "destructive",
      });
    }
  };

  const handleBack = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    haptics.tap();
    navigate(-1);
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
        {/* Premium multi-stop gradient overlay for flagship header readability */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-[100px] -z-10"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.5) 35%, rgba(0, 0, 0, 0.2) 65%, rgba(0, 0, 0, 0) 100%)'
              : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 35%, rgba(255, 255, 255, 0.2) 65%, rgba(255, 255, 255, 0) 100%)'
          }}
          aria-hidden="true"
        />
        {/* Top Shade - Fades from black at the top to transparent for maximum readability */}
        <div
          className="absolute inset-x-0 top-0 h-[200px] pointer-events-none -z-10"
          style={{
            background: `linear-gradient(to bottom, ${isDark ? 'rgba(0,0,0,0.82)' : 'rgba(255,255,255,0.75)'} 0%, transparent 100%)`,
            opacity: 0.8
          }}
        />

        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between relative z-10 px-2">
          {/* Left section: Avatar + Mode switcher + filters */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            {/* Unified Nav Group: [Back?] [Avatar] [Title] */}
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onPointerDown={handleBack}
                className="flex-shrink-0 w-8 h-9 flex items-center justify-center z-50 pointer-events-auto touch-manipulation"
                aria-label="Go back"
              >
                <ArrowLeft className={cn("w-5 h-5", isDark ? "text-white/90" : "text-foreground/80")} strokeWidth={2.5} />
              </motion.button>
            )}

            {/* User Avatar - Tapping navigates to profile */}
            {user ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  haptics.tap();
                  const profilePath = userRole === 'owner' ? '/owner/profile' : '/client/profile';
                  navigate(profilePath);
                }}
                className="flex-shrink-0 focus:outline-none z-50 relative pointer-events-auto cursor-pointer"
                aria-label="Go to profile"
              >
                <Avatar className="h-11 w-11 rounded-xl overflow-hidden cursor-pointer" style={{ border: glassBorder, boxShadow: floatingShadow }}>
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 text-foreground/80 text-xs font-black uppercase">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </motion.button>
            ) : (
              !showBack && !title && <SwipessLogo size="sm" className="flex-shrink-0" />
            )}


            <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
              
              <ModeSwitcher variant="pill" size="sm" className="md:hidden" />
              <ModeSwitcher variant="pill" size="sm" className="hidden md:flex" />
            </div>

            {showFilters && userRole && (
              <div className="flex-shrink-0">
                <QuickFilterDropdown userRole={userRole} />
              </div>
            )}
          </div>

          {/* Center tap zone - navigates back to dashboard, shows page title only when on sub-pages */}
          <div
            className="flex-1 h-full cursor-pointer flex items-center justify-center"
            onPointerDown={(e) => {
              e.preventDefault();
              haptics.tap();
              navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard');
            }}
            onClick={(e) => e.preventDefault()}
            aria-label="Go to dashboard"
          >
            {title ? (
              <span className={cn(
                "font-black text-xl uppercase tracking-tighter leading-none pointer-events-none select-none",
                isDark
                  ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  : "text-foreground drop-shadow-[0_1px_3px_rgba(255,255,255,0.5)]"
              )}>
                {title}
              </span>
            ) : null}
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">
            {/* AI Search Button - Moved to BottomNavigation */}

            {/* Token Packages Button with Popover */}
            <Popover open={tokensOpen} onOpenChange={setTokensOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-9 w-9 px-0 rounded-xl transition-all duration-200 ease-out",
                    "hover:scale-105 active:scale-95 group",
                    "touch-manipulation flex items-center gap-1 flex-shrink-0",
                  )}
                  style={{
                    backgroundColor: glassBg,
                    border: glassBorder,
                    boxShadow: floatingShadow,
                  }}
                  onPointerDown={(e) => { e.preventDefault(); haptics.tap(); setTokensOpen(!tokensOpen); }}
                  onClick={(e) => e.preventDefault()}
                  aria-label="Token Packages"
                >
                  <Zap strokeWidth={3} className={cn("h-4 w-4", isDark ? "text-amber-300" : "text-amber-500")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[320px] sm:w-[360px] p-0 rounded-2xl liquid-glass-card refraction-edge glass-nano-texture"
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
                              BEST VALUE
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
                                <span className="text-muted-foreground text-xs">{tokens} tokens</span>
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
                              Buy
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
                      <p className="text-muted-foreground text-xs">Loading packages...</p>
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
                    View all packages & details
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-9 w-9 rounded-xl transition-all duration-200 ease-out",
                "hover:scale-105 active:scale-95 group",
                "flex-shrink-0 flex items-center gap-1",
                "touch-manipulation",
              )}
              style={{
                backgroundColor: glassBg,
                border: glassBorder,
                boxShadow: floatingShadow,
              }}
              onPointerDown={(e) => { e.preventDefault(); haptics.tap(); onNotificationsClick?.(); }}
              onClick={(e) => e.preventDefault()}
              aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
            >
              <div className="relative">
                <Bell
                  strokeWidth={4}
                  className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-150",
                    notificationCount > 0
                      ? (isDark ? "text-orange-300 group-hover:text-orange-100" : "text-orange-500 group-hover:text-orange-700")
                      : (isDark ? "text-white group-hover:text-white" : "text-foreground group-hover:text-foreground")
                  )}
                />
              </div>
              {notificationCount > 0 ? (
                <motion.span
                  key="notification-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                >
                  {notificationCount > 99 ? '99+' : notificationCount}
                </motion.span>
              ) : null}
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}

export const TopBar = memo(TopBarComponent);
