import { useAuth } from "@/hooks/useAuth";
import { useActiveMode } from "@/hooks/useActiveMode";
import { Crown, Check, Shield, Clock, Sparkles, Zap, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/sonner";
import { STORAGE } from "@/constants/app";
import { haptics } from "@/utils/microPolish";
import { cn } from "@/lib/utils";

import { PaymentErrorBoundary } from "@/components/PaymentErrorBoundary";

const clientPremiumPlans = [
  {
    id: 'client-unlimited-1-month',
    name: 'Monthly',
    label: 'STARTER',
    price: 39,
    durationText: '/month',
    aiTier: 'AI Lite',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles or bicycles for rent or sale',
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
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: 119,
    durationText: '/6 months',
    aiTier: 'AI Pro',
    benefits: [
      'Communicate with listings and members',
      'Post properties for rent or sale',
      'Post services (chef, driver, cleaning, etc.)',
      'Post motorcycles or bicycles for rent or sale',
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
  const { user: _user } = useAuth();
  const navigate = useNavigate();
  const { activeMode, isLoading: roleLoading } = useActiveMode();
  const userRole = activeMode;

  const handlePremiumPurchase = (plan: typeof clientPremiumPlans[0]) => {
    try {
      haptics.tap();
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
      toast.success('Redirecting to PayPal', { description: `Selected: ${plan.name} ($${plan.price} USD)` });
    } catch (error) {
      console.error('Payment redirect failed:', error);
      toast.error('Could not open payment window', { description: 'Please check your browser popup blocker.' });
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground font-black uppercase tracking-widest text-[10px] text-center">Resonating with Hub...</div>
      </div>
    );
  }

  return (
    <PaymentErrorBoundary>
      <div className="w-full flex-1 flex flex-col pb-40 overflow-y-auto overscroll-contain select-none">
      {/* Background Polish */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent-2/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 shrink-0 pt-[env(safe-area-inset-top)] px-4">
        <div className="max-w-5xl mx-auto py-4 flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back
          </motion.button>
        </div>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl mx-auto pb-12"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-brand-accent-2 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              The Sentient Experience
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-6">
            Own the <span className="text-brand-accent-2 italic">Network</span>
          </h1>
          <p className="text-sm font-bold text-muted-foreground leading-relaxed max-w-lg mx-auto">
            Stop paying commissions. Start resonating. Unlock direct access to owners, verified legal support, and unlimited Sentient AI assistance.
          </p>
        </motion.div>
      </div>

      {/* Cards Section */}
      <div className="relative z-10 flex-1 flex flex-col px-4 sm:px-8">
        <div className="flex-1 flex flex-col lg:flex-row gap-8 items-stretch max-w-7xl w-full mx-auto justify-center">
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
                  "flex-1 flex flex-col liquid-glass-card refraction-edge glass-nano-texture rounded-[2.5rem] p-1 transition-all duration-500",
                  isHighlight && "lg:scale-[1.05] lg:z-10 shadow-[0_0_50px_rgba(251,191,36,0.1)] border-amber-500/30"
                )}
              >
                <div className="relative flex flex-col flex-1 p-6 sm:p-8">
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl", style.badge)}>
                      {plan.label}
                    </span>
                    {isHighlight && (
                      <Crown className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    )}
                  </div>

                  {/* Plan name */}
                  <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">{plan.name}</h3>
                  {'aiTier' in plan && (
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg mb-2",
                      plan.accent === 'gold' ? "bg-amber-500/15 text-amber-400" :
                      plan.accent === 'pink' ? "bg-pink-500/15 text-pink-400" :
                      "bg-blue-500/15 text-blue-400"
                    )}>
                      <Sparkles className="w-2.5 h-2.5" />
                      {(plan as any).aiTier}
                    </span>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                      ${plan.price}
                    </span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                      MXN {plan.durationText}
                    </span>
                  </div>

                  <div className="h-px bg-white/10 mb-6" />

                  {/* Benefits */}
                  <div className="flex-1 space-y-3 mb-4">
                    {plan.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", style.checkColor)} />
                        <span className="text-[11px] font-bold text-white/80 leading-relaxed uppercase tracking-tight">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Features — highlighted section */}
                  {'aiFeatures' in plan && (plan as any).aiFeatures.length > 0 && (
                    <div className={cn(
                      "p-3 rounded-2xl mb-6 space-y-2.5 border",
                      plan.accent === 'gold' ? "bg-amber-500/5 border-amber-500/15" :
                      plan.accent === 'pink' ? "bg-pink-500/5 border-pink-500/15" :
                      "bg-blue-500/5 border-blue-500/15"
                    )}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className={cn("w-3 h-3", style.checkColor)} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">AI Benefits</span>
                      </div>
                      {(plan as any).aiFeatures.map((feature: string, i: number) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="text-[11px] font-bold text-white/90 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <Button
                    onClick={() => handlePremiumPurchase(plan)}
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95",
                      style.button,
                      isHighlight && "shadow-xl shadow-amber-500/20"
                    )}
                  >
                    {isHighlight ? 'Upgrade Now' : 'Select Plan'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Security / FAQ Footer */}
        <div className="mt-24 pt-12 max-w-4xl mx-auto w-full border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
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
          <div className="space-y-2 text-center">
            <Zap className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest">Fast Access</h5>
            <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed uppercase">Unlock all features <br />immediately</p>
          </div>
          <div className="space-y-2 text-center">
            <Sparkles className="w-6 h-6 text-brand-primary mx-auto mb-2" />
            <h5 className="text-[10px] font-black uppercase text-white tracking-widest">Premium Support</h5>
            <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed uppercase">Priority help for <br />gold members</p>
          </div>
        </div>
      </div>
    </div>
    </PaymentErrorBoundary>
  );
}
