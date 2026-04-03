import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PropertyClientFilters } from '@/components/filters/PropertyClientFilters';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Filter, User, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSmartClientMatching, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useStartConversation } from '@/hooks/useConversations';
import { toast as sonnerToast } from 'sonner';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { Badge } from '@/components/ui/badge';
import { ClientCard } from '@/components/discovery/ClientCard';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';

export default function OwnerPropertyClientDiscovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // 🚀 Convert filters from UI format to Smart Matching context
  const clientFilters: ClientFilters | undefined = useMemo(() => {
    if (Object.keys(filters).length === 0) return undefined;
    const mapped: ClientFilters = {};
    if (filters.budget_min !== undefined || filters.budget_max !== undefined) {
      mapped.budgetRange = [filters.budget_min ?? 0, filters.budget_max ?? 100000];
    }
    if (filters.age_min !== undefined || filters.age_max !== undefined) {
      mapped.ageRange = [filters.age_min ?? 18, filters.age_max ?? 100];
    }
    if (filters.gender_preference && filters.gender_preference !== 'any') {
      mapped.genders = [filters.gender_preference];
    }
    if (filters.has_pets_filter && filters.has_pets_filter !== 'any') {
      mapped.hasPets = filters.has_pets_filter === 'yes';
    }
    if (filters.verified) mapped.verified = true;
    if (filters.nationalities && filters.nationalities.length > 0) mapped.nationalities = filters.nationalities;
    if (filters.languages && filters.languages.length > 0) mapped.languages = filters.languages;
    if (filters.relationship_status && filters.relationship_status.length > 0) mapped.relationshipStatus = filters.relationship_status;
    if (filters.property_types && filters.property_types.length > 0) mapped.propertyTypes = filters.property_types;
    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }, [filters]);

  const { data: clients = [], isLoading, refetch } = useSmartClientMatching(user?.id, 'property', 0, 10, false, clientFilters);
  const startConversation = useStartConversation();

  const filteredClients = (clients || []).filter(client =>
    client.name?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof typeof filters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  const handleApplyFilters = useCallback((newFilters: any) => {
    triggerHaptic('light');
    setFilters(newFilters);
  }, []);

  const handleConnect = useCallback(async (clientId: string) => {
    if (isCreatingConversation) return;
    setIsCreatingConversation(true);
    try {
      sonnerToast.loading('Starting conversation...', { id: 'start-conv' });
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: "Hi! I noticed your profile and think my property would be a great fit. Would you like to connect?",
        canStartNewConversation: true,
      });
      if (result?.conversationId) {
        sonnerToast.success('Opening chat...', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) logger.error('Error starting conversation:', error);
      sonnerToast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, startConversation, navigate]);

  const handleViewProfile = useCallback((clientId: string) => {
    navigate(`/owner/view-client/${clientId}`);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 lg:pb-0">
      {/* 🚀 ZENITH HEADER */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 safe-top-padding">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/40 border border-border/10 hover:bg-muted transition-all active:scale-90"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground/80" strokeWidth={2.5} />
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500 mb-0.5 animate-pulse">Live Radar</span>
                <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground">Top Prospects</h1>
              </div>
            </div>
            <Button 
               variant="outline" 
               onClick={() => navigate('/owner/properties')}
               className="rounded-full h-10 px-6 font-black uppercase tracking-widest text-[10px] hidden sm:flex"
            >
              My Listings
            </Button>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative flex-1 group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <Input
                 placeholder="Search by name..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="pl-11 h-12 rounded-2xl bg-muted/20 border-border/20 focus:bg-muted/40 transition-all font-bold placeholder:font-normal"
               />
             </div>
             <button
               onClick={() => refetch()}
               className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/20 border border-border/20 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all active:scale-90"
               title="Refresh feed"
             >
               <Sparkles className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-80 space-y-6">
            <div className="sticky top-44 space-y-4">
               <div className="flex items-center justify-between px-2 mb-2">
                 <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Laser Filters</h2>
                 {activeFilterCount > 0 && (
                   <button onClick={() => handleApplyFilters({})} className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600">
                     Reset
                   </button>
                 )}
               </div>
               <PropertyClientFilters
                 onApply={handleApplyFilters}
                 initialFilters={filters}
                 activeCount={activeFilterCount}
               />
            </div>
          </aside>

          {/* Activity Feed */}
          <main className="flex-1">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <DiscoverySkeleton count={6} />
                </div>
              ) : filteredClients.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[3rem] border border-border/10 text-center shadow-inner"
                >
                  <div className="w-24 h-24 rounded-full bg-muted/20 flex items-center justify-center mb-6 shadow-xl">
                    <User className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">Radar Ghosting</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm font-bold uppercase tracking-widest leading-loose">
                    Adjust your laser filters to find active targets.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredClients.map((client, idx) => (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <ClientCard 
                        client={client} 
                        onConnect={handleConnect} 
                        onViewProfile={handleViewProfile} 
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* 🚀 MOBILE QUICK FILTER FLOAT */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="lg" className="rounded-full h-14 px-8 shadow-2xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase tracking-widest text-[11px] border border-white/20">
              <Filter className="h-4 w-4 mr-2" />
              Scan Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">{activeFilterCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] bg-background p-0 border-t-0 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="h-1.5 w-12 bg-muted/40 rounded-full mx-auto my-4" />
            <div className="px-6 pb-6 overflow-y-auto h-full touch-pan-y">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-black uppercase tracking-tighter text-2xl">Radar Scope</SheetTitle>
              </SheetHeader>
              <PropertyClientFilters
                onApply={handleApplyFilters}
                initialFilters={filters}
                activeCount={activeFilterCount}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
