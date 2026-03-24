import { memo, useCallback, useState, useRef, useEffect } from 'react';

import { Home, Bike, RotateCcw, Briefcase, Users, User, ChevronDown, Wrench, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';

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

    // Inline gradient styles per category — avoids Tailwind dynamic class purging
    // and guarantees text stays visible on the gradient background
    const catActiveStyles: Record<string, React.CSSProperties> = {
      property:   { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)', color: '#ffffff', border: 'none' },
      motorcycle: { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 4px 12px rgba(249,115,22,0.4)',  color: '#ffffff', border: 'none' },
      bicycle:    { background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', boxShadow: '0 4px 12px rgba(168,85,247,0.4)', color: '#ffffff', border: 'none' },
      services:   { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 12px rgba(245,158,11,0.4)', color: '#ffffff', border: 'none' },
    };

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
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold flex-shrink-0 transition-all duration-200',
                ownerIsAllSelected
                  ? ''
                  : 'bg-muted/50 text-foreground border border-border/50 hover:bg-muted/80 backdrop-blur-md'
              )}
              style={ownerIsAllSelected ? {
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
              } : undefined}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All</span>
              {ownerIsAllSelected && <Check className="w-3 h-3" style={{ color: '#ffffff' }} />}
            </button>

            {/* Divider */}
            <div className="w-[2px] h-6 bg-border/50 rounded-full flex-shrink-0" />

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
            <div className="w-[2px] h-6 bg-border/50 rounded-full flex-shrink-0" />

            {/* Category chips */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {categories.map((category) => {
                const isActive = filters.categories.includes(category.id);
                const activeStyle = catActiveStyles[category.id];

                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    className={cn(
                      smoothButtonClass,
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
                      isActive
                        ? ''
                        : 'bg-muted/50 text-foreground border border-border/50 hover:bg-muted/80 backdrop-blur-md'
                    )}
                    // Inline style guarantees gradient bg + white text always visible
                    style={isActive ? activeStyle : undefined}
                  >
                    {/* Icon inherits white color from parent when active */}
                    <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#ffffff' : undefined }}>
                      {category.icon}
                    </span>
                    {/* Label always shown — no hidden sm:inline */}
                    <span style={{ color: isActive ? '#ffffff' : undefined }}>{category.label}</span>
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
                  'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)] transition-all'
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
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

  // Per-category accent colors (active state) - Ultra Premium Gradients
  const categoryColors: Record<string, { bg: string; shadow: string; border: string; overlay: string }> = {
    property:   { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',   shadow: '0 4px 16px rgba(16,185,129,0.5)',   border: 'rgba(16,185,129,0.8)',  overlay: 'linear-gradient(135deg, rgba(16,185,129,0.72) 0%, rgba(5,150,105,0.72) 100%)' },
    motorcycle: { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',   shadow: '0 4px 16px rgba(249,115,22,0.5)',   border: 'rgba(249,115,22,0.8)',  overlay: 'linear-gradient(135deg, rgba(249,115,22,0.72) 0%, rgba(234,88,12,0.72) 100%)' },
    bicycle:    { bg: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',   shadow: '0 4px 16px rgba(168,85,247,0.5)',   border: 'rgba(168,85,247,0.8)', overlay: 'linear-gradient(135deg, rgba(168,85,247,0.72) 0%, rgba(147,51,234,0.72) 100%)' },
    services:   { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',   shadow: '0 4px 16px rgba(245,158,11,0.5)',   border: 'rgba(245,158,11,0.8)',  overlay: 'linear-gradient(135deg, rgba(245,158,11,0.72) 0%, rgba(217,119,6,0.72) 100%)' },
  };

  const allSelectedShadow = '0 4px 20px rgba(236,72,153,0.55)';

  // Category preview photos for breathing effect (from mock data + curated)
  const categoryPhotos: Record<string, string> = {
    property:   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=150&fit=crop&crop=center',
    motorcycle: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=300&h=150&fit=crop&crop=center',
    bicycle:    'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=300&h=150&fit=crop&crop=center',
    services:   'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=300&h=150&fit=crop&crop=center',
  };
  const allPhoto = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&h=150&fit=crop&crop=center';

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
        {/* Main filter row — compact ALL pill first, large photo cards at end */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {/* ALL button — compact pill, always visible at the start */}
          <button
            onClick={() => {
              saveQuickFilter([]);
              onChange({ ...filters, categories: [], listingType: 'both' });
            }}
            className={cn(smoothButtonClass, 'flex items-center gap-1.5 px-5 rounded-full text-[13px] font-black tracking-wide flex-shrink-0 min-h-[44px]')}
            style={{
              background: clientIsAllSelected
                ? 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)'
                : isDark ? 'rgba(20,20,30,0.5)' : 'rgba(255,255,255,0.7)',
              color: clientIsAllSelected ? '#fff' : isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
              border: clientIsAllSelected ? '1px solid transparent' : isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
              boxShadow: clientIsAllSelected ? '0 4px 16px rgba(236,72,153,0.45)' : 'none',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Globe className="w-4 h-4" />
            <span>ALL</span>
            {clientIsAllSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-white/90" />}
          </button>

          {/* Category chips — large photo cards, scrollable at the end */}
          {categories.map((category) => {
            const isActive = filters.categories.includes(category.id);
            const accent = categoryColors[category.id];
            const photo = categoryPhotos[category.id];
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={cn(smoothButtonClass, 'flex items-center gap-2 px-5 rounded-[1.8rem] text-sm font-bold flex-shrink-0 h-[82px] overflow-hidden relative')}
                style={{
                  border: isActive && accent ? `2.5px solid ${accent.border}` : isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.10)',
                  boxShadow: isActive && accent ? accent.shadow : '0 4px 12px rgba(0,0,0,0.05)',
                  transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Breathing background photo */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  {photo && (
                    <img
                      src={photo}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', transformOrigin: 'center',
                        animation: 'breathing-zoom 8s ease-out infinite alternate',
                      }}
                    />
                  )}
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: isActive && accent ? accent.overlay : isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.40)',
                  }} />
                </div>
                {/* Content */}
                <div className={cn("transition-transform duration-300 relative z-10 text-white", isActive && "scale-110")}>
                  {category.icon}
                </div>
                <span className="tracking-tight relative z-10 text-white">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic section title */}
        <div className="px-1 pb-1 pt-0.5">
          <p className={cn(
              'font-bold transition-all duration-300 bg-clip-text text-transparent bg-gradient-to-r',
              clientIsAllSelected 
                ? 'from-orange-500 to-pink-500 text-sm' 
                : 'from-muted-foreground to-foreground text-xs opacity-80'
            )}
          >
            {clientIsAllSelected
              ? '✨ Showing ALL Premium Vehicles & Properties ✨'
              : `Showing ${activeCategoryLabel} Near You`}
          </p>
        </div>
      </div>
    </div>
  );
}

export const QuickFilterBar = memo(QuickFilterBarComponent);
