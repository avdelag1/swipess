import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

interface ClientLocationSelectorProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  locationType?: 'home' | 'current'; // Where I live vs Where I am now
  onLocationChange: (data: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    country?: string;
    locationType: 'home' | 'current';
  }) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export function ClientLocationSelector({
  latitude,
  longitude,
  address,
  locationType = 'home',
  onLocationChange,
}: ClientLocationSelectorProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(latitude && longitude ? { latitude, longitude } : null);
  const [selectedTab, setSelectedTab] = useState<'home' | 'current'>(locationType);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if Google Maps API is loaded
    if (!window.google) {
      toast({
        title: "Google Maps Not Ready",
        description: "Google Maps is loading. Please wait a moment and try again.",
        variant: "default"
      });
      return;
    }

    // Initialize map
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: currentLocation
        ? { lat: currentLocation.latitude, lng: currentLocation.longitude }
        : { lat: 20.2111, lng: -87.0739 }, // Default: Tulum, Mexico
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
    });

    // Add marker if location exists
    if (currentLocation) {
      new window.google.maps.Marker({
        map: mapInstance.current,
        position: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
        title: 'Your Location',
      });
    }

    // Add click listener to place marker
    const handleMapClick = async (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setCurrentLocation({ latitude: lat, longitude: lng });
      await reverseGeocode(lat, lng);
    };
    mapInstance.current.addListener('click', handleMapClick);

    // Setup search autocomplete
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          types: ['geocode'],
          fields: ['geometry', 'formatted_address', 'address_components'],
        }
      );
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setCurrentLocation({ latitude: lat, longitude: lng });
          setSearchInput(place.formatted_address || '');

          // Center map on selected location
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(15);
          }

          onLocationChange({
            latitude: lat,
            longitude: lng,
            address: place.formatted_address || '',
            locationType: selectedTab,
          });
        }
      });
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        window.google.maps.event.clearInstanceListeners(mapInstance.current);
      }
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [selectedTab, onLocationChange]);

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
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat, lng } },
          (results: any, status: string) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              reject(new Error('Geocoding failed'));
            }
          }
        );
      });

      const addressStr = response as string;
      setSearchInput(addressStr);
      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: addressStr,
        locationType: selectedTab,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Reverse geocoding error:', error);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast({
        title: "Enter an Address",
        description: "Please type an address to search.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (!window.google) {
        toast({
          title: "Google Maps Not Ready",
          description: "Please wait for Google Maps to load.",
          variant: "default"
        });
        setIsLoading(false);
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchInput }, (results: any, status: string) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          setCurrentLocation({ latitude: lat, longitude: lng });

          // Center map
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat, lng });
            mapInstance.current.setZoom(15);
          }

          onLocationChange({
            latitude: lat,
            longitude: lng,
            address: results[0].formatted_address,
            locationType: selectedTab,
          });

          toast({
            title: "Location Found",
            description: `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`,
          });
        } else if (status === 'ZERO_RESULTS') {
          toast({
            title: "Location Not Found",
            description: "No results found for this address. Please check the spelling and try again.",
            variant: "destructive"
          });
        } else if (status === 'OVER_QUERY_LIMIT') {
          toast({
            title: "Too Many Requests",
            description: "Google Maps quota exceeded. Please wait a moment before trying again.",
            variant: "destructive"
          });
        } else if (status === 'REQUEST_DENIED') {
          toast({
            title: "API Configuration Error",
            description: "Google Maps API key issue. Please check the configuration.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Search Error",
            description: `Geocoding error (${status}). Please try again.`,
            variant: "destructive"
          });
        }
        setIsLoading(false);
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Search error:', error);
      }
      toast({
        title: "Search Failed",
        description: "An error occurred during search.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-foreground text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Your Location
          </CardTitle>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Exact location shared only with matches
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'home' | 'current')}>
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="home" className="text-foreground">
              Where I Live
            </TabsTrigger>
            <TabsTrigger value="current" className="text-foreground">
              Where I Am Now
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Search Address</Label>
              <div className="flex gap-2">
                <Input
                  ref={searchInputRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter your address (e.g., 123 Main St, New York, NY)"
                  className="bg-background border-border text-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="whitespace-nowrap"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click on the map or search to set your home location
              </p>
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Use My Current Location
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Click the button to detect your current location
            </p>
          </TabsContent>
        </Tabs>

        {/* Map */}
        <div
          ref={mapRef}
          className="w-full h-80 rounded-lg border border-border bg-background"
        />

        {/* Current Location Display */}
        {currentLocation && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
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
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How This Works
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Your exact location is kept completely private</li>
            <li>✓ Only matched owners can see your precise coordinates</li>
            <li>✓ Use "Where I Live" for your home address</li>
            <li>✓ Use "Where I Am Now" for real-time location detection</li>
            <li>✓ Click on the map to pin a location</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
