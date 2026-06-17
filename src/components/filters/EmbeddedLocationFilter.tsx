import { memo, useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getCitiesInCountry,
  getCityByName,
  getCountriesInRegion,
  getRegions,
} from '@/data/worldLocations';
import { SmartSelector } from '@/components/listing/SmartSelector';
import { QuickCityPicker } from '@/components/location/QuickCityPicker';
import { POPULAR_CITIES, POPULAR_COUNTRIES } from '@/constants/listingTaxonomies';

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
  countries?: string[];
  setCountries?: (countries: string[]) => void;
  cities?: string[];
  setCities?: (cities: string[]) => void;
  neighborhoods?: string[];
  setNeighborhoods?: (neighborhoods: string[]) => void;
  multiSelect?: boolean;
  defaultOpen?: boolean;
  accent?: 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';
}

export const EmbeddedLocationFilter = memo(function EmbeddedLocationFilter({
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
  accent = 'emerald',
}: EmbeddedLocationFilterProps) {
  const [selectedRegion, setSelectedRegion] = useState('');

  const allCountries = useMemo(() => {
    const list = new Set<string>();
    for (const region of getRegions()) {
      getCountriesInRegion(region).forEach((c) => list.add(c));
    }
    return Array.from(list).sort();
  }, []);

  const countryGroups = useMemo(
    () => [
      { label: 'Quick Access', options: POPULAR_COUNTRIES.filter((c) => allCountries.includes(c)) },
      { label: 'All Countries', options: allCountries },
    ],
    [allCountries],
  );

  const cascadeCountry = country || countries[0] || '';

  useEffect(() => {
    if (!cascadeCountry) return;
    for (const region of getRegions()) {
      if (getCountriesInRegion(region).includes(cascadeCountry)) {
        setSelectedRegion(region);
        break;
      }
    }
  }, [cascadeCountry]);

  const availableCities = useMemo(() => {
    if (!cascadeCountry || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, cascadeCountry);
  }, [cascadeCountry, selectedRegion]);

  const cityGroups = useMemo(() => {
    if (!availableCities.length) return undefined;
    const names = availableCities.map((c) => c.name);
    const quick = names
      .filter((n) =>
        POPULAR_CITIES.some((p) => p.toLowerCase() === n.toLowerCase() || n.toLowerCase().includes(p.toLowerCase())),
      )
      .slice(0, 12);
    const rest = names.filter((n) => !quick.includes(n));
    return [
      ...(quick.length ? [{ label: 'Quick Access', options: quick }] : []),
      { label: 'All Cities', options: rest.length ? rest : names },
    ];
  }, [availableCities]);

  const availableNeighborhoods = useMemo(() => {
    const scopeCity = city || cities[0];
    if (!scopeCity) return [];
    return getCityByName(scopeCity)?.city.neighborhoods ?? [];
  }, [city, cities]);

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCity('');
    setNeighborhood('');
    setCities?.([]);
    setNeighborhoods?.([]);
  };

  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setNeighborhood('');
    setNeighborhoods?.([]);
  };

  const handleQuickSelect = (sel: { city: string; country: string }) => {
    if (multiSelect) {
      if (sel.country && setCountries && !countries.includes(sel.country)) {
        setCountries([...countries, sel.country]);
      }
      if (sel.city && setCities && !cities.includes(sel.city)) {
        setCities([...cities, sel.city]);
      }
      if (sel.country) setCountry(sel.country);
    } else {
      if (sel.country) handleCountryChange(sel.country);
      if (sel.city) handleCityChange(sel.city);
    }
  };

  const hasActiveFilters =
    country || city || neighborhood || countries.length > 0 || cities.length > 0 || neighborhoods.length > 0;

  const clearLocationFilters = () => {
    setSelectedRegion('');
    setCountry('');
    setCity('');
    setNeighborhood('');
    setCountries?.([]);
    setCities?.([]);
    setNeighborhoods?.([]);
  };

  const countryValue = multiSelect && setCountries ? countries : country ? [country] : [];
  const cityValue = multiSelect && setCities ? cities : city ? [city] : [];
  const neighborhoodValue = multiSelect && setNeighborhoods ? neighborhoods : neighborhood ? [neighborhood] : [];

  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-muted hover:text-foreground rounded-xl transition-colors duration-200">
        <div className="flex items-center gap-2 min-h-10">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <Label className="font-semibold cursor-pointer text-sm">Location</Label>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {[country, city, neighborhood, ...countries, ...cities, ...neighborhoods].filter(Boolean).length} selected
            </Badge>
          )}
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-3 pt-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocationFilters}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Clear Location
          </Button>
        )}

        <QuickCityPicker
          value={city || cities[0] || ''}
          placeholder="Quick search: Cancún, Tulum, CDMX…"
          onSelect={handleQuickSelect}
          inputClassName="bg-secondary/50 border-border text-foreground h-11"
        />

        <SmartSelector
          label={multiSelect ? 'Countries' : 'Country'}
          accent={accent}
          single={!multiSelect || !setCountries}
          forceSheet
          groups={countryGroups}
          value={countryValue}
          onChange={(v) => {
            if (multiSelect && setCountries) {
              setCountries(v);
              if (v.length === 1) setCountry(v[0]);
              else if (!v.includes(country)) setCountry(v[0] ?? '');
            } else {
              handleCountryChange(v[0] ?? '');
            }
          }}
          placeholder="Search countries…"
          searchPlaceholder="Mexico, USA, Spain…"
        />

        {multiSelect && setCountries && countries.length > 1 && (
          <SmartSelector
            label="City list scope"
            accent={accent}
            single
            forceSheet
            groups={countryGroups}
            value={country ? [country] : []}
            onChange={(v) => handleCountryChange(v[0] ?? '')}
            placeholder="Pick country to browse cities"
            searchPlaceholder="Which country's cities?"
          />
        )}

        <SmartSelector
          label={multiSelect ? 'Cities' : 'City'}
          accent={accent}
          single={!multiSelect || !setCities}
          forceSheet
          groups={cityGroups}
          value={cityValue}
          onChange={(v) => {
            if (multiSelect && setCities) {
              setCities(v);
              if (v.length === 1) setCity(v[0]);
            } else {
              handleCityChange(v[0] ?? '');
            }
          }}
          placeholder={cascadeCountry ? 'Search cities…' : 'Select a country first'}
          searchPlaceholder="Cancún, Playa del Carmen…"
          disabled={!cascadeCountry}
        />

        {availableNeighborhoods.length > 0 ? (
          <SmartSelector
            label={multiSelect ? 'Neighborhoods' : 'Neighborhood'}
            accent={accent}
            single={!multiSelect || !setNeighborhoods}
            forceSheet
            options={availableNeighborhoods}
            value={neighborhoodValue}
            onChange={(v) => {
              if (multiSelect && setNeighborhoods) {
                setNeighborhoods(v);
                if (v.length === 1) setNeighborhood(v[0]);
              } else {
                setNeighborhood(v[0] ?? '');
              }
            }}
            placeholder="Search neighborhoods…"
            searchPlaceholder="Hotel Zone, Centro…"
            disabled={!(city || cities.length)}
          />
        ) : (
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Neighborhood</Label>
            <div className="h-11 px-4 rounded-2xl border border-border bg-secondary/30 flex items-center text-sm text-muted-foreground">
              {!(city || cities.length) ? 'Select a city first' : 'No neighborhoods for this city'}
            </div>
          </div>
        )}

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 min-h-[28px] pt-2 border-t border-border/50">
            {!multiSelect && country && <Badge variant="secondary" className="text-xs">{country}</Badge>}
            {!multiSelect && city && <Badge variant="default" className="text-xs">{city}</Badge>}
            {!multiSelect && neighborhood && <Badge variant="outline" className="text-xs">{neighborhood}</Badge>}
            {countries.map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
            ))}
            {cities.map((c) => (
              <Badge key={c} variant="default" className="text-xs">{c}</Badge>
            ))}
            {neighborhoods.map((n) => (
              <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Filter listings and clients by area — search first, refine with sheets.</p>
      </CollapsibleContent>
    </Collapsible>
  );
});