-- ============================================================
-- CMS: site_content + site_content_versions tables
-- ============================================================

CREATE TABLE IF NOT EXISTS site_content (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key        TEXT NOT NULL,
  section_key     TEXT NOT NULL,
  content_type    TEXT NOT NULL DEFAULT 'text',
  text_value      TEXT,
  image_url       TEXT,
  meta            JSONB,
  draft_text_value TEXT,
  draft_image_url TEXT,
  draft_meta      JSONB,
  is_published    BOOLEAN NOT NULL DEFAULT true,
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  locale          TEXT NOT NULL DEFAULT 'en',
  updated_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_key, section_key)
);

CREATE TABLE IF NOT EXISTS site_content_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key    TEXT NOT NULL,
  section_key TEXT NOT NULL,
  snapshot    JSONB NOT NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content_versions ENABLE ROW LEVEL SECURITY;

-- Public read for published content
CREATE POLICY "sc_public_read" ON site_content FOR SELECT TO anon, authenticated
  USING (is_published = true AND is_visible = true);

-- Authenticated read (includes drafts for CMS preview)
CREATE POLICY "sc_auth_read" ON site_content FOR SELECT TO authenticated
  USING (true);

-- Only admins can write site_content
CREATE POLICY "sc_admin_write" ON site_content FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin', 'marketing')
    )
  );

-- Authenticated read for versions
CREATE POLICY "scv_auth_read" ON site_content_versions FOR SELECT TO authenticated
  USING (true);

-- Only admins can write versions
CREATE POLICY "scv_admin_write" ON site_content_versions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin', 'marketing')
    )
  );

-- Index for fast page_key lookups
CREATE INDEX IF NOT EXISTS idx_site_content_page_key ON site_content(page_key);
CREATE INDEX IF NOT EXISTS idx_site_content_versions_key ON site_content_versions(page_key, section_key, created_at DESC);

-- Helper function for public-facing reads (published + visible only)
CREATE OR REPLACE FUNCTION get_site_content(p_page_key TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  page_key TEXT,
  section_key TEXT,
  content_type TEXT,
  text_value TEXT,
  image_url TEXT,
  meta JSONB,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.page_key, sc.section_key, sc.content_type,
         sc.text_value, sc.image_url, sc.meta, sc.updated_at
  FROM site_content sc
  WHERE sc.is_published = true
    AND sc.is_visible = true
    AND (p_page_key IS NULL OR sc.page_key = p_page_key)
  ORDER BY sc.page_key, sc.section_key;
END;
$$;
