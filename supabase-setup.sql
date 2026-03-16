-- ============================================================
-- Trump's Bad Day — Supabase Database Setup
-- Run this SQL once in your Supabase SQL editor.
-- ============================================================

-- Game scores table
create table if not exists trump_game_scores (
  id          bigserial primary key,
  user_id     uuid references auth.users,
  score       integer not null,
  combo       integer default 0,
  weapon_used text,
  background  text,       -- 'whitehouse' | 'mexican' | 'epstein' | 'mara_lago' | 'prison'
  created_at  timestamp default now()
);

-- Daily challenges table (optional — set by admin)
create table if not exists trump_daily_challenges (
  id           bigserial primary key,
  date         date default current_date,
  target_score integer,
  background   text,
  reward_text  text,
  created_at   timestamp default now()
);

-- Row Level Security: anyone can insert their own scores; anyone can read leaderboard
alter table trump_game_scores enable row level security;

create policy "Users can insert own scores"
  on trump_game_scores for insert
  with check (auth.uid() = user_id);

create policy "Anyone can read scores"
  on trump_game_scores for select
  using (true);

-- Index for fast leaderboard queries
create index if not exists trump_scores_score_idx
  on trump_game_scores (score desc);

-- ============================================================
-- Sample daily challenge (optional seed)
-- ============================================================
-- insert into trump_daily_challenges (date, target_score, background, reward_text)
-- values (current_date, 5000, 'epstein', 'Beat 5000 on Epstein Island today!');
