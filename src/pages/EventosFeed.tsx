import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal,
  ChevronLeft, Share2, MessageCircle, Heart,
  Waves, Trees, Music, Utensils, Ticket,
  Clock, ArrowUpRight, Check, ChevronRight
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
    id: 'mock-1',
    title: 'Gitano Jungle Party',
    description: 'The legendary Friday night in the jungle. Gypsy Disco vibes with artisanal mezcal cocktails under the stars.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1000&q=80',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Tulum Jungle',
    location_detail: 'Beach Road km 7.5',
    organizer_name: 'Gitano',
    promo_text: 'Tulum Residents 20% OFF',
    discount_tag: '20% Residents',
    is_free: false,
    price_text: '$120 USD'
  },
  {
    id: 'mock-2',
    title: 'Bagatelle Beach Brunch',
    description: 'French Riviera vibes meet the Caribbean coast. Join us for the ultimate festive brunch with DJ sets and fresh seafood.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1000&q=80',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Bagatelle',
    location_detail: 'Beach Zone',
    organizer_name: 'Bagatelle Tulum',
    promo_text: 'Includes welcome drink',
    discount_tag: 'Trending',
    is_free: false,
    price_text: '$85 USD'
  },
  {
    id: 'mock-3',
    title: 'Papaya Playa Project',
    description: 'Full Moon Saturday. A mystical journey through music and dance on the pristine sands of Tulum Beach.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&q=80',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'PPP Beach',
    location_detail: 'Beach Road km 4.5',
    organizer_name: 'Papaya Playa',
    promo_text: 'Local ID gets priority',
    discount_tag: 'Full Moon',
    is_free: false,
    price_text: 'From $150 USD'
  },
  {
    id: 'mock-4',
    title: 'Zamna Ancestral Forest',
    description: 'Deep inside the Mayan jungle, Zamna delivers an otherworldly techno and electronic music experience at sunrise.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1000&q=80',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Zamna Tulum',
    location_detail: 'Carr. Tulum-Cobá km 3.5',
    organizer_name: 'Zamna',
    promo_text: 'Sunrise set from 4 AM',
    discount_tag: 'Sold Out Soon',
    is_free: false,
    price_text: '$200 USD'
  },
  {
    id: 'mock-5',
    title: 'Cenote Swim & Yoga',
    description: 'Morning yoga flow followed by a private cenote dip. Connect with nature, local healers, and your inner self.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1000&q=80',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Cenote Cristal',
    location_detail: 'Carr. Tulum-Cobá',
    organizer_name: 'Holistika Tulum',
    promo_text: 'Mat & towel provided',
    discount_tag: 'Limited Spots',
    is_free: false,
    price_text: '$55 USD'
  },
  {
    id: 'mock-6',
    title: 'Taboo Beach Day Party',
    description: 'All-day beach party at Taboo with world-class DJs, bottle service, and the best views of the Caribbean.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Taboo Tulum',
    location_detail: 'Hotel Zone Beach',
    organizer_name: 'Taboo',
    promo_text: 'Ladies free before 1 PM',
    discount_tag: '🌊 Beach',
    is_free: false,
    price_text: '$60 USD'
  },
  {
    id: 'mock-7',
    title: 'Raw Food Chef Dinner',
    description: "An intimate farm-to-table tasting menu crafted by Tulum's most celebrated vegan chef. 8 courses, 20 guests only.",
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1000&q=80',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'La Zebra',
    location_detail: 'Beach Road km 8.2',
    organizer_name: 'La Zebra Kitchen',
    promo_text: 'Wine pairing included',
    discount_tag: '8-Course Menu',
    is_free: false,
    price_text: '$180 USD'
  },
  {
    id: 'mock-8',
    title: 'Mezcal & Taco Sunday',
    description: 'The best local taqueros and mezcaleros gather for an outdoor fiesta. Street food, live marimba, and good vibes.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1000&q=80',
    event_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Tulum Centro',
    location_detail: 'Av. Tulum',
    organizer_name: 'Local Eats Collective',
    promo_text: 'Free mezcal shot on entry',
    discount_tag: 'Free Entry',
    is_free: true,
    price_text: null
  },
  {
    id: 'mock-9',
    title: 'Resident Discount Market',
    description: 'Monthly deals market exclusively for Tulum residents. 40+ vendors offering 20–60% off on services, food, and tours.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1000&q=80',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Gran Cenote Area',
    location_detail: 'Carr. Tulum-Cobá',
    organizer_name: 'Tulum Residents Network',
    promo_text: 'Bring your local ID',
    discount_tag: 'Up to 60% OFF',
    is_free: true,
    price_text: null
  },
  {
    id: 'mock-10',
    title: 'Ahau 2-for-1 Sundowner',
    description: 'Every Tuesday, Ahau offers buy-one-get-one cocktails at sunset. Acoustic sessions, hammocks, and ocean breeze.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&q=80',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Ahau Tulum',
    location_detail: 'Beach Road km 7',
    organizer_name: 'Ahau',
    promo_text: '2-for-1 cocktails 5–7 PM',
    discount_tag: '2x1 Happy Hour',
    is_free: false,
    price_text: '$18 USD'
  },
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
  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOrder>('upcoming');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLikedIds);
  const scrollRef = useRef<HTMLDivElement>(null);

  const CATEGORIES = [
    { key: 'all', label: 'allEvents', icon: Sparkles },
    { key: 'beach', label: 'beachClubs', icon: Waves },
    { key: 'jungle', label: 'jungleNature', icon: Trees },
    { key: 'music', label: 'musicFiestas', icon: Music },
    { key: 'food', label: 'foodRestaurants', icon: Utensils },
    { key: 'promo', label: 'promosDiscounts', icon: Ticket },
  ];

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
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
        setAllEvents(formatted.length > 0 ? formatted : MOCK_EVENTS);
      } catch {
        setAllEvents(MOCK_EVENTS);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
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

  const filteredEvents = allEvents
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

  const likedEvents = allEvents.filter(e => likedIds.has(e.id));
  const likedCount = likedIds.size;
  const activeFilterCount = (freeOnly ? 1 : 0) + (sortBy !== 'upcoming' ? 1 : 0);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">

      {/* ── HEADER OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none pt-[var(--safe-top,0px)]">
        <div className="px-4 py-3 flex items-center justify-between pointer-events-auto">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

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
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 text-sm text-white focus:outline-none placeholder:text-white/40"
                  />
                  <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="absolute right-3 top-2.5">
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Filter button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { triggerHaptic('light'); setShowFilters(true); }}
              className="relative w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
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
        <div className="px-4 overflow-x-auto no-scrollbar pointer-events-auto">
          <div className="flex gap-2.5 pb-4">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.key;
              return (
                <motion.button
                  key={cat.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full backdrop-blur-2xl border transition-all flex items-center gap-1.5",
                    isActive
                      ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.25)]"
                      : "bg-black/30 text-white border-white/10"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-orange-500" : "text-white/70")} />
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
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
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <StoryCard
              key={event.id}
              event={event}
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
  isLiked,
  onLike,
}: {
  event: EventItem;
  isLiked: boolean;
  onLike: (id: string) => void;
}) {
  const navigate = useNavigate();

  const formatDate = (iso: string | null) => {
    if (!iso) return 'Today';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '8 PM – LATE';
    const d = new Date(iso);
    const h = d.getHours();
    if (h < 6) return '12 AM – DAWN';
    if (h < 12) return '10 AM – NOON';
    if (h < 16) return '12 PM – SUNSET';
    return '8 PM – LATE';
  };

  return (
    <div className="relative w-full snap-start overflow-hidden flex flex-col" style={{ height: '100%', minHeight: '100%' }}>
      {/* Background Image */}
      <img
        src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1000&q=80'}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/90 pointer-events-none" />

      {/* Discount tag */}
      {event.discount_tag && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="absolute top-[30%] left-4 z-10"
        >
          <div className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl rotate-[-2deg]">
            {event.discount_tag}
          </div>
        </motion.div>
      )}

      {/* Organizer badge — top right */}
      {event.organizer_name && (
        <div className="absolute top-[30%] right-4 z-10">
          <div className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
            {event.organizer_name}
          </div>
        </div>
      )}

      {/* Content panel */}
      <div className="mt-auto px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-6 space-y-4 text-white relative z-10">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-2"
        >
          {/* Location + free badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black uppercase tracking-[0.18em]">
              {event.location || 'Tulum'}
            </div>
            {event.is_free && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/80 border border-emerald-400/20 text-[10px] font-black uppercase tracking-[0.18em]">
                Free
              </div>
            )}
            {event.promo_text && (
              <div className="px-2.5 py-1 rounded-lg bg-orange-500/60 border border-orange-400/20 text-[10px] font-bold tracking-wide">
                {event.promo_text}
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-[2.4rem] font-black italic tracking-tighter leading-none uppercase drop-shadow-2xl">
            {event.title}
          </h2>

          {/* Description */}
          <p className="text-[13px] text-white/75 line-clamp-2 leading-relaxed max-w-[88%]">
            {event.description || 'Experience the magic of the Riviera Maya.'}
          </p>
        </motion.div>

        {/* Action Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Like */}
            <motion.button
              whileTap={{ scale: 1.35 }}
              onClick={() => onLike(event.id)}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-xl transition-all",
                isLiked
                  ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30"
                  : "bg-black/25 border-white/20 text-white"
              )}
            >
              <Heart className={cn("w-5 h-5 transition-all", isLiked && "fill-current scale-110")} />
            </motion.button>

            {/* Share */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                triggerHaptic('light');
                if (navigator.share) {
                  await navigator.share({ title: event.title, text: event.description || '', url: window.location.href });
                }
              }}
              className="w-12 h-12 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>

            {/* Message organizer */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => triggerHaptic('light')}
              className="w-12 h-12 rounded-full bg-black/25 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Ticket CTA */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/explore/eventos/${event.id}`)}
            className="flex items-center gap-2 group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Tickets</span>
              <span className="text-lg font-black leading-none">{event.price_text || 'Free'}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-active:scale-95 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </motion.button>
        </div>

        {/* Date / Time / Location pills */}
        <div className="flex items-center gap-4 pt-1">
          <DetailPill icon={Calendar} text={formatDate(event.event_date)} />
          <DetailPill icon={Clock} text={formatTime(event.event_date)} />
          <DetailPill icon={MapPin} text={event.location_detail || event.location || 'Tulum'} />
        </div>
      </div>
    </div>
  );
}

function DetailPill({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3.5 h-3.5 text-white/45 flex-shrink-0" />
      <span className="text-[10px] font-bold text-white/75 uppercase tracking-widest truncate">{text}</span>
    </div>
  );
}
