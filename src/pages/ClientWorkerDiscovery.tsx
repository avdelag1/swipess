import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { supabase } from '@/integrations/supabase/client';
import { useStartConversation } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Sparkles, Clock, CalendarDays, X, 
  MapPin, MessageCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { DiscoverySkeleton } from '@/components/ui/DiscoverySkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { WorkerCard, type WorkerListing } from '@/components/discovery/WorkerCard';

// 🚀 ZENITH: Explicit field selection to minimize payload
const WORKER_FIELDS = `
  id, title, description, price, images, city, service_category, 
  pricing_unit, experience_years, availability, owner_id, created_at, status,
  owner:profiles!listings_owner_id_fkey (
    user_id,
    full_name,
    avatar_url
  )
`;

function useWorkerListings(serviceTypeFilter?: string, pricingFilter?: string) {
  return useQuery({
    queryKey: ['worker-listings', serviceTypeFilter, pricingFilter],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select(WORKER_FIELDS)
        .eq('category', 'worker')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply pricing unit filter at DB level
      if (pricingFilter && pricingFilter !== 'all') {
        query = query.eq('pricing_unit', pricingFilter);
      }

      const { data: listings, error } = await query;
      if (error) throw error;
      return (listings || []) as unknown as WorkerListing[];
    },
  });
}

// Hire duration quick filter options
const HIRE_DURATION_FILTERS = [
  { value: 'all', label: 'All', description: 'Show all services' },
  { value: 'monthly', label: 'Monthly', description: 'Monthly hire' },
  { value: 'hourly', label: 'Hourly', description: 'Pay per hour' },
  { value: 'daily', label: 'Daily', description: 'Pay per day' },
  { value: 'project', label: 'Project', description: 'Project-based' },
] as const;

export default function ClientWorkerDiscovery() {
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [contactingId, setContactingId] = useState<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const { data: workers, isLoading, refetch, isRefetching } = useWorkerListings(undefined, selectedDuration);
  const startConversation = useStartConversation();

  const filteredWorkers = workers || [];

  const rowVirtualizer = useVirtualizer({
    count: filteredWorkers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 450, // Height of a WorkerCard
    overscan: 6,
  });

  // 🚀 ZENITH: Optimized contact handler with stable reference
  const handleContact = useCallback(async (userId: string) => {
    if (contactingId) return;
    setContactingId(userId);

    try {
      toast.loading('Starting conversation...', { id: 'contact-worker' });

      const result = await startConversation.mutateAsync({
        otherUserId: userId,
        initialMessage: "Hi! I'm interested in your services.",
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Opening chat...', { id: 'contact-worker' });
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      toast.error('Could not start conversation', {
        id: 'contact-worker',
        description: error instanceof Error ? error.message : 'Try again'
      });
    } finally {
      setContactingId(null);
    }
  }, [contactingId, startConversation, navigate]);

  const clearFilters = () => setSelectedDuration('all');
  const hasActiveFilters = selectedDuration !== 'all';

  return (
    <div className="min-h-[110dvh] pb-16 bg-background">
      {/* 🚀 Header: Glassmorphism + Sticky */}
      <div className="bg-background px-4 py-4 safe-top-padding">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center justify-center w-10 h-10 rounded-full bg-muted/30 border border-border/10 hover:bg-muted/50 transition-all active:scale-90"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/80" strokeWidth={1.5} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-500 mb-0.5">Discovery</span>
              <h1 className="text-lg font-black tracking-tight leading-none text-foreground">Services</h1>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 border border-border/10 text-foreground/70 hover:text-foreground transition-all active:rotate-180 disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          </button>
        </div>

        {/* 🚀 ZENITH: Smooth Filter Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {HIRE_DURATION_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                triggerHaptic('light');
                setSelectedDuration(filter.value);
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                selectedDuration === filter.value
                  ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/10 translate-y-[-1px]"
                  : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
              )}
            >
              {filter.value === 'monthly' && <CalendarDays className="w-3.5 h-3.5" />}
              {filter.value === 'hourly' && <Clock className="w-3.5 h-3.5" />}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-top-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mr-1">Active:</span>
            {selectedDuration !== 'all' && (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-muted/50 border-border/20 text-[10px] font-black uppercase tracking-widest rounded-lg">
                {HIRE_DURATION_FILTERS.find(f => f.value === selectedDuration)?.label}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => setSelectedDuration('all')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[10px] font-black uppercase tracking-widest h-6 px-2 text-rose-500 hover:bg-rose-500/10">
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* 🚀 Discovery Feed with Row Virtualization */}
      <div 
        className="px-4 pt-6 pb-24" 
        ref={parentRef}
      >
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DiscoverySkeleton count={6} />
          </div>
        ) : filteredWorkers && filteredWorkers.length > 0 ? (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const worker = filteredWorkers[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '24px' 
                  }}
                >
                  <WorkerCard
                    worker={worker}
                    onContact={handleContact}
                    // 🚀 ZENITH: Prioritize first two visible items for instant paint
                    priority={virtualRow.index <= 1}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center rounded-[3rem] border border-border/20 bg-muted/5 shadow-inner"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-muted/30 to-muted/10 border border-border/10 flex items-center justify-center mb-8 shadow-xl">
              <Sparkles className="w-12 h-12 text-rose-500/50 animate-pulse" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4 uppercase">Ghost Town</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold mb-10 uppercase tracking-tight">
              {hasActiveFilters
                ? "Your filters are too strict. No masters found matching those criteria."
                : "The future is coming. No master-level workers have registered in this sector yet."}
            </p>
            <button
              onClick={hasActiveFilters ? clearFilters : () => navigate('/client/dashboard')}
              className="px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-orange-500 shadow-rose-500/20"
            >
              {hasActiveFilters ? 'Vaporize Filters' : 'Phase Out'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}


