import { useVisualPreferences } from "@/hooks/useVisualPreferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PremiumCard } from "./PremiumCard";
import { FadeIn } from "./MicroInteractions";
import { Sparkles, Zap, Film, Minimize2 } from "lucide-react";

/**
 * Visual Preferences Settings Component
 * Allows users to customize their animation and visual experience
 *
 * Usage: Add this to your settings page
 */
export const VisualPreferencesSettings = () => {
  const {
    preferences,
    loading,
    setAnimationLevel,
    toggleReduceMotion,
    toggleBackgroundEffects,
    toggleHaptics,
  } = useVisualPreferences();

  if (loading) {
    return (
      <PremiumCard variant="glass" size="md">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3"></div>
          <div className="h-10 bg-white/10 rounded"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </PremiumCard>
    );
  }

  const animationLevelInfo = {
    minimal: {
      icon: <Minimize2 className="w-5 h-5" />,
      label: "Minimal",
      description: "No animations, instant transitions",
    },
    standard: {
      icon: <Zap className="w-5 h-5" />,
      label: "Standard",
      description: "Subtle animations, fast and efficient",
    },
    premium: {
      icon: <Sparkles className="w-5 h-5" />,
      label: "Premium",
      description: "Smooth animations with luxury feel (recommended)",
    },
    cinematic: {
      icon: <Film className="w-5 h-5" />,
      label: "Cinematic",
      description: "Dramatic transitions, maximum visual impact",
    },
  };

  return (
    <FadeIn>
      <PremiumCard variant="glass" size="lg" className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Visual Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize your animation and visual experience
          </p>
        </div>

        {/* Animation Level */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Animation Level</Label>
          <Select
            value={preferences.animation_level}
            onValueChange={(value) =>
              setAnimationLevel(value as "minimal" | "standard" | "premium" | "cinematic")
            }
          >
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(animationLevelInfo).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-3">
                    {info.icon}
                    <div>
                      <div className="font-medium">{info.label}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div className="space-y-1">
            <Label className="text-base font-medium">Reduce Motion</Label>
            <p className="text-sm text-muted-foreground">
              Minimize animations for accessibility
            </p>
          </div>
          <Switch
            checked={preferences.reduce_motion}
            onCheckedChange={toggleReduceMotion}
          />
        </div>

        {/* Background Effects */}
        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div className="space-y-1">
            <Label className="text-base font-medium">Background Effects</Label>
            <p className="text-sm text-muted-foreground">
              Animated gradient backgrounds
            </p>
          </div>
          <Switch
            checked={preferences.enable_background_effects}
            onCheckedChange={toggleBackgroundEffects}
          />
        </div>

        {/* Haptic Feedback */}
        <div className="flex items-center justify-between py-3 border-t border-white/10">
          <div className="space-y-1">
            <Label className="text-base font-medium">Haptic Feedback</Label>
            <p className="text-sm text-muted-foreground">
              Vibration feedback on interactions (mobile)
            </p>
          </div>
          <Switch
            checked={preferences.enable_haptics}
            onCheckedChange={toggleHaptics}
          />
        </div>

        {/* Info */}
        <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            💡 Changes are saved automatically and will apply across all your devices
          </p>
        </div>
      </PremiumCard>
    </FadeIn>
  );
};
