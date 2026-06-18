import { useMemo, useState } from 'react';
import { ChipMultiSelect } from './ChipMultiSelect';
import { type SelectorGroup, SelectorSheet, SelectorTrigger } from './SelectorSheet';
import { labelForValue, normalizeOptions, type SelectOption } from './formUtils';

type Accent = 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';

interface SmartSelectorProps {
  label?: string;
  options?: readonly SelectOption[];
  groups?: SelectorGroup[];
  value: string[];
  onChange: (next: string[]) => void;
  single?: boolean;
  accent?: Accent;
  /** Use bottom sheet when option count exceeds this (default 8). */
  sheetThreshold?: number;
  /** Force bottom sheet even for short lists (e.g. country). */
  forceSheet?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function SmartSelector({
  label,
  options = [],
  groups,
  value,
  onChange,
  single,
  accent = 'rose',
  sheetThreshold = 8,
  forceSheet,
  placeholder,
  searchPlaceholder,
  disabled,
}: SmartSelectorProps) {
  const [open, setOpen] = useState(false);

  const count = useMemo(() => {
    if (groups?.length) return groups.reduce((n, g) => n + normalizeOptions(g.options).length, 0);
    return options.length;
  }, [groups, options]);

  const useSheet = forceSheet || count > sheetThreshold;

  const valueLabels = useMemo(() => {
    const all = groups?.length
      ? groups.flatMap((g) => g.options)
      : options;
    return value.map((v) => labelForValue(all, v));
  }, [value, options, groups]);

  if (!useSheet) {
    const chipOptions = normalizeOptions(options).map((o) => o.label);
    const chipValue = value.map((v) => labelForValue(options, v));

    return (
      <ChipMultiSelect
        label={label}
        accent={accent}
        single={single}
        options={chipOptions}
        value={chipValue}
        onChange={(labels) => {
          if (disabled) return;
          const next = labels.map((lbl) => {
            const hit = normalizeOptions(options).find((o) => o.label === lbl);
            return hit?.value ?? lbl;
          });
          onChange(next);
        }}
      />
    );
  }

  return (
    <>
      <SelectorTrigger
        label={label}
        placeholder={placeholder ?? 'Tap to select…'}
        valueLabels={valueLabels}
        onClick={() => !disabled && setOpen(true)}
        accent={accent}
        disabled={disabled}
      />
      <SelectorSheet
        open={open}
        onOpenChange={setOpen}
        title={label ?? 'Select'}
        options={options}
        groups={groups}
        value={value}
        onChange={onChange}
        single={single}
        accent={accent}
        searchPlaceholder={searchPlaceholder}
      />
    </>
  );
}