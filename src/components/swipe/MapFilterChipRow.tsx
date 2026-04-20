import React, { useCallback, useMemo } from 'react';
import { Building2, Users, ChevronLeft } from 'lucide-react';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { POKER_CARDS, OWNER_INTENT_CARDS } from './SwipeConstants';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

interface MapFilterChipRowProps {
  mode: 'client' | 'owner';
  onBack?: () => void;
}

type RealChipId = QuickFilterCategory;
type VirtualChipId = 'listings' | 'clients';
type ChipId = RealChipId | VirtualChipId;

interface ChipDef {
  id: ChipId;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

/**
 * Horizontal swipeable quick-filter chip row shown at the top of DashboardMapCard.
 *
 * Real chips (property, motorcycle, bicycle, services) drive
 * filterStore.activeCategory via setActiveCategory.
 *
 * Virtual chips are UX shortcuts that manipulate existing store fields without
 * extending the QuickFilterCategory union or POKER_CARDS:
 *   - "Listings": setCategories(['property','motorcycle','bicycle']) — meta multi-select
 *   - "Clients":  owner-side toggle to clientType === 'all'
 */
export function MapFilterChipRow({ mode, onBack }: MapFilterChipRowProps) {
  const { theme, isLight } = useTheme();

  const activeCategory = useFilterStore((s) => s.activeCategory);
  const categories = useFilterStore((s) => s.categories);
  const clientType = useFilterStore((s) => s.clientType);
  const { setActiveCategory, setCategories, setClientType } = useFilterActions();

  const chips: ChipDef[] = useMemo(() => {
    if (mode === 'owner') {
      return OWNER_INTENT_CARDS.filter(c => ['seekers', 'buyers', 'renters', 'hire'].includes(c.id)).map(c => ({
        id: c.id as any,
        label: c.label,
        Icon: c.icon,
        accent: c.accent
      }));
    }
    const prop = POKER_CARDS.find((c) => c.id === 'property')!;
    const moto = POKER_CARDS.find((c) => c.id === 'motorcycle')!;
    const bike = POKER_CARDS.find((c) => c.id === 'bicycle')!;
    const serv = POKER_CARDS.find((c) => c.id === 'services')!;
    return [
      { id: 'property',   label: 'Properties',  Icon: prop.icon, accent: prop.accent },
      { id: 'motorcycle', label: 'Motorcycles', Icon: moto.icon, accent: moto.accent },
      { id: 'bicycle',    label: 'Bicycles',    Icon: bike.icon, accent: bike.accent },
      { id: 'services',   label: 'Workers',     Icon: serv.icon, accent: serv.accent },
    ];
  }, [mode]);

  const isActive = useCallback(
    (id: ChipId) => {
      if (id === 'listings') return categories.length >= 2;
      if (id === 'clients') return mode === 'owner' && clientType === 'all';
      return activeCategory === id;
    },
    [activeCategory, categories.length, clientType, mode],
  );

  const handleChip = useCallback(
    (id: ChipId) => {
      triggerHaptic('medium');
      if (id === 'listings') {
        setCategories(['property', 'motorcycle', 'bicycle']);
        setActiveCategory(null);
        return;
      }
      if (id === 'clients') {
        setClientType('all');
        return;
      }
      setActiveCategory(id as QuickFilterCategory);
    },
    [setCategories, setActiveCategory, setClientType],
  );

  return (
    <div
      data-no-swipe-nav
      className={cn(
        'absolute top-[calc(env(safe-area-inset-top,0px)+16px)] left-0 right-0 z-[60] w-full flex gap-2 px-3 sm:px-4 py-2 overflow-x-auto scroll-smooth flex-shrink-0 pointer-events-auto shadow-none bg-transparent border-none'
      )}
      style={{
        scrollSnapType: 'x proximity',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x',
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={() => { triggerHaptic('light'); onBack(); }}
          className={cn(
            'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all',
            isLight ? 'bg-black/5 text-black/60 hover:bg-black/10' : 'bg-white/10 text-white/60 hover:bg-white/20'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {chips.map(({ id, label, Icon, accent }) => {
        const active = isActive(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleChip(id)}
            className={cn(
              'flex-shrink-0 h-11 min-w-[44px] px-4 rounded-full',
              'inline-flex items-center gap-2 transition-all',
              'text-[11px] font-black uppercase tracking-wider',
              active
                ? 'text-white shadow-lg'
                : isLight
                  ? 'bg-black/5 text-black/60 hover:bg-black/10'
                  : 'bg-white/10 text-white/60 hover:bg-white/20',
            )}
            style={{
              scrollSnapAlign: 'start',
              background: active ? accent : undefined,
            }}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MapFilterChipRow;
