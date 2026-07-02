alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists plan_status text not null default 'inactive',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists stripe_cancel_at_period_end boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro'));

alter table public.profiles
  drop constraint if exists profiles_plan_status_check;
alter table public.profiles
  add constraint profiles_plan_status_check
  check (plan_status in (
    'inactive', 'incomplete', 'incomplete_expired', 'trialing',
    'active', 'past_due', 'canceled', 'unpaid', 'paused'
  ));

create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists profiles_stripe_subscription_id_unique
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events
  from anon, authenticated;

create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated' and (
    new.plan is distinct from old.plan
    or new.plan_status is distinct from old.plan_status
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.stripe_price_id is distinct from old.stripe_price_id
    or new.stripe_current_period_end is distinct from old.stripe_current_period_end
    or new.stripe_cancel_at_period_end is distinct from old.stripe_cancel_at_period_end
  ) then
    raise exception 'Billing fields are server-managed'
      using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists profiles_protect_billing_fields
  on public.profiles;
create trigger profiles_protect_billing_fields
before update on public.profiles
for each row execute function public.protect_profile_billing_fields();
