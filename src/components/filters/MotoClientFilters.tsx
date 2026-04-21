import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';

const MOTO_TYPES = [
  { value: 'sport', label: 'Sport' },
  { value: 'cruiser', label: 'Cruiser' },
  { value: 'touring', label: 'Touring' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'naked', label: 'Naked/Standard' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'dirt', label: 'Dirt/Off-road' },
];

const MOTO_PRICE_RANGES = [
  { value: '0-50', label: '$0 - $50/day', min: 0, max: 50 },
  { value: '50-100', label: '$50 - $100/day', min: 50, max: 100 },
  { value: '100-200', label: '$100 - $200/day', min: 100, max: 200 },
  { value: '200+', label: '$200+/day', min: 200, max: 10000 },
];

interface MotoClientFiltersProps {
  onApply: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
  activeCount: number;
}

export function MotoClientFilters({ onApply, initialFilters = {}, activeCount }: MotoClientFiltersProps) {
  const [motoTypes, setMotoTypes] = useState<string[]>((initialFilters.moto_types as string[]) || []);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>((initialFilters.selected_price_range as string) || '');
  const [yearRange, setYearRange] = useState([
    (initialFilters.year_min as number) || 2000,
    (initialFilters.year_max as number) || new Date().getFullYear(),
  ]);
  const [engineCcRange, setEngineCcRange] = useState([
    (initialFilters.engine_cc_min as number) || 50,
    (initialFilters.engine_cc_max as number) || 1800,
  ]);
  const [includesHelmet, setIncludesHelmet] = useState((initialFilters.includes_helmet as boolean) ?? false);
  const [includesGear, setIncludesGear] = useState((initialFilters.includes_gear as boolean) ?? false);
  const [hasAbs, setHasAbs] = useState((initialFilters.has_abs as boolean) ?? false);

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
    const priceRange = MOTO_PRICE_RANGES.find(r => r.value === selectedPriceRange);
    onApply({
      moto_types: motoTypes,
      selected_price_range: selectedPriceRange,
      price_min: priceRange?.min,
      price_max: priceRange?.max,
      year_min: yearRange[0],
      year_max: yearRange[1],
      engine_cc_min: engineCcRange[0],
      engine_cc_max: engineCcRange[1],
      includes_helmet: includesHelmet,
      includes_gear: includesGear,
      has_abs: hasAbs,
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
  }, [motoTypes, selectedPriceRange, yearRange, engineCcRange, includesHelmet, includesGear, hasAbs, genderPreference, nationalities, languages, ageRange, locationCountries, locationCities, locationNeighborhoods]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Motorcycle Filters</h3>
        <Badge variant="secondary">{activeCount} active</Badge>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="font-medium">Price Range</Label>
        <div className="flex flex-wrap gap-2">
          {MOTO_PRICE_RANGES.map((range) => (
            <Badge
              key={range.value}
              variant={selectedPriceRange === range.value ? "default" : "outline"}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 py-2 px-3 ${
                selectedPriceRange === range.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedPriceRange(selectedPriceRange === range.value ? '' : range.value)}
            >
              {range.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Moto Type */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label>Motorcycle Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {MOTO_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`moto_type_${type.value}`}
                checked={motoTypes.includes(type.value)}
                onCheckedChange={() => toggleArrayValue(motoTypes, type.value, setMotoTypes)}
              />
              <label htmlFor={`moto_type_${type.value}`} className="text-sm cursor-pointer">{type.label}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Year Range */}
      <div className="space-y-2">
        <Label className="font-medium">Year: {yearRange[0]} - {yearRange[1]}</Label>
        <Slider min={2000} max={new Date().getFullYear()} step={1} value={yearRange} onValueChange={setYearRange} />
      </div>

      {/* Engine CC */}
      <div className="space-y-2">
        <Label className="font-medium">Engine: {engineCcRange[0]}cc - {engineCcRange[1]}cc</Label>
        <Slider min={50} max={1800} step={50} value={engineCcRange} onValueChange={setEngineCcRange} />
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <Label>Includes Helmet</Label>
        <Switch checked={includesHelmet} onCheckedChange={setIncludesHelmet} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Includes Gear</Label>
        <Switch checked={includesGear} onCheckedChange={setIncludesGear} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Has ABS</Label>
        <Switch checked={hasAbs} onCheckedChange={setHasAbs} />
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

