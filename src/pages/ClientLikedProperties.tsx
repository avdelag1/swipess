import { lazy, Suspense } from "react";
const LikedListingInsightsModal = lazy(() => import("@/components/LikedListingInsightsModal").then(m => ({ default: m.LikedListingInsightsModal })));

import { useState, useMemo } from "react";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useStartConversation } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, Home, Bike, Briefcase, RefreshCw, Car, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import useAppTheme from "@/hooks/useAppTheme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { LikesSkeleton } from "@/components/ui/LikesSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { pwaImagePreloader, getCardImageUrl } from "@/utils/imageOptimization";
import type { Listing } from "@/hooks/useListings";
import { useEffect } from "react";
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

type SortOption = "newest" | "oldest" | "price_low" | "price_high" | "az";

const categories = [
  { id: "all", label: "All Favorites", icon: Flame, title: "Your World", subtitle: "Reorder and filter your top essentials" },
  { id: "property", label: "Properties", icon: Home, title: "Dream Habitats", subtitle: "Elite living spaces" },
  { id: "motorcycle", label: "Motorcycles", icon: Car, title: "Power & Speed", subtitle: "Premium machines" },
  { id: "bicycle", label: "Bicycles", icon: Bike, title: "Urban Flow", subtitle: "Sustainable precision" },
  { id: "worker", label: "Workers", icon: Briefcase, title: "Elite Talent", subtitle: "The support you need" },
];

interface ClientLikedPropertiesProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
}

const ClientLikedProperties = (_props: ClientLikedPropertiesProps) => {
  const { theme } = useAppTheme();
  const isLight = theme === "light";
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [propertyToDelete, setPropertyToDelete] = useState<Listing | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Listing | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const { data: likedProperties = [], isLoading, refetch: refreshLikedProperties, isFetching } = useLikedProperties();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (likedProperties.length > 0) {
      const urlsToPreload = likedProperties
        .slice(0, 10)
        .map(p => getCardImageUrl(p.images?.[0] || p.image_url || ''))
        .filter(Boolean);
      
      if (urlsToPreload.length > 0) {
        pwaImagePreloader.batchPreload(urlsToPreload);
      }
    }
  }, [likedProperties]);

  const filteredAndSorted = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const minPrice = priceMin ? Number(priceMin) : null;
    const maxPrice = priceMax ? Number(priceMax) : null;

    const result = likedProperties.filter((property) => {
      if (selectedCategory !== "all") {
        const cat = (property.category || "").toLowerCase();
        const sel = selectedCategory.toLowerCase();
        if (sel === "property") {
          if (cat !== "property" && property.category) return false;
        } else if (cat !== sel) return false;
      }
      if (lowerSearch) {
        const title = (property.title || "").toLowerCase();
        const desc = (property.description || "").toLowerCase();
        const loc = ((property as any).location || property.address || property.city || "").toLowerCase();
        if (!title.includes(lowerSearch) && !desc.includes(lowerSearch) && !loc.includes(lowerSearch)) return false;
      }
      if (minPrice !== null && (property.price ?? 0) < minPrice) return false;
      if (maxPrice !== null && (property.price ?? 0) > maxPrice) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest": return 0;
        case "price_low": return (a.price ?? 0) - (b.price ?? 0);
        case "price_high": return (b.price ?? 0) - (a.price ?? 0);
        case "az": return (a.title || "").localeCompare(b.title || "");
        default: return 0;
      }
    });

    if (sortBy === "oldest") result.reverse();
    return result;
  }, [likedProperties, selectedCategory, searchTerm, priceMin, priceMax, sortBy]);

  const handleAction = async (action: "message" | "view" | "remove", property: any) => {
    if (action === "remove") {
      setPropertyToDelete(property);
      setShowDeleteDialog(true);
      return;
    }
    if (action === "view") {
      setSelectedPropertyForModal(property);
      setShowInsightsModal(true);
      return;
    }
    if (action === "message") {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: property.owner_id,
          listingId: property.id,
          initialMessage: `Hi! I'm interested in: ${property.title}. Could you tell me more?`,
          canStartNewConversation: true,
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
        else navigate("/messages");
      } catch {
        toast.error("Unable to start conversation");
      }
    }
  };

  const removeLikeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user?.id || !propertyId) throw new Error("Not authenticated or missing ID");
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("target_id", propertyId)
        .eq("target_type", "listing");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liked-properties"] });
      toast.success("Property removed from your likes");
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
    },
    onError: () => {
      toast.error("Failed to remove from likes");
    },
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ category });
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "price_low", label: "Price ↑" },
    { value: "price_high", label: "Price ↓" },
    { value: "az", label: "A → Z" },
  ];

  return (
    <div className="w-full relative flex flex-col" data-no-swipe-nav="true">
      <div className="flex flex-col flex-1 min-h-full p-4 pt-4 sm:p-8 sm:pt-6 max-w-7xl mx-auto w-full">
        {/* Category tabs and Sync button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => handleCategoryChange(id)}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border",
                  selectedCategory === id
                    ? (isLight ? "bg-black text-white shadow-xl shadow-black/10 border-black" : "bg-[var(--color-brand-accent-2)] text-white shadow-lg shadow-[var(--color-brand-accent-2)]/20 border-[var(--color-brand-accent-2)]")
                    : isLight
                    ? "bg-white border-black/5 text-black/50 font-black hover:text-black hover:bg-black/[0.02] shadow-sm"
                    : "bg-white/[0.04] border-white/[0.08] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["liked-properties"] });
              refreshLikedProperties();
            }}
            disabled={isLoading || isFetching}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-sm border",
              isLight ? "bg-white border-black/5 text-black/40 hover:text-black" : "bg-secondary/80 border-border/50 text-muted-foreground hover:text-foreground"
            )}          >
            <RefreshCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search title, description, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-14 rounded-2xl pl-14 pr-6 font-bold focus:border-[var(--color-brand-accent-2)] transition-all outline-none text-sm",
              isLight
                ? "bg-white border border-black/5 text-foreground placeholder-black/20 shadow-sm"
                : "bg-white/[0.04] border border-white/[0.08] text-foreground placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Filter Panel */}
        <div className="mb-8">
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap",
                    sortBy === opt.value
                      ? (isLight ? "bg-black text-white shadow-md border-black" : "bg-[var(--color-brand-accent-2)] border-[var(--color-brand-accent-2)] text-white shadow-md")
                      : isLight
                      ? "bg-white border-black/5 text-black/40 font-black hover:text-black hover:bg-black/[0.02]"
                      : "bg-white/[0.04] border-white/[0.08] text-muted-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
           </div>
        </div>

        {/* Count */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_10px_var(--color-brand-accent-2)]" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {filteredAndSorted.length} Saved Essentials
          </span>
          {(searchTerm || priceMin || priceMax || sortBy !== "newest") && (
            <button
              onClick={() => { setSearchTerm(""); setPriceMin(""); setPriceMax(""); setSortBy("newest"); }}
              className="ml-auto text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-accent-2)] active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>

        {isLoading ? (
          <LikesSkeleton />
        ) : filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAndSorted.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 25 }}
                className="rounded-[2rem]"
              >
                <PremiumLikedCard
                  type="listing"
                  isLight={isLight}
                  data={property}
                  onAction={(action) => handleAction(action, property)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Flame}
            title="Pure Potential."
            description="Your favorite listings will appear here. Start swiping to fill your world."
            actionLabel="EXPLORE WORLD"
            onAction={() => navigate("/client/dashboard")}
          />
        )}
      </div>

      {showInsightsModal && (
        <Suspense fallback={null}>
          <LikedListingInsightsModal
            open={showInsightsModal}
            onOpenChange={setShowInsightsModal}
            listing={selectedPropertyForModal}
          />
        </Suspense>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-[2rem] bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-black text-xl">Remove from World?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              Are you sure you want to remove "{propertyToDelete?.title}" from your favorites?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl bg-secondary text-foreground border-border/30">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => propertyToDelete?.id && removeLikeMutation.mutate(propertyToDelete.id!)}
              className="bg-[var(--color-brand-accent-2)] hover:bg-[#FF1493] text-white rounded-xl font-black"
            >
              REMOVE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientLikedProperties;
