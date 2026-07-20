// Legal service packages & contract types shown in the Swipess app's Legal
// Services section. Packages are normally loaded live from the shared
// `legal_service_packages` table (managed by lawyers in the Lawyer Portal).
// This file provides the category presentation metadata and a hardcoded
// fallback catalogue so the screen still works offline or before the table
// has been seeded.

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

// Fallback catalogue — mirrors the seeded `legal_service_packages` rows.
export const FALLBACK_PACKAGES: LegalPackage[] = [
  { id: 'seed-house-basic',    name: 'House Sale — Basic',        category: 'house_sale', price: 1500, duration_days: 30,  description: 'Essential legal support to sell your property safely.', features: ['Title search & review', 'Purchase agreement preparation', 'Closing document review', '1 attorney consultation (1 hr)'] },
  { id: 'seed-house-standard', name: 'House Sale — Standard',     category: 'house_sale', price: 2500, duration_days: 45,  description: 'Full-service support with negotiation and post-closing help.', features: ['Everything in Basic', 'Title insurance assistance', 'Negotiation support', 'Up to 3 consultations', 'Post-closing support (30 days)'] },
  { id: 'seed-house-premium',  name: 'House Sale — Premium',      category: 'house_sale', price: 4000, duration_days: 60,  description: 'End-to-end protection including tax and dispute coverage.', features: ['Everything in Standard', 'Unlimited consultations (90 days)', 'Tax implications review', 'HOA document review', 'Dispute resolution coverage'] },
  { id: 'seed-rental-basic',   name: 'Rental Agreement — Basic',  category: 'rental', price: 500,  duration_days: 7,   description: 'A solid, enforceable lease drafted for your property.', features: ['Lease agreement drafting', 'Basic tenant screening review', '1 revision included'] },
  { id: 'seed-rental-std',     name: 'Rental Agreement — Standard', category: 'rental', price: 900,  duration_days: 14,  description: 'Lease plus addendums, checklists and a consultation.', features: ['Everything in Basic', 'Move-in/out checklist', 'Addendum preparation', 'Up to 3 revisions', '30-min consultation'] },
  { id: 'seed-rental-full',    name: 'Rental Agreement — Full',   category: 'rental', price: 1600, duration_days: 21,  description: 'Multi-unit ready package with unlimited revisions.', features: ['Everything in Standard', 'Multi-unit lease package', 'Section 8 compliance review', 'Unlimited revisions (30 days)', '2 hr consultation'] },
  { id: 'seed-evict-basic',    name: 'Eviction — Basic',          category: 'eviction', price: 800,  duration_days: 45,  description: 'Notice, filing and a court hearing to recover your property.', features: ['Pay or Quit notice', 'Unlawful detainer filing', 'Court representation (1 hearing)'] },
  { id: 'seed-evict-full',     name: 'Eviction — Full',           category: 'eviction', price: 1800, duration_days: 90,  description: 'Full court representation through to recovery of judgment.', features: ['Everything in Basic', 'Full court representation', 'Writ of possession', 'Judgment recovery assistance', 'Up to 3 hearings'] },
  { id: 'seed-div-unc',        name: 'Divorce — Uncontested',     category: 'divorce', price: 1200, duration_days: 60,  description: 'Streamlined, amicable divorce with all documents prepared.', features: ['Divorce petition drafting', 'Marital settlement agreement', 'Property division documents', 'Court filing assistance'] },
  { id: 'seed-div-kids',       name: 'Divorce — With Children',   category: 'divorce', price: 3500, duration_days: 120, description: 'Custody, support and parenting plans handled end-to-end.', features: ['Divorce petition', 'Custody & visitation plan', 'Child support calculation', 'Parenting agreement', '3 court hearings'] },
  { id: 'seed-div-cont',       name: 'Divorce — Contested',       category: 'divorce', price: 5000, duration_days: 180, description: 'Full representation for complex, disputed divorces.', features: ['Full legal representation', 'Discovery assistance', 'Mediation support', 'Child custody filing', 'Asset valuation', '5 court appearances'] },
  { id: 'seed-nda',            name: 'NDA Drafting',              category: 'nda', price: 350,  duration_days: 3,   description: 'A custom non-disclosure agreement, mutual or one-way.', features: ['Custom NDA drafting', 'Mutual or one-way options', '1 revision included'] },
  { id: 'seed-biz',            name: 'Business Formation',        category: 'business', price: 1000, duration_days: 14,  description: 'Form your company the right way with full guidance.', features: ['Entity selection consultation', 'Articles of incorporation', 'Operating agreement', 'EIN registration guidance', '1-year registered agent'] },
  { id: 'seed-dispute',        name: 'Property Dispute',          category: 'dispute', price: 2000, duration_days: 90,  description: 'Resolve property conflicts through demand, mediation or court.', features: ['Case evaluation', 'Demand letter', 'Mediation representation', 'Litigation (up to 2 hearings)'] },
  { id: 'seed-estate-basic',   name: 'Estate Planning — Basic',   category: 'estate', price: 800,  duration_days: 14,  description: 'Core estate documents to protect your family.', features: ['Simple will drafting', 'Healthcare directive', 'Power of attorney', 'Notarization assistance'] },
  { id: 'seed-estate-full',    name: 'Estate Planning — Full',    category: 'estate', price: 2200, duration_days: 30,  description: 'Complete estate plan with living trust and annual review.', features: ['Everything in Basic', 'Living trust setup', 'Trust funding guidance', 'Beneficiary designation review', '1-year plan review'] },
];

export interface ContractType {
  id: string;
  title: string;
  category: string;
  description: string;
  fields: number;
}

// The contract document types the lawyers can prepare (from the Lawyer Portal
// template library). Shown so users can see "the different types of contracts".
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
