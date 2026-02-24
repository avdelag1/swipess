/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, User, Camera, ArrowLeft, Crown, Flame, Palette, Heart, Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

const fastSpring = { type: "spring" as const, stiffness: 600, damping: 28, mass: 0.6 };
const stagger = { staggerChildren: 0.06, delayChildren: 0.02 };
const childVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: fastSpring },
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
        className="w-full px-4 py-4 pb-28"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: stagger } }}
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back Button */}
          <motion.button
            variants={childVariant}
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/owner/dashboard')}
            whileTap={{ scale: 0.94 }}
            className={`flex items-center gap-1.5 text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-white'} mb-2 px-3 py-2 rounded-xl transition-all active:scale-95`}
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: isLight ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.06)' : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>

          {/* Profile Header — gradient ring */}
          <motion.div className="flex items-center gap-4" variants={childVariant}>
            <div className="relative">
              <div className="w-[88px] h-[88px] rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}>
                <div
                  className="w-full h-full rounded-full bg-background overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => setShowEditDialog(true)}
                >
                  {ownerProfile?.profile_images?.[0] ? (
                    <img src={ownerProfile.profile_images[0]} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 text-muted-foreground" />
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
                {ownerProfile?.business_name || 'Set up your business'}
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
              Edit Business Profile
            </motion.button>
          </motion.div>

          {/* Likes Row — horizontal 2-card */}
          <motion.div variants={childVariant} className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/owner/liked-clients')}
              className="rounded-2xl p-4 flex flex-col gap-2 text-left"
              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c2d12, #f97316)' }}>
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Your Likes</div>
                <div className="text-xs text-muted-foreground">{stats?.likedClientsCount ?? 0} clients liked</div>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/owner/interested-clients')}
              className="rounded-2xl p-4 flex flex-col gap-2 text-left"
              style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(12px)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #831843, #ec4899)' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Who Liked You</div>
                <div className="text-xs text-muted-foreground">{stats?.interestedClientsCount ?? 0} interested</div>
              </div>
            </motion.button>
          </motion.div>

          {/* Share Profile Section */}
          <SharedProfileSection
            profileId={user?.id}
            profileName={ownerProfile?.business_name || 'Your Business'}
            isClient={false}
          />

          {/* Filter Colors / Theme */}
          <motion.div variants={childVariant}>
            <div className="rounded-2xl p-4" style={{ background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)', border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
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
              onClick={() => navigate('/owner/settings')}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl font-medium text-base transition-colors"
              style={{
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                border: isLight ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.10)',
                color: isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)',
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

      <OwnerProfileDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
    </>
  );
};

export default OwnerProfileNew;
