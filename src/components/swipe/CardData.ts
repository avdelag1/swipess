
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
  Zap,
  Anchor
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
  // Yachts
  { id: 'yacht', label: 'Yachts', description: 'Yachts for charter and sale', accent: '#14b8a6', accentRgb: '20,184,166', icon: Anchor, dataType: 'listing' },
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
    '/images/filters/property.jpg',
    '/images/filters/property_jungle_villa.jpg',
    '/images/filters/property_bamboo_dome.jpg',
    '/images/filters/property_loft_interior.jpg',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=90',
  ],
  motorcycle: [
    '/images/filters/scooter.jpg',
    '/images/filters/motorcycle_beach_1780637314808.png',
    '/images/filters/motorcycle_jungle_1780637303289.png',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=90',
  ],
  moto: [
    '/images/filters/scooter.jpg',
    '/images/filters/motorcycle_beach_1780637314808.png',
    '/images/filters/motorcycle_jungle_1780637303289.png',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=90',
  ],
  bicycle: [
    '/images/filters/electric_bicycle_new.png',
    '/images/filters/bicycle_coco_sunset.jpg',
    '/images/filters/bicycle_beach_ride.jpg',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=90',
  ],
  yacht: [
    '/images/filters/yacht_luxury_sunset.png',
    '/images/filters/yacht_marina_aerial.png',
    '/images/filters/yacht_ocean_cruise.png',
  ],
  services: [
    '/images/filters/workers_dog_sitting.png',
    '/images/filters/workers_massage_therapy.png',
    '/images/filters/workers_tulum_directory.jpg',
  ],
  worker: [
    '/images/filters/workers_dog_sitting.png',
    '/images/filters/workers_massage_therapy.png',
    '/images/filters/workers_tulum_directory.jpg',
  ],
  radio: [
    '/images/filters/radio.jpg',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=90',
  ],
  buyers: [
    '/images/filters/buyers_property_new.png',
    '/images/filters/buyers_motorcycle_new.png',
    '/images/filters/buyers_bicycle_new.png',
  ],
  renters: [
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=90',
    '/images/filters/renters_keys_1780637395685.png',
  ],
  roommates: [
    '/images/filters/roommates_1_1781629882697.png',
    '/images/filters/roommates_2_1781629891721.png',
    '/images/filters/roommates_3_1781629901014.png',
  ],
  leads: [
    '/images/filters/leads_handshake_1780637383311.png',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&q=90',
  ],
  seekers: [
    '/images/filters/seekers_1_1781629913233.png',
    '/images/filters/seekers_2_1781629923310.png',
    '/images/filters/seekers_3_1781629933812.png',
  ],
  events: [
    '/images/filters/events_card.jpg',
    '/images/filters/event_beach_party_1780637338591.png',
    '/images/filters/event_cacao_ceremony_1780637326772.png',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=90',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=90',
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
    '/images/filters/workers_dog_sitting.png',
    '/images/filters/workers_massage_therapy.png',
  ],
  premium: [
    '/images/filters/premium_starter.png',
    '/images/filters/premium_popular.png',
    '/images/filters/premium_elite.png',
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
  seekers: NEUTRAL_FALLBACK,
  premium: NEUTRAL_FALLBACK,
  yacht: NEUTRAL_FALLBACK,
};
