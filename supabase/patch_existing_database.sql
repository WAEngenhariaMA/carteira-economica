-- Safe patch for Supabase projects created before the profile settings screen.
-- Run this once in Supabase SQL Editor if your tables already exist.

do $$
begin
  if exists (
    select 1
    from pg_type type_info
    join pg_namespace namespace_info on namespace_info.oid = type_info.typnamespace
    where namespace_info.nspname = 'public'
      and type_info.typname = 'payment_rail_type'
  ) then
    alter type public.payment_rail_type add value if not exists 'loan';
  end if;
end $$;

alter table if exists public.financial_profiles
  add column if not exists monthly_income_target numeric(14,2) not null default 0,
  add column if not exists current_reserve numeric(14,2) not null default 0,
  add column if not exists reserve_target numeric(14,2) not null default 0,
  add column if not exists ideal_income numeric(14,2) not null default 0,
  add column if not exists risk_tolerance text not null default 'medium',
  add column if not exists preferred_rule text not null default '70-10-20',
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.installments
  add column if not exists installment_source text not null default 'card',
  add column if not exists creditor text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists purchase_date date,
  add column if not exists total_amount numeric(14,2),
  add column if not exists down_payment numeric(14,2) not null default 0;

update public.installments
set installment_source = 'loan'
where card_id is null
  and (
    lower(coalesce(category, '')) like '%emprest%'
    or lower(coalesce(category, '')) like '%emprést%'
    or lower(coalesce(description, '')) like '%emprest%'
    or lower(coalesce(description, '')) like '%emprést%'
  );

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'installments'
  )
  and not exists (
    select 1
    from pg_constraint
    where conname = 'installments_source_check'
  ) then
    alter table public.installments
      add constraint installments_source_check check (installment_source in ('card', 'loan'));
  end if;
end $$;
