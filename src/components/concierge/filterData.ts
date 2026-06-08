import { Bike, Building2, CarFront, Key, Search, Wallet, Wrench } from 'lucide-react';
import type { QuickFilterCategory } from '@/types/filters';

export interface FilterOption {
  label: string;
  prompt: string;
}

export interface FilterCategory {
  label: string;
  icon: React.ElementType;
  glowColor: string;
  category: QuickFilterCategory | null;
  options: FilterOption[];
}

export const FILTERS: FilterCategory[] = [
  {
    label: 'Properties',
    icon: Building2,
    glowColor: '#f97316',
    category: 'property',
    options: [
      { label: 'All Rentals', prompt: 'Show me all rental properties' },
      { label: 'Houses', prompt: 'Show me available houses' },
      { label: 'Apartments', prompt: 'Find apartments for rent' },
      { label: 'Studios', prompt: 'Show me studios' },
      { label: 'Penthouse', prompt: 'Find penthouses' },
      { label: 'Loft', prompt: 'Show me lofts' },
      { label: 'Cabin', prompt: 'Find cabins' },
      { label: 'Land', prompt: 'Find land for sale' },
      { label: 'Commercial', prompt: 'Show me commercial properties' },
      { label: 'Vacation', prompt: 'Find vacation rentals' },
      { label: 'Luxury', prompt: 'Show luxury properties' },
      { label: 'Cheapest', prompt: 'Show cheapest properties' },
    ],
  },
  {
    label: 'Workers',
    icon: Wrench,
    glowColor: '#3b82f6',
    category: 'services',
    options: [
      { label: 'Cleaning', prompt: 'Find me cleaning workers' },
      { label: 'Maintenance', prompt: 'Find maintenance workers' },
      { label: 'Construction', prompt: 'Find construction workers' },
      { label: 'Electrician', prompt: 'Find an electrician' },
      { label: 'Plumber', prompt: 'Find a plumber' },
      { label: 'Driver', prompt: 'Find a private driver' },
      { label: 'Nanny', prompt: 'Find a nanny or babysitter' },
      { label: 'Gardener', prompt: 'Find a gardener' },
      { label: 'Cook', prompt: 'Find a cook or chef' },
      { label: 'Tutor', prompt: 'Find a tutor' },
      { label: 'Wellness', prompt: 'Find massage and wellness' },
      { label: 'All Workers', prompt: 'Show me all workers and services' },
    ],
  },
  {
    label: 'Motorcycles',
    icon: CarFront,
    glowColor: '#ef4444',
    category: 'motorcycle',
    options: [
      { label: 'For Sale', prompt: 'Find motorcycles for sale' },
      { label: 'Cheapest', prompt: 'Show cheapest motorcycles' },
      { label: 'New Listings', prompt: 'Show newest motorcycle listings' },
      { label: 'Near Me', prompt: 'Find motorcycles near me' },
    ],
  },
  {
    label: 'Bicycles',
    icon: Bike,
    glowColor: '#10b981',
    category: 'bicycle',
    options: [
      { label: 'For Sale', prompt: 'Find bicycles for sale' },
      { label: 'Cheapest', prompt: 'Show cheapest bicycles' },
      { label: 'New Listings', prompt: 'Show new bicycle listings' },
      { label: 'Near Me', prompt: 'Find bicycles near me' },
    ],
  },
  {
    label: 'Buyers',
    icon: Wallet,
    glowColor: '#a855f7',
    category: 'buyers',
    options: [
      { label: 'Looking for Houses', prompt: 'Find people looking to buy houses' },
      { label: 'Looking for Land', prompt: 'Find people looking to buy land' },
      { label: 'Looking for Vehicles', prompt: 'Find people looking to buy vehicles' },
      { label: 'All Buyers', prompt: 'Show me all buyers' },
    ],
  },
  {
    label: 'Renters',
    icon: Key,
    glowColor: '#d946ef',
    category: 'renters',
    options: [
      { label: 'Looking for Apartments', prompt: 'Find people looking to rent apartments' },
      { label: 'Looking for Houses', prompt: 'Find people looking to rent houses' },
      { label: 'Looking for Rooms', prompt: 'Find people looking for rooms' },
      { label: 'All Renters', prompt: 'Show me all renters' },
    ],
  },
  {
    label: 'Seekers',
    icon: Search,
    glowColor: '#06b6d4',
    category: 'hire',
    options: [
      { label: 'Find Services', prompt: 'Find people looking for services' },
      { label: 'Find Workers', prompt: 'Find people looking to hire workers' },
      { label: 'Find Roommates', prompt: 'Find people looking for roommates' },
      { label: 'Find Friends', prompt: 'Find people looking for friends' },
      { label: 'All Seekers', prompt: 'Show me everyone looking for something' },
    ],
  },
];
