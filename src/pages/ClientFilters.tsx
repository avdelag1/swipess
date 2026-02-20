/**
 * CLIENT FILTERS PAGE - Clean design
 * 
 * Full-screen filter page with solid colors for visibility on all themes.
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Home, Bike, Briefcase, X, ChevronRight, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

const categories: { 
  id: QuickFilterCategory; 
  label: string; 
  icon: React.ReactNode;
  color: string;
}[] = [ 
  { 
    id: 'property', 
    label: 'Properties', 
    icon: <Home className="w-5 h-5" />,
    color: 'text-blue-400',
  },
  { 
    id: 'motorcycle', 
    label: 'Motorcycles', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M9 17h6M19 17l-2-5h-4l-3-4H6l1 4" />
        <path d="M14 7h3l2 5" />
      </svg>
    ),
    color: 'text-orange-400',
  },
  { 
    id: 'bicycle', 
    label: 'Bicycles', 
    icon: <Bike className="w-5 h-5" />,
    color: 'text-emerald-400',
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-purple-400',
  },
];

const listingTypes = [
  { id: 'both' as const, label: 'All Types', description: 'Rent & Sale' },
  { id: 'rent' as const, label: 'Rent Only', description: 'For rent' },
  { id: 'sale' as const, label: 'Buy Only', description: 'For sale' },
];

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Get URL params for AI-suggested filters
  const urlParams = new URLSearchParams(location.search);
  const aiCategory = urlParams.get('category');
  const aiPriceMin = urlParams.get('priceMin');
  const aiPriceMax = urlParams.get('priceMax');
  const aiKeywords = urlParams.get('keywords');
  
  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  
  // Initialize with URL params if available, otherwise use store
  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(
    aiCategory ? [aiCategory as QuickFilterCategory] : storeCategories
  );
  const [selectedListingType, setSelectedListingType] = useState<'rent' | 'sale' | 'both'>(
    storeListingType
  );
  
  const activeFilterCount = selectedCategories.length + (selectedListingType !== 'both' ? 1 : 0);
  const hasChanges = activeFilterCount > 0;
  
  const handleCategoryToggle = useCallback((categoryId: QuickFilterCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);
  
  const handleApply = useCallback(() => {
    setCategories(selectedCategories);
    setListingType(selectedListingType);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    navigate(-1);
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate]);
  
  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetClientFilters();
  }, [resetClientFilters]);
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="min-h-full bg-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">Filters</h1>
              <p className="text-xs text-white/50">
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Customize your search'}
              </p>
            </div>
          </div>

          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-32">
          {/* AI Suggestions Banner */}
          {(aiCategory || aiPriceMin || aiPriceMax) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-orange-500/20 border border-orange-500/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">AI Suggested Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiCategory && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300">
                    Category: {aiCategory}
                  </span>
                )}
                {(aiPriceMin || aiPriceMax) && (
                  <span className="px-2 py-1 text-xs rounded-lg bg-zinc-800 text-zinc-300">
                    Price: ${aiPriceMin || '0'} - ${aiPriceMax || '∞'}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Categories Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Categories</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative p-4 rounded-2xl border transition-all duration-200",
                      isSelected
                        ? "bg-orange-500/20 border-orange-500"
                        : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    {/* Selection indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-2 right-2"
                        >
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className={cn("mb-2", category.color)}>
                      {category.icon}
                    </div>
                    <span className="text-sm font-medium text-white">{category.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Listing Type Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Listing Type</h2>
            <div className="space-y-2">
              {listingTypes.map((type) => {
                const isSelected = selectedListingType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedListingType(type.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      isSelected
                        ? "bg-orange-500/20 border-orange-500"
                        : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
                    )}
                  >
                    <div className="text-left">
                      <span className="text-sm font-medium text-white block">{type.label}</span>
                      <span className="text-xs text-white/50">{type.description}</span>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Bottom Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleApply}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200",
              hasChanges
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-lg"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Apply Filters' : 'No filters selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}
