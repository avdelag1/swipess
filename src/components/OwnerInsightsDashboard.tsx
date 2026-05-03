import { useOwnerInsights } from '@/hooks/useOwnerInsights';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Heart, 
  MessageSquare, DollarSign, Activity, Eye 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';

export function OwnerInsightsDashboard() {
  const { isLight } = useAppTheme();
  const { data, isLoading } = useOwnerInsights();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Views', value: Math.round(data?.total_views || 0), icon: Eye, color: '#EB4898', trend: '+12%' },
    { label: 'Engagement', value: data?.total_likes || 0, icon: Heart, color: '#f43f5e', trend: '+5%' },
    { label: 'Matches', value: data?.total_matches || 0, icon: Users, color: '#6366f1', trend: '+18%' },
    { label: 'Revenue Est.', value: `$${data?.revenue_projection || 0}`, icon: DollarSign, color: '#ec4899', trend: '+24%' },
  ];

  return (
    <div className="p-6 space-y-8 pb-40 relative">
      {/* 🛸 NEXUS ATMOSPHERE */}
      <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[#EB4898]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header with Title */}
      <div className="flex items-center justify-between px-2 relative z-10">
        <div className="space-y-1">
          <h2 className={cn("text-3xl font-black tracking-tight italic uppercase", isLight ? "text-slate-900" : "text-white")}>Nexus Market Insights</h2>
          <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] opacity-40", isLight ? "text-slate-400" : "text-white")}>Real-time Performance Analysis</p>
        </div>
        <div
          className="w-12 h-12 rounded-[22px] flex items-center justify-center border backdrop-blur-xl"
          style={isLight
            ? { background: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.06)' }
            : { background: 'rgba(235,72,152,0.1)', borderColor: 'rgba(235,72,152,0.2)', boxShadow: 'inset 0 0 16px rgba(235,72,152,0.15)' }
          }
        >
          <Zap className="w-5 h-5 text-[#EB4898] animate-pulse fill-current" />
        </div>
      </div>

      {/* Stats Grid — 🚀 NEXUS POLISH */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group relative"
          >
            <div className={cn(
              "relative p-5 rounded-[2.5rem] border backdrop-blur-2xl space-y-4 overflow-hidden",
              isLight ? "bg-white/80 border-black/5 shadow-xl" : "bg-white/[0.03] border-white/[0.08]"
            )}
            style={!isLight ? { boxShadow: `inset 0 0 32px ${stat.color}15` } : undefined}
            >
              <div className="flex items-center justify-between">
                <div 
                  className="w-10 h-10 rounded-[18px] flex items-center justify-center shadow-lg border"
                  style={{ background: `${stat.color}20`, borderColor: `${stat.color}30` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[9px] font-black text-emerald-400">{stat.trend}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={cn("text-2xl font-black tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>{stat.value}</div>
                <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-40", isLight ? "text-slate-400" : "text-white")}>{stat.label}</div>
              </div>

              {/* THE "BOTTLE" — Progress indicator */}
              <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${70 + Math.random() * 25}%` }}
                  transition={{ delay: 0.5 + (i * 0.1), duration: 1.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, ${stat.color}88, ${stat.color})` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Graph Placeholder — High Fidelity */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          "relative group p-6 rounded-[3rem] border backdrop-blur-3xl overflow-hidden z-10",
          isLight ? "bg-white/80 border-black/5 shadow-xl" : "bg-white/[0.02] border-indigo-500/20"
        )}
        style={!isLight ? { boxShadow: 'inset 0 0 40px rgba(99,102,241,0.1)' } : undefined}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className={cn("text-base font-black tracking-tight uppercase italic", isLight ? "text-slate-900" : "text-white")}>Convergence Flow</h3>
            <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", isLight ? "text-slate-400" : "text-white")}>Market Velocity Tracker</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10">
            <BarChart3 className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-white/40")} />
          </div>
        </div>

        {/* Visual Graph Mockup */}
        <div className="h-40 flex items-end justify-between gap-3 px-2 mb-2">
          {data?.recent_activity.map((day, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(15, (day.count / 25) * 100)}%` }}
              transition={{ delay: i * 0.1 + 0.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full group/bar"
            >
              <div className="absolute -inset-1 bg-primary/20 blur-lg opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              <div className="w-full h-full rounded-2xl bg-gradient-to-t from-primary/10 via-primary/40 to-primary/80 border-t border-white/20" />
              <div className={cn(
                "absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 text-[10px] font-black py-1 px-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20",
                isLight ? "text-slate-900" : "text-white"
              )}>
                {day.count}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between px-2 text-[8px] font-black uppercase tracking-[0.2em] opacity-30">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </motion.div>

      {/* Engagement Matrix */}
      <div className={cn(
        "rounded-[3rem] border p-7 space-y-6 relative z-10 overflow-hidden",
        isLight ? "bg-white/80 border-black/5 shadow-xl" : "bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 border-white/[0.08]"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-0.5">
              <span className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-500" : "text-white/40")}>Interaction Logic</span>
              <p className="text-sm font-black text-white uppercase italic">Nexus AI Verified</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-[#EB4898] uppercase tracking-widest">Active Scan</p>
            <div className="flex gap-0.5 justify-end mt-1">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-1 h-1 rounded-full bg-[#EB4898]" 
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-400" : "text-white/50")}>Response Precision</span>
              <span className={cn("text-xs font-black", isLight ? "text-slate-900" : "text-white")}>98.2%</span>
            </div>
            <div className={cn("h-2 w-full rounded-full overflow-hidden", isLight ? "bg-black/5" : "bg-white/5")}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '98.2%' }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-400" : "text-white/50")}>Matched Affinity</span>
              <span className={cn("text-xs font-black", isLight ? "text-slate-900" : "text-white")}>{data?.conversion_rate}%</span>
            </div>
            <div className={cn("h-2 w-full rounded-full overflow-hidden", isLight ? "bg-black/5" : "bg-white/5")}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data?.conversion_rate}%` }}
                transition={{ duration: 1.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-gradient-to-r from-[#EB4898] to-purple-500 shadow-[0_0_15px_rgba(235,72,152,0.4)]" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


