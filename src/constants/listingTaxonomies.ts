/**
 * Curated taxonomies for listing & profile fields.
 * Replaces freeform textareas — users select from preset chips only.
 */

export const PROPERTY_VIBE = [
  'Quiet', 'Lively', 'Family-friendly', 'Pet-friendly',
  'Beachfront', 'Jungle', 'Downtown', 'Gated', 'Eco',
] as const;

export const PROPERTY_FEATURES = [
  'Pool', 'Gym', 'Parking', 'AC', 'WiFi', 'Security 24/7',
  'Garden', 'Balcony', 'Elevator', 'Storage', 'Workspace',
  'Washer/Dryer', 'Smart-home', 'Solar', 'Backup water',
] as const;

export const PROPERTY_INCLUDED = [
  'Water', 'Electricity', 'Gas', 'Internet',
  'Cleaning', 'Maintenance', 'Trash', 'Cable TV',
] as const;

export const PROPERTY_RULES = [
  'No smoking', 'No parties', 'Quiet hours',
  'Pets allowed', 'Children welcome', 'Long-stay only',
] as const;

export const MOTO_TYPE = [
  'Sport', 'Cruiser', 'Adventure', 'Naked',
  'Scooter', 'Off-road', 'Touring', 'Electric',
] as const;

export const MOTO_CONDITION = [
  'Brand new', 'Like new', 'Good', 'Fair', 'Project',
] as const;

export const MOTO_FEATURES = [
  'ABS', 'ESC', 'Traction control', 'Heated grips',
  'Luggage rack', 'Crash bars', 'Quick-shifter', 'Bluetooth',
] as const;

export const MOTO_INCLUDED = [
  'Helmet', 'Riding gear', 'Lock', 'Top case',
  'Charger', 'Insurance', 'Roadside assistance',
] as const;

export const BIKE_TYPE = [
  'Road', 'Mountain', 'Hybrid', 'Cruiser',
  'BMX', 'Folding', 'Cargo', 'Electric',
] as const;

export const BIKE_FEATURES = [
  'Front suspension', 'Full suspension', 'Disc brakes',
  'Carbon frame', 'Aluminum frame', 'Tubeless', 'Dropper post',
] as const;

export const BIKE_INCLUDED = [
  'Lock', 'Lights', 'Basket', 'Pump', 'Helmet', 'Repair kit',
] as const;

export const BIKE_CONDITION = [
  'Brand new', 'Like new', 'Good', 'Fair',
] as const;

export const WORKER_TRAITS = [
  'Punctual', 'Detail-oriented', 'English-speaking', 'Spanish-speaking',
  'Insured', 'Background-checked', 'Own tools', 'Own vehicle', 'Emergency available',
] as const;

export const WORKER_AVAILABILITY = [
  'Mornings', 'Afternoons', 'Evenings', 'Weekends', '24/7',
] as const;

export const WORKER_PRICING = [
  'Hourly', 'Daily', 'Per-job', 'Monthly contract',
] as const;

export const OWNER_INTENT = [
  'Looking for tenant',
  'Looking for buyer',
  'Renting short-term',
  'Hiring workers',
  'Looking for partners',
] as const;

export const OWNER_TRAITS = [
  'Responsive', 'Flexible', 'Strict', 'Pet-friendly host',
  'Family-oriented', 'Business-only',
] as const;

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'German',
  'Italian', 'Portuguese', 'Russian', 'Mandarin',
] as const;

/**
 * Build a clean, human-readable description string from selected chips.
 * Used to populate the listing's `description` column so insight cards
 * still read naturally without the user typing prose.
 */
export function buildDescriptionFromChips(parts: (string | string[] | undefined | null)[]): string {
  const flat: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) flat.push(...p.filter(Boolean));
    else flat.push(p);
  }
  return flat.filter(Boolean).join(' · ');
}