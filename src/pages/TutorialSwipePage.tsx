/**
 * TUTORIAL SWIPE PAGE — 2026 Liquid Glass Design
 *
 * Interactive onboarding for new users. No login required.
 * Demonstrates both roles:
 *   CLIENT VIEW  → browse listings (properties, workers, motos, bicycles)
 *   OWNER VIEW   → browse client profiles (men & women)
 *
 * 2026 DESIGN UPGRADES:
 *   - Dark ambient background is NOW VISIBLE (removed the white/90 killer overlay)
 *   - Header, tabs, mode toggle: all Liquid Glass
 *   - Swipe card info panel: dark Liquid Glass frosted bottom
 *   - Action buttons: full Liquid Glass with coloured rims + animated highlights
 *   - Insights modal: dark Liquid Glass sheet with staggered list entrance
 *   - Hint banner: amber-tinted glass
 *   - Empty state: glass card
 *   - All buttons get spring tap compression + liquid ripple via motion.button
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import {
  Home, Wrench, Bike, Car, User, Users,
  X, Info, Star, MapPin, CheckCircle,
  Sparkles, ArrowRight, BadgeCheck, DollarSign, RotateCcw, ChevronLeft,
  Flame, ThumbsDown,
} from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';
import {
  tutorialListings,
  tutorialClientProfiles,
  TutorialListing,
  TutorialClientProfile,
  TutorialCategory,
  ClientGender,
  TutorialInsight,
} from '@/data/tutorialCards';
import { triggerHaptic } from '@/utils/haptics';
import { useNavigate } from 'react-router-dom';

import { GradientOverlay } from '@/components/ui/GradientMasks';
import CardImage from '@/components/CardImage';

// ── Physics ───────────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 350;
const MAX_ROTATION = 10;
const getExitX = () =>
  typeof window !== 'undefined' ? window.innerWidth * 1.5 : 700;

// ── Category metadata ─────────────────────────────────────────────────────────
const LISTING_CATS = [
  { key: 'property' as TutorialCategory, label: 'Properties', Icon: Home, activeColor: '#60a5fa' },
  { key: 'worker' as TutorialCategory, label: 'Workers', Icon: Wrench, activeColor: '#c084fc' },
  { key: 'motorcycle' as TutorialCategory, label: 'Motos', Icon: Car, activeColor: '#fb923c' },
  { key: 'bicycle' as TutorialCategory, label: 'Bicycles', Icon: Bike, activeColor: '#4ade80' },
];

const CLIENT_CATS = [
  { key: 'male' as ClientGender, label: 'Men', Icon: User, activeColor: '#22d3ee' },
  { key: 'female' as ClientGender, label: 'Women', Icon: Users, activeColor: '#f472b6' },
];

function fmt(price: number, unit: string) {
  const n = price.toLocaleString('es-MX');
  return unit === 'sale' ? `$${n}` : `$${n}${unit}`;
}

// ── Spring configs ────────────────────────────────────────────────────────────
const TAP_SPRING = { type: 'spring' as const, stiffness: 440, damping: 24, mass: 0.6 };
const MODAL_SPRING = { type: 'spring' as const, stiffness: 380, damping: 30, mass: 0.8 };

// ── Ripple helper ─────────────────────────────────────────────────────────────
interface Ripple { id: number; x: number; y: number }
function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const spawn = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples(p => [...p, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 660);
  }, []);
  const nodes = ripples.map(({ id, x, y }) => (
    <motion.span
      key={id}
      initial={{ scale: 0, opacity: 0.4 }}
      animate={{ scale: 4.5, opacity: 0 }}
      transition={{ duration: 0.58, ease: [0, 0.55, 0.45, 1] }}
      style={{
        position: 'absolute', left: x, top: y,
        width: 36, height: 36, marginLeft: -18, marginTop: -18,
        borderRadius: '50%', background: 'rgba(255,255,255,0.30)',
        pointerEvents: 'none', zIndex: 99,
      }}
    />
  ));
  return { spawn, nodes };
}

// ── INSIGHTS MODAL ────────────────────────────────────────────────────────────
function InsightsModal({
  title, subtitle, insights, image, onClose,
}: {
  title: string; subtitle?: string;
  insights: TutorialInsight[]; image?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop — heavy blur reveals the glass aesthetic */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.65)' }}
      />

      {/* ── Glass Sheet ── */}
      <motion.div
        initial={{ y: '100%', scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: '100%', scale: 0.97 }}
        transition={MODAL_SPRING}
        className="relative w-full max-w-md overflow-hidden rounded-t-[32px]"
        onClick={e => e.stopPropagation()}
        style={{
          /* LIQUID GLASS base */
          backgroundColor: 'rgba(14,14,18,0.88)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: '1px solid rgba(255,255,255,0.12)',
          borderBottom: 'none',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 -16px 48px rgba(0,0,0,0.50)',
        }}
      >
        {/* Liquid highlight drift on the sheet */}
        <div
          aria-hidden="true"
          className="liquid-glass-highlight--animated pointer-events-none absolute inset-0"
          style={{
            borderRadius: 'inherit',
            background: `
              radial-gradient(ellipse 160% 50% at 20% 0%,
                rgba(255,255,255,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 80% 40% at 88% 105%,
                rgba(249,115,22,0.08) 0%, transparent 55%)
            `,
            backgroundSize: '220% 220%, 100% 100%',
            zIndex: 1,
          }}
        />

        <div className="relative" style={{ zIndex: 2 }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header image */}
          {image && (
            <div className="h-28 overflow-hidden relative mt-3 mx-4 rounded-2xl">
              <img src={image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,14,18,0.85)] to-transparent rounded-2xl" />
            </div>
          )}

          <div className="px-5 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">6 Key Insights</span>
            </div>
            <p className="text-xl font-black text-white leading-tight">{title}</p>
            {subtitle && <p className="text-sm text-white/50 mt-0.5 font-semibold">{subtitle}</p>}
          </div>

          {/* Insight list — stagger in */}
          <div className="px-4 pb-3 mt-3 space-y-2 overflow-y-auto max-h-[48vh]">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 340, damping: 24, delay: i * 0.055 }}
                className="flex items-start gap-3 p-3.5 rounded-2xl border"
                style={{
                  background: ins.highlight
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(255,255,255,0.05)',
                  borderColor: ins.highlight
                    ? 'rgba(245,158,11,0.35)'
                    : 'rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl leading-none mt-0.5 flex-shrink-0">{ins.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-wider mb-0.5">
                    {ins.question}
                  </p>
                  <p className={`text-sm leading-snug font-semibold ${ins.highlight ? 'text-amber-300' : 'text-white/80'}`}>
                    {ins.answer}
                  </p>
                </div>
                {ins.highlight && <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />}
              </motion.div>
            ))}
          </div>

          <div className="px-4 pb-10 pt-1">
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.96, transition: TAP_SPRING }}
              className="w-full py-4 rounded-2xl text-sm font-black text-white relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 12px rgba(0,0,0,0.30)',
              }}
            >
              <span className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-2xl"
                style={{
                  background: 'radial-gradient(ellipse 140% 60% at 20% 0%, rgba(255,255,255,0.14) 0%, transparent 60%)',
                  backgroundSize: '220% 220%',
                }}
              />
              <span className="relative z-10">Got it — let's swipe!</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── SWIPE CARD WRAPPER ────────────────────────────────────────────────────────
function SwipeCard({ stackIndex, children, onSwipe }: {
  stackIndex: number;
  children: React.ReactNode;
  onSwipe: (dir: 'left' | 'right') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.8, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.8, 0]);
  const isExiting = useRef(false);
  const isTop = stackIndex === 0;

  const exit = useCallback((dir: 'left' | 'right') => {
    if (isExiting.current) return;
    isExiting.current = true;
    triggerHaptic(dir === 'right' ? 'success' : 'warning');
    animate(x, dir === 'right' ? getExitX() : -getExitX(), {
      type: 'spring', stiffness: 380, damping: 28,
      onComplete: () => onSwipe(dir),
    });
  }, [x, onSwipe]);

  const onPanEnd = useCallback((_: unknown, info: PanInfo) => {
    const ox = info.offset.x, vx = info.velocity.x;
    if (ox > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) exit('right');
    else if (ox < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) exit('left');
    else animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 });
  }, [x, exit]);

  const scale = 1 - stackIndex * 0.04;
  const yOffset = stackIndex * 12;

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      style={
        isTop
          ? { x, rotate, zIndex: 20 - stackIndex, borderRadius: 28 }
          : { scale, y: yOffset, zIndex: 20 - stackIndex, borderRadius: 28 }
      }
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.88}
      onPanEnd={isTop ? onPanEnd : undefined}
    >
      {/* LIKE / PASS overlays */}
      {isTop && (
        <>
          <motion.div style={{ opacity: likeOpacity }}
            className="absolute top-7 left-5 z-30 pointer-events-none">
            <div className="border-[3px] border-green-400 rounded-xl px-3 py-1 -rotate-12"
              style={{ background: 'rgba(0,200,80,0.18)' }}>
              <span className="text-green-400 font-black text-xl tracking-widest drop-shadow-lg">LIKE</span>
            </div>
          </motion.div>
          <motion.div style={{ opacity: passOpacity }}
            className="absolute top-7 right-5 z-30 pointer-events-none">
            <div className="border-[3px] border-red-400 rounded-xl px-3 py-1 rotate-12"
              style={{ background: 'rgba(255,60,60,0.18)' }}>
              <span className="text-red-400 font-black text-xl tracking-widest drop-shadow-lg">PASS</span>
            </div>
          </motion.div>
        </>
      )}
      {children}
    </motion.div>
  );
}

// ── LISTING CARD CONTENT ──────────────────────────────────────────────────────
function ListingCardContent({ listing, onInsights, imgIdx, setImgIdx }: {
  listing: TutorialListing;
  onInsights: () => void;
  imgIdx: number;
  setImgIdx: (fn: (p: number) => number) => void;
}) {
  const cat = LISTING_CATS.find(c => c.key === listing.category)!;
  const { spawn: spawnRipple, nodes: rippleNodes } = useRipple();

  const images = useMemo(() => {
    let result: string[] = [];
    if (listing.video_url) {
      result.push('video_attachment');
    }
    result = [...result, ...listing.images];
    return result;
  }, [listing.images, listing.video_url]);

  const currentMedia = images[imgIdx] || images[0];

  return (
    <div className="relative w-full h-full select-none touch-none flex flex-col" style={{ background: '#0a0a0e' }}>
      {/* Photo area */}
      <div className="relative w-full h-[60%] overflow-hidden">
        {currentMedia === 'video_attachment' && listing.video_url ? (
          <video
            src={listing.video_url}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover relative z-0"
          />
        ) : (
          <img src={currentMedia} alt={listing.title}
            className="w-full h-full object-cover relative z-0" draggable={false} />
        )}

        {/* Tap zones for image navigation */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full" onClick={() => setImgIdx(p => Math.max(0, p - 1))} />
          <div className="w-1/2 h-full" onClick={() => setImgIdx(p => Math.min(images.length - 1, p + 1))} />
        </div>

        {/* Dot indicator */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
            {images.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIdx ? 'bg-white shadow' : 'bg-white/35'}`} />
            ))}
          </div>
        )}

        {/* Category chip — glass */}
        <div className="absolute top-8 right-4 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
            style={{
              backdropFilter: 'none',
              background: 'rgba(20,20,24,0.85)',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
            }}>
            <cat.Icon className="w-3 h-3" style={{ color: cat.activeColor }} />
            {cat.label}
          </span>
        </div>

        {/* Photo bottom gradient — blends into the dark info panel */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[rgba(10,10,14,0.25)] to-transparent" />
      </div>

      {/* ── Info panel — Liquid Glass dark ── */}
      <div className="flex-1 p-5 flex flex-col justify-between relative">
        {/* Subtle inner glass highlight on info panel top edge */}
        <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 right-0 h-px"
          style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="space-y-1">
          {/* Owner row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src={listing.ownerAvatar} alt="" draggable={false}
                className="w-7 h-7 rounded-full object-cover"
                style={{ border: '2px solid rgba(255,255,255,0.15)' }} />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold text-[11px] leading-none">{listing.ownerName}</span>
                  {listing.ownerVerified && <BadgeCheck className="w-3 h-3 text-blue-400" />}
                </div>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-white/40 text-[9px] font-bold">{listing.ownerRating}</span>
                </div>
              </div>
            </div>
            {/* Price badge — glass */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.30)',
                backdropFilter: 'none',
              }}>
              <span className="text-green-400 font-black text-sm">{fmt(listing.price, listing.priceUnit)}</span>
            </div>
          </div>

          <h2 className="text-lg font-black text-white leading-tight mb-1">{listing.title}</h2>
          <div className="flex items-center gap-2 text-white/40">
            <MapPin className="w-3 h-3" />
            <span className="text-xs font-semibold">{listing.city}, MX</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white/55"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}>
                {t}
              </span>
            ))}
          </div>

          {/* Insights button — amber glass */}
          <motion.button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); spawnRipple(e); onInsights(); }}
            whileTap={{ scale: 0.96, transition: TAP_SPRING }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest relative overflow-hidden"
            style={{
              background: 'rgba(245,158,11,0.16)',
              backdropFilter: 'none',
              border: '1px solid rgba(245,158,11,0.40)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 12px rgba(245,158,11,0.20)',
              color: '#fbbf24',
            }}
          >
            {rippleNodes}
            <span className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse 140% 60% at 20% 0%, rgba(255,220,80,0.22) 0%, transparent 60%)',
                backgroundSize: '220% 220%',
              }}
            />
            <Sparkles className="w-4 h-4 relative z-10" />
            <span className="relative z-10">See 6 Pro Insights</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 relative z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── CLIENT CARD CONTENT ───────────────────────────────────────────────────────
function ClientCardContent({ profile, onInsights, imgIdx, setImgIdx }: {
  profile: TutorialClientProfile;
  onInsights: () => void;
  imgIdx: number;
  setImgIdx: (fn: (p: number) => number) => void;
}) {
  const gc = CLIENT_CATS.find(c => c.key === profile.gender)!;
  const { spawn: spawnRipple, nodes: rippleNodes } = useRipple();

  return (
    <div className="relative w-full h-full select-none touch-none flex flex-col" style={{ background: '#0a0a0e' }}>
      {/* Photo area */}
      <div className="relative w-full h-[60%] overflow-hidden">
        <img src={profile.profile_images[imgIdx]} alt={profile.name}
          className="w-full h-full object-cover" draggable={false} />

        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full" onClick={() => setImgIdx(p => Math.max(0, p - 1))} />
          <div className="w-1/2 h-full" onClick={() => setImgIdx(p => Math.min(profile.profile_images.length - 1, p + 1))} />
        </div>

        {profile.profile_images.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
            {profile.profile_images.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIdx ? 'bg-white shadow' : 'bg-white/35'}`} />
            ))}
          </div>
        )}

        <div className="absolute top-8 right-4 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white"
            style={{
              backdropFilter: 'none',
              background: 'rgba(20,20,24,0.85)',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
            }}>
            <gc.Icon className="w-3 h-3" style={{ color: gc.activeColor }} />
            {gc.label}
          </span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0e] via-[rgba(10,10,14,0.15)] to-transparent" />
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between relative">
        <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 right-0 h-px"
          style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white leading-none">{profile.name}</h2>
              <span className="text-white/30 text-xl font-bold leading-none">{profile.age}</span>
              {profile.verified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="px-2.5 py-1.5 rounded-xl"
              style={{
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.28)',
              }}>
              <span className="text-green-400 text-[10px] font-black">✓ Budget</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-white/40 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{profile.city}, MX</span>
          </div>

          <p className="text-white/50 text-xs leading-relaxed font-medium line-clamp-2">{profile.bio}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white/75 text-[11px] font-black">
              ${profile.budget_min.toLocaleString()} – ${profile.budget_max.toLocaleString()} MXN
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map(i => (
              <span key={i} className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white/55"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}>
                {i}
              </span>
            ))}
          </div>

          <motion.button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); spawnRipple(e); onInsights(); }}
            whileTap={{ scale: 0.96, transition: TAP_SPRING }}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest relative overflow-hidden"
            style={{
              background: 'rgba(245,158,11,0.16)',
              backdropFilter: 'none',
              border: '1px solid rgba(245,158,11,0.40)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 12px rgba(245,158,11,0.20)',
              color: '#fbbf24',
            }}
          >
            {rippleNodes}
            <span className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse 140% 60% at 20% 0%, rgba(255,220,80,0.22) 0%, transparent 60%)',
                backgroundSize: '220% 220%',
              }}
            />
            <Sparkles className="w-4 h-4 relative z-10" />
            <span className="relative z-10">See 6 Member Insights</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 relative z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Stateful card wrappers ────────────────────────────────────────────────────
function ListingCardWrapper({ listing, stackIndex, onSwipe, onInsights }: {
  listing: TutorialListing; stackIndex: number;
  onSwipe: (d: 'left' | 'right') => void; onInsights: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <SwipeCard stackIndex={stackIndex} onSwipe={onSwipe}>
      <ListingCardContent listing={listing} onInsights={onInsights} imgIdx={imgIdx} setImgIdx={setImgIdx} />
    </SwipeCard>
  );
}

function ClientCardWrapper({ profile, stackIndex, onSwipe, onInsights }: {
  profile: TutorialClientProfile; stackIndex: number;
  onSwipe: (d: 'left' | 'right') => void; onInsights: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <SwipeCard stackIndex={stackIndex} onSwipe={onSwipe}>
      <ClientCardContent profile={profile} onInsights={onInsights} imgIdx={imgIdx} setImgIdx={setImgIdx} />
    </SwipeCard>
  );
}

// ── GLASS BUTTON ──────────────────────────────────────────────────────────────
// Reusable liquid-glass circular button for the action bar
function GlassActionButton({
  onClick, size, iconColor, borderColor, glowColor, ariaLabel, children, disabled,
}: {
  onClick: () => void;
  size: number;
  iconColor: string;
  borderColor: string;
  glowColor: string;
  ariaLabel: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { spawn, nodes } = useRipple();
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      aria-label={ariaLabel}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={e => { spawn(e); triggerHaptic('light'); onClick(); }}
      whileTap={{ scale: 0.87, transition: TAP_SPRING }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: pressed ? `rgba(${glowColor},0.28)` : `rgba(${glowColor},0.12)`,
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
        border: `1px solid ${borderColor}`,
        boxShadow: pressed
          ? `inset 0 2px 6px rgba(0,0,0,0.40)`
          : `inset 0 1px 0 rgba(255,255,255,0.18), 0 6px 18px rgba(0,0,0,0.40)`,
        transform: 'translateZ(0)',
        position: 'relative',
        overflow: 'hidden',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
      }}
      className="flex items-center justify-center touch-manipulation select-none"
    >
      {/* Liquid highlight */}
      <span
        aria-hidden="true"
        className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(ellipse 150% 65% at 25% 8%, rgba(255,255,255,0.20) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 85% 95%, rgba(${glowColor},0.18) 0%, transparent 55%)
          `,
          backgroundSize: '220% 220%, 100% 100%',
        }}
      />
      {nodes}
      <span style={{
        color: iconColor, position: 'relative', zIndex: 3,
        filter: `drop-shadow(0 0 6px rgba(${glowColor},0.55))`
      }}>
        {children}
      </span>
    </motion.button>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
function EmptyState({ label, onReset }: { label: string; onReset: () => void }) {
  const { spawn, nodes } = useRipple();
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[28px]"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'none',
        border: '1px dashed rgba(255,255,255,0.15)',
      }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
        }}>
        <RotateCcw className="w-8 h-8 text-white/30" />
      </div>
      <p className="text-white/40 text-sm font-bold">All {label} explored!</p>
      <motion.button
        onClick={e => { spawn(e); onReset(); }}
        whileTap={{ scale: 0.95, transition: TAP_SPRING }}
        className="px-8 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        {nodes}
        <span className="relative z-10">See them again</span>
      </motion.button>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
type ViewMode = 'client' | 'owner';

export default function TutorialSwipePage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<ViewMode>('client');

  const [listCat, setListCat] = useState<TutorialCategory>('property');
  const [listDeck, setListDeck] = useState<TutorialListing[]>(() => [...tutorialListings.property]);
  const [listLikes, setListLikes] = useState(0);
  const [listPasses, setListPasses] = useState(0);

  const [cliGender, setCliGender] = useState<ClientGender>('male');
  const [cliDeck, setCliDeck] = useState<TutorialClientProfile[]>(() => [...tutorialClientProfiles.male]);
  const [cliLikes, setCliLikes] = useState(0);
  const [cliPasses, setCliPasses] = useState(0);

  const [modal, setModal] = useState<
    | { kind: 'listing'; data: TutorialListing }
    | { kind: 'client'; data: TutorialClientProfile }
    | null
  >(null);

  const [hint, setHint] = useState(true);

  const switchListCat = (cat: TutorialCategory) => { setListCat(cat); setListDeck([...tutorialListings[cat]]); };
  const switchCliGender = (g: ClientGender) => { setCliGender(g); setCliDeck([...tutorialClientProfiles[g]]); };

  const handleListSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') setListLikes(p => p + 1); else setListPasses(p => p + 1);
    setListDeck(prev => prev.slice(1));
  }, []);

  const handleCliSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') setCliLikes(p => p + 1); else setCliPasses(p => p + 1);
    setCliDeck(prev => prev.slice(1));
  }, []);

  const hintH = hint ? 60 : 0;
  const cardAreaH = `calc(100dvh - ${88 + 50 + hintH + 110 + 28 + 16}px)`;

  const likes = mode === 'client' ? listLikes : cliLikes;
  const passes = mode === 'client' ? listPasses : cliPasses;
  const catLabel = mode === 'client'
    ? (LISTING_CATS.find(c => c.key === listCat)?.label ?? 'cards')
    : (CLIENT_CATS.find(c => c.key === cliGender)?.label ?? 'clients');
  const deckLen = mode === 'client' ? listDeck.length : cliDeck.length;

  // Back button ripple
  const { spawn: backRipple, nodes: backNodes } = useRipple();

  return (
    <div
      className="w-full relative flex flex-col"
      style={{ minHeight: '100dvh', overflowX: 'hidden', overflowY: 'hidden' }}
    >
      {/* Dark vignette — replaces the white/90 killer; darkens without hiding */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0,
        background: 'linear-gradient(180deg, rgba(8,8,12,0.72) 0%, rgba(6,6,10,0.60) 40%, rgba(8,8,12,0.80) 100%)',
      }} />

      {/* Cinematic edge darkening */}
      <GradientOverlay light={false} intensity={0.4} />

      <div className="relative z-10 w-full min-h-dvh flex flex-col">

        {/* ── HEADER — Liquid Glass ──────────────────────── */}
        <div style={{ flexShrink: 0, padding: '16px 16px 10px' }}>
          <div className="flex items-center justify-between mb-4">

            {/* Back button — glass */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={e => { backRipple(e); navigate(-1); }}
                aria-label="Back"
                whileTap={{ scale: 0.90, transition: TAP_SPRING }}
                className="flex items-center justify-center rounded-2xl shrink-0 relative overflow-hidden"
                style={{
                  width: 44, height: 44,
                  background: 'rgba(255,255,255,0.08)',
                  background: 'rgba(20,20,24,0.90)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 8px rgba(0,0,0,0.30)',
                }}
              >
                {backNodes}
                <span
                  aria-hidden="true"
                  className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-2xl"
                  style={{
                    background: 'radial-gradient(ellipse 150% 70% at 20% 0%, rgba(255,255,255,0.20) 0%, transparent 60%)',
                    backgroundSize: '220% 220%',
                  }}
                />
                <ChevronLeft className="w-6 h-6 text-white relative z-10" />
              </motion.button>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <SwipessLogo size="sm" />
                  <span className="text-2xl font-black text-white tracking-tight">Swipess</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <p className="text-[11px] uppercase font-black tracking-widest text-[#E4007C]">Premium Network</p>
                </div>
              </div>
            </div>

            {/* Like / Pass counters — glass pills */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.06)',
                background: 'rgba(20,20,24,0.85)',
              }}>
              <div className="px-3 py-1.5 rounded-xl text-center min-w-[48px]"
                style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.22)' }}>
                <p className="text-green-400 font-black text-sm leading-none">{likes}</p>
                <p className="text-[8px] font-black uppercase tracking-tighter text-white/35 mt-1">Likes</p>
              </div>
              <div className="px-3 py-1.5 rounded-xl text-center min-w-[48px]"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}>
                <p className="text-red-400 font-black text-sm leading-none">{passes}</p>
                <p className="text-[8px] font-black uppercase tracking-tighter text-white/35 mt-1">Passes</p>
              </div>
            </div>
          </div>

          {/* Mode toggle — glass pill */}
          <div className="flex gap-1.5 p-1.5 rounded-[22px]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'none',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
            {([
              { val: 'client' as ViewMode, Icon: Home, label: 'Browsing' },
              { val: 'owner' as ViewMode, Icon: Users, label: 'Profiles' },
            ] as const).map(({ val, Icon, label }) => {
              const active = mode === val;
              return (
                <motion.button
                  key={val}
                  onClick={() => { triggerHaptic('light'); setMode(val); }}
                  whileTap={{ scale: 0.95, transition: TAP_SPRING }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[18px] text-xs font-black uppercase tracking-widest relative overflow-hidden transition-colors"
                  style={active ? {
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'none',
                    border: '1px solid rgba(255,255,255,0.22)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 12px rgba(0,0,0,0.30)',
                    color: 'white',
                  } : {
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.50)',
                    border: '1px solid transparent',
                  }}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-[16px]"
                      style={{
                        background: 'radial-gradient(ellipse 150% 70% at 20% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)',
                        backgroundSize: '220% 220%',
                      }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </motion.button>
              );
            })}
          </div>

          <p className="text-[10px] font-black text-center mt-2 text-white/25 uppercase tracking-widest">
            {mode === 'client' ? 'Explore premium listings near you' : 'Discover clients ready to engage'}
          </p>
        </div>

        {/* ── CATEGORY TABS — glass pills ─────────────────── */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px', overflowX: 'auto' }} className="no-scrollbar">
          <div className="flex gap-2">
            {(mode === 'client' ? LISTING_CATS : CLIENT_CATS).map(c => {
              const active = mode === 'client'
                ? listCat === (c as typeof LISTING_CATS[0]).key
                : cliGender === (c as typeof CLIENT_CATS[0]).key;
              return (
                <motion.button
                  key={c.key}
                  onClick={() => {
                    triggerHaptic('light');
                    if (mode === 'client') switchListCat((c as typeof LISTING_CATS[0]).key);
                    else switchCliGender((c as typeof CLIENT_CATS[0]).key);
                  }}
                  whileTap={{ scale: 0.93, transition: TAP_SPRING }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest relative overflow-hidden transition-all"
                  style={active ? {
                    background: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    border: `1px solid rgba(255,255,255,0.25)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 12px rgba(0,0,0,0.25)`,
                    color: 'white',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.50)',
                  }}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="liquid-glass-highlight--animated pointer-events-none absolute inset-0 rounded-2xl"
                      style={{
                        background: `radial-gradient(ellipse 150% 70% at 20% 0%, rgba(255,255,255,0.22) 0%, transparent 60%)`,
                        backgroundSize: '220% 220%',
                      }}
                    />
                  )}
                  <c.Icon className="w-4 h-4 relative z-10" style={{ color: active ? c.activeColor : undefined }} />
                  <span className="relative z-10">{c.label}</span>
                  <span className="relative z-10 text-[9px] opacity-50 ml-0.5">
                    {mode === 'client'
                      ? tutorialListings[(c as typeof LISTING_CATS[0]).key].length
                      : tutorialClientProfiles[(c as typeof CLIENT_CATS[0]).key].length}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── HINT BANNER — amber glass ───────────────────── */}
        <AnimatePresence>
          {hint && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="mx-4 overflow-hidden"
              style={{ flexShrink: 0 }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-[20px]"
                style={{
                  background: 'rgba(245,158,11,0.10)',
                  backdropFilter: 'blur(20px) saturate(160%)',
                  border: '1px solid rgba(245,158,11,0.28)',
                  boxShadow: 'inset 0 1px 0 rgba(255,220,80,0.14)',
                }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.30)' }}>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] font-bold leading-tight text-amber-200/80">
                  Drag <span className="text-green-400 font-black">right</span> to like ·{' '}
                  <span className="text-red-400 font-black">left</span> to pass ·{' '}
                  tap <span className="text-amber-300 font-black">Pro Insights</span> to learn more
                </p>
                <motion.button
                  onClick={() => setHint(false)}
                  aria-label="Close hint"
                  whileTap={{ scale: 0.88 }}
                  className="ml-auto shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  <X className="w-3 h-3 text-white/50" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CARD STACK ──────────────────────────────────── */}
        <div style={{
          flexShrink: 0, position: 'relative',
          margin: '0 16px', height: cardAreaH,
          minHeight: '360px', maxHeight: '580px',
        }}>
          {mode === 'client' ? (
            listDeck.length === 0
              ? <EmptyState label={catLabel} onReset={() => setListDeck([...tutorialListings[listCat]])} />
              : listDeck.slice(0, 3).reverse().map((listing, revIdx) => {
                const stackIndex = Math.min(listDeck.length, 3) - 1 - revIdx;
                return (
                  <ListingCardWrapper key={listing.id} listing={listing} stackIndex={stackIndex}
                    onSwipe={handleListSwipe} onInsights={() => setModal({ kind: 'listing', data: listing })} />
                );
              })
          ) : (
            cliDeck.length === 0
              ? <EmptyState label={catLabel} onReset={() => setCliDeck([...tutorialClientProfiles[cliGender]])} />
              : cliDeck.slice(0, 3).reverse().map((profile, revIdx) => {
                const stackIndex = Math.min(cliDeck.length, 3) - 1 - revIdx;
                return (
                  <ClientCardWrapper key={profile.id} profile={profile} stackIndex={stackIndex}
                    onSwipe={handleCliSwipe} onInsights={() => setModal({ kind: 'client', data: profile })} />
                );
              })
          )}
        </div>

        {/* ── ACTION BUTTONS — full Liquid Glass ─────────── */}
        <div style={{ flexShrink: 0, padding: '16px 16px 0' }} className="mt-auto">
          <div className="flex items-center justify-center gap-6">

            {/* Pass — red glass */}
            <GlassActionButton
              size={64}
              ariaLabel="Pass"
              iconColor="#ef4444"
              borderColor="rgba(239,68,68,0.75)"
              glowColor="239,68,68"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) handleListSwipe('left');
                else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('left');
              }}
            >
              <ThumbsDown size={28} fill="currentColor" />
            </GlassActionButton>

            {/* Info — amber glass */}
            <GlassActionButton
              size={52}
              ariaLabel="Show insights"
              iconColor="#fbbf24"
              borderColor="rgba(245,158,11,0.65)"
              glowColor="245,158,11"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) setModal({ kind: 'listing', data: listDeck[0] });
                else if (mode === 'owner' && cliDeck.length > 0) setModal({ kind: 'client', data: cliDeck[0] });
              }}
            >
              <Info size={22} />
            </GlassActionButton>

            {/* Like — orange glass */}
            <GlassActionButton
              size={64}
              ariaLabel="Like"
              iconColor="#f97316"
              borderColor="rgba(249,115,22,0.80)"
              glowColor="249,115,22"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) handleListSwipe('right');
                else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('right');
              }}
            >
              <Flame size={28} fill="currentColor" />
            </GlassActionButton>
          </div>

          {/* Counter */}
          <p className="text-center mt-3 pb-6 font-black uppercase tracking-widest text-white/20"
            style={{ fontSize: 9 }}>
            {deckLen} {catLabel} left · {likes} liked · {passes} passed
          </p>
        </div>

        {/* ── INSIGHTS MODAL ──────────────────────────────── */}
        <AnimatePresence>
          {modal && (
            <InsightsModal
              key="insights-modal"
              title={modal.kind === 'listing' ? modal.data.title : `${modal.data.name}, ${(modal.data as TutorialClientProfile).age}`}
              subtitle={modal.kind === 'listing' ? (modal.data as TutorialListing).subtitle : (modal.data as TutorialClientProfile).city}
              insights={modal.data.insights}
              image={modal.kind === 'listing' ? (modal.data as TutorialListing).images[0] : (modal.data as TutorialClientProfile).profile_images[0]}
              onClose={() => setModal(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
