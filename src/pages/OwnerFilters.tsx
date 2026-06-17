import { logger } from '@/utils/prodLogger';
import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  _Zap, Bike, Briefcase, ChevronLeft, Home, RotateCcw, Sparkles
} from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import useAppTheme from '@/hooks/useAppTheme';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import type { ClientType } from '@/types/filters';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';

type CategoryType = 'property' | 'motorcycle' | 'bicycle' | 'services';

interface OwnerFiltersProps {
  isEmbedded?: boolean;
  onClose?: () => void;
}

export default function OwnerFilters({ isEmbedded, onClose }: OwnerFiltersProps) {
  const navigate = useNavigate();
  const { theme, _isLight } = useAppTheme();
  const _isDark = theme === 'dark';
  
  const storeActiveCategory = useFilterStore(s => s.activeCategory);
  const clientType = useFilterStore(s => s.clientType);
  const setClientType = useFilterStore(s => s.setClientType);
  const resetOwnerFilters = useFilterStore(s => s.resetOwnerFilters);
  const [activeCategory, setActiveCategory] = useState<CategoryType>((storeActiveCategory as CategoryType) || 'property');

  const _isFirstMount = useRef(true);

  const handleApply = useCallback((_filters?: any) => {
    // We just want to stay on the page when filters are auto-applied from DiscoveryFilters
    logger.warn('[OwnerFilters] handleApply called, skipping navigation for auto-sync');
  }, []);

  const handleFinalApply = useCallback(() => {
    haptics.success();
    if (isEmbedded && onClose) {
      onClose();
    } else {
      navigate('/owner/dashboard');
    }
  }, [isEmbedded, onClose, navigate]);

  const handleReset = useCallback(() => {
    haptics.tap();
    resetOwnerFilters();
    setActiveCategory('property');
  }, [resetOwnerFilters]);

  const categories = [
    { id: 'property', name: 'Leads', icon: Home },
    { id: 'motorcycle', name: 'Motos', icon: MotorcycleIcon },
    { id: 'bicycle', name: 'Bikes', icon: Bike },
    { id: 'services', name: 'Jobs', icon: Briefcase },
  ];

  const content = (
    <AmbientPageBackground
      className={cn(
        "flex flex-col transition-colors duration-150 min-h-[100dvh]",
        isEmbedded ? "bg-transparent" : "",
        "text-foreground"
      )}
      style={!isEmbedded ? { paddingTop: 'calc(var(--safe-top, 0px) + 8px)', paddingBottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 24px)' } : undefined}
    >
      {/* HEADER - Only in standalone */}
      {!isEmbedded && (
        <div className="pt-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/owner/dashboard')}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border press-snappy shadow-xl",
                  _isLight ? "surface-4 text-black hover:shadow-[var(--elev-5)]" : "bg-black/70 border-white/15 text-white hover:bg-black/90"
                )}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-[-0.05em] leading-none text-foreground">Filters</h1>
            </div>
            <button
              onClick={handleReset}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border press-snappy shadow-lg",
                _isLight ? "surface-4 text-black hover:shadow-[var(--elev-5)]" : "bg-black/70 border-white/15 text-white hover:bg-black/90"
              )}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
        </div>
      )}

      {/* 🛸 SECTOR NAVIGATION */}
      <nav className={cn(
        "container mx-auto px-6 py-6 max-w-4xl",
        isEmbedded ? "px-0" : ""
      )}>
        <div className={cn("grid grid-cols-4 gap-2 p-1.5 rounded-[2.5rem]", _isLight ? "surface-section !p-2" : "border border-border bg-card/80 backdrop-blur-xl shadow-sm")}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => { haptics.tap(); setActiveCategory(cat.id as CategoryType); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-4 rounded-[2rem] transition-all duration-150 press-snappy tab-snappy relative overflow-hidden group",
                  !active && "text-foreground"
                )}
                style={active ? {
                  background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(255, 77, 0, 0.35)',
                  transform: 'scale(1.03)'
                } : undefined}
                {...(!active ? { 'data-inactive': true } : {})}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-black uppercase tracking-tighter">{cat.name}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 🛸 CLIENT INTENT FILTERS */}
      <div className="container mx-auto px-6 max-w-4xl mb-6">
        <div className="px-2 mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Looking For</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'all' as ClientType, label: 'All Types', icon: '⊞' },
            { id: 'buy' as ClientType, label: 'Buyers', icon: '💰' },
            { id: 'rent' as ClientType, label: 'Renters', icon: '🔑' },
            { id: 'hire' as ClientType, label: 'Leads', icon: '👥' },
            { id: 'individual' as ClientType, label: 'Individuals', icon: '👤' },
            { id: 'family' as ClientType, label: 'Families', icon: '👨‍👩‍👧‍👦' },
            { id: 'business' as ClientType, label: 'Business', icon: '🏢' },
          ]).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { haptics.tap(); setClientType(id); }}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider press-snappy tab-snappy",
                clientType === id
                  ? "bg-foreground text-background shadow-lg shadow-foreground/30"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="mr-1.5">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className={cn(
        "container mx-auto px-6 max-w-4xl flex-1 pb-32",
        isEmbedded ? "px-0" : ""
      )}>
        <AnimatePresence mode="sync">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="p-6 md:p-10 rounded-[3rem] border border-border bg-card/70 backdrop-blur-3xl shadow-xl"
          >
            {(() => {
              const mappedCategory = 
                (activeCategory as string) === 'leads' ? 'property' :
                (activeCategory as string) === 'motos' ? 'motorcycle' :
                (activeCategory as string) === 'bikes' ? 'bicycle' :
                (activeCategory as string) === 'jobs' ? 'service' :
                (activeCategory as string) === 'services' ? 'service' :
                'property';
                
              return (
                <DiscoveryFilters 
                  category={mappedCategory as any} 
                  onApply={handleApply} 
                  activeCount={0}
                  hideApplyButton={true}
                />
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 🛸 ENGAGEMENT FOOTER */}
      <div className={cn(
        "px-6 z-50",
        isEmbedded ? "mt-8 pb-12" : "mt-8 pb-8"
      )}>
        <div className="max-w-md mx-auto">
          <button
            onClick={() => {
              haptics.success();
              appToast.success('Filters applied', 'Your deck is updating.');
              handleFinalApply();
            }}
            className="w-full h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-xl flex items-center justify-center gap-4 group press-snappy"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)', color: '#ffffff', boxShadow: '0 20px 50px rgba(255, 77, 0, 0.35)' }}
          >
            <Sparkles className="w-6 h-6 md:w-7 md:h-7" />
            <span className="text-sm font-black uppercase italic tracking-[0.2em]">
              Apply Filters
            </span>
          </button>

          <button 
            onClick={handleReset}
            className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/70 hover:text-foreground press-snappy"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        </div>
      </div>

    </AmbientPageBackground>
  );

  return isEmbedded ? content : <div className="min-h-screen">{content}</div>;
}

