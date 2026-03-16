import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  event_date: string | null;
  event_end_date: string | null;
  location: string | null;
  location_detail: string | null;
  organizer_name: string | null;
  promo_text: string | null;
  discount_tag: string | null;
  is_free: boolean;
  price_text: string | null;
}

// Mock events for testing when no DB data exists
const MOCK_EVENTS: EventItem[] = [
  {
    id: 'mock-1',
    title: 'Tulum Beach Club Night',
    description: 'Join us for an unforgettable night at the most exclusive beach club in Tulum. Live DJ sets, cocktails, and breathtaking ocean views.',
    category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
    event_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    location: 'Tulum',
    location_detail: 'Playa Paraiso, Tulum Beach Zone',
    organizer_name: 'Tulum Vibes',
    promo_text: 'Open Bar until midnight',
    discount_tag: '30% OFF',
    is_free: false,
    price_text: '$35 per person',
  },
  {
    id: 'mock-2',
    title: 'Cenote Yoga & Swim',
    description: 'Sunrise yoga session followed by a refreshing swim in an underground cenote. Connect with nature in the heart of the Mayan jungle.',
    category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1519677584237-752f8853252e?w=800&q=80',
    event_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: null,
    location: 'Playa del Carmen',
    location_detail: 'Cenote Azul, Riviera Maya',
    organizer_name: 'Maya Wellness',
    promo_text: 'Includes breakfast & gear',
    discount_tag: null,
    is_free: false,
    price_text: '$45 per person',
  },
  {
    id: 'mock-3',
    title: 'EDM Festival Cancún',
    description: 'The biggest electronic music festival of the year. Three stages, 20+ DJs, light shows, and 10,000 attendees.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Cancún',
    location_detail: 'Parque de las Palapas, Centro',
    organizer_name: 'Beats Mexico',
    promo_text: '3-day all-inclusive pass',
    discount_tag: 'EARLY BIRD',
    is_free: false,
    price_text: '$120 for 3 days',
  },
  {
    id: 'mock-4',
    title: 'Mariscos Sunday Brunch',
    description: 'Authentic Yucatecan seafood brunch with live marimba music. All-you-can-eat ceviche, shrimp, and fresh local catch.',
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: null,
    location: 'Puerto Morelos',
    location_detail: 'Malecón, Centro Puerto Morelos',
    organizer_name: 'El Pescador',
    promo_text: 'Bottomless mimosas included',
    discount_tag: null,
    is_free: false,
    price_text: '$28 per person',
  },
  {
    id: 'mock-5',
    title: 'Free Salsa Night in the Plaza',
    description: 'Every Friday the central plaza transforms into a salsa dance floor. Beginners welcome — free lessons at 7 PM!',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=800&q=80',
    event_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: null,
    location: 'Playa del Carmen',
    location_detail: 'Plaza 28 de Julio, Centro',
    organizer_name: 'Ritmo Latino PDC',
    promo_text: 'Free dance lessons at 7 PM',
    discount_tag: null,
    is_free: true,
    price_text: null,
  },
  {
    id: 'mock-6',
    title: 'Happy Hour Rooftop',
    description: '2x1 cocktails and craft beers with panoramic views of the Caribbean Sea. Sunset guaranteed.',
    category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80',
    event_date: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    event_end_date: null,
    location: 'Cancún',
    location_detail: 'Hotel Zone, Zona Hotelera',
    organizer_name: 'Sky Bar Cancún',
    promo_text: '2x1 cocktails 5–8 PM daily',
    discount_tag: '2×1',
    is_free: false,
    price_text: 'From $8',
  },
];

export default function EventosFeed() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterFree, setFilterFree] = useState<'all' | 'free' | 'paid'>('all');
  const [sortOrder, setSortOrder] = useState<'upcoming' | 'newest'>('upcoming');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const CATEGORIES = [
    { key: 'all', label: t('eventos.allEvents') },
    { key: 'beach', label: t('eventos.beachClubs') },
    { key: 'jungle', label: t('eventos.jungleNature') },
    { key: 'music', label: t('eventos.musicFiestas') },
    { key: 'food', label: t('eventos.foodRestaurants') },
    { key: 'promo', label: t('eventos.promosDiscounts') },
  ];

  const fetchEvents = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    try {
      let query = supabase
        .from('events')
        .select('id, title, description, category, image_url, event_date, event_end_date, location, location_detail, organizer_name, promo_text, discount_tag, is_free, price_text')
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (sortOrder === 'upcoming') {
        query = query.order('event_date', { ascending: true, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (activeCategory !== 'all') {
        query = query.eq('category', activeCategory);
      }
      if (filterFree === 'free') {
        query = query.eq('is_free', true);
      } else if (filterFree === 'paid') {
        query = query.eq('is_free', false);
      }
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
      }

      const { data } = await query;
      const items = (data as EventItem[]) || [];

      if (items.length === 0 && currentPage === 0) {
        // Use mock data for testing when DB is empty
        setUseMockData(true);
        const filtered = MOCK_EVENTS.filter(e => {
          if (activeCategory !== 'all' && e.category !== activeCategory) return false;
          if (filterFree === 'free' && !e.is_free) return false;
          if (filterFree === 'paid' && e.is_free) return false;
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return e.title.toLowerCase().includes(q) || (e.location?.toLowerCase().includes(q) ?? false);
          }
          return true;
        });
        setEvents(filtered);
        setHasMore(false);
      } else {
        setUseMockData(false);
        if (reset) {
          setEvents(items);
          setPage(1);
        } else {
          setEvents(prev => [...prev, ...items]);
          setPage(currentPage + 1);
        }
        setHasMore(items.length === PAGE_SIZE);
      }
    } catch {
      // On any error, fall back to mock data so the page still renders
      setUseMockData(true);
      setEvents(MOCK_EVENTS);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, page, filterFree, sortOrder]);

  useEffect(() => {
    setIsLoading(true);
    setPage(0);
    fetchEvents(true);
  }, [activeCategory, searchQuery, filterFree, sortOrder]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || isLoading || useMockData) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      fetchEvents(false);
    }
  }, [fetchEvents, hasMore, isLoading, useMockData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  // Featured events = first 5 events with images
  const featuredEvents = events.filter(e => e.image_url).slice(0, 6);
  const hasActiveFilters = filterFree !== 'all' || sortOrder !== 'upcoming';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0">
        <PageHeader
          title={t('eventos.title')}
          subtitle={t('eventos.subtitle')}
          actions={
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSearch(!showSearch)}
                className="p-2.5 rounded-xl bg-card/80 border border-border/30"
              >
                {showSearch ? <X className="w-4 h-4 text-foreground" /> : <Search className="w-4 h-4 text-foreground" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowFilters(true)}
                className={cn(
                  "p-2.5 rounded-xl border",
                  hasActiveFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/80 border-border/30"
                )}
              >
                <SlidersHorizontal className={cn("w-4 h-4", hasActiveFilters ? "text-primary-foreground" : "text-foreground")} />
              </motion.button>
            </div>
          }
        />

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 overflow-hidden"
            >
              <Input
                placeholder={t('eventos.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card/80 border-border/30"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar -mx-4 px-4 mask-fade-edges">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border",
                activeCategory === cat.key
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card/60 text-muted-foreground border-border/30 hover:bg-card"
              )}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-24"
      >
        {isLoading && events.length === 0 ? (
          <div className="flex flex-col gap-4 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[70vh] rounded-3xl bg-card animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{t('eventos.noEvents')}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('eventos.noEventsDesc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Featured Photo Carousel */}
            {featuredEvents.length > 0 && (
              <div className="pt-2 pb-4">
                <div className="flex items-center justify-between px-4 mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-foreground">{t('eventos.featured')}</span>
                  </div>
                  <button
                    onClick={() => scrollRef.current?.scrollTo({ top: 300, behavior: 'smooth' })}
                    className="flex items-center gap-1 text-xs text-primary font-semibold"
                  >
                    {t('eventos.allEvents')} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div
                  ref={featuredScrollRef}
                  className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-1"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {featuredEvents.map((event, index) => (
                    <motion.div
                      key={`featured-${event.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.07 }}
                      onClick={() => navigate(useMockData ? '#' : `/explore/eventos/${event.id}`)}
                      className="flex-shrink-0 relative rounded-2xl overflow-hidden cursor-pointer group"
                      style={{
                        width: '62vw',
                        height: '38vw',
                        minWidth: '220px',
                        maxWidth: '280px',
                        scrollSnapAlign: 'start',
                      }}
                    >
                      <img
                        src={event.image_url!}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Top badges */}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        {event.discount_tag && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                            {event.discount_tag}
                          </span>
                        )}
                        {event.is_free && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                            {t('eventos.freeEntry')}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white text-xs font-bold leading-tight truncate">{event.title}</p>
                        {event.location && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-white/70" />
                            <span className="text-[10px] text-white/70 truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Vertical snap-scroll feed */}
            <div className="flex flex-col gap-4 px-4">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.04, 0.3) }}
                  onClick={() => navigate(useMockData ? '#' : `/explore/eventos/${event.id}`)}
                  className="relative h-[72vh] rounded-3xl overflow-hidden cursor-pointer group"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  {/* Hero image */}
                  <div className="absolute inset-0">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-muted-foreground/20" />
                      </div>
                    )}
                  </div>

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Badges - top */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                    {event.discount_tag && (
                      <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg">
                        {event.discount_tag}
                      </span>
                    )}
                    {event.is_free && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg ml-auto">
                        {t('eventos.freeEntry')}
                      </span>
                    )}
                  </div>

                  {/* Content overlay - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    {event.promo_text && (
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-sm text-primary-foreground text-[10px] font-semibold mb-2 border border-primary/30">
                        {event.promo_text}
                      </span>
                    )}
                    <h2 className="text-2xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                      {event.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-white/80">
                      {event.event_date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {formatDate(event.event_date)} · {formatTime(event.event_date)}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{event.location}</span>
                        </div>
                      )}
                    </div>
                    {event.price_text && !event.is_free && (
                      <span className="inline-block mt-2 text-xs text-white/60 font-medium">
                        {event.price_text}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {hasMore && (
                <div className="h-20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}

              {useMockData && (
                <div className="text-center py-4 px-4">
                  <p className="text-[11px] text-muted-foreground/50">Sample events shown — real events will appear once published</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <AnimatePresence>
        {showFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl border-t border-border/30 p-6 pb-safe"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-border/60 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-foreground">{t('eventos.filters')}</h3>
                <button
                  onClick={() => { setFilterFree('all'); setSortOrder('upcoming'); }}
                  className="text-xs text-primary font-semibold"
                >
                  {t('eventos.clearFilters')}
                </button>
              </div>

              {/* Sort by */}
              <div className="mb-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('eventos.sortBy')}</p>
                <div className="flex gap-2">
                  {(['upcoming', 'newest'] as const).map((opt) => (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortOrder(opt)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                        sortOrder === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border/30 text-muted-foreground"
                      )}
                    >
                      {opt === 'upcoming' ? t('eventos.sortUpcoming') : t('eventos.sortNewest')}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className="mb-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('eventos.price')}</p>
                <div className="flex gap-2">
                  {(['all', 'free', 'paid'] as const).map((opt) => (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterFree(opt)}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                        filterFree === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border/30 text-muted-foreground"
                      )}
                    >
                      {opt === 'all' ? t('common.all') : opt === 'free' ? t('eventos.free') : t('eventos.paid')}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Apply */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFilters(false)}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm"
              >
                {t('eventos.apply')}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
