-- Migration: 20260220_rename_matches_conversations_columns.sql
-- Description: Rename match/conversation participant columns to client_id/owner_id and rename associated indexes.
-- Created: 2026-02-20
-- Generated-by: assistant

DO $$ 
BEGIN
  -- matches table: rename columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user_id_1'
  ) THEN
    EXECUTE 'ALTER TABLE public.matches RENAME COLUMN user_id_1 TO client_id;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user_id_2'
  ) THEN
    EXECUTE 'ALTER TABLE public.matches RENAME COLUMN user_id_2 TO owner_id;';
  END IF;
END $$;

DO $$ 
BEGIN
  -- conversations table: rename columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'participant_1_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.conversations RENAME COLUMN participant_1_id TO client_id;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'participant_2_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.conversations RENAME COLUMN participant_2_id TO owner_id;';
  END IF;
END $$;

DO $$ 
BEGIN
  -- Rename indexes (only if source exists and target doesn't)
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_user1'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_client'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_matches_user1 RENAME TO idx_matches_client;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_user2'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_owner'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_matches_user2 RENAME TO idx_matches_owner;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_participants'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_matches_pair'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_matches_participants RENAME TO idx_matches_pair;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_participant1'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_client'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_conversations_participant1 RENAME TO idx_conversations_client;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_participant2'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_owner'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_conversations_participant2 RENAME TO idx_conversations_owner;';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_participants'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind = 'i' AND n.nspname = 'public' AND c.relname = 'idx_conversations_pair'
  ) THEN
    EXECUTE 'ALTER INDEX public.idx_conversations_participants RENAME TO idx_conversations_pair;';
  END IF;
END $$;

-- End of migration
