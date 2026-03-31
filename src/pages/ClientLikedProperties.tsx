import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";

import { useState } from "react";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useStartConversation } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, Home, Bike, Briefcase, RefreshCw, Car, GripVertical, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
import { PremiumSortableGrid } from "@/components/PremiumSortableGrid";
import type { Listing } from "@/hooks/useListings";
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

const categories = [
  { id: "all", label: "All Likes", icon: Flame, title: "Your Favorites", subtitle: "Listings and connections you saved" },
  { id: "property", label: "Homes", icon: Home, title: "Dream Habitats", subtitle: "Elite living spaces" },
  { id: "motorcycle", label: "Motos", icon: Car, title: "Power & Speed", subtitle: "Premium machines" },
  { id: "bicycle", label: "Bikes", icon: Bike, title: "Urban Flow", subtitle: "Sustainable precision" },
  { id: "worker", label: "Services", icon: Briefcase, title: "Elite Talent", subtitle: "The support you need" },
  { id: "event", label: "Events", icon: Flame, title: "Social Pulse", subtitle: "Tulum's finest gatherings" },
];

interface ClientLikedPropertiesProps {
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
}

const ClientLikedProperties = (_props: ClientLikedPropertiesProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [propertyToDelete, setPropertyToDelete] = useState<Listing | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Listing | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: likedProperties = [], isLoading, refetch: refreshLikedProperties, isFetching } = useLikedProperties();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const storageKey = user?.id ? `liked-properties-order-${user.id}` : "";

  const removeLikeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
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

  const filteredProperties = likedProperties.filter((property) => {
    const matchesCategory = (() => {
      if (selectedCategory === "all") return true;
      const propertyCategory = (property.category || "").toLowerCase();
      const selectedCat = selectedCategory.toLowerCase();
      if (selectedCat === "property") return propertyCategory === "property" || !property.category;
      if (selectedCat === "event") return propertyCategory === "event";
      return propertyCategory === selectedCat;
    })();

    const matchesSearch = (property.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ((property as any).location || property.address || property.city || "").toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const { orderedItems: orderedFilteredProperties, handleReorder } = usePersistentReorder(
    filteredProperties,
    `${storageKey}-${selectedCategory}`
  );

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

  return (
    <div className="w-full pb-32 bg-background" data-no-swipe-nav="true">
      <div className="p-4 pt-4 sm:p-8 sm:pt-4 max-w-7xl mx-auto">
        {/* Category tabs and Sync button */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-2 pt-6">
          <div className="flex-1 flex gap-3 overflow-x-auto scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => handleCategoryChange(id)}
                whileTap={{ scale: 0.96 }}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border",
                  selectedCategory === id
                    ? "bg-[var(--color-brand-accent-2)] border-[var(--color-brand-accent-2)] text-white shadow-lg shadow-[var(--color-brand-accent-2)]/20"
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

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["liked-properties"] });
              refreshLikedProperties();
            }}
            disabled={isLoading || isFetching}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-secondary/80 border border-border/50 text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 shadow-sm"
          >
            <RefreshCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-accent-2)]">Sync</span>
          </button>
        </div>

        {/* Search Bar — New: matches Owner Side standard */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search your favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full h-16 rounded-3xl pl-14 pr-6 font-bold focus:border-[var(--color-brand-accent-2)] transition-all outline-none",
              isLight
                ? "bg-white border border-border/40 text-foreground placeholder-muted-foreground shadow-sm"
                : "bg-white/[0.04] border border-white/[0.08] text-white placeholder-muted-foreground"
            )}
          />
        </div>

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_10px_var(--color-brand-accent-2)]" />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
            {orderedFilteredProperties.length} Saved Essentials
          </span>
          {orderedFilteredProperties.length > 1 && (
            <span className="ml-auto flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              <GripVertical className="w-3 h-3" />
              Drag to reorder
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : orderedFilteredProperties.length > 0 ? (
          <PremiumSortableGrid
            items={orderedFilteredProperties}
            onReorder={handleReorder}
            renderItem={(property) => (
              <PremiumLikedCard
                type="listing"
                data={property}
                onAction={(action) => handleAction(action, property)}
              />
            )}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-muted/30 rounded-[3rem] border border-border"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 shadow-2xl border border-border">
              <Flame className="w-12 h-12 text-[var(--color-brand-accent-2)]/40" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">Pure Potential.</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold">
              Your favorite listings will appear here. Start swiping to fill your world.
            </p>
            <button
              onClick={() => navigate("/client/dashboard")}
              className="mt-10 px-8 py-4 rounded-2xl bg-[var(--color-brand-accent-2)] text-white text-sm font-black tracking-widest hover:bg-[#FF1493] transition-all active:scale-95 shadow-[0_10px_30px_rgba(228,0,124,0.3)]"
            >
              EXPLORE WORLD
            </button>
          </motion.div>
        )}
      </div>

      <LikedListingInsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        listing={selectedPropertyForModal}
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
              Remove from World?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-bold">
              Are you sure you want to remove "{propertyToDelete?.title}" from your favorites?
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
              onClick={() => propertyToDelete?.id && removeLikeMutation.mutate(propertyToDelete.id)}
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
