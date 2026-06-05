-- Create the has_role() function that is referenced by ~30 RLS policies
-- and called from the client via supabase.rpc('has_role').
-- The user_roles table and app_role enum already exist.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::app_role
  );
$$;

-- Grant execute to authenticated users so the RPC call works from the client
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
