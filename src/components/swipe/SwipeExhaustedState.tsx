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
    { id: 'services', label: t('deck.exhausted.categories.services') },
  ];

  const ownerCategories = [
    { id: 'buyers', label: t('deck.exhausted.categories.buyers') },
    { id: 'renters', label: t('deck.exhausted.categories.renters') },
    { id: 'hire', label: t('deck.exhausted.categories.hire') },
  ];

  const allCategories = role === 'owner' ? ownerCategories : clientCategories;
  const categories = allCategories.filter((c) => c.id !== activeCategory);

  const headingColor = isLight ? 'text-slate-900' : 'text-white';
  const subColor = isLight ? 'text-slate-500' : 'text-white/60';
  const sectionLabelColor = isLight ? 'text-slate-500' : 'text-white/55';
  const filterBtnClass = isLight
    ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
    : 'bg-white text-slate-900 border-white hover:bg-white/90';
  const categoryBtnClass = isLight
    ? 'bg-white text-slate-900 border-slate-200 shadow-[0_8px_22px_-12px_rgba(15,23,42,0.18)] hover:bg-slate-50'
    : 'bg-white/[0.06] text-white border-white/15 hover:bg-white/[0.10]';

  return (
    <div
      className={cn(
        'relative z-50 h-full w-full flex flex-col items-center justify-center px-6 py-8 overflow-hidden',
        isLight ? 'bg-white' : 'bg-[#0a0a0c]'
      )}
    >
      {/* Top Left Back Button */}
      {onBack && (
        <button
          onClick={() => {
            triggerHaptic('light');
            onBack();
          }}
          className={cn(
            "absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 z-50 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90",
            isLight ? "bg-black/5 text-black hover:bg-black/10" : "bg-white/10 text-white hover:bg-white/20"
          )}
          aria-label="Go back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-90"><path d="m15 18-6-6 6-6"/></svg>
        </button>
      )}

      <div className="flex flex-col items-center text-center w-full max-w-md gap-7 relative z-10">
        {/* Headline */}
        <div className="space-y-2">
          <h2 className={cn('text-[26px] sm:text-[30px] font-black tracking-tight leading-tight', headingColor)}>
            {isLoading ? t('deck.exhausted.scanning') : t('deck.exhausted.noNearby', { category: categoryName })}
          </h2>
          <p className={cn('text-[11px] font-bold uppercase tracking-[0.22em]', subColor)}>
            {isLoading ? t('deck.exhausted.initializing') : t('deck.exhausted.adjustRadius')}
          </p>
        </div>

        {/* Radius card */}
        {onRadiusChange && onDetectLocation && (
          <div
            className={cn(
              'w-full rounded-[1.75rem] p-5 pt-6 relative',
              isLight
                ? 'bg-slate-50 border border-slate-200'
                : 'bg-white/[0.04] border border-white/10'
            )}
          >
            {/* Filter pill — top-right, isolated */}
            {onOpenFilters && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenFilters();
                }}
                className={cn(
                  'absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full border transition-all active:scale-90',
                  filterBtnClass
                )}
                title="Open advanced filters"
                aria-label="Open advanced filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}

            <div className={cn('flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] mb-3', sectionLabelColor)}>
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

            <p className={cn('text-[11px] font-semibold mt-4', subColor)}>
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
            className={cn(
              'w-full min-h-12 py-3 px-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 border flex items-center justify-center gap-2',
              isLight
                ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30'
            )}
          >
            <Map className="w-4 h-4" />
            {t('deck.exhausted.exploreMap')}
          </button>
        )}

        {/* Category switcher */}
        {onCategoryChange && categories.length > 0 && (
          <div className="w-full space-y-3">
            <p className={cn('text-[10px] font-black uppercase tracking-[0.22em]', sectionLabelColor)}>
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
                  className={cn(
                    'min-h-12 py-2.5 px-3 rounded-full text-[11px] font-black uppercase tracking-[0.12em] transition-all active:scale-95 border',
                    categoryBtnClass
                  )}
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
