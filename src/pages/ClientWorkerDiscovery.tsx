/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStartConversation } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Search, Filter, RefreshCw, X, Sparkles, MapPin, DollarSign, Clock, MessageCircle, Star, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES, PRICING_UNITS } from '@/components/WorkerListingForm';

interface WorkerListing {
  id: string;
  title: string | null;
  description: string | null;
  price: number | null;
  images: string[] | null;
  city: string | null;
  country?: string | null;
  service_category?: string | null;
  custom_service_name?: string | null;
  pricing_unit?: string | null;
  availability?: string | null;
  experience_years?: number | null;
  languages?: string[] | null;
  owner_id: string;
  created_at: string | null;
  status: string | null;
  owner?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

function useWorkerListings(serviceTypeFilter?: string) {
  return useQuery({
    queryKey: ['worker-listings', serviceTypeFilter],
    queryFn: async () => {
      const query = (supabase as any)
        .from('listings')
        .select('*')
        .eq('category', 'worker')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data: listings, error } = await query;

      if (error) throw error;

      // Fetch owner profiles separately
      if (listings && listings.length > 0) {
        const ownerIds = listings.map(l => l.owner_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', ownerIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        return listings.map(l => ({
          id: l.id,
          title: l.title,
          description: l.description,
          price: l.price,
          images: l.images,
          city: l.city,
          owner_id: l.owner_id,
          created_at: l.created_at,
          status: l.status,
          owner: profileMap.get(l.owner_id) || null,
        })) as WorkerListing[];
      }

      return [] as WorkerListing[];
    },
  });
}

function WorkerCard({ worker, onContact }: { worker: WorkerListing; onContact: (userId: string) => void }) {
  const categoryInfo = SERVICE_CATEGORIES.find(c => c.value === worker.service_category);
  const pricingInfo = PRICING_UNITS.find(p => p.value === worker.pricing_unit);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50">
      <div className="relative aspect-[4/3] bg-muted">
        {worker.images?.[0] ? (
          <img
            src={worker.images[0]}
            alt={worker.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
            <Briefcase className="w-12 h-12 text-primary/50" />
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm">
          {categoryInfo?.icon} {categoryInfo?.label || worker.service_category}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and Owner */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">{worker.title}</h3>
          {worker.owner && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                {worker.owner.avatar_url ? (
                  <img src={worker.owner.avatar_url} alt={worker.owner.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">{worker.owner.full_name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {worker.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{worker.description}</p>
        )}

        {/* Details */}
        <div className="flex flex-wrap gap-2 text-xs">
          {worker.city && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {worker.city}
            </span>
          )}
          {worker.experience_years && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Star className="w-3 h-3" />
              {worker.experience_years} yrs exp
            </span>
          )}
          {worker.availability && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              {worker.availability.slice(0, 20)}...
            </span>
          )}
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-lg">
              {worker.price > 0 ? `$${worker.price}` : 'Quote'}
            </span>
            {worker.price > 0 && pricingInfo && (
              <span className="text-xs text-muted-foreground">
                /{pricingInfo.label.replace('Per ', '')}
              </span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onContact(worker.owner_id)}
            className="gap-1"
          >
            <MessageCircle className="w-4 h-4" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientWorkerDiscovery() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workers, isLoading, refetch, isRefetching } = useWorkerListings(selectedType);
  const startConversation = useStartConversation();
  const [contactingId, setContactingId] = useState<string | null>(null);

  // Filter workers by search query
  const filteredWorkers = workers?.filter(worker => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      worker.title?.toLowerCase()?.includes(query) ||
      worker.owner?.full_name?.toLowerCase()?.includes(query) ||
      worker.city?.toLowerCase()?.includes(query) ||
      worker.description?.toLowerCase()?.includes(query)
    );
  });

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

  const clearFilters = () => {
    setSelectedType(undefined);
    setSearchQuery('');
  };

  return (
    <>
      <div className="min-h-screen pb-16">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Find Services</h1>
                <p className="text-xs text-muted-foreground">
                  Browse skilled professionals
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="pl-9 bg-background/50"
              />
            </div>
            <Select
              value={selectedType || 'all'}
              onValueChange={(v) => setSelectedType(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[160px] bg-background/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {SERVICE_CATEGORIES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(selectedType || searchQuery) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {selectedType && (
                <Badge variant="secondary" className="gap-1">
                  {SERVICE_CATEGORIES.find(t => t.value === selectedType)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedType(undefined)}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6">
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredWorkers && filteredWorkers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filteredWorkers.map((worker, index) => (
                  <motion.div
                    key={worker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <WorkerCard
                      worker={worker}
                      onContact={handleContact}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Services Found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-4">
                {selectedType || searchQuery
                  ? "Try adjusting your filters to find more service providers"
                  : "Service providers will appear here once sellers list their services"}
              </p>
              {(selectedType || searchQuery) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}
