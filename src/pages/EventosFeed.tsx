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
    description: 'An intimate farm-to-table tasting menu crafted by Tulum\'s most celebrated vegan chef. 8 courses, 20 guests only.',
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

export default function EventosFeed() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
    // Initial load
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

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden flex flex-col font-sans">
      {/* ── HEADER OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none pt-[var(--safe-top)]">
        <div className="px-4 py-3 flex items-center justify-between pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative overflow-hidden"
                >
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('eventos.searchPlaceholder')}
                    className="w-full h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 text-sm text-white focus:outline-none placeholder:text-white/40"
                  />
                  <X className="absolute right-3 top-2.5 w-5 h-5 text-white/60 cursor-pointer" onClick={() => { setShowSearch(false); setSearchQuery(''); }} />
                </motion.div>
              ) : (
                <motion.button
                  key="search-btn"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => setShowSearch(true)}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
                >
                  <Search className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
            
            <motion.button
              whileTap={{ scale: 0.8 }}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* ── CATEGORY BAR ── */}
        <div className="px-4 overflow-x-auto no-scrollbar pointer-events-auto mt-2">
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
                    "flex-shrink-0 px-4 py-2.5 rounded-full backdrop-blur-3xl border transition-all flex items-center gap-2",
                    isActive 
                      ? "bg-white text-black border-white shadow-[0_4px_15px_rgba(255,255,255,0.3)]" 
                      : "bg-black/20 text-white border-white/10"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-orange-500" : "text-white/80")} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
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
        className="flex-1 overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <StoryCard key={event.id} event={event} />
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

function StoryCard({ event }: { event: EventItem }) {
  const { t } = useTranslation();
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    triggerHaptic('medium');
  };

  return (
    <div className="relative h-full w-full snap-start overflow-hidden flex flex-col">
      {/* Background Image */}
      <img 
        src={event.image_url || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1000&q=80'} 
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />

      {/* Dynamic Tag */}
      {event.discount_tag && (
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          className="absolute top-32 left-4 z-10"
        >
          <div className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg rotate-[-2deg]">
            {event.discount_tag}
          </div>
        </motion.div>
      )}

      {/* Glass Content Panel */}
      <div className="mt-auto p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-5 text-white relative z-10">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em]">
              {event.location || 'Tulum'}
            </div>
            {event.is_free && (
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md border border-emerald-400/20 text-[10px] font-black uppercase tracking-[0.2em]">
                {t('eventos.free')}
              </div>
            )}
          </div>
          
          <h2 className="text-4xl font-black italic tracking-tighter leading-none uppercase drop-shadow-2xl">
            {event.title}
          </h2>
          
          <p className="text-sm text-white/80 line-clamp-2 leading-relaxed max-w-[90%]">
            {event.description || 'Experience the magic of the Riviera Maya.'}
          </p>
        </motion.div>

        {/* Action Row */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 1.5 }}
              onClick={handleLike}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all border backdrop-blur-xl",
                isLiked ? "bg-rose-500 border-rose-400 text-white" : "bg-black/20 border-white/20 text-white"
              )}
            >
              <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
            >
              <MessageCircle className="w-5 h-5" />
            </motion.button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 group"
          >
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{t('eventos.ticketInfo')}</span>
              <span className="text-lg font-black">{event.price_text || t('eventos.free')}</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-active:scale-95 transition-all">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </motion.button>
        </div>

        {/* Details Pill Bar */}
        <div className="flex gap-4 pt-2">
          <DetailItem icon={Calendar} text={event.event_date ? new Date(event.event_date).toLocaleDateString() : t('eventos.today')} />
          <DetailItem icon={Clock} text="8 PM – LATE" />
          <DetailItem icon={MapPin} text={event.organizer_name || 'Events'} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-white/50" />
      <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{text}</span>
    </div>
  );
}
