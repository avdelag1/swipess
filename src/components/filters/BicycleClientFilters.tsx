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
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bicycle Filters</h3>
        <Badge variant="secondary">{activeCount} active</Badge>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="font-medium">Price Range</Label>
        <div className="flex flex-wrap gap-2">
          {BIKE_PRICE_RANGES.map((range) => (
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

      {/* Bicycle Type */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label>Bicycle Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {BICYCLE_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`bike_type_${type.value}`}
                checked={bicycleTypes.includes(type.value)}
                onCheckedChange={() => toggleArrayValue(bicycleTypes, type.value, setBicycleTypes)}
              />
              <label htmlFor={`bike_type_${type.value}`} className="text-sm cursor-pointer">{type.label}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <Label>Electric Assist</Label>
        <Switch checked={electricAssist} onCheckedChange={setElectricAssist} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Includes Lock</Label>
        <Switch checked={includesLock} onCheckedChange={setIncludesLock} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Includes Helmet</Label>
        <Switch checked={includesHelmet} onCheckedChange={setIncludesHelmet} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Includes Basket</Label>
        <Switch checked={includesBasket} onCheckedChange={setIncludesBasket} />
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


