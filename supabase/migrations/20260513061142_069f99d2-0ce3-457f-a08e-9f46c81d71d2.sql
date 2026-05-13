CREATE OR REPLACE FUNCTION public.get_smart_listings(
  p_user_id uuid,
  p_category text DEFAULT NULL::text,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT l.*
  FROM public.listings l
  WHERE COALESCE(l.is_active, true) = true
    AND COALESCE(l.status, 'active') = 'active'
    AND (p_category IS NULL OR l.category = p_category)
  ORDER BY l.created_at ASC NULLS LAST, l.id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_listings(uuid, text, integer, integer) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_smart_clients(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  name text,
  age integer,
  gender text,
  city text,
  country text,
  images jsonb,
  avatar_url text,
  interests jsonb,
  lifestyle_tags jsonb,
  smoking boolean,
  work_schedule text,
  nationality text,
  languages_spoken jsonb,
  neighborhood text,
  bio text,
  onboarding_completed boolean,
  profile_images jsonb,
  preferred_activities jsonb,
  roommate_available boolean,
  client_type text,
  occupation text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    cp.name,
    COALESCE(p.age, cp.age) AS age,
    COALESCE(p.gender, cp.gender) AS gender,
    COALESCE(p.city, cp.city) AS city,
    COALESCE(p.country, cp.country) AS country,
    p.images,
    p.avatar_url,
    COALESCE(p.interests, cp.interests) AS interests,
    p.lifestyle_tags,
    p.smoking,
    COALESCE(p.work_schedule, cp.work_schedule) AS work_schedule,
    p.nationality,
    p.languages_spoken,
    COALESCE(p.neighborhood, cp.neighborhood) AS neighborhood,
    COALESCE(p.bio, cp.bio) AS bio,
    p.onboarding_completed,
    cp.profile_images,
    cp.preferred_activities,
    COALESCE(cp.roommate_available, false) AS roommate_available,
    CASE
      WHEN lower(COALESCE(cp.occupation, '')) LIKE '%buy%' THEN 'buyer'
      WHEN lower(COALESCE(cp.occupation, '')) LIKE '%rent%' THEN 'renter'
      WHEN lower(COALESCE(cp.occupation, '')) LIKE '%hire%' OR lower(COALESCE(cp.occupation, '')) LIKE '%service%' THEN 'hire'
      ELSE NULL
    END AS client_type,
    cp.occupation,
    ur.role::text,
    p.created_at
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id AND ur.role = 'client'::public.app_role
  LEFT JOIN public.client_profiles cp ON cp.user_id = p.user_id
  WHERE (p_user_id IS NULL OR p.user_id IS DISTINCT FROM p_user_id)
    AND COALESCE(p.is_active, true) = true
  ORDER BY p.created_at ASC NULLS LAST, p.user_id ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
  OFFSET GREATEST(0, COALESCE(p_offset, 0));
$$;

GRANT EXECUTE ON FUNCTION public.get_smart_clients(uuid, integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_conversation_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_client_id uuid;
  v_owner_id uuid;
  v_recipient_id uuid;
  v_sender_name text;
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id
  RETURNING client_id, owner_id INTO v_client_id, v_owner_id;

  IF v_client_id IS NULL OR v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_recipient_id := CASE WHEN NEW.sender_id = v_client_id THEN v_owner_id ELSE v_client_id END;

  IF v_recipient_id IS NULL OR v_recipient_id = NEW.sender_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(full_name, ''), 'Someone') INTO v_sender_name
  FROM public.profiles
  WHERE user_id = NEW.sender_id
  LIMIT 1;

  INSERT INTO public.notifications (
    user_id,
    notification_type,
    title,
    message,
    related_user_id,
    metadata,
    is_read
  ) VALUES (
    v_recipient_id,
    'message',
    'New message',
    COALESCE(v_sender_name, 'Someone') || ': ' || LEFT(COALESCE(NEW.message_text, NEW.content, ''), 120),
    NEW.sender_id,
    jsonb_build_object('type', 'message', 'conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id),
    false
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversation_messages_after_insert ON public.conversation_messages;
CREATE TRIGGER trg_conversation_messages_after_insert
AFTER INSERT ON public.conversation_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_conversation_message();

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_created_stable ON public.listings (created_at ASC, id ASC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_stable ON public.profiles (created_at ASC, user_id ASC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_live ON public.conversation_messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);