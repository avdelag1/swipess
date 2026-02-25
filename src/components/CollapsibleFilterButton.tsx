import { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Home, Car, Anchor, Bike, Wrench, Users, User, Briefcase, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
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

interface CollapsibleFilterButtonProps {
  filters: QuickFilters;
  onChange: (filters: QuickFilters) => void;
  userRole: 'client' | 'owner';
  className?: string;
}

const categories: { id: QuickFilterCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'property', label: 'Property', icon: <Home className="w-4 h-4" /> },
  { id: 'motorcycle', label: 'Moto', icon: <MotorcycleIcon className="w-4 h-4" /> },
  { id: 'bicycle', label: 'Bicycle', icon: <Bike className="w-4 h-4" /> },
  { id: 'services', label: 'Services', icon: <Wrench className="w-4 h-4" /> },
];

const listingTypes: { id: QuickFilterListingType; label: string }[] = [
  { id: 'both', label: 'All' },
  { id: 'rent', label: 'Rent' },
  { id: 'sale', label: 'Buy' },
];

const genderOptions: { id: OwnerClientGender; label: string; icon: React.ReactNode }[] = [
  { id: 'any', label: 'All', icon: <Users className="w-4 h-4" /> },
  { id: 'female', label: 'Women', icon: <User className="w-4 h-4" /> },
  { id: 'male', label: 'Men', icon: <User className="w-4 h-4" /> },
];

const clientTypeOptions: { id: OwnerClientType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'hire', label: 'Hiring', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'rent', label: 'Renting', icon: <Briefcase className="w-4 h-4" /> },
  { id: 'buy', label: 'Buying', icon: <Briefcase className="w-4 h-4" /> },
];

function CollapsibleFilterButtonComponent({ filters, onChange, userRole, className }: CollapsibleFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Count active filters
  const activeFilterCount = (() => {
    let count = 0;
    if (userRole === 'client') {
      count += filters.categories.length;
      if (filters.listingType !== 'both') count += 1;
    } else {
      if (filters.clientGender && filters.clientGender !== 'any') count += 1;
      if (filters.clientType && filters.clientType !== 'all') count += 1;
    }
    return count;
  })();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryToggle = (categoryId: QuickFilterCategory) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(c => c !== categoryId)
      : [...filters.categories, categoryId];
    onChange({ ...filters, categories: newCategories });
  };

  const handleListingTypeChange = (type: QuickFilterListingType) => {
    onChange({ ...filters, listingType: type });
  };

  const handleGenderChange = (gender: OwnerClientGender) => {
    onChange({ ...filters, clientGender: gender });
  };

  const handleClientTypeChange = (type: OwnerClientType) => {
    onChange({ ...filters, clientType: type });
  };

  const handleReset = () => {
    onChange({
      categories: [],
      listingType: 'both',
      clientGender: 'any',
      clientType: 'all',
    });
  };

  return (
    <div className={cn('relative', className)}>
      {/* Filter Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200',
          activeFilterCount > 0
            ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25'
            : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/10'
        )}
      >
        <Filter className="w-4 h-4" />
        {/* Badge */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-background"
            >
              {activeFilterCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - transparent to allow visibility of header/bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[10001]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-background border-r border-border shadow-2xl z-[10002] flex flex-col"
              style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold">Quick Filter</h2>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReset}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {userRole === 'client' ? (
                  <>
                    {/* Categories */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => {
                          const isActive = filters.categories.includes(category.id);
                          return (
                            <motion.button
                              key={category.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleCategoryToggle(category.id)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
                              )}
                            >
                              {category.icon}
                              <span>{category.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Listing Type */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Listing Type</h3>
                      <div className="flex gap-2">
                        {listingTypes.map((type) => {
                          const isActive = filters.listingType === type.id;
                          return (
                            <motion.button
                              key={type.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleListingTypeChange(type.id)}
                              className={cn(
                                'flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
                              )}
                            >
                              {type.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Gender Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Client Gender</h3>
                      <div className="flex gap-2">
                        {genderOptions.map((option) => {
                          const isActive = filters.clientGender === option.id;
                          return (
                            <motion.button
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleGenderChange(option.id)}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
                              )}
                            >
                              {option.icon}
                              <span>{option.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Client Type Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Looking For</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {clientTypeOptions.map((option) => {
                          const isActive = filters.clientType === option.id;
                          return (
                            <motion.button
                              key={option.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleClientTypeChange(option.id)}
                              className={cn(
                                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-primary text-primary-foreground shadow-md'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-white/5'
                              )}
                            >
                              <span>{option.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-200"
                >
                  Apply Filters
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export const CollapsibleFilterButton = memo(CollapsibleFilterButtonComponent);
