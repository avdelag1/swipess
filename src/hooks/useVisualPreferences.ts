import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { AnimationLevel } from "@/visual/MotionConfig";

/**
 * User Visual Preferences Hook
 * Manages user's animation and visual settings locally (no DB table)
 */

export interface VisualPreferences {
  id?: string;
  user_id?: string;
  animation_level: AnimationLevel;
  visual_mode: "minimal" | "premium" | "luxury" | "cinematic";
  reduce_motion: boolean;
  enable_background_effects: boolean;
  enable_haptics: boolean;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PREFERENCES: VisualPreferences = {
  animation_level: "premium",
  visual_mode: "luxury",
  reduce_motion: false,
  enable_background_effects: true,
  enable_haptics: true,
};

const STORAGE_KEY = "swipess_visual_preferences";

function loadFromStorage(): VisualPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULT_PREFERENCES;
}

function saveToStorage(prefs: VisualPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

export function useVisualPreferences() {
  const [preferences, setPreferences] = useState<VisualPreferences>(loadFromStorage);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check for system-level reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setPreferences((prev) => {
          const updated = { ...prev, reduce_motion: true, animation_level: "minimal" as AnimationLevel };
          saveToStorage(updated);
          return updated;
        });
      }
    };
    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const updatePreferences = async (updates: Partial<VisualPreferences>) => {
    const updated = { ...preferences, ...updates };
    setPreferences(updated);
    saveToStorage(updated);
    toast({ title: "Preferences updated", description: "Your visual preferences have been saved" });
  };

  const setAnimationLevel = (level: AnimationLevel) => updatePreferences({ animation_level: level });
  const setVisualMode = (mode: "minimal" | "premium" | "luxury" | "cinematic") => updatePreferences({ visual_mode: mode });
  const toggleReduceMotion = () => updatePreferences({ reduce_motion: !preferences.reduce_motion });
  const toggleBackgroundEffects = () => updatePreferences({ enable_background_effects: !preferences.enable_background_effects });
  const toggleHaptics = () => updatePreferences({ enable_haptics: !preferences.enable_haptics });

  return {
    preferences,
    loading,
    updatePreferences,
    setAnimationLevel,
    setVisualMode,
    toggleReduceMotion,
    toggleBackgroundEffects,
    toggleHaptics,
    refresh: () => setPreferences(loadFromStorage()),
  };
}
