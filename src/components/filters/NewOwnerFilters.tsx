import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, DollarSign, Calendar, Heart, Users, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * NEW OWNER FILTERS - Mobile-First Redesign
 *
 * Philosophy:
 * 1. Client INTENT first (what are they looking for?)
 * 2. Budget/timeframe (practical filters)
 * 3. Match quality (best matches first)
 *
 * UX Improvements:
 * - Bottom sheet (thumb-friendly)
 * - Large touch targets
 * - Clear visual hierarchy
 * - Focus on PRACTICAL filters owners care about
 * - No overwhelming options
 */

interface OwnerFilters {
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeframe?: 'immediate' | '1-month' | '3-months' | 'flexible' | 'any';
  clientGender?: 'all' | 'male' | 'female' | 'other';
  clientType?: 'all' | 'individual' | 'family' | 'business';
  matchScoreMin?: number;
  activeOnly?: boolean;
}

interface NewOwnerFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: OwnerFilters) => void;
  currentFilters?: OwnerFilters;
}

export function NewOwnerFilters({ open, onClose, onApply, currentFilters = {} }: NewOwnerFiltersProps) {
  const [filters, setFilters] = useState<OwnerFilters>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.budgetMin || filters.budgetMax) count++;
    if (filters.moveInTimeframe && filters.moveInTimeframe !== 'any') count++;
    if (filters.clientGender && filters.clientGender !== 'all') count++;
    if (filters.clientType && filters.clientType !== 'all') count++;
    if (filters.matchScoreMin && filters.matchScoreMin > 0) count++;
    if (filters.activeOnly) count++;
    return count;
  }, [filters]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b z-10 rounded-t-3xl">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Quick Filter</h2>
                  {activeFilterCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {activeFilterCount} active
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drag Handle */}
            <div className="flex justify-center pb-3">
              <div className="w-12 h-1 bg-muted-foreground/20 rounded-full" />
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6 space-y-8">

              {/* Budget Range */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Client Budget</label>
                </div>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={10000}
                    step={500}
                    value={[filters.budgetMin || 0, filters.budgetMax || 10000]}
                    onValueChange={([min, max]) => {
                      setFilters({ ...filters, budgetMin: min, budgetMax: max });
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${filters.budgetMin || 0}
                    </span>
                    <span className="text-muted-foreground">
                      ${filters.budgetMax || 10000}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Move-in Timeframe */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Move-in Timeframe</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'any' as const, label: 'Any' },
                    { value: 'immediate' as const, label: 'Immediate' },
                    { value: '1-month' as const, label: 'Within 1 Month' },
                    { value: '3-months' as const, label: 'Within 3 Months' },
                    { value: 'flexible' as const, label: 'Flexible' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, moveInTimeframe: option.value })}
                      className={cn(
                        "py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all text-left relative",
                        filters.moveInTimeframe === option.value || (!filters.moveInTimeframe && option.value === 'any')
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {option.label}
                      {(filters.moveInTimeframe === option.value || (!filters.moveInTimeframe && option.value === 'any')) && (
                        <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Gender */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Gender</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all' as const, label: 'All Genders', icon: Users },
                    { value: 'male' as const, label: 'Men', icon: User },
                    { value: 'female' as const, label: 'Women', icon: User },
                    { value: 'other' as const, label: 'Other', icon: User },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setFilters({ ...filters, clientGender: option.value })}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all flex items-center gap-2 relative",
                          filters.clientGender === option.value || (!filters.clientGender && option.value === 'all')
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {option.label}
                        {(filters.clientGender === option.value || (!filters.clientGender && option.value === 'all')) && (
                          <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Client Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Looking For</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all' as const, label: 'All Types' },
                    { value: 'individual' as const, label: 'Individual' },
                    { value: 'family' as const, label: 'Family' },
                    { value: 'business' as const, label: 'Business' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, clientType: option.value })}
                      className={cn(
                        "py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all relative",
                        filters.clientType === option.value || (!filters.clientType && option.value === 'all')
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {option.label}
                      {(filters.clientType === option.value || (!filters.clientType && option.value === 'all')) && (
                        <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Match Score */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Minimum Match Score</label>
                </div>
                <div className="space-y-4">
                  <Slider
                    min={0}
                    max={100}
                    step={10}
                    value={[filters.matchScoreMin || 0]}
                    onValueChange={([value]) => {
                      setFilters({ ...filters, matchScoreMin: value });
                    }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">0%</span>
                    <span className="font-medium text-primary">
                      {filters.matchScoreMin || 0}%
                    </span>
                    <span className="text-muted-foreground">100%</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Active Only Toggle */}
              <button
                onClick={() => setFilters({ ...filters, activeOnly: !filters.activeOnly })}
                className={cn(
                  "w-full py-4 px-4 rounded-lg border-2 font-medium text-sm transition-all flex items-center justify-between",
                  filters.activeOnly
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span>Show Active Clients Only</span>
                {filters.activeOnly && <Check className="h-5 w-5 text-primary" />}
              </button>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t p-4 flex gap-3">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-1"
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
            <Button
              onClick={handleApply}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-primary-foreground text-primary">
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
