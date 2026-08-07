import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';
import { PASSPORT_GRADIENTS } from './passportMapTheme';

export type MapLayerFilter = 'all' | 'listings' | 'people';

export type SelectedPin =
  | { type: 'listing'; data: MapListingPin }
  | { type: 'profile'; data: MapProfilePin };



/**
 * Re-apply a marker's inline style WITHOUT wiping the properties Mapbox and the
 * map modal manage on the same element. Assigning `el.style.cssText` resets
 * every inline style — including the `transform` Mapbox uses to position the
 * pin — which snapped pins to the top-left corner (translate(0,0)) until the
 * next map render. That is the "pins fly to the corner then vanish" glitch seen
 * when closing the pin sheet. We restore transform + the modal-driven
 * opacity/transition/pointer-events/z-index after rewriting the rest.
 */
function applyMarkerStyle(el: HTMLElement, css: string): void {
  const { transform, opacity, transition, pointerEvents, zIndex } = el.style;
  el.style.cssText = css;
  if (transform) el.style.transform = transform;
  if (opacity) el.style.opacity = opacity;
  if (transition) el.style.transition = transition;
  if (pointerEvents) el.style.pointerEvents = pointerEvents;
  if (zIndex) el.style.zIndex = zIndex;
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

/** Larger pins on Safari 2D (Leaflet) — top-down map needs bigger targets. */
export type MarkerVisualScale = 'normal' | 'large';

function listingMarkerStyle(isSelected: boolean, scale: MarkerVisualScale = 'normal') {
  const large = scale === 'large';
  const h = isSelected ? (large ? 36 : 28) : (large ? 32 : 24);
  const font = isSelected ? (large ? 13 : 11) : (large ? 12 : 10);
  return `
    display: flex; align-items: center; justify-content: center; gap: 6px;
    height: ${h}px;
    padding: 0 ${large ? 12 : 10}px 0 ${large ? 8 : 6}px; border-radius: ${large ? 18 : 14}px;
    background: ${isSelected ? '#111827' : '#ffffff'};
    color: ${isSelected ? '#ffffff' : '#0F172A'};
    font-size: ${font}px; font-weight: 800; letter-spacing: 0.01em;
    border: ${large ? 2 : 1}px solid ${isSelected ? '#374151' : '#E2E8F0'};
    box-shadow: 0 ${isSelected ? '8' : '4'}px ${isSelected ? '20' : '12'}px rgba(0,0,0,${isSelected ? '0.35' : '0.18'});
    cursor: pointer;
    white-space: nowrap;
  `;
}

export function createListingMarkerEl(
  listing: MapListingPin,
  isSelected: boolean,
  scale: MarkerVisualScale = 'normal',
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--listing';
  el.dataset.markerScale = scale;
  
  el.style.cssText = listingMarkerStyle(isSelected, scale);
  
  const large = scale === 'large';
  const dotSize = large ? 10 : 8;
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 6px ${dotColor}99; flex-shrink:0;"></span>`;
  
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
  scale?: MarkerVisualScale,
): void {
  const s = scale ?? (el.dataset.markerScale as MarkerVisualScale) ?? 'normal';
  el.dataset.markerScale = s;
  applyMarkerStyle(el, listingMarkerStyle(isSelected, s));
  const large = s === 'large';
  const dotSize = large ? 10 : 8;
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${dotColor}; box-shadow: 0 0 6px ${dotColor}99; flex-shrink:0;"></span>`;
  const shortTitle = listing.title.length > 18 ? listing.title.substring(0, 15) + '…' : listing.title;
  el.innerHTML = `${dotHtml} <span>${shortTitle}</span>`;
  el.dataset.selected = isSelected.toString();
}

function profileMarkerStyle(isSelected: boolean, scale: MarkerVisualScale = 'normal') {
  const large = scale === 'large';
  const size = isSelected ? (large ? 52 : 34) : (large ? 44 : 28);
  const border = large ? 3 : 2;
  return `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    border: ${border}px solid ${isSelected ? '#A5B4FC' : '#fff'};
    outline: ${large ? 2 : 0}px solid ${isSelected ? '#818CF8' : '#6366F1'};
    background: #111;
    box-shadow: 0 ${isSelected ? '12' : '6'}px ${isSelected ? '28' : '16'}px rgba(99,102,241,${isSelected ? '0.65' : '0.5'}),
      0 0 0 ${large ? 2 : 1}px rgba(255,255,255,0.35);
    overflow: visible; cursor: pointer;
    background-size: cover; background-position: center;
    position: relative;
  `;
}

export function createProfileMarkerEl(
  profile: MapProfilePin,
  isSelected: boolean,
  scale: MarkerVisualScale = 'normal',
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--profile';
  el.dataset.markerScale = scale;
  el.style.cssText = profileMarkerStyle(isSelected, scale);

  const large = scale === 'large';
  if (profile.imageUrl) {
    el.style.backgroundImage = `url(${profile.imageUrl})`;
  } else {
    el.style.background = PASSPORT_GRADIENTS.people;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#fff';
    el.style.fontSize = large ? '18px' : '14px';
    el.style.fontWeight = '900';
    el.textContent = (profile.name?.[0] ?? '?').toUpperCase();
  }

  if (profile.recentlyActive) {
    const dot = document.createElement('span');
    dot.className = 'passport-map-marker-active-dot';
    const d = large ? 14 : 12;
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: ${d}px; height: ${d}px; border-radius: 50%;
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
  scale?: MarkerVisualScale,
): void {
  const s = scale ?? (el.dataset.markerScale as MarkerVisualScale) ?? 'normal';
  el.dataset.markerScale = s;
  applyMarkerStyle(el, profileMarkerStyle(isSelected, s));
  el.dataset.selected = isSelected.toString();

  const large = s === 'large';
  if (profile.imageUrl) {
    el.style.backgroundImage = `url(${profile.imageUrl})`;
    el.textContent = '';
  } else {
    el.style.background = PASSPORT_GRADIENTS.people;
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#fff';
    el.style.fontSize = large ? '18px' : '14px';
    el.style.fontWeight = '900';
    el.textContent = (profile.name?.[0] ?? '?').toUpperCase();
  }

  const hasDot = !!el.querySelector('.passport-map-marker-active-dot');
  if (profile.recentlyActive && !hasDot) {
    const dot = document.createElement('span');
    dot.className = 'passport-map-marker-active-dot';
    const d = large ? 14 : 12;
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: ${d}px; height: ${d}px; border-radius: 50%;
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