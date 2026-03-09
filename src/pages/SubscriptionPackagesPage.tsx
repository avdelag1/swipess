import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveMode } from "@/hooks/useActiveMode";
import { ArrowLeft, Sparkles, MessageCircle, Crown, Zap, Star, Check, Clock, Shield, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";
import { haptics } from "@/utils/microPolish";
import { cn } from "@/lib/utils";

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

const getMessageTierStyles = (tier: string) => {
  switch (tier) {
    case 'starter':
      return {
        accent: 'bg-brand-primary',
        glow: 'shadow-[0_0_20px_rgba(0,112,243,0.3)]',
        button: 'bg-brand-primary hover:bg-brand-primary/80',
      };
    case 'standard':
      return {
        accent: 'bg-brand-accent-2',
        glow: 'shadow-[0_0_20px_rgba(228,0,124,0.3)]',
        button: 'bg-brand-accent-2 hover:bg-brand-accent-2/80',
      };
    case 'premium':
      return {
        accent: 'bg-brand-accent-2',
        glow: 'shadow-[0_0_40px_rgba(228,0,124,0.4)]',
        button: 'bg-brand-accent-2 hover:bg-brand-accent-2/80',
      };
    default:
      return { accent: 'bg-white/10', glow: '', button: '' };
  }
};

export default function SubscriptionPackagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeMode, isLoading: roleLoading } = useActiveMode();

  const userRole = activeMode;
  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';
  const premiumPlans = userRole === 'owner' ? ownerPremiumPlans : clientPremiumPlans;
  const roleLabel = userRole === 'owner' ? 'Provider' : 'Explorer';

  const { data: messagePackages, isLoading: packagesLoading } = useQuery({
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

  const convertPackages = (dbPackages: any[] | undefined) => {
    if (!dbPackages || dbPackages.length === 0) return [];
    const tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
    const iconMap = { starter: MessageCircle, standard: Zap, premium: Crown };

    return dbPackages.map((pkg, index) => {
      const pricePerToken = pkg.tokens > 0 ? pkg.price / pkg.tokens : 0;
      const tier = tierMap[index] || 'starter';
      return {
        id: pkg.id,
        name: tier.toUpperCase(),
        tokens: pkg.tokens,
        price: pkg.price,
        tier,
        icon: iconMap[tier],
        paypalUrl: pkg.paypal_link || '',
      };
    });
  };

  const packagesUI = convertPackages(messagePackages);

  const handlePurchase = (paypalUrl: string, name: string) => {
    haptics.tap();
    if (!paypalUrl) {
      toast.error("Contact Support", { description: "Payment link not found." });
      return;
    }
    window.open(paypalUrl, '_blank');
    toast.success("Opening PayPal", { description: `Processing: ${name}` });
  };

  if (roleLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-32 overflow-x-hidden">
      {/* Visual Depth Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent-2/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-[calc(56px+var(--safe-top)+1.5rem)] sm:px-6">

        {/* Header */}
        <header className="mb-12">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>

          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-brand-accent-2 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Elite Marketplace
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-brand-accent-2 underline-offset-8">
            Access Credits
          </h1>
          <p className="text-sm font-bold text-muted-foreground mt-4 leading-relaxed">
            Acquire credits to initiate new marketplace connections. Every conversation started includes unlimited messaging for the life of the match.
          </p>
        </header>

        {/* CREDIT PACKAGES */}
        <div className="space-y-6">
          {packagesLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-40 w-full rounded-[2rem] bg-white/5 animate-pulse" />)
          ) : (
            packagesUI.map((pkg, i) => {
              const styles = getMessageTierStyles(pkg.tier);
              const Icon = pkg.icon;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="stagger-item"
                >
                  <Card className={cn(
                    "liquid-glass-card refraction-edge glass-nano-texture rounded-[2rem] group transition-all",
                    styles.glow
                  )}>
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-white/5 shadow-2xl", styles.accent)}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xs font-black uppercase tracking-widest text-white/40">{pkg.name} Tier</h3>
                          <Badge className="bg-white/10 text-white font-black text-[9px] uppercase border-none rounded-lg">Popular</Badge>
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-black text-white tracking-tighter">{pkg.tokens}</span>
                          <span className="text-sm font-black text-white/40 uppercase">Credits</span>
                        </div>

                        <Button
                          onClick={() => handlePurchase(pkg.paypalUrl, pkg.name)}
                          className={cn("w-full h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95", styles.button)}
                        >
                          Unlock for ${pkg.price} MXN
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* UNLIMITED PLANS */}
        {premiumPlans.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center gap-2 mb-8">
              <Crown className="w-5 h-5 text-brand-accent-2" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Unlimited Subscriptions</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {premiumPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="stagger-item"
                >
                  <Card className="liquid-glass-card refraction-edge glass-nano-texture rounded-[2rem] p-6 group transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tighter">{plan.name}</h4>
                        <p className="text-[10px] font-black uppercase text-brand-accent-2 tracking-widest mt-1">Full Hub Access</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-white">${plan.price}</span>
                        <span className="text-[10px] font-black text-white/40 block">USD {plan.durationText}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(plan.paypalUrl, plan.name)}
                      className="w-full h-12 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all"
                    >
                      Go Unlimited
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Security / FAQ Footer */}
        <div className="mt-24 pt-12 border-t border-white/5 grid grid-cols-2 gap-8 mb-12">
          <div className="space-y-2 text-center">
            <Shield className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest">Secure Flow</h5>
            <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed uppercase">Protected by PayPal <br />Global Systems</p>
          </div>
          <div className="space-y-2 text-center">
            <Clock className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest">Instant Use</h5>
            <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed uppercase">Credits activate <br />in seconds</p>
          </div>
        </div>

      </div>
    </div>
  );
}
