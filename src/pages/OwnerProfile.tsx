import { SharedProfileSection } from "@/components/SharedProfileSection";

import { Button } from "@/components/ui/button";
import { AmbientPageBackground } from "@/components/ui/AmbientPageBackground";

import { FeedbackSection } from '@/components/FeedbackSection';
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { DailyQuestBoard } from '@/components/quests/DailyQuestBoard';
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  Building2, Coins, Crown, Flame, LogOut, Megaphone, Scale as ScaleIcon, Settings, Sparkles, ThumbsUp, UserCircle, Zap
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
  const { user, signOut } = useAuth();
  const { data: stats } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useOwnerProfile();
  const { tokenBalance } = useMessagingQuota();
  const { setModal } = useModalStore();
  const navigate = useNavigate();
  const panel = isLight ? 'neo-naive-panel' : 'neo-naive-panel--dark';
  const tile = isLight ? 'neo-naive-tile' : 'neo-naive-tile--dark';

  // Only block render on the profile query itself. Stats can stream in
  // background â€” gating on stats too means the page hangs in the skeleton
  // forever whenever the stats query is slow or recovering from an error.
  if (profileLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  if (profileError && !ownerProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-6">
        <p className="text-sm font-semibold text-muted-foreground text-center">Could not load your profile.</p>
        <Button onClick={() => refetchProfile()}>Try again</Button>
      </div>
    );
  }

  return (
    <AmbientPageBackground className={cn("w-full min-h-screen text-foreground")}>
      <div className={cn("w-full px-6 layout-padding-top pb-32 space-y-10 neo-naive", !isLight && "neo-naive--dark")}>

        {/* SWIPESS OPERATOR BADGE */}
        <div className="flex items-center justify-center">
          <div className={cn("flex items-center gap-2 px-4 py-1.5", isLight ? "neo-naive-pill" : "neo-naive-pill--dark")}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FF4D00]">Swipes Operator</span>
          </div>
        </div>



        {/* SWIPESS METRIC GRID */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Network', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-[#FF4D00]', wash: 'neo-naive-wash--coral', path: '/owner/liked-clients' },
            { label: 'Followers', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-[#EB4898]', wash: 'neo-naive-wash--mint', path: '/owner/interested-clients' },
            { label: 'Assets', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-orange-400', wash: 'neo-naive-wash--lemon', path: '/owner/properties' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileTap={{ scale: 0.95 }}
              className={cn("flex flex-col items-center justify-center text-center p-5 cursor-pointer transition-all", panel)}
              onClick={() => { triggerHaptic('light'); navigate(stat.path); }}
            >
              <span className={cn('neo-naive-wash mb-2', stat.wash)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} strokeWidth={2.2} />
              </span>
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
          className={cn("flex items-center justify-between p-6 cursor-pointer transition-all", panel)}
          onClick={() => { triggerHaptic('light'); navigate('/subscription/packages'); }}
        >
          <div className="flex items-center gap-5">
            <span className="neo-naive-wash neo-naive-wash--coral">
              <Coins className="w-6 h-6 text-[#FF4D00]" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className={cn("text-[13px] font-black uppercase tracking-[0.2em] italic leading-tight", isLight ? "text-slate-900" : "text-white")}>Protocol Credits</h3>
              <p className={cn("text-[9px] font-bold uppercase tracking-[0.15em] mt-1", isLight ? "text-slate-500" : "text-white/25")}>Swipes Messaging Reserve</p>
            </div>
          </div>
          <div className="text-4xl font-black italic tracking-tighter text-[#FF4D00]">
            {tokenBalance || 0}
          </div>
        </motion.div>

        {/* DAILY QUESTS GAMIFICATION */}
        <div className="w-full">
          <DailyQuestBoard />
        </div>

        {/* PRIMARY ACTIONS */}
        <div className="space-y-3">
          <Button
            onClick={() => { triggerHaptic('heavy'); useModalStore.getState().openAIProfile('owner'); }}
            className="force-white w-full h-14 rounded-3xl relative overflow-hidden transition-all active:scale-95 border-none shadow-neumorph active:shadow-neumorph-inset bg-gradient-to-br from-cyan-500 to-indigo-600 hover:brightness-110"
          >
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Sparkles className="w-7 h-7 text-white" />
              <div className="text-left">
                <span className="block text-[16px] font-black uppercase italic tracking-[0.2em] leading-none text-white">Magic AI Profile</span>
                <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mt-1">Speak — AI builds your business profile</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => { triggerHaptic('heavy'); useModalStore.getState().openAddListing(); }}
            className="force-white w-full h-16 rounded-3xl relative overflow-hidden transition-all active:scale-95 border-none shadow-neumorph active:shadow-neumorph-inset bg-gradient-to-br from-[#FF4D00] to-[#EB4898] hover:brightness-110"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.35),transparent_70%)] pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-4">
              <Sparkles className="w-8 h-8 animate-pulse text-white" />
              <div className="text-left">
                <span className="block text-[18px] font-black uppercase italic tracking-[0.2em] leading-none text-white">Add Listing</span>
                <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mt-1">AI builder or manual — pick your category</span>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); setModal('showOwnerProfile', true); }}
            className={cn("w-full h-14 relative overflow-hidden transition-all active:scale-95", panel)}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <UserCircle className={cn("w-5 h-5", isLight ? "text-slate-700" : "text-white/80")} />
              <span className={cn("text-[13px] font-black uppercase tracking-[0.2em]", isLight ? "text-slate-900" : "text-white")}>Edit Profile</span>
            </div>
          </Button>

          <Button
            onClick={() => { triggerHaptic('medium'); navigate('/client/advertise'); }}
            className={cn("w-full h-12 transition-all active:scale-95", tile)}
          >
            <Megaphone className="w-6 h-6 text-[#FF4D00] mr-3" />
            <span className="bg-gradient-to-r from-[#FF4D00] to-[#EB4898] bg-clip-text text-transparent font-black uppercase italic tracking-[0.2em] text-[14px]">
              Promote Your Asset
            </span>
          </Button>
        </div>

        {/* ACTION NAV GRID */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Outbound', sub: 'Linked Ready', icon: Flame, color: 'text-[#FF4D00]', path: '/owner/liked-clients', wash: 'neo-naive-wash--coral' },
            { label: 'Inbound', sub: 'Active Fans', icon: ThumbsUp, color: 'text-[#EB4898]', path: '/owner/interested-clients', wash: 'neo-naive-wash--mint' },
          ].map((nav, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => { triggerHaptic('light'); navigate(nav.path); }}
              className={cn("p-7 flex flex-col gap-5 text-left transition-all", panel)}
            >
              <span className={cn('neo-naive-wash', nav.wash)}>
                <nav.icon className={cn("w-6 h-6", nav.color)} strokeWidth={2.2} />
              </span>
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
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] animate-pulse" />
              <h3 className={cn("text-[10px] font-black uppercase tracking-[0.35em]", isLight ? "text-slate-500" : "text-white/30")}>Global Activity</h3>
            </div>
            <Zap className="w-4 h-4 text-[#FF4D00]/30" />
          </div>
          <ActivityFeed />
        </div>

        <div className="py-4">
          <SharedProfileSection profileId={user?.id} profileName={ownerProfile?.business_name || 'Identity'} isClient={false} />
        </div>

        {/* PROMO CODES */}
        <div className="mt-6 mb-6">
           {/* PromoCodeSection removed to comply with App Store Guideline 3.1.1 */}
        </div>

        {/* FEEDBACK & CONTACT ADMINS */}
        <div className={cn("overflow-hidden p-6", panel)}>
           <FeedbackSection />
        </div>

        <div className="flex justify-center pt-4">
          <LanguageToggle />
        </div>

        {/* NAV STACK */}
        <div className="space-y-3 pt-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { triggerHaptic('success'); navigate('/owner/dashboard'); }}
            className="force-white w-full h-12 rounded-2xl flex items-center justify-center gap-4 active:scale-[0.97] transition-all text-white font-black uppercase italic tracking-[0.2em] text-[15px] shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #EB4898)',
            }}
          >
            <Crown className="w-6 h-6 text-white" />
            <span>Owner Dashboard</span>
          </motion.button>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Premium Package', icon: Crown, path: '/subscription/packages', premium: true },
              { label: 'Legal Center', icon: ScaleIcon, path: '/owner/legal-services' },
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
                  "w-full h-11 flex items-center px-8 gap-5 active:scale-[0.97] transition-all",
                  (btn as any).urgent
                    ? cn(tile, "bg-red-500/10 text-red-400")
                    : (btn as any).premium
                      ? cn(tile, "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-foreground")
                      : panel
                )}
              >
                <btn.icon className={cn("w-5 h-5", (btn as any).urgent ? "text-red-400" : (btn as any).premium ? "text-amber-500" : "text-foreground/80")} />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">{btn.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="h-24" />
      </div>
    </AmbientPageBackground>
  );
};

export default OwnerProfile;
