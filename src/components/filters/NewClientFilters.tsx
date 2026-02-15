import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, SlidersHorizontal, DollarSign, Home, Bike, Wrench, Check,
  ChevronDown, Zap, Droplets, Car, Fuel, Gauge, Shield, Wifi,
  ParkingCircle, Waves, Dumbbell, Sofa, PawPrint, Building2, Castle,
  Hotel, Trees
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

/**
 * CINEMATIC CLIENT FILTERS — Premium Bottom Sheet
 *
 * Features:
 * - Glassmorphic bottom sheet with blur backdrop
 * - Segmented controls (Rent | Buy | Both)
 * - Expandable/collapsible filter sections
 * - Category-specific deep filters
 * - Animated pill toggles for amenities
 * - Sticky apply button with active count
 * - 32px rounded corners, premium shadows
 */

interface ClientFilters {
  category?: QuickFilterCategory;
  listingType?: 'rent' | 'sale' | 'both';
  priceMin?: number;
  priceMax?: number;
  // Property
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  amenities?: string[];
  // Vehicle
  condition?: 'new' | 'used' | 'any';
  transmission?: 'automatic' | 'manual' | 'any';
  fuelType?: string;
  yearMin?: number;
  yearMax?: number;
  brand?: string;
  // Motorcycle
  engineSize?: string;
  motorcycleType?: string;
  // Bicycle
  bicycleType?: string;
  electricAssist?: boolean;
  // Services
  experienceLevel?: string;
  verifiedOnly?: boolean;
  petsAllowed?: boolean;
}

interface NewClientFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: ClientFilters) => void;
  currentFilters?: ClientFilters;
}

// Category configs with brand-aligned colors
const categories: { id: QuickFilterCategory; label: string; icon: typeof Home; emoji: string }[] = [
  { id: 'property', label: 'Property', icon: Home, emoji: '🏠' },
  { id: 'motorcycle', label: 'Moto', icon: Bike, emoji: '🏍️' },
  { id: 'bicycle', label: 'Bicycle', icon: Bike, emoji: '🚴' },
  { id: 'services', label: 'Services', icon: Wrench, emoji: '🛠️' },
];

const propertyTypes = [
  { id: 'apartment', label: 'Apartment', icon: Building2 },
  { id: 'house', label: 'House', icon: Home },
  { id: 'penthouse', label: 'Penthouse', icon: Castle },
  { id: 'villa', label: 'Villa', icon: Hotel },
  { id: 'room', label: 'Room', icon: Sofa },
  { id: 'land', label: 'Land', icon: Trees },
];

const amenityOptions = [
  { id: 'furnished', label: 'Furnished', icon: Sofa },
  { id: 'petsAllowed', label: 'Pets OK', icon: PawPrint },
  { id: 'parking', label: 'Parking', icon: ParkingCircle },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'ac', label: 'A/C', icon: Droplets },
];

const motorcycleTypes = [
  { id: 'sport', label: 'Sport' },
  { id: 'cruiser', label: 'Cruiser' },
  { id: 'touring', label: 'Touring' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'scooter', label: 'Scooter' },
  { id: 'naked', label: 'Naked' },
];

const bicycleTypes = [
  { id: 'road', label: 'Road' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'hybrid', label: 'Hybrid' },
  { id: 'electric', label: 'E-Bike' },
  { id: 'bmx', label: 'BMX' },
  { id: 'folding', label: 'Folding' },
];

const experienceLevels = [
  { id: 'any', label: 'Any' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
];

// Expandable section component
function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof Home;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Segmented control component
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
      {options.map((opt) => {
        const isActive = value === opt.id || (!value && opt.id === options[0].id);
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Pill toggle
function PillToggle({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: typeof Home;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "py-2 px-3.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border",
        isActive
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/30"
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
      {isActive && <X className="h-3 w-3 ml-0.5" />}
    </motion.button>
  );
}

// Number selector (bedrooms/bathrooms)
function NumberSelector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border",
              value === opt.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/40"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NewClientFilters({ open, onClose, onApply, currentFilters = {} }: NewClientFiltersProps) {
  const [filters, setFilters] = useState<ClientFilters>(currentFilters);
  const activeAmenities = new Set(filters.amenities || []);

  const handleAmenityToggle = useCallback((amenity: string) => {
    setFilters(prev => {
      const set = new Set(prev.amenities || []);
      if (set.has(amenity)) set.delete(amenity); else set.add(amenity);
      return { ...prev, amenities: Array.from(set) };
    });
  }, []);

  const handleApply = () => { onApply(filters); onClose(); };
  const handleReset = () => { setFilters({ category: filters.category }); };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.listingType && filters.listingType !== 'both') c++;
    if (filters.priceMin || filters.priceMax) c++;
    if (filters.propertyType) c++;
    if (filters.bedrooms) c++;
    if (filters.bathrooms) c++;
    if (filters.amenities?.length) c += filters.amenities.length;
    if (filters.condition && filters.condition !== 'any') c++;
    if (filters.transmission && filters.transmission !== 'any') c++;
    if (filters.fuelType) c++;
    if (filters.motorcycleType) c++;
    if (filters.bicycleType) c++;
    if (filters.electricAssist) c++;
    if (filters.experienceLevel && filters.experienceLevel !== 'any') c++;
    if (filters.verifiedOnly) c++;
    return c;
  }, [filters]);

  if (!open) return null;

  const cat = filters.category;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[10001] backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_60px_rgba(0,0,0,0.3)] border-t border-border/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2.5">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Filters</h2>
                {activeFilterCount > 0 && (
                  <p className="text-[11px] text-primary font-medium">
                    {activeFilterCount} active
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground h-8">
                  Reset
                </Button>
              )}
              <button
                onClick={onClose}
                className="rounded-xl bg-muted/50 p-2 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="max-h-[65vh]">
            <div className="px-5 pb-28 space-y-4">

              {/* Category Selection — Color-coded cards */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</span>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((c) => {
                    const isActive = filters.category === c.id;
                    return (
                      <motion.button
                        key={c.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => setFilters({ ...filters, category: c.id })}
                        className={cn(
                          "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200",
                          isActive
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/40 bg-card/40 hover:border-primary/30"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5"
                          >
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </motion.div>
                        )}
                        <span className="text-lg">{c.emoji}</span>
                        <span className="text-[10px] font-semibold text-foreground">{c.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Transaction Type — Segmented Control */}
              {(cat === 'property' || cat === 'motorcycle' || cat === 'bicycle') && (
                <div className="space-y-2.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction</span>
                  <SegmentedControl
                    options={[
                      { id: 'both' as const, label: 'All' },
                      { id: 'rent' as const, label: 'Rent' },
                      { id: 'sale' as const, label: 'Buy' },
                    ]}
                    value={filters.listingType}
                    onChange={(v) => setFilters({ ...filters, listingType: v })}
                  />
                </div>
              )}

              {/* Price Range */}
              <FilterSection title="Price Range" icon={DollarSign} defaultOpen>
                <Slider
                  min={0}
                  max={cat === 'services' ? 5000 : 50000}
                  step={cat === 'services' ? 50 : 500}
                  value={[filters.priceMin || 0, filters.priceMax || (cat === 'services' ? 5000 : 50000)]}
                  onValueChange={([min, max]) => setFilters({ ...filters, priceMin: min, priceMax: max })}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    ${filters.priceMin || 0}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    ${filters.priceMax || (cat === 'services' ? 5000 : 50000)}
                  </span>
                </div>
              </FilterSection>

              {/* ═══ PROPERTY FILTERS ═══ */}
              {cat === 'property' && (
                <>
                  <FilterSection title="Property Type" icon={Building2} defaultOpen>
                    <div className="grid grid-cols-3 gap-2">
                      {propertyTypes.map((pt) => {
                        const Icon = pt.icon;
                        const isActive = filters.propertyType === pt.id;
                        return (
                          <motion.button
                            key={pt.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFilters({ ...filters, propertyType: isActive ? undefined : pt.id })}
                            className={cn(
                              "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all",
                              isActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/40 text-muted-foreground hover:border-primary/30"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {pt.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </FilterSection>

                  <FilterSection title="Rooms" icon={Home}>
                    <NumberSelector
                      label="Bedrooms"
                      value={filters.bedrooms}
                      onChange={(v) => setFilters({ ...filters, bedrooms: v })}
                      options={[
                        { value: 0, label: 'Any' },
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 3, label: '3' },
                        { value: 4, label: '4' },
                        { value: 5, label: '5+' },
                      ]}
                    />
                    <NumberSelector
                      label="Bathrooms"
                      value={filters.bathrooms}
                      onChange={(v) => setFilters({ ...filters, bathrooms: v })}
                      options={[
                        { value: 0, label: 'Any' },
                        { value: 1, label: '1' },
                        { value: 2, label: '2' },
                        { value: 3, label: '3' },
                        { value: 4, label: '4+' },
                      ]}
                    />
                  </FilterSection>

                  <FilterSection title="Amenities" icon={Zap}>
                    <div className="flex flex-wrap gap-2">
                      {amenityOptions.map((a) => (
                        <PillToggle
                          key={a.id}
                          label={a.label}
                          icon={a.icon}
                          isActive={activeAmenities.has(a.id)}
                          onClick={() => handleAmenityToggle(a.id)}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </>
              )}

              {/* ═══ MOTORCYCLE FILTERS ═══ */}
              {cat === 'motorcycle' && (
                <>
                  <FilterSection title="Motorcycle Type" icon={Bike} defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {motorcycleTypes.map((mt) => (
                        <PillToggle
                          key={mt.id}
                          label={mt.label}
                          isActive={filters.motorcycleType === mt.id}
                          onClick={() => setFilters({ ...filters, motorcycleType: filters.motorcycleType === mt.id ? undefined : mt.id })}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Condition" icon={Shield}>
                    <SegmentedControl
                      options={[
                        { id: 'any' as const, label: 'Any' },
                        { id: 'new' as const, label: 'New' },
                        { id: 'used' as const, label: 'Used' },
                      ]}
                      value={filters.condition}
                      onChange={(v) => setFilters({ ...filters, condition: v })}
                    />
                  </FilterSection>

                  <FilterSection title="Transmission" icon={Gauge}>
                    <SegmentedControl
                      options={[
                        { id: 'any' as const, label: 'Any' },
                        { id: 'manual' as const, label: 'Manual' },
                        { id: 'automatic' as const, label: 'Auto' },
                      ]}
                      value={filters.transmission}
                      onChange={(v) => setFilters({ ...filters, transmission: v })}
                    />
                  </FilterSection>

                  <FilterSection title="Fuel Type" icon={Fuel}>
                    <div className="flex flex-wrap gap-2">
                      {['Gasoline', 'Electric', 'Hybrid'].map((f) => (
                        <PillToggle
                          key={f}
                          label={f}
                          isActive={filters.fuelType === f.toLowerCase()}
                          onClick={() => setFilters({ ...filters, fuelType: filters.fuelType === f.toLowerCase() ? undefined : f.toLowerCase() })}
                        />
                      ))}
                    </div>
                  </FilterSection>
                </>
              )}

              {/* ═══ BICYCLE FILTERS ═══ */}
              {cat === 'bicycle' && (
                <>
                  <FilterSection title="Bicycle Type" icon={Bike} defaultOpen>
                    <div className="flex flex-wrap gap-2">
                      {bicycleTypes.map((bt) => (
                        <PillToggle
                          key={bt.id}
                          label={bt.label}
                          isActive={filters.bicycleType === bt.id}
                          onClick={() => setFilters({ ...filters, bicycleType: filters.bicycleType === bt.id ? undefined : bt.id })}
                        />
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Features" icon={Zap}>
                    <PillToggle
                      label="Electric Assist"
                      icon={Zap}
                      isActive={!!filters.electricAssist}
                      onClick={() => setFilters({ ...filters, electricAssist: !filters.electricAssist })}
                    />
                  </FilterSection>

                  <FilterSection title="Condition" icon={Shield}>
                    <SegmentedControl
                      options={[
                        { id: 'any' as const, label: 'Any' },
                        { id: 'new' as const, label: 'New' },
                        { id: 'used' as const, label: 'Used' },
                      ]}
                      value={filters.condition}
                      onChange={(v) => setFilters({ ...filters, condition: v })}
                    />
                  </FilterSection>
                </>
              )}

              {/* ═══ SERVICES FILTERS ═══ */}
              {cat === 'services' && (
                <>
                  <FilterSection title="Experience Level" icon={Shield} defaultOpen>
                    <SegmentedControl
                      options={experienceLevels.map(e => ({ id: e.id, label: e.label }))}
                      value={filters.experienceLevel}
                      onChange={(v) => setFilters({ ...filters, experienceLevel: v })}
                    />
                  </FilterSection>

                  <FilterSection title="Preferences" icon={Zap}>
                    <div className="space-y-2">
                      <PillToggle
                        label="Verified Only"
                        icon={Shield}
                        isActive={!!filters.verifiedOnly}
                        onClick={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
                      />
                    </div>
                  </FilterSection>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Sticky Apply Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleApply}
                className="w-full h-14 rounded-2xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              >
                Apply Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary-foreground/20 text-primary-foreground border-none text-xs px-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
