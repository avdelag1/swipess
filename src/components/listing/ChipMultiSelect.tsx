import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
              whileTap={{ scale: 0.94 }}
              transition={springTap}
              className={cn(
                'px-3.5 py-2 rounded-full text-sm font-semibold transition-all border',
                active
                  ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                  : 'bg-secondary text-foreground border-border hover:bg-secondary/80',
              )}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}