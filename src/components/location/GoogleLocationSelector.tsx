import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, AlertCircle, Search, Globe, Star, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
  getPopularCities,
  searchCities,
  getNeighborhoodsForCity,
  getFeaturedDestinations,
  CityLocation,
} from '@/data/worldLocations';

interface GoogleLocationSelectorProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  neighborhood?: string;
  locationType?: 'home' | 'current' | 'property';
  userType?: 'client' | 'owner'; // Different UX for clients vs owners
  onLocationChange: (data: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    country?: string;
    neighborhood?: string;
    region?: string;
    locationType?: 'home' | 'current' | 'property';
  }) => void;
  showMap?: boolean;
  showPrivacyNotice?: boolean;
  title?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

type SelectionMode = 'search' | 'popular' | 'browse';

export function GoogleLocationSelector({
  latitude,
  longitude,
  address,
  city,
  country,
  neighborhood,
  locationType = 'home',
  userType = 'client',
  onLocationChange,
  showMap = true,
  showPrivacyNotice = true,
  title = 'Your Location',
}: GoogleLocationSelectorProps) {
  // State
  const [searchInput, setSearchInput] = useState(address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(latitude && longitude ? { latitude, longitude } : null);
  const [selectedTab, setSelectedTab] = useState<'home' | 'current' | 'property'>(locationType);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('popular');

  // Browse state
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>(country || '');
  const [selectedCity, setSelectedCity] = useState<string>(city || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(neighborhood || '');

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Get data
  const regions = useMemo(() => getRegions(), []);
  const countries = useMemo(() => selectedRegion ? getCountriesInRegion(selectedRegion) : [], [selectedRegion]);
  const cities = useMemo(() => selectedRegion && selectedCountry ? getCitiesInCountry(selectedRegion, selectedCountry) : [], [selectedRegion, selectedCountry]);
  const neighborhoods = useMemo(() => selectedCity ? getNeighborhoodsForCity(selectedCity) : [], [selectedCity]);
  const featuredDestinations = useMemo(() => getFeaturedDestinations(), []);
  const searchResults = useMemo(() => searchQuery.length >= 2 ? searchCities(searchQuery) : [], [searchQuery]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !showMap) return;

    // Check if Google Maps API is loaded
    if (!window.google) {
      return;
    }

    const center = currentLocation
      ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
      : { lat: 20.2111, lng: -87.0739 }; // Default: Tulum, Mexico

    // Initialize map
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: currentLocation ? 13 : 4,
      center,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    // Add marker if location exists
    if (currentLocation) {
      markerRef.current = new window.google.maps.Marker({
        map: mapInstance.current,
        position: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        title: 'Selected Location',
        draggable: true,
      });

      // Handle marker drag
      markerRef.current.addListener('dragend', async () => {
        const position = markerRef.current.getPosition();
        const lat = position.lat();
        const lng = position.lng();
        setCurrentLocation({ latitude: lat, longitude: lng });
        await reverseGeocode(lat, lng);
      });
    }

    // Add click listener to place marker
    const handleMapClick = async (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      // Update or create marker
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
      } else {
        markerRef.current = new window.google.maps.Marker({
          map: mapInstance.current,
          position: { lat, lng },
          title: 'Selected Location',
          draggable: true,
        });
      }

      setCurrentLocation({ latitude: lat, longitude: lng });
      await reverseGeocode(lat, lng);
    };
    mapInstance.current.addListener('click', handleMapClick);

    // Cleanup
    return () => {
      if (mapInstance.current) {
        window.google.maps.event.clearInstanceListeners(mapInstance.current);
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [showMap]);

  // Update marker when location changes
  useEffect(() => {
    if (!mapInstance.current || !currentLocation) return;

    if (markerRef.current) {
      markerRef.current.setPosition({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    } else {
      markerRef.current = new window.google.maps.Marker({
        map: mapInstance.current,
        position: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        title: 'Selected Location',
        draggable: true,
      });
    }

    mapInstance.current.setCenter({
      lat: currentLocation.latitude,
      lng: currentLocation.longitude,
    });
    mapInstance.current.setZoom(13);
  }, [currentLocation]);

  // Setup Google Places Autocomplete
  useEffect(() => {
    if (!searchInputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        types: ['geocode', 'establishment'],
        fields: ['geometry', 'formatted_address', 'address_components', 'name'],
      }
    );
    autocompleteRef.current = autocomplete;

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setCurrentLocation({ latitude: lat, longitude: lng });
        setSearchInput(place.formatted_address || place.name || '');

        // Extract city and country from address components
        let cityName = '';
        let countryName = '';
        if (place.address_components) {
          for (const component of place.address_components) {
            if (component.types.includes('locality')) {
              cityName = component.long_name;
            }
            if (component.types.includes('country')) {
              countryName = component.long_name;
            }
          }
        }

        onLocationChange({
          latitude: lat,
          longitude: lng,
          address: place.formatted_address || place.name || '',
          city: cityName,
          country: countryName,
          locationType: selectedTab,
        });
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [selectionMode, onLocationChange, selectedTab]);

  // Handle real-time location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        toast({
          title: "Geolocation Not Available",
          description: "Your browser doesn't support location services.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ latitude: lat, longitude: lng });
          setSelectedTab('current');

          // Center map
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(15);
          }

          // Reverse geocode to get address
          await reverseGeocode(lat, lng);
          setIsLoading(false);

          toast({
            title: "Location Found",
            description: "Your current location has been detected.",
          });
        },
        (error) => {
          if (import.meta.env.DEV) {
            logger.error('Geolocation error:', error);
          }
          toast({
            title: "Location Access Denied",
            description: "Please enable location services and try again.",
            variant: "destructive"
          });
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error getting location:', error);
      }
      toast({
        title: "Error",
        description: "Failed to get your location. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      if (!window.google) return;

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results: any, status: string) => {
          if (status === 'OK' && results[0]) {
            const addressStr = results[0].formatted_address;
            setSearchInput(addressStr);

            // Extract city and country
            let cityName = '';
            let countryName = '';
            for (const component of results[0].address_components) {
              if (component.types.includes('locality')) {
                cityName = component.long_name;
              }
              if (component.types.includes('country')) {
                countryName = component.long_name;
              }
            }

            onLocationChange({
              latitude: lat,
              longitude: lng,
              address: addressStr,
              city: cityName,
              country: countryName,
              locationType: selectedTab,
            });
          }
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Reverse geocoding error:', error);
      }
    }
  };

  // Handle city selection from dropdown/popular
  const handleCitySelect = (cityData: CityLocation, countryName: string, regionName?: string) => {
    setCurrentLocation({
      latitude: cityData.coordinates.lat,
      longitude: cityData.coordinates.lng,
    });
    setSelectedCity(cityData.name);
    setSearchInput(`${cityData.name}, ${countryName}`);

    // Center map
    if (mapInstance.current) {
      mapInstance.current.setCenter(cityData.coordinates);
      mapInstance.current.setZoom(12);
    }

    onLocationChange({
      latitude: cityData.coordinates.lat,
      longitude: cityData.coordinates.lng,
      address: `${cityData.name}, ${countryName}`,
      city: cityData.name,
      country: countryName,
      region: regionName,
      locationType: selectedTab,
    });

    toast({
      title: "Location Selected",
      description: `${cityData.name}, ${countryName}`,
    });
  };

  // Handle neighborhood selection
  const handleNeighborhoodSelect = (neighborhoodName: string) => {
    setSelectedNeighborhood(neighborhoodName);

    if (currentLocation) {
      onLocationChange({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: `${neighborhoodName}, ${selectedCity}, ${selectedCountry}`,
        city: selectedCity,
        country: selectedCountry,
        neighborhood: neighborhoodName,
        region: selectedRegion,
        locationType: selectedTab,
      });
    }
  };

  // Render popular cities grid
  const renderPopularCities = () => {
    const destinations = featuredDestinations;

    return (
      <div className="space-y-6">
        {/* Quick search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cities worldwide..."
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        {/* Search results */}
        {searchQuery.length >= 2 && searchResults.length > 0 && (
          <div className="border border-border rounded-lg p-3 bg-muted/50">
            <Label className="text-sm text-muted-foreground mb-2 block">Search Results</Label>
            <ScrollArea className="h-40">
              <div className="space-y-1">
                {searchResults.slice(0, 15).map(({ region, country, city }) => (
                  <button
                    key={`${region}-${country}-${city.name}`}
                    onClick={() => handleCitySelect(city, country, region)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">{city.name}</span>
                    <span className="text-xs text-muted-foreground">{country}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Popular destinations by region */}
        {searchQuery.length < 2 && (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {/* USA */}
              {destinations.usa.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">USA</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.usa.slice(0, 10).map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, 'United States', 'North America')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mexico */}
              {destinations.mexico.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Mexico</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.mexico.map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, 'Mexico', 'North America')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Caribbean */}
              {destinations.caribbean.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Caribbean</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.caribbean.slice(0, 8).map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, city.name, 'Caribbean')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Europe */}
              {destinations.europe.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Europe</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.europe.slice(0, 12).map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, city.name, 'Europe')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Asia Pacific */}
              {destinations.asiaPacific.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Asia Pacific</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.asiaPacific.slice(0, 10).map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, city.name, 'Asia Pacific')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Middle East & Africa */}
              {destinations.middleEastAfrica.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Middle East & Africa</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.middleEastAfrica.slice(0, 8).map(city => (
                      <Button
                        key={city.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleCitySelect(city, city.name, 'Middle East & Africa')}
                        className="text-xs"
                      >
                        {city.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  };

  // Render browse mode
  const renderBrowseMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Region */}
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Region</Label>
          <Select value={selectedRegion} onValueChange={(v) => {
            setSelectedRegion(v);
            setSelectedCountry('');
            setSelectedCity('');
            setSelectedNeighborhood('');
          }}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {regions.map(r => (
                <SelectItem key={r} value={r} className="text-foreground">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Country</Label>
          <Select
            value={selectedCountry}
            onValueChange={(v) => {
              setSelectedCountry(v);
              setSelectedCity('');
              setSelectedNeighborhood('');
            }}
            disabled={!selectedRegion}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder={selectedRegion ? "Select" : "Choose region"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {countries.map(c => (
                <SelectItem key={c} value={c} className="text-foreground">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label className="text-foreground text-xs">City</Label>
          <Select
            value={selectedCity}
            onValueChange={(v) => {
              const cityData = cities.find(c => c.name === v);
              if (cityData) {
                handleCitySelect(cityData, selectedCountry, selectedRegion);
              }
              setSelectedNeighborhood('');
            }}
            disabled={!selectedCountry}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder={selectedCountry ? "Select" : "Choose country"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {cities.map(c => (
                <SelectItem key={c.name} value={c.name} className="text-foreground">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Neighborhood */}
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Neighborhood</Label>
          <Select
            value={selectedNeighborhood}
            onValueChange={handleNeighborhoodSelect}
            disabled={!selectedCity}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder={selectedCity ? "Select" : "Choose city"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {neighborhoods.map(n => (
                <SelectItem key={n} value={n} className="text-foreground">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  // Render Google search mode
  const renderSearchMode = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground">Search Address with Google</Label>
        <div className="flex gap-2">
          <Input
            ref={searchInputRef}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter address or place name..."
            className="bg-background border-border text-foreground"
          />
          <Button
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            variant="outline"
            title="Use current location"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Start typing to see Google suggestions, or click the map to set a location
        </p>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </CardTitle>
          {showPrivacyNotice && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                {userType === 'client' ? 'Exact location shared only with matches' : 'General area shown to clients'}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Type Tabs - Only for clients */}
        {userType === 'client' && (
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="home" className="text-foreground">
                Where I Live
              </TabsTrigger>
              <TabsTrigger value="current" className="text-foreground">
                Where I Am Now
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Selection Mode Tabs */}
        <div className="flex gap-2 border-b border-border pb-3">
          <Button
            variant={selectionMode === 'popular' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectionMode('popular')}
            className="flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Popular
          </Button>
          <Button
            variant={selectionMode === 'search' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectionMode('search')}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Google Search
          </Button>
          <Button
            variant={selectionMode === 'browse' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectionMode('browse')}
            className="flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Browse
          </Button>
        </div>

        {/* Selection Content */}
        {selectionMode === 'popular' && renderPopularCities()}
        {selectionMode === 'search' && renderSearchMode()}
        {selectionMode === 'browse' && renderBrowseMode()}

        {/* Map */}
        {showMap && (
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg border border-border bg-muted"
          >
            {!window.google && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Map loading...</p>
                  <p className="text-xs">Configure Google Maps API to enable</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Selected Location</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="text-sm font-mono text-foreground">
                  {currentLocation.latitude.toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="text-sm font-mono text-foreground">
                  {currentLocation.longitude.toFixed(6)}
                </p>
              </div>
            </div>
            {searchInput && (
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm text-foreground line-clamp-2">
                  {searchInput}
                </p>
              </div>
            )}
            {selectedNeighborhood && (
              <div>
                <p className="text-xs text-muted-foreground">Neighborhood</p>
                <p className="text-sm text-foreground">
                  {selectedNeighborhood}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {userType === 'client' ? 'How This Works for Renters' : 'How This Works for Owners'}
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {userType === 'client' ? (
              <>
                <li>Select from popular tourist destinations worldwide</li>
                <li>Use Google search to find any location</li>
                <li>Your exact location is kept private until you match</li>
                <li>Owners in your area will be able to find you</li>
                <li>Click on the map to fine-tune your location</li>
              </>
            ) : (
              <>
                <li>Add your property to be found by potential renters</li>
                <li>Select your city and neighborhood</li>
                <li>Clients searching in your area will find you</li>
                <li>Your exact address stays private until activation</li>
                <li>Click on the map to set your property location</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
