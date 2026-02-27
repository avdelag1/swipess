import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Sparkles, MessageCircle, Crown, FileText } from 'lucide-react';
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
    gradient: 'from-[#E4007C]/30 to-[#B0005E]/20',
    border: 'border-[#E4007C]/40',
    iconBg: 'bg-[#E4007C]/20 text-pink-300',
    button: 'bg-gradient-to-r from-[#E4007C] to-[#B0005E] hover:from-[#FF1A8B] hover:to-[#E4007C] text-white',
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
}: TopBarProps) {
  const { isVisible } = useScrollDirection({
    threshold: 15,
    showAtTop: true,
    targetSelector: '#dashboard-scroll-container',
  });
  const { unreadCount: notificationCount } = useUnreadNotifications();
  const navigate = useNavigate();
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const shouldHide = hideOnScroll && !isVisible;
  const { theme } = useTheme();
  const isDark = theme === 'black-matte';

  const glassBg = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.95)';
  const glassBorder = isDark
    ? '1.5px solid rgba(255, 255, 255, 0.2)'
    : '1.5px solid rgba(0, 0, 0, 0.1)';
  const floatingShadow = isDark
    ? 'inset 0 1px 0 hsl(var(--foreground) / 0.1), 0 4px 12px hsl(0 0% 0% / 0.3)'
    : '0 1px 3px rgba(0,0,0,0.06)';
  const controlBlur = isDark ? 'blur(10px)' : 'none';
  const headerBackgroundClass = isDark
    ? 'bg-gradient-to-b from-background/90 via-background/40 to-transparent border-transparent'
    : 'bg-transparent border-transparent';

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

  return (
    <>
      <header
        className={cn(
          'app-header',
          headerBackgroundClass,
          shouldHide && 'header-hidden',
          className
        )}
      >
        <div className="flex items-center justify-between h-12 max-w-screen-xl mx-auto gap-2 px-2 sm:px-4">
          {/* Left section: Title + Mode switcher + filters */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            {!title && <SwipessLogo size="sm" className="flex-shrink-0" />}
            {title && (
              <div className="flex-shrink-0 font-black text-sm sm:text-base text-foreground whitespace-nowrap uppercase tracking-tight">
                {title}
              </div>
            )}

            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <ModeSwitcher variant="pill" size="sm" className="md:hidden" />
              <ModeSwitcher variant="pill" size="md" className="hidden md:flex" />
            </div>

            {showFilters && userRole && (
              <div className="flex-shrink-0">
                <QuickFilterDropdown userRole={userRole} />
              </div>
            )}
          </div>

          {/* Center tap zone - navigates back to dashboard */}
          <div
            className="flex-1 h-full cursor-pointer"
            onPointerDown={(e) => {
              e.preventDefault();
              haptics.tap();
              const dashboardPath = userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard';
              navigate(dashboardPath);
            }}
            onClick={(e) => e.preventDefault()}
            aria-label="Go to dashboard"
          />

          {/* Right section: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 justify-end">

            {/* Token Packages Button with Popover */}
            <Popover open={tokensOpen} onOpenChange={setTokensOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "relative h-9 sm:h-10 md:h-11 px-2 sm:px-3 md:px-4 rounded-xl transition-all duration-100 ease-out",
                    "active:scale-[0.95]",
                    "touch-manipulation",
                    "-webkit-tap-highlight-color-transparent",
                    "flex items-center gap-1.5"
                  )}
                  style={{
                    backgroundColor: glassBg,
                    backdropFilter: controlBlur,
                    WebkitBackdropFilter: controlBlur,
                    border: glassBorder,
                    boxShadow: floatingShadow,
                  }}
                  onPointerDown={(e) => { e.preventDefault(); haptics.tap(); setTokensOpen(!tokensOpen); }}
                  onClick={(e) => e.preventDefault()}
                  aria-label="Token Packages"
                >
                  <Zap strokeWidth={4} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300" />
                  <span className="hidden sm:inline font-black text-sm tracking-tighter text-foreground whitespace-nowrap uppercase">
                    Tokens
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={8}
                className="w-[320px] sm:w-[360px] p-0 rounded-2xl border border-white/10 bg-[#1C1C1E]/95 backdrop-blur-xl shadow-2xl"
              >
                {/* Popover Header */}
                <div className="px-4 pt-4 pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-base">Token Packages</h3>
                    <span className="text-xs text-muted-foreground">
                      {userRole === 'owner' ? 'Provider' : 'Explorer'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userRole === 'owner'
                      ? 'Connect with potential explorers'
                      : 'Start conversations with providers'}
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
                                <span className="font-bold text-white text-sm capitalize">{tier}</span>
                                <span className="text-white/60 text-xs">{tokens} tokens</span>
                              </div>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="font-bold text-white text-base">{formatPriceMXN(pkg.price)}</span>
                                <span className="text-white/40 text-[10px]">({formatPriceMXN(pricePerToken)}/ea)</span>
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

            {/* Notifications Button */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-xl transition-all duration-100 ease-out",
                "active:scale-[0.95]",
                "group flex-shrink-0",
                "touch-manipulation",
                "-webkit-tap-highlight-color-transparent"
              )}
              style={{
                backgroundColor: glassBg,
                backdropFilter: controlBlur,
                WebkitBackdropFilter: controlBlur,
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
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-150",
                    notificationCount > 0
                      ? "text-orange-200 group-hover:text-orange-100"
                      : "text-gray-50 group-hover:text-white"
                  )}
                />
                <AnimatePresence>
                  {notificationCount > 0 && (
                    <div className="absolute inset-0 rounded-full border border-pink-500/30" />
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait">
                {notificationCount > 0 && (
                  <motion.span
                    key="notification-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-[20px] flex items-center justify-center ring-2 ring-[#1C1C1E]"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* AI Search Dialog */}
      <AISearchDialog
        isOpen={isAISearchOpen}
        onClose={() => setIsAISearchOpen(false)}
        userRole={userRole}
      />
    </>
  );
}

export const TopBar = memo(TopBarComponent);
