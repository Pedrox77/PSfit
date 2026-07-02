alter table public.training_preferences
  add column if not exists load_progression_mode text not null default 'confirm';
alter table public.training_preferences
  drop constraint if exists training_preferences_load_progression_mode_check;
alter table public.training_preferences
  add constraint training_preferences_load_progression_mode_check
  check (load_progression_mode in ('automatic','confirm','manual'));

create table if not exists public.load_progression_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  previous_weight numeric not null check(previous_weight >= 0),
  suggested_weight numeric not null check(suggested_weight >= previous_weight),
  applied_weight numeric,
  progression_mode text not null check(progression_mode in ('automatic','confirm','manual')),
  reason text not null,
  status text not null default 'suggested' check(status in ('suggested','applied','rejected','reverted')),
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
create index if not exists load_progression_events_user_created_idx on public.load_progression_events(user_id,created_at desc);
create index if not exists load_progression_events_exercise_idx on public.load_progression_events(exercise_id,created_at desc);
alter table public.load_progression_events enable row level security;
drop policy if exists "own load progression events" on public.load_progression_events;
create policy "own load progression events" on public.load_progression_events
  for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
