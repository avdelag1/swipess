import { useState, useEffect, useCallback } from 'react';
import type { CityLocation } from '@/data/worldLocations';

type WorldLocationsModule = typeof import('@/data/worldLocations');

const DEFAULT_FEATURED = {
  usa: [] as CityLocation[],
  mexico: [] as CityLocation[],
  caribbean: [] as CityLocation[],
  europe: [] as CityLocation[],
  asiaPacific: [] as CityLocation[],
  middleEastAfrica: [] as CityLocation[],
};

/**
 * Lazily loads the world locations data module on demand.
 * Saves ~200KB from the initial bundle by deferring the load
 * until a location-aware component is actually mounted.
 */
export function useWorldLocations() {
  const [mod, setMod] = useState<WorldLocationsModule | null>(null);

  useEffect(() => {
    import('@/data/worldLocations').then(setMod);
  }, []);

  const getRegions = useCallback((): string[] => mod?.getRegions() ?? [], [mod]);

  const getCountriesInRegion = useCallback(
    (region: string): string[] => mod?.getCountriesInRegion(region) ?? [],
    [mod]
  );

  const getCitiesInCountry = useCallback(
    (region: string, country: string): CityLocation[] =>
      mod?.getCitiesInCountry(region, country) ?? [],
    [mod]
  );

  const searchCities = useCallback(
    (query: string): { region: string; country: string; city: CityLocation }[] =>
      mod?.searchCities(query) ?? [],
    [mod]
  );

  const getPopularCities = useCallback(
    (): { region: string; country: string; city: CityLocation }[] =>
      mod?.getPopularCities() ?? [],
    [mod]
  );

  const getFeaturedDestinations = useCallback(
    () => mod?.getFeaturedDestinations() ?? DEFAULT_FEATURED,
    [mod]
  );

  const getNeighborhoodsForCity = useCallback(
    (cityName: string): string[] => mod?.getNeighborhoodsForCity(cityName) ?? [],
    [mod]
  );

  const getCityByName = useCallback(
    (cityName: string) => mod?.getCityByName(cityName) ?? null,
    [mod]
  );

  return {
    loaded: !!mod,
    getRegions,
    getCountriesInRegion,
    getCitiesInCountry,
    searchCities,
    getPopularCities,
    getFeaturedDestinations,
    getNeighborhoodsForCity,
    getCityByName,
  };
}
