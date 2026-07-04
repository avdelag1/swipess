import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SiteContent } from '@/hooks/useSiteContent';

export function CMSPreviewListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only listen for messages if we are loaded inside an iframe (preview mode)
    if (window === window.top) return;

    const handleMessage = (event: MessageEvent) => {
      // Security check: in production, verify event.origin
      // For local development, we allow localhost
      if (
        event.origin !== 'http://localhost:5173' &&
        event.origin !== 'https://admin.swipess.com'
      ) {
        return;
      }

      const data = event.data;
      if (data?.type !== 'SWIPESS_CMS_UPDATE') return;

      const payload = data.payload;

      if (payload.type === 'theme') {
        const theme = payload.theme;
        const root = document.documentElement;

        if (theme.primary) {
          root.style.setProperty('--theme-primary-hex', theme.primary);
        }
        if (theme.accent) {
          root.style.setProperty('--theme-secondary-hex', theme.accent);
        }
        if (theme.heading_font || theme.body_font) {
          const font = theme.heading_font || theme.body_font;
          root.style.setProperty('--font-sans', `"${font}", sans-serif`);
          document.body.style.fontFamily = `"${font}", sans-serif`;

          const link = document.createElement('link');
          link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      } else if (payload.type === 'content') {
        const { pageKey, sectionKey, value } = payload;
        
        // Update the React Query cache instantly
        queryClient.setQueryData<Record<string, SiteContent>>(
          ['site_content', pageKey],
          (oldData) => {
            const currentItem = oldData?.[sectionKey];
            
            // Generate a temporary mock item if it doesn't exist
            const updatedItem: SiteContent = currentItem ? {
              ...currentItem,
              text_value: typeof value === 'string' ? value : currentItem.text_value,
              image_url: typeof value === 'string' && value.startsWith('http') ? value : currentItem.image_url,
              meta: typeof value !== 'string' ? { ...currentItem.meta, value } : currentItem.meta
            } : {
              id: 'temp-id',
              page_key: pageKey,
              section_key: sectionKey,
              content_type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text',
              text_value: typeof value === 'string' ? value : null,
              image_url: null,
              meta: typeof value !== 'string' ? { value } : {}
            };

            return {
              ...(oldData || {}),
              [sectionKey]: updatedItem
            };
          }
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  return null;
}
