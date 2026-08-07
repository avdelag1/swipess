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
    .passport-map-marker {
      transition: transform 0.12s ease, opacity 0.15s ease !important;
      transform-origin: center bottom;
    }
    .passport-map-marker:hover {
      z-index: 1000 !important;
    }
    .passport-map-marker--listing[data-selected="true"],
    .passport-map-marker--profile[data-selected="true"] {
      z-index: 1001 !important;
    }
  `;
  document.head.appendChild(style);
};

/** Larger pins on Safari 2D (Leaflet) — top-down map needs bigger targets. */
export type MarkerVisualScale = 'normal' | 'large';

function listingMarkerStyle(isSelected: boolean, scale: MarkerVisualScale = 'normal') {
  const large = scale === 'large';
  const h = isSelected ? (large ? 34 : 26) : (large ? 30 : 22);
  const font = isSelected ? (large ? 12 : 11) : (large ? 11 : 10);
  // Clean flat pill — no heavy drop-shadows / glow halos that clutter the map
  return `
    display: flex; align-items: center; justify-content: center; gap: 5px;
    height: ${h}px;
    padding: 0 ${large ? 10 : 8}px 0 ${large ? 7 : 5}px; border-radius: ${large ? 16 : 12}px;
    background: ${isSelected ? '#0F172A' : 'rgba(255,255,255,0.96)'};
    color: ${isSelected ? '#ffffff' : '#0F172A'};
    font-size: ${font}px; font-weight: 700; letter-spacing: 0.01em;
    border: 1px solid ${isSelected ? '#334155' : 'rgba(15,23,42,0.12)'};
    box-shadow: 0 1px 3px rgba(15,23,42,0.12);
    cursor: pointer;
    white-space: nowrap;
    filter: none;
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
  const dotSize = large ? 8 : 7;
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${dotColor}; flex-shrink:0;"></span>`;

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
  const dotSize = large ? 8 : 7;
  const dotColor = isSelected ? '#00E5FF' : '#3B82F6';
  const dotHtml = `<span style="width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${dotColor}; flex-shrink:0;"></span>`;
  const shortTitle = listing.title.length > 18 ? listing.title.substring(0, 15) + '…' : listing.title;
  el.innerHTML = `${dotHtml} <span>${shortTitle}</span>`;
  el.dataset.selected = isSelected.toString();
}

function profileMarkerStyle(isSelected: boolean, scale: MarkerVisualScale = 'normal') {
  const large = scale === 'large';
  const size = isSelected ? (large ? 48 : 32) : (large ? 40 : 28);
  const border = large ? 2.5 : 2;
  return `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    border: ${border}px solid ${isSelected ? '#C7D2FE' : '#fff'};
    outline: ${isSelected ? 2 : 0}px solid ${isSelected ? '#818CF8' : 'transparent'};
    background: #111;
    box-shadow: 0 1px 4px rgba(15,23,42,0.28);
    overflow: visible; cursor: pointer;
    background-size: cover; background-position: center;
    position: relative;
    filter: none;
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
    const d = large ? 12 : 10;
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: ${d}px; height: ${d}px; border-radius: 50%;
      background: #10B981;
      border: 2px solid #fff;
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
    const d = large ? 12 : 10;
    dot.style.cssText = `
      position: absolute; bottom: -1px; right: -1px;
      width: ${d}px; height: ${d}px; border-radius: 50%;
      background: #10B981;
      border: 2px solid #fff;
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

/** Numbered cluster bubble — modern glass pill for zoomed-out map. */
export function createClusterMarkerEl(
  count: number,
  dominant: 'listing' | 'profile' | 'mixed' = 'mixed',
  scale: MarkerVisualScale = 'normal',
): HTMLDivElement {
  injectMarkerStyles();
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--cluster';
  el.dataset.pinType = 'cluster';
  el.dataset.markerScale = scale;

  const large = scale === 'large';
  const size = count >= 100
    ? (large ? 56 : 48)
    : count >= 10
      ? (large ? 50 : 42)
      : (large ? 44 : 36);

  const gradient =
    dominant === 'profile'
      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
      : dominant === 'listing'
        ? 'linear-gradient(135deg, #0072FF 0%, #00C6FF 100%)'
        : 'linear-gradient(135deg, #0072FF 0%, #6366F1 55%, #8B5CF6 100%)';

  el.style.cssText = `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: ${gradient};
    color: #fff;
    font-size: ${count >= 100 ? (large ? 13 : 11) : (large ? 15 : 13)}px;
    font-weight: 900;
    letter-spacing: -0.02em;
    border: 2px solid rgba(255,255,255,0.95);
    box-shadow: 0 2px 8px rgba(15,23,42,0.28);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    filter: none;
  `;
  el.textContent = count > 999 ? '999+' : String(count);
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', `${count} places — tap to zoom in`);
  return el;
}

export function updateClusterMarkerEl(
  el: HTMLDivElement,
  count: number,
  dominant: 'listing' | 'profile' | 'mixed' = 'mixed',
  scale?: MarkerVisualScale,
): void {
  const s = scale ?? (el.dataset.markerScale as MarkerVisualScale) ?? 'normal';
  const fresh = createClusterMarkerEl(count, dominant, s);
  // Preserve Mapbox transform / leaflet positioning styles
  const { transform, opacity, transition, pointerEvents, zIndex } = el.style;
  el.className = fresh.className;
  el.style.cssText = fresh.style.cssText;
  if (transform) el.style.transform = transform;
  if (opacity) el.style.opacity = opacity;
  if (transition) el.style.transition = transition;
  if (pointerEvents) el.style.pointerEvents = pointerEvents;
  if (zIndex) el.style.zIndex = zIndex;
  el.textContent = fresh.textContent;
  el.dataset.pinType = 'cluster';
  el.dataset.markerScale = s;
  el.setAttribute('aria-label', `${count} places — tap to zoom in`);
}

export function categoryLabel(category?: string): string {
  if (!category) return 'Listing';
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
}