import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AnimationLevel } from "@/visual/MotionConfig";

/**
 * User Visual Preferences Hook
 * Manages user's animation and visual settings
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

export function useVisualPreferences() {
  const [preferences, setPreferences] = useState<VisualPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Check for system-level reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        setPreferences((prev) => ({
          ...prev,
          reduce_motion: true,
          animation_level: "minimal",
        }));
      }
    };

    // Check initial state
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // User not logged in, use defaults
        setPreferences(DEFAULT_PREFERENCES);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_visual_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No preferences found, create default
          await createDefaultPreferences(user.id);
        } else {
          console.error("Error loading visual preferences:", error);
          setPreferences(DEFAULT_PREFERENCES);
        }
      } else if (data) {
        setPreferences(data as VisualPreferences);
      }
    } catch (error) {
      console.error("Error in loadPreferences:", error);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_visual_preferences")
        .insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating default preferences:", error);
      } else if (data) {
        setPreferences(data as VisualPreferences);
      }
    } catch (error) {
      console.error("Error in createDefaultPreferences:", error);
    }
  };

  const updatePreferences = async (updates: Partial<VisualPreferences>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Not authenticated",
          description: "Please sign in to update preferences",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from("user_visual_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating preferences:", error);
        toast({
          title: "Update failed",
          description: "Could not save visual preferences",
          variant: "destructive",
        });
      } else if (data) {
        setPreferences(data as VisualPreferences);
        toast({
          title: "Preferences updated",
          description: "Your visual preferences have been saved",
        });
      }
    } catch (error) {
      console.error("Error in updatePreferences:", error);
    }
  };

  const setAnimationLevel = (level: AnimationLevel) => {
    updatePreferences({ animation_level: level });
  };

  const setVisualMode = (mode: "minimal" | "premium" | "luxury" | "cinematic") => {
    updatePreferences({ visual_mode: mode });
  };

  const toggleReduceMotion = () => {
    updatePreferences({ reduce_motion: !preferences.reduce_motion });
  };

  const toggleBackgroundEffects = () => {
    updatePreferences({ enable_background_effects: !preferences.enable_background_effects });
  };

  const toggleHaptics = () => {
    updatePreferences({ enable_haptics: !preferences.enable_haptics });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    setAnimationLevel,
    setVisualMode,
    toggleReduceMotion,
    toggleBackgroundEffects,
    toggleHaptics,
    refresh: loadPreferences,
  };
}
