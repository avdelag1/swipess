-- Table to store access code requests from the MaintenanceGate screen.
-- Anon users can insert; only service_role can read (prevents scraping).

CREATE TABLE IF NOT EXISTS public.code_requests (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  email       text        NOT NULL,
  whatsapp    text,
  message     text,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.code_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including logged-out visitors) can submit a request.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'code_requests'
       AND policyname = 'Anyone can request access'
  ) THEN
    CREATE POLICY "Anyone can request access"
      ON public.code_requests FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
