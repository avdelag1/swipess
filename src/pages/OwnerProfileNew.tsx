/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, User, Camera, Crown, Flame, Heart, Settings, Radio, Zap, MessageSquare, Sparkles
} from "lucide-react";
import { MyHubQuickFilters } from "@/components/MyHubQuickFilters";
import { MyHubActivityFeed } from "@/components/MyHubActivityFeed";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { haptics } from "@/utils/microPolish";
import { cn } from "@/lib/utils";

const premiumSpring = { type: "spring" as const, stiffness: 400, damping: 24, mass: 0.8 };
const stagger = { visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const childVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.94, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: premiumSpring },
};

const OwnerProfileNew = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';

  const isLoading = statsLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="w-full p-4 pb-32">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="w-full max-w-lg mx-auto p-4 pt-[calc(56px+var(--safe-top)+1rem)] pb-32 space-y-6"
      >
        {/* Profile Header */}
        <motion.div className="flex items-center gap-4" variants={childVariant}>
          <div className="relative">
            <div className="w-[88px] h-[88px] rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #E4007C, #F5DEB3)' }}>
              <div
                className="w-full h-full rounded-full bg-background overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => { haptics.tap(); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
            </div>
            <button
              onClick={() => { haptics.tap(); setShowEditDialog(true); }}
              aria-label="Edit Profile"
              title="Edit Profile"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
              style={{ background: 'linear-gradient(135deg, #E4007C, #F5DEB3)' }}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-foreground leading-tight tracking-tight">
              {ownerProfile?.business_name || 'Set up your business'}
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </motion.div>

        {/* Edit Profile Button */}
        <motion.div variants={childVariant}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.select(); setShowEditDialog(true); }}
            className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-black text-base text-white relative overflow-hidden group shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #E4007C, #D4006E)',
            }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <User className="w-5 h-5 relative z-10" />
            <span className="relative z-10 tracking-tight">Edit Business Profile</span>
          </motion.button>
        </motion.div>

        {/* Action Grid */}
        <motion.div variants={childVariant} className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); navigate('/owner/liked-clients'); }}
            className={cn(
              "rounded-2xl p-5 flex flex-col gap-3 text-left transition-all",
              isLight
                ? "bg-card border border-border/40 hover:border-border shadow-sm"
                : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
            )}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#E4007C]/20 to-[#E4007C]/5 border border-[#E4007C]/20">
              <Flame className="w-5 h-5 text-[#E4007C]" />
            </div>
            <div>
              <div className="text-sm font-black text-foreground">Your Likes</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {stats?.likedClientsCount ?? 0} Clients
              </div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); navigate('/owner/interested-clients'); }}
            className={cn(
              "rounded-2xl p-5 flex flex-col gap-3 text-left transition-all",
              isLight
                ? "bg-card border border-border/40 hover:border-border shadow-sm"
                : "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
            )}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#E4007C]/20 to-[#E4007C]/5 border border-[#E4007C]/20">
              <Heart className="w-5 h-5 text-[#E4007C]" />
            </div>
            <div>
              <div className="text-sm font-black text-foreground">Who Liked You</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {stats?.interestedClientsCount ?? 0} Interested
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Share Profile */}
        <motion.div variants={childVariant}>
          <SharedProfileSection
            profileId={user?.id}
            profileName={ownerProfile?.business_name || 'Your Business'}
            isClient={false}
          />
        </motion.div>

        {/* Radio Player */}
        <motion.div variants={childVariant}>
          <button
            onClick={() => { haptics.tap(); navigate('/radio'); }}
            className={cn(
              "w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border",
              isLight
                ? "bg-card border-border/40 text-foreground shadow-sm"
                : "bg-white/[0.04] border-white/[0.06] text-foreground"
            )}
          >
            <Radio className="w-5 h-5 text-emerald-400" />
            Radio Player
          </button>
        </motion.div>

        {/* Upgrade Button */}
        <motion.div variants={childVariant}>
          <button
            onClick={() => { haptics.success(); navigate('/subscription-packages'); }}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl mexican-pink-premium relative overflow-hidden active:scale-[0.97] transition-transform shadow-lg font-bold text-sm"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)] opacity-50" />
            <Crown className="w-5 h-5 relative z-10 drop-shadow-lg" />
            <span className="relative z-10">Premium Upgrade</span>
          </button>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div variants={childVariant} className="space-y-3">
          <button
            onClick={() => { haptics.tap(); navigate('/owner/settings'); }}
            className={cn(
              "w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border",
              isLight
                ? "bg-card border-border/40 text-foreground shadow-sm"
                : "bg-white/[0.04] border-white/[0.06] text-foreground"
            )}
          >
            <Settings className="w-5 h-5 opacity-70" />
            Settings
          </button>

          <button
            onClick={() => { haptics.warning(); signOut(); }}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border border-red-500/20 bg-red-500/5 text-red-500"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>

        <div className="h-12" />
      </motion.div>

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  );
};

export default OwnerProfileNew;
