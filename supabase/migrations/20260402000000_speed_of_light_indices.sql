-- ATOMIC SPEED INDICES: THE "SPEED OF LIGHT" UPDATE
-- These indices ensure the Swipess PWA remains native-speed even with millions of entries.

-- 1. Accelerate Discovery (Categories & Status)
-- Common query: select * from listings where category = 'X' and status = 'active'
CREATE INDEX IF NOT EXISTS idx_listings_discovery_v3 
ON public.listings (category, status) 
WHERE status = 'active';

-- 2. Accelerate 'Already Swiped' Checks
-- Common query: select 1 from likes where user_id = 'X' and target_id = 'Y'
CREATE INDEX IF NOT EXISTS idx_likes_lookup_v3 
ON public.likes (user_id, target_id, target_type);

-- 3. Accelerate Mutual Match Detection
-- Common query: select * from matches where client_id = 'X' or owner_id = 'X'
CREATE INDEX IF NOT EXISTS idx_matches_user_lookup_v3
ON public.matches (client_id, owner_id);

-- 4. Accelerate Chat Hydration
-- Common query: select * from conversation_messages where conversation_id = 'X' order by created_at desc
CREATE INDEX IF NOT EXISTS idx_messages_perf_v3
ON public.conversation_messages (conversation_id, created_at DESC);

-- 5. Accelerate Real-time Invalidations
-- Common query: select * from notifications where user_id = 'X' and is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_unread_v3
ON public.notifications (user_id, is_read) 
WHERE is_read = false;

-- 6. Accelerate Filter Persistence
-- Common query: select * from saved_filters where user_id = 'X' and is_active = true
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_v3
ON public.saved_filters (user_id, is_active);
