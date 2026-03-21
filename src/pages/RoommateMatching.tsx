import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, SlidersHorizontal,
  Sparkles, X, MapPin,
  Briefcase, MessageCircle,
  ShieldCheck, Info, Clock,
  Eye, EyeOff
} from 'lucide-react';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
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
  }
];

// ── CUSTOM HOOKS ─────────────────────────────────────────────────────────────

/**
 * detectScroll: Tracks scroll direction to hide/show UI components.
 * Returns { isVisible }
 */
function useHideOnScroll(threshold = 10) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const onScroll = useCallback((e: any) => {
    const currentY = e.target.scrollTop;
    if (Math.abs(currentY - lastScrollY.current) < threshold) return;
    
    if (currentY > lastScrollY.current && currentY > 50) {
      setIsVisible(false); // Scrolling down
    } else {
      setIsVisible(true); // Scrolling up
    }
    lastScrollY.current = currentY;
  }, [threshold]);

  return { isVisible, onScroll };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function RoommateMatching() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  const { isVisible: uiVisible, onScroll: handleScroll } = useHideOnScroll();

  // REAL DATA HOOK
  const { data: realCandidates, isLoading: _isLoading } = useSmartClientMatching(
    user?.id,
    undefined,
    0,
    20,
    false,
    undefined,
    true // isRoommateSection
  );

  // Merge real and mock for dev fallback
  const candidates = useMemo(() => {
    if (realCandidates && realCandidates.length > 0) return realCandidates;
    return MOCK_CANDIDATES;
  }, [realCandidates]);

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

  const topCard = candidates[currentIndex] ?? null;
  const nextCard = candidates[currentIndex + 1] ?? null;

  const toCardProfile = (c: any) => ({
    user_id: c.user_id,
    name: c.name || (c as any).full_name,
    age: c.age,
    city: c.city || (c as any).location?.city,
    country: c.country,
    bio: c.bio,
    profile_images: c.profile_images || (c as any).images,
    interests: c.interests,
    languages: c.languages || (c as any).languages_spoken,
    work_schedule: c.work_schedule,
    cleanliness_level: c.cleanliness_level,
    noise_tolerance: c.noise_tolerance,
    personality_traits: c.personality_traits,
    preferred_activities: c.preferred_activities,
  });

  return (
    <div
      data-no-swipe-nav
      className={cn(
        "relative w-full h-[100dvh] overflow-hidden flex flex-col transition-colors duration-500",
        isLight ? "bg-slate-50" : "bg-[#0A0A0B]"
      )}
    >
      {/* ── IMMERSIVE HEADER (Liquid Glass) ── */}
      <motion.div 
        animate={{ y: uiVisible ? 0 : -120 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="absolute top-0 left-0 right-0 z-[100] pt-[var(--safe-top)] pb-6 px-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/client/dashboard')}
              className={cn(
                "w-11 h-11 rounded-[1.2rem] flex items-center justify-center border backdrop-blur-3xl transition-all",
                isLight ? "bg-white/80 border-slate-200 text-slate-900 shadow-sm" : "bg-black/30 border-white/10 text-white"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex flex-col">
              <span className={cn("text-[9px] font-black uppercase tracking-[0.25em] opacity-50", isLight ? "text-slate-900" : "text-white")}>Tulum</span>
              <span className={cn("text-sm font-black italic tracking-tight uppercase leading-none", isLight ? "text-slate-900" : "text-white")}>{t('nav.roommates')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* VISIBILITY STATUS BUBBLE */}
             <motion.button
               whileTap={{ scale: 0.95 }}
               onClick={() => { triggerHaptic('light'); setRoommateVisible(!roommateVisible); }}
               className={cn(
                 "px-3.5 h-11 rounded-[1.2rem] border backdrop-blur-3xl flex items-center gap-2 transition-all shadow-sm",
                 roommateVisible
                   ? isLight ? "bg-emerald-50/90 border-emerald-300 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                   : isLight ? "bg-white/80 border-slate-200 text-slate-400" : "bg-white/5 border-white/10 text-white/40"
               )}
             >
               {roommateVisible
                 ? <Eye className="w-4 h-4 shrink-0" />
                 : <EyeOff className="w-4 h-4 shrink-0" />
               }
               <span className="text-[10px] font-black uppercase tracking-widest">
                 {roommateVisible ? 'Visible' : 'Hidden'}
               </span>
             </motion.button>

             <motion.button
               whileTap={{ scale: 0.88 }}
               onClick={() => setShowFilters(true)}
               className="w-11 h-11 rounded-[1.2rem] flex items-center justify-center bg-white/10 dark:bg-white/10 border border-white/20 backdrop-blur-md shadow-[0_4px_14px_rgba(0,0,0,0.4)] active:shadow-inner"
             >
               <SlidersHorizontal className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
             </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── CARD STACK AREA ── */}
      <div className="flex-1 relative w-full h-full">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!topCard ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center px-12 gap-8"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                  <div className={cn(
                    "w-32 h-32 rounded-[3.5rem] flex items-center justify-center border relative z-10",
                    isLight ? "bg-white border-slate-200 shadow-2xl" : "bg-zinc-900 border-white/5 shadow-2xl"
                  )}>
                    <Users className="w-14 h-14 text-primary" strokeWidth={1} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className={cn("text-3xl font-black italic tracking-tighter uppercase", isLight ? "text-slate-900" : "text-white")}>
                    {t('roommates.tulumVibesOnly')}
                  </h2>
                  <p className={cn("text-sm font-bold uppercase tracking-widest leading-relaxed opacity-50", isLight ? "text-slate-600" : "text-white/50")}>
                    Everyone has been matched. Check back later for new arrivals.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(0)}
                  className="px-12 py-5 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.25em] text-[11px] shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)]"
                >
                  Find more
                </motion.button>
              </motion.div>
            ) : (
              <div className="absolute inset-0">
                {nextCard && (
                  <div className="absolute inset-0 z-10 opacity-40 scale-[0.98] translate-y-2 pointer-events-none">
                     <SimpleOwnerSwipeCard profile={toCardProfile(nextCard)} onSwipe={() => {}} isTop={false} fullScreen={true} />
                  </div>
                )}
                <div 
                  key={topCard.user_id}
                  className="absolute inset-0 z-20"
                >
                  {/* FULL-SCREEN SWIPE CARD */}
                  <div className="w-full h-full relative group">
                    <SimpleOwnerSwipeCard
                      ref={cardRef}
                      profile={toCardProfile(topCard)}
                      onSwipe={handleSwipe}
                      onDetails={() => setShowDetails(true)}
                      onInsights={() => setShowDetails(true)}
                      isTop
                      fullScreen={true}
                    />

                    {/* OVERLAY: COMPATIBILITY BADGE — top-right, below header */}
                    <div className="absolute top-[calc(var(--safe-top)+72px)] right-4 z-30 pointer-events-none">
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="px-4 py-2 rounded-2xl bg-black/50 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-2"
                       >
                         <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                         <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">{(topCard as any).compatibility ?? 85}%</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                       </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── ACTION OVERLAY ── */}
      <motion.div 
        animate={{ y: uiVisible ? 0 : 150 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="absolute bottom-0 left-0 right-0 z-[100]"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom, 0px))' }}
      >
        {/* Gradient scrim so buttons are readable against any photo */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />
        <SwipeActionButtonBar
          onLike={handleLike}
          onDislike={handleDislike}
          onShare={() => triggerHaptic('light')}
          onUndo={handleUndo}
          onMessage={() => { triggerHaptic('light'); navigate('/messages'); }}
          canUndo={canUndo}
          className="relative"
        />
      </motion.div>

      {/* ── PROFILE DETAILS OVERLAY (MODERN FULL-PAGE TRANSITION) ── */}
      <AnimatePresence>
        {showDetails && topCard && (
          <motion.div
            initial={{ y: '100dvh' }}
            animate={{ y: 0 }}
            exit={{ y: '100dvh' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            onScroll={handleScroll}
            className={cn(
              "fixed inset-0 z-[200] overflow-y-auto no-scrollbar",
              isLight ? "bg-white" : "bg-[#0A0A0B]"
            )}
          >
            {/* HERO SECTION */}
            <div className="relative h-[65dvh] w-full">
               <img src={topCard.profile_images[0]} className="w-full h-full object-cover" alt={topCard.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent" />
               <motion.button 
                 onClick={() => setShowDetails(false)}
                 whileTap={{ scale: 0.9 }}
                 className="absolute top-[var(--safe-top)] left-6 w-11 h-11 rounded-[1.25rem] bg-black/40 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white z-50"
               >
                 <X className="w-5 h-5" />
               </motion.button>
               
               <div className="absolute bottom-10 left-8 right-8">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-3">
                       <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{topCard.name}</h2>
                       <span className="text-3xl font-bold text-white/40">{topCard.age}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 w-fit">
                       <ShieldCheck className="w-3 h-3 text-emerald-400" />
                       <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Verified Human</span>
                    </div>
                  </motion.div>
               </div>
            </div>

            {/* CONTENT SECTION */}
            <div className="px-8 pt-8 pb-32 space-y-12">
               {/* STATS GRID */}
               <div className="grid grid-cols-2 gap-4">
                   <InfoPill icon={MapPin} label="Vibe Location" value={topCard.city ?? ''} />
                   <InfoPill icon={Briefcase} label="Hustle" value={(topCard as any).work_schedule ?? ''} />
                   <InfoPill icon={Clock} label="Noise" value={(topCard as any).noise_tolerance ?? ''} />
                   <InfoPill icon={Sparkles} label="Purity" value={(topCard as any).cleanliness_level ?? ''} />
               </div>

               {/* BIO */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Manifesto</h3>
                  <p className={cn("text-lg font-bold leading-snug", isLight ? "text-slate-900" : "text-white/90")}>
                    {(topCard as any).bio}
                  </p>
               </div>

               {/* TAGS */}
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Frequency Alignment</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {((topCard as any).personality_traits || []).map((tag: string) => (
                      <span key={tag} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-white/70">
                        {tag}
                      </span>
                    ))}
                    {topCard.interests.map(tag => (
                      <span key={tag} className="px-5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-widest text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>

               {/* LANGUAGES */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Languages</h3>
                  <div className="flex items-center gap-4">
                    {(topCard.languages || []).map((lang: string) => (
                      <div key={lang} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        <span className="text-sm font-bold text-white/80">{lang}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* STICKY BOTTOM ACTIONS */}
            <div className="fixed bottom-0 left-0 right-0 p-8 pt-12 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent z-[210] pointer-events-none">
               <div className="max-w-md mx-auto flex gap-4 pointer-events-auto">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleSwipe('left'); setShowDetails(false); }}
                    className="flex-1 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-white/40 font-black uppercase tracking-widest text-[10px]"
                  >
                    Not my vibe
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleSwipe('right'); setShowDetails(false); }}
                    className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black uppercase tracking-[0.25em] text-[10px] shadow-2xl shadow-primary/20"
                  >
                    Send Connection
                  </motion.button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FILTER SHEET (FULL GLASS) ── */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[300]" />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn("fixed bottom-0 left-0 right-0 z-[301] rounded-t-[3.5rem] border-t p-8 pb-[calc(2.5rem+var(--safe-bottom))]", isLight ? "bg-white border-slate-200" : "bg-zinc-900 border-white/10")}
            >
              <div className="w-14 h-1.5 bg-white/10 rounded-full mx-auto mb-10" />
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Vibe Filter</h3>
                <button onClick={() => setShowFilters(false)} className="w-12 h-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center border border-white/10"><X className="w-5 h-5 text-white" /></button>
              </div>
              
              <div className="space-y-12 mb-12">
                 <FilterGroup label="Alignment Preference" options={['Any', 'Female', 'Male', 'Non-binary']} selected="Any" setSelected={() => {}} />
                 <FilterGroup label="Work Flow" options={['Any', 'Remote', 'Creative', 'Hustle', 'Slow']} selected="Any" setSelected={() => {}} />
              </div>
              
              <motion.button 
                whileTap={{ scale: 0.97 }} 
                onClick={() => setShowFilters(false)} 
                className="w-full py-5 rounded-[2rem] bg-primary text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30"
              >
                Manifest Results
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ELEMENTS ─────────────────────────────────────────────────────────────────

function InfoPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-colors group">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
      </div>
      <p className="text-sm font-black text-white italic tracking-tight">{value}</p>
    </div>
  );
}

function FilterGroup({ label, options, selected, setSelected }: { label: string; options: string[]; selected: string; setSelected: (v: string) => void; }) {
  return (
    <div>
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-6">{label}</p>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <motion.button 
            key={opt} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => { triggerHaptic('light'); setSelected(opt); }} 
            className={cn(
              "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border transition-all", 
              selected === opt 
                ? "bg-primary text-white border-primary shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)] scale-105" 
                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
            )}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
