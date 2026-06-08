-- CRITICAL MISSING INDEXES: Backend Speed Audit 2026-06-08
-- These indexes address the highest-impact missing index findings from
-- the comprehensive backend query audit.

-- 1. digital_contracts: OR pattern (client_id, owner_id, created_by) + order by created_at
-- Queries: useContracts.tsx:65, DocumentVault.tsx:100, LegalHub.tsx:54
CREATE INDEX IF NOT EXISTS idx_digital_contracts_client
ON public.digital_contracts (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_contracts_owner
ON public.digital_contracts (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_digital_contracts_created_by
ON public.digital_contracts (created_by, created_at DESC);

-- 2. deal_status_tracking: OR pattern (client_id, owner_id, status)
-- Query: useContracts.tsx:259-267
CREATE INDEX IF NOT EXISTS idx_deal_status_client
ON public.deal_status_tracking (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_status_owner
ON public.deal_status_tracking (owner_id, created_at DESC);

-- 3. reviews: listing_id + is_flagged filter + created_at order
-- Queries: useReviews.tsx:125-126, useReviews.tsx:161
CREATE INDEX IF NOT EXISTS idx_reviews_listing_flagged
ON public.reviews (listing_id, is_flagged, created_at DESC)
WHERE is_flagged = false;

-- 4. reviews: reviewed_id + is_flagged filter + created_at order
-- Queries: useReviews.tsx:248-250, useReviews.tsx:286
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_flagged
ON public.reviews (reviewed_id, is_flagged, created_at DESC)
WHERE is_flagged = false;

-- 5. events: ordering by event_date (no filter = sequential scan without index)
-- Query: EventosFeed.tsx:147-148
CREATE INDEX IF NOT EXISTS idx_events_date
ON public.events (event_date ASC);

-- 6. likes: target_type + direction + created_at for "who liked you" queries
-- Query: ClientWhoLikedYou.tsx:76-80
CREATE INDEX IF NOT EXISTS idx_likes_target_direction_date
ON public.likes (target_type, direction, created_at DESC);

-- 7. business_promo_submissions: user_id + status filter for advertise page
-- Query: AdvertisePage.tsx:341
CREATE INDEX IF NOT EXISTS idx_business_promo_user_status
ON public.business_promo_submissions (user_id, status);
