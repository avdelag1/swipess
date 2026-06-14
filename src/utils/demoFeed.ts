/** Demo/seed cards only in dev or when explicitly enabled. */
export function isDemoFeedEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_FEED === 'true';
}