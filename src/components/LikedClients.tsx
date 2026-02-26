import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Flame, Users, Search, MapPin, RefreshCw, ArrowLeft, Heart, ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { useStartConversation } from "@/hooks/useConversations";
import { logger } from "@/utils/prodLogger";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { LikedClientInsightsModal } from "@/components/LikedClientInsightsModal";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

export function LikedClients() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSafeOnly, setFilterSafeOnly] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [selectedClientForAction, setSelectedClientForAction] = useState<any>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const { data: likedClients = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['liked-clients', user?.id],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: ownerLikes, error: likesError } = await supabase
        .from('likes')
        .select('target_id, created_at')
        .eq('user_id', user.id)
        .eq('target_type', 'profile')
        .eq('direction', 'right')
        .order('created_at', { ascending: false });

      if (likesError) throw likesError;
      if (!ownerLikes || ownerLikes.length === 0) return [];

      const targetIds = ownerLikes.map(like => like.target_id);
      const { data: profiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', targetIds);

      if (allProfilesError) throw allProfilesError;

      return profiles.map(profile => {
        const like = ownerLikes.find(l => l.target_id === profile.user_id);
        return {
          ...profile,
          id: profile.user_id,
          liked_at: like?.created_at || new Date().toISOString(),
          category: 'Profile',
          occupation: (profile as any).occupation || '',
          has_criminal_record: (profile as any).has_criminal_record || false
        };
      }).sort((a, b) => new Date(b.liked_at || '').getTime() - new Date(a.liked_at || '').getTime());
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user?.id ?? '')
        .eq('target_id', clientId)
        .eq('target_type', 'profile');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-clients', user?.id] });
      toast.success("Client removed from your likes");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to remove client");
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
      const { error: blockError } = await (supabase as any)
        .from('user_blocks')
        .insert({
          blocker_id: user?.id,
          blocked_id: clientId
        });

      if (blockError && !blockError.message.includes('duplicate')) {
        logger.error('Block error:', blockError);
        throw blockError;
      }

      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user?.id ?? '')
        .eq('target_id', clientId)
        .eq('target_type', 'profile');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-clients', user?.id] });
      toast.success("Client blocked successfully");
      setShowBlockDialog(false);
      setSelectedClientForAction(null);
    },
    onError: () => {
      toast.error("Failed to block client");
    }
  });

  const handleAction = async (action: string, client: any) => {
    if (action === 'view') {
      setSelectedClientForView(client);
      setShowInsightsModal(true);
    }

    if (action === 'delete') {
      setClientToDelete(client);
      setShowDeleteDialog(true);
    }

    if (action === 'message') {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: client.user_id,
          initialMessage: `Hi ${client.full_name || 'there'}! I'm interested in working with you.`,
          canStartNewConversation: true,
        });

        if (result?.conversationId) {
          navigate(`/messages?conversationId=${result.conversationId}`);
        }
      } catch (error) {
        toast.error('Could not start conversation');
      }
    }
  };

  const filteredClients = likedClients.filter(client => {
    const matchesSearch = (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((client as any).occupation || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterSafeOnly && (client as any).has_criminal_record) return false;

    return matchesSearch;
  });

  return (
    <div className="w-full bg-black min-h-screen pb-32">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <PageHeader
          title="Liked Clients"
          subtitle="Profiles you've matched with"
          showBack={true}
          actions={
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterSafeOnly(!filterSafeOnly)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95",
                        filterSafeOnly
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                          : "bg-zinc-800 border-zinc-700 text-zinc-300"
                      )}
                    >
                      {filterSafeOnly ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {filterSafeOnly ? 'Verified Only' : 'All Profiles'}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Filter by background check status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                onClick={() => navigate('/owner/interested-clients')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E4007C] text-white shadow-[0_8px_24px_rgba(228,0,124,0.3)] transition-all active:scale-95"
              >
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Liked Me</span>
              </button>
            </div>
          }
        />

        {/* Search Bar - GLASSMORPHIC */}
        <div className="relative mb-10 pt-4">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search liked clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-16 bg-zinc-900 border border-white/10 rounded-3xl pl-14 pr-6 text-white placeholder-zinc-500 font-bold focus:border-[#E4007C] transition-all outline-none shadow-inner"
          />
        </div>

        {/* Count Label */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_10px_#E4007C]" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
            {filteredClients.length} Potential Professionals
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredClients.map((client) => (
                <PremiumLikedCard
                  key={client.id}
                  type="profile"
                  data={client}
                  onAction={(action) => handleAction(action, client)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-[3rem] border border-white/5"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 flex items-center justify-center mb-8 shadow-2xl border border-white/5">
              <Users className="w-12 h-12 text-[#E4007C]/40" />
            </div>
            <h3 className="text-white font-black text-2xl tracking-tighter mb-4">Discovery Awaits.</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed font-bold">
              Your liked clients will appear here. Start swiping to grow your network.
            </p>
          </motion.div>
        )}
      </div>

      <LikedClientInsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        client={selectedClientForView}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black text-xl">Remove Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 font-bold">
              Are you sure you want to remove {clientToDelete?.full_name} from your talents?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-white/5 text-white rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete?.user_id && removeLikeMutation.mutate(clientToDelete.user_id)}
              className="bg-[#E4007C] hover:bg-[#FF1493] text-white rounded-xl font-black"
            >
              DISMISS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}