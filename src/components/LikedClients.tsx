import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Users, Search, RefreshCw, Heart, ShieldCheck, ShieldAlert,
  Home, Briefcase, DollarSign, GripVertical,
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
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
import { usePersistentReorder } from "@/hooks/usePersistentReorder";

const clientCategories = [
  { id: "all", label: "All", icon: Flame },
  { id: "renter", label: "Renters", icon: Home },
  { id: "worker", label: "Workers", icon: Briefcase },
  { id: "buyer", label: "Buyers", icon: DollarSign },
];

export function LikedClients() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "white-matte";
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSafeOnly, setFilterSafeOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [selectedClientForAction, setSelectedClientForAction] = useState<any>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const storageKey = user?.id ? `liked-clients-order-${user.id}` : "";

  const { data: likedClients = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["liked-clients", user?.id],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: ownerLikes, error: likesError } = await supabase
        .from("likes")
        .select("target_id, created_at")
        .eq("user_id", user.id)
        .eq("target_type", "profile")
        .eq("direction", "right")
        .order("created_at", { ascending: false });

      if (likesError) throw likesError;
      if (!ownerLikes || ownerLikes.length === 0) return [];

      const targetIds = ownerLikes.map((like) => like.target_id);
      const { data: profiles, error: allProfilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", targetIds);

      if (allProfilesError) throw allProfilesError;

      return profiles
        .map((profile) => {
          const like = ownerLikes.find((l) => l.target_id === profile.user_id);
          return {
            ...profile,
            id: profile.user_id,
            liked_at: like?.created_at || new Date().toISOString(),
            category: "Profile",
            occupation: (profile as any).occupation || "",
            has_criminal_record: (profile as any).has_criminal_record || false,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.liked_at || "").getTime() -
            new Date(a.liked_at || "").getTime()
        );
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user?.id ?? "")
        .eq("target_id", clientId)
        .eq("target_type", "profile");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-clients", user?.id] });
      toast.success("Client removed from your likes");
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast.error("Failed to remove client");
    },
  });

  const blockClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error: blockError } = await (supabase as any)
        .from("user_blocks")
        .insert({ blocker_id: user?.id, blocked_id: clientId });

      if (blockError && !blockError.message.includes("duplicate")) {
        logger.error("Block error:", blockError);
        throw blockError;
      }

      await supabase
        .from("likes")
        .delete()
        .eq("user_id", user?.id ?? "")
        .eq("target_id", clientId)
        .eq("target_type", "profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-clients", user?.id] });
      toast.success("Client blocked successfully");
      setShowBlockDialog(false);
      setSelectedClientForAction(null);
    },
    onError: () => {
      toast.error("Failed to block client");
    },
  });

  const handleAction = async (action: string, client: any) => {
    if (action === "view") {
      setSelectedClientForView(client);
      setShowInsightsModal(true);
    }
    if (action === "remove") {
      setClientToDelete(client);
      setShowDeleteDialog(true);
    }
    if (action === "message") {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: client.user_id,
          initialMessage: `Hi ${client.full_name || "there"}! I'm interested in working with you.`,
          canStartNewConversation: true,
        });
        if (result?.conversationId) {
          navigate(`/messages?conversationId=${result.conversationId}`);
        }
      } catch {
        toast.error("Could not start conversation");
      }
    }
  };

  // Category + search filter
  const baseFiltered = likedClients.filter((client) => {
    const matchesSearch =
      (client.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((client as any).occupation || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (filterSafeOnly && (client as any).has_criminal_record) return false;
    if (selectedCategory === "renter")
      return (
        matchesSearch &&
        ((client as any).occupation || "").toLowerCase().includes("rent")
      );
    if (selectedCategory === "worker")
      return (
        matchesSearch &&
        ((client as any).occupation || "").toLowerCase().includes("work")
      );
    if (selectedCategory === "buyer")
      return (
        matchesSearch &&
        ((client as any).occupation || "").toLowerCase().includes("buy")
      );
    return matchesSearch;
  });

  // Persistent drag-reorder
  const { orderedItems: filteredClients, handleReorder } = usePersistentReorder(
    baseFiltered,
    storageKey
  );

  return (
    <div className="w-full bg-background min-h-screen pb-32">
      <div className="p-4 pt-[calc(56px+var(--safe-top)+1rem)] sm:p-8 sm:pt-[calc(56px+var(--safe-top)+2rem)] max-w-7xl mx-auto">
        <PageHeader
          title="Liked Clients"
          subtitle="Profiles you've matched with"
          showBack={false}
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
                          ? "bg-primary border-primary text-primary-foreground shadow-md"
                          : "bg-secondary border-border text-muted-foreground"
                      )}
                    >
                      {filterSafeOnly ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {filterSafeOnly ? "Verified Only" : "All Profiles"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Filter by background check status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                onClick={() => navigate("/owner/interested-clients")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E4007C] text-white shadow-[0_8px_24px_rgba(228,0,124,0.3)] transition-all active:scale-95"
              >
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Liked Me
                </span>
              </button>
            </div>
          }
        />

        {/* Category filter tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide pb-2 pt-4">
          {clientCategories.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setSelectedCategory(id)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border",
                selectedCategory === id
                  ? "bg-[#E4007C] border-[#E4007C] text-white shadow-[0_8px_24px_rgba(228,0,124,0.4)]"
                  : isLight
                  ? "bg-white border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary shadow-sm"
                  : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search liked clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-16 rounded-3xl pl-14 pr-6 font-bold focus:border-[#E4007C] transition-all outline-none",
              isLight
                ? "bg-background border border-border/40 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-muted/30 border border-border text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_10px_#E4007C]" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {filteredClients.length} Potential Professionals
          </span>
          {filteredClients.length > 1 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={filteredClients}
            onReorder={handleReorder}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredClients.map((client) => (
                <Reorder.Item
                  key={client.id}
                  value={client}
                  className="list-none"
                  whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 60px rgba(228,0,124,0.25)" }}
                >
                  <PremiumLikedCard
                    type="profile"
                    data={client}
                    onAction={(action) => handleAction(action, client)}
                  />
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-muted/30 rounded-[3rem] border border-border"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 shadow-2xl border border-border">
              <Users className="w-12 h-12 text-[#E4007C]/40" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">
              Discovery Awaits.
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold">
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
        <AlertDialogContent
          className={cn(
            "rounded-[2rem]",
            isLight ? "bg-background border-border/50" : "bg-card border-border"
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-black text-xl">
              Remove Match?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              Are you sure you want to remove {clientToDelete?.full_name} from your talents?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                "rounded-xl",
                isLight
                  ? "bg-secondary text-foreground border-border/30"
                  : "bg-muted border-border text-foreground"
              )}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                clientToDelete?.user_id && removeLikeMutation.mutate(clientToDelete.user_id)
              }
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
