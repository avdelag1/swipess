import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  GENDER_OPTIONS,
  CLEANLINESS_OPTIONS,
  NOISE_TOLERANCE_OPTIONS,
  SMOKING_HABIT_OPTIONS,
  DRINKING_HABIT_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '@/constants/profileConstants';

export interface RoommateFilterState {
  preferred_gender: string[];
  preferred_budget_min: number | null;
  preferred_budget_max: number | null;
  preferred_age_min: number | null;
  preferred_age_max: number | null;
  preferred_cleanliness: string | null;
  preferred_noise_tolerance: string | null;
  preferred_smoking: string | null;
  preferred_drinking: string | null;
  preferred_work_schedule: string | null;
  deal_breakers: string[];
}

const DEAL_BREAKER_OPTIONS = [
  'Smoking indoors', 'Loud music at night', 'Pets', 'Parties',
  'Messy common areas', 'Overnight guests', 'Late rent payments',
];

const emptyFilters: RoommateFilterState = {
  preferred_gender: [],
  preferred_budget_min: null,
  preferred_budget_max: null,
  preferred_age_min: null,
  preferred_age_max: null,
  preferred_cleanliness: null,
  preferred_noise_tolerance: null,
  preferred_smoking: null,
  preferred_drinking: null,
  preferred_work_schedule: null,
  deal_breakers: [],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: RoommateFilterState) => void;
  currentFilters?: RoommateFilterState;
}

export function RoommateFiltersSheet({ open, onClose, onApply, currentFilters }: Props) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RoommateFilterState>(currentFilters ?? emptyFilters);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentFilters) setFilters(currentFilters);
  }, [open, currentFilters]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (filters.preferred_gender.length > 0) c++;
    if (filters.preferred_budget_min || filters.preferred_budget_max) c++;
    if (filters.preferred_age_min || filters.preferred_age_max) c++;
    if (filters.preferred_cleanliness) c++;
    if (filters.preferred_noise_tolerance) c++;
    if (filters.preferred_smoking) c++;
    if (filters.preferred_drinking) c++;
    if (filters.preferred_work_schedule) c++;
    if (filters.deal_breakers.length > 0) c++;
    return c;
  }, [filters]);

  const toggleGender = (v: string) => {
    setFilters(f => ({
      ...f,
      preferred_gender: f.preferred_gender.includes(v)
        ? f.preferred_gender.filter(g => g !== v)
        : [...f.preferred_gender, v],
    }));
  };

  const toggleDealBreaker = (v: string) => {
    setFilters(f => ({
      ...f,
      deal_breakers: f.deal_breakers.includes(v)
        ? f.deal_breakers.filter(d => d !== v)
        : [...f.deal_breakers, v],
    }));
  };

  const handleApply = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        preferred_gender: filters.preferred_gender as any,
        preferred_budget_min: filters.preferred_budget_min,
        preferred_budget_max: filters.preferred_budget_max,
        preferred_age_min: filters.preferred_age_min as any,
        preferred_age_max: filters.preferred_age_max as any,
        preferred_cleanliness: filters.preferred_cleanliness as any,
        preferred_noise_tolerance: filters.preferred_noise_tolerance as any,
        preferred_smoking: filters.preferred_smoking as any,
        preferred_drinking: filters.preferred_drinking as any,
        preferred_work_schedule: filters.preferred_work_schedule as any,
        deal_breakers: filters.deal_breakers as any,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('roommate_preferences')
        .upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      onApply(filters);
      onClose();
      toast.success('Roommate preferences saved');
    } catch (_e: unknown) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setFilters(emptyFilters);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[10000] max-h-[88vh] rounded-t-3xl border-t border-border/30 bg-background/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Roommate Preferences</h2>
                {activeCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleReset} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Reset
                </button>
                <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted/50 transition-colors">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <ScrollArea className="max-h-[calc(88vh-140px)] px-5 pb-4">
              <div className="space-y-6 pb-6">

                {/* Gender Preference */}
                <Section title="Gender Preference">
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map(g => (
                      <PillToggle
                        key={g.value}
                        label={`${g.emoji} ${g.label}`}
                        active={filters.preferred_gender.includes(g.value)}
                        onClick={() => toggleGender(g.value)}
                      />
                    ))}
                  </div>
                </Section>

                {/* Budget Range */}
                <Section title="Monthly Budget">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${filters.preferred_budget_min ?? 0}</span>
                      <span>${filters.preferred_budget_max ?? 5000}+</span>
                    </div>
                    <Slider
                      min={0}
                      max={5000}
                      step={100}
                      value={[filters.preferred_budget_min ?? 0, filters.preferred_budget_max ?? 5000]}
                      onValueChange={([min, max]) => setFilters(f => ({ ...f, preferred_budget_min: min, preferred_budget_max: max }))}
                    />
                  </div>
                </Section>

                {/* Age Range */}
                <Section title="Age Range">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{filters.preferred_age_min ?? 18} yrs</span>
                      <span>{filters.preferred_age_max ?? 60} yrs</span>
                    </div>
                    <Slider
                      min={18}
                      max={60}
                      step={1}
                      value={[filters.preferred_age_min ?? 18, filters.preferred_age_max ?? 60]}
                      onValueChange={([min, max]) => setFilters(f => ({ ...f, preferred_age_min: min, preferred_age_max: max }))}
                    />
                  </div>
                </Section>

                {/* Lifestyle Preferences */}
                <Section title="Cleanliness">
                  <div className="flex flex-wrap gap-2">
                    {CLEANLINESS_OPTIONS.map(o => (
                      <PillToggle key={o.value} label={o.label} active={filters.preferred_cleanliness === o.value} onClick={() => setFilters(f => ({ ...f, preferred_cleanliness: f.preferred_cleanliness === o.value ? null : o.value }))} />
                    ))}
                  </div>
                </Section>

                <Section title="Noise Tolerance">
                  <div className="flex flex-wrap gap-2">
                    {NOISE_TOLERANCE_OPTIONS.map(o => (
                      <PillToggle key={o.value} label={o.label} active={filters.preferred_noise_tolerance === o.value} onClick={() => setFilters(f => ({ ...f, preferred_noise_tolerance: f.preferred_noise_tolerance === o.value ? null : o.value }))} />
                    ))}
                  </div>
                </Section>

                <Section title="Smoking">
                  <div className="flex flex-wrap gap-2">
                    {SMOKING_HABIT_OPTIONS.map(o => (
                      <PillToggle key={o.value} label={o.label} active={filters.preferred_smoking === o.value} onClick={() => setFilters(f => ({ ...f, preferred_smoking: f.preferred_smoking === o.value ? null : o.value }))} />
                    ))}
                  </div>
                </Section>

                <Section title="Drinking">
                  <div className="flex flex-wrap gap-2">
                    {DRINKING_HABIT_OPTIONS.map(o => (
                      <PillToggle key={o.value} label={o.label} active={filters.preferred_drinking === o.value} onClick={() => setFilters(f => ({ ...f, preferred_drinking: f.preferred_drinking === o.value ? null : o.value }))} />
                    ))}
                  </div>
                </Section>

                <Section title="Work Schedule">
                  <div className="flex flex-wrap gap-2">
                    {WORK_SCHEDULE_OPTIONS.map(o => (
                      <PillToggle key={o.value} label={o.label} active={filters.preferred_work_schedule === o.value} onClick={() => setFilters(f => ({ ...f, preferred_work_schedule: f.preferred_work_schedule === o.value ? null : o.value }))} />
                    ))}
                  </div>
                </Section>

                {/* Deal Breakers */}
                <Section title="Deal Breakers 🚫">
                  <div className="flex flex-wrap gap-2">
                    {DEAL_BREAKER_OPTIONS.map(d => (
                      <PillToggle
                        key={d}
                        label={d}
                        active={filters.deal_breakers.includes(d)}
                        onClick={() => toggleDealBreaker(d)}
                        variant="destructive"
                      />
                    ))}
                  </div>
                </Section>

              </div>
            </ScrollArea>

            {/* Sticky Apply */}
            <div className="sticky bottom-0 border-t border-border/20 bg-background/95 backdrop-blur-sm px-5 py-3">
              <Button
                onClick={handleApply}
                disabled={saving}
                className="w-full h-12 rounded-2xl text-base font-bold"
              >
                {saving ? 'Saving…' : activeCount > 0 ? `Apply ${activeCount} Filter${activeCount > 1 ? 's' : ''}` : 'Apply Filters'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Sub-components ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-semibold text-foreground tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function PillToggle({ label, active, onClick, variant }: { label: string; active: boolean; onClick: () => void; variant?: 'destructive' }) {
  const isDestructive = variant === 'destructive';
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all duration-200',
        active && !isDestructive && 'bg-primary text-primary-foreground border-primary shadow-md',
        active && isDestructive && 'bg-destructive text-destructive-foreground border-destructive shadow-md',
        !active && 'bg-muted/50 text-muted-foreground border-border/40 hover:bg-muted hover:border-border',
      )}
    >
      {active && <Check className="h-3 w-3" />}
      {label}
    </button>
  );
}


