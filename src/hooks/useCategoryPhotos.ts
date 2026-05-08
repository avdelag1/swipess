import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { POKER_CARD_PHOTOS } from '@/components/swipe/CardData';

export interface CategoryPhoto {
  id: string;
  category_id: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

/**
 * Fetch all admin-managed extra photos for the quick-filter cards.
 * Falls back gracefully to the static defaults if the table is empty
 * or the network is offline.
 */
export function useCategoryPhotos() {
  return useQuery({
    queryKey: ['category-photos'],
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase
        .from('category_photos' as any)
        .select('category_id, image_url, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const map: Record<string, string[]> = {};
      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
          if (!map[row.category_id]) map[row.category_id] = [];
          map[row.category_id].push(row.image_url);
        }
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Build the full photo list for one category card:
 * static default first, then admin-uploaded extras.
 */
export function getCategoryPhotoList(
  categoryId: string,
  extras: Record<string, string[]> | undefined,
): string[] {
  const base = POKER_CARD_PHOTOS[categoryId];
  const more = extras?.[categoryId] ?? [];
  const list: string[] = [];
  if (base) list.push(base);
  for (const url of more) {
    if (url && !list.includes(url)) list.push(url);
  }
  return list.length > 0 ? list : (base ? [base] : []);
}