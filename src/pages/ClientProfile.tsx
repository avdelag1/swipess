import { ClientProfileDialog } from "@/components/ClientProfileDialog";
import { PhotoPreview } from "@/components/PhotoPreview";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut, User, Camera, Sparkles, Crown,
  Flame, ThumbsUp, Settings, MessageSquare, Megaphone, ChevronRight, Scale, ShieldCheck
} from "lucide-react";
import { useClientStats } from "@/hooks/useClientStats";
import { ActivityFeed } from "@/components/ActivityFeed";
import { VapIdEditModal } from "@/components/VapIdEditModal";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
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
  const { theme } = useTheme();

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
    <div className="min-h-full w-full bg-[#0a0a0c] text-white overflow-y-visible">
      {/* 🛸 CINEMATIC BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#EB4898]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[5%] left-[-5%] w-[50%] h-[40%] bg-orange-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-lg mx-auto p-6 pt-24 pb-48 space-y-10 relative z-10 overflow-y-visible">
        
        {/* 🛸 HERO HEADER: GLASS AVATAR */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-[2.8rem] p-[3px] bg-gradient-to-br from-[#EB4898] via-orange-500 to-amber-400 shadow-[0_0_50px_rgba(235,72,152,0.4)]"
            >
              <div
                className="w-full h-full rounded-[2.7rem] bg-[#0d0d0f] overflow-hidden cursor-pointer flex items-center justify-center border border-white/10"
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white/20" />
                )}
              </div>
            </motion.div>
            <button
              onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              className="absolute -bottom-1 -right-1 w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 bg-white text-black border-[3px] border-[#0d0d0f] z-20"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
              {profile?.name || 'Nexus ID'}
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#EB4898] italic">{user?.email}</p>
          </div>
        </div>

        {/* 🛸 HUD STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Likes', value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-[#EB4898]' },
            { label: 'Matches', value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-amber-400' },
            { label: 'Chats', value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-sky-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-5 text-center shadow-2xl"
            >
              <stat.icon className={cn("w-5 h-5 mx-auto mb-2 opacity-80", stat.color)} />
              <div className="text-2xl font-black tabular-nums tracking-tighter text-white leading-none">
                {stat.value}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/30 italic mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 PRIMARY READABLE ACTIONS */}
        <div className="space-y-4">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-18 rounded-[2.2rem] bg-white text-black font-black uppercase italic tracking-[0.1em] text-[15px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_25px_50px_rgba(255,255,255,0.15)] border-none"
          >
            <User className="w-6 h-6 mr-3" />
            Control Identity
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className="w-full h-18 rounded-[2.2rem] bg-[#EB4898]/10 backdrop-blur-xl border border-[#EB4898]/30 hover:bg-[#EB4898]/20 transition-all active:scale-95"
          >
            <Megaphone className="w-6 h-6 text-[#EB4898] mr-3" />
            <span className="bg-gradient-to-r from-[#EB4898] to-orange-400 bg-clip-text text-transparent font-black uppercase italic tracking-[0.15em] text-[14px]">
              Promote Assets
            </span>
          </Button>
        </div>

        {/* 🛸 RESIDENT CARD */}
        <motion.div
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="p-[2px] rounded-[2.5rem] bg-gradient-to-r from-[#EB4898] to-orange-500 shadow-2xl transition-all cursor-pointer"
           onClick={() => { triggerHaptic('selection'); setIsVapModalOpen(true); }}
        >
          <div className="bg-[#0d0d0f]/95 backdrop-blur-2xl rounded-[2.4rem] p-6 flex items-center gap-5 border border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
              <ShieldCheck className="w-7 h-7 text-[#EB4898]" />
            </div>
            <div className="flex-1">
              <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-white italic leading-tight">Resident ID Card</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mt-1">Status: Verified Member</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/10" />
          </div>
        </motion.div>

        {/* 🛸 PROGRESS HUD */}
        {profile && completionPercent < 100 && (
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.8rem] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-[#EB4898]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 italic">Parity Index</span>
              </div>
              <span className="text-lg font-black text-white italic tracking-tighter">{completionPercent}%</span>
            </div>
            
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/10">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${completionPercent}%` }}
                 className="h-full bg-gradient-to-r from-[#EB4898] to-orange-400 rounded-full shadow-[0_0_15px_#EB4898]" 
               />
            </div>
          </div>
        )}

        {/* 🛸 PULSE ACTIVITY */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
             <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Global Pulse Feed</h3>
          </div>
          <ActivityFeed />
        </div>

        <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Your Profile'} isClient={true} />
        
        <div className="flex justify-center pt-4">
           <LanguageToggle />
        </div>

        {/* 🛸 SYSTEM STACK */}
        <div className="space-y-4 pt-10">
           <button
              onClick={() => { triggerHaptic('success'); navigate('/subscription/packages'); }}
              className="w-full h-18 rounded-[2.2rem] bg-gradient-to-r from-[#EB4898] to-[#ff5bb0] flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-[0_20px_40px_rgba(235,72,152,0.3)]"
           >
              <Crown className="w-6 h-6 text-white" />
              <span className="text-[15px] font-black uppercase italic tracking-[0.1em] text-white">Unlock Premium Status</span>
           </button>

           <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Legal Authority', icon: Scale, path: '/client/legal-services' },
                { label: 'Network Settings', icon: Settings, path: '/client/settings' },
                { label: 'Sign Out Session', icon: LogOut, path: 'signout', urgent: true }
              ].map(btn => (
                 <button
                  key={btn.label}
                  onClick={() => { 
                    triggerHaptic('medium'); 
                    if (btn.path === 'signout') signOut(); 
                    else navigate(btn.path); 
                  }}
                  className={cn(
                    "w-full h-16 rounded-[2.2rem] backdrop-blur-md flex items-center px-10 gap-5 active:scale-[0.97] transition-all border",
                    btn.urgent ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/5 text-white/70"
                  )}
                >
                  <btn.icon className={cn("w-5 h-5", btn.urgent ? "text-red-500" : "text-white/30")} />
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">{btn.label}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="h-20" />
      </div>

      <ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      <PhotoPreview photos={profile?.profile_images || []} isOpen={showPhotoPreview} onClose={() => setShowPhotoPreview(false)} initialIndex={selectedPhotoIndex} />
    </div>
  );
};

export default ClientProfile;
