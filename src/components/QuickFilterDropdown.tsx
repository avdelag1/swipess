import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Home, Bike, Wrench, X, Users, User, Briefcase, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useAppTheme } from '@/hooks/useAppTheme';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { haptics } from '@/utils/microPolish';
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

const categoryOptionBase: (CategoryOption & { color: string; inactiveColor: string; bgTint: string; border: string })[] = [
  { id: 'property', label: 'Property', icon: <Home strokeWidth={1.5} className="w-4 h-4" />, hasSubOptions: true, color: 'from-blue-600 to-cyan-500', inactiveColor: 'text-blue-500', bgTint: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { id: 'motorcycle', label: 'Motorcycle', icon: <MotorcycleIcon className="w-4 h-4" />, hasSubOptions: true, color: 'from-orange-600 to-amber-500', inactiveColor: 'text-orange-500', bgTint: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { id: 'bicycle', label: 'Bicycle', icon: <Bike strokeWidth={1.5} className="w-4 h-4" />, hasSubOptions: true, color: 'from-rose-600 to-rose-500', inactiveColor: 'text-rose-500', bgTint: 'bg-rose-500/15', border: 'border-rose-500/30' },
  { id: 'services', label: 'Workers', icon: <Wrench strokeWidth={1.5} className="w-4 h-4" />, hasSubOptions: true, color: 'from-purple-600 to-violet-500', inactiveColor: 'text-purple-500', bgTint: 'bg-purple-500/15', border: 'border-purple-500/30' },
];

const listingTypeOptions: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'Both' },
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode; color: string; inactiveColor: string; bgTint: string; border: string }[] = [
  { id: 'any', label: 'All Genders', icon: <Users strokeWidth={1.5} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500', inactiveColor: 'text-gray-500', bgTint: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { id: 'female', label: 'Women', icon: <User strokeWidth={1.5} className="w-4 h-4" />, color: 'from-pink-500 to-rose-500', inactiveColor: 'text-pink-500', bgTint: 'bg-pink-500/15', border: 'border-pink-500/30' },
  { id: 'male', label: 'Men', icon: <User strokeWidth={1.5} className="w-4 h-4" />, color: 'from-blue-500 to-indigo-500', inactiveColor: 'text-blue-500', bgTint: 'bg-blue-500/15', border: 'border-blue-500/30' },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode; color: string; inactiveColor: string; bgTint: string; border: string }[] = [
  { id: 'all', label: 'All Types', icon: <Users strokeWidth={1.5} className="w-4 h-4" />, color: 'from-gray-500 to-slate-500', inactiveColor: 'text-gray-500', bgTint: 'bg-gray-500/10', border: 'border-gray-500/20' },
  { id: 'hire', label: 'Hiring', icon: <Briefcase strokeWidth={1.5} className="w-4 h-4" />, color: 'from-purple-500 to-violet-500', inactiveColor: 'text-purple-500', bgTint: 'bg-purple-500/15', border: 'border-purple-500/30' },
  { id: 'rent', label: 'Renting', icon: <Home strokeWidth={1.5} className="w-4 h-4" />, color: 'from-orange-500 to-amber-500', inactiveColor: 'text-orange-500', bgTint: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { id: 'buy', label: 'Buying', icon: <Search strokeWidth={1.5} className="w-4 h-4" />, color: 'from-rose-500 to-rose-500', inactiveColor: 'text-rose-500', bgTint: 'bg-rose-500/15', border: 'border-rose-500/30' },
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
  const { theme } = useAppTheme();
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
      const target = event.target;
      const isAISearchClick = (target instanceof Element) && target.closest('#ai-search-button');
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(target as Node) &&
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
    haptics.tap();
    
    // For Owners: Direct selection (redundant sub-menus removed as they use the global 'Looking For' toggle)
    if (userRole === 'owner') {
      setCategories([categoryId]);
      setIsOpen(false);
      setClickedCategory(null);
      return;
    }

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
    haptics.success();
    setCategories([categoryId]);
    setListingType(selectedListingType);
    setIsOpen(false);
    setClickedCategory(null);
  };

  const handleGenderSelect = (gender: OwnerClientGender) => {
    haptics.tap();
    setClientGender(gender);
  };

  const handleClientTypeSelect = (type: OwnerClientType) => {
    haptics.tap();
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
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-[min(calc(100vw-1.5rem),360px)]">
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
          {/* Categories */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Category</p>
            <div className="grid grid-cols-2 gap-1.5">
              {/* ALL option for owner */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  haptics.tap();
                  handleClearFilters();
                }}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-75 touch-manipulation border',
                  categories.length === 0
                    ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                    : isDark ? 'bg-white/5 border-border text-foreground hover:bg-white/10' : 'bg-black/[0.03] border-border text-gray-700 hover:bg-black/[0.05]'
                )}
              >
                <Search className="w-4 h-4" />
                <span>All</span>
              </motion.button>
              
              {categoryOptionBase.map((option) => {
                const isActive = categories.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategoryClick(option.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-75 touch-manipulation border',
                      isActive
                        ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                        : cn('transition-all duration-200', option.inactiveColor, option.bgTint, option.border, 'hover:border-border/80')
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Gender</p>
            <div className="flex gap-1.5">
              {genderOptions.map((option) => {
                const isActive = clientGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleGenderSelect(option.id)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold transition-all duration-75 touch-manipulation border',
                      isActive
                        ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                        : cn('transition-all duration-200', option.inactiveColor, option.bgTint, option.border, 'hover:border-border/80')
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </motion.button>
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
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClientTypeSelect(option.id)}
                    className={cn(
                      'flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-75 touch-manipulation border',
                      isActive
                        ? 'bg-gradient-to-br from-rose-500 via-rose-600 to-orange-500 text-white border-transparent shadow-lg shadow-rose-500/20'
                        : cn('transition-all duration-200', option.inactiveColor, option.bgTint, option.border, 'hover:border-border/80')
                    )}
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </motion.button>
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
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 sm:py-5 border-b border-border">
          <span className="text-base sm:text-lg font-semibold text-foreground">Select Category</span>
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
        <div className="py-3 max-h-[60vh] overflow-y-auto">
          {/* ALL option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0 }}
            className="relative"
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { haptics.tap(); handleClearFilters(); }}
              className={cn(
                'w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-base transition-all duration-200 touch-manipulation min-h-[64px]',
                isAllActive
                  ? 'bg-slate-700 text-white'
                  : isDark
                    ? 'text-foreground hover:bg-white/5'
                    : 'text-gray-700 hover:bg-black/[0.04]'
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <span className={cn(
                  'p-2 sm:p-2.5 rounded-xl',
                  isAllActive ? 'bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-md' : 'bg-pink-500/10 text-pink-500'
                )}>
                  <Search strokeWidth={1.5} className="w-5 h-5" />
                </span>
                <span className="font-medium text-base sm:text-lg">All</span>
              </div>
            </motion.button>
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
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 text-base transition-all duration-200 touch-manipulation min-h-[64px]',
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-white border-l-2 border-white/40'
                        : 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                      : isDark
                        ? 'text-foreground hover:bg-white/5'
                        : 'text-gray-700 hover:bg-black/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={cn(
                      'p-2 sm:p-2.5 rounded-xl border transition-all duration-300',
                      isActive
                        ? cn('bg-gradient-to-br text-white shadow-md border-transparent', category.color)
                        : cn(category.bgTint, category.inactiveColor, category.border)
                    )}>
                      {category.icon}
                    </span>
                    <span className="font-medium text-base sm:text-lg">{category.label}</span>
                  </div>
                  {category.hasSubOptions && (
                    <ChevronRight strokeWidth={1.5} className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive
                        ? isDark ? 'text-white/70' : 'text-blue-400'
                        : 'text-muted-foreground',
                      clickedCategory === category.id && "rotate-90"
                    )} />
                  )}
                </motion.button>

                {/* Accordion sub-menu for listing type */}
                <AnimatePresence>
                  {clickedCategory === category.id && category.hasSubOptions && category.id !== 'services' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.97 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 550, damping: 32, mass: 0.4 }}
                      className="overflow-hidden origin-top"
                    >
                      <div className="pl-14 sm:pl-16 pr-5 pb-3">
                        <div className="flex gap-2">
                          {listingTypeOptions.map((ltOption, ltIndex) => (
                            <motion.button
                              key={ltOption.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: ltIndex * 0.08, type: 'spring', stiffness: 400, damping: 30 }}
                              onClick={() => handleCategorySelect(category.id, ltOption.id)}
                              className={cn(
                                'flex-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-manipulation min-h-[48px]',
                                categories.includes(category.id) && listingType === ltOption.id
                                  ? cn('bg-gradient-to-r shadow-md', category.color, 'text-white')
                                  : isDark
                                    ? cn('hover:bg-white/10 bg-white/5', category.inactiveColor)
                                    : cn('hover:bg-black/5 bg-black/[0.03]', category.inactiveColor)
                              )}
                            >
                              <span className="text-sm sm:text-base">{ltOption.label}</span>
                            </motion.button>
                          ))}
                        </div>
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
        onClick={() => { haptics.tap(); setIsOpen(!isOpen); }}
        className={cn(
          'relative flex items-center gap-1 sm:gap-2 px-3 sm:px-5 h-9 sm:h-10 rounded-xl transition-all duration-300 touch-manipulation group overflow-hidden text-sm',
          hasActiveFilters && 'shadow-lg shadow-rose-500/20'
        )}
        style={{
          background: glassBg,
          border: hasActiveFilters
            ? 'none' // Handled by gradient border div
            : glassBorder,
          boxShadow: hasActiveFilters ? '0 10px 25px -5px rgba(244, 63, 94, 0.2)' : floatingShadow,
        }}
      >
        {hasActiveFilters && (
          <div className="absolute inset-0 rounded-xl p-[1.5px] bg-gradient-to-r from-pink-500 via-rose-600 to-orange-500 -z-10">
            <div className={cn("w-full h-full rounded-[10px]", isDark ? "bg-zinc-900" : "bg-white")} />
          </div>
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
        )} strokeWidth={1.5} />
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
              initial={{ opacity: 0, y: -10, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 520, damping: 32, mass: 0.35 }}
              className="fixed left-3 top-28 z-[10002] sm:left-1/2 sm:-translate-x-1/2 origin-top-left sm:origin-top"
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


