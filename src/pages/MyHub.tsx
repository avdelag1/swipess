import { useAuth } from '@/hooks/useAuth';
import { useActiveMode } from '@/hooks/useActiveMode';
import ClientDashboard from './ClientDashboard';
import EnhancedOwnerDashboard from '@/components/EnhancedOwnerDashboard';
import { MyHubProfileHeader } from '@/components/MyHubProfileHeader';
import { MyHubQuickFilters } from '@/components/MyHubQuickFilters';
import { MyHubActivityFeed } from '@/components/MyHubActivityFeed';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MyHub() {
    const { user: _user } = useAuth();
    const { activeMode } = useActiveMode();

    return (
        <div className="w-full min-h-screen bg-background pb-32 overflow-x-hidden">
            <div className="relative w-full max-w-lg mx-auto px-4 pt-6 sm:px-6">

                <MyHubProfileHeader />
                <MyHubQuickFilters />

                {/* Activity Feed */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                        Marketplace Feed
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent-2 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Live Updates</span>
                    </div>
                </div>

                <MyHubActivityFeed />

                {/* Discovery Feed */}
                <div className="mt-12 flex items-center gap-2 mb-4 px-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent-2" />
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
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
                        <ClientDashboard />
                    ) : (
                        <EnhancedOwnerDashboard />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
