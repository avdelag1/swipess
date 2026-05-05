-- 1. Create profile_views table (was 404'ing on every dashboard load)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  viewed_profile_id uuid NOT NULL,
  view_type text NOT NULL DEFAULT 'profile',
  action text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile views" ON public.profile_views;
CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile views" ON public.profile_views;
CREATE POLICY "Users can insert their own profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can see views of their profile" ON public.profile_views;
CREATE POLICY "Owners can see views of their profile"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = viewed_profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_views_user_type ON public.profile_views(user_id, view_type);
CREATE INDEX IF NOT EXISTS idx_profile_views_target ON public.profile_views(viewed_profile_id);

-- 2. Create / replace get_smart_listings RPC (was missing or broken — returned [])
CREATE OR REPLACE FUNCTION public.get_smart_listings(
  p_user_id uuid,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.*
  FROM public.listings l
  WHERE l.is_active = true
    AND COALESCE(l.status, 'active') = 'active'
    AND l.user_id <> p_user_id
    AND (p_category IS NULL OR l.category = p_category)
    AND NOT EXISTS (
      SELECT 1 FROM public.likes lk
      WHERE lk.user_id = p_user_id
        AND lk.target_id = l.id
        AND lk.target_type = 'listing'
        AND lk.direction = 'left'
    )
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer) TO authenticated, anon;

-- 3. Add hot-path indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_target_type ON public.likes(user_id, target_type);
CREATE INDEX IF NOT EXISTS idx_likes_target ON public.likes(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_active_category ON public.listings(is_active, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);

-- 4. Wire up orphaned trigger functions on public tables
DROP TRIGGER IF EXISTS trg_messages_update_conv_last_message ON public.messages;
CREATE TRIGGER trg_messages_update_conv_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message_at();

DROP TRIGGER IF EXISTS trg_conversation_messages_update_conv ON public.conversation_messages;
CREATE TRIGGER trg_conversation_messages_update_conv
  AFTER INSERT ON public.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_listings_updated_at ON public.listings;
CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_client_profiles_updated_at ON public.client_profiles;
CREATE TRIGGER trg_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();