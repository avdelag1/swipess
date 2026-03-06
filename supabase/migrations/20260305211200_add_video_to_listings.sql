-- Add video_url column to listings for the 10-second looping video feature
ALTER TABLE public.listings
ADD COLUMN video_url text;
