import { memo, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';
import { SmartSelector } from '@/components/listing/SmartSelector';
import { ChipMultiSelect } from '@/components/listing/ChipMultiSelect';
import { PROPERTY_TYPES } from '@/constants/listingTaxonomies';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

const LISTING_TYPES = [
  { value: 'rent', label: 'For Rent' },
  { value: 'sale', label: 'For Sale' },
] as const;

const PRICE_RANGES = [
  { value: '0-500', label: '$0 - $500', min: 0, max: 500 },
  { value: '500-1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { value: '1000-2000', label: '$1,000 - $2,000', min: 1000, max: 2000 },
  { value: '2000-5000', label: '$2,000 - $5,000', min: 2000, max: 5000 },
  { value: '5000+', label: '$5,000+', min: 5000, max: 100000 },
] as const;

interface PropertyClientFiltersProps {
  onApply: (filters: Record<string, unknown>) => void;
  initialFilters?: Record<string, unknown>;
  activeCount: number;
}

function PropertyClientFiltersComponent({ onApply, initialFilters = {}, activeCount }: PropertyClientFiltersProps) {
  const { isLight } = useAppTheme();
  const sectionLabel = isLight ? 'text-black/50' : 'text-white/40';
  const triggerCls = cn(
    'flex items-center justify-between w-full py-2 px-1 rounded-xl transition-colors text-[11px] font-black uppercase tracking-widest min-h-10',
    isLight ? 'hover:bg-black/5 text-black' : 'hover:bg-white/5 text-white',
  );

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

  const [genderPreference, setGenderPreference] = useState<string>((initialFilters.gender_preference as string) || 'any');
  const [nationalities, setNationalities] = useState<string[]>((initialFilters.nationalities as string[]) || []);
  const [languages, setLanguages] = useState<string[]>((initialFilters.languages as string[]) || []);
  const [ageRange, setAgeRange] = useState([
    (initialFilters.age_min as number) || 18,
    (initialFilters.age_max as number) || 65,
  ]);
  const [relationshipStatus, setRelationshipStatus] = useState<string[]>((initialFilters.relationship_status as string[]) || []);
  const [hasPetsFilter, setHasPetsFilter] = useState<string>((initialFilters.has_pets_filter as string) || 'any');

  const [locationCountry, setLocationCountry] = useState<string>((initialFilters.location_country as string) || '');
  const [locationCity, setLocationCity] = useState<string>((initialFilters.location_city as string) || '');
  const [locationNeighborhood, setLocationNeighborhood] = useState<string>((initialFilters.location_neighborhood as string) || '');
  const [locationCountries, setLocationCountries] = useState<string[]>((initialFilters.location_countries as string[]) || []);
  const [locationCities, setLocationCities] = useState<string[]>((initialFilters.location_cities as string[]) || []);
  const [locationNeighborhoods, setLocationNeighborhoods] = useState<string[]>((initialFilters.location_neighborhoods as string[]) || []);

  const priceLabels = PRICE_RANGES.map((r) => r.label);
  const priceChipValue = selectedPriceRange
    ? [PRICE_RANGES.find((r) => r.value === selectedPriceRange)?.label ?? '']
    : [];

  const listingTypeLabels = LISTING_TYPES.map((t) => t.label);
  const listingTypeChipValue = listingTypes.map((v) => LISTING_TYPES.find((t) => t.value === v)?.label ?? v);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const priceRange = PRICE_RANGES.find((r) => r.value === selectedPriceRange);
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
        {activeCount > 0 && (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', isLight ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary')}>
            {activeCount} active
          </span>
        )}
      </div>

      <div className="space-y-2">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Price Range</span>
        <ChipMultiSelect
          accent="rose"
          single
          options={priceLabels}
          value={priceChipValue.filter(Boolean)}
          onChange={(labels) => {
            const hit = PRICE_RANGES.find((r) => r.label === labels[0]);
            setSelectedPriceRange(hit?.value ?? '');
          }}
        />
      </div>

      <SmartSelector
        label="Property Type"
        accent="rose"
        forceSheet
        options={[...PROPERTY_TYPES]}
        value={propertyTypes}
        onChange={setPropertyTypes}
        placeholder="Apartment, house, penthouse…"
        searchPlaceholder="Search property types…"
      />

      <div className="space-y-2">
        <span className={cn('text-[10px] font-black uppercase tracking-widest px-1', sectionLabel)}>Listing Type</span>
        <ChipMultiSelect
          accent="rose"
          options={listingTypeLabels}
          value={listingTypeChipValue}
          onChange={(labels) => {
            const next = labels.map((lbl) => LISTING_TYPES.find((t) => t.label === lbl)?.value ?? lbl);
            setListingTypes(next);
          }}
        />
      </div>

      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Bedrooms: {bedrooms[0]} – {bedrooms[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={0} max={10} step={1} value={bedrooms} onValueChange={setBedrooms} />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible>
        <CollapsibleTrigger className={triggerCls}>
          <span>Bathrooms: {bathrooms[0]} – {bathrooms[1]}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-1">
          <Slider min={0} max={5} step={1} value={bathrooms} onValueChange={setBathrooms} />
        </CollapsibleContent>
      </Collapsible>

      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl min-h-11', isLight ? 'hover:bg-black/3' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Furnished</Label>
        <Switch checked={furnished} onCheckedChange={setFurnished} />
      </div>
      <div className={cn('flex items-center justify-between py-2 px-1 rounded-xl min-h-11', isLight ? 'hover:bg-black/3' : 'hover:bg-white/3')}>
        <Label className={cn('text-[11px] font-black uppercase tracking-widest cursor-pointer', isLight ? 'text-black' : 'text-white')}>Pet Friendly</Label>
        <Switch checked={petFriendly} onCheckedChange={setPetFriendly} />
      </div>

      <EmbeddedLocationFilter
        accent="rose"
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

export const PropertyClientFilters = memo(PropertyClientFiltersComponent);