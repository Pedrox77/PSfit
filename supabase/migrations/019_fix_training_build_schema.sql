-- Production-safe reconciliation for training fields used by the application.
alter table public.workouts
  add column if not exists name_key text,
  add column if not exists focus_key text;

alter table public.exercises
  add column if not exists name_key text;

alter table public.training_preferences
  drop constraint if exists training_preferences_session_duration_minutes_check;
alter table public.training_preferences
  add constraint training_preferences_session_duration_minutes_check
  check (
    session_duration_minutes is null
    or session_duration_minutes in (20, 30, 45, 60, 75, 90)
  );

-- Older environments created this column as text. Convert known period values
-- and valid clock values before enforcing the actual time type.
do $$
declare
  preferred_time_type text;
begin
  select data_type
    into preferred_time_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'training_preferences'
    and column_name = 'preferred_time';

  if preferred_time_type is not null
     and preferred_time_type not in ('time without time zone', 'time with time zone') then
    alter table public.training_preferences
      alter column preferred_time type time without time zone
      using (
        case
          when preferred_time is null or btrim(preferred_time::text) in ('', 'flexible') then null
          when btrim(preferred_time::text) = 'morning' then time '08:00'
          when btrim(preferred_time::text) = 'afternoon' then time '15:00'
          when btrim(preferred_time::text) = 'evening' then time '19:00'
          when btrim(preferred_time::text) ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
            then btrim(preferred_time::text)::time
          else null
        end
      );
  end if;
end
$$;

notify pgrst, 'reload schema';
