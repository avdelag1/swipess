import { useState, useEffect, memo } from 'react';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useOwnerListings, type Listing } from '@/hooks/useListings';
import { useOwnerListingLikes } from '@/hooks/useOwnerListingLikes';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
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
import { triggerHaptic } from '@/utils/haptics';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PropertyManagementProps {
  initialCategory?: string | null;
  initialMode?: string | null;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'worker':
    case 'services': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
    case 'motorcycle': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
    case 'bicycle': return 'text-purple-500 border-purple-500/20 bg-purple-500/5';
    default: return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
  }
};

export const PropertyManagement = memo(({ initialCategory, initialMode }: PropertyManagementProps) => {
  const { user: _user } = useAuth();
  const { theme, isLight } = useAppTheme();
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
    triggerHaptic('medium');
    setEditingProperty(null);
    setShowCategoryDialog(true);
  };

  const handleCategorySelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker', mode: 'rent' | 'sale' | 'both') => {
    triggerHaptic('success');
    setEditingProperty({ category, mode });
    setShowCategoryDialog(false);
    setIsFormOpen(true);
  };

  const handleEditProperty = (listing: any) => {
    triggerHaptic('light');
    setEditingProperty(listing);
    setIsFormOpen(true);
  };

  const handleViewProperty = (listing: any) => {
    triggerHaptic('light');
    setViewingProperty(listing);
    setShowPreview(true);
  };

  const handleShareListing = (listing: any) => {
    triggerHaptic('light');
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
      triggerHaptic('warning');
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
      triggerHaptic('medium');
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
      <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5", config.bg, config.text)}>
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
      <div className={cn("w-full transition-colors duration-500 min-h-[50vh] flex flex-col items-center justify-center gap-6", isLight ? "bg-white" : "bg-black")}>
          <div className="w-16 h-16 border-t-2 border-indigo-500 rounded-full animate-spin shadow-2xl" />
          <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-70", isLight ? "text-black" : "text-white")}>Synchronizing Listings...</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[5%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="pb-32 space-y-12 w-full relative z-10">
        
        {/* 🛸 ASSET TERMINAL HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 px-6 pt-10"
        >
          <div className="flex items-center gap-6">
            <div className="p-5 rounded-[1.4rem] bg-indigo-500/10 border border-indigo-500/20 shadow-2xl">
              <Zap className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h1 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", isLight ? "text-black" : "text-white")}>Listing Control</h1>
              <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic mt-2", isLight ? "text-black" : "text-white")}>Real-time Asset Management Protocol</p>
            </div>
          </div>

          <button
            onClick={handleAddProperty}
            className="h-16 px-8 rounded-[2.2rem] font-black uppercase italic tracking-[0.2em] active:scale-95 transition-all text-sm flex items-center"
            style={{ backgroundColor: '#FF4D00', color: 'white', boxShadow: '0 12px 32px rgba(255,77,0,0.35)' }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Deploy Asset
          </button>
        </motion.div>

        {/* 🛸 STATISTICS HUD */}
        <div className="px-6">
            <OwnerListingsStats listings={listings} isLight={isLight} />
        </div>

        {/* 🛸 ASSET CONTROLS */}
        <div className="flex flex-col lg:flex-row gap-6 px-6">
            <div className="relative flex-1 group">
                <Search className={cn("absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70 z-10", isLight ? "text-black" : "text-white")} />
                <Input
                    placeholder="SEARCH ASSETS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                        "h-18 pl-14 pr-6 rounded-[2.2rem] font-black uppercase tracking-widest text-[12px] transition-all border-none outline-none ring-0", 
                        isLight ? 'bg-black/[0.04] text-black placeholder:text-black/20 focus:bg-black/5' : 'bg-white/[0.06] text-white placeholder:text-white/20 focus:bg-white/10'
                    )}
                />
            </div>
            
            <div className="flex flex-col gap-4">
                <div className={cn(
                    "flex items-center gap-3 p-2.5 rounded-[2.5rem] overflow-x-auto no-scrollbar w-full",
                    isLight ? 'bg-black/[0.03] border border-black/5' : 'bg-white/[0.03] border border-white/5'
                )}>
                    {tabItems.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { triggerHaptic('light'); setActiveTab(tab.id); }}
                            className="flex-none flex items-center gap-3 px-6 h-14 rounded-[2rem] transition-all whitespace-nowrap font-black uppercase tracking-widest italic text-[11px]"
                            style={activeTab === tab.id ? {
                            backgroundColor: '#FF4D00',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(255,77,0,0.4)'
                            } : {
                            color: isLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)',
                            backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)'
                            }}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.count > 0 && <span className="opacity-40 ml-1">[{tab.count}]</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* 🛸 LISTINGS GRID */}
        <AnimatePresence mode="wait">
          {filteredListings.length > 0 ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-6"
            >
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className={cn(
                    "overflow-hidden rounded-[3rem] transition-all border shadow-2xl hover:shadow-3xl group-hover:-translate-y-2",
                    isLight
                      ? 'bg-white border-black/5'
                      : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                  )}>
                    {/* 🛸 ASSET MEDIA */}
                    <div className={cn("relative aspect-[16/10] overflow-hidden", isLight ? 'bg-black/5' : 'bg-white/5')}>
                      {listing.images && listing.images.length > 0 ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className={cn("w-12 h-12 opacity-20", isLight ? 'text-black' : 'text-white')} />
                        </div>
                      )}

                      {/* 🛸 BADGES OVERLAY */}
                      <div className="absolute top-6 left-6 flex flex-col gap-2">
                        <Badge className={cn("text-[9px] font-black uppercase tracking-widest border px-3 py-1", getCategoryColor(listing.category || 'property'))}>
                          {listing.category === 'worker' || listing.category === 'services' ? 'Service' :
                            listing.category === 'motorcycle' ? 'Moto' :
                               listing.category === 'bicycle' ? 'Bike' : 'Property'}
                        </Badge>
                        {getStatusBadge(availabilityStatus[listing.id] || listing.status)}
                      </div>

                      {/* 🛸 LIKE TELEMETRY */}
                      {(() => {
                        const likedListing = listingsWithLikes.find(l => l.id === listing.id);
                        if (likedListing && likedListing.likeCount > 0) {
                          return (
                            <div className="absolute top-6 right-6">
                              <Badge className="bg-indigo-500/90 text-white text-[9px] font-black uppercase tracking-widest gap-2 px-3 py-1 backdrop-blur-xl">
                                <ThumbsUp className="w-3 h-3 fill-current" />
                                {likedListing.likeCount} LIKES
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* 🛸 VALUATION */}
                      <div className="absolute bottom-6 left-6">
                        <div className="px-4 py-2 rounded-[1rem] bg-black/80 backdrop-blur-xl border border-white/10">
                          <span className="text-white font-black text-lg tracking-tighter italic">
                            ${listing.price?.toLocaleString() || '---'}
                          </span>
                          {listing.mode === 'rent' && (
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-2 italic">/mo</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-8 space-y-6">
                      {/* 🛸 ASSET INTEL */}
                      <div>
                        <h3 className={cn("text-xl font-black tracking-tighter uppercase italic line-clamp-1", isLight ? "text-black" : "text-white")}>{listing.title}</h3>
                        {(listing.address || listing.city) && (
                          <div className="flex items-center gap-2 mt-2 opacity-70">
                            <MapPin className={cn("w-3 h-3", isLight ? "text-black" : "text-white")} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest truncate", isLight ? "text-black" : "text-white")}>
                              {listing.address || listing.city || listing.neighborhood}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 🛸 STATUS TERMINAL */}
                      <div className={cn("pt-4 border-t", isLight ? 'border-black/5' : 'border-white/5')}>
                        <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-3 ml-1", isLight ? "text-black" : "text-white")}>Operational Status</p>
                        <div className="relative group/select">
                          <div className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full animate-pulse",
                            availabilityStatus[listing.id] === 'active' || availabilityStatus[listing.id] === 'available' ? 'bg-emerald-500' :
                            availabilityStatus[listing.id] === 'maintenance' ? 'bg-amber-500' : 'bg-blue-500'
                          )} />
                          <select
                            value={availabilityStatus[listing.id] || listing.status || 'active'}
                            onChange={(e) => handleAvailabilityChange(listing, e.target.value)}
                            className={cn(
                              "w-full pl-9 pr-10 h-14 text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl border transition-all cursor-pointer outline-none ring-0 appearance-none italic",
                              isLight 
                                ? 'bg-black/[0.03] text-black border-black/5 hover:bg-black/[0.06] hover:border-black/10' 
                                : 'bg-white/[0.04] text-white border-white/5 hover:bg-white/[0.08] hover:border-white/10'
                            )}
                          >
                            <option value="available">Status: Available</option>
                            <option value="active">Status: Active</option>
                            <option value="rented">Status: Rented</option>
                            <option value="sold">Status: Terminated</option>
                            <option value="pending">Status: Pending</option>
                            <option value="maintenance">Status: Maintenance</option>
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 rotate-90 pointer-events-none" />
                        </div>
                      </div>

                      {/* 🛸 ACTION TERMINAL */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl transition-all border group/btn shadow-sm",
                            isLight 
                              ? "bg-white border-black/5 text-black hover:bg-black/[0.02]" 
                              : "bg-white/5 border-white/5 text-white hover:bg-white/8"
                          )}
                          onClick={() => handleViewProperty(listing)}
                        >
                          <Eye className="w-6 h-6 opacity-60 group-hover/btn:opacity-100" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 group-hover/btn:opacity-60">View</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-indigo-500 transition-all hover:bg-indigo-500/10 group/btn"
                          )}
                          onClick={() => handleShareListing(listing)}
                        >
                          <Share2 className="w-6 h-6 opacity-60 group-hover/btn:opacity-100" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Share</span>
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          className={cn(
                            "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-[#EB4898]/5 border border-[#EB4898]/10 text-[#EB4898] transition-all hover:bg-[#EB4898]/10 group/btn"
                          )}
                          onClick={() => handleEditProperty(listing)}
                        >
                          <Edit className="w-6 h-6 opacity-60 group-hover/btn:opacity-100" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Edit</span>
                        </motion.button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              whileTap={{ scale: 0.94 }}
                              className={cn(
                                "flex flex-col items-center justify-center gap-2 h-20 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 transition-all hover:bg-rose-500/10 group/btn"
                              )}
                            >
                              <Trash2 className="w-6 h-6 opacity-60 group-hover/btn:opacity-100" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Purge</span>
                            </motion.button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={cn(
                            "rounded-[3rem] border shadow-3xl p-10 backdrop-blur-3xl",
                            isLight ? 'bg-white border-black/5' : 'bg-black border-white/10'
                          )}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className={cn("text-3xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>Purge Listing?</AlertDialogTitle>
                              <AlertDialogDescription className={cn("text-[14px] font-bold leading-relaxed italic opacity-70", isLight ? "text-black" : "text-white")}>
                                This action will permanently remove <span className="text-rose-500">"{listing.title}"</span> from the global ecosystem. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-10 gap-4">
                              <AlertDialogCancel className={cn("h-14 px-8 rounded-2xl font-black uppercase italic tracking-widest border-none text-[10px]", isLight ? 'bg-black/5 text-black' : 'bg-white/5 text-white')}>Abort</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProperty(listing)}
                                className="h-14 px-8 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase italic tracking-widest text-[10px] shadow-2xl shadow-rose-600/30"
                              >
                                Purge Listing
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
                "flex flex-col items-center justify-center py-32 text-center rounded-[4rem] border mx-6 backdrop-blur-3xl",
                isLight ? "bg-black/[0.02] border-black/5" : "bg-white/[0.02] border-white/5"
              )}
            >
              <div className={cn(
                "w-28 h-28 rounded-[2.2rem] flex items-center justify-center mb-10 shadow-3xl border",
                isLight ? "bg-white border-black/5" : "bg-black border-white/5"
              )}>
                {searchTerm ? (
                  <Search className="w-14 h-14 text-indigo-500/60 animate-pulse" />
                ) : (
                  <Sparkles className="w-14 h-14 text-[#EB4898]/60 animate-pulse" />
                )}
              </div>
              <h3 className={cn("font-black text-3xl tracking-tighter uppercase italic mb-4", isLight ? "text-black" : "text-white")}>
                {searchTerm ? 'Scan Negative' : 'Gallery Empty'}
              </h3>
              <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-70 max-w-xs mx-auto mb-12", isLight ? "text-black" : "text-white")}>
                {searchTerm
                  ? 'No assets found matching current scan parameters. Adjust filters.'
                  : 'Your asset inventory is currently offline. Deploy your first listing to begin broadcast.'}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleAddProperty}
                  className="h-18 px-12 rounded-[2rem] font-black uppercase italic tracking-[0.2em] text-white transition-all active:scale-95 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #EB4898, #6366f1)' }}
                >
                  <span className="flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    Deploy First Listing
                  </span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🛸 DIALOGS */}
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

      <p className="fixed bottom-10 left-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Asset Gallery Terminal v4.0</p>
    </div>
  );
});

PropertyManagement.displayName = 'PropertyManagement';


