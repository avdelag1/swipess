import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SwipeTheme, themeDisplayNames } from "@/utils/sounds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Volume2, VolumeX, Vibrate } from "lucide-react";
import { logger } from '@/utils/prodLogger';
import { getHapticPreference, setHapticPreference } from "@/utils/haptics";
import { Capacitor } from "@capacitor/core";

// iOS Safari does not support navigator.vibrate; haptics require native Capacitor.
// On Android web the Web Vibration API works directly.
const isNative = Capacitor.isNativePlatform();
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /android/i.test(navigator.userAgent);
const supportsWebVibration = 'vibrate' in navigator;

export function SwipeSoundSettings() {
  const [theme, setTheme] = useState<SwipeTheme>('none');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  useEffect(() => {
    loadUserTheme();
    setHapticsEnabled(getHapticPreference());
  }, []);

  const loadUserTheme = async () => {
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
        logger.error('Failed to fetch swipe sound theme:', error);
        toast.error('Failed to load sound preferences');
        setInitialLoading(false);
        return;
      }

      const userTheme = (data?.swipe_sound_theme as SwipeTheme) || 'none';
      setTheme(userTheme);
      setInitialLoading(false);
    } catch (error) {
      logger.error('Error loading swipe sound theme:', error);
      setInitialLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: SwipeTheme) => {
    setTheme(newTheme);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save preferences');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ swipe_sound_theme: newTheme })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to update swipe sound theme:', error);
        toast.error('Failed to save sound preference');
        loadUserTheme();
      } else {
        toast.success(`Sound theme changed to ${themeDisplayNames[newTheme]}`);
      }
    } catch (error) {
      logger.error('Error updating swipe sound theme:', error);
      toast.error('Failed to save sound preference');
      loadUserTheme();
    } finally {
      setLoading(false);
    }
  };

  const handleHapticsChange = (enabled: boolean) => {
    setHapticsEnabled(enabled);
    setHapticPreference(enabled);
    if (enabled) {
      toast.success('Haptic feedback enabled');
    } else {
      toast.success('Haptic feedback disabled');
    }
  };

  const themeDescriptions: Record<SwipeTheme, string> = {
    none: 'Silent mode - no sounds will play',
    book: 'Satisfying page turning sounds',
    water: 'Calming water droplets and splashes',
    funny: 'Like = random funny sound 🎉 · Dislike = random fart 💨',
    calm: 'Peaceful meditation bells',
    randomZen: 'Random zen sounds - bells, gongs, and chimes'
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
              ? 'Native haptic feedback on swipes and interactions.'
              : isIOS
                ? 'Vibration requires the Swipess native app on iOS — install via Add to Home Screen.'
                : isAndroid
                  ? 'Vibration on Android web is supported when enabled below.'
                  : 'Haptic feedback via device vibration.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="haptics-toggle" className="cursor-pointer">
              {isNative ? 'Enable Haptics' : isIOS ? 'Haptics (iOS Native)' : 'Enable Vibration'}
            </Label>
            <Switch
              id="haptics-toggle"
              checked={hapticsEnabled}
              onCheckedChange={handleHapticsChange}
              disabled={isIOS && !isNative}
            />
          </div>
          {isIOS && !isNative && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              iOS Safari blocks the Web Vibration API. Haptics work in the installed PWA via the native Swipess app.
            </p>
          )}
          {!isIOS && !isNative && supportsWebVibration && (
            <p className="text-xs text-muted-foreground">
              Android vibration is active. Short pulses fire on each swipe.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'none' ? (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-primary" />
            )}
            Swipe Sound Theme
          </CardTitle>
          <CardDescription>
            Customize the sounds that play when you swipe on properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="swipe-theme">Sound Theme</Label>
            <Select
              value={theme}
              onValueChange={(value) => handleThemeChange(value as SwipeTheme)}
              disabled={loading || initialLoading}
            >
              <SelectTrigger id="swipe-theme" className="w-full">
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(themeDisplayNames) as SwipeTheme[]).map((themeKey) => (
                  <SelectItem key={themeKey} value={themeKey}>
                    {themeDisplayNames[themeKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {themeDescriptions[theme]}
            </p>
          </div>

          {theme !== 'none' && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-foreground">Note</p>
              <p className="text-xs text-muted-foreground">
                Sounds will play when you swipe left or right on properties.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


