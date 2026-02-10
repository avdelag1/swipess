/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { PageTransition } from '@/components/PageTransition';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Flame, Home, Bike, Ship, Car } from 'lucide-react';
import { ClientProfilePreview } from '@/components/ClientProfilePreview';
import { toast } from 'sonner';
import { ClientFilterPreferences } from '@/hooks/useClientFilterPreferences';
import { useStartConversation } from '@/hooks/useConversations';
import { useState as useReactState } from 'react';
import { logger } from '@/utils/prodLogger';

export default function OwnerViewClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [isCreatingConversation, setIsCreatingConversation] = useReactState(false);
  const startConversation = useStartConversation();

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID provided');

      // Fetch profile first - this is the main data source
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (profileError) {
        if (import.meta.env.DEV) {
          logger.error('[OwnerViewClientProfile] Profile fetch error:', profileError);
        }
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profile not found');
      }

      // Check role - but be lenient (allow viewing if user is NOT an owner)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', clientId)
        .maybeSingle();

      // Only block if explicitly an owner (allow null/undefined roles or client role)
      if (roleData?.role === 'owner') {
        throw new Error('Cannot view owner profiles from this page');
      }

      // TRY to get updated photos from client_profiles table (newer source)
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('profile_images, name, age, bio')
        .eq('user_id', clientId)
        .maybeSingle();

      // Merge: Use profile_images from client_profiles if available (newer), otherwise use profiles.images
      if (clientProfile?.profile_images && clientProfile.profile_images.length > 0) {
        profileData.images = clientProfile.profile_images;
      }

      // Merge name/age/bio from client_profiles if available
      if (clientProfile?.name) profileData.full_name = clientProfile.name;
      if (clientProfile?.age) profileData.age = clientProfile.age;
      if (clientProfile?.bio) profileData.bio = clientProfile.bio;

      return profileData;
    },
    enabled: !!clientId,
  });

  // Fetch client's filter preferences
  const { data: preferences } = useQuery({
    queryKey: ['client-filter-preferences', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_filter_preferences')
        .select('*')
        .eq('user_id', clientId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ClientFilterPreferences | null;
    },
    enabled: !!clientId,
  });

  const handleConnect = async () => {
    if (!clientId || isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    
    try {
      toast.loading('Starting conversation...', { id: 'start-conv' });
      
      const result = await startConversation.mutateAsync({
        otherUserId: clientId,
        initialMessage: "Hi! I'd like to connect with you.",
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Opening chat...', { id: 'start-conv' });
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error starting conversation:', error);
      }
      toast.error('Could not start conversation', { id: 'start-conv' });
    } finally {
      setIsCreatingConversation(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4">Client not found</h2>
          <Button onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </>
    );
  }

  const images = client.images || [];

  return (
    <>
      <div className="bg-background">
        {/* Header */}
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-1 sm:mb-2">
              Back
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl pb-28 sm:pb-8">
          {/* Use the shared ClientProfilePreview component */}
          <ClientProfilePreview mode="owner-view" clientId={clientId} />

          {/* CLIENT PREFERENCES - What they're looking for */}
          {preferences && (
            <>
              {/* Property Preferences */}
              {preferences.interested_in_properties && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">Property Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Price Range */}
                      {(preferences.min_price !== null || preferences.max_price !== null) && (
                        <div>
                          <h4 className="font-medium mb-2">Price Range</h4>
                          <p className="text-muted-foreground">
                            ${preferences.min_price?.toLocaleString() || '0'} - ${preferences.max_price?.toLocaleString() || 'Unlimited'}
                          </p>
                        </div>
                      )}

                      {/* Property Types */}
                      {preferences.property_types && preferences.property_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Property Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.property_types.map((type) => (
                              <Badge key={`prop-type-${type}`} variant="secondary">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bedrooms & Bathrooms */}
                      {(preferences.min_bedrooms || preferences.max_bedrooms) && (
                        <div>
                          <h4 className="font-medium mb-2">Rooms</h4>
                          <p className="text-muted-foreground">
                            {preferences.min_bedrooms || 0} - {preferences.max_bedrooms || '∞'} bedrooms, {' '}
                            {preferences.min_bathrooms || 0} - {preferences.max_bathrooms || '∞'} bathrooms
                          </p>
                        </div>
                      )}

                      {/* Locations */}
                      {preferences.location_zones && preferences.location_zones.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Preferred Locations</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.location_zones.map((zone) => (
                              <Badge key={`zone-${zone}`} variant="outline">{zone}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      <div>
                        <h4 className="font-medium mb-2">Required Amenities</h4>
                        <div className="flex flex-wrap gap-2">
                          {preferences.furnished_required && <Badge variant="secondary">Furnished</Badge>}
                          {preferences.pet_friendly_required && <Badge variant="secondary">Pet Friendly</Badge>}
                          {preferences.requires_gym && <Badge variant="secondary">Gym</Badge>}
                          {preferences.requires_balcony && <Badge variant="secondary">Balcony</Badge>}
                          {preferences.requires_elevator && <Badge variant="secondary">Elevator</Badge>}
                          {preferences.requires_jacuzzi && <Badge variant="secondary">Jacuzzi</Badge>}
                          {preferences.requires_coworking_space && <Badge variant="secondary">Coworking Space</Badge>}
                          {preferences.requires_solar_panels && <Badge variant="secondary">Solar Panels</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Motorcycle Preferences */}
              {preferences.interested_in_motorcycles && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Car className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">Motorcycle Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Motorcycle Types */}
                      {preferences.moto_types && preferences.moto_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_types.map((type) => (
                              <Badge key={`moto-type-${type}`} variant="secondary">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      {(preferences.moto_price_min !== null || preferences.moto_price_max !== null) && (
                        <div>
                          <h4 className="font-medium mb-2">Price Range</h4>
                          <p className="text-muted-foreground">
                            ${preferences.moto_price_min?.toLocaleString() || '0'} - ${preferences.moto_price_max?.toLocaleString() || 'Unlimited'}
                          </p>
                        </div>
                      )}

                      {/* Engine Size */}
                      {(preferences.moto_engine_size_min || preferences.moto_engine_size_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Engine Size</h4>
                          <p className="text-muted-foreground">
                            {preferences.moto_engine_size_min || 0}cc - {preferences.moto_engine_size_max || 2000}cc
                          </p>
                        </div>
                      )}

                      {/* Year Range */}
                      {(preferences.moto_year_min || preferences.moto_year_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Year</h4>
                          <p className="text-muted-foreground">
                            {preferences.moto_year_min || 1990} - {preferences.moto_year_max || new Date().getFullYear()}
                          </p>
                        </div>
                      )}

                      {/* Transmission, Condition, Fuel Types */}
                      {preferences.moto_transmission && preferences.moto_transmission.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Transmission</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_transmission.map((trans) => (
                              <Badge key={`moto-trans-${trans}`} variant="outline">{trans}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {preferences.moto_condition && preferences.moto_condition.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Condition</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_condition.map((cond) => (
                              <Badge key={`moto-cond-${cond}`} variant="outline">{cond}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {preferences.moto_fuel_types && preferences.moto_fuel_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Fuel Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_fuel_types.map((fuel) => (
                              <Badge key={`moto-fuel-${fuel}`} variant="outline">{fuel}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      {preferences.moto_features && preferences.moto_features.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Desired Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_features.map((feat) => (
                              <Badge key={`moto-feat-${feat}`} variant="secondary">{feat}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Requirements */}
                      {(preferences.moto_has_abs || preferences.moto_is_electric) && (
                        <div>
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.moto_has_abs && <Badge variant="secondary">Must have ABS</Badge>}
                            {preferences.moto_is_electric && <Badge variant="secondary">Electric Only</Badge>}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Bicycle Preferences */}
              {preferences.interested_in_bicycles && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Bike className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">Bicycle Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Bicycle Types */}
                      {preferences.bicycle_types && preferences.bicycle_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.bicycle_types.map((type) => (
                              <Badge key={`bike-type-${type}`} variant="secondary">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      {(preferences.bicycle_price_min !== null || preferences.bicycle_price_max !== null) && (
                        <div>
                          <h4 className="font-medium mb-2">Price Range</h4>
                          <p className="text-muted-foreground">
                            ${preferences.bicycle_price_min?.toLocaleString() || '0'} - ${preferences.bicycle_price_max?.toLocaleString() || 'Unlimited'}
                          </p>
                        </div>
                      )}

                      {/* Wheel Size, Suspension, Material */}
                      {preferences.bicycle_wheel_sizes && preferences.bicycle_wheel_sizes.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Wheel Sizes</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.bicycle_wheel_sizes.map((size) => (
                              <Badge key={`bike-wheel-${size}`} variant="outline">{size}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {preferences.bicycle_suspension_type && preferences.bicycle_suspension_type.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Suspension Type</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.bicycle_suspension_type.map((susp) => (
                              <Badge key={`bike-susp-${susp}`} variant="outline">{susp}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {preferences.bicycle_material && preferences.bicycle_material.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Frame Material</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.bicycle_material.map((mat) => (
                              <Badge key={`bike-mat-${mat}`} variant="outline">{mat}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gears & Year */}
                      {(preferences.bicycle_gears_min || preferences.bicycle_gears_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Gears</h4>
                          <p className="text-muted-foreground">
                            {preferences.bicycle_gears_min || 1} - {preferences.bicycle_gears_max || 30} gears
                          </p>
                        </div>
                      )}

                      {preferences.bicycle_year_min && (
                        <div>
                          <h4 className="font-medium mb-2">Minimum Year</h4>
                          <p className="text-muted-foreground">{preferences.bicycle_year_min}</p>
                        </div>
                      )}

                      {/* Condition */}
                      {preferences.bicycle_condition && preferences.bicycle_condition.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Condition</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.bicycle_condition.map((cond) => (
                              <Badge key={`bike-cond-${cond}`} variant="outline">{cond}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Electric Preferences */}
                      {preferences.bicycle_is_electric && (
                        <div>
                          <h4 className="font-medium mb-2">Electric Preferences</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Electric Only</Badge>
                            {preferences.bicycle_battery_range_min && (
                              <Badge variant="outline">Min {preferences.bicycle_battery_range_min} miles range</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Yacht Preferences */}
              {preferences.interested_in_yachts && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Ship className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-bold">Yacht Preferences</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Yacht Types */}
                      {preferences.yacht_types && preferences.yacht_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_types.map((type) => (
                              <Badge key={`yacht-type-${type}`} variant="secondary">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      {(preferences.yacht_price_min !== null || preferences.yacht_price_max !== null) && (
                        <div>
                          <h4 className="font-medium mb-2">Price Range</h4>
                          <p className="text-muted-foreground">
                            ${preferences.yacht_price_min?.toLocaleString() || '0'} - ${preferences.yacht_price_max?.toLocaleString() || 'Unlimited'}
                          </p>
                        </div>
                      )}

                      {/* Length */}
                      {(preferences.yacht_length_min || preferences.yacht_length_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Length</h4>
                          <p className="text-muted-foreground">
                            {preferences.yacht_length_min || 20} - {preferences.yacht_length_max || 300} feet
                          </p>
                        </div>
                      )}

                      {/* Year */}
                      {preferences.yacht_year_min && (
                        <div>
                          <h4 className="font-medium mb-2">Minimum Year</h4>
                          <p className="text-muted-foreground">{preferences.yacht_year_min}</p>
                        </div>
                      )}

                      {/* Guest Capacity & Cabins */}
                      {(preferences.yacht_guest_capacity_min || preferences.yacht_guest_capacity_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Guest Capacity</h4>
                          <p className="text-muted-foreground">
                            {preferences.yacht_guest_capacity_min || 1} - {preferences.yacht_guest_capacity_max || 50} guests
                          </p>
                        </div>
                      )}

                      {(preferences.yacht_cabin_count_min || preferences.yacht_cabin_count_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Cabins</h4>
                          <p className="text-muted-foreground">
                            {preferences.yacht_cabin_count_min || 1} - {preferences.yacht_cabin_count_max || 15} cabins
                          </p>
                        </div>
                      )}

                      {/* Condition & Fuel Types */}
                      {preferences.yacht_condition && preferences.yacht_condition.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Condition</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_condition.map((cond) => (
                              <Badge key={`yacht-cond-${cond}`} variant="outline">{cond}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {preferences.yacht_fuel_types && preferences.yacht_fuel_types.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Fuel Types</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_fuel_types.map((fuel) => (
                              <Badge key={`yacht-fuel-${fuel}`} variant="outline">{fuel}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Engine Power & Performance */}
                      {(preferences.yacht_engine_power_min || preferences.yacht_engine_power_max) && (
                        <div>
                          <h4 className="font-medium mb-2">Engine Power</h4>
                          <p className="text-muted-foreground">
                            {preferences.yacht_engine_power_min || 0} - {preferences.yacht_engine_power_max || 10000} HP
                          </p>
                        </div>
                      )}

                      {preferences.yacht_max_speed_min && (
                        <div>
                          <h4 className="font-medium mb-2">Minimum Speed</h4>
                          <p className="text-muted-foreground">{preferences.yacht_max_speed_min} knots</p>
                        </div>
                      )}

                      {preferences.yacht_range_nm_min && (
                        <div>
                          <h4 className="font-medium mb-2">Minimum Range</h4>
                          <p className="text-muted-foreground">{preferences.yacht_range_nm_min} nautical miles</p>
                        </div>
                      )}

                      {/* Hull Material */}
                      {preferences.yacht_hull_material && preferences.yacht_hull_material.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Hull Material</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_hull_material.map((mat) => (
                              <Badge key={`yacht-mat-${mat}`} variant="outline">{mat}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Water Activities */}
                      {preferences.yacht_water_activities && preferences.yacht_water_activities.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Water Activities</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_water_activities.map((act) => (
                              <Badge key={`yacht-act-${act}`} variant="secondary">{act}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation Equipment */}
                      {preferences.yacht_navigation_equipment && preferences.yacht_navigation_equipment.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Navigation Equipment</h4>
                          <div className="flex flex-wrap gap-2">
                            {preferences.yacht_navigation_equipment.map((nav) => (
                              <Badge key={`yacht-nav-${nav}`} variant="secondary">{nav}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stabilizers */}
                      {preferences.yacht_has_stabilizers && (
                        <div>
                          <Badge variant="secondary">Must have stabilizers</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 sticky bottom-20 sm:bottom-6 bg-background/98 py-3 -mx-3 sm:-mx-4 px-3 sm:px-4 border-t border-border/50">
            <Button onClick={handleConnect} className="flex-1 text-sm sm:text-base" size="lg">
              <MessageCircle className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Start Conversation</span>
              <span className="sm:hidden">Message</span>
            </Button>
            <Button variant="outline" size="lg">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
