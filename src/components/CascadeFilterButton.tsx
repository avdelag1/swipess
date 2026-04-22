import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bike, RotateCcw, Users, User, ChevronDown, Wrench, Filter, X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/hooks/useAppTheme';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';
import { getCategoryColorClass } from '@/types/filters';

// Re-export unified types
export type { QuickFilterCategory, QuickFilters } from '@/types/filters';

// Legacy type aliases for backwards compatibility
export type QuickFilterListingType = 'rent' | 'sale' | 'both';
export type OwnerClientGender = ClientGender;
export type OwnerClientType = ClientType;

interface CascadeFilterButtonProps {
  filters: QuickFilters;
  onChange: (filters: QuickFilters) => void;
  userRole?: 'client' | 'owner';
}

const categories: { id: QuickFilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'property', label: 'properties', icon: <RealEstateIcon className="w-4 h-4" /> },
  { id: 'motorcycle', label: 'motos', icon: <VespaIcon className="w-4 h-4" /> },
  { id: 'bicycle', label: 'bikes', icon: <BeachBicycleIcon className="w-4 h-4" /> },
  { id: 'services', label: 'services', icon: <WorkersIcon className="w-4 h-4" /> },
];

const listingTypes: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'all' },
  { id: 'rent', label: 'rent' },
  { id: 'sale', label: 'buy' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode }[] = [
  { id: 'any', label: 'all genders', icon: <Users className="w-4 h-4" /> },
  { id: 'female', label: 'women', icon: <User className="w-4 h-4" /> },
  { id: 'male', label: 'men', icon: <User className="w-4 h-4" /> },
];

const clientTypeOptions: { id: OwnerClientType; label: string }[] = [
  { id: 'all', label: 'all clients' },
  { id: 'hire', label: 'hiring' },
  { id: 'rent', label: 'renting' },
  { id: 'buy', label: 'buying' },
];

// Smooth instant button class - works on all devices, NO transition delays
const buttonClass = cn(
  'active:scale-[0.96]',
  'hover:brightness-110',
  'touch-manipulation',
  '-webkit-tap-highlight-color-transparent'
);

function CascadeFilterButtonComponent({ filters, onChange, userRole = 'client' }: CascadeFilterButtonProps) {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
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

  const allCategoryIds = categories.map(c => c.id);
  const allSelected = allCategoryIds.every(id => filters.categories.includes(id));

  const handleCategoryToggle = useCallback((categoryId: QuickFilterCategory) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    onChange({ ...filters, categories: newCategories });
  }, [filters, onChange]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange({ ...filters, categories: [] });
    } else {
      onChange({ ...filters, categories: [...allCategoryIds] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, onChange, allSelected]);

  const handleListingTypeChange = useCallback((type: QuickFilterListingType) => {
    onChange({ ...filters, listingType: type });
  }, [filters, onChange]);

  const handleGenderChange = useCallback((gender: OwnerClientGender) => {
    onChange({ ...filters, clientGender: gender });
  }, [filters, onChange]);

  const handleClientTypeChange = useCallback((type: OwnerClientType) => {
    onChange({ ...filters, clientType: type });
  }, [filters, onChange]);

  const handleReset = useCallback(() => {
    onChange({
      categories: [],
      listingType: 'both',
      clientGender: 'any',
      clientType: 'all',
    });
  }, [onChange]);

  const hasActiveFilters = userRole === 'client'
    ? filters.categories.length > 0 || filters.listingType !== 'both'
    : (filters.clientGender && filters.clientGender !== 'any') || (filters.clientType && filters.clientType !== 'all');

  const activeCount = userRole === 'client'
    ? filters.categories.length + (filters.listingType !== 'both' ? 1 : 0)
    : (filters.clientGender !== 'any' ? 1 : 0) + (filters.clientType !== 'all' ? 1 : 0);

  return (
    <div className="relative">
      {/* Filter Button - instant feedback */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filter"
        className={cn(
          buttonClass,
          'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium',
          'border',
          isOpen || hasActiveFilters
            ? 'border-transparent text-white shadow-md'
            : 'bg-[var(--hud-bg)] text-[var(--hud-text)] border-[var(--hud-border)] shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
        )}
        style={isOpen || hasActiveFilters ? {
          background: 'linear-gradient(135deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)',
          boxShadow: '0 4px 14px rgba(249,115,22,0.45)',
        } : undefined}
      >
        <Filter className="w-4 h-4" />
        <span>{t('filters.quickFilter')}</span>
        {activeCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-white/20 text-xs font-bold">
            {activeCount}
          </span>
        )}
        <ChevronDown className={cn('w-4 h-4 transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>

      {/* Cascade Panel - instant open, no animation delay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="absolute top-full left-0 mt-2 z-[100] w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground">{t('filters.quickFilter')}</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <button
                    onClick={handleReset}
                    className={cn(
                      buttonClass,
                      'flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded-lg'
                    )}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('filters.reset')}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'p-1 hover:bg-muted rounded-lg transition-colors',
                    '-webkit-tap-highlight-color-transparent'
                  )}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {userRole === 'client' ? (
                <>
                  {/* Categories Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('filters.categories')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {/* All categories button */}
                      <button
                        onClick={handleSelectAll}
                        className={cn(
                          buttonClass,
                          'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium col-span-2',
                          'border',
                          allSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/30 text-muted-foreground border-border/50'
                        )}
                      >
                        <Filter className="w-4 h-4" />
                        <span>{t('filters.allCategories')}</span>
                        {allSelected && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                      {categories.map((category) => {
                        const isActive = filters.categories.includes(category.id);
                        const colorClass = getCategoryColorClass(category.id, isDark);
                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryToggle(category.id)}
                            className={cn(
                              buttonClass,
                              'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium',
                              'border',
                              isActive
                                ? cn(colorClass, 'text-white border-current')
                                : 'bg-muted/30 text-muted-foreground border-border/50'
                            )}
                          >
                            {category.icon}
                            <span>{t(`filters.${category.label === 'properties' ? 'properties' : category.label === 'motos' ? 'motos' : category.label === 'bikes' ? 'bikes' : 'services'}`)}</span>
                            {isActive && <Check className="w-3 h-3 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Listing Type Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('filters.lookingTo')}</span>
                    <div className="flex gap-2">
                      {listingTypes.map((type) => {
                        const isActive = filters.listingType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() => handleListingTypeChange(type.id)}
                            className={cn(
                              buttonClass,
                              'flex-1 px-3 py-2.5 rounded-xl text-sm font-medium',
                              'border',
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/30 text-muted-foreground border-border/50'
                            )}
                          >
                            {t(`filters.${type.label === 'all' ? 'all' : type.label === 'rent' ? 'rent' : 'buy'}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Gender Section (Owner) */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('filters.gender')}</span>
                    <div className="flex gap-2">
                      {genderOptions.map((option) => {
                        const isActive = filters.clientGender === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleGenderChange(option.id)}
                            className={cn(
                              buttonClass,
                              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium',
                              'border',
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/30 text-muted-foreground border-border/50'
                            )}
                          >
                            {option.icon}
                            <span>{t(`filters.${option.label === 'all genders' ? 'allGenders' : option.label === 'women' ? 'women' : 'men'}`)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Client Type Section (Owner) */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('filters.lookingFor')}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {clientTypeOptions.map((option) => {
                        const isActive = filters.clientType === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleClientTypeChange(option.id)}
                            className={cn(
                              buttonClass,
                              'px-3 py-2.5 rounded-xl text-sm font-medium',
                              'border',
                              isActive
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-muted/30 text-muted-foreground border-border/50'
                            )}
                          >
                            {t(`filters.${option.label === 'all clients' ? 'allClients' : option.label === 'hiring' ? 'hiring' : option.label === 'renting' ? 'renting' : 'buying'}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/30">
              <button
                onClick={() => setIsOpen(false)}
                className={cn(
                  buttonClass,
                  'w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm'
                )}
              >
                {t('filters.applyFilters')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CascadeFilterButton = memo(CascadeFilterButtonComponent);


