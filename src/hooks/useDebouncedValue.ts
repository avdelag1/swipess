import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms have
 * passed without `value` changing. Use it to keep an input feeling instant
 * (the raw state updates every keystroke) while throttling the expensive work
 * derived from it — e.g. a world-wide city search, a network query, or a heavy
 * filter recompute.
 *
 *   const [query, setQuery] = useState('');
 *   const debounced = useDebouncedValue(query, 250);
 *   const results = useMemo(() => searchCities(debounced), [debounced]);
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}