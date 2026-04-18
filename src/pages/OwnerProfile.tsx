import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone, Scale, ChevronRight, Coins, User, Crown
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion } from "framer-motion";
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

  const isLoading = statsLoading || profileLoading;

  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-full w-full bg-[#0a0a0c] text-white overflow-y-visible">
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[50%] bg-[#EB4898]/10 blur-[130px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[110px] rounded-full" />
      </div>

      <div className="w-full max-w-lg mx-auto p-6 pt-24 pb-48 space-y-10 relative z-10 overflow-y-visible">
        
        {/* 🛸 OWNER HEADER: BRAND GLASS */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
             <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-[2.8rem] p-[3px] bg-gradient-to-br from-[#EB4898] via-indigo-500 to-sky-400 shadow-[0_0_50px_rgba(235,72,152,0.4)]"
            >
              <div
                className="w-full h-full rounded-[2.7rem] bg-[#0d0d0f] overflow-hidden cursor-pointer flex items-center justify-center border border-white/10"
                onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-white/20" />
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
              {ownerProfile?.business_name || 'Brand ID'}
            </h1>
            <div className="flex items-center justify-center gap-3">
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#EB4898] italic">Master Status</span>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/30 italic">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* 🛸 METRIC GRID: NEXUS CARDS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Network', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-[#EB4898]' },
            { label: 'Fans', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-amber-400' },
            { label: 'Assets', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-sky-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-5 text-center shadow-xl"
            >
              <stat.icon className={cn("w-5 h-5 mx-auto mb-2 opacity-80", stat.color)} />
              <div className="text-2xl font-black tabular-nums tracking-tighter text-white leading-none">
                {stat.value}
              </div>
              <div className="text-[9px] font-black uppercase tracking-widest text-white/30 italic mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 TOKEN HUB: LIQUID GLASS */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-[#EB4898] to-indigo-600 backdrop-blur-3xl p-[2px] rounded-[2.5rem] shadow-2xl cursor-pointer"
          onClick={() => { triggerHaptic('selection'); navigate('/subscription/packages'); }}
        >
          <div className="bg-[#0d0d0f]/95 backdrop-blur-3xl rounded-[2.4rem] p-6 flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EB4898]/10 flex items-center justify-center border border-[#EB4898]/20">
                <Coins className="w-7 h-7 text-[#EB4898]" />
              </div>
              <div>
                <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-white italic leading-tight">Identity Credits</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mt-1">Available messaging tokens</p>
              </div>
            </div>
            <div className="text-3xl font-black italic tracking-tighter text-white mr-3">
              {tokenBalance || 0}
            </div>
          </div>
        </motion.div>

        {/* 🛸 PRIMARY READABLE ACTIONS */}
        <div className="space-y-4">
          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-18 rounded-[2.2rem] bg-white text-black font-black uppercase italic tracking-[0.1em] text-[15px] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_25px_50px_rgba(255,255,255,0.15)] border-none"
          >
            <User className="w-6 h-6 mr-3" />
            Control Brand Identity
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className="w-full h-18 rounded-[2.2rem] bg-[#EB4898]/10 backdrop-blur-xl border border-[#EB4898]/30 hover:bg-[#EB4898]/20 transition-all active:scale-95"
          >
            <Megaphone className="w-6 h-6 text-[#EB4898] mr-3" />
            <span className="bg-gradient-to-r from-[#EB4898] to-orange-400 bg-clip-text text-transparent font-black uppercase italic tracking-[0.15em] text-[14px]">
              Promote Brand Assets
            </span>
          </Button>
        </div>

        {/* 🛸 ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Outbound', sub: 'Linked Ready', icon: Flame, color: 'text-[#EB4898]', path: '/owner/liked-clients' },
            { label: 'Inbound', sub: 'Interested Fans', icon: ThumbsUp, color: 'text-orange-400', path: '/owner/interested-clients' }
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2.2rem] p-7 flex flex-col gap-5 text-left hover:bg-white/[0.05] transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10", nav.color)}>
                <nav.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[13px] font-black uppercase tracking-widest text-white italic leading-tight">{nav.label}</div>
                <div className="text-[10px] font-bold mt-1 text-white/30 uppercase tracking-widest">{nav.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* 🛸 ACTIVITY FEED PANEL */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#EB4898] animate-pulse" />
             <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Global Brand Pulse</h3>
          </div>
          <ActivityFeed />
        </div>

        <SharedProfileSection profileId={user?.id} profileName={ownerProfile?.business_name || 'Your Business'} isClient={false} />
        
        <div className="flex justify-center pt-4">
           <LanguageToggle />
        </div>

        {/* 🛸 NAVIGATION STACK: GLASS BUTTONS */}
        <div className="space-y-4 pt-10">
           <button
              onClick={() => { triggerHaptic('success'); navigate('/subscription/packages'); }}
              className="w-full h-18 rounded-[2.2rem] bg-gradient-to-r from-[#EB4898] to-[#ff5bb0] flex items-center justify-center gap-3 active:scale-[0.97] transition-all shadow-[0_20px_40px_rgba(235,72,152,0.3)]"
           >
              <Crown className="w-6 h-6 text-white" />
              <span className="text-[15px] font-black uppercase italic tracking-[0.1em] text-white">Unlock Admin Authority</span>
           </button>

           <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Legal Center', icon: Scale, path: '/legal' },
                { label: 'Account Authority', icon: Settings, path: '/owner/settings' },
                { label: 'De-authorize Device', icon: LogOut, path: 'signout', urgent: true }
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

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </div>
  );
};

export default OwnerProfile;
