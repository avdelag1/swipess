/**
 * Debug Client Discovery - Add this temporarily to see what's happening
 * 
 * Usage: Navigate to /owner/dashboard and check browser console
 */

export function debugClientDiscovery() {
  if (import.meta.env.DEV) {
    return {
      logFilters: (filters: any) => {
        console.log('[DEBUG] Filters received:', JSON.stringify(filters, null, 2));
        console.log('[DEBUG] clientGender:', filters?.clientGender);
        console.log('[DEBUG] clientType:', filters?.clientType);
        console.log('[DEBUG] categories:', filters?.categories);
      },
      logProfiles: (profiles: any[]) => {
        console.log('[DEBUG] Profiles count:', profiles?.length);
        if (profiles?.length > 0) {
          console.log('[DEBUG] First 3 profiles:', profiles.slice(0, 3).map(p => ({
            id: p.user_id || p.id,
            name: p.name,
            age: p.age,
            city: p.city
          })));
        }
      },
      logSwipeState: (state: any) => {
        console.log('[DEBUG] Swipe state:', {
          currentIndex: state.currentIndex,
          deckLength: state.deckQueue?.length,
          isLoading: state.isLoading
        });
      }
    };
  }
  return {
    logFilters: () => {},
    logProfiles: () => {},
    logSwipeState: () => {}
  };
}
