import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Bike, Wrench, X, Users, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';

// Custom motorcycle icon
const MotorcycleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M9 17h6" />
    <path d="M19 17l-2-5h-4l-3-4H6l1 4" />
    <path d="M14 7h3l2 5" />
  </svg>
);

// Re-export unified types
export type { QuickFilterCategory, QuickFilters } from '@/types/filters';

// Legacy type aliases for backwards compatibility
export type QuickFilterListingType = 'rent' | 'sale' | 'both';
export type OwnerClientGender = ClientGender;
export type OwnerClientType = ClientType;

interface QuickFilterDropdownProps {
  userRole: 'client' | 'owner';
  className?: string;
}

type CategoryOption = {
  id: QuickFilterCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  hasSubOptions: boolean;
};

const categoryOptions: CategoryOption[] = [
  { id: 'property', label: 'Property', icon: <Home className="w-4 h-4" />, color: 'from-orange-500 to-amber-500', hasSubOptions: true },
  { id: 'motorcycle', label: 'Motorcycle', icon: <MotorcycleIcon className="w-4 h-4" />, color: 'from-red-500 to-orange-500', hasSubOptions: true },
  { id: 'bicycle', label: 'Bicycle', icon: <Bike className="w-4 h-4" />, color: 'from-green-500 to-emerald-500', hasSubOptions: true },
  { id: 'services', label: 'Workers', icon: <Wrench className="w-4 h-4" />, color: 'from-pink-500 to-rose-500', hasSubOptions: true },
];

const listingTypeOptions: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
];

// Owner-specific filter options
const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'any', label: 'All Genders', icon: <Users className="w-4 h-4" />, color: 'from-gray-500 to-slate-500' },
  { id: 'female', label: 'Women', icon: <User className="w-4 h-4" />, color: 'from-pink-500 to-rose-500' },
  { id: 'male', label: 'Men', icon: <User className="w-4 h-4" />, color: 'from-blue-500 to-indigo-500' },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All Types', icon: <Briefcase className="w-4 h-4" />, color: 'from-gray-500 to-slate-500' },
  { id: 'hire', label: 'Hiring', icon: <Briefcase className="w-4 h-4" />, color: 'from-purple-500 to-violet-500' },
  { id: 'rent', label: 'Renting', icon: <Briefcase className="w-4 h-4" />, color: 'from-orange-500 to-amber-500' },
  { id: 'buy', label: 'Buying', icon: <Briefcase className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
];

// UPGRADED BRIGHTNESS: Text is a bright, glowing gradient
const QuickFilterText = ({ hasActiveFilters }: { hasActiveFilters: boolean }) => (
  <>
    <span className={cn(
      "hidden sm:inline font-bold text-sm tracking-tight whitespace-nowrap bg-clip-text text-transparent",
      hasActiveFilters
        ? "bg-gradient-to-r from-pink-400 to-rose-400"
        : "bg-gradient-to-r from-white to-gray-300"
    )}>
      Quick Filter
    </span>
    <span className={cn(
      "sm:hidden font-bold text-xs tracking-tight whitespace-nowrap bg-clip-text text-transparent",
      hasActiveFilters
        ? "bg-gradient-to-r from-pink-400 to-rose-400"
        : "bg-gradient-to-r from-white to-gray-300"
    )}>
      Filter
    </span>
  </>
);

function QuickFilterDropdownComponent({ userRole, className }: QuickFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clickedCategory, setClickedCategory] = useState<QuickFilterCategory | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ========== READ FROM ZUSTAND STORE ==========
  const categories = useFilterStore((state) => state.categories);
  const listingType = useFilterStore((state) => state.listingType);
  const clientGender = useFilterStore((state) => state.clientGender);
  const clientType = useFilterStore((state) => state.clientType);
  
  // ========== DISPATCH ACTIONS TO STORE ==========
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const setClientGender = useFilterStore((state) => state.setClientGender);
  const setClientType = useFilterStore((state) => state.setClientType);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);

  // Count active filters from store values
  const activeFilterCount = (() => {
    let count = 0;
    if (userRole === 'client') {
      count += categories.length;
      if (listingType !== 'both') count += 1;
    } else {
      if (clientGender !== 'any') count += 1;
      if (clientType !== 'all') count += 1;
    }
    return count;
  })();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setClickedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: QuickFilterCategory) => {
    // Toggle the submenu for all categories with sub-options
    setClickedCategory(clickedCategory === categoryId ? null : categoryId);
  };

  const handleCategorySelect = (categoryId: QuickFilterCategory, selectedListingType: QuickFilterListingType) => {
    // Apply category with listing type - dispatch to store
    setCategories([categoryId]);
    setListingType(selectedListingType);
    setIsOpen(false);
    setClickedCategory(null);
  };

  const handleGenderSelect = (gender: OwnerClientGender) => {
    setClientGender(gender);
  };

  const handleClientTypeSelect = (type: OwnerClientType) => {
    setClientType(type);
  };

  const handleClearFilters = () => {
    if (userRole === 'client') {
      resetClientFilters();
    } else {
      resetOwnerFilters();
    }
    setIsOpen(false);
    setClickedCategory(null);
  };

  // Render owner filters dropdown - MOBILE OPTIMIZED
  const renderOwnerFilters = () => (
    <div className="bg-background border border-white/10 rounded-2xl shadow-lg overflow-hidden w-[calc(100vw-2rem)] sm:min-w-[280px] sm:w-auto max-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
        <span className="text-sm sm:text-base font-semibold text-foreground">Filter Clients</span>
        {activeFilterCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClearFilters}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1 touch-manipulation"
          >
            <X className="w-5 h-5" />
          </motion.button>
        )}
      </div>

      {/* Gender Section */}
      <div className="p-3 sm:p-4 border-b border-white/5 max-h-[50vh] overflow-y-auto">
        <span className="text-sm font-medium text-muted-foreground mb-3 block">Gender</span>
        <div className="flex flex-wrap gap-2">
          {genderOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleGenderSelect(option.id)}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 touch-manipulation min-h-[44px]',
                clientGender === option.id
                  ? `bg-gradient-to-r ${option.color} text-white shadow-md`
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
              )}
            >
              {option.icon}
              <span className="whitespace-nowrap">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Client Type Section */}
      <div className="p-3 sm:p-4">
        <span className="text-sm font-medium text-muted-foreground mb-3 block">Looking For</span>
        <div className="grid grid-cols-2 gap-2">
          {clientTypeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleClientTypeSelect(option.id)}
              className={cn(
                'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 touch-manipulation min-h-[44px] will-change-transform active:scale-95',
                clientType === option.id
                  ? `bg-gradient-to-r ${option.color} text-white shadow-md`
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
              )}
            >
              {option.icon}
              <span className="whitespace-nowrap">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Apply button */}
      <div className="p-3 sm:p-4 border-t border-white/5">
        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 touch-manipulation min-h-[48px] will-change-transform active:scale-95 transition-transform duration-150"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );

  // Render client filters dropdown (categories) - MOBILE OPTIMIZED
  const renderClientFilters = () => {
    return (
      <div className="bg-background border border-white/10 rounded-2xl shadow-lg overflow-hidden w-[min(calc(100vw-2rem),400px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5">
          <span className="text-sm sm:text-base font-semibold text-foreground">Select Category</span>
          {activeFilterCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Category Options - always inline (no flyout) */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {categoryOptions.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-sm transition-all duration-200 touch-manipulation min-h-[52px]',
                  categories.includes(category.id)
                    ? 'bg-gradient-to-r ' + category.color + ' text-white'
                    : 'text-foreground/80 hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={cn(
                    'p-1.5 sm:p-2 rounded-lg',
                    categories.includes(category.id)
                      ? 'bg-white/20'
                      : `bg-gradient-to-br ${category.color} bg-opacity-20`
                  )}>
                    {category.icon}
                  </span>
                  <span className="font-medium text-sm sm:text-base">{category.label}</span>
                </div>
                {category.hasSubOptions && (
                  <ChevronRight className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform",
                    clickedCategory === category.id && "rotate-90"
                  )} />
                )}
              </button>

              {/* Sub-menu for listing type - always inline below */}
              <AnimatePresence>
                {clickedCategory === category.id && category.hasSubOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-12 sm:pl-14 pr-4 pb-2">
                      {listingTypeOptions.map((ltOption, ltIndex) => (
                        <motion.button
                          key={ltOption.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: ltIndex * 0.05 }}
                          onClick={() => handleCategorySelect(category.id, ltOption.id)}
                          className={cn(
                            'w-full flex items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-200 touch-manipulation min-h-[44px] mb-1',
                            categories.includes(category.id) && listingType === ltOption.id
                              ? `bg-gradient-to-r ${category.color} text-white`
                              : 'text-foreground/80 hover:bg-white/5 bg-white/[0.03]'
                          )}
                        >
                          <span className="font-medium text-sm sm:text-base">{ltOption.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={cn('relative', className)}>
      {/* UPGRADED BRIGHTNESS: Button now has a conditional glow and brighter text */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 md:px-5 h-9 sm:h-10 md:h-11 rounded-xl transition-all duration-200 touch-manipulation',
          'hover:bg-white/5',
          hasActiveFilters && 'bg-white/5'
        )}
      >
        <QuickFilterText hasActiveFilters={hasActiveFilters} />
        {/* Badge */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-[10px] sm:text-xs font-bold rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center"
            >
              {activeFilterCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001]"
              onClick={() => {
                setIsOpen(false);
                setClickedCategory(null);
              }}
            />

            {/* Main dropdown - FIXED centered on mobile, absolute on desktop */}
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 600, damping: 25 }}
              className="fixed left-1/2 -translate-x-1/2 top-16 sm:absolute sm:left-0 sm:translate-x-0 sm:top-full sm:mt-2 z-[10002]"
            >
              {userRole === 'owner' ? renderOwnerFilters() : renderClientFilters()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export const QuickFilterDropdown = memo(QuickFilterDropdownComponent);
