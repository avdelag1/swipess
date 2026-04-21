import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTheme, Theme } from "@/hooks/useTheme";
import { Paintbrush, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

const THEMES: { id: Theme; name: string; description: string; colors: string[] }[] = [
  { 
    id: 'light', 
    name: 'Daylight', 
    description: 'Clean and bright professional look',
    colors: ['#FFFFFF', '#3b82f6'] 
  },
  { 
    id: 'dark', 
    name: 'Midnight', 
    description: 'Deep matte black for focus',
    colors: ['#000000', '#f97316'] 
  },
  { 
    id: 'cheers', 
    name: 'Cheers', 
    description: 'Warm golden safari energy',
    colors: ['#180800', '#C8A96B'] 
  },
  { 
    id: 'nexus-style', 
    name: 'Zenith Liquid', 
    description: 'AI-Native high efficiency interface',
    colors: ['#000000', '#00E5FF', '#121212'] 
  },
];


export function GlobalThemeSettings() {
  const { theme: currentTheme, setTheme } = useTheme();

  const handleThemeChange = (id: Theme, e: React.MouseEvent) => {
    triggerHaptic('medium');
    setTheme(id, { x: e.clientX, y: e.clientY });
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-primary" />
          App Visual Style
        </CardTitle>
        <CardDescription>
          Personalize your entire experience with a curated theme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={(e) => handleThemeChange(theme.id, e)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all relative overflow-hidden group",
                currentTheme === theme.id 
                  ? "bg-primary/10 border-primary" 
                  : "bg-muted/50 border-border hover:bg-muted/80"
              )}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex -space-x-2">
                  {theme.colors.map((c, i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full border-2 border-background shadow-sm" 
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="font-bold text-foreground text-sm flex items-center gap-2">
                    {theme.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
              </div>

              {currentTheme === theme.id && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center relative z-10">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              {/* Background preview subtle effect */}

            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

