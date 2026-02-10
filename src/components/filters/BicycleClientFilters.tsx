import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Save } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useSaveClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { toast } from '@/hooks/use-toast';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';

// Predefined budget ranges for bicycles (rent)
const BICYCLE_RENT_BUDGET_RANGES = [
  { value: '10-25', label: '$10 - $25/day', min: 10, max: 25 },
  { value: '25-50', label: '$25 - $50/day', min: 25, max: 50 },
  { value: '50-100', label: '$50 - $100/day', min: 50, max: 100 },
  { value: '100+', label: '$100+/day', min: 100, max: 500 },
];

// Predefined budget ranges for bicycles (buy)
const BICYCLE_BUY_BUDGET_RANGES = [
  { value: '200-500', label: '$200 - $500', min: 200, max: 500 },
  { value: '500-1000', label: '$500 - $1K', min: 500, max: 1000 },
  { value: '1000-2500', label: '$1K - $2.5K', min: 1000, max: 2500 },
  { value: '2500-5000', label: '$2.5K - $5K', min: 2500, max: 5000 },
  { value: '5000+', label: '$5K+', min: 5000, max: 50000 },
];

interface BicycleClientFiltersProps {
  onApply: (filters: any) => void;
  initialFilters?: any;
  activeCount: number;
}

export function BicycleClientFilters({ onApply, initialFilters = {}, activeCount }: BicycleClientFiltersProps) {
  const savePreferencesMutation = useSaveClientFilterPreferences();

  const [interestType, setInterestType] = useState(initialFilters.interest_type || 'both');
  const [bicycleTypes, setBicycleTypes] = useState<string[]>(initialFilters.bicycle_types || []);
  const [frameSize, setFrameSize] = useState(initialFilters.frame_size || 'any');
  const [terrainPreference, setTerrainPreference] = useState<string[]>(initialFilters.terrain_preference || []);
  const [accessories, setAccessories] = useState<string[]>(initialFilters.accessories_needed || []);
  const [fitnessLevel, setFitnessLevel] = useState(initialFilters.fitness_level || 'any');

  // Budget with predefined ranges
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>(initialFilters.selected_budget_range || '');
  const [condition, setCondition] = useState(initialFilters.condition || 'any');
  const [wheelSizes, setWheelSizes] = useState<string[]>(initialFilters.wheel_sizes || []);
  const [suspensionType, setSuspensionType] = useState(initialFilters.suspension_type || 'any');
  const [material, setMaterial] = useState(initialFilters.material || 'any');
  const [gearRange, setGearRange] = useState([initialFilters.gears_min || 1, initialFilters.gears_max || 30]);
  const [batteryRange, setBatteryRange] = useState(initialFilters.battery_range_min || 0);
  const [yearRange, setYearRange] = useState([initialFilters.year_min || 2010, initialFilters.year_max || new Date().getFullYear()]);
  const [isElectricOnly, setIsElectricOnly] = useState(initialFilters.is_electric_only || false);

  // Get budget ranges based on interest type
  const getBudgetRanges = () => {
    if (interestType === 'buy') return BICYCLE_BUY_BUDGET_RANGES;
    return BICYCLE_RENT_BUDGET_RANGES;
  };

  const getBudgetValues = () => {
    const ranges = getBudgetRanges();
    const selected = ranges.find(r => r.value === selectedBudgetRange);
    return selected ? { min: selected.min, max: selected.max } : { min: undefined, max: undefined };
  };

  // Client demographic filters
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

  const bicycleTypeOptions = ['Road Bike', 'Mountain Bike', 'Electric Bike', 'Hybrid', 'BMX', 'Folding'];
  const terrainOptions = ['Urban', 'Trail', 'Road', 'All-Terrain', 'Beach'];
  const accessoryOptions = ['Helmet', 'Lights', 'Basket', 'Lock', 'Water Bottle Holder'];
  const wheelSizeOptions = ['20"', '24"', '26"', '27.5"', '29"', '700c', '650b'];
  const conditionOptions = [
    { value: 'any', label: 'Any Condition' },
    { value: 'new', label: 'Brand New' },
    { value: 'like-new', label: 'Like New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];
  const suspensionOptions = [
    { value: 'any', label: 'Any Suspension' },
    { value: 'rigid', label: 'Rigid (No Suspension)' },
    { value: 'hardtail', label: 'Hardtail (Front Only)' },
    { value: 'full', label: 'Full Suspension' }
  ];
  const materialOptions = [
    { value: 'any', label: 'Any Material' },
    { value: 'aluminum', label: 'Aluminum' },
    { value: 'carbon', label: 'Carbon Fiber' },
    { value: 'steel', label: 'Steel' },
    { value: 'titanium', label: 'Titanium' }
  ];

  const handleApply = async () => {
    const budgetValues = getBudgetValues();
    
    // Save to database
    try {
      await savePreferencesMutation.mutateAsync({
        interested_in_bicycles: true,
        bicycle_types: bicycleTypes.length > 0 ? bicycleTypes : null,
        bicycle_price_min: budgetValues.min,
        bicycle_price_max: budgetValues.max,
        bicycle_wheel_sizes: wheelSizes.length > 0 ? wheelSizes : null,
        bicycle_suspension_type: suspensionType !== 'any' ? [suspensionType] : null,
        bicycle_material: material !== 'any' ? [material] : null,
        bicycle_gears_min: gearRange[0],
        bicycle_gears_max: gearRange[1],
        bicycle_year_min: yearRange[0],
        bicycle_condition: condition !== 'any' ? [condition] : null,
        bicycle_is_electric: isElectricOnly || null,
        bicycle_battery_range_min: batteryRange || null,
      });
      toast({
        title: 'Filters applied!',
        description: 'Your bicycle preferences have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences.',
        variant: 'destructive',
      });
    }

    onApply({
      category: 'bicycle',
      interest_type: interestType,
      bicycle_types: bicycleTypes,
      frame_size: frameSize,
      terrain_preference: terrainPreference,
      accessories_needed: accessories,
      fitness_level: fitnessLevel,
      selected_budget_range: selectedBudgetRange,
      price_min: budgetValues.min,
      price_max: budgetValues.max,
      condition: condition,
      wheel_sizes: wheelSizes,
      suspension_type: suspensionType,
      material: material,
      gears_min: gearRange[0],
      gears_max: gearRange[1],
      battery_range_min: batteryRange,
      year_min: yearRange[0],
      year_max: yearRange[1],
      is_electric_only: isElectricOnly,
      // Client demographic filters
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
    setBicycleTypes([]);
    setFrameSize('any');
    setTerrainPreference([]);
    setAccessories([]);
    setFitnessLevel('any');
    setSelectedBudgetRange('');
    setCondition('any');
    setWheelSizes([]);
    setSuspensionType('any');
    setMaterial('any');
    setGearRange([1, 30]);
    setBatteryRange(0);
    setYearRange([2010, new Date().getFullYear()]);
    setIsElectricOnly(false);
    // Clear client demographic filters
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
        interested_in_bicycles: true,
        bicycle_types: bicycleTypes.length > 0 ? bicycleTypes : null,
        bicycle_price_min: budgetValues.min,
        bicycle_price_max: budgetValues.max,
        bicycle_wheel_sizes: wheelSizes.length > 0 ? wheelSizes : null,
        bicycle_suspension_type: suspensionType !== 'any' ? [suspensionType] : null,
        bicycle_material: material !== 'any' ? [material] : null,
        bicycle_gears_min: gearRange[0],
        bicycle_gears_max: gearRange[1],
        bicycle_year_min: yearRange[0],
        bicycle_condition: condition !== 'any' ? [condition] : null,
        bicycle_is_electric: isElectricOnly || null,
        bicycle_battery_range_min: batteryRange > 0 ? batteryRange : null,
      });
      toast({
        title: 'Preferences saved!',
        description: 'Your bicycle filter preferences have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Bicycle Filters</h3>
        {activeCount > 0 && (
          <Badge variant="default">{activeCount} Active</Badge>
        )}
      </div>

      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Interest Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={interestType} onValueChange={setInterestType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rent">Rent Only</SelectItem>
              <SelectItem value="buy">Buy Only</SelectItem>
              <SelectItem value="both">Rent or Buy</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Filter clients looking to rent, purchase, or both bicycles</p>
        </CollapsibleContent>
      </Collapsible>

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

      {/* Location Search */}
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

      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Bicycle Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {bicycleTypeOptions.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  checked={bicycleTypes.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setBicycleTypes([...bicycleTypes, type]);
                    } else {
                      setBicycleTypes(bicycleTypes.filter(t => t !== type));
                    }
                  }}
                />
                <Label className="text-sm">{type}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Match clients with preferences for specific bike categories</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Frame Size</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={frameSize} onValueChange={setFrameSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Size</SelectItem>
              <SelectItem value="small">Small (5'0" - 5'4")</SelectItem>
              <SelectItem value="medium">Medium (5'5" - 5'9")</SelectItem>
              <SelectItem value="large">Large (5'10" - 6'2")</SelectItem>
              <SelectItem value="xl">X-Large (6'3"+)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Find clients by fit to avoid mismatches in sizing</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Terrain Preference</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {terrainOptions.map((terrain) => (
              <div key={terrain} className="flex items-center space-x-2">
                <Checkbox
                  checked={terrainPreference.includes(terrain)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setTerrainPreference([...terrainPreference, terrain]);
                    } else {
                      setTerrainPreference(terrainPreference.filter(t => t !== terrain));
                    }
                  }}
                />
                <Label className="text-sm">{terrain}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Target clients based on where they plan to ride</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Accessories Needed</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {accessoryOptions.map((accessory) => (
              <div key={accessory} className="flex items-center space-x-2">
                <Checkbox
                  checked={accessories.includes(accessory)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setAccessories([...accessories, accessory]);
                    } else {
                      setAccessories(accessories.filter(a => a !== accessory));
                    }
                  }}
                />
                <Label className="text-sm">{accessory}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Connect with clients seeking bundles or add-ons</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Fitness Level</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Level</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="fitness">Fitness Enthusiast</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Filter by rider's activity level for appropriate recommendations</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible defaultOpen className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Budget Range</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="flex flex-wrap gap-2">
            {getBudgetRanges().map((range) => (
              <Badge
                key={range.value}
                variant={selectedBudgetRange === range.value ? "default" : "outline"}
                className={`cursor-pointer transition-all duration-200 hover:scale-105 py-2 px-3 ${
                  selectedBudgetRange === range.value
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedBudgetRange(selectedBudgetRange === range.value ? '' : range.value)}
              >
                {range.label}
              </Badge>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Condition</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={condition} onValueChange={setCondition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Filter by bicycle condition and quality</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Wheel Size</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {wheelSizeOptions.map((size) => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  checked={wheelSizes.includes(size)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setWheelSizes([...wheelSizes, size]);
                    } else {
                      setWheelSizes(wheelSizes.filter(s => s !== size));
                    }
                  }}
                />
                <Label className="text-sm">{size}</Label>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Match clients by preferred wheel diameter</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Suspension Type</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={suspensionType} onValueChange={setSuspensionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {suspensionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Filter by suspension configuration</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Frame Material</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {materialOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">Filter by frame construction material</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Number of Gears</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{gearRange[0]} gears</span>
              <span>{gearRange[1]} gears</span>
            </div>
            <Slider
              value={gearRange}
              onValueChange={setGearRange}
              min={1}
              max={30}
              step={1}
              className="w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground">Filter by gear count range</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">Year/Age</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{yearRange[0]}</span>
              <span>{yearRange[1]}</span>
            </div>
            <Slider
              value={yearRange}
              onValueChange={setYearRange}
              min={2010}
              max={new Date().getFullYear()}
              step={1}
              className="w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground">Filter by manufacturing year</p>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="space-y-2">
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
          <Label className="font-medium">E-Bike Features</Label>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <Label>E-Bikes Only</Label>
            <Switch checked={isElectricOnly} onCheckedChange={setIsElectricOnly} />
          </div>
          {(isElectricOnly || bicycleTypes.includes('Electric Bike')) && (
            <div className="space-y-2">
              <Label className="text-sm">Minimum Battery Range: {batteryRange} miles</Label>
              <Slider
                value={[batteryRange]}
                onValueChange={(v) => setBatteryRange(v[0])}
                min={0}
                max={150}
                step={5}
              />
              <p className="text-sm text-muted-foreground">Required electric range per charge</p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-4">
        <Button onClick={handleApply} className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 h-12 text-base font-semibold">
          Apply
        </Button>
      </div>
    </div>
  );
}
