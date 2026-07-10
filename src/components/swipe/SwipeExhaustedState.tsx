import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { DistanceSlider } from './DistanceSlider';
import { Map, MapPin, SlidersHorizontal } from 'lucide-react';
import useAppTheme from '@/hooks/useAppTheme';
import { useTranslation } from 'react-i18next';

interface SwipeExhaustedStateProps {
  radiusKm?: number;
  onRadiusChange?: (km: number) => void;
  onDetectLocation?: () => void;
  detecting?: boolean;
  detected?: boolean;
  categoryName?: string;
  isLoading?: boolean;
  activeCategory?: string;
  onCategoryChange?: (category: string) => void;
  onOpenFilters?: () => void;
  onOpenMap?: () => void;
  onBack?: () => void;
  role?: 'client' | 'owner';
  [key: string]: any;
}

export const SwipeExhaustedState = ({
  radiusKm = 50,
  onRadiusChange,
  onDetectLocation,
  detecting = false,
  detected = false,
  categoryName = 'listings',
  isLoading = false,
  activeCategory = 'property',
  onCategoryChange,
  onOpenFilters,
  onOpenMap,
  onBack,
  role = 'client',
}: SwipeExhaustedStateProps) => {
  const { isLight } = useAppTheme();
  const { t } = useTranslation();

  const clientCategories = [
    { id: 'property', label: t('deck.exhausted.categories.property') },
    { id: 'motorcycle', label: t('deck.exhausted.categories.motorcycle') },
    { id: 'bicycle', label: t('deck.exhausted.categories.bicycle') },
    { id: 'yacht', label: t('deck.exhausted.categories.yacht', 'Yachts') },
    { id: 'services', label: t('deck.exhausted.categories.services') },
  ];

  const ownerCategories = [
    { id: 'buyers', label: t('deck.exhausted.categories.buyers') },
    { id: 'renters', label: t('deck.exhausted.categories.renters') },
    { id: 'hire', label: t('deck.exhausted.categories.hire') },
  ];

  const allCategories = role === 'owner' ? ownerCategories : clientCategories;
  const categories = allCategories.filter((c) => c.id !== activeCategory);

  // ── Inline style tokens ─────────────────────────────────────────────────────
  // We use inline styles instead of Tailwind text-color classes here because
  // index.css has a global `.white-matte .text-white { color: #111 !important }`
  // rule that turns white button text invisible when the app is in light theme.
  // Inline styles win the cascade over class-based !important overrides.
  const bgColor          = isLight ? '#ffffff' : '#0a0a0c';
  const borderColor      = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const headingColor     = isLight ? '#000000' : '#ffffff';
  const subColor         = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
  const sectionLabel     = isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)';
  const radiusCardBg     = isLight ? '#f8f9fa' : 'rgba(255,255,255,0.06)';
  const radiusCardBorder = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)';

  // Action buttons — always high-contrast regardless of theme
  const actionBtnStyle: React.CSSProperties = isLight
    ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' }
    : { backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' };

  const filterBtnStyle: React.CSSProperties = isLight
    ? { backgroundColor: '#000000', color: '#ffffff', borderColor: '#000000' }
    : { backgroundColor: '#ffffff', color: '#1a1a1a', borderColor: '#ffffff' };

  const mapBtnStyle: React.CSSProperties = isLight
    ? { backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5' }
    : { backgroundColor: '#6366f1', color: '#ffffff', borderColor: '#6366f1' };

  const backBtnStyle: React.CSSProperties = isLight
    ? { backgroundColor: '#f1f5f9', color: '#000000' }
    : { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' };

  return (
    <div
      style={{ backgroundColor: bgColor, borderColor }}
      className="relative z-50 h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden rounded-[2.5rem] border"
    >
      {/* Top Left Back Button */}
      {onBack && (
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          style={backBtnStyle}
          className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 z-[110] w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
          aria-label="Go back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-90"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}

      <div className="flex flex-col items-center text-center w-full max-w-md gap-7 relative z-10">
        {/* Headline */}
        <div className="space-y-2">
          <h2 style={{ color: headingColor }} className="text-[26px] sm:text-[30px] font-black tracking-tight leading-tight">
            {isLoading ? t('deck.exhausted.scanning') : t('deck.exhausted.noNearby', { category: categoryName })}
          </h2>
          <p style={{ color: subColor }} className="text-[11px] font-bold uppercase tracking-[0.22em]">
            {isLoading ? t('deck.exhausted.initializing') : t('deck.exhausted.adjustRadius')}
          </p>
        </div>

        {/* Radius card */}
        {onRadiusChange && onDetectLocation && (
          <div
            style={{ backgroundColor: radiusCardBg, borderColor: radiusCardBorder }}
            className="w-full rounded-[2.25rem] p-5 pt-6 relative border"
          >
            {/* Filter pill — top-right, isolated */}
            {onOpenFilters && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenFilters();
                }}
                style={filterBtnStyle}
                className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full border transition-all active:scale-90"
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal style={{ color: filterBtnStyle.color }} className="w-4 h-4" />
              </button>
            )}

            <div style={{ color: sectionLabel }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] mb-3">
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('deck.exhausted.searchRadius')}</span>
            </div>

            <DistanceSlider
              radiusKm={radiusKm}
              onRadiusChange={onRadiusChange}
              onDetectLocation={onDetectLocation}
              detecting={detecting}
              detected={detected}
            />

            <p style={{ color: subColor }} className="text-[11px] font-semibold mt-4">
              {t('deck.exhausted.moveSlider')}
            </p>
          </div>
        )}

        {onOpenMap && (
          <button
            onClick={() => {
              triggerHaptic('heavy');
              onOpenMap();
            }}
            style={mapBtnStyle}
            className="w-full min-h-12 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 border flex items-center justify-center gap-2"
          >
            <Map style={{ color: mapBtnStyle.color }} className="w-4 h-4" />
            {t('deck.exhausted.exploreMap')}
          </button>
        )}

        {/* Category switcher */}
        {onCategoryChange && categories.length > 0 && (
          <div className="w-full space-y-3">
            <p style={{ color: sectionLabel }} className="text-[10px] font-black uppercase tracking-[0.22em]">
              {t('deck.exhausted.orTry')}
            </p>
            <div className={cn('grid gap-2', categories.length >= 3 ? 'grid-cols-3' : categories.length === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    onCategoryChange(cat.id);
                  }}
                  style={actionBtnStyle}
                  className="min-h-12 py-2.5 px-3 rounded-full text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 border"
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
