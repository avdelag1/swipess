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
  Sparkles, ArrowRight, BadgeCheck, DollarSign, Eye, RotateCcw, ChevronLeft,
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

// ─── Physics ─────────────────────────────────────────────────
const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 350;
const MAX_ROTATION = 10;
const getExitX = () =>
  typeof window !== 'undefined' ? window.innerWidth * 1.5 : 700;

// ─── Category metadata ───────────────────────────────────────
const LISTING_CATS = [
  { key: 'property' as TutorialCategory, label: 'Properties', Icon: Home, color: 'text-blue-400', ring: 'ring-blue-500/40', bg: 'bg-blue-500/10' },
  { key: 'worker' as TutorialCategory, label: 'Workers', Icon: Wrench, color: 'text-purple-400', ring: 'ring-purple-500/40', bg: 'bg-purple-500/10' },
  { key: 'motorcycle' as TutorialCategory, label: 'Motos', Icon: Car, color: 'text-orange-400', ring: 'ring-orange-500/40', bg: 'bg-orange-500/10' },
  { key: 'bicycle' as TutorialCategory, label: 'Bicycles', Icon: Bike, color: 'text-green-400', ring: 'ring-green-500/40', bg: 'bg-green-500/10' },
];

const CLIENT_CATS = [
  { key: 'male' as ClientGender, label: 'Men', Icon: User, color: 'text-cyan-400', ring: 'ring-cyan-500/40', bg: 'bg-cyan-500/10' },
  { key: 'female' as ClientGender, label: 'Women', Icon: Users, color: 'text-pink-400', ring: 'ring-pink-500/40', bg: 'bg-pink-500/10' },
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
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 35 }}
        className="relative w-full max-w-md bg-background dark:bg-[#141414] rounded-t-[28px] overflow-hidden border-t border-border shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 z-10 relative">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 shadow-sm" />
        </div>

        {/* Header image */}
        {image && (
          <div className="h-28 overflow-hidden relative mt-2">
            <img src={image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background dark:from-[#141414] to-transparent" />
          </div>
        )}

        <div className="px-5 pt-3 pb-1 relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest">6 Key Insights</span>
          </div>
          <p className="text-base font-bold text-foreground leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>

        {/* List */}
        <div className="px-4 pb-4 mt-2 space-y-2 overflow-y-auto max-h-[52vh] relative z-10">
          {insights.map((ins, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.055 }}
              className={`flex items-start gap-3 p-3 rounded-2xl border ${ins.highlight
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-secondary/30 border-border/40'
                }`}
            >
              <span className="text-xl leading-none mt-0.5 flex-shrink-0">{ins.icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  {ins.question}
                </p>
                <p className={`text-sm leading-snug ${ins.highlight ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-foreground font-medium'}`}>
                  {ins.answer}
                </p>
              </div>
              {ins.highlight && <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-1" />}
            </motion.div>
          ))}
        </div>

        <div className="px-4 pb-7">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/80 border border-border/50 text-foreground font-bold shadow-sm transition-colors"
          >
            Close
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
  const yOffset = stackIndex * 14;

  return (
    <motion.div
      className="absolute inset-0 rounded-[28px] overflow-hidden"
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
    <div className="relative w-full h-full bg-card shadow-lg select-none touch-none overflow-hidden rounded-[28px]">
      {/* Photo */}
      <img
        src={listing.images[imgIdx]}
        alt={listing.title}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Image tap zones */}
      <div
        className="absolute left-0 top-0 w-1/2 z-10"
        style={{ bottom: '180px' }}
        onClick={() => setImgIdx(p => Math.max(0, p - 1))}
      />
      <div
        className="absolute right-0 top-0 w-1/2 z-10"
        style={{ bottom: '180px' }}
        onClick={() => setImgIdx(p => Math.min(listing.images.length - 1, p + 1))}
      />

      {/* Dot row */}
      {listing.images.length > 1 && (
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {listing.images.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      )}

      {/* Category chip */}
      <div className="absolute top-6 right-3 z-20">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 ${cat.bg} ${cat.color}`}>
          <cat.Icon className="w-3 h-3" />
          {cat.label}
        </span>
      </div>

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

      {/* Info panel */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        {/* Owner */}
        <div className="flex items-center gap-2 mb-2">
          <img src={listing.ownerAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-white/40" draggable={false} />
          <span className="text-white/90 font-medium text-xs shadow-black drop-shadow-md">{listing.ownerName}</span>
          {listing.ownerVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
          <div className="ml-auto flex items-center gap-1 bg-black/30 backdrop-blur-md px-1.5 py-0.5 rounded-full">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">{listing.ownerRating}</span>
          </div>
        </div>

        <h2 className="text-[18px] font-black text-white leading-snug drop-shadow-md">{listing.title}</h2>
        <p className="text-white/80 font-medium text-xs mb-2 drop-shadow-md">{listing.subtitle}</p>

        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-400 drop-shadow-md" />
            <span className="text-green-400 font-black text-base drop-shadow-md">{fmt(listing.price, listing.priceUnit)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/80">
            <MapPin className="w-3 h-3" />
            <span className="text-xs font-semibold drop-shadow-md">{listing.city}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {listing.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] bg-white/8 border border-white/8 px-2 py-0.5 rounded-full text-white/50">{t}</span>
          ))}
        </div>

        {/* Insights btn */}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onInsights(); }}
          className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white text-sm font-bold active:bg-black/60 cursor-pointer shadow-lg transition-colors"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          View 6 Insights
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </button>
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
    <div className="relative w-full h-full bg-card shadow-lg select-none touch-none overflow-hidden rounded-[28px]">
      <img
        src={profile.profile_images[imgIdx]}
        alt={profile.name}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Image taps */}
      <div
        className="absolute left-0 top-0 w-1/2 z-10"
        style={{ bottom: '200px' }}
        onClick={() => setImgIdx(p => Math.max(0, p - 1))}
      />
      <div
        className="absolute right-0 top-0 w-1/2 z-10"
        style={{ bottom: '200px' }}
        onClick={() => setImgIdx(p => Math.min(profile.profile_images.length - 1, p + 1))}
      />

      {profile.profile_images.length > 1 && (
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {profile.profile_images.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i === imgIdx ? 'bg-white' : 'bg-white/25'}`} />
          ))}
        </div>
      )}

      <div className="absolute top-6 right-3 z-20">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 ${gc.bg} ${gc.color}`}>
          <gc.Icon className="w-3 h-3" />
          {gc.label}
        </span>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-black text-white drop-shadow-md">{profile.name}</h2>
          <span className="text-white/80 font-bold text-xl drop-shadow-md">{profile.age}</span>
          {profile.verified && <BadgeCheck className="w-5 h-5 text-blue-400 drop-shadow-md" />}
        </div>
        <div className="flex items-center gap-1 text-white/80 mb-2 drop-shadow-md">
          <MapPin className="w-3 h-3" />
          <span className="text-xs font-semibold">{profile.city}</span>
        </div>
        <p className="text-white/90 font-medium text-xs leading-snug line-clamp-2 mb-2 drop-shadow-md">{profile.bio}</p>
        <div className="flex items-center gap-1 mb-3 pt-1 border-t border-white/10">
          <DollarSign className="w-4 h-4 text-green-400 drop-shadow-md" />
          <span className="text-green-400 text-sm font-black drop-shadow-md">
            ${profile.budget_min.toLocaleString()} – ${profile.budget_max.toLocaleString()} MXN
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.interests.slice(0, 4).map(i => (
            <span key={i} className="text-[10px] bg-white/8 border border-white/8 px-2 py-0.5 rounded-full text-white/50">{i}</span>
          ))}
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onInsights(); }}
          className="w-full flex items-center justify-center gap-2 mt-2 py-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 text-white text-sm font-bold active:bg-black/60 cursor-pointer shadow-lg transition-colors"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          View 6 Insights
          <ArrowRight className="w-3.5 h-3.5 opacity-60" />
        </button>
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
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/40 rounded-[28px] border-2 border-dashed border-border">
      <RotateCcw className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-muted-foreground text-sm font-medium">All {label} explored!</p>
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-bold shadow-sm transition-all hover:bg-amber-500/20"
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
      className="w-full flex flex-col bg-background text-foreground transition-colors duration-300"
      style={{
        minHeight: '100dvh',
        overflowX: 'hidden',
        overflowY: 'hidden',
      }}
    >

      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '16px 16px 10px' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center rounded-full bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors"
              style={{ width: 36, height: 36, flexShrink: 0 }}
            >
              <ChevronLeft className="w-5 h-5 text-foreground/80" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-lg font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  How It Works
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Tutorial · Swipe to explore</p>
            </div>
          </div>
          <div className="flex items-center gap-5 bg-secondary/20 py-1.5 px-3 rounded-2xl border border-border/40">
            <div className="text-center">
              <p className="text-green-500 font-black text-base leading-none">{likes}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">liked</p>
            </div>
            <div className="text-center">
              <p className="text-red-500 font-black text-base leading-none">{passes}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wide">passed</p>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1.5 p-1 rounded-2xl bg-secondary/20 border border-border/40">
          {([
            { val: 'client' as ViewMode, Icon: Home, label: 'Client View' },
            { val: 'owner' as ViewMode, Icon: Users, label: 'Owner View' },
          ] as const).map(({ val, Icon, label }) => (
            <button
              key={val}
              onClick={() => setMode(val)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${mode === val
                  ? 'bg-background border border-border text-foreground'
                  : 'bg-transparent text-muted-foreground hover:text-foreground/80'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-medium text-center mt-2 text-muted-foreground">
          {mode === 'client'
            ? '🔍 Browse listings — find your next property, vehicle or service'
            : '👤 Browse client profiles — see who wants what you offer'}
        </p>
      </div>

      {/* ── CATEGORY TABS ──────────────────────────────── */}
      <div className="scrollbar-none" style={{ flexShrink: 0, padding: '0 16px 10px', overflowX: 'auto' }}>
        <div className="flex gap-2">
          {mode === 'client'
            ? LISTING_CATS.map(c => (
              <button
                key={c.key}
                onClick={() => switchListCat(c.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${listCat === c.key
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                    : 'bg-secondary/20 border-border/40 text-muted-foreground hover:bg-secondary/40'
                  }`}
              >
                <c.Icon className="w-3.5 h-3.5" />
                {c.label}
                <span className="opacity-60 text-[10px] bg-secondary px-1.5 py-0.5 rounded-md">{tutorialListings[c.key].length}</span>
              </button>
            ))
            : CLIENT_CATS.map(c => (
              <button
                key={c.key}
                onClick={() => switchCliGender(c.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${cliGender === c.key
                    ? 'bg-primary/10 border-primary/40 text-primary shadow-sm'
                    : 'bg-secondary/20 border-border/40 text-muted-foreground hover:bg-secondary/40'
                  }`}
              >
                <c.Icon className="w-3.5 h-3.5" />
                {c.label}
                <span className="opacity-60 text-[10px] bg-secondary px-1.5 py-0.5 rounded-md">{tutorialClientProfiles[c.key].length}</span>
              </button>
            ))}
        </div>
      </div>

      {/* ── HINT BANNER ────────────────────────────────── */}
      {hint && (
        <div className="flex items-center gap-2 mx-4 mb-2 px-3 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-sm" style={{ flexShrink: 0 }}>
          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs font-medium text-foreground/80">
            Drag <span className="text-green-500 font-bold">right</span> to like · drag <span className="text-red-500 font-bold">left</span> to pass · tap <span className="text-amber-500 font-bold">View 6 Insights</span>
          </p>
          <button onClick={() => setHint(false)} className="ml-auto text-muted-foreground hover:text-foreground flex-shrink-0 bg-secondary rounded-full p-1">
            <X className="w-3.5 h-3.5" />
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
          minHeight: '380px',
          maxHeight: '560px',
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
      <div style={{ flexShrink: 0, padding: '12px 16px 0' }}>
        <div className="flex items-center justify-center gap-5">
          {/* Pass */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (mode === 'client' && listDeck.length > 0) handleListSwipe('left');
              else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('left');
            }}
            className="flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 shadow-sm border-2 border-red-500/40 rounded-full transition-colors"
            style={{ width: 60, height: 60 }}
          >
            <X className="w-6 h-6 text-red-500" />
          </motion.button>

          {/* Info */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (mode === 'client' && listDeck.length > 0) setModal({ kind: 'listing', data: listDeck[0] });
              else if (mode === 'owner' && cliDeck.length > 0) setModal({ kind: 'client', data: cliDeck[0] });
            }}
            className="flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 shadow-sm border-2 border-amber-500/40 rounded-full transition-colors"
            style={{ width: 48, height: 48 }}
          >
            <Info className="w-5 h-5 text-amber-500" />
          </motion.button>

          {/* Like */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (mode === 'client' && listDeck.length > 0) handleListSwipe('right');
              else if (mode === 'owner' && cliDeck.length > 0) handleCliSwipe('right');
            }}
            className="flex items-center justify-center bg-green-500/10 hover:bg-green-500/20 shadow-sm border-2 border-green-500/40 rounded-full transition-colors"
            style={{ width: 60, height: 60 }}
          >
            <Heart className="w-6 h-6 text-green-500" />
          </motion.button>
        </div>

        {/* Counter */}
        <p className="text-center mt-3 pb-4 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
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
  );
}
