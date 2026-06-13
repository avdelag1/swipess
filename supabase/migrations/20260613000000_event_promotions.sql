-- Migration to add promotion workflow tracking to events table
-- This allows admins to approve events before users are charged

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS promo_status text DEFAULT 'none'::text,
ADD COLUMN IF NOT EXISTS selected_promo_package text,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Valid promo_status values: 'none', 'pending_approval', 'pending_payment', 'active', 'rejected'

-- Update existing records to 'none' if null
UPDATE public.events SET promo_status = 'none' WHERE promo_status IS NULL;

-- Allow users to update their own event's promo_status and selected_promo_package
-- (Usually RLS already allows owners to update their events, but just in case)
