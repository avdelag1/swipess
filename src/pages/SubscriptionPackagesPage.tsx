import { useAuth } from "@/hooks/useAuth";
import { useActiveMode } from "@/hooks/useActiveMode";
import { Crown, Check, Shield, Clock, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";
import { cn } from "@/lib/utils";

const clientPremiumPlans = [
  {
    id: 'client-unlimited-1-month',
    name: '1 Month',
    label: 'STARTER',
    price: 39,
    durationText: '/month',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles or bicycles for rent or sale',
      'Save favorite listings',
      'Discover opportunities',
      'AI assistant to create listings & discover the city'
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
    accent: 'blue' as const,
  },
  {
    id: 'client-unlimited-6-months',
    name: '6 Months',
    label: 'POPULAR',
    price: 119,
    durationText: '/6 months',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles or bicycles for rent or sale',
      'Save favorite listings',
      'Discover opportunities',
      'AI assistant to create listings & discover the city'
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
    accent: 'pink' as const,
  },
  {
    id: 'client-unlimited-1-year',
    name: '1 Year',
    label: 'BEST VALUE',
    price: 299,
    durationText: '/year',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles or bicycles for rent or sale',
      'Save favorite listings',
      'Discover opportunities',
      'AI assistant to create listings & discover the city'
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
    highlight: true,
    accent: 'gold' as const,
  },
];

const accentStyles = {
  blue: {
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    glow: '',
    button: 'bg-gradient-to-r from-blue-600 to-blue-400',
    checkColor: 'text-blue-400',
    topGradient: 'from-blue-500/10 via-transparent to-transparent',
    priceShadow: '',
  },
  pink: {
    border: 'border-pink-500/25',
    badge: 'bg-pink-500/15 text-pink-400 border border-pink-500/20',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.08)]',
    button: 'bg-gradient-to-r from-pink-600 to-orange-500',
    checkColor: 'text-pink-400',
    topGradient: 'from-pink-500/10 via-transparent to-transparent',
    priceShadow: '',
  },
  gold: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.12)]',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500',
    checkColor: 'text-amber-400',
    topGradient: 'from-amber-500/10 via-transparent to-transparent',
    priceShadow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
};

export default function SubscriptionPackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeMode, isLoading: roleLoading } = useActiveMode();
  const userRole = activeMode;

  const handlePremiumPurchase = (plan: typeof clientPremiumPlans[0]) => {
    if (!plan.paypalUrl) {
      toast({ title: "Payment link unavailable", description: "Please contact support.", variant: "destructive" });
      return;
    }
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify({
      role: userRole,
      planId: plan.id,
      name: plan.name,
      at: new Date().toISOString()
    }));
    window.open(plan.paypalUrl, '_blank');
    toast({ title: 'Redirecting to PayPal', description: `Selected: ${plan.name} ($${plan.price} USD)` });
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-amber-500/[0.04] via-pink-500/[0.02] to-transparent rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard')}
            className="p-2 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div />
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="text-center px-4 pb-4"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            Unlock Premium
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Full access to all Swipess features
          </p>
        </motion.div>
      </div>

      {/* Cards — fills remaining viewport */}
      <div className="relative z-10 flex-1 flex flex-col px-3 sm:px-6 pb-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch max-w-5xl w-full mx-auto">
          {clientPremiumPlans.map((plan, index) => {
            const style = accentStyles[plan.accent];
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                  "flex-1 flex flex-col rounded-3xl border backdrop-blur-xl transition-all duration-300",
                  "bg-white/[0.03]",
                  style.border,
                  style.glow,
                  isHighlight && "sm:scale-[1.03] sm:z-10 ring-1 ring-amber-500/20"
                )}
              >
                {/* Top gradient wash */}
                <div className={cn("absolute inset-0 rounded-3xl bg-gradient-to-b pointer-events-none", style.topGradient)} />

                <div className="relative flex flex-col flex-1 p-4 sm:p-5">
                  {/* Badge + Label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full", style.badge)}>
                      {plan.label}
                    </span>
                    {isHighlight && (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-2 h-2 rounded-full bg-amber-400"
                      />
                    )}
                  </div>

                  {/* Plan name */}
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{plan.name}</h3>

                  {/* Price */}
                  <div className={cn("flex items-baseline gap-1 mb-4", style.priceShadow)}>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight">
                      ${plan.price}
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                      USD {plan.durationText}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/[0.06] mb-3" />

                  {/* Benefits */}
                  <div className="flex-1 space-y-2 mb-4">
                    {plan.benefits.map((benefit, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 + i * 0.04, duration: 0.3 }}
                        className="flex items-start gap-2"
                      >
                        <Check className={cn("w-3.5 h-3.5 flex-shrink-0 mt-0.5", style.checkColor)} />
                        <span className="text-xs sm:text-sm text-foreground/80 leading-snug">{benefit}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handlePremiumPurchase(plan)}
                    className={cn(
                      "w-full py-3 rounded-2xl font-bold text-sm sm:text-base text-white transition-opacity hover:opacity-90",
                      style.button,
                      isHighlight && "shadow-lg shadow-amber-500/20"
                    )}
                  >
                    {isHighlight ? '🚀 Get Best Value' : 'Subscribe Now'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="shrink-0 flex items-center justify-center gap-5 sm:gap-8 pt-4 pb-2"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cancel Anytime</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
