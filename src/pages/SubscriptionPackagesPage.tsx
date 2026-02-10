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
import { toast } from "@/hooks/use-toast";
import { STORAGE } from "@/constants/app";

// Premium plans for owners
const ownerPremiumPlans = [
  {
    id: 'owner-unlimited',
    name: 'UNLIMITED OWNER',
    price: 299,
    benefits: [
      'Unlimited properties',
      '30 messages per month',
      'Top visibility (100%)',
      'Always listed first in search',
      'Full access to tools, filters, and stats',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/P2YZA6FWZAACQ',
    highlight: true,
    tier: 'unlimited',
  },
  {
    id: 'owner-premium-max',
    name: 'PREMIUM MAX',
    price: 199,
    benefits: [
      'Up to 10 properties',
      '20 messages per month',
      'High visibility (80%)',
      'Advanced client filters',
      '"Premium Profile" badge',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/4LG62YGVETM4L',
    tier: 'premium-max',
  },
  {
    id: 'owner-premium-plus-plus',
    name: 'PREMIUM ++',
    price: 149,
    benefits: [
      'Up to 5 properties',
      '12 messages per month',
      'Medium-high visibility (50%)',
      'Filters to choose ideal clients',
      'Highlighted profile',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/J5NKCX6KQRCYW',
    tier: 'premium-plus-plus',
  },
  {
    id: 'owner-premium-plus',
    name: 'PREMIUM +',
    price: 99,
    benefits: [
      'Up to 2 active properties',
      '6 direct messages per month',
      'See who liked you',
      'Unlimited likes',
      'Medium visibility (25%)',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/GSA6TBVY9PFDU',
    tier: 'premium-plus',
  },
];

// Premium plans for clients
const clientPremiumPlans = [
  {
    id: 'client-unlimited',
    name: 'UNLIMITED CLIENT',
    price: 199,
    benefits: [
      '30 direct messages per month',
      'Unlimited superlikes',
      'Full visibility (100%)',
      'Priority in search results',
      'Access to all premium features',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
    highlight: true,
    tier: 'unlimited',
  },
  {
    id: 'client-premium-plus-plus',
    name: 'PREMIUM ++',
    price: 149,
    benefits: [
      '12 direct messages per month',
      'See who visited your profile',
      'Highlighted profile',
      'Medium visibility (50%)',
      'Unlimited superlikes',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
    tier: 'premium-plus-plus',
  },
  {
    id: 'client-premium',
    name: 'PREMIUM',
    price: 99,
    benefits: [
      '6 direct messages per month',
      'See who liked you',
      'More visibility (25%)',
      'Access to additional filters',
      'Highlighted profile in regular search',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
    tier: 'premium',
  },
];

const getPremiumTierStyles = (tier: string, highlight?: boolean) => {
  if (highlight || tier === 'unlimited') {
    return {
      gradient: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-blue-500/50 hover:border-blue-400 ring-2 ring-blue-500/30',
      badge: 'bg-blue-500/20 text-blue-400',
      button: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400',
      glow: 'shadow-lg shadow-blue-500/20',
    };
  }
  if (tier === 'premium-max') {
    return {
      gradient: 'from-purple-500/20 to-pink-500/10',
      border: 'border-purple-500/40 hover:border-purple-400/60',
      badge: 'bg-purple-500/20 text-purple-400',
      button: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400',
      glow: 'shadow-lg shadow-purple-500/20',
    };
  }
  return {
    gradient: 'from-green-500/20 to-emerald-500/10',
    border: 'border-green-500/40 hover:border-green-400/60',
    badge: 'bg-green-500/20 text-green-400',
    button: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400',
    glow: '',
  };
};

const getMessageTierStyles = (tier: string) => {
  switch (tier) {
    case 'starter':
      return {
        gradient: 'from-slate-500/20 to-slate-600/10',
        border: 'border-slate-500/30 hover:border-slate-400/50',
        badge: 'bg-slate-500/20 text-slate-300',
        button: 'bg-slate-600 hover:bg-slate-500',
        glow: '',
      };
    case 'standard':
      return {
        gradient: 'from-primary/30 to-primary/10',
        border: 'border-primary/50 hover:border-primary ring-2 ring-primary/30',
        badge: 'bg-primary/20 text-primary',
        button: 'bg-primary hover:bg-primary/90',
        glow: 'shadow-lg shadow-primary/20',
      };
    case 'premium':
      return {
        gradient: 'from-amber-500/20 to-orange-500/10',
        border: 'border-amber-500/40 hover:border-amber-400/60',
        badge: 'bg-amber-500/20 text-amber-400',
        button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
        glow: 'shadow-lg shadow-amber-500/20',
      };
    default:
      return {
        gradient: 'from-muted/50 to-muted/30',
        border: 'border-border',
        badge: 'bg-muted text-muted-foreground',
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

  // Fetch message activation packages
  const { data: messagePackages, isLoading: packagesLoading } = useQuery({
    queryKey: ['activation-packages', packageCategory],
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

  // Convert database packages to UI format
  const convertPackages = (dbPackages: any[] | undefined) => {
    if (!dbPackages || dbPackages.length === 0) return [];
    const tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
    const iconMap = { starter: MessageCircle, standard: Zap, premium: Crown };

    return dbPackages.map((pkg, index) => {
      const pricePerActivation = pkg.message_activations > 0 ? pkg.price / pkg.message_activations : 0;
      const tier = tierMap[index] || 'starter';
      let savings: string | undefined;
      if (index > 0 && dbPackages[0]) {
        const firstPricePerActivation = dbPackages[0].price / dbPackages[0].message_activations;
        const savingsPercent = Math.round(((firstPricePerActivation - pricePerActivation) / firstPricePerActivation) * 100);
        if (savingsPercent > 0) savings = `Save ${savingsPercent}%`;
      }
      return {
        id: pkg.id,
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        activations: pkg.message_activations,
        price: pkg.price,
        pricePerActivation,
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
    // Save return path for silent redirect after payment
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      activations: pkg.activations,
      price: pkg.price,
    }));
    if (pkg.paypalUrl) {
      window.open(pkg.paypalUrl, '_blank');
      toast({ title: "Redirecting to PayPal", description: `Processing ${pkg.name} package (${formatPriceMXN(pkg.price)})` });
    } else {
      toast({ title: "Payment link unavailable", description: "Please contact support.", variant: "destructive" });
    }
  };

  const handlePremiumPurchase = (plan: typeof premiumPlans[0]) => {
    // Save return path for silent redirect after payment
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify({
      role: userRole,
      planId: plan.id,
      name: plan.name,
      price: plan.price,
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
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
        
        {/* MESSAGE ACTIVATION PACKAGES SECTION */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Message Activations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Start New Conversations</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Each activation lets you start a new conversation. Once started, send unlimited messages.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-foreground font-medium">New users get 1 FREE welcome activation!</span>
            </div>
          </div>

          {packagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-96 rounded-2xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : packagesUI.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground">No packages available.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {packagesUI.map((pkg, index) => {
                const Icon = pkg.icon;
                const styles = getMessageTierStyles(pkg.tier);
                const isPopular = pkg.tier === 'standard';
                return (
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                    <Card className={`relative h-full flex flex-col overflow-hidden bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300`}>
                      {isPopular && (
                        <div className="absolute -top-0 left-0 right-0">
                          <div className="bg-primary text-primary-foreground text-xs font-bold py-1.5 text-center">⭐ BEST VALUE</div>
                        </div>
                      )}
                      {pkg.savings && !isPopular && (
                        <div className="absolute top-3 right-3"><Badge className={styles.badge}>{pkg.savings}</Badge></div>
                      )}
                      <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-10' : 'pt-6'}`}>
                        <div className={`mx-auto mb-3 p-4 rounded-2xl ${styles.badge} w-fit`}><Icon className="w-8 h-8" /></div>
                        <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                        <div className="mt-2">
                          <span className="text-4xl font-bold text-foreground">{formatPriceMXN(pkg.price)}</span>
                          <span className="text-muted-foreground text-sm ml-1">MXN</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatPriceMXN(pkg.pricePerActivation)} per activation</p>
                      </CardHeader>
                      <CardContent className="flex-1 pt-4">
                        <div className="text-center py-4 mb-4 rounded-xl bg-background/50 border border-border/50">
                          <div className="text-5xl font-bold text-foreground">{pkg.activations}</div>
                          <div className="text-sm text-muted-foreground font-medium mt-1">Message Activations</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-green-500" /></div>
                            <span className="text-foreground">Start {pkg.activations} new conversations</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-green-500" /></div>
                            <span className="text-foreground">Unlimited messages per chat</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Clock className="w-3 h-3 text-green-500" /></div>
                            <span className="text-foreground">{pkg.duration_days}-day validity</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Shield className="w-3 h-3 text-green-500" /></div>
                            <span className="text-foreground">Secure PayPal payment</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 pb-6">
                        <Button onClick={() => handleMessagePurchase(pkg)} className={`w-full h-12 font-semibold text-base ${styles.button}`} size="lg">
                          {isPopular ? '🔥 Get Best Value' : 'Buy Now'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* PREMIUM SUBSCRIPTION PACKAGES SECTION */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Premium Monthly Plans</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Upgrade to Premium</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Get monthly message credits, increased visibility, and exclusive features.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                        <span className="text-3xl font-bold text-foreground">{formatPriceMXN(plan.price)}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-2">
                      <div className="space-y-2">
                        {plan.benefits.map((benefit, i) => (
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
              <h4 className="font-medium text-foreground">What's the difference between activations and premium?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Message activations are one-time purchases to start new conversations. Premium plans include monthly message credits plus visibility boosts and extra features.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">Do activations expire?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Activations are valid for 30-90 days depending on the package. Use them before they expire!
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">Can I get a refund?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Contact support within 24 hours of purchase. Unused activations may be eligible for refund.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
