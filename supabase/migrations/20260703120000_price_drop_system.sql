-- Migration to add previous_price and price drops
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS previous_price numeric;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS price_drop_at timestamp with time zone;

-- Update the enum for notification_type to include price_drop
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'price_drop';

-- Function to handle price drops
CREATE OR REPLACE FUNCTION public.handle_listing_price_drop()
RETURNS TRIGGER AS $$
BEGIN
  -- If price is decreasing
  IF NEW.price < OLD.price THEN
    NEW.previous_price := OLD.price;
    NEW.price_drop_at := now();
    
    -- Insert notifications for users who viewed this recently
    -- Note: using a separate background worker or edge function is generally better for bulk inserts,
    -- but for simplicity we can insert for recent passes/likes here if volume is low.
    INSERT INTO public.notifications (user_id, title, message, notification_type, related_property_id)
    SELECT DISTINCT pv.user_id, 
           '🔥 Price Drop on a listing you saw!', 
           'A listing you swiped on recently has dropped its price!',
           'price_drop'::notification_type,
           NEW.id
    FROM public.profile_views pv
    WHERE pv.viewed_profile_id = NEW.id
      AND pv.view_type = 'listing'
      AND pv.action IN ('like', 'pass', 'pass:1', 'pass:2')
      -- Limit to people who saw it in the last 30 days
      AND pv.created_at > now() - interval '30 days';
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for price drop
DROP TRIGGER IF EXISTS on_listing_price_drop ON public.listings;
CREATE TRIGGER on_listing_price_drop
  BEFORE UPDATE OF price ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_listing_price_drop();
