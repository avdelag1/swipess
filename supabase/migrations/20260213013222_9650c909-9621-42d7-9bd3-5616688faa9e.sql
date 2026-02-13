
-- Create the missing upsert_user_role RPC function
CREATE OR REPLACE FUNCTION public.upsert_user_role(p_user_id uuid, p_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

-- Create the missing check_email_exists RPC function (SECURITY DEFINER so anon can call it)
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_role text;
BEGIN
  -- Look up user by email in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('exists', false);
  END IF;

  -- Get profile info
  SELECT id, full_name, email, avatar_url, created_at 
  INTO v_profile 
  FROM public.profiles 
  WHERE user_id = v_user_id 
  LIMIT 1;

  -- Get role
  SELECT role::text INTO v_role FROM public.user_roles WHERE user_id = v_user_id LIMIT 1;

  RETURN jsonb_build_object(
    'exists', true,
    'id', v_user_id,
    'email', p_email,
    'full_name', COALESCE(v_profile.full_name, ''),
    'avatar_url', COALESCE(v_profile.avatar_url, ''),
    'role', COALESCE(v_role, ''),
    'created_at', COALESCE(v_profile.created_at::text, now()::text)
  );
END;
$$;

-- Add unique constraint on user_roles.user_id if not exists (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END;
$$;

-- Fix existing users who are missing roles (default to 'client')
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'client'::app_role
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
WHERE ur.id IS NULL
ON CONFLICT (user_id) DO NOTHING;
