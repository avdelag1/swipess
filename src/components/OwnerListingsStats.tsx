import { Home, Eye, DollarSign, Activity, TrendingUp, Bike, Car } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OwnerListingsStatsProps {
  listings: any[];
  isLight?: boolean;
}

export function OwnerListingsStats({ listings, isLight = false }: OwnerListingsStatsProps) {
  // Calculate statistics
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active' && l.is_active).length;
  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalValue = listings.reduce((sum, l) => sum + (l.price || 0), 0);

  // Calculate average price
  const avgPrice = totalListings > 0 ? totalValue / totalListings : 0;

  // Count by category
  const propertiesCount = listings.filter(l => !l.category || l.category === 'property').length;
  const motorcyclesCount = listings.filter(l => l.category === 'motorcycle').length;
  const bicyclesCount = listings.filter(l => l.category === 'bicycle').length;
  const workersCount = listings.filter(l => l.category === 'worker' || l.category === 'services').length;
  const vehiclesCount = listings.filter(l => l.category === 'vehicle').length;

  const stats = [
    {
      title: 'Total Listings',
      value: totalListings,
      icon: Home,
      color: '#3b82f6',
      description: `${activeListings} active`,
      trend: activeListings > 0 ? '+' : ''
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: '#a855f7',
      description: 'All time',
      trend: totalViews > 100 ? '+' : ''
    },
    {
      title: 'Avg. Price',
      value: `$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: '#f43f5e',
      description: 'Per listing',
      trend: ''
    },
    {
      title: 'Categories',
      value: [propertiesCount, motorcyclesCount, bicyclesCount, workersCount, vehiclesCount].filter(c => c > 0).length,
      icon: Activity,
      color: '#f97316',
      description: 'Active types',
      trend: ''
    },
  ];

  // Category breakdown
  const categoryBreakdown = [
    { name: 'Properties', count: propertiesCount, icon: Home, color: '#f43f5e' },
    { name: 'Motorcycles', count: motorcyclesCount, icon: MotorcycleIcon, color: '#f97316' },
    { name: 'Bicycles', count: bicyclesCount, icon: Bike, color: '#a855f7' },
    { name: 'Services', count: workersCount, icon: Activity, color: '#3b82f6' },
    { name: 'Vehicles', count: vehiclesCount, icon: Car, color: '#eab308' },
  ].filter(c => c.count > 0);

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
          >
            <div className={cn(
              "relative rounded-[2.2rem] shadow-2xl transition-all duration-300 overflow-hidden",
              isLight
                ? "bg-black/[0.03]"
                : "bg-white/[0.04] backdrop-blur-3xl"
            )}>
              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] truncate italic", isLight ? 'text-slate-500' : 'text-white/40')}>
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-1 mt-2.5">
                      <h3 className={cn("text-3xl sm:text-4xl font-black tracking-tighter uppercase italic truncate", isLight ? "text-slate-950" : "text-white")}>
                        {stat.value}
                      </h3>
                      {stat.trend && (
                        <TrendingUp className="w-4 h-4 text-primary" strokeWidth={4} />
                      )}
                    </div>
                    <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] mt-2 italic", isLight ? 'text-slate-400' : 'text-white/30')}>
                      {stat.description}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 blur-2xl opacity-20 rounded-full" style={{ background: stat.color }} />
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center relative z-10",
                        isLight ? "bg-white shadow-sm" : "bg-black/40"
                    )}>
                        <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown - Only show if there are listings */}
      {totalListings > 0 && categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <div className={cn(
            "rounded-[2.5rem] shadow-2xl relative overflow-hidden",
            isLight ? "bg-black/[0.03]" : "bg-white/[0.04] backdrop-blur-3xl"
          )}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isLight ? 'text-black opacity-50' : 'text-white opacity-50')}>Asset Breakdown</h4>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest italic opacity-40", isLight ? 'text-black' : 'text-white')}>{totalListings} Units synchronized</span>
                </div>
              </div>

              {/* Progress bar showing category distribution */}
              <div className={cn("h-1 rounded-full overflow-hidden flex", isLight ? 'bg-black/5' : 'bg-white/5')}>
                {categoryBreakdown.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    className="h-full"
                    style={{ backgroundColor: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.count / totalListings) * 100}%` }}
                    transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                  />
                ))}
              </div>

              {/* Category labels */}
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]" style={{ backgroundColor: cat.color }} />
                    <div className="flex flex-col">
                        <span className={cn("text-[10px] font-black uppercase tracking-widest italic leading-none", isLight ? 'text-black' : 'text-white')}>
                        {cat.name}
                        </span>
                        <span className={cn("text-[8px] font-black uppercase tracking-[0.1em] opacity-30 mt-0.5", isLight ? 'text-black' : 'text-white')}>
                        {cat.count} synchronized
                        </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
