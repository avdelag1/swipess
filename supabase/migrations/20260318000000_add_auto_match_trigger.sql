-- ============================================================
-- AUTOMATIC MATCH-MAKING TRIGGER
-- Detects mutual likes and auto-inserts into matches table.
-- ============================================================

-- Function to handle match creation
CREATE OR REPLACE FUNCTION public.handle_mutual_like()
RETURNS TRIGGER AS $$
DECLARE
    v_owner_id UUID;
    v_listing_id UUID;
    v_match_exists BOOLEAN;
BEGIN
    -- Only process 'right' swipes (likes)
    IF NEW.direction != 'right' THEN
        RETURN NEW;
    END IF;

    -- CASE 1: Client likes a Listing
    IF NEW.target_type = 'listing' THEN
        v_listing_id := NEW.target_id;
        
        -- Get the owner of the listing
        SELECT owner_id INTO v_owner_id FROM public.listings WHERE id = v_listing_id;
        
        IF v_owner_id IS NOT NULL THEN
            -- Check if the owner has already liked this client
            -- (Owner likes client via 'profile' target_type)
            IF EXISTS (
                SELECT 1 FROM public.likes 
                WHERE user_id = v_owner_id 
                AND target_id = NEW.user_id 
                AND target_type = 'profile' 
                AND direction = 'right'
            ) THEN
                -- IT'S A MATCH!
                -- Check for existing match to avoid duplicates
                SELECT EXISTS (
                    SELECT 1 FROM public.matches 
                    WHERE client_id = NEW.user_id 
                    AND owner_id = v_owner_id
                ) INTO v_match_exists;

                IF NOT v_match_exists THEN
                    INSERT INTO public.matches (client_id, owner_id, listing_id, status)
                    VALUES (NEW.user_id, v_owner_id, v_listing_id, 'active');
                    
                    -- Create notification for both users (optional, usually handled by separate trigger)
                END IF;
            END IF;
        END IF;

    -- CASE 2: Owner likes a Client Profile
    ELSIF NEW.target_type = 'profile' THEN
        v_owner_id := NEW.user_id;
        
        -- Check if the client has liked ANY of this owner's listings
        SELECT id INTO v_listing_id 
        FROM public.listings 
        WHERE owner_id = v_owner_id
        AND id IN (
            SELECT target_id FROM public.likes 
            WHERE user_id = NEW.target_id 
            AND target_type = 'listing' 
            AND direction = 'right'
        )
        LIMIT 1;

        IF v_listing_id IS NOT NULL THEN
            -- IT'S A MATCH!
            SELECT EXISTS (
                SELECT 1 FROM public.matches 
                WHERE client_id = NEW.target_id 
                AND owner_id = v_owner_id
            ) INTO v_match_exists;

            IF NOT v_match_exists THEN
                INSERT INTO public.matches (client_id, owner_id, listing_id, status)
                VALUES (NEW.target_id, v_owner_id, v_listing_id, 'active');
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_handle_mutual_like ON public.likes;
CREATE TRIGGER tr_handle_mutual_like
    AFTER INSERT OR UPDATE ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_mutual_like();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
