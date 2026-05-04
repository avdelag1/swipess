import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, MapPin, Briefcase, Clock, Sparkles, X, 
  ArrowLeft, Settings2, ShieldCheck, Zap,
  MessageCircle, Eye, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useActiveMode } from '@/hooks/useActiveMode';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { RoommateFiltersSheet } from '@/components/filters/RoommateFiltersSheet';
import { MessageConfirmationDialog } from '@/components/MessageConfirmationDialog';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';

const InfoPill = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => {
  const { isLight } = useAppTheme();
  return (
    <div className={cn(
      "p-4 rounded-3xl border backdrop-blur-xl space-y-1.5 transition-all",
      isLight ? "bg-white border-slate-200 shadow-md" : "bg-white/5 border-white/10"
    )}>
      <div className="flex items-center gap-2 text-primary">
        <Icon size={14} className="opacity-80" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{label}</span>
      </div>
      <div className={cn("text-xs font-black uppercase tracking-tight", isLight ? "text-slate-900" : "text-white")}>{value || 'Not set'}</div>
    </div>
  );
};

export default function RoommateMatching() {
  const navigate = useNavigate();
  const { isLight } = useAppTheme();
  const { activeMode } = useActiveMode();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [showFilters, setShowFilters] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<any>({
    gender: 'any',
    budgetRange: [500, 3000],
    ageRange: [18, 50],
    cleanliness: 'any',
    noise: 'any'
  });

  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);
  const { data: profiles = [], isLoading } = useSmartClientMatching(user?.id, 'roommates', 0, 50, false, currentFilters);
  
  const topCard = profiles[currentIndex];
  const nextCard = profiles[currentIndex + 1];
  const canUndo = currentIndex > 0;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    setCurrentIndex(prev => prev + 1);
    if (direction === 'right') {
       triggerHaptic('success');
    } else {
       triggerHaptic('warning');
    }
  }, []);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
      triggerHaptic('light');
    }
  }, [canUndo]);

  const handleLike = () => cardRef.current?.triggerSwipe('right');
  const handleDislike = () => cardRef.current?.triggerSwipe('left');
  
  const handleScroll = (e: any) => {
    const scroll = e.target.scrollTop;
    if (scroll > 50 && uiVisible) setUiVisible(false);
    if (scroll <= 50 && !uiVisible) setUiVisible(true);
  };

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col transition-colors duration-500 overflow-hidden",
      isLight ? "bg-[#F8FAFC]" : "bg-[#0A0A0B]"
    )}>
      <AtmosphericLayer variant="nexus" />

      {/* ── IMMERSIVE CONTROLS ── */}
      <div className="fixed top-[calc(var(--top-bar-height,72px)+12px)] inset-x-6 z-[60] flex justify-between items-center pointer-events-none">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/${activeMode}/dashboard`)}
          className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white pointer-events-auto shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        
        <div className="flex gap-2 pointer-events-auto">
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
        </div>
      </div>

      {/* ── CARD STACK AREA ── */}
      <div
        className="absolute left-0 right-0 bottom-0 w-full z-[1]"
        style={{ top: 'calc(var(--top-bar-height,72px) + var(--safe-top,12px))' }}
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
                    <div className="absolute bottom-12 left-10 right-10 space-y-4">
                       <div className="h-8 bg-muted/20 rounded-full animate-pulse w-1/2" />
                       <div className="h-4 bg-muted/20 rounded-full animate-pulse" />
                       <div className="h-4 bg-muted/20 rounded-full animate-pulse w-2/3" />
                    </div>
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
                     <SimpleOwnerSwipeCard profile={nextCard as any} onSwipe={() => {}} isTop={false} />
                  </div>
                )}
                <div 
                  key={topCard.user_id}
                  className="absolute inset-0 z-20"
                >
                  <div className="w-full h-full relative group">
                    <SimpleOwnerSwipeCard
                      ref={cardRef}
                      profile={topCard as any}
                      onSwipe={handleSwipe}
                      onTap={() => setShowDetails(true)}
                      isTop
                    />

                    {/* COMPATIBILITY BADGE */}
                    <div 
                      className="absolute right-4 z-30 pointer-events-none transform-gpu"
                      style={{ top: 'calc(var(--top-bar-height,72px) + var(--safe-top,12px) + 80px)' }}
                    >
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 shadow-lg flex items-center gap-2"
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
        style={{ paddingBottom: 'calc(7rem + var(--safe-bottom, 0px))' }}
      >
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/75 via-black/35 to-transparent pointer-events-none" />
        <SwipeActionButtonBar
          onLike={handleLike}
          onDislike={handleDislike}
          onUndo={handleUndo}
          onMessage={() => { triggerHaptic('light'); setMessageDialogOpen(true); }}
          canUndo={canUndo}
          className="relative"
        />
      </motion.div>

      {/* ── PROFILE DETAILS OVERLAY ── */}
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
               <img src={topCard.profile_images?.[0]} className="w-full h-full object-cover" alt={topCard.name} />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent" />
               <motion.button 
                 onClick={() => setShowDetails(false)}
                 whileTap={{ scale: 0.9 }}
                 className="absolute top-[var(--safe-top)] left-6 w-11 h-11 rounded-[1.25rem] bg-black/40 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white z-50"
               >
                 <X className="w-5 h-5" />
               </motion.button>
               
               <div className="absolute bottom-10 left-8 right-8">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-2">
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
               <div className="grid grid-cols-2 gap-4">
                   <InfoPill icon={MapPin} label="Vibe Location" value={topCard.city ?? ''} />
                   <InfoPill icon={Briefcase} label="Hustle" value={(topCard as any).work_schedule ?? ''} />
                   <InfoPill icon={Clock} label="Noise" value={(topCard as any).noise_tolerance ?? ''} />
                   <InfoPill icon={Sparkles} label="Purity" value={(topCard as any).cleanliness_level ?? ''} />
               </div>

               <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">About</h3>
                  <p className={cn("text-base leading-relaxed", isLight ? "text-slate-800" : "text-white/90")}>
                    {(topCard as any).bio}
                  </p>
               </div>

               <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Personality & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {((topCard as any).personality_traits || []).map((tag: string) => (
                      <span key={tag} className={cn("px-3.5 py-1.5 rounded-xl border text-xs font-medium", isLight ? "bg-secondary border-border/40 text-foreground/80" : "bg-white/5 border-white/10 text-white/80")}>
                        {tag}
                      </span>
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
    </div>
  );
}
