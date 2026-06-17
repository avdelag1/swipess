import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { filterOptions, FORM_FADE, normalizeOptions, type SelectOption } from './formUtils';

type Accent = 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';

const ACCENT: Record<Accent, { active: string; ring: string }> = {
  rose: { active: 'bg-rose-500/15 border-rose-400/40 text-rose-700 dark:text-rose-300', ring: 'ring-rose-500/30' },
  amber: { active: 'bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-300', ring: 'ring-amber-500/30' },
  orange: { active: 'bg-orange-500/15 border-orange-400/40 text-orange-700 dark:text-orange-300', ring: 'ring-orange-500/30' },
  cyan: { active: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-500/30' },
  emerald: { active: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/30' },
  purple: { active: 'bg-purple-500/15 border-purple-400/40 text-purple-700 dark:text-purple-300', ring: 'ring-purple-500/30' },
};

export interface SelectorGroup {
  label: string;
  options: SelectOption[];
}

interface SelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options?: readonly SelectOption[];
  groups?: SelectorGroup[];
  value: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  accent?: Accent;
  searchPlaceholder?: string;
}

export function SelectorSheet({
  open,
  onOpenChange,
  title,
  options = [],
  groups,
  value,
  onChange,
  single,
  accent = 'rose',
  searchPlaceholder = 'Search…',
}: SelectorSheetProps) {
  const [query, setQuery] = useState('');
  const a = ACCENT[accent];

  const flatOptions = useMemo(() => {
    if (groups?.length) return groups.flatMap((g) => normalizeOptions(g.options));
    return normalizeOptions(options);
  }, [groups, options]);

  const filteredFlat = useMemo(() => filterOptions(query, flatOptions), [query, flatOptions]);

  const pick = (val: string) => {
    triggerHaptic('light');
    if (single) {
      onChange(value.includes(val) ? [] : [val]);
      onOpenChange(false);
      setQuery('');
      return;
    }
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const renderOption = (opt: { value: string; label: string }) => {
    const active = value.includes(opt.value);
    return (
      <motion.button
        key={opt.value}
        type="button"
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FORM_FADE}
        onClick={() => pick(opt.value)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors duration-200',
          active
            ? cn(a.active, 'ring-1', a.ring)
            : 'bg-secondary/50 border-border hover:bg-secondary text-foreground',
        )}
      >
        <span className="flex-1 text-sm font-semibold">{opt.label}</span>
        {active && <Check className="w-4 h-4 shrink-0" strokeWidth={3} />}
      </motion.button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) setQuery(''); onOpenChange(v); }}>
      <SheetContent side="bottom" className="h-[min(78dvh,640px)] p-0 rounded-t-[28px] border-t border-border bg-background/95 backdrop-blur-xl">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/60 text-left">
          <SheetTitle className="text-base font-bold tracking-tight">{title}</SheetTitle>
        </SheetHeader>

        <div className="px-5 py-3 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-12 pl-10 rounded-2xl bg-secondary/60 border-border"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 overscroll-contain" style={{ maxHeight: 'calc(min(78dvh, 640px) - 180px)' }}>
          {groups?.length ? (
            groups.map((group) => {
              const groupOpts = filterOptions(query, group.options);
              if (!groupOpts.length) return null;
              return (
                <div key={group.label} className="space-y-2 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">{group.label}</p>
                  {groupOpts.map(renderOption)}
                </div>
              );
            })
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredFlat.map(renderOption)}
            </AnimatePresence>
          )}
          {filteredFlat.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No matches for &ldquo;{query}&rdquo;</p>
          )}
        </div>

        {!single && (
          <div className="px-5 py-4 border-t border-border/60 safe-area-pb">
            <button
              type="button"
              onClick={() => { setQuery(''); onOpenChange(false); }}
              className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-primary-foreground"
            >
              Done ({value.length} selected)
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Fixed-height trigger — no layout shift when opening sheet. */
export function SelectorTrigger({
  label,
  placeholder = 'Select…',
  valueLabels,
  onClick,
  accent = 'rose',
  disabled,
}: {
  label?: string;
  placeholder?: string;
  valueLabels: string[];
  onClick: () => void;
  accent?: Accent;
  disabled?: boolean;
}) {
  const a = ACCENT[accent];
  const display = valueLabels.length ? valueLabels.join(', ') : placeholder;
  const hasValue = valueLabels.length > 0;

  return (
    <div>
      {label && <FormFieldLabel>{label}</FormFieldLabel>}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full h-12 px-4 rounded-2xl border flex items-center gap-2 text-left transition-colors duration-200',
          disabled && 'opacity-50 cursor-not-allowed',
          hasValue
            ? cn(a.active, 'ring-1', a.ring)
            : 'bg-secondary/50 border-border text-muted-foreground hover:bg-secondary',
        )}
      >
        <span className={cn('flex-1 text-sm font-semibold truncate', hasValue && 'text-foreground')}>{display}</span>
        <ChevronRight className="w-4 h-4 shrink-0 opacity-50" />
      </button>
    </div>
  );
}

function FormFieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-foreground/80 mb-1.5">{children}</div>;
}