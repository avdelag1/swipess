import { useOwnerInsights } from '@/hooks/useOwnerInsights';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Users, Heart, 
  MessageSquare, DollarSign, Activity, Eye 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function OwnerInsightsDashboard() {
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
    { label: 'Total Views', value: Math.round(data?.total_views || 0), icon: Eye, color: '#3b82f6', trend: '+12%' },
    { label: 'Engagement', value: data?.total_likes || 0, icon: Heart, color: '#f43f5e', trend: '+5%' },
    { label: 'Matches', value: data?.total_matches || 0, icon: Users, color: '#10b981', trend: '+18%' },
    { label: 'Revenue Est.', value: `$${data?.revenue_projection || 0}`, icon: DollarSign, color: '#f59e0b', trend: '+24%' },
  ];

  return (
    <div className="p-6 space-y-8 pb-40">
      {/* Header with Title */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">Market Insights</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/20">Performance Analysis</p>
        </div>
        <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary animate-pulse" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-b from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-5 rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl space-y-3">
              <div className="flex items-center justify-between">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-[10px] font-black text-emerald-500">{stat.trend}</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xl font-black text-white tracking-tighter">{stat.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/30">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Graph Placeholder (Beautifully represented) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white tracking-tight">Match Convergence</h3>
            <p className="text-[10px] font-bold text-white/20">Client demand vs. Listing supply</p>
          </div>
          <BarChart3 className="w-5 h-5 text-white/10" />
        </div>

        {/* Visual Graph Mockup */}
        <div className="h-32 flex items-end justify-between gap-2 px-2">
          {data?.recent_activity.map((day, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${(day.count / 25) * 100}%` }}
              transition={{ delay: i * 0.1, duration: 1, ease: 'easeOut' }}
              className="relative w-full group/bar"
            >
              <div className="absolute -inset-1 bg-primary/20 blur-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              <div className="w-full h-full rounded-t-lg bg-gradient-to-t from-primary/20 to-primary/80" />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity text-[10px] font-black text-white">
                {day.count}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Active Engagement Summary */}
      <div className={cn(
        "rounded-[2.5rem] border border-white/5 p-6 space-y-5",
        "bg-gradient-to-br from-indigo-500/5 to-purple-500/5"
      )}>
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-black uppercase tracking-widest text-white/60">Engagement Logic</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-white/40">Response Accuracy</span>
            <span className="text-[11px] font-black text-white">98.2%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '98.2%' }}
              className="h-full bg-purple-500" 
            />
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-medium text-white/40">Converged Matches</span>
            <span className="text-[11px] font-black text-white">{data?.conversion_rate}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data?.conversion_rate}%` }}
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}


