import { PhotoPreview } from "@/components/PhotoPreview";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { Suspense, useCallback, useState } from "react";
import { lazyWithRetry } from '@/utils/lazyRetry';
import { useClientProfile } from "@/hooks/useClientProfile";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Camera,
  ChevronRight,
  Coins,
  Crown,
  LogOut,
  Megaphone,
  MessageSquare,
  Users,
  Settings,
  Sparkles,
  ThumbsUp,
  User,
  Zap,
} from 'lucide-react';
import { PromoCodeSection } from '@/components/PromoCodeSection';
import { FeedbackSection } from '@/components/FeedbackSection';
import { SeekerAdSection } from '@/components/SeekerAdSection';
import { DailyQuestBoard } from '@/components/quests/DailyQuestBoard';
import { useClientStats } from "@/hooks/useClientStats";
import { ActivityFeed } from "@/components/ActivityFeed";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { AmbientPageBackground } from "@/components/ui/AmbientPageBackground";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { LanguageToggle } from "@/components/LanguageToggle";
import useAppTheme from "@/hooks/useAppTheme";
import { useTranslation } from 'react-i18next';
import { HolographicIDCard } from "@/components/native/HolographicIDCard";
import { useModalStore } from "@/state/modalStore";

const ClientProfileDialog = lazyWithRetry(() => import('@/components/ClientProfileDialog').then(m => ({ default: m.ClientProfileDialog })));
const VapIdCardModal = lazyWithRetry(() => import('@/components/VapIdCardModal').then(m => ({ default: m.VapIdCardModal })));
const VapIdEditModal = lazyWithRetry(() => import('@/components/VapIdEditModal').then(m => ({ default: m.VapIdEditModal })));

const ClientProfile = () => {
  const { isLight } = useAppTheme();
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showVapCard, setShowVapCard] = useState(false);
  const [isVapModalOpen, setIsVapModalOpen] = useState(false);
  const { data: profile, isLoading, isError, refetch: refetchProfile } = useClientProfile();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: stats } = useClientStats();

  const handlePhotoClick = useCallback((index: number) => {
    setSelectedPhotoIndex(index);
    setShowPhotoPreview(true);
  }, []);

  const calculateCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 5;
    if (profile.name) completed++;
    if (profile.age) completed++;
    if (profile.bio) completed++;
    if (profile.profile_images?.length) completed++;
    if (profile.interests?.length) completed++;
    return Math.round((completed / total) * 100);
  };

  const completionPercent = calculateCompletion();

  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }

  if (isError && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-6">
        <p className="text-sm font-semibold text-muted-foreground text-center">Could not load your profile.</p>
        <Button onClick={() => refetchProfile()}>Try again</Button>
      </div>
    );
  }

  return (
    <AmbientPageBackground className={cn("w-full min-h-screen text-foreground")}>
      <div className="w-full max-w-7xl mx-auto p-6 pt-4 pb-12 space-y-10">

        {/* IDENTITY CORE */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-36 h-36 p-[3px] rounded-full shadow-neumorph"
              style={{
                background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
              }}
            >
              <div
                className={cn("w-full h-full overflow-hidden cursor-pointer flex items-center justify-center border", isLight ? "surface-2" : "bg-[#080C14] border-white/5")}
                style={{ borderRadius: '9999px' }}
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className={cn("w-14 h-14", isLight ? "text-slate-300" : "text-white/10")} />
                )}
              </div>
            </motion.div>

            <button
              onClick={() => { triggerHaptic('light'); setShowEditDialog(true); }}
              aria-label="Edit profile photo"
              className="absolute -bottom-3 -right-3 w-12 h-12 flex items-center justify-center shadow-neumorph transition-all active:shadow-neumorph-inset active:scale-90 z-20 rounded-[1.5rem] border border-white/10"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FF6B00)' }}
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-2">
            <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>
              {profile?.name || 'Identity'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className={cn("text-[10px] font-black uppercase tracking-[0.25em]", isLight ? "text-slate-500" : "text-white/25")}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* HUD STATS GRID */}
        <div className={cn("grid grid-cols-3 gap-3", isLight && "surface-section !p-4")}>
          {[
            { label: t('nav.likes'), value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-[#FF4D00]', glow: 'rgba(255,77,0,0.1)', path: '/client/who-liked-you' },
            { label: t('dashboard.totalMatches'), value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-[#EB4898]', glow: 'rgba(235,72,152,0.1)', path: '/client/liked-properties' },
            { label: t('nav.messages'), value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-orange-400', glow: 'rgba(251,146,60,0.1)', path: '/messages' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center justify-center p-5 text-center rounded-3xl cursor-pointer transition-all",
                isLight ? "surface-stat" : "border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
              )}
              style={isLight ? undefined : { boxShadow: `inset 0 0 30px ${stat.glow}` }}
              onClick={() => { triggerHaptic('light'); navigate(stat.path); }}
            >
              <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
              <div className={cn("text-3xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mt-2", isLight ? "text-slate-500" : "text-white/30")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* DAILY QUESTS GAMIFICATION */}
        <div className="w-full">
          <DailyQuestBoard />
        </div>

        {/* FEATURE HUB */}
        <div className={cn("space-y-3", isLight && "surface-section")}>
          {/* AI Profile — full-width hero button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { triggerHaptic('medium'); useModalStore.getState().openAIProfile('client'); }}
            className="w-full h-16 rounded-3xl flex items-center justify-center gap-3 text-white font-black uppercase italic tracking-[0.2em] text-[15px] shadow-neumorph active:shadow-neumorph-inset border-none relative overflow-hidden transition-shadow"
            style={{ background: 'linear-gradient(135deg, #06B6D4, #6366F1)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Magic AI Profile</span>
          </motion.button>

          {/* Grid of Feature Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Edit Profile */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)' }}
            >
              <User className="w-7 h-7 text-white" />
              <span>{t('profile.editProfile')}</span>
            </motion.button>

            {/* Promote */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #FF4D00, #FF8C00)' }}
            >
              <Megaphone className="w-7 h-7 text-white" />
              <span>{t('nav.promote')}</span>
            </motion.button>


            {/* Seekers */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); navigate('/explore/seekers'); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
            >
              <Users className="w-7 h-7 text-white" />
              <span>Seekers</span>
            </motion.button>

            {/* Tokens */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); useModalStore.getState().setModal('showTokensModal', true); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #10B981, #06B6D4)' }}
            >
              <Coins className="w-7 h-7 text-white" />
              <span>Tokens</span>
            </motion.button>

            {/* Settings */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); navigate('/client/settings'); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #64748B, #334155)' }}
            >
              <Settings className="w-7 h-7 text-white" />
              <span>{t('nav.settings')}</span>
            </motion.button>

            {/* Sign Out */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); signOut(); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px]", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #EF4444, #991B1B)' }}
            >
              <LogOut className="w-7 h-7 text-white" />
              <span>{t('actions.signOut')}</span>
            </motion.button>

            {/* Premium */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('medium'); navigate('/subscription/packages'); }}
              className={cn("w-full h-24 rounded-3xl flex flex-col items-center justify-center gap-2 border shadow-neumorph active:shadow-neumorph-inset transition-all text-white font-black uppercase italic tracking-[0.2em] text-[12px] md:text-[14px] col-span-2", isLight ? "bg-slate-900 border-white/20" : "bg-white/[0.08] border-white/10")}
              style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
            >
              <Crown className="w-7 h-7 text-white" />
              <span>Premium</span>
            </motion.button>
          </div>
        </div>

        {/* SHARE AND EARN */}
        <div className="p-[1.5px] rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,77,0,0.2), rgba(235,72,152,0.2))' }}>
          <div className={cn("rounded-3xl", isLight ? "surface-2" : "bg-[#020202]")}>
            <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Identity'} isClient={true} />
          </div>
        </div>

        {/* PROMO CODES */}
        <div className="mt-6 mb-6">
           {/* PromoCodeSection removed to comply with App Store Guideline 3.1.1 */}
        </div>

        {/* FEEDBACK & CONTACT ADMINS */}
        <div className={cn(
          "rounded-[2.5rem] overflow-hidden border shadow-2xl p-6",
          isLight ? "bg-white border-black/5" : "bg-card/40 border-white/5 backdrop-blur-xl"
        )}>
           <FeedbackSection />
        </div>

        {/* HOLOGRAPHIC IDENTITY VAULT */}
        <div className="relative cursor-pointer" role="button" aria-label="Open identity vault" tabIndex={0} onClick={() => { triggerHaptic('light'); setIsVapModalOpen(true); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { triggerHaptic('light'); setIsVapModalOpen(true); } }}>
          <HolographicIDCard profile={profile} />
          
          {/* External hint for edit */}
          <div className="absolute top-4 right-4 z-20">
            <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border", isLight ? "bg-white/60 border-slate-200" : "bg-white/5 border-white/10")}>
              <span className={cn("text-[8px] font-black uppercase tracking-widest", isLight ? "text-black/40" : "text-white/40")}>Sync Protocol</span>
              <ChevronRight className={cn("w-3 h-3", isLight ? "text-black/20" : "text-white/20")} />
            </div>
          </div>
        </div>

        {/* SEEKER AD SECTION (Tasker / Requests) */}
        <div className="mt-2 mb-2">
          <SeekerAdSection />
        </div>

        {/* PROFILE COMPLETION */}
        <AnimatePresence>
          {profile && completionPercent < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "rounded-3xl p-7 space-y-5",
                isLight ? "surface-2" : "border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl"
              )}
              style={isLight ? undefined : { boxShadow: 'inset 0 0 40px rgba(255,77,0,0.03)' }}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#EB4898]" />
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isLight ? "text-slate-500" : "text-white/35")}>{t('profile.completeness')}</span>
                </div>
                <span className={cn("text-2xl font-black italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>{completionPercent}%</span>
              </div>

              <div className={cn("h-3 w-full rounded-full overflow-hidden border", isLight ? "surface-inset" : "bg-white/[0.04] border-white/[0.06]")}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #FF4D00, #EB4898)',
                    boxShadow: '0 0 15px rgba(255,77,0,0.4)',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GLOBAL PULSE FEED */}
        <div className={cn("space-y-5", isLight && "surface-section")}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.35em]", isLight ? "text-slate-500" : "text-white/30")}>Global Activity</h3>
            </div>
            <Zap className="w-4 h-4 text-[#EB4898]/30" />
          </div>
          <ActivityFeed />
        </div>

        <div className="flex justify-center pt-4 pb-12">
          <LanguageToggle />
        </div>
      </div>

      <Suspense fallback={null}><ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} /></Suspense>
      <PhotoPreview photos={profile?.profile_images || []} isOpen={showPhotoPreview} onClose={() => setShowPhotoPreview(false)} initialIndex={selectedPhotoIndex} />
      <Suspense fallback={null}>
        <VapIdEditModal isOpen={isVapModalOpen} onClose={() => setIsVapModalOpen(false)} onSaved={() => { refetchProfile(); queryClient.invalidateQueries({ queryKey: ['vap-id-client-profile', user?.id] }); }} role="client" />
        <VapIdCardModal isOpen={showVapCard} onClose={() => setShowVapCard(false)} role="client" />
      </Suspense>
    </AmbientPageBackground>
  );
};

export default ClientProfile;
