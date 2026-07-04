import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SiteContent } from '@/hooks/useSiteContent';

/**
 * CMSPreviewListener — Unified handler for all CMS live preview updates.
 * 
 * This component listens for `SWIPESS_CMS_UPDATE` postMessage events from the
 * admin CMS iframe parent. It handles:
 * 
 * 1. CSS Variable injection (colors, shadows, borders, gradients, sizes, fonts)
 * 2. React Query cache updates (text, images, booleans, numbers)
 * 3. Google Fonts dynamic loading
 * 4. Effect class toggling
 * 
 * It is the SINGLE source of truth for CMS preview — App.tsx does NOT have
 * its own listener.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse the pipe-delimited gradient value into a CSS gradient string */
function parseGradient(raw: string): string {
  const parts = raw.split('|');
  const type = parts[0] || 'linear';
  const angle = parts[1] || '135';
  const c1 = parts[2] || '#8B5CF6';
  const c2 = parts[3] || '#EC4899';
  return type === 'radial'
    ? `radial-gradient(circle, ${c1}, ${c2})`
    : `linear-gradient(${angle}deg, ${c1}, ${c2})`;
}

/** Parse the pipe-delimited border value into a CSS border shorthand */
function parseBorder(raw: string): string {
  const parts = raw.split('|');
  const width = parts[0] || '1';
  const style = parts[1] || 'solid';
  const color = parts[2] || 'rgba(255,255,255,0.2)';
  return `${width}px ${style} ${color}`;
}

/** Parse the pipe-delimited spacing value into a CSS padding shorthand */
function parseSpacing(raw: string): string {
  const parts = raw.split('|');
  const top = parts[0] || '16';
  const right = parts[1] || '16';
  const bottom = parts[2] || '16';
  const left = parts[3] || '16';
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

/** Load a Google Font dynamically */
function loadGoogleFont(fontName: string): void {
  if (!fontName) return;
  const id = `gfont-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return; // already loaded
  
  const link = document.createElement('link');
  link.id = id;
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}

/** Set a CSS custom property on :root */
function setCSSVar(name: string, value: string): void {
  document.documentElement.style.setProperty(`--${name}`, value);
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CMSPreviewListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only activate in iframe (preview) mode
    if (window === window.top) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data?.type !== 'SWIPESS_CMS_UPDATE') return;

      const payload = data.payload;
      if (!payload) return;

      // ─── Theme updates ──────────────────────────────────────────────
      if (payload.type === 'theme') {
        const theme = payload.theme;
        const root = document.documentElement;

        if (theme.primary) {
          root.style.setProperty('--theme-primary-hex', theme.primary);
          root.style.setProperty('--primary', theme.primary);
        }
        if (theme.accent) {
          root.style.setProperty('--theme-secondary-hex', theme.accent);
          root.style.setProperty('--accent', theme.accent);
        }
        if (theme.heading_font) {
          loadGoogleFont(theme.heading_font);
          root.style.setProperty('--font-heading', `"${theme.heading_font}", sans-serif`);
        }
        if (theme.body_font) {
          loadGoogleFont(theme.body_font);
          root.style.setProperty('--font-sans', `"${theme.body_font}", sans-serif`);
          document.body.style.fontFamily = `"${theme.body_font}", sans-serif`;
        }
        return;
      }

      // ─── Content updates ────────────────────────────────────────────
      if (payload.type === 'content') {
        const { pageKey, sectionKey, value, fieldType } = payload;
        const strValue = typeof value === 'string' ? value : String(value ?? '');

        // ── Apply CSS variable based on fieldType ──────────────────────
        if (fieldType) {
          switch (fieldType) {
            case 'color':
              setCSSVar(sectionKey, strValue);
              break;

            case 'gradient':
              if (strValue.includes('|')) {
                setCSSVar(sectionKey, parseGradient(strValue));
              }
              break;

            case 'shadow':
              setCSSVar(sectionKey, strValue);
              break;

            case 'border':
              if (strValue.includes('|')) {
                setCSSVar(sectionKey, parseBorder(strValue));
              }
              break;

            case 'slider':
              // Determine units by key name
              if (sectionKey.includes('radius')) {
                setCSSVar(sectionKey, `${strValue}%`);
              } else {
                setCSSVar(sectionKey, `${strValue}px`);
              }
              break;

            case 'number':
              if (sectionKey.includes('radius')) {
                setCSSVar(sectionKey, `${strValue}px`);
              } else if (sectionKey.includes('size')) {
                setCSSVar(sectionKey, `${strValue}px`);
              } else {
                setCSSVar(sectionKey, strValue);
              }
              break;

            case 'font_select':
              if (strValue) {
                loadGoogleFont(strValue);
                setCSSVar(`${sectionKey}-font`, `"${strValue}", sans-serif`);
                setCSSVar('font-sans', `"${strValue}", sans-serif`);
              }
              break;

            case 'effect':
              // Apply effect as a data attribute for CSS targeting
              document.documentElement.setAttribute('data-cms-effect', strValue);
              break;

            case 'spacing':
              if (strValue.includes('|')) {
                setCSSVar(sectionKey, parseSpacing(strValue));
              }
              break;

            case 'palette':
              try {
                const palette = JSON.parse(strValue);
                Object.entries(palette).forEach(([colorKey, colorVal]) => {
                  setCSSVar(`palette-${colorKey}`, colorVal as string);
                });
              } catch { /* ignore parse errors */ }
              break;

            case 'boolean':
              // Booleans go to React Query cache only
              break;

            case 'image':
              // Images go to React Query cache only
              break;

            default:
              // text and anything else — set as CSS var too in case components use it
              if (strValue) {
                setCSSVar(sectionKey, strValue);
              }
              break;
          }
        }

        // ── Always update React Query cache for instant component updates ──
        queryClient.setQueryData<Record<string, SiteContent>>(
          ['site_content', pageKey],
          (oldData) => {
            const currentItem = oldData?.[sectionKey];
            
            const updatedItem: SiteContent = currentItem ? {
              ...currentItem,
              text_value: typeof value === 'string' ? value : currentItem.text_value,
              image_url: typeof value === 'string' && (value.startsWith('http') || value.startsWith('/')) ? value : currentItem.image_url,
              meta: typeof value !== 'string' ? { ...currentItem.meta, value } : currentItem.meta
            } : {
              id: `preview-${sectionKey}`,
              page_key: pageKey,
              section_key: sectionKey,
              content_type: fieldType || (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text'),
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
