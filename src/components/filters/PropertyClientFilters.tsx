import { useState, useEffect, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'studio', label: 'Studio' },
  { value: 'room', label: 'Room' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'loft', label: 'Loft' },
];

const LISTING_TYPES = [
  { value: 'rent', label: 'For Rent' },
  { value: 'sale', label: 'For Sale' },
];

const PRICE_RANGES = [
  { value: '0-500', label: '$0 - $500', min: 0, max: 500 },
  { value: '500-1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { value: '1000-2000', label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { value: '2000-5000', label: '$2,000 - $5,000', min: 2000, max: 5000 },
  { value: '5000+', label: '$5,000+', min: 5000, max: 100000 },
];

interface PropertyClientFiltersProps {
  onApply: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
  activeCount: number;
}

export function PropertyClientFilters({ onApply, initialFilters = {}, activeCount }: PropertyClientFiltersProps) {
  const { isLight } = useAppTheme();
  const activePill = 'bg-primary border-primary text-primary-foreground shadow-sm scale-[1.03]';
  const inactivePill = isLight
    ? 'bg-white border-black/10 text-black hover:bg-black/5 shadow-sm'
    : 'bg-white/8 border-white/10 text-white hover:bg-white/12';
  const sectionLabel = isLight ? 'text-black/50' : 'text-white/40';
  const triggerCls = cn('flex items-center justify-between w-full py-2 px-1 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest', isLight ? 'hover:bg-black/5 text-black' : 'hover:bg-white/5 text-white');
  const [propertyTypes, setPropertyTypes] = useState<string[]>((initialFilters.property_types as string[]) || []);
  const [listingTypes, setListingTypes] = useState<string[]>((initialFilters.listing_types as string[]) || []);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>((initialFilters.selected_price_range as string) || '');
  const [bedrooms, setBedrooms] = useState([
    (initialFilters.min_bedrooms as number) || 0,
    (initialFilters.max_bedrooms as number) || 10,
  ]);
  const [bathrooms, setBathrooms] = useState([
    (initialFilters.min_bathrooms as number) || 0,
    (initialFilters.max_bathrooms as number) || 5,
  ]);
  const [furnished, setFurnished] = useState((initialFilters.furnished as boolean) ?? false);
  const [petFriendly, setPetFriendly] = useState((initialFilters.pet_friendly as boolean) ?? false);

  // Demographics
  const [genderPreference, setGenderPreference] = useState<string>((initialFilters.gender_preference as string) || 'any');
  const [nationalities, setNationalities] = useState<string[]>((initialFilters.nationalities as string[]) || []);
  const [languages, setLanguages] = useState<string[]>((initialFilters.languages as string[]) || []);
  const [ageRange, setAgeRange] = useState([
    (initialFilters.age_min as number) || 18,
    (initialFilters.age_max as number) || 65,
  ]);

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
    const priceRange = PRICE_RANGES.find(r => r.value === selectedPriceRange);
    onApply({
      property_types: propertyTypes,
      listing_types: listingTypes,
      selected_price_range: selectedPriceRange,
      price_min: priceRange?.min,
      price_max: priceRange?.max,
      min_bedrooms: bedrooms[0],
      max_bedrooms: bedrooms[1],
      min_bathrooms: bathrooms[0],
      max_bathrooms: bathrooms[1],
      furnished,
      pet_friendly: petFriendly,
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
  }, [propertyTypes, listingTypes, selectedPriceRange, bedrooms, bathrooms, furnished, petFriendly, genderPreference, nationalities, languages, ageRange, locationCountries, locationCities, locationNeighborhoods]);

  return (
    <div className="space-y-5 p-2">
      <div className="flex items-center justify-between px-1">
        <span className={cn('text-[10px] font-black uppercase tracking-widest', sectionLabel)}>Property Filters</span>
        {activeCount > 0 && <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', isLight ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary')}>{activeCount} active</span>}
      </div>

      {/* Price Range */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Price Range</span>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => (
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

      {/* Property Type */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Property Type</span>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleArrayValue(propertyTypes, type.value, setPropertyTypes)}
              className={cn('rounded-2xl border text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all duration-200 active:scale-95', propertyTypes.includes(type.value) ? activePill : inactivePill)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-2.5">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Listing Type</span>
        <div className="flex flex-wrap gap-2">
          {LISTING_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => toggleArrayValue(listingTypes, type.value, setListingTypes)}
              className={cn('rounded-2xl border text-[11px] font-black uppercase tracking-widest px-4 py-2 transition-all duration-200 active:scale-95', listingTypes.includes(type.value) ? activePill : inactivePill)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bedrooms */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Bedrooms: {bedrooms[0]} – {bedrooms[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={0} max={10} step={1} value={bedrooms} onValueChange={setBedrooms} />
        </CollapsibleContent>
      </Collapsible>

      {/* Bathrooms */}
      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Bathrooms: {bathrooms[0]} – {bathrooms[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={0} max={5} step={1} value={bathrooms} onValueChange={setBathrooms} />
        </CollapsibleContent>
      </Collapsible>

      {/* Toggles */}
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-black/3' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Furnished</Label>
        <Switch checked={furnished} onCheckedChange={setFurnished} />
      </div>
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl', isLight ? 'hover:bg-black/3' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Pet Friendly</Label>
        <Switch checked={petFriendly} onCheckedChange={setPetFriendly} />
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


