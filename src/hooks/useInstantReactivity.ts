import { useEffect } from 'react';
import { triggerHaptic } from '@/utils/haptics';

export function useInstantReactivity() {
  useEffect(() => {
    // ━━━━━━━ ZENITH PROTOCOL: Speed of Light Interaction Engine ━━━━━━━ //
    // Bypasses React's event loop completely to provide 0ms visual and haptic
    // feedback on any interactive element before the `onClick` event registers.
    
    let activeElement: HTMLElement | null = null;
    let isTouchScrolling = false;

    // Detect if user is just scrolling (we don't want to trap the active state)
    const handleScroll = () => {
      isTouchScrolling = true;
      if (activeElement) {
        removeActiveState();
      }
    };

    const removeActiveState = () => {
      if (activeElement) {
        activeElement.classList.remove('instant-active-element');
        activeElement = null;
      }
    };

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      isTouchScrolling = false;
      
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find the closest interactive element
      const interactiveEl = target.closest('button, a, [role="button"], .interactive, .touchable') as HTMLElement;
      
      // Ignore if it's disabled, or if it's part of a native input (we don't want to shrink text inputs)
      if (
        !interactiveEl || 
        interactiveEl.hasAttribute('disabled') ||
        (interactiveEl.tagName === 'INPUT' && interactiveEl.getAttribute('type') !== 'submit' && interactiveEl.getAttribute('type') !== 'button') ||
        interactiveEl.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Found an interactive element. Inject 0ms active state.
      activeElement = interactiveEl;
      activeElement.classList.add('instant-active-element');
      
      // Fire the absolute fastest hardware haptic (Light impact)
      triggerHaptic('light');
    };

    const handleRelease = () => {
      removeActiveState();
    };

    // Attach passive listeners to the absolute root document for 0ms overhead
    const options = { passive: true, capture: true };
    
    document.addEventListener('pointerdown', handlePointerDown, options);
    document.addEventListener('pointerup', handleRelease, options);
    document.addEventListener('pointercancel', handleRelease, options);
    
    // Also listen to touch events specifically to guarantee it works flawlessly on iOS PWA
    document.addEventListener('touchstart', handlePointerDown, options);
    document.addEventListener('touchend', handleRelease, options);
    document.addEventListener('touchcancel', handleRelease, options);
    
    // Scroll cancels the active press state to avoid stuck buttons
    document.addEventListener('scroll', handleScroll, options);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, options);
      document.removeEventListener('pointerup', handleRelease, options);
      document.removeEventListener('pointercancel', handleRelease, options);
      
      document.removeEventListener('touchstart', handlePointerDown, options);
      document.removeEventListener('touchend', handleRelease, options);
      document.removeEventListener('touchcancel', handleRelease, options);
      
      document.removeEventListener('scroll', handleScroll, options);
    };
  }, []);
}


