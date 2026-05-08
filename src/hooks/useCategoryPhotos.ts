import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { POKER_CARD_PHOTOS } from '@/components/swipe/CardData';


const DEFAULT_CATEGORY_CAROUSEL_EXTRAS: Record<string, string[]> = {
  property: [
    '/images/filters/property_jungle_villa.jpg',
    '/images/filters/property_loft_interior.jpg',
    '/images/filters/property_bamboo_dome.jpg',
  ],
  motorcycle: [
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200',
  ],
  bicycle: [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=1200',
  ],
  services: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1200',
  ],
  worker: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1200',
  ],
  'all-clients': [
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200',
  ],
  buyers: [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
  ],
  renters: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d8b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200',
  ],
  hire: [
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
  ],
};

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
  const fallbackExtras = DEFAULT_CATEGORY_CAROUSEL_EXTRAS[categoryId] ?? [];
  const more = extras?.[categoryId] ?? [];
  const list: string[] = [];
  if (base) list.push(base);
  for (const url of [...fallbackExtras, ...more]) {
    if (url && !list.includes(url)) list.push(url);
  }
  return list.length > 0 ? list : (base ? [base] : []);
}