import { Card, CardContent } from '@/components/ui/card';
import { Home, Eye, DollarSign, Activity, TrendingUp, Bike, CircleDot, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OwnerListingsStatsProps {
  listings: any[];
}

export function OwnerListingsStats({ listings }: OwnerListingsStatsProps) {
  // Calculate statistics
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'active' && l.is_active).length;
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);
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
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/20 to-blue-600/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      description: `${activeListings} active`,
      trend: activeListings > 0 ? '+' : ''
    },
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/20 to-purple-600/10',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      description: 'All time',
      trend: totalViews > 100 ? '+' : ''
    },
    {
      title: 'Avg. Price',
      value: `$${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/20 to-emerald-600/10',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      description: 'Per listing',
      trend: ''
    },
    {
      title: 'Categories',
      value: [propertiesCount, motorcyclesCount, bicyclesCount, workersCount, vehiclesCount].filter(c => c > 0).length,
      icon: Activity,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-500/20 to-red-500/10',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      description: 'Active types',
      trend: ''
    },
  ];

  // Category breakdown for mini-chart
  const categoryBreakdown = [
    { name: 'Properties', count: propertiesCount, icon: Home, color: 'bg-emerald-500' },
    { name: 'Motorcycles', count: motorcyclesCount, icon: CircleDot, color: 'bg-orange-500' },
    { name: 'Bicycles', count: bicyclesCount, icon: Bike, color: 'bg-purple-500' },
    { name: 'Services', count: workersCount, icon: Activity, color: 'bg-blue-500' },
    { name: 'Vehicles', count: vehiclesCount, icon: Car, color: 'bg-yellow-500' },
  ].filter(c => c.count > 0);

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <Card className={cn(
              "relative border border-white/5 shadow-lg hover:shadow-xl transition-all duration-300",
              "bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm"
            )}>
              {/* Background gradient effect */}
              <div className={cn(
                "absolute inset-0 opacity-30 bg-gradient-to-br",
                stat.bgGradient
              )} />

              <CardContent className="relative p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                      {stat.title}
                    </p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
                        {stat.value}
                      </h3>
                      {stat.trend && (
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={cn(
                    "p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0",
                    stat.iconBg
                  )}>
                    <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Category Breakdown - Only show if there are listings */}
      {totalListings > 0 && categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs sm:text-sm font-medium text-gray-400">Category Breakdown</h4>
                <span className="text-[10px] sm:text-xs text-gray-500">{totalListings} total</span>
              </div>

              {/* Progress bar showing category distribution */}
              <div className="h-2 sm:h-2.5 rounded-full bg-gray-700/50 overflow-hidden flex">
                {categoryBreakdown.map((cat, i) => (
                  <motion.div
                    key={cat.name}
                    className={cn("h-full", cat.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(cat.count / totalListings) * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  />
                ))}
              </div>

              {/* Category labels */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full", cat.color)} />
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {cat.name} ({cat.count})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
