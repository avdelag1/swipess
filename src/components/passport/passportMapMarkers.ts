import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';
import { PASSPORT_GRADIENTS } from './passportMapTheme';

export type MapLayerFilter = 'all' | 'listings' | 'people';

export type SelectedPin =
  | { type: 'listing'; data: MapListingPin }
  | { type: 'profile'; data: MapProfilePin };



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
      transition: box-shadow 0.15s ease, filter 0.15s ease !important;
      transform-origin: center bottom;
    }
    .passport-map-marker:hover {
      filter: brightness(1.08);
      box-shadow: 0 6px 18px rgba(0,114,255,0.35) !important;
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

function listingMarkerStyle(isSelected: boolean) {
  return `
    display: flex; align-items: center; justify-content: center; gap: 6px;
    height: ${isSelected ? '28px' : '24px'};
    padding: 0 10px 0 6px; border-radius: 14px;
    background: ${isSelected ? '#111827' : '#ffffff'};
    color: ${isSelected ? '#ffffff' : '#0F172A'};
    font-size: ${isSelected ? '11px' : '10px'}; font-weight: 800; letter-spacing: 0.01em;
    border: 1px solid ${isSelected ? '#374151' : '#E2E8F0'};
    box-shadow: 0 ${isSelected ? '6' : '3'}px ${isSelected ? '16' : '8'}px rgba(0,0,0,${isSelected ? '0.3' : '0.12'});
    cursor: pointer;
    white-space: nowrap;
  `;
}

export function createListingMarkerEl(
  listing: MapListingPin,
  isSelected: boolean,
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--listing';
  
  el.style.cssText = listingMarkerStyle(isSelected);
  
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 4px ${dotColor}80;"></span>`;
  
  // Show title up to 15 chars to keep it neat
  const shortTitle = listing.title.length > 18 ? listing.title.substring(0, 15) + '…' : listing.title;
  el.innerHTML = `${dotHtml} <span>${shortTitle}</span>`;
  
  el.dataset.pinId = listing.id;
  el.dataset.pinType = 'listing';
  el.dataset.selected = isSelected.toString();
  return el;
}

export function updateListingMarkerEl(
  el: HTMLDivElement,
  listing: MapListingPin,
  isSelected: boolean,
): void {
  el.style.cssText = listingMarkerStyle(isSelected);
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 4px ${dotColor}80;"></span>`;
  const shortTitle = listing.title.length > 18 ? listing.title.substring(0, 15) + '…' : listing.title;
  el.innerHTML = `${dotHtml} <span>${shortTitle}</span>`;
  el.dataset.selected = isSelected.toString();
}

function profileMarkerStyle(isSelected: boolean) {
  const size = isSelected ? 34 : 28;
  return `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    border: 2px solid ${isSelected ? '#A5B4FC' : '#6366F1'};
    background: #111;
    box-shadow: 0 ${isSelected ? '10' : '5'}px ${isSelected ? '24' : '14'}px rgba(99,102,241,${isSelected ? '0.55' : '0.4'});
    overflow: visible; cursor: pointer;
    background-size: cover; background-position: center;
    position: relative;
  `;
}

export function createProfileMarkerEl(
  profile: MapProfilePin,
  isSelected: boolean,
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--profile';
  el.style.cssText = profileMarkerStyle(isSelected);

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
    dot.className = 'passport-map-marker-active-dot';
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

export function updateProfileMarkerEl(
  el: HTMLDivElement,
  profile: MapProfilePin,
  isSelected: boolean,
): void {
  el.style.cssText = profileMarkerStyle(isSelected);
  el.dataset.selected = isSelected.toString();

  if (profile.imageUrl) {
    el.style.backgroundImage = `url(${profile.imageUrl})`;
    el.textContent = '';
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

  const hasDot = !!el.querySelector('.passport-map-marker-active-dot');
  if (profile.recentlyActive && !hasDot) {
    const dot = document.createElement('span');
    dot.className = 'passport-map-marker-active-dot';
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: 12px; height: 12px; border-radius: 50%;
      background: linear-gradient(135deg, #10B981, #06B6D4);
      border: 2px solid #fff;
      box-shadow: 0 0 8px rgba(16,185,129,0.8);
    `;
    el.appendChild(dot);
  } else if (!profile.recentlyActive && hasDot) {
    el.querySelector('.passport-map-marker-active-dot')?.remove();
  }
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