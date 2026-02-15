/**
 * CLIENT FILTERS PAGE - Premium glass design
 * 
 * Full-screen filter page that properly updates filterStore
 * and triggers category-based filtering on swipe cards.
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Home, Bike, Briefcase, X, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

const categories: { 
  id: QuickFilterCategory; 
  label: string; 
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
  { 
    id: 'property', 
    label: 'Properties', 
    icon: <Home className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500',
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
    color: 'text-slate-400',
    bgColor: 'bg-slate-500',
  },
  { 
    id: 'bicycle', 
    label: 'Bicycles', 
    icon: <Bike className="w-5 h-5" />,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500',
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500',
  },
];

const listingTypes = [
  { id: 'both' as const, label: 'All', description: 'Rent & Sale' },
  { id: 'rent' as const, label: 'Rent', description: 'Rentals only' },
  { id: 'sale' as const, label: 'Buy', description: 'For sale only' },
];

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  
  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(storeCategories);
  const [selectedListingType, setSelectedListingType] = useState<'rent' | 'sale' | 'both'>(storeListingType);
  
  const activeFilterCount = selectedCategories.length + (selectedListingType !== 'both' ? 1 : 0);
  
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
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    navigate('/client/dashboard', { replace: true });
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate]);
  
  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetClientFilters();
  }, [resetClientFilters]);
  
  const handleBack = useCallback(() => {
    navigate('/client/dashboard', { replace: true });
  }, [navigate]);
  
  return (
    <div className="min-h-full flex flex-col pb-24">
      {/* Header */}
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full hover:bg-muted/80"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Filters</h1>
              <p className="text-xs text-muted-foreground">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'Choose what to browse'
                }
              </p>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-foreground hover:text-foreground hover:bg-muted/80 rounded-full font-medium"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
          
          {/* Listing Type */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
              I want to
            </p>
            <div className="grid grid-cols-3 gap-3">
              {listingTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedListingType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-4 px-3 rounded-2xl transition-all duration-200 shadow-sm border-2",
                    selectedListingType === type.id
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 border-primary"
                      : "bg-card border-border hover:bg-muted/70 hover:border-muted-foreground/30 text-foreground"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    selectedListingType === type.id ? "text-primary-foreground" : "text-foreground"
                  )}>{type.label}</span>
                  <span className={cn(
                    "text-xs mt-1",
                    selectedListingType === type.id ? "text-primary-foreground/90" : "text-muted-foreground"
                  )}>
                    {type.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Categories
            </p>
            <div className="space-y-3">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.98 }}
                    layout
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 shadow-md border-2",
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 border-primary"
                        : "bg-card border-border hover:bg-muted/70 hover:border-muted-foreground/30 text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <motion.div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm",
                          isSelected ? "bg-primary-foreground/20" : "bg-muted"
                        )}
                        animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                        transition={springTransition}
                      >
                        <span className={isSelected ? "text-primary-foreground" : category.color}>
                          {category.icon}
                        </span>
                      </motion.div>
                      <span className={cn(
                        "font-bold text-base",
                        isSelected ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {category.label}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={springTransition}
                          className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-primary-foreground font-bold" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          {selectedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
            >
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Quick Actions
                </p>
                <button
                  onClick={() => navigate(`/client/filters-explore`)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/60 hover:bg-muted border-2 border-border hover:border-muted-foreground/30 transition-all shadow-sm"
                >
                  <span className="text-sm font-semibold text-foreground">More Filters...</span>
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {selectedCategories.length === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">
                Select a category to start browsing
              </p>
            </div>
          )}

          {/* Bottom spacer for the sticky button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Footer - Apply Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pt-4 pb-3 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            disabled={selectedCategories.length === 0}
            className="w-full h-14 text-base font-bold rounded-2xl shadow-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground border-2 border-primary"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {selectedCategories.length === 0
              ? 'Select a Category'
              : `Browse ${selectedCategories.length} Categor${selectedCategories.length > 1 ? 'ies' : 'y'}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
