-- Supabase Schema for Chess Study Games
create table if not exists public.chess_study_games (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  fen text not null,
  pgn text not null,
  notes text,
  eval_summary text,
  moves_count integer default 0
);

-- Enable Row Level Security
alter table public.chess_study_games enable row level security;

-- Allow public read & write policy for study sessions
create policy "Allow anon all" on public.chess_study_games
  for all
  using (true)
  with check (true);
