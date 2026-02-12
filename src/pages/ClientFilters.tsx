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
import { GlassSurface } from '@/components/ui/glass-surface';
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
  { id: 'both' as const, label: 'Both' },
  { id: 'rent' as const, label: 'For Rent' },
  { id: 'sale' as const, label: 'For Sale' },
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
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
              className="text-muted-foreground hover:text-foreground rounded-full"
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
          <GlassSurface elevation="elevated" className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              I want to
            </p>
            <div className="grid grid-cols-3 gap-2">
              {listingTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedListingType(type.id)}
                  className={cn(
                    "py-3 px-4 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-[var(--duration-fast)]",
                    selectedListingType === type.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/60 hover:bg-muted text-muted-foreground"
                  )}
                >
                  {type.label}
                </motion.button>
              ))}
            </div>
          </GlassSurface>

          {/* Categories */}
          <GlassSurface elevation="elevated" className="p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Categories
            </p>
            <div className="space-y-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.97 }}
                    layout
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--duration-fast)]",
                      isSelected
                        ? "border-primary/60 bg-primary/8"
                        : "border-transparent bg-muted/40 hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-[var(--duration-fast)]",
                          isSelected ? category.bgColor : "bg-muted"
                        )}
                        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                        transition={springTransition}
                      >
                        <span className={isSelected ? "text-white" : category.color}>
                          {category.icon}
                        </span>
                      </motion.div>
                      <span className={cn(
                        "font-medium text-[15px]",
                        isSelected ? "text-foreground" : "text-muted-foreground"
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
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center",
                            category.bgColor
                          )}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </GlassSurface>

          {/* Quick Actions */}
          {selectedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
            >
              <GlassSurface elevation="surface" className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Actions
                </p>
                <button
                  onClick={() => navigate(`/client/filters-explore`)}
                  className="w-full flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">More Filters...</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </GlassSurface>
            </motion.div>
          )}

          {/* Empty State */}
          {selectedCategories.length === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/60 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select a category to start browsing
              </p>
            </div>
          )}

          {/* Bottom spacer for the sticky button */}
          <div className="h-20" />
        </div>
      </div>

      {/* Footer - Apply Button */}
      <div className="shrink-0 px-4 pb-[max(env(safe-area-inset-bottom,12px),12px)] pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            disabled={selectedCategories.length === 0}
            className="w-full h-12 text-base font-semibold rounded-[var(--radius-lg)]"
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
