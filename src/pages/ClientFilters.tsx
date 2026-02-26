import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Home, Bike, Briefcase, Check, RotateCcw, Zap, ShoppingBag, Building2, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { QuickFilterCategory, QuickFilterListingType } from '@/types/filters';

// Define the type local alias if needed, but QuickFilterListingType is preferred
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
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const urlParams = new URLSearchParams(location.search);
  const aiCategory = urlParams.get('category');

  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType) as ListingType;
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetFilters = useFilterStore((state) => state.resetClientFilters);

  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(
    aiCategory ? [aiCategory as QuickFilterCategory] : storeCategories
  );
  const [selectedListingType, setSelectedListingType] = useState<ListingType>(storeListingType);

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
    navigate(-1);
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate]);

  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetFilters();
  }, [resetFilters]);

  return (
    <div className="min-h-full bg-background transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary border border-border/50 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">Discovery Filters</h1>
              <p className="text-xs font-medium text-muted-foreground">
                {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'What are you looking for?'}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-sm font-semibold text-foreground/80 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-36">
          {/* AI Suggestions Banner - M3 Tonal Style */}
          <section>
            <div className="relative overflow-hidden rounded-[2rem] p-6 bg-primary/5 border border-primary/10">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-20 h-20 text-primary" />
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary font-bold">SMART AI</Badge>
                </div>
                <h2 className="text-xl font-bold text-foreground">AI Guided Search</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Let our AI Listing Assistant help you find the perfect match based on your preferences and viewing history.
                </p>
                <Button variant="default" className="rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Try AI Search
                </Button>
              </div>
            </div>
          </section>

          {/* Categories Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Categories
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((option) => {
                const isSelected = selectedCategories.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => toggleCategory(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative overflow-hidden rounded-[2rem] text-left transition-all duration-300",
                      isSelected
                        ? "border-2 border-primary/30 ring-4 ring-primary/5"
                        : "border border-border/50 bg-card/40 hover:bg-card/60"
                    )}
                    style={{
                      height: '110px',
                      background: isSelected ? option.gradient : undefined,
                    }}
                  >
                    <div className="relative p-4 flex flex-col justify-between h-full">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", isSelected ? "text-white" : "text-foreground")}>{option.label}</p>
                        <p className={cn("text-[10px] font-medium opacity-70", isSelected ? "text-white" : "text-muted-foreground")}>
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Listing Type Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Listing Type
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {(['rent', 'sale', 'both'] as ListingType[]).map((type) => {
                const isSelected = selectedListingType === type;
                const labels: Record<ListingType, string> = { rent: 'Rentals', sale: 'Purchase', both: 'Both' };
                const icons: Record<ListingType, React.ReactNode> = {
                  rent: <ShoppingBag className="w-5 h-5" />,
                  sale: <Building2 className="w-5 h-5" />,
                  both: <Users className="w-5 h-5" />
                };

                return (
                  <motion.button
                    key={type}
                    onClick={() => setSelectedListingType(type)}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                      isSelected
                        ? "bg-primary/10 border-primary/30 shadow-md shadow-primary/5"
                        : "bg-card/30 border-border/40"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      {icons[type]}
                    </div>
                    <span className={cn("text-sm font-bold flex-1", isSelected ? "text-primary" : "text-foreground")}>
                      {labels[type]}
                    </span>
                    {isSelected && (
                      <motion.div
                        layoutId="check-listing"
                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Bottom Fixed Apply Button - M3 Pill Style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background/80 backdrop-blur-xl border-t border-border/40">
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
          >
            {hasChanges ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Apply Filters'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
