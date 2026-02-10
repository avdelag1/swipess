import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Save, Home, DollarSign, Bed, Bath, Sparkles, PawPrint, Sofa, Building2, Eye, Compass, Car, Calendar } from 'lucide-react';
import { useSaveClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { toast } from '@/hooks/use-toast';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';

// Predefined budget ranges for rent properties (minimum 3 months, max 1 year deals)
const RENT_BUDGET_RANGES = [
  { value: '250-500', label: '$250 - $500/mo', min: 250, max: 500 },
  { value: '500-1000', label: '$500 - $1,000/mo', min: 500, max: 1000 },
  { value: '1000-3000', label: '$1,000 - $3,000/mo', min: 1000, max: 3000 },
  { value: '3000-5000', label: '$3,000 - $5,000/mo', min: 3000, max: 5000 },
  { value: '5000+', label: '$5,000+/mo', min: 5000, max: 50000 },
];

// Predefined budget ranges for buying properties
const BUY_BUDGET_RANGES = [
  { value: '50000-100000', label: '$50K - $100K', min: 50000, max: 100000 },
  { value: '100000-250000', label: '$100K - $250K', min: 100000, max: 250000 },
  { value: '250000-500000', label: '$250K - $500K', min: 250000, max: 500000 },
  { value: '500000-1000000', label: '$500K - $1M', min: 500000, max: 1000000 },
  { value: '1000000+', label: '$1M+', min: 1000000, max: 50000000 },
];

// Rental duration options
const RENTAL_DURATION_OPTIONS = [
  { value: '3-6', label: '3 - 6 months', minMonths: 3, maxMonths: 6 },
  { value: '6-12', label: '6 - 12 months', minMonths: 6, maxMonths: 12 },
  { value: '12+', label: '12+ months', minMonths: 12, maxMonths: 24 },
];

interface PropertyClientFiltersProps {
  onApply: (filters: any) => void;
  initialFilters?: any;
  activeCount: number;
}

export function PropertyClientFilters({ onApply, initialFilters = {}, activeCount }: PropertyClientFiltersProps) {
  const savePreferencesMutation = useSaveClientFilterPreferences();

  const [interestType, setInterestType] = useState(initialFilters.interest_type || 'both');
  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialFilters.property_types || []);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>(initialFilters.selected_budget_range || '');
  const [rentalDuration, setRentalDuration] = useState<string>(initialFilters.rental_duration || '');
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms_min || 1);
  const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms_min || 1);
  const [amenities, setAmenities] = useState<string[]>(initialFilters.amenities || []);
  const [petFriendly, setPetFriendly] = useState(initialFilters.pet_friendly || false);
  const [furnished, setFurnished] = useState(initialFilters.furnished || false);
  const [squareFeetRange, setSquareFeetRange] = useState([initialFilters.square_feet_min || 0, initialFilters.square_feet_max || 5000]);
  const [yearBuiltRange, setYearBuiltRange] = useState([initialFilters.year_built_min || 1950, initialFilters.year_built_max || new Date().getFullYear()]);
  const [floorLevel, setFloorLevel] = useState<string>(initialFilters.floor_level || 'any');
  const [viewTypes, setViewTypes] = useState<string[]>(initialFilters.view_types || []);
  const [orientations, setOrientations] = useState<string[]>(initialFilters.orientations || []);
  const [hasElevator, setHasElevator] = useState(initialFilters.has_elevator || false);
  const [parkingSpots, setParkingSpots] = useState(initialFilters.parking_spots_min || 0);
  const [genderPreference, setGenderPreference] = useState<string>(initialFilters.gender_preference || 'any');
  const [nationalities, setNationalities] = useState<string[]>(initialFilters.nationalities || []);
  const [languages, setLanguages] = useState<string[]>(initialFilters.languages || []);
  const [relationshipStatus, setRelationshipStatus] = useState<string[]>(initialFilters.relationship_status || []);
  const [hasPetsFilter, setHasPetsFilter] = useState<string>(initialFilters.has_pets_filter || 'any');
  const [ageRange, setAgeRange] = useState([initialFilters.age_min || 18, initialFilters.age_max || 65]);

  // Location filters
  const [locationCountry, setLocationCountry] = useState<string>(initialFilters.location_country || '');
  const [locationCity, setLocationCity] = useState<string>(initialFilters.location_city || '');
  const [locationNeighborhood, setLocationNeighborhood] = useState<string>(initialFilters.location_neighborhood || '');
  const [locationCountries, setLocationCountries] = useState<string[]>(initialFilters.location_countries || []);
  const [locationCities, setLocationCities] = useState<string[]>(initialFilters.location_cities || []);
  const [locationNeighborhoods, setLocationNeighborhoods] = useState<string[]>(initialFilters.location_neighborhoods || []);

  // Get the appropriate budget ranges based on interest type
  const getBudgetRanges = () => {
    if (interestType === 'buy') return BUY_BUDGET_RANGES;
    return RENT_BUDGET_RANGES;
  };

  // Get budget min/max from selected range
  const getBudgetValues = () => {
    const ranges = getBudgetRanges();
    const selected = ranges.find(r => r.value === selectedBudgetRange);
    return selected ? { min: selected.min, max: selected.max } : { min: undefined, max: undefined };
  };

  // Get rental duration values
  const getRentalDurationValues = () => {
    const selected = RENTAL_DURATION_OPTIONS.find(r => r.value === rentalDuration);
    return selected ? { minMonths: selected.minMonths, maxMonths: selected.maxMonths } : { minMonths: undefined, maxMonths: undefined };
  };

  const propertyTypeOptions = ['Apartment', 'House', 'Studio', 'Room', 'Condo'];
  const amenityOptions = [
    'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air Conditioning', 'Heating',
    'Pool', 'Parking', 'Gym', 'Security', 'Garden', 'Balcony',
    'Elevator', 'Doorman', 'Pet Friendly', 'Furnished', 'Dishwasher',
    'Workspace', 'TV', 'Hot Water', 'Smoke Alarm', 'Carbon Monoxide Alarm'
  ];
  const viewTypeOptions = ['Ocean', 'City', 'Garden', 'Mountain', 'Street', 'Pool'];
  const orientationOptions = ['North', 'South', 'East', 'West', 'Northeast', 'Northwest', 'Southeast', 'Southwest'];
  const floorLevelOptions = [
    { value: 'any', label: 'Any Floor' },
    { value: 'ground', label: 'Ground Floor' },
    { value: 'low', label: 'Low (1-3)' },
    { value: 'mid', label: 'Mid (4-7)' },
    { value: 'high', label: 'High (8+)' },
    { value: 'penthouse', label: 'Penthouse' }
  ];

  const handleApply = async () => {
    const budgetValues = getBudgetValues();
    const durationValues = getRentalDurationValues();

    // First, save to database
    try {
      await savePreferencesMutation.mutateAsync({
        interested_in_properties: true,
        min_price: budgetValues.min,
        max_price: budgetValues.max,
        min_bedrooms: bedrooms,
        max_bedrooms: bedrooms + 3, // Allow some flexibility
        min_bathrooms: bathrooms,
        property_types: propertyTypes.length > 0 ? propertyTypes : null,
        amenities_required: amenities.length > 0 ? amenities : null,
        pet_friendly_required: petFriendly,
        furnished_required: furnished,
        preferred_listing_types: interestType === 'both' ? ['rent', 'buy'] : [interestType],
        rental_duration: rentalDuration || null,
        location_zones: locationNeighborhoods.length > 0 ? locationNeighborhoods : null,
      });
      toast({
        title: 'Filters applied!',
        description: 'Your preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
      });
    }

    // Then notify parent
    onApply({
      category: 'property',
      interest_type: interestType,
      property_types: propertyTypes,
      selected_budget_range: selectedBudgetRange,
      budget_min: budgetValues.min,
      budget_max: budgetValues.max,
      rental_duration: rentalDuration,
      rental_min_months: durationValues.minMonths,
      rental_max_months: durationValues.maxMonths,
      bedrooms_min: bedrooms,
      bathrooms_min: bathrooms,
      amenities,
      pet_friendly: petFriendly,
      furnished,
      square_feet_min: squareFeetRange[0],
      square_feet_max: squareFeetRange[1],
      year_built_min: yearBuiltRange[0],
      year_built_max: yearBuiltRange[1],
      floor_level: floorLevel,
      view_types: viewTypes,
      orientations: orientations,
      has_elevator: hasElevator,
      parking_spots_min: parkingSpots,
      gender_preference: genderPreference,
      nationalities,
      languages,
      relationship_status: relationshipStatus,
      has_pets_filter: hasPetsFilter,
      age_min: ageRange[0],
      age_max: ageRange[1],
      // Location filters
      location_country: locationCountry,
      location_city: locationCity,
      location_neighborhood: locationNeighborhood,
      location_countries: locationCountries,
      location_cities: locationCities,
      location_neighborhoods: locationNeighborhoods
    });
  };

  const handleClear = () => {
    setInterestType('both');
    setPropertyTypes([]);
    setSelectedBudgetRange('');
    setRentalDuration('');
    setBedrooms(1);
    setBathrooms(1);
    setAmenities([]);
    setPetFriendly(false);
    setFurnished(false);
    setSquareFeetRange([0, 5000]);
    setYearBuiltRange([1950, new Date().getFullYear()]);
    setFloorLevel('any');
    setViewTypes([]);
    setOrientations([]);
    setHasElevator(false);
    setParkingSpots(0);
    setGenderPreference('any');
    setNationalities([]);
    setLanguages([]);
    setRelationshipStatus([]);
    setHasPetsFilter('any');
    setAgeRange([18, 65]);
    // Clear location filters
    setLocationCountry('');
    setLocationCity('');
    setLocationNeighborhood('');
    setLocationCountries([]);
    setLocationCities([]);
    setLocationNeighborhoods([]);
    onApply({});
  };

  const handleSavePreferences = async () => {
    try {
      const budgetValues = getBudgetValues();
      await savePreferencesMutation.mutateAsync({
        interested_in_properties: true,
        min_price: budgetValues.min,
        max_price: budgetValues.max,
        min_bedrooms: bedrooms,
        min_bathrooms: bathrooms,
        property_types: propertyTypes.length > 0 ? propertyTypes : null,
        amenities_required: amenities.length > 0 ? amenities : null,
        pet_friendly_required: petFriendly,
        furnished_required: furnished,
      });
      toast({
        title: 'Preferences saved!',
        description: 'Your property filter preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
      });
    }
  };

  const toggleItem = (arr: string[], item: string, setter: (val: string[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter(i => i !== item));
    } else {
      setter([...arr, item]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Interest Type Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Home className="w-4 h-4 text-primary" />
            Interest Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {['rent', 'buy', 'both'].map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInterestType(type)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                  interestType === type
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {type === 'rent' ? '🏠 Rent' : type === 'buy' ? '💰 Buy' : '✨ Both'}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Client Demographics */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                Client Profile
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <CardContent className="pt-0">
              <ClientDemographicFilters
                genderPreference={genderPreference}
                setGenderPreference={setGenderPreference}
                ageRange={ageRange}
                setAgeRange={setAgeRange}
                relationshipStatus={relationshipStatus}
                setRelationshipStatus={setRelationshipStatus}
                hasPetsFilter={hasPetsFilter}
                setHasPetsFilter={setHasPetsFilter}
                nationalities={nationalities}
                setNationalities={setNationalities}
                languages={languages}
                setLanguages={setLanguages}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Location Search */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardContent className="pt-4">
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
            multiSelect={true}
            defaultOpen={false}
          />
        </CardContent>
      </Card>

      {/* Budget Range Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4 text-primary" />
            Budget Range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {getBudgetRanges().map((range) => (
              <motion.button
                key={range.value}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedBudgetRange(selectedBudgetRange === range.value ? '' : range.value)}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedBudgetRange === range.value
                    ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {range.label}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rental Duration Card - Only shown for rent */}
      {(interestType === 'rent' || interestType === 'both') && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Rental Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {RENTAL_DURATION_OPTIONS.map((option) => (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRentalDuration(rentalDuration === option.value ? '' : option.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    rentalDuration === option.value
                      ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Types Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-primary" />
            Property Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {propertyTypeOptions.map((type) => (
              <Badge
                key={type}
                variant={propertyTypes.includes(type) ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                  propertyTypes.includes(type)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => toggleItem(propertyTypes, type, setPropertyTypes)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Requirements Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bed className="w-4 h-4 text-primary" />
            Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Bedrooms</Label>
              <span className="font-medium text-primary">{bedrooms}+</span>
            </div>
            <Slider value={[bedrooms]} onValueChange={(v) => setBedrooms(v[0])} min={1} max={6} step={1} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Label>Bathrooms</Label>
              <span className="font-medium text-primary">{bathrooms}+</span>
            </div>
            <Slider value={[bathrooms]} onValueChange={(v) => setBathrooms(v[0])} min={1} max={4} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Amenities Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                Amenities
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={amenities.includes(amenity) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                      amenities.includes(amenity)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleItem(amenities, amenity, setAmenities)}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Preferences Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sofa className="w-4 h-4 text-primary" />
                Preferences
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <CardContent className="pt-0 space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-muted-foreground" />
                  <Label>Pet Friendly</Label>
                </div>
                <Switch checked={petFriendly} onCheckedChange={setPetFriendly} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Sofa className="w-4 h-4 text-muted-foreground" />
                  <Label>Furnished</Label>
                </div>
                <Switch checked={furnished} onCheckedChange={setFurnished} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <Label>Elevator</Label>
                </div>
                <Switch checked={hasElevator} onCheckedChange={setHasElevator} />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* View & Location Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-4 h-4 text-primary" />
                View & Location
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Floor Level</Label>
                <Select value={floorLevel} onValueChange={setFloorLevel}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {floorLevelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">View Type</Label>
                <div className="flex flex-wrap gap-2">
                  {viewTypeOptions.map((view) => (
                    <Badge
                      key={view}
                      variant={viewTypes.includes(view) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        viewTypes.includes(view)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleItem(viewTypes, view, setViewTypes)}
                    >
                      {view}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Orientation</Label>
                <div className="flex flex-wrap gap-2">
                  {orientationOptions.map((o) => (
                    <Badge
                      key={o}
                      variant={orientations.includes(o) ? "default" : "outline"}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        orientations.includes(o)
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleItem(orientations, o, setOrientations)}
                    >
                      {o}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Parking Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <Collapsible defaultOpen={false}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="w-4 h-4 text-primary" />
                Parking
              </CardTitle>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-accordion-down">
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Minimum Parking Spots</Label>
                  <span className="font-medium text-primary">{parkingSpots}</span>
                </div>
                <Slider
                  value={[parkingSpots]}
                  onValueChange={(v) => setParkingSpots(v[0])}
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Action Button */}
      <div className="pt-4">
        <Button onClick={handleApply} className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 h-12 text-base font-semibold">
          Apply
        </Button>
      </div>
    </div>
  );
}
