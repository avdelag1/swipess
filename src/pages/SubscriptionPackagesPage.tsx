import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMode } from "@/hooks/useActiveMode";
import { ArrowLeft, Sparkles, MessageCircle, Crown, Zap, Star, Check, Clock, Shield, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPriceMXN, formatPriceUSD } from "@/utils/subscriptionPricing";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";

// ─── Premium Membership Plans (Client-Only, USD) ────────────────────────────
const premiumPlans = [
  {
    id: 'yearly',
    name: 'Yearly Membership',
    price: 299,
    period: 'year',
    subtitle: 'Best for residents, investors, and property owners wanting year-round access to Tulum.',
    highlight: true,
    tier: 'yearly',
    paypalUrl: '#yearly', // Placeholder — replace with live PayPal subscription link
  },
  {
    id: 'six-month',
    name: 'Six-Month Membership',
    price: 119,
    period: '6 months',
    subtitle: 'Ideal for digital nomads, seasonal visitors, and freelancers offering services.',
    highlight: false,
    tier: 'six-month',
    paypalUrl: '#six-month', // Placeholder — replace with live PayPal subscription link
  },
  {
    id: 'monthly',
    name: 'Month-to-Month',
    price: 39,
    period: 'month',
    subtitle: 'Perfect for travelers and short-term visitors exploring what Tulum has to offer.',
    highlight: false,
    tier: 'monthly',
    paypalUrl: '#monthly', // Placeholder — replace with live PayPal subscription link
  },
];

// Shared benefits shown on every premium card
const membershipBenefits = [
  'Communicate with listings and members',
  'Post properties for rent or sale',
  'Post services (chef, driver, cleaning, maintenance, babysitting, etc.)',
  'Post motorcycles or bicycles for rent or sale',
  'Save favorite listings',
  'Discover opportunities in Tulum',
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const getPremiumTierStyles = (tier: string, highlight?: boolean) => {
  if (highlight || tier === 'yearly') {
    return {
      gradient: 'from-[#0070f3]/20 via-[#0070f3]/5 to-transparent',
      border: 'border-[#0070f3]/40 shadow-[0_0_20px_rgba(0,112,243,0.1)]',
      badge: 'bg-[#0070f3]/20 text-[#0070f3]',
      button: 'bg-gradient-to-r from-[#0070f3] to-[#00a6ff] hover:opacity-90',
      glow: 'shadow-[0_0_30px_rgba(0,112,243,0.2)]',
    };
  }
  if (tier === 'six-month') {
    return {
      gradient: 'from-[#E4007C]/20 via-[#E4007C]/5 to-transparent',
      border: 'border-[#E4007C]/40 shadow-[0_0_20px_rgba(228,0,124,0.1)]',
      badge: 'bg-[#E4007C]/20 text-[#E4007C]',
      button: 'bg-gradient-to-r from-[#E4007C] to-[#ff009e] hover:opacity-90',
      glow: 'shadow-[0_0_30px_rgba(228,0,124,0.2)]',
    };
  }
  // monthly
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function SubscriptionPackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { activeMode, isLoading: roleLoading } = useActiveMode();
  const userRole = activeMode;
  const isOwner = userRole === 'owner';

  // Token packages — client only
  const { data: messagePackages, isLoading: packagesLoading, error: packagesError } = useQuery({
    queryKey: ['activation-packages', 'client_pay_per_use'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('package_category', 'client_pay_per_use')
        .eq('is_active', true)
        .order('tokens', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !isOwner,
  });

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
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, '/client/dashboard');
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
    }));
    window.open(pkg.paypalUrl, '_blank');
    toast({ title: "Redirecting to PayPal", description: `Processing ${pkg.name} package (${formatPriceMXN(pkg.price)})` });
  };

  const handlePremiumPurchase = (plan: typeof premiumPlans[0]) => {
    if (!plan.paypalUrl || plan.paypalUrl.startsWith('#')) {
      toast({ title: "Coming soon", description: "This membership plan will be available shortly.", variant: "destructive" });
      return;
    }
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, '/client/dashboard');
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify({
      role: 'client',
      planId: plan.id,
      name: plan.name,
      at: new Date().toISOString()
    }));
    window.open(plan.paypalUrl, '_blank');
    toast({ title: 'Redirecting to PayPal', description: `Selected: ${plan.name} (${formatPriceUSD(plan.price)}/${plan.period})` });
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // ── Owner: redirect message ──────────────────────────────────────────────
  if (isOwner) {
    return (
      <div className="bg-gradient-to-b from-background via-background to-muted/30 min-h-screen">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50 pt-[env(safe-area-inset-top)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigate('/owner/dashboard')} className="gap-2">Back</Button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Packages</span>
              </div>
              <div className="w-20" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-4">
          <Crown className="w-12 h-12 text-amber-400" />
          <h2 className="text-xl font-bold text-foreground">Membership packages are available in Explorer mode</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Switch to Explorer mode to view and purchase premium memberships and tokens.
          </p>
        </div>
      </div>
    );
  }

  // ── Client: full packages view ───────────────────────────────────────────
  return (
    <div className="bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client/dashboard')} className="gap-2">Back</Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Membership Packages</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-12">

        {/* ═══════════════════ PREMIUM MEMBERSHIP PLANS ═══════════════════ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Premium Membership</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Choose Your Membership</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Join Swipess and unlock full access to Tulum's trusted community. Discover properties, connect with service providers, and list your own offerings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {premiumPlans.map((plan, index) => {
              const styles = getPremiumTierStyles(plan.tier, plan.highlight);
              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className={`relative h-full flex flex-col overflow-hidden bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300 hover:scale-[1.02]`}>
                    {plan.highlight && (
                      <div className="absolute top-0 left-0 right-0 z-10">
                        <div className="bg-gradient-to-r from-[#0070f3] to-[#00a6ff] text-white text-xs font-bold py-1.5 text-center tracking-wide uppercase">Best Value</div>
                      </div>
                    )}
                    <CardHeader className={`pb-2 ${plan.highlight ? 'pt-10' : 'pt-6'}`}>
                      <div className={`mb-3 p-3 rounded-xl ${styles.badge} w-fit`}>
                        {plan.highlight ? <Zap className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">{formatPriceUSD(plan.price)}</span>
                        <span className="text-muted-foreground text-sm">USD / {plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      <div className="space-y-2.5">
                        {membershipBenefits.map((benefit, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{benefit}</span>
                          </div>
                        ))}
                        {/* AI Assistant feature */}
                        <div className="flex items-start gap-2 text-sm pt-1">
                          <Bot className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">AI assistant to create listings, generate descriptions, and discover Tulum</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 pb-6">
                      <Button onClick={() => handlePremiumPurchase(plan)} className={`w-full h-11 font-semibold ${styles.button}`}>
                        {plan.highlight ? 'Subscribe Now' : 'Subscribe'}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* ═══════════════════ TOKEN PACKAGES ═══════════════════ */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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

          {packagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="h-96 rounded-2xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : packagesError ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-destructive font-medium">Failed to load packages</p>
              <p className="text-muted-foreground text-sm">Please check your connection and try again.</p>
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
                  <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.1 }}>
                    <Card className={`relative h-full flex flex-col overflow-hidden bg-black/40 backdrop-blur-md border border-white/10 ${styles.border} ${styles.glow} transition-all duration-500 hover:scale-[1.02] group`}>
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 z-10">
                          <div className="bg-gradient-to-r from-[#E4007C] to-[#ff009e] text-white text-[10px] font-black py-1.5 text-center tracking-widest uppercase shadow-lg">BEST VALUE</div>
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
                          <span className="text-4xl font-bold text-foreground">{formatPriceMXN(pkg.price)}</span>
                          <span className="text-muted-foreground text-sm ml-1">MXN</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatPriceMXN(pkg.pricePerToken)} per token</p>
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
                          {isPopular ? 'Get Best Value' : 'Buy Now'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
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
              <h4 className="font-medium text-foreground">What's the difference between tokens and membership?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Tokens are one-time purchases to start new conversations instantly. Membership plans give you full platform access including the ability to post listings, connect with members, and use the AI assistant.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">Which membership is right for me?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                The Yearly plan is the best value for residents and investors. The Six-Month plan works well for digital nomads and seasonal visitors. Month-to-Month is perfect if you're exploring Tulum short-term.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-background border border-border/50">
              <h4 className="font-medium text-foreground">Can I cancel my membership?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Yes, you can cancel anytime. Contact support within 24 hours of purchase for a full refund if you haven't used any premium features.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
