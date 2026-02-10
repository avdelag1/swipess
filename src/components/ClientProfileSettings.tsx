import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, MapPin, Phone, Mail, Calendar, Flame, Home, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getStates, getCitiesForState, getNeighborhoodsForCity } from '@/data/mexicanLocations';
import { logger } from '@/utils/prodLogger';

export function ClientProfileSettings() {
  const { user, session } = useAuth(); // ✅ Get session from AuthContext
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false); // ✅ Button reliability
  
  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    age: '',
    bio: '',
    occupation: '',
    budget_min: '',
    budget_max: '',
    preferred_cities: [] as string[],
    lifestyle_preferences: [] as string[],
  });

  const lifestyleOptions = [
    'Pet Friendly', 'Gym Access', 'Coworking Space', 'Swimming Pool',
    'Rooftop Access', 'Garden/Patio', 'Parking', 'Security',
    'WiFi Included', 'Utilities Included', 'Furnished', 'Balcony'
  ];

  // Get Mexican states and cities for location selection
  const states = getStates();
  const cities = profile.state ? getCitiesForState(profile.state) : [];

  useEffect(() => {
    if (user?.user_metadata) {
      setProfile({
        full_name: user.user_metadata.full_name || '',
        email: user.email || '',
        phone: user.user_metadata.phone || '',
        state: user.user_metadata.state || '',
        city: user.user_metadata.city || '',
        age: user.user_metadata.age || '',
        bio: user.user_metadata.bio || '',
        occupation: user.user_metadata.occupation || '',
        budget_min: user.user_metadata.budget_min || '',
        budget_max: user.user_metadata.budget_max || '',
        preferred_cities: user.user_metadata.preferred_cities || [],
        lifestyle_preferences: user.user_metadata.lifestyle_preferences || [],
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would update the user profile in Supabase
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    // ✅ Button reliability: Guard against double-clicks
    if (isDeletingAccount) return;

    // ✅ Use AuthContext - single source of truth
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to delete your account.',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true); // ✅ Button reliability: Disable immediately
    try {

      const { data, error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted.',
      });

      // Sign out after successful deletion
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        logger.error('Delete account error:', error);
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false); // ✅ Button reliability: Reset state
    }
  };

  const togglePreference = (preference: string, type: 'city' | 'lifestyle') => {
    if (type === 'city') {
      setProfile(prev => ({
        ...prev,
        preferred_cities: prev.preferred_cities.includes(preference)
          ? prev.preferred_cities.filter(p => p !== preference)
          : [...prev.preferred_cities, preference]
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        lifestyle_preferences: prev.lifestyle_preferences.includes(preference)
          ? prev.lifestyle_preferences.filter(p => p !== preference)
          : [...prev.lifestyle_preferences, preference]
      }));
    }
  };

  const handleStateChange = (state: string) => {
    setProfile(prev => ({ ...prev, state, city: '' }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Profile Settings</h2>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>

      {/* Basic Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name" className="text-foreground">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-foreground">Age</Label>
              <Input
                id="age"
                type="number"
                value={profile.age}
                onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted border-border text-muted-foreground"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-foreground">Phone</Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div>
              <Label className="text-foreground">State</Label>
              <Select value={profile.state} onValueChange={handleStateChange}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {states.map(s => (
                    <SelectItem key={s} value={s} className="text-foreground">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-foreground">City</Label>
              <Select
                value={profile.city}
                onValueChange={(city) => setProfile(prev => ({ ...prev, city }))}
                disabled={!profile.state}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder={profile.state ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {cities.map(c => (
                    <SelectItem key={c} value={c} className="text-foreground">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="occupation" className="text-foreground">Occupation</Label>
              <Input
                id="occupation"
                value={profile.occupation}
                onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                className="bg-background border-border text-foreground"
                placeholder="e.g., Digital Nomad, Developer, Designer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Home className="w-5 h-5" />
            Budget Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min" className="text-foreground">Minimum Budget (USD/month)</Label>
              <Input
                id="budget_min"
                type="number"
                value={profile.budget_min}
                onChange={(e) => setProfile(prev => ({ ...prev, budget_min: e.target.value }))}
                className="bg-background border-border text-foreground"
                placeholder="1000"
              />
            </div>
            <div>
              <Label htmlFor="budget_max" className="text-foreground">Maximum Budget (USD/month)</Label>
              <Input
                id="budget_max"
                type="number"
                value={profile.budget_max}
                onChange={(e) => setProfile(prev => ({ ...prev, budget_max: e.target.value }))}
                className="bg-background border-border text-foreground"
                placeholder="5000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Preferred Cities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select cities where you'd like to find properties
          </p>
          {profile.preferred_cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.preferred_cities.map((city) => (
                <Badge
                  key={city}
                  variant="default"
                  className="cursor-pointer transition-colors"
                  onClick={() => togglePreference(city, 'city')}
                >
                  {city} x
                </Badge>
              ))}
            </div>
          )}
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cities
                .filter(c => !profile.preferred_cities.includes(c))
                .map((city) => (
                  <Badge
                    key={city}
                    variant="outline"
                    className="cursor-pointer transition-colors"
                    onClick={() => togglePreference(city, 'city')}
                  >
                    + {city}
                  </Badge>
                ))}
            </div>
          )}
          {!profile.state && (
            <p className="text-sm text-muted-foreground italic">
              Select your state above to see available cities
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lifestyle Preferences */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Lifestyle Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {lifestyleOptions.map((lifestyle) => (
              <Badge
                key={lifestyle}
                variant={profile.lifestyle_preferences.includes(lifestyle) ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => togglePreference(lifestyle, 'lifestyle')}
              >
                {lifestyle}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>

      {/* Danger Zone */}
      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. This will permanently delete your profile, messages, and all associated data.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                Delete Account Permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isDeletingAccount ? 'Deleting Account...' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}