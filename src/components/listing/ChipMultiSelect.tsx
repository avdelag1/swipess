import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { FORM_SPRING } from './formUtils';

interface ChipMultiSelectProps {
  label?: string;
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  /** When true, only one chip can be active. */
  single?: boolean;
  accent?: 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';
}

const ACCENT_MAP: Record<NonNullable<ChipMultiSelectProps['accent']>, { bg: string; text: string; border: string; shadow: string; ring: string }> = {
  rose:    { bg: 'bg-rose-100 dark:bg-rose-500/20',    text: 'text-rose-700 dark:text-rose-300',    border: 'border-rose-400 dark:border-rose-500/30',    shadow: 'shadow-rose-500/10', ring: 'ring-rose-500/40' },
  amber:   { bg: 'bg-amber-100 dark:bg-amber-500/20',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-400 dark:border-amber-500/30',   shadow: 'shadow-amber-500/10', ring: 'ring-amber-500/40' },
  orange:  { bg: 'bg-orange-100 dark:bg-orange-500/20',  text: 'text-orange-700 dark:text-orange-300',  border: 'border-orange-400 dark:border-orange-500/30',  shadow: 'shadow-orange-500/10', ring: 'ring-orange-500/40' },
  cyan:    { bg: 'bg-cyan-100 dark:bg-cyan-500/20',    text: 'text-cyan-700 dark:text-cyan-300',    border: 'border-cyan-400 dark:border-cyan-500/30',    shadow: 'shadow-cyan-500/10', ring: 'ring-cyan-500/40' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-400 dark:border-emerald-500/30', shadow: 'shadow-emerald-500/10', ring: 'ring-emerald-500/40' },
  purple:  { bg: 'bg-purple-100 dark:bg-purple-500/20',  text: 'text-purple-700 dark:text-purple-300',  border: 'border-purple-400 dark:border-purple-500/30',  shadow: 'shadow-purple-500/10', ring: 'ring-purple-500/40' },
};

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
              onPointerDown={(e) => {
                if (e.pointerType === 'mouse') e.preventDefault();
                toggle(opt);
              }}
              whileTap={{ scale: 0.96 }}
              transition={FORM_SPRING}
              className={cn(
                'min-h-10 px-4 py-2 rounded-2xl text-[13px] font-bold tracking-wide border inline-flex items-center gap-1.5 shadow-sm touch-manipulation select-none transition-colors duration-200',
                active
                  ? cn(a.bg, a.text, a.border, a.shadow, 'shadow-md ring-1', a.ring)
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