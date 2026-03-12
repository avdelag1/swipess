import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Heart, GripVertical, Flame, Home, Briefcase, DollarSign } from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useStartConversation } from "@/hooks/useConversations";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { cn } from "@/lib/utils";
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
import { useTheme } from "@/hooks/useTheme";

interface InterestedOwner {
  id: string;
  owner_id: string;
  owner_name: string;
  bio: string | null;
  images: string[];
  created_at: string;
  is_super_like: boolean;
  category?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  occupation?: string | null;
  verified?: boolean;
}

const ownerCategories = [
  { id: "all", label: "All", icon: Flame },
  { id: "landlord", label: "Landlords", icon: Home },
  { id: "employer", label: "Employers", icon: Briefcase },
  { id: "investor", label: "Investors", icon: DollarSign },
];

const ClientWhoLikedYou = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "white-matte";
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState<InterestedOwner | null>(null);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const storageKey = user?.id ? `who-liked-me-order-${user.id}` : "";

  const { data: interestedOwners = [] as InterestedOwner[], isLoading } = useQuery({
    queryKey: ["client-who-liked-you", user?.id],
    queryFn: async (): Promise<InterestedOwner[]> => {
      if (!user?.id) return [];
      const { data: likes, error: likesError } = await supabase
        .from("likes")
        .select("*")
        .eq("target_id", user.id)
        .eq("target_type", "profile")
        .eq("direction", "right")
        .order("created_at", { ascending: false });

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const ownerIds = likes.map((l) => l.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ownerIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map((profile) => {
        const like = likes.find((l) => l.user_id === profile.user_id);
        return {
          ...profile,
          id: profile.user_id,
          owner_id: profile.user_id,
          owner_name: profile.full_name || "",
          bio: profile.bio || null,
          images: Array.isArray(profile.images) ? (profile.images as string[]) : [],
          created_at: like?.created_at || profile.created_at,
          is_super_like: false,
          category: "Interviewer",
        } as InterestedOwner;
      });
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("likes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-who-liked-you", user?.id] });
      toast.success("Connection dismissed");
      setShowDeleteDialog(false);
    },
  });

  const handleAction = async (action: "message" | "view" | "remove", owner: any) => {
    if (action === "remove") {
      setOwnerToDelete(owner);
      setShowDeleteDialog(true);
      return;
    }
    if (action === "view") {
      navigate(`/profile/${owner.owner_id}`);
      return;
    }
    if (action === "message") {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: owner.owner_id,
          initialMessage: `Hi! I saw you were interested in my profile. Let's connect!`,
          canStartNewConversation: true,
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
      } catch {
        toast.error("Unable to start conversation");
      }
    }
  };

  // Category + search filter
  const baseFiltered = (interestedOwners as InterestedOwner[]).filter((o) => {
    const matchesSearch = (o.owner_name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (selectedCategory === "landlord")
      return matchesSearch && ((o.occupation || "").toLowerCase().includes("land") || (o.occupation || "").toLowerCase().includes("rent"));
    if (selectedCategory === "employer")
      return matchesSearch && (o.occupation || "").toLowerCase().includes("employ");
    if (selectedCategory === "investor")
      return matchesSearch && (o.occupation || "").toLowerCase().includes("invest");
    return matchesSearch;
  });

  const { orderedItems: filteredOwners, handleReorder } = usePersistentReorder(
    baseFiltered,
    storageKey
  );

  return (
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-[calc(56px+var(--safe-top)+1rem)] sm:p-8 sm:pt-[calc(56px+var(--safe-top)+2rem)] max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex items-center justify-end mb-8 relative z-10">
          <div className="px-4 py-2 rounded-2xl bg-[#E4007C]/10 border border-[#E4007C]/20 text-[#E4007C] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(228,0,124,0.1)]">
            <Heart className="w-4 h-4" />
            Fan Base
          </div>
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide pb-2 pt-2">
          {ownerCategories.map(({ id, label, icon: Icon }) => (
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

        {/* Search */}
        <div className="relative mb-8">
          <input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-16 rounded-3xl pl-6 font-bold focus:border-[#E4007C] transition-all outline-none border",
              isLight
                ? "bg-background border-border/40 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-muted border-border text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_10px_#E4007C]" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {filteredOwners.length} Connections
          </span>
          {filteredOwners.length > 1 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filteredOwners.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={filteredOwners}
            onReorder={handleReorder}
            data-no-swipe-nav
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
              {filteredOwners.map((owner) => (
                <Reorder.Item
                  key={owner.id}
                  value={owner}
                  className="list-none"
                  whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 60px rgba(228,0,124,0.25)" }}
                >
                  <PremiumLikedCard
                    type="profile"
                    data={owner}
                    onAction={(action) => handleAction(action, owner)}
                  />
                </Reorder.Item>
              ))}
          </Reorder.Group>
        ) : (
          <motion.div className="flex flex-col items-center justify-center py-32 text-center bg-muted/20 rounded-[3rem] border border-border/10">
            <Heart className="w-12 h-12 text-[#E4007C]/40 mb-6" />
            <h3 className="text-foreground font-black text-2xl tracking-tighter">Stay Noticed.</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold">
              When an owner likes your profile, they will appear here instantly.
            </p>
          </motion.div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-black text-xl">
              Dismiss Interest?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              This will remove their profile from your interest list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-secondary border-border text-foreground rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ownerToDelete && removeLikeMutation.mutate(ownerToDelete.id)}
              className="bg-[#E4007C] text-white rounded-xl font-black"
            >
              DISMISS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientWhoLikedYou;
