/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProfileSkeleton } from "@/components/ui/LayoutSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, Camera, Flame, ThumbsUp, Settings, Megaphone
} from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { haptics } from "@/utils/microPolish";
import { LanguageToggle } from "@/components/LanguageToggle";
import { cn } from "@/lib/utils";


const OwnerProfile = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isLoading = statsLoading || profileLoading;

  // SPEED OF LIGHT: Skip skeleton if data is already in cache
  if (isLoading && !ownerProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <>
      <div className="w-full max-w-lg mx-auto p-4 pt-2 pb-32 space-y-6 bg-background relative">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-[84px] h-[84px] rounded-full p-[2.5px] bg-gradient-to-br from-primary to-orange-500">
              <div
                className="w-full h-full rounded-full bg-background overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => { haptics.tap(); setShowEditDialog(true); }}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img src={ownerProfile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-9 h-9 text-muted-foreground/40" />
                )}
              </div>
            </div>
            <button
              onClick={() => { haptics.tap(); setShowEditDialog(true); }}
              aria-label="Edit Profile"
              title="Edit Profile"
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90 bg-primary"
            >
              <Camera className="w-3.5 h-3.5 text-primary-foreground" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground leading-tight tracking-tight">
              {ownerProfile?.business_name || 'Set up your business'}
            </h1>
            <p className="text-sm font-normal text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Liked', value: stats?.likedClientsCount ?? 0, icon: Flame, color: 'text-primary/70' },
            { label: 'Interested', value: stats?.interestedClientsCount ?? 0, icon: ThumbsUp, color: 'text-amber-500/70' },
            { label: 'Listings', value: stats?.activeProperties ?? 0, icon: Building2, color: 'text-blue-500/70' },
          ].map((stat, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl p-4 text-center border",
                isLight
                  ? "bg-card border-border/30 shadow-sm"
                  : "bg-white/[0.03] border-white/[0.06]"
              )}
            >
              <stat.icon className={cn("w-4 h-4 mx-auto mb-2", stat.color)} />
              <div className="text-lg font-black leading-none mb-1 bg-gradient-to-br from-pink-500 to-orange-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Promote/Advertise Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="lg"
            elastic
            onClick={() => { haptics.success(); navigate('/client/advertise'); }}
            className="w-full h-14 font-black text-sm relative overflow-hidden group border-2 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-primary/10 to-orange-500/10 shadow-sm transition-all"
          >
            <Megaphone className="w-5 h-5 text-primary mr-2 shrink-0" />
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent font-black uppercase tracking-tight">
              Promote Your Event
            </span>
          </Button>

        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 gap-4">
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Flame className="w-5 h-5 text-primary/70" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Your Likes</div>
              <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10">
              <ThumbsUp className="w-5 h-5 text-amber-500/70" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Who Liked You</div>
              <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                {stats?.interestedClientsCount ?? 0} Interested
              </div>
            </div>
          </motion.button>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 px-1">
            Recent Activity
          </h3>
          <ActivityFeed />
        </div>

        {/* Share Profile */}
        <div>
          <SharedProfileSection
            profileId={user?.id}
            profileName={ownerProfile?.business_name || 'Your Business'}
            isClient={false}
          />
        </div>

        {/* Language Selection */}
        <div>
          <LanguageToggle />
        </div>

        {/* Action Buttons - unified compact stack */}
        <div className="space-y-2">
          {/* Legal Hub */}
          <button
            onClick={() => { haptics.select(); navigate('/legal', { state: { from: 'dashboard' } }); }}
            className={cn(
              "w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border",
              isLight ? "bg-card border-border/40 text-foreground shadow-sm" : "bg-white/[0.04] border-white/[0.06] text-foreground"
            )}
          >
            <Scale className="w-5 h-5 opacity-70" />
            Legal Hub & Contracts
          </button>

          {/* Settings */}
          <button
            onClick={() => { haptics.tap(); navigate('/owner/settings'); }}
            className={cn(
              "w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border",
              isLight ? "bg-card border-border/40 text-foreground shadow-sm" : "bg-white/[0.04] border-white/[0.06] text-foreground"
            )}
          >
            <Settings className="w-5 h-5 opacity-70" />
            Settings
          </button>

          {/* Sign Out */}
          <button
            onClick={() => { haptics.warning(); signOut(); }}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-sm transition-all active:scale-[0.97] border border-red-500/20 bg-red-500/5 text-red-500"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        <div className="h-12" />
      </div>

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  );
};

export default OwnerProfile;
