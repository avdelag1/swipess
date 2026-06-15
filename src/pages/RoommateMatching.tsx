import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { AnimatePresence, motion } from 'framer-motion';
import { NativeStore } from '@/utils/nativeStore';
import {
  _ArrowLeft, _MessageCircle, _Settings2, Briefcase, Clock, Eye,
  EyeOff, MapPin, ShieldCheck,
  Sparkles, Users, X, Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from '@/components/SimpleOwnerSwipeCard';
// import { } from '@/components/SwipeActionButtonBar';
import { RoommateFiltersSheet } from '@/components/filters/RoommateFiltersSheet';
const MessageConfirmationDialog = lazyWithRetry(() => import('@/components/MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
// import { } from '@/integrations/supabase/client';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { useFilterActions } from '@/state/filterStore';
import { MatchOverlay } from '@/components/native/MatchOverlay';
import { triggerMatchConfetti } from '@/utils/celebration';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useStartConversation } from '@/hooks/useConversations';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { guardNewConversation, handleStartConversationError } from '@/utils/messagingQuotaUX';
import { useNavigate } from 'react-router-dom';
import { appToast } from '@/utils/appNotification';
import { useChromeReveal } from '@/hooks/useChromeReveal';
import { useModalStore } from '@/state/modalStore';

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
  const { isLight } = useAppTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setActiveCategory } = useFilterActions();

  // Set category on mount to hide global artifacts like microphone
  useEffect(() => {
    setActiveCategory('roommates' as any);
    return () => setActiveCategory(null);
  }, [setActiveCategory]);

  const { showFilters, setModal } = useModalStore();
  const { isChromeVisible } = useChromeReveal();
  const [showDetails, setShowDetails] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [roommateVisible, setRoommateVisible] = useState(true);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const navigate = useNavigate();
  const startConversation = useStartConversation();
  const { canStartNewConversation } = useMessagingQuota();
  
  // ðŸ¥‚ CELEBRATION STATE
  const [showMatch, setShowMatch] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<any>(null);

  const [currentFilters, setCurrentFilters] = useState<any>({
    gender: 'any',
    budgetRange: [500, 3000],
    ageRange: [18, 50],
    cleanliness: 'any',
    noise: 'any'
  });

  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);
  const { data: profiles = [], isLoading } = useSmartClientMatching(user?.id, 'all-clients' as any, 0, 50, false, currentFilters, false, true);
  
  const { mutate: performSwipe } = useSwipeWithMatch({
    onMatch: (client, owner) => {
      // client is the one we swiped on, or us? 
      // detectAndCreateMatch pass (clientProfile, ownerProfile)
      // If we are owner, client is target. If we are client, client is us.
      setMatchedProfile(client.user_id === user?.id ? owner : client);
      setShowMatch(true);
      triggerMatchConfetti();
      triggerHaptic('success');
    }
  });

  const topCard = profiles[currentIndex];
  const nextCard = profiles[currentIndex + 1];
  const canUndo = currentIndex > 0;


  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const target = profiles[currentIndex];
    setCurrentIndex(prev => {
      const next = prev + 1;
      // Request review on the 5th swipe to ensure positive sentiment
      if (next === 5) {
        NativeStore.requestReview();
      }
      return next;
    });
    
    if (target) {
      performSwipe({
        targetId: target.user_id,
        direction,
        targetType: 'profile'
      });
    }

    if (direction === 'right') {
       triggerHaptic('success');
    } else {
       triggerHaptic('warning');
    }
  }, [profiles, currentIndex, performSwipe]);

  const _handleUndo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
      triggerHaptic('light');
    }
  }, [canUndo]);

  const _handleLike = () => cardRef.current?.triggerSwipe('right');
  const _handleDislike = () => cardRef.current?.triggerSwipe('left');

  const handleSendMessage = async (message: string) => {
    if (!topCard?.user_id) {
      appToast.error('No profile selected', 'Try again with a different card');
      return;
    }
    if (topCard.user_id === user?.id) {
      appToast.error('Cannot message yourself', undefined);
      return;
    }
    if (!user?.id) {
      navigate('/');
      return;
    }
    if (!guardNewConversation(canStartNewConversation)) return;

    setIsStartingConversation(true);
    try {
      const result = await startConversation.mutateAsync({
        otherUserId: topCard.user_id,
        initialMessage: message,
        canStartNewConversation,
      });
      if (result?.conversationId) {
        setMessageDialogOpen(false);
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      handleStartConversationError(err, 'Error');
    } finally {
      setIsStartingConversation(false);
    }
  };

  // handleScroll removed as uiVisible was removed

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col transition-colors duration-500 overflow-hidden",
      isLight ? "bg-[#F8FAFC]" : "bg-[#0A0A0B]"
    )}>
      <AtmosphericLayer variant="Swipes" />

      {/* ── IMMERSIVE CONTROLS (Removed, inherited from AppLayout) ── */}

      {/* ── CARD STACK AREA ── */}
      <div
        className="absolute left-0 right-0 bottom-0 top-0 w-full z-[1]"
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
                    "bg-card border-border/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.45)]"
                  )}>
                    <Users className="w-14 h-14 text-primary" strokeWidth={1} />
                  </div>
                </div>
                <div className="space-y-3 max-w-lg">
                  <h2 className="text-[22px] md:text-2xl font-semibold leading-snug tracking-tight text-foreground">
                    {t('roommates.noMoreMatches')}
                  </h2>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    Everyone has been matched. Check back later for new arrivals.
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentIndex(0)}
                  className="px-10 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold tracking-tight text-sm shadow-[0_20px_40px_-20px_hsl(var(--primary)/0.55)] transition-transform duration-150 active:scale-95"
                >
                  Find more
                </motion.button>
              </motion.div>
            ) : (
              <div className="absolute inset-0">
                {nextCard && (
                  <div className="absolute inset-0 z-10 opacity-40 scale-[0.98] translate-y-2 pointer-events-none">
                     <SimpleOwnerSwipeCard profile={nextCard as any} onSwipe={() => {}} isTop={false} fullScreen={true} />
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
                      onBack={() => navigate(-1)}
                      isTop
                      fullScreen={true}
                    />

                    {/* COMPATIBILITY BADGE */}
                    <div 
                      className="absolute right-4 z-30 pointer-events-none transform-gpu"
                      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}
                    >
                       <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 shadow-lg flex items-center gap-2"
                       >
                         <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                         <span className="text-xs font-semibold text-white tabular-nums">{(topCard as any).compatibility ?? 85}% match</span>
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

      {/* ── FLOATING PILL FOR ROOMMATE VISIBILITY & PROMOTE ── */}
      <motion.div 
        animate={{ y: isChromeVisible ? 0 : 150, opacity: isChromeVisible ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="fixed bottom-[calc(var(--bottom-nav-height)+24px)] left-0 right-0 z-[45] pointer-events-none flex justify-center"
      >
        <div className="flex items-center gap-1 pointer-events-auto rounded-full p-1.5 border shadow-2xl bg-background/80 border-border/40" style={{ backdropFilter: 'blur(24px) saturate(1.8)' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('light'); setRoommateVisible(!roommateVisible); }}
            className={cn(
              "px-5 h-12 rounded-full border flex items-center gap-2.5 transition-all duration-300 ease-out active:scale-95 shadow-lg",
              roommateVisible
                ? "bg-primary border-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/0.3)]"
                : "bg-secondary/80 border-border text-muted-foreground hover:bg-secondary"
            )}
          >
            {roommateVisible
              ? <Eye className="w-4 h-4 shrink-0" />
              : <EyeOff className="w-4 h-4 shrink-0" />
            }
            <span className="text-[12px] font-black uppercase tracking-widest">
              {roommateVisible ? 'Visible' : 'Hidden'}
            </span>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic('medium'); appToast.success('Promote Activated', 'Your profile is now boosted for 30 minutes.'); }}
            className="px-5 h-12 rounded-full flex items-center gap-2.5 border transition-all duration-300 ease-out active:scale-95 bg-secondary/80 border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
          >
            <Zap className="w-4 h-4 text-[#FF3D00]" />
            <span className="text-[12px] font-black uppercase tracking-widest text-foreground">Promote</span>
          </motion.button>
        </div>
      </motion.div>

      {/* â”€â”€ PROFILE DETAILS OVERLAY â”€â”€ */}
      <AnimatePresence>
        {showDetails && topCard && (
          <motion.div
            initial={{ y: '100dvh' }}
            animate={{ y: 0 }}
            exit={{ y: '100dvh' }}
            transition={{ type: 'spring', damping: 32, stiffness: 280 }}
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
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 w-fit">
                       <ShieldCheck className="w-3 h-3 text-emerald-400" />
                       <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Verified Human</span>
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
                  <p className={cn("text-base leading-relaxed", isLight ? "text-black/80" : "text-white/90")}>
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
            <div className="fixed bottom-0 left-0 right-0 pt-12 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B] to-transparent z-[210] pointer-events-none" style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
               <div className="max-w-7xl mx-auto flex gap-4 pointer-events-auto">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { handleSwipe('left'); setShowDetails(false); }}
                    className="flex-1 py-4 rounded-2xl bg-secondary border border-border text-foreground font-black uppercase tracking-widest text-[10px]"
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
        onClose={() => setModal('showFilters', false)}
        currentFilters={currentFilters}
        onApply={(f) => {
          setCurrentFilters(f);
          setModal('showFilters', false);
          triggerHaptic('success');
        }}
      />
      <MatchOverlay 
        isOpen={showMatch} 
        profile={matchedProfile} 
        onClose={() => setShowMatch(false)} 
      />
      <Suspense fallback={null}><MessageConfirmationDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={topCard?.name || (topCard as any)?.full_name || 'this roommate'}
        isLoading={isStartingConversation}
      /></Suspense>
    </div>
  );
}
