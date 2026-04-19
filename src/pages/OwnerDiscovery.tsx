import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DiscoveryFilters } from '@/components/filters/DiscoveryFilters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, User, ArrowLeft, Sparkles, Building2, Bike, Trophy, Heart, Coins, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartClientMatching, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { triggerHaptic } from '@/utils/haptics';
import { Badge } from '@/components/ui/badge';
import { ClientCard } from '@/components/discovery/ClientCard';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import OwnerInterestedClients from './OwnerInterestedClients';
import OwnerLikedClients from './OwnerLikedClients';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';

type DiscoveryTab = 'radar' | 'interested' | 'saved';
type RadarCategory = 'property' | 'motorcycle' | 'bicycle' | 'worker';

export default function OwnerDiscovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { tokenBalance: tokens } = useMessagingQuota();
  
  const isDark = theme === 'dark' || theme === 'nexus-style';
  const isIvanna = theme === 'ivanna-style';

  const initialCategory = useMemo(() => {
    if (location.pathname.includes('/moto')) return 'motorcycle';
    if (location.pathname.includes('/bicycle')) return 'bicycle';
    return 'property';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState<DiscoveryTab>('radar');
  const [radarCategory, setRadarCategory] = useState<RadarCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const startConversation = useStartConversation();

  const clientFilters: ClientFilters | undefined = useMemo(() => {
    const mapped: ClientFilters = {};
    if (filters.age_min !== undefined) mapped.ageRange = [filters.age_min, filters.age_max || 100];
    if (filters.gender_preference && filters.gender_preference !== 'any') mapped.genders = [filters.gender_preference];
    if (filters.has_pets_filter && filters.has_pets_filter !== 'any') mapped.hasPets = filters.has_pets_filter === 'yes';
    if (filters.property_types && filters.property_types.length > 0) mapped.propertyTypes = filters.property_types;
    if (filters.moto_types && filters.moto_types.length > 0) mapped.motoTypes = filters.moto_types;
    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }, [filters]);

  const { data: clients = [], isLoading } = useSmartClientMatching(
    user?.id, 
    radarCategory, 
    0, 20, false, clientFilters
  );

  const filteredClients = useMemo(() => 
    (clients || []).filter(client => client.name?.toLowerCase()?.includes(searchQuery.toLowerCase())),
    [clients, searchQuery]
  );

  const activeFilterCount = useMemo(() => 
    Object.keys(filters).filter(key => {
      const value = filters[key as keyof typeof filters];
      return value && (Array.isArray(value) ? value.length > 0 : true);
    }).length,
    [filters]
  );

  const handleApplyFilters = useCallback((newFilters: any) => {
    triggerHaptic('light');
    setFilters(newFilters);
  }, []);

  const handleConnect = useCallback(async (clientId: string) => {
    if (isCreatingConversation) return;
    setIsCreatingConversation(true);
    try {
      sonnerToast.loading('Using 1 token to connect...', { id: 'start-conv' });
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: `Hi! I noticed your profile on the ${radarCategory} radar. Let's discuss!`,
        canStartNewConversation: true,
      });
      if (result?.conversationId) {
        sonnerToast.success('Connection established!', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (_error) {
      sonnerToast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, startConversation, navigate, radarCategory]);

  const handleViewProfile = useCallback((clientId: string) => {
    navigate(`/owner/view-client/${clientId}`);
  }, [navigate]);

  return (
    <div className={cn(
        "min-h-screen transition-colors duration-500",
        theme === 'nexus-style' ? "bg-black text-white" : 
        (isIvanna ? "bg-transparent text-foreground ivanna-style" : "bg-background text-foreground")
    )}>
      <div className="pb-2 pt-2 px-0 safe-top-padding">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/owner/dashboard')}
                className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 border",
                    isDark ? "bg-muted/40 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                )}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Prospect Shield</span>
                <h1 className="text-xl md:text-2xl font-bold leading-snug">Discovery</h1>
              </div>
            </div>
            <div className="px-3.5 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary tabular-nums">{tokens || 0}</span>
            </div>
          </div>

          <div className={cn("flex p-1 rounded-2xl mb-4 border", isDark ? "bg-muted/30 border-white/5" : "bg-slate-100 border-slate-200")}>
             {[
               { id: 'radar', icon: Sparkles, label: 'Radar' },
               { id: 'interested', icon: Heart, label: 'Fans' },
               { id: 'saved', icon: Trophy, label: 'Saved' }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => { triggerHaptic('light'); setActiveTab(tab.id as DiscoveryTab); }}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors duration-150",
                   activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary" : "")} />
                 <span className="hidden sm:inline">{tab.label}</span>
               </button>
             ))}
          </div>

          {activeTab === 'radar' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex p-1 rounded-xl", isDark ? "bg-muted/20" : "bg-slate-200")}>
                   {[
                     { id: 'property', icon: Building2, label: 'Properties' },
                     { id: 'motorcycle', icon: Bike, label: 'Motorcycles' },
                     { id: 'bicycle', icon: Trophy, label: 'Bicycles' },
                     { id: 'worker', icon: Wrench, label: 'Workers' }
                   ].map((cat) => (
                     <button
                       key={cat.id}
                       onClick={() => {
                         triggerHaptic('medium');
                         setRadarCategory(cat.id as RadarCategory);
                         setShowMapView(true);
                       }}
                       className={cn(
                         "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                         radarCategory === cat.id ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:bg-muted/40"
                       )}
                     >
                       <cat.icon className="w-5 h-5" />
                     </button>
                   ))}
                </div>

                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search profile name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                        "pl-11 h-12 rounded-2xl transition-all font-bold italic",
                        isDark ? "bg-muted/20 border-white/5" : "bg-white border-slate-200"
                    )}
                  />
                </div>

                <button
                  onClick={() => { triggerHaptic('medium'); navigate('/owner/dashboard'); }}
                  className="h-12 px-6 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-primary text-white border border-primary shadow-[0_10px_20px_rgba(235,72,152,0.3)] transition-all duration-300 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Launch Matching Deck
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 pb-8">
         {activeTab === 'interested' ? (<OwnerInterestedClients />) :
          activeTab === 'saved' ? (<OwnerLikedClients />) : (
            <div className="flex flex-col lg:flex-row gap-6">
               <aside className="hidden lg:block w-80">
                <div className="sticky top-44 space-y-4">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters</h2>
                    {activeFilterCount > 0 && (
                      <button onClick={() => setFilters({})} className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors duration-150">Reset</button>
                    )}
                  </div>
                  <DiscoveryFilters category={(radarCategory === 'worker' ? 'service' : radarCategory) as 'property' | 'motorcycle' | 'bicycle' | 'service'} onApply={handleApplyFilters} initialFilters={filters} activeCount={activeFilterCount} />
                </div>
              </aside>
              <main className="flex-1">
                <AnimatePresence mode="popLayout">
                  {isLoading ? (<DiscoverySkeleton count={6} />) : 
                   filteredClients.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn(
                        "flex flex-col items-center justify-center py-20 rounded-[3rem] border text-center",
                        isDark ? "bg-muted/5 border-white/5" : "bg-white border-slate-200"
                    )}>
                      <User className="h-16 w-16 text-muted-foreground/20 mb-5" />
                      <h3 className="text-xl md:text-2xl font-bold leading-snug mb-2">No prospects yet</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">Adjust filters to surface active clients.</p>
                    </motion.div>
                   ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredClients.map((client, idx) => (
                        <motion.div key={client.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                          <ClientCard client={client} onConnect={handleConnect} onViewProfile={handleViewProfile} />
                        </motion.div>
                      ))}
                    </div>
                   )}
                </AnimatePresence>
              </main>
            </div>
          )}
      </div>
    </div>
  );
}
