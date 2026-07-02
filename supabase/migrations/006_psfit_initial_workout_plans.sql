-- Deterministic onboarding workout plans. Incremental and idempotent.
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal text,
  experience_level text,
  days_per_week integer not null check(days_per_week between 2 and 7),
  session_duration integer not null check(session_duration between 10 and 180),
  is_active boolean not null default true,
  source text not null default 'onboarding',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,source)
);
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  focus text[] not null default '{}',
  position integer not null check(position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id,position)
);
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sets integer not null check(sets between 1 and 10),
  reps text not null,
  load_guidance text,
  position integer not null check(position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workout_id,position)
);
create index if not exists workout_plans_user_active_idx on public.workout_plans(user_id,is_active);
create index if not exists workouts_plan_position_idx on public.workouts(plan_id,position);
create index if not exists exercises_workout_position_idx on public.exercises(workout_id,position);
drop trigger if exists workout_plans_updated_at on public.workout_plans;
create trigger workout_plans_updated_at before update on public.workout_plans for each row execute function public.set_updated_at();
drop trigger if exists workouts_updated_at on public.workouts;
create trigger workouts_updated_at before update on public.workouts for each row execute function public.set_updated_at();
drop trigger if exists exercises_updated_at on public.exercises;
create trigger exercises_updated_at before update on public.exercises for each row execute function public.set_updated_at();
alter table public.workout_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='workout_plans' and policyname='own workout plans') then
    create policy "own workout plans" on public.workout_plans for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='workouts' and policyname='own workouts') then
    create policy "own workouts" on public.workouts for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='exercises' and policyname='own exercises') then
    create policy "own exercises" on public.exercises for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
end $$;
