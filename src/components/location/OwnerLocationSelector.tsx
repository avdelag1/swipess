import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MapPin, Search } from 'lucide-react';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
  getCityByName,
} from '@/data/worldLocations';

interface OwnerLocationSelectorProps {
  region?: string;
  country?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  onRegionChange?: (region: string) => void;
  onCountryChange: (country: string) => void;
  onStateChange?: (state: string) => void;
  onCityChange: (city: string) => void;
  onNeighborhoodChange: (neighborhood: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

export function OwnerLocationSelector({
  country = '',
  city = '',
  neighborhood = '',
  onCountryChange,
  onCityChange,
  onNeighborhoodChange,
  onCoordinatesChange,
}: OwnerLocationSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');

  // Get all unique countries across all regions
  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    const regions = getRegions();
    for (const region of regions) {
      const regionCountries = getCountriesInRegion(region);
      regionCountries.forEach(c => countries.add(c));
    }
    return Array.from(countries).sort();
  }, []);

  // Filtered countries based on search
  const filteredCountries = useMemo(() =>
    allCountries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [allCountries, countrySearch]
  );

  // Find the region for the current country
  useEffect(() => {
    if (country) {
      const regions = getRegions();
      for (const region of regions) {
        const countriesInRegion = getCountriesInRegion(region);
        if (countriesInRegion.includes(country)) {
          setSelectedRegion(region);
          break;
        }
      }
    }
  }, [country]);

  // Get cities for the selected country
  const availableCities = useMemo(() => {
    if (!country || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, country);
  }, [country, selectedRegion]);

  // Get neighborhoods for the selected city
  const availableNeighborhoods = useMemo(() => {
    if (!city) return [];
    const cityData = getCityByName(city);
    return cityData?.city.neighborhoods || [];
  }, [city]);

  // Filtered cities based on search
  const filteredCities = useMemo(() =>
    availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
    [availableCities, citySearch]
  );

  // Filtered neighborhoods based on search
  const filteredNeighborhoods = useMemo(() =>
    availableNeighborhoods.filter(n => n.toLowerCase().includes(neighborhoodSearch.toLowerCase())),
    [availableNeighborhoods, neighborhoodSearch]
  );

  // Handle country change
  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    setCountrySearch('');
    // Clear city and neighborhood when country changes
    onCityChange('');
    onNeighborhoodChange('');
    setCitySearch('');
    setNeighborhoodSearch('');

    // Find the region for this country
    const regions = getRegions();
    for (const region of regions) {
      const countriesInRegion = getCountriesInRegion(region);
      if (countriesInRegion.includes(newCountry)) {
        setSelectedRegion(region);
        break;
      }
    }
  };

  // Handle city change
  const handleCityChange = (newCity: string) => {
    onCityChange(newCity);
    setCitySearch('');
    // Clear neighborhood when city changes
    onNeighborhoodChange('');
    setNeighborhoodSearch('');

    // Update coordinates if available
    if (newCity && onCoordinatesChange) {
      const cityData = getCityByName(newCity);
      if (cityData?.city.coordinates) {
        onCoordinatesChange(cityData.city.coordinates.lat, cityData.city.coordinates.lng);
      }
    }
  };

  // Handle neighborhood change
  const handleNeighborhoodChange = (newNeighborhood: string) => {
    onNeighborhoodChange(newNeighborhood);
    setNeighborhoodSearch('');
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Property Location
          </CardTitle>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            General location only - no exact address shown
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cascading Location Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Country Select */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Country *</Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <div className="p-2 sticky top-0 bg-popover border-b border-border z-10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="h-8 pl-8 text-sm"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      No countries found
                    </div>
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* City Select */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm">City *</Label>
            <Select value={city} onValueChange={handleCityChange} disabled={!country}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={country ? 'Select a city' : 'Select country first'} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableCities.length > 0 && (
                  <div className="p-2 sticky top-0 bg-popover border-b border-border z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search cities..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="h-8 pl-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((c) => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))
                  ) : availableCities.length > 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      No cities found
                    </div>
                  ) : null}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Neighborhood Select */}
          <div className="space-y-2">
            <Label className="text-foreground text-sm">Neighborhood</Label>
            <Select
              value={neighborhood}
              onValueChange={handleNeighborhoodChange}
              disabled={!city || availableNeighborhoods.length === 0}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={
                  !city ? 'Select city first' :
                  availableNeighborhoods.length === 0 ? 'No neighborhoods available' :
                  'Select a neighborhood (optional)'
                } />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {availableNeighborhoods.length > 0 && (
                  <div className="p-2 sticky top-0 bg-popover border-b border-border z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search neighborhoods..."
                        value={neighborhoodSearch}
                        onChange={(e) => setNeighborhoodSearch(e.target.value)}
                        className="h-8 pl-8 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto">
                  {filteredNeighborhoods.length > 0 ? (
                    filteredNeighborhoods.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))
                  ) : availableNeighborhoods.length > 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-sm">
                      No neighborhoods found
                    </div>
                  ) : null}
                </div>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Optional - helps clients find you
            </p>
          </div>
        </div>

        {/* Selected Location Tags */}
        {(city || country) && (
          <div className="flex flex-wrap gap-1.5">
            {country && (
              <Badge variant="secondary" className="text-xs py-0.5">
                {country}
              </Badge>
            )}
            {city && (
              <Badge variant="default" className="text-xs py-0.5">
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </Badge>
            )}
            {neighborhood && (
              <Badge variant="outline" className="text-xs py-0.5">
                {neighborhood}
              </Badge>
            )}
          </div>
        )}

        {/* Privacy Note - Compact */}
        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <p className="text-xs text-amber-200 font-medium mb-1">Privacy Note</p>
          <p className="text-xs text-amber-200/80">Your city and neighborhood are visible to clients searching in your area</p>
          <p className="text-xs text-amber-200/80">Your exact address is kept private until after a match</p>
        </div>
      </CardContent>
    </Card>
  );
}
