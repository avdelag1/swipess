import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SwipeTheme, themeDisplayNames } from "@/utils/sounds";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Volume2, VolumeX } from "lucide-react";

export function SwipeSoundSettings() {
  const [theme, setTheme] = useState<SwipeTheme>('none');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserTheme();
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
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch swipe sound theme:', error);
        toast.error('Failed to load sound preferences');
        setInitialLoading(false);
        return;
      }

      const userTheme = (data?.swipe_sound_theme as SwipeTheme) || 'none';
      setTheme(userTheme);
      setInitialLoading(false);
    } catch (error) {
      console.error('Error loading swipe sound theme:', error);
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
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update swipe sound theme:', error);
        toast.error('Failed to save sound preference');
        // Revert to previous theme on error
        loadUserTheme();
      } else {
        toast.success(`Sound theme changed to ${themeDisplayNames[newTheme]}`);
      }
    } catch (error) {
      console.error('Error updating swipe sound theme:', error);
      toast.error('Failed to save sound preference');
      loadUserTheme();
    } finally {
      setLoading(false);
    }
  };

  const themeDescriptions: Record<SwipeTheme, string> = {
    none: 'Silent mode - no sounds will play',
    book: 'Satisfying page turning sounds',
    water: 'Calming water droplets and splashes',
    funny: 'Playful and humorous sound effects',
    calm: 'Peaceful meditation bells',
    randomZen: 'Random zen sounds - bells, gongs, and chimes'
  };

  return (
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
              {theme === 'randomZen' && ' Random Zen picks a different sound each time.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
