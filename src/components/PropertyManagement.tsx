import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOwnerListings } from '@/hooks/useListings';
import { useOwnerListingLikes } from '@/hooks/useOwnerListingLikes';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Home, Plus, Edit, Trash2, Eye, MapPin, Search, Bike, CircleDot, LayoutGrid, Sparkles, ImageIcon, Share2, Briefcase, CheckCircle, Heart } from 'lucide-react';
import { ListingPreviewDialog } from '@/components/ListingPreviewDialog';
import { UnifiedListingForm } from '@/components/UnifiedListingForm';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { OwnerListingsStats } from '@/components/OwnerListingsStats';
import { ShareDialog } from '@/components/ShareDialog';
import { AIListingAssistant } from '@/components/AIListingAssistant';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PropertyManagementProps {
  initialCategory?: string | null;
  initialMode?: string | null;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'worker': 
    case 'services': return 'bg-blue-500 text-white';
    case 'motorcycle': return 'bg-orange-500 text-white';
    case 'bicycle': return 'bg-purple-500 text-white';
    default: return 'bg-emerald-500 text-white';
  }
};

export const PropertyManagement = memo(({ initialCategory, initialMode }: PropertyManagementProps) => {
  const { user } = useAuth();
  const { data: listings = [], isLoading, error } = useOwnerListings();
  const { data: listingsWithLikes = [] } = useOwnerListingLikes();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(initialCategory || 'all');
  const [viewingProperty, setViewingProperty] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingListing, setSharingListing] = useState<any>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  // Auto-open form when category is provided via URL params
  useEffect(() => {
    if (initialCategory && initialMode) {
      setEditingProperty({ category: initialCategory, mode: initialMode });
      setIsFormOpen(true);
      setActiveTab(initialCategory);
    }
  }, [initialCategory, initialMode]);

  // Initialize availability status from listings
  useEffect(() => {
    const statusMap: Record<string, string> = {};
    listings.forEach(listing => {
      statusMap[listing.id] = listing.status || 'active';
    });
    setAvailabilityStatus(statusMap);
  }, [listings]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      listing.address?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      listing.city?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      listing.neighborhood?.toLowerCase()?.includes(searchTerm.toLowerCase());

    // Filter by category
    let matchesCategory = true;
    if (activeTab === 'property') matchesCategory = !listing.category || listing.category === 'property';
    else if (activeTab === 'motorcycle') matchesCategory = listing.category === 'motorcycle';
    else if (activeTab === 'bicycle') matchesCategory = listing.category === 'bicycle';
    else if (activeTab === 'worker') matchesCategory = listing.category === 'worker' || listing.category === 'services';
    else if (activeTab === 'liked') {
      // For liked tab, check if listing has any likes
      const likedListing = listingsWithLikes.find(l => l.id === listing.id);
      matchesCategory = likedListing && likedListing.likeCount > 0;
    }
    else if (activeTab === 'active') matchesCategory = listing.status === 'active';
    else if (activeTab === 'rented') matchesCategory = listing.status === 'rented';
    else if (activeTab === 'maintenance') matchesCategory = listing.status === 'maintenance';

    return matchesSearch && matchesCategory;
  });

  const handleAddProperty = () => {
    setEditingProperty(null);
    setShowCategoryDialog(true);
  };

  const handleAIComplete = (data: { category: string; images: string[]; formData: Record<string, unknown> }) => {
    setEditingProperty({
      category: data.category,
      mode: data.formData.mode || 'rent',
      images: data.images,
      ...data.formData,
    });
    setShowAIAssistant(false);
    setIsFormOpen(true);
  };

  const handleCategorySelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker', mode: 'rent' | 'sale' | 'both') => {
    setEditingProperty({ category, mode });
    setShowCategoryDialog(false);
    setIsFormOpen(true);
  };

  const handleEditProperty = (listing: any) => {
    setEditingProperty(listing);
    setIsFormOpen(true);
  };

  const handleViewProperty = (listing: any) => {
    setViewingProperty(listing);
    setShowPreview(true);
  };

  const handleShareListing = (listing: any) => {
    setSharingListing(listing);
    setShowShareDialog(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setViewingProperty(null);
  };

  const handleEditFromPreview = () => {
    if (viewingProperty) {
      setEditingProperty(viewingProperty);
      setShowPreview(false);
      setIsFormOpen(true);
    }
  };

  const handleDeleteProperty = async (listing: any) => {
    try {
      // Optimistic update
      queryClient.setQueryData(['owner-listings'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.filter(item => item.id !== listing.id);
      });

      toast({
        title: 'Deleting...',
        description: `Removing ${listing.title}`,
      });

      // Delete from database
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: `${listing.title} has been deleted`,
      });

      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

    } catch (error: any) {
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      toast({
        title: 'Error',
        description: 'Failed to delete property',
        variant: 'destructive',
      });
    }
  };

  const handleAvailabilityChange = async (listing: any, newStatus: string) => {
    try {
      // Optimistic update
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: newStatus }));

      toast({
        title: 'Updating...',
        description: `Marking ${listing.title} as ${newStatus}`,
      });

      // Update in database
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: newStatus,
          availability_status: newStatus 
        })
        .eq('id', listing.id);

      if (error) throw error;

      toast({
        title: 'Updated',
        description: `${listing.title} is now ${newStatus}`,
      });

      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

    } catch (error: any) {
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: listing.status }));
      toast({
        title: 'Error',
        description: 'Failed to update availability',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-500', text: 'text-white', label: 'Active' },
      available: { bg: 'bg-emerald-500', text: 'text-white', label: 'Available' },
      rented: { bg: 'bg-blue-500', text: 'text-white', label: 'Rented' },
      sold: { bg: 'bg-purple-500', text: 'text-white', label: 'Sold' },
      maintenance: { bg: 'bg-yellow-500', text: 'text-white', label: 'Maintenance' },
      pending: { bg: 'bg-gray-500', text: 'text-white', label: 'Pending' },
      inactive: { bg: 'bg-red-500', text: 'text-white', label: 'Inactive' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={cn("text-[10px] font-medium", config.bg, config.text)}>
        {config.label}
      </Badge>
    );
  };

  const tabItems = [
    { id: 'all', label: 'All', icon: LayoutGrid, count: listings.length },
    { id: 'property', label: 'Properties', icon: Home, count: listings.filter(l => !l.category || l.category === 'property').length },
    { id: 'motorcycle', label: 'Motorcycles', icon: CircleDot, count: listings.filter(l => l.category === 'motorcycle').length },
    { id: 'bicycle', label: 'Bicycles', icon: Bike, count: listings.filter(l => l.category === 'bicycle').length },
    { id: 'worker', label: 'Services', icon: Briefcase, count: listings.filter(l => l.category === 'worker' || l.category === 'services').length },
    { id: 'liked', label: 'Likes', icon: Heart, count: listingsWithLikes.filter(l => l.likeCount > 0).length },
    { id: 'active', label: 'Active', icon: CheckCircle, count: listings.filter(l => l.status === 'active').length },
    { id: 'rented', label: 'Rented', icon: Home, count: listings.filter(l => l.status === 'rented').length },
  ];

  if (isLoading) {
    return (
      <div className="w-full bg-gray-900 p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-white/80">Loading your listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-900 p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="p-4 rounded-full bg-red-500/20">
            <Home className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Error Loading Listings</h1>
          <p className="text-white/60 text-center">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900">
      <div className="p-3 sm:p-6 pb-24 space-y-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20 border border-primary/20">
              <LayoutGrid className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Listings</h1>
              <p className="text-white/60 text-sm">Manage and track all your rental properties</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 flex-1 sm:flex-initial"
              onClick={() => setShowAIAssistant(true)}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI</span>
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold flex-1 sm:flex-initial"
              onClick={handleAddProperty}
            >
              <Plus className="w-4 h-4" />
              <span>Add Listing</span>
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <OwnerListingsStats listings={listings} />

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-gray-800/50 rounded-xl">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all flex-1 sm:flex-initial justify-center sm:justify-start",
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
              <span className="text-xs opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Listings Grid */}
        <AnimatePresence mode="wait">
          {filteredListings.length > 0 ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-primary/30 transition-all">
                    {/* Image */}
                    <div className="relative aspect-[16/10] bg-gray-700">
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-600" />
                        </div>
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <Badge className={cn("text-[10px]", getCategoryColor(listing.category || 'property'))}>
                          {listing.category === 'worker' || listing.category === 'services' ? 'Service' :
                           listing.category === 'motorcycle' ? 'Moto' :
                           listing.category === 'bicycle' ? 'Bike' : 'Property'}
                        </Badge>
                        {getStatusBadge(availabilityStatus[listing.id] || listing.status)}
                      </div>

                      {/* Like Count Badge */}
                      {(() => {
                        const likedListing = listingsWithLikes.find(l => l.id === listing.id);
                        if (likedListing && likedListing.likeCount > 0) {
                          return (
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-pink-500/90 text-white text-[10px] gap-1">
                                <Heart className="w-3 h-3 fill-current" />
                                {likedListing.likeCount}
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Price */}
                      <div className="absolute bottom-2 left-2">
                        <div className="px-2 py-1 rounded bg-black/70">
                          <span className="text-white font-bold">
                            ${listing.price?.toLocaleString() || 'N/A'}
                          </span>
                          {listing.mode === 'rent' && (
                            <span className="text-xs text-gray-300">/mo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="font-semibold text-white line-clamp-1">{listing.title}</h3>
                        {(listing.address || listing.city) && (
                          <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {listing.address || listing.city || listing.neighborhood}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {listing.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="text-xs text-gray-400">
                        {(!listing.category || listing.category === 'property') && listing.bedrooms && listing.bathrooms && (
                          <span>{listing.bedrooms} bed • {listing.bathrooms} bath</span>
                        )}
                        {listing.category === 'motorcycle' && (
                          <span>{listing.vehicle_brand} {listing.vehicle_model}{listing.year && ` • ${listing.year}`}</span>
                        )}
                        {listing.category === 'bicycle' && (
                          <span>{listing.vehicle_brand} {listing.vehicle_model}{listing.electric_assist && ' • Electric'}</span>
                        )}
                      </div>

                      {/* Availability Dropdown */}
                      <div className="pt-2 border-t border-gray-700">
                        <select
                          value={availabilityStatus[listing.id] || listing.status || 'active'}
                          onChange={(e) => handleAvailabilityChange(listing, e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-primary"
                        >
                          <option value="available">Available</option>
                          <option value="active">Active</option>
                          <option value="rented">Rented Out</option>
                          <option value="sold">Sold</option>
                          <option value="pending">Pending</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs h-9"
                          onClick={() => handleViewProperty(listing)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs h-9"
                          onClick={() => handleShareListing(listing)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs h-9"
                          onClick={() => handleEditProperty(listing)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30 text-xs h-9"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Listing</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                Are you sure you want to delete "{listing.title}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProperty(listing)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <Card className="bg-gray-800/30 border-gray-700/30 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="p-4 rounded-2xl bg-gray-700/30 mb-4">
                    {searchTerm ? (
                      <Search className="w-12 h-12 text-gray-500" />
                    ) : (
                      <Sparkles className="w-12 h-12 text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchTerm ? 'No Results Found' : 'No Listings Yet'}
                  </h3>
                  <p className="text-gray-400 mb-6 text-center max-w-md">
                    {searchTerm
                      ? 'Try adjusting your search terms.'
                      : 'Start by adding your first listing.'}
                  </p>
                  {!searchTerm && (
                    <Button
                      className="gap-2 bg-primary hover:bg-primary/90 text-white"
                      onClick={handleAddProperty}
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Listing
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <ListingPreviewDialog
        isOpen={showPreview}
        onClose={handleClosePreview}
        property={viewingProperty}
        onEdit={handleEditFromPreview}
        showEditButton={true}
      />

      <CategorySelectionDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
        onCategorySelect={handleCategorySelect}
      />

      <UnifiedListingForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProperty(null);
        }}
        editingProperty={editingProperty}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) setSharingListing(null);
        }}
        listingId={sharingListing?.id}
        title={sharingListing?.title || 'Listing'}
        description={`${sharingListing?.title} - $${sharingListing?.price?.toLocaleString() || ''}`}
      />

      <AIListingAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        onComplete={handleAIComplete}
      />
    </div>
  );
});
