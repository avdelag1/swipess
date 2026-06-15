import { logger } from '@/utils/prodLogger';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
// import { } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { predictivePrefetchEvent } from '@/utils/performance';
import { appToast } from '@/utils/appNotification';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { useVisualTheme } from '@/contexts/VisualThemeContext';
import { useTranslation } from 'react-i18next';

// Modular Components
import { EventCard } from '@/components/events/EventCard';
import { PromoteCTACard } from '@/components/events/PromoteCTACard';
const ShareModal = lazyWithRetry(() => import('@/components/events/ShareModal').then(m => ({ default: m.ShareModal })));
import { ConnectingOverlay } from '@/components/ConnectingOverlay';

// Static Data
import { CATEGORIES, MOCK_EVENTS } from '@/data/eventsData';
import { EventItem } from '@/types/events';

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
  // Deep links to /explore/events/likes should open the likes view directly
  const [activeCategory, setActiveCategory] = useState(() =>
    typeof window !== 'undefined' && window.location.pathname.endsWith('/likes') ? 'likes' : 'all'
  );

  useEffect(() => {
    const color = CATEGORIES.find(c => c.key === activeCategory)?.color || '#f97316';
    setAmbientColor(color);
  }, [activeCategory, setAmbientColor]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventData, setShareEventData] = useState<EventItem | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingTarget, setConnectingTarget] = useState('');

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
      const { error } = isLiked
        ? await supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', id).eq('target_type', 'event')
        : await supabase.from('likes').insert({ user_id: user.id, target_id: id, target_type: 'event' });
      if (error) throw error;
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
      appToast.error("Could not update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['event-likes', user?.id] });
    }
  });

  // 3. Fetch Events (Swipess Optimized)
  const { data: rawEvents, isLoading: eventsLoading, isPending: eventsPending } = useQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async (): Promise<EventItem[]> => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text')
        .order('event_date', { ascending: true })
        .limit(100);
      
      if (error) {
        logger.warn('Supabase events fetch error:', error);
        return [];
      }
      
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
      }));

      return formatted;
    },
    staleTime: 5 * 60 * 1000,
  });

  const allEvents = useMemo(() => {
    const dbEvents = rawEvents || [];
    const seen = new Set(dbEvents.map(e => e.id));
    const validMocks = import.meta.env.DEV
      ? (MOCK_EVENTS || []).filter((m: any) => !seen.has(m.id))
      : [];
    
    const combined = [...dbEvents, ...validMocks];
    
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

  useEffect(() => {
    resetFeedPosition();
  }, [activeCategory, resetFeedPosition]);

  // One extra virtual row at the end: the "Promote My Event" CTA card
  const totalRows = filteredEvents.length + 1;

  useEffect(() => {
    if (activeIdx < totalRows) return;
    resetFeedPosition();
  }, [activeIdx, totalRows, resetFeedPosition]);

  // Scroll & Virtualization
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScroll = () => {
      const height = el.clientHeight || window.innerHeight || 1;
      const newIdx = Math.round(el.scrollTop / height);
      if (newIdx !== activeIdx && newIdx >= 0 && newIdx < totalRows) {
        setActiveIdx(newIdx);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [activeIdx, totalRows]);

  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight || 800,
    overscan: 2,
    initialOffset: 0,
  });

  useEffect(() => {
    const nextBatch = filteredEvents.slice(activeIdx + 1, activeIdx + 6);
    if (nextBatch.length > 0) {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        const urls = nextBatch.map(e => getCardImageUrl(pickEventImage(e) || ''));
        pwaImagePreloader.batchPreload(urls);
      });
    }

    for (let i = 1; i <= 3; i++) {
      const preIdx = (activeIdx + i) % (filteredEvents.length + 1);
      const preId = filteredEvents[preIdx]?.id;
      if (preId) predictivePrefetchEvent(queryClient, preId);
    }
  }, [activeIdx, filteredEvents, queryClient]);

  const handleOpenChat = useCallback(async (event: EventItem) => {
    triggerHaptic('heavy');
    setConnectingTarget(event.organizer_name || 'Event Organizer');
    setIsConnecting(true);

    // Premium pause for the connection animation to resonate
    const clean = (event.organizer_whatsapp || '').replace(/[^+\d]/g, '');
    const msg = encodeURIComponent(`Hi! I'm interested in "${event.title}" — I found it on Swipess 🎉`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_system');
    
    setIsConnecting(false);
  }, []);

  const handleShare = useCallback((event: EventItem) => {
    triggerHaptic('light');
    setShareEventData(event);
    setShowShareModal(true);
  }, []);

  const handleMiddleTap = useCallback((event: EventItem) => {
    triggerHaptic('light');
    navigate(`/explore/events/${event.id}`, { state: { eventData: event } });
  }, [navigate]);

  return (
    <div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-start bg-[#0a0a0b]"
    >
      {/* Atmospheric layer extends behind the fixed chrome so the photo
          content shows through transparent TopBar / BottomNavigation. */}
      <div className="fixed inset-0 bg-[#0a0a0b] -z-10 pointer-events-none" />
      
      {/* Full-screen overlay HUD: back button + category pills, no global header/nav */}
      <div
        className="fixed left-0 right-0 z-[100] transform-gpu px-4"
        style={{ top: 0, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-start gap-4">
          {/* Back button */}
          <button
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className={cn(
              "shrink-0 w-11 h-11 mt-1 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg focus:outline-none focus-visible:outline-none outline-none tap-highlight-transparent",
              isLight ? "bg-white/90 border border-black/5 text-black" : "bg-black/60 border border-white/10 text-white"
            )}
            style={{ backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)' }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1 pb-2 -ml-2 pl-2">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.key;

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
                    if (cat.key === 'likes') navigate('/explore/events/likes');
                  }}
                  className="flex flex-col items-center gap-1.5 shrink-0 transition-transform active:scale-95 group focus:outline-none focus-visible:outline-none outline-none tap-highlight-transparent"
                >
                  <div 
                    className={cn(
                      "w-[60px] h-[60px] rounded-full p-[2px] transition-all duration-300",
                      active 
                        ? "bg-gradient-to-tr from-[#FF4D00] to-[#EB4898] shadow-lg shadow-[#EB4898]/30" 
                        : (isLight ? "bg-black/10" : "bg-white/20")
                    )}
                  >
                    <div className={cn(
                      "w-full h-full rounded-full border-[2.5px] overflow-hidden relative shadow-inner",
                      isLight ? "border-white bg-slate-100" : "border-[#0a0a0b] bg-[#1a1a1b]"
                    )}>
                      {cat.img ? (
                         <img 
                           src={cat.img} 
                           alt={cat.label} 
                           className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                         />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <cat.icon className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-white/40")} />
                         </div>
                      )}
                      {/* Dark overlay for inactive */}
                      {!active && (
                        <div className={cn(
                          "absolute inset-0 transition-colors",
                          isLight ? "bg-white/40" : "bg-black/50"
                        )} />
                      )}
                    </div>
                  </div>
                  <span 
                    className={cn(
                      "text-[10px] font-bold tracking-wide w-[64px] text-center truncate",
                      active ? (isLight ? "text-black" : "text-white") : (isLight ? "text-black/60 font-semibold" : "text-white/60 font-semibold")
                    )}
                    style={{ textShadow: active && !isLight ? '0 2px 8px rgba(0,0,0,0.8)' : undefined }}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>


      </div>

      {/* Main Feed */}
      {(eventsLoading || eventsPending) && !rawEvents ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-32">
          <div className="w-full max-w-sm space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[72vh] max-h-[640px] rounded-[28px] border border-white/10 bg-white/5 animate-pulse"
                style={{ opacity: 1 - (n - 1) * 0.2 }}
              />
            ))}
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-32">
          <div className="w-full max-w-sm rounded-[30px] px-6 py-7 text-center" style={hudGlassStyle}>
            <p className={cn("text-lg font-black tracking-tight", isLight ? "text-foreground" : "text-white")}> 
              {activeCategory === 'likes' ? t('events.noLikedEvents') : t('events.noEvents')}
            </p>
            <p className={cn("mt-2 text-sm", isLight ? "text-foreground/70" : "text-white/70")}>
              {t('events.noEventsDesc')}
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
              {t('events.allEvents')}
            </button>
          </div>
        </div>
      ) : (
        <div 
          ref={parentRef} 
          className="w-full h-[100dvh] overflow-y-auto snap-y snap-mandatory no-scrollbar"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
            scrollSnapStop: 'always',
          } as React.CSSProperties}
        >
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const isPromoteRow = virtualRow.index === filteredEvents.length;
              const event = filteredEvents[virtualRow.index];
              if (!isPromoteRow && !event) return null;

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
                  {isPromoteRow ? (
                    <PromoteCTACard onPromote={() => navigate('/client/advertise')} />
                  ) : (
                    <EventCard
                      event={event}
                      imageUrl={pickEventImage(event)}
                      liked={likedIds.has(event.id)}
                      activeColor={CATEGORIES.find(c => c.key === event.category)?.color || '#f97316'}
                      onLike={() => likeMutation.mutate({ id: event.id, isLiked: likedIds.has(event.id) })}
                      onChat={() => handleOpenChat(event)}
                      onShare={() => handleShare(event)}
                      onMiddleTap={() => handleMiddleTap(event)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {shareEventData && (
        <Suspense fallback={null}><ShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          event={shareEventData as any}
        /></Suspense>
      )}

      <ConnectingOverlay 
        isOpen={isConnecting}
        recipientName={connectingTarget}
        statusText="Establishing premium connection..."
      />
    </div>
  );
}
