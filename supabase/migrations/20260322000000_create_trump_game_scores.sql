-- Trump's Bad Day mini-game leaderboard scores
CREATE TABLE IF NOT EXISTS public.trump_game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trump_game_scores ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own score
CREATE POLICY "Users can insert own scores"
  ON public.trump_game_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anyone can read all scores (leaderboard)
CREATE POLICY "Anyone can read scores"
  ON public.trump_game_scores
  FOR SELECT
  USING (true);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS trump_game_scores_score_idx ON public.trump_game_scores (score DESC);
CREATE INDEX IF NOT EXISTS trump_game_scores_user_idx ON public.trump_game_scores (user_id);
