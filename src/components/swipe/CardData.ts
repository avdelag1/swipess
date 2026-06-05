
import { 
  WorkersIcon 
} from '@/components/icons/WorkersIcon';
import { 
  Crown, 
  Flame, 
  Key, 
  Megaphone, 
  Moon, 
  PartyPopper,
  Radio,
  Scale,
  ShoppingBag,
  Sparkles,
  Users,
  Zap
} from 'lucide-react';

export interface PokerCardData {
  id: string;
  label: string;
  description: string;
  accent: string;
  accentRgb: string;
  icon: any;
  dataType?: 'listing' | 'people' | 'events';
}

export interface OwnerIntentCard extends PokerCardData {
  clientType?: string;
  category?: string;
  listingType?: string;
}

export const POKER_CARDS: PokerCardData[] = [
  { id: 'property',   label: 'Real Estate',  description: 'Properties for rent and sale', accent: '#f97316', accentRgb: '249,115,22', icon: Crown  },
  { id: 'services',   label: 'Find Workers', description: 'Find your best skillful person',  accent: '#0ea5e9', accentRgb: '14,165,233', icon: Sparkles  },
  { id: 'motorcycle', label: 'Motorcycles',  description: 'Motorcycles for rent and sale',   accent: '#f59e0b', accentRgb: '245,158,11', icon: Flame  },
  { id: 'bicycle',    label: 'Bicycles',     description: 'Bicycles for rent and sale',     accent: '#8b5cf6', accentRgb: '139,92,246', icon: Zap   },
  { id: 'radio',      label: 'Radio',        description: 'Swipess Beats',            accent: '#f43f5e', accentRgb: '244,63,94',  icon: Radio   },
  { id: 'clients',    label: 'Find Clients', description: 'Reach more clients',       accent: '#10b981', accentRgb: '16,185,129', icon: Moon },
];

export const OWNER_INTENT_CARDS: OwnerIntentCard[] = [
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

export const UNIFIED_CARDS: PokerCardData[] = [
  // Properties
  { id: 'property', label: 'Properties', description: 'Properties for rent and sale', accent: '#f97316', accentRgb: '249,115,22', icon: Crown, dataType: 'listing' },
  // Pros
  { id: 'pros', label: 'Pros', description: 'Find professional services', accent: '#0ea5e9', accentRgb: '14,165,233', icon: Sparkles, dataType: 'listing' },
  // Motorcycles
  { id: 'motorcycle', label: 'Motorcycles', description: 'Motorcycles for rent and sale', accent: '#f59e0b', accentRgb: '245,158,11', icon: Flame, dataType: 'listing' },
  // Bicycles
  { id: 'bicycle', label: 'Bicycles', description: 'Bicycles for rent and sale', accent: '#8b5cf6', accentRgb: '139,92,246', icon: Zap, dataType: 'listing' },
  // Events
  { id: 'events', label: 'Events', description: 'Discover local events', accent: '#ec4899', accentRgb: '236,72,153', icon: PartyPopper, dataType: 'events' },
  // Buyers
  { id: 'buyers', label: 'Buyers', description: 'Purchase Ready', accent: '#3b82f6', accentRgb: '59,130,246', icon: ShoppingBag, dataType: 'people' },
  // Renters
  { id: 'renters', label: 'Renters', description: 'Looking to Move', accent: '#10b981', accentRgb: '16,185,129', icon: Key, dataType: 'people' },
  // Leads
  { id: 'leads', label: 'Leads', description: 'People seeking your service', accent: '#EB4898', accentRgb: '168,85,247', icon: Users, dataType: 'people' },
];

export const POKER_CARD_PHOTOS: Record<string, string[]> = {
  property: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80'
  ],
  motorcycle: [
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80'
  ],
  moto: [
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80'
  ],
  bicycle: [
    'https://images.unsplash.com/photo-1484156818044-c040038b0719?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80'
  ],
  services: [
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80'
  ],
  worker: [
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80'
  ],
  radio: [
    'https://images.unsplash.com/photo-1516280440502-86927a38755b?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80'
  ],
  buyers: [
    'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80'
  ],
  renters: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1c2b1aff8d?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80'
  ],
  leads: [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&q=80'
  ],
  events: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80'
  ],
  all: ['/images/filters/all.jpg', '/images/filters/all.png', '/images/filters/all.jpg'],
  vap: ['/images/filters/resident_card.jpg', '/images/filters/resident_card.png', '/images/filters/resident_card.jpg'],
  'all-clients': ['/images/filters/owner_all_clients_tulum.png', '/images/filters/owner_all_clients.jpg', '/images/filters/owner_all_clients.png'],
  clients: ['/images/filters/owner_all_clients_tulum.png', '/images/filters/owner_all_clients.jpg', '/images/filters/owner_all_clients.png'],
  hire: ['/images/filters/owner_hire_card.jpg', '/images/filters/workers_tulum_team.jpg', '/images/filters/owner_hire_card.png'],
  lawyer: ['/images/filters/owner_lawyer_card.jpg', '/images/filters/lawyer_meeting_1780637372719.png', '/images/filters/owner_lawyer_card.png'],
  'ai-listing': ['/images/filters/ai_listing_card.jpg', '/images/filters/ai_listing_card.png', '/images/filters/ai_listing_card.jpg'],
  promote: ['/images/filters/owner_promote_card.jpg', '/images/filters/promote_dj_set_1780637360943.png', '/images/filters/owner_promote_card.png'],
  pros: [
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80'
  ],
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
  clients: NEUTRAL_FALLBACK,
  buyers: NEUTRAL_FALLBACK,
  renters: NEUTRAL_FALLBACK,
  hire: NEUTRAL_FALLBACK,
  lawyer: NEUTRAL_FALLBACK,
  'ai-listing': NEUTRAL_FALLBACK,
  promote: NEUTRAL_FALLBACK,
  events: NEUTRAL_FALLBACK,
  leads: NEUTRAL_FALLBACK,
  pros: NEUTRAL_FALLBACK,
};
