import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, ArrowLeft, Megaphone, Pause, Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { predictivePrefetchEvent } from '@/utils/performance';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

// Modular Components
import { EventCard } from '@/components/events/EventCard';
import { PromoteCTACard } from '@/components/events/PromoteCTACard';
import { ShareModal } from '@/components/events/ShareModal';

// Static Data
import { CATEGORIES, MOCK_EVENTS } from '@/data/eventsData';
import { EventItem } from '@/types/events';

const AUTOPLAY_DURATION = 6000;

export default function EventosFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventData, setShareEventData] = useState<EventItem | null>(null);

  // Auto-play state
  const [autoPlay, setAutoPlay] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch Likes
  const { data: likedIds = new Set<string>() } = useQuery({
    queryKey: ['event-likes', user?.id],
    queryFn: async () => {
      if (!user?.id) return new Set<string>();
      const { data } = await supabase
        .from('likes')
        .select('target_id')
        .eq('user_id', user.id)
        .eq('target_type', 'event');
      return new Set((data || []).map(l => l.target_id));
    },
    enabled: !!user?.id,
  });

  // 2. Like Mutation
  const likeMutation = useMutation({
    mutationFn: async ({ id, isLiked }: { id: string; isLiked: boolean }) => {
      if (!user?.id) throw new Error("Not logged in");
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', id).eq('target_type', 'event');
      } else {
        await supabase.from('likes').insert({ user_id: user.id, target_id: id, target_type: 'event' });
      }
    },
    onMutate: async ({ id, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['event-likes', user?.id] });
      const previous = queryClient.getQueryData<Set<string>>(['event-likes', user?.id]);
      queryClient.setQueryData<Set<string>>(['event-likes', user?.id], (prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(id); else next.add(id);
        return next;
      });
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['event-likes', user?.id], context.previous);
      toast.error("Could not update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event-likes', user?.id] });
    }
  });

  // 3. Fetch Events (Zenith Optimized)
  const { data: rawEvents } = useQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async (): Promise<EventItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, category, image_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text')
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
        organizer_whatsapp: ev.organizer_whatsapp || null,
        promo_text: ev.promo_text || null,
        discount_tag: ev.discount_tag || null,
        is_free: !!ev.is_free,
        price_text: ev.price_text || null,
      }));

      // Zenith: Only show real events if they exist, otherwise use mocks for a "full" feel
      return formatted.length > 0 ? formatted : MOCK_EVENTS;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: MOCK_EVENTS,
  });

  const allEvents = rawEvents || MOCK_EVENTS;

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return allEvents;
    if (activeCategory === 'likes') return allEvents.filter(e => likedIds.has(e.id));
    return allEvents.filter(e => e.category === activeCategory);
  }, [allEvents, activeCategory, likedIds]);

  // 4. Scroll & Virtualization
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const height = el.clientHeight || window.innerHeight || 1;
      const newIdx = Math.round(el.scrollTop / height);
      if (newIdx !== activeIdx && newIdx >= 0 && newIdx <= filteredEvents.length) {
        setActiveIdx(newIdx);
        setAnimKey(k => k + 1);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [activeIdx, filteredEvents.length]);

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length + 1,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 2,
  });

  // 5. Auto-play Logic
  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      setAnimKey(k => k + 1);
    }, 3000);
  }, []);

  useEffect(() => {
    const el = parentRef.current;
    if (!el || !autoPlay || isPaused || filteredEvents.length <= 1) return;

    const timeout = setTimeout(() => {
      const height = el.clientHeight || window.innerHeight || 1;
      if (activeIdx < filteredEvents.length) {
        const nextIdx = activeIdx + 1;
        el.scrollTo({ top: nextIdx * height, behavior: 'smooth' });
        
        // Predictive prefetch next 3 items
        for (let i = 1; i <= 3; i++) {
          const preIdx = (nextIdx + i) % (filteredEvents.length + 1);
          const preId = filteredEvents[preIdx]?.id;
          if (preId) predictivePrefetchEvent(queryClient, preId);
        }
      }
      setAnimKey(k => k + 1);
    }, AUTOPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [autoPlay, isPaused, activeIdx, filteredEvents.length, animKey, queryClient]);

  // Handlers
  const handleOpenChat = useCallback((event: EventItem) => {
    triggerHaptic('light');
    const clean = (event.organizer_whatsapp || '').replace(/[^+\d]/g, '');
    const msg = encodeURIComponent(`Hi! I'm interested in "${event.title}" — I found it on Local Jarvis 🎉`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  }, []);

  const handleShare = useCallback((event: EventItem) => {
    triggerHaptic('light');
    setShareEventData(event);
    setShowShareModal(true);
  }, []);

  const handleMiddleTap = useCallback((event: EventItem) => {
    triggerHaptic('light');
    navigate(`/explore/eventos/${event.id}`, { state: { eventData: event } });
  }, [navigate]);

  return (
    <div className={cn("relative w-full h-[100dvh] overflow-hidden flex flex-col", isLight ? "bg-white" : "bg-black")}>
      
      {/* Zenith HUD */}
      <div className="absolute top-0 left-0 right-0 z-[100] pt-[calc(env(safe-area-inset-top,0px)+32px)]">
        <motion.div className="flex items-center gap-3 px-6 pt-16 pb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center shadow-xl active:scale-90 transition-transform"
            style={{ background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,16,0.6)', backdropFilter: 'blur(24px)', border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)' }}>
            <ArrowLeft className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={cn("font-black font-brand text-xl tracking-tight leading-tight truncate", isLight ? "text-black" : "text-white")}>
              {filteredEvents[activeIdx]?.title || 'Tulum Events'}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setAutoPlay(p => !p)} className={cn("w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border", isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/10")}>
              {autoPlay ? <Pause className="w-4 h-4 text-orange-400" /> : <Play className="w-4 h-4 text-orange-400 ml-0.5" />}
            </button>
            <button onClick={() => navigate('/client/advertise')} className="px-4 h-10 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}>
              Promote
            </button>
          </div>
        </motion.div>

        {/* Categories */}
        <div className="flex gap-2.5 px-4 pt-4 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={cn("relative flex flex-col items-center justify-center w-24 h-24 rounded-[1.5rem] shrink-0 overflow-hidden border-2 transition-all", active ? "border-orange-500 scale-105" : "border-transparent opacity-70")}>
                <img src={cat.img} className="absolute inset-0 w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-20 flex flex-col items-center gap-1">
                  <Icon className={cn("w-6 h-6", active ? "text-orange-400" : "text-white")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{cat.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feed */}
      <div ref={parentRef} className="w-full h-full overflow-y-scroll scroll-smooth no-scrollbar" style={{ scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLast = virtualRow.index === filteredEvents.length;
            const event = filteredEvents[virtualRow.index];
            return (
              <div key={virtualRow.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100dvh', transform: `translateY(${virtualRow.start}px)`, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                {isLast ? (
                  <PromoteCTACard onPromote={() => navigate('/client/advertise')} />
                ) : (
                  <EventCard
                    event={event}
                    isActive={virtualRow.index === activeIdx}
                    isPaused={isPaused}
                    animKey={animKey}
                    onTickComplete={() => {}} // Controlled by main feed effect
                    liked={likedIds.has(event.id)}
                    onLike={() => likeMutation.mutate({ id: event.id, isLiked: likedIds.has(event.id) })}
                    onChat={() => handleOpenChat(event)}
                    onShare={() => handleShare(event)}
                    onMiddleTap={() => handleMiddleTap(event)}
                    onNextEvent={() => parentRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
                    onPrevEvent={() => parentRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showShareModal && shareEventData && <ShareModal event={shareEventData} open={showShareModal} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
