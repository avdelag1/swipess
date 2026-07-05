import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Grow the field to fit its content as the user types (no inner scrollbar).
   * Opt-in so existing fixed-height usages (chat, dialogs) are untouched.
   */
  autoGrow?: boolean;
  /** Cap auto-grow height (px). Beyond this the field scrolls. Default 320. */
  maxHeight?: number;
  /**
   * Show a live "used/limit" counter under the field. Requires `maxLength`.
   * Turns amber as the user nears the limit. Adds a wrapping <div>.
   */
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow = false, maxHeight = 320, showCount = false, onChange, value, defaultValue, maxLength, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge the forwarded ref with our internal one so auto-grow can measure.
    const setRefs = React.useCallback((node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    }, [ref]);

    const resize = React.useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoGrow) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
      el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [autoGrow, maxHeight]);

    // Resize on mount and whenever the controlled value changes externally.
    React.useLayoutEffect(() => {
      if (autoGrow) resize();
    }, [autoGrow, resize, value, defaultValue]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoGrow) resize();
      onChange?.(e);
    };

    const textarea = (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 hover:border-black/20 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:border-primary/50 focus-visible:bg-transparent focus-visible:shadow-[0_0_0_2px_rgba(var(--primary),0.2)] disabled:cursor-not-allowed disabled:opacity-50 transition-[border-color,box-shadow,background-color,height] duration-150 ease-out",
          autoGrow && "resize-none",
          className
        )}
        ref={setRefs}
        onChange={handleChange}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        {...props}
      />
    );

    // Only wrap (changing DOM) when a counter is requested — every other usage
    // keeps the exact same single-element output it had before.
    if (!showCount || maxLength == null) return textarea;

    const currentLength = typeof value === "string"
      ? value.length
      : (innerRef.current?.value.length ?? 0);
    const nearLimit = currentLength >= maxLength * 0.9;

    return (
      <div className="w-full">
        {textarea}
        <p
          className={cn(
            "mt-1 pr-1 text-right text-[10px] uppercase tracking-widest tabular-nums transition-colors",
            nearLimit ? "text-amber-500" : "text-muted-foreground"
          )}
        >
          {currentLength}/{maxLength}
        </p>
      </div>
    );
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
