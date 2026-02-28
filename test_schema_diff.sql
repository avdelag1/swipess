-- ============================================================
-- SCHEMA DIFF QUERY
-- Compare expected schema (from file) vs actual database
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Check for missing columns in matches
SELECT 'MISSING COLUMNS in matches:' as check_type;
SELECT column_name 
FROM (
  SELECT 'client_id' as expected_col UNION ALL
  SELECT 'owner_id' UNION ALL
  SELECT 'listing_id' UNION ALL
  SELECT 'matched_at' UNION ALL
  SELECT 'is_active' UNION ALL
  SELECT 'created_at'
) expected
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'matches'
  AND column_name = expected_col
);

-- 2. Check for missing columns in conversations
SELECT 'MISSING COLUMNS in conversations:' as check_type;
SELECT column_name 
FROM (
  SELECT 'match_id' as expected_col UNION ALL
  SELECT 'client_id' UNION ALL
  SELECT 'owner_id' UNION ALL
  SELECT 'listing_id' UNION ALL
  SELECT 'last_message_at' UNION ALL
  SELECT 'is_active' UNION ALL
  SELECT 'created_at' UNION ALL
  SELECT 'updated_at'
) expected
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'conversations'
  AND column_name = expected_col
);

-- 3. Verify expected indexes exist
SELECT 'MISSING INDEXES on matches:' as check_type;
SELECT index_name FROM (
  VALUES 
    ('idx_matches_client'),
    ('idx_matches_owner'),
    ('idx_matches_listing'),
    ('idx_matches_pair')
) expected(idx_name)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE schemaname = 'public' AND tablename = 'matches'
  AND indexname = index_name
);

SELECT 'MISSING INDEXES on conversations:' as check_type;
SELECT index_name FROM (
  VALUES 
    ('idx_conversations_match'),
    ('idx_conversations_client'),
    ('idx_conversations_owner'),
    ('idx_conversations_pair')
) expected(idx_name)
WHERE NOT EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE schemaname = 'public' AND tablename = 'conversations'
  AND indexname = index_name
);

-- 4. Check for old column names (should return nothing)
SELECT 'ORPHAN COLUMNS (old names) in matches:' as check_type;
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'matches'
AND column_name IN ('user_id_1', 'user_id_2');

SELECT 'ORPHAN COLUMNS (old names) in conversations:' as check_type;
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
AND column_name IN ('participant_1_id', 'participant_2_id');

-- 5. Check for old indexes (should return nothing)
SELECT 'ORPHAN INDEXES (old names):' as check_type;
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename IN ('matches', 'conversations')
AND indexname IN (
  'idx_matches_user1', 'idx_matches_user2', 'idx_matches_participants',
  'idx_conversations_participant1', 'idx_conversations_participant2', 'idx_conversations_participants'
);

-- 6. Sample data preview
SELECT 'Sample data from matches:' as check_type;
SELECT * FROM public.matches LIMIT 5;

SELECT 'Sample data from conversations:' as check_type;
SELECT * FROM public.conversations LIMIT 5;
