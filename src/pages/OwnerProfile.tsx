import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone, Scale, Coins, User, UserCircle, Crown, Sparkles, Zap
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { triggerHaptic } from "@/utils/haptics";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";
import { useMessagingQuota } from "@/hooks/useMessagingQuota";
import { useModalStore } from "@/state/modalStore";
import useAppTheme from "@/hooks/useAppTheme";

const OwnerProfile = () => {
  const { isLight } = useAppTheme();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const { tokenBalance } = useMessagingQuota();
  const { setModal } = useModalStore();
  const navigate = useNavigate();

  const isLoading = statsLoading || profileLoading;

  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <div className={cn("w-full relative overflow-x-hidden min-h-screen", isLight ? "bg-white text-slate-900" : "bg-[#030308] text-white")}>

      {/* Swipess Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={cn("absolute inset-0", isLight ? "opacity-[0.02]" : "opacity-[0.035]")}
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        <div className={cn("absolute top-[-20%] left-[-10%] w-[70%] h-[60%] rounded-full blur-[140px]", isLight ? "bg-cyan-500/[0.04]" : "bg-cyan-500/8")} />
        <div className={cn("absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]", isLight ? "bg-violet-600/[0.04]" : "bg-violet-600/8")} />
        <div className={cn("absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full blur-[100px]", isLight ? "bg-blue-600/[0.03]" : "bg-blue-600/5")} />
      </div>

      <div className="w-full max-w-7xl mx-auto p-6 pt-4 pb-12 space-y-10 relative z-10">

        {/* SWIPESS OPERATOR BADGE */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-cyan-400">Swipess Operator</span>
          </div>
        </div>

        {/* IDENTITY CORE */}
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="w-36 h-36 p-[2px] shadow-[0_0_60px_rgba(0,212,255,0.2)]"
              style={{
                borderRadius: '1.8rem',
                background: 'linear-gradient(135deg, #00D4FF, #7C3AED, #0EA5E9)',
              }}
            >
              <div
                className={cn("w-full h-full overflow-hidden cursor-pointer flex items-center justify-center border", isLight ? "bg-slate-50 border-slate-200" : "bg-[#080C14] border-white/5")}
                style={{ borderRadius: '1.85rem' }}
                onClick={() => { triggerHaptic('light'); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Brand" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className={cn("w-16 h-16", isLight ? "text-slate-300" : "text-white/10")} />
                )}
              </div>
            </motion.div>

            {/* Scan ring */}
            <motion.div
              className="absolute inset-[-6px] rounded-[2.4rem] border border-cyan-500/20 pointer-events-none"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <button
              onClick={() => { triggerHaptic('light'); setShowEditDialog(true); }}
              className="absolute -bottom-3 -right-3 w-12 h-12 flex items-center justify-center shadow-2xl transition-all active:scale-90 z-20 bg-[#0EA5E9] rounded-2xl border border-cyan-300/20"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="space-y-2">
            <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>
              {ownerProfile?.business_name || 'Brand'}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className={cn("text-[10px] font-black uppercase tracking-[0.25em]", isLight ? "text-slate-500" : "text-white/25")}>{user?.email}</span>
            </div>
          </div>
        </div>

        {/* SWIPESS METRIC GRID */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Network', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-cyan-400', border: 'border-cyan-500/15', glow: 'rgba(0,212,255,0.15)' },
            { label: 'Followers', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-violet-400', border: 'border-violet-500/15', glow: 'rgba(124,58,237,0.15)' },
            { label: 'Assets', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-blue-400', border: 'border-blue-500/15', glow: 'rgba(59,130,246,0.15)' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn("flex flex-col items-center justify-center text-center p-5 rounded-3xl border", isLight ? "border-slate-200 bg-slate-50" : "bg-white/[0.02]")}
              style={{ borderColor: isLight ? undefined : `rgba(255,255,255,0.06)`, boxShadow: `inset 0 0 30px ${stat.glow}` }}
            >
              <stat.icon className={cn("w-5 h-5 mb-3", stat.color)} />
              <div className={cn("text-4xl font-black tabular-nums tracking-tighter leading-none", isLight ? "text-slate-900" : "text-white")}>
                {stat.value}
              </div>
              <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mt-2", isLight ? "text-slate-500" : "text-white/30")}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* POWER CORE */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={cn("flex items-center justify-between p-6 rounded-3xl cursor-pointer border", isLight ? "border-slate-200 bg-slate-50" : "border-white/[0.06] bg-white/[0.02]")}
          style={{ boxShadow: 'inset 0 0 40px rgba(0,212,255,0.06)' }}
          onClick={() => { triggerHaptic('light'); navigate('/subscription/packages'); }}
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Coins className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className={cn("text-[13px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-slate-900" : "text-white")}>Global Credits</h3>
              <p className={cn("text-[9px] font-bold uppercase tracking-[0.15em] mt-1", isLight ? "text-slate-500" : "text-white/25")}>Swipess Messaging Reserve</p>
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tighter text-cyan-400">
            {tokenBalance || 0}
          </div>
        </motion.div>

        {/* PRIMARY ACTIONS */}
        <div className="space-y-3">
          <Button
            onClick={() => { triggerHaptic('heavy'); setModal('showAIListing', true); }}
            className="w-full h-24 rounded-3xl relative overflow-hidden transition-all active:scale-95 border-none shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #6366F1, #7C3AED, #EC4899)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Sparkles className="w-8 h-8 animate-pulse text-white" />
              <div className="text-left">
                <span className="block text-[18px] font-black uppercase italic tracking-[0.2em] leading-none text-white">Magic AI Listing</span>
                <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mt-1">Flagship Intelligence v4</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); setShowEditDialog(true); }}
            className="w-full h-16 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[15px] transition-all border-none text-white"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #0EA5E9, #7C3AED)',
              boxShadow: '0 20px 50px rgba(0,212,255,0.25)',
            }}
          >
            <User className="w-6 h-6 mr-3" />
            <span>Control Brand ID</span>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn("w-full h-16 rounded-2xl transition-all active:scale-95 border", isLight ? "border-slate-200 bg-slate-50 hover:bg-slate-100" : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]")}
          >
            <Megaphone className="w-6 h-6 text-violet-400 mr-3" />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[14px]">
              Promote Your Event
            </span>
          </Button>
        </div>

        {/* ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Outbound', sub: 'Linked Ready', icon: Flame, color: 'text-cyan-400', path: '/owner/liked-clients', glow: 'rgba(0,212,255,0.08)' },
            { label: 'Inbound', sub: 'Active Fans', icon: ThumbsUp, color: 'text-violet-400', path: '/owner/interested-clients', glow: 'rgba(124,58,237,0.08)' },
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className={cn("rounded-3xl p-7 flex flex-col gap-5 text-left border transition-all", isLight ? "border-slate-200 bg-slate-50 hover:bg-slate-100" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]")}
              style={{ boxShadow: `inset 0 0 30px ${nav.glow}` }}
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", isLight ? "border-slate-200 bg-white" : "border-white/[0.08] bg-white/[0.04]")}>
                <nav.icon className={cn("w-6 h-6", nav.color)} />
              </div>
              <div>
                <div className={cn("text-[13px] font-black uppercase tracking-[0.1em] italic leading-tight", isLight ? "text-slate-900" : "text-white")}>{nav.label}</div>
                <div className={cn("text-[10px] font-bold mt-1 uppercase tracking-widest", isLight ? "text-slate-500" : "text-white/25")}>{nav.sub}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* ACTIVITY FEED */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.35em]", isLight ? "text-slate-500" : "text-white/30")}>Activity Feed</h3>
            </div>
            <Zap className="w-4 h-4 text-cyan-400/30" />
          </div>
          <ActivityFeed />
        </div>

        <div className="py-4">
          <SharedProfileSection profileId={user?.id} profileName={ownerProfile?.business_name || 'Your Business'} isClient={false} />
        </div>

        <div className="flex justify-center pt-4">
          <LanguageToggle />
        </div>

        {/* NAV STACK */}
        <div className="space-y-3 pt-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { triggerHaptic('success'); navigate('/owner/dashboard'); }}
            className="w-full h-16 rounded-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all text-white font-black uppercase italic tracking-[0.2em] text-[15px]"
            style={{
              background: 'linear-gradient(135deg, #00D4FF, #0EA5E9, #7C3AED)',
              boxShadow: '0 20px 50px rgba(0,212,255,0.2)',
            }}
          >
            <Crown className="w-6 h-6 text-white" />
            <span>Owner Dashboard</span>
          </motion.button>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Legal Center', icon: Scale, path: '/owner/legal-services' },
              { label: 'Account Settings', icon: Settings, path: '/owner/settings' },
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
                    : isLight
                      ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      : "bg-white/[0.03] border-white/[0.06] text-white/70 hover:bg-white/[0.05]"
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

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </div>
  );
};

export default OwnerProfile;
