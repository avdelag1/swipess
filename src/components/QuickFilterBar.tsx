import { memo, useCallback, useState, useRef, useEffect } from 'react';

import { Home, Bike, RotateCcw, Briefcase, Users, User, ChevronDown, Wrench, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';
import { getCategoryColorClass } from '@/types/filters';

// Re-export from CascadeFilterButton for backwards compatibility
export { CascadeFilterButton } from './CascadeFilterButton';

// Re-export unified types for backwards compatibility
export type { QuickFilterCategory, QuickFilters } from '@/types/filters';

// Legacy type aliases for backwards compatibility
export type QuickFilterListingType = 'rent' | 'sale' | 'both';
export type OwnerClientGender = ClientGender;
export type OwnerClientType = ClientType;

interface QuickFilterBarProps {
  filters: QuickFilters;
  onChange: (filters: QuickFilters) => void;
  className?: string;
  userRole?: 'client' | 'owner';
}

const _allCategories: QuickFilterCategory[] = ['property', 'motorcycle', 'bicycle', 'services'];

const categories: { id: QuickFilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'property', label: 'Properties', icon: <Home className="w-4 h-4" /> },
  { id: 'motorcycle', label: 'Motorcycles', icon: <MotorcycleIcon className="w-4 h-4" /> },
  { id: 'bicycle', label: 'Bicycles', icon: <Bike className="w-4 h-4" /> },
  { id: 'services', label: 'Workers', icon: <Wrench className="w-4 h-4" /> },
];

// Map category array to localStorage key
function saveQuickFilter(cats: QuickFilterCategory[]): void {
  const map: Record<string, string> = {
    property: 'properties',
    motorcycle: 'motorcycles',
    bicycle: 'bicycles',
    services: 'workers',
  };
  const value = cats.length === 1 ? (map[cats[0]] ?? 'all') : 'all';
  try { localStorage.setItem('quickFilter', value); } catch { /* ignore */ }
}

const _listingTypes: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'All Types' },
  { id: 'rent', label: 'Rent Only' },
  { id: 'sale', label: 'Buy Only' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode }[] = [
  { id: 'any', label: 'All Genders', icon: <Users className="w-4 h-4" /> },
  { id: 'female', label: 'Women Only', icon: <User className="w-4 h-4" /> },
  { id: 'male', label: 'Men Only', icon: <User className="w-4 h-4" /> },
];

const clientTypeOptions: { id: OwnerClientType; label: string }[] = [
  { id: 'all', label: 'All Clients' },
  { id: 'hire', label: 'Hiring' },
  { id: 'rent', label: 'Renting' },
  { id: 'buy', label: 'Buying' },
];


// Smooth instant button class - works on all devices, NO transition delays
const smoothButtonClass = cn(
  'active:scale-[0.96]',
  'hover:brightness-110',
  'touch-manipulation',
  '-webkit-tap-highlight-color-transparent'
);

// Dropdown component for compact filters - instant response, no delays
function FilterDropdown({
  label,
  icon,
  options,
  value,
  onChange,
  isActive
}: {
  label: string;
  icon?: React.ReactNode;
  options: { id: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (id: string) => void;
  isActive?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(o => o.id === value);

  return (
    <div ref={dropdownRef} className="relative flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          smoothButtonClass,
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
          'border',
          isActive
            ? 'bg-orange-500 text-white border-orange-500'
            : 'bg-muted text-foreground border-border hover:bg-muted/80'
        )}
      >
        {icon}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className={cn('w-3 h-3', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-[9999] min-w-[120px] bg-background border border-border rounded-lg overflow-hidden pointer-events-auto shadow-xl"
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(option.id);
                setIsOpen(false);
              }}
              className={cn(
                smoothButtonClass,
                'w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left',
                value === option.id
                  ? 'bg-orange-500 text-white'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickFilterBarComponent({ filters, onChange, className, userRole = 'client' }: QuickFilterBarProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const handleCategoryToggle = useCallback((categoryId: QuickFilterCategory) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];

    onChange({
      ...filters,
      categories: newCategories,
    });
  }, [filters, onChange]);

  // Single-select for client quick filter bar
  const handleCategorySelect = useCallback((categoryId: QuickFilterCategory) => {
    const newCategories: QuickFilterCategory[] = [categoryId];
    saveQuickFilter(newCategories);
    onChange({ ...filters, categories: newCategories, listingType: 'both' });
  }, [filters, onChange]);

  const _handleListingTypeChange = useCallback((type: QuickFilterListingType) => {
    onChange({
      ...filters,
      listingType: type,
    });
  }, [filters, onChange]);

  const handleGenderChange = useCallback((gender: OwnerClientGender) => {
    onChange({
      ...filters,
      clientGender: gender,
    });
  }, [filters, onChange]);

  const handleClientTypeChange = useCallback((type: OwnerClientType) => {
    onChange({
      ...filters,
      clientType: type,
    });
  }, [filters, onChange]);

  const handleReset = useCallback(() => {
    onChange({
      categories: [],
      listingType: 'both',
      clientGender: 'any',
      clientType: 'all',
    });
  }, [onChange]);

  const _hasActiveFilters = userRole === 'client'
    ? filters.categories.length > 0 || filters.listingType !== 'both'
    : (filters.clientGender && filters.clientGender !== 'any') || (filters.clientType && filters.clientType !== 'all');

  // Owner Quick Filters - gender, client type, categories, and listing type
  if (userRole === 'owner') {
    const ownerIsAllSelected = filters.categories.length === 0 &&
      (!filters.clientGender || filters.clientGender === 'any') &&
      (!filters.clientType || filters.clientType === 'all') &&
      filters.listingType === 'both';
    const ownerHasActiveFilters = !ownerIsAllSelected;
    return (
      <div
        data-no-swipe-nav
        className={cn(
          isDark ? 'bg-background/50' : 'bg-white/80',
          'backdrop-blur-xl border-b border-border px-3 py-2',
          className
        )}
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* "All" button — first, auto-active when no filters */}
            <button
              onClick={handleReset}
              className={cn(
                smoothButtonClass,
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0',
                'border',
                ownerIsAllSelected
                  ? isDark
                    ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white border-transparent'
                    : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white border-transparent'
                  : 'bg-muted text-foreground border-border hover:bg-muted/80'
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All</span>
              {ownerIsAllSelected && <Check className="w-3 h-3" />}
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* Gender dropdown */}
            <FilterDropdown
              label="Gender"
              icon={<Users className="w-3.5 h-3.5" />}
              options={genderOptions}
              value={filters.clientGender || 'any'}
              onChange={(id) => handleGenderChange(id as OwnerClientGender)}
              isActive={filters.clientGender !== undefined && filters.clientGender !== 'any'}
            />

            {/* Client type dropdown */}
            <FilterDropdown
              label="Looking For"
              icon={<Briefcase className="w-3.5 h-3.5" />}
              options={clientTypeOptions}
              value={filters.clientType || 'all'}
              onChange={(id) => handleClientTypeChange(id as OwnerClientType)}
              isActive={filters.clientType !== undefined && filters.clientType !== 'all'}
            />

            {/* Divider */}
            <div className="w-px h-6 bg-border flex-shrink-0" />

            {/* Category chips */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {categories.map((category) => {
                const isActive = filters.categories.includes(category.id);
                const colorClass = getCategoryColorClass(category.id, isDark);
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      smoothButtonClass,
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold',
                      'border',
                      isActive
                        ? cn(colorClass, 'text-white border-current')
                        : 'bg-muted text-foreground border-border hover:bg-muted/80'
                    )}
                  >
                    {category.icon}
                    <span className="hidden sm:inline">{category.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Clear button — only show when filters are active */}
            {ownerHasActiveFilters && (
              <button
                onClick={handleReset}
                className={cn(
                  smoothButtonClass,
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0',
                  'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Client Quick Filters (default)
  const clientIsAllSelected = filters.categories.length === 0;
  const activeCategoryLabel = categories.find(c => filters.categories[0] === c.id)?.label ?? '';

  // Per-category accent colors (active state)
  const categoryColors: Record<string, { bg: string; shadow: string; border: string }> = {
    property:   { bg: 'rgba(244,63,94,0.90)',   shadow: '0 4px 14px rgba(244,63,94,0.45)',   border: 'transparent' },
    motorcycle: { bg: 'rgba(99,102,241,0.90)',   shadow: '0 4px 14px rgba(99,102,241,0.45)',  border: 'transparent' },
    bicycle:    { bg: 'rgba(20,184,166,0.90)',   shadow: '0 4px 14px rgba(20,184,166,0.45)',  border: 'transparent' },
    services:   { bg: 'rgba(245,158,11,0.90)',   shadow: '0 4px 14px rgba(245,158,11,0.45)',  border: 'transparent' },
  };

  const inactiveBg    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)';
  const inactiveBorder = isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)';
  const inactiveText  = isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)';

  return (
    <div
      data-no-swipe-nav
      className={cn(
        isDark ? 'bg-background/60' : 'bg-white/85',
        'backdrop-blur-xl border-b border-border px-3 pt-2 pb-1',
        className
      )}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Main filter row — scrollable pill buttons */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {/* ALL button */}
          <button
            onClick={() => {
              saveQuickFilter([]);
              onChange({ ...filters, categories: [], listingType: 'both' });
            }}
            className={cn(smoothButtonClass, 'flex items-center gap-1.5 px-5 rounded-full text-xs font-bold flex-shrink-0 min-h-[44px]')}
            style={{
              backgroundColor: clientIsAllSelected ? '#FF9500' : inactiveBg,
              color: clientIsAllSelected ? '#fff' : inactiveText,
              border: clientIsAllSelected ? '1px solid transparent' : inactiveBorder,
              boxShadow: clientIsAllSelected ? '0 4px 16px rgba(255,149,0,0.55)' : 'none',
              transition: 'background-color 320ms ease, color 280ms ease, border-color 280ms ease, box-shadow 350ms ease',
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ALL</span>
            {clientIsAllSelected && <Check className="w-3 h-3" />}
          </button>

          {/* Category chips — each with its own accent color */}
          {categories.map((category) => {
            const isActive = filters.categories.includes(category.id);
            const accent = categoryColors[category.id];
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={cn(smoothButtonClass, 'flex items-center gap-1.5 px-4 rounded-full text-xs font-bold flex-shrink-0 min-h-[44px]')}
                style={{
                  backgroundColor: isActive && accent ? accent.bg : inactiveBg,
                  color: isActive ? '#fff' : inactiveText,
                  border: isActive && accent ? `1px solid ${accent.border}` : inactiveBorder,
                  boxShadow: isActive && accent ? accent.shadow : 'none',
                  transition: 'background-color 320ms ease, color 280ms ease, border-color 280ms ease, box-shadow 350ms ease',
                }}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic section title */}
        <div className="px-1 pb-1 pt-0.5">
          <p className={cn('font-semibold transition-all duration-300', clientIsAllSelected ? 'text-sm' : 'text-xs')}
            style={{ color: '#FF9500' }}
          >
            {clientIsAllSelected
              ? 'Showing ALL Listings Near You'
              : `Showing ${activeCategoryLabel} Near You`}
          </p>
        </div>
      </div>
    </div>
  );
}

export const QuickFilterBar = memo(QuickFilterBarComponent);
