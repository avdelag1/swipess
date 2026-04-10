-- Add paypal_link column to subscription_packages so token purchase buttons work
ALTER TABLE public.subscription_packages
ADD COLUMN paypal_link TEXT DEFAULT NULL;