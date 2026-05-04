import { memo, useCallback, useState, useRef, useEffect } from 'react';

import { 
  Home, Bike, RotateCcw, Briefcase, Users, User, 
  ChevronDown, Wrench, Check, Globe, ShoppingBag, Key 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
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
  onSelect?: (categoryId: QuickFilterCategory) => void;
  className?: string;
  userRole?: 'client' | 'owner';
}

import { OWNER_INTENT_CARDS } from './swipe/SwipeConstants';

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
  'outline-none focus:outline-none',
  '[-webkit-tap-highlight-color:transparent]'
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
  const { isLight } = useAppTheme();

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
          'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all',
            isActive
              ? cn('bg-primary shadow-lg shadow-primary/20 scale-[1.02]', isLight ? 'text-black' : 'text-white')
              : isLight 
                ? 'bg-white border-black/5 text-black shadow-sm backdrop-blur-md hover:bg-black/[0.05]' 
                : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
        )}
      >
        {icon && <span className="opacity-80">{icon}</span>}
        <span>{selectedOption?.label || label}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-300', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 z-[9999] min-w-[160px] rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200",
            isLight ? "bg-white/95 border-black/10" : "bg-black/95 border-white/10"
          )}
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
                'w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-left transition-colors',
                value === option.id
                  ? (isLight ? 'bg-black text-white' : 'bg-white text-black')
                  : (isLight ? 'text-black hover:bg-black/[0.03]' : 'text-white hover:bg-white/5')
              )}
            >
              {option.icon}
              <span>{option.label}</span>
              {value === option.id && <Check className="w-3 h-3 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuickFilterBarComponent({ filters, onChange, onSelect, className, userRole = 'client' }: QuickFilterBarProps) {
  const { theme, isLight } = useAppTheme();
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
    if (onSelect) {
      onSelect(categoryId);
    } else {
      onChange({ ...filters, categories: newCategories, listingType: 'both' });
    }
  }, [filters, onChange, onSelect]);

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
    property:   '/images/filters/property.jpg',
    motorcycle: '/images/filters/scooter.jpg',
    bicycle:    '/images/filters/bicycle.jpg',
    services:   '/images/filters/workers.jpg',
    all:        '/images/filters/all.jpg',
    buyers:     '/images/filters/owner_buyers_card.jpg',
    renters:    '/images/filters/owner_renters_card.jpg',
    hire:       '/images/filters/owner_hire_card.jpg',
  };
  // Owner Quick Filters - Specialized for client intent
  if (userRole === 'owner') {
    const ownerOptions = OWNER_INTENT_CARDS.map(c => ({
      id: c.clientType || 'all',
      originalId: c.id,
      label: c.label,
      description: c.description,
      icon: <c.icon className="w-7 h-7 mb-1" />,
      image: POKER_CARD_PHOTOS[c.id]
    }));

    const currentClientType = filters.clientType || 'all';

    return (
      <div
        data-no-swipe-nav
        className={cn('bg-transparent px-4 pt-2 pb-3', className)}
      >
        <div className="flex items-center justify-center gap-3 overflow-x-auto scrollbar-hide pb-4" style={{ willChange: 'scroll-position' }}>
          {ownerOptions.map((option) => {
            const isActive = currentClientType === option.id;
            const isGlobalAll = option.originalId === 'all-clients';

            return (
              <button
                key={option.originalId}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSelect) {
                    onSelect(option.id as any);
                  } else {
                    if (option.id === 'all') {
                      onChange({ ...filters, clientType: 'all', clientGender: 'any' });
                    } else {
                      onChange({ ...filters, clientType: option.id as any });
                    }
                  }
                }}
                className={cn(
                  smoothButtonClass,
                  'relative flex-shrink-0 overflow-hidden border transition-all duration-200',
                  isGlobalAll ? 'w-28 h-44 rounded-[3rem]' : 'w-24 h-36 rounded-[2rem]',
                  isActive
                    ? 'border-primary/80 ring-2 ring-primary/60 ring-offset-1 ring-offset-transparent scale-[1.06] shadow-[0_8px_32px_rgba(235,72,152,0.35)]'
                    : (isLight ? 'border-black/15 shadow-md' : 'border-white/15 shadow-md')
                )}
                style={{ contain: 'paint', willChange: 'transform, opacity' }}
              >
                <div className={cn(
                  "absolute inset-0 z-10 transition-colors duration-300",
                  isActive
                    ? (isLight ? "bg-white/30" : "bg-black/35")
                    : (isLight ? "bg-white/60" : "bg-black/55")
                )} />
                <QuickFilterImage src={option.image} alt={option.label} />
                <div className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-300",
                  isLight ? "text-black" : "text-white",
                  "font-black"
                )}>
                  <div className={cn("mb-1 transition-all duration-300",
                    isLight ? "drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]" : "drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]",
                    isActive && (isLight ? "scale-110 drop-shadow-[0_0_12px_rgba(0,0,0,0.25)]" : "scale-110 drop-shadow-[0_0_18px_rgba(255,255,255,0.95)]"))}>
                    {option.icon}
                  </div>
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-80",
                    isLight ? "drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]" : "drop-shadow-md")}>{option.description}</span>
                  <span className={cn("font-black whitespace-nowrap uppercase tracking-tighter",
                    isLight ? "drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]" : "drop-shadow-lg",
                    isGlobalAll ? "text-xl" : "text-xs")}>{option.label}</span>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-[#EB4898] rounded-full flex items-center justify-center shadow-lg shadow-[#EB4898]/40">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Client Quick Filters (default)
  const clientIsAllSelected = filters.categories.length === 0;
  const activeCategoryLabel = categories.find(c => filters.categories[0] === c.id)?.label ?? '';

  // Per-category accent colors (active state) - Ultra Premium Gradients
  const _categoryColors: Record<string, { bg: string; shadow: string; border: string; overlay: string }> = {
    property:   { bg: 'linear-gradient(135deg, #FF4D00 0%, #FF8C00 100%)',   shadow: '0 4px 16px rgba(255,77,0,0.5)',   border: 'rgba(255,77,0,0.8)',  overlay: 'linear-gradient(135deg, rgba(255,77,0,0.72) 0%, rgba(255,140,0,0.72) 100%)' },
    motorcycle: { bg: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',   shadow: '0 4px 16px rgba(255,77,0,0.5)',   border: 'rgba(255,77,0,0.8)',  overlay: 'linear-gradient(135deg, rgba(255,77,0,0.72) 0%, rgba(235,72,152,0.72) 100%)' },
    bicycle:    { bg: 'linear-gradient(135deg, #EB4898 0%, #FF4D00 100%)',   shadow: '0 4px 16px rgba(235,72,152,0.5)',   border: 'rgba(235,72,152,0.8)', overlay: 'linear-gradient(135deg, rgba(235,72,152,0.72) 0%, rgba(255,77,0,0.72) 100%)' },
    services:   { bg: 'linear-gradient(135deg, #EB4898 0%, #FF00FF 100%)',   shadow: '0 4px 16px rgba(235,72,152,0.5)',   border: 'rgba(235,72,152,0.8)',  overlay: 'linear-gradient(135deg, rgba(235,72,152,0.72) 0%, rgba(255,0,255,0.72) 100%)' },
  };

  const _allSelectedShadow = '0 4px 20px rgba(236,72,153,0.55)';



  return (
    <div
      data-no-swipe-nav
      className={cn('bg-transparent px-4 pt-2 pb-3', className)}
    >
      {/* Main filter cards — centered horizontal scroll */}
      <div className="flex items-center justify-center gap-3 overflow-x-auto scrollbar-hide pb-4" style={{ willChange: 'scroll-position' }}>
        {/* ALL card */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            haptics.tap();
            saveQuickFilter([]);
            onChange({ ...filters, categories: [], listingType: 'both' });
          }}
          className={cn(
            smoothButtonClass,
            'relative flex-shrink-0 w-28 h-44 rounded-[3rem] overflow-hidden border transition-all duration-200',
            clientIsAllSelected
              ? 'border-primary/80 ring-2 ring-primary/60 ring-offset-1 ring-offset-transparent scale-[1.08] shadow-[0_8px_40px_rgba(255,77,0,0.5)] brightness-110'
              : (isLight ? 'border-black/15 shadow-md' : 'border-white/15 shadow-md')
          )}
          style={{ contain: 'paint', willChange: 'transform, opacity, filter' }}
        >
          {clientIsAllSelected && (
            <div className="absolute inset-0 z-15 pointer-events-none">
              <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[#FF4D00]/15 via-transparent to-transparent animate-pulse" />
            </div>
          )}

          <div className={cn(
            "absolute inset-0 z-10 transition-colors duration-300",
            clientIsAllSelected
              ? (isLight ? "bg-white/30" : "bg-black/35")
              : (isLight ? "bg-white/60" : "bg-black/55")
          )} />

          <QuickFilterImage
            src={POKER_CARD_PHOTOS['all-clients'] || '/images/filters/all.jpg'}
            alt="All"
          />

          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-300",
            isLight ? "text-black" : "text-white",
            "font-black"
          )}>
            <Globe className={cn("w-7 h-7 mb-1 transition-all duration-300",
              isLight ? "drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]" : "",
              clientIsAllSelected && (isLight ? "scale-125 drop-shadow-[0_0_12px_rgba(0,0,0,0.25)]" : "scale-125 drop-shadow-[0_0_18px_rgba(168,85,247,0.95)]"))} />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-80",
              isLight ? "drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]" : "")}>Global</span>
            <span className={cn("text-xl font-black uppercase tracking-tighter",
              isLight ? "drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]" : "drop-shadow-md")}>ALL</span>
          </div>
          {clientIsAllSelected && (
            <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-[#EB4898] rounded-full flex items-center justify-center shadow-lg shadow-[#EB4898]/40">
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
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                haptics.tap();
                handleCategorySelect(category.id);
              }}
              className={cn(
                smoothButtonClass,
                'relative flex-shrink-0 w-24 h-36 rounded-[2rem] overflow-hidden border transition-all duration-200',
                isActive
                  ? 'border-primary/80 ring-2 ring-primary/60 ring-offset-1 ring-offset-transparent scale-[1.08] shadow-[0_8px_32px_rgba(235,72,152,0.4)] brightness-110'
                  : (isLight ? 'border-black/15 shadow-md' : 'border-white/15 shadow-md')
              )}
              style={{ contain: 'paint', willChange: 'transform, opacity, filter' }}
            >
              {isActive && (
                <div className="absolute inset-0 z-15 pointer-events-none">
                  <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-orange-400/15 via-transparent to-transparent animate-pulse" />
                </div>
              )}

              <div className={cn(
                "absolute inset-0 z-10 transition-colors duration-300",
                isActive
                  ? (isLight ? "bg-white/30" : "bg-black/35")
                  : (isLight ? "bg-white/60" : "bg-black/55")
              )} />

              <QuickFilterImage src={photo} alt={category.label} />

              <div className={cn(
                "absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-300",
                isLight ? "text-black" : "text-white",
                "font-black"
              )}>
                <div className={cn("mb-1 transition-all duration-300",
                  isLight ? "drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)]" : "",
                  isActive && (isLight ? "scale-125 drop-shadow-[0_0_12px_rgba(0,0,0,0.25)]" : "scale-125 drop-shadow-[0_0_18px_rgba(255,165,0,0.95)]"))}>
                  {category.icon}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-80",
                  isLight ? "drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]" : "")}>Filter</span>
                <span className={cn("text-xs font-black whitespace-nowrap uppercase tracking-tight",
                  isLight ? "drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]" : "drop-shadow-md")}>{category.label}</span>
              </div>
              {isActive && (
                <div className="absolute top-2 right-2 z-30 w-5 h-5 bg-[#EB4898] rounded-full flex items-center justify-center shadow-lg shadow-[#EB4898]/40">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const QuickFilterBar = memo(QuickFilterBarComponent);



