import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageCarousel } from '@/components/ImageCarousel';
import { DirectMessageDialog } from '@/components/DirectMessageDialog';
import {
  Home, MapPin, Bed, Bath, Square, DollarSign, Lock, LogIn, UserPlus,
  Sparkles, Anchor, Bike, Car, CircleDot, Eye, Flame, MessageSquare,
  Calendar, CheckCircle, Users, MessageCircle, Send, ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { STORAGE } from '@/constants/app';

// Categories that support free direct messaging
const FREE_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle'];

export default function PublicListingPreview() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDirectMessageDialog, setShowDirectMessageDialog] = useState(false);

  // Capture referral code from URL if present
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && refCode.length > 0) {
      // Don't capture if it's the current user's own referral
      if (user?.id && user.id === refCode) return;

      // Store referral code with timestamp
      const referralData = {
        code: refCode,
        capturedAt: Date.now(),
        source: `/listing/${id}`,
      };
      localStorage.setItem(STORAGE.REFERRAL_CODE_KEY, JSON.stringify(referralData));
    }
  }, [searchParams, id, user?.id]);

  // Fetch listing data
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['public-listing', id],
    queryFn: async () => {
      if (!id) throw new Error('No listing ID provided');

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Increment view count - use 'views' column which exists
  useQuery({
    queryKey: ['listing-view', id],
    queryFn: async () => {
      if (!id) return null;
      try {
        await (supabase as any)
          .from('listings')
          .update({ views: ((listing as any)?.views || 0) + 1 })
          .eq('id', id);
      } catch (e) {
        // Silently fail - view count is not critical
      }
      return true;
    },
    enabled: !!id && !!listing,
    staleTime: Infinity, // Only run once per session
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'yacht': return <Anchor className="w-4 h-4" />;
      case 'motorcycle': return <CircleDot className="w-4 h-4" />;
      case 'bicycle': return <Bike className="w-4 h-4" />;
      case 'vehicle': return <Car className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'yacht': return 'Yacht';
      case 'motorcycle': return 'Motorcycle';
      case 'bicycle': return 'Bicycle';
      case 'vehicle': return 'Vehicle';
      default: return 'Property';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'yacht': return '⛵';
      case 'motorcycle': return '🏍️';
      case 'bicycle': return '🚴';
      case 'vehicle': return '🚗';
      default: return '🏠';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-800/50 border-gray-700/50">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-red-500/20 w-fit mx-auto mb-4">
              <Home className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Listing Not Found</h1>
            <p className="text-gray-400 mb-6">
              This listing may have been removed or is no longer available.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const category = listing.category || 'property';
  const mode = (listing as any).listing_type || 'rent';
  const hasImages = listing.images && listing.images.length > 0;
  const isFreeMessagingCategory = FREE_MESSAGING_CATEGORIES.includes(category);
  const canDirectMessage = user && isFreeMessagingCategory && user.id !== listing.owner_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <motion.button
        onClick={() => navigate(-1)}
        whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
        className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-white">Zwipes</span>
          </div>
          {!user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Listing Preview Card */}
          <Card className="overflow-hidden bg-gray-800/50 border-gray-700/50">
            {/* Image Gallery */}
            <div className="relative aspect-[16/10] overflow-hidden">
              {hasImages ? (
                <ImageCarousel images={listing.images} alt={listing.title || 'Listing'} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center gap-2">
                  <span className="text-6xl">{getCategoryEmoji(category)}</span>
                  <span className="text-gray-500">No images available</span>
                </div>
              )}

              {/* Category and Mode badges */}
              <div className="absolute top-3 left-3 right-3 flex justify-between">
                <Badge className="bg-black/70 backdrop-blur-sm text-white border-0 flex items-center gap-1.5">
                  {getCategoryIcon(category)}
                  {getCategoryLabel(category)}
                </Badge>
                <Badge className={`backdrop-blur-sm border-0 ${
                  mode === 'both' ? 'bg-amber-500/80' :
                  mode === 'sale' ? 'bg-purple-500/80' : 'bg-blue-500/80'
                } text-white`}>
                  {mode === 'both' ? 'Rent/Sale' : mode === 'sale' ? 'For Sale' : 'For Rent'}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Title and Price */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {listing.title || 'Untitled Listing'}
                  </h1>
                  {category === 'property' && (listing.address || listing.city) && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">
                        {listing.address && `${listing.address}, `}
                        {listing.neighborhood && `${listing.neighborhood}, `}
                        {listing.city}
                      </span>
                    </div>
                  )}
                  {(category === 'yacht' || category === 'motorcycle' || category === 'bicycle' || category === 'vehicle') && (
                    <div className="text-gray-400">
                      {(listing as any).brand || (listing as any).vehicle_brand || listing.title}
                      {(listing as any).year && ` • ${(listing as any).year}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                    <DollarSign className="w-6 h-6" />
                    {listing.price?.toLocaleString() || 'TBD'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {mode === 'rent' ? '/month' : mode === 'sale' ? 'total' : 'sale/rent'}
                  </div>
                </div>
              </div>

              {/* Category-Specific Stats */}
              {category === 'property' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {listing.beds && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Bed className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{listing.beds}</div>
                        <div className="text-xs text-gray-400">Beds</div>
                      </div>
                    </div>
                  )}
                  {listing.baths && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Bath className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{listing.baths}</div>
                        <div className="text-xs text-gray-400">Baths</div>
                      </div>
                    </div>
                  )}
                  {listing.square_footage && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Square className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{listing.square_footage}</div>
                        <div className="text-xs text-gray-400">Sq ft</div>
                      </div>
                    </div>
                  )}
                  {(listing as any).parking_spaces !== undefined && (listing as any).parking_spaces !== null && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Car className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).parking_spaces}</div>
                        <div className="text-xs text-gray-400">Parking</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {category === 'yacht' && (
                <div className="grid grid-cols-3 gap-3">
                  {(listing as any).length_m && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Anchor className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).length_m}m</div>
                        <div className="text-xs text-gray-400">Length</div>
                      </div>
                    </div>
                  )}
                  {(listing as any).berths && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Bed className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).berths}</div>
                        <div className="text-xs text-gray-400">Berths</div>
                      </div>
                    </div>
                  )}
                  {(listing as any).max_passengers && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).max_passengers}</div>
                        <div className="text-xs text-gray-400">Passengers</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(category === 'motorcycle' || category === 'bicycle' || category === 'vehicle') && (
                <div className="grid grid-cols-3 gap-3">
                  {(listing as any).engine_cc && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <CircleDot className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).engine_cc}cc</div>
                        <div className="text-xs text-gray-400">Engine</div>
                      </div>
                    </div>
                  )}
                  {(listing as any).mileage && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <Car className="w-5 h-5 text-primary" />
                      <div>
                        <div className="font-semibold text-white">{(listing as any).mileage?.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Miles</div>
                      </div>
                    </div>
                  )}
                  {((listing as any).condition || (listing as any).vehicle_condition) && (
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <div className="font-semibold text-white capitalize">
                        {(listing as any).condition || (listing as any).vehicle_condition}
                      </div>
                      <div className="text-xs text-gray-400">Condition</div>
                    </div>
                  )}
                  {(listing as any).electric_assist && (
                    <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg">
                      <span className="text-xl">⚡</span>
                      <div>
                        <div className="font-semibold text-white">Electric</div>
                        <div className="text-xs text-gray-400">
                          {(listing as any).battery_range ? `${(listing as any).battery_range}km` : 'Assist'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Features Preview */}
              <div className="flex flex-wrap gap-2">
                {listing.property_type && (
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {listing.property_type}
                  </Badge>
                )}
                {(listing as any).furnished && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    Furnished
                  </Badge>
                )}
                {(listing as any).pet_friendly && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    Pet Friendly
                  </Badge>
                )}
                {(listing as any).availability_date && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Available {new Date((listing as any).availability_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700/50">
                <div className="text-center p-2 bg-gray-700/20 rounded-lg">
                  <Eye className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <div className="text-lg font-bold text-white">{listing.views || 0}</div>
                  <div className="text-xs text-gray-400">Views</div>
                </div>
                <div className="text-center p-2 bg-gray-700/20 rounded-lg">
                  <Flame className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <div className="text-lg font-bold text-white">{listing.likes || 0}</div>
                  <div className="text-xs text-gray-400">Likes</div>
                </div>
                <div className="text-center p-2 bg-gray-700/20 rounded-lg">
                  <MessageSquare className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <div className="text-lg font-bold text-white">{listing.contacts || 0}</div>
                  <div className="text-xs text-gray-400">Contacts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Section - Direct Message for Moto/Bicycle, Blurred for others */}
          {canDirectMessage ? (
            <Card className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Free Direct Messaging</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Good news! Motorcycles and Bicycles have free messaging. Contact the owner directly without any activation fees.
                </p>
                <Button
                  size="lg"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => setShowDirectMessageDialog(true)}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Message Owner - FREE
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative overflow-hidden bg-gray-800/50 border-gray-700/50">
              <CardContent className="p-6">
                {/* Blurred content */}
                <div className="filter blur-sm pointer-events-none select-none space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-600" />
                    <div className="space-y-2 flex-1">
                      <div className="h-5 w-32 bg-gray-600 rounded" />
                      <div className="h-3 w-48 bg-gray-600 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-600 rounded-lg" />
                    <div className="h-10 bg-gray-600 rounded-lg" />
                  </div>
                </div>

                {/* Overlay with CTA */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/60 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="p-3 rounded-full bg-primary/20 w-fit mx-auto mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      Contact the Owner
                    </h3>
                    <p className="text-sm text-gray-400 mb-4 max-w-xs">
                      Create an account to message the owner, schedule viewings, and get more details about this listing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center gap-2">
                <span className="text-2xl">{getCategoryEmoji(category)}</span>
                <Sparkles className="w-6 h-6 text-primary" />
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Interested in this {getCategoryLabel(category)}?
              </h3>
              <p className="text-gray-300 text-sm max-w-md mx-auto">
                {canDirectMessage
                  ? 'Send a message directly to the owner - free for Motos & Bicycles!'
                  : 'Join Zwipes to contact the owner, schedule viewings, and find your perfect match.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canDirectMessage ? (
                  <>
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      onClick={() => setShowDirectMessageDialog(true)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Direct Message
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-primary/50 text-primary hover:bg-primary/10"
                      onClick={() => navigate('/client/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white font-semibold"
                      onClick={() => navigate('/')}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Free Account
                    </Button>
                    {user && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10"
                        onClick={() => navigate('/client/dashboard')}
                      >
                        Go to Dashboard
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 pt-4">
            <p>Zwipes - Find Your Perfect Match</p>
          </div>
        </motion.div>
      </div>

      {/* Direct Message Dialog for Moto/Bicycle */}
      {listing && canDirectMessage && (
        <DirectMessageDialog
          open={showDirectMessageDialog}
          onOpenChange={setShowDirectMessageDialog}
          onConfirm={() => {
            setShowDirectMessageDialog(false);
          }}
          recipientName="the owner"
          category={category}
        />
      )}
    </div>
  );
}
