import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import type { EffectMode } from "./LandingBackgroundEffects";
import { uiSounds } from "@/utils/uiSounds";

const STORAGE_KEY = 'Swipess_bg_theme';

const bgThemeDisplayNames: Record<EffectMode, string> = {
  off:    'Off',
  stars:  'Starry Night',
  sunset: 'Serene Sunset Shore',
};

const bgThemeDescriptions: Record<EffectMode, string> = {
  off:    'No animated background',
  stars:  'Twinkling stars with shooting stars on tap',
  sunset: 'Coastal sunset with pelicans, waves, and rainbow on tap',
};

const bgSoundDisplayNames = {
  off: 'Silent',
  bells: 'Wind Bells',
  bowls: 'Meditation Bowls',
  waves: 'Ocean Waves',
};
export type BgSoundMode = keyof typeof bgSoundDisplayNames;

function getStoredBgTheme(): EffectMode {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'stars' || val === 'sunset' || val === 'off') return val;
  } catch { /* ignore */ }
  return 'sunset';
}

function getStoredBgSound(): BgSoundMode {
  try {
    const val = localStorage.getItem('Swipess_bg_sound');
    if (val === 'bells' || val === 'bowls' || val === 'waves' || val === 'off') return val;
  } catch { /* ignore */ }
  return 'bells';
}

export function BackgroundThemeSettings() {
  const [theme, setTheme] = useState<EffectMode>(getStoredBgTheme);
  const [soundMode, setSoundMode] = useState<BgSoundMode>(getStoredBgSound);

  const handleChange = (val: string) => {
    const next = val as EffectMode;
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }));
  };

  const handleSoundChange = (val: string) => {
    const next = val as BgSoundMode;
    setSoundMode(next);
    try { localStorage.setItem('Swipess_bg_sound', next); } catch { /* ignore */ }
    window.dispatchEvent(new StorageEvent('storage', { key: 'Swipess_bg_sound', newValue: next }));
    
    // Play sample
    if (next === 'bells') uiSounds.playStarShoot();
    if (next === 'bowls') uiSounds.playZenBowl();
    if (next === 'waves') uiSounds.playOceanWave();
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setTheme(e.newValue as EffectMode);
      }
      if (e.key === 'Swipess_bg_sound' && e.newValue) {
        setSoundMode(e.newValue as BgSoundMode);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Live Background Theme
        </CardTitle>
        <CardDescription>
          Choose the animated background and interaction sounds shown on the landing screen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bg-theme">Background Theme</Label>
          <Select value={theme} onValueChange={handleChange}>
            <SelectTrigger id="bg-theme" className="w-full">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(bgThemeDisplayNames) as EffectMode[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {bgThemeDisplayNames[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {bgThemeDescriptions[theme]}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bg-sound">Interactive Sounds</Label>
          <Select value={soundMode} onValueChange={handleSoundChange}>
            <SelectTrigger id="bg-sound" className="w-full">
              <SelectValue placeholder="Select a sound" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(bgSoundDisplayNames) as BgSoundMode[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {bgSoundDisplayNames[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Subtle sounds played when you interact with the live background
          </p>
        </div>

        {theme === 'sunset' && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">Tips</p>
            <p className="text-xs text-muted-foreground">
              Tap anywhere to summon a glowing rainbow. Tap the water to create ripples.
            </p>
          </div>
        )}
        {theme === 'stars' && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">Tips</p>
            <p className="text-xs text-muted-foreground">
              Tap anywhere to launch a shooting star.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


