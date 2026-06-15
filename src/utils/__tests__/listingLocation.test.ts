import { describe, expect, it } from 'vitest';
import {
  isValidListingCoordinates,
  resolveListingCoordinatesSync,
} from '@/utils/listingLocation';

describe('listingLocation', () => {
  it('accepts valid coordinates', () => {
    expect(isValidListingCoordinates(20.2114, -87.4654)).toBe(true);
  });

  it('rejects null island and missing values', () => {
    expect(isValidListingCoordinates(null, null)).toBe(false);
    expect(isValidListingCoordinates(0, 0)).toBe(false);
    expect(isValidListingCoordinates(undefined, -80)).toBe(false);
  });

  it('resolves known cities from catalog', () => {
    const coords = resolveListingCoordinatesSync({ city: 'Tulum', country: 'Mexico' });
    expect(coords).not.toBeNull();
    expect(coords!.latitude).toBeCloseTo(20.2111, 2);
    expect(coords!.longitude).toBeCloseTo(-87.4653, 2);
  });

  it('prefers explicit coordinates over city lookup', () => {
    const coords = resolveListingCoordinatesSync({
      latitude: 25.7617,
      longitude: -80.1918,
      city: 'Tulum',
    });
    expect(coords).toEqual({ latitude: 25.7617, longitude: -80.1918 });
  });
});