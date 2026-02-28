import { LikedPropertiesDialog } from "@/components/LikedPropertiesDialog";
import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";
import { PropertyDetails } from "@/components/PropertyDetails";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useStartConversation } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, MapPin, Home, Bike, Briefcase, RefreshCw, Trash2, Camera, Car } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useTheme } from "@/hooks/useTheme";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
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

// Category configuration
const categories = [
  { id: 'all', label: 'All Likes', icon: Flame, title: 'Your Favorites', subtitle: 'Listings and connections you saved' },
  { id: 'property', label: 'Homes', icon: Home, title: 'Dream Habitats', subtitle: 'Elite living spaces' },
  { id: 'motorcycle', label: 'Motos', icon: Car, title: 'Power & Speed', subtitle: 'Premium machines' },
  { id: 'bicycle', label: 'Bikes', icon: Bike, title: 'Urban Flow', subtitle: 'Sustainable precision' },
  { id: 'worker', label: 'Services', icon: Briefcase, title: 'Elite Talent', subtitle: 'The support you need' },
];

const ClientLikedProperties = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [galleryState, setGalleryState] = useState<{
    isOpen: boolean;
    images: string[];
    alt: string;
    initialIndex: number;
  }>({
    isOpen: false,
    images: [],
    alt: '',
    initialIndex: 0
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const { data: likedProperties = [], isLoading, refetch: refreshLikedProperties, isFetching } = useLikedProperties();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Remove like mutation
  const removeLikeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_id', propertyId)
        .eq('target_type', 'listing');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast.success("Property removed from your likes");
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
    },
    onError: () => {
      toast.error("Failed to remove from likes");
    }
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ category });
  };

  const filteredProperties = likedProperties.filter(property => {
    if (selectedCategory === 'all') return true;
    const propertyCategory = property.category?.toLowerCase() || '';
    const selectedCat = selectedCategory.toLowerCase();
    if (selectedCat === 'property') return propertyCategory === 'property' || !property.category;
    return propertyCategory === selectedCat;
  });

  const handleAction = async (action: 'message' | 'view' | 'remove', property: any) => {
    if (action === 'remove') {
      setPropertyToDelete(property);
      setShowDeleteDialog(true);
      return;
    }

    if (action === 'view') {
      setSelectedProperty(property);
      setShowInsightsModal(true);
      return;
    }

    if (action === 'message') {
      try {
        const result = await startConversation.mutateAsync({
          otherUserId: property.owner_id,
          listingId: property.id,
          initialMessage: `Hi! I'm interested in: ${property.title}. Could you tell me more?`,
          canStartNewConversation: true
        });
        if (result?.conversationId) navigate(`/messages?conversationId=${result.conversationId}`);
        else navigate('/messages');
      } catch (error) {
        toast.error("Unable to start conversation");
      }
    }
  };

  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  return (
    <div className="w-full pb-32 bg-background min-h-screen">
      <div className="p-4 pt-20 sm:p-8 sm:pt-24 max-w-7xl mx-auto">
        <PageHeader
          title={currentCategory.title}
          subtitle={currentCategory.subtitle}
          showBack={true}
          actions={
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
                refreshLikedProperties();
              }}
              disabled={isLoading || isFetching}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/5 text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-4 h-4", (isLoading || isFetching) && "animate-spin")} />
              <span className="text-xs font-black uppercase tracking-widest text-[#E4007C]">Sync</span>
            </button>
          }
        />

        {/* Categories - PREMIUM MEXICAN PINK ACCENT */}
        <div className="flex gap-3 mb-10 overflow-x-auto scrollbar-hide pb-2 pt-4">
          {categories.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => handleCategoryChange(id)}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex items-center gap-2.5 px-6 py-3.5 rounded-3xl text-sm font-black whitespace-nowrap transition-all flex-shrink-0 border",
                selectedCategory === id
                  ? "bg-[#E4007C] border-[#E4007C] text-white shadow-[0_8px_24px_rgba(228,0,124,0.4)]"
                  : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Count Label */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_10px_#E4007C]" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">
            {filteredProperties.length} Saved Essentials
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-[2.5rem] bg-zinc-900/50 animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProperties.map((property) => (
                <PremiumLikedCard
                  key={property.id}
                  type="listing"
                  data={property}
                  onAction={(action) => handleAction(action, property)}
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
              <Flame className="w-12 h-12 text-[#E4007C]/40" />
            </div>
            <h3 className="text-white font-black text-2xl tracking-tighter mb-4">Pure Potential.</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed font-bold">
              Your favorite listings will appear here. Start swiping to fill your world.
            </p>
            <button
              onClick={() => navigate('/client/dashboard')}
              className="mt-10 px-8 py-4 rounded-2xl bg-[#E4007C] text-white text-sm font-black tracking-widest hover:bg-[#FF1493] transition-all active:scale-95 shadow-[0_10px_30px_rgba(228,0,124,0.3)]"
            >
              EXPLORE WORLD
            </button>
          </motion.div>
        )}
      </div>

      {/* Utilities */}
      <PropertyDetails
        listingId={selectedListingId}
        isOpen={showPropertyDetails}
        onClose={() => {
          setShowPropertyDetails(false);
          setSelectedListingId(null);
        }}
        onMessageClick={() => {
          const prop = likedProperties.find(p => p.id === selectedListingId);
          if (prop) handleAction('message', prop);
        }}
      />

      <PropertyImageGallery
        images={galleryState.images}
        alt={galleryState.alt}
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))}
        initialIndex={galleryState.initialIndex}
      />

      <LikedListingInsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        listing={selectedProperty}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-950 border-white/10 rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black text-xl">Remove from World?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 font-bold">
              Are you sure you want to remove "{propertyToDelete?.title}" from your favorites?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-white/5 text-white rounded-xl">Cancel</AlertDialogCancel>
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
