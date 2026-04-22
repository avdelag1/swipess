import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ListingFilters } from '@/hooks/useSmartMatching';
import { logger } from '@/utils/prodLogger';
import {
  Radio,
  Sparkles,
  ShieldCheck,
  Users,
  ShoppingBag,
  Key,
  Scale,
  Megaphone
} from 'lucide-react';

// Category configuration for dynamic empty states
export const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; plural: string; color: string }> = {
  property: { icon: RealEstateIcon, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: VespaIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: VespaIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: BeachBicycleIcon, label: 'Bicycle', plural: 'Bicycles', color: 'text-rose-500' },
  services: { icon: WorkersIcon, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: WorkersIcon, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
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
  icon?: any;
}

// ─── Photo Registry ──────────────────────────────────────────────────────────
// High-fidelity lifestyle photos that represent the Swipess demographic.
// These are chosen to be premium, diverse, and human-centric.

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
  vap:        'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
  lawyer:     'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  promote:    'linear-gradient(135deg, #4a1942 0%, #2d1b69 100%)',
  'ai-listing': 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
};

export const POKER_CARDS = [
  { id: 'property'   as const, label: 'Properties',  description: 'Houses & apts',       accent: '#3b82f6', accentRgb: '59,130,246', icon: RealEstateIcon  },
  { id: 'motorcycle' as const, label: 'Motorcycles', description: 'Bikes & scooters',     accent: '#f97316', accentRgb: '249,115,22', icon: VespaIcon  },
  { id: 'bicycle'    as const, label: 'Bicycles',    description: 'City & mountain',      accent: '#f43f5e', accentRgb: '244,63,94', icon: BeachBicycleIcon   },
  { id: 'services'   as const, label: 'Workers',     description: 'Skilled freelancers',  accent: '#a855f7', accentRgb: '168,85,247', icon: WorkersIcon  },
  { id: 'radio'      as const, label: 'Radio',       description: 'Sentient Beats',       accent: '#f43f5e', accentRgb: '244,63,94',  icon: Radio },
  { id: 'all'        as const, label: 'All',         description: 'Browse everything',    accent: '#06b6d4', accentRgb: '6,182,212', icon: Sparkles   },
  { id: 'vap'        as const, label: 'Resident Card', description: 'Local Discounts',    accent: '#10b981', accentRgb: '16,185,129', icon: ShieldCheck },
];

// Zenith Spec: Professional-grade card dimensions for flagship smartphones
export const PK_W = 380;
export const PK_H = 560;
export const OWNER_PK_H = 580;
// Intrinsic aspect ratio so the stack can size fluidly via CSS without losing proportions.
export const PK_ASPECT = PK_W / PK_H; // ≈ 0.6538

export const FOLDER_OFFSET_X = 30;
export const FOLDER_OFFSET_Y = 0;
export const POKER_FAN_ROTATION = 8; // degrees per card in the fan
// Softer thresholds + spring for a comfortable, iOS-style swipe feel.
export const PK_DIST_THRESHOLD = 80;
export const PK_VEL_THRESHOLD  = 260;
export const PK_SPRING = { type: 'spring' as const, stiffness: 260, damping: 22, mass: 0.9 };

// ─── Photo Registry ──────────────────────────────────────────────────────────
// Primary: Curated high-fidelity lifestyle photos that represent the Swipess demographic.
// These are chosen to be premium, diverse, and human-centric (Tulum/European/American).
// UPDATED: Standardizing on Flagship Human-Centric Aesthetic.
export const POKER_CARD_PHOTOS: Record<string, string> = {
  property:   '/images/filters/property.png',
  motorcycle: '/images/filters/scooter.png',
  bicycle:    '/images/filters/bicycle.png',
  services:   '/images/filters/workers.png',
  all:        '/images/filters/all.png',
  radio:      '/images/filters/radio.png',
  vap:        '/images/filters/resident_card.png',
  
  // Owner intent cards
  buyers:        '/images/filters/owner_buyers_card.png',
  renters:       '/images/filters/owner_renters_card.png',
  hire:          '/images/filters/owner_hire_card.png',
  'all-clients': '/images/filters/all.png',
  lawyer:        '/images/filters/owner_lawyer_card.png',
  promote:       '/images/filters/owner_promote_card.png',
  'ai-listing':  '/images/filters/ai_listing_card.png',
};

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
    accent: '#a855f7',
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
];


