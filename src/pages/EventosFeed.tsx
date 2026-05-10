import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, ArrowLeft, Megaphone, Pause, Play, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { predictivePrefetchEvent } from '@/utils/performance';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useStartConversation } from '@/hooks/useConversations';
import useAppTheme from '@/hooks/useAppTheme';
import { useVisualTheme } from '@/contexts/VisualThemeContext';
import { useTranslation } from 'react-i18next';

// Modular Components
import { EventCard } from '@/components/events/EventCard';
import { ShareModal } from '@/components/events/ShareModal';

// Static Data
import { CATEGORIES, MOCK_EVENTS } from '@/data/eventsData';
import { EventItem } from '@/types/events';



const AUTOPLAY_DURATION = 6000;

function pickEventImage(ev: Partial<EventItem>): string | null {
  if (typeof ev.image_url === 'string' && ev.image_url.trim()) return ev.image_url;
  const gallery = Array.isArray(ev.image_urls) ? ev.image_urls : [];
  for (const item of gallery) {
    if (typeof item === 'string' && item.trim()) return item;
    if (item && typeof item === 'object') {
      const url = (item as any).url || (item as any).image_url || (item as any).src;
      if (typeof url === 'string' && url.trim()) return url;
    }
  }
  return null;
}

export default function EventosFeed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { setAmbientColor } = useVisualTheme();
  const { t } = useTranslation();
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
  
  const startConversation = useStartConversation();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  // Auto-play state
  const [autoPlay, setAutoPlay] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hudGlassStyle: React.CSSProperties = {
    background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,11,0.72)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.08)',
    boxShadow: isLight
      ? '0 8px 32px rgba(0,0,0,0.08)'
      : '0 12px 40px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.06)',
  };

  const resetFeedPosition = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = parentRef.current;
    setActiveIdx(0);
    setAnimKey((key) => key + 1);

    if (!el) return;

    if (behavior === 'auto') {
      el.scrollTop = 0;
      return;
    }

    el.scrollTo({ top: 0, behavior });
  }, []);

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

  // 3. Fetch Events (Swipess Optimized)
  const { data: rawEvents } = useQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async (): Promise<EventItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_by')
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      
      const formatted: EventItem[] = (data || []).map((ev: any) => ({
        id: ev.id,
        title: ev.title || 'Untitled Event',
        description: ev.description || null,
        category: ev.category || 'all',
        image_url: pickEventImage(ev),
        image_urls: Array.isArray(ev.image_urls) ? ev.image_urls : [],
        video_url: ev.video_url || null,
        event_date: ev.event_date || null,
        location: ev.location || null,
        location_detail: ev.location_detail || null,
        organizer_name: ev.organizer_name || null,
        organizer_whatsapp: ev.organizer_whatsapp || null,
        promo_text: ev.promo_text || null,
        discount_tag: ev.discount_tag || null,
        is_free: !!ev.is_free,
        price_text: ev.price_text || null,
        created_by: ev.created_by || null,
      }));

      // MERGE: Always include mock events at the end for rich content during testing
      return [...formatted, ...MOCK_EVENTS];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });

  const allEvents = useMemo(() => {
    const combined = rawEvents || [];
    
    if (combined.length > 0 && typeof window !== 'undefined') {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        const first3 = combined.slice(0, 3).map(e => getCardImageUrl(pickEventImage(e) || ''));
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

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 1,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      if (idx !== activeIdx) {
        setActiveIdx(idx);
        setAnimKey(k => k + 1);
        triggerHaptic('light');

        const nextEv = filteredEvents[idx + 1];
        if (nextEv) {
          predictivePrefetchEvent(nextEv);
        }
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [activeIdx, filteredEvents]);

  const handleOpenChat = async (event: EventItem) => {
    if (!user) {
      toast.error("Please sign in to message the organizer");
      return;
    }
    if (!event.created_by) {
      toast.error("Organizer contact not available");
      return;
    }
    
    setIsCreatingConversation(true);
    try {
      await startConversation(event.created_by, undefined);
      navigate('/messages');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const handleShare = (event: EventItem) => {
    setShareEventData(event);
    setShowShareModal(true);
  };

  const handleMiddleTap = (event: EventItem) => {
    navigate(`/explore/eventos/${event.id}`);
  };

  return (
    <div className={cn("relative h-screen w-full flex flex-col bg-background overflow-hidden", isLight ? "light" : "dark")}>
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-12 pointer-events-none">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto active:scale-90 transition-transform"
          style={hudGlassStyle}
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <div className="flex gap-2 pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setAutoPlay(!autoPlay)}
            className={cn("w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform", autoPlay && "bg-primary text-white border-primary shadow-lg shadow-primary/20")}
            style={autoPlay ? {} : hudGlassStyle}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/owner/promote-event')}
            className="h-10 px-4 rounded-full flex items-center gap-2 active:scale-90 transition-transform font-bold text-xs uppercase tracking-widest"
            style={hudGlassStyle}
          >
            <Megaphone className="w-4 h-4 text-orange-500" />
            {t('eventos.featured')}
          </motion.button>
        </div>
      </div>

      {/* Category Strip */}
      <div className="absolute top-28 left-0 right-0 z-40 px-6 overflow-hidden">
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;
              const Icon = cat.icon;
              const catColor = cat.color;

              return (
                <button 
                  key={cat.key} 
                  onClick={() => {
                    triggerHaptic('light');
                    if (cat.key === activeCategory) {
                      resetFeedPosition('smooth');
                      return;
                    }
                    setActiveCategory(cat.key);
                    if (cat.key === 'likes') navigate('/explore/eventos/likes');
                  }} 
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl shrink-0 transition-all duration-300 border relative overflow-hidden group h-12",
                    active 
                      ? "scale-105 shadow-xl shadow-black/20" 
                      : "opacity-80 hover:opacity-100"
                  )}
                  style={{
                    borderColor: active ? `${catColor}90` : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'),
                  }}
                >
                  {/* Category Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={cat.img} 
                      alt="" 
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-500",
                        active ? "scale-110 blur-[1px]" : "scale-100 grayscale-[0.5] opacity-40"
                      )}
                    />
                    <div 
                      className="absolute inset-0 z-10"
                      style={{
                        background: active 
                          ? `linear-gradient(135deg, ${catColor}cc, ${catColor}99)`
                          : (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(10,10,11,0.82)')
                      }}
                    />
                  </div>

                  <Icon 
                    className={cn("w-4 h-4 transition-all duration-300 relative z-20", active ? "scale-110" : (isLight ? "text-black/60" : "text-white/60"))} 
                    style={{ color: active ? '#fff' : undefined }} 
                  />
                  <span 
                    className={cn("text-[11px] font-black uppercase tracking-[0.12em] transition-all duration-300 relative z-20", active ? "" : (isLight ? "text-black/60" : "text-white/60"))}
                    style={{ color: active ? '#fff' : undefined }}
                  >
                    {cat.label}
                  </span>
                  
                  {active && (
                    <motion.div 
                      layoutId="active-pill-shimmer"
                      className="absolute inset-0 z-30 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"
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
      {filteredEvents.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm rounded-[30px] px-6 py-7 text-center"
            style={hudGlassStyle}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <Sparkles className="w-8 h-8 text-primary/40" />
            </div>
            <p className={cn("text-lg font-black tracking-tight", isLight ? "text-foreground" : "text-white")}> 
              {activeCategory === 'likes' ? t('eventos.noLikedEvents') : t('eventos.noEvents')}
            </p>
            <p className={cn("mt-2 text-sm", isLight ? "text-foreground/70" : "text-white/70")}>
              {t('eventos.noEventsDesc')}
            </p>
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                "mt-5 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black tracking-tight transition-transform active:scale-[0.98]",
                isLight ? "text-black" : "text-white"
              )}
              style={{
                ...hudGlassStyle,
                background: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(255,255,255,0.12)',
              }}
            >
              {t('eventos.allEvents')}
            </button>
          </motion.div>
        </div>
      ) : (
        <div 
          ref={parentRef} 
          className="w-full flex-1 snap-y snap-mandatory overflow-y-auto no-scrollbar"
        >
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const event = filteredEvents[virtualRow.index];
              if (!event) return null;

              return (
                <div 
                  key={virtualRow.key} 
                  className="absolute top-0 left-0 w-full snap-start snap-always"
                  style={{ 
                    height: '100vh', 
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
                    onNextEvent={() => parentRef.current?.scrollBy({ top: parentRef.current?.clientHeight || window.innerHeight, behavior: 'smooth' })}
                    onPrevEvent={() => parentRef.current?.scrollBy({ top: -(parentRef.current?.clientHeight || window.innerHeight), behavior: 'smooth' })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showShareModal && shareEventData && <ShareModal event={shareEventData} open={showShareModal} onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
