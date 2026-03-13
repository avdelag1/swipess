import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, TrendingUp, Newspaper, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

const exploreFeatures = [
  { path: '/explore/zones', label: 'Zones', icon: MapPin, gradient: 'from-teal-500 to-emerald-400', clientOnly: false },
  { path: '/explore/roommates', label: 'Roommates', icon: Users, gradient: 'from-violet-500 to-fuchsia-400', clientOnly: true },
  { path: '/explore/prices', label: 'Prices', icon: TrendingUp, gradient: 'from-amber-500 to-yellow-400', clientOnly: false },
  { path: '/explore/intel', label: 'Intel', icon: Newspaper, gradient: 'from-sky-500 to-blue-400', clientOnly: false },
  { path: '/explore/tours', label: 'Tours', icon: Video, gradient: 'from-rose-500 to-pink-400', clientOnly: false },
];

interface ExploreFeatureLinksProps {
  isClient?: boolean;
}

export function ExploreFeatureLinks({ isClient = true }: ExploreFeatureLinksProps) {
  const navigate = useNavigate();
  const items = isClient ? exploreFeatures : exploreFeatures.filter(f => !f.clientOnly);

  return (
    <div className="mb-8">
      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80 mb-3 px-1">
        Explore Tulum
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-edges">
        {items.map((feature) => (
          <motion.button
            key={feature.path}
            whileTap={{ scale: 0.95 }}
            onClick={() => { haptics.select(); navigate(feature.path); }}
            className={cn(
              "relative flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300",
              "bg-white/[0.03] border-[1.5px] border-white/5 hover:bg-white/5"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 bg-gradient-to-br text-white shadow-inner",
              feature.gradient
            )}>
              <feature.icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tight text-muted-foreground/60">
              {feature.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
