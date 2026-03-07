import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMode } from "@/hooks/useActiveMode";
import { ArrowLeft, Sparkles, MessageCircle, Crown, Zap, Star, Check, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";

// Premium plans for owners have been removed per user request
const ownerPremiumPlans: any[] = [];

// Premium plans for clients
const clientPremiumPlans = [
  {
    id: 'client-unlimited-1-year',
    name: 'UNLIMITED (1 YEAR)',
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
    tier: 'unlimited',
  },
  {
    id: 'client-unlimited-6-months',
    name: 'UNLIMITED (6 MONTHS)',
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
    tier: 'unlimited',
  },
  {
    id: 'client-unlimited-1-month',
    name: 'UNLIMITED (1 MONTH)',
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
    tier: 'unlimited',
  },
];

const getPremiumTierStyles = (tier: string, highlight?: boolean) => {
  if (highlight || tier === 'unlimited') {
    return {
      gradient: 'from-blue-600/10 via-blue-600/5 to-transparent',
      border: 'border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.1)]',
      badge: 'bg-blue-500/20 text-blue-400',
      button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90',
      glow: 'shadow-[0_0_40px_rgba(37,99,235,0.15)]',
    };
  }
  if (tier === 'premium-max') {
    return {
      gradient: 'from-[#E4007C]/10 via-[#E4007C]/5 to-transparent',
      border: 'border-[#E4007C]/30 shadow-[0_0_30px_rgba(228,0,124,0.1)]',
      badge: 'bg-[#E4007C]/20 text-[#E4007C]',
      button: 'bg-gradient-to-r from-[#E4007C] to-[#C4006B] hover:opacity-90',
      glow: 'shadow-[0_0_40px_rgba(228,0,124,0.15)]',
    };
  }
  return {
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    border: 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]',
    badge: 'bg-amber-500/20 text-amber-400',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90',
    glow: '',
  };
};

const getMessageTierStyles = (tier: string) => {
  switch (tier) {
    case 'starter':
      return {
        gradient: 'from-blue-500/10 to-transparent',
        border: 'border-blue-500/20',
        badge: 'bg-blue-500/10 text-blue-400',
        button: 'bg-blue-600 hover:bg-blue-500',
        glow: '',
      };
    case 'standard':
      return {
        gradient: 'from-indigo-500/10 to-transparent',
        border: 'border-indigo-500/20',
        badge: 'bg-indigo-500/10 text-indigo-400',
        button: 'bg-indigo-600 hover:bg-indigo-500',
        glow: '',
      };
    case 'premium':
      return {
        gradient: 'from-[#E4007C]/10 to-transparent',
        border: 'border-[#E4007C]/20',
        badge: 'bg-[#E4007C]/10 text-[#E4007C]',
        button: 'bg-[#E4007C] hover:bg-[#C4006B]',
        glow: '',
      };
    default:
      return {
        gradient: 'from-muted/30 to-muted/10',
        border: 'border-border/30',
        badge: 'bg-muted/30 text-muted-foreground',
        button: '',
        glow: '',
      };
  }
};

export default function SubscriptionPackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use active mode to determine which packages to show
  // This switches when user toggles between client/owner mode
  const { activeMode, isLoading: roleLoading } = useActiveMode();

  const userRole = activeMode;
  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';
  const premiumPlans = userRole === 'owner' ? ownerPremiumPlans : clientPremiumPlans;
  const roleLabel = userRole === 'owner' ? 'Provider' : 'Explorer';

  // Fetch token packages
  const { data: messagePackages, isLoading: packagesLoading, error: packagesError } = useQuery({
    queryKey: ['activation-packages', packageCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('package_category', packageCategory)
        .eq('is_active', true)
        .order('tokens', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Convert database packages to UI format
  const convertPackages = (dbPackages: any[] | undefined) => {
    if (!dbPackages || dbPackages.length === 0) return [];
    const tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
    const iconMap = { starter: MessageCircle, standard: Zap, premium: Crown };

    return dbPackages.map((pkg, index) => {
      const pricePerToken = pkg.tokens > 0 ? pkg.price / pkg.tokens : 0;
      const tier = tierMap[index] || 'starter';
      let savings: string | undefined;
      if (index > 0 && dbPackages[0]) {
        const firstPricePerToken = dbPackages[0].price / dbPackages[0].tokens;
        const savingsPercent = Math.round(((firstPricePerToken - pricePerToken) / firstPricePerToken) * 100);
        if (savingsPercent > 0) savings = `Save ${savingsPercent}%`;
      }
      return {
        id: pkg.id,
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        tokens: pkg.tokens,
        price: pkg.price,
        pricePerToken,
        savings,
        tier,
        icon: iconMap[tier],
        duration_days: pkg.duration_days || 30,
        paypalUrl: pkg.paypal_link || '',
        legal_documents: pkg.legal_documents_included || 0,
      };
    });
  };

  const packagesUI = convertPackages(messagePackages);

  const handleMessagePurchase = (pkg: any) => {
    if (!pkg.paypalUrl) {
      toast({ title: "Payment link unavailable", description: "Please contact support.", variant: "destructive" });
      return;
    }
    // Save return path for silent redirect after payment (price omitted — fetched server-side on activation)
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
    }));
    window.open(pkg.paypalUrl, '_blank');
    toast({ title: "Redirecting to PayPal", description: `Processing ${pkg.name} package (${formatPriceMXN(pkg.price)})` });
  };

  const handlePremiumPurchase = (plan: typeof premiumPlans[0]) => {
    if (!plan.paypalUrl) {
      toast({ title: "Payment link unavailable", description: "Please contact support.", variant: "destructive" });
      return;
    }
    // Save return path for silent redirect after payment (price omitted — fetched server-side on activation)
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify({
      role: userRole,
      planId: plan.id,
      name: plan.name,
      at: new Date().toISOString()
    }));
    window.open(plan.paypalUrl, '_blank');
    toast({ title: 'Redirecting to PayPal', description: `Selected: ${plan.name} (${formatPriceMXN(plan.price)}/month)` });
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard')}
              className="gap-2"
            >
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{roleLabel} Packages</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-12">



        {/* PREMIUM SUBSCRIPTION PACKAGES SECTION */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">UNLIMITED Premium Plans</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-foreground">Complete Freedom to Connect</h2>
            <p className="text-muted-foreground text-base sm:text-xl max-w-3xl mx-auto">
              Get full access to all Swipess features without restrictions on any premium plan.
            </p>
          </div>

          {/* We reverse the array so the 1-month is on left, 6-m in middle, and yearly on right */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {premiumPlans.map((plan, index) => {
              const styles = getPremiumTierStyles(plan.tier, plan.highlight);
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                  <Card className={`relative h-full flex flex-col overflow-hidden bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300`}>
                    {plan.highlight && (
                      <div className="absolute -top-0 left-0 right-0">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold py-1.5 text-center">⚡ MOST POPULAR</div>
                      </div>
                    )}
                    <CardHeader className={`pb-2 ${plan.highlight ? 'pt-10' : 'pt-6'}`}>
                      <div className={`mb-3 p-3 rounded-xl ${styles.badge} w-fit`}>
                        {plan.highlight ? <Zap className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-muted-foreground text-sm">USD {plan.durationText || '/month'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2">
                      <div className="space-y-2">
                        {plan.benefits.map((benefit: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-6">
                      <Button onClick={() => handlePremiumPurchase(plan)} className={`w-full h-11 font-semibold ${styles.button}`}>
                        {plan.highlight ? '🚀 Subscribe Now' : 'Subscribe'}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Trust Badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>Instant Activation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Cancel Anytime</span>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="max-w-3xl mx-auto space-y-4 pb-8">
          <h3 className="text-lg font-semibold text-foreground text-center">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">Do the unlimited plans automatically renew?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                For your security and control, we use one-time payments. You can simply purchase a new top-up when your time expires!
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">What if I buy the wrong package?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                If you made a mistake with your purchase, please contact support within 24 hours of purchase and our team will be happy to assist you in making it right.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
