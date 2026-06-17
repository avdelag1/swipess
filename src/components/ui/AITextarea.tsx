import { memo, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAIEnhanceText } from '@/hooks/useAIEnhanceText';
import { cn } from '@/lib/utils';

interface AITextareaProps {
  value: string;
  onChange: (value: string) => void;
  enhanceType?: 'profile' | 'listing' | 'legal';
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Textarea with a floating "✦ AI Enhance" button.
 * Calls the ai-enhance-text edge function and replaces the content in place.
 */
export const AITextarea = memo(function AITextarea({
  value,
  onChange,
  enhanceType = 'listing',
  placeholder,
  maxLength = 800,
  rows = 5,
  className,
  disabled,
}: AITextareaProps) {
  const { enhanceText, isEnhancing } = useAIEnhanceText();

  const handleEnhance = useCallback(async () => {
    const enhanced = await enhanceText(value, enhanceType);
    if (enhanced) onChange(enhanced);
  }, [value, enhanceType, enhanceText, onChange]);

  const pct = (value.length / maxLength) * 100;
  const nearLimit = value.length >= maxLength * 0.85;

  return (
    <div className="relative group">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        disabled={disabled || isEnhancing}
        autoGrow
        className={cn(
          "pb-10 transition-[border-color,box-shadow,opacity] duration-150",
          isEnhancing && "opacity-60",
          className,
        )}
      />

      {/* character bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl transition-all duration-300"
        style={{
          width: `${Math.min(pct, 100)}%`,
          background: nearLimit
            ? 'linear-gradient(to right, #f59e0b, #ef4444)'
            : 'linear-gradient(to right, hsl(var(--primary)/0.4), hsl(var(--primary)/0.7))',
        }}
      />

      {/* action bar */}
      <div className="absolute bottom-2 right-3 flex items-center gap-2">
        {maxLength && (
          <span className={cn(
            "text-[9px] uppercase tracking-widest tabular-nums",
            nearLimit ? "text-amber-500" : "text-muted-foreground/45",
          )}>
            {value.length}/{maxLength}
          </span>
        )}
        <button
          type="button"
          onClick={handleEnhance}
          disabled={!value || value.trim().length < 10 || isEnhancing || disabled}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider",
            "bg-primary/8 text-primary border border-primary/20",
            "hover:bg-primary/15 hover:border-primary/40 hover:shadow-[0_0_12px_rgba(from_var(--primary)_r_g_b_/_0.15)]",
            "disabled:opacity-30 disabled:cursor-not-allowed",
            "active:scale-95 transition-all duration-100",
            isEnhancing && "animate-pulse cursor-wait",
          )}
        >
          <Sparkles className="w-2.5 h-2.5" />
          {isEnhancing ? 'Enhancing…' : 'AI'}
        </button>
      </div>
    </div>
  );
});
