import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Check, Shield, Clock, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { STORAGE } from '@/constants/app';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SubscriptionPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  reason?: string;
  userRole?: 'client' | 'owner' | 'admin';
  showAsPage?: boolean;
}

type Plan = {
  id: string;
  name: string;
  label: string;
  price: string;
  priceNum: number;
  durationText: string;
  perMonth: string;
  benefits: string[];
  paypalUrl: string;
  highlight?: boolean;
};

const clientPlans: Plan[] = [
  {
    id: 'client-unlimited-1-month',
    name: 'Monthly',
    label: 'STARTER',
    price: '$39',
    priceNum: 39,
    perMonth: '$39',
    durationText: 'Billed monthly',
    benefits: [
      'Communicate with listings',
      'Post properties & vehicles',
      'Save favorite listings',
      'AI Concierge — 15 msg/day',
      'AI Listing Creator — 3/mo',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
  },
  {
    id: 'client-unlimited-6-months',
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: '$119',
    priceNum: 119,
    perMonth: '$19.83',
    durationText: 'Billed every 6 months',
    benefits: [
      'Communicate with listings',
      'Post properties & vehicles',
      'Save favorite listings',
      'AI Concierge — 50 msg/day',
      'AI Listing Creator — 10/mo',
      'Local Expert Knowledge',
      'AI Smart Suggestions',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
    highlight: true,
  },
  {
    id: 'client-unlimited-1-year',
    name: 'Yearly',
    label: 'BEST VALUE',
    price: '$299',
    priceNum: 299,
    perMonth: '$24.92',
    durationText: 'Billed annually',
    benefits: [
      'Communicate with listings',
      'Post properties & vehicles',
      'Save favorite listings',
      'AI Concierge — Unlimited',
      'AI Listing Creator — Unlimited',
      'Local Expert Knowledge',
      'AI Personalized Suggestions',
      'Priority AI Responses',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
  },
];

export function SubscriptionPackages({ isOpen = true, onClose, reason, userRole = 'client' }: SubscriptionPackagesProps) {
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(1); // default to Popular

  if (!isOpen) return null;

  const plans = clientPlans;
  const activePlan = plans[selectedIndex];

  const handleSubscribe = async (plan: Plan) => {
    const selection = { role: userRole, planId: plan.id, name: plan.name, price: plan.price, at: new Date().toISOString() };
    sessionStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify(selection));
    sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

    window.open(plan.paypalUrl, '_blank');

    toast({
      title: 'Redirecting to PayPal',
      description: `Selected: ${plan.name} (${plan.price} USD)`,
    });

    if (user?.id) {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: 'Premium Package Selected!',
        message: `You selected the ${plan.name} package (${plan.price}). Complete payment to activate your premium benefits!`,
        is_read: false,
      }]).then(() => {}, () => {});
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] p-0 bg-background border-border overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="text-center px-5 pt-6 pb-2">
          <Crown className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <h2 className="text-2xl font-extrabold text-foreground">Unlock Premium</h2>
          {reason && (
            <p className="text-xs text-muted-foreground mt-1">{reason}</p>
          )}
        </div>

        {/* Segmented Selector */}
        <div className="px-5">
          <div className="flex bg-muted/50 rounded-2xl p-1 gap-0.5">
            {plans.map((plan, i) => (
              <button
                key={plan.id}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "relative flex-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200",
                  selectedIndex === i
                    ? "bg-card shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <span className="text-xs font-semibold block">{plan.name}</span>
                <span className="text-[10px] opacity-70 block">{plan.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Plan Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePlan.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="px-5 pb-2"
          >
            {/* Price Display */}
            <div className="text-center py-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-extrabold text-foreground tracking-tight">{activePlan.price}</span>
                <span className="text-sm text-muted-foreground font-medium">USD</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activePlan.durationText} · {activePlan.perMonth}/mo</p>
            </div>

            {/* Features Grid */}
            <div className="bg-muted/30 rounded-2xl p-4 mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">What's included</p>
              <div className="grid grid-cols-1 gap-2">
                {activePlan.benefits.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <span className="text-sm text-foreground/85 leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSubscribe(activePlan)}
              className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 active:opacity-95"
              style={{ minHeight: 52 }}
            >
              Subscribe Now — {activePlan.price}
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-5 px-5 pb-5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Cancel Anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
