import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, MapPin, DollarSign, Home, Car, Ship, Bike, Wrench, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

/**
 * NEW CLIENT FILTERS - Mobile-First Redesign
 *
 * Philosophy:
 * 1. Category FIRST (what are you looking for?)
 * 2. Then show ONLY relevant filters for that category
 * 3. Visual chips for active filters
 * 4. One-tap clear
 *
 * UX Improvements:
 * - Bottom sheet (thumb-friendly)
 * - Large touch targets
 * - Clear visual hierarchy
 * - Instant feedback
 * - No overwhelming options
 */

interface ClientFilters {
  category?: QuickFilterCategory;
  priceMin?: number;
  priceMax?: number;
  location?: string;
  distance?: number;
  // Property specific
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  // Vehicle specific
  seats?: number;
  transmission?: 'automatic' | 'manual' | 'any';
  fuelType?: 'gas' | 'electric' | 'hybrid' | 'any';
  // Motorcycle specific
  engineSize?: string;
  motorcycleType?: string;
}

interface NewClientFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: ClientFilters) => void;
  currentFilters?: ClientFilters;
}

const categories: { id: QuickFilterCategory; label: string; icon: typeof Home; color: string }[] = [
  { id: 'property', label: 'Property', icon: Home, color: 'bg-blue-500' },
  { id: 'motorcycle', label: 'Motorcycle', icon: Bike, color: 'bg-slate-500' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'bg-emerald-500' },
  { id: 'services', label: 'Services', icon: Wrench, color: 'bg-purple-500' },
];

const amenityOptions = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'petsAllowed', label: 'Pets Allowed' },
  { id: 'parking', label: 'Parking' },
  { id: 'pool', label: 'Pool' },
  { id: 'gym', label: 'Gym' },
  { id: 'wifi', label: 'Wi-Fi' },
];

export function NewClientFilters({ open, onClose, onApply, currentFilters = {} }: NewClientFiltersProps) {
  const [filters, setFilters] = useState<ClientFilters>(currentFilters);

  const activeCategory = categories.find(c => c.id === filters.category);
  const activeAmenities = new Set(filters.amenities || []);

  const handleAmenityToggle = (amenity: string) => {
    const newAmenities = new Set(filters.amenities || []);
    if (newAmenities.has(amenity)) {
      newAmenities.delete(amenity);
    } else {
      newAmenities.add(amenity);
    }
    setFilters({ ...filters, amenities: Array.from(newAmenities) });
  };
  
  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ category: filters.category }); // Keep category, clear rest
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.location) count++;
    if (filters.bedrooms) count++;
    if (filters.bathrooms) count++;
    if (filters.amenities && filters.amenities.length > 0) count += filters.amenities.length;
    if (filters.seats) count++;
    if (filters.transmission && filters.transmission !== 'any') count++;
    return count;
  }, [filters]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 z-50 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl border-t-2 border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b-2 border-border z-10 rounded-t-3xl">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2 shadow-sm">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Quick Filter</h2>
                  {activeFilterCount > 0 && (
                    <p className="text-xs font-medium text-primary">
                      {activeFilterCount} active
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted/80">
                <X className="h-5 w-5 text-foreground" />
              </Button>
            </div>

            {/* Drag Handle */}
            <div className="flex justify-center pb-3">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6 space-y-8">

              {/* Category Selection */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">What are you looking for?</label>
                <div className="grid grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filters.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setFilters({ ...filters, category: cat.id })}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all shadow-sm",
                          isActive
                            ? "border-primary bg-primary/15 shadow-primary/20"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5 shadow-sm">
                            <Check className="h-3 w-3 text-primary-foreground font-bold" />
                          </div>
                        )}
                        <div className={cn("rounded-full p-3 shadow-md", cat.color)}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className={cn("text-xs font-semibold", isActive ? "text-foreground" : "text-foreground")}>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <label className="text-sm font-bold text-foreground">Price Range</label>
                </div>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={10000}
                    step={100}
                    value={[filters.priceMin || 0, filters.priceMax || 10000]}
                    onValueChange={([min, max]) => {
                      setFilters({ ...filters, priceMin: min, priceMax: max });
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${filters.priceMin || 0}
                    </span>
                    <span className="text-muted-foreground">
                      ${filters.priceMax || 10000}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category-Specific Filters */}
              {filters.category === 'property' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-foreground">Property Details</label>

                    {/* Bedrooms */}
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Bedrooms</span>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => setFilters({ ...filters, bedrooms: num })}
                            className={cn(
                              "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all shadow-sm",
                              filters.bedrooms === num
                                ? "border-primary bg-primary text-primary-foreground shadow-primary/30"
                                : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                            )}
                          >
                            {num === 5 ? '5+' : num === 0 ? 'Any' : num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bathrooms */}
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Bathrooms</span>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => setFilters({ ...filters, bathrooms: num })}
                            className={cn(
                              "flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all shadow-sm",
                              filters.bathrooms === num
                                ? "border-primary bg-primary text-primary-foreground shadow-primary/30"
                                : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                            )}
                          >
                            {num === 4 ? '4+' : num === 0 ? 'Any' : num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-2">
                      <span className="text-sm font-semibold text-foreground">Amenities</span>
                      <div className="flex flex-wrap gap-2">
                        {amenityOptions.map((amenity) => {
                          const isActive = activeAmenities.has(amenity.id);
                          return (
                            <button
                              key={amenity.id}
                              onClick={() => handleAmenityToggle(amenity.id)}
                              className={cn(
                                "py-2 px-4 rounded-full border-2 font-semibold text-sm transition-all flex items-center gap-2 shadow-sm",
                                isActive
                                  ? "border-primary bg-primary/15 text-primary shadow-primary/20"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                              )}
                            >
                              {amenity.label}
                              {isActive && <X className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {filters.category === 'motorcycle' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Motorcycle Details</label>
                    <p className="text-sm text-muted-foreground">Motorcycle-specific filters coming soon</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t-2 border-border p-4 flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1 font-bold border-2 hover:bg-muted/80 text-foreground"
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/95 text-primary-foreground shadow-lg border-2 border-primary"
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-primary-foreground text-primary font-bold">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
