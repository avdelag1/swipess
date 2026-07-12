import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Building, Globe, Loader2, MapPin, Navigation, Search, Star } from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import {
  CityLocation,
  getCitiesInCountry,
  getCountriesInRegion,
  getFeaturedDestinations,
  getNeighborhoodsForCity,
  getRegions,
  searchCities,
} from '@/data/worldLocations';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { getMapboxAccessToken } from '@/utils/mapboxConfig';

interface MapboxLocationSelectorProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  neighborhood?: string;
  locationType?: 'home' | 'current' | 'property';
  userType?: 'client' | 'owner';
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

type SelectionMode = 'search' | 'popular' | 'browse';

export function MapboxLocationSelector({
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
}: MapboxLocationSelectorProps) {
  const [searchInput, setSearchInput] = useState(address || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(latitude && longitude ? { latitude, longitude } : null);
  const [selectedTab, setSelectedTab] = useState<'home' | 'current' | 'property'>(locationType);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('popular');

  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>(country || '');
  const [selectedCity, setSelectedCity] = useState<string>(city || '');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>(neighborhood || '');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<any>(null);

  const regions = useMemo(() => getRegions(), []);
  const countries = useMemo(() => selectedRegion ? getCountriesInRegion(selectedRegion) : [], [selectedRegion]);
  const cities = useMemo(() => selectedRegion && selectedCountry ? getCitiesInCountry(selectedRegion, selectedCountry) : [], [selectedRegion, selectedCountry]);
  const neighborhoods = useMemo(() => selectedCity ? getNeighborhoodsForCity(selectedCity) : [], [selectedCity]);
  const featuredDestinations = useMemo(() => getFeaturedDestinations(), []);
  const searchResults = useMemo(() => searchQuery.length >= 2 ? searchCities(searchQuery) : [], [searchQuery]);

  useEffect(() => {
    if (!mapRef.current || !showMap) return;

    mapboxgl.accessToken = getMapboxAccessToken();
    mapboxgl.workerUrl = `https://api.mapbox.com/mapbox-gl-js/v${mapboxgl.version}/mapbox-gl-csp-worker.js`;
    if (!mapboxgl.accessToken) {
      return;
    }

    const center: [number, number] = currentLocation
      ? [currentLocation.longitude, currentLocation.latitude]
      : [-74.0060, 40.7128];

    mapInstance.current = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Better for dark mode
      center,
      zoom: currentLocation ? 13 : 4,
    });

    if (currentLocation) {
      markerRef.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(mapInstance.current);

      markerRef.current.on('dragend', async () => {
        const lngLat = markerRef.current.getLngLat();
        setCurrentLocation({ latitude: lngLat.lat, longitude: lngLat.lng });
        await reverseGeocode(lngLat.lat, lngLat.lng);
      });
    }

    mapInstance.current.on('click', async (e: any) => {
      const { lng, lat } = e.lngLat;
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ draggable: true })
          .setLngLat([lng, lat])
          .addTo(mapInstance.current);
      }
      setCurrentLocation({ latitude: lat, longitude: lng });
      await reverseGeocode(lat, lng);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap]);

  useEffect(() => {
    if (!mapInstance.current || !currentLocation) return;
    if (markerRef.current) {
      markerRef.current.setLngLat([currentLocation.longitude, currentLocation.latitude]);
    } else {
      markerRef.current = new mapboxgl.Marker({ draggable: true })
        .setLngLat([currentLocation.longitude, currentLocation.latitude])
        .addTo(mapInstance.current);
    }
    mapInstance.current.setCenter([currentLocation.longitude, currentLocation.latitude]);
    mapInstance.current.setZoom(13);
  }, [currentLocation]);

  useEffect(() => {
    if (!searchContainerRef.current || selectionMode !== 'search') return;
    if (!mapboxgl.accessToken) return;

    searchContainerRef.current.innerHTML = '';
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      types: 'place,address,poi'
    });

    geocoder.addTo(searchContainerRef.current);
    autocompleteRef.current = geocoder;

    geocoder.on('result', (e: any) => {
      const [lng, lat] = e.result.center;
      setCurrentLocation({ latitude: lat, longitude: lng });
      setSearchInput(e.result.place_name);

      let cityName = '';
      let countryName = '';
      e.result.context?.forEach((c: any) => {
        if (c.id.includes('place')) cityName = c.text;
        if (c.id.includes('country')) countryName = c.text;
      });

      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: e.result.place_name,
        city: cityName,
        country: countryName,
        locationType: selectedTab,
      });
    });

    return () => {
      if (autocompleteRef.current) {
        try {
            autocompleteRef.current.onRemove();
        } catch (_err) {
          autocompleteRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode, selectedTab]);

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    if (!canGeolocate()) {
      appToast.error("Geolocation Not Available");
      setIsLoading(false);
      return;
    }
    try {
      const { latitude: lat, longitude: lng } = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      setCurrentLocation({ latitude: lat, longitude: lng });
      setSelectedTab('current');

      if (mapInstance.current) {
        mapInstance.current.setCenter([lng, lat]);
        mapInstance.current.setZoom(15);
      }

      await reverseGeocode(lat, lng);
      setIsLoading(false);
      appToast.success("Location Found");
    } catch (error) {
      logger.error('Geolocation error:', error);
      appToast.error("Location Access Denied");
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      if (!mapboxgl.accessToken) return;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        setSearchInput(feature.place_name);

        let cityName = '';
        let countryName = '';
        feature.context?.forEach((c: any) => {
          if (c.id.includes('place')) cityName = c.text;
          if (c.id.includes('country')) countryName = c.text;
        });

        onLocationChange({
          latitude: lat,
          longitude: lng,
          address: feature.place_name,
          city: cityName,
          country: countryName,
          locationType: selectedTab,
        });
      }
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
    }
  };

  const handleCitySelect = (cityData: CityLocation, countryName: string, regionName?: string) => {
    setCurrentLocation({
      latitude: cityData.coordinates.lat,
      longitude: cityData.coordinates.lng,
    });
    setSelectedCity(cityData.name);
    setSearchInput(`${cityData.name}, ${countryName}`);

    if (mapInstance.current) {
      mapInstance.current.setCenter([cityData.coordinates.lng, cityData.coordinates.lat]);
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

    appToast.success("Location Selected");
  };

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

  const renderPopularCities = () => {
    const destinations = featuredDestinations;
    return (
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cities worldwide..."
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>
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
        {searchQuery.length < 2 && (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {destinations.usa.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">USA</Badge>
                    <Star className="w-3 h-3 text-yellow-500" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {destinations.usa.slice(0, 10).map(c => (
                      <Button key={c.name} variant="outline" size="sm" onClick={() => handleCitySelect(c, 'United States', 'North America')} className="text-xs">{c.name}</Button>
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

  const renderBrowseMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Region</Label>
          <Select value={selectedRegion} onValueChange={(v) => {
            setSelectedRegion(v); setSelectedCountry(''); setSelectedCity(''); setSelectedNeighborhood('');
          }}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Country</Label>
          <Select value={selectedCountry} onValueChange={(v) => {
            setSelectedCountry(v); setSelectedCity(''); setSelectedNeighborhood('');
          }} disabled={!selectedRegion}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder={selectedRegion ? "Select" : "Choose region"} /></SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground text-xs">City</Label>
          <Select value={selectedCity} onValueChange={(v) => {
            const cd = cities.find(c => c.name === v);
            if (cd) handleCitySelect(cd, selectedCountry, selectedRegion);
            setSelectedNeighborhood('');
          }} disabled={!selectedCountry}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder={selectedCountry ? "Select" : "Choose country"} /></SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {cities.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground text-xs">Neighborhood</Label>
          <Select value={selectedNeighborhood} onValueChange={handleNeighborhoodSelect} disabled={!selectedCity}>
            <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder={selectedCity ? "Select" : "Choose city"} /></SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderSearchMode = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-foreground">Search Address with Mapbox</Label>
        <div className="flex gap-2 w-full">
          {/* Mapbox Geocoder Container */}
          <div ref={searchContainerRef} className="flex-1 w-full [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-none [&_.mapboxgl-ctrl-geocoder]:border [&_.mapboxgl-ctrl-geocoder]:border-border [&_.mapboxgl-ctrl-geocoder]:bg-background [&_.mapboxgl-ctrl-geocoder_input]:text-foreground" />
          <Button onClick={handleGetCurrentLocation} disabled={isLoading} variant="outline" title="Use current location">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Start typing to see suggestions, or click the map</p>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <CardTitle className="text-foreground text-lg flex items-center gap-2"><MapPin className="w-5 h-5" />{title}</CardTitle>
          {showPrivacyNotice && (
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <p className="text-sm text-rose-700 dark:text-rose-300">{userType === 'client' ? 'Exact location shared only with matches' : 'General area shown to clients'}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {userType === 'client' && (
          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="home" className="text-foreground">Where I Live</TabsTrigger>
              <TabsTrigger value="current" className="text-foreground">Where I Am Now</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <div className="flex gap-2 border-b border-border pb-3">
          <Button variant={selectionMode === 'popular' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectionMode('popular')} className="flex items-center gap-2"><Star className="w-4 h-4" />Popular</Button>
          <Button variant={selectionMode === 'search' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectionMode('search')} className="flex items-center gap-2"><Search className="w-4 h-4" />Map Search</Button>
          <Button variant={selectionMode === 'browse' ? 'default' : 'ghost'} size="sm" onClick={() => setSelectionMode('browse')} className="flex items-center gap-2"><Globe className="w-4 h-4" />Browse</Button>
        </div>

        {selectionMode === 'popular' && renderPopularCities()}
        {selectionMode === 'search' && renderSearchMode()}
        {selectionMode === 'browse' && renderBrowseMode()}

        {showMap && (
          <div ref={mapRef} className="w-full h-64 rounded-lg border border-border bg-muted overflow-hidden relative">
            {!mapboxgl.accessToken && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10 text-muted-foreground">
                <div className="text-center">
                  <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Map loading...</p>
                  <p className="text-xs">Configure VITE_MAPBOX_ACCESS_TOKEN to enable</p>
                </div>
              </div>
            )}
          </div>
        )}

        {currentLocation && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Selected Location</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="text-sm font-mono text-foreground">{currentLocation.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="text-sm font-mono text-foreground">{currentLocation.longitude.toFixed(6)}</p>
              </div>
            </div>
            {searchInput && <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm text-foreground line-clamp-2">{searchInput}</p></div>}
            {selectedNeighborhood && <div><p className="text-xs text-muted-foreground">Neighborhood</p><p className="text-sm text-foreground">{selectedNeighborhood}</p></div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
