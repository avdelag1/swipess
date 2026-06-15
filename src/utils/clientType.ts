/** Seeker intent stored on client_profiles.client_type */
export type SeekerClientType = 'buyer' | 'renter' | 'hire';

export const CLIENT_TYPE_DB_VALUES: SeekerClientType[] = ['buyer', 'renter', 'hire'];

export const CLIENT_TYPE_OPTIONS: {
  id: SeekerClientType;
  label: string;
  description: string;
  emoji: string;
  intentionIds: string[];
}[] = [
  {
    id: 'buyer',
    label: 'Looking to Buy',
    description: 'Property, vehicles, or assets',
    emoji: '💰',
    intentionIds: ['buy_property', 'buy_motorcycle'],
  },
  {
    id: 'renter',
    label: 'Looking to Rent',
    description: 'Homes, rooms, bikes, or scooters',
    emoji: '🔑',
    intentionIds: ['rent_property', 'rent_motorcycle', 'rent_bicycle'],
  },
  {
    id: 'hire',
    label: 'Looking to Hire',
    description: 'Professionals and services',
    emoji: '👥',
    intentionIds: ['hire_service'],
  },
];

/** Map UI / filter-store values to DB client_type */
export function filterClientTypeToDb(filterType?: string | null): SeekerClientType | null {
  if (!filterType || filterType === 'all') return null;
  const map: Record<string, SeekerClientType> = {
    buy: 'buyer',
    buyer: 'buyer',
    buyers: 'buyer',
    rent: 'renter',
    renter: 'renter',
    renters: 'renter',
    hire: 'hire',
    leads: 'hire',
    individual: 'renter',
    family: 'renter',
    business: 'hire',
  };
  return map[filterType] ?? null;
}

export function categoryToClientType(category?: string | null): SeekerClientType | null {
  if (!category) return null;
  const map: Record<string, SeekerClientType> = {
    buyers: 'buyer',
    renters: 'renter',
    hire: 'hire',
    leads: 'hire',
  };
  return map[category] ?? null;
}

export function deriveClientTypeFromIntentions(intentions: unknown): SeekerClientType | null {
  if (!Array.isArray(intentions) || intentions.length === 0) return null;
  const ids = intentions.map(String);
  if (ids.some((id) => id === 'buy_property' || id.includes('buy'))) return 'buyer';
  if (ids.some((id) => id === 'hire_service' || id.includes('hire'))) return 'hire';
  if (ids.some((id) => id.includes('rent'))) return 'renter';
  return null;
}

export function deriveClientTypeFromOccupation(occupation?: string | null): SeekerClientType | null {
  const o = (occupation || '').toLowerCase();
  if (o.includes('buy')) return 'buyer';
  if (o.includes('rent')) return 'renter';
  if (o.includes('hire') || o.includes('service')) return 'hire';
  return null;
}

export function resolveClientType(input: {
  client_type?: string | null;
  intentions?: unknown;
  occupation?: string | null;
}): SeekerClientType | null {
  const direct = input.client_type as SeekerClientType | undefined;
  if (direct && CLIENT_TYPE_DB_VALUES.includes(direct)) return direct;
  return (
    deriveClientTypeFromIntentions(input.intentions) ??
    deriveClientTypeFromOccupation(input.occupation)
  );
}

export function intentionsForClientType(type: SeekerClientType): string[] {
  return CLIENT_TYPE_OPTIONS.find((o) => o.id === type)?.intentionIds ?? [];
}

export function clientMatchesSeekerType(
  profile: { client_type?: string | null; intentions?: unknown; occupation?: string | null },
  expected: SeekerClientType,
): boolean {
  return resolveClientType(profile) === expected;
}