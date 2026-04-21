import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, BarChart3, ChevronLeft, Calendar, Info, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '@/utils/haptics';
import { logger } from '@/utils/prodLogger';

interface PricePoint {
  neighborhood: string;
  month: number;
  year: number;
  avg_price: number;
  listing_count: number;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ZONE_COLORS: Record<string, string> = {
  'Aldea Zamá': '#f59e0b',
  'La Veleta': '#10b981',
  'Region 15': '#3b82f6',
  'Tulum Beach Zone': '#ef4444',
};

export default function PriceTracker() {
  const navigate = useNavigate();
  const [data, setData] = useState<PricePoint[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data: prices } = await supabase.from('price_history').select('*').order('year').order('month');
        setData((prices as any[]) || []);
      } catch (e) {
        logger.error('Failed to fetch prices', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const neighborhoods = useMemo(() => [...new Set(data.map(d => d.neighborhood))], [data]);

  const chartData = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const monthData: any = { name: label };
      const filtered = selectedZone === 'all' ? neighborhoods : [selectedZone];
      filtered.forEach(zone => {
        const point = data.find(d => d.month === i + 1 && d.neighborhood === zone);
        if (point) monthData[zone] = point.avg_price;
      });
      return monthData;
    });
  }, [data, selectedZone, neighborhoods]);

  const getStats = (zone: string) => {
    const zoneData = data.filter(d => d.neighborhood === zone).sort((a, b) => a.month - b.month);
    if (zoneData.length < 2) return { current: 0, change: 0, count: 0 };
    const current = zoneData[zoneData.length - 1]?.avg_price || 0;
    const prev = zoneData[zoneData.length - 2]?.avg_price || current;
    const count = zoneData[zoneData.length - 1]?.listing_count || 0;
    const change = prev ? ((current - prev) / prev) * 100 : 0;
    return { current, change, count };
  };

  const formatPrice = (val: number) => `$${(val / 1000).toFixed(0)}K`;

  const activeZones = selectedZone === 'all' ? neighborhoods : [selectedZone];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black p-4 pb-28 max-w-2xl mx-auto selection:bg-primary/30">
      {/* ── HEADER ── */}
      <div className="mb-8 pt-[var(--safe-top)]">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-white" />
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tight leading-none uppercase">
              Market Intelligence
            </h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mt-1">
              Real-time pricing trends
            </p>
          </div>
        </div>

        {/* Insight Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-primary/10 border border-primary/20 p-5 mb-8">
           <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Market Outlook</h3>
                <p className="text-xs text-slate-600 dark:text-white/60 font-medium leading-relaxed">
                  Prices in <span className="text-primary font-bold">La Veleta</span> have increased by 4.2% this month due to peak seasonal demand.
                </p>
              </div>
           </div>
           <div className="absolute -right-4 -bottom-4 opacity-10">
              <BarChart3 className="w-24 h-24 text-primary" strokeWidth={1.5} />
           </div>
        </div>

        {/* Zone selection */}
        <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('light'); setSelectedZone('all'); }}
            className={cn(
              'px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border',
              selectedZone === 'all' 
                ? 'bg-primary text-white border-primary shadow-[0_8px_20px_rgba(249,115,22,0.3)]' 
                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-zinc-800'
            )}
          >All Zones</motion.button>
          {neighborhoods.map(zone => (
            <motion.button
              key={zone}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); setSelectedZone(zone); }}
              className={cn(
                'px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 transition-all border',
                selectedZone === zone 
                  ? 'bg-primary text-white border-primary shadow-[0_8px_20px_rgba(249,115,22,0.3)]' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-zinc-800'
              )}
            >{zone}</motion.button>
          ))}
        </div>
      </div>

      {/* ── CHART SECTION ── */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={selectedZone}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white dark:bg-zinc-900/50 rounded-[2.5rem] border border-slate-200 dark:border-white/10 p-6 shadow-2xl shadow-black/5 dark:shadow-none mb-8 backdrop-blur-xl relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing History (2024)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Avg. Price (MXN)</span>
            </div>
          </div>

          <div className="h-[250px] w-full">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Computing Data...</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    {activeZones.map(zone => (
                      <linearGradient key={zone} id={`grad-${zone.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ZONE_COLORS[zone] || '#ec4899'} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={ZONE_COLORS[zone] || '#ec4899'} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-white/5" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor' }} 
                    className="text-slate-400 dark:text-white/20"
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'currentColor' }} 
                    className="text-slate-400 dark:text-white/20"
                    tickFormatter={formatPrice}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(0,0,0,0.8)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px', 
                      fontSize: '10px',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: 'white' }}
                    cursor={{ stroke: '#ec4899', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value: number) => [`$${value.toLocaleString()} MXN`, '']}
                  />
                  {activeZones.map(zone => (
                    <Area
                      key={zone}
                      type="monotone"
                      dataKey={zone}
                      stroke={ZONE_COLORS[zone] || '#ec4899'}
                      strokeWidth={3}
                      fill={`url(#grad-${zone.replace(/\s/g, '')})`}
                      animationDuration={1500}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── NEIGHBORHOOD CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {neighborhoods.map((zone, idx) => {
          const { current, change, count } = getStats(zone);
          const isUp = change > 0;
          return (
            <motion.div
              key={zone}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { triggerHaptic('light'); setSelectedZone(zone); }}
              className={cn(
                'group relative p-6 rounded-[2rem] border transition-all duration-300 overflow-hidden',
                selectedZone === zone 
                  ? 'bg-white dark:bg-zinc-900 border-primary shadow-xl shadow-primary/10' 
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'
              )}
            >
              {/* Background Glow */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[zone] || '#ec4899' }} />
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">{zone}</h4>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-white/40">{count} Active</span>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg. Monthly</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">${current.toLocaleString()}</p>
                  </div>
                  
                  <div className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-2xl text-[10px] font-bold shadow-sm',
                    isUp 
                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20' 
                      : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                  )}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 p-6 rounded-[2rem] bg-slate-100 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 flex items-start gap-4">
         <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Data Integrity</h4>
            <p className="text-[11px] text-slate-500 dark:text-white/40 font-medium leading-relaxed">
              These prices represent verified listings across our network. Seasonal factors in Tulum can cause deviations of up to 15%.
            </p>
         </div>
      </div>
    </div>
  );
}


