import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Bed, Bath, Square, Calendar, DollarSign, Home, Users, Car } from 'lucide-react';
import { ImageCarousel } from '@/components/ImageCarousel';

interface PropertyPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export function PropertyPreviewDialog({ 
  isOpen, 
  onClose, 
  property, 
  onEdit, 
  showEditButton = false 
}: PropertyPreviewDialogProps) {
  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Property Preview</DialogTitle>
            {showEditButton && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                Edit Property
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-6">
          {/* Image Gallery */}
          {property.images && property.images.length > 0 ? (
            <div className="relative h-80 rounded-lg overflow-hidden">
              <ImageCarousel 
                images={property.images} 
                alt={property.title || 'Property'} 
              />
            </div>
          ) : (
            <div className="relative h-80 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="text-6xl text-muted-foreground">🏠</div>
                <p className="text-muted-foreground">No images uploaded</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {property.title || 'Untitled Property'}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-lg">{property.address}</span>
                </div>
                <div className="text-muted-foreground">
                  {property.neighborhood && `${property.neighborhood}, `}{property.city}
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                  <DollarSign className="w-8 h-8" />
                  {property.price?.toLocaleString() || 'Price TBD'}
                </div>
                <div className="text-muted-foreground">
                  {property.listing_type === 'rent' ? 'per month' : 'total price'}
                </div>
              </div>
            </div>

            {/* Property Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {property.beds && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Bed className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">{property.beds}</div>
                    <div className="text-sm text-muted-foreground">
                      Bedroom{property.beds !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
              
              {property.baths && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Bath className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">{property.baths}</div>
                    <div className="text-sm text-muted-foreground">
                      Bathroom{property.baths !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
              
              {property.square_footage && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Square className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">{property.square_footage}</div>
                    <div className="text-sm text-muted-foreground">Sq ft</div>
                  </div>
                </div>
              )}
              
              {property.parking_spaces !== undefined && (
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Car className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">{property.parking_spaces}</div>
                    <div className="text-sm text-muted-foreground">Parking</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Property Tags */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Property Features</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Home className="w-4 h-4 mr-1" />
                {property.property_type || 'Property'}
              </Badge>
              
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
              </Badge>
              
              {property.furnished && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Furnished
                </Badge>
              )}
              
              {property.pet_friendly && (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Pet Friendly
                </Badge>
              )}
            </div>
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string) => (
                  <Badge key={`amenity-${amenity}`} variant="outline" className="text-sm px-3 py-1">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {property.description}
              </p>
            </div>
          )}

          {/* Additional Details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={property.status === 'active' ? 'default' : 'secondary'}>
                    {property.status || 'Draft'}
                  </Badge>
                </div>
                
                {property.availability_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span>{new Date(property.availability_date).toLocaleDateString()}</span>
                  </div>
                )}
                
                {property.max_occupants && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Occupants:</span>
                    <span>{property.max_occupants}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {property.deposit_amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit:</span>
                    <span>${property.deposit_amount.toLocaleString()}</span>
                  </div>
                )}
                
                {property.min_rental_term_months && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Term:</span>
                    <span>{property.min_rental_term_months} months</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Property Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{property.views || 0}</div>
              <div className="text-sm text-muted-foreground">Views</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{property.likes || 0}</div>
              <div className="text-sm text-muted-foreground">Likes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{property.contacts || 0}</div>
              <div className="text-sm text-muted-foreground">Contacts</div>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}