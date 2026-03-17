/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { ClientProfileDialog } from "@/components/ClientProfileDialog";
import { PhotoPreview } from "@/components/PhotoPreview";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut, User, Camera, Sparkles, Crown,
  Flame, ThumbsUp, Settings, Radio, Zap, MessageSquare
} from "lucide-react";
import { useClientStats } from "@/hooks/useClientStats";
import { MyHubQuickFilters } from "@/components/MyHubQuickFilters";
import { MyHubActivityFeed } from "@/components/MyHubActivityFeed";
import { ExploreFeatureLinks } from "@/components/ExploreFeatureLinks";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { haptics } from "@/utils/microPolish";
import { LanguageToggle } from "@/components/LanguageToggle";

const premiumSpring = { type: "spring" as const, stiffness: 400, damping: 24, mass: 0.8 };
const stagger = { visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } } };
// No blur — blur animations trigger expensive GPU re-compositing on every frame
const childVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: premiumSpring },
};

const ClientProfileNew = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
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
        className="w-full max-w-lg mx-auto p-4 pt-4 pb-4 space-y-6 bg-background min-h-full"
      >
        {/* Profile Header */}
        <motion.div className="flex items-center gap-4" variants={childVariant}>
          <div className="relative">
            <div className="w-[84px] h-[84px] rounded-full p-[2.5px]" style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent-2))' }}>
              <div
                className="w-full h-full rounded-full bg-background overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={() => { haptics.tap(); if (profile?.profile_images?.length) { handlePhotoClick(0); } else { setShowEditDialog(true); } }}
              >
                {profile?.profile_images?.[0] ? (
                  <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-9 h-9 text-muted-foreground/40" />
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
              {profile?.name || 'Set up your profile'}
            </h1>
            <p className="text-sm font-normal text-muted-foreground mt-0.5">{user?.email}</p>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div variants={childVariant} className="grid grid-cols-3 gap-3">
          {[
            { label: 'Likes', value: stats?.likesReceived ?? 0, icon: ThumbsUp, color: 'text-primary/70' },
            { label: 'Matches', value: stats?.matchesCount ?? 0, icon: Sparkles, color: 'text-amber-500/70' },
            { label: 'Chats', value: stats?.activeChats ?? 0, icon: MessageSquare, color: 'text-blue-500/70' },
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
              <div className="text-lg font-semibold text-foreground leading-none mb-1">{stat.value}</div>
              <div className="text-[10px] font-medium text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Edit Profile Button */}
        <motion.div variants={childVariant}>
          <Button
            variant="gradient"
            size="lg"
            elastic
            onClick={() => { haptics.select(); setShowEditDialog(true); }}
            className="w-full h-14 font-black text-base mexican-pink-premium"
          >
            <User className="w-5 h-5" />
            Edit Profile
          </Button>
        </motion.div>

        {/* Profile Completion */}
        {profile && completionPercent < 100 && (
          <motion.div variants={childVariant}>
            <div
              className="rounded-2xl p-5 cursor-pointer border transition-all hover:bg-muted/50"
              style={{
                background: isLight ? 'rgba(228,0,124,0.03)' : 'rgba(228,0,124,0.05)',
                borderColor: 'rgba(228,0,124,0.15)',
              }}
              onClick={() => { haptics.select(); setShowEditDialog(true); }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Profile completion</span>
                </div>
                <span className="text-sm font-semibold text-primary">{completionPercent}%</span>
              </div>
              <Progress value={completionPercent} className="h-2 rounded-full" />
              <p className="text-xs font-normal text-muted-foreground mt-3 leading-relaxed">
                Complete profiles get 3x more interest. Tap to finish.
              </p>
            </div>
          </motion.div>
        )}

        {/* Action Grid */}
        <motion.div variants={childVariant} className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); navigate('/client/liked-properties'); }}
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
              <div className="text-[11px] font-normal mt-0.5 text-muted-foreground">Properties</div>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { haptics.tap(); navigate('/client/who-liked-you'); }}
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
              <div className="text-[11px] font-normal mt-0.5 text-muted-foreground">Interested</div>
            </div>
          </motion.button>
        </motion.div>

        {/* Bio Section */}
        {profile?.bio && (
          <motion.div variants={childVariant} className={cn(
            "rounded-2xl p-6 border",
            isLight ? "bg-muted/30 border-border/40" : "bg-white/[0.02] border-white/[0.05]"
          )}>
            <h3 className="text-xs font-medium text-muted-foreground mb-3">About you</h3>
            <p className="text-sm font-normal text-foreground leading-relaxed">"{profile.bio}"</p>
          </motion.div>
        )}

        {/* Interests Section */}
        {profile?.interests && profile.interests.length > 0 && (
          <motion.div variants={childVariant} className={cn(
            "rounded-2xl p-6 border",
            isLight ? "bg-muted/30 border-border/40" : "bg-white/[0.02] border-white/[0.05]"
          )}>
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                    isLight
                      ? "bg-muted/60 text-foreground/80 border border-border/30"
                      : "bg-white/[0.06] text-foreground/80 border border-white/[0.08]"
                  )}
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Discover Categories */}
        <motion.div variants={childVariant}>
          <MyHubQuickFilters />
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={childVariant}>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 px-1">
            Recent Activity
          </h3>
          <MyHubActivityFeed />
        </motion.div>

        {/* Share Profile */}
        <motion.div variants={childVariant}>
          <SharedProfileSection
            profileId={user?.id}
            profileName={profile?.name || 'Your Profile'}
            isClient={true}
          />
        </motion.div>

        {/* Language Selection */}
        <motion.div variants={childVariant}>
          <LanguageToggle />
        </motion.div>

        {/* Action Buttons - unified compact stack */}
        <motion.div variants={childVariant} className="space-y-2">
          {/* Premium Package */}
          <button
            onClick={() => { haptics.success(); navigate('/subscription-packages'); }}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl mexican-pink-premium relative overflow-hidden active:scale-[0.97] transition-transform shadow-lg font-bold text-sm"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)] opacity-50" />
            <Crown className="w-5 h-5 relative z-10 drop-shadow-lg" />
            <span className="relative z-10">Premium Package</span>
          </button>

          {/* Radio Station */}
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
            Radio Station
          </button>

          {/* Settings */}
          <button
            onClick={() => { haptics.tap(); navigate('/client/settings'); }}
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

          {/* Sign Out */}
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

      <ClientProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />

      <PhotoPreview
        photos={profile?.profile_images || []}
        isOpen={showPhotoPreview}
        onClose={() => setShowPhotoPreview(false)}
        initialIndex={selectedPhotoIndex}
      />
    </>
  );
};

export default ClientProfileNew;
