import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, SlidersHorizontal,
  RotateCcw, ThumbsDown, Flame, Share2,
  MessageCircle, Sparkles, X, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';

// ── TYPES ────────────────────────────────────────────────────────────────────

interface RoommateCandidate {
  user_id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  profile_images: string[];
  interests: string[];
  languages: string[];
  work_schedule: string;
  cleanliness_level: string;
  noise_tolerance: string;
  personality_traits: string[];
  preferred_activities: string[];
  compatibility?: number;
}

// ── MOCK DATA ─────────────────────────────────────────────────────────────────

const MOCK_CANDIDATES: RoommateCandidate[] = [
  {
    user_id: 'mock-1',
    name: 'Sarah J.',
    age: 26,
    city: 'Tulum Centro',
    country: 'Canada',
    bio: 'Digital nomad looking for a chill spot near the beach. I work in tech and love morning yoga.',
    profile_images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600'],
    interests: ['Yoga', 'Tech', 'Hiking'],
    languages: ['English', 'Spanish'],
    work_schedule: 'Full-time Remote',
    cleanliness_level: 'Very Clean',
    noise_tolerance: 'Low',
    personality_traits: ['Introvert', 'Early bird'],
    preferred_activities: ['Cooking', 'Reading'],
    compatibility: 95
  },
  {
    user_id: 'mock-2',
    name: 'Marcus L.',
    age: 29,
    city: 'La Veleta',
    country: 'USA',
    bio: 'Professional chef relocated to Tulum. Looking for a social house with good vibes.',
    profile_images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'],
    interests: ['Cooking', 'Music', 'Surfing'],
    languages: ['English'],
    work_schedule: 'Evening shifts',
    cleanliness_level: 'Moderate',
    noise_tolerance: 'High',
    personality_traits: ['Extrovert', 'Night owl'],
    preferred_activities: ['Parties', 'Beach clubs'],
    compatibility: 82
  },
  {
    user_id: 'mock-3',
    name: 'Elena R.',
    age: 24,
    city: 'Aldea Zama',
    country: 'Germany',
    bio: 'Artist and weaver. I spend most of my time in my studio. Quiet and respectful.',
    profile_images: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600'],
    interests: ['Art', 'Design', 'Sustainability'],
    languages: ['German', 'English', 'Spanish'],
    work_schedule: 'Flexible',
    cleanliness_level: 'Very Clean',
    noise_tolerance: 'Moderate',
    personality_traits: ['Creative', 'Calm'],
    preferred_activities: ['Art galleries', 'Eco-tours'],
    compatibility: 88
  },
  {
    user_id: 'mock-4',
    name: 'Kai S.',
    age: 28,
    city: 'Centro',
    country: 'Australia',
    bio: 'Freelance photographer, always looking for new adventures. Love exploring local culture.',
    profile_images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'],
    interests: ['Photography', 'Travel', 'Food'],
    languages: ['English'],
    work_schedule: 'Project-based',
    cleanliness_level: 'Moderate',
    noise_tolerance: 'High',
    personality_traits: ['Adventurous', 'Spontaneous'],
    preferred_activities: ['Exploring markets', 'Beach days'],
    compatibility: 76
  },
  {
    user_id: 'mock-5',
    name: 'Yuki T.',
    age: 31,
    city: 'Holistika',
    country: 'Japan',
    bio: 'Yoga instructor and wellness coach. Seeking a peaceful home environment.',
    profile_images: ['https://images.unsplash.com/photo-1502823403499-6ccfcf4cf453?auto=format&fit=crop&q=80&w=600'],
    interests: ['Yoga', 'Meditation', 'Healthy cooking'],
    languages: ['Japanese', 'English'],
    work_schedule: 'Part-time',
    cleanliness_level: 'Very Clean',
    noise_tolerance: 'Low',
    personality_traits: ['Calm', 'Mindful'],
    preferred_activities: ['Morning rituals', 'Healthy meals'],
    compatibility: 91
  },
];

// ── UTILS ─────────────────────────────────────────────────────────────────────

const BTN_SPRING = { type: 'spring' as const, stiffness: 450, damping: 25, mass: 0.6 };

export default function RoommateMatching() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  // Filters
  const [filterGender, setFilterGender] = useState('Any');
  const [filterSchedule, setFilterSchedule] = useState('Any');

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    setCurrentIndex(prev => prev + 1);
    setCanUndo(true);
  }, []);

  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setCanUndo(false);
      triggerHaptic('light');
    }
  }, [currentIndex]);

  const handleLike = () => cardRef.current?.triggerSwipe('right');
  const handleDislike = () => cardRef.current?.triggerSwipe('left');

  const topCard = MOCK_CANDIDATES[currentIndex] ?? null;
  const nextCard = MOCK_CANDIDATES[currentIndex + 1] ?? null;

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

  return (
    <div
      className={cn(
        "relative w-full h-[100dvh] flex flex-col overflow-hidden transition-colors duration-500",
        isLight ? "bg-slate-50" : "bg-black"
      )}
    >
      {/* ── TOP NAV (Liquid Glass) ── */}
      <div className="absolute top-0 left-0 right-0 z-50 px-3 pointer-events-none pt-[var(--safe-top)]">
        {/* Main nav row */}
        <div className="w-full flex items-center justify-between py-3 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all",
              isLight ? "bg-white/80 border-slate-200 text-slate-900 shadow-sm" : "bg-white/10 border-white/10 text-white"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className={cn(
            "px-5 py-2 rounded-full backdrop-blur-xl border flex items-center gap-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
            isLight ? "bg-white/90 border-slate-200 text-slate-900" : "bg-zinc-900/80 border-white/10 text-white"
          )}>
            <div className={cn("w-2 h-2 rounded-full", roommateVisible ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t('nav.roommates')}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all relative overflow-hidden",
              isLight ? "bg-white/80 border-slate-200 text-slate-900 shadow-sm" : "bg-white/10 border-white/10 text-white"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Visibility toggle row */}
        <div className="flex justify-center pb-1 pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { triggerHaptic('light'); setRoommateVisible(v => !v); }}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl border transition-all shadow-sm",
              roommateVisible
                ? isLight ? "bg-emerald-50/90 border-emerald-300 text-emerald-700" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : isLight ? "bg-white/80 border-slate-200 text-slate-400" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            {roommateVisible
              ? <Eye className="w-3.5 h-3.5" />
              : <EyeOff className="w-3.5 h-3.5" />
            }
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              {roommateVisible ? t('roommates.visibleToOthers') : t('roommates.hiddenFromOthers')}
            </span>
            {/* Toggle pill */}
            <div className={cn(
              "relative w-8 h-4 rounded-full transition-colors duration-200",
              roommateVisible ? "bg-emerald-500" : isLight ? "bg-slate-300" : "bg-white/20"
            )}>
              <motion.div
                animate={{ x: roommateVisible ? 16 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* ── DECK AREA ── */}
      <div className="flex-1 relative mt-[calc(var(--safe-top)+7rem)] px-3 py-4 z-40">
        <div className="relative w-full h-full max-w-md mx-auto">
          <AnimatePresence mode="popLayout" initial={false}>
            {!topCard ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center gap-6 px-10"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
                  <Users className="w-12 h-12 text-primary" strokeWidth={1} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-black text-foreground tracking-tight italic">{t('roommates.tulumVibesOnly')}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                    {t('roommates.noCandidatesLeft')}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(0)}
                  className="px-10 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-[0_10px_30px_rgba(236,72,153,0.3)] transition-all active:shadow-none"
                >
                  {t('common.reset')}
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Visual indicator for back card */}
                {nextCard && (
                  <motion.div
                    key={`next-${nextCard.user_id}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.5, scale: 0.94, y: 15 }}
                    exit={{ opacity: 0, scale: 1 }}
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{ filter: 'blur(1px)' }}
                  >
                    <SimpleOwnerSwipeCard
                      profile={toCardProfile(nextCard)}
                      onSwipe={() => {}}
                      isTop={false}
                    />
                  </motion.div>
                )}

                {/* Top card */}
                <motion.div 
                  key={`top-${topCard.user_id}`}
                  initial={{ opacity: 0, x: 50, scale: 0.9, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 z-20"
                >
                  <SimpleOwnerSwipeCard
                    ref={cardRef}
                    profile={toCardProfile(topCard)}
                    onSwipe={handleSwipe}
                    onInsights={() => setShowInsights(true)}
                    isTop
                  />
                  
                  {/* Premium Compatibility Badge */}
                  <div className="absolute top-24 right-4 z-30 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {topCard.compatibility}% Match
                      </span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── ACTION BAR (Liquid Glass) ── */}
      {topCard && (
        <div className="flex-shrink-0 px-4 z-[60] relative pb-[calc(1rem+var(--safe-bottom))]">
          <div className={cn(
            "max-w-md mx-auto rounded-[32px] border backdrop-blur-3xl p-2.5 flex items-center justify-between gap-2 shadow-2xl relative overflow-hidden",
            isLight ? "bg-white/80 border-slate-200" : "bg-zinc-900/60 border-white/10"
          )}>
            {/* Glossy highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/20 z-10" />

            {/* Undo */}
            <ActionButton 
              onClick={handleUndo} 
              disabled={!canUndo} 
              icon={RotateCcw} 
              color="amber" 
            />
            
            {/* NO / Pass */}
            <ActionButton 
              onClick={handleDislike} 
              icon={ThumbsDown} 
              color="red" 
              large 
            />
            
            {/* Share */}
            <ActionButton 
              onClick={() => triggerHaptic('light')} 
              icon={Share2} 
              color="blue" 
            />
            
            {/* YES / Like */}
            <ActionButton 
              onClick={handleLike} 
              icon={Flame} 
              color="orange" 
              large 
              filled 
            />
            
            {/* Message */}
            <ActionButton 
              onClick={() => triggerHaptic('light')} 
              icon={MessageCircle} 
              color="emerald" 
            />
          </div>
        </div>
      )}

      {/* ── FILTER OVERLAY (Glassmorphism) ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className={cn(
                "fixed bottom-0 left-0 right-0 z-[101] rounded-t-[40px] border-t p-8 pb-[calc(2rem+var(--safe-bottom))]",
                isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10"
              )}
            >
              <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black italic tracking-tight italic">{t('roommates.findYourTribe')}</h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilters(false)}
                  className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-8 mb-10">
                <FilterGroup 
                  label={t('roommates.genderPreference')} 
                  options={['Any', 'Female', 'Male', 'Non-binary']} 
                  selected={filterGender} 
                  setSelected={setFilterGender} 
                />
                <FilterGroup 
                  label={t('roommates.workVibe')} 
                  options={['Any', 'Remote', 'Hybrid', 'Office', 'Flexible']} 
                  selected={filterSchedule} 
                  setSelected={setFilterSchedule} 
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFilters(false)}
                className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20"
              >
                {t('roommates.applyFilters')}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function ActionButton({ 
  onClick, icon: Icon, color, large = false, disabled = false, filled = false 
}: { 
  onClick: () => void; icon: any; color: string; large?: boolean; disabled?: boolean; filled?: boolean; 
}) {
  const colors = {
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    red: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };

  const filledColors = {
    orange: "bg-gradient-to-br from-rose-500 to-orange-400 text-white border-transparent shadow-lg shadow-orange-500/30",
  };

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.85 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn(
        "rounded-full flex items-center justify-center transition-all border",
        large ? "w-16 h-16" : "w-12 h-12",
        disabled ? "opacity-20 grayscale pointer-events-none" : "opacity-100",
        filled ? filledColors[color as keyof typeof filledColors] : colors[color as keyof typeof colors]
      )}
    >
      <Icon className={cn(large ? "w-7 h-7" : "w-5 h-5")} strokeWidth={2.5} fill={filled ? "currentColor" : "none"} />
    </motion.button>
  );
}

function FilterGroup({ label, options, selected, setSelected }: { 
  label: string; options: string[]; selected: string; setSelected: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
        {label}
      </p>
      <div className="flex flex-wrap gap-2.5">
        {options.map(opt => (
          <motion.button
            key={opt}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('light'); setSelected(opt); }}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest border transition-all",
              selected === opt 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-muted/5 border-muted/20 text-muted-foreground hover:bg-muted/10"
            )}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
