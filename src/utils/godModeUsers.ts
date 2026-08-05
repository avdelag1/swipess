/**
 * God Mode Users — These accounts have unlimited access to everything, forever.
 * They bypass all subscription, token, and trial restrictions.
 *
 * To add or remove users, simply edit this array.
 */
export const GOD_MODE_IDS: readonly string[] = [
  'd229cb02-be77-44bc-9b5d-1a747e51b632',
  'b840f348-7d85-4cf5-9e25-13d1d645b721',
  '8b59c63c-ef72-45ee-a813-f5b9eabb874c',
  'cf46e8d6-94af-4419-b987-eeaf9cab4829',
  '2e50c534-9979-4885-b126-8a6c6384fc0d',
  '5d37e29e-1979-4699-9dfb-7f6053bf6c5d',
  'c7e35832-fe3e-4187-af1d-b34601581ed3',
  '7fe73094-1868-4246-9564-6f2d0ad71e28',
  '7e2b796b-70f9-4a3d-ac1f-7ce60def1205',
] as const;

/**
 * Check if a given user ID is a God Mode user.
 */
export function isGodModeUser(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return GOD_MODE_IDS.includes(userId);
}
