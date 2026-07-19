import { memo, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { YACHT_TYPE } from '@/constants/listingTaxonomies';

const YACHT_PRICE_RANGES = [
  { value: '0-500', label: '$0 - $500/day', min: 0, max: 500 },
  { value: '500-1000', label: '$500 - $1,000/day', min: 500, max: 1000 },
  { value: '1000-3000', label: '$1,000 - $3,000/day', min: 1000, max: 3000 },
  { value: '3000+', label: '$3,000+/day', min: 3000, max: 50000 },
];

interface YachtClientFiltersProps {
  onApply: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
  activeCount: number;
}

function YachtClientFiltersComponent({ onApply, initialFilters = {}, activeCount }: YachtClientFiltersProps) {
  const { isLight } = useAppTheme();
  const activePill = 'bg-primary border-primary text-primary-foreground shadow-sm ring-1 ring-primary/40';
  const inactivePill = isLight ? 'bg-secondary border-border text-foreground hover:bg-secondary/80 shadow-sm' : 'bg-white/8 border-white/10 text-white hover:bg-white/12';
  const sectionLabel = isLight ? 'text-black/50' : 'text-white/40';
  const triggerCls = cn('flex items-center justify-between w-full py-2 px-1 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest', isLight ? 'hover:bg-slate-100 text-black' : 'hover:bg-white/5 text-white');
  
  const [yachtTypes, setYachtTypes] = useState<string[]>((initialFilters.yacht_types as string[]) || []);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>((initialFilters.selected_price_range as string) || '');
  const [yearRange, setYearRange] = useState([
    (initialFilters.year_min as number) || 1990,
    (initialFilters.year_max as number) || new Date().getFullYear(),
  ]);
  const [lengthRange, setLengthRange] = useState([
    (initialFilters.length_min as number) || 5,
    (initialFilters.length_max as number) || 60,
  ]);
  const [berthsRange, setBerthsRange] = useState([
    (initialFilters.berths_min as number) || 1,
    (initialFilters.berths_max as number) || 10,
  ]);
  const [passengersRange, setPassengersRange] = useState([
    (initialFilters.passengers_min as number) || 2,
    (initialFilters.passengers_max as number) || 50,
  ]);
  
  const [captainIncluded, setCaptainIncluded] = useState((initialFilters.captain_included as boolean) ?? false);
  const [crewIncluded, setCrewIncluded] = useState((initialFilters.crew_included as boolean) ?? false);
  const [fuelIncluded, setFuelIncluded] = useState((initialFilters.fuel_included as boolean) ?? false);

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
    const priceRange = YACHT_PRICE_RANGES.find(r => r.value === selectedPriceRange);
    onApply({
      yacht_types: yachtTypes,
      selected_price_range: selectedPriceRange,
      price_min: priceRange?.min,
      price_max: priceRange?.max,
      year_min: yearRange[0],
      year_max: yearRange[1],
      length_min: lengthRange[0],
      length_max: lengthRange[1],
      berths_min: berthsRange[0],
      berths_max: berthsRange[1],
      passengers_min: passengersRange[0],
      passengers_max: passengersRange[1],
      captain_included: captainIncluded,
      crew_included: crewIncluded,
      fuel_included: fuelIncluded,
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
  }, [yachtTypes, selectedPriceRange, yearRange, lengthRange, berthsRange, passengersRange, captainIncluded, crewIncluded, fuelIncluded, genderPreference, nationalities, languages, ageRange, locationCountries, locationCities, locationNeighborhoods]);

  return (
    <div className="space-y-5 p-2">
      <div className="flex items-center justify-between px-1">
        <span className={cn('text-[10px] font-black uppercase tracking-widest', sectionLabel)}>Yacht Filters</span>
        {activeCount > 0 && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', isLight ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary')}>{activeCount} active</span>}
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Price Range (Per Day)</span>
        <div className="flex flex-wrap gap-2">
          {YACHT_PRICE_RANGES.map((range) => (
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

      {/* Yacht Type */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Yacht Type</span>
        <div className="flex flex-wrap gap-2">
          {YACHT_TYPE.map((type) => (
            <button
              key={type}
              onClick={() => toggleArrayValue(yachtTypes, type, setYachtTypes)}
              className={cn('rounded-2xl border text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all duration-200 active:scale-95', yachtTypes.includes(type) ? activePill : inactivePill)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Year Range */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Year: {yearRange[0]} – {yearRange[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={1990} max={new Date().getFullYear()} step={1} value={yearRange} onValueChange={setYearRange} />
        </CollapsibleContent>
      </Collapsible>

      {/* Length */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Length: {lengthRange[0]}m – {lengthRange[1]}m</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={5} max={60} step={1} value={lengthRange} onValueChange={setLengthRange} />
        </CollapsibleContent>
      </Collapsible>

      {/* Berths */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Berths/Cabins: {berthsRange[0]} – {berthsRange[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={1} max={10} step={1} value={berthsRange} onValueChange={setBerthsRange} />
        </CollapsibleContent>
      </Collapsible>

      {/* Passengers */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Passengers: {passengersRange[0]} – {passengersRange[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={2} max={50} step={1} value={passengersRange} onValueChange={setPassengersRange} />
        </CollapsibleContent>
      </Collapsible>

      {/* Toggles */}
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-slate-50' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Captain Included</Label>
        <Switch checked={captainIncluded} onCheckedChange={setCaptainIncluded} />
      </div>
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-slate-50' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Crew Included</Label>
        <Switch checked={crewIncluded} onCheckedChange={setCrewIncluded} />
      </div>
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-slate-50' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Fuel Included</Label>
        <Switch checked={fuelIncluded} onCheckedChange={setFuelIncluded} />
      </div>

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

export const YachtClientFilters = memo(YachtClientFiltersComponent);
