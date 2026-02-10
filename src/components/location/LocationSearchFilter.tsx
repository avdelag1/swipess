import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Search, Globe, Star, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
  searchCities,
  getFeaturedDestinations,
  CityLocation,
} from '@/data/worldLocations';

export interface LocationFilter {
  region?: string;
  country?: string;
  city?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

interface LocationSearchFilterProps {
  onFilterChange: (filter: LocationFilter) => void;
  currentFilter?: LocationFilter;
  showRadiusFilter?: boolean;
  showQuickSelect?: boolean;
  compact?: boolean;
}

export function LocationSearchFilter({
  onFilterChange,
  currentFilter = {},
  showRadiusFilter = true,
  showQuickSelect = true,
  compact = false,
}: LocationSearchFilterProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(currentFilter.region || '');
  const [selectedCountry, setSelectedCountry] = useState(currentFilter.country || '');
  const [selectedCity, setSelectedCity] = useState(currentFilter.city || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(currentFilter.neighborhood || '');
  const [radius, setRadius] = useState(currentFilter.radiusKm || 50);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // Get data
  const regions = useMemo(() => getRegions(), []);
  const countries = useMemo(() => selectedRegion ? getCountriesInRegion(selectedRegion) : [], [selectedRegion]);
  const cities = useMemo(() => selectedRegion && selectedCountry ? getCitiesInCountry(selectedRegion, selectedCountry) : [], [selectedRegion, selectedCountry]);
  const featuredDestinations = useMemo(() => getFeaturedDestinations(), []);
  const searchResults = useMemo(() => searchQuery.length >= 2 ? searchCities(searchQuery) : [], [searchQuery]);

  // Get selected city data
  const selectedCityData = useMemo(() => {
    if (!selectedCity || !cities.length) return null;
    return cities.find(c => c.name === selectedCity);
  }, [selectedCity, cities]);

  const neighborhoods = selectedCityData?.neighborhoods || [];

  // Handle filter updates
  const updateFilter = (updates: Partial<LocationFilter>) => {
    const newFilter = {
      region: selectedRegion,
      country: selectedCountry,
      city: selectedCity,
      neighborhood: selectedNeighborhood,
      radiusKm: radius,
      ...updates,
    };

    // Include coordinates if we have a city selected
    if (updates.city && cities.length) {
      const cityData = cities.find(c => c.name === updates.city);
      if (cityData) {
        newFilter.latitude = cityData.coordinates.lat;
        newFilter.longitude = cityData.coordinates.lng;
      }
    }

    onFilterChange(newFilter);
  };

  // Handle quick city selection
  const handleQuickCitySelect = (city: CityLocation, countryName: string, regionName: string) => {
    setSelectedRegion(regionName);
    setSelectedCountry(countryName);
    setSelectedCity(city.name);
    setSelectedNeighborhood('');
    setSearchQuery('');

    onFilterChange({
      region: regionName,
      country: countryName,
      city: city.name,
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
      radiusKm: radius,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedRegion('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedNeighborhood('');
    setSearchQuery('');
    setRadius(50);
    onFilterChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = selectedRegion || selectedCountry || selectedCity || selectedNeighborhood;

  // Render compact header with expand toggle
  if (compact && !isExpanded) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(true)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Location Filter</CardTitle>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {[selectedCity, selectedCountry, selectedRegion].filter(Boolean)[0]}
                </Badge>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Filter by Location
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cities..."
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        {/* Search Results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <ScrollArea className="h-40 border border-border rounded-lg">
            <div className="p-2 space-y-1">
              {searchResults.slice(0, 10).map(({ region, country, city }) => (
                <button
                  key={`${region}-${country}-${city.name}`}
                  onClick={() => handleQuickCitySelect(city, country, region)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{city.name}</span>
                  <span className="text-xs text-muted-foreground">{country}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Quick Select - Popular Destinations */}
        {showQuickSelect && searchQuery.length < 2 && (
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Star className="w-3 h-3" />
              Popular Destinations
            </Label>
            <ScrollArea className="h-32">
              <div className="flex flex-wrap gap-1.5">
                {/* Top Mexico destinations */}
                {featuredDestinations.mexico.slice(0, 6).map(city => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickCitySelect(city, 'Mexico', 'North America')}
                    className="text-xs h-7"
                  >
                    {city.name}
                  </Button>
                ))}
                {/* Top USA destinations */}
                {featuredDestinations.usa.slice(0, 4).map(city => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickCitySelect(city, 'United States', 'North America')}
                    className="text-xs h-7"
                  >
                    {city.name}
                  </Button>
                ))}
                {/* Top Europe destinations */}
                {featuredDestinations.europe.slice(0, 4).map(city => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickCitySelect(city, city.name, 'Europe')}
                    className="text-xs h-7"
                  >
                    {city.name}
                  </Button>
                ))}
                {/* Top Asia Pacific */}
                {featuredDestinations.asiaPacific.slice(0, 3).map(city => (
                  <Button
                    key={city.name}
                    variant={selectedCity === city.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickCitySelect(city, city.name, 'Asia Pacific')}
                    className="text-xs h-7"
                  >
                    {city.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Region */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Region</Label>
            <Select
              value={selectedRegion}
              onValueChange={(v) => {
                setSelectedRegion(v);
                setSelectedCountry('');
                setSelectedCity('');
                setSelectedNeighborhood('');
                updateFilter({ region: v, country: '', city: '', neighborhood: '' });
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground h-9">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="" className="text-foreground">All regions</SelectItem>
                {regions.map(r => (
                  <SelectItem key={r} value={r} className="text-foreground">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Country</Label>
            <Select
              value={selectedCountry}
              onValueChange={(v) => {
                setSelectedCountry(v);
                setSelectedCity('');
                setSelectedNeighborhood('');
                updateFilter({ country: v, city: '', neighborhood: '' });
              }}
              disabled={!selectedRegion}
            >
              <SelectTrigger className="bg-background border-border text-foreground h-9">
                <SelectValue placeholder={selectedRegion ? "All countries" : "Select region"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="" className="text-foreground">All countries</SelectItem>
                {countries.map(c => (
                  <SelectItem key={c} value={c} className="text-foreground">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">City</Label>
            <Select
              value={selectedCity}
              onValueChange={(v) => {
                setSelectedCity(v);
                setSelectedNeighborhood('');
                updateFilter({ city: v, neighborhood: '' });
              }}
              disabled={!selectedCountry}
            >
              <SelectTrigger className="bg-background border-border text-foreground h-9">
                <SelectValue placeholder={selectedCountry ? "All cities" : "Select country"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="" className="text-foreground">All cities</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c.name} value={c.name} className="text-foreground">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Neighborhood */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Neighborhood</Label>
            <Select
              value={selectedNeighborhood}
              onValueChange={(v) => {
                setSelectedNeighborhood(v);
                updateFilter({ neighborhood: v });
              }}
              disabled={!selectedCity || neighborhoods.length === 0}
            >
              <SelectTrigger className="bg-background border-border text-foreground h-9">
                <SelectValue placeholder={selectedCity ? "All areas" : "Select city"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                <SelectItem value="" className="text-foreground">All areas</SelectItem>
                {neighborhoods.map(n => (
                  <SelectItem key={n} value={n} className="text-foreground">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Radius Filter */}
        {showRadiusFilter && selectedCity && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Search Radius</Label>
              <span className="text-sm font-medium">{radius} km</span>
            </div>
            <Slider
              value={[radius]}
              onValueChange={(v) => {
                setRadius(v[0]);
                updateFilter({ radiusKm: v[0] });
              }}
              min={5}
              max={200}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>
        )}

        {/* Active Filter Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {selectedRegion && (
              <Badge variant="secondary" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {selectedRegion}
              </Badge>
            )}
            {selectedCountry && (
              <Badge variant="secondary" className="text-xs">
                {selectedCountry}
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="default" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {selectedCity}
              </Badge>
            )}
            {selectedNeighborhood && (
              <Badge variant="outline" className="text-xs">
                {selectedNeighborhood}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function to calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Filter function to check if a location is within radius
export function isWithinRadius(
  targetLat: number,
  targetLng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(targetLat, targetLng, centerLat, centerLng);
  return distance <= radiusKm;
}
