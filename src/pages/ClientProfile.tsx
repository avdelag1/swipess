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
import { motion, AnimatePresence } from "framer-motion";
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
  const isLight = theme === 'light';

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
    <div className={cn("min-h-full w-full transition-colors duration-500", isLight ? "bg-white text-black" : "bg-[#0a0a0c] text-white")}>
      {/* 🛸 CINEMATIC BACKGROUND GLOW */}
      <AnimatePresence>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("absolute top-[-10%] right-[-10%] w-[60%] h-[40%] blur-[120px] rounded-full", isLight ? "bg-[#EB4898]/10" : "bg-[#EB4898]/10")} 
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("absolute bottom-[5%] left-[-5%] w-[50%] h-[40%] blur-[100px] rounded-full", isLight ? "bg-orange-500/10" : "bg-orange-500/5")} 
          />
        </div>
      </AnimatePresence>

      <div className="w-full max-w-lg mx-auto p-6 pt-24 pb-48 space-y-12 relative z-10">
        
        {/* 🛸 HERO HEADER: MEGA AVATAR CYCLE */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                 "w-36 h-36 rounded-[3.2rem] p-[4px] bg-gradient-to-br from-[#EB4898] via-orange-500 to-amber-400 shadow-2xl transition-all",
                 isLight ? "shadow-orange-200/50" : "shadow-[0_0_60px_rgba(235,72,152,0.4)]"
              )}
            >
              <div
                className={cn(
                   "w-full h-full rounded-[3.1rem] overflow-hidden cursor-pointer flex items-center justify-center border",
                   isLight ? "bg-white border-black/5" : "bg-[#0d0d0f] border-white/10"
                )}
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className={cn("w-14 h-14", isLight ? "text-black/10" : "text-white/20")} />
                )}
              </div>
            </motion.div>
            <button
              onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              className={cn(
                 "absolute -bottom-1 -right-1 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border-[4px] z-20",
                 isLight ? "bg-black text-white border-white" : "bg-white text-black border-[#0d0d0f]"
              )}
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-2">
            <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
              {profile?.name || 'Profile'}
            </h1>
            <div className="bg-[#EB4898]/10 px-4 py-1.5 rounded-full border border-[#EB4898]/20 inline-block">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#EB4898] italic">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* 🛸 HUD STATS GRID */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Likes', value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-[#EB4898]' },
            { label: 'Matches', value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-amber-500' },
            { label: 'Chats', value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-sky-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn(
                 "backdrop-blur-3xl border rounded-[2rem] p-6 text-center shadow-2xl transition-all",
                 isLight ? "bg-black/5 border-black/5 shadow-xl" : "bg-white/[0.03] border-white/[0.08]"
              )}
            >
              <stat.icon className={cn("w-6 h-6 mx-auto mb-2 opacity-80", stat.color)} />
              <div className={cn("text-3xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[9px] font-black uppercase tracking-widest italic mt-2.5", isLight ? "text-black/30" : "text-white/30")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 PRIMARY HIGH-FIDELITY ACTIONS */}
        <div className="space-y-4">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className={cn(
              "w-full h-20 rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] text-[16px] hover:scale-[1.03] active:scale-95 transition-all shadow-2xl border-none shadow-[#EB4898]/20",
              isLight ? "bg-black text-white" : "bg-white text-black"
            )}
          >
            <User className="w-7 h-7 mr-4" />
            Control Identity
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn(
               "w-full h-20 rounded-[2.5rem] backdrop-blur-3xl border transition-all active:scale-95",
               isLight ? "bg-[#EB4898]/5 border-[#EB4898]/20 hover:bg-[#EB4898]/10" : "bg-[#EB4898]/10 border-[#EB4898]/30 hover:bg-[#EB4898]/20"
            )}
          >
            <Megaphone className="w-7 h-7 text-[#EB4898] mr-4" />
            <span className="bg-gradient-to-r from-[#EB4898] via-orange-500 to-amber-500 bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[15px]">
              Promote Reality
            </span>
          </Button>
        </div>

        {/* 🛸 RESIDENT AUTHORITY CARD */}
        <motion.div
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="p-[2px] rounded-[2.8rem] bg-gradient-to-r from-[#EB4898] via-indigo-500 to-orange-500 shadow-3xl transition-all cursor-pointer"
           onClick={() => { triggerHaptic('light'); setIsVapModalOpen(true); }}
        >
          <div className={cn(
             "backdrop-blur-3xl rounded-[2.7rem] p-7 flex items-center gap-6 border",
             isLight ? "bg-white border-white/5" : "bg-[#0d0d0f]/95 border-white/5"
          )}>
            <div className="w-16 h-16 rounded-2xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
              <ShieldCheck className="w-8 h-8 text-[#EB4898]" />
            </div>
            <div className="flex-1">
              <h3 className={cn("text-[14px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-black" : "text-white")}>Resident Authority</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5", isLight ? "text-black/30" : "text-white/30")}>Status: Verified Pillar</p>
            </div>
            <ChevronRight className={cn("w-6 h-6", isLight ? "text-black/10" : "text-white/10")} />
          </div>
        </motion.div>

        {/* 🛸 PARITY HUD */}
        {profile && completionPercent < 100 && (
          <div className={cn(
             "backdrop-blur-3xl border rounded-[3rem] p-8 space-y-6 transition-all",
             isLight ? "bg-black/5 border-black/5 shadow-2xl" : "bg-white/[0.03] border-white/5"
          )}>
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-3">
                 <Sparkles className="w-5 h-5 text-[#EB4898]" />
                 <span className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/40" : "text-white/50")}>Identity Parity Index</span>
               </div>
               <span className={cn("text-2xl font-black italic tracking-tighter", isLight ? "text-black" : "text-white")}>{completionPercent}%</span>
            </div>
            
            <div className={cn("h-4 w-full rounded-full overflow-hidden p-[3px] border", isLight ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10")}>
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${completionPercent}%` }}
                 className="h-full bg-gradient-to-r from-[#EB4898] via-indigo-500 to-orange-400 rounded-full shadow-[0_0_20px_rgba(235,72,152,0.6)]" 
               />
            </div>
          </div>
        )}

        {/* 🛸 GLOBAL PULSE FEED */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EB4898] animate-pulse" />
                <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/40" : "text-white/40")}>Global Activity</h3>
             </div>
             <Sparkles className="w-4 h-4 text-[#EB4898]/40" />
          </div>
          <ActivityFeed />
        </div>

        <div className={cn("p-[4px] rounded-[3rem]", isLight ? "bg-black/5" : "bg-white/5")}>
           <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Your Profile'} isClient={true} />
        </div>
        
        <div className="flex justify-center pt-8">
           <LanguageToggle />
        </div>

        {/* 🛸 SYSTEM AUTHORITY STACK */}
        <div className="space-y-4 pt-10">
           <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { triggerHaptic('success'); navigate('/subscription/packages'); }}
              className="w-full h-20 rounded-[2.5rem] bg-gradient-to-r from-[#EB4898] via-indigo-600 to-indigo-800 flex items-center justify-center gap-4 active:scale-[0.97] transition-all shadow-[0_25px_60px_rgba(235,72,152,0.3)]"
           >
              <Crown className="w-7 h-7 text-white" />
              <span className="text-[16px] font-black uppercase italic tracking-[0.2em] text-white">Authority Vault</span>
           </motion.button>

           <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Legal Terminal', icon: Scale, path: '/client/legal-services' },
                { label: 'Identity Settings', icon: Settings, path: '/client/settings' },
                { label: 'Disconnect Session', icon: LogOut, path: 'signout', urgent: true }
              ].map(btn => (
                 <motion.button
                  key={btn.label}
                  whileHover={{ x: 5 }}
                  onClick={() => { 
                    triggerHaptic('medium'); 
                    if (btn.path === 'signout') signOut(); 
                    else navigate(btn.path); 
                  }}
                  className={cn(
                    "w-full h-18 rounded-[2.5rem] backdrop-blur-md flex items-center px-12 gap-6 active:scale-[0.97] transition-all border",
                    btn.urgent 
                      ? "bg-red-500/10 border-red-500/20 text-red-500" 
                      : isLight 
                        ? "bg-black/5 border-black/10 text-black/80 shadow-sm" 
                        : "bg-white/5 border-white/5 text-white/80"
                  )}
                >
                  <btn.icon className={cn("w-6 h-6", btn.urgent ? "text-red-500" : isLight ? "text-black/30" : "text-white/30")} />
                  <span className="text-[13px] font-black uppercase tracking-[0.2em] italic">{btn.label}</span>
                </motion.button>
              ))}
           </div>
        </div>

        <div className="h-24" />
      </div>

      <ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      <PhotoPreview photos={profile?.profile_images || []} isOpen={showPhotoPreview} onClose={() => setShowPhotoPreview(false)} initialIndex={selectedPhotoIndex} />
    </div>
  );
};

export default ClientProfile;
