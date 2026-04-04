import { Home, Bike, Briefcase } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { logger } from '@/utils/prodLogger';

// Category configuration for dynamic empty states
export const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; plural: string; color: string }> = {
  property: { icon: Home, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: MotorcycleIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: Bike, label: 'Bicycle', plural: 'Bicycles', color: 'text-rose-500' },
  services: { icon: Briefcase, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: Briefcase, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
};

/**
 * Helper to get the active category display info from filters.
 */
export const getActiveCategoryInfo = (filters?: ListingFilters, storeCategory?: string | null) => {
  try {
    if (storeCategory && typeof storeCategory === 'string' && categoryConfig[storeCategory]) {
      return categoryConfig[storeCategory];
    }
    if (!filters) return categoryConfig.property;

    const activeUiCategory = (filters as any).activeUiCategory;
    if (activeUiCategory && typeof activeUiCategory === 'string' && categoryConfig[activeUiCategory]) {
      return categoryConfig[activeUiCategory];
    }

    const activeCategory = (filters as any).activeCategory;
    if (activeCategory && typeof activeCategory === 'string' && categoryConfig[activeCategory]) {
      return categoryConfig[activeCategory];
    }

    const categories = filters?.categories;
    if (Array.isArray(categories) && categories.length > 0) {
      const cat = categories[0] as any;
      if (typeof cat === 'string') {
        if (categoryConfig[cat]) return categoryConfig[cat];
        if (cat === 'worker' && categoryConfig['services']) return categoryConfig['services'];
        const normalized = cat.toLowerCase().replace(/s$/, '');
        if (categoryConfig[normalized]) return categoryConfig[normalized];
        if (cat === 'services' && categoryConfig['worker']) return categoryConfig['worker'];
        if ((cat === 'moto' || cat === 'motorcycle')) return categoryConfig['motorcycle'];
      }
    }

    const category = filters?.category;
    if (category && typeof category === 'string' && categoryConfig[category]) {
      return categoryConfig[category];
    }

    return categoryConfig.property;
  } catch (error) {
    logger.error('[SwipeConstants] Error in getActiveCategoryInfo:', error);
    return categoryConfig.property;
  }
};

// Generic poker card data shape — used by both POKER_CARDS and OWNER_INTENT_CARDS
export interface PokerCardData {
  id: string;
  label: string;
  description: string;
  accent: string;
  accentRgb: string;
}

// ─── Photo Registry ──────────────────────────────────────────────────────────
// Primary: Curated high-fidelity lifestyle photos that represent the Swipess demographic.
// These are chosen to be premium, diverse, and human-centric (Tulum/European/American).
export const POKER_CARD_PHOTOS: Record<string, string> = {
  property:   'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800&auto=format&fit=crop&v=1.5',
  motorcycle: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop&v=1.5',
  bicycle:    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=800&auto=format&fit=crop&v=1.5',
  services:   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop&v=1.5',
  all:        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop&v=1.5',
  
  // Owner intent cards - REFINED HUMAN-CENTRIC UX
  buyers:     'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop&v=1.5',
  renters:    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop&v=1.5',
  hire:       'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop&v=1.5',
  radio:      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop&v=1.5',
};

// Gradient fallbacks shown when an image fails to load (no broken/black cards).
export const POKER_CARD_GRADIENTS: Record<string, string> = {
  property:   'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
  motorcycle: 'linear-gradient(135deg, #3d1f00 0%, #1a0d00 100%)',
  bicycle:    'linear-gradient(135deg, #1a0030 0%, #0d0018 100%)',
  services:   'linear-gradient(135deg, #0d2600 0%, #061500 100%)',
  all:        'linear-gradient(135deg, #00203f 0%, #001526 100%)',
  // Owner intent cards — distinct gradients per intent
  buyers:     'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
  renters:    'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
  hire:       'linear-gradient(135deg, #3b0764 0%, #1e0636 100%)',
  radio:      'linear-gradient(135deg, #4d0000 0%, #1a0000 100%)',
};

export const POKER_CARDS = [
  { id: 'property'   as const, label: 'Properties',  description: 'Houses & apts',       accent: '#3b82f6', accentRgb: '59,130,246'  },
  { id: 'motorcycle' as const, label: 'Motorcycles', description: 'Bikes & scooters',     accent: '#f97316', accentRgb: '249,115,22'  },
  { id: 'bicycle'    as const, label: 'Bicycles',    description: 'City & mountain',      accent: '#f43f5e', accentRgb: '244,63,94'   },
  { id: 'services'   as const, label: 'Workers',     description: 'Skilled freelancers',  accent: '#a855f7', accentRgb: '168,85,247'  },
  { id: 'radio'      as const, label: 'Radio',       description: 'Tulum Beats & DJ Mixes', accent: '#fb7185', accentRgb: '251,113,133' },
  { id: 'all'        as const, label: 'All',         description: 'Browse everything',    accent: '#06b6d4', accentRgb: '6,182,212'   },
];

// Zenith Spec: Professional-grade card dimensions for flagship smartphones
export const PK_W = 310;
export const PK_H = 520;
export const OWNER_PK_H = 520;

export const FOLDER_OFFSET_X = 30;
export const FOLDER_OFFSET_Y = 0;
export const POKER_FAN_ROTATION = 8; // degrees per card in the fan
export const PK_DIST_THRESHOLD = 110;
export const PK_VEL_THRESHOLD  = 480;
export const PK_SPRING = { type: 'spring' as const, stiffness: 520, damping: 34, mass: 0.9 };

// ─── Owner quick-filter intent cards ────────────────────────────────────────
// These replace the category poker cards on the owner side so owners can
// instantly surface clients by their intent (buy / rent / hire / all).
export interface OwnerIntentCard extends PokerCardData {
  clientType?: string;   // maps to filterStore.clientType
  category?: string;     // maps to filterStore.activeCategory
  listingType?: string;  // maps to filterStore.listingType
}

export const OWNER_INTENT_CARDS: OwnerIntentCard[] = [
  {
    id: 'buyers',
    label: 'Buyers',
    description: 'Ready to purchase',
    accent: '#3b82f6',
    accentRgb: '59,130,246',
    clientType: 'buy',
    category: 'property',
    listingType: 'sale',
  },
  {
    id: 'renters',
    label: 'Renters',
    description: 'Looking to rent',
    accent: '#10b981',
    accentRgb: '16,185,129',
    clientType: 'rent',
    category: 'property',
    listingType: 'rent',
  },
  {
    id: 'hire',
    label: 'Need a Hand',
    description: 'Seeking workers',
    accent: '#a855f7',
    accentRgb: '168,85,247',
    clientType: 'hire',
    category: 'services',
  },
  {
    id: 'property',
    label: 'Properties',
    description: 'Houses & apartments',
    accent: '#f97316',
    accentRgb: '249,115,22',
    category: 'property',
  },
];
