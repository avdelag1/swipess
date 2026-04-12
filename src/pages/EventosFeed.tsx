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
import { useVisualTheme } from '@/contexts/VisualThemeContext';

// Modular Components
import { EventCard } from '@/components/events/EventCard';
import { ShareModal } from '@/components/events/ShareModal';

// Static Data
import { CATEGORIES, MOCK_EVENTS } from '@/data/eventsData';
import { EventItem } from '@/types/events';

const AUTOPLAY_DURATION = 6000;

export default function EventosFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { setAmbientColor } = useVisualTheme();
  const isLight = theme === 'light';
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const color = CATEGORIES.find(c => c.key === activeCategory)?.color || '#f97316';
    setAmbientColor(color);
  }, [activeCategory, setAmbientColor]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventData, setShareEventData] = useState<EventItem | null>(null);

  // Auto-play state
  const [autoPlay, setAutoPlay] = useState(false);
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

      return formatted.length > 0 ? formatted : MOCK_EVENTS;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: MOCK_EVENTS,
  });

  const allEvents = useMemo(() => {
    const real = rawEvents || [];
    const mockUnique = MOCK_EVENTS.filter(m => !real.some(r => r.id === m.id));
    const combined = [...real, ...mockUnique];
    
    if (combined.length > 0 && typeof window !== 'undefined') {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        const first3 = combined.slice(0, 3).map(e => getCardImageUrl(e.image_url || ''));
        pwaImagePreloader.batchPreload(first3);
      });
    }
    return combined;
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return allEvents;
    if (activeCategory === 'likes') return allEvents.filter(e => likedIds.has(e.id));
    return allEvents.filter(e => e.category === activeCategory);
  }, [allEvents, activeCategory, likedIds]);

  // Scroll & Virtualization
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
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight || 800,
    overscan: 2,
    initialOffset: 0,
  });

  // Auto-play Logic
  const _pauseAutoPlay = useCallback(() => {
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
      if (activeIdx < filteredEvents.length - 1) {
        const nextIdx = activeIdx + 1;
        el.scrollTo({ top: nextIdx * height, behavior: 'smooth' });
      }
      setAnimKey(k => k + 1);
    }, AUTOPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [autoPlay, isPaused, activeIdx, filteredEvents.length, animKey]);

  useEffect(() => {
    const nextBatch = filteredEvents.slice(activeIdx + 1, activeIdx + 6);
    if (nextBatch.length > 0) {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        const urls = nextBatch.map(e => getCardImageUrl(e.image_url || ''));
        pwaImagePreloader.batchPreload(urls);
      });
    }

    for (let i = 1; i <= 3; i++) {
      const preIdx = (activeIdx + i) % (filteredEvents.length + 1);
      const preId = filteredEvents[preIdx]?.id;
      if (preId) predictivePrefetchEvent(queryClient, preId);
    }
  }, [activeIdx, filteredEvents, queryClient]);

  const handleOpenChat = useCallback((event: EventItem) => {
    triggerHaptic('light');
    const clean = (event.organizer_whatsapp || '').replace(/[^+\d]/g, '');
    const msg = encodeURIComponent(`Hi! I'm interested in "${event.title}" — I found it on Swipess 🎉`);
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
    <div className={cn("relative w-full h-full min-h-[100dvh] flex flex-col bg-black overflow-hidden")}>
      <div className="absolute inset-0 bg-[#0a0a0b] -z-10" />
      
      {/* Consolidated Immersive HUD (Single Row) */}
      <div 
        className="absolute left-0 right-0 z-[100] transform-gpu px-4 pt-8"
        style={{ top: 'calc(var(--safe-top, 6px))' }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className={cn(
              "w-12 h-12 rounded-2xl border backdrop-blur-3xl flex items-center justify-center transition-all shadow-2xl shrink-0",
              isLight ? "bg-white/80 border-slate-200 text-slate-900" : "bg-black/60 border-white/10 text-white"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.key;
              const catColor = cat.color || '#f97316';
              
              return (
                <button 
                  key={cat.key} 
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveCategory(cat.key);
                    if (cat.key === 'likes') navigate('/explore/eventos/likes');
                  }} 
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl shrink-0 transition-all duration-300 border relative overflow-hidden group h-12",
                    active 
                      ? "scale-105 shadow-xl shadow-black/20" 
                      : "opacity-70 hover:opacity-100 backdrop-blur-md"
                  )}
                  style={{
                    backgroundColor: active ? catColor : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)',
                    borderColor: active ? 'transparent' : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon 
                    className={cn("w-4 h-4 transition-all duration-300 relative z-10", active ? "scale-110" : "text-white/40")} 
                    style={{ color: active ? '#fff' : undefined }} 
                  />
                  <span 
                    className={cn("text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300 relative z-10", active ? "" : "text-white/40")}
                    style={{ color: active ? '#fff' : undefined }}
                  >
                    {cat.label}
                  </span>
                  
                  {active && (
                    <motion.div 
                      layoutId="active-pill-shimmer"
                      className="absolute inset-0 z-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        <div 
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-[160px] blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 z-[-1]"
          style={{ 
            background: `radial-gradient(circle, ${CATEGORIES.find(c => c.key === activeCategory)?.color || '#f97316'} 0%, transparent 70%)` 
          }}
        />
      </div>

      {/* Main Feed */}
      <div 
        ref={parentRef} 
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar overscroll-contain touch-pan-y"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const event = filteredEvents[virtualRow.index];
            return (
              <div 
                key={virtualRow.key} 
                className="absolute top-0 left-0 w-full snap-start snap-always"
                style={{ 
                  height: '100dvh', 
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <EventCard
                  event={event}
                  isActive={virtualRow.index === activeIdx}
                  isPaused={isPaused}
                  animKey={animKey}
                  onTickComplete={() => {}} 
                  liked={likedIds.has(event.id)}
                  activeColor={CATEGORIES.find(c => c.key === event.category)?.color || '#f97316'}
                  onLike={() => likeMutation.mutate({ id: event.id, isLiked: likedIds.has(event.id) })}
                  onChat={() => handleOpenChat(event)}
                  onShare={() => handleShare(event)}
                  onMiddleTap={() => handleMiddleTap(event)}
                  onNextEvent={() => parentRef.current?.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
                  onPrevEvent={() => parentRef.current?.scrollBy({ top: -window.innerHeight, behavior: 'smooth' })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {showShareModal && shareEventData && <ShareModal event={shareEventData} open={showShareModal} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
