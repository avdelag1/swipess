import { memo } from 'react';
import { CornerDownLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ConciergePrivacyPortal = memo(({ onAccept, isSwipess }: { onAccept: () => void, isSwipess: boolean }) => (
  <div className={cn(
    "flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full",
    isSwipess ? "bg-black" : "bg-background"
  )}>
    <div className={cn(
      "w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-4 border relative transition-all duration-700",
      isSwipess ? "bg-primary/10 border-primary/20 shadow-[0_0_40px_rgba(var(--color-brand-primary-rgb),0.2)]" : "bg-primary/10 border-primary/20"
    )}>
      <Sparkles className={cn("w-10 h-10 animate-pulse text-primary")} />
    </div>
    <h2 className={cn(
      "text-3xl font-bold tracking-tight",
      isSwipess ? "text-white" : "text-foreground"
    )}>
      {isSwipess ? "Swipess Intel" : "Concierge AI"}
    </h2>
    <p className={cn(
      "text-sm leading-relaxed max-w-[300px]",
      isSwipess ? "text-white/50" : "text-muted-foreground"
    )}>
      Start a private conversation with your AI concierge. Your messages are confidential and powered by top-tier intelligence.
    </p>

    <div className={cn(
      "p-4 rounded-2xl border text-xs leading-snug text-center",
      isSwipess ? "bg-white/5 border-white/10 text-white/70" : "bg-muted/40 border-border text-muted-foreground"
    )}>
      <p className={cn("font-semibold mb-1.5 text-[11px]", isSwipess ? "text-white/80" : "text-foreground")}>AI Disclaimer</p>
      Swipess AI provides automated recommendations for informational purposes only. It is not a substitute for professional real estate, legal, or financial advice.
    </div>

    <div className="w-full space-y-3 mt-6">
      <Button
        onClick={onAccept}
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.97] transition-all text-primary-foreground font-bold tracking-wide text-base shadow-[0_18px_48px_hsl(var(--primary)/0.45)] ring-1 ring-primary/40 flex items-center justify-center gap-2"
      >
        Start Session
        <CornerDownLeft className="w-4 h-4 opacity-80" />
      </Button>
    </div>
  </div>
));
ConciergePrivacyPortal.displayName = 'ConciergePrivacyPortal';
