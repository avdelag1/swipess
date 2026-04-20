import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { POKER_CARDS } from '@/components/swipe/SwipeConstants';
import { ChevronLeft, Filter, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilterActions, useFilterStore } from '@/state/filterStore';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

/**
 * 🛰️ OWNER RADAR NEXUS - UNIFIED EXPERIENCE
 * Replaces the old Grid Discovery with the high-performance Radar Nexus Map.
 * ONE MAP, ONE STYLE across the entire Swipess ecosystem.
 */
export default function OwnerDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { activeCategory, radiusKm } = useFilterStore();
  const { setActiveCategory, setRadiusKm, setCategories } = useFilterActions();
  
  const [showFilters, setShowFilters] = useState(false);
  
  const handleBack = useCallback(() => {
    triggerHaptic('light');
    navigate('/owner/dashboard');
  }, [navigate]);

  const handleIgnite = useCallback(() => {
    triggerHaptic('heavy');
    // Ensure we trigger the swipe deck in the dashboard
    if (activeCategory) {
      setCategories([activeCategory]);
      navigate('/owner/dashboard');
    } else {
      setCategories(['property']);
      setActiveCategory('property');
      navigate('/owner/dashboard');
    }
  }, [activeCategory, navigate, setCategories, setActiveCategory]);

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden relative">
      
      {/* 🚀 THE UNIFIED MAP ENGINE (RADAR CONTEXT) */}
      <DiscoveryMapView 
        onBack={handleBack}
        onStartSwiping={handleIgnite}
        isEmbedded={false}
      />

      {/* 🛠️ ADDITIONAL OWNER CONTROLS (Floating) */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3">
         <Button
           variant="ghost"
           size="icon"
           onClick={() => { triggerHaptic('medium'); setShowFilters(true); }}
           className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 text-white/60 hover:text-white"
         >
            <Filter className="w-5 h-5" />
         </Button>
      </div>

      {/* 📡 FILTER SHEET (Owner Context) */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
         <SheetContent side="bottom" className="h-[92vh] p-0 border-none bg-transparent overflow-hidden">
            <div className="w-full h-full glass-morphism rounded-t-[3.5rem] border-t border-white/10 overflow-y-auto">
               <div className="sticky top-0 z-[60] flex items-center justify-center pt-4 pb-2">
                  <div className="w-12 h-1.5 bg-white/20 rounded-full" />
               </div>
               <div className="px-8 pb-20 pt-4">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 leading-none mb-1">Target Engine</span>
                        <h2 className="text-xl font-black uppercase tracking-widest italic text-white">Client Radar Filters</h2>
                     </div>
                  </div>
                  
                  <DiscoveryFilters
                    category={(activeCategory as any) || 'property'}
                    onApply={() => setShowFilters(false)}
                    activeCount={0}
                  />
               </div>
            </div>
         </SheetContent>
      </Sheet>

      {/* Flagship Info Overlays */}
      <div className="absolute bottom-32 left-6 right-6 z-10 pointer-events-none flex justify-center">
         <div className="bg-black/60 backdrop-blur-3xl border border-white/5 py-1 px-4 rounded-full">
            <span className="text-[8px] font-black tracking-[0.5em] text-white/20 uppercase">
              Omni-Discovery v3.0 | Radar Active
            </span>
         </div>
      </div>

    </div>
  );
}
