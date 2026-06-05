import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';

export interface SiteContent {
  id: string;
  page_key: string;
  section_key: string;
  content_type: string;
  text_value: string | null;
  image_url: string | null;
  meta: any;
}

export function useSiteContent(pageKey: string) {
  return useQuery({
    queryKey: ['site_content', pageKey],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .eq('page_key', pageKey);

        if (error) {
          logger.error(`Error fetching site content for ${pageKey}:`, error);
          throw error;
        }

        // Convert the flat array into a key-value object mapped by section_key
        const contentMap: Record<string, SiteContent> = {};
        if (data) {
          data.forEach((item: any) => {
            contentMap[item.section_key] = item;
          });
        }
        
        return contentMap;
      } catch (err) {
        logger.error(`Failed to load site content for ${pageKey}`, err);
        return {};
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Helper to get a specific value based on its expected type
export function getContentValue(
  contentMap: Record<string, SiteContent> | undefined,
  sectionKey: string,
  defaultValue: any = null
) {
  if (!contentMap || !contentMap[sectionKey]) return defaultValue;
  
  const item = contentMap[sectionKey];
  
  switch (item.content_type) {
    case 'text':
      return item.text_value || defaultValue;
    case 'image':
      return item.image_url || defaultValue;
    case 'boolean':
      return item.meta?.value ?? defaultValue;
    case 'number':
      return item.meta?.value ?? defaultValue;
    case 'color':
      return item.meta?.value || defaultValue;
    case 'icon':
      return item.meta?.value || defaultValue;
    default:
      return defaultValue;
  }
}
