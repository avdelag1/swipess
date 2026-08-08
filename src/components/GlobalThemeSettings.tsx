
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Theme, useAppTheme } from "@/hooks/useAppTheme";
import { Check, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

const THEMES: { id: Theme; name: string; description: string; colors: string[] }[] = [
  { 
    id: 'dark', 
    name: 'Dark', 
    description: 'Layered charcoal with Liquid Glass',
    colors: ['#0a0a0d', '#16161c', '#ffffff'] 
  },
  { 
    id: 'light', 
    name: 'Light', 
    description: 'Clean layered surfaces with Liquid Glass',
    colors: ['#F2F2F7', '#FFFFFF', '#111111'] 
  },
];


export function GlobalThemeSettings() {
  const { theme: currentTheme, setTheme } = useAppTheme();

  const handleThemeChange = (id: Theme, e: React.MouseEvent) => {
    triggerHaptic('medium');
    setTheme(id, { x: e.clientX, y: e.clientY });
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="w-5 h-5 text-primary" />
          Appearance
        </CardTitle>
        <CardDescription>
          Dark or Light — layered depth, not flat color
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
                    {currentTheme === theme.id && (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {theme.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
