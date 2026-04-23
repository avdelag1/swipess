import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Home, DollarSign, Bed, Sparkles, PawPrint, Sofa, Building2, Eye, Car, Calendar, Globe, Key, Tag, Repeat, Bike, Briefcase } from 'lucide-react';
import { useSaveClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ClientDemographicFilters } from './ClientDemographicFilters';
import { EmbeddedLocationFilter } from './EmbeddedLocationFilter';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { triggerHaptic } from '@/utils/haptics';

// Predefined budget ranges for motorcycles (rent)
const MOTO_RENT_BUDGET_RANGES = [
  { value: '50-150', label: '$50 - $150/d', min: 50, max: 150 },
  { value: '150-300', label: '$150 - $300/d', min: 150, max: 300 },
  { value: '300-500', label: '$300 - $500/d', min: 300, max: 500 },
  { value: '500+', label: '$500+/d', min: 500, max: 5000 },
];

// Predefined budget ranges for motorcycles (buy)
const MOTO_BUY_BUDGET_RANGES = [
  { value: '1000-3000', label: '$1K - $3K', min: 1000, max: 3000 },
  { value: '3000-7000', label: '$3K - $7K', min: 3000, max: 7000 },
  { value: '7000-15000', label: '$7K - $15K', min: 7000, max: 15000 },
  { value: '15000+', label: '$15K+', min: 15000, max: 500000 },
];

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

interface DiscoveryFiltersProps {
  category: 'property' | 'motorcycle' | 'bicycle' | 'service';
  onApply: (filters: any) => void;
  initialFilters?: any;
  activeCount: number;
  hideApplyButton?: boolean;
}

export function DiscoveryFilters({ category, onApply, initialFilters = {}, activeCount: _activeCount, hideApplyButton = false }: DiscoveryFiltersProps) {
  const savePreferencesMutation = useSaveClientFilterPreferences();
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const { setServiceTypes: setStoreServiceTypes, setPropertyTypes: setStorePropertyTypes } = useFilterActions();

  // SHARED STATE
  const [interestType, setInterestType] = useState(initialFilters.interest_type || 'both');
  const [selectedBudgetRange, setSelectedBudgetRange] = useState(initialFilters.selected_budget_range || '');
  const [genderPreference, setGenderPreference] = useState(initialFilters.gender_preference || 'any');
  const [nationalities, setNationalities] = useState<string[]>(initialFilters.nationalities || []);
  const [languages, setLanguages] = useState<string[]>(initialFilters.languages || []);
  const [relationshipStatus, setRelationshipStatus] = useState<string[]>(initialFilters.relationship_status || []);
  const [hasPetsFilter, setHasPetsFilter] = useState(initialFilters.has_pets_filter || 'any');
  const [ageRange, setAgeRange] = useState([initialFilters.age_min || 18, initialFilters.age_max || 65]);
  const [locationCountries, setLocationCountries] = useState<string[]>(initialFilters.location_countries || []);
  const [locationCities, setLocationCities] = useState<string[]>(initialFilters.location_cities || []);
  const [locationNeighborhoods, setLocationNeighborhoods] = useState<string[]>(initialFilters.location_neighborhoods || []);

  // PROPERTY STATE
  const [propertyTypes, setPropertyTypes] = useState<string[]>(initialFilters.property_types || []);
  const [bedrooms, setBedrooms] = useState(initialFilters.bedrooms_min || 1);
  const [bathrooms, setBathrooms] = useState(initialFilters.bathrooms_min || 1);
  const [petFriendly, setPetFriendly] = useState(initialFilters.pet_friendly || false);
  const [furnished, setFurnished] = useState(initialFilters.furnished || false);

  // MOTO STATE
  const [motoTypes, setMotoTypes] = useState<string[]>(initialFilters.moto_types || []);
  const [engineRange, setEngineRange] = useState([initialFilters.engine_cc_min || 50, initialFilters.engine_cc_max || 1000]);
  const [transmission, setTransmission] = useState(initialFilters.transmission || 'any');

  // BICYCLE STATE
  const [bicycleTypes, setBicycleTypes] = useState<string[]>(initialFilters.bicycle_types || []);

  // SERVICE STATE
  const [serviceTypes, setServiceTypes] = useState<string[]>(initialFilters.service_types || []);

  const getBudgetRanges = () => {
    if (category === 'property') return interestType === 'buy' ? BUY_BUDGET_RANGES : RENT_BUDGET_RANGES;
    if (category === 'motorcycle') return interestType === 'buy' ? MOTO_BUY_BUDGET_RANGES : MOTO_RENT_BUDGET_RANGES;
    return RENT_BUDGET_RANGES; // Fallback
  };

  const getBudgetValues = () => {
    const ranges = getBudgetRanges();
    const selected = ranges.find((r: any) => r.value === selectedBudgetRange);
    return selected ? { min: selected.min, max: selected.max } : { min: undefined, max: undefined };
  };

  const _handleApply = async () => {
    const budgetValues = getBudgetValues();
    try {
      if (category === 'property') {
        await savePreferencesMutation.mutateAsync({
          interested_in_properties: true,
          price_min: budgetValues.min, price_max: budgetValues.max,
          min_bedrooms: bedrooms, min_bathrooms: bathrooms,
          property_types: propertyTypes.length > 0 ? propertyTypes : null,
          pet_friendly_required: petFriendly, furnished_required: furnished,
          location_zones: locationNeighborhoods.length > 0 ? locationNeighborhoods : null,
        });
      } else if (category === 'motorcycle') {
        await savePreferencesMutation.mutateAsync({
          interested_in_motorcycles: true,
          moto_types: motoTypes.length > 0 ? motoTypes : null,
          moto_engine_size_min: engineRange[0], moto_engine_size_max: engineRange[1],
          moto_price_min: budgetValues.min, moto_price_max: budgetValues.max,
          moto_transmission: transmission !== 'any' ? [transmission] : null,
        });
      }
      
      setStoreServiceTypes(serviceTypes);
      setStorePropertyTypes(propertyTypes);
      
      toast.success('Filters applied!');
    } catch { toast.error('Failed to save preferences'); }

    onApply({
      category, interest_type: interestType, selected_budget_range: selectedBudgetRange,
      budget_min: budgetValues.min, budget_max: budgetValues.max, gender_preference: genderPreference,
      nationalities, languages, relationship_status: relationshipStatus, has_pets_filter: hasPetsFilter,
      age_min: ageRange[0], age_max: ageRange[1], location_countries: locationCountries,
      location_cities: locationCities, location_neighborhoods: locationNeighborhoods,
      // Category Specific
      property_types: propertyTypes, bedrooms_min: bedrooms, bathrooms_min: bathrooms,
      moto_types: motoTypes, engine_cc_min: engineRange[0], engine_cc_max: engineRange[1],
      bicycle_types: bicycleTypes, service_types: serviceTypes
    });
  };

  // Auto-notify with debounce
  useEffect(() => {
    const budgetValues = getBudgetValues();
    onApply({
      category, interest_type: interestType, selected_budget_range: selectedBudgetRange,
      budget_min: budgetValues.min, budget_max: budgetValues.max,
      location_neighborhoods: locationNeighborhoods,
      property_types: propertyTypes, bedrooms_min: bedrooms,
      moto_types: motoTypes, engine_cc_min: engineRange[0]
    });
  }, [category, interestType, selectedBudgetRange, locationNeighborhoods, propertyTypes, bedrooms, motoTypes, engineRange]);

  const toggleItem = (arr: string[], item: string, setter: (val: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex flex-col">
          <h3 className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] italic",
            isLight ? "text-primary" : "text-primary"
          )}>
            Discovery Filters
          </h3>
          <span className="text-xs font-black uppercase tracking-widest opacity-40">Active Range</span>
        </div>
        <Badge variant="outline" className="text-[9px] font-bold border-primary/20 text-primary uppercase">{category}</Badge>
      </div>

      {/* Interest Type */}
      <div className="space-y-3 px-1 mt-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intent</h2>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{category}</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1">
            {['rent', 'buy', 'both'].map((type) => {
              const isActive = interestType === type;
              const Icon = type === 'rent' ? Key : type === 'buy' ? Tag : Repeat;
              return (
                <motion.button
                  key={type}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setInterestType(type);
                  }}
                    className={cn(
                       "flex-shrink-0 flex flex-col items-center justify-center gap-3 min-w-[100px] py-6 border transition-all duration-300 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]",
                       isActive
                        ? "bg-primary text-white border-primary shadow-[0_10px_30px_rgba(var(--brand-primary-rgb),0.3)] scale-[1.05] z-10 relative"
                        : isLight 
                          ? "bg-slate-100 border-slate-200 text-slate-900 font-black hover:bg-slate-200 shadow-sm" 
                          : "bg-black/40 border-white/10 text-white font-black hover:bg-white/5 hover:text-white"
                     )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                    isActive ? "text-white" : "text-primary/60"
                  )}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{type}</span>
                </motion.button>
              );
            })}
          </div>
      </div>


      {/* Demographic Filters */}
      <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/50 border-black/5" : "bg-card/30 border-white/5")}>
        <Collapsible>
          <CollapsibleTrigger className="w-full p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-[#3B82F6]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">Details</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <ClientDemographicFilters
                genderPreference={genderPreference} setGenderPreference={setGenderPreference}
                ageRange={ageRange} setAgeRange={setAgeRange}
                relationshipStatus={relationshipStatus} setRelationshipStatus={setRelationshipStatus}
                hasPetsFilter={hasPetsFilter} setHasPetsFilter={setHasPetsFilter}
                nationalities={nationalities} setNationalities={setNationalities}
                languages={languages} setLanguages={setLanguages}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Location Filter & Radius */}
      <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/50 border-black/5" : "bg-card/30 border-white/5")}>
        <CardHeader className="pb-0 pt-6 px-6">
          <div className="flex items-center gap-2">
             <Globe className="w-4 h-4 text-primary" />
             <span className="text-xs font-black uppercase tracking-widest">Location Reach</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          <EmbeddedLocationFilter
            countries={locationCountries} setCountries={setLocationCountries}
            cities={locationCities} setCities={setLocationCities}
            neighborhoods={locationNeighborhoods} setNeighborhoods={setLocationNeighborhoods}
            multiSelect={true} defaultOpen={false} country="" city="" neighborhood="" setCountry={()=>{}} setCity={()=>{}} setNeighborhood={()=>{}}
          />
          
          <div className="pt-2 space-y-4">
             <div className="flex justify-between items-center">
               <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Search Radius</Label>
               <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black">{radiusKm} KM</Badge>
             </div>
             <Slider 
                value={[radiusKm]} 
                onValueChange={(v) => setRadiusKm(v[0])} 
                min={1} max={200} step={1} 
                className="py-2"
             />
             <p className={cn("text-[9px] font-medium", isLight ? "text-black/40" : "text-white/20")}>Radius filtering uses your current GPS or selected location.</p>
          </div>
        </CardContent>
      </Card>

      {/* Budget Filter */}
      <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/50 border-black/5" : "bg-card/30 border-white/5")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
               <DollarSign className="w-3 h-3 text-[#3B82F6]" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">Budget Range</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {getBudgetRanges().map((range: any) => (
            <button
              key={range.value}
              onClick={() => setSelectedBudgetRange(selectedBudgetRange === range.value ? '' : range.value)}
                className={cn(
                  "py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all border",
                  selectedBudgetRange === range.value
                    ? "bg-primary text-white border-primary shadow-xl shadow-primary/30 scale-[1.02]" 
                    : isLight 
                      ? "bg-slate-100 border-slate-200 text-slate-900 font-black hover:bg-slate-200" 
                      : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
            >
              {range.label}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* CATEGORY SPECIFIC FILTERS */}
      {category === 'property' && (
        <>
          <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/50 border-black/5" : "bg-card/30 border-white/5")}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <Bed className="w-3 h-3 text-[#3B82F6]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6]">Rooms & Space</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-10 pt-4">
                {/* BEDROOMS MATRIX */}
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-primary tracking-[0.2em] px-1">
                    <Label>Bedrooms</Label>
                    <span>{bedrooms}+</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                       <button 
                         key={n} 
                         onClick={() => setBedrooms(n)}
                         className={cn(
                           "w-14 h-14 rounded-full text-[11px] font-black transition-all border flex items-center justify-center shadow-sm",
                           bedrooms === n 
                             ? "bg-primary text-white border-primary shadow-xl scale-110" 
                             : isLight 
                               ? "bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200 font-black"
                               : "bg-white/5 border-white/10 text-muted-foreground"
                         )}
                       >
                         {n}+
                       </button>
                    ))}
                  </div>
                </div>

                {/* BATHROOMS MATRIX */}
                <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase text-primary tracking-[0.2em] px-1">
                    <Label>Bathrooms</Label>
                    <span>{bathrooms}+</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4].map(n => (
                       <button 
                         key={n} 
                         onClick={() => setBathrooms(n)}
                         className={cn(
                           "w-12 h-12 rounded-full text-[11px] font-black transition-all border flex items-center justify-center shadow-sm",
                           bathrooms === n 
                             ? "bg-primary text-white border-primary shadow-xl scale-110" 
                             : isLight 
                               ? "bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200 font-black"
                               : "bg-white/5 border-white/10 text-muted-foreground"
                         )}
                       >
                         {n}+
                       </button>
                    ))}
                  </div>
                </div>

            </CardContent>
          </Card>
        </>
      )}

      {category === 'motorcycle' && (
        <>
          <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/80 border-black/10 shadow-xl" : "bg-card/30 border-white/5")}>
            <CardHeader className="pb-2">
              <span className="text-xs font-black uppercase tracking-widest">Engine Power</span>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
               <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                   <Label>Size (CC)</Label>
                   <span>{engineRange[0]} - {engineRange[1]}cc</span>
                 </div>
                 <Slider value={engineRange} onValueChange={setEngineRange} min={50} max={2000} step={50} />
               </div>
            </CardContent>
          </Card>
        </>
      )}

      {category === 'service' && (
        <Card className={cn("backdrop-blur-md overflow-hidden rounded-[2rem]", isLight ? "bg-white/80 border-black/10 shadow-xl" : "bg-card/30 border-white/5")}>
          <CardHeader className="pb-2 px-6 pt-6">
            <div className="flex items-center gap-2">
              <WorkersIcon className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">Worker Types</span>
            </div>
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Clean Ladies', value: 'cleaning' },
                { label: 'Massage Pros', value: 'massage' },
                { label: 'Personal Drivers', value: 'driver' },
                { label: 'Security / Bodyguard', value: 'security' },
                { label: 'Private Chef', value: 'chef' },
                { label: 'Personal Assistant', value: 'pa' },
                { label: 'Nanny / Kids', value: 'nanny' }
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => toggleItem(serviceTypes, type.value, setServiceTypes)}
                  className={cn(
                    "py-3 px-3 rounded-2xl text-[10px] font-black uppercase tracking-tight text-left transition-all border",
                    serviceTypes.includes(type.value)
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : isLight 
                        ? "bg-black/[0.06] text-black/90 border-black/10 hover:bg-black/[0.12] font-black" 
                        : "bg-muted/30 text-muted-foreground border-white/5 hover:bg-muted/50"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hideApplyButton && (
        <Button onClick={_handleApply} className="w-full h-16 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30">
          Apply Discovery Filters
        </Button>
      )}
    </div>
  );
}
