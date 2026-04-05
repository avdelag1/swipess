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

  // 🏎️ SPEED OF LIGHT: Force high-fidelity mock data to ensure "sentient" breathing photos always exist
  const allEvents = useMemo(() => {
    const real = rawEvents || [];
    const mockUnique = MOCK_EVENTS.filter(m => !real.some(r => r.id === m.id));
    const combined = [...real, ...mockUnique];
    
    // 🚀 WARP SPEED: Pre-warm first 3 photos immediately on data ready
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
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 2,
  });

  // 5. Auto-play Logic
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

  // 🏎️ SPEED OF LIGHT: Aggressive Image Warmup
  useEffect(() => {
    // Prefetch next 5 items' images whenever index changes
    const nextBatch = filteredEvents.slice(activeIdx + 1, activeIdx + 6);
    if (nextBatch.length > 0) {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        const urls = nextBatch.map(e => getCardImageUrl(e.image_url || ''));
        pwaImagePreloader.batchPreload(urls);
      });
    }

    // Also prefetch data for next 3 items
    for (let i = 1; i <= 3; i++) {
      const preIdx = (activeIdx + i) % (filteredEvents.length + 1);
      const preId = filteredEvents[preIdx]?.id;
      if (preId) predictivePrefetchEvent(queryClient, preId);
    }
  }, [activeIdx, filteredEvents, queryClient]);

  // Handlers
  const handleOpenChat = useCallback((event: EventItem) => {
    triggerHaptic('light');
    const clean = (event.organizer_whatsapp || '').replace(/[^+\d]/g, '');
    const msg = encodeURIComponent(`Hi! I'm interested in "${event.title}" — I found it on SwipesS 🎉`);
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
      
      {/* Immersive Controls (Floating below global HUD) */}
      <div className="absolute top-24 left-0 right-0 z-[100]">


        {/* Categories: Modern Horizontal Pill Selection */}
        <div className="relative z-50">
          <div className="flex gap-3 px-6 pt-3 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
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
                    // If likes is clicked, navigate explicitly
                    if (cat.key === 'likes') navigate('/explore/eventos/likes');
                  }} 
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-[1.25rem] shrink-0 transition-all duration-300 border backdrop-blur-md relative overflow-hidden group",
                    active 
                      ? "scale-105 shadow-lg" 
                      : "opacity-80 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: active ? `${catColor}15` : isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)',
                    borderColor: active ? `${catColor}40` : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon className={cn("w-3.5 h-3.5 transition-colors duration-300", active ? "" : isLight ? "text-black/40" : "text-white/40")} style={{ color: active ? catColor : undefined }} />
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.1em] transition-colors duration-300", active ? "" : isLight ? "text-black/40" : "text-white/40")} style={{ color: active ? catColor : undefined }}>
                    {cat.label}
                  </span>
                  
                  {active && (
                    <motion.div 
                      layoutId="active-pill-glow"
                      className="absolute inset-0 z-[-1] blur-md opacity-20"
                      style={{ background: catColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Adaptive Ambient Glow: Changes color based on active category */}
          <div 
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140%] h-[160px] blur-[100px] opacity-20 pointer-events-none transition-colors duration-1000 z-[-1]"
            style={{ 
              background: `radial-gradient(circle, ${CATEGORIES.find(c => c.key === activeCategory)?.color || '#f97316'} 0%, transparent 70%)` 
            }}
          />
        </div>
      </div>

      {/* Main Feed */}
      <div ref={parentRef} className="w-full h-full overflow-y-scroll scroll-smooth no-scrollbar" style={{ scrollSnapType: 'y mandatory', overscrollBehavior: 'contain' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const event = filteredEvents[virtualRow.index];
            return (
              <div key={virtualRow.key} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100dvh', transform: `translateY(${virtualRow.start}px)`, scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                <EventCard
                  event={event}
                  isActive={virtualRow.index === activeIdx}
                  isPaused={isPaused}
                  animKey={animKey}
                  onTickComplete={() => {}} // Controlled by main feed effect
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
