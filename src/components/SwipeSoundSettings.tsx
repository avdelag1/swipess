import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { appToast } from '@/utils/appNotification';
import { Vibrate, Volume2, VolumeX, Activity } from "lucide-react";
import { logger } from '@/utils/prodLogger';
import { getHapticLevel, setHapticLevel, HapticLevel, triggerHaptic } from "@/utils/haptics";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";

// iOS Safari does not support navigator.vibrate; haptics require native Capacitor.
// On Android web the Web Vibration API works directly.
const isNative = Capacitor.isNativePlatform();
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(navigator.userAgent);
const supportsWebVibration = 'vibrate' in navigator;

export function SwipeSoundSettings() {
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hapticLevel, setLocalHapticLevel] = useState<HapticLevel>(2);

  useEffect(() => {
    loadUserPreferences();
    setLocalHapticLevel(getHapticLevel());
  }, []);

  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInitialLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('swipe_sound_theme')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logger.error('Failed to fetch preferences:', error);
        setInitialLoading(false);
        return;
      }

      const userTheme = data?.swipe_sound_theme;
      setSoundsEnabled(userTheme !== 'none');
      setInitialLoading(false);
    } catch (error) {
      logger.error('Error loading preferences:', error);
      setInitialLoading(false);
    }
  };

  const handleSoundToggle = async (enabled: boolean) => {
    setSoundsEnabled(enabled);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        appToast.error('You must be logged in to save preferences');
        setLoading(false);
        return;
      }

      const newTheme = enabled ? 'default' : 'none';
      const { error } = await supabase
        .from('profiles')
        .update({ swipe_sound_theme: newTheme })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to update sound preference:', error);
        appToast.error('Failed to save sound preference');
        loadUserPreferences();
      } else {
        if (enabled) {
          appToast.success('App sounds enabled');
          // Play a small click to confirm
          const audio = new Audio('/sounds/text-notification-96707.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } else {
          appToast.success('App sounds disabled');
        }
      }
    } catch (error) {
      logger.error('Error updating sound preference:', error);
      loadUserPreferences();
    } finally {
      setLoading(false);
    }
  };

  const handleHapticsLevelChange = (level: HapticLevel) => {
    setLocalHapticLevel(level);
    setHapticLevel(level);
    
    if (level === 0) {
      appToast.success('Vibration disabled');
    } else {
      // Trigger a test vibration using the new level
      triggerHaptic('medium');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vibrate className="w-5 h-5 text-primary" />
            Vibration &amp; Haptics
          </CardTitle>
          <CardDescription>
            {isNative
              ? 'Control the intensity of physical feedback when you interact.'
              : isIOS
                ? 'Vibration requires the Swipess native app on iOS — install via Add to Home Screen.'
                : isAndroid
                  ? 'Vibration on Android web is supported when enabled below.'
                  : 'Haptic feedback via device vibration.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="haptics-toggle" className="cursor-pointer font-medium">
              Vibration
            </Label>
            <Switch
              id="haptics-toggle"
              checked={hapticLevel > 0}
              onCheckedChange={(c) => handleHapticsLevelChange(c ? 2 : 0)}
              disabled={isIOS && !isNative}
            />
          </div>
          
          {hapticLevel > 0 && (
            <div className="pt-4 border-t border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Intensity Level
                </Label>
                <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-md">
                  {hapticLevel === 1 ? 'Light' : hapticLevel === 2 ? 'Medium' : 'Heavy'}
                </span>
              </div>
              
              <div className="flex gap-2">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => handleHapticsLevelChange(level as HapticLevel)}
                    className={cn(
                      "flex-1 h-10 rounded-xl text-xs font-bold transition-all border",
                      hapticLevel === level 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                Tap a level to test the vibration intensity
              </p>
            </div>
          )}

          {isIOS && !isNative && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              iOS Safari blocks the Web Vibration API. Haptics work in the installed PWA via the native app.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {!soundsEnabled ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
            App Sounds
          </CardTitle>
          <CardDescription>
            Play subtle sounds when matching and swiping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle" className="cursor-pointer font-medium">
              Sound Effects
            </Label>
            <Switch
              id="sound-toggle"
              checked={soundsEnabled}
              onCheckedChange={handleSoundToggle}
              disabled={loading || initialLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


