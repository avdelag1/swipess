import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ChipMultiSelectProps {
  label?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** When true, only one chip can be active. */
  single?: boolean;
  accent?: 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald';
}

const ACCENT_MAP: Record<NonNullable<ChipMultiSelectProps['accent']>, { bg: string; text: string; border: string; shadow: string }> = {
  rose:    { bg: 'bg-rose-500/20',    text: 'text-rose-300',    border: 'border-rose-500/30',    shadow: 'shadow-rose-500/10' },
  amber:   { bg: 'bg-amber-500/20',   text: 'text-amber-300',   border: 'border-amber-500/30',   shadow: 'shadow-amber-500/10' },
  orange:  { bg: 'bg-orange-500/20',  text: 'text-orange-300',  border: 'border-orange-500/30',  shadow: 'shadow-orange-500/10' },
  cyan:    { bg: 'bg-cyan-500/20',    text: 'text-cyan-300',    border: 'border-cyan-500/30',    shadow: 'shadow-cyan-500/10' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/10' },
};

const springTap = { type: 'spring' as const, stiffness: 500, damping: 30 };

export function ChipMultiSelect({ label, options, value, onChange, single, accent = 'rose' }: ChipMultiSelectProps) {
  const a = ACCENT_MAP[accent];

  const toggle = (opt: string) => {
    if (single) {
      onChange(value.includes(opt) ? [] : [opt]);
      return;
    }
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  return (
    <div>
      {label && (
        <div className="text-sm font-semibold text-foreground/80 mb-2">{label}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              whileTap={{ scale: 0.92 }}
              animate={{ scale: active ? 1.04 : 1 }}
              transition={springTap}
              className={cn(
                'px-4 py-2 rounded-2xl text-[13px] font-bold tracking-wide transition-all duration-200 border inline-flex items-center gap-1.5 shadow-sm',
                active
                  ? cn(a.bg, a.text, a.border, a.shadow, 'shadow-lg ring-1', `ring-${accent}-500/40`)
                  : 'bg-white/60 dark:bg-white/[0.03] text-slate-800 dark:text-white/80 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/20',
              )}
            >
              {active && <Check className="w-3.5 h-3.5 -ml-0.5" strokeWidth={3} />}
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}