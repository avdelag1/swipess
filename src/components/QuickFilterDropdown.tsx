import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Bike, Wrench, X, Users, User, Briefcase, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';
import type { QuickFilterCategory, QuickFilters, ClientGender, ClientType } from '@/types/filters';
import { getCategoryGradientClass } from '@/types/filters';

// Custom motorcycle icon
const MotorcycleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
  hasSubOptions: boolean;
};

const categoryOptionBase: (CategoryOption & { color: string; inactiveColor: string })[] = [
  { id: 'property', label: 'Property', icon: <Home strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-blue-600 to-cyan-500', inactiveColor: 'text-blue-400' },
  { id: 'motorcycle', label: 'Motorcycle', icon: <MotorcycleIcon className="w-4 h-4" />, hasSubOptions: true, color: 'from-orange-600 to-amber-500', inactiveColor: 'text-orange-400' },
  { id: 'bicycle', label: 'Bicycle', icon: <Bike strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-emerald-600 to-green-500', inactiveColor: 'text-emerald-400' },
  { id: 'services', label: 'Workers', icon: <Wrench strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-purple-600 to-violet-500', inactiveColor: 'text-purple-400' },
];

const listingTypeOptions: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'any', label: 'All Genders', icon: <Users strokeWidth={4} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500' },
  { id: 'female', label: 'Women', icon: <User strokeWidth={4} className="w-4 h-4" />, color: 'from-pink-500 to-rose-500' },
  { id: 'male', label: 'Men', icon: <User strokeWidth={4} className="w-4 h-4" />, color: 'from-blue-500 to-indigo-500' },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All Types', icon: <Users strokeWidth={4} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500' },
  { id: 'hire', label: 'Hiring', icon: <Briefcase strokeWidth={4} className="w-4 h-4" />, color: 'from-purple-500 to-violet-500' },
  { id: 'rent', label: 'Renting', icon: <Home strokeWidth={4} className="w-4 h-4" />, color: 'from-orange-500 to-amber-500' },
  { id: 'buy', label: 'Buying', icon: <Search strokeWidth={4} className="w-4 h-4" />, color: 'from-green-500 to-emerald-500' },
];

// UPGRADED BRIGHTNESS: Text is a bright, glowing gradient
const QuickFilterText = ({ hasActiveFilters, isDark }: { hasActiveFilters: boolean; isDark: boolean }) => (
  <>
    <span className={cn(
      "hidden sm:inline font-black text-sm tracking-tight whitespace-nowrap uppercase",
      hasActiveFilters
        ? "text-pink-600"
        : isDark ? "text-white" : "text-slate-700"
    )}>
      Quick Filter
    </span>
    <span className={cn(
      "sm:hidden font-black text-xs tracking-tight whitespace-nowrap uppercase",
      hasActiveFilters
        ? "text-pink-600"
        : isDark ? "text-white" : "text-slate-700"
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const glassBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff';
  const glassBorder = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';
  const floatingShadow = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)'
    : '0 4px 12px rgba(0,0,0,0.05)';

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
    count += categories.length;
    if (listingType !== 'both') count += 1;
    if (userRole === 'owner') {
      if (clientGender !== 'any') count += 1;
      if (clientType !== 'all') count += 1;
    }
    return count;
  })();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // FIX: Ignore clicks on AI search button to prevent it from closing filters
      const isAISearchClick = target.closest('#ai-search-button');

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        !isAISearchClick
      ) {
        setIsOpen(false);
        setClickedCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: QuickFilterCategory) => {
    // Workers/services: select directly without submenu (no rent/buy/both)
    if (categoryId === 'services') {
      setCategories([categoryId]);
      setListingType('both');
      setIsOpen(false);
      setClickedCategory(null);
      return;
    }
    // Toggle the submenu for other categories with sub-options
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

  // Render owner filters dropdown - clean horizontal pills
  const renderOwnerFilters = () => {
    return (
      <div className="bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden w-[min(calc(100vw-1.5rem),340px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <span className="text-sm font-semibold text-foreground">Filter Clients</span>
          {activeFilterCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1 flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        <div className="py-3 px-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Gender - snappier layoutId pill */}
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-2 opacity-50">Gender Preference</p>
            <div className="flex gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl relative">
              {genderOptions.map((option) => {
                const isActive = clientGender === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleGenderSelect(option.id)}
                    className={cn(
                      'flex-1 relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-black transition-colors duration-200 touch-manipulation z-10',
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="owner-gender-pill"
                        className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/10 rounded-xl"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-1.5">
                      {option.icon}
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Type - snappier grid layoutId */}
          <div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-2 opacity-50">Looking For</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-2xl relative">
              {clientTypeOptions.map((option) => {
                const isActive = clientType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleClientTypeSelect(option.id)}
                    className={cn(
                      'relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-black transition-colors duration-200 touch-manipulation z-10',
                      isActive
                        ? "text-purple-600 dark:text-purple-400"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="owner-type-pill"
                        className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm border border-black/5 dark:border-white/10 rounded-xl"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-1.5">
                      {option.icon}
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Render client filters dropdown (categories) - MOBILE OPTIMIZED
  const renderClientFilters = () => {
    const isAllActive = categories.length === 0;
    return (
      <div className="bg-white border border-black/10 rounded-2xl shadow-2xl overflow-hidden w-[min(calc(100vw-1.5rem),400px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-black/5">
          <span className="text-sm sm:text-base font-semibold text-foreground">Select Category</span>
          {activeFilterCount > 0 && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors p-1 flex items-center justify-center touch-manipulation"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Category Options - always inline (no flyout) */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {/* ALL option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0 }}
            className="relative"
          >
            <button
              onClick={() => { handleClearFilters(); }}
              className={cn(
                'w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-sm transition-all duration-200 touch-manipulation min-h-[52px]',
                isAllActive
                  ? 'bg-slate-700 text-white'
                  : 'text-gray-700 hover:bg-black/[0.04]'
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={cn(
                  'p-1.5 sm:p-2 rounded-lg',
                  isAllActive ? 'bg-white/20 text-white' : 'bg-black/5 text-gray-500'
                )}>
                  <Search strokeWidth={4} className="w-4 h-4" />
                </span>
                <span className="font-medium text-sm sm:text-base">All</span>
              </div>
            </button>
          </motion.div>

          {categoryOptionBase.map((category, index) => {
            const isActive = categories.includes(category.id);
            return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.05 }}
              className="relative"
            >
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 text-sm transition-all duration-200 touch-manipulation min-h-[52px]',
                  isActive
                    ? "bg-white text-blue-600 border-2 border-blue-600 shadow-md"
                    : "text-gray-700 hover:bg-black/[0.02]"
                )}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className={cn(
                    'p-1.5 sm:p-2 rounded-lg',
                    isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-gray-400'
                  )}>
                    {category.icon}
                  </span>
                  <span className="font-medium text-sm sm:text-base">{category.label}</span>
                </div>
                {category.hasSubOptions && (
                  <ChevronRight strokeWidth={3} className={cn(
                    "w-5 h-5 transition-transform",
                    isActive ? "text-white/70" : "text-gray-400",
                    clickedCategory === category.id && "rotate-90"
                  )} />
                )}
              </button>

              {/* Sub-menu for listing type - skip for workers/services */}
              <AnimatePresence>
                {clickedCategory === category.id && category.hasSubOptions && category.id !== 'services' && (
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
                              ? cn('bg-gradient-to-r', category.color, 'text-white')
                              : isDark
                                ? cn('hover:bg-white/10 bg-white/5', category.inactiveColor)
                                : cn('hover:bg-black/5 bg-black/[0.03]', category.inactiveColor)
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
          );
          })}
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
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 h-8 sm:h-9 rounded-lg transition-all duration-200 touch-manipulation',
          hasActiveFilters && 'ring-1 ring-pink-500/30'
        )}
        style={{
          backgroundColor: hasActiveFilters
            ? (isDark ? 'rgba(236, 72, 153, 0.15)' : '#ffffff')
            : glassBg,
          border: hasActiveFilters
            ? (isDark ? '1px solid rgba(236, 72, 153, 0.3)' : '1.5px solid #ec4899')
            : glassBorder,
          boxShadow: floatingShadow,
        }}
      >
        <QuickFilterText hasActiveFilters={hasActiveFilters} isDark={isDark} />
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

      {/* Dropdown - Snappier Spring */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10001] bg-black/5 dark:bg-black/20 backdrop-blur-[2px]"
              onClick={() => {
                setIsOpen(false);
                setClickedCategory(null);
              }}
            />

            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 550, damping: 35 }}
              className="fixed left-3 top-16 z-[10002] sm:left-1/2 sm:-translate-x-1/2 origin-top"
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
