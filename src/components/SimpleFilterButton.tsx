import { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewClientFilters } from './filters/NewClientFilters';
import { NewOwnerFilters } from './filters/NewOwnerFilters';
import { FilterChips } from './FilterChips';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

/**
 * SIMPLE FILTER BUTTON
 *
 * Single button that opens the appropriate filter UI
 * - Shows filter count badge
 * - Displays active filter chips below
 * - Handles both client and owner modes
 */

interface ClientFilters {
  category?: QuickFilterCategory;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  seats?: number;
  transmission?: 'automatic' | 'manual' | 'any';
}

interface OwnerFilters {
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeframe?: 'immediate' | '1-month' | '3-months' | 'flexible' | 'any';
  clientGender?: 'all' | 'male' | 'female' | 'other';
  clientType?: 'all' | 'individual' | 'family' | 'business';
  matchScoreMin?: number;
  activeOnly?: boolean;
}

interface SimpleFilterButtonProps {
  mode: 'client' | 'owner';
  onFiltersChange: (filters: any) => void;
  currentFilters?: any;
  className?: string;
}

export function SimpleFilterButton({
  mode,
  onFiltersChange,
  currentFilters = {},
  className
}: SimpleFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    if (mode === 'client') {
      const filters = currentFilters as ClientFilters;
      let count = 0;
      if (filters.category) count++;
      if (filters.priceMin || filters.priceMax) count++;
      if (filters.bedrooms) count++;
      if (filters.bathrooms) count++;
      if (filters.furnished) count++;
      if (filters.petsAllowed) count++;
      if (filters.seats) count++;
      if (filters.transmission && filters.transmission !== 'any') count++;
      return count;
    } else {
      const filters = currentFilters as OwnerFilters;
      let count = 0;
      if (filters.budgetMin || filters.budgetMax) count++;
      if (filters.moveInTimeframe && filters.moveInTimeframe !== 'any') count++;
      if (filters.clientGender && filters.clientGender !== 'all') count++;
      if (filters.clientType && filters.clientType !== 'all') count++;
      if (filters.matchScoreMin && filters.matchScoreMin > 0) count++;
      if (filters.activeOnly) count++;
      return count;
    }
  }, [currentFilters, mode]);

  // Generate filter chips
  const filterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; value: string }> = [];

    if (mode === 'client') {
      const filters = currentFilters as ClientFilters;
      if (filters.category) {
        chips.push({ id: 'category', label: 'Category', value: filters.category });
      }
      if (filters.priceMin || filters.priceMax) {
        chips.push({
          id: 'price',
          label: 'Price',
          value: `$${filters.priceMin || 0} - $${filters.priceMax || 10000}`
        });
      }
      if (filters.bedrooms) {
        chips.push({ id: 'bedrooms', label: 'Bedrooms', value: String(filters.bedrooms) });
      }
      if (filters.bathrooms) {
        chips.push({ id: 'bathrooms', label: 'Bathrooms', value: String(filters.bathrooms) });
      }
      if (filters.furnished) {
        chips.push({ id: 'furnished', label: 'Furnished', value: '' });
      }
      if (filters.petsAllowed) {
        chips.push({ id: 'petsAllowed', label: 'Pets OK', value: '' });
      }
    } else {
      const filters = currentFilters as OwnerFilters;
      if (filters.budgetMin || filters.budgetMax) {
        chips.push({
          id: 'budget',
          label: 'Budget',
          value: `$${filters.budgetMin || 0} - $${filters.budgetMax || 10000}`
        });
      }
      if (filters.moveInTimeframe && filters.moveInTimeframe !== 'any') {
        chips.push({ id: 'timeframe', label: 'Move-in', value: filters.moveInTimeframe });
      }
      if (filters.clientGender && filters.clientGender !== 'all') {
        chips.push({ id: 'gender', label: 'Gender', value: filters.clientGender });
      }
      if (filters.clientType && filters.clientType !== 'all') {
        chips.push({ id: 'clientType', label: 'Type', value: filters.clientType });
      }
      if (filters.matchScoreMin && filters.matchScoreMin > 0) {
        chips.push({ id: 'matchScore', label: 'Match', value: `${filters.matchScoreMin}%+` });
      }
      if (filters.activeOnly) {
        chips.push({ id: 'activeOnly', label: 'Active Only', value: '' });
      }
    }

    return chips;
  }, [currentFilters, mode]);

  const handleRemoveChip = (chipId: string) => {
    const newFilters = { ...currentFilters };
    delete newFilters[chipId];

    // Handle special cases
    if (chipId === 'price') {
      delete newFilters.priceMin;
      delete newFilters.priceMax;
    }
    if (chipId === 'budget') {
      delete newFilters.budgetMin;
      delete newFilters.budgetMax;
    }

    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-2">
      {/* Filter Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative gap-2",
          activeFilterCount > 0 && "border-primary bg-primary/5",
          className
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Quick Filter</span>
        {activeFilterCount > 0 && (
          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      {/* Active Filter Chips */}
      {filterChips.length > 0 && (
        <FilterChips
          chips={filterChips}
          onRemove={handleRemoveChip}
          onClearAll={handleClearAll}
        />
      )}

      {/* Filter Dialog */}
      {mode === 'client' ? (
        <NewClientFilters
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onApply={onFiltersChange}
          currentFilters={currentFilters}
        />
      ) : (
        <NewOwnerFilters
          open={isOpen}
          onClose={() => setIsOpen(false)}
          onApply={onFiltersChange}
          currentFilters={currentFilters}
        />
      )}
    </div>
  );
}
