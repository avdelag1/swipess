import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, SlidersHorizontal, DollarSign, Calendar, Heart, Users, User, Check,
  ChevronDown, Shield, Activity, Briefcase, UserCircle, Sparkles, Home,
  Bike, CircleDot, Wrench, Target, Clock, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * CINEMATIC OWNER FILTERS — Premium Bottom Sheet
 * 
 * Styled to match client filters:
 * - Glassmorphic bottom sheet with blur backdrop
 * - Category selection with emoji cards
 * - Segmented controls
 * - Expandable/collapsible filter sections
 * - Animated pill toggles
 * - Sticky apply button with active count
 * - 32px rounded corners, premium shadows
 */

interface OwnerFilters {
  budgetMin?: number;
  budgetMax?: number;
  moveInTimeframe?: 'immediate' | '1-month' | '3-month' | 'flexible' | 'any';
  clientGender?: 'all' | 'male' | 'female' | 'other';
  clientType?: 'all' | 'individual' | 'family' | 'business';
  matchScoreMin?: number;
  activeOnly?: boolean;
  // New demographic filters
  minAge?: number;
  maxAge?: number;
  nationality?: string;
  languages?: string[];
  lifestyleTags?: string[];
  occupation?: string;
  allowsPets?: boolean;
  allowsChildren?: boolean;
  smokingHabit?: string;
  drinkingHabit?: string;
  cleanlinessLevel?: string;
}

interface NewOwnerFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: OwnerFilters) => void;
  currentFilters?: OwnerFilters;
}

// Client type categories with colors matching client side
const clientTypes = [
  { id: 'all', label: 'All Types', emoji: '👥', description: 'Show everyone' },
  { id: 'individual', label: 'Individual', emoji: '👤', description: 'Single person' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', description: 'Family looking' },
  { id: 'business', label: 'Business', emoji: '🏢', description: 'Company needs' },
];

// Gender options with emojis
const genderOptions = [
  { id: 'all', label: 'All', emoji: '🌍', description: 'Show everyone' },
  { id: 'male', label: 'Men', emoji: '👨', description: 'Male clients' },
  { id: 'female', label: 'Women', emoji: '👩', description: 'Female clients' },
  { id: 'other', label: 'Other', emoji: '🧑', description: 'Non-binary' },
];

// Lifestyle tags
const lifestyleTags = [
  'Digital Nomad', 'Professional', 'Student', 'Family-Oriented',
  'Party-Friendly', 'Quiet', 'Social', 'Health-Conscious', 'Pet Lover', 'Eco-Friendly'
];

// Occupations
const occupations = [
  'Remote Worker', 'Entrepreneur', 'Student', 'Teacher',
  'Healthcare', 'Tech', 'Creative', 'Hospitality', 'Finance', 'Retired'
];

// Expandable section component (matching client style)
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

// Segmented control (matching client style)
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

// Category card with emoji (matching client style)
function CategoryCard({
  label,
  emoji,
  description,
  isActive,
  onClick,
}: {
  label: string;
  emoji: string;
  description?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all duration-200",
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
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-semibold text-foreground">{label}</span>
      {description && (
        <span className="text-[8px] text-muted-foreground text-center">{description}</span>
      )}
    </motion.button>
  );
}

// Pill toggle (matching client style)
function PillToggle({
  label,
  emoji,
  isActive,
  onClick,
}: {
  label: string;
  emoji?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "py-2 px-3.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 border",
        isActive
          ? "bg-primary/15 border-primary/40 text-primary"
          : "bg-transparent border-border/50 text-muted-foreground hover:border-primary/30"
      )}
    >
      {emoji && <span>{emoji}</span>}
      {label}
      {isActive && <X className="h-3 w-3 ml-0.5" />}
    </motion.button>
  );
}

// Toggle switch (matching client style)
function ToggleSwitch({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon?: typeof User;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border/40 bg-card/40 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div
        className={cn(
          "w-10 h-6 rounded-full transition-colors duration-200 relative",
          isActive ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.div
          animate={{ x: isActive ? 16 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-primary-foreground shadow-sm"
        />
      </div>
    </motion.button>
  );
}

export function NewOwnerFilters({ open, onClose, onApply, currentFilters = {} }: NewOwnerFiltersProps) {
  const [filters, setFilters] = useState<OwnerFilters>(currentFilters);
  const activeLifestyleTags = new Set(filters.lifestyleTags || []);
  const activeLanguages = new Set(filters.languages || []);

  const handleLifestyleToggle = (tag: string) => {
    setFilters(prev => {
      const set = new Set(prev.lifestyleTags || []);
      if (set.has(tag)) set.delete(tag); else set.add(tag);
      return { ...prev, lifestyleTags: Array.from(set) };
    });
  };

  const handleLanguageToggle = (lang: string) => {
    setFilters(prev => {
      const set = new Set(prev.languages || []);
      if (set.has(lang)) set.delete(lang); else set.add(lang);
      return { ...prev, languages: Array.from(set) };
    });
  };

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
    if (filters.minAge || filters.maxAge) c++;
    if (filters.nationality) c++;
    if (filters.languages && filters.languages.length > 0) c++;
    if (filters.lifestyleTags && filters.lifestyleTags.length > 0) c++;
    if (filters.occupation) c++;
    if (filters.allowsPets !== undefined && filters.allowsPets !== true) c++;
    if (filters.allowsChildren !== undefined && filters.allowsChildren !== true) c++;
    if (filters.smokingHabit && filters.smokingHabit !== 'any') c++;
    if (filters.drinkingHabit && filters.drinkingHabit !== 'any') c++;
    if (filters.cleanlinessLevel && filters.cleanlinessLevel !== 'any') c++;
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
                <Filter className="h-5 w-5 text-primary" />
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

              {/* Client Type Selection — Emoji cards like client filters */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Type</span>
                <div className="grid grid-cols-4 gap-2">
                  {clientTypes.map((ct) => (
                    <CategoryCard
                      key={ct.id}
                      label={ct.label}
                      emoji={ct.emoji}
                      description={ct.description}
                      isActive={!filters.clientType || filters.clientType === 'all' ? ct.id === 'all' : filters.clientType === ct.id}
                      onClick={() => setFilters({ ...filters, clientType: ct.id as any })}
                    />
                  ))}
                </div>
              </div>

              {/* Gender Selection — Emoji cards */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gender</span>
                <div className="grid grid-cols-4 gap-2">
                  {genderOptions.map((g) => (
                    <CategoryCard
                      key={g.id}
                      label={g.label}
                      emoji={g.emoji}
                      description={g.description}
                      isActive={!filters.clientGender || filters.clientGender === 'all' ? g.id === 'all' : filters.clientGender === g.id}
                      onClick={() => setFilters({ ...filters, clientGender: g.id as any })}
                    />
                  ))}
                </div>
              </div>

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
              <FilterSection title="Move-in Timeframe" icon={Clock} defaultOpen>
                <SegmentedControl
                  options={[
                    { id: 'any' as const, label: 'Any' },
                    { id: 'immediate' as const, label: 'Now' },
                    { id: '1-month' as const, label: '1 Mo' },
                    { id: '3-month' as const, label: '3 Mo' },
                    { id: 'flexible' as const, label: 'Flex' },
                  ]}
                  value={filters.moveInTimeframe}
                  onChange={(v) => setFilters({ ...filters, moveInTimeframe: v })}
                />
              </FilterSection>

              {/* Age Range */}
              <FilterSection title="Age Range" icon={User}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Min Age</span>
                    <div className="flex rounded-xl bg-muted/50 p-1 gap-1 mt-1">
                      {[18, 21, 25, 30, 35, 40].map((age) => {
                        const isActive = filters.minAge === age;
                        return (
                          <button
                            key={age}
                            onClick={() => setFilters({ ...filters, minAge: age })}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {age}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Max Age</span>
                    <div className="flex rounded-xl bg-muted/50 p-1 gap-1 mt-1">
                      {[30, 35, 40, 50, 60, 65].map((age) => {
                        const isActive = filters.maxAge === age;
                        return (
                          <button
                            key={age}
                            onClick={() => setFilters({ ...filters, maxAge: age })}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-semibold transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {age}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Match Score */}
              <FilterSection title="Minimum Match Score" icon={Target} defaultOpen>
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

              {/* Lifestyle Tags */}
              <FilterSection title="Lifestyle" icon={Sparkles}>
                <div className="flex flex-wrap gap-2">
                  {lifestyleTags.map((tag) => (
                    <PillToggle
                      key={tag}
                      label={tag}
                      isActive={activeLifestyleTags.has(tag)}
                      onClick={() => handleLifestyleToggle(tag)}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Occupation */}
              <FilterSection title="Preferred Occupation" icon={Briefcase}>
                <div className="flex flex-wrap gap-2">
                  {occupations.map((occ) => (
                    <PillToggle
                      key={occ}
                      label={occ}
                      isActive={filters.occupation === occ}
                      onClick={() => setFilters({ ...filters, occupation: filters.occupation === occ ? undefined : occ })}
                    />
                  ))}
                </div>
              </FilterSection>

              {/* Preferences Toggles */}
              <FilterSection title="Preferences" icon={Heart}>
                <div className="space-y-2">
                  <ToggleSwitch
                    label="Allows Pets"
                    icon={User}
                    isActive={filters.allowsPets !== false}
                    onClick={() => setFilters({ ...filters, allowsPets: filters.allowsPets === false ? true : false })}
                  />
                  <ToggleSwitch
                    label="Allows Children"
                    icon={User}
                    isActive={filters.allowsChildren !== false}
                    onClick={() => setFilters({ ...filters, allowsChildren: filters.allowsChildren === false ? true : false })}
                  />
                </div>
              </FilterSection>

              {/* Habits */}
              <FilterSection title="Habits" icon={Activity}>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground mb-2 block">Smoking</span>
                    <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
                      {['any', 'non-smoker', 'occasional', 'regular'].map((s) => {
                        const isActive = (filters.smokingHabit || 'any') === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setFilters({ ...filters, smokingHabit: s })}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {s === 'any' ? 'Any' : s.replace('-', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground mb-2 block">Drinking</span>
                    <div className="flex rounded-xl bg-muted/50 p-1 gap-1">
                      {['any', 'non-drinker', 'social', 'regular'].map((d) => {
                        const isActive = (filters.drinkingHabit || 'any') === d;
                        return (
                          <button
                            key={d}
                            onClick={() => setFilters({ ...filters, drinkingHabit: d })}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {d === 'any' ? 'Any' : d.replace('-', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </FilterSection>

              {/* Active Only Toggle */}
              <ToggleSwitch
                label="Active Clients Only"
                icon={Activity}
                isActive={!!filters.activeOnly}
                onClick={() => setFilters({ ...filters, activeOnly: !filters.activeOnly })}
              />
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
