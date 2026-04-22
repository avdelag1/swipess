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
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Property Filters</h3>
        <Badge variant="secondary">{activeCount} active</Badge>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="font-medium">Price Range</Label>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => (
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

      {/* Property Type */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label>Property Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {PROPERTY_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`prop_type_${type.value}`}
                checked={propertyTypes.includes(type.value)}
                onCheckedChange={() => toggleArrayValue(propertyTypes, type.value, setPropertyTypes)}
              />
              <label htmlFor={`prop_type_${type.value}`} className="text-sm cursor-pointer">{type.label}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Listing Type */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <Label>Listing Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-2">
          {LISTING_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`listing_type_${type.value}`}
                checked={listingTypes.includes(type.value)}
                onCheckedChange={() => toggleArrayValue(listingTypes, type.value, setListingTypes)}
              />
              <label htmlFor={`listing_type_${type.value}`} className="text-sm cursor-pointer">{type.label}</label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Bedrooms */}
      <div className="space-y-2">
        <Label className="font-medium">Bedrooms: {bedrooms[0]} - {bedrooms[1]}</Label>
        <Slider min={0} max={10} step={1} value={bedrooms} onValueChange={setBedrooms} />
      </div>

      {/* Bathrooms */}
      <div className="space-y-2">
        <Label className="font-medium">Bathrooms: {bathrooms[0]} - {bathrooms[1]}</Label>
        <Slider min={0} max={5} step={1} value={bathrooms} onValueChange={setBathrooms} />
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <Label>Furnished</Label>
        <Switch checked={furnished} onCheckedChange={setFurnished} />
      </div>
      <div className="flex items-center justify-between">
        <Label>Pet Friendly</Label>
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


