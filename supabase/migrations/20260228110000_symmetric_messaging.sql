-- ============================================================
-- SYMMETRIC MESSAGING & NOTIFICATION PREFERENCES
-- 1. Add notification_preferences column to profiles
-- 2. Create trigger for smart notifications on likes
-- ============================================================

-- 1. Add notification_preferences column to profiles if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "property_offers": true,
  "moto_offers": true,
  "bicycle_offers": true,
  "service_offers": true,
  "job_offers": true,
  "client_likes": true,
  "owner_likes": true,
  "system_notifications": true
}'::jsonb;

-- 2. Create function to handle like notifications with preference checks
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    receiver_id UUID;
    liker_name TEXT;
    target_category TEXT;
    notif_enabled BOOLEAN;
BEGIN
    -- Only trigger for 'right' or 'like' directions
    IF NEW.direction NOT IN ('right', 'like') THEN
        RETURN NEW;
    END IF;

    -- Determine receiver and category
    IF NEW.target_type = 'listing' THEN
        -- Get owner of the listing
        SELECT owner_id, category INTO receiver_id, target_category 
        FROM public.listings 
        WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'profile' THEN
        -- Target is a profile
        receiver_id := NEW.target_id;
        target_category := 'client_likes'; -- Default for profile likes
    END IF;

    -- If no receiver found, exit
    IF receiver_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if receiver has enabled notifications for this category
    -- Map listing categories to preference keys
    CASE 
        WHEN target_category = 'property' THEN target_category := 'property_offers';
        WHEN target_category = 'moto' THEN target_category := 'moto_offers';
        WHEN target_category = 'bicycle' THEN target_category := 'bicycle_offers';
        WHEN target_category = 'service' THEN target_category := 'service_offers';
        WHEN target_category = 'job' THEN target_category := 'job_offers';
        ELSE 
            -- Keep original or use default
            IF target_category IS NULL THEN target_category := 'client_likes'; END IF;
    END CASE;

    -- Fetch preference
    SELECT (notification_preferences->>target_category)::BOOLEAN INTO notif_enabled
    FROM public.profiles
    WHERE id = receiver_id;

    -- Default to true if preference doesn't exist
    IF notif_enabled IS NULL THEN
        notif_enabled := TRUE;
    END IF;

    IF notif_enabled THEN
        -- Get liker name
        SELECT full_name INTO liker_name FROM public.profiles WHERE id = NEW.user_id;
        
        -- Insert notification
        INSERT INTO public.notifications (
            user_id,
            notification_type,
            title,
            message,
            related_user_id,
            metadata
        ) VALUES (
            receiver_id,
            'new_interest',
            'Someone liked you!',
            COALESCE(liker_name, 'A user') || ' is interested in your ' || 
            CASE 
                WHEN NEW.target_type = 'listing' THEN 'listing'
                ELSE 'profile'
            END || '.',
            NEW.user_id,
            jsonb_build_object(
                'like_id', NEW.id,
                'target_id', NEW.target_id,
                'target_type', NEW.target_type,
                'category', target_category
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS tr_on_like_notification ON public.likes;
CREATE TRIGGER tr_on_like_notification
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_like_notification();

-- 4. Enable RLS on notifications (re-confirming)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
