import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone, Scale, ChevronRight, Coins
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
  const isLight = theme === 'light';

  const isLoading = statsLoading || profileLoading;

  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white overflow-x-hidden">
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[50%] bg-[#EB4898]/10 blur-[130px] rounded-full" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[110px] rounded-full" />
      </div>

      <div className="w-full max-w-lg mx-auto p-6 pt-10 pb-40 space-y-8 relative z-10">
        
        {/* 🛸 OWNER HEADER: BRAND GLASS */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
             <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-28 h-28 rounded-[2.5rem] p-[3px] bg-gradient-to-br from-[#EB4898] via-indigo-500 to-sky-400 shadow-[0_0_50px_rgba(235,72,152,0.2)]"
            >
              <div
                className="w-full h-full rounded-[2.4rem] bg-[#0d0d0f] overflow-hidden cursor-pointer flex items-center justify-center border border-white/10"
                onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-white/20" />
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

          <div className="space-y-1.5">
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
              {ownerProfile?.business_name || 'Incognito Entity'}
            </h1>
            <div className="flex items-center justify-center gap-2">
               <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#EB4898] italic">Master Profile</span>
               <div className="w-1 h-1 rounded-full bg-white/20" />
               <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30 italic">{user?.email}</span>
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
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[1.8rem] p-5 text-center shadow-xl"
            >
              <stat.icon className={cn("w-4 h-4 mx-auto mb-2 opacity-60", stat.color)} />
              <div className="text-xl font-black tabular-nums tracking-tighter text-white">
                {stat.value}
              </div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 italic mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* 🛸 TOKEN HUB: LIQUID GLASS */}
        <div 
          className="bg-gradient-to-r from-[#EB4898]/20 to-indigo-500/10 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
          onClick={() => { triggerHaptic('selection'); navigate('/subscription/packages'); }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EB4898] flex items-center justify-center shadow-[0_0_20px_rgba(235,72,152,0.4)]">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Messaging Credits</h3>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Top-up to unlock connections</p>
            </div>
          </div>
          <div className="text-2xl font-black italic tracking-tighter text-white mr-2">
            {tokenBalance || 0}
          </div>
        </div>

        {/* 🛸 PROMOTION CTA */}
        <Button
            onClick={() => { triggerHaptic('success'); navigate('/client/advertise'); }}
            className="w-full h-16 rounded-[2.2rem] bg-white text-black font-black uppercase italic tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl border-none"
        >
          <Megaphone className="w-5 h-5 mr-3" />
          Promote Your Assets
        </Button>

        {/* 🛸 ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Outbound', sub: 'Liked Clients', icon: Flame, color: 'text-[#EB4898]', path: '/owner/liked-clients' },
            { label: 'Inbound', sub: 'Interested', icon: ThumbsUp, color: 'text-amber-400', path: '/owner/interested-clients' }
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.95 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2.2rem] p-6 flex flex-col gap-4 text-left hover:bg-white/[0.05] transition-all"
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

        {/* 🛸 ACTIVITY FEED PANEL */}
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 italic mb-5 px-2">Brand Activity</h3>
          <ActivityFeed />
        </div>

        <SharedProfileSection profileId={user?.id} profileName={ownerProfile?.business_name || 'Your Business'} isClient={false} />
        <LanguageToggle />

        {/* 🛸 NAVIGATION STACK: GLASS BUTTONS */}
        <div className="space-y-3">
          {[
            { label: 'Legal Center', icon: Scale, path: '/legal' },
            { label: 'Account Systems', icon: Settings, path: '/owner/settings' }
          ].map(btn => (
             <button
              key={btn.label}
              onClick={() => { triggerHaptic('light'); navigate(btn.path); }}
              className="w-full h-15 rounded-[2.2rem] bg-white/5 backdrop-blur-md border border-white/5 flex items-center px-8 gap-4 active:scale-[0.97] transition-all"
            >
              <btn.icon className="w-4 h-4 text-sky-400/60" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70 italic">{btn.label}</span>
            </button>
          ))}

          <button
            onClick={() => { triggerHaptic('medium'); signOut(); }}
            className="w-full h-15 rounded-[2.2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 active:scale-[0.97] transition-all text-red-500"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">De-authorize Device</span>
          </button>
        </div>

        <div className="h-10" />
      </div>

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </div>
  );
};

export default OwnerProfile;
