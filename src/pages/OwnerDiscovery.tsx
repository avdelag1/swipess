import { useState, useMemo, useCallback, Suspense, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Building2, Bike, Trophy, Heart, Coins, Wrench, User, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSmartClientMatching, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { triggerHaptic } from '@/utils/haptics';
import { ClientCard } from '@/components/discovery/ClientCard';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import OwnerInterestedClients from './OwnerInterestedClients';
import OwnerLikedClients from './OwnerLikedClients';
import { cn } from '@/lib/utils';
import { DiscoveryMapView } from '@/components/swipe/DiscoveryMapView';
import { useFilterStore } from '@/state/filterStore';
import useAppTheme from '@/hooks/useAppTheme';

type DiscoveryTab = 'radar' | 'interested' | 'saved';
type RadarCategory = 'property' | 'motorcycle' | 'bicycle' | 'worker';

function OwnerDiscovery() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { tokenBalance: tokens } = useMessagingQuota();
  const isLight = theme === 'light';

  const initialCategory = useMemo(() => {
    if (location.pathname.includes('/moto')) return 'motorcycle';
    if (location.pathname.includes('/bicycle')) return 'bicycle';
    return 'property';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState<DiscoveryTab>('radar');
  const [radarCategory, setRadarCategory] = useState<RadarCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMapView, setShowMapView] = useState(false);
  const startConversation = useStartConversation();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Sync with global store
  // Sync with global store
  const clientAgeRange = useFilterStore(s => s.clientAgeRange);
  const clientGender = useFilterStore(s => s.clientGender);
  const petFriendly = useFilterStore(s => s.petFriendly);
  const propertyTypes = useFilterStore(s => s.propertyTypes);
  const motoTypes = useFilterStore(s => s.motoTypes);
  const bicycleTypes = useFilterStore(s => s.bicycleTypes);

  const clientFilters: ClientFilters | undefined = useMemo(() => {
    const mapped: ClientFilters = {};
    if (clientAgeRange) mapped.ageRange = clientAgeRange;
    if (clientGender && clientGender !== 'any') mapped.genders = [clientGender];
    if (petFriendly) mapped.hasPets = true;
    if (propertyTypes && propertyTypes.length > 0) mapped.propertyTypes = propertyTypes;
    if (motoTypes && motoTypes.length > 0) mapped.motoTypes = motoTypes;
    if (bicycleTypes && bicycleTypes.length > 0) mapped.bicycleTypes = bicycleTypes;
    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }, [clientAgeRange, clientGender, petFriendly, propertyTypes, motoTypes, bicycleTypes]);

  const { data: clients = [], isLoading } = useSmartClientMatching(
    user?.id, 
    radarCategory, 
    0, 20, false, clientFilters
  );

  const filteredClients = useMemo(() => 
    (clients || []).filter(client => client.name?.toLowerCase()?.includes(searchQuery.toLowerCase())),
    [clients, searchQuery]
  );

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
    <div className={cn("min-h-screen pb-24 lg:pb-0 transition-colors duration-500", isLight ? "bg-[#F8FAFC]" : "bg-black text-white")}>
      <div className="bg-transparent pb-4 pt-2 px-0 safe-top-padding">
        <div className="container mx-auto px-4 py-4 pt-24">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/owner/dashboard')}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/40 border border-border/10 hover:bg-muted transition-all active:scale-90"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Prospect Shield</span>
                <h1 className="text-xl md:text-2xl font-bold leading-snug italic uppercase tracking-tighter">Discovery Hub</h1>
              </div>
            </div>
            <div className="px-3.5 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary tabular-nums">{tokens || 0}</span>
            </div>
          </div>

          <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl mb-8 border border-white/5 max-w-2xl mx-auto shadow-2xl">
             {[
               { id: 'radar', icon: Sparkles, label: 'Radar' },
               { id: 'interested', icon: Heart, label: 'Fans' },
               { id: 'saved', icon: Trophy, label: 'Saved' }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => { triggerHaptic('light'); setActiveTab(tab.id as DiscoveryTab); }}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                   activeTab === tab.id 
                    ? (isLight ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-lg") 
                    : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <tab.icon className={cn("w-4 h-4", activeTab === tab.id && (isLight ? "text-white" : "text-primary"))} />
                 <span>{tab.label}</span>
               </button>
             ))}
          </div>

          {activeTab === 'radar' && (
            <div className="flex flex-col gap-8">
              {/* Category Cards Row */}
              <div className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                  { id: 'property', icon: Building2, label: 'Leads', image: '/images/filters/property.png' },
                  { id: 'motorcycle', icon: Bike, label: 'Motos', image: '/images/filters/scooter.png' },
                  { id: 'bicycle', icon: Trophy, label: 'Bikes', image: '/images/filters/bicycle.png' },
                  { id: 'worker', icon: Wrench, label: 'Jobs', image: '/images/filters/workers.png' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { 
                      triggerHaptic('medium'); 
                      setRadarCategory(cat.id as RadarCategory);
                    }}
                    className={cn(
                      "relative flex-shrink-0 w-24 h-36 rounded-[2.2rem] overflow-hidden border transition-all duration-300 group active:scale-[0.96] shadow-xl",
                      radarCategory === cat.id 
                        ? 'border-primary ring-2 ring-primary/50 scale-[1.05] z-10 shadow-primary/20' 
                        : 'border-white/5 opacity-80 hover:opacity-100'
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                    <img 
                      src={cat.image} 
                      alt={cat.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-white p-4">
                      <cat.icon className={cn("w-7 h-7 mb-2 transition-all duration-500", radarCategory === cat.id ? "scale-110 text-primary drop-shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.8)]" : "text-white/60")} />
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-60 mb-0.5">Sector</span>
                      <span className="text-[11px] font-black uppercase tracking-widest drop-shadow-md text-center">{cat.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Search and Map Controls Row */}
              <div className="flex flex-col sm:flex-row items-center gap-4 max-w-3xl mx-auto w-full">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  <Input
                    placeholder="Search radar signatures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 rounded-[1.5rem] bg-white/5 border-white/5 focus:bg-white/10 transition-all font-black uppercase tracking-widest text-xs"
                  />
                </div>

                <button
                  onClick={() => { triggerHaptic('medium'); setShowMapView(!showMapView); }}
                  className={cn(
                    "h-14 px-8 rounded-[1.5rem] flex items-center gap-3 text-xs font-black uppercase tracking-widest border transition-all duration-300 active:scale-95 w-full sm:w-auto whitespace-nowrap shadow-lg",
                    showMapView 
                      ? "bg-primary text-white border-primary shadow-[0_10px_30px_rgba(var(--brand-primary-rgb),0.3)] scale-[1.05] z-10 relative" 
                      : (isLight 
                        ? "bg-white border-slate-300 text-black font-black hover:bg-slate-50 shadow-sm" 
                        : "bg-black/40 border-white/10 text-white/60 hover:bg-white/5 hover:text-white font-black")
                  )}
                >
                  <Sparkles className={cn("w-4 h-4", showMapView && "animate-pulse")} />
                  {showMapView ? 'Deactivate Radar Map' : 'Activate Radar Map'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
         {activeTab === 'interested' ? (<OwnerInterestedClients />) :
          activeTab === 'saved' ? (<OwnerLikedClients />) : (
            <div className="w-full">
              {showMapView ? (
                <div className="w-full h-[65vh] rounded-[3.5rem] overflow-hidden border border-white/10 shadow-2xl relative z-0 mb-12">
                  <DiscoveryMapView
                    category={radarCategory === 'worker' ? 'services' : radarCategory}
                    onBack={() => setShowMapView(false)}
                    onStartSwiping={() => navigate('/owner/dashboard')}
                    onCategoryChange={(cat) => setRadarCategory((cat === 'services' ? 'worker' : cat) as RadarCategory)}
                    mode="owner"
                    isEmbedded={true}
                  />
                </div>
              ) : (
                <div className="w-full">
                   <AnimatePresence mode="popLayout">
                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <DiscoverySkeleton count={8} />
                      </div>
                    ) : filteredClients.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] bg-white/[0.02] border border-white/5 text-center px-6"
                      >
                        <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 border border-primary/10">
                          <User className="h-10 w-10 text-primary/40" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-3">No radar signatures found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">Recalibrate your radar filters to broaden the scan area.</p>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredClients.map((client, idx) => (
                          <motion.div 
                            key={client.id} 
                            initial={{ opacity: 0, y: 30 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
                          >
                            <ClientCard client={client} onConnect={handleConnect} onViewProfile={handleViewProfile} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default memo(OwnerDiscovery);
