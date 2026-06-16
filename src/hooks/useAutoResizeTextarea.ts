import { useEffect, useRef } from 'react';

/**
 * Auto-grows a raw <textarea> to fit its content as the user types — the key
 * "native feel" upgrade — without changing its styling. Attach the returned
 * ref to the textarea and pass the current value so it re-measures on change.
 *
 *   const ref = useAutoResizeTextarea(value);
 *   <textarea ref={ref} value={value} onChange={...} />
 *
 * For fields that use the shared <Textarea> component, use its `autoGrow` prop
 * instead — this hook is only for bespoke raw textareas.
 */
export function useAutoResizeTextarea(value: string, maxHeight = 320) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, maxHeight]);

  return ref;
}
