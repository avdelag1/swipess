/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { OwnerProfileDialog } from "@/components/OwnerProfileDialog";
import { SharedProfileSection } from "@/components/SharedProfileSection";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerStats } from "@/hooks/useOwnerStats";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import {
  LogOut, Building2, User,
  Camera, ArrowLeft, Crown, Settings as SettingsIcon,
  Flame, Palette, Heart, Scale, FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

const OwnerProfileNew = () => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { user, signOut } = useAuth();
  const { data: stats, isLoading: statsLoading } = useOwnerStats();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile();
  const navigate = useNavigate();

  const isLoading = statsLoading || profileLoading;

  if (isLoading) {
    return (
      <>
        <div className="w-full p-4 pb-32">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="w-full px-5 py-4 pb-24">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Profile Header */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fastSpring}
          >
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setShowEditDialog(true)}
              >
                {ownerProfile?.profile_images?.[0] ? (
                  <img
                    src={ownerProfile.profile_images[0]}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
              <button
                onClick={() => setShowEditDialog(true)}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                {ownerProfile?.business_name || 'Set up your business'}
              </h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </motion.div>

          {/* Edit Profile Button - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.03 }}
          >
            <Button
              onClick={() => setShowEditDialog(true)}
              className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base shadow-lg"
            >
              <User className="w-5 h-5" />
              Edit Profile
            </Button>
          </motion.div>

          {/* Share Profile Section - Earn Free Messages */}
          <SharedProfileSection
            profileId={user?.id}
            profileName={ownerProfile?.business_name || 'Your Business'}
            isClient={false}
          />

          {/* Your Liked Clients */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.15 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <button
                  onClick={() => navigate('/owner/liked-clients')}
                  className="w-full flex items-center gap-3"
                >
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">Your Likes</div>
                    <div className="text-sm text-muted-foreground">Clients you've liked</div>
                  </div>
                  <div className="text-lg font-bold text-foreground">{stats?.likedClientsCount ?? 0}</div>
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clients Who Liked You */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.17 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-4">
                <button
                  onClick={() => navigate('/owner/interested-clients')}
                  className="w-full flex items-center gap-3"
                >
                  <Heart className="w-5 h-5 text-pink-500" />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">Who Liked You</div>
                    <div className="text-sm text-muted-foreground">See who's interested in your listings</div>
                  </div>
                  <div className="text-lg font-bold text-foreground">{stats?.interestedClientsCount ?? 0}</div>
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filter Colors / Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  <CardTitle>Filter Colors</CardTitle>
                </div>
                <CardDescription>
                  Customize your app appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSelector compact showTitle={false} />
              </CardContent>
            </Card>
          </motion.div>

          <Separator className="my-4" />

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.25 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <button
                  onClick={() => navigate('/owner/properties')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border"
                >
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left text-foreground">Manage Listings</span>
                </button>
                <button
                  onClick={() => navigate('/owner/contracts')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border"
                >
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span className="flex-1 text-left text-foreground">Contract Management</span>
                </button>
                <button
                  onClick={() => navigate('/owner/legal-services')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border"
                >
                  <Scale className="w-5 h-5 text-purple-500" />
                  <span className="flex-1 text-left text-foreground">Legal Services</span>
                </button>
                <button
                  onClick={() => navigate('/subscription-packages')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b border-border"
                >
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="flex-1 text-left text-foreground">Subscription</span>
                </button>
                <button
                  onClick={() => navigate('/owner/settings')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                >
                  <SettingsIcon className="w-5 h-5 text-gray-500" />
                  <span className="flex-1 text-left text-foreground">Settings</span>
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fastSpring, delay: 0.3 }}
          >
            <Button
              onClick={signOut}
              variant="outline"
              className="w-full h-12 gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </motion.div>

          {/* Bottom spacing for navigation */}
          <div className="h-8" />
        </div>
      </div>

      <OwnerProfileDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};

export default OwnerProfileNew;
