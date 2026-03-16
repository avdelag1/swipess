/**
 * ROOMMATE MATCHING PAGE
 *
 * Full-screen swipe card experience for finding compatible roommates.
 * Header: circle profile photo (static) + pill-shaped action button bar
 * No bottom navigation — card fills the entire screen.
 * Uses 5 demo candidates to showcase the experience.
 */

import { useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, RotateCcw, Share2, MessageCircle, Flame, ThumbsDown,
  Sparkles, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

// ── MOCK DATA ──────────────────────────────────────────────────────────────────

interface RoommateCandidate {
  user_id: string;
  name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  nationality: string | null;
  city: string | null;
  country: string | null;
  neighborhood: string | null;
  work_schedule: string | null;
  cleanliness_level: string | null;
  noise_tolerance: string | null;
  smoking_habit: string | null;
  drinking_habit: string | null;
  interests: string[];
  languages: string[];
  profile_images: string[];
  personality_traits: string[];
  preferred_activities: string[];
  compatibility: number;
}

const LOGO = '/icons/fire-s-logo.png';

const MOCK_CANDIDATES: RoommateCandidate[] = [
  {
    user_id: 'mock-1',
    name: 'Sofia',
    age: 26,
    bio: 'Digital nomad who loves cooking and yoga. Very clean and organized.',
    gender: 'Female',
    nationality: 'Spanish',
    city: 'Barcelona',
    country: 'Spain',
    neighborhood: 'Eixample',
    work_schedule: 'remote',
    cleanliness_level: 'high',
    noise_tolerance: 'low',
    smoking_habit: 'never',
    drinking_habit: 'social',
    interests: ['Yoga', 'Cooking', 'Travel', 'Photography'],
    languages: ['Spanish', 'English'],
    profile_images: [LOGO],
    personality_traits: ['Creative', 'Organized', 'Quiet'],
    preferred_activities: ['Morning yoga', 'Cooking together'],
    compatibility: 94,
  },
  {
    user_id: 'mock-2',
    name: 'Marco',
    age: 29,
    bio: 'Software engineer and weekend hiker. Quiet during the week, social on weekends.',
    gender: 'Male',
    nationality: 'Italian',
    city: 'Milan',
    country: 'Italy',
    neighborhood: 'Navigli',
    work_schedule: 'hybrid',
    cleanliness_level: 'medium',
    noise_tolerance: 'medium',
    smoking_habit: 'never',
    drinking_habit: 'social',
    interests: ['Hiking', 'Coding', 'Music', 'Coffee'],
    languages: ['Italian', 'English', 'Spanish'],
    profile_images: [LOGO],
    personality_traits: ['Introverted', 'Reliable', 'Active'],
    preferred_activities: ['Weekend hikes', 'Movie nights'],
    compatibility: 88,
  },
  {
    user_id: 'mock-3',
    name: 'Amara',
    age: 24,
    bio: 'Grad student studying architecture. Love art, museums, and café work sessions.',
    gender: 'Female',
    nationality: 'French',
    city: 'Paris',
    country: 'France',
    neighborhood: 'Le Marais',
    work_schedule: 'student',
    cleanliness_level: 'high',
    noise_tolerance: 'low',
    smoking_habit: 'never',
    drinking_habit: 'rarely',
    interests: ['Art', 'Architecture', 'Reading', 'Cycling'],
    languages: ['French', 'English'],
    profile_images: [LOGO],
    personality_traits: ['Creative', 'Focused', 'Thoughtful'],
    preferred_activities: ['Museum visits', 'Café work sessions'],
    compatibility: 85,
  },
  {
    user_id: 'mock-4',
    name: 'Kai',
    age: 28,
    bio: 'Freelance musician and part-time barista. Easy going, loves good vibes and live music.',
    gender: 'Non-binary',
    nationality: 'German',
    city: 'Berlin',
    country: 'Germany',
    neighborhood: 'Mitte',
    work_schedule: 'flexible',
    cleanliness_level: 'medium',
    noise_tolerance: 'high',
    smoking_habit: 'occasionally',
    drinking_habit: 'social',
    interests: ['Music', 'Coffee', 'Art', 'Festivals'],
    languages: ['German', 'English'],
    profile_images: [LOGO],
    personality_traits: ['Creative', 'Extroverted', 'Spontaneous'],
    preferred_activities: ['Live music', 'House parties', 'Record shopping'],
    compatibility: 79,
  },
  {
    user_id: 'mock-5',
    name: 'Yuki',
    age: 31,
    bio: 'UX designer working remotely. Quiet, tidy, loves hosting small dinner parties.',
    gender: 'Female',
    nationality: 'Japanese',
    city: 'Lisbon',
    country: 'Portugal',
    neighborhood: 'Alfama',
    work_schedule: 'remote',
    cleanliness_level: 'high',
    noise_tolerance: 'low',
    smoking_habit: 'never',
    drinking_habit: 'social',
    interests: ['Design', 'Cooking', 'Plants', 'Meditation'],
    languages: ['Japanese', 'English', 'Portuguese'],
    profile_images: [LOGO],
    personality_traits: ['Introverted', 'Thoughtful', 'Tidy'],
    preferred_activities: ['Dinner parties', 'Plant care', 'Morning meditation'],
    compatibility: 91,
  },
];

// ── SPRING CONFIG ─────────────────────────────────────────────────────────────
const BTN_SPRING = { type: 'spring' as const, stiffness: 460, damping: 26, mass: 0.55 };
const ENTRY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 26, mass: 0.7 };

// ── PILL ACTION BUTTON ────────────────────────────────────────────────────────
type BtnColor = { icon: string; glow: string };

const BTN_COLORS: Record<string, BtnColor> = {
  amber:  { icon: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
  red:    { icon: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  purple: { icon: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
  orange: { icon: '#ff6b35', glow: 'rgba(255,107,53,0.5)' },
  cyan:   { icon: '#06b6d4', glow: 'rgba(6,182,212,0.5)' },
};

const PillButton = memo(({
  onClick,
  disabled = false,
  colorKey,
  large = false,
  ariaLabel,
  children,
  index = 0,
}: {
  onClick: () => void;
  disabled?: boolean;
  colorKey: string;
  large?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  index?: number;
}) => {
  const [burst, setBurst] = useState(false);
  const cfg = BTN_COLORS[colorKey] ?? BTN_COLORS.amber;
  const size = large ? 52 : 42;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    triggerHaptic(colorKey === 'orange' ? 'success' : colorKey === 'red' ? 'warning' : 'light');
    setBurst(true);
    setTimeout(() => setBurst(false), 400);
    onClick();
  }, [disabled, colorKey, onClick]);

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...ENTRY_SPRING, delay: index * 0.04 }}
      whileTap={{ scale: 0.84, transition: BTN_SPRING }}
      className="relative flex items-center justify-center flex-shrink-0 touch-manipulation select-none"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      {/* Glow burst */}
      <AnimatePresence>
        {burst && (
          <motion.span
            key="burst"
            aria-hidden="true"
            initial={{ scale: 0.3, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0, 0.55, 0.45, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.glow} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <span
        style={{
          width: large ? 28 : 22,
          height: large ? 28 : 22,
          color: cfg.icon,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: `drop-shadow(0 2px 8px ${cfg.glow})`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </span>
    </motion.button>
  );
});
PillButton.displayName = 'PillButton';

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RoommateMatching() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  const topCard = MOCK_CANDIDATES[currentIndex] ?? null;
  const nextCard = MOCK_CANDIDATES[currentIndex + 1] ?? null;

  const handleSwipe = useCallback((_direction: 'left' | 'right') => {
    setLastIndex(currentIndex);
    setCanUndo(true);
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const handleUndo = useCallback(() => {
    if (lastIndex !== null) {
      setCurrentIndex(lastIndex);
      setCanUndo(false);
      setLastIndex(null);
    }
  }, [lastIndex]);

  const handleLike    = useCallback(() => cardRef.current?.triggerSwipe('right'), []);
  const handleDislike = useCallback(() => cardRef.current?.triggerSwipe('left'), []);

  // Map candidate to SimpleOwnerSwipeCard profile shape
  const toCardProfile = (c: RoommateCandidate) => ({
    user_id: c.user_id,
    name: c.name,
    age: c.age,
    city: c.city,
    country: c.country,
    bio: c.bio,
    profile_images: c.profile_images,
    interests: c.interests,
    languages: c.languages,
    work_schedule: c.work_schedule,
    cleanliness_level: c.cleanliness_level,
    noise_tolerance: c.noise_tolerance,
    personality_traits: c.personality_traits,
    preferred_activities: c.preferred_activities,
  });

  // Glass bar styles — matches BottomNavigation liquid glass design
  const barBg     = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(12,12,14,0.92)';
  const barBorder = isLight ? 'rgba(0,0,0,0.08)'       : 'rgba(255,255,255,0.10)';
  const barShadow = isLight
    ? 'inset 0 1px 0 rgba(255,255,255,0.92), 0 2px 12px rgba(0,0,0,0.06)'
    : 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.35)';

  return (
    <div
      className="relative w-full flex flex-col overflow-hidden"
      style={{ height: '100dvh', minHeight: '100dvh', background: '#0a0a0b' }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-40 px-3 flex items-center gap-2"
        style={{
          paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
          paddingBottom: 10,
        }}
      >
        {/* Back button */}
        <motion.button
          onClick={() => navigate(-1)}
          whileTap={{ scale: 0.88, transition: BTN_SPRING }}
          aria-label="Go back"
          className="flex items-center justify-center flex-shrink-0 touch-manipulation"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)',
            border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.15)'}`,
          }}
        >
          <ChevronLeft
            className="w-5 h-5"
            style={{ color: isLight ? '#1a1a1a' : 'rgba(255,255,255,0.9)' }}
          />
        </motion.button>

        {/* Current user circle avatar (static — does not move with card) */}
        <div
          className="flex-shrink-0 flex items-center justify-center font-bold text-sm text-white select-none"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #f97316 100%)',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 2px 12px rgba(102,126,234,0.45)',
          }}
        >
          Me
        </div>

        {/* Page title */}
        <div className="flex-1 flex flex-col">
          <span className="text-sm font-black text-white tracking-tight">Roommates</span>
          <span className="text-[10px] text-white/50 font-medium">Find your match</span>
        </div>
      </div>

      {/* ── CARD AREA ─────────────────────────────────────────────────────── */}
      {!topCard ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <Users className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-lg font-bold text-foreground">No more candidates</h2>
          <p className="text-sm text-muted-foreground text-center">
            Check back later for new potential roommates
          </p>
        </div>
      ) : (
        <div className="relative flex-1 w-full" style={{ minHeight: 0 }}>
          {/* Next card (behind) */}
          {nextCard && (
            <div
              key={`next-${nextCard.user_id}`}
              className="absolute inset-0"
              style={{ zIndex: 5, transform: 'scale(0.95)', opacity: 0.7, pointerEvents: 'none' }}
            >
              <SimpleOwnerSwipeCard
                profile={toCardProfile(nextCard)}
                onSwipe={() => {}}
                isTop={false}
              />
            </div>
          )}

          {/* Top card (interactive) */}
          <div
            key={topCard.user_id}
            className="absolute inset-0"
            style={{ zIndex: 10 }}
          >
            <SimpleOwnerSwipeCard
              ref={cardRef}
              profile={toCardProfile(topCard)}
              onSwipe={handleSwipe}
              isTop
            />

            {/* Compatibility badge */}
            <div
              className="absolute z-20 flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                top: 'max(80px, calc(env(safe-area-inset-top, 0px) + 80px))',
                right: 16,
                backgroundColor: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-bold text-white">{topCard.compatibility}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM ACTION BUTTONS ─────────────────────────────────────────── */}
      {topCard && (
        <div
          className="flex-shrink-0 flex justify-center px-3 z-40"
          style={{
            paddingTop: 12,
            paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          }}
        >
          <div
            className="overflow-hidden"
            style={{
              backgroundColor: barBg,
              border: `1px solid ${barBorder}`,
              borderRadius: 26,
              boxShadow: barShadow,
              position: 'relative',
              width: '100%',
              maxWidth: 360,
            }}
          >
            {/* Animated liquid glass highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                borderRadius: 'inherit',
                background: `radial-gradient(ellipse 160% 50% at 15% 0%,
                  rgba(255,255,255,${isLight ? 0.55 : 0.14}) 0%, transparent 60%),
                  radial-gradient(ellipse 100% 60% at 85% 100%,
                  rgba(255,255,255,${isLight ? 0.22 : 0.06}) 0%, transparent 55%)`,
                zIndex: 1,
              }}
            />

            {/* Buttons row */}
            <div
              data-no-swipe-nav
              className="relative flex items-center justify-around px-2"
              style={{
                paddingTop: 8,
                paddingBottom: 8,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                zIndex: 2,
                gap: 4,
              }}
            >
              {/* Return / Undo */}
              <PillButton
                onClick={handleUndo}
                disabled={!canUndo}
                colorKey="amber"
                ariaLabel="Undo last swipe"
                index={0}
              >
                <RotateCcw className="w-full h-full" strokeWidth={2.8} />
              </PillButton>

              {/* Dislike */}
              <PillButton
                onClick={handleDislike}
                colorKey="red"
                large
                ariaLabel="Pass on this roommate"
                index={1}
              >
                <ThumbsDown className="w-full h-full" fill="currentColor" strokeWidth={0} />
              </PillButton>

              {/* Share */}
              <PillButton
                onClick={() => triggerHaptic('light')}
                colorKey="purple"
                ariaLabel="Share profile"
                index={2}
              >
                <Share2 className="w-full h-full" strokeWidth={2.8} />
              </PillButton>

              {/* Like */}
              <PillButton
                onClick={handleLike}
                colorKey="orange"
                large
                ariaLabel="Like this roommate"
                index={3}
              >
                <Flame className="w-full h-full" fill="currentColor" strokeWidth={0} />
              </PillButton>

              {/* Message */}
              <PillButton
                onClick={() => triggerHaptic('light')}
                colorKey="cyan"
                ariaLabel="Send a message"
                index={4}
              >
                <MessageCircle className="w-full h-full" strokeWidth={2.8} />
              </PillButton>
            </div>
          </div>
        </div>
      )}

      {/* SVG gradient defs */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="rmatch-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#667eea" offset="0%" />
            <stop stopColor="#f97316" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
