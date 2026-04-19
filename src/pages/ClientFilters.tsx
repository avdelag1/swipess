import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ChevronLeft, Search, Check, X, Users, Home, Package
} from 'lucide-react';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useSaveClientFilterPreferences, useClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { haptics } from '@/utils/microPolish';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

export interface ClientFiltersProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function ClientFilters({ isEmbedded, onClose }: ClientFiltersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const urlParams = new URLSearchParams(location.search);
  const aiCategory = urlParams.get('category');

  // STORE STATE
  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  const storeBedrooms = useFilterStore((state) => state.bedrooms);
  const storeBathrooms = useFilterStore((state) => state.bathrooms);
  
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const setBedrooms = useFilterStore((state) => state.setBedrooms);
  const setBathrooms = useFilterStore((state) => state.setBathrooms);
  const resetFilters = useFilterStore((state) => state.resetClientFilters);

  const { data: _dbPrefs } = useClientFilterPreferences();
  const savePrefs = useSaveClientFilterPreferences();

  const [searchQuery, setSearchQuery] = useState('');

  // LOCAL UI STATE
  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(() => {
    if (aiCategory) return [aiCategory as QuickFilterCategory];
    if (storeCategories.length > 0) return storeCategories;
    return [];
  });
  const [selectedListingType, setSelectedListingType] = useState<QuickFilterListingType>(storeListingType);
  const [selectedBedrooms, setSelectedBedrooms] = useState<number[]>(storeBedrooms);
  const [selectedBathrooms, setSelectedBathrooms] = useState<number[]>(storeBathrooms);

  const activeFilterCount = (selectedListingType !== 'both' ? 1 : 0) + selectedBedrooms.length + selectedBathrooms.length;
  const hasChanges = activeFilterCount > 0 || selectedCategories.length > 0;

  const toggleCategory = useCallback((id: QuickFilterCategory) => {
    haptics.tap();
    setSelectedCategories([id]);
  }, []);

  const toggleBedroom = (val: number) => {
    haptics.select();
    setSelectedBedrooms(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleBathroom = (val: number) => {
    haptics.select();
    setSelectedBathrooms(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const handleApply = useCallback(() => {
    haptics.success();
    setCategories(selectedCategories);
    setListingType(selectedListingType);
    setBedrooms(selectedBedrooms);
    setBathrooms(selectedBathrooms);
    
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });

    savePrefs.mutate({
      preferred_categories: selectedCategories as string[],
      preferred_listing_types: selectedListingType === 'both' ? ['rent', 'sale'] : [selectedListingType],
    });

    if (onClose) onClose();
    else navigate('/client/dashboard');
  }, [selectedCategories, selectedListingType, selectedBedrooms, selectedBathrooms, setCategories, setListingType, setBedrooms, setBathrooms, queryClient, navigate, savePrefs, onClose]);

  const handleReset = useCallback(() => {
    haptics.tap();
    setSelectedCategories([]);
    setSelectedListingType('both');
    setSelectedBedrooms([]);
    setSelectedBathrooms([]);
    resetFilters();
  }, [resetFilters]);

  const activeCategory = selectedCategories[0] || 'property';

  return (
    <div className={cn(
        "transition-colors duration-500 pb-32 lg:pb-0",
        !isEmbedded && "min-h-screen",
        theme === 'nexus-style' ? "bg-black text-white" : 
        (theme === 'ivanna-style' ? "bg-transparent text-foreground ivanna-style" : (isDark ? "bg-background text-foreground" : "bg-[#F8FAFC] text-slate-900")),
        isEmbedded && "bg-transparent text-white"
    )}>
      {/* Target Acquisition Header Style */}
      {!isEmbedded && (
        <div className={cn(
          "sticky top-0 z-50 backdrop-blur-3xl border-b transition-all duration-300 safe-top-padding",
          theme === 'nexus-style' ? "bg-black/60 border-white/10 shadow-2xl" :
          (theme === 'ivanna-style' ? "bg-white/20 border-foreground shadow-artisan" : (isDark ? "bg-background/80 border-white/5 shadow-2xl" : "bg-white/80 border-slate-200 shadow-sm"))
      )}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 border shadow-sm",
                    isDark ? "bg-muted/40 border-white/10 text-white" : "bg-white border-slate-200 text-slate-600"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Target Scope</span>
                <h1 className="text-xl md:text-2xl font-bold leading-snug">Discovery</h1>
              </div>
            </div>
            {hasChanges && (
              <button
                onClick={handleReset}
                className="text-xs font-medium text-primary px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors duration-150"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex bg-muted/20 p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'property', icon: Home, label: 'Properties' },
                  { id: 'motorcycle', icon: Package, label: 'Motos' },
                  { id: 'bicycle', icon: Sparkles, label: 'Bicycles' },
                  { id: 'services', icon: Users, label: 'Workers' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id as QuickFilterCategory)}
                    className={cn(
                      "w-11 h-11 flex items-center justify-center rounded-xl transition-all",
                      activeCategory === cat.id ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-muted/40"
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
                  placeholder="Search target sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 h-13 rounded-2xl bg-muted/20 border border-white/5 focus:bg-muted/40 transition-all font-black italic text-sm placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={cn("container mx-auto px-6 pt-4 pb-10", isEmbedded && "pt-10")}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-80 shrink-0">
             <div className="space-y-8 sticky top-48">
               <section className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</h2>
                    <span className="text-[10px] font-medium uppercase opacity-40">{activeCategory}</span>
                 </div>

                 <div className={cn(
                     "grid grid-cols-3 gap-2 p-1.5 rounded-3xl border",
                     isDark ? "bg-muted/10 border-white/5" : "bg-white border-slate-200"
                 )}>
                   {(['rent', 'sale', 'both'] as const).map((type) => {
                     const isActive = selectedListingType === type;
                     return (
                       <button
                         key={type}
                         onClick={() => { haptics.tap(); setSelectedListingType(type); }}
                         className={cn(
                           "py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                           isActive 
                               ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" 
                               : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                         )}
                       >
                         {type}
                       </button>
                     );
                   })}
                 </div>
               </section>

               <section className="space-y-5">
                 <div className="flex items-center gap-2 opacity-70">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</span>
                 </div>
                 
                 {activeCategory === 'property' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pl-1">
                        <div className="space-y-4">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bedrooms</label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => toggleBedroom(n)}
                                        className={cn(
                                          "h-11 px-5 rounded-2xl text-[10px] font-black transition-all border",
                                          selectedBedrooms.includes(n) 
                                            ? "bg-primary/20 border-primary text-primary shadow-inner" 
                                            : "bg-muted/10 border-white/5 text-muted-foreground"
                                        )}
                                    >
                                        {n}+
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Bathrooms</label>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3].map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => toggleBathroom(n)}
                                        className={cn(
                                          "h-11 px-5 rounded-2xl text-[10px] font-black transition-all border",
                                          selectedBathrooms.includes(n) 
                                            ? "bg-primary/20 border-primary text-primary shadow-inner" 
                                            : "bg-muted/10 border-white/5 text-muted-foreground"
                                        )}
                                    >
                                        {n}+
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                 )}

                 <div className="space-y-4 pl-1">
                    <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Lifestyle Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {['Pet Friendly', 'Furnished', 'City Center', 'Gym'].map(tag => (
                        <button 
                          key={tag}
                          className="h-10 px-4 rounded-xl text-[9px] font-black uppercase tracking-tight bg-muted/10 border border-white/5 text-muted-foreground/60 hover:text-foreground transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                 </div>
               </section>
             </div>
          </aside>

          <main className="flex-1">
            <div className="flex flex-col items-center justify-center py-32 bg-muted/5 rounded-[3.5rem] border border-white/5 text-center px-6">
               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="relative mb-8"
               >
                 <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150" />
                 <Users className="h-20 w-20 text-muted-foreground/20 relative z-10" strokeWidth={1} />
               </motion.div>
               <h3 className="text-xl md:text-2xl font-bold leading-snug mb-2">No candidates yet</h3>
               <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                 Refine your filters to surface active matches.
               </p>
            </div>
          </main>
        </div>
      </div>

      <div className="fixed bottom-12 left-0 right-0 px-6 z-50 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-22 rounded-[3.5rem] flex items-center justify-between px-10 text-xl font-black transition-all duration-500 shadow-[0_30px_70px_rgba(0,0,0,0.4)] relative overflow-hidden group",
              hasChanges 
                ? "bg-primary text-white shadow-primary/30" 
                : "bg-background border border-white/10 text-muted-foreground"
            )}
          >
            {hasChanges && (
              <motion.div 
                animate={{ x: [-300, 300], opacity: [0, 0.4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent skew-x-30 pointer-events-none"
              />
            )}
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xl border border-white/20">
                <Search className="w-5 h-5" />
              </div>
              <span className="tracking-tighter uppercase italic">Target Intelligence</span>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <AnimatePresence mode="popLayout">
                {activeFilterCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0, x: 20 }}
                    animate={{ scale: 1, x: 0 }}
                    exit={{ scale: 0, x: -20 }}
                    className="bg-white text-primary px-5 py-2 rounded-full text-[11px] font-black shadow-2xl"
                  >
                    {activeFilterCount}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="w-10 h-10 flex items-center justify-center">
                <Sparkles className={cn("w-6 h-6", hasChanges && "animate-pulse")} />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
