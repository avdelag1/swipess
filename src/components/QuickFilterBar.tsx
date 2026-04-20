import { memo, useCallback, useState, useRef, useEffect } from 'react';

import { 
  Home, Bike, RotateCcw, Briefcase, Users, User, 
  ChevronDown, Wrench, Check, Globe, ShoppingBag, Key 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';
import { POKER_CARDS, POKER_CARD_PHOTOS, PK_SPRING, PK_W, PK_H } from './swipe/SwipeConstants';
import { haptics } from '@/utils/microPolish';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';

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
  { id: 'property', label: 'Properties', icon: <RealEstateIcon className="w-5 h-5" /> },
  { id: 'motorcycle', label: 'Motorcycles', icon: <VespaIcon className="w-5 h-5" /> },
  { id: 'bicycle', label: 'Bicycles', icon: <BeachBicycleIcon className="w-5 h-5" /> },
  { id: 'services', label: 'Workers', icon: <WorkersIcon className="w-5 h-5" /> },
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

  // Category preview photos for breathing effect (using high-end assets)
  const categoryPhotos: Record<string, string> = {
    property:   '/images/filters/property.png',
    motorcycle: '/images/filters/scooter.png',
    bicycle:    '/images/filters/bicycle.png',
    services:   '/images/filters/workers.png',
    all:        '/images/filters/property.png',
    buyers:     '/images/filters/owner_buyers_card.png',
    renters:    '/images/filters/owner_renters_card.png',
    hire:       '/images/filters/owner_hire_card.png',
  };
  // Owner Quick Filters - Specialized for client intent
  if (userRole === 'owner') {
    const ownerOptions = [
      { id: 'all', label: 'All Clients', description: 'Global View', icon: <Globe className="w-7 h-7 mb-1" />, image: POKER_CARD_PHOTOS['all-clients'] },
      { id: 'buy', label: 'Buyers', description: 'Purchase Ready', icon: <ShoppingBag className="w-7 h-7 mb-1" />, image: POKER_CARD_PHOTOS.buyers },
      { id: 'rent', label: 'Renters', description: 'Looking to Move', icon: <Key className="w-7 h-7 mb-1" />, image: POKER_CARD_PHOTOS.renters },
      { id: 'hire', label: 'Services', description: 'Inbound Inquiries', icon: <Briefcase className="w-7 h-7 mb-1" />, image: POKER_CARD_PHOTOS.hire },
    ];

    const currentClientType = filters.clientType || 'all';

    return (
      <div
        data-no-swipe-nav
        className={cn(
          'bg-transparent px-3 pt-2 pb-3',
          className
        )}
      >
        <div className="max-w-screen-xl mx-auto pt-1">
          <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide pb-4 stagger-enter">
            {ownerOptions.map((option) => {
              const isActive = currentClientType === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (option.id === 'all') {
                      onChange({ ...filters, clientType: 'all', clientGender: 'any' });
                    } else {
                      onChange({ ...filters, clientType: option.id as any });
                    }
                  }}
                  className={cn(
                    smoothButtonClass, 
                    'relative flex-shrink-0 w-32 h-52 rounded-[3rem] overflow-hidden border-2 transition-all duration-200 group',
                    isActive 
                      ? (theme === 'ivanna-style' ? 'border-[#111111] shadow-[4px_4px_0px_#111111] scale-[1.03]' : 'border-orange-500 shadow-lg scale-[1.03]') 
                      : (theme === 'ivanna-style' ? 'border-[#111111]/20 opacity-90' : 'border-border/40 opacity-90')
                  )}
                  style={{ contain: 'paint', willChange: 'transform, opacity' }}
                >
                  <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors" />
                <QuickFilterImage 
                  src={option.image} 
                  alt={option.label}
                />
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white">
                    <div className={cn("mb-1 transition-transform duration-150", isActive && "scale-105")}>
                      {option.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{option.description}</span>
                    <span className="text-sm font-black whitespace-nowrap">{option.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="px-1 pt-1 text-center sm:text-left">
            <p className={cn(
                'font-black transition-all duration-150 bg-clip-text text-transparent bg-gradient-to-r',
                'from-orange-500 via-pink-500 to-rose-500 text-[10px] uppercase tracking-widest'
              )}
            >
              {currentClientType === 'all' 
                ? '✨ Filtering ALL Active Client Intents ✨' 
                : `Showing clients looking to ${currentClientType} ✨`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Client Quick Filters (default)
  const clientIsAllSelected = filters.categories.length === 0;
  const activeCategoryLabel = categories.find(c => filters.categories[0] === c.id)?.label ?? '';

  // Per-category accent colors (active state) - Ultra Premium Gradients
  const _categoryColors: Record<string, { bg: string; shadow: string; border: string; overlay: string }> = {
    property:   { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',   shadow: '0 4px 16px rgba(16,185,129,0.5)',   border: 'rgba(16,185,129,0.8)',  overlay: 'linear-gradient(135deg, rgba(16,185,129,0.72) 0%, rgba(5,150,105,0.72) 100%)' },
    motorcycle: { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',   shadow: '0 4px 16px rgba(249,115,22,0.5)',   border: 'rgba(249,115,22,0.8)',  overlay: 'linear-gradient(135deg, rgba(249,115,22,0.72) 0%, rgba(234,88,12,0.72) 100%)' },
    bicycle:    { bg: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',   shadow: '0 4px 16px rgba(168,85,247,0.5)',   border: 'rgba(168,85,247,0.8)', overlay: 'linear-gradient(135deg, rgba(168,85,247,0.72) 0%, rgba(147,51,234,0.72) 100%)' },
    services:   { bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',   shadow: '0 4px 16px rgba(245,158,11,0.5)',   border: 'rgba(245,158,11,0.8)',  overlay: 'linear-gradient(135deg, rgba(245,158,11,0.72) 0%, rgba(217,119,6,0.72) 100%)' },
  };

  const _allSelectedShadow = '0 4px 20px rgba(236,72,153,0.55)';



  return (
    <div
      data-no-swipe-nav
      className={cn(
        'bg-transparent px-3 pt-2 pb-3',
        className
      )}
    >
      <div className="max-w-screen-xl mx-auto pt-1">
        {/* Main filter cards — horizontal scroll */}
        <div className="flex items-center justify-center gap-4 overflow-x-auto scrollbar-hide pb-4 stagger-enter" style={{ willChange: 'scroll-position' }}>
          {/* ALL card */}
          <button
            onClick={() => {
              saveQuickFilter([]);
              onChange({ ...filters, categories: [], listingType: 'both' });
            }}
            className={cn(
              smoothButtonClass, 
              'relative flex-shrink-0 w-32 h-52 rounded-[3rem] overflow-hidden border-2 transition-all duration-200 group',
              clientIsAllSelected 
                ? (theme === 'ivanna-style' ? 'border-[#111111] shadow-[4px_4px_0px_#111111] scale-[1.03]' : 'border-orange-500 shadow-lg scale-[1.03]') 
                : (theme === 'ivanna-style' ? 'border-[#111111]/20 opacity-90' : 'border-border/40 opacity-90')
            )}
            style={{ contain: 'paint', willChange: 'transform, opacity' }}
          >
            <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors" />
            <QuickFilterImage 
              src={POKER_CARD_PHOTOS.all || '/images/filters/property.png'} 
              alt="All"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white">
              <Globe className={cn("w-7 h-7 mb-1 transition-transform duration-150", clientIsAllSelected && "scale-105")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Global</span>
              <span className="text-xl font-black">ALL</span>
            </div>
            {clientIsAllSelected && (
              <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>

          {categories.map((category) => {
            const isActive = filters.categories.includes(category.id);
            const photo = categoryPhotos[category.id];
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={cn(
                  smoothButtonClass, 
                  'relative flex-shrink-0 w-32 h-52 rounded-[3rem] overflow-hidden border-2 transition-all duration-200 group',
                  isActive 
                    ? (theme === 'ivanna-style' ? 'border-[#111111] shadow-[4px_4px_0px_#111111] scale-[1.03]' : 'border-orange-500 shadow-lg scale-[1.03]') 
                    : (theme === 'ivanna-style' ? 'border-[#111111]/20 opacity-90' : 'border-border/40 opacity-90')
                )}
                style={{ contain: 'paint', willChange: 'transform, opacity' }}
              >
                <div className="absolute inset-0 bg-black/40 z-10 group-hover:bg-black/20 transition-colors" />
                <QuickFilterImage 
                  src={photo} 
                  alt={category.label}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white">
                  <div className={cn("mb-1 transition-transform duration-150", isActive && "scale-105")}>
                    {category.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                  <span className="text-sm font-black whitespace-nowrap">{category.label}</span>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Status indicator */}
        <div className="px-1 pt-1">
          <p className={cn(
              'font-black transition-all duration-150 bg-clip-text text-transparent bg-gradient-to-r',
              clientIsAllSelected 
                ? 'from-orange-500 via-pink-500 to-rose-500 text-[10px] uppercase tracking-widest' 
                : 'from-muted-foreground/60 to-foreground text-[10px] uppercase tracking-widest opacity-90'
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
