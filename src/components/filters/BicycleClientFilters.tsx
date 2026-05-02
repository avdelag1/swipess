import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

const BICYCLE_TYPES = [
  { value: 'road', label: 'Road' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'bmx', label: 'BMX' },
  { value: 'folding', label: 'Folding' },
];

const BIKE_PRICE_RANGES = [
  { value: '0-10', label: '$0 - $10/day', min: 0, max: 10 },
  { value: '10-25', label: '$10 - $25/day', min: 10, max: 25 },
  { value: '25-50', label: '$25 - $50/day', min: 25, max: 50 },
  { value: '50+', label: '$50+/day', min: 50, max: 10000 },
];

interface BicycleClientFiltersProps {
  onApply: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
  activeCount: number;
}

export function BicycleClientFilters({ onApply, initialFilters = {}, activeCount }: BicycleClientFiltersProps) {
  const { isLight } = useAppTheme();
  const activePill = 'bg-primary border-primary text-primary-foreground shadow-sm scale-[1.03]';
  const inactivePill = isLight ? 'bg-white border-black/10 text-black hover:bg-black/5 shadow-sm' : 'bg-white/8 border-white/10 text-white hover:bg-white/12';
  const sectionLabel = isLight ? 'text-black/50' : 'text-white/40';
  const [bicycleTypes, setBicycleTypes] = useState<string[]>((initialFilters.bicycle_types as string[]) || []);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>((initialFilters.selected_price_range as string) || '');
  const [electricAssist, setElectricAssist] = useState((initialFilters.electric_assist as boolean) ?? false);
  const [includesLock, setIncludesLock] = useState((initialFilters.includes_lock as boolean) ?? false);
  const [includesHelmet, setIncludesHelmet] = useState((initialFilters.includes_helmet as boolean) ?? false);
  const [includesBasket, setIncludesBasket] = useState((initialFilters.includes_basket as boolean) ?? false);

  // Demographics
  const [genderPreference, setGenderPreference] = useState<string>((initialFilters.gender_preference as string) || 'any');
  const [nationalities, setNationalities] = useState<string[]>((initialFilters.nationalities as string[]) || []);
  const [languages, setLanguages] = useState<string[]>((initialFilters.languages as string[]) || []);
  const [ageRange, setAgeRange] = useState([(initialFilters.age_min as number) || 18, (initialFilters.age_max as number) || 65]);

  const [relationshipStatus, setRelationshipStatus] = useState<string[]>((initialFilters.relationship_status as string[]) || []);
  const [hasPetsFilter, setHasPetsFilter] = useState<string>((initialFilters.has_pets_filter as string) || 'any');

  // Location
  const [locationCountry, setLocationCountry] = useState<string>((initialFilters.location_country as string) || '');
  const [locationCity, setLocationCity] = useState<string>((initialFilters.location_city as string) || '');
  const [locationNeighborhood, setLocationNeighborhood] = useState<string>((initialFilters.location_neighborhood as string) || '');
  const [locationCountries, setLocationCountries] = useState<string[]>((initialFilters.location_countries as string[]) || []);
  const [locationCities, setLocationCities] = useState<string[]>((initialFilters.location_cities as string[]) || []);
  const [locationNeighborhoods, setLocationNeighborhoods] = useState<string[]>((initialFilters.location_neighborhoods as string[]) || []);

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    setter(array.includes(value) ? array.filter(v => v !== value) : [...array, value]);
  };

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const priceRange = BIKE_PRICE_RANGES.find(r => r.value === selectedPriceRange);
    onApply({
      bicycle_types: bicycleTypes,
      selected_price_range: selectedPriceRange,
      price_min: priceRange?.min,
      price_max: priceRange?.max,
      electric_assist: electricAssist,
      includes_lock: includesLock,
      includes_helmet: includesHelmet,
      includes_basket: includesBasket,
      gender_preference: genderPreference,
      nationalities,
      languages,
      age_min: ageRange[0],
      age_max: ageRange[1],
      location_countries: locationCountries,
      location_cities: locationCities,
      location_neighborhoods: locationNeighborhoods,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bicycleTypes, selectedPriceRange, electricAssist, includesLock, includesHelmet, includesBasket, genderPreference, nationalities, languages, ageRange, locationCountries, locationCities, locationNeighborhoods]);

  return (
    <div className="space-y-5 p-2">
      <div className="flex items-center justify-between px-1">
        <span className={cn('text-[10px] font-black uppercase tracking-widest', sectionLabel)}>Bicycle Filters</span>
        {activeCount > 0 && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', isLight ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary')}>{activeCount} active</span>}
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Price Range</span>
        <div className="flex flex-wrap gap-2">
          {BIKE_PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedPriceRange(selectedPriceRange === range.value ? '' : range.value)}
              className={cn('rounded-2xl border text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all duration-200 active:scale-95', selectedPriceRange === range.value ? activePill : inactivePill)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bicycle Type */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Bicycle Type</span>
        <div className="flex flex-wrap gap-2">
          {BICYCLE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleArrayValue(bicycleTypes, type.value, setBicycleTypes)}
              className={cn('rounded-2xl border text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all duration-200 active:scale-95', bicycleTypes.includes(type.value) ? activePill : inactivePill)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      {[
        { label: 'Electric Assist', checked: electricAssist, onChange: setElectricAssist },
        { label: 'Includes Lock', checked: includesLock, onChange: setIncludesLock },
        { label: 'Includes Helmet', checked: includesHelmet, onChange: setIncludesHelmet },
        { label: 'Includes Basket', checked: includesBasket, onChange: setIncludesBasket },
      ].map(({ label, checked, onChange }) => (
        <div key={label} className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-black/3' : 'hover:bg-white/3')}>
          <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>{label}</Label>
          <Switch checked={checked} onCheckedChange={onChange} />
        </div>
      ))}

      {/* Location */}
      <EmbeddedLocationFilter
        country={locationCountry}
        setCountry={setLocationCountry}
        city={locationCity}
        setCity={setLocationCity}
        neighborhood={locationNeighborhood}
        setNeighborhood={setLocationNeighborhood}
        countries={locationCountries}
        setCountries={setLocationCountries}
        cities={locationCities}
        setCities={setLocationCities}
        neighborhoods={locationNeighborhoods}
        setNeighborhoods={setLocationNeighborhoods}
        multiSelect
      />

      {/* Demographics */}
      <ClientDemographicFilters
        genderPreference={genderPreference}
        setGenderPreference={setGenderPreference}
        nationalities={nationalities}
        setNationalities={setNationalities}
        languages={languages}
        setLanguages={setLanguages}
        ageRange={ageRange}
        setAgeRange={setAgeRange}
        relationshipStatus={relationshipStatus}
        setRelationshipStatus={setRelationshipStatus}
        hasPetsFilter={hasPetsFilter}
        setHasPetsFilter={setHasPetsFilter}
      />
    </div>
  );
}


