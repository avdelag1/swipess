/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { ClientProfileDialog } from "@/components/ClientProfileDialog";
import { PhotoPreview } from "@/components/PhotoPreview";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useState, useCallback } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut, User, Camera, Sparkles, Crown, ArrowLeft,
  Flame, Palette, Heart, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const fastSpring = { type: "spring" as const, stiffness: 600, damping: 28, mass: 0.6 };
const stagger = { staggerChildren: 0.06, delayChildren: 0.02 };
const childVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: fastSpring },
};

const ClientProfileNew = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const { data: profile, isLoading } = useClientProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
        className="w-full px-4 py-4 pb-28"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: stagger } }}
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back Button */}
          <motion.button
            variants={childVariant}
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.8 }}
            className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white/90 transition-colors mb-2 px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>

          {/* Profile Header — gradient ring avatar */}
          <motion.div className="flex items-center gap-4" variants={childVariant}>
            <div className="relative">
              {/* Gradient ring */}
              <div className="w-[88px] h-[88px] rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}>
                <div
                  className="w-full h-full rounded-full bg-background overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => profile?.profile_images?.length ? handlePhotoClick(0) : setShowEditDialog(true)}
                >
                  {profile?.profile_images?.[0] ? (
                    <img src={profile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowEditDialog(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {profile?.name || 'Set up your profile'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </motion.div>

          {/* Edit Profile — brand gradient pill */}
          <motion.div variants={childVariant}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowEditDialog(true)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-semibold text-base text-white"
              style={{
                background: 'linear-gradient(135deg, #ec4899, #f97316)',
                boxShadow: '0 4px 20px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <User className="w-5 h-5" />
              Edit Profile
            </motion.button>
          </motion.div>

          {/* Profile Completion */}
          {completionPercent < 100 && (
            <motion.div variants={childVariant}>
              <div
                className="rounded-2xl p-4 cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(12px)' }}
                onClick={() => setShowEditDialog(true)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span className="text-sm font-medium text-foreground">Complete your profile</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#ec4899' }}>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-2">Complete profiles get more matches! Tap to edit.</p>
              </div>
            </motion.div>
          )}

          {/* Likes Row — horizontal 2-card */}
          <motion.div variants={childVariant} className="grid grid-cols-2 gap-3">
            {/* Your Likes */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/client/liked-properties')}
              className="rounded-2xl p-4 flex flex-col gap-2 text-left"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c2d12, #f97316)' }}>
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Your Likes</div>
                <div className="text-xs text-muted-foreground">Properties liked</div>
              </div>
            </motion.button>
            {/* Who Liked You */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/client/who-liked-you')}
              className="rounded-2xl p-4 flex flex-col gap-2 text-left"
              style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #831843, #ec4899)' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Who Liked You</div>
                <div className="text-xs text-muted-foreground">Owners interested</div>
              </div>
            </motion.button>
          </motion.div>

          {/* About & Interests */}
          {(profile?.bio || profile?.interests?.length > 0) && (
            <motion.div variants={childVariant} className="space-y-3">
              {profile?.bio && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">About</h3>
                  <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}
              {profile?.interests?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={`interest-${interest}`}
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: 'rgba(236,72,153,0.15)', color: '#f9a8d4', border: '1px solid rgba(236,72,153,0.25)' }}
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Share Profile Section */}
          <SharedProfileSection
            profileId={user?.id}
            profileName={profile?.name || 'Your Profile'}
            isClient={true}
          />

          {/* Filter Colors / Theme */}
          <motion.div variants={childVariant}>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4c1d95, #a855f7)' }}>
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Filter Colors</div>
                  <div className="text-xs text-muted-foreground">Customize appearance</div>
                </div>
              </div>
              <ThemeSelector compact showTitle={false} />
            </div>
          </motion.div>

          {/* Subscription — amber/gold pill */}
          <motion.div variants={childVariant}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/subscription-packages')}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-semibold text-base text-white"
              style={{
                background: 'linear-gradient(135deg, #92400e, #f59e0b)',
                boxShadow: '0 4px 20px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <Crown className="w-5 h-5" />
              Upgrade Subscription
            </motion.button>
          </motion.div>

          {/* Settings button */}
          <motion.div variants={childVariant}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/client/settings')}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-medium text-base transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              <Settings className="w-5 h-5" />
              Settings
            </motion.button>
          </motion.div>

          {/* Sign Out — red outline pill */}
          <motion.div variants={childVariant}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={signOut}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-medium text-base transition-colors"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
              }}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </motion.button>
          </motion.div>

          <div className="h-8" />
        </div>
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
