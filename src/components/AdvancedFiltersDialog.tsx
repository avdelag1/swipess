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
import useAppTheme from '@/hooks/useAppTheme';
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
  const { theme } = useAppTheme();
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
            ? "w-full h-full max-w-full max-h-full inset-0 top-0 translate-x-0 translate-y-0 rounded-none border-0 bg-background"
            : "max-w-2xl w-[95vw] h-[85vh] max-h-[800px] top-[50%] bg-background border-border shadow-[0_30px_90px_rgba(0,0,0,0.6)] rounded-[3rem]"
        )}
      >
        {/* Header - Theme Aware */}
        <DialogHeader className={cn(
          "shrink-0 border-b border-border/5 transition-all text-foreground",
          "bg-background/80 backdrop-blur-xl pt-10 pb-6 px-10"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                isDark ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" : "bg-slate-900 text-white"
              )}>
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className={cn(
                  "font-black uppercase italic tracking-tight leading-none",
                  isMobile ? "text-3xl" : "text-2xl"
                )}>
                  Sector <span className="text-primary">Calibration</span>
                </DialogTitle>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mt-1.5",
                  isDark ? "text-white" : "text-slate-900"
                )}>
                  {userRole === 'owner' ? 'Discovery Parameters' : 'Nexus Preferences'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-muted/20 hover:bg-muted/40 transition-all active:scale-90"
              title="Reset Calibration"
            >
              <RotateCcw className="w-4 h-4 opacity-60" />
            </Button>
          </div>
        </DialogHeader>

        <div className={cn(
          "shrink-0 bg-muted/10 px-10 py-5"
        )}>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryType)} className="w-full">
            <TabsList className={cn(
              "w-full grid grid-cols-4 p-1.5 rounded-[2rem] bg-muted/40 border border-border/5 backdrop-blur-xl h-16"
            )}>
              {categoryBase.map((cat) => {
                const Icon = cat.icon;
                const count = filterCounts[cat.id];
                const categoryColor = getCategoryTextColorClass(cat.id, isDark);
                return (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="relative rounded-[1.4rem] data-[state=active]:bg-background data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon className={cn(
                        activeCategory === cat.id ? categoryColor : 'opacity-30',
                        "w-5 h-5"
                      )} />
                      <span className="text-[9px] font-black uppercase tracking-widest truncate">{cat.name}</span>
                    </div>
                    <AnimatePresence>
                      {count > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge className="h-5 min-w-[20px] rounded-full px-1 font-black bg-primary text-white text-[10px] shadow-lg">
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

        {/* Footer - Theme Aware */}
        <DialogFooter className={cn(
          "shrink-0 flex gap-4 border-t border-border bg-background px-8 py-6"
        )}>
          <Button
            variant="ghost"
            onClick={onClose}
            className={cn(
              "flex-1 h-12 rounded-[1.2rem] border border-border text-foreground hover:bg-accent",
              isMobile && "text-base"
            )}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className={cn(
              "flex-1 h-12 rounded-[1.2rem] bg-primary text-primary-foreground font-black uppercase italic tracking-widest hover:brightness-110 shadow-lg",
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


