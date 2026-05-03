import { ClientProfileDialog } from "@/components/ClientProfileDialog";
import { PhotoPreview } from "@/components/PhotoPreview";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut, User, Camera, Sparkles, Crown,
  Flame, ThumbsUp, Settings, MessageSquare, Megaphone, ChevronRight, Scale, ShieldCheck, Zap
} from "lucide-react";
import { useClientStats } from "@/hooks/useClientStats";
import { ActivityFeed } from "@/components/ActivityFeed";
import { VapIdEditModal } from "@/components/VapIdEditModal";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";
import { LanguageToggle } from "@/components/LanguageToggle";
import useAppTheme from "@/hooks/useAppTheme";
import { useTranslation } from 'react-i18next';

const ClientProfile = () => {
  const { isLight } = useAppTheme();
  const { t } = useTranslation();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isVapModalOpen, setIsVapModalOpen] = useState(false);
  const { data: profile, isLoading } = useClientProfile();
  const { user, signOut } = useAuth();
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

  return (
    <div className={cn("w-full relative overflow-x-hidden min-h-screen", isLight ? "bg-white text-slate-900" : "bg-[#020202] text-white")}>

      {/* 🛸 NEXUS ATMOSPHERIC LAYER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={cn("absolute inset-0", isLight ? "opacity-[0.02]" : "opacity-[0.04]")}
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,77,0,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,77,0,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div className={cn("absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px]", isLight ? "bg-[#FF4D00]/[0.04]" : "bg-[#FF4D00]/10")} />
        <div className={cn("absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]", isLight ? "bg-[#EB4898]/[0.03]" : "bg-[#EB4898]/8")} />
      </div>

      <div className="w-full max-w-7xl mx-auto p-6 pt-4 pb-12 space-y-10 relative z-10">

        {/* SWIPESS MEMBER BADGE */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#EB4898]/20 bg-[#EB4898]/5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#EB4898]">Nexus Protocol</span>
          </div>
        </div>

        {/* IDENTITY CORE */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-36 h-36 p-[2px] shadow-[0_0_60px_rgba(235,72,152,0.25)]"
              style={{
                borderRadius: '3rem',
                background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
              }}
            >
              <div
                className={cn("w-full h-full overflow-hidden cursor-pointer flex items-center justify-center border", isLight ? "bg-white border-black/10" : "bg-[#080C14] border-white/5")}
                style={{ borderRadius: '3rem' }}
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className={cn("w-14 h-14", isLight ? "text-slate-300" : "text-white/10")} />
                )}
              </div>
            </motion.div>

            {/* Scan ring */}
            <motion.div
              className="absolute inset-[-6px] border border-[#FF4D00]/20 pointer-events-none"
              style={{ borderRadius: '4rem' }}
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <button
              onClick={() => { triggerHaptic('light'); setShowEditDialog(true); }}
              className="absolute -bottom-3 -right-3 w-12 h-12 flex items-center justify-center shadow-2xl transition-all active:scale-90 z-20 rounded-[1.5rem] border border-white/10"
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
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('nav.likes'), value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-[#FF4D00]', glow: 'rgba(255,77,0,0.1)' },
            { label: t('dashboard.totalMatches'), value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-[#EB4898]', glow: 'rgba(235,72,152,0.1)' },
            { label: t('nav.messages'), value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-orange-400', glow: 'rgba(251,146,60,0.1)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn("flex flex-col items-center justify-center p-5 text-center rounded-3xl border shadow-sm backdrop-blur-xl", isLight ? "border-black/10 bg-white" : "border-white/[0.06] bg-white/[0.02]")}
              style={{ boxShadow: `inset 0 0 30px ${stat.glow}` }}
            >
              <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
              <div className={cn("text-3xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mt-2", isLight ? "text-slate-500" : "text-white/30")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="space-y-3">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-16 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[15px] transition-all border-none text-white shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
            }}
          >
            <User className="w-6 h-6 mr-3 text-white" />
            <span className="text-white">{t('profile.editProfile')}</span>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn("w-full h-16 rounded-2xl border transition-all active:scale-95 shadow-sm bg-white/5", isLight ? "border-black/10 bg-white hover:bg-black/[0.02]" : "border-white/10 hover:border-white/20")}
          >
            <Megaphone className="w-6 h-6 text-[#FF4D00] mr-3" />
            <span className="bg-gradient-to-r from-[#FF4D00] to-[#EB4898] bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[14px]">
              {t('nav.promote')}
            </span>
          </Button>
        </div>

        {/* VERIFIED RESIDENT CARD */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="p-[1.5px] rounded-3xl cursor-pointer shadow-xl"
          style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)' }}
          onClick={() => { triggerHaptic('light'); setIsVapModalOpen(true); }}
        >
          <div className={cn("rounded-3xl p-6 flex items-center gap-5 border border-transparent", isLight ? "bg-white" : "bg-[#080C14]")}>
            <div className="w-14 h-14 rounded-2xl bg-[#FF4D00]/10 flex items-center justify-center border border-[#FF4D00]/20">
              <ShieldCheck className="w-7 h-7 text-[#FF4D00]" />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-[13px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-slate-900" : "text-white")}>Verified Member</h3>
              <p className={cn("text-[9px] font-bold uppercase tracking-[0.15em] mt-1", isLight ? "text-slate-500" : "text-white/25")}>Status: Identity Sync Complete</p>
            </div>
            <ChevronRight className={cn("w-5 h-5", isLight ? "text-slate-400" : "text-white/15")} />
          </div>
        </motion.div>

        {/* PROFILE COMPLETION */}
        <AnimatePresence>
          {profile && completionPercent < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn("rounded-3xl p-7 space-y-5 border shadow-sm backdrop-blur-xl", isLight ? "border-black/10 bg-white" : "border-white/[0.06] bg-white/[0.02]")}
              style={{ boxShadow: 'inset 0 0 40px rgba(255,77,0,0.03)' }}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#EB4898]" />
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isLight ? "text-slate-500" : "text-white/35")}>{t('profile.completeness')}</span>
                </div>
                <span className={cn("text-2xl font-black italic tracking-tighter", isLight ? "text-slate-900" : "text-white")}>{completionPercent}%</span>
              </div>

              <div className={cn("h-3 w-full rounded-full overflow-hidden border", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/[0.06]")}>
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
        <div className="space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.35em]", isLight ? "text-slate-500" : "text-white/30")}>Global Activity</h3>
            </div>
            <Zap className="w-4 h-4 text-[#EB4898]/30" />
          </div>
          <ActivityFeed />
        </div>

        <div className="p-[1.5px] rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,77,0,0.2), rgba(235,72,152,0.2))' }}>
          <div className={cn("rounded-3xl", isLight ? "bg-white" : "bg-[#020202]")}>
            <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Identity'} isClient={true} />
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <LanguageToggle />
        </div>

        {/* SYSTEM AUTHORITY STACK */}
        <div className="space-y-3 pt-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { triggerHaptic('success'); navigate('/client/dashboard'); }}
            className="w-full h-16 rounded-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all text-white font-black uppercase italic tracking-[0.2em] text-[15px] shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
            }}
          >
            <Crown className="w-6 h-6 text-white" />
            <span>{t('nav.dashboard')}</span>
          </motion.button>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: t('nav.legal'), icon: Scale, path: '/client/legal-services' },
              { label: t('nav.settings'), icon: Settings, path: '/client/settings' },
              { label: t('actions.signOut'), icon: LogOut, path: 'signout', urgent: true },
            ].map(btn => (
              <motion.button
                key={btn.label}
                whileHover={{ x: 4 }}
                onClick={() => {
                  triggerHaptic('medium');
                  if (btn.path === 'signout') signOut();
                  else navigate(btn.path);
                }}
                className={cn(
                  "w-full h-14 rounded-2xl flex items-center px-8 gap-5 active:scale-[0.97] transition-all border shadow-sm backdrop-blur-xl",
                  btn.urgent
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : isLight
                      ? "bg-white border-black/10 text-slate-700 hover:bg-black/[0.02]"
                      : "bg-white/[0.02] border-white/[0.06] text-white/70 hover:bg-white/[0.05]"
                )}
              >
                <btn.icon className={cn("w-5 h-5", btn.urgent ? "text-red-400" : isLight ? "text-slate-500" : "text-white/25")} />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">{btn.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-24" />
      </div>

      <ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      <PhotoPreview photos={profile?.profile_images || []} isOpen={showPhotoPreview} onClose={() => setShowPhotoPreview(false)} initialIndex={selectedPhotoIndex} />
      <VapIdEditModal isOpen={isVapModalOpen} onClose={() => setIsVapModalOpen(false)} />
    </div>
  );
};

export default ClientProfile;
