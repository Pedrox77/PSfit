create or replace function public.set_my_username(candidate text) returns text
language plpgsql security definer set search_path='' as $$
declare
  normalized text := public.normalize_psfit_username(candidate);
  full_name_value text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select nullif(trim(coalesce(raw_user_meta_data->>'full_name', '')), '')
    into full_name_value
  from auth.users
  where id = auth.uid();

  insert into public.profiles(
    id, full_name, first_name, username,
    onboarding_step, onboarding_completed
  )
  values(
    auth.uid(),
    full_name_value,
    nullif(split_part(full_name_value, ' ', 1), ''),
    null,
    'nickname',
    false
  )
  on conflict(id) do nothing;

  if not public.is_valid_psfit_username(normalized) then
    raise exception 'USERNAME_INVALID';
  end if;
  if exists(
    select 1 from public.profiles
    where lower(username) = normalized and id <> auth.uid()
  ) then
    raise exception 'USERNAME_TAKEN';
  end if;

  update public.profiles
  set username = normalized, onboarding_step = 'personalization'
  where id = auth.uid();

  return normalized;
end
$$;

revoke all on function public.set_my_username(text) from public;
grant execute on function public.set_my_username(text) to authenticated;
