import { useState, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal,
  ChevronLeft, Heart,
  Waves, Trees, Music, Utensils, Ticket,
  ArrowUpRight, Check, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';

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
}

type SortOrder = 'upcoming' | 'newest';

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_EVENTS: EventItem[] = [
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
    id: 'poster-6',
    title: 'TESLA CYBER JUNGLE',
    description: 'Future meets ancient. An electronic music showcase powered entirely by solar energy in the heart of the Tulum reserve.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=90',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Solar Valley',
    location_detail: 'Jungle Outpost',
    organizer_name: 'Tesla Energy',
    promo_text: 'Sustainable Sound',
    discount_tag: 'FUTURE POSTER',
    is_free: true,
    price_text: 'FREE REGISTRATION'
  },
  {
    id: 'poster-7',
    title: 'GUCCI COSMO TULUM',
    description: 'An intergalactic fusion of Italian craftsmanship and Mayan astrology. Digital art installations and galactic beats.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=90',
    event_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Holistika',
    location_detail: 'The Dome',
    organizer_name: 'Gucci Global',
    promo_text: 'VR Experience included',
    discount_tag: 'LUXURY POSTER',
    is_free: false,
    price_text: '$300 USD'
  },
  {
    id: 'poster-8',
    title: 'ROLEX DEEP SEA GALA',
    description: 'Celebrating the mysteries of the ocean. A formal evening of exploration stories and charity auctions at the water edge.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=1200&q=90',
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ziggys Beach',
    location_detail: 'Private Pier',
    organizer_name: 'Rolex Mexico',
    promo_text: 'Black Tie Optional',
    discount_tag: 'LEGACY POSTER',
    is_free: false,
    price_text: 'TABLE BOOKING'
  },
  {
    id: 'poster-9',
    title: 'APPLE RIVIERA KEYNOTE',
    description: 'Experience the future of spatial computing in the most beautiful place on earth. Vision Pro demos and developer workshops.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=90',
    event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Digital Nomad Hub',
    location_detail: 'Main Hall',
    organizer_name: 'Apple Inc.',
    promo_text: 'Registration Required',
    discount_tag: 'TECH POSTER',
    is_free: true,
    price_text: 'FREE'
  },
  {
    id: 'mock-1',
    title: 'Gitano Jungle Party',
    description: 'The legendary Friday night in the jungle. Gypsy Disco vibes with artisanal mezcal cocktails, world-class DJs, and a mystical atmosphere that only Tulum can provide.',
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
    id: 'mock-2',
    title: 'Bagatelle Beach Brunch',
    description: 'French Riviera vibes meet the Caribbean coast. Join us for the ultimate festive brunch experience with live performers and Mediterranean cuisine.',
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
    id: 'mock-3',
    title: 'Papaya Playa Project',
    description: 'Full Moon Saturday at the legendary Papaya. A mystical journey through music and dance on the pristine sands of Tulum Beach with world-class DJs.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Papaya Playa',
    location_detail: 'Beach Road km 4.5',
    organizer_name: 'Papaya Playa Project',
    promo_text: 'Full Moon Edition',
    discount_tag: 'Iconic Venue',
    is_free: false,
    price_text: 'From $150 USD'
  },
  {
    id: 'mock-4',
    title: 'Cenote Wellness Retreat',
    description: 'A morning of rejuvenation. Sound healing, guided meditation, and a cleansing dip in a private sacred cenote tucked deep in the Mayan jungle.',
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
    id: 'mock-5',
    title: 'Sunset Yacht Session',
    description: 'Sail the Caribbean waters as the sun dips below the horizon. Open bar, fresh ceviche, and deep house beats on a 50ft luxury catamaran.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1567899378494-47b22a2ad96a?w=1200&q=90',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Marina Puerto',
    location_detail: 'Dock B-12',
    organizer_name: 'Aqua Marine',
    promo_text: 'Max 12 people',
    discount_tag: 'Exclusive Access',
    is_free: false,
    price_text: '$180 USD'
  },
  {
    id: 'mock-6',
    title: 'Kin Toh: Nest Dining',
    description: 'Elevated Mayan cuisine in the treetops. Experience a private dinner in a hanging nest with panoramic views of the Tulum jungle and the starry night.',
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
    id: 'mock-7',
    title: 'Nomad Yoga Series',
    description: 'Rise with the sun at the beach. A high-intensity Vinyasa flow followed by holistic breathwork and a community superfood breakfast.',
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
  {
    id: 'mock-8',
    title: 'Sian Ka’an Eco Expo',
    description: 'Discover the secrets of the biosphere. Photography exhibition, expert talks on sustainability, and local artisan market under the palms.',
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
    id: 'mock-9',
    title: 'Arca Chef Residency',
    description: 'Exclusive 7-course tasting menu by guest Michelin chefs. Fire-cooked delicacies paired with rare Mexican wines in an open-air jungle setting.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=90',
    event_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Arca Tulum',
    location_detail: 'Beach Road km 8.5',
    organizer_name: 'Arca Group',
    promo_text: 'Limited seating',
    discount_tag: 'Michelin Star',
    is_free: false,
    price_text: '$150 USD'
  },
  {
    id: 'mock-10',
    title: 'Vagalume: Ritual Night',
    description: 'Electronic music rituals by the pool. Dress in your best bohemian chic and join us for a night of fire shows, tribal beats, and cocktails.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=90',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Vagalume',
    location_detail: 'Hotel Zone',
    organizer_name: 'Rituals Group',
    promo_text: 'Dinner + Dance options',
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
  const [showLiked, setShowLiked] = useState(false);
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
      return formatted.length > 0 ? formatted : MOCK_EVENTS;
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
      
      {/* ── FLOATING CONTROLS ── */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none pt-[var(--safe-top)]">

        {/* Row 1: Back + action buttons */}
        <div className="flex items-center justify-between px-4 py-3 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2">
            {/* Liked counter pill */}
            {likedCount > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic('light'); setShowLiked(true); }}
                className="h-11 px-3.5 rounded-full bg-rose-500/90 backdrop-blur-xl border border-rose-400/30 flex items-center gap-1.5 text-white shadow-lg shadow-rose-500/20"
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
                  animate={{ width: 176, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('eventos.searchPlaceholder', 'Search events...')}
                    className="w-full h-11 bg-black/30 backdrop-blur-xl border border-white/20 rounded-full px-4 text-xs text-white focus:outline-none placeholder:text-white/40"
                  />
                  <X className="absolute right-3 top-3 w-4 h-4 text-white/60 cursor-pointer" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setShowSearch(true)}
                  className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Filter button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => { triggerHaptic('light'); setShowFilters(true); }}
              className="relative w-11 h-11 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white"
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

        {/* Row 2: Category filter pills */}
        <div className="px-4 overflow-x-auto no-scrollbar pointer-events-auto">
          <div className="flex gap-2 pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full backdrop-blur-xl border transition-all flex items-center gap-1.5",
                    isActive
                      ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                      : "bg-black/25 text-white border-white/10"
                  )}
                >
                  <Icon className={cn("w-3 h-3", isActive ? "text-primary" : "text-white/80")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">
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
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse">Scanning the Riviera...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event, idx) => (
            <StoryCard 
              key={event.id} 
              event={event} 
              isActive={idx === currentIndex} 
              isLiked={likedIds.has(event.id)}
              onLike={handleLike}
            />
          ))
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
                  <button
                    onClick={() => setShowLiked(false)}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white/60" />
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
                      className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/8 cursor-pointer active:bg-white/10 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200&q=60'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-black text-white truncate">{event.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className="w-3 h-3 text-white/40" />
                          <span className="text-[11px] text-white/50 truncate">{event.location || 'Tulum'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-white/40" />
                          <span className="text-[11px] text-white/50">
                            {event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD'}
                          </span>
                          {event.price_text && (
                            <span className="text-[11px] font-black text-orange-400 ml-auto">{event.price_text}</span>
                          )}
                          {event.is_free && (
                            <span className="text-[11px] font-black text-emerald-400 ml-auto">Free</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── STORY CARD ────────────────────────────────────────────────────────────────

function StoryCard({ 
  event, 
  isActive,
  isLiked,
  onLike
}: { 
  event: EventItem, 
  isActive: boolean,
  isLiked: boolean,
  onLike: (id: string) => void
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
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-[calc(2rem+var(--safe-bottom))]">
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
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Where</span>
                <span className="text-xs font-bold text-white truncate max-w-[80px]">
                  {event.location || 'Tulum'}
                </span>
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
        </motion.div>
      </div>
    </div>
  );
}
