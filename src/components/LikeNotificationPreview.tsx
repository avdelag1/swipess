import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, Flame, Loader2 } from 'lucide-react';
import { logger } from '@/utils/prodLogger';

interface LikeNotificationPreviewProps {
  likerId: string;
  targetType: 'listing' | 'profile';
  targetId?: string;
  userRole?: 'client' | 'owner'; // Current user's role
}

interface LikerInfo {
  id: string;
  type: 'client' | 'owner';
  locationCity?: string;
  neighborhood?: string;
  listingCount?: number;
  listingType?: string;
  previewImage?: string;
  preferencesPropertyType?: string;
  preferencesLocationZones?: string[];
}

export function LikeNotificationPreview({
  likerId,
  targetType,
  targetId,
  userRole,
}: LikeNotificationPreviewProps) {
  const [likerInfo, setLikerInfo] = useState<LikerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikerInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine if liker is client or owner based on context
        let likerType: 'client' | 'owner' = 'client';

        if (targetType === 'listing') {
          // If they liked a listing, they're a client
          likerType = 'client';
        } else {
          // If they liked a profile, they're likely an owner
          likerType = 'owner';
        }

        if (likerType === 'client') {
          // Show client preferences (what they're looking for)
          const { data: preferences } = await supabase
            .from('client_filter_preferences')
            .select('property_types, location_zones, created_at')
            .eq('user_id', likerId)
            .maybeSingle();

          const { data: profile } = await supabase
            .from('profiles')
            .select('city')
            .eq('id', likerId)
            .maybeSingle();

          setLikerInfo({
            id: likerId,
            type: 'client',
            locationCity: profile?.city,
            preferencesPropertyType: preferences?.property_types?.[0],
            preferencesLocationZones: preferences?.location_zones || [],
          });
        } else {
          // Show owner's listings preview
          const { data: listings } = await (supabase as any)
            .from('listings')
            .select('id, title, city, neighborhood, images, property_type')
            .eq('owner_id', likerId)
            .eq('status', 'active')
            .limit(1);

          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('city')
            .eq('id', likerId)
            .maybeSingle();

          const { count } = await (supabase as any)
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', likerId)
            .eq('status', 'active');

          const firstListing = listings?.[0];
          setLikerInfo({
            id: likerId,
            type: 'owner',
            locationCity: profile?.city || firstListing?.city,
            neighborhood: firstListing?.neighborhood,
            listingCount: count || 0,
            listingType: firstListing?.property_type,
            previewImage: firstListing?.images?.[0],
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          logger.error('[LikeNotificationPreview] Error fetching liker info:', err);
        }
        setError('Could not load preview');
      } finally {
        setLoading(false);
      }
    };

    if (likerId) {
      fetchLikerInfo();
    }
  }, [likerId, targetType]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !likerInfo) {
    return (
      <Card className="w-full bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <p className="text-sm text-amber-700">
            {error || 'Could not load profile preview'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Preview Image for Owner */}
        {likerInfo.type === 'owner' && likerInfo.previewImage && (
          <div className="w-full h-32 rounded-lg overflow-hidden">
            <img
              src={likerInfo.previewImage}
              alt="Listing preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header - Show role instead of name */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${likerInfo.type === 'client' ? 'from-cyan-500 to-blue-500' : 'from-orange-500 to-red-500'} flex items-center justify-center`}>
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h4 className="font-semibold">
                {likerInfo.type === 'owner' ? 'Property Owner' : 'Interested Client'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {likerInfo.type === 'owner' ? 'has a property for you' : 'likes your listing'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-2">New</Badge>
        </div>

        {/* Location Info */}
        {likerInfo.locationCity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{likerInfo.locationCity}</span>
          </div>
        )}

        {/* Neighborhood for Owner */}
        {likerInfo.neighborhood && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="w-4 h-4 shrink-0" />
            <span className="capitalize">{likerInfo.neighborhood}</span>
          </div>
        )}

        {/* Owner: Listing Count & Type */}
        {likerInfo.type === 'owner' && (
          <div className="flex gap-2 flex-wrap">
            {likerInfo.listingCount !== undefined && (
              <Badge variant="outline">
                {likerInfo.listingCount} listing{likerInfo.listingCount !== 1 ? 's' : ''}
              </Badge>
            )}
            {likerInfo.listingType && (
              <Badge variant="outline" className="capitalize">
                {likerInfo.listingType}
              </Badge>
            )}
          </div>
        )}

        {/* Client: Preferences */}
        {likerInfo.type === 'client' && (
          <div className="space-y-2">
            {likerInfo.preferencesPropertyType && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">Looking for:</p>
                <Badge variant="outline" className="capitalize">
                  {likerInfo.preferencesPropertyType}
                </Badge>
              </div>
            )}
            {likerInfo.preferencesLocationZones && likerInfo.preferencesLocationZones.length > 0 && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground mb-1">Interested areas:</p>
                <div className="flex gap-1 flex-wrap">
                  {likerInfo.preferencesLocationZones.slice(0, 3).map(zone => (
                    <Badge key={zone} variant="secondary" className="text-xs">
                      {zone}
                    </Badge>
                  ))}
                  {likerInfo.preferencesLocationZones.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{likerInfo.preferencesLocationZones.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-700 dark:text-blue-300">
          <p>✓ Their full profile will be revealed once you accept the like</p>
        </div>
      </CardContent>
    </Card>
  );
}
