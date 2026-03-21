import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import {
  MapPin, Calendar, Sparkles, X, SlidersHorizontal,
  ChevronLeft, Heart,
  Waves, Trees, Music, Utensils, Ticket,
  ArrowUpRight, Check, ChevronRight,
  Users, MessageSquare,
  LayoutGrid, PanelsTopLeft,
  TrendingUp, Compass, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { EventGroupChat } from '@/components/EventGroupChat';
import { useAppNavigate } from '@/hooks/useAppNavigate';

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
type ViewMode = 'discover' | 'stories';

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
  }
];

const CATEGORIES = [
  { key: 'all', label: 'allEvents', icon: Sparkles, color: '#FFD700' },
  { key: 'beach', label: 'beachClubs', icon: Waves, color: '#00BFFF' },
  { key: 'jungle', label: 'jungleNature', icon: Trees, color: '#32CD32' },
  { key: 'music', label: 'musicFiestas', icon: Music, color: '#FF4500' },
  { key: 'food', label: 'foodRestaurants', icon: Utensils, color: '#FFA500' },
  { key: 'promo', label: 'promosDiscounts', icon: Ticket, color: '#BA55D3' },
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
  } catch { /* intentionally empty */ }
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function EventosFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  const [viewMode, setViewMode] = useState<ViewMode>('stories');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, _setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [chatEvent, setChatEvent] = useState<EventItem | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOrder>('upcoming');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds);
  const _scrollRef = useRef<HTMLDivElement>(null);

  // Preload image hook
  useEffect(() => {
    MOCK_EVENTS.forEach(event => {
      if (event.image_url) {
        const img = new Image();
        img.src = event.image_url;
      }
    });
  }, []);

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
      return [...MOCK_EVENTS, ...formatted];
    },
    staleTime: 1000 * 60 * 10,
    placeholderData: MOCK_EVENTS,
  });

  const filteredEvents = useMemo(() => {
    return allEvents
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
  }, [allEvents, activeCategory, searchQuery, freeOnly, sortBy]);

  const likedCount = likedIds.size;
  const activeFilterCount = (freeOnly ? 1 : 0) + (sortBy !== 'upcoming' ? 1 : 0);

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

  return (
    <div className={cn(
      "relative w-full h-[100dvh] overflow-hidden flex flex-col font-sans transition-colors duration-500",
      isLight ? "bg-slate-50" : "bg-black"
    )}>
      
      {/* ── CUSTOM IMMERSIVE HEADER ── */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-[60] pt-[var(--safe-top)] pb-4 transition-all duration-300",
        viewMode === 'stories' ? "pointer-events-none" : "bg-transparent"
      )}>
        <div className="px-4 py-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border transition-all",
                isLight 
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                  : "bg-black/20 backdrop-blur-xl border-white/10 text-white"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex flex-col">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                isLight ? "text-slate-400" : "text-white/60"
              )}>{t('nav.explore')}</span>
              <span className={cn(
                "text-sm font-black italic tracking-tight uppercase",
                isLight ? "text-slate-900" : "text-white"
              )}>{t('eventos.title')}</span>
            </div>
          </div>

          {/* VIEW MODE TOGGLE */}
          <div className={cn(
            "flex p-1 rounded-full border transition-all h-10",
            isLight ? "bg-slate-200/50 border-slate-200" : "bg-white/5 border-white/10"
          )}>
            <button
              onClick={() => { triggerHaptic('light'); setViewMode('discover'); }}
              className={cn(
                "px-4 h-full rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                viewMode === 'discover' 
                  ? isLight ? "bg-white text-slate-900 shadow-sm" : "bg-white text-black"
                  : isLight ? "text-slate-500" : "text-white/40"
              )}
            >
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Discover</span>
            </button>
            <button
              onClick={() => { triggerHaptic('light'); setViewMode('stories'); }}
              className={cn(
                "px-4 h-full rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                viewMode === 'stories' 
                  ? isLight ? "bg-white text-slate-900 shadow-sm" : "bg-white text-black"
                  : isLight ? "text-slate-500" : "text-white/40"
              )}
            >
              <PanelsTopLeft className="w-3 h-3" />
              <span className="hidden sm:inline">Stories</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {likedCount > 0 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { triggerHaptic('light'); setShowLiked(true); }}
                className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg"
              >
                <Heart className="w-4 h-4 fill-current" />
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowFilters(true)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border transition-all relative",
                isLight 
                  ? "bg-white border-slate-200 text-slate-900 shadow-sm" 
                  : "bg-black/20 backdrop-blur-xl border-white/10 text-white"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-black text-white">{activeFilterCount}</div>}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 w-full relative">
        <AnimatePresence mode="wait">
          {viewMode === 'discover' ? (
            <motion.div
              key="discover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full overflow-y-auto no-scrollbar pt-[calc(var(--safe-top)+80px)]"
            >
              <DiscoverContent 
                events={allEvents} 
                categories={CATEGORIES} 
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                onEventClick={(id) => navigate(`/explore/eventos/${id}`)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="stories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full"
            >
              <StoriesView 
                events={filteredEvents}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                likedIds={likedIds}
                onLike={handleLike}
                onOpenChat={handleOpenChat}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── OVERLAYS ── */}
      <FilterSheet 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        freeOnly={freeOnly}
        setFreeOnly={setFreeOnly}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeFilterCount={activeFilterCount}
      />

      <LikedSheet 
        isOpen={showLiked} 
        onClose={() => setShowLiked(false)} 
        likedEvents={allEvents.filter(e => likedIds.has(e.id))}
        likedCount={likedCount}
      />

      {showGroupChat && chatEvent && (
        <EventGroupChat 
          eventId={chatEvent.id} 
          eventTitle={chatEvent.title} 
          onClose={() => setShowGroupChat(false)} 
        />
      )}
    </div>
  );
}

// ── DISCOVER CONTENT COMPONENT ────────────────────────────────────────────────

function DiscoverContent({ 
  events, 
  categories, 
  activeCategory, 
  setActiveCategory,
  onEventClick 
}: { 
  events: EventItem[], 
  categories: any[], 
  activeCategory: string,
  setActiveCategory: (val: string) => void,
  onEventClick: (id: string) => void
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { navigate } = useAppNavigate();

  const spotlightEvents = useMemo(() => events.filter(e => e.discount_tag).slice(0, 5), [events]);
  const trendingEvents = useMemo(() => events.slice(5, 11), [events]);
  const upcomingEvents = useMemo(() => events.filter(e => e.event_date).slice(0, 8), [events]);

  return (
    <div className="pb-24">
      {/* ── SPOTLIGHT (HORIZONTAL SCROLL) ── */}
      <div className="px-4 mb-10">
        <SectionHeader title="Spotlight" icon={Sparkles} actionLabel="View all" />
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 pr-10">
          {spotlightEvents.map((event) => (
            <motion.div
              key={event.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => { triggerHaptic('light'); onEventClick(event.id); }}
              className="flex-shrink-0 w-[85vw] max-w-[340px] aspect-[16/10] rounded-[2rem] overflow-hidden relative shadow-2xl"
            >
              <img src={event.image_url || ''} className="w-full h-full object-cover" alt={event.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <span className="px-2.5 py-1 rounded-full bg-primary text-white text-[9px] font-black uppercase tracking-widest mb-2 inline-block shadow-lg">
                  {event.discount_tag}
                </span>
                <h3 className="text-xl font-black text-white uppercase italic leading-none truncate">{event.title}</h3>
                <div className="flex items-center gap-2 mt-2 opacity-70">
                   <MapPin className="w-3 h-3 text-white" />
                   <span className="text-[10px] font-bold text-white uppercase tracking-wider">{event.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES (ICON GRID) ── */}
      <div className="px-4 mb-10">
        <SectionHeader title="Explore Spaces" icon={Compass} />
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <motion.button
                key={cat.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-3xl border transition-all",
                  isActive 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : isLight ? "bg-white border-slate-200 text-slate-900" : "bg-white/5 border-white/10 text-white"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center mb-2",
                  isActive ? "bg-white/20" : isLight ? "bg-slate-100" : "bg-white/10"
                )}>
                  <Icon className="w-5 h-5" style={{ color: isActive ? '#fff' : cat.color }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-center truncate w-full">
                  {t('eventos.' + cat.label, cat.label)}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── THIS WEEKEND (CARD ROW) ── */}
      <div className="px-4 mb-10">
        <SectionHeader title="This Weekend" icon={Calendar} BadgeContent="HYPE" />
        <div className="space-y-3">
          {upcomingEvents.slice(0, 4).map((event) => (
            <DiscoverListCard key={event.id} event={event} onClick={onEventClick} />
          ))}
        </div>
      </div>

      {/* ── TRENDING (GRID) ── */}
      <div className="px-4 mb-10">
        <SectionHeader title="Trending in Tulum" icon={TrendingUp} />
        <div className="grid grid-cols-2 gap-4">
           {trendingEvents.map((event) => (
             <TrendingGridCard key={event.id} event={event} onClick={onEventClick} />
           ))}
        </div>
      </div>

      {/* ── PROMO BANNER ── */}
      <div className="px-4 mb-12">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="w-full p-8 rounded-[2.5rem] bg-indigo-600 relative overflow-hidden group shadow-2xl shadow-indigo-600/30"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Host an Event?</h3>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest opacity-80 mb-6 max-w-[200px]">
              Promote your brand to the elite Swipess community.
            </p>
            <button 
              onClick={() => navigate('/explore/eventos/promote')}
              className="px-6 py-2.5 rounded-full bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
            >
              Apply now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SectionHeader({ title, icon: Icon, actionLabel, BadgeContent }: { title: string, icon?: any, actionLabel?: string, BadgeContent?: string }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        {Icon && <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", isLight ? "bg-slate-200" : "bg-white/10")}><Icon className="w-4 h-4 text-primary" /></div>}
        <div className="flex items-center gap-2">
           <h2 className={cn("text-lg font-black italic tracking-tight uppercase", isLight ? "text-slate-900" : "text-white")}>{title}</h2>
           {BadgeContent && <span className="px-1.5 py-0.5 rounded bg-orange-500 text-[8px] font-black text-white tracking-widest">{BadgeContent}</span>}
        </div>
      </div>
      {actionLabel && (
        <button className={cn("text-[9px] font-black uppercase tracking-widest opacity-50 transition-opacity hover:opacity-100", isLight ? "text-slate-900" : "text-white")}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DiscoverListCard({ event, onClick }: { event: EventItem, onClick: (id: string) => void }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => { triggerHaptic('light'); onClick(event.id); }}
      className={cn(
        "relative w-full p-4 rounded-3xl border flex items-center gap-4 transition-all group overflow-hidden",
        isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/5 border-white/10"
      )}
    >
      <div className="absolute inset-0 bg-primary/0 group-active:bg-primary/5 transition-colors" />
      <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
        <img src={event.image_url || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[8px] font-black text-primary uppercase tracking-widest">{event.category}</span>
          {event.is_free && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">• Free</span>}
        </div>
        <h4 className={cn("text-sm font-black italic tracking-tight uppercase truncate leading-none mb-1", isLight ? "text-slate-900" : "text-white")}>
          {event.title}
        </h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-50">
            <MapPin className={cn("w-2.5 h-2.5", isLight ? "text-slate-900" : "text-white")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-slate-900" : "text-white")}>{event.location}</span>
          </div>
          <div className="flex items-center gap-1 opacity-50">
            <Clock className={cn("w-2.5 h-2.5", isLight ? "text-slate-900" : "text-white")} />
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-slate-900" : "text-white")}>8 PM</span>
          </div>
        </div>
      </div>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center opacity-20", isLight ? "bg-slate-900" : "bg-white")}>
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
}

function TrendingGridCard({ event, onClick }: { event: EventItem, onClick: (id: string) => void }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => { triggerHaptic('light'); onClick(event.id); }}
      className="relative flex flex-col gap-2 group"
    >
      <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl">
        <img src={event.image_url || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute top-3 right-3">
           <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" />
           </div>
        </div>
      </div>
      <div className="px-2">
         <h4 className={cn("text-xs font-black italic tracking-tight uppercase truncate leading-none mb-1", isLight ? "text-slate-900" : "text-white")}>
           {event.title}
         </h4>
         <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-50 truncate", isLight ? "text-slate-900" : "text-white")}>
           {event.organizer_name || 'Guest Organizer'}
         </p>
      </div>
    </motion.div>
  );
}

// ── STORIES VIEW COMPONENT ───────────────────────────────────────────────────

function StoriesView({ 
  events, 
  currentIndex, 
  setCurrentIndex, 
  likedIds, 
  onLike, 
  onOpenChat,
  isLoading 
}: { 
  events: EventItem[], 
  currentIndex: number, 
  setCurrentIndex: (val: any) => void,
  likedIds: Set<string>,
  onLike: (id: string) => void,
  onOpenChat: (event: EventItem, e: React.MouseEvent) => void,
  isLoading: boolean
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [currentIndex, setCurrentIndex]);

  return (
    <div className="relative w-full h-full bg-black">
      {/* ── STORIES PROGRESS BAR ── */}
      <div className="absolute top-[calc(var(--safe-top)+4px)] left-0 right-0 z-[70] px-4 flex gap-1.5 pointer-events-none">
        {events.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
            <motion.div 
              className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              key={`progress-${idx}-${currentIndex}`}
              initial={{ width: idx < currentIndex ? '100%' : '0%' }}
              animate={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%' 
              }}
              transition={{ 
                duration: idx === currentIndex ? 10 : 0.15, 
                ease: "linear" 
              }}
              onAnimationComplete={() => {
                if (idx === currentIndex && currentIndex < events.length - 1) {
                  const nextIndex = currentIndex + 1;
                  setCurrentIndex(nextIndex);
                  scrollRef.current?.scrollTo({
                    top: nextIndex * scrollRef.current.clientHeight,
                    behavior: 'smooth'
                  });
                }
              }}
            />
          </div>
        ))}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {isLoading && events.length === 0 ? (
          <div className="h-full w-full snap-start flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <Sparkles className="w-12 h-12 text-white/10 animate-pulse" />
          </div>
        ) : events.length > 0 ? (
          <>
            {events.map((event, idx) => (
              <div key={event.id} className="w-full h-full snap-start snap-always shrink-0 flex-shrink-0">
                <StoryCard 
                  event={event} 
                  isActive={idx === currentIndex} 
                  isLiked={likedIds.has(event.id)}
                  onLike={onLike}
                  onOpenChat={(e) => onOpenChat(event, e)}
                  onTapLeft={() => {
                    if (currentIndex > 0) {
                      const prevIndex = currentIndex - 1;
                      setCurrentIndex(prevIndex);
                      scrollRef.current?.scrollTo({ top: prevIndex * scrollRef.current.clientHeight, behavior: 'smooth' });
                    }
                  }}
                  onTapRight={() => {
                    if (currentIndex < events.length - 1) {
                      const nextIndex = currentIndex + 1;
                      setCurrentIndex(nextIndex);
                      scrollRef.current?.scrollTo({ top: nextIndex * scrollRef.current.clientHeight, behavior: 'smooth' });
                    }
                  }}
                />
              </div>
            ))}
          </>
        ) : (
          <div className="h-full w-full snap-start flex flex-col items-center justify-center text-white/30 p-10 text-center gap-4">
            <Sparkles className="w-12 h-12" />
            <p className="text-sm font-black uppercase tracking-widest">No stories left</p>
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
              className={cn("fixed bottom-0 left-0 right-0 z-[201] border-t rounded-t-[36px] px-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] pt-6", isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              {/* Handle */}
              <div className={cn("w-10 h-1 rounded-full mx-auto mb-6", isLight ? "bg-slate-200" : "bg-white/20")} />

              <div className="flex items-center justify-between mb-6">
                <h3 className={cn("text-xl font-black italic tracking-tight", isLight ? "text-slate-900" : "text-white")}>Filters</h3>
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
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3", isLight ? "text-slate-400" : "text-white/40")}>Price</p>
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
                <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] mb-3", isLight ? "text-slate-400" : "text-white/40")}>Sort By</p>
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
              className={cn("fixed bottom-0 left-0 right-0 z-[201] border-t rounded-t-[36px] max-h-[80vh] flex flex-col", isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              {/* Handle + header */}
              <div className="flex-shrink-0 px-6 pt-5 pb-4">
                <div className={cn("w-10 h-1 rounded-full mx-auto mb-5", isLight ? "bg-slate-200" : "bg-white/20")} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-5 h-5 text-rose-500 fill-current" />
                    <h3 className={cn("text-xl font-black italic", isLight ? "text-slate-900" : "text-white")}>Liked Events</h3>
                    <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                      <span className="text-[10px] font-black text-rose-400">{likedCount}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowLiked(false)} aria-label="Close liked events" className={cn("w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all shadow-lg border", isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white/5 border-white/10 text-white/80")}>
                    <X className="w-6 h-6" />
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
                      onClick={() => { setShowLiked(false); navigate(`/explore/eventos/${event.id}`, { state: { eventData: event } }); }}
                      className={cn("flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-colors border", isLight ? "bg-slate-50 border-slate-200 active:bg-slate-100" : "bg-white/5 border-white/8 active:bg-white/10")}
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200&q=60'}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn("text-[13px] font-black truncate", isLight ? "text-slate-900" : "text-white")}>{event.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <MapPin className={cn("w-3 h-3", isLight ? "text-slate-400" : "text-white/40")} />
                          <span className={cn("text-[11px] truncate", isLight ? "text-slate-500" : "text-white/50")}>{event.location || 'Tulum'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className={cn("w-3 h-3", isLight ? "text-slate-400" : "text-white/40")} />
                          <span className={cn("text-[11px]", isLight ? "text-slate-500" : "text-white/50")}>
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
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", isLight ? "bg-slate-100 text-slate-400" : "bg-white/5 text-white/20")}>
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
    </div>
  );
}

// ── STORY CARD COMPONENT ──────────────────────────────────────────────────────

function StoryCard({ 
  event, 
  isActive,
  isLiked,
  onLike,
  onOpenChat,
  onTapLeft,
  onTapRight,
}: { 
  event: EventItem, 
  isActive: boolean,
  isLiked: boolean,
  onLike: (id: string) => void,
  onOpenChat: (e: React.MouseEvent) => void,
  onTapLeft?: () => void,
  onTapRight?: () => void,
}) {
  const { navigate } = useAppNavigate();
  const _isPoster = event.id.startsWith('poster');
  const isPromo = event.is_promo;

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('medium');
    if (isPromo) {
      navigate('/explore/eventos/promote');
      return;
    }
    navigate(`/explore/eventos/${baseEventId}`, { state: { eventData: event } });
  };

  const _handleCardTap = () => {
    if (isPromo) return;
    triggerHaptic('light');
    navigate(`/explore/eventos/${baseEventId}`, { state: { eventData: event } });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <motion.div 
        className="absolute inset-0"
        animate={isActive ? { scale: 1 } : { scale: 1.1 }}
        transition={{ duration: 0.8 }}
      >
        <img src={event.image_url || ''} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </motion.div>

      {/* Tap zones for Instagram-style navigation */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        <div className="flex-1 h-full pointer-events-auto" onClick={onTapLeft} />
        <div className="flex-[3] h-full pointer-events-none" />
        <div className="flex-1 h-full pointer-events-auto" onClick={onTapRight} />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-[calc(1.5rem+var(--safe-bottom))] z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isActive ? { opacity: 1, y: 0 } : {}}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[8px] font-black uppercase tracking-widest text-white/80">
              {event.category}
            </span>
            {event.discount_tag && <span className="px-2 py-1 rounded-full bg-primary text-white text-[8px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">{event.discount_tag}</span>}
          </div>

          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-[0.85]">
            {event.title}
          </h2>

          <p className="text-sm text-white/60 leading-relaxed line-clamp-2">
            {event.description}
          </p>

          <div className="flex items-center gap-6 pt-2">
             <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{event.location}</span>
             </div>
             <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Now</span>
             </div>
          </div>

          <div className="flex gap-2 pt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDetailsClick}
              className="flex-[4] py-4 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl flex items-center justify-center gap-2"
            >
              Get Tickets <ArrowUpRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={onOpenChat}
              className="flex-1 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onLike(event.id)}
              className={cn(
                "flex-1 h-12 rounded-2xl border flex items-center justify-center transition-all",
                isLiked ? "bg-rose-500 border-rose-400 text-white" : "bg-white/10 border-white/20 text-white"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── FILTER & LIKED SHEETS ────────────────────────────────────────────────────

function FilterSheet({ isOpen, onClose, freeOnly, setFreeOnly, sortBy, setSortBy, activeFilterCount: _activeFilterCount }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[201] bg-white rounded-t-[40px] p-8 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black italic uppercase tracking-tighter">Filters</h3>
               <button onClick={onClose} aria-label="Close filters" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-8 mb-10">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Price Preference</p>
                  <button onClick={() => setFreeOnly(!freeOnly)} className={cn("w-full p-4 rounded-2xl border flex items-center justify-between", freeOnly ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-600")}>
                    <span className="font-bold">Free Events Only</span>
                    <div className={cn("w-5 h-5 rounded-full border-2", freeOnly ? "bg-emerald-500 border-emerald-500" : "border-slate-300")} />
                  </button>
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Sort By</p>
                  <div className="flex gap-2">
                    {['upcoming', 'newest'].map(opt => (
                      <button key={opt} onClick={() => setSortBy(opt)} className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest", sortBy === opt ? "bg-slate-900 border-slate-900 text-white" : "border-slate-200 text-slate-500")}>
                        {opt}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
            <button onClick={onClose} className="w-full py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl">Apply Filters</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LikedSheet({ isOpen, onClose, likedEvents, likedCount: _likedCount }: any) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("fixed bottom-0 left-0 right-0 z-[201] rounded-t-[40px] max-h-[85vh] flex flex-col", isLight ? "bg-slate-50" : "bg-zinc-900")}>
            <div className="p-6 pb-2 border-b border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Favorites</h3>
              </div>
              <button onClick={onClose} aria-label="Close favorites" className="w-10 h-10 rounded-full bg-slate-200/50 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-[calc(2rem+var(--safe-bottom))]">
               {likedEvents.map((event: any) => (
                 <div key={event.id} className="flex items-center gap-4 p-3 rounded-3xl bg-white border border-slate-200 shadow-sm">
                    <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-black italic tracking-tight uppercase truncate">{event.title}</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.location}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                 </div>
               ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
