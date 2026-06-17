import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AlertCircle, MapPin, Move } from 'lucide-react';
import {
  getCitiesInCountry,
  getCityByName,
  getCountriesInRegion,
  getRegions,
} from '@/data/worldLocations';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxAccessToken, resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { triggerHaptic } from '@/utils/haptics';
import { SmartSelector } from '@/components/listing/SmartSelector';
import { QuickCityPicker } from './QuickCityPicker';
import { POPULAR_CITIES, POPULAR_COUNTRIES } from '@/constants/listingTaxonomies';
import { cn } from '@/lib/utils';

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
  onCoordinatesChange?: (lat: number | null, lng: number | null) => void;
  /** Visual accent for selectors — defaults to emerald (property). */
  accent?: 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';
}

const MAP_HEIGHT = 'h-56';

export function OwnerLocationSelector({
  country = '',
  city = '',
  neighborhood = '',
  onCountryChange,
  onCityChange,
  onNeighborhoodChange,
  onCoordinatesChange,
  latitude,
  longitude,
  accent = 'emerald',
}: OwnerLocationSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const lastSyncedRef = useRef<{ lat: number; lng: number } | null>(null);
  const [mapToken, setMapToken] = useState<string>(() => getMapboxAccessToken());

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    for (const region of getRegions()) {
      getCountriesInRegion(region).forEach((c) => countries.add(c));
    }
    return Array.from(countries).sort();
  }, []);

  const countryGroups = useMemo(
    () => [
      {
        label: 'Quick Access',
        options: POPULAR_COUNTRIES.filter((c) => allCountries.includes(c)),
      },
      { label: 'All Countries', options: allCountries },
    ],
    [allCountries],
  );

  useEffect(() => {
    if (!country) return;
    for (const region of getRegions()) {
      if (getCountriesInRegion(region).includes(country)) {
        setSelectedRegion(region);
        break;
      }
    }
  }, [country]);

  const availableCities = useMemo(() => {
    if (!country || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, country);
  }, [country, selectedRegion]);

  const cityGroups = useMemo(() => {
    if (!availableCities.length) return undefined;
    const names = availableCities.map((c) => c.name);
    const quick = names.filter((n) =>
      POPULAR_CITIES.some((p) => p.toLowerCase() === n.toLowerCase() || n.toLowerCase().includes(p.toLowerCase())),
    ).slice(0, 12);
    const rest = names.filter((n) => !quick.includes(n));
    return [
      ...(quick.length ? [{ label: 'Quick Access', options: quick }] : []),
      { label: 'All Cities', options: rest.length ? rest : names },
    ];
  }, [availableCities]);

  const availableNeighborhoods = useMemo(() => {
    if (!city) return [];
    return getCityByName(city)?.city.neighborhoods ?? [];
  }, [city]);

  const handleCountryChange = (newCountry: string) => {
    onCountryChange(newCountry);
    onCityChange('');
    onNeighborhoodChange('');
    onCoordinatesChange?.(null, null);
    for (const region of getRegions()) {
      if (getCountriesInRegion(region).includes(newCountry)) {
        setSelectedRegion(region);
        break;
      }
    }
  };

  const handleCityChange = (newCity: string) => {
    onCityChange(newCity);
    onNeighborhoodChange('');
    if (newCity && onCoordinatesChange) {
      const cityData = getCityByName(newCity);
      if (cityData?.city.coordinates) {
        onCoordinatesChange(cityData.city.coordinates.lat, cityData.city.coordinates.lng);
      }
    }
  };

  const hasCoords = latitude != null && longitude != null;

  useEffect(() => {
    if (mapToken) return;
    let active = true;
    resolveMapboxAccessToken().then((t) => {
      if (active && t) setMapToken(t);
    });
    return () => { active = false; };
  }, [mapToken]);

  useEffect(() => {
    if (!mapToken || !hasCoords || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = mapToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [longitude as number, latitude as number],
      zoom: 13,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, color: '#10b981' })
      .setLngLat([longitude as number, latitude as number])
      .addTo(map);
    markerRef.current = marker;
    lastSyncedRef.current = { lat: latitude as number, lng: longitude as number };

    const commit = (lat: number, lng: number) => {
      lastSyncedRef.current = { lat, lng };
      triggerHaptic('light');
      onCoordinatesChange?.(lat, lng);
    };

    marker.on('dragend', () => {
      const ll = marker.getLngLat();
      commit(ll.lat, ll.lng);
    });

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      commit(lat, lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapToken, hasCoords]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !hasCoords) return;
    const last = lastSyncedRef.current;
    if (last && Math.abs(last.lat - (latitude as number)) < 1e-6 && Math.abs(last.lng - (longitude as number)) < 1e-6) {
      return;
    }
    markerRef.current.setLngLat([longitude as number, latitude as number]);
    mapRef.current.flyTo({ center: [longitude as number, latitude as number], zoom: 13, duration: 600 });
    lastSyncedRef.current = { lat: latitude as number, lng: longitude as number };
  }, [latitude, longitude, hasCoords]);

  return (
    <div className="bg-card border-border rounded-3xl border shadow-md overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">Location</h3>
        </div>
        {hasCoords ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            Pin set
          </Badge>
        ) : city ? (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Confirm pin
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/30 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Required
          </Badge>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        <QuickCityPicker
          value={city}
          placeholder="Quick search: Cancún, Playa del Carmen…"
          onSelect={(sel) => {
            if (sel.country) handleCountryChange(sel.country);
            if (sel.city) handleCityChange(sel.city);
            if (sel.latitude != null && sel.longitude != null) {
              onCoordinatesChange?.(sel.latitude, sel.longitude);
            }
          }}
          inputClassName="bg-secondary/50 border-border text-foreground"
        />

        <SmartSelector
          label="Country"
          accent={accent}
          single
          forceSheet
          groups={countryGroups}
          value={country ? [country] : []}
          onChange={(v) => handleCountryChange(v[0] ?? '')}
          placeholder="Search country…"
          searchPlaceholder="Mexico, USA, Spain…"
        />

        <SmartSelector
          label="City"
          accent={accent}
          single
          forceSheet
          groups={cityGroups}
          value={city ? [city] : []}
          onChange={(v) => handleCityChange(v[0] ?? '')}
          placeholder={country ? 'Search city…' : 'Select country first'}
          searchPlaceholder="Cancún, Tulum, CDMX…"
          disabled={!country}
        />

        {availableNeighborhoods.length > 0 ? (
          <SmartSelector
            label="Neighborhood (optional)"
            accent={accent}
            single
            forceSheet
            options={availableNeighborhoods}
            value={neighborhood ? [neighborhood] : []}
            onChange={(v) => onNeighborhoodChange(v[0] ?? '')}
            placeholder="Search neighborhood…"
            searchPlaceholder="Hotel Zone, Centro…"
            disabled={!city}
          />
        ) : (
          <div>
            <Label className="text-sm font-semibold text-foreground/80 mb-1.5 block">Neighborhood (optional)</Label>
            <div className="h-12 px-4 rounded-2xl border border-border bg-secondary/30 flex items-center text-sm text-muted-foreground">
              {!city ? 'Select city first' : 'No neighborhoods for this city'}
            </div>
          </div>
        )}

        {(city || country) && (
          <div className="flex flex-wrap gap-1.5 min-h-[28px]">
            {country && <Badge variant="secondary" className="text-xs py-0.5">{country}</Badge>}
            {city && (
              <Badge variant="default" className="text-xs py-0.5">
                <MapPin className="w-3 h-3 mr-1" />
                {city}
              </Badge>
            )}
            {neighborhood && <Badge variant="outline" className="text-xs py-0.5">{neighborhood}</Badge>}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-primary" />
              Fine-tune your pin
            </Label>
            {hasCoords && (
              <span className="text-[10px] text-muted-foreground">Drag pin or tap map</span>
            )}
          </div>

          <div className={cn('relative w-full rounded-xl border border-border overflow-hidden bg-muted', MAP_HEIGHT)}>
            {hasCoords && mapToken ? (
              <>
                <div ref={mapContainerRef} className="absolute inset-0" />
                <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center gap-1.5 bg-background/85 backdrop-blur-md rounded-lg px-2.5 py-1.5 border border-border z-10">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[11px] text-foreground font-medium">
                    Drag the green pin or tap anywhere on the map
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-4">
                <MapPin className={cn('w-5 h-5', hasCoords ? 'text-emerald-400' : 'text-muted-foreground')} />
                <p className="text-xs text-muted-foreground">
                  {hasCoords
                    ? 'Pin set from your city. Interactive map loading…'
                    : 'Pick a city to drop a pin, then drag it to your exact spot.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <p className="text-xs text-amber-200/90">City and neighborhood are visible in search. Exact address stays private until after a match.</p>
        </div>
      </div>
    </div>
  );
}