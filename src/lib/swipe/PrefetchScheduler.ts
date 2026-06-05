/**
 * PrefetchScheduler - Throttles prefetch operations to prevent competition with image decoding
 * Uses requestIdleCallback to defer prefetch until browser is idle
 *
 * Shared utility used by both SwipessSwipeContainer and ClientSwipeContainer
 */
export class PrefetchScheduler {
  private scheduled = false;
  private callback: (() => void) | null = null;
  private idleHandle: number | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  schedule(callback: () => void, delayMs = 300): void {
    this.cancel();

    this.callback = callback;
    this.scheduled = true;

    this.timeoutHandle = setTimeout(() => {
      this.timeoutHandle = null;
      if (!this.scheduled || !this.callback) return;

      if ('requestIdleCallback' in window) {
        this.idleHandle = (window as any).requestIdleCallback(() => {
          if (this.callback) this.callback();
          this.scheduled = false;
        }, { timeout: 2000 });
      } else {
        this.callback();
        this.scheduled = false;
      }
    }, delayMs);
  }

  cancel(): void {
    this.scheduled = false;
    this.callback = null;
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    if (this.idleHandle !== null && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(this.idleHandle);
      this.idleHandle = null;
    }
  }
}


