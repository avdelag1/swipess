import type { MapListingPin, MapProfilePin } from '@/hooks/usePassportMapData';

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

export function createListingMarkerEl(
  listing: MapListingPin,
  isSelected: boolean,
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--listing';
  const price = formatPinPrice(listing.price);
  const label = price ?? 'View';

  el.style.cssText = `
    display: flex; align-items: center; justify-content: center;
    min-width: ${isSelected ? '52px' : '44px'}; height: ${isSelected ? '34px' : '30px'};
    padding: 0 10px; border-radius: 999px;
    background: ${isSelected ? '#111827' : '#ffffff'};
    color: ${isSelected ? '#ffffff' : '#111827'};
    font-size: 11px; font-weight: 800; letter-spacing: 0.02em;
    border: 2px solid ${isSelected ? '#EC4899' : '#ffffff'};
    box-shadow: 0 ${isSelected ? '8' : '4'}px ${isSelected ? '24' : '14'}px rgba(0,0,0,${isSelected ? '0.45' : '0.28'});
    cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease;
    transform: scale(${isSelected ? '1.08' : '1'});
    white-space: nowrap;
  `;
  el.textContent = label;
  el.dataset.pinId = listing.id;
  el.dataset.pinType = 'listing';
  return el;
}

export function createProfileMarkerEl(
  profile: MapProfilePin,
  isSelected: boolean,
): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'passport-map-marker passport-map-marker--profile';
  const size = isSelected ? 46 : 40;

  el.style.cssText = `
    width: ${size}px; height: ${size}px; border-radius: 50%;
    border: 3px solid ${isSelected ? '#818CF8' : '#6366F1'};
    background: #111; box-shadow: 0 ${isSelected ? '8' : '4'}px ${isSelected ? '22' : '14'}px rgba(0,0,0,0.4);
    overflow: hidden; cursor: pointer;
    background-size: cover; background-position: center;
    transform: scale(${isSelected ? '1.1' : '1'});
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  `;

  if (profile.imageUrl) {
    el.style.backgroundImage = `url(${profile.imageUrl})`;
  } else {
    el.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#fff';
    el.style.fontSize = '14px';
    el.style.fontWeight = '800';
    el.textContent = (profile.name?.[0] ?? '?').toUpperCase();
  }

  el.dataset.pinId = profile.id;
  el.dataset.pinType = 'profile';
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