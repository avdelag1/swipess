export type SelectOption = string | { value: string; label: string };

export function normalizeOption(opt: SelectOption): { value: string; label: string } {
  if (typeof opt === 'string') return { value: opt, label: opt };
  return opt;
}

export function normalizeOptions(options: readonly SelectOption[]): { value: string; label: string }[] {
  return options.map(normalizeOption);
}

export function labelForValue(options: readonly SelectOption[], value: string): string {
  const hit = normalizeOptions(options).find((o) => o.value === value);
  return hit?.label ?? value;
}

/** Instant fuzzy match for predictive autocomplete (prefix + contains). */
export function filterOptions(query: string, options: readonly SelectOption[]): { value: string; label: string }[] {
  const q = query.trim().toLowerCase();
  const normalized = normalizeOptions(options);
  if (!q) return normalized;
  const starts: typeof normalized = [];
  const contains: typeof normalized = [];
  for (const opt of normalized) {
    const hay = `${opt.label} ${opt.value}`.toLowerCase();
    if (hay.startsWith(q)) starts.push(opt);
    else if (hay.includes(q)) contains.push(opt);
  }
  return [...starts, ...contains];
}

export const FORM_SPRING = { type: 'spring' as const, stiffness: 500, damping: 32 };
export const FORM_FADE = { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };