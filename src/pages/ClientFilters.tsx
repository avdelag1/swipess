/**
 * CLIENT FILTERS PAGE - SIMPLE & WORKING
 * 
 * A clean, mobile-first filter page that:
 * 1. Opens properly
 * 2. Updates filterStore correctly
 * 3. Triggers the query to refresh
 * 4. Shows results immediately
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Home, Bike, Briefcase, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

// Category configuration
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
    color: 'text-blue-500',
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
    color: 'text-slate-600',
    bgColor: 'bg-slate-500',
  },
  { 
    id: 'bicycle', 
    label: 'Bicycles', 
    icon: <Bike className="w-5 h-5" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
  },
  { 
    id: 'services', 
    label: 'Services', 
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500',
  },
];

const listingTypes = [
  { id: 'both' as const, label: 'Both' },
  { id: 'rent' as const, label: 'For Rent' },
  { id: 'sale' as const, label: 'For Sale' },
];

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Get current filters from store
  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  
  // Local state initialized from store
  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(storeCategories);
  const [selectedListingType, setSelectedListingType] = useState<'rent' | 'sale' | 'both'>(storeListingType);
  
  // Determine initial category from URL or store
  const initialCategory = location.search.includes('category=') 
    ? location.search.split('category=')[1]?.split('&')[0] as QuickFilterCategory
    : storeCategories[0] || 'property';
    
  const [activeTab, setActiveTab] = useState<QuickFilterCategory>(initialCategory);
  
  // Count active filters
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
    // Update filter store
    setCategories(selectedCategories);
    setListingType(selectedListingType);
    
    // Invalidate queries to force refresh with new filters
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    
    // Always go back to dashboard, not just -1
    navigate('/client/dashboard', { replace: true });
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate]);
  
  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetClientFilters();
  }, [resetClientFilters]);
  
  const handleBack = useCallback(() => {
    // Always go back to dashboard, not just -1
    navigate('/client/dashboard', { replace: true });
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold">What I'm Looking For</h1>
                <p className="text-xs text-muted-foreground">
                  {activeFilterCount > 0 
                    ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                    : 'Select categories to browse'
                  }
                </p>
              </div>
            </div>
            
            {activeFilterCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          
          {/* Listing Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                I WANT TO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {listingTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedListingType(type.id)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-sm font-medium transition-all",
                      selectedListingType === type.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CATEGORIES
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isSelected ? category.bgColor : "bg-muted"
                      )}>
                        <span className={isSelected ? "text-white" : category.color}>
                          {category.icon}
                        </span>
                      </div>
                      <span className={cn(
                        "font-medium",
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {category.label}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          category.bgColor
                        )}
                      >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Filters */}
          {selectedCategories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => navigate(`/client/filters-explore`)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">More Filters...</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {selectedCategories.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Select at least one category to start browsing
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Apply Button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            disabled={selectedCategories.length === 0}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
