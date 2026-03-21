import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Calendar, Sparkles, Waves, Trees, Music, Utensils, Ticket, ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { EventGroupChat } from '@/components/EventGroupChat';

// ── TYPES ─────────────────────────────────────────────────────────────────────
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

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'beach', label: 'Beach', icon: Waves },
  { key: 'jungle', label: 'Jungle', icon: Trees },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'food', label: 'Food', icon: Utensils },
  { key: 'promo', label: 'Promos', icon: Ticket },
];

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_EVENTS: EventItem[] = [
  {
    id: 'm1', title: 'Sunset Cacao Ceremony', category: 'beach',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80&auto=format',
    description: 'Sacred cacao ceremony at sunset on the Caribbean shore. Meditation, sound healing, and connection.',
    event_date: '2026-04-05T18:00:00', location: 'Playa Paraíso, Tulum', location_detail: 'Beach Club',
    organizer_name: 'Casa Luna', promo_text: 'Limited spots', discount_tag: 'EARLY BIRD', is_free: false, price_text: '$350 MXN',
  },
  {
    id: 'm2', title: 'Cenote Rave: Underground', category: 'music',
    image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80&auto=format',
    description: 'Deep underground techno rave inside a secret cenote. International DJs, crystal clear water.',
    event_date: '2026-04-06T22:00:00', location: 'Cenote Cristal, Tulum', location_detail: 'Underground',
    organizer_name: 'Zamna Tulum', promo_text: 'Sell-out show', discount_tag: 'TONIGHT', is_free: false, price_text: '$800 MXN',
  },
  {
    id: 'm3', title: 'Jungle Yoga & Brunch', category: 'jungle',
    image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format',
    description: 'Immersive yoga flow surrounded by ancient jungle. Followed by organic vegan brunch.',
    event_date: '2026-04-07T08:00:00', location: 'Sian Ka\'an Reserve', location_detail: 'Jungle clearing',
    organizer_name: 'Ahau Tulum', promo_text: 'All levels welcome', discount_tag: null, is_free: false, price_text: '$450 MXN',
  },
  {
    id: 'm4', title: 'Tulum Food Market', category: 'food',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80&auto=format',
    description: 'Open-air market with 40+ vendors. Local cuisine, artisan products, live cooking, mezcal.',
    event_date: '2026-04-08T12:00:00', location: 'La Veleta, Tulum', location_detail: 'Mercado 5ta',
    organizer_name: 'Tulum Sabor', promo_text: '40+ vendors', discount_tag: 'FREE ENTRY', is_free: true, price_text: null,
  },
  {
    id: 'm5', title: 'Rooftop Salsa Night', category: 'music',
    image_url: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=600&q=80&auto=format',
    description: 'Latin beats, salsa, cumbia & reggaeton under the stars. All levels, free dance class at 9pm.',
    event_date: '2026-04-09T21:00:00', location: 'Holistika, Tulum', location_detail: 'Rooftop terrace',
    organizer_name: 'Viva Tulum', promo_text: 'Dance class included', discount_tag: null, is_free: false, price_text: '$200 MXN',
  },
  {
    id: 'm6', title: '2x1 Mezcal Thursdays', category: 'promo',
    image_url: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&q=80&auto=format',
    description: 'Every Thursday — all mezcal drinks 2x1 until midnight. Live DJ from 10pm.',
    event_date: '2026-04-10T20:00:00', location: 'Zona Hotelera, Tulum', location_detail: 'El Arco Bar',
    organizer_name: 'El Arco', promo_text: '2x1 all night', discount_tag: '2×1 MEZCAL', is_free: false, price_text: 'From $120 MXN',
  },
];

const LIKED_KEY = 'eventos_liked_ids';
function loadLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); } catch { return new Set(); }
}
function saveLiked(ids: Set<string>) {
  try { localStorage.setItem(LIKED_KEY, JSON.stringify([...ids])); } catch {}
}

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

// ── SINGLE EVENT CARD (full-screen portrait) ──────────────────────────────────
function EventCard({
  event, isActive, onLike, liked, onChat,
}: {
  event: EventItem; isActive: boolean; onLike: () => void; liked: boolean; onChat: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="relative w-full shrink-0 overflow-hidden bg-black"
      style={{ height: '100dvh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      data-testid={`event-card-${event.id}`}
    >
      {/* Background photo with slow Ken Burns zoom */}
      <motion.div
        className="absolute inset-0"
        animate={isActive ? { scale: 1.06 } : { scale: 1 }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        <img
          src={event.image_url || ''}
          alt={event.title}
          className="w-full h-full object-cover"
          onLoad={() => setImgLoaded(true)}
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.6s ease' }}
        />
      </motion.div>

      {/* Gradient overlays — bottom-heavy for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent" />

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3"
            >
              {/* Tags row */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white/80"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {event.category}
                </span>
                {event.discount_tag && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>
                    {event.discount_tag}
                  </span>
                )}
                {event.is_free && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-300"
                    style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }}>
                    FREE
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-3xl font-black text-white leading-[1.05] tracking-tight drop-shadow-lg">
                {event.title}
              </h2>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {event.event_date && (
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-1.5 text-xs text-white/70">
                    <MapPin className="w-3.5 h-3.5 text-orange-400" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.price_text && (
                  <div className="text-xs font-bold text-orange-300">{event.price_text}</div>
                )}
              </div>

              {/* Organizer */}
              {event.organizer_name && (
                <p className="text-[11px] text-white/50 font-medium">by {event.organizer_name}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side action buttons */}
      <div className="absolute right-4 flex flex-col gap-5 items-center"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom,0px))' }}>
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onLike(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`like-event-${event.id}`}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={cn('w-6 h-6', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
            </motion.div>
          </div>
          <span className="text-[10px] text-white/70 font-bold">Like</span>
        </button>

        {/* Chat */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] text-white/70 font-bold">Chat</span>
        </button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EventosFeed() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLiked());
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [chatEvent, setChatEvent] = useState<EventItem | null>(null);

  const { data: rawEvents } = useQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async (): Promise<EventItem[]> => {
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
        return [...MOCK_EVENTS, ...formatted];
      } catch {
        return MOCK_EVENTS;
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: MOCK_EVENTS,
  });

  const allEvents = rawEvents?.length ? rawEvents : MOCK_EVENTS;

  const filteredEvents = useMemo(() =>
    activeCategory === 'all' ? allEvents : allEvents.filter(e => e.category === activeCategory),
    [allEvents, activeCategory]
  );

  // Track scroll position → active index
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Reset scroll when category changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setActiveIdx(0);
    }
  }, [activeCategory]);

  const handleLike = useCallback((id: string) => {
    setLikedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveLiked(next);
      return next;
    });
  }, []);

  const handleOpenChat = useCallback((event: EventItem) => {
    triggerHaptic('light');
    setChatEvent(event);
    setShowGroupChat(true);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black flex flex-col">

      {/* ── TOP HUD ──────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-safe">
        {/* Back button + title */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg tracking-tight">Tulum Events</h1>
            <p className="text-white/50 text-[10px]">{filteredEvents.length} events near you</p>
          </div>
          <div className="text-[11px] text-white/60 font-bold">{activeIdx + 1}/{filteredEvents.length}</div>
        </div>

        {/* Progress bar dots */}
        <div className="flex gap-1 px-4 pb-2">
          {filteredEvents.slice(0, 8).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-500"
              style={{
                height: 2.5,
                background: i === activeIdx
                  ? 'rgba(255,255,255,0.95)'
                  : i < activeIdx
                    ? 'rgba(255,255,255,0.4)'
                    : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                className="flex items-center gap-1.5 px-3 h-7 rounded-full shrink-0 text-[11px] font-black uppercase tracking-wide transition-all active:scale-95"
                style={{
                  background: active ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.4)',
                  color: active ? '#000' : 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(8px)',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── VERTICAL SNAP SCROLL FEED ─────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-scroll"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/50 text-sm">
            No events in this category yet
          </div>
        ) : (
          filteredEvents.map((event, i) => (
            <EventCard
              key={event.id}
              event={event}
              isActive={i === activeIdx}
              liked={likedIds.has(event.id)}
              onLike={() => handleLike(event.id)}
              onChat={() => handleOpenChat(event)}
            />
          ))
        )}
      </div>

      {/* ── GROUP CHAT OVERLAY ────────────────────────────────────────────────── */}
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
