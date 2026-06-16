import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const GlobalThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content' as any)
          .select('*')
          .eq('page_key', 'global_theme');

        if (error) throw error;

        if (data && data.length > 0) {
          const root = document.documentElement;

          data.forEach((item: any) => {
            const val = item.text_value;
            if (!val) return;

            if (item.section_key === 'primary_color') {
              root.style.setProperty('--theme-primary-hex', val);
            }
            if (item.section_key === 'secondary_color') {
              root.style.setProperty('--theme-secondary-hex', val);
            }
            if (item.section_key === 'border_radius') {
              root.style.setProperty('--radius', `${val}rem`);
            }
            if (item.section_key === 'app_font') {
              root.style.setProperty('--font-sans', `"${val}", sans-serif`);
              document.body.style.fontFamily = `"${val}", sans-serif`;
              
              const link = document.createElement('link');
              link.href = `https://fonts.googleapis.com/css2?family=${val.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
              link.rel = 'stylesheet';
              document.head.appendChild(link);
            }
          });
        }
      } catch (err) {
        console.error('Failed to load global theme:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
    
    const channel = supabase.channel('theme-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_content',
        filter: 'page_key=eq.global_theme'
      }, () => {
        loadTheme();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
        }
        .bg-primary {
          background-color: var(--theme-primary-hex, hsl(var(--primary))) !important;
        }
        .text-primary {
          color: var(--theme-primary-hex, hsl(var(--primary))) !important;
        }
        .border-primary {
          border-color: var(--theme-primary-hex, hsl(var(--primary))) !important;
        }
        .bg-secondary {
          background-color: var(--theme-secondary-hex, hsl(var(--secondary))) !important;
        }
      `}</style>
      {children}
    </>
  );
};
