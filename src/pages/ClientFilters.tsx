import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Sparkles, Home, Bike, Briefcase, Check, RotateCcw, Zap } from 'lucide-react';
import { AISearchDialog } from '@/components/AISearchDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useSaveClientFilterPreferences, useClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

type ListingType = QuickFilterListingType;

const categories: {
  id: QuickFilterCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}[] = [
  {
    id: 'property',
    label: 'Properties',
    description: 'Homes & Rentals',
    icon: <Home className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    glow: 'rgba(59,130,246,0.4)',
  },
  {
    id: 'motorcycle',
    label: 'Motorcycles',
    description: 'Bikes & Scooters',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M9 17h6M19 17l-2-5h-4l-3-4H6l1 4" />
        <path d="M14 7h3l2 5" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    glow: 'rgba(249,115,22,0.4)',
  },
  {
    id: 'bicycle',
    label: 'Bicycles',
    description: 'Cycles & E-bikes',
    icon: <Bike className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
    glow: 'rgba(16,185,129,0.4)',
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Workers & Pros',
    icon: <Briefcase className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 100%)',
    glow: 'rgba(168,85,247,0.4)',
  },
];

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAISearch, setShowAISearch] = useState(false);
  const queryClient = useQueryClient();
  const { theme } = useTheme();

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
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }, []);

  const handleApply = useCallback(() => {
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
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetFilters();
  }, [resetFilters]);

  return (
    <div className="h-full w-full flex flex-col bg-background transition-colors duration-500 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-secondary/50 border border-border/50 text-foreground"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">Mission Parameters</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                {activeFilterCount > 0 ? `${activeFilterCount} Active Filters` : 'Configure Sector'}
              </p>
            </div>
          </div>
          
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-xs font-black text-foreground hover:bg-secondary transition-colors shadow-sm"
              >
                <RotateCcw className="w-4.5 h-4.5" />
                RESET
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="overflow-y-auto">
        <div className="px-4 py-6 space-y-8 pb-4">
          {/* AI Suggestions Banner - M3 Tonal Style */}
          <section>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-secondary/30 border border-border/50 p-6">
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4 fill-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{theme === 'dark' ? 'Neural' : 'Smart'} Assistant</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Need something very specific?</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[240px]">
                    Tell our AI exactly what you're looking for, and we'll compute it.
                  </p>
                  <Button 
                    onClick={() => setShowAISearch(true)}
                    variant="default" 
                    size="sm" 
                    className="mt-4 h-10 px-6 rounded-full font-black text-xs gap-2 shadow-lg shadow-primary/20"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    START AI SEARCH
                  </Button>
                </div>
                <div className="hidden sm:block absolute top-0 right-0 h-full w-1/3 opacity-20 pointer-events-none">
                   <div className="absolute inset-0 bg-gradient-to-l from-primary/40 to-transparent" />
                </div>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Active Sectors</h2>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-black/5 dark:bg-white/5 rounded-[2.5rem]">
              {categories.map((cat) => {
                const isActive = selectedCategories.includes(cat.id);
                return (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleCategory(cat.id)}
                    className={cn(
                      "relative p-4 rounded-[2rem] text-left overflow-hidden transition-colors duration-300 z-10",
                      isActive ? "text-primary-foreground" : "text-foreground/70"
                    )}
                    data-no-swipe-nav="true"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="category-active-pill"
                        className="absolute inset-0 bg-primary shadow-lg shadow-primary/20 z-0"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10 flex flex-col gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20 text-white" : "bg-black/5 dark:bg-white/5 text-foreground/70"
                      )}>
                        {cat.icon}
                      </div>
                      <div>
                        <div className="font-black text-sm tracking-tight">{cat.label}</div>
                        <div className={cn(
                          "text-[10px] font-bold uppercase tracking-wider opacity-60",
                          isActive ? "text-white" : "text-muted-foreground"
                        )}>{cat.description}</div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Listing Type */}
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 px-1">Transaction Mode</h2>
            <div className="flex gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-[2rem] relative">
              {(['rent', 'sale'] as ListingType[]).map((type) => {
                const isActive = selectedListingType === type;
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedListingType(prev => prev === type ? 'both' : type)}
                    className={cn(
                      "flex-1 relative h-14 rounded-[1.5rem] font-black text-sm transition-colors duration-300 capitalize z-10",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-no-swipe-nav="true"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="listing-type-pill"
                        className="absolute inset-0 bg-primary shadow-lg shadow-primary/20 rounded-[1.5rem]"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-20">{type}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Fixed Apply Button Bar - Premium ergonomic position */}
      <div className="flex-shrink-0 p-4 pb-8 bg-background/80 backdrop-blur-xl border-t border-border/40" style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}>
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-14 rounded-full text-base font-bold shadow-xl transition-all duration-300",
              hasChanges
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/20"
                : "bg-secondary text-muted-foreground border border-border/50"
            )}
            data-no-swipe-nav="true"
          >
            {hasChanges ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Apply Filters'}
          </motion.button>
        </div>
      </div>

      <AISearchDialog isOpen={showAISearch} onClose={() => setShowAISearch(false)} userRole="client" />
    </div>
  );
}
