/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { LikedPropertiesDialog } from "@/components/LikedPropertiesDialog";
import { LikedListingInsightsModal } from "@/components/LikedListingInsightsModal";
import { PropertyDetails } from "@/components/PropertyDetails";
import { PropertyImageGallery } from "@/components/PropertyImageGallery";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLikedProperties } from "@/hooks/useLikedProperties";
import { useUserSubscription } from "@/hooks/useSubscription";
import { useStartConversation, useConversationStats } from "@/hooks/useConversations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Flame, MessageCircle, MapPin, Bed, Bath, Square, Crown, ExternalLink, RefreshCw, ArrowLeft, Home, Bike, Briefcase, Trash2, MoreVertical } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { MessageQuotaDialog } from "@/components/MessageQuotaDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  { id: 'all', label: 'all', icon: Flame, title: 'Your Likes', subtitle: '' },
  { id: 'property', label: 'properties', icon: Home, title: 'Your Likes', subtitle: '' },
  { id: 'motorcycle', label: 'motos', icon: MotorcycleIcon, title: 'Your Likes', subtitle: '' },
  { id: 'bicycle', label: 'bikes', icon: Bike, title: 'Your Likes', subtitle: '' },
  { id: 'worker', label: 'services', icon: Briefcase, title: 'Your Likes', subtitle: '' },
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
            {/* Dynamic Title with PageHeader - only one back button */}
            <PageHeader
              title={currentCategory.title}
              subtitle={currentCategory.subtitle}
              showBack={true}
              actions={
                <Button
                  onClick={() => {
                    // Force a fresh fetch by invalidating the cache
                    queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
                    refreshLikedProperties();
                  }}
                  variant="outline"
                  size="sm"
                  disabled={isLoading || isFetching}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${(isLoading || isFetching) ? 'animate-spin' : ''}`} />
                  refresh
                </Button>
              }
            />

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="w-full mb-6">
              <TabsList className="grid w-full grid-cols-5 h-auto overflow-x-auto">
                {categories.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm"
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.substring(0, 4)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Count indicator */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
              <Flame className="w-4 h-4" />
              <span>{filteredProperties.length} {selectedCategory === 'all' ? 'liked items' : `liked ${selectedCategory}`}</span>
            </div>

            {isLoading ? (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading your liked properties...</p>
                </CardContent>
              </Card>
            ) : filteredProperties.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => (
                  <Card key={property.id} className="bg-card border-border md:hover:bg-accent/50 transition-all duration-300 overflow-hidden shadow-sm cursor-pointer touch-manipulation" onClick={() => handlePropertyClick(property)}>
                    {/* Property Image */}
                    <div
                      className="relative h-48 overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(property, 0);
                      }}
                    >
                      {property.images && property.images.length > 0 ? (
                        <>
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="w-full h-full object-cover md:hover:scale-105 transition-transform duration-300"
                          />
                          {/* Image counter */}
                          {property.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                              1 / {property.images.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Flame className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-red-500 hover:bg-red-600">
                          <Flame className="w-3 h-3 mr-1 fill-current" />
                          Liked
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="bg-background hover:bg-accent text-foreground shadow-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveLike(property);
                              }}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove from Likes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground text-lg flex items-center justify-between">
                        <span className="truncate">{property.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {property.property_type}
                        </Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Location */}
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate">{property.address}</span>
                      </div>

                      {/* Property Details */}
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        {property.beds && (
                          <div className="flex items-center gap-1">
                            <Bed className="w-4 h-4" />
                            <span>{property.beds}</span>
                          </div>
                        )}
                        {property.baths && (
                          <div className="flex items-center gap-1">
                            <Bath className="w-4 h-4" />
                            <span>{property.baths}</span>
                          </div>
                        )}
                        {property.square_footage && (
                          <div className="flex items-center gap-1">
                            <Square className="w-4 h-4" />
                            <span>{property.square_footage} ft²</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-foreground font-bold text-xl">
                        ${property.price?.toLocaleString()}/month
                      </div>

                      {/* Amenities */}
                      {property.amenities && property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {property.amenities.slice(0, 3).map((amenity) => (
                            <span key={`${property.id}-amenity-${amenity}`} className="bg-primary/20 text-primary px-2 py-1 rounded text-xs">
                              {amenity}
                            </span>
                          ))}
                          {property.amenities.length > 3 && (
                            <span className="text-muted-foreground text-xs">+{property.amenities.length - 3} more</span>
                          )}
                        </div>
                      )}

                      {/* Contact Button */}
                      <div className="pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContactOwner(property);
                          }}
                          disabled={startConversation.isPending}
                          className="w-full"
                        >
                          {startConversation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Contact Owner
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Flame className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {selectedCategory === 'all' ? 'No Liked Items' : `No Liked ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {selectedCategory === 'all'
                      ? 'Items you like will appear here.'
                      : `Swipe right on ${selectedCategory} listings to add them here.`}
                  </p>
                  {selectedCategory !== 'all' && likedProperties.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleCategoryChange('all')}
                    >
                      View All Likes ({likedProperties.length})
                    </Button>
                  )}
                </CardContent>
              </Card>
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
        <AlertDialogContent>
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
            <AlertDialogCancel onClick={() => setPropertyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveLike}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
