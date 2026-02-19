// @ts-nocheck
/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { LikedPropertiesDialog } from "@/components/LikedPropertiesDialog";
import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";
import { PropertyDetails } from "@/components/PropertyDetails";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useUserSubscription } from "@/hooks/useSubscription";
import { useStartConversation, useConversationStats } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, MessageCircle, MapPin, Bed, Bath, Square, Crown, RefreshCw, ArrowLeft, Home, Bike, Briefcase, Trash2, MoreVertical } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { MessageQuotaDialog } from "@/components/MessageQuotaDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Custom motorcycle icon
function MotorcycleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M9 17h6" />
      <path d="M19 17l-2-7h-4l-1 4" />
      <path d="M12 10l-1-3h-2l-1 3" />
      <path d="M5 17l2-7h2" />
    </svg>
  );
}

// Category configuration with dynamic titles
const categories = [
  { id: 'all', label: 'All', icon: Flame, title: 'Your Likes', subtitle: '' },
  { id: 'property', label: 'Homes', icon: Home, title: 'Your Likes', subtitle: '' },
  { id: 'motorcycle', label: 'Motos', icon: MotorcycleIcon, title: 'Your Likes', subtitle: '' },
  { id: 'bicycle', label: 'Bikes', icon: Bike, title: 'Your Likes', subtitle: '' },
  { id: 'worker', label: 'Services', icon: Briefcase, title: 'Your Likes', subtitle: '' },
];

const ClientLikedProperties = () => {
  const [showLikedDialog, setShowLikedDialog] = useState(false);
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
  const { data: subscription } = useUserSubscription();
  const { data: conversationStats } = useConversationStats();
  const startConversation = useStartConversation();
  const navigate = useNavigate();
  const { canStartNewConversation } = useMessagingQuota();
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get conversations remaining from the stats
  const conversationsRemaining = conversationStats?.conversationsLeft || 0;

  // Remove like mutation
  const removeLikeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      // SCHEMA: target_id = listing ID, target_type = 'listing'
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user?.id)
        .eq('target_id', propertyId)
        .eq('target_type', 'listing');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast({
        title: "Removed",
        description: "Property removed from your likes",
      });
      setShowDeleteDialog(false);
      setPropertyToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove property from likes",
        variant: "destructive"
      });
    }
  });

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchParams({ category });
  };

  // Filter properties by category
  const filteredProperties = likedProperties.filter(property => {
    if (selectedCategory === 'all') return true;

    // Check the category field
    const propertyCategory = property.category?.toLowerCase() || '';
    const selectedCat = selectedCategory.toLowerCase();

    // Handle various category mappings
    if (selectedCat === 'property') {
      return propertyCategory === 'property' || propertyCategory === '' || !property.category;
    }
    if (selectedCat === 'motorcycle') {
      return propertyCategory === 'motorcycle' || propertyCategory === 'moto';
    }

    return propertyCategory === selectedCat;
  });

  // Handle remove like
  const handleRemoveLike = (property: any) => {
    setPropertyToDelete(property);
    setShowDeleteDialog(true);
  };

  const confirmRemoveLike = () => {
    if (propertyToDelete) {
      removeLikeMutation.mutate(propertyToDelete.id);
    }
  };

  const handlePropertySelect = (listingId: string) => {
    setSelectedListingId(listingId);
    setShowPropertyDetails(true);
  };

  const handleContactOwner = async (property: any) => {

    // Always allow messaging - bypass quota
    try {
      // Start a conversation with the property owner
      const result = await startConversation.mutateAsync({
        otherUserId: property.owner_id,
        listingId: property.id,
        initialMessage: `Hi! I'm interested in your property: ${property.title}. Could you tell me more about it?`,
        canStartNewConversation: true // Always allow
      });


      // Navigate to messages with the conversation ID to open it directly
      if (result?.conversationId) {
        navigate(`/messages?conversationId=${result.conversationId}`);
      } else {
        navigate('/messages');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
      toast({
        title: "Unable to start conversation",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleImageClick = (property: any, imageIndex: number = 0) => {
    if (property.images && property.images.length > 0) {
      setGalleryState({
        isOpen: true,
        images: property.images,
        alt: property.title,
        initialIndex: imageIndex
      });
    }
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property);
    setShowInsightsModal(true);
  };

  // Get current category info for dynamic title
  const currentCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  return (
    <>
      <div className="w-full pb-24 bg-background">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Dynamic Title with PageHeader */}
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all duration-150 active:scale-95 touch-manipulation disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  <RefreshCw className={`w-4 h-4 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              }
            />

            {/* Category Tabs - premium pill style */}
            <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
              {categories.map(({ id, label, icon: Icon }) => {
                const isActive = selectedCategory === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => handleCategoryChange(id)}
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation flex-shrink-0',
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
                        : 'text-white/60 hover:text-white'
                    )}
                    style={!isActive ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Count indicator */}
            <div className="flex items-center gap-2 text-white/40 text-sm mb-5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>{filteredProperties.length} {selectedCategory === 'all' ? 'liked items' : `liked ${selectedCategory}`}</span>
            </div>

            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded-3xl overflow-hidden animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div className="h-56 bg-white/5" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-white/10 rounded-xl w-3/4" />
                      <div className="h-3 bg-white/5 rounded-xl w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredProperties.map((property, idx) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                    className="rounded-3xl overflow-hidden cursor-pointer touch-manipulation group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                    onClick={() => handlePropertyClick(property)}
                    whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.45)' }}
                  >
                    {/* Cinematic Image */}
                    <div
                      className="relative overflow-hidden"
                      style={{ height: '220px' }}
                      onClick={(e) => { e.stopPropagation(); handleImageClick(property, 0); }}
                    >
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <Flame className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.15)' }} />
                        </div>
                      )}

                      {/* Cinematic bottom gradient */}
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.85) 100%)' }}
                      />

                      {/* Floating price + title on image */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-base leading-tight truncate drop-shadow-lg">
                              {property.title}
                            </h3>
                            {property.address && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
                                <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>{property.address}</span>
                              </div>
                            )}
                          </div>
                          <div
                            className="px-3 py-1.5 rounded-2xl flex-shrink-0"
                            style={{
                              background: 'rgba(0,0,0,0.6)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(255,255,255,0.15)',
                            }}
                          >
                            <span className="text-white font-bold text-sm">${property.price?.toLocaleString()}</span>
                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>/mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Category badge top-left */}
                      <div className="absolute top-3 left-3">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{
                            background: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(249,115,22,0.85))',
                            backdropFilter: 'blur(8px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          }}
                        >
                          {property.category || 'Property'}
                        </span>
                      </div>

                      {/* Menu top-right */}
                      <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="flex items-center justify-center w-8 h-8 rounded-2xl backdrop-blur-md touch-manipulation"
                              style={{
                                background: 'rgba(0,0,0,0.55)',
                                border: '1px solid rgba(255,255,255,0.15)',
                              }}
                            >
                              <MoreVertical className="w-4 h-4 text-white" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleRemoveLike(property); }}
                              className="text-destructive focus:text-destructive cursor-pointer rounded-xl"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from Likes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Image count */}
                      {property.images && property.images.length > 1 && (
                        <div
                          className="absolute bottom-16 right-3 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                        >
                          1/{property.images.length}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      {/* Metadata pills */}
                      {(property.beds || property.baths || property.square_footage) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {property.beds && (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              <Bed className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                              <span className="text-xs font-semibold text-white">{property.beds} bed</span>
                            </div>
                          )}
                          {property.baths && (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              <Bath className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                              <span className="text-xs font-semibold text-white">{property.baths} bath</span>
                            </div>
                          )}
                          {property.square_footage && (
                            <div
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              <Square className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                              <span className="text-xs font-semibold text-white">{property.square_footage} ft²</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Amenities */}
                      {property.amenities && property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {property.amenities.slice(0, 3).map((amenity) => (
                            <span
                              key={`${property.id}-amenity-${amenity}`}
                              className="px-2 py-0.5 rounded-xl text-xs font-medium"
                              style={{
                                background: 'rgba(249,115,22,0.1)',
                                border: '1px solid rgba(249,115,22,0.2)',
                                color: '#fb923c',
                              }}
                            >
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>+{property.amenities.length - 3}</span>
                          )}
                        </div>
                      )}

                      {/* Contact Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleContactOwner(property); }}
                        disabled={startConversation.isPending}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all duration-150 active:scale-[0.97] touch-manipulation disabled:opacity-50"
                        style={{
                          background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
                          boxShadow: '0 4px 16px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                        }}
                      >
                        {startConversation.isPending ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" />Connecting...</>
                        ) : (
                          <><MessageCircle className="w-4 h-4" />Contact Owner</>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <Flame className="w-8 h-8 text-orange-400/60" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedCategory === 'all' ? 'No Liked Items' : `No Liked ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
                </h3>
                <p className="text-white/40 text-sm">
                  {selectedCategory === 'all'
                    ? 'Items you like will appear here.'
                    : `Swipe right on ${selectedCategory} listings to add them here.`}
                </p>
                {selectedCategory !== 'all' && likedProperties.length > 0 && (
                  <button
                    className="mt-5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white transition-all touch-manipulation"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                    onClick={() => handleCategoryChange('all')}
                  >
                    View All Likes ({likedProperties.length})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <LikedPropertiesDialog
        isOpen={showLikedDialog}
        onClose={() => setShowLikedDialog(false)}
        onPropertySelect={handlePropertySelect}
      />

      <PropertyDetails
        listingId={selectedListingId}
        isOpen={showPropertyDetails}
        onClose={() => {
          setShowPropertyDetails(false);
          setSelectedListingId(null);
        }}
        onMessageClick={() => {
          const selectedProperty = likedProperties.find(p => p.id === selectedListingId) || filteredProperties.find(p => p.id === selectedListingId);
          if (selectedProperty) {
            handleContactOwner(selectedProperty);
          }
        }}
      />

      <PropertyImageGallery
        images={galleryState.images}
        alt={galleryState.alt}
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState(prev => ({ ...prev, isOpen: false }))}
        initialIndex={galleryState.initialIndex}
      />

      <MessageQuotaDialog
        isOpen={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        onUpgrade={() => {
          setShowQuotaDialog(false);
          navigate('/subscription-packages');
        }}
        userRole={'client'}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Remove from Likes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{propertyToDelete?.title}" from your liked properties?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={() => setPropertyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveLike}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
              disabled={removeLikeMutation.isPending}
            >
              {removeLikeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Listing Insights Modal with Delete, Block, Report Actions */}
      <LikedListingInsightsModal
        open={showInsightsModal}
        onOpenChange={setShowInsightsModal}
        listing={selectedProperty}
      />
    </>
  );
};

export default ClientLikedProperties;
