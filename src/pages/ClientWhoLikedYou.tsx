import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, GripVertical, Flame, Home, Briefcase, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { LikesSkeleton } from "@/components/ui/LikesSkeleton";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { PremiumSortableGrid } from "@/components/PremiumSortableGrid";
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
import useAppTheme from "@/hooks/useAppTheme";

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
  const { theme } = useAppTheme();
  const isLight = theme === "light";
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
    <div className="w-full min-h-full pb-32 overflow-visible" style={{ touchAction: 'pan-y' }} data-no-swipe-nav="true">
      <div className="p-4 pt-4 sm:p-8 sm:pt-4 max-w-7xl mx-auto">
        {/* Badge */}
        <div className="flex items-center justify-end mb-8 relative z-10">
          <div className="px-4 py-2 rounded-2xl bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 text-[var(--color-brand-accent-2)] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(228,0,124,0.1)]">
            <ThumbsUp className="w-4 h-4" />
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
                  ? "bg-[var(--color-brand-accent-2)] border-[var(--color-brand-accent-2)] text-white shadow-[0_8px_24px_rgba(228,0,124,0.4)]"
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
              "w-full h-16 rounded-3xl pl-6 font-bold focus:border-[var(--color-brand-accent-2)] transition-all outline-none border",
              isLight
                ? "bg-background border-border/40 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-muted border-border text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_10px_var(--color-brand-accent-2)]" />
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
          <LikesSkeleton />
        ) : filteredOwners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" style={{ touchAction: 'pan-y' }}>
            {filteredOwners.map((owner: any, index: number) => (
              <div key={owner.id} className="rounded-[2rem]" style={{ touchAction: 'pan-y' }}>
                <PremiumLikedCard
                  type="profile"
                  data={owner}
                  onAction={(action) => handleAction(action, owner)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ThumbsUp}
            title="Stay Noticed."
            description="When an owner likes your profile, they will appear here instantly."
            actionLabel="EXPLORE WORLD"
            onAction={() => navigate("/client/dashboard")}
          />
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
              className="bg-[var(--color-brand-accent-2)] text-white rounded-xl font-black"
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


