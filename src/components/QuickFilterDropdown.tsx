import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Bike, Wrench, X, Users, User, Briefcase, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '@/hooks/useTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import type { QuickFilterCategory, ClientGender, ClientType } from '@/types/filters';

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

const categoryOptionBase: (CategoryOption & { color: string; inactiveColor: string; bgTint: string })[] = [
  { id: 'property', label: 'Property', icon: <Home strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-blue-600 to-cyan-500', inactiveColor: 'text-blue-500', bgTint: 'bg-blue-500/10' },
  { id: 'motorcycle', label: 'Motorcycle', icon: <MotorcycleIcon className="w-4 h-4" />, hasSubOptions: true, color: 'from-orange-600 to-amber-500', inactiveColor: 'text-orange-500', bgTint: 'bg-orange-500/10' },
  { id: 'bicycle', label: 'Bicycle', icon: <Bike strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-rose-600 to-rose-500', inactiveColor: 'text-rose-500', bgTint: 'bg-rose-500/10' },
  { id: 'services', label: 'Workers', icon: <Wrench strokeWidth={4} className="w-4 h-4" />, hasSubOptions: true, color: 'from-purple-600 to-violet-500', inactiveColor: 'text-purple-500', bgTint: 'bg-purple-500/10' },
];

const listingTypeOptions: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode; color: string; inactiveColor: string; bgTint: string }[] = [
  { id: 'any', label: 'All Genders', icon: <Users strokeWidth={4} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500', inactiveColor: 'text-gray-500', bgTint: 'bg-gray-500/10' },
  { id: 'female', label: 'Women', icon: <User strokeWidth={4} className="w-4 h-4" />, color: 'from-pink-500 to-rose-500', inactiveColor: 'text-pink-500', bgTint: 'bg-pink-500/10' },
  { id: 'male', label: 'Men', icon: <User strokeWidth={4} className="w-4 h-4" />, color: 'from-blue-500 to-indigo-500', inactiveColor: 'text-blue-500', bgTint: 'bg-blue-500/10' },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode; color: string; inactiveColor: string; bgTint: string }[] = [
  { id: 'all', label: 'All Types', icon: <Users strokeWidth={4} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500', inactiveColor: 'text-gray-500', bgTint: 'bg-gray-500/10' },
  { id: 'hire', label: 'Hiring', icon: <Briefcase strokeWidth={4} className="w-4 h-4" />, color: 'from-purple-500 to-violet-500', inactiveColor: 'text-purple-500', bgTint: 'bg-purple-500/10' },
  { id: 'rent', label: 'Renting', icon: <Home strokeWidth={4} className="w-4 h-4" />, color: 'from-orange-500 to-amber-500', inactiveColor: 'text-orange-500', bgTint: 'bg-orange-500/10' },
  { id: 'buy', label: 'Buying', icon: <Search strokeWidth={4} className="w-4 h-4" />, color: 'from-rose-500 to-rose-500', inactiveColor: 'text-rose-500', bgTint: 'bg-rose-500/10' },
];

const QuickFilterText = ({ hasActiveFilters, isDark }: { hasActiveFilters: boolean; isDark: boolean }) => (
  <span className={cn(
    "font-black text-sm sm:text-base tracking-tight whitespace-nowrap uppercase italic",
    hasActiveFilters
      ? "bg-gradient-to-r from-pink-500 via-rose-600 to-orange-500 bg-clip-text text-transparent"
      : isDark ? "text-white/90" : "text-slate-800"
  )}>
    Quick Filter
  </span>
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

  const { categories, listingType, clientGender, clientType } = useFilterStore(
    useShallow((state) => ({
      categories: state.categories,
      listingType: state.listingType,
      clientGender: state.clientGender,
      clientType: state.clientType,
    }))
  );

  const { setCategories, setListingType, setClientGender, setClientType, resetClientFilters, resetOwnerFilters } = useFilterStore(
    useShallow((state) => ({
      setCategories: state.setCategories,
      setListingType: state.setListingType,
      setClientGender: state.setClientGender,
      setClientType: state.setClientType,
      resetClientFilters: state.resetClientFilters,
      resetOwnerFilters: state.resetOwnerFilters,
    }))
  );

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
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
    if (categoryId === 'services') {
      setCategories([categoryId]);
      setListingType('both');
      setIsOpen(false);
      setClickedCategory(null);
      return;
    }
    setClickedCategory(clickedCategory === categoryId ? null : categoryId);
  };

  const handleCategorySelect = (categoryId: QuickFilterCategory, selectedListingType: QuickFilterListingType) => {
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

  // ── OWNER PANEL ──────────────────────────────────────────────────────────
  const renderOwnerFilters = () => {
    return (
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-[min(calc(100vw-1.5rem),340px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filter Clients</span>
          </div>
          {activeFilterCount > 0 && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white transition-colors touch-manipulation"
            >
              Clear
            </motion.button>
          )}
        </div>

        <div className="py-3 px-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Gender */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Gender</p>
            <div className="flex gap-1.5">
              {genderOptions.map((option) => {
                const isActive = clientGender === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleGenderSelect(option.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-150 touch-manipulation border',
                      isActive
                        ? cn('bg-gradient-to-br text-white border-transparent ring-2 ring-offset-1', option.color,
                            isDark ? 'ring-white/20' : 'ring-black/10')
                        : cn('border-border hover:border-border/80 transition-all duration-200', option.inactiveColor, option.bgTint)
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Type */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Looking For</p>
            <div className="grid grid-cols-2 gap-1.5">
              {clientTypeOptions.map((option) => {
                const isActive = clientType === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleClientTypeSelect(option.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 touch-manipulation border',
                      isActive
                        ? cn('bg-gradient-to-br text-white border-transparent ring-2 ring-offset-1', option.color,
                            isDark ? 'ring-white/20' : 'ring-black/10')
                        : cn('border-border hover:border-border/80 transition-all duration-200', option.inactiveColor, option.bgTint)
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── CLIENT PANEL — original icon-list + accordion style ──────────────────
  const renderClientFilters = () => {
    const isAllActive = categories.length === 0;
    return (
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-[min(calc(100vw-1.5rem),400px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
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

        {/* Category list */}
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
                  : isDark
                    ? 'text-foreground hover:bg-white/5'
                    : 'text-gray-700 hover:bg-black/[0.04]'
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={cn(
                  'p-1.5 sm:p-2 rounded-lg',
                  isAllActive ? 'bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-md' : 'bg-pink-500/10 text-pink-500'
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
                      ? isDark
                        ? 'bg-white/10 text-white border-l-2 border-white/40'
                        : 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                      : isDark
                        ? 'text-foreground hover:bg-white/5'
                        : 'text-gray-700 hover:bg-black/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={cn(
                      'p-1.5 sm:p-2 rounded-lg',
                      isActive
                        ? cn('bg-gradient-to-br text-white shadow-md', category.color)
                        : cn(category.bgTint, category.inactiveColor)
                    )}>
                      {category.icon}
                    </span>
                    <span className="font-medium text-sm sm:text-base">{category.label}</span>
                  </div>
                  {category.hasSubOptions && (
                    <ChevronRight strokeWidth={3} className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive
                        ? isDark ? 'text-white/70' : 'text-blue-400'
                        : 'text-muted-foreground',
                      clickedCategory === category.id && "rotate-90"
                    )} />
                  )}
                </button>

                {/* Accordion sub-menu for listing type */}
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
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 h-10 sm:h-11 rounded-2xl transition-all duration-300 touch-manipulation group overflow-hidden',
          hasActiveFilters && 'shadow-lg shadow-rose-500/20'
        )}
        style={{
          background: hasActiveFilters
            ? (isDark 
                ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)' 
                : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)')
            : glassBg,
          border: hasActiveFilters
            ? (isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '2px solid transparent')
            : glassBorder,
          boxShadow: floatingShadow,
        }}
      >
        {hasActiveFilters && !isDark && (
          <div className="absolute inset-0 p-[2px] rounded-2xl bg-gradient-to-r from-pink-500 via-rose-600 to-orange-500 -z-10" />
        )}
        
        <QuickFilterText hasActiveFilters={hasActiveFilters} isDark={isDark} />
        
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              className="bg-gradient-to-br from-orange-500 to-pink-600 text-white text-[10px] sm:text-xs font-black rounded-lg w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-md shadow-pink-500/40"
            >
              {activeFilterCount}
            </motion.span>
          )}
        </AnimatePresence>
        
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform duration-300",
          isOpen ? "rotate-90" : "rotate-0",
          hasActiveFilters ? "text-rose-500" : "text-muted-foreground"
        )} strokeWidth={3} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-[10001] bg-transparent"
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
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed left-3 top-20 z-[10002] sm:left-1/2 sm:-translate-x-1/2"
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
