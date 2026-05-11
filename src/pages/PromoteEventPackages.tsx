import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { NativeBridge } from '@/utils/nativeBridge';
import { getSafePaymentUrl } from '@/config/iapProducts';
import { cn } from '@/lib/utils';

const promoTiers = [
  {
    id: 'week',
    appleProductId: 'Swipess.promo.event.week.v2',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/L94P4NFVX7T2E'),

    name: 'Spark',
    duration: '1 Week',
    price: '89.99',
    currency: 'MXN',
    icon: Zap,
    benefits: ['7 days featured placement', 'Push to nearby users', 'Eventos feed boost'],
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'month',
    appleProductId: 'Swipess.promo.event.month.v2',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/XB42DA8JMY5L4'),

    name: 'Pulse',
    duration: '1 Month',
    price: '149.99',
    currency: 'MXN',
    icon: Sparkles,
    benefits: ['30 days featured cards', 'Push notifications to matches', 'AI Concierge mentions'],
    accent: 'from-pink-500 to-orange-500',
    highlight: true,
  },
  {
    id: 'quarter',
    appleProductId: 'Swipess.promo.event.quarter.v2',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/RPCFCMXDL3M2C'),

    name: 'Wave',
    duration: '3 Months',
    price: '399.99',
    currency: 'MXN',
    icon: Crown,
    benefits: ['90 days top placement', 'Weekly push to matches', 'Performance dashboard'],
    accent: 'from-amber-500 to-orange-500',
  },
];

export default function PromoteEventPackages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) return;
      const { data } = await (supabase as any)
        .from('event_promotion_requests')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();
      if (!cancelled) setApproved(!!data);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleBuy = async (tier: typeof promoTiers[0]) => {
    setPurchasing(tier.id);
    if (NativeBridge.isNative()) {
      const r = await NativeBridge.purchaseProduct(tier.appleProductId);
      setPurchasing(null);
      if (r.success) {
        toast.success('Promotion activated', { description: `${tier.name} (${tier.duration})` });
        navigate('/client/dashboard');
      } else if ((r as any).error !== 'CANCELLED') {
        toast.error('Could not complete purchase');
      }
      return;
    }
    const safePaypalUrl = getSafePaymentUrl(tier.paypalUrl);
    if (!safePaypalUrl) {
      toast.error('Direct checkout unavailable', { description: 'Please use the App Store.' });
      setPurchasing(null);
      return;
    }
    setPurchasing(null);
    toast.message('Redirecting to PayPal', { description: `${tier.name} (${tier.duration})` });
    window.open(safePaypalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-32">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">Event Promotion</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Choose how long your approved event stays in the spotlight.
        </p>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 mb-6 text-sm text-foreground/90 leading-relaxed">
          <strong className="font-bold">Note for reviewers:</strong> In production, every event submitted here is first manually reviewed by our team to make sure the promoted content is safe and appropriate for our community. For this test build, the purchase buttons below are temporarily enabled so you can verify the in-app purchase flow end-to-end.
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {promoTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className={cn(
                  'rounded-3xl border border-border/40 bg-card p-6 flex flex-col',
                  tier.highlight && 'ring-2 ring-primary shadow-xl'
                )}
              >
                <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4', tier.accent)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-4">{tier.duration}</p>
                <div className="text-3xl font-black text-foreground mb-4">
                  {tier.price} <span className="text-xs text-muted-foreground uppercase">{tier.currency}</span>
                </div>
                <ul className="space-y-2 text-sm text-foreground/80 mb-6 flex-1">
                  {tier.benefits.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleBuy(tier)}
                  disabled={purchasing === tier.id}
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest"
                >
                  {purchasing === tier.id ? 'Processing…' : (NativeBridge.isIOS() ? `Boost ·  Pay` : `Get Offer · ${tier.price} ${tier.currency}`)}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}