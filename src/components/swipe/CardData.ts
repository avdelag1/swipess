import { 
  RealEstateIcon 
} from '@/components/icons/RealEstateIcon';
import { 
  VespaIcon 
} from '@/components/icons/VespaIcon';
import { 
  BeachBicycleIcon 
} from '@/components/icons/BeachBicycleIcon';
import { 
  WorkersIcon 
} from '@/components/icons/WorkersIcon';
import { 
  Sparkles, 
  Radio, 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  Key, 
  Scale, 
  Megaphone 
} from 'lucide-react';

export interface PokerCardData {
  id: string;
  label: string;
  description: string;
  accent: string;
  accentRgb: string;
  icon: any;
}

export interface OwnerIntentCard extends PokerCardData {
  clientType?: string;
  category?: string;
  listingType?: string;
}

export const POKER_CARDS: PokerCardData[] = [
  { id: 'property', label: 'Properties',  description: 'Houses & apts',       accent: '#3b82f6', accentRgb: '59,130,246', icon: RealEstateIcon  },
  { id: 'motorcycle', label: 'Motorcycles', description: 'Bikes & scooters',     accent: '#f97316', accentRgb: '249,115,22', icon: VespaIcon  },
  { id: 'bicycle',    label: 'Bicycles',    description: 'City & mountain',      accent: '#f43f5e', accentRgb: '244,63,94', icon: BeachBicycleIcon   },
  { id: 'services',   label: 'Workers',     description: 'Skilled freelancers',  accent: '#EB4898', accentRgb: '235,72,152', icon: WorkersIcon  },
  { id: 'radio',      label: 'Radio',       description: 'Swipess Beats',       accent: '#f43f5e', accentRgb: '244,63,94',  icon: Radio },
  { id: 'all',        label: 'All',         description: 'Browse everything',    accent: '#06b6d4', accentRgb: '6,182,212', icon: Sparkles   },
  { id: 'vap',        label: 'Resident Card', description: 'Local Discounts',    accent: '#10b981', accentRgb: '168,85,247', icon: ShieldCheck },
];

export const OWNER_INTENT_CARDS: OwnerIntentCard[] = [
  {
    id: 'all-clients',
    label: 'All Clients',
    description: 'Everyone Seeking',
    accent: '#06b6d4',
    accentRgb: '6,182,212',
    clientType: 'all',
    icon: Users,
  },
  {
    id: 'buyers',
    label: 'Buyers',
    description: 'Purchase Ready',
    accent: '#3b82f6',
    accentRgb: '59,130,246',
    clientType: 'buy',
    icon: ShoppingBag,
  },
  {
    id: 'renters',
    label: 'Renters',
    description: 'Looking to Move',
    accent: '#10b981',
    accentRgb: '16,185,129',
    clientType: 'rent',
    icon: Key,
  },
  {
    id: 'hire',
    label: 'Services',
    description: 'Worker Seeking',
    accent: '#EB4898',
    accentRgb: '168,85,247',
    clientType: 'hire',
    icon: WorkersIcon,
  },
  {
    id: 'lawyer',
    label: 'Legal Hub',
    description: 'Contracts & Docs',
    accent: '#6366f1',
    accentRgb: '99,102,241',
    icon: Scale,
  },
  {
    id: 'ai-listing',
    label: 'AI Wizard',
    description: 'Auto-Generate Listing',
    accent: '#818cf8',
    accentRgb: '129,140,248',
    icon: Sparkles,
  },
  {
    id: 'promote',
    label: 'Promote',
    description: 'Advertise Events',
    accent: '#ec4899',
    accentRgb: '236,72,153',
    icon: Megaphone,
  },
  {
    id: 'radio',
    label: 'Radio',
    description: 'Swipess Beats',
    accent: '#f43f5e',
    accentRgb: '244,63,94',
    icon: Radio,
  },
];

export const POKER_CARD_PHOTOS: Record<string, string> = {
  property: '/images/filters/property.jpg',
  motorcycle: '/images/filters/scooter.jpg',
  moto: '/images/filters/scooter.jpg',
  bicycle: '/images/filters/bicycle.jpg',
  services: '/images/filters/workers.jpg',
  worker: '/images/filters/workers.jpg',
  radio: '/images/filters/radio.jpg',
  all: '/images/filters/all.jpg',
  vap: '/images/filters/resident_card.jpg',
  'all-clients': '/images/filters/owner_all_clients_tulum.png',
  buyers: '/images/filters/owner_buyers_card.jpg',
  renters: '/images/filters/owner_renters_card.jpg',
  hire: '/images/filters/owner_hire_card.jpg',
  lawyer: '/images/filters/owner_lawyer_card.jpg',
  'ai-listing': '/images/filters/ai_listing_card.jpg',
  promote: '/images/filters/owner_promote_card.jpg',
};

// Neutral dark fallback only — no colored tint, so images never look
// "blocked" by a red/blue/green wash while they fade in.
const NEUTRAL_FALLBACK = 'linear-gradient(135deg, #111111 0%, #050505 100%)';
export const POKER_CARD_GRADIENTS: Record<string, string> = {
  property: NEUTRAL_FALLBACK,
  motorcycle: NEUTRAL_FALLBACK,
  moto: NEUTRAL_FALLBACK,
  bicycle: NEUTRAL_FALLBACK,
  services: NEUTRAL_FALLBACK,
  worker: NEUTRAL_FALLBACK,
  radio: NEUTRAL_FALLBACK,
  all: NEUTRAL_FALLBACK,
  vap: NEUTRAL_FALLBACK,
  'all-clients': NEUTRAL_FALLBACK,
  buyers: NEUTRAL_FALLBACK,
  renters: NEUTRAL_FALLBACK,
  hire: NEUTRAL_FALLBACK,
  lawyer: NEUTRAL_FALLBACK,
  'ai-listing': NEUTRAL_FALLBACK,
  promote: NEUTRAL_FALLBACK,
};
