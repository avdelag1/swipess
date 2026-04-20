import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bike, Briefcase, RotateCcw, Sparkles } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { MotoClientFilters } from '@/components/filters/MotoClientFilters';
import { BicycleClientFilters } from '@/components/filters/BicycleClientFilters';
import { WorkerClientFilters } from '@/components/filters/WorkerClientFilters';
import { useTheme } from '@/hooks/useTheme';
import { getCategoryTextColorClass } from '@/types/filters';
import { cn } from '@/lib/utils';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner' | 'admin';
  onApplyFilters: (filters: any) => void;
  currentFilters?: any;
}

type CategoryType = 'property' | 'motorcycle' | 'bicycle' | 'services';

const categoryBase: { id: CategoryType; name: string; icon: React.ElementType }[] = [
  { id: 'property', name: 'Property', icon: Home },
  { id: 'motorcycle', name: 'Motos', icon: MotorcycleIcon },
  { id: 'bicycle', name: 'Bikes', icon: Bike },
  { id: 'services', name: 'Workers', icon: Briefcase },
];

export function AdvancedFilters({ isOpen, onClose, userRole, onApplyFilters, currentFilters }: AdvancedFiltersProps) {
  const safeCurrentFilters = currentFilters ?? {};
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    const count = Object.entries(filters).filter(([_key, value]) => {
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
        overlayClassName="bg-black/60"
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          isMobile
            ? "w-full h-full max-w-full max-h-full inset-0 top-0 translate-x-0 translate-y-0 rounded-none border-0 bg-[#0A0A0C]"
            : "max-w-2xl h-[70vh] sm:h-[75vh] max-h-[600px] top-[50%] bg-[#0A0A0C]/95 backdrop-blur-3xl border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Header - Nexus High-Contrast */}
        <DialogHeader className={cn(
          "shrink-0 border-b border-white/5 transition-all text-white",
          "bg-black/60 pt-8 pb-4 px-8"
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

        {/* Category Tabs - Nexus Glass */}
        <div className={cn(
          "shrink-0 border-b border-white/5 bg-black/40 px-8 py-4"
        )}>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryType)} className="w-full">
            <TabsList className={cn(
              "w-full grid grid-cols-4 p-1.5 rounded-[1.4rem] bg-white/[0.03] border border-white/5",
              isMobile ? "h-16 gap-1" : "h-14"
            )}>
              {categoryBase.map((cat) => {
                const Icon = cat.icon;
                const count = filterCounts[cat.id];
                const categoryColor = getCategoryTextColorClass(cat.id, isDark);
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
                        activeCategory === cat.id ? categoryColor : 'text-muted-foreground',
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
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                {activeCategory === 'property' && (
                  userRole === 'owner' ? (
                    <DiscoveryFilters
                      category="property"
                      onApply={(filters) => handleApplyFilters('property', filters)}
                      initialFilters={categoryFilters.property}
                      activeCount={filterCounts.property}
                      hideApplyButton={true}
                    />
                  ) : (
                    <PropertyClientFilters
                      onApply={(filters) => handleApplyFilters('property', filters)}
                      initialFilters={categoryFilters.property}
                      activeCount={filterCounts.property}
                    />
                  )
                )}
                {activeCategory === 'motorcycle' && (
                  userRole === 'owner' ? (
                    <DiscoveryFilters
                      category="motorcycle"
                      onApply={(filters) => handleApplyFilters('motorcycle', filters)}
                      initialFilters={categoryFilters.motorcycle}
                      activeCount={filterCounts.motorcycle}
                      hideApplyButton={true}
                    />
                  ) : (
                    <MotoClientFilters
                      onApply={(filters) => handleApplyFilters('motorcycle', filters)}
                      initialFilters={categoryFilters.motorcycle}
                      activeCount={filterCounts.motorcycle}
                    />
                  )
                )}
                {activeCategory === 'bicycle' && (
                  userRole === 'owner' ? (
                    <DiscoveryFilters
                      category="bicycle"
                      onApply={(filters) => handleApplyFilters('bicycle', filters)}
                      initialFilters={categoryFilters.bicycle}
                      activeCount={filterCounts.bicycle}
                      hideApplyButton={true}
                    />
                  ) : (
                    <BicycleClientFilters
                      onApply={(filters) => handleApplyFilters('bicycle', filters)}
                      initialFilters={categoryFilters.bicycle}
                      activeCount={filterCounts.bicycle}
                    />
                  )
                )}
                {activeCategory === 'services' && (
                  userRole === 'owner' ? (
                    <DiscoveryFilters
                      category="service"
                      onApply={(filters) => handleApplyFilters('services', filters)}
                      initialFilters={categoryFilters.services}
                      activeCount={filterCounts.services}
                      hideApplyButton={true}
                    />
                  ) : (
                    <WorkerClientFilters
                      onApply={(filters) => handleApplyFilters('services', filters)}
                      initialFilters={categoryFilters.services}
                      activeCount={filterCounts.services}
                    />
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer - Nexus High-Contrast */}
        <DialogFooter className={cn(
          "shrink-0 flex gap-4 border-t border-white/5 bg-black px-8 py-6"
        )}>
          <Button
            variant="ghost"
            onClick={onClose}
            className={cn(
              "flex-1 h-12 rounded-[1.2rem] border border-white/10 text-white/60 hover:bg-white/5",
              isMobile && "text-base"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className={cn(
              "flex-1 h-12 rounded-[1.2rem] bg-white text-black font-black uppercase italic tracking-widest hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)]",
              isMobile && "text-base"
            )}
          >
            <Sparkles className="w-5 h-5 mr-3" />
            Engage Filters {totalActiveFilters > 0 && `(${totalActiveFilters})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default AdvancedFilters;
