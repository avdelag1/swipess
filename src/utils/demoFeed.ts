/** Demo client cards — still on for owner/testing flows. */
export function isDemoFeedEnabled(): boolean {
  return true;
}

/** Demo listing cards — off so the property deck shows real Supabase listings. */
export function isDemoListingFeedEnabled(): boolean {
  return false;
}