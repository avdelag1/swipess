import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Check, RotateCcw, UserCircle, Baby, 
  Briefcase, ShoppingBag, Building2, Globe,
  Sparkles, DollarSign, Activity, Target,
  ChevronLeft, Filter, Search
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { haptics } from '@/utils/microPolish';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: {
  id: ClientGender;
  label: string;
  emoji: string;
  description: string;
  gradient: string;
}[] = [
  {
    id: 'any',
    label: 'Everyone',
    emoji: '🌍',
    description: 'All genders',
    gradient: 'from-slate-500/20 to-slate-600/20',
  },
  {
    id: 'female',
    label: 'Women',
    emoji: '👩',
    description: 'Female clients',
    gradient: 'from-pink-500/20 to-rose-600/20',
  },
  {
    id: 'male',
    label: 'Men',
    emoji: '👨',
    description: 'Male clients',
    gradient: 'from-blue-500/20 to-indigo-600/20',
  },
  {
    id: 'other',
    label: 'Non-Binary',
    emoji: '🧑',
    description: 'All identities',
    gradient: 'from-purple-500/20 to-violet-600/20',
  },
];

const clientTypeOptions: {
  id: ClientType;
  label: string;
  emoji: string;
  description: string;
  color: string;
}[] = [
  { id: 'all', label: 'All Types', emoji: '👥', description: 'Show everyone', color: 'bg-orange-500' },
  { id: 'individual', label: 'Individual', emoji: '👤', description: 'Single person', color: 'bg-pink-500' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', description: 'Family group', color: 'bg-purple-500' },
  { id: 'business', label: 'Business', emoji: '🏢', description: 'Corporate needs', color: 'bg-cyan-500' },
  { id: 'hire', label: 'Hiring', emoji: '💼', description: 'Need workers', color: 'bg-rose-500' },
  { id: 'rent', label: 'Renting', emoji: '🔑', description: 'Looking to rent', color: 'bg-blue-500' },
  { id: 'buy', label: 'Buying', emoji: '🏡', description: 'Looking to buy', color: 'bg-amber-500' },
];

const nationalityOptions = [
  { name: 'Mexican', flag: '🇲🇽' },
  { name: 'American', flag: '🇺🇸' },
  { name: 'Canadian', flag: '🇨🇦' },
  { name: 'Colombian', flag: '🇨🇴' },
  { name: 'Brazilian', flag: '🇧🇷' },
  { name: 'Argentine', flag: '🇦🇷' },
  { name: 'European', flag: '🇪🇺' },
  { name: 'Asian', flag: '🌏' },
  { name: 'Other', flag: '🌐' },
];

const AGE_MIN = 18;
const AGE_MAX = 65;
const BUDGET_MIN = 0;
const BUDGET_MAX = 50000;

export default function OwnerFilters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const storeGender = useFilterStore((state) => state.clientGender);
  const storeClientType = useFilterStore((state) => state.clientType);
  const setClientGender = useFilterStore((state) => state.setClientGender);
  const setClientType = useFilterStore((state) => state.setClientType);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);
  const setClientAgeRange = useFilterStore((state) => state.setClientAgeRange);
  const setClientBudgetRange = useFilterStore((state) => state.setClientBudgetRange);
  const setClientNationalities = useFilterStore((state) => state.setClientNationalities);

  const { preferences: dbPrefs, updatePreferences } = useOwnerClientPreferences();
  const [hydrated, setHydrated] = useState(false);

  const [selectedGender, setSelectedGender] = useState<ClientGender>(storeGender);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>(storeClientType);
  const [ageRange, setAgeRange] = useState<[number, number]>([AGE_MIN, AGE_MAX]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([BUDGET_MIN, BUDGET_MAX]);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated && dbPrefs !== undefined) {
      setHydrated(true);
      if (storeGender === 'any' && dbPrefs?.selected_genders?.length) {
        const dbGender = dbPrefs.selected_genders[0] as ClientGender;
        setClientGender(dbGender);
        setSelectedGender(dbGender);
      }
      if (dbPrefs?.min_age != null || dbPrefs?.max_age != null) {
        const min = dbPrefs.min_age ?? AGE_MIN;
        const max = dbPrefs.max_age ?? AGE_MAX;
        setAgeRange([min, max]);
      }
      if (dbPrefs?.min_budget != null || dbPrefs?.max_budget != null) {
        const min = dbPrefs.min_budget ?? BUDGET_MIN;
        const max = dbPrefs.max_budget ?? BUDGET_MAX;
        setBudgetRange([min, max]);
      }
      if (dbPrefs?.preferred_nationalities?.length) {
        setSelectedNationalities(dbPrefs.preferred_nationalities);
      }
    }
  }, [hydrated, dbPrefs, storeGender, setClientGender]);

  const isAgeChanged = ageRange[0] !== AGE_MIN || ageRange[1] !== AGE_MAX;
  const isBudgetChanged = budgetRange[0] !== BUDGET_MIN || budgetRange[1] !== BUDGET_MAX;

  const activeFilterCount =
    (selectedGender !== 'any' ? 1 : 0) +
    (selectedClientType !== 'all' ? 1 : 0) +
    (isAgeChanged ? 1 : 0) +
    (isBudgetChanged ? 1 : 0) +
    (selectedNationalities.length > 0 ? 1 : 0);

  const hasChanges = activeFilterCount > 0;

  const toggleNationality = (nat: string) => {
    haptics.tap();
    setSelectedNationalities((prev) =>
      prev.includes(nat) ? prev.filter((n) => n !== nat) : [...prev, nat]
    );
  };

  const handleApply = useCallback(() => {
    haptics.success();
    setClientGender(selectedGender);
    setClientType(selectedClientType);
    setClientAgeRange(isAgeChanged ? ageRange : null);
    setClientBudgetRange(isBudgetChanged ? budgetRange : null);
    setClientNationalities(selectedNationalities);

    updatePreferences({
      selected_genders: selectedGender === 'any' ? [] : [selectedGender],
      min_age: isAgeChanged ? ageRange[0] : null,
      max_age: isAgeChanged ? ageRange[1] : null,
      min_budget: isBudgetChanged ? budgetRange[0] : null,
      max_budget: isBudgetChanged ? budgetRange[1] : null,
      preferred_nationalities: selectedNationalities,
    });

    queryClient.invalidateQueries({ queryKey: ['smart-clients'] });
    queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
    navigate(-1);
  }, [selectedGender, selectedClientType, ageRange, budgetRange, selectedNationalities, isAgeChanged, isBudgetChanged, setClientGender, setClientType, setClientAgeRange, setClientBudgetRange, setClientNationalities, updatePreferences, queryClient, navigate]);

  const handleReset = useCallback(() => {
    haptics.tap();
    setSelectedGender('any');
    setSelectedClientType('all');
    setAgeRange([AGE_MIN, AGE_MAX]);
    setBudgetRange([BUDGET_MIN, BUDGET_MAX]);
    setSelectedNationalities([]);
    resetOwnerFilters();
  }, [resetOwnerFilters]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-50 px-6 py-8 bg-background/80 backdrop-blur-2xl border-b border-border/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="p-3 rounded-2xl bg-secondary/50 border border-border/50 text-muted-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Find Clients
                <Sparkles className="w-4 h-4 text-primary fill-primary/20" />
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Ideal Profile Config</p>
            </div>
          </div>
          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={handleReset}
                className="text-[10px] font-black uppercase tracking-widest text-primary px-4 py-2 bg-primary/10 rounded-full"
              >
                Reset All
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-6 py-10 space-y-12 max-w-2xl mx-auto">
        {/* Client Categories (Sentient Pill Grid) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Client Identity</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {clientTypeOptions.map((type) => {
              const isSelected = selectedClientType === type.id;
              return (
                <motion.button
                  key={type.id}
                  onClick={() => { haptics.tap(); setSelectedClientType(type.id); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative p-4 rounded-3xl text-left transition-all duration-300 border-2 overflow-hidden",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
                      : "border-border/40 bg-secondary/20 grayscale-[0.8] opacity-60 hover:opacity-100"
                  )}
                >
                  <div className="relative z-10 flex flex-col gap-2">
                    <span className="text-2xl">{type.emoji}</span>
                    <div>
                      <div className="font-black text-sm">{type.label}</div>
                      <div className="text-[10px] font-bold opacity-60 leading-none">{type.description}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div 
                      layoutId="choice-glow"
                      className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Gender Selection (Glass Segmented) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-pink-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Gender Preference</h2>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-secondary/20 p-1.5 rounded-[2rem] border border-border/40">
            {genderOptions.map((opt) => {
              const isSelected = selectedGender === opt.id;
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => { haptics.tap(); setSelectedGender(opt.id); }}
                  className={cn(
                    "relative py-4 rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all duration-300",
                    isSelected ? "text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="gender-pill"
                      className="absolute inset-0 bg-background shadow-lg rounded-[1.5rem] z-0 px-2"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 text-xl">{opt.emoji}</span>
                  <span className="relative z-10 text-[9px] font-black uppercase">{opt.label}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Age & Budget (Sentient Sliders) */}
        <section className="space-y-8">
          <div className="space-y-6 p-6 rounded-[2.5rem] bg-secondary/20 border border-border/40">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Age Window</span>
                </div>
                <span className="text-sm font-black text-primary px-3 py-1 bg-primary/10 rounded-lg">
                  {ageRange[0]} — {ageRange[1] === AGE_MAX ? '65+' : ageRange[1]}
                </span>
              </div>
              <Slider
                min={AGE_MIN}
                max={AGE_MAX}
                step={1}
                value={ageRange}
                onValueChange={(val) => { haptics.select(); setAgeRange(val as [number, number]); }}
                className="py-4"
              />
            </div>

            <div className="h-px bg-border/20 w-full" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest">Client Budget</span>
                </div>
                <span className="text-sm font-black text-primary px-3 py-1 bg-primary/10 rounded-lg">
                  ${budgetRange[0].toLocaleString()} — ${budgetRange[1] === BUDGET_MAX ? '50k+' : budgetRange[1].toLocaleString()}
                </span>
              </div>
              <Slider
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={500}
                value={budgetRange}
                onValueChange={(val) => { haptics.select(); setBudgetRange(val as [number, number]); }}
                className="py-4"
              />
            </div>
          </div>
        </section>

        {/* Nationality (Flow Tags) */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Global Origin</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {nationalityOptions.map((nat) => {
              const isSelected = selectedNationalities.includes(nat.name);
              return (
                <motion.button
                  key={nat.name}
                  onClick={() => toggleNationality(nat.name)}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-full text-xs font-bold transition-all duration-300 border-2",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20" 
                      : "bg-secondary/20 border-border/10 text-muted-foreground hover:border-border/40"
                  )}
                >
                  <span className="text-base">{nat.flag}</span>
                  {nat.name}
                  {isSelected && <Check className="w-3 h-3 ml-1" />}
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Floating Action Button - Liquid Glass */}
      <div className="fixed bottom-10 left-0 right-0 px-6 z-50">
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-18 rounded-[2rem] flex items-center justify-between px-8 text-lg font-black transition-all duration-500 shadow-2xl relative overflow-hidden group",
              hasChanges 
                ? "bg-primary text-primary-foreground shadow-primary/30" 
                : "bg-slate-800 text-slate-400 border border-slate-700 backdrop-blur-xl"
            )}
          >
            {/* Animated liquid background for active button */}
            {hasChanges && (
              <motion.div 
                animate={{ 
                  x: [-100, 100],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-30"
              />
            )}
            
            <div className="relative z-10 flex items-center gap-3">
              <Search className="w-6 h-6" />
              <span>Apply Filters</span>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black">
                  {activeFilterCount}
                </span>
              )}
              <Check className="w-6 h-6" />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
