import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, TrendingUp, Store, Zap, History, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ResidentQRModal } from './ResidentQRModal';
import { BusinessList } from './BusinessList';
import { DiscountHistory } from './DiscountHistory';
import { cn } from '@/lib/utils';

type Tab = 'home' | 'businesses' | 'history';

export function PerksDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [qrOpen, setQrOpen] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const [redRes, partRes, offRes] = await Promise.all([
        supabase.from('discount_redemptions').select('*, business_partners(name, logo_url, category)').eq('user_id', user.id).order('redeemed_at', { ascending: false }),
        supabase.from('business_partners').select('*').eq('is_active', true),
        supabase.from('discount_offers').select('*, business_partners(name, logo_url)').eq('is_active', true),
      ]);
      setRedemptions(redRes.data || []);
      setPartners(partRes.data || []);
      setOffers(offRes.data || []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  // Realtime redemptions
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('perks-redemptions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'discount_redemptions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setRedemptions(prev => [payload.new as any, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const stats = useMemo(() => {
    const totalSaved = redemptions.reduce((sum, r) => sum + (Number(r.amount_saved) || 0), 0);
    const uniqueBiz = new Set(redemptions.map(r => r.business_id)).size;
    return { totalSaved, totalRedemptions: redemptions.length, uniqueBiz };
  }, [redemptions]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Perks', icon: Zap },
    { id: 'businesses', label: 'Partners', icon: Store },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden pt-[130px]">
      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-6">
        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              {/* Hero QR Card */}
              <motion.button
                onClick={() => setQrOpen(true)}
                className="w-full mt-2 rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 p-5 text-left shadow-xl shadow-primary/20 relative overflow-hidden"
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-foreground/70 text-xs font-medium">My Resident Card</p>
                    <p className="text-primary-foreground text-lg font-bold mt-0.5">Show QR to Get Discounts</p>
                    <p className="text-primary-foreground/60 text-xs mt-1">Tap to open your QR code</p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <QrCode size={28} className="text-primary-foreground" />
                  </div>
                </div>
              </motion.button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[
                  { label: 'Total Saved', value: `$${stats.totalSaved.toFixed(0)}`, icon: TrendingUp },
                  { label: 'Discounts', value: `${stats.totalRedemptions}`, icon: Zap },
                  { label: 'Partners', value: `${stats.uniqueBiz}`, icon: Store },
                ].map(s => (
                  <div key={s.label} className="rounded-xl bg-card border border-border/50 p-3 text-center">
                    <s.icon size={16} className="mx-auto text-primary mb-1" />
                    <p className="text-base font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Active Offers */}
              {offers.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Active Offers</h3>
                    <button onClick={() => setTab('businesses')} className="text-xs text-primary flex items-center gap-0.5">
                      See all <ChevronRight size={12} />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                    {offers.slice(0, 6).map(offer => (
                      <motion.div
                        key={offer.id}
                        className="shrink-0 w-36 rounded-xl bg-card border border-border/50 p-3 shadow-sm"
                        whileTap={{ scale: 0.96 }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                          <Store size={14} className="text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate">{offer.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{(offer.business_partners as any)?.name}</p>
                        <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                          {offer.discount_percent}% OFF
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Redemptions */}
              {redemptions.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                    <button onClick={() => setTab('history')} className="text-xs text-primary flex items-center gap-0.5">
                      View all <ChevronRight size={12} />
                    </button>
                  </div>
                  {redemptions.slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Zap size={16} className="text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{(r.business_partners as any)?.name || 'Partner'}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.redeemed_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-500">{r.discount_percent}% off</p>
                        {r.amount_saved && <p className="text-[10px] text-muted-foreground">${Number(r.amount_saved).toFixed(0)} saved</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && redemptions.length === 0 && offers.length === 0 && (
                <div className="mt-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <QrCode size={28} className="text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No perks yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Show your QR code at partner businesses to start saving!</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'businesses' && (
            <motion.div key="businesses" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <BusinessList partners={partners} onShowQR={() => setQrOpen(true)} />
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
              <DiscountHistory redemptions={redemptions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ResidentQRModal isOpen={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}

