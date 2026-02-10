import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientProfileCard } from "@/components/ClientProfileCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, MessageCircle, Users, Search, MapPin, RefreshCw, Home, Car, Ship, Bike, Flag, Ban, MoreVertical, Trash2, Eye, ArrowLeft, Heart, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { logger } from "@/utils/prodLogger";
import { getCardImageUrl, getThumbnailUrl } from "@/utils/imageOptimization";
import { MessageQuotaDialog } from "@/components/MessageQuotaDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LikedClientInsightsModal } from "@/components/LikedClientInsightsModal";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LikedClient {
  id: string;
  user_id: string;
  full_name: string;
  name: string;
  age: number;
  bio: string;
  profile_images: string[];
  images: string[];
  location: any;
  liked_at: string;
  occupation?: string;
  nationality?: string;
  interests?: string[];
  monthly_income?: string;
  verified?: boolean;
  property_types?: string[];
  moto_types?: string[];
  bicycle_types?: string[];
  // Background check fields (optional - may not exist in all data sources)
  has_criminal_record?: boolean;
  background_check_status?: 'passed' | 'failed' | 'pending' | null;
  criminal_record_type?: string | null;
}

export function LikedClients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<LikedClient | null>(null);
  const [filterSafeOnly, setFilterSafeOnly] = useState(true); // Filter out clients with criminal records by default

  // Use React Query-based hook for role - prevents menu flickering
  const { data: fetchedRole } = useUserRole(user?.id);
  const userRole = fetchedRole || 'owner';
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedClientForAction, setSelectedClientForAction] = useState<LikedClient | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();

  // Category configuration - matches ClientLikedProperties categories
  const categories = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'property', label: 'Property', icon: Home },
    { id: 'motorcycle', label: 'Motos', icon: Car },
    { id: 'bicycle', label: 'Bicycle', icon: Bike },
    { id: 'worker', label: 'Services', icon: Users }
  ];

  const { data: likedClients = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['liked-clients', user?.id],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) {
        logger.warn('[LikedClients] No user ID, returning empty array');
        return [];
      }

      logger.info('[LikedClients] Fetching liked clients for owner:', user.id);

      // Get likes from likes table (owner → client likes using target_type='profile', direction='like')
      const { data: ownerLikes, error: likesError } = await supabase
        .from('likes')
        .select('target_id, created_at')
        .eq('user_id', user.id)
        .eq('target_type', 'profile')
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (likesError) {
        logger.error('[LikedClients] Error fetching owner likes:', {
          error: likesError,
          errorCode: likesError.code,
          errorMessage: likesError.message,
          ownerId: user.id
        });
        throw likesError;
      }

      logger.info('[LikedClients] Found owner likes:', { count: ownerLikes?.length || 0 });

      if (!ownerLikes || ownerLikes.length === 0) {
        logger.info('[LikedClients] No owner likes found, returning empty array');
        return [];
      }

      const targetIds = ownerLikes.map(like => like.target_id);

      // First try with inner join to get only clients
      let profiles: any[] = [];
      const { data: clientProfiles, error: clientProfilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .in('id', targetIds)
        .eq('user_roles.role', 'client');

      if (!clientProfilesError && clientProfiles && clientProfiles.length > 0) {
        profiles = clientProfiles;
      } else {
        // Fallback: Get all profiles and filter by checking if they're NOT owners
        // This handles cases where user_roles entry might be missing
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', targetIds);

        if (allProfilesError) {
          logger.error('[LikedClients] Error fetching profiles:', allProfilesError);
          throw allProfilesError;
        }

        if (allProfiles && allProfiles.length > 0) {
          // Check which ones are owners to exclude them
          const { data: ownerRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .in('user_id', targetIds)
            .eq('role', 'owner');

          const ownerIds = new Set((ownerRoles || []).map(r => r.user_id));

          // Filter out owners - keep everyone else (clients or users without role)
          profiles = allProfiles.filter(p => !ownerIds.has(p.id));
        }
      }

      if (!profiles || profiles.length === 0) return [];

      // FIX: Show ALL liked clients without category filtering
      // Owners should see every client they liked, regardless of category matching
      // Category filtering is done via the UI tabs, not in the data fetch

      // Return the client profiles with like data
      const likedClientsList = profiles.map(profile => {
        const like = ownerLikes.find((l: any) => l.client_id === profile.id);
        return {
          id: profile.id,
          user_id: profile.id,
          full_name: profile.full_name || 'Unknown',
          name: profile.full_name || 'Unknown',
          age: profile.age || 0,
          bio: profile.bio || '',
          profile_images: profile.images || [],
          images: profile.images || [],
          location: profile.location,
          liked_at: like?.created_at || '',
          occupation: profile.occupation,
          nationality: profile.nationality,
          interests: profile.interests,
          monthly_income: profile.monthly_income,
          verified: profile.verified,
          // FIXED: Use correct column names that exist in profiles table
          property_types: profile.preferred_property_types || [],
          moto_types: [],  // These don't exist on profiles - use filter preferences table if needed
          bicycle_types: []
        };
      }) as LikedClient[];

      // Deduplicate by client ID and keep the most recent like
      const deduplicatedClients = Array.from(
        new Map(likedClientsList.map(client => [client.id, client])).values()
      ).sort((a, b) => new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime());

      return deduplicatedClients;
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // FIX: Changed from Infinity to 60 seconds - allow refetching when invalidated
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
    refetchOnMount: true, // FIX: Changed to true - refetch when component mounts to get latest data
    refetchOnReconnect: false, // Don't refetch when internet reconnects
    // NO refetchInterval - rely purely on optimistic updates and manual invalidations
  });

  // PERFORMANCE: Preload client profile images for instant display
  useEffect(() => {
    if (!likedClients || likedClients.length === 0) return;

    const preload = () => {
      // Priority: First image of first 5 clients (visible immediately)
      const priorityImages: string[] = [];
      const secondaryImages: string[] = [];

      likedClients.forEach((client, clientIdx) => {
        const images = client.profile_images || client.images || [];
        if (images.length === 0) return;

        images.forEach((url, imgIdx) => {
          if (clientIdx < 5 && imgIdx === 0) {
            // First image of first 5 clients = high priority
            priorityImages.push(url);
          } else if (clientIdx < 10 && imgIdx < 2) {
            // First 2 images of first 10 clients = secondary priority
            secondaryImages.push(url);
          }
        });
      });

      // Load priority images immediately
      priorityImages.forEach(url => {
        const img = new Image();
        img.decoding = 'async';
        (img as any).fetchPriority = 'high';
        img.src = getCardImageUrl(url);
      });

      // Load thumbnails
      priorityImages.concat(secondaryImages).forEach(url => {
        const img = new Image();
        img.decoding = 'async';
        img.src = getThumbnailUrl(url);
      });

      // Load secondary images in background
      setTimeout(() => {
        secondaryImages.forEach(url => {
          const img = new Image();
          img.decoding = 'async';
          img.src = getCardImageUrl(url);
        });
      }, 100);
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(preload, { timeout: 2000 });
    } else {
      setTimeout(preload, 50);
    }
  }, [likedClients]);

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user?.id)
        .eq('target_id', clientId)
        .eq('target_type', 'profile');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-clients'] });
      toast.success("Client removed from liked list");
    },
    onError: () => {
      toast.error("Failed to remove client from liked list");
    }
  });

  const reportClientMutation = useMutation({
    mutationFn: async ({ clientId, reason, details }: { clientId: string; reason: string; details: string }) => {
      // Insert report into user_reports table (correct schema table name)
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user?.id,
          reported_user_id: clientId,
          report_reason: reason,
          report_details: details,
          status: 'pending'
        });

      if (error) {
        logger.error('Report submission error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Report submitted. We'll review it shortly.");
      setShowReportDialog(false);
      setReportReason('');
      setReportDetails('');
      setSelectedClientForAction(null);
    },
    onError: () => {
      toast.error("Failed to submit report. Please try again.");
    }
  });

  const blockClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      // Insert block record into user_blocks table
      const { error: blockError } = await supabase
        .from('user_blocks')
        .insert({
          blocker_id: user?.id,
          blocked_id: clientId
        });

      if (blockError && !blockError.message.includes('duplicate')) {
        logger.error('Block error:', blockError);
        throw blockError;
      }

      // Also remove from likes table
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user?.id)
        .eq('target_id', clientId)
        .eq('target_type', 'profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-clients'] });
      toast.success("Client blocked successfully");
      setShowBlockDialog(false);
      setSelectedClientForAction(null);
    },
    onError: () => {
      toast.error("Failed to block client");
    }
  });

  const handleMessage = async (client: LikedClient) => {
    if (isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    
    try {
      toast.loading('Starting conversation...', { id: 'start-conv' });
      
      const result = await startConversation.mutateAsync({
        otherUserId: client.user_id,
        initialMessage: `Hi ${client.name}! I'm interested in discussing potential rental opportunities with you.`,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Opening chat...', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      logger.error('Error starting conversation:', error);
      toast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  // Filter by search term, category, and safety
  const filteredClients = likedClients.filter(client => {
    // Safety filter - exclude clients with criminal records or failed background checks
    if (filterSafeOnly) {
      // Exclude clients with criminal records
      if (client.has_criminal_record === true) {
        return false;
      }

      // Exclude clients with failed background checks
      if (client.background_check_status === 'failed') {
        return false;
      }

      // Exclude clients with specific problematic criminal record types
      const problematicTypes = [
        'vehicle_theft',
        'yacht_theft',
        'property_damage',
        'fraud',
        'violence',
        'theft',
        'steal'
      ];
      if (client.criminal_record_type &&
          problematicTypes.some(type =>
            client.criminal_record_type?.toLowerCase().includes(type)
          )) {
        return false;
      }
    }

    // Search filter
    const matchesSearch = client.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      (client.bio && client.bio.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.occupation && client.occupation.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Category filter - IMPROVED: Use specific type fields instead of interests
    if (selectedCategory === 'all') return true;

    // FIXED: Match based on client's preference fields for each category
    // Since moto_types and bicycle_types don't exist on profiles, show all clients for now
    // The filtering is less strict but avoids showing empty categories
    if (selectedCategory === 'property') {
      return client.property_types && client.property_types.length > 0;
    }
    if (selectedCategory === 'motorcycle') {
      // Show all clients until we have proper moto preference tracking
      return true;
    }
    if (selectedCategory === 'bicycle') {
      // Show all clients until we have proper bicycle preference tracking
      return true;
    }
    if (selectedCategory === 'worker') {
      return client.interests?.some(interest =>
        interest.toLowerCase().includes('service') || interest.toLowerCase().includes('worker')
      );
    }

    return false;
  });

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ category });
  };


  const handleRemoveLike = (clientId: string) => {
    removeLikeMutation.mutate(clientId);
  };

  const handleOpenReport = (client: LikedClient) => {
    setSelectedClientForAction(client);
    setShowReportDialog(true);
  };

  const handleOpenBlock = (client: LikedClient) => {
    setSelectedClientForAction(client);
    setShowBlockDialog(true);
  };

  const handleSubmitReport = () => {
    if (!selectedClientForAction || !reportReason) {
      toast.error("Please select a reason for your report");
      return;
    }
    reportClientMutation.mutate({
      clientId: selectedClientForAction.user_id,
      reason: reportReason,
      details: reportDetails
    });
  };

  const handleConfirmBlock = () => {
    if (!selectedClientForAction) return;
    blockClientMutation.mutate(selectedClientForAction.user_id);
  };

  const handleViewClient = (client: LikedClient) => {
    setSelectedClientForView(client);
    setShowInsightsModal(true);
  };

  return (
    <div className="w-full bg-background">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl pb-24 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white flex-shrink-0">
                <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Your Likes</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Clients you've liked</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/owner/interested-clients')}
              variant="outline"
              className="gap-2 whitespace-nowrap"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Who Liked You</span>
              <span className="sm:hidden">Who Liked Me</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-11"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">{filteredClients.length} clients</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={filterSafeOnly ? "default" : "outline"}
                      onClick={() => setFilterSafeOnly(!filterSafeOnly)}
                      className="gap-2"
                    >
                      {filterSafeOnly ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">{filterSafeOnly ? 'Safe Only' : 'Show All'}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {filterSafeOnly
                        ? "Showing only clients with clean backgrounds (no criminal records, theft, fraud, etc.)"
                        : "Showing all liked clients including those with background issues"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Force a fresh fetch by invalidating the cache
                  queryClient.invalidateQueries({ queryKey: ['liked-clients'] });
                  refetch();
                }}
                disabled={isLoading || isFetching}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-7 h-auto overflow-x-auto">
              {categories.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm"
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{label.substring(0, 4)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4 sm:p-6 animate-pulse">
                <div className="w-full aspect-[3/4] bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 sm:py-16 max-w-md mx-auto"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-muted flex items-center justify-center">
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">No Liked Clients Yet</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">
              {searchTerm ? 'No clients match your search.' : 'Start browsing client profiles and like the ones you\'re interested in working with'}
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => navigate('/owner/dashboard')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-sm sm:text-base"
              >
                Browse Clients
              </Button>
            )}
          </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <Card className="p-6 h-full hover:shadow-lg transition-all duration-300">
                <div className="relative mb-4 cursor-pointer" onClick={() => handleViewClient(client)}>
                  {client.images && client.images.length > 0 ? (
                    <img
                      src={client.images[0]}
                      alt={client.name}
                      className="w-full h-64 object-cover rounded-lg hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors">
                      <Users className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/owner/view-client/${client.user_id}`)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg border-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleMessage(client)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg border-0"
                      disabled={isCreatingConversation}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gray-800 hover:bg-gray-700 text-white shadow-lg border-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 bg-gray-900 border border-gray-700 shadow-xl rounded-xl p-1"
                      >
                        <DropdownMenuItem
                          onClick={() => handleRemoveLike(client.user_id)}
                          className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-800 focus:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Remove from Liked</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => handleOpenReport(client)}
                          className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-800 focus:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                        >
                          <Flag className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">Report Client</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenBlock(client)}
                          className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-800 focus:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                        >
                          <Ban className="w-4 h-4 text-red-500" />
                          <span className="font-medium">Block Client</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      {client.name}
                      {client.verified && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </h3>
                    <p className="text-muted-foreground">Age: {client.age}</p>
                    {client.occupation && (
                      <p className="text-sm text-muted-foreground">{client.occupation}</p>
                    )}

                    {/* Background Check Status Badge */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {client.background_check_status === 'passed' && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Background Verified
                        </Badge>
                      )}
                      {client.background_check_status === 'failed' && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Background Check Failed
                        </Badge>
                      )}
                      {client.background_check_status === 'pending' && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                          <Shield className="w-3 h-3" />
                          Check Pending
                        </Badge>
                      )}
                      {client.has_criminal_record && (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          Criminal Record
                          {client.criminal_record_type && `: ${client.criminal_record_type}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {client.bio && (
                    <p className="text-sm line-clamp-3">{client.bio}</p>
                  )}

                  {client.interests && client.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {client.interests.slice(0, 3).map((interest) => (
                        <span
                          key={`interest-${interest}`}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Liked on {new Date(client.liked_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <MessageQuotaDialog
        isOpen={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        onUpgrade={() => {
          setShowQuotaDialog(false);
          navigate('/subscription-packages');
        }}
        userRole={userRole}
      />

      {/* Report Client Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-yellow-500" />
              Report Client
            </DialogTitle>
            <DialogDescription>
              Report {selectedClientForAction?.name} for violating our community guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Reason for report</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake_profile" id="fake_profile" />
                  <Label htmlFor="fake_profile" className="font-normal">Fake or misleading profile</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="font-normal">Inappropriate content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="harassment" id="harassment" />
                  <Label htmlFor="harassment" className="font-normal">Harassment or abusive behavior</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam" className="font-normal">Spam or scam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information that may help us investigate..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReport}
              disabled={!reportReason || reportClientMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {reportClientMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Client Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Block Client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {selectedClientForAction?.name}?
              This will remove them from your liked clients and prevent any future interactions.
              This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBlock}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {blockClientMutation.isPending ? "Blocking..." : "Block Client"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client Insights Modal */}
      <LikedClientInsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        client={selectedClientForView}
      />
    </div>
  );
}