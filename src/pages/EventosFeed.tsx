import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MapPin, Calendar, Sparkles, Waves, Trees, Music,
  Utensils, Ticket, ArrowLeft, MessageCircle, Share2,
  Megaphone, ChevronUp, ExternalLink, Info, Play, Pause, ChevronRight, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import CardImage from '@/components/CardImage';

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
  organizer_whatsapp: string | null;
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
  { key: 'likes', label: 'Saved', icon: Heart },
];

const AUTOPLAY_DURATION = 6000; // 6 seconds per card

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
const MOCK_EVENTS: EventItem[] = [
  {
    id: 'm1', title: 'Sunset Cacao Ceremony', category: 'beach',
    image_url: '/images/events/cacao_ceremony.png',
    description: 'Sacred cacao ceremony at sunset on the Caribbean shore. Meditation, sound healing, and deep connection with yourself.',
    event_date: '2026-04-05T18:00:00', location: 'Playa Paraíso, Tulum', location_detail: 'Beach Club',
    organizer_name: 'Casa Luna', organizer_whatsapp: '+529841234567', promo_text: 'Limited spots', discount_tag: 'EARLY BIRD', is_free: false, price_text: '$350 MXN',
  },
  {
    id: 'm2', title: 'Full Moon Beach Party', category: 'music',
    image_url: '/images/events/cenote_rave.png',
    description: 'Full moon jungle party on the beach. International DJs, laser lights, fire torches, and dancing under the stars all night long.',
    event_date: '2026-04-06T22:00:00', location: 'Playa Ruinas, Tulum', location_detail: 'Beach Stage',
    organizer_name: 'Zamna Tulum', organizer_whatsapp: '+529847654321', promo_text: 'Full moon night', discount_tag: 'TONIGHT', is_free: false, price_text: '$800 MXN',
  },
  {
    id: 'm3', title: 'Beachfront Yoga Flow', category: 'jungle',
    image_url: '/images/events/yoga_sound.png',
    description: 'Ocean-view yoga class in an open palapa studio. Expert-led flow for all levels with the sound of the waves as your backdrop.',
    event_date: '2026-04-07T08:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Palapa Studio',
    organizer_name: 'Ahau Tulum', organizer_whatsapp: '+529841112233', promo_text: 'All levels welcome', discount_tag: null, is_free: false, price_text: '$450 MXN',
  },
  {
    id: 'm4', title: 'Reiki & Energy Healing', category: 'beach',
    image_url: '/images/events/gallery_night.png',
    description: 'Private and group reiki sessions in an open-air jungle setting. Release blockages, restore balance, and leave feeling renewed.',
    event_date: '2026-04-08T10:00:00', location: 'Holistika, Tulum', location_detail: 'Healing Hut',
    organizer_name: 'Tulum Wellness', organizer_whatsapp: '+529841119900', promo_text: 'Private & group sessions', discount_tag: null, is_free: false, price_text: '$550 MXN',
  },
  {
    id: 'm5', title: "Chef's Table: Tulum Kitchen", category: 'food',
    image_url: '/images/events/food_market.png',
    description: 'Intimate cooking experience with a local chef. Fresh ceviche, avocado dishes, and regional flavors made from scratch in a rustic kitchen.',
    event_date: '2026-04-09T13:00:00', location: 'La Veleta, Tulum', location_detail: 'Rustic Kitchen',
    organizer_name: 'Tulum Sabor', organizer_whatsapp: '+529841557788', promo_text: 'Max 8 guests', discount_tag: 'EXCLUSIVE', is_free: false, price_text: '$650 MXN',
  },
  {
    id: 'm6', title: 'Seafood & Bubbles Promo', category: 'promo',
    image_url: '/images/events/sunset_session.png',
    description: 'Celebrate with fresh calamari, oysters, and champagne by the sea. Special prix-fixe menu every evening until midnight.',
    event_date: '2026-04-10T20:00:00', location: 'Zona Hotelera, Tulum', location_detail: 'El Arco Bar',
    organizer_name: 'El Arco', organizer_whatsapp: '+529845556644', promo_text: 'Prix-fixe menu', discount_tag: '20% OFF', is_free: false, price_text: 'From $350 MXN',
  },
  {
    id: 'm7', title: 'Mexican Cooking Class', category: 'food',
    image_url: '/images/events/food_market.png',
    description: 'Learn authentic Mexican recipes with a local abuela. Tamales, handmade salsas, and traditional techniques passed down for generations.',
    event_date: '2026-04-11T10:00:00', location: 'Holistika, Tulum', location_detail: 'Open-air kitchen',
    organizer_name: 'Viva Tulum', organizer_whatsapp: '+529849998877', promo_text: 'Hands-on experience', discount_tag: null, is_free: false, price_text: '$500 MXN',
  },
  {
    id: 'm8', title: 'Kids Storytime & Play', category: 'beach',
    image_url: '/images/filters/workers.png',
    description: 'A fun morning of interactive storytelling and guided play for toddlers and young children. Bilingual, creative, and full of laughter.',
    event_date: '2026-04-12T09:00:00', location: 'La Veleta, Tulum', location_detail: 'Family Space',
    organizer_name: 'Tulum Families', organizer_whatsapp: '+529843334455', promo_text: 'Kids 1–6 years', discount_tag: 'FREE ENTRY', is_free: true, price_text: null,
  },
  {
    id: 'm9', title: 'Vespa Tour: Hidden Tulum', category: 'jungle',
    image_url: '/images/filters/scooter.png',
    description: 'Rent a classic red Vespa and explore Tulum\'s hidden corners with a local guide. Cenotes, jungle roads, and secret spots.',
    event_date: '2026-04-13T09:00:00', location: 'Centro, Tulum', location_detail: 'Scooter Shop',
    organizer_name: 'Tulum Rides', organizer_whatsapp: '+529847771234', promo_text: 'All experience levels', discount_tag: null, is_free: false, price_text: '$400 MXN',
  },
  {
    id: 'm10', title: 'Sunrise Beach Walk', category: 'beach',
    image_url: '/images/events/sunset_session.png',
    description: 'Guided sunrise walk along pristine Caribbean shores. Warm sand, gentle breeze, and golden light — the best way to start your day.',
    event_date: '2026-04-14T06:00:00', location: 'Playa Paraíso, Tulum', location_detail: 'South Beach',
    organizer_name: 'Tulum Dive', organizer_whatsapp: '+529843332211', promo_text: 'Small group', discount_tag: 'EXCLUSIVE', is_free: false, price_text: '$200 MXN',
  },
  {
    id: 'm11', title: 'Jungle Bike Tour', category: 'jungle',
    image_url: '/images/filters/bicycle.png',
    description: 'Explore Tulum on a classic beach cruiser through jungle paths, cenote roads, and sandy trails. Bikes provided, all levels welcome.',
    event_date: '2026-04-15T08:00:00', location: 'Tulum Pueblo', location_detail: 'Jungle trails',
    organizer_name: 'Tulum Rides', organizer_whatsapp: '+529847771234', promo_text: 'Bikes included', discount_tag: null, is_free: false, price_text: '$250 MXN',
  },
  {
    id: 'm12', title: 'Sunset DJ Set: Beach Club', category: 'music',
    image_url: '/images/events/sunset_session.png',
    description: 'Two world-class DJs behind the decks at sunset. Afro house, melodic techno, and tropical beats with the Caribbean as your backdrop.',
    event_date: '2026-04-15T17:00:00', location: 'Zona Hotelera, Tulum', location_detail: 'Beach Club Stage',
    organizer_name: 'Papaya Playa', organizer_whatsapp: '+529848887766', promo_text: 'Open air', discount_tag: 'SUNSET SET', is_free: false, price_text: '$600 MXN',
  },
  {
    id: 'm13', title: 'Group Dog Walk', category: 'jungle',
    image_url: '/images/promo/promo_1.png',
    description: 'Morning pack walk through shaded jungle streets with your furry friend. Meet other pet owners and let the dogs run free together.',
    event_date: '2026-04-16T07:30:00', location: 'La Veleta, Tulum', location_detail: 'Tree-lined streets',
    organizer_name: 'Tulum Pets', organizer_whatsapp: '+529843339988', promo_text: 'All dogs welcome', discount_tag: 'FREE ENTRY', is_free: true, price_text: null,
  },
  {
    id: 'm14', title: 'Jungle Architecture Walk', category: 'jungle',
    image_url: '/images/filters/property.png',
    description: 'Guided tour of Tulum\'s most iconic brutalist and organic architecture hidden deep in the jungle. Art, design, and nature converge.',
    event_date: '2026-04-16T16:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Jungle district',
    organizer_name: 'Tulum Design', organizer_whatsapp: '+529841234000', promo_text: 'Small group tour', discount_tag: null, is_free: false, price_text: '$300 MXN',
  },
  {
    id: 'm15', title: 'Bike Rental Promo', category: 'promo',
    image_url: '/images/filters/bicycle.png',
    description: 'Rent a colorful beach cruiser and explore Tulum at your own pace. Daily and weekly rates available. Helmets and baskets included.',
    event_date: '2026-04-17T09:00:00', location: 'Centro, Tulum', location_detail: 'Main strip',
    organizer_name: 'Tulum Cruisers', organizer_whatsapp: '+529849990011', promo_text: 'Daily & weekly rates', discount_tag: '20% OFF', is_free: false, price_text: 'From $150 MXN',
  },
  {
    id: 'm16', title: 'Jungle Villa Open House', category: 'jungle',
    image_url: '/images/filters/property.png',
    description: 'Exclusive open house tour of a stunning jungle villa. Brutalist architecture, cascading plants, private pool, and golden-hour lighting.',
    event_date: '2026-04-18T17:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Private Villa',
    organizer_name: 'Tulum Estates', organizer_whatsapp: '+529841230000', promo_text: 'By appointment', discount_tag: 'OPEN HOUSE', is_free: true, price_text: null,
  },
  {
    id: 'm17', title: 'Luxury Villa Weekend Promo', category: 'promo',
    image_url: '/images/filters/property.png',
    description: 'Unwind in a private jungle villa with a plunge pool, terrace, and lush garden views. Special weekly rates for SwipesS members.',
    event_date: '2026-04-19T12:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Jungle Villa',
    organizer_name: 'Tulum Stays', organizer_whatsapp: '+529847770099', promo_text: 'Members-only rate', discount_tag: '15% OFF', is_free: false, price_text: 'From $2,800 MXN/night',
  },
];

function formatDate(str: string | null): string {
  if (!str) return '';
  const d = new Date(str);
  const diff = Math.floor((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `In ${diff} days`;
}

function openWhatsApp(phone: string | null, eventTitle: string) {
  if (!phone) {
    toast.info("No contact info available for this organizer");
    return;
  }
  const clean = phone.replace(/[^+\d]/g, '');
  const msg = encodeURIComponent(`Hi! I'm interested in "${eventTitle}" — I found it on Local Jarvis 🎉`);
  window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
}

// ── SHARE MODAL ──────────────────────────────────────────────────────────────
function ShareModal({
  event, open, onClose
}: {
  event: EventItem; open: boolean; onClose: () => void;
}) {
  const url = `${window.location.origin}/explore/eventos/${event.id}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
    onClose();
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} in Tulum! Sign up on Local Jarvis to get connected 🎉`,
          url: url
        });
        onClose();
      } catch (err) {
        if ((err as Error).name !== 'AbortError') handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    const msg = encodeURIComponent(`🎉 Check out "${event.title}" in Tulum!\n\n${url}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[110] bg-zinc-900 border-t border-white/10 rounded-t-[2.5rem] px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
            <div className="w-20 h-20 rounded-[2rem] mx-auto mb-4 overflow-hidden shadow-2xl">
              <img src={event.image_url || ''} className="w-full h-full object-cover breathing-zoom" alt="" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Share this Event</h3>
            <p className="text-white/50 text-sm mb-8">Invite friends — they'll need to sign up to see the full event.</p>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={handleNativeShare}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Send</span>
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">WhatsApp</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-rose-400" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Copy</span>
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="w-full py-4 mt-8 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-widest"
            >
              Close
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── STORY PROGRESS BAR ────────────────────────────────────────────────────────
function StoryProgressBar({ 
  duration, 
  isActive, 
  isPaused, 
  onComplete,
  animKey
}: { 
  duration: number; 
  isActive: boolean; 
  isPaused: boolean; 
  onComplete: () => void;
  animKey: number;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 right-4 z-[60] flex gap-1.5 h-1">
      <div className={cn(
        "relative flex-1 rounded-full overflow-hidden backdrop-blur-md",
        isLight ? "bg-black/10" : "bg-white/20"
      )}>
        <motion.div
          key={animKey}
          initial={{ width: '0%' }}
          animate={isActive ? { width: isPaused ? undefined : '100%' } : { width: '0%' }}
          transition={isActive && !isPaused ? { duration: duration / 1000, ease: 'linear' } : { duration: 0 }}
          onAnimationComplete={() => { if (isActive && !isPaused) onComplete(); }}
          className={cn(
            "absolute inset-y-0 left-0",
            isLight ? "bg-black/80 shadow-[0_0_8px_rgba(0,0,0,0.2)]" : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          )}
        />
      </div>
    </div>
  );
}

// ── SINGLE EVENT CARD ─────────────────────────────────────────────────────────
function EventCard({
  event, isActive, isPaused, animKey, onTickComplete, onLike, liked, onChat, onShare, onMiddleTap, onNextEvent, onPrevEvent,
}: {
  event: EventItem; isActive: boolean; isPaused: boolean; animKey: number; onTickComplete: () => void; onLike: () => void; liked: boolean;
  onChat: () => void; onShare: () => void; onMiddleTap: () => void;
  onNextEvent: () => void; onPrevEvent: () => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showDetails, setShowDetails] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  const handleLike = () => {
    onLike();
    if (!liked) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 600);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden transition-colors duration-500",
        isLight ? "bg-white" : "bg-black"
      )}
      style={{ height: '100dvh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
      data-testid={`event-card-${event.id}`}
    >
      {/* Story Progress Bar */}
      <StoryProgressBar 
        duration={AUTOPLAY_DURATION} 
        isActive={isActive && !showDetails} 
        isPaused={isPaused} 
        animKey={animKey}
        onComplete={onTickComplete}
      />
      {/* Background photo with breathing-zoom on all cards */}
      <div className="absolute inset-0">
        <CardImage
          src={event.image_url}
          alt={event.title}
          fullScreen
          animate={true}
        />
      </div>

      {/* Gradient overlays */}
      <div className={cn(
        "absolute inset-0 pointer-events-none transition-opacity duration-700",
        isLight 
          ? "bg-gradient-to-t from-white/95 via-white/20 to-white/40 opacity-90" 
          : "bg-gradient-to-t from-black/90 via-black/10 to-black/40"
      )} />

      {/* LEFT tap zone — previous event */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrevEvent(); }}
        className="absolute left-0 top-[8%] bottom-[40%] w-[30%] z-10 flex items-center justify-start pl-3"
        aria-label="Previous event"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
          style={{ 
            background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', 
            backdropFilter: 'blur(8px)', 
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
          }}
        >
          <ChevronLeft className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </div>
      </button>

      {/* MIDDLE tap zone — view details */}
      <button
        onClick={(e) => { e.stopPropagation(); onMiddleTap(); }}
        className="absolute inset-x-[30%] top-[8%] bottom-[40%] z-10"
        aria-label="View event details"
      />

      {/* RIGHT tap zone — next event */}
      <button
        onClick={(e) => { e.stopPropagation(); onNextEvent(); }}
        className="absolute right-0 top-[8%] bottom-[40%] w-[30%] z-10 flex items-center justify-end pr-3"
        aria-label="Next event"
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
          style={{ 
            background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', 
            backdropFilter: 'blur(8px)', 
            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
          }}
        >
          <ChevronRight className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} />
        </div>
      </button>

      {/* Double-tap to like overlay */}
      <AnimatePresence>
        {likeAnim && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <Heart className="w-24 h-24 fill-white text-white drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-[2] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3 pr-16"
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  isLight ? "text-black/70" : "text-white/80"
                )}
                  style={{ 
                    background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)', 
                    backdropFilter: 'blur(8px)', 
                    border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
                  }}>
                  {event.category}
                </span>
                {event.discount_tag && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }}>
                    {event.discount_tag}
                  </span>
                )}
                {event.is_free && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-rose-300"
                    style={{ background: 'rgba(244,63,94,0.2)', border: '1px solid rgba(244,63,94,0.4)' }}>
                    FREE
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className={cn(
                "text-3xl font-black font-brand leading-[1.05] tracking-tight drop-shadow-lg",
                isLight ? "text-black" : "text-white"
              )}>
                {event.title}
              </h2>

              {/* Description */}
              {event.description && (
                <p className={cn(
                  "text-sm leading-relaxed line-clamp-2",
                  isLight ? "text-black/70" : "text-white/70"
                )}>
                  {event.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {event.event_date && (
                  <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-black/60" : "text-white/70")}>
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    <span>{formatDate(event.event_date)}</span>
                  </div>
                )}
                {event.location && (
                  <div className={cn("flex items-center gap-1.5 text-xs", isLight ? "text-black/60" : "text-white/70")}>
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
                <p className={cn("text-[11px] font-medium", isLight ? "text-black/40" : "text-white/40")}>by {event.organizer_name}</p>
              )}

              {/* CTA row */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); setShowDetails(true); }}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest transition-all",
                    isLight ? "text-black bg-black/5 hover:bg-black/10" : "text-white bg-white/15 hover:bg-white/25"
                  )}
                  style={{ backdropFilter: 'blur(12px)', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' }}
                  data-testid={`btn-info-${event.id}`}
                >
                  <Info className="w-3.5 h-3.5" />
                  More Info
                </button>
                {!event.is_free && event.price_text && (
                  <button
                    onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); onChat(); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-[1.25rem] text-xs font-black uppercase tracking-widest text-white"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
                    data-testid={`btn-tickets-${event.id}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Get Tickets
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right side action buttons */}
      <div className="absolute right-4 flex flex-col gap-6 items-center z-30"
        style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom,0px))' }}>
        {/* Like */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); handleLike(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`like-event-${event.id}`}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: liked ? 'rgba(239,68,68,0.3)' : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)'), 
              backdropFilter: 'blur(8px)', 
              border: `1px solid ${liked ? 'rgba(239,68,68,0.5)' : (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)')}`, 
              transition: 'all 0.2s ease' 
            }}>
            <Heart className={cn('w-6 h-6 transition-colors', liked ? 'fill-red-500 text-red-500' : (isLight ? 'text-black' : 'text-white'))} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Like</span>
        </button>

        {/* Chat → WhatsApp */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onChat(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`chat-event-${event.id}`}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', 
              backdropFilter: 'blur(8px)', 
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)' 
            }}>
            <MessageCircle className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Chat</span>
        </button>

        {/* Share */}
        <button
          onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onShare(); }}
          className="flex flex-col items-center gap-1"
          data-testid={`share-event-${event.id}`}
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)', 
              backdropFilter: 'blur(8px)', 
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.15)' 
            }}>
            <Share2 className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
          </motion.div>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/60" : "text-white/60")}>Share</span>
        </button>
      </div>

      {/* Details overlay */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="absolute inset-0 z-50 overflow-y-auto"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(0,0,0,0.96)', 
              backdropFilter: 'blur(20px)' 
            }}
          >
            <div className="relative h-[45dvh]">
              {event.image_url && (
                <img src={event.image_url} className={cn("w-full h-full object-cover breathing-zoom", isLight ? "opacity-30" : "opacity-60")} alt="" />
              )}
              <div className={cn(
                "absolute inset-0",
                isLight ? "bg-gradient-to-t from-white via-white/40 to-transparent" : "bg-gradient-to-t from-black via-black/40 to-transparent"
              )} />
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-safe top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>
              <div className="absolute bottom-6 left-5 right-5">
                <h3 className={cn("text-3xl font-black leading-tight", isLight ? "text-black" : "text-white")}>{event.title}</h3>
                {event.organizer_name && <p className={cn("text-sm mt-1", isLight ? "text-black/50" : "text-white/50")}>by {event.organizer_name}</p>}
              </div>
            </div>
            <div className="p-5 space-y-5">
              {event.description && (
                <p className={cn("text-sm leading-relaxed", isLight ? "text-black/80" : "text-white/80")}>{event.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {event.event_date && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <Calendar className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Date</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{formatDate(event.event_date)}</div>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Location</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{event.location}</div>
                    </div>
                  </div>
                )}
                {event.price_text && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <Ticket className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Price</div>
                      <div className="text-sm font-bold text-orange-400">{event.price_text}</div>
                    </div>
                  </div>
                )}
                {event.location_detail && (
                  <div className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)' }}>
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={cn("text-[10px] uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Venue</div>
                      <div className={cn("text-sm font-bold", isLight ? "text-black" : "text-white")}>{event.location_detail}</div>
                    </div>
                  </div>
                )}
              </div>
              {event.promo_text && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <Sparkles className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm text-orange-300 font-bold">{event.promo_text}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { triggerHaptic('light'); onChat(); setShowDetails(false); }}
                  title="Chat with organizer on WhatsApp"
                  aria-label="Chat with organizer on WhatsApp"
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2",
                    isLight ? "text-black bg-black/5 border-black/10" : "text-white bg-white/10 border-white/15"
                  )}
                  style={{ border: '1px solid' }}
                >
                  <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                </button>
                <button
                  onClick={() => { triggerHaptic('medium'); onShare(); }}
                  title="Share this event"
                  aria-label="Share this event"
                  className="flex-1 py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)' }}
                >
                  <Share2 className="w-4 h-4" /> Share Event
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PROMOTE CTA CARD (appears at end of feed) ─────────────────────────────────
function PromoteCTACard({ onPromote }: { onPromote: () => void }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden flex flex-col items-center justify-center px-8 transition-colors duration-500",
        isLight ? "bg-white" : "bg-[#0a0a0b]"
      )}
      style={{ height: '100dvh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
    >
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-0 w-64 h-64 rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-20 blur-[80px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-6 relative z-10"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(168,85,247,0.2))', border: '1.5px solid rgba(249,115,22,0.4)', boxShadow: '0 0 40px rgba(249,115,22,0.15)' }}>
          <Megaphone className="w-9 h-9 text-orange-400" />
        </div>

        {/* Text */}
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400/80 mb-3">For Businesses</div>
          <h2 className={cn("text-4xl font-black leading-[1] tracking-tighter mb-3", isLight ? "text-black" : "text-white")}>
            Want to<br />
            <span style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Promote here?
            </span>
          </h2>
          <p className={cn("text-sm leading-relaxed max-w-[260px] mx-auto", isLight ? "text-black/50" : "text-white/50")}>
            Reach 15,000+ Tulum locals, expats & tourists with your event, restaurant, or brand
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6">
          {[['15k+', 'Users'], ['120k+', 'Views/mo'], ['89%', 'Engagement']].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className={cn("font-black text-lg", isLight ? "text-black" : "text-white")}>{val}</div>
              <div className={cn("text-[10px]", isLight ? "text-black/40" : "text-white/40")}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { triggerHaptic('medium'); onPromote(); }}
          className="w-full max-w-[280px] py-5 rounded-[2rem] font-black text-white flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)', boxShadow: '0 12px 40px rgba(249,115,22,0.35)' }}
          data-testid="btn-promote-event"
        >
          <Megaphone className="w-5 h-5" />
          Promote My Event
        </motion.button>

        <p className="text-white/25 text-[11px]">Starting from $50 MXN/week</p>
      </motion.div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
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
  const autoPlayRef = useRef(autoPlay);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

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
          organizer_whatsapp: ev.organizer_whatsapp || null,
          promo_text: ev.promo_text || null,
          discount_tag: ev.discount_tag || null,
          is_free: !!ev.is_free,
          price_text: ev.price_text || null,
        }));
        return [...formatted, ...MOCK_EVENTS];
      } catch {
        return MOCK_EVENTS;
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: MOCK_EVENTS,
  });

  const allEvents = rawEvents?.length ? rawEvents : MOCK_EVENTS;

  const filteredEvents = useMemo(() => {
    const list = activeCategory === 'all' 
      ? allEvents 
      : activeCategory === 'likes'
        ? allEvents.filter(e => likedIds.has(e.id))
        : allEvents.filter(e => e.category === activeCategory);
    return list;
  }, [allEvents, activeCategory, likedIds]);

  const rowVirtualizer = useVirtualizer({
    count: filteredEvents.length + 1, // +1 for the Promote card
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 2,
  });

  // Track scroll position → active index
  useEffect(() => {
    const el = parentRef.current;
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
    if (parentRef.current) {
      parentRef.current.scrollTo({ top: 0, behavior: 'instant' as any });
      setActiveIdx(0);
      setAnimKey(k => k + 1);
    }
  }, [activeCategory]);

  // Pause auto-play on user interaction, resume after 3s
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
    if (!el) return;
    const onTouch = () => pauseAutoPlay();
    el.addEventListener('touchstart', onTouch, { passive: true });
    el.addEventListener('mousedown', onTouch, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouch);
      el.removeEventListener('mousedown', onTouch);
    };
  }, [pauseAutoPlay]);

  // Auto-play: single timeout to advance after AUTOPLAY_DURATION (CSS handles the visual)
  useEffect(() => {
    if (!autoPlay || isPaused || filteredEvents.length <= 1) return;

    const timeout = setTimeout(() => {
      const el = parentRef.current;
      if (el) {
        // Now include the Promote card (index = filteredEvents.length)
        const maxIdx = filteredEvents.length; 
        if (activeIdx >= maxIdx) return; // Stop at Promote card
        const nextIdx = activeIdx + 1;
        el.scrollTo({ top: nextIdx * el.clientHeight, behavior: 'smooth' });
      }
      setAnimKey(k => k + 1);
    }, AUTOPLAY_DURATION);

    return () => clearTimeout(timeout);
  }, [autoPlay, isPaused, activeIdx, filteredEvents.length, animKey]);

  const handleOpenChat = useCallback((event: EventItem) => {
    triggerHaptic('light');
    openWhatsApp(event.organizer_whatsapp, event.title);
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

  // Tap navigation: left zone = previous, right zone = next
  const handleTapNext = useCallback(() => {
    if (activeIdx < filteredEvents.length - 1) {
      if (parentRef.current) {
        parentRef.current.scrollTo({ top: (activeIdx + 1) * parentRef.current.clientHeight, behavior: 'smooth' });
        triggerHaptic('light');
        setAnimKey(k => k + 1); // reset progress bar
      }
    }
  }, [activeIdx, filteredEvents.length]);

  const handleTapPrev = useCallback(() => {
    if (activeIdx > 0) {
      if (parentRef.current) {
        parentRef.current.scrollTo({ top: (activeIdx - 1) * parentRef.current.clientHeight, behavior: 'smooth' });
        triggerHaptic('light');
        setAnimKey(k => k + 1); // reset progress bar
      }
    }
  }, [activeIdx]);

  return (
    <div data-no-swipe-nav className={cn(
      "relative w-full h-[100dvh] overflow-hidden flex flex-col transition-colors duration-500",
      isLight ? "bg-white" : "bg-black"
    )}>

      {/* ── TOP HUD ── */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-safe stagger-enter">
        {/* Back button + title + promote */}
        <motion.div 
          className="flex items-center gap-3 px-4 pt-3 pb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)', 
              backdropFilter: 'blur(12px)', 
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.2)' 
            }}
          >
            <ArrowLeft className={cn("w-5 h-5", isLight ? "text-black" : "text-white")} />
          </button>
          <div className="flex-1">
            <h1 className={cn("font-black font-brand text-xl tracking-tight leading-tight", isLight ? "text-black" : "text-white")}>Tulum Events</h1>
            <div className="flex items-center gap-1.5 mt-[-2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <p className={cn("text-[10px] uppercase font-black tracking-widest leading-none", isLight ? "text-black/60" : "text-white/60")}>{filteredEvents.length} LIVE NOW</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { setAutoPlay(p => !p); triggerHaptic('light'); }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-95",
                isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/10"
              )}
              aria-label={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
              title={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
            >
              {autoPlay ? <Pause className={cn("w-4 h-4", isLight ? "text-black" : "text-white")} /> : <Play className={cn("w-4 h-4 ml-0.5", isLight ? "text-black" : "text-white")} />}
            </button>
            <button
              onClick={() => { triggerHaptic('light'); navigate('/explore/eventos/likes'); }}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all active:scale-95",
                isLight ? "bg-white/70 border-black/10" : "bg-black/40 border-white/10"
              )}
              aria-label="View saved events"
              title="View saved events"
            >
              <Heart className="w-4 h-4 text-orange-400 fill-orange-400" />
            </button>
            <button
              onClick={() => navigate('/client/advertise')}
              className="flex items-center gap-2 px-4 h-10 rounded-full text-[11px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #f97316, #ef4444)' }}
              data-testid="btn-promote-header"
            >
              <Megaphone className="w-3.5 h-3.5" />
              Promote
            </button>
          </div>
        </motion.div>

        {/* Navigation Dots — subtle TikTok style indicators */}
        <div className="flex justify-center gap-1.5 px-4 pb-3">
          {filteredEvents.slice(0, 10).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === activeIdx 
                  ? (isLight ? "w-8 bg-black shadow-[0_0_8px_rgba(0,0,0,0.2)]" : "w-8 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]")
                  : (isLight ? "w-1.5 bg-black/10" : "w-1.5 bg-white/20")
              )}
            />
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2.5 px-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + (idx * 0.04) }}
                title={`Filter by ${cat.label}`}
                aria-label={`Filter events by ${cat.label}`}
                onClick={() => { triggerHaptic('light'); setActiveCategory(cat.key); }}
                className="flex items-center gap-2 px-4 h-9 rounded-full shrink-0 text-[11px] font-black uppercase tracking-[0.1em] transition-all active:scale-90"
                style={{
                  background: active 
                    ? (isLight ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)') 
                    : (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)'),
                  color: active 
                    ? (isLight ? '#fff' : '#000') 
                    : (isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'),
                  backdropFilter: 'blur(16px)',
                  border: active ? 'none' : (isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.15)'),
                  boxShadow: active 
                    ? (isLight ? '0 8px 20px rgba(0,0,0,0.1)' : '0 8px 20px rgba(255,255,255,0.2)') 
                    : 'none'
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "text-orange-600" : (isLight ? "text-black/40" : "text-white/60"))} />
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── VERTICAL SNAP SCROLL FEED (Virtualized) ── */}
      <div
        ref={parentRef}
        className="w-full h-full overflow-y-scroll scroll-smooth no-scrollbar"
        style={{
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const isLast = virtualRow.index === filteredEvents.length;
            const event = filteredEvents[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100dvh',
                  transform: `translateY(${virtualRow.start}px)`,
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                }}
              >
                {isLast ? (
                  <PromoteCTACard onPromote={() => navigate('/client/advertise')} />
                ) : (
                  <EventCard
                    event={event}
                    isActive={virtualRow.index === activeIdx}
                    isPaused={isPaused}
                    animKey={animKey}
                    onTickComplete={() => {
                      if (activeIdx < filteredEvents.length) {
                        const nextIdx = activeIdx + 1;
                        parentRef.current?.scrollTo({ 
                          top: nextIdx * parentRef.current.clientHeight, 
                          behavior: 'smooth' 
                        });
                        setAnimKey(k => k + 1);
                      }
                    }}
                    liked={likedIds.has(event.id)}
                    onLike={() => likeMutation.mutate({ id: event.id, isLiked: likedIds.has(event.id) })}
                    onChat={() => handleOpenChat(event)}
                    onShare={() => handleShare(event)}
                    onMiddleTap={() => handleMiddleTap(event)}
                    onNextEvent={handleTapNext}
                    onPrevEvent={handleTapPrev}
                  />
                )}
              </div>
            );
          })}
        </div>
        {filteredEvents.length === 0 && (
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-3",
            isLight ? "text-black/40" : "text-white/50"
          )}>
             <Sparkles className={cn("w-8 h-8", isLight ? "text-black/10" : "text-white/20")} />
             <span className="text-sm font-bold">No events in this category yet</span>
          </div>
        )}
      </div>

      {/* ── SWIPE HINT OVERLAYS ── */}
      {/* Left swipe hint - show when not on first event */}
      {activeIdx > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.3, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.3 }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
        >
          <ChevronLeft className={cn("w-8 h-8", isLight ? "text-black/40" : "text-white/40")} />
        </motion.div>
      )}

      {/* Right swipe hint - show when not on last event */}
      {activeIdx < filteredEvents.length - 1 && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 0.3, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.3 }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none"
        >
          <ChevronRight className={cn("w-8 h-8", isLight ? "text-black/40" : "text-white/40")} />
        </motion.div>
      )}

      {/* ── SHARE OVERLAY ── */}
      {showShareModal && shareEventData && (
        <ShareModal
          event={shareEventData}
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
