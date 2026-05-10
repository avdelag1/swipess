ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;

CREATE OR REPLACE FUNCTION public.validate_profile_age()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL THEN
    IF NEW.date_of_birth > (current_date - interval '17 years') THEN
      RAISE EXCEPTION 'You must be at least 17 years old to use Swipess';
    END IF;
    IF NEW.date_of_birth < (current_date - interval '120 years') THEN
      RAISE EXCEPTION 'Invalid date of birth';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_age_check ON public.profiles;
CREATE TRIGGER profiles_age_check
BEFORE INSERT OR UPDATE OF date_of_birth ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.validate_profile_age();