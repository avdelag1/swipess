/** Warm the Lottie chunk + common swipe-action animations during idle time. */
export function preloadLottieBundle() {
  if (typeof window === 'undefined') return;

  const run = () => {
    void import('lottie-react');
    void import('@/assets/animations/heart-elastic.json');
    void import('@/assets/animations/dislike-elastic.json');
    void import('@/assets/animations/generic-pop.json');
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 1200);
  }
}