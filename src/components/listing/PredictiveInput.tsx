import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { filterOptions } from './formUtils';

interface PredictiveInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  placeholder?: string;
  className?: string;
}

export function PredictiveInput({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
  className,
}: PredictiveInputProps) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    if (value.length >= 1) return filterOptions(value, suggestions).slice(0, 6);
    if (focused && suggestions.length > 0) {
      return suggestions.slice(0, 6).map((s) => ({ value: s, label: s }));
    }
    return [];
  }, [value, suggestions, focused]);

  const showDropdown = focused && matches.length > 0;

  return (
    <div className={cn('relative', className)}>
      {label && (
        <div className="text-sm font-semibold text-foreground/80 mb-1.5">{label}</div>
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="h-11 rounded-2xl"
        autoComplete="off"
      />
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl overflow-hidden"
          >
            {matches.map((m) => (
              <button
                key={m.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(m.label);
                  setFocused(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors duration-150"
              >
                {m.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}