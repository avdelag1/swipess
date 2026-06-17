import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { appToast } from '@/utils/appNotification';

interface DescriptionPreviewProps {
  title?: string;
  description?: string;
  accent?: 'rose' | 'amber' | 'orange' | 'cyan' | 'emerald' | 'purple';
  placeholder?: string;
  className?: string;
  enhanceType?: 'profile' | 'listing';
  polishedDescription?: string | null;
  onPolished?: (text: string) => void;
}

const ACCENT_RING: Record<NonNullable<DescriptionPreviewProps['accent']>, string> = {
  rose: 'border-rose-400/30 bg-rose-500/5',
  amber: 'border-amber-400/30 bg-amber-500/5',
  orange: 'border-orange-400/30 bg-orange-500/5',
  cyan: 'border-cyan-400/30 bg-cyan-500/5',
  emerald: 'border-emerald-400/30 bg-emerald-500/5',
  purple: 'border-purple-400/30 bg-purple-500/5',
};

export function DescriptionPreview({
  title,
  description,
  accent = 'rose',
  placeholder = 'Your selections will build a polished title and description here.',
  className,
  enhanceType = 'listing',
  polishedDescription,
  onPolished,
}: DescriptionPreviewProps) {
  const { enhanceText, isEnhancing } = useAIEnhanceText();
  const debouncedTitle = useDebouncedValue(title, 150);
  const debouncedDescription = useDebouncedValue(description, 150);
  const displayTitle = polishedDescription ? title : debouncedTitle;
  const displayDescription = polishedDescription ?? debouncedDescription;
  const hasContent = !!(displayTitle?.trim() || displayDescription?.trim());
  const canPolish = !!onPolished && !!displayDescription?.trim();

  const handlePolish = async () => {
    const raw = [displayTitle?.trim(), displayDescription?.trim()].filter(Boolean).join(' — ');
    const improved = await enhanceText(raw, enhanceType);
    if (improved) {
      onPolished?.(improved);
      appToast.success('Description polished');
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border backdrop-blur-sm px-4 py-3.5 space-y-1.5 transition-opacity duration-150',
        ACCENT_RING[accent],
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          Live preview
        </div>
        {canPolish && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isEnhancing}
            onClick={handlePolish}
            className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider gap-1 rounded-xl"
          >
            {isEnhancing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            {isEnhancing ? 'Polishing…' : 'AI polish'}
          </Button>
        )}
      </div>
      {hasContent ? (
        <div className="space-y-1">
          {displayTitle?.trim() && (
            <p className="text-sm font-bold text-foreground leading-snug">{displayTitle}</p>
          )}
          {displayDescription?.trim() && (
            <p className={cn(
              'text-xs leading-relaxed',
              polishedDescription ? 'text-foreground/90' : 'text-muted-foreground',
            )}>
              {displayDescription}
            </p>
          )}
          {polishedDescription && (
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70">
              AI polished
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          {placeholder}
        </p>
      )}
    </div>
  );
}