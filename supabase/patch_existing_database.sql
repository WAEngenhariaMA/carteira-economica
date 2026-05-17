-- Safe patch for Supabase projects created before the profile settings screen.
-- Run this once in Supabase SQL Editor if your tables already exist.

alter table if exists public.financial_profiles
  add column if not exists monthly_income_target numeric(14,2) not null default 0,
  add column if not exists current_reserve numeric(14,2) not null default 0,
  add column if not exists reserve_target numeric(14,2) not null default 0,
  add column if not exists ideal_income numeric(14,2) not null default 0,
  add column if not exists risk_tolerance text not null default 'medium',
  add column if not exists preferred_rule text not null default '70-10-20',
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.installments
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists purchase_date date,
  add column if not exists total_amount numeric(14,2),
  add column if not exists down_payment numeric(14,2) not null default 0;
