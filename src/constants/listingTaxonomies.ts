/**
 * Curated taxonomies for listing & profile fields.
 * Replaces freeform textareas — users select from preset chips only.
 */

import { SERVICE_CATEGORIES } from '@/data/serviceCategories';

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
  'AC', 'WiFi', 'Security 24/7', 'Security Cameras', 'Garden', 'Balcony', 'Terrace',
  'Rooftop', 'Elevator', 'Storage', 'Workspace', 'Office Space',
  '2-in-1 Washer/Dryer', 'Separate Washer & Dryer', 'Laundry Room', 'Washer',
  'Dishwasher', 'Gas Stove', 'Water Filter / Osmosis', 'Smart-home', 'Solar Panels', 'Backup water',
  'Sea View', 'Mountain View', 'Garden View', 'Outdoor Kitchen',
  'BBQ', 'Hot Tub', 'Sauna', 'Walk-in Closet', 'Fireplace', 'Mosquito Net', 'Sublease Option',
] as const;

export const PROPERTY_INCLUDED = [
  'Water', 'Electricity', 'Gas', 'Internet',
  'Cleaning', 'Maintenance', 'Trash', 'Cable TV',
] as const;

export const PROPERTY_RULES = [
  'No smoking', 'No parties', 'Quiet hours',
  'Pets allowed', 'Children welcome', 'Long-stay only',
] as const;

export const PROPERTY_TYPES = [
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'loft', label: 'Loft' },
  { value: 'studio', label: 'Studio' },
  { value: '2-bedroom apartment', label: '2-Bedroom Apartment' },
  { value: '4-bedroom apartment', label: '4-Bedroom Apartment' },
  { value: 'mobile_home', label: 'Mobile Home' },
  { value: 'camper', label: 'Camper / RV' },
  { value: 'land', label: 'Land' },
  { value: 'building', label: 'Building' },
  { value: 'glamping', label: 'Glamping' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'mezzanine', label: 'Mezzanine (Mesanini)' },
  { value: 'room', label: 'Room' },
  { value: 'commercial', label: 'Commercial' },
] as const;

export const RENTAL_DURATIONS = [
  { value: '3 months', label: '3 months' },
  { value: '6 months', label: '6 months' },
  { value: '1 year', label: '1 year' },
] as const;

export const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Mexico City', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero',
  'Hidalgo', 'Jalisco', 'Mexico State', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León',
  'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
] as const;

export const POPULAR_COUNTRIES = [
  'Mexico', 'United States', 'Canada', 'France', 'Russia', 'Spain', 'Italy',
  'United Kingdom', 'Germany', 'Argentina', 'Colombia', 'Venezuela',
] as const;

export const POPULAR_CITIES = [
  'Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Mérida', 'Querétaro',
  'New York City', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Las Vegas', 'Austin',
  'Toronto', 'Montreal', 'Vancouver', 'Calgary',
  'Paris', 'Marseille', 'Lyon', 'Nice',
  'Moscow', 'Saint Petersburg',
  'Madrid', 'Barcelona', 'Valencia', 'Seville',
  'Rome', 'Milan', 'Naples', 'Florence', 'Venice',
  'London', 'Manchester', 'Birmingham', 'Edinburgh',
  'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza',
  'Bogotá', 'Medellín', 'Cali', 'Cartagena',
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

export const MOTO_TRANSMISSION = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'semi-automatic', label: 'Semi-auto' },
] as const;

export const MOTO_FUEL = [
  { value: 'gasoline', label: 'Gasoline' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;

/** Maps MOTO_CONDITION chip labels → DB vehicle_condition slugs */
export const MOTO_CONDITION_DB: Record<string, string> = {
  'Brand new': 'excellent',
  'Like new': 'excellent',
  'Good': 'good',
  'Fair': 'fair',
  'Project': 'poor',
};

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

export const BIKE_FRAME_SIZE = [
  'XS', 'S', 'M', 'L', 'XL',
] as const;

export const BIKE_FRAME_MATERIAL = [
  'Aluminum', 'Carbon Fiber', 'Steel', 'Titanium', 'Chromoly',
] as const;

export const BIKE_WHEEL_SIZE = [
  '20"', '24"', '26"', '27.5"', '29"', '700c',
] as const;

export const BIKE_BRAKE_TYPE = [
  { value: 'hydraulic', label: 'Disc (Hydraulic)' },
  { value: 'disc', label: 'Disc (Mechanical)' },
  { value: 'rim', label: 'Rim Brakes' },
  { value: 'v-brake', label: 'V-Brake' },
] as const;

export const BIKE_SUSPENSION = [
  { value: 'none', label: 'Rigid' },
  { value: 'front', label: 'Front (Hardtail)' },
  { value: 'full', label: 'Full Suspension' },
  { value: 'rear', label: 'Rear Only' },
] as const;

export const BIKE_CONDITION_DB: Record<string, string> = {
  'Brand new': 'excellent',
  'Like new': 'excellent',
  'Good': 'good',
  'Fair': 'fair',
};

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
export const MOTORCYCLE_BRANDS = [
  'Yamaha', 'Honda', 'Kawasaki', 'Suzuki', 'BMW', 'Ducati', 'KTM', 'Harley-Davidson',
  'Triumph', 'Aprilia', 'Royal Enfield', 'Vespa', 'Piaggio', 'Zero', 'Indian',
] as const;

export const MOTORCYCLE_MODELS: Record<string, readonly string[]> = {
  Yamaha: ['MT-07', 'MT-09', 'MT-03', 'YZF-R3', 'YZF-R7', 'NMAX', 'XMAX', 'Ténéré 700', 'Tracer 9'],
  Honda: ['CBR600RR', 'CB500F', 'CB650R', 'Africa Twin', 'Rebel 500', 'PCX', 'Forza', 'Gold Wing'],
  Kawasaki: ['Ninja 400', 'Ninja 650', 'Z900', 'Versys 650', 'Vulcan S', 'KLX230'],
  Suzuki: ['GSX-R750', 'SV650', 'V-Strom 650', 'Hayabusa', 'Burgman 400'],
  BMW: ['R 1250 GS', 'F 900 R', 'S 1000 RR', 'G 310 R', 'C 400 GT'],
  Ducati: ['Monster', 'Panigale V2', 'Multistrada V4', 'Scrambler', 'Diavel'],
  KTM: ['390 Duke', '790 Duke', '1290 Super Adventure', 'RC 390'],
  'Harley-Davidson': ['Sportster', 'Street Glide', 'Fat Bob', 'Iron 883', 'Pan America'],
  Triumph: ['Street Triple', 'Tiger 900', 'Bonneville', 'Speed Triple', 'Rocket 3'],
  Aprilia: ['RSV4', 'Tuono V4', 'RS 660', 'Tuareg 660'],
  'Royal Enfield': ['Classic 350', 'Himalayan', 'Interceptor 650', 'Meteor 350'],
  Vespa: ['Primavera', 'GTS 300', 'Sprint', 'Elettrica'],
  Piaggio: ['Beverly 400', 'MP3 530', 'Liberty 150'],
  Zero: ['SR/F', 'SR/S', 'DSR/X', 'FXE'],
  Indian: ['Scout', 'Chief', 'Challenger', 'FTR'],
};

export const BICYCLE_BRANDS = [
  'Specialized', 'Trek', 'Giant', 'Cannondale', 'Santa Cruz', 'Canyon', 'Bianchi',
  'Scott', 'Merida', 'Electra', 'Rad Power', 'Aventon', 'Surly',
] as const;

export const BICYCLE_MODELS: Record<string, readonly string[]> = {
  Specialized: ['Turbo Levo', 'Stumpjumper', 'Roubaix', 'Sirrus', 'Turbo Vado'],
  Trek: ['Fuel EX', 'Domane', 'Marlin', 'FX', 'Powerfly'],
  Giant: ['Trance', 'Defy', 'Escape', 'Talon', 'FastRoad'],
  Cannondale: ['Synapse', 'Scalpel', 'Topstone', 'Quick', 'Habit'],
  'Santa Cruz': ['Hightower', 'Nomad', 'Bronson', 'Megatower'],
  Canyon: ['Grizl', 'Endurace', 'Spectral', 'Neuron'],
  Bianchi: ['Oltre', 'Infinito', 'Aria', 'Impulso'],
  Scott: ['Spark', 'Addict', 'Scale', 'Genius'],
  Merida: ['Big.Nine', 'Scultura', 'Silex', 'One-Twenty'],
  Electra: ['Townie', 'Cruiser Lux', 'Ponto Go'],
  'Rad Power': ['RadRunner', 'RadCity', 'RadRover', 'RadWagon'],
  Aventon: ['Pace', 'Level', 'Aventure', 'Sinch'],
  Surly: ['Cross-Check', 'Long Haul Trucker', 'Karate Monkey', 'Straggler'],
};

export function getModelsForBrand(
  brand: string | undefined,
  catalog: Record<string, readonly string[]>,
): readonly string[] {
  if (!brand?.trim()) return [];
  const key = Object.keys(catalog).find((k) => k.toLowerCase() === brand.trim().toLowerCase());
  return key ? catalog[key] : [];
}

export const CLIENT_BIO_PHRASES = [
  'Digital nomad', 'Remote worker', 'Long-term renter', 'Pet owner', 'Quiet & respectful',
  'Love the beach', 'Fitness enthusiast', 'Foodie', 'Family with kids', 'Student',
  'Looking for roommates', 'Eco-conscious', 'Bilingual', 'Flexible move-in',
] as const;

export const OCCUPATION_SUGGESTIONS = [
  'Software Engineer', 'Designer', 'Teacher', 'Nurse', 'Chef', 'Real Estate Agent',
  'Electrician', 'Plumber', 'Yoga Instructor', 'Photographer', 'Entrepreneur', 'Student',
  'Retired', 'Remote Consultant', 'Sales Manager',
] as const;

export function buildDescriptionFromChips(parts: (string | string[] | undefined | null)[]): string {
  const flat: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (Array.isArray(p)) flat.push(...p.filter(Boolean));
    else flat.push(p);
  }
  return flat.filter(Boolean).join(' · ');
}

export function buildPropertyDescription(opts: {
  adjectives?: string[];
  size?: string[];
  vibe?: string[];
  amenities?: string[];
  servicesIncluded?: string[];
  houseRules?: string[];
  city?: string;
  neighborhood?: string;
  beds?: number | null;
  baths?: number | null;
  furnished?: boolean;
  petFriendly?: boolean;
}): string {
  const bedLabel =
    opts.beds === 0 ? 'Studio' : opts.beds != null ? `${opts.beds} bed` : undefined;
  const bathLabel = opts.baths != null ? `${opts.baths} bath` : undefined;
  return buildDescriptionFromChips([
    opts.adjectives?.[0],
    opts.size?.[0],
    bedLabel,
    bathLabel,
    opts.vibe,
    opts.amenities,
    opts.servicesIncluded,
    opts.houseRules,
    opts.furnished ? 'Furnished' : undefined,
    opts.petFriendly ? 'Pet friendly' : undefined,
    opts.neighborhood ? `${opts.neighborhood}, ${opts.city}` : opts.city,
  ]);
}

export function buildMotoDescription(opts: {
  adjectives?: string[];
  motorcycleType?: string;
  condition?: string;
  transmission?: string;
  fuel?: string;
  features?: string[];
  included?: string[];
  mileage?: number;
  engineCc?: number;
  city?: string;
}): string {
  return buildDescriptionFromChips([
    opts.adjectives?.[0],
    opts.motorcycleType,
    opts.condition,
    opts.transmission,
    opts.fuel,
    opts.mileage ? `${opts.mileage.toLocaleString()} km` : undefined,
    opts.engineCc ? `${opts.engineCc}cc` : undefined,
    opts.features,
    opts.included,
    opts.city,
  ]);
}

export function buildBikeDescription(opts: {
  adjectives?: string[];
  bicycleType?: string;
  condition?: string;
  frameSize?: string;
  frameMaterial?: string;
  wheelSize?: string;
  electric?: boolean;
  batteryRange?: number;
  included?: string[];
  city?: string;
}): string {
  return buildDescriptionFromChips([
    opts.adjectives?.[0],
    opts.bicycleType,
    opts.condition,
    opts.frameSize ? `${opts.frameSize} frame` : undefined,
    opts.frameMaterial,
    opts.wheelSize ? `${opts.wheelSize} wheels` : undefined,
    opts.electric ? 'E-bike' : undefined,
    opts.batteryRange ? `${opts.batteryRange}km range` : undefined,
    opts.included,
    opts.city,
  ]);
}

export function getServiceCategoryLabel(value: string): string {
  return SERVICE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function buildWorkerTitle(opts: {
  serviceCategory?: string;
  customServiceName?: string;
  traits?: string[];
  experienceLevel?: string;
  city?: string;
}): string {
  const rawName = opts.customServiceName?.trim()
    || (opts.serviceCategory ? getServiceCategoryLabel(opts.serviceCategory) : '');
  if (!rawName) return '';

  const shortName = rawName.split('/')[0].trim();
  const expAdj: Record<string, string> = {
    beginner: 'Entry-level',
    intermediate: 'Experienced',
    expert: 'Senior',
    master: 'Expert',
  };
  const adj = opts.traits?.[0] || (opts.experienceLevel ? expAdj[opts.experienceLevel] : undefined);
  let title = adj ? `${adj} ${shortName}` : shortName;
  if (opts.city?.trim()) title = `${title} · ${opts.city.trim()}`;
  return title;
}

export function descriptionSnippet(description?: string | null, maxLen = 56): string | undefined {
  if (!description?.trim()) return undefined;
  const first = description.split('·')[0].trim();
  if (!first) return undefined;
  return first.length > maxLen ? `${first.slice(0, maxLen)}…` : first;
}

export function buildWorkerDescription(opts: {
  serviceCategory?: string;
  customServiceName?: string;
  title?: string;
  traits?: string[];
  workType?: string[];
  timeSlots?: string[];
  languages?: string[];
  experienceLevel?: string;
  price?: number | string;
  pricingUnit?: string;
  city?: string;
}): string {
  return buildDescriptionFromChips([
    opts.title,
    opts.customServiceName || (opts.serviceCategory ? getServiceCategoryLabel(opts.serviceCategory) : undefined),
    opts.experienceLevel,
    opts.price ? `$${opts.price}${opts.pricingUnit ? `/${opts.pricingUnit}` : ''}` : undefined,
    opts.workType,
    opts.timeSlots,
    opts.traits,
    opts.languages,
    opts.city,
  ]);
}

export function buildClientBioFromChips(opts: {
  phrases?: string[];
  interests?: string[];
  personality?: string[];
  intentions?: string[];
  occupation?: string;
  city?: string;
  customBio?: string;
}): string {
  if (opts.customBio?.trim()) return opts.customBio.trim();
  return buildDescriptionFromChips([
    opts.occupation,
    opts.phrases,
    opts.interests,
    opts.personality,
    opts.intentions,
    opts.city ? `Based in ${opts.city}` : undefined,
  ]);
}

export function buildOwnerBusinessDescription(opts: {
  businessName?: string;
  offerings?: string[];
  traits?: string[];
  location?: string;
  customDesc?: string;
}): string {
  if (opts.customDesc?.trim()) return opts.customDesc.trim();
  return buildDescriptionFromChips([
    opts.businessName,
    opts.offerings,
    opts.traits,
    opts.location,
  ]);
}

/** Auto-build a vehicle listing title from chips + specs. */
export function buildVehicleTitleFromChips(opts: {
  adjective?: string;
  type?: string;
  brand?: string;
  model?: string;
  year?: number | string | null;
  city?: string | null;
}): string {
  const parts: string[] = [];
  if (opts.year) parts.push(String(opts.year));
  if (opts.brand) parts.push(opts.brand);
  if (opts.model) parts.push(opts.model);
  if (!parts.length && opts.type) parts.push(opts.type);
  if (opts.adjective && parts.length) parts[0] = `${opts.adjective} ${parts[0]}`;
  else if (opts.adjective) parts.push(opts.adjective);
  let title = parts.filter(Boolean).join(' ').trim();
  if (opts.city) title = title ? `${title} · ${opts.city}` : opts.city;
  return title;
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