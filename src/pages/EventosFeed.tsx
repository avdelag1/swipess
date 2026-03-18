import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal, 
  ChevronLeft, Heart, 
  Waves, Trees, Music, Utensils, Ticket, 
  ArrowUpRight, Check, ChevronRight, 
  Eye, Users, MessageSquare, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { EventGroupChat } from '@/components/EventGroupChat';

// ── TYPES ────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  event_date: string | null;
  location: string | null;
  location_detail: string | null;
  organizer_name: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
  is_promo?: boolean;
}

type SortOrder = 'upcoming' | 'newest';

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_EVENTS: EventItem[] = [
  // --- POSTERS (MIXED CATEGORIES) ---
  {
    id: 'poster-1',
    title: 'OFF-WHITE BEACH CLUB',
    description: 'A conceptual sensory experience. Fashion meets the ocean breeze with experimental soundscapes and minimalist aesthetics.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paraiso Beach',
    location_detail: 'Exclusive Zone',
    organizer_name: 'Virgil Living',
    promo_text: 'Limited Edition Merch',
    discount_tag: 'POSTER EVENT',
    is_free: false,
    price_text: '$150 USD'
  },
  {
    id: 'poster-2',
    title: 'TULUM TECHNO TECH',
    description: 'Industrial beats in raw nature. A fusion of light, sound, and the primal energy of the Mayan jungle.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=90',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'The Bunker',
    location_detail: 'Deep Jungle',
    organizer_name: 'Sonic Rituals',
    promo_text: 'Secret Lineup',
    discount_tag: 'POSTER EDITION',
    is_free: false,
    price_text: '$90 USD'
  },
  {
    id: 'poster-3',
    title: 'DIOR RIVIERA SUNDOWN',
    description: 'A couture journey on the sands of Tulum. Signature cocktails, bespoke music, and the ultimate luxury sundowner experience.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=1200&q=90',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ahau Beach',
    location_detail: 'Beach Road',
    organizer_name: 'House of Dior',
    promo_text: 'Invitation Only',
    discount_tag: 'EXCLUSIVE POSTER',
    is_free: false,
    price_text: 'GALA ENTRY'
  },
  {
    id: 'poster-4',
    title: 'MAYA WARRIOR RITUAL',
    description: 'The return of the legendary bus. Experience the primal energy of the Mayan soul through cutting-edge light and sound design.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Deep Tulum',
    location_detail: 'Secret Location',
    organizer_name: 'Maya Warrior',
    promo_text: 'Proceeds to Charity',
    discount_tag: 'ICONIC EVENT',
    is_free: false,
    price_text: '$120 USD'
  },
  {
    id: 'poster-5',
    title: 'PRADA MAYAN ESCAPE',
    description: 'Minimalist luxury meets tropical brutalism. A curated weekend of art, fashion previews, and experimental soundscapes.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1534120247760-c44c3e4a62f1?w=1200&q=90',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Sian K’aan',
    location_detail: 'Eco Reserve',
    organizer_name: 'Prada Group',
    promo_text: 'Eco-conscious Luxury',
    discount_tag: 'COLLECTOR POSTER',
    is_free: false,
    price_text: 'INVITE ONLY'
  },
  {
    id: 'swipess-promo-1',
    title: 'PROMOTE YOUR BRAND HERE',
    description: 'Reach high-end clients in Tulum and beyond. Swipess puts your events and business in front of the elite community of owners and explorers.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=90',
    event_date: null,
    location: 'Global Placement',
    location_detail: 'Everywhere in App',
    organizer_name: 'Swipess Ads',
    promo_text: 'Contact for Pricing',
    discount_tag: 'BECOME A SPONSOR',
    is_free: false,
    price_text: 'ADVERTISE',
    is_promo: true
  },
  // --- JUNGLE (5) ---
  {
    id: 'jungle-1',
    title: 'MONKEY SANCTUARY EXPEDITION',
    description: 'Private tour of the Mayan spider monkey reserve. Expert guides, wildlife photography, and jungle breakfast.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Sian K’aan South',
    location_detail: 'Eco Gate',
    organizer_name: 'Wild Tulum',
    promo_text: 'Family Friendly',
    discount_tag: 'NATURE PICK',
    is_free: false,
    price_text: '$65 USD'
  },
  {
    id: 'jungle-2',
    title: 'ANCESTRAL FIRE CEREMONY',
    description: 'Spiritual night journey. Traditional Mayan drums, copal ritual, and sacred cacao in the heart of the reserve.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=1200&q=90',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Holistika Jungle',
    location_detail: 'The Fire Pit',
    organizer_name: 'Sacred Maya',
    promo_text: 'Includes Cacao',
    discount_tag: 'SOUL RITUAL',
    is_free: false,
    price_text: '$40 USD'
  },
  {
    id: 'jungle-3',
    title: 'BIOLUMINESCENT LAGOON TOUR',
    description: 'Night kayaking through glowing lagoons. Experience the magic of bioluminescence under the stars.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Sian K’aan Lagoon',
    location_detail: 'Dock 4',
    organizer_name: 'Eco Nautic',
    promo_text: 'New Moon Special',
    discount_tag: 'NIGHT MAGIC',
    is_free: false,
    price_text: '$110 USD'
  },
  {
    id: 'jungle-4',
    title: 'CENOTE WELLNESS RETREAT',
    description: 'Sound healing and guided meditation deep in a sacred cenote. A morning of absolute peace and connection.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=1200&q=90',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Cenote Corazon',
    location_detail: 'Aldea Zama North',
    organizer_name: 'Healing Hands',
    promo_text: 'Early bird 15% OFF',
    discount_tag: 'Zen Experience',
    is_free: false,
    price_text: '$45 USD'
  },
  {
    id: 'jungle-5',
    title: 'NOMAD YOGA SERIES',
    description: 'Vinyasa flow under the jungle canopy. Holistic breathwork and superfood brunch with fellow nomads.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=90',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Sanctuary tulum',
    location_detail: 'Holistic Zone',
    organizer_name: 'The Nomad',
    promo_text: 'Mats provided',
    discount_tag: 'Community Vibe',
    is_free: true,
    price_text: 'Free Entry'
  },
  // --- FOOD (5) ---
  {
    id: 'food-1',
    title: 'TACO TOUR: UNDERGROUND STARS',
    description: 'Journey to the town’s hidden gems. Curated tasting of the most authentic tacos in the Riviera.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Tulum Pueblo',
    location_detail: 'Main Plaza',
    organizer_name: 'Mesa Maya',
    promo_text: 'Vegetarian Options',
    discount_tag: 'LOCAL GEMS',
    is_free: false,
    price_text: '$35 USD'
  },
  {
    id: 'food-2',
    title: 'HARTWOOD JUNGLE BBQ',
    description: 'Wood-fired seasonal menu. Organic ingredients, roaring fires, and a night of rustic elegance.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=90',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Hartwood',
    location_detail: 'Jungle Path',
    organizer_name: 'Chef Eric',
    promo_text: 'Reservation Only',
    discount_tag: 'ICONIC DINING',
    is_free: false,
    price_text: 'À LA CARTE'
  },
  {
    id: 'food-3',
    title: 'MEZCAL LABORATORY',
    description: 'Bespoke tasting and blending class. Discover the history and craft of Mexico’s finest spirit.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad03?w=1200&q=90',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Mezcaleria Girtano',
    location_detail: 'Back Bar',
    organizer_name: 'Maestro Mezcalero',
    promo_text: 'Take home a bottle',
    discount_tag: 'CRAFT CLASS',
    is_free: false,
    price_text: '$75 USD'
  },
  {
    id: 'food-4',
    title: 'Kin Toh: Nest Dining',
    description: 'Dining in the treetops. Panoramic views of the jungle canopy at sunset. Mayan-fusion haute cuisine.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Azulik',
    location_detail: 'Main Tower',
    organizer_name: 'Azulik Culinary',
    promo_text: 'Reservation required',
    discount_tag: 'Luxury Dining',
    is_free: false,
    price_text: 'Min Spend $250'
  },
  {
    id: 'food-5',
    title: 'Arca Chef Residency',
    description: ' Michelin guest chefs fire-cooking delicacies in an open-air jungle setting. Rare Mexican wine pairing.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1414235077428-33b07147ee27?w=1200&q=90',
    event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Arca',
    location_detail: 'Beach Road',
    organizer_name: 'Arca Collective',
    promo_text: '7-Course Tasting',
    discount_tag: 'EPICUREAN PICK',
    is_free: false,
    price_text: '$200 USD'
  },
  // --- PROMO (5) ---
  {
    id: 'promo-1',
    title: 'SUSTAINABLE DESIGN WEEK',
    description: 'Showcase of eco-brutalism and local craftsmanship. Interactive workshops and design previews.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=90',
    event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Design Center',
    location_detail: 'Aldea Zama',
    organizer_name: 'Tulum Collective',
    promo_text: 'Free Workshops',
    discount_tag: 'CRAFT PROMO',
    is_free: true,
    price_text: 'FREE ENTRY'
  },
  {
    id: 'promo-2',
    title: 'GUCCI COSMO TULUM',
    description: 'Fusion of Italian fashion and Mayan astrology. Digital art installations and beats.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=90',
    event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Holistika',
    location_detail: 'The Dome',
    organizer_name: 'Gucci Global',
    promo_text: 'VR Experience included',
    discount_tag: 'LUXURY PROMO',
    is_free: false,
    price_text: '$300 USD'
  },
  {
    id: 'promo-3',
    title: 'Sian Ka’an Eco Expo',
    description: 'Secret biosphere expo. Photography and expert talks on sustainability.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=90',
    event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Centro Cultural',
    location_detail: 'Town Square',
    organizer_name: 'Earth Tulum',
    promo_text: 'Support local artists',
    discount_tag: 'Eco Friendly',
    is_free: true,
    price_text: 'Donation'
  },
  {
    id: 'promo-4',
    title: 'APPLE RIVIERA KEYNOTE',
    description: 'Experience Vision Pro in the jungle. Demos and developer workshops.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=90',
    event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Digital Nomad Hub',
    location_detail: 'Main Hall',
    organizer_name: 'Apple Inc.',
    promo_text: 'Registration Required',
    discount_tag: 'TECH PROMO',
    is_free: true,
    price_text: 'FREE'
  },
  {
    id: 'promo-5',
    title: 'TESLA AUTO PILOT DRIVE',
    description: 'Test drive the Cybertruck through the jungle paths. Tech briefing and sound test.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=90',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Beach Road',
    location_detail: 'Tulum HQ',
    organizer_name: 'Tesla Energy',
    promo_text: 'Sustainable Sound',
    discount_tag: 'FUTURE PROMO',
    is_free: true,
    price_text: 'FREE'
  },
  // --- BEACH (5) ---
  {
    id: 'beach-1',
    title: 'OFF-WHITE BEACH CLUB',
    description: 'Minimalist luxury meets the ocean breeze. Fashion, beats, and the ultimate Tulum aesthetic.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Paraiso Beach',
    location_detail: 'Exclusive Zone',
    organizer_name: 'Virgil Living',
    promo_text: 'Limited Merch',
    discount_tag: 'POSTER EVENT',
    is_free: false,
    price_text: '$150 USD'
  },
  {
    id: 'beach-2',
    title: 'DIOR RIVIERA SUNDOWN',
    description: 'A couture journey on the sands. Signature cocktails and bespoke music by the sea.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?w=1200&q=90',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ahau Beach',
    location_detail: 'Beach Road',
    organizer_name: 'House of Dior',
    promo_text: 'Invite Only',
    discount_tag: 'EXCLUSIVE LUXURY',
    is_free: false,
    price_text: 'GALA ENTRY'
  },
  {
    id: 'beach-3',
    title: 'ROLEX DEEP SEA GALA',
    description: 'Celebrating the mysteries of the ocean. Formal evening with charity auction.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&q=90',
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ziggys Beach',
    location_detail: 'Private Pier',
    organizer_name: 'Rolex Mexico',
    promo_text: 'Black Tie',
    discount_tag: 'LEGACY POSTER',
    is_free: false,
    price_text: 'TABLE BOOKING'
  },
  {
    id: 'beach-4',
    title: 'Bagatelle Beach Brunch',
    description: 'French Riviera vibes meet Caribbean sands. Festive brunch with live performers.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&q=90',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Bagatelle',
    location_detail: 'Beach Zone',
    organizer_name: 'Bagatelle Tulum',
    promo_text: 'Includes welcome drink',
    discount_tag: 'Trending Now',
    is_free: false,
    price_text: '$85 USD'
  },
  {
    id: 'beach-5',
    title: 'Sunset Yacht Session',
    description: 'Sail the waters on a luxury catamaran. Open bar, fresh ceviche, and house beats.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ad96a?w=1200&q=90',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Marina Puerto',
    location_detail: 'Dock B-12',
    organizer_name: 'Aqua Marine',
    promo_text: 'Max 12 people',
    discount_tag: 'EXCLUSIVE YACHT',
    is_free: false,
    price_text: '$180 USD'
  },
  // --- MUSIC ---
  {
    id: 'music-1',
    title: 'Gitano Jungle Party',
    description: 'The legendary Friday night in the jungle. Gypsy Disco vibes and artisanal mezcal.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Tulum Jungle',
    location_detail: 'Beach Road km 7.5',
    organizer_name: 'Gitano',
    promo_text: 'Tulum Residents 20% OFF',
    discount_tag: '20% Local Discount',
    is_free: false,
    price_text: '$120 USD'
  },
  {
    id: 'music-2',
    title: 'TULUM TECHNO TECH',
    description: 'Industrial beats in raw nature. Light, sound, and primal energy.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=90',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'The Bunker',
    location_detail: 'Deep Jungle',
    organizer_name: 'Sonic Rituals',
    promo_text: 'Secret Lineup',
    discount_tag: 'POSTER EDITION',
    is_free: false,
    price_text: '$90 USD'
  },
  {
    id: 'music-3',
    title: 'Hï Tulum: Black Coffee',
    description: 'Gala event at Zamna stage. Spiritual house music in the Mayan jungle arena.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=90',
    event_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Zamna Stage',
    location_detail: 'Jungle Arena',
    organizer_name: 'Hï Ibiza',
    promo_text: 'Phase 2 Tickets Live',
    discount_tag: 'Mega Event',
    is_free: false,
    price_text: '$250 USD'
  },
  {
    id: 'music-4',
    title: 'MAYA WARRIOR RITUAL',
    description: 'Return of the legendary bus. Experience the soul soul of the Riviera.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Deep Tulum',
    location_detail: 'Secret Location',
    organizer_name: 'Maya Warrior',
    promo_text: 'Charity Event',
    discount_tag: 'ICONIC EVENT',
    is_free: false,
    price_text: '$120 USD'
  },
  {
    id: 'music-5',
    title: 'Vagalume: Ritual Night',
    description: 'Electronic music rituals by the pool. Dress in your best bohemian chic.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Vagalume',
    location_detail: 'Hotel Zone',
    organizer_name: 'Rituals Group',
    promo_text: 'Dinner + Dance',
    discount_tag: 'Pool Side',
    is_free: false,
    price_text: '$80 USD'
  }
];

const LIKED_STORAGE_KEY = 'eventos_liked_ids';

function loadLikedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveLikedIds(ids: Set<string>) {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function EventosFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Preload all mock images on mount to avoid flickering
  useEffect(() => {
    MOCK_EVENTS.forEach(event => {
      if (event.image_url) {
        const img = new Image();
        img.src = event.image_url;
      }
    });
  }, []);
  const [showLiked, setShowLiked] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [chatEvent, setChatEvent] = useState<EventItem | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOrder>('upcoming');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allEvents = MOCK_EVENTS, isLoading } = useQuery({
    queryKey: ['eventos'],
    queryFn: async (): Promise<EventItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      const formatted: EventItem[] = (data || []).map((ev: any) => ({
        id: ev.id,
        title: ev.title || 'Untitled Event',
        description: ev.description || null,
        category: ev.category || 'all',
        image_url: ev.image_url || null,
        event_date: ev.event_date || null,
        location: ev.location || null,
        location_detail: ev.location_detail || null,
        organizer_name: ev.organizer_name || null,
        promo_text: ev.promo_text || null,
        discount_tag: ev.discount_tag || null,
        is_free: !!ev.is_free,
        price_text: ev.price_text || null,
      }));
      // Focus on high-quality mock data for the flagship "WOW" feel
      return [...MOCK_EVENTS, ...formatted];
    },
    staleTime: 1000 * 60 * 10,   // Events rarely change; 10min stale
    placeholderData: MOCK_EVENTS, // Show mock data instantly while fetching
  });

  const CATEGORIES = [
    { key: 'all', label: 'allEvents', icon: Sparkles },
    { key: 'beach', label: 'beachClubs', icon: Waves },
    { key: 'jungle', label: 'jungleNature', icon: Trees },
    { key: 'music', label: 'musicFiestas', icon: Music },
    { key: 'food', label: 'foodRestaurants', icon: Utensils },
    { key: 'promo', label: 'promosDiscounts', icon: Ticket },
  ];


  const handleSwipe = useCallback((id: string, _direction: 'left' | 'right') => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        triggerHaptic('medium');
      }
      saveLikedIds(next);
      return next;
    });
  }, []);

  const handleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        triggerHaptic('medium');
      }
      saveLikedIds(next);
      return next;
    });
  }, []);

  const handleOpenChat = useCallback((event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setChatEvent(event);
    setShowGroupChat(true);
  }, []);

  const filteredEvents = useMemo(() => {
    const base = allEvents
      .filter(e => {
        const matchesCat = activeCategory === 'all' || e.category === activeCategory;
        const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFree = !freeOnly || e.is_free;
        return matchesCat && matchesSearch && matchesFree;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.event_date || 0).getTime() - new Date(a.event_date || 0).getTime();
        }
        return new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime();
      });

    // INFINITY SCROLL HACK: Duplicate events if reaching the end to allow continuous scroll
    // This creates a truly endless feeling for the demo/PWA
    if (base.length > 0) {
      // 5-layer loop for truly infinite feel
      return [
        ...base, 
        ...base.map(e => ({ ...e, id: `${e.id}-loop-1` })), 
        ...base.map(e => ({ ...e, id: `${e.id}-loop-2` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-3` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-4` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-5` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-6` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-7` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-8` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-9` })),
        ...base.map(e => ({ ...e, id: `${e.id}-loop-10` }))
      ];
    }
    return base;
  }, [allEvents, activeCategory, searchQuery, freeOnly, sortBy]);

  const likedEvents = allEvents.filter(e => likedIds.has(e.id));
  const likedCount = likedIds.size;
  const activeFilterCount = (freeOnly ? 1 : 0) + (sortBy !== 'upcoming' ? 1 : 0);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollPos = scrollRef.current.scrollTop;
    const itemHeight = scrollRef.current.clientHeight;
    if (itemHeight === 0) return;
    const index = Math.round(scrollPos / itemHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      triggerHaptic('light');
    }
  }, [currentIndex]);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">
      
      {/* ── STORIES PROGRESS BAR ── */}
      <div className="absolute top-[calc(var(--safe-top)+4px)] left-0 right-0 z-[60] px-4 flex gap-1.5">
        {filteredEvents.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
            <motion.div 
              className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              initial={{ width: 0 }}
              animate={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%' 
              }}
              transition={{ 
                duration: idx === currentIndex ? 8 : 0, // 8-second auto-advance feel
                ease: "linear" 
              }}
              onAnimationComplete={() => {
                if (idx === currentIndex && currentIndex < filteredEvents.length - 1) {
                  // Pre-load next image before advancing
                  const nextEvent = filteredEvents[currentIndex + 1];
                  if (nextEvent?.image_url) {
                    const img = new Image();
                    img.src = nextEvent.image_url;
                  }
                  setCurrentIndex(prev => prev + 1);
                  // Scroll the feed to the next item
                  scrollRef.current?.scrollTo({
                    top: (currentIndex + 1) * scrollRef.current.clientHeight,
                    behavior: 'smooth'
                  });
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* ── HEADER OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none pt-[var(--safe-top)]">
        <div className="px-4 py-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t('nav.explore')}</span>
              <span className="text-sm font-black text-white italic tracking-tight">{t('eventos.title')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Liked counter */}
            {likedCount > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic('light'); setShowLiked(true); }}
                className="h-10 px-3.5 rounded-full bg-rose-500/90 backdrop-blur-xl border border-rose-400/30 flex items-center gap-1.5 text-white shadow-lg shadow-rose-500/20"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-black">{likedCount}</span>
              </motion.button>
            )}

            {/* Search toggle */}
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div
                  key="search-input"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('eventos.searchPlaceholder', 'Search events...')}
                    className="w-full h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 text-xs text-white focus:outline-none placeholder:text-white/40"
                  />
                  <X className="absolute right-3 top-2.5 w-5 h-5 text-white/60 cursor-pointer" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Filter button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => { triggerHaptic('light'); setShowFilters(true); }}
              className="relative w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{activeFilterCount}</span>
                </div>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div className="px-4 overflow-x-auto no-scrollbar pointer-events-auto mt-1">
          <div className="flex gap-2.5 pb-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full backdrop-blur-xl border transition-all flex items-center gap-2 relative overflow-hidden",
                    isActive 
                      ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.3)]" 
                      : "bg-black/30 text-white border-white/10"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="pill-background"
                      className="absolute inset-0 bg-white -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className={cn("w-3 h-3 transition-colors duration-300", isActive ? "text-primary" : "text-white/80")} />
                  <span className="text-[9px] font-black uppercase tracking-widest transition-colors duration-300">
                    {t('eventos.' + cat.label, cat.label)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── VERTICAL FEED ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {isLoading && filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse tracking-tighter">Preparing your Riviera experience...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="relative h-full">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="h-full"
                >
                  <StoryCard 
                    event={event} 
                    isActive={idx === currentIndex} 
                    isLiked={likedIds.has(event.id)}
                    onLike={handleLike}
                    onOpenChat={(e) => handleOpenChat(event, e)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/50 px-10 text-center gap-4">
            <Sparkles className="w-16 h-16 opacity-20" />
            <h3 className="text-xl font-black italic">No events found</h3>
            <p className="text-sm">Try another category or clear your filters.</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setActiveCategory('all'); setFreeOnly(false); setSortBy('upcoming'); setSearchQuery(''); }}
              className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-[11px] font-black uppercase tracking-widest"
            >
              Clear All Filters
            </motion.button>
          </div>
        )}
      </div>

      {/* ── FILTER SHEET ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-[201] bg-zinc-900 border-t border-white/10 rounded-t-[36px] px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-6"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white italic tracking-tight">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFreeOnly(false); setSortBy('upcoming'); }}
                    className="text-[11px] font-black text-orange-400 uppercase tracking-widest"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Free only toggle */}
              <div className="mb-6">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Price</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { triggerHaptic('light'); setFreeOnly(v => !v); }}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-all",
                    freeOnly
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/60"
                  )}
                >
                  <span className="text-[13px] font-bold">Free Events Only</span>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    freeOnly ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                  )}>
                    {freeOnly && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </motion.button>
              </div>

              {/* Sort order */}
              <div className="mb-8">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Sort By</p>
                <div className="flex gap-3">
                  {([
                    { key: 'upcoming', label: 'Upcoming First' },
                    { key: 'newest', label: 'Newest Added' },
                  ] as { key: SortOrder; label: string }[]).map(opt => (
                    <motion.button
                      key={opt.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { triggerHaptic('light'); setSortBy(opt.key); }}
                      className={cn(
                        "flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all",
                        sortBy === opt.key
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/60"
                      )}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFilters(false)}
                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.15em] text-[12px] shadow-xl"
              >
                {activeFilterCount > 0 ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Done'}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── LIKED EVENTS SHEET ── */}
      <AnimatePresence>
        {showLiked && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLiked(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-[201] bg-zinc-900 border-t border-white/10 rounded-t-[36px] max-h-[80vh] flex flex-col"
            >
              {/* Handle + header */}
              <div className="flex-shrink-0 px-6 pt-5 pb-4">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                    <h3 className="text-xl font-black text-white italic">Liked Events</h3>
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                      <span className="text-[10px] font-black text-rose-400">{likedCount}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowLiked(false)} aria-label="Close liked events" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/80" />
                  </button>
                </div>
              </div>

              {/* Liked events list */}
              <div className="flex-1 overflow-y-auto px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-3 no-scrollbar">
                {likedEvents.length === 0 ? (
                  <div className="py-16 flex flex-col items-center gap-4 text-white/30">
                    <Heart className="w-12 h-12" />
                    <p className="text-sm font-medium">No liked events yet</p>
                  </div>
                ) : (
                  likedEvents.map(event => (
                    <motion.div
                      key={event.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowLiked(false); navigate(`/explore/eventos/${event.id}`); }}
                      className="group relative flex items-center gap-4 p-4 rounded-[2.5rem] bg-white/5 border border-white/8 cursor-pointer active:bg-white/10 transition-all hover:border-white/20"
                    >
                      <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-2xl">
                        <img
                          src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200&q=60'}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-[14px] font-black text-white truncate uppercase italic tracking-tight">{event.title}</h4>
                           <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400 fill-current" />
                              <span className="text-[10px] font-black text-amber-400">4.0</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-white/30" />
                            <span className="text-[10px] font-bold text-white/50 truncate uppercase tracking-widest">{event.location || 'Tulum'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-emerald-400/60" />
                            <span className="text-[10px] font-black text-emerald-400/80 uppercase">84+</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest italic leading-none">
                             Top Match
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 transition-colors">
                         <ChevronRight className="w-5 h-5" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <EventGroupChat 
        isOpen={showGroupChat}
        onClose={() => setShowGroupChat(false)}
        eventTitle={chatEvent?.title || ''}
        eventImage={chatEvent?.image_url || undefined}
      />
    </div>
  );
}

// ── STORY CARD ────────────────────────────────────────────────────────────────

function StoryCard({ 
  event, 
  isActive,
  isLiked,
  onLike,
  onOpenChat
}: { 
  event: EventItem, 
  isActive: boolean,
  isLiked: boolean,
  onLike: (id: string) => void,
  onOpenChat: (e: React.MouseEvent) => void
}) {
  const navigate = useNavigate();
  const isPoster = event.id.startsWith('poster');

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/explore/eventos/${event.id}`);
  };

  return (
    <div className="relative h-full w-full snap-start snap-always shrink-0 overflow-hidden bg-zinc-950">
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0"
        animate={isActive ? { scale: 1 } : { scale: 1.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <img
          src={event.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=90'}
          className={cn(
            "w-full h-full object-cover transform-gpu",
            isPoster && "brightness-110 contrast-110"
          )}
          alt={event.title}
        />
        {/* Overlays */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        
        {/* Poster special effect: subtle floating particles or lens flare would go here */}
        {isPoster && (
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-orange-500/5 mix-blend-overlay pointer-events-none" />
        )}
      </motion.div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-[calc(1rem+68px+var(--safe-bottom))]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest">
                  {event.category}
                </span>
                {event.discount_tag && (
                  <motion.span 
                    animate={isPoster ? { 
                      boxShadow: ['0 0 0px var(--primary)', '0 0 15px var(--primary)', '0 0 0px var(--primary)']
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "px-3 py-1 rounded-full backdrop-blur-md border text-[10px] font-black uppercase tracking-widest",
                      isPoster 
                        ? "bg-primary text-white border-primary" 
                        : "bg-primary/20 border-primary/30 text-primary"
                    )}
                  >
                    {event.discount_tag}
                  </motion.span>
                )}
                <LiveHypeCounter eventId={event.id} />
              </div>
              <h2 className={cn(
                "text-4xl font-black text-white italic tracking-tighter uppercase leading-none",
                isPoster && "text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60"
              )}>
                {event.title}
              </h2>
            </div>
          </div>

          <p className="text-sm text-white/70 leading-relaxed font-medium line-clamp-3">
            {event.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">When</span>
                <span className="text-xs font-bold text-white">
                  {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Coming Soon'}
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-1">
               <AttendeeStack count={Math.floor(Math.random() * 50) + 10} />
               <div className="flex items-center gap-1.5 opacity-40 ml-1">
                  <Eye className="w-2.5 h-2.5 text-white" />
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">1.2k Views</span>
               </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDetailsClick}
              className={cn(
                "flex-[3] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-2 transition-all",
                isPoster 
                  ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white" 
                  : "bg-white text-black"
              )}
            >
              {isPoster ? 'Join Exclusive' : 'Get Tickets'} {event.price_text && `• ${event.price_text}`}
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={onOpenChat}
              className="px-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white relative active:bg-white/20 transition-all"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={onOpenChat}
              title="Open event chat"
              className="px-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white relative active:bg-white/20 transition-all"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <MessageSquare className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => onLike(event.id)}
              aria-label={isLiked ? "Unlike event" : "Like event"}
              className={cn(
                "flex-1 rounded-2xl backdrop-blur-md border flex items-center justify-center transition-all",
                isLiked 
                  ? "bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/20" 
                  : "bg-white/10 border-white/20"
              )}
            >
              <Heart className={cn("w-6 h-6", isLiked ? "fill-white text-white" : "text-white")} />
            </motion.button>
          </div>

          {/* HYPE NOTIFICATION OVERLAY (OCCASIONAL) */}
          <HypePopup isActive={isActive} />
        </motion.div>
      </div>
    </div>
  );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

/**
 * LIVE HYPE COUNTER
 * A sentient-feeling counter that fluctuates to show "living" presence.
 */
function LiveHypeCounter({ eventId }: { eventId: string }) {
  const [viewCount, setViewCount] = useState(Math.floor(Math.random() * 20) + 8);
  
  useEffect(() => {
    // Preload common neighbor images to prevent flickering in stacks
    const preloadAvatars = [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80'
    ];
    preloadAvatars.forEach(url => {
      const img = new Image();
      img.src = url;
    });

    const interval = setInterval(() => {
      setViewCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(5, Math.min(45, newCount));
      });
    }, 4000 + Math.random() * 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden relative">
      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      <span className="text-[9px] font-black text-white/90 uppercase tracking-widest tabular-nums">
        {viewCount} Active now
      </span>
      {/* Subtle sweep animation */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
        animate={{ x: ['-200%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
      />
    </div>
  );
}

/**
 * ATTENDEE STACK
 * Social proof showing profile images of "going" users.
 */
function AttendeeStack({ count = 12 }: { count?: number }) {
  const avatars = [
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {avatars.map((url, i) => (
          <div key={i} className="w-6 h-6 rounded-full border border-zinc-950 overflow-hidden bg-zinc-900 ring-1 ring-white/10">
            <img src={url} alt="User" className="w-full h-full object-cover" />
          </div>
        ))}
        <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/60">
          +{count}
        </div>
      </div>
      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Verified Going</span>
    </div>
  );
}

/**
 * HYPE POPUP
 * Occasional sentient notifications to increase FOMO/Social Proof.
 */
function HypePopup({ isActive }: { isActive: boolean }) {
  const [show, setShow] = useState(false);
  const [hypeMsg, setHypeMsg] = useState("");
  
  const MESSAGES = [
    "3 Neighbors just joined",
    "Reserved by a Verified Member",
    "Trending in Aldea Zama",
    "Almost Sold Out 🔥",
    "2 Friends are interested",
    "Top Pick for Saturday"
  ];

  useEffect(() => {
    if (!isActive) {
      setShow(false);
      return;
    }

    // Show hype message after 3 seconds of viewing
    const timer = setTimeout(() => {
      setHypeMsg(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
      setShow(true);
      
      // Auto-hide after 5 seconds
      setTimeout(() => setShow(false), 5000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 20 }}
          className="absolute -top-16 right-0 z-[100]"
        >
          <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
              {hypeMsg}
            </span>
          </div>
          {/* Subtle tail/indicator */}
          <div className="absolute top-full right-6 w-2 h-2 bg-white/10 border-r border-b border-white/20 rotate-45 -translate-y-1" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
