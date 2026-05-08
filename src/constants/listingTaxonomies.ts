/**
 * Curated taxonomies for listing & profile fields.
 * Replaces freeform textareas — users select from preset chips only.
 */

/** Positive adjectives — first chip group for any listing/profile description. */
export const PROPERTY_ADJECTIVES = [
  'Amazing', 'Beautiful', 'Gorgeous', 'Pretty', 'Nice', 'Cool',
  'Incredible', 'Wonderful', 'Cute', 'Charming', 'Cozy', 'Stylish',
  'Modern', 'Bright', 'Sunny', 'Stunning', 'Elegant', 'Luxurious',
  'Exuberant', 'Peaceful',
] as const;

/** Size descriptors. */
export const PROPERTY_SIZE = [
  'Tiny', 'Small', 'Medium', 'Spacious', 'Large', 'Big', 'Huge',
  'Enormous', 'Giant',
] as const;

/** Bedroom counts as taps (better than number inputs on mobile). */
export const BEDROOM_COUNTS = ['Studio', '1', '2', '3', '4', '5', '6+'] as const;
export const BATHROOM_COUNTS = ['1', '1.5', '2', '2.5', '3', '3.5', '4+'] as const;

export const PROPERTY_VIBE = [
  'Quiet', 'Lively', 'Family-friendly', 'Pet-friendly',
  'Beachfront', 'Jungle', 'Downtown', 'Gated', 'Eco',
] as const;

export const PROPERTY_FEATURES = [
  'Private Pool', 'Shared Pool', 'Gym', 'Parking', 'Garage', 'Carport',
  'AC', 'WiFi', 'Security 24/7', 'Garden', 'Balcony', 'Terrace',
  'Rooftop', 'Elevator', 'Storage', 'Workspace', 'Office Nook',
  '2-in-1 Washer/Dryer', 'Separate Washer & Dryer', 'Laundry Room',
  'Dishwasher', 'Smart-home', 'Solar', 'Backup water',
  'Sea View', 'Mountain View', 'Garden View', 'Outdoor Kitchen',
  'BBQ', 'Hot Tub', 'Sauna', 'Walk-in Closet', 'Fireplace',
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

/** Auto-build a listing title from selected chips when the user hasn't typed one. */
export function buildTitleFromChips(opts: {
  adjective?: string;
  size?: string;
  beds?: string | number | null;
  propertyType?: string | null;
  city?: string | null;
}): string {
  const parts: string[] = [];
  if (opts.adjective) parts.push(opts.adjective);
  if (opts.size) parts.push(opts.size);
  if (opts.beds && opts.beds !== 'Studio') parts.push(`${opts.beds}BR`);
  else if (opts.beds === 'Studio') parts.push('Studio');
  if (opts.propertyType) parts.push(opts.propertyType.charAt(0).toUpperCase() + opts.propertyType.slice(1));
  let title = parts.filter(Boolean).join(' ').trim();
  if (opts.city) title = title ? `${title} in ${opts.city}` : opts.city;
  return title;
}

/**
 * Convert a stored joined string back to an array of chip values.
 * The DB stores chip groups as `'A · B · C'`; the form needs `['A','B','C']`.
 */
export function chipsFromString(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[];
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.split(/\s*·\s*|,\s*/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}