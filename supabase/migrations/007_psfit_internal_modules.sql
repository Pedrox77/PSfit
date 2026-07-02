-- Functional internal modules. Incremental and idempotent.
alter table public.workouts add column if not exists description text;
alter table public.workouts add column if not exists estimated_minutes integer;
alter table public.workouts add column if not exists difficulty text;
alter table public.workouts add column if not exists scheduled_weekday integer check(scheduled_weekday between 0 and 6);
alter table public.workouts add column if not exists scheduled_time time;
alter table public.workouts add column if not exists status text not null default 'scheduled';
alter table public.workouts add column if not exists is_custom boolean not null default false;
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='workouts' and column_name='focus' and data_type='ARRAY') then
  alter table public.workouts alter column focus type text using array_to_string(focus,', ');
 end if;
end $$;
alter table public.exercises add column if not exists catalog_exercise_id uuid;
alter table public.exercises add column if not exists muscle_group text;
alter table public.exercises add column if not exists primary_muscles text[] not null default '{}';
alter table public.exercises add column if not exists secondary_muscles text[] not null default '{}';
alter table public.exercises add column if not exists equipment text;
alter table public.exercises add column if not exists repetitions text;
alter table public.exercises add column if not exists suggested_weight_kg numeric;
alter table public.exercises add column if not exists rest_seconds integer;
alter table public.exercises add column if not exists notes text;
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists video_thumbnail_url text;
do $$ begin
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='exercises' and column_name='reps') then
  execute 'update public.exercises set repetitions=coalesce(repetitions,reps)';
  alter table public.exercises drop column reps;
 end if;
 if exists(select 1 from information_schema.columns where table_schema='public' and table_name='exercises' and column_name='user_id') then
  drop policy if exists "own exercises" on public.exercises;
  alter table public.exercises drop column user_id;
 end if;
end $$;
alter table public.exercises alter column repetitions set not null;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='exercises' and policyname='exercise owner through workout') then
  create policy "exercise owner through workout" on public.exercises for all to authenticated
  using(exists(select 1 from public.workouts w where w.id=workout_id and w.user_id=auth.uid()))
  with check(exists(select 1 from public.workouts w where w.id=workout_id and w.user_id=auth.uid()));
 end if;
end $$;

create table if not exists public.exercise_catalog(
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
 aliases text[] not null default '{}', primary_muscle text not null, secondary_muscles text[] not null default '{}',
 equipment text, difficulty text, exercise_type text, instructions text, safety_notes text,
 thumbnail_url text, video_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ begin
 if not exists(select 1 from pg_constraint where conname='exercises_catalog_exercise_id_fkey') then
  alter table public.exercises add constraint exercises_catalog_exercise_id_fkey foreign key(catalog_exercise_id) references public.exercise_catalog(id) on delete set null;
 end if;
end $$;
create table if not exists public.workout_sessions(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 workout_id uuid not null references public.workouts(id) on delete cascade, plan_id uuid references public.workout_plans(id) on delete set null,
 scheduled_date date not null, status text not null default 'in_progress', started_at timestamptz, completed_at timestamptz,
 duration_minutes integer, total_volume_kg numeric not null default 0, calories numeric, perceived_effort integer,
 sets_completed integer not null default 0, exercises_completed integer not null default 0, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,workout_id,scheduled_date)
);
create table if not exists public.workout_set_logs(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid not null references public.workout_sessions(id) on delete cascade,
 exercise_id uuid not null references public.exercises(id) on delete cascade, set_number integer not null,
 weight_kg numeric, repetitions integer, duration_seconds integer, is_completed boolean not null default false,
 notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(session_id,exercise_id,set_number)
);
create table if not exists public.progress_entries(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 recorded_at date not null, weight_kg numeric, body_fat_percentage numeric, waist_cm numeric, chest_cm numeric,
 arm_cm numeric, thigh_cm numeric, hip_cm numeric, notes text, photo_path text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,recorded_at)
);
create table if not exists public.recovery_checkins(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 checkin_date date not null, sleep_hours numeric not null, sleep_quality integer not null, energy_level integer not null,
 muscle_soreness integer not null, stress_level integer not null, has_pain boolean not null default false,
 pain_location text, notes text, readiness_score integer not null, recommendation text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,checkin_date)
);
create table if not exists public.twin_scenarios(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, assumptions jsonb not null, projection jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.workout_imports(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null, mime_type text not null, size_bytes integer not null, status text not null default 'uploaded',
 extracted_data jsonb, error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists workouts_schedule_idx on public.workouts(user_id,scheduled_weekday);
create index if not exists sessions_user_date_idx on public.workout_sessions(user_id,scheduled_date);
create index if not exists set_logs_session_idx on public.workout_set_logs(session_id);
create index if not exists catalog_search_idx on public.exercise_catalog(primary_muscle,equipment,difficulty);

alter table public.exercise_catalog enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_set_logs enable row level security;
alter table public.progress_entries enable row level security;
alter table public.recovery_checkins enable row level security;
alter table public.twin_scenarios enable row level security;
alter table public.workout_imports enable row level security;
do $$ declare t text; begin
 foreach t in array array['workout_sessions','workout_set_logs','progress_entries','recovery_checkins','twin_scenarios','workout_imports'] loop
  if not exists(select 1 from pg_policies where schemaname='public' and tablename=t and policyname='own rows') then
   execute format('create policy "own rows" on public.%I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
  end if;
 end loop;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='exercise_catalog' and policyname='catalog readable') then
  create policy "catalog readable" on public.exercise_catalog for select to authenticated using(true);
 end if;
end $$;
insert into storage.buckets(id,name,public) values('workout-imports','workout-imports',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('progress-photos','progress-photos',false) on conflict(id) do nothing;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='own workout imports') then
  create policy "own workout imports" on storage.objects for all to authenticated
  using(bucket_id='workout-imports' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='workout-imports' and (storage.foldername(name))[1]=auth.uid()::text);
 end if;
end $$;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='own progress photos') then
  create policy "own progress photos" on storage.objects for all to authenticated
  using(bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text)
  with check(bucket_id='progress-photos' and (storage.foldername(name))[1]=auth.uid()::text);
 end if;
end $$;

insert into public.exercise_catalog(name,slug,aliases,primary_muscle,secondary_muscles,equipment,difficulty,exercise_type,instructions,safety_notes) values
('Agachamento livre','agachamento-livre',array['squat'],'Pernas',array['Glúteos','Core'],'Barra','Intermediário','Força','Mantenha o tronco firme e desça com controle.','Interrompa se houver dor articular.'),
('Leg press','leg-press',array['press de pernas'],'Pernas',array['Glúteos'],'Máquina','Iniciante','Força','Apoie toda a lombar e empurre pela base dos pés.','Não bloqueie os joelhos.'),
('Elevação pélvica','elevacao-pelvica',array['hip thrust'],'Glúteos',array['Posteriores'],'Barra','Intermediário','Força','Estenda o quadril mantendo as costelas alinhadas.','Evite hiperextensão lombar.'),
('Supino reto','supino-reto',array['bench press'],'Peito',array['Tríceps','Ombros'],'Barra','Intermediário','Força','Desça a barra com controle até o peito.','Use travas e auxílio quando necessário.'),
('Flexão','flexao',array['push-up'],'Peito',array['Tríceps','Core'],'Peso corporal','Iniciante','Força','Mantenha o corpo alinhado durante todo o movimento.',null),
('Puxada frontal','puxada-frontal',array['lat pulldown'],'Costas',array['Bíceps'],'Cabo','Iniciante','Força','Puxe em direção ao alto do peito sem balançar.',null),
('Remada baixa','remada-baixa',array['seated row'],'Costas',array['Bíceps'],'Cabo','Iniciante','Força','Leve os cotovelos para trás com peito estável.',null),
('Desenvolvimento com halteres','desenvolvimento-halteres',array['shoulder press'],'Ombros',array['Tríceps'],'Halteres','Intermediário','Força','Pressione acima da cabeça sem arquear a lombar.',null),
('Rosca direta','rosca-direta',array['biceps curl'],'Bíceps',array[]::text[],'Barra','Iniciante','Força','Mantenha os cotovelos próximos ao corpo.',null),
('Tríceps na polia','triceps-polia',array['pushdown'],'Tríceps',array[]::text[],'Cabo','Iniciante','Força','Estenda os cotovelos sem mover os ombros.',null),
('Prancha','prancha',array['plank'],'Core',array['Ombros'],'Peso corporal','Iniciante','Isometria','Mantenha quadril e ombros alinhados.',null),
('Caminhada','caminhada',array['walk'],'Cardio',array['Pernas'],'Nenhum','Iniciante','Cardio','Mantenha ritmo confortável e postura ereta.',null),
('Mobilidade de quadril','mobilidade-quadril',array[]::text[],'Mobilidade',array['Glúteos'],'Nenhum','Iniciante','Mobilidade','Execute lentamente dentro da amplitude confortável.',null),
('Alongamento posterior','alongamento-posterior',array[]::text[],'Alongamento',array['Posteriores'],'Nenhum','Iniciante','Alongamento','Sustente sem movimentos bruscos.','Não force até sentir dor.')
on conflict(slug) do nothing;
