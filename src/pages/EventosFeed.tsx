import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Calendar, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';

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

const CATEGORIES = [
  { key: 'all', label: 'All Events' },
  { key: 'beach', label: 'Beach Clubs' },
  { key: 'jungle', label: 'Jungle & Nature' },
  { key: 'music', label: 'Music & Fiestas' },
  { key: 'food', label: 'Food & Restaurants' },
  { key: 'promo', label: 'Promos & Discounts' },
];

export default function EventosFeed() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const PAGE_SIZE = 10;

  const fetchEvents = useCallback(async (reset = false) => {
    const currentPage = reset ? 0 : page;
    let query = supabase
      .from('events')
      .select('id, title, description, category, image_url, event_date, event_end_date, location, location_detail, organizer_name, promo_text, discount_tag, is_free, price_text')
      .order('event_date', { ascending: true, nullsFirst: false })
      .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

    if (activeCategory !== 'all') {
      query = query.eq('category', activeCategory);
    }
    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    const items = (data as EventItem[]) || [];
    
    if (reset) {
      setEvents(items);
      setPage(1);
    } else {
      setEvents(prev => [...prev, ...items]);
      setPage(currentPage + 1);
    }
    setHasMore(items.length === PAGE_SIZE);
    setIsLoading(false);
  }, [activeCategory, searchQuery, page]);

  useEffect(() => {
    setIsLoading(true);
    setPage(0);
    fetchEvents(true);
  }, [activeCategory, searchQuery]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore || isLoading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 400) {
      fetchEvents(false);
    }
  }, [fetchEvents, hasMore, isLoading]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 pb-0">
        <PageHeader
          title="Eventos & Experiencias"
          subtitle="Discover the best in Quintana Roo"
          actions={
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-xl bg-card/80 border border-border/30"
            >
              {showSearch ? <X className="w-4 h-4 text-foreground" /> : <Search className="w-4 h-4 text-foreground" />}
            </motion.button>
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
                placeholder="Search events, locations..."
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
        className="flex-1 overflow-y-auto snap-y snap-mandatory pb-24"
        style={{ scrollSnapType: 'y mandatory' }}
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
            <h3 className="text-lg font-semibold text-foreground mb-1">No events yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Events will appear here once they're published. Check back soon!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/explore/eventos/${event.id}`)}
                className="relative h-[72vh] rounded-3xl overflow-hidden cursor-pointer snap-start snap-always group"
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
                      Free Entry
                    </span>
                  )}
                </div>

                {/* Content overlay - bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  {/* Promo text */}
                  {event.promo_text && (
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-primary/20 backdrop-blur-sm text-primary-foreground text-[10px] font-semibold mb-2 border border-primary/30">
                      {event.promo_text}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                    {event.title}
                  </h2>

                  {/* Meta info */}
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

                  {/* Price */}
                  {event.price_text && !event.is_free && (
                    <span className="inline-block mt-2 text-xs text-white/60 font-medium">
                      {event.price_text}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Load more indicator */}
            {hasMore && (
              <div className="h-20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
