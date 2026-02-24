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
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
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
import { cn } from "@/lib/utils";

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
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';
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
      // UPDATED: Show all users as potential clients, not just those with role='client'
      // All users can now be liked as clients regardless of their primary role
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', targetIds);

      if (allProfilesError) {
        logger.error('[LikedClients] Error fetching profiles:', allProfilesError);
        throw allProfilesError;
      }

      if (allProfiles && allProfiles.length > 0) {
        // Show all profiles - all users are treated as potential clients
        profiles = allProfiles;
      }

      if (!profiles || profiles.length === 0) return [];

      // FIX: Show ALL liked clients without category filtering
      // Owners should see every client they liked, regardless of category matching
      // Category filtering is done via the UI tabs, not in the data fetch

      // Return the client profiles with like data
      const likedClientsList = profiles.map(profile => {
        const like = ownerLikes.find((l: any) => l.target_id === profile.user_id);
        return {
          id: profile.user_id,
          user_id: profile.user_id,
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
        .eq('user_id', user?.id || '')
        .eq('target_id', clientId)
        .eq('target_type', 'profile');

      if (error) throw error;
    },
    onSuccess: () => {
      // FIXED: Include user ID in query key to match query key format
      queryClient.invalidateQueries({ queryKey: ['liked-clients', user?.id] });
      toast.success("Client removed from liked list");
    },
    onError: () => {
      toast.error("Failed to remove client from liked list");
    }
  });

  const reportClientMutation = useMutation({
    mutationFn: async ({ clientId, reason, details }: { clientId: string; reason: string; details: string }) => {
      // Insert report into user_reports table (correct schema table name)
      const { error } = await (supabase as any)
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
      const { error: blockError } = await (supabase as any)
        .from('user_blocks')
        .insert({
          blocker_id: user?.id || '',
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
        .eq('user_id', user?.id || '')
        .eq('target_id', clientId)
        .eq('target_type', 'profile');
    },
    onSuccess: () => {
      // FIXED: Include user ID in query key to match LikedClients query key
      queryClient.invalidateQueries({ queryKey: ['liked-clients', user?.id] });
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
    <div className="w-full bg-background" style={{ minHeight: '100vh' }}>
      <div className="px-4 py-6 max-w-2xl mx-auto pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center h-10 w-10 rounded-2xl active:scale-95 touch-manipulation transition-all duration-150"
                style={{
                  background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                  border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                  boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <ArrowLeft className={cn("w-5 h-5", isLight ? 'text-gray-700' : 'text-white')} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Likes</h1>
                <p className="text-xs font-medium text-muted-foreground">
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Safety toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterSafeOnly(!filterSafeOnly)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold active:scale-95 touch-manipulation transition-all duration-150"
                      style={filterSafeOnly ? {
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.1))',
                        border: '1px solid rgba(16,185,129,0.4)',
                        color: '#10b981',
                        boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
                      } : {
                        background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                        border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                        color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {filterSafeOnly ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{filterSafeOnly ? 'Safe' : 'All'}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      {filterSafeOnly ? "Showing verified clients only" : "Showing all liked clients"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Who liked you */}
              <button
                onClick={() => navigate('/owner/interested-clients')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold active:scale-95 touch-manipulation transition-all duration-150"
                style={{
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(249,115,22,0.2))',
                  border: '1px solid rgba(236,72,153,0.3)',
                  color: '#f472b6',
                  boxShadow: '0 2px 8px rgba(236,72,153,0.15)',
                }}
              >
                <Heart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Liked Me</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-5"
            style={{
              background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
              border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.09)',
              boxShadow: isLight ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn("flex-1 bg-transparent text-sm outline-none", isLight ? 'text-gray-900 placeholder-gray-400' : 'text-white placeholder-white/30')}
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map(({ id, label, icon: Icon }) => {
              const isActive = selectedCategory === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => handleCategoryChange(id)}
                  whileTap={{ scale: 0.94 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all duration-200 touch-manipulation"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #ec4899, #f97316)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                  } : {
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                    color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-64" style={{ background: 'rgba(255,255,255,0.05)' }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 rounded-xl w-3/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <div className="h-3 rounded-xl w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 max-w-sm mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
              <Flame className="w-10 h-10" style={{ color: 'rgba(249,115,22,0.5)' }} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No Liked Clients</h2>
            <p className="text-sm mb-5 px-4 text-muted-foreground">
              {searchTerm ? 'No clients match your search.' : "Start browsing and like clients you're interested in working with"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => navigate('/owner/dashboard')}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white active:scale-95 touch-manipulation transition-all"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #f97316)',
                  boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                }}
              >
                Browse Clients
              </button>
            )}
          </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="group rounded-3xl overflow-hidden"
              style={{
                background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              {/* Portrait image */}
              <div
                className="relative overflow-hidden cursor-pointer"
                style={{ height: '260px' }}
                onClick={() => handleViewClient(client)}
              >
                {client.images && client.images.length > 0 ? (
                  <img
                    src={client.images[0]}
                    alt={client.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Users className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                )}

                {/* Bottom gradient */}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9) 100%)' }}
                />

                {/* Floating name + age */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg leading-tight">
                        {client.name}
                        {client.verified && (
                          <span className="ml-1.5 inline-flex w-4 h-4 rounded-full bg-blue-500 items-center justify-center text-white text-xs">✓</span>
                        )}
                      </h3>
                      <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        {client.age ? `${client.age} years` : 'Age unknown'}
                        {client.occupation ? ` · ${client.occupation}` : ''}
                      </p>
                    </div>

                    {/* Background check badge */}
                    {client.background_check_status === 'passed' && (
                      <div
                        className="px-2 py-1 rounded-full flex items-center gap-1"
                        style={{ background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(16,185,129,0.4)' }}
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* More options top-right */}
                <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-2xl backdrop-blur-md touch-manipulation"
                        style={{
                          background: 'rgba(0,0,0,0.55)',
                          border: '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                      <DropdownMenuItem
                        onClick={() => handleRemoveLike(client.user_id)}
                        className="flex items-center gap-3 px-3 py-2.5 text-destructive focus:text-destructive rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Remove from Liked</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleOpenReport(client)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                      >
                        <Flag className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">Report Client</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenBlock(client)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                      >
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Block Client</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Action button row */}
              <div className="p-3 flex gap-2">
                <button
                  onClick={() => navigate(`/owner/view-client/${client.user_id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold text-white active:scale-95 touch-manipulation transition-all duration-150"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.35), rgba(168,85,247,0.15))',
                    border: '1px solid rgba(168,85,247,0.4)',
                    boxShadow: '0 2px 8px rgba(168,85,247,0.2)',
                    color: '#c084fc',
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Profile
                </button>

                <button
                  onClick={() => handleMessage(client)}
                  disabled={isCreatingConversation}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold text-white active:scale-95 touch-manipulation transition-all duration-150 disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                    boxShadow: '0 3px 12px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </button>

                <button
                  onClick={() => handleViewClient(client)}
                  className="flex items-center justify-center w-10 h-10 rounded-2xl active:scale-95 touch-manipulation transition-all duration-150 flex-shrink-0"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
                    border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                    color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Flame className="w-4 h-4" />
                </button>
              </div>

              {/* Liked date */}
              {client.liked_at && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-muted-foreground">
                    Liked {new Date(client.liked_at).toLocaleDateString()}
                  </p>
                </div>
              )}
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