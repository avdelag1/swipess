/**
 * TUTORIAL SWIPE PAGE  — /tutorial
 *
 * Interactive onboarding for new users. No login required.
 * Demonstrates both roles:
 *   CLIENT VIEW  → browse listings (properties, workers, motos, bicycles)
 *   OWNER VIEW   → browse client profiles (men & women)
 *
 * Each card has 6 key insights in a slide-up modal.
 * Swipe right = Like · Swipe left = Pass · Button = Insights
 */

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import {
  Home, Wrench, Bike, Car, User, Users,
  Heart, X, Info, Star, MapPin, CheckCircle,
  Sparkles, ArrowRight, BadgeCheck, DollarSign, RotateCcw, ChevronLeft,
  Flame, ThumbsDown
} from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { AmbientSwipeBackground } from '@/components/AmbientSwipeBackground';
import { GradientOverlay } from '@/components/ui/GradientMasks';

// ─── Physics ─────────────────────────────────────────────────
const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 350;
const MAX_ROTATION = 10;
const getExitX = () =>
  typeof window !== 'undefined' ? window.innerWidth * 1.5 : 700;

// ─── Category metadata ───────────────────────────────────────
const LISTING_CATS = [
  { key: 'property' as TutorialCategory, label: 'Properties', Icon: Home, color: 'text-blue-600', ring: 'ring-blue-500/40', bg: 'bg-blue-500/10' },
  { key: 'worker' as TutorialCategory, label: 'Workers', Icon: Wrench, color: 'text-purple-600', ring: 'ring-purple-500/40', bg: 'bg-purple-500/10' },
  { key: 'motorcycle' as TutorialCategory, label: 'Motos', Icon: Car, color: 'text-orange-600', ring: 'ring-orange-500/40', bg: 'bg-orange-500/10' },
  { key: 'bicycle' as TutorialCategory, label: 'Bicycles', Icon: Bike, color: 'text-green-600', ring: 'ring-green-500/40', bg: 'bg-green-500/10' },
];

const CLIENT_CATS = [
  { key: 'male' as ClientGender, label: 'Men', Icon: User, color: 'text-cyan-600', ring: 'ring-cyan-500/40', bg: 'bg-cyan-500/10' },
  { key: 'female' as ClientGender, label: 'Women', Icon: Users, color: 'text-pink-600', ring: 'ring-pink-500/40', bg: 'bg-pink-500/10' },
];

function fmt(price: number, unit: string) {
  const n = price.toLocaleString('es-MX');
  return unit === 'sale' ? `$${n}` : `$${n}${unit}`;
}

// ─── Insights slide-up modal ─────────────────────────────────
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 35 }}
        className="relative w-full max-w-md bg-white rounded-t-[32px] overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header image */}
        {image && (
          <div className="h-32 overflow-hidden relative mt-2">
            <img src={image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
          </div>
        )}

        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">6 Key Insights</span>
          </div>
          <p className="text-xl font-bold text-zinc-900 leading-tight">{title}</p>
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>

        {/* List */}
        <div className="px-4 pb-4 mt-3 space-y-2 overflow-y-auto max-h-[52vh]">
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055 }}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${ins.highlight
                ? 'bg-amber-50 border-amber-200 shadow-sm'
                : 'bg-zinc-50 border-zinc-100'
                }`}
            >
              <span className="text-xl leading-none mt-0.5 flex-shrink-0">{ins.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">
                  {ins.question}
                </p>
                <p className={`text-sm leading-snug font-medium ${ins.highlight ? 'text-amber-900' : 'text-zinc-700'}`}>
                  {ins.answer}
                </p>
              </div>
              {ins.highlight && <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />}
            </motion.div>
          ))}
        </div>

        <div className="px-4 pb-8">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-zinc-900 text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Single swipe card (generic) ─────────────────────────────
interface SwipeCardProps {
  stackIndex: number;   // 0 = top, 1 = middle, 2 = back
  children: React.ReactNode;
  onSwipe: (dir: 'left' | 'right') => void;
}

function SwipeCard({ stackIndex, children, onSwipe }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD], [0, 0.7, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0], [1, 0.7, 0]);
  const isExiting = useRef(false);
  const isTop = stackIndex === 0;

  const exit = useCallback(
    (dir: 'left' | 'right') => {
      if (isExiting.current) return;
      isExiting.current = true;
      triggerHaptic(dir === 'right' ? 'success' : 'warning');
      animate(x, dir === 'right' ? getExitX() : -getExitX(), {
        type: 'spring', stiffness: 380, damping: 28,
        onComplete: () => onSwipe(dir),
      });
    },
    [x, onSwipe]
  );

  const onPanEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const ox = info.offset.x, vx = info.velocity.x;
      if (ox > SWIPE_THRESHOLD || vx > VELOCITY_THRESHOLD) exit('right');
      else if (ox < -SWIPE_THRESHOLD || vx < -VELOCITY_THRESHOLD) exit('left');
      else animate(x, 0, { type: 'spring', stiffness: 420, damping: 30 });
    },
    [x, exit]
  );

  const scale = 1 - stackIndex * 0.04;
  const yOffset = stackIndex * 12;

  return (
    <motion.div
      className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl bg-white border border-zinc-100"
      style={isTop ? { x, rotate, zIndex: 20 - stackIndex } : { scale, y: yOffset, zIndex: 20 - stackIndex }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.88}
      onPanEnd={isTop ? onPanEnd : undefined}
    >
      {/* LIKE / PASS overlays — only on top card */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-7 left-5 z-30 pointer-events-none"
          >
            <div className="border-[3px] border-green-400 rounded-xl px-3 py-1 rotate-[-18deg]">
              <span className="text-green-400 font-black text-xl tracking-widest">LIKE</span>
            </div>
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-7 right-5 z-30 pointer-events-none"
          >
            <div className="border-[3px] border-red-400 rounded-xl px-3 py-1 rotate-[18deg]">
              <span className="text-red-400 font-black text-xl tracking-widest">PASS</span>
            </div>
          </motion.div>
        </>
      )}
      {children}
    </motion.div>
  );
}

// ─── Listing card content ────────────────────────────────────
function ListingCardContent({
  listing, onInsights, imgIdx, setImgIdx,
}: {
  listing: TutorialListing;
  onInsights: () => void;
  imgIdx: number;
  setImgIdx: (fn: (p: number) => number) => void;
}) {
  const cat = LISTING_CATS.find(c => c.key === listing.category)!;
  return (
    <div className="relative w-full h-full bg-white select-none touch-none flex flex-col">
      {/* Photo Area */}
      <div className="relative w-full h-[62%] overflow-hidden">
        <img
          src={listing.images[imgIdx]}
          alt={listing.title}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Image tap zones */}
        <div className="absolute inset-0 flex">
          <div
            className="w-1/2 h-full z-10"
            onClick={() => setImgIdx(p => Math.max(0, p - 1))}
          />
          <div
            className="w-1/2 h-full z-10"
            onClick={() => setImgIdx(p => Math.min(listing.images.length - 1, p + 1))}
          />
        </div>

        {/* Dot row */}
        {listing.images.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
            {listing.images.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIdx ? 'bg-white shadow-sm' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Category chip */}
        <div className="absolute top-8 right-4 z-20">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20 bg-white/10 text-white shadow-lg`}>
            <cat.Icon className="w-3 h-3" />
            {cat.label}
          </span>
        </div>

        {/* Photo Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Info panel */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Owner & Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src={listing.ownerAvatar} alt="" className="w-7 h-7 rounded-full object-cover border-2 border-zinc-100 shadow-sm" draggable={false} />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-900 font-bold text-[11px] leading-none">{listing.ownerName}</span>
                  {listing.ownerVerified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                </div>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  <span className="text-zinc-400 text-[9px] font-bold">{listing.ownerRating} Owner Rating</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg">
              <span className="text-green-600 font-black text-sm">{fmt(listing.price, listing.priceUnit)}</span>
            </div>
          </div>

          <h2 className="text-lg font-black text-zinc-900 leading-tight mb-1">{listing.title}</h2>
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin className="w-3 h-3" />
            <span className="text-xs font-semibold">{listing.city}, MX</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded-lg text-zinc-500 border border-zinc-200/50">{t}</span>
            ))}
          </div>

          {/* Insights btn */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onInsights(); }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500/5 border-2 border-amber-500/20 text-amber-600 text-xs font-black uppercase tracking-widest active:bg-amber-500/10 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            See 6 Pro Insights
            <ArrowRight className="w-3.5 h-3.5 opacity-40 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client card content ─────────────────────────────────────
function ClientCardContent({
  profile, onInsights, imgIdx, setImgIdx,
}: {
  profile: TutorialClientProfile;
  onInsights: () => void;
  imgIdx: number;
  setImgIdx: (fn: (p: number) => number) => void;
}) {
  const gc = CLIENT_CATS.find(c => c.key === profile.gender)!;
  return (
    <div className="relative w-full h-full bg-white select-none touch-none flex flex-col">
      {/* Photo Area */}
      <div className="relative w-full h-[62%] overflow-hidden">
        <img
          src={profile.profile_images[imgIdx]}
          alt={profile.name}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Image taps */}
        <div className="absolute inset-0 flex">
          <div
            className="w-1/2 h-full z-10"
            onClick={() => setImgIdx(p => Math.max(0, p - 1))}
          />
          <div
            className="w-1/2 h-full z-10"
            onClick={() => setImgIdx(p => Math.min(profile.profile_images.length - 1, p + 1))}
          />
        </div>

        {/* Dots */}
        {profile.profile_images.length > 1 && (
          <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
            {profile.profile_images.map((_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === imgIdx ? 'bg-white shadow-sm' : 'bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Category chip */}
        <div className="absolute top-8 right-4 z-20">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20 bg-white/10 text-white shadow-lg`}>
            <gc.Icon className="w-3 h-3" />
            {gc.label}
          </span>
        </div>

        {/* Photo Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-zinc-900 leading-none">{profile.name}</h2>
              <span className="text-zinc-300 text-xl font-bold leading-none">{profile.age}</span>
              {profile.verified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
            </div>
            <div className="bg-green-50 px-2.5 py-1.5 rounded-xl border border-green-100">
              <span className="text-green-600 text-xs font-black">Verified Budget</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{profile.city}, MX</span>
          </div>

          <p className="text-zinc-500 text-xs leading-relaxed font-medium line-clamp-2">{profile.bio}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-zinc-900 text-[11px] font-black">
                ${profile.budget_min.toLocaleString()} – ${profile.budget_max.toLocaleString()} MXN
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profile.interests.slice(0, 3).map(i => (
              <span key={i} className="text-[10px] font-bold bg-zinc-100 px-2.5 py-1 rounded-lg text-zinc-500 border border-zinc-200/50">{i}</span>
            ))}
          </div>

          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onInsights(); }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500/5 border-2 border-amber-500/20 text-amber-600 text-xs font-black uppercase tracking-widest active:bg-amber-500/10 cursor-pointer shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            See 6 Member Insights
            <ArrowRight className="w-3.5 h-3.5 opacity-40 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stateful card wrapper (owns image index) ─────────────────
function ListingCardWrapper({
  listing, stackIndex, onSwipe, onInsights,
}: {
  listing: TutorialListing; stackIndex: number;
  onSwipe: (d: 'left' | 'right') => void; onInsights: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <SwipeCard stackIndex={stackIndex} onSwipe={onSwipe}>
      <ListingCardContent
        listing={listing}
        onInsights={onInsights}
        imgIdx={imgIdx}
        setImgIdx={setImgIdx}
      />
    </SwipeCard>
  );
}

function ClientCardWrapper({
  profile, stackIndex, onSwipe, onInsights,
}: {
  profile: TutorialClientProfile; stackIndex: number;
  onSwipe: (d: 'left' | 'right') => void; onInsights: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <SwipeCard stackIndex={stackIndex} onSwipe={onSwipe}>
      <ClientCardContent
        profile={profile}
        onInsights={onInsights}
        imgIdx={imgIdx}
        setImgIdx={setImgIdx}
      />
    </SwipeCard>
  );
}

// ─── Empty state ─────────────────────────────────────────────
function EmptyState({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50/50 rounded-[32px] border-2 border-dashed border-zinc-200">
      <div className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center">
        <RotateCcw className="w-8 h-8 text-zinc-300" />
      </div>
      <p className="text-zinc-400 text-sm font-bold">All {label} explored!</p>
      <button
        onClick={onReset}
        className="px-8 py-3 rounded-2xl bg-zinc-900 text-white text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
      >
        See them again
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
type ViewMode = 'client' | 'owner';

export default function TutorialSwipePage() {
  const navigate = useNavigate();

  // ── Mode ──────────────────────────────────────────────────
  const [mode, setMode] = useState<ViewMode>('client');

  // ── Listing deck ──────────────────────────────────────────
  const [listCat, setListCat] = useState<TutorialCategory>('property');
  const [listDeck, setListDeck] = useState<TutorialListing[]>(() => [...tutorialListings.property]);
  const [listLikes, setListLikes] = useState(0);
  const [listPasses, setListPasses] = useState(0);

  // ── Client deck ───────────────────────────────────────────
  const [cliGender, setCliGender] = useState<ClientGender>('male');
  const [cliDeck, setCliDeck] = useState<TutorialClientProfile[]>(() => [...tutorialClientProfiles.male]);
  const [cliLikes, setCliLikes] = useState(0);
  const [cliPasses, setCliPasses] = useState(0);

  // ── Insights modal ────────────────────────────────────────
  const [modal, setModal] = useState<
    | { kind: 'listing'; data: TutorialListing }
    | { kind: 'client'; data: TutorialClientProfile }
    | null
  >(null);

  // ── Hint banner ───────────────────────────────────────────
  const [hint, setHint] = useState(true);

  // ── Handlers ──────────────────────────────────────────────
  const switchListCat = (cat: TutorialCategory) => {
    setListCat(cat);
    setListDeck([...tutorialListings[cat]]);
  };

  const switchCliGender = (g: ClientGender) => {
    setCliGender(g);
    setCliDeck([...tutorialClientProfiles[g]]);
  };

  const handleListSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') setListLikes(p => p + 1);
    else setListPasses(p => p + 1);
    setListDeck(prev => prev.slice(1));
  }, []);

  const handleCliSwipe = useCallback((dir: 'left' | 'right') => {
    if (dir === 'right') setCliLikes(p => p + 1);
    else setCliPasses(p => p + 1);
    setCliDeck(prev => prev.slice(1));
  }, []);

  // ── Layout measurements ───────────────────────────────────
  // Header ~88px, tabs ~50px, hint ~60px (conditional), buttons ~110px, counter ~28px
  // Card area = remaining space. We use explicit calc so absolutely positioned
  // cards always have a real parent height regardless of flex resolution.
  const hintH = hint ? 60 : 0;
  const cardAreaH = `calc(100dvh - ${88 + 50 + hintH + 110 + 28 + 16}px)`;

  // ── Visible likes/passes ──────────────────────────────────
  const likes = mode === 'client' ? listLikes : cliLikes;
  const passes = mode === 'client' ? listPasses : cliPasses;

  // ── Active category name ──────────────────────────────────
  const catLabel = mode === 'client'
    ? (LISTING_CATS.find(c => c.key === listCat)?.label ?? 'cards')
    : (CLIENT_CATS.find(c => c.key === cliGender)?.label ?? 'clients');

  const deckLen = mode === 'client' ? listDeck.length : cliDeck.length;

  return (
    <div
      className="w-full relative flex flex-col"
      style={{
        minHeight: '100dvh',
        color: '#111',
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
    >
      {/* ── BACKGROUND LAYERS ────────────────────────── */}
      <AmbientSwipeBackground />

      {/* Brightness layer - makes the tutorial "brighter" while letting movement through */}
      <div className="absolute inset-0 bg-white/90 pointer-events-none" style={{ zIndex: 0 }} />

      {/* Cinematic shades - provides the "dark frames" contrast for buttons */}
      <GradientOverlay light={false} intensity={0.6} />

      <div className="relative z-10 w-full min-h-dvh flex flex-col">

        {/* ── HEADER ─────────────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '16px 16px 10px' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="flex items-center justify-center rounded-2xl shadow-sm w-11 h-11 bg-white border border-zinc-100 shrink-0"
              >
                <ChevronLeft className="w-6 h-6 text-zinc-900" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xl font-black text-zinc-900 tracking-tight">
                    How It Works
                  </span>
                </div>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mt-0.5">Interactive Tutorial</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
              <div className="px-3 py-1 bg-white rounded-xl shadow-sm text-center min-w-[54px] border border-zinc-50">
                <p className="text-green-600 font-black text-sm leading-none">{likes}</p>
                <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 mt-1">Likes</p>
              </div>
              <div className="px-3 py-1 bg-white rounded-xl shadow-sm text-center min-w-[54px] border border-zinc-50">
                <p className="text-red-600 font-black text-sm leading-none">{passes}</p>
                <p className="text-[8px] font-black uppercase tracking-tighter text-zinc-400 mt-1">Passes</p>
              </div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1.5 p-1.5 rounded-[22px] bg-zinc-100/80 border border-zinc-200/50">
            {([
              { val: 'client' as ViewMode, Icon: Home, label: 'Browsing' },
              { val: 'owner' as ViewMode, Icon: Users, label: 'Profiles' },
            ] as const).map(({ val, Icon, label }) => (
              <button
                key={val}
                onClick={() => { triggerHaptic('light'); setMode(val); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[18px] text-xs font-black uppercase tracking-widest transition-all ${mode === val
                  ? 'bg-white text-zinc-900 shadow-md ring-1 ring-zinc-200'
                  : 'text-zinc-400 opacity-60'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-bold text-center mt-2" style={{ color: 'rgba(0,0,0,0.3)' }}>
            {mode === 'client'
              ? 'EXPLORE PREMIUM LISTINGS NEAR YOU'
              : 'DISCOVER CLIENTS READY TO ENGAGE'}
          </p>
        </div>

        {/* ── CATEGORY TABS ──────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '0 16px 12px', overflowX: 'auto' }} className="no-scrollbar">
          <div className="flex gap-2">
            {mode === 'client'
              ? LISTING_CATS.map(c => (
                <button
                  key={c.key}
                  onClick={() => { triggerHaptic('light'); switchListCat(c.key); }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm"
                  style={{
                    background: listCat === c.key ? '#000' : '#fff',
                    borderColor: listCat === c.key ? '#000' : '#f2f2f2',
                    color: listCat === c.key ? '#fff' : '#666',
                  }}
                >
                  <c.Icon className="w-3.5 h-3.5 shadow-sm" />
                  {c.label}
                  <span className={`ml-1 transition-opacity ${listCat === c.key ? 'opacity-50' : 'opacity-30'}`} style={{ fontSize: 9 }}>{tutorialListings[c.key].length}</span>
                </button>
              ))
              : CLIENT_CATS.map(c => (
                <button
                  key={c.key}
                  onClick={() => { triggerHaptic('light'); switchCliGender(c.key); }}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm"
                  style={{
                    background: cliGender === c.key ? '#000' : '#fff',
                    borderColor: cliGender === c.key ? '#000' : '#f2f2f2',
                    color: cliGender === c.key ? '#fff' : '#666',
                  }}
                >
                  <c.Icon className="w-3.5 h-3.5" />
                  {c.label}
                  <span className={`ml-1 transition-opacity ${cliGender === c.key ? 'opacity-50' : 'opacity-30'}`} style={{ fontSize: 9 }}>{tutorialClientProfiles[c.key].length}</span>
                </button>
              ))}
          </div>
        </div>

        {/* ── HINT BANNER ────────────────────────────────── */}
        {hint && (
          <div
            className="flex items-center gap-3 mx-4 mb-4 px-4 py-3 rounded-[24px] shadow-sm border"
            style={{ flexShrink: 0, background: '#fff9e6', borderColor: '#ffeeb3' }}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] font-bold leading-tight" style={{ color: '#926a00' }}>
              Drag <span className="text-green-700">right</span> to like · <span className="text-red-700">left</span> to pass · tap <span className="text-amber-800">Pro Insights</span>
            </p>
            <button
              onClick={() => setHint(false)}
              aria-label="Close Hint"
              className="ml-auto text-amber-900/40 hover:text-amber-900 shrink-0 bg-white/50 w-6 h-6 rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── CARD STACK ─────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            position: 'relative',
            margin: '0 16px',
            height: cardAreaH,
            minHeight: '420px',
            maxHeight: '600px',
          }}
        >
          {mode === 'client' ? (
            listDeck.length === 0 ? (
              <EmptyState label={catLabel} onReset={() => setListDeck([...tutorialListings[listCat]])} />
            ) : (
              listDeck.slice(0, 3).reverse().map((listing, revIdx) => {
                const stackIndex = Math.min(listDeck.length, 3) - 1 - revIdx;
                return (
                  <ListingCardWrapper
                    key={listing.id}
                    listing={listing}
                    stackIndex={stackIndex}
                    onSwipe={handleListSwipe}
                    onInsights={() => setModal({ kind: 'listing', data: listing })}
                  />
                );
              })
            )
          ) : (
            cliDeck.length === 0 ? (
              <EmptyState label={catLabel} onReset={() => setCliDeck([...tutorialClientProfiles[cliGender]])} />
            ) : (
              cliDeck.slice(0, 3).reverse().map((profile, revIdx) => {
                const stackIndex = Math.min(cliDeck.length, 3) - 1 - revIdx;
                return (
                  <ClientCardWrapper
                    key={profile.id}
                    profile={profile}
                    stackIndex={stackIndex}
                    onSwipe={handleCliSwipe}
                    onInsights={() => setModal({ kind: 'client', data: profile })}
                  />
                );
              })
            )
          )}
        </div>

        {/* ── ACTION BUTTONS ─────────────────────────────── */}
        <div style={{ flexShrink: 0, padding: '16px 16px 0' }} className="mt-auto">
          <div className="flex items-center justify-center gap-6">
            {/* Pass */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              aria-label="Pass"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) handleListSwipe('left');
                else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('left');
              }}
              className="flex items-center justify-center shadow-xl transition-all active:shadow-sm w-16 h-16 rounded-full bg-white border border-zinc-100"
            >
              <ThumbsDown className="w-7 h-7 text-red-500 fill-red-50" />
            </motion.button>

            {/* Info */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              aria-label="Information"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) setModal({ kind: 'listing', data: listDeck[0] });
                else if (mode === 'owner' && cliDeck.length > 0) setModal({ kind: 'client', data: cliDeck[0] });
              }}
              className="flex items-center justify-center shadow-lg w-13 h-13 rounded-full bg-white border border-zinc-100"
            >
              <Info className="w-6 h-6 text-amber-500" />
            </motion.button>

            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              aria-label="Like"
              onClick={() => {
                if (mode === 'client' && listDeck.length > 0) handleListSwipe('right');
                else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('right');
              }}
              className="flex items-center justify-center shadow-xl transition-all active:shadow-sm w-16 h-16 rounded-full bg-zinc-950"
            >
              <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />
            </motion.button>
          </div>

          {/* Counter */}
          <p className="text-center mt-3 pb-6 font-black uppercase tracking-widest" style={{ fontSize: 9, color: 'rgba(0,0,0,0.2)' }}>
            {deckLen} {catLabel} left · {likes} liked · {passes} passed
          </p>
        </div>

        {/* ── INSIGHTS MODAL ─────────────────────────────── */}
        {modal && (
          <InsightsModal
            title={modal.kind === 'listing' ? modal.data.title : `${modal.data.name}, ${(modal.data as TutorialClientProfile).age}`}
            subtitle={modal.kind === 'listing' ? (modal.data as TutorialListing).subtitle : (modal.data as TutorialClientProfile).city}
            insights={modal.data.insights}
            image={modal.kind === 'listing' ? (modal.data as TutorialListing).images[0] : (modal.data as TutorialClientProfile).profile_images[0]}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </div>
  );
}
