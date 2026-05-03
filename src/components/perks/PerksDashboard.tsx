import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, TrendingUp, Store, Zap, History, ChevronRight, Sparkles, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ResidentQRModal } from './ResidentQRModal';
import { BusinessList } from './BusinessList';
import { DiscountHistory } from './DiscountHistory';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

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
    <div className="flex flex-col min-h-full pt-0 bg-black relative">
      {/* 🛸 NEXUS ATMOSPHERE */}
      <div className="fixed top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Tab bar */}
      <div className="relative flex gap-1.5 px-5 pt-4 pb-2 shrink-0 z-10">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { triggerHaptic('light'); setTab(t.id); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300',
              tab === t.id
                ? 'bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.1)]'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5'
            )}
          >
            <t.icon size={14} className={tab === t.id ? 'text-rose-500' : ''} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative flex-1 px-5 pb-8 z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'home' && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -15 }} 
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Hero QR Card */}
              <motion.button
                onClick={() => { triggerHaptic('medium'); setQrOpen(true); }}
                className="w-full mt-4 rounded-[32px] bg-gradient-to-br from-rose-500 via-violet-600 to-rose-400 p-7 text-left shadow-[0_20px_40px_rgba(235,72,152,0.2)] relative overflow-hidden group"
                whileTap={{ scale: 0.97 }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">My Resident Card</p>
                    <p className="text-white text-xl font-black mt-1 leading-none uppercase tracking-tight">Show QR for Perks</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg">
                    <QrCode size={28} className="text-white" />
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-2 relative z-10">
                  <div className="px-3 py-1 rounded-full bg-black/20 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                    Resident ID: {user?.id?.slice(0, 8).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-white/50 uppercase tracking-widest ml-auto">
                    <Sparkles size={10} className="text-rose-300" /> Premium Resident
                  </div>
                </div>
              </motion.button>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-[24px] bg-white/5 border border-white/10 p-5 backdrop-blur-xl group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 text-rose-500 mb-2">
                    <Zap size={16} className="fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Saved</span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">${stats.totalSaved.toLocaleString()}</div>
                </div>
                <div className="rounded-[24px] bg-white/5 border border-white/10 p-5 backdrop-blur-xl group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2 text-violet-400 mb-2">
                    <Award size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Locations</span>
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">{stats.uniqueBiz} <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Places</span></div>
                </div>
              </div>

              {/* Recent Activity Mini Header */}
              <div className="mt-8 flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Partner Offers</h3>
                <button onClick={() => { triggerHaptic('light'); setTab('businesses'); }} className="text-[10px] font-black text-rose-400 flex items-center gap-1 hover:text-rose-300 transition-colors uppercase tracking-widest">
                  View All <ChevronRight size={12} />
                </button>
              </div>

              {/* Quick offers list */}
              <div className="mt-4 space-y-3">
                {offers.length === 0 ? (
                   <div className="py-12 flex flex-col items-center justify-center bg-white/5 rounded-[24px] border border-white/5 border-dashed">
                      <Store size={32} className="text-white/10 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Checking for local offers...</p>
                   </div>
                ) : (
                  offers.slice(0, 3).map((offer, idx) => (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => triggerHaptic('light')}
                      className="p-4 rounded-[24px] bg-white/5 border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-600/20 flex items-center justify-center shrink-0 overflow-hidden border border-white/5 shadow-inner">
                        {offer.business_partners?.logo_url ? (
                          <img src={offer.business_partners.logo_url} className="w-full h-full object-cover" />
                        ) : (
                          <Store size={20} className="text-white/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-black text-white leading-tight uppercase truncate">{offer.title}</h4>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-1.5">{offer.business_partners?.name}</p>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-widest group-hover:bg-rose-500 group-hover:text-white transition-all">
                        -{offer.discount_percentage}%
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {tab === 'businesses' && (
            <motion.div key="businesses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <BusinessList partners={partners} />
            </motion.div>
          )}

          {tab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <DiscountHistory redemptions={redemptions} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ResidentQRModal open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
