import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Target, Search, Sparkles } from 'lucide-react';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { useTheme } from '@/hooks/useTheme';
import { useFilterStore } from '@/state/filterStore';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

export default function OwnerFilters() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const activeCategory = useFilterStore(s => s.activeCategory);

  const handleApply = useCallback((filters: any) => {
    haptics.success();
    // Filters are already applied to store inside DiscoveryFilters via useFilterActions
    navigate('/owner/dashboard');
  }, [navigate]);

  return (
    <div className={cn(
      "min-h-screen pb-32 transition-colors duration-500 bg-background"
    )}>
      {/* 🛸 OWNER RADAR HEADER */}
      <div className={cn(
        "sticky top-0 z-50 backdrop-blur-3xl border-b pt-safe-top transition-all duration-300",
        "bg-background/80 border-white/5 shadow-2xl"
      )}>
        <div className="container mx-auto px-6 py-6 max-w-lg">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl border transition-all",
                "bg-white/5 border-white/10 text-white"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#3B82F6]">Prospect Shield</span>
              </div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none mt-1">Discovery</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pt-10 max-w-7xl">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-12"
        >
          {/* Section Description */}
          <div className="px-1 space-y-3">
             <div className="flex items-center gap-3">
                <div className="h-0.5 flex-1 bg-brand-primary/20" />
                <Sparkles className="w-5 h-5 text-brand-primary" />
                <div className="h-0.5 flex-1 bg-brand-primary/20" />
             </div>
             <p className="text-[11px] font-black uppercase text-center tracking-widest opacity-40 leading-relaxed px-4">
               Calibrate your radar to surface the most compatible {activeCategory || 'profiles'} within your vicinity.
             </p>
          </div>

          <DiscoveryFilters 
            category={activeCategory || 'property'}
            onApply={handleApply}
            activeCount={0}
          />
        </motion.div>
      </div>

      {/* Floating Action Button (Handled inside DiscoveryFilters or via separate footer if needed) */}
    </div>
  );
}
