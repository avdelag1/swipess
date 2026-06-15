import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';
import { PASSPORT_GRADIENTS } from './passportMapTheme';

export type MapLayerFilter = 'all' | 'listings' | 'people';

export type SelectedPin =
  | { type: 'listing'; data: MapListingPin }
  | { type: 'profile'; data: MapProfilePin };

function formatPinPrice(price?: number): string | null {
  if (price == null || Number.isNaN(price)) return null;
  if (price >= 1000) {
    const k = price / 1000;
    return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `$${Math.round(price)}`;
}

const injectMarkerStyles = () => {
  if (typeof document === 'undefined' || document.getElementById('passport-marker-styles')) return;
  const style = document.createElement('style');
  style.id = 'passport-marker-styles';
  style.innerHTML = `
    @keyframes listing-pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 198, 255, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 198, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 198, 255, 0); }
    }
    @keyframes profile-pulse {
      0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.65); }
      70% { box-shadow: 0 0 0 18px rgba(99, 102, 241, 0); }
      100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }
    .passport-map-marker {
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease !important;
      will-change: transform, box-shadow;
    }
    .passport-map-marker:hover {
      transform: scale(1.18) translateY(-5px) !important;
      z-index: 1000 !important;
    }
    .passport-map-marker--listing[data-selected="true"] {
      animation: listing-pulse 2s infinite !important;
      z-index: 1001 !important;
    }
    .passport-map-marker--profile[data-selected="true"] {
      animation: profile-pulse 2s infinite !important;
      z-index: 1001 !important;
    }
  `;
  document.head.appendChild(style);
};

export function createListingMarkerEl(
  listing: MapListingPin,
  isSelected: boolean,
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--listing';
  const price = formatPinPrice(listing.price);
  const label = price ?? 'View';

  el.style.cssText = `
    display: flex; align-items: center; justify-content: center;
    min-width: ${isSelected ? '56px' : '46px'}; height: ${isSelected ? '36px' : '32px'};
    padding: 0 12px; border-radius: 999px;
    background: ${isSelected ? PASSPORT_GRADIENTS.listings : '#ffffff'};
    color: ${isSelected ? '#ffffff' : '#0F172A'};
    font-size: 11px; font-weight: 900; letter-spacing: 0.03em;
    border: 2px solid ${isSelected ? '#BAE6FD' : '#E0F2FE'};
    box-shadow: 0 ${isSelected ? '6' : '3'}px ${isSelected ? '16' : '8'}px rgba(0,114,255,${isSelected ? '0.3' : '0.15'});
    cursor: pointer;
    transform: scale(${isSelected ? '1.1' : '1'});
    white-space: nowrap;
  `;
  el.textContent = label;
  el.dataset.pinId = listing.id;
  el.dataset.pinType = 'listing';
  el.dataset.selected = isSelected.toString();
  return el;
}

export function createProfileMarkerEl(
  profile: MapProfilePin,
  isSelected: boolean,
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--profile';
  const size = isSelected ? 48 : 42;

  el.style.cssText = `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    border: 3px solid ${isSelected ? '#A5B4FC' : '#6366F1'};
    background: #111;
    box-shadow: 0 ${isSelected ? '10' : '5'}px ${isSelected ? '24' : '14'}px rgba(99,102,241,${isSelected ? '0.55' : '0.4'});
    overflow: visible; cursor: pointer;
    background-size: cover; background-position: center;
    transform: scale(${isSelected ? '1.12' : '1'});
    position: relative;
  `;

  if (profile.imageUrl) {
    el.style.backgroundImage = `url(${profile.imageUrl})`;
  } else {
    el.style.background = PASSPORT_GRADIENTS.people;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#fff';
    el.style.fontSize = '14px';
    el.style.fontWeight = '900';
    el.textContent = (profile.name?.[0] ?? '?').toUpperCase();
  }

  if (profile.recentlyActive) {
    const dot = document.createElement('span');
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: 12px; height: 12px; border-radius: 50%;
      background: linear-gradient(135deg, #10B981, #06B6D4);
      border: 2px solid #fff;
      box-shadow: 0 0 8px rgba(16,185,129,0.8);
    `;
    el.appendChild(dot);
  }

  el.dataset.pinId = profile.id;
  el.dataset.pinType = 'profile';
  el.dataset.selected = isSelected.toString();
  return el;
}

export function formatDistanceKm(km?: number): string | null {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km away`;
}

export function categoryLabel(category?: string): string {
  if (!category) return 'Listing';
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}