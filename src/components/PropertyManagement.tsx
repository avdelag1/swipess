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
import { Home, Plus, Edit, Trash2, Eye, MapPin, Search, Bike, Zap, Sparkles, ImageIcon, Share2, Briefcase, CheckCircle, ThumbsUp, Activity, Cpu } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { ListingPreviewDialog } from '@/components/ListingPreviewDialog';
import { UnifiedListingForm } from '@/components/UnifiedListingForm';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { OwnerListingsStats } from '@/components/OwnerListingsStats';
import { ShareDialog } from '@/components/ShareDialog';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

interface PropertyManagementProps {
  initialCategory?: string | null;
  initialMode?: string | null;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'worker':
    case 'services': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'motorcycle': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'bicycle': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default: return 'bg-[#EB4898]/10 text-[#EB4898] border-[#EB4898]/20';
  }
};

export const PropertyManagement = memo(({ initialCategory, initialMode }: PropertyManagementProps) => {
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

  useEffect(() => {
    if (initialCategory && initialMode) {
      setEditingProperty({ category: initialCategory, mode: initialMode });
      setIsFormOpen(true);
      setActiveTab(initialCategory);
    }
  }, [initialCategory, initialMode]);

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
    triggerHaptic('medium');
    setEditingProperty(listing);
    setIsFormOpen(true);
  };

  const handleViewProperty = (listing: any) => {
    triggerHaptic('light');
    setViewingProperty(listing);
    setShowPreview(true);
  };

  const handleShareListing = (listing: any) => {
    triggerHaptic('medium');
    setSharingListing(listing);
    setShowShareDialog(true);
  };

  const handleDeleteProperty = async (listing: any) => {
    try {
      triggerHaptic('warning');
      queryClient.setQueryData(['owner-listings'], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.filter(item => item.id !== listing.id);
      });
      const { error } = await supabase.from('listings').delete().eq('id', listing.id);
      if (error) throw error;
      toast.success('Listing Permanently Disconnected');
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    } catch (_error: unknown) {
      toast.error('Sync Error', { description: 'Failed to purge listing' });
    }
  };

  const handleAvailabilityChange = async (listing: Listing, newStatus: string) => {
    try {
      triggerHaptic('medium');
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: newStatus }));
      const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id);
      if (error) throw error;
      toast.success(`Matrix Updated: ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
    } catch (_error: unknown) {
      setAvailabilityStatus(prev => ({ ...prev, [listing.id]: listing.status }));
      toast.error('Sync Error');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-[#EB4898]/20 border-[#EB4898]/40', text: 'text-[#EB4898]', label: 'Active' },
      available: { bg: 'bg-[#EB4898]/20 border-[#EB4898]/40', text: 'text-[#EB4898]', label: 'Available' },
      rented: { bg: 'bg-indigo-500/20 border-indigo-500/40', text: 'text-indigo-400', label: 'Rented' },
      sold: { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400', label: 'Sold' },
      maintenance: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'Maintenance' },
      pending: { bg: 'bg-gray-500/20 border-gray-500/40', text: 'text-gray-400', label: 'Pending' },
      inactive: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: 'Inactive' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={cn("text-[9px] font-black uppercase tracking-widest border", config.bg, config.text)}>
        {config.label}
      </Badge>
    );
  };

  const handleClosePreview = () => setShowPreview(false);
  const handleEditFromPreview = (listing: Listing) => {
    setShowPreview(false);
    setEditingProperty(listing);
    setIsFormOpen(true);
  };

  const tabItems = [
    { id: 'all', label: 'Matrix', icon: Activity, count: listings.length },
    { id: 'property', label: 'Estates', icon: Home, count: listings.filter(l => !l.category || l.category === 'property').length },
    { id: 'motorcycle', label: 'Motos', icon: MotorcycleIcon, count: listings.filter(l => l.category === 'motorcycle').length },
    { id: 'bicycle', label: 'Aqua', icon: Bike, count: listings.filter(l => l.category === 'bicycle').length },
    { id: 'worker', label: 'Crew', icon: Briefcase, count: listings.filter(l => l.category === 'worker' || l.category === 'services').length },
    { id: 'liked', label: 'Pulse', icon: ThumbsUp, count: listingsWithLikes.filter(l => l.likeCount > 0).length },
  ];

  if (isLoading) {
    return (
      <div className={cn("w-full h-[60vh] flex flex-col items-center justify-center p-8 transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
         <div className="relative">
            <div className="w-20 h-20 rounded-[2rem] border-[5px] border-[#EB4898]/10 border-t-[#EB4898] animate-spin shadow-2xl" />
            <Cpu className="absolute inset-0 m-auto w-7 h-7 text-[#EB4898]/40 animate-pulse" />
         </div>
         <p className="text-[10px] font-black uppercase italic tracking-[0.4em] text-[#EB4898] mt-8 animate-pulse">Syncing Asset Grid...</p>
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

      <div className="p-4 sm:p-8 pb-32 space-y-10 max-w-7xl mx-auto w-full relative z-10">
        
        {/* 🛸 ASSET TERMINAL HEADER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 p-10 rounded-[3rem] shadow-2xl transition-all border",
            isLight ? "bg-black/[0.03] border-black/5" : "bg-white/[0.04] border-white/[0.06] backdrop-blur-3xl"
          )}
        >
          <div className="flex items-center gap-6">
            <div className="w-18 h-18 rounded-[1.8rem] bg-gradient-to-br from-[#EB4898] to-orange-500 flex items-center justify-center shadow-2xl">
              <Sparkles className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <h1 className={cn("text-3xl font-black tracking-tighter uppercase italic leading-none", isLight ? "text-black" : "text-white")}>Global Assets</h1>
              <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic mt-2 opacity-50", isLight ? "text-black" : "text-white")}>Terminal Matrix v14.0</p>
            </div>
          </div>
          <Button
            onClick={handleAddProperty}
            className="h-18 px-10 rounded-[2rem] bg-[#EB4898] hover:bg-[#ff5bb0] text-white font-black uppercase italic tracking-[0.2em] shadow-[0_20px_40px_rgba(235,72,152,0.4)] border-none active:scale-95 transition-all text-sm"
          >
            <Plus className="w-6 h-6 mr-3" />
            Deploy Asset
          </Button>
        </motion.div>

        {/* Statistics Hud */}
        <OwnerListingsStats listings={listings} isLight={isLight} />

        {/* Matrix Controls */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EB4898] opacity-50 z-10" />
                <Input
                    placeholder="SCAN MATRIX..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={cn(
                        "h-16 pl-14 pr-6 rounded-[2rem] font-black uppercase tracking-widest text-[12px] transition-all border outline-none", 
                        isLight ? 'bg-black/5 border-black/5 text-black placeholder:text-black/20' : 'bg-white/[0.05] border-white/5 text-white placeholder:text-white/20'
                    )}
                />
            </div>
            
            <div className={cn(
                "flex items-center gap-1.5 p-2 rounded-[2.2rem] border overflow-x-auto no-scrollbar backdrop-blur-3xl",
                isLight ? 'bg-black/5 border-black/5' : 'bg-white/[0.03] border-white/5'
            )}>
                {tabItems.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { triggerHaptic('light'); setActiveTab(tab.id); }}
                        className={cn(
                            "flex items-center gap-3 px-6 h-12 rounded-[1.8rem] transition-all whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-[#EB4898] text-white shadow-xl shadow-[#EB4898]/20"
                                : isLight ? "text-black/40 hover:bg-black/5" : "text-white/30 hover:bg-white/5"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">{tab.label}</span>
                        <span className="text-[8px] opacity-40">{tab.count}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* 🛸 ASSET GRID */}
        <AnimatePresence mode="wait">
          {filteredListings.length > 0 ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <div className={cn(
                    "overflow-hidden rounded-[3rem] transition-all border shadow-2xl relative",
                    isLight
                      ? 'bg-white border-black/5 hover:shadow-orange-200/50'
                      : 'bg-white/[0.04] border-white/[0.08] backdrop-blur-3xl hover:border-white/20'
                  )}>
                    {/* Visual Asset Container */}
                    <div className={cn("relative aspect-[16/11] overflow-hidden m-4 rounded-[2.2rem] transition-transform duration-700 group-hover:scale-[1.02]", isLight ? 'bg-black/5' : 'bg-black')}>
                      {listing.images?.[0] ? (
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

                      {/* Top Action Layer */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                            <Badge className={cn("text-[9px] font-black uppercase tracking-widest border px-3 py-1", getCategoryColor(listing.category || 'property'))}>
                                {listing.category === 'worker' || listing.category === 'services' ? 'Crew' :
                                    listing.category === 'motorcycle' ? 'Moto' :
                                    listing.category === 'bicycle' ? 'Aqua' : 'Estate'}
                            </Badge>
                            {getStatusBadge(availabilityStatus[listing.id] || listing.status)}
                        </div>
                        
                        {(() => {
                            const likedListing = listingsWithLikes.find(l => l.id === listing.id);
                            if (likedListing && likedListing.likeCount > 0) {
                                return (
                                    <div className="bg-[#EB4898] text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl">
                                        <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                                        <span className="text-[10px] font-black italic">{likedListing.likeCount}</span>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                      </div>

                      {/* Cost Hud */}
                      <div className="absolute bottom-4 left-4">
                         <div className="px-5 py-2.5 rounded-[1.4rem] bg-black/80 backdrop-blur-xl border border-white/10 flex items-center gap-2">
                             <span className="text-white text-lg font-black italic tracking-tighter">
                                ${listing.price?.toLocaleString()}
                             </span>
                             {listing.mode === 'rent' && <span className="text-[9px] font-black uppercase text-white/50 border-l border-white/20 pl-2">/Mo</span>}
                         </div>
                      </div>
                    </div>

                    <div className="px-8 pb-8 space-y-5">
                      {/* Intelligence Layer */}
                      <div>
                        <h3 className={cn("text-xl font-black uppercase italic tracking-tighter leading-none line-clamp-1", isLight ? "text-black" : "text-white")}>
                            {listing.title}
                        </h3>
                        {(listing.address || listing.city) && (
                          <div className="flex items-center gap-2 mt-3 opacity-40">
                            <MapPin className={cn("w-3.5 h-3.5", getCategoryColor(listing.category || 'property').split(' ')[1])} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest truncate", isLight ? "text-black" : "text-white")}>
                                {listing.address || listing.city}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Detail Metrics */}
                      <div className={cn("p-4 rounded-2xl flex items-center gap-6", isLight ? "bg-black/5" : "bg-white/[0.04]")}>
                         {(!listing.category || listing.category === 'property') && (
                            <div className="flex gap-4">
                               <div className="flex flex-col">
                                  <span className={cn("text-[8px] font-black uppercase tracking-widest opacity-40", isLight ? "text-black" : "text-white")}>Beds</span>
                                  <span className={cn("text-sm font-black italic", isLight ? "text-black" : "text-white")}>{(listing as any).bedrooms || 0}</span>
                               </div>
                               <div className="w-[1px] h-6 bg-white/10" />
                               <div className="flex flex-col">
                                  <span className={cn("text-[8px] font-black uppercase tracking-widest opacity-40", isLight ? "text-black" : "text-white")}>Baths</span>
                                  <span className={cn("text-sm font-black italic", isLight ? "text-black" : "text-white")}>{(listing as any).bathrooms || 0}</span>
                               </div>
                            </div>
                         )}
                         {listing.category === 'motorcycle' && (
                             <div className="flex flex-col">
                                <span className={cn("text-[8px] font-black uppercase tracking-widest opacity-40", isLight ? "text-black" : "text-white")}>Model</span>
                                <span className={cn("text-[10px] font-black italic uppercase", isLight ? "text-black" : "text-white")}>{(listing as any).vehicle_brand} {(listing as any).vehicle_model}</span>
                             </div>
                         )}
                         {listing.category === 'bicycle' && (
                             <div className="flex flex-col">
                                <span className={cn("text-[8px] font-black uppercase tracking-widest opacity-40", isLight ? "text-black" : "text-white")}>Spec</span>
                                <span className={cn("text-[10px] font-black italic uppercase", isLight ? "text-black" : "text-white")}>{(listing as any).vehicle_brand} {(listing as any).electric_assist ? 'ELCTRC' : 'CLASSIC'}</span>
                             </div>
                         )}
                      </div>

                      {/* Status Selector */}
                      <div className="relative">
                        <select
                          value={availabilityStatus[listing.id] || listing.status || 'active'}
                          onChange={(e) => handleAvailabilityChange(listing, e.target.value)}
                          className={cn(
                            "w-full h-14 pl-12 pr-6 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border transition-all appearance-none cursor-pointer",
                            isLight ? 'bg-black/5 text-black border-black/5' : 'bg-white/[0.03] text-white border-white/[0.1] hover:bg-white/[0.06]'
                          )}
                        >
                          <option value="available">Available</option>
                          <option value="active">Active</option>
                          <option value="rented">Rented Out</option>
                          <option value="sold">Sold</option>
                          <option value="pending">Pending</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EB4898]" />
                      </div>

                      {/* Action Command Bar */}
                      <div className="grid grid-cols-4 gap-3 pt-2">
                        {[
                            { icon: Eye, onClick: () => handleViewProperty(listing), color: 'indigo' },
                            { icon: Share2, onClick: () => handleShareListing(listing), color: 'sky' },
                            { icon: Edit, onClick: () => handleEditProperty(listing), color: 'amber' },
                        ].map((btn, i) => (
                           <button
                            key={i}
                            onClick={btn.onClick}
                            className={cn(
                                "h-14 rounded-2xl flex items-center justify-center transition-all border group", 
                                isLight ? "bg-black/5 border-black/5 hover:bg-black/10" : "bg-white/[0.03] border-white/5 hover:bg-white/10"
                            )}
                           >
                              <btn.icon className={cn("w-5 h-5 transition-transform group-active:scale-90", isLight ? "text-black/30" : "text-white/40")} />
                           </button>
                        ))}
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <button className={cn("h-14 rounded-2xl flex items-center justify-center transition-all border group bg-red-500/10 border-red-500/20")}>
                                <Trash2 className="w-5 h-5 text-red-500 group-active:scale-90" />
                             </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className={cn("rounded-[2.5rem] border backdrop-blur-3xl", isLight ? 'bg-white border-black/5' : 'bg-[#101012] border-white/10')}>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-black italic tracking-tighter uppercase">Purge Asset?</AlertDialogTitle>
                              <AlertDialogDescription className="text-[11px] font-black uppercase tracking-widest opacity-50">This action will permanently remove this property from the platform.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Abort</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProperty(listing)} className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">Execute Purge</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex flex-col items-center justify-center py-32 rounded-[3.5rem] border",
                isLight ? "bg-black/5 border-black/5" : "bg-white/[0.02] border-white/[0.05]"
              )}
            >
              <div className="w-24 h-24 rounded-[2rem] bg-[#EB4898]/10 flex items-center justify-center mb-10 border border-[#EB4898]/20 text-[#EB4898]">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-center">No Assets Detected</h3>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 max-w-xs text-center leading-relaxed mb-12">The asset matrix is empty. Deploy your first property to begin synchronization.</p>
              <Button onClick={handleAddProperty} className="h-18 px-12 rounded-[2rem] bg-[#EB4898] text-white font-black uppercase italic tracking-widest shadow-2xl">Deploy Initial Asset</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ListingPreviewDialog isOpen={showPreview} onClose={handleClosePreview} property={viewingProperty} onEdit={handleEditFromPreview} showEditButton={true} />
      <CategorySelectionDialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog} onCategorySelect={handleCategorySelect} />
      <UnifiedListingForm isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingProperty(null); }} editingProperty={editingProperty as any ?? undefined} />
      <ShareDialog open={showShareDialog} onOpenChange={(open) => { setShowShareDialog(open); if (!open) setSharingListing(null); }} listingId={sharingListing?.id} title={sharingListing?.title || 'Listing'} description={`${sharingListing?.title}`} />
    </div>
  );
});

PropertyManagement.displayName = 'PropertyManagement';
