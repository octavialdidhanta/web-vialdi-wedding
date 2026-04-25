-- Add spent budget range fields for agency packages (Paket Ads).

alter table public.agency_packages
  add column if not exists spent_budget_min numeric,
  add column if not exists spent_budget_max numeric,
  add column if not exists spent_budget_currency text not null default 'IDR',
  add column if not exists spent_budget_period text not null default 'per bulan';

create index if not exists idx_agency_packages_spent_range
  on public.agency_packages (spent_budget_min, spent_budget_max);

