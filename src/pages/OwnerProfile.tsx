import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone, Scale, ChevronRight, Coins, User, UserCircle, Crown, Sparkles
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useAppTheme from "@/hooks/useAppTheme";
import { triggerHaptic } from "@/utils/haptics";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";

const OwnerProfile = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const { tokenBalance } = useMessagingQuota();
  const navigate = useNavigate();
  const { theme, isLight } = useAppTheme();

  const isLoading = statsLoading || profileLoading;

  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className={cn(
      "min-h-screen w-full transition-colors duration-500 relative overflow-x-hidden",
      isLight ? "bg-white" : "bg-black",
      "text-foreground"
    )}>
      <AtmosphericLayer variant="primary" />

      <div className="w-full max-w-7xl mx-auto p-6 pt-24 pb-12 space-y-16 relative z-10">
        
        {/* 🛸 OWNER HEADER: BRAND GLASS */}
        <div className="flex flex-col items-center text-center gap-8">
          <div className="relative">
             <motion.div 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className={cn(
                  "w-48 h-48 transition-all duration-500 p-[2px] shadow-3xl",
                  "rounded-3xl bg-gradient-to-br from-[#EB4898] via-indigo-500 to-sky-400"
               )}
            >
              <div
                className={cn(
                   "w-full h-full overflow-hidden cursor-pointer flex items-center justify-center",
                   "rounded-[1.4rem] bg-black/40 backdrop-blur-3xl border border-white/10"
                )}
                onClick={() => { triggerHaptic('selection'); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className={cn("w-16 h-16", isLight ? "text-black/20" : "text-white/20")} />
                )}
              </div>
            </motion.div>
             <button
               onClick={() => { triggerHaptic('selection'); setShowEditDialog(true); }}
               className={cn(
                  "absolute -bottom-3 -right-3 w-14 h-14 flex items-center justify-center shadow-2xl transition-all active:scale-90 z-20",
                  "bg-white text-black rounded-2xl border border-black/10"
               )}
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            <h1 className={cn(
              "text-6xl font-black uppercase italic tracking-tighter leading-none transition-all",
              isLight ? "text-black" : "text-white"
            )}>
              {ownerProfile?.business_name || 'Brand'}
            </h1>
            <div className="flex items-center justify-center gap-3">
               <div className={cn(
                 "px-4 py-1.5 rounded-full transition-all",
                 "bg-[#EB4898]/10 border border-[#EB4898]/20"
               )}>
                  <span className={cn(
                     "text-[10px] font-black uppercase tracking-[0.3em] italic",
                     "text-[#EB4898]"
                   )}>Owner Elite</span>
               </div>
               <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
               <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic", isLight ? "text-black/30" : "text-white/30")}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* 🛸 METRIC GRID: SEAMLESS MIRROR */}
        <div className="grid grid-cols-3 gap-8 py-8 border-y border-white/5">
          {[
            { label: 'Network', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-[#EB4898]' },
            { label: 'Followers', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-amber-500' },
            { label: 'Assets', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-sky-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center justify-center text-center group"
            >
              <stat.icon className={cn("w-6 h-6 mb-4 transition-transform group-hover:scale-110", stat.color)} />
              <div className={cn("text-4xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-slate-950" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[10px] font-black uppercase tracking-[0.2em] italic mt-3 opacity-40")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 TOKEN HUB: SEAMLESS MIRROR */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex items-center justify-between p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 cursor-pointer"
          onClick={() => { triggerHaptic('light'); navigate('/subscription/packages'); }}
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Coins className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h3 className={cn("text-[14px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-black" : "text-white")}>Global Credits</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em] mt-1.5 opacity-30")}>Swipess Messaging Reserve</p>
            </div>
          </div>
          <div className={cn("text-4xl font-black italic tracking-tighter", isLight ? "text-black" : "text-white")}>
            {tokenBalance || 0}
          </div>
        </motion.div>

        {/* 🛸 PRIMARY HIGH-FIDELITY ACTIONS */}
        <div className="space-y-4">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className={cn(
              "w-full h-20 rounded-3xl font-black uppercase italic tracking-[0.2em] text-[16px] transition-all border-none shadow-none",
              isLight ? "bg-slate-950 text-white" : "bg-white !text-slate-950"
            )}
          >
            <User className={cn("w-7 h-7 mr-4", isLight ? "text-white" : "!text-slate-950")} />
            <span className={isLight ? "text-white" : "!text-slate-950"}>Control Brand ID</span>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn(
               "w-full h-20 rounded-3xl backdrop-blur-3xl border border-white/10 bg-white/5 transition-all active:scale-95"
            )}
          >
            <Megaphone className="w-7 h-7 text-[#EB4898] mr-4" />
            <span className="bg-gradient-to-r from-[#EB4898] via-orange-500 to-amber-500 bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[15px]">
              Promote Your Event
            </span>
          </Button>
        </div>

        {/* 🛸 ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'Outbound', sub: 'Linked Ready', icon: Flame, color: 'text-[#EB4898]', path: '/owner/liked-clients' },
            { label: 'Inbound', sub: 'Active Fans', icon: ThumbsUp, color: 'text-amber-500', path: '/owner/interested-clients' }
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className={cn(
                  "rounded-[2.5rem] p-8 flex flex-col gap-6 text-left transition-all bg-white/[0.03] border border-white/5 hover:bg-white/[0.05]"
               )}
             >
               <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-lg", nav.color)}>
                 <nav.icon className="w-7 h-7" />
               </div>
               <div>
                 <div className={cn("text-[14px] font-black uppercase tracking-[0.1em] italic leading-tight", isLight ? "text-black" : "text-white")}>{nav.label}</div>
                 <div className={cn("text-[11px] font-bold mt-1.5 uppercase tracking-widest opacity-30")}>{nav.sub}</div>
               </div>
            </motion.button>
          ))}
        </div>

        {/* 🛸 ACTIVITY FEED PANEL */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EB4898] animate-pulse" />
                <h3 className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40")}>Activity Feed</h3>
             </div>
             <Sparkles className="w-4 h-4 text-[#EB4898]/40" />
          </div>
          <ActivityFeed />
        </div>

        <div className="py-8">
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
              <span className="text-[16px] font-black uppercase italic tracking-[0.2em] text-white">Owner Dashboard</span>
           </motion.button>

           <div className="grid grid-cols-1 gap-4 text-center">
              {[
                { label: 'Legal Center', icon: Scale, path: '/legal' },
                { label: 'Account Settings', icon: Settings, path: '/owner/settings' },
                { label: 'Sign Out', icon: LogOut, path: 'signout', urgent: true }
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
                        ? "bg-white border-black/15 text-black shadow-md" 
                        : "bg-white/5 border-white/5 text-white/80"
                  )}
                >
                  <btn.icon className={cn("w-6 h-6", btn.urgent ? "text-red-500" : isLight ? "text-black/50" : "text-white/30")} />
                  <span className={cn("text-[13px] font-black uppercase tracking-[0.2em] italic", isLight ? "text-black" : "text-white/80")}>{btn.label}</span>
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


