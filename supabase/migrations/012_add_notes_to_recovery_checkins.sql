alter table public.recovery_checkins
  add column if not exists notes text;

notify pgrst, 'reload schema';
