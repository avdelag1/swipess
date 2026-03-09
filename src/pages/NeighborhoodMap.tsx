import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, TrendingUp, Home, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NeighborhoodItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  avg_rent_price: number;
  avg_sale_price: number;
  listing_count: number;
  density_score: number;
  vibe_tags: string[];
  color_hex: string;
}

export default function NeighborhoodMap() {
  const [zones, setZones] = useState<NeighborhoodItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<NeighborhoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    const { data } = await supabase.from('neighborhood_data').select('*').order('density_score', { ascending: false });
    setZones((data as any[])?.map(z => ({ ...z, vibe_tags: Array.isArray(z.vibe_tags) ? z.vibe_tags : [] })) || []);
    setIsLoading(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price}`;
  };

  const getDensityLabel = (score: number) => {
    if (score >= 8) return 'Very High';
    if (score >= 6) return 'High';
    if (score >= 4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Tulum Zones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Explore neighborhoods, compare prices, find your vibe</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone, index) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
              className={cn(
                'relative rounded-2xl border p-4 cursor-pointer transition-all overflow-hidden group',
                selectedZone?.id === zone.id
                  ? 'border-primary/50 bg-primary/5 col-span-2'
                  : 'border-border/30 bg-card hover:border-primary/30'
              )}
            >
              {/* Density indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: zone.color_hex, opacity: 0.7 }} />

              <div className="flex items-start justify-between mb-2 mt-1">
                <h3 className="font-bold text-sm text-foreground leading-tight">{zone.name}</h3>
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  zone.density_score >= 7 ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
                )}>
                  {getDensityLabel(zone.density_score)}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Home className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{zone.listing_count} listings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">{formatPrice(zone.avg_rent_price)} MXN/mo</span>
                </div>
              </div>

              {/* Expanded details */}
              {selectedZone?.id === zone.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 pt-3 border-t border-border/30 space-y-3"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">{zone.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {zone.vibe_tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-foreground/70">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-accent/30">
                      <p className="text-[10px] text-muted-foreground">Avg Rent</p>
                      <p className="text-sm font-bold text-foreground">{formatPrice(zone.avg_rent_price)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-accent/30">
                      <p className="text-[10px] text-muted-foreground">Avg Sale</p>
                      <p className="text-sm font-bold text-foreground">{formatPrice(zone.avg_sale_price)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/client/dashboard'); }}
                    className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
                  >
                    Browse listings in {zone.name} <ArrowRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
