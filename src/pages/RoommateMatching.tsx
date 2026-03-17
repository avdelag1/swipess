import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, SlidersHorizontal,
  Sparkles, X, Eye, EyeOff, MapPin, 
  Briefcase, RotateCcw, ThumbsDown, Share2, 
  Flame, MessageCircle
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
    name: 'Julian M.',
    age: 31,
    city: 'Region 15',
    country: 'Argentina',
    bio: 'Software engineer and kite surfer. Looking for a place with high-speed internet and like-minded peeps.',
    profile_images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'],
    interests: ['Kite Surfing', 'Rust', 'Coffee'],
    languages: ['Spanish', 'English'],
    work_schedule: '9-5 Remote',
    cleanliness_level: 'Clean',
    noise_tolerance: 'Moderate',
    personality_traits: ['Active', 'Social'],
    preferred_activities: ['Beach workout', 'Gaming'],
    compatibility: 91
  },
  {
    user_id: 'mock-5',
    name: 'Chloe B.',
    age: 27,
    city: 'Tankah Bay',
    country: 'UK',
    bio: 'Yoga instructor and content creator. I love quiet mornings and sunrise sessions. Seeking a peaceful home.',
    profile_images: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=600'],
    interests: ['Yoga', 'Photography', 'Travel'],
    languages: ['English', 'French'],
    work_schedule: 'Morning Classes',
    cleanliness_level: 'Pristine',
    noise_tolerance: 'Very Low',
    personality_traits: ['Zen', 'Organized'],
    preferred_activities: ['Meditation', 'Skin care'],
    compatibility: 94
  },
  {
    user_id: 'mock-6',
    name: 'Diego S.',
    age: 25,
    city: 'Tulum Centro',
    country: 'Mexico',
    bio: 'Local architect and DJ. I know all the hidden spots in Tulum. Very chill and happy to share tips.',
    profile_images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600'],
    interests: ['Architecture', 'Techno', 'History'],
    languages: ['Spanish', 'English', 'Italian'],
    work_schedule: 'Afternoons',
    cleanliness_level: 'Relaxed',
    noise_tolerance: 'High',
    personality_traits: ['Laid back', 'Knowledgeable'],
    preferred_activities: ['Underground parties', 'Local food'],
    compatibility: 78
  },
  {
    user_id: 'mock-7',
    name: 'Sasha V.',
    age: 28,
    city: 'Aldea Zama',
    country: 'Russia',
    bio: 'Crypto trader and fitnes enthusiast. I live in the gym or at my laptop. Looking for a high-end apartment share.',
    profile_images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'],
    interests: ['Gym', 'Bitcoin', 'Finance'],
    languages: ['Russian', 'English'],
    work_schedule: 'Market hours',
    cleanliness_level: 'Clean',
    noise_tolerance: 'Moderate',
    personality_traits: ['Ambitious', 'Focused'],
    preferred_activities: ['Weights', 'Fine dining'],
    compatibility: 85
  }
];

export default function RoommateMatching() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  // Filters
  const [filterGender, setFilterGender] = useState('Any');
  const [filterSchedule, setFilterSchedule] = useState('Any');

  const handleSwipe = useCallback((_direction: 'left' | 'right') => {
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
        "relative w-full flex flex-col overflow-hidden transition-colors duration-500",
        isLight ? "bg-slate-50" : "bg-black"
      )}
      style={{ height: '100dvh' }}
    >
      {/* ── TOP NAV (Liquid Glass) ── */}
      <div className="absolute top-0 left-0 right-0 z-50 px-3 pointer-events-none pt-[var(--safe-top)]">
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

        {/* ── VISIBILITY TOGGLE ── */}
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
            {roommateVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">
              {roommateVisible ? t('roommates.visibleToOthers') : t('roommates.hiddenFromOthers')}
            </span>
            <div className={cn(
              "relative w-7 h-4 rounded-full transition-all duration-300",
              roommateVisible ? "bg-emerald-500" : isLight ? "bg-slate-300" : "bg-white/20"
            )}>
              <motion.div
                animate={{ x: roommateVisible ? 12 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 left-0 w-3 h-3 rounded-full bg-white shadow-sm"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* ── DECK AREA ── */}
      <div className="flex-1 relative px-3 py-4 z-40" style={{ marginTop: 'calc(var(--safe-top, 0px) + 7rem)' }}>
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No more candidates matching your vibe right now.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(0)}
                  className="px-10 py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30"
                >
                  {t('common.reset')}
                </motion.button>
              </motion.div>
            ) : (
              <>
                {nextCard && (
                  <div className="absolute inset-0 z-10 opacity-30 scale-95 translate-y-4 pointer-events-none">
                    <SimpleOwnerSwipeCard
                      profile={toCardProfile(nextCard)}
                      onSwipe={() => {}}
                      isTop={false}
                    />
                  </div>
                )}
                <motion.div 
                  key={topCard.user_id}
                  initial={{ opacity: 0, x: 50, scale: 0.9, rotate: 2 }}
                  animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute inset-0 z-20"
                >
                  <SimpleOwnerSwipeCard
                    ref={cardRef}
                    profile={toCardProfile(topCard)}
                    onSwipe={handleSwipe}
                    onDetails={() => setShowDetails(true)}
                    isTop
                  />
                  <div className="absolute top-24 right-4 z-30 pointer-events-none">
                    <motion.div 
                      key={`compat-${topCard.user_id}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden relative"
                    >
                      {/* Animated Shimmer */}
                      <motion.div
                        animate={{ x: ['100%', '-100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                      />
                      <Sparkles className="w-3 h-3 text-amber-400 relative z-10" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest relative z-10">
                        {topCard.compatibility}% Match
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── ACTION BAR ── */}
      {topCard && (
        <div className="px-4 pb-[calc(1.5rem+104px+var(--safe-bottom))] z-[60] relative">
          <div className={cn(
            "max-w-md mx-auto rounded-[32px] border backdrop-blur-3xl p-2.5 flex items-center justify-between gap-2 shadow-2xl",
            isLight ? "bg-white/80 border-slate-200" : "bg-zinc-900/60 border-white/10"
          )}>
            <ActionButton onClick={handleUndo} disabled={!canUndo} icon={RotateCcw} color="amber" />
            <ActionButton onClick={handleDislike} icon={ThumbsDown} color="red" large />
            <ActionButton onClick={() => triggerHaptic('light')} icon={Share2} color="blue" />
            <ActionButton onClick={handleLike} icon={Flame} color="orange" large filled />
            <ActionButton onClick={() => triggerHaptic('light')} icon={MessageCircle} color="emerald" />
          </div>
        </div>
      )}

      {/* ── PROFILE DETAILS OVERLAY ── */}
      <AnimatePresence>
        {showDetails && topCard && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                "fixed inset-x-0 bottom-0 top-[10%] z-[111] rounded-t-[40px] border-t overflow-hidden flex flex-col",
                isLight ? "bg-white border-slate-200" : "bg-zinc-950 border-white/10"
              )}
            >
              <div className="absolute top-4 right-4 z-[120]">
                <button onClick={() => setShowDetails(false)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="relative h-[60%] w-full">
                  <img src={topCard.profile_images[0]} className="w-full h-full object-cover" alt={topCard.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                  <div className="absolute bottom-8 left-8">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{topCard.name}, {topCard.age}</h2>
                    <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
                       <MapPin className="w-3 h-3" /> {topCard.city}
                    </p>
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <DetailBadge icon={Sparkles} label="Compatibility" value={`${topCard.compatibility}%`} />
                    <DetailBadge icon={Briefcase} label="Schedule" value={topCard.work_schedule} />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">About Me</h3>
                    <p className="text-sm leading-relaxed text-foreground/80">{topCard.bio}</p>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Vibe Check</h3>
                    <div className="flex flex-wrap gap-2">
                      {topCard.personality_traits.map(tag => (
                        <span key={tag} className="px-4 py-2 rounded-xl bg-muted/30 text-[10px] font-bold uppercase tracking-widest border border-muted/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t bg-zinc-950/50 backdrop-blur-xl flex gap-4">
                <button onClick={() => { handleSwipe('left'); setShowDetails(false); }} className="flex-1 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white font-black uppercase tracking-widest text-[10px]">Pass</button>
                <button onClick={() => { handleSwipe('right'); setShowDetails(false); }} className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20">Connect</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FILTER OVERLAY ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={cn("fixed bottom-0 left-0 right-0 z-[101] rounded-t-[40px] border-t p-8 pb-[calc(2rem+var(--safe-bottom))]", isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}>
              <div className="w-12 h-1.5 bg-muted/30 rounded-full mx-auto mb-8" />
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black italic tracking-tight">{t('roommates.findYourTribe')}</h3>
                <button onClick={() => setShowFilters(false)} className="w-10 h-10 rounded-full bg-muted/10 flex items-center justify-center"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-8 mb-10">
                <FilterGroup label={t('roommates.genderPreference')} options={['Any', 'Female', 'Male', 'Non-binary']} selected={filterGender} setSelected={setFilterGender} />
                <FilterGroup label={t('roommates.workVibe')} options={['Any', 'Remote', 'Hybrid', 'Office', 'Flexible']} selected={filterSchedule} setSelected={setFilterSchedule} />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowFilters(false)} className="w-full py-5 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20">{t('roommates.applyFilters')}</motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function DetailBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-muted/10 border border-muted/10">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3 h-3 text-primary" />
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, color, large = false, disabled = false, filled = false }: { onClick: () => void; icon: any; color: string; large?: boolean; disabled?: boolean; filled?: boolean; }) {
  const colors = {
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    red: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };
  const filledColors = { orange: "bg-gradient-to-br from-rose-500 to-orange-400 text-white border-transparent shadow-lg shadow-orange-500/30" };
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.85 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={cn("rounded-full flex items-center justify-center transition-all border", large ? "w-16 h-16" : "w-12 h-12", disabled ? "opacity-20 grayscale pointer-events-none" : "opacity-100", filled ? filledColors[color as keyof typeof filledColors] : colors[color as keyof typeof colors])}>
      <Icon className={cn(large ? "w-7 h-7" : "w-5 h-5")} strokeWidth={2.5} fill={filled ? "currentColor" : "none"} />
    </motion.button>
  );
}

function FilterGroup({ label, options, selected, setSelected }: { label: string; options: string[]; selected: string; setSelected: (v: string) => void; }) {
  return (
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map(opt => (
          <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => { triggerHaptic('light'); setSelected(opt); }} className={cn("px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest border transition-all", selected === opt ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-muted/5 border-muted/20 text-muted-foreground hover:bg-muted/10")}>{opt}</motion.button>
        ))}
      </div>
    </div>
  );
}
