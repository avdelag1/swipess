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

const ClientProfile = () => {
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
    <div className="w-full relative overflow-x-hidden min-h-screen bg-[#030308] text-white">

      {/* Swipess Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-violet-600/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/6 rounded-full blur-[120px]" />
        <div className="absolute top-[45%] right-[25%] w-[40%] h-[30%] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto p-6 pt-4 pb-12 space-y-10 relative z-10">

        {/* SWIPESS MEMBER BADGE */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-violet-400">Swipess Member</span>
          </div>
        </div>

        {/* IDENTITY CORE */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-44 h-44 p-[2px] shadow-[0_0_60px_rgba(124,58,237,0.25)]"
              style={{
                borderRadius: '3.5rem',
                background: 'linear-gradient(135deg, #7C3AED, #0EA5E9, #00D4FF)',
              }}
            >
              <div
                className="w-full h-full overflow-hidden cursor-pointer flex items-center justify-center bg-[#080C14] border border-white/5"
                style={{ borderRadius: '3.4rem' }}
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-white/10" />
                )}
              </div>
            </motion.div>

            {/* Scan ring */}
            <motion.div
              className="absolute inset-[-6px] border border-violet-500/20 pointer-events-none"
              style={{ borderRadius: '4rem' }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            <button
              onClick={() => { triggerHaptic('light'); setShowEditDialog(true); }}
              className="absolute -bottom-3 -right-3 w-12 h-12 flex items-center justify-center shadow-2xl transition-all active:scale-90 z-20 rounded-[1.5rem] border border-violet-300/20"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9)' }}
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
              {profile?.name || 'Profile'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* HUD STATS GRID */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Likes', value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-violet-400', glow: 'rgba(124,58,237,0.15)' },
            { label: 'Matches', value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-cyan-400', glow: 'rgba(0,212,255,0.15)' },
            { label: 'Chats', value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-blue-400', glow: 'rgba(59,130,246,0.15)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center p-5 text-center rounded-3xl border border-white/[0.06] bg-white/[0.02]"
              style={{ boxShadow: `inset 0 0 30px ${stat.glow}` }}
            >
              <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
              <div className="text-3xl font-black tabular-nums tracking-tighter leading-none text-white">
                {stat.value}
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] mt-2 text-white/30">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="space-y-3">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-16 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[15px] transition-all border-none text-white"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #0EA5E9, #00D4FF)',
              boxShadow: '0 20px 50px rgba(124,58,237,0.25)',
            }}
          >
            <User className="w-6 h-6 mr-3 text-white" />
            <span className="text-white">Control Identity</span>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className="w-full h-16 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-all active:scale-95"
          >
            <Megaphone className="w-6 h-6 text-violet-400 mr-3" />
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[14px]">
              Promote Your Event
            </span>
          </Button>
        </div>

        {/* VERIFIED RESIDENT CARD */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="p-[1.5px] rounded-3xl cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #0EA5E9, #00D4FF)' }}
          onClick={() => { triggerHaptic('light'); setIsVapModalOpen(true); }}
        >
          <div className="bg-[#080C14] rounded-3xl p-6 flex items-center gap-5 border border-transparent">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <ShieldCheck className="w-7 h-7 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] italic text-white leading-tight">Verified Resident</h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] mt-1 text-white/25">Status: Verified Member</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/15" />
          </div>
        </motion.div>

        {/* PROFILE COMPLETION */}
        <AnimatePresence>
          {profile && completionPercent < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-white/[0.06] rounded-3xl p-7 space-y-5 bg-white/[0.02]"
              style={{ boxShadow: 'inset 0 0 40px rgba(124,58,237,0.06)' }}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/35">Profile Completion</span>
                </div>
                <span className="text-2xl font-black italic tracking-tighter text-white">{completionPercent}%</span>
              </div>

              <div className="h-3 w-full rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #7C3AED, #0EA5E9, #00D4FF)',
                    boxShadow: '0 0 15px rgba(124,58,237,0.6)',
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
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">Global Pulse</h3>
            </div>
            <Zap className="w-4 h-4 text-violet-400/30" />
          </div>
          <ActivityFeed />
        </div>

        <div className="p-[1.5px] rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(14,165,233,0.3))' }}>
          <div className="bg-[#080C14] rounded-3xl">
            <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Your Profile'} isClient={true} />
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
            className="w-full h-16 rounded-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all text-white font-black uppercase italic tracking-[0.2em] text-[15px]"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #0EA5E9, #00D4FF)',
              boxShadow: '0 20px 50px rgba(124,58,237,0.2)',
            }}
          >
            <Crown className="w-6 h-6 text-white" />
            <span>Member Dashboard</span>
          </motion.button>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Legal Terminal', icon: Scale, path: '/client/legal-services' },
              { label: 'Account Settings', icon: Settings, path: '/client/settings' },
              { label: 'Sign Out', icon: LogOut, path: 'signout', urgent: true },
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
                  "w-full h-14 rounded-2xl flex items-center px-8 gap-5 active:scale-[0.97] transition-all border",
                  btn.urgent
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.05]"
                )}
              >
                <btn.icon className={cn("w-5 h-5", btn.urgent ? "text-red-400" : "text-white/25")} />
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
