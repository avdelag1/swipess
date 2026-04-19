import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone, Scale, ChevronRight, Coins, User, Crown, Sparkles
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { triggerHaptic } from "@/utils/haptics";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";

const OwnerProfile = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const { tokenBalance } = useMessagingQuota();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isLoading = statsLoading || profileLoading;

  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className={cn("min-h-full w-full transition-colors duration-500", isLight ? "bg-white text-black" : "bg-[#0a0a0c] text-white")}>
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <AnimatePresence>
        <div className="fixed inset-0 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("absolute top-[-15%] left-[-10%] w-[70%] h-[50%] blur-[130px] rounded-full", isLight ? "bg-[#EB4898]/10" : "bg-[#EB4898]/10")} 
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn("absolute top-[20%] right-[-10%] w-[40%] h-[40%] blur-[110px] rounded-full", isLight ? "bg-indigo-500/10" : "bg-indigo-500/5")} 
          />
        </div>
      </AnimatePresence>

      <div className="w-full max-w-lg mx-auto p-6 pt-24 pb-48 space-y-12 relative z-10">
        
        {/* 🛸 OWNER HEADER: BRAND GLASS */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
             <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                 "w-36 h-36 rounded-[3.2rem] p-[4px] bg-gradient-to-br from-[#EB4898] via-indigo-500 to-sky-400 shadow-2xl transition-all",
                 isLight ? "shadow-indigo-100/50" : "shadow-[0_0_60px_rgba(235,72,152,0.3)]"
              )}
            >
              <div
                className={cn(
                   "w-full h-full rounded-[3.1rem] overflow-hidden cursor-pointer flex items-center justify-center border",
                   isLight ? "bg-white border-black/5" : "bg-[#0d0d0f] border-white/10"
                )}
                onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className={cn("w-14 h-14", isLight ? "text-black/10" : "text-white/20")} />
                )}
              </div>
            </motion.div>
             <button
              onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              className={cn(
                 "absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 h-10 rounded-xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border-[4px] z-20 whitespace-nowrap",
                 isLight ? "bg-black text-white border-white" : "bg-white text-black border-[#0d0d0f]"
              )}
            >
              <Camera className="w-3.5 h-3.5 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Edit</span>
            </button>
          </div>

          <div className="space-y-2">
            <h1 className={cn("text-4xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
              {ownerProfile?.business_name || 'Owner Profile'}
            </h1>
            <div className="flex items-center justify-center gap-3">
               <div className="bg-[#EB4898]/10 px-3 py-1 rounded-full border border-[#EB4898]/20">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#EB4898] italic">Authority Profile</span>
               </div>
               <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
               <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic", isLight ? "text-black/30" : "text-white/30")}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* 🛸 METRIC GRID: CARDS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Network', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-[#EB4898]' },
            { label: 'Followers', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-amber-500' },
            { label: 'Assets', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-sky-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn(
                 "backdrop-blur-3xl border rounded-[2rem] p-5 text-center shadow-xl transition-all",
                 isLight ? "bg-black/5 border-black/5" : "bg-white/[0.03] border-white/[0.08]"
              )}
            >
              <stat.icon className={cn("w-5 h-5 mx-auto mb-2 opacity-80", stat.color)} />
              <div className={cn("text-2xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[9px] font-black uppercase tracking-[0.1em] italic mt-2", isLight ? "text-black/30" : "text-white/30")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 TOKEN HUB: LIQUID GLASS */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-[#EB4898] via-indigo-600 to-indigo-700 backdrop-blur-3xl p-[2px] rounded-[2.8rem] shadow-2xl cursor-pointer"
          onClick={() => { triggerHaptic('medium'); navigate('/subscription/packages'); }}
        >
          <div className={cn(
             "backdrop-blur-3xl rounded-[2.7rem] p-7 flex items-center justify-between border",
             isLight ? "bg-white border-white/5" : "bg-[#0d0d0f]/95 border-white/5"
          )}>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
                <Coins className="w-8 h-8 text-[#EB4898]" />
              </div>
              <div>
                <h3 className={cn("text-[14px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-black" : "text-white")}>Global Credits</h3>
                <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5", isLight ? "text-black/30" : "text-white/30")}>Messaging Reserve</p>
              </div>
            </div>
            <div className={cn("text-3xl font-black italic tracking-tighter mr-3", isLight ? "text-black" : "text-white")}>
              {tokenBalance || 0}
            </div>
          </div>
        </motion.div>

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
            Control Brand ID
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn(
               "w-full h-20 rounded-[2.5rem] backdrop-blur-3xl border transition-all active:scale-95",
               isLight ? "bg-[#EB4898]/5 border-[#EB4898]/20 hover:bg-[#EB4898]/10" : "bg-[#EB4898]/10 border-[#EB4898]/30 hover:bg-[#EB4898]/20"
            )}
          >
            <Megaphone className="w-7 h-7 text-[#EB4898] mr-4" />
            <span className="bg-gradient-to-r from-[#EB4898] via-indigo-500 to-sky-500 bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[15px]">
              Sync Marketing
            </span>
          </Button>
        </div>

        {/* 🛸 ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Outbound', sub: 'Linked Ready', icon: Flame, color: 'text-[#EB4898]', path: '/owner/liked-clients' },
            { label: 'Inbound', sub: 'Active Fans', icon: ThumbsUp, color: 'text-amber-500', path: '/owner/interested-clients' }
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className={cn(
                 "backdrop-blur-3xl border rounded-[2.5rem] p-7 flex flex-col gap-6 text-left transition-all",
                 isLight ? "bg-black/5 border-black/5 shadow-xl hover:bg-black/10" : "bg-white/[0.03] border-white/[0.08] hover:bg-white/10"
              )}
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg", nav.color)}>
                <nav.icon className="w-7 h-7" />
              </div>
              <div>
                <div className={cn("text-[14px] font-black uppercase tracking-[0.1em] italic leading-tight", isLight ? "text-black" : "text-white")}>{nav.label}</div>
                <div className={cn("text-[11px] font-bold mt-1.5 uppercase tracking-widest", isLight ? "text-black/30" : "text-white/30")}>{nav.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 🛸 ACTIVITY FEED PANEL */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EB4898] animate-pulse" />
                <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/40" : "text-white/40")}>Brand Pulse Feed</h3>
             </div>
             <Sparkles className="w-4 h-4 text-[#EB4898]/40" />
          </div>
          <ActivityFeed />
        </div>

        <div className={cn("p-[4px] rounded-[3rem]", isLight ? "bg-black/5" : "bg-white/5")}>
           <SharedProfileSection profileId={user?.id} profileName={ownerProfile?.business_name || 'Your Business'} isClient={false} />
        </div>
        
        <div className="flex justify-center pt-8">
           <LanguageToggle />
        </div>

        {/* 🛸 NAVIGATION STACK: GLASS BUTTONS */}
        <div className="space-y-4 pt-10">
           <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { triggerHaptic('success'); navigate('/subscription/packages'); }}
              className="w-full h-20 rounded-[2.5rem] bg-gradient-to-r from-[#EB4898] via-indigo-500 to-sky-500 flex items-center justify-center gap-4 active:scale-[0.97] transition-all shadow-[0_25px_60px_rgba(235,72,152,0.3)]"
           >
              <Crown className="w-7 h-7 text-white" />
              <span className="text-[16px] font-black uppercase italic tracking-[0.2em] text-white">Authority Vault</span>
           </motion.button>

           <div className="grid grid-cols-1 gap-4 text-center">
              {[
                { label: 'Legal Center', icon: Scale, path: '/legal' },
                { label: 'Account Authority', icon: Settings, path: '/owner/settings' },
                { label: 'De-authorize Brand', icon: LogOut, path: 'signout', urgent: true }
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

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </div>
  );
};

export default OwnerProfile;
