import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Users, Search, ThumbsUp, ShieldCheck, ShieldAlert,
  Home, Briefcase, DollarSign, ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import useAppTheme from "@/hooks/useAppTheme";
import { useStartConversation } from "@/hooks/useConversations";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { LikedClientInsightsModal } from "@/components/LikedClientInsightsModal";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const { theme } = useAppTheme();
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
          };
        })
        .sort((a, b) => new Date(b.liked_at || "").getTime() - new Date(a.liked_at || "").getTime());
    },
    enabled: !!user?.id,
  });

  const removeLikeMutation = useMutation({
    mutationFn: async (clientId: string) => {
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
      toast.success("Profile removed");
      setShowDeleteDialog(false);
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
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
      } catch {
        toast.error("Unable to start conversation");
      }
    }
  };

  const filteredClients = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const result = likedClients.filter((client) => {
      const occupations = (client as any).occupation?.toLowerCase() || "";
      const name = (client.full_name || "").toLowerCase();
      const matchesSearch = !lowerSearch || name.includes(lowerSearch) || occupations.includes(lowerSearch);
      if (filterSafeOnly && (client as any).has_criminal_record) return false;
      if (selectedCategory !== "all" && !occupations.includes(selectedCategory === 'renter' ? 'rent' : selectedCategory)) return false;
      return matchesSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.liked_at || "").getTime() - new Date(b.liked_at || "").getTime();
      if (sortBy === "az") return (a.full_name || "").localeCompare(b.full_name || "");
      return new Date(b.liked_at || "").getTime() - new Date(a.liked_at || "").getTime();
    });
    return result;
  }, [likedClients, selectedCategory, searchTerm, filterSafeOnly, sortBy]);

  return (
    <div className="w-full relative flex flex-col min-h-screen" data-no-swipe-nav="true">
      <div className="flex-1 flex flex-col p-4 pt-24 sm:p-8 sm:pt-24 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter">Your Talents</h1>
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilterSafeOnly(!filterSafeOnly)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all active:scale-95",
                        filterSafeOnly ? "bg-primary border-primary text-white shadow-md" : "bg-secondary border-border text-muted-foreground"
                      )}
                    >
                      {filterSafeOnly ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Verified Only</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Filter by background check status</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                onClick={() => navigate("/owner/interested-clients")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-primary text-white shadow-md active:scale-95 transition-all"
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Liked Me</span>
              </button>
            </div>
        </div>

        <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2">
          {clientCategories.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setSelectedCategory(id)}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all border",
                selectedCategory === id ? "bg-primary border-primary text-white shadow-lg" : (isLight ? "bg-black/5 border-black/10 text-slate-600 hover:bg-black/10" : "bg-white/[0.04] border-white/[0.08] text-muted-foreground")
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search talents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-14 rounded-2xl pl-14 pr-6 font-bold transition-all outline-none border",
              isLight ? "bg-black/5 border-black/10 focus:border-primary text-black placeholder:text-black/40" : "bg-white/[0.04] border-white/[0.08] focus:border-primary text-white"
            )}
          />
        </div>

        <div className="flex items-center gap-2 mb-8 px-2 overflow-x-auto no-scrollbar">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          {["newest", "oldest", "az"].map((opt) => (
            <button
              key={opt}
              onClick={() => setSortBy(opt as SortOption)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap",
                sortBy === opt ? "bg-primary border-primary text-white" : (isLight ? "bg-black/5 border-black/10 text-slate-600" : "bg-white/[0.04] border-white/[0.08] text-muted-foreground")
              )}
            >
              {opt}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"><div className="h-96 rounded-[2.5rem] bg-muted animate-pulse" /></div>
        ) : filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClients.map((client: any, idx) => (
              <motion.div key={client.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <PremiumLikedCard type="profile" data={client} onAction={(action) => handleAction(action, client)} />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="Network Empty." description="Your matches will appear here. Start scanning to find talent." actionLabel="EXPLORE" onAction={() => navigate("/owner/dashboard")} />
        )}
      </div>

      <LikedClientInsightsModal open={showInsightsModal} onOpenChange={setShowInsightsModal} client={selectedClientForView} />
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2rem] bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-black text-xl">Remove Match?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">Are you sure you want to remove {clientToDelete?.full_name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => clientToDelete?.user_id && removeLikeMutation.mutate(clientToDelete.user_id)} className="bg-rose-500 text-white rounded-xl font-black">REMOVE</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
