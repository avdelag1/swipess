import { MatchedListing, MatchedClientProfile } from '@/hooks/smartMatching/types';

/**
 * 🚀 SWIPESS TEST REEL DATA
 * One card per category + 5 Diverse Clients for Discovery-Reel testing.
 * Verified types against useListings.tsx and useSmartClientMatching.tsx.
 */

export const MOCK_TEST_LISTINGS: MatchedListing[] = [
  {
    id: 'test-property-1',
    owner_id: 'test-owner-uuid',
    title: 'Modern Glass Penthouse',
    description: 'Breathtaking 360-degree city views with floor-to-ceiling glass walls and a private infinity pool.',
    price: 4500,
    listing_type: 'rent',
    category: 'property',
    images: ['/images/filters/property.png'],
    city: 'Cancun',
    neighborhood: 'Hotel Zone',
    amenities: ['Pool', 'Security', 'Gym', 'Terrace'],
    beds: 3,
    baths: 3,
    square_footage: 2500,
    matchPercentage: 98,
    matchReasons: ['Highly matches your luxury search', 'In your preferred location'],
    incompatibleReasons: [],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'test-moto-1',
    owner_id: 'test-owner-uuid',
    title: 'Ducati Superleggera V4',
    description: 'The world\'s only street-legal motorcycle with entire chassis structure in carbon fiber.',
    price: 85,
    listing_type: 'rent',
    category: 'motorcycle',
    images: ['/images/filters/scooter.png'],
    city: 'Playa del Carmen',
    brand: 'Ducati',
    model: 'Superleggera V4',
    matchPercentage: 95,
    matchReasons: ['High performance matching', 'Near your location'],
    incompatibleReasons: [],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'test-bike-1',
    owner_id: 'test-owner-uuid',
    title: 'Specialized S-Works Tarmac',
    description: 'The fastest bike on any road. Integrated cockpit and rider-first engineered frame.',
    price: 35,
    listing_type: 'rent',
    category: 'bicycle',
    images: ['/images/filters/bicycle.png'],
    city: 'Tulum',
    brand: 'Specialized',
    model: 'S-Works Tarmac',
    matchPercentage: 92,
    matchReasons: ['Elite cycling tier', 'Available today'],
    incompatibleReasons: [],
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: 'test-worker-1',
    owner_id: 'test-owner-uuid',
    title: 'Master Mixologist & Private Chef',
    description: 'Exquisite culinary experiences and bespoke cocktail craft for your private events.',
    price: 150,
    listing_type: 'sale', // Representing 'Service Hire'
    category: 'services',
    images: ['/images/filters/workers.png'],
    city: 'Cancun',
    skills: ['Mixology', 'Culinary Arts', 'Event Planning'],
    matchPercentage: 99,
    matchReasons: ['Expert in international cuisine', 'Verified professional'],
    incompatibleReasons: [],
    status: 'active',
    created_at: new Date().toISOString()
  }
];

export const MOCK_TEST_CLIENTS: MatchedClientProfile[] = [
  {
    id: 'client-1-uuid',
    user_id: 'client-1-user-id',
    name: 'Elena Rodriguez',
    age: 26,
    gender: 'female',
    interests: ['Architecture', 'Yoga', 'Fine Dining'],
    preferred_activities: ['Beach clubs', 'Networking'],
    location: { city: 'Cancun' },
    lifestyle_tags: ['Early Bird', 'Minimalist'],
    profile_images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800'],
    matchPercentage: 94,
    matchReasons: ['Shared interest in Architecture', 'Similar schedule'],
    incompatibleReasons: [],
    verified: true,
    city: 'Cancun'
  },
  {
    id: 'client-2-uuid',
    user_id: 'client-2-user-id',
    name: 'Marcus Chen',
    age: 31,
    gender: 'male',
    interests: ['Cycling', 'Crypto', 'Surf'],
    preferred_activities: ['Surfing', 'Night rides'],
    location: { city: 'Tulum' },
    lifestyle_tags: ['Digital Nomad', 'Vegan'],
    profile_images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800'],
    matchPercentage: 88,
    matchReasons: ['Fellow cyclist', 'In Tulum'],
    incompatibleReasons: [],
    verified: true,
    city: 'Tulum'
  },
  {
    id: 'client-3-uuid',
    user_id: 'client-3-user-id',
    name: 'Sofia Valenzuela',
    age: 24,
    gender: 'female',
    interests: ['Photography', 'Travel', 'Art'],
    preferred_activities: ['Gallery visits', 'Photo walks'],
    location: { city: 'Playa del Carmen' },
    lifestyle_tags: ['Night Owl', 'Creative'],
    profile_images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800'],
    matchPercentage: 85,
    matchReasons: ['Creative synergy', 'Matching travel goals'],
    incompatibleReasons: [],
    verified: true,
    city: 'Playa del Carmen'
  },
  {
    id: 'client-4-uuid',
    user_id: 'client-4-user-id',
    name: 'Julian Banks',
    age: 29,
    gender: 'male',
    interests: ['Tennis', 'Stocks', 'Sailing'],
    preferred_activities: ['Tennis matches', 'Sailing'],
    location: { city: 'Cancun' },
    lifestyle_tags: ['High Net Worth', 'Active'],
    profile_images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800'],
    matchPercentage: 82,
    matchReasons: ['Shared passion for tennis', 'Verified elite'],
    incompatibleReasons: [],
    verified: true,
    city: 'Cancun'
  },
  {
    id: 'client-5-uuid',
    user_id: 'client-5-user-id',
    name: 'Isabella Grant',
    age: 27,
    gender: 'female',
    interests: ['Biking', 'Cooking', 'Music'],
    preferred_activities: ['Live concerts', 'Biking tours'],
    location: { city: 'Tulum' },
    lifestyle_tags: ['Adventure Seeker', 'Foodie'],
    profile_images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800'],
    matchPercentage: 91,
    matchReasons: ['Adventure companion', 'Foodie lifestyle'],
    incompatibleReasons: [],
    verified: true,
    city: 'Tulum'
  }
];
