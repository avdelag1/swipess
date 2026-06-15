import { useMemo, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { searchCities } from '@/data/worldLocations';
import { cn } from '@/lib/utils';

export type QuickCitySelection = {
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
};

interface QuickCityPickerProps {
  value: string;
  onSelect: (selection: QuickCitySelection) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function QuickCityPicker({
  value,
  onSelect,
  placeholder = 'Quick search: type any city…',
  className,
  inputClassName,
}: QuickCityPickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => (query.length >= 2 ? searchCities(query).slice(0, 8) : []),
    [query],
  );

  const handleSelect = (result: ReturnType<typeof searchCities>[number]) => {
    const city = result.city.name;
    setQuery(city);
    setOpen(false);
    onSelect({
      city,
      country: result.country,
      latitude: result.city.coordinates?.lat,
      longitude: result.city.coordinates?.lng,
    });
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400 opacity-90 pointer-events-none" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn(
            'w-full h-14 pl-14 pr-12 rounded-[2rem] transition-all text-sm outline-none focus:ring-1 focus:ring-rose-500/30',
            inputClassName,
          )}
        />
        {query && (
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery('');
              setOpen(false);
              onSelect({ city: '', country: '' });
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-30 mt-2 w-full max-h-56 overflow-y-auto rounded-2xl border border-rose-500/20 bg-black/95 shadow-2xl chrome-solid">
          {results.map((result) => (
            <li key={`${result.country}-${result.city.name}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(result)}
              >
                <MapPin className="h-4 w-4 shrink-0 text-rose-400" />
                <span className="font-medium">{result.city.name}</span>
                <span className="text-xs text-white/50">{result.country}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}