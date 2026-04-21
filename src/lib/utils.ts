import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 🚀 runIdleTask: Execute high-CPU tasks without blocking the main thread
 * - Uses requestIdleCallback for native jank-prevention
 * - Falls back to setTimeout(0) for older environments
 * - Essential for 'Speed of Light' experience on mobile
 */
export function runIdleTask(task: () => void) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => task(), { timeout: 2000 });
  } else {
    setTimeout(task, 0);
  }
}

