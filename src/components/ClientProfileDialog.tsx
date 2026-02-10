
import { useEffect, useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { useClientProfile, useSaveClientProfile } from '@/hooks/useClientProfile';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Check, MapPin, Search } from 'lucide-react';
import {
  getRegions,
  getCountriesInRegion,
  getCitiesInCountry,
  getCityByName,
} from '@/data/worldLocations';
import { logger } from '@/utils/prodLogger';

// Predefined tag categories
const PROPERTY_TAGS = [
  'Looking to rent long-term', 'Short-term rental seeker', 'Interested in purchasing property',
  'Open to rent-to-own', 'Flexible lease terms', 'Corporate housing needed',
  'Family-friendly housing', 'Student accommodation',
];

const TRANSPORTATION_TAGS = [
  'Need motorcycle rental', 'Looking to buy motorcycle', 'Bicycle enthusiast',
  'Need yacht charter', 'Interested in yacht purchase', 'Daily commuter', 'Weekend explorer',
];

const LIFESTYLE_TAGS = [
  'Pet-friendly required', 'Eco-conscious living', 'Digital nomad', 'Fitness & wellness focused',
  'Beach lover', 'City center preference', 'Quiet neighborhood', 'Social & community-oriented',
  'Work-from-home setup', 'Minimalist lifestyle',
];

const FINANCIAL_TAGS = [
  'Verified income', 'Excellent credit score', 'Landlord references available',
  'Long-term employment', 'Flexible budget',
];

// New demographic options
const NATIONALITY_OPTIONS = [
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
  'Netherlands', 'Australia', 'Brazil', 'Argentina', 'Colombia', 'India', 'China', 'Japan',
  'South Korea', 'Other',
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch',
];

const RELATIONSHIP_STATUS_OPTIONS = [
  'Single', 'Couple', 'Family with Children', 'Group/Roommates',
];

const SMOKING_HABIT_OPTIONS = [
  'Non-Smoker', 'Occasional Smoker', 'Regular Smoker', 'Vaper Only',
];

const DRINKING_HABIT_OPTIONS = [
  'Non-Drinker', 'Social Drinker', 'Regular Drinker',
];

const CLEANLINESS_OPTIONS = [
  'Very Clean', 'Clean', 'Average', 'Relaxed',
];

const NOISE_TOLERANCE_OPTIONS = [
  'Very Quiet', 'Moderate', 'Flexible', 'Lively OK',
];

const WORK_SCHEDULE_OPTIONS = [
  '9-5 Traditional', 'Night Shift', 'Remote Worker', 'Flexible Hours', 'Retired', 'Student',
];

const DIETARY_OPTIONS = [
  'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Halal', 'Kosher',
];

const PERSONALITY_OPTIONS = [
  'Introvert', 'Extrovert', 'Ambivert', 'Early Bird', 'Night Owl', 'Highly Organized',
  'Relaxed/Casual', 'Adventurous', 'Homebody',
];

const INTEREST_OPTIONS = [
  'Sports & Fitness', 'Arts & Culture', 'Food & Cooking', 'Travel', 'Technology & Gaming',
  'Nature & Outdoors', 'Reading & Writing', 'Music & Concerts', 'Photography',
  'Yoga & Meditation', 'Entrepreneurship', 'Volunteering',
];

// Client intentions - what they're looking for (multi-option presets)
const INTENTION_OPTIONS = [
  { id: 'rent_property', label: 'Looking to Rent', description: 'Apartments, houses, rooms' },
  { id: 'buy_property', label: 'Looking to Buy', description: 'Interested in purchasing property' },
  { id: 'rent_vehicle', label: 'Need Vehicle Rental', description: 'Motorcycle, bicycle, car' },
  { id: 'hire_service', label: 'Looking to Hire', description: 'Find professionals for work' },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function ClientProfileDialogComponent({ open, onOpenChange }: Props) {
  const { data, isLoading } = useClientProfile();
  const saveMutation = useSaveClientProfile();

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [profileImages, setProfileImages] = useState<string[]>([]);

  // New demographic fields
  const [nationality, setNationality] = useState<string>('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [relationshipStatus, setRelationshipStatus] = useState<string>('');
  const [hasChildren, setHasChildren] = useState<boolean>(false);

  // Lifestyle habit fields
  const [smokingHabit, setSmokingHabit] = useState<string>('Non-Smoker');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('Non-Drinker');
  const [cleanlinessLevel, setCleanlinessLevel] = useState<string>('Clean');
  const [noiseTolerance, setNoiseTolerance] = useState<string>('Moderate');
  const [workSchedule, setWorkSchedule] = useState<string>('');

  // Cultural and personality fields
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [interestCategories, setInterestCategories] = useState<string[]>([]);

  // Location fields
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Client intentions - what they're looking for
  const [intentions, setIntentions] = useState<string[]>([]);

  // Get all unique countries across all regions
  const allCountries = (() => {
    const countries = new Set<string>();
    const regions = getRegions();
    for (const region of regions) {
      const regionCountries = getCountriesInRegion(region);
      regionCountries.forEach(c => countries.add(c));
    }
    return Array.from(countries).sort();
  })();

  // Filtered countries based on search
  const filteredCountries = allCountries.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Get cities for the selected country
  const availableCities = (() => {
    if (!country || !selectedRegion) return [];
    return getCitiesInCountry(selectedRegion, country);
  })();

  // Filtered cities based on search
  const filteredCities = availableCities.filter(c =>
    c.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  // Get neighborhoods for the selected city
  const availableNeighborhoods = (() => {
    if (!city) return [];
    const cityData = getCityByName(city);
    return cityData?.city.neighborhoods || [];
  })();

  // Find region for a country
  const findRegionForCountry = (countryName: string): string => {
    const regions = getRegions();
    for (const region of regions) {
      const countriesInRegion = getCountriesInRegion(region);
      if (countriesInRegion.includes(countryName)) {
        return region;
      }
    }
    return '';
  };

  // Handle country change
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setCountrySearch('');
    setCity('');
    setNeighborhood('');
    setCitySearch('');
    setLatitude(null);
    setLongitude(null);

    const region = findRegionForCountry(newCountry);
    setSelectedRegion(region);
  };

  // Handle city change
  const handleCityChange = (newCity: string) => {
    setCity(newCity);
    setCitySearch('');
    setNeighborhood('');

    const cityData = getCityByName(newCity);
    if (cityData?.city.coordinates) {
      setLatitude(cityData.city.coordinates.lat);
      setLongitude(cityData.city.coordinates.lng);
    }
  };

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? '');
    setAge(data.age ?? '');
    setGender(data.gender ?? '');
    setInterests(data.interests ?? []);
    setActivities(data.preferred_activities ?? []);
    setProfileImages(data.profile_images ?? []);

    // Load new demographic fields with type safety
    setNationality((data as any).nationality ?? '');
    setLanguages((data as any).languages ?? []);
    setRelationshipStatus((data as any).relationship_status ?? '');
    setHasChildren((data as any).has_children ?? false);

    // Load lifestyle habit fields
    setSmokingHabit((data as any).smoking_habit ?? 'Non-Smoker');
    setDrinkingHabit((data as any).drinking_habit ?? 'Non-Drinker');
    setCleanlinessLevel((data as any).cleanliness_level ?? 'Clean');
    setNoiseTolerance((data as any).noise_tolerance ?? 'Moderate');
    setWorkSchedule((data as any).work_schedule ?? '');

    // Load cultural and personality fields
    setDietaryPreferences((data as any).dietary_preferences ?? []);
    setPersonalityTraits((data as any).personality_traits ?? []);
    setInterestCategories((data as any).interest_categories ?? []);

    // Load location fields
    const loadedCountry = (data as any).country ?? '';
    const loadedCity = (data as any).city ?? '';
    setCountry(loadedCountry);
    setCity(loadedCity);
    setNeighborhood((data as any).neighborhood ?? '');
    setLatitude((data as any).latitude ?? null);
    setLongitude((data as any).longitude ?? null);

    // Load client intentions
    setIntentions((data as any).intentions ?? []);

    // Find and set the region for the loaded country
    if (loadedCountry) {
      const region = findRegionForCountry(loadedCountry);
      setSelectedRegion(region);
    }
  }, [data]);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user.data.user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        logger.error('Storage upload error:', error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'Could not upload image. Please try again.',
          variant: 'destructive'
        });
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    const payload = {
      name: name || null,
      age: age === '' ? null : Number(age),
      gender: gender || null,
      bio: null, // No longer using bio field
      interests: interests,
      preferred_activities: activities,
      profile_images: profileImages,

      // New demographic fields
      nationality: nationality || null,
      languages: languages,
      relationship_status: relationshipStatus || null,
      has_children: hasChildren,

      // Lifestyle habit fields
      smoking_habit: smokingHabit,
      drinking_habit: drinkingHabit,
      cleanliness_level: cleanlinessLevel,
      noise_tolerance: noiseTolerance,
      work_schedule: workSchedule || null,

      // Cultural and personality fields
      dietary_preferences: dietaryPreferences,
      personality_traits: personalityTraits,
      interest_categories: interestCategories,

      // Location fields
      country: country || null,
      city: city || null,
      neighborhood: neighborhood || null,
      latitude: latitude,
      longitude: longitude,

      // Client intentions
      intentions: intentions,
    };

    try {
      await saveMutation.mutateAsync(payload);
      toast({ title: 'Profile saved', description: 'Your comprehensive profile has been updated.' });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const toggleTag = (tag: string, isInterestTag: boolean) => {
    const totalTags = interests.length + activities.length;

    if (isInterestTag) {
      if (interests.includes(tag)) {
        setInterests(interests.filter(t => t !== tag));
      } else if (totalTags < 10) {
        setInterests([...interests, tag]);
      }
    } else {
      if (activities.includes(tag)) {
        setActivities(activities.filter(t => t !== tag));
      } else if (totalTags < 10) {
        setActivities([...activities, tag]);
      }
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else if (languages.length < 5) {
      setLanguages([...languages, lang]);
    }
  };

  const toggleDietaryPref = (pref: string) => {
    if (dietaryPreferences.includes(pref)) {
      setDietaryPreferences(dietaryPreferences.filter(p => p !== pref));
    } else if (dietaryPreferences.length < 3) {
      setDietaryPreferences([...dietaryPreferences, pref]);
    }
  };

  const togglePersonalityTrait = (trait: string) => {
    if (personalityTraits.includes(trait)) {
      setPersonalityTraits(personalityTraits.filter(t => t !== trait));
    } else if (personalityTraits.length < 5) {
      setPersonalityTraits([...personalityTraits, trait]);
    }
  };

  const toggleInterestCategory = (interest: string) => {
    if (interestCategories.includes(interest)) {
      setInterestCategories(interestCategories.filter(i => i !== interest));
    } else if (interestCategories.length < 6) {
      setInterestCategories([...interestCategories, interest]);
    }
  };

  const toggleIntention = (intentionId: string) => {
    if (intentions.includes(intentionId)) {
      setIntentions(intentions.filter(i => i !== intentionId));
    } else {
      setIntentions([...intentions, intentionId]);
    }
  };

  const totalTags = interests.length + activities.length;
  const completionPercentage = Math.round(
    ((name ? 20 : 0) + (age ? 10 : 0) + (gender ? 5 : 0) + (profileImages.length > 0 ? 15 : 0) + (intentions.length > 0 ? 20 : 0) + (totalTags >= 5 ? 30 : totalTags * 6)) / 100 * 100
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 text-white">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
              Edit Your Profile
            </DialogTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              {completionPercentage}% Complete
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-6">
            {/* Profile Photos Section - Priority #1 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-lg sm:text-xl font-bold">📸 Profile Photos</Label>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">Add up to 5 photos • First photo is your main photo</p>
                </div>
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-400">
                  {profileImages.length}/5
                </Badge>
              </div>
              <PhotoUploadManager
                maxPhotos={5}
                currentPhotos={profileImages}
                onPhotosChange={setProfileImages}
                uploadType="profile"
                onUpload={handleImageUpload}
              />
            </div>

            {/* Basic Info Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">👤 Basic Information</Label>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/90 text-sm sm:text-base">Full Name *</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your full name" 
                  className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-white/90 text-sm sm:text-base">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="25"
                    className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                    min="18"
                    max="99"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Gender</Label>
                  <Select value={gender ?? ''} onValueChange={setGender}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Intentions Section - What are you looking for? */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">🎯 What Are You Looking For?</Label>
              <p className="text-white/60 text-xs sm:text-sm -mt-2">Select all that apply • Helps owners understand your needs</p>

              <div className="grid grid-cols-1 gap-3">
                {INTENTION_OPTIONS.map((option) => {
                  const isSelected = intentions.includes(option.id);
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleIntention(option.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
                      }`}>
                        <Search className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{option.label}</span>
                          {isSelected && (
                            <Badge className="bg-red-500 text-white text-xs">
                              <Check className="w-3 h-3 mr-1" /> Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/50 truncate">{option.description}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? "border-red-500 bg-red-500 text-white" 
                          : "border-white/30"
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {intentions.length === 0 && (
                <p className="text-orange-400 text-sm">Select at least one option to continue</p>
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">📍 Your Location</Label>
              <p className="text-white/60 text-xs sm:text-sm -mt-2">Where are you looking to rent or buy?</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Country Select */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Country *</Label>
                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white max-h-72">
                      <div className="p-2 sticky top-0 bg-slate-800 border-b border-white/10 z-10">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                          <Input
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="h-8 pl-8 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/50"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-center text-white/50 text-sm">
                            No countries found
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* City Select */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">City *</Label>
                  <Select value={city} onValueChange={handleCityChange} disabled={!country}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400 disabled:opacity-50">
                      <SelectValue placeholder={country ? 'Select a city' : 'Select country first'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white max-h-72">
                      {availableCities.length > 0 && (
                        <div className="p-2 sticky top-0 bg-slate-800 border-b border-white/10 z-10">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                            <Input
                              placeholder="Search cities..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="h-8 pl-8 text-sm bg-white/5 border-white/20 text-white placeholder:text-white/50"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((c) => (
                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                          ))
                        ) : availableCities.length > 0 ? (
                          <div className="p-2 text-center text-white/50 text-sm">
                            No cities found
                          </div>
                        ) : (
                          <div className="p-2 text-center text-white/50 text-sm">
                            {country ? 'No cities available' : 'Select a country first'}
                          </div>
                        )}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Neighborhood Select */}
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Neighborhood</Label>
                  <Select
                    value={neighborhood}
                    onValueChange={setNeighborhood}
                    disabled={!city || availableNeighborhoods.length === 0}
                  >
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400 disabled:opacity-50">
                      <SelectValue placeholder={
                        !city ? 'Select city first' :
                        availableNeighborhoods.length === 0 ? 'No neighborhoods' :
                        'Select (optional)'
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white max-h-60">
                      {availableNeighborhoods.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Location Display */}
              {(city || country) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {country && (
                    <Badge variant="secondary" className="text-xs py-0.5 bg-white/10 text-white/80">
                      {country}
                    </Badge>
                  )}
                  {city && (
                    <Badge className="text-xs py-0.5 bg-gradient-to-r from-red-600 to-red-500 text-white">
                      <MapPin className="w-3 h-3 mr-1" />
                      {city}
                    </Badge>
                  )}
                  {neighborhood && (
                    <Badge variant="outline" className="text-xs py-0.5 border-white/20 text-white/80">
                      {neighborhood}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Demographics & Background Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">🌍 Demographics & Background</Label>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Nationality</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {NATIONALITY_OPTIONS.map(nat => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Languages ({languages.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <Badge
                      key={lang}
                      variant={languages.includes(lang) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        languages.includes(lang)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-transparent'
                          : 'bg-white/5 border-white/20 text-white/70 hover:border-blue-400 hover:bg-white/10'
                      }`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Relationship Status</Label>
                  <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      {RELATIONSHIP_STATUS_OPTIONS.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Has Children</Label>
                  <div className="flex items-center h-12 px-4 bg-white/5 border border-white/20 rounded-md">
                    <Switch
                      checked={hasChildren}
                      onCheckedChange={setHasChildren}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-600 data-[state=checked]:to-red-500"
                    />
                    <span className="ml-3 text-white">{hasChildren ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifestyle Habits Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">🏠 Lifestyle Habits</Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Smoking Habit</Label>
                  <Select value={smokingHabit} onValueChange={setSmokingHabit}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      {SMOKING_HABIT_OPTIONS.map(habit => (
                        <SelectItem key={habit} value={habit}>{habit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Drinking Habit</Label>
                  <Select value={drinkingHabit} onValueChange={setDrinkingHabit}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      {DRINKING_HABIT_OPTIONS.map(habit => (
                        <SelectItem key={habit} value={habit}>{habit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Cleanliness Level</Label>
                  <Select value={cleanlinessLevel} onValueChange={setCleanlinessLevel}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      {CLEANLINESS_OPTIONS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/90 text-sm sm:text-base">Noise Tolerance</Label>
                  <Select value={noiseTolerance} onValueChange={setNoiseTolerance}>
                    <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      {NOISE_TOLERANCE_OPTIONS.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Work Schedule</Label>
                <Select value={workSchedule} onValueChange={setWorkSchedule}>
                  <SelectTrigger className="h-12 text-base bg-white/5 border-white/20 text-white focus:border-red-400">
                    <SelectValue placeholder="Select work schedule" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {WORK_SCHEDULE_OPTIONS.map(schedule => (
                      <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cultural & Personality Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">✨ Cultural & Personality</Label>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Dietary Preferences ({dietaryPreferences.length}/3)</Label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(diet => (
                    <Badge
                      key={diet}
                      variant={dietaryPreferences.includes(diet) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        dietaryPreferences.includes(diet)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-transparent'
                          : 'bg-white/5 border-white/20 text-white/70 hover:border-green-400 hover:bg-white/10'
                      }`}
                      onClick={() => toggleDietaryPref(diet)}
                    >
                      {diet}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Personality Traits ({personalityTraits.length}/5)</Label>
                <div className="flex flex-wrap gap-2">
                  {PERSONALITY_OPTIONS.map(trait => (
                    <Badge
                      key={trait}
                      variant={personalityTraits.includes(trait) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        personalityTraits.includes(trait)
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-transparent'
                          : 'bg-white/5 border-white/20 text-white/70 hover:border-purple-400 hover:bg-white/10'
                      }`}
                      onClick={() => togglePersonalityTrait(trait)}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/90 text-sm sm:text-base">Interest Categories ({interestCategories.length}/6)</Label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map(interest => (
                    <Badge
                      key={interest}
                      variant={interestCategories.includes(interest) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        interestCategories.includes(interest)
                          ? 'bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white border-transparent'
                          : 'bg-white/5 border-white/20 text-white/70 hover:border-red-400 hover:bg-white/10'
                      }`}
                      onClick={() => toggleInterestCategory(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

              {/* Profile Tags Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-white text-lg sm:text-xl font-bold">🏷️ Describe Yourself</Label>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">Select 5-10 tags that best describe your needs and preferences</p>
                </div>
                
                {/* Property Interest Tags */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-semibold text-blue-400 flex items-center gap-2">
                    🏠 Property & Housing
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {PROPERTY_TAGS.map(tag => (
                      <div
                        key={tag}
                        className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
                          interests.includes(tag)
                            ? 'bg-blue-500/20 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                        onClick={() => toggleTag(tag, true)}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                          interests.includes(tag)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-white/40 bg-transparent'
                        }`}>
                          {interests.includes(tag) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm leading-tight">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transportation Tags */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-semibold text-red-400 flex items-center gap-2">
                    🚗 Transportation & Mobility
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {TRANSPORTATION_TAGS.map(tag => (
                      <div
                        key={tag}
                        className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
                          activities.includes(tag)
                            ? 'bg-red-500/20 border-red-400 text-white shadow-lg shadow-red-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                        onClick={() => toggleTag(tag, false)}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                          activities.includes(tag)
                            ? 'bg-red-500 border-red-500'
                            : 'border-white/40 bg-transparent'
                        }`}>
                          {activities.includes(tag) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm leading-tight">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifestyle Tags */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-semibold text-purple-400 flex items-center gap-2">
                    ✨ Lifestyle & Preferences
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {LIFESTYLE_TAGS.map(tag => (
                      <div
                        key={tag}
                        className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
                          interests.includes(tag)
                            ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                        onClick={() => toggleTag(tag, true)}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                          interests.includes(tag)
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-white/40 bg-transparent'
                        }`}>
                          {interests.includes(tag) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm leading-tight">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial & Verification Tags */}
                <div className="space-y-3">
                  <h4 className="text-sm sm:text-base font-semibold text-green-400 flex items-center gap-2">
                    💰 Financial & Verification
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {FINANCIAL_TAGS.map(tag => (
                      <div
                        key={tag}
                        className={`flex items-center gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all active:scale-95 ${
                          activities.includes(tag)
                            ? 'bg-green-500/20 border-green-400 text-white shadow-lg shadow-green-500/20'
                            : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10 hover:border-white/30'
                        }`}
                        onClick={() => toggleTag(tag, false)}
                      >
                        <div className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                          activities.includes(tag)
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/40 bg-transparent'
                        }`}>
                          {activities.includes(tag) && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm leading-tight">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tag Counter & Clear Button */}
                <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-white/10 to-white/5 rounded-xl border-2 border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm sm:text-lg">
                      {totalTags}
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-white">
                        {totalTags} / 10 tags selected
                      </p>
                      <p className="text-xs text-white/60">
                        {totalTags < 5 ? 'Select at least 5 tags' : totalTags >= 10 ? 'Maximum reached!' : 'Good progress!'}
                      </p>
                    </div>
                  </div>
                  {totalTags > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setInterests([]);
                        setActivities([]);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-10 px-4"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-white/10 flex-row gap-3 shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-white/70 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending || isLoading || !name.trim()}
            className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold text-base"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export const ClientProfileDialog = memo(ClientProfileDialogComponent);
