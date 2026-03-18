import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";

import { useState } from "react";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useStartConversation } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, Home, Bike, Briefcase, RefreshCw, Car, GripVertical } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, Reorder } from "framer-motion";
import { cn } from "@/lib/utils";
import { PremiumLikedCard } from "@/components/PremiumLikedCard";
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
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<any>(null);

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
    if (selectedCategory === "all") return true;
    const propertyCategory = property.category?.toLowerCase() || "";
    const selectedCat = selectedCategory.toLowerCase();
    if (selectedCat === "property") return propertyCategory === "property" || !property.category;
    return propertyCategory === selectedCat;
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
    <div className="w-full pb-32 bg-background">
      <div className="p-4 pt-4 sm:p-8 sm:pt-4 max-w-7xl mx-auto">
        {/* Category tabs and Sync button - Snap Group */}
        <div className="flex items-center gap-3 mb-10 overflow-x-auto scrollbar-hide pb-2 pt-4">
          <div className="flex gap-2 flex-1 overflow-x-auto scrollbar-hide px-1 bg-black/5 dark:bg-white/5 rounded-[2.5rem]">
            {categories.map(({ id, label, icon: Icon }) => {
              const isActive = selectedCategory === id;
              return (
                <motion.button
                  key={id}
                  onClick={() => handleCategoryChange(id)}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative flex items-center gap-2.5 px-6 py-3.5 rounded-[2rem] text-sm font-black whitespace-nowrap transition-colors duration-200 flex-shrink-0 z-10",
                    isActive
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="category-pill-liked-properties"
                      className="absolute inset-0 bg-[var(--color-brand-accent-2)] shadow-[0_8px_24px_rgba(228,0,124,0.3)] z-0 rounded-[2rem]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-20 flex items-center gap-2.5 font-black uppercase tracking-tight">
                    <Icon className="w-5 h-5" strokeWidth={3} />
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["liked-properties"] });
              refreshLikedProperties();
            }}
            disabled={isLoading || isFetching}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-secondary/80 border border-border/50 text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-50 ml-2"
          >
            <RefreshCw className={cn("w-5 h-5", (isLoading || isFetching) && "animate-spin")} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-brand-accent-2)]">Sync</span>
          </button>
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
          <Reorder.Group
            axis="y"
            values={orderedFilteredProperties}
            onReorder={handleReorder}
            data-no-swipe-nav
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
              {orderedFilteredProperties.map((property) => (
                <Reorder.Item
                  key={property.id}
                  value={property}
                  className="list-none"
                  whileDrag={{ scale: 1.03, zIndex: 50, boxShadow: "0 20px 60px rgba(228,0,124,0.25)" }}
                >
                  <PremiumLikedCard
                    type="listing"
                    data={property}
                    onAction={(action) => handleAction(action, property)}
                  />
                </Reorder.Item>
              ))}
          </Reorder.Group>
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
