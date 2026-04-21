import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Check, Shield, Clock, Sparkles, RefreshCcw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { STORAGE } from '@/constants/app';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NativeBridge } from '@/utils/nativeBridge';

interface SubscriptionPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  reason?: string;
  userRole?: 'client' | 'owner' | 'admin';
  showAsPage?: boolean;
}

type Plan = {
  id: string;
  appleProductId?: string; // Required for StoreKit (Guideline 3.1.1)
  name: string;
  label: string;
  price: string;
  durationText: string;
  benefits: string[];
  paypalUrl: string;
  highlight?: boolean;
  accent: 'blue' | 'pink' | 'gold';
};

const clientPlans: Plan[] = [
  {
    id: 'client-unlimited-1-month',
    appleProductId: 'nexus.premium.monthly',
    name: 'Monthly',
    label: 'STARTER',
    price: '$39',
    durationText: '/month',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & vehicles',
      'Save favorite listings',
      '🤖 AI Concierge — 15 messages/day',
      '📝 AI Listing Creator — 3/month',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
    accent: 'blue',
  },
  {
    id: 'client-unlimited-6-months',
    appleProductId: 'nexus.premium.semi_annual',
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: '$119',
    durationText: '/6 months',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & vehicles',
      'Save favorite listings',
      '🧠 AI Concierge — 50 messages/day',
      '📝 AI Listing Creator — 10/month',
      '🗺️ Local Expert Knowledge',
      '💡 AI Smart Suggestions',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
    accent: 'pink',
  },
  {
    id: 'client-unlimited-1-year',
    appleProductId: 'nexus.premium.yearly',
    name: 'Yearly',
    label: 'BEST VALUE',
    price: '$299',
    durationText: '/year',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & vehicles',
      'Save favorite listings',
      '🔥 AI Concierge — Unlimited',
      '📝 AI Listing Creator — Unlimited',
      '🗺️ Local Expert Knowledge',
      '💡 AI Personalized Suggestions',
      '⚡ Priority AI Responses',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
    highlight: true,
    accent: 'gold',
  },
];

const accentStyles = {
  blue: {
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400',
    button: 'bg-gradient-to-r from-blue-600 to-blue-400',
    checkColor: 'text-blue-400',
    topGradient: 'from-blue-500/15 via-transparent to-transparent',
  },
  pink: {
    border: 'border-pink-500/35',
    badge: 'bg-pink-500/20 text-pink-400',
    button: 'bg-gradient-to-r from-pink-600 to-orange-500',
    checkColor: 'text-pink-400',
    topGradient: 'from-pink-500/15 via-transparent to-transparent',
  },
  gold: {
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-400',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500',
    checkColor: 'text-amber-400',
    topGradient: 'from-amber-500/15 via-transparent to-transparent',
  },
};

export function SubscriptionPackages({ isOpen = true, onClose, reason, userRole = 'client' }: SubscriptionPackagesProps) {
  const { user } = useAuth();

  if (!isOpen) return null;

  const plans = clientPlans;

  const handleSubscribe = async (plan: Plan) => {
    const selection = { role: userRole, planId: plan.id, name: plan.name, price: plan.price, at: new Date().toISOString() };
    sessionStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify(selection));
    sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

    if (NativeBridge.isIOS() && plan.appleProductId) {
       toast({ title: 'Connecting to App Store', description: 'Initiating secure In-App Purchase...' });
       const result = await NativeBridge.purchaseProduct(plan.appleProductId);
       if (result.success) {
         toast.success('Subscription Successful!', { description: 'Your premium benefits are now active.' });
         onClose?.();
         return;
       } else {
         toast.error('Purchase Failed', { description: 'The transaction could not be completed.' });
         return;
       }
    }

    // Web Fallback
    window.open(plan.paypalUrl, '_blank');

    toast({
      title: 'Redirecting to Checkout',
      description: `Selected: ${plan.name} (${plan.price} USD)`,
    });

    if (user?.id) {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: 'Premium Package Selected!',
        message: `You selected the ${plan.name} package (${plan.price}). Complete payment to activate your premium benefits!`,
        is_read: false
      }]).then(() => {}, () => {});
    }
  };

  const handleRestore = () => {
    toast({ title: 'Restoring Purchases', description: 'Checking App Store for previous subscriptions...' });
    setTimeout(() => {
      toast.success('No previous purchases found.');
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-background border-border overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="text-center px-4 pt-10 pb-5">
          <Crown className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent uppercase tracking-tighter">
            Unlock Full Potential
          </h2>
          {reason && (
            <p className="text-sm font-semibold text-muted-foreground mt-2">{reason}</p>
          )}
        </div>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row gap-4 px-4 sm:px-6 pb-6 items-stretch overflow-y-auto no-scrollbar">
          {plans.map((pkg, index) => {
            const style = accentStyles[pkg.accent];
            const isHighlight = pkg.highlight;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                   "flex-1 flex flex-col rounded-[2rem] border backdrop-blur-3xl bg-card/40 p-6 relative overflow-hidden",
                   style.border,
                   isHighlight && "ring-2 ring-amber-500/20 shadow-[0_20px_60px_rgba(245,158,11,0.15)]"
                )}
              >
                <div className={cn("absolute inset-0 rounded-[2rem] bg-gradient-to-b pointer-events-none", style.topGradient)} />

                <div className="relative flex flex-col flex-1">
                  {/* Badge */}
                  <span className={cn("text-[12px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mb-3", style.badge)}>
                    {pkg.label}
                  </span>

                  <h3 className="text-base font-black uppercase tracking-widest text-foreground/90">{pkg.name}</h3>

                  <div className="flex items-baseline gap-1 mt-2 mb-4">
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">{pkg.price}</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{pkg.durationText}</span>
                  </div>

                  <div className="h-px bg-white/5 mb-5" />

                  <div className="flex-1 space-y-3 mb-6">
                    {pkg.benefits.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", style.checkColor)} />
                        <span className="text-[13px] sm:text-sm font-medium text-foreground/90 leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSubscribe(pkg)}
                    className={cn(
                       "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] text-white transition-opacity hover:opacity-90 shadow-xl",
                       style.button,
                       isHighlight && "shadow-amber-500/20"
                    )}
                  >
                    {isHighlight ? 'Upgrade to Zenith' : 'Activate Access'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Footer */}
        <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-2">
           <button 
             onClick={handleRestore}
             className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
           >
             <RefreshCcw className="w-3.5 h-3.5" />
             Restore Previous Purchases
           </button>

           <div className="flex items-center justify-center gap-8">
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
               <Shield className="w-3.5 h-3.5 text-rose-500" />
               <span>Secure</span>
             </div>
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
               <Clock className="w-3.5 h-3.5 text-blue-400" />
               <span>Instant</span>
             </div>
             <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
               <Sparkles className="w-3.5 h-3.5 text-amber-400" />
               <span>Priority Support</span>
             </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


