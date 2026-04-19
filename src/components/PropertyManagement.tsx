import { useState, useEffect, memo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useOwnerListings, type Listing } from '@/hooks/useListings';
import { useOwnerListingLikes } from '@/hooks/useOwnerListingLikes';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Home, Plus, Edit, Trash2, Eye, MapPin, Search, Bike, Zap, Sparkles, ImageIcon, Share2, Briefcase, CheckCircle, ThumbsUp } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ListingPreviewDialog } from '@/components/ListingPreviewDialog';
import { UnifiedListingForm } from '@/components/UnifiedListingForm';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { OwnerListingsStats } from '@/components/OwnerListingsStats';
import { ShareDialog } from '@/components/ShareDialog';

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
    default: return 'bg-rose-500 text-white';
  }
};

export const PropertyManagement = memo(({ initialCategory, initialMode }: PropertyManagementProps) => {
  const { user: _user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { data: listings = [], isLoading, error } = useOwnerListings();
  const { data: listingsWithLikes = [] } = useOwnerListingLikes();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(initialCategory || 'all');
  const [viewingProperty, setViewingProperty] = useState<Listing | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Partial<Listing> | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [sharingListing, setSharingListing] = useState<Listing | null>(null);
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

    let matchesCategory = true;
    if (activeTab === 'property') matchesCategory = !listing.category || listing.category === 'property';
    else if (activeTab === 'motorcycle') matchesCategory = listing.category === 'motorcycle';
    else if (activeTab === 'bicycle') matchesCategory = listing.category === 'bicycle';
    else if (activeTab === 'worker') matchesCategory = listing.category === 'worker' || listing.category === 'services';
    else if (activeTab === 'liked') {
      const likedListing = listingsWithLikes.find(l => l.id === listing.id);
      matchesCategory = !!(likedListing && likedListing.likeCount > 0);
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
      queryClient.setQueryData(['owner-listings'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.filter(item => item.id !== listing.id);
      });

      toast('Deleting...', { description: `Removing ${listing.title}` });

      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id);

      if (error) throw error;

      toast('Deleted', { description: `${listing.title} has been deleted` });

      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

    } catch (_error: unknown) {
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      toast.error('Error', { description: 'Failed to delete property' });
    }
  };

  const handleAvailabilityChange = async (listing: Listing, newStatus: string) => {
    try {
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: newStatus }));

      toast('Updating...', { description: `Marking ${listing.title} as ${newStatus}` });

      const { error } = await supabase
        .from('listings')
        .update({
          status: newStatus,
        })
        .eq('id', listing.id);

      if (error) throw error;

      toast('Updated', { description: `${listing.title} is now ${newStatus}` });

      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

    } catch (_error: unknown) {
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: listing.status }));
      toast.error('Error', { description: 'Failed to update availability' });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-rose-500', text: 'text-white', label: 'Active' },
      available: { bg: 'bg-rose-500', text: 'text-white', label: 'Available' },
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
    { id: 'all', label: 'All', icon: Zap, count: listings.length },
    { id: 'property', label: 'Properties', icon: Home, count: listings.filter(l => !l.category || l.category === 'property').length },
    { id: 'motorcycle', label: 'Motorcycles', icon: MotorcycleIcon, count: listings.filter(l => l.category === 'motorcycle').length },
    { id: 'bicycle', label: 'Bicycles', icon: Bike, count: listings.filter(l => l.category === 'bicycle').length },
    { id: 'worker', label: 'Services', icon: Briefcase, count: listings.filter(l => l.category === 'worker' || l.category === 'services').length },
    { id: 'liked', label: 'Likes', icon: ThumbsUp, count: listingsWithLikes.filter(l => l.likeCount > 0).length },
    { id: 'active', label: 'Active', icon: CheckCircle, count: listings.filter(l => l.status === 'active').length },
    { id: 'rented', label: 'Rented', icon: Home, count: listings.filter(l => l.status === 'rented').length },
  ];

  if (isLoading) {
    return (
      <div className={cn("w-full p-4 sm:p-6", isLight ? 'bg-[#f5f5f5]' : 'bg-gray-900')}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading your listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full p-4 sm:p-6", isLight ? 'bg-[#f5f5f5]' : 'bg-gray-900')}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="p-4 rounded-full bg-red-500/20">
            <Home className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Error Loading Listings</h1>
          <p className="text-muted-foreground text-center">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", isLight ? 'bg-[#f5f5f5]' : 'bg-gray-900')}>
      <div className="p-3 sm:p-6 pb-24 space-y-4 max-w-7xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-3xl shadow-2xl",
            isLight
              ? "bg-white border border-border/50"
              : "bg-white/[0.04] border border-white/[0.06]"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-[var(--color-brand-accent-2)]/10 border border-[var(--color-brand-accent-2)]/20 shadow-[0_0_15px_rgba(228,0,124,0.15)]">
              <Zap className="w-7 h-7 text-[var(--color-brand-accent-2)]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-foreground">My Listings</h1>
              <p className="text-muted-foreground text-sm font-bold">Manage and track all your rental properties</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 bg-[var(--color-brand-accent-2)] hover:bg-[#FF1493] text-white font-black tracking-wide flex-1 sm:flex-initial rounded-2xl h-12 px-6 shadow-[0_8px_24px_rgba(228,0,124,0.3)] transition-all"
              onClick={handleAddProperty}
            >
              <Plus className="w-5 h-5" />
              <span>Add Listing</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Statistics */}
        <OwnerListingsStats listings={listings} isLight={isLight} />

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn("pl-10", isLight ? 'bg-white border-gray-200 text-foreground placeholder:text-gray-400' : 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500')}
          />
        </motion.div>

        {/* Tabs */}
        <div className={cn(
          "flex flex-wrap gap-1.5 p-1.5 rounded-2xl",
          isLight ? 'bg-secondary/60 border border-border/30' : 'bg-white/[0.03] border border-white/[0.06]'
        )}>
          {tabItems.map((tab) => (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl transition-all flex-1 sm:flex-initial justify-center sm:justify-start font-semibold",
                activeTab === tab.id
                  ? isLight
                    ? "bg-white text-foreground shadow-md border border-border/40"
                    : "bg-white/[0.08] text-white shadow-lg border border-white/[0.1]"
                  : isLight
                    ? "text-muted-foreground hover:text-foreground hover:bg-white/60"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="truncate">{tab.label}</span>
              <span className="text-[10px] opacity-60">({tab.count})</span>
            </motion.button>
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
                  <div className={cn(
                    "overflow-hidden rounded-3xl transition-all border shadow-xl hover:shadow-2xl",
                    isLight
                      ? 'bg-white border-border/50 hover:border-primary/30'
                      : 'bg-white/[0.04] border-white/[0.06] hover:border-white/[0.12]'
                  )}>
                    {/* Image */}
                    <div className={cn("relative aspect-[16/10]", isLight ? 'bg-gray-100' : 'bg-gray-700')}>
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className={cn("w-10 h-10", isLight ? 'text-gray-300' : 'text-gray-600')} />
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
                                <ThumbsUp className="w-3 h-3 fill-current" />
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
                        <h3 className="font-semibold text-foreground line-clamp-1">{listing.title}</h3>
                        {(listing.address || listing.city) && (
                          <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {listing.address || listing.city || listing.neighborhood}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {listing.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      {/* Details */}
                      <div className="text-xs text-muted-foreground">
                        {(!listing.category || listing.category === 'property') && (listing as any).bedrooms && (listing as any).bathrooms && (
                          <span>{(listing as any).bedrooms} bed • {(listing as any).bathrooms} bath</span>
                        )}
                        {listing.category === 'motorcycle' && (
                          <span>{(listing as any).vehicle_brand} {(listing as any).vehicle_model}{listing.year && ` • ${listing.year}`}</span>
                        )}
                        {listing.category === 'bicycle' && (
                          <span>{(listing as any).vehicle_brand} {(listing as any).vehicle_model}{listing.electric_assist && ' • Electric'}</span>
                        )}
                      </div>

                      {/* Availability Dropdown */}
                      <div className={cn("pt-2 border-t", isLight ? 'border-border/30' : 'border-white/[0.06]')}>
                        <select
                          value={availabilityStatus[listing.id] || listing.status || 'active'}
                          onChange={(e) => handleAvailabilityChange(listing, e.target.value)}
                          className={cn(
                            "w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-primary transition-colors",
                            isLight ? 'bg-secondary/60 text-foreground border-border/30' : 'bg-white/[0.04] text-white border-white/[0.08]'
                          )}
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
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          className={cn(
                            "flex items-center justify-center h-10 rounded-xl text-xs transition-all",
                            isLight ? "bg-blue-50 text-blue-600 border border-blue-200/60 hover:bg-blue-100" : "bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20"
                          )}
                          onClick={() => handleViewProperty(listing)}
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          className={cn(
                            "flex items-center justify-center h-10 rounded-xl text-xs transition-all",
                            isLight ? "bg-purple-50 text-purple-600 border border-purple-200/60 hover:bg-purple-100" : "bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                          )}
                          onClick={() => handleShareListing(listing)}
                        >
                          <Share2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          className={cn(
                            "flex items-center justify-center h-10 rounded-xl text-xs transition-all",
                            isLight ? "bg-rose-50 text-rose-600 border border-rose-200/60 hover:bg-rose-100" : "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                          )}
                          onClick={() => handleEditProperty(listing)}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              className={cn(
                                "flex items-center justify-center h-10 rounded-xl text-xs transition-all",
                                isLight ? "bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                              )}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </AlertDialogTrigger>
          <AlertDialogContent className={cn(
            "rounded-3xl",
            isLight ? 'bg-white border-border/50' : 'bg-[#1a1a1a] border-white/[0.08]'
          )}>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete Listing</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Are you sure you want to delete "{listing.title}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={cn("rounded-xl", isLight ? 'bg-secondary text-foreground border-border/30' : 'bg-white/[0.06] text-white border-white/[0.08]')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteProperty(listing)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex flex-col items-center justify-center py-24 text-center rounded-[3rem] border",
                isLight ? "bg-muted/30 border-border/40" : "bg-white/[0.02] border-white/[0.06]"
              )}
            >
              <div className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl border",
                isLight ? "bg-muted border-border/30" : "bg-white/[0.04] border-white/[0.08]"
              )}>
                {searchTerm ? (
                  <Search className="w-12 h-12 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
                ) : (
                  <Sparkles className="w-12 h-12 text-[var(--color-brand-accent-2)]/60 animate-pulse" />
                )}
              </div>
              <h3 className="text-foreground font-black text-2xl tracking-tighter mb-4">
                {searchTerm ? 'No Results Found' : 'No Listings Yet'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-bold mb-10">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'Start by adding your first listing to attract clients.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddProperty}
                  className="px-8 py-4 rounded-2xl text-sm font-black text-white transition-all active:scale-95 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Listing
                  </span>
                </button>
              )}
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
        editingProperty={editingProperty as any ?? undefined}
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

    </div>
  );
});
