import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChevronLeft, Search, Users, Home, Package, ArrowLeft, Trophy, Heart, Coins, Wrench, Building2, Bike
} from 'lucide-react';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useSaveClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // STORE STATE
  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetFilters = useFilterStore((state) => state.resetClientFilters);

  const savePrefs = useSaveClientFilterPreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // LOCAL UI STATE
  const [radarCategory, setRadarCategory] = useState<QuickFilterCategory>(() => {
    if (storeCategories.length > 0) return storeCategories[0];
    return 'property';
  });

  const activeFilterCount = useMemo(() => 
    Object.keys(filters).filter(key => {
      const value = filters[key as keyof typeof filters];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    }).length,
    [filters]
  );

  const handleApplyFilters = useCallback((newFilters: any) => {
    triggerHaptic('light');
    setFilters(newFilters);
  }, []);

  const handleFinalApply = useCallback(() => {
    triggerHaptic('success');
    setCategories([radarCategory]);
    
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });

    savePrefs.mutate({
      preferred_categories: [radarCategory],
      preferred_listing_types: filters.interest_type === 'both' ? ['rent', 'sale'] : [filters.interest_type || 'both'],
    });

    navigate('/client/dashboard');
  }, [radarCategory, filters, setCategories, queryClient, navigate, savePrefs]);

  const handleReset = useCallback(() => {
    triggerHaptic('medium');
    setFilters({});
    resetFilters();
  }, [resetFilters]);

  return (
    <div className={cn(
        "min-h-screen transition-colors duration-500 pb-32 lg:pb-0",
        isDark ? "bg-background text-foreground" : "bg-[#F8FAFC] text-slate-900"
    )}>
      {/* Target Acquisition Header Style */}
      <div className={cn(
          "bg-background pb-4 pt-2 px-0 safe-top-padding border-b transition-all duration-300",
          isDark ? "border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-sm"
      )}>
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/client/dashboard')}
                className={cn(
                    "w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90 border shadow-sm",
                    isDark ? "bg-muted/40 border-white/10 text-white" : "bg-white border-slate-200 text-slate-600"
                )}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1 block opacity-70">Target Scope</span>
                <h1 className="text-xl lg:text-3xl font-black tracking-tighter uppercase italic leading-none">Discovery Engine</h1>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={handleReset}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-5 py-2.5 bg-rose-500/10 rounded-full border border-rose-500/20 hover:bg-rose-500/20 transition-all active:scale-95"
              >
                Purge All
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex bg-muted/20 p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'property', icon: Building2, label: 'Properties' },
                  { id: 'motorcycle', icon: Bike, label: 'Motorcycles' },
                  { id: 'bicycle', icon: Trophy, label: 'Bicycles' },
                  { id: 'services', icon: Wrench, label: 'Workers' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                        setRadarCategory(cat.id as QuickFilterCategory);
                        triggerHaptic('medium');
                    }}
                    title={cat.label}
                    className={cn(
                      "w-11 h-11 flex items-center justify-center rounded-xl transition-all",
                      radarCategory === cat.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <cat.icon className="w-5 h-5" />
                  </button>
                ))}
              </div>

              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Scan target sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 h-13 rounded-2xl bg-muted/20 border border-white/5 focus:bg-muted/40 transition-all font-black italic text-sm placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12">
          {/* Laser Filters Sidebar */}
          <aside className="w-full lg:w-96 shrink-0">
             <div className="space-y-12 sticky top-48">
               <DiscoveryFilters 
                 category={radarCategory === 'services' ? 'service' : radarCategory as any} 
                 onApply={handleApplyFilters} 
                 initialFilters={filters} 
                 activeCount={activeFilterCount} 
               />
             </div>
          </aside>

          {/* Acquisition Status Main */}
          <main className="flex-1">
            <div className="flex flex-col items-center justify-center py-40 bg-muted/5 rounded-[4rem] border border-white/5 text-center px-10 relative overflow-hidden group">
               {/* Background Glow */}
               <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               
               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="relative mb-10"
               >
                 <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                 <Users className="h-24 w-24 text-muted-foreground/20 relative z-10" strokeWidth={1} />
               </motion.div>
               
               <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 scale-x-95">No Targets Resolved</h3>
               <p className="text-muted-foreground max-w-sm mx-auto text-[11px] font-black uppercase tracking-[0.25em] leading-relaxed opacity-40 italic">
                 Refine your radar scope to identify high-value targets in the {radarCategory} sector.
               </p>

               <div className="mt-12 flex gap-4">
                  <div className="h-1 w-12 rounded-full bg-primary/20" />
                  <div className="h-1 w-12 rounded-full bg-primary/40" />
                  <div className="h-1 w-12 rounded-full bg-primary/20" />
               </div>
            </div>
          </main>
        </div>
      </div>

      {/* TACTICAL APPLY BUTTON */}
      <div className="fixed bottom-12 left-0 right-0 px-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinalApply}
            className={cn(
              "w-full h-22 rounded-[3.5rem] flex items-center justify-center gap-6 px-10 text-xl font-black transition-all duration-500 shadow-[0_30px_90px_rgba(0,0,0,0.6)] relative overflow-hidden group",
              "bg-primary text-white shadow-primary/40 border border-white/20"
            )}
          >
            <motion.div 
              animate={{ x: [-400, 400], opacity: [0, 0.4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none"
            />
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <span className="tracking-tighter uppercase italic">Engage Intelligence</span>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <AnimatePresence mode="popLayout">
                {activeFilterCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: -20 }}
                    className="bg-white text-primary px-5 py-2 rounded-full text-[12px] font-black shadow-2xl"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

