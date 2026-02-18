/**
 * TUTORIAL SWIPE PAGE
 *
 * Interactive onboarding experience for new users.
 * Shows real swipe card mechanics with demo data — no login required.
 *
 * CLIENT VIEW:  Browse listings (properties, workers, motorcycles, bicycles)
 * OWNER VIEW:   Browse client profiles (male & female seekers)
 *
 * Each card has 6 real insights accessible via the ℹ️ button.
 * Swipe right = Like  |  Swipe left = Pass  |  Tap = Details
 */

import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import {
  Home, Wrench, Bike, Car, User, Users,
  Heart, X, Info, Star, MapPin, CheckCircle,
  ChevronLeft, ChevronRight, Sparkles, ArrowRight,
  BadgeCheck, Clock, DollarSign, Eye, RotateCcw,
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

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 350;
const MAX_ROTATION = 10;
const EXIT_DISTANCE = typeof window !== 'undefined' ? window.innerWidth * 1.5 : 700;

// ─────────────────────────────────────────────────────────────
//  CATEGORY CONFIG
// ─────────────────────────────────────────────────────────────
const LISTING_CATEGORIES: { key: TutorialCategory; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: 'property',   label: 'Properties', icon: <Home className="w-4 h-4" />,   color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30' },
  { key: 'worker',     label: 'Workers',    icon: <Wrench className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  { key: 'motorcycle', label: 'Motos',      icon: <Car className="w-4 h-4" />,    color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  { key: 'bicycle',    label: 'Bicycles',   icon: <Bike className="w-4 h-4" />,   color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30' },
];

const CLIENT_CATEGORIES: { key: ClientGender; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: 'male',   label: 'Men',   icon: <User className="w-4 h-4" />,  color: 'text-cyan-400',  bg: 'bg-cyan-500/15 border-cyan-500/30' },
  { key: 'female', label: 'Women', icon: <Users className="w-4 h-4" />, color: 'text-pink-400',  bg: 'bg-pink-500/15 border-pink-500/30' },
];

// ─────────────────────────────────────────────────────────────
//  PRICE FORMATTER
// ─────────────────────────────────────────────────────────────
function formatPrice(price: number, unit: string): string {
  const formatted = price.toLocaleString('es-MX');
  if (unit === 'sale') return `$${formatted}`;
  return `$${formatted}${unit}`;
}

// ─────────────────────────────────────────────────────────────
//  INSIGHTS MODAL
// ─────────────────────────────────────────────────────────────
interface InsightsModalProps {
  title: string;
  subtitle?: string;
  insights: TutorialInsight[];
  image?: string;
  onClose: () => void;
}

function InsightsModal({ title, subtitle, insights, image, onClose }: InsightsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet / Modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative w-full sm:max-w-md bg-[#111] rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header image strip */}
        {image && (
          <div className="relative h-32 overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/40 to-transparent" />
          </div>
        )}

        <div className="px-5 pb-2 pt-3">
          <div className="flex items-start gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">6 Key Insights</span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
          {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
        </div>

        {/* Insights list */}
        <div className="px-4 pb-6 space-y-2.5 max-h-[55vh] overflow-y-auto">
          {insights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                insight.highlight
                  ? 'bg-amber-500/8 border-amber-500/25'
                  : 'bg-white/4 border-white/8'
              }`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{insight.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-0.5">
                  {insight.question}
                </p>
                <p className={`text-sm leading-snug ${insight.highlight ? 'text-amber-200 font-medium' : 'text-white/80'}`}>
                  {insight.answer}
                </p>
              </div>
              {insight.highlight && (
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Close button */}
        <div className="px-4 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-white/8 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/12 transition-all active:scale-98"
          >
            Close Insights
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SWIPE CARD — LISTING
// ─────────────────────────────────────────────────────────────
interface ListingCardProps {
  listing: TutorialListing;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (dir: 'left' | 'right') => void;
  onInsights: () => void;
}

function ListingSwipeCard({ listing, isTop, stackIndex, onSwipe, onInsights }: ListingCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0, 0.6, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.6, 0], [1, 0.6, 0]);
  const [imgIdx, setImgIdx] = useState(0);
  const isExiting = useRef(false);

  const catCfg = LISTING_CATEGORIES.find((c) => c.key === listing.category)!;

  const exit = useCallback(
    (dir: 'left' | 'right') => {
      if (isExiting.current) return;
      isExiting.current = true;
      triggerHaptic(dir === 'right' ? 'success' : 'warning');
      animate(x, dir === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE, {
        type: 'spring',
        stiffness: 380,
        damping: 28,
        onComplete: () => onSwipe(dir),
      });
    },
    [x, onSwipe]
  );

  const onPanEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      if (offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) exit('right');
      else if (offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) exit('left');
      else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 });
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 28 });
      }
    },
    [x, y, exit]
  );

  const scaleBack = 1 - stackIndex * 0.04;
  const yOffsetBack = stackIndex * 12;

  return (
    <motion.div
      style={
        isTop
          ? { x, y, rotate, position: 'absolute', inset: 0, zIndex: 10 - stackIndex }
          : {
              scale: scaleBack,
              y: yOffsetBack,
              position: 'absolute',
              inset: 0,
              zIndex: 10 - stackIndex,
            }
      }
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onPanEnd={isTop ? onPanEnd : undefined}
      className="rounded-3xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
    >
      {/* LIKE / PASS overlays */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 z-20 rotate-[-20deg] border-4 border-green-400 rounded-lg px-3 py-1"
          >
            <span className="text-green-400 font-black text-2xl tracking-widest">LIKE</span>
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-8 right-6 z-20 rotate-[20deg] border-4 border-red-400 rounded-lg px-3 py-1"
          >
            <span className="text-red-400 font-black text-2xl tracking-widest">PASS</span>
          </motion.div>
        </>
      )}

      {/* Card image */}
      <div className="relative h-full w-full bg-gray-900">
        <img
          src={listing.images[imgIdx] || listing.images[0]}
          alt={listing.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Tap zones for image navigation */}
        <div
          className="absolute left-0 top-0 bottom-32 w-1/2 z-10"
          onClick={() => setImgIdx((p) => Math.max(0, p - 1))}
        />
        <div
          className="absolute right-0 top-0 bottom-32 w-1/2 z-10"
          onClick={() => setImgIdx((p) => Math.min(listing.images.length - 1, p + 1))}
        />

        {/* Image dots */}
        {listing.images.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {listing.images.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i === imgIdx ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-6 right-4 z-20">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${catCfg.bg} ${catCfg.color}`}>
            {catCfg.icon}
            {catCfg.label}
          </span>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {/* Card info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          {/* Owner row */}
          <div className="flex items-center gap-2 mb-2">
            <img
              src={listing.ownerAvatar}
              alt={listing.ownerName}
              className="w-7 h-7 rounded-full border-2 border-white/40 object-cover"
              draggable={false}
            />
            <span className="text-white/70 text-xs">{listing.ownerName}</span>
            {listing.ownerVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-400" />}
            <div className="ml-auto flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-300 text-xs font-bold">{listing.ownerRating}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white leading-tight mb-0.5">{listing.title}</h2>
          <p className="text-white/60 text-sm mb-2">{listing.subtitle}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-lg">
                {formatPrice(listing.price, listing.priceUnit)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/50">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{listing.city}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {listing.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-white/60"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Insights button */}
          <button
            onClick={(e) => { e.stopPropagation(); onInsights(); }}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-white/80 text-sm font-medium hover:bg-white/15 transition-all active:scale-98"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            View 6 Insights
            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  SWIPE CARD — CLIENT PROFILE
// ─────────────────────────────────────────────────────────────
interface ClientCardProps {
  profile: TutorialClientProfile;
  isTop: boolean;
  stackIndex: number;
  onSwipe: (dir: 'left' | 'right') => void;
  onInsights: () => void;
}

function ClientSwipeCard({ profile, isTop, stackIndex, onSwipe, onInsights }: ClientCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD * 0.6, SWIPE_THRESHOLD], [0, 0.6, 1]);
  const passOpacity = useTransform(x, [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.6, 0], [1, 0.6, 0]);
  const [imgIdx, setImgIdx] = useState(0);
  const isExiting = useRef(false);

  const genderCfg = profile.gender === 'male'
    ? CLIENT_CATEGORIES[0]
    : CLIENT_CATEGORIES[1];

  const exit = useCallback(
    (dir: 'left' | 'right') => {
      if (isExiting.current) return;
      isExiting.current = true;
      triggerHaptic(dir === 'right' ? 'success' : 'warning');
      animate(x, dir === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE, {
        type: 'spring',
        stiffness: 380,
        damping: 28,
        onComplete: () => onSwipe(dir),
      });
    },
    [x, onSwipe]
  );

  const onPanEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      if (offset > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) exit('right');
      else if (offset < -SWIPE_THRESHOLD || velocity < -VELOCITY_THRESHOLD) exit('left');
      else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 28 });
        animate(y, 0, { type: 'spring', stiffness: 400, damping: 28 });
      }
    },
    [x, y, exit]
  );

  const scaleBack = 1 - stackIndex * 0.04;
  const yOffsetBack = stackIndex * 12;

  return (
    <motion.div
      style={
        isTop
          ? { x, y, rotate, position: 'absolute', inset: 0, zIndex: 10 - stackIndex }
          : {
              scale: scaleBack,
              y: yOffsetBack,
              position: 'absolute',
              inset: 0,
              zIndex: 10 - stackIndex,
            }
      }
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onPanEnd={isTop ? onPanEnd : undefined}
      className="rounded-3xl overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
    >
      {/* LIKE / PASS overlays */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-6 z-20 rotate-[-20deg] border-4 border-green-400 rounded-lg px-3 py-1"
          >
            <span className="text-green-400 font-black text-2xl tracking-widest">LIKE</span>
          </motion.div>
          <motion.div
            style={{ opacity: passOpacity }}
            className="absolute top-8 right-6 z-20 rotate-[20deg] border-4 border-red-400 rounded-lg px-3 py-1"
          >
            <span className="text-red-400 font-black text-2xl tracking-widest">PASS</span>
          </motion.div>
        </>
      )}

      <div className="relative h-full w-full bg-gray-900">
        <img
          src={profile.profile_images[imgIdx] || profile.profile_images[0]}
          alt={profile.name}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Image tap zones */}
        <div
          className="absolute left-0 top-0 bottom-36 w-1/2 z-10"
          onClick={() => setImgIdx((p) => Math.max(0, p - 1))}
        />
        <div
          className="absolute right-0 top-0 bottom-36 w-1/2 z-10"
          onClick={() => setImgIdx((p) => Math.min(profile.profile_images.length - 1, p + 1))}
        />

        {/* Image dots */}
        {profile.profile_images.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {profile.profile_images.map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-all ${
                  i === imgIdx ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        )}

        {/* Gender badge */}
        <div className="absolute top-6 right-4 z-20">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${genderCfg.bg} ${genderCfg.color}`}>
            {genderCfg.icon}
            {genderCfg.label}
          </span>
        </div>

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
            <span className="text-white/60 text-xl">{profile.age}</span>
            {profile.verified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
          </div>

          <div className="flex items-center gap-1 text-white/50 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{profile.city}, {profile.country}</span>
          </div>

          <p className="text-white/60 text-sm leading-snug line-clamp-2 mb-2">{profile.bio}</p>

          {/* Budget */}
          <div className="flex items-center gap-1 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-bold">
              ${profile.budget_min.toLocaleString()} – ${profile.budget_max.toLocaleString()} MXN
            </span>
          </div>

          {/* Interests */}
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.interests.slice(0, 4).map((interest) => (
              <span
                key={interest}
                className="text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-full text-white/60"
              >
                {interest}
              </span>
            ))}
          </div>

          {/* Insights button */}
          <button
            onClick={(e) => { e.stopPropagation(); onInsights(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-white/80 text-sm font-medium hover:bg-white/15 transition-all active:scale-98"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            View 6 Insights
            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────────────────────
function EmptyState({ label, onReset }: { label: string; onReset: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <RotateCcw className="w-8 h-8 text-white/20" />
      </div>
      <div>
        <p className="text-white/50 text-sm">You've seen all {label}</p>
        <p className="text-white/30 text-xs mt-1">Great job exploring!</p>
      </div>
      <button
        onClick={onReset}
        className="px-5 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-all"
      >
        See them again
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TUTORIAL HINT BANNER
// ─────────────────────────────────────────────────────────────
function TutorialHint({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3"
    >
      <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-amber-300 text-xs font-semibold">How to swipe</p>
        <p className="text-white/50 text-[11px] leading-tight">
          Drag right to <span className="text-green-400 font-medium">like</span> · Drag left to <span className="text-red-400 font-medium">pass</span> · Tap <span className="text-amber-300 font-medium">View 6 Insights</span> to learn more
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
type ViewMode = 'client' | 'owner';

export default function TutorialSwipePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('client');

  // Listing state
  const [listingCategory, setListingCategory] = useState<TutorialCategory>('property');
  const [listingDeck, setListingDeck] = useState<TutorialListing[]>(() => [...tutorialListings['property']]);
  const [listingLikes, setListingLikes] = useState(0);
  const [listingPasses, setListingPasses] = useState(0);

  // Client profile state
  const [clientGender, setClientGender] = useState<ClientGender>('male');
  const [clientDeck, setClientDeck] = useState<TutorialClientProfile[]>(() => [...tutorialClientProfiles['male']]);
  const [clientLikes, setClientLikes] = useState(0);
  const [clientPasses, setClientPasses] = useState(0);

  // Insights modal state
  const [insightsTarget, setInsightsTarget] = useState<
    { kind: 'listing'; data: TutorialListing } | { kind: 'client'; data: TutorialClientProfile } | null
  >(null);

  // Tutorial hint
  const [showHint, setShowHint] = useState(true);

  // ── Listing handlers ──
  const handleListingCategoryChange = (cat: TutorialCategory) => {
    setListingCategory(cat);
    setListingDeck([...tutorialListings[cat]]);
  };

  const handleListingSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'right') setListingLikes((p) => p + 1);
      else setListingPasses((p) => p + 1);
      setListingDeck((prev) => prev.slice(1));
    },
    []
  );

  const handleListingInsights = useCallback((listing: TutorialListing) => {
    setInsightsTarget({ kind: 'listing', data: listing });
  }, []);

  // ── Client handlers ──
  const handleClientGenderChange = (gender: ClientGender) => {
    setClientGender(gender);
    setClientDeck([...tutorialClientProfiles[gender]]);
  };

  const handleClientSwipe = useCallback(
    (dir: 'left' | 'right') => {
      if (dir === 'right') setClientLikes((p) => p + 1);
      else setClientPasses((p) => p + 1);
      setClientDeck((prev) => prev.slice(1));
    },
    []
  );

  const handleClientInsights = useCallback((profile: TutorialClientProfile) => {
    setInsightsTarget({ kind: 'client', data: profile });
  }, []);

  // ── Swipe via button ──
  const topListingRef = useRef<{ triggerLeft: () => void; triggerRight: () => void } | null>(null);

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* ── HEADER ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                How It Works
              </h1>
            </div>
            <p className="text-xs text-white/40 mt-0.5">Tutorial cards · Swipe to explore</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-green-400 font-bold text-sm">
                {viewMode === 'client' ? listingLikes : clientLikes}
              </p>
              <p className="text-[10px] text-white/30">liked</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 font-bold text-sm">
                {viewMode === 'client' ? listingPasses : clientPasses}
              </p>
              <p className="text-[10px] text-white/30">passed</p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/8">
          <button
            onClick={() => setViewMode('client')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'client'
                ? 'bg-white/12 text-white shadow'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Home className="w-4 h-4" />
            Client View
          </button>
          <button
            onClick={() => setViewMode('owner')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'owner'
                ? 'bg-white/12 text-white shadow'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Owner View
          </button>
        </div>

        {/* Mode description */}
        <p className="text-[11px] text-white/30 text-center mt-2">
          {viewMode === 'client'
            ? '🔍 As a client you browse listings — find your next property, vehicle or service'
            : '👤 As an owner you browse client profiles — find who\'s interested in what you offer'}
        </p>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div className="flex-shrink-0 px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {viewMode === 'client'
            ? LISTING_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleListingCategoryChange(cat.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    listingCategory === cat.key
                      ? `${cat.bg} ${cat.color} shadow`
                      : 'bg-white/5 border-white/8 text-white/40 hover:text-white/60'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  <span className={`ml-1 text-[10px] ${listingCategory === cat.key ? 'opacity-70' : 'opacity-30'}`}>
                    {tutorialListings[cat.key].length}
                  </span>
                </button>
              ))
            : CLIENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => handleClientGenderChange(cat.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    clientGender === cat.key
                      ? `${cat.bg} ${cat.color} shadow`
                      : 'bg-white/5 border-white/8 text-white/40 hover:text-white/60'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                  <span className={`ml-1 text-[10px] ${clientGender === cat.key ? 'opacity-70' : 'opacity-30'}`}>
                    {tutorialClientProfiles[cat.key].length}
                  </span>
                </button>
              ))}
        </div>
      </div>

      {/* ── TUTORIAL HINT ── */}
      {showHint && <TutorialHint onDismiss={() => setShowHint(false)} />}

      {/* ── CARD STACK ── */}
      <div className="flex-1 relative px-4 pb-2" style={{ minHeight: 0 }}>
        <div className="relative w-full h-full" style={{ minHeight: '440px' }}>
          {viewMode === 'client' ? (
            listingDeck.length === 0 ? (
              <EmptyState
                label={LISTING_CATEGORIES.find((c) => c.key === listingCategory)?.label || 'cards'}
                onReset={() => setListingDeck([...tutorialListings[listingCategory]])}
              />
            ) : (
              listingDeck
                .slice(0, 3)
                .reverse()
                .map((listing, revIdx) => {
                  const stackIndex = (Math.min(listingDeck.length, 3) - 1) - revIdx;
                  const isTop = stackIndex === 0;
                  return (
                    <ListingSwipeCard
                      key={listing.id}
                      listing={listing}
                      isTop={isTop}
                      stackIndex={stackIndex}
                      onSwipe={handleListingSwipe}
                      onInsights={() => handleListingInsights(listing)}
                    />
                  );
                })
            )
          ) : (
            clientDeck.length === 0 ? (
              <EmptyState
                label={CLIENT_CATEGORIES.find((c) => c.key === clientGender)?.label || 'clients'}
                onReset={() => setClientDeck([...tutorialClientProfiles[clientGender]])}
              />
            ) : (
              clientDeck
                .slice(0, 3)
                .reverse()
                .map((profile, revIdx) => {
                  const stackIndex = (Math.min(clientDeck.length, 3) - 1) - revIdx;
                  const isTop = stackIndex === 0;
                  return (
                    <ClientSwipeCard
                      key={profile.id}
                      profile={profile}
                      isTop={isTop}
                      stackIndex={stackIndex}
                      onSwipe={handleClientSwipe}
                      onInsights={() => handleClientInsights(profile)}
                    />
                  );
                })
            )
          )}
        </div>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex-shrink-0 px-4 pt-2 pb-6">
        <div className="flex items-center justify-center gap-5">
          {/* Pass button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => {
              if (viewMode === 'client') {
                if (listingDeck.length > 0) handleListingSwipe('left');
              } else {
                if (clientDeck.length > 0) handleClientSwipe('left');
              }
            }}
            className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/60 flex items-center justify-center hover:bg-red-500/20 transition-all shadow-lg"
          >
            <X className="w-7 h-7 text-red-400" />
          </motion.button>

          {/* Info / Insights button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => {
              if (viewMode === 'client' && listingDeck.length > 0) {
                handleListingInsights(listingDeck[0]);
              } else if (viewMode === 'owner' && clientDeck.length > 0) {
                handleClientInsights(clientDeck[0]);
              }
            }}
            className="w-12 h-12 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center hover:bg-amber-500/20 transition-all shadow-lg"
          >
            <Info className="w-5 h-5 text-amber-400" />
          </motion.button>

          {/* Like button */}
          <motion.button
            whileTap={{ scale: 0.90 }}
            onClick={() => {
              if (viewMode === 'client') {
                if (listingDeck.length > 0) handleListingSwipe('right');
              } else {
                if (clientDeck.length > 0) handleClientSwipe('right');
              }
            }}
            className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/60 flex items-center justify-center hover:bg-green-500/20 transition-all shadow-lg"
          >
            <Heart className="w-7 h-7 text-green-400" />
          </motion.button>
        </div>

        {/* Card counter */}
        <p className="text-center text-white/25 text-xs mt-3">
          {viewMode === 'client'
            ? `${listingDeck.length} ${LISTING_CATEGORIES.find((c) => c.key === listingCategory)?.label || ''} left · ${listingLikes} liked · ${listingPasses} passed`
            : `${clientDeck.length} ${CLIENT_CATEGORIES.find((c) => c.key === clientGender)?.label || ''} left · ${clientLikes} liked · ${clientPasses} passed`}
        </p>
      </div>

      {/* ── INSIGHTS MODAL ── */}
      {insightsTarget && (
        <InsightsModal
          title={
            insightsTarget.kind === 'listing'
              ? insightsTarget.data.title
              : `${insightsTarget.data.name}, ${insightsTarget.data.age}`
          }
          subtitle={
            insightsTarget.kind === 'listing'
              ? insightsTarget.data.subtitle
              : insightsTarget.data.city
          }
          insights={insightsTarget.data.insights}
          image={
            insightsTarget.kind === 'listing'
              ? insightsTarget.data.images[0]
              : insightsTarget.data.profile_images[0]
          }
          onClose={() => setInsightsTarget(null)}
        />
      )}
    </div>
  );
}
