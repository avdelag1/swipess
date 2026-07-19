import { useCallback, useState } from 'react';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Bike, Briefcase, ChevronLeft, ChevronRight, Home, Key, RotateCcw, Search, Tag, Users, Anchor
} from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { MotoClientFilters } from '@/components/filters/MotoClientFilters';
import { BicycleClientFilters } from '@/components/filters/BicycleClientFilters';
import { YachtClientFilters } from '@/components/filters/YachtClientFilters';
import { WorkerClientFilters } from '@/components/filters/WorkerClientFilters';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { useSiteContent } from '@/hooks/useSiteContent';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';
import { FloatingSurface } from '@/components/ui/FloatingSurface';

import type { QuickFilterCategory } from '@/types/filters';

interface ClientFiltersProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function ClientFilters({ isEmbedded, onClose }: ClientFiltersProps) {
  const { navigate } = useAppNavigate();
  const { getText } = useSiteContent('filters');

  const queryClient = useQueryClient();
  const { _isLight } = useAppTheme();
  
  const storeActiveCategory = useFilterStore(s => s.activeCategory);
  
  const getMappedCategory = () => {
    if (storeActiveCategory === 'pros') return 'services';
    if (['property', 'motorcycle', 'bicycle', 'yacht', 'services', 'buyers', 'renters', 'leads'].includes(storeActiveCategory || '')) {
      return storeActiveCategory as QuickFilterCategory | 'buyers' | 'renters' | 'leads';
    }
    return null;
  };

  const activeCategory = getMappedCategory();
  const setActiveCategory = useFilterStore(s => s.setActiveCategory);
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const updateFilters = useFilterStore(s => s.updateFilters);
  const resetClientFilters = useFilterStore(s => s.resetClientFilters);

  const [localFilters, setLocalFilters] = useState<Record<string, any>>(getListingFilters());
  const handleFilterApply = useCallback((f: Record<string, unknown>) => {
    setLocalFilters(f);
  }, []);

  const handleScan = useCallback(() => {
    haptics.success();
    updateFilters(localFilters);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    appToast.success('Filters applied', 'Your deck is updating.');
    if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate('/client/dashboard');
    }
  }, [navigate, queryClient, updateFilters, localFilters, isEmbedded, onClose]);

  const handleReset = useCallback(() => {
    haptics.tap();
    resetClientFilters();
    setLocalFilters({});
  }, [resetClientFilters]);

  const CATEGORIES: { id: QuickFilterCategory; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'property', label: 'Properties', desc: 'Settle Anywhere', icon: Home },
    { id: 'motorcycle', label: 'Motos', desc: 'High Velocity', icon: MotorcycleIcon },
    { id: 'bicycle', label: 'Bikes', desc: 'Urban Agility', icon: Bike },
    { id: 'yacht', label: 'Yachts', desc: 'Open Waters', icon: Anchor },
    { id: 'services', label: 'Workers', desc: 'Elite Skillset', icon: Briefcase },
    { id: 'buyers', label: 'Buyers', desc: 'Purchase Ready', icon: Tag },
    { id: 'renters', label: 'Renters', desc: 'Looking to Move', icon: Key },
    { id: 'leads', label: 'Leads', desc: 'Seeking Workers', icon: Users },
  ];

  return (
    <AmbientPageBackground
      className="w-full flex flex-col p-4 relative min-h-[100dvh] text-foreground"
      style={{ paddingTop: 'calc(var(--safe-top, 0px) + 16px)', paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 24px)' }}
    >
      {!isEmbedded && (
        <div className="mb-6 pt-4 px-4">
          <h1 className="text-4xl font-black uppercase italic tracking-[-0.05em] leading-none text-foreground">
            {getText('sheet_title', 'Swipess')} <span className="text-primary">Filter</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-1 text-muted-foreground">{getText('sheet_title', 'Filter Your Best Deal')}</p>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-200 relative z-10">
        <AnimatePresence mode="sync">
          {!activeCategory ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 gap-4 pt-4"
            >
              {/* Back to previous page */}
              <button
                onClick={() => { haptics.tap(); navigate(-1); }}
                className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg press-snappy w-fit text-foreground hover:bg-secondary"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {CATEGORIES.map((cat) => (
                <FloatingSurface
                  key={cat.id}
                  as="button"
                  interactive
                  elevation="floating"
                  onClick={() => setActiveCategory(cat.id)}
                  className="group relative h-28 w-full text-card-foreground transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]" />
                  <div className="relative h-full px-8 flex items-center justify-between bg-card/60 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-foreground text-background shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        <cat.icon className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-foreground">{cat.label}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{cat.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-2 text-muted-foreground" />
                  </div>
                </FloatingSurface>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="filters"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 pb-20"
            >
              <button
                onClick={() => { haptics.tap(); setActiveCategory(null); }}
                className="flex items-center gap-2 px-3 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg press-snappy text-foreground hover:bg-secondary"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {/* Category switcher */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all duration-150 press-snappy tab-snappy whitespace-nowrap"
                    style={activeCategory === cat.id ? {
                      background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
                      borderColor: 'transparent',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(255, 77, 0, 0.35)',
                    } : {
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      color: 'hsl(var(--foreground))'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <h2 className="text-5xl font-black uppercase italic tracking-[-0.05em] mb-2 text-foreground">
                {activeCategory === 'property' && 'Property'}
                {activeCategory === 'motorcycle' && 'Moto'}
                {activeCategory === 'bicycle' && 'Bicycle'}
                {activeCategory === 'yacht' && 'Yacht'}
                {activeCategory === 'services' && 'Worker'}
                {activeCategory === 'buyers' && 'Buyers'}
                {activeCategory === 'renters' && 'Renters'}
                {activeCategory === 'leads' && 'Leads'}
                <span className="text-primary block text-xl tracking-[0.2em] mt-2">Filters</span>
              </h2>

              <div className="rounded-[3rem] p-6 shadow-2xl bg-card border border-border backdrop-blur-3xl">
                {activeCategory === 'property' && <PropertyClientFilters onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'motorcycle' && <MotoClientFilters onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'bicycle' && <BicycleClientFilters onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'yacht' && <YachtClientFilters onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'services' && <WorkerClientFilters onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
                {activeCategory === 'buyers' && <DiscoveryFilters category="property" onApply={handleFilterApply} initialFilters={{ ...localFilters, interest_type: 'buy' }} activeCount={0} />}
                {activeCategory === 'renters' && <DiscoveryFilters category="property" onApply={handleFilterApply} initialFilters={{ ...localFilters, interest_type: 'rent' }} activeCount={0} />}
                {activeCategory === 'leads' && <DiscoveryFilters category="service" onApply={handleFilterApply} initialFilters={localFilters} activeCount={0} />}
              </div>

              <div className="flex flex-col gap-4 pt-6">
                <button
                  onClick={handleScan}
                  className="w-full h-20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(255,77,0,0.3)] flex items-center justify-center gap-4 group press-snappy active:scale-95 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)', color: '#ffffff' }}
                >
                  <Search className="w-6 h-6" />
                  <span className="text-lg font-black uppercase italic tracking-widest">
                    {getText('apply_button', 'Apply Filters')}
                  </span>
                </button>

                <button
                  onClick={() => { handleReset(); setActiveCategory(null); }}
                  className="w-full h-16 rounded-[2rem] flex items-center justify-center gap-2 transition-all bg-secondary border border-border text-foreground hover:bg-secondary/80"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{getText('reset_button', 'Reset Parameters')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AmbientPageBackground>
  );
}
