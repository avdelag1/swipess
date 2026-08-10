import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Gift, Inbox, Ticket } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from 'sonner';

export type CustomerPromo = {
  id: string;
  code: string;
  title: string;
  message: string | null;
  discount_percent: number;
  status: string;
  expires_at: string | null;
  created_at: string;
  business_id: string;
  partner_businesses?: { name: string | null } | null;
};

type Props = {
  className?: string;
};

export function PromoInbox({ className }: Props) {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [promos, setPromos] = useState<CustomerPromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('business_customer_promos')
      .select('id, code, title, message, discount_percent, status, expires_at, created_at, business_id, partner_businesses(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40);

    if (error) {
      console.warn('Promo inbox load:', error.message);
      setPromos([]);
    } else {
      setPromos((data as CustomerPromo[]) || []);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`promo-inbox-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_customer_promos',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, load]);

  const copyCode = async (promo: CustomerPromo) => {
    try {
      await navigator.clipboard.writeText(promo.code);
      triggerHaptic('medium');
      setCopiedId(promo.id);
      toast.success('Code copied', { description: `${promo.code} — show it at your next visit.` });
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Copy failed', { description: 'Long-press the code to copy manually.' });
    }
  };

  const markRedeemed = async (promo: CustomerPromo) => {
    if (promo.status !== 'active') return;
    triggerHaptic('light');
    const { error } = await supabase
      .from('business_customer_promos')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', promo.id)
      .eq('user_id', user?.id || '');

    if (error) {
      toast.error('Could not update', { description: error.message });
      return;
    }
    setPromos((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, status: 'redeemed' } : p)),
    );
    toast.success('Marked used', { description: 'Nice — enjoy the discount.' });
  };

  const active = promos.filter((p) => {
    if (p.status !== 'active') return false;
    if (p.expires_at && new Date(p.expires_at).getTime() < Date.now()) return false;
    return true;
  });
  const past = promos.filter((p) => !active.includes(p));

  return (
    <div className={cn('mt-8', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className={cn(
            'text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2',
            isLight ? 'text-black/40' : 'text-white/30',
          )}
        >
          <Inbox size={12} /> Promo inbox
        </h3>
        {active.length > 0 && (
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
            {active.length} ready
          </span>
        )}
      </div>

      {loading ? (
        <div
          className={cn(
            'py-10 rounded-[24px] border border-dashed text-center text-[10px] font-black uppercase tracking-widest',
            isLight ? 'bg-slate-50 border-slate-200 text-black/20' : 'bg-white/5 border-white/5 text-white/20',
          )}
        >
          Loading codes…
        </div>
      ) : promos.length === 0 ? (
        <div
          className={cn(
            'py-12 flex flex-col items-center justify-center rounded-[24px] border border-dashed',
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5',
          )}
        >
          <Gift size={28} className={cn('mb-3', isLight ? 'text-black/15' : 'text-white/15')} />
          <p className={cn('text-[10px] font-black uppercase tracking-widest', isLight ? 'text-black/25' : 'text-white/25')}>
            No partner codes yet
          </p>
          <p className={cn('text-[11px] mt-2 text-center max-w-[220px]', isLight ? 'text-black/40' : 'text-white/40')}>
            When a business sends you a promo after scanning your QR, it lands here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {[...active, ...past].map((promo, idx) => {
              const expired =
                promo.status === 'expired' ||
                (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now());
              const used = promo.status === 'redeemed';
              const dimmed = expired || used;

              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                  className={cn(
                    'p-4 rounded-[24px] border transition-all',
                    isLight ? 'bg-card border-border shadow-sm' : 'bg-white/5 border-white/10',
                    dimmed && 'opacity-55',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
                        dimmed
                          ? isLight
                            ? 'bg-slate-100 border-slate-200'
                            : 'bg-white/5 border-white/10'
                          : 'bg-rose-500/15 border-rose-500/25',
                      )}
                    >
                      <Ticket size={18} className={dimmed ? (isLight ? 'text-black/30' : 'text-white/30') : 'text-rose-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={cn('text-[13px] font-black uppercase truncate', isLight ? 'text-black' : 'text-white')}>
                            {promo.title}
                          </p>
                          <p className={cn('text-[9px] font-black uppercase tracking-widest mt-1', isLight ? 'text-black/35' : 'text-white/35')}>
                            {(promo.partner_businesses as any)?.name || 'Partner'} · {promo.discount_percent}% off
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shrink-0',
                            used
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : expired
                                ? isLight
                                  ? 'bg-slate-100 text-black/40'
                                  : 'bg-white/10 text-white/40'
                                : 'bg-rose-500/15 text-rose-400',
                          )}
                        >
                          {used ? 'Used' : expired ? 'Expired' : 'Active'}
                        </span>
                      </div>

                      {promo.message && (
                        <p className={cn('text-xs mt-2 leading-relaxed', isLight ? 'text-black/55' : 'text-white/55')}>
                          {promo.message}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void copyCode(promo)}
                          className={cn(
                            'flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl font-mono text-sm font-bold tracking-wider border',
                            isLight ? 'bg-black text-white border-black' : 'bg-white text-black border-white',
                          )}
                        >
                          <span>{promo.code}</span>
                          {copiedId === promo.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        {!dimmed && (
                          <button
                            type="button"
                            onClick={() => void markRedeemed(promo)}
                            className={cn(
                              'px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0',
                              isLight
                                ? 'border-border text-black/60 hover:bg-secondary'
                                : 'border-white/15 text-white/70 hover:bg-white/10',
                            )}
                          >
                            Mark used
                          </button>
                        )}
                      </div>

                      {promo.expires_at && !used && (
                        <p className={cn('text-[10px] mt-2', isLight ? 'text-black/35' : 'text-white/35')}>
                          {expired ? 'Expired' : 'Expires'} {new Date(promo.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
