import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useActiveMode } from '@/hooks/useActiveMode';
import { useFilterStore } from '@/state/filterStore';
import ClientDashboard from './ClientDashboard';
import EnhancedOwnerDashboard from '@/components/EnhancedOwnerDashboard';
import { MyHubProfileHeader } from '@/components/MyHubProfileHeader';
import { MyHubQuickFilters } from '@/components/MyHubQuickFilters';
import { MyHubActivityFeed } from '@/components/MyHubActivityFeed';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, LayoutGrid, Zap, Heart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 🚀 THE UNIFIED HUB (My Marketplace Hub)
 * This is now the ONLY dashboard. 
 * It dynamically blends 'Looking' and 'Offering' based on context and filters.
 */
export default function MyHub() {
    const { user } = useAuth();
    const { activeMode } = useActiveMode();

    // Connect to the global filter state
    const filterVersion = useFilterStore((s) => s.filterVersion);
    const getListingFilters = useFilterStore((s) => s.getListingFilters);
    const storeFilters = useMemo(() => getListingFilters() as any, [filterVersion]);

    return (
        <div className="w-full min-h-screen bg-background pb-32 overflow-x-hidden">
            {/* Background Visual Depth Layers */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent-2/5 blur-[120px] rounded-full animate-float-slow" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-primary/5 blur-[100px] rounded-full animate-float-delayed" />
            </div>

            <div className="relative w-full max-w-lg mx-auto px-4 pt-[calc(56px+var(--safe-top)+1.5rem)] sm:px-6">

                {/* Step 2.1: The Unified Presence (Profile as Listing) */}
                <MyHubProfileHeader />

                {/* Step 2.2: The Quick Filter Access */}
                <MyHubQuickFilters />

                {/* Step 2.3: Activity Feed (Real-Time Liveness) */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                        Marketplace Feed
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-2 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-white/50 tracking-tighter">Live Updates</span>
                    </div>
                </div>

                <MyHubActivityFeed />

                {/* 
          STEP 2.4: Discovery Feed
          Rapidity: Directly integrated swipe context
        */}
                <div className="mt-12 flex items-center gap-2 mb-4 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent-2" />
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                        Smart Discoveries
                    </h3>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative z-10"
                >
                    {activeMode === 'client' ? (
                        <ClientDashboard filters={storeFilters} />
                    ) : (
                        <EnhancedOwnerDashboard filters={storeFilters} />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
