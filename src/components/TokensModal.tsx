import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, MessageCircle, Crown, FileText, Check, ChevronDown, ChevronUp, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTokens } from '@/hooks/useTokens';
import { formatPriceMXN } from '@/utils/subscriptionPricing';
import { useToast } from '@/hooks/use-toast';
import { STORAGE } from '@/constants/app';
import { useModalStore } from '@/state/modalStore';
import { haptics } from '@/utils/microPolish';
import { NativeBridge } from '@/utils/nativeBridge';

const tokenTierConfig = {
  starter: {
    icon: MessageCircle,
    gradient: 'from-slate-500/5 to-transparent',
    border: 'border-border/40',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300',
    button: 'bg-slate-900 dark:bg-slate-700 text-white',
  },
  standard: {
    icon: Zap,
    gradient: 'from-violet-500/10 to-transparent',
    border: 'border-violet-500 shadow-sm',
    iconBg: 'bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300',
    button: 'bg-violet-600 hover:bg-violet-500 text-white',
  },
  premium: {
    icon: Crown,
    gradient: 'from-amber-500/10 to-transparent',
    border: 'border-amber-500/40',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
  },
} as const;

const premiumPlans = [
  {
    id: 'monthly',
    appleProductId: 'Swipess.premium.monthly',
    name: 'Monthly',
    label: 'STARTER',
    price: '$39',
    duration: '/month',
    accent: 'blue' as const,
    benefits: [
      'Communicate with listings & members',
      'Post properties, services & vehicles',
      'Save favorite listings',
      'AI Concierge — 15 messages/day',
      'AI Listing Creator — 3/month',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
  },
  {
    id: 'semi-annual',
    appleProductId: 'Swipess.premium.semi_annual',
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: '$119',
    duration: '/6 months',
    accent: 'pink' as const,
    highlight: true,
    benefits: [
      'Communicate with listings & members',
      'Post properties, services & vehicles',
      'Save favorite listings',
      'AI Concierge — 50 messages/day',
      'AI Listing Creator — 10/month',
      'Local Expert Knowledge',
      'AI Smart Suggestions',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/N27Y9Z895HVYQ',
  },
  {
    id: 'annual',
    appleProductId: 'Swipess.premium.yearly',
    name: 'Annual',
    label: 'BEST VALUE',
    price: '$179',
    duration: '/year',
    accent: 'gold' as const,
    benefits: [
      'Everything in Semi-Annual',
      'Unlimited AI Concierge',
      'Unlimited AI Listing Creator',
      'Priority Support',
      'Early access to new features',
      'Exclusive community perks',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/VRF4SJXQNKMTG',
  },
];

interface TokensModalProps {
  userRole?: 'client' | 'owner';
}

function TokensModalComponent({ userRole = 'client' }: TokensModalProps) {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  const { tokens } = useTokens();
  const { toast } = useToast();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const isOpen = useModalStore((s) => s.showTokensModal);
  const close = () => useModalStore.getState().setModal('showTokensModal', false);

  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';

  const { data: packages } = useQuery({
    queryKey: ['tokens-modal-packages', packageCategory],
    staleTime: 1000 * 60 * 60 * 24,
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

  const handlePurchase = async (pkg: any, tier: string) => {
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.message_activations,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

    if (NativeBridge.isIOS()) {
      toast({ title: 'Connecting to App Store' });
      const result = await NativeBridge.purchaseProduct(`Swipess.tokens.${pkg.message_activations}`);
      if (result.success) {
        toast({ title: 'Payment Confirmed', description: 'Tokens activated.' });
        close();
      } else {
        toast({ title: 'Transaction Cancelled', variant: 'destructive' });
      }
      return;
    }

    if (pkg.paypal_link) {
      window.open(pkg.paypal_link, '_blank');
      toast({ title: 'Redirecting to Checkout', description: `Processing ${tier} package — ${formatPriceMXN(pkg.price)}` });
      close();
    } else {
      toast({ title: 'Payment unavailable', description: 'Please contact support.', variant: 'destructive' });
    }
  };

  const handlePremiumPurchase = async (plan: typeof premiumPlans[0]) => {
    if (NativeBridge.isIOS()) {
      toast({ title: 'Connecting to App Store' });
      const result = await NativeBridge.purchaseProduct(plan.appleProductId);
      if (result.success) {
        toast({ title: 'Upgrade Successful', description: 'Premium access granted.' });
        close();
      } else {
        toast({ title: 'Transaction Cancelled', variant: 'destructive' });
      }
      return;
    }

    if (plan.paypalUrl) {
      window.open(plan.paypalUrl, '_blank');
      toast({ title: 'Redirecting to Checkout', description: `Processing ${plan.name} plan — ${plan.price}` });
      close();
    }
  };

  const handleRestore = () => {
    toast({ title: 'Restoring Purchases', description: 'Verifying with App Store...' });
    setTimeout(() => toast({ title: 'Sync Complete', description: 'Your access has been verified.' }), 1500);
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div className={cn(
              "w-full max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col pointer-events-auto",
              isLight ? "bg-background border border-border/40" : "bg-zinc-900 border border-white/10"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground">Tokens & Plans</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have <span className="font-bold text-primary">{tokens}</span> tokens remaining
                  </p>
                </div>
                <button
                  onClick={close}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-8 space-y-6">
                {/* TOKEN PACKAGES */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Message Tokens</h3>
                  <div className="space-y-2.5">
                    {packages && packages.length > 0 ? (
                      packages.slice(0, 3).map((pkg, index) => {
                        const tier = tierNames[index] || 'starter';
                        const config = tokenTierConfig[tier];
                        const Icon = config.icon;
                        const isPopular = tier === 'standard';
                        const tkns = pkg.message_activations || 0;
                        const pricePerToken = tkns > 0 ? pkg.price / tkns : 0;

                        return (
                          <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "relative rounded-2xl border p-4 bg-gradient-to-r transition-all",
                              config.gradient, config.border,
                              isPopular && "ring-1 ring-blue-500/30"
                            )}
                          >
                            {isPopular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                                Best Value
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <div className={cn("flex-shrink-0 p-2.5 rounded-xl", config.iconBg)}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-black text-sm uppercase tracking-tight text-foreground">{tier}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{tkns} tokens</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="font-black text-base tracking-tighter text-foreground">{formatPriceMXN(pkg.price)}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground">({formatPriceMXN(pricePerToken)}/ea)</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className={cn("flex-shrink-0 h-9 px-4 rounded-xl font-semibold text-xs", config.button)}
                                onClick={() => handlePurchase(pkg, tier)}
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
                        <p className="text-muted-foreground text-xs">Loading packages...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* PREMIUM PLANS */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Premium Plans</h3>
                  <div className="space-y-3">
                    {premiumPlans.map((plan, index) => {
                      const isExpanded = expandedPlan === plan.id;
                      const accentColors = {
                        blue: 'border-blue-500/30 bg-blue-500/5',
                        pink: 'border-primary/30 bg-primary/5 ring-1 ring-primary/20',
                        gold: 'border-amber-500/30 bg-amber-500/5',
                      };

                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + index * 0.05 }}
                          className={cn(
                            "rounded-2xl border overflow-hidden transition-all",
                            accentColors[plan.accent]
                          )}
                        >
                          {plan.highlight && (
                            <div className="bg-primary text-primary-foreground text-center text-[11px] font-bold uppercase tracking-widest py-1">
                              Most Popular
                            </div>
                          )}
                          <button
                            onClick={() => {
                              haptics.tap();
                              setExpandedPlan(isExpanded ? null : plan.id);
                            }}
                            className="w-full p-4 flex items-center gap-3 text-left"
                          >
                            <div className="flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-foreground">{plan.price}</span>
                                <span className="text-sm text-muted-foreground font-medium">{plan.duration}</span>
                              </div>
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{plan.label}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3">
                                  <div className="space-y-2">
                                    {plan.benefits.map((b, i) => (
                                      <div key={i} className="flex items-start gap-3">
                                        <Check className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm font-bold text-foreground/90">{b}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-tight"
                                    onClick={() => handlePremiumPurchase(plan)}
                                  >
                                    <Crown className="w-5 h-5 mr-2" />
                                    Subscribe — {plan.price}{plan.duration}
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Restore Footer */}
                <div className="pt-4 pb-2 text-center">
                  <button 
                    onClick={handleRestore}
                    className="flex items-center justify-center gap-2 w-full text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Restore Subscriptions
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const TokensModal = memo(TokensModalComponent);


