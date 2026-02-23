/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Home, Bike, CircleDot, Briefcase, RotateCcw, Check, Filter } from 'lucide-react';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { MotoClientFilters } from '@/components/filters/MotoClientFilters';
import { BicycleClientFilters } from '@/components/filters/BicycleClientFilters';
import { WorkerClientFilters } from '@/components/filters/WorkerClientFilters';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type CategoryType = 'property' | 'moto' | 'bicycle' | 'services';

// Category configs with gradient backgrounds
const categories: { id: CategoryType; name: string; icon: React.ElementType; gradient: string; borderColor: string }[] = [
  { id: 'property', name: 'Property', icon: Home, gradient: 'from-blue-500/20 to-cyan-500/20', borderColor: 'border-blue-500/30' },
  { id: 'moto', name: 'Motos', icon: CircleDot, gradient: 'from-orange-500/20 to-amber-500/20', borderColor: 'border-orange-500/30' },
  { id: 'bicycle', name: 'Bikes', icon: Bike, gradient: 'from-emerald-500/20 to-teal-500/20', borderColor: 'border-emerald-500/30' },
  { id: 'services', name: 'Jobs', icon: Briefcase, gradient: 'from-purple-500/20 to-pink-500/20', borderColor: 'border-purple-500/30' },
];

// Gradient button style
const gradientButtonClass = "bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30";

export default function OwnerFiltersExplore() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Connect to filter store
  const storeCategories = useFilterStore((state) => state.categories);
  const storeClientGender = useFilterStore((state) => state.clientGender);
  const storeClientType = useFilterStore((state) => state.clientType);
  const setClientGender = useFilterStore((state) => state.setClientGender);
  const setClientType = useFilterStore((state) => state.setClientType);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);
  
  const [activeCategory, setActiveCategory] = useState<CategoryType>('property');
  const [filterCounts, setFilterCounts] = useState<Record<CategoryType, number>>({
    property: 0,
    moto: 0,
    bicycle: 0,
    services: 0,
  });

  const handleApplyFilters = useCallback(() => {
    // Invalidate queries to refresh with new filters
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    queryClient.invalidateQueries({ queryKey: ['client-profiles'] });
    
    // Navigate back to dashboard
    navigate('/owner/dashboard');
  }, [queryClient, navigate]);

  const handleClearAll = useCallback(() => {
    setFilterCounts({
      property: 0,
      moto: 0,
      bicycle: 0,
      services: 0,
    });
    resetOwnerFilters();
  }, [resetOwnerFilters]);

  const handleFilterApply = useCallback((category: CategoryType, filters: any) => {
    // Count active filters
    const count = Object.entries(filters).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value !== '' && value !== 'any';
      if (typeof value === 'number') return value > 0;
      return false;
    }).length;
    
    setFilterCounts(prev => ({ ...prev, [category]: count }));
    
    // Apply gender and clientType filters to store
    if (filters.gender) {
      setClientGender(filters.gender);
    }
    if (filters.clientType) {
      setClientType(filters.clientType);
    }
  }, [setClientGender, setClientType]);

  const totalActiveFilters = Object.values(filterCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="min-h-full bg-gradient-to-b from-background via-background to-background/95">
        {/* Page Header with gradient */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/owner/dashboard')}
                  className="text-sm font-medium"
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <div className="rounded-2xl bg-primary/10 p-2">
                    <Filter className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">Find Clients</h1>
                    {totalActiveFilters > 0 && (
                      <p className="text-xs text-primary font-medium">
                        {totalActiveFilters} filters active
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs - Colorful gradient selection */}
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryType)} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-16 sm:h-14 p-1 gap-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const count = filterCounts[cat.id];
                const isActive = activeCategory === cat.id;
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className={cn(
                      "relative rounded-xl transition-all duration-300 min-h-[56px] touch-manipulation",
                      isActive ? `bg-gradient-to-r ${cat.gradient} ${cat.borderColor}` : ""
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <Icon className={cn("w-5 h-5 sm:w-4 sm:h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-xs sm:text-[10px] font-medium truncate max-w-full">{}</span>
                    </div>
                    <AnimatePresence>
                      {count > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge className="h-5 min-w-[20px] sm:h-4 sm:min-w-[16px] rounded-full px-1 text-xs sm:text-[10px] font-bold shadow-sm bg-primary text-primary-foreground">
                            {count}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)] mt-4">
          <div className="max-w-2xl mx-auto px-6 pb-32">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeCategory === 'property' && (
                  <PropertyClientFilters
                    onApply={(filters) => handleFilterApply('property', filters)}
                    activeCount={filterCounts.property}
                  />
                )}
                {activeCategory === 'moto' && (
                  <MotoClientFilters
                    onApply={(filters) => handleFilterApply('moto', filters)}
                    activeCount={filterCounts.moto}
                  />
                )}
                {activeCategory === 'bicycle' && (
                  <BicycleClientFilters
                    onApply={(filters) => handleFilterApply('bicycle', filters)}
                    activeCount={filterCounts.bicycle}
                  />
                )}
                {activeCategory === 'services' && (
                  <WorkerClientFilters
                    onApply={(filters) => handleFilterApply('services', filters)}
                    activeCount={filterCounts.services}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Apply Button - Gradient */}
        <div className="fixed bottom-24 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Button
              onClick={handleApplyFilters}
              className={cn(
                "w-full bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-xl shadow-primary/20 rounded-2xl h-14 sm:h-16 text-base sm:text-lg font-semibold touch-manipulation",
                totalActiveFilters === 0 && "opacity-50 cursor-not-allowed"
              )}
              size="lg"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Apply Filters {totalActiveFilters > 0 && `(${totalActiveFilters})`}
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
