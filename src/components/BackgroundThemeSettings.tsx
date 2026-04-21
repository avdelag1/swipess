import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import type { EffectMode } from "./LandingBackgroundEffects";

const STORAGE_KEY = 'NEXUS DISCOVERY_bg_theme';

export const bgThemeDisplayNames: Record<EffectMode, string> = {
  off:    'Off',
  stars:  'Starry Night',
  sunset: 'Serene Sunset Shore',
};

const bgThemeDescriptions: Record<EffectMode, string> = {
  off:    'No animated background',
  stars:  'Twinkling stars with shooting stars on tap',
  sunset: 'Coastal sunset with pelicans, waves, and rainbow on tap',
};

export function getStoredBgTheme(): EffectMode {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val === 'stars' || val === 'sunset' || val === 'off') return val;
  } catch { /* ignore */ }
  return 'sunset';
}

export function BackgroundThemeSettings() {
  const [theme, setTheme] = useState<EffectMode>(getStoredBgTheme);

  const handleChange = (val: string) => {
    const next = val as EffectMode;
    setTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
    // Notify other tabs / components
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }));
  };

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setTheme(e.newValue as EffectMode);
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
          Choose the animated background shown on the landing screen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

