
-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.digital_contracts(id),
  listing_id uuid,
  tenant_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'other',
  photo_urls jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Tenant can insert own requests
CREATE POLICY "Tenants can insert own requests"
ON public.maintenance_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = tenant_id);

-- Both tenant and owner can view their requests
CREATE POLICY "Users can view own requests"
ON public.maintenance_requests FOR SELECT
TO authenticated
USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

-- Both tenant and owner can update their requests
CREATE POLICY "Users can update own requests"
ON public.maintenance_requests FOR UPDATE
TO authenticated
USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

-- Add client verification columns to client_profiles
ALTER TABLE public.client_profiles
ADD COLUMN identity_verified boolean DEFAULT false,
ADD COLUMN verification_submitted_at timestamptz;

-- Add language preference to profiles
ALTER TABLE public.profiles
ADD COLUMN language text DEFAULT 'en';
