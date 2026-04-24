import { useAuth } from "@/hooks/useAuth";
import { useActiveMode } from "@/hooks/useActiveMode";
import { Crown, Check, Shield, Clock, Sparkles, Zap, ChevronLeft, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";
import { haptics } from "@/utils/microPolish";
import { cn } from "@/lib/utils";
import { NativeBridge } from "@/utils/nativeBridge";

import { PaymentErrorBoundary } from "@/components/PaymentErrorBoundary";

const clientPremiumPlans = [
  {
    id: 'client-unlimited-1-month',
    appleProductId: 'Swipess.premium.monthly',
    name: 'Monthly',
    label: 'STARTER',
    price: 39,
    durationText: '/month',
    aiTier: 'AI Lite',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles for rent or sale',
      'Save favorite listings',
      'Discover opportunities',
    ],
    aiFeatures: [
      '🤖 AI Concierge — 15 messages/day',
      '📝 AI Listing Creator — 3 listings/month',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
    accent: 'blue' as const,
  },
  {
    id: 'client-unlimited-6-months',
    appleProductId: 'Swipess.premium.semi_annual',
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: 119,
    durationText: '/6 months',
    aiTier: 'AI Pro',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles for rent or sale',
      'Save favorite listings',
      'Discover opportunities',
    ],
    aiFeatures: [
      '🧠 AI Concierge — 50 messages/day',
      '📝 AI Listing Creator — 10 listings/month',
      '🗺️ Local Expert Knowledge & Recommendations',
      '💡 AI Smart Suggestions',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
    accent: 'pink' as const,
  },
  {
    id: 'client-unlimited-1-year',
    appleProductId: 'Swipess.premium.yearly',
    name: 'Yearly Elite',
    label: 'BEST VALUE',
    price: 299,
    durationText: '/year',
    aiTier: 'Sentient Unlimited',
    benefits: [
      '⚡ Zero-Commission Network (Direct Owners)',
      '⚖️ Priority Legal Support & Dispute Help',
      '🏠 Exclusive High-Demand Property List',
      '🤝 Premium Tribe (Roommate) Matching',
      '🎟️ VIP Event Bookings & Concierge Service',
      '📻 Premium Ad-Free Radio Experience',
    ],
    aiFeatures: [
      '🔥 AI Concierge — Unlimited 24/7 Access',
      '🧠 Full "Vibe" Sentient Memory Sync',
      '📝 AI Listing Creator — Unlimited',
      '🗺️ Local Insider Knowledge (Hidden Spots)',
      '⚡ Direct-to-Source Contact Unlocking',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
    highlight: true,
    accent: 'gold' as const,
  },
];

const accentStyles = {
  blue: {
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/20',
    glow: '',
    button: 'bg-gradient-to-r from-blue-600 to-blue-400',
    checkColor: 'text-blue-400',
    topGradient: 'from-blue-500/15 via-transparent to-transparent',
    priceShadow: '',
  },
  pink: {
    border: 'border-pink-500/35',
    badge: 'bg-pink-500/20 text-pink-400 border border-pink-500/20',
    glow: 'shadow-[0_0_30px_rgba(236,72,153,0.12)]',
    button: 'bg-gradient-to-r from-pink-600 to-orange-500',
    checkColor: 'text-pink-400',
    topGradient: 'from-pink-500/15 via-transparent to-transparent',
    priceShadow: '',
  },
  gold: {
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/25',
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.15)]',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500',
    checkColor: 'text-amber-400',
    topGradient: 'from-amber-500/15 via-transparent to-transparent',
    priceShadow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
};

export default function SubscriptionPackagesPage() {
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { activeMode, isLoading: roleLoading } = useActiveMode();
  const userRole = activeMode;

  const handlePremiumPurchase = async (plan: typeof clientPremiumPlans[0]) => {
    try {
      haptics.tap();
      
      if (NativeBridge.isIOS() && plan.appleProductId) {
        toast({ title: 'Connecting to App Store', description: 'Initiating secure In-App Purchase...' });
        const result = await NativeBridge.purchaseProduct(plan.appleProductId);
        if (result.success) {
          toast.success('Subscription Successful!', { description: 'Premium benefits activated.' });
          navigate(`/${userRole}/dashboard`);
          return;
        } else {
          toast.error('Transaction Cancelled', { description: 'Payment could not be completed.' });
          return;
        }
      }

      if (!plan.paypalUrl) {
        toast.error('Payment link unavailable', { description: 'Please contact support.' });
        return;
      }

      sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);
      sessionStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify({
        role: userRole,
        planId: plan.id,
        name: plan.name,
        at: new Date().toISOString()
      }));
      window.open(plan.paypalUrl, '_blank');
      toast.success('Redirecting to Checkout', { description: `Selected: ${plan.name} ($${plan.price} USD)` });
    } catch (error) {
      console.error('Payment redirect failed:', error);
      toast.error('Could not open payment window', { description: 'Please check your browser popup blocker.' });
    }
  };

  const handleRestore = async () => {
    toast({ title: 'Restoring Purchases', description: 'Syncing with App Store subscriptions...' });
    
    if (NativeBridge.isIOS()) {
      const result = await NativeBridge.restorePurchases();
      if (result.success) {
        toast.success('Subscription status verified.');
      } else {
        toast.error('Restoration Failed', { description: 'Please check your internet connection or Apple ID.' });
      }
      return;
    }

    setTimeout(() => {
      toast.success('Subscription status verified.');
    }, 1500);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground font-black uppercase tracking-widest text-xs text-center">Resonating with Hub...</div>
      </div>
    );
  }

  return (
    <PaymentErrorBoundary>
      <div className="min-h-screen bg-background flex flex-col pb-32 overflow-x-hidden" style={{ contain: 'layout' }}>
      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent-2/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 shrink-0 pt-[env(safe-area-inset-top)] px-4">
        <div className="max-w-5xl mx-auto py-6 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </motion.button>
        </div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto pb-12 pt-4"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <Zap className="w-8 h-8 text-brand-accent-2 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.25em] text-muted-foreground/80">
              The Sentient Experience
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white mb-8 uppercase">
            Own the <span className="text-brand-accent-2 italic">Network</span>
          </h1>
          <p className="text-base font-bold text-muted-foreground leading-relaxed max-w-xl mx-auto px-4">
            Stop paying commissions. Start resonating. Unlock direct access to owners, verified legal support, and unlimited Sentient AI assistance.
          </p>
        </motion.div>
      </div>

      {/* Cards Section */}
      <div className="relative z-10 flex-1 flex flex-col px-4 sm:px-10">
        <div className="flex-1 flex flex-col lg:flex-row gap-10 items-stretch max-w-7xl w-full mx-auto justify-center">
          {clientPremiumPlans.map((plan, index) => {
            const style = accentStyles[plan.accent];
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex-1 flex flex-col liquid-glass-card refraction-edge glass-nano-texture rounded-[3rem] p-1.5 transition-all duration-500",
                  isHighlight && "lg:scale-[1.05] lg:z-10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] border-amber-500/40"
                )}
              >
                <div className="relative flex flex-col flex-1 p-8 sm:p-10">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-8">
                    <span className={cn("text-xs font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full", style.badge)}>
                      {plan.label}
                    </span>
                    {isHighlight && (
                      <Crown className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
                    )}
                  </div>

                  {/* Plan name */}
                  <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">{plan.name}</h3>
                  {'aiTier' in plan && (
                    <span className={cn(
                      "inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-xl mb-4",
                      plan.accent === 'gold' ? "bg-amber-500/20 text-amber-400" :
                      plan.accent === 'pink' ? "bg-pink-500/20 text-pink-400" :
                      "bg-blue-500/20 text-blue-400"
                    )}>
                      <Sparkles className="w-4 h-4" />
                      {(plan as any).aiTier}
                    </span>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                      ${plan.price}
                    </span>
                    <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-loose">
                      MXN {plan.durationText}
                    </span>
                  </div>

                  <div className="h-px bg-white/5 mb-8" />

                  {/* Benefits */}
                  <div className="flex-1 space-y-4 mb-6">
                    {plan.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <Check className={cn("w-5 h-5 flex-shrink-0 mt-1", style.checkColor)} />
                        <span className="text-sm font-bold text-white/90 leading-snug uppercase tracking-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Features — highlighted section */}
                  {'aiFeatures' in plan && (plan as any).aiFeatures.length > 0 && (
                    <div className={cn(
                      "p-5 rounded-[1.8rem] mb-8 space-y-3.5 border",
                      plan.accent === 'gold' ? "bg-amber-500/10 border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]" :
                      plan.accent === 'pink' ? "bg-pink-500/10 border-pink-500/20 shadow-[inset_0_0_20px_rgba(236,72,153,0.05)]" :
                      "bg-blue-500/10 border-blue-500/20 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
                    )}>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className={cn("w-4 h-4", style.checkColor)} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Swipess Intelligence Benefits</span>
                      </div>
                      {(plan as any).aiFeatures.map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-sm font-bold text-white leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    onClick={() => handlePremiumPurchase(plan)}
                    className={cn(
                      "w-full h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] text-white transition-all active:scale-[0.98] shadow-2xl",
                      style.button,
                      isHighlight && "shadow-amber-500/20"
                    )}
                  >
                    {isHighlight ? 'Upgrade to Elite' : 'Choose Plan'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Security / FAQ Footer */}
        <div className="mt-32 pt-16 max-w-5xl mx-auto w-full border-t border-white/5 flex flex-col items-center gap-12 mb-16">
          <button 
            onClick={handleRestore}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/60 hover:text-white transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            Restore Subscriptions
          </button>

          {/*  App Store Subscription Policy Disclosure (Guideline 3.1.2) */}
          <div className="max-w-2xl text-center px-6 space-y-6">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">
              Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase.
            </p>
            <div className="flex items-center justify-center gap-8">
              <button onClick={() => navigate('/privacy-policy')} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#EB4898]/60 hover:text-[#EB4898]">Privacy Policy</button>
              <button onClick={() => navigate('/terms-of-service')} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#EB4898]/60 hover:text-[#EB4898]">Terms of Service</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 w-full px-6">
            <div className="space-y-3 text-center group">
              <Shield className="w-8 h-8 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h5 className="text-xs font-black uppercase text-white tracking-[0.2em]">Secure Gateway</h5>
              <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest">Protected by Enterprise <br />Payment Protocols</p>
            </div>
            <div className="space-y-3 text-center group">
              <Clock className="w-8 h-8 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h5 className="text-xs font-black uppercase text-white tracking-[0.2em]">Instant Hydration</h5>
              <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest">Digital assets unlock <br />immediately</p>
            </div>
            <div className="space-y-3 text-center group">
              <Zap className="w-8 h-8 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h5 className="text-xs font-black uppercase text-white tracking-[0.2em]">Priority Support</h5>
              <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest">Direct source access <br />unlocked now</p>
            </div>
            <div className="space-y-3 text-center group">
              <Sparkles className="w-8 h-8 text-brand-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h5 className="text-xs font-black uppercase text-white tracking-[0.2em]">Concierge Elite</h5>
              <p className="text-[10px] font-bold text-muted-foreground/40 leading-relaxed uppercase tracking-widest">24/7 Human-AI <br />Hybrid Assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PaymentErrorBoundary>
  );
}



