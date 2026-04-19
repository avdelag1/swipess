import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/**
 * Must be rendered as a child of <MapContainer>. React-Leaflet caches the
 * parent's computed size at mount time, so when the map boots inside an
 * animating AnimatePresence child (or before dvh flushes on iOS Safari) it
 * locks at 0×0 and renders a blank grey canvas. This kicks invalidateSize()
 * on the next frame, again after animation settle, on any observed resize,
 * and on window resize / orientationchange.
 */
export function LeafletAutoResize() {
  const map = useMap();

  useEffect(() => {
    const el = map.getContainer();
    let cancelled = false;

    const kick = () => {
      if (cancelled) return;
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* map may be disposed mid-transition; swallow */
      }
    };

    const raf = requestAnimationFrame(kick);
    const t1 = window.setTimeout(kick, 250);
    const t2 = window.setTimeout(kick, 600);

    const ro = new ResizeObserver(kick);
    ro.observe(el);

    window.addEventListener('resize', kick);
    window.addEventListener('orientationchange', kick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener('resize', kick);
      window.removeEventListener('orientationchange', kick);
    };
  }, [map]);

  return null;
}

export default LeafletAutoResize;
