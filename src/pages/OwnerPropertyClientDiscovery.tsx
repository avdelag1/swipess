import { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, User, ArrowLeft, Sparkles, UserCircle, Activity, DollarSign, Globe, Check, RotateCcw, Users } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { useSmartClientMatching, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { Badge } from '@/components/ui/badge';
import { ClientCard } from '@/components/discovery/ClientCard';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { useFilterStore } from '@/state/filterStore';
import { useOwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { useQueryClient } from '@tanstack/react-query';
import { haptics } from '@/utils/microPolish';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { ClientGender, ClientType } from '@/types/filters';

// ── Owner filter options (merged from OwnerFilters.tsx) ──────────────────

const genderOptions: { id: ClientGender; label: string; emoji: string }[] = [
  { id: 'any', label: 'All', emoji: '🌍' },
  { id: 'female', label: 'Women', emoji: '👩' },
  { id: 'male', label: 'Men', emoji: '👨' },
  { id: 'other', label: 'Other', emoji: '🧑' },
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

export default function OwnerPropertyClientDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // ── Owner demographic filters (merged from OwnerFilters) ──────────────
  const storeGender = useFilterStore((s) => s.clientGender);
  const setClientGender = useFilterStore((s) => s.setClientGender);
  const setClientAgeRange = useFilterStore((s) => s.setClientAgeRange);
  const setClientBudgetRange = useFilterStore((s) => s.setClientBudgetRange);
  const setClientNationalities = useFilterStore((s) => s.setClientNationalities);

  const { preferences: dbPrefs, updatePreferences } = useOwnerClientPreferences();
  const [hydrated, setHydrated] = useState(false);

  const [selectedGender, setSelectedGender] = useState<ClientGender>(storeGender);
  const [ageRange, setAgeRange] = useState<[number, number]>([AGE_MIN, AGE_MAX]);
  const [budgetRange, setBudgetRange] = useState<[number, number]>([BUDGET_MIN, BUDGET_MAX]);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);

  // Hydrate from DB prefs
  useEffect(() => {
    if (!hydrated && dbPrefs !== undefined) {
      setHydrated(true);
      if (storeGender === 'any' && dbPrefs?.selected_genders?.length) {
        const dbGender = dbPrefs.selected_genders[0] as ClientGender;
        setClientGender(dbGender);
        setSelectedGender(dbGender);
      }
      if (dbPrefs?.min_age != null || dbPrefs?.max_age != null) {
        setAgeRange([dbPrefs.min_age ?? AGE_MIN, dbPrefs.max_age ?? AGE_MAX]);
      }
      if (dbPrefs?.min_budget != null || dbPrefs?.max_budget != null) {
        setBudgetRange([dbPrefs.min_budget ?? BUDGET_MIN, dbPrefs.max_budget ?? BUDGET_MAX]);
      }
      if (dbPrefs?.preferred_nationalities?.length) {
        setSelectedNationalities(dbPrefs.preferred_nationalities);
      }
    }
  }, [hydrated, dbPrefs, storeGender, setClientGender]);

  const isAgeChanged = ageRange[0] !== AGE_MIN || ageRange[1] !== AGE_MAX;
  const isBudgetChanged = budgetRange[0] !== BUDGET_MIN || budgetRange[1] !== BUDGET_MAX;

  const toggleNationality = (nat: string) => {
    haptics.tap();
    setSelectedNationalities((prev) =>
      prev.includes(nat) ? prev.filter((n) => n !== nat) : [...prev, nat]
    );
  };

  const applyDemographicFilters = useCallback(() => {
    haptics.success();
    setClientGender(selectedGender);
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
  }, [selectedGender, ageRange, budgetRange, selectedNationalities, isAgeChanged, isBudgetChanged, setClientGender, setClientAgeRange, setClientBudgetRange, setClientNationalities, updatePreferences, queryClient]);

  // Auto-apply demographic filters when they change
  useEffect(() => {
    if (hydrated) {
      applyDemographicFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGender, ageRange, budgetRange, selectedNationalities]);

  // 🚀 Convert filters from UI format to Smart Matching context
  const clientFilters: ClientFilters | undefined = useMemo(() => {
    const mapped: ClientFilters = {};
    // Property filters
    if (Object.keys(filters).length > 0) {
      if (filters.budget_min !== undefined || filters.budget_max !== undefined) {
        mapped.budgetRange = [filters.budget_min ?? 0, filters.budget_max ?? 100000];
      }
      if (filters.gender_preference && filters.gender_preference !== 'any') {
        mapped.genders = [filters.gender_preference];
      }
      if (filters.has_pets_filter && filters.has_pets_filter !== 'any') {
        mapped.hasPets = filters.has_pets_filter === 'yes';
      }
      if (filters.verified) mapped.verified = true;
      if (filters.nationalities?.length > 0) mapped.nationalities = filters.nationalities;
      if (filters.languages?.length > 0) mapped.languages = filters.languages;
      if (filters.property_types?.length > 0) mapped.propertyTypes = filters.property_types;
    }
    // Demographic filters
    if (selectedGender !== 'any') mapped.genders = [selectedGender];
    if (isAgeChanged) mapped.ageRange = ageRange;
    if (isBudgetChanged) mapped.budgetRange = budgetRange;
    if (selectedNationalities.length > 0) mapped.nationalities = selectedNationalities;

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }, [filters, selectedGender, isAgeChanged, isBudgetChanged, ageRange, budgetRange, selectedNationalities]);

  const { data: clients = [], isLoading, refetch } = useSmartClientMatching(user?.id, 'property', 0, 10, false, clientFilters);
  const startConversation = useStartConversation();

  const filteredClients = (clients || []).filter(client =>
    client.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  }).length + (selectedGender !== 'any' ? 1 : 0) + (isAgeChanged ? 1 : 0) + (isBudgetChanged ? 1 : 0) + (selectedNationalities.length > 0 ? 1 : 0);

  const handleApplyFilters = useCallback((newFilters: any) => {
    triggerHaptic('light');
    setFilters(newFilters);
  }, []);

  const handleConnect = useCallback(async (clientId: string) => {
    if (isCreatingConversation) return;
    setIsCreatingConversation(true);
    try {
      sonnerToast.loading('Starting conversation...', { id: 'start-conv' });
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: "Hi! I noticed your profile and think my property would be a great fit. Would you like to connect?",
        canStartNewConversation: true,
      });
      if (result?.conversationId) {
        sonnerToast.success('Opening chat...', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) logger.error('Error starting conversation:', error);
      sonnerToast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, startConversation, navigate]);

  const handleViewProfile = useCallback((clientId: string) => {
    navigate(`/owner/view-client/${clientId}`);
  }, [navigate]);

  // ── Demographic Filters Panel (shared between desktop sidebar & mobile sheet) ──
  const DemographicFilters = () => (
    <div className="space-y-6">
      {/* Gender */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-pink-500" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gender</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 bg-secondary/20 p-1 rounded-2xl border border-border/40">
          {genderOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { haptics.tap(); setSelectedGender(opt.id); }}
              className={cn(
                "py-2.5 rounded-xl flex flex-col items-center gap-0.5 transition-all text-center",
                selectedGender === opt.id
                  ? "bg-background shadow-sm text-primary font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[9px] font-bold">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div className="space-y-3 p-4 rounded-2xl bg-secondary/20 border border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-black uppercase tracking-widest">Age</span>
          </div>
          <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">
            {ageRange[0]}–{ageRange[1] === AGE_MAX ? '65+' : ageRange[1]}
          </span>
        </div>
        <Slider min={AGE_MIN} max={AGE_MAX} step={1} value={ageRange} onValueChange={(v) => setAgeRange(v as [number, number])} className="py-2" />
      </div>

      {/* Budget */}
      <div className="space-y-3 p-4 rounded-2xl bg-secondary/20 border border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest">Budget</span>
          </div>
          <span className="text-xs font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">
            ${budgetRange[0].toLocaleString()}–${budgetRange[1] === BUDGET_MAX ? '50k+' : budgetRange[1].toLocaleString()}
          </span>
        </div>
        <Slider min={BUDGET_MIN} max={BUDGET_MAX} step={500} value={budgetRange} onValueChange={(v) => setBudgetRange(v as [number, number])} className="py-2" />
      </div>

      {/* Nationality */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Origin</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {nationalityOptions.map((nat) => {
            const isSelected = selectedNationalities.includes(nat.name);
            return (
              <button
                key={nat.name}
                onClick={() => toggleNationality(nat.name)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold border transition-all active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/20 border-border/20 text-muted-foreground"
                )}
              >
                <span>{nat.flag}</span>
                {nat.name}
                {isSelected && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 safe-top-padding">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/40 border border-border/10 hover:bg-muted transition-all active:scale-90"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground/80" strokeWidth={2.5} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-0.5">Client Discovery</span>
                <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground">Filters</h1>
              </div>
            </div>
            <Button 
               variant="outline" 
               onClick={() => navigate('/owner/properties')}
               className="rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px] hidden sm:flex"
            >
              My Listings
            </Button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative flex-1 group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <Input
                 placeholder="Search by name..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/20 focus:bg-muted/40 transition-all font-bold placeholder:font-normal"
               />
             </div>
             <button
               onClick={() => refetch()}
               className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/20 border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all active:scale-90"
               title="Refresh feed"
             >
               <Sparkles className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar — Demographic + Property Filters */}
          <aside className="hidden lg:block w-80 space-y-6">
            <div className="sticky top-44 space-y-6">
              {/* Demographic filters */}
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">Client Profile</h2>
                <DemographicFilters />
              </div>

              {/* Property filters */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Property Filters</h2>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { handleApplyFilters({}); setSelectedGender('any'); setAgeRange([AGE_MIN, AGE_MAX]); setBudgetRange([BUDGET_MIN, BUDGET_MAX]); setSelectedNationalities([]); }} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600">
                      Reset All
                    </button>
                  )}
                </div>
                <PropertyClientFilters
                  onApply={handleApplyFilters}
                  initialFilters={filters}
                  activeCount={activeFilterCount}
                />
              </div>
            </div>
          </aside>

          {/* Activity Feed */}
          <main className="flex-1">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <DiscoverySkeleton count={6} />
                </div>
              ) : filteredClients.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[3rem] border border-border/10 text-center shadow-inner"
                >
                  <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mb-6 shadow-xl">
                    <User className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">No Matches Yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm font-bold uppercase tracking-widest leading-loose">
                    Adjust your filters to find active clients.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredClients.map((client, idx) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ClientCard 
                        client={client} 
                        onConnect={handleConnect} 
                        onViewProfile={handleViewProfile} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full h-14 px-8 shadow-2xl bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] border border-white/20">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-[3rem] bg-background p-0 border-t-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="h-1.5 w-12 bg-muted/40 rounded-full mx-auto my-4" />
            <div className="px-6 pb-6 overflow-y-auto h-full touch-pan-y space-y-8">
              <SheetHeader>
                <SheetTitle className="text-left font-black uppercase tracking-tighter text-2xl">Client Filters</SheetTitle>
              </SheetHeader>

              {/* Demographic filters */}
              <DemographicFilters />

              {/* Property filters */}
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Property Preferences</h2>
                <PropertyClientFilters
                  onApply={handleApplyFilters}
                  initialFilters={filters}
                  activeCount={activeFilterCount}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
