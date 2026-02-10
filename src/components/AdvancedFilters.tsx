
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bike, CircleDot, Briefcase, RotateCcw, Sparkles } from 'lucide-react';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { MotoClientFilters } from '@/components/filters/MotoClientFilters';
import { BicycleClientFilters } from '@/components/filters/BicycleClientFilters';
import { WorkerClientFilters } from '@/components/filters/WorkerClientFilters';
import { cn } from '@/lib/utils';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner' | 'admin';
  onApplyFilters: (filters: any) => void;
  currentFilters?: any;
}

type CategoryType = 'property' | 'motorcycle' | 'bicycle' | 'services';

const categories: { id: CategoryType; name: string; icon: React.ElementType; color: string }[] = [
  { id: 'property', name: 'Property', icon: Home, color: 'text-emerald-500' },
  { id: 'motorcycle', name: 'Motos', icon: CircleDot, color: 'text-orange-500' },
  { id: 'bicycle', name: 'Bikes', icon: Bike, color: 'text-purple-500' },
  { id: 'services', name: 'Workers', icon: Briefcase, color: 'text-pink-500' },
];

export function AdvancedFilters({ isOpen, onClose, userRole, onApplyFilters, currentFilters }: AdvancedFiltersProps) {
  const safeCurrentFilters = currentFilters ?? {};
  const [activeCategory, setActiveCategory] = useState<CategoryType>('property');
  const [filterCounts, setFilterCounts] = useState<Record<CategoryType, number>>({
    property: 0,
    motorcycle: 0,
    bicycle: 0,
    services: 0,
  });
  const [categoryFilters, setCategoryFilters] = useState<Record<CategoryType, any>>({
    property: safeCurrentFilters,
    motorcycle: {},
    bicycle: {},
    services: {},
  });

  // Detect if we're on mobile/tablet for fullscreen mode
  const isMobile = window.innerWidth < 768;

  const handleApplyFilters = (category: CategoryType, filters: any) => {
    // Count active filters
    const count = Object.entries(filters).filter(([key, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value !== '' && value !== 'any';
      if (typeof value === 'number') return value > 0;
      return false;
    }).length;

    setFilterCounts(prev => ({ ...prev, [category]: count }));
    setCategoryFilters(prev => ({ ...prev, [category]: filters }));
  };

  const handleApply = () => {
    // FIX: Combine filters from ALL categories, not just active one
    // This prevents filters from being lost when switching tabs
    const allFilters: any = {
      activeCategory,
      filterCounts,
      // Collect all category-specific filters
      categoryFilters: categoryFilters,
    };

    // Merge non-empty filters from all categories into the root level
    // This maintains backwards compatibility with existing filter consumers
    Object.entries(categoryFilters).forEach(([category, filters]) => {
      if (filters && Object.keys(filters).length > 0) {
        // Add category-prefixed keys for disambiguation
        Object.entries(filters).forEach(([key, value]) => {
          // Skip empty/default values
          if (
            (Array.isArray(value) && value.length === 0) ||
            (typeof value === 'string' && (value === '' || value === 'any')) ||
            value === null ||
            value === undefined
          ) {
            return;
          }

          // Store with category prefix to avoid collisions
          // e.g., "property_priceMin", "vehicle_seats"
          const prefixedKey = `${category}_${key}`;
          allFilters[prefixedKey] = value;
        });
      }
    });

    onApplyFilters(allFilters);
    onClose();
  };

  const handleReset = () => {
    setFilterCounts({
      property: 0,
      motorcycle: 0,
      bicycle: 0,
      services: 0,
    });
    setCategoryFilters({
      property: {},
      motorcycle: {},
      bicycle: {},
      services: {},
    });
  };

  const totalActiveFilters = Object.values(filterCounts).reduce((a, b) => a + b, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName={isMobile ? "bg-black/50" : "bg-transparent backdrop-blur-none"}
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          isMobile
            ? "w-full h-full max-w-full max-h-full inset-0 top-0 translate-x-0 translate-y-0 rounded-none border-0"
            : "max-w-2xl h-[70vh] sm:h-[75vh] max-h-[600px] top-[50%]"
        )}
      >
        {/* Header - Larger on mobile */}
        <DialogHeader className={cn(
          "shrink-0 border-b bg-gradient-to-r from-primary/5 via-background to-background",
          isMobile ? "px-6 pt-6 pb-4" : "px-4 sm:px-6 pt-4 sm:pt-6 pb-3"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-xl bg-primary/10",
                isMobile ? "p-3" : "p-2"
              )}>
                <Sparkles className={cn(
                  "text-primary",
                  isMobile ? "w-6 h-6" : "w-5 h-5"
                )} />
              </div>
              <div>
                <DialogTitle className={cn(
                  "font-bold",
                  isMobile ? "text-2xl" : "text-lg sm:text-xl"
                )}>
                  {userRole === 'owner' ? 'Find Clients' : 'Filter Listings'}
                </DialogTitle>
                <p className={cn(
                  "text-muted-foreground mt-0.5",
                  isMobile ? "text-sm" : "text-xs sm:text-sm"
                )}>
                  {userRole === 'owner'
                    ? 'Customize your ideal client profile'
                    : 'Find exactly what you\'re looking for'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={handleReset}
              className={cn(
                "text-muted-foreground hover:text-foreground gap-1.5",
                isMobile ? "h-10 px-3" : "h-8"
              )}
            >
              <RotateCcw className={cn(isMobile ? "w-4 h-4" : "w-3.5 h-3.5")} />
              <span className={isMobile ? "inline" : "hidden sm:inline"}>Reset</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Category Tabs - Larger touch targets on mobile */}
        <div className={cn(
          "shrink-0 border-b bg-background/50",
          isMobile ? "px-6 py-4" : "px-4 sm:px-6 py-3"
        )}>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryType)} className="w-full">
            <TabsList className={cn(
              "w-full grid grid-cols-4 p-1 bg-muted/50 rounded-xl",
              isMobile ? "h-16 gap-1" : "h-12"
            )}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const count = filterCounts[cat.id];
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className={cn(
                      "relative rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200",
                      isMobile && "min-h-[56px]" // Larger touch target
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <Icon className={cn(
                        activeCategory === cat.id ? cat.color : 'text-muted-foreground',
                        isMobile ? "w-5 h-5" : "w-4 h-4"
                      )} />
                      <span className={cn(
                        "font-medium truncate max-w-full",
                        isMobile ? "text-xs" : "text-[10px] sm:text-xs"
                      )}>{cat.name}</span>
                    </div>
                    <AnimatePresence>
                      {count > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge className={cn(
                            "rounded-full px-1 font-bold shadow-sm bg-primary text-primary-foreground",
                            isMobile ? "h-5 min-w-[20px] text-xs" : "h-4 min-w-[16px] text-[10px]"
                          )}>
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

        {/* Filter Content - More padding on mobile */}
        <ScrollArea className="flex-1 min-h-0">
          <div className={cn(isMobile ? "p-6 pb-8" : "p-4 sm:p-6")}>
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
                    onApply={(filters) => handleApplyFilters('property', filters)}
                    initialFilters={categoryFilters.property}
                    activeCount={filterCounts.property}
                  />
                )}
                {activeCategory === 'motorcycle' && (
                  <MotoClientFilters
                    onApply={(filters) => handleApplyFilters('motorcycle', filters)}
                    initialFilters={categoryFilters.motorcycle}
                    activeCount={filterCounts.motorcycle}
                  />
                )}
                {activeCategory === 'bicycle' && (
                  <BicycleClientFilters
                    onApply={(filters) => handleApplyFilters('bicycle', filters)}
                    initialFilters={categoryFilters.bicycle}
                    activeCount={filterCounts.bicycle}
                  />
                )}
                {activeCategory === 'services' && (
                  <WorkerClientFilters
                    onApply={(filters) => handleApplyFilters('services', filters)}
                    initialFilters={categoryFilters.services}
                    activeCount={filterCounts.services}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer - Larger buttons on mobile */}
        <DialogFooter className={cn(
          "shrink-0 flex gap-2 border-t bg-gradient-to-t from-background to-background/80",
          isMobile ? "p-6" : "p-4 sm:p-6"
        )}>
          <Button
            variant="outline"
            onClick={onClose}
            className={cn(
              "flex-1",
              isMobile && "h-12 text-base"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className={cn(
              "flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold",
              isMobile && "h-12 text-base"
            )}
          >
            <Sparkles className={cn(isMobile ? "w-5 h-5 mr-2" : "w-4 h-4 mr-2")} />
            Apply {totalActiveFilters > 0 && `(${totalActiveFilters})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
