import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Home, Bike, Briefcase, RotateCcw, Zap,
  ChevronLeft, Search, Filter, Layers, CreditCard,
  Target, Rocket, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useSaveClientFilterPreferences, useClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { haptics } from '@/utils/microPolish';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

type ListingType = QuickFilterListingType;

const categories: {
  id: QuickFilterCategory;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
}[] = [
  {
    id: 'property',
    label: 'Properties',
    emoji: '🏡',
    description: 'Homes & Rentals',
    gradient: 'from-blue-500/20 to-indigo-600/20',
  },
  {
    id: 'motorcycle',
    label: 'Motos',
    emoji: '🏍️',
    description: 'Bikes & Scooters',
    gradient: 'from-orange-500/20 to-rose-600/20',
  },
  {
    id: 'bicycle',
    label: 'Bicycles',
    emoji: '🚲',
    description: 'Cycles & E-bikes',
    gradient: 'from-emerald-500/20 to-teal-600/20',
  },
  {
    id: 'services',
    label: 'Services',
    emoji: '💼',
    description: 'Workers & Pros',
    gradient: 'from-purple-500/20 to-violet-600/20',
  },
];

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const urlParams = new URLSearchParams(location.search);
  const aiCategory = urlParams.get('category');

  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType) as ListingType;
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetFilters = useFilterStore((state) => state.resetClientFilters);

  const { data: dbPrefs } = useClientFilterPreferences();
  const savePrefs = useSaveClientFilterPreferences();

  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(() => {
    if (aiCategory) return [aiCategory as QuickFilterCategory];
    if (storeCategories.length > 0) return storeCategories;
    if (dbPrefs?.preferred_categories && Array.isArray(dbPrefs.preferred_categories) && dbPrefs.preferred_categories.length > 0) {
      return dbPrefs.preferred_categories as QuickFilterCategory[];
    }
    return [];
  });
  const [selectedListingType, setSelectedListingType] = useState<ListingType>(() => {
    if (storeListingType !== 'both') return storeListingType;
    if (dbPrefs?.preferred_listing_types && Array.isArray(dbPrefs.preferred_listing_types) && dbPrefs.preferred_listing_types.length === 1) {
      return dbPrefs.preferred_listing_types[0] as ListingType;
    }
    return storeListingType;
  });

  const activeFilterCount = selectedCategories.length + (selectedListingType !== 'both' ? 1 : 0);
  const hasChanges = activeFilterCount > 0;

  const toggleCategory = useCallback((id: QuickFilterCategory) => {
    haptics.tap();
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleApply = useCallback(() => {
    haptics.success();
    setCategories(selectedCategories);
    setListingType(selectedListingType);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });

    savePrefs.mutate({
      preferred_categories: selectedCategories as string[],
      preferred_listing_types: selectedListingType === 'both' ? ['rent', 'sale'] : [selectedListingType],
    });

    navigate(-1);
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate, savePrefs]);

  const handleReset = useCallback(() => {
    haptics.tap();
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetFilters();
  }, [resetFilters]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Liquid Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-3 shrink-0 rounded-2xl text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2 truncate">
                Discover
                <Sparkles className="w-4 h-4 text-primary fill-primary/20 shrink-0" />
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 truncate">Global Listing Filters</p>
            </div>
          </div>
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={handleReset}
                className="text-[10px] font-black uppercase tracking-widest text-primary px-4 py-2 bg-primary/10 rounded-full"
              >
                Reset All
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 py-10 space-y-12 max-w-2xl mx-auto">
        {/* Sector Selection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Active Sectors</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat) => {
              const isActive = selectedCategories.includes(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleCategory(cat.id)}
                  className={cn(
                    "relative p-5 rounded-[2.5rem] text-left transition-all duration-300 border-2 overflow-hidden",
                    isActive 
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                      : "border-border/40 bg-secondary/20 grayscale-[0.8] opacity-60 hover:opacity-100 hover:grayscale-0"
                  )}
                >
                  <div className="relative z-10 flex flex-col gap-3">
                    <span className="text-3xl">{cat.emoji}</span>
                    <div>
                      <div className="font-black text-sm">{cat.label}</div>
                      <div className="text-[10px] font-bold opacity-60 leading-none">{cat.description}</div>
                    </div>
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="client-category-glow"
                      className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Transaction Mode */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Transaction Mode</h2>
          </div>

          <div className="flex gap-4 p-2 bg-secondary/20 rounded-[2rem] border border-border/40">
            {(['rent', 'sale'] as ListingType[]).map((type) => {
              const isActive = selectedListingType === type;
              return (
                <motion.button
                  key={type}
                  onClick={() => { haptics.tap(); setSelectedListingType(prev => prev === type ? 'both' : type); }}
                  className={cn(
                    "flex-1 relative py-4 rounded-[1.5rem] flex items-center justify-center gap-2 transition-all duration-300 capitalize",
                    isActive ? "text-primary font-black" : "text-muted-foreground hover:text-foreground font-bold"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="listing-type-pill"
                      className="absolute inset-0 bg-background shadow-lg rounded-[1.5rem] z-0"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{type}</span>
                </motion.button>
              );
            })}
          </div>
        </section>


      </div>

      {/* Primary Apply Button */}
      <div className="fixed bottom-10 left-0 right-0 px-6 z-50">
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-18 rounded-[2rem] flex items-center justify-between px-8 text-lg font-black transition-all duration-500 shadow-2xl relative overflow-hidden group",
              hasChanges 
                ? "bg-primary text-primary-foreground shadow-primary/30" 
                : "bg-slate-800 text-slate-400 border border-slate-700 backdrop-blur-xl"
            )}
          >
            {hasChanges && (
              <motion.div 
                animate={{ x: [-100, 100], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-30"
              />
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              <Search className="w-6 h-6" />
              <span>Target Listings</span>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">
                  {activeFilterCount}
                </span>
              )}
              <Filter className="w-6 h-6" />
            </div>
          </motion.button>
        </div>
      </div>


    </div>
  );
}
