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
import { formatPriceUSD } from "@/utils/subscriptionPricing";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";

// Premium plans for all users (Simplified to Client-only style as requested)
const clientPremiumPlans = [
  {
    id: 'client-unlimited',
    name: 'UNLIMITED PREMIUM',
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
    name: '6 MONTHS PREMIUM',
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
    name: 'MONTHLY PREMIUM',
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

// Token activation packages (Hardcoded for "client side only" as requested)
const activationPackages = [
  {
    id: 'tokens-15',
    name: 'Explorer Premium',
    tokens: 15,
    price: 179,
    pricePerToken: 179 / 15,
    paypalUrl: 'https://www.paypal.com/ncp/payment/9NBGA9X3BJ5UA',
    tier: 'premium',
    icon: Crown,
    duration_days: 365,
    savings: 'Save 25%',
  },
  {
    id: 'tokens-10',
    name: 'Explorer Standard',
    tokens: 10,
    price: 129,
    pricePerToken: 129 / 10,
    paypalUrl: 'https://www.paypal.com/ncp/payment/VG2C7QMAC8N6A',
    tier: 'standard',
    icon: Zap,
    duration_days: 180,
    savings: 'Save 15%',
  },
  {
    id: 'tokens-3',
    name: 'Explorer Starter',
    tokens: 3,
    price: 69,
    pricePerToken: 69 / 3,
    paypalUrl: 'https://www.paypal.com/ncp/payment/VNM2QVBFG6TA4',
    tier: 'starter',
    icon: MessageCircle,
    duration_days: 90,
  }
];

const getPremiumTierStyles = (tier: string, highlight?: boolean) => {
  if (highlight || tier === 'unlimited') {
    return {
      gradient: 'from-[#0070f3]/20 via-[#0070f3]/5 to-transparent',
      border: 'border-[#0070f3]/40 shadow-[0_0_20px_rgba(0,112,243,0.1)]',
      badge: 'bg-[#0070f3]/20 text-[#0070f3]',
      button: 'bg-gradient-to-r from-[#0070f3] to-[#00a6ff] hover:opacity-90',
      glow: 'shadow-[0_0_30px_rgba(0,112,243,0.2)]',
    };
  }
  if (tier === 'premium-max') {
    return {
      gradient: 'from-[#E4007C]/20 via-[#E4007C]/5 to-transparent',
      border: 'border-[#E4007C]/40 shadow-[0_0_20px_rgba(228,0,124,0.1)]',
      badge: 'bg-[#E4007C]/20 text-[#E4007C]',
      button: 'bg-gradient-to-r from-[#E4007C] to-[#ff009e] hover:opacity-90',
      glow: 'shadow-[0_0_30px_rgba(228,0,124,0.2)]',
    };
  }
  return {
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    border: 'border-orange-500/40',
    badge: 'bg-orange-500/20 text-orange-400',
    button: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90',
    glow: '',
  };
};

const getMessageTierStyles = (tier: string) => {
  switch (tier) {
    case 'starter':
      return {
        gradient: 'from-purple-500/20 to-transparent',
        border: 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]',
        badge: 'bg-purple-500/20 text-purple-300',
        button: 'bg-purple-600 hover:bg-purple-500',
        glow: '',
      };
    case 'standard':
      return {
        gradient: 'from-blue-500/30 to-transparent',
        border: 'border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.15)]',
        badge: 'bg-blue-500/20 text-blue-400',
        button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',
      };
    case 'premium':
      return {
        gradient: 'from-[#E4007C]/20 to-transparent',
        border: 'border-[#E4007C]/40 shadow-[0_0_25px_rgba(228,0,124,0.15)]',
        badge: 'bg-[#E4007C]/20 text-pink-300',
        button: 'bg-gradient-to-r from-[#E4007C] to-[#B0005E] hover:opacity-90',
        glow: 'shadow-[0_0_35px_rgba(228,0,124,0.25)]',
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

  // Determine user context for navigation, but plans are now unified
  const { activeMode, isLoading: roleLoading } = useActiveMode();
  const userRole = activeMode;

  // Unified plans (Client side only simplified)
  const premiumPlans = clientPremiumPlans;
  const packagesUI = activationPackages;

  const handleMessagePurchase = (pkg: any) => {
    if (!pkg.paypalUrl) {
      toast({ title: "Payment link unavailable", description: "Please contact support.", variant: "destructive" });
      return;
    }
    // Save return path for silent redirect after payment 
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
    }));
    window.open(pkg.paypalUrl, '_blank');
    toast({ title: "Redirecting to PayPal", description: `Processing ${pkg.name} package (${formatPriceUSD(pkg.price)})` });
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
    toast({ title: 'Redirecting to PayPal', description: `Selected: ${plan.name} (${formatPriceUSD(plan.price)}/month)` });
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
              <span className="font-semibold text-foreground">Premium Packages</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-12">

        {/* TOKEN PACKAGES SECTION */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary">Tokens</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Start New Conversations</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Each token lets you start a new conversation. Once started, send unlimited messages.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-foreground font-medium">New users get 1 FREE welcome token!</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {packagesUI.map((pkg, index) => {
              const Icon = pkg.icon;
              const styles = getMessageTierStyles(pkg.tier);
              const isPopular = pkg.tier === 'standard';
              return (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className={`relative h-full flex flex-col overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 ${styles.border} ${styles.glow} transition-all duration-500 hover:scale-[1.02] group`}>
                    {isPopular && (
                      <div className="absolute top-0 left-0 right-0 z-10">
                        <div className="bg-gradient-to-r from-[#E4007C] to-[#ff009e] text-white text-[10px] font-black py-1.5 text-center tracking-widest uppercase shadow-lg">⭐ BEST VALUE</div>
                      </div>
                    )}
                    {pkg.savings && !isPopular && (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className={`${styles.badge} border-none font-bold`}>{pkg.savings}</Badge>
                      </div>
                    )}
                    <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-10' : 'pt-6'}`}>
                      <div className={`mx-auto mb-3 p-4 rounded-2xl ${styles.badge} w-fit`}><Icon className="w-8 h-8" /></div>
                      <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                      <div className="mt-2">
                        <span className="text-4xl font-bold text-foreground">{formatPriceUSD(pkg.price)}</span>
                        <span className="text-muted-foreground ml-1">USD</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatPriceUSD(pkg.pricePerToken)} per token</p>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      <div className="text-center py-4 mb-4 rounded-xl bg-background/50 border border-border/50">
                        <div className="text-5xl font-bold text-foreground">{pkg.tokens}</div>
                        <div className="text-sm text-muted-foreground font-medium mt-1">Tokens</div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"><Check className="w-3 h-3 text-green-500" /></div>
                          <span className="text-foreground">Start {pkg.tokens} new conversations</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="mt-1 flex items-baseline justify-center">
                        <span className="text-3xl font-bold text-foreground">{formatPriceUSD(plan.price)}</span>
                        <span className="text-muted-foreground ml-1 text-sm">/month</span>
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
