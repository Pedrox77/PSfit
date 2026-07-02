-- Incremental onboarding and initial plan generation for PSFIT.
alter table public.profiles add column if not exists personalization_choice text;
alter table public.profiles add column if not exists onboarding_step text not null default 'nickname';
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists birth_year integer;
alter table public.profiles add column if not exists age_range text;
alter table public.profiles drop constraint if exists profiles_personalization_choice_check;
alter table public.profiles add constraint profiles_personalization_choice_check
  check(personalization_choice is null or personalization_choice in ('workout','nutrition','both','later'));
alter table public.profiles drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles add constraint profiles_onboarding_step_check
  check(onboarding_step in ('nickname','personalization','training','nutrition','review','generating','completed'));
alter table public.profiles drop constraint if exists profiles_birth_year_check;
alter table public.profiles add constraint profiles_birth_year_check
  check(birth_year is null or birth_year between 1900 and extract(year from current_date)::integer);

create table if not exists public.training_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  primary_goal text,
  experience_level text check(experience_level is null or experience_level in ('beginner','intermediate','advanced')),
  training_location text,
  equipment text[] not null default '{}',
  days_per_week integer check(days_per_week is null or days_per_week between 2 and 7),
  session_duration_minutes integer check(session_duration_minutes is null or session_duration_minutes in (20,30,45,60,75)),
  preferred_days text[] not null default '{}',
  preferred_time text,
  focus_areas text[] not null default '{}',
  limitations text[] not null default '{}',
  limitation_notes text check(char_length(limitation_notes) <= 1000),
  coaching_style text check(coaching_style is null or coaching_style in ('supportive','direct','educational','competitive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nutrition_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  nutrition_goal text,
  age integer check(age is null or age between 13 and 120),
  height_cm numeric check(height_cm is null or height_cm between 80 and 260),
  current_weight_kg numeric check(current_weight_kg is null or current_weight_kg between 25 and 500),
  target_weight_kg numeric check(target_weight_kg is null or target_weight_kg between 25 and 500),
  biological_sex text check(biological_sex is null or biological_sex in ('female','male','prefer_not_to_say')),
  activity_level text,
  eating_preferences text[] not null default '{}',
  allergies text[] not null default '{}',
  allergy_notes text check(char_length(allergy_notes) <= 1000),
  meals_per_day text check(meals_per_day is null or meals_per_day in ('2','3','4','5','flexible')),
  liked_foods text[] not null default '{}',
  disliked_foods text[] not null default '{}',
  cooking_skill text,
  preparation_time_minutes integer check(preparation_time_minutes is null or preparation_time_minutes between 0 and 1440),
  weekly_food_budget numeric check(weekly_food_budget is null or weekly_food_budget >= 0),
  breakfast_time time,
  lunch_time time,
  dinner_time time,
  usual_training_time time,
  eats_before_training boolean,
  eats_after_training boolean,
  requires_professional_care boolean,
  professional_care_answer text check(professional_care_answer is null or professional_care_answer in ('no','yes','prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  estimated_calories_min integer check(estimated_calories_min is null or estimated_calories_min >= 0),
  estimated_calories_max integer check(estimated_calories_max is null or estimated_calories_max >= estimated_calories_min),
  estimated_protein_min_g numeric check(estimated_protein_min_g is null or estimated_protein_min_g >= 0),
  estimated_protein_max_g numeric check(estimated_protein_max_g is null or estimated_protein_max_g >= estimated_protein_min_g),
  estimated_carbs_min_g numeric check(estimated_carbs_min_g is null or estimated_carbs_min_g >= 0),
  estimated_carbs_max_g numeric check(estimated_carbs_max_g is null or estimated_carbs_max_g >= estimated_carbs_min_g),
  estimated_fat_min_g numeric check(estimated_fat_min_g is null or estimated_fat_min_g >= 0),
  estimated_fat_max_g numeric check(estimated_fat_max_g is null or estimated_fat_max_g >= estimated_fat_min_g),
  water_target_ml integer check(water_target_ml is null or water_target_ml >= 0),
  calculation_version text,
  disclaimer text not null default 'Estimated nutrition guidance only. PSFIT does not replace medical or professional nutrition care.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.initial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  training_plan jsonb,
  nutrition_guidance jsonb,
  first_recommendation text,
  dashboard_config jsonb not null default '{}'::jsonb,
  generation_version text not null default 'onboarding-v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists training_preferences_user_idx on public.training_preferences(user_id);
create index if not exists nutrition_preferences_user_idx on public.nutrition_preferences(user_id);
create index if not exists nutrition_targets_user_idx on public.nutrition_targets(user_id);
create index if not exists profiles_onboarding_idx on public.profiles(onboarding_completed,onboarding_step);
drop trigger if exists training_preferences_updated_at on public.training_preferences;
create trigger training_preferences_updated_at before update on public.training_preferences for each row execute function public.set_updated_at();
drop trigger if exists nutrition_preferences_updated_at on public.nutrition_preferences;
create trigger nutrition_preferences_updated_at before update on public.nutrition_preferences for each row execute function public.set_updated_at();
drop trigger if exists nutrition_targets_updated_at on public.nutrition_targets;
create trigger nutrition_targets_updated_at before update on public.nutrition_targets for each row execute function public.set_updated_at();
drop trigger if exists initial_plans_updated_at on public.initial_plans;
create trigger initial_plans_updated_at before update on public.initial_plans for each row execute function public.set_updated_at();

create or replace function public.normalize_psfit_username(candidate text) returns text
language sql immutable set search_path='' as $$
  select lower(trim(candidate))
$$;
create or replace function public.is_valid_psfit_username(candidate text) returns boolean
language sql immutable set search_path='' as $$
  select candidate is not null
    and char_length(public.normalize_psfit_username(candidate)) between 3 and 30
    and public.normalize_psfit_username(candidate) ~ '^[a-z0-9_]+([.][a-z0-9_]+)*$'
    and public.normalize_psfit_username(candidate) not in (
      'admin','administrator','support','help','psfit','official','settings','login',
      'signup','api','community','dashboard','explore','activity','notifications','security'
    )
$$;
create or replace function public.check_username_availability(candidate text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.is_valid_psfit_username(candidate)
    and not exists(
      select 1 from public.profiles
      where lower(username)=public.normalize_psfit_username(candidate)
      and id is distinct from auth.uid()
    )
$$;
create or replace function public.set_my_username(candidate text) returns text
language plpgsql security definer set search_path='' as $$
declare normalized text:=public.normalize_psfit_username(candidate);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_valid_psfit_username(normalized) then raise exception 'Invalid nickname'; end if;
  if exists(select 1 from public.profiles where lower(username)=normalized and id<>auth.uid()) then raise exception 'Nickname unavailable'; end if;
  update public.profiles set username=normalized,onboarding_step='personalization' where id=auth.uid();
  if not found then raise exception 'Profile not found'; end if;
  return normalized;
end $$;

create or replace function public.handle_new_psfit_user() returns trigger
language plpgsql security definer set search_path='' as $$
declare full_name_value text:=nullif(trim(coalesce(new.raw_user_meta_data->>'full_name','')),'');
begin
  insert into public.profiles(id,full_name,first_name,username,onboarding_step,onboarding_completed)
  values(
    new.id,
    full_name_value,
    nullif(split_part(full_name_value,' ',1),''),
    null,
    'nickname',
    false
  )
  on conflict(id) do update set
    full_name=coalesce(excluded.full_name,public.profiles.full_name),
    first_name=coalesce(excluded.first_name,public.profiles.first_name),
    username=case when public.profiles.onboarding_completed then public.profiles.username else null end,
    onboarding_step=case when public.profiles.onboarding_completed then public.profiles.onboarding_step else 'nickname' end;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_psfit_user();
insert into public.profiles(id,full_name,first_name,username,onboarding_step,onboarding_completed)
select u.id,nullif(trim(coalesce(u.raw_user_meta_data->>'full_name','')),''),nullif(split_part(trim(coalesce(u.raw_user_meta_data->>'full_name','')),' ',1),''),null,'nickname',false
from auth.users u
where not exists(select 1 from public.profiles p where p.id=u.id);

alter table public.training_preferences enable row level security;
alter table public.nutrition_preferences enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.initial_plans enable row level security;
create policy "own training preferences select" on public.training_preferences for select to authenticated using(user_id=auth.uid());
create policy "own training preferences insert" on public.training_preferences for insert to authenticated with check(user_id=auth.uid());
create policy "own training preferences update" on public.training_preferences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own training preferences delete" on public.training_preferences for delete to authenticated using(user_id=auth.uid());
create policy "own nutrition preferences select" on public.nutrition_preferences for select to authenticated using(user_id=auth.uid());
create policy "own nutrition preferences insert" on public.nutrition_preferences for insert to authenticated with check(user_id=auth.uid());
create policy "own nutrition preferences update" on public.nutrition_preferences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own nutrition preferences delete" on public.nutrition_preferences for delete to authenticated using(user_id=auth.uid());
create policy "own nutrition targets select" on public.nutrition_targets for select to authenticated using(user_id=auth.uid());
create policy "own nutrition targets insert" on public.nutrition_targets for insert to authenticated with check(user_id=auth.uid());
create policy "own nutrition targets update" on public.nutrition_targets for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own nutrition targets delete" on public.nutrition_targets for delete to authenticated using(user_id=auth.uid());
create policy "own initial plans select" on public.initial_plans for select to authenticated using(user_id=auth.uid());
create policy "own initial plans insert" on public.initial_plans for insert to authenticated with check(user_id=auth.uid());
create policy "own initial plans update" on public.initial_plans for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own initial plans delete" on public.initial_plans for delete to authenticated using(user_id=auth.uid());

revoke all on function public.check_username_availability(text),public.set_my_username(text) from public;
grant execute on function public.check_username_availability(text),public.set_my_username(text) to authenticated;
