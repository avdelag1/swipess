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

export const POKER_CARD_GRADIENTS: Record<string, string> = {
  property: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
  motorcycle: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  moto: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  bicycle: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
  services: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',
  worker: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',
  radio: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
  all: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  vap: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'all-clients': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  buyers: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
  renters: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  hire: 'linear-gradient(135deg, #FF4D00 0%, #EB4898 100%)',
  lawyer: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  'ai-listing': 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  promote: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
};
