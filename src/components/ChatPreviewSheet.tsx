import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User, MapPin, DollarSign, Home, Bike, Ship, Car,
  ExternalLink, MessageCircle, Star, Heart, TrendingUp, X
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
        className="h-[88vh] rounded-t-[28px] p-0 flex flex-col overflow-hidden border-0 [&>button]:hidden"
        style={{
          background: 'linear-gradient(180deg, #1A1A1E 0%, #141416 100%)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle + header - sticky, never scrolls */}
        <div
          className="shrink-0 flex flex-col"
          style={{
            background: 'linear-gradient(180deg, #222226 0%, #1A1A1E 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-[5px] bg-white/20 rounded-full" />
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className={`p-[1.5px] rounded-full ${
                otherUser.role === 'owner'
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                <Avatar className="w-8 h-8 border border-[#1A1A1E]">
                  <AvatarImage src={otherUser.avatar_url} />
                  <AvatarFallback className={`text-xs font-bold text-white ${
                    otherUser.role === 'owner'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {otherUser.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="text-white font-semibold text-[15px] leading-tight">{otherUser.full_name}</p>
                <p className="text-white/40 text-[11px]">Chat Details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors active:scale-90"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-4 pb-8">
            {/* User Profile Section */}
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Avatar className={`w-16 h-16 ring-2 ring-offset-2 ring-offset-[#1A1A1E] ${
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
                      <span className="w-1.5 h-1.5 bg-[#34C759] rounded-full" />
                      Online
                    </span>
                  </div>
                </div>
              </div>

              {/* Rating Insights */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#FFD60A] fill-[#FFD60A]" />
                    <span className="text-sm font-semibold text-white">4.8</span>
                    <span className="text-[10px] text-white/40">(24)</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                    <Heart className="w-3 h-3 text-[#FF453A]" />
                    <span>98% Response</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-[11px] text-[#34C759]">
                    <TrendingUp className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              {/* Match Context */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Heart className="w-3 h-3 text-[#FF453A]" />
                  <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">How You Connected</span>
                </div>
                <p className="text-xs text-white/70">
                  {otherUser.role === 'owner'
                    ? `You liked their listing${listing ? ` "${listing.title.substring(0, 30)}..."` : ''} and they liked your profile back`
                    : 'They liked your profile and you matched'
                  }
                </p>
              </div>

              <Button
                onClick={handleViewFullProfile}
                className="w-full rounded-xl border-0 font-semibold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
              >
                <User className="w-4 h-4 mr-2" />
                View Full Profile
                <ExternalLink className="w-3 h-3 ml-2 opacity-60" />
              </Button>
            </div>

            {/* Listing Section */}
            {listing && isClient && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      listing.category === 'property'
                        ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]'
                        : 'bg-[#007AFF]/20 text-[#007AFF]'
                    }`}>
                      {getCategoryIcon(listing.category)}
                    </div>
                    <span className="text-sm font-medium text-white/50">
                      {getCategoryLabel(listing.category)} Listing
                    </span>
                  </div>
                </div>

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
                    <div className="flex items-center gap-2 text-white/50">
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
                      <span className="text-sm text-white/40">
                        {listing.mode === 'rent' ? '/month' : listing.mode === 'sale' ? 'total' : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Badge
                      className="border-0 text-white/70"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      {listing.mode === 'rent' ? 'For Rent' :
                       listing.mode === 'sale' ? 'For Sale' :
                       listing.mode === 'both' ? 'Sale & Rent' : 'Available'}
                    </Badge>
                  </div>

                  <Button
                    onClick={handleViewFullListing}
                    className="w-full mt-3 rounded-xl border-0 text-white font-semibold transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    View Full Listing
                    <ExternalLink className="w-3 h-3 ml-2 opacity-80" />
                  </Button>
                </div>
              </div>
            )}

            {/* Owner view: potential client info */}
            {isOwner && !listing && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,122,255,0.15)' }}
                  >
                    <MessageCircle className="w-5 h-5 text-[#007AFF]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Potential Client</h4>
                    <p className="text-xs text-white/40">View their full profile to see preferences</p>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
                  This client is interested in connecting with you. View their full profile to see their
                  budget, preferences, and what they're looking for.
                </p>
              </div>
            )}

            {/* Client view: no listing */}
            {isClient && !listing && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.15)' }}
                  >
                    <Home className="w-5 h-5 text-[#8B5CF6]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Direct Conversation</h4>
                    <p className="text-xs text-white/40">No specific listing attached</p>
                  </div>
                </div>
                <p className="text-sm text-white/50 leading-relaxed">
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
