
/**
 * Unified constants for profile tags, interests, and intentions.
 * Used across ClientProfileDialog, OwnerProfileDialog, and OwnerClientFilterDialog
 * to ensure data consistency and correct matching.
 */

export const PROPERTY_TAGS = [
    'Looking to rent long-term', 'Short-term rental seeker', 'Interested in purchasing property',
    'Open to rent-to-own', 'Flexible lease terms', 'Corporate housing needed',
    'Family-friendly housing', 'Student accommodation',
];

export const TRANSPORTATION_TAGS = [
    'Need motorcycle rental', 'Looking to buy motorcycle', 'Bicycle enthusiast',
    'Need yacht charter', 'Interested in yacht purchase', 'Daily commuter', 'Weekend explorer',
];

export const LIFESTYLE_TAGS = [
    'Pet-friendly required', 'Eco-conscious living', 'Digital nomad', 'Fitness & wellness focused',
    'Beach lover', 'City center preference', 'Quiet neighborhood', 'Social & community-oriented',
    'Work-from-home setup', 'Minimalist lifestyle', 'Professional', 'Student', 'Family-Oriented',
    'Party-Friendly', 'Quiet', 'Social', 'Health-Conscious', 'Pet Lover', 'Eco-Friendly'
];

export const FINANCIAL_TAGS = [
    'Verified income', 'Excellent credit score', 'Landlord references available',
    'Long-term employment', 'Flexible budget',
];

export const NATIONALITY_OPTIONS = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
    'Netherlands', 'Australia', 'Brazil', 'Argentina', 'Colombia', 'India', 'China', 'Japan',
    'South Korea', 'Other',
];

export const LANGUAGE_OPTIONS = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin',
    'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch',
];

export const RELATIONSHIP_STATUS_OPTIONS = [
    'Single', 'Couple', 'Family with Children', 'Group/Roommates',
];

export const SMOKING_HABIT_OPTIONS = [
    { value: 'never', label: 'Non-Smoker' },
    { value: 'occasionally', label: 'Occasional Smoker' },
    { value: 'regularly', label: 'Regular Smoker' },
];

export const DRINKING_HABIT_OPTIONS = [
    { value: 'never', label: 'Non-Drinker' },
    { value: 'socially', label: 'Social Drinker' },
    { value: 'regularly', label: 'Regular Drinker' },
];

export const CLEANLINESS_OPTIONS = [
    { value: 'high', label: 'Very Clean' },
    { value: 'medium', label: 'Average' },
    { value: 'low', label: 'Relaxed' },
];

export const NOISE_TOLERANCE_OPTIONS = [
    { value: 'low', label: 'Very Quiet' },
    { value: 'medium', label: 'Moderate' },
    { value: 'high', label: 'Flexible' },
];

export const WORK_SCHEDULE_OPTIONS = [
    { value: 'regular', label: '9-5 Traditional' },
    { value: 'shift', label: 'Night Shift' },
    { value: 'remote', label: 'Remote Worker' },
    { value: 'flexible', label: 'Flexible Hours' },
];

/** Look up a human-readable label for a DB value in any value/label option list */
function labelFor(options: { value: string; label: string }[], dbValue: string | null | undefined): string {
    if (!dbValue) return '';
    return options.find(o => o.value === dbValue)?.label ?? dbValue;
}

export const getSmokingLabel = (v: string | null | undefined) => labelFor(SMOKING_HABIT_OPTIONS, v);
export const getDrinkingLabel = (v: string | null | undefined) => labelFor(DRINKING_HABIT_OPTIONS, v);
export const getCleanlinessLabel = (v: string | null | undefined) => labelFor(CLEANLINESS_OPTIONS, v);
export const getNoiseToleranceLabel = (v: string | null | undefined) => labelFor(NOISE_TOLERANCE_OPTIONS, v);
export const getWorkScheduleLabel = (v: string | null | undefined) => labelFor(WORK_SCHEDULE_OPTIONS, v);

export const DIETARY_OPTIONS = [
    'Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Halal', 'Kosher',
];

export const PERSONALITY_OPTIONS = [
    'Introvert', 'Extrovert', 'Ambivert', 'Early Bird', 'Night Owl', 'Highly Organized',
    'Relaxed/Casual', 'Adventurous', 'Homebody',
];

export const INTEREST_OPTIONS = [
    'Sports & Fitness', 'Arts & Culture', 'Food & Cooking', 'Travel', 'Technology & Gaming',
    'Nature & Outdoors', 'Reading & Writing', 'Music & Concerts', 'Photography',
    'Yoga & Meditation', 'Entrepreneurship', 'Volunteering',
];

export const CLIENT_INTENTION_OPTIONS = [
    { id: 'rent_property', label: 'Looking to Rent', description: 'Apartments, houses, rooms', category: 'property' },
    { id: 'buy_property', label: 'Looking to Buy', description: 'Interested in purchasing property', category: 'property' },
    { id: 'rent_motorcycle', label: 'Need Motorcycle Rental', description: 'Rent a scooter or bike', category: 'motorcycle' },
    { id: 'buy_motorcycle', label: 'Looking to Buy Moto', description: 'Purchase a motorcycle', category: 'motorcycle' },
    { id: 'rent_bicycle', label: 'Need Bicycle Rental', description: 'Daily or weekly bike rental', category: 'bicycle' },
    { id: 'hire_service', label: 'Looking to Hire', description: 'Find professionals for work', category: 'services' },
];

export const OWNER_SERVICE_OFFERING_OPTIONS = [
    { id: 'property_rental', label: 'Property Rental', description: 'Apartments, houses, condos', category: 'property' },
    { id: 'property_sale', label: 'Property for Sale', description: 'Real estate listings', category: 'property' },
    { id: 'motorcycle_rental', label: 'Motorcycle Rental', description: 'Motorcycles, scooters, ATVs', category: 'motorcycle' },
    { id: 'bicycle_rental', label: 'Bicycle Rental', description: 'Bikes, e-bikes, mountain bikes', category: 'bicycle' },
    { id: 'professional_services', label: 'Professional Services', description: 'Chef, cleaner, nanny, handyman', category: 'services' },
];

export const GENDER_OPTIONS = [
    { value: 'Any Gender', emoji: '🌍', label: 'All' },
    { value: 'Male', emoji: '👨', label: 'Men' },
    { value: 'Female', emoji: '👩', label: 'Women' },
    { value: 'Non-Binary', emoji: '🧑', label: 'Other' },
];

export const BUDGET_RANGES = [
    { value: '0-500', label: '$0-500', min: 0, max: 500 },
    { value: '500-1000', label: '$500-1K', min: 500, max: 1000 },
    { value: '1000-3000', label: '$1K-3K', min: 1000, max: 3000 },
    { value: '3000-5000', label: '$3K-5K', min: 3000, max: 5000 },
    { value: '5000+', label: '$5K+', min: 5000, max: 50000 },
];

