import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MapPin, Calendar, Sparkles, X, SlidersHorizontal, 
  ChevronLeft, Info, Share2, MessageCircle, Heart,
  Waves, Trees, Music, Utensils, Ticket,
  Clock, ExternalLink, ChevronDown, ArrowUpRight
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

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_EVENTS: EventItem[] = [
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
    id: 'mock-3',
    title: 'Papaya Playa Project',
    description: 'Full Moon Saturday. A mystical journey through music and dance on the sands of Tulum. Connection, community, and consciousness.',
    category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=90',
    event_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'PPP Beach',
    location_detail: 'Beach Road km 4.5',
    organizer_name: 'Papaya Playa',
    promo_text: 'Local ID gets priority',
    discount_tag: 'Full Moon Ritual',
    is_free: false,
    price_text: 'From $150 USD'
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
  }
];

export default function EventosFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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
        const formattedEvents: EventItem[] = (data || []).map((ev: any) => ({
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
        setEvents(formattedEvents.length > 0 ? formattedEvents : MOCK_EVENTS);
      } catch (e) {
        setEvents(MOCK_EVENTS);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, []);

  const filteredEvents = events.filter(e => {
    const matchesCat = activeCategory === 'all' || e.category === activeCategory;
    const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollPos = scrollRef.current.scrollTop;
    const itemHeight = scrollRef.current.clientHeight;
    const index = Math.round(scrollPos / itemHeight);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      triggerHaptic('light');
    }
  }, [currentIndex]);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">
      {/* ── STORIES PROGRESS BAR ── */}
      <div className="absolute top-[calc(var(--safe-top)+4px)] left-0 right-0 z-[60] px-4 flex gap-1">
        {filteredEvents.map((_, idx) => (
          <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20">
            <motion.div 
              className="h-full bg-white"
              initial={{ width: 0 }}
              animate={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? '100%' : '0%' 
              }}
              transition={{ 
                duration: idx === currentIndex ? 5 : 0, 
                ease: "linear" 
              }}
            />
          </div>
        ))}
      </div>

      {/* ── HEADER OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none pt-[var(--safe-top)]">
        <div className="px-4 py-5 flex items-center justify-between pointer-events-auto">
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
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('eventos.searchPlaceholder')}
                    className="w-full h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 text-xs text-white focus:outline-none placeholder:text-white/40"
                  />
                  <X className="absolute right-3 top-2.5 w-4 h-4 text-white/60 cursor-pointer" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
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
            
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <SlidersHorizontal className="w-5 h-5" />
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
                    "flex-shrink-0 px-4 py-2 rounded-full backdrop-blur-xl border transition-all flex items-center gap-2",
                    isActive 
                      ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.3)]" 
                      : "bg-black/30 text-white border-white/10"
                  )}
                >
                  <Icon className={cn("w-3 h-3", isActive ? "text-primary" : "text-white/80")} />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {t('eventos.' + cat.label)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── VERTICAL FEED (Instagram Stories Style) ── */}
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
            <StoryCard key={event.id} event={event} isActive={idx === currentIndex} />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/50 px-10 text-center gap-4">
            <Sparkles className="w-16 h-16 opacity-20" />
            <h3 className="text-xl font-black italic">No matches found</h3>
            <p className="text-sm">Try another category or mission parameter.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── STORY CARD COMPONENT ──

function StoryCard({ event, isActive }: { event: EventItem, isActive: boolean }) {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Auto-navigation logic could go here
    }
  }, [isActive]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    triggerHaptic(isLiked ? 'light' : 'success');
  };

  return (
    <div className="relative h-full w-full snap-start overflow-hidden flex flex-col">
      {/* Background Image */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={isActive ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 10, ease: "linear" }}
      >
        <img 
          src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1000&q=80'} 
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>
      
      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent via-50% to-black/95 pointer-events-none" />
      
      {/* Interactive Detail Overlay (Story Style) */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 pointer-events-none"
          >
             {/* Dynamic Light Streaks */}
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-30" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Discount Tag */}
      {event.discount_tag && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={isActive ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-40 left-4 z-20"
        >
          <div className="px-4 py-2 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl rotate-[-2deg] border border-white/20">
            {event.discount_tag}
          </div>
        </motion.div>
      )}

      {/* Glass Content Panel */}
      <div className="mt-auto p-6 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] space-y-6 text-white relative z-20">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isActive ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-primary" />
              {event.location || 'Tulum'}
            </div>
            {event.is_free ? (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/80 backdrop-blur-xl text-[9px] font-black uppercase tracking-[0.3em]">
                {t('eventos.free')}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/80 backdrop-blur-xl text-[9px] font-black uppercase tracking-[0.3em]">
                {event.price_text}
              </div>
            )}
          </div>
          
          <h2 className="text-5xl font-black italic tracking-tighter leading-[0.85] uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
            {event.title}
          </h2>
          
          <p className="text-[15px] font-medium text-white/90 line-clamp-3 leading-relaxed max-w-[95%] drop-shadow-md">
            {event.description || 'Experience the magic of the Riviera Maya.'}
          </p>
        </motion.div>

        {/* Story Action Bar */}
        <div className="flex items-end justify-between pt-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <DetailItem icon={Calendar} text={event.event_date ? new Date(event.event_date).toLocaleDateString() : t('eventos.today')} />
              <DetailItem icon={Clock} text="8 PM – LATE" />
              <DetailItem icon={MapPin} text={event.organizer_name || 'Events'} />
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 1.4 }}
                onClick={handleLike}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all border backdrop-blur-xl",
                  isLiked ? "bg-rose-500 border-rose-400 text-white shadow-[0_4px_15px_rgba(244,63,94,0.4)]" : "bg-white/10 border-white/20 text-white"
                )}
              >
                <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            className="group relative flex flex-col items-center gap-3"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full opacity-0 group-active:opacity-100 transition-opacity" />
            <div className="w-16 h-24 rounded-[32px] bg-white text-black flex flex-col items-center justify-center gap-2 shadow-2xl group-active:scale-95 transition-all relative z-10 overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10" />
               <Ticket className="w-6 h-6 text-primary" />
               <ChevronDown className="w-4 h-4 animate-bounce mt-1" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">{t('eventos.ticketInfo')}</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">{text}</span>
    </div>
  );
}

