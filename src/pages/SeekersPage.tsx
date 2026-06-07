import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import {
  ChevronLeft, MessageCircle, X, Users,
  Calendar, DollarSign, Clock, MapPin,
  Sparkles, Wrench, Zap, Car, ChefHat, Leaf, Hammer,
  Baby, Dumbbell, HeartPulse, Package, Laptop, Paintbrush, Shield
} from 'lucide-react';

const CATEGORY_META: Record<string, { label: string; Icon: any; color: string }> = {
  cleaning:   { label: 'Cleaning',   Icon: Sparkles,   color: '#3b82f6' },
  plumbing:   { label: 'Plumbing',   Icon: Wrench,     color: '#06b6d4' },
  electrical: { label: 'Electrical', Icon: Zap,        color: '#f59e0b' },
  driving:    { label: 'Driver',     Icon: Car,        color: '#10b981' },
  chef:       { label: 'Chef',       Icon: ChefHat,    color: '#f97316' },
  gardening:  { label: 'Gardening',  Icon: Leaf,       color: '#22c55e' },
  handyman:   { label: 'Handyman',   Icon: Hammer,     color: '#8b5cf6' },
  childcare:  { label: 'Childcare',  Icon: Baby,       color: '#ec4899' },
  fitness:    { label: 'Fitness',    Icon: Dumbbell,   color: '#ef4444' },
  massage:    { label: 'Massage',    Icon: HeartPulse, color: '#a855f7' },
  moving:     { label: 'Moving',     Icon: Package,    color: '#f43f5e' },
  tech:       { label: 'Tech / IT',  Icon: Laptop,     color: '#6366f1' },
  painting:   { label: 'Painting',   Icon: Paintbrush, color: '#0ea5e9' },
  security:   { label: 'Security',   Icon: Shield,     color: '#64748b' },
  other:      { label: 'Other',      Icon: Sparkles,   color: '#94a3b8' },
};

interface SeekerRequest {
  id: string;
  title: string;
  category: string;
  service_category: string | null;
  description: string | null;
  available_from: string | null;
  time_slots_available: any;
  minimum_booking_hours: number | null;
  days_available: any;
  price: number;
  pricing_unit: string | null;
  location: string;
  status: string | null;
  owner_id: string | null;
  seekerName: string;
  seekerAvatar: string | null;
  seekerInitials: string;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
}

/* ─── Single swipe card ─── */
function SeekerCard({ req, isTop, onSwipe }: { req: SeekerRequest; isTop: boolean; onSwipe: (dir: 'left' | 'right') => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [30, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -30], [1, 0]);
  const cardScale = useTransform(x, [-300, 0, 300], [0.96, 1, 0.96]);
  const isDraggingRef = useRef(false);

  const cat = CATEGORY_META[req.category] ?? CATEGORY_META.other;
  const timeSlot = Array.isArray(req.time_slots_available) ? req.time_slots_available[0]?.start : null;
  const days = Array.isArray(req.days_available) ? req.days_available as string[] : [];

  const handleDragEnd = (_: any, info: any) => {
    isDraggingRef.current = false;
    const vx = info.velocity.x;
    const ox = info.offset.x;
    if (ox > 80 || vx > 500) { triggerHaptic('medium'); onSwipe('right'); }
    else if (ox < -80 || vx < -500) { triggerHaptic('light'); onSwipe('left'); }
  };

  return (
    <motion.div
      style={{ x, rotate, scale: cardScale, position: 'absolute', inset: 0, touchAction: 'none' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragStart={() => { isDraggingRef.current = true; }}
      onDragEnd={handleDragEnd}
      className="rounded-[28px] overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
    >
      {/* Card background — avatar or gradient */}
      <div className="absolute inset-0">
        {req.seekerAvatar ? (
          <img src={req.seekerAvatar} alt={req.seekerName} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${cat.color}55 0%, ${cat.color}22 50%, #0a0a0a 100%)` }}
          />
        )}
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
      </div>

      {/* LIKE / PASS indicators */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-14 left-6 z-30 border-4 border-green-400 rounded-xl px-3 py-1 rotate-[-20deg]">
        <span className="text-green-400 font-black text-xl uppercase tracking-wider">Interested</span>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-14 right-6 z-30 border-4 border-red-400 rounded-xl px-3 py-1 rotate-[20deg]">
        <span className="text-red-400 font-black text-xl uppercase tracking-wider">Skip</span>
      </motion.div>

      {/* Category badge top */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl" style={{ background: `${cat.color}33`, border: `1px solid ${cat.color}66` }}>
          <cat.Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: cat.color }}>{cat.label}</span>
          {req.service_category && <span className="text-[10px] text-white/70">· {req.service_category}</span>}
        </div>
      </div>

      {/* Content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pt-10">
        {/* Seeker identity */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white/30 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}80)` }}
          >
            {req.seekerAvatar ? (
              <img src={req.seekerAvatar} alt={req.seekerName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-black text-sm">{req.seekerInitials}</span>
            )}
          </div>
          <div>
            <p className="text-white font-black text-sm leading-none">{req.seekerName}</p>
            <p className="text-white/60 text-[11px] flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />{req.location}
            </p>
          </div>
        </div>

        {/* Request title */}
        <h2 className="text-white font-black text-2xl leading-tight tracking-tight mb-3">{req.title}</h2>

        {/* Details row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {req.available_from && (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Calendar className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-bold text-white">{formatDate(req.available_from)}</span>
            </div>
          )}
          {timeSlot && (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-bold text-white">{timeSlot}</span>
            </div>
          )}
          {req.minimum_booking_hours && (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Clock className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-bold text-white">{req.minimum_booking_hours}h</span>
            </div>
          )}
          {days.length > 0 && (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Calendar className="w-3 h-3 text-white/70" />
              <span className="text-[11px] font-bold text-white">{days.slice(0, 3).join(', ')}{days.length > 3 ? '…' : ''}</span>
            </div>
          )}
          {req.price > 0 && (
            <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: `${cat.color}33`, border: `1px solid ${cat.color}66` }}>
              <DollarSign className="w-3 h-3" style={{ color: cat.color }} />
              <span className="text-[11px] font-bold" style={{ color: cat.color }}>{req.price}/{req.pricing_unit}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {req.description && (
          <p className="text-white/70 text-[13px] leading-snug line-clamp-2 mb-4">{req.description}</p>
        )}

        {/* Urgency */}
        {req.status === 'urgent' && (
          <div className="inline-flex items-center gap-1 bg-red-500/20 border border-red-500/40 rounded-full px-2.5 py-1 mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Urgent</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Page ─── */
export default function SeekersPage() {
  const { navigate } = useAppNavigate();
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['seeker-requests-deck'],
    queryFn: async () => {
      const { data: reqs, error } = await supabase
        .from('listings')
        .select('*')
        .eq('listing_type', 'request')
        .eq('mode', 'seek')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !reqs?.length) return [];

      const ownerIds = [...new Set(reqs.map(r => r.owner_id).filter(Boolean))] as string[];
      const { data: profiles } = await supabase
        .from('client_profiles')
        .select('user_id, name, profile_images')
        .in('user_id', ownerIds);

      const profileMap: Record<string, any> = {};
      for (const p of profiles ?? []) profileMap[p.user_id] = p;

      return reqs.map(r => ({
        ...r,
        seekerName: profileMap[r.owner_id]?.name ?? 'Anonymous',
        seekerAvatar: profileMap[r.owner_id]?.profile_images?.[0] ?? null,
        seekerInitials: getInitials(profileMap[r.owner_id]?.name ?? 'AN'),
      })) as SeekerRequest[];
    },
  });

  const visible = requests.filter(r => !dismissed.has(r.id));
  const top3 = visible.slice(0, 3);

  const handleSwipe = (id: string, dir: 'left' | 'right') => {
    if (dir === 'right' && user) {
      // Open message with this user
      const req = requests.find(r => r.id === id);
      if (req?.owner_id) navigate(`/messages?userId=${req.owner_id}`);
    }
    setDismissed(prev => new Set([...prev, id]));
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: isLight ? '#f8f8f8' : '#0a0a0a' }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-4 z-10"
        style={{ paddingTop: 'calc(var(--safe-top, 0px) + 56px)', paddingBottom: 12 }}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: isLight ? '#000' : '#fff' }} />
          </motion.button>
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tight" style={{ color: isLight ? '#000' : '#fff' }}>Seekers</h1>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {visible.length} request{visible.length !== 1 ? 's' : ''} nearby
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }}>
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Seeking help</span>
        </div>
      </div>

      {/* Swipe deck */}
      <div className="flex-1 relative px-4" style={{ paddingBottom: 'calc(var(--safe-bottom, 0px) + 100px)' }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full border-2 animate-spin ${isLight ? 'border-black/10 border-t-black/80' : 'border-white/20 border-t-white'}`} />
          </div>
        ) : visible.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${isLight ? 'bg-black/5' : 'bg-white/5'}`}>
              <Users className={`w-8 h-8 ${isLight ? 'text-black/20' : 'text-white/20'}`} />
            </div>
            <div>
              <p className={`font-black text-xl mb-1 ${isLight ? 'text-black' : 'text-white'}`}>No requests right now</p>
              <p className={`text-sm ${isLight ? 'text-black/40' : 'text-white/40'}`}>Check back soon — new requests are posted daily.</p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setDismissed(new Set())} className={`px-6 py-3 rounded-2xl font-bold text-sm border ${isLight ? 'bg-black/5 text-black border-black/10' : 'bg-white/10 text-white border-white/10'}`}>
              Refresh deck
            </motion.button>
          </div>
        ) : (
          <div className="absolute inset-4" style={{ bottom: 'calc(var(--safe-bottom, 0px) + 100px)' }}>
            {/* Background cards (visual depth) */}
            {top3.slice(1).reverse().map((req, i) => {
              const offset = top3.slice(1).length - 1 - i;
              return (
                <motion.div
                  key={req.id}
                  className="absolute inset-0 rounded-[28px] overflow-hidden"
                  style={{
                    transform: `scale(${1 - (offset + 1) * 0.04}) translateY(${(offset + 1) * -10}px)`,
                    zIndex: top3.length - offset - 2,
                    opacity: 1 - (offset + 1) * 0.15,
                  }}
                >
                  <SeekerCard req={req} isTop={false} onSwipe={() => {}} />
                </motion.div>
              );
            })}

            {/* Top card */}
            <AnimatePresence>
              {top3[0] && (
                <motion.div
                  key={top3[0].id}
                  className="absolute inset-0"
                  style={{ zIndex: 10 }}
                  exit={{ x: 0, opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
                >
                  <SeekerCard req={top3[0]} isTop onSwipe={dir => handleSwipe(top3[0].id, dir)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom action hint */}
      {visible.length > 0 && (
        <div
          className="shrink-0 flex items-center justify-center gap-8 px-6"
          style={{ paddingBottom: 'calc(var(--safe-bottom, 0px) + 24px)', paddingTop: 8 }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => top3[0] && handleSwipe(top3[0].id, 'left')}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-red-500/40 bg-red-500/10 shadow-lg"
          >
            <X className="w-6 h-6 text-red-400" />
          </motion.button>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Swipe or tap</p>
            <p className="text-[10px] text-muted-foreground/60">→ to message · ← to skip</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => top3[0] && handleSwipe(top3[0].id, 'right')}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-green-500/40 bg-green-500/10 shadow-lg"
          >
            <MessageCircle className="w-6 h-6 text-green-400" />
          </motion.button>
        </div>
      )}
    </div>
  );
}
