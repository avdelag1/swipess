import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Users, Search, ThumbsUp, ShieldCheck, ShieldAlert,
  Home, Briefcase, DollarSign, ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { useStartConversation } from "@/hooks/useConversations";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { LikedClientInsightsModal } from "@/components/LikedClientInsightsModal";

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

type SortOption = "newest" | "oldest" | "az";

const clientCategories = [
  { id: "all", label: "All Talents", icon: Flame },
  { id: "renter", label: "Renters", icon: Home },
  { id: "worker", label: "Workers", icon: Briefcase },
  { id: "buyer", label: "Buyers", icon: DollarSign },
];

export function LikedClients() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSafeOnly, setFilterSafeOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ user_id: string; full_name?: string } | null>(null);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedClientForView, setSelectedClientForView] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const queryClient = useQueryClient();
  const startConversation = useStartConversation();

  const { data: likedClients = [], isLoading } = useQuery({
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

  // Category + search + sort filter
  const filteredClients = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    let result = likedClients.filter((client) => {
      const occupations = (client as any).occupation?.toLowerCase() || "";
      const name = (client.full_name || "").toLowerCase();
      const bio = (client as any).bio?.toLowerCase() || "";
      
      const matchesSearch = !lowerSearch || name.includes(lowerSearch) || occupations.includes(lowerSearch) || bio.includes(lowerSearch);
      
      if (filterSafeOnly && (client as any).has_criminal_record) return false;
      
      if (selectedCategory === "renter")
        return matchesSearch && (occupations.includes("rent") || bio.includes("rent"));
      if (selectedCategory === "worker")
        return matchesSearch && (occupations.includes("work") || occupations.includes("service") || bio.includes("work") || bio.includes("service"));
      if (selectedCategory === "buyer")
        return matchesSearch && (occupations.includes("buy") || occupations.includes("hire") || bio.includes("buy") || bio.includes("hire") || bio.includes("looking to"));
        
      return matchesSearch;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.liked_at || "").getTime() - new Date(b.liked_at || "").getTime();
        case "az": return (a.full_name || "").localeCompare(b.full_name || "");
        case "newest":
        default: return new Date(b.liked_at || "").getTime() - new Date(a.liked_at || "").getTime();
      }
    });

    return result;
  }, [likedClients, selectedCategory, searchTerm, filterSafeOnly, sortBy]);

  return (
    <div className="w-full min-h-full pb-32 relative overflow-visible" style={{ touchAction: 'pan-y' }} data-no-swipe-nav="true">
      <div className="p-4 pt-4 sm:p-8 sm:pt-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-6">
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
                onPointerDown={() => navigate("/owner/interested-clients")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-primary-foreground shadow-md transition-all active:scale-95"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Liked Me
                </span>
              </button>
            </div>
        </div>

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
                  ? "bg-primary border-primary text-primary-foreground shadow-md"
                  : isLight
                  ? "bg-white border-border/60 text-slate-900 hover:bg-slate-50 shadow-sm"
                  : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
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
            placeholder="Search name, occupation, bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-14 rounded-2xl pl-14 pr-6 font-bold focus:border-primary transition-all outline-none text-sm",
              isLight
                ? "bg-card border border-border/60 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-muted/30 border border-border text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2 mb-4 px-2 overflow-x-auto no-scrollbar">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {([
            { value: "newest" as SortOption, label: "Newest" },
            { value: "oldest" as SortOption, label: "Oldest" },
            { value: "az" as SortOption, label: "A → Z" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all active:scale-95 whitespace-nowrap",
                sortBy === opt.value
                  ? "bg-primary border-primary text-primary-foreground"
                  : isLight
                  ? "bg-card border-border/50 text-foreground"
                  : "bg-white/[0.04] border-white/[0.08] text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-md" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {filteredClients.length} Potential Professionals
          </span>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(""); setSortBy("newest"); }}
              className="ml-auto text-[10px] font-black uppercase tracking-widest text-primary active:scale-95"
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" style={{ touchAction: 'pan-y' }}>
            {filteredClients.map((client: any, index: number) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                className="rounded-[2rem]" style={{ touchAction: 'pan-y' }}
              >
                <PremiumLikedCard
                  type="profile"
                  data={client}
                  onAction={(action) => handleAction(action, client)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-muted/30 rounded-[3rem] border border-border/40"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 shadow-2xl border border-border">
              <Users className="w-12 h-12 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">
              Discovery Awaits.
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold mb-10">
              Your liked clients will appear here. Start swiping to grow your network.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-8 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
            >
              START SWIPING
            </button>
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
              className="bg-[var(--color-brand-accent-2)] hover:bg-[#FF1493] text-white rounded-xl font-black"
            >
              DISMISS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


