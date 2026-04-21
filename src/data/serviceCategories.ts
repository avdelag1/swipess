// ─── Master Service Categories Registry ───────────────────────────
// Single source of truth for all worker/service categories across the app.

export interface ServiceCategoryItem {
  value: string;
  label: string;
  icon: string;
  group: string;
}

export const SERVICE_GROUPS = [
  'Home & Property',
  'Personal Care & Wellness',
  'Child & Pet Care',
  'Transportation',
  'Culinary & Events',
  'Education & Languages',
  'Water & Adventure',
  'Creative & Tech',
  'Professional',
  'Other',
] as const;

export type ServiceGroup = typeof SERVICE_GROUPS[number];

export const SERVICE_CATEGORIES: ServiceCategoryItem[] = [
  // ── Home & Property ──
  { value: 'house_cleaner', label: 'House Cleaner / Cleaning Lady', icon: '🧹', group: 'Home & Property' },
  { value: 'handyman', label: 'Handyman / General Maintenance', icon: '🔧', group: 'Home & Property' },
  { value: 'maintenance_tech', label: 'Maintenance Technician', icon: '⚙️', group: 'Home & Property' },
  { value: 'house_painter', label: 'House Painter', icon: '🎨', group: 'Home & Property' },
  { value: 'plumber', label: 'Plumber', icon: '🔩', group: 'Home & Property' },
  { value: 'electrician', label: 'Electrician', icon: '⚡', group: 'Home & Property' },
  { value: 'gardener', label: 'Gardener / Landscaper', icon: '🌱', group: 'Home & Property' },
  { value: 'pool_cleaner', label: 'Pool Cleaner & Maintenance', icon: '🏊', group: 'Home & Property' },

  // ── Personal Care & Wellness ──
  { value: 'massage_therapist', label: 'Massage Therapist', icon: '💆', group: 'Personal Care & Wellness' },
  { value: 'yoga', label: 'Yoga Instructor', icon: '🧘', group: 'Personal Care & Wellness' },
  { value: 'meditation_coach', label: 'Meditation / Mindfulness Coach', icon: '🧠', group: 'Personal Care & Wellness' },
  { value: 'holistic_therapist', label: 'Holistic Therapist', icon: '✨', group: 'Personal Care & Wellness' },
  { value: 'personal_trainer', label: 'Personal Trainer / Fitness Coach', icon: '💪', group: 'Personal Care & Wellness' },
  { value: 'beauty', label: 'Makeup Artist & Hair Stylist', icon: '💇', group: 'Personal Care & Wellness' },
  { value: 'nutritionist', label: 'Nutritionist / Meal Prep Chef', icon: '🥗', group: 'Personal Care & Wellness' },

  // ── Child & Pet Care ──
  { value: 'nanny', label: 'Babysitter / Nanny', icon: '👶', group: 'Child & Pet Care' },
  { value: 'pet_care', label: 'Dog Sitter / Pet Sitter', icon: '🐕', group: 'Child & Pet Care' },
  { value: 'pet_groomer', label: 'Pet Groomer', icon: '🐾', group: 'Child & Pet Care' },

  // ── Transportation ──
  { value: 'driver', label: 'Chauffeur / Private Driver', icon: '🚗', group: 'Transportation' },
  { value: 'mechanic', label: 'Mechanic (Car / Moto / Bicycle)', icon: '🔧', group: 'Transportation' },

  // ── Culinary & Events ──
  { value: 'chef', label: 'Private Chef', icon: '👨‍🍳', group: 'Culinary & Events' },
  { value: 'bartender', label: 'Bartender / Mixologist', icon: '🍸', group: 'Culinary & Events' },
  { value: 'event_planner', label: 'Event Planner / Party Coordinator', icon: '🎉', group: 'Culinary & Events' },

  // ── Education & Languages ──
  { value: 'language_teacher', label: 'Language Teacher / Tutor', icon: '📚', group: 'Education & Languages' },
  { value: 'music_teacher', label: 'Music Teacher', icon: '🎵', group: 'Education & Languages' },
  { value: 'dance_instructor', label: 'Dance Instructor', icon: '💃', group: 'Education & Languages' },

  // ── Water & Adventure ──
  { value: 'scuba_instructor', label: 'Scuba Diving Instructor / Divemaster', icon: '🤿', group: 'Water & Adventure' },
  { value: 'surf_instructor', label: 'Surf Instructor', icon: '🏄', group: 'Water & Adventure' },
  { value: 'snorkeling_guide', label: 'Snorkeling Guide', icon: '🐠', group: 'Water & Adventure' },
  { value: 'sailing_instructor', label: 'Sailing / Boat Captain', icon: '⛵', group: 'Water & Adventure' },
  { value: 'fishing_guide', label: 'Fishing Guide', icon: '🎣', group: 'Water & Adventure' },

  // ── Creative & Tech ──
  { value: 'photographer', label: 'Photographer', icon: '📷', group: 'Creative & Tech' },
  { value: 'videographer', label: 'Videographer / Drone Operator', icon: '🎬', group: 'Creative & Tech' },
  { value: 'graphic_designer', label: 'Graphic Designer', icon: '🖌️', group: 'Creative & Tech' },
  { value: 'it_support', label: 'IT Support / Computer Repair', icon: '💻', group: 'Creative & Tech' },

  // ── Professional ──
  { value: 'translator', label: 'Translator / Interpreter', icon: '🌐', group: 'Professional' },
  { value: 'accountant', label: 'Accountant / Bookkeeper', icon: '📊', group: 'Professional' },
  { value: 'security', label: 'Security Guard', icon: '🛡️', group: 'Professional' },

  // ── Other ──
  { value: 'other', label: 'Other Service', icon: '✨', group: 'Other' },
] as const;

// ─── Subspecialties ───────────────────────────────────────────────
// When a category is selected, show these as checkboxes stored in the `skills` JSON array.

export const SERVICE_SUBSPECIALTIES: Record<string, string[]> = {
  massage_therapist: ['Swedish', 'Deep Tissue', 'Thai', 'Sports', 'Hot Stone', 'Aromatherapy', 'Reflexology', 'Couples'],
  holistic_therapist: ['Reiki', 'Energy Healing', 'Acupuncture', 'Crystal Healing', 'Sound Therapy'],
  language_teacher: ['English', 'Spanish', 'French', 'German', 'Italian', 'Chinese', 'Portuguese', 'Mayan'],
  music_teacher: ['Guitar', 'Piano', 'Singing', 'Drums', 'Violin', 'Ukulele'],
  dance_instructor: ['Salsa', 'Bachata', 'Zumba', 'Tango', 'Contemporary', 'Hip-Hop'],
  mechanic: ['Car', 'Motorcycle', 'Bicycle', 'Electric Vehicle'],
  maintenance_tech: ['Pools', 'AC / HVAC', 'Gates & Doors', 'Appliances'],
  personal_trainer: ['Strength Training', 'CrossFit', 'HIIT', 'Boxing', 'Swimming', 'Calisthenics'],
  chef: ['Mexican Cuisine', 'Italian', 'Asian Fusion', 'Vegan / Plant-Based', 'BBQ / Grill', 'Pastry & Baking'],
  photographer: ['Family', 'Events', 'Real Estate', 'Portrait', 'Product', 'Wedding'],
  beauty: ['Hair Styling', 'Makeup', 'Nails', 'Facial Treatments', 'Bridal'],
  bartender: ['Cocktails', 'Wine Service', 'Mixology Classes', 'Event Bar Setup'],
  house_painter: ['Interior', 'Exterior', 'Decorative / Murals'],
  graphic_designer: ['Flyers & Posters', 'Menus', 'Social Media', 'Logos & Branding', 'Web Design'],
  it_support: ['Computer Repair', 'Phone Repair', 'Network Setup', 'Software Installation', 'Data Recovery'],
  yoga: ['Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Kundalini', 'Prenatal'],
  scuba_instructor: [
    'Discover Scuba (Intro)',
    'Open Water Diver (OWD)',
    'Advanced Open Water (AOWD)',
    'Rescue Diver',
    'Master Scuba Diver',
    'Divemaster (DM)',
    'Assistant Instructor (AI)',
    'Open Water Scuba Instructor (OWSI)',
    'IDC Staff Instructor',
    'Course Director',
    'Deep Diving Specialty',
    'Night Diving',
    'Nitrox / Enriched Air',
    'Wreck Diving',
    'Cave Diving',
    'Cavern Diving',
    'Technical Diving (Tec)',
    'Sidemount Diving',
    'Underwater Photography',
    'Search & Recovery',
    'Drift Diving',
    'Boat Diving',
    'Emergency First Response (EFR)',
  ],
  surf_instructor: ['Beginner', 'Intermediate', 'Advanced', 'Longboard', 'Shortboard', 'Stand-Up Paddle'],
  snorkeling_guide: ['Reef Tours', 'Night Snorkeling', 'Free Diving Intro', 'Marine Biology Education'],
  sailing_instructor: ['Day Sailing', 'Overnight Charters', 'ASA Certification', 'Racing'],
  fishing_guide: ['Deep Sea', 'Fly Fishing', 'Shore Fishing', 'Catch & Release', 'Spearfishing'],
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Get categories grouped by their group field */
export function getGroupedCategories(): Record<ServiceGroup, ServiceCategoryItem[]> {
  const grouped = {} as Record<ServiceGroup, ServiceCategoryItem[]>;
  for (const group of SERVICE_GROUPS) {
    grouped[group] = SERVICE_CATEGORIES.filter(c => c.group === group);
  }
  return grouped;
}

/** Find a category by value */
export function findCategory(value: string): ServiceCategoryItem | undefined {
  return SERVICE_CATEGORIES.find(c => c.value === value);
}

/** Get all category values as a flat array (for validation) */
export function getAllCategoryValues(): string[] {
  return SERVICE_CATEGORIES.map(c => c.value);
}

