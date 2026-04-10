
-- 1. AI Conversations Table (Groups messages into sessions)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Conversation',
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AI Messages Table (Individual messages in a conversation)
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- 4. RLS Policies for Conversations
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI conversations"
    ON public.ai_conversations FOR ALL
    USING (auth.uid() = user_id);

-- 5. RLS Policies for Messages
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI messages"
    ON public.ai_messages FOR ALL
    USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.ai_conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_ai_conversation_timestamp
    AFTER INSERT ON public.ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_conversation_timestamp();

-- 7. Grant access
GRANT ALL ON public.ai_conversations TO service_role;
GRANT ALL ON public.ai_conversations TO authenticated;

GRANT ALL ON public.ai_messages TO service_role;
GRANT ALL ON public.ai_messages TO authenticated;
