import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';

import { ListingFilters } from '@/hooks/useSmartMatching';
import { logger } from '@/utils/prodLogger';
import {
  Key,
  PartyPopper,
  ShoppingBag,
  Sparkles,
  Users
} from 'lucide-react';

// Category configuration for dynamic empty states
export const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; plural: string; color: string }> = {
  property: { icon: RealEstateIcon, label: 'Property', plural: 'Properties', color: 'text-primary' },
  moto: { icon: VespaIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  motorcycle: { icon: VespaIcon, label: 'Motorcycle', plural: 'Motorcycles', color: 'text-slate-500' },
  bicycle: { icon: BeachBicycleIcon, label: 'Bicycle', plural: 'Bicycles', color: 'text-rose-500' },
  services: { icon: WorkersIcon, label: 'Service', plural: 'Services', color: 'text-purple-500' },
  worker: { icon: WorkersIcon, label: 'Worker', plural: 'Workers', color: 'text-purple-500' },
  pros: { icon: Sparkles, label: 'Pro', plural: 'Pros', color: 'text-sky-500' },
  events: { icon: PartyPopper, label: 'Event', plural: 'Events', color: 'text-pink-500' },
  buyers: { icon: ShoppingBag, label: 'Buyer', plural: 'Buyers', color: 'text-blue-500' },
  renters: { icon: Key, label: 'Renter', plural: 'Renters', color: 'text-indigo-500' },
  leads: { icon: Users, label: 'Lead', plural: 'Leads', color: 'text-purple-500' },
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

export {
  type PokerCardData,
  type OwnerIntentCard,
  UNIFIED_CARDS,
  POKER_CARDS,
  OWNER_INTENT_CARDS,
  POKER_CARD_PHOTOS,
  POKER_CARD_GRADIENTS
} from './CardData';

export const PK_W = 520;
export const PK_H = 780;
export const PK_ASPECT = 0.66667; // 520 / 780

export const FOLDER_OFFSET_X = 30;
export const FOLDER_OFFSET_Y = 0;
export const POKER_FAN_ROTATION = 8;
// 🪶 Lightweight drag — easier commit, native-feeling flick
export const PK_DIST_THRESHOLD = 30;
export const PK_VEL_THRESHOLD = 80;
// Snappier spring — quick-filter cards glide instead of fight
export const PK_SPRING = { type: 'spring' as const, stiffness: 800, damping: 20, mass: 0.2 };

// 🎯 Unified elastic spring language — consistent feel across all card types.
// Snap-back: snappy return to center with 1–2 overshoots
export const SNAP_BACK_SPRING = { type: 'spring' as const, stiffness: 800, damping: 20, mass: 0.2 };
// Horizontal exit: elastic fly-off with momentum feel
export const EXIT_SPRING = { type: 'spring' as const, stiffness: 600, damping: 20, mass: 0.3 };
// Vertical skip exit: slightly softer for page-turn feel
export const VERTICAL_EXIT_SPRING = { type: 'spring' as const, stiffness: 550, damping: 18, mass: 0.35 };



