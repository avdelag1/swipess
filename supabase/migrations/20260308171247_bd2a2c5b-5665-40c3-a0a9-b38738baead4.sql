
CREATE TABLE public.owner_client_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  selected_genders jsonb DEFAULT '[]'::jsonb,
  min_age integer,
  max_age integer,
  min_budget numeric,
  max_budget numeric,
  preferred_nationalities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_client_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.owner_client_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.owner_client_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.owner_client_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_owner_client_preferences_updated_at
  BEFORE UPDATE ON public.owner_client_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
