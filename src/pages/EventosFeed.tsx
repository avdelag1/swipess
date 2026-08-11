import { logger } from '@/utils/prodLogger';
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getParentRoute } from '@/utils/sectionNavigation';
// import { } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { predictivePrefetchEvent, prefetchImage, prefetchVideo } from '@/utils/performance';
import { getNetworkProfile } from '@/utils/networkAware';
import { appToast } from '@/utils/appNotification';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { useVisualTheme } from '@/contexts/VisualThemeContext';
import { useTranslation } from 'react-i18next';
import { hideChrome } from '@/hooks/useChromeReveal';
import { trackEventEngagement, inferContactIntent } from '@/utils/trackEventEngagement';
import { EVENTOS_QUERY_KEY } from '@/utils/prefetchEventosFeed';

// Modular Components
import { EventCard } from '@/components/events/EventCard';
import { EventCategoryCircle } from '@/components/events/EventCategoryCircle';
import { prefetchEventCategoryPhotosImmediate } from '@/utils/prefetchEventCategoryPhotos';
import { PromoteCTACard } from '@/components/events/PromoteCTACard';
import { CATEGORIES, MOCK_EVENTS } from '@/data/eventsData';
import { EventItem } from '@/types/events';

const ShareModal = lazyWithRetry(() => import('@/components/events/ShareModal').then(m => ({ default: m.ShareModal })));

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Exact event from Quick Filter (or any deep link) — never Insights
  const targetEventId = useMemo(() => {
    const fromQuery = searchParams.get('eventId');
    if (fromQuery) return fromQuery;
    const fromState = (location.state as { eventId?: string } | null)?.eventId;
    return fromState || null;
  }, [searchParams, location.state]);
  const pendingTargetRef = useRef<string | null>(targetEventId);
  const skipCategoryResetRef = useRef(!!targetEventId);
  const [feedReady, setFeedReady] = useState(!targetEventId);

  useEffect(() => {
    pendingTargetRef.current = targetEventId;
    if (targetEventId) {
      skipCategoryResetRef.current = true;
      setFeedReady(false);
    }
  }, [targetEventId]);

  useEffect(() => {
    const color = CATEGORIES.find(c => c.key === activeCategory)?.color || '#f97316';
    setAmbientColor(color);
  }, [activeCategory, setAmbientColor]);

  const isFeedVisible =
    location.pathname === '/explore/events' || location.pathname === '/explore/events/';

  useEffect(() => {
    hideChrome();
  }, [activeIdx, isFeedVisible]);

  useEffect(() => {
    hideChrome();
    prefetchEventCategoryPhotosImmediate();
    return () => hideChrome();
  }, []);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEventData, setShareEventData] = useState<EventItem | null>(null);

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
      if (!isLiked) {
        const ev = queryClient.getQueryData<EventItem[]>(EVENTOS_QUERY_KEY)?.find((e) => e.id === id);
        trackEventEngagement({
          action: 'tap_like',
          source: 'feed',
          eventId: id,
          organizerName: ev?.organizer_name,
          organizerWhatsapp: ev?.organizer_whatsapp,
        });
      }
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
  const { data: rawEvents, isLoading: eventsLoading, isPending: eventsPending, isError: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: EVENTOS_QUERY_KEY,
    queryFn: async (): Promise<EventItem[]> => {
      const withAudio =
        'id, title, description, category, image_url, image_urls, video_url, video_audio_enabled, background_music_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';
      const base =
        'id, title, description, category, image_url, image_urls, video_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text, created_at';

      let { data, error } = await supabase
        .from('events')
        .select(withAudio)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error && /video_audio_enabled|background_music_url|42703/i.test(error.message || '')) {
        ({ data, error } = await supabase
          .from('events')
          .select(base)
          .order('created_at', { ascending: false })
          .limit(100));
      }
      
      if (error) {
        logger.warn('Supabase events fetch error:', error);
        throw error;
      }
      
      const formatted: EventItem[] = (data || []).map((ev: any) => ({
        id: ev.id,
        title: ev.title || 'Untitled Event',
        description: ev.description || null,
        category: ev.category || 'all',
        image_url: pickEventImage(ev),
        image_urls: Array.isArray(ev.image_urls) ? ev.image_urls : [],
        video_url: ev.video_url || null,
        video_audio_enabled: !!ev.video_audio_enabled,
        background_music_url: ev.background_music_url || null,
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
    const validMocks = (MOCK_EVENTS || []).filter((m: any) => !seen.has(m.id));
    
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
    // Don't yank to top while landing on a deep-linked event
    if (pendingTargetRef.current) return;
    if (skipCategoryResetRef.current) {
      skipCategoryResetRef.current = false;
      return;
    }
    resetFeedPosition();
  }, [activeCategory, resetFeedPosition]);

  // One extra virtual row at the end: the "Promote My Event" CTA card
  const totalRows = filteredEvents.length + 1;

  const warmRadius = useMemo(() => {
    const depth = getNetworkProfile().prefetchDepth;
    return depth >= 3 ? 2 : 1;
  }, [activeIdx, filteredEvents.length]);

  // Jump straight to the Quick Filter event before paint (no Event A flash)
  useLayoutEffect(() => {
    const targetId = pendingTargetRef.current;
    if (!targetId) {
      setFeedReady(true);
      return;
    }
    if (!filteredEvents.length || !parentRef.current) return;

    const idx = filteredEvents.findIndex((e) => e.id === targetId);
    if (idx < 0) {
      pendingTargetRef.current = null;
      skipCategoryResetRef.current = false;
      setFeedReady(true);
      return;
    }

    skipCategoryResetRef.current = true;
    if (activeCategory !== 'all') setActiveCategory('all');
    setActiveIdx(idx);
    const height = parentRef.current.clientHeight || window.innerHeight || 1;
    parentRef.current.scrollTop = idx * height;
    pendingTargetRef.current = null;
    setFeedReady(true);

    // Clean URL without remounting / reloading
    if (searchParams.get('eventId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('eventId');
      setSearchParams(next, { replace: true });
    }
  }, [filteredEvents, searchParams, setSearchParams, activeCategory]);

  useEffect(() => {
    if (activeIdx < totalRows) return;
    if (pendingTargetRef.current) return;
    resetFeedPosition();
  }, [activeIdx, totalRows, resetFeedPosition]);

  // Scroll & Virtualization — rAF coalesce to avoid per-pixel React work
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    let raf = 0;

    const handleScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const height = el.clientHeight || window.innerHeight || 1;
        const newIdx = Math.round(el.scrollTop / height);
        setActiveIdx((prev) => {
          if (newIdx === prev || newIdx < 0 || newIdx >= totalRows) return prev;
          return newIdx;
        });
      });
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [totalRows]);

  // Smart preload: current + next + prev (+ one more when network allows)
  useEffect(() => {
    if (!filteredEvents.length) return;
    const profile = getNetworkProfile();
    const ahead = Math.max(1, Math.min(profile.prefetchDepth, 3));
    const indices = new Set<number>();
    indices.add(activeIdx);
    for (let i = 1; i <= ahead; i++) {
      if (activeIdx + i < filteredEvents.length) indices.add(activeIdx + i);
      if (activeIdx - i >= 0) indices.add(activeIdx - i);
    }

    indices.forEach((i) => {
      const ev = filteredEvents[i];
      if (!ev) return;
      const img = pickEventImage(ev);
      if (img) prefetchImage(img, i === activeIdx || i === activeIdx + 1);
      if (ev.video_url && (i === activeIdx + 1 || i === activeIdx - 1 || (profile.enableVideoPrefetch && Math.abs(i - activeIdx) <= 2))) {
        prefetchVideo(ev.video_url);
      }
      if (Math.abs(i - activeIdx) <= 2) predictivePrefetchEvent(queryClient, ev.id);
    });
  }, [activeIdx, filteredEvents, queryClient]);

  // Impression when a card becomes active (only while feed is visible)
  useEffect(() => {
    if (!isFeedVisible) return;
    const ev = filteredEvents[activeIdx];
    if (!ev?.id) return;
    trackEventEngagement({
      action: 'impression',
      source: 'feed',
      eventId: ev.id,
      organizerName: ev.organizer_name,
      organizerWhatsapp: ev.organizer_whatsapp,
      metadata: { index: activeIdx },
    });
  }, [activeIdx, filteredEvents, isFeedVisible]);

  const handleOpenChat = useCallback(async (event: EventItem) => {
    triggerHaptic('heavy');
    const clean = (event.organizer_whatsapp || '').replace(/[^+\d]/g, '');
    if (!clean) {
      appToast.error('No WhatsApp number for this event');
      return;
    }
    const intent = inferContactIntent(event);
    trackEventEngagement({
      action: 'tap_whatsapp',
      source: 'feed',
      eventId: event.id,
      organizerName: event.organizer_name,
      organizerWhatsapp: event.organizer_whatsapp,
      metadata: { intent },
    });
    if (intent !== 'tap_contact') {
      trackEventEngagement({
        action: intent,
        source: 'feed',
        eventId: event.id,
        organizerName: event.organizer_name,
        organizerWhatsapp: event.organizer_whatsapp,
      });
    } else {
      trackEventEngagement({
        action: 'tap_contact',
        source: 'feed',
        eventId: event.id,
        organizerName: event.organizer_name,
        organizerWhatsapp: event.organizer_whatsapp,
      });
    }
    const msg = encodeURIComponent(`Hi! I'm interested in "${event.title}" — I found it on Swipess 🎉`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_system');
  }, []);

  const handleShare = useCallback((event: EventItem) => {
    triggerHaptic('light');
    trackEventEngagement({
      action: 'tap_share',
      source: 'feed',
      eventId: event.id,
      organizerName: event.organizer_name,
      organizerWhatsapp: event.organizer_whatsapp,
    });
    setShareEventData(event);
    setShowShareModal(true);
  }, []);

  const handleMiddleTap = useCallback((event: EventItem) => {
    triggerHaptic('light');
    trackEventEngagement({
      action: 'tap_detail',
      source: 'feed',
      eventId: event.id,
      organizerName: event.organizer_name,
      organizerWhatsapp: event.organizer_whatsapp,
    });
    const ids = filteredEvents.map((e) => e.id);
    // Seed detail cache so Insights opens with video + copy immediately
    queryClient.setQueryData(['evento', event.id], event);
    navigate(`/explore/events/${event.id}`, {
      state: { eventData: event, eventIds: ids },
    });
  }, [navigate, filteredEvents, queryClient]);

  return (
    <div
      className="fixed inset-0 z-0 w-full h-[100dvh] flex flex-col items-center justify-start bg-[#0a0a0b]"
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
            type="button"
            data-no-cinematic
            data-skip-press-engine
            onClick={() => {
              triggerHaptic('light');
              hideChrome();
              navigate(getParentRoute(location.pathname) ?? '/client/dashboard');
            }}
            className={cn(
              "shrink-0 w-11 h-11 mt-1 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg focus:outline-none focus-visible:outline-none outline-none tap-highlight-transparent",
              isLight ? "bg-white/90 border border-slate-200 text-black" : "bg-black/60 border border-white/10 text-white"
            )}
            style={{ backdropFilter: 'blur(20px) saturate(1.6)', WebkitBackdropFilter: 'blur(20px) saturate(1.6)' }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1 pb-1.5 -ml-1 pl-1">
            {CATEGORIES.map((cat, index) => (
              <EventCategoryCircle
                key={cat.key}
                label={cat.label}
                img={cat.img}
                icon={cat.icon}
                active={activeCategory === cat.key}
                isLight={isLight}
                priority={index < 4}
                onClick={() => {
                  triggerHaptic('light');
                  hideChrome();
                  if (cat.key === activeCategory) {
                    resetFeedPosition('smooth');
                    return;
                  }
                  setActiveCategory(cat.key);
                  if (cat.key === 'likes') navigate('/explore/events/likes');
                }}
              />
            ))}
          </div>
        </div>


      </div>

      {/* Main Feed */}
      {eventsError ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-32">
          <div className="w-full max-w-sm rounded-[30px] px-6 py-7 text-center" style={hudGlassStyle}>
            <p className={cn("text-lg font-black tracking-tight", isLight ? "text-foreground" : "text-white")}>
              Could not load events
            </p>
            <p className={cn("mt-2 text-sm", isLight ? "text-foreground/70" : "text-white/70")}>
              Check your connection and try again.
            </p>
            <button
              onClick={() => { triggerHaptic('medium'); refetchEvents(); }}
              className={cn(
                "mt-5 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-black tracking-tight transition-transform active:scale-[0.98]",
                isLight ? "text-black" : "text-white"
              )}
              style={{
                ...hudGlassStyle,
                background: isLight ? 'rgba(255,255,255,0.56)' : 'rgba(255,255,255,0.12)',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      ) : (eventsLoading || eventsPending) && !rawEvents ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 pt-32">
          <div className="w-full max-w-sm space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={cn("h-[72vh] max-h-[640px] rounded-[28px] border animate-pulse", isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/5")}
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
          data-native-scroll
          className="w-full h-[100dvh] overflow-y-auto snap-y snap-mandatory no-scrollbar flex flex-col"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
            scrollSnapStop: 'always',
            opacity: feedReady ? 1 : 0,
            transition: feedReady ? 'opacity 80ms linear' : undefined,
          } as React.CSSProperties}
        >
          {filteredEvents.map((event, index) => {
            const dist = Math.abs(activeIdx - index);
            const isWarm = dist <= warmRadius;
            // Window mount: keep scroll height, only hydrate nearby cards (huge iOS win)
            const shouldMount = dist <= warmRadius + 1;
            const poster = pickEventImage(event);
            return (
            <div
              key={event.id}
              className="w-full shrink-0 snap-start snap-always relative"
              style={{ height: '100dvh', contentVisibility: 'auto', containIntrinsicSize: '100vw 100dvh' } as React.CSSProperties}
            >
              {shouldMount ? (
                <EventCard
                  event={event}
                  isActive={isFeedVisible && activeIdx === index}
                  warm={isWarm}
                  imageUrl={poster}
                  liked={likedIds.has(event.id)}
                  activeColor={CATEGORIES.find(c => c.key === event.category)?.color || '#f97316'}
                  onLike={() => likeMutation.mutate({ id: event.id, isLiked: likedIds.has(event.id) })}
                  onChat={() => handleOpenChat(event)}
                  onShare={() => handleShare(event)}
                  onMiddleTap={() => handleMiddleTap(event)}
                />
              ) : (
                <div className="absolute inset-0 bg-[#0a0a0b]" aria-hidden>
                  {poster ? (
                    <img
                      src={poster}
                      alt=""
                      decoding="async"
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                  ) : null}
                </div>
              )}
            </div>
            );
          })}
          <div
            className="w-full shrink-0 snap-start snap-always relative"
            style={{ height: '100dvh' }}
          >
            <PromoteCTACard onPromote={() => {
              trackEventEngagement({ action: 'tap_promote_cta', source: 'promote_card' });
              navigate('/client/advertise');
            }} />
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

    </div>
  );
}
