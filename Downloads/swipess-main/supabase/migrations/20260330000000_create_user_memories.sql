-- Per-user AI memory table
-- Stores facts, contacts, preferences, and notes that the AI concierge always loads
-- so it can answer questions directly from memory before searching the web.

CREATE TABLE IF NOT EXISTS user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'note',  -- 'contact' | 'preference' | 'fact' | 'note'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'manual',  -- 'manual' = user added, 'ai' = auto-saved by Vibe
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own memories
CREATE POLICY "Users manage own memories"
  ON user_memories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_memories_user_id ON user_memories(user_id);
CREATE INDEX idx_user_memories_category ON user_memories(user_id, category);
