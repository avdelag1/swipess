import { useClientInsights } from '@/hooks/useClientInsights';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Heart, 
  MessageSquare, Zap, Activity, Eye, Trophy, Star, Sparkles
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

export function ClientInsightsDashboard() {
  const { isLight } = useAppTheme();
  const { data, isLoading } = useClientInsights();

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-36 rounded-[2.5rem] bg-white/[0.03]" />
          <Skeleton className="h-36 rounded-[2.5rem] bg-white/[0.03]" />
          <Skeleton className="h-36 rounded-[2.5rem] bg-white/[0.03]" />
          <Skeleton className="h-36 rounded-[2.5rem] bg-white/[0.03]" />
        </div>
        <Skeleton className="h-56 rounded-[3rem] bg-white/[0.03]" />
      </div>
    );
  }

  const stats = [
    { label: 'Discovery Range', value: data?.profiles_viewed || 0, icon: Eye, color: '#FF4D00', trend: '+24%' },
    { label: 'Signal Output', value: data?.total_likes || 0, icon: Heart, color: '#EB4898', trend: '+12%' },
    { label: 'Active Syncs', value: data?.total_matches || 0, icon: Users, color: '#FF4D00', trend: '+8%' },
    { label: 'Nexus Credits', value: data?.tokens_earned || 0, icon: Trophy, color: '#EB4898', trend: '+45%' },
  ];

  return (
    <div className="p-6 space-y-10 pb-48 relative overflow-hidden">
      {/* 🛸 NEXUS ATMOSPHERE */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-15%] w-[80%] h-[80%] bg-[#EB4898]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[80%] h-[80%] bg-[#FF4D00]/5 rounded-full blur-[140px]" />
      </div>

      {/* Header with Title */}
      <div className="flex items-end justify-between px-3 relative z-10">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter italic uppercase text-white leading-none">Intelligence</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-[#EB4898] italic">Discovery Protocol Active</p>
        </div>
        <div className="w-14 h-14 rounded-[24px] flex items-center justify-center bg-[#EB4898]/10 border border-[#EB4898]/20 backdrop-blur-3xl shadow-[0_0_30px_rgba(235,72,152,0.15)]">
          <Zap className="w-6 h-6 text-[#EB4898] animate-pulse fill-current" />
        </div>
      </div>

      {/* Stats Grid — 🚀 NEXUS POLISH */}
      <div className="grid grid-cols-2 gap-5 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="group relative"
          >
            <div className="relative p-6 rounded-[32px] border bg-[#0F0F0F]/60 border-white/5 backdrop-blur-3xl space-y-5 overflow-hidden transition-all hover:bg-white/[0.05] hover:border-white/10"
              style={{ boxShadow: `inset 0 0 32px ${stat.color}08` }}
            >
              <div className="flex items-center justify-between">
                <div 
                  className="w-12 h-12 rounded-[20px] flex items-center justify-center shadow-2xl border"
                  style={{ background: `${stat.color}15`, borderColor: `${stat.color}25` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400 tabular-nums">{stat.trend}</span>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="text-3xl font-black tracking-tighter leading-none text-white italic tabular-nums">{stat.value}</div>
                <div className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 italic">{stat.label}</div>
              </div>

              {/* PROGRESS INDICATOR */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${65 + Math.random() * 30}%` }}
                  transition={{ delay: 0.7 + (i * 0.1), duration: 2, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${stat.color}44, ${stat.color})`, boxShadow: `0 0 10px ${stat.color}44` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Graph Placeholder — High Fidelity */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative group p-8 rounded-[40px] border bg-[#0F0F0F]/60 border-white/5 backdrop-blur-3xl overflow-hidden z-10"
        style={{ boxShadow: 'inset 0 0 50px rgba(235,72,152,0.05)' }}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <h3 className="text-xl font-black tracking-tighter uppercase italic text-white">Market Velocity</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] italic">Real-time Interaction Flux</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 shadow-2xl">
            <Activity className="w-6 h-6 text-white/60" />
          </div>
        </div>

        {/* Visual Graph Mockup */}
        <div className="h-48 flex items-end justify-between gap-4 px-1 mb-4">
          {data?.recent_activity.map((day, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(20, (day.count / 60) * 100)}%` }}
              transition={{ delay: i * 0.1 + 0.8, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full group/bar"
            >
              <div className="absolute -inset-2 bg-[#EB4898]/20 blur-xl opacity-0 group-hover/bar:opacity-100 transition-opacity duration-500" />
              <div className="w-full h-full rounded-2xl bg-gradient-to-t from-[#EB4898]/10 via-[#EB4898]/50 to-[#EB4898] border-t border-white/20 shadow-[0_-5px_15px_rgba(235,72,152,0.3)]" />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 text-[10px] font-black py-1.5 px-3 rounded-xl bg-black/80 backdrop-blur-xl border border-white/20 text-white shadow-2xl whitespace-nowrap">
                {day.count} Syncs
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between px-2 text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </motion.div>

      {/* Gamification Matrix */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        className="rounded-[40px] border p-8 space-y-8 relative z-10 overflow-hidden bg-gradient-to-br from-[#FF4D00]/5 via-transparent to-[#EB4898]/5 border-white/5 backdrop-blur-3xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center shadow-2xl">
              <Star className="w-7 h-7 text-[#FF4D00] fill-[#FF4D00]/20" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF4D00] italic">Elite Status</span>
              <p className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Apex Authority</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-[#EB4898] uppercase tracking-[0.4em] italic animate-pulse">Nexus Confirmed</p>
            <div className="flex gap-1 justify-end mt-2">
              {[1, 2, 3, 4].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                  className="w-1.5 h-1.5 rounded-full bg-[#EB4898] shadow-[0_0_8px_rgba(235,72,152,0.8)]" 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Sync Frequency</span>
              <div className="flex items-center gap-2">
                 <Sparkles className="w-3 h-3 text-[#FF4D00]" />
                 <span className="text-xs font-black text-white tabular-nums tracking-widest">84.5%</span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.03] p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '84.5%' }}
                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-[#FF4D00] to-[#EB4898] shadow-[0_0_20px_rgba(255,77,0,0.5)]" 
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Match Affinity</span>
              <div className="flex items-center gap-2">
                 <Heart className="w-3 h-3 text-[#EB4898]" />
                 <span className="text-xs font-black text-white tabular-nums tracking-widest">{data?.match_rate}%</span>
              </div>
            </div>
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.03] p-[2px]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data?.match_rate}%` }}
                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="h-full rounded-full bg-gradient-to-r from-[#EB4898] to-[#FF4D00] shadow-[0_0_20px_rgba(235,72,152,0.5)]" 
              />
            </div>
          </div>
        </div>
      </motion.div>

      <p className="text-center text-[10px] font-black uppercase tracking-[0.6em] text-white/10 italic pt-10">Nexus Intelligence Engine v4.0</p>
    </div>
  );
}
