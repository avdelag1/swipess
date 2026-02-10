
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Bed, Bath, Square, Calendar, DollarSign, MessageCircle, TrendingUp, Clock, Shield, Star, CheckCircle, Home, Sparkles, Briefcase, Bike, Car, Zap, Fuel, Gauge, Users, Ruler, Settings, AlertCircle, ThumbsUp, Eye, Phone, Mail } from 'lucide-react';
import { Listing } from '@/hooks/useListings';
import { PropertyImageGallery } from './PropertyImageGallery';
import { useNavigate } from 'react-router-dom';
import { useStartConversation } from '@/hooks/useConversations';
import { toast } from '@/hooks/use-toast';
import { useState, useMemo, useCallback, memo } from 'react';
import { logger } from '@/utils/prodLogger';

/**
 * iOS-grade skeleton loader for dialog content
 * Shows content structure while data loads
 */
function PropertyInsightsSkeleton() {
  return (
    <div className="space-y-4 py-3 px-4">
      {/* Title and badge skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Description skeleton */}
      <div className="p-4 bg-muted/30 rounded-xl space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 bg-muted/20 rounded-lg">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Amenities skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>

      {/* Analytics skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 bg-muted/20 rounded-lg text-center">
            <Skeleton className="h-5 w-5 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-6 w-12 mx-auto" />
            <Skeleton className="h-3 w-16 mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Category icons and labels
const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  property: { icon: <Home className="w-4 h-4" />, label: 'Property', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  worker: { icon: <Briefcase className="w-4 h-4" />, label: 'Service', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  services: { icon: <Briefcase className="w-4 h-4" />, label: 'Service', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  motorcycle: { icon: <Car className="w-4 h-4" />, label: 'Motorcycle', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  bicycle: { icon: <Bike className="w-4 h-4" />, label: 'Bicycle', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

interface PropertyInsightsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
}

function PropertyInsightsDialogComponent({ open, onOpenChange, listing }: PropertyInsightsDialogProps) {
  const navigate = useNavigate();
  const startConversation = useStartConversation();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Calculate property insights based on listing data
  const propertyInsights = useMemo(() => {
    if (!listing) return null;

    const pricePerSqft = listing.square_footage && listing.price
      ? Math.round(listing.price / listing.square_footage)
      : null;

    const amenityCount = listing.amenities?.length || 0;
    const imageCount = listing.images?.length || 0;
    const equipmentCount = listing.equipment?.length || 0;

    // Calculate listing quality score (0-100)
    let qualityScore = 0;
    if (listing.description && listing.description.length > 100) qualityScore += 20;
    if (imageCount >= 5) qualityScore += 25;
    else if (imageCount >= 3) qualityScore += 15;
    else if (imageCount >= 1) qualityScore += 5;
    if (amenityCount >= 8) qualityScore += 20;
    else if (amenityCount >= 4) qualityScore += 10;
    if (listing.furnished) qualityScore += 10;
    if (listing.pet_friendly) qualityScore += 10;
    if (listing.square_footage) qualityScore += 5;
    if (listing.beds && listing.baths) qualityScore += 10;
    // Bonus for vehicles
    if (listing.year) qualityScore += 5;
    if (listing.condition === 'excellent') qualityScore += 10;
    if (equipmentCount >= 5) qualityScore += 10;

    // Value rating based on price per sqft (simplified)
    let valueRating: 'excellent' | 'good' | 'fair' | 'premium' = 'good';
    if (pricePerSqft) {
      if (pricePerSqft < 15) valueRating = 'excellent';
      else if (pricePerSqft < 25) valueRating = 'good';
      else if (pricePerSqft < 40) valueRating = 'fair';
      else valueRating = 'premium';
    }

    // Determine category
    const category = listing.category || 'property';
    const isWorker = category === 'worker' || category === 'services';
    const isMotorcycle = category === 'motorcycle';
    const isBicycle = category === 'bicycle';
    const isVehicle = isMotorcycle || isBicycle;
    const isProperty = !isVehicle && !isWorker;

    // Calculate demand level
    const demandLevel = qualityScore >= 80 ? 'high' : qualityScore >= 50 ? 'medium' : 'low';

    // Listing urgency (simulated based on status and quality)
    const isHotListing = qualityScore >= 75 && listing.status === 'available';

    return {
      pricePerSqft,
      qualityScore: Math.min(100, qualityScore),
      valueRating,
      amenityCount,
      imageCount,
      equipmentCount,
      responseRate: Math.min(95, 70 + amenityCount * 2 + equipmentCount),
      avgResponseTime: (amenityCount + equipmentCount) > 5 ? '< 1 hour' : '1-2 hours',
      category,
      isWorker,
      isMotorcycle,
      isBicycle,
      isProperty,
      isVehicle,
      demandLevel,
      isHotListing,
      listingAge: listing.created_at ? getDaysAgo(new Date(listing.created_at)) : null,
    };
  }, [listing]);

  // Helper function to get days ago
  function getDaysAgo(date: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  // Memoized callback to start conversation
  const handleMessage = useCallback(async () => {
    if (!listing?.owner_id) {
      toast({
        title: 'Error',
        description: 'Property owner information not available',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingConversation(true);
    try {
      toast({
        title: 'Starting conversation',
        description: 'Creating a new conversation...',
      });

      const result = await startConversation.mutateAsync({
        otherUserId: listing.owner_id,
        listingId: listing.id,
        initialMessage: `Hi! I'm interested in your property: ${listing.title}. Could you tell me more about it?`,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        navigate(`/messages?conversationId=${result.conversationId}`);
        onOpenChange(false); // Close dialog
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error starting conversation:', error);
      }
      toast({
        title: 'Could not start conversation',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [listing, startConversation, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-16px)] max-w-[400px] sm:max-w-lg max-h-[70vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-3 sm:px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-sm sm:text-base">Property Insights</DialogTitle>
        </DialogHeader>

        {/* Show skeleton while listing is loading */}
        {!listing ? (
          <ScrollArea className="flex-1 h-full overflow-x-hidden">
            <PropertyInsightsSkeleton />
          </ScrollArea>
        ) : (
        <ScrollArea className="flex-1 h-full overflow-x-hidden">
          <div className="space-y-3 sm:space-y-4 py-3 px-3 sm:px-4 pb-4 sm:pb-6 w-full max-w-full overflow-x-hidden">
            {/* Property Images Grid - FIRST - Most Important */}
            {listing.images && listing.images.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Property Photos ({listing.images.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {listing.images.slice(0, 6).map((image, idx) => (
                    <button
                      key={`image-top-${listing.id}-${idx}`}
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setGalleryOpen(true);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden hover:opacity-80 transition-opacity shadow-md group"
                    >
                      <img
                        src={image}
                        alt={`Property ${idx + 1}`}
                        className="w-full h-full object-cover"
                        loading={idx < 3 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={idx === 0 ? "high" : "auto"}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                          Main
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                        {idx + 1}
                      </div>
                    </button>
                  ))}
                </div>
                {listing.images.length > 6 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{listing.images.length - 6} more photos
                  </p>
                )}
                <p className="text-xs text-primary text-center">Tap any photo to view full size</p>
              </div>
            )}

            {/* Hot Listing Alert */}
            {propertyInsights?.isHotListing && (
              <div className="p-3 bg-gradient-to-r from-red-500/15 to-orange-500/10 rounded-xl border border-red-500/30 flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Hot Listing!</p>
                  <p className="text-xs text-muted-foreground">High demand - Act fast to secure this one</p>
                </div>
              </div>
            )}

            {/* Basic Info with Category Badge */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h3 className="text-base sm:text-xl font-bold flex-1 break-words">{listing.title}</h3>
                {propertyInsights && (
                  <div className="flex gap-2 shrink-0">
                    {CATEGORY_CONFIG[propertyInsights.category] && (
                      <Badge className={`${CATEGORY_CONFIG[propertyInsights.category].color} border`}>
                        {CATEGORY_CONFIG[propertyInsights.category].icon}
                        <span className="ml-1">{CATEGORY_CONFIG[propertyInsights.category].label}</span>
                      </Badge>
                    )}
                    {listing.listing_type && (
                      <Badge variant={listing.listing_type === 'buy' ? 'default' : 'secondary'}>
                        {listing.listing_type === 'buy' ? 'For Sale' : 'For Rent'}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{[listing.address, listing.neighborhood, listing.city].filter(Boolean).join(', ')}</span>
              </div>
              {propertyInsights?.listingAge !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Listed {propertyInsights.listingAge === 0 ? 'today' : propertyInsights.listingAge === 1 ? 'yesterday' : `${propertyInsights.listingAge} days ago`}
                </p>
              )}
            </div>

            {/* Description - FIRST - Most Important */}
            {(listing.description || listing.description_full) && (
              <div className="p-4 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/5 rounded-xl border border-red-500/20">
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <span className="text-lg">📝</span> About This {propertyInsights?.isVehicle ? 'Listing' : 'Property'}
                </h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {listing.description_full || listing.description}
                </p>
                {listing.description_short && listing.description_short !== listing.description && (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-primary/10">
                    <span className="font-medium">Quick summary:</span> {listing.description_short}
                  </p>
                )}
              </div>
            )}

            {/* Price & Key Details - Adaptive for category */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold">
                  ${listing.price?.toLocaleString()}
                  {listing.listing_type !== 'buy' && '/month'}
                </span>
              </div>
              {/* Property-specific */}
              {propertyInsights?.isProperty && (
                <>
                  {listing.beds && (
                    <div className="flex items-center gap-2">
                      <Bed className="w-4 h-4" />
                      <span>{listing.beds} bedroom{listing.beds !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {listing.baths && (
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4" />
                      <span>{listing.baths} bathroom{listing.baths !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {listing.square_footage && (
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4" />
                      <span>{listing.square_footage} sqft</span>
                    </div>
                  )}
                </>
              )}
              {/* Service-specific */}
              {propertyInsights?.isWorker && (
                <>
                  {listing.service_type && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span>{listing.service_type}</span>
                    </div>
                  )}
                  {listing.hourly_rate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>${listing.hourly_rate}/hour</span>
                    </div>
                  )}
                  {listing.experience_years && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{listing.experience_years} years experience</span>
                    </div>
                  )}
                </>
              )}
              {/* Motorcycle-specific */}
              {propertyInsights?.isMotorcycle && (
                <>
                  {listing.engine_cc && (
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      <span>{listing.engine_cc}cc engine</span>
                    </div>
                  )}
                  {listing.mileage && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{listing.mileage.toLocaleString()} miles</span>
                    </div>
                  )}
                  {listing.year && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{listing.year} model</span>
                    </div>
                  )}
                </>
              )}
              {/* Bicycle-specific */}
              {propertyInsights?.isBicycle && (
                <>
                  {listing.frame_size && (
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      <span>{listing.frame_size} frame</span>
                    </div>
                  )}
                  {listing.electric_assist && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>Electric Assist</span>
                    </div>
                  )}
                  {listing.battery_range && (
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4" />
                      <span>{listing.battery_range}km range</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vehicle Specifications - Only for vehicles */}
            {propertyInsights?.isVehicle && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Specifications
                </h4>
                <div className="bg-muted/30 p-3 sm:p-4 rounded-lg grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  {listing.brand && (
                    <div><span className="text-muted-foreground">Brand:</span> <span className="font-medium">{listing.brand}</span></div>
                  )}
                  {listing.model && (
                    <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{listing.model}</span></div>
                  )}
                  {listing.year && (
                    <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">{listing.year}</span></div>
                  )}
                  {listing.condition && (
                    <div><span className="text-muted-foreground">Condition:</span> <span className="font-medium capitalize">{listing.condition}</span></div>
                  )}
                  {listing.color && (
                    <div><span className="text-muted-foreground">Color:</span> <span className="font-medium capitalize">{listing.color}</span></div>
                  )}
                  {listing.transmission && (
                    <div><span className="text-muted-foreground">Transmission:</span> <span className="font-medium capitalize">{listing.transmission}</span></div>
                  )}
                  {listing.fuel_type && (
                    <div><span className="text-muted-foreground">Fuel:</span> <span className="font-medium capitalize">{listing.fuel_type}</span></div>
                  )}
                  {listing.hull_material && (
                    <div><span className="text-muted-foreground">Hull:</span> <span className="font-medium capitalize">{listing.hull_material}</span></div>
                  )}
                  {listing.engines && (
                    <div className="col-span-2"><span className="text-muted-foreground">Engines:</span> <span className="font-medium">{listing.engines}</span></div>
                  )}
                  {listing.frame_material && (
                    <div><span className="text-muted-foreground">Frame:</span> <span className="font-medium capitalize">{listing.frame_material}</span></div>
                  )}
                  {listing.gear_type && (
                    <div><span className="text-muted-foreground">Gears:</span> <span className="font-medium capitalize">{listing.gear_type}</span></div>
                  )}
                  {listing.brake_type && (
                    <div><span className="text-muted-foreground">Brakes:</span> <span className="font-medium capitalize">{listing.brake_type}</span></div>
                  )}
                  {listing.license_required && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">License Required:</span>{' '}
                      <span className="font-medium">{listing.license_required}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Equipment (for vehicles/services) */}
            {listing.equipment && listing.equipment.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Equipment Included</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.equipment.map((item) => (
                    <Badge key={`equip-${item}`} variant="outline" className="bg-purple-500/5 border-purple-500/20">
                      <CheckCircle className="w-3 h-3 mr-1 text-purple-500" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Property Type & Features */}
            <div>
              <h4 className="font-semibold mb-2">{propertyInsights?.isVehicle ? 'Features' : 'Property Features'}</h4>
              <div className="flex flex-wrap gap-2">
                {listing.property_type && <Badge variant="secondary">{listing.property_type}</Badge>}
                {listing.vehicle_type && <Badge variant="secondary">{listing.vehicle_type}</Badge>}
                {listing.furnished && <Badge variant="secondary">Furnished</Badge>}
                {listing.pet_friendly && <Badge variant="secondary">Pet Friendly</Badge>}
                {listing.electric_assist && <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Electric</Badge>}
                <Badge variant="outline" className={listing.status === 'available' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>{listing.status}</Badge>
              </div>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((amenity) => (
                    <Badge key={`amenity-${amenity}`} variant="outline">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Service Rates (for workers/services) */}
            {listing.rental_rates && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  Service Rates
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {listing.rental_rates.hourly && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">${listing.rental_rates.hourly}</div>
                      <div className="text-xs text-muted-foreground">per hour</div>
                    </div>
                  )}
                  {listing.rental_rates.daily && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">${listing.rental_rates.daily}</div>
                      <div className="text-xs text-muted-foreground">per day</div>
                    </div>
                  )}
                  {listing.rental_rates.weekly && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">${listing.rental_rates.weekly}</div>
                      <div className="text-xs text-muted-foreground">per week</div>
                    </div>
                  )}
                  {listing.rental_rates.monthly && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">${listing.rental_rates.monthly}</div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listing Analytics */}
            <div>
              <h4 className="font-semibold mb-2">{propertyInsights?.isVehicle ? 'Listing' : 'Property'} Analytics</h4>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm">📊 {listing.listing_type === 'buy' ? 'Price' : 'Current rent'}: ${listing.price?.toLocaleString()}{listing.listing_type !== 'buy' && '/month'}</p>
                {propertyInsights?.isProperty && (
                  <p className="text-sm">📏 Space: {listing.square_footage ? `${listing.square_footage} sqft` : 'Size not specified'}</p>
                )}
                <p className="text-sm">🏠 Type: {listing.property_type || listing.vehicle_type || 'Not specified'} {listing.neighborhood && `in ${listing.neighborhood}`}</p>
                <p className="text-sm">✨ Features: {(listing.amenities?.length || 0) + (listing.equipment?.length || 0)} items listed</p>
                {listing.furnished && <p className="text-sm">🪑 Furnished {propertyInsights?.isVehicle ? 'option' : 'property'} available</p>}
                {listing.pet_friendly && <p className="text-sm">🐕 Pet-friendly accommodation</p>}
                {propertyInsights?.demandLevel && (
                  <p className="text-sm">
                    📈 Demand: <span className={`font-medium ${
                      propertyInsights.demandLevel === 'high' ? 'text-red-500' :
                      propertyInsights.demandLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {propertyInsights.demandLevel === 'high' ? 'High demand' :
                       propertyInsights.demandLevel === 'medium' ? 'Moderate demand' : 'Low competition'}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Provider/Owner Quick Stats */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                About the {propertyInsights?.isVehicle ? 'Provider' : 'Owner'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Response Rate</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{propertyInsights?.responseRate || 85}%</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Avg Response</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{propertyInsights?.avgResponseTime || '1-2 hrs'}</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500/10 to-orange-500/5 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <ThumbsUp className="w-4 h-4 text-red-600" />
                    <span className="text-xs text-muted-foreground">Verified</span>
                  </div>
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">Yes</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-500/10 to-amber-500/5 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-muted-foreground">Listing Quality</span>
                  </div>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{propertyInsights?.qualityScore || 75}%</div>
                </div>
              </div>
            </div>

            {/* Enhanced Market Insights */}
            {propertyInsights && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Market Insights
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {propertyInsights.pricePerSqft && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-3 rounded-lg text-center border border-green-500/20">
                      <DollarSign className="w-5 h-5 mx-auto text-green-600 dark:text-green-400 mb-1" />
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">${propertyInsights.pricePerSqft}</div>
                      <div className="text-xs text-muted-foreground">per sqft</div>
                    </div>
                  )}
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/5 p-3 rounded-lg text-center border border-red-500/20">
                    <Star className="w-5 h-5 mx-auto text-red-600 dark:text-red-400 mb-1" />
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{propertyInsights.qualityScore}%</div>
                    <div className="text-xs text-muted-foreground">Quality Score</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-3 rounded-lg text-center border border-blue-500/20">
                    <Clock className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{propertyInsights.avgResponseTime}</div>
                    <div className="text-xs text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 p-3 rounded-lg text-center border border-yellow-500/20">
                    <MessageCircle className="w-5 h-5 mx-auto text-yellow-600 dark:text-yellow-400 mb-1" />
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{propertyInsights.responseRate}%</div>
                    <div className="text-xs text-muted-foreground">Response Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Value Assessment */}
            {propertyInsights && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Value Assessment
                </h4>
                <div className={`p-4 rounded-lg border ${
                  propertyInsights.valueRating === 'excellent' ? 'bg-green-500/10 border-green-500/30' :
                  propertyInsights.valueRating === 'good' ? 'bg-blue-500/10 border-blue-500/30' :
                  propertyInsights.valueRating === 'fair' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${
                      propertyInsights.valueRating === 'excellent' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                      propertyInsights.valueRating === 'good' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                      propertyInsights.valueRating === 'fair' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                      'bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {propertyInsights.valueRating === 'excellent' ? '🌟 Excellent Value' :
                       propertyInsights.valueRating === 'good' ? '👍 Good Value' :
                       propertyInsights.valueRating === 'fair' ? '💰 Fair Price' :
                       '✨ Premium Property'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {propertyInsights.valueRating === 'excellent'
                      ? 'This property offers exceptional value for the area. Great opportunity!'
                      : propertyInsights.valueRating === 'good'
                      ? 'Competitively priced with good features for the neighborhood.'
                      : propertyInsights.valueRating === 'fair'
                      ? 'Priced appropriately for the features and location offered.'
                      : 'Premium property with high-end features and prime location.'}
                  </p>
                </div>
              </div>
            )}

            {/* Property Highlights */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Property Highlights
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {listing.furnished && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Home className="w-4 h-4 text-primary" />
                    <span className="text-sm">Fully Furnished</span>
                  </div>
                )}
                {listing.pet_friendly && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <span className="text-base">🐾</span>
                    <span className="text-sm">Pet Friendly</span>
                  </div>
                )}
                {listing.beds && listing.beds >= 2 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Bed className="w-4 h-4 text-primary" />
                    <span className="text-sm">Spacious Layout</span>
                  </div>
                )}
                {(listing.amenities?.length || 0) >= 5 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm">Well-Equipped</span>
                  </div>
                )}
                {listing.square_footage && listing.square_footage >= 800 && (
                  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Square className="w-4 h-4 text-primary" />
                    <span className="text-sm">Generous Space</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Verified Listing</span>
                </div>
              </div>
            </div>

            {/* Availability Status */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                Availability
              </h4>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    listing.status === 'available' ? 'bg-green-500 animate-pulse' :
                    listing.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">
                      {listing.status === 'available' ? 'Currently Available' :
                       listing.status === 'pending' ? 'Application Pending' :
                       listing.status === 'rented' ? 'Currently Rented' : listing.status || 'Available'}
                    </p>
                    <p className="text-xs text-muted-foreground">Ready for immediate move-in</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Neighborhood Info */}
            {listing.neighborhood && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Neighborhood: {listing.neighborhood}
                </h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Located in the {listing.neighborhood} area of {listing.city || 'the city'}.
                    {listing.tulum_location && ` Specifically in ${listing.tulum_location}.`}
                  </p>
                  {listing.lifestyle_compatible && listing.lifestyle_compatible.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Compatible lifestyles:</p>
                      <div className="flex flex-wrap gap-1">
                        {listing.lifestyle_compatible.slice(0, 5).map((lifestyle) => (
                          <Badge key={`lifestyle-${lifestyle}`} variant="outline" className="text-xs">{lifestyle}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        )}

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            onClick={handleMessage}
            disabled={isCreatingConversation || !listing}
            className="w-full"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isCreatingConversation ? 'Starting conversation...' : 'Contact Owner'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Full Screen Image Gallery */}
      {listing?.images && listing.images.length > 0 && (
        <PropertyImageGallery
          images={listing.images}
          alt={listing.title}
          isOpen={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          initialIndex={selectedImageIndex}
        />
      )}
    </Dialog>
  );
}

// Memoize component to prevent unnecessary re-renders
export const PropertyInsightsDialog = memo(PropertyInsightsDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.listing?.id === nextProps.listing?.id &&
    prevProps.open === nextProps.open
  );
});
