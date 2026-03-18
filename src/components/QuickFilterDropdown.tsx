import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Bike, Wrench, X, Users, User, Briefcase, ShoppingBag, CheckCircle2, SlidersHorizontal } from 'lucide-react';
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
  description: string;
  icon: React.ReactNode;
  hasSubOptions: boolean;
  gradient: string;
  iconBg: string;
  activeText: string;
};

const categoryOptionBase: CategoryOption[] = [
  {
    id: 'property',
    label: 'Property',
    description: 'Houses & Apartments',
    icon: <Home strokeWidth={2.5} className="w-5 h-5" />,
    hasSubOptions: true,
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-500/15',
    activeText: 'text-pink-400',
  },
  {
    id: 'motorcycle',
    label: 'Motorcycle',
    description: 'Bikes & Scooters',
    icon: <MotorcycleIcon className="w-5 h-5" />,
    hasSubOptions: true,
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'bg-orange-500/15',
    activeText: 'text-orange-400',
  },
  {
    id: 'bicycle',
    label: 'Bicycle',
    description: 'Bikes & E-bikes',
    icon: <Bike strokeWidth={2.5} className="w-5 h-5" />,
    hasSubOptions: true,
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-500/15',
    activeText: 'text-emerald-400',
  },
  {
    id: 'services',
    label: 'Workers',
    description: 'Freelancers & Services',
    icon: <Wrench strokeWidth={2.5} className="w-5 h-5" />,
    hasSubOptions: false,
    gradient: 'from-purple-500 to-violet-600',
    iconBg: 'bg-purple-500/15',
    activeText: 'text-purple-400',
  },
];

const listingTypeOptions: { id: QuickFilterListingType; label: string; emoji: string }[] = [
  { id: 'both', label: 'Both', emoji: '✦' },
  { id: 'rent', label: 'Rent', emoji: '🔑' },
  { id: 'sale', label: 'Buy', emoji: '🏷️' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode; gradient: string; activeRing: string }[] = [
  { id: 'any', label: 'All', icon: <Users strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-slate-500 to-gray-600', activeRing: 'ring-slate-400/50' },
  { id: 'female', label: 'Women', icon: <User strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-pink-500 to-rose-500', activeRing: 'ring-pink-400/50' },
  { id: 'male', label: 'Men', icon: <User strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-blue-500 to-indigo-600', activeRing: 'ring-blue-400/50' },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode; gradient: string; activeRing: string }[] = [
  { id: 'all', label: 'All Types', icon: <Users strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-slate-500 to-gray-600', activeRing: 'ring-slate-400/50' },
  { id: 'hire', label: 'Hiring', icon: <Briefcase strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-purple-500 to-violet-600', activeRing: 'ring-purple-400/50' },
  { id: 'rent', label: 'Renting', icon: <Home strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-orange-500 to-amber-500', activeRing: 'ring-orange-400/50' },
  { id: 'buy', label: 'Buying', icon: <ShoppingBag strokeWidth={2.5} className="w-4 h-4" />, gradient: 'from-emerald-500 to-green-600', activeRing: 'ring-emerald-400/50' },
];

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

  const panelBg = isDark
    ? 'rgba(18, 18, 24, 0.97)'
    : 'rgba(255, 255, 255, 0.98)';
  const panelBorder = isDark
    ? '1px solid rgba(255, 255, 255, 0.08)'
    : '1px solid rgba(0, 0, 0, 0.07)';
  const panelShadow = isDark
    ? '0 24px 60px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4)'
    : '0 24px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)';

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

  // Count active filters
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

  const handleCategoryPillClick = (categoryId: QuickFilterCategory) => {
    if (categoryId === 'services') {
      setCategories([categoryId]);
      setListingType('both');
      setClickedCategory(null);
      setIsOpen(false);
      return;
    }
    const isAlreadyActive = categories.includes(categoryId) && clickedCategory === categoryId;
    if (isAlreadyActive) {
      setClickedCategory(null);
    } else {
      setCategories([categoryId]);
      setClickedCategory(categoryId);
    }
  };

  const handleListingTypeSelect = (categoryId: QuickFilterCategory, lt: QuickFilterListingType) => {
    setCategories([categoryId]);
    setListingType(lt);
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

  // ─── OWNER FILTER PANEL ────────────────────────────────────────────────────
  const renderOwnerFilters = () => {
    const hasActiveOwnerFilters = clientGender !== 'any' || clientType !== 'all';

    return (
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ background: panelBg, border: panelBorder, boxShadow: panelShadow }}
        className="w-[min(calc(100vw-1.5rem),340px)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3.5",
          isDark ? "border-b border-white/[0.06]" : "border-b border-black/[0.05]"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center",
              isDark ? "bg-white/10" : "bg-black/[0.06]"
            )}>
              <SlidersHorizontal className={cn("w-3.5 h-3.5", isDark ? "text-white/70" : "text-foreground/70")} strokeWidth={2.5} />
            </div>
            <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-foreground")}>
              Filter Clients
            </span>
          </div>
          {hasActiveOwnerFilters && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold touch-manipulation transition-all"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #f97316)',
                color: 'white',
              }}
            >
              <X className="w-3 h-3" />
              Clear
            </motion.button>
          )}
        </div>

        <div className="p-4 space-y-5">
          {/* ── Gender ─────────────────────────────── */}
          <div>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5",
              isDark ? "text-white/40" : "text-foreground/40"
            )}>
              Gender
            </p>
            <div className="flex gap-2">
              {genderOptions.map((opt) => {
                const isActive = clientGender === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleGenderSelect(opt.id)}
                    className={cn(
                      'relative flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 touch-manipulation overflow-hidden',
                      isActive
                        ? 'text-white ring-2 ' + opt.activeRing
                        : isDark
                          ? 'text-white/60 bg-white/[0.05] hover:bg-white/[0.08]'
                          : 'text-foreground/60 bg-black/[0.04] hover:bg-black/[0.07]'
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${opt.gradient.includes('slate') ? '#64748b, #4b5563' : opt.gradient.includes('pink') ? '#ec4899, #f43f5e' : '#3b82f6, #4f46e5'})`,
                    } : {}}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Client Type ────────────────────────── */}
          <div>
            <p className={cn(
              "text-[10px] font-bold uppercase tracking-[0.12em] mb-2.5",
              isDark ? "text-white/40" : "text-foreground/40"
            )}>
              Looking For
            </p>
            <div className="grid grid-cols-2 gap-2">
              {clientTypeOptions.map((opt) => {
                const isActive = clientType === opt.id;
                const gradColors: Record<string, string> = {
                  'from-slate-500 to-gray-600': '#64748b, #4b5563',
                  'from-purple-500 to-violet-600': '#a855f7, #7c3aed',
                  'from-orange-500 to-amber-500': '#f97316, #f59e0b',
                  'from-emerald-500 to-green-600': '#10b981, #16a34a',
                };
                const gradStr = gradColors[opt.gradient] || '#64748b, #4b5563';
                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => handleClientTypeSelect(opt.id)}
                    className={cn(
                      'relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 touch-manipulation overflow-hidden',
                      isActive
                        ? 'text-white ring-2 ' + opt.activeRing
                        : isDark
                          ? 'text-white/60 bg-white/[0.05] hover:bg-white/[0.08]'
                          : 'text-foreground/60 bg-black/[0.04] hover:bg-black/[0.07]'
                    )}
                    style={isActive ? { background: `linear-gradient(135deg, ${gradStr})` } : {}}
                  >
                    <span className={cn(
                      "flex-shrink-0",
                      isActive ? "opacity-90" : ""
                    )}>
                      {opt.icon}
                    </span>
                    <span className="truncate">{opt.label}</span>
                    {isActive && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto flex-shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white/80" />
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // ─── CLIENT FILTER PANEL ──────────────────────────────────────────────────
  const renderClientFilters = () => {
    const isAllActive = categories.length === 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ background: panelBg, border: panelBorder, boxShadow: panelShadow }}
        className="w-[min(calc(100vw-1.5rem),360px)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-4 py-3.5",
          isDark ? "border-b border-white/[0.06]" : "border-b border-black/[0.05]"
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center",
              isDark ? "bg-white/10" : "bg-black/[0.06]"
            )}>
              <SlidersHorizontal className={cn("w-3.5 h-3.5", isDark ? "text-white/70" : "text-foreground/70")} strokeWidth={2.5} />
            </div>
            <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-foreground")}>
              Quick Filter
            </span>
          </div>
          {!isAllActive && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold touch-manipulation"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)', color: 'white' }}
            >
              <X className="w-3 h-3" />
              Clear
            </motion.button>
          )}
        </div>

        <div className="p-3 space-y-2">
          {/* ALL card — full width */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleClearFilters}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-manipulation',
              isAllActive
                ? 'text-white'
                : isDark
                  ? 'text-white/70 hover:bg-white/[0.06] bg-white/[0.03]'
                  : 'text-foreground/70 hover:bg-black/[0.05] bg-black/[0.025]'
            )}
            style={isAllActive ? {
              background: 'linear-gradient(135deg, #334155, #1e293b)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            } : {}}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              isAllActive ? "bg-white/20" : isDark ? "bg-white/[0.07]" : "bg-black/[0.06]"
            )}>
              <span className="text-base">✦</span>
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm">All Categories</div>
              <div className={cn("text-xs mt-0.5", isAllActive ? "text-white/60" : isDark ? "text-white/35" : "text-foreground/40")}>
                Show everything
              </div>
            </div>
            {isAllActive && <CheckCircle2 className="w-5 h-5 text-white/70 flex-shrink-0" />}
          </motion.button>

          {/* Category cards — 2-column grid */}
          <div className="grid grid-cols-2 gap-2">
            {categoryOptionBase.map((cat, index) => {
              const isActive = categories.includes(cat.id);
              const isExpanded = clickedCategory === cat.id && isActive && cat.hasSubOptions && cat.id !== 'services';

              const gradColorMap: Record<string, string> = {
                'from-pink-500 to-rose-600': '#ec4899, #e11d48',
                'from-orange-500 to-amber-600': '#f97316, #d97706',
                'from-emerald-500 to-green-600': '#10b981, #16a34a',
                'from-purple-500 to-violet-600': '#a855f7, #7c3aed',
              };
              const gradStr = gradColorMap[cat.gradient] || '#ec4899, #e11d48';

              return (
                <motion.div key={cat.id} layout>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleCategoryPillClick(cat.id)}
                    className={cn(
                      'w-full flex flex-col items-start gap-2 p-3.5 rounded-xl transition-all duration-200 touch-manipulation overflow-hidden relative',
                      isActive
                        ? 'text-white'
                        : isDark
                          ? 'text-white/70 bg-white/[0.04] hover:bg-white/[0.07]'
                          : 'text-foreground/70 bg-black/[0.025] hover:bg-black/[0.05]'
                    )}
                    style={isActive ? {
                      background: `linear-gradient(135deg, ${gradStr})`,
                      boxShadow: `0 6px 20px rgba(0,0,0,0.2)`,
                    } : {}}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center",
                      isActive ? "bg-white/20" : isDark ? "bg-white/[0.08]" : cat.iconBg
                    )}>
                      <span className={cn(isActive ? "text-white" : isDark ? "text-white/70" : cat.activeText)}>
                        {cat.icon}
                      </span>
                    </div>

                    {/* Label + description */}
                    <div className="text-left w-full">
                      <div className="font-bold text-sm leading-tight">{cat.label}</div>
                      <div className={cn("text-[10px] mt-0.5 leading-tight", isActive ? "text-white/60" : isDark ? "text-white/30" : "text-foreground/40")}>
                        {cat.description}
                      </div>
                    </div>

                    {/* Active check */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2.5 right-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white/80" />
                      </motion.div>
                    )}
                  </motion.button>

                  {/* Listing type sub-chips — span full width via absolute trick using col-span */}
                </motion.div>
              );
            })}
          </div>

          {/* Listing type chips — rendered outside the grid when a category is active */}
          <AnimatePresence>
            {clickedCategory && categories.includes(clickedCategory) && clickedCategory !== 'services' && (
              <motion.div
                key="listing-type-row"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="overflow-hidden"
              >
                {(() => {
                  const activeCat = categoryOptionBase.find(c => c.id === clickedCategory);
                  const gradColorMap: Record<string, string> = {
                    'from-pink-500 to-rose-600': '#ec4899, #e11d48',
                    'from-orange-500 to-amber-600': '#f97316, #d97706',
                    'from-emerald-500 to-green-600': '#10b981, #16a34a',
                    'from-purple-500 to-violet-600': '#a855f7, #7c3aed',
                  };
                  const gradStr = activeCat ? (gradColorMap[activeCat.gradient] || '#ec4899, #e11d48') : '#ec4899, #e11d48';

                  return (
                    <div className="flex gap-2 pt-1">
                      {listingTypeOptions.map((lt) => {
                        const isLtActive = listingType === lt.id;
                        return (
                          <motion.button
                            key={lt.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => handleListingTypeSelect(clickedCategory, lt.id)}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 touch-manipulation',
                              isLtActive
                                ? 'text-white'
                                : isDark
                                  ? 'text-white/60 bg-white/[0.06] hover:bg-white/[0.1]'
                                  : 'text-foreground/60 bg-black/[0.04] hover:bg-black/[0.07]'
                            )}
                            style={isLtActive ? {
                              background: `linear-gradient(135deg, ${gradStr})`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            } : {}}
                          >
                            <span>{lt.emoji}</span>
                            <span>{lt.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={cn('relative', className)}>
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
        <span className={cn(
          "hidden sm:inline font-black text-sm tracking-tight whitespace-nowrap uppercase",
          hasActiveFilters ? "text-pink-600" : isDark ? "text-white" : "text-slate-700"
        )}>
          Quick Filter
        </span>
        <span className={cn(
          "sm:hidden font-black text-xs tracking-tight whitespace-nowrap uppercase",
          hasActiveFilters ? "text-pink-600" : isDark ? "text-white" : "text-slate-700"
        )}>
          Quick Filter
        </span>
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
            <div
              className="fixed inset-0 z-[10001] bg-transparent"
              onClick={() => {
                setIsOpen(false);
                setClickedCategory(null);
              }}
            />
            <div
              ref={dropdownRef}
              className="fixed left-3 top-16 z-[10002] sm:left-auto sm:top-auto sm:absolute sm:mt-2"
            >
              {userRole === 'owner' ? renderOwnerFilters() : renderClientFilters()}
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export const QuickFilterDropdown = memo(QuickFilterDropdownComponent);
