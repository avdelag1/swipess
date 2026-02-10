import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, MapPin, Briefcase, Calendar, Languages, Flame,
  Users, Baby, Cigarette, Wine, Sparkles, Volume2,
  Clock, Utensils, Smile, Star
} from 'lucide-react';
import { ImageCarousel } from '@/components/ImageCarousel';

interface ClientProfilePreviewProps {
  mode: 'self' | 'owner-view';
  clientId?: string;
}

export function ClientProfilePreview({ mode, clientId }: ClientProfilePreviewProps) {
  // Fetch combined profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['client-profile-preview', mode === 'self' ? 'self' : clientId],
    queryFn: async () => {
      let userId: string | undefined;
      
      if (mode === 'self') {
        const { data: auth } = await supabase.auth.getUser();
        userId = auth.user?.id;
      } else {
        userId = clientId;
      }

      if (!userId) throw new Error('No user ID available');

      // Fetch from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch from client_profiles table for extended fields
      const { data: clientProfile, error: clientError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') throw clientError;

      // Merge data - prefer client_profile fields when available
      return {
        ...profile,
        ...clientProfile,
        // Use profile_images from client_profiles if available, otherwise fall back to profiles.images
        images: clientProfile?.profile_images && clientProfile.profile_images.length > 0 
          ? clientProfile.profile_images 
          : profile.images || [],
      };
    },
    enabled: mode === 'self' || !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            {mode === 'self' 
              ? 'Complete your profile to see what owners will see' 
              : 'Profile not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const images = profileData.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with preview notice for self mode */}
      {mode === 'self' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">
              👁️ This is how owners will see your profile
            </p>
          </CardContent>
        </Card>
      )}

      {/* Images Section */}
      {hasImages && (
        <Card>
          <CardContent className="p-0">
            <ImageCarousel images={images} alt={`${profileData.full_name || 'User'}'s profile`} />
          </CardContent>
        </Card>
      )}

      {/* Basic Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileData.avatar_url || (images.length > 0 ? images[0] : undefined)} />
              <AvatarFallback>
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-3xl font-bold">{profileData.full_name || profileData.name || 'Anonymous'}</h2>
                {profileData.verified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-muted-foreground">
                {profileData.age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {profileData.age} years old
                  </span>
                )}
                {profileData.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {typeof profileData.location === 'string' ? profileData.location : JSON.stringify(profileData.location)}
                  </span>
                )}
                {(profileData as any).occupation && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {(profileData as any).occupation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profileData.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{profileData.bio}</p>
            </div>
          )}

          {/* Budget */}
          {(profileData.budget_min || profileData.budget_max) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Budget Range</h3>
              <p className="text-muted-foreground">
                ${profileData.budget_min?.toLocaleString() || '0'} - ${profileData.budget_max?.toLocaleString() || 'Unlimited'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demographics Card */}
      {(profileData.nationality || profileData.languages?.length > 0 || profileData.relationship_status || profileData.gender) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.gender && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Gender
                </h4>
                <p className="text-muted-foreground">{profileData.gender}</p>
              </div>
            )}
            {profileData.nationality && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Nationality
                </h4>
                <p className="text-muted-foreground">{profileData.nationality}</p>
              </div>
            )}
            {profileData.languages && profileData.languages.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.languages.map((lang: string) => (
                    <Badge key={`lang-${lang}`} variant="secondary">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profileData.relationship_status && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Relationship Status
                </h4>
                <p className="text-muted-foreground">{profileData.relationship_status}</p>
              </div>
            )}
            {profileData.has_children && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Baby className="h-4 w-4 text-muted-foreground" />
                  Family
                </h4>
                <p className="text-muted-foreground">Has children</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lifestyle Habits Card */}
      {(profileData.smoking_habit || profileData.drinking_habit || profileData.cleanliness_level || profileData.noise_tolerance || profileData.work_schedule) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Lifestyle Habits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.smoking_habit && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Cigarette className="h-4 w-4 text-muted-foreground" />
                  Smoking
                </h4>
                <p className="text-muted-foreground">{profileData.smoking_habit}</p>
              </div>
            )}
            {profileData.drinking_habit && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Wine className="h-4 w-4 text-muted-foreground" />
                  Drinking
                </h4>
                <p className="text-muted-foreground">{profileData.drinking_habit}</p>
              </div>
            )}
            {profileData.cleanliness_level && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Cleanliness
                </h4>
                <p className="text-muted-foreground">{profileData.cleanliness_level}</p>
              </div>
            )}
            {profileData.noise_tolerance && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  Noise Tolerance
                </h4>
                <p className="text-muted-foreground">{profileData.noise_tolerance}</p>
              </div>
            )}
            {profileData.work_schedule && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Work Schedule
                </h4>
                <p className="text-muted-foreground">{profileData.work_schedule}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personality & Interests Card */}
      {(profileData.personality_traits?.length > 0 || profileData.dietary_preferences?.length > 0 || profileData.interest_categories?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5" />
              Personality & Interests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.personality_traits && profileData.personality_traits.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  Personality Traits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.personality_traits.map((trait: string) => (
                    <Badge key={`trait-${trait}`} variant="outline">{trait}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profileData.dietary_preferences && profileData.dietary_preferences.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-muted-foreground" />
                  Dietary Preferences
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.dietary_preferences.map((pref: string) => (
                    <Badge key={`diet-${pref}`} variant="outline">{pref}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profileData.interest_categories && profileData.interest_categories.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  Interest Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.interest_categories.map((interest: string) => (
                    <Badge key={`cat-${interest}`} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legacy Interests & Activities */}
      {(profileData.interests?.length > 0 || profileData.preferred_activities?.length > 0 || profileData.lifestyle_tags?.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Interests & Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileData.interests && profileData.interests.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.interests.map((interest: string) => (
                    <Badge key={`int-${interest}`} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profileData.preferred_activities && profileData.preferred_activities.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Preferred Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.preferred_activities.map((activity: string) => (
                    <Badge key={`act-${activity}`} variant="outline">{activity}</Badge>
                  ))}
                </div>
              </div>
            )}
            {profileData.lifestyle_tags && profileData.lifestyle_tags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Lifestyle</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.lifestyle_tags.map((tag: string) => (
                    <Badge key={`tag-${tag}`} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
