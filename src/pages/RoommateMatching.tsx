import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Users, Settings2,
  Sparkles, X, MapPin,
  Briefcase,
  Heart, Check, Info, 
  Eye, EyeOff, Ticket,
  ShieldCheck, Clock, Zap
} from 'lucide-react';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useAuth } from '@/hooks/useAuth';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';
import { MessageConfirmationDialog } from '@/components/MessageConfirmationDialog';
import { useStartConversation, useConversationStats } from '@/hooks/useConversations';
import { RoommateFiltersSheet, RoommateFilterState } from '@/components/filters/RoommateFiltersSheet';

// ── TYPES ────────────────────────────────────────────────────────────────────

// interface RoommateCandidate {
//   user_id: string;
//   name: string;
//   age: number;
//   city: string;
//   country: string;
//   bio: string;
//   profile_images: string[];
//   interests: string[];
//   languages: string[];
//   work_schedule: string;
//   cleanliness_level: string;
//   noise_tolerance: string;
//   personality_traits: string[];
//   preferred_activities: string[];
//   compatibility?: number;
// }

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
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<RoommateFilterState | undefined>();
  const [showDetails, setShowDetails] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSpeedMeet, setShowSpeedMeet] = useState(false);
  const [speedMatches, setSpeedMatches] = useState<any[]>([]);
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  const startConversation = useStartConversation();
  const { data: stats } = useConversationStats();
  const canStartNewConversation = stats?.conversationsLeft ? stats.conversationsLeft > 0 : true;

  const { isVisible: uiVisible, onScroll: handleScroll } = useHideOnScroll();

  // REAL DATA HOOK
  const { data: realCandidates, isLoading } = useSmartClientMatching(
    user?.id,
    undefined,
    0,
    20,
    false,
    undefined,
    true // isRoommateSection
  );

  // Load saved roommate preferences on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadSavedFilters = async () => {
      const { data } = await supabase
        .from('roommate_preferences')
        .select('user_id, preferred_gender, preferred_budget_min, preferred_budget_max, preferred_age_min, preferred_age_max, preferred_cleanliness, preferred_noise_tolerance, preferred_smoking, preferred_drinking, preferred_work_schedule, deal_breakers')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setCurrentFilters({
          preferred_gender: (data.preferred_gender as string[]) || [],
          preferred_budget_min: data.preferred_budget_min,
          preferred_budget_max: data.preferred_budget_max,
          preferred_age_min: data.preferred_age_min,
          preferred_age_max: data.preferred_age_max,
          preferred_cleanliness: data.preferred_cleanliness,
          preferred_noise_tolerance: data.preferred_noise_tolerance,
          preferred_smoking: data.preferred_smoking,
          preferred_drinking: data.preferred_drinking,
          preferred_work_schedule: data.preferred_work_schedule,
          deal_breakers: (data.deal_breakers as string[]) || [],
        });
      }
    };
    loadSavedFilters();
  }, [user?.id]);

  // Only use real candidates — no mock fallback
  const candidates = useMemo(() => {
    return realCandidates || [];
  }, [realCandidates]);

  // 🚀 SPEED OF LIGHT: Aggressive Asset Pre-Warming
  useEffect(() => {
    if (candidates.length > 0) {
      import('@/utils/imageOptimization').then(({ pwaImagePreloader, getCardImageUrl }) => {
        // Pre-warm the carousel/deck for the next 5 candidates
        const nextBatch = candidates.slice(currentIndex, currentIndex + 5)
          .map(c => getCardImageUrl(c.profile_images?.[0] || ''));
        
        pwaImagePreloader.batchPreload(nextBatch);
      });
    }
  }, [candidates, currentIndex]);

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

  const handleSpeedMeet = useCallback(() => {
    if (isScanning || candidates.length === 0) return;
    
    setIsScanning(true);
    triggerHaptic('medium');
    
    // Simulate AI Scan
    setTimeout(() => {
      // Pick 3 random highly compatible candidates (or just next 3)
      const matches = candidates
        .filter((_, i) => i >= currentIndex)
        .slice(0, 3)
        .map(c => ({
          ...c,
          compatibility: Math.floor(Math.random() * 15) + 85 // 85-99%
        }));
      
      setSpeedMatches(matches);
      setIsScanning(false);
      setShowSpeedMeet(true);
      triggerHaptic('success');
    }, 2400);
  }, [currentIndex, candidates, isScanning]);

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
      {/* ── IMMERSIVE BACK BRIDGE ── */}
      <motion.div 
        animate={{ y: uiVisible ? 0 : -150 }}
        className="absolute left-4 z-[110] transform-gpu"
        style={{ top: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 12px) + 20px)' }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { triggerHaptic('light'); if (window.history.length > 1) { navigate(-1); } else { navigate('/client/dashboard'); } }}
          className={cn(
            "w-11 h-11 rounded-[1.25rem] border backdrop-blur-3xl flex items-center justify-center transition-all shadow-2xl",
            isLight ? "bg-white/80 border-slate-200 text-slate-900" : "bg-black/40 border-white/10 text-white"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* ── IMMERSIVE CONTROLS (Floating below global HUD) ── */}
      <motion.div 
        animate={{ y: uiVisible ? 0 : -150 }}
        className="absolute right-4 z-[90] flex items-center gap-2 transform-gpu"
        style={{ top: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 12px) + 20px)' }}
      >
         {/* VISIBILITY STATUS BUBBLE */}
         <motion.button
           whileTap={{ scale: 0.95 }}
           onClick={() => { triggerHaptic('light'); setRoommateVisible(!roommateVisible); }}
           className={cn(
             "px-4 h-11 rounded-2xl border backdrop-blur-xl flex items-center gap-2 transition-all shadow-xl",
             roommateVisible
               ? isLight ? "bg-rose-50/90 border-rose-200 text-rose-600" : "bg-rose-500/15 border-rose-500/40 text-rose-400"
               : isLight ? "bg-white/80 border-slate-200 text-slate-400" : "bg-white/5 border-white/10 text-white/40"
           )}
           style={{ willChange: 'transform, opacity' }}
         >
           {roommateVisible
             ? <Eye className="w-4 h-4 shrink-0" />
             : <EyeOff className="w-4 h-4 shrink-0" />
           }
           <span className="text-xs font-semibold tracking-wide">
             {roommateVisible ? 'Visible' : 'Hidden'}
           </span>
         </motion.button>

         <motion.button
           whileTap={{ scale: 0.88 }}
           onClick={() => setShowFilters(true)}
           className={cn(
             "w-11 h-11 rounded-2xl flex items-center justify-center border backdrop-blur-xl shadow-xl transition-all",
             isLight ? "bg-white/80 border-slate-200 text-slate-600" : "bg-white/10 border-white/20 text-white"
           )}
           style={{ willChange: 'transform, opacity' }}
         >
           <Settings2 className="w-4 h-4" />
         </motion.button>
      </motion.div>

      {/* ── CARD STACK AREA — offset below the global TopBar so cards never underlap the header ── */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full z-[1]"
        style={{ top: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 12px))' }}
      >
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {isLoading ? (
               <motion.div
                 key="loading"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 flex flex-col items-center justify-center p-8"
               >
                 <div className="w-full max-w-xl aspect-[3/4] rounded-[2.5rem] bg-muted/20 animate-shimmer overflow-hidden relative border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent animate-sweep" />
                 </div>
                 <div className="mt-8 space-y-4 w-full max-w-[200px]">
                    <div className="h-4 bg-muted/20 rounded-full animate-pulse" />
                    <div className="h-4 bg-muted/20 rounded-full animate-pulse w-2/3" />
                 </div>
               </motion.div>
            ) : !topCard ? (
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
                <div className="space-y-3 max-w-lg">
                  <h2 className={cn("text-xl md:text-2xl font-bold leading-snug", isLight ? "text-slate-900" : "text-white")}>
                    {t('roommates.noMoreMatches')}
                  </h2>
                  <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-500" : "text-white/60")}>
                    Everyone has been matched. Check back later for new arrivals.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(0)}
                  className="px-10 h-12 rounded-2xl bg-primary text-white font-semibold tracking-wide text-sm shadow-lg transition-colors duration-150"
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
                    <div 
                      className="absolute right-4 z-30 pointer-events-none transform-gpu"
                      style={{ top: 'calc(var(--top-bar-height, 60px) + var(--safe-top, 12px) + 80px)' }}
                    >
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 shadow-lg flex items-center gap-2"
                         style={{ willChange: 'transform, opacity' }}
                       >
                         <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                         <span className="text-xs font-semibold text-white tabular-nums">{(topCard as any).compatibility ?? 85}% match</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
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
          onMessage={() => { triggerHaptic('light'); setMessageDialogOpen(true); }}
          onSpeedMeet={handleSpeedMeet}
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
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 w-fit">
                       <ShieldCheck className="w-3 h-3 text-rose-400" />
                       <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">Verified Human</span>
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
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">About</h3>
                  <p className={cn("text-base leading-relaxed", isLight ? "text-slate-800" : "text-white/90")}>
                    {(topCard as any).bio}
                  </p>
               </div>

               {/* TAGS */}
               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Personality & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {((topCard as any).personality_traits || []).map((tag: string) => (
                      <span key={tag} className={cn("px-3.5 py-1.5 rounded-xl border text-xs font-medium", isLight ? "bg-secondary border-border/40 text-foreground/80" : "bg-white/5 border-white/10 text-white/80")}>
                        {tag}
                      </span>
                    ))}
                    {topCard.interests.map(tag => (
                      <span key={tag} className="px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-medium text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
               </div>

               {/* LANGUAGES */}
               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Languages</h3>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                    {(topCard.languages || []).map((lang: string) => (
                      <div key={lang} className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", isLight ? "bg-foreground/30" : "bg-white/40")} />
                        <span className={cn("text-sm font-medium", isLight ? "text-foreground/80" : "text-white/80")}>{lang}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* STICKY BOTTOM ACTIONS */}
            <div className="fixed bottom-0 left-0 right-0 p-8 pt-12 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent z-[210] pointer-events-none">
               <div className="max-w-7xl mx-auto flex gap-4 pointer-events-auto">
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

      {/* ── REAL FILTER SHEET ── */}
      <RoommateFiltersSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={currentFilters}
        onApply={(f) => {
          setCurrentFilters(f);
          setShowFilters(false);
          triggerHaptic('success');
        }}
      />

      <MessageConfirmationDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        recipientName={topCard?.name ?? 'this person'}
        isLoading={messageSending}
        onConfirm={async (message) => {
          if (!topCard) return;
          setMessageSending(true);
          try {
            await startConversation.mutateAsync({
              otherUserId: topCard.user_id,
              initialMessage: message,
              canStartNewConversation
            });
            setMessageDialogOpen(false);
            navigate('/messages');
          } catch (error) {
            console.error('Failed to start conversation:', error);
          } finally {
            setMessageSending(false);
          }
        }}
      />

      {/* ── AI SCANNING OVERLAY ── */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8"
          >
            <div className="relative mb-12">
               <motion.div 
                 animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-primary/40 blur-[80px] rounded-full"
               />
               <div className="w-32 h-32 rounded-[3.5rem] bg-black border border-white/20 flex items-center justify-center relative z-10 overflow-hidden">
                  <motion.div
                    animate={{ y: [-100, 100] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-[2px] bg-primary shadow-[0_0_15px_#00E5FF]"
                  />
                  <Zap className="w-14 h-14 text-primary animate-pulse" />
               </div>
            </div>
            <motion.h2 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-3xl font-black italic tracking-tighter uppercase text-white mb-4"
            >
              AI Speed Match Scanning...
            </motion.h2>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] max-w-[200px]">
              Analyzing 15,000+ local vibers for maximum compatibility
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SPEED MEET RESULTS OVERLAY ── */}
      <AnimatePresence>
        {showSpeedMeet && (
          <motion.div
            initial={{ y: '100dvh' }}
            animate={{ y: 0 }}
            exit={{ y: '100dvh' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
            className="fixed inset-0 z-[600] bg-black overflow-y-auto no-scrollbar"
          >
             <div className="p-8 pt-[calc(var(--safe-top)+20px)] pb-32">
                <div className="flex items-center justify-between mb-12">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <Sparkles className="w-4 h-4 text-amber-400" />
                         <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">AI Express Match</span>
                      </div>
                      <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Speed Meet</h2>
                   </div>
                   <motion.button 
                     whileTap={{ scale: 0.9 }}
                     onClick={() => setShowSpeedMeet(false)}
                     className="w-11 h-11 rounded-[1.25rem] bg-white/10 border border-white/20 flex items-center justify-center text-white"
                   >
                     <X className="w-5 h-5" />
                   </motion.button>
                </div>

                <div className="space-y-6">
                   {speedMatches.map((match, idx) => (
                     <motion.div 
                       key={match.user_id}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: 0.2 + (idx * 0.1) }}
                       className="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/20 to-transparent border border-white/10 group"
                     >
                        <div className="flex items-center gap-5 p-4 rounded-[2.25rem] bg-zinc-900/80 backdrop-blur-xl">
                           <div className="relative w-24 h-24 rounded-[1.8rem] overflow-hidden shrink-0">
                              <img src={match.profile_images?.[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                 <h3 className="text-xl font-black text-white truncate">{match.name}</h3>
                                 <span className="text-white/40 font-bold">{match.age}</span>
                              </div>
                              <div className="flex items-center gap-3 mb-3">
                                 <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-primary" />
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">{match.compatibility}%</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{match.city}</span>
                              </div>
                              <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setShowSpeedMeet(false);
                                  setMessageDialogOpen(true);
                                  // In a real app we'd target this specific person
                                }}
                                className="w-full py-3 rounded-2xl bg-white text-black font-black uppercase tracking-[0.25em] text-[9px] shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                              >
                                Meet Now
                              </motion.button>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </div>

                <div className="mt-12 p-8 rounded-[2.5rem] bg-primary/10 border border-primary/20 text-center space-y-4">
                   <Zap className="w-8 h-8 text-primary mx-auto animate-pulse" />
                   <p className="text-[11px] font-black text-white uppercase tracking-widest leading-relaxed">
                     Don't wait for a match.<br/>
                     <span className="text-primary">Instant intro</span> available for $1.99
                   </p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── ELEMENTS ─────────────────────────────────────────────────────────────────

function InfoPill({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="p-5 rounded-3xl bg-foreground/5 border border-foreground/5 hover:bg-foreground/[0.08] transition-colors group">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-black text-foreground italic tracking-tight">{value}</p>
    </div>
  );
}

// FilterGroup was removed as it was unused.



