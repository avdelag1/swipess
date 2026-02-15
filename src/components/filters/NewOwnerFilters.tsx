import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, SlidersHorizontal, DollarSign, Calendar, Heart, Users, User, Check,
  ChevronDown, Shield, Activity, Briefcase, UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * CINEMATIC OWNER FILTERS — Premium Bottom Sheet
 *
 * Focus: WHO the owner wants to attract
 * - Budget range slider
 * - Move-in timeframe segmented control
 * - Gender & client type pills
 * - Match score threshold
 * - Active-only toggle
 * - Expandable sections
 * - Glassmorphic 32px rounded sheet
 */

interface OwnerFilters {
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeframe?: 'immediate' | '1-month' | '3-months' | 'flexible' | 'any';
  clientGender?: 'all' | 'male' | 'female' | 'other';
  clientType?: 'all' | 'individual' | 'family' | 'business';
  matchScoreMin?: number;
  activeOnly?: boolean;
}

interface NewOwnerFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: OwnerFilters) => void;
  currentFilters?: OwnerFilters;
}

// Expandable section
function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: typeof Users;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/50 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Segmented control
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
      {options.map((opt) => {
        const isActive = value === opt.id || (!value && opt.id === options[0].id);
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Option card with icon
function OptionCard({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: typeof User;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 py-3 px-3 rounded-2xl border transition-all duration-200",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border/40 bg-card/40 hover:border-primary/30"
      )}
    >
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5"
        >
          <Check className="h-2.5 w-2.5 text-primary-foreground" />
        </motion.div>
      )}
      <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className={cn("text-[11px] font-semibold", isActive ? "text-primary" : "text-foreground")}>{label}</span>
    </motion.button>
  );
}

export function NewOwnerFilters({ open, onClose, onApply, currentFilters = {} }: NewOwnerFiltersProps) {
  const [filters, setFilters] = useState<OwnerFilters>(currentFilters);

  const handleApply = () => { onApply(filters); onClose(); };
  const handleReset = () => { setFilters({}); };

  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.budgetMin || filters.budgetMax) c++;
    if (filters.moveInTimeframe && filters.moveInTimeframe !== 'any') c++;
    if (filters.clientGender && filters.clientGender !== 'all') c++;
    if (filters.clientType && filters.clientType !== 'all') c++;
    if (filters.matchScoreMin && filters.matchScoreMin > 0) c++;
    if (filters.activeOnly) c++;
    return c;
  }, [filters]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[10001] backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl rounded-t-[32px] shadow-[0_-10px_60px_rgba(0,0,0,0.3)] border-t border-border/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-2.5">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Client Filters</h2>
                {activeFilterCount > 0 && (
                  <p className="text-[11px] text-primary font-medium">
                    {activeFilterCount} active
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground h-8">
                  Reset
                </Button>
              )}
              <button
                onClick={onClose}
                className="rounded-xl bg-muted/50 p-2 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="max-h-[65vh]">
            <div className="px-5 pb-28 space-y-4">

              {/* Budget Range */}
              <FilterSection title="Client Budget" icon={DollarSign} defaultOpen>
                <Slider
                  min={0}
                  max={10000}
                  step={500}
                  value={[filters.budgetMin || 0, filters.budgetMax || 10000]}
                  onValueChange={([min, max]) => setFilters({ ...filters, budgetMin: min, budgetMax: max })}
                  className="w-full"
                />
                <div className="flex justify-between">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    ${filters.budgetMin || 0}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                    ${filters.budgetMax || 10000}
                  </span>
                </div>
              </FilterSection>

              {/* Move-in Timeframe */}
              <FilterSection title="Move-in Timeframe" icon={Calendar} defaultOpen>
                <SegmentedControl
                  options={[
                    { id: 'any' as const, label: 'Any' },
                    { id: 'immediate' as const, label: 'Now' },
                    { id: '1-month' as const, label: '1 Mo' },
                    { id: '3-months' as const, label: '3 Mo' },
                    { id: 'flexible' as const, label: 'Flex' },
                  ]}
                  value={filters.moveInTimeframe}
                  onChange={(v) => setFilters({ ...filters, moveInTimeframe: v })}
                />
              </FilterSection>

              {/* Gender */}
              <FilterSection title="Gender Preference" icon={Users}>
                <div className="grid grid-cols-4 gap-2">
                  <OptionCard
                    label="All"
                    icon={Users}
                    isActive={!filters.clientGender || filters.clientGender === 'all'}
                    onClick={() => setFilters({ ...filters, clientGender: 'all' })}
                  />
                  <OptionCard
                    label="Men"
                    icon={User}
                    isActive={filters.clientGender === 'male'}
                    onClick={() => setFilters({ ...filters, clientGender: 'male' })}
                  />
                  <OptionCard
                    label="Women"
                    icon={UserCircle}
                    isActive={filters.clientGender === 'female'}
                    onClick={() => setFilters({ ...filters, clientGender: 'female' })}
                  />
                  <OptionCard
                    label="Other"
                    icon={User}
                    isActive={filters.clientGender === 'other'}
                    onClick={() => setFilters({ ...filters, clientGender: 'other' })}
                  />
                </div>
              </FilterSection>

              {/* Client Type */}
              <FilterSection title="Client Type" icon={Briefcase}>
                <div className="grid grid-cols-4 gap-2">
                  <OptionCard
                    label="All"
                    icon={Users}
                    isActive={!filters.clientType || filters.clientType === 'all'}
                    onClick={() => setFilters({ ...filters, clientType: 'all' })}
                  />
                  <OptionCard
                    label="Individual"
                    icon={User}
                    isActive={filters.clientType === 'individual'}
                    onClick={() => setFilters({ ...filters, clientType: 'individual' })}
                  />
                  <OptionCard
                    label="Family"
                    icon={Users}
                    isActive={filters.clientType === 'family'}
                    onClick={() => setFilters({ ...filters, clientType: 'family' })}
                  />
                  <OptionCard
                    label="Business"
                    icon={Briefcase}
                    isActive={filters.clientType === 'business'}
                    onClick={() => setFilters({ ...filters, clientType: 'business' })}
                  />
                </div>
              </FilterSection>

              {/* Match Score */}
              <FilterSection title="Minimum Match Score" icon={Heart}>
                <Slider
                  min={0}
                  max={100}
                  step={10}
                  value={[filters.matchScoreMin || 0]}
                  onValueChange={([v]) => setFilters({ ...filters, matchScoreMin: v })}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">0%</span>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                    {filters.matchScoreMin || 0}%
                  </span>
                  <span className="text-xs text-muted-foreground">100%</span>
                </div>
              </FilterSection>

              {/* Active Only Toggle */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilters({ ...filters, activeOnly: !filters.activeOnly })}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-200",
                  filters.activeOnly
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-card/30 hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Active Clients Only</span>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full transition-colors duration-200 relative",
                  filters.activeOnly ? "bg-primary" : "bg-muted"
                )}>
                  <motion.div
                    animate={{ x: filters.activeOnly ? 16 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow-sm"
                  />
                </div>
              </motion.button>
            </div>
          </ScrollArea>

          {/* Sticky Apply Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleApply}
                className="w-full h-14 rounded-2xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              >
                Apply Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-primary-foreground/20 text-primary-foreground border-none text-xs px-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
