create extension if not exists "uuid-ossp";

create type transaction_type as enum ('income', 'expense');
create type essentiality_type as enum ('essential', 'important', 'adjustable', 'superfluous', 'impulsive');
create type payment_rail_type as enum ('bank', 'card', 'cash', 'loan');
create type risk_level_type as enum ('excellent', 'healthy', 'attention', 'risk', 'critical', 'emergency');
create type action_status_type as enum ('planned', 'running', 'done');

create table if not exists public.financial_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  owner_name text not null,
  household_name text not null,
  monthly_income_target numeric(14,2) not null default 0,
  current_reserve numeric(14,2) not null default 0,
  reserve_target numeric(14,2) not null default 0,
  ideal_income numeric(14,2) not null default 0,
  risk_tolerance text not null default 'medium',
  preferred_rule text not null default '70-10-20',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category_type text not null default 'expense',
  parent_id uuid references public.categories(id) on delete cascade,
  parent_name text,
  default_essentiality essentiality_type not null default 'important',
  color text not null default '#0f766e',
  icon text not null default 'Tag',
  monthly_limit numeric(14,2) not null default 0,
  keywords text[] not null default '{}',
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  bank text not null,
  name text not null,
  limit_amount numeric(14,2) not null default 0,
  due_day int not null,
  closing_day int not null,
  interest_rate_month numeric(8,4) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  transaction_date date not null,
  competence text not null,
  description text not null,
  amount numeric(14,2) not null,
  type transaction_type not null,
  category text not null,
  subcategory text,
  essentiality essentiality_type not null default 'important',
  recurring boolean not null default false,
  fixed boolean not null default false,
  payment_rail payment_rail_type not null default 'bank',
  bank text,
  installment int,
  total_installments int,
  status text not null default 'open',
  priority text not null default 'adjustable',
  impact text not null default 'medium',
  origin text not null default 'manual',
  observations text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  card_id uuid references public.cards(id) on delete cascade,
  competence text not null,
  due_date date not null,
  closing_date date,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.installments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  card_id uuid references public.cards(id) on delete set null,
  installment_source text not null default 'card' check (installment_source in ('card', 'loan')),
  creditor text,
  description text,
  category text,
  purchase_date date,
  total_amount numeric(14,2),
  down_payment numeric(14,2) not null default 0,
  competence text not null,
  installment_number int not null,
  total_installments int not null,
  amount numeric(14,2) not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  creditor text not null,
  debt_type text not null,
  balance numeric(14,2) not null default 0,
  monthly_payment numeric(14,2) not null default 0,
  interest_rate_month numeric(8,4) not null default 0,
  months_left int not null default 0,
  renegotiable boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  investment_type text not null,
  amount numeric(14,2) not null default 0,
  liquidity_days int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target numeric(14,2) not null,
  current numeric(14,2) not null default 0,
  deadline date,
  priority text not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text not null,
  source_type text not null,
  column_mapping jsonb not null default '{}'::jsonb,
  status text not null default 'pending_validation',
  rows_total int not null default 0,
  rows_imported int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  competence text not null,
  health_score int not null,
  risk_level risk_level_type not null,
  summary jsonb not null,
  findings jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  level risk_level_type not null,
  source text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.action_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  reason text not null,
  priority text not null,
  horizon text not null,
  expected_savings numeric(14,2) not null default 0,
  difficulty text not null default 'media',
  status action_status_type not null default 'planned',
  start_date date,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  assumptions jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  competence text not null,
  report_type text not null default 'executive_pdf',
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  entity_table text not null,
  entity_id uuid,
  operation text not null,
  previous_value jsonb,
  new_value jsonb,
  origin text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  function_name text not null,
  input_hash text,
  prompt_version text,
  result jsonb,
  tokens_in int,
  tokens_out int,
  status text not null default 'success',
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.data_quality_issues (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  transaction_id uuid references public.transactions(id) on delete cascade,
  field text not null,
  message text not null,
  severity text not null default 'warning',
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.classification_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete cascade,
  suggested_category text,
  suggested_essentiality essentiality_type,
  accepted_category text,
  accepted_essentiality essentiality_type,
  reviewed_by_user boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.financial_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.cards enable row level security;
alter table public.transactions enable row level security;
alter table public.invoices enable row level security;
alter table public.installments enable row level security;
alter table public.debts enable row level security;
alter table public.investments enable row level security;
alter table public.goals enable row level security;
alter table public.import_batches enable row level security;
alter table public.diagnostics enable row level security;
alter table public.alerts enable row level security;
alter table public.action_plans enable row level security;
alter table public.simulations enable row level security;
alter table public.generated_reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.ai_logs enable row level security;
alter table public.data_quality_issues enable row level security;
alter table public.classification_reviews enable row level security;

create policy "users manage own financial profiles" on public.financial_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own cards" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own installments" on public.installments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own debts" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own investments" on public.investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own imports" on public.import_batches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own diagnostics" on public.diagnostics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own action plans" on public.action_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own simulations" on public.simulations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own generated reports" on public.generated_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users read own audit logs" on public.audit_logs
  for select using (auth.uid() = user_id);

create policy "users manage own ai logs" on public.ai_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own data quality issues" on public.data_quality_issues
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users manage own classification reviews" on public.classification_reviews
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_transactions_user_competence on public.transactions(user_id, competence);
create index if not exists idx_transactions_user_card_competence on public.transactions(user_id, card_id, competence);
create index if not exists idx_invoices_user_competence on public.invoices(user_id, competence);
create index if not exists idx_installments_user_competence on public.installments(user_id, competence);
create index if not exists idx_cards_user_active on public.cards(user_id, active);
create index if not exists idx_action_plans_user_status on public.action_plans(user_id, status);
create index if not exists idx_diagnostics_user_competence on public.diagnostics(user_id, competence);
create index if not exists idx_import_batches_user_created on public.import_batches(user_id, created_at desc);
create index if not exists idx_quality_user_unresolved on public.data_quality_issues(user_id, severity) where resolved_at is null;
