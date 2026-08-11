export type HardwareTier = 'low' | 'mid' | 'high';

/** Classify device for blur/animation tiering (Safari-safe). */
export function detectHardwareTier(): HardwareTier {
  if (typeof navigator === 'undefined') return 'high';

  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (mem != null && mem <= 3) return 'low';
  if (cores <= 3) return 'low';

  if (mem != null && mem <= 5) return 'mid';
  if (cores <= 5) return 'mid';

  // Safari often hides deviceMemory — treat iOS Safari as mid unless flagship cores
  if (isSafari && isIOS && cores <= 6) return 'mid';

  return 'high';
}

export function applyHardwareTierClasses(): HardwareTier {
  const tier = detectHardwareTier();
  const apply = (el: Element | null) => {
    if (!el) return;
    el.classList.remove('hw-low', 'hw-mid', 'hw-high');
    el.classList.add(tier === 'low' ? 'hw-low' : tier === 'mid' ? 'hw-mid' : 'hw-high');
    if (tier !== 'low') el.classList.add('perf-ultra');
  };
  apply(document.documentElement);
  apply(document.body);
  return tier;
}