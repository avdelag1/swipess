-- Add likes table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;

-- Update handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client'::app_role);
  RETURN NEW;
END;
$function$;