/**
 * 🚀 NEXUS SUSPENSE FALLBACK
 * 
 * NEVER shows the full Swipess logo splash between pages.
 * Instead, renders a minimal, invisible-feeling transition that lets
 * the persistent layout (header, nav, bottom bar) stay on screen.
 * 
 * For Apple review: page transitions must feel instant. A full-screen
 * branded loader between every page looks broken and amateurish.
 */

interface SuspenseFallbackProps {
  className?: string;
  minimal?: boolean;
}

export function SuspenseFallback({ className, minimal = false }: SuspenseFallbackProps) {
  // ALWAYS return a minimal, transparent placeholder.
  // The persistent layout (TopBar, BottomNav) stays visible at all times,
  // so the user never sees a jarring full-screen loader between pages.
  return (
    <div
      className={`flex-1 w-full min-h-[60vh] ${className ?? ''}`}
      aria-busy="true"
      aria-label="Loading content"
    />
  );
}

export default SuspenseFallback;
