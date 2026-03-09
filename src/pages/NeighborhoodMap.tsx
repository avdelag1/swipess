import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, TrendingUp, Home, ArrowRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleBrowseListings = (e: React.MouseEvent, zone: NeighborhoodItem) => {
    e.stopPropagation();
    navigate('/client/dashboard', { state: { filterNeighborhood: zone.slug, filterNeighborhoodName: zone.name } });
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
          {zones.map((zone, index) => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedZone(isSelected ? null : zone)}
                className={cn(
                  'relative rounded-2xl border p-4 cursor-pointer transition-all overflow-hidden group',
                  isSelected
                    ? 'border-primary/50 bg-primary/5 col-span-2'
                    : 'border-border/30 bg-card hover:border-primary/30'
                )}
                style={{
                  boxShadow: isSelected ? `0 8px 32px ${zone.color_hex}20` : undefined,
                }}
              >
                {/* Gradient glow background */}
                <div
                  className="absolute inset-0 opacity-[0.06] rounded-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at top left, ${zone.color_hex}, transparent 70%)`,
                  }}
                />

                {/* Density indicator bar */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl overflow-hidden bg-muted/30">
                  <div
                    className="h-full rounded-t-2xl transition-all duration-500"
                    style={{
                      width: `${(zone.density_score / 10) * 100}%`,
                      background: `linear-gradient(90deg, ${zone.color_hex}90, ${zone.color_hex})`,
                    }}
                  />
                </div>

                <div className="relative z-10">
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

                  {/* Density bar mini visualization */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Density</span>
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(zone.density_score / 10) * 100}%` }}
                        transition={{ delay: index * 0.05 + 0.3, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: zone.color_hex }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-foreground">{zone.density_score}/10</span>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/30 space-y-3 overflow-hidden"
                      >
                        <p className="text-xs text-muted-foreground leading-relaxed">{zone.description}</p>

                        <div className="flex flex-wrap gap-1.5">
                          {zone.vibe_tags.map((tag: string) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/50 text-foreground/70">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {/* Price comparison bars */}
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-accent/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Avg Rent</span>
                              </div>
                              <span className="text-sm font-bold text-foreground">{formatPrice(zone.avg_rent_price)}</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((zone.avg_rent_price / 50000) * 100, 100)}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-accent/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <DollarSign className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Avg Sale</span>
                              </div>
                              <span className="text-sm font-bold text-foreground">{formatPrice(zone.avg_sale_price)}</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((zone.avg_sale_price / 10000000) * 100, 100)}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="h-full rounded-full"
                                style={{ background: zone.color_hex }}
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleBrowseListings(e, zone)}
                          className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Browse listings in {zone.name} <ArrowRight className="w-3 h-3" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
