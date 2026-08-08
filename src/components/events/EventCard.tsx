import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Flag, Heart, Info, MapPin, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { EventItem } from '@/types/events';
import { CATEGORIES } from '@/data/eventsData';
import { hideChrome } from '@/hooks/useChromeReveal';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { LoopVideo } from '@/components/video/LoopVideo';
import { EventVideoMuteButton } from '@/components/events/EventVideoMuteButton';

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

export const EventCard = memo(({
  event, onLike, liked, onChat, onShare, onMiddleTap,
  activeColor = '#f97316',
  imageUrl,
  isActive = false,
}: {
  event: EventItem; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  activeColor?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  // Action buttons (like, insights, share…) stay visible on the active card —
  // they used to be gated behind the auto-hiding chrome rail, so they only
  // appeared for a few seconds after tapping the card center.
  const showActions = isActive;
  const [likeAnim, setLikeAnim] = useState(false);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Immersive photo first — hide action chrome whenever this card becomes active.
  useEffect(() => {
    if (!isActive) return;
    hideChrome();
  }, [isActive, event.id]);

  useEffect(() => () => {
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
  }, []);

  const handleLike = useCallback(() => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  }, [onLike, liked]);

  const handleReport = useCallback(() => {
    triggerHaptic('medium');
    (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedListingId: event.id, reportedListingTitle: event.title, category: 'listing' } }));
  }, [event.id, event.title]);

  const handleOpenEvent = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('medium');
    onMiddleTap();
  }, [onMiddleTap]);

  const handlePhotoTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Double-tap → like
    if (now - lastTapRef.current < 320) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      handleLike();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    // Single tap → open event detail (not Insights)
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      triggerHaptic('light');
      onMiddleTap();
    }, 300);
  }, [handleLike, onMiddleTap]);

  const categoryMeta = CATEGORIES.find(c => c.key === event.category);
  const finalImageUrl = imageUrl || event.image_url;
  const hasVideo = !!(event.video_url && event.video_url.trim());
  const hasImage = !!finalImageUrl;
  const hasMedia = hasVideo || hasImage;
  const [soundOn, setSoundOn] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Background music bed (admin-uploaded mp3/wav) — only while this card is active + unmuted
  useEffect(() => {
    const url = event.background_music_url?.trim();
    if (!url) return;
    if (!isActive || !soundOn) {
      bgMusicRef.current?.pause();
      return;
    }
    let audio = bgMusicRef.current;
    if (!audio || audio.src !== url) {
      audio?.pause();
      audio = new Audio(url);
      audio.loop = true;
      audio.volume = 0.55;
      bgMusicRef.current = audio;
    }
    audio.play().catch(() => {});
    return () => {
      audio?.pause();
    };
  }, [isActive, soundOn, event.background_music_url, event.id]);

  useEffect(() => {
    if (!isActive) setSoundOn(false);
  }, [isActive, event.id]);

  return (
    <div
      className={cn(
        'force-white relative w-full h-full overflow-hidden transition-colors duration-500 touch-pan-y',
        isLight ? 'bg-white' : 'bg-black',
        !isActive && 'pointer-events-none',
      )}
      data-testid={`event-card-${event.id}`}
    >
      {hasVideo ? (
        <div className="absolute inset-0 bg-black z-[1]">
          <LoopVideo
            src={event.video_url!}
            poster={finalImageUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            active={isActive}
            muted={!soundOn}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
        </div>
      ) : hasImage ? (
        <>
          <img
            src={finalImageUrl!}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 30% 40%, ${activeColor}55 0%, transparent 55%),
                         radial-gradient(ellipse at 80% 70%, ${activeColor}33 0%, transparent 50%),
                         linear-gradient(160deg, #0d0d10 0%, #111117 50%, #0a0a0d 100%)`,
          }}
        />
      )}

      <div className={cn(
        'absolute inset-0 pointer-events-none transition-opacity duration-200 z-[2]',
        showActions ? 'opacity-100' : 'opacity-0',
        hasMedia
          ? 'bg-gradient-to-t from-black/95 via-transparent to-transparent'
          : isLight
            ? 'bg-gradient-to-t from-white/80 via-white/10 to-white/20'
            : 'bg-gradient-to-t from-black/80 via-black/5 to-black/20',
      )} />

      {isActive && (
        <button
          type="button"
          onClick={handlePhotoTap}
          className="absolute inset-0 z-[5] w-full h-full cursor-pointer tap-highlight-transparent outline-none focus:outline-none"
          aria-label="Open event"
        />
      )}

      {isActive && hasVideo && (
        <EventVideoMuteButton
          soundOn={soundOn}
          onToggle={() => setSoundOn((v) => !v)}
          size="md"
          className="absolute top-[calc(env(safe-area-inset-top,0px)+72px)] right-4 z-40"
        />
      )}

      <AnimatePresence>
        {likeAnim && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" style={{ color: activeColor, fill: activeColor }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showActions && (
          <motion.div
            data-no-cinematic
            data-no-pull-dismiss
            initial={{ opacity: 0, x: 18, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.94 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-3 z-50 pointer-events-auto flex flex-col gap-2.5 items-center"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}
          >
            <GlassIconButton
              icon={Heart}
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              label={liked ? 'Unlike' : 'Like'}
              tone="onPhoto"
              size="lg"
              guardSwipe
              iconColor={liked ? '#f43f5e' : undefined}
              iconClassName={liked ? 'fill-rose-500' : undefined}
              className={cn('w-[52px] h-[52px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]', liked && 'border-rose-500/50')}
            />

            <div className="flex flex-col gap-2 p-2 rounded-3xl bg-black/30 backdrop-blur-3xl border border-white/30 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
              {[
                { icon: Info, onClick: handleOpenEvent, label: 'Event' },
                { icon: MessageCircle, onClick: onChat, label: 'WhatsApp' },
                { icon: Share2, onClick: onShare, label: 'Share' },
                { icon: Flag, onClick: handleReport, label: 'Report' },
              ].map((btn, idx) => (
                <GlassIconButton
                  key={idx}
                  icon={btn.icon}
                  onClick={(e) => {
                    e.stopPropagation();
                    btn.onClick(e);
                  }}
                  label={btn.label}
                  tone="surface"
                  size="md"
                  guardSwipe
                  className="w-[44px] h-[44px] bg-transparent border-none shadow-none text-white hover:bg-white/10"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 px-5 pb-6 pointer-events-none transition-opacity duration-200',
          showActions ? 'opacity-100' : 'opacity-0',
        )}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        {categoryMeta && (
          <div className="flex items-center gap-2 mb-3">
            <div
              className="px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md border border-white/10"
              style={{ background: `${activeColor}30` }}
            >
              {categoryMeta.icon && <categoryMeta.icon className="w-2.5 h-2.5" style={{ color: activeColor }} />}
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white">{categoryMeta.label}</span>
            </div>

            {event.is_free && (
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">Free</span>
              </div>
            )}

            {event.discount_tag && (
              <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-yellow-400">{event.discount_tag}</span>
              </div>
            )}
          </div>
        )}

        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-2xl [text-shadow:0_4px_12px_rgba(0,0,0,0.9)] pr-16">
          {event.title}
        </h2>

        {event.organizer_name && (
          <p className="text-sm text-white/80 font-semibold mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            by {event.organizer_name}
          </p>
        )}

        {event.promo_text && (
          <p className="text-sm text-white/90 mt-2 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] line-clamp-2 pr-16">
            {event.promo_text}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {event.event_date && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-white/90">{formatDate(event.event_date)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-[11px] font-bold text-white/90 truncate max-w-[140px]">{event.location}</span>
            </div>
          )}
          {event.price_text && !event.is_free && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              <span className="text-[11px] font-bold text-white/90">{event.price_text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});