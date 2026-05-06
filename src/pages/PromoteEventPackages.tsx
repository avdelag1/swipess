import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { NativeBridge } from '@/utils/nativeBridge';
import { cn } from '@/lib/utils';

const promoTiers = [
  {
    id: 'week',
    appleProductId: 'Swipess.promo.event.week.v1',
    paypalUrl: 'https://www.paypal.com/ncp/payment/L94P4NFVX7T2E',
    name: 'Spark',
    duration: '1 Week',
    price: '$19.99',
    icon: Zap,
    benefits: ['7 days featured placement', 'Push to nearby users', 'Eventos feed boost'],
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'month',
    appleProductId: 'Swipess.promo.event.month.v1',
    paypalUrl: 'https://www.paypal.com/ncp/payment/XB42DA8JMY5L4',
    name: 'Pulse',
    duration: '1 Month',
    price: '$59.99',
    icon: Sparkles,
    benefits: ['30 days featured cards', 'Push notifications to matches', 'AI Concierge mentions'],
    accent: 'from-pink-500 to-orange-500',
    highlight: true,
  },
  {
    id: 'quarter',
    appleProductId: 'Swipess.promo.event.quarter.v1',
    paypalUrl: 'https://www.paypal.com/ncp/payment/RPCFCMXDL3M2C',
    name: 'Wave',
    duration: '3 Months',
    price: '$149.99',
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
    if (!approved) {
      toast.error('Your request must be approved first.');
      return;
    }
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
    setPurchasing(null);
    toast.message('Redirecting to PayPal', { description: `${tier.name} (${tier.duration})` });
    window.open(tier.paypalUrl, '_blank', 'noopener,noreferrer');
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

        {approved === false && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 text-sm text-foreground">
            You don't have an approved event yet. <button onClick={() => navigate('/promote-event/request')} className="underline font-bold">Submit one for review</button>.
          </div>
        )}

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
                <div className="text-3xl font-black text-foreground mb-4">{tier.price}</div>
                <ul className="space-y-2 text-sm text-foreground/80 mb-6 flex-1">
                  {tier.benefits.map((b) => (
                    <li key={b}>• {b}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleBuy(tier)}
                  disabled={purchasing === tier.id || approved === false}
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest"
                >
                  {purchasing === tier.id ? 'Processing…' : `Get Offer · ${tier.price}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}