import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save } from 'lucide-react';
import { useOwnerClientPreferences, OwnerClientPreferences } from '@/hooks/useOwnerClientPreferences';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface OwnerClientFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LISTING_TYPE_OPTIONS = [
  { value: 'property', label: 'Properties' },
  { value: 'motorcycle', label: 'Motorcycles' },
  { value: 'bicycle', label: 'Bicycles' },
  { value: 'yacht', label: 'Yachts' },
];

const CLIENT_TYPE_OPTIONS = [
  { value: 'tenant', label: 'Tenants (Renters)' },
  { value: 'buyer', label: 'Buyers' },
];

const LIFESTYLE_OPTIONS = [
  'Digital Nomad',
  'Professional',
  'Student',
  'Family-Oriented',
  'Party-Friendly',
  'Quiet',
  'Social',
  'Health-Conscious',
  'Pet Lover',
  'Eco-Friendly',
];

const OCCUPATION_OPTIONS = [
  'Remote Worker',
  'Entrepreneur',
  'Student',
  'Teacher',
  'Healthcare',
  'Tech',
  'Creative',
  'Hospitality',
  'Finance',
  'Retired',
];

const GENDER_OPTIONS = [
  'Any Gender',
  'Male',
  'Female',
  'Non-Binary',
  'Prefer Not to Specify',
];

const NATIONALITY_OPTIONS = [
  'Any Nationality',
  'United States',
  'Canada',
  'Mexico',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Australia',
  'Brazil',
  'Argentina',
  'Colombia',
  'India',
  'China',
  'Japan',
  'South Korea',
  'Other',
];

const LANGUAGE_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Mandarin',
  'Japanese',
  'Korean',
  'Arabic',
  'Russian',
  'Dutch',
  'Other',
];

const RELATIONSHIP_STATUS_OPTIONS = [
  'Any Status',
  'Single',
  'Couple',
  'Family with Children',
  'Group/Roommates',
];

const SMOKING_HABITS = [
  'Any',
  'Non-Smoker',
  'Occasional Smoker',
  'Regular Smoker',
  'Vaper Only',
];

const DRINKING_HABITS = [
  'Any',
  'Non-Drinker',
  'Social Drinker',
  'Regular Drinker',
];

const CLEANLINESS_LEVELS = [
  'Any',
  'Very Clean',
  'Clean',
  'Average',
  'Relaxed',
];

const NOISE_TOLERANCE = [
  'Any',
  'Very Quiet',
  'Moderate',
  'Flexible',
  'Lively OK',
];

const WORK_SCHEDULES = [
  'Any',
  '9-5 Traditional',
  'Night Shift',
  'Remote Worker',
  'Flexible Hours',
  'Retired',
  'Student',
];

const DIETARY_PREFERENCES = [
  'No Preference',
  'Omnivore',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Other Dietary Needs',
];

const PERSONALITY_TRAITS = [
  'Introvert',
  'Extrovert',
  'Ambivert',
  'Early Bird',
  'Night Owl',
  'Highly Organized',
  'Relaxed/Casual',
  'Adventurous',
  'Homebody',
];

const INTEREST_CATEGORIES = [
  'Sports & Fitness',
  'Arts & Culture',
  'Food & Cooking',
  'Travel',
  'Technology & Gaming',
  'Nature & Outdoors',
  'Reading & Writing',
  'Music & Concerts',
  'Photography',
  'Yoga & Meditation',
  'Entrepreneurship',
  'Volunteering',
];

// Predefined budget ranges for owner filters
const OWNER_BUDGET_RANGES = [
  { value: '250-500', label: '$250 - $500/mo', min: 250, max: 500 },
  { value: '500-1000', label: '$500 - $1,000/mo', min: 500, max: 1000 },
  { value: '1000-3000', label: '$1,000 - $3,000/mo', min: 1000, max: 3000 },
  { value: '3000-5000', label: '$3,000 - $5,000/mo', min: 3000, max: 5000 },
  { value: '5000+', label: '$5,000+/mo', min: 5000, max: 50000 },
];

export function OwnerClientFilterDialog({ open, onOpenChange }: OwnerClientFilterDialogProps) {
  
  const { preferences, updatePreferences, isUpdating } = useOwnerClientPreferences();
  const { saveFilter } = useSavedFilters();
  const { toast } = useToast();
  
  const [filterName, setFilterName] = useState('');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [formData, setFormData] = useState<Partial<OwnerClientPreferences>>({
    min_budget: undefined,
    max_budget: undefined,
    min_age: 18,
    max_age: 65,
    compatible_lifestyle_tags: [],
    allows_pets: true,
    allows_smoking: false,
    allows_parties: false,
    requires_employment_proof: false,
    requires_references: false,
    min_monthly_income: undefined,
    preferred_occupations: [],
  });

  // New demographic filter states
  const [selectedGenders, setSelectedGenders] = useState<string[]>(['Any Gender']);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>(['Any Nationality']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedRelationshipStatus, setSelectedRelationshipStatus] = useState<string[]>(['Any Status']);
  const [allowsChildren, setAllowsChildren] = useState<boolean | null>(null);

  // Lifestyle habit filter states
  const [smokingHabit, setSmokingHabit] = useState<string>('Any');
  const [drinkingHabit, setDrinkingHabit] = useState<string>('Any');
  const [cleanlinessLevel, setCleanlinessLevel] = useState<string>('Any');
  const [noiseTolerance, setNoiseTolerance] = useState<string>('Any');
  const [workSchedule, setWorkSchedule] = useState<string>('Any');

  // Cultural and personality filter states
  const [selectedDietaryPreferences, setSelectedDietaryPreferences] = useState<string[]>(['No Preference']);
  const [selectedPersonalityTraits, setSelectedPersonalityTraits] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>(['property']);
  const [selectedClientTypes, setSelectedClientTypes] = useState<string[]>(['tenant']);
  const [selectedInterestTypes, setSelectedInterestTypes] = useState<string[]>(['both']);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState<string>('');

  useEffect(() => {
    if (preferences) {
      setFormData({
        min_budget: preferences.min_budget,
        max_budget: preferences.max_budget,
        min_age: preferences.min_age || 18,
        max_age: preferences.max_age || 65,
        compatible_lifestyle_tags: preferences.compatible_lifestyle_tags || [],
        allows_pets: preferences.allows_pets ?? true,
        allows_smoking: preferences.allows_smoking ?? false,
        allows_parties: preferences.allows_parties ?? false,
        requires_employment_proof: preferences.requires_employment_proof ?? false,
        requires_references: preferences.requires_references ?? false,
        min_monthly_income: preferences.min_monthly_income,
        preferred_occupations: preferences.preferred_occupations || [],
      });

      // Load new demographic filter fields
      if (preferences.selected_genders) setSelectedGenders(preferences.selected_genders);
      if (preferences.selected_nationalities) setSelectedNationalities(preferences.selected_nationalities);
      if (preferences.selected_languages) setSelectedLanguages(preferences.selected_languages);
      if (preferences.selected_relationship_status) setSelectedRelationshipStatus(preferences.selected_relationship_status);
      if (preferences.allows_children !== undefined) setAllowsChildren(preferences.allows_children);

      // Load lifestyle habit filters
      if (preferences.smoking_habit) setSmokingHabit(preferences.smoking_habit);
      if (preferences.drinking_habit) setDrinkingHabit(preferences.drinking_habit);
      if (preferences.cleanliness_level) setCleanlinessLevel(preferences.cleanliness_level);
      if (preferences.noise_tolerance) setNoiseTolerance(preferences.noise_tolerance);
      if (preferences.work_schedule) setWorkSchedule(preferences.work_schedule);

      // Load cultural and personality filters
      if (preferences.selected_dietary_preferences) setSelectedDietaryPreferences(preferences.selected_dietary_preferences);
      if (preferences.selected_personality_traits) setSelectedPersonalityTraits(preferences.selected_personality_traits);
      if (preferences.selected_interests) setSelectedInterests(preferences.selected_interests);
    }
  }, [preferences]);

  const toggleLifestyleTag = (tag: string) => {
    const current = formData.compatible_lifestyle_tags || [];
    if (current.includes(tag)) {
      setFormData({
        ...formData,
        compatible_lifestyle_tags: current.filter(t => t !== tag),
      });
    } else {
      setFormData({
        ...formData,
        compatible_lifestyle_tags: [...current, tag],
      });
    }
  };

  const toggleOccupation = (occupation: string) => {
    const current = formData.preferred_occupations || [];
    if (current.includes(occupation)) {
      setFormData({
        ...formData,
        preferred_occupations: current.filter(o => o !== occupation),
      });
    } else {
      setFormData({
        ...formData,
        preferred_occupations: [...current, occupation],
      });
    }
  };

  const handleSave = async () => {
    // Combine all filter data including new demographic fields
    const completePreferences = {
      ...formData,
      selected_genders: selectedGenders,
      selected_nationalities: selectedNationalities,
      selected_languages: selectedLanguages,
      selected_relationship_status: selectedRelationshipStatus,
      allows_children: allowsChildren,
      smoking_habit: smokingHabit,
      drinking_habit: drinkingHabit,
      cleanliness_level: cleanlinessLevel,
      noise_tolerance: noiseTolerance,
      work_schedule: workSchedule,
      selected_dietary_preferences: selectedDietaryPreferences,
      selected_personality_traits: selectedPersonalityTraits,
      selected_interests: selectedInterests,
    };

    await updatePreferences(completePreferences);
    toast({
      title: "Filters Applied",
      description: "Client cards will refresh with your comprehensive preferences.",
    });
    onOpenChange(false);
  };

  const handleSaveAs = async () => {
    if (!filterName.trim()) {
      return;
    }

    // Combine all filter data including new demographic fields
    const completePreferences = {
      ...formData,
      selected_genders: selectedGenders,
      selected_nationalities: selectedNationalities,
      selected_languages: selectedLanguages,
      selected_relationship_status: selectedRelationshipStatus,
      allows_children: allowsChildren,
      smoking_habit: smokingHabit,
      drinking_habit: drinkingHabit,
      cleanliness_level: cleanlinessLevel,
      noise_tolerance: noiseTolerance,
      work_schedule: workSchedule,
      selected_dietary_preferences: selectedDietaryPreferences,
      selected_personality_traits: selectedPersonalityTraits,
      selected_interests: selectedInterests,
    };

    await saveFilter({
      name: filterName,
      category: 'client',
      mode: 'discovery',
      filters: completePreferences,
      listing_types: selectedListingTypes,
      client_types: selectedClientTypes,
      min_budget: formData.min_budget,
      max_budget: formData.max_budget,
      min_age: formData.min_age,
      max_age: formData.max_age,
      lifestyle_tags: formData.compatible_lifestyle_tags,
      preferred_occupations: formData.preferred_occupations,
      allows_pets: formData.allows_pets,
      allows_smoking: formData.allows_smoking,
      allows_parties: formData.allows_parties,
      requires_employment_proof: formData.requires_employment_proof,
      requires_references: formData.requires_references,
      min_monthly_income: formData.min_monthly_income,
      // New demographic fields (comment out invalid fields)
      // selected_genders: selectedGenders,
      // selected_nationalities: selectedNationalities,
      // selected_languages: selectedLanguages,
      // selected_relationship_status: selectedRelationshipStatus,
      // allows_children: allowsChildren,
      // smoking_habit: smokingHabit,
      // drinking_habit: drinkingHabit,
      // cleanliness_level: cleanlinessLevel,
      // noise_tolerance: noiseTolerance,
      // work_schedule: workSchedule,
      // selected_dietary_preferences: selectedDietaryPreferences,
      // selected_personality_traits: selectedPersonalityTraits,
      // selected_interests: selectedInterests,
    });

    await updatePreferences(completePreferences);
    toast({
      title: "Filter Saved!",
      description: `"${filterName}" saved successfully with comprehensive preferences.`,
    });
    setFilterName('');
    setShowSaveAs(false);
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{
              type: 'spring',
              damping: 35,
              stiffness: 400,
              mass: 0.8,
            }}
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
          >
            <DialogContent className="bg-white max-w-2xl w-[calc(100vw-2rem)] sm:w-[95vw] h-[calc(100vh-4rem)] sm:h-[85vh] max-h-[90vh] flex flex-col p-0" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
          <DialogTitle className="text-xl sm:text-2xl">Client Discovery Preferences</DialogTitle>
          <p className="text-sm sm:text-base text-muted-foreground">Set your preferences to improve Smart Match recommendations</p>
          <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> All active clients will always be visible. These filters help prioritize matches based on your preferences.
            </p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="space-y-6">
          {/* Interest Type Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Interest Type</Label>
            <p className="text-sm text-muted-foreground">What are clients looking for?</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'rent', label: 'Rent Only' },
                { value: 'buy', label: 'Buy Only' },
                { value: 'both', label: 'Rent or Buy' },
              ].map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedInterestTypes.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 text-xs sm:text-sm py-2 px-4"
                  onClick={() => {
                    if (selectedInterestTypes.includes(option.value)) {
                      setSelectedInterestTypes(selectedInterestTypes.filter(t => t !== option.value));
                    } else {
                      setSelectedInterestTypes([option.value]);
                    }
                  }}
                >
                  {option.label}
                  {selectedInterestTypes.includes(option.value) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Looking For Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Looking For</Label>
            <p className="text-sm text-muted-foreground">What type of clients are you looking for?</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedClientTypes.includes(option.value);
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedClientTypes(selectedClientTypes.filter(t => t !== option.value));
                      } else {
                        setSelectedClientTypes([...selectedClientTypes, option.value]);
                      }
                    }}
                  >
                    {option.label}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Listing Types Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Listings</Label>
            <p className="text-sm text-muted-foreground">What do you have available to rent/sell?</p>
            <div className="flex flex-wrap gap-2">
              {LISTING_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedListingTypes.includes(option.value);
                return (
                  <Badge
                    key={option.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedListingTypes(selectedListingTypes.filter(t => t !== option.value));
                      } else {
                        setSelectedListingTypes([...selectedListingTypes, option.value]);
                      }
                    }}
                  >
                    {option.label}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Budget Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Budget Range</Label>
            <p className="text-sm text-muted-foreground">Select expected client budget for rentals</p>
            <div className="flex flex-wrap gap-2">
              {OWNER_BUDGET_RANGES.map((range) => {
                const isSelected = selectedBudgetRange === range.value;
                return (
                  <Badge
                    key={range.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedBudgetRange('');
                        setFormData({ ...formData, min_budget: undefined, max_budget: undefined });
                      } else {
                        setSelectedBudgetRange(range.value);
                        setFormData({ ...formData, min_budget: range.min, max_budget: range.max });
                      }
                    }}
                  >
                    {range.label}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Age Range</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Min Age</Label>
                <Input
                  type="number"
                  min="18"
                  max="100"
                  className="text-base"
                  value={formData.min_age || 18}
                  onChange={(e) => setFormData({ ...formData, min_age: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Max Age</Label>
                <Input
                  type="number"
                  min="18"
                  max="100"
                  className="text-base"
                  value={formData.max_age || 65}
                  onChange={(e) => setFormData({ ...formData, max_age: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Demographic Preferences Section */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-red-50 to-red-50 rounded-lg border border-red-200">
            <Label className="text-base font-semibold text-red-900">Demographic Preferences</Label>
            <p className="text-sm text-red-700">
              These filters help match you with compatible clients. All selections are optional and used only for improving match quality.
            </p>
          </div>

          {/* Gender Preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Gender Preference</Label>
            <p className="text-sm text-muted-foreground">Select all genders you're open to working with</p>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((gender) => {
                const isSelected = selectedGenders.includes(gender);
                return (
                  <Badge
                    key={gender}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (gender === 'Any Gender') {
                        setSelectedGenders(['Any Gender']);
                      } else {
                        const filtered = selectedGenders.filter(g => g !== 'Any Gender');
                        if (isSelected) {
                          const newSelection = filtered.filter(g => g !== gender);
                          setSelectedGenders(newSelection.length === 0 ? ['Any Gender'] : newSelection);
                        } else {
                          setSelectedGenders([...filtered, gender]);
                        }
                      }
                    }}
                  >
                    {gender}
                    {isSelected && gender !== 'Any Gender' && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Nationality Preference */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nationality Preference</Label>
            <p className="text-sm text-muted-foreground">Select nationalities you prefer (optional, for cultural matching)</p>
            <div className="flex flex-wrap gap-2">
              {NATIONALITY_OPTIONS.map((nationality) => {
                const isSelected = selectedNationalities.includes(nationality);
                return (
                  <Badge
                    key={nationality}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (nationality === 'Any Nationality') {
                        setSelectedNationalities(['Any Nationality']);
                      } else {
                        const filtered = selectedNationalities.filter(n => n !== 'Any Nationality');
                        if (isSelected) {
                          const newSelection = filtered.filter(n => n !== nationality);
                          setSelectedNationalities(newSelection.length === 0 ? ['Any Nationality'] : newSelection);
                        } else {
                          setSelectedNationalities([...filtered, nationality]);
                        }
                      }
                    }}
                  >
                    {nationality}
                    {isSelected && nationality !== 'Any Nationality' && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Languages Spoken */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Languages Spoken</Label>
            <p className="text-sm text-muted-foreground">Select languages your ideal client speaks</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((language) => {
                const isSelected = selectedLanguages.includes(language);
                return (
                  <Badge
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedLanguages(selectedLanguages.filter(l => l !== language));
                      } else {
                        setSelectedLanguages([...selectedLanguages, language]);
                      }
                    }}
                  >
                    {language}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Relationship Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Relationship Status</Label>
            <p className="text-sm text-muted-foreground">Who will be renting/buying?</p>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_STATUS_OPTIONS.map((status) => {
                const isSelected = selectedRelationshipStatus.includes(status);
                return (
                  <Badge
                    key={status}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (status === 'Any Status') {
                        setSelectedRelationshipStatus(['Any Status']);
                      } else {
                        const filtered = selectedRelationshipStatus.filter(s => s !== 'Any Status');
                        if (isSelected) {
                          const newSelection = filtered.filter(s => s !== status);
                          setSelectedRelationshipStatus(newSelection.length === 0 ? ['Any Status'] : newSelection);
                        } else {
                          setSelectedRelationshipStatus([...filtered, status]);
                        }
                      }
                    }}
                  >
                    {status}
                    {isSelected && status !== 'Any Status' && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Children */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Children</Label>
            <p className="text-sm text-muted-foreground">Are you open to clients with children?</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: null, label: 'No Preference' },
                { value: true, label: 'Allows Children' },
                { value: false, label: 'No Children' },
              ].map((option) => (
                <Button
                  key={String(option.value)}
                  variant={allowsChildren === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAllowsChildren(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Lifestyle Tags */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Compatible Lifestyles</Label>
            <div className="flex flex-wrap gap-2">
              {LIFESTYLE_OPTIONS.map((tag) => {
                const isSelected = (formData.compatible_lifestyle_tags || []).includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => toggleLifestyleTag(tag)}
                  >
                    {tag}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Preferred Occupations */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Occupations</Label>
            <div className="flex flex-wrap gap-2">
              {OCCUPATION_OPTIONS.map((occupation) => {
                const isSelected = (formData.preferred_occupations || []).includes(occupation);
                return (
                  <Badge
                    key={occupation}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => toggleOccupation(occupation)}
                  >
                    {occupation}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Lifestyle Habits Section */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <Label className="text-base font-semibold text-blue-900">Lifestyle Habits</Label>
            <p className="text-sm text-blue-700">
              Detailed preferences for client lifestyle and habits
            </p>
          </div>

          {/* Smoking Habits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Smoking Habits</Label>
            <p className="text-sm text-muted-foreground">What smoking habits are acceptable?</p>
            <div className="flex flex-wrap gap-2">
              {SMOKING_HABITS.map((habit) => (
                <Button
                  key={habit}
                  variant={smokingHabit === habit ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSmokingHabit(habit)}
                >
                  {habit}
                </Button>
              ))}
            </div>
          </div>

          {/* Drinking Habits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Drinking Habits</Label>
            <p className="text-sm text-muted-foreground">What drinking habits are acceptable?</p>
            <div className="flex flex-wrap gap-2">
              {DRINKING_HABITS.map((habit) => (
                <Button
                  key={habit}
                  variant={drinkingHabit === habit ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrinkingHabit(habit)}
                >
                  {habit}
                </Button>
              ))}
            </div>
          </div>

          {/* Cleanliness Level */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Cleanliness Standard</Label>
            <p className="text-sm text-muted-foreground">Expected cleanliness level</p>
            <div className="flex flex-wrap gap-2">
              {CLEANLINESS_LEVELS.map((level) => (
                <Button
                  key={level}
                  variant={cleanlinessLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCleanlinessLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Noise Tolerance */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Noise Tolerance</Label>
            <p className="text-sm text-muted-foreground">Acceptable noise level</p>
            <div className="flex flex-wrap gap-2">
              {NOISE_TOLERANCE.map((level) => (
                <Button
                  key={level}
                  variant={noiseTolerance === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNoiseTolerance(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Work Schedule */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Work Schedule</Label>
            <p className="text-sm text-muted-foreground">Preferred client work schedule</p>
            <div className="flex flex-wrap gap-2">
              {WORK_SCHEDULES.map((schedule) => (
                <Button
                  key={schedule}
                  variant={workSchedule === schedule ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWorkSchedule(schedule)}
                >
                  {schedule}
                </Button>
              ))}
            </div>
          </div>

          {/* Property Rules (Kept for backward compatibility) */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Additional Property Rules</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="allows-pets">Allows Pets</Label>
                <Switch
                  id="allows-pets"
                  checked={formData.allows_pets ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, allows_pets: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allows-parties">Allows Parties</Label>
                <Switch
                  id="allows-parties"
                  checked={formData.allows_parties ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, allows_parties: checked })}
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Client Requirements</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="requires-employment">Requires Employment Proof</Label>
                <Switch
                  id="requires-employment"
                  checked={formData.requires_employment_proof ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_employment_proof: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requires-references">Requires References</Label>
                <Switch
                  id="requires-references"
                  checked={formData.requires_references ?? false}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_references: checked })}
                />
              </div>
              <div>
                <Label htmlFor="min-income" className="text-sm text-muted-foreground">Minimum Monthly Income</Label>
                <Input
                  id="min-income"
                  type="number"
                  placeholder="Min monthly income $"
                  className="text-base"
                  value={formData.min_monthly_income || ''}
                  onChange={(e) => setFormData({ ...formData, min_monthly_income: Number(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          {/* Cultural & Personality Section */}
          <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <Label className="text-base font-semibold text-purple-900">Cultural & Personality</Label>
            <p className="text-sm text-purple-700">
              Match based on lifestyle preferences and personality compatibility
            </p>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Dietary Preferences</Label>
            <p className="text-sm text-muted-foreground">Dietary needs or preferences to consider</p>
            <div className="flex flex-wrap gap-2">
              {DIETARY_PREFERENCES.map((diet) => {
                const isSelected = selectedDietaryPreferences.includes(diet);
                return (
                  <Badge
                    key={diet}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (diet === 'No Preference') {
                        setSelectedDietaryPreferences(['No Preference']);
                      } else {
                        const filtered = selectedDietaryPreferences.filter(d => d !== 'No Preference');
                        if (isSelected) {
                          const newSelection = filtered.filter(d => d !== diet);
                          setSelectedDietaryPreferences(newSelection.length === 0 ? ['No Preference'] : newSelection);
                        } else {
                          setSelectedDietaryPreferences([...filtered, diet]);
                        }
                      }
                    }}
                  >
                    {diet}
                    {isSelected && diet !== 'No Preference' && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Personality Traits */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Personality Traits</Label>
            <p className="text-sm text-muted-foreground">Personality characteristics you prefer</p>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TRAITS.map((trait) => {
                const isSelected = selectedPersonalityTraits.includes(trait);
                return (
                  <Badge
                    key={trait}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPersonalityTraits(selectedPersonalityTraits.filter(t => t !== trait));
                      } else {
                        setSelectedPersonalityTraits([...selectedPersonalityTraits, trait]);
                      }
                    }}
                  >
                    {trait}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Interests & Hobbies */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Interests & Hobbies</Label>
            <p className="text-sm text-muted-foreground">Common interests to share with clients</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_CATEGORIES.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`text-xs sm:text-sm py-2 px-4 transition-all duration-200 ${
                      isSelected
                        ? 'shadow-md'
                        : 'hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedInterests(selectedInterests.filter(i => i !== interest));
                      } else {
                        setSelectedInterests([...selectedInterests, interest]);
                      }
                    }}
                  >
                    {interest}
                    {isSelected && (
                      <X className="w-3 h-3 ml-1.5 opacity-90" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showSaveAs ? (
            <>
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSaveAs} disabled={!filterName.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save As
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveAs(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowSaveAs(true)}>
                <Save className="w-4 h-4 mr-2" />
                Save As New Filter
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Apply & Save'}
              </Button>
            </>
          )}
            </DialogFooter>
          </DialogContent>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
}