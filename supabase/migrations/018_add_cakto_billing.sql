alter table public.profiles
  add column if not exists payment_provider text,
  add column if not exists cakto_order_id text,
  add column if not exists cakto_offer_id text,
  add column if not exists cakto_subscription_id text,
  add column if not exists cakto_customer_email text,
  add column if not exists pro_ativado_em timestamptz;

alter table public.profiles
  drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'pro_mensal', 'pro_anual'));

create index if not exists profiles_cakto_order_id_idx
  on public.profiles (cakto_order_id)
  where cakto_order_id is not null;
create index if not exists profiles_cakto_subscription_id_idx
  on public.profiles (cakto_subscription_id)
  where cakto_subscription_id is not null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  order_id text,
  payload_hash text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.payment_webhook_events enable row level security;
revoke all on table public.payment_webhook_events from anon, authenticated;

create or replace function public.protect_profile_billing_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated' and (
    new.plan is distinct from old.plan
    or new.plan_status is distinct from old.plan_status
    or new.payment_provider is distinct from old.payment_provider
    or new.cakto_order_id is distinct from old.cakto_order_id
    or new.cakto_offer_id is distinct from old.cakto_offer_id
    or new.cakto_subscription_id is distinct from old.cakto_subscription_id
    or new.cakto_customer_email is distinct from old.cakto_customer_email
    or new.pro_ativado_em is distinct from old.pro_ativado_em
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
