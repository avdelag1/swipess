import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Crown, Check, Shield, Clock, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { STORAGE } from '@/constants/app';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
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
  durationText: string;
  benefits: string[];
  paypalUrl: string;
  highlight?: boolean;
  accent: 'blue' | 'pink' | 'gold';
};

const clientPlans: Plan[] = [
  {
    id: 'client-unlimited-1-month',
    name: '1 Month',
    label: 'STARTER',
    price: '$39',
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
    accent: 'blue',
  },
  {
    id: 'client-unlimited-6-months',
    name: '6 Months',
    label: 'POPULAR',
    price: '$119',
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
    accent: 'pink',
  },
  {
    id: 'client-unlimited-1-year',
    name: '1 Year',
    label: 'BEST VALUE',
    price: '$299',
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
    accent: 'gold',
  },
];

const accentStyles = {
  blue: {
    border: 'border-blue-500/20',
    badge: 'bg-blue-500/15 text-blue-400',
    button: 'bg-gradient-to-r from-blue-600 to-blue-400',
    checkColor: 'text-blue-400',
    topGradient: 'from-blue-500/8 via-transparent to-transparent',
  },
  pink: {
    border: 'border-pink-500/25',
    badge: 'bg-pink-500/15 text-pink-400',
    button: 'bg-gradient-to-r from-pink-600 to-orange-500',
    checkColor: 'text-pink-400',
    topGradient: 'from-pink-500/8 via-transparent to-transparent',
  },
  gold: {
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/15 text-amber-400',
    button: 'bg-gradient-to-r from-amber-500 to-orange-500',
    checkColor: 'text-amber-400',
    topGradient: 'from-amber-500/8 via-transparent to-transparent',
  },
};

export function SubscriptionPackages({ isOpen = true, onClose, reason, userRole = 'client' }: SubscriptionPackagesProps) {
  const { user } = useAuth();

  if (!isOpen) return null;

  const plans = clientPlans;

  const handleSubscribe = async (plan: Plan) => {
    const selection = { role: userRole, planId: plan.id, name: plan.name, price: plan.price, at: new Date().toISOString() };
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify(selection));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

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
        is_read: false
      }]).then(
        () => {},
        () => {}
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-background border-border overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="text-center px-4 pt-6 pb-3">
          <Crown className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent">
            Unlock Premium
          </h2>
          {reason && (
            <p className="text-xs text-muted-foreground mt-1.5">{reason}</p>
          )}
        </div>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-5 pb-3 items-stretch">
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
                  "flex-1 flex flex-col rounded-2xl border backdrop-blur-xl bg-card/50 p-4 relative overflow-hidden",
                  style.border,
                  isHighlight && "ring-1 ring-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.08)]"
                )}
              >
                <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-b pointer-events-none", style.topGradient)} />

                <div className="relative flex flex-col flex-1">
                  {/* Badge */}
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit mb-2", style.badge)}>
                    {pkg.label}
                  </span>

                  <h3 className="text-sm font-bold text-foreground">{pkg.name}</h3>

                  <div className="flex items-baseline gap-1 mt-1 mb-3">
                    <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{pkg.price}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">USD {pkg.durationText}</span>
                  </div>

                  <div className="h-px bg-border mb-2.5" />

                  <div className="flex-1 space-y-1.5 mb-3">
                    {pkg.benefits.map((feature, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className={cn("w-3 h-3 flex-shrink-0 mt-0.5", style.checkColor)} />
                        <span className="text-[11px] sm:text-xs text-foreground/80 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleSubscribe(pkg)}
                    className={cn(
                      "w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white transition-opacity hover:opacity-90",
                      style.button,
                      isHighlight && "shadow-md shadow-amber-500/15"
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
        <div className="flex items-center justify-center gap-5 px-4 pb-4 pt-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Shield className="w-3 h-3 text-green-500" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="w-3 h-3 text-blue-400" />
            <span>Instant</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Cancel Anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
