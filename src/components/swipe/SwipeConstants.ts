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

export {
  type PokerCardData,
  type OwnerIntentCard,
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
export const PK_DIST_THRESHOLD = 80;
export const PK_VEL_THRESHOLD = 260;
// Softer spring — smoother quick-filter card cycling, no jitter
export const PK_SPRING = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.6 };



