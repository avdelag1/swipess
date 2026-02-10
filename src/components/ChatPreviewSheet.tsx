import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User, MapPin, DollarSign, Home, Bike, Ship, Car,
  ExternalLink, MessageCircle, Bed, Bath, Square, Star, Heart, TrendingUp
} from 'lucide-react';
import { ImageCarousel } from '@/components/ImageCarousel';

interface OtherUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  role: string;
}

interface Listing {
  id: string;
  title: string;
  price?: number;
  images?: string[];
  category?: string;
  mode?: string;
  address?: string;
  city?: string;
}

interface ChatPreviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: OtherUser;
  listing?: Listing;
  currentUserRole: 'client' | 'owner' | 'admin';
}

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'yacht': return <Ship className="w-5 h-5" />;
    case 'motorcycle': return <Car className="w-5 h-5" />;
    case 'bicycle': return <Bike className="w-5 h-5" />;
    case 'vehicle': return <Car className="w-5 h-5" />;
    default: return <Home className="w-5 h-5" />;
  }
};

const getCategoryLabel = (category?: string) => {
  switch (category) {
    case 'yacht': return 'Yacht';
    case 'motorcycle': return 'Motorcycle';
    case 'bicycle': return 'Bicycle';
    case 'vehicle': return 'Vehicle';
    default: return 'Property';
  }
};

export function ChatPreviewSheet({
  isOpen,
  onClose,
  otherUser,
  listing,
  currentUserRole
}: ChatPreviewSheetProps) {
  const navigate = useNavigate();
  const isOwner = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isClient = currentUserRole === 'client';

  const handleViewFullProfile = () => {
    onClose();
    if (otherUser.role === 'client') {
      navigate(`/owner/view-client/${otherUser.id}`);
    } else {
      navigate(`/profile/${otherUser.id}`);
    }
  };

  const handleViewFullListing = () => {
    if (listing) {
      onClose();
      navigate(`/listing/${listing.id}`);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-[20px] bg-[#1C1C1E] border-t border-[#38383A] p-0"
      >
        <div className="w-12 h-1 bg-[#48484A] rounded-full mx-auto mt-3 mb-2" />

        <SheetHeader className="px-4 pb-3 border-b border-[#38383A]">
          <SheetTitle className="text-white text-lg font-semibold text-center">
            Chat Details
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(85vh-80px)]">
          <div className="p-4 space-y-6">
            {/* User Profile Section */}
            <div className="bg-[#2C2C2E] rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className={`w-16 h-16 ring-2 ring-offset-2 ring-offset-[#2C2C2E] ${
                  otherUser.role === 'owner' ? 'ring-[#8B5CF6]' : 'ring-[#007AFF]'
                }`}>
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback className={`text-xl font-semibold text-white ${
                    otherUser.role === 'owner'
                      ? 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]'
                      : 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]'
                  }`}>
                    {otherUser.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {otherUser.full_name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs border-0 ${
                      otherUser.role === 'owner'
                        ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                        : 'bg-[#007AFF]/20 text-[#007AFF]'
                    }`}>
                      {otherUser.role === 'client' ? 'Explorer' : 'Provider'}
                    </Badge>
                    <span className="text-[10px] text-[#34C759] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#34C759] rounded-full"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Insights - Compact */}
              <div className="bg-[#1C1C1E] rounded-xl p-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#FFD60A] fill-[#FFD60A]" />
                    <span className="text-sm font-semibold text-white">4.8</span>
                    <span className="text-[10px] text-[#8E8E93]">(24)</span>
                  </div>
                  <div className="h-4 w-px bg-[#38383A]" />
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93]">
                    <Heart className="w-3 h-3 text-[#FF453A]" />
                    <span>98% Response</span>
                  </div>
                  <div className="h-4 w-px bg-[#38383A]" />
                  <div className="flex items-center gap-1.5 text-[11px] text-[#34C759]">
                    <TrendingUp className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* Match Context - How you connected */}
              <div className="bg-[#1C1C1E] rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Heart className="w-3 h-3 text-[#FF453A]" />
                  <span className="text-[10px] font-medium text-[#8E8E93]">HOW YOU CONNECTED</span>
                </div>
                <p className="text-xs text-white">
                  {otherUser.role === 'owner'
                    ? `You liked their listing${listing ? ` "${listing.title.substring(0, 30)}..."` : ''} and they liked your profile back`
                    : 'They liked your profile and you matched'
                  }
                </p>
              </div>

              <Button
                onClick={handleViewFullProfile}
                className="w-full bg-[#3A3A3C] hover:bg-[#48484A] text-white border-0 rounded-xl"
              >
                <User className="w-4 h-4 mr-2" />
                View Full Profile
                <ExternalLink className="w-3 h-3 ml-2 opacity-60" />
              </Button>
            </div>

            {/* Listing Section - Only show for clients viewing owner's listing */}
            {listing && isClient && (
              <div className="bg-[#2C2C2E] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#38383A]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      listing.category === 'property'
                        ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                        : 'bg-[#007AFF]/20 text-[#007AFF]'
                    }`}>
                      {getCategoryIcon(listing.category)}
                    </div>
                    <span className="text-sm font-medium text-[#8E8E93]">
                      {getCategoryLabel(listing.category)} Listing
                    </span>
                  </div>
                </div>

                {/* Listing Images */}
                {listing.images && listing.images.length > 0 && (
                  <div className="h-48 w-full">
                    <ImageCarousel
                      images={listing.images}
                      alt={listing.title || 'Listing'}
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-white">
                    {listing.title || 'Untitled Listing'}
                  </h3>

                  {(listing.address || listing.city) && (
                    <div className="flex items-center gap-2 text-[#8E8E93]">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="text-sm">
                        {listing.address ? `${listing.address}, ` : ''}{listing.city || ''}
                      </span>
                    </div>
                  )}

                  {listing.price && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xl font-bold text-[#34C759]">
                        <DollarSign className="w-5 h-5" />
                        {listing.price.toLocaleString()}
                      </div>
                      <span className="text-sm text-[#8E8E93]">
                        {listing.mode === 'rent' ? '/month' : listing.mode === 'sale' ? 'total' : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Badge className="bg-[#3A3A3C] text-white border-0">
                      {listing.mode === 'rent' ? 'For Rent' :
                       listing.mode === 'sale' ? 'For Sale' :
                       listing.mode === 'both' ? 'Sale & Rent' : 'Available'}
                    </Badge>
                  </div>

                  <Button
                    onClick={handleViewFullListing}
                    className="w-full mt-4 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white border-0 rounded-xl"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    View Full Listing
                    <ExternalLink className="w-3 h-3 ml-2 opacity-80" />
                  </Button>
                </div>
              </div>
            )}

            {/* Show message for owners about the client they're chatting with */}
            {isOwner && !listing && (
              <div className="bg-[#2C2C2E] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#007AFF]/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Potential Client</h4>
                    <p className="text-xs text-[#8E8E93]">View their full profile to see preferences</p>
                  </div>
                </div>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  This client is interested in connecting with you. View their full profile to see their
                  budget, preferences, and what they're looking for.
                </p>
              </div>
            )}

            {/* No listing available message for clients */}
            {isClient && !listing && (
              <div className="bg-[#2C2C2E] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
                    <Home className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">Direct Conversation</h4>
                    <p className="text-xs text-[#8E8E93]">No specific listing attached</p>
                  </div>
                </div>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  This conversation isn't linked to a specific listing. Ask the owner about their
                  available properties or browse their profile for more information.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
