alter table public.recovery_checkins
  add column if not exists has_pain boolean not null default false;

notify pgrst, 'reload schema';
