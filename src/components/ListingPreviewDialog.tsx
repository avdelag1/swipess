import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Bed, Bath, Square, DollarSign, Home, Users, Car, Anchor, Bike, Bike as Motorcycle, Eye, Flame, MessageSquare, X } from 'lucide-react';
import { ImageCarousel } from '@/components/ImageCarousel';
import { cn } from '@/lib/utils';

interface ListingPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any; // Keep name for backward compatibility
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function ListingPreviewDialog({
  isOpen,
  onClose,
  property: listing,
  onEdit,
  showEditButton = false
}: ListingPreviewDialogProps) {
  if (!listing) return null;

  const category = listing.category || 'property';
  const mode = listing.mode || 'rent';

  const getCategoryEmoji = () => {
    switch (category) {
      case 'yacht': return '⛵';
      case 'motorcycle': return '🏍️';
      case 'bicycle': return '🚴';
      case 'vehicle': return '🚗';
      default: return '🏠';
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'yacht': return 'Yacht';
      case 'motorcycle': return 'Motorcycle';
      case 'bicycle': return 'Bicycle';
      case 'vehicle': return 'Vehicle';
      default: return 'Property';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {getCategoryEmoji()} {getCategoryLabel()} Preview
              </DialogTitle>
              <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                {mode === 'both' ? 'Sale & Rent' :
                 mode === 'sale' ? 'For Sale' :
                 'For Rent'}
              </Badge>
            </div>
            {showEditButton && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm" className="shrink-0 text-xs sm:text-sm h-8 sm:h-9">
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pb-6 sm:pb-8">
            {/* Image Gallery */}
            {listing.images && listing.images.length > 0 ? (
              <div className="relative h-48 sm:h-64 lg:h-80 rounded-lg overflow-hidden">
                <ImageCarousel
                  images={listing.images}
                  alt={listing.title || 'Listing'}
                />
              </div>
            ) : (
              <div className="relative h-48 sm:h-64 lg:h-80 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-4xl sm:text-5xl lg:text-6xl text-muted-foreground">
                    {getCategoryEmoji()}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">No images uploaded</p>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2 break-words">
                    {listing.title || 'Untitled Listing'}
                  </h2>
                  {category === 'property' && (
                    <>
                      {listing.address && (
                        <div className="flex items-start gap-2 text-muted-foreground mb-1 sm:mb-2">
                          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                          <span className="text-sm sm:text-base lg:text-lg break-words">{listing.address}</span>
                        </div>
                      )}
                      {(listing.neighborhood || listing.city) && (
                        <div className="text-xs sm:text-sm text-muted-foreground ml-6 sm:ml-7">
                          {listing.neighborhood && `${listing.neighborhood}, `}{listing.city}
                        </div>
                      )}
                    </>
                  )}
                  {(category === 'yacht' || category === 'motorcycle' || category === 'bicycle' || category === 'vehicle') && (
                    <div className="text-sm sm:text-base lg:text-lg text-muted-foreground">
                      {listing.brand || listing.vehicle_brand} {listing.model || listing.vehicle_model}
                      {(listing.year || listing.vehicle_year) && ` • ${listing.year || listing.vehicle_year}`}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 sm:text-right shrink-0">
                  <div className="flex items-center gap-1 sm:gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
                    <span className="truncate max-w-[150px] sm:max-w-none">
                      {listing.price?.toLocaleString() || 'TBD'}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {mode === 'rent' ? '/month' :
                     mode === 'sale' ? 'total' :
                     'sale/rent'}
                  </div>
                </div>
              </div>

              {/* Category-Specific Stats */}
              {category === 'property' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                  {listing.beds && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Bed className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.beds}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          Bed{listing.beds !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {listing.baths && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Bath className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.baths}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          Bath{listing.baths !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {listing.square_footage && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Square className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.square_footage}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Sq ft</div>
                      </div>
                    </div>
                  )}

                  {listing.parking_spaces !== undefined && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.parking_spaces}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Parking</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'yacht' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {listing.length_m && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Anchor className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.length_m}m</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Length</div>
                      </div>
                    </div>
                  )}
                  {listing.berths && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Bed className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.berths}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Berths</div>
                      </div>
                    </div>
                  )}
                  {listing.max_passengers && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.max_passengers}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Passengers</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'motorcycle' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {listing.engine_cc && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Motorcycle className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.engine_cc}cc</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Engine</div>
                      </div>
                    </div>
                  )}
                  {listing.mileage && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.mileage?.toLocaleString()}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Mileage</div>
                      </div>
                    </div>
                  )}
                  {(listing.condition || listing.vehicle_condition) && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate capitalize">{listing.condition || listing.vehicle_condition}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Condition</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'bicycle' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {listing.frame_size && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.frame_size}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Frame</div>
                      </div>
                    </div>
                  )}
                  {listing.electric_assist && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="text-xl sm:text-2xl">⚡</div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">Electric</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {listing.battery_range ? `${listing.battery_range}km` : 'Assist'}
                        </div>
                      </div>
                    </div>
                  )}
                  {(listing.condition || listing.vehicle_condition) && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate capitalize">{listing.condition || listing.vehicle_condition}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Condition</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'vehicle' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                  {listing.mileage && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate">{listing.mileage?.toLocaleString()}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Miles</div>
                      </div>
                    </div>
                  )}
                  {listing.transmission_type && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate capitalize">{listing.transmission_type}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Trans</div>
                      </div>
                    </div>
                  )}
                  {listing.vehicle_condition && (
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base truncate capitalize">{listing.vehicle_condition}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Condition</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features/Amenities */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold">
                {category === 'property' ? 'Property Features' : 'Features'}
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                  {category === 'yacht' ? 'Yacht' :
                   category === 'motorcycle' ? 'Motorcycle' :
                   category === 'bicycle' ? 'Bicycle' :
                   category === 'vehicle' ? 'Vehicle' :
                   listing.property_type || 'Property'}
                </Badge>

                {listing.furnished && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                    Furnished
                  </Badge>
                )}

                {listing.pet_friendly && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1">
                    Pet Friendly
                  </Badge>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold">Additional Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="text-[10px] sm:text-xs">
                      {listing.status || 'Draft'}
                    </Badge>
                  </div>

                  {listing.availability_date && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Available:</span>
                      <span className="truncate">{new Date(listing.availability_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 bg-muted/20 rounded-lg">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-muted-foreground" />
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{listing.views || listing.view_count || 0}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Views</div>
              </div>
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 bg-muted/20 rounded-lg">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-muted-foreground" />
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{listing.likes || listing.like_count || 0}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Flames</div>
              </div>
              <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 bg-muted/20 rounded-lg">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-muted-foreground" />
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-primary">{listing.contacts || 0}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Contacts</div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Export with old name for backward compatibility
export { ListingPreviewDialog as PropertyPreviewDialog };
