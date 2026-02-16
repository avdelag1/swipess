-- ============================================================
-- MATCHES & CONVERSATIONS TABLES (Missing from previous migrations)
-- These tables are required by the frontend hooks
-- ============================================================

-- ============================================
-- MATCHES TABLE (mutual likes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create timestamp trigger
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own matches"
    ON public.matches FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "System can create matches"
    ON public.matches FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own matches"
    ON public.matches FOR UPDATE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

-- Create unique index to prevent duplicate matches
CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique
    ON public.matches (client_id, owner_id, COALESCE(listing_id, gen_random_uuid()));

CREATE INDEX IF NOT EXISTS idx_matches_client ON public.matches(client_id);
CREATE INDEX IF NOT EXISTS idx_matches_owner ON public.matches(owner_id);
CREATE INDEX IF NOT EXISTS idx_matches_listing ON public.matches(listing_id);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_sender_id UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'active',
    free_messaging BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create timestamp trigger
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE POLICY "Users can update own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = client_id OR auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_conversations_client ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_match ON public.conversations(match_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add match_id column to conversations table (if not exists from older migration)
DO $$ BEGIN
    ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
