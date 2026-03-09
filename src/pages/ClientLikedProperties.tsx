import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";

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
import { motion, AnimatePresence, Reorder } from "framer-motion";
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
  onPropertyInsights?: (listingId: string) => void;
  onClientInsights?: (clientId: string) => void;
  onMessageClick?: () => void;
}

const ClientLikedProperties = ({ onPropertyInsights }: ClientLikedPropertiesProps) => {
  const { theme } = useTheme();
  const isLight = theme === "white-matte";
  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    images: string[];
    alt: string;
    initialIndex: number;
  }>({ isOpen: false, images: [], alt: "", initialIndex: 0 });
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      onPropertyInsights?.(property.id);
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
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-[calc(56px+var(--safe-top)+1rem)] sm:p-8 sm:pt-[calc(56px+var(--safe-top)+2rem)] max-w-7xl mx-auto">
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["liked-properties"] });
              refreshLikedProperties();
            }}
            disabled={isLoading || isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
            <span className="text-xs font-black uppercase tracking-widest text-[#E4007C]">Sync</span>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-3 mb-10 overflow-x-auto scrollbar-hide pb-2 pt-4">
          {categories.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => handleCategoryChange(id)}
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

        {/* Count + drag hint */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_10px_#E4007C]" />
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-32 text-center bg-muted/30 rounded-[3rem] border border-border"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-8 shadow-2xl border border-border">
              <Flame className="w-12 h-12 text-[#E4007C]/40" />
            </div>
            <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">Pure Potential.</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold">
              Your favorite listings will appear here. Start swiping to fill your world.
            </p>
            <button
              onClick={() => navigate("/client/dashboard")}
              className="mt-10 px-8 py-4 rounded-2xl bg-[#E4007C] text-white text-sm font-black tracking-widest hover:bg-[#FF1493] transition-all active:scale-95 shadow-[0_10px_30px_rgba(228,0,124,0.3)]"
            >
              EXPLORE WORLD
            </button>
          </motion.div>
        )}
      </div>

      <PropertyImageGallery
        images={galleryState.images}
        alt={galleryState.alt}
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState((prev) => ({ ...prev, isOpen: false }))}
        initialIndex={galleryState.initialIndex}
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
              className="bg-[#E4007C] hover:bg-[#FF1493] text-white rounded-xl font-black"
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
