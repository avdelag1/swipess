import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Home, Bike, Briefcase, RotateCcw, Zap } from 'lucide-react';
import { AISearchDialog } from '@/components/AISearchDialog';
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
    <div className="w-full bg-background transition-colors duration-500 pb-20">
      <div className="px-4 py-6 space-y-8 pb-4">
        {/* Quick Actions */}
        <div className="flex items-center justify-between px-1">
          <div />
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 border border-border/50 text-[10px] font-black text-foreground hover:bg-secondary transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET ALL
              </motion.button>
            )}
          </AnimatePresence>
        </div>

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
                    "relative p-4 rounded-[2rem] text-left overflow-hidden transition-all duration-300 border-2",
                    isActive ? "border-primary shadow-lg shadow-primary/10" : "border-border/40 bg-secondary/20 hover:bg-secondary/40"
                  )}
                  data-no-swipe-nav="true"
                >
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground/70"
                    )}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="font-black text-sm">{cat.label}</div>
                      <div className="text-[10px] text-muted-foreground/80 font-bold">{cat.description}</div>
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
          <div className="flex gap-3">
            {(['rent', 'sale'] as ListingType[]).map((type) => {
              const isActive = selectedListingType === type;
              return (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedListingType(prev => prev === type ? 'both' : type)}
                  className={cn(
                    "flex-1 h-14 rounded-3xl font-black text-sm border-2 transition-all duration-300 capitalize",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10" 
                      : "bg-secondary/20 border-border/40 text-muted-foreground"
                  )}
                  data-no-swipe-nav="true"
                >
                  {type}
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky Apply Button Bar - Premium ergonomic position above bottom nav */}
      <div className="sticky bottom-0 z-20 p-4 bg-background/80 backdrop-blur-xl border-t border-border/10">
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
