import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteContentItem {
  id: string;
  page_key: string;
  section_key: string;
  content_type: string;
  text_value: string | null;
  image_url: string | null;
  meta: Record<string, any> | null;
  is_published?: boolean;
  draft_text_value?: string | null;
  draft_image_url?: string | null;
  draft_meta?: Record<string, any> | null;
  updated_at: string;
}

interface SiteContentMap {
  [sectionKey: string]: SiteContentItem;
}

export function useSiteContent(pageKey: string) {
  const [content, setContent] = useState<SiteContentMap>({});
  const [isLoading, setIsLoading] = useState(true);

  const cmsPreview = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("cms_preview") === "1";

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("site_content")
          .select("*")
          .eq("page_key", pageKey);
        if (error) throw error;
        const map: SiteContentMap = {};
        (data || []).forEach((item: any) => {
          map[item.section_key] = item;
        });
        setContent(map);
      } catch (err) {
        console.warn("Failed to load site content for", pageKey, err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [pageKey]);

  const resolveText = (item?: SiteContentItem): string | null => {
    if (!item) return null;
    if (cmsPreview && item.draft_text_value) return item.draft_text_value;
    if (item.is_published === false) return null;
    return item.text_value;
  };

  const resolveImage = (item?: SiteContentItem): string | null => {
    if (!item) return null;
    if (cmsPreview && item.draft_image_url) return item.draft_image_url;
    if (item.is_published === false) return null;
    return item.image_url;
  };

  const resolveMeta = (item?: SiteContentItem): Record<string, any> | null => {
    if (!item) return null;
    if (cmsPreview && item.draft_meta) return item.draft_meta;
    if (item.is_published === false) return null;
    return item.meta;
  };

  const getText = (sectionKey: string, fallback: string): string =>
    resolveText(content[sectionKey]) || fallback;

  const getImage = (sectionKey: string, fallback?: string): string | undefined =>
    resolveImage(content[sectionKey]) || fallback;

  const getMeta = (sectionKey: string): Record<string, any> | null =>
    resolveMeta(content[sectionKey]);

  const getColor = (sectionKey: string, key: string, fallback?: string): string | undefined => {
    const meta = resolveMeta(content[sectionKey]);
    return meta?.colors?.[key] || fallback;
  };

  return { content, isLoading, getText, getImage, getMeta, getColor };
}
