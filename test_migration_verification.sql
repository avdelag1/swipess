-- ============================================================
-- VERIFICATION QUERIES
-- Test match and conversation flow
-- ============================================================

-- 1. Verify column structure
SELECT 'matches table columns:' as test;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'matches'
ORDER BY column_name;

SELECT 'conversations table columns:' as test;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY column_name;

-- 2. Verify indexes exist
SELECT 'matches indexes:' as test;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'matches' AND schemaname = 'public';

SELECT 'conversations indexes:' as test;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'conversations' AND schemaname = 'public';

-- 3. Test match creation (dry run - will fail if data issues)
DO $$ 
DECLARE
  test_client uuid := auth.uid();  -- Current user as client
  test_owner uuid;
  test_listing uuid;
BEGIN
  -- Get first listing owner for testing
  SELECT owner_id, id INTO test_owner, test_listing 
  FROM public.listings 
  WHERE owner_id != test_client 
  LIMIT 1;
  
  IF test_owner IS NOT NULL THEN
    RAISE NOTICE 'Test: Would create match between client % and owner % for listing %', 
      test_client, test_owner, test_listing;
  ELSE
    RAISE NOTICE 'Test: No suitable test data found (need listing from different user)';
  END IF;
END $$;

-- 4. Verify FK constraints
SELECT 'FK constraints on matches:' as test;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.matches'::regclass;

SELECT 'FK constraints on conversations:' as test;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.conversations'::regclass;

-- 5. Count records
SELECT 'matches count:' as test, COUNT(*) as count FROM public.matches;
SELECT 'conversations count:' as test, COUNT(*) as count FROM public.conversations;

-- 6. Test conversation query (simulating useConversations hook)
SELECT 
  c.id as conversation_id,
  c.client_id,
  c.owner_id,
  c.listing_id,
  c.status,
  c.created_at
FROM public.conversations c
WHERE auth.uid() IN (c.client_id, c.owner_id)
ORDER BY c.created_at DESC
LIMIT 10;
