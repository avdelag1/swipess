/**
 * SCREENSHOT PROTECTION — Best-effort prevention layer
 * 
 * This module implements multiple CSS and JS strategies to discourage
 * screenshots and screen recording on sensitive screens.
 * 
 * NOTE: Full screenshot prevention requires native APIs (iOS/Android).
 * This provides the best web-layer protection possible.
 */

/**
 * Apply CSS-based screenshot prevention to the document.
 * Prevents text/image selection and copy/paste on protected content.
 */
export function applyScreenshotProtection() {
  // 1. Prevent text selection on sensitive elements
  const style = document.createElement('style');
  style.id = 'swipess-screenshot-shield';
  style.textContent = `
    /* Prevent selection on protected elements */
    [data-protected] {
      -webkit-user-select: none !important;
      user-select: none !important;
      -webkit-touch-callout: none !important;
    }

    /* Prevent image dragging */
    [data-protected] img {
      -webkit-user-drag: none !important;
      pointer-events: none;
    }

    /* Prevent context menu on protected areas */
    [data-protected] {
      -webkit-touch-callout: none;
    }
  `;

  // Only add once
  if (!document.getElementById('swipess-screenshot-shield')) {
    document.head.appendChild(style);
  }

  // 2. Prevent right-click context menu on protected areas
  document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-protected]')) {
      e.preventDefault();
    }
  }, { passive: false });

  // 3. Prevent PrintScreen / Cmd+Shift+3/4 (limited effectiveness)
  document.addEventListener('keydown', (e) => {
    // Block PrintScreen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
    }
    // Block Cmd+Shift+3/4 (macOS screenshot shortcuts)
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
      e.preventDefault();
    }
  });
}

/**
 * Blur content when app goes to background (multitasking view protection).
 * This prevents screenshots from the iOS/Android task switcher.
 */
export function enableBackgroundBlur() {
  const blurOverlay = document.createElement('div');
  blurOverlay.id = 'swipess-bg-blur';
  blurOverlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Add logo hint when blurred
  blurOverlay.innerHTML = `
    <div style="text-align: center; opacity: 0.6;">
      <div style="font-size: 24px; font-weight: 900; color: white; font-style: italic; letter-spacing: -0.5px;">
        Swipess
      </div>
    </div>
  `;

  document.body.appendChild(blurOverlay);

  document.addEventListener('visibilitychange', () => {
    const overlay = document.getElementById('swipess-bg-blur');
    if (!overlay) return;

    if (document.hidden) {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
    } else {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  });

  // Also handle iOS-specific events
  window.addEventListener('pagehide', () => {
    const overlay = document.getElementById('swipess-bg-blur');
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
    }
  });

  window.addEventListener('pageshow', () => {
    const overlay = document.getElementById('swipess-bg-blur');
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
  });
}
