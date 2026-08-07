// Presentation metadata and request topics for the Legal Services section.
// Listed packages are loaded only from the live legal_service_packages table.

export type LegalPackageCategory =
  | 'house_sale'
  | 'rental'
  | 'eviction'
  | 'divorce'
  | 'nda'
  | 'business'
  | 'dispute'
  | 'estate';

export interface LegalPackage {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  duration_days: number | null;
  features: string[];
  is_active?: boolean;
}

export interface CategoryMeta {
  label: string;
  blurb: string;
  /** lucide-react icon name */
  icon: string;
  accent: string;   // tailwind text color
  accentBg: string; // tailwind solid bg
  ring: string;     // tailwind border/ring tint
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  house_sale: { label: 'Property Sale', blurb: 'Buying or selling real estate', icon: 'Building2', accent: 'text-indigo-400', accentBg: 'bg-indigo-500', ring: 'border-indigo-500/30' },
  rental:     { label: 'Rental Agreements', blurb: 'Leases & tenancy contracts', icon: 'Home', accent: 'text-blue-400', accentBg: 'bg-blue-500', ring: 'border-blue-500/30' },
  eviction:   { label: 'Eviction', blurb: 'Recover possession of property', icon: 'Gavel', accent: 'text-amber-400', accentBg: 'bg-amber-500', ring: 'border-amber-500/30' },
  divorce:    { label: 'Divorce & Family', blurb: 'Separation, custody & support', icon: 'HeartCrack', accent: 'text-rose-400', accentBg: 'bg-rose-500', ring: 'border-rose-500/30' },
  nda:        { label: 'NDA & Confidentiality', blurb: 'Protect sensitive information', icon: 'FileLock2', accent: 'text-slate-300', accentBg: 'bg-slate-500', ring: 'border-slate-500/30' },
  business:   { label: 'Business Formation', blurb: 'Start & structure a company', icon: 'Briefcase', accent: 'text-purple-400', accentBg: 'bg-purple-500', ring: 'border-purple-500/30' },
  dispute:    { label: 'Property Disputes', blurb: 'Resolve conflicts & claims', icon: 'Scale', accent: 'text-orange-400', accentBg: 'bg-orange-500', ring: 'border-orange-500/30' },
  estate:     { label: 'Estate Planning', blurb: 'Wills, trusts & directives', icon: 'Landmark', accent: 'text-emerald-400', accentBg: 'bg-emerald-500', ring: 'border-emerald-500/30' },
};

export const CATEGORY_ORDER: string[] = [
  'house_sale', 'rental', 'eviction', 'divorce', 'dispute', 'business', 'estate', 'nda',
];

export function categoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? {
    label: category.replace(/_/g, ' '),
    blurb: 'Legal service',
    icon: 'Scale',
    accent: 'text-indigo-400',
    accentBg: 'bg-indigo-500',
    ring: 'border-indigo-500/30',
  };
}

export interface ContractType {
  id: string;
  title: string;
  category: string;
  description: string;
  fields: number;
}

// Document request topics shown in the Legal Services interface. Availability,
// jurisdiction, scope, and price must be confirmed by an independent provider.
export const CONTRACT_TYPES: ContractType[] = [
  { id: 'residential-lease', title: 'Residential Lease Agreement', category: 'rental', description: 'Standard lease for renting a home, with rent, deposit, term and house rules.', fields: 17 },
  { id: 'purchase-agreement', title: 'Property Purchase Agreement', category: 'house_sale', description: 'Buy or sell real estate — price, earnest money, contingencies and closing.', fields: 20 },
  { id: 'eviction-notice', title: 'Eviction Notice — Pay or Quit', category: 'eviction', description: 'Formal notice to a tenant to pay overdue rent or vacate the premises.', fields: 10 },
  { id: 'nda', title: 'Non-Disclosure Agreement', category: 'nda', description: 'Protect confidential information shared between two parties, mutual or one-way.', fields: 9 },
  { id: 'marital-settlement', title: 'Marital Settlement Agreement', category: 'divorce', description: 'Divide property, debts, custody and support in a divorce settlement.', fields: 19 },
  { id: 'commercial-lease', title: 'Commercial Lease Agreement', category: 'rental', description: 'Lease commercial space — base rent, escalation, permitted use and renewal.', fields: 20 },
];

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('en-US')} USD`;
}

export function formatDuration(days: number | null | undefined): string {
  if (!days) return 'Flexible timeline';
  if (days % 30 === 0 && days >= 30) {
    const months = days / 30;
    return `${months} month${months > 1 ? 's' : ''}`;
  }
  if (days % 7 === 0 && days >= 7) {
    const weeks = days / 7;
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  }
  return `${days} day${days > 1 ? 's' : ''}`;
}
