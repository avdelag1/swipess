import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Check, ChevronLeft, Clock, Crown, RefreshCcw, Shield, Sparkles } from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NativeBridge } from '@/utils/nativeBridge';
import { PaymentOrchestrator } from '@/lib/iap/PaymentOrchestrator';
import { getSafePaymentUrl } from '@/config/iapProducts';

interface SubscriptionPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  reason?: string;
  userRole?: 'client' | 'owner' | 'admin';
  showAsPage?: boolean;
}

type Plan = {
  id: string;
  appleProductId?: string;
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
    appleProductId: 'Swipess.plus.monthly.v3',
    name: 'Monthly',
    label: 'STARTER',
    price: '$39.99',
    durationText: '/month',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & motos',
      'Save favorite listings',
      '🤖 AI Concierge — 15 messages/day',
      '📝 AI Listing Creator — 3/month',
    ],
    paypalUrl: getSafePaymentUrl('QSRXCJYYQ2UGY') ?? '',
    accent: 'blue',
  },
  {
    id: 'client-unlimited-6-months',
    appleProductId: 'Swipess.plus.semestral.v3',
    name: 'Semi-Annual',
    label: 'POPULAR',
    price: '$119.99',
    durationText: '/6 months',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & motos',
      'Save favorite listings',
      '🧠 AI Concierge — 50 messages/day',
      '📝 AI Listing Creator — 10/month',
      '🗺️ Local Expert Knowledge',
      '💡 AI Smart Suggestions',
    ],
    paypalUrl: getSafePaymentUrl('HUESWJ68BRUSY') ?? '',
    accent: 'pink',
  },
  {
    id: 'client-unlimited-1-year',
    appleProductId: 'Swipess.plus.annual.v3',
    name: 'Yearly',
    label: 'BEST VALUE',
    price: '$299.99',
    durationText: '/year',
    benefits: [
      'Communicate with listings and members',
      'Post properties, services & motos',
      'Save favorite listings',
      '🔥 AI Concierge — Unlimited',
      '📝 AI Listing Creator — Unlimited',
      '🗺️ Local Expert Knowledge',
      '💡 AI Personalized Suggestions',
      '⚡ Priority AI Responses',
    ],
    paypalUrl: getSafePaymentUrl('7E6R38L33LYUJ') ?? '',
    highlight: true,
    accent: 'gold',
  },
];

const accentStyles = {
  blue: {
    border: 'border-white/15',
    badge: 'bg-background text-foreground border border-border',
    button: 'bg-gradient-to-r from-zinc-900 to-zinc-700 text-white',
    checkColor: 'text-foreground',
    topGradient: 'from-white/10 via-transparent to-transparent',
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

export function SubscriptionPackages({
  isOpen = true,
  onClose,
  reason,
  userRole = 'client',
  showAsPage = false,
}: SubscriptionPackagesProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const openLegal = (doc: 'terms' | 'privacy') => {
    onClose?.();
    navigate(`/legal?doc=${doc}`);
  };

  if (!isOpen) return null;

  const handleSubscribe = async (plan: Plan) => {
    setIsPurchasing(true);

    if (user?.id) {
      supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: 'Premium Package Selected!',
        message: `You selected the ${plan.name} package (${plan.price}). Complete payment to activate your premium benefits!`,
        is_read: false
      }]).catch(() => {});
    }

    await PaymentOrchestrator.purchase({
      appleProductId: plan.appleProductId!,
      paypalUrl: plan.paypalUrl,
      returnPath: `/${userRole}/dashboard`,
      onSuccess: () => {
        appToast.success('Subscription Successful!');
        setIsPurchasing(false);
        onClose?.();
      },
      onError: (err) => {
        setIsPurchasing(false);
        if (err !== 'CANCELLED') {
          appToast.error('Purchase Failed', err);
        }
      }
    });
  };

  const handleRestore = async () => {
    await PaymentOrchestrator.restore();
  };

  const body = (
    <>
      <div className={cn('text-center px-4', showAsPage ? 'pt-safe-top pb-5' : 'pt-10 pb-5')}>
        {showAsPage && (
          <div className="flex items-center justify-start mb-6 px-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border text-xs font-black uppercase tracking-widest text-foreground/80"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        )}
        <Crown className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-500 via-orange-400 to-amber-400 bg-clip-text text-transparent uppercase tracking-tighter">
          Unlock Full Potential
        </h2>
        {reason && (
          <p className="text-sm font-semibold text-muted-foreground mt-2">{reason}</p>
        )}
      </div>

      <div className={cn(
        'flex flex-col sm:flex-row gap-4 px-4 sm:px-6 pb-6 items-stretch',
        showAsPage ? 'overflow-visible' : 'overflow-y-auto no-scrollbar'
      )}>
        {clientPlans.map((pkg) => {
          const style = accentStyles[pkg.accent];
          const isHighlight = pkg.highlight;

          return (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                'flex-1 flex flex-col rounded-[2rem] border bg-background p-6 relative overflow-hidden',
                style.border,
                isHighlight && 'ring-2 ring-amber-500/20 shadow-[0_20px_60px_rgba(245,158,11,0.15)]'
              )}
            >
              <div className={cn('absolute inset-0 rounded-[2rem] bg-gradient-to-b pointer-events-none', style.topGradient)} />

              <div className="relative flex flex-col flex-1">
                <span className={cn('text-[12px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mb-3', style.badge)}>
                  {pkg.label}
                </span>

                <h3 className="text-base font-black uppercase tracking-widest text-foreground/90">{pkg.name}</h3>

                <div className="flex items-baseline gap-1 mt-2 mb-4">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter">{pkg.price}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">USD</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">{pkg.durationText}</span>
                </div>

                <div className="h-px bg-white/5 mb-5" />

                <div className="flex-1 space-y-3 mb-6">
                  {pkg.benefits.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Check className={cn('w-4 h-4 flex-shrink-0 mt-0.5', style.checkColor)} />
                      <span className="text-[13px] sm:text-sm font-medium text-foreground/90 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSubscribe(pkg)}
                  disabled={isPurchasing}
                  className={cn(
                    'w-full h-14 rounded-2xl font-black transition-opacity hover:opacity-90 shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-70',
                    NativeBridge.isIOS()
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] border border-white/10 dark:border-black/10 text-[15px] tracking-normal'
                      : cn(style.button, 'uppercase tracking-[0.2em] text-[13px] text-white', isHighlight && 'shadow-amber-500/20')
                  )}
                >
                  {isPurchasing ? 'Connecting...' : (
                    NativeBridge.isIOS() ? (
                      <span>Subscribe</span>
                    ) : (
                      isHighlight ? 'Upgrade to Swipess' : 'Activate Access'
                    )
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-2">
        <button
          type="button"
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

        {/* Apple Guideline 3.1.2 — auto-renewable subscription disclosure + legal
            links. Required in the binary for auto-renewing subscriptions, and a
            common re-rejection when missing. */}
        <div className="max-w-md text-center space-y-2 pt-1">
          <p className="text-[10px] leading-relaxed text-muted-foreground/60">
            Subscriptions are billed to your Apple ID and automatically renew unless
            canceled at least 24 hours before the end of the current period. Your
            account is charged for renewal within 24 hours before the period ends.
            Manage or cancel anytime in your App Store account settings.
          </p>
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => openLegal('terms')}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Terms of Use
            </button>
            <button
              type="button"
              onClick={() => openLegal('privacy')}
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </>
  );

  if (showAsPage) {
    return (
      <div className="fixed inset-0 z-[10050] w-full h-[100dvh] bg-background flex flex-col overflow-x-hidden overflow-y-auto pb-safe-bottom">
        {body}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 bg-background border-border overflow-hidden rounded-3xl">
        {body}
      </DialogContent>
    </Dialog>
  );
}