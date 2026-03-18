import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MapPin, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
} from '@/data/worldLocations';

export interface LocationFilterValues {
  country?: string;
  city?: string;
  neighborhood?: string;
  countries?: string[];
  cities?: string[];
  neighborhoods?: string[];
}

interface EmbeddedLocationFilterProps {
  country: string;
  setCountry: (country: string) => void;
  city: string;
  setCity: (city: string) => void;
  neighborhood: string;
  setNeighborhood: (neighborhood: string) => void;
  // Multi-select support
  countries?: string[];
  setCountries?: (countries: string[]) => void;
  cities?: string[];
  setCities?: (cities: string[]) => void;
  neighborhoods?: string[];
  setNeighborhoods?: (neighborhoods: string[]) => void;
  multiSelect?: boolean;
  defaultOpen?: boolean;
}

export function EmbeddedLocationFilter({
  country,
  setCountry,
  city,
  setCity,
  neighborhood,
  setNeighborhood,
  countries = [],
  setCountries,
  cities = [],
  setCities,
  neighborhoods = [],
  setNeighborhoods,
  multiSelect = false,
  defaultOpen = false,
}: EmbeddedLocationFilterProps) {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionSearch, setRegionSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [neighborhoodSearch, setNeighborhoodSearch] = useState('');

  // Get all available data
  const regions = useMemo(() => getRegions(), []);

  // Get all countries across all regions for direct country selection
  const allCountriesWithRegion = useMemo(() => {
    const result: { country: string; region: string }[] = [];
    for (const region of regions) {
      const countriesInRegion = getCountriesInRegion(region);
      for (const countryName of countriesInRegion) {
        result.push({ country: countryName, region });
      }
    }
    return result.sort((a, b) => a.country.localeCompare(b.country));
  }, [regions]);
  const availableCountries = useMemo(() =>
    selectedRegion ? getCountriesInRegion(selectedRegion) : [],
    [selectedRegion]
  );
  const availableCities = useMemo(() =>
    selectedRegion && country ? getCitiesInCountry(selectedRegion, country) : [],
    [selectedRegion, country]
  );

  // Get selected city data for neighborhoods
  const selectedCityData = useMemo(() => {
    if (!city || !availableCities.length) return null;
    return availableCities.find(c => c.name === city);
  }, [city, availableCities]);

  const availableNeighborhoods = selectedCityData?.neighborhoods || [];

  // Filtered lists based on search
  const filteredRegions = useMemo(() =>
    regions.filter(r => r.toLowerCase().includes(regionSearch.toLowerCase())),
    [regions, regionSearch]
  );

  const filteredCountries = useMemo(() => {
    const searchLower = countrySearch.toLowerCase();
    if (selectedRegion) {
      return availableCountries.filter(c => c.toLowerCase().includes(searchLower));
    }
    // When no region selected, show all countries filtered by search
    return allCountriesWithRegion.filter(item =>
      item.country.toLowerCase().includes(searchLower)
    );
  }, [selectedRegion, availableCountries, allCountriesWithRegion, countrySearch]);

  const filteredCities = useMemo(() =>
    availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase())),
    [availableCities, citySearch]
  );

  const filteredNeighborhoods = useMemo(() =>
    availableNeighborhoods.filter(n => n.toLowerCase().includes(neighborhoodSearch.toLowerCase())),
    [availableNeighborhoods, neighborhoodSearch]
  );

  // Auto-detect region when country is set from initial values
  useEffect(() => {
    if (country && !selectedRegion) {
      for (const region of regions) {
        const countriesInRegion = getCountriesInRegion(region);
        if (countriesInRegion.includes(country)) {
          setSelectedRegion(region);
          break;
        }
      }
    }
  }, [country, selectedRegion, regions]);

  // Handle region change - clear dependent fields
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    setRegionSearch('');
    setCountry('');
    setCity('');
    setNeighborhood('');
    if (setCountries) setCountries([]);
    if (setCities) setCities([]);
    if (setNeighborhoods) setNeighborhoods([]);
  };

  // Handle country change - clear dependent fields and auto-set region
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCountrySearch('');
    setCity('');
    setNeighborhood('');
    if (setCities) setCities([]);
    if (setNeighborhoods) setNeighborhoods([]);

    // Auto-detect and set region when country is selected
    if (newCountry && !selectedRegion) {
      for (const region of regions) {
        const countriesInRegion = getCountriesInRegion(region);
        if (countriesInRegion.includes(newCountry)) {
          setSelectedRegion(region);
          break;
        }
      }
    }
  };

  // Handle city change - clear dependent fields
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setCitySearch('');
    setNeighborhood('');
    if (setNeighborhoods) setNeighborhoods([]);
  };

  // Handle neighborhood change
  const handleNeighborhoodChange = (newNeighborhood: string) => {
    setNeighborhood(newNeighborhood);
    setNeighborhoodSearch('');
  };

  // Multi-select toggle handlers
  const toggleCountry = (countryName: string) => {
    if (!setCountries) return;
    if (countries.includes(countryName)) {
      setCountries(countries.filter(c => c !== countryName));
    } else {
      setCountries([...countries, countryName]);
    }
  };

  const toggleCity = (cityName: string) => {
    if (!setCities) return;
    if (cities.includes(cityName)) {
      setCities(cities.filter(c => c !== cityName));
    } else {
      setCities([...cities, cityName]);
    }
  };

  const toggleNeighborhood = (neighborhoodName: string) => {
    if (!setNeighborhoods) return;
    if (neighborhoods.includes(neighborhoodName)) {
      setNeighborhoods(neighborhoods.filter(n => n !== neighborhoodName));
    } else {
      setNeighborhoods([...neighborhoods, neighborhoodName]);
    }
  };

  // Check if any location filters are active
  const hasActiveFilters = country || city || neighborhood ||
    countries.length > 0 || cities.length > 0 || neighborhoods.length > 0;

  // Clear all location filters
  const clearLocationFilters = () => {
    setSelectedRegion('');
    setRegionSearch('');
    setCountrySearch('');
    setCitySearch('');
    setNeighborhoodSearch('');
    setCountry('');
    setCity('');
    setNeighborhood('');
    if (setCountries) setCountries([]);
    if (setCities) setCities([]);
    if (setNeighborhoods) setNeighborhoods([]);
  };

  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded transition-colors">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label className="font-medium cursor-pointer">Location Search</Label>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {[country, city, neighborhood, ...countries, ...cities, ...neighborhoods].filter(Boolean).length} selected
            </Badge>
          )}
        </div>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pt-2">
        {/* Clear button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocationFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Clear Location
          </Button>
        )}

        {/* Region Select */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Region (optional)</Label>
          <Select value={selectedRegion} onValueChange={handleRegionChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Filter by region..." />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <div className="p-2 sticky top-0 bg-popover border-b border-border z-10">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search regions..."
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredRegions.length > 0 ? (
                  filteredRegions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    No regions found
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Country Select */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Country</Label>
          {multiSelect && (selectedRegion ? availableCountries.length > 0 : allCountriesWithRegion.length > 0) ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[36px] max-h-40 overflow-y-auto">
                {(selectedRegion ? filteredCountries as string[] : (filteredCountries as { country: string; region: string }[]).map(c => c.country)).map((countryName) => (
                  <Badge
                    key={countryName}
                    variant={countries.includes(countryName) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 text-xs ${
                      countries.includes(countryName)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleCountry(countryName)}
                  >
                    {countryName}
                  </Badge>
                ))}
                {(selectedRegion ? filteredCountries : filteredCountries).length === 0 && (
                  <span className="text-sm text-muted-foreground">No countries found</span>
                )}
              </div>
            </div>
          ) : (
            <Select
              value={country}
              onValueChange={handleCountryChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select country..." />
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
                  {selectedRegion ? (
                    // Show countries from selected region
                    (filteredCountries as string[]).length > 0 ? (
                      (filteredCountries as string[]).map((countryName) => (
                        <SelectItem key={countryName} value={countryName}>
                          {countryName}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        No countries found
                      </div>
                    )
                  ) : (
                    // Show all countries grouped by region
                    (filteredCountries as { country: string; region: string }[]).length > 0 ? (
                      (filteredCountries as { country: string; region: string }[]).map((item) => (
                        <SelectItem key={item.country} value={item.country}>
                          {item.country}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-muted-foreground text-sm">
                        No countries found
                      </div>
                    )
                  )}
                </div>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* City Select */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">City</Label>
          {multiSelect && availableCities.length > 0 ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search cities..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[36px] max-h-40 overflow-y-auto">
                {filteredCities.map((cityData) => (
                  <Badge
                    key={cityData.name}
                    variant={cities.includes(cityData.name) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 text-xs ${
                      cities.includes(cityData.name)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleCity(cityData.name)}
                  >
                    {cityData.name}
                  </Badge>
                ))}
                {filteredCities.length === 0 && (
                  <span className="text-sm text-muted-foreground">No cities found</span>
                )}
              </div>
            </div>
          ) : (
            <Select
              value={city}
              onValueChange={handleCityChange}
              disabled={!country}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={country ? "Select city..." : "Select country first"} />
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
                    filteredCities.map((cityData) => (
                      <SelectItem key={cityData.name} value={cityData.name}>
                        {cityData.name}
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
          )}
        </div>

        {/* Neighborhood Select */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Neighborhood</Label>
          {multiSelect && availableNeighborhoods.length > 0 ? (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search neighborhoods..."
                  value={neighborhoodSearch}
                  onChange={(e) => setNeighborhoodSearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background min-h-[36px] max-h-40 overflow-y-auto">
                {filteredNeighborhoods.map((neighborhoodName) => (
                  <Badge
                    key={neighborhoodName}
                    variant={neighborhoods.includes(neighborhoodName) ? "default" : "outline"}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 text-xs ${
                      neighborhoods.includes(neighborhoodName)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => toggleNeighborhood(neighborhoodName)}
                  >
                    {neighborhoodName}
                  </Badge>
                ))}
                {filteredNeighborhoods.length === 0 && (
                  <span className="text-sm text-muted-foreground">No neighborhoods found</span>
                )}
              </div>
            </div>
          ) : (
            <Select
              value={neighborhood}
              onValueChange={handleNeighborhoodChange}
              disabled={!city || availableNeighborhoods.length === 0}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={
                  !city ? "Select city first" :
                  availableNeighborhoods.length === 0 ? "No neighborhoods available" :
                  "Select neighborhood..."
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
                    filteredNeighborhoods.map((neighborhoodName) => (
                      <SelectItem key={neighborhoodName} value={neighborhoodName}>
                        {neighborhoodName}
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
          )}
        </div>

        {/* Active selections summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {country && !multiSelect && (
              <Badge variant="secondary" className="text-xs">
                {country}
              </Badge>
            )}
            {city && !multiSelect && (
              <Badge variant="secondary" className="text-xs">
                {city}
              </Badge>
            )}
            {neighborhood && !multiSelect && (
              <Badge variant="outline" className="text-xs">
                {neighborhood}
              </Badge>
            )}
            {countries.map(c => (
              <Badge key={c} variant="secondary" className="text-xs">
                {c}
              </Badge>
            ))}
            {cities.map(c => (
              <Badge key={c} variant="secondary" className="text-xs">
                {c}
              </Badge>
            ))}
            {neighborhoods.map(n => (
              <Badge key={n} variant="outline" className="text-xs">
                {n}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Filter by location to find clients in specific areas
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
