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
import { Progress } from "@/components/ui/progress";
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
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white">
      {/* 🛸 CINEMATIC BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#EB4898]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[5%] left-[-5%] w-[50%] h-[40%] bg-orange-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-lg mx-auto p-6 pt-10 pb-40 space-y-8 relative z-10">
        
        {/* 🛸 HERO HEADER: GLASS AVATAR */}
        <div className="flex flex-col items-center text-center gap-5">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-[2.5rem] p-[3px] bg-gradient-to-br from-[#EB4898] via-orange-500 to-amber-400 shadow-[0_0_40px_rgba(235,72,152,0.3)]"
            >
              <div
                className="w-full h-full rounded-[2.4rem] bg-[#0d0d0f] overflow-hidden cursor-pointer flex items-center justify-center border border-white/10"
                onClick={() => { triggerHaptic('light'); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white/20" />
                )}
              </div>
            </motion.div>
            <button
              onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 bg-white text-black border-2 border-[#0d0d0f]"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              {profile?.name || 'Incomplete'}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">{user?.email}</p>
          </div>
        </div>

        {/* 🛸 HUD STATS: GLASS CARDS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Likes', value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-[#EB4898]' },
            { label: 'Matches', value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-amber-400' },
            { label: 'Chats', value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-sky-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[1.8rem] p-4 text-center shadow-2xl"
            >
              <stat.icon className={cn("w-4 h-4 mx-auto mb-2 opacity-80", stat.color)} />
              <div className="text-xl font-black tabular-nums tracking-tighter text-white">
                {stat.value}
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest text-white/30 italic mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 PRIMARY ACTIONS: LIQUID GLASS */}
        <div className="space-y-4">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-16 rounded-[2rem] bg-white text-black font-black uppercase italic tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] border-none"
          >
            <User className="w-5 h-5 mr-3" />
            Edit Identity
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className="w-full h-16 rounded-[2rem] bg-[#EB4898]/10 backdrop-blur-xl border border-[#EB4898]/30 hover:bg-[#EB4898]/20 transition-all active:scale-95"
          >
            <Megaphone className="w-5 h-5 text-[#EB4898] mr-3" />
            <span className="bg-gradient-to-r from-[#EB4898] to-orange-400 bg-clip-text text-transparent font-black uppercase italic tracking-widest text-sm">
              Promote Events
            </span>
          </Button>
        </div>

        {/* 🛸 RESIDENT CARD: NEXUS DESIGN */}
        <motion.div
           whileHover={{ scale: 1.02 }}
           whileTap={{ scale: 0.98 }}
           className="p-1 rounded-[2.2rem] bg-gradient-to-r from-[#EB4898] to-orange-500 shadow-2xl transition-all cursor-pointer"
           onClick={() => { triggerHaptic('selection'); setIsVapModalOpen(true); }}
        >
          <div className="bg-[#0d0d0f]/90 backdrop-blur-2xl rounded-[2.1rem] p-5 flex items-center gap-4 border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-6 h-6 text-[#EB4898]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white italic">Nexus ID Card</h3>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Verified Resident Profile</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20" />
          </div>
        </motion.div>

        <VapIdEditModal isOpen={isVapModalOpen} onClose={() => setIsVapModalOpen(false)} />

        {/* 🛸 PROGRESS: LIQUID GAUGE */}
        {profile && completionPercent < 100 && (
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#EB4898]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 italic">Profile Power</span>
              </div>
              <span className="text-sm font-black text-white italic tracking-tighter">{completionPercent}%</span>
            </div>
            
            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/10">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${completionPercent}%` }}
                 className="h-full bg-gradient-to-r from-[#EB4898] to-orange-400 rounded-full" 
               />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'profile_images', label: 'Photos' },
                { key: 'bio', label: 'Bio' },
                { key: 'interests', label: 'Interests' },
                { key: 'age', label: 'Age' }
              ].filter(attr => !profile[attr.key as keyof typeof profile] || (Array.isArray(profile[attr.key as keyof typeof profile]) && !profile[attr.key as keyof typeof profile].length))
               .map(missing => (
                 <span key={missing.label} className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-white/5 text-white/50 border border-white/10">+ {missing.label}</span>
               ))
              }
            </div>
          </div>
        )}

        {/* 🛸 QUICK NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Your Likes', sub: 'Properties', icon: Flame, color: 'text-[#EB4898]', path: '/client/liked-properties' },
            { label: 'History', sub: 'Interested', icon: ThumbsUp, color: 'text-orange-400', path: '/client/who-liked-you' }
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-6 flex flex-col gap-4 text-left hover:bg-white/[0.05] transition-all"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10", nav.color)}>
                <nav.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-white italic">{nav.label}</div>
                <div className="text-[9px] font-bold mt-0.5 text-white/30 uppercase tracking-widest">{nav.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 🛸 BIO SECTION: GLASS PANEL */}
        {profile?.bio && (
          <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 italic mb-4">Biography</h3>
            <p className="text-sm font-medium text-white/70 leading-relaxed italic">"{profile.bio}"</p>
          </div>
        )}

        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 italic mb-4 px-2">Pulse Activity</h3>
          <ActivityFeed />
        </div>

        <SharedProfileSection profileId={user?.id} profileName={profile?.name || 'Your Profile'} isClient={true} />
        <LanguageToggle />

        {/* 🛸 SYSTEM STACK: MINI GLASS BUTTONS */}
        <div className="space-y-3">
          <button
            onClick={() => { triggerHaptic('success'); navigate('/subscription/packages'); }}
            className="w-full h-16 rounded-[2rem] mexican-pink-premium flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-2xl"
          >
            <Crown className="w-5 h-5" />
            <span className="text-sm font-black uppercase italic tracking-widest">Premium Status</span>
          </button>

          {[
            { label: 'Legal Hub', icon: Scale, path: '/client/legal-services' },
            { label: 'System Settings', icon: Settings, path: '/client/settings' }
          ].map(btn => (
             <button
              key={btn.label}
              onClick={() => { triggerHaptic('light'); navigate(btn.path); }}
              className="w-full h-15 rounded-[2rem] bg-white/5 backdrop-blur-md border border-white/5 flex items-center px-8 gap-4 active:scale-[0.97] transition-all"
            >
              <btn.icon className="w-4 h-4 text-white/40" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70 italic">{btn.label}</span>
            </button>
          ))}

          <button
            onClick={() => { triggerHaptic('medium'); signOut(); }}
            className="w-full h-15 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 active:scale-[0.97] transition-all text-red-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Sign Out Session</span>
          </button>
        </div>

        <div className="h-10" />
      </div>

      <ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      <PhotoPreview photos={profile?.profile_images || []} isOpen={showPhotoPreview} onClose={() => setShowPhotoPreview(false)} initialIndex={selectedPhotoIndex} />
    </div>
  );
};

export default ClientProfile;
